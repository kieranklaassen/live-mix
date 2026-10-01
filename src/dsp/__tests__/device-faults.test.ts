// The six device faults the factory bench found (docs/factory.md, "What the
// bench found in the devices"), each measured the way the bench measured it,
// on the committed artefacts. The native harnesses hold the devices to the
// details; this holds the modules a browser loads to the outcome.

import { describe, expect, it } from 'vitest'

import { type Patch, type PatchDevice } from '../../core/devices/patch'
import { type PlanarAudio } from '../../core/render/encode'
import { CHAIN_PREVIEW_PATCH, CHAIN_PREVIEW_PHRASE } from '../factory/phrases'
import { type Phrase, renderPatch } from '../patch-render'
import { compileFromDisk, measureAudio } from './render-support'

const SAMPLE_RATE = 48000

const chain = (...effects: PatchDevice[]): Patch => ({
  id: 'fault',
  name: 'fault',
  category: 'test',
  description: '',
  effects,
})

const through = (patch: Patch, input: PlanarAudio, durationSec: number) =>
  renderPatch(patch, { input, durationSec, compile: compileFromDisk, sliceMs: 0 })

const played = (instrument: PatchDevice, phrase: Phrase, durationSec: number) =>
  renderPatch(
    { ...chain(), instrument },
    { phrase, durationSec, compile: compileFromDisk, sliceMs: 0 },
  )

function stereo(seconds: number, sample: (frame: number) => number): PlanarAudio {
  const left = Float32Array.from({ length: Math.round(seconds * SAMPLE_RATE) }, (_, i) => sample(i))
  return { sampleRate: SAMPLE_RATE, channels: [left, left.slice()] }
}

const tone = (hz: number, gain: number, seconds: number) =>
  stereo(seconds, (i) => gain * Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE))

/** The dry piano phrase every factory chain is measured on. */
const dryPhrase = () =>
  renderPatch(CHAIN_PREVIEW_PATCH, {
    phrase: CHAIN_PREVIEW_PHRASE,
    durationSec: 10,
    compile: compileFromDisk,
    sliceMs: 0,
  })

describe('device faults found by the factory bench', () => {
  it('ether-reverb "Frozen" holds the first sound it is given instead of staying silent', async () => {
    const frozen = measureAudio(
      await through(chain({ deviceId: 'ether-reverb', preset: 'Frozen' }), await dryPhrase(), 10),
    )
    expect(frozen.lufs).toBeGreaterThan(-24)
    // Still ringing at the end: the last half second within 6 dB of the loudest part.
    expect(frozen.tailDb).toBeGreaterThan(-6)
  })

  it('limiter-1176 stops a click at full scale', async () => {
    const click = stereo(0.5, (i) => (i === 4800 ? 10 ** (-6 / 20) : 0))
    for (const inputGain of [12, 24]) {
      const out = await through(
        chain({ deviceId: 'limiter-1176', params: { inputGain } }),
        click,
        0.5,
      )
      expect(measureAudio(out).peakDb).toBeLessThanOrEqual(0)
    }
  })

  it('saturator keeps a clipped low note and a driven phrase at its ceiling', async () => {
    const low = tone(41, 0.9, 1)
    const phrase = await dryPhrase()
    for (const curve of [0, 1, 2, 3]) {
      const params = { curve, driveDb: 24, outputDb: 0, dcBlock: 1 }
      const note = await through(chain({ deviceId: 'saturator', params }), low, 1)
      expect(measureAudio(note).peakDb).toBeLessThan(0.1)
      const driven = await through(chain({ deviceId: 'saturator', params }), phrase, 10)
      expect(measureAudio(driven).peakDb).toBeLessThan(0.1)
    }
  })

  it('ember presets with an off-centre pulse carry no DC', async () => {
    const held: Phrase = { notes: [{ atSec: 0, durSec: 3.5, note: 57 }] }
    for (const preset of ['Glass pad', 'Dark drone']) {
      const out = await played({ deviceId: 'ember', preset }, held, 4)
      const settled = out.channels.map((channel) => channel.subarray(SAMPLE_RATE, 3 * SAMPLE_RATE))
      expect(
        Math.abs(measureAudio({ sampleRate: SAMPLE_RATE, channels: settled }).dc),
      ).toBeLessThan(0.001)
    }
  })

  it("grain-synth's built-in sound folds to mono at every position", async () => {
    const held: Phrase = { notes: [{ atSec: 0, durSec: 5, note: 60 }] }
    for (const position of [0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]) {
      const out = await played(
        { deviceId: 'grain-synth', params: { position, spread: 0 } },
        held,
        6,
      )
      // Side under mid by 3 dB or more; it was 4 to 5 dB over from 0.3 to 0.6.
      expect(measureAudio(out).widthDb).toBeLessThan(-3)
    }
  })

  it('zita-rev1 presets come out as loud as what goes in', async () => {
    const dry = await dryPhrase()
    const dryLufs = measureAudio(dry).lufs
    for (const preset of ['Room', 'Hall', 'Cathedral']) {
      const wet = measureAudio(await through(chain({ deviceId: 'zita-rev1', preset }), dry, 10))
      expect(Math.abs(wet.lufs - dryLufs)).toBeLessThan(1.5)
    }
    const fullyWet = await through(chain({ deviceId: 'zita-rev1', params: { mix: 1 } }), dry, 10)
    expect(Math.abs(measureAudio(fullyWet).lufs - dryLufs)).toBeLessThan(1.5)
  })
})
