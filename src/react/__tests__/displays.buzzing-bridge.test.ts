// The truth of the Buzzing Bridge display: where it says the buzz sits against
// the place the compiled device reads out, how far the touch closes against
// the device's touch, the bounces against the touch read a sample at a time,
// the filters it draws against the buzz that comes out, the climb, the points
// that are dragged, and the timed draw: nothing on it turns back more than six
// times in any second, however fast the notes come.

import { describe, expect, it } from 'vitest'

import { BUZZING_BRIDGE_METERS, BUZZING_BRIDGE_PARAMS } from '../../dsp/devices/buzzing-bridge.gen'
import { fft } from '../../dsp/__tests__/render-support'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, hzText } from '../components/display-kit'
import {
  BUZZING_BRIDGE_FACES,
  BUZZ_FIRST_PARTIAL,
  BUZZ_FOOT_DB,
  BUZZ_GRAZING,
  BUZZ_LEATHER,
  BUZZ_LINES_PX,
  BUZZ_MAX_HZ,
  BUZZ_MEMBRANE,
  BUZZ_MIN_HZ,
  BUZZ_NOTE_HZ,
  BUZZ_PAPER,
  BUZZ_RANGE_DB,
  BUZZ_SHELL,
  BUZZ_TOP_DB,
  buzzFilter,
  buzzIsNoise,
  buzzKnocks,
  buzzLastPartial,
  buzzLayout,
  buzzOpen,
  buzzPlace,
  buzzSettings,
  buzzShape,
  buzzSpan,
  buzzTone,
  buzzTouch,
  buzzXOfDb,
  buzzXOfHz,
  type BuzzSettings,
} from '../components/displays/buzzing-bridge'
import { type DisplayHandle } from '../components/plate-display'
import { drawDisplay, drawnPaths, viewOf, type RecordingContext } from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const face = BUZZING_BRIDGE_FACES['buzzing-bridge']
const { display } = face
const SIZE = { width: 128, height: 100 }
const UPRIGHT = { width: 204, height: 100 }

type Values = Readonly<Record<string, number>>
type Name = keyof typeof BUZZING_BRIDGE_PARAMS
const METERS = Object.keys(BUZZING_BRIDGE_METERS)

const settingsOf = (values: Values = {}): BuzzSettings =>
  buzzSettings((name) => values[name] ?? BUZZING_BRIDGE_PARAMS[name as Name].default)

async function deviceAt(values: Values = {}): Promise<WasmDeviceHarness> {
  const device = await loadWasmDevice('buzzing-bridge', RATE)
  for (const [name, value] of Object.entries(values))
    device.set(BUZZING_BRIDGE_PARAMS[name as Name], value)
  return device
}

const meter = (device: WasmDeviceHarness, name: string): number => {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(METERS.indexOf(name))
}
const readings = (device: WasmDeviceHarness): Record<string, number> =>
  Object.fromEntries(METERS.map((name) => [name, meter(device, name)]))

/** Run so long with a sound made from the sample count; the buzz on the left: what came out less what went in. */
function run(
  device: WasmDeviceHarness,
  seconds: number,
  input: (n: number) => number = () => 0,
  from = 0,
): Float64Array {
  const blocks = Math.round((seconds * RATE) / 128)
  const buzz = new Float64Array(blocks * 128)
  const block = new Float32Array(128)
  for (let b = 0; b < blocks; b++) {
    for (let i = 0; i < 128; i++) block[i] = input(from + b * 128 + i)
    device.processBlock(block)
    const out = device.view(device.device.device_out_left(), 128)
    for (let i = 0; i < 128; i++) buzz[b * 128 + i] = out[i] - block[i]
  }
  return buzz
}

const sine =
  (hz: number, level: number) =>
  (n: number): number =>
    level * Math.sin((TWO_PI * hz * n) / RATE)
/** A note with partials, like a bowed string. */
const bright =
  (hz: number, level: number) =>
  (n: number): number => {
    let out = 0
    for (let k = 1; k <= 6; k++) out += Math.sin((TWO_PI * hz * k * n) / RATE) / k
    return level * out
  }
/** Noise that is the same every time. */
function noise(level: number): (n: number) => number {
  let seed = 1
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return level * (seed / 2147483648 - 1)
  }
}

const db = (gain: number): number => 20 * Math.log10(Math.max(gain, 1e-12))

describe('where the buzz sits, against the device at 48 kHz', () => {
  it('is the place the device reads out, for every model, note, Tracking and Resonance', async () => {
    let checked = 0
    for (let model = BUZZ_GRAZING; model <= BUZZ_PAPER; model++) {
      for (const hz of [98, 220, 587]) {
        for (const [tracking, resonance] of [
          [1, 2400],
          [0, 2400],
          [0.5, 900],
          [1, 5200],
        ]) {
          const values = { model, tracking, resonance, threshold: -50, curve: 0.6 }
          const device = await deviceAt(values)
          run(device, 1.2, bright(hz, 0.2))
          const pitch = meter(device, 'pitch')
          expect(Math.abs(pitch / hz - 1)).toBeLessThan(0.01)
          const said = buzzPlace(settingsOf(values), meter(device, 'partial'), pitch, RATE)
          const where = `${model} ${hz} ${tracking} ${resonance}`
          expect(Math.abs(Math.log2(said / meter(device, 'place'))), where).toBeLessThan(0.02)
          checked++
        }
      }
    }
    expect(checked).toBe(60)
  }, 60_000)

  it('is the place of no note while none is found', async () => {
    for (let model = BUZZ_GRAZING; model <= BUZZ_PAPER; model++) {
      const values = { model, threshold: -50 }
      const device = await deviceAt(values)
      run(device, 1, noise(0.2))
      expect(meter(device, 'pitch')).toBe(0)
      const said = buzzPlace(settingsOf(values), meter(device, 'partial'), 0, RATE)
      expect(Math.abs(Math.log2(said / meter(device, 'place'))), String(model)).toBeLessThan(0.02)
    }
  })

  it('climbs from the third partial to the one it names as a note dies, and half of the octaves by itself', async () => {
    for (const curve of [0, 0.3, 0.6, 1]) {
      const set = settingsOf({ curve })
      const device = await deviceAt({ curve, threshold: -60 })
      const climb: number[] = []
      for (let k = 0; k < 40; k++) {
        // Thirty-eight blocks at a time, about a tenth of a second.
        const from = k * 38 * 128
        run(
          device,
          (38 * 128) / RATE,
          (n) => bright(196, 0.3)(n) * Math.exp(-n / (0.9 * RATE)),
          from,
        )
        climb.push(meter(device, 'partial'))
      }
      expect(Math.abs(Math.log2(climb[0] / BUZZ_FIRST_PARTIAL))).toBeLessThan(0.45)
      expect(Math.abs(Math.log2(climb[39] / buzzLastPartial(set)))).toBeLessThan(0.02)
      for (let k = 1; k < 40; k++) expect(climb[k]).toBeGreaterThanOrEqual(climb[k - 1] * 0.995)
      // A note that is held.
      const held = await deviceAt({ curve, threshold: -60 })
      run(held, 8, bright(196, 0.2))
      const half = BUZZ_FIRST_PARTIAL * Math.sqrt(buzzLastPartial(set) / BUZZ_FIRST_PARTIAL)
      expect(Math.abs(Math.log2(meter(held, 'partial') / half))).toBeLessThan(0.03)
    }
    expect(buzzLastPartial(settingsOf({ curve: 0.6 }))).toBeCloseTo(12, 2)
    expect(buzzLastPartial(settingsOf({ curve: 0 }))).toBe(3)
  }, 60_000)
})

describe('how far the touch closes, against the device', () => {
  it('is what the device reads out, for a note of any level at any Threshold', async () => {
    for (const model of [BUZZ_GRAZING, BUZZ_MEMBRANE, BUZZ_LEATHER, BUZZ_PAPER]) {
      for (const [threshold, curve] of [
        [-36, 0.5],
        [-26, 0],
        [-50, 1],
      ]) {
        for (const level of [-60, -51, -40, -35, -34, -25, -24, -12, -3]) {
          const values = { model, threshold, curve, bounces: 1, fall: 1000 }
          const device = await deviceAt(values)
          run(device, 0.6, sine(330, 10 ** (level / 20)))
          const read = Math.max(0, meter(device, 'touch'))
          // The level the device follows is the crest, a little under it at the most.
          const over = meter(device, 'over')
          expect(Math.abs(over - (level - threshold))).toBeLessThan(0.35)
          const said = buzzOpen(threshold + over, settingsOf(values))
          expect(Math.abs(said - read), `${model} ${threshold} ${level}`).toBeLessThan(0.03)
        }
      }
    }
  }, 60_000)

  it('knocks the shell over Threshold and not under it, by the attack alone', async () => {
    for (const [level, knocked] of [
      [-41, false],
      [-39, true],
      [-10, true],
    ] as const) {
      const values = { model: BUZZ_SHELL, threshold: -40, amount: 1 }
      const device = await deviceAt(values)
      const buzz = run(device, 0.5, sine(330, 10 ** (level / 20)))
      let most = 0
      for (const one of buzz) most = Math.max(most, Math.abs(one))
      expect(most > 0).toBe(knocked)
      expect(buzzOpen(level, settingsOf(values))).toBe(knocked ? 1 : 0)
    }
  })
})

describe('the bounces, against the touch the device reads out a sample at a time', () => {
  /** The touch, from the attack of a note out of silence on. */
  async function touchOf(values: Values, seconds: number): Promise<number[]> {
    const device = await deviceAt({ threshold: -60, ...values })
    const out: number[] = []
    const block = new Float32Array(1)
    for (let n = 0; n < seconds * RATE; n++) {
      // Full from its first sample on.
      block[0] = 0.4 * Math.cos((TWO_PI * 440 * n) / RATE)
      device.processBlock(block)
      out.push(meter(device, 'touch'))
    }
    return out
  }

  it('knocks the shell when and as hard as drawn, and then no more', async () => {
    for (const [rattle, bounces, curve, fall] of [
      [40, 3, 0.5, 1000],
      [200, 8, 0.2, 3000],
      [140, 6, 0.5, 60],
      [170, 1, 0.3, 1000],
      [60, 2, 1, 400],
    ]) {
      const values = { model: BUZZ_SHELL, rattle, bounces, curve, fall }
      const set = settingsOf(values)
      const seconds = 1.2 * buzzSpan(set)
      const read = await touchOf(values, seconds)
      const said = buzzTouch(set, seconds, read.length)
      const knocks = buzzKnocks(set)
      expect(knocks.length).toBe(bounces)
      // The attack is heard within one step of the device's own clock (32 samples) and the first knock counts from it.
      const first = (list: readonly number[]): number => list.findIndex((one) => one > 0.01)
      const late = first(read) - first(said)
      expect(Math.abs(late)).toBeLessThan(160)
      let worst = 0
      for (let n = Math.max(0, -late); n < read.length && n + late < read.length; n++)
        worst = Math.max(worst, Math.abs(read[n + late] - said[n]))
      expect(worst, `${rattle} ms of ${bounces}`).toBeLessThan(0.12)
      // Each as strong as it is said to be.
      for (const knock of knocks) {
        const from = Math.round(knock.at * RATE)
        const until = Math.round((knock.at + 0.002) * RATE)
        const strongest = (list: readonly number[], by: number): number =>
          Math.max(...list.slice(Math.max(0, from + by), until + by))
        // A knock that has died away to nothing has no strength to read.
        if (strongest(said, 0) < 0.01) continue
        expect(Math.abs(strongest(said, 0) / strongest(read, late) - 1)).toBeLessThan(0.02)
      }
      // From the first to the last is Rattle.
      if (bounces > 1) expect(knocks[bounces - 1].at - knocks[0].at).toBeCloseTo(0.001 * rattle, 9)
      for (let k = 2; k < bounces; k++)
        expect(knocks[k].at - knocks[k - 1].at).toBeLessThan(knocks[k - 1].at - knocks[k - 2].at)
    }
  }, 60_000)

  it('chatters the others as drawn, and leaves them closed from the last bounce on', async () => {
    for (const model of [BUZZ_GRAZING, BUZZ_LEATHER, BUZZ_PAPER]) {
      for (const bounces of [1, 3, 5]) {
        const values = { model, bounces, rattle: 80, curve: 0.4 }
        const set = settingsOf(values)
        const read = await touchOf(values, 0.14)
        const said = buzzTouch(set, 0.14, read.length)
        const knocks = buzzKnocks(set)
        // Past the first milliseconds, in which the device is still finding how sudden the attack was.
        const differs = read.filter(
          (one, n) =>
            n > 0.012 * RATE &&
            Math.min(...said.slice(Math.max(0, n - 170), n + 1).map((s) => Math.abs(s - one))) >
              0.06,
        )
        expect(differs.length, `${model} ${bounces}`).toBe(0)
        const settled = Math.round((knocks[knocks.length - 1].at + 0.012) * RATE)
        if (bounces > 1) {
          expect(read[settled]).toBeGreaterThan(0.95)
          expect(said[settled]).toBeGreaterThan(0.95)
        } else expect(Math.min(...said.slice(480))).toBeGreaterThan(0.99)
      }
    }
  }, 60_000)
})

describe('the filters the buzz is drawn through, against the buzz that comes out', () => {
  /** How loud each partial from `from` up to `to` is in a stretch, by a window that leaves the others out. */
  function partials(buzz: Float64Array, hz: number, from: number, to: number): number[] {
    const out: number[] = []
    for (let k = from; k <= to; k++) {
      let re = 0
      let im = 0
      for (let n = 0; n < buzz.length; n++) {
        const w = 0.5 - 0.5 * Math.cos((TWO_PI * n) / buzz.length)
        re += w * buzz[n] * Math.cos((TWO_PI * hz * k * n) / RATE)
        im += w * buzz[n] * Math.sin((TWO_PI * hz * k * n) / RATE)
      }
      out.push(Math.hypot(re, im))
    }
    return out
  }

  interface Heard {
    level: number[]
    between: number[]
    gain: number[]
  }
  /** Whether a partial of the contact is far under those beside it. */
  function hollow({ level, gain }: Heard, n: number): boolean {
    const contact = level.map((one, k) => db(one / gain[k]))
    const beside = contact.slice(Math.max(0, n - 2), n + 3).sort((x, y) => x - y)
    return contact[n] < beside[Math.floor(beside.length / 2)] - 5
  }

  // The contact is the same whatever the filters after it are tuned to, so the buzz of one tuning
  // over the buzz of another is the one's filters over the other's, up to one gain. The note has fallen by 6 dB and
  // Fall is short, so that the buzz stands well under what its peaks are held to.
  it.each([
    ['the bridge', { model: BUZZ_GRAZING, curve: 0 }, 1.5],
    ['the bridge with the end of its climb', { model: BUZZ_GRAZING, curve: 0.5 }, 0.8],
    ['the membrane', { model: BUZZ_MEMBRANE, curve: 0 }, 0.8],
    ['the leather', { model: BUZZ_LEATHER, curve: 0.5 }, 0.8],
  ])(
    'shapes the partials of %s as the device does',
    async (_name, base, most) => {
      const hz = 187.5
      const heard: Heard[] = []
      for (const [resonance, tone] of [
        [1200, 16000],
        [2600, 16000],
        [2600, 2500],
      ]) {
        const values = {
          ...base,
          resonance,
          tone,
          tracking: 0,
          bounces: 1,
          threshold: -60,
          amount: 0.4,
          fall: 30,
        }
        const set = settingsOf(values)
        const device = await deviceAt(values)
        run(device, 0.512, sine(hz, 0.3))
        run(device, 3.072, sine(hz, 0.15), 0.512 * RATE)
        const place = meter(device, 'place')
        const partial = meter(device, 'partial')
        const buzz = run(device, 0.512, sine(hz, 0.15), 3.584 * RATE)
        const gains: number[] = []
        for (let k = 2; k <= 24; k++)
          gains.push(
            buzzFilter(k * hz, set, place, partial, meter(device, 'pitch'), RATE) *
              buzzTone(k * hz, tone, RATE),
          )
        heard.push({
          level: partials(buzz, hz, 2, 24),
          between: partials(buzz, hz, 2.5, 24.5),
          gain: gains,
        })
      }
      for (const [a, b] of [
        [0, 1],
        [1, 2],
      ]) {
        const top = heard.map(({ gain }) => Math.max(...gain))
        const apart: number[] = []
        for (let n = 0; n < heard[a].gain.length; n++) {
          // A partial far down in either is under what the held-down peaks leave.
          if ([a, b].some((one) => db(heard[one].gain[n] / top[one]) < -24)) continue
          // The contact has partials that are hardly there, where nothing is to be read, and the
          // membrane's breath lies over the faintest.
          if ([a, b].some((one) => hollow(heard[one], n))) continue
          if (
            base.model === BUZZ_MEMBRANE &&
            [a, b].some((one) => db(heard[one].level[n] / heard[one].between[n]) < 18)
          )
            continue
          apart.push(
            db(heard[a].level[n] / heard[b].level[n]) - db(heard[a].gain[n] / heard[b].gain[n]),
          )
        }
        expect(apart.length).toBeGreaterThan(3)
        const mean = apart.reduce((sum, one) => sum + one, 0) / apart.length
        for (const one of apart) expect(Math.abs(one - mean)).toBeLessThan(most)
      }
    },
    60_000,
  )

  it.each([
    ['the shell', { model: BUZZ_SHELL, rattle: 60, bounces: 8 }, 900, 0.5],
    ['the shell, small', { model: BUZZ_SHELL, rattle: 60, bounces: 8 }, 3000, 0.5],
    ['the paper', { model: BUZZ_PAPER, bounces: 1, curve: 0.5 }, 1200, 0.6],
  ])(
    'colours the noise of %s as the device does',
    async (_name, base, resonance, from) => {
      const values = { ...base, resonance, tone: 6000, tracking: 0, threshold: -60, amount: 1 }
      const set = settingsOf(values)
      const device = await deviceAt(values)
      const shell = set.model === BUZZ_SHELL
      // The shell is struck three times a second and the paper is held.
      const struck = (n: number): number => {
        const at = n % 16000
        return 0.4 * Math.exp(-at / 2000) * Math.cos((TWO_PI * 440 * at) / RATE)
      }
      const sound = shell ? struck : sine(180, 0.2)
      run(device, 1, sound)
      const place = meter(device, 'place')
      const buzz = run(device, 30, sound, 375 * 128)
      const size = 2048
      const power = new Float64Array(size / 2)
      for (let at = 0; at + size <= buzz.length; at += size / 2) {
        const re = new Float64Array(size)
        const im = new Float64Array(size)
        for (let n = 0; n < size; n++)
          re[n] = buzz[at + n] * (0.5 - 0.5 * Math.cos((TWO_PI * n) / size))
        fft(re, im)
        for (let n = 0; n < size / 2; n++) power[n] += re[n] * re[n] + im[n] * im[n]
      }
      // Sixth octaves from under the place to three times as high.
      const apart: number[] = []
      for (let hz = from * place; hz < 3 * place && hz < 12000; hz *= Math.pow(2, 1 / 6)) {
        const first = Math.round((hz / Math.pow(2, 1 / 12) / RATE) * size)
        const last = Math.max(first + 1, Math.round(((hz * Math.pow(2, 1 / 12)) / RATE) * size))
        let heard = 0
        let said = 0
        for (let n = first; n < last; n++) {
          heard += power[n]
          const f = (n * RATE) / size
          said += (buzzFilter(f, set, place, 3, 0, RATE) * buzzTone(f, set.tone, RATE)) ** 2
        }
        apart.push(10 * Math.log10(heard / said))
      }
      const mean = apart.reduce((sum, one) => sum + one, 0) / apart.length
      for (const one of apart) expect(Math.abs(one - mean)).toBeLessThan(0.85)
    },
    60_000,
  )
})

interface Painted {
  colour: string
  alpha: number
  x: number
  y: number
  w: number
  h: number
}
/** Every rectangle that was filled, with what it was filled in. */
function rects(drawn: RecordingContext): Painted[] {
  let colour = ''
  let alpha = 1
  const out: Painted[] = []
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      out.push({ colour, alpha, x, y, w, h })
    }
  }
  return out
}
/** The bar of the level: three pixels high on the foot of the touch. */
function barOf(drawn: RecordingContext, size = SIZE): Painted | undefined {
  const { touch } = buzzLayout(size)
  return rects(drawn).find((one) => one.h === 3 && Math.abs(one.y - (touch.y + touch.h - 1)) < 1e-9)
}
/** The dots, which are rings of 2.25: the touch's, while there is one, and the sweep's. */
const dotsOf = (drawn: RecordingContext): [number, number][] =>
  drawn.calls
    .filter((call) => call.name === 'arc' && call.args[2] === 2.25)
    .map((call) => [Number(call.args[0]), Number(call.args[1])])
/** What is lit of the buzz: its lines, and what is filled, as points from the foot up. */
function litOf(drawn: RecordingContext, size = SIZE) {
  const { buzz } = buzzLayout(size)
  const floor = buzz.y + buzz.h
  const paths = drawnPaths(drawn).filter(
    (path) =>
      path.colour === PLAIN_COLOURS.accent &&
      path.points.length >= 2 &&
      path.points.every(([, y]) => y >= buzz.y - 1e-6 && y <= floor + 1e-6),
  )
  return {
    lines: paths
      .filter((path) => path.kind === 'stroke')
      .map((path) => ({ x: path.points[0][0], tall: floor - path.points[1][1] })),
    filled: paths.filter((path) => path.kind === 'fill').flatMap((path) => path.points),
    top: floor - Math.min(floor, ...paths.flatMap((path) => path.points.map(([, y]) => y))),
  }
}
const REST = { buzz: -90, partial: 0, place: 0, over: -60, touch: 0, pitch: 0 }
const PLAYED = { buzz: -24, partial: 5, place: 1100, over: 14, touch: 0.8, pitch: 220 }

describe('the Buzzing Bridge display', () => {
  it('is laid out from the size it is given, with nothing over the next thing', () => {
    for (const size of [SIZE, UPRIGHT, { width: 293, height: 100 }]) {
      const lay = buzzLayout(size)
      expect(lay.touch.y - 4.5).toBeGreaterThanOrEqual(1)
      // The ring at Amount 0 ends above the numbers, 6 px tall.
      expect(lay.touch.y + lay.touch.h + 4).toBeLessThanOrEqual(lay.scale - 6)
      expect(lay.scale).toBeLessThan(lay.knocks.y)
      expect(lay.knocks.y + lay.knocks.h).toBeLessThan(lay.sweep - 2.25)
      expect(lay.sweep + 2.25).toBeLessThanOrEqual(lay.buzz.y)
      expect(lay.buzz.y + lay.buzz.h).toBeLessThan(lay.base - 6)
      expect(lay.base).toBeLessThan(size.height)
    }
  })

  it('draws the law of the touch up from Threshold as high as Amount, for each model as it is', () => {
    const { touch } = buzzLayout(SIZE)
    for (let model = BUZZ_GRAZING; model <= BUZZ_PAPER; model++) {
      for (const [threshold, amount, curve] of [
        [-36, 0.55, 0.5],
        [-60, 1, 0],
        [-10, 0.3, 1],
        [0, 0.8, 0.5],
      ]) {
        const values = { model, threshold, amount, curve }
        const set = settingsOf(values)
        const law = drawnPaths(drawDisplay(display, BUZZING_BRIDGE_PARAMS, { values })).find(
          (path) => path.kind === 'stroke' && path.width === 1.25 && path.points.length === 4,
        )
        if (!law) throw new Error('no law')
        for (let level = BUZZ_FOOT_DB; level <= 0; level += 0.5) {
          const x = buzzXOfDb(level, touch)
          // The line through the points at this level; on the shell's step either end of it.
          const ys = law.points.slice(1).flatMap(([toX, toY], n) => {
            const [fromX, fromY] = law.points[n]
            if (x < fromX - 1e-9 || x > toX + 1e-9) return []
            return toX - fromX < 1e-9
              ? [fromY, toY]
              : [fromY + ((x - fromX) / (toX - fromX)) * (toY - fromY)]
          })
          const said = touch.y + touch.h - amount * buzzOpen(level, set) * touch.h
          expect(
            Math.min(...ys.map((y) => Math.abs(y - said))),
            `${model} ${threshold} ${level}`,
          ).toBeLessThan(1e-6)
        }
      }
    }
  })

  it('shows the level against the line, lit only over it, and the touch on it as the device reads it out', () => {
    for (const size of [SIZE, UPRIGHT]) {
      const { touch } = buzzLayout(size)
      for (const over of [-50, -8, -0.5, 0.5, 14, 36, 60]) {
        const values = { threshold: -36, amount: 0.6 }
        const drawn = drawDisplay(display, BUZZING_BRIDGE_PARAMS, {
          values,
          meters: { ...PLAYED, over, touch: 0.8 },
          ...size,
        })
        const bar = barOf(drawn, size)
        const x = buzzXOfDb(-36 + over, touch)
        if (x > touch.x) {
          expect(bar?.x).toBe(touch.x)
          expect((bar?.x ?? 0) + (bar?.w ?? 0)).toBeCloseTo(x, 9)
          expect(bar?.colour).toBe(over > 0 ? PLAIN_COLOURS.accent : PLAIN_COLOURS.ink)
        }
        // A note that touched goes on touching: the dot is as high as the reading, not as the law.
        const [at] = dotsOf(drawn)
        expect(at[0]).toBeCloseTo(x, 9)
        expect(at[1]).toBeCloseTo(touch.y + touch.h - 0.6 * 0.8 * touch.h, 9)
      }
    }
    // The shell's touch is over in milliseconds: its dot is whether an attack so loud would knock.
    const { touch } = buzzLayout(SIZE)
    for (const over of [-5, 5]) {
      const values = { model: BUZZ_SHELL, threshold: -36, amount: 0.6 }
      const drawn = drawDisplay(display, BUZZING_BRIDGE_PARAMS, {
        values,
        meters: { ...PLAYED, over, touch: 0.3 },
      })
      expect(dotsOf(drawn)[0][1]).toBeCloseTo(touch.y + touch.h - (over > 0 ? 0.6 : 0) * touch.h, 9)
    }
  })

  it('draws the bounces it works out, as tall as they are', () => {
    const { knocks } = buzzLayout(SIZE)
    const under = knocks.y + knocks.h
    for (const values of [
      {},
      { model: BUZZ_SHELL, bounces: 5, rattle: 200 },
      { bounces: 1 },
    ] as Values[]) {
      const set = settingsOf(values)
      const count = 6 * Math.round(knocks.w)
      const said = buzzTouch(set, buzzSpan(set), count)
      const shape = drawnPaths(drawDisplay(display, BUZZING_BRIDGE_PARAMS, { values })).find(
        (path) => path.kind === 'fill' && path.points[0][1] === under && path.points.length > 100,
      )
      if (!shape) throw new Error('no bounces')
      const most = set.model === BUZZ_SHELL ? 1.25 : 1
      const tall = shape.points.slice(1).filter(([, y]) => y < under)
      for (const [x, y] of tall) {
        const n = Math.round(((x - knocks.x) / knocks.w) * count) - 1
        expect((under - y) / knocks.h).toBeCloseTo(
          Math.min(1, Math.max(said[n], said[n + 1]) / most),
          6,
        )
      }
      expect(tall.length).toBeGreaterThan(50)
    }
  })

  it('draws the filters as one line, its highest place the top of the scale', () => {
    for (const size of [SIZE, UPRIGHT]) {
      const { buzz } = buzzLayout(size)
      for (let model = BUZZ_GRAZING; model <= BUZZ_PAPER; model++) {
        for (const tone of [9000, 1500]) {
          const values = { model, tone }
          const set = settingsOf(values)
          const drawn = drawDisplay(display, BUZZING_BRIDGE_PARAMS, {
            values,
            meters: PLAYED,
            ...size,
          })
          const line = drawnPaths(drawn).find(
            (path) =>
              path.kind === 'stroke' &&
              path.colour === PLAIN_COLOURS.ink &&
              path.points.length === Math.round(buzz.w) + 1,
          )
          if (!line) throw new Error('no line')
          const gain = (hz: number): number =>
            buzzFilter(hz, set, 1100, 5, 220, RATE) * buzzTone(hz, tone, RATE)
          const { top } = buzzShape(set, 1100, 5, 220, buzz, RATE)
          let highest = 0
          line.points.forEach(([x, y], n) => {
            const hz = BUZZ_MIN_HZ * (BUZZ_MAX_HZ / BUZZ_MIN_HZ) ** (n / Math.round(buzz.w))
            expect(x).toBeCloseTo(buzzXOfHz(hz, buzz), 6)
            const share = (buzz.y + buzz.h - y) / buzz.h
            expect(share).toBeCloseTo(Math.max(0, 1 + db(gain(hz) / top) / BUZZ_RANGE_DB), 6)
            highest = Math.max(highest, share)
          })
          expect(highest).toBeGreaterThan(0.98)
        }
      }
    }
  })

  it('lights a line at each partial of the note, as far up as they can be told apart, and fills the rest', () => {
    const { buzz } = buzzLayout(SIZE)
    for (const model of [BUZZ_GRAZING, BUZZ_MEMBRANE, BUZZ_LEATHER]) {
      const set = settingsOf({ model })
      const drawn = drawDisplay(display, BUZZING_BRIDGE_PARAMS, {
        values: { model },
        meters: PLAYED,
      })
      const { lines, filled } = litOf(drawn)
      expect(lines.length).toBeGreaterThan(2)
      const { top } = buzzShape(set, 1100, 5, 220, buzz, RATE)
      for (const { x, tall } of lines) {
        const k = Math.round(
          (BUZZ_MIN_HZ * (BUZZ_MAX_HZ / BUZZ_MIN_HZ) ** ((x - buzz.x) / buzz.w)) / 220,
        )
        expect(x).toBeCloseTo(buzzXOfHz(220 * k, buzz), 6)
        const gain =
          buzzFilter(220 * k, set, 1100, 5, 220, RATE) * buzzTone(220 * k, set.tone, RATE)
        const said = 1 + (db(gain / top) + PLAYED.buzz - BUZZ_TOP_DB) / BUZZ_RANGE_DB
        expect(tall / buzz.h).toBeCloseTo(Math.min(1, said), 6)
      }
      for (let n = 1; n < lines.length; n++)
        expect(lines[n].x - lines[n - 1].x).toBeGreaterThanOrEqual(BUZZ_LINES_PX)
      if (filled.length > 0)
        expect(Math.min(...filled.map(([x]) => x))).toBeGreaterThanOrEqual(
          lines[lines.length - 1].x,
        )
      expect(filled.length).toBeGreaterThan(0)
    }
    // Noise has no lines, and neither has a sound with no pitch.
    for (const [model, pitch] of [
      [BUZZ_SHELL, 220],
      [BUZZ_PAPER, 220],
      [BUZZ_GRAZING, 0],
    ]) {
      expect(buzzIsNoise(model)).toBe(pitch > 0)
      const { lines, filled } = litOf(
        drawDisplay(display, BUZZING_BRIDGE_PARAMS, {
          values: { model },
          meters: { ...PLAYED, pitch },
        }),
      )
      expect(lines).toEqual([])
      // Its highest place is the level the device reads out.
      const tall = Math.max(...filled.map(([, y]) => buzz.y + buzz.h - y)) / buzz.h
      expect(tall).toBeGreaterThan((1 + (PLAYED.buzz - BUZZ_TOP_DB) / BUZZ_RANGE_DB) * 0.97)
      expect(tall).toBeLessThanOrEqual(1 + (PLAYED.buzz - BUZZ_TOP_DB) / BUZZ_RANGE_DB + 1e-6)
    }
    // Under the scale, and at rest, nothing is lit.
    for (const meters of [{ ...PLAYED, buzz: -60 }, REST])
      expect(litOf(drawDisplay(display, BUZZING_BRIDGE_PARAMS, { meters })).top).toBe(0)
  })

  it('puts the sweep where the device says the buzz sits, on the way of the climb for the bridge', async () => {
    const values = { curve: 0.6, threshold: -60 }
    const device = await deviceAt(values)
    const set = settingsOf(values)
    for (const size of [SIZE, UPRIGHT]) {
      const { buzz, sweep } = buzzLayout(size)
      for (let k = 0; k < 6; k++) {
        const from = k * 120 * 128
        run(device, 0.32, (n) => bright(196, 0.3)(n) * Math.exp(-n / RATE), from)
        const meters = readings(device)
        const drawn = drawDisplay(display, BUZZING_BRIDGE_PARAMS, { values, meters, ...size })
        const at = dotsOf(drawn)[1]
        expect(at[0]).toBeCloseTo(buzzXOfHz(meters.place, buzz), 9)
        expect(at[1]).toBe(sweep)
        const way = drawnPaths(drawn).find(
          (path) =>
            path.kind === 'stroke' &&
            path.points.length === 2 &&
            path.points.every(([, y]) => y === Math.floor(sweep) + 0.5),
        )
        const ends = [3, buzzLastPartial(set)].map((one) =>
          buzzXOfHz(buzzPlace(set, one, meters.pitch, RATE), buzz),
        )
        ends.forEach((x, n) => expect(way?.points[n][0]).toBeCloseTo(x, 9))
        expect(at[0]).toBeGreaterThan(ends[0] - 0.6)
        expect(at[0]).toBeLessThan(ends[1] + 0.6)
      }
    }
    // The others have no climb.
    for (const model of [BUZZ_MEMBRANE, BUZZ_SHELL, BUZZ_LEATHER, BUZZ_PAPER]) {
      const { sweep } = buzzLayout(SIZE)
      const drawn = drawDisplay(display, BUZZING_BRIDGE_PARAMS, {
        values: { model },
        meters: PLAYED,
      })
      const level = drawnPaths(drawn).filter(
        (path) =>
          path.kind === 'stroke' &&
          path.points.length === 2 &&
          path.points.every(([, y]) => y === Math.floor(sweep) + 0.5),
      )
      expect(level).toEqual([])
    }
  })

  it('is drawn for a note of 220 Hz before any sound, and says so by its partials', () => {
    expect(BUZZ_NOTE_HZ).toBe(220)
    for (const meters of [{}, REST]) {
      const drawn = drawDisplay(display, BUZZING_BRIDGE_PARAMS, { meters })
      const { buzz, sweep } = buzzLayout(SIZE)
      expect(dotsOf(drawn)).toEqual([
        [buzzXOfHz(buzzPlace(settingsOf(), 3, 220, RATE), buzz), sweep],
      ])
      expect(drawn.words()).toEqual(['−60', '0 dB', '40 ms', 'Partials 3 to 10', '660 Hz'])
    }
    expect(drawDisplay(display, BUZZING_BRIDGE_PARAMS, { values: { model: 1 } }).words()).toContain(
      'Membrane',
    )
    expect(
      drawDisplay(display, BUZZING_BRIDGE_PARAMS, { meters: PLAYED }).words().slice(3),
    ).toEqual(['Partial 5.0', hzText(1100)])
  })

  it('stands as at rest when it is switched off, and takes no reading that is not a number', () => {
    const off = drawDisplay(display, BUZZING_BRIDGE_PARAMS, { meters: PLAYED, powered: false })
    expect(barOf(off)).toBeUndefined()
    expect(litOf(off).top).toBe(0)
    expect(off.words()).toContain('Partials 3 to 10')
    for (const bad of [Number.NaN, Infinity, -1])
      for (const name of METERS) {
        const drawn = drawDisplay(display, BUZZING_BRIDGE_PARAMS, {
          meters: { ...PLAYED, [name]: bad },
        })
        for (const { value } of drawn.numbers()) expect(Number.isFinite(value)).toBe(true)
      }
  })

  it('has the model, the climb, the place and the fall on its face', () => {
    expect(face.face).toEqual(['model', 'curve', 'resonance', 'fall'])
  })
})

describe('the point of the Buzzing Bridge display', () => {
  const pointAt = (values: Values = {}, size = SIZE): DisplayHandle => {
    const handles =
      display.handles?.(viewOf(display, BUZZING_BRIDGE_PARAMS, { values, ...size })) ?? []
    expect(handles.map((one) => one.key)).toEqual(['touch'])
    return handles[0]
  }

  it('is Threshold across and Amount up, and stands where they are', () => {
    for (const size of [SIZE, UPRIGHT]) {
      const { touch } = buzzLayout(size)
      for (const threshold of [-60, -36, -12.5, 0]) {
        for (const amount of [0, 0.08, 0.55, 1]) {
          const point = pointAt({ threshold, amount }, size)
          expect(point.x).toBeCloseTo(touch.x + (1 + threshold / 60) * touch.w, 9)
          expect(point.y).toBeCloseTo(touch.y + (1 - amount) * touch.h, 9)
          expect(point.drag(point.x, point.y)).toEqual({ threshold, amount })
          const moved = point.drag(touch.x + 0.75 * touch.w, touch.y + 0.2 * touch.h)
          expect(moved.threshold).toBeCloseTo(-15, 9)
          expect(moved.amount).toBeCloseTo(0.8, 9)
          expect(point.reset?.()).toEqual({ threshold: -36, amount: 0.55 })
        }
      }
      const point = pointAt({}, size)
      expect(point.drag(-90, 500)).toEqual({ threshold: -60, amount: 0 })
      expect(point.drag(900, -90)).toEqual({ threshold: 0, amount: 1 })
    }
  })

  it('is drawn where it stands', () => {
    for (const values of [{}, { threshold: -10, amount: 1 }] as Values[]) {
      const rings = drawDisplay(display, BUZZING_BRIDGE_PARAMS, { values })
        .calls.filter((call) => call.name === 'arc' && call.args[2] === 3.5)
        .map((call) => [call.args[0], call.args[1]])
      const point = pointAt(values)
      expect(rings).toEqual([[point.x, point.y]])
    }
  })
})

describe('the Buzzing Bridge display in time', () => {
  /** A device run as the page runs it: thirty frames a second, read and drawn after each. */
  async function timed(
    values: Values,
    seconds: number,
    input: (n: number) => number,
  ): Promise<RecordingContext[]> {
    const device = await deviceAt(values)
    const state = display.init?.()
    const out: RecordingContext[] = []
    let n = 0
    for (let k = 0; k < seconds * 30; k++) {
      while (n < ((k + 1) / 30) * RATE) {
        run(device, 128 / RATE, input, n)
        n += 128
      }
      out.push(
        drawDisplay(display, BUZZING_BRIDGE_PARAMS, {
          values,
          meters: readings(device),
          state,
          now: 10 + k / 30,
          dt: 1 / 30,
        }),
      )
    }
    return out
  }

  /** The most times a series turns back within any one second at thirty frames. */
  function mostTurns(series: readonly number[]): number {
    const turns: number[] = []
    let way = 0
    for (let n = 1; n < series.length; n++) {
      const move = series[n] - series[n - 1]
      if (Math.abs(move) < 1e-6) continue
      if (way !== 0 && Math.sign(move) !== way) turns.push(n)
      way = Math.sign(move)
    }
    let most = 0
    for (let first = 0; first < turns.length; first++) {
      let last = first
      while (last < turns.length && turns[last] - turns[first] < 30) last++
      most = Math.max(most, last - first)
    }
    return most
  }

  /** Plucks so many a second, every other one an octave up and half as loud. */
  const plucks =
    (rate: number) =>
    (n: number): number => {
      const step = Math.floor((n * rate) / RATE)
      const at = n - (step * RATE) / rate
      const hz = step % 2 ? 392 : 196
      return bright(hz, step % 2 ? 0.1 : 0.3)(n) * Math.exp(-at / (0.06 * RATE))
    }

  it.each([
    ['plucks, ten a second, on the bridge', {}, plucks(10)],
    ['plucks, seven a second, on the bridge', { curve: 1, fall: 100 }, plucks(7)],
    ['plucks, ten a second, on the membrane', { model: BUZZ_MEMBRANE, threshold: -14 }, plucks(10)],
    ['plucks, nine a second, on the shell', { model: BUZZ_SHELL, threshold: -20 }, plucks(9)],
    ['plucks, eight a second, on the paper', { model: BUZZ_PAPER, tracking: 1 }, plucks(8)],
    [
      'a tremolo eight times a second over and under the line',
      { model: BUZZ_LEATHER, threshold: -16 },
      (n: number) => bright(220, 0.16)(n) * (1 + 0.9 * Math.sin((TWO_PI * 8 * n) / RATE)),
    ],
  ])(
    'never turns a mark back more than six times a second: %s',
    async (_name, values, input) => {
      const frames = await timed(values, 5, input)
      const bars = frames.map((drawn) => barOf(drawn))
      const series = {
        level: bars.map((bar) => bar?.w ?? 0),
        touch: frames.map((drawn) => dotsOf(drawn)[0][1]),
        sweep: frames.map((drawn) => dotsOf(drawn).at(-1)?.[0] ?? 0),
        buzz: frames.map((drawn) => litOf(drawn).top),
      }
      for (const [name, one] of Object.entries(series))
        expect(mostTurns(one), name).toBeLessThanOrEqual(6)
      // It does move.
      const moves = (one: readonly number[]): number =>
        Math.max(...one.slice(30)) - Math.min(...one.slice(30))
      expect(moves(series.level)).toBeGreaterThan(1)
      // The bar is lit and put out no oftener.
      const lit = bars.map((bar) => (bar?.colour === PLAIN_COLOURS.accent ? 1 : 0))
      expect(mostTurns(lit)).toBeLessThanOrEqual(6)
      // The words change three times a second at the most.
      const words = frames.map((drawn) => drawn.words().slice(3).join(' '))
      const changes = words.flatMap((one, n) => (n > 1 && one !== words[n - 1] ? [n] : []))
      for (let k = 1; k < changes.length; k++)
        expect(changes[k] - changes[k - 1]).toBeGreaterThanOrEqual(10)
    },
    60_000,
  )

  it('follows a climb: the sweep goes up with the note as it dies, and only up', async () => {
    const values = { threshold: -60, curve: 0.6 }
    const frames = await timed(values, 3, (n) => bright(196, 0.3)(n) * Math.exp(-n / RATE))
    const { buzz } = buzzLayout(SIZE)
    const xs = frames.map((drawn) => dotsOf(drawn)[1]?.[0] ?? 0).slice(8)
    for (let n = 1; n < xs.length; n++) expect(xs[n]).toBeGreaterThanOrEqual(xs[n - 1] - 0.05)
    expect(xs[0]).toBeLessThan(buzzXOfHz(196 * 4.5, buzz))
    expect(xs[xs.length - 1]).toBeGreaterThan(buzzXOfHz(196 * 9, buzz))
  })

  it('goes back to rest in silence', async () => {
    const frames = await timed({ fall: 100 }, 4, (n) => (n < RATE ? bright(220, 0.2)(n) : 0))
    expect(barOf(frames[20])?.colour).toBe(PLAIN_COLOURS.accent)
    const last = frames[frames.length - 1]
    expect(barOf(last)).toBeUndefined()
    expect(last.words()).toContain('Partials 3 to 10')
  })
})
