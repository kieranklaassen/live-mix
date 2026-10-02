---
'@kieranklaassen/live-mix': minor
---

An info view for the kit: point at a control and a pane says what it is and what it does, as the box in the bottom left corner of Ableton Live does.

- `InfoView` and `useInfo` follow the pointer (and the keyboard focus) inside a root and show the entry of the nearest element that has one. `infoProps(title, text)` writes the two attributes a control carries (`data-lm-info-title`, `data-lm-info`); `resolveInfo` / `findInfo` read them, falling back to a control's `title` tooltip and then to whatever around it has an entry.
- The kit's controls carry entries: `Knob` and `Fader` take `info` and add how they are worked (drag, Shift for fine steps, what a double-click returns to); `DeviceFrame`, `DeviceToggle`, `ToggleButton` and `Meter` take `info`; `DevicePanel` says the descriptor's description for the device and describes each knob, its preset picker, power switch, readings and remove button; `DeviceChainView` its handle, move buttons and add picker; the strips, transport bar, session grid and version list theirs (`STRIP_INFO`, `TRANSPORT_INFO`).
- `ParamSpec` takes an optional `description`: what turning the parameter does to the sound. A spec device writes it per param in `device.json`. A parameter without one is described by the common meaning of its name (`paramInfo`: Mix, Attack, Feedback, …) or not at all.
- Every stock device says what each of its knobs does: all 39 spec devices (in `device.json`), the hand-written WASM devices, the node devices and the ducker, about 580 parameters. The Faust devices get theirs through `describeParams(table, descriptions)`. The node devices and the nine WASM devices that had none gained a `description` of the device too. A test fails when a stock device is added without them.
