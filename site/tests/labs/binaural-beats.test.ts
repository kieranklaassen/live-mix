import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  differenceDb,
  expectBuild,
  expectSoundLab,
  expectWritten,
  FADE,
  gainToDb,
  lab,
  matchesWritten,
  peak,
  POINT_RATE,
  points,
  range,
  RATE,
  rms,
  seconds,
  silence,
} from './support.ts'

// Nothing goes in: the lab holds its own keys for the whole loop.
const LOOP = 4
const nothing = () => silence(seconds(LOOP))
const settings = readSettings('binaural-beats')!

type Beats = Awaited<ReturnType<typeof lab>>

/** The lab at its starting values, with these laid over them. */
const at = (beats: Beats, values: Record<string, number> = {}) => beats.render(nothing(), values)

/** The lab as a card's named set leaves it. */
const played = (beats: Beats, name: string) =>
  beats.render(nothing(), resolveSet(beats.description, settings.sets[name]!).values)

/** One channel of a tap: the first, the left, unless told otherwise. */
const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

/** The first point of a level tap after the loop's own crossfade and a window of the meter. */
const SETTLED = Math.ceil((FADE + RATE / 80) / 16)

/** The least and the most of a level tap, clear of the crossfade at the loop's start. */
const level = (result: RenderResult, id: string) => {
  const x = tap(result, id)
  return range(x, SETTLED, x.length)
}

/** The level of a whole tap, in dB against full scale. */
const loud = (x: Float32Array) => gainToDb(rms(x))

/** How many times a second a wave crosses zero upwards: its frequency, for one tone. */
function hertz(x: Float32Array): number {
  let crossings = 0
  for (let i = 0; i < x.length; i += 1) {
    const before = x[(i - 1 + x.length) % x.length]!
    if (before < 0 && x[i]! >= 0) crossings += 1
  }
  return (crossings * RATE) / x.length
}

/** The level of one frequency in a wave, in dB against full scale, over the whole loop. */
function levelAt(x: Float32Array, hz: number): number {
  let re = 0
  let im = 0
  for (let i = 0; i < x.length; i += 1) {
    const turn = (2 * Math.PI * hz * i) / RATE
    re += x[i]! * Math.cos(turn)
    im -= x[i]! * Math.sin(turn)
  }
  return gainToDb((2 * Math.hypot(re, im)) / x.length)
}

/**
 * What is left of a wave once these steady tones are taken out of it, in dB against the whole
 * wave. Each tone is fitted over the whole loop, in which it must make a whole number of cycles.
 */
function restAfter(x: Float32Array, tones: number[]): number {
  const rest = Float64Array.from(x)
  for (const hz of tones) {
    let re = 0
    let im = 0
    for (let i = 0; i < x.length; i += 1) {
      const turn = (2 * Math.PI * hz * i) / RATE
      re += x[i]! * Math.cos(turn)
      im += x[i]! * Math.sin(turn)
    }
    re *= 2 / x.length
    im *= 2 / x.length
    for (let i = 0; i < x.length; i += 1) {
      const turn = (2 * Math.PI * hz * i) / RATE
      rest[i]! -= re * Math.cos(turn) + im * Math.sin(turn)
    }
  }
  let left = 0
  let whole = 0
  for (let i = 0; i < x.length; i += 1) {
    left += rest[i]! * rest[i]!
    whole += x[i]! * x[i]!
  }
  return 10 * Math.log10(Math.max(left / whole, 1e-20))
}

/** The outline of a wave from `from` up to `to`: the largest sample of each cycle of `hz`, least and most, in dB. */
function outline(
  x: Float32Array,
  hz: number,
  from: number,
  to: number,
): { lo: number; hi: number } {
  const cycle = RATE / hz
  let lo = Infinity
  let hi = 0
  for (let k = 0; from + (k + 1) * cycle <= to; k += 1) {
    const top = peak(x.subarray(Math.floor(from + k * cycle), Math.floor(from + (k + 1) * cycle)))
    lo = Math.min(lo, top)
    hi = Math.max(hi, top)
  }
  return { lo: gainToDb(lo), hi: gainToDb(hi) }
}

/** How many times a second a level tap falls through `under`, counted over the whole loop. */
function dips(x: Float32Array, under: number): number {
  let count = 0
  for (let i = 0; i < x.length; i += 1) {
    const before = x[(i - 1 + x.length) % x.length]!
    if (before >= under && x[i]! < under) count += 1
  }
  return (count * POINT_RATE) / x.length
}

/** Whether two waves are the same, sample for sample. */
const alike = (a: Float32Array, b: Float32Array) =>
  a.length === b.length && a.every((v, i) => v === b[i])

/** Half of the left less the right over half of their sum, in dB: side over mid. */
function sideOverMid(result: RenderResult): number {
  const left = tap(result, 'left')
  const right = tap(result, 'right')
  return loud(left.map((v, i) => 0.5 * (v - right[i]!))) - loud(tap(result, 'mid'))
}

describe('the binaural beats lab', () => {
  it('holds what every lab is held to', async () => {
    const beats = await lab('binaural-beats')
    const result = at(beats)
    // The bed is silent until Bed is raised, and Colour colours nothing until then.
    expectSoundLab(beats, nothing(), result, {
      quiet: ['bedOnly'],
      when: { colour: { bed: 0.5 } },
    })
  })

  it('builds the Binaural a piece at a time, and the first five pieces are the device', async () => {
    const beats = await lab('binaural-beats')
    expectBuild(beats, nothing(), { warmth: 0.5, bed: 0.4 })
    expectBuild(beats, nothing(), { warmth: 1, bed: 1, keys: 1, key: 440, beat: 7.3, ears: 0.4 })
  })

  // ---- part 1: two tones in the air, and one tone to each ear --------------------------------

  it('gives each ear both tones at Ears 0, 223 Hz and 217 Hz at −21.2 dB each, and the level of an ear then falls more than 25 dB and comes back 6 times a second (claim air-beat)', async () => {
    const beats = await lab('binaural-beats')
    const air = played(beats, 'air')
    const left = tap(air, 'left')
    const higher = levelAt(left, 223)
    const lower = levelAt(left, 217)
    const swing = level(air, 'levelLeft')
    const times = dips(tap(air, 'levelLeft'), swing.hi - 10)
    expectWritten(higher, '−21.2 dB')
    expectWritten(lower, '−21.2 dB')
    expectWritten(swing.span, 'more than 25 dB')
    expect(times).toBe(6)
  })

  it('gives the two ears the same signal at Ears 0, sample for sample (claim air-alike)', async () => {
    const beats = await lab('binaural-beats')
    const air = played(beats, 'air')
    expect(alike(tap(air, 'left'), tap(air, 'right'))).toBe(true)
    expect(alike(tap(air, 'out'), tap(air, 'out', 1))).toBe(true)
  })

  it('gives the left ear one tone at 223 Hz and the right ear one at 217 Hz, each at −15.1 dB, at the starting values (claim apart-tones)', async () => {
    const beats = await lab('binaural-beats')
    const apart = played(beats, 'apart')
    const left = hertz(tap(apart, 'left'))
    const right = hertz(tap(apart, 'right'))
    const leftLevel = levelAt(tap(apart, 'left'), 223)
    const rightLevel = levelAt(tap(apart, 'right'), 217)
    expectWritten(left, '223 Hz')
    expectWritten(right, '217 Hz')
    expectWritten(leftLevel, '−15.1 dB')
    expectWritten(rightLevel, '−15.1 dB')
    // The page plays the two ears as one stereo sound: they are the output's two channels.
    expect(alike(tap(apart, 'left'), tap(apart, 'out'))).toBe(true)
    expect(alike(tap(apart, 'right'), tap(apart, 'out', 1))).toBe(true)
  })

  it("finds nothing of the other ear's tone in an ear, and nothing at the key: under −120 dB at 217 Hz and at 220 Hz in the left ear and at 223 Hz in the right (claim apart-nothing)", async () => {
    const beats = await lab('binaural-beats')
    const apart = at(beats)
    const found = [
      levelAt(tap(apart, 'left'), 217),
      levelAt(tap(apart, 'left'), 220),
      levelAt(tap(apart, 'right'), 223),
      levelAt(tap(apart, 'right'), 220),
    ]
    for (const one of found) expectWritten(one, 'under −120 dB')
  })

  it("holds the level of each ear's signal still at −18.1 dB: it moves by less than 0.01 dB over the loop (claim apart-steady)", async () => {
    const beats = await lab('binaural-beats')
    const apart = at(beats)
    // The whole of each level tap, the loop's own crossfade included.
    const left = range(tap(apart, 'levelLeft'))
    const right = range(tap(apart, 'levelRight'))
    expectWritten(left.span, 'less than 0.01 dB')
    expectWritten(right.span, 'less than 0.01 dB')
    expectWritten(left.hi, '−18.1 dB')
    expectWritten(right.hi, '−18.1 dB')
  })

  it("leaves more than 130 dB under each ear's signal once its one steady tone is taken away (claim apart-rest)", async () => {
    const beats = await lab('binaural-beats')
    const apart = at(beats)
    const left = -restAfter(tap(apart, 'left'), [223])
    const right = -restAfter(tap(apart, 'right'), [217])
    expectWritten(left, 'more than 130 dB')
    expectWritten(right, 'more than 130 dB')
    // The fit is not blind: with a tone a hertz off taken away, all of the signal is left.
    expect(restAfter(tap(apart, 'left'), [222])).toBeGreaterThan(-0.01)
  })

  it('finds the beat again when the two ears are added: the sum holds 223 Hz and 217 Hz at −21.2 dB each, and its level falls more than 25 dB 6 times a second (claim added-beat)', async () => {
    const beats = await lab('binaural-beats')
    const apart = at(beats)
    const mid = tap(apart, 'mid')
    const higher = levelAt(mid, 223)
    const lower = levelAt(mid, 217)
    const swing = level(apart, 'levelMid')
    const times = dips(tap(apart, 'levelMid'), swing.hi - 10)
    expectWritten(higher, '−21.2 dB')
    expectWritten(lower, '−21.2 dB')
    expectWritten(swing.span, 'more than 25 dB')
    expect(times).toBe(6)
  })

  it('finds no tone at the rate of the beat in either ear or in the two added: under −120 dB at 6 Hz, and at 3 Hz (claim no-six)', async () => {
    const beats = await lab('binaural-beats')
    const apart = at(beats)
    const found = ['left', 'right', 'mid'].flatMap((id) => [
      levelAt(tap(apart, id), 6),
      levelAt(tap(apart, id), 3),
    ])
    for (const one of found) expectWritten(one, 'under −120 dB')
  })

  it('leaves more than 130 dB under the two ears added once their two tones are taken away (claim sum-rest)', async () => {
    const beats = await lab('binaural-beats')
    const rest = -restAfter(tap(at(beats), 'mid'), [223, 217])
    expectWritten(rest, 'more than 130 dB')
  })

  it("joins the loop with a crossfade that an ear's wave shows and its meter does not: at a Beat of 0.75 Hz, where the tones do not come round, the left ear's outline dips in the first 20 ms and its level line stays still", async () => {
    const beats = await lab('binaural-beats')
    const odd = at(beats, { beat: 0.75 })
    const join = outline(tap(odd, 'left'), 220, 0, FADE)
    const after = outline(tap(odd, 'left'), 220, FADE, seconds(LOOP))
    expect(after.hi - after.lo).toBeLessThan(0.01)
    expect(after.hi - join.lo).toBeGreaterThan(10)
    expect(range(tap(odd, 'levelLeft')).span).toBeLessThan(0.01)
    // Where the tones come round, as on every card, the join shows in neither.
    for (const [name, set] of Object.entries(settings.sets)) {
      const { values } = resolveSet(beats.description, set)
      // The cards of the Binaural's steady tones: one key, no bed, Ears at 1.
      if (values.keys !== 0 || values.bed !== 0 || values.ears !== 1 || values.warmth !== 0)
        continue
      const left = tap(played(beats, name), 'left')
      const whole = outline(left, values.key! + values.beat! / 2, 0, seconds(LOOP))
      expect(whole.hi - whole.lo, name).toBeLessThan(0.01)
    }
  })

  // ---- part 2: the picture -------------------------------------------------------------------

  it('swings the level of each ear by 6.0 dB with Ears at 0.5 (claim half-ears)', async () => {
    const beats = await lab('binaural-beats')
    const half = played(beats, 'halfway')
    const left = level(half, 'levelLeft').span
    const right = level(half, 'levelRight').span
    expectWritten(left, '6.0 dB')
    expectWritten(right, '6.0 dB')
  })

  it('leaves the two ears added as they were whatever Ears says: the sum at Ears 0 and at Ears 0.5 is under −120 dB from the sum at Ears 1 (claim ears-mid)', async () => {
    const beats = await lab('binaural-beats')
    const whole = tap(at(beats), 'mid')
    for (const ears of [0, 0.5]) {
      const apart = differenceDb(tap(at(beats, { ears }), 'mid'), whole)
      expectWritten(apart, 'under −120 dB')
    }
  })

  // ---- part 3: what it is used on ------------------------------------------------------------

  it('renders every named set: the tap its card plays is finite, sounds and stays under full scale', async () => {
    const beats = await lab('binaural-beats')
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = played(beats, name)
      const { tap: plays } = resolveSet(beats.description, set)
      for (const data of result.taps[plays ?? 'out']!.channels_data) {
        expect(
          data.every((v) => Number.isFinite(v)),
          `${name} is finite`,
        ).toBe(true)
        expect(loud(data), `${name} sounds`).toBeGreaterThan(-40)
        expect(peak(data), `${name} stays under full scale`).toBeLessThan(1)
      }
    }
  })

  it('splits every partial of a warm key by the same 6 Hz: with Warmth at 0.3 the left ear holds 223 Hz, 443 Hz and 663 Hz and the right 217 Hz, 437 Hz and 657 Hz, and each ear moves by less than 0.01 dB (claim use-held)', async () => {
    const beats = await lab('binaural-beats')
    const held = played(beats, 'held')
    const left = tap(held, 'left')
    const right = tap(held, 'right')
    for (const hz of [223, 443, 663]) {
      expect(levelAt(left, hz)).toBeGreaterThan(-45)
      expect(levelAt(right, hz)).toBeLessThan(-120)
    }
    for (const hz of [217, 437, 657]) {
      expect(levelAt(right, hz)).toBeGreaterThan(-45)
      expect(levelAt(left, hz)).toBeLessThan(-120)
    }
    expectWritten(level(held, 'levelLeft').span, 'less than 0.01 dB')
    expectWritten(level(held, 'levelRight').span, 'less than 0.01 dB')
  })

  it('plays a chord of three keys at the level of one, −18.1 dB in an ear, every key split by the same 6 Hz: 223 Hz, 278 Hz and 333 Hz in the left ear and 217 Hz, 272 Hz and 327 Hz in the right, each at −19.9 dB, the level of each ear moving by less than 0.01 dB, and the two added fall 19.6 dB 6 times a second (claim use-chord)', async () => {
    const beats = await lab('binaural-beats')
    const chord = played(beats, 'chord')
    const left = tap(chord, 'left')
    const right = tap(chord, 'right')
    const lefts = [223, 278, 333].map((hz) => levelAt(left, hz))
    const rights = [217, 272, 327].map((hz) => levelAt(right, hz))
    const others = [217, 272, 327].map((hz) => levelAt(left, hz))
    const whole = loud(left)
    const swing = level(chord, 'levelMid')
    const times = dips(tap(chord, 'levelMid'), swing.hi - 10)
    for (const one of [...lefts, ...rights]) expectWritten(one, '−19.9 dB')
    for (const one of others) expect(one).toBeLessThan(-120)
    expectWritten(whole, '−18.1 dB')
    expectWritten(level(chord, 'levelLeft').span, 'less than 0.01 dB')
    expectWritten(level(chord, 'levelRight').span, 'less than 0.01 dB')
    expectWritten(swing.span, '19.6 dB')
    expect(times).toBe(6)
    // One key's dip reads deeper on the same meter: its window is a quarter as long.
    expect(level(at(beats), 'levelMid').span).toBeGreaterThan(swing.span + 5)
  })

  it('puts the bed 12 dB under the key with Bed at 0.5, and no sample reaches half of full scale (claim use-bed)', async () => {
    const beats = await lab('binaural-beats')
    const bedded = played(beats, 'bedded')
    const key = loud(tap(at(beats), 'left'))
    const under = key - loud(tap(bedded, 'bedOnly'))
    const underRight = key - loud(tap(bedded, 'bedOnly', 1))
    const top = Math.max(peak(tap(bedded, 'out')), peak(tap(bedded, 'out', 1)))
    expectWritten(under, '12 dB')
    expectWritten(underRight, '12 dB')
    expect(top).toBeLessThan(0.5)
  })

  it('moves a plain 220 Hz tone to 223 Hz in the left ear and 217 Hz in the right through the Ear Shift, with what is left of the other tone more than 60 dB under and of the tone itself more than 40 dB under (claim use-shift)', async () => {
    const beats = await lab('binaural-beats')
    const shifted = played(beats, 'shifted')
    const left = tap(shifted, 'shifted')
    const right = tap(shifted, 'shifted', 1)
    const leftHz = hertz(left)
    const rightHz = hertz(right)
    const other = levelAt(left, 223) - levelAt(left, 217)
    const otherRight = levelAt(right, 217) - levelAt(right, 223)
    const plain = levelAt(left, 223) - levelAt(left, 220)
    expectWritten(leftHz, '223 Hz')
    expectWritten(rightHz, '217 Hz')
    expectWritten(other, 'more than 60 dB')
    expectWritten(otherRight, 'more than 60 dB')
    expectWritten(plain, 'more than 40 dB')
  })

  it("switches the Isochronic's tone between −18.1 dB and exact silence 6 times a second, the same in both ears (claim use-pulse)", async () => {
    const beats = await lab('binaural-beats')
    const pulse = played(beats, 'pulse')
    const swing = level(pulse, 'levelPulsed')
    const times = dips(tap(pulse, 'levelPulsed'), swing.hi - 10)
    const silent = tap(pulse, 'pulsed').filter((v) => v === 0).length / tap(pulse, 'pulsed').length
    expectWritten(swing.hi, '−18.1 dB')
    // −140 dB is where the lab's meter puts exact silence.
    expect(swing.lo).toBe(-140)
    expect(times).toBe(6)
    // Nearly half of the loop is exact zeros: the gaps.
    expect(silent).toBeGreaterThan(0.4)
    expect(alike(tap(pulse, 'pulsed'), tap(pulse, 'pulsed', 1))).toBe(true)
  })

  // ---- part 4: the build ---------------------------------------------------------------------

  it('starts the build with one tone at 220 Hz whose level holds at −18.1 dB, moving by less than 0.01 dB (claim build-tone)', async () => {
    const beats = await lab('binaural-beats')
    const tone = at(beats, { build: 0 })
    const hz = hertz(tap(tone, 'built'))
    const swing = level(tone, 'builtLevel')
    expectWritten(hz, '220 Hz')
    expectWritten(swing.hi, '−18.1 dB')
    expectWritten(swing.span, 'less than 0.01 dB')
    expect(alike(tap(tone, 'built'), tap(tone, 'builtRight'))).toBe(true)
  })

  it('makes the level fall more than 25 dB and come back 6 times a second once there are two tones in the air, and with that piece out it does not (claim build-air)', async () => {
    const beats = await lab('binaural-beats')
    const two = at(beats, { build: 1 })
    const swing = level(two, 'builtLevel')
    const times = dips(tap(two, 'builtLevel'), swing.hi - 10)
    expectWritten(swing.span, 'more than 25 dB')
    expect(times).toBe(6)
    expect(alike(tap(two, 'built'), tap(two, 'builtRight'))).toBe(true)
    // The piece switched off: one tone, whose level does not move.
    expect(
      matchesWritten(level(at(beats, { build: 0 }), 'builtLevel').span, 'more than 25 dB'),
    ).toBe(false)
  })

  it("holds each ear's level still again once each ear has one tone: it moves by less than 0.01 dB, the two added still fall more than 25 dB, and with that piece out the ear's level moves (claim build-ears)", async () => {
    const beats = await lab('binaural-beats')
    const ears = at(beats, { build: 2 })
    const left = level(ears, 'builtLevel').span
    const both = level(ears, 'builtLevelMid').span
    expectWritten(left, 'less than 0.01 dB')
    expectWritten(both, 'more than 25 dB')
    expect(hertz(tap(ears, 'built'))).toBe(223)
    expect(hertz(tap(ears, 'builtRight'))).toBe(217)
    // The piece switched off: both tones in both ears, and the level swings.
    expect(
      matchesWritten(level(at(beats, { build: 1 }), 'builtLevel').span, 'less than 0.01 dB'),
    ).toBe(false)
  })

  it('sends the same two tones to two places: half of the two ears added, with one tone to each ear, is the signal of the step before, under −120 dB apart (claim build-ears-sum)', async () => {
    const beats = await lab('binaural-beats')
    const air = tap(at(beats, { build: 1 }), 'built')
    const added = tap(at(beats, { build: 2 }), 'builtMid')
    expectWritten(differenceDb(added, air), 'under −120 dB')
    // Not a comparison that cannot fail: one ear alone is nothing like the step before.
    expect(differenceDb(tap(at(beats, { build: 2 }), 'built'), air)).toBeGreaterThan(-10)
  })

  it('takes 3.7 dB off the level with Warmth at 1 and moves the peak by less than 0.01 dB, and with that piece out Warmth does nothing (claim build-warmth)', async () => {
    const beats = await lab('binaural-beats')
    const drop = (build: number) => {
      const bare = tap(at(beats, { build }), 'built')
      const warm = tap(at(beats, { build, warmth: 1 }), 'built')
      return {
        level: loud(bare) - loud(warm),
        peak: Math.abs(gainToDb(peak(warm)) - gainToDb(peak(bare))),
      }
    }
    const withPiece = drop(3)
    expectWritten(withPiece.level, '3.7 dB')
    expectWritten(withPiece.peak, 'less than 0.01 dB')
    expect(matchesWritten(drop(2).level, '3.7 dB')).toBe(false)
  })

  it("moves the tallest point of each cycle of the left ear's wave by 2.0 dB with Warmth at 1, while the meter on that ear moves by less than 0.01 dB, and with that piece out the outline holds (claim build-outline)", async () => {
    const beats = await lab('binaural-beats')
    const moved = (build: number) => {
      const warm = at(beats, { build, warmth: 1 })
      const wave = tap(warm, 'built')
      const shape = outline(wave, 220, FADE, wave.length)
      return { outline: shape.hi - shape.lo, level: range(tap(warm, 'builtLevel')).span }
    }
    const withPiece = moved(3)
    expectWritten(withPiece.outline, '2.0 dB')
    expectWritten(withPiece.level, 'less than 0.01 dB')
    expectWritten(moved(2).outline, 'less than 0.01 dB')
  })

  it('adds a bed as loud as the key at Bed 1, so that the two together are 3.0 dB over the key alone, and with that piece out Bed does nothing (claim build-bed)', async () => {
    const beats = await lab('binaural-beats')
    const rise = (build: number) =>
      loud(tap(at(beats, { build, bed: 1 }), 'built')) - loud(tap(at(beats, { build }), 'built'))
    const withPiece = rise(4)
    expectWritten(withPiece, '3.0 dB')
    expect(matchesWritten(rise(3), '3.0 dB')).toBe(false)
  })

  it('builds, with its first five pieces, the Binaural itself: the two are the same, sample for sample (claim build-same)', async () => {
    const beats = await lab('binaural-beats')
    for (const values of [
      {},
      { warmth: 0.3 },
      { warmth: 0.5, bed: 0.4 },
      { ears: 0.5, beat: 1 },
      { keys: 1, warmth: 0.3, bed: 0.5 },
      { keys: 1, key: 440, warmth: 1, bed: 1, beat: 7.3, ears: 0.4, colour: 0 },
    ] as Record<string, number>[]) {
      const built = at(beats, { ...values, build: 4 })
      const where = JSON.stringify(values)
      expect(alike(tap(built, 'built'), tap(built, 'out')), `left, at ${where}`).toBe(true)
      expect(alike(tap(built, 'builtRight'), tap(built, 'out', 1)), `right, at ${where}`).toBe(true)
      expect(built.checks.builtDifference, where).toBeLessThanOrEqual(-140)
      // The pair worked out again from the device's own phases lands on its output too.
      expect(built.checks.pair, where).toBeLessThanOrEqual(-120)
    }
  })

  it("switches the first piece's tone between −18.1 dB and exact silence 6 times a second, and is then the Isochronic's own output, sample for sample (claim build-pulse)", async () => {
    const beats = await lab('binaural-beats')
    const pulse = at(beats, { build: 5 })
    const swing = level(pulse, 'builtLevel')
    const times = dips(tap(pulse, 'builtLevel'), swing.hi - 10)
    expectWritten(swing.hi, '−18.1 dB')
    expect(swing.lo).toBe(-140)
    expect(times).toBe(6)
    for (const values of [
      {},
      { offset: 90, duty: 0.3, edge: 3, depth: 0.6, beat: 9 },
      { offset: 180, key: 440 },
    ] as Record<string, number>[]) {
      const one = at(beats, { ...values, build: 5 })
      const where = JSON.stringify(values)
      expect(alike(tap(one, 'built'), tap(one, 'pulsed')), `left, at ${where}`).toBe(true)
      expect(alike(tap(one, 'builtRight'), tap(one, 'pulsed', 1)), `right, at ${where}`).toBe(true)
    }
    // The piece switched off: the step before does not go silent.
    expect(level(at(beats, { build: 4 }), 'builtLevel').lo).toBeGreaterThan(-20)
  })

  // ---- part 5: inside the engine -------------------------------------------------------------

  it("turns the Binaural's clock 3 times a second at a Beat of 6 Hz, half of Beat (claim clock-turns)", async () => {
    const beats = await lab('binaural-beats')
    const clock = tap(at(beats), 'clock')
    // How far the clock moves from one point to the next, wherever it does not come round.
    let moved = 0
    let steps = 0
    let wraps = 0
    for (let i = 1; i < clock.length; i += 1) {
      if (clock[i]! < clock[i - 1]!) {
        wraps += 1
      } else {
        moved += clock[i]! - clock[i - 1]!
        steps += 1
      }
    }
    const turns = (moved / steps) * POINT_RATE
    expectWritten(turns, '3.00')
    // The loop ends as the clock comes round, so the last wrap falls on the loop's own.
    expect([11, 12]).toContain(wraps)
    expect(range(clock).lo).toBeGreaterThanOrEqual(0)
    expect(range(clock).hi).toBeLessThan(1)
    // And at another Beat it turns at half of that one.
    const other = tap(at(beats, { beat: 10 }), 'clock')
    expect((other[points(0.3)]! - other[points(0.2)]!) * 10).toBeCloseTo(5, 3)
  })

  it('makes the pair 223 Hz and 217 Hz from the one phase and the clock, and half of their sum is the two ears added, under −120 dB apart (claim pair-hz)', async () => {
    const beats = await lab('binaural-beats')
    const apart = at(beats)
    const high = tap(apart, 'high')
    const low = tap(apart, 'low')
    const higher = hertz(high)
    const lower = hertz(low)
    const sum = differenceDb(
      high.map((v, i) => 0.5 * (v + low[i]!)),
      tap(apart, 'mid'),
    )
    expectWritten(higher, '223 Hz')
    expectWritten(lower, '217 Hz')
    expectWritten(sum, 'under −120 dB')
  })

  it('splits the second partial of a 440 Hz key and not the third: at Warmth 1 the left ear holds 443 Hz at −20.0 dB and 883 Hz at −26.0 dB, the right 437 Hz and 877 Hz, and both hold 1,320 Hz at −32.0 dB (claim warm-split)', async () => {
    const beats = await lab('binaural-beats')
    const warm = at(beats, { key: 440, warmth: 1 })
    const left = tap(warm, 'left')
    const right = tap(warm, 'right')
    const first = [levelAt(left, 443), levelAt(right, 437)]
    const second = [levelAt(left, 883), levelAt(right, 877)]
    const third = [levelAt(left, 1320), levelAt(right, 1320)]
    const absent = [
      levelAt(left, 437),
      levelAt(left, 877),
      levelAt(left, 1323),
      levelAt(right, 1317),
    ]
    for (const one of first) expectWritten(one, '−20.0 dB')
    for (const one of second) expectWritten(one, '−26.0 dB')
    for (const one of third) expectWritten(one, '−32.0 dB')
    for (const one of absent) expect(one).toBeLessThan(-120)
  })

  it('lowers the level of an ear by 3.7 dB at Warmth 1 and by 1.6 dB at 0.3, with the peak less than 0.01 dB from where it was (claim warm-level)', async () => {
    const beats = await lab('binaural-beats')
    const bare = tap(at(beats), 'left')
    const drop = (warmth: number) => {
      const warm = tap(at(beats, { warmth }), 'left')
      return {
        level: loud(bare) - loud(warm),
        peak: Math.abs(gainToDb(peak(warm)) - gainToDb(peak(bare))),
      }
    }
    const full = drop(1)
    const some = drop(0.3)
    expectWritten(full.level, '3.7 dB')
    expectWritten(some.level, '1.6 dB')
    expectWritten(full.peak, 'less than 0.01 dB')
    expectWritten(some.peak, 'less than 0.01 dB')
  })

  it('puts what differs between the ears 6.0 dB under what they share at Ears 0.5 and 12.0 dB under at 0.25 (claim ears-side)', async () => {
    const beats = await lab('binaural-beats')
    const half = sideOverMid(at(beats, { ears: 0.5 }))
    const quarter = sideOverMid(at(beats, { ears: 0.25 }))
    expectWritten(-half, '6.0 dB')
    expectWritten(-quarter, '12.0 dB')
  })

  it('makes the bed at Bed 1 as loud as one bare key, less than 0.2 dB from it in each ear, and 12.0 dB quieter at Bed 0.5 (claim bed-square)', async () => {
    const beats = await lab('binaural-beats')
    const key = loud(tap(at(beats), 'left'))
    const full = at(beats, { bed: 1 })
    const half = at(beats, { bed: 0.5 })
    const left = Math.abs(loud(tap(full, 'bedOnly')) - key)
    const right = Math.abs(loud(tap(full, 'bedOnly', 1)) - key)
    const quieter = loud(tap(full, 'bedOnly')) - loud(tap(half, 'bedOnly'))
    expectWritten(left, 'less than 0.2 dB')
    expectWritten(right, 'less than 0.2 dB')
    expectWritten(quieter, '12.0 dB')
  })

  it('gives the two ears unlike noises: the difference of the two beds is 3 dB over either (claim bed-unlike)', async () => {
    const beats = await lab('binaural-beats')
    const full = at(beats, { bed: 1 })
    const apart = differenceDb(tap(full, 'bedOnly'), tap(full, 'bedOnly', 1))
    expectWritten(apart, '3 dB')
  })

  it('reaches the soft clip with Bed at 1: the loudest sample stands at −3.2 dB and less than 0.2 % of the samples of either ear are over half of full scale, where a chord of tones alone stays under it (claim fault-bed)', async () => {
    const beats = await lab('binaural-beats')
    const full = played(beats, 'loud-bed')
    const out = [tap(full, 'out'), tap(full, 'out', 1)]
    const top = gainToDb(Math.max(peak(out[0]!), peak(out[1]!)))
    const over = out.map((x) => (100 * x.filter((v) => Math.abs(v) > 0.5).length) / x.length)
    expectWritten(top, '−3.2 dB')
    for (const share of over) {
      expect(share).toBeGreaterThan(0)
      expectWritten(share, 'less than 0.2 %')
    }
    // The tones alone: three keys, bare and warm, apart and in the air, low and high.
    for (const values of [
      { keys: 1 },
      { keys: 1, warmth: 1 },
      { keys: 1, ears: 0 },
      { keys: 1, key: 80, warmth: 0.5, ears: 0.3 },
      { keys: 1, key: 1000, warmth: 1 },
    ] as Record<string, number>[]) {
      const tones = at(beats, values)
      const most = Math.max(peak(tap(tones, 'out')), peak(tap(tones, 'out', 1)))
      expect(most, JSON.stringify(values)).toBeLessThan(0.5)
    }
  })

  it("draws each ear's one tone in the fine picture: the left ear's line stands highest 3 Hz above the key and the right ear's 3 Hz below it, each at −15.1 dB, with a point 6.0 dB under on either side of each top and nothing else (claim fine-peaks)", async () => {
    const beats = await lab('binaural-beats')
    const apart = at(beats)
    const highest = (x: Float32Array) => x.indexOf(range(x).hi)
    const fineLeft = tap(apart, 'fineLeft')
    const fineRight = tap(apart, 'fineRight')
    const top = range(fineLeft).hi
    // 51 points a hertz apart, the key in the middle.
    expect(fineLeft.length).toBe(51)
    expect(highest(fineLeft) - 25).toBe(3)
    expect(highest(fineRight) - 25).toBe(-3)
    expectWritten(top, '−15.1 dB')
    expectWritten(range(fineRight).hi, '−15.1 dB')
    // One second under the window draws a steady tone three points wide.
    for (const [fine, at] of [
      [fineLeft, 28],
      [fineRight, 22],
    ] as [Float32Array, number][]) {
      expectWritten(fine[at]! - fine[at - 1]!, '6.0 dB')
      expectWritten(fine[at]! - fine[at + 1]!, '6.0 dB')
      // Every other point is at the picture's floor.
      expect(fine.filter((v) => v > -120).length).toBe(3)
    }
    // The picture's axis runs 25 Hz either side of the key.
    expect(apart.taps.fineLeft!.x0).toBe(195)
    expect(apart.taps.fineLeft!.x1).toBe(245)
    // A tone between two points (220.5 Hz, at a Beat of 1 Hz) is shared by them and reads low.
    const between = tap(at(beats, { beat: 1 }), 'fineLeft')
    expect(Math.abs(between[25]! - between[26]!)).toBeLessThan(0.01)
    expect(range(between).hi).toBe(Math.max(between[25]!, between[26]!))
    expect(range(between).hi).toBeLessThan(top - 1)
  })

  it("leaves the Ear Shift's level where it found it, less than 0.1 dB away, and at Ears 0 gives both ears one signal that falls more than 25 dB 6 times a second (claim shift-air)", async () => {
    const beats = await lab('binaural-beats')
    const apart = at(beats)
    const kept = Math.abs(loud(tap(apart, 'shifted')) - loud(tap(apart, 'voice')))
    const air = at(beats, { ears: 0 })
    const swing = level(air, 'levelShifted')
    const times = dips(tap(air, 'levelShifted'), swing.hi - 10)
    expectWritten(kept, 'less than 0.1 dB')
    expectWritten(swing.span, 'more than 25 dB')
    expect(times).toBe(6)
    expect(alike(tap(air, 'shifted'), tap(air, 'shifted', 1))).toBe(true)
  })

  it("moves the level of the Ear Shift's left ear by less than 0.2 dB with the tone well inside the band (claim shift-steady)", async () => {
    const beats = await lab('binaural-beats')
    const span = level(at(beats), 'levelShifted').span
    expectWritten(span, 'less than 0.2 dB')
  })

  it('wavers a 440 Hz tone that sits on the edge of the band: with High at 440 Hz the level of an ear falls more than 30 dB 3 times a second, with High an octave above the tone it moves less than 1.5 dB (claim fault-edge)', async () => {
    const beats = await lab('binaural-beats')
    const edge = played(beats, 'edge')
    const swing = level(edge, 'levelShifted')
    const times = dips(tap(edge, 'levelShifted'), swing.hi - 10)
    const octave = level(at(beats, { key: 440, high: 880 }), 'levelShifted').span
    expectWritten(swing.span, 'more than 30 dB')
    expect(times).toBe(3)
    expectWritten(octave, 'less than 1.5 dB')
  })

  it("opens the Isochronic's gate from 0 to 1 and back 6 times a second, open for half of the loop (claim pulse-gate)", async () => {
    const beats = await lab('binaural-beats')
    const gate = tap(at(beats), 'gate')
    const swing = range(gate)
    const open = gate.reduce((sum, v) => sum + v, 0) / gate.length
    const times = dips(gate, 0.5)
    expect(swing.lo).toBe(0)
    expect(swing.hi).toBe(1)
    expectWritten(open, '0.50')
    expect(times).toBe(6)
  })

  it('loses the pulse when the ears take turns and are added: with Offset at 180° the sum holds at −24.1 dB, moving by less than 0.01 dB, while each ear still goes silent (claim fault-turns)', async () => {
    const beats = await lab('binaural-beats')
    const turns = played(beats, 'cancel')
    const both = level(turns, 'levelPulsedMid')
    const one = level(turns, 'levelPulsed')
    expectWritten(both.hi, '−24.1 dB')
    expectWritten(both.span, 'less than 0.01 dB')
    expect(one.lo).toBe(-140)
    // The way card plays the same Offset, each ear on its own side.
    const way = played(beats, 'turns')
    expect(alike(tap(way, 'pulsed'), tap(turns, 'pulsed'))).toBe(true)
    expect(alike(tap(way, 'pulsed'), tap(way, 'pulsed', 1))).toBe(false)
  })

  it('leaves the tone 12.0 dB down between pulses with Depth at 0.5 (claim way-soft)', async () => {
    const beats = await lab('binaural-beats')
    const soft = played(beats, 'soft')
    const swing = level(soft, 'levelPulsed')
    expectWritten(swing.span, '12.0 dB')
  })

  // ---- part 6: ways to use it ----------------------------------------------------------------

  it('puts the tones 220.5 Hz and 219.5 Hz in the ears at a Beat of 1 Hz, and the two added then dip once a second (claim way-slow)', async () => {
    const beats = await lab('binaural-beats')
    const slow = played(beats, 'slow')
    const left = hertz(tap(slow, 'left'))
    const right = hertz(tap(slow, 'right'))
    const swing = level(slow, 'levelMid')
    const times = dips(tap(slow, 'levelMid'), swing.hi - 10)
    expectWritten(left, '220.5 Hz')
    expectWritten(right, '219.5 Hz')
    expect(times).toBe(1)
  })

  it('puts the tones 240 Hz and 200 Hz in the ears at a Beat of 40 Hz: each ear moves by less than 0.1 dB and the two added dip 40 times a second (claim way-fast)', async () => {
    const beats = await lab('binaural-beats')
    const fast = played(beats, 'fast')
    const left = hertz(tap(fast, 'left'))
    const right = hertz(tap(fast, 'right'))
    const ear = level(fast, 'levelLeft').span
    const swing = level(fast, 'levelMid')
    const times = dips(tap(fast, 'levelMid'), swing.hi - 6)
    expectWritten(left, '240 Hz')
    expectWritten(right, '200 Hz')
    expectWritten(ear, 'less than 0.1 dB')
    expect(times).toBe(40)
  })

  // ---- part 7: what goes wrong ---------------------------------------------------------------

  it('plays the two ears added on the card of the fold to one channel', async () => {
    const beats = await lab('binaural-beats')
    const folded = played(beats, 'folded')
    expect(resolveSet(beats.description, settings.sets.folded!).tap).toBe('mid')
    expect(folded.taps.mid!.channels_data.length).toBe(1)
    expect(alike(tap(folded, 'mid'), tap(at(beats), 'mid'))).toBe(true)
  })

  it('leaves the third partial of a 440 Hz key in the sum: with Warmth at 1 the two ears added dip 13.2 dB, where a 220 Hz key dips more than 25 dB, and neither key moves the level of an ear by 0.01 dB (claim warm-whole)', async () => {
    const beats = await lab('binaural-beats')
    const high = at(beats, { key: 440, warmth: 1 })
    const low = at(beats, { warmth: 1 })
    expectWritten(level(high, 'levelMid').span, '13.2 dB')
    expectWritten(level(low, 'levelMid').span, 'more than 25 dB')
    expectWritten(level(high, 'levelLeft').span, 'less than 0.01 dB')
    expectWritten(level(low, 'levelLeft').span, 'less than 0.01 dB')
  })

  // ---- part 9: the device's own defaults -----------------------------------------------------

  it("starts the page's device table from the Binaural's own defaults: for every control that is a parameter of the device, the settings file's defaults laid over the lab's starting values are device.json's", async () => {
    const beats = await lab('binaural-beats')
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/binaural/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(beats.description, { values: settings.defaults!.values })
    const shared = device.params.filter((one) => one.key in values)
    expect(shared.map((one) => one.key)).toEqual(['beat', 'ears', 'warmth', 'bed', 'colour'])
    // The lab holds a starting value as a single-precision number and the settings file a
    // double, so both sides are compared as single precision.
    for (const one of shared)
      expect(Math.fround(values[one.key]!), one.key).toBe(Math.fround(one.default))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(beats.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
