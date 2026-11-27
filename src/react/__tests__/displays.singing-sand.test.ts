// The truth of the Singing Sand display: its figures against the compiled
// device played at 48 kHz (the share of grains in step, the overtones of a
// held key under every pulse, layer and cluster, the surge it reports and how
// far that takes it down), the drawing against those figures, and its points.

import { describe, expect, it } from 'vitest'

import { SINGING_SAND_PARAMS } from '../../dsp/devices/singing-sand.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SAND_GRAINS,
  SAND_OVERTONES,
  SINGING_SAND_FACES,
  sandBarHeight,
  sandFall,
  sandFelt,
  sandLayout,
  sandLeans,
  sandLock,
  sandOvertones,
  sandSet,
  sandTip,
  type SandSet,
} from '../components/displays/singing-sand'
import { displaySize, drawDisplay, drawnPaths, viewOf } from './display-harness'

const RATE = 48000
const display = SINGING_SAND_FACES['singing-sand'].display
const at = sandLayout(displaySize(display))

type Name = keyof typeof SINGING_SAND_PARAMS
type Values = Partial<Record<Name, number>>
const setOf = (values: Values = {}): SandSet =>
  sandSet((name) => values[name as Name] ?? SINGING_SAND_PARAMS[name as Name].default)

/** An even slide: no surge, hiss, boom or width, so one ear hears the grains alone. */
const PLAIN: Values = { slope: 0, dry: 0, boom: 0, width: 0, grit: 0.05, spread: 3, flow: 1 }

/** One key held: the left ear, and the two readings 200 times a second. */
async function play(values: Values, hz: number, seconds: number) {
  const loaded = await loadWasmDevice('singing-sand', RATE)
  const { device } = loaded
  for (const [name, value] of Object.entries({ volume: -12, ...values }))
    loaded.set(SINGING_SAND_PARAMS[name as Name], value)
  const wave = new Float32Array(Math.round(seconds * 200) * 240)
  const lock: number[] = []
  const flow: number[] = []
  device.device_note_on?.(1, hz, 0.7)
  for (let done = 0; done < wave.length; done += 240) {
    device.device_process(240)
    wave.set(loaded.view(device.device_out_left(), 240), done)
    lock.push(device.device_meter?.(0) ?? 0)
    flow.push(device.device_meter?.(1) ?? 0)
  }
  return { wave, lock, flow }
}

/** How strong the sine at `hz` is over the second half of a sound, through a raised-cosine window. */
function tone(wave: Float32Array, hz: number): number {
  const from = wave.length / 2
  let [re, im] = [0, 0]
  for (let i = from; i < wave.length; i++) {
    const shade = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i - from)) / from)
    re += shade * wave[i] * Math.cos((2 * Math.PI * hz * i) / RATE)
    im += shade * wave[i] * Math.sin((2 * Math.PI * hz * i) / RATE)
  }
  return Math.hypot(re, im)
}

const dB = (ratio: number): number => 20 * Math.log10(ratio)
const mean = (all: readonly number[]): number => all.reduce((a, b) => a + b, 0) / all.length

describe('the figures of singing-sand against the device', () => {
  it('hold as many grains in step as Lockstep does', async () => {
    for (const lockstep of [0.25, 0.5, 0.75, 1]) {
      const { lock } = await play({ ...PLAIN, lockstep }, 220, 6)
      expect(Math.abs(mean(lock.slice(400)) - sandLock(lockstep))).toBeLessThan(0.12)
    }
  })

  it('give every overtone of a locked key the level it is heard at', async () => {
    const hz = 220
    for (const values of [
      { pulse: 0, layer: 0.6, layerOrder: 3, bury: 0.1 },
      { pulse: 0, layer: 0.2, layerOrder: 6, cluster: 3, grain: 0.6 },
      { pulse: 1, layer: 0.3, layerOrder: 5, bury: 0.35 },
      { pulse: 2, layer: 0, grain: 0.3 },
      { pulse: 3, layer: 0.4, layerOrder: 2, grain: 0.7 },
      { pulse: 4, layer: 0.1, layerOrder: 4, bury: 0 },
    ] satisfies Values[]) {
      const all = { ...PLAIN, lockstep: 1, run: 0.2, onset: 0.02, ...values }
      const { wave, lock } = await play(all, hz, 8)
      const key = { hz, gain: 0.7, lock: mean(lock.slice(800)), felt: 1 }
      const drawn = sandOvertones(setOf(all), key, RATE)
      const heard = drawn.map((_, i) => tone(wave, hz * (i + 1)))
      const top = Math.max(...heard)
      drawn.forEach((level, i) => {
        // What the picture shows tall has to be heard so; under that the grains' noise is as loud.
        if (level > 0.06)
          expect(
            Math.abs(dB(heard[i] / top) - dB(level)),
            `${JSON.stringify(values)} overtone ${i + 1}`,
          ).toBeLessThan(3.5)
      })
    }
  })

  it('follow the surge a key reports, and take it down as far', async () => {
    const values: Values = { slope: 0.6, pace: 1, front: 0.6 }
    const { flow } = await play(values, 220, 4)
    // The weather drifts a little from the clock, so the turn is taken where the crest is found.
    const set = setOf(values)
    const apart = Array.from({ length: 100 }, (_, n) =>
      mean(flow.slice(400, 600).map((f, i) => Math.abs(f - sandFelt(set, 1, n / 100 + i / 200)))),
    )
    expect(Math.min(...apart)).toBeLessThan(0.1)
    expect(sandFall(set, 1)).toBe(0)
    expect(sandFall(set, 0)).toBeCloseTo(6.02 * 3 * 0.6 * (0.75 + 0.33) * (0.8 + 0.24), 6)
    expect(sandFall(setOf({ slope: 0 }), 0)).toBe(0)
  })

  it('lay the grains so that their mean is the coherence, at the key', () => {
    for (const coherence of [0.1, 0.4, 0.7, 0.9, 0.98])
      for (const turn of [0, 1.3, 7.7]) {
        const leans = sandLeans(coherence, turn)
        expect(leans).toHaveLength(SAND_GRAINS)
        const along = mean(leans.map((lean) => Math.cos(2 * Math.PI * lean)))
        expect(Math.abs(along - coherence)).toBeLessThan(0.06)
      }
  })
})

describe('the drawing of singing-sand', () => {
  it('draws the bars at their heights and the ridge of every key', () => {
    const drawn = drawDisplay(display, SINGING_SAND_PARAMS)
    const key = { hz: 220, gain: 0.7, lock: sandLock(0.75), felt: 1 }
    const heights = sandOvertones(setOf(), key, RATE).map((level) => sandBarHeight(level, at.bars))
    const rects = drawn.calls.filter((call) => call.name === 'fillRect')
    for (const tall of heights.filter((one) => one > 0))
      expect(rects.some(({ args }) => Math.abs(Number(args[3]) - tall) < 1e-6)).toBe(true)
    expect(heights).toHaveLength(SAND_OVERTONES)
    const wide = drawnPaths(drawn).filter(
      ({ kind, colour, points }) =>
        kind === 'stroke' && colour === PLAIN_COLOURS.ink && points.length > at.dune.w,
    )
    expect(wide).toHaveLength(3)
  })

  it('has an arrow that sets Lockstep and a bell that sets Layer and its Order', () => {
    const [lockstep, layer] = display.handles?.(viewOf(display, SINGING_SAND_PARAMS)) ?? []
    expect(lockstep.y).toBeCloseTo(sandTip(at.ring, sandLock(0.75)), 9)
    expect(lockstep.drag(0, sandTip(at.ring, sandLock(0.3))).lockstep).toBeCloseTo(0.3, 6)
    expect(lockstep.drag(0, at.ring.y + 20)).toEqual({ lockstep: 0 })
    expect(layer.drag(layer.x, layer.y).layer).toBeCloseTo(0.42, 9)
    expect(layer.drag(layer.x, layer.y).layerOrder).toBe(3)
    expect(layer.drag(at.bars.x - 9, at.bars.y)).toEqual({ layer: 1, layerOrder: 1 })
  })
})
