// What every plate display must do, checked for each one in `PLATE_FACES`:
// it belongs to a stock effect, reads parameters the device has, draws at any
// setting without a number the canvas cannot take, paints in the plate's own
// colours, follows the parameters it says it reads, and its handles stand on
// the display and set what they stand for. A display's own truth (its curve
// against the device's formula) is tested beside it, in `displays/<family>.test.ts`.

import { describe, expect, it } from 'vitest'

import { normalizeParam, type ParamSpec } from '../../core/params'
import { isChoiceParam } from '../components/control-math'
import { PLAIN_COLOURS, TEXT_LEAST } from '../components/display-kit'
import { PLATE_FACES } from '../components/displays'
import { type DisplayHandle } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  metersOf,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const colours = new Set<string>(Object.values(PLAIN_COLOURS))

/** Every parameter at one end of its range. */
function allAt(params: Readonly<Record<string, ParamSpec>>, end: 'min' | 'max') {
  return Object.fromEntries(Object.entries(params).map(([name, spec]) => [name, spec[end]]))
}

function expectSound(id: string, what: string, drawn: RecordingContext): void {
  for (const { name, value } of drawn.numbers())
    if (!Number.isFinite(value)) throw new Error(`${id} ${what}: ${name} was handed ${value}`)
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    // A word may stand back, but at this size it is never fainter than it can be read,
    // and never a fraction in one glyph, whose figures are half the type's size.
    if (call.name === 'fillText') {
      const words = String(call.args[0])
      expect(alpha, `${id} ${what}: how strongly "${words}" is drawn`).toBeGreaterThanOrEqual(
        TEXT_LEAST,
      )
      expect(words, `${id} ${what}: a fraction in one glyph`).not.toMatch(/[¼½¾⅓⅔⅛]/)
    }
    if (call.name === 'set fillStyle' || call.name === 'set strokeStyle') {
      const value = call.args[0]
      // A gradient is made of the plate's colours too; a plain colour must be one of the three.
      if (typeof value === 'string' && !colours.has(value))
        throw new Error(
          `${id} ${what}: paints in ${value}, which is not one of the plate's colours`,
        )
    }
    if (call.name === 'set font') {
      const font = String(call.args[0])
      const size = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1])
      expect(size, `${id} ${what}: type size in "${font}"`).toBeGreaterThanOrEqual(8)
      expect(font, `${id} ${what}: the plate's font`).toContain('sans-serif')
    }
  }
}

describe.each(Object.entries(PLATE_FACES))('the display of %s', (id, face) => {
  const descriptor = stock.get(id)
  const params = descriptor?.params ?? {}
  const names = Object.keys(params)
  const { display } = face
  const meters = metersOf(descriptor?.meters)

  it('belongs to a stock effect and reads parameters the device has', () => {
    expect(descriptor, `${id} is a stock device`).toBeDefined()
    expect(descriptor?.category).not.toBe('instrument')
    for (const name of display.params) expect(names, `${id} reads ${name}`).toContain(name)
    for (const name of face.face ?? []) expect(names, `${id} face ${name}`).toContain(name)
    for (const name of Object.keys(face.labels ?? {}))
      expect(names, `${id} labels ${name}`).toContain(name)
    expect(new Set(face.face).size, `${id} face has no knob twice`).toBe(face.face?.length ?? 0)
  })

  it('stands with as many knobs as its place leaves room for', () => {
    const room = display.place === 'strip' ? 4 : 2 * (display.columns ?? 2)
    expect(face.face, `${id} names its face knobs`).toBeDefined()
    expect(face.face?.length).toBe(Math.min(room, names.length))
    if (display.place === 'strip') expect(display.columns).toBeUndefined()
  })

  it('says in a sentence or two what it shows', () => {
    expect(display.info.length, display.info).toBeGreaterThanOrEqual(40)
    expect(display.info.length, display.info).toBeLessThanOrEqual(300)
    expect(display.info).toMatch(/\.$/)
    expect(display.info).not.toMatch(/[—–]| - /)
  })

  it('draws at any setting, at rest and running, in the colours of its plate', () => {
    const settings: [string, Record<string, number>][] = [
      ['at its defaults', {}],
      ['with everything down', allAt(params, 'min')],
      ['with everything up', allAt(params, 'max')],
    ]
    for (const name of display.params) {
      settings.push([`with ${name} down`, { [name]: params[name].min }])
      settings.push([`with ${name} up`, { [name]: params[name].max }])
    }
    for (const [what, values] of settings) {
      const still = drawDisplay(display, params, { values, meters })
      expect(still.marks(), `${id} ${what} draws something`).toBeGreaterThan(0)
      expectSound(id, what, still)
      const off = drawDisplay(display, params, { values, meters, powered: false })
      expectSound(id, `${what}, switched off`, off)
      if (display.live) {
        for (const reading of [0, -6, 0.5]) {
          const running = runDisplay(display, params, 0.5, {
            values,
            meters: metersOf(descriptor?.meters, reading),
            signal: testSignal(),
          })
          expect(running.marks(), `${id} ${what} draws while it runs`).toBeGreaterThan(0)
          expectSound(id, `${what}, running`, running)
        }
        // Silence, and a sound that is not a number, must not stop it.
        const silent = testSignal(0, 0)
        expectSound(
          id,
          `${what}, in silence`,
          runDisplay(display, params, 0.2, { values, meters, signal: silent }),
        )
      }
    }
  })

  it('draws to the size it is given, the wider strip of an opened plate too', () => {
    const size = displaySize(display)
    for (const [width, height] of [
      [size.width, size.height],
      [size.width * 2 + 37, size.height],
      [size.width, 100],
    ]) {
      const drawn = drawDisplay(display, params, { width, height, meters })
      expectSound(id, `at ${width} by ${height}`, drawn)
      const beyond = drawn
        .numbers()
        .filter(({ name }) => ['moveTo', 'lineTo', 'arc', 'fillText'].includes(name))
        .filter(({ value }) => value < -400 || value > width + 400)
      expect(beyond, `${id} at ${width} by ${height} keeps to its canvas`).toEqual([])
    }
  })

  it('follows every parameter it says it reads', () => {
    const picture = (values: Record<string, number>): string =>
      display.live
        ? runDisplay(display, params, 0.5, { values, meters, signal: testSignal() }).print()
        : drawDisplay(display, params, { values, meters }).print()
    // A parameter may show only beside another (a band's width when the band
    // has gain, a gain under a shelf and not under a low pass), so it is moved
    // with the rest at their defaults, all down and all up, and under each
    // choice of every parameter that is one.
    const grounds: Record<string, number>[] = [{}, allAt(params, 'min'), allAt(params, 'max')]
    for (const [choice, spec] of Object.entries(params)) {
      if (!isChoiceParam(spec)) continue
      for (let value = spec.min; value <= spec.max; value += 1) grounds.push({ [choice]: value })
    }
    for (const name of display.params) {
      const spec = params[name]
      const follows = grounds.some(
        (ground) =>
          new Set(
            [spec.min, spec.default, spec.max].map((value) =>
              picture({ ...ground, [name]: value }),
            ),
          ).size > 1,
      )
      expect(follows, `${id} looks different as ${name} moves`).toBe(true)
    }
  })

  it('has handles that stand on the display and set what they stand for', () => {
    if (!display.handles) return
    const size = displaySize(display)
    for (const values of [{}, allAt(params, 'min'), allAt(params, 'max')]) {
      const view = viewOf(display, params, { values })
      const handles: readonly DisplayHandle[] = display.handles(view)
      expect(handles.length, `${id} has handles`).toBeGreaterThan(0)
      expect(new Set(handles.map((handle) => handle.key)).size).toBe(handles.length)
      for (const handle of handles) {
        expect(handle.name.length, `${id} names ${handle.key}`).toBeGreaterThan(0)
        expect(handle.x, `${id} ${handle.key} x`).toBeGreaterThanOrEqual(-1)
        expect(handle.x, `${id} ${handle.key} x`).toBeLessThanOrEqual(size.width + 1)
        expect(handle.y, `${id} ${handle.key} y`).toBeGreaterThanOrEqual(-1)
        expect(handle.y, `${id} ${handle.key} y`).toBeLessThanOrEqual(size.height + 1)
        const sets: Readonly<Record<string, number>>[] = [
          handle.drag(handle.x, handle.y),
          handle.drag(0, 0),
          handle.drag(size.width, size.height),
          handle.drag(-50, size.height + 50),
          handle.drag(size.width / 2, size.height / 2),
        ]
        if (handle.wheel) sets.push(handle.wheel(1), handle.wheel(-1))
        if (handle.reset) sets.push(handle.reset())
        for (const set of sets) {
          expect(Object.keys(set).length, `${id} ${handle.key} sets something`).toBeGreaterThan(0)
          for (const [name, value] of Object.entries(set)) {
            expect(names, `${id} ${handle.key} sets ${name}`).toContain(name)
            expect(display.params, `${id} draws ${name}, which its handle sets`).toContain(name)
            expect(Number.isFinite(value), `${id} ${handle.key} sets ${name} to ${value}`).toBe(
              true,
            )
          }
        }
      }
    }
    // Taken and not moved, a handle leaves its parameters where they are.
    const view = viewOf(display, params)
    for (const handle of display.handles(view)) {
      for (const [name, value] of Object.entries(handle.drag(handle.x, handle.y))) {
        const spec = params[name]
        const clamped = Math.min(spec.max, Math.max(spec.min, value))
        expect(
          Math.abs(normalizeParam(spec, clamped) - view.at(name)),
          `${id} ${handle.key} holds ${name} still when it is taken`,
        ).toBeLessThan(0.03)
      }
    }
  })
})

describe('plate displays together', () => {
  it('are each on one device, and no two devices share a display', () => {
    const displays = Object.values(PLATE_FACES).map((face) => face.display)
    expect(new Set(displays).size).toBe(displays.length)
  })
})
