---
'@kieranklaassen/live-mix': patch
---

Undo and the agent layer: a refused undo that moved its step to the other stack, schemas that refused a looping clip, and an undo that hid the call it had put back.

- `ScoreDocument.undo`, `redo`: a step whose operation no longer fits the score (its track removed with `history: false`, say) threw as it should, but had left its stack first. A refused undo lay on the redo stack with nothing undone, so redo offered what was never undone and the next undo took back the step before it. The operation is applied before the step leaves its stack, and a refused step stays where it was.
- The agent's operation schemas (`clip_add`, `clip_update`, `clip_replace_from`, `track_add`, `slot_add`, `score_replace`): a clip's `loopStartSec`, `loopEndSec` and `warp` markers and a track's `stretch` were not in them, so a looping or warped clip, and any stretch track, was refused with `invalid_args` before it reached the score that holds it. They are there now, held to what the score's own validator takes.
- `undo` (the agent's intent): an undo that was itself undone had taken nothing back, yet the call it named stayed marked as undone: a plain `undo` passed over it and took back an older call, and naming it answered "already undone". `AgentAuditLog.isUndone(entry)` follows the mark to its undo, and the call stands while that undo is undone.
- `withVersionCheckpoints`: the wrapped session was a spread of the one given, so a session that is an instance of a class lost every hook on its prototype, and a hook that reads `this` read the copy. Every hook is called on the session it came from. Only a class's methods are taken along: a getter is not read, so wrapping a session runs none of its code.
- `validateSessionScript`: a hold that runs past its part, or overlaps another, was named by its place in time and not its place in the script, so with the later hold written first the path pointed at the other one.
