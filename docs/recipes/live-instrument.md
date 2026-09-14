# Recipe: an ambient-live-style live instrument with MIDI

A performer paints clips onto a looping timeline, plays a synth from a MIDI
keyboard, plugs in a guitar and monitors it through the same mix, and maps
knobs to anything — F2 in the plan, the shape ambient-live runs today
([consumer guide](../consumers/ambient-live.md)).

## 1. A looping engine with the smallest buffer

```ts
import { createEngine } from '@kieranklaassen/live-mix'

// From the start gesture; `interactive` asks for the smallest output buffer.
const context = new AudioContext({ latencyHint: 'interactive' })
await context.resume()

const engine = createEngine({
  context,
  master: { gain: 0.8, meter: true },
  samples: { peaks: true }, // waveforms for the timeline (512 buckets)
  loop: { enabled: true, lengthSec: 32 }, // the canvas the timeline paints onto
  tickMs: 40, // scheduler period; 200 ms lookahead
})
```

## 2. Three tracks into one plate

```ts
import { createDattorroReverb, createFeltPiano } from '@kieranklaassen/live-mix/dsp'

const plate = await createDattorroReverb(context, { params: { mix: 0.35 } })
engine.master.addInsert(plate) // the global reverb law: dry·(1−mix) + wet·mix

const piano = await createFeltPiano(context, { params: { polyphony: 12 } }) // kkfonie's Felt, a NoteDevice
const synth = engine.addInstrumentTrack('synth', { device: piano })
const clips = engine.addAudioTrack('clips', { lookaheadSec: 0.2 })
const input = engine.addLiveInputTrack('input') // node-free until a stream arrives
```

An app's own instrument works the same way: any object satisfying
`NoteDevice` (`input`, `output`, `params`, `setParam`, `bypass`, `noteOn`,
`noteOff`, `dispose`) — ambient-live's WASM sample-voice synth is one, hosted
by the library's `WasmDevice` machinery.

## 3. Paint clips onto the loop

```ts
const loaded = await engine.samples.load('42', fileBytes) // decoded once; peaks for the waveform
clips.clips.add({
  id: 'region-1',
  sourceId: '42',
  startSec: 3.5, // where it was dropped on the 32 s canvas
  offsetSec: 0,
  durationSec: loaded.durationSec,
  fadeInSec: 0.05,
  fadeOutSec: 0.2,
  fadeCurve: 'equalPower',
  gainDb: 0,
})
engine.transport.start()
```

The scheduler hands each clip start to the graph inside the lookahead window,
wrapping into the next loop pass, joins a clip mid-way when the transport
lands inside it (a seek, a throttled tab), and never double-fires — the
`clipId:iteration:startSec` key. `TimelineView` from the kit draws
`sounding`/`upcoming` from the same window function ([react](../react.md)).

## 4. Keys

```ts
import { MidiInput, controlEventsFromMidi, isMapped } from '@kieranklaassen/live-mix'

const midi = new MidiInput() // navigator.requestMIDIAccess
await midi.open()
midi.onMessage((message) => {
  if (message.type === 'note-on' && !isMapped(surface.table, controlEventsFromMidi(message)[0])) {
    synth.noteOn(message.note, 440 * 2 ** ((message.note - 69) / 12), message.velocity / 127)
  } else if (message.type === 'note-off') {
    synth.noteOff(message.note)
  }
})
```

A pad that is mapped to a control (step 6) never reaches the synth — that is
what `isMapped` is for.

## 5. Plug in a guitar

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
})
input.attach(stream) // monitored through the same mix; nothing buffers it
input.strip.setMute(true) // monitor off (ramped); setMute(false) to hear it
input.strip.addInsert(await createZitaReverb(context, { params: { mix: 0.2 } }))
engine.ioLatency() // { baseSec, outputSec, inputSec, totalSec } — what the browser adds
```

The browser's voice processing would colour and delay an instrument, hence
the three constraints off. ambient-live's probe measures the actual round
trip with a chirp through the input (21.6 ms in-graph loopback in headless
Chrome; the real-machine number and method are in its
`docs/live-input-latency.md`). `engine.alignLatency()` never delays a live
input, so monitoring stays immediate while clip and instrument tracks line up
with the master's plugins.

## 6. Map the knobs

```ts
import { ControlSurface } from '@kieranklaassen/live-mix'

const surface = new ControlSurface({ engine, levelMax: 1.5 })
surface.registerDevice('plate', plate) // → { kind: 'device', device: 'plate', param: 'mix' | 'decay' | … }
surface.connect(midi) // every MIDI event → surface.handle

surface.beginLearn({ kind: 'device', device: 'plate', param: 'mix' }) // turn a knob: bound
surface.beginLearn({ kind: 'strip', track: 'input', control: 'mute' }, { mode: 'toggle' }) // hit a pad: monitor on/off
surface.map({
  source: { kind: 'cc', controller: 74, channel: 1 },
  target: { kind: 'master' },
  pickup: true,
}) // soft takeover
surface.persist(localStorage, { key: 'my-app:midi-map' }) // versioned JSON, restored on load
```

Every write ramps through the engine's own setters; a knob learned onto a
parameter that a lane automates overrides it with cancel-and-hold until
`surface.release(target)`. ambient-live's stored U27 tables migrate with
`ambientLiveMidiMapMigration` ([control-surface](../concepts/control-surface.md)).
OSC works the same way through `OscInput({ url: 'ws://…' })`.

## 7. Bounce the loop

```ts
import { renderOffline, wavBlob } from '@kieranklaassen/live-mix'

const bounce = await renderOffline({
  durationSec: 32,
  engine: { loop: { enabled: true, lengthSec: 32 } },
  build: async (offline) => {
    offline.master.addInsert(await createDattorroReverb(offline.context, { params: { mix: 0.35 } }))
    const track = offline.addAudioTrack('clips', { lookaheadSec: 0.2 })
    await offline.samples.load('42', fileBytes)
    track.clips.set(clips.clips.all())
  },
})
save(wavBlob(bounce.audio, { bitDepth: 24 }))
```

Live input is not in a bounce (nothing to render); record it instead:
`createRecorder(context, input)` → `stop()` → a new clip source
([render](../concepts/render.md#recording)).

## 8. UI

`LiveMixProvider` + `MixerView`, `DeviceChainView` for the plate and the
input chain, `TimelineView` over `clips`, `useLearn(surface, target)` on each
knob for the learn button — or your own components over `useStrip`,
`useDeviceParam`, `useSchedule` and `useMeter`, with the `ambientWater`
token set to keep the app's palette ([react](../react.md)).
