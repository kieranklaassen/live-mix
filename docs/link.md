# Ableton Link and Link Audio (`./native`)

[Ableton Link](https://www.ableton.com/link/) keeps the tempo, the beat and
(optionally) start and stop of every Link program on a local network together:
Live, hardware, phone apps, another copy of yours. Link Audio, part of the same
library since Link 4, carries audio between them on that beat grid, so a
program can show up in Live as a channel to record.

live-mix joins a Link session through the plug-in host
([native.md](./native.md)). The host is built with Ableton's own library, so
what goes over the network is their implementation, not a rewrite of the
protocol.

|                                      | Browser tab | Desktop shell with the plug-in host |
| ------------------------------------ | ----------- | ----------------------------------- |
| Tempo, beat and bar with the session | no          | yes                                 |
| Start/stop sync                      | no          | yes                                 |
| Sending audio to peers (Link Audio)  | no          | yes                                 |
| Receiving audio from peers           | no          | not yet (see [Limits](#limits))     |

**Why not in a browser tab.** Link peers find each other by multicast UDP
(`224.76.78.75:20808`) and talk over UDP after that. A page has no UDP: not
through `fetch`, WebSocket, WebRTC or WebTransport. Something outside the page
has to be the peer, and here that is the host a desktop shell already runs for
hosted plug-ins.

```
 page                                         plug-in host                network
 NativeLink ◄── JSON, …/control ──────────►  LinkSession  ◄── Link ───►  Live, other peers
   beat ⇄ performance.now() ⇄ AudioContext     (Ableton's library)
 LinkAudioSender
   tap worklet ─► pump worker ── float32, …/link-audio ──►  a Link Audio channel
```

## Joining a session

```ts
import { NativeHostClient, NativeLink } from '@kieranklaassen/live-mix/native'

const client = await NativeHostClient.connect(address) // as for hosted plug-ins
const link = await NativeLink.open(client)

if (link.available) {
  await link.set({ enabled: true, name: 'My app', bpm: 120 })
  link.onChange((state, previous) => {
    if (state.bpm !== previous.bpm) showTempo(state.bpm)
    if (state.peers !== previous.peers) showPeers(state.peers)
  })
}
```

`link.available` is false when the host was built without Link
(`--no-link`); every call is then a no-op that answers with an idle state, so
an application needs no second code path.

`link.state` is the session as the host last described it:

| Field            | Meaning                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| `enabled`        | In the session: finding peers and following them                           |
| `peers`          | Other programs in the session                                              |
| `bpm`            | The session's tempo. Setting it (`link.set({ bpm })`) moves every peer     |
| `quantum`        | Beats in the bar this program keeps its place in (default 4)               |
| `beat`, `micros` | This program's beat at one moment on the host's clock                      |
| `playing`        | The shared transport, between peers that have start/stop sync on           |
| `startStopSync`  | Whether this program shares start and stop                                 |
| `audio`          | Link Audio is on: channels are announced and listed                        |
| `channels`       | Every Link Audio channel in the session (`name`, `peerName`), ours as well |

Peers share the **tempo** and the **place in the bar** (the beat modulo the
quantum). They do not share the beat count: your beat 64 and Live's bar 9 can
be the same moment.

The host leaves the session when the last page that used Link disconnects.

## Where the beat is

A session is described as one beat at one moment on the host's clock. The page
has a different clock, so `NativeLink` measures how far apart the two are
(`linkPing` round trips over the loopback connection, a few to start and one a
second after; the shortest recent trip wins) and answers in page time:

```ts
link.beatAt() // the beat now
link.beatAt(performance.now() + 250) // a quarter second from now
link.localMsAtBeat(128) // when beat 128 falls, as a performance.now()
```

To schedule audio you need one more step, from page time to the
`AudioContext`'s clock. `OutputClock` does that with the browser's own pairing
of the two (`getOutputTimestamp`, so the output latency the browser knows about
is in it):

```ts
import { OutputClock } from '@kieranklaassen/live-mix/native'

const output = new OutputClock(audioContext)
setInterval(() => output.sample(), 100) // keep it current

const when = output.contextTimeAt(link.localMsAtBeat(128))
source.start(when) // heard on beat 128
```

## Starting in time

```ts
// Play: timeline beat 0 should fall on a bar line of the session.
const atMs = await link.start(0, { playing: true })
transport.start(output.contextTimeAt(atMs))
```

Alone in a session, the beat falls exactly when asked (now, by default). With
peers, it falls at the next moment that has the same place in the bar, so
nobody else's beat moves: asking for beat 0 means "start on the next bar
line". The answer is when that is. `playing: true` also tells peers with
start/stop sync that the transport started; `link.stop()` that it stopped.

When a peer starts the shared transport, `state.playing` turns true in
`onChange`. `await link.followStart(beat)` puts your `beat` where that start
falls for this program and answers when.

## Staying in time

An audio device and the system clock are two crystals; over minutes they drift
apart by milliseconds. A program that started on the beat stays on it by
comparing, a few times a second, where its transport is with where the session
says it should be, and sliding the transport by the difference:

```ts
const sessionBeat = link.beatAt(output.localMsAt(audioContext.currentTime))
const errorSec = (beatsOf(transport.position()) - sessionBeat) * (60 / link.state.bpm)
transport.nudge(-errorSec) // Transport.nudge slides a running transport
```

`Transport.nudge(deltaSec)` moves the position of a playing transport without
re-pinning it or telling listeners; clips already scheduled keep playing and
later ones start by the new position. Use it for corrections of a few
milliseconds. A large difference (a peer joined with a tempo of its own and
the session jumped) is a `seek`.

## When the tempo changes

Link has one tempo, and any peer can move it. What that means for clips on a
timeline is the application's choice. live-mix keeps time in seconds, so there
are two:

- **Clips keep their second.** Nothing to do but show the new tempo; the
  timeline no longer lines up with the session's bars.
- **Clips keep their beat.** The timeline is stretched: every `startSec` and
  the loop length are multiplied by `oldBpm / newBpm`, while each clip's audio
  plays at its own speed and pitch (as unwarped clips do in Live).

For the second, three calls keep a playing transport in its bar and keep what
is sounding sounding:

```ts
renderer.stretchTimeline(oldBpm / newBpm) // ScoreRenderer: announce the next edit
document.apply({ type: 'batch', ops: [loopLengthOp, ...clipStartOps] })
```

The renderer then stretches the transport with the clips
(`Transport.rescale`) and moves the clips under `Scheduler.retime`, which takes
every start already handed over along to its clip's new position. Without the
announcement the same edit is a loop change and a field of moved clips: the
transport lands in another bar and sounding clips are cut. Without a score
document, call `scheduler.retime(() => { transport.rescale(ratio); /* move the clips */ })`
yourself.

## Sending audio: Link Audio

```ts
import { LinkAudioSender } from '@kieranklaassen/live-mix/native'

await link.set({ audio: true })
const main = await LinkAudioSender.create(audioContext, client, link, { name: 'Main' })
engine.masterBus.output.connect(main.input)
```

Peers now see a channel `Main` from the peer called whatever `name` was set to
in `link.set`. Audio leaves the machine only while some peer listens to the
channel. Each block is stamped with the beat it is heard at here, so the
receiver can line it up with its own timeline.

- Mono or stereo (`channels: 1 | 2`), 16-bit on the wire (Link Audio's format),
  at the context's sample rate.
- `offsetMs` shifts when blocks are said to be heard, for an output the browser
  cannot see the latency of (a Bluetooth speaker).
- `main.onStatus` reports `open` and `closed`; `main.onStats` how many blocks
  went out and how many were dropped because the connection to the host was
  backed up.
- The tap worklet and the pump worker are `worklets/link-tap.js` and
  `worklets/link-audio.js` in the package. Unlike hosted plug-ins this path
  shares no memory, so it does not need a cross-origin isolated page.

## Limits

- **Desktop only**, for the reason at the top.
- **Sending only.** The host can announce channels and send; receiving a
  peer's channel into the page (`LinkAudioSource` in Ableton's library) is not
  wired up. The session's channels are listed in `state.channels`.
- **One tempo.** Link has no tempo map and no time signature: one tempo for
  everyone, and a quantum each peer picks for itself.
- **Timing rests on what the browser reports** about its output latency. Where
  that is wrong, tempo and bar still match and the sound is early or late by a
  constant; `offsetMs` on the sender and an offset in your own scheduling
  correct it.
- **Network.** Peers need to reach each other by multicast on the same
  network. Guest Wi-Fi, some VPNs and firewalls block it. On macOS the first
  use raises the system's "find devices on your local network" prompt for the
  application (the host's `Info.plist` carries the reason text).

## What has been checked, and where

In CI on Linux and macOS, against a second peer on the same machine that is
Ableton's library and nothing else (`native/host/test/link/LinkPeer.cpp`):

- `native/host/test/link.test.mjs`, the host over its protocol (both
  platforms): finds the peer; tempo both ways; both read the same place in the
  bar at the same moment; a start with peers waits for its place in the bar;
  start/stop both ways; a Link Audio channel is announced with its names, and
  impulses sent on beats 2 and 3 arrive at the peer on those beats; the host
  leaves the session when the page goes.
- `browser-tests/specs/native-link.spec.ts`, a page in Chromium with a real
  `AudioContext` (Linux): the same for tempo, bar and start/stop through
  `NativeLink`, and clicks scheduled on a beat with `OutputClock` reach the
  peer over Link Audio within a millisecond of that beat (0.01 to 0.15 ms
  measured).
- Unit tests for the clock arithmetic, `NativeLink` against `FakePluginHost`,
  the tap, the pump, the sender, and the timeline stretch.

Not checked: Ableton Live itself or any other real Link program, two machines
on a real network, a real audio output (the tests have none, so the latency a
browser reports was never compared with sound), and Windows.

## Testing an application without the host

`FakePluginHost` (`@kieranklaassen/live-mix/testing`) answers the Link
messages too, with a session a test moves by hand:

```ts
const host = new FakePluginHost()
const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
  createSocket: host.createSocket,
})
const link = await NativeLink.open(client, { syncIntervalMs: 0 })

host.link.peerJoins({ bpm: 96 }) // link.state.peers === 1, bpm 96
host.link.peerSetsTempo(110)
host.link.peerStarts() // with start/stop sync on: link.state.playing
```

`new FakePluginHost({ link: false })` is a host built without Link.

## The messages

On `/control`, next to the ones in [native.md](./native.md#the-protocol-version-1).
`hello` gains `link` (the host has Link) and `linkVersion`.

| Method      | Params                                                | Result                                                    |
| ----------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `link`      | any of `enabled name bpm quantum startStopSync audio` | the state (table above, plus `available`)                 |
| `linkPing`  |                                                       | `{ micros }`: the host's clock, answered without queueing |
| `linkStart` | `beat`, `atMicros?`, `playing?`, or `follow: true`    | the state, plus `atMicros`: when `beat` falls             |
| `linkStop`  | `atMicros?`                                           | the state                                                 |

A `link` event carries the state whenever it changes by more than time passing
(tempo, peers, start/stop, channels, the beat moving as a session is joined),
to every connection that has used Link.

`/link-audio?token=…&name=…` opens a Link Audio channel called `name` for as
long as the connection lives. Binary frames, little-endian: `uint32` type
(`3`), frames, channels (1 or 2), sample rate; `float64` host microseconds at
which the first frame is heard; then interleaved `float32` samples.

## Building

Link is part of the default host build: `native/host/cmake/LiveMixLink.cmake`
pins the release (`Link-4.1`) and fetches it, or uses a checkout given with
`--link <dir>` / `$LINK_DIR` (with its submodules). `--no-link`
(`-DLIVE_MIX_HOST_LINK=OFF`) builds the host without it.

## Licensing

Ableton Link is licensed under the GPL, version 2 or later, or under a
proprietary licence from Ableton. A host binary built with it falls under the
GPL as well as JUCE's terms ([native.md](./native.md#licensing)); JUCE's AGPLv3
and the GPL combine. To ship a closed-source build you need Ableton's Link
licence (and their [guidelines](https://ableton.github.io/link/) apply), or
build with `--no-link`. This package's JavaScript contains none of Link's
code. Link is a trademark of Ableton AG.
