import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  points,
  range,
  RATE,
  rms,
  seconds,
  silence,
} from './support.ts'

const ID = 'oscillators-and-subtractive-voice'

// Nothing goes in: the lab plays the note itself. Its key goes down 30 ms into the loop.
const nothing = () => silence(seconds(4))
const DOWN = 1440
/** The sample that stands `s` seconds after the key went down. */
const after = (s: number) => DOWN + seconds(s)
/** The point of a control tap that stands `s` seconds after the key went down. */
const tick = (s: number) => points(s + DOWN / RATE)

/** The first channel of a tap. */
const tap = (result: RenderResult, id: string) => result.taps[id]!.channels_data[0]!

/** The steps of the build path, as the lab numbers them. */
const STEP = { oscillator: 0, second: 1, sub: 2, filter: 3, level: 4, sweep: 5 }

/** The lab's starting Pitch, in hertz. */
const PITCH = 110

/** The size, in dB, of the part of `x` that turns at `hz`, under a Hann window `length` long. */
function sizeDb(x: Float32Array, hz: number, from: number, length: number): number {
  const w = (2 * Math.PI * hz) / RATE
  let re = 0
  let im = 0
  for (let n = 0; n < length; n += 1) {
    const v = x[from + n]! * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / length))
    re += v * Math.cos(w * n)
    im -= v * Math.sin(w * n)
  }
  return 10 * Math.log10(Math.max(re * re + im * im, 1e-300)) - 20 * Math.log10(length / 4)
}

/** Harmonic `k` of a note at `hz`, in dB, over half a second from `s` seconds after the key. */
const harmonic = (x: Float32Array, hz: number, k: number, s: number, length = 24000) =>
  sizeDb(x, hz * k, after(s), length)

/** How far harmonic `k` stands under harmonic `under`, in dB, both read as `harmonic` reads them. */
const below = (x: Float32Array, hz: number, k: number, s: number, length = 24000, under = 1) =>
  harmonic(x, hz, under, s, length) - harmonic(x, hz, k, s, length)

/**
 * The moments, in seconds from `from`, at which the part of `x` at `hz` is at its weakest: each
 * a dip 12 dB or more under the strongest that part gets, read over four cycles at a time.
 */
function dips(x: Float32Array, hz: number, from: number, to: number) {
  const length = Math.round((4 * RATE) / hz)
  const sizes: number[] = []
  for (let at = from; at < to; at += 48) sizes.push(sizeDb(x, hz, at, length))
  const top = Math.max(...sizes)
  const found: number[] = []
  for (let i = 1; i < sizes.length - 1; i += 1) {
    if (sizes[i]! < top - 12 && sizes[i]! < sizes[i - 1]! && sizes[i]! <= sizes[i + 1]!)
      found.push((i * 48) / RATE)
  }
  const times = found.filter((t, i) => i === 0 || t - found[i - 1]! > 0.1)
  const depths = times.map((t) => top - sizes[Math.round((t * RATE) / 48)]!)
  return { times, depths }
}

/** How many dips a second: 0 where there are fewer than two. */
const perSecond = (times: number[]) =>
  times.length > 1 ? (times.length - 1) / (times[times.length - 1]! - times[0]!) : 0

/** The point at which a control tap first stands at its highest. */
function topOf(x: Float32Array): number {
  const top = range(x).hi
  let at = 0
  while (x[at]! < top) at += 1
  return at
}

/** The seconds a control tap takes, from the point `from`, to fall `db` under what it reads there. */
function fall(x: Float32Array, from: number, db: number): number {
  let i = from
  while (i < x.length - 1 && gainToDb(x[i]! / x[from]!) > -db) i += 1
  return ((i - from) * 16) / RATE
}

/** A filter's response tap, read at one frequency: its 121 points run in even ratios from 20 Hz to 20 kHz. */
function passes(result: RenderResult, hz: number): number {
  const response = tap(result, 'response')
  const place = (Math.log(hz / 20) / Math.log(1000)) * 120
  const i = Math.floor(place)
  return response[i]! + (response[Math.min(120, i + 1)]! - response[i]!) * (place - i)
}

/** The largest size a sample of `x` has. */
const peakOf = (x: Float32Array) => x.reduce((most, v) => Math.max(most, Math.abs(v)), 0)

/** The transform of `re` and `im` in place: a length that is a power of two. */
function transform(re: Float64Array, im: Float64Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j]!, re[i]!]
      ;[im[i], im[j]] = [im[j]!, im[i]!]
    }
  }
  for (let length = 2; length <= n; length <<= 1) {
    const turn = (-2 * Math.PI) / length
    for (let i = 0; i < n; i += length) {
      for (let k = 0; k < length / 2; k += 1) {
        const wr = Math.cos(turn * k)
        const wi = Math.sin(turn * k)
        const a = i + k
        const b = a + length / 2
        const xr = re[b]! * wr - im[b]! * wi
        const xi = re[b]! * wi + im[b]! * wr
        re[b] = re[a]! - xr
        im[b] = im[a]! - xi
        re[a] = re[a]! + xr
        im[a] = im[a]! + xi
      }
    }
  }
}

/**
 * What stands between the harmonics of a note at `hz`: the strongest line under `top` hertz that
 * is no harmonic, in dB under the first harmonic, and where it stands. The spectrum is of 65,536
 * samples of `x` from `from`, under a four-term Blackman-Harris window, whose side lobes lie
 * 92 dB down: a harmonic's own skirt is not taken for a line. A bin counts as a harmonic's when
 * it is within ten bins and 0.2 % of one.
 */
function strongestBetween(x: Float32Array, from: number, hz: number, top = 20000) {
  const N = 65536
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  for (let n = 0; n < N; n += 1) {
    const t = (2 * Math.PI * n) / N
    re[n] =
      x[from + n]! *
      (0.35875 - 0.48829 * Math.cos(t) + 0.14128 * Math.cos(2 * t) - 0.01168 * Math.cos(3 * t))
  }
  transform(re, im)
  const size = (bin: number) => gainToDb(Math.hypot(re[bin]!, im[bin]!) / ((0.35875 * N) / 2))
  const near = Math.round((hz * N) / RATE)
  let first = -Infinity
  for (let bin = near - 3; bin <= near + 3; bin += 1) first = Math.max(first, size(bin))
  let worst = -Infinity
  let at = 0
  for (let bin = 8; bin < (top * N) / RATE; bin += 1) {
    const f = (bin * RATE) / N
    const k = Math.round(f / hz)
    if (k >= 1 && Math.abs(f - k * hz) < (10 * RATE) / N + 0.002 * f) continue
    if (size(bin) > worst) {
      worst = size(bin)
      at = f
    }
  }
  return { under: first - worst, at }
}

/**
 * What the kit's ladder passes at `hz`, in dB, worked out from its arithmetic and not measured:
 * four stages H1 = G (1 + z^-1) / (1 - (1 - 2G) z^-1) in a loop with feedback k, H = H1^4 /
 * (1 + k H1^4), at the rate the device's voice runs at. It leaves out the rounding, which a
 * very small sample does not reach.
 */
function ladderPasses(hz: number, cutoff: number, feedback: number): number {
  const inner = 4 * RATE
  const g = Math.tan((Math.PI * cutoff) / inner)
  const G = g / (1 + g)
  const w = (2 * Math.PI * hz) / inner
  type C = [number, number]
  const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
  const div = (a: C, b: C): C => {
    const d = b[0] * b[0] + b[1] * b[1]
    return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]
  }
  const back: C = [Math.cos(w), -Math.sin(w)]
  const stage = div(
    [G * (1 + back[0]), G * back[1]],
    [1 - (1 - 2 * G) * back[0], -(1 - 2 * G) * back[1]],
  )
  const two = mul(stage, stage)
  const four = mul(two, two)
  const out = div(four, [1 + feedback * four[0], feedback * four[1]])
  return gainToDb(Math.hypot(out[0], out[1]))
}

const settings = readSettings(ID)!

/** A named set of the settings file, rendered as the page renders a card. */
function played(voice: Lab, name: string, over: Record<string, number> = {}): RenderResult {
  const set = settings.sets[name]
  if (!set) throw new Error(`The settings file has no set called "${name}".`)
  return voice.render(nothing(), { ...resolveSet(voice.description, set).values, ...over })
}

describe('the subtractive voice', () => {
  it('is a sound lab playing its own note: every tap says something, loops, and answers to every control', async () => {
    const voice = await lab(ID)
    const result = voice.render(nothing(), {})
    expectSoundLab(voice, nothing(), result)
  })

  it('has a build path of six steps, each changing a built tap and none the main path, the last held to the device', async () => {
    const voice = await lab(ID)
    expectBuild(voice, nothing(), { beat: 6, sub: 0.3 })
    expect(voice.description.controls.find((one) => one.id === 'build')!.choices).toEqual([
      'An oscillator',
      'A second, detuned',
      'A sine an octave under',
      'A filter',
      'The contour on the level',
      'The contour on the filter',
    ])
    expect(voice.render(nothing(), {}).checks.builtStep).toBe(STEP.sweep)
  })

  // ---- part 1: why ------------------------------------------------------------------------------

  it("holds the kit's saw alone at one colour and one level: its tenth harmonic 20.0 dB under its first early and late, its level the same (claim raw-steady)", async () => {
    const voice = await lab(ID)
    const raw = tap(voice.render(nothing(), {}), 'raw')
    expectWritten(below(raw, PITCH, 10, 0.1, 4800), '20.0 dB')
    expectWritten(below(raw, PITCH, 10, 0.8, 4800), '20.0 dB')
    const level = (s: number) => gainToDb(rms(raw, after(s), after(s) + 4800))
    expectWritten(Math.abs(level(0.1) - level(0.8)), 'less than 0.01 dB')
  })

  it('takes the tenth harmonic of the bass from 19 dB under the first at 10 ms to 36 dB under it at 300 ms, the first falling 28.8 dB between (claim voice-moves)', async () => {
    const voice = await lab(ID)
    const out = tap(voice.render(nothing(), {}), 'out')
    // Four cycles of the note from each moment, as the sentence says.
    const cycles = Math.round((4 * RATE) / PITCH)
    expectWritten(below(out, PITCH, 10, 0.01, cycles), '19 dB')
    expectWritten(below(out, PITCH, 10, 0.3, cycles), '36 dB')
    expectWritten(
      harmonic(out, PITCH, 1, 0.01, cycles) - harmonic(out, PITCH, 1, 0.3, cycles),
      '28.8 dB',
    )
  })

  it("leaves little but the first harmonic when the filter stands at the note's own frequency (claim closed-sine)", async () => {
    const voice = await lab(ID)
    const result = played(voice, 'closed')
    // The set's Cutoff puts the filter at the note: Cutoff is moved half as far as the key is from its pivot.
    expect(result.checks.cutoffNow!).toBeCloseTo(PITCH, 0)
    // At every moment of the held note, not at one: the two oscillators drift, and the levels with them.
    for (const moment of [0.1, 0.3, 0.5, 0.8, 1.1, 1.4]) {
      expectWritten(below(tap(result, 'out'), PITCH, 2, moment), 'more than 22 dB')
      expectWritten(below(tap(result, 'out'), PITCH, 3, moment), 'more than 38 dB')
      expectWritten(below(tap(result, 'osc'), PITCH, 2, moment), '6.0 dB')
    }
  })

  // ---- part 2: the picture ----------------------------------------------------------------------

  it('adds two oscillators in step to a first bar 6.0 dB over one oscillator alone (claim row-mix)', async () => {
    const voice = await lab(ID)
    const result = voice.render(nothing(), {})
    expectWritten(tap(result, 'mixHarmonics')[0]! - tap(result, 'oscHarmonics')[0]!, '6.0 dB')
  })

  it('takes 7 dB from the first bar through the filter and more than 19 dB from the thirty-second, at the starting settings (claim row-filter)', async () => {
    const voice = await lab(ID)
    const result = voice.render(nothing(), {})
    const mixed = tap(result, 'mixHarmonics')
    const filtered = tap(result, 'filteredHarmonics')
    expect(mixed.length).toBe(32)
    expectWritten(mixed[0]! - filtered[0]!, '7 dB')
    expectWritten(mixed[31]! - filtered[31]!, 'more than 19 dB')
  })

  it('finds the tenth bar after the filter 17.5 dB lower at 0.3 s than at the starting moment, the first within 0.2 dB, and the tenth bar going into the filter within 0.1 dB (claim row-later)', async () => {
    const voice = await lab(ID)
    const start = voice.render(nothing(), {})
    const later = voice.render(nothing(), { look: 0.3 })
    const early = tap(start, 'filteredHarmonics')
    const late = tap(later, 'filteredHarmonics')
    expectWritten(early[9]! - late[9]!, '17.5 dB')
    expectWritten(Math.abs(early[0]! - late[0]!), '0.2 dB')
    // What goes into the filter has hardly moved: the change is the filter's.
    expectWritten(
      Math.abs(tap(start, 'mixHarmonics')[9]! - tap(later, 'mixHarmonics')[9]!),
      'less than 0.1 dB',
    )
    for (let k = 0; k < 32; k += 1)
      expect(tap(start, 'oscHarmonics')[k]! - tap(later, 'oscHarmonics')[k]!).toBeCloseTo(0, 1)
  })

  it('leaves the filter where it is with Contour at 0: the cutoff 648 Hz at 0.3 s, 0.6 s and 0.9 s, the first eight bars within 0.3 dB, the thirty-second more than 5 dB off by 0.9 s, and every block empty once the voice sleeps (claim row-still)', async () => {
    const voice = await lab(ID)
    const at = (look: number) => voice.render(nothing(), { contour: 0, look })
    const start = at(0.02)
    expectWritten(start.checks.cutoffNow!, '648 Hz')
    for (const look of [0.3, 0.6, 0.9]) {
      const later = at(look)
      expectWritten(later.checks.cutoffNow!, '648 Hz')
      for (let k = 0; k < 8; k += 1) {
        expectWritten(
          Math.abs(tap(later, 'filteredHarmonics')[k]! - tap(start, 'filteredHarmonics')[k]!),
          'less than 0.3 dB',
        )
      }
    }
    expectWritten(
      tap(start, 'filteredHarmonics')[31]! - tap(at(0.9), 'filteredHarmonics')[31]!,
      'more than 5 dB',
    )
    // The filter did not do that: the bar that goes into it moved as far.
    expectWritten(
      tap(start, 'mixHarmonics')[31]! - tap(at(0.9), 'mixHarmonics')[31]!,
      'more than 5 dB',
    )
    // Once the note has died the voice sleeps, and every bar of every block is at the bottom.
    const asleep = at(1.5)
    for (const id of ['oscHarmonics', 'mixHarmonics', 'filteredHarmonics', 'outHarmonics'])
      expect(range(tap(asleep, id)).hi, id).toBe(-120)
  })

  // ---- part 3: uses -----------------------------------------------------------------------------

  it('puts the sine an octave under 12 dB over the note itself in the soft sub (claim use-sub)', async () => {
    const voice = await lab(ID)
    const out = tap(played(voice, 'sub'), 'out')
    expectWritten(harmonic(out, PITCH / 2, 1, 0.5) - harmonic(out, PITCH, 1, 0.5), '12 dB')
  })

  it("plays the pad's three keys on three voices, the first one's envelope at its top after 0.60 s with its cutoff at 5.9 kHz, 1.5 octaves over its rest (claim use-pad)", async () => {
    const voice = await lab(ID)
    const result = played(voice, 'pad')
    expect(result.checks.padHeld).toBe(3)
    const envelope = tap(result, 'padEnv')
    expectWritten((topOf(envelope) * 16 - DOWN) / RATE, '0.60 s')
    const cutoff = tap(result, 'padCorner')
    // The tap holds one point in every 16 samples, so its highest point is not quite the top.
    expectWritten(range(cutoff).hi / 1000, '5.9 kHz')
    // Where the cutoff rests: the same chord with the envelope kept off the filter.
    const rest = range(tap(played(voice, 'pad', { padEnvelope: 0 }), 'padCorner'))
    expect(rest.span).toBe(0)
    expectWritten(Math.log2(range(cutoff).hi / rest.hi), '1.5 octaves')
  })

  it('lets the contour fall 24.5 dB before the next note of the line where no rest stands between them, the cutoff 0.2 octaves over its rest, and 49 dB after a rest of one step (claim use-line)', async () => {
    const voice = await lab(ID)
    const result = played(voice, 'bassline')
    const contour = tap(result, 'env')
    const cutoff = tap(result, 'corner')
    // The line as the lab has it: semitones over Pitch for each of sixteen steps of 11,872 samples.
    const line = [0, null, 0, 12, null, 0, 10, 12, 0, null, 0, 12, 7, null, 3, null]
    const note = settings.sets.bassline!.values!.note!
    let followed = 0
    let rested = 0
    for (let step = 1; step < line.length; step += 1) {
      if (line[step] === null) continue
      // The point before the one at which the key of this step goes down.
      const before = (DOWN + step * 11872) / 16 - 1
      const down = -gainToDb(contour[before]!)
      const last = line[step - 1]
      if (last === null) {
        expectWritten(down, '49 dB')
        rested += 1
      } else {
        expectWritten(down, '24.5 dB')
        const rest = 500 * Math.sqrt((note * 2 ** (last! / 12)) / 65.40639)
        expectWritten(Math.log2(cutoff[before]! / rest), '0.2 octaves')
        followed += 1
      }
    }
    expect(followed).toBe(6)
    expect(rested).toBe(4)
  })

  // ---- part 4: the build ------------------------------------------------------------------------

  it('makes two oscillators 25 cents apart pass each other 1.6 times a second, and one oscillator never (claim build-beat)', async () => {
    const voice = await lab(ID)
    const passing = (step: number) => {
      const built = tap(voice.render(nothing(), { beat: 25, hold: 3.5, build: step }), 'built')
      return perSecond(dips(built, PITCH, after(0.05), after(3.4)).times)
    }
    expectWritten(passing(STEP.second), '1.6')
    // With the piece switched off there is one oscillator, and its first harmonic never dips.
    expect(passing(STEP.oscillator)).toBe(0)
    expect(matchesWritten(passing(STEP.oscillator), '1.6')).toBe(false)
  })

  it('doubles the wave with a second oscillator in step: the first and the tenth bar 6.0 dB higher, the largest sample of the two cycles drawn from 0.29 to 0.52, 1.8 times, the shortfall beside the drops and not the clip (claim build-double)', async () => {
    const voice = await lab(ID)
    const at = (step: number, volume = 0) => voice.render(nothing(), { build: step, volume })
    const one = at(STEP.oscillator)
    const two = at(STEP.second)
    for (const bar of [1, 10]) {
      expectWritten(
        tap(two, 'builtHarmonics')[bar - 1]! - tap(one, 'builtHarmonics')[bar - 1]!,
        '6.0 dB',
      )
    }
    // The two cycles the picture draws at the moment Look at starts on: the number beside the block's name.
    const single = tap(one, 'builtWave')
    const double = tap(two, 'builtWave')
    expectWritten(peakOf(single), '0.29')
    expectWritten(peakOf(double), '0.52')
    expectWritten(peakOf(double) / peakOf(single), '1.8')
    // Where the shortfall is: within a third of a millisecond of a drop. Everywhere else two is twice one.
    const drops: number[] = []
    for (let i = 0; i + 1 < single.length; i += 1)
      if (single[i]! - single[i + 1]! > 0.2) drops.push(i)
    // Two cycles hold two drops, and a drop may take two samples.
    expect(drops.length).toBeGreaterThanOrEqual(2)
    expect(drops.length).toBeLessThanOrEqual(4)
    let away = 0
    let beside = 0
    for (let i = 0; i < single.length; i += 1) {
      const apart = Math.abs(double[i]! - 2 * single[i]!)
      if (drops.some((drop) => Math.abs(i - drop) <= 16)) beside = Math.max(beside, apart)
      else away = Math.max(away, apart)
    }
    expect(away).toBeLessThan(0.005)
    expect(beside).toBeGreaterThan(0.1)
    // It is not the last clip: turned down 12 dB, far under the clip, the ratio is the same.
    expectWritten(
      peakOf(tap(at(STEP.second, -12), 'builtWave')) /
        peakOf(tap(at(STEP.oscillator, -12), 'builtWave')),
      '1.8',
    )
    // One oscillator alone is not 0.52: the piece is what made the difference.
    expect(matchesWritten(peakOf(single), '0.52')).toBe(false)
  })

  it('adds a line an octave under the note, 2.1 dB under the note at Sub 0.5, which is not there a step earlier (claim build-sub)', async () => {
    const voice = await lab(ID)
    const under = (step: number) => {
      const built = tap(voice.render(nothing(), { sub: 0.5, build: step }), 'built')
      return harmonic(built, PITCH, 1, 0.1) - harmonic(built, PITCH / 2, 1, 0.1)
    }
    expectWritten(under(STEP.sub), '2.1 dB')
    expect(matchesWritten(under(STEP.second), '2.1 dB')).toBe(false)
    expect(under(STEP.second)).toBeGreaterThan(90)
  })

  it('takes the tenth harmonic from 20 dB under the first to 38 dB under it when the filter goes in, at every moment of the held key (claim build-filter)', async () => {
    const voice = await lab(ID)
    const built = (step: number) => tap(voice.render(nothing(), { build: step }), 'built')
    const without = built(STEP.sub)
    const filtered = built(STEP.filter)
    // The key is down for a second, and each reading takes half of one.
    for (const moment of [0.05, 0.1, 0.2, 0.3, 0.4, 0.45]) {
      expectWritten(below(without, PITCH, 10, moment), '20 dB')
      expectWritten(below(filtered, PITCH, 10, moment), '38 dB')
      expect(matchesWritten(below(without, PITCH, 10, moment), '38 dB')).toBe(false)
    }
  })

  it('brings the level to 1.00 at 2 ms and 60 dB under that 0.600 s later, where the step before holds it until the key comes up (claim build-level)', async () => {
    const voice = await lab(ID)
    const level = (step: number) => tap(voice.render(nothing(), { build: step }), 'builtLevel')
    const shaped = level(STEP.level)
    expectWritten(shaped[tick(0.002)]!, '1.00')
    expect(topOf(shaped)).toBe(tick(0.002))
    expectWritten(fall(shaped, topOf(shaped), 60), '0.600 s')
    // With the piece switched off the level is a gate: full until the key comes up, a second after it went down.
    const gated = level(STEP.filter)
    expect(range(gated, tick(0.002), tick(0.9)).lo).toBe(1)
    expect(matchesWritten(fall(gated, tick(0.002), 60), '0.600 s')).toBe(false)
  })

  it('starts the cutoff at 5.2 kHz, 3.0 octaves over the 648 Hz it rests at, where the step before leaves it at rest (claim build-sweep)', async () => {
    const voice = await lab(ID)
    const cutoff = (step: number) => tap(voice.render(nothing(), { build: step }), 'builtCorner')
    const swept = cutoff(STEP.sweep)
    // The tap holds one point in every 16 samples, so its highest point is not quite the top.
    expectWritten(range(swept).hi / 1000, '5.2 kHz')
    expectWritten(swept[tick(1.5)]!, '648 Hz')
    expectWritten(Math.log2(range(swept).hi / swept[tick(1.5)]!), '3.0 octaves')
    const still = cutoff(STEP.level)
    expect(range(still).span).toBe(0)
    expect(matchesWritten(Math.log2(range(still).hi / still[tick(1.5)]!), '3.0 octaves')).toBe(
      false,
    )
  })

  it("builds the device's output again with all six pieces: all 192,000 samples of the loop the same, at three settings (claim build-same)", async () => {
    const voice = await lab(ID)
    for (const values of [
      {},
      settings.defaults!.values,
      { pattern: 1, beat: 12, sub: 1, drive: 1, emphasis: 1, decay: 10 },
    ]) {
      const result = voice.render(nothing(), { ...values, build: STEP.sweep })
      const built = tap(result, 'built')
      const out = tap(result, 'out')
      expect(built.length).toBe(192000)
      let differing = 0
      for (let i = 0; i < built.length; i += 1) differing += built[i] === out[i] ? 0 : 1
      expect(differing).toBe(0)
      expect(result.checks.builtDifference).toBeLessThanOrEqual(result.checks.builtBound!)
    }
  })

  // ---- part 5: the engine -----------------------------------------------------------------------

  it("reads the saw's recipe off one oscillator: the second harmonic 6.0 dB under the first, the tenth 20.0 dB under (claim osc-recipe)", async () => {
    const voice = await lab(ID)
    const bars = tap(voice.render(nothing(), {}), 'oscHarmonics')
    expectWritten(bars[0]! - bars[1]!, '6.0 dB')
    expectWritten(bars[0]! - bars[9]!, '20.0 dB')
  })

  it('leaves the square its odd harmonics alone: the fifth 14.0 dB under the first, every even one more than 100 dB under (claim osc-square)', async () => {
    const voice = await lab(ID)
    const osc = tap(voice.render(nothing(), { wave: 1 }), 'osc')
    expectWritten(below(osc, PITCH, 5, 0.1), '14.0 dB')
    for (const even of [2, 4, 6, 8]) expectWritten(below(osc, PITCH, even, 0.1), 'more than 100 dB')
  })

  it("draws the kit oscillator's four shapes with the harmonics each should have (claim shapes)", async () => {
    const voice = await lab(ID)
    const result = voice.render(nothing(), {})
    const under = (id: string, k: number) => tap(result, id)[0]! - tap(result, id)[k - 1]!
    expectWritten(under('triangleHarmonics', 3), '19.1 dB')
    expectWritten(under('triangleHarmonics', 5), '28.0 dB')
    expectWritten(under('squareHarmonics', 5), '14.0 dB')
    // The bars a shape should not have: every one above the first in the sine, the even ones in the other two.
    for (let k = 2; k <= 32; k += 1) expectWritten(under('sineHarmonics', k), 'more than 90 dB')
    for (let k = 2; k <= 32; k += 2) {
      expectWritten(under('triangleHarmonics', k), 'more than 90 dB')
      expectWritten(under('squareHarmonics', k), 'more than 90 dB')
    }
  })

  it("leaves little folded back under 20 kHz on the top key, 523.25 Hz: the kit's saw more than 45 dB under its first harmonic, one oscillator of the bass more than 95 dB under, the output with Drive at 1 more than 70 dB under (claim fold-back)", async () => {
    const voice = await lab(ID)
    const top = voice.description.controls.find((one) => one.id === 'note')!.max
    expectWritten(top, '523.25 Hz')
    // By hand: the first harmonic over half the rate, at the page's rate and at four times it.
    const firstOver = (rate: number) => Math.floor(rate / 2 / top) + 1
    expect(firstOver(RATE)).toBe(46)
    expect(firstOver(4 * RATE)).toBe(184)
    // A held note with the filter wide open and no peak on it, read from half a second in.
    const held = { note: top, hold: 3.5, decay: 10, contour: 0, cutoff: 12000, emphasis: 0 }
    const from = after(0.5)
    const clean = voice.render(nothing(), held)
    // The kit's corrected saw at the page's rate: what is left is small, and it is there.
    const kit = strongestBetween(tap(clean, 'raw'), from, top)
    expectWritten(kit.under, 'more than 45 dB')
    expect(kit.under).toBeLessThan(60)
    // The bass's oscillator runs at four times the rate before it is brought down.
    expectWritten(strongestBetween(tap(clean, 'osc'), from, top).under, 'more than 95 dB')
    expectWritten(strongestBetween(tap(clean, 'out'), from, top).under, 'more than 95 dB')
    // Pushed as hard as Drive goes, the filter's rounding makes new harmonics, and little of them folds.
    const pushed = voice.render(nothing(), { ...held, drive: 1 })
    expectWritten(strongestBetween(tap(pushed, 'out'), from, top).under, 'more than 70 dB')
    // On the lesson's starting note the kit's saw has more room: its harmonics fold from the 219th.
    const low = voice.render(nothing(), { ...held, note: PITCH })
    expectWritten(strongestBetween(tap(low, 'raw'), from, PITCH).under, 'more than 60 dB')
  })

  it("finds a line under 20 kHz that is no harmonic in the kit's pulse at 4,186 Hz, 34 dB under the first harmonic at 14.5 kHz, and nothing within 85 dB of the first between the harmonics of the pulse added up from whole harmonics (claim pulse-whole)", async () => {
    const voice = await lab(ID)
    const result = voice.render(nothing(), {})
    const key = 8 * 523.25
    expectWritten(key, '4,186 Hz')
    // By hand: the eighth harmonic stands over half the rate, and lands this far under the rate.
    expectWritten((RATE - 8 * key) / 1000, '14.5 kHz')
    /** The spectrum's bins: 2,049 of them from 0 to half the rate. Peaks, and what is not a harmonic's. */
    const read = (id: string) => {
      const bins = tap(result, id)
      expect(bins.length).toBe(2049)
      const hzOf = (bin: number) => (bin * RATE) / 2 / (bins.length - 1)
      const harmonicOf = (hz: number) => Math.round(hz / key)
      const off = (hz: number) => Math.abs(hz - harmonicOf(hz) * key)
      let first = -Infinity
      let between = -Infinity
      let line = { hz: 0, db: -Infinity }
      for (let bin = 2; bin < bins.length - 2; bin += 1) {
        const hz = hzOf(bin)
        if (Math.abs(hz - key) < 30) first = Math.max(first, bins[bin]!)
        // Further than 200 Hz from every harmonic: clear of a harmonic's own skirt under the window.
        if (harmonicOf(hz) >= 1 && off(hz) <= 200) continue
        between = Math.max(between, bins[bin]!)
        if (hz < 20000 && bins[bin]! > line.db) line = { hz, db: bins[bin]! }
      }
      return { first, between, line }
    }
    const corrected = read('kitPulse')
    expectWritten(corrected.first - corrected.line.db, '34 dB')
    expectWritten(corrected.line.hz / 1000, '14.5 kHz')
    const whole = read('wholePulse')
    expectWritten(whole.first - whole.between, 'more than 85 dB')
    // The two are one pulse: their first harmonics stand within half a decibel of each other.
    expect(Math.abs(whole.first - corrected.first)).toBeLessThan(0.5)
    // Neither follows a control.
    const moved = voice.render(nothing(), { note: 220, wave: 1, look: 0.5 })
    expect(Array.from(tap(moved, 'kitPulse'))).toEqual(Array.from(tap(result, 'kitPulse')))
    expect(Array.from(tap(moved, 'wholePulse'))).toEqual(Array.from(tap(result, 'wholePulse')))
  })

  it('lets two oscillators at Beat 0 wander: over a held note the first harmonic of the mix moves less than 0.2 dB and the eighth more than 60 dB (claim mix-drift)', async () => {
    const voice = await lab(ID)
    const mix = tap(
      voice.render(nothing(), { beat: 0, contour: 0, decay: 10, hold: 3.5, cutoff: 12000 }),
      'mix',
    )
    const cycles = Math.round((4 * RATE) / PITCH)
    const sizes = (k: number) => {
      const all: number[] = []
      for (let at = after(0.05); at < after(3.4); at += 480)
        all.push(sizeDb(mix, PITCH * k, at, cycles))
      return Math.max(...all) - Math.min(...all)
    }
    expectWritten(sizes(1), 'less than 0.2 dB')
    expectWritten(sizes(8), 'more than 60 dB')
  })

  it('times the contour by Decay: with Decay at 0.2 s, 0.6 s and 2 s it is 60 dB down 0.200 s, 0.600 s and 2.000 s after its top (claim contour-decay)', async () => {
    const voice = await lab(ID)
    const down = (decay: number) => {
      const contour = tap(voice.render(nothing(), { decay, hold: 3.5 }), 'env')
      expect(topOf(contour)).toBe(tick(0.002))
      return fall(contour, topOf(contour), 60)
    }
    expectWritten(down(0.2), '0.200 s')
    expectWritten(down(0.6), '0.600 s')
    expectWritten(down(2), '2.000 s')
  })

  it('holds the contour at 1.00 with Decay at its top while the key is down, and brings it 60 dB down 0.800 s after the key comes up (claim contour-release)', async () => {
    const voice = await lab(ID)
    const contour = tap(voice.render(nothing(), { decay: 10 }), 'env')
    const held = range(contour, tick(0.003), tick(1.0))
    expectWritten(held.lo, '1.00')
    expectWritten(held.hi, '1.00')
    expectWritten(fall(contour, tick(1.0), 60), '0.800 s')
    // A Decay over the release's limit releases at the limit too.
    const long = tap(voice.render(nothing(), { decay: 2, hold: 0.5 }), 'env')
    expectWritten(fall(long, tick(0.5), 60), '0.800 s')
  })

  it('moves the cutoff half as far as the key: 648 Hz, 917 Hz and 1,297 Hz on keys an octave apart, 0.50 octaves each (claim cutoff-track)', async () => {
    const voice = await lab(ID)
    const at = (note: number) => voice.render(nothing(), { note, contour: 0 }).checks.cutoffNow!
    expectWritten(at(110), '648 Hz')
    expectWritten(at(220), '917 Hz')
    expectWritten(at(440), '1,297 Hz')
    for (const note of [55, 110, 220])
      expectWritten(Math.log2(at(2 * note) / at(note)), '0.50 octaves')
  })

  it('works the cutoff out again to the coefficient the filter holds, at four settings', async () => {
    const voice = await lab(ID)
    for (const values of [
      {},
      settings.defaults!.values,
      { pattern: 1, contour: 1, cutoff: 12000 },
      { note: 32.7, cutoff: 30, contour: 0 },
    ]) {
      expect(voice.render(nothing(), values).checks.cutoffError).toBeLessThan(0.001)
    }
  })

  it('measures the ladder with Emphasis at 0: 12.0 dB down at the cutoff, 28.0 dB an octave over it, and a further 24.0 dB between eight and sixteen times it (claim ladder-slope)', async () => {
    const voice = await lab(ID)
    // On the key the filter pivots on, with the contour off it, Cutoff is the cutoff: 500 Hz.
    const result = voice.render(nothing(), { emphasis: 0, contour: 0, note: 65.40639 })
    expect(result.checks.cutoffNow!).toBeCloseTo(500, 1)
    expectWritten(-passes(result, 500), '12.0 dB')
    expectWritten(-passes(result, 1000), '28.0 dB')
    expectWritten(passes(result, 4000) - passes(result, 8000), '24.0 dB')
  })

  it("pays for Emphasis in the pass band: a tone at 40 Hz comes out 6.8 dB down at 0.3 and 13.2 dB down at 0.9, where the top of the peak stands 24 dB over that and the curve's highest point 3 dB short of the top (claim ladder-emphasis)", async () => {
    const voice = await lab(ID)
    const at = (emphasis: number) =>
      voice.render(nothing(), { emphasis, contour: 0, note: 65.40639 })
    expectWritten(-passes(at(0.3), 40), '6.8 dB')
    const sharp = at(0.9)
    expectWritten(-passes(sharp, 40), '13.2 dB')
    // The top is searched for between the curve's points: the peak is narrower than their spacing.
    const top = sharp.checks.responseTop!
    expectWritten(top - passes(sharp, 40), '24 dB')
    expect(tap(sharp, 'response').length).toBe(121)
    expectWritten(top - range(tap(sharp, 'response')).hi, '3 dB')
    // The same from the filter's arithmetic, with nothing measured: the pass band and the top.
    const feedback = 4 * 0.9
    let worked = -Infinity
    for (let hz = 400; hz < 600; hz += 0.05)
      worked = Math.max(worked, ladderPasses(hz, 500, feedback))
    expect(Math.abs(top - worked)).toBeLessThan(0.05)
    expect(Math.abs(passes(sharp, 40) - ladderPasses(40, 500, feedback))).toBeLessThan(0.05)
    expect(Math.abs(passes(at(0.3), 40) - ladderPasses(40, 500, 4 * 0.3))).toBeLessThan(0.05)
    // With no peak to miss, the top is a point of the curve.
    const plain = at(0)
    expect(plain.checks.responseTop!).toBeCloseTo(range(tap(plain, 'response')).hi, 3)
  })

  it('squares the wave with Drive: the second harmonic goes from 7 dB under the first to more than 24 dB under it, at every moment of a held note (claim drive-square)', async () => {
    const voice = await lab(ID)
    const out = (drive: number) =>
      tap(
        voice.render(nothing(), {
          drive,
          contour: 0,
          decay: 10,
          hold: 3,
          cutoff: 12000,
          emphasis: 0,
        }),
        'out',
      )
    const clean = out(0)
    const pushed = out(1)
    // The two oscillators drift over the note, and the levels with them: every moment is held.
    for (const moment of [0.1, 0.5, 1, 1.5, 2, 2.4]) {
      expectWritten(below(clean, PITCH, 2, moment), '7 dB')
      expectWritten(below(pushed, PITCH, 2, moment), 'more than 24 dB')
    }
  })

  it('leaves the last clip idle at the starting settings, where the largest sample of the output is 0.32, and reaches it on two cards (claim clip-idle)', async () => {
    const voice = await lab(ID)
    const start = peakOf(tap(voice.render(nothing(), {}), 'out'))
    expectWritten(start, '0.32')
    // The kit's soft clip leaves alone what is under half of full scale.
    expect(start).toBeLessThan(0.5)
    for (const name of ['wide', 'growl']) {
      expect(peakOf(tap(played(voice, name), 'out')), name).toBeGreaterThan(0.5)
    }
    // No other card reaches it.
    for (const name of Object.keys(settings.sets)) {
      if (name === 'wide' || name === 'growl') continue
      expect(peakOf(tap(played(voice, name), 'out')), name).toBeLessThan(0.5)
    }
  })

  it("brings the pad's envelope to its top 0.60 s after the keys and lets it sink to 0.80 by the time they come up (claim pad-envelope)", async () => {
    const voice = await lab(ID)
    const envelope = tap(voice.render(nothing(), {}), 'padEnv')
    expectWritten((topOf(envelope) * 16 - DOWN) / RATE, '0.60 s')
    expectWritten(envelope[tick(1.0) - 1]!, '0.80')
  })

  it("closes the pad's filter by 6.0 octaves with Pad envelope at its lowest (claim pad-closing)", async () => {
    const voice = await lab(ID)
    const rest = range(tap(voice.render(nothing(), { padEnvelope: 0 }), 'padCorner')).hi
    const closing = range(tap(voice.render(nothing(), { padEnvelope: -1 }), 'padCorner')).lo
    expectWritten(Math.log2(rest / closing), '6.0 octaves')
  })

  // ---- part 6: ways -----------------------------------------------------------------------------

  it('walks a peak down the harmonics with Emphasis high: at 0.4 s, 0.6 s, 0.8 s and 1 s the strongest harmonic from the third up is the seventh, the fifth, the fourth and the fourth, each more than 3 dB over both neighbours and beside the cutoff, and none of the first eight stands out with Emphasis at 0 (claim way-sing)', async () => {
    const voice = await lab(ID)
    const note = settings.sets.sing!.values!.note!
    // Eight cycles of the note from each moment, as the sentence says.
    const cycles = Math.round((8 * RATE) / note)
    const read = (result: RenderResult, moment: number) => {
      const out = tap(result, 'out')
      const levels = [0]
      for (let k = 1; k <= 13; k += 1) levels.push(sizeDb(out, note * k, after(moment), cycles))
      // The cutoff halfway through the stretch that is read.
      const cutoff = tap(result, 'corner')[Math.round((after(moment) + cycles / 2) / 16)]!
      return { levels, cutoff }
    }
    const sharp = played(voice, 'sing')
    const plain = played(voice, 'sing', { emphasis: 0 })
    const moments = [0.4, 0.6, 0.8, 1]
    const expected = [7, 5, 4, 4]
    moments.forEach((moment, at) => {
      const { levels, cutoff } = read(sharp, moment)
      let strongest = 3
      for (let k = 3; k <= 12; k += 1) if (levels[k]! > levels[strongest]!) strongest = k
      expect(strongest, `at ${moment} s`).toBe(expected[at])
      expectWritten(levels[strongest]! - levels[strongest - 1]!, 'more than 3 dB')
      expectWritten(levels[strongest]! - levels[strongest + 1]!, 'more than 3 dB')
      expect(Math.abs(strongest - cutoff / note), `at ${moment} s`).toBeLessThan(1)
      // With the peak taken away, each harmonic up to the eighth stands under the one below it.
      // Higher up the two oscillators' drift empties a harmonic now and then (claim mix-drift).
      const flat = read(plain, moment).levels
      for (let k = 2; k <= 8; k += 1)
        expect(flat[k]!, `harmonic ${k} at ${moment} s`).toBeLessThan(flat[k - 1]!)
    })
  })

  it('makes a pluck of a short Decay: the contour 60 dB down 0.150 s after its top (claim way-pluck)', async () => {
    const voice = await lab(ID)
    const contour = tap(played(voice, 'pluck'), 'env')
    expectWritten(fall(contour, topOf(contour), 60), '0.150 s')
  })

  it("closes the pad's filter by 3.6 octaves at the top of its envelope in the closing set (claim way-dim)", async () => {
    const voice = await lab(ID)
    const rest = range(tap(played(voice, 'dim', { padEnvelope: 0 }), 'padCorner')).hi
    const lowest = range(tap(played(voice, 'dim'), 'padCorner')).lo
    expectWritten(Math.log2(rest / lowest), '3.6 octaves')
  })

  // ---- part 7: what goes wrong ------------------------------------------------------------------

  it('loses 17 dB of the first harmonic of a high note to a low Cutoff that no contour opens (claim fault-choked)', async () => {
    const voice = await lab(ID)
    const shut = tap(played(voice, 'choked'), 'out')
    const opened = tap(played(voice, 'choked', { contour: 0.6 }), 'out')
    expectWritten(harmonic(opened, 440, 1, 0.5) - harmonic(shut, 440, 1, 0.5), '17 dB')
  })

  it('empties a low note every 1.3 s with Beat at its top, the first harmonic more than 50 dB down each time (claim fault-hollow)', async () => {
    const voice = await lab(ID)
    const out = tap(played(voice, 'hollow'), 'out')
    const found = dips(out, 55, after(0.05), after(3.4))
    expect(found.times.length).toBe(3)
    expectWritten(1 / perSecond(found.times), '1.3 s')
    for (const depth of found.depths) expectWritten(depth, 'more than 50 dB')
  })

  it('takes 13 dB off the first harmonic of a low note with Emphasis at 0.9 (claim fault-thin)', async () => {
    const voice = await lab(ID)
    const sharp = tap(played(voice, 'thin'), 'out')
    const plain = tap(played(voice, 'thin', { emphasis: 0 }), 'out')
    expectWritten(harmonic(plain, 55, 1, 0.5) - harmonic(sharp, 55, 1, 0.5), '13 dB')
  })

  it('all but loses the first harmonic of an oscillator with Wave at 0.42: 31 dB under its second (claim fault-octave)', async () => {
    const voice = await lab(ID)
    const osc = tap(played(voice, 'octave'), 'osc')
    for (const moment of [0.2, 0.5, 1, 1.5])
      expectWritten(below(osc, PITCH, 1, moment, 24000, 2), '31 dB')
  })

  it("owes that to the way the device's two waves point: with the ramp turned over, the same share of each leaves the first harmonic 12 dB over the second (claim fault-turned)", async () => {
    const voice = await lab(ID)
    const share = settings.sets.octave!.values!.wave!
    const alone = (wave: number) => tap(played(voice, 'octave', { wave }), 'osc')
    const saw = alone(0)
    const square = alone(1)
    const blended = alone(share)
    // The device's blend is the sum of its two waves, each at its share: sample for sample.
    const turned = new Float32Array(saw.length)
    let apart = 0
    for (let i = 0; i < saw.length; i += 1) {
      apart = Math.max(apart, Math.abs((1 - share) * saw[i]! + share * square[i]! - blended[i]!))
      turned[i] = -(1 - share) * saw[i]! + share * square[i]!
    }
    expect(apart).toBeLessThan(1e-6)
    for (const moment of [0.2, 0.5, 1, 1.5]) {
      expectWritten(-below(turned, PITCH, 1, moment, 24000, 2), '12 dB')
      expect(matchesWritten(-below(blended, PITCH, 1, moment, 24000, 2), '12 dB')).toBe(false)
    }
  })

  // ---- the settings file ------------------------------------------------------------------------

  it('renders every named set, each within the bound of the build and with sound on the tap it plays', async () => {
    const voice = await lab(ID)
    for (const [name, set] of Object.entries(settings.sets)) {
      const result = played(voice, name)
      const sound = tap(result, set.tap ?? 'out')
      expect(rms(sound), name).toBeGreaterThan(0.001)
      expect(range(sound).hi, name).toBeLessThan(1)
      expect(result.checks.builtDifference, name).toBeLessThanOrEqual(result.checks.builtBound!)
      expect(result.checks.cutoffError, name).toBeLessThan(0.001)
    }
  })

  // ---- part 9: the device's own defaults --------------------------------------------------------

  it("starts the page's device table from the device's own defaults: for every control that is a parameter of the device, the settings file's defaults laid over the lab's starting values are device.json's", async () => {
    const voice = await lab(ID)
    const device = JSON.parse(
      fs.readFileSync(
        fileURLToPath(new URL('../../../cpp/devices/ladder-bass/device.json', import.meta.url)),
        'utf8',
      ),
    ) as { params: { key: string; default: number }[] }
    const { values } = resolveSet(voice.description, { values: settings.defaults!.values })
    const shared = device.params.filter((one) => one.key in values)
    // Every parameter of the device is a control of the lab but Glide, which slides between
    // overlapping keys: the lab's keys do not overlap.
    expect(device.params.filter((one) => !(one.key in values)).map((one) => one.key)).toEqual([
      'glide',
    ])
    // The lab holds a starting value as a single-precision number and the settings file a
    // double, so both sides are compared as single precision.
    for (const one of shared)
      expect(Math.fround(values[one.key]!), one.key).toBe(Math.fround(one.default))
    // Only what differs from the lab's start is written down.
    for (const [id, value] of Object.entries(settings.defaults!.values)) {
      expect(voice.description.controls.find((one) => one.id === id)!.initial).not.toBe(value)
    }
  })
})
