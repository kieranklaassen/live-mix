// The truth of the Bent Blade display: its figures against the compiled device played at 48 kHz,
// what it draws of the device's readings, and its two points.

import { describe, expect, it } from 'vitest'

import { BENT_BLADE_PARAMS as PARAMS } from '../../dsp/devices/bent-blade.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import * as blade from '../components/displays/bent-blade'
import * as harness from './display-harness'

const RATE = 48000
const { display } = blade.BENT_BLADE_FACES['bent-blade']
const places = blade.bladePlaces(harness.displaySize(display))
type Name = keyof typeof PARAMS
type Values = Partial<Record<Name, number>>
/** A struck blade with nothing in it that moves by itself. */
const FIXED: Values = { rasp: 0, wander: 0, tremble: 0, glide: 0.01, swell: 0.003, steel: 0 }
const STILL: Values = { ...FIXED, exciter: 1, volume: -12 }
const knobs = (values: Values) => (name: string) =>
  values[name as Name] ?? PARAMS[name as Name].default

/** The device with these values, keys played in turn half a second apart: its readings and its sound. */
async function play(values: Values, seconds: number, keys = [220]) {
  const { device, set, view } = await loadWasmDevice('bent-blade', RATE)
  for (const [name, value] of Object.entries(values)) set(PARAMS[name as Name], value)
  const { device_note_on: down, device_meter: meter } = device
  if (!down || !meter) throw new Error('plays no notes or reports nothing')
  const read: Record<'t' | 'near' | 'far' | 'shake' | 'pitch', number>[] = []
  const wave: number[] = []
  for (let block = 0; block < (seconds * RATE) / 128; block++) {
    const turn = Math.round(block / 188)
    if (block % 188 === 0 && turn < keys.length) down(turn + 1, keys[turn], 0.7)
    device.device_process(128)
    const sides = [device.device_out_left(), device.device_out_right()].map((at) => view(at, 128))
    for (let i = 0; i < 128; i++) wave.push(sides[0][i] + sides[1][i])
    const [near, far, shake, pitch] = [0, 1, 2, 3].map((index) => meter(index))
    read.push({ t: ((block + 1) * 128) / RATE, near, far, shake, pitch })
  }
  return { read, wave }
}

/** How strong the sine at `hz` is in a second of a sound, through a raised-cosine window. */
function tone(wave: readonly number[], hz: number, from = 0.1): number {
  let [re, im] = [0, 0]
  for (let i = 0; i < RATE; i++) {
    const shade = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / RATE)
    const sample = shade * (wave[Math.round(from * RATE) + i] ?? 0)
    re += sample * Math.cos((2 * Math.PI * hz * i) / RATE)
    im += sample * Math.sin((2 * Math.PI * hz * i) / RATE)
  }
  return Math.hypot(re, im)
}

describe('the figures of Bent Blade', () => {
  it('put the trapped notes where the device sounds them, drawn together or not', async () => {
    const bright: Values = { ...STILL, secondWell: 0, bend: 1, leak: 0.2, edge: 0.9 }
    for (const concord of [0, 1])
      for (const wellWidth of [0.2, 0.6]) {
        const values = { ...bright, concord, wellWidth }
        const { wave } = await play(values, 1.3)
        const { near, far } = blade.bladeRatios(knobs(values))
        expect(far).toEqual([])
        for (const ratio of near.slice(0, 5)) {
          const beside = Math.max(tone(wave, 220 * ratio * 1.03), tone(wave, 220 * ratio * 0.97))
          expect(tone(wave, 220 * ratio), `${ratio} at ${concord}`).toBeGreaterThan(3 * beside)
        }
      }
  })

  it('give how long the note rings, with the key down and no second bend', async () => {
    const mallet = { ...STILL, secondWell: 0, edge: 0 }
    const others: Values[] = [
      { leak: 0.7, bend: 0.2 },
      { exciter: 2, leak: 0.5, bend: 0.9 },
    ]
    for (const other of [{}, ...others]) {
      const values = { ...mallet, ...other }
      const { read } = await play(values, 2)
      const [early, late] = [0.5, 1].map((at) => read[Math.round((at * RATE) / 128)])
      const said = [early, late].map(({ t }) => blade.bladeTrade(knobs(values), 220, t)[0])
      const fell = Math.log(early.near / late.near)
      expect(fell / Math.log(said[0] / said[1])).toBeCloseTo(1, 1)
    }
  })

  it('pass the sound to the second bend and back as often as the device does', async () => {
    for (const secondWell of [1, 2, 3]) {
      const [tunnel, pace] = [0.7, [0, 1, 0.6, 1.5][secondWell]]
      const values = { ...STILL, secondWell, tunnel, leak: 0, bend: 0, edge: 0 }
      const { read } = await play(values, 3)
      const trade = (t: number): number[] => blade.bladeTrade(knobs(values), 220, t)
      // Each key tunnels up to 12 % faster or slower: where the second bend first has the most.
      const half = 0.5 / (tunnel * pace)
      expect(trade(0)[1]).toBe(0)
      expect(trade(half)[1] / trade(half)[0]).toBeCloseTo(5, 3)
      const first = read.filter(({ t }) => t < 1.5 * half)
      const most = first.reduce((a, b) => (b.far / b.near > a.far / a.near ? b : a))
      expect(Math.abs(most.t / half - 1)).toBeLessThan(0.15)
      expect(most.far / most.near).toBeGreaterThan(4)
    }
  })

  it('hold fewer notes in a shallow bend, and no more of the far one than Far Well asks', () => {
    expect(blade.bladeTrapped(0, 3)).toBeLessThan(0.01)
    expect(blade.bladeTrapped(1, 7)).toBeGreaterThan(0.9)
    const [shallow, deep] = [0, 1].map((bend) => blade.bladeLevels(knobs({ bend }))[4])
    expect(shallow).toBeLessThan(0.01 * deep)
    expect(blade.bladeHeard(knobs({ farWell: 0 }))).toEqual([1, 0])
    expect(blade.bladeHeard(knobs({ farWell: 1 }))[1]).toBe(1)
  })

  it('report the knee and the slide', async () => {
    const shaken = await play({ ...STILL, exciter: 0, tremble: 1, rate: 4 }, 3)
    expect(Math.max(...shaken.read.map(({ shake }) => shake))).toBeGreaterThan(0.9)
    expect(shaken.read.every(({ shake }) => Math.abs(shake) <= 1.01)).toBe(true)
    const slid = await play({ ...STILL, glide: 1, glideLaw: 0 }, 3, [220, 330])
    const pitches = slid.read.filter(({ t }) => t > 0.51).map(({ pitch }) => pitch)
    expect(pitches[0]).toBeLessThan(225)
    expect(pitches.at(-1)).toBeCloseTo(330, 0)
  })
})

describe('the drawing of Bent Blade', () => {
  it('lights the bend that has the sound, and scrolls the trade', () => {
    const lit = (near: number, far: number): number[] => {
      const meters = { near, far, shake: 0, pitch: 262 }
      const options = { meters, signal: harness.testSignal(), notes: harness.testNotes() }
      const paths = harness.drawnPaths(harness.runDisplay(display, PARAMS, 1, options))
      const { x, y, w, h } = places.blade
      const accent = paths.filter((path) => path.colour === PLAIN_COLOURS.accent)
      const glow = accent.filter((path) => path.kind === 'fill' && path.points[0]?.[1] < y + h)
      return glow.map(({ points }) => {
        const across = [...points].reverse()
        const thick = points.map((at, i) => Math.hypot(at[0] - across[i][0], at[1] - across[i][1]))
        return points[thick.indexOf(Math.max(...thick))][0] < x + w / 2 ? 0 : 1
      })
    }
    expect(lit(0.6, 0)).toEqual([0])
    expect(lit(0, 0.6)).toEqual([1])
    expect(lit(0.6, 0.6)).toEqual([0, 1])
    expect(harness.drawDisplay(display, PARAMS).words()).toEqual(['Bow', 'Twin'])
  })

  it('has a point at the tip that bends the blade and one that spaces its notes', () => {
    for (const secondWell of [0, 1, 2, 3]) {
      const points = (values: Values) =>
        blade.bladeHandles(harness.viewOf(display, PARAMS, { values: { secondWell, ...values } }))
      const [bend, width] = points({})
      for (const asked of [0.1, 0.5, 0.95]) {
        const [tip] = blade.bladeLine(asked, secondWell, places.blade)
        expect(bend.drag(tip.x, tip.y).bend).toBeCloseTo(asked, 6)
        const [, there] = points({ wellWidth: asked })
        expect(width.drag(0, there.y).wellWidth).toBeCloseTo(asked, 6)
      }
    }
    expect(blade.bladeOwn(1, 1)).toBeLessThan(1.2)
  })
})
