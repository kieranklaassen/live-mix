---
'@kieranklaassen/live-mix': patch
---

Two more places where a clip cut in two was not the clip, on a track that joins its clips (`joinClips`).

A first piece cut where its sound is at rest was left square whatever came after it. A piece after it that comes up by itself there (a piece of a looped sound, entered partway on a frame that is a step from silence) came up over 5 ms, so the two dipped to silence at the cut and back. The first now tails where the clip after it comes up on the frame its sound goes on to, and that clip comes up under the tail, as at any other join: the two are the sound, and each still stands by itself. A first cut at rest before a clip that enters square is left square, as it was. By hand the same holds for a voice played with `followedBy`.

A placed voice (`pan`, `lowpassHz` or `spaceDb`) keeps the channels of its sound on its low-pass (`channelCountMode: 'explicit'`). A source that has ended gives one channel of silence, and a browser's filter whose channels change starts again from nothing: a stereo voice lost what its low-pass still rang with, from the block of the render after the one it ended in. Two placed pieces of stereo noise, cut square on a block, were up to 33 dB under full scale apart from the whole in Chromium. They are now as near it as two pieces of a sound of one channel, which never lost its ring: 135 dB under full scale with the low-pass at 1000 Hz, 104 dB at 200 Hz, where the browser lets a filter go once its ring is under a sample of 16 bits (`browser-tests/specs/cut-pieces.spec.ts`).
