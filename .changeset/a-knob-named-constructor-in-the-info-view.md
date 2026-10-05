---
'@kieranklaassen/live-mix': patch
---

`paramInfo`: a parameter with no description of its own is described by what its name always means, and the name was looked up in a plain object. A hosted plug-in's parameter named "Constructor" (or `__proto__`) was then described by the object's own machinery, and the info view printed `function Object() { [native code] }` for its knob in a `DevicePanel` or on a `DevicePlate`. Only the names listed are looked up; such a knob gets the panel's "A setting of …" line like any other name with no common meaning.
