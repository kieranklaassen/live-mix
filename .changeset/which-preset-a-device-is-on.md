---
'@kieranklaassen/live-mix': patch
---

Which preset a device is on, in the root entry: `presetIsOn`, `currentPreset`, `stepPreset`, `atDefaults` and `retiredPresets`. A device does not say which preset it is on; a preset is a set of parameter values, so the one that is on is the one whose values the parameters still have, the named ones at the preset's values and the rest where the device starts them. They were Ambient Live's (`instrument-presets.ts`) and are here so that a preset cell names the same settings alike in Ambient Live and in Everycut.
