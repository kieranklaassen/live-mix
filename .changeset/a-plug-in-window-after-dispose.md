---
'@kieranklaassen/live-mix': patch
---

`WamDevice.createGui`: a device disposed while the plug-in was still making its GUI kept the element that then arrived and handed it to the caller, with nothing left to destroy it. The element is destroyed as it arrives and the call resolves to `null`, as it does on a device disposed before the call.
