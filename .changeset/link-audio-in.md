---
'@kieranklaassen/live-mix': patch
---

Receiving Link Audio: a channel another Link program sends comes out of a node, on the beat.

- `LinkAudioReceiver` (`./native`): `create(context, client, link, { channel })` with the `id` of an entry of `link.state.channels`; connect `output` (stereo) where a microphone would go. It plays every sample a fixed delay after the moment it was heard at the sender, `delaySec`, which it settles on from how late the first quarter second of blocks arrive (`onDelay`), grows when blocks keep coming too late, and never shrinks; `delayMs` holds a figure of your own. A recording of `output` belongs `delaySec` earlier. A channel at another sample rate, or from a device whose clock runs a little apart, is read between its samples at the speed that keeps it on its moments. `onStats` reports blocks that arrived, were lost and were missed.
- New worklet bundles `worklets/link-source.js` (the playout) and `worklets/link-receive.js` (the intake worker).
- Host: the `/link-audio-in?channel=…` path writes a peer's channel to the page as it arrives, each block stamped with when its first frame was heard at the sender and the sender's count of it; `hello` gains `linkAudioReceive`. A host built before this closes that path, and `LinkAudioReceiver.create` says the host is too old.
- `NativeHostClient.linkAudioInUrl`, `NativeHostInfo.linkAudioReceive`, `encodeLinkAudioInBlock` for a test host; `FakePluginHost` says `linkAudioReceive`.
- `link.state.channels` holds the channels of the session's other peers; this program's own were never in it, and the documentation no longer says they are.

Checked against a second peer that is Ableton's library, on one machine: in the host's own tests, and in Chromium with a real `AudioContext` (a 44.1 kHz channel into a 48 kHz context, clicks within 0.04 ms of their beat). Not against Ableton Live, over a real network or by ear. See `docs/link.md`.
