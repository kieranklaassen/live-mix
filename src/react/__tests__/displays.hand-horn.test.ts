// The truth of the Hand Horn display. Its ladder against the compiled device's
// own readings (where a key sounds, how far the hand is in, which partial it
// is made from, at every crook, Hand and Lip), its tremble against the same,
// its shade (covering times Shadow) against the sound, the drawing against
// that arithmetic, and the timed draw: quick notes and a quick tremble, in
// which nothing drawn may turn back more than six times in a second.

import { describe, expect, it } from 'vitest'

import { HAND_HORN_PARAMS } from '../../dsp/devices/hand-horn.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { INK, PLAIN_COLOURS } from '../components/display-kit'
import {
  HAND_HORN_CROOKS,
  HAND_HORN_FACES,
  HAND_HORN_FROM,
  HAND_HORN_LIT_SEC,
  HAND_HORN_TO,
  handHornAsk,
  handHornBase,
  handHornLayout,
  handHornRung,
  handHornShade,
  handHornSounds,
  handHornTrembles,
  handHornWords,
  handHornX,
  handHornY,
} from '../components/displays/hand-horn'
import { type DisplayNote } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  testLevel,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const C1 = 32.703196
const display = HAND_HORN_FACES['hand-horn'].display
const size = displaySize(display)
const lay = handHornLayout(size)
const { plot } = lay
const floor = plot.y + plot.h
const { ink, accent, plate } = PLAIN_COLOURS

type Name = keyof typeof HAND_HORN_PARAMS
type Values = Partial<Record<Name, number>>

const hzOfKey = (key: number): number => 440 * Math.pow(2, (key - 69) / 12)
/** A piano key in cents over a crook's fundamental: C1 is key 24. */
const upOf = (key: number, crook: number): number => (key - 24) * 100 - handHornBase(crook)
const valueOf = (values: Values, name: Name): number =>
  values[name] ?? HAND_HORN_PARAMS[name].default

async function horn(values: Values): Promise<WasmDeviceHarness> {
  const loaded = await loadWasmDevice('hand-horn', RATE)
  const all: Values = { attack: 0.005, release: 0.03, distance: 0, breath: 0, ...values }
  for (const [name, value] of Object.entries(all)) loaded.set(HAND_HORN_PARAMS[name as Name], value)
  return loaded
}

function meters(loaded: WasmDeviceHarness): { covering: number; partial: number; cents: number } {
  const meter = loaded.device.device_meter
  if (!meter) throw new Error('the device has no readings')
  return { covering: meter(0), partial: meter(1), cents: 1200 * Math.log2(meter(2)) }
}

/** The left channel of one key held for `seconds`, and the readings at the end. */
function held(loaded: WasmDeviceHarness, hz: number, seconds: number) {
  const { device } = loaded
  if (!device.device_note_on || !device.device_note_off) throw new Error('takes no notes')
  device.device_note_on(1, hz, 0.8)
  const blocks = Math.round((seconds * RATE) / 128)
  const left = new Float32Array(blocks * 128)
  for (let b = 0; b < blocks; b++) {
    device.device_process(128)
    left.set(loaded.view(device.device_out_left(), 128), b * 128)
  }
  const read = meters(loaded)
  device.device_note_off(1)
  for (let b = 0; b < 40; b++) device.device_process(128)
  return { left, ...read }
}

describe('the ladder of the Hand Horn', () => {
  it('is the header’s: the crooks, the open keys and the stopped ones', () => {
    expect(HAND_HORN_CROOKS).toHaveLength(HAND_HORN_PARAMS.crook.choices.length)
    expect(handHornBase(1)).toBe(0)
    expect(handHornBase(0)).toBe(-200)
    expect(handHornBase(10)).toBe(1200)
    // On the C crook: C4 D4 E4 G4 open on 8, 9, 10 and 12, at the default lips.
    for (const [key, partial] of [
      [60, 8],
      [62, 9],
      [64, 10],
      [67, 12],
    ])
      expect(handHornAsk(upOf(key, 1), 35)).toEqual({
        nearest: partial,
        from: partial,
        open: true,
        covering: 0,
      })
    // F4 from the 11th down 51, A4 from the 14th down 69, F sharp 4 from the 12th down 102.
    for (const [key, from, cents] of [
      [65, 11, 51.318],
      [69, 14, 68.826],
      [66, 12, 101.955],
    ]) {
      const asked = handHornAsk(upOf(key, 1), 35)
      expect(asked.open).toBe(false)
      expect(asked.from).toBe(from)
      expect(asked.covering).toBeCloseTo(cents / 120, 4)
    }
    // B4 lipped 12 up on the 15th; in the low register the gap is wider than the hand closes.
    expect(handHornAsk(upOf(71, 1), 35)).toMatchObject({ from: 15, open: true })
    expect(handHornAsk(upOf(40, 1), 35)).toMatchObject({ from: 3, open: false, covering: 1 })
    // Hand at 0: the nearest partial at its own pitch, open; half way, half of both.
    const none = handHornSounds(upOf(65, 1), 35, 0)
    expect(none.partial).toBe(11)
    expect(none.place).toBeCloseTo(handHornRung(11), 9)
    expect(none.covering).toBe(0)
    const half = handHornSounds(upOf(65, 1), 35, 0.5)
    expect(half.place).toBeCloseTo(0.5 * (handHornRung(11) + 4100), 9)
    expect(half.covering).toBeCloseTo(51.318 / 240, 4)
  })

  it('reads as the compiled device does, at every crook, Hand and Lip', async () => {
    let stopped = 0
    let open = 0
    for (let crook = 0; crook < HAND_HORN_CROOKS.length; crook++)
      for (const [hand, lip] of [
        [1, 35],
        [0, 35],
        [0.4, 20],
        [0.7, 57],
        [1, 5.5],
      ]) {
        const loaded = await horn({ crook, hand, lip, play: 1 })
        for (let key = 31 + (crook % 3); key <= 88; key += 3) {
          const read = held(loaded, hzOfKey(key), 0.22)
          const want = handHornSounds(upOf(key, crook), lip, hand)
          const what = `crook ${crook} hand ${hand} lip ${lip} key ${key}`
          // The device drifts by half a cent and settles 14 into a note.
          expect(Math.abs(read.cents - want.place), what).toBeLessThan(1.2)
          expect(Math.abs(read.covering - want.covering), what).toBeLessThan(1e-3)
          expect(read.partial, what).toBe(want.partial)
          if (want.open) open += 1
          else stopped += 1
        }
      }
    expect(open).toBeGreaterThan(200)
    expect(stopped).toBeGreaterThan(200)
  }, 60000)

  it('is what sounds: F4 at half a Hand is between the 11th partial and itself', async () => {
    const loaded = await horn({ hand: 0.5, spread: 0 })
    const { left } = held(loaded, hzOfKey(65), 1.2)
    const strength = (hz: number): number => {
      let re = 0
      let im = 0
      for (let i = 12000; i < 57000; i++) {
        const shade = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i - 12000)) / 45000)
        re += shade * left[i] * Math.cos((2 * Math.PI * hz * i) / RATE)
        im += shade * left[i] * Math.sin((2 * Math.PI * hz * i) / RATE)
      }
      return Math.hypot(re, im)
    }
    const hz = C1 * Math.pow(2, handHornSounds(4100, 35, 0.5).place / 1200)
    expect(strength(hz)).toBeGreaterThan(20 * strength(hzOfKey(65)))
    expect(strength(hz)).toBeGreaterThan(20 * strength(11 * C1))
  }, 60000)

  it('trembles along the straight line the display draws', async () => {
    for (const [key, tremble] of [
      [60, 1],
      [65, 1],
      [66, 0.5],
    ]) {
      const loaded = await horn({ tremble, trembleRate: 1.5, crook: 1 })
      const { device } = loaded
      device.device_note_on?.(1, hzOfKey(key), 0.8)
      const note = handHornSounds(upOf(key, 1), 35, 1)
      const closed = handHornTrembles(note, tremble, 1)
      const opened = handHornTrembles(note, tremble, -1)
      let least = Infinity
      let most = -Infinity
      for (let b = 0; b < 900; b++) {
        device.device_process(128)
        // The tremble eases in over half a second.
        if (b < 240) continue
        const read = meters(loaded)
        const wave = (note.place - read.cents) / (28 * tremble)
        expect(Math.abs(wave)).toBeLessThan(1.08)
        const want = handHornTrembles(note, tremble, wave)
        expect(Math.abs(read.covering - want.covering)).toBeLessThan(0.03)
        least = Math.min(least, read.covering)
        most = Math.max(most, read.covering)
      }
      expect(least).toBeCloseTo(opened.covering, 2)
      expect(most).toBeCloseTo(closed.covering, 2)
    }
  }, 60000)

  it('is heard as covering times Shadow: two crooks with the same product are the same sound', async () => {
    const sounds = async (crook: number, shadow: number) => {
      const { left } = held(await horn({ crook, shadow, spread: 0 }), hzOfKey(65), 0.8)
      let square = 0
      let slope = 0
      for (let i = 14000; i < left.length; i++) {
        square += left[i] * left[i]
        slope += (left[i] - left[i - 1]) ** 2
      }
      // The level, and the middle of the spectrum as the size of its slope against it.
      return { level: 10 * Math.log10(square), bright: Math.sqrt(slope / square) }
    }
    // F4 on the C crook is stopped by 51 cents; on another by more.
    const here = handHornAsk(upOf(65, 1), 35).covering
    const other = HAND_HORN_CROOKS.findIndex(
      (_, crook) => handHornAsk(upOf(65, crook), 35).covering > here + 0.2,
    )
    expect(other).toBeGreaterThanOrEqual(0)
    const there = handHornAsk(upOf(65, other), 35).covering
    const light = await sounds(1, 0.9)
    const same = await sounds(other, (0.9 * here) / there)
    expect(Math.abs(light.level - same.level)).toBeLessThan(0.1)
    expect(Math.abs(light.bright / same.bright - 1)).toBeLessThan(0.01)
    // And with Shadow the same, the one further in is darker and smaller.
    const dark = await sounds(other, 0.9)
    expect(dark.level).toBeLessThan(light.level - 1)
    expect(dark.bright).toBeLessThan(light.bright)
  }, 60000)
})

// --- The drawing ------------------------------------------------------------

const draw = (values: Values = {}, options: FrameOptions = {}): RecordingContext =>
  drawDisplay(display, HAND_HORN_PARAMS, { values, ...options })

const key = (note: number, age = 0.5, released: number | null = null, id = note): DisplayNote => ({
  id,
  frequency: hzOfKey(note),
  gain: 0.8,
  age,
  released,
})

/** The device's readings for a key by the rule. */
const read = (note: number, values: Values = {}, level = 0.8): Record<string, number> => {
  const sounds = handHornSounds(
    upOf(note, valueOf(values, 'crook')),
    valueOf(values, 'lip'),
    valueOf(values, 'hand'),
  )
  return {
    covering: sounds.covering,
    partial: sounds.partial,
    place: Math.pow(2, sounds.place / 1200),
    level,
  }
}

interface Dot {
  x: number
  y: number
  r: number
  colour: string
}
function dots(drawn: RecordingContext): Dot[] {
  const out: Dot[] = []
  let colour = ''
  let open: Omit<Dot, 'colour'>[] = []
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'beginPath') open = []
    else if (call.name === 'arc') {
      const [x, y, r] = call.args as number[]
      open.push({ x, y, r })
    } else if (call.name === 'fill') out.push(...open.map((one) => ({ ...one, colour })))
  }
  return out
}
/** The big dot: the newest note as the device says it is. */
const mark = (drawn: RecordingContext): Dot | undefined =>
  dots(drawn).find((one) => one.r > 1.9 && one.r < 3.5 + 1e-9 && one.colour === accent)
/** The small accent dots: what is held, by the rule. */
const lit = (drawn: RecordingContext): Dot[] => dots(drawn).filter((one) => one.r === 1.8)
const footWide = (drawn: RecordingContext): number => {
  let colour = ''
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    if (call.name !== 'fillRect' || colour !== accent) continue
    const [, y, w] = call.args as number[]
    if (y === lay.foot.y) return w
  }
  return 0
}
const x = (cents: number): number => handHornX(cents, plot)
const y = (covering: number): number => handHornY(covering, plot)

/** The display run as the plate runs it: every frame's drawing. */
function run(
  values: Values,
  seconds: number,
  each: (time: number) => Partial<FrameOptions>,
): RecordingContext[] {
  const state: unknown = display.init?.()
  const frames: RecordingContext[] = []
  for (let n = 0; n < Math.round(seconds * 30); n++)
    frames.push(
      draw(values, { ...each(n / 30), state, now: 10 + n / 30, dt: n === 0 ? 0 : 1 / 30 }),
    )
  return frames
}

/** How often a series of numbers turns back, by more than a tenth of a pixel. */
function turns(series: readonly number[]): number {
  let count = 0
  let way = 0
  let last = series[0]
  for (const value of series) {
    if (Math.abs(value - last) < 0.1) continue
    const now = Math.sign(value - last)
    if (way !== 0 && now !== way) count += 1
    way = now
    last = value
  }
  return count
}

describe('the drawing of the Hand Horn', () => {
  it('stands a post on every partial and the keys between where they sound, as covered as they are', () => {
    for (const values of [
      {},
      { hand: 0.5, shadow: 0.3 },
      { hand: 0 },
      { lip: 60, crook: 5 },
      { lip: 5, hand: 0.9, crook: 0, shadow: 1 },
    ] as Values[]) {
      const [hand, lip, shadow] = (['hand', 'lip', 'shadow'] as const).map((name) =>
        valueOf(values, name),
      )
      const crook = valueOf(values, 'crook')
      const drawn = draw(values)
      const posts = drawnPaths(drawn).filter(
        (path) => path.kind === 'stroke' && path.alpha === INK.grid,
      )
      expect(posts).toHaveLength(15)
      posts.forEach((post, i) =>
        expect(Math.abs(post.points[0][0] - x(handHornRung(2 + i)))).toBeLessThanOrEqual(0.5),
      )
      // Every piano key on the ladder is a dot by the rule, the white ones the larger.
      const keys = dots(drawn).filter((one) => one.colour === ink && one.r <= 1.4)
      const at = [...Array(128).keys()].filter((note) => {
        const up = upOf(note, crook)
        return up >= HAND_HORN_FROM && up <= HAND_HORN_TO
      })
      expect(keys).toHaveLength(at.length)
      at.forEach((note, i) => {
        const sounds = handHornSounds(upOf(note, crook), lip, hand)
        expect(keys[i].x).toBeCloseTo(x(sounds.place), 6)
        expect(keys[i].y).toBeCloseTo(y(sounds.covering), 6)
        expect(keys[i].r).toBe([0, 2, 4, 5, 7, 9, 11].includes(note % 12) ? 1.4 : 0.8)
      })
      // The line: at every point of it a key sounds there, and the shade under it is covering times Shadow.
      const lines = drawnPaths(drawn).filter(
        (path) => path.kind === 'stroke' && path.alpha === INK.text && path.width === 1,
      )
      const shades = drawnPaths(drawn).filter(
        (path) => path.kind === 'fill' && path.alpha === INK.back,
      )
      const runs = [...Array(16).keys()].flatMap((n) => handHornShade(n + 1, lip, hand))
      expect(runs.length).toBeGreaterThan(5)
      expect(lines.length).toBeGreaterThan(5)
      expect(shades).toHaveLength(lines.length)
      lines.forEach((line, i) =>
        line.points.forEach(([px, py], j) => {
          expect(shades[i].points[j][0]).toBeCloseTo(px, 6)
          expect(shades[i].points[j][1]).toBeCloseTo(floor - shadow * (floor - py), 6)
        }),
      )
    }
  })

  it('has the rule itself for its line: every key of a run is on it, and no key between is missed', () => {
    for (const [lip, hand] of [
      [35, 1],
      [20, 0.5],
      [8, 0.8],
    ])
      for (let n = 1; n <= 16; n++) {
        const runs = handHornShade(n, lip, hand)
        for (let up = handHornRung(n) + lip + 0.5; up < handHornRung(n + 1) - lip; up += 3) {
          const sounds = handHornSounds(up, lip, hand)
          expect(sounds.open).toBe(false)
          const on = runs.some((points) =>
            points.slice(1).some(([px, py], i) => {
              const [qx, qy] = points[i]
              if (sounds.place < qx - 1e-6 || sounds.place > px + 1e-6) return false
              const t = px > qx ? (sounds.place - qx) / (px - qx) : 0
              return Math.abs(qy + t * (py - qy) - sounds.covering) < 1e-6
            }),
          )
          expect(on, `n ${n} lip ${lip} hand ${hand} key ${up.toFixed(1)}`).toBe(true)
        }
      }
    // Lips that reach every key of a gap leave nothing for the hand.
    expect(handHornShade(15, 60, 1)).toEqual([])
    // With Hand at full a gap is one run, under it two that part.
    expect(handHornShade(4, 35, 1)).toHaveLength(1)
    expect(handHornShade(4, 35, 0.5)).toHaveLength(2)
  })

  it('marks the newest note where the device says, with a line from the partial it is made from', () => {
    for (const note of [60, 65, 66, 69, 71]) {
      const drawn = draw({}, { meters: read(note), notes: [key(note)] })
      const sounds = handHornSounds(upOf(note, 1), 35, 1)
      const at = mark(drawn)
      expect(at?.x).toBeCloseTo(x(sounds.place), 6)
      expect(at?.y).toBeCloseTo(y(sounds.covering), 6)
      expect(at?.r).toBeCloseTo(2 + 1.5 * 0.8, 6)
      const line = drawnPaths(drawn).find(
        (path) => path.kind === 'stroke' && path.colour === accent && path.width === 1.5,
      )
      expect(line?.points[0][0]).toBeCloseTo(x(handHornRung(sounds.partial)), 6)
      expect(line?.points[0][1]).toBeCloseTo(floor, 6)
      expect(line?.points[1][0]).toBeCloseTo(x(sounds.place), 6)
      // The hand in the bell: cut at the height it covers, and no hand in an open one.
      const cut = drawn.calls.find(
        (call) => call.name === 'rect' && (call.args as number[])[0] === lay.bell.x - lay.bell.r,
      )
      if (sounds.covering === 0) expect(cut).toBeUndefined()
      else expect((cut?.args as number[])[3]).toBeCloseTo(2 * lay.bell.r * sounds.covering, 6)
    }
    // Its size is its level, and with nothing sounding there is no mark.
    expect(mark(draw({}, { meters: read(60, {}, 0.2), notes: [key(60)] }))?.r).toBeCloseTo(2.3, 6)
    const none = { covering: 0, partial: 0, place: 0, level: 0 }
    expect(mark(draw({}, { meters: none, notes: [key(60, 9, 8)] }))).toBeUndefined()
    expect(mark(draw({}, { meters: read(60), notes: [key(60)], powered: false }))).toBeUndefined()
    // Past the end of the ladder it waits at the edge, hollow.
    const past = dots(draw({}, { meters: read(88), notes: [key(88)] })).find(
      (one) => one.r > 2.5 && one.r < 3.45 && one.colour === plate,
    )
    expect(past?.x).toBeCloseTo(plot.x + plot.w, 6)
  })

  it('says the crook and what the horn does for the note', () => {
    expect(handHornWords(hzOfKey(65), 0, 35, 1)).toEqual(['F4: 11, hand −51', 'F4 11 −51'])
    expect(handHornWords(hzOfKey(69), 0, 35, 1)[0]).toBe('A4: 14, hand −69')
    expect(handHornWords(hzOfKey(71), 0, 35, 1)[0]).toBe('B4: 15, lips +12')
    expect(handHornWords(hzOfKey(72), 0, 35, 1)[0]).toBe('C5: 16 open')
    expect(handHornWords(hzOfKey(65), 0, 35, 0)[0]).toBe('F4: 11 open')
    const drawn = draw({}, { meters: read(65), notes: [key(65)] })
    expect(drawn.words()).toContain('C')
    expect(drawn.words()).toContain('F4: 11, hand −51')
    // No room beside a long crook's name: the short of it.
    const basso = { crook: 0 }
    expect(draw(basso, { meters: read(66, basso), notes: [key(66)] }).words()).toContain(
      handHornWords(hzOfKey(66), -200, 35, 1)[1],
    )
  })

  it('lights what is held by the rule: six keys in Chords, the newest alone in Solo', () => {
    const chord = [48, 52, 55, 60, 64, 67, 70].map((note, i) => key(note, 2 - 0.1 * i))
    const drawn = draw({ play: 1 }, { meters: read(70), notes: chord })
    expect(lit(drawn)).toHaveLength(6)
    for (const one of lit(drawn)) expect(one.colour).toBe(accent)
    const solo = lit(draw({ play: 0 }, { meters: read(70), notes: chord }))
    expect(solo).toHaveLength(1)
    const sounds = handHornSounds(upOf(70, 1), 35, 1)
    expect(solo[0].x).toBeCloseTo(x(sounds.place), 2)
    expect(solo[0].y).toBeCloseTo(y(sounds.covering), 2)
    // A key let go stays lit half a second.
    const frames = run({}, 2, (time) => ({
      meters: read(60),
      notes: [key(60, time + 0.01, time >= 1 ? time - 1 : null)],
    }))
    const lights = frames.filter((each) => lit(each).length === 1).length / 30
    expect(lights).toBeGreaterThan(0.9 + HAND_HORN_LIT_SEC)
    expect(lights).toBeLessThan(1.1 + HAND_HORN_LIT_SEC)
  })

  it('draws how far a tremble takes a note, dashed where it is too quick to follow', () => {
    for (const [rate, dashed] of [
      [1, false],
      [3, false],
      [6, true],
    ] as const) {
      const values = { tremble: 0.7, trembleRate: rate }
      const drawn = draw(values, { meters: read(65), notes: [key(65)] })
      const note = handHornSounds(upOf(65, 1), 35, 1)
      const line = drawnPaths(drawn).find(
        (path) => path.kind === 'stroke' && path.colour === accent && path.width === 1.2,
      )
      ;[-1, 1].forEach((wave, i) => {
        const end = handHornTrembles(note, 0.7, wave)
        expect(line?.points[i][0]).toBeCloseTo(x(end.place), 2)
        expect(line?.points[i][1]).toBeCloseTo(y(end.covering), 2)
      })
      const dash = drawn.calls.some(
        (call) => call.name === 'setLineDash' && String(call.args[0]) === '2,2',
      )
      expect(dash).toBe(dashed)
    }
  })

  it('sets Hand at the right and Shadow at the left by height', () => {
    const at = viewOf(display, HAND_HORN_PARAMS, { values: { hand: 0.6, shadow: 0.25 } })
    const [shadow, hand] = display.handles?.(at) ?? []
    expect(hand.x).toBe(lay.handX)
    expect(hand.y).toBeCloseTo(y(0.6), 6)
    expect(shadow.x).toBe(lay.shadowX)
    expect(shadow.y).toBeCloseTo(y(0.25), 6)
    expect(hand.drag(0, y(0.3)).hand).toBeCloseTo(0.3, 6)
    expect(shadow.drag(0, plot.y - 30)).toEqual({ shadow: 1 })
    expect(hand.drag(0, floor + 30)).toEqual({ hand: 0 })
    expect(hand.wheel?.(-1)).toEqual({ hand: 0.58 })
    expect(shadow.reset?.()).toEqual({ shadow: 0.8 })
    expect(draw({ hand: 0.6 }, { hot: 'hand' }).words()).toContain('Hand 0.60')
  })

  it('reads the level in the foot as the mean over a second', () => {
    const level = testLevel(0.1 * Math.SQRT2)
    const signal = { input: null, output: level, spectrum: null, binHz: 0, left: null, right: null }
    const frames = run({}, 1.5, () => ({ signal }))
    expect(Math.abs(footWide(frames[44]) - (2 / 3) * lay.foot.w)).toBeLessThan(0.025 * lay.foot.w)
    expect(footWide(draw())).toBe(0)
  })
})

describe('the Hand Horn display in time', () => {
  it('takes up quick notes three times a second at the most', () => {
    for (const perSecond of [4, 10, 15]) {
      const keys = [60, 69, 62, 66]
      const frames = run({ play: 0 }, 4, (time) => {
        const n = Math.floor(time * perSecond + 1e-6)
        const note = keys[n % keys.length]
        return { meters: read(note), notes: [key(note, time - n / perSecond, null, n)] }
      })
      const marks = frames.map(mark)
      expect(marks.every((one) => one !== undefined)).toBe(true)
      let moves = 0
      for (let i = 1; i < marks.length; i++)
        if (Math.abs((marks[i]?.x ?? 0) - (marks[i - 1]?.x ?? 0)) > 0.1) moves += 1
      expect(moves, `${perSecond} a second`).toBeLessThanOrEqual(12)
      expect(moves, `${perSecond} a second`).toBeGreaterThan(5)
    }
  })

  it('follows a slow tremble and stands in the middle of a quick one', () => {
    const series = (rate: number): Dot[] => {
      const values = { tremble: 1, trembleRate: rate }
      const note = handHornSounds(upOf(65, 1), 35, 1)
      return run(values, 4, (time) => {
        const wave = Math.sin(2 * Math.PI * rate * time)
        const now = handHornTrembles(note, 1, wave)
        return {
          meters: {
            covering: now.covering,
            partial: 11,
            place: Math.pow(2, now.place / 1200),
            level: 0.8,
          },
          notes: [key(65, time + 0.01)],
        }
      }).map((each) => mark(each) ?? { x: NaN, y: NaN, r: 0, colour: '' })
    }
    const slow = series(1).map((one) => one.y)
    expect(Math.max(...slow) - Math.min(...slow)).toBeGreaterThan(0.4 * plot.h)
    for (const rate of [0.45, 1, 3])
      expect(turns(series(rate).map((one) => one.y))).toBeLessThanOrEqual(24)
    const note = handHornSounds(upOf(65, 1), 35, 1)
    const middle = y(handHornTrembles(note, 1, 0).covering)
    for (const rate of [3.4, 4.2, 5.3, 8]) {
      const late = series(rate)
        .slice(30)
        .map((one) => one.y)
      for (const value of late) expect(Math.abs(value - middle), `at ${rate}`).toBeLessThan(2)
      // And while it settles there, no more turns in a second than three a second make.
      const all = late.length === 90 ? series(rate).map((one) => one.y) : []
      for (let from = 0; from + 30 <= all.length; from += 5)
        expect(turns(all.slice(from, from + 30)), `at ${rate} from ${from}`).toBeLessThanOrEqual(6)
    }
  })

  it('walks a slide rung by rung, and forgets a note that has died', () => {
    const from = handHornRung(8)
    const frames = run({ play: 0, slide: 2 }, 3, (time) => {
      const rung = Math.min(16, 8 + Math.floor(time * 4))
      return {
        meters: {
          covering: 0,
          partial: time < 2.5 ? rung : 0,
          place: time < 2.5 ? Math.pow(2, handHornRung(rung) / 1200) : 0,
          level: 0.8,
        },
        notes: [key(72, time + 0.01, time > 2.2 ? time - 2.2 : null)],
      }
    })
    const seen = new Set(
      frames.map(mark).flatMap((one) => (one ? [Math.round(one.x * 10) / 10] : [])),
    )
    for (let n = 8; n <= 16; n++)
      expect([...seen].some((value) => Math.abs(value - x(handHornRung(n))) < 0.1)).toBe(true)
    expect(mark(frames[0])?.x).toBeCloseTo(x(from), 6)
    expect(mark(frames[frames.length - 1])).toBeUndefined()
  })
})
