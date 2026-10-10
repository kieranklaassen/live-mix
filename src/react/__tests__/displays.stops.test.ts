// The truth of the Stops display: every bar, the curve and every handle
// against a number worked out from `cpp/devices/stops/stops.h` by hand or by
// a second writing of its formulas, and the light in each bar against the
// reading the device gives for that stop.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  STOPS,
  STOPS_FACES,
  stopsDrawn,
  stopsHeard,
  stopsPassed,
  stopsToneDb,
} from '../components/displays/stops'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('stops')
if (!descriptor) throw new Error('no stock device stops')
const params: Readonly<Record<string, ParamSpec>> = descriptor.params
const { display } = STOPS_FACES.stops
const { ink, accent } = PLAIN_COLOURS

// `stops.h`: kRatio with the unison among them, in the order of the drawbars.
const RATIOS = [0.5, 1, 1.5, 2, 3, 4]
const NAMES = ['sub', 'unison', 'fifth', 'octave', 'twelfth', 'fifteenth']
// `stops.h`: kPivotHz, kDarkSlopeDb, kBrightHz, kBrightSlopeDb, kBrightCutDb,
// kBrightLiftDb, kShutterSlopeDb, kShutterDb, written out again from the header.
function rankDb(hz: number, tone: number, swell: number): number {
  const octavesOver = Math.max(0, Math.log2(hz / 400))
  const dark = Math.max(0, 1 - 2 * tone) * 12 * octavesOver
  const bright = Math.min(6, Math.max(-8, Math.max(0, 2 * tone - 1) * 4 * Math.log2(hz / 1500)))
  const shut = (1 - swell) * (14 + 4 * octavesOver)
  return bright - dark - shut
}
const gain = (db: number): number => 10 ** (db / 20)
/** What comes out of each stop for a partial at `note`: the drawbars' law and the mix law of `stops.h`. */
function heardBy(values: Record<string, number>, note: number): number[] {
  const at = (name: string): number => values[name] ?? params[name].default
  const ranks = NAMES.map((name) => (name === 'unison' ? 0 : at(name) ** 1.5))
  const power = ranks.reduce((sum, level) => sum + level * level, 0)
  const together = power > 1 ? 1 / Math.sqrt(power) : 1
  return NAMES.map((name, i) =>
    name === 'unison'
      ? 1 - at('mix') * (1 - at('unison'))
      : at('mix') * ranks[i] * together * gain(rankDb(note * RATIOS[i], at('tone'), at('swell'))),
  )
}

// The layout, worked out from the size alone: a margin of 4, a line of words
// of 12 under the bars, 4 over them for a handle, and half a word either end.
const layoutOf = (width: number, height: number) => ({
  base: height - 16,
  top: 8,
  span: height - 24,
  perOctave: (width - 30) / 3,
  unison: 14 + (width - 30) / 3,
  ceiling: 5,
})
const xOf = (i: number, width: number, height: number): number => {
  const { unison, perOctave } = layoutOf(width, height)
  return unison + Math.log2(RATIOS[i]) * perOctave
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
  colour: string
  alpha: number
}
function rectsOf(drawn: RecordingContext): Rect[] {
  const rects: Rect[] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      rects.push({ x, y, w, h, colour, alpha })
    }
  }
  return rects
}
/** The longest line drawn: the curve. */
function curveOf(drawn: RecordingContext): [number, number][] {
  let best: [number, number][] = []
  let now: [number, number][] = []
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') now = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      now.push([Number(call.args[0]), Number(call.args[1])])
    else if (call.name === 'stroke' && now.length > best.length) best = now
  }
  return best
}
/** The bar of stop `i` in a colour: the rectangle that stands on the base line about its place. */
function barOf(drawn: RecordingContext, i: number, colour: string, width: number, height: number) {
  const x = xOf(i, width, height)
  const { base } = layoutOf(width, height)
  return rectsOf(drawn).find(
    (rect) =>
      rect.colour === colour &&
      rect.w <= 11 &&
      Math.abs(rect.x + rect.w / 2 - x) <= 1 &&
      Math.abs(rect.y + rect.h - base) < 1e-6,
  )
}

const SETTINGS: Record<string, number>[] = [
  {},
  { sub: 0.8, fifth: 0.35, octave: 0.9, twelfth: 0.6, fifteenth: 0.6, tone: 0.55, mix: 0.9 },
  { sub: 0.8, unison: 0.5, fifth: 0.3, octave: 0.9, twelfth: 0.7, swell: 0.45, mix: 1 },
  { sub: 1, fifth: 1, octave: 1, twelfth: 1, fifteenth: 1, tone: 0, mix: 1 },
  { unison: 0.25, tone: 1, mix: 0.4 },
]
const SIZES: [number, number][] = [
  [184, 48],
  [224, 48],
  [204, 100],
]

describe('the formulas of the stops display', () => {
  it('has the six drawbars at the ratios of stops.h, lowest first', () => {
    expect(STOPS.map((stop) => stop.param)).toEqual(NAMES)
    expect(STOPS.map((stop) => stop.ratio)).toEqual(RATIOS)
    // The readings come in the same order, and after them the loudest note.
    expect(Object.keys(descriptor.meters ?? {})).toEqual([
      ...STOPS.map((stop) => stop.meter),
      'note',
    ])
  })

  it('has Tone and Swell as the header has them, by numbers worked out by hand', () => {
    // Tone in the middle and the shutters open: nothing is done.
    expect(stopsToneDb(3000, 0.5, 1)).toBeCloseTo(0, 9)
    // Tone at 0: 12 dB an octave above 400 Hz, nothing below it.
    expect(stopsToneDb(1600, 0, 1)).toBeCloseTo(-24, 9)
    expect(stopsToneDb(200, 0, 1)).toBeCloseTo(0, 9)
    expect(stopsToneDb(800, 0.25, 1)).toBeCloseTo(-6, 9)
    // Tone at 1: 4 dB an octave about 1.5 kHz, 6 up and 8 down at most.
    expect(stopsToneDb(3000, 1, 1)).toBeCloseTo(4, 9)
    expect(stopsToneDb(750, 1, 1)).toBeCloseTo(-4, 9)
    expect(stopsToneDb(12000, 1, 1)).toBeCloseTo(6, 9)
    expect(stopsToneDb(100, 1, 1)).toBeCloseTo(-8, 9)
    expect(stopsToneDb(3000, 0.75, 1)).toBeCloseTo(2, 9)
    // The shutters half shut: 7 dB off everything and 2 dB an octave above 400 Hz.
    expect(20 * Math.log10(stopsPassed(1600, 0.5, 0.5, 48000))).toBeCloseTo(-11, 6)
    // Shut: 14 dB (kShutterDb), and 4 dB an octave more above 400 Hz (kShutterSlopeDb).
    expect(20 * Math.log10(stopsPassed(300, 0.5, 0, 48000))).toBeCloseTo(-14, 6)
    expect(20 * Math.log10(stopsPassed(3200, 0.5, 0, 48000))).toBeCloseTo(-26, 6)
    for (const hz of [60, 441.3, 1318.5, 3000, 9000])
      for (const tone of [0, 0.3, 0.5, 0.8, 1])
        for (const swell of [0, 0.45, 1])
          expect(20 * Math.log10(stopsPassed(hz, tone, swell, 48000))).toBeCloseTo(
            rankDb(hz, tone, swell),
            6,
          )
  })

  it('fades the ranks out at the two ends of hearing as the header does', () => {
    // kTopFadeFromHz 16 kHz to kTopFadeToHz 20 kHz: half way there, half is left.
    expect(stopsPassed(18000, 0.5, 1, 48000)).toBeCloseTo(0.5, 9)
    expect(stopsPassed(20000, 0.5, 1, 48000)).toBe(0)
    // At 32 kHz the fade is from 0.80 to 0.92 of the Nyquist frequency.
    expect(stopsPassed(12800, 0.5, 1, 32000)).toBeCloseTo(1, 9)
    expect(stopsPassed(13760, 0.5, 1, 32000)).toBeCloseTo(0.5, 9)
    // kLowFadeFromHz 18 Hz to kLowFadeToHz 28 Hz, in a straight line.
    expect(stopsPassed(23, 0.5, 1, 48000)).toBeCloseTo(0.5, 9)
    expect(stopsPassed(18, 0.5, 1, 48000)).toBe(0)
    expect(stopsPassed(10, 0.5, 1, 48000)).toBe(0)
  })

  it('has the drawbars law and the mix law of the header', () => {
    const view = (values: Record<string, number>) => viewOf(display, params, { values })
    // Half way is -9 dB; two full ranks are each 3 dB down, five each 7 dB down.
    expect(stopsDrawn(view({ sub: 0.5, octave: 0, twelfth: 0, fifteenth: 0 }))[0]).toBeCloseTo(
      0.5 ** 1.5,
      9,
    )
    const two = stopsDrawn(view({ sub: 1, octave: 1, twelfth: 0, fifteenth: 0 }))
    expect(two[0]).toBeCloseTo(Math.SQRT1_2, 9)
    expect(two[3]).toBeCloseTo(Math.SQRT1_2, 9)
    const five = stopsDrawn(view({ sub: 1, fifth: 1, octave: 1, twelfth: 1, fifteenth: 1 }))
    for (const i of [0, 2, 3, 4, 5]) expect(five[i]).toBeCloseTo(1 / Math.sqrt(5), 9)
    // At the defaults on a note of 220 Hz, worked out by hand: the sound
    // itself whole, the sub at 0.8 x 0.55^1.5, the octave 0.33 dB under
    // 0.8 x 0.7^1.5 (Tone at 0.4 takes 2.4 dB an octave above 400 Hz).
    const heard = stopsHeard(view({}), 220, 48000)
    expect(heard[1]).toBeCloseTo(1, 9)
    expect(heard[0]).toBeCloseTo(0.32631, 4)
    expect(heard[2]).toBe(0)
    expect(heard[3]).toBeCloseTo(0.8 * 0.7 ** 1.5 * gain(-2.4 * Math.log2(1.1)), 6)
    // Mix at 0 is the sound alone; Unison at 0 with Mix full is the ranks alone.
    expect(stopsHeard(view({ mix: 0, unison: 0 }), 220, 48000)).toEqual([0, 1, 0, 0, 0, 0])
    expect(stopsHeard(view({ mix: 1, unison: 0 }), 220, 48000)[1]).toBe(0)
    expect(stopsHeard(view({ mix: 0.5, unison: 0.5 }), 220, 48000)[1]).toBeCloseTo(0.75, 9)
    for (const values of SETTINGS)
      for (const note of [110, 220, 1318.5]) {
        const want = heardBy(values, note)
        stopsHeard(view(values), note, 48000).forEach((got, i) =>
          expect(got).toBeCloseTo(want[i], 6),
        )
      }
  })
})

describe('the picture of the stops display', () => {
  it('stands each bar at its pitch, as tall as its drawbar, with what comes out inside it', () => {
    for (const [width, height] of SIZES)
      for (const values of SETTINGS) {
        const drawn = drawDisplay(display, params, { values, width, height })
        const { base, span, ceiling } = layoutOf(width, height)
        // No note has been heard: the picture is drawn for 220 Hz.
        const heard = heardBy(values, 220)
        NAMES.forEach((name, i) => {
          const position = values[name] ?? params[name].default
          const set = barOf(drawn, i, ink, width, height)
          if (position > 0)
            expect(set?.y, `${name} set at ${width}`).toBeCloseTo(base - position * span, 6)
          else expect(set, `${name} is not drawn`).toBeUndefined()
          const out = barOf(drawn, i, accent, width, height)
          if (heard[i] * span > 1e-9) {
            expect(out?.y, `${name} out at ${width}`).toBeCloseTo(
              Math.max(ceiling, base - heard[i] * span),
              5,
            )
            // A still picture has every stop whole.
            expect(out?.alpha).toBeCloseTo(0.9, 9)
          } else expect(out, `${name} gives nothing`).toBeUndefined()
        })
      }
  })

  it('names the bars, and says the setting of the one in hand', () => {
    const drawn = drawDisplay(display, params)
    expect(drawn.words()).toEqual(['sub', 'uni', '5th', '8ve', '12th', '15th'])
    const hot = drawDisplay(display, params, { hot: 'octave', values: { octave: 0.37 } })
    expect(hot.words()).toContain('37%')
    const last = drawDisplay(display, params, { hot: 'fifteenth', values: { fifteenth: 1 } })
    expect(last.words()).toContain('100%')
  })

  it('draws the line of Tone and Swell at the real pitches about the note heard', () => {
    for (const [width, height] of SIZES)
      for (const [note, values] of [
        [0, {}],
        [0, { tone: 0, swell: 0.45 }],
        [523.25, { tone: 1 }],
        [1318.5, { tone: 0.1 }],
        [98, { swell: 0 }],
      ] as [number, Record<string, number>][]) {
        const options: FrameOptions = { values, width, height }
        const meters = Object.fromEntries(
          Object.keys(descriptor.meters ?? {}).map((key) => [key, 0]),
        )
        const drawn = note
          ? drawDisplay(display, params, {
              ...options,
              meters: { ...meters, note },
              signal: testSignal(),
            })
          : drawDisplay(display, params, options)
        const { base, span, unison, perOctave, ceiling } = layoutOf(width, height)
        const curve = curveOf(drawn)
        expect(curve.length).toBeGreaterThan(80)
        expect(curve[0][0]).toBeCloseTo(4, 9)
        expect(curve[curve.length - 1][0]).toBeCloseTo(width - 4, 9)
        const tone = values.tone ?? params.tone.default
        const swell = values.swell ?? params.swell.default
        for (const [x, y] of curve) {
          const hz = (note || 220) * 2 ** ((x - unison) / perOctave)
          if (hz < 30 || hz > 15000) continue
          expect(y).toBeCloseTo(Math.max(ceiling, base - gain(rankDb(hz, tone, swell)) * span), 5)
        }
      }
  })

  it('shows at Mix 0 the sound alone, with the drawbars still to be read', () => {
    const drawn = drawDisplay(display, params, { values: { mix: 0 } })
    const { base, span } = layoutOf(184, 48)
    NAMES.forEach((name, i) => {
      const out = barOf(drawn, i, accent, 184, 48)
      if (name === 'unison') expect(out?.y).toBeCloseTo(base - span, 6)
      else expect(out).toBeUndefined()
      if (params[name].default > 0)
        expect(barOf(drawn, i, ink, 184, 48)?.y).toBeCloseTo(base - params[name].default * span, 6)
    })
  })
})

describe('the handles of the stops display', () => {
  it('stand on their drawbars and set them: a drag is one value, and the handle is under the hand', () => {
    for (const [width, height] of SIZES)
      for (const values of SETTINGS) {
        const view = viewOf(display, params, { values, width, height })
        const handles = display.handles?.(view) ?? []
        const { base, top, span } = layoutOf(width, height)
        expect(handles.map((handle) => handle.key)).toEqual(NAMES)
        // Room to set a drawbar by hand: 20 px of travel at the least.
        expect(span).toBeGreaterThanOrEqual(20)
        handles.forEach((handle, i) => {
          const position = values[handle.key] ?? params[handle.key].default
          expect(handle.x).toBeCloseTo(xOf(i, width, height), 9)
          expect(handle.y).toBeCloseTo(base - position * span, 9)
          expect(handle.drag(handle.x, handle.y)[handle.key]).toBeCloseTo(position, 9)
          for (const y of [top, top + span * 0.3, base - 1, base]) {
            const set = handle.drag(handle.x + 40, y)
            expect(Object.keys(set)).toEqual([handle.key])
            expect(set[handle.key]).toBeCloseTo((base - y) / span, 9)
            const moved = display.handles?.(
              viewOf(display, params, { values: { ...values, ...set }, width, height }),
            )[i]
            expect(moved?.y).toBeCloseTo(y, 9)
            expect(moved?.x).toBeCloseTo(handle.x, 9)
          }
          // Past either end the drawbar stops at its end.
          expect(handle.drag(0, -40)[handle.key]).toBe(1)
          expect(handle.drag(0, height + 40)[handle.key]).toBe(0)
          expect(handle.reset?.()).toEqual({ [handle.key]: params[handle.key].default })
        })
        // No two handles under one finger.
        for (let i = 1; i < handles.length; i++)
          expect(handles[i].x - handles[i - 1].x).toBeGreaterThan(18)
      }
  })
})

describe('the twelve controls of stops on an upright plate', () => {
  it('are all in reach: eight knobs, and a drawbar on the display for each of the other four', () => {
    // `DevicePlate`: an upright face holds eight, the skin's four first and
    // then the rest in the manifest's order.
    const all = Object.keys(params)
    const chosen = STOPS_FACES.stops.face ?? []
    const knobs = [...chosen, ...all.filter((name) => !chosen.includes(name))].slice(0, 8)
    expect(knobs).toEqual(['sub', 'octave', 'speak', 'mix', 'tone', 'swell', 'chiff', 'detune'])
    const handles = (
      display.handles?.(viewOf(display, params, { width: 204, height: 100 })) ?? []
    ).map((handle) => handle.key)
    const left = all.filter((name) => !knobs.includes(name))
    expect(left).toEqual(['unison', 'fifth', 'twelfth', 'fifteenth'])
    for (const name of left) expect(handles).toContain(name)
  })
})

describe('the light of the stops display', () => {
  const quiet = Object.fromEntries(Object.keys(descriptor.meters ?? {}).map((key) => [key, 0]))
  const alphaOf = (drawn: RecordingContext, i: number): number | undefined =>
    barOf(drawn, i, accent, 184, 48)?.alpha
  // 0.35 for a stop that is silent, 0.9 at full scale, by decibels down to -54.
  const lit = (level: number): number =>
    0.35 + 0.55 * Math.min(1, Math.max(0, 1 + (20 * Math.log10(level)) / 54))

  it('lights each stop by the level it comes out at, from the reading of that stop', () => {
    const meters = { ...quiet, note: 440, unisonLevel: 0.25, subLevel: 0.02, octaveLevel: 0.1 }
    const values = { unison: 0.5, mix: 0.6, twelfth: 0.3 }
    const drawn = drawDisplay(display, params, { values, meters, signal: testSignal() })
    // The sound itself comes out at 1 - 0.6 x (1 - 0.5) = 0.7 of its reading; a rank at Mix times its own.
    expect(alphaOf(drawn, 1)).toBeCloseTo(lit(0.25 * 0.7), 9)
    expect(alphaOf(drawn, 0)).toBeCloseTo(lit(0.02 * 0.6), 9)
    expect(alphaOf(drawn, 3)).toBeCloseTo(lit(0.1 * 0.6), 9)
    // A rank that is drawn and silent stands pale.
    expect(alphaOf(drawn, 4)).toBeCloseTo(0.35, 9)
    expect(alphaOf(drawn, 5)).toBeCloseTo(0.35, 9)
    // Half a second on with the same readings it stands where it stood.
    const held = runDisplay(display, params, 0.5, { values, meters, signal: testSignal() })
    expect(alphaOf(held, 3)).toBeCloseTo(lit(0.1 * 0.6), 6)
  })

  it('lights a rank later than the sound when its reading comes later, and lets it fade', () => {
    const sound = { ...quiet, note: 440, unisonLevel: 0.25 }
    const signal = testSignal()
    // The reading of the octave rises over 400 ms, as a rank does under Speak.
    const rising = (time: number): Partial<FrameOptions> => ({
      meters: { ...sound, octaveLevel: 0.25 * Math.min(1, time / 0.4) },
    })
    const early = runDisplay(display, params, 0.1, { meters: sound, signal }, rising)
    const late = runDisplay(display, params, 0.6, { meters: sound, signal }, rising)
    expect(alphaOf(early, 1)).toBeCloseTo(lit(0.25), 3)
    expect(alphaOf(early, 3)).toBeLessThan((alphaOf(late, 3) ?? 0) - 0.05)
    expect(alphaOf(late, 3)).toBeCloseTo(lit(0.25 * 0.8), 3)
    // The sound stops: after 0.3 s (the fall's time constant) the light is a third of the way down.
    const stopping = (time: number): Partial<FrameOptions> => ({
      meters: time < 0.5 ? { ...sound, octaveLevel: 0.25 } : quiet,
    })
    const after = runDisplay(display, params, 0.8, { meters: sound, signal }, stopping)
    const from = lit(0.25 * 0.8)
    const fallen = alphaOf(after, 3) ?? 0
    expect(fallen).toBeLessThan(from - 0.3 * (from - 0.35))
    expect(fallen).toBeGreaterThan(0.36)
  })

  it('stands whole and still when the plate is off or has no sound to read', () => {
    const meters = { ...quiet, note: 880, octaveLevel: 0.001 }
    const off = drawDisplay(display, params, { meters, signal: testSignal(), powered: false })
    expect(alphaOf(off, 3)).toBeCloseTo(0.9, 9)
    expect(off.print()).toBe(drawDisplay(display, params).print())
  })
})
