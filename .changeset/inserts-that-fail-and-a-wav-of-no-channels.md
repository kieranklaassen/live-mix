---
'@kieranklaassen/live-mix': patch
---

An insert that cannot be wired or was disposed first no longer silences its strip, and a WAV whose header names no channels is refused.

- `ChannelStrip.addInsert`, `Bus.addInsert`: the chain's tail was taken off what it fed before it was connected through the device. When one of those connects threw (a device of another context), the tail fed nothing: the track was silent, a bus listed the device all the same and lost its destination and its taps, and in a browser every later `addInsert` on the strip threw too. Both put the chain back as it was before they rethrow.
- `ChannelStrip.removeInsert`: a device disposed before it was taken out has let go of what it fed, and a browser's node throws when told to let go of a node it does not feed. The call stopped half done: the chain open at the device, the device still listed, every further `removeInsert` of it throwing. The chain is now closed around the device all the same.
- `readWavInfo`, `decodeWav`: a header that names 0 channels gave a frame of no bytes and a count of frames without end, and `decodeWav` then walked its frame loop for ever. Such a header (and one whose samples have 0 bits) is refused with an error, like a file that is not a WAV.
