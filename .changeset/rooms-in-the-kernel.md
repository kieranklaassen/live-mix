---
'@kieranklaassen/live-mix': minor
---

An engine can convolve its rooms itself. With `spaceKernel: true` every room on a live context, on a page that is cross-origin isolated, is worked out in WebAssembly on the audio thread in place of a `ConvolverNode`, for a tenth of the time or less and with the same sound. `Engine.spaceKernelReady` says whether it is in use, and `AudioTrack.spaceTailSec` how long a room rings whatever convolves it. A room that has rung out leaves the graph until something is sent into it. The default is what it was.
