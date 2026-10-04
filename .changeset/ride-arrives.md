---
'@kieranklaassen/live-mix': patch
---

A ride arrives. `ChannelStrip.setRide` takes `arriveAt`, an audio-clock time by which the layer is at its value: the approach never quite gets there, so from `arriveAt` a second one with a 20 ms time constant (`RIDE_ARRIVAL_TIME_CONSTANT`) closes what the first left. `Performer` gives every scene ride, single ride, dial ride and `reset` the end of its morph or glide, so a sound taken out is silent a tenth of a second after its morph ends instead of 35 dB down and still falling.
