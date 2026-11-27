// The truth of the Night Drum display: the overtones it draws against the
// compiled device at 48 kHz (where each stands, how loud it is through the body,
// how long it rings), the tension it moves them by, the skin and the body, and
// the two points that can be taken hold of.

import { describe, expect, it } from 'vitest'

import { NIGHT_DRUM_PARAMS } from '../../dsp/devices/night-drum.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { NIGHT_DRUM_FACES, nightNow } from '../components/displays/night-drum'
import {
  NIGHT_BODIES,
  NIGHT_HANDS,
  nightRadius,
  nightStroke,
} from '../components/displays/night-drum-law'
import {
  nightLayout,
  nightOnSkin,
  nightRelief,
  nightY,
} from '../components/displays/night-drum-picture'
import { displaySize, drawnPaths, runDisplay, viewOf } from './display-harness'

const RATE = 48000
const { display } = NIGHT_DRUM_FACES['night-drum']
type Name = keyof typeof NIGHT_DRUM_PARAMS
type Values = Partial<Record<Name, number>>
const readOf = (values: Values) => (name: string) =>
  values[name as Name] ?? NIGHT_DRUM_PARAMS[name as Name].default
/** One plain stroke: no roll, no chance, no second skin, no hand of its own, no bend. */
const PLAIN: Values = {
  roll: 0,
  scatter: 0,
  grain: 0,
  otherSkin: 0,
  bend: 0,
  swell: 0.01,
  width: 0,
}

/** One key held: the sound of the left side and the readings at the end. */
async function struck(values: Values, hz: number, seconds: number) {
  const loaded = await loadWasmDevice('night-drum', RATE)
  const { device } = loaded
  for (const [name, value] of Object.entries(values))
    loaded.set(NIGHT_DRUM_PARAMS[name as Name], value)
  device.device_note_on?.(1, hz, 0.7)
  const sound = new Float32Array(Math.round((seconds * RATE) / 32) * 32)
  for (let done = 0; done < sound.length; done += 32) {
    device.device_process(32)
    sound.set(loaded.view(device.device_out_left(), 32), done)
  }
  const [tension, level] = [0, 1].map((index) => device.device_meter?.(index) ?? 0)
  return { sound, tension, level }
}

/** How loud a tone is in a window of the sound, in dB, through a raised cosine squared. */
function toneDb(wave: Float32Array, hz: number, from = 0.02, seconds = 0.4): number {
  const [start, count] = [from, seconds].map((each) => Math.round(each * RATE))
  let [re, im] = [0, 0]
  for (let i = 0; i < count; i += 1) {
    const shade = Math.pow(Math.sin((Math.PI * (i + 0.5)) / count), 4)
    re += shade * wave[start + i] * Math.cos((2 * Math.PI * hz * i) / RATE)
    im += shade * wave[start + i] * Math.sin((2 * Math.PI * hz * i) / RATE)
  }
  return 20 * Math.log10(Math.hypot(re, im) / count + 1e-12)
}

describe('the overtones of night-drum', () => {
  it('names the hands and the bodies as the device does', () => {
    expect(NIGHT_HANDS.map(({ name }) => name)).toEqual(NIGHT_DRUM_PARAMS.hand.choices)
    expect(NIGHT_BODIES.map(({ name }) => name)).toEqual(NIGHT_DRUM_PARAMS.cavity.choices)
  })

  // With a whole load the modes of a harmonic are one tone, so their sum is what is heard.
  it.each([
    ['a finger on no body', { cavity: 4 }, 147],
    ['a finger on a frame, hard', { cavity: 0, touch: 0.8, place: 0.3 }, 110],
    ['a stick on no body', { cavity: 4, hand: 3, place: 0.8 }, 220],
    ['a small frame', { cavity: 0, cavityTune: 7, skin: 0.8 }, 147],
  ] as [string, Values, number][])('are as loud as they are drawn: %s', async (_, given, hz) => {
    const values: Values = { ...PLAIN, load: 1, offCentre: 0, ring: 12, damp: 0, ...given }
    const { sound } = await struck(values, hz, 0.5)
    const modes = nightStroke(readOf(values), hz, 0.7)
    const misses = [2, 3, 4, 5]
      .map((n) => {
        const met = modes.filter(({ ratio }) => Math.abs(ratio - n) < 0.01)
        // They die as they sound: each is read at the middle of the window.
        const sum = met.reduce((all, { level, ring }) => all + level * 10 ** (-0.66 / ring), 0)
        return [Math.abs(sum), toneDb(sound, hz * n)]
      })
      .filter(([sum]) => sum > 0.05)
      .map(([sum, heard]) => heard - 20 * Math.log10(sum))
    expect(Math.max(...misses) - Math.min(...misses)).toBeLessThan(4)
  })

  it.each([0, 0.2, 0.9])('stand where they are drawn, at a load of %s', async (load) => {
    const values: Values = { ...PLAIN, load, cavity: 0, offCentre: 0, ring: 12, damp: 0, skin: 1 }
    const { sound } = await struck(values, 147, 1)
    const modes = nightStroke(readOf(values), 147, 0.7)
    for (const { ratio } of [modes[1], modes[3], modes[6]]) {
      const at = toneDb(sound, 147 * ratio, 0.02, 0.9)
      for (const off of [0.98, 1.02])
        expect(at - toneDb(sound, 147 * ratio * off, 0.02, 0.9)).toBeGreaterThan(6)
    }
  })

  it.each([0, 0.5])('ring as long as their ticks say, with a hand on them of %s', async (damp) => {
    const values: Values = { ...PLAIN, load: 1, offCentre: 0, cavity: 0, ring: 4, skin: 0.8, damp }
    const { sound } = await struck(values, 220, 2)
    const { ring } = nightStroke(readOf(values), 220, 0.7)[1]
    const fell = toneDb(sound, 440, 0.05) - toneDb(sound, 440, 0.05 + ring / 6)
    expect(Math.abs(fell - 10)).toBeLessThan(1)
  })

  it('are moved by the tension the device reports, which falls back', async () => {
    const bent: Values = { ...PLAIN, bend: 6, fall: 0.5 }
    const early = await struck(bent, 147, 0.06)
    expect(early.tension).toBeGreaterThan(1)
    expect((await struck(bent, 147, 2)).tension).toBeLessThan(0.2)
    const notes = [{ id: 1, frequency: 146.83, gain: 0.7, age: 0.06, released: null }]
    const meters = { tension: early.tension, level: early.level }
    const drawn = runDisplay(display, NIGHT_DRUM_PARAMS, 0.3, { values: bent, notes, meters })
    expect(drawn.words()).toContain(`+${early.tension.toFixed(1)} st  D3`)
    const { ladder } = nightLayout(displaySize(display))
    const y = nightY(2 ** (early.tension / 12), ladder)
    const lit = drawnPaths(drawn)
      .filter(({ kind, colour }) => kind === 'stroke' && colour === PLAIN_COLOURS.accent)
      .filter(({ points }) => points.length === 2 && Math.abs(points[0][1] - y) < 0.01)
    expect(lit).toHaveLength(1)
  })
})

describe('the drawing of night-drum', () => {
  it('holds the rim of the skin still and gives every mode its share', () => {
    const modes = nightStroke(readOf({}), 147, 0.7)
    const sizes = nightNow(modes, 'wake', 0, 0.6)
    expect(Math.hypot(...sizes)).toBeCloseTo(0.6, 9)
    expect(Math.hypot(...nightNow(modes, 'wake', 20, 0.6))).toBeCloseTo(0.6, 9)
    const relief = nightRelief(sizes, modes, 0.1, 0)
    for (const turn of [0, 1, 2, 4])
      expect(relief(Math.cos(turn), Math.sin(turn))).toBeCloseTo(0, 4)
    expect(Math.abs(relief(0, 0))).toBeGreaterThan(0.05)
  })

  it('has a point for Load and one for Place, where they stand for them', () => {
    for (const values of [{}, { load: 0.2, offCentre: 0.9, place: 0.9 }] as Values[]) {
      const view = viewOf(display, NIGHT_DRUM_PARAMS, { values })
      const [load, place] = display.handles?.(view) ?? []
      expect(load.drag(load.x, load.y).load).toBeCloseTo(view.value('load'), 6)
      expect(load.wheel?.(1).offCentre).toBeCloseTo(Math.min(1, view.value('offCentre') + 0.05), 6)
      expect(place.x).toBeCloseTo(nightOnSkin(view, nightRadius(view.value('place')))[0], 6)
      expect(place.drag(...nightOnSkin(view, nightRadius(0.7))).place).toBeCloseTo(0.7, 6)
    }
  })
})
