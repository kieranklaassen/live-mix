// The truth of the Acid Bass's display: its figures against `acid_bass.h` and
// what `cpp/test/acid_bass_test.cpp` measured of it, the one voice played
// through again as the header plays it (a strike, an accent, a tied key), and
// what the line of notes shows of each.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, gainToDb, hzText } from '../components/display-kit'
import {
  ACID_BASS_INSTRUMENT_FACES,
  ACID_LET_GO,
  ACID_NOTHING,
  ACID_PARTIALS,
  ACID_SLIDE,
  ACID_STRIKE,
  ACID_WINDOW_SEC,
  acidAccent,
  acidAdvance,
  acidCutoffHz,
  acidDrive,
  acidFilterFall,
  acidFilterGain,
  acidFilterSeconds,
  acidHead,
  acidHeldFall,
  acidKeyDown,
  acidKeyLevel,
  acidKeyUp,
  acidLine,
  acidLoopCurve,
  acidLoopGain,
  acidPartials,
  acidPlay,
  acidResonance,
  acidRise,
  acidSaturate,
  acidShare,
  acidSlideLeft,
  acidSounded,
  acidStore,
  acidVoice,
  type AcidSetting,
} from '../components/displays/instrument-acid-bass'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const params = stockDescriptors().get('acid-bass')?.params ?? {}
const { accent, ink, plate } = PLAIN_COLOURS
const db = (gain: number): number => 20 * Math.log10(gain)

const A1 = 55
const A2 = 110
/** The device's defaults, as the replay reads them. */
const defaults: AcidSetting = {
  cutoff: 280,
  envMod: 0.55,
  decay: 0.35,
  accent: 0.6,
  slide: 0.12,
  sustain: 3,
}
let nextId = 1
const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 0.7,
): DisplayNote => ({ id: nextId++, frequency, gain, age, released })

describe('the acid bass’s figures', () => {
  it('accent a key from a gain of 0.7 up, by as much as Accent allows', () => {
    // `note_on`: clamp((gain - kAccentFrom) / (1 - kAccentFrom), 0, 1) * Accent.
    expect(acidAccent(0.7, 1)).toBe(0)
    expect(acidAccent(0.4, 1)).toBe(0)
    expect(acidAccent(0.85, 1)).toBeCloseTo(0.5, 9)
    expect(acidAccent(1, 1)).toBe(1)
    expect(acidAccent(1, 0.6)).toBeCloseTo(0.6, 9)
    expect(acidAccent(1, 0)).toBe(0)
  })

  it('level a key as `note_on` does: 6 dB from a gain of 0.7 to a full accent', () => {
    // (kLevelFloor + (1 - kLevelFloor) gain) (1 + kAccentBoost accent).
    expect(acidKeyLevel(0.7, 0)).toBeCloseTo(0.79, 9)
    expect(acidKeyLevel(1, 1)).toBeCloseTo(1.58, 9)
    expect(db(acidKeyLevel(1, 1) / acidKeyLevel(0.7, 0))).toBeCloseTo(6.02, 2)
    // The harness: with Accent at 0 a gain of 1 is 1 to 3 dB over 0.7, and 0.4 is 2 to 6 dB under it.
    expect(db(acidKeyLevel(1, 0) / acidKeyLevel(0.7, 0))).toBeCloseTo(2.05, 2)
    expect(db(acidKeyLevel(0.4, 0) / acidKeyLevel(0.7, 0))).toBeCloseTo(-2.68, 2)
    expect(acidKeyLevel(0, 0)).toBeCloseTo(0.3, 9)
  })

  it('strike in 2 ms and bring a tied key back to full in 8, aiming 30 % past full', () => {
    expect(acidRise(0, 0.002, 0.002)).toBeCloseTo(1, 9)
    expect(acidRise(0, 0.001, 0.002)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 9)
    expect(acidRise(0, 0.01, 0.002)).toBe(1)
    expect(acidRise(0, 0.008, 0.008)).toBeCloseTo(1, 9)
    // The harness, from 30 dB down: 0.27 of full after 1 ms, 0.59 after 3, 0.81 after 5, 0.98 after 10.
    const faded = Math.pow(10, -30 / 20)
    expect(acidRise(faded, 0.001, 0.008)).toBeGreaterThan(0.18)
    expect(acidRise(faded, 0.001, 0.008)).toBeLessThan(0.34)
    expect(acidRise(faded, 0.003, 0.008)).toBeCloseTo(0.59, 1)
    expect(acidRise(faded, 0.005, 0.008)).toBeCloseTo(0.81, 1)
    expect(acidRise(faded, 0.01, 0.008)).toBe(1)
  })

  it('close the filter nine tenths of the way in Decay, and an accent’s faster', () => {
    expect(acidFilterFall(0.35, 0.35, 0)).toBeCloseTo(0.1, 6)
    expect(acidFilterFall(4, 2, 0)).toBeCloseTo(0.01, 6)
    // `set_filter_decay`: seconds * (kAccentDecaySeconds / seconds)^accent, only for a Decay over 0.2 s.
    expect(acidFilterSeconds(0.35, 0)).toBe(0.35)
    expect(acidFilterSeconds(10, 1)).toBeCloseTo(0.2, 9)
    expect(acidFilterSeconds(10, 0.5)).toBeCloseTo(Math.sqrt(2), 9)
    expect(acidFilterSeconds(0.1, 1)).toBe(0.1)
    expect(acidFilterFall(0.2, 10, 1)).toBeCloseTo(0.1, 6)
  })

  it('let a held note fall 60 dB over Sustain, and hold it at the top', () => {
    expect(acidHeldFall(3, 3)).toBeCloseTo(0.001, 7)
    expect(acidHeldFall(0.5, 1)).toBeCloseTo(Math.pow(10, -1.5), 7)
    // `kHoldFromSeconds`.
    expect(acidHeldFall(100, 19.9)).toBe(1)
    expect(acidHeldFall(100, 20)).toBe(1)
    expect(acidHeldFall(19.8, 19.8)).toBeCloseTo(0.001, 7)
  })

  it('open the filter five octaves with Env Mod, one more for an accent, four for a full store', () => {
    expect(acidCutoffHz(200, 0, 0, 1, 0)).toBe(200)
    // The harness: Cutoff 200 Hz, Env Mod 0.6 is three octaves.
    expect(acidCutoffHz(200, 0.6, 0, 1, 0)).toBeCloseTo(1600, 6)
    expect(acidCutoffHz(200, 1, 0, 1, 0)).toBeCloseTo(6400, 6)
    expect(acidCutoffHz(200, 0.6, 1, 1, 0)).toBeCloseTo(3200, 6)
    expect(acidCutoffHz(200, 0.6, 0, 0, 0.25)).toBeCloseTo(400, 6)
    expect(acidCutoffHz(200, 0.6, 0, 0.5, 0)).toBeCloseTo(200 * Math.pow(2, 1.5), 6)
    // `kMaxCutoffHz`.
    expect(acidCutoffHz(5000, 1, 1, 1, 1)).toBe(18000)
  })

  it('fill the store in 150 ms and drain it in 350', () => {
    expect(acidStore(0, 1, 0.15)).toBeCloseTo(1 - Math.exp(-1), 9)
    expect(acidStore(0.5, 0, 0.35)).toBeCloseTo(0.5 * Math.exp(-1), 9)
    // It is fed only from above: an envelope under the store leaves it to drain.
    expect(acidStore(0.5, 0.4, 0.35)).toBeCloseTo(0.5 * Math.exp(-1), 9)
    // `kStoreEmpty`: with nothing feeding it, under a thousandth it is empty.
    expect(acidStore(0.0011, 0, 0.1)).toBe(0)
    expect(acidStore(0.0005, 0.002, 0.001)).toBeGreaterThan(0)
  })

  it('slide as a capacitor charges: a hundredth of the interval left after Slide', () => {
    expect(acidSlideLeft(0.12, 0.12)).toBeCloseTo(0.01, 6)
    // The harness: an octave in 0.2 s is half way after 30 ms and a tenth is left at half time.
    expect(acidSlideLeft(0.03, 0.2)).toBeCloseTo(0.5, 2)
    expect(acidSlideLeft(0.1, 0.2)).toBeCloseTo(0.1, 6)
  })

  it('set resonance as `set_resonance` does', () => {
    expect(acidResonance(0)).toEqual({ feedback: 0, stageRatio: 1.09, passband: 1 })
    const full = acidResonance(1)
    expect(full.feedback).toBeCloseTo(7.7, 9)
    expect(full.passband).toBeCloseTo(1 + 0.6 * 7.7, 9)
    expect(full.stageRatio).toBeCloseTo(1 / Math.sqrt(Math.sqrt(15.4) - 1), 9)
    // Until the peak would stand above Cutoff the stages stay where no resonance has them.
    expect(acidResonance(0.2).stageRatio).toBe(1.09)
  })

  it('filter as three poles: 18 dB an octave, a peak on Cutoff that grows as the harness measured', () => {
    const at = (hz: number, resonance: number): number => db(acidFilterGain(hz, 440, resonance))
    // The header: with no resonance, 19 and 35 dB down one and two octaves above Cutoff.
    expect(at(880, 0)).toBeCloseTo(-19, 0)
    expect(at(1760, 0)).toBeCloseTo(-35, 0)
    // Further up it is three poles' 18 dB an octave.
    expect(at(14080, 0) - at(7040, 0)).toBeCloseTo(-18, 0)
    expect(at(110, 0)).toBeGreaterThan(-1)
    // The harness, on a note four octaves under Cutoff: against its fundamental the harmonic on Cutoff
    // rises 11.1, 16.8 and 24.0 dB at Resonance 0.25, 0.5 and 0.75, give or take 2.
    const lift = (resonance: number): number =>
      at(440, resonance) - at(27.5, resonance) - (at(440, 0) - at(27.5, 0))
    const measured: [number, number][] = [
      [0.25, 11.1],
      [0.5, 16.8],
      [0.75, 24.0],
    ]
    for (const [resonance, rise] of measured)
      expect(Math.abs(lift(resonance) - rise)).toBeLessThan(2)
    // At 1 it measured 37.8, some 5 dB under what the loop alone would make: the loop's saturator
    // holds the peak there, and with the gain that note leaves it the figure is the harness's.
    expect(lift(1)).toBeGreaterThan(37.8 + 3)
    expect(lift(1)).toBeLessThan(37.8 + 7)
    const held = (hz: number, resonance: number): number =>
      db(acidFilterGain(hz, 440, resonance, acidLoopGain(0, 27.5, 440, resonance)))
    const liftHeld = held(440, 1) - held(27.5, 1) - (held(440, 0) - held(27.5, 0))
    expect(Math.abs(liftHeld - 37.8)).toBeLessThan(2)
    // The peak stands on Cutoff: a semitone to either side is lower.
    for (const resonance of [0.25, 0.5, 0.75, 1]) {
      expect(at(440, resonance)).toBeGreaterThan(at(440 * 1.06, resonance))
      expect(at(440, resonance)).toBeGreaterThan(at(440 / 1.06, resonance))
    }
    // The bass stays: far under Cutoff, Resonance 1 takes under 6 dB.
    expect(db(acidFilterGain(55, 1000, 1) / acidFilterGain(55, 1000, 0))).toBeGreaterThan(-6)
    // The peak only grows with Resonance, which the handle's drag relies on.
    let last = -Infinity
    for (let resonance = 0; resonance <= 1.0001; resonance += 0.01) {
      const here = acidFilterGain(440, 440, resonance)
      expect(here).toBeGreaterThan(last)
      last = here
    }
  })

  it('hold the peak of a note down as the saturator in the loop does', () => {
    // `kit::fast_tanh`: x (27 + x²) / (27 + 9 x²), flat from 3 on.
    expect(acidLoopCurve(0.001)).toBeCloseTo(0.001, 9)
    expect(acidLoopCurve(1)).toBeCloseTo(28 / 36, 12)
    expect(acidLoopCurve(3)).toBe(1)
    expect(acidLoopCurve(50)).toBe(1)
    expect(acidLoopCurve(-2)).toBe(-acidLoopCurve(2))
    // The oscillator alone is well inside it (`kOscGain`): with no resonance it passes all but a hundredth.
    expect(acidLoopGain(0, A1, 5000, 0)).toBeGreaterThan(0.98)
    expect(acidLoopGain(0, A1, 5000, 0)).toBeLessThan(1)
    // A tall peak on a strong harmonic is a large wave there, and less of it is passed: the lower
    // the harmonic the peak stands on and the higher Resonance, the less.
    const onSecond = acidLoopGain(0, A1, 2 * A1, 1)
    const onSixteenth = acidLoopGain(0, A1, 16 * A1, 1)
    expect(onSecond).toBeLessThan(0.92)
    expect(onSixteenth).toBeGreaterThan(onSecond + 0.05)
    expect(acidLoopGain(0, A1, 2 * A1, 0.7)).toBeGreaterThan(onSecond + 0.03)
    // A square has no second harmonic to stand a peak on.
    expect(acidLoopGain(1, A1, 2 * A1, 1)).toBeGreaterThan(0.99)
    // What is passed is what goes round: the peak comes down, by more than 10 dB here, and what
    // lies far under it by next to nothing.
    const peak = (loop: number): number => db(acidFilterGain(2 * A1, 2 * A1, 1, loop))
    expect(peak(1) - peak(onSecond)).toBeGreaterThan(10)
    expect(
      Math.abs(db(acidFilterGain(5, 2 * A1, 1, onSecond) / acidFilterGain(5, 2 * A1, 1))),
    ).toBeLessThan(1)
    // Left out, the gain is 1: the curve Cutoff and Resonance set.
    expect(acidFilterGain(300, 440, 0.6)).toBe(acidFilterGain(300, 440, 0.6, 1))
  })

  it('drive as `set_drive` does: the control d acts as d(2 − d), up to 36 dB', () => {
    expect(acidDrive(0).pre).toBeCloseTo(0.6, 9)
    expect(acidDrive(0).post).toBeCloseTo(1.7 / 0.6, 9)
    // Half way the gain is three quarters of the way: 27 dB.
    expect(db(acidDrive(0.5).pre / 0.6)).toBeCloseTo(27, 6)
    expect(db(acidDrive(0.134).pre / 0.6)).toBeCloseTo(36 * 0.134 * (2 - 0.134), 6)
    expect(db(acidDrive(1).pre / 0.6)).toBeCloseTo(36, 6)
    // `saturate`: a straight line through zero that bends into a square root.
    expect(acidSaturate(0.001)).toBeCloseTo(0.001, 9)
    expect(acidSaturate(100)).toBeCloseTo(10, 2)
    expect(acidSaturate(-2)).toBeCloseTo(-acidSaturate(2), 12)
    // The make-up: a signal at the nominal level comes out as loud at every Drive.
    const out = (drive: number): number => {
      const { pre, post } = acidDrive(drive)
      return acidSaturate(0.13 * pre) * post
    }
    for (const drive of [0.134, 0.5, 1]) expect(out(drive)).toBeCloseTo(out(0), 9)
  })

  it('make a sawtooth of every harmonic and a square of the odd ones', () => {
    const saw = new Float32Array(ACID_PARTIALS + 1)
    const square = new Float32Array(ACID_PARTIALS + 1)
    // Wide open, no resonance, no drive: the oscillator as it is made.
    expect(acidPartials(0, A1, 18000, 0, 0, saw)).toBe(ACID_PARTIALS)
    acidPartials(1, A1, 18000, 0, 0, square)
    // `kOscGain` times the sawtooth's 2 / pi, times `kOutGain`; the curve at Drive 0 takes a hair.
    expect(saw[1]).toBeCloseTo(0.25 * (2 / Math.PI) * 1.7, 2)
    // The harness: the second harmonic is half the first, the third a third.
    expect(db(saw[2] / saw[1])).toBeCloseTo(-6, 0)
    expect(db(saw[3] / saw[1])).toBeCloseTo(-9.5, 0)
    expect(square[2]).toBeLessThan(0.003 * square[1])
    expect(square[4]).toBeLessThan(0.003 * square[1])
    expect(db(square[3] / square[1])).toBeCloseTo(-9.5, 0)
    // `kSquareLevel`: the two waves are about as loud.
    expect(Math.abs(db(square[1] / saw[1]))).toBeLessThan(2)
    // A high note has fewer harmonics under 20 kHz.
    expect(acidPartials(0, 1000, 18000, 0, 0, saw)).toBe(20)
    expect(saw[21]).toBe(0)
  })

  it('pass the harmonics the filter passes, and grow a buzzing edge under Drive', () => {
    const clean = new Float32Array(ACID_PARTIALS + 1)
    const driven = new Float32Array(ACID_PARTIALS + 1)
    // The harmonic on a resonant peak stands out by what `acidFilterGain` says, the loop's saturator as this note leaves it.
    acidPartials(0, A1, 440, 0.75, 0, clean)
    const lift = db((clean[8] * 8) / clean[1])
    const loop = acidLoopGain(0, A1, 440, 0.75)
    expect(lift).toBeCloseTo(
      db(acidFilterGain(440, 440, 0.75, loop) / acidFilterGain(A1, 440, 0.75, loop)),
      0,
    )
    // A dark sound: the harmonics over Cutoff are far down, and Drive brings them up while the note keeps its level.
    acidPartials(0, A1, 80, 0.1, 0, clean)
    expect(db(clean[7] / clean[1])).toBeLessThan(-45)
    acidPartials(0, A1, 80, 0.1, 0.5, driven)
    expect(db(driven[7] / driven[1])).toBeGreaterThan(db(clean[7] / clean[1]) + 6)
    expect(Math.abs(db(driven[1] / clean[1]))).toBeLessThan(3)
    acidPartials(0, A1, 80, 0.1, 1, driven)
    expect(db(driven[7] / driven[1])).toBeGreaterThan(db(clean[7] / clean[1]) + 15)
    expect(db(driven[3] / driven[1])).toBeGreaterThan(db(clean[3] / clean[1]) + 5)
    expect(Math.abs(db(driven[1] / clean[1]))).toBeLessThan(3)
  })

  it('light a note over 60 dB', () => {
    expect(acidShare(1)).toBe(1)
    expect(acidShare(Math.pow(10, -30 / 20))).toBeCloseTo(0.5, 6)
    expect(acidShare(0.001)).toBe(0)
    expect(acidShare(0)).toBe(0)
    // A full accent is 4 dB over a full plain note.
    expect(acidShare(1.58)).toBeCloseTo(1 + gainToDb(1.58) / 60, 6)
  })
})

describe('the acid bass’s one voice', () => {
  it('strikes both envelopes from silence and starts on pitch', () => {
    const voice = acidVoice()
    expect(acidKeyDown(voice, 1, A2, 0.7, defaults)).toBe(ACID_STRIKE)
    acidAdvance(voice, 0.002, defaults)
    expect(voice.amp).toBeCloseTo(1, 9)
    expect(voice.opening).toBeCloseTo(1, 9)
    expect(voice.pitch).toBe(Math.log2(A2))
    expect(voice.sliding).toBe(false)
    expect(voice.accent).toBe(0)
    // Decay on, the filter is nine tenths of the way back; Sustain on, the note is 60 dB down.
    acidAdvance(voice, defaults.decay, defaults)
    expect(voice.opening).toBeCloseTo(0.1, 6)
    acidAdvance(voice, defaults.sustain - defaults.decay, defaults)
    expect(db(voice.amp)).toBeCloseTo(-60, 3)
    // `kSilent`: at 120 dB down it is silence.
    acidAdvance(voice, defaults.sustain, defaults)
    expect(voice.amp).toBe(0)
  })

  it('lets the loudness go in a few milliseconds once no key is held, and the filter fall on', () => {
    const voice = acidVoice()
    acidKeyDown(voice, 1, A2, 0.7, defaults)
    acidAdvance(voice, 0.1, defaults)
    const before = voice.amp
    const open = voice.opening
    expect(acidKeyUp(voice, 1)).toBe(ACID_LET_GO)
    // `kReleaseTau`: 40 dB down after 16 ms.
    acidAdvance(voice, 0.016, defaults)
    expect(db(voice.amp / before)).toBeCloseTo(-39.7, 0)
    expect(voice.opening).toBeCloseTo(open * Math.pow(10, -0.016 / 0.35), 6)
    acidAdvance(voice, 0.05, defaults)
    expect(voice.amp).toBe(0)
  })

  it('finishes a strike whose key went up at once', () => {
    const voice = acidVoice()
    acidKeyDown(voice, 1, A2, 0.7, defaults)
    acidKeyUp(voice, 1)
    acidAdvance(voice, 0.002, defaults)
    expect(voice.amp).toBeCloseTo(1, 9)
  })

  it('slides to a key pressed over a held one: the loudness comes back, the filter and the accent are not struck', () => {
    const setting = { ...defaults, sustain: 1, slide: 0.2, accent: 1 }
    const tied = acidVoice()
    const alone = acidVoice()
    for (const voice of [tied, alone]) {
      acidKeyDown(voice, 1, A1, 0.7, setting)
      acidAdvance(voice, 0.5, setting)
    }
    // The harness: with a 1 s Sustain the note is 30 dB down after half a second (the fall begins when the strike is over).
    expect(db(tied.amp)).toBeCloseTo(-60 * 0.498, 2)
    // A hard key, which struck apart would be a full accent.
    expect(acidKeyDown(tied, 2, A2, 1, setting)).toBe(ACID_SLIDE)
    expect(tied.accent).toBe(0)
    expect(tied.opens).toBe(false)
    expect(tied.pitch).toBe(Math.log2(A1))
    for (const voice of [tied, alone]) acidAdvance(voice, 0.03, setting)
    // 30 ms on it is all but full and falls from there; the filter envelope is where it would be anyway.
    expect(db(tied.amp)).toBeCloseTo(-60 * 0.022, 1)
    expect(tied.opening).toBeCloseTo(alone.opening, 12)
    expect(tied.store).toBe(0)
    // Half way up the octave after 0.15 of the Slide time, there after it.
    expect(tied.pitch - Math.log2(A1)).toBeCloseTo(0.5, 2)
    acidAdvance(tied, 0.17, setting)
    expect(Math.log2(A2) - tied.pitch).toBeCloseTo(0.01, 3)
    acidAdvance(tied, 0.6, setting)
    expect(tied.pitch).toBe(Math.log2(A2))
    // `key.level` counts the key's own accent all the same: a hard key tied over is louder, though the filter is not struck.
    expect(tied.level).toBeCloseTo(acidKeyLevel(1, 1), 6)
  })

  it('slides back to the key still held when the upper one is let go, and strikes nothing', () => {
    const setting = { ...defaults, sustain: 1, slide: 0.05 }
    const voice = acidVoice()
    acidKeyDown(voice, 1, A1, 0.7, setting)
    acidAdvance(voice, 0.3, setting)
    acidKeyDown(voice, 2, A2, 0.7, setting)
    acidAdvance(voice, 0.2, setting)
    const before = voice.amp
    expect(acidKeyUp(voice, 2)).toBe(ACID_SLIDE)
    expect(voice.rising).toBe(false)
    acidAdvance(voice, 0.1, setting)
    expect(db(voice.amp / before)).toBeCloseTo(-6, 3)
    expect(voice.pitch).toBeCloseTo(Math.log2(A1), 3)
    // A key under the playing one leaves without a sound.
    acidKeyDown(voice, 3, A2, 0.7, setting)
    expect(acidKeyUp(voice, 1)).toBe(ACID_NOTHING)
    expect(voice.target).toBe(Math.log2(A2))
  })

  it('strikes a key pressed over a held note that has faded to silence', () => {
    const setting = { ...defaults, sustain: 0.1 }
    const voice = acidVoice()
    acidKeyDown(voice, 1, A1, 0.7, setting)
    acidAdvance(voice, 0.5, setting)
    expect(voice.amp).toBe(0)
    expect(acidKeyDown(voice, 2, A2, 0.7, setting)).toBe(ACID_STRIKE)
    expect(voice.pitch).toBe(Math.log2(A2))
  })

  it('strikes again, without sliding, for a key in the same block as a strike out of silence', () => {
    const voice = acidVoice()
    acidKeyDown(voice, 1, A1, 0.6, defaults, 0.0013)
    acidAdvance(voice, 0.0005, defaults)
    expect(acidKeyDown(voice, 2, A2, 1, defaults, 0.0013)).toBe(ACID_STRIKE)
    expect(voice.pitch).toBe(Math.log2(A2))
    expect(voice.accent).toBeCloseTo(0.6, 9)
    // A block later the first is heard, and the next key slides.
    acidAdvance(voice, 0.003, defaults)
    expect(acidKeyDown(voice, 3, A1, 1, defaults, 0.0013)).toBe(ACID_SLIDE)
  })

  it('accents: an octave further on the strike, a fast fall, and a store that accents in a row find fuller', () => {
    // The harness's patch: four accented notes 0.15 s apart, each from rest.
    const setting = { ...defaults, cutoff: 250, envMod: 0.4, decay: 0.3, accent: 1 }
    const voice = acidVoice()
    const open: number[] = []
    for (let n = 0; n < 4; n++) {
      acidKeyDown(voice, n, A1, 1, setting)
      acidAdvance(voice, 0.002, setting)
      if (n === 0) {
        // On the strike: Env Mod's two octaves and the accent's one, the store still empty.
        expect(voice.accent).toBe(1)
        expect(acidCutoffHz(250, 0.4, voice.accent, voice.opening, voice.store) / 250).toBeCloseTo(
          8,
          0,
        )
      }
      acidAdvance(voice, 0.048, setting)
      open.push(acidCutoffHz(250, 0.4, voice.accent, voice.opening, voice.store))
      acidAdvance(voice, 0.03, setting)
      acidKeyUp(voice, n)
      acidAdvance(voice, 0.07, setting)
      expect(voice.amp).toBe(0)
    }
    expect(open[1]).toBeGreaterThan(open[0] * 1.1)
    expect(open[2]).toBeGreaterThan(open[1] * 1.04)
    expect(open[3]).toBeGreaterThan(open[2])
    // A full accent's filter falls in 0.2 s whatever Decay says.
    const slow = acidVoice()
    const long: AcidSetting = { ...setting, decay: 10 }
    acidKeyDown(slow, 1, A1, 1, long)
    acidAdvance(slow, 0.202, long)
    expect(slow.opening).toBeCloseTo(0.1, 6)
    // After 3 s of rest the store has drained: the next accent is the first again.
    acidAdvance(voice, 3, setting)
    expect(voice.store).toBe(0)
  })

  it('keeps the store for accents: plain notes do not fill it, and a plain note after an accent finds it', () => {
    const setting = { ...defaults, accent: 1 }
    const voice = acidVoice()
    for (let n = 0; n < 4; n++) {
      acidKeyDown(voice, n, A1, 0.7, setting)
      acidAdvance(voice, 0.1, setting)
      acidKeyUp(voice, n)
      acidAdvance(voice, 0.15, setting)
    }
    expect(voice.store).toBe(0)
    acidKeyDown(voice, 9, A1, 1, setting)
    acidAdvance(voice, 0.1, setting)
    acidKeyUp(voice, 9)
    acidAdvance(voice, 0.15, setting)
    acidKeyDown(voice, 10, A1, 0.7, setting)
    expect(voice.accent).toBe(0)
    expect(voice.store).toBeGreaterThan(0.05)
  })

  it('holds sixteen keys and forgets the oldest of more', () => {
    const voice = acidVoice()
    for (let n = 0; n < 17; n++) {
      acidKeyDown(voice, n, A1 * Math.pow(2, n / 12), 0.7, defaults)
      acidAdvance(voice, 0.01, defaults)
    }
    expect(voice.held).toBe(16)
    expect(acidKeyUp(voice, 0)).toBe(ACID_NOTHING)
    expect(voice.held).toBe(16)
    // A key struck again while it is held is one key.
    acidKeyDown(voice, 16, A1, 0.7, defaults)
    expect(voice.held).toBe(16)
  })

  it('plays the notes through again into a line: a strike of 2 ms stands in it however wide the columns', () => {
    const line = acidPlay(
      [note(A2, 0.9, null, 1)],
      { ...defaults, accent: 1 },
      12,
      0.0013,
      acidLine(),
    )
    // Twelve columns half a second apart, and a point before and after the key.
    expect(line.count).toBe(15)
    const struck = Array.from(line.struck.subarray(0, line.count)).indexOf(1)
    expect(line.at[struck]).toBeCloseTo(-0.898, 6)
    expect(line.loud[struck]).toBeCloseTo(acidKeyLevel(1, 1), 5)
    // Env Mod's 2.75 octaves and the accent's one above Cutoff, and what 2 ms have put in the store.
    expect(line.cut[struck]).toBeGreaterThan(280 * Math.pow(2, 3.75))
    expect(line.cut[struck]).toBeLessThan(280 * Math.pow(2, 3.75) * 1.03)
    expect(line.loud[struck - 1]).toBe(0)
    expect(line.cut[struck - 1]).toBe(280)
    expect(line.marks).toBe(1)
    expect(line.markKind[0]).toBe(ACID_STRIKE)
    expect(line.markAccent[0]).toBe(1)
    expect(line.markPoint[0]).toBe(struck)
    // The last point is now.
    expect(line.at[line.count - 1]).toBeCloseTo(0, 9)
    expect(line.pitch[line.count - 1]).toBeCloseTo(Math.log2(A2), 6)
    expect(acidSounded(line)).toBe(true)
  })

  it('plays keys older than the line too: what they left is what the line begins with', () => {
    // An accent eight seconds ago under a 10 s Decay, still held: the filter is still on its way down.
    const setting = { ...defaults, decay: 10, sustain: 20, accent: 0.5 }
    const line = acidPlay([note(A1, 8, null, 1)], setting, 6, 0, acidLine())
    expect(line.marks).toBe(0)
    expect(line.at[0]).toBe(-ACID_WINDOW_SEC)
    expect(line.loud[0]).toBeCloseTo(acidKeyLevel(1, 0.5), 5)
    const opening = acidFilterFall(2 - 0.002, 10, 0.5)
    expect(line.cut[0]).toBeGreaterThan(acidCutoffHz(280, 0.55, 0.5, opening, 0) * 0.999)
    expect(line.cut[line.count - 1]).toBeLessThan(line.cut[0])
  })

  it('marks one key for a chord of one instant: the last of them plays', () => {
    const chord = [note(A1, 0.5), note(A2, 0.5), note(220, 0.5, null, 1)]
    const line = acidPlay(chord, defaults, 12, 0.0013, acidLine())
    expect(line.marks).toBe(1)
    expect(line.markKind[0]).toBe(ACID_STRIKE)
    expect(line.markTo[0]).toBeCloseTo(Math.log2(220), 6)
    expect(line.markAccent[0]).toBeCloseTo(0.6, 6)
    expect(line.voice.held).toBe(3)
    // Over a sounding note the same three keys are one slide to the last.
    const over = acidPlay([note(55, 1), ...chord], defaults, 12, 0.0013, acidLine())
    expect(Array.from(over.markKind.subarray(0, over.marks))).toEqual([ACID_STRIKE, ACID_SLIDE])
    expect(over.markTo[1]).toBeCloseTo(Math.log2(220), 6)
  })

  it('does not overlap a key let go at the instant the next is pressed', () => {
    const line = acidPlay([note(A1, 1, 0.5), note(A2, 0.5)], defaults, 12, 0.0013, acidLine())
    expect(Array.from(line.markKind.subarray(0, line.marks))).toEqual([ACID_STRIKE, ACID_STRIKE])
  })
})

// The figures above are held to the header as it reads. These are held to the device as it is built
// (its .wasm, played a note): a figure read wrongly off the header agrees with a test read the same way.
describe('the acid bass’s figures against the device itself', () => {
  const RATE = 48000
  type Built = Awaited<ReturnType<typeof loadWasmDevice>>

  async function built(values: Record<string, number>): Promise<Built> {
    const loaded = await loadWasmDevice('acid-bass', RATE)
    for (const [name, value] of Object.entries(values)) loaded.set(params[name], value)
    return loaded
  }
  const keyDown = (loaded: Built, id: number, hz: number, gain: number): void => {
    const down = loaded.device.device_note_on
    if (!down) throw new Error('the device takes no notes')
    down(id, hz, gain)
  }
  /** What comes out over the next `seconds`, in whole blocks. */
  function render(loaded: Built, seconds: number): Float32Array {
    const out = new Float32Array(Math.round((seconds * RATE) / 128) * 128)
    for (let done = 0; done < out.length; done += 128) {
      loaded.device.device_process(128)
      out.set(loaded.view(loaded.device.device_out_left(), 128), done)
    }
    return out
  }
  /** How strong the sine at `hz` is over the last `frames` of a sound; `window` for a sound that moves. */
  function tone(wave: Float32Array, hz: number, frames: number, window = false): number {
    let re = 0
    let im = 0
    let weight = 0
    for (let i = 0; i < frames; i++) {
      const sample = wave[wave.length - frames + i]
      const shade = window ? 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frames) : 1
      re += shade * sample * Math.cos((2 * Math.PI * hz * i) / RATE)
      im += shade * sample * Math.sin((2 * Math.PI * hz * i) / RATE)
      weight += shade
    }
    return (2 * Math.hypot(re, im)) / weight
  }
  const rms = (wave: Float32Array, frames: number): number =>
    Math.sqrt(wave.slice(-frames).reduce((sum, sample) => sum + sample * sample, 0) / frames)

  /** A sawtooth low enough that its harmonics stand close: the filter is read off them. */
  const LOW = 50
  /** With the filter standing still on Cutoff and the note held: no Env Mod, no accent, Sustain at its top. */
  const still = { envMod: 0, accent: 0, sustain: 20, volume: -20 }
  /**
   * One note of 50 Hz held on the device: each harmonic as `acidPartials`
   * counts it, 1 a sine at full scale before the key's level and Volume.
   */
  async function heard(values: Record<string, number>): Promise<(n: number) => number> {
    const loaded = await built({ ...still, ...values })
    keyDown(loaded, 1, LOW, 0.7)
    const wave = render(loaded, 3)
    const level = acidKeyLevel(0.7, 0) * Math.pow(10, still.volume / 20)
    // A second is fifty whole cycles.
    return (n) => tone(wave, n * LOW, RATE) / level
  }
  const valueOf = (values: Record<string, number>, name: string): number =>
    values[name] ?? params[name].default

  it('puts out the harmonics the display draws, the peak held where the loop’s saturator holds it', async () => {
    const drawn = new Float32Array(ACID_PARTIALS + 1)
    const patches: Record<string, number>[] = [
      {},
      { wave: 1 },
      // The default's peak on the note itself.
      { cutoff: 50 },
      { cutoff: 80, resonance: 0.1, drive: 1 },
      { cutoff: 150, resonance: 0.85, drive: 0.5 },
      // The top of Resonance, the peak on the second and on the fourth harmonic.
      { cutoff: 100, resonance: 1, drive: 0 },
      { cutoff: 200, resonance: 1, drive: 0 },
      { wave: 1, cutoff: 150, resonance: 1, drive: 0.5 },
      // The preset 'Resonant scream'.
      { cutoff: 600, resonance: 0.95, drive: 0.553 },
    ]
    for (const values of patches) {
      const device = await heard(values)
      acidPartials(
        valueOf(values, 'wave'),
        LOW,
        valueOf(values, 'cutoff'),
        valueOf(values, 'resonance'),
        valueOf(values, 'drive'),
        drawn,
      )
      for (let n = 1; n <= 24; n++) {
        const [is, shown] = [db(device(n)), db(drawn[n])]
        // The harmonics that stand clear of the picture's foot at -51 dB, in the device or as drawn.
        if (Math.max(is, shown) > -39)
          expect(Math.abs(is - shown), `${JSON.stringify(values)} harmonic ${n}`).toBeLessThan(3)
      }
    }
  })

  it('reads a peak on a low harmonic 10 dB too high if the loop’s saturator is left out', async () => {
    const device = await heard({ cutoff: 200, resonance: 1, drive: 0 })
    const straight = new Float32Array(ACID_PARTIALS + 1)
    acidPartials(0, LOW, 200, 1, 0, straight, 1)
    expect(db(straight[4] / device(4))).toBeGreaterThan(10)
    // And Drive, fed that peak, grows harmonics the device does not have.
    expect(db(straight[12] / device(12))).toBeGreaterThan(20)
  })

  it('lets a note go as the replay does: 40 dB down after 16 ms, 60 after 24', async () => {
    // A bright plain patch and a note whose cycle is a millisecond: the level is the envelope's.
    const plain = { cutoff: 5000, resonance: 0, envMod: 0, drive: 0, sustain: 20, volume: -20 }
    for (const [seconds, fall] of [
      [0.016, -40],
      [0.024, -60],
    ]) {
      const loaded = await built(plain)
      const voice = acidVoice()
      keyDown(loaded, 1, 1000, 0.7)
      acidKeyDown(voice, 1, 1000, 0.7, defaults)
      const before = rms(render(loaded, 0.2), 48)
      acidAdvance(voice, 0.2, { ...defaults, sustain: 20 })
      loaded.device.device_note_off?.(1)
      acidKeyUp(voice, 1)
      // Both are whole blocks. The level is read over the last millisecond: the replay is read in its middle.
      const after = rms(render(loaded, seconds), 48)
      acidAdvance(voice, seconds - 0.0005, { ...defaults, sustain: 20 })
      expect(db(after / before)).toBeCloseTo(db(voice.amp), 0)
      expect(Math.abs(db(after / before) - fall)).toBeLessThan(2.5)
    }
  })

  it('makes a hard key tied over a held one louder by its accent and strikes nothing else, as the replay has it', async () => {
    const plain = { cutoff: 5000, resonance: 0, envMod: 0, drive: 0, sustain: 20, volume: -20 }
    const setting = { ...defaults, sustain: 20, accent: 1 }
    const loaded = await built({ ...plain, accent: 1 })
    const voice = acidVoice()
    keyDown(loaded, 1, 1000, 0.7)
    acidKeyDown(voice, 1, 1000, 0.7, setting)
    const before = rms(render(loaded, 0.2), 48)
    acidAdvance(voice, 0.2, setting)
    const was = voice.level
    keyDown(loaded, 2, 1000, 1)
    expect(acidKeyDown(voice, 2, 1000, 1, setting)).toBe(ACID_SLIDE)
    const after = rms(render(loaded, 0.05), 48)
    acidAdvance(voice, 0.05, setting)
    // `key.level` carries `kAccentBoost` whether the key strikes or is tied: 6 dB over a gain of 0.7.
    expect(db(after / before)).toBeCloseTo(6, 0)
    expect(db(after / before)).toBeCloseTo(db(voice.level / was), 0)
    // The accent itself stays the struck key's: none, so the filter is not opened and the store not filled.
    expect(voice.accent).toBe(0)
    expect(voice.store).toBe(0)
  })

  it('opens the filter where the replay says, accent after accent', async () => {
    // The figure the display writes at rest, on a tall peak so the filter can be read off the
    // sound: four full accents 0.35 s apart, each let go after 0.2 s.
    const values = { resonance: 0.85, accent: 1, drive: 0, sustain: 20, volume: -20 }
    const setting = { ...defaults, accent: 1, sustain: 20 }
    const loaded = await built(values)
    const voice = acidVoice()
    const stood: number[] = []
    for (let n = 0; n < 4; n++) {
      keyDown(loaded, n, LOW, 1)
      acidKeyDown(voice, n, LOW, 1, setting)
      // 50 ms after the strike, read over the 40 ms around it.
      const wave = render(loaded, 0.07)
      acidAdvance(voice, 0.05, setting)
      const shown = acidCutoffHz(280, 0.55, voice.accent, voice.opening, voice.store)
      // The loudest harmonic, against the sawtooth's own fall, is the one on the peak.
      let peak = 0
      let peakHz = 0
      for (let k = 2; k * LOW < 8000; k++) {
        const strong = tone(wave, k * LOW, 0.04 * RATE, true) * k
        if (strong > peak) {
          peak = strong
          peakHz = k * LOW
        }
      }
      // Within a harmonic's spacing, and what the filter moves in those 40 ms.
      expect(Math.abs(peakHz - shown), `accent ${n + 1}`).toBeLessThan(LOW + 0.06 * shown)
      stood.push(peakHz)
      render(loaded, 0.13)
      loaded.device.device_note_off?.(n)
      acidAdvance(voice, 0.15, setting)
      acidKeyUp(voice, n)
      render(loaded, 0.15)
      acidAdvance(voice, 0.15, setting)
    }
    // The store: the second accent finds the filter further open than the first, and none after it less.
    expect(stood[1]).toBeGreaterThan(stood[0] * 1.15)
    expect(stood[2]).toBeGreaterThanOrEqual(stood[1])
    expect(stood[3]).toBeGreaterThanOrEqual(stood[2])
  })
})

describe('the acid bass’s display', () => {
  const { display, face } = ACID_BASS_INSTRUMENT_FACES['acid-bass']
  const draw = (values: Record<string, number>, notes: DisplayNote[] = []) =>
    drawDisplay(display, params, { values, notes, signal: testSignal(), width: 204, height: 100 })
  const paths = (values: Record<string, number>, notes: DisplayNote[] = []): DrawnPath[] =>
    drawnPaths(draw(values, notes))

  // At 204 by 100 the line of notes ends at x 167 and the harmonics begin at 170.
  const inRoll = (path: DrawnPath): boolean => path.points.every(([x]) => x < 168.5)
  const beside = (path: DrawnPath): boolean => path.points.every(([x]) => x > 169.5)
  /** Everything painted in the accent. */
  const lit = (all: DrawnPath[]): DrawnPath[] => all.filter((path) => path.colour === accent)
  /** The notes' bands in a colour: filled shapes, as strong as a note is drawn. */
  const bands = (all: DrawnPath[], colour: string): DrawnPath[] =>
    all.filter(
      (path) =>
        path.kind === 'fill' &&
        path.colour === colour &&
        path.points.length >= 4 &&
        path.alpha > 0.4,
    )
  /** An accent's wedge is three points in a line of its own weight. */
  const wedge = (path: DrawnPath): boolean =>
    path.kind === 'stroke' && path.points.length === 3 && path.width === 1.25 && inRoll(path)
  /** The filter's edge where it is lit: the first line in the accent along the notes. */
  const edge = (all: DrawnPath[]): DrawnPath | undefined =>
    lit(all).find(
      (path) => path.kind === 'stroke' && path.points.length > 1 && inRoll(path) && !wedge(path),
    )
  /** The accents' wedges in a colour. */
  const wedges = (all: DrawnPath[], colour: string): DrawnPath[] =>
    all.filter((path) => path.colour === colour && wedge(path))
  /** The open heads of tied keys: discs in the plate's colour, the handle's being one more. */
  const openHeads = (all: DrawnPath[]): number =>
    all.filter((path) => path.kind === 'fill' && path.colour === plate && path.points.length === 0)
      .length - 1
  /** The harmonics drawn beside the line, in a colour: two points each, and stronger than the scale's lines. */
  const harmonics = (all: DrawnPath[], colour: string): number => {
    const comb = all.find(
      (path) =>
        path.kind === 'stroke' &&
        path.colour === colour &&
        path.points.length > 1 &&
        path.alpha > 0.4 &&
        beside(path) &&
        path.points.every(([, y], i, points) => y === points[i - (i % 2)][1]),
    )
    return comb ? comb.points.length / 2 : 0
  }
  /** The radii of the heads on the line, in the order of their keys: every disc but the handle's, which is drawn last. */
  const heads = (drawn: RecordingContext): number[] =>
    drawn.calls
      .filter((call) => call.name === 'arc')
      .map((call) => call.args[2] as number)
      .slice(0, -1)
  const top = (path: DrawnPath): number => Math.min(...path.points.map(([, y]) => y))
  const foot = (path: DrawnPath): number => Math.max(...path.points.map(([, y]) => y))
  /** A band's two edges at its newest end: where it stands and how thick it is. */
  const end = (band: DrawnPath): { y: number; thick: number } => {
    const half = band.points.length / 2
    const upper = band.points[half - 1][1]
    const lower = band.points[half][1]
    return { y: (upper + lower) / 2, thick: lower - upper }
  }

  it('has the four knobs a player reaches for first on its face', () => {
    expect(face).toEqual(['cutoff', 'resonance', 'envMod', 'decay'])
  })

  it('writes its figure at rest and lights nothing', () => {
    const rest = paths({})
    expect(lit(rest)).toHaveLength(0)
    // A plain note, three accents, and a held note with a key tied over it.
    expect(bands(rest, ink)).toHaveLength(5)
    expect(wedges(rest, ink)).toHaveLength(3)
    expect(openHeads(rest)).toBe(1)
    expect(draw({}).words()).toEqual(expect.arrayContaining(['Saw', 'A1 280 Hz', '1 s']))
    // Switched off, the notes it was sent are not played.
    const off = drawnPaths(drawDisplay(display, params, { notes: [note(A2, 0.2)], powered: false }))
    expect(lit(off)).toHaveLength(0)
  })

  it('opens each accent of the figure further than the last, and no fin under the tied key', () => {
    const line = acidPlay(
      [
        note(A1, 5.75, 4.85),
        note(A1, 4.5, 4.3, 1),
        note(A1, 4.15, 3.95, 1),
        note(A1, 3.8, 3.6, 1),
        note(A1, 3, 0.25),
        note(A2, 2.1, 1.15),
      ],
      defaults,
      162,
      0,
      acidLine(),
    )
    expect(Array.from(line.markKind.subarray(0, line.marks))).toEqual([
      ACID_STRIKE,
      ACID_STRIKE,
      ACID_STRIKE,
      ACID_STRIKE,
      ACID_STRIKE,
      ACID_SLIDE,
    ])
    const peak = (mark: number): number => line.cut[line.markPoint[mark]]
    expect(peak(1)).toBeGreaterThan(peak(0) * 1.4)
    expect(peak(2)).toBeGreaterThan(peak(1) * 1.03)
    expect(peak(3)).toBeGreaterThan(peak(2) * 1.01)
    // The tied key: the filter stays shut, the pitch goes up the octave and comes back.
    const tie = line.markPoint[5]
    expect(line.cut[tie]).toBeLessThan(290)
    expect(line.loud[tie]).toBeCloseTo(acidKeyLevel(0.7, 0), 2)
    const highest = Math.max(...line.pitch.subarray(0, line.count))
    expect(highest).toBeCloseTo(Math.log2(A2), 3)
    expect(line.pitch[line.count - 1]).toBeCloseTo(Math.log2(A1), 3)
  })

  it('lights a played note: its band, its head and the filter’s edge from its strike on', () => {
    const played = paths({}, [note(A2, 0.3)])
    expect(bands(played, accent)).toHaveLength(1)
    expect(bands(played, ink)).toHaveLength(0)
    expect(edge(played)).toBeDefined()
    // The head of a struck note, and the note's own harmonics beside the line.
    expect(
      lit(played).filter((path) => path.kind === 'fill' && path.points.length === 0),
    ).toHaveLength(1)
    expect(harmonics(played, accent)).toBeGreaterThan(0)
    expect(wedges(played, accent)).toHaveLength(0)
    // The words: the note, and where its filter stands 0.3 s after the strike.
    const stands = acidCutoffHz(280, 0.55, 0, acidFilterFall(0.298, 0.35, 0), 0)
    expect(draw({}, [note(A2, 0.3)]).words()).toContain(`A2 ${hzText(stands)}`)
  })

  it('puts a held note out when Sustain has brought it 60 dB down, and holds it at the top of Sustain', () => {
    expect(bands(paths({ sustain: 3 }, [note(A2, 2.8)]), accent)).toHaveLength(1)
    const out = paths({ sustain: 3 }, [note(A2, 3.1)])
    expect(lit(out)).toHaveLength(0)
    // What it was stays on the line, in the ink.
    expect(bands(out, ink)).toHaveLength(1)
    expect(lit(paths({ sustain: 0.1 }, [note(A2, 0.12)]))).toHaveLength(0)
    expect(bands(paths({ sustain: 20 }, [note(A2, 45)]), accent)).toHaveLength(1)
  })

  it('puts a note out a few milliseconds after its key is let go', () => {
    expect(bands(paths({}, [note(A2, 0.5, 0.004)]), accent)).toHaveLength(1)
    // `kReleaseTau`: 60 dB down 24 ms after the key. Half a second into a 3 s Sustain this note
    // was 12 dB under a full one already, so it is out after 19 ms.
    expect(bands(paths({}, [note(A2, 0.5, 0.015)]), accent)).toHaveLength(1)
    expect(lit(paths({}, [note(A2, 0.5, 0.025)]))).toHaveLength(0)
    expect(lit(paths({}, [note(A2, 0.5, 0.06)]))).toHaveLength(0)
  })

  it('keeps what was played for six seconds and then writes the figure again', () => {
    const rest = draw({}).print()
    expect(draw({}, [note(A2, 5, 4.5)]).print()).not.toBe(rest)
    expect(draw({}, [note(A2, 7, 6.5)]).print()).toBe(rest)
  })

  it('throws the edge up by Env Mod at a strike and lets it back over Decay', () => {
    const struck = [note(A2, 0.05, null, 0.5)]
    const little = edge(paths({ envMod: 0.2 }, struck))
    const much = edge(paths({ envMod: 1 }, struck))
    const none = edge(paths({ envMod: 0 }, struck))
    if (!little || !much || !none) throw new Error('no edge')
    // Higher on the canvas is a smaller y: five octaves against one.
    expect(top(much)).toBeLessThan(top(little) - 20)
    expect(foot(none) - top(none)).toBeLessThan(0.01)
    // 0.4 s on, a short Decay has it back on Cutoff and a long one has hardly let it fall.
    const later = [note(A2, 0.4, null, 0.5)]
    const short = edge(paths({ decay: 0.05 }, later))
    const long = edge(paths({ decay: 10 }, later))
    if (!short || !long) throw new Error('no edge')
    const now = (path: DrawnPath): number => path.points[path.points.length - 1][1]
    expect(now(short)).toBeCloseTo(foot(short), 1)
    expect(now(long)).toBeLessThan(top(long) + 2)
  })

  it('writes a wedge over an accent and opens it further, and none over a softer key', () => {
    const hard = [note(A2, 0.3, null, 1)]
    const accented = paths({ accent: 1 }, hard)
    const plain = paths({ accent: 0 }, hard)
    expect(wedges(accented, accent)).toHaveLength(1)
    expect(wedges(plain, accent)).toHaveLength(0)
    const [a, b] = [edge(accented), edge(plain)]
    if (!a || !b) throw new Error('no edge')
    // `kAccentStrikeOctaves`: an octave is a ninth of the line's height or so.
    expect(top(b) - top(a)).toBeGreaterThan(6)
    // Where the fin reaches the top of the picture there is no room over it: the wedge stands before the strike.
    const [capped] = wedges(paths({ accent: 1, cutoff: 5000, envMod: 1 }, hard), accent)
    const right = (path: DrawnPath): number => Math.max(...path.points.map(([x]) => x))
    expect(right(capped)).toBeLessThan(right(wedges(accented, accent)[0]) - 3)
    expect(top(capped)).toBeGreaterThan(16)
    // A gain of 0.7 is no accent, whatever Accent says.
    expect(wedges(paths({ accent: 1 }, [note(A2, 0.3, null, 0.7)]), accent)).toHaveLength(0)
    // A larger accent, a larger wedge.
    const size = (all: DrawnPath[]): number => {
      const [wedge] = wedges(all, accent)
      return foot(wedge) - top(wedge)
    }
    expect(size(accented)).toBeGreaterThan(size(paths({ accent: 0.3 }, hard)) * 1.3)
  })

  it('draws a tied key as an open head on one band that slides to it over Slide', () => {
    const tied = [note(A1, 1), note(A2, 0.5)]
    const fast = paths({ slide: 0.01 }, tied)
    const slow = paths({ slide: 1 }, tied)
    expect(bands(fast, accent)).toHaveLength(1)
    expect(openHeads(fast)).toBe(1)
    // One struck head for the two keys, and the edge has one fin: the highest point is the first strike's.
    expect(
      lit(fast).filter((path) => path.kind === 'fill' && path.points.length === 0),
    ).toHaveLength(1)
    const [band] = bands(fast, accent)
    const [gliding] = bands(slow, accent)
    // An octave is 7.8 px of the line's height: the fast slide is there, the slow one half way.
    expect(band.points[0][1] - end(band).y).toBeGreaterThan(5)
    expect(end(gliding).y).toBeGreaterThan(end(band).y + 0.5)
    expect(end(gliding).y).toBeLessThan(end(band).y + 2)
    // The same two keys played apart are two notes: the first over and in the ink, no open head.
    const apart = paths({}, [note(A1, 1, 0.6), note(A2, 0.5)])
    expect(bands(apart, accent)).toHaveLength(1)
    expect(bands(apart, ink)).toHaveLength(1)
    expect(openHeads(apart)).toBe(0)
  })

  it('draws a head as large as its key was played hard, a tied key’s too', () => {
    const struck = (gain: number): number =>
      heads(draw({ accent: 1 }, [note(A2, 0.3, null, gain)]))[0]
    // `note_on`: a level of 0.3 for the softest key, 0.79 at a gain of 0.7, 1.58 for a full accent.
    expect(struck(0)).toBeCloseTo(acidHead(0.3), 5)
    expect(struck(0.7)).toBeCloseTo(3, 1)
    expect(struck(1)).toBeCloseTo(acidHead(1.58), 5)
    expect(struck(1)).toBeGreaterThan(struck(0.7) + 0.8)
    expect(struck(0.7)).toBeGreaterThan(struck(0) + 0.5)
    // A hard key tied over a held one. `note_on` gives it the accent's loudness and nothing else
    // of an accent: a larger open head and a band a little thicker, no wedge, and the filter's
    // edge where the first key left it.
    const soft = draw({ accent: 1 }, [note(A1, 1), note(A2, 0.5, null, 0.7)])
    const hard = draw({ accent: 1 }, [note(A1, 1), note(A2, 0.5, null, 1)])
    expect(heads(hard)[0]).toBe(heads(soft)[0])
    expect(heads(hard)[1]).toBeGreaterThan(heads(soft)[1] + 0.8)
    expect(heads(soft)[1]).toBeCloseTo(2.5, 1)
    const [softPaths, hardPaths] = [drawnPaths(soft), drawnPaths(hard)]
    expect(openHeads(hardPaths)).toBe(1)
    expect(wedges(hardPaths, accent)).toHaveLength(0)
    expect(edge(hardPaths)?.points).toEqual(edge(softPaths)?.points)
    expect(end(bands(hardPaths, accent)[0]).thick).toBeGreaterThan(
      end(bands(softPaths, accent)[0]).thick,
    )
  })

  it('keeps the figure’s accents apart at 128 wide', () => {
    const settings: Record<string, number>[] = [{}, { accent: 1 }]
    for (const values of settings) {
      const flat = drawDisplay(display, params, { values, width: 128, height: 100 })
      const discs = flat.calls.filter((call) => call.name === 'arc').slice(0, -1)
      expect(discs).toHaveLength(6)
      // The three accents are 0.35 s apart, 5.4 px there: their heads do not touch.
      for (const i of [1, 2]) {
        const [left, right] = [discs[i].args as number[], discs[i + 1].args as number[]]
        expect(right[0] - left[0]).toBeGreaterThan(left[2] + right[2])
      }
    }
  })

  it('brings a fading note back to full under a tied key', () => {
    // A 1 s Sustain: 0.9 s on the note is nearly gone, and a key tied over it then is at full again.
    const fading = bands(paths({ sustain: 1 }, [note(A1, 0.9)]), accent)[0]
    const tied = bands(paths({ sustain: 1 }, [note(A1, 0.9), note(A1, 0.05)]), accent)[0]
    expect(end(tied).thick).toBeGreaterThan(end(fading).thick * 2.5)
  })

  it('thins a band as Sustain lets the note fall', () => {
    const held = [note(A2, 0.3)]
    const short = bands(paths({ sustain: 0.5 }, held), accent)[0]
    const long = bands(paths({ sustain: 10 }, held), accent)[0]
    expect(end(short).thick).toBeLessThan(end(long).thick * 0.75)
  })

  it('draws the harmonics the wave has, and the buzz Drive grows on a dark sound', () => {
    expect(draw({ wave: 1 }).words()).toContain('Square')
    // At rest: a full note on A1 under the filter at Cutoff. A square has every other harmonic of a sawtooth's.
    const saw = harmonics(paths({ wave: 0, cutoff: 2000 }), ink)
    const square = harmonics(paths({ wave: 1, cutoff: 2000 }), ink)
    expect(saw).toBeGreaterThan(20)
    expect(square).toBeLessThan(saw * 0.6)
    expect(square).toBeGreaterThan(saw * 0.4)
    // A dark sound has a few harmonics over the picture's foot, and Drive grows more.
    const dark = { cutoff: 80, resonance: 0.1 }
    const count = (drive: number): number => harmonics(paths({ ...dark, drive }), ink)
    expect(count(0)).toBe(4)
    expect(count(0.5)).toBeGreaterThan(count(0))
    expect(count(1)).toBeGreaterThan(count(0) + 2)
  })

  it('draws the lit curve with its peak where the sounding note holds it, and the curve in the ink where the knobs set it', () => {
    /** A filter's curve beside the line: a long line of its own weight; how far right its tip reaches. */
    const tip = (all: DrawnPath[], colour: string): number => {
      const curve = all.find(
        (path) =>
          path.kind === 'stroke' &&
          path.colour === colour &&
          path.width === 1.25 &&
          path.points.length > 20 &&
          beside(path),
      )
      if (!curve) throw new Error('no curve')
      return Math.max(...curve.points.map(([x]) => x))
    }
    // No Env Mod: the filter stands on Cutoff, on the second harmonic of an A1.
    const held = [note(A1, 0.3)]
    const top = { cutoff: 2 * A1, resonance: 1, envMod: 0 }
    const sounding = paths(top, held)
    // The scale is 72 dB over 29 px. The device holds that peak 14 dB under the filter's own.
    expect(tip(sounding, ink) - tip(sounding, accent)).toBeGreaterThan(3.5)
    expect(tip(sounding, ink) - tip(sounding, accent)).toBeLessThan(7.5)
    // The curve in the ink is the one at rest, and the handle stands on its tip.
    expect(tip(sounding, ink)).toBeCloseTo(tip(paths(top), ink), 9)
    const [filter] =
      display.handles?.(viewOf(display, params, { values: top, width: 204, height: 100 })) ?? []
    expect(filter.x).toBeCloseTo(tip(sounding, ink), 6)
    // Lower down Resonance a note takes little off its peak: the two curves are one.
    const middle = paths({ ...top, resonance: 0.5 }, held)
    expect(Math.abs(tip(middle, ink) - tip(middle, accent))).toBeLessThan(0.5)
  })

  it('draws the edge heavier for more Resonance', () => {
    const width = (resonance: number): number =>
      edge(paths({ resonance }, [note(A2, 0.1)]))?.width ?? 0
    expect(width(1)).toBeGreaterThan(width(0.5))
    expect(width(0.5)).toBeGreaterThan(width(0))
  })

  it('stands its handle on the filter’s peak, and a drag sets Cutoff and Resonance', () => {
    const settings: Record<string, number>[] = [
      {},
      { cutoff: 40, resonance: 0 },
      { cutoff: 5000, resonance: 1 },
      { cutoff: 900, resonance: 0.3 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [filter] = display.handles?.(view) ?? []
      const held = filter.drag(filter.x, filter.y)
      expect(held.cutoff / view.value('cutoff')).toBeCloseTo(1, 4)
      expect(held.resonance).toBeCloseTo(view.value('resonance'), 4)
      // Up is a higher Cutoff, to the right a higher peak.
      expect(filter.drag(filter.x, filter.y - 8).cutoff).toBeGreaterThan(held.cutoff * 1.5)
      expect(filter.drag(filter.x + 3, filter.y).resonance).toBeGreaterThanOrEqual(held.resonance)
      expect(filter.drag(filter.x - 3, filter.y).resonance).toBeLessThanOrEqual(held.resonance)
      expect(filter.drag(filter.x - 3, filter.y).cutoff).toBeCloseTo(held.cutoff, 6)
      expect(filter.reset?.()).toEqual({ cutoff: 280, resonance: 0.7 })
    }
    // More Resonance stands the handle further out.
    const x = (resonance: number): number =>
      (display.handles?.(viewOf(display, params, { values: { resonance } })) ?? [])[0].x
    expect(x(1)).toBeGreaterThan(x(0.7))
    expect(x(0.7)).toBeGreaterThan(x(0))
  })

  it('draws the curve through its tip, however narrow, so the handle stands on it', () => {
    // At the top of Resonance the peak is a few cents wide: a curve drawn in even steps passed
    // over it, and the handle stood up to 8 px off the line.
    for (const width of [204, 128])
      for (const resonance of [0.3, 0.85, 1])
        for (let step = 0; step <= 24; step++) {
          const values = { cutoff: 40 * Math.pow(125, step / 24), resonance }
          const size = { values, width, height: 100 }
          const [filter] = display.handles?.(viewOf(display, params, size)) ?? []
          const near = drawnPaths(drawDisplay(display, params, size))
            .filter(
              (path) =>
                path.kind === 'stroke' &&
                path.colour === ink &&
                path.width === 1.25 &&
                path.points.length > 4 &&
                path.points.every(([px]) => px > width - 37),
            )
            .flatMap((path) => path.points)
            .map(([px, py]) => Math.hypot(px - filter.x, py - filter.y))
          expect(Math.min(...near), `Cutoff ${values.cutoff} at ${width}`).toBeLessThan(0.75)
        }
  })
})
