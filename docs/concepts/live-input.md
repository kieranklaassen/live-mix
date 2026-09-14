# Live input and ducking

A live input is a pass-through track (R16): any `MediaStream` (a microphone,
a guitar interface, the coach's WebRTC voice) or any `AudioNode` gets inserts,
sends, pan, fader, mute and solo like every other track — and **never crosses
the lookahead path**. Nothing buffers it; the only latency is the browser's
own.

```ts
const voice = engine.addLiveInputTrack('voice') // node-free until attached
const stream = await navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
})
voice.attach(stream) // a second attach replaces the first
voice.strip.setMute(true) // monitoring off: the strip's gate ramps, no click
voice.sends.add(hall, { level: 0.26 }) // pre-fader, from the raw source (Phase 0 semantics)
voice.strip.sends.add(hall) // or post-fader, through the strip
voice.onAttach((source) => ducker.key(source)) // re-key on every (re)connect
voice.detach()
engine.ioLatency() // { baseSec, outputSec, inputSec, totalSec }
```

The browser's voice processing colours and delays an instrument, so
ambient-live captures with the three constraints above off and opens its
context with `latencyHint: 'interactive'`. Its measured round trip in headless
Chrome is 21.6 ms through an in-graph loopback; the real-machine acceptance
(≤ ~50 ms by feel) and the probe method are in ambient-live's
`docs/live-input-latency.md` ([consumer guide](../consumers/ambient-live.md)).
`engine.alignLatency()` never delays a live input unless asked
(`{ liveInputs: true }`, which the offline renderer does), so monitoring stays
immediate while everything else lines up.

## Voice-keyed ducking (R17)

The coach speaks, the music dips within the attack and recovers within the
release when the coach stops; the breath guide on its own bus is unaffected
when so configured (AE9). Two implementations, one contract
(`SidechainDucker`: `key`, `unkey`, `stop`, `dispose`, `envelope`):

**Legacy (default, Phase 0).** `engine.addDucker(bus)` is Breathwork Live's
main-thread envelope follower moved into a device with identical constants
and `setTargetAtTime` calls: an analyser on the key polled every `ENV_POLL_MS`
(60 ms) on the engine clock, writing the bus fader. Its recorded `AudioParam`
events are byte-identical to the app's former engine — the parity harness
depends on it — which is why it is still the default.

**Worklet (opt-in, U17).** `mode: 'worklet'` swaps in the audio-thread
`WorkletDucker`: a two-input `AudioWorkletNode` (signal, key) inserted
post-fader into the bus, envelope and gain computed per sample with the same
defaults (depth 0.68, attack 80 ms, release 800 ms, key scale 4, gain time
constant 80 ms) plus a hold, no timers. Load the processor once per context
from the dsp entry:

```ts
import { loadDuckerProcessor } from '@kieranklaassen/live-mix/dsp'

await loadDuckerProcessor(engine.context) // once, before the first worklet ducker
const ducker = engine.addDucker(music, { mode: 'worklet', holdMs: 120 })
voice.onAttach((source) => ducker.key(source))
ducker.setParam('depth', 0.5) // params: depth, attackMs, holdMs, releaseMs, gainScale, timeConstant
```

Measured against the legacy follower (0.5 RMS burst, 48 kHz): the same floor
(0.32), trajectories within 0.045 after removing the poll's 0–60 ms
observation latency, −6 dB at 134 ms (worklet) vs 166 ms (legacy). Two
behavioural differences by design: worklet `unkey()` releases to unity
(legacy freezes at the last target); worklet mode adds one node post-fader in
the bus chain, so `bus.removeInsert(ducker)` before disposing it mid-session.
`DuckerKernel` is the same DSP as a plain class over `Float32Array` blocks
(offline renders, tests); `createWorkletDucker(ctx, options)` builds a
standalone device for `bus.addInsert`; the registry lists it as `ducker`. Only
the worklet ducker can run in an offline bounce — main-thread followers have
no clock there ([render](./render.md)).

## Recording a live input

`createRecorder(ctx, source)` taps a track, bus or the master through the
recorder worklet (sample-exact planar chunks) or `MediaRecorder` (compressed
formats) without inserting anything into the audible path; `stop()` resolves
audio to encode with `encodeWav` or to load into the `SampleStore` as a new
clip (R23) — [render](./render.md#recording).
