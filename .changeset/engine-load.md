---
'@kieranklaassen/live-mix': patch
---

`engine.stats` reports real figures, and a disposed WASM device stops taking processor time.

- **Load.** `AudioContext.renderCapacity`, which `EngineStats` relied on, is in no shipping browser, so `supported` was false everywhere. Where it is missing and the page is cross-origin isolated, the engine now measures its own worklet processors (every WASM device and the plug-in bridge): each marks the time it works in a shared cell, and a worker (`worklets/load-sampler.js`) looks at that cell at random moments. `averageLoad` is their share of real time over the last interval, `peakLoad` the busiest of the last ten intervals, and `loadSource` says which figure it is (`'render-capacity'`, `'devices'`, or null: none). On a page that is not isolated there is no way to measure (the audio thread's only clock ticks in milliseconds, in step with the audio callbacks) and `supported` stays false. The browser's own nodes are not in the figure. Sampling runs only while something is subscribed.
- **Devices.** `snapshot().devices` lists the worklet devices by kind, costliest first: how many, their load (devices source) and the memory their instances hold. The memory is there on every page.
- **Dropouts.** Where the browser has playback statistics (`context.playbackStats`, `playoutStats` in older Chromium) `glitches` counts output underruns since the last reset and `underrunSec` is how long they lasted; `glitchSource` says what is counting.
- **Fix.** `WasmDevice.dispose()` now tells its processor to stop. Before, the processor kept answering `true`, so every device ever removed from a chain went on being rendered, disconnected, for as long as the context lived: six disposed reverbs still took 8 % of real time. An app-local processor (`definition.processor`) should answer the new `{ type: 'dispose' }` message by returning `false` from `process`.
- `LoadProbe`, `loadCells`, `LOAD_CELL_BUSY` and `wasmMemoryBytes` are exported for hosts with worklet processors of their own: claim a mark with `LoadProbe.for(context).claim(label)`, pass `claim.slot` in `processorOptions.load`, and store the mark in the busy cell around `process`.

Measured against the same device modules run in a worker at the audio thread's pace (`browser-tests/specs/engine-load.spec.ts`): 9.4 % against 9.4 % for four Zita reverbs and two Shimmers in headless Chromium. Run flat out, as `docs/devices.md` times them, the same modules take about half that: a block that starts on a cold cache every 3 ms costs about twice a block in a tight loop.
