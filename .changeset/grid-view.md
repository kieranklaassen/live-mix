---
'@kieranklaassen/live-mix': minor
---

`GridView` in `./react` (U31 follow-up): the session grid — scenes × audio
tracks over `useSession` / `useSlot`, a slot button per cell with its state
(press launches, release ends a `gate` slot, keyboard too), scene launch per
row, per-track stops and stop-all, a quantise selector (`GRID_QUANTIZE_CHOICES`,
`quantizeKey` / `parseQuantizeKey` / `quantizeLabel`) — styled with the `--lm-*`
tokens (`.lm-grid*`). The playground gains a "Session grid" section over a
document-driven `Session` on its demo engine, and the browser smoke asserts it mounts.
