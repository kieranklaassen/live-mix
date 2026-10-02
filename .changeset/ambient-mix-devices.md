---
'@kieranklaassen/live-mix': minor
---

Three mix devices made for ambient sound, and readings a device can report about its own work.

- `ambient-eq`: broad tone controls (low cut, low, body, presence, air, high cut) and Clear, a slow spectral compressor that turns down a band that rings on above its neighbours once layers and reverbs have built up, and leaves a lone note alone.
- `ambient-comp`: a seconds-scale leveller. Its detector ignores what is under a set frequency, so sub rumble does not drive it; with Tails on Hold it stops releasing while a sound dies away, so a tail keeps its own shape; a low drone passes without distortion at its fastest settings.
- `ambient-limiter`: the true-peak brickwall behind a slow ride stage that turns a sustained over down smoothly first, so a drone leaning on the ceiling stays clean and one loud moment is soon over. 77 samples of latency at every sample rate (`TruePeakLimiter::prepare` takes an optional fixed lookahead in frames).
- Meters: a spec device's manifest takes `meters`, its class a `float meter(int index) const`, and the module exports `device_meter`. `WasmDevice` is then a `MeteredDevice` (`meters`, `meter(name)`, `watchMeters()`; `isMeteredDevice`, `DeviceMeterSpec`), the worklet posts the readings 30 times a second (`DEVICE_METER_HZ`) only while something watches, `useDeviceMeter(device, name)` samples one on frames, a descriptor carries `meters`, and `DevicePanel` shows each reading in its title bar while the device is on. All three devices report `reduction` in dB.
