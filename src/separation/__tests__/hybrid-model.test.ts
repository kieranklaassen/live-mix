// The hybrid model over a stand-in session: what the session is fed, how its
// two answers become four stems, and what is refused. That the conventions
// are the real model's is shown by a run of a real export
// (scripts/try-separation.mjs), not here.

import { describe, expect, it } from 'vitest'

import { HYBRID_MODEL_SPEC, createHybridModel, type HybridModelSpec } from '../hybrid-model'
import { createSegmentTransform } from '../stft'
import { STEM_NAMES, SeparationError, type ModelSession } from '../types'
import { differenceDb, noise, peak, sine } from './support'

class Tensor {
  constructor(
    readonly type: 'float32',
    readonly data: Float32Array,
    readonly dims: readonly number[],
  ) {}
}

/** A small model, so a test can afford every frame: 64 frames of 128 bins for a segment of 4096. */
const SMALL: HybridModelSpec = {
  sampleRate: 44100,
  segmentFrames: 4096,
  fftSize: 256,
  hop: 64,
  stems: ['drums', 'bass', 'other', 'vocals'],
}
const BINS = 128
const FRAMES = 64
/** One channel's real and imaginary parts. */
const PLANE = 2 * BINS * FRAMES

interface Answer {
  spectrogram?: Float32Array
  waveform?: Float32Array
}

/** A session that answers with what `answer` makes of the two tensors it was fed. */
function session(
  answer: (waveform: Tensor, spectrogram: Tensor) => Answer,
  spec: HybridModelSpec<string> = SMALL,
): ModelSession<Tensor> & { feeds: Record<string, Tensor>[] } {
  const bins = spec.fftSize / 2
  const frames = Math.ceil(spec.segmentFrames / spec.hop)
  const stems = spec.stems.length
  const feeds: Record<string, Tensor>[] = []
  return {
    feeds,
    inputNames: ['mix', 'mix_spectrogram'],
    outputNames: ['stems_spectrogram', 'stems'],
    run: (fed) => {
      feeds.push(fed)
      const made = answer(fed.mix, fed.mix_spectrogram)
      return Promise.resolve({
        stems_spectrogram: new Tensor(
          'float32',
          made.spectrogram ?? new Float32Array(stems * 4 * bins * frames),
          [1, stems, 4, bins, frames],
        ),
        stems: new Tensor(
          'float32',
          made.waveform ?? new Float32Array(stems * 2 * spec.segmentFrames),
          [1, stems, 2, spec.segmentFrames],
        ),
      })
    },
  }
}

/** Sound with nothing at the very top, which the transform drops. */
const sound = (hz: number): Float32Array => sine(SMALL.segmentFrames, hz, 44100, 0.4)

describe('a hybrid model run through a host’s session', () => {
  it('feeds the session a waveform and its spectrogram, in the order of its inputs', async () => {
    const fed = session(() => ({}), HYBRID_MODEL_SPEC)
    const model = createHybridModel({ Tensor, session: fed })
    expect(model.segmentFrames).toBe(343980)
    expect(model.sampleRate).toBe(44100)
    const left = noise(343980, 1)
    const right = noise(343980, 2)
    await model.run([left, right])
    expect(Object.keys(fed.feeds[0])).toEqual(['mix', 'mix_spectrogram'])
    expect(fed.feeds[0].mix.dims).toEqual([1, 2, 343980])
    expect(fed.feeds[0].mix_spectrogram.dims).toEqual([1, 4, 2048, 336])
    expect(fed.feeds[0].mix.data.subarray(0, 343980)).toEqual(left)
    expect(fed.feeds[0].mix.data.subarray(343980)).toEqual(right)
    expect(fed.feeds[0].mix_spectrogram.data.length).toBe(4 * 2048 * 336)
  })

  it('feeds each channel’s spectrogram as its real parts and then its imaginary ones', async () => {
    const fed = session(() => ({}))
    const left = sound(440)
    const right = sound(1500)
    await createHybridModel({ Tensor, session: fed }, SMALL).run([left, right])
    const transform = createSegmentTransform(SMALL.segmentFrames, SMALL.fftSize, SMALL.hop)
    const expected = new Float32Array(2 * PLANE)
    transform.forward(left, expected, 0)
    transform.forward(right, expected, PLANE)
    expect(fed.feeds[0].mix_spectrogram.data).toEqual(expected)
  })

  it('makes a stem of a spectrogram the session answers: the mix’s own gives the mix back', async () => {
    // The third stem is answered the mix's own spectrogram, and nothing else is.
    const fed = session((_waveform, spectrogram) => {
      const answered = new Float32Array(4 * 2 * PLANE)
      answered.set(spectrogram.data, 2 * 2 * PLANE)
      return { spectrogram: answered }
    })
    const left = sound(440)
    const right = sound(1500)
    const stems = await createHybridModel({ Tensor, session: fed }, SMALL).run([left, right])
    // Away from the ends, which the transform lets fall.
    const from = SMALL.fftSize
    const to = SMALL.segmentFrames - 2 * SMALL.fftSize
    expect(differenceDb(stems.other[0], left, from, to)).toBeLessThan(-100)
    expect(differenceDb(stems.other[1], right, from, to)).toBeLessThan(-100)
    for (const name of ['drums', 'bass', 'vocals'] as const) {
      expect(peak(stems[name][0])).toBe(0)
      expect(peak(stems[name][1])).toBe(0)
    }
  })

  it('adds the waveform the session answers: with no spectrogram a stem is that waveform', async () => {
    const answered = new Float32Array(4 * 2 * SMALL.segmentFrames)
    const left = noise(SMALL.segmentFrames, 3)
    const right = noise(SMALL.segmentFrames, 4)
    // The second stem's two channels.
    answered.set(left, 2 * SMALL.segmentFrames)
    answered.set(right, 3 * SMALL.segmentFrames)
    const fed = session(() => ({ waveform: answered }))
    const stems = await createHybridModel({ Tensor, session: fed }, SMALL).run([
      sound(440),
      sound(440),
    ])
    expect(stems.bass[0]).toEqual(left)
    expect(stems.bass[1]).toEqual(right)
    expect(peak(stems.drums[0])).toBe(0)
  })

  it('names the stems in the order its spec says the model gives them', async () => {
    const answered = new Float32Array(4 * 2 * SMALL.segmentFrames)
    for (let stem = 0; stem < 4; stem += 1) {
      answered.fill(stem + 1, stem * 2 * SMALL.segmentFrames, (stem + 1) * 2 * SMALL.segmentFrames)
    }
    const run = (spec: HybridModelSpec) =>
      createHybridModel({ Tensor, session: session(() => ({ waveform: answered })) }, spec).run([
        sound(440),
        sound(440),
      ])
    const stems = await run(SMALL)
    expect([stems.drums[0][0], stems.bass[0][0], stems.other[0][0], stems.vocals[0][0]]).toEqual([
      1, 2, 3, 4,
    ])
    const turned = await run({ ...SMALL, stems: ['vocals', 'other', 'bass', 'drums'] })
    expect([
      turned.vocals[1][9],
      turned.other[1][9],
      turned.bass[1][9],
      turned.drums[1][9],
    ]).toEqual([1, 2, 3, 4])
  })

  it('refuses a session that does not take two inputs and give two outputs', () => {
    const one = { ...session(() => ({})), inputNames: ['mix'] }
    expect(() => createHybridModel({ Tensor, session: one }, SMALL)).toThrow(SeparationError)
    expect(() => createHybridModel({ Tensor, session: one }, SMALL)).toThrow(/1 input/)
    const three = { ...session(() => ({})), outputNames: ['a', 'b', 'c'] }
    expect(() => createHybridModel({ Tensor, session: three }, SMALL)).toThrow(/3 outputs/)
  })

  it('refuses a spec that names a stem twice, and names the stem', () => {
    const spec = { ...SMALL, stems: ['drums', 'bass', 'other', 'other'] } as HybridModelSpec
    expect(() => createHybridModel({ Tensor, session: session(() => ({})) }, spec)).toThrow(
      /name other twice/,
    )
  })

  it('refuses an answer of the wrong size, and says what it found', async () => {
    const short = session(() => ({ waveform: new Float32Array(4 * 2 * 1000) }))
    const run = createHybridModel({ Tensor, session: short }, SMALL).run([sound(440), sound(440)])
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/"stems".*8000.*32768/)
    const nothing: ModelSession<Tensor> = {
      ...session(() => ({})),
      run: () => Promise.resolve({ stems: new Tensor('float32', new Float32Array(0), [0]) }),
    }
    await expect(
      createHybridModel({ Tensor, session: nothing }, SMALL).run([sound(440), sound(440)]),
    ).rejects.toThrow(/"stems_spectrogram"/)
  })

  it('refuses a segment of another length', async () => {
    const model = createHybridModel({ Tensor, session: session(() => ({})) }, SMALL)
    await expect(model.run([noise(100), noise(100)])).rejects.toThrow(/4096/)
  })

  it('fails as its session fails', async () => {
    const failing: ModelSession<Tensor> = {
      ...session(() => ({})),
      run: () => Promise.reject(new Error('out of memory')),
    }
    await expect(
      createHybridModel({ Tensor, session: failing }, SMALL).run([sound(440), sound(440)]),
    ).rejects.toThrow('out of memory')
  })

  it('takes a spec of six stems: the same two tensors in, six stems out of an answer sized for six', async () => {
    const spec = { ...SMALL, stems: ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'] }
    const answered = new Float32Array(6 * 2 * SMALL.segmentFrames)
    for (let stem = 0; stem < 6; stem += 1) {
      answered.fill(stem + 1, stem * 2 * SMALL.segmentFrames, (stem + 1) * 2 * SMALL.segmentFrames)
    }
    const fed = session(() => ({ waveform: answered }), spec)
    const model = createHybridModel({ Tensor, session: fed }, spec)
    expect(model.stems).toEqual(['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'])
    const left = sound(440)
    const right = sound(1500)
    const stems = await model.run([left, right])

    expect(Object.keys(fed.feeds[0])).toEqual(['mix', 'mix_spectrogram'])
    expect(fed.feeds[0].mix.dims).toEqual([1, 2, SMALL.segmentFrames])
    expect(fed.feeds[0].mix.data.subarray(0, SMALL.segmentFrames)).toEqual(left)
    expect(fed.feeds[0].mix.data.subarray(SMALL.segmentFrames)).toEqual(right)
    const transform = createSegmentTransform(SMALL.segmentFrames, SMALL.fftSize, SMALL.hop)
    const expected = new Float32Array(2 * PLANE)
    transform.forward(left, expected, 0)
    transform.forward(right, expected, PLANE)
    expect(fed.feeds[0].mix_spectrogram.dims).toEqual([1, 4, BINS, FRAMES])
    expect(fed.feeds[0].mix_spectrogram.data).toEqual(expected)

    expect(Object.keys(stems)).toEqual(['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'])
    expect(Object.values(stems).map((stem) => [stem[0][7], stem[1][4000]])).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
      [5, 5],
      [6, 6],
    ])
  })

  it('refuses an answer sized for four when its spec names six', async () => {
    const spec = { ...SMALL, stems: ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'] }
    const four = session(() => ({ waveform: new Float32Array(4 * 2 * SMALL.segmentFrames) }), spec)
    const run = createHybridModel({ Tensor, session: four }, spec).run([sound(440), sound(440)])
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/"stems".*32768.*49152/)
  })

  it('says the four in the order a desk lists them, whatever order its spec answers them in', () => {
    const made = (spec?: HybridModelSpec) =>
      spec === undefined
        ? createHybridModel({ Tensor, session: session(() => ({}), HYBRID_MODEL_SPEC) })
        : createHybridModel({ Tensor, session: session(() => ({}), spec) }, spec)
    expect(HYBRID_MODEL_SPEC.stems).toEqual(['drums', 'bass', 'other', 'vocals'])
    expect(made().stems).toEqual([...STEM_NAMES])
    expect(made(SMALL).stems).toEqual(['vocals', 'drums', 'bass', 'other'])
    expect(made({ ...SMALL, stems: ['other', 'bass', 'vocals', 'drums'] }).stems).toEqual([
      'vocals',
      'drums',
      'bass',
      'other',
    ])
  })

  it('says other stems in the order its spec answers them in', () => {
    const spec = { ...SMALL, stems: ['snare', 'kick'] }
    const model = createHybridModel({ Tensor, session: session(() => ({}), spec) }, spec)
    expect(model.stems).toEqual(['snare', 'kick'])
  })

  it.each<[string, string[], RegExp]>([
    ['no stems', [], /stems are empty/],
    ['a name of another shape', ['drums', 'Bass'], /"Bass"/],
    ['the remainder', ['drums', 'remainder'], /name remainder/],
  ])('refuses a spec with %s', (_name, stems, message) => {
    const spec = { ...SMALL, stems }
    const make = () => createHybridModel({ Tensor, session: session(() => ({}), spec) }, spec)
    expect(make).toThrow(SeparationError)
    expect(make).toThrow(message)
  })
})
