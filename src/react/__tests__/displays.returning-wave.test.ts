// The truth of the Returning Wave display: its wave against what a return must
// do, its clock and its harmonics against the compiled device as it sounds, the
// keys' ways against the device's own rules, and its two points and its playhead.

import { describe, expect, it } from 'vitest'

import { RETURNING_WAVE_PARAMS } from '../../dsp/devices/returning-wave.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { RETURNING_WAVE_FACES, waveLayout, waveX } from '../components/displays/returning-wave'
import * as wave from '../components/displays/returning-wave-math'
import { displaySize, drawDisplay, drawnPaths, runDisplay, viewOf } from './display-harness'

type Name = keyof typeof RETURNING_WAVE_PARAMS
type Values = Partial<Record<Name, number>>
const RATE = 48000
const display = RETURNING_WAVE_FACES['returning-wave'].display
const { cloth } = waveLayout(displaySize(display))
const settings = (values: Values = {}): wave.WaveSettings =>
  wave.waveSettings((name) => values[name as Name] ?? RETURNING_WAVE_PARAMS[name as Name].default)
/** What is read at a place on the journey of a wave thrown with these knobs, with nothing blurred. */
function read(values: Values, journey: number, hit = 0.75) {
  const set = settings(values)
  const law = wave.waveLaw(set.walls)
  return wave.waveReading(law, wave.wavePacket(law, set, hit), set.reading, journey, 0, 0)
}
const share = (rho: Float64Array, every: number): number => {
  const power = [...rho].map((x, n) => (n > 0 ? x * x : 0))
  const sum = (of: number[]) => of.reduce((a, b) => a + b, 0)
  return sum(power.filter((_, n) => n % every === 0)) / sum(power)
}
const ways = (values: Values, notes: { hz: number; age: number; released?: number }[]) => {
  const state: wave.WaveKeys = { keys: [], shared: { journey: 0, swing: 0 }, firstHz: 220 }
  const sent = notes.map(({ hz, age, released = null }, id) => ({
    ...{ id, frequency: hz, gain: 0.7, age },
    released: released,
  }))
  wave.waveKeys(state, sent, settings(values), 100, 0)
  return state.keys
}

/** The level of each harmonic of a 110 Hz key around a time, as the device sounds. */
async function sounding(values: Values, times: readonly number[]): Promise<number[][]> {
  const loaded = await loadWasmDevice('returning-wave', RATE)
  const plain: Values = { anchor: 0, haze: 0, splash: 0, ears: 0, blur: 0, second: 0, attack: 0.02 }
  for (const [name, value] of Object.entries({ ...plain, ...values }))
    loaded.set(RETURNING_WAVE_PARAMS[name as Name], value)
  const { device } = loaded
  device.device_note_on?.(1, 110, 0.75)
  const total = Math.ceil((Math.max(...times) + 0.1) * RATE)
  const out = new Float32Array(total + 128)
  for (let done = 0; done < total; done += 128) {
    device.device_process(128)
    out.set(loaded.view(device.device_out_left(), 128), done)
  }
  const size = 2 * Math.round((4 / 110) * RATE)
  return times.map((time) => {
    const from = Math.max(0, Math.round(time * RATE) - size / 2)
    return Array.from({ length: 13 }, (_, n) => {
      let [re, im] = [0, 0]
      for (let i = 0; i < size; i++) {
        const x = out[from + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size))
        re += x * Math.cos((2 * Math.PI * 110 * n * i) / RATE)
        im += x * Math.sin((2 * Math.PI * 110 * n * i) / RATE)
      }
      return Math.hypot(re, im)
    })
  })
}

describe('the display of returning-wave', () => {
  it('has the wave whole at a return, in two and three copies on the way, and nowhere else', () => {
    const ring: Values = { walls: 1, second: 0 }
    for (const values of [{}, ring]) {
      const start = read(values, 0)
      expect(start.copies).toBe(1)
      const back = read(values, 1)
      start.rho.forEach((x, n) => expect(Math.abs(back.rho[n])).toBeCloseTo(Math.abs(x), 6))
    }
    expect(share(read(ring, 1 / 2).rho, 2)).toBeGreaterThan(0.99)
    expect(share(read(ring, 1 / 3).rho, 3)).toBeGreaterThan(0.99)
    expect(read(ring, 1 / 2).copies).toBe(2)
    expect(read(ring, 1 / 3).copies).toBe(3)
    expect(read(ring, 0.1931).copies).toBe(0)
  })

  it('is a density: never under nothing, with the same all through it', () => {
    for (const walls of [0, 1, 2, 3, 4])
      for (const journey of [0, 0.21, 0.5, 1.37])
        for (let place = 0; place <= Math.PI; place += 0.1)
          expect(wave.waveAt(read({ walls }, journey), 0, place)).toBeGreaterThan(-0.01)
  })

  it('counts time as the device does: the octave and the twelfth sound when the clock says', async () => {
    const seconds = 6
    for (let clock = -0.4; clock < 2; clock += 0.0937)
      expect(wave.waveClock(wave.waveJourney(clock))).toBeCloseTo(clock, 4)
    expect(wave.WAVE_TURN).toBeGreaterThan(0.95)
    expect(wave.WAVE_TURN).toBeLessThan(1.05)
    const when = [1 / 3, 1 / 2].map((at) => wave.waveClock(at) * wave.WAVE_TURN * seconds)
    const heard = await sounding({ walls: 1, return: seconds }, [...when, 1.1, 2.6])
    const only = (levels: number[], every: number) => share(Float64Array.from(levels), every)
    expect(only(heard[0], 3)).toBeGreaterThan(0.97)
    expect(only(heard[1], 2)).toBeGreaterThan(0.97)
    for (const other of heard.slice(2)) {
      expect(only(other, 3)).toBeLessThan(0.9)
      expect(only(other, 2)).toBeLessThan(0.9)
    }
    const held = ways({ return: seconds }, [{ hz: 110, age: when[1] }])
    expect(held[0].journey).toBeCloseTo(0.5, 2)
  })

  it('lets each key go its own way: by pitch, on a shared clock, frozen, leaking, let go', () => {
    const chord = [220, 440].map((hz) => ({ hz, age: 1 }))
    const [low, high] = ways({ clock: 1, return: 12 }, chord)
    expect(wave.waveClock(high.journey) / wave.waveClock(low.journey)).toBeCloseTo(2 ** 1.1, 1)
    const shared = ways({ clock: 2, return: 12, start: 0.2 }, chord)
    expect(shared[0].journey - shared[1].journey).toBeCloseTo(0.06, 6)
    const frozen = ways({ freeze: 0.9, start: 0.4, return: 2 }, [{ hz: 220, age: 40 }])
    expect(Math.abs(frozen[0].journey - 0.4)).toBeLessThan(1.36 * wave.waveReach(0.9))
    expect(ways({ leak: 0 }, chord)[0].lost).toBe(0)
    expect(ways({ leak: 0.5 }, chord)[0].lost).toBeGreaterThan(0.3)
    expect(ways({ release: 1 }, [{ hz: 220, age: 3, released: 1.2 }])).toEqual([])
  })

  it('stands the playhead where the key is, and draws a hollow reading to both sides', () => {
    const note = { id: 1, frequency: 110, gain: 0.7, released: null }
    const at = ways({}, [{ hz: 110, age: 4 }])[0].journey
    const drawn = drawDisplay(display, RETURNING_WAVE_PARAMS, { notes: [{ ...note, age: 4 }] })
    const heads = drawnPaths(drawn).filter(
      (path) => path.colour === PLAIN_COLOURS.accent && path.kind === 'stroke',
    )
    expect(heads).toHaveLength(1)
    expect(Math.abs(heads[0].points[0][0] - waveX(at, cloth))).toBeLessThan(0.6)
    const run = runDisplay(display, RETURNING_WAVE_PARAMS, 1, {}, (time) => ({
      notes: [{ ...note, age: time + 0.01 }],
    }))
    expect(run.words()).toContain('A2 whole')
    const crests = wave.waveAt(read({ reading: 1 }, 0), 1, 0.3)
    expect(wave.waveAt(read({ reading: 1 }, 0), 1, Math.PI - 0.3)).toBeCloseTo(-crests, 2)
  })

  it('has points that set Place, Throw and Start, and a wheel for Width and Freeze', () => {
    const [place, start] = display.handles?.(viewOf(display, RETURNING_WAVE_PARAMS)) ?? []
    const spot = place.drag(waveX(0, cloth) + 11, cloth.y + cloth.h * (0.03 + 0.47 * 0.6))
    expect(spot.place).toBeCloseTo(0.6, 6)
    expect(spot.throw).toBeCloseTo(0.5, 6)
    expect(place.reset?.()).toEqual({ place: 0.12, throw: 0.25 })
    expect(place.wheel?.(5).width).toBeCloseTo(0.3, 6)
    for (const at of [0, 1 / 3, 0.5, 0.8])
      expect(start.drag(waveX(at, cloth), 0).start).toBeCloseTo(at, 3)
    expect(start.wheel?.(1)).toEqual({ freeze: 0.02 })
  })
})
