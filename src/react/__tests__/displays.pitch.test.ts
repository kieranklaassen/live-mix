// The truth of the pitch displays: every mark against a number worked out
// from the device's own formula by hand, at the size a display has on a plate
// at rest (a strip 184 by 48, a window of two columns 128 by 100).

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { PLAIN_COLOURS } from '../components/display-kit'
import { PITCH_FACES } from '../components/displays/pitch'
import { type DisplayHandle, type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const { ink, accent } = PLAIN_COLOURS

function deviceOf(id: string): {
  display: PlateDisplay
  params: Readonly<Record<string, ParamSpec>>
} {
  const descriptor = stock.get(id)
  if (!descriptor) throw new Error(`no stock device ${id}`)
  return { display: PITCH_FACES[id].display, params: descriptor.params }
}

// --- What was drawn, read back from the calls --------------------------------

interface Line {
  points: [number, number][]
  /** Centre and radius of every arc in the path. */
  arcs: [number, number, number, number, number][]
  colour: string
  width: number
  alpha: number
  dashed: boolean
}
interface Area {
  points: [number, number][]
  arcs: [number, number, number, number, number][]
  colour: string
  alpha: number
}
interface Rect {
  x: number
  y: number
  w: number
  h: number
  colour: string
  alpha: number
}
interface Word {
  words: string
  x: number
  y: number
}
interface Picture {
  lines: Line[]
  areas: Area[]
  rects: Rect[]
  outlines: Rect[]
  words: Word[]
}

/** The lines, areas, boxes and words a display drew, each with the colour and width it was drawn in. */
function pictureOf(drawn: RecordingContext): Picture {
  const picture: Picture = { lines: [], areas: [], rects: [], outlines: [], words: [] }
  let alpha = 1
  let stroke = ''
  let fill = ''
  let width = 1
  let dashed = false
  let points: [number, number][] = []
  let arcs: [number, number, number, number, number][] = []
  for (const { name, args } of drawn.calls) {
    const n = args as number[]
    if (name === 'set globalAlpha') alpha = n[0]
    else if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'set lineWidth') width = n[0]
    else if (name === 'setLineDash') dashed = (args[0] as number[]).length > 0
    else if (name === 'beginPath') {
      points = []
      arcs = []
    } else if (name === 'moveTo' || name === 'lineTo') points.push([n[0], n[1]])
    else if (name === 'arc') arcs.push([n[0], n[1], n[2], n[3], n[4]])
    else if (name === 'stroke')
      picture.lines.push({
        points: [...points],
        arcs: [...arcs],
        colour: stroke,
        width,
        alpha,
        dashed,
      })
    else if (name === 'fill')
      picture.areas.push({ points: [...points], arcs: [...arcs], colour: fill, alpha })
    else if (name === 'fillRect')
      picture.rects.push({ x: n[0], y: n[1], w: n[2], h: n[3], colour: fill, alpha })
    else if (name === 'strokeRect')
      picture.outlines.push({ x: n[0], y: n[1], w: n[2], h: n[3], colour: stroke, alpha })
    else if (name === 'fillText') picture.words.push({ words: String(args[0]), x: n[1], y: n[2] })
  }
  return picture
}

interface Upright {
  x: number
  top: number
  foot: number
  alpha: number
}

/** The upright marks of one colour and width, left to right. */
function uprights(picture: Picture, colour: string, width: number): Upright[] {
  return picture.lines
    .filter(
      (line) =>
        line.colour === colour &&
        line.width === width &&
        !line.dashed &&
        line.points.length === 2 &&
        line.points[0][0] === line.points[1][0],
    )
    .map((line) => ({
      x: line.points[0][0],
      top: Math.min(line.points[0][1], line.points[1][1]),
      foot: Math.max(line.points[0][1], line.points[1][1]),
      alpha: line.alpha,
    }))
    .sort((one, other) => one.x - other.x)
}

/** The mark standing at `x`, or a failure that says which were there. */
function at(marks: Upright[], x: number): Upright {
  const found = marks.find((mark) => Math.abs(mark.x - x) < 0.01)
  if (!found)
    throw new Error(`no mark at ${x.toFixed(2)}: ${marks.map((m) => m.x.toFixed(2)).join(' ')}`)
  return found
}

function handleOf(
  id: string,
  key: string,
  options: FrameOptions = {},
): { handle: DisplayHandle; all: readonly DisplayHandle[] } {
  const { display, params } = deviceOf(id)
  const all = display.handles?.(viewOf(display, params, options)) ?? []
  const handle = all.find((point) => point.key === key)
  if (!handle) throw new Error(`${id} has no handle ${key}`)
  return { handle, all }
}

// --- Pitch Shifter -----------------------------------------------------------

describe('the pitch shifter display', () => {
  const { display, params } = deviceOf('pitch-shifter')
  // The ruler: −24 to +24 semitones over 162 px from x 11; marks stand on y 35, full height is y 8.
  const xOfSt = (st: number): number => 11 + ((st + 24) / 48) * 162
  const topOf = (level: number): number => 35 - level * 27

  it('stands the input at 0 and each voice at its interval, B as tall as its level', () => {
    const picture = pictureOf(
      drawDisplay(display, params, { values: { pitchA: 7, pitchB: -5, levelB: 0.5 } }),
    )
    const input = uprights(picture, ink, 2)
    expect(input).toHaveLength(1)
    expect(input[0].x).toBeCloseTo(92, 6)
    const voices = uprights(picture, accent, 2.5)
    expect(voices).toHaveLength(2)
    // B at −5: (19 / 48) of 162 from 11. A at +7.
    expect(voices[0].x).toBeCloseTo(75.125, 6)
    expect(voices[0].top).toBeCloseTo(21.5, 6)
    expect(voices[1].x).toBeCloseTo(115.625, 6)
    expect(voices[1].top).toBeCloseTo(8, 6)
    expect(voices[1].foot).toBe(35)
  })

  it('numbers the octaves and names the voices by their intervals', () => {
    const words = drawDisplay(display, params, {
      values: { pitchA: 7, pitchB: -5, levelB: 0.5 },
    }).words()
    for (const number of ['−24', '−12', '0', '+12', '+24', 'A +7', 'B −5'])
      expect(words).toContain(number)
  })

  it('leaves voice B out while its level is 0', () => {
    const drawn = drawDisplay(display, params, { values: { levelB: 0 } })
    const voices = uprights(pictureOf(drawn), accent, 2.5)
    expect(voices).toHaveLength(1)
    expect(voices[0].x).toBeCloseTo(xOfSt(12), 6)
    expect(drawn.words()).toContain('B')
  })

  it('pushes A sharp and B flat by Detune, in cents', () => {
    // `pitch_shifter.h`: A + detune / 100, B − detune / 100. 50 cents is half a semitone, 1.6875 px.
    const picture = pictureOf(
      drawDisplay(display, params, { values: { pitchA: 12, pitchB: 12, levelB: 1, detune: 50 } }),
    )
    const voices = uprights(picture, accent, 2.5)
    expect(voices[0].x).toBeCloseTo(132.5 - 1.6875, 6)
    expect(voices[1].x).toBeCloseTo(132.5 + 1.6875, 6)
    const words = drawDisplay(display, params, {
      values: { pitchA: 7, pitchB: -5, levelB: 0.5, detune: 12 },
    }).words()
    expect(words).toContain('A +7.12')
    expect(words).toContain('B −5.12')
  })

  it('draws every repeat of one voice an interval further and Feedback quieter', () => {
    // One voice at +5, Feedback 0.55: +10 at 0.55, +15 at 0.55², +20 at 0.55³; +25 is off the ruler.
    const picture = pictureOf(
      drawDisplay(display, params, { values: { pitchA: 5, levelB: 0, feedback: 0.55 } }),
    )
    const repeats = uprights(picture, accent, 1)
    expect(repeats.map((mark) => mark.x)).toEqual([xOfSt(10), xOfSt(15), xOfSt(20)])
    expect(repeats[0].top).toBeCloseTo(topOf(0.55), 6)
    expect(repeats[1].top).toBeCloseTo(topOf(0.3025), 6)
    expect(repeats[2].top).toBeCloseTo(topOf(0.166375), 6)
  })

  it('feeds two voices back at the level of one, their echoes adding where they meet', () => {
    // A +7, B −5 at full level, Feedback 0.6: 0.6 / (1 + 1) = 0.3 a pass.
    // Pass 2: A of A at +14 (0.3), A of B and B of A at +2 (0.6), B of B at −10 (0.3).
    // Pass 3 (0.09): three ways to +9 and to −3 (0.27). Pass 4 (0.027): six ways to +4 (0.162).
    // Pass 6 (0.00243): twenty ways to +6 (0.0486), the only sum of six over the floor.
    const picture = pictureOf(
      drawDisplay(display, params, {
        values: { pitchA: 7, pitchB: -5, levelB: 1, feedback: 0.6 },
      }),
    )
    const repeats = uprights(picture, accent, 1)
    expect(at(repeats, xOfSt(14)).top).toBeCloseTo(topOf(0.3), 6)
    expect(at(repeats, xOfSt(2)).top).toBeCloseTo(topOf(0.6), 6)
    expect(at(repeats, xOfSt(-10)).top).toBeCloseTo(topOf(0.3), 6)
    expect(at(repeats, xOfSt(9)).top).toBeCloseTo(topOf(0.27), 6)
    expect(at(repeats, xOfSt(-3)).top).toBeCloseTo(topOf(0.27), 6)
    expect(at(repeats, xOfSt(4)).top).toBeCloseTo(topOf(0.162), 6)
    expect(at(repeats, xOfSt(6)).top).toBeCloseTo(topOf(0.0486), 6)
    // Four of A at +28 would be 0.027: under the floor, and off the ruler.
    expect(repeats.every((mark) => mark.x <= xOfSt(24.5))).toBe(true)
  })

  it('shows how far Jitter scatters the pitch, by mode', () => {
    const band = (mode: number): number | undefined =>
      pictureOf(
        drawDisplay(display, params, { values: { pitchA: 12, levelB: 0, mode, jitter: 1 } }),
      ).rects.find((rect) => rect.colour === accent && rect.alpha === 0.3)?.w
    // Smooth ±20 cents, Grain ±40 (`ShiftVoice.h`): 0.4 and 0.8 of a semitone of 3.375 px.
    expect(band(0)).toBeCloseTo(0.4 * 3.375, 6)
    expect(band(1)).toBeCloseTo(0.8 * 3.375, 6)
    // Vintage stretches a pass by up to 3 %: 1200 log2(1.03) = 51.2 cents either side.
    expect(band(2)).toBeCloseTo(2 * 0.51175 * 3.375, 3)
    // Chords has no pieces to scatter.
    expect(band(3)).toBeUndefined()
  })

  it('has a handle on each voice that snaps to semitones', () => {
    const a = handleOf('pitch-shifter', 'a').handle
    expect(a.x).toBeCloseTo(132.5, 6)
    expect(a.y).toBe(8)
    expect(a.drag(xOfSt(7) + 0.4, 20)).toEqual({ pitchA: 7 })
    expect(a.drag(xOfSt(-40), 20)).toEqual({ pitchA: -24 })
    const b = handleOf('pitch-shifter', 'b', { values: { pitchB: -5, levelB: 0.5 } }).handle
    expect(b.x).toBeCloseTo(75.125, 6)
    expect(b.y).toBeCloseTo(21.5, 6)
    // Up to the top is full level; along to +3.
    expect(b.drag(xOfSt(3), 8)).toEqual({ pitchB: 3, levelB: 1 })
    expect(b.drag(b.x, 35)).toEqual({ pitchB: -5, levelB: 0 })
  })

  it('keeps an interval set between semitones until the handle is taken away from it', () => {
    const values = { pitchA: 12.4, detune: 10 }
    const a = handleOf('pitch-shifter', 'a', { values }).handle
    // The handle stands where the voice sounds: 12.4 + 0.1.
    expect(a.x).toBeCloseTo(xOfSt(12.5), 6)
    expect(a.drag(a.x, a.y)).toEqual({ pitchA: 12.4 })
    expect(a.drag(a.x + 1, a.y)).toEqual({ pitchA: 12.4 })
    // Taken to where +15 sounds with this Detune, it is +15.
    expect(a.drag(xOfSt(15.1), a.y)).toEqual({ pitchA: 15 })
  })
})

// --- Octaves -----------------------------------------------------------------

describe('the octaves display', () => {
  const { display, params } = deviceOf('octaves')
  // Bars 20 px apart about x 64, standing on y 82; a level of 1.2 is 75 px.
  const heightOf = (level: number): number => (Math.min(level, 1.2) / 1.2) * 75
  const everything = { sub2: 1, sub1: 1, dry: 1, up1: 1, up2: 1 }
  /** What the note gets of each voice now: the bars in the second colour, by octave. */
  const gets = (options: FrameOptions): Map<number, number> =>
    new Map(
      pictureOf(drawDisplay(display, params, options))
        .rects.filter((rect) => rect.colour === accent)
        .map((rect) => [(rect.x + rect.w / 2 - 64) / 20, rect.h] as [number, number]),
    )
  /** The low pass at Q √½ is a Butterworth: 1 / √(1 + r⁴), with r in the filter's warped frequency. */
  const butterworth = (hz: number, cut: number): number => {
    const r = Math.tan((Math.PI * hz) / 48000) / Math.tan((Math.PI * cut) / 48000)
    return 1 / Math.sqrt(1 + r ** 4)
  }

  it('stands a bar in each octave as tall as its level, with a handle on top', () => {
    const picture = pictureOf(drawDisplay(display, params))
    const set = picture.rects.filter((rect) => rect.colour === ink && rect.w === 10)
    // The defaults: one down and one up at 0.5, the dry sound at 1, the outer two at 0.
    expect(set.map((rect) => [rect.x + 5, rect.h])).toEqual([
      [44, heightOf(0.5)],
      [64, heightOf(1)],
      [84, heightOf(0.5)],
    ])
    const { all } = handleOf('octaves', 'sub1')
    expect(all.map((point) => [point.key, point.x])).toEqual([
      ['sub2', 24],
      ['sub1', 44],
      ['dry', 64],
      ['up1', 84],
      ['up2', 104],
    ])
    expect(all[1].y).toBeCloseTo(82 - heightOf(0.5), 6)
    expect(all[0].y).toBe(82)
    expect(drawDisplay(display, params).words()).toEqual(['−2', '−1', '0', '+1', '+2'])
  })

  it('sets a level by the height its bar is dragged to', () => {
    const { handle } = handleOf('octaves', 'up2')
    expect(handle.drag(0, 82 - heightOf(0.8)).up2).toBeCloseTo(0.8, 6)
    expect(handle.drag(0, 0)).toEqual({ up2: 1 })
    expect(handle.drag(0, 99)).toEqual({ up2: 0 })
    expect(handle.reset?.()).toEqual({ up2: 0 })
  })

  it('draws what the note played gets of each voice after the filter', () => {
    // A 220 Hz note, the filter at 440 Hz with no resonance: the octave up
    // lands on the cutoff, 3 dB down; two up is an octave over it.
    const heights = gets({
      values: { ...everything, filter: 440, resonance: 0 },
      meters: { note: 220 },
      signal: testSignal(),
    })
    expect(heights.get(0)).toBeCloseTo(heightOf(1), 6)
    expect(heights.get(1)).toBeCloseTo(heightOf(Math.SQRT1_2), 4)
    expect(heights.get(2)).toBeCloseTo(heightOf(butterworth(880, 440)), 4)
    // An octave over the cutoff a Butterworth leaves 1 / √17, a little less as the filter warps.
    expect(butterworth(880, 440)).toBeCloseTo(1 / Math.sqrt(17), 2)
    expect(heights.get(-1)).toBeCloseTo(heightOf(butterworth(110, 440)), 4)
    expect(heights.get(-2)).toBeCloseTo(heightOf(butterworth(55, 440)), 4)
    // The dry sound does not pass the filter (`octaves.h`).
    expect(heights.get(0)).toBeGreaterThan(heights.get(-1) ?? 0)
  })

  it('names the note and keeps it under the middle bar', () => {
    const words = (note: number): string[] =>
      drawDisplay(display, params, { meters: { note }, signal: testSignal() }).words()
    expect(words(220)).toEqual(['−2', '−1', 'A3', '+1', '+2'])
    expect(words(92.5)).toEqual(['−2', '−1', 'F♯2', '+1', '+2'])
  })

  it('leaves out of a voice what the device leaves out at the ends of its range', () => {
    // `OctaveBank::init`: two down fades in from 110 to 154 Hz, one down from
    // 55 to 77 Hz, each by a smooth step. Half way up either is a half.
    const low = gets({ values: everything, meters: { note: 132 }, signal: testSignal() })
    expect(low.get(-2)).toBeCloseTo(heightOf(0.5), 2)
    expect(low.get(-1)).toBeCloseTo(heightOf(1), 2)
    const lower = gets({ values: everything, meters: { note: 66 }, signal: testSignal() })
    expect(lower.has(-2)).toBe(false)
    expect(lower.get(-1)).toBeCloseTo(heightOf(0.5), 2)
    // At 48 kHz the bank runs at 24 kHz: two up fades out from 2016 to 2520
    // Hz (0.105 of the rate and four fifths of that), one up from 4032 Hz.
    const high = gets({ values: everything, meters: { note: 2268 }, signal: testSignal() })
    // The filter, wide open at 16 kHz, takes a little off the 9 kHz the voice lands on.
    expect(high.get(2)).toBeCloseTo(heightOf(0.5 * butterworth(9072, 16000)), 2)
    expect(butterworth(9072, 16000)).toBeGreaterThan(0.98)
    expect(high.get(1)).toBeGreaterThan(heightOf(0.9))
    const higher = gets({ values: everything, meters: { note: 2600 }, signal: testSignal() })
    expect(higher.has(2)).toBe(false)
  })

  it('draws the filter as it is: 3 dB down at the cutoff, a peak of Q with Resonance', () => {
    const middle = (values: Record<string, number>): number => {
      const curve = pictureOf(
        drawDisplay(display, params, { values, meters: { note: 220 }, signal: testSignal() }),
      ).lines.find((line) => line.colour === ink && line.points.length === 61)
      if (!curve) throw new Error('no filter curve')
      // The 31st of 61 points is the note played, in the middle.
      expect(curve.points[30][0]).toBe(64)
      return curve.points[30][1]
    }
    expect(middle({ filter: 220, resonance: 0 })).toBeCloseTo(82 - heightOf(Math.SQRT1_2), 4)
    // Resonance at half: Q = √½ (9 / √½)^½ = 2.523, and so is the gain at the cutoff: off the scale's top.
    expect(middle({ filter: 220, resonance: 0.5 })).toBeCloseTo(82 - heightOf(1.2), 6)
    // A filter wide open leaves the note alone.
    expect(middle({ filter: 16000, resonance: 0 })).toBeCloseTo(82 - heightOf(1), 2)
  })

  it('shows the levels alone while no note is heard', () => {
    expect(gets({ meters: { note: 0 }, signal: testSignal() }).size).toBe(0)
    expect(gets({ meters: { note: 220 } }).size).toBe(0)
  })
})

// --- Half Speed --------------------------------------------------------------

describe('the half speed display', () => {
  const { display, params } = deviceOf('half-speed')
  // Two cycles of 87 px: this one starts at x 92. The middle is y 24, full size 18 px either way.
  const xOf = (place: number): number => 92 + place * 87
  const rest = { length: 1000, speed: 2, fade: 0.15, smooth: 0 }
  const writeHead = (picture: Picture): Upright => {
    const heads = uprights(picture, ink, 1.5)
    expect(heads).toHaveLength(1)
    return heads[0]
  }
  /** How much of each place is played, as the display's outline has it: 96 places a cycle. */
  const played = (values: Record<string, number>): ((place: number) => number) => {
    const outline = pictureOf(drawDisplay(display, params, { values })).lines.find(
      (line) => line.colour === ink && line.width === 1 && line.points.length === 192,
    )
    if (!outline) throw new Error('no outline of what is played')
    return (place) => (24 - outline.points[96 + Math.floor(place * 96)][1]) / 18
  }

  it('at rest reads behind the write head at the slower speed', () => {
    // Three quarters through the cycle a head at half speed is three eighths through it.
    const half = pictureOf(drawDisplay(display, params, { values: rest }))
    expect(writeHead(half).x).toBeCloseTo(xOf(0.75), 6)
    const heads = uprights(half, accent, 2.5)
    expect(heads).toHaveLength(1)
    expect(heads[0].x).toBeCloseTo(xOf(0.375), 6)
    expect(heads[0].x - 92).toBeCloseTo((writeHead(half).x - 92) / 2, 6)
    expect([heads[0].top, heads[0].foot]).toEqual([6, 42])
    // The four speeds of `half_speed.h`: three quarters, two thirds, half, a quarter.
    const places = [0, 1, 3].map(
      (speed) =>
        uprights(
          pictureOf(drawDisplay(display, params, { values: { ...rest, speed } })),
          accent,
          2.5,
        ).at(-1)?.x,
    )
    expect(places[0]).toBeCloseTo(xOf(0.75 * 0.75), 6)
    expect(places[1]).toBeCloseTo(xOf(0.75 * (2 / 3)), 6)
    expect(places[2]).toBeCloseTo(xOf(0.75 * 0.25), 6)
  })

  it('weighs the heads as the device does: they sum to one', () => {
    // `HalfSpeed::weigh` at phase 0.75 with Smooth at half: the Hann window is
    // ½ there, so the cycle's head has ½ + ½ · ½ and the middle head ½ · ½.
    const picture = pictureOf(drawDisplay(display, params, { values: { ...rest, smooth: 0.5 } }))
    const heads = uprights(picture, accent, 2.5)
    expect(heads).toHaveLength(2)
    // The cycle's head, three eighths through; the middle head started at
    // the half and is half of a quarter behind.
    expect(heads[0].x).toBeCloseTo(xOf(0.375), 6)
    expect(heads[0].foot - heads[0].top).toBeCloseTo(2 * 18 * 0.75, 6)
    expect(heads[1].x).toBeCloseTo(xOf(0.625), 6)
    expect(heads[1].foot - heads[1].top).toBeCloseTo(2 * 18 * 0.25, 6)
    const total = heads.reduce((sum, head) => sum + (head.foot - head.top), 0)
    expect(total).toBeCloseTo(36, 6)
  })

  it('draws the fades at the joins: a raised cosine over Fade of the cycle', () => {
    const chop = played(rest)
    // At half speed a head gets through half of the cycle's sound: the rest is never played.
    expect(chop(0.25)).toBeCloseTo(1, 6)
    expect(chop(0.75)).toBeCloseTo(0, 6)
    // The first place drawn is 0.5 / 96 into the sound, which the head
    // reaches 1 / 96 into the cycle: ½ − ½ cos(π (1 / 96) / 0.15).
    expect(chop(0)).toBeCloseTo(0.5 - 0.5 * Math.cos((Math.PI * (1 / 96)) / 0.15), 6)
    expect(chop(0)).toBeCloseTo(0.01186, 4)
    // The same head goes on past the half as the last cycle's, fading out: the two make one.
    expect(chop(0) + chop(0.5)).toBeCloseTo(1, 6)
    expect(chop(0.5 * 1.15 + 0.01)).toBe(0)
  })

  it('with Smooth draws two windows a cycle, one for each head', () => {
    const smooth = played({ ...rest, smooth: 1 })
    const hann = (phase: number): number => 0.5 - 0.5 * Math.cos(2 * Math.PI * phase)
    // The cycle's head is full a quarter into the sound, the middle head three quarters.
    expect(smooth(0.25)).toBeCloseTo(hann((24.5 / 96) * 2), 6)
    expect(smooth(0.25)).toBeGreaterThan(0.99)
    expect(smooth(0.75)).toBeGreaterThan(0.99)
    expect(smooth(0.5)).toBeLessThan(0.01)
    expect(smooth(0)).toBeLessThan(0.01)
  })

  it('never fades faster than 4 ms, however short the cycle', () => {
    // A cycle of 50 ms with Fade at 0.01: the device makes it 4 / 50.
    const short = played({ ...rest, length: 50, fade: 0.01 })
    expect(short(0)).toBeCloseTo(0.5 - 0.5 * Math.cos((Math.PI * (1 / 96)) / 0.08), 6)
    const long = played({ ...rest, length: 1000, fade: 0.01 })
    expect(long(0)).toBe(1)
  })

  it('follows the device: the write head at its clock, the read head as far behind as it says', () => {
    // A cycle of 2 s read at half speed: the head is behind by half of the time gone.
    const phaseAt = (time: number): number => (0.1 + time / 2) % 1
    const picture = pictureOf(
      runDisplay(
        display,
        params,
        1,
        { values: { ...rest, length: 2000 }, signal: testSignal() },
        (time) => {
          const phase = phaseAt(time)
          return { meters: { phase, cycle: 2, cur: phase, prev: 1 + phase, mid: phase + 0.5 } }
        },
      ),
    )
    const now = phaseAt(29 / 30)
    const write = writeHead(picture)
    // Within two frames' travel of the reading (a frame is 1 / 60 of this cycle).
    expect(write.x).toBeGreaterThanOrEqual(xOf(now) - 0.01)
    expect(write.x).toBeLessThan(xOf(now + 2 / 60))
    const heads = uprights(picture, accent, 2.5)
    expect(heads).toHaveLength(1)
    // Behind by `cur` seconds of a 2 s cycle.
    expect(write.x - heads[0].x).toBeCloseTo((now / 2) * 87, 4)
  })

  it('takes a clock that does not move for a device at rest', () => {
    const picture = pictureOf(
      runDisplay(display, params, 1, {
        values: rest,
        signal: testSignal(),
        meters: { phase: 0.2, cycle: 1, cur: 0.1, prev: 0.6, mid: 0.35 },
      }),
    )
    expect(writeHead(picture).x).toBeCloseTo(xOf(0.75), 6)
  })

  it('draws no head while the device is switched off by its own Power', () => {
    // `half_speed.h`: with Power off the sound passes as it came and the cycle clock stands.
    const drawn = drawDisplay(display, params, { values: { ...rest, power: 1 } })
    const picture = pictureOf(drawn)
    expect(uprights(picture, accent, 2.5)).toHaveLength(0)
    expect(uprights(picture, ink, 1.5)).toHaveLength(0)
    expect(drawn.words()).toEqual(['Off'])
  })

  it('has the fade on a handle where the head has faded in', () => {
    const { handle } = handleOf('half-speed', 'fade', { values: rest })
    expect(handle.x).toBeCloseTo(xOf(0.5 * 0.15), 6)
    expect(handle.y).toBe(6)
    expect(handle.drag(xOf(0.5 * 0.4), 6).fade).toBeCloseTo(0.4, 6)
    expect(handle.drag(180, 6)).toEqual({ fade: 0.5 })
    expect(handle.drag(0, 6)).toEqual({ fade: 0.01 })
    expect(handle.drag(handle.x, 30)).toEqual({ fade: 0.15 })
    // At a quarter speed the same fade is over half as much of the sound.
    const slow = handleOf('half-speed', 'fade', { values: { ...rest, speed: 3 } }).handle
    expect(slow.x).toBeCloseTo(xOf(0.25 * 0.15), 6)
  })
})

// --- Frequency Shifter -------------------------------------------------------

describe('the frequency shifter display', () => {
  const { display, params } = deviceOf('freq-shifter')
  // 0 to 3000 Hz over 152 px from x 6; a partial of full level stands from y 35 up 22.2 px.
  const xOfHz = (hz: number): number => 6 + (hz / 3000) * 152
  const topOf = (level: number): number => 35 - level * 22.2
  const plain = { fine: 0, feedback: 0, mode: 0, width: 0 }
  const sent = (values: Record<string, number>, options: FrameOptions = {}): Picture =>
    pictureOf(drawDisplay(display, params, { ...options, values: { ...plain, ...values } }))

  it('draws the partials of a tone where they were: harmonics of 300 Hz', () => {
    const were = uprights(sent({ shift: 233 }), ink, 1.5)
    expect(were.map((mark) => mark.x)).toEqual([300, 600, 900, 1200, 1500, 1800].map(xOfHz))
    expect(were.every((mark) => mark.alpha === 0.5)).toBe(true)
  })

  it('sends every partial the same number of hertz, so they stop being harmonics', () => {
    const now = uprights(sent({ shift: 233 }), accent, 2.5)
    expect(now.map((mark) => mark.x)).toEqual([533, 833, 1133, 1433, 1733, 2033].map(xOfHz))
    expect(now.every((mark) => Math.abs(mark.top - topOf(1)) < 1e-9)).toBe(true)
    // Fine is added to Shift (`freq_shifter.h`).
    const fine = uprights(sent({ shift: 233, fine: 7.5 }), accent, 2.5)
    expect(fine[0].x).toBeCloseTo(xOfHz(540.5), 6)
    // Down: the same step the other way.
    const down = uprights(sent({ shift: 233, mode: 1 }), accent, 2.5)
    expect(down.map((mark) => mark.x)).toEqual([67, 367, 667, 967, 1267, 1567].map(xOfHz))
  })

  it('brings a partial sent under 0 Hz back up from it', () => {
    const down = uprights(sent({ shift: 400, mode: 1 }), accent, 2.5)
    // 300 − 400 = −100: heard at 100 Hz.
    expect(down[0].x).toBeCloseTo(xOfHz(100), 6)
    expect(down[1].x).toBeCloseTo(xOfHz(200), 6)
  })

  it('in Ring sends each partial both ways at half the power each', () => {
    const ring = uprights(sent({ shift: 100, mode: 3 }), accent, 2.5)
    expect(ring).toHaveLength(12)
    expect(ring[0].x).toBeCloseTo(xOfHz(200), 6)
    expect(ring[1].x).toBeCloseTo(xOfHz(400), 6)
    for (const mark of ring) expect(mark.top).toBeCloseTo(topOf(Math.SQRT1_2), 5)
  })

  it('draws what Feedback adds: shifted again, through the Tone filter', () => {
    // Shift 200 up, Feedback 0.5, Tone at 1 kHz with Q 0.6. The first partial
    // goes 300 → 500, and what goes round again is the 500 Hz through the
    // low pass: r = tan(π 500 / 48000) / tan(π 1000 / 48000) = 0.4995,
    // gain = 1 / √((1 − r²)² + (r / 0.6)²) = 0.892.
    const r = Math.tan((Math.PI * 500) / 48000) / Math.tan((Math.PI * 1000) / 48000)
    const through = 1 / Math.sqrt((1 - r * r) ** 2 + (r / 0.6) ** 2)
    expect(through).toBeCloseTo(0.892, 3)
    const repeats = uprights(sent({ shift: 200, feedback: 0.5, tone: 1000 }), accent, 1)
    const second = at(repeats, xOfHz(700))
    expect(second.top).toBeCloseTo(topOf(0.5 * through), 6)
    // With the Tone wide open a pass is Feedback of the last: 0.5, 0.25, 0.125, 0.0625.
    const open = uprights(sent({ shift: 100, feedback: 0.5, tone: 16000 }), accent, 1)
    expect(at(open, xOfHz(500)).top).toBeCloseTo(topOf(0.5), 2)
    expect(at(open, xOfHz(600)).top).toBeCloseTo(topOf(0.25), 2)
    expect(at(open, xOfHz(700)).top).toBeCloseTo(topOf(0.125), 2)
    expect(uprights(sent({ shift: 100 }), accent, 1)).toHaveLength(0)
  })

  it('reads the shift from the device while it runs, the LFO in it', () => {
    const running = drawDisplay(display, params, {
      values: { ...plain, shift: 0 },
      meters: { shift: 5.5, carrier: 0.25 },
      signal: testSignal(),
    })
    expect(running.words()).toContain('+5.5 Hz')
    expect(uprights(pictureOf(running), accent, 2.5)[0].x).toBeCloseTo(xOfHz(305.5), 6)
    const still = drawDisplay(display, params, { values: { ...plain, shift: -233 } })
    expect(still.words()).toContain('−233 Hz')
  })

  it('turns the dial with the carrier, the right side a quarter turn off at full Width', () => {
    const dial = (width: number, carrier: number): number[] =>
      pictureOf(
        drawDisplay(display, params, {
          values: { ...plain, shift: 0, width },
          meters: { shift: 0, carrier },
          signal: testSignal(),
        }),
      )
        .lines.filter((line) => line.colour === accent && line.arcs.length === 1)
        .map((line) => line.arcs[0][3])
    // With no shift the mark has no length. Right is drawn first, then left; up is −¼ turn.
    expect(dial(0, 0)).toEqual([-Math.PI / 2, -Math.PI / 2])
    const [right, left] = dial(1, 0.5)
    expect(left).toBeCloseTo(Math.PI / 2, 9)
    // `freq_shifter.h`: the right carrier runs Width × ¼ of a cycle ahead.
    expect(right - left).toBeCloseTo(Math.PI / 2, 9)
  })

  it('has the shift on a handle: a partial taken along the scale', () => {
    const { handle } = handleOf('freq-shifter', 'shift', { values: { ...plain, shift: 233 } })
    expect(handle.x).toBeCloseTo(xOfHz(1433), 6)
    expect(handle.y).toBeCloseTo(topOf(1), 6)
    expect(handle.drag(xOfHz(1500), 0)).toEqual({ shift: 300 })
    expect(handle.drag(xOfHz(700), 0)).toEqual({ shift: -500 })
    expect(handle.drag(xOfHz(2900), 0)).toEqual({ shift: 1000 })
    expect(handle.drag(handle.x, 0)).toEqual({ shift: 233 })
    expect(handle.wheel?.(1)).toEqual({ fine: 0.1 })
    expect(handle.reset?.()).toEqual({ shift: 0 })
    // Shifting down, the same partial further right is a shift further down the other way.
    const down = handleOf('freq-shifter', 'shift', { values: { ...plain, shift: 233, mode: 1 } })
    expect(down.handle.x).toBeCloseTo(xOfHz(967), 6)
    expect(down.handle.drag(xOfHz(900), 0)).toEqual({ shift: 300 })
  })
})

// --- Lattice -----------------------------------------------------------------

describe('the lattice display', () => {
  const { display, params } = deviceOf('lattice')
  // A period is 110 px across from x 11; with a period of an octave there are
  // six rows of 83 / 6 px, the lowest the octave from 2400 cents, its middle at y 87 − half a row.
  const row = 83 / 6
  const xOfCents = (within: number, period = 1200): number => 11 + (within / period) * 110
  const yOfRow = (n: number, height = row): number => 87 - (n + 0.5) * height
  const onLine = (value: number): number => Math.round(value) + 0.5
  const off = { v1Role: 0, v2Role: 0, v3Role: 0, v4Role: 0 }
  const major = { root: 0, scale: 0, center: 62, feedbackPath: 0 }
  /** The voices: round marks in the second colour, whether filled or in outline. */
  const voices = (picture: Picture): [number, number][] => [
    ...picture.areas
      .filter((area) => area.colour === accent && area.arcs.length === 1 && area.alpha === 1)
      .map((area): [number, number] => [area.arcs[0][0], area.arcs[0][1]]),
    ...picture.lines
      .filter(
        (line) =>
          line.colour === accent && line.arcs.length === 1 && line.width === 1 && line.alpha === 1,
      )
      .map((line): [number, number] => [line.arcs[0][0], line.arcs[0][1]]),
  ]
  const expectAt = (found: [number, number][], x: number, y: number): void => {
    const near = found.some(([fx, fy]) => Math.abs(fx - x) < 0.01 && Math.abs(fy - y) < 0.01)
    if (!near)
      throw new Error(
        `nothing at ${x.toFixed(2)}, ${y.toFixed(2)}: ${found.map(([fx, fy]) => `${fx.toFixed(2)},${fy.toFixed(2)}`).join(' ')}`,
      )
  }
  /** The note played: the square in the ink. */
  const square = (picture: Picture): [number, number] => {
    const box = picture.outlines.find((outline) => outline.w === 6 && outline.h === 6)
    if (!box) throw new Error('no note')
    return [box.x + 3, box.y + 3]
  }

  it('draws the steps of the scale across a period and a row for every period', () => {
    const picture = pictureOf(drawDisplay(display, params, { values: { ...major, ...off } }))
    const nodes = picture.rects.filter((rect) => rect.w === 3 && rect.h === 3)
    expect(nodes).toHaveLength(6 * 7)
    // C major: 0 200 400 500 700 900 1100 cents.
    const columns = [...new Set(nodes.map((node) => node.x + 1))].sort((a, b) => a - b)
    expect(columns).toEqual([0, 200, 400, 500, 700, 900, 1100].map((c) => Math.round(xOfCents(c))))
    expect(drawDisplay(display, params, { values: { ...major, ...off } }).words()).toEqual([
      'C',
      'D',
      'E',
      'F',
      'G',
      'A',
      'B',
    ])
    // The root is the left edge whatever it is: D natural minor starts on D.
    const minor = drawDisplay(display, params, { values: { ...major, ...off, root: 2, scale: 1 } })
    expect(minor.words()[0]).toBe('D')
    expect(minor.words()).toContain('A♯')
  })

  it('spaces a custom scale by its cents and rows by its period', () => {
    const custom: Record<string, number> = { ...major, ...off, scale: 14, customPeriod: 1200 }
    for (let i = 1; i <= 12; i++) custom[`customOn${i}`] = 0
    // A just triad: 1/1, 5/4 (386.3 cents), 3/2 (702 cents).
    Object.assign(custom, { customOn1: 1, customCents1: 0, customOn2: 1, customCents2: 702 })
    Object.assign(custom, { customOn3: 1, customCents3: 386.3 })
    const nodes = pictureOf(drawDisplay(display, params, { values: custom })).rects.filter(
      (rect) => rect.w === 3 && rect.h === 3,
    )
    expect(nodes).toHaveLength(6 * 3)
    expect([...new Set(nodes.map((node) => node.x + 1))].sort((a, b) => a - b)).toEqual([
      11,
      Math.round(xOfCents(386.3)),
      Math.round(xOfCents(702)),
    ])
    // A period of 1902 cents: four rows hold the notes from 1902 to 9510 cents.
    const wide = pictureOf(
      drawDisplay(display, params, { values: { ...custom, customPeriod: 1902 } }),
    ).rects.filter((rect) => rect.w === 3 && rect.h === 3)
    expect(wide).toHaveLength(4 * 3)
    expect(Math.max(...wide.map((node) => node.x + 1))).toBe(Math.round(xOfCents(702, 1902)))
  })

  it('sends each voice where its role sends it (`Voicing.h`)', () => {
    // The Center Note D5 (6200 cents) is step 36 of C major counted from C0.
    // At rest the note drawn is two steps over it: F5, step 38.
    const picture = pictureOf(
      drawDisplay(display, params, {
        values: {
          ...major,
          v1Role: 1,
          v1Degrees: 2,
          v2Role: 2,
          v2Degrees: 0,
          v3Role: 5,
          v3Degrees: 0,
          v4Role: 3,
          v4Degrees: 0,
        },
      }),
    )
    // The square sits on the lines of its step as the kit draws them: on the half pixel.
    expect(square(picture)).toEqual([onLine(xOfCents(500)), onLine(yOfRow(3))])
    const found = voices(picture)
    expect(found).toHaveLength(4)
    // Interval +2: step 40, A5.
    expectAt(found, xOfCents(900), yOfRow(3))
    // Mirror: as far under the centre as the note is over it, step 34, B4.
    expectAt(found, xOfCents(1100), yOfRow(2))
    // Octaflip: a note over the centre goes down a period, step 31, F4.
    expectAt(found, xOfCents(500), yOfRow(2))
    // Middle: half way between the note and the centre, step 37, E5.
    expectAt(found, xOfCents(400), yOfRow(3))
  })

  it('knows the other roles too', () => {
    const picture = pictureOf(
      drawDisplay(display, params, {
        values: { ...major, ...off, v1Role: 4, v1Degrees: 0, v2Role: 6, v2Degrees: -3 },
      }),
    )
    const found = voices(picture)
    // Mirror Middle: the middle (step 37) mirrored about the centre, step 35, C5.
    expectAt(found, xOfCents(0), yOfRow(3))
    // Center with −3 steps: step 33, A4.
    expectAt(found, xOfCents(900), yOfRow(2))
  })

  it('draws the note the device tracks and its voices where the device has them', () => {
    // A3 (MIDI 57) with voice 1 a fifth up, as the device reports it: 700 cents.
    const options = {
      values: { ...major, ...off, v1Role: 1, v1Degrees: 4 },
      meters: { note: 57, voiced: 1, shift1: 700, shift2: 0, shift3: 0, shift4: 0 },
    }
    const picture = pictureOf(drawDisplay(display, params, options))
    expect(square(picture)).toEqual([onLine(xOfCents(900)), onLine(yOfRow(2))])
    // 5700 + 700 = 6400 cents: E in the next row up, and filled now it is real.
    const filled = picture.areas.filter((area) => area.colour === accent && area.arcs.length === 1)
    expect(filled).toHaveLength(1)
    expect(filled[0].arcs[0][0]).toBeCloseTo(xOfCents(400), 6)
    expect(filled[0].arcs[0][1]).toBeCloseTo(yOfRow(3), 6)
    // Half way through a glide the mark is between the steps: at 350 cents up, 50 cents over C.
    const gliding = pictureOf(
      drawDisplay(display, params, { ...options, meters: { ...options.meters, shift1: 350 } }),
    )
    expectAt(voices(gliding), xOfCents(50), yOfRow(3))
  })

  it('rings a voice for its echoes and trails it for a cascade', () => {
    const values = { ...major, ...off, v1Role: 1, v1Degrees: 2, v1Level: -6, v1Feedback: 50 }
    const rings = (delay: number): number[] =>
      pictureOf(drawDisplay(display, params, { values: { ...values, v1Delay: delay } }))
        .lines.filter((line) => line.colour === accent && line.arcs.length === 1 && line.alpha < 1)
        .map((line) => line.arcs[0][2])
    // −6 dB is two thirds up the scale of sizes: radius 2 + 2.2 × ⅔. Feedback
    // 50 %: repeats at 0.5, 0.25, 0.125, each a ring 2.5 px further out.
    const radius = 2 + 2.2 * (24 / 36)
    expect(rings(100)).toHaveLength(3)
    expect(rings(100)[2]).toBeCloseTo(radius + 7.5, 6)
    // `VoiceDelay.h`: Feedback fades in over the first 5 ms of Delay. At 2.5 ms it is half: one ring.
    expect(rings(2.5)).toHaveLength(1)
    expect(rings(0)).toHaveLength(0)
    // Cascade: every repeat is shifted again. F5 to A5 is 400 cents: 7300, 7700, 8100 cents.
    const trail = pictureOf(
      drawDisplay(display, params, { values: { ...values, v1Delay: 100, feedbackPath: 1 } }),
    )
      .areas.filter((area) => area.colour === accent && area.arcs.length === 1)
      .map((area): [number, number] => [area.arcs[0][0], area.arcs[0][1]])
    expect(trail).toHaveLength(3)
    expectAt(trail, xOfCents(100), yOfRow(4))
    expectAt(trail, xOfCents(500), yOfRow(4))
    expectAt(trail, xOfCents(900), yOfRow(4))
  })

  it('has the Center Note on a handle that goes from step to step', () => {
    const { handle } = handleOf('lattice', 'center', { values: major })
    expect(handle.x).toBeCloseTo(xOfCents(200), 6)
    expect(handle.y).toBeCloseTo(yOfRow(3), 6)
    // To G in the same row: MIDI 67.
    expect(handle.drag(xOfCents(700), yOfRow(3))).toEqual({ center: 67 })
    // A row down and a little off the step: E4, MIDI 52.
    expect(handle.drag(xOfCents(400) + 3, yOfRow(2) - 2)).toEqual({ center: 52 })
    expect(handle.drag(handle.x + 2, handle.y)).toEqual({ center: 62 })
    // The ends of the knob: 36 and 84.
    expect(handle.drag(xOfCents(1100), yOfRow(5))).toEqual({ center: 84 })
    expect(handle.drag(xOfCents(0), yOfRow(0))).toEqual({ center: 36 })
    // A Center Note that is not in the scale stands on the nearest step, the lower on a tie.
    const between = handleOf('lattice', 'center', { values: { ...major, center: 61 } }).handle
    expect(between.x).toBeCloseTo(xOfCents(0), 6)
    expect(between.drag(between.x, between.y)).toEqual({ center: 61 })
  })
})

// --- Spectral Drifter --------------------------------------------------------

describe('the spectral drifter display', () => {
  const { display, params } = deviceOf('spectral-drifter')
  // The ruler: −12 to +12 semitones over 162 px from x 11.
  const xOfSt = (st: number): number => 11 + ((st + 12) / 24) * 162
  const topOf = (share: number): number => 35 - share * 27
  const manual = { ageMode: 1, direction: 0, interval: 1, bloom: 0.5, decay: 5 }
  const grains = (values: Record<string, number>, options: FrameOptions = {}): Upright[] =>
    uprights(
      pictureOf(drawDisplay(display, params, { ...options, values: { ...manual, ...values } })),
      accent,
      2.5,
    )

  it('plays a fresh sound a little off and an old one far off, by the formula of the device', () => {
    // Bloom ½ towards an octave up. Fresh: intensity ½ × 0.3 = 0.15, speed
    // 1 + (2 − 1) × 0.15 = 1.15, 2.42 semitones. Old: intensity ½, speed 1.5, 7.02 semitones.
    const fresh = grains({ age: 0 })
    expect(fresh).toHaveLength(1)
    expect(fresh[0].x).toBeCloseTo(xOfSt(12 * Math.log2(1.15)), 6)
    expect(12 * Math.log2(1.15)).toBeCloseTo(2.42, 2)
    expect(fresh[0].top).toBe(8)
    const old = grains({ age: 1 })
    expect(old[0].x).toBeCloseTo(xOfSt(12 * Math.log2(1.5)), 6)
    expect(12 * Math.log2(1.5)).toBeCloseTo(7.02, 2)
    // Half way: 0.3 + 0.7 × ½ = 0.65 of Bloom.
    expect(grains({ age: 0.5 })[0].x).toBeCloseTo(xOfSt(12 * Math.log2(1.325)), 6)
  })

  it('reaches the interval itself only at full Bloom on an old sound', () => {
    expect(grains({ bloom: 1, age: 1 })[0].x).toBeCloseTo(xOfSt(12), 6)
    expect(grains({ bloom: 1, age: 1, interval: 0 })[0].x).toBeCloseTo(xOfSt(7), 6)
    expect(grains({ bloom: 1, age: 1, direction: 1 })[0].x).toBeCloseTo(xOfSt(-12), 6)
    expect(grains({ bloom: 0, age: 1 })[0].x).toBeCloseTo(xOfSt(0), 6)
    // The whole interval is marked with a dashed line.
    const dashed = pictureOf(
      drawDisplay(display, params, { values: { ...manual, age: 0, interval: 0 } }),
    ).lines.filter((line) => line.dashed)
    expect(dashed).toHaveLength(1)
    expect(Math.abs(dashed[0].points[0][0] - xOfSt(7))).toBeLessThanOrEqual(0.5)
  })

  it('groups the eight grains by where they are sent, each mark as tall as its share', () => {
    // Alternate: even grains an octave, odd ones a fifth.
    const both = grains({ bloom: 1, age: 1, interval: 2 })
    expect(both.map((mark) => mark.x)).toEqual([xOfSt(7), xOfSt(12)])
    expect(both.map((mark) => mark.top)).toEqual([topOf(0.5), topOf(0.5)])
    // Scatter: every third grain (0, 3, 6) goes the other way.
    const scatter = grains({ bloom: 1, age: 1, interval: 1, direction: 2 })
    expect(scatter.map((mark) => mark.x)).toEqual([xOfSt(-12), xOfSt(12)])
    expect(scatter.map((mark) => mark.top)).toEqual([topOf(3 / 8), topOf(5 / 8)])
  })

  it('in Atonal drifts as far as the intensity itself reaches', () => {
    // `calculatePitchRatio`: the target is 12 × intensity semitones, and the
    // speed is blended towards it by the intensity again. Bloom ½, old:
    // target 6 semitones (√2), speed 1 + (√2 − 1) × ½ = 1.207, 3.26 semitones.
    const atonal = grains({ interval: 3, age: 1 })
    expect(atonal[0].x).toBeCloseTo(xOfSt(12 * Math.log2(1 + (Math.SQRT2 - 1) / 2)), 6)
    expect(12 * Math.log2(1 + (Math.SQRT2 - 1) / 2)).toBeCloseTo(3.26, 2)
    expect(grains({ interval: 3, age: 1, bloom: 1 })[0].x).toBeCloseTo(xOfSt(12), 6)
  })

  it('counts the age of the sound as the device does: a second a second, up to twice Decay', () => {
    // Decay 2 s: the oldest a sound gets is 4 s. The test tone is silent
    // (under 0.0001) for 16 of its 2048 samples, where the age falls instead.
    const share = 1 - 16 / 2048
    const fall = 1 / (44100 * -Math.log(0.9999))
    let age = 0
    for (let n = 1; n < 60; n++)
      age = Math.min(4, age + share / 30) * Math.exp(-(1 - share) / 30 / fall)
    expect(age).toBeGreaterThan(1.8)
    expect(age).toBeLessThan(2)
    const drawn = runDisplay(display, params, 2, {
      values: { ...manual, ageMode: 0, bloom: 1, decay: 2 },
      signal: testSignal(),
    })
    const mark = uprights(pictureOf(drawn), accent, 2.5)[0]
    expect(mark.x).toBeCloseTo(xOfSt(12 * Math.log2(1 + 0.3 + 0.7 * (age / 4))), 4)
    // In silence the sound is fresh again.
    const silent = drawDisplay(display, params, {
      values: { ...manual, ageMode: 0, bloom: 1, decay: 2 },
    })
    expect(uprights(pictureOf(silent), accent, 2.5)[0].x).toBeCloseTo(xOfSt(12 * Math.log2(1.3)), 6)
  })
})
