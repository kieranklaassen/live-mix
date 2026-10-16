import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  expectBuild,
  expectSoundLab,
  expectWritten,
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
  sine,
  type Source,
} from './support.ts'

const NAME = 'rotary-speaker'

/** The lesson's named settings, as the page's cards read them. */
const settings = readSettings(NAME)!

/** The loop's length on the page, in seconds (the lesson's front matter). */
const LOOP = 4

/** A named set as its card plays it: on its own source, with `over` laid on its values. */
async function played(theLab: Lab, name: string, over: Record<string, number> = {}) {
  const set = settings.sets[name]
  if (!set) throw new Error(`The lesson has no set called ${name}`)
  const { values, source } = resolveSet(theLab.description, set)
  return theLab.render(await benchSource(source!, seconds(LOOP)), { ...values, ...over })
}

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!

const db = (x: Float32Array) => gainToDb(rms(x))

/** The speeds the device's source gives its two rotors, in turns a second. */
const HORN = { slow: 0.8, fast: 6.7 }
const DRUM = { slow: 0.67, fast: 5.8 }

/**
 * A steady tone taken apart: its size and its phase at every sample, from the tone multiplied by
 * a cosine and by a sine of its own frequency, each product averaged over `periods` whole cycles.
 */
function demodulated(x: Float32Array, hz: number, periods: number) {
  const n = x.length
  const window = Math.round((periods * RATE) / hz)
  const re = new Float64Array(n + 1)
  const im = new Float64Array(n + 1)
  for (let i = 0; i < n; i += 1) {
    const turn = (2 * Math.PI * hz * i) / RATE
    re[i + 1] = re[i]! + x[i]! * Math.cos(turn)
    im[i + 1] = im[i]! + x[i]! * Math.sin(turn)
  }
  const size = new Float64Array(n)
  const phase = new Float64Array(n)
  for (let i = 0; i + window <= n; i += 1) {
    const a = (re[i + window]! - re[i]!) / window
    const b = (im[i + window]! - im[i]!) / window
    size[i] = 2 * Math.hypot(a, b)
    phase[i] = Math.atan2(b, a)
  }
  return { size, phase, window }
}

/**
 * What a tap made of a steady tone at `hz`: how far its level swings, in dB, its highest and its
 * lowest level against full scale, and how far its pitch goes flat and sharp of `hz`, in cents.
 * `hz` divides the sample rate. A tenth of a second at each end of the loop is left out, where
 * the lab crossfades the join.
 */
function heard(x: Float32Array, hz: number, periods = 4) {
  const { size, phase, window } = demodulated(x, hz, periods)
  // The phase is compared one whole cycle of the tone apart: the ripple the averaging leaves at
  // twice the tone's frequency is then the same at both ends and drops out of the difference.
  const lag = Math.round(RATE / hz)
  const from = seconds(0.1)
  const to = size.length - window - lag - seconds(0.1)
  let lo = Infinity
  let hi = 0
  let sharp = -Infinity
  let flat = Infinity
  for (let i = from; i < to; i += 1) {
    lo = Math.min(lo, size[i]!)
    hi = Math.max(hi, size[i]!)
    let step = phase[i + lag]! - phase[i]!
    if (step > Math.PI) step -= 2 * Math.PI
    if (step < -Math.PI) step += 2 * Math.PI
    // The phase moves on by 2π(hz − heard)/RATE a sample.
    const cents = 1200 * Math.log2(1 - (step * RATE) / (lag * 2 * Math.PI * hz))
    sharp = Math.max(sharp, cents)
    flat = Math.min(flat, cents)
  }
  return {
    swing: gainToDb(hi / Math.max(lo, 1e-12)),
    hi: gainToDb(hi),
    lo: gainToDb(lo),
    flat: -flat,
    sharp,
  }
}

/** The point at which a value over time is highest, from `from` up to `to`. */
function highestAt(x: ArrayLike<number>, from = 0, to = x.length) {
  let at = from
  for (let i = from; i < to; i += 1) if (x[i]! > x[at]!) at = i
  return at
}

/**
 * How long after the point `from` a value first stands at `level` or beyond it, going `up` or
 * down, in seconds; NaN when it never does.
 */
function reaches(x: ArrayLike<number>, from: number, level: number, up: boolean) {
  for (let i = from; i < x.length; i += 1) {
    if (up ? x[i]! >= level : x[i]! <= level) return (i - from) / POINT_RATE
  }
  return NaN
}

/** The share of the way a thing that coasts towards a value has covered after one time constant. */
const SHARE = 1 - Math.exp(-1)

/** A tone at 3 kHz, well above the crossover: nearly all of it goes to the horn. */
const high = (length = LOOP) => sine(3000, 0.25, seconds(length))
/** A tone at 200 Hz, well below the crossover: nearly all of it goes to the drum. */
const low = (length = LOOP) => sine(200, 0.25, seconds(length))

/**
 * The horn's part of the build's sound at a step before the drum is in: the sound so far less
 * the low band, which until then is read straight back from its line one sample late.
 */
function hornAlone(result: RenderResult) {
  const built = tap(result, 'built')
  const lows = tap(result, 'builtLows')
  const horn = new Float32Array(built.length)
  for (let i = 1; i < horn.length; i += 1) horn[i] = built[i]! - lows[i - 1]!
  return horn
}

describe('the rotary speaker lab', () => {
  it('writes every tap, loops, and answers every control', async () => {
    const cabinet = await lab(NAME)
    const pad = await benchSource('pad', seconds(LOOP))
    const first = cabinet.render(pad, {})
    // At the lesson's start Speed holds, so the two speeds are flat lines. Acceleration acts only
    // where the speed changes, which Second half makes it do.
    expectSoundLab(cabinet, pad, first, {
      quiet: ['hornSpeed', 'drumSpeed'],
      when: { acceleration: { secondHalf: 2 } },
    })
    expect(first.checks.rebuilt).toBeLessThanOrEqual(-120)
  })

  it('builds the cabinet in eight steps, each of which changes what is built, and the last is the device', async () => {
    const cabinet = await lab(NAME)
    const pad = await benchSource('pad', seconds(LOOP))
    // With the speed changing, the microphones back and the amplifier on, so that the pieces of
    // steps 6, 7 and 8 have something to do.
    expectBuild(cabinet, pad, { secondHalf: 2, distance: 0.5, drive: 0.5 })
  })

  it('is, as built, more than 120 dB under the device on every loop at four settings, and the microphones read again are too (claim built-same)', async () => {
    const cabinet = await lab(NAME)
    let worst = -Infinity
    let worstRead = -Infinity
    for (const id of ['pad', 'chords', 'guitar', 'saw', 'mix', 'bass', 'drums', 'noise', 'sine']) {
      const source = await benchSource(id, seconds(LOOP))
      for (const values of [
        {},
        { speed: 1, distance: 0.5, drive: 0.5, balance: 0.3, mix: 0.6 },
        { secondHalf: 2, distance: 1, drive: 1, spread: 1 },
        { speed: 1, secondHalf: 3, hornDepth: 0.6, drumDepth: 0.5, acceleration: 4, spread: 0 },
      ]) {
        const result = cabinet.render(source, values)
        worst = Math.max(worst, result.checks.builtDifference!)
        worstRead = Math.max(worstRead, result.checks.rebuilt!)
      }
    }
    expectWritten(-worst, 'more than 120 dB')
    expectWritten(-worstRead, 'more than 120 dB')
  })

  it('stands still with the device when the sound stops: the build stays the device across a silence', async () => {
    const cabinet = await lab(NAME)
    const source = sine(1000, 0.25, seconds(LOOP))
    for (let i = seconds(1); i < seconds(3); i += 1) {
      source.left[i] = 0
      source.right[i] = 0
    }
    const result = cabinet.render(source, { distance: 0.5, drive: 0.5 })
    expect(result.checks.builtDifference).toBeLessThanOrEqual(-120)
    expect(result.checks.rebuilt).toBeLessThanOrEqual(-120)
  })
})

describe('part 1: a level that is ridden, and a horn that turns', () => {
  it('rides the level of a tone over 12.0 dB and nothing else (claim ridden-level)', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(high(), {})
    expectWritten(heard(tap(result, 'ridden'), 3000).swing, '12.0 dB')
  })

  it('leaves the pitch of the ridden tone less than 0.1 cents from where it was (claim ridden-pitch)', async () => {
    const cabinet = await lab(NAME)
    const ridden = heard(tap(cabinet.render(high(), {}), 'ridden'), 3000)
    expectWritten(Math.max(ridden.flat, ridden.sharp), 'less than 0.1 cents')
  })

  it('at Slow swings the horn 4.8 cents flat and 4.8 cents sharp, its loudness over 12.0 dB, and left against right over 19.1 dB (claim turned-three)', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(high(), {})
    const pitch = range(tap(result, 'pitch'))
    expectWritten(-pitch.lo, '4.8 cents')
    expectWritten(pitch.hi, '4.8 cents')
    expectWritten(range(tap(result, 'loudness')).span, '12.0 dB')
    expectWritten(range(tap(result, 'side')).span, '19.1 dB')
    // The pitch is in the sound, and not only in the lab's reading of the delay.
    const moved = heard(tap(result, 'doppler'), 3000)
    expect(Math.abs(moved.flat + pitch.lo)).toBeLessThan(0.2)
    expect(Math.abs(moved.sharp - pitch.hi)).toBeLessThan(0.2)
    // The other microphone hears the same swings.
    expectWritten(range(tap(result, 'loudnessRight')).span, '12.0 dB')
    expectWritten(range(tap(result, 'pitchRight')).hi, '4.8 cents')
  })

  it('at Fast keeps the loudness swing at 12.0 dB and takes the pitch from 40.6 cents flat to 39.7 cents sharp (claim fast-pitch)', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(high(), { speed: 1 })
    const pitch = range(tap(result, 'pitch'))
    expectWritten(range(tap(result, 'loudness')).span, '12.0 dB')
    expectWritten(-pitch.lo, '40.6 cents')
    expectWritten(pitch.hi, '39.7 cents')
    // In the sound, by a tone taken apart: within a cent and a half of the delay's own slope.
    const moved = heard(tap(result, 'doppler'), 3000, 2)
    expect(Math.abs(moved.flat + pitch.lo)).toBeLessThan(1.5)
    expect(Math.abs(moved.sharp - pitch.hi)).toBeLessThan(1.5)
  })

  it('hears the highest pitch 0.25 of a turn before the loudest moment, when the pitch is less than 0.1 cents from the played one (claim quarter-turn)', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(high(), {})
    const turn = Math.round(POINT_RATE / HORN.slow)
    const loudest = highestAt(tap(result, 'loudness'), points(1.5), points(1.5) + turn)
    const sharpest = highestAt(tap(result, 'pitch'), loudest - turn, loudest)
    expectWritten(((loudest - sharpest) / POINT_RATE) * HORN.slow, '0.25')
    expectWritten(Math.abs(tap(result, 'pitch')[loudest]!), 'less than 0.1 cents')
    // The loudest moment is the one at which the horn points at the left microphone.
    const stand = tap(result, 'mics')[0]!
    const pointing = tap(result, 'hornAngle')[loudest]! - (1 + stand)
    expect(Math.abs(pointing)).toBeLessThan(0.001)
  })
})

describe('part 2: the picture', () => {
  it('reads 3.4 dB on the loudness row when the horn points at the left microphone (claim picture-top)', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(await benchSource('pad', seconds(LOOP)), {})
    const loudness = tap(result, 'loudness')
    expectWritten(range(loudness).hi, '3.4 dB')
    // The first time round: the horn comes to the left microphone 0.66 of a turn into the loop.
    const loudest = highestAt(loudness, 0, Math.round(POINT_RATE / HORN.slow))
    expect(
      Math.abs(tap(result, 'hornAngle')[loudest]! - (1 + tap(result, 'mics')[0]!)),
    ).toBeLessThan(0.001)
    // The picture opens on that instant, within a hundredth of a second (the figure's `start`).
    expect(Math.abs(loudest / POINT_RATE - 0.82)).toBeLessThan(0.01)
  })

  it('reads 4.8 cents at the top of the pitch row, a quarter of a turn earlier (claim picture-sharp)', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(await benchSource('pad', seconds(LOOP)), {})
    const pitch = tap(result, 'pitch')
    expectWritten(range(pitch).hi, '4.8 cents')
    const loudest = highestAt(tap(result, 'loudness'), 0, Math.round(POINT_RATE / HORN.slow))
    const quarter = Math.round(POINT_RATE / HORN.slow / 4)
    expect(range(pitch).hi - pitch[loudest - quarter]!).toBeLessThan(0.01)
  })

  it('lays the third row flat at Spread 0, where the two microphones stand in one place', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(await benchSource('pad', seconds(LOOP)), { spread: 0 })
    expect(range(tap(result, 'side')).span).toBe(0)
    const left = tap(result, 'out', 0)
    expect(tap(result, 'out', 1).every((value, i) => value === left[i])).toBe(true)
  })
})

describe('part 3: what it is used on', () => {
  it("on held chords at the device's own depths swings the horn over 4.0 dB and keeps it within 2.9 cents (claim use-pad)", async () => {
    const cabinet = await lab(NAME)
    const result = await played(cabinet, 'usePad')
    expectWritten(range(tap(result, 'loudness')).span, '4.0 dB')
    const pitch = range(tap(result, 'pitch'))
    expectWritten(Math.max(-pitch.lo, pitch.hi), '2.9 cents')
  })

  it('renders every named set on its own source, with sound in the tap its card plays', async () => {
    const cabinet = await lab(NAME)
    for (const name of Object.keys(settings.sets)) {
      const set = settings.sets[name]!
      const result = await played(cabinet, name)
      const sound = tap(result, set.tap ?? 'out')
      expect(
        sound.every((value) => Number.isFinite(value)),
        name,
      ).toBe(true)
      expect(db(sound), `${name} sounds`).toBeGreaterThan(-40)
      expect(peak(sound), `${name} stays under full scale`).toBeLessThan(1)
      expect(result.checks.builtDifference, name).toBeLessThanOrEqual(-120)
    }
  })

  it('gathers speed on the card that changes it: Fast is asked for at the middle of the loop and Slow at its start', async () => {
    const cabinet = await lab(NAME)
    const result = await played(cabinet, 'useRun')
    const horn = tap(result, 'hornSpeed')
    const drum = tap(result, 'drumSpeed')
    const middle = points(LOOP / 2)
    // Winding down through the first half, and up through the second, the drum behind the horn.
    expect(horn[middle - 1]!).toBeLessThan(horn[0]!)
    expect(horn[points(LOOP) - 1]!).toBeGreaterThan(6.6)
    expect(drum[points(LOOP) - 1]!).toBeLessThan(5.0)
    expect(drum[points(LOOP) - 1]!).toBeGreaterThan(drum[middle]!)
  })
})

describe('part 4: the build, a piece at a time', () => {
  it('puts a tone at 800 Hz 6.0 dB down in each band and less than 0.1 dB from its level in the two added, as it does at every frequency (claim bands-800)', async () => {
    const cabinet = await lab(NAME)
    const at = cabinet.render(sine(800, 0.25, seconds(2)), { build: 0 })
    expectWritten(db(tap(at, 'in')) - db(tap(at, 'builtLows')), '6.0 dB')
    expectWritten(db(tap(at, 'in')) - db(tap(at, 'builtHighs')), '6.0 dB')
    for (const hz of [100, 400, 800, 1600, 6400]) {
      const result = cabinet.render(sine(hz, 0.25, seconds(2)), { build: 0 })
      expectWritten(Math.abs(db(tap(result, 'built')) - db(tap(result, 'in'))), 'less than 0.1 dB')
    }
  })

  it('takes 12.0 dB off the horn between the front of the turn and the back, and nothing without the piece (claim horn-swing)', async () => {
    const cabinet = await lab(NAME)
    const turning = cabinet.render(high(), { build: 1 })
    expectWritten(heard(hornAlone(turning), 3000).swing, '12.0 dB')
    expectWritten(range(tap(turning, 'builtLoudness')).span, '12.0 dB')
    const still = cabinet.render(high(), { build: 0 })
    expect(matchesWritten(heard(hornAlone(still), 3000).swing, '12.0 dB')).toBe(false)
    expect(heard(hornAlone(still), 3000).swing).toBeLessThan(0.01)
  })

  it('lets the right microphone hear its loudest moment 0.35 s after the left at Slow, and no moment without the piece (claim mics-apart)', async () => {
    const cabinet = await lab(NAME)
    const turn = Math.round(POINT_RATE / HORN.slow)
    const apart = (build: number) => {
      const result = cabinet.render(high(), { build })
      const left = highestAt(tap(result, 'builtLoudness'), points(1), points(1) + turn)
      const right = highestAt(tap(result, 'builtLoudnessRight'), left, left + turn)
      return (right - left) / POINT_RATE
    }
    expectWritten(apart(1), '0.35 s')
    expect(matchesWritten(apart(0), '0.35 s')).toBe(false)
  })

  it('darkens the back of the turn: a tone at 6 kHz in the horn falls by 19 dB and one at 3 kHz by 16 dB, and by 12.0 dB each without the piece (claim shade-swing)', async () => {
    const cabinet = await lab(NAME)
    const swing = (hz: number, build: number) =>
      heard(hornAlone(cabinet.render(sine(hz, 0.25, seconds(LOOP)), { build })), hz).swing
    expectWritten(swing(6000, 2), '19 dB')
    expectWritten(swing(3000, 2), '16 dB')
    expectWritten(swing(6000, 1), '12.0 dB')
    expectWritten(swing(3000, 1), '12.0 dB')
    expect(matchesWritten(swing(6000, 1), '19 dB')).toBe(false)
    expect(matchesWritten(swing(3000, 1), '16 dB')).toBe(false)
    // Four fifths of what is heard at the back is the dark copy.
    expect(range(tap(cabinet.render(high(), { build: 2 }), 'builtShade')).hi).toBeCloseTo(0.8, 5)
    expect(range(tap(cabinet.render(high(), { build: 1 }), 'builtShade')).hi).toBe(0)
  })

  it("swings the horn's delay over 1.1 ms at Horn Depth 1 (claim path-swing)", async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(high(), {})
    expectWritten(range(tap(result, 'pathMs')).span, '1.1 ms')
    expectWritten(range(tap(result, 'pathMsRight')).span, '1.1 ms')
  })

  it('bends the pitch 4.8 cents each way at Slow and from 40.6 cents flat to 39.7 cents sharp at Fast, and not at all without the piece (claim pitch-swing)', async () => {
    const cabinet = await lab(NAME)
    const slow = range(tap(cabinet.render(high(), { build: 3 }), 'builtPitch'))
    expectWritten(-slow.lo, '4.8 cents')
    expectWritten(slow.hi, '4.8 cents')
    const fast = range(tap(cabinet.render(high(), { build: 3, speed: 1 }), 'builtPitch'))
    expectWritten(-fast.lo, '40.6 cents')
    expectWritten(fast.hi, '39.7 cents')
    const before = range(tap(cabinet.render(high(), { build: 2, speed: 1 }), 'builtPitch'))
    expect(matchesWritten(-before.lo, '40.6 cents')).toBe(false)
    expect(matchesWritten(before.hi, '39.7 cents')).toBe(false)
    expect(before.span).toBe(0)
    // And in the sound: the horn's part of the build with the piece, and without it.
    const bent = heard(hornAlone(cabinet.render(high(), { build: 3, speed: 1 })), 3000, 2)
    const straight = heard(hornAlone(cabinet.render(high(), { build: 1, speed: 1 })), 3000, 2)
    expect(bent.sharp).toBeGreaterThan(35)
    expect(straight.sharp).toBeLessThan(1)
  })

  it('takes 6.0 dB off the drum between front and back, bends it 1.5 cents each way at Slow and 12.7 cents flat to 12.6 cents sharp at Fast, and leaves it still without the piece (claim drum-swing)', async () => {
    const cabinet = await lab(NAME)
    const slow = cabinet.render(low(), { build: 4 })
    expectWritten(range(tap(slow, 'builtDrumLoudness')).span, '6.0 dB')
    const wobble = range(tap(slow, 'drumPitch'))
    expectWritten(-wobble.lo, '1.5 cents')
    expectWritten(wobble.hi, '1.5 cents')
    const fast = range(tap(cabinet.render(low(), { speed: 1 }), 'drumPitch'))
    expectWritten(-fast.lo, '12.7 cents')
    expectWritten(fast.hi, '12.6 cents')
    const before = cabinet.render(low(), { build: 3 })
    expect(matchesWritten(range(tap(before, 'builtDrumLoudness')).span, '6.0 dB')).toBe(false)
    // In the sound: a low tone swells with the piece and hardly at all without it.
    expect(heard(tap(slow, 'built'), 200, 2).swing).toBeGreaterThan(5)
    expect(heard(tap(before, 'built'), 200, 2).swing).toBeLessThan(1)
  })

  it('covers 63 % of the way from Slow to Fast in 0.25 s for the horn and 1.50 s for the drum, and in no time without the piece (claim weights)', async () => {
    const cabinet = await lab(NAME)
    const long = sine(1000, 0.25, seconds(8))
    const middle = points(4)
    const times = (build: number) => {
      const result = cabinet.render(long, { secondHalf: 2, build })
      const horn = tap(result, 'builtHornSpeed')
      const drum = tap(result, 'builtDrumSpeed')
      const hornFrom = horn[middle - 1]!
      const drumFrom = drum[middle - 1]!
      return {
        horn: reaches(horn, middle, hornFrom + SHARE * (HORN.fast - hornFrom), true),
        drum: reaches(drum, middle, drumFrom + SHARE * (DRUM.fast - drumFrom), true),
      }
    }
    const weighted = times(5)
    expectWritten(weighted.horn, '0.25 s')
    expectWritten(weighted.drum, '1.50 s')
    const weightless = times(4)
    expect(matchesWritten(weightless.horn, '0.25 s')).toBe(false)
    expect(matchesWritten(weightless.drum, '1.50 s')).toBe(false)
  })

  it('brings the horn to rest 1.23 s after Brake is asked for from Slow and the drum 2.20 s after, and at once without the piece (claim brake-rest)', async () => {
    const cabinet = await lab(NAME)
    const long = sine(1000, 0.25, seconds(8))
    const middle = points(4)
    const rests = (build: number) => {
      const result = cabinet.render(long, { secondHalf: 3, build })
      return {
        horn: reaches(tap(result, 'builtHornSpeed'), middle, 0, false),
        drum: reaches(tap(result, 'builtDrumSpeed'), middle, 0, false),
        result,
      }
    }
    const weighted = rests(5)
    expectWritten(weighted.horn, '1.23 s')
    expectWritten(weighted.drum, '2.20 s')
    // The horn was at its Slow speed when Brake was asked for; the drum not quite.
    expect(tap(weighted.result, 'builtHornSpeed')[middle - 1]!).toBeCloseTo(HORN.slow, 2)
    expect(tap(weighted.result, 'builtDrumSpeed')[middle - 1]!).toBeLessThan(DRUM.slow - 0.03)
    const weightless = rests(4)
    expect(matchesWritten(weightless.horn, '1.23 s')).toBe(false)
    expect(matchesWritten(weightless.drum, '2.20 s')).toBe(false)
  })

  it('at Distance 1 leaves the straight sound a swing of 3.1 dB, and of 12.0 dB without the piece (claim walls-swing)', async () => {
    const cabinet = await lab(NAME)
    const far = cabinet.render(high(), { distance: 1, build: 6 })
    expectWritten(range(tap(far, 'builtLoudness')).span, '3.1 dB')
    const before = cabinet.render(high(), { distance: 1, build: 5 })
    expectWritten(range(tap(before, 'builtLoudness')).span, '12.0 dB')
    expect(matchesWritten(range(tap(before, 'builtLoudness')).span, '3.1 dB')).toBe(false)
    // The walls are in the sound: with them the build is not what it was.
    expect(db(tap(far, 'built')) - db(tap(before, 'built'))).not.toBe(0)
  })

  it('at Drive 1 brings a quiet tone out 4.7 dB louder than at Drive 0, and no louder without the piece (claim amp-quiet)', async () => {
    const cabinet = await lab(NAME)
    const quiet = sine(200, 0.001, seconds(2))
    const lift = (build: number) =>
      db(tap(cabinet.render(quiet, { drive: 1, build }), 'built')) -
      db(tap(cabinet.render(quiet, { drive: 0, build }), 'built'))
    expectWritten(lift(7), '4.7 dB')
    expect(matchesWritten(lift(6), '4.7 dB')).toBe(false)
    expect(lift(6)).toBe(0)
    // Loud playing is held back: a tone near full scale comes out quieter than it went in.
    const loud = sine(200, 0.9, seconds(2))
    const held = cabinet.render(loud, { drive: 1 })
    expect(db(tap(held, 'driven')) - db(tap(held, 'in'))).toBeLessThan(-6)
  })
})

describe('part 5: the device, stage by stage', () => {
  it('sends a tone at 200 Hz to the horn 24.6 dB down and a tone at 3,200 Hz to the drum 24.8 dB down (claim split-bands)', async () => {
    const cabinet = await lab(NAME)
    const below = cabinet.render(sine(200, 0.25, seconds(2)), {})
    expectWritten(db(tap(below, 'driven')) - db(tap(below, 'highs')), '24.6 dB')
    const above = cabinet.render(sine(3200, 0.25, seconds(2)), {})
    expectWritten(db(tap(above, 'driven')) - db(tap(above, 'lows')), '24.8 dB')
    // The spectra drawn for the stage: the two bands together are flat.
    expect(range(tap(above, 'splitSum')).span).toBeLessThan(0.01)
  })

  it('on the device covers 63 % of the way up in 0.25 s and 1.50 s, and of the way back down in 0.50 s and 1.90 s (claim device-weights)', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(sine(1000, 0.25, seconds(8)), { secondHalf: 2 })
    const horn = tap(result, 'hornSpeed')
    const drum = tap(result, 'drumSpeed')
    const middle = points(4)
    const up = (speed: Float32Array, to: number) =>
      reaches(speed, middle, speed[middle - 1]! + SHARE * (to - speed[middle - 1]!), true)
    // At the loop's start Speed is Slow again, and the rotors are still close to Fast.
    const down = (speed: Float32Array, to: number) =>
      reaches(speed, 0, speed[0]! + SHARE * (to - speed[0]!), false)
    expectWritten(up(horn, HORN.fast), '0.25 s')
    expectWritten(up(drum, DRUM.fast), '1.50 s')
    expectWritten(down(horn, HORN.slow), '0.50 s')
    expectWritten(down(drum, DRUM.slow), '1.90 s')
  })

  it('through the moving delay alone bends a tone from 40.6 cents flat to 39.7 cents sharp at Fast and changes its level by less than 0.1 dB (claim doppler-fast)', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(high(), { speed: 1 })
    const pitch = range(tap(result, 'pitch'))
    expectWritten(-pitch.lo, '40.6 cents')
    expectWritten(pitch.hi, '39.7 cents')
    const moved = heard(tap(result, 'doppler'), 3000, 2)
    // Its level, a twentieth of a second at a time: each stretch holds a third of a turn.
    const levels: number[] = []
    const sound = tap(result, 'doppler')
    for (let from = seconds(0.1); from + seconds(0.05) <= sound.length; from += seconds(0.05)) {
      levels.push(gainToDb(rms(sound, from, from + seconds(0.05))))
    }
    expectWritten(range(levels).span, 'less than 0.1 dB')
    expect(Math.abs(moved.flat + pitch.lo)).toBeLessThan(1.5)
    expect(Math.abs(moved.sharp - pitch.hi)).toBeLessThan(1.5)
  })

  it("keeps the level of a tone ridden by the horn's gain less than 0.1 dB from what went in, over four whole turns (claim makeup-holds)", async () => {
    const cabinet = await lab(NAME)
    // Five seconds at 0.8 turns a second is four turns.
    const result = cabinet.render(high(5), {})
    expectWritten(Math.abs(db(tap(result, 'ridden')) - db(tap(result, 'in'))), 'less than 0.1 dB')
  })

  it('at either end of Balance silences one band and puts the other 3.0 dB up (claim balance-ends)', async () => {
    const cabinet = await lab(NAME)
    const pad = await benchSource('pad', seconds(LOOP))
    const hornOnly = cabinet.render(pad, { balance: 1 })
    const drumOnly = cabinet.render(pad, { balance: 0 })
    expectWritten(db(tap(hornOnly, 'out')) - db(tap(hornOnly, 'horn')), '3.0 dB')
    expectWritten(db(tap(drumOnly, 'out')) - db(tap(drumOnly, 'drum')), '3.0 dB')
    // Nothing of the other band is left: the output is the one band, times the square root of 2.
    for (const [result, band] of [
      [hornOnly, 'horn'],
      [drumOnly, 'drum'],
    ] as const) {
      const out = tap(result, 'out')
      const alone = tap(result, band)
      let apart = 0
      for (let i = seconds(0.1); i < out.length; i += 1) {
        apart = Math.max(apart, Math.abs(out[i]! - Math.SQRT2 * alone[i]!))
      }
      expect(apart, band).toBeLessThan(1e-6)
    }
  })
})

describe('part 7: what goes wrong', () => {
  it('with Mix at one half takes a tone at 6 kHz more than 20 dB under the level it went in at, at its quietest (claim mix-cancels)', async () => {
    const cabinet = await lab(NAME)
    const tone = sine(6000, 0.25, seconds(LOOP))
    const result = cabinet.render(tone, { mix: 0.5 })
    expectWritten(gainToDb(0.25) - heard(tap(result, 'out'), 6000).lo, 'more than 20 dB')
    // With Mix at 1 the same tone never falls so far, however dark the back of the turn is.
    const whole = cabinet.render(tone, {})
    expect(gainToDb(0.25) - heard(tap(whole, 'out'), 6000).lo).toBeLessThan(20)
  })

  it('on its card parks the horn with the left microphone hearing it 8.0 dB louder than the right (claim brake-parks)', async () => {
    const cabinet = await lab(NAME)
    const result = await played(cabinet, 'faultBrake')
    const last = points(LOOP) - 1
    expect(tap(result, 'hornSpeed')[last]).toBe(0)
    expectWritten(tap(result, 'side')[last]!, '8.0 dB')
  })

  it('makes silence of a tone that is turned over on one side (claim sides-cancel)', async () => {
    const cabinet = await lab(NAME)
    const wide: Source = sine(1000, 0.25, seconds(2))
    for (let i = 0; i < wide.right.length; i += 1) wide.right[i] = -wide.left[i]!
    const result = cabinet.render(wide, {})
    // Silence but for what a float leaves of a cosine at a quarter of a turn: the device's Mix at 1
    // lets through 6 parts in a hundred thousand million million of the sound that came in.
    expect(peak(tap(result, 'out', 0))).toBeLessThan(1e-15)
    expect(peak(tap(result, 'out', 1))).toBeLessThan(1e-15)
    expect(peak(tap(result, 'driven'))).toBe(0)
    expect(peak(tap(result, 'horn'))).toBe(0)
    expect(peak(tap(result, 'drum'))).toBe(0)
  })

  it('leaves the horn standing still 0.2 s after a tone stops, and starts it again from there (claim sleeps)', async () => {
    const cabinet = await lab(NAME)
    const source = sine(1000, 0.25, seconds(LOOP))
    for (let i = seconds(1); i < seconds(3); i += 1) {
      source.left[i] = 0
      source.right[i] = 0
    }
    const result = cabinet.render(source, {})
    const angle = tap(result, 'hornAngle')
    let stopped = NaN
    for (let i = points(1); i < angle.length - 1; i += 1) {
      if (angle[i + 1] === angle[i]) {
        stopped = i / POINT_RATE - 1
        break
      }
    }
    expectWritten(stopped, '0.2 s')
    // It stands where it stopped until the tone returns at 3 s, and moves on from there.
    expect(angle[points(2.9)]).toBe(angle[points(1.5)])
    expect(angle[points(3.2)]).not.toBe(angle[points(2.9)])
  })

  it('moves a bass far less than a bright tone: all but a sliver of a tone at 100 Hz goes to the drum', async () => {
    const cabinet = await lab(NAME)
    const result = cabinet.render(sine(100, 0.25, seconds(2)), {})
    expect(db(tap(result, 'driven')) - db(tap(result, 'highs'))).toBeGreaterThan(30)
    expect(db(tap(result, 'driven')) - db(tap(result, 'lows'))).toBeLessThan(0.5)
  })
})

describe('part 9: the device', () => {
  it("starts the page's device table from the Rotary's own defaults: the settings file's defaults, laid over the lab's starting values, are device.json's for each of its nine parameters", async () => {
    const cabinet = await lab(NAME)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/rotary/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(cabinet.description, { values: settings.defaults!.values })
    expect(device.params).toHaveLength(9)
    // A control's start is a float, so 0.7 is held as a float holds it.
    for (const one of device.params) expect(values[one.key], one.key).toBeCloseTo(one.default, 6)
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(cabinet.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
    // The one control that is the lab's own starts where it does nothing.
    expect(values.secondHalf).toBe(0)
  })
})
