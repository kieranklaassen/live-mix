---
'@kieranklaassen/live-mix': patch
---

The plug-in host takes no parameter value and no sample rate that is no number. JSON cannot write one, but the host read one out of the text `"nan"`: `setParam` clamped it to 0..1, where it is still no number, and gave it to the plug-in, which put it into every sample it played from then on; `load` made the plug-in at that rate. `setParam` now leaves the parameter where it is, and `load` answers that the sample rate is out of range.
