---
'@kieranklaassen/live-mix': patch
---

Fixes from a sweep of the core for orders of events.

`Transport` tells its changes in the order they happened. A listener that moves the transport while it is being told of a change (the scheduler pausing a start at the end of a timeline whose loop is off) had its change told first to the listeners after it, so a host that keeps `change.state` was left showing "playing" on a paused transport. A change made inside a listener now waits until every listener has heard the one before it.

`Transport.setLoop` and `setPass` use one reading of the clock. They read it once for where the playhead is and once more to pin it there, and the position fell back by the time between the two. `setPass` before a start pinned ahead has been reached keeps that start where it was pinned; it began at once, as did a `start(at)` on a bar line still to come. `seek` and `seekElapsed` refuse a place that is not a finite number with a `RangeError`, where `seek(Infinity)` while looping and `seekElapsed(Infinity)` left the position `NaN` until the next stop.

`Performer` notes the beat and the clock it was counted on from one reading, so a loop change after a seek is no longer taken for a jump and a beat already told is not told again.

`AudioTrack.setRate` leaves a voice that has played out, and whose `ended` has not come yet, as it is. Moved to a slower rate, its end fell before the change: in the first seconds of an audio clock that is a time below zero, which a browser refuses with a `RangeError` out of `Transport.setRate`. Nothing that is heard changes.

`SampleStore`: a hold released after a `forget` or a `clear` lets go of nothing. It took one from a later hold on the same id, and with `evictOnRelease` evicted a sample still in use.

`MidiInput.close()` while `open()` is still waiting for access closes the input. The access that arrives later is not attached; before, the ports came up on an input that had been closed.

A name every object answers to (`constructor`, `toString`, `__proto__`) is a name like any other. `keyCodeLabel` returns such a key code as it is, where it returned a function. For a device parameter or a `score.setMeta` entry of such a name, `validateScore` with a registry reports the parameter as unknown, `ScoreRenderer.effectiveParams` leaves it out, and undo takes it away again, where it threw.

`Arbiter`: a timer that fires a moment before the clock says a hold has lapsed is set again, where a waiting write stayed waiting until the next write. A writer's own lock no longer carries it through another writer's hold on the same target. A waiting write that lands while its lane is still overridden (`automationResume: 'manual'`) reaches the graph.

A `ScoreRenderer` disposed while a render runs (`loadScore` again, `unloadScore`, the engine disposed) stops that render. It went on building: tracks and inserts were left in the engine, the next renderer failed with "already exists", and the render reported an error.
