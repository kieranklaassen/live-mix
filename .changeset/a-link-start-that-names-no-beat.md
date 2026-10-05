---
'@kieranklaassen/live-mix': patch
---

The plug-in host refuses a `linkStart` that names no beat. Its answer for a beat that is not finite was already "linkStart needs a beat", but a beat that was left out, or `null` (what a NaN is once `NativeLink.start` or `followStart` has sent it as JSON), read as the number 0: the host took it for beat 0 and moved the session's beat there, and the call resolved. Such a call is now rejected and the beat stays where it is. A beat has to be written as a JSON number: a number in a string (`"4"`) and `true`, which the host read as 4 and 1, are refused the same way; `NativeLink` never sent either. `FakePluginHost` (`/testing`) answers the same, where it too took the beat for 0.
