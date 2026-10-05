---
'@kieranklaassen/live-mix': patch
---

`@kieranklaassen/live-mix/testing`: `VirtualPush.plug()` brings the device back "as it powers up", and now also without the MIDI start it had received (`animating` is false again until the host sends one), with the touch strip at rest and its LEDs dark, with the first MPE channel next, and with no display frame half received: a host that was in the middle of a frame when the cable came out had its next frame's header taken for pixels, and the device reported an error a real one would not have. The LED and display brightness are kept as before. `VirtualPush.usb().requestDevice` rejects with "No device selected." while the cable is out, as a chooser with nothing to pick does, where it handed the display out and marked it allowed.
