---
'@kieranklaassen/live-mix': patch
---

Clips can play backwards: `Clip.reversed` plays the clip's slice of its source from the far end back to `offsetSec` on an audio track, and a looping clip cycles backwards over its region. The fades and the gain stay on the clip. The track reads a mirrored copy of the decoded buffer, made once per buffer ahead of the start. `mirrorSlice` and `reversedSourceSec` give the same mapping as numbers, so a drawing (`Stroke`'s `reversed`) matches what plays. In the score: validated, normalised (`false` is the same as absent), patched with `clip.update`, and in the agent's clip schemas.

`DeviceChainView`'s move buttons step through the score's own order when the score holds the chain, so two quick clicks carry a device two slots instead of back to where it started, and never in front of a pinned insert. `isJsonValue` is pinned in the public entry. The renderer now hands a track its clips again when only a clip's loop region (`loopStartSec`, `loopEndSec`) changed.
