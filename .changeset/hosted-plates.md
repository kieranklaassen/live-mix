---
'@kieranklaassen/live-mix': minor
---

A hosted plug-in has a plate of its own (`./react`): a chain drawn with `skin={deviceSkin}` no longer shows it as a grey panel between the plates.

- `hostedSkin(device)` gives a device with an editor a case picked by its id: one of eight colours in `HOSTED_PLATES`, a finish and a knob cap, the same every time. The picture is the plug-in's own window drawn small, with three sliders that follow its first three parameters.
- `deviceSkin(device)` answers with that skin for a device with `openEditor`. It still gives none to a plug-in that is missing, which keeps its `DevicePanel` and its notice.
- `DevicePlate` has an `Edit` cell for such a device (`lm-plate__edit`, named `Open <name> editor`) that calls `openEditor()`. The `+n` cell sits under it (`lm-plate__more--second`).
- A host that passed `deviceSkin` and relied on a hosted plug-in being a panel can keep that with `skin={(device) => (isEditorDevice(device) ? null : deviceSkin(device))}`.
