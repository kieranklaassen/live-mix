---
'@kieranklaassen/live-mix': patch
---

A WASM device whose output is no number is left behind by a full bypass. One NaN sample at a device's input is enough for a reverb's or a chorus's memory, and everything it puts out afterwards is NaN; bypassing it did not bring the dry signal back, because the crossfade multiplied that output by a wet of 0 and NaN times 0 is NaN. Bypassed, the device now passes its dry input on, fading in over the bypass ramp as beside a healthy device. Finite output is mixed as before, a device that is not bypassed is passed on as it is, and what stands after the device in a chain is not cured by this: a device that has already taken NaN in keeps it.
