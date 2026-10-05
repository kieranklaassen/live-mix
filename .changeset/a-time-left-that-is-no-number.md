---
'@kieranklaassen/live-mix': patch
---

`resolveReplacementTracks`: a `remainingSeconds` of `NaN` (what is left of a track whose length has not loaded yet) picked nothing, where the function promises at least one track. It now picks one, as a time left of 0 does.
