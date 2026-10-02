# Hosted plug-ins: VST3 and Audio Units (`./native`)

A browser cannot load a VST3 or an Audio Unit. A desktop application can run a
small native program next to its page that does, and hand the page's audio to
it. This is that program (the **plug-in host**, `native/host`, built with JUCE)
and the entry that talks to it (`@kieranklaassen/live-mix/native`). A hosted
plug-in is a `Device` like the built-in ones: it sits in a strip's inserts or
on an instrument track, takes `setParam`, appears in the registry, is written
into a score and renders offline.

The same host is how a page joins an **Ableton Link** session and sends
**Link Audio**: that has its own guide, [link.md](./link.md).

This is U39 of the plan, the optional native tier (KD7, R35). Nothing in `.`,
`./dsp` or `./react` depends on it, and an application that stays in the
browser loses nothing by ignoring it.

```
 desktop shell (Electron, Tauri, ...)
 ├── starts ──────────────►  live-mix-plugin-host          (native/host, JUCE)
 │                             loads VST3 / AU, owns their editor windows
 └── page (cross-origin isolated)
       NativeHostClient  ◄── JSON, ws://127.0.0.1:<port>/control ──►  host
       NativeDevice
         worklet ─ shared memory ─ pump worker ◄── float32, .../audio ──►  host
```

## What you need

- **A desktop shell** that starts the host and tells the page where it
  listens. `@kieranklaassen/live-mix/native/shell` is the Node side of that
  (build, start, stop); ambient-live's `desktop/` is a complete Electron shell
  in about 250 lines.
- **A cross-origin isolated page.** The audio bridge shares memory between the
  audio thread and a worker, and a page only gets `SharedArrayBuffer` when it
  is served with `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Embedder-Policy: require-corp`. The worker's and the worklet's
  script responses need the `Cross-Origin-Embedder-Policy` header too. Check
  `crossOriginIsolated === true` in the page; `NativeDevice.create` throws a
  sentence that says so when it is not.
- **The host binary**, built once per machine (below). It is not in the npm
  package: the package carries its source.

## Building the host

```sh
node node_modules/@kieranklaassen/live-mix/native/host/build.mjs --out build/plugin-host
```

or, from this repository, `pnpm host:build` (which also builds the two test
plug-ins, into `tmp/plugin-host`). It needs CMake 3.22 or newer, a C++20
compiler and, on Linux, the X11 and ALSA development packages listed in
[`native/host/README.md`](../native/host/README.md). JUCE 9.0.2 comes from
`-DJUCE_DIR`, `$JUCE_DIR`, `~/JUCE` or is fetched at the pinned tag; the pin is
the same as kkfonie's, so one checkout serves both. The first build takes a few
minutes; later ones seconds.

Formats: VST3 everywhere, Audio Units on macOS as well.

From Node:

```js
import { buildPluginHost, pluginHostBinaryPath } from '@kieranklaassen/live-mix/native/shell'

const binary = buildPluginHost({ buildDir: 'build/plugin-host' }) // runs CMake
pluginHostBinaryPath('build/plugin-host') // where an earlier build put it
```

## The shell's side

```js
import { startPluginHost } from '@kieranklaassen/live-mix/native/shell'

const host = await startPluginHost({ binary, dataDir: join(userData, 'plugin-host') })
// hand { url: host.url, token: host.token } to the page, then on quit:
await host.stop()
```

`startPluginHost` waits for the line the host prints when it is ready
(`{"ready":true,"protocol":1,"port":…,"token":"…"}`) and resolves with the
address. The host picks a free port on the loopback interface and makes a
random token unless you pass `port` and `token`. It keeps the list of scanned
plug-ins in `dataDir` (`plugins.xml`), so only the first scan is slow. It
exits by itself when the process that started it goes away (its standard input
closes), so a crashed shell does not leave it behind.

The page finds the address in `globalThis.liveMixHost`, which is the name
`findNativeHost()` looks for. In Electron that is one line in a preload
script: `contextBridge.exposeInMainWorld('liveMixHost', { url, token })`.

## The page's side

```ts
import {
  NativeHostClient,
  findNativeHost,
  scanNativeDevices,
} from '@kieranklaassen/live-mix/native'

const address = findNativeHost() // null in a browser tab
const client = await NativeHostClient.connect(address)
await scanNativeDevices(client, { registry: engine.devices }) // registers what it finds

// From here on a plug-in is a registry device:
const reverb = await engine.devices.create('native:VST3-ValhallaVintageVerb-…', context)
engine.master.addInsert(reverb)
```

`client.plugins()` returns the list the host already knows without scanning;
`client.scan({ paths, defaultPaths, rescan, idle, timeout, perProcess })` searches the format's
standard folders (and `paths`), reports each file on `scanProgress`, and
answers with `{ plugins, failed, crashed, names }`. With `defaultPaths: false`
only `paths` are searched, and Audio Units are left out: the system lists
them, not a folder.

A scan runs outside the host, in a second process the host starts for it. A
plug-in that crashes while it is scanned ends that process and not the host:
the scan leaves the plug-in out and goes on with the rest. So does a plug-in
that keeps the scan waiting for `idle` seconds without using the processor
(10 unless you say: it waits for something that never comes), and one that
takes longer than `timeout` seconds in all (120). What a scan left out is in
`crashed`, and later scans do not try it again; `rescan: true` forgets that
along with the list. `names` has what to call each entry of `failed` and
`crashed`: an Audio Unit is listed by a code, not a file.

One scan process takes `perProcess` plug-ins (40) and the next carries on
where it stopped, because plug-ins leave threads and memory behind in the
process that loaded them and enough of them end it. A crash after other
plug-ins in the same process may be their doing, so that plug-in gets a
process to itself before it is left out.

The list is saved while the scan runs, so a host that is quit half way does
not start from nothing: `client.info.scanUnfinished` is true on the next
start, `client.plugins()` has what was found until then, and another scan
carries on from there.

`registerNativeDevices(client, plugins, { registry, defaults })` is the
registration without the scan. Each plug-in registers as:

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| `id`          | `native:<plug-in id>`; the plug-in id holds format, name and two hashes |
| `kind`        | `'native'`                                                              |
| `category`    | `'plugin'` (listed as "Plug-ins"), or `'instrument'` for an instrument  |
| `params`      | `{}` with `dynamicParams: true`: the table is only known once loaded    |
| `description` | `"VST3 plug-in by Valhalla DSP (Fx, Reverb)."`                          |

`NativeDevice.create(context, client, pluginId, options)` is the direct route
when there is no registry.

### Parameters

Every automatable parameter of the plug-in is a parameter of the device, named
`p<the plug-in's own parameter id>` (stable across sessions and versions of
the plug-in), in the plug-in's order. Values are normalised: a continuous
parameter is 0..1; a parameter with a few labelled steps is an integer choice
with the plug-in's labels in `spec.choices`. The plug-in's bypass switch is
left out, because the device's own `bypass` (a 5 ms crossfade to the dry
signal) replaces it.

`device.paramText(name)` is the plug-in's own wording of the current value
("2.4 s", "Plate"); `DevicePanel` shows it under the knob. A plug-in that
prints every digit of a float ("220.000000 Hz") is rounded to about three
figures (`tidyParamText`).

A plug-in can have hundreds of parameters. `device.panelParams` names the
first twelve (`panelParamCount`), which is what a generated panel shows;
automation, presets and scores reach all of them.

### The plug-in's own window

`device.hasEditor`, `openEditor()`, `closeEditor()`. The window belongs to the
host process, outside the page; `DevicePanel` shows an **Edit** button for any
device with `openEditor`. Changes made there come back on
`device.onEdit(({ name, value }) => …)`, and `device.onChange` fires as for
any other parameter change. `followNativeEdits(document, renderer)` writes
them into a score document so they are saved and can be undone, one undo step
per drag.

### State

`getState()` returns what the plug-in would put in its own preset file, as
base64; `setState(state)` or the `state` option of `create` restores it. Use it
for what parameters do not cover (a loaded sample, a mode without a knob).

The device remembers the state it last read, started from or was given, and
`setState` with that same text loads nothing and resolves `false`: a restore
pauses the plug-in's sound and puts every knob back where the state had it,
which is wrong for a state that was just read from the plug-in itself.
`device.onStateChange(listener)` fires when the state may have changed without
a parameter moving: the plug-in told its host so (a program picked, a file
loaded), or its window was closed. `device.editorOpen` says whether the window
is open. A hosted plug-in is a `StatefulDevice` (`isStatefulDevice(device)`),
the contract the score renderer uses.

### Instruments

An instrument takes `noteOn(noteId, frequency, gain)` and `noteOff(noteId)`
like every `NoteDevice`, sent as MIDI notes (the nearest note to the
frequency), and raw messages through `sendMidi(bytes)`.

## Latency

Audio goes out to another process and comes back, so a hosted plug-in adds
latency, and reports it: `device.latencySamples` is the bridge's latency plus
the plug-in's own, and the engine's delay compensation lines the other tracks
up with it.

The bridge's share is `bridgeLatencyFrames`. The worklet reads the answer for
the frames it wrote that long ago; an answer that is late plays as silence for
that block and counts in `device.underruns`. The default is
`bridgeLatencyFor(context)`: **the audio device's buffer plus 512 frames**
(640 frames on a 128-frame device, 1024 on a 512-frame one), because a
browser renders in bursts as long as the device buffer, and the bridge has to
cover one whole burst plus the trip. Measured in Chromium on a four-core Linux
machine with a 481-frame device buffer, over 20 to 60 s runs: 512 frames in
total gave 7 underruns in 30 s, 640 gave 3, 768 gave 0 to 2, and 1024 and above
gave none. The round trip itself averaged 0.5 ms, with a worst case of 4 to
14 ms.

Pass `latencyFrames` (a multiple of 128 from 128 to 8192) to trade safety for
tightness by hand. `device.onStats` reports round-trip times and underruns
once a second, which is how to judge a setting on a given machine.

## Offline rendering

A hosted plug-in renders in an `OfflineAudioContext`, so a bounce includes
it. An offline render runs as fast as it can and would leave the host behind,
so the devices on a context share one `OfflineBridgeClock`: it stops the
render every `bridgeLatencyFrames` (the smallest among them), waits until the
host has returned everything written so far, and lets it go on. The result is
exact (the browser test compares three chained instances against the dry
signal, sample for sample) and about fourteen times faster than real time for
one plug-in on the machine above.

Two rules follow from how a render is stopped:

- **One door for stops.** An `OfflineAudioContext` accepts one `suspend` per
  block and refuses a second. If the application also stops the render (to
  send a note at its time, say), it must go through `holdRenderAt(context,
timeSec, task)` from the main entry, which shares a block's stop with the
  clock. A direct `context.suspend` will collide sooner or later.
- **Make the device before `startRendering()`.** In an offline context
  `create` waits for the audio connection and joins the clock.

Notes for a hosted instrument, sent while the render is held at a block,
reach the plug-in as the first thing in that block: `sendMidi` waits for the
host to catch up, and `await device.notesDelivered()` inside the hold's task
keeps the render there until the note has gone. The same render gives the same
file every time.

## In a score

A hosted plug-in is a `ScoreDevice` like any other: `deviceId` is the registry
id, `params` holds the `p…` values. Three things are particular to it.

- **A plug-in that is not on this machine.** A score names a plug-in the
  registry does not have when it was written on another machine, or is opened
  in a browser tab. `registerMissingNativeDevices(score, registry)` registers
  a stand-in for each one (`unavailable: true`, named "… (not available)"):
  audio passes through, every parameter value is kept and handed back, and
  the score renders, saves and reloads unchanged. Call it after registering
  the plug-ins that are there and before loading the score. Pickers skip
  `unavailable` descriptors.
- **A plug-in that does not load.** A file removed since the scan, a plug-in
  that refuses the sample rate, a host that has gone: a registry-made plug-in
  that fails to load comes back as the same stand-in with a `notice` saying
  why, which `DevicePanel` shows in place of knobs. One bad plug-in costs that
  one device, not the render of the whole document. `defaults.onLoadError`
  hears about it. The stand-in takes notes and plays nothing, so an
  instrument track whose plug-in is missing or will not load stays in the
  document, silent, with its settings and state. `NativeDevice.create` called
  directly rejects instead.
- **Edits made in the plug-in's window.** `followNativeEdits(document,
renderer)`, above.
- **What no parameter shows.** A sampler's loaded instrument, a synth's
  program, a curve drawn in the plug-in's window live only in its state.
  `ScoreDevice.state` holds it (base64, opaque to everything but the
  plug-in), the renderer creates the plug-in from it with the `params` on top,
  and the stand-in for a missing plug-in keeps it untouched.
  `followNativeEdits` keeps it current: it reads the state when a plug-in
  first appears without one, half a second after the last change that came
  from the plug-in (`stateDelayMs`), when the plug-in says its state changed,
  when its window closes, and every five seconds while the window is open
  (`statePollMs`, for plug-ins that never say). Each read that differs goes
  into the document as `device.setState` **without an undo step**: keeping
  the state is not an edit of the person's, and undo does not put a plug-in's
  inside back. `{ state: false }` turns all of this off.
  `await captureNativeState(document, renderer)` reads every hosted plug-in
  now; call it before the document is saved for good, exported or closed, so
  what is written is each plug-in as it is at that moment.

## When the host goes away

`device.status` is `'connecting'`, `'running'` or `'stopped'`
(`device.onStatus`). An effect passes its input through dry while it is
connecting, and crossfades to the plug-in once the host's audio has arrived,
so putting one on a strip that is sounding leaves no hole. If the host crashes
or is quit, the device stops, passes its input through dry, and the client's
`close` event fires. Nothing
reconnects by itself: start the host again, connect a new client and make the
devices again.

## Limits

- Stereo in, stereo out on the plug-in's main bus (the host asks the plug-in
  for a stereo layout). No side-chain input, no extra output buses.
- MIDI goes to the plug-in; what a plug-in sends out is dropped.
- A plug-in's state is carried as it comes, in the document and in its
  operation log. A plug-in whose state is megabytes and reads differently
  every time grows the log while its window is open; `statePollMs: 0` leaves
  only the reads the plug-in or a closing window asks for. Undo does not
  restore a state: it puts parameters back, and a device that was replaced
  comes back as the document last knew it.
- The play head carries tempo and a running flag (`client.setTransport({ bpm,
playing })`), not a song position.
- The sample rate and largest block are fixed when the plug-in is loaded.
- Loaded plug-ins run inside the one host process: a plug-in that crashes
  while it plays takes the others down with it. Only the scan has a process
  of its own.
- Windows builds are untested.

## What has been checked, and where

| Check                                                                                   | Where it runs                                            |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| The client, the device, the bridge's ring and pump, the registry, scores, offline clock | `pnpm test` (mocks, `FakePluginHost`)                    |
| The host itself: protocol, scan, load, audio, state, MIDI, editor, shutdown             | `pnpm test:host` against the built binary (Linux, macOS) |
| Audio Unit hosting                                                                      | `pnpm test:host` on macOS, with Apple's own low-pass AU  |
| A real page: live at the reported latency, offline exact, instrument, host loss         | `browser-tests/specs/native-host.spec.ts` (Chromium)     |
| Third-party plug-ins (Dragonfly Reverb, MVerb and others, Linux VST3)                   | by hand, once                                            |

Not checked anywhere: commercial macOS plug-ins with copy protection, plug-in
windows on a real macOS desktop (the CI Mac has no person to look at them), a
signed or notarised host, and dropouts on real audio hardware at the default
buffer. Those need a person at a Mac.

## Testing an application without the host

`@kieranklaassen/live-mix/testing` has `FakePluginHost`: the control protocol
over a fake socket, with two plug-ins (`FAKE_REVERB`, `FAKE_SYNTH`) and a
record of what it was asked. It moves no audio.

```ts
const host = new FakePluginHost()
const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
  createSocket: host.createSocket,
})
registerNativeDevices(client, await client.plugins(), { registry })
host.emit('params', {
  slot: 's1',
  changes: [{ index: 0, value: 0.7, text: '7', origin: 'plugin' }],
})
```

## The protocol (version 1)

Two WebSocket paths on `ws://127.0.0.1:<port>`, both refused without
`?token=<token>`. The host listens on the loopback interface only.

### `/control?token=…`: JSON text frames

A request is `{ "id": 1, "method": "load", "params": { … } }`; its answer is
`{ "id": 1, "result": { … } }` or `{ "id": 1, "error": { "message": "…" } }`.
A request without `id` gets no answer. A frame with an `event` field is a
notification from the host. Closing the connection unloads every plug-in it
loaded.

| Method         | Params                                                             | Result                                |
| -------------- | ------------------------------------------------------------------ | ------------------------------------- |
| `hello`        |                                                                    | `NativeHostInfo` (protocol, formats)  |
| `plugins`      |                                                                    | `{ plugins }`, the cached list        |
| `scan`         | `{ paths?, defaultPaths?, rescan?, idle?, timeout?, perProcess? }` | `{ plugins, failed, crashed, names }` |
| `load`         | `{ plugin \| file, name?, sampleRate, blockSize, state? }`         | `NativeSlotInfo` (slot, params)       |
| `unload`       | `{ slot }`                                                         | `{}`                                  |
| `setParam`     | `{ slot, index, value }` (normalised; usually sent without `id`)   | `{}`                                  |
| `getParams`    | `{ slot }`                                                         | `{ params }`                          |
| `getState`     | `{ slot }`                                                         | `{ state }` (base64)                  |
| `setState`     | `{ slot, state }`                                                  | `{ params, latencySamples }`          |
| `showEditor`   | `{ slot }`                                                         | `{ showing }`                         |
| `hideEditor`   | `{ slot }`                                                         | `{}`                                  |
| `setTransport` | `{ bpm?, playing? }` (a field left out keeps its value)            | `{}`                                  |

| Event          | Fields                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scanProgress` | `format`, `file`, `name`, `progress` (0..1 within the format)                                                                                            |
| `params`       | `slot`, `changes: [{ index, value, text, origin }]`; `origin` is `client` (the echo of a `setParam`) or `plugin` (its editor, a preset, a state restore) |
| `latency`      | `slot`, `latencySamples`: the plug-in changed its latency                                                                                                |
| `editorClosed` | `slot`: the person closed the window                                                                                                                     |
| `stateChanged` | `slot`: the plug-in told its host its state changed in a way no parameter shows (a program, a loaded file); read it with `getState`                      |

The types are in `src/native/protocol.ts`. The Ableton Link messages (`link`,
`linkPing`, `linkStart`, `linkStop`, the `link` event and the `/link-audio`
path) are in [link.md](./link.md#the-messages).

### `/audio?token=…&slot=…&out=2`: binary frames

One connection per loaded plug-in. Every frame starts with four little-endian
unsigned 32-bit integers, `[type, frames, channels, sequence]`, 16 bytes.

- **Type 1, process.** The page sends `channels` × `frames` float32 samples,
  planar (all of channel 0, then channel 1); the host answers with a frame of
  the same shape and `sequence`, holding the plug-in's output. At most 512
  frames a block.
- **Type 2, MIDI.** `frames` holds the byte count; the bytes follow, padded to
  four. The message is applied at the start of the next block processed.

The connection closes when the plug-in is unloaded.

## Licensing

live-mix is MIT. The host is built with JUCE, which has its own terms: the
**host binary** you build falls under the AGPLv3, or under the JUCE licence
you hold if you have one. That concerns the binary and distributing it, not
this package's JavaScript, which contains no JUCE code. Read JUCE's licence
before you ship a build of the host to anyone. VST is a trademark of Steinberg
Media Technologies GmbH.

The default build also contains Ableton Link, which is GPL (version 2 or
later) unless you hold Ableton's proprietary licence; `--no-link` leaves it
out. See [link.md](./link.md#licensing).
