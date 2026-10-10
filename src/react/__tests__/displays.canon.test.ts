// The truth of Canon's display: every follower stands where the device reads
// the line for it, as high as its interval and as thick as the device makes it
// loud; a crab's stem runs where the device's own count of the gap puts its
// reader; the line is the level the device wrote, when it wrote it; and each
// point that can be dragged sets what it stands on.

import { describe, expect, it } from 'vitest'

import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  CANON_FACES,
  CANON_VOICES,
  canonLayout,
  followerBehind,
  followerGain,
  intervalText,
  isCrab,
  noteThickness,
  wetGain,
} from '../components/displays/canon'
import { heightOfLevel, timeText } from '../components/displays/loops'
import {
  drawDisplay,
  metersOf,
  patchUnder,
  runDisplay,
  stockDescriptors,
  viewOf,
  type RecordingContext,
} from './display-harness'

const descriptor = stockDescriptors().get('canon')
const params = descriptor?.params ?? {}
const { display } = CANON_FACES.canon
const { ink, accent, plate } = PLAIN_COLOURS
const resting = { ...metersOf(descriptor?.meters), clock: -1 }
const running = metersOf(descriptor?.meters)

// --- canon.h, copied ---------------------------------------------------------

/** `kVoices`. */
const K_VOICES = 4
/** `kFadeDb`: each follower is this much quieter than the one before at Fade 1. */
const K_FADE_DB = 12

/** `place()`: `gains[k] = db_to_gain(-kFadeDb * fade * k)`, all times `1 / sqrt(sum of gains squared)`. */
function deviceGain(k: number, count: number, fade: number): number {
  const gains = Array.from({ length: count }, (_, n) => Math.pow(10, (-K_FADE_DB * fade * n) / 20))
  const together = 1 / Math.sqrt(gains.reduce((sum, gain) => sum + gain * gain, 0))
  return gains[k] * together
}

/** `control()`: `crab == 3 || (crab == 2 && (k & 1) == 1) || (crab == 1 && k == count_ - 1)`. */
const deviceCrab = (crab: number, k: number, count: number): boolean =>
  crab === 3 || (crab === 2 && k % 2 === 1) || (crab === 1 && k === count - 1)

/** `read()`, in seconds: `(k + 1) * gap_` forwards, `k * gap_ + 2 * chunk_` for a crab (and one sample). */
const deviceBehind = (k: number, gap: number, crab: boolean, chunk: number): number =>
  crab ? k * gap + 2 * chunk : (k + 1) * gap

// --- What was drawn ----------------------------------------------------------

interface Rect {
  kind: 'fill' | 'stroke'
  colour: string
  alpha: number
  x: number
  y: number
  w: number
  h: number
}

interface Path {
  kind: 'fill' | 'stroke'
  colour: string
  alpha: number
  dashed: boolean
  points: [number, number][]
}

function marks(drawn: RecordingContext): { rects: Rect[]; paths: Path[] } {
  const rects: Rect[] = []
  const paths: Path[] = []
  let points: [number, number][] = []
  const now = { fillStyle: '', strokeStyle: '', globalAlpha: 1, dashed: false }
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      points.push([call.args[0] as number, call.args[1] as number])
    else if (call.name === 'set fillStyle') now.fillStyle = String(call.args[0])
    else if (call.name === 'set strokeStyle') now.strokeStyle = String(call.args[0])
    else if (call.name === 'set globalAlpha') now.globalAlpha = call.args[0] as number
    else if (call.name === 'setLineDash') now.dashed = (call.args[0] as number[]).length > 0
    else if (call.name === 'fillRect' || call.name === 'strokeRect') {
      const [x, y, w, h] = call.args as number[]
      const kind = call.name === 'fillRect' ? 'fill' : 'stroke'
      const colour = kind === 'fill' ? now.fillStyle : now.strokeStyle
      rects.push({ kind, colour, alpha: now.globalAlpha, x, y, w, h })
    } else if (call.name === 'stroke' || call.name === 'fill')
      paths.push({
        kind: call.name,
        colour: call.name === 'fill' ? now.fillStyle : now.strokeStyle,
        alpha: now.globalAlpha,
        dashed: now.dashed,
        points: [...points],
      })
  }
  return { rects, paths }
}

/** The notes: the outlines in the ink, left to right. The first outline drawn is the ground's own. */
const notes = (drawn: RecordingContext): Rect[] =>
  marks(drawn)
    .rects.filter((rect) => rect.kind === 'stroke' && rect.colour === ink)
    .slice(1)

/** What a note is filled with while its follower plays. */
const lit = (drawn: RecordingContext): Rect[] =>
  marks(drawn).rects.filter((rect) => rect.kind === 'fill' && rect.colour === accent)

/** The stem that ends on a note at (x, y): a line of two points whose second is there. */
function stemTo(drawn: RecordingContext, x: number, y: number): Path | undefined {
  return marks(drawn).paths.find(
    (path) =>
      path.kind === 'stroke' &&
      !path.dashed &&
      path.points.length === 2 &&
      Math.abs(path.points[1][0] - x) <= 0.5 &&
      Math.abs(path.points[1][1] - y) < 1e-6,
  )
}

/** How tall the line's outline stands over the unison row at `x`. */
function lineAt(drawn: RecordingContext, x: number, zero: number): number {
  let best = 0
  let nearest = Infinity
  for (const path of marks(drawn).paths) {
    if (path.kind !== 'fill' || path.colour !== ink || path.points.length < 6) continue
    const upper = path.points.slice(0, path.points.length / 2)
    for (const point of upper) {
      const far = Math.abs(point[0] - x)
      if (far < nearest) {
        nearest = far
        best = zero - point[1]
      }
    }
  }
  return best
}

const layoutAt = (values: Record<string, number> = {}, width?: number, height?: number) =>
  canonLayout(viewOf(display, params, { values, width, height }))

describe('what the display says of the device', () => {
  it('makes each follower as loud as place() does: 12 dB times Fade apart, together the power of one', () => {
    expect(CANON_VOICES).toBe(K_VOICES)
    for (let count = 1; count <= K_VOICES; count++) {
      for (const fade of [0, 0.25, 0.5, 1]) {
        let power = 0
        for (let k = 0; k < count; k++) {
          const gain = followerGain(k, count, fade)
          expect(gain).toBeCloseTo(deviceGain(k, count, fade), 9)
          power += gain * gain
        }
        expect(power).toBeCloseTo(1, 9)
        expect(followerGain(count, count, fade)).toBe(0)
      }
    }
    // What the native harness measures: four alike are half the height each, and Fade 0.5 is 6 dB a step.
    expect(followerGain(2, 4, 0)).toBeCloseTo(0.5, 9)
    expect(20 * Math.log10(followerGain(1, 3, 0.5) / followerGain(0, 3, 0.5))).toBeCloseTo(-6, 9)
  })

  it('lets the followers out as Mix does: equal power, nothing at 0 and all at 1', () => {
    expect(wetGain(0)).toBe(0)
    expect(wetGain(1)).toBe(1)
    expect(wetGain(0.5)).toBeCloseTo(Math.SQRT1_2, 9)
    expect(wetGain(0.25) ** 2 + Math.cos((Math.PI / 2) * 0.25) ** 2).toBeCloseTo(1, 9)
  })

  it('names the crabs as control() does under each choice of Crab', () => {
    for (let crab = 0; crab <= 3; crab++)
      for (let count = 1; count <= K_VOICES; count++)
        for (let k = 0; k < count; k++)
          expect(isCrab(crab, k, count), `Crab ${crab}, follower ${k} of ${count}`).toBe(
            deviceCrab(crab, k, count),
          )
    expect([0, 1, 2, 3].map((k) => isCrab(1, k, 4))).toEqual([false, false, false, true])
    expect([0, 1, 2, 3].map((k) => isCrab(2, k, 4))).toEqual([false, true, false, true])
  })

  it('reads the line where read() does: a gap apart forwards, back through two gaps for a crab', () => {
    for (let k = 0; k < K_VOICES; k++) {
      for (const gap of [0.1, 1.5, 7.5]) {
        expect(followerBehind(k, gap, false, 0.3 * gap)).toBe(deviceBehind(k, gap, false, 0))
        for (const chunk of [0, 0.25 * gap, gap])
          expect(followerBehind(k, gap, true, chunk)).toBe(deviceBehind(k, gap, true, chunk))
      }
    }
    // A crab starts a gap where the follower before it stands and ends it two gaps further on.
    expect(followerBehind(2, 1.5, true, 0)).toBe(followerBehind(1, 1.5, false, 0))
    expect(followerBehind(2, 1.5, true, 1.5)).toBe(followerBehind(3, 1.5, false, 0))
  })

  it('says an interval with its sign and a real minus', () => {
    expect([7, 0, -12, 12].map(intervalText)).toEqual(['+7', '0', '−12', '+12'])
  })
})

describe('where things stand', () => {
  it('lays a window of 128 by 100 out from its size', () => {
    const lay = layoutAt()
    expect(lay.now).toBe(28)
    expect(lay.reach).toBe(83)
    expect([lay.top, lay.zero, lay.bottom, lay.foot]).toEqual([11, 46.25, 81.5, 90.5])
    expect(lay.semitone).toBeCloseTo(70.5 / 24, 9)
    expect(lay.rowOf(12)).toBe(lay.top)
    expect(lay.rowOf(-12)).toBe(lay.bottom)
    expect(lay.rowOf(7)).toBeCloseTo(46.25 - 7 * (70.5 / 24), 9)
  })

  it('puts the followers one gap apart along the line, at the speed the line travels', () => {
    for (const followers of [1, 2, 3, 4]) {
      for (const gap of [0.1, 0.4, 1.5, 7.5]) {
        const lay = layoutAt({ followers, gap })
        expect(lay.count).toBe(followers)
        expect(lay.entries.length).toBe(followers)
        for (let k = 0; k < followers; k++)
          expect(lay.entries[k] - lay.now).toBeCloseTo(
            deviceBehind(k, gap, false, 0) * lay.pxPerSec,
            6,
          )
      }
    }
  })

  it('moves the last follower from half the reach to all of it as Gap goes from its shortest to its longest', () => {
    const at = (gap: number) => {
      const lay = layoutAt({ gap })
      return (lay.entries[lay.count - 1] - lay.now) / lay.reach
    }
    expect(at(params.gap.min)).toBeCloseTo(0.5, 9)
    expect(at(params.gap.max)).toBeCloseTo(1, 9)
    // On the knob's own taper: the middle of the travel is the middle of the knob.
    expect(at(Math.sqrt(params.gap.min * params.gap.max))).toBeCloseTo(0.75, 9)
  })

  it('keeps to the picture at the sizes a plate gives it', () => {
    for (const [width, height] of [
      [128, 100],
      [176, 100],
      [204, 100],
      [293, 100],
    ]) {
      const lay = layoutAt({ followers: 4, gap: params.gap.max }, width, height)
      expect(lay.now).toBeGreaterThanOrEqual(20)
      expect(lay.entries[3] + 12).toBeLessThanOrEqual(width - 4)
      expect(lay.top).toBeGreaterThan(lay.back + 3)
      expect(lay.bottom).toBeLessThan(lay.foot - 6)
      expect(lay.foot + 4).toBeLessThanOrEqual(height - 4)
      // A semitone is far enough to set by.
      expect(lay.semitone).toBeGreaterThan(2.5)
    }
  })
})

describe('the picture', () => {
  it('draws a note for each follower at its entry and its interval, as thick as it is loud', () => {
    const settings: Record<string, number>[] = [
      {},
      { fade: 1 },
      { followers: 4, fade: 0.5, mix: 0.25, interval4: -3 },
      { followers: 1, interval1: -7, mix: 1 },
    ]
    for (const values of settings) {
      const lay = layoutAt(values)
      const view = viewOf(display, params, { values })
      const drawn = notes(drawDisplay(display, params, { values, meters: resting }))
      expect(drawn.length).toBe(lay.count)
      for (let k = 0; k < lay.count; k++) {
        const level =
          deviceGain(k, lay.count, view.value('fade')) * Math.sin((Math.PI / 2) * view.value('mix'))
        const thick = 2 + 4 * heightOfLevel(level)
        expect(noteThickness(level)).toBeCloseTo(thick, 9)
        expect(drawn[k].x).toBeCloseTo(lay.entries[k], 9)
        expect(drawn[k].h).toBeCloseTo(thick, 6)
        expect(drawn[k].y + drawn[k].h / 2).toBeCloseTo(
          lay.rowOf(view.value(`interval${k + 1}`)),
          6,
        )
      }
    }
    // Quieter followers are thinner notes.
    const faded = notes(drawDisplay(display, params, { values: { fade: 1 }, meters: resting }))
    expect(faded[0].h).toBeGreaterThan(faded[1].h)
    expect(faded[1].h).toBeGreaterThan(faded[2].h)
  })

  it('still shows the canon at Mix 0, as threads with nothing lit', () => {
    const playing = { ...running, clock: 3, level1: 0.6, level2: 0.6, level3: 0.6 }
    const dry = drawDisplay(display, params, { values: { mix: 0 }, meters: playing })
    expect(notes(dry).map((note) => note.h)).toEqual([2, 2, 2])
    expect(lit(dry)).toEqual([])
    const wet = drawDisplay(display, params, { values: { mix: 1 }, meters: playing })
    expect(lit(wet).length).toBe(3)
  })

  it('fills a note as far as its follower plays now, by the reading of its own level', () => {
    const lay = layoutAt()
    const playing = { ...running, clock: 3, level1: 0.5, level2: 0, level3: 0.05 }
    const fills = lit(drawDisplay(display, params, { meters: playing }))
    // Mix is 0.5 as the device starts: what is heard is the reading times its wet gain.
    const heard = (level: number) => level * Math.sin((Math.PI / 2) * 0.5)
    expect(fills.length).toBe(2)
    expect(fills[0].x).toBeCloseTo(lay.entries[0], 9)
    expect(fills[0].h).toBeCloseTo(2 + 4 * heightOfLevel(heard(0.5)), 6)
    expect(fills[0].y + fills[0].h / 2).toBeCloseTo(lay.rowOf(0), 6)
    expect(fills[1].x).toBeCloseTo(lay.entries[2], 9)
    expect(fills[1].h).toBeCloseTo(2 + 4 * heightOfLevel(heard(0.05)), 6)
    expect(fills[1].h).toBeLessThan(fills[0].h)
    // Asleep or switched off nothing plays, whatever was last read.
    expect(lit(drawDisplay(display, params, { meters: { ...playing, clock: -1 } }))).toEqual([])
    expect(lit(drawDisplay(display, params, { meters: playing, powered: false }))).toEqual([])
  })

  it('stands a stem under a follower that plays forwards, from the line to its note', () => {
    const values = { interval2: 7, interval3: -12 }
    const lay = layoutAt(values)
    const drawn = drawDisplay(display, params, { values, meters: resting })
    for (const k of [1, 2]) {
      const at = Math.round(lay.entries[k]) + 0.5
      const stem = stemTo(drawn, at, lay.rowOf(k === 1 ? 7 : -12))
      expect(stem, `follower ${k + 1}`).toBeDefined()
      expect(stem?.points[0]).toEqual([at, lay.zero])
      expect(stem?.colour).toBe(ink)
    }
    // As the device starts all three play at unison: every note lies on the line.
    const plain = notes(drawDisplay(display, params, { meters: resting }))
    expect(plain.length).toBe(3)
    for (const note of plain) expect(note.y + note.h / 2).toBeCloseTo(layoutAt().zero, 6)
  })

  it("runs a crab's stem along the line where the device's count of the gap puts its reader", () => {
    const values = { followers: 2, gap: 1, crab: 3, interval1: 7, interval2: -5 }
    const lay = layoutAt(values)
    const rows = [lay.rowOf(7), lay.rowOf(-5)]
    // At rest each stands where its gap begins: at the follower before it.
    const still = drawDisplay(display, params, { values, meters: resting })
    expect(stemTo(still, lay.entries[0], rows[0])?.points[0][0]).toBeCloseTo(lay.now, 6)
    expect(stemTo(still, lay.entries[1], rows[1])?.points[0][0]).toBeCloseTo(lay.entries[0], 6)
    // Running: the device reports how far into the gap it is.
    for (const seconds of [0.5, 1.4, 2.2]) {
      const last = seconds - 1 / 30
      const drawn = runDisplay(display, params, seconds, { values, meters: running }, (time) => ({
        meters: { ...running, clock: time, chunk: time % 1 },
      }))
      const chunk = last % 1
      for (const k of [0, 1]) {
        const foot = stemTo(drawn, lay.entries[k], rows[k])?.points[0]
        const want = lay.now + deviceBehind(k, 1, true, chunk) * lay.pxPerSec
        // Past the picture's edge a stem is cut where it leaves; these two stay inside.
        expect(want).toBeLessThan(128 + 4)
        expect(foot?.[0], `follower ${k + 1} after ${seconds} s`).toBeCloseTo(want, 3)
        expect(foot?.[1]).toBe(lay.zero)
      }
    }
    // Under Last only the last follower runs.
    const last = runDisplay(
      display,
      params,
      0.5,
      { values: { ...values, crab: 1 }, meters: running },
      (time) => ({ meters: { ...running, clock: time, chunk: time % 1 } }),
    )
    const upright = Math.round(lay.entries[0]) + 0.5
    expect(stemTo(last, upright, rows[0])?.points[0]).toEqual([upright, lay.zero])
    expect(stemTo(last, lay.entries[1], rows[1])?.points[0][0]).toBeGreaterThan(lay.entries[0])
  })

  it('lays the line out as the level the device wrote, travelling right at a second a second', () => {
    const lay = layoutAt()
    const burst = (time: number) => (time >= 0.5 && time < 0.7 ? 0.8 : 0)
    const each = (time: number) => ({ meters: { ...running, clock: time, level: burst(time) } })
    const at = (seconds: number) => runDisplay(display, params, seconds, { meters: running }, each)
    const tall = 9 * heightOfLevel(0.8)
    for (const seconds of [1.2, 2, 3]) {
      const drawn = at(seconds)
      const age = seconds - 1 / 30 - 0.6
      expect(lineAt(drawn, lay.now + age * lay.pxPerSec, lay.zero)).toBeCloseTo(tall, 3)
      // Silence is a line one pixel high: before the burst and after it.
      expect(lineAt(drawn, lay.now + (age - 0.35) * lay.pxPerSec, lay.zero)).toBeCloseTo(0.5, 6)
      expect(lineAt(drawn, lay.now + (age + 0.4) * lay.pxPerSec, lay.zero)).toBeCloseTo(0.5, 6)
    }
    // When the device sleeps it forgets the line, and so does the picture.
    const state = display.init?.()
    runDisplay(display, params, 1.2, { meters: running, state }, each)
    const slept = runDisplay(display, params, 0.1, { meters: resting, state, now: 11.2 })
    for (let x = lay.now; x < 124; x += 4) expect(lineAt(slept, x, lay.zero)).toBeCloseTo(0.5, 6)
  })

  it('draws the way back to the mark only when Round sends something along it', () => {
    const dashed = (round: number, interval3 = -12) =>
      marks(
        drawDisplay(display, params, { values: { round, interval3 }, meters: resting }),
      ).paths.filter((path) => path.dashed)
    expect(dashed(0)).toEqual([])
    const some = dashed(0.3)
    expect(some.length).toBe(1)
    const lay = layoutAt({ round: 0.3, interval3: -12 })
    // From the last follower's note, up, and back to the mark.
    expect(some[0].points[0][0]).toBe(Math.round(lay.entries[2]) + 0.5)
    expect(some[0].points[0][1]).toBeCloseTo(lay.rowOf(-12), 6)
    expect(some[0].points[2]).toEqual([lay.now + 5, lay.back])
    expect(some[0].alpha).toBeGreaterThan(INK.rule)
    expect(dashed(0.95)[0].alpha).toBeGreaterThan(some[0].alpha)
    expect(dashed(0.95)[0].alpha).toBeCloseTo(1, 9)
    // At unison, as the device starts, it leaves from the line itself.
    expect(dashed(0.3, 0)[0].points[0][1]).toBeCloseTo(lay.zero, 6)
  })

  it('says the gap and the intervals in words, on a patch where the line runs under them', () => {
    // As the device starts: a plain round, three followers at unison.
    const plain = drawDisplay(display, params, { meters: resting })
    expect(plain.words()).toEqual(['+12', '0', '−12', '0', '0', '0', timeText(1.5)])
    const apart = { interval2: 7, interval3: -12, interval4: 12 }
    const drawn = drawDisplay(display, params, { values: apart, meters: resting })
    expect(drawn.words()).toEqual(['+12', '0', '−12', '0', '+7', '−12', timeText(1.5)])
    for (const words of ['+7']) expect(patchUnder(drawn, words, plate)).not.toBeNull()
    // Close together the figures give way, and come back for the note in hand.
    const close = { ...apart, followers: 4, gap: params.gap.min }
    const crowded = drawDisplay(display, params, { values: close, meters: resting })
    expect(crowded.words()).toEqual(['+12', '0', '−12', timeText(0.1)])
    const held = drawDisplay(display, params, { values: close, meters: resting, hot: 'interval2' })
    expect(held.words()).toContain('+7')
    expect(patchUnder(held, '+7', plate)).not.toBeNull()
  })
})

describe('a follower at the far right', () => {
  it('keeps its figures inside the picture at the longest Gap, at every size', () => {
    for (const [width, height] of [
      [128, 100],
      [204, 100],
      [224, 48],
    ]) {
      const values = { followers: 4, gap: params.gap.max, interval4: -11 }
      const drawn = drawDisplay(display, params, { values, meters: resting, width, height })
      const patch = patchUnder(drawn, '−11', plate)
      expect(patch).not.toBeNull()
      if (!patch) continue
      expect(patch.x + patch.w).toBeLessThanOrEqual(width - 4)
      expect(patch.x).toBeGreaterThan(layoutAt(values, width, height).now)
    }
  })
})

describe('the points to drag', () => {
  const handles = (values: Record<string, number> = {}) =>
    display.handles?.(viewOf(display, params, { values })) ?? []
  const named = (key: string, values: Record<string, number> = {}) => {
    const found = handles(values).find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }

  it('has one for each follower that plays, and one for the gap', () => {
    expect(handles().map((handle) => handle.key)).toEqual([
      'interval1',
      'interval2',
      'interval3',
      'gap',
    ])
    expect(handles({ followers: 1 }).map((handle) => handle.key)).toEqual(['interval1', 'gap'])
    expect(handles({ followers: 4 }).length).toBe(5)
  })

  it('sets an interval where a note is dragged to, and stands there when it is set', () => {
    for (let k = 0; k < K_VOICES; k++) {
      const key = `interval${k + 1}`
      for (const semitones of [-12, -7, -1, 0, 3, 7, 12]) {
        const values = { followers: 4, [key]: semitones }
        const lay = layoutAt(values)
        const stands = named(key, values)
        expect(stands.x).toBeCloseTo(lay.entries[k], 9)
        expect(stands.y).toBeCloseTo(lay.rowOf(semitones), 9)
        // Dragged there from where the device starts: the value is the row, whatever the x.
        const from = named(key, { followers: 4 })
        expect(from.drag(from.x, stands.y)).toEqual({ [key]: semitones })
        expect(from.drag(3, stands.y + 1)).toEqual({ [key]: semitones })
      }
      // Past the scale it stops at the end of the range.
      const from = named(key, { followers: 4 })
      expect(from.drag(0, -40)).toEqual({ [key]: 12 })
      expect(from.drag(0, 400)).toEqual({ [key]: -12 })
      expect(from.reset?.()).toEqual({ [key]: params[key].default })
    }
  })

  it('sets the gap where its point is dragged to along the foot, and stands there when it is set', () => {
    const from = named('gap')
    expect(from.y).toBe(layoutAt().foot)
    for (const gap of [0.1, 0.25, 0.8, 1.5, 3, 7.5]) {
      const stands = named('gap', { gap })
      const lay = layoutAt({ gap })
      expect(stands.x).toBeCloseTo(lay.entries[lay.count - 1], 9)
      const set = from.drag(stands.x, 5)
      expect(Object.keys(set)).toEqual(['gap'])
      expect(set.gap).toBeCloseTo(gap, 6)
    }
    // Left of its shortest and right of its longest it stops at the ends.
    expect(from.drag(0, 0).gap).toBe(params.gap.min)
    expect(from.drag(500, 0).gap).toBe(params.gap.max)
    expect(from.reset?.()).toEqual({ gap: 1.5 })
  })

  it('draws each point where it stands', () => {
    const lay = layoutAt()
    const drawn = drawDisplay(display, params, { meters: resting })
    const arcs = drawn.calls
      .filter((call) => call.name === 'arc')
      .map((call) => [call.args[0], call.args[1]])
    for (const handle of handles()) {
      const found = arcs.some(
        ([x, y]) =>
          Math.abs((x as number) - handle.x) < 1e-6 && Math.abs((y as number) - handle.y) < 1e-6,
      )
      expect(found, handle.key).toBe(true)
    }
    expect(arcs.length).toBe(lay.count + 1)
  })
})

describe('the knobs of the upright plate', () => {
  it('have words that stand apart: no two neighbours in a row read as one', () => {
    const { face = [], labels = {} } = CANON_FACES.canon
    // The eight on the upright plate: the face, then the device's other knobs in their order.
    const eight = [...face, ...Object.keys(params).filter((name) => !face.includes(name))].slice(
      0,
      8,
    )
    expect(eight).toHaveLength(8)
    const word = (name: string): string => labels[name] ?? params[name].name
    for (const name of eight) expect(word(name).length, name).toBeLessThanOrEqual(9)
    // A knob's cell is 51 px and a capital with its spacing about 7: two words of more than 14
    // letters between them touch.
    for (const row of [eight.slice(0, 4), eight.slice(4)]) {
      for (let n = 0; n + 1 < row.length; n++) {
        const pair = word(row[n]).length + word(row[n + 1]).length
        expect(pair, `${word(row[n])} beside ${word(row[n + 1])}`).toBeLessThanOrEqual(14)
      }
    }
    // The four intervals keep their number, which is all that tells them apart.
    for (const n of [1, 2, 3, 4]) expect(word(`interval${n}`)).toBe(`Int ${n}`)
  })
})
