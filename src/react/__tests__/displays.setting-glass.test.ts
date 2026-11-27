// The truth of the Setting Glass display: the heat and the setting front it
// draws against the compiled device played at 48 kHz, the tones it draws
// against a render's spectrum, what is drawn, and what its two points set.

import { describe, expect, it } from 'vitest'

import { SETTING_GLASS_PARAMS } from '../../dsp/devices/setting-glass.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { SETTING_GLASS_FACES } from '../components/displays/setting-glass'
import * as glass from '../components/displays/setting-glass-heat'
import * as kit from './display-harness'

const RATE = 48000
const A3 = 220
const { display } = SETTING_GLASS_FACES['setting-glass']
const map = glass.glassMap(kit.displaySize(display))
const REST_HZ = glass.GLASS_REST_HZ
const frontY = (value: glass.GlassValue, heat: number): number =>
  glass.glassY(glass.glassFront(value, REST_HZ, heat), map)
type Values = Partial<Record<keyof typeof SETTING_GLASS_PARAMS, number>>
const valueOf =
  (values: Values): glass.GlassValue =>
  (name) =>
    values[name as keyof Values] ?? SETTING_GLASS_PARAMS[name as keyof Values].default

/** One key held: what the device reports at each of the times, and the sound of the last second. */
async function play(values: Values, hz: number, times: readonly number[]) {
  const { device, set, view } = await loadWasmDevice('setting-glass', RATE)
  for (const [name, value] of Object.entries(values))
    set(SETTING_GLASS_PARAMS[name as keyof Values], value)
  device.device_note_on?.(1, hz, 0.6)
  const sound: number[] = []
  let done = 0
  const told = times.map((until) => {
    for (; done < until * RATE; done += 128) {
      device.device_process(128)
      const right = view(device.device_out_right(), 128)
      view(device.device_out_left(), 128).forEach((left, i) => sound.push(left + right[i]))
    }
    return { heat: device.device_meter?.(0) ?? NaN, front: device.device_meter?.(1) ?? NaN }
  })
  return { told, sound: sound.slice(-RATE) }
}

const QUIET: Values = { remelt: 0, blows: 0 }
const TIMES = [0.02, 0.3, 0.7, 1.2, 1.8, 2.5, 3.5, 5]
const heatAt = (value: glass.GlassValue, hz: number, times: readonly number[]): number[] =>
  times.map((t) => glass.glassHeats(value, hz, [Math.max(t - 0.01, 0), t])[1])

describe('the display of setting-glass', () => {
  it.each<[string, Values, number]>([
    ['at its defaults with nothing done to it', QUIET, A3],
    ['tapped, low', { ...QUIET, strike: 2 }, 65.4],
    ['under a cold rod', { ...QUIET, strike: 1, heat: 1 }, A3],
    ['poured, high, and kept warm', { ...QUIET, strike: 3, rest: 0.5 }, 880],
    ['warmer at rest than at first', { ...QUIET, heat: 0.1, rest: 0.6, strike: 2 }, A3],
    ['wide of border, in obsidian', { ...QUIET, edge: 0.8, matter: 4 }, A3],
    ['struck only as it goes', { ...QUIET, when: 2, matter: 5 }, A3],
  ])('cools as the device does, %s', async (_, values, hz) => {
    const value = valueOf(values)
    const { told } = await play(values, hz, TIMES)
    heatAt(value, hz, TIMES).forEach((heat, i) => {
      expect(Math.abs(heat - told[i].heat), `heat at ${TIMES[i]} s`).toBeLessThan(0.02)
      const off = glass.glassFront(value, hz, told[i].heat) - Math.log2(told[i].front)
      expect(Math.abs(off), `front at ${TIMES[i]} s`).toBeLessThan(0.01)
    })
  })

  it('goes back to the fire and is struck as often and as far as the device', async () => {
    const times = Array.from({ length: 240 }, (_, i) => (i + 1) / 20)
    const mean = (of: number[]) => of.reduce((a, b) => a + b, 0) / of.length
    const most = (of: number[]) => Math.max(...of.slice(20))
    for (const values of [{ remelt: 0.8, blows: 0 }, { remelt: 0, blows: 1 }, {}] as Values[]) {
      const { told } = await play(values, A3, times)
      const heats = told.map(({ heat }) => heat)
      const drawn = glass.glassHeats(valueOf(values), A3, times)
      expect(Math.abs(mean(drawn) - mean(heats))).toBeLessThan(0.05)
      expect(Math.abs(most(drawn) - most(heats))).toBeLessThan(0.1)
    }
  })

  it('comes to stand where its point is', () => {
    const settings: Values[] = [{}, { rest: 0.4 }, { heat: 0.1, rest: 0.7 }, { cooling: 8 }]
    for (const value of settings.map(valueOf)) {
      const stands = glass.glassStands(value)
      const at = [0.9, 1.05, 1.2].map((share) => share * stands)
      const off = glass
        .glassHeats(value, REST_HZ, at, true)
        .map((heat) => Math.abs(heat - glass.glassRest(value)))
      expect(off[0]).toBeGreaterThan(0.01)
      expect(off[2]).toBeLessThan(0.005)
    }
  })

  it('has its tones where the render has them', async () => {
    for (const matter of [0, 1, 2, 5]) {
      const values: Values = { matter, heat: 0, order: 0.5, stretch: 0.5, breath: 0.6, ticks: 0.8 }
      const { sound } = await play(values, A3, [2.2])
      const power = (hz: number): number => {
        let [re, im] = [0, 0]
        sound.forEach((s, i) => {
          const turn = (2 * Math.PI * i) / RATE
          re += s * (1 - Math.cos(turn)) * Math.cos(hz * turn)
          im += s * (1 - Math.cos(turn)) * Math.sin(hz * turn)
        })
        return re * re + im * im
      }
      const tones = glass.glassTones(valueOf(values), A3).filter((tone) => tone.level > 0.15)
      expect(tones.length).toBeGreaterThan(2)
      for (const tone of tones) {
        const hz = 2 ** tone.place
        const beside = Math.max(power(hz * 1.025 + 4), power(hz * 0.975 - 4))
        const near = Math.max(...[-2, -1, 0, 1, 2].map((off) => power(hz + off)))
        expect(near, `matter ${matter} at ${hz.toFixed(0)} Hz`).toBeGreaterThan(4 * beside)
      }
    }
  })

  it('clears from the top down', () => {
    const value = valueOf(QUIET)
    const tones = glass.glassTones(value, A3).sort((a, b) => b.place - a.place)
    const times = Array.from({ length: 400 }, (_, i) => i / 100)
    const heats = glass.glassHeats(value, A3, times)
    const fronts = heats.map((heat) => glass.glassFront(value, A3, heat))
    const border = glass.glassBorder(value)
    const clears = tones.map(({ place }) =>
      fronts.findIndex((front) => glass.glassSet(place, front, border) > 0.5),
    )
    expect(clears.every((at, i) => at >= 0 && (i === 0 || at >= clears[i - 1]))).toBe(true)
    expect(clears[clears.length - 1]).toBeGreaterThan(clears[0] + 60)
  })

  it('draws a held key up to now with what is reported', () => {
    const meters = { heat: 0.5, front: 900, level: 0.1, note: A3 }
    const note = (age: number) => [{ id: 1, frequency: A3, gain: 0.7, age, released: null }]
    const each = (t: number) => ({ notes: note(0.1 + t) })
    const options = { meters, signal: kit.testSignal(), values: QUIET }
    const drawn = kit.runDisplay(display, SETTING_GLASS_PARAMS, 1.4, options, each)
    expect(drawn.words()).toContain('900 Hz')
    const trail = kit
      .drawnPaths(drawn)
      .find(({ colour, width }) => colour === PLAIN_COLOURS.accent && width === 1.75)
    const y = glass.glassY(Math.log2(900), map)
    expect(trail?.points.every((point) => Math.abs(point[1] - y) < 0.01)).toBe(true)
    expect(Math.abs((trail?.points.at(-1)?.[0] ?? 0) - glass.glassX(1.47, map))).toBeLessThan(3)
    expect(kit.drawDisplay(display, SETTING_GLASS_PARAMS).words()).toContain('2.5 s')
  })

  it('sets what its points stand for', () => {
    const view = kit.viewOf(display, SETTING_GLASS_PARAMS)
    const [heat, stands] = display.handles?.(view) ?? []
    const lower = heat.drag(heat.x, heat.y + 20).heat
    expect(frontY(valueOf({}), 1.15 * lower)).toBeCloseTo(heat.y + 20, 5)
    const value = valueOf(stands.drag(stands.x + 12, stands.y - 9))
    expect(glass.glassX(glass.glassStands(value), map)).toBeCloseTo(stands.x + 12, 5)
    expect(frontY(value, glass.glassRest(value))).toBeCloseTo(stands.y - 9, 5)
  })
})
