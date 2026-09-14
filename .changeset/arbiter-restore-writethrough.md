---
'@kieranklaassen/live-mix': patch
---

Review follow-ups on the arbiter, the strip hooks and warped clip entry:

- `Arbiter`: a `score.replace` (a `VersionHistory.restore`, or its undo/redo) now cancels every write still waiting, so stale deferred writes no longer land on the restored score — including in the same release pass in which a deferred restore itself lands.
- `Arbiter`: a write from an author that takes no hold (e.g. `system` rails) still writes through to the graph while a hand's override keeps the renderer off the parameter; before, the document changed but the graph did not.
- `useStrip`/`useTrack`: `toggleMute`/`toggleSolo` flip the score's value when arbitrated (the engine strip follows the renderer later), so two quick toggles alternate instead of repeating.
- `warpClipSecAt` is now the exact inverse of `warpSourceSecAt` before the first segment as well, so a warp whose first marker is not on beat 0 enters at the marker's timeline position instead of the clip start.
