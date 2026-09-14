import { createEngine, type Clip } from '@kieranklaassen/live-mix'
import { loadDuckerProcessor } from '@kieranklaassen/live-mix/dsp'

// A 32-second loop with two layers: the transport re-pins on every pass, and
// a clip that starts at 0 restarts with it.
const engine = createEngine({ context: new AudioContext(), loop: { enabled: true, lengthSec: 32 } })
const music = engine.addBus('music')
const calm = engine.addAudioTrack('calm', { destination: music })
const tense = engine.addAudioTrack('tense', { destination: music })

await engine.samples.load('calm', '/loops/calm.mp3')
await engine.samples.load('tense', '/loops/tense.mp3')
const layer = (sourceId: string): Clip => ({
  id: sourceId,
  sourceId,
  startSec: 0,
  offsetSec: 0,
  durationSec: 32,
  fadeInSec: 0.02,
  fadeOutSec: 0.02,
  fadeCurve: 'equalPower',
  gainDb: 0,
})
calm.clips.add(layer('calm'))
tense.clips.add(layer('tense'))
tense.strip.setLevel(0)

// Crossfade the layers from game state, a sensor, a model. Every level change is a ramp.
export function setTension(amount: number): void {
  const angle = (Math.min(1, Math.max(0, amount)) * Math.PI) / 2
  calm.strip.setLevel(Math.cos(angle), { timeConstant: 1.5 })
  tense.strip.setLevel(Math.sin(angle), { timeConstant: 1.5 })
}

// Duck the whole music bus under a microphone, on the audio thread.
await loadDuckerProcessor(engine.context)
const ducker = engine.addDucker(music, { mode: 'worklet', holdMs: 150 })
const mic = engine.addLiveInputTrack('mic')
mic.strip.setMute(true) // the microphone keys the ducker; it is not played back
mic.onAttach((source) => ducker.key(source))
mic.attach(await navigator.mediaDevices.getUserMedia({ audio: true }))

engine.transport.start()
