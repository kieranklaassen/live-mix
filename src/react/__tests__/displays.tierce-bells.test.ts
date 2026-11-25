// The truth of the Tierce Bells display. Its arithmetic against the compiled
// device played at 48 kHz (the third of every key in every scale, the glide of
// a strike that leans, how strongly a clapper wakes each partial, how long each
// rings, how a rubbed bell grows, the level it reports), the drawing against
// that arithmetic, its two points, and the timed draw: nothing drawn turns
// back more than six times in a second, which is three swings.

import { describe, expect, it } from 'vitest'

import { TIERCE_BELLS_PARAMS } from '../../dsp/devices/tierce-bells.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { crisp, PLAIN_COLOURS } from '../components/display-kit'
import {
  TIERCE_BELLS,
  TIERCE_BELLS_FACES,
  TIERCE_FOLLOWS_SEC,
  TIERCE_LEVEL,
  TIERCE_MAJOR,
  TIERCE_MINOR,
  TIERCE_NAMED,
  TIERCE_SCALES,
  TIERCE_TICK_SEC,
  TIERCE_TIME_SEC,
  tierceContact,
  tierceGlide,
  tierceKey,
  tierceKind,
  tierceLaneX,
  tierceLaneY,
  tierceLayout,
  tierceLevels,
  tierceName,
  tiercePlace,
  tierceRatio,
  tierceRest,
  tierceRing,
  tierceRungWidth,
  tierceRungY,
  tierceSettings,
  tierceShare,
  tierceTotal,
  type TierceSettings,
} from '../components/displays/tierce-bells'
import {
  type DisplayHandle,
  type DisplayNote,
  type DisplaySignal,
} from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  recordingContext,
  testLevel,
  viewOf,
  type DrawnPath,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const C4 = 261.6256
const display = TIERCE_BELLS_FACES['tierce-bells'].display
const size = displaySize(display)
const at = tierceLayout(size)
const { ink, accent } = PLAIN_COLOURS

type Name = keyof typeof TIERCE_BELLS_PARAMS
type Values = Partial<Record<Name, number>>

const settingsOf = (values: Values = {}): TierceSettings =>
  tierceSettings((name) => values[name as Name] ?? TIERCE_BELLS_PARAMS[name as Name].default)

// --- The compiled device ---------------------------------------------------------

const METERS = { tierce: 0, place: 1, level: 2, prime: 3 } as const

interface Player extends WasmDeviceHarness {
  down(id: number, hz: number, gain: number): void
  up(id: number): void
  meter(name: keyof typeof METERS): number
  /** Runs on for so many seconds and gives what came out, both sides added. */
  run(seconds: number): Float32Array
}

/** The device with these values, so far under full scale that its soft clip is never reached. */
async function playerOf(values: Values = {}, volume = -12): Promise<Player> {
  const loaded = await loadWasmDevice('tierce-bells', RATE)
  for (const [name, value] of Object.entries({ volume, ...values }))
    loaded.set(TIERCE_BELLS_PARAMS[name as Name], value)
  const { device } = loaded
  if (!device.device_note_on || !device.device_note_off) throw new Error('takes no notes')
  const { device_note_on: down, device_note_off: up, device_meter: meter } = device
  if (!meter) throw new Error('reports nothing')
  return {
    ...loaded,
    down: (id, hz, gain) => down(id, hz, gain),
    up: (id) => up(id),
    meter: (name) => meter(METERS[name]),
    run: (seconds) => {
      const total = Math.round((seconds * RATE) / 32) * 32
      const sum = new Float32Array(total)
      for (let done = 0; done < total; done += 32) {
        device.device_process(32)
        const left = loaded.view(device.device_out_left(), 32)
        const right = loaded.view(device.device_out_right(), 32)
        for (let i = 0; i < 32; i++) sum[done + i] = left[i] + right[i]
      }
      return sum
    },
  }
}

/** How strong the sine at `hz` is in a sound around `at` seconds, through a raised-cosine window. */
function toneAt(wave: Float32Array, hz: number, time: number, window: number): number {
  const frames = Math.round(window * RATE)
  const from = Math.round(time * RATE) - Math.floor(frames / 2)
  let re = 0
  let im = 0
  let weight = 0
  for (let i = 0; i < frames; i++) {
    const shade = 0.5 - 0.5 * Math.cos((TWO_PI * (i + 0.5)) / frames)
    const sample = wave[from + i] ?? 0
    re += shade * sample * Math.cos((TWO_PI * hz * (from + i)) / RATE)
    im += shade * sample * Math.sin((TWO_PI * hz * (from + i)) / RATE)
    weight += shade
  }
  return (2 * Math.hypot(re, im)) / weight
}

const keyHz = (key: number): number => C4 * Math.pow(2, key / 12)

describe('the figures of Tierce Bells', () => {
  it('are the header’s: the bells, the scales, the named thirds, the clapper', () => {
    expect(TIERCE_BELLS.map((bell) => bell.name)).toEqual(TIERCE_BELLS_PARAMS.bell.choices)
    expect(TIERCE_SCALES).toHaveLength(TIERCE_BELLS_PARAMS.scale.choices.length)
    // 17, 14, 13 and 12 modes: a pair is two.
    expect(
      TIERCE_BELLS.map((bell) => bell.partials.reduce((n, each) => n + each.levels.length, 0)),
    ).toEqual([17, 14, 13, 12])
    for (const [name, ratio] of [
      ['7/6', 7 / 6],
      ['6/5', 6 / 5],
      ['11/9', 11 / 9],
      ['5/4', 5 / 4],
      ['4/3', 4 / 3],
    ] as const) {
      const named = TIERCE_NAMED.find((each) => each.name === name)
      expect(named?.cents).toBeCloseTo(1200 * Math.log2(ratio), 2)
      expect(tierceName(1200 * Math.log2(ratio))).toBe(name)
    }
    expect(tierceName(330)).toBe('330 ct')
    // `contact`: 1.5 periods soft, 0.08 hard, at full strength 0.8 of it, by the bell's striker.
    expect(tierceContact(0, 0, 1)).toBeCloseTo(1.5 * 0.8, 12)
    expect(tierceContact(3, 1, 1)).toBeCloseTo(0.08 * 1.3 * 0.8, 12)
    expect(tierceContact(2, 0, 0)).toBeCloseTo(1.5 * 0.6 * 1.2, 12)
    // `strike_share`: at no contact and the middle of Hardness every partial is woken whole.
    expect(tierceShare(5, 0, 0.5)).toBe(1)
    expect(tierceShare(2, 1, 0.5)).toBeCloseTo(Math.pow(2, 0.7) / 5, 12)
    expect(tierceShare(2, 0, 1)).toBeCloseTo(Math.pow(2, 0.35), 12)
    expect(tierceShare(0.5, 0, 1)).toBe(1)
  })

  it('give the deciem twice the third’s ratio, whatever the third, and the hum its own pitch', () => {
    const partials = TIERCE_BELLS[0].partials
    const third = partials.find((each) => each.role === 'third')
    const deciem = partials.find((each) => each.role === 'deciem')
    if (!third || !deciem) throw new Error('no third')
    for (const cents of [35, 266.87, 315.64, 400, 498.04, 729]) {
      const set = settingsOf()
      expect(tierceRatio(set, third, cents)).toBeCloseTo(Math.pow(2, cents / 1200), 12)
      expect(tierceRatio(set, deciem, cents) / tierceRatio(set, third, cents)).toBeCloseTo(2, 12)
    }
    expect(tierceRatio(settingsOf({ humPitch: 0.561 }), partials[0], 315)).toBe(0.561)
  })

  it('glide from Lean away to the place, at rest at both ends', () => {
    expect(tierceGlide(386.31, 111.73, 8, 0)).toBeCloseTo(498.04, 9)
    expect(tierceGlide(386.31, 111.73, 8, 4)).toBeCloseTo(386.31 + 111.73 / 2, 9)
    expect(tierceGlide(386.31, 111.73, 8, 8)).toBe(386.31)
    expect(tierceGlide(386.31, 111.73, 8, 30)).toBe(386.31)
    expect(tierceGlide(386.31, 111.73, 8, 0.08)).toBeGreaterThan(497.9)
  })
})

describe('the figures against the device itself', () => {
  it('give every key in every scale the third the device gives it', async () => {
    const player = await playerOf({ decay: 0.5, release: 1 })
    let asked = 0
    for (const tierce of [300, 347.41, 360, 450])
      for (let scale = 0; scale < TIERCE_SCALES.length; scale++)
        for (let root = 0; root < 12; root++) {
          player.set(TIERCE_BELLS_PARAMS.tierce, tierce)
          player.set(TIERCE_BELLS_PARAMS.scale, scale)
          player.set(TIERCE_BELLS_PARAMS.root, root)
          const set = settingsOf({ tierce, scale, root })
          for (let key = 0; key < 12; key++) {
            player.down(1, keyHz(key), 0.5)
            const place = player.meter('place')
            if (Math.abs(place - tiercePlace(set, key)) > 0.02)
              throw new Error(`scale ${scale} root ${root} key ${key}: ${place}`)
            asked += 1
          }
          // Let go and choked, so that the next round finds every voice idle.
          player.up(1)
          player.run(0.25)
        }
    expect(asked).toBe(4 * 7 * 12 * 12)
    // Off, every key takes the knob.
    player.set(TIERCE_BELLS_PARAMS.follow, 0)
    player.down(1, keyHz(4), 0.5)
    expect(player.meter('place')).toBeCloseTo(450, 2)
    expect(tiercePlace(settingsOf({ follow: 0, tierce: 450 }), 4)).toBe(450)
  }, 60000)

  it('rings C F A D G E C of C major major, major, minor, minor, major, minor, major', () => {
    const set = settingsOf()
    const keys = [0, 5, 9, 2, 7, 4, 0]
    const M = TIERCE_MAJOR
    const m = TIERCE_MINOR
    expect(keys.map((key) => tiercePlace(set, key))).toEqual([M, M, m, m, M, m, M])
    expect(keys.map((key) => tierceKind(set, key)).join(' ')).toBe(
      'major major minor minor major minor major',
    )
    // A key outside the scale takes the knob, and so does every key when Follow is off.
    expect(tierceKind(set, 1)).toBe('knob')
    expect(tiercePlace(settingsOf({ tierce: 340 }), 1)).toBe(340)
    expect(tierceKind(settingsOf({ follow: 0 }), 0)).toBe('knob')
    // A note thirty cents sharp is still its key.
    expect(tierceKey(C4 * Math.pow(2, 30 / 1200))).toBe(0)
    expect(tierceKey(keyHz(9))).toBe(9)
    expect(tierceKey(220)).toBe(9)
  })

  it('moves a leaning strike’s third as the device does', async () => {
    for (const values of [
      { follow: 0, tierce: 386.31, lean: 111.73, glide: 8 },
      { follow: 0, tierce: 315.64, lean: -231, glide: 1.5 },
      { lean: 70, glide: 0.3 },
    ] as Values[]) {
      const set = settingsOf(values)
      const player = await playerOf({ ...values, decay: 24 })
      player.down(1, C4, 0.7)
      const place = tiercePlace(set, 0)
      expect(player.meter('tierce')).toBeCloseTo(place + set.lean, 2)
      let time = 0
      let worst = 0
      while (time < set.glide * 1.2) {
        player.run(0.032)
        time += 0.032
        // The device steps once in 32 samples, 0.7 ms.
        const want = [time, time - 0.0007].map((t) => tierceGlide(place, set.lean, set.glide, t))
        const is = player.meter('tierce')
        worst = Math.max(worst, Math.min(...want.map((each) => Math.abs(each - is))))
      }
      expect(worst, JSON.stringify(values)).toBeLessThan(0.6)
      expect(player.meter('tierce')).toBeCloseTo(place, 2)
    }
  }, 60000)

  it('reports the level the partials add up to, as soon as the clapper lands, at any setting', async () => {
    const cases: Values[] = [
      {},
      { humLevel: 1, quint: 0, upper: 0.2 },
      { humLevel: 0, quint: 1, upper: 1, hardness: 1 },
      { hardness: 0, upper: 0.7 },
    ]
    for (let bell = 0; bell < 3; bell++)
      for (const more of cases)
        for (const gain of [0.3, 1])
          for (const hz of [110, 440, 5200]) {
            const values = { ...more, bell, decay: 30 }
            const set = settingsOf(values)
            const player = await playerOf(values)
            player.down(1, hz, gain)
            const place = tiercePlace(set, tierceKey(hz))
            const want = tierceTotal(tierceLevels(set, hz, gain, place, 0, 0, RATE))
            expect(player.meter('level') / want, JSON.stringify({ values, gain, hz })).toBeCloseTo(
              1,
              2,
            )
          }
  }, 60000)

  it('wakes each partial as strongly as the display has it, and rings it as long', async () => {
    const hz = 220
    for (let bell = 0; bell < 3; bell++)
      for (const { hardness, damping } of [
        { hardness: 0.5, damping: 0.4 },
        { hardness: 0.1, damping: 0 },
        { hardness: 0.9, damping: 0.2 },
      ]) {
        // Doublet wide, so that the two halves of a pair are read apart; Spread 0, so both sides are alike.
        const values: Values = {
          bell,
          hardness,
          damping,
          decay: 40,
          doublet: 4,
          spread: 0,
          follow: 0,
          tierce: 386.31,
        }
        const set = settingsOf(values)
        const player = await playerOf(values)
        player.down(1, hz, 1)
        const wave = player.run(2.4)
        const levels = tierceLevels(set, hz, 1, set.tierce, 0, 0, RATE)
        TIERCE_BELLS[bell].partials.forEach((partial, k) => {
          const seconds = tierceRing(set, partial)
          const ratio = tierceRatio(set, partial, set.tierce)
          const whole = Math.hypot(...partial.levels)
          const mates = partial.levels.length === 2 ? [0.4, -0.6] : [0]
          partial.levels.forEach((level, i) => {
            const tone = hz * ratio + 4 * mates[i]
            const what = `${TIERCE_BELLS[bell].name} at ${partial.ratio}, half ${i}, ${hardness}`
            // At -12 dB, at 0.7071 of it a side and two sides added.
            const out = Math.pow(10, -12 / 20) * Math.SQRT2
            const first = toneAt(wave, tone, 0.6, 1)
            const want = ((levels[k] * level) / whole) * out
            // A ring much shorter than the window is not read by it.
            if (seconds < 4) return
            const struck = first * Math.pow(10, (3 * 0.6) / seconds)
            expect(struck / want, `${what} struck`).toBeGreaterThan(0.93)
            expect(struck / want, `${what} struck`).toBeLessThan(1.1)
            const second = toneAt(wave, tone, 1.8, 1)
            const ring = (3 * 1.2) / Math.log10(first / second)
            expect(ring / seconds, `${what} rings`).toBeGreaterThan(0.95)
            expect(ring / seconds, `${what} rings`).toBeLessThan(1.05)
          })
        })
      }
  }, 120000)

  it('falls, and grows under a rub, at the level the device reports', async () => {
    const hz = 330
    const runs: { values: Values; offAt: number | null }[] = [
      { values: { bell: 0, decay: 6 }, offAt: null },
      { values: { bell: 2, decay: 8, damping: 0.6 }, offAt: null },
      { values: { bell: 3, decay: 10 }, offAt: null },
      { values: { bell: 3, decay: 10, hardness: 0.9, upper: 1 }, offAt: null },
      { values: { bell: 3, decay: 5, hardness: 0 }, offAt: null },
      // Let go with Release 0 a rubbed bell only falls.
      { values: { bell: 3, decay: 5, release: 0 }, offAt: 1.2 },
    ]
    for (const { values, offAt } of runs) {
      const set = settingsOf(values)
      const player = await playerOf(values)
      player.down(1, hz, 0.8)
      const place = tiercePlace(set, tierceKey(hz))
      let time = 0
      let freed = false
      for (let n = 0; n < 60; n++) {
        if (offAt !== null && !freed && time >= offAt) {
          player.up(1)
          freed = true
        }
        player.run(0.064)
        time = (n + 1) * 0.064
        const off = offAt === null ? 0 : Math.max(0, time - Math.ceil(offAt / 0.064) * 0.064)
        const worked = tierceTotal(tierceLevels(set, hz, 0.8, place, time, off, RATE))
        // `floor`: a rubbed bell whose key is down reports no less than this, or than its strike.
        const floor = Math.max(
          0.86 * 0.105 * 0.8,
          tierceTotal(tierceLevels(set, hz, 0.8, place, 0, 0, RATE)),
        )
        const want = set.bell === 3 && !freed ? Math.max(worked, floor) : worked
        const is = player.meter('level')
        expect(is / want, `${JSON.stringify(values)} at ${time.toFixed(2)}`).toBeGreaterThan(0.95)
        expect(is / want, `${JSON.stringify(values)} at ${time.toFixed(2)}`).toBeLessThan(1.05)
      }
    }
  }, 60000)
})

// --- The drawing ------------------------------------------------------------

const draw = (values: Values, options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, TIERCE_BELLS_PARAMS, { values, ...options })

/** A sound that comes out at `rms`. */
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

const noteOf = (
  hz: number,
  age: number,
  released: number | null = null,
  gain = 1,
  id = Math.round(hz),
): DisplayNote => ({ id, frequency: hz, gain, age, released })

/** What the device reports of a bell at `hz`, `age` seconds after a strike, by the arithmetic held above. */
function metersAt(values: Values, hz: number, age: number, gain = 1): Record<string, number> {
  const set = settingsOf(values)
  const place = tiercePlace(set, tierceKey(hz))
  const tierce = tierceGlide(place, set.lean, set.glide, age)
  const level = tierceTotal(tierceLevels(set, hz, gain, tierce, age, 0, RATE))
  return { tierce, place, level, prime: hz }
}

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
      drawDisplay(display, TIERCE_BELLS_PARAMS, {
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

const strokes = (drawn: RecordingContext): DrawnPath[] =>
  drawnPaths(drawn).filter((path) => path.kind === 'stroke' && path.points.length > 1)

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

interface Arc {
  x: number
  y: number
  r: number
  colour: string
}
/** The dots that were filled: the ringing bell's third in the accent, the two handles in the plate. */
function arcs(drawn: RecordingContext): Arc[] {
  const out: Arc[] = []
  let colour = ''
  let open: Omit<Arc, 'colour'>[] = []
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'beginPath') open = []
    else if (call.name === 'arc') {
      const [x, y, r] = call.args as number[]
      open.push({ x, y, r })
    } else if (call.name === 'fill') out.push(...open.map((each) => ({ ...each, colour })))
  }
  return out
}

/** The rungs lit for the bell that rings: bars three pixels high from the ladder's line. */
const lit = (drawn: RecordingContext): Rect[] =>
  rects(drawn).filter((rect) => rect.x === at.ladder.x && rect.h === 3)
const keyBars = (drawn: RecordingContext): Rect[] =>
  rects(drawn).filter(
    (rect) => Math.abs(rect.y + rect.h - (at.keys.y + at.keys.h)) < 1e-9 && rect.w > 3,
  )
/** The word of the third at the right of the head. */
const thirdWord = (drawn: RecordingContext): string => drawn.words()[1]

const handleOf = (values: Values, key: string): DisplayHandle => {
  const all = display.handles?.(viewOf(display, TIERCE_BELLS_PARAMS, { values })) ?? []
  const found = all.find((each) => each.key === key)
  if (!found) throw new Error(`no handle ${key}`)
  return found
}

const shown = TIERCE_BELLS.map((bell) => bell.partials.filter((each) => each.ratio <= 3))

describe('the drawing of Tierce Bells', () => {
  it('draws each partial at its pitch, as long as a full strike leaves it, ticked two seconds on', () => {
    const cases: Values[] = []
    for (let bell = 0; bell < TIERCE_BELLS.length; bell++)
      cases.push(
        { bell, root: 7 },
        { bell, follow: 0, tierce: 498.1, humPitch: 0.561, humLevel: 0.8, upper: 0.3 },
        { bell, hardness: 0.9, quint: 0.1, decay: 3, damping: 0.7 },
      )
    for (const values of cases) {
      const set = settingsOf(values)
      const hz = keyHz(set.root)
      const cents = tierceRest(set)
      const full = tierceLevels(set, hz, 1, cents, 0, 0, RATE)
      const later = tierceLevels(set, hz, 1, cents, TIERCE_TICK_SEC, 0, RATE)
      const drawn = draw(values)
      const paths = strokes(drawn)
      let rungs = 0
      TIERCE_BELLS[set.bell].partials.forEach((partial, k) => {
        const ratio = tierceRatio(set, partial, cents)
        if (ratio > 3.15) return
        const y = crisp(tierceRungY(ratio, at.ladder))
        const moves = partial.role === 'third' || partial.role === 'deciem'
        const colour = moves ? accent : ink
        const wide = tierceRungWidth(full[k], at.ladder)
        if (wide === 0) return
        const rung = paths.find(
          (path) =>
            path.points.length === 2 &&
            path.colour === colour &&
            path.points[0][0] === at.ladder.x &&
            path.points[0][1] === y &&
            Math.abs(path.points[1][0] - (at.ladder.x + wide)) < 1e-9,
        )
        expect(rung, `${JSON.stringify(values)} ${partial.ratio}`).toBeDefined()
        rungs += 1
        const left = tierceRungWidth(later[k], at.ladder)
        const tick = paths.some(
          (path) =>
            path.points.length === 2 &&
            path.points[0][0] === crisp(at.ladder.x + left) &&
            path.points[0][1] === y - 1.5 &&
            path.points[1][1] === y + 1.5,
        )
        if (left > 0) expect(tick, `tick of ${partial.ratio}`).toBe(true)
      })
      expect(rungs).toBeGreaterThanOrEqual(5)
      expect(shown[set.bell].length).toBeGreaterThanOrEqual(5)
      // At rest nothing is lit.
      expect(lit(drawn)).toEqual([])
      expect(drawn.words()).toEqual(
        expect.arrayContaining([TIERCE_BELLS[set.bell].name, 'hum', 'prime', 'quint', 'nominal']),
      )
    }
    // The scale is octaves: hum to prime is prime to nominal.
    const [hum, prime, nominal] = [0.5, 1, 2].map((ratio) => tierceRungY(ratio, at.ladder))
    expect(hum - prime).toBeCloseTo(prime - nominal, 9)
    // And dB: ten times the level is twenty of them, wherever it is.
    const wide = (level: number): number => tierceRungWidth(TIERCE_LEVEL * level, at.ladder)
    expect(wide(0.5) - wide(0.05)).toBeCloseTo((20 / 44) * at.ladder.w, 9)
    expect(wide(0)).toBe(0)
    // No bell at its first settings runs off the ladder's end.
    for (let bell = 0; bell < 4; bell++)
      for (const level of tierceLevels(settingsOf({ bell }), C4, 1, 386.31, 0, 0, RATE))
        expect(tierceRungWidth(level, at.ladder)).toBeLessThan(at.ladder.w)
  })

  it('ties the third to the deciem, which stays an octave over it as the third moves', () => {
    for (const tierce of [266.9, 340, 498]) {
      const values = { follow: 0, tierce }
      const tie = strokes(draw(values)).find(
        (path) =>
          path.colour === accent &&
          path.points.length === 4 &&
          path.points[1][0] === at.ladder.x - 3,
      )
      const ratio = Math.pow(2, tierce / 1200)
      expect(tie?.points.map(([, y]) => y)).toEqual(
        [ratio, ratio, 2 * ratio, 2 * ratio].map((each) => crisp(tierceRungY(each, at.ladder))),
      )
    }
  })

  it('rules the five named thirds across the lane and names them', () => {
    const drawn = draw({})
    const ruled = strokes(drawn).filter(
      (path) =>
        path.points.length === 2 &&
        path.points[0][0] === at.lane.x &&
        path.points[1][0] === at.lane.x + at.lane.w + 4,
    )
    expect(ruled.map((path) => path.points[0][1])).toEqual(
      TIERCE_NAMED.map(({ cents }) => crisp(tierceLaneY(cents, at.lane))),
    )
    for (const { name } of TIERCE_NAMED) expect(drawn.words()).toContain(name)
    // Cents are even steps up the lane.
    expect(tierceLaneY(300, at.lane) - tierceLaneY(400, at.lane)).toBeCloseTo(
      tierceLaneY(400, at.lane) - tierceLaneY(500, at.lane),
      9,
    )
    // Time is a root: four times as long is twice as far.
    const from = tierceLaneX(0, at.lane)
    expect(tierceLaneX(4, at.lane) - from).toBeCloseTo(2 * (tierceLaneX(1, at.lane) - from), 9)
    expect(tierceLaneX(TIERCE_TIME_SEC, at.lane)).toBe(at.lane.x + at.lane.w)
  })

  it('draws the way of a strike’s third from Lean to its place over Glide', () => {
    for (const values of [
      {},
      { lean: 111.7, glide: 8 },
      { follow: 0, tierce: 498, lean: -182, glide: 20 },
      { root: 9, scale: 1, lean: 70, glide: 0.3 },
    ] as Values[]) {
      const set = settingsOf(values)
      const place = tiercePlace(set, set.root)
      expect(tierceRest(set)).toBe(place)
      const way = strokes(draw(values)).filter(
        (path) => path.width === 1.5 && path.colour === ink && path.points.length > 8,
      )
      expect(way).toHaveLength(1)
      const [[x0, y0], ...points] = way[0].points
      expect(x0).toBe(at.lane.x)
      expect(y0).toBe(tierceLaneY(place + set.lean, at.lane))
      for (const [x, y] of points) {
        const share =
          (x - tierceLaneX(0, at.lane)) / (at.lane.x + at.lane.w - tierceLaneX(0, at.lane))
        const cents = tierceGlide(place, set.lean, set.glide, TIERCE_TIME_SEC * share * share)
        expect(y).toBeCloseTo(tierceLaneY(cents, at.lane), 6)
      }
      // The points: Lean's where the way begins, the knob's where Glide ends.
      const marks = arcs(draw(values)).filter((arc) => arc.colour === PLAIN_COLOURS.plate)
      expect(marks[0]).toMatchObject({ x: at.lane.x, y: y0 })
      expect(marks[1]).toMatchObject({
        x: tierceLaneX(set.glide, at.lane),
        y: tierceLaneY(set.tierce, at.lane),
      })
    }
  })

  it('says under it which third each key gets: tall, half or a line, the root ticked', () => {
    for (const values of [
      {},
      { root: 2, scale: 1 },
      { root: 9, scale: 3 },
      { follow: 0 },
    ] as Values[]) {
      const set = settingsOf(values)
      const bars = keyBars(draw(values))
      expect(bars).toHaveLength(12)
      bars.forEach((bar, key) => {
        const kind = tierceKind(set, key)
        const want = kind === 'major' ? at.keys.h : kind === 'minor' ? at.keys.h / 2 : 1
        expect(bar.h, `key ${key}`).toBe(want)
        expect(bar.colour).toBe(ink)
      })
      const tick = rects(draw(values)).filter(
        (rect) => rect.w === 3 && rect.h === 1 && rect.y === at.keys.y + at.keys.h + 1,
      )
      expect(tick).toHaveLength(set.follow ? 1 : 0)
      if (set.follow)
        expect(tick[0].x + 1.5).toBeCloseTo(at.keys.x + ((set.root + 0.5) * at.keys.w) / 12, 9)
    }
    // C major: C F G are tall, D E A half, the rest lines (the B has neither third).
    expect(
      keyBars(draw({}))
        .map((bar) => bar.h)
        .map((h) => (h === at.keys.h ? 'M' : h === 1 ? '.' : 'm'))
        .join(''),
    ).toBe(
      Array.from({ length: 12 }, (_, key) => tierceKind(settingsOf(), key))
        .map((kind) => (kind === 'major' ? 'M' : kind === 'minor' ? 'm' : '.'))
        .join(''),
    )
  })

  it('shows the bell that rings: its third, its way, its key, its rungs at the level reported', () => {
    for (const bell of [0, 1, 2]) {
      const values: Values = { bell, lean: 112, glide: 8, decay: 12 }
      const set = settingsOf(values)
      const hz = keyHz(4)
      const meters = metersAt(values, hz, 1, 0.6)
      // Softer than worked out, as a bell is whose key has been let go.
      meters.level *= 0.5
      const drawn = draw(values, { meters, notes: [noteOf(hz, 1, null, 0.6)] })
      const [spot] = arcs(drawn).filter((arc) => arc.colour === accent)
      expect(spot.x).toBeCloseTo(tierceLaneX(1, at.lane), 9)
      expect(spot.y).toBeCloseTo(tierceLaneY(meters.tierce, at.lane), 9)
      // E is minor in C major and the root major: the ringing bell's way is its own, in the accent.
      const way = strokes(drawn).find((path) => path.colour === accent && path.points.length > 8)
      expect(way?.points[0][1]).toBeCloseTo(tierceLaneY(TIERCE_MINOR + 112, at.lane), 9)
      expect(drawn.words()).toContain(`E4  ${tierceName(meters.tierce)}`)
      const keys = keyBars(drawn)
      keys.forEach((bar, key) => expect(bar.colour).toBe(key === 4 ? accent : ink))
      const levels = tierceLevels(set, hz, 0.6, meters.tierce, 1, 0, RATE)
      const want: Rect[] = []
      TIERCE_BELLS[bell].partials.forEach((partial, k) => {
        const ratio = tierceRatio(set, partial, meters.tierce)
        const w = tierceRungWidth(levels[k] * 0.5, at.ladder)
        if (ratio > 3.15 || w === 0) return
        const moves = partial.role === 'third' || partial.role === 'deciem'
        const y = crisp(tierceRungY(ratio, at.ladder)) - 1.5
        want.push({ x: at.ladder.x, y, w, h: 3, colour: moves ? accent : ink, alpha: 1 })
      })
      const bars = lit(drawn)
      expect(bars).toHaveLength(want.length)
      expect(want.length).toBeGreaterThanOrEqual(3)
      bars.forEach((bar, i) => {
        expect(bar).toMatchObject({ y: want[i].y, colour: want[i].colour })
        expect(bar.w).toBeCloseTo(want[i].w, 6)
      })
    }
  })

  it('draws a rubbed bell that is held as worked out, so it is seen to grow', () => {
    const values: Values = { bell: 3 }
    const hz = keyHz(0)
    const prime = (age: number): number => {
      // The device reports the same level all the while: its floor.
      const meters = { ...metersAt(values, hz, age), level: 0.09 }
      const bars = lit(draw(values, { meters, notes: [noteOf(hz, age)] }))
      const y = crisp(tierceRungY(1, at.ladder)) - 1.5
      return bars.find((bar) => bar.y === y)?.w ?? 0
    }
    expect(prime(1)).toBeGreaterThan(prime(0.1) + 1)
    // And it stays: rubbed, it does not die.
    expect(prime(6)).toBeGreaterThan(prime(0.1) + 1)
  })

  it('draws at rest, in silence and switched off, without the bell that rang', () => {
    const rest = draw({})
    expect(rest.words()).toContain('C4  5/4')
    expect(arcs(rest).filter((arc) => arc.colour === accent)).toEqual([])
    const meters = metersAt({}, keyHz(9), 1)
    const off = draw({}, { meters, notes: [noteOf(keyHz(9), 1)], powered: false })
    expect(lit(off)).toEqual([])
    expect(arcs(off).filter((arc) => arc.colour === accent)).toEqual([])
    expect(off.words()).toContain('C4  5/4')
    const silent = draw({}, { meters: { tierce: 0, place: 0, level: 0, prime: 0 } })
    expect(silent.print()).toBe(rest.print())
    // A bell the plate has no note of, and a level of nothing, are drawn too.
    expect(draw({}, { meters }).words()).toContain('A4  6/5')
    for (const { value } of draw({}, { meters: { ...meters, level: 0 } }).numbers())
      expect(Number.isFinite(value)).toBe(true)
  })

  it('fits both sizes of plate: every name apart from the next, nothing past the edge', () => {
    for (const width of [size.width, size.width * 1.7]) {
      const lay = tierceLayout({ width, height: size.height })
      expect(lay.ladder.w).toBeGreaterThan(14)
      expect(lay.names).toBeGreaterThan(lay.ladder.x + lay.ladder.w)
      expect(lay.lane.x).toBeGreaterThan(lay.marks)
      expect(lay.lane.w).toBeGreaterThan(24)
      expect(lay.lane.x + lay.lane.w + 4).toBeLessThanOrEqual(width - 4)
      const written = drawDisplay(display, TIERCE_BELLS_PARAMS, { width }).calls.filter(
        (call) => call.name === 'fillText',
      )
      const marks = written.filter((call) => TIERCE_NAMED.some((n) => n.name === call.args[0]))
      const ys = marks.map((call) => Number(call.args[2])).sort((a, b) => a - b)
      for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(8)
      const names = written.filter((call) =>
        ['hum', 'prime', 'quint', 'nominal'].includes(String(call.args[0])),
      )
      const rows = names.map((call) => Number(call.args[2])).sort((a, b) => a - b)
      for (let i = 1; i < rows.length; i++) expect(rows[i] - rows[i - 1]).toBeGreaterThanOrEqual(8)
    }
  })
})

describe('the points of Tierce Bells', () => {
  it('sets Tierce up and down and Glide along, by the scales that are drawn', () => {
    const values: Values = { tierce: 330, glide: 1.5 }
    const point = handleOf(values, 'tierce')
    expect(point.drag(point.x, point.y, {})).toEqual({ tierce: 330, glide: 1.5 })
    const x = tierceLaneX(8, at.lane)
    const y = tierceLaneY(440, at.lane)
    const set = point.drag(x, y, {})
    expect(set.tierce).toBeCloseTo(440, 6)
    expect(set.glide).toBeCloseTo(8, 6)
    // Held to the knob's range.
    const far = point.drag(x, at.lane.y - 200, {})
    expect(far.tierce).toBeLessThanOrEqual(TIERCE_BELLS_PARAMS.tierce.max)
    const low = point.drag(-500, at.lane.y + 900, {})
    expect(low.tierce).toBeGreaterThanOrEqual(TIERCE_BELLS_PARAMS.tierce.min)
    expect(low.glide).toBeCloseTo(TIERCE_BELLS_PARAMS.glide.min, 9)
    expect(point.reset?.()).toEqual({
      tierce: TIERCE_BELLS_PARAMS.tierce.default,
      glide: TIERCE_BELLS_PARAMS.glide.default,
    })
    expect(point.wheel?.(1)).toEqual({ tierce: 331 })
  })

  it('lands on a named third when it comes near one', () => {
    const point = handleOf({ tierce: 450 }, 'tierce')
    for (const { cents } of TIERCE_NAMED) {
      const want = Math.min(
        Math.max(cents, TIERCE_BELLS_PARAMS.tierce.min),
        TIERCE_BELLS_PARAMS.tierce.max,
      )
      const near = point.drag(point.x, tierceLaneY(cents, at.lane) + 1, {})
      expect(near.tierce).toBeCloseTo(want, 1)
      const off = point.drag(point.x, tierceLaneY(cents, at.lane) - 2.5, {})
      if (cents < 440) expect(Math.abs(off.tierce - cents)).toBeGreaterThan(2)
    }
  })

  it('sets Lean from where it stands, off the scale too, and lands on none', () => {
    const point = handleOf({ lean: 40 }, 'lean')
    const step = tierceLaneY(300, at.lane) - tierceLaneY(340, at.lane)
    expect(point.drag(point.x, point.y - step, {}).lean).toBeCloseTo(80, 6)
    expect(point.drag(point.x, point.y + step + 0.5, {}).lean).toBe(0)
    // A start far over the scale stands at its edge and moves from its own value.
    const high = handleOf({ lean: 231 }, 'lean')
    expect(high.y).toBe(at.lane.y)
    expect(high.drag(high.x, high.y, {}).lean).toBe(231)
    expect(high.drag(high.x, high.y + step, {}).lean).toBeCloseTo(191, 6)
    expect(high.drag(high.x, high.y - 400, {}).lean).toBe(TIERCE_BELLS_PARAMS.lean.max)
    expect(high.reset?.()).toEqual({ lean: 0 })
  })

  it('keeps to the press while the setting it moves is drawn again under it', () => {
    const hold = {}
    const first = handleOf({ tierce: 330 }, 'tierce')
    const up = first.drag(first.x, first.y - 10, hold)
    const again = handleOf({ tierce: up.tierce }, 'tierce')
    expect(again.drag(first.x, first.y - 10, hold).tierce).toBeCloseTo(up.tierce, 9)
  })
})

// --- The timed draw ----------------------------------------------------------

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
 * The most times any one thing drawn turns back within a second. A thing is
 * a place in the order of what the canvas is handed: a coordinate, a size, a
 * strength, a colour or a word. A number turns back when it has moved one
 * way by a hundredth (of a pixel, or of full strength) and then moves the
 * other way by as much; a colour or a word, each time it changes.
 */
function mostTurns(frames: RecordingContext[], fps = 30): { turns: number; moved: number } {
  const all = frames.map(handed)
  const slots = Math.max(...all.map((each) => each.length))
  let most = 0
  let moved = 0
  for (let slot = 0; slot < slots; slot++) {
    const turnsAt: number[] = []
    let way = 0
    let far: number | null = null
    let said: string | null = null
    let changed = false
    all.forEach((each, n) => {
      const value = each[slot]
      if (value === undefined) return
      if (typeof value === 'string') {
        if (said !== null && value !== said) turnsAt.push(n)
        if (said !== null && value !== said) changed = true
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
          changed = true
        }
      } else if (step * way > 0) far = value
      else if (-step * way >= 0.01) {
        turnsAt.push(n)
        way = -way
        far = value
      }
    })
    if (changed) moved += 1
    for (let i = 0; i < turnsAt.length; i++) {
      let within = 0
      for (let j = i; j < turnsAt.length && turnsAt[j] < turnsAt[i] + fps; j++) within += 1
      most = Math.max(most, within)
    }
  }
  return { turns: most, moved }
}

describe('the timed draw of Tierce Bells', () => {
  it('counts what turns back: a light at six a second is caught, a slow mark is not', () => {
    const lamp = (rate: number): RecordingContext[] =>
      Array.from({ length: 60 }, (_, n) => {
        const drawn = recordingContext()
        drawn.ctx.globalAlpha = 0.5 + 0.5 * Math.cos((TWO_PI * rate * n) / 30)
        drawn.ctx.fillRect(n, 0, 4, 4)
        return drawn
      })
    expect(mostTurns(lamp(6)).turns).toBeGreaterThan(6)
    expect(mostTurns(lamp(0.5)).turns).toBeLessThanOrEqual(2)
  })

  it('follows a bell for half a second at least, however fast the keys come', () => {
    const pitches = [0, 4, 9, 2, 7].map(keyHz)
    for (const bell of [0, 2, 3])
      for (const rate of [3, 5, 8, 16])
        // Every strike rings on, or every bell has died before the next is struck.
        for (const short of [false, true])
          for (const lean of [0, 112]) {
            const values: Values = { bell, lean, glide: 1.5 }
            const frames = run(values, 3, (time) => {
              const n = Math.floor(time * rate + 1e-9)
              const age = time - n / rate
              const hz = pitches[n % pitches.length]
              const dead = short && age > 0.5 / rate
              const notes: DisplayNote[] = []
              for (let k = Math.max(0, n - 4); k <= n; k++)
                notes.push(
                  noteOf(
                    pitches[k % pitches.length],
                    time - k / rate,
                    time - k / rate > 0.03 ? time - k / rate - 0.03 : null,
                    0.8,
                    k,
                  ),
                )
              return {
                meters: dead
                  ? { tierce: 0, place: 0, level: 0, prime: 0 }
                  : metersAt(values, hz, age, 0.8),
                notes: dead ? [] : notes,
                signal: signalOf(dead ? 0 : 0.2),
              }
            })
            const { turns, moved } = mostTurns(frames)
            expect(turns, `${rate} a second, bell ${bell}, ${short}, ${lean}`).toBeLessThanOrEqual(
              6,
            )
            expect(moved).toBeGreaterThan(0)
            // The bell it shows changes no oftener than it says.
            let last = -1
            for (let n = 1; n < frames.length; n++) {
              const keyNow = keyBars(frames[n]).findIndex((bar) => bar.colour === accent)
              const before = keyBars(frames[n - 1]).findIndex((bar) => bar.colour === accent)
              if (keyNow === before || before < 0 || keyNow < 0) continue
              if (last >= 0) expect((n - last) / 30).toBeGreaterThan(TIERCE_FOLLOWS_SEC - 0.034)
              last = n
            }
          }
  }, 60000)

  it('moves the third slowly as it glides, and changes its word twice a second at most', () => {
    const values: Values = { follow: 0, tierce: 386.3, lean: 111.7, glide: 8 }
    const frames = run(values, 9, (time) => ({
      meters: metersAt(values, C4, time),
      notes: [noteOf(C4, time)],
    }))
    expect(mostTurns(frames).turns).toBeLessThanOrEqual(6)
    const words = frames.map(thirdWord)
    expect(words[0]).toBe('C4  4/3')
    expect(words.at(-1)).toBe('C4  5/4')
    let last = 0
    for (let n = 1; n < words.length; n++) {
      if (words[n] === words[n - 1]) continue
      expect((n - last) / 30).toBeGreaterThan(TIERCE_FOLLOWS_SEC - 0.034)
      last = n
    }
    // The dot goes one way only: down, as Lean is up.
    const dots = frames.map((drawn) => arcs(drawn).find((arc) => arc.colour === accent)?.y ?? NaN)
    for (let n = 1; n < dots.length; n++) expect(dots[n]).toBeGreaterThanOrEqual(dots[n - 1] - 1e-9)
    expect(dots[dots.length - 1] - dots[0]).toBeGreaterThan(10)
  })
})
