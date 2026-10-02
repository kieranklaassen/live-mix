---
'@kieranklaassen/live-mix': patch
---

A plug-in scan keeps its plug-ins' windows off the screen, can be stopped, and a plug-in's own window comes to the front.

- On a Mac the scanner takes every window a plug-in opens while it is looked at off the screen again, and is never the app in front: a plug-in that asks for its licence in a dialog no longer puts that dialog over what the person is doing. It waits unanswered and is left out like any plug-in that never answers. `LIVE_MIX_SCAN_WINDOWS=1` in the host's environment lets the windows show, for the plug-in that can only be authorised from that dialog.
- `client.stopScan()` (the `stopScan` request) ends the scan that is running. The scan answers at once with what it found so far and `stopped: true`; the plug-in it was in is not held against it, and the host's `scanUnfinished` stays set, so the next scan carries on from there.
- A hosted plug-in's window is ordered in front of other apps' windows when it is opened and when it is asked for again, not only in front of the host's own.
- `FakePluginHost` takes `holdScans` (a scan stays running until `finishScan()` or a `stopScan`).
