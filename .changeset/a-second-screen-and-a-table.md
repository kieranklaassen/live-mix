---
'@kieranklaassen/live-mix': patch
---

`./visuals`: the picture on a second screen, and a table to lay gear on.

- `sendVisuals(name, frameAt)` sends a desk's frames down a line (a
  `BroadcastChannel` where nothing else is handed over) for as long as a
  screen listens there, and works out and sends nothing while none does.
  `receiveVisuals(name).frameAt` is what another window hands to
  `showVisuals`: the frame that came last, moved on by that window's own
  clock, so the picture drifts evenly where the sender is slowed down.
  `live()` says whether frames are coming.
- A new style, `table`, in a new group, Backplates: a table seen from straight
  above, in wood or under a woven cloth, lit by one lamp that breathes with
  the mix, with the piece glowing along its far edge. It is a ground for what
  a host lays over the picture. `VisualGroupId` gains `'backplates'`.

Forty-one styles now. See `docs/visuals.md`.
