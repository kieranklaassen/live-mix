---
'@kieranklaassen/live-mix': patch
---

A stretch node that could not be filled, and a render whose clock does not move.

- `StretchSource.create`: a node that could not take its configuration or the sample's channels was left holding what it had taken, with nobody to let it go; a stretch track asks again on every tick, so each try left another. The node's buffers are dropped before the failure is thrown on.
- `renderOffline`, `renderStems`, `scheduleAhead`: a `tickSec` of 0 or less stepped the virtual clock without end and hung the page, and one that was not a number made no tick, so the render came back silent. Both are refused, as a duration of 0 already is.
