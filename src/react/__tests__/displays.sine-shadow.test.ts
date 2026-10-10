// The Sine Shadow display against the device it shows: the weighing, the
// ends of the range and the Mix law are held to the numbers in
// `cpp/devices/sine-shadow/sine_shadow.h`, every line to the reading it is
// drawn from, and each handle to the parameter it sets.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SHADOW_EXAMPLE_HZ,
  SHADOW_FOOT_DB,
  SHADOW_SHOWN,
  SINE_SHADOW_FACES,
  shadowBand,
  shadowExample,
  shadowLayout,
  shadowLean,
  shadowWet,
} from '../components/displays/sine-shadow'
import { type DisplayHandle } from '../components/plate-display'
import {
  drawDisplay,
  metersOf,
  patchUnder,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('sine-shadow')
if (!descriptor) throw new Error('sine-shadow is not a stock device')
const { display } = SINE_SHADOW_FACES['sine-shadow']
const params = descriptor.params
const meters = metersOf(descriptor.meters)
const INK = PLAIN_COLOURS.ink
const ACCENT = PLAIN_COLOURS.accent

// The layout at the size of a plate lying flat (128 by 100): the marks from 7 to 121, the picture from 4 to
// 124 across and 16 to 82 down, the ruler from 8 to 120.
const BOX = { x: 4, y: 16, w: 120, h: 66 }
const FOOT = BOX.y + BOX.h
const xOf = (hz: number, box = BOX): number => box.x + (Math.log(hz / 20) / Math.log(1000)) * box.w
/** Where a level tops out: 0 dB at the top of the picture, -72 dB at its foot. */
const yOf = (level: number, box = BOX): number =>
  box.y + ((20 * Math.log10(level)) / SHADOW_FOOT_DB) * box.h

interface Line {
  x: number
  top: number
  foot: number
  colour: string
  alpha: number
}

/** The upright lines a drawing strokes at the sines' own width, left to right (kept as 32-bit floats: good to 1e-5 px). */
function linesOf(drawn: RecordingContext): Line[] {
  const lines: Line[] = []
  let pending: [number, number, number, number][] = []
  let at: [number, number] = [0, 0]
  let colour = ''
  let alpha = 1
  let width = 1
  for (const call of drawn.calls) {
    const args = call.args as number[]
    if (call.name === 'beginPath') pending = []
    else if (call.name === 'moveTo') at = [args[0], args[1]]
    else if (call.name === 'lineTo') {
      pending.push([at[0], at[1], args[0], args[1]])
      at = [args[0], args[1]]
    } else if (call.name === 'set strokeStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'set lineWidth') width = Number(call.args[0])
    else if (call.name === 'stroke' && width === 1.5) {
      for (const [x1, y1, x2, y2] of pending) {
        if (x1 === x2)
          lines.push({ x: x1, top: Math.min(y1, y2), foot: Math.max(y1, y2), colour, alpha })
      }
    }
  }
  return lines.sort((a, b) => a.x - b.x)
}

function handleOf(key: string, options: FrameOptions = {}): DisplayHandle {
  const found = display.handles?.(viewOf(display, params, options)).find((h) => h.key === key)
  if (!found) throw new Error(`sine-shadow has no handle ${key}`)
  return found
}

describe('Sine Shadow: the device’s own numbers', () => {
  it('weighs a partial as lean() does: 6 dB an octave above 300 Hz dark, below 2.5 kHz bright', () => {
    // kDarkHz 300, kBrightHz 2500; the exponent is 2 Tone - 1.
    for (const hz of [50, 300, 1000, 2500, 9000]) expect(shadowLean(0.5, hz)).toBe(1)
    expect(shadowLean(0, 300)).toBe(1)
    expect(shadowLean(0, 100)).toBe(1)
    expect(shadowLean(0, 600)).toBeCloseTo(0.5, 9)
    expect(shadowLean(0, 4800)).toBeCloseTo(1 / 16, 9)
    expect(shadowLean(0.25, 1200)).toBeCloseTo(0.5, 9)
    expect(shadowLean(1, 2500)).toBe(1)
    expect(shadowLean(1, 8000)).toBe(1)
    expect(shadowLean(1, 1250)).toBeCloseTo(0.5, 9)
    expect(shadowLean(0.75, 625)).toBeCloseTo(0.5, 9)
    // Never more than the partial itself.
    for (const tone of [0, 0.2, 0.5, 0.8, 1])
      for (const hz of [30, 300, 3000, 12000]) expect(shadowLean(tone, hz)).toBeLessThanOrEqual(1)
  })

  it('fades a sine at the ends of the range as band() does', () => {
    // kFadeInLowHz 16, kFadeInHighHz 22, kFadeOutLowHz 12000, kFadeOutHighHz 16000.
    expect(shadowBand(16)).toBe(0)
    expect(shadowBand(19)).toBeCloseTo(0.5, 9)
    expect(shadowBand(22)).toBe(1)
    expect(shadowBand(12000)).toBe(1)
    expect(shadowBand(14000)).toBeCloseTo(0.5, 9)
    expect(shadowBand(16000)).toBe(0)
    // Under 38.1 kHz the top is 0.42 of the rate and the knee three quarters of that.
    expect(shadowBand(13440, 32000)).toBe(0)
    expect(shadowBand(10080, 32000)).toBe(1)
    expect(shadowBand(11760, 32000)).toBeCloseTo(0.5, 9)
  })

  it('gives the sines the sine of Mix quarter turns (kit::equal_power)', () => {
    expect(shadowWet(0)).toBe(0)
    expect(shadowWet(0.5)).toBeCloseTo(Math.SQRT1_2, 9)
    expect(shadowWet(1)).toBeCloseTo(1, 9)
    expect(shadowWet(1 / 3)).toBeCloseTo(0.5, 9)
  })

  it('works its example as track() and aim() do: the strongest partials as Tone weighs them, moved by Transpose', () => {
    const plain = shadowExample(3, 0, 0.5)
    expect(plain.map((line) => line.hz)).toEqual([110, 220, 330])
    expect(plain.map((line) => line.level)).toEqual([0.5, 0.25, 0.5 / 3])
    // An octave up: the same partials, the same levels, twice the pitch.
    const up = shadowExample(3, 12, 0.5)
    expect(up.map((line) => line.hz)).toEqual([220, 440, 660])
    expect(up.map((line) => line.level)).toEqual(plain.map((line) => line.level))
    expect(shadowExample(1, -12, 0.5)[0].hz).toBeCloseTo(55, 9)
    expect(shadowExample(1, 7, 0.5)[0].hz).toBeCloseTo(110 * Math.pow(2, 7 / 12), 9)
    // Dark: the third harmonic, at 330 Hz, is over 300 Hz and loses 300 / 330 of its level.
    const dark = shadowExample(3, 0, 0)
    expect(dark[2].hz).toBe(330)
    expect(dark[2].level).toBeCloseTo((0.5 / 3) * (300 / 330), 9)
    // Tone weighs a partial at its own pitch, not at the sine's: an octave up changes nothing of that.
    expect(shadowExample(3, 12, 0)[2].level).toBeCloseTo(dark[2].level, 9)
    // Bright at three quarters takes the square root of 110 h / 2500 off harmonic h: still the lowest, weaker.
    const bright = shadowExample(2, 0, 0.75)
    expect(bright[0].level).toBeCloseTo(0.5 * Math.sqrt(110 / 2500), 9)
    expect(bright[1].level).toBeCloseTo(0.25 * Math.sqrt(220 / 2500), 9)
    // Partials is the count, up to the 24 the device shows; two octaves up the top ones run into the fade.
    expect(shadowExample(24, 0, 0.5)).toHaveLength(SHADOW_SHOWN)
    expect(shadowExample(99, 0, 0.5)).toHaveLength(SHADOW_SHOWN)
    const high = shadowExample(24, 24, 0.5)
    expect(high[23].hz).toBeCloseTo(24 * SHADOW_EXAMPLE_HZ * 4, 6)
    expect(high[23].level).toBeCloseTo(0.5 / 24, 9)
    expect(shadowBand(40 * 110 * 4)).toBe(0)
  })
})

describe('Sine Shadow: the picture', () => {
  it('lays out from the size it is given', () => {
    expect(shadowLayout({ width: 128, height: 100 })).toEqual({
      count: { x: 7, y: 5, w: 114, h: 7 },
      box: BOX,
      ruler: { x: 8, y: 88, w: 112, h: 7 },
    })
    // Upright the same display is 204 wide.
    const upright = shadowLayout({ width: 204, height: 100 })
    expect(upright.box).toEqual({ x: 4, y: 16, w: 196, h: 66 })
    expect(upright.ruler.w).toBe(188)
  })

  it('draws a line for each sine the device reports, at its pitch and as tall as Mix lets it sound', () => {
    const sines = {
      ...meters,
      hz1: 440,
      level1: 0.5,
      hz2: 1760,
      level2: 0.05,
      hz3: 55,
      level3: 0.2,
    }
    for (const mix of [0.25, 0.5, 1]) {
      const lines = linesOf(
        drawDisplay(display, params, {
          meters: sines,
          signal: testSignal(),
          dt: 1 / 30,
          values: { mix },
        }),
      )
      const wet = Math.sin((mix * Math.PI) / 2)
      expect(lines).toHaveLength(3)
      const expected = [
        [55, 0.2],
        [440, 0.5],
        [1760, 0.05],
      ]
      lines.forEach((line, n) => {
        expect(line.x).toBeCloseTo(xOf(expected[n][0]), 4)
        expect(line.top).toBeCloseTo(yOf(expected[n][1] * wet), 4)
        expect(line.foot).toBe(FOOT)
        // What sounds now is in the second colour, as strong as it goes.
        expect(line.colour).toBe(ACCENT)
        expect(line.alpha).toBe(1)
      })
    }
    // A full-scale sine with all of the shadow in the mix reaches the top; one 72 dB down is at the foot.
    const full = linesOf(
      drawDisplay(display, params, {
        meters: { ...meters, hz1: 1000, level1: 1 },
        signal: testSignal(),
        dt: 1 / 30,
        values: { mix: 1 },
      }),
    )
    expect(full[0].top).toBeCloseTo(BOX.y, 6)
  })

  it('draws the lines at their pitches at the upright size too', () => {
    const box = shadowLayout({ width: 204, height: 100 }).box
    const lines = linesOf(
      drawDisplay(display, params, {
        meters: { ...meters, hz1: 220, level1: 0.25, hz2: 3300, level2: 0.125 },
        signal: testSignal(),
        dt: 1 / 30,
        values: { mix: 1 },
        width: 204,
        height: 100,
      }),
    )
    expect(lines).toHaveLength(2)
    expect(lines[0].x).toBeCloseTo(xOf(220, box), 4)
    expect(lines[1].x).toBeCloseTo(xOf(3300, box), 4)
    expect(lines[0].top).toBeCloseTo(yOf(0.25, box), 4)
    expect(lines[1].top).toBeCloseTo(yOf(0.125, box), 4)
  })

  it('draws nothing of the shadow while Mix lets none of it be heard, and reads the device again when it does', () => {
    const sines = { ...meters, hz1: 440, level1: 0.5 }
    const state = display.init?.()
    const silent = drawDisplay(display, params, {
      meters: sines,
      signal: testSignal(),
      dt: 1 / 30,
      values: { mix: 0 },
      state,
    })
    expect(linesOf(silent)).toHaveLength(0)
    // At rest with Mix at nothing there is no worked example either: the settings would do nothing.
    expect(linesOf(drawDisplay(display, params, { meters, values: { mix: 0 } }))).toHaveLength(0)
    // The marks and the ruler stay.
    expect(silent.marks()).toBeGreaterThan(SHADOW_SHOWN)
    // Mix back: the next frame is the device's reading as it stands, on the same state.
    const back = linesOf(
      drawDisplay(display, params, {
        meters: sines,
        signal: testSignal(),
        dt: 1 / 30,
        values: { mix: 1 },
        state,
      }),
    )
    expect(back).toHaveLength(1)
    expect(back[0].top).toBeCloseTo(yOf(0.5), 4)
  })

  it('shows the worked example while there is no sound: the followed harmonics of a low note, in ink', () => {
    const at = (values: Record<string, number>): Line[] =>
      linesOf(drawDisplay(display, params, { meters, values }))
    const defaults = at({})
    const example = shadowExample(8, 0, 0.5)
    expect(defaults).toHaveLength(8)
    defaults.forEach((line, n) => {
      expect(line.x).toBeCloseTo(xOf(example[n].hz), 4)
      expect(line.top).toBeCloseTo(yOf(example[n].level * Math.SQRT1_2), 4)
      expect(line.colour).toBe(INK)
    })
    // Partials is the number of lines; Transpose moves every one by its semitones along the scale.
    expect(at({ partials: 1 })).toHaveLength(1)
    expect(at({ partials: 24 })).toHaveLength(24)
    const octave = BOX.w / Math.log2(1000)
    const moved = at({ transpose: 12 })
    moved.forEach((line, n) => expect(line.x - defaults[n].x).toBeCloseTo(octave, 4))
    const down = at({ transpose: -12 })
    down.forEach((line, n) => expect(line.x - defaults[n].x).toBeCloseTo(-octave, 4))
    // Tone dark lowers the lines over 300 Hz by what lean() takes off.
    const dark = at({ tone: 0 })
    expect(dark[7].top - defaults[7].top).toBeCloseTo(
      (20 * Math.log10(shadowLean(0, 880)) * BOX.h) / SHADOW_FOOT_DB,
      4,
    )
    // With sound running and no sine sounding (noise, with Steady up) there is nothing to draw: the example
    // stands in only while nothing sounds at all.
    expect(
      linesOf(drawDisplay(display, params, { meters, signal: testSignal(), dt: 1 / 30 })),
    ).toHaveLength(0)
    const silence = linesOf(
      drawDisplay(display, params, { meters, signal: testSignal(0, 0), dt: 1 / 30 }),
    )
    expect(silence.map((line) => line.x)).toEqual(defaults.map((line) => line.x))
    expect(silence[0].colour).toBe(INK)
    // Switched off it is the example too, whatever the device last reported.
    const off = linesOf(
      drawDisplay(display, params, {
        meters: { ...meters, hz1: 3000, level1: 1 },
        signal: testSignal(),
        dt: 1 / 30,
        powered: false,
      }),
    )
    expect(off.map((line) => line.x)).toEqual(defaults.map((line) => line.x))
  })

  it('is a still picture of the settings when there is no sound', () => {
    const early = drawDisplay(display, params, { meters, now: 3 }).print()
    const late = drawDisplay(display, params, { meters, now: 47.3 }).print()
    expect(late).toBe(early)
  })

  it('makes no new points from one frame to the next', () => {
    const state = display.init?.() as { tone: unknown; tops: unknown; example: unknown }
    const options = {
      signal: testSignal(),
      dt: 1 / 30,
      meters: { ...meters, hz1: 440, level1: 0.3 },
      state,
    }
    runDisplay(display, params, 0.2, options)
    const before = { tone: state.tone, tops: state.tops }
    runDisplay(display, params, 0.2, options)
    expect(state.tone).toBe(before.tone)
    expect(state.tops).toBe(before.tops)
    // Tone moved: its line is worked out again.
    runDisplay(display, params, 0.1, { ...options, values: { tone: 0.2 } })
    expect(state.tone).not.toBe(before.tone)
  })
})

describe('Sine Shadow: the handles', () => {
  it('marks a partial each along the top, the followed ones strong, and stands the handle on the last of them', () => {
    const step = 114 / 24
    for (const partials of [1, 8, 17, 24]) {
      const drawn = drawDisplay(display, params, { meters, values: { partials } })
      // The marks: 24 upright rectangles in the top row, in ink.
      const marks: { x: number; alpha: number }[] = []
      let alpha = 1
      for (const call of drawn.calls) {
        if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
        const [x, y, w, h] = call.args as number[]
        if (call.name === 'fillRect' && y === 5 && h === 7) marks.push({ x: x + w / 2, alpha })
      }
      expect(marks).toHaveLength(24)
      marks.forEach((mark, n) => {
        expect(mark.x).toBeCloseTo(7 + (n + 0.5) * step, 6)
        expect(mark.alpha).toBe(n < partials ? 0.9 : 0.34)
      })
      const handle = handleOf('partials', { values: { partials } })
      expect(handle.x).toBeCloseTo(7 + (partials - 0.5) * step, 6)
      expect(handle.y).toBeCloseTo(8.5, 6)
      // Taken and not moved it stays; dragged onto a mark it is that many partials.
      expect(handle.drag(handle.x, handle.y)).toEqual({ partials })
      for (const to of [1, 2, 9, 23, 24])
        expect(handle.drag(7 + (to - 0.5) * step, 40)).toEqual({ partials: to })
    }
    // Past either end it is the least and the most; the whole travel is 23 marks, 109 px.
    const handle = handleOf('partials')
    expect(handle.drag(-40, 0)).toEqual({ partials: 1 })
    expect(handle.drag(500, 0)).toEqual({ partials: 24 })
    expect(
      handleOf('partials', { values: { partials: 24 } }).x -
        handleOf('partials', { values: { partials: 1 } }).x,
    ).toBeCloseTo(23 * step, 6)
    expect(handle.reset?.()).toEqual({ partials: 8 })
  })

  it('stands the Transpose handle on a ruler of the control’s whole range, a semitone a step', () => {
    const xOfSemitones = (semitones: number, width = 128): number =>
      8 + ((semitones + 12) / 36) * (width - 16)
    for (const transpose of [-12, -5, 0, 7, 12, 24]) {
      const handle = handleOf('transpose', { values: { transpose } })
      expect(handle.x).toBeCloseTo(xOfSemitones(transpose), 6)
      expect(handle.y).toBeCloseTo(91.5, 6)
      expect(handle.drag(handle.x, handle.y)).toEqual({ transpose })
      for (const to of [-12, -1, 0, 1, 19, 24])
        expect(handle.drag(xOfSemitones(to), 60)).toEqual({ transpose: to })
    }
    const handle = handleOf('transpose')
    // Between two semitones it is the nearer; past the ends it is the end.
    expect(handle.drag(xOfSemitones(6.4), 0)).toEqual({ transpose: 6 })
    expect(handle.drag(xOfSemitones(6.6), 0)).toEqual({ transpose: 7 })
    expect(handle.drag(-100, 0)).toEqual({ transpose: -12 })
    expect(handle.drag(900, 0)).toEqual({ transpose: 24 })
    expect(handle.reset?.()).toEqual({ transpose: 0 })
    // Upright the ruler is 188 px: more than 5 px a semitone.
    const upright = handleOf('transpose', { values: { transpose: 7 }, width: 204, height: 100 })
    expect(upright.x).toBeCloseTo(xOfSemitones(7, 204), 6)
    expect(upright.drag(xOfSemitones(-3, 204), 0)).toEqual({ transpose: -3 })
  })

  it('draws the transposition as a bar from none to the setting, with a tick at each octave', () => {
    const bar = (transpose: number): { x: number; w: number } | undefined => {
      const drawn = drawDisplay(display, params, { meters, values: { transpose } })
      for (const call of drawn.calls) {
        const [x, y, w, h] = call.args as number[]
        if (call.name === 'fillRect' && y === 90.5 && h === 2) return { x, w }
      }
      return undefined
    }
    const zero = 8 + (12 / 36) * 112
    expect(bar(0)).toBeUndefined()
    expect(bar(12)?.x).toBeCloseTo(zero, 6)
    expect(bar(12)?.w).toBeCloseTo(112 / 3, 6)
    expect(bar(-12)?.x).toBeCloseTo(8, 6)
    expect(bar(-12)?.w).toBeCloseTo(112 / 3, 6)
    expect(bar(24)?.w).toBeCloseTo((2 * 112) / 3, 6)
  })

  it('says the point in hand in words, on a patch of the plate', () => {
    const words = (hot: string, values: Record<string, number>): string[] =>
      drawDisplay(display, params, { meters, values, hot }).words()
    expect(words('partials', {})).toEqual(['8 partials'])
    expect(words('partials', { partials: 1 })).toEqual(['1 partial'])
    expect(words('transpose', {})).toEqual(['0 st'])
    expect(words('transpose', { transpose: 7 })).toEqual(['+7 st'])
    expect(words('transpose', { transpose: -12 })).toEqual(['−12 st'])
    // No words while nothing is in hand.
    expect(drawDisplay(display, params, { meters }).words()).toEqual([])
    const drawn = drawDisplay(display, params, {
      meters: { ...meters, hz1: 440, level1: 0.5 },
      signal: testSignal(),
      dt: 1 / 30,
      values: { transpose: 7 },
      hot: 'transpose',
    })
    expect(patchUnder(drawn, '+7 st', PLAIN_COLOURS.plate)).not.toBeNull()
  })
})
