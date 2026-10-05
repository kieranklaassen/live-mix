---
'@kieranklaassen/live-mix': patch
---

`infoName` (and so `findInfo`, `resolveInfo` and `InfoView`, for a control given no title): a `select` was named by the text of its entries and a `textarea` by what was typed in it. A list inside a `<label>Mode …</label>` came out as "ModeLow-passHigh-pass", one with no label as "SineSaw", whenever the entries together were short enough to pass for a name. A label is now read without the list or box it stands around, and a list or a text box with no label, `aria-label` or placeholder has no name instead of its contents. Controls that are given a title with `infoProps`, or an `aria-label`, are named as before.
