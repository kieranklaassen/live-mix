---
'@kieranklaassen/live-mix': patch
---

A bypassed device and an aligned strip are exact over a whole render.

A device the score marks bypassed is made bypassed, where it used to be made working and then switched. `DeviceCreateOptions` has a new `bypass`, which `ScoreRenderer` passes for such a device and `registry.create(id, context, { bypass: true })` hands to the factory. A node device (`NodeDeviceOptions.bypass`) has its dry gain at 1 and its wet gain at 0 as it is made, with no ramp. A WASM device (`WasmDeviceOptions.bypass`), the gate (`WorkletGateOptions.bypass`) and the cleanup devices (`WorkletCleanupOptions.bypass`) are told in their processor options (`bypassed`), so nothing waits on a message. Such a device passes its input, as late as it reports, from the first sample of a render. Before, a node device crossed over 5 ms at the head of a bounce, and a device in a worklet stayed working until the `bypass` message reached it, which in an offline render could be after its first blocks or after its last. A bypass changed later still crosses over 5 ms.

A factory that does not read `bypass` returns a working device, and the renderer sets `device.bypass = true` on it as before: a rack, the convolver reverb, the worklet ducker, a WAM plug-in, a hosted plug-in, a WASM device on a processor of the app's own, and a device an app registers without reading the option.

A strip that `engine.alignLatency()` delays comes out late by the count of samples in the report, to the last sample of its sound. `AlignmentDelay` and the delay on a node device's dry path are each a `DelayNode` that keeps two channels whatever feeds it (`wholeSampleDelay` in `core/devices/pdc.ts`). Left to follow its input, the delay was emptied by Chromium when the last source with two channels ended, and the last of the sound, as much as the delay held, was missing from a bounce. A sound in one channel now leaves an alignment stage, and the dry path of a bypassed node device that takes time, as the same sound in two channels. `isAlignmentDelay`, the stage's id and the latency report mean what they did.

A cleanup device whose source has ended goes on working on two channels. It used to fall to one, and play what it still held of the left on both sides.

What changes for a host: a recorded graph (`scheduleSnapshot()`, the recording mocks) of a score with a bypassed device no longer holds the two ramps that device was bypassed with, and the two delays above read `channelCount` 2 and `channelCountMode` `'explicit'`.

Measured in a real browser (`browser-tests/specs/bypassed-and-aligned.spec.ts`, headless Chromium 153 on Linux, 2026-11-22): white noise that ends half a second before the render does, through a bypassed WASM device of 9,216 and of 288 samples, the compressor, the filter, the gate and de-noise, and on a second strip the engine delays by 9,216 and by 288 samples, at 48 and 44.1 kHz and in one channel, each the noise that many samples late, sample for sample. Not tried: another browser, a playing engine, and a rack's own delay lines, which are as they were (docs/concepts/render.md).
