import { createEngine } from '@kieranklaassen/live-mix'
import { createDattorroReverb } from '@kieranklaassen/live-mix/dsp'

// Browsers start audio after a user gesture: run this from a click handler.
const engine = createEngine({ context: new AudioContext(), master: { meter: true } })

// A bus for everything that should duck under the voice, and a track on it.
// Clips are plain records in seconds; the scheduler hands them to the graph
// ahead of time and never plays one twice.
const music = engine.addBus('music')
const track = engine.addAudioTrack('track', { destination: music, lookaheadSec: 5 })
await engine.samples.load('intro', '/music/intro.mp3')
track.clips.add({
  id: 'intro-1',
  sourceId: 'intro',
  startSec: 0,
  offsetSec: 0,
  durationSec: 180,
  fadeInSec: 2,
  fadeOutSec: 2,
  fadeCurve: 'equalPower',
  gainDb: -3,
})

// A send into a reverb return. The plate is C++ compiled to WASM, running in an AudioWorklet.
const hall = engine.addReturnTrack('hall', { device: await createDattorroReverb(engine.context) })
track.strip.sends.add(hall, { level: 0.3 })

// A live input — microphone, WebRTC voice, guitar — that ducks the music bus while it sounds.
const ducker = engine.addDucker(music)
const voice = engine.addLiveInputTrack('voice')
voice.onAttach((source) => ducker.key(source))
voice.attach(await navigator.mediaDevices.getUserMedia({ audio: true }))

engine.transport.start()
