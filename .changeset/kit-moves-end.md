---
'@kieranklaassen/live-mix': patch
---

The React kit: a move always ends, a held mark comes down, and five smaller faults.

- `useParamControl` (`Knob`, `Fader`): a control that left the page in the middle of a move never called `onChangeEnd`, so a host that took hold of a parameter at `onChangeStart` kept it. The move now ends once on every way out: the control taken off the page, switched off under the pointer (`disabled`), or the pointer taken from it (`lostpointercapture`, which a control taken out of the page and put in again gets in place of the pointer going up). The handlers gained `onLostPointerCapture`.
- `PlateDisplayLayer`: the same for a handle of a display in hand: `onDragEnd` is called when the display leaves the page or loses the pointer.
- `Meter` with `source`: the held mark stayed up for as long as the reading stood still (silence after a peak), since a reading like the last was not drawn. It now comes down when its time is over.
- `quantize`: a step that is no power of ten (0.25) was rounded to the decimals of its size, not of how it is written, and gave 0.3 and 0.8. No stock parameter has such a step; a hosted plug-in may.
- `Knob` / `useParamControl`: new `wholeSteps`. With it a key moves a whole step with Shift held too. `DevicePanel` and `DevicePlate` set it for a list and for a parameter with a step of its own, where Shift and an arrow sent a value between two entries (a filter's Type at 0.1) while the knob went on showing a whole one.
- `onDisplayFrame`: a display whose draw threw left the shared loop with no frame asked for, and every display on the page stood still. The one that throws is left out and the rest go on.
- `useChainReorder`: a chain changed by something else during a carry (a device added, removed or moved) had another device moved when the carried one was let go. Such a carry now moves nothing.
- `Stroke`: seams were keyed by their px, and a short sound repeated more often than the stroke is px wide left seams of the old picture in the page when it was drawn again.
