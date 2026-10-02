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
