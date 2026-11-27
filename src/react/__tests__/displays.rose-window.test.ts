// The truth of the Rose Window display: the figure it draws against the
// compiled device played at 48 kHz, harmonic by harmonic with the sign of its
// turning (opening, folding, curling, tipping, struck, ringing as a bell), the
// device's own readings, the symmetry of the drawing, and its two points.

import { describe, expect, it } from 'vitest'

import { ROSE_WINDOW_PARAMS } from '../../dsp/devices/rose-window.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { ROSE_WINDOW_FACES } from '../components/displays/rose-window'
import * as rose from '../components/displays/rose-window-parts'
import { drawnPaths, displaySize, runDisplay, testSignal, viewOf } from './display-harness'

type Name = keyof typeof ROSE_WINDOW_PARAMS
type Values = Partial<Record<Name, number>>
const [RATE, HZ] = [48000, 220]
const display = ROSE_WINDOW_FACES['rose-window'].display
const asking = (values: Values) => (name: string) =>
  values[name as Name] ?? ROSE_WINDOW_PARAMS[name as Name].default
// Nothing that is not in the picture: no air, no frame, both ears whole, all the light.
const bare: Values = { breath: 0, stone: 0, width: 1, light: 8000, volume: -12, strike: 0, turn: 0 }
const plain: Values = { ...bare, fold: 0, curl: 0, tilt: 0, attack: 0.1, bloom: 1.5 }

/** One held key of the compiled device: left and right, and what it reports at the end. */
async function played(values: Values, seconds: number) {
  const loaded = await loadWasmDevice('rose-window', RATE)
  for (const [name, value] of Object.entries(values))
    loaded.set(ROSE_WINDOW_PARAMS[name as Name], value)
  const { device } = loaded
  device.device_note_on?.(1, HZ, 0.7)
  const total = Math.round((seconds * RATE) / 128) * 128
  const sides = [new Float32Array(total), new Float32Array(total)]
  for (let done = 0; done < total; done += 128) {
    device.device_process(128)
    sides[0].set(loaded.view(device.device_out_left(), 128), done)
    sides[1].set(loaded.view(device.device_out_right(), 128), done)
  }
  return { sides, meters: [0, 1, 2, 3].map((i) => device.device_meter?.(i) ?? 0) }
}

/** How strong a turning at `hz` (backwards under nothing) is in left and right around `time`. */
function heardAt(sides: Float32Array[], hz: number, time: number): number {
  const frames = 0.2 * RATE
  let [re, im] = [0, 0]
  for (let i = 0; i < frames; i++) {
    const n = Math.round(time * RATE - frames / 2) + i
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frames)
    const angle = (2 * Math.PI * hz * n) / RATE
    const [c, s] = [Math.cos(angle), Math.sin(angle)]
    re += window * (sides[0][n] * c + sides[1][n] * s)
    im += window * (sides[1][n] * c - sides[0][n] * s)
  }
  return Math.hypot(re, im)
}

/** The same of the figure as it is drawn, over so many periods, with what Light leaves of it. */
function drawnAt(values: Values, turning: number, time: number): number {
  const ask = asking(values)
  const key = { frequency: HZ, gain: 0.7, age: time, released: null }
  const rocked = rose.roseRocked(ask, HZ, time)
  const now = rose.roseLevels(ask, key)
  const planes = rose.roseFacing(ask, HZ, rocked)
  const level = now.level.map((each, j) => each * planes[j].facing)
  const phases = rose.rosePhases(ask, HZ, rocked)
  const turns = Number.isInteger(turning) ? 1 : 40
  const figure = { level, inside: now.inside }
  const points = rose.roseFigure(ask, key, figure, planes, phases, turns, 1200)
  let [re, im] = [0, 0]
  const last = points.length - 1
  for (let i = 0; i < last; i++) {
    const angle = (2 * Math.PI * turning * i) / 1200
    const [c, s] = [Math.cos(angle), Math.sin(angle)]
    const window = turns === 1 ? 1 : 1 - Math.cos((2 * Math.PI * i) / last)
    re += (window * (points[i][0] * c + points[i][1] * s)) / last
    im += (window * (points[i][1] * c - points[i][0] * s)) / last
  }
  const cutoff = rose.roseCutoff(ask, HZ, 0.7, now.opened)
  return Math.hypot(re, im) * rose.rosePass(HZ * Math.abs(turning), cutoff)
}
const decibels = (x: number): number => 20 * Math.log10(Math.max(x, 1e-12))

describe('the figure of rose-window', () => {
  const cases: [string, Values, number[]][] = [
    ['a rose of three opening', { ...plain, petals: 3, bloom: 6 }, [0.6, 1.5, 3]],
    ['one that opens from the rim', { ...plain, petals: 4, order: 1, bloom: 6 }, [1, 2, 4]],
    ['passing light', { ...plain, petals: 5, tracery: 1, order: 2, rings: 5 }, [1, 2, 3]],
    ['a folded one', { ...plain, petals: 4, fold: 0.6, rings: 4 }, [2.5]],
    ['a curled one', { ...plain, petals: 3, curl: 0.5, rings: 4 }, [2.5]],
    ['folded and curled, tipping', { ...bare, petals: 4, fold: 0.4, curl: 0.3, bloom: 1.5 }, [2.5]],
    ['one that tips as it turns', { ...plain, turn: 0.3, tilt: 0.8 }, [2, 4]],
    ['a struck one', { ...plain, petals: 8, strike: 1, decay: 8, damping: 0, rings: 2 }, [0.3]],
    ['a bell', { ...plain, petals: 4, tracery: 3, strike: 0.7, decay: 6, rings: 3 }, [0.5, 1.5]],
  ]
  it.each(cases)('is the device’s for %s', async (_, values, times) => {
    const { sides } = await played(values, Math.max(...times) + 0.3)
    const m = rose.roseSpacing(asking(values))
    const folds = (values.fold ?? 0) + (values.curl ?? 0) > 0
    // Only these harmonics: one to each side of a multiple of the petals, backwards under nothing.
    const turning = [1, ...[1, 2, 3, 4, 5].flatMap((k) => [1 - k * m, 1 + k * m])]
    const misses: number[] = []
    for (const time of times) {
      const drawn = turning.map((t) => decibels(drawnAt(values, t, time)))
      const heard = turning.map((t) => decibels(heardAt(sides, HZ * t, time)))
      const loud = drawn.indexOf(Math.max(...drawn))
      drawn.forEach((db, i) => {
        if (i === loud || db < drawn[loud] - (folds ? 14 : 32)) return
        misses.push(Math.abs(db - drawn[loud] - (heard[i] - heard[loud])))
      })
    }
    expect(misses.length).toBeGreaterThanOrEqual(times.length * 2)
    expect(Math.max(...misses)).toBeLessThan(folds ? 2.5 : 1.5)
  })

  it('turns and opens as the device reports', async () => {
    const values = { ...bare, turn: 0.45, bloom: 6, petals: 3 }
    for (const time of [1, 3]) {
      const ask = asking(values)
      const { meters } = await played(values, time)
      const off = rose.roseAngle(HZ, rose.roseRocked(ask, HZ, time)) - meters[0]
      expect(Math.abs(off - Math.round(off))).toBeLessThan(0.02)
      const key = { frequency: HZ, gain: 0.7, age: time, released: null }
      expect(Math.abs(rose.roseLevels(ask, key).opened - meters[1])).toBeLessThan(0.03)
    }
  })
})

describe('the drawing of rose-window', () => {
  const { window, slope } = rose.roseLayout(displaySize(display))
  const note = { id: 1, frequency: HZ, gain: 0.7, age: 8, released: null }
  const meters = { angle: 0.3, open: 1, level: 0.3, note: HZ }

  it.each([3, 4, 8])('has %i petals about the middle of the window', (petals) => {
    const values = { petals, turn: 0, breath: 0, rings: 3 }
    const options = { values, meters, notes: [note], signal: testSignal() }
    const drawn = runDisplay(display, ROSE_WINDOW_PARAMS, 0.2, options)
    const [figure] = drawnPaths(drawn).filter(
      ({ colour, points }) => colour === PLAIN_COLOURS.accent && points.length > 400,
    )
    const around = figure.points.map(([x, y]) => Math.hypot(x - window.x, y - window.y))
    expect(Math.abs(Math.max(...around) / window.r - 0.8)).toBeLessThan(0.2)
    const turn = around.length - 1
    expect(turn % petals).toBe(0)
    for (let i = 0; i < turn; i++)
      expect(around[(i + turn / petals) % turn]).toBeCloseTo(around[i], 3)
  })

  it('has points that set Rings and Light where they stand, and Petals on a wheel', () => {
    const values = { rings: 3, light: 900, petals: 12 }
    const view = viewOf(display, ROSE_WINDOW_PARAMS, { values })
    const [rings, light] = display.handles?.(view) ?? []
    const out = Math.hypot(rings.x - window.x, rings.y - window.y)
    expect(out).toBeCloseTo(rose.roseRadius(3, window.r), 6)
    expect(rings.drag(rings.x, rings.y).rings).toBeCloseTo(3, 6)
    expect([rings.wheel?.(-1), rings.wheel?.(1)]).toEqual([{ petals: 11 }, { petals: 12 }])
    expect(light.y).toBeCloseTo(rose.roseY(900, slope), 6)
    expect(light.drag(light.x, rose.roseY(3000, slope)).light).toBeCloseTo(3000, 4)
  })
})
