---
'@kieranklaassen/live-mix': patch
---

`useParamControl` (`Knob`, `Fader`): Delete, Backspace, a double click or `setValue` while a pointer is down on the control no longer ends the pointer's gesture under the hand. `onChangeEnd` came at the key, and what the pointer turned after it was announced with no gesture around it, so a host that overrides an automation lane or groups an undo step by the gesture let go in the middle of the drag. The value is still set at once; the gesture ends when the pointer lets go, as it already did for the stepping keys.
