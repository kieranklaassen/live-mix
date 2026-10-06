---
'@kieranklaassen/live-mix': patch
---

`zone-sampler`, a multi-sample instrument: zones of one sound each with a root and fine tune, a key range, a velocity range, a gain, an optional loop with a crossfade and an optional round-robin group; keys no zone covers play the nearest zone repitched. 48 voices, attack, release, tone, velocity and volume. `WasmDevice.loadZones(map, samples)` hands it a plain JSON zone map and decoded audio, fitted to the device's fixed sample memory first: over budget it refuses with the reason, or with `overBudget: 'thin'` loads fewer layers and says which. `renderPatch` takes the same instrument as `zones`. `parseSfz`, `writeSfz`, `parseDspreset` and `writeDspreset` read and write SFZ and Decent Sampler presets as zone maps and report what they could not use (docs/zone-sampler.md, docs/instrument-formats.md).
