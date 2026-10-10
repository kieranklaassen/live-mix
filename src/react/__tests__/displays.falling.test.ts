// Falling's display against the device it shows. The bend, the window and the
// rate are checked against `cpp/devices/falling/falling.h` (its constants are
// read from the header itself, its formulas are written out here again), the
// two handles against the parameters they set, and the pieces the display
// draws against the readings the device gives of them.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { INK as SHADE, PLAIN_COLOURS } from '../components/display-kit'
import {
  FALLING_FACES,
  fallingAttack,
  fallingBend,
  fallingLag,
  fallingLayout,
  fallingOther,
  fallingPer,
  fallingRate,
  fallingRise,
  fallingWindow,
  fallingY,
} from '../components/displays/falling'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import {
  drawDisplay,
  metersOf,
  runDisplay,
  stockDescriptors,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('falling')
if (!descriptor) throw new Error('falling is not a stock device')
const { display } = FALLING_FACES.falling
const params = descriptor.params
const ACCENT = PLAIN_COLOURS.accent
const INK = PLAIN_COLOURS.ink
const PLATE = PLAIN_COLOURS.plate

/** A constant of the device, as its header has it. */
const header = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../cpp/devices/falling/falling.h'),
  'utf8',
)
function constant(name: string): number {
  const found = new RegExp(`static constexpr (?:float|int) ${name} = ([-0-9.e]+)f?;`).exec(header)
  if (!found) throw new Error(`falling.h has no ${name}`)
  return Number(found[1])
}

/** The two sizes a window has to read at: beside two columns of knobs, and wider. */
const SIZES = [
  { width: 128, height: 100 },
  { width: 204, height: 100 },
] as const
const SIZE = SIZES[0]

/** What the device reads when it is asleep: no clock, no piece. */
const ASLEEP = { ...metersOf(descriptor.meters), clock: -1, newStart: -1, oldStart: -1 }

interface Mark {
  kind: 'fill' | 'stroke' | 'words'
  colour: string
  alpha: number
  dashed: boolean
  points: [number, number][]
  /** The radius, for a mark that is one round dot. */
  radius?: number
  words?: string
}

/** Everything a drawing put down, each mark with its colour and where it lies. */
function marksOf(drawn: RecordingContext): Mark[] {
  const marks: Mark[] = []
  let fill = ''
  let stroke = ''
  let alpha = 1
  let dashed = false
  let path: [number, number][] = []
  let radius: number | undefined
  for (const { name, args } of drawn.calls) {
    const n = args as number[]
    if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'set strokeStyle') stroke = String(args[0])
    else if (name === 'set globalAlpha') alpha = Number(args[0])
    else if (name === 'setLineDash') dashed = (args[0] as number[]).length > 0
    else if (name === 'beginPath') {
      path = []
      radius = undefined
    } else if (name === 'moveTo' || name === 'lineTo') path.push([n[0], n[1]])
    else if (name === 'arc') {
      path.push([n[0], n[1]])
      radius = n[2]
    } else if (name === 'fill')
      marks.push({ kind: 'fill', colour: fill, alpha, dashed, points: path, radius })
    else if (name === 'stroke')
      marks.push({ kind: 'stroke', colour: stroke, alpha, dashed, points: path, radius })
    else if (name === 'fillText')
      marks.push({
        kind: 'words',
        colour: fill,
        alpha,
        dashed,
        points: [[n[1], n[2]]],
        words: String(args[0]),
      })
  }
  return marks
}

const dots = (marks: Mark[], colour: string): Mark[] =>
  marks.filter((m) => m.kind === 'fill' && m.colour === colour && m.radius !== undefined)
const bands = (marks: Mark[], colour: string): Mark[] =>
  marks.filter((m) => m.kind === 'fill' && m.colour === colour && m.points.length > 4)
/** The line of the piece that would start now: the one stroke of many points. */
function modelLine(marks: Mark[]): Mark {
  const found = marks.find((m) => m.kind === 'stroke' && m.points.length > 4)
  if (!found) throw new Error('no model stroke was drawn')
  return found
}
/** The upright line that is now. */
function nowLine(marks: Mark[], lay: ReturnType<typeof fallingLayout>): Mark {
  const found = marks.find(
    (m) =>
      m.kind === 'stroke' &&
      m.points.length === 2 &&
      m.points[0][0] === m.points[1][0] &&
      Math.abs(m.points[0][0] - lay.now) <= 0.5,
  )
  if (!found) throw new Error('no now line was drawn')
  return found
}

function handles(
  values: Record<string, number> = {},
  size: { width: number; height: number } = SIZE,
): Record<'fall' | 'curve', DisplayHandle> {
  const found = display.handles?.(viewOf(display, params, { values, ...size })) ?? []
  const by = Object.fromEntries(found.map((h) => [h.key, h]))
  return { fall: by.fall, curve: by.curve }
}

/** How wide a piece of that Size is drawn: a quarter of the room right of now at the shortest, all of it at the longest. */
function wideOf(sizeMs: number, size: { width: number; height: number } = SIZE): number {
  const at = Math.log(sizeMs / 60) / Math.log(3000 / 60)
  return fallingLayout(size).reach * (0.25 + 0.75 * at)
}

describe("Falling's display: the device's own formulas", () => {
  it('bends as Falling::bend does', () => {
    // falling.h: late = p + |c| (p^4 - p); for a Curve under zero the same, turned round.
    const bend = (phase: number, curve: number): number => {
      const amount = Math.abs(curve)
      const p = curve < 0 ? 1 - phase : phase
      const late = p + amount * (p ** 4 - p)
      return curve < 0 ? 1 - late : late
    }
    for (const curve of [-1, -0.6, -0.3, 0, 0.2, 0.5, 1]) {
      expect(fallingBend(0, curve)).toBeCloseTo(0, 12)
      expect(fallingBend(1, curve)).toBeCloseTo(1, 12)
      // Half way: 0.5 - 0.4375 x Curve, which the Curve handle is solved from.
      expect(fallingBend(0.5, curve)).toBeCloseTo(0.5 - 0.4375 * curve, 12)
      let before = 0
      for (let i = 1; i <= 50; i++) {
        const phase = i / 50
        expect(fallingBend(phase, curve)).toBeCloseTo(bend(phase, curve), 12)
        // A piece only ever goes one way.
        expect(fallingBend(phase, curve)).toBeGreaterThanOrEqual(before)
        before = fallingBend(phase, curve)
      }
    }
    // A straight slide in the middle, late above it, at once below it.
    expect(fallingBend(0.25, 0)).toBeCloseTo(0.25, 12)
    expect(fallingBend(0.25, 1)).toBeLessThan(0.01)
    expect(fallingBend(0.25, -1)).toBeGreaterThan(0.68)
  })

  it('opens the window as Falling::window and attack_share do', () => {
    const quick = constant('kQuickShare')
    const least = constant('kMinAttackSeconds')
    expect(fallingAttack(0, 0.7)).toBeCloseTo(0.5, 12)
    expect(fallingAttack(1, 0.7)).toBeCloseTo(quick, 12)
    expect(fallingAttack(0.5, 0.7)).toBeCloseTo((0.5 + quick) / 2, 12)
    // A short piece's attack is never under the least time, and never over half the piece.
    expect(fallingAttack(1, 0.06)).toBeCloseTo(least / 0.06, 12)
    expect(fallingAttack(1, 0.004)).toBe(0.5)
    for (const attack of [0.04, 0.2, 0.5]) {
      expect(fallingWindow(0, attack)).toBe(0)
      expect(fallingWindow(1, attack)).toBe(0)
      expect(fallingWindow(attack, attack)).toBeCloseTo(1, 12)
      expect(fallingWindow(attack / 2, attack)).toBeCloseTo(0.5, 12)
      expect(fallingWindow(attack + (1 - attack) / 2, attack)).toBeCloseTo(0.5, 12)
      // Its mean square is the power the device levels the cloud by, whatever the Shape.
      let sum = 0
      const steps = 4000
      for (let i = 0; i < steps; i++) sum += fallingWindow((i + 0.5) / steps, attack) ** 2
      expect(sum / steps).toBeCloseTo(constant('kWindowPower'), 5)
    }
  })

  it('caps the rate and throws the pieces as the device does', () => {
    const most = constant('kMaxOverlap')
    expect(fallingRate(5, 700)).toBe(5)
    expect(fallingRate(40, 3000)).toBeCloseTo(most / 3, 12)
    expect(fallingRate(1e6, 1000)).toBe(most)
    // spawn(): fall x (1 - reach x Vary x draw), the draw at its most.
    const reach = constant('kVaryReach')
    expect(fallingOther(-12, 0)).toBe(-12)
    expect(fallingOther(-12, 1)).toBeCloseTo(-12 * (1 - reach), 12)
    expect(fallingOther(-12, 0.5)).toBeCloseTo(-12 * (1 - reach / 2), 12)
  })

  it('knows how far a piece has dropped behind the sound it reads', () => {
    // It reads at 2^(fall / 12 x bend) of the speed the sound is written at.
    const lag = (phase: number, fall: number, curve: number, length: number): number => {
      const steps = 4000
      let sum = 0
      for (let i = 0; i < steps; i++)
        sum += 1 - 2 ** ((fall / 12) * fallingBend((phase * (i + 0.5)) / steps, curve))
      return (length * phase * sum) / steps
    }
    expect(fallingLag(0.7, 0, 0.5, 2)).toBe(0)
    for (const [phase, fall, curve, length] of [
      [1, -12, 0, 1],
      [0.5, -24, 1, 3],
      [1, 12, -1, 0.5],
      [0.3, 7, 0.5, 0.7],
    ]) {
      const want = lag(phase, fall, curve, length)
      expect(Math.abs(fallingLag(phase, fall, curve, length) - want)).toBeLessThan(
        0.01 * length + 0.02 * Math.abs(want),
      )
    }
    // Sinking falls behind, rising catches up.
    expect(fallingLag(1, -12, 0, 1)).toBeGreaterThan(0.2)
    expect(fallingLag(1, 12, 0, 1)).toBeLessThan(-0.3)
  })
})

describe("Falling's display: the scale", () => {
  it('gives every semitone of Fall a pixel of its own, and a small Fall room to be seen', () => {
    expect(fallingRise(0)).toBe(0)
    expect(fallingRise(1)).toBeCloseTo(1, 12)
    for (const size of SIZES) {
      const half = fallingLayout(size).room / 2
      for (let semitones = 0; semitones < 24; semitones++) {
        const step = (fallingRise((semitones + 1) / 24) - fallingRise(semitones / 24)) * half
        expect(step, `${semitones} to ${semitones + 1}`).toBeGreaterThanOrEqual(1)
      }
      // A sigh of half a semitone is a few pixels tall, end to end.
      expect(2 * fallingRise(0.5 / 24) * half).toBeGreaterThan(5)
    }
  })

  it('stands the level line and the end of a piece either side of the middle', () => {
    for (const size of SIZES) {
      const lay = fallingLayout(size)
      for (let fall = -24; fall <= 24; fall += 1) {
        for (const vary of [0, 0.2, 0.6, 0.8, 1]) {
          const zero = fallingY(lay, 0, fall, vary)
          const end = fallingY(lay, fall, fall, vary)
          // The end is where its handle is read back from: off the middle by the rise.
          const off = (fall < 0 ? 1 : -1) * fallingRise(Math.abs(fall) / 24) * (lay.room / 2)
          expect(end).toBeCloseTo(lay.mid + off, 9)
          // A piece that sinks runs down the display, one that rises runs up it.
          if (fall < 0) expect(end).toBeGreaterThan(zero)
          if (fall > 0) expect(end).toBeLessThan(zero)
          // Everything the pieces can do is inside the box: the furthest throw too.
          const far = fallingY(lay, fallingOther(fall, vary), fall, vary)
          for (const y of [zero, end, far]) {
            expect(y).toBeGreaterThanOrEqual(lay.box.y + 4.99)
            expect(y).toBeLessThanOrEqual(lay.box.y + lay.box.h - 4.99)
          }
          expect(fallingPer(lay, fall, vary) * Math.abs(fall)).toBeCloseTo(Math.abs(end - zero), 9)
        }
      }
    }
  })

  it('writes the scale in semitones from the pitch a piece is caught at', () => {
    const words = (values: Record<string, number>): string[] =>
      drawDisplay(display, params, { values, meters: ASLEEP }).words()
    expect(words({})).toEqual(expect.arrayContaining(['0', '−3', '−6']))
    expect(words({ fall: -24 })).toEqual(expect.arrayContaining(['0', '−12', '−24']))
    expect(words({ fall: 12 })).toEqual(expect.arrayContaining(['0', '+6', '+12']))
    expect(words({ fall: -0.6 })).toEqual(expect.arrayContaining(['0', '−1', '+1']))
    // Each number stands on its line, and the lines are those semitones.
    const lay = fallingLayout(SIZE)
    const marks = marksOf(drawDisplay(display, params, { meters: ASLEEP }))
    for (const mark of marks.filter((m) => m.kind === 'words' && m.words !== '0')) {
      const semitones = Number(mark.words?.replace('−', '-'))
      expect(mark.points[0][1] - 3).toBeCloseTo(fallingY(lay, semitones, -7, 0.2), 9)
    }
  })

  it('numbers every line it draws, the one at the top and the one at the foot too', () => {
    // The line a piece ends on at the top of the knob reads as the one at its foot does.
    const words = (values: Record<string, number>): string[] =>
      drawDisplay(display, params, { values, meters: ASLEEP }).words()
    expect(words({ fall: 24 })).toEqual(expect.arrayContaining(['0', '+12', '+24']))
    expect(words({ fall: -24 })).toEqual(expect.arrayContaining(['0', '−12', '−24']))
    // As low as a strip, the scale still says how far a line is from the level line.
    const strip = { width: 224, height: 48 }
    expect(drawDisplay(display, params, { meters: ASLEEP, ...strip }).words()).toEqual(['0', '−12'])
    for (const size of [...SIZES, strip]) {
      const lay = fallingLayout(size)
      const foot = lay.box.y + lay.box.h
      for (let fall = -24; fall <= 24; fall += 1) {
        for (const vary of [0, 0.2, 1]) {
          const marks = marksOf(
            drawDisplay(display, params, { values: { fall, vary }, meters: ASLEEP, ...size }),
          )
          // The lines of the scale: level, as wide as the box, as faint as a grid.
          const lines = marks.filter(
            (m) =>
              m.kind === 'stroke' &&
              m.alpha === SHADE.grid &&
              m.points.length === 2 &&
              m.points[0][1] === m.points[1][1] &&
              m.points[1][0] - m.points[0][0] === lay.box.w,
          )
          const numbers = marks.filter((m) => m.kind === 'words' && m.words !== '0')
          expect(numbers.length, `fall ${fall}, vary ${vary}, ${size.height} high`).toBe(
            lines.length,
          )
          for (const number of numbers) {
            const semitones = Number(number.words?.replace('−', '-'))
            const y = fallingY(lay, semitones, fall, vary)
            // It has a line, it stands within a few pixels of it, and its patch is inside the box.
            expect(lines.some((line) => Math.abs(line.points[0][1] - y) <= 0.5)).toBe(true)
            const baseline = number.points[0][1]
            expect(Math.abs(baseline - 3 - y)).toBeLessThanOrEqual(4)
            expect(baseline - 8).toBeGreaterThanOrEqual(lay.box.y)
            expect(baseline + 2).toBeLessThanOrEqual(foot)
          }
          // No two numbers stand on one another.
          const rows = [...numbers.map((m) => m.points[0][1]), fallingY(lay, 0, fall, vary) + 3]
          rows.sort((a, b) => a - b)
          for (let i = 1; i < rows.length; i++)
            expect(rows[i] - rows[i - 1], `fall ${fall}, vary ${vary}`).toBeGreaterThanOrEqual(10)
        }
      }
    }
  })
})

describe("Falling's display: the piece that would start now", () => {
  it('draws the bend of the settings from the level line to the end', () => {
    for (const size of SIZES) {
      for (const values of [
        {},
        { fall: 12, curve: -1, size: 3000 },
        { fall: -24, curve: 1, size: 60, shape: 1 },
        { fall: -0.6, curve: 0, vary: 1 },
      ] as Record<string, number>[]) {
        const lay = fallingLayout(size)
        const fall = values.fall ?? -7
        const curve = values.curve ?? 0.5
        const vary = values.vary ?? 0.2
        const wide = wideOf(values.size ?? 700, size)
        const zero = fallingY(lay, 0, fall, vary)
        const end = fallingY(lay, fall, fall, vary)
        const marks = marksOf(drawDisplay(display, params, { values, meters: ASLEEP, ...size }))
        const line = modelLine(marks)
        expect(line.colour).toBe(INK)
        expect(line.dashed).toBe(false)
        expect(line.points[0][0]).toBeCloseTo(lay.now, 9)
        expect(line.points[0][1]).toBeCloseTo(zero, 9)
        expect(line.points.at(-1)?.[0]).toBeCloseTo(lay.now + wide, 9)
        expect(line.points.at(-1)?.[1]).toBeCloseTo(end, 9)
        for (const [x, y] of line.points) {
          const phase = (x - lay.now) / wide
          expect(y).toBeCloseTo(zero + (end - zero) * fallingBend(phase, curve), 9)
          expect(x).toBeLessThanOrEqual(size.width - 4)
        }
        // The longest piece ends with room for its ring inside the display.
        expect(lay.now + lay.reach + 3).toBeLessThanOrEqual(size.width - 4)
      }
    }
  })

  it('is as thick as the window is open, thickest where the Shape puts the peak', () => {
    for (const shape of [0, 0.3, 1]) {
      const lay = fallingLayout(SIZE)
      const attack = fallingAttack(shape, 0.7)
      const marks = marksOf(drawDisplay(display, params, { values: { shape }, meters: ASLEEP }))
      // The band: the first long ink fill after the fan is the model's own.
      const band = bands(marks, INK).find((m) => m.alpha !== SHADE.grid)
      if (!band) throw new Error('no band')
      const count = band.points.length / 2
      const upper = band.points.slice(0, count)
      const lower = band.points.slice(count).reverse()
      let widest = { x: 0, thick: 0 }
      upper.forEach(([x, y], i) => {
        const thick = lower[i][1] - y
        const phase = (x - lay.now) / wideOf(700)
        expect(thick).toBeCloseTo(2 * (0.5 + 2.4 * fallingWindow(phase, attack)), 9)
        if (thick > widest.thick) widest = { x, thick }
      })
      expect(widest.x).toBeCloseTo(lay.now + attack * wideOf(700), 9)
      expect(widest.thick).toBeCloseTo(2 * (0.5 + 2.4), 9)
    }
  })

  it('shows where Vary may throw a piece as a fan, and none without Vary', () => {
    const lay = fallingLayout(SIZE)
    const fan = (values: Record<string, number>): Mark | undefined =>
      bands(marksOf(drawDisplay(display, params, { values, meters: ASLEEP })), INK).find(
        (m) => m.alpha === SHADE.grid,
      )
    expect(fan({ vary: 0 })).toBeUndefined()
    for (const vary of [0.2, 0.7, 1]) {
      const found = fan({ fall: -9, vary })
      if (!found) throw new Error('no fan')
      const ys = found.points.map(([, y]) => y)
      // From the end of the model piece to the end of the piece thrown furthest.
      expect(Math.max(...ys)).toBeCloseTo(fallingY(lay, -9, -9, vary), 9)
      const far = fallingY(lay, fallingOther(-9, vary), -9, vary)
      expect(found.points.some(([x, y]) => Math.abs(y - far) < 1e-9 && x > lay.now)).toBe(true)
    }
    // At Vary 1 the furthest piece goes the other way: over the level line.
    expect(fallingY(lay, fallingOther(-9, 1), -9, 1)).toBeLessThan(fallingY(lay, 0, -9, 1))
  })
})

describe("Falling's display: the handles", () => {
  it('stand at the end of the piece and half way along it', () => {
    for (const size of SIZES) {
      for (const values of [
        {},
        { fall: 9, curve: -0.7, size: 2000 },
        { fall: -24, curve: 1 },
      ] as Record<string, number>[]) {
        const line = modelLine(
          marksOf(drawDisplay(display, params, { values, meters: ASLEEP, ...size })),
        )
        const { fall, curve } = handles(values, size)
        expect(fall.x).toBeCloseTo(line.points.at(-1)?.[0] ?? NaN, 9)
        expect(fall.y).toBeCloseTo(line.points.at(-1)?.[1] ?? NaN, 9)
        const lay = fallingLayout(size)
        const wide = wideOf(values.size ?? 700, size)
        expect(curve.x).toBeCloseTo(lay.now + wide / 2, 9)
        const zero = line.points[0][1]
        const end = fall.y
        expect(curve.y).toBeCloseTo(zero + (end - zero) * fallingBend(0.5, values.curve ?? 0.5), 9)
        // Both are rings drawn where they are taken.
        const rings = marksOf(
          drawDisplay(display, params, { values, meters: ASLEEP, ...size }),
        ).filter((m) => m.kind === 'fill' && m.colour === PLATE && m.radius === 3)
        expect(rings.map((m) => m.points[0])).toEqual(
          expect.arrayContaining([
            [fall.x, fall.y],
            [curve.x, curve.y],
          ]),
        )
      }
    }
  })

  it('the end sets every whole semitone of Fall, each on a place of its own', () => {
    for (const size of SIZES) {
      let last = Infinity
      for (let semitones = -24; semitones <= 24; semitones++) {
        const there = handles({ fall: semitones }, size).fall
        // Taken at another Fall and brought to where that Fall's end stands.
        for (const from of [-7, 3, 24]) {
          const taken = handles({ fall: from }, size).fall
          const hold: DisplayHold = {}
          taken.drag(taken.x, taken.y, hold)
          const set = taken.drag(taken.x, there.y, hold)
          expect(set.fall, `${from} to ${semitones}`).toBe(semitones)
          expect(set.size).toBe(700)
        }
        // A pixel on is another semitone, so a hand finds each.
        expect(last - there.y).toBeGreaterThanOrEqual(1)
        last = there.y
      }
    }
  })

  it('sets a small Fall in tenths, where a pixel is far less than a semitone', () => {
    const taken = handles({ fall: -7 }).fall
    for (const tenths of [-2.5, -0.6, 0.3, 1.9]) {
      const there = handles({ fall: tenths }).fall
      expect(taken.drag(taken.x, there.y, {}).fall).toBeCloseTo(tenths, 9)
    }
    // Never a "-0" for the knob to show.
    const lay = fallingLayout(SIZE)
    expect(Object.is(taken.drag(taken.x, lay.mid, {}).fall, 0)).toBe(true)
    // Past the display either way is the end of the knob.
    expect(taken.drag(taken.x, -40, {}).fall).toBe(24)
    expect(taken.drag(taken.x, 400, {}).fall).toBe(-24)
  })

  it('the end sets Size across, by the place the knob has for it', () => {
    for (const size of SIZES) {
      const taken = handles({}, size).fall
      for (const ms of [60, 200, 700, 1500, 3000]) {
        const there = handles({ size: ms }, size).fall
        const set = taken.drag(there.x, taken.y, {})
        if (ms === 700) expect(set.size).toBe(700)
        else expect(set.size / ms).toBeCloseTo(1, 9)
        // Across alone leaves the Fall as it was.
        expect(set.fall).toBe(-7)
      }
      const lay = fallingLayout(size)
      expect(taken.drag(lay.now, taken.y, {}).size).toBe(60)
      expect(taken.drag(size.width + 50, taken.y, {}).size).toBe(3000)
    }
  })

  it('taken and not moved, the end changes nothing, also from a setting no place stands for', () => {
    const values = { fall: -6.37, size: 123.456 }
    const taken = handles(values).fall
    const hold: DisplayHold = {}
    expect(taken.drag(taken.x, taken.y, hold)).toEqual(values)
    // Moved away and back to the row it was taken on, the Fall is what it was.
    const moved = taken.drag(taken.x + 9, taken.y + 12, hold)
    expect(moved.fall).not.toBe(values.fall)
    const after = handles({ fall: moved.fall, size: moved.size }).fall
    expect(after.drag(taken.x + 9, taken.y, hold).fall).toBe(values.fall)
    expect(after.drag(taken.x, taken.y + 12, hold).size).toBe(values.size)
  })

  it('the wheel steps the Fall by a semitone and a double press sets both back', () => {
    const { fall } = handles({ fall: -7, size: 1500 })
    expect(fall.wheel?.(1)).toEqual({ fall: -6 })
    expect(fall.wheel?.(-3)).toEqual({ fall: -10 })
    expect(handles({ fall: 23.5 }).fall.wheel?.(4)).toEqual({ fall: 24 })
    expect(handles({ fall: -24 }).fall.wheel?.(-1)).toEqual({ fall: -24 })
    expect(fall.reset?.()).toEqual({ fall: params.fall.default, size: params.size.default })
  })

  it('the one half way sets the Curve whose piece passes under the hand', () => {
    for (const size of SIZES) {
      for (const fall of [-24, -7, 7, 12]) {
        const taken = handles({ fall, curve: 0.2 }, size).curve
        for (const curve of [-1, -0.5, 0, 0.5, 1]) {
          const there = handles({ fall, curve }, size).curve
          const set = taken.drag(taken.x, there.y, {})
          expect(set.curve, `fall ${fall}, curve ${curve}`).toBeCloseTo(curve, 9)
          expect(Object.keys(set)).toEqual(['curve'])
        }
        // Past the ends of what a Curve can do, it stays at the end.
        expect(taken.drag(taken.x, -100, {}).curve).toBe(fall < 0 ? 1 : -1)
        expect(taken.drag(taken.x, 300, {}).curve).toBe(fall < 0 ? -1 : 1)
      }
    }
    const taken = handles({ curve: 0.3333 }).curve
    expect(taken.drag(taken.x, taken.y, {})).toEqual({ curve: 0.3333 })
    expect(taken.reset?.()).toEqual({ curve: params.curve.default })
  })

  it('sets the Curve of a piece too flat to point at by how far the hand goes', () => {
    // A Fall of half a semitone is a few pixels tall: twelve pixels of hand are the whole Curve.
    for (const fall of [-0.5, 0, 0.5]) {
      const taken = handles({ fall, curve: 0 }).curve
      const hold: DisplayHold = {}
      taken.drag(taken.x, taken.y, hold)
      const down = taken.drag(taken.x, taken.y + 3, hold).curve
      const up = taken.drag(taken.x, taken.y - 3, hold).curve
      // Down is toward where a sinking piece ends: sooner, a lower Curve. For a rising one, later.
      const sign = fall > 0 ? 1 : -1
      expect(down).toBeCloseTo((sign * (3 / 12)) / 0.4375, 9)
      expect(up).toBeCloseTo((-sign * (3 / 12)) / 0.4375, 9)
      expect(taken.drag(taken.x, taken.y + 40, hold).curve).toBe(sign)
      expect(taken.drag(taken.x, taken.y, hold).curve).toBe(0)
    }
  })
})

/** The device's readings while it runs: its clock at `time`, a level, and the pieces it says it started. */
interface Told {
  start: number
  fall: number
  length: number
  behind: number
}
function readings(clock: number, level: number, told: Told[]): Record<string, number> {
  const blank: Told = { start: -1, fall: 0, length: 0, behind: 0 }
  const newest = told.at(-1) ?? blank
  const earlier = told.at(-2) ?? blank
  return {
    clock: ((clock % 64) + 64) % 64,
    level,
    grains: told.length,
    newStart: newest.start < 0 ? -1 : newest.start % 64,
    newFall: newest.fall,
    newLength: newest.length,
    newBehind: newest.behind,
    oldStart: earlier.start < 0 ? -1 : earlier.start % 64,
    oldFall: earlier.fall,
    oldLength: earlier.length,
    oldBehind: earlier.behind,
  }
}

/** Run the display on a device whose clock starts at `from`, with the pieces it starts as time passes. */
function follow(
  seconds: number,
  pieces: Told[],
  options: FrameOptions & {
    from?: number
    level?: (time: number) => number
    each?: (time: number) => Partial<FrameOptions>
  } = {},
): Mark[] {
  const from = options.from ?? 5
  const drawn = runDisplay(display, params, seconds, options, (time) => ({
    ...options.each?.(time),
    meters: readings(
      from + time,
      options.level?.(time) ?? 0.5,
      pieces.filter((piece) => piece.start <= from + time + 1e-9),
    ),
  }))
  return marksOf(drawn)
}

/** The last frame `runDisplay` draws of so many seconds, in seconds from its first. */
const lastFrame = (seconds: number): number => (Math.round(seconds * 30) - 1) / 30

describe("Falling's display: the pieces the device starts", () => {
  it('has the clock lap of the device', () => {
    // `readings` and the display wrap the clock where the device does.
    expect(constant('kClockSeconds')).toBe(64)
  })

  it('draws a piece where the device says it is: its stroke by the clock, its dot on now', () => {
    for (const size of SIZES) {
      const lay = fallingLayout(size)
      const piece: Told = { start: 5 + 2, fall: -12, length: 0.7, behind: 0.05 }
      const seconds = 2.4
      const age = 5 + lastFrame(seconds) - piece.start
      const phase = age / piece.length
      const marks = follow(seconds, [piece], size)
      const perSec = wideOf(700, size) / 0.7
      const zero = fallingY(lay, 0, -7, 0.2)
      const drop = fallingY(lay, piece.fall, -7, 0.2) - zero
      // The stroke: once for what has sounded, once fainter for what is to come.
      const strokes = bands(marks, ACCENT)
      expect(strokes).toHaveLength(2)
      for (const stroke of strokes) {
        // It began on the level line, as far left of now as it is old.
        expect(stroke.points[0][0]).toBeCloseTo(lay.now - age * perSec, 2)
        expect(stroke.points[0][1]).toBeCloseTo(zero - 0.5, 9)
        const xs = stroke.points.map(([x]) => x)
        expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(piece.length * perSec, 6)
        // It ends on the pitch the device says it falls to: its own, not the knob's.
        const ys = stroke.points.map(([, y]) => y)
        expect(Math.max(...ys)).toBeCloseTo(zero + drop + 0.5, 9)
      }
      expect(strokes[1].alpha).toBeCloseTo(strokes[0].alpha / 2, 9)
      // The dot: on now, at the pitch the piece has reached, as big as its window is open.
      const [spot] = dots(marks, ACCENT)
      expect(dots(marks, ACCENT)).toHaveLength(1)
      expect(spot.points[0][0]).toBe(lay.now)
      expect(spot.points[0][1]).toBeCloseTo(zero + drop * fallingBend(phase, 0.5), 2)
      expect(spot.radius).toBeCloseTo(1.2 + 1.6 * fallingWindow(phase, fallingAttack(0.3, 0.7)), 2)
      // Now is in the second ink while pieces come.
      expect(nowLine(marks, lay).colour).toBe(ACCENT)
    }
  })

  it('keeps both pieces when the device started two between two looks', () => {
    const lay = fallingLayout(SIZE)
    const pieces: Told[] = [
      { start: 7.004, fall: -3, length: 1, behind: 0.02 },
      { start: 7.012, fall: 5, length: 1, behind: 0.02 },
    ]
    const marks = follow(2.5, pieces)
    const zero = fallingY(lay, 0, -7, 0.2)
    const ends = dots(marks, ACCENT).map((m) => m.points[0][1])
    expect(ends).toHaveLength(2)
    // One has sunk under the level line, the other has risen over it.
    expect(Math.max(...ends)).toBeGreaterThan(zero)
    expect(Math.min(...ends)).toBeLessThan(zero)
  })

  it('lets a piece that has ended travel off to the left, with no dot', () => {
    const lay = fallingLayout(SIZE)
    const piece: Told = { start: 6, fall: -12, length: 0.2, behind: 0.05 }
    const marks = follow(1.3, [piece])
    const age = 5 + lastFrame(1.3) - piece.start
    expect(age).toBeGreaterThan(piece.length)
    expect(dots(marks, ACCENT)).toHaveLength(0)
    const [stroke] = bands(marks, ACCENT)
    expect(stroke.points[0][0]).toBeCloseTo(lay.now - (age * wideOf(700)) / 0.7, 2)
    // And once all of it is past the edge it is not drawn at all.
    expect(bands(follow(3, [piece]), ACCENT)).toHaveLength(0)
  })

  it('follows the clock over its lap', () => {
    const lay = fallingLayout(SIZE)
    // The clock goes round at 64 s: a piece started just before is 0.3 s old just after.
    const piece: Told = { start: 63.9, fall: -12, length: 0.7, behind: 0.05 }
    const seconds = 2.2
    const marks = follow(seconds, [piece], { from: 62 })
    const age = 62 + lastFrame(seconds) - piece.start
    expect(age).toBeGreaterThan(0.1)
    expect(bands(marks, ACCENT)[0].points[0][0]).toBeCloseTo(lay.now - (age * wideOf(700)) / 0.7, 2)
    expect(dots(marks, ACCENT)).toHaveLength(1)
  })

  it('draws a piece as strong as what it reads is loud, and not at all when it reads silence', () => {
    const piece: Told = { start: 7, fall: -12, length: 0.7, behind: 0.05 }
    const loud = bands(follow(2.4, [piece], { level: () => 0.5 }), ACCENT)
    const soft = bands(follow(2.4, [piece], { level: () => 0.005 }), ACCENT)
    expect(loud[0].alpha).toBeGreaterThan(soft[0].alpha + 0.2)
    const silent = follow(2.4, [piece], { level: () => 0 })
    expect(bands(silent, ACCENT)).toHaveLength(0)
    expect(dots(silent, ACCENT)).toHaveLength(0)
    // What it reads is the sound from as far back as the device says it started.
    const old: Told = { ...piece, behind: 1.5 }
    const heard = (time: number): number => (time < 1 ? 0.5 : 0)
    expect(bands(follow(2.4, [old], { level: heard }), ACCENT)).toHaveLength(2)
    expect(bands(follow(2.4, [piece], { level: heard }), ACCENT)).toHaveLength(0)
  })

  it('draws no piece at Mix zero, and has not missed them when Mix comes up', () => {
    const lay = fallingLayout(SIZE)
    const piece: Told = { start: 7, fall: -12, length: 0.7, behind: 0.05 }
    const dry = follow(2.4, [piece], { values: { mix: 0 } })
    expect(dry.some((m) => m.colour === ACCENT)).toBe(false)
    // The piece that would start now is only a dashed line: nothing of it is heard.
    expect(modelLine(dry).dashed).toBe(true)
    expect(bands(dry, INK)).toHaveLength(0)
    // The handles are still there to set it by.
    expect(
      dry.filter((m) => m.kind === 'fill' && m.colour === PLATE && m.radius === 3),
    ).toHaveLength(2)
    const seconds = 2.4
    const up = follow(seconds, [piece], {
      each: (time) => ({ values: { mix: time < 2.3 ? 0 : 0.4 } }),
    })
    const age = 5 + lastFrame(seconds) - piece.start
    expect(bands(up, ACCENT)[0].points[0][0]).toBeCloseTo(lay.now - (age * wideOf(700)) / 0.7, 2)
  })

  it('places a piece that was already on its way when the display first looked', () => {
    const lay = fallingLayout(SIZE)
    // Started 0.3 s before the first reading: it is drawn that old, not as starting now.
    const piece: Told = { start: 4.7, fall: -12, length: 2, behind: 0.05 }
    const seconds = 1
    const marks = follow(seconds, [piece], { values: { size: 2000 } })
    const age = 5 + lastFrame(seconds) - piece.start
    const perSec = wideOf(2000) / 2
    expect(bands(marks, ACCENT)[0].points[0][0]).toBeCloseTo(lay.now - age * perSec, 2)
    const zero = fallingY(lay, 0, -7, 0.2)
    const drop = fallingY(lay, piece.fall, -7, 0.2) - zero
    expect(dots(marks, ACCENT)[0].points[0][1]).toBeCloseTo(
      zero + drop * fallingBend(age / piece.length, 0.5),
      2,
    )
    // One that had ended before the first look is not shown at all.
    const over: Told = { start: 4.7, fall: -12, length: 0.2, behind: 0.05 }
    expect(bands(follow(seconds, [over]), ACCENT)).toHaveLength(0)
  })

  it('forgets what it held when the device wakes anew', () => {
    const piece: Told = { start: 7, fall: -12, length: 0.7, behind: 0.05 }
    const state = display.init?.()
    const before = follow(2.4, [piece], { state, level: () => 0 })
    expect(bands(before, ACCENT)).toHaveLength(0)
    // Its clock steps by seconds at once: a new run, of which the display has
    // seen nothing. A piece that reads from before the display looked is drawn,
    // though the last the display saw was silence.
    const old: Told = { start: 30.2, fall: -12, length: 0.7, behind: 1.5 }
    const woke = follow(0.5, [piece, old], { state, from: 30, now: 12.4 })
    expect(bands(woke, ACCENT)).toHaveLength(2)
    expect(dots(woke, ACCENT)).toHaveLength(1)
    // And nothing of the run before is left: asleep, then awake, no piece comes back.
    drawDisplay(display, params, { meters: ASLEEP, state, dt: 1 / 30 })
    const again = follow(0.5, [piece, old], { state, from: 40, now: 13 })
    expect(bands(again, ACCENT)).toHaveLength(0)
  })
})

describe("Falling's display: at rest", () => {
  it('shows a worked example of the settings in the ink, and it does not move', () => {
    for (const meters of [ASLEEP, metersOf(descriptor.meters), { ...ASLEEP, clock: 12.5 }]) {
      const one = drawDisplay(display, params, { meters, now: 10 })
      const other = drawDisplay(display, params, { meters, now: 73.4, dt: 1 / 30 })
      expect(other.print()).toBe(one.print())
      const marks = marksOf(one)
      expect(marks.some((m) => m.colour === ACCENT)).toBe(false)
      expect(dots(marks, INK).length).toBeGreaterThan(0)
      expect(nowLine(marks, fallingLayout(SIZE)).colour).toBe(INK)
    }
    // Switched off, the same.
    const off = marksOf(
      runDisplay(display, params, 1, { powered: false, meters: readings(9, 0.5, []) }),
    )
    expect(off.some((m) => m.colour === ACCENT)).toBe(false)
  })

  it('makes the example of the settings: more pieces for more Density, each as long as Size', () => {
    const lay = fallingLayout(SIZE)
    const example = (values: Record<string, number>): Mark[] =>
      bands(marksOf(drawDisplay(display, params, { values, meters: ASLEEP })), INK).filter(
        (m) => m.alpha === SHADE.back || m.alpha === SHADE.back / 2,
      )
    const few = example({ density: 1 })
    const many = example({ density: 20 })
    expect(many.length).toBeGreaterThan(few.length + 8)
    for (const stroke of many) {
      const xs = stroke.points.map(([x]) => x)
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(wideOf(700), 9)
      // Each began at or before now, on the level line.
      expect(stroke.points[0][0]).toBeLessThanOrEqual(lay.now)
      expect(stroke.points[0][1]).toBeCloseTo(fallingY(lay, 0, -7, 0.2) - 0.5, 9)
    }
    // Without Vary they all land on the Fall; with it they land apart, as far as the fan.
    const landing = (values: Record<string, number>): number[] =>
      example(values).map((m) => Math.max(...m.points.map(([, y]) => y)))
    const alike = landing({ vary: 0, density: 20 })
    expect(Math.max(...alike) - Math.min(...alike)).toBeLessThan(1e-9)
    const apart = landing({ vary: 1, density: 20 })
    expect(Math.max(...apart) - Math.min(...apart)).toBeGreaterThan(10)
  })

  it('wakes into the device: the example gives way to the pieces', () => {
    const state = display.init?.()
    const rest = marksOf(drawDisplay(display, params, { meters: ASLEEP, state }))
    expect(rest.some((m) => m.colour === ACCENT)).toBe(false)
    const piece: Told = { start: 5.5, fall: -12, length: 0.7, behind: 0.05 }
    const awake = follow(0.8, [piece], { state })
    expect(bands(awake, ACCENT)).toHaveLength(2)
    // No example pieces among the real ones.
    expect(dots(awake, INK)).toHaveLength(0)
    // Asleep again, the example is back and the pieces are gone.
    const again = marksOf(drawDisplay(display, params, { meters: ASLEEP, state, dt: 1 / 30 }))
    expect(again.some((m) => m.colour === ACCENT)).toBe(false)
    expect(dots(again, INK).length).toBeGreaterThan(0)
  })
})
