---
'@kieranklaassen/live-mix': patch
---

A stroke shows the word of its line ("Level") whole or not at all.

- On a stroke under 60 px high the name and the line's word share one row, and on a short one the word ran into the name: it was written over the name, or, under a host that stands the name on top, a piece of it stuck out from behind. The word now gives way whole where the two would meet.
- On a narrow stroke the word was cut by the stroke's left end. It is now left out where it does not fit inside the ring, round end included.
- Where there is room nothing moves: the word ends where it did.
- The word stands in a new element, `.lm-stroke__automation-room`, one row high, which is the row from the name's end (or the round end) to where the word ends. Beside a name the room is inside `.lm-stroke__tag`; `.lm-stroke__automation-label` is no longer positioned itself. No measuring and no state: the stylesheet wraps a word too long for its room out of sight. A host that gave `.lm-stroke__tag` a `z-index` to keep the name on top can drop it.
