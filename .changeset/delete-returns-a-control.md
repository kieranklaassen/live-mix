---
'@kieranklaassen/live-mix': patch
---

`Knob`, `Fader` and everything else on `useParamControl`: **Delete** or **Backspace** with the keys on the control returns it to its default (`resetValue`, else `defaultValue`), as a double-click does, as one gesture (`onChangeStart`, one `onChange`, `onChangeEnd`) so a host's undo takes it back in one step. The key stops at the control, so a page behind it does not also delete what is selected there. With a modifier held the key is left to the page, a held key is one press, and a disabled control takes nothing. The info view's hint line says so: "Double-click, or Delete with the keys on it, returns it to …".
