---
'@kieranklaassen/live-mix': patch
---

The score can now hold an application's whole arrangement, edited one undo step per gesture:

- `Clip.muted` keeps a clip in place without sounding it (the scheduler, `useSchedule` and the renderer honour it; `isAudibleClip`, `ClipList.audible()`), and `meta` on clips and sources carries the host's own plain-JSON annotations untouched (`JsonValue`, `JsonObject`, `isJsonObject`, `canonicalJson`, `sameJson`, `normaliseMeta`).
- New operation `source.update { id, patch }` for `url`, `durationSec`, `analysis` and `meta` (`null` clears), also in the agent vocabulary.
- Operations applied with the same explicit `gesture` id now join into a single undo step even when they differ in type or target, and `document.apply(op, { history: false })` applies an amendment that is logged and rendered but is not an undo step.
- Under an arbiter, `DeviceChainView` adds, removes and reorders inserts through the score (`freshDeviceId`), and `useDevice`'s bypass, presets and reset are score operations, so device chains save and undo with the rest.
