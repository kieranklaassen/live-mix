---
'@kieranklaassen/live-mix': patch
---

The kit (`./react`) does less work per frame, and draws what it drew.

A `Meter` on a source no longer renders on every sampled frame. React renders it once, and again when its props change or an element comes or goes (the peak-hold marker, the bars and the readout of a LUFS meter); between those renders each reading is written straight to the elements, with the strings React wrote before and only where a string changed. The document reads the same after every frame, and a click still clears the clip lamp. `<Meter reading={…}>` renders through React as it did, and `useMeter` and `useDeviceMeter` are unchanged.

Everything sampled on one frame scheduler now rides one chain of frame requests instead of one per hook, and subscribers with the same `fps` fire on the same frames, so a page of meters moves together. `subscribeFrameSampled(scheduler, intervalMs, sample, onValue, isEqual?)` is the same sampling without React state, for a host that writes a value to the DOM itself, and `subscribeFrames(scheduler, intervalMs, onFrame)` is the bare frame. `useFrameSampled` keeps its signature; a hook that joins others at its rate waits for their next frame instead of taking the one after it mounted.

The waveform of a `Stroke` is worked out in about a quarter of the time, to the same paths. `strokeWavePaths(options, window)` returns the halo, the wave and the bars in one call: the columns are laid out once instead of being read back as an array of pairs for each path, the `L{x}` of a column is shared by every edge it is on, and a coordinate is printed without `toFixed` wherever that provably gives the same text (a tie, or a number next to one, still goes to `toFixed`). `strokeLevels`, `levelsOutlinePath`, `levelsBarsPath` and `fadePaths` return what they returned, character for character, and take less time doing it; a copy of the old implementation in the tests holds them to that over a few hundred random strokes and every edge the code has.
