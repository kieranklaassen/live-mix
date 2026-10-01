---
'@kieranklaassen/live-mix': patch
---

Clips can play backwards: `Clip.reversed` plays the clip's slice of its source from the far end back to `offsetSec` on an audio track, and a looping clip cycles backwards over its region. The fades and the gain stay on the clip. The track reads a mirrored copy of the decoded buffer, made once per buffer ahead of the start. `mirrorSlice` and `reversedSourceSec` give the same mapping as numbers, so a drawing (`Stroke`'s `reversed`) matches what plays. In the score: validated, normalised (`false` is the same as absent), patched with `clip.update`, and in the agent's clip schemas.
