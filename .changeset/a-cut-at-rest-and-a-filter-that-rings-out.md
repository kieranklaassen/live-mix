---
'@kieranklaassen/live-mix': patch
---

Two more places where a clip cut in two was not the clip, on a track that joins its clips (`joinClips`).

A first piece cut where its sound is at rest has no tail and stops square. The piece after it went by what it would do alone: a piece of a looped sound, entered partway on a frame that is a step from silence, came up over 5 ms, so the two dipped to silence at the cut and back. It now goes straight on from the frame after the one the first stops on, at full level. It still comes up where nothing sounds before it: by itself, with play started at the cut, or after a first that fades out or was stopped. By hand the same holds for a voice played with `follows` after one played with `followedBy`.

A placed voice (`pan`, `lowpassHz` or `spaceDb`) keeps the channels of its sound on its low-pass (`channelCountMode: 'explicit'`). A source that has ended gives one channel of silence, and a browser's filter whose channels change starts again from nothing: a stereo voice that stopped square lost what its low-pass still rang with, from the next block of the render on. Two placed pieces of a stereo sound, cut on a block, were up to 33 dB under full scale apart from the whole in Chromium. They are now as near it as two pieces of a sound of one channel, which never lost its ring: 135 dB under full scale with the low-pass at 1000 Hz, 104 dB at 200 Hz, where the browser lets a filter go once its ring is under a sample of 16 bits (`browser-tests/specs/cut-pieces.spec.ts`).
