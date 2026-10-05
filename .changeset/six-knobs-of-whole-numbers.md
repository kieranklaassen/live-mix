---
'@kieranklaassen/live-mix': patch
---

Six device parameters that their devices take as whole numbers say so with `step: 1`: `felt-piano` **Polyphony**, `thesis` **Center Note** and `lattice` **Voice 1 to 4 Degrees**. Each device rounds the value to the nearest whole number, a half going up, so the hundredths a knob turned in were settings that did not exist. `DevicePanel` and `DevicePlate` now move these knobs by one and print them whole with their unit ("32 voices", "62 note", "2 steps", where it was "32.00 voices"); a value held between two whole numbers reads as the one that plays. Only the kit reads `ParamSpec.step`: the value a device is given, what a score carries and what an agent's `device.setParam` accepts are unchanged, and no `.wasm` changes.
