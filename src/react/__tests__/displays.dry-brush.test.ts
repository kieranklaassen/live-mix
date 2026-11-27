// The truth of the Dry Brush display: the stroke it draws against what the
// compiled device reports of one (ink, pressure and stain), the drawing
// against the knobs, the handles, and the nib.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { DRY_BRUSH_PARAMS } from '../../dsp/devices/dry-brush.gen'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  DRY_BRUSH_FACES,
  DRY_BRUSH_HELD,
  DRY_BRUSH_TAIL,
  dryBrushHand,
  dryBrushLayout,
  dryBrushStroke,
  dryBrushX,
  dryBrushY,
} from '../components/displays/dry-brush'
import {
  displaySize,
  drawDisplay,
  drawnPaths,
  runDisplay,
  testSignal,
  viewOf,
} from './display-harness'

const RATE = 48000
const display = DRY_BRUSH_FACES['dry-brush'].display
const at = dryBrushLayout(displaySize(display))
type Values = Partial<Record<keyof typeof DRY_BRUSH_PARAMS, number>>
const knobs = (values: Values) => (name: string) =>
  values[name as keyof Values] ?? DRY_BRUSH_PARAMS[name as keyof typeof DRY_BRUSH_PARAMS].default

/** What the device reports of one A3 at 0.7, held for two seconds and let go: seconds to [ink, pressure, stain]. */
async function reported(values: Values): Promise<(seconds: number) => number[]> {
  const { device, set } = await loadWasmDevice('dry-brush', RATE)
  for (const [name, value] of Object.entries(values))
    set(DRY_BRUSH_PARAMS[name as keyof typeof DRY_BRUSH_PARAMS], value)
  device.device_note_on?.(1, 220, 0.7)
  const rows: number[][] = []
  for (let block = 0; block < 4 * 375; block++) {
    if (block === 2 * 375) device.device_note_off?.(1)
    device.device_process(128)
    rows.push([0, 1, 2].map((index) => device.device_meter?.(index) ?? NaN))
  }
  return (seconds) => rows[Math.round(seconds * 375) - 1]
}

const STROKES: readonly [string, Values][] = [
  ['the default', {}],
  ['a dot', { script: 1, attack: 0.01 }],
  ['a rising hook', { script: 2, speed: 0.6 }],
  ['a falling sweep of a feather', { script: 3, brush: 3 }],
  ['a seal on stone', { script: 5, paper: 3, ink: 0.8 }],
  ['a reed pen with little ink on rough paper', { brush: 1, paper: 2, ink: 0.2 }],
  ['a wet finger on rice paper', { brush: 4, paper: 1, ink: 0.9, soak: 8 }],
  ['a dry broad edge', { brush: 2, dryness: 0.9, pressure: 0.9 }],
]

describe('dry-brush: the stroke it draws', () => {
  it.each(STROKES)(
    'spends ink, presses and stains as the device reports: %s',
    async (_, values) => {
      const device = await reported(values)
      const stroke = dryBrushStroke(knobs(values), 0.7, 2)
      for (const seconds of [0.1, 0.4, 0.9, 1.8, 2.4, 3.5]) {
        const drawn = stroke.find((moment) => moment.t >= seconds - 0.006)
        const [ink, pressure, stain] = device(seconds)
        // Every stroke of the device has its own chance: the thirst of its hairs and its sway.
        expect(Math.abs((drawn?.ink ?? 9) - ink), `ink at ${seconds}`).toBeLessThan(0.1)
        expect(Math.abs((drawn?.stain ?? 9) - stain), `stain at ${seconds}`).toBeLessThan(0.1)
        const shown = Math.min(1, 0.7 * (drawn?.pressure ?? 9))
        expect(Math.abs(shown - pressure), `pressure at ${seconds}`).toBeLessThan(0.14)
      }
    },
  )

  it('swells in a hook, falls in a sweep and thins when it runs dry', () => {
    expect(dryBrushHand(2, 0)[0]).toBeCloseTo(0.06)
    expect(dryBrushHand(2, 1)[0]).toBeCloseTo(1.2)
    expect(dryBrushHand(3, 0)[0]).toBeCloseTo(1.44)
    expect(dryBrushHand(3, 3)[0]).toBeLessThan(0.11)
    const little = dryBrushStroke(knobs({ ink: 0.1 }))
    const much = dryBrushStroke(knobs({ ink: 1 }))
    const sum = (strokes: typeof little) => strokes[150].loud.reduce((all, one) => all + one, 0)
    expect(sum(much)).toBeGreaterThan(2 * sum(little))
    // Dipped again, it has ink once more.
    const redipped = dryBrushStroke(knobs({ ink: 0.1, redip: 0.9 }))
    expect(redipped[300].ink).toBeGreaterThan(little[300].ink + 0.3)
  })

  it('leans in and out by the knobs', () => {
    const stroke = dryBrushStroke(knobs({ lean: 400, tailLean: -300, release: 1 }))
    expect(stroke[0].cents).toBeGreaterThan(350)
    expect(Math.abs(stroke[390].cents)).toBeLessThan(5)
    expect(stroke[stroke.length - 1].cents).toBeCloseTo(-300, 0)
  })
})

describe('dry-brush: the picture', () => {
  it('puts the lift between the held key and the tail', () => {
    expect(dryBrushX(at, 0, 0)).toBe(at.field.x)
    expect(dryBrushX(at, DRY_BRUSH_HELD, 0)).toBe(at.lift)
    expect(dryBrushX(at, 99, DRY_BRUSH_TAIL)).toBe(at.field.x + at.field.w)
    expect(dryBrushY(at, 0)).toBe(at.middle)
    expect(at.middle - dryBrushY(at, 1200)).toBeCloseTo(2 * (at.middle - dryBrushY(at, 300)))
  })

  it('draws hairs within the window, more of them under a heavier hand', () => {
    const inkOf = (values: Values): number => {
      const paths = drawnPaths(drawDisplay(display, DRY_BRUSH_PARAMS, { values }))
      const hairs = paths.filter((path) => path.kind === 'stroke' && path.points.length > 3)
      for (const path of hairs)
        for (const [, y] of path.points) {
          expect(y).toBeGreaterThan(0)
          expect(y).toBeLessThan(100)
        }
      return hairs.reduce((all, path) => all + path.points.length * path.width * path.alpha, 0)
    }
    expect(inkOf({ pressure: 0.9 })).toBeGreaterThan(1.3 * inkOf({ pressure: 0.1 }))
    expect(inkOf({ dryness: 0.1 })).toBeGreaterThan(1.2 * inkOf({ dryness: 1, ink: 0.2 }))
  })

  it('has handles that set the landing and the lift', () => {
    const view = viewOf(display, DRY_BRUSH_PARAMS)
    const [landing, lift] = display.handles?.(view) ?? []
    const half = at.field.x + (at.lift - at.field.x) / 2
    const set = landing.drag(half, dryBrushY(at, 500))
    expect(set.attack).toBeCloseTo(DRY_BRUSH_HELD / 4)
    expect(set.lean).toBeCloseTo(500)
    expect(lift.drag(dryBrushX(at, 0, 3), dryBrushY(at, -700)).release).toBeCloseTo(3)
    expect(lift.drag(dryBrushX(at, 0, 3), dryBrushY(at, -700)).tailLean).toBeCloseTo(-700)
    expect(lift.drag(lift.x, at.middle + 0.5).tailLean).toBe(0)
  })

  it('lays the stroke up to where the newest note is, with the ink it has left', () => {
    const notes = [{ id: 1, frequency: 220, gain: 0.7, age: 1, released: null }]
    const meters = { ink: 0.25, pressure: 0.6 }
    const signal = testSignal()
    const drawn = runDisplay(display, DRY_BRUSH_PARAMS, 2, { notes, meters, signal })
    let colour = ''
    const bars: number[][] = []
    for (const call of drawn.calls) {
      if (call.name === 'set fillStyle') colour = String(call.args[0])
      if (call.name === 'fillRect' && colour === PLAIN_COLOURS.accent)
        bars.push(call.args as number[])
    }
    expect(bars[0][3]).toBeCloseTo(0.25 * at.well.h, 1)
    expect(bars[1][0] + 1).toBeCloseTo(dryBrushX(at, 1, 0), 1)
  })
})
