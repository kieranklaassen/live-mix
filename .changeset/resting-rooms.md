---
'@kieranklaassen/live-mix': patch
---

A room that has rung out is not called by the audio thread any more. It led nowhere, and a browser goes on calling a worklet that has no output connected at all; it now leads to a gain that leads nowhere.
