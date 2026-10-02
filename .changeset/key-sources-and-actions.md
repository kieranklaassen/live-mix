---
'@kieranklaassen/live-mix': minor
---

A computer key can be a mapping source and something the host does a target,
so a page can offer Ableton Live's Key Map next to its MIDI Map over one
`ControlSurface`.

- `ControlSource` gains `{ kind: 'key', code }`, a key named by its
  `KeyboardEvent.code`. `describeSource` prints `Key 1`; `keyCodeLabel(code)`
  is exported. `isMidiSource` is false for it.
- `ControlTarget` gains `{ kind: 'action', id }`: a function registered with
  `surface.registerAction(id, run)` (or `resolve.action`). It fires on a press
  or a rise past the midpoint, like a transport target, and has no value.
  `ControlResolver` has an `action(id)` lookup.
- The kit's device views carry `data-lm-strip`, `data-lm-insert`,
  `data-lm-device`, `data-lm-param` and `data-lm-power`, for a host that
  draws a mapping overlay over them.
