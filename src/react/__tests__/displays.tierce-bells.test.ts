// The truth of the Tierce Bells display. Its arithmetic against the compiled
// device played at 48 kHz (the third of every key in every scale, the glide of
// a strike that leans, how strongly a clapper wakes each partial, how long each
// rings, how a rubbed bell grows, the level it reports), the drawing against
// that arithmetic, its two points, and the timed draw: nothing drawn turns
// back more than six times in a second, which is three swings.

import { describe, expect, it } from 'vitest'

import { TIERCE_BELLS_PARAMS } from '../../dsp/devices/tierce-bells.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
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
  testLevel,
  viewOf,
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
          // Only every sixth key is let ring out between; the device takes voices as it needs them.
          player.up(1)
          player.run(0.02)
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
        // The level of a rubbed bell does not fall under what it will be while the key is down.
        if (set.bell === 3 && !freed && time < 1) continue
        const off = offAt === null ? 0 : Math.max(0, time - Math.ceil(offAt / 0.064) * 0.064)
        const want = tierceTotal(tierceLevels(set, hz, 0.8, place, time, off, RATE))
        const is = player.meter('level')
        if (set.bell === 3 && !freed && is > want && time < 2.5) continue
        expect(is / want, `${JSON.stringify(values)} at ${time.toFixed(2)}`).toBeGreaterThan(0.95)
        expect(is / want, `${JSON.stringify(values)} at ${time.toFixed(2)}`).toBeLessThan(1.05)
      }
    }
  }, 60000)
})
