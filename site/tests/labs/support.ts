// What every lab test shares: loading a built lab, the sources, the measurements, and the
// checks every lab is held to.

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import {
  CONTROL_PERIOD,
  loadLab,
  SAMPLE_RATE,
  type Lab,
  type RenderResult,
  type Source,
  type TapData,
} from '../../src/lab/runner.ts'
import { benchSource, silence } from '../../src/lib/still.ts'

const LABS = fileURLToPath(new URL('../../public/labs/', import.meta.url))

/** The labs' sample rate: 48,000 samples a second. */
export const RATE = SAMPLE_RATE
/** A control tap has a point every 16 samples: 3,000 a second. */
export const POINT_RATE = SAMPLE_RATE / CONTROL_PERIOD
/** One bin of a lab's 4,096-point spectrum, in hertz: 11.72. */
export const BIN = SAMPLE_RATE / 4096
/** The first 20 ms of a looped tap are a crossfade of two passes (kFadeFrames in site/labs/lab.h). */
export const FADE = 960

/** A lab built by `pnpm labs`. A missing file means the labs were not built first. */
export async function lab(name: string): Promise<Lab> {
  const bytes = await readFile(`${LABS}${name}.wasm`).catch(() => {
    throw new Error(`site/public/labs/${name}.wasm is missing: run \`pnpm labs\` in site/ first.`)
  })
  return loadLab(bytes)
}

export type { Source }

/** The sample that stands at a time in seconds, and so how many samples a time is long. */
export const seconds = (s: number) => Math.round(s * SAMPLE_RATE)
/** The point of a control tap that stands at a time in seconds. */
export const points = (s: number) => Math.round(s * POINT_RATE)

// The Node render of a bench source is the site's own (src/lib/still.ts): a still in a built
// page and a test are fed the same samples.
export { benchSource, silence }

/** Silence with one sample of `size` on both channels, `at` samples in. */
export function click(frames: number, at = 0, size = 1): Source {
  const source = silence(frames)
  source.left[at] = size
  source.right[at] = size
  return source
}

/** A sine on both channels. `peak` is its amplitude. */
export function sine(hz: number, peak: number, frames: number): Source {
  const left = new Float32Array(frames)
  for (let i = 0; i < frames; i += 1)
    left[i] = peak * Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE)
  return { left, right: left.slice() }
}

/** White noise, the same every time for a seed. */
export function noise(peak: number, frames: number, seed = 1): Source {
  let state = seed >>> 0 || 1
  const next = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) / 0xffffffff) * 2 - 1
  }
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  for (let i = 0; i < frames; i += 1) {
    left[i] = peak * next()
    right[i] = peak * next()
  }
  return { left, right }
}

export const dbToGain = (db: number) => 10 ** (db / 20)
export const gainToDb = (gain: number) => 20 * Math.log10(Math.max(gain, 1e-9))

export function peak(x: Float32Array): number {
  let top = 0
  for (const v of x) top = Math.max(top, Math.abs(v))
  return top
}

export function rms(x: Float32Array, from = 0, to = x.length): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += x[i]! * x[i]!
  return Math.sqrt(sum / Math.max(1, to - from))
}

export function mean(x: Float32Array, from = 0, to = x.length): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += x[i]!
  return sum / Math.max(1, to - from)
}

/** The level of `a - b` against the level of `b`, in dB. */
export function differenceDb(a: Float32Array, b: Float32Array): number {
  let diff = 0
  let ref = 0
  for (let i = 0; i < b.length; i += 1) {
    diff += (a[i]! - b[i]!) ** 2
    ref += b[i]! ** 2
  }
  return 10 * Math.log10(Math.max(diff / Math.max(ref, 1e-30), 1e-14))
}

/** The least and the most of `x` from `from` up to `to`, and how far apart they are. */
export function range(
  x: ArrayLike<number>,
  from = 0,
  to = x.length,
): { lo: number; hi: number; span: number } {
  let lo = Infinity
  let hi = -Infinity
  for (let i = from; i < to; i += 1) {
    lo = Math.min(lo, x[i]!)
    hi = Math.max(hi, x[i]!)
  }
  return { lo, hi, span: hi - lo }
}

/**
 * How sharply a looped tap turns, by its third difference `x[i] − 3x[i−1] + 3x[i−2] − x[i−3]`.
 * A smooth wave leaves almost nothing in it and a step leaves twice its own height, so it
 * tells a step from a loud wave where the step between two samples cannot.
 *
 * - `wrap`: the largest of the three that reach across the loop's wrap.
 * - `around`: the largest within 20 ms either side of the wrap, of those that do not reach across.
 * - `inside`: the largest anywhere in the tap, of those that do not reach across.
 * - `floor`: the corner the lab's own crossfade may leave where it begins, which is no step:
 *   two signals as far apart as twice the tap's peak, crossed over in a straight line 20 ms long.
 */
export function kinks(x: Float32Array): {
  wrap: number
  around: number
  inside: number
  floor: number
} {
  const n = x.length
  if (n < 8) return { wrap: 0, around: 0, inside: 0, floor: 0 }
  const near = Math.min(FADE, Math.floor(n / 4))
  const kink = (i: number) =>
    Math.abs(x[i % n]! - 3 * x[(i - 1 + n) % n]! + 3 * x[(i - 2 + n) % n]! - x[(i - 3 + n) % n]!)
  let around = 0
  let inside = 0
  for (let i = 3; i < n; i += 1) {
    const here = Math.abs(x[i]! - 3 * x[i - 1]! + 3 * x[i - 2]! - x[i - 3]!)
    if (here > inside) inside = here
    if ((i < 3 + near || i >= n - near) && here > around) around = here
  }
  return {
    wrap: Math.max(kink(0), kink(1), kink(2)),
    around,
    inside,
    floor: (2 * peak(x)) / FADE,
  }
}

/**
 * True when a tap comes round without a step: across the wrap it turns no more than twice as
 * sharply as it does within 20 ms either side. That is a comparison with the same sound a
 * moment away, so a loud or a bright loop does not hide a step, as it does from a comparison
 * with the largest step anywhere in the tap.
 *
 * A loop that starts on an event (a click on its first sample, a fader that jumps there) turns
 * sharply at the wrap by design. With `anywhere`, the tap is held to the sharpest turn it makes
 * anywhere instead, where the same event falls again.
 */
export function loops(x: Float32Array, anywhere = false): boolean {
  const { wrap, around, inside, floor } = kinks(x)
  return wrap <= Math.max(2 * (anywhere ? inside : around), floor)
}

/** True when a source's sharpest turn near its wrap is at the wrap itself: it starts on an event. */
function startsOnAnEvent(source: Source): boolean {
  return [source.left, source.right].some((x) => {
    const { wrap, around, floor } = kinks(x)
    return wrap > around && wrap > floor
  })
}

function expectLoops(tap: TapData, anywhere: boolean, where = '') {
  for (const data of tap.channels_data) {
    const { wrap, around, inside } = kinks(data)
    const held = anywhere ? `anywhere in it (${inside})` : `within 20 ms of it (${around})`
    expect(
      loops(data, anywhere),
      `${where}tap ${tap.id} loops without a step: across the wrap it turns ${wrap}, against ${held}. ` +
        'A note or a jump that starts with the loop by design goes in { steps: [...] }',
    ).toBe(true)
  }
}

const same = (a: TapData, b: TapData | undefined) =>
  b !== undefined &&
  a.channels_data.length === b.channels_data.length &&
  a.channels_data.every((data, c) => {
    const other = b.channels_data[c]!
    return data.length === other.length && data.every((v, i) => v === other[i])
  })

/** The taps of a lab's build part: their ids begin "built" (lab::Build in site/labs/lab.h). */
const isBuilt = (id: string) => id.startsWith('built')

/**
 * What every lab is held to on its default source: every tap is finite and says something,
 * every audio tap loops without a step, and every control moves at least one tap of the main
 * path. The `build` control moves the built taps instead, and what they must say at each step
 * is `expectBuild`'s to hold.
 *
 * `quiet` names taps that are rightly one flat value. `steps` names audio taps that start on an
 * event by design. When the source itself starts on one, every tap is held as those are.
 */
export function expectSoundLab(
  theLab: Lab,
  source: Source,
  result: RenderResult,
  options: { quiet?: string[]; steps?: string[] } = {},
) {
  const struck = startsOnAnEvent(source)
  for (const tap of Object.values(result.taps)) {
    expect(tap.length, `tap ${tap.id} was written`).toBeGreaterThan(0)
    for (const data of tap.channels_data) {
      expect(
        data.every((v) => Number.isFinite(v)),
        `tap ${tap.id} is finite`,
      ).toBe(true)
      if (!options.quiet?.includes(tap.id) && !isBuilt(tap.id)) {
        expect(
          data.some((v) => v !== data[0]),
          `tap ${tap.id} is not one flat value`,
        ).toBe(true)
      }
    }
    if (tap.kind === 'audio') expectLoops(tap, struck || !!options.steps?.includes(tap.id))
  }
  for (const control of theLab.description.controls) {
    const moved = control.initial === control.max ? control.min : control.max
    const other = theLab.render(source, { [control.id]: moved })
    const building = control.id === 'build'
    const changed = Object.values(other.taps).some(
      (tap) => isBuilt(tap.id) === building && !same(tap, result.taps[tap.id]),
    )
    expect(
      changed,
      building
        ? 'the build control changes a built tap'
        : `control ${control.id} changes a tap of the main path`,
    ).toBe(true)
  }
}

/**
 * What a lab's build part is held to (lab::Build in site/labs/lab.h): the `build` control has a
 * choice a step; every step changes a built tap and leaves the main path's taps as they were;
 * every built tap is finite at every step, loops, and says something at some step; and on every
 * render the step the lab names is within the bound the lab states of what the engine made.
 */
export function expectBuild(theLab: Lab, source: Source) {
  const { controls, taps, checks } = theLab.description
  const control = controls.find((one) => one.id === 'build')
  if (!control) throw new Error('The lab has no build control')
  const steps = control.choices.length
  expect(steps, 'the build control has a choice a step').toBeGreaterThanOrEqual(2)
  expect(
    [control.min, control.max],
    'the build control runs from its first step to its last',
  ).toEqual([0, steps - 1])
  expect(taps.find((tap) => tap.id === 'built')?.kind, 'the tap "built" is the sound so far').toBe(
    'audio',
  )
  for (const id of ['builtDifference', 'builtStep', 'builtBound']) {
    expect(
      checks.some((check) => check.id === id),
      `the lab has the check ${id}`,
    ).toBe(true)
  }

  const struck = startsOnAnEvent(source)
  const renders = control.choices.map((_, step) => theLab.render(source, { build: step }))
  const said = new Set<string>()
  renders.forEach((result, step) => {
    const name = `step ${step} (${control.choices[step]})`
    const compared = result.checks.builtStep!
    expect(
      Number.isInteger(compared) && compared >= 0 && compared < steps,
      `${name}: the step held to the engine, ${compared}, is one of the steps`,
    ).toBe(true)
    expect(result.checks.builtBound, `${name}: the bound is a level below 0 dB`).toBeLessThan(0)
    expect(
      result.checks.builtDifference,
      `${name}: step ${compared} is within the lab's bound of what the engine made`,
    ).toBeLessThanOrEqual(result.checks.builtBound!)

    for (const tap of Object.values(result.taps)) {
      if (!isBuilt(tap.id)) {
        expect(
          same(tap, renders[0]!.taps[tap.id]),
          `${name} leaves tap ${tap.id} of the main path as it was`,
        ).toBe(true)
        continue
      }
      expect(tap.length, `${name}: tap ${tap.id} was written`).toBeGreaterThan(0)
      for (const data of tap.channels_data) {
        expect(
          data.every((v) => Number.isFinite(v)),
          `${name}: tap ${tap.id} is finite`,
        ).toBe(true)
        if (data.some((v) => v !== data[0])) said.add(tap.id)
      }
      if (tap.kind === 'audio') expectLoops(tap, struck, `${name}: `)
    }
    if (step > 0) {
      const before = renders[step - 1]!
      expect(
        Object.values(result.taps).some(
          (tap) => isBuilt(tap.id) && !same(tap, before.taps[tap.id]),
        ),
        `${name} changes a built tap`,
      ).toBe(true)
    }
  })
  for (const tap of taps) {
    if (isBuilt(tap.id)) {
      expect(said.has(tap.id), `tap ${tap.id} says something at some step`).toBe(true)
    }
  }
}

/**
 * How suddenly an event arrives, for a click check: `changed` and `reference` are the same
 * passage rendered twice, with the event (a control jumped, a note stolen, a piece switched in)
 * and without it, and `at` is the sample the event falls on. Of the largest difference between
 * the two in the 20 ms from there, this is the part already there within the first 8 samples:
 * near 1 for a jump, small for a fade or a glide, 0 where the event changes nothing.
 *
 * The difference is the event alone, so the sound under it, however bright, hides nothing. A
 * jump can still land on a zero crossing: measure at a few moments a little apart and keep the
 * worst.
 */
export function suddenness(changed: Float32Array, reference: Float32Array, at: number): number {
  const to = Math.min(at + seconds(0.02), changed.length, reference.length)
  let early = 0
  let whole = 0
  for (let i = at; i < to; i += 1) {
    const apart = Math.abs(changed[i]! - reference[i]!)
    if (i < at + 8) early = Math.max(early, apart)
    whole = Math.max(whole, apart)
  }
  return whole > 0 ? early / whole : 0
}

/**
 * When a sound speaks: the milliseconds from `from` until `x` first reaches half the largest
 * size it reaches from there on, read off the wave itself. `perSecond` is how many points a
 * second `x` has: `RATE` for sound, `POINT_RATE` for a control tap.
 */
export function onsetMs(x: Float32Array, from = 0, perSecond = RATE): number {
  let top = 0
  for (let i = from; i < x.length; i += 1) top = Math.max(top, Math.abs(x[i]!))
  let k = from
  while (k < x.length && Math.abs(x[k]!) < 0.5 * top) k += 1
  return ((k - from) * 1000) / perSecond
}

interface Written {
  value: number
  /** Half of the last digit as written: what rounding to that digit allows. */
  half: number
  bound?: 'less than' | 'under' | 'at most' | 'more than' | 'over' | 'at least'
}

/**
 * A number as a lesson writes it: `'39 ms'`, `'0.42 dB'`, `'−46.8 dB'`, `'23,750 Hz'`, `'63 %'`,
 * or a stated bound, `'less than 0.001 dB'` (also "under", "at most", "more than", "over",
 * "at least"). The unit is not read: the measurement is in the unit the lesson writes.
 */
function readWritten(written: string): Written {
  const found =
    /^(?:(less than|under|at most|more than|over|at least) )?([+−-]?)(\d[\d,]*)(?:\.(\d+))?(?: .+|%)?$/.exec(
      written.trim(),
    )
  if (!found) throw new Error(`Not a number as a lesson writes one: "${written}"`)
  const [, bound, sign, whole, decimals = ''] = found
  const size = Number(`${whole!.replaceAll(',', '')}.${decimals || '0'}`)
  return {
    value: sign === '' || sign === '+' ? size : -size,
    half: 0.5 * 10 ** -decimals.length,
    bound: bound as Written['bound'],
  }
}

/**
 * True when a measurement is the number a lesson writes: within half of the last digit written
 * (39.4 is `'39 ms'`, 39.6 is not), or on the right side of a stated bound (0.0004 is
 * `'less than 0.001 dB'`). Throws on a string it cannot read.
 */
export function matchesWritten(measured: number, written: string): boolean {
  const { value, half, bound } = readWritten(written)
  if (bound === 'less than' || bound === 'under') return measured < value
  if (bound === 'at most') return measured <= value
  if (bound === 'more than' || bound === 'over') return measured > value
  if (bound === 'at least') return measured >= value
  return Math.abs(measured - value) <= half
}

/**
 * Holds a measurement to the number exactly as the lesson's sentence writes it. A measurement
 * that supports fewer digits is written with fewer.
 */
export function expectWritten(measured: number, written: string) {
  expect(
    matchesWritten(measured, written),
    `measured ${measured}, which the lesson writes as "${written}"`,
  ).toBe(true)
}
