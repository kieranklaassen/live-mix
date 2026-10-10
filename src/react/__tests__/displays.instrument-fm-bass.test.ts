// The truth of the FM Bass's display: its figures against `fm_bass.h`, its
// partials against the Bessel functions the device's own harness holds it to
// and against the device's inner loop stepped sample by sample, the one voice
// played through as the device takes its keys, and what a knob does to the
// comb of a note that sounds.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  FM_BASS_INSTRUMENT_FACES,
  fmBassBench,
  fmBassBend,
  fmBassBendTouch,
  fmBassComb,
  fmBassCycle,
  fmBassEnds,
  fmBassFeedback,
  fmBassIndex,
  fmBassIndexAt,
  fmBassIndexCap,
  fmBassInnerRate,
  fmBassLoudness,
  fmBassModulator,
  fmBassPartials,
  fmBassPitch,
  fmBassPlay,
  fmBassReach,
  fmBassRoom,
  fmBassTouch,
  fmBassVoice,
  type FmBassTimes,
} from '../components/displays/instrument-fm-bass'
import { type DisplayNote } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
} from './display-harness'

const params = stockDescriptors().get('fm-bass')?.params ?? {}
const { accent } = PLAIN_COLOURS
const A1 = 55
const A2 = 110
const A3 = 220

const note = (
  id: number,
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id, frequency, gain, age, released })

/** Bessel functions of the first kind at 2 and at 1.5, to five places. */
const J2 = [0.22389, 0.57672, 0.35283, 0.12894, 0.034]
const J15 = [0.51183, 0.55794, 0.23209, 0.06096]

describe('the FM bass’s figures', () => {
  it('bend as far as `kMaxIndex` at full Depth under the hardest key, by Depth’s square', () => {
    expect(fmBassIndex(1, 1)).toBeCloseTo(8, 9)
    expect(fmBassIndex(0.5, 1)).toBeCloseTo(2, 9)
    expect(fmBassIndex(0, 1)).toBe(0)
    // `kBendFloor`: the softest key bends 0.4 of what the hardest does, and is 0.35 as loud.
    expect(fmBassBendTouch(0)).toBeCloseTo(0.4, 9)
    expect(fmBassIndex(1, 0.5)).toBeCloseTo(8 * 0.7, 9)
    expect(fmBassTouch(0)).toBeCloseTo(0.35, 9)
    expect(fmBassTouch(1)).toBeCloseTo(1, 9)
  })

  it('let the bend fall 99 % of its way in Bite, from the end of the 2 ms strike', () => {
    expect(fmBassBend(0.002, 0.8)).toBeCloseTo(1, 9)
    expect(fmBassBend(0.002 + 0.8, 0.8)).toBeCloseTo(0.01, 6)
    expect(fmBassBend(0.002 + 0.2, 0.8)).toBeCloseTo(Math.exp(-4.605170186 / 4), 9)
    // The harness's law: an index of 4 with Body 0.25 falls to 1.
    expect(fmBassIndexAt(4, 0.25, fmBassBend(0.002 + 0.8, 0.8))).toBeCloseTo(1.03, 5)
    expect(fmBassIndexAt(4, 0.25, 0)).toBeCloseTo(1, 9)
    expect(fmBassIndexAt(4, 1, 0)).toBeCloseTo(4, 9)
    // A key over a note that sounds takes the bend up from where it stood; nothing passes the cap.
    expect(fmBassBend(0.001, 0.8, 0.2)).toBeCloseTo(0.6, 9)
    expect(fmBassIndexAt(8, 1, 1, 3)).toBe(3)
    expect(fmBassBend(-1, 0.8)).toBe(0)
  })

  it('fall 60 dB in Decay while a key is held, and hold at the top of Decay', () => {
    expect(fmBassLoudness(0.002 + 1.4, null, 1.4, 0.15)).toBeCloseTo(1e-3, 9)
    expect(fmBassLoudness(0.002 + 0.7, null, 1.4, 0.15)).toBeCloseTo(Math.pow(10, -1.5), 9)
    // `kHoldFromSeconds`.
    expect(fmBassLoudness(30, null, 20, 0.15)).toBe(1)
    expect(fmBassLoudness(30, null, 19.8, 0.15)).toBeLessThan(1)
    // The strike is a smooth step from wherever the loudness stands.
    expect(fmBassLoudness(0.001, null, 1.4, 0.15)).toBeCloseTo(0.5, 9)
    expect(fmBassLoudness(0.001, null, 1.4, 0.15, 0.4)).toBeCloseTo(0.7, 9)
    expect(fmBassLoudness(-0.1, null, 1.4, 0.15)).toBe(0)
  })

  it('let a note go in Release, which only shortens', () => {
    // Held half a second on a Decay that holds, then half of a Release of 0.5 s: 30 dB down.
    expect(fmBassLoudness(0.752, 0.25, 20, 0.5)).toBeCloseTo(Math.pow(10, -1.5), 9)
    // The harness: Decay 0.3 s with Release 5 s lets go in 0.3 s, Decay 10 s with Release 0.2 s in 0.2 s.
    expect(fmBassLoudness(0.002 + 0.3, 0.3, 0.3, 5)).toBeCloseTo(1e-3, 9)
    expect(fmBassLoudness(0.002 + 0.2, 0.2, 10, 0.2)).toBeCloseTo(1e-3, 9)
    // A key let go inside the strike is let go when the strike is over.
    expect(fmBassLoudness(0.002 + 0.1, 0.101, 20, 0.2)).toBeCloseTo(Math.pow(10, -1.5), 9)
  })

  it('end a note at `kSilent`, 100 dB down, and say when', () => {
    const ends = fmBassEnds(null, 1.4, 0.15)
    expect(ends).toBeCloseTo(0.002 + (1.4 * 100) / 60, 6)
    expect(fmBassLoudness(ends - 0.01, null, 1.4, 0.15)).toBeGreaterThan(0)
    expect(fmBassLoudness(ends + 0.01, null, 1.4, 0.15)).toBe(0)
    expect(fmBassEnds(null, 20, 0.15)).toBe(Infinity)
    // Let go 0.3 s after the strike: what is left of the 100 dB goes at Release's pace.
    const letGo = fmBassEnds(0.3, 1.4, 0.15)
    expect(letGo).toBeCloseTo(0.3 + (100 / 60 - 0.298 / 1.4) * 0.15, 6)
    expect(fmBassLoudness(letGo - 0.005, letGo - 0.005 - 0.3, 1.4, 0.15)).toBeGreaterThan(0)
    expect(fmBassLoudness(letGo + 0.005, letGo + 0.005 - 0.3, 1.4, 0.15)).toBe(0)
    expect(fmBassEnds(0.5, 20, 0.6)).toBeCloseTo(0.5 + 1, 6)
    // A key held past the end of its note changes nothing by going up.
    expect(fmBassEnds(9, 1.4, 0.15)).toBe(ends)
  })

  it('feed the modulator back by up to one radian, finer towards the top', () => {
    expect(fmBassFeedback(0)).toBe(0)
    expect(fmBassFeedback(0.5)).toBeCloseTo(0.75, 9)
    expect(fmBassFeedback(1)).toBeCloseTo(1, 9)
  })

  it('cap the index as `FmBass::index_cap` does', () => {
    // Under a sine an index of 4 reaches 4 + 1.6 * 2 + 1.8 = 9 modulator pitches.
    expect(fmBassReach(4, 0)).toBeCloseTo(9, 9)
    expect(fmBassIndexCap(9, 0)).toBeCloseTo(4, 6)
    expect(fmBassIndexCap(1.8, 0)).toBe(0)
    // The cap is the index whose reach is the room, with feedback too.
    for (const beta of [0.3, 0.75, 1])
      for (const room of [5, 20, 60])
        expect(fmBassReach(fmBassIndexCap(room, beta), beta)).toBeCloseTo(room, 4)
    // `set_cap`: nine tenths of the way from the note to where a sideband folds back, 3.5 times
    // the sample rate; 1.5 times from 60 kHz up, where the voice runs at twice the rate.
    expect(fmBassRoom(110, 2, 48000)).toBeCloseTo((0.9 * (168000 - 110)) / 110, 6)
    expect(fmBassRoom(110, 14, 96000)).toBeCloseTo((0.9 * (144000 - 110)) / 770, 6)
    // In the bass the cap is far above `kMaxIndex`; a high note tends to a sine.
    expect(fmBassIndexCap(fmBassRoom(55, 14, 48000), 1)).toBeGreaterThan(8)
    expect(fmBassIndexCap(fmBassRoom(4186, 14, 48000), 0)).toBeLessThan(1.5)
  })

  /** How strong the `n`th harmonic of one cycle of a wave is. */
  const harmonic = (wave: Float32Array, n: number): number => {
    let re = 0
    let im = 0
    wave.forEach((y, k) => {
      re += y * Math.cos((2 * Math.PI * n * k) / wave.length)
      im += y * Math.sin((2 * Math.PI * n * k) / wave.length)
    })
    return (2 * Math.hypot(re, im)) / wave.length
  }

  it('run the voice at four times the sample rate, twice from 60 kHz up', () => {
    expect(fmBassInnerRate(44100)).toBe(176400)
    expect(fmBassInnerRate(48000)).toBe(192000)
    expect(fmBassInnerRate(96000)).toBe(192000)
    // The modulator at Ratio 7 under A1 is at 385 Hz: 498.7 samples to its cycle.
    expect(fmBassCycle(A1, 14, 48000)).toBeCloseTo(192000 / 385, 9)
    expect(fmBassCycle(A1, 1, 48000)).toBeCloseTo(192000 / 27.5, 9)
  })

  it('step the modulator as `FmBass::process` does: bent by the mean of its last two outputs', () => {
    // Sixty-four samples to the cycle, read at sixty-four points: the second cycle, sample for sample.
    for (const beta of [0.3, 0.75, 1]) {
      const wave = fmBassModulator(beta, 64, new Float32Array(64))
      const fed = [0, 0]
      for (let j = 1; j < 128; j++) {
        const y = Math.sin((2 * Math.PI * j) / 64 + 0.5 * beta * (fed[0] + fed[1]))
        if (j >= 64) expect(wave[j - 64]).toBeCloseTo(y, 6)
        fed[1] = fed[0]
        fed[0] = y
      }
    }
    // Without Feedback it is a sine, however long its cycle.
    const sine = fmBassModulator(0, 500, new Float32Array(64))
    expect(sine[16]).toBeCloseTo(1, 6)
    expect(sine[48]).toBeCloseTo(-1, 6)
  })

  it('tend to y = sin(turn + beta y) where the cycle is long, and round its edge where it is not', () => {
    const slow = fmBassModulator(1, 60000, new Float32Array(4096))
    for (const k of [100, 1000, 2000, 3000, 4000])
      expect(slow[k]).toBeCloseTo(Math.sin((2 * Math.PI * k) / 4096 + slow[k]), 2)
    // The harness: its first harmonic at one radian is 2 J1(1), and its second J2(2).
    expect(harmonic(slow, 1)).toBeCloseTo(2 * 0.44005, 3)
    expect(harmonic(slow, 2)).toBeCloseTo(J2[2], 3)
    // Under A1 at Ratio 7 the loop is a sample and a half late in a cycle of 499: the low
    // harmonics stand, and the fortieth, which is made of the edge, is down by more than half.
    const fast = fmBassModulator(1, fmBassCycle(A1, 14, 48000), new Float32Array(4096))
    expect(harmonic(fast, 1)).toBeCloseTo(harmonic(slow, 1), 2)
    expect(harmonic(fast, 40)).toBeLessThan(0.5 * harmonic(slow, 40))
  })
})

describe('the FM bass’s partials', () => {
  const bench = fmBassBench()
  /** Under A1 at 48 kHz, unless a test says how long the modulator's cycle is. */
  const partials = (
    step: number,
    index: number,
    beta = 0,
    sub = 0,
    cycle = fmBassCycle(A1, step, 48000),
  ): Float32Array => fmBassPartials(bench, step, index, beta, sub, cycle, fmBassComb()).levels

  it('are a bare sine at the key with no bend, and the sub an octave under', () => {
    const bare = partials(2, 0)
    expect(bare[2]).toBeCloseTo(1, 6)
    expect(Math.max(...bare.filter((_, half) => half !== 2))).toBe(0)
    const under = partials(2, 0, 0, 0.5)
    expect(under[1]).toBeCloseTo(0.5, 6)
    // Without a bend there is nothing for Feedback to colour.
    expect([...partials(2, 0, 1)]).toEqual([...bare])
  })

  it('are the Bessel sum of sin(a + I sin(r a)), with what falls under nought turned over', () => {
    // Ratio 1, index 2: at the key J0 - J2, at twice it J1 + J3, at three times J2 - J4.
    const one = partials(2, 2)
    expect(one[2]).toBeCloseTo(Math.abs(J2[0] - J2[2]), 4)
    expect(one[4]).toBeCloseTo(J2[1] + J2[3], 4)
    expect(one[6]).toBeCloseTo(J2[2] - J2[4], 4)
    // Nothing between the harmonics of the key.
    expect(one[1] + one[3] + one[5]).toBeCloseTo(0, 6)
    // Ratio 2: only the odd harmonics. The first sideband under the key falls on the key turned
    // over, so there it is J0 + J1; at three times J1 - J2, at five J2 + J3.
    const two = partials(4, 2)
    expect(two[2]).toBeCloseTo(J2[0] + J2[1], 4)
    expect(two[6]).toBeCloseTo(J2[1] - J2[2], 4)
    expect(two[10]).toBeCloseTo(J2[2] + J2[3], 4)
    expect(two[4] + two[8]).toBeCloseTo(0, 6)
    // Ratio 7: beside the key, the sixth and eighth harmonics, both J1.
    const seven = partials(14, 2)
    expect(seven[12]).toBeCloseTo(J2[1], 4)
    expect(seven[16]).toBeCloseTo(J2[1], 4)
    expect(seven[14]).toBeCloseTo(0, 6)
  })

  it('put a partial an octave under the key at Ratio 1/2, and the sub adds to it', () => {
    // The harness: J1 - J3 of the index, 0.497 at 1.5, and half as much again with Sub at 0.5.
    expect(partials(1, 1.5)[1]).toBeCloseTo(J15[1] - J15[3], 4)
    expect(partials(1, 1.5, 0, 0.5)[1]).toBeCloseTo(J15[1] - J15[3] + 0.5, 4)
    // At a whole ratio there is nothing there but the sub.
    expect(partials(2, 1.5)[1]).toBeCloseTo(0, 6)
  })

  it('take the harmonics a fed-back modulator has', () => {
    // The harness: under a small index I at Ratio 4 the partial at (1 + 4n) times the key is I/2
    // times the modulator's nth harmonic, 2 Jn(n beta) / (n beta). At one radian: 2 J1(1) and J2(2).
    const index = 0.005
    const fed = partials(8, index, 1)
    expect((2 * fed[10]) / index).toBeCloseTo(2 * 0.44005, 2)
    expect((2 * fed[18]) / index).toBeCloseTo(J2[2], 2)
    // A sine has only the first.
    const plain = partials(8, index, 0)
    expect((2 * plain[10]) / index).toBeCloseTo(1, 2)
    expect((2 * plain[18]) / index).toBeLessThan(0.02)
  })

  /**
   * `FmBass::process` at the inner rate, stepped sample by sample under a key whose sub takes
   * `period` samples to its cycle, and taken apart by a Fourier sum: how strong each multiple of
   * half the key is, up to `most`. Nothing in it is the display's.
   */
  const stepped = (
    step: number,
    index: number,
    beta: number,
    sub: number,
    period: number,
    most: number,
  ): number[] => {
    const y = new Float64Array(period)
    const fed = [0, 0]
    // The second cycle is kept: the first forgets the silence the strike starts from.
    for (let j = 1; j <= 2 * period; j++) {
      const turn = (2 * Math.PI * j) / period
      const modulator = Math.sin(turn * step + 0.5 * beta * (fed[0] + fed[1]))
      fed[1] = fed[0]
      fed[0] = modulator
      if (j > period)
        y[j - period - 1] = Math.sin(2 * turn + index * modulator) - sub * Math.sin(turn)
    }
    const levels = [0]
    for (let half = 1; half <= most; half++) {
      let re = 0
      let im = 0
      for (let k = 0; k < period; k++) {
        const angle = (2 * Math.PI * half * k) / period
        re += y[k] * Math.cos(angle)
        im += y[k] * Math.sin(angle)
      }
      levels.push((2 * Math.hypot(re, im)) / period)
    }
    return levels
  }

  it('are the device’s own, stepped sample by sample, wherever the comb shows them', () => {
    // A1 at 48 kHz: 6982 samples of the inner rate to a cycle of the sub, and 152 halves of the
    // key under the comb's right edge. Depth, Feedback and Sub as five presets strike them.
    const period = 6982
    const most = 152
    const settings: [step: number, index: number, feedback: number, sub: number][] = [
      [2, fmBassIndex(0.62, 1), 0.8, 0.35],
      [2, fmBassIndex(0.5, 1), 1, 0.2],
      [1, fmBassIndex(0.5, 1), 0.5, 0.2],
      [14, fmBassIndex(0.65, 1), 0.8, 0.25],
      [4, fmBassIndex(1, 1), 0, 0],
    ]
    for (const [step, index, feedback, sub] of settings) {
      const beta = fmBassFeedback(feedback)
      const device = stepped(step, index, beta, sub, period, most)
      const shown = partials(step, index, beta, sub, period / step)
      // Every partial that either has above the comb's floor, 47 dB under the carrier.
      let apart = 0
      let seen = 0
      for (let half = 1; half <= most; half++) {
        if (Math.max(device[half], shown[half]) < 0.0045) continue
        seen++
        apart = Math.max(apart, Math.abs(20 * Math.log10(shown[half] / device[half])))
      }
      expect(seen).toBeGreaterThan(10)
      expect(apart).toBeLessThan(1)
    }
  })

  it('keep the far sidebands a fed-back modulator has, past where a sine’s have ended', () => {
    // Depth 0.62 and Feedback 0.8 under A1: the fortieth harmonic of the key is 38 dB under the
    // carrier and the sixtieth 45 dB. Under a sine the eighth is the last above 60 dB.
    const beta = fmBassFeedback(0.8)
    const index = fmBassIndex(0.62, 1)
    const fed = partials(2, index, beta)
    expect(20 * Math.log10(fed[80])).toBeGreaterThan(-39)
    expect(20 * Math.log10(fed[80])).toBeLessThan(-36)
    expect(20 * Math.log10(fed[120])).toBeGreaterThan(-46.5)
    expect(20 * Math.log10(fed[120])).toBeLessThan(-43.5)
    const plain = partials(2, index, 0)
    expect(plain[16]).toBeGreaterThan(0.001)
    expect(Math.max(...plain.slice(18))).toBeLessThan(0.001)
  })

  it('reach further with more index and with more feedback', () => {
    const above = (levels: Float32Array): number =>
      levels.reduce((count, level) => count + (level > 0.01 ? 1 : 0), 0)
    expect(above(partials(2, 5))).toBeGreaterThan(above(partials(2, 1)))
    expect(above(partials(2, 2, 1))).toBeGreaterThan(above(partials(2, 2, 0)) + 4)
  })
})

describe('the FM bass’s one voice', () => {
  const times = (over: Partial<FmBassTimes> = {}): FmBassTimes => ({
    bite: 0.25,
    decay: 20,
    release: 0.15,
    glide: 0.4,
    ...over,
  })
  const play = (notes: DisplayNote[], over: Partial<FmBassTimes> = {}) =>
    fmBassPlay(notes, times(over), 48000, fmBassVoice())
  const cents = (voice: ReturnType<typeof play>, hz: number): number =>
    1200 * (fmBassPitch(voice, voice.since) - Math.log2(hz))

  it('starts a key struck from silence on pitch, Glide or not', () => {
    const voice = play([note(1, A2, 0.01)])
    expect(cents(voice, A2)).toBeCloseTo(0, 6)
    expect(voice.since).toBeCloseTo(0.01, 9)
    expect(voice.up).toBeNull()
  })

  it('slides to a key pressed over a held one, in a straight line that arrives in Glide', () => {
    // The harness: an octave in 0.4 s is 600 cents up at half the time, 900 at three quarters.
    expect(cents(play([note(1, A2, 0.7), note(2, A3, 0.2)]), A2)).toBeCloseTo(600, 0)
    expect(cents(play([note(1, A2, 0.8), note(2, A3, 0.3)]), A2)).toBeCloseTo(900, 0)
    expect(cents(play([note(1, A2, 1), note(2, A3, 0.45)]), A3)).toBeCloseTo(0, 6)
    // Glide 0: the new key is there at once.
    expect(cents(play([note(1, A2, 0.7), note(2, A3, 0.01)], { glide: 0 }), A3)).toBeCloseTo(0, 6)
  })

  it('plays the newest held key only, and strikes again for it', () => {
    const voice = play([note(1, A2, 0.7), note(2, A3, 0.2, null, 0.5)])
    expect(voice.since).toBeCloseTo(0.2, 9)
    expect(voice.gain).toBe(0.5)
    expect(voice.held).toEqual([0, 1])
    // The strike starts from where the first note stood: full on a Decay that holds, its bend fallen.
    expect(voice.loudFrom).toBe(1)
    expect(voice.bendFrom).toBeCloseTo(fmBassBend(0.5, 0.25), 9)
  })

  it('does not slide between keys played apart, nor between keys that land together in silence', () => {
    const apart = play([note(1, A2, 1, 0.6), note(2, A3, 0.05)])
    expect(cents(apart, A3)).toBeCloseTo(0, 6)
    const together = play([note(1, A2, 0.05), note(2, A3, 0.05)])
    expect(cents(together, A3)).toBeCloseTo(0, 6)
    expect(together.held).toEqual([0, 1])
    // A hundredth of a second apart they are two blocks, and the first has sounded: a slide.
    const rolled = play([note(1, A2, 0.06), note(2, A3, 0.05)])
    expect(cents(rolled, A3)).toBeLessThan(-900)
  })

  it('takes a key up before a key down in the same instant: notes played end to end do not slide', () => {
    const voice = play([note(1, A2, 1, 0.3), note(2, A3, 0.3)])
    expect(cents(voice, A3)).toBeCloseTo(0, 6)
    expect(voice.held).toEqual([1])
    // The strike starts from where the first note stood, and it was not let go for any time.
    expect(voice.loudFrom).toBe(1)
    // An instant later the key up came second, over the new key: a slide.
    expect(cents(play([note(1, A2, 1, 0.299), note(2, A3, 0.3)]), A3)).toBeLessThan(-200)
  })

  it('does not take the remembered end of a key struck again while held for a key up', () => {
    // The device was sent no key up: its `note_on` takes the old key off the stack and the pitch
    // stays. Here the note has died, so a key up would have jumped to the key under it, and the
    // new key would slide back from there.
    const again = [note(1, A2, 2), note(2, A3, 1, 0.2), note(2, A3, 0.2)]
    const voice = play(again, { decay: 0.05 })
    expect(voice.held).toEqual([0, 2])
    expect(voice.since).toBeCloseTo(0.2, 9)
    expect(cents(voice, A3)).toBeCloseTo(0, 6)
  })

  it('still slides from a held key whose note has died away', () => {
    // The harness: a key held a second on a Decay of 0.3 s is silent; the next slides from it.
    const voice = play([note(1, A2, 1.035), note(2, A3, 0.035)], { decay: 0.3 })
    expect(voice.loudFrom).toBe(0)
    expect(voice.bendFrom).toBe(1)
    expect(cents(voice, A3)).toBeCloseTo(-1200 * (1 - 0.035 / 0.4), 0)
  })

  it('goes back to the key under the one let go, without a strike', () => {
    const voice = play([note(1, A2, 2, null, 0.3), note(2, A3, 1, 0.5)])
    // The last strike is still the second key's, a second ago; the touch is the first key's.
    expect(voice.since).toBeCloseTo(1, 9)
    expect(voice.up).toBeNull()
    expect(voice.gain).toBe(0.3)
    expect(voice.held).toEqual([0])
    expect(cents(voice, A2)).toBeCloseTo(0, 6)
    // A tenth of a second after the key went up it is a quarter of the way back.
    expect(cents(play([note(1, A2, 2), note(2, A3, 1, 0.1)]), A3)).toBeCloseTo(-300, 0)
  })

  it('leaves the playing key alone when an older one goes up, and lets go with the last', () => {
    const kept = play([note(1, A2, 2, 0.5), note(2, A3, 1)])
    expect(kept.up).toBeNull()
    expect(kept.held).toEqual([1])
    expect(cents(kept, A3)).toBeCloseTo(0, 6)
    const gone = play([note(1, A2, 2, 0.5), note(2, A3, 1, 0.2)])
    expect(gone.up).toBeCloseTo(0.2, 9)
    expect(gone.held).toEqual([])
    expect(gone.ends).toBeCloseTo(0.8 + (100 / 60) * 0.15, 6)
  })

  it('takes the same key again as a new key on top of the stack', () => {
    // The harness's five keys, let go from the top, then the third again.
    const keys = [110, 146.83, 196, 261.63, 349.23]
    const down = keys.map((hz, k) => note(10 + k, hz, 2 - k * 0.05))
    const voice = play([...down.slice(0, 3), note(13, keys[3], 1.85, 1), note(12, keys[2], 0.5)], {
      glide: 0,
    })
    expect(voice.held).toEqual([0, 1, 4])
    expect(cents(voice, keys[2])).toBeCloseTo(0, 6)
  })

  it('arrives at once when the note dies in the middle of a slide', () => {
    // A Decay of 0.05 s is silence after 85 ms, a tenth of the way through a slide of a second.
    const voice = play([note(1, A2, 1), note(2, A3, 0.5)], { decay: 0.05, glide: 1 })
    expect(fmBassLoudness(voice.since, voice.up, 0.05, 0.15, voice.loudFrom)).toBe(0)
    expect(cents(voice, A3)).toBeCloseTo(0, 6)
  })
})

describe('the FM bass’s display', () => {
  const { display } = FM_BASS_INSTRUMENT_FACES['fm-bass']
  const run = (values: Record<string, number>, notes: DisplayNote[]): DrawnPath[] =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() }))
  /** Everything laid in the accent: what sounds now. */
  const lit = (paths: DrawnPath[]): DrawnPath[] => paths.filter((path) => path.colour === accent)
  /** The comb of the note that sounds: four corners to a bar. */
  const comb = (paths: DrawnPath[]): [number, number][] =>
    lit(paths).find((path) => path.kind === 'fill' && path.points.length >= 4)?.points ?? []
  /** The mark under the comb where the voice is: its tip. */
  const mark = (paths: DrawnPath[]): [number, number] | undefined =>
    lit(paths).find((path) => path.kind === 'fill' && path.points.length === 3)?.points[0]
  const bars = (points: [number, number][]): number => points.length / 4
  const reach = (points: [number, number][]): number => Math.max(...points.map(([x]) => x))
  const lowest = (points: [number, number][]): number => Math.min(...points.map(([x]) => x))
  /** How high the tallest bar stands: the canvas counts downward. */
  const height = (points: [number, number][]): number =>
    Math.max(...points.map(([, y]) => y)) - Math.min(...points.map(([, y]) => y))
  const held = { decay: 20 }
  /** The comb is eight octaves from side to side, five pixels in from each edge of the display. */
  const octave = (displaySize(display).width - 10) / 8

  it('lights nothing at rest', () => {
    expect(lit(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lit(run({}, []))).toHaveLength(0)
    expect(
      lit(drawnPaths(drawDisplay(display, params, { powered: false, notes: [note(1, A1, 0.1)] }))),
    ).toHaveLength(0)
  })

  it('lights one comb for a chord: the newest key’s, where that key is', () => {
    const alone = mark(run(held, [note(3, A3, 0.2)]))
    const chord = run(held, [note(1, A1, 0.2), note(2, A2, 0.2), note(3, A3, 0.2)])
    expect(
      lit(chord).filter((path) => path.kind === 'fill' && path.points.length === 3),
    ).toHaveLength(1)
    expect(mark(chord)?.[0]).toBeCloseTo(alone?.[0] ?? NaN, 6)
    // An octave lower stands an eighth of the comb's width to the left.
    const low = mark(run(held, [note(2, A2, 0.2)]))
    expect((alone?.[0] ?? 0) - (low?.[0] ?? 0)).toBeCloseTo(octave, 6)
  })

  it('goes out when the device lets the note die: under a held key after Decay, after a key in Release', () => {
    // A Decay of 0.3 s is silence 0.502 s after the strike.
    expect(lit(run({ decay: 0.3 }, [note(1, A1, 0.45)])).length).toBeGreaterThan(0)
    expect(lit(run({ decay: 0.3 }, [note(1, A1, 0.55)]))).toHaveLength(0)
    // Let go after 0.3 s on a Release of 0.15 s: silence 0.218 s after the key.
    expect(lit(run({}, [note(1, A1, 0.5, 0.2)])).length).toBeGreaterThan(0)
    expect(lit(run({}, [note(1, A1, 0.53, 0.23)]))).toHaveLength(0)
    // Release only shortens: at its top the note falls in Decay, and still sounds.
    expect(lit(run({ release: 5 }, [note(1, A1, 0.53, 0.23)])).length).toBeGreaterThan(0)
    // A Decay at the top holds for as long as the key does.
    expect(lit(run(held, [note(1, A1, 40)])).length).toBeGreaterThan(0)
  })

  it('closes the comb from the strike to what Body leaves, over Bite', () => {
    const struck = comb(run(held, [note(1, A1, 0.004)]))
    const settled = comb(run(held, [note(1, A1, 1)]))
    expect(bars(settled)).toBeLessThan(bars(struck) - 2)
    expect(reach(settled)).toBeLessThan(reach(struck) - 10)
    // A quarter of the way through a long Bite it is wider still; with Body full it never closes.
    const biting = comb(run({ ...held, bite: 4 }, [note(1, A1, 1)]))
    expect(bars(biting)).toBeGreaterThan(bars(settled))
    expect(bars(biting)).toBeLessThan(bars(struck))
    const full = comb(run({ ...held, body: 1 }, [note(1, A1, 1)]))
    expect(bars(full)).toBe(bars(struck))
    expect(reach(full)).toBe(reach(struck))
    // With Body at nothing it settles to the key and the sub under it.
    const bare = comb(run({ ...held, body: 0 }, [note(1, A1, 3)]))
    expect(bars(bare)).toBe(2)
  })

  it('opens the comb further with Depth, with Feedback and under a harder key', () => {
    const at = (values: Record<string, number>, gain = 1): number =>
      reach(comb(run({ ...held, ...values }, [note(1, A1, 0.004, null, gain)])))
    expect(at({ depth: 1 })).toBeGreaterThan(at({ depth: 0.65 }) + 5)
    expect(at({ depth: 0.65 })).toBeGreaterThan(at({ depth: 0.2 }) + 5)
    expect(at({ feedback: 1 })).toBeGreaterThan(at({ feedback: 0 }) + 10)
    expect(at({}, 1)).toBeGreaterThan(at({}, 0.1) + 2)
    // With no Depth the note is a sine, and Feedback has nothing to colour.
    expect(at({ depth: 0, sub: 0, feedback: 1 })).toBe(at({ depth: 0, sub: 0 }))
  })

  it('stands the partials where Ratio puts them, and the sub an octave under the key', () => {
    const lefts = (values: Record<string, number>): number[] =>
      [
        ...new Set(comb(run({ ...held, sub: 0, ...values }, [note(1, A1, 0.004)])).map(([x]) => x)),
      ].sort((a, b) => a - b)
    // Ratio 1: the second bar is the octave. Ratio 2: it is the third harmonic, a twelfth up.
    const one = lefts({ ratio: 1 })
    const two = lefts({ ratio: 2 })
    expect(Math.abs(one[2] - one[0] - octave)).toBeLessThan(1.5)
    expect(Math.abs(two[2] - two[0] - octave * Math.log2(3))).toBeLessThan(1.5)
    // Ratio 1/2 and the sub both stand an octave under the key.
    const half = lefts({ ratio: 0 })
    expect(Math.abs(one[0] - half[0] - octave)).toBeLessThan(1.5)
    const under = lowest(comb(run({ ...held, body: 0, sub: 1 }, [note(1, A1, 3)])))
    const key = lowest(comb(run({ ...held, body: 0, sub: 0 }, [note(1, A1, 3)])))
    expect(Math.abs(key - under - octave)).toBeLessThan(1.5)
  })

  it('lets the bars sink as the note dies, sooner on a shorter Decay and under a softer key', () => {
    const tall = (values: Record<string, number>, age: number, gain = 1): number =>
      height(comb(run(values, [note(1, A1, age, null, gain)])))
    expect(tall({ decay: 1.4 }, 0.6)).toBeLessThan(tall({ decay: 1.4 }, 0.1) - 5)
    expect(tall({ decay: 0.7 }, 0.3)).toBeLessThan(tall({ decay: 1.4 }, 0.3) - 2)
    expect(tall(held, 6)).toBeCloseTo(tall(held, 3), 6)
    expect(tall(held, 3, 0.2)).toBeLessThan(tall(held, 3, 1) - 2)
  })

  it('slides the comb to a key pressed over another, in Glide, and not to a key played apart', () => {
    const from = mark(run(held, [note(1, A1, 0.5)]))?.[0] ?? NaN
    const to = mark(run(held, [note(2, A2, 0.5)]))?.[0] ?? NaN
    const sliding = [note(1, A1, 1), note(2, A2, 0.2)]
    expect(mark(run({ ...held, glide: 0.4 }, sliding))?.[0]).toBeCloseTo((from + to) / 2, 4)
    expect(mark(run({ ...held, glide: 0.1 }, sliding))?.[0]).toBeCloseTo(to, 6)
    expect(mark(run({ ...held, glide: 0 }, sliding))?.[0]).toBeCloseTo(to, 6)
    const apart = [note(1, A1, 1, 0.8), note(2, A2, 0.2)]
    expect(mark(run({ ...held, glide: 0.4 }, apart))?.[0]).toBeCloseTo(to, 6)
    // Letting the upper key go slides back to the one still held.
    const back = [note(1, A1, 1), note(2, A2, 0.8, 0.2)]
    expect(mark(run({ ...held, glide: 0.4 }, back))?.[0]).toBeCloseTo((from + to) / 2, 4)
  })

  it('lets a word of the scale give way to a handle that stands on it', () => {
    // On the upright plate, 204 wide, where the scale has three words.
    const words = (values: Record<string, number>): string[] =>
      drawDisplay(display, params, { values, width: 204 }).words()
    expect(words({})).toEqual(expect.arrayContaining(['0.1 s', '1 s', '10 s']))
    // Depth and Body at the top put the Bite handle up among the words.
    const high = words({ depth: 1, body: 1, bite: 0.15 })
    expect(high).not.toContain('0.1 s')
    expect(high).toContain('1 s')
    expect(words({ depth: 1, body: 1, bite: 1.5 })).not.toContain('1 s')
    // Low on the note it is clear of them.
    expect(words({ depth: 1, body: 0.05, bite: 0.15 })).toContain('0.1 s')
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { depth: 1, bite: 2, body: 0.8, decay: 6 },
      { depth: 0.3, bite: 0.03, body: 0.5, decay: 20 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [depth, bite, decay] = display.handles?.(view) ?? []
      expect(depth.drag(depth.x, depth.y).depth).toBeCloseTo(view.value('depth'), 3)
      expect(bite.drag(bite.x, bite.y).bite).toBeCloseTo(view.value('bite'), 3)
      expect(bite.drag(bite.x, bite.y).body).toBeCloseTo(view.value('body'), 3)
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 3)
      // Up is deeper and more body; to the right is a longer Bite and a longer Decay.
      expect(depth.drag(depth.x, depth.y - 4).depth).toBeGreaterThan(view.value('depth') - 1e-9)
      expect(bite.drag(bite.x + 10, bite.y - 2).bite).toBeGreaterThan(view.value('bite'))
      expect(bite.drag(bite.x + 10, bite.y - 2).body).toBeGreaterThan(view.value('body'))
      expect(decay.drag(decay.x - 10, decay.y).decay).toBeLessThan(view.value('decay'))
    }
    // With no Depth the line lies on the foot, and the Bite handle sets Bite alone.
    const flat = viewOf(display, params, { values: { depth: 0 } })
    const [, bite] = display.handles?.(flat) ?? []
    expect(Object.keys(bite.drag(bite.x, bite.y))).toEqual(['bite'])
  })
})
