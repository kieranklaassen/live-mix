---
'@kieranklaassen/live-mix': minor
---

What is under the playhead sounds. Until now the `Scheduler` only handed over clips whose start fell inside the lookahead window, so pressing Play in the middle of a clip, or seeking into one while playing, left that clip silent until its start came round again (in ambient-live: up to a whole 32-second pass).

- A schedulable can say it `joinsLate` (`AudioTrack` and `StretchTrack` playback and `SampleRetainer` do). On the first pass after a `start` or a `seek` it is also handed every clip the anchor is already inside, with the clock time that clip's start had, and enters it partway. `Schedulable.schedule` gets a third argument, `joining`, for that case; `AudioTrack` then eases the voice in over `JOIN_EASE_SECONDS` (5 ms) through the new `ClipVoiceOptions.easeInSec`, because there is no silence before a join to hide a cut. Equal-power clips are not entered partway.
- A start such a schedulable declined (the sample had not decoded) is no longer lost once the window has moved past it: it is offered again, as a join, until it is taken or its clip is over. That is what `schedule`'s contract already promised.
- `Scheduler.rejoin(clipIds, fadeSec?)` puts clips back in step with the transport after an edit: what they have sounding fades out (`REJOIN_FADE_SECONDS`, through `Schedulable.cancel(key, fadeSec)` and the new `AudioTrack.release`), and each one the position is inside is entered again as it now is. A host calls it for the clips an edit touched; `refresh()` still only keeps what sounds and waits for starts, with one addition: a sounding clip cut short of where the transport is now fades out. A sounding clip that could not come back at once is left as it sounds: a schedulable says so with the optional `Schedulable.keeps(key)`, which `AudioTrack` answers for equal-power clips and `StretchTrack` for every sounding voice (its source takes time to build).
- A handover is remembered until its clip is over, not until the pass changes, on a schedulable that `joinsLate`. So after a loop change (which gives the transport a new pass number), or over the loop's end, `rejoin` and `refresh` still find what is sounding: `rejoin` lets the old voice go instead of starting a second one beside it, and enters a clip heard from the pass before under the start it had.
- `clipsSoundingAt(clips, positionSec)` and the `WindowClip` type are exported; a schedulable's clips may carry `durationSec`.

An offline render that starts partway into a score now includes the clips already in progress there.
