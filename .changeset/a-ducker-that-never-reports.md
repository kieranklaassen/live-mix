---
'@kieranklaassen/live-mix': patch
---

A `WorkletDucker` made with a `reportHz` below 0, or one that is no number, said it had its two readings (`meters`: the duck gain and the key level) though its processor, which reports only at a rate above 0, never sent one: a display drew the gain standing at 1 and the key at 0. Only an exact 0 was taken as no reports. The device now reads the rate as the processor does, and has no readings to give at any rate that is not above 0.
