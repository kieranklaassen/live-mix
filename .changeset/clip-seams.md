---
'@kieranklaassen/live-mix': patch
---

A linear clip with no fade of its own no longer clicks where it starts or ends, and a looped sound that follows itself is still unbroken.

A clip with no fade-out used to end with a hard stop, and one with no fade-in to start at full level. For a sound that starts on its attack and dies away that is right. A sound made to loop starts and ends partway through a wave, so it stepped from silence onto its first frame and from its last to silence, and a clip cut partway through any sound stepped where it was cut: a click, on every pass when the clip ends where the loop does.

`AudioTrack` now looks at the sound (`clips/seam.ts`: `entersOnStep`, `leavesOnStep`, `comesRound`, a jump against the sound's own largest move in the 5 ms beside it) and, for a clip with no fade of its own at that end:

- **Cut partway through its sound**, where the cut is a step: the voice sounds on for 5 ms past the clip's end, fading, on what the sound goes on to (a tail). A cut within those 5 ms of the source's end tails as far as the source goes.
- **Ending where its sound does, on a sound made to loop** (it comes round on itself and starts partway through a wave): the same tail, on the start of the sound. A clip that does not loop has its source brought round for it.
- **Ending where its sound does, on a sound that just stops partway through a wave**: its last 5 ms fade.
- **Starting on a sound made to loop**: it comes up over 5 ms.

The tail and the come-up are each other's mirror, so a looped sound followed by itself (a clip the length of the loop when the loop comes round, two clips end to end) sums to the sound unbroken, as it was before, and followed by anything else it is a 5 ms crossfade. A sound that starts from rest is not touched at its start, a sound that has died away is not touched at its end, a clip's own fade is left as drawn, and a clip drawn longer than a sound that does not loop is left to run out as before. A rate change moves the tail with the clip's end. Equal-power clips are untouched.

A voice that starts on time from silence, by the come-up or by a fade-in of its own, is also silent from half a frame before its start: the source starts on the frame nearest its time and the level takes hold on the first frame after it, so about every other start sounded one frame at full level ahead of its fade.

`voice.endTime` is still the clip's end; the tail is past it. This replaces the ease-out over a cut clip's last 5 ms from #105: that left the next pass to start on a step, and made a dip where a tail makes a crossfade.

Measured in ambient-live with an 8 second harmonium loop across the piece, as the largest jump between frames against the sound's own largest (0.019): at the end of a one-shot export 0.073 before and 0.015 after, at the start of the file 0.076 and 0.013, where a 14 second piece comes round 0.078 and 0.015, where a 32 second piece (four repeats) comes round 0.015 both times.
