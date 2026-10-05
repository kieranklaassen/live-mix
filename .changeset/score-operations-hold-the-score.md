---
'@kieranklaassen/live-mix': patch
---

The score layer: operations that took what the validator refuses, and a renderer that stayed stuck after one device failed to load.

An operation the document takes has to leave a score `validateScore` accepts: the renderer validates every score it is handed and a saved piece is validated when it is read. These took something it refuses, so every render after threw and the piece, once saved, could not be read back. Each now fails with a `ScoreOperationError` and changes nothing.

- `apply`, `invert`: an operation whose `type` is none of the vocabulary fell through the `switch` and was returned in place of the score (`apply`) or of the inverse (`invert`); in a `batch` it became the score the next child was applied to. Both refuse it.
- Every operation: a number that is `NaN` or infinite (a tempo, a clip's start, a breakpoint, a send's level) went into the score. `clip.replaceFrom` with a `fromSec` of `NaN` dropped every clip of the track and its inverse brought none back. Any number an operation carries has to be finite; what a source's `analysis` holds is the host's own and is left alone.
- `track.add`, `group.add`, `return.add`, `elementTrack.add`: the record was taken as it came. A send to a return that is not there, two sends to one return, a clip of an unknown source, two clips of one id, a stretch track with a loop length, a return that sends to itself are refused.
- `device.add`, `device.replace` and the adds above: a device could be given the id `master`, which is the master strip's own name as an owner.
- `source.update`: the `url` could be taken from a source an element track streams. `source.add` and `source.update` took an empty `url`, and `source.add` an empty id or a length below zero.
- `strip.set`: the value was written under whatever `param` it was given, so `mute` or `inserts` put a number where the strip keeps a switch or its devices. `lane.add` and `route.add` took such a strip target too, and a device target with an empty parameter name.
- `clip.add`, `clip.move`, `clip.trim`, `clip.update`, `clip.replaceFrom`, `elementTrack.setClips`: only a clip's `chance` was held to its range, and only by `clip.update`. A start, offset, length or fade below zero, a `pan` past ±1, a `lowpassHz` under 20, a loop that ends before it starts and an unknown fade curve are refused, and so are two clips of one id handed to `elementTrack.setClips`.
- `score.setMeta`, and the `meta` of a clip or a source (`clip.add`, `clip.update`, `clip.replaceFrom`, `elementTrack.setClips`, `source.add`, `source.update`): an entry named `__proto__`, at any depth, was written by assignment, which sets the object's prototype. The operation applied and the entry was not in the score. It is refused.
- `ScoreRenderer`: when a device put in the middle of an insert chain could not be made (its module did not load), the inserts after it had already been taken off the strip and were left off: no longer heard, and still counted as rendered, so every later render failed with `device "…" is already rendered`. They go back on in the order they had before the error is passed on; under a renderer disposed meanwhile they are disposed.
- `diffScores`: a `0` beside a `-0` was reported as a change (`0 → 0`), between a document and the same document read back from what was saved.

New: `clipIssues(clip)` in the score schema, the validator's check of a clip's own fields, which the clip operations ask. What `validateScore` and `parseScore` say of a score is unchanged.
