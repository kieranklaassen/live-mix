// The waveform model over a stand-in session: what the session is fed, how
// its one answer becomes the stems, a track run through the segment runner
// and `separateTrack`, and what is refused. That the conventions are a real
// export's is shown by a run of one (scripts/try-separation.mjs), not here.

import { describe, expect, it } from 'vitest'

import { createSegmentSeparator } from '../segments'
import { separateTrack } from '../separate'
import { STEM_NAMES, SeparationError, type ModelSession } from '../types'
import { createWaveformModel, type WaveformModelSpec } from '../waveform-model'
import { differenceDb, noise, summed } from './support'

class Tensor {
  constructor(
    readonly type: 'float32',
    readonly data: Float32Array,
    readonly dims: readonly number[],
  ) {}
}

/** A small model, so a test can afford every frame. The stems are in the order of its tensor. */
const FOUR: WaveformModelSpec = {
  sampleRate: 44100,
  segmentFrames: 1024,
  stems: ['drums', 'bass', 'other', 'vocals'],
}
const SIX: WaveformModelSpec<string> = {
  ...FOUR,
  stems: ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'],
}

/**
 * A session that answers what `answer` makes of the one tensor it was fed,
 * and by default each stem as that tensor times its own gain: 0.04 for
 * the first stem of the spec, 0.08 for the second, and so on.
 */
function session(
  spec: WaveformModelSpec<string>,
  answer: (fed: Tensor) => Float32Array = (fed) => {
    const out = new Float32Array(spec.stems.length * fed.data.length)
    spec.stems.forEach((_name, stem) => {
      const gain = gainOf(stem)
      fed.data.forEach((sample, i) => {
        out[stem * fed.data.length + i] = sample * gain
      })
    })
    return out
  },
): ModelSession<Tensor> & { feeds: Record<string, Tensor>[] } {
  const feeds: Record<string, Tensor>[] = []
  return {
    feeds,
    inputNames: ['mix'],
    outputNames: ['stems'],
    run: (fed) => {
      feeds.push(fed)
      return Promise.resolve({
        stems: new Tensor('float32', answer(fed.mix), [
          1,
          spec.stems.length,
          2,
          spec.segmentFrames,
        ]),
      })
    },
  }
}

/** The gain the default session answers the stem at `stem` of its tensor with. */
const gainOf = (stem: number): number => (stem + 1) / 25

/** `channel` times `gain`, worked out in single precision as the session works it out. */
const times = (channel: Float32Array, gain: number): Float32Array =>
  Float32Array.from(channel, (sample) => sample * gain)

describe('a waveform model run through a host’s session', () => {
  it('feeds the session one tensor of the segment’s two channels, the left one first', async () => {
    const fed = session(FOUR)
    const model = createWaveformModel({ Tensor, session: fed }, FOUR)
    expect(model.sampleRate).toBe(44100)
    expect(model.segmentFrames).toBe(1024)
    const left = noise(1024, 1)
    const right = noise(1024, 2)
    await model.run([left, right])
    expect(fed.feeds.length).toBe(1)
    expect(Object.keys(fed.feeds[0])).toEqual(['mix'])
    expect(fed.feeds[0].mix.type).toBe('float32')
    expect(fed.feeds[0].mix.dims).toEqual([1, 2, 1024])
    expect(fed.feeds[0].mix.data.length).toBe(2 * 1024)
    expect(fed.feeds[0].mix.data.subarray(0, 1024)).toEqual(left)
    expect(fed.feeds[0].mix.data.subarray(1024)).toEqual(right)
  })

  it.each([
    ['four', FOUR],
    ['six', SIX],
  ])(
    'answers each of %s stems as the plane of the session’s answer in its spec’s order',
    async (_count, spec) => {
      const model = createWaveformModel({ Tensor, session: session(spec) }, spec)
      const left = noise(1024, 3)
      const right = noise(1024, 4)
      const stems = await model.run([left, right])
      expect(Object.keys(stems).sort()).toEqual([...spec.stems].sort())
      spec.stems.forEach((name, stem) => {
        expect(stems[name][0]).toEqual(times(left, gainOf(stem)))
        expect(stems[name][1]).toEqual(times(right, gainOf(stem)))
      })
    },
  )

  it('says the four in the order a desk lists them, whatever order its spec answers them in', () => {
    const made = (spec: WaveformModelSpec) =>
      createWaveformModel({ Tensor, session: session(spec) }, spec).stems
    expect(made(FOUR)).toEqual([...STEM_NAMES])
    expect(made({ ...FOUR, stems: ['other', 'bass', 'vocals', 'drums'] })).toEqual([...STEM_NAMES])
  })

  it('says other stems in the order its spec answers them in', () => {
    const model = createWaveformModel({ Tensor, session: session(SIX) }, SIX)
    expect(model.stems).toEqual(['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'])
  })

  it('is run on a track brought to a standard level', () => {
    const model = createWaveformModel({ Tensor, session: session(FOUR) }, FOUR)
    expect(model.standardize).not.toBe(false)
  })

  it('gives parts that add up to a track several segments long, through the runner and separateTrack', async () => {
    const frames = 5000
    const left = noise(frames, 5)
    const right = noise(frames, 6)
    const track = { channels: [left, right], sampleRate: 44100 }
    const model = createWaveformModel({ Tensor, session: session(SIX) }, SIX)
    const separation = await separateTrack(track, createSegmentSeparator(model))
    expect(separation.names).toEqual(SIX.stems)
    // The runner takes the mean of the track as one channel out and gives
    // the level back, so a stem is the track less that mean, times its gain.
    // Measured here: the stem furthest from that is 154.78 dB under it. The
    // line is drawn 6 dB over.
    let sum = 0
    for (let i = 0; i < frames; i += 1) sum += (left[i] + right[i]) / 2
    const mean = sum / frames
    SIX.stems.forEach((name, stem) => {
      for (const channel of [0, 1]) {
        const expected = Array.from(track.channels[channel], (x) => (x - mean) * gainOf(stem))
        expect(differenceDb(separation.stems[name][channel], expected)).toBeLessThan(-148)
      }
    })
    // Seven parts added in single precision. Measured here: the sum is
    // 150.51 dB under the track, and without the quietest stem it is
    // 33.96 dB under. The line is drawn 6 dB over the first.
    for (const channel of [0, 1]) {
      const whole = differenceDb(summed(separation, channel), track.channels[channel])
      const broken = differenceDb(summed(separation, channel, 'drums'), track.channels[channel])
      expect(whole).toBeLessThan(-144)
      expect(broken).toBeGreaterThan(-144)
    }
  })

  it('refuses a session that does not take one input and give one output', () => {
    const two = { ...session(FOUR), inputNames: ['mix', 'mix_spectrogram'] }
    expect(() => createWaveformModel({ Tensor, session: two }, FOUR)).toThrow(SeparationError)
    expect(() => createWaveformModel({ Tensor, session: two }, FOUR)).toThrow(/2 inputs/)
    const outputs = { ...session(FOUR), outputNames: ['stems', 'stems_spectrogram'] }
    expect(() => createWaveformModel({ Tensor, session: outputs }, FOUR)).toThrow(/2 outputs/)
  })

  it('refuses an answer one frame short, and says what it found', async () => {
    const short = session(FOUR, () => new Float32Array(4 * 2 * 1024 - 1))
    const run = createWaveformModel({ Tensor, session: short }, FOUR).run([
      noise(1024, 7),
      noise(1024, 8),
    ])
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/"stems".*8191.*8192/)
  })

  it('refuses a spec that names a stem twice, and names the stem', () => {
    const spec = { ...FOUR, stems: ['drums', 'bass', 'other', 'other'] } as WaveformModelSpec
    const make = () => createWaveformModel({ Tensor, session: session(spec) }, spec)
    expect(make).toThrow(SeparationError)
    expect(make).toThrow(/name other twice/)
  })
})
