---
'@kieranklaassen/live-mix': patch
---

Ableton Link and Link Audio, through the plug-in host.

A page cannot be a Link peer (Link is multicast UDP), so the host a desktop shell already runs for hosted plug-ins joins the session, using Ableton's own library (Link 4.1, pinned in `native/host/cmake/LiveMixLink.cmake`; `--no-link` builds without it).

- `NativeLink` (`./native`): the session as the page sees it. `set({ enabled, name, bpm, quantum, startStopSync, audio })`, `state` and `onChange` (peers, tempo, playing, Link Audio channels), `beatAt` and `localMsAtBeat` on the page's clock, `start(beat, { playing })` which answers when the beat falls (at once alone; on its place in the bar with peers), `followStart` and `stop` for start/stop sync.
- `OutputClock`, `LinkClockOffset` and the beat arithmetic (`linkBeatAt`, `linkPhase`, `nextBeatInPhase`): from a session beat to an `AudioContext` time.
- `LinkAudioSender`: connect a node to its `input` and the session gets a Link Audio channel, stamped with the beat each block is heard at. New worklet bundles `worklets/link-tap.js` and `worklets/link-audio.js`.
- `Transport.nudge(deltaSec)`: slides a playing transport by a few milliseconds without re-pinning it, for following an outside clock.
- A tempo change that keeps clips on their beat: `Transport.rescale(ratio)` stretches the position and the loop, `Scheduler.retime(apply)` takes starts already handed over along to their clips' new positions (`Schedulable.rekey`, which `AudioTrack` has) so sounding clips play on, and `ScoreRenderer.stretchTimeline(ratio)` does both for the next edit of a score document.
- Host protocol: `link`, `linkPing`, `linkStart`, `linkStop`, the `link` event, the `/link-audio` path; `hello` gains `link` and `linkVersion`.
- `FakePluginHost` in `./testing` answers the Link messages, with `host.link` (`FakeLinkSession`) to move the session by hand.
- `buildPluginHost({ link, linkDir })` and `pluginHostLinkPeerPath` in `./native/shell`.

Checked on Linux and macOS against a second peer that is Ableton's library (in the host's own tests and, on Linux, in Chromium with a real `AudioContext`); not against Ableton Live or over a real network. A host built with Link is covered by Link's GPL. See `docs/link.md`.
