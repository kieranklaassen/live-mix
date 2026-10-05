---
'@kieranklaassen/live-mix': patch
---

`Knob` and everything else on `useParamControl`: Enter on a control of two places whose click a host kept (a mapping mode that picks a control and does not work it) left the control armed until the next key on it, a blur or a click that reached it, so a later click that no pointer made (a script's `element.click()`, a screen reader's) switched it. Enter is over when the key goes up. An Enter whose click reaches the control switches it as before. `ParamControlHandlers` gains `onKeyUp`.
