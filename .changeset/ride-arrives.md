---
'@kieranklaassen/live-mix': patch
---

A ride arrives. `ChannelStrip.setRide` takes `arriveAt`, an audio-clock time by which the layer is at its value: the approach never quite gets there, so from `arriveAt` a second one with a 20 ms time constant (`RIDE_ARRIVAL_TIME_CONSTANT`) closes what the first left. `Performer` gives every scene ride, single ride, dial ride and `reset` the end of its morph or glide, so a sound taken out is silent a tenth of a second after its morph ends instead of 35 dB down and still falling.

Two fixes to performing that reached the branch after it merged: a scene or ride queued with its own `quantize` keeps that grid when a seek moves it to the next line (it fell back to the set's), and `normalisePerformSet` no longer clamps a host target's output range at 0, so a dial can drive a signed unit (dB, pan). A ride's range is still held to 0…2.
