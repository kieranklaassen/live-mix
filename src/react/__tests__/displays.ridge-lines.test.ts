// The truth of the Ridge Lines display: the overtones it draws against the
// compiled device played at 48 kHz, its picture, and its two points.

import { describe, expect, it } from 'vitest'

import { RIDGE_LINES_PARAMS } from '../../dsp/devices/ridge-lines.gen'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS } from '../components/display-kit'
import {
  RIDGE_LINES_FACES,
  ridgeLayout,
  ridgeSun,
  ridgeTall,
  ridgeY,
} from '../components/displays/ridge-lines'
import {
  ridgeBand,
  ridgeOvertones,
  ridgeStill,
  type RidgeNote,
} from '../components/displays/ridge-lines-overtones'
import { ridgeSpeeds, type Ask } from '../components/displays/ridge-lines-rows'
import {
  displaySize,
  drawnPaths,
  runDisplay,
  testNotes,
  testSignal,
  viewOf,
} from './display-harness'

type Values = Partial<Record<keyof typeof RIDGE_LINES_PARAMS, number>>
const RATE = 48000
const HZ = 220
const { display } = RIDGE_LINES_FACES['ridge-lines']
const at = ridgeLayout(displaySize(display))
const specs: Readonly<Record<string, { default: number }>> = RIDGE_LINES_PARAMS
const asking =
  (values: Values): Ask =>
  (name) =>
    (values as Record<string, number>)[name] ?? specs[name].default

/** What the left ear hears of one held key, and what the device reports at the middle of `at`. */
async function played(values: Values, at: number) {
  const loaded = await loadWasmDevice('ridge-lines', RATE)
  for (const [name, spec] of Object.entries(RIDGE_LINES_PARAMS))
    loaded.set(spec, asking(values)(name))
  loaded.device.device_note_on?.(1, HZ, 0.7)
  const out = new Float32Array(Math.round(((at + 0.1) * RATE) / 128) * 128)
  let said = [0, 0, 0, 0]
  for (let done = 0; done < out.length; done += 128) {
    loaded.device.device_process(128)
    out.set(loaded.view(loaded.device.device_out_left(), 128), done)
    if (done < at * RATE) said = [0, 1, 2, 3].map((m) => loaded.device.device_meter?.(m) ?? NaN)
  }
  return { out, said }
}

/** How strong the sine at `hz` is in the 0.2 s up to the end. */
function tone(wave: Float32Array, hz: number): number {
  const frames = 0.2 * RATE
  let re = 0
  let im = 0
  for (let i = 0; i < frames; i++) {
    const n = wave.length - frames + i
    const sample = wave[n] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frames))
    re += sample * Math.cos((2 * Math.PI * hz * n) / RATE)
    im += sample * Math.sin((2 * Math.PI * hz * n) / RATE)
  }
  return Math.hypot(re, im)
}

const plain: Values = { company: 0, vibrato: 0, wind: 0, sustain: 1, attack: 0.2, travel: 0 }

/** The overtones the display draws of the note the device reports, and what the ear heard of it. */
async function both(values: Values) {
  const set = { ...plain, ...values }
  const { out, said } = await played(set, 3)
  const [hz, middle, far, level] = said
  const note: RidgeNote = { hz, gain: 0.7, level, struck: 0, turns: [middle, far] }
  const drawn = ridgeOvertones(asking(set), ridgeStill(asking(set), null), note, RATE)
  return { drawn, heard: Array.from({ length: 41 }, (_x, h) => (h > 0 ? tone(out, HZ * h) : 0)) }
}

describe('the overtones ridge-lines draws', () => {
  const cases: [string, Values][] = [
    ['cliffs before hills', {}],
    ['rows that slide under a low sun', { travel: 0.3, sun: 0.7 }],
    ['rock', { jag: 0.6 }],
    ['hills before pines', { near: 0, far: 1, repeats: 4 }],
    ['towers before cliffs in a box', { near: 3, far: 2, height: 0.8, body: 0.9 }],
    ['pines before cliffs, soft', { near: 1, far: 2, penumbra: 0.6, eyes: 0, ground: 0.1 }],
  ]
  it.each(cases)('are what the device plays: %s', async (_, values) => {
    const { drawn, heard } = await both(values)
    const [top, most] = [Math.max(...drawn.all), Math.max(...heard)]
    for (let h = 1; h <= 40; h++) {
      const db = 20 * Math.log10(drawn.all[h] / top)
      if (db > -42) expect(Math.abs(20 * Math.log10(heard[h] / most) - db)).toBeLessThan(0.5)
    }
  })

  it('lie on a band that moves as its row goes by', () => {
    const ask = asking({ height: 0.9, far: 2, repeats: 2 })
    expect(ridgeBand(ask, 110, 0, 0.8) / ridgeBand(ask, 110, 0, 0.05)).toBeGreaterThan(4)
    const peak = (turn: number): number => {
      const note: RidgeNote = { hz: 110, gain: 0.7, level: 1, struck: 0, turns: [turn, 0] }
      const { middle } = ridgeOvertones(ask, ridgeStill(ask, null), note, RATE)
      return middle.indexOf(Math.max(...middle.slice(2)))
    }
    expect(peak(0.8)).toBeGreaterThan(peak(0.05) + 4)
  })
})

describe('the rows of ridge-lines', () => {
  it('slide at the speed the device moves them', async () => {
    const values = { ...plain, travel: 0.5, parallax: 0.9 }
    const [from, to] = [await played(values, 1), await played(values, 2)]
    const moved = [1, 2].map((m) => to.said[m] - from.said[m])
    ridgeSpeeds(asking(values)).forEach((speed, row) => {
      const off = moved[row] - speed
      // A note has a pace of its own, within a fifth either way.
      expect(Math.abs(off - Math.round(off))).toBeLessThan(0.25 * Math.abs(speed))
    })
  })
})

describe('the picture of ridge-lines', () => {
  const live = { key: 261.63, middle: 0.4, far: 0.7, level: 0.8 }
  const sound = { notes: testNotes(1), signal: testSignal() }
  const run = (meters: Record<string, number>) =>
    runDisplay(display, RIDGE_LINES_PARAMS, 0.4, { ...sound, meters })

  it('is lit by the note the device reports, and says which', () => {
    expect(run(live).words()).toEqual(['Cliffs before hills', 'C4'])
    const accents = (drawn: ReturnType<typeof run>) =>
      drawnPaths(drawn).filter(
        (path) => path.colour === PLAIN_COLOURS.accent && path.width === 1.25,
      )
    expect(accents(run(live)).some((path) => path.points.length > 100)).toBe(true)
  })

  it('moves as the rows do, and its overtones fall with the note', () => {
    expect(run({ ...live, middle: 0.6 }).print()).not.toBe(run(live).print())
    expect(ridgeTall(0.7, at.over)).toBeGreaterThan(ridgeTall(0.07, at.over) + 6)
  })

  it('has two points that set Sun and Height where they stand', () => {
    const values = { sun: 0.4, height: 0.3, jag: 0.5 }
    const view = viewOf(display, RIDGE_LINES_PARAMS, { values })
    const [sun, height] = display.handles?.(view) ?? []
    expect(sun.drag(sun.x, sun.y).sun).toBeCloseTo(0.4, 6)
    expect(sun.drag(0, ridgeSun(1, at.scene)[1]).sun).toBe(1)
    expect(height.drag(height.x, height.y).height).toBeCloseTo(0.3, 6)
    // The crest of a round hill behind, as far over the near row as Height lifts it.
    expect(height.y).toBeCloseTo(ridgeY(asking(values), 1 - 0.2, at.scene), 6)
  })
})
