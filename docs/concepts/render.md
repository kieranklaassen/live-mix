# Rendering, stems, export and recording

**Deterministic and testable** (Goals): the same score renders identically
live and offline, and behaviour is asserted at the `AudioParam` boundary and
in rendered goldens (R22, KTD15). The offline renderer is the second renderer
of the score ([score](./score.md)); it is also how the library proves itself
in Node.

## Offline render

```ts
import { renderOffline, wavBlob } from '@kieranklaassen/live-mix'

const result = await renderOffline({
  durationSec: 240,
  sampleRate: 48_000, // default
  numberOfChannels: 2, // default
  startSec: 0, // timeline position to start from
  engine: { samples: { peaks: false }, devices }, // any EngineOptions but context and clock
  build: async (engine, { stem, sampleRate, durationSec }) => {
    // Exactly what the app does live: tracks, samples, clips, devices, lanes.
    await engine.samples.load('a', '/music/a.mp3')
    engine.addAudioTrack('music').clips.add(clipA)
  },
})
result.audio // PlanarAudio: { channels: Float32Array[], sampleRate }
result.buffer // the AudioBuffer
result.latency // LatencyReport after alignment
result.engine.dispose() // left intact for inspection; yours to dispose
download(wavBlob(result.audio, { bitDepth: 24 }))
```

`renderOffline` builds the same engine on an `OfflineAudioContext`, replaces
the timers with a virtual clock (`tickSec`, default 50 ms) and pre-schedules
the whole arrangement — scheduler and automation ticks stepped through the
duration plus lookahead — before `startRendering()`. A bounce is therefore a
pure function of the arrangement: identical every run, and identical **at the
level of every source start and `AudioParam` event** to what the live engine
tells its graph. `engine.alignLatency({ liveInputs: true })` runs after the
build so plugin-delay compensation is the same in every render;
`alignLatency: false` skips it. `createContext` is injectable, which is how
the render-equals-live golden runs on the recording mocks in Node; the
real-audio version runs in headless Chrome (`pnpm test:browser`, below).

What cannot render offline: main-thread followers (the legacy `Ducker`,
analyser `Meter` readings) have no clock there — use the worklet ducker for
bounces with sidechain ducking; live-input tracks and element tracks (media
elements play in real time only) are dropped by `renderableScore` with the
lanes and routes on them. WASM devices and worklets do run offline (Chromium,
Firefox); the playground's "Render offline" button bounces its demo through
the Dattorro plate and StereoWidener.

## Stems

`renderStems({ stems: ['music', 'voice'], …build })` renders the master plus
one **solo-in-place** pass per named track: the build runs once per stem
(`info.stem` tells it which), the track is soloed, and returns follow the
solo tree, so a stem carries its own reverb tail. Every stem shares the
alignment of the master render, so they sum back to it.

## Score bounces

`renderScore(score, { durationSec, … })` and `renderScoreStems(score, { stems })`
load a document onto the offline engine through the same `ScoreRenderer` the
live engine uses — F4 in the plan: a planning LLM emits a score, the bounce
and the live session are two renders of it ([score.md § Bouncing](../score.md#bouncing-a-score-u33)).

## Encoding

`encodeWav(planar, { bitDepth: 16 | 24 | 32 })` writes PCM or float WAV in
one pass (`audioBufferToWav`, `wavBlob`; `decodeWav`/`readWavInfo` for tests
and imports; `interleave`/`deinterleave`/`planarFromAudioBuffer` for the
plumbing). Compressed formats come from the browser: the `media-recorder`
mode below.

## Recording

Recorders are **taps** — nothing is inserted into the audible path (R23):

```ts
import { createRecorder, encodeWav } from '@kieranklaassen/live-mix'

const take = createRecorder(engine.context, engine.master) // or a track, a bus, any { output } / AudioNode
take.start()
const { audio, durationSec } = await take.stop() // planar, sample-exact
await engine.samples.load('take-1', encodeWav(audio)) // decoded again → a new clip source
take.dispose()

const clip = createRecorder(engine.context, voice, {
  mode: 'media-recorder',
  mimeType: 'audio/webm',
})
clip.start()
const { blob } = await clip.stop() // a Blob the browser encoded
```

The default `worklet` mode taps through `worklets/recorder.js`, which posts
planar chunks (`chunkFrames`, default `DEFAULT_RECORDER_CHUNK_FRAMES`);
`media-recorder` feeds a `MediaStreamAudioDestinationNode` into
`MediaRecorder`. Recorded input sits `report.maxArrivalSamples` early relative
to the aligned mix ([devices § latency](./devices.md#latency-and-delay-compensation));
compensate by that offset when the take becomes a clip.

## Goldens

Four layers. In `pnpm test`: the recording mocks assert every `AudioParam`
event the graph is told (Breathwork Live's parity harness runs against them),
and the render-equals-live goldens compare an offline render's source starts
and events with a live engine following the same build or the same score.
`pnpm test:native` compares each WASM device's DSP with its origin in C++,
and the committed `.wasm` must reproduce byte-for-byte with the pinned emsdk.
And `pnpm test:browser` (`browser-tests/`, Playwright over the installed
Chrome) is the **real-audio golden**: a page over the built package with a
Web Audio call recorder proves that a real `OfflineAudioContext` receives
exactly the source starts and `AudioParam` calls the Node mocks record for
the same session, that audio flows through the real worklets and WASM (a
Dattorro return included), and that a live capture of the same session
through the recorder worklet matches the offline render within 1.5 dB RMS /
3 dB per band. Its first catch changed the lane writers: a ramp issued after
its segment had begun renders as a jump, so `LaneWriter` now hands each
segment to the graph whole as soon as the write window reaches into it.
