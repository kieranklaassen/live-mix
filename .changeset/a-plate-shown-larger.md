---
'@kieranklaassen/live-mix': patch
---

`PlateDisplayLayer` and `StudioFace` (and so `DevicePlate`): a plate a host shows larger or smaller, by a CSS `zoom` on it or around it, keeps its display's points under the pointer and its pictures sharp. A press, a drag, a wheel turn and a double press on a display were counted in the page's px, so on a plate shown at 1.2 times a point drawn at 90 px was looked for at 75 and a press on it took nothing; they are counted in the display's own px now. The display's canvas and the photographed face hold the screen's pixels for the size they are shown at (the screen's ratio times the zoom), where they held the pixels for their own size and were stretched. A plate at its own size is as it was. New exports from `PlateDisplay`: `shownScale(element)` and `pixelsPerPx(element)`.
