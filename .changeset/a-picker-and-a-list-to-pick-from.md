---
'@kieranklaassen/live-mix': patch
---

`./react` has the list a cell opens, moved from Ambient Live: `PickerPanel` and its parts (`PickerSearch`, `PickerGroup`, `PickerAction`, `Keycap`, `Highlight`, `pickerPlace`, `cursorStep`, `tabStops`, `focusCell`, `useRowInView`), the search behind it (`searchRows`, `searchScore`, `matchRanges`, `queryWords`), and `PickList` and `PickCell`, a searchable list of named things with one cursor and one action (`pickRows`, `pickSlug`, `deviceItems` for a registry's devices, `patchItems` for chains). The panel opens above its cell or, new here, below it (`side`), and stops above a `rail` an app names.
