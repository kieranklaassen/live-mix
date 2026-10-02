---
'@kieranklaassen/live-mix': patch
---

A track can loop at a length of its own, so loops of unequal length slide against each other.

- `Transport.elapsed()`: how far the timeline has run since its origin, in timeline seconds, with every pass of the loop counted in. A pause keeps it, a `seek` moves it by as much as the position, `stop()` puts it back to 0. `seekElapsed(sec)` goes to a point on the whole run and `contextTimeAtElapsed(sec)` says when one is reached. `Math.floor(elapsed() / loop.lengthSec)` is a count of passes that survives a pause and a seek.
- `Cycle`: a loop of any length on the transport's timeline (`elapsed() % lengthSec`), as a `Timebase`, the slice of `Transport` the scheduler and the lane writers read. Its passes are numbered and never reused, like the transport's.
- `AudioTrack.loopLengthSec` (and the `loopLengthSec` option of `addAudioTrack`): the track repeats its clips at that length whether or not the transport loops. Set while playing, the track moves over at once: what sounds fades out over 5 ms and the clips its loop now stands inside are entered there. `null` follows the transport's loop.
- `Schedulable.timebase`: the clock a schedulable's clips are placed on. The scheduler runs each one on its own clock (windows, catch-up, entering what is under the position, `rejoin`) and moves it over when the clock is swapped or its length changes. `Scheduler.transport` is now readable.
- `Automation.add(lane, param, { timebase })`: a lane on a clock of its own.
- Score: `loopLengthSec` on an audio track (optional; a stretch track has none) and the `track.loop` operation, undoable and in the agent's tools. The renderer gives the track its loop and puts the lanes on its strip, inserts and device on it too.
- A transport loop made shorter than where the position is folds it, and `elapsed()` with it. What sounds is still left to sound, as on any loop change, and the scheduler now enters the clips the transport and each cycle have landed inside, on a schedulable that `joinsLate`, instead of waiting for their starts to come round.
- Fixed: a `LaneWriter` on a loop whose length a float cannot hold exactly (35.765 s, 25.9 s) never returned from the tick that reached the end of certain passes (the sixth at 35.765 s), which froze the page. A pass written to its end now hands over to the next pass's own start.
- With the counted pass: `setPass` takes `elapsed()` to that pass and `seekElapsed` lands on the pass its point is in, so the two count one run. `Timebase.passOf(iteration)` is the counted pass on any clock (`Cycle.passOf` counts the cycle's own passes from the origin), and a clip with a `chance` on a track with a loop of its own is drawn on that track's passes.
- `Cycle` is at the start of a pass, not the last instant of the one before, at a point of the run where its lengths add up to one in floats only nearly (29 lengths of 35.765 s).
- With `Transport.rescale`: the stretch takes `elapsed()` with it, and a track whose `loopLengthSec` is stretched in the same `Scheduler.rescale` keeps its place in its own pass and what it has sounding.
- A schedulable moved onto another clock, or landed somewhere by a folded loop, also enters a clip that runs over the loop's end and is in its tail there, under the pass it began on and with that pass's chance. Not on a clock's first counted pass: nothing began before the origin of the run.
- `Transport.seekElapsed` to a whole number of loop lengths a float cannot hold exactly lands on the start of the pass they open, as a `Cycle` of that length does, not on the last instant of the pass before.
- `ModTarget.timebase`: the clock a lane base is read on. The score renderer gives a lane under modulation its track's own loop, so a modulated swell on a track with `loopLengthSec` comes round with its clips.
- A start or a seek that lands in the tail of a clip running over the loop's end enters it there too, on the transport and on a cycle, under the pass it began on. It used to be silent until the clip's start came round.
