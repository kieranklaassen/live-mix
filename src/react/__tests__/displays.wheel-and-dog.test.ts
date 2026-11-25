// The truth of the Wheel and Dog display. Its arithmetic against the compiled
// device turned at 48 kHz: the bow's speed round the turn, how far open the
// dog is at every push and over what stretch of the turn, the notes of the
// strings. Then the drawing against that arithmetic, the handles, and the
// timed draw: at every kind of wheel, nothing drawn may turn back more than
// six times in a second.

import { describe, expect, it } from 'vitest'

import { WHEEL_AND_DOG_PARAMS } from '../../dsp/devices/wheel-and-dog.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  WHEEL_ACCENTS,
  WHEEL_AND_DOG_FACES,
  WHEEL_EDGE,
  WHEEL_JERK_MOST,
  WHEEL_JUMP,
  WHEEL_LIT_SEC,
  WHEEL_TUNINGS,
  WHEEL_WORD_SEC,
  wheelBarksText,
  wheelBowSpeed,
  wheelDogOf,
  wheelDrones,
  wheelIsDrone,
  wheelJerkY,
  wheelJerks,
  wheelLayout,
  wheelLoose,
  wheelMelody,
  wheelOut,
  wheelPoint,
  wheelPushAt,
  wheelPushes,
  wheelSettings,
  wheelSplitNote,
  wheelSplitText,
  wheelThreshold,
  wheelTurnText,
  type WheelJerk,
  type WheelSettings,
} from '../components/displays/wheel-and-dog'
import { type DisplayNote, type DisplaySignal } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  recordingContext,
  testLevel,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const BLOCK = 16
const display = WHEEL_AND_DOG_FACES['wheel-and-dog'].display
const size = displaySize(display)
const { ink, accent } = PLAIN_COLOURS

type Name = keyof typeof WHEEL_AND_DOG_PARAMS
type Values = Partial<Record<Name, number>>

const settingsOf = (values: Values = {}): WheelSettings =>
  wheelSettings((name) => values[name as Name] ?? WHEEL_AND_DOG_PARAMS[name as Name].default)
const hz = (note: number): number => 440 * Math.pow(2, (note - 69) / 12)

async function wheel(values: Values): Promise<WasmDeviceHarness> {
  const loaded = await loadWasmDevice('wheel-and-dog', RATE)
  for (const [name, value] of Object.entries(values))
    loaded.set(WHEEL_AND_DOG_PARAMS[name as Name], value)
  return loaded
}

/** One reading of the turning wheel: where it is, how open the dog, the melody, the bow's speed. */
interface Reading {
  place: number
  buzz: number
  melody: number
  turning: number
}

const readings = (loaded: WasmDeviceHarness): Reading => {
  const meter = loaded.device.device_meter
  if (!meter) throw new Error('the device has no readings')
  return { place: meter(0), buzz: meter(1), melody: meter(2), turning: meter(3) }
}

/** A drone key held until the wheel is at full turning and round to its start, then one turn read every 16 samples. */
async function oneTurn(values: Values): Promise<Reading[]> {
  const loaded = await wheel({ spin: 0.05, ...values })
  loaded.device.device_note_on?.(1, hz(38), 0.8)
  const set = settingsOf(values)
  // Past the run up (which is a jerk of its own) and the bark it leaves.
  for (let done = 0; done < 0.6 * RATE; done += BLOCK) loaded.device.device_process(BLOCK)
  let before = readings(loaded).place
  for (;;) {
    loaded.device.device_process(BLOCK)
    const now = readings(loaded).place
    if (now < before) break
    before = now
  }
  const turn: Reading[] = []
  const most = Math.floor(RATE / set.speed / BLOCK) - 1
  while (turn.length < most) {
    turn.push(readings(loaded))
    loaded.device.device_process(BLOCK)
  }
  return turn
}

/** Two dozen wheels: slow and quick, every count of pushes, every pattern, a firm dog and a loose one. */
const WHEELS: Values[] = [
  {},
  { speed: 0.5, accents: 2, depth: 0.3, dog: 0.7 },
  { speed: 0.2, accents: 1, depth: 0.8, dog: 0.5 },
  { speed: 0.5, accents: 1, pattern: 1, depth: 0.65, dog: 0.35 },
  { speed: 0.9, accents: 4, pattern: 1, depth: 0.5, dog: 0.75 },
  { speed: 0.75, accents: 3, pattern: 2, depth: 0.6, dog: 0.8 },
  { speed: 0.75, accents: 3, pattern: 2, depth: 0.3, dog: 0.55 },
  { speed: 1.2, accents: 3, depth: 1, dog: 1 },
  { speed: 1.4, accents: 2, pattern: 1, depth: 0.5, dog: 0.6 },
  { speed: 3, accents: 4, depth: 0.35, dog: 0.6 },
  { speed: 3, accents: 4, pattern: 1, depth: 0.15, dog: 0.9 },
  { speed: 0.9, accents: 4, depth: 0.15, dog: 0.2 },
  { accents: 2, depth: 0.2, dog: 0.4 },
  { accents: 2, depth: 0.5, dog: 0.1 },
  { accents: 2, depth: 0.5, dog: 0.05, trompette: 0.2 },
  { accents: 2, depth: 0.6, dog: 0.6, trompette: 0.25 },
  { accents: 2, depth: 0.6, dog: 0.6, trompette: 0 },
  { accents: 0, depth: 1, dog: 1 },
  { accents: 2, depth: 1, dog: 0 },
]

describe('the figures of Wheel and Dog', () => {
  it('are the header’s: the pushes, the threshold, the notes', () => {
    // The choices as the device has them.
    expect(WHEEL_AND_DOG_PARAMS.accents.choices?.map((each) => Number(each) || 0)).toEqual([
      ...WHEEL_ACCENTS,
    ])
    expect(WHEEL_TUNINGS).toHaveLength(WHEEL_AND_DOG_PARAMS.tuning.choices?.length ?? 0)
    // Three even pushes at half a turn a second: 22 ms of rise is 0.011 of a turn.
    const even = wheelPushes({ speed: 0.5, count: 3, pattern: 0 })
    expect(even.map((push) => push.start)).toEqual([0, 1 / 3, 2 / 3])
    for (const push of even) expect(push.rise).toBeCloseTo(0.011, 9)
    // Six at three a second: the rise is held to 0.3 of the gap.
    for (const push of wheelPushes({ speed: 3, count: 6, pattern: 0 }))
      expect(push.rise).toBeCloseTo(0.3 / 6, 9)
    // Long and short: the second of each pair a third of a gap late. With three the last stands even.
    const late = wheelPushes({ speed: 0.5, count: 4, pattern: 1 })
    expect(late.map((push) => +(push.start * 4).toFixed(6))).toEqual([0, 1.333333, 2, 3.333333])
    expect(late.map((push) => +(push.length * 4).toFixed(6))).toEqual([
      1.333333, 0.666667, 1.333333, 0.666667,
    ])
    const three = wheelPushes({ speed: 0.5, count: 3, pattern: 1 })
    expect(three.map((push) => +(push.length * 3).toFixed(6))).toEqual([1.333333, 0.666667, 1])
    // The first strong: the rest half.
    expect(wheelPushes({ speed: 1, count: 3, pattern: 2 }).map((push) => push.strength)).toEqual([
      1, 0.5, 0.5,
    ])
    // The bow: even between no pushes, 2.5 times at Depth 1 on the top of one.
    expect(wheelBowSpeed(0.4, 1, [])).toBe(1)
    expect(wheelBowSpeed(0.011, 1, even)).toBeCloseTo(1 + WHEEL_JUMP, 9)
    expect(wheelPushAt(0.0055, even)).toBeCloseTo(0.5, 9)
    // The dog's threshold: 0.44 firm, 0.02 at its loosest, and the Dog of a threshold is its inverse.
    expect(wheelThreshold(0)).toBeCloseTo(0.44, 12)
    expect(wheelThreshold(1)).toBeCloseTo(0.02, 12)
    for (const dog of [0, 0.2, 0.55, 0.9, 1])
      expect(wheelDogOf(wheelThreshold(dog))).toBeCloseTo(dog, 9)
    expect(wheelLoose(1, 0)).toBe(0)
    expect(wheelLoose(1, 1)).toBeCloseTo(1, 12)
    expect(wheelLoose(wheelThreshold(0.5) - 1e-6, 0.5)).toBe(0)
    expect(wheelLoose(wheelThreshold(0.5) + 0.075, 0.5)).toBeCloseTo(0.5 * (0.55 + 0.225), 9)
    // A push of Depth d at full turning reads about d.
    for (const depth of [0.2, 0.4, 1])
      for (const push of wheelJerks(settingsOf({ depth, accents: 2 }), RATE)) {
        expect(push.jerk / depth).toBeGreaterThan(0.93)
        expect(push.jerk / depth).toBeLessThanOrEqual(1)
      }
    // A quick wheel's shorter rise jerks harder, up to the limit the device holds it to.
    const quick = wheelJerks(settingsOf({ speed: 3, accents: 4, depth: 1 }), RATE)
    for (const push of quick) expect(push.jerk).toBe(WHEEL_JERK_MOST)
  })

  it('say what a turn takes, where the melody begins and how many pushes bark', () => {
    expect([0.1, 0.5, 0.35, 1, 3].map(wheelTurnText)).toEqual([
      '10 s',
      '2 s',
      '2.9 s',
      '1 s',
      '0.33 s',
    ])
    const splits = WHEEL_AND_DOG_PARAMS.split.choices ?? []
    expect(splits.map((_, choice) => wheelSplitText(choice, 0))).toEqual([
      'tune on all',
      ...splits.slice(1, -1).map((note) => `tune ${note} up`),
      'no tune',
    ])
    const of = (values: Values): string => wheelBarksText(wheelJerks(settingsOf(values), RATE))
    expect(of({})).toBe('3 barks')
    expect(of({ dog: 0 })).toBe('no bark')
    expect(of({ depth: 0.1 })).toBe('no bark')
    expect(of({ trompette: 0 })).toBe('no bark')
    expect(of({ accents: 3, pattern: 2, depth: 0.3, dog: 0.4 })).toBe('1 bark')
  })
})

describe('the figures against the device itself', () => {
  it('has the bow’s speed round the turn as the ring draws it', async () => {
    for (const values of WHEELS) {
      const set = settingsOf(values)
      const pushes = wheelPushes(set)
      const turn = await oneTurn(values)
      let worst = 0
      let fastest = 0
      for (const { place, turning } of turn) {
        // The device rounds the push off over 2 ms, so its bow is that far behind the drawn one.
        const behind = place - 0.002 * set.speed
        const drawn = wheelBowSpeed(behind < 0 ? behind + 1 : behind, set.depth, pushes)
        worst = Math.max(worst, Math.abs(turning - drawn))
        fastest = Math.max(fastest, turning)
      }
      // A hair over a full rise of 22 ms; a quick wheel's shorter rise is rounded off by more of itself.
      const rise = Math.min(0.022, ...pushes.map((push) => push.rise / set.speed))
      const rounded = 0.04 * Math.pow(0.022 / rise, 3)
      expect(worst, JSON.stringify(values)).toBeLessThan(0.002 + rounded * WHEEL_JUMP * set.depth)
      if (set.count > 0) expect(fastest).toBeGreaterThan(1 + 1.4 * set.depth)
      else expect(fastest).toBeCloseTo(1, 5)
    }
  }, 60000)

  it('has the dog as far open at each push as the jerks say, and over the stretch the ring is thick', async () => {
    let barked = 0
    let silent = 0
    for (const values of WHEELS) {
      const set = settingsOf(values)
      const pushes = wheelJerks(set, RATE)
      const turn = await oneTurn(values)
      const most = turn.reduce((high, { buzz }) => Math.max(high, buzz), 0)
      if (pushes.every((push) => push.open === 0)) expect(most, JSON.stringify(values)).toBe(0)
      for (const push of pushes) {
        const what = `${JSON.stringify(values)} push at ${push.start.toFixed(3)}`
        const own = turn.filter(
          ({ place }) => place >= push.start && place < push.start + push.length,
        )
        const open = own.reduce((high, { buzz }) => Math.max(high, buzz), 0)
        expect(Math.abs(open - push.open), what).toBeLessThan(0.01 + 0.08 * push.open)
        if (push.open < 0.05) {
          silent += 1
          continue
        }
        barked += 1
        // The stretch, to within what the bridge's own 4 ms of opening and a reading make of it.
        const loose = own.filter(({ buzz }) => buzz > 0.04 * push.open)
        const slack = 0.012 * set.speed + 0.02 * (push.to - push.from)
        const first = loose[0].place
        const last = loose[loose.length - 1].place
        const shutBefore = own[0].buzz < 0.01
        if (shutBefore) expect(Math.abs(first - push.from), `${what} opens`).toBeLessThan(slack)
        expect(last, `${what} shuts`).toBeLessThan(push.to + slack)
        // The last of it is a hair's breadth: at the edge of the drawn stretch it is nearly shut.
        expect(last, `${what} shuts`).toBeGreaterThan(push.from + 0.7 * (push.to - push.from))
      }
    }
    expect(barked).toBeGreaterThan(20)
    expect(silent).toBeGreaterThan(5)
  }, 60000)

  it('has the drones and the melody on the notes it names', async () => {
    /** How strong a tone is in the last second of two, the two sides summed. */
    const toneOf = (wave: Float32Array, at: number): number => {
      let re = 0
      let im = 0
      const from = wave.length - RATE
      for (let i = 0; i < RATE; i++) {
        const shade = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / RATE)
        re += shade * wave[from + i] * Math.cos((2 * Math.PI * at * i) / RATE)
        im += shade * wave[from + i] * Math.sin((2 * Math.PI * at * i) / RATE)
      }
      return Math.hypot(re, im) / RATE
    }
    const played = async (values: Values, keys: number[]): Promise<Float32Array> => {
      const loaded = await wheel({
        accents: 0,
        noise: 0,
        tangents: 0,
        body: 0,
        detune: 0,
        spin: 0.05,
        ...values,
      })
      keys.forEach((key, i) => loaded.device.device_note_on?.(i + 1, hz(key), 0.8))
      const wave = new Float32Array(2 * RATE)
      for (let done = 0; done < wave.length; done += BLOCK) {
        loaded.device.device_process(BLOCK)
        const left = loaded.view(loaded.device.device_out_left(), BLOCK)
        const right = loaded.view(loaded.device.device_out_right(), BLOCK)
        for (let i = 0; i < BLOCK; i++) wave[done + i] = 0.5 * (left[i] + right[i])
      }
      return wave
    }
    /** Stronger than a semitone to either side by twenty times. */
    const stands = (wave: Float32Array, at: number, what: string): void => {
      const here = toneOf(wave, at)
      expect(here, what).toBeGreaterThan(20 * toneOf(wave, at * Math.pow(2, 1 / 24)))
      expect(here, what).toBeGreaterThan(20 * toneOf(wave, at / Math.pow(2, 1 / 24)))
    }
    for (let tuning = 0; tuning < WHEEL_TUNINGS.length; tuning++) {
      // A drone key alone, then the note Drone names over whatever key is held.
      for (const [drone, key] of [
        [0, 43],
        [4, 43],
      ]) {
        const [low, second, third] = wheelDrones(drone, tuning, hz(key))
        // Low and second alone, then the third alone: a drone is not read off another's overtones.
        const plain = await played({ drone, tuning, drones: 1, trompette: 0 }, [key])
        const high = await played({ drone, tuning, drones: 0, trompette: 1 }, [key])
        stands(plain, low, `tuning ${tuning} drone ${drone} low`)
        stands(plain, second, `tuning ${tuning} drone ${drone} second`)
        stands(high, third, `tuning ${tuning} drone ${drone} third`)
        expect(toneOf(high, low)).toBeLessThan(0.02 * toneOf(high, third))
      }
    }
    // The drones fall to D where no drone key was played, and the key of a drone makes no melody.
    const alone = await played({ drones: 1, trompette: 0 }, [60])
    stands(alone, wheelDrones(0, 0, hz(38))[0], 'no drone key')
    // The melody: newest, an octave under as well, the two newest.
    for (const [melody, keys] of [
      [0, [60, 65]],
      [1, [60, 67]],
      [2, [60, 65, 69]],
    ] as [number, number[]][]) {
      const wave = await played({ melody, drones: 0, trompette: 0 }, keys)
      const named = wheelMelody(melody, keys.map(hz))
      for (const at of named) stands(wave, at, `melody ${melody}`)
      expect(toneOf(wave, hz(60)), `melody ${melody}: the first key is not heard`).toBeLessThan(
        0.02 * toneOf(wave, named[0]),
      )
    }
    // Split settles which keys are which, by the reading of the melody.
    for (let split = 0; split < (WHEEL_AND_DOG_PARAMS.split.choices?.length ?? 0); split++)
      for (const key of [35, 36, 47, 48, 59, 60, 71, 72, 90]) {
        const loaded = await wheel({ split })
        loaded.device.device_note_on?.(1, hz(key), 0.8)
        loaded.device.device_process(BLOCK)
        expect(readings(loaded).melody, `split ${split} key ${key}`).toBe(
          wheelIsDrone(hz(key), split) ? 0 : 1,
        )
      }
    expect(wheelSplitNote(3)).toBe(48)
  }, 60000)
})

// --- The drawing ------------------------------------------------------------

const lay = wheelLayout(size)
const METERS = { wheel: 0.3, buzz: 0, melodyOn: 0, turning: 1 }

const draw = (values: Values, options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, WHEEL_AND_DOG_PARAMS, { values, ...options })

function signalOf(rms: number): DisplaySignal {
  return {
    input: null,
    output: testLevel(rms * Math.SQRT2),
    spectrum: null,
    binHz: 0,
    left: null,
    right: null,
  }
}

const key = (
  id: number,
  note: number,
  age: number,
  released: number | null = null,
): DisplayNote => ({
  id,
  frequency: hz(note),
  gain: 0.8,
  age,
  released,
})

/** The display run as the plate runs it, frame after frame on one state: every frame's drawing. */
function run(
  values: Values,
  seconds: number,
  each: (time: number) => Partial<FrameOptions>,
  fps = 30,
): RecordingContext[] {
  const state: unknown = display.init?.()
  const frames: RecordingContext[] = []
  for (let n = 0; n < Math.round(seconds * fps); n++) {
    const time = n / fps
    frames.push(
      drawDisplay(display, WHEEL_AND_DOG_PARAMS, {
        values,
        ...each(time),
        state,
        now: 10 + time,
        dt: n === 0 ? 0 : 1 / fps,
      }),
    )
  }
  return frames
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
  colour: string
  alpha: number
}
function rects(drawn: RecordingContext): Rect[] {
  const out: Rect[] = []
  let colour = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      out.push({ x, y, w, h, colour, alpha })
    }
  }
  return out
}
/** The bars of the jerks: the strong part over the line, and the faint part under it. */
const bars = (drawn: RecordingContext): Rect[] =>
  rects(drawn).filter(
    (rect) =>
      rect.x >= lay.jerks.x &&
      rect.y >= lay.jerks.y - 1 &&
      rect.y + rect.h <= lay.jerks.y + lay.jerks.h + 1,
  )
/** The lines under the notes that sound. */
const underlines = (drawn: RecordingContext): Rect[] =>
  rects(drawn).filter((rect) => rect.colour === accent && rect.y === lay.notes + 1.5)
/** The ring of the turn. */
const ringOf = (drawn: RecordingContext): [number, number][] =>
  drawnPaths(drawn).find((path) => path.kind === 'stroke' && path.width === 1.25)?.points ?? []
const thick = (drawn: RecordingContext, colour: string) =>
  drawnPaths(drawn).filter(
    (path) => path.kind === 'stroke' && path.width === 3 && path.colour === colour,
  )
/** The marks filled in the accent. */
function dots(drawn: RecordingContext): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  let colour = ''
  let open: { x: number; y: number }[] = []
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'beginPath') open = []
    else if (call.name === 'arc')
      open.push({ x: call.args[0] as number, y: call.args[1] as number })
    else if (call.name === 'fill' && colour === accent) out.push(...open)
  }
  return out
}
/** Where in the turn a point is, and the bow's speed it stands at. */
function placeOf(x: number, y: number): { place: number; speed: number } {
  const turn = Math.atan2(x - lay.x, lay.y - y) / (2 * Math.PI)
  const out = Math.hypot(x - lay.x, y - lay.y) / lay.radius
  const axle = wheelOut(0, { radius: 1 })
  return { place: turn - Math.floor(turn), speed: ((out - axle) / (1 - axle)) * WHEEL_EDGE }
}

describe('the drawing of Wheel and Dog', () => {
  it('draws the turn as the bow’s speed, with the dog’s stretches thick', () => {
    for (const values of WHEELS) {
      const set = settingsOf(values)
      const pushes = wheelJerks(set, RATE)
      const drawn = draw(values)
      const ring = ringOf(drawn)
      expect(ring.length).toBeGreaterThanOrEqual(121)
      let highest = 0
      for (const [x, y] of ring) {
        const { place, speed } = placeOf(x, y)
        // A hundredth of a pixel round the ring: the steepest rise is a step of that much.
        const near = [-1e-7, 0, 1e-7].map((off) =>
          Math.abs(speed - wheelBowSpeed((place + off + 1) % 1, set.depth, pushes)),
        )
        expect(Math.min(...near), `${JSON.stringify(values)} at ${place}`).toBeLessThan(1e-3)
        highest = Math.max(highest, speed)
      }
      // The top of a push is a point of the ring, however steep it is.
      if (set.count > 0) expect(highest).toBeCloseTo(1 + WHEEL_JUMP * set.depth, 6)
      const stretches = thick(drawn, ink)
      const open = pushes.filter((push) => push.open > 0)
      expect(stretches).toHaveLength(open.length)
      stretches.forEach((path, i) => {
        const turns = (place: number, at: number): number => {
          const apart = Math.abs(((place - at + 1.5) % 1) - 0.5)
          return apart
        }
        expect(turns(placeOf(...path.points[0]).place, open[i].from)).toBeLessThan(1e-6)
        expect(
          turns(placeOf(...path.points[path.points.length - 1]).place, open[i].to % 1),
        ).toBeLessThan(1e-6)
      })
      expect(drawn.words()).toContain(wheelTurnText(set.speed))
      expect(drawn.words()).toContain(wheelBarksText(pushes))
    }
  })

  it('stands every push’s jerk against the line the dog comes loose at', () => {
    const foot = lay.jerks.y + lay.jerks.h
    for (const values of WHEELS) {
      const set = settingsOf(values)
      const pushes = wheelJerks(set, RATE)
      const line = wheelJerkY(wheelThreshold(set.dog), lay.jerks)
      const all = bars(draw(values))
      const strong = all.filter((bar) => bar.alpha === 1)
      const faint = all.filter((bar) => bar.alpha === INK.back)
      expect(faint).toHaveLength(pushes.length)
      expect(strong).toHaveLength(pushes.filter((push) => push.open > 0).length)
      pushes.forEach((push, k) => {
        expect(faint[k].y + faint[k].h).toBeCloseTo(foot, 9)
        const top = wheelJerkY(push.jerk, lay.jerks)
        expect(faint[k].y).toBeCloseTo(push.open > 0 ? line : top, 6)
      })
      for (const bar of strong) expect(bar.y + bar.h).toBeCloseTo(line, 6)
    }
    // The scale: none at the foot, the most the device holds a jerk to at the top, a quarter of it half way.
    expect(wheelJerkY(0, lay.jerks)).toBe(foot)
    expect(wheelJerkY(WHEEL_JERK_MOST, lay.jerks)).toBe(lay.jerks.y)
    expect(wheelJerkY(WHEEL_JERK_MOST / 4, lay.jerks)).toBeCloseTo(foot - lay.jerks.h / 2, 9)
  })

  it('drags Depth by the top of the first push and Dog by its line', () => {
    for (const values of WHEELS) {
      const set = settingsOf(values)
      const handles = display.handles?.(viewOf(display, WHEEL_AND_DOG_PARAMS, { values })) ?? []
      expect(handles.map((each) => each.key)).toEqual(set.count > 0 ? ['depth', 'dog'] : ['dog'])
      for (const want of [0, 0.1, 0.4, 0.75, 1]) {
        // Where the handle stands at that setting is where a drag there puts it.
        const there = display.handles?.(
          viewOf(display, WHEEL_AND_DOG_PARAMS, { values: { ...values, depth: want, dog: want } }),
        )
        for (const each of handles) {
          const to = there?.find((other) => other.key === each.key)
          if (!to) throw new Error('a handle is gone')
          expect(each.drag(to.x, to.y)[each.key]).toBeCloseTo(want, 5)
        }
      }
      for (const each of handles) {
        expect(each.reset?.()[each.key]).toBe(WHEEL_AND_DOG_PARAMS[each.key as Name].default)
        expect(each.drag(-900, -900)[each.key]).toBeGreaterThanOrEqual(0)
        expect(each.drag(900, 900)[each.key]).toBeLessThanOrEqual(1)
      }
    }
  })

  it('marks where the wheel is: at the reading, riding the pushes only while they are slow', () => {
    // Three pushes at half a turn a second: the mark stands on the ring itself.
    const set = settingsOf({})
    const pushes: WheelJerk[] = wheelJerks(set, RATE)
    for (const place of [0.011, 0.1, 0.34, 0.6, 0.9]) {
      const turning = wheelBowSpeed(place, set.depth, pushes)
      const [mark] = dots(draw({}, { meters: { ...METERS, wheel: place, turning } }))
      const [x, y] = wheelPoint(place, turning, lay)
      expect(Math.hypot(mark.x - x, mark.y - y), `at ${place}`).toBeLessThan(0.01)
    }
    // Four a turn at 1.2 turns a second are 4.8 a second: the mark keeps to the even circle.
    const quick = { speed: 1.2, accents: 3, depth: 1 }
    const top = wheelPushes(settingsOf(quick))[1]
    const [mark] = dots(
      draw(quick, { meters: { ...METERS, wheel: top.start + top.rise, turning: 2.5 } }),
    )
    expect(placeOf(mark.x, mark.y).speed).toBeCloseTo(1, 2)
    expect(placeOf(mark.x, mark.y).place).toBeCloseTo(top.start + top.rise, 6)
    // At three turns a second, at a stand, and switched off, there is none.
    expect(dots(draw({ speed: 3 }, { meters: METERS }))).toEqual([])
    expect(dots(draw({}, { meters: { ...METERS, turning: 0 } }))).toEqual([])
    expect(dots(draw({}, { meters: METERS, powered: false }))).toEqual([])
    // Running down, it comes in towards the axle.
    const [slow] = dots(draw({ accents: 0 }, { meters: { ...METERS, turning: 0.4 } }))
    expect(placeOf(slow.x, slow.y).speed).toBeCloseTo(0.4, 6)
  })

  it('lights the bark as the device reads it, over the stretches and the bars', () => {
    const dark = run({}, 1, () => ({ meters: METERS })).pop()
    expect(thick(dark ?? recordingContext(), accent)).toHaveLength(0)
    // A bark held at 0.8 lights all three to within a step of it.
    const lit = run({}, 1, () => ({ meters: { ...METERS, buzz: 0.8 } })).pop() ?? recordingContext()
    expect(thick(lit, accent)).toHaveLength(3)
    for (const path of thick(lit, accent)) expect(Math.abs(path.alpha - 0.8)).toBeLessThan(0.09)
    const bright = bars(lit).filter((bar) => bar.colour === accent)
    expect(bright).toHaveLength(3)
    // It comes up and dies away over several frames, never at one blow.
    const frames = run({}, 2, (time) => ({
      meters: { ...METERS, buzz: time > 0.5 && time < 0.6 ? 1 : 0 },
    }))
    const strengths = frames.map((drawn) => thick(drawn, accent)[0]?.alpha ?? 0)
    expect(Math.max(...strengths)).toBeGreaterThan(0.4)
    for (let n = 1; n < strengths.length; n++)
      expect(Math.abs(strengths[n] - strengths[n - 1])).toBeLessThan(0.55)
    expect(strengths.filter((each) => each > 0).length).toBeGreaterThan(8)
    expect(strengths[strengths.length - 1]).toBe(0)
  })

  it('names the strings, and underlines the ones that sound', () => {
    expect(draw({}).words().slice(-4)).toEqual(['D2', 'D3', 'A3', 'tune C3 up'])
    expect(underlines(draw({}))).toHaveLength(0)
    expect(draw({ melody: 1 }).words().slice(-1)).toEqual(['octave C3 up'])
    expect(draw({ melody: 2 }).words().slice(-1)).toEqual(['duo C3 up'])
    expect(draw({ melody: 2, split: 0 }).words().slice(-1)).toEqual(['duo on all'])
    expect(draw({ melody: 2, split: 8 }).words().slice(-1)).toEqual(['no tune'])
    // At rest a faint line stands under each drone that has some level.
    const faint = (values: Record<string, number>) =>
      rects(draw(values)).filter((rect) => rect.colour === ink && rect.y === lay.notes + 1.5)
    expect(faint({})).toHaveLength(3)
    expect(faint({ drones: 0 })).toHaveLength(1)
    expect(faint({ trompette: 0 })).toHaveLength(2)
    // A drone key and a melody key on the turning wheel.
    const keys = [key(1, 43, 1), key(2, 62, 0.5)]
    const on = { meters: { ...METERS, melodyOn: 1 }, notes: keys }
    expect(draw({}, on).words().slice(-4)).toEqual(['G2', 'G3', 'D4', 'D4'])
    expect(underlines(draw({}, on))).toHaveLength(4)
    expect(underlines(draw({ drones: 0 }, on))).toHaveLength(2)
    expect(underlines(draw({ trompette: 0 }, on))).toHaveLength(3)
    expect(draw({ melody: 1 }, on).words().slice(-1)).toEqual(['D4 D3'])
    const two = { ...on, notes: [...keys, key(3, 69, 0.2)] }
    expect(draw({ melody: 2 }, two).words().slice(-1)).toEqual(['D4 A4'])
    expect(draw({ melody: 0 }, two).words().slice(-1)).toEqual(['A4'])
    // A named drone, another tuning, every key a drone key.
    expect(draw({ drone: 10, tuning: 1 }, on).words().slice(-4, -1)).toEqual(['A2', 'A3', 'D4'])
    expect(draw({ split: 8 }, on).words().slice(-4)).toEqual(
      ['G2', 'G3', 'D4', 'D4'].slice(0, 3).concat('no tune'),
    )
    // A key keeps the side it was struck on when Split moves under it.
    const state: unknown = display.init?.()
    draw({}, { ...on, state })
    expect(
      draw({ split: 8 }, { ...on, state, now: 12, notes: [key(1, 43, 3), key(2, 62, 2.5)] })
        .words()
        .slice(-1),
    ).toEqual(['D4'])
    // The drones stay where the last drone key put them until the wheel has stopped.
    const frames = run({}, 3, (time) => ({
      meters: { ...METERS, turning: time < 2 ? 1 : 0 },
      notes: time < 1 ? [key(1, 43, time)] : [],
    }))
    expect(frames[50].words()).toContain('G2')
    expect(frames[frames.length - 1].words()).toContain('D2')
  })

  it('changes a name no more often than it can be read, and keeps the melody lit between keys', () => {
    // A run of sixteen keys a second over a held drone.
    const frames = run({}, 3, (time) => {
      const n = Math.floor(time * 16)
      return {
        meters: { ...METERS, melodyOn: n % 2 === 0 ? 1 : 0 },
        notes: [key(1, 38, time), key(100 + n, 60 + (n % 7), time - n / 16)],
      }
    })
    const said = frames.map((drawn) => drawn.words().slice(-1)[0])
    const changes: number[] = []
    for (let n = 1; n < said.length; n++) if (said[n] !== said[n - 1]) changes.push(n / 30)
    expect(changes.length).toBeGreaterThan(2)
    for (let n = 1; n < changes.length; n++)
      expect(changes[n] - changes[n - 1]).toBeGreaterThanOrEqual(WHEEL_WORD_SEC - 1e-9)
    for (const drawn of frames.slice(15)) expect(underlines(drawn)).toHaveLength(4)
    expect(WHEEL_LIT_SEC).toBeGreaterThan(2 / 16)
  })

  it('stands at rest and in silence, and reads the level over a second', () => {
    const rest = draw(
      {},
      { signal: signalOf(0), meters: { wheel: 0, buzz: 0, melodyOn: 0, turning: 0 } },
    )
    expect(ringOf(rest).length).toBeGreaterThan(100)
    expect(dots(rest)).toEqual([])
    const foot = (drawn: RecordingContext): number =>
      rects(drawn).find((rect) => rect.colour === accent && rect.y === lay.foot.y)?.w ?? 0
    expect(foot(rest)).toBe(0)
    const steady = run({}, 1.5, () => ({ signal: signalOf(0.1), meters: METERS }))
    expect(Math.abs(foot(steady[steady.length - 1]) / lay.foot.w - 2 / 3)).toBeLessThan(0.03)
  })
})

// --- The timed draw ---------------------------------------------------------

/** Everything the canvas was handed on one frame, in order: the calls' names, numbers and words. */
function handed(drawn: RecordingContext): (number | string)[] {
  const out: (number | string)[] = []
  for (const call of drawn.calls) {
    out.push(call.name)
    for (const arg of call.args.flatMap((each) =>
      Array.isArray(each) ? (each as unknown[]) : [each],
    ))
      out.push(typeof arg === 'number' ? arg : String(arg))
  }
  return out
}

/**
 * The most times any one thing drawn turns back within a second, as it is
 * counted for Twin Bars: a number when it has moved one way by a hundredth
 * and then moves the other way by as much, a word each time it changes.
 */
function mostTurns(frames: RecordingContext[], fps = 30): number {
  const all = frames.map(handed)
  const slots = Math.max(...all.map((each) => each.length))
  let most = 0
  for (let slot = 0; slot < slots; slot++) {
    const turnsAt: number[] = []
    let way = 0
    let far: number | null = null
    let said: string | null = null
    all.forEach((each, n) => {
      const value = each[slot]
      if (value === undefined) return
      if (typeof value === 'string') {
        if (said !== null && value !== said) turnsAt.push(n)
        said = value
        far = null
        way = 0
        return
      }
      if (far === null) {
        far = value
        return
      }
      const step = value - far
      if (way === 0) {
        if (Math.abs(step) >= 0.01) {
          way = Math.sign(step)
          far = value
        }
      } else if (step * way > 0) far = value
      else if (-step * way >= 0.01) {
        turnsAt.push(n)
        way = -way
        far = value
      }
    })
    for (let i = 0; i < turnsAt.length; i++) {
      let within = 0
      for (let j = i; j < turnsAt.length && turnsAt[j] < turnsAt[i] + fps; j++) within += 1
      most = Math.max(most, within)
    }
  }
  return most
}

describe('the timed draw of Wheel and Dog', () => {
  it('turns nothing back more than six times in a second, on any wheel of the device’s own readings', async () => {
    for (const values of WHEELS) {
      const loaded = await wheel(values)
      loaded.device.device_note_on?.(1, hz(38), 0.8)
      loaded.device.device_note_on?.(2, hz(62), 0.8)
      const frames = run(values, 4, (time) => {
        // A frame of the device between two frames of the display.
        for (let done = 0; done < RATE / 30; done += 50) loaded.device.device_process(50)
        const now = readings(loaded)
        return {
          meters: { wheel: now.place, buzz: now.buzz, melodyOn: now.melody, turning: now.turning },
          notes: [key(1, 38, time), key(2, 62, time)],
          signal: signalOf(0.1 + 0.05 * Math.sin(2 * Math.PI * 9 * time)),
        }
      })
      // The run up, over which the mark and the lines first come on, is the first second.
      expect(mostTurns(frames.slice(30)), JSON.stringify(values)).toBeLessThanOrEqual(6)
      // It is a running display that was timed: the mark goes round, where the wheel is slow enough.
      const marks = frames.map((drawn) => dots(drawn)[0]?.x)
      if ((values.speed ?? 0.5) < 3)
        expect(Math.max(...marks.slice(2)) - Math.min(...marks.slice(2))).toBeGreaterThan(4)
      else expect(marks.every((mark) => mark === undefined)).toBe(true)
    }
  }, 60000)
})
