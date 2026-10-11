---
'@kieranklaassen/live-mix': patch
---

A host's `data-*` attributes reach every control that does a pick: the action cell at the foot of a `PickList` carries them too (`actionProps`, and a `PickerAction` takes any `data-*`), beside the cell and the rows, and `DataAttributes` is exported. A cell names the list it opens while it is open (`aria-controls`; `PickList` takes an `id`). A `DevicePlate` can be told whether it is open (`open`, with `onOpenChange` asking) and takes marks for its `+n` cell (`moreProps`). Where an app's own preset has the name of one of the device's, a `DevicePresetCell` lists the app's alone. A list whose row under the cursor has gone puts the cursor back where it would open, the action cell reads "Applies …" in the info view, and the cells render on a server without a warning.
