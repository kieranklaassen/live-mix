// The truth of the tails' displays: every figure they draw against the
// device's own formula, worked out by hand from its header or measured from
// its compiled code, and the handles against the figures they stand for.
//
// "The compiled device" is the device's .wasm run on its own: a tenth of a
// second of sound in, wet only, the power in windows of a tenth of a second
// as the mean of four to eight runs (other noise, or other phases of the
// notes, each run), and the time from the loudest window to 60 dB under it.
// One run alone reads short, most of all for a few notes: its level wavers
// by a few dB, so its loudest window is too loud and its first under the
// line too early.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SWARM_STEPS,
  TAILS_FACES,
  Tail,
  bandLevel,
  bloomFall,
  bloomIntensity,
  bloomLossDb,
  bloomRatios,
  expanseArrival,
  expanseFall,
  expanseLossDb,
  expansePass,
  expanseSeconds,
  expanseTailOf,
  fallEnd,
  fallThrough,
  foldVowel,
  formantsAt,
  hzOfNote,
  noteName,
  secondsText,
  settingThrough,
  shimmerLadder,
  stringSeconds,
  swarmEchoes,
  swarmFall,
  swarmLossDb,
  swarmOctaves,
  swarmSeconds,
  swarmTailOf,
  swarmTaps,
  sympatheticNotes,
  sympatheticScale,
  tailEnd,
  valleySeconds,
  valleyTail,
  vowelDb,
  vowelTailOf,
  wetDb,
  type BandFall,
} from '../components/displays/tails'
import { type DisplayHandle, type DisplaySignal } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  patchUnder,
  recordingContext,
  runDisplay,
  stockDescriptors,
  testLevel,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()

function face(id: string) {
  const descriptor = stock.get(id)
  if (!descriptor) throw new Error(`no device ${id}`)
  return { display: TAILS_FACES[id].display, params: descriptor.params, descriptor }
}

/** A display's handle by key, at some settings. */
function handleOf(id: string, key: string, values: Record<string, number> = {}): DisplayHandle {
  const { display, params } = face(id)
  const found = display.handles?.(viewOf(display, params, { values })).find((h) => h.key === key)
  if (!found) throw new Error(`${id} has no handle ${key}`)
  return found
}

/** How often a drawing stroked or filled in the accent. */
function accents(drawn: RecordingContext): number {
  return drawn.calls.filter(
    (call) =>
      (call.name === 'set strokeStyle' || call.name === 'set fillStyle') &&
      call.args[0] === PLAIN_COLOURS.accent,
  ).length
}

/** Every line stroked in the accent, as its points. */
function accentLines(drawn: RecordingContext): [number, number][][] {
  const lines: [number, number][][] = []
  let path: [number, number][] = []
  let colour: unknown = null
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') path = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      path.push([call.args[0] as number, call.args[1] as number])
    else if (call.name === 'set strokeStyle') colour = call.args[0]
    else if (call.name === 'stroke' && colour === PLAIN_COLOURS.accent) lines.push(path)
  }
  return lines
}

/** Everything stroked or filled in the accent that lies wholly in the tail's panel, as its points. */
function accentInTail(drawn: RecordingContext): [number, number][][] {
  const shapes: [number, number][][] = []
  let path: [number, number][] = []
  let stroke: unknown = null
  let fill: unknown = null
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') path = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      path.push([call.args[0] as number, call.args[1] as number])
    else if (call.name === 'set strokeStyle') stroke = call.args[0]
    else if (call.name === 'set fillStyle') fill = call.args[0]
    else if (
      (call.name === 'stroke' && stroke === PLAIN_COLOURS.accent) ||
      (call.name === 'fill' && fill === PLAIN_COLOURS.accent)
    ) {
      // The line between the two panels is at y 58: what the device alone does is all above it.
      if (path.length > 0 && path.every(([, y]) => y > 58)) shapes.push(path)
    }
  }
  return shapes
}

/** A sound of two levels and nothing else: what the taps give for a level going in and one coming out. */
function levels(input: number, output: number): DisplaySignal {
  return {
    input: testLevel(input),
    output: testLevel(output),
    spectrum: null,
    binHz: 0,
    left: null,
    right: null,
  }
}

/**
 * Run a display as the plate does until the plate lets it stand still, and
 * hand back the frame that is left standing. The plate (`DisplayRunner` of
 * PlateDisplay.tsx) draws a frame for every tick, counts the seconds in which
 * the levels going in and coming out are both at or under 80 dB below full
 * scale, and stops asking for frames once that has gone on for the display's
 * `live.settle`, or 8 s where it names none. `sound` gives the two levels at
 * a time since the start.
 */
function untilItStands(
  id: string,
  values: Record<string, number>,
  sound: (time: number) => [number, number],
): { left: RecordingContext; rest: RecordingContext; seconds: number } {
  const { display, params } = face(id)
  const fps = display.live?.fps ?? 30
  const settle = display.live?.settle ?? 8
  const state: unknown = display.init?.()
  let quiet = 0
  let left = recordingContext()
  for (let n = 0; n < 240 * fps; n++) {
    const time = n / fps
    const dt = n === 0 ? 0 : 1 / fps
    const [input, output] = sound(time)
    const frame = { values, signal: levels(input, output), now: 10 + time, dt }
    left = drawDisplay(display, params, { ...frame, state })
    quiet = input > 1e-4 || output > 1e-4 ? 0 : quiet + dt
    if (quiet >= settle) {
      // The picture at rest: the same frame drawn by a display that has heard nothing.
      return { left, rest: drawDisplay(display, params, frame), seconds: time }
    }
  }
  throw new Error(`${id} never stood still`)
}

/** Seconds for a band fall to be 60 dB down. */
function sixtyDown(fall: BandFall): number {
  let low = 0
  let high = 600
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2
    if (bandLevel(fall, mid) > -60) low = mid
    else high = mid
  }
  return high
}

/** The panels every one of them is drawn in, on a window of two columns (see `panels` in tails.ts). */
const OWN = { x: 4, y: 4, w: 120, h: 50 }
const TAIL = { x: 4, y: 61, w: 120, h: 35 }
const yOfTail = (db: number): number => TAIL.y + (TAIL.h * -db) / 60

describe('the tail every one of them shares', () => {
  it('says a time the way a player reads it', () => {
    expect(secondsText(0.32)).toBe('320 ms')
    expect(secondsText(5)).toBe('5.0 s')
    expect(secondsText(24)).toBe('24 s')
    expect(secondsText(161)).toBe('2.7 min')
    expect(secondsText(Infinity)).toBe('∞')
    // Under a second to the hundredth: a tail is not known to the millisecond.
    expect(secondsText(0.3162)).toBe('320 ms')
    expect(secondsText(0.961)).toBe('960 ms')
    expect(secondsText(0.997)).toBe('1.0 s')
    // A figure good to a twentieth is not said to a hundredth. Under ten seconds it is said
    // to the tenth, as every other tail is: "5 s" beside another display's "4.6 s" read as two
    // ways of writing a time.
    expect(secondsText(5.15, true)).toBe('5.2 s')
    expect(secondsText(2.04, true)).toBe('2.0 s')
    expect(secondsText(1.88, true)).toBe('1.9 s')
    expect(secondsText(0.64, true)).toBe('600 ms')
    expect(secondsText(9.7, true)).toBe('9.7 s')
    // Nor to the second where a twentieth is more than that: every other second from ten,
    // every fifth from 25. (Vowel Reverb at Decay 40: this gives 29.1 s, the device 31.0.)
    expect(secondsText(9.97, true)).toBe('10 s')
    expect(secondsText(16.25, true)).toBe('16 s')
    expect(secondsText(16.95, true)).toBe('16 s')
    expect(secondsText(29.1, true)).toBe('30 s')
    expect(secondsText(31.0, true)).toBe('30 s')
    expect(secondsText(29.1)).toBe('29 s')
    expect(secondsText(120, true)).toBe('2.0 min')
  })

  it('ends a fall of 60 dB at the foot, at the time it takes', () => {
    // 5 s on a panel of 10: half way along, on the foot.
    expect(fallEnd(TAIL, 10, 5)).toEqual([TAIL.x + TAIL.w / 2, TAIL.y + TAIL.h])
    // Begun 2 s in, it ends 2 s later.
    expect(fallEnd(TAIL, 10, 5, 2)[0]).toBeCloseTo(TAIL.x + TAIL.w * 0.7, 6)
  })

  it('leaves at the right edge where the panel is too short, as far down as it has fallen', () => {
    // 20 s on a panel of 10: 30 dB down at the edge, half way to the foot.
    const [x, y] = fallEnd(TAIL, 10, 20)
    expect(x).toBe(TAIL.x + TAIL.w)
    expect(y).toBeCloseTo(TAIL.y + TAIL.h / 2, 6)
    // A tail without end stays at the top.
    expect(fallEnd(TAIL, 10, Infinity)).toEqual([TAIL.x + TAIL.w, TAIL.y])
  })

  it('reads the same time back from the point it put the end at', () => {
    for (const from of [0, 0.4, 1.63]) {
      for (const rt60 of [0.5, 3, 7.5, 12, 40, 300]) {
        const [x, y] = fallEnd(TAIL, 12, rt60, from)
        expect(fallThrough(TAIL, 12, x, y, from) / rt60).toBeCloseTo(1, 4)
      }
    }
  })

  it('draws a tail out further for a hand that goes on past the right edge', () => {
    // 40 s on a 12 s panel: its end stands on the right edge, part of the way down.
    const [x, y] = fallEnd(TAIL, 12, 40)
    expect(x).toBe(TAIL.x + TAIL.w)
    expect(fallThrough(TAIL, 12, x + 25, y)).toBeGreaterThan(41)
    expect(fallThrough(TAIL, 12, x - 25, y)).toBeLessThan(39)
  })

  it('adds a fall up band by band: fast while the edges die, then at the rate of what is left', () => {
    // Two bands as loud as each other, one dying at 10 dB a second and one at 60.
    const fall: BandFall = { rates: [10, 60], weights: [1, 1] }
    expect(bandLevel(fall, 0)).toBeCloseTo(0, 9)
    // After a second: 10 log10((0.1 + 0.000001) / 2) = -13.01 dB.
    expect(bandLevel(fall, 1)).toBeCloseTo(-13.01, 2)
    // Late, only the slow band is left, 3 dB under where it alone would be: 60 dB down at 5.7 s, not 6.
    expect(sixtyDown(fall)).toBeCloseTo(5.699, 2)
  })

  it('adds many bands up as the plain sum does, to a twentieth of a dB', () => {
    // 360 bands with rates from 8 to 300 dB a second, in no order, some of them silent: the
    // level takes bands with rates near each other as one and stops where the rest is nothing.
    const rates: number[] = []
    const weights: number[] = []
    for (let n = 0; n < 360; n++) {
      rates.push(8 * Math.pow(300 / 8, ((n * 197) % 360) / 359))
      weights.push(n % 11 === 0 ? 0 : 1 + ((n * 37) % 17))
    }
    const plain = (sec: number): number => {
      let sum = 0
      let all = 0
      rates.forEach((rate, n) => {
        all += weights[n]
        sum += weights[n] * Math.pow(10, (-rate * sec) / 10)
      })
      return 10 * Math.log10(sum / all)
    }
    const fall: BandFall = { rates, weights }
    expect(bandLevel(fall, 0)).toBeCloseTo(0, 9)
    // Down to the foot (60.9 dB down at 5.5 s) it is out by under a twentieth of a dB.
    for (const sec of [0.01, 0.1, 0.5, 1, 2, 4, 5, 5.5]) {
      expect(Math.abs(bandLevel(fall, sec) - plain(sec))).toBeLessThan(0.05)
    }
    expect(plain(5.5)).toBeCloseTo(-60.88, 2)
    expect(Math.abs(bandLevel(fall, 7.5) - plain(7.5))).toBeLessThan(0.1)
    // Nothing in it is no sound at all, not a fault.
    expect(bandLevel({ rates: [10], weights: [0] }, 1)).toBeLessThan(-100)
  })

  it('stands a curved tail on the foot where it is 60 dB down, and finds the setting that ends there', () => {
    // A tail that waits 1 s, is at its highest after 2, and then falls 60 dB in `value` seconds.
    const tailOf = (value: number): Tail =>
      new Tail(
        1,
        2,
        (sec) => -20 * (2 - sec),
        (sec) => (-60 * sec) / value,
      )
    const tail = tailOf(4)
    expect(tail.level(0.5)).toBeLessThan(-100)
    expect(tail.level(1.5)).toBe(-10)
    expect(tail.level(4)).toBe(-30)
    expect(tail.seconds).toBeCloseTo(4, 6)
    // On a panel of 12 s it leaves the foot at 6 s; on one of 4 s at the right edge, 30 dB down.
    expect(tailEnd(tail, TAIL, 12)[0]).toBeCloseTo(TAIL.x + TAIL.w / 2, 4)
    expect(tailEnd(tail, TAIL, 4)).toEqual([TAIL.x + TAIL.w, TAIL.y + TAIL.h / 2])
    // The setting whose tail ends at a point: the foot at 8 s is 6 s after the highest.
    const [x, y] = tailEnd(tail, TAIL, 12)
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, x, y)).toBeCloseTo(4, 3)
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, TAIL.x + (TAIL.w * 8) / 12, y)).toBeCloseTo(
      6,
      3,
    )
    // Past either end of the range it stops there; the top of the right edge is the longest.
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, TAIL.x, y)).toBeCloseTo(0.5, 3)
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, TAIL.x + TAIL.w, TAIL.y)).toBe(30)
    // An end on the right edge, half way down: 24 s. A hand that goes on to the right draws it out.
    const half = TAIL.y + TAIL.h / 2
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, TAIL.x + TAIL.w, half)).toBeCloseTo(20, 2)
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, TAIL.x + TAIL.w * 1.25, half)).toBeCloseTo(
      26,
      2,
    )
  })

  it('takes the nearer side where the tail jumps from one setting to the next', () => {
    // A tail that falls 60 dB in `value` seconds, and from 29 on does not fall at all:
    // 6 s in it is 12.4 dB down just under 29 and not down at all from there.
    const tailOf = (value: number): Tail =>
      new Tail(0, 0, null, (sec) => (value >= 29 ? 0 : (-60 * sec) / value))
    const x = TAIL.x + TAIL.w / 2
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, x, yOfTail(-20))).toBeCloseTo(18, 3)
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, x, yOfTail(-10))).toBeCloseTo(29, 3)
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, x, yOfTail(-10))).toBeLessThan(29)
    // Nearer the tail that does not fall, the setting is the top: every setting from 29 draws the same.
    expect(settingThrough(tailOf, 0.5, 30, TAIL, 12, x, yOfTail(-3))).toBe(30)
  })

  it('lights a hit where it has got to on its way down the tail', () => {
    // A hit of a tenth of a second into Bloom at Decay 5, then nothing for 3 s. Mix is full
    // up: the tail alone comes out, and the lit part stands on the fall itself.
    const { display, params } = face('bloom-reverb')
    const drawn = runDisplay(
      display,
      params,
      3,
      { values: { mix: 1 }, signal: testSignal(0, 0) },
      (time) => ({ signal: testSignal(time < 0.1 ? 0.5 : 0, 0.2) }),
    )
    const lines = accentLines(drawn)
    expect(lines).toHaveLength(1)
    const lit = lines[0].filter(([, y]) => y < TAIL.y + TAIL.h - 0.75)
    // It stands 2.9 s along a panel of 10 s...
    const highest = lit.reduce((top, point) => (point[1] < top[1] ? point : top))
    expect(highest[0]).toBeGreaterThan(TAIL.x + TAIL.w * 0.28)
    expect(highest[0]).toBeLessThan(TAIL.x + TAIL.w * 0.305)
    // ...as far down as the tail is 2.9 s after the sound: Bloom's own fall, begun 0.28 s in.
    const sec = ((highest[0] - TAIL.x) / TAIL.w) * 10
    expect(Math.abs(highest[1] - yOfTail(bandLevel(bloomFall(5), sec - 0.283)))).toBeLessThan(1)
    // Nothing else is lit: only the slots the hit went into.
    expect(lit.length).toBeLessThanOrEqual(3)
  })

  it('lights the whole fall for a drone, and nothing in silence', () => {
    const { display, params } = face('sympathetic')
    // Mix and Sympathy full up: all of what the strings give comes out.
    const values = { mix: 1, sympathy: 1 }
    // Sympathetic at Decay 3 on a panel of 8 s: the straight fall ends at 3 s.
    const drone = runDisplay(display, params, 9, { values, signal: testSignal(0.3, 0.2) })
    const lit = accentLines(drone).find((line) => line.length > 100)
    expect(lit).toBeDefined()
    for (const sec of [0.5, 1, 2, 2.9]) {
      const x = TAIL.x + (TAIL.w * sec) / 8
      const near = (lit ?? []).reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a))
      expect(
        Math.abs(near[1] - yOfTail((-60 * ((near[0] - TAIL.x) / TAIL.w) * 8) / 3)),
      ).toBeLessThan(0.6)
    }
    // A quieter sound after a louder one lies under the fall by what it is quieter: 20 dB.
    const two = runDisplay(
      display,
      params,
      2,
      { values, signal: testSignal(0.5, 0.2) },
      (time) => ({ signal: testSignal(time < 1 ? 0.5 : 0.05, 0.2) }),
    )
    const steps = accentLines(two).find((line) => line.length > 100) ?? []
    const at = (sec: number): number => {
      const x = TAIL.x + (TAIL.w * sec) / 8
      return steps.reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a))[1]
    }
    // Half a second ago the quiet one went in: 10 dB down the fall and 20 dB under it.
    expect(Math.abs(at(0.5) - yOfTail(-10 - 20))).toBeLessThan(1)
    // A second and a half ago the loud one did: on the fall itself, 30 dB down.
    expect(Math.abs(at(1.5) - yOfTail(-30))).toBeLessThan(1)
    const quiet = runDisplay(display, params, 1, { values, signal: testSignal(0, 0) })
    expect(accents(quiet)).toBe(0)
    // Switched off, nothing goes in.
    const off = runDisplay(display, params, 1, {
      values,
      signal: testSignal(0.3, 0.2),
      powered: false,
    })
    expect(accents(off)).toBe(0)
  })

  it('lets through what the equal-power mix of the kit lets through (by hand)', () => {
    // `kit::equal_power`: the wet gain is sin(mix · 90°). Half way it is 0.7071, 3.01 dB down;
    // at a quarter sin(22.5°) = 0.3827, 8.34 dB down; at 0 nothing, which is the floor.
    expect(wetDb(1)).toBeCloseTo(0, 9)
    expect(wetDb(0.5)).toBeCloseTo(-3.0103, 3)
    expect(wetDb(0.25)).toBeCloseTo(-8.343, 2)
    expect(wetDb(0)).toBe(-120)
    expect(wetDb(-1)).toBe(-120)
    expect(wetDb(2)).toBeCloseTo(0, 9)
  })

  it.each(Object.keys(TAILS_FACES))(
    '%s lights in its tail only what Mix lets out of it: nothing at 0, less at little',
    (id) => {
      const { display, params } = face(id)
      expect(display.params).toContain('mix')
      // Sympathetic's strings are driven by Sympathy too: full up here, and on its own below.
      const rest: Record<string, number> = id === 'sympathetic' ? { sympathy: 1 } : {}
      /** What is lit in the tail's panel after two seconds of a steady sound, as the line it is drawn with. */
      const lit = (values: Record<string, number>): [number, number][] => {
        const drawn = runDisplay(display, params, 2, {
          values: { ...rest, ...values },
          signal: testSignal(0.3, 0.2),
        })
        return accentInTail(drawn).reduce((a, b) => (b.length > a.length ? b : a), [])
      }
      // At 0 no reverb comes out, and nothing is lit.
      expect(lit({ mix: 0 }), 'Mix 0').toEqual([])
      const all = lit({ mix: 1 })
      const little = lit({ mix: 0.25 })
      expect(all.length, 'Mix 1').toBeGreaterThan(100)
      expect(little).toHaveLength(all.length)
      // At a quarter the wet gain is 8.34 dB down: every point of what is lit stands that much
      // lower, where the top and the foot of the panel do not hold it.
      const lower = (TAIL.h * 8.343) / 60
      const free = all
        .map(([, y], i) => [y, little[i][1]])
        .filter(([high, low]) => high > TAIL.y + 0.01 && low < TAIL.y + TAIL.h - 0.01)
      expect(free.length).toBeGreaterThan(3)
      for (const [high, low] of free) expect(low - high).toBeCloseTo(lower, 2)
      if (id !== 'sympathetic') return
      // `process()` of sympathetic.h drives the strings with the sound times Sympathy: at half,
      // 6.02 dB less of them; at 0 they are not driven at all.
      expect(display.params).toContain('sympathy')
      expect(lit({ mix: 1, sympathy: 0 }), 'Sympathy 0').toEqual([])
      const half = lit({ mix: 1, sympathy: 0.5 })
      const held = all
        .map(([, y], i) => [y, half[i][1]])
        .filter(([high, low]) => high > TAIL.y + 0.01 && low < TAIL.y + TAIL.h - 0.01)
      expect(held.length).toBeGreaterThan(3)
      for (const [high, low] of held) expect(low - high).toBeCloseTo((TAIL.h * 6.0206) / 60, 2)
    },
  )

  it.each(Object.keys(TAILS_FACES))(
    '%s is left as it is at rest when the plate stops it after a sound that fades away or stops dead',
    (id) => {
      const { display, params } = face(id)
      // The longest tail the knob gives: what has gone in stays high in the panel for longest.
      const long: Record<string, number> =
        id === 'swarm-reverb' ? { feedback: 0.95 } : { decay: params.decay.max }
      /** Four seconds of sound, then a fall of `rate` dB a second, going in and coming out alike. */
      const fading =
        (rate: number) =>
        (time: number): [number, number] => {
          const gain = time < 4 ? 1 : Math.pow(10, (-rate * (time - 4)) / 20)
          return [0.5 * gain, 0.3 * gain]
        }
      const stopped = (time: number): [number, number] => (time < 4 ? [0.5, 0.3] : [0, 0])
      const cases: [string, Record<string, number>, (time: number) => [number, number]][] = [
        ['stopped dead, at the defaults', {}, stopped],
        ['stopped dead, with the longest tail', long, stopped],
        ...[3, 5, 12, 40].map(
          (rate): [string, Record<string, number>, (time: number) => [number, number]] => [
            `faded at ${rate} dB a second`,
            {},
            fading(rate),
          ],
        ),
      ]
      // It runs on until the last sound has left the panel, which is longer than the plate's own 8 s.
      expect(display.live?.settle ?? 8).toBeGreaterThanOrEqual(8)
      for (const [what, values, sound] of cases) {
        const { left, rest } = untilItStands(id, values, sound)
        expect(accentInTail(left), `${id}, ${what}: lit in the tail`).toEqual([])
        expect(accents(left), `${id}, ${what}: in the accent`).toBe(0)
        expect(left.print() === rest.print(), `${id}, ${what}: the picture at rest`).toBe(true)
      }
    },
    30_000,
  )

  it('writes the sign for a tail without end larger than its figures, as the rooms do', () => {
    /** The size of type a word was written in. */
    const sizeOf = (drawn: RecordingContext, words: string): number => {
      let size = 0
      for (const call of drawn.calls) {
        if (call.name === 'set font') size = parseFloat(String(call.args[0]))
        else if (call.name === 'fillText' && call.args[0] === words) return size
      }
      throw new Error(`"${words}" was not written`)
    }
    for (const [id, values] of [
      ['expanse', { decay: 60 }],
      ['swarm-reverb', { feedback: 1 }],
    ] as const) {
      const { display, params } = face(id)
      const drawn = drawDisplay(display, params, { values })
      expect(sizeOf(drawn, '∞'), id).toBe(13)
      // It stands at the foot, under the tail that runs level across the top, inside the panel.
      const said = drawn.calls.find((call) => call.name === 'fillText' && call.args[0] === '∞')
      const [, x, y] = said?.args as [string, number, number]
      expect(x, id).toBeGreaterThanOrEqual(TAIL.x)
      expect(y, id).toBeLessThan(TAIL.y + TAIL.h)
      expect(y - 13, id).toBeGreaterThan(TAIL.y)
    }
    // A figure keeps the size of the figures.
    const { display, params } = face('expanse')
    expect(sizeOf(drawDisplay(display, params), '9.2 s')).toBe(8)
  })

  it('marks a sound that begins, and not one that only goes on', () => {
    const { display, params } = face('shimmer')
    /** The upright lines in the accent that cross the upper panel. */
    const heads = (drawn: RecordingContext): number[] =>
      accentLines(drawn)
        .filter((line) => line.length === 2 && line[0][0] === line[1][0])
        .filter((line) => Math.abs(line[0][1] - line[1][1]) > OWN.h - 2)
        .map((line) => line[0][0])
    // A hit every second: after 3.5 s the last began half a second ago, on a panel of 12 s.
    const hits = runDisplay(display, params, 3.5, { signal: testSignal(0, 0) }, (time) => ({
      signal: testSignal(time % 1 < 0.1 ? 0.5 : 0.01, 0.2),
    }))
    expect(heads(hits)).toHaveLength(1)
    expect(heads(hits)[0]).toBeGreaterThan(OWN.x + (OWN.w * 0.4) / 12)
    expect(heads(hits)[0]).toBeLessThan(OWN.x + (OWN.w * 0.6) / 12)
    // A drone begins once: its mark crosses the panel and is gone, and does not stand at the left.
    const early = runDisplay(display, params, 2, { signal: testSignal(0.3, 0.2) })
    expect(heads(early)[0]).toBeGreaterThan(OWN.x + (OWN.w * 1.8) / 12)
    const late = runDisplay(display, params, 13, { signal: testSignal(0.3, 0.2) })
    expect(heads(late)).toHaveLength(0)
  })

  it.each(Object.keys(TAILS_FACES))('%s is a window of two columns with four knobs', (id) => {
    const { display, params } = face(id)
    expect(display.place).toBe('window')
    expect(display.columns ?? 2).toBe(2)
    const knobs = TAILS_FACES[id].face ?? []
    expect(knobs).toHaveLength(4)
    for (const name of knobs) expect(Object.keys(params)).toContain(name)
  })

  it.each(Object.keys(TAILS_FACES))('%s has nothing in the accent at rest', (id) => {
    const { display, params, descriptor } = face(id)
    expect(accents(drawDisplay(display, params))).toBe(0)
    // Nor with readings that have not come yet, which read 0.
    const meters = Object.fromEntries(Object.keys(descriptor.meters ?? {}).map((key) => [key, 0]))
    expect(accents(drawDisplay(display, params, { meters }))).toBe(0)
  })
})

describe('Bloom', () => {
  it('shifts by a third of Bloom at once and all of it once the tail is old', () => {
    // SpectralDrifter::process: intensity = bloom * (0.3 + 0.7 * age).
    expect(bloomIntensity(1, 0)).toBeCloseTo(0.3, 9)
    expect(bloomIntensity(1, 1)).toBe(1)
    expect(bloomIntensity(0.5, 0.5)).toBeCloseTo(0.325, 9)
    expect(bloomIntensity(1, 3)).toBe(1)
  })

  it('reaches the interval at full intensity and only part of the way before', () => {
    // 5th, Octave and 5th+Oct, going up.
    expect(bloomRatios(0, 0, 1)[0]).toBeCloseTo(2 ** (7 / 12), 9)
    expect(bloomRatios(1, 0, 1)).toEqual([2])
    expect(bloomRatios(2, 0, 1)).toHaveLength(2)
    // A fresh tail at Bloom 1 plays 30 % of the way from unison to the octave.
    expect(bloomRatios(1, 0, 0.3)[0]).toBeCloseTo(1.3, 9)
    // Down is the same interval below; Scatter is both at once.
    expect(bloomRatios(1, 1, 1)).toEqual([0.5])
    expect(bloomRatios(1, 2, 1)).toEqual([2, 0.5])
    // Atonal has no interval: an octave at full, less than that before.
    expect(bloomRatios(3, 0, 1)).toEqual([2])
    expect(bloomRatios(3, 0, 0.5)[0]).toBeCloseTo(1 + (Math.SQRT2 - 1) * 0.5, 9)
  })

  it('drifts as the drifter does, in semitones (by hand)', () => {
    // Bloom 0.5, an octave up. Fresh: intensity 0.15, ratio 1.15, 12 log2(1.15) = 2.42 semitones.
    const fresh = bloomRatios(1, 0, bloomIntensity(0.5, 0))[0]
    expect(12 * Math.log2(fresh)).toBeCloseTo(2.42, 2)
    // Old: intensity 0.5, ratio 1.5, 7.02 semitones.
    const old = bloomRatios(1, 0, bloomIntensity(0.5, 1))[0]
    expect(12 * Math.log2(old)).toBeCloseTo(7.02, 2)
  })

  it('loses to the damping and the DC blocker on every trip what the header says (by hand)', () => {
    // At 48 kHz the damping pole is 0.45^(44100/48000) = 0.48016 and the blocker's 0.995405.
    // 1 kHz: damping 0.27023 / 0.27844 = -0.130 dB, blocker +0.015 dB.
    expect(bloomLossDb(1000, 48000)).toBeCloseTo(-0.115, 2)
    // 8 kHz (cos = 0.5): damping 0.27023 / 0.75039 = -4.435 dB, blocker +0.020 dB.
    expect(bloomLossDb(8000, 48000)).toBeCloseTo(-4.415, 2)
    // 20 Hz: only the blocker, (2 - 2 cos) / (1 + p² - 2 p cos) = 6.8539e-6 / 2.7984e-5: -6.1 dB.
    expect(bloomLossDb(20, 48000)).toBeCloseTo(-6.11, 1)
  })

  it('falls 60 dB sooner than Decay, by what the damping takes (the compiled device: 0.98, 4.56, 10.3 and 24.0 s)', () => {
    // A mean line is 6372 samples at 44.1 kHz, 0.1445 s: at 1 kHz Decay 5 is 12 + 0.115 / 0.1445 dB a second.
    const fall = bloomFall(5)
    expect(60 / 5 - bloomLossDb(1000) / 0.14449).toBeCloseTo(12.8, 1)
    expect(Math.min(...fall.rates)).toBeGreaterThan(12)
    expect(Math.min(...fall.rates)).toBeLessThan(12.5)
    // Decay 1 with a fiftieth of a second of sound: a tenth is itself a tenth of that tail.
    for (const [decay, measured] of [
      [1, 0.98],
      [5, 4.56],
      [12, 10.26],
      [30, 23.99],
    ]) {
      expect(Math.abs(sixtyDown(bloomFall(decay)) / measured - 1)).toBeLessThan(0.04)
    }
  })

  it('says the time the whole really takes', () => {
    const { display, params } = face('bloom-reverb')
    expect(drawDisplay(display, params).words()).toContain('4.6 s')
    expect(drawDisplay(display, params, { values: { decay: 30 } }).words()).toContain('24 s')
  })

  it('marks the pitch now from the device once sound runs', () => {
    const { display, params } = face('bloom-reverb')
    const still = runDisplay(display, params, 0.5, { signal: testSignal() })
    const marked = runDisplay(display, params, 0.5, {
      signal: testSignal(),
      meters: { age: 0.5, drift: 0.6 },
    })
    expect(accents(marked)).toBeGreaterThan(accents(still))
  })

  it('sets Decay from where the tail is let go', () => {
    const handle = handleOf('bloom-reverb', 'decay')
    // The handle stands where the tail is 60 dB down: 0.28 s to its highest and 4.57 s from there.
    expect(handle.x).toBeCloseTo(TAIL.x + (TAIL.w * (0.283 + 4.57)) / 10, 0)
    expect(handle.y).toBe(TAIL.y + TAIL.h)
    expect(handle.drag(handle.x, handle.y).decay).toBeCloseTo(5, 2)
    // Let go on the foot at 2.2 s, the tail is to end there: 1.92 s from its highest, which is Decay 2.03.
    const shorter = handle.drag(TAIL.x + (TAIL.w * 2.2) / 10, TAIL.y + TAIL.h).decay
    expect(sixtyDown(bloomFall(shorter))).toBeCloseTo(2.2 - 0.283, 2)
    // It stops at the ends of the knob.
    expect(handle.drag(TAIL.x, TAIL.y + TAIL.h).decay).toBeCloseTo(1, 3)
    expect(handle.drag(TAIL.x + TAIL.w, TAIL.y).decay).toBe(30)
  })
})

describe('Shimmer', () => {
  const plain = {
    decay: 8,
    shimmer: 0,
    interval: 0,
    size: 0.5,
    tone: 8000,
    predelay: 0,
    lowCut: 100,
  }
  const patch = { ...plain, shimmer: 0.5, tone: 6000, predelay: 20 }

  it('makes a trip round the tank the mean line long, scaled by Size', () => {
    const middle = shimmerLadder(plain, 4).pass
    expect(middle).toBeCloseTo(0.0706, 3)
    expect(shimmerLadder({ ...plain, size: 0 }, 4).pass).toBeCloseTo(middle / 2, 9)
    expect(shimmerLadder({ ...plain, size: 1 }, 4).pass).toBeCloseTo(middle * 1.5, 9)
  })

  it('with no Shimmer is a plain tail that falls 60 dB in Decay', () => {
    const ladder = shimmerLadder(plain, 30)
    // The note at 220 Hz loses next to nothing to Tone at 8 kHz.
    expect(ladder.rt60).toBeGreaterThan(7.8)
    expect(ladder.rt60).toBeLessThan(8.05)
    // Nothing has climbed.
    expect(Math.max(...ladder.rungs[1])).toBeLessThanOrEqual(-119)
  })

  it('steps by the interval', () => {
    expect(shimmerLadder(plain, 4).ratio).toBe(2)
    expect(shimmerLadder({ ...plain, interval: 1 }, 4).ratio).toBe(1.5)
    expect(shimmerLadder({ ...plain, interval: 3 }, 4).ratio).toBe(0.5)
  })

  it('takes as long to fall 60 dB as the compiled device does, to a twentieth', () => {
    // Measured with a tenth of a second of notes round 220 Hz, the mean of eight runs.
    const measured: [Partial<typeof patch>, number][] = [
      [{}, 5.25],
      [{ shimmer: 0 }, 7.79],
      [{ shimmer: 0.25 }, 6.95],
      [{ shimmer: 1 }, 3.77],
      [{ decay: 2 }, 1.92],
      [{ decay: 20 }, 8.99],
      [{ decay: 20, shimmer: 1 }, 6.14],
      [{ decay: 30, shimmer: 0 }, 27.79],
      [{ decay: 30, shimmer: 1, interval: 3 }, 6.96],
      [{ interval: 1 }, 5.51],
      [{ tone: 2000 }, 4.9],
      [{ size: 1 }, 6.02],
    ]
    for (const [change, seconds] of measured) {
      const model = shimmerLadder({ ...patch, ...change }, 40).rt60
      expect(Math.abs(model / seconds - 1), JSON.stringify(change)).toBeLessThan(0.065)
    }
    // The worst found: Size 0, 4.3 s measured.
    expect(Math.abs(shimmerLadder({ ...patch, size: 0 }, 40).rt60 / 4.3 - 1)).toBeLessThan(0.1)
    // At Decay 0.5 the device takes 0.65 s with a short sound: longer than Decay, by the shifter's own delay.
    expect(shimmerLadder({ ...patch, decay: 0.5 }, 40).rt60).toBeCloseTo(0.65, 1)
    // So the more is sent up the sooner it is over.
    expect(shimmerLadder({ ...patch, shimmer: 1 }, 40).rt60).toBeLessThan(
      shimmerLadder(patch, 40).rt60,
    )
  })

  it('holds each rung as far under the note as the compiled device does', () => {
    // Decay 20, Shimmer 0.5, a second after the note: the rungs measured -9.8, -16.6 and -26.1 dB
    // against a first rung at -10.4 (one burst, so a few dB either way).
    const ladder = shimmerLadder({ ...patch, decay: 20 }, 12)
    const pass = Math.round((1 - ladder.from) / ladder.pass)
    const under = ladder.rungs.map((rung) => rung[pass] - ladder.rungs[0][pass])
    expect(Math.abs(under[1] - 0.6)).toBeLessThan(5)
    expect(Math.abs(under[2] - -6.2)).toBeLessThan(5)
    expect(Math.abs(under[3] - -15.7)).toBeLessThan(5)
    // A shifter gives back 3/8 of the power it is given: with all of it the next rung would stand 4 dB higher.
    expect(under[2]).toBeLessThan(under[1] - 3)
  })

  it('lets Tone stop the climb', () => {
    const second = (tone: number): number[] => {
      const ladder = shimmerLadder({ ...plain, shimmer: 0.7, tone }, 8)
      const pass = Math.round(1 / ladder.pass)
      return ladder.rungs.map((rung) => rung[pass])
    }
    const dark = second(2000)
    const bright = second(12000)
    // The fourth rung is 3520 Hz: over a dark Tone's ceiling, under a bright one's.
    expect(bright[4] - dark[4]).toBeGreaterThan(20)
    // The note itself is far under both.
    expect(Math.abs(bright[0] - dark[0])).toBeLessThan(2)
  })

  it('says the time the whole really takes, to the tenth under ten seconds, and names its note', () => {
    const { display, params } = face('shimmer')
    const words = drawDisplay(display, params).words()
    expect(words).toContain('+12')
    // 5.14 s by the ladder, 5.15 on the compiled device.
    expect(words).toContain('5.1 s')
    expect(words).not.toContain('5 s')
    expect(words).toContain('220 Hz note')
    // Two seconds and more are not said in whole seconds: Decay 2.5 with no Shimmer is 2.5 s.
    const plain = drawDisplay(display, params, { values: { decay: 2.5, shimmer: 0, tone: 16000 } })
    expect(plain.words()).toContain('2.5 s')
    // A fall longer than the panel is still said in full.
    const long = drawDisplay(display, params, { values: { decay: 30, shimmer: 0, tone: 16000 } })
    expect(long.words()).toContain('30 s')
  })

  it('takes Decay from the straight line', () => {
    const handle = handleOf('shimmer', 'decay')
    expect(handle.drag(handle.x, handle.y).decay).toBeCloseTo(8, 2)
    // Decay 8 on a panel of 12 s: the handle has room on both sides.
    expect(handle.x).toBeCloseTo(TAIL.x + (TAIL.w * 8.02) / 12, 6)
    // The line begins 20 ms in: the foot at half way is 5.98 s.
    expect(handle.drag(TAIL.x + TAIL.w / 2, TAIL.y + TAIL.h).decay).toBeCloseTo(5.98, 2)
  })
})

describe('Expanse', () => {
  const room = { size: 0.9, decay: 10, gravity: 0, density: 0.7, decayMost: 60 }
  const patch = {
    size: 0.5,
    decay: 10,
    gravity: 0,
    density: 0.8,
    decayMost: 60,
    lowCut: 80,
    highCut: 7000,
    modDepth: 0.4,
  }

  it('reads Size in seconds as the device does', () => {
    expect(expanseSeconds(0)).toBeCloseTo(0.04, 9)
    expect(expanseSeconds(1)).toBeCloseTo(2.5, 9)
    expect(expanseSeconds(0.5)).toBeCloseTo(Math.sqrt(0.04 * 2.5), 9)
  })

  it('answers first after the shortest way to a tap, 9 % of a Size (measured: 0.09)', () => {
    for (const size of [0, 0.5, 1]) {
      const arrival = expanseArrival({ ...room, size })
      expect(arrival.first / arrival.seconds).toBeGreaterThan(0.08)
      expect(arrival.first / arrival.seconds).toBeLessThan(0.1)
    }
  })

  it('swells later with Gravity (measured at Size 0.9: full at 2.1 s with Gravity 1)', () => {
    const near = expanseArrival(room)
    const far = expanseArrival({ ...room, gravity: 1 })
    expect(near.peak).toBeLessThan(0.8)
    expect(far.peak).toBeGreaterThan(1.4)
    expect(far.peak).toBeLessThan(2.3)
    // With Gravity the first echoes are far under the swell.
    const early = Math.round((near.first * 1.5) / near.slot)
    expect(far.level[early]).toBeLessThan(near.level[early] - 10)
  })

  it('loses to the two cuts and the swept reads on every pass what the header says (by hand)', () => {
    // A pass at Size 0.5: 0.31623 s x (0.78565 + 0.231 x 0.9675) = 0.3191 s.
    expect(expansePass(0.5)).toBeCloseTo(0.3191, 4)
    // 1 kHz: the cuts take 0.0015 dB; a swept read keeps 1 - 0.008555 / 3 of the power, which in
    // an allpass of 0.62 x 0.8 is 0.99715: three of them, -0.0372 dB.
    expect(expanseLossDb(1000, patch, 48000)).toBeCloseTo(-0.0387, 3)
    // 5 kHz: High Cut at 7 kHz takes 1 / (1 + 0.68835^4) = -0.880 dB, the reads 3 x -0.3029 dB.
    expect(expanseLossDb(5000, patch, 48000)).toBeCloseTo(-1.788, 2)
    // With no Mod Depth the reads are on whole samples and lose nothing.
    expect(expanseLossDb(5000, { ...patch, modDepth: 0 }, 48000)).toBeCloseTo(-0.88, 2)
  })

  it('loses what the cuts and the swept reads take, band by band', () => {
    // Decay 10 is 6 dB a second; at 1 kHz a pass of 0.3191 s costs 0.0387 dB more: 6.12 dB a second.
    expect(expanseFall(patch).rates[16]).toBeCloseTo(6 + 0.0387 / 0.3191, 2)
    // At the top of Decay the decay gain is 1: the middle loses only what the swept reads take.
    expect(Math.min(...expanseFall({ ...patch, decay: 60 }).rates)).toBeLessThan(0.1)
    expect(Math.min(...expanseFall({ ...patch, decay: 60, modDepth: 0 }).rates)).toBeLessThan(0.01)
  })

  it('falls 60 dB a little sooner than Decay, as the compiled device does', () => {
    // From the loudest tenth of a second, at the defaults but for what is named.
    const measured: [Partial<typeof patch>, number][] = [
      [{}, 9.34],
      [{ decay: 3 }, 2.88],
      [{ decay: 30 }, 26.96],
      [{ gravity: 1 }, 9.53],
      [{ modDepth: 0 }, 9.74],
      [{ lowCut: 400, highCut: 2000 }, 7.47],
      [{ density: 0 }, 9.29],
    ]
    for (const [change, seconds] of measured) {
      const model = expanseTailOf({ ...patch, ...change }).seconds
      expect(Math.abs(model / seconds - 1), JSON.stringify(change)).toBeLessThan(0.035)
    }
  })

  it('rings on for a few Sizes whatever Decay says, as the compiled device does', () => {
    // The allpasses that spread a sound are not in the decay gain's reach. Measured: when the sound
    // is 60 dB under its loudest, in seconds since it went in.
    const measured: [Partial<typeof patch>, number][] = [
      [{ decay: 0.5 }, 0.9],
      [{ decay: 0.5, gravity: 1 }, 1.5],
      [{ decay: 0.5, size: 1 }, 5.51],
      [{ decay: 0.5, size: 1, gravity: 1 }, 12.03],
      [{ decay: 3, size: 1, gravity: 1 }, 12.03],
      [{ size: 1 }, 11.86],
    ]
    for (const [change, seconds] of measured) {
      const tail = expanseTailOf({ ...patch, ...change })
      expect(
        Math.abs((tail.from + tail.seconds) / seconds - 1),
        JSON.stringify(change),
      ).toBeLessThan(0.05)
    }
    // Decay alone would end the first of them in half a second.
    expect(expanseTailOf({ ...patch, decay: 0.5, size: 1, gravity: 1 }).seconds).toBeGreaterThan(8)
  })

  it('steps down pass by pass in a large space, as the compiled device does', () => {
    // Size 1, Decay 10: the first pass is level to 2.5 s, the second 15 dB under it (measured:
    // -0.2 dB at 2.5 s, -14.9 at 3.75 s, -17.3 at 4.75 s, -31.9 at 7 s).
    const tail = expanseTailOf({ ...patch, size: 1 })
    expect(tail.level(2.5)).toBeGreaterThan(-2.5)
    expect(Math.abs(tail.level(3.75) - -14.9)).toBeLessThan(2.5)
    expect(Math.abs(tail.level(4.75) - -17.3)).toBeLessThan(2.5)
    expect(Math.abs(tail.level(7) - -31.9)).toBeLessThan(2.5)
    // It never rises again once it has been at its highest.
    let last = 0
    for (let sec = tail.from; sec < 20; sec += 0.05) {
      expect(tail.level(sec)).toBeLessThanOrEqual(last + 1e-6)
      last = tail.level(sec)
    }
  })

  it('says the time the whole takes, minutes at the top of the knob, and held when frozen', () => {
    const { display, params } = face('expanse')
    expect(drawDisplay(display, params).words()).toContain('9.2 s')
    // At the top of Decay only the filters take anything: more than ten minutes at the defaults,
    // 2.7 minutes in the smallest space (the compiled device: 20 dB in 40 s, 60 in some 160).
    expect(drawDisplay(display, params, { values: { decay: 60 } }).words()).toContain('∞')
    expect(expanseTailOf({ ...patch, decay: 60, size: 0 }).seconds / 160).toBeCloseTo(1, 1)
    expect(drawDisplay(display, params, { values: { decay: 60, size: 0 } }).words()).toContain(
      '2.7 min',
    )
    expect(drawDisplay(display, params, { values: { freeze: 1 } }).words()).toContain('held')
    // The Size said is the device's.
    expect(drawDisplay(display, params, { values: { size: 1 } }).words()).toContain('2.5 s')
  })

  it('says the Size beside its measure, clear of the echoes at any Density', () => {
    const { display, params } = face('expanse')
    for (const density of [0, 0.8, 1]) {
      const drawn = drawDisplay(display, params, { values: { density } })
      const said = drawn.calls.find((call) => call.name === 'fillText' && call.args[0] === '320 ms')
      // Its baseline is above the panel the arrival is drawn in, which begins 10 px down.
      expect(said?.args[2]).toBeLessThan(OWN.y + 10)
      // One Size is a third of the panel: the words stand just past the end of the measure.
      expect(said?.args[1]).toBeCloseTo(OWN.x + OWN.w / 3 + 3, 6)
    }
  })

  it('takes Decay from where the tail is let go', () => {
    const handle = handleOf('expanse', 'decay')
    const tail = expanseTailOf(patch)
    // It stands where the tail is 60 dB down: 0.34 s to its highest and 9.23 s from there.
    expect(tail.from).toBeCloseTo(0.34, 1)
    expect(handle.x).toBeCloseTo(TAIL.x + (TAIL.w * (tail.from + tail.seconds)) / 20, 6)
    expect(handle.y).toBe(TAIL.y + TAIL.h)
    expect(handle.drag(handle.x, handle.y).decay).toBeCloseTo(10, 2)
    // Let go further right on the foot is a longer tail: 3.33 s more.
    const longer = expanseTailOf({ ...patch, decay: handle.drag(handle.x + 20, handle.y).decay })
    expect(longer.from + longer.seconds).toBeCloseTo(tail.from + tail.seconds + 20 / 6, 1)
    // The top of the right edge is the top of the knob, where it does not end.
    expect(handle.drag(TAIL.x + TAIL.w, TAIL.y).decay).toBe(60)
    expect(handle.drag(TAIL.x, TAIL.y + TAIL.h).decay).toBeCloseTo(0.5, 3)
  })

  it('holds Decay where it is taken, also where Decay does not move the tail', () => {
    // From 0.995 of the knob the device stops losing in the middle of the spectrum: after 20 s
    // the tail is 14 dB down there and 34 dB just under it, with nothing between. The handle
    // taken stays at the top, and pulled down more than half way to the other it is the other.
    const top = handleOf('expanse', 'decay', { size: 0, decay: 60 })
    expect(top.x).toBe(TAIL.x + TAIL.w)
    expect(top.y).toBeCloseTo(yOfTail(-14), 0)
    expect(top.drag(top.x, top.y).decay).toBe(60)
    expect(top.drag(top.x, top.y + 1).decay).toBe(60)
    const under = top.drag(top.x, top.y + 8).decay
    expect(under).toBeLessThan(59.7)
    expect(under).toBeCloseTo(59.7, 3)
    expect(handleOf('expanse', 'decay', { size: 0, decay: under }).y).toBeCloseTo(yOfTail(-33.7), 0)
    // A large space with all its Gravity rings for its Sizes whatever a short Decay says
    // (0.5 and 3 s sound the same): the handle taken there leaves Decay where it is.
    const space = { size: 1, gravity: 1, decay: 0.5 }
    const short = handleOf('expanse', 'decay', space)
    expect(short.drag(short.x, short.y).decay).toBe(0.5)
    expect(short.drag(short.x - 1, short.y).decay).toBeCloseTo(0.5, 5)
    const longer = short.drag(short.x + 12, short.y).decay
    expect(longer).toBeGreaterThan(3)
    expect(handleOf('expanse', 'decay', { ...space, decay: longer }).x).toBeCloseTo(short.x + 12, 0)
  })
})

describe('Swarm Reverb', () => {
  // The arrivals of the first echoes, measured from the compiled device (a
  // click in, Blur and Feedback 0), as shares of a pass, with their signs.
  const MEASURED = [
    [0.063, -0.079, -0.13, 0.223, 0.283, -0.356, -0.382, 0.471, -0.568, -0.622, 0.703],
    [-0.047, 0.099, 0.14, -0.191, -0.251, -0.33, -0.423, -0.456, 0.561, -0.63, 0.726],
  ]
  const patch = { seconds: 0.5, feedback: 0.6, lowCut: 100, highCut: 5000 }

  it('has the device own echoes, not a likeness', () => {
    const taps = swarmTaps()
    expect(taps).toHaveLength(2)
    taps.forEach((side, c) => {
      expect(side).toHaveLength(14)
      MEASURED[c].forEach((measured, k) => {
        expect(side[k].arrival).toBeCloseTo(Math.abs(measured), 2)
        expect(Math.sign(side[k].gain)).toBe(Math.sign(measured))
      })
      // The last echo ends the pass, 6 dB under where the first would be at the start.
      expect(side[13].arrival).toBe(1)
      const tilt = 20 * Math.log10(Math.abs(side[13].gain / side[0].gain))
      expect(tilt).toBeCloseTo(-6 * (1 - side[0].arrival), 6)
      // Together they are as loud as the sound that made them.
      expect(side.reduce((sum, tap) => sum + tap.gain * tap.gain, 0)).toBeCloseTo(1, 9)
    })
  })

  it('stretches a pass from half of Length to twice, in steps when asked', () => {
    expect(swarmSeconds(0.5, 0.5, false)).toBeCloseTo(0.5, 9)
    expect(swarmSeconds(0.5, 0, false)).toBeCloseTo(0.25, 9)
    expect(swarmSeconds(0.5, 1, false)).toBeCloseTo(1, 9)
    // Steps: the nearest of 1/2, 2/3, 3/4, 1, 4/3, 3/2 and 2.
    expect(SWARM_STEPS).toHaveLength(7)
    expect(swarmOctaves(0.8, true)).toBeCloseTo(Math.log2(1.5), 6)
    expect(swarmSeconds(0.5, 0.8, true)).toBeCloseTo(0.75, 6)
    expect(swarmSeconds(0.5, 0.28, true)).toBeCloseTo(0.375, 6)
  })

  it('loses 20 log10(Feedback) dB a trip and what the return cuts take (by hand)', () => {
    // Feedback 0.6 is 4.437 dB; at 1 kHz Low Cut at 100 Hz takes 0.0004 dB and High Cut at 5 kHz 0.0060.
    expect(swarmLossDb(1000, patch, 48000)).toBeCloseTo(-4.4434, 3)
    // A trip is 0.9435 of a pass, 0.47175 s: 9.42 dB a second, 60 dB in 6.37 s at 1 kHz.
    expect(swarmFall(patch).rates[16]).toBeCloseTo(9.42, 1)
    // At the High Cut itself a two-pole filter of Q 0.707 takes 3 dB more a trip.
    expect(swarmLossDb(5000, patch, 48000)).toBeCloseTo(-4.437 - 3.01, 2)
    // Above Feedback 0.9 the return opens: at 1 the cuts stand 0.75 octaves higher and 1.5 lower.
    const open = { ...patch, feedback: 1 }
    expect(swarmLossDb(5000 * 2 ** 0.75, open, 48000)).toBeCloseTo(-3.01, 2)
    expect(swarmLossDb(100 * 2 ** -1.5, open, 48000)).toBeCloseTo(-3.01, 2)
  })

  it('falls 60 dB when the compiled device does, the cuts counted', () => {
    // Measured from the first echo; Feedback alone would give 2.71, 6.38 and 30.9 s for the first three.
    const measured: [Partial<typeof patch>, number][] = [
      [{ feedback: 0.3 }, 2.81],
      [{}, 6.1],
      [{ feedback: 0.9 }, 27.64],
      [{ lowCut: 20, highCut: 16000 }, 6.18],
      [{ lowCut: 400, highCut: 1500 }, 5.05],
      // A cave of 2.4 s, measured in windows a tenth of a pass long.
      [{ seconds: 2.4 }, 29.0],
    ]
    for (const [change, seconds] of measured) {
      const model = swarmTailOf({ ...patch, ...change }).seconds
      expect(Math.abs(model / seconds - 1), JSON.stringify(change)).toBeLessThan(0.03)
    }
    expect(swarmTailOf({ ...patch, feedback: 1 }).seconds).toBe(Infinity)
    expect(swarmTailOf({ ...patch, feedback: 1.05 }).seconds).toBe(Infinity)
    // With no Feedback there is the one pass, from its first echo to its last.
    expect(swarmTailOf({ ...patch, feedback: 0 }).seconds).toBeCloseTo(0.5 * (1 - 0.035), 2)
  })

  it('leans the first pass 6 dB and lays the trips round at a pass own mean', () => {
    const tail = swarmTailOf(patch)
    // The first echo comes 0.035 of a pass in, at the top.
    expect(tail.first).toBeCloseTo(0.0175, 9)
    expect(tail.level(0.0175)).toBeCloseTo(0, 6)
    // A quarter through the pass the swarm itself has leant 6 x (0.25 - 0.035) = 1.29 dB.
    expect(tail.level(0.125)).toBeCloseTo(-1.29, 2)
    // From the middle of the pass the trips' line stands, where the mean of a lean of 6 dB is:
    // 10 log10((1 - 10^-0.6) / (0.6 ln 10)) = 2.66 dB under the first echo.
    expect(tail.level(0.25)).toBeCloseTo(-2.66, 2)
    // By the end of the pass a quarter of a second at some 9.4 dB a second and more has gone by.
    expect(tail.level(0.5)).toBeLessThan(-2.66 - 2.2)
    expect(tail.level(0.5)).toBeGreaterThan(-2.66 - 2.9)
    // With no Feedback there is nothing after the pass.
    expect(swarmTailOf({ ...patch, feedback: 0 }).level(0.51)).toBeLessThan(-100)
  })

  it('sends each trip round fainter by Feedback, and nothing round at none', () => {
    const energy = (echoes: Float32Array, from: number, to: number): number => {
      let sum = 0
      for (let i = from; i < to; i++) sum += echoes[i] * echoes[i]
      return sum
    }
    // Four passes wide, 100 slots a pass. The second trip of the left side is
    // the first again a whole pass later and the right's 0.887 of one later.
    const [alone] = swarmEchoes(4, 0, 0, 400)
    expect(energy(alone, 104, 400)).toBe(0)
    const [round] = swarmEchoes(4, 0.5, 0, 400)
    const first = energy(alone, 0, 400)
    const all = energy(round, 0, 400)
    // Everything that comes back within four passes: 1 + 0.25 + 0.0625 + ... of the first.
    expect(all / first).toBeGreaterThan(1.25)
    expect(all / first).toBeLessThan(1 / (1 - 0.25))
  })

  it('puts each echo where the device has it with no Blur: the four allpasses are then their delay', () => {
    // A pass in 400 slots: every echo measured stands at its arrival, to a slot or two.
    const sides = swarmEchoes(1.005, 0, 0, 402)
    MEASURED.forEach((side, c) => {
      for (const measured of side) {
        const slot = Math.abs(measured) * 400
        const near = Array.from(sides[c].slice(Math.floor(slot) - 2, Math.ceil(slot) + 3))
        expect(Math.max(...near), `${c} ${measured}`).toBeGreaterThan(0.5)
      }
      // Nothing comes before the first, and the last ends the pass.
      const first = sides[c].findIndex((size) => size > 0.01)
      expect(Math.abs(first / 400 - Math.abs(side[0]))).toBeLessThan(0.005)
      expect(Math.max(...Array.from(sides[c].slice(398, 402)))).toBeGreaterThan(0.4)
    })
  })

  it('lets Blur spill each echo without losing any of it', () => {
    const sum = (echoes: Float32Array): number => echoes.reduce((total, v) => total + v * v, 0)
    const [sharp] = swarmEchoes(1.3, 0, 0, 130)
    const [blurred] = swarmEchoes(1.3, 0, 1, 130)
    expect(sum(blurred) / sum(sharp)).toBeCloseTo(1, 3)
    expect(Math.max(...sharp)).toBeCloseTo(1, 6)
    expect(Math.max(...blurred)).toBeLessThan(0.75)
  })

  it('draws the cave at the size the device says while sound runs', () => {
    const { display, params } = face('swarm-reverb')
    expect(drawDisplay(display, params).words()).toContain('500 ms')
    const gliding = runDisplay(display, params, 0.3, {
      signal: testSignal(),
      meters: { size: 0.8 },
    })
    expect(gliding.words()).toContain('800 ms')
    // Asleep the device's figure is old: the knobs stand.
    const asleep = runDisplay(display, params, 0.3, {
      signal: testSignal(0, 0),
      meters: { size: 0.8 },
    })
    expect(asleep.words()).toContain('500 ms')
  })

  it('says the time the whole takes', () => {
    const { display, params } = face('swarm-reverb')
    expect(drawDisplay(display, params).words()).toContain('6.1 s')
    expect(drawDisplay(display, params, { values: { feedback: 1 } }).words()).toContain('∞')
  })

  it('takes Stretch from the top and Feedback from the tail end', () => {
    const { display, params } = face('swarm-reverb')
    const size = displaySize(display)
    const stretch = handleOf('swarm-reverb', 'stretch')
    // The upper panel is two Lengths wide: its right edge is Stretch at the top.
    expect(stretch.drag(size.width - 4, stretch.y).stretch).toBeCloseTo(1, 6)
    expect(stretch.drag(4 + 120 / 4, stretch.y).stretch).toBeCloseTo(0, 6)
    const feedback = handleOf('swarm-reverb', 'feedback')
    // It stands where the cave is 60 dB down: 6.10 s after the first echo, on a panel of 12 s.
    expect(feedback.x).toBeCloseTo(TAIL.x + (TAIL.w * (0.0175 + 6.1)) / 12, 0)
    expect(feedback.drag(feedback.x, feedback.y).feedback).toBeCloseTo(0.6, 3)
    // Let go on the foot at 3 s, the cave is to die there.
    const less = feedback.drag(TAIL.x + TAIL.w / 4, TAIL.y + TAIL.h).feedback
    expect(swarmTailOf({ ...patch, feedback: less }).seconds).toBeCloseTo(3 - 0.0175, 2)
    // It stops at 1, where the tail no longer ends, and at none.
    expect(feedback.drag(TAIL.x + TAIL.w, TAIL.y).feedback).toBe(1)
    expect(feedback.drag(TAIL.x + 6, TAIL.y + TAIL.h).feedback).toBeLessThan(0.01)
    // Past 1 the tail has no end: the handle taken there leaves Feedback alone.
    const past = handleOf('swarm-reverb', 'feedback', { feedback: 1.04 })
    expect(past.drag(past.x, past.y).feedback).toBe(1.04)
    expect(past.drag(past.x, past.y + 10).feedback).toBeLessThan(1)
    expect(params.feedback.max).toBeGreaterThan(1)
  })
})

describe('Sympathetic', () => {
  it('climbs the scale from C3 until a note is heard', () => {
    expect(sympatheticNotes(8, 0, sympatheticScale(0), -1)).toEqual([
      48, 50, 52, 53, 55, 57, 59, 60,
    ])
    // Root D, minor: D3 E3 F3 G3.
    expect(sympatheticNotes(4, 2, sympatheticScale(1), -1)).toEqual([50, 52, 53, 55])
  })

  it('moves to the octave of the note heard, in order of consonance', () => {
    // A4 heard, C major: root, its octave, the fifth, the third, then the rest.
    expect(sympatheticNotes(8, 0, sympatheticScale(0), 69)).toEqual([
      60, 72, 67, 64, 62, 65, 69, 71,
    ])
    // The ninth string starts again an octave up.
    expect(sympatheticNotes(9, 0, sympatheticScale(0), 69)[8]).toBe(72)
    // Past B7 a string comes back down by octaves.
    expect(Math.max(...sympatheticNotes(16, 11, sympatheticScale(0), 100))).toBeLessThanOrEqual(107)
  })

  it('tunes to what Learn has gathered, and to major until it has anything', () => {
    expect(sympatheticScale(2, 0)).toEqual(sympatheticScale(0))
    // Root, major third and fifth heard.
    expect(sympatheticScale(2, 0b10010001)).toEqual([0, 4, 7])
    expect(sympatheticNotes(4, 0, [0, 4, 7], 60)).toEqual([60, 72, 67, 64])
  })

  it('names notes and tunes them as the device does', () => {
    expect(noteName(60)).toBe('C4')
    expect(noteName(33)).toBe('A1')
    expect(hzOfNote(69)).toBe(440)
    expect(hzOfNote(48)).toBeCloseTo(130.81, 2)
  })

  it('lets the high strings die sooner than Decay, as the header of the string says', () => {
    // Low and middle strings ring for Decay (the compiled device: 3.00 s at 3).
    expect(stringSeconds(130.81, 3)).toBeCloseTo(3, 2)
    expect(stringSeconds(261.63, 10)).toBeCloseTo(10, 1)
    // "At most 6.8 s at C5, 3.7 s at F5, 1.4 s at C6, 0.2 s at C7", at any rate.
    for (const rate of [44100, 48000, 96000]) {
      expect(stringSeconds(523.25, 10, rate)).toBeCloseTo(6.8, 1)
      expect(stringSeconds(698.46, 10, rate)).toBeCloseTo(3.7, 1)
      expect(stringSeconds(1046.5, 10, rate)).toBeCloseTo(1.4, 1)
      expect(stringSeconds(2093, 10, rate)).toBeCloseTo(0.2, 1)
    }
  })

  it('names the scale, and the note heard once the device reports one', () => {
    const { display, params } = face('sympathetic')
    expect(drawDisplay(display, params).words()).toContain('C major')
    expect(drawDisplay(display, params, { values: { root: 9, mode: 1 } }).words()).toContain(
      'A minor',
    )
    const heard = drawDisplay(display, params, { meters: { note: 57, scale: 2741 } })
    expect(heard.words()).toContain('heard A3')
    expect(
      drawDisplay(display, params, { meters: { note: -1 } })
        .words()
        .join(' '),
    ).not.toMatch(/heard/)
  })

  it('takes a reading that has not come yet for no note, not for the lowest there is', () => {
    const { display, params } = face('sympathetic')
    // At rest, and until the device has answered, a reading is 0: the strings stay where the knobs put them.
    const waiting = drawDisplay(display, params, { meters: { note: 0, scale: 0 } })
    expect(waiting.words().join(' ')).not.toMatch(/heard/)
    expect(waiting.print()).toBe(drawDisplay(display, params, { meters: { note: -1 } }).print())
  })

  it('lights a string as high as the device says it rings', () => {
    const { display, params } = face('sympathetic')
    const run = (meters: Record<string, number>) =>
      runDisplay(display, params, 0.2, { signal: testSignal(), meters: { note: -1, ...meters } })
    // Silent strings: only what rings in the tail is in the accent.
    const silent = accents(run({ strings1: 0, strings2: 0 }))
    // The first string at -10 dB, the sixth at -20 dB: four strings to a reading, six bits each.
    const two = accents(run({ strings1: 53, strings2: 43 * 64 }))
    expect(two).toBe(silent + 2)
    // A string 60 dB down is under what is drawn.
    expect(accents(run({ strings1: 3 }))).toBe(silent)
  })

  it('unpacks four strings from a reading as the device packs them (by hand)', () => {
    const { display, params } = face('sympathetic')
    // sympathetic.h: level = int(63.5 + 10 log10(power)), string 4s is the lowest six bits.
    // Strings 1 to 4 at -3, -15, -33 and -51 dB: 60 + 48 x 64 + 30 x 4096 + 12 x 262144 = 3271932.
    const drawn = runDisplay(display, params, 0.2, {
      signal: testSignal(),
      meters: { note: -1, strings1: 60 + 48 * 64 + 30 * 4096 + 12 * 262144 },
    })
    // Each is lit from the line (y 45.5) up by its share of 48 dB over 30.5 px: 45, 33 and 15 dB
    // over the 48 the panel shows; the fourth, 51 dB down, is under it.
    const lit = accentLines(drawn)
      .filter(
        (line) => line.length === 2 && line[0][0] === line[1][0] && line[0][1] < OWN.y + OWN.h,
      )
      .map((line) => Math.abs(line[0][1] - line[1][1]))
    expect(lit).toHaveLength(3)
    expect(lit[0]).toBeCloseTo((30.5 * 45) / 48, 1)
    expect(lit[1]).toBeCloseTo((30.5 * 33) / 48, 1)
    expect(lit[2]).toBeCloseTo((30.5 * 15) / 48, 1)
  })

  it('takes Root from the line the strings stand on', () => {
    const root = handleOf('sympathetic', 'root')
    expect(root.drag(root.x, root.y).root).toBe(0)
    // Eight strings from C3 are drawn over two octaves: 5 px a semitone.
    expect(root.drag(root.x + 5 * 7, root.y).root).toBe(7)
    const moved = handleOf('sympathetic', 'root', { root: 9 })
    expect(moved.drag(moved.x, moved.y).root).toBe(9)
    // It stops at C and at B.
    expect(root.drag(0, root.y).root).toBe(0)
    expect(root.drag(TAIL.x + TAIL.w, root.y).root).toBe(11)
  })

  it('takes Decay from the end of the tail', () => {
    const decay = handleOf('sympathetic', 'decay')
    // 3 s on a panel of 8.
    expect(decay.x).toBeCloseTo(TAIL.x + (TAIL.w * 3) / 8, 6)
    expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(3, 6)
    expect(decay.drag(TAIL.x + TAIL.w / 2, TAIL.y + TAIL.h).decay).toBeCloseTo(4, 6)
    expect(decay.drag(TAIL.x + TAIL.w, TAIL.y).decay).toBe(10)
    expect(decay.drag(TAIL.x, TAIL.y + TAIL.h).decay).toBe(0.5)
  })
})

describe('Vowel Reverb', () => {
  it('names 1 kHz on a patch of the plate, over the spectrum of the sound', () => {
    const { display, params } = face('vowel-reverb')
    // With a sound going in its spectrum fills the foot of the curve in the same ink.
    for (const signal of [undefined, testSignal()]) {
      const drawn = drawDisplay(display, params, signal ? { signal } : {})
      expect(patchUnder(drawn, '1k', PLAIN_COLOURS.plate)).not.toBeNull()
    }
  })

  it('reads the formants off the device own table, between its entries too', () => {
    // Bass a, soprano a, tenor i.
    expect(formantsAt(0, 0).hz).toEqual([600, 1040, 2250, 2450, 2750])
    expect(formantsAt(0, 1).hz[0]).toBe(800)
    expect(formantsAt(2, 1 / 3).hz[0]).toBeCloseTo(290, 6)
    // Half way from a to e in the bass: 600 to 400 Hz, 0 to -12 dB on the second.
    const between = formantsAt(0.5, 0)
    expect(between.hz[0]).toBe(500)
    expect(between.db[1]).toBe(-9.5)
    expect(between.bandwidth[0]).toBe(50)
  })

  it('reads the default voice between tenor and alto (by hand)', () => {
    // Voice 0.4 is a fifth of the way from tenor to alto: a is 650 + 0.2 x 150 and 1080 + 0.2 x 70.
    const a = formantsAt(0, 0.4)
    expect(a.hz[0]).toBeCloseTo(680, 6)
    expect(a.hz[1]).toBeCloseTo(1094, 6)
    expect(a.db[1]).toBeCloseTo(-5.6, 6)
    // u for a soprano: 325, 700, 2700, 3800 and 4950 Hz.
    expect(formantsAt(4, 1).hz).toEqual([325, 700, 2700, 3800, 4950])
  })

  it('turns a wandering vowel back at the ends', () => {
    expect(foldVowel(-0.5)).toBe(0.5)
    expect(foldVowel(4.5)).toBe(3.5)
    expect(foldVowel(2.2)).toBe(2.2)
  })

  it('is flat with no Resonance and peaks on the formants with it', () => {
    const tenor = formantsAt(0, 1 / 3)
    for (const hz of [200, 650, 1080, 3000]) expect(vowelDb(hz, tenor, 0)).toBeCloseTo(0, 9)
    // 650 and 1080 Hz stand over the valley between them and the slopes outside.
    for (const resonance of [0.6, 1]) {
      const at = (hz: number): number => vowelDb(hz, tenor, resonance)
      expect(at(650)).toBeGreaterThan(at(840) + 6)
      expect(at(1080)).toBeGreaterThan(at(840) + 5)
      expect(at(650)).toBeGreaterThan(at(400) + 6)
      expect(at(1080)).toBeGreaterThan(at(1800) + 8)
    }
    // The makeup is 12 dB at most, and the first formant comes through at about that.
    expect(vowelDb(650, tenor, 1)).toBeGreaterThan(6)
    expect(vowelDb(650, tenor, 1)).toBeLessThan(13)
    // The top of each peak is on the formant, to a few per cent.
    for (const centre of [650, 1080]) {
      let best = 0
      for (let hz = centre * 0.8; hz <= centre * 1.25; hz *= 1.005) {
        if (vowelDb(hz, tenor, 1) > vowelDb(best || 1, tenor, 1)) best = hz
      }
      expect(Math.abs(best / centre - 1)).toBeLessThan(0.03)
    }
  })

  it('lets a mode lose between the formants by its share in the four lines with the vowel (by hand)', () => {
    // Decay 6, Resonance 1, Size 0.6: a pass is 0.091297 x 1.12 + 0.010531 = 0.11278 s, and a line
    // with the vowel keeps 10^(-12 x 0.5 x 0.11278) = 0.2105 of a valley's power on each.
    // A mode with none of itself in those lines falls as the formants do.
    const tail = valleyTail(6, 1, 0.6)
    expect(tail.level(0)).toBeCloseTo(0, 9)
    // With no Resonance there is no valley: 60 dB in Decay.
    expect(valleySeconds(6, 0)).toBeCloseTo(6, 6)
    // Late, the modes that keep clear are what is left: the fall is slower than it began.
    const early = tail.level(0.5) - tail.level(0)
    const late = tail.level(3) - tail.level(2.5)
    expect(late).toBeGreaterThan(early)
    // It is never slower than the formants' own 10 dB a second, nor faster than a mode that lies
    // half in the vowel's lines, 10 + 2.18 / 0.11278 = 29.3 dB a second, would begin.
    expect(late).toBeLessThan(-5)
    expect(early).toBeGreaterThan(-29.3 / 2 - 1.5)
  })

  it('lets the valleys die as soon as the compiled device does, which is not four times sooner', () => {
    // Measured with notes round 1700 Hz, between the second and third formants, the mean of eight runs.
    const measured: [number, number, number][] = [
      [6, 1, 3.38],
      [6, 0.6, 3.63],
      [6, 0.3, 4.84],
      [2, 1, 1.31],
      [2, 0.6, 1.38],
      [20, 1, 10.47],
      [20, 0.6, 11.67],
      [40, 1, 18.54],
      [40, 0.6, 19.26],
    ]
    for (const [decay, resonance, seconds] of measured) {
      const model = valleySeconds(decay, resonance)
      expect(Math.abs(model / seconds - 1), `${decay} ${resonance}`).toBeLessThan(0.12)
    }
    // The header's reckoning, a quarter of Decay at Resonance 1, would be 1.5 s at 6.
    expect(valleySeconds(6, 1)).toBeGreaterThan(3)
  })

  it('draws the vowel sung now in the accent when Motion has moved it', () => {
    const { display, params } = face('vowel-reverb')
    const run = (meters: Record<string, number>) =>
      runDisplay(display, params, 0.2, { signal: testSignal(), meters })
    const at = { vowel: 0, lean: 0, voice: 0.4, build: 0 }
    const wandered = { vowel: 0.6, lean: 0.1, voice: 0.4, build: 0.02 }
    // Where the knobs are, only the mark on the line of vowels; moved, the curve too.
    expect(accents(run(wandered))).toBe(accents(run(at)) + 1)
  })

  it('falls 60 dB when the compiled device does for a wide sound, which is sooner than Decay', () => {
    const patch = {
      decay: 6,
      resonance: 0.6,
      size: 0.6,
      vowel: 0,
      voice: 0.4,
      lowCut: 100,
      highCut: 9000,
    }
    // A tenth of a second of pink noise, the mean of four runs. Only what lies right on the first
    // formant rings for Decay (notes round 680 Hz: 5.9 s at 6, 19 s at 20, 35 s at 40).
    const measured: [Partial<typeof patch>, number][] = [
      [{}, 5.14],
      [{ resonance: 1 }, 5.13],
      [{ resonance: 0 }, 5.79],
      [{ decay: 2 }, 1.84],
      [{ decay: 20 }, 16.95],
      [{ decay: 20, resonance: 1 }, 16.4],
      [{ decay: 40 }, 31.03],
      [{ vowel: 2 }, 5.16],
      [{ vowel: 4 }, 5.08],
      [{ highCut: 2000 }, 4.49],
      [{ size: 0 }, 5.25],
      [{ size: 1 }, 5.13],
    ]
    for (const [change, seconds] of measured) {
      const model = vowelTailOf({ ...patch, ...change }).seconds
      expect(Math.abs(model / seconds - 1), JSON.stringify(change)).toBeLessThan(0.085)
    }
    // The worst found: o at Resonance 1, 5.15 s measured.
    expect(
      Math.abs(vowelTailOf({ ...patch, resonance: 1, vowel: 3 }).seconds / 5.15 - 1),
    ).toBeLessThan(0.11)
    // With no Resonance only the high shelf is left: 60 dB in a little under Decay.
    const plain = vowelTailOf({ ...patch, resonance: 0, highCut: 18000 })
    expect(plain.seconds).toBeGreaterThan(5.85)
    expect(plain.seconds).toBeLessThan(6)
  })

  it('says the time the whole takes, in steps no finer than it is known', () => {
    const { display, params } = face('vowel-reverb')
    // Under ten seconds to the tenth: 4.99 s at the defaults, 2.56 s at Decay 3.
    expect(drawDisplay(display, params).words()).toContain('5.0 s')
    expect(drawDisplay(display, params, { values: { decay: 3 } }).words()).toContain('2.6 s')
    expect(drawDisplay(display, params, { values: { decay: 20 } }).words()).toContain('16 s')
    // At Decay 40 it works out at 29.1 s where the device takes 31.0: said as 30.
    expect(drawDisplay(display, params, { values: { decay: 40 } }).words()).toContain('30 s')
  })

  it('stands the chosen letter whole over its handle, the larger handle of a point in hand too', () => {
    const { display, params } = face('vowel-reverb')
    'AEIOU'.split('').forEach((letter, vowel) => {
      const handle = handleOf('vowel-reverb', 'vowel', { vowel })
      const drawn = drawDisplay(display, params, { values: { vowel }, hot: 'vowel' })
      let size = 0
      let at: [number, number] | null = null
      for (const call of drawn.calls) {
        if (call.name === 'set font') size = parseFloat(String(call.args[0]))
        else if (call.name === 'fillText' && call.args[0] === letter) {
          at = [call.args[1] as number, call.args[2] as number]
          break
        }
      }
      expect(at, letter).not.toBeNull()
      if (!at) return
      const [x, foot] = at
      // The handle in hand is a ring of radius 4.5 with a line 1.5 wide: 5.25 from its middle.
      const top = handle.y - 5.25
      // The letter's foot is clear of it by a pixel and more, so no part of the letter is hidden...
      expect(top - foot, letter).toBeGreaterThanOrEqual(1)
      // ...and the handle is still plainly the letter's: right under it, nothing between them.
      expect(x, letter).toBeCloseTo(handle.x, 6)
      expect(top - foot, letter).toBeLessThan(3)
      // The letter is 8 px and stands whole inside the display.
      expect(size, letter).toBe(8)
      expect(foot - size, letter).toBeGreaterThanOrEqual(OWN.y - 1)
      expect(x, letter).toBeGreaterThan(OWN.x + 4)
      expect(x, letter).toBeLessThan(OWN.x + OWN.w - 4)
    })
  })

  it('takes the vowel from the line of letters', () => {
    const { display } = face('vowel-reverb')
    const size = displaySize(display)
    const handle = handleOf('vowel-reverb', 'vowel', { vowel: 1.5 })
    expect(handle.drag(handle.x, handle.y).vowel).toBeCloseTo(1.5, 6)
    expect(handle.drag(0, handle.y).vowel).toBe(0)
    expect(handle.drag(size.width, handle.y).vowel).toBe(4)
    // The letters stand evenly: half way along is I.
    expect(handle.drag(size.width / 2, handle.y).vowel).toBeCloseTo(2, 6)
  })

  it('takes Decay from where the tail is let go', () => {
    const decay = handleOf('vowel-reverb', 'decay')
    // It stands where a wide sound is 60 dB down: 5.0 s on a panel of 12.
    expect(decay.x).toBeCloseTo(TAIL.x + (TAIL.w * 4.99) / 12, 0)
    expect(decay.y).toBe(TAIL.y + TAIL.h)
    expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(6, 2)
    // Let go on the foot at 3 s, the tail is to end there.
    const shorter = decay.drag(TAIL.x + TAIL.w / 4, TAIL.y + TAIL.h).decay
    expect(shorter).toBeLessThan(4)
    expect(
      vowelTailOf({
        decay: shorter,
        resonance: 0.6,
        size: 0.6,
        vowel: 0,
        voice: 0.4,
        lowCut: 100,
        highCut: 9000,
      }).seconds,
    ).toBeCloseTo(3, 2)
    expect(decay.drag(TAIL.x + TAIL.w, TAIL.y).decay).toBe(40)
    expect(decay.drag(TAIL.x, TAIL.y + TAIL.h).decay).toBeCloseTo(0.5, 3)
  })
})
