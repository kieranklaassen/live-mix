// The truth of the Bronze Vowels display: the way of a word and how loud each
// partial is against the compiled device played at 48 kHz, the two points, and
// what is lit when.

import { describe, expect, it } from 'vitest'

import { BRONZE_VOWELS_PARAMS } from '../../dsp/devices/bronze-vowels.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import { BRONZE_VOWELS_FACES, bronzeLips } from '../components/displays/bronze-vowels'
import { bronzeLayout, bronzeWordX } from '../components/displays/bronze-vowels-layout'
import * as metals from '../components/displays/bronze-vowels-metal'
import * as mouths from '../components/displays/bronze-vowels-mouth'
import * as harness from './display-harness'

const RATE = 48000
const BLOCK = 32
const { display } = BRONZE_VOWELS_FACES['bronze-vowels']
type Name = keyof typeof BRONZE_VOWELS_PARAMS
type Values = Record<string, number>
const defaults: Values = Object.fromEntries(
  Object.entries(BRONZE_VOWELS_PARAMS).map(([name, spec]) => [name, spec.default]),
)

const settingsOf = (values: Values): metals.BronzeSettings =>
  metals.bronzeSettings((name) => ({ ...defaults, ...values })[name] ?? 0)

/** The device with these values and one key held; what it puts out, both sides added, and what it reports. */
async function played(values: Values, hz: number, gain: number) {
  const loaded = await loadWasmDevice('bronze-vowels', RATE)
  for (const [name, value] of Object.entries({ volume: -12, ...values }))
    loaded.set(BRONZE_VOWELS_PARAMS[name as Name], value)
  const { device } = loaded
  const { device_note_on: down, device_meter: meter } = device
  if (!down || !meter) throw new Error('takes no notes or reports nothing')
  down(1, hz, gain)
  let ran = 0
  return {
    meter,
    to: (seconds: number): Float32Array => {
      const out = new Float32Array(Math.max(0, Math.round((seconds * RATE) / BLOCK) * BLOCK - ran))
      for (let done = 0; done < out.length; done += BLOCK, ran += BLOCK) {
        device.device_process(BLOCK)
        const left = loaded.view(device.device_out_left(), BLOCK)
        const right = loaded.view(device.device_out_right(), BLOCK)
        for (let i = 0; i < BLOCK; i++) out[done + i] = left[i] + right[i]
      }
      return out
    },
  }
}

/** The level in dB of the tone at `hz`, through windows so short that the halves of a pair fall into one. */
function powerDb(wave: Float32Array, hz: number): number {
  const frames = Math.round(0.1 * RATE)
  let [sum, count] = [0, 0]
  for (let from = 0; from + frames <= wave.length; from += frames / 4, count++) {
    let [re, im] = [0, 0]
    for (let i = 0; i < frames; i++) {
      const shade = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / frames)
      re += shade * wave[from + i] * Math.cos((2 * Math.PI * hz * i) / RATE)
      im += shade * wave[from + i] * Math.sin((2 * Math.PI * hz * i) / RATE)
    }
    sum += (re * re + im * im) / (frames / 2) ** 2
  }
  return 10 * Math.log10(sum / count)
}

describe('the figures of Bronze Vowels', () => {
  it('says its ten words as the device does', async () => {
    for (const [i, hz] of [110, 261.63, 880]
      .flatMap((each) => [...Array(10)].map(() => each))
      .entries()) {
      const values = { word: i % 10, speak: 1.5, stagger: 0.8, contagion: 0 }
      const device = await played(values, hz, 0.7)
      for (const age of [0.2, 0.7, 1.3, 2.1, 3]) {
        device.to(age)
        const { f } = mouths.bronzeMouth(i % 10, mouths.bronzePosition(settingsOf(values), hz, age))
        const off = [0, 1].map((j) => Math.abs(Math.log2(device.meter(j)) - f[j]))
        expect(Math.max(...off), `word ${i % 10} on ${hz} Hz at ${age} s`).toBeLessThan(0.03)
      }
    }
  })

  it.each([0, 1, 2, 3, 4])('draws the partials of metal %i as loud as they are', async (metal) => {
    // A word that stands still for as long as it is listened to: oo, mm, ah.
    for (const word of [1, 2, 0]) {
      const values = { metal, word, stray: 0.5 + 0.2 * word, mallet: word, speak: 20, stagger: 0 }
      const all = { ...values, knock: 0, air: 0, width: 0, beat: 4, contagion: 0, sing: 0.5 }
      const set = settingsOf(all)
      const device = await played(all, 220, 0.8)
      device.to(2.9)
      const wave = device.to(3.9)
      const note = { frequency: 220, gain: 0.8, age: 3.4 }
      const mouth = mouths.bronzeMouth(word, mouths.bronzePosition(set, 220, 3.4))
      const levels = mouths.bronzeLevels(set, note, mouth)
      const pitches = metals.bronzePartials(set, 220)
      expect(pitches).toHaveLength(metals.BRONZE_PARTIALS)
      // What is not faint and has no neighbour within the window's reach.
      const alone = (hz: number) => pitches.filter((each) => Math.abs(each - hz) < 45).length === 1
      const heard = pitches.flatMap((hz, p) => {
        const drawn = 20 * Math.log10(levels[p])
        return drawn > -28 && alone(hz) ? [{ hz, off: drawn - powerDb(wave, hz), drawn }] : []
      })
      expect(heard.length).toBeGreaterThan(1)
      const main = heard.reduce((a, b) => (b.drawn > a.drawn ? b : a))
      for (const { hz, off } of heard)
        expect(Math.abs(off - main.off), `word ${word}: ${hz} Hz`).toBeLessThan(2)
    }
  })

  it('opens the mouth for ah, spreads it for ee, and shuts it', () => {
    const lips = (word: number, at: number) => bronzeLips(mouths.bronzeMouth(word, at))
    expect(lips(0, 0).gape).toBeGreaterThan(0.95)
    expect(lips(1, 1).wide).toBeGreaterThan(0.95)
    expect(lips(1, 0).wide).toBeLessThan(0.05)
    expect(lips(3, 0.5).gape).toBeLessThan(0.02)
    expect([0, 0.5, 1, 1.25, 2, 2.5].map(mouths.bronzeFold)).toEqual([0, 0.5, 1, 0.75, 0, 0.5])
  })
})

const handlesOf = (values: Values) =>
  display.handles?.(harness.viewOf(display, BRONZE_VOWELS_PARAMS, { values })) ?? []

describe('the picture of Bronze Vowels', () => {
  it('has a point in the valley of the mouth and one at the end of the word', () => {
    for (const word of [0, 1, 6]) {
      const [mouth, speak] = handlesOf({ word, clarity: 0.6 })
      const [moved] = handlesOf({ word, ...mouth.drag(mouth.x + 6, mouth.y - 3, {}) })
      expect([moved.x - mouth.x, moved.y - mouth.y].map(Math.round)).toEqual([6, -3])
      const said = speak.drag(speak.x + 20, speak.y).speak
      expect(said).toBeGreaterThan(3)
      expect(handlesOf({ word, speak: said })[1].x).toBeCloseTo(speak.x + 20, 5)
    }
  })

  it('lights what sounds, and a point for each bell at its place in the word', () => {
    const notes = harness.testNotes()
    const of = (level: number) => {
      const meters = { jaw: 500, tongue: 900, level }
      return harness.drawDisplay(display, BRONZE_VOWELS_PARAMS, { meters, notes })
    }
    const lit = (level: number) =>
      harness.drawnPaths(of(level)).filter((path) => path.colour === PLAIN_COLOURS.accent).length
    expect(lit(0)).toBe(0)
    expect(lit(0.08)).toBeGreaterThan(notes.length + 5)
    const set = settingsOf({})
    const { lane } = bronzeLayout(harness.displaySize(display))
    const arcs = of(0.08).calls.filter((call) => call.name === 'arc')
    for (const { frequency, age } of notes) {
      const x = bronzeWordX(
        mouths.bronzeFold(mouths.bronzePosition(set, frequency, age)),
        set.speak,
        lane,
      )
      expect(Math.min(...arcs.map(({ args }) => Math.abs(Number(args[0]) - x)))).toBeLessThan(0.01)
    }
  })
})
