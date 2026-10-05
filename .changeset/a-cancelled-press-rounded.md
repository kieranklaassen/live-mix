---
'@kieranklaassen/live-mix': patch
---

`useParamControl` (`Knob`, `Fader`): a press the browser takes back (`pointercancel`) after it has turned the control puts the value back, and what it put back was the value shown, which is the host's rounded to the control's step. A host's value between two steps (a preset's 0.3333 on a knob of hundredths, a fader level that is not a whole tenth of a decibel) came out of a cancelled touch changed to the nearest step. The value the host held at the press is given back as it was, also when the press had turned the control up a step and back down before it was cancelled. An uncontrolled control, and a press let go, are unchanged.
