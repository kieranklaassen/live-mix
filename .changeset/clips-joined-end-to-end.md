---
'@kieranklaassen/live-mix': patch
---

A clip cut in two can sound as it did whole: `EngineOptions.joinClips` (and `AudioTrackOptions.joinClips`, `follows` and `followedBy` on `AudioTrack.play`). Off by default, and nothing a host plays changes until it asks.

A linear clip with no fade of its own is let in and out by itself: cut partway through its sound it tails for 5 ms past its end, and a clip entered partway on time starts at full level. Two clips of one sound laid end to end, the second playing on from where the first stops, were so not what one clip over both plays: for 5 ms the tail and the second clip summed to up to twice the level, a bump of up to 6 dB, and a clip that ended with its sound just before a clip that came up on it left a dip of 10 ms.

A track that joins its clips lets the two in and out as each other's mirror. The second comes up under the first one's tail, on the frames the tail reads. A first that ends with its sound tails on the frames the next clip enters on, where the sound comes round there, and the next comes up under it; it is left square only where its sound ends at rest and the next enters square. Clips are joined when they are of one source on that pass, play the same way round, have linear fades and none of their own at the join, touch on the timeline, and neither is muted or sat out of the pass by chance. The second comes up only under a tail the voice before it has: where play starts at or just before the cut, the first was stopped, or the second was put there while the first was sounding, it enters as it did.
