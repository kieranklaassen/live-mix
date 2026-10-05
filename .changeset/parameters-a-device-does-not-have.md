---
'@kieranklaassen/live-mix': patch
---

A parameter a device does not have: a value saved for one no longer stops a render, and a name every object answers to is no longer taken for one.

- `ScoreRenderer`: a piece can hold a value for a parameter a hosted plug-in had when it was saved and has no more. Loaded over a piece with the same plug-in under the same id and another value there, the renderer wrote the changed value to the plug-in, which throws for a name it does not have: the render failed and nothing after it reached the graph. A changed value is written only under a name the device lists. The stand-in for a plug-in that is not there (`MissingNativeDevice`) lists none and is still told every value.
- `validatePatch`, `presetParams`, `patchDeviceParams`, `applyPreset`: a parameter named `constructor`, `toString` or `__proto__` was found in the device's table, because every object has those. `validatePatch` called the patch valid and the score refused it at render; `presetParams` and `patchDeviceParams` put the name into the parameter map with `NaN` for a value; `applyPreset` set it on the device and listed it as applied. It is reported, dropped and listed as skipped, like any other parameter the device does not have.
- `NodeDevice`: `setParam`, `getParam`, `applyParam` and `follow` took such a name too (`setParam` kept `NaN` under it and announced a change). They throw `… has no parameter "…"`, as for any unknown name.
- `ScoreRenderer`: a lane or a route aimed at such a name on a device was bound: the lane wrote to nothing, the route threw on every modulation pass. It is a render error and the previous render stands, as for any other parameter the device does not have.
