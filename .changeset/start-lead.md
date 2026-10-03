---
'@kieranklaassen/live-mix': patch
---

On a device, Play and a seek while playing start what is due there on the frame it was written for.

The audio clock runs on while the page hands a start over: a browser renders a whole device buffer of blocks in one burst, and the page reads the clock as the last block left it. A transport pinned at the clock as it was read was therefore already behind by the time its first voices reached the audio thread. A voice due at the anchor then began a block into its sound with nothing to ease it, or under a come-up that was already part of the way up, and a voice entered partway came up the same way. Either is a step: in ambient-live about one Play in ten of a looped sound, and one jump of the playhead in fifty.

- `startFloorSec(ctx)` is how far ahead of the clock a start has to be for the device to keep it to the frame: one device buffer (`baseLatency`) and one block. `startLeadSec(ctx)` is that and two blocks more, for the page to hand over every start due at the anchor: 10.7 ms at 48 kHz on a 128-frame buffer. Both are 0 on a context with no device buffer (an offline render, a test's mock), where the clock does not move while the page writes, so a render is the same to the frame.
- `Transport` takes `startLeadSec` (a number, or a function read at each pin; default 0). `start()` with no time, `seek()` and `seekElapsed()` while playing pin the anchor that far ahead of now, and the position stands at the anchor until then. `start(at)` is left where it was asked for. A loop change before a start pinned ahead is reached keeps its moment. `transport.startLeadSec` reads the lead: a caller that seeks to put the transport in step with another clock aims that far along. An `Engine` gives its transport `startLeadSec(context)`.
- `AudioTrack` linear voices: one whose time has passed joins `startFloorSec` ahead of the clock and eases in over 5 ms, whether or not it was handed over as a join; one due sooner than that plays whole from there; a voice let go (`stop(key)`, `stopAll()`, and `release` for a voice taking its place) falls from there, off its own envelope, which is where the voice entered in its place comes up. Equal-power voices are as they were.
- The scheduler does not take a loop change made before a start pinned ahead is reached for a fold of the timeline.
