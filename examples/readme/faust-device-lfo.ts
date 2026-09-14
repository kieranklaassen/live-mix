import { Lfo, createEngine, deviceParamTarget } from '@kieranklaassen/live-mix'
import { createZitaReverb } from '@kieranklaassen/live-mix/dsp'

const engine = createEngine({ context: new AudioContext() })
const keys = engine.addAudioTrack('keys')

// Faust's zita-rev1, compiled to WASM and hosted in an AudioWorklet. Every
// device kind shares one contract: typed params, setParam, bypass, latency.
const hall = await createZitaReverb(engine.context, { params: { mix: 0.25, midDecay: 3 } })
keys.strip.addInsert(hall)
hall.setParam('damping', 4000) // clamped to the ParamSpec range, smoothed inside the DSP

// A free-running LFO on the audio clock swings the mix by ±20 % of its range
// around the current value. The UI can draw the same curve with renderModulator.
const drift = new Lfo({ rateHz: 0.08, shape: 'sine' })
engine.modulation.map(drift, deviceParamTarget(hall, 'mix'), { depth: 0.2, polarity: 'bipolar' })
