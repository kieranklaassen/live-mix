---
'@kieranklaassen/live-mix': patch
---

`./react` has the preset cell Ambient Live puts on an effect: `PresetCell` names the preset the parameters are on (`Default` where the device starts, `No preset` when they fit none), steps to the one before and after, and opens the list of them. `DevicePresetCell` reads it off a device, lists an app's own presets before the device's (`presets`, `ownOnly`), and with `writes` hands a pick to a host as one write of every parameter. It goes in a plate's `presetPicker`. `presetLabel` is what the cell says. The list's search field names the effect as it is written (`Search presets of EQ`).
