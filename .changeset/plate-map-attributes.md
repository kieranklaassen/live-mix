---
'@kieranklaassen/live-mix': patch
---

A plate's parts say which device and parameter they are. `DevicePlate` writes `data-lm-device` on its element, `data-lm-param` on each knob and `data-lm-power` on its power cell, as `DevicePanel` does, so a host that finds what can be mapped to a key or a MIDI control by those attributes finds the knobs of an effect drawn as a plate.

A beat is told on its line though the clock moves on. `Performer` read the audio clock twice when it worked out when a beat or a scene's line falls, once for the playhead and once more for the count of beats; on a busy page the thread is put aside between the two, and the time came out early by as long as that took (3 to 6 ms measured in a browser). Both sums use one reading.
