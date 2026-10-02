---
'@kieranklaassen/live-mix': patch
---

Push: a third MIDI port under the device's name is no longer taken for the Push, and the stand-in can be plugged back in.

- `parsePushPortName` (and so `findPushPorts`) returns null for a port that is neither the Live nor the User port: a Push 3 has MIDI sockets of its own, and the port for what is plugged into them carries that instrument's notes, not the pads.
- `VirtualPush.plug()` puts the cable back after `unplug()`: the same ports report `connected` again and the device is as it powers up, so an app's reconnect can be tested. `usb().getDevices()` lists nothing while it is unplugged.
