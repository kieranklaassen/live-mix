// The one-stem spectrogram model over a stand-in session: what the session
// is fed, how its one answer becomes the stem, a set of four such models
// joined and run over a track, and what is refused. That the conventions are
// a real export's is shown by a run of one (scripts/try-separation.mjs), not
// here.

import { describe, expect, it } from 'vitest'

import { joinSeparators } from '../join'
import { createSegmentSeparator } from '../segments'
import { separateTrack } from '../separate'
import { createSpectrogramModel, type SpectrogramModelSpec } from '../spectrogram-model'
import { SeparationError, type ModelSession } from '../types'
import { differenceDb, noise, peak, summed } from './support'

class Tensor {
  constructor(
    readonly type: 'float32',
    readonly data: Float32Array,
    readonly dims: readonly number[],
  ) {}
}

/** A small model that keeps every bin of a frame: 33 frames of 33 bins for a segment of 512. */
const SMALL: SpectrogramModelSpec = {
  sampleRate: 44100,
  fftSize: 64,
  hop: 16,
  bins: 33,
  frames: 33,
  stem: 'vocals',
}
/** The same at a size of three times a power of two: 49 bins. */
const THIRDS: SpectrogramModelSpec = { ...SMALL, fftSize: 96, bins: 49 }

/**
 * A session that answers what `answer` makes of the one tensor it was fed,
 * and by default that tensor itself.
 */
function session(
  spec: SpectrogramModelSpec,
  answer: (fed: Tensor) => Float32Array = (fed) => fed.data.slice(),
): ModelSession<Tensor> & { feeds: Record<string, Tensor>[] } {
  const feeds: Record<string, Tensor>[] = []
  return {
    feeds,
    inputNames: ['spectrogram'],
    outputNames: ['stem_spectrogram'],
    run: (fed) => {
      feeds.push(fed)
      return Promise.resolve({
        stem_spectrogram: new Tensor('float32', answer(fed.spectrogram), [
          1,
          4,
          spec.bins,
          spec.frames,
        ]),
      })
    },
  }
}

/** A periodic Hann window, from its definition. */
function hann(n: number, size: number): number {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size)
}

/**
 * One bin of one frame of a segment's spectrogram as a plain sum, from the
 * definition: half a size reflected at each end with the edge frame not
 * repeated, a periodic Hann window and no scale.
 */
function slowBin(
  x: Float32Array,
  size: number,
  hop: number,
  bin: number,
  frame: number,
): { re: number; im: number } {
  const last = x.length - 1
  let re = 0
  let im = 0
  for (let n = 0; n < size; n += 1) {
    const i = frame * hop + n - size / 2
    const windowed = x[i < 0 ? -i : i > last ? 2 * last - i : i] * hann(n, size)
    re += windowed * Math.cos((2 * Math.PI * bin * n) / size)
    im -= windowed * Math.sin((2 * Math.PI * bin * n) / size)
  }
  return { re, im }
}

/** A cosine of `level` at its peaks that makes `halfTurns` half turns from the first frame to the last. */
function cosine(length: number, halfTurns: number, level: number): Float32Array {
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    out[i] = level * Math.cos((Math.PI * halfTurns * i) / (length - 1))
  }
  return out
}

describe('a one-stem spectrogram model run through a host’s session', () => {
  it('says its rate, a segment of a hop for each frame but one, its one stem, and that it is run on sound as it is', () => {
    const model = createSpectrogramModel({ Tensor, session: session(SMALL) }, SMALL)
    expect(model.sampleRate).toBe(44100)
    expect(model.segmentFrames).toBe(512)
    expect(model.stems).toEqual(['vocals'])
    expect(model.standardize).toBe(false)
  })

  it('takes a size of 6144 with 2048 bins of 512 frames: a segment of 523,264 frames in one tensor', async () => {
    const spec = { ...SMALL, fftSize: 6144, hop: 1024, bins: 2048, frames: 512, stem: 'bass' }
    const fed = session(spec)
    const model = createSpectrogramModel({ Tensor, session: fed }, spec)
    expect(model.segmentFrames).toBe(523264)
    expect(model.stems).toEqual(['bass'])
    const stems = await model.run([new Float32Array(523264), new Float32Array(523264)])
    expect(fed.feeds[0].spectrogram.dims).toEqual([1, 4, 2048, 512])
    expect(fed.feeds[0].spectrogram.data.length).toBe(4 * 2048 * 512)
    expect(stems.bass.map((channel) => channel.length)).toEqual([523264, 523264])
    expect(stems.bass.map(peak)).toEqual([0, 0])
  })

  it('feeds the session one tensor: the left channel’s real and imaginary parts, then the right’s', async () => {
    const { fftSize: size, hop, bins, frames } = THIRDS
    const fed = session(THIRDS)
    const model = createSpectrogramModel({ Tensor, session: fed }, THIRDS)
    const left = noise(512, 1)
    const right = noise(512, 2)
    await model.run([left, right])
    expect(fed.feeds.length).toBe(1)
    expect(Object.keys(fed.feeds[0])).toEqual(['spectrogram'])
    const tensor = fed.feeds[0].spectrogram
    expect(tensor.type).toBe('float32')
    expect(tensor.dims).toEqual([1, 4, 49, 33])
    expect(tensor.data.length).toBe(4 * 49 * 33)
    // A plane is `bins` rows of `frames`. Each is held against plain sums
    // at its corners and between them.
    const plane = bins * frames
    let worst = 0
    for (const bin of [0, 1, 17, 48]) {
      for (const frame of [0, 1, 20, 32]) {
        const at = bin * frames + frame
        const ofLeft = slowBin(left, size, hop, bin, frame)
        const ofRight = slowBin(right, size, hop, bin, frame)
        worst = Math.max(
          worst,
          Math.abs(tensor.data[at] - ofLeft.re),
          Math.abs(tensor.data[plane + at] - ofLeft.im),
          Math.abs(tensor.data[2 * plane + at] - ofRight.re),
          Math.abs(tensor.data[3 * plane + at] - ofRight.im),
        )
      }
    }
    // Measured: 1.2e-7 at worst. The second plane is 4.4 from the right
    // channel's real parts, which a tensor laid real parts first would hold there.
    expect(worst).toBeLessThan(1e-5)
  })

  it('puts a level of 1 on the left channel alone in the first plane, and nothing in the third and fourth', async () => {
    const { fftSize: size, bins, frames } = SMALL
    const fed = session(SMALL)
    const model = createSpectrogramModel({ Tensor, session: fed }, SMALL)
    await model.run([new Float32Array(512).fill(1), new Float32Array(512)])
    const { data } = fed.feeds[0].spectrogram
    const plane = bins * frames
    let sum = 0
    for (let n = 0; n < size; n += 1) sum += hann(n, size)
    // Bin 0 of every frame is the sum of the window.
    for (let frame = 0; frame < frames; frame += 1) expect(data[frame] / sum).toBeCloseTo(1, 6)
    expect(data.subarray(2 * plane).every((value) => value === 0)).toBe(true)

    // And sound on the right channel alone is in the third and fourth, with nothing in the first two.
    await model.run([new Float32Array(512), noise(512, 3)])
    const right = fed.feeds[1].spectrogram.data
    expect(right.subarray(0, 2 * plane).every((value) => value === 0)).toBe(true)
    expect(peak(right.subarray(2 * plane, 3 * plane))).toBeGreaterThan(1)
    expect(peak(right.subarray(3 * plane))).toBeGreaterThan(1)
  })

  it.each([
    ['a power of two', SMALL],
    ['three times a power of two', THIRDS],
  ])(
    'gives a segment back from its first frame to its last when the session answers what it was fed, every bin kept, at a size of %s',
    async (_size, spec) => {
      const model = createSpectrogramModel({ Tensor, session: session(spec) }, spec)
      const left = noise(512, 4)
      const right = noise(512, 5)
      const stems = await model.run([left, right])
      expect(Object.keys(stems)).toEqual(['vocals'])
      expect(stems.vocals.length).toBe(2)
      // Measured: 156.5 dB under full scale from the segment at worst, and
      // 0.7 dB under from the other channel.
      expect(differenceDb(stems.vocals[0], left)).toBeLessThan(-120)
      expect(differenceDb(stems.vocals[1], right)).toBeLessThan(-120)
      expect(stems.vocals[0][0]).toBeCloseTo(left[0], 6)
      expect(stems.vocals[1][511]).toBeCloseTo(right[511], 6)
    },
  )

  it('reads the left channel from the first two planes of the answer and the right from the last two', async () => {
    const half = 2 * SMALL.bins * SMALL.frames
    // The session answers the right channel's planes first, at half their level.
    const swapped = session(SMALL, (fed) => {
      const out = new Float32Array(2 * half)
      out.set(fed.data.subarray(half), 0)
      out.set(
        fed.data.subarray(0, half).map((value) => value * 0.5),
        half,
      )
      return out
    })
    const model = createSpectrogramModel({ Tensor, session: swapped }, SMALL)
    const left = noise(512, 6)
    const right = noise(512, 7)
    const stems = await model.run([left, right])
    // Measured: 156.5 dB under full scale at worst.
    expect(differenceDb(stems.vocals[0], right)).toBeLessThan(-120)
    expect(
      differenceDb(
        stems.vocals[1],
        left.map((sample) => sample * 0.5),
      ),
    ).toBeLessThan(-120)
  })

  it('lets a tone above the cut fall and brings one below it back whole, with half the bins kept', async () => {
    // A size of 768 keeps the first 192 of its 385 bins. Each tone is a
    // cosine that makes a whole number of half turns from the first frame of
    // the segment to the last, so the reflected ends carry it on as it was:
    // a tone that meets its reflection at a corner has sound on both sides
    // of the cut there.
    const spec = { ...SMALL, fftSize: 768, hop: 128, bins: 192, frames: 65 }
    const segment = 64 * 128
    const halfTurns = (bin: number): number => Math.round((bin * 2 * (segment - 1)) / 768)
    const below = cosine(segment, halfTurns(50), 0.5)
    const above = cosine(segment, halfTurns(300), 0.5)
    const model = createSpectrogramModel({ Tensor, session: session(spec) }, spec)
    expect(model.segmentFrames).toBe(segment)
    const stems = await model.run([below, above])
    // Measured: the tone below comes back 150.5 dB under full scale from
    // itself, and of the tone above 155.1 dB under is left. Each tone is
    // 6 dB under full scale.
    expect(differenceDb(stems.vocals[0], below)).toBeLessThan(-120)
    expect(differenceDb(stems.vocals[1], new Float32Array(segment))).toBeLessThan(-120)
  })

  it('scales the stem by the gain its spec gives', async () => {
    const spec = { ...SMALL, gain: 1.035 }
    const model = createSpectrogramModel({ Tensor, session: session(spec) }, spec)
    const left = noise(512, 8)
    const right = noise(512, 9)
    const stems = await model.run([left, right])
    for (const [channel, sound] of [left, right].entries()) {
      const louder = sound.map((sample) => sample * 1.035)
      // Measured: 156.5 dB under full scale from the segment times the
      // gain, and 35.1 dB under from the segment itself.
      expect(differenceDb(stems.vocals[channel], louder)).toBeLessThan(-120)
      expect(differenceDb(stems.vocals[channel], sound)).toBeGreaterThan(-120)
    }
  })

  describe('four of them, each cut off above a frequency of its own, joined as one separator', () => {
    const RATE = 44100
    /**
     * Four models of four sizes, one of them three times a power of two.
     * Each keeps `bins` of the `fftSize / 2 + 1` bins of a frame, so it is
     * cut off `bins / fftSize` turns a frame up, and its session answers
     * what it was fed times `share`. The shares add up to 1.
     */
    const SET = [
      { stem: 'vocals', fftSize: 768, hop: 128, bins: 288, frames: 25, share: 0.4 },
      { stem: 'drums', fftSize: 1024, hop: 256, bins: 128, frames: 17, share: 0.3 },
      { stem: 'bass', fftSize: 1024, hop: 128, bins: 64, frames: 41, share: 0.2 },
      { stem: 'other', fftSize: 512, hop: 128, bins: 128, frames: 33, share: 0.1 },
    ] as const
    const cutOf = (member: (typeof SET)[number]): number => member.bins / member.fftSize
    /**
     * Five tones by their turns a frame: one under every cut, one between
     * each two cuts, which are at 0.0625, 0.125, 0.25 and 0.375, and one
     * over every cut. Each is 30 bins or more from a cut, at that cut's size.
     */
    const TONES = [0.02, 0.095, 0.19, 0.31, 0.44]
    const LEVEL = 0.1
    const FRAMES = 12000
    /**
     * The tones stop at once at the track's end, and a stop has sound on
     * both sides of every cut. Within this many frames of it a window of the
     * largest size reaches it, so the tones are looked for before that.
     */
    const BEFORE_THE_STOP = FRAMES - 1024

    /** The tones for which `keeps` holds, each times what `keeps` says of it. */
    const tones = (keeps: (turns: number) => number): Float32Array => {
      const out = new Float32Array(FRAMES)
      for (let i = 0; i < FRAMES; i += 1) {
        let sum = 0
        for (const turns of TONES) sum += keeps(turns) * LEVEL * Math.cos(2 * Math.PI * turns * i)
        out[i] = sum
      }
      return out
    }

    const separator = (member: (typeof SET)[number]) => {
      const { share, ...rest } = member
      const spec = { ...rest, sampleRate: RATE }
      const scaled = session(spec, (fed) => fed.data.map((value) => value * share))
      return createSegmentSeparator(createSpectrogramModel({ Tensor, session: scaled }, spec))
    }

    it('gives four stems and a remainder that add up to the track, and the remainder holds what lies above each cut', async () => {
      const track = {
        channels: [tones(() => 1), noise(FRAMES, 10).map((v) => v * 0.8)],
        sampleRate: RATE,
      }
      const joined = joinSeparators(SET.map((member) => ({ separator: separator(member) })))
      expect(joined.stems).toEqual(['vocals', 'drums', 'bass', 'other'])
      const separation = await separateTrack(track, joined)
      expect(separation.names).toEqual(['vocals', 'drums', 'bass', 'other'])
      expect(separation.report.resampled).toBe(false)

      // Each stem is its share of the tones under its own cut, and holds
      // nothing of the ones over it. Measured: the stem furthest from that
      // is 84.0 dB under full scale from it, a few frames from an end of
      // one of its segments, where a tone meets its reflection at a corner
      // and the runner's weight is next to nothing. The stem nearest to its
      // share of every tone, cut or not, is 34.0 dB under from that. Up to
      // the track's last frame the figures are 28.3 dB to 36.8 dB under.
      for (const member of SET) {
        const under = tones((turns) => (turns < cutOf(member) ? member.share : 0))
        const uncut = tones(() => member.share)
        const stem = separation.stems[member.stem][0]
        expect(differenceDb(stem, under, 0, BEFORE_THE_STOP)).toBeLessThan(-60)
        expect(differenceDb(stem, uncut, 0, BEFORE_THE_STOP)).toBeGreaterThan(-60)
      }

      // Of each tone the remainder holds the shares of the models that are cut off under it.
      const over = tones((turns) =>
        SET.reduce((sum, member) => sum + (turns > cutOf(member) ? member.share : 0), 0),
      )
      // Measured: 82.2 dB under full scale from that, and 12.8 dB under from silence.
      const remainder = separation.remainder[0]
      expect(differenceDb(remainder, over, 0, BEFORE_THE_STOP)).toBeLessThan(-60)
      expect(differenceDb(remainder, new Float32Array(FRAMES), 0, BEFORE_THE_STOP)).toBeGreaterThan(
        -60,
      )

      // Five parts added in single precision, over every frame of both
      // channels. Measured: the sum is 150.5 dB under full scale from the
      // track, and without the quietest stem it is 30.5 dB under at best.
      // The line is drawn 6 dB over the first.
      for (const channel of [0, 1]) {
        const whole = differenceDb(summed(separation, channel), track.channels[channel])
        const broken = differenceDb(summed(separation, channel, 'other'), track.channels[channel])
        expect(whole).toBeLessThan(-144)
        expect(broken).toBeGreaterThan(-144)
      }
    })
  })

  it('refuses a spec whose size the transform does not take, when the model is made', () => {
    const spec = { ...SMALL, fftSize: 80, hop: 16, bins: 41 }
    const make = () => createSpectrogramModel({ Tensor, session: session(spec) }, spec)
    expect(make).toThrow(SeparationError)
    expect(make).toThrow(/size \(80\)/)
    // And the transform's other refusals: here, more bins than a frame has.
    const bins = { ...SMALL, bins: 34 }
    expect(() => createSpectrogramModel({ Tensor, session: session(bins) }, bins)).toThrow(
      /34 bins.*33/,
    )
  })

  it('refuses a stem that is no name for one, and a gain that is no number', () => {
    const made = (spec: SpectrogramModelSpec) => () =>
      createSpectrogramModel({ Tensor, session: session(spec) }, spec)
    expect(made({ ...SMALL, stem: 'Vocals' })).toThrow(SeparationError)
    expect(made({ ...SMALL, stem: 'Vocals' })).toThrow(/"Vocals"/)
    expect(made({ ...SMALL, stem: 'remainder' })).toThrow(/remainder/)
    expect(made({ ...SMALL, gain: Number.NaN })).toThrow(SeparationError)
    expect(made({ ...SMALL, gain: Number.NaN })).toThrow(/gain.*NaN/)
    expect(made({ ...SMALL, gain: Infinity })).toThrow(/gain.*Infinity/)
  })

  it('refuses a session that does not take one input and give one output', () => {
    const two = { ...session(SMALL), inputNames: ['mix', 'spectrogram'] }
    expect(() => createSpectrogramModel({ Tensor, session: two }, SMALL)).toThrow(SeparationError)
    expect(() => createSpectrogramModel({ Tensor, session: two }, SMALL)).toThrow(/2 inputs/)
    const outputs = { ...session(SMALL), outputNames: ['stem_spectrogram', 'stem'] }
    expect(() => createSpectrogramModel({ Tensor, session: outputs }, SMALL)).toThrow(/2 outputs/)
  })

  it('refuses an answer one plane short, and says what it found', async () => {
    const short = session(SMALL, () => new Float32Array(3 * 33 * 33))
    const run = createSpectrogramModel({ Tensor, session: short }, SMALL).run([
      noise(512, 11),
      noise(512, 12),
    ])
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/"stem_spectrogram".*3267.*4356/)
  })
})
