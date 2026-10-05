---
'@kieranklaassen/live-mix': patch
---

`@kieranklaassen/live-mix/testing`: `VirtualPush.turn(encoder, steps)` never came back for a number of steps that is NaN or an infinity, so a test that worked its steps out wrong hung the whole run with no message. It throws a `RangeError` now. Every finite turn sends what it sent.
