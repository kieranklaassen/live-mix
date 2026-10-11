// The truth of the displays of the instruments made of noise and chance: the
// figures a picture is drawn from are the devices' own, nothing is lit until a
// key is played, a key is lit for as long as its envelope lets it sound, and
// what a knob does to a key that sounds shows on it.

import { describe, expect, it, vi } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  AIR_INSTRUMENT_FACES,
  airEnvelope,
  airLight,
  atmosphereCeilingHz,
  atmosphereColour,
  atmosphereHum,
  atmosphereLean,
  atmosphereRate,
  atmosphereRing,
  atmosphereSeaHz,
  atmosphereSeaLevel,
  atmosphereSeaSwell,
  atmosphereSmearSeconds,
  atmosphereWindHz,
  atmosphereWindLevel,
  atmosphereWindQ,
  bandReach,
  chance,
  chimeBright,
  chimeFits,
  chimePan,
  chimeRoot,
  cricketRest,
  drift,
  outdoorsAirHz,
  outdoorsCount,
  outdoorsNear,
  outdoorsPan,
  outdoorsPitch,
  outdoorsRate,
  thesisBend,
  thesisBreath,
  thesisChord,
  thesisEnvelope,
  thesisMid,
  thesisPeak,
  thesisQ,
  thesisScale,
  thesisSpread,
  thesisWidener,
  thunderNearness,
  thunderUnlike,
} from '../components/displays/instrument-air'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  stockDescriptors,
  viewOf,
  type DrawnPath,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent } = PLAIN_COLOURS

/** The size of the display on an upright plate. */
const WIDTH = 204
const HEIGHT = 100

const note = (frequency: number, age: number, released: number | null = null): DisplayNote => ({
  id: Math.round(frequency),
  frequency,
  gain: 1,
  age,
  released,
})
/** All that was laid in the accent: the light on what sounds. */
const lights = (paths: DrawnPath[]): DrawnPath[] => paths.filter((path) => path.colour === accent)
/** The lines among them. */
const strokes = (paths: DrawnPath[]): DrawnPath[] =>
  lights(paths).filter((path) => path.kind === 'stroke' && path.points.length > 1)
const mean = (numbers: number[]): number =>
  numbers.reduce((sum, value) => sum + value, 0) / numbers.length
const ys = (paths: DrawnPath[]): number[] => paths.flatMap((path) => path.points.map(([, y]) => y))
const db = (gain: number): number => 20 * Math.log10(gain)

describe('what the three share', () => {
  it('rise and fall as `Adsr` does with full sustain', () => {
    // `kit/env.h`: the attack aims at 1.3 so that it is at 1 when its time is up.
    expect(airEnvelope(0, null, 0.5, 2)).toBe(0)
    expect(airEnvelope(0.25, null, 0.5, 2)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 6)
    expect(airEnvelope(0.5, null, 0.5, 2)).toBe(1)
    expect(airEnvelope(9, null, 0.5, 2)).toBe(1)
    // The release falls 60 dB in its time, and is over under 1e-5.
    expect(airEnvelope(3, 1, 0.5, 2)).toBeCloseTo(Math.pow(10, -1.5), 6)
    expect(airEnvelope(3, 2, 0.5, 2)).toBeCloseTo(0.001, 6)
    expect(airEnvelope(9, 4, 0.5, 2)).toBe(0)
    // A key let go while it still rose falls from where it stood.
    expect(airEnvelope(2.25, 2, 0.5, 2)).toBeCloseTo(airEnvelope(0.25, null, 0.5, 2) * 0.001, 6)
  })

  it('light a key by its level, and through the release in one straight fall', () => {
    expect(airLight(0.25, null, 0.5, 2)).toBe(airEnvelope(0.25, null, 0.5, 2))
    expect(airLight(3, 1, 0.5, 2)).toBeCloseTo(0.5, 6)
    expect(airLight(3, 2, 0.5, 2)).toBe(0)
  })

  it('put a mark of chance in the same place every time', () => {
    expect(chance(7, 3)).toBe(chance(7, 3))
    expect(chance(7, 3)).not.toBe(chance(7, 4))
    for (let i = 0; i < 50; i++) {
      expect(chance(1, i)).toBeGreaterThanOrEqual(0)
      expect(chance(1, i)).toBeLessThan(1)
    }
  })

  it('draw the same picture for the same frame, whatever the clock says and without a throw of the dice', () => {
    const dice = vi.spyOn(Math, 'random')
    const notes = [note(220, 3), note(330, 1.5, 0.5), note(523.25, 0.2)]
    for (const id of ['atmosphere', 'outdoors', 'thesis']) {
      const { display } = AIR_INSTRUMENT_FACES[id]
      for (let type = 0; type < 6; type++) {
        // Thesis has no Type: its four modes are gone through in its place.
        const values = { type, mode: type % 4, density: 0.8, movement: 1, strum: 60 }
        const print = (now: number) =>
          drawDisplay(display, paramsOf(id), {
            values,
            notes,
            now,
            width: WIDTH,
            height: HEIGHT,
          }).print()
        expect(print(10)).toBe(print(10))
        expect(print(73.21)).toBe(print(10))
      }
    }
    expect(dice).not.toHaveBeenCalled()
    dice.mockRestore()
  })

  it('show of a band what stands within 12 dB of a full one’s peak', () => {
    expect(bandReach(2.5, 0.25)).toBe(0)
    // At that many octaves from its centre the band is down to a quarter.
    const octaves = bandReach(2.5, 1)
    const r = Math.pow(2, octaves)
    expect(1 / Math.sqrt(1 + 2.5 * 2.5 * (r - 1 / r) * (r - 1 / r))).toBeCloseTo(0.25, 6)
    expect(bandReach(25, 1)).toBeLessThan(octaves)
  })
})

describe('the atmosphere’s figures', () => {
  it('take colour and rate from `Atmosphere::survey`', () => {
    const tables = [
      [180, 16, 0.04, 20],
      [1200, 6, 3, 200],
      [350, 8, 0.08, 2.5],
      [900, 6, 0.6, 80],
      [2000, 4, 0.3, 100],
    ]
    tables.forEach(([hz, span, rate, more], kind) => {
      expect(atmosphereColour(kind, 0)).toBeCloseTo(hz, 6)
      expect(atmosphereColour(kind, 1)).toBeCloseTo(hz * span, 6)
      expect(atmosphereColour(kind, 0.5)).toBeCloseTo(hz * Math.sqrt(span), 6)
      expect(atmosphereRate(kind, 0)).toBeCloseTo(rate, 6)
      expect(atmosphereRate(kind, 1)).toBeCloseTo(rate * more, 6)
    })
    // Hum: a ceiling from 150 Hz to 6 kHz, and no events.
    expect(atmosphereColour(5, 0)).toBeCloseTo(150, 6)
    expect(atmosphereColour(5, 1)).toBeCloseTo(6000, 6)
    expect(atmosphereRate(5, 1)).toBe(0)
  })

  it('lean the colour half an octave for each octave of key, as `note_on` does', () => {
    expect(atmosphereLean(220)).toBe(1)
    expect(atmosphereLean(880)).toBeCloseTo(2, 6)
    expect(atmosphereLean(55)).toBeCloseTo(0.5, 6)
    expect(atmosphereLean(20)).toBe(0.35)
    expect(atmosphereLean(12000)).toBe(2.8)
  })

  it('close the low-pass of distance with Size, and smear with it', () => {
    expect(atmosphereCeilingHz(0)).toBe(20000)
    expect(atmosphereCeilingHz(1)).toBeCloseTo(1000, 6)
    expect(atmosphereCeilingHz(0.5)).toBeCloseTo(20000 * Math.sqrt(0.05), 6)
    expect(atmosphereSmearSeconds(0)).toBe(0)
    // 12.3 ms a turn, 0.65 of it kept at full Size: 20 dB down after ln(0.1) / ln(0.65) turns.
    expect(atmosphereSmearSeconds(1)).toBeCloseTo((0.0123 * Math.log(0.1)) / Math.log(0.65), 6)
    expect(atmosphereSmearSeconds(0.5)).toBeLessThan(atmosphereSmearSeconds(1))
  })

  it('ring on the key with Resonance, except the wind', () => {
    expect(atmosphereRing(0, 1)).toBe(0)
    expect(atmosphereRing(1, 0)).toBe(0)
    // `kRingGain` 14 times the square of it, beside a dry part of 1 - 0.5 of it.
    expect(atmosphereRing(1, 1)).toBeCloseTo(14 / 14.5, 6)
    expect(atmosphereRing(3, 0.5)).toBeCloseTo(3.5 / 4.25, 6)
  })

  it('move the wind’s band with the gust as `Atmosphere::shape` does', () => {
    const colour = atmosphereColour(0, 0.5)
    expect(atmosphereWindHz(0.5, 0.5, 1, 0, 220)).toBeCloseTo(colour, 6)
    expect(atmosphereWindHz(1, 0.5, 1, 0, 220)).toBeCloseTo(colour * Math.pow(2, 0.8), 6)
    expect(atmosphereWindHz(0, 0.5, 0.5, 0, 220)).toBeCloseTo(colour * Math.pow(2, -0.4), 6)
    expect(atmosphereWindHz(0.5, 0.5, 1, 0, 880)).toBeCloseTo(colour * 2, 6)
    // Full Resonance puts it on the key, and leaves a tenth of the wander.
    expect(atmosphereWindHz(0.5, 0.5, 1, 1, 330)).toBeCloseTo(330, 6)
    expect(atmosphereWindHz(1, 0.5, 1, 1, 330)).toBeCloseTo(330 * Math.pow(2, 0.08), 6)
    expect(atmosphereWindQ(0)).toBeCloseTo(1.2, 6)
    expect(atmosphereWindQ(1)).toBeCloseTo(30, 6)
    expect(atmosphereWindLevel(0, 1)).toBe(0)
    expect(atmosphereWindLevel(0, 0.5)).toBe(0.5)
    expect(atmosphereWindLevel(1, 1)).toBe(1)
  })

  it('build and break a wave as `Atmosphere::shape` does', () => {
    expect(atmosphereSeaSwell(0)).toBeCloseTo(0, 6)
    // The crest is where phase^1.5 is a half.
    expect(atmosphereSeaSwell(Math.pow(0.5, 2 / 3))).toBeCloseTo(1, 6)
    expect(atmosphereSeaSwell(1)).toBeCloseTo(0, 6)
    const colour = atmosphereColour(2, 0.5)
    expect(atmosphereSeaHz(0, 0.5, 1, 220)).toBeCloseTo(colour, 6)
    expect(atmosphereSeaHz(1, 0.5, 1, 220)).toBeCloseTo(colour * Math.pow(2, 2.6), 6)
    expect(atmosphereSeaHz(1, 0.5, 0, 220)).toBeCloseTo(colour * Math.pow(2, 0.78), 6)
    expect(atmosphereSeaLevel(1, 1)).toBe(1)
    expect(atmosphereSeaLevel(0, 1)).toBeCloseTo(0.08, 6)
    expect(atmosphereSeaLevel(0, 0)).toBe(1)
  })

  it('give a hum its odd harmonics by Density, under a ceiling by Tone', () => {
    // The fundamental: only the ceiling takes of it.
    const x = 110 / atmosphereColour(5, 0.5)
    expect(atmosphereHum(0, 110, 0.5, 0.5, 0)).toBeCloseTo(1 / (1 + x * x), 6)
    // The third harmonic falls as n^-(2.6 - 2 Density).
    const third = (density: number) =>
      atmosphereHum(1, 110, density, 1, 0) / atmosphereHum(0, 110, density, 1, 0)
    const ceiling = (n: number) => 1 / (1 + Math.pow((n * 110) / 6000, 2))
    expect(third(0)).toBeCloseTo((Math.pow(3, -2.6) * ceiling(3)) / ceiling(1), 6)
    expect(third(1)).toBeCloseTo((Math.pow(3, -0.6) * ceiling(3)) / ceiling(1), 6)
    // Resonance keeps the fundamental and thins what lies over it.
    expect(atmosphereHum(0, 110, 0.5, 0.5, 1)).toBeCloseTo(atmosphereHum(0, 110, 0.5, 0.5, 0), 6)
    expect(atmosphereHum(1, 110, 0.5, 0.5, 1)).toBeLessThan(
      atmosphereHum(1, 110, 0.5, 0.5, 0) * 0.1,
    )
  })

  it('wander as `Drift` does: three sines that never meet', () => {
    expect(drift(0, 1)).toBeCloseTo(
      0.3 * Math.sin(2 * Math.PI * 0.33) + 0.2 * Math.sin(2 * Math.PI * 0.71),
      6,
    )
    expect(drift(0.25, 1)).toBeCloseTo(
      0.5 +
        0.3 * Math.sin(2 * Math.PI * (0.618034 * 0.25 + 0.33)) +
        0.2 * Math.sin(2 * Math.PI * (1.7320508 * 0.25 + 0.71)),
      6,
    )
    for (let t = 0; t < 40; t += 0.37) expect(Math.abs(drift(t, 0.3))).toBeLessThanOrEqual(1)
  })
})

describe('the atmosphere’s display', () => {
  const { display } = AIR_INSTRUMENT_FACES.atmosphere
  const params = paramsOf('atmosphere')
  const draw = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(drawDisplay(display, params, { values, notes, width: WIDTH, height: HEIGHT }))
  /** Where a pitch stands on the field: 20 Hz at its foot, 20 kHz at its top. */
  const field = { y: 16, h: HEIGHT - 8 - 12 - 9 }
  const yOfHz = (hz: number) => field.y + field.h * (1 - Math.log(hz / 20) / Math.log(1000))
  const octave = field.h / Math.log2(1000)
  /** The line down the middle of a key’s band of wind. */
  const windLine = (values: Record<string, number>, notes: DisplayNote[]) =>
    strokes(draw({ type: 0, ...values }, notes)).filter((path) => path.points.length > 8)

  it('lights nothing at rest, whatever the type', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    for (let type = 0; type < 6; type++) expect(lights(draw({ type }, []))).toHaveLength(0)
  })

  it('lights each key that sounds, in every type', () => {
    for (let type = 0; type < 6; type++) {
      expect(lights(draw({ type }, [note(220, 3)])).length).toBeGreaterThan(0)
    }
    expect(windLine({}, [note(220, 3)])).toHaveLength(1)
    expect(windLine({}, [note(220, 3), note(330, 3), note(440, 3)])).toHaveLength(3)
  })

  it('lights a key as strongly as its envelope has it, and puts it out when the release is over', () => {
    const values = { attack: 1, release: 4 }
    expect(windLine(values, [note(220, 3)])[0].alpha).toBeCloseTo(1, 6)
    expect(windLine(values, [note(220, 0.5)])[0].alpha).toBeCloseTo(airEnvelope(0.5, null, 1, 4), 6)
    expect(windLine(values, [note(220, 5, 2)])[0].alpha).toBeCloseTo(0.5, 6)
    expect(windLine(values, [note(220, 7, 4)])).toHaveLength(0)
    expect(lights(draw({ type: 1, ...values }, [note(220, 7, 4)]))).toHaveLength(0)
    // A longer Release keeps the same key lit.
    expect(windLine({ attack: 1, release: 8 }, [note(220, 7, 4)])).toHaveLength(1)
  })

  it('has no more keys lit than the device has voices', () => {
    const many = Array.from({ length: 11 }, (_, i) => note(110 * (i + 1), 3))
    expect(windLine({}, many)).toHaveLength(8)
  })

  it('leans a key’s wind half an octave for each octave of the key', () => {
    const at = (hz: number) =>
      mean(ys(windLine({ movement: 0, resonance: 0, tone: 0.5 }, [note(hz, 3)])))
    expect(at(220)).toBeCloseTo(yOfHz(atmosphereColour(0, 0.5)), 3)
    expect(at(220) - at(880)).toBeCloseTo(octave, 3)
  })

  it('draws the wind onto the key as Resonance makes it whistle', () => {
    const at = (hz: number) => mean(ys(windLine({ movement: 0, resonance: 1 }, [note(hz, 3)])))
    expect(at(220)).toBeCloseTo(yOfHz(220), 3)
    expect(at(880)).toBeCloseTo(yOfHz(880), 3)
  })

  it('makes the gusts deeper with Movement', () => {
    const swing = (movement: number) => {
      const line = ys(windLine({ movement, resonance: 0 }, [note(220, 3)]))
      return Math.max(...line) - Math.min(...line)
    }
    expect(swing(0)).toBeCloseTo(0, 6)
    expect(swing(1)).toBeGreaterThan(swing(0.3))
    expect(swing(0.3)).toBeGreaterThan(0.5)
  })

  it('puts a key’s rain an octave up for a key two octaves up, and thickens it with Density', () => {
    const drops = (hz: number, density: number) =>
      strokes(draw({ type: 1, resonance: 0, tone: 0.5, density }, [note(hz, 3)]))
    const middle = (hz: number) => mean(ys(drops(hz, 0.6)))
    expect(middle(220) - middle(880)).toBeGreaterThan(octave * 0.75)
    expect(middle(220) - middle(880)).toBeLessThan(octave * 1.25)
    const count = (density: number) =>
      drops(220, density).reduce((sum, path) => sum + path.points.length / 2, 0)
    // The field is a second long: about as many drops as fall in one.
    expect(count(0.3)).toBeGreaterThan(atmosphereRate(1, 0.3) * 0.7)
    expect(count(0.3)).toBeLessThanOrEqual(Math.ceil(atmosphereRate(1, 0.3)))
    expect(count(0.6)).toBeGreaterThan(count(0.3) * 2)
  })

  it('gives a hum more of its harmonics with Density', () => {
    const lines = (density: number) =>
      lights(draw({ type: 5, density, tone: 0.5, resonance: 0 }, [note(110, 3)])).length
    expect(lines(0)).toBe(2)
    expect(lines(1)).toBe(6)
  })

  it('stands its handle on the line where Size cuts, and a drag sets it', () => {
    for (const size of [0, 0.3, 0.8, 1]) {
      const view = viewOf(display, params, { values: { size }, width: WIDTH, height: HEIGHT })
      const [handle] = display.handles?.(view) ?? []
      expect(handle.y).toBeCloseTo(yOfHz(atmosphereCeilingHz(size)), 6)
      expect(handle.drag(handle.x, handle.y).size).toBeCloseTo(size, 6)
    }
    const view = viewOf(display, params, { values: { size: 0.5 }, width: WIDTH, height: HEIGHT })
    const [handle] = display.handles?.(view) ?? []
    // Down is a lower ceiling: a larger room.
    expect(handle.drag(handle.x, handle.y + 5).size).toBeGreaterThan(0.5)
    expect(handle.drag(handle.x, handle.y - 5).size).toBeLessThan(0.5)
  })

  it('keeps its handle clear of the two words over the field, upright and flat', () => {
    // At Size 0 the line is right under the words: the handle stands between them. In the
    // plate's type the longest word at the left is 42 px wide, the longest at the right 53.
    for (const width of [204, 128]) {
      const view = viewOf(display, params, { values: { size: 0 }, width, height: HEIGHT })
      const [handle] = display.handles?.(view) ?? []
      expect(handle.x - 4.25).toBeGreaterThan(5 + 42)
      expect(handle.x + 4.25).toBeLessThan(width - 4 - 53)
    }
  })
})

describe('the outdoors’ figures', () => {
  it('count the creatures of a key as each scene does', () => {
    // `Birds::control` and `Crickets::read`: 1 + floor(Density * 5 + 0.5); `Frogs::control`: of 4.
    expect([0, 0.09, 0.1, 0.5, 1].map((density) => outdoorsCount(0, density))).toEqual([
      1, 1, 2, 4, 6,
    ])
    expect(outdoorsCount(1, 1)).toBe(6)
    expect([0, 0.5, 1].map((density) => outdoorsCount(2, density))).toEqual([1, 3, 5])
    expect(outdoorsCount(3, 1)).toBe(0)
  })

  it('pace the stream, the thunder and the chimes as each scene does', () => {
    expect(outdoorsRate(3, 0)).toBeCloseTo(40, 6)
    expect(outdoorsRate(3, 1)).toBeCloseTo(2000, 6)
    expect(outdoorsRate(5, 0)).toBeCloseTo(0.15, 6)
    expect(outdoorsRate(5, 1)).toBeCloseTo(6, 6)
    // Thunder: a stroke every 60 s, down to every 10.
    expect(1 / outdoorsRate(4, 0)).toBeCloseTo(60, 6)
    expect(1 / outdoorsRate(4, 1)).toBeCloseTo(10, 6)
    expect(outdoorsRate(0, 1)).toBe(0)
  })

  it('lean a scene’s pitch to the key as `key_lean` does, and move it with Tone', () => {
    expect(outdoorsPitch(0, 261.63, 0.5)).toBeCloseTo(1, 6)
    expect(outdoorsPitch(0, 523.26, 0.5)).toBeCloseTo(Math.pow(2, 0.33), 6)
    // Birds go no further than half an octave, thunder a whole one.
    expect(outdoorsPitch(0, 261.63 * 16, 0.5)).toBeCloseTo(Math.pow(2, 0.5), 6)
    expect(outdoorsPitch(4, 261.63 / 16, 0.5)).toBeCloseTo(0.5, 6)
    expect(outdoorsPitch(0, 261.63, 1)).toBeCloseTo(Math.pow(2, 0.3), 6)
    expect(outdoorsPitch(3, 261.63, 0)).toBeCloseTo(Math.pow(2, -0.6), 6)
    // The chimes take their pitch from the key itself.
    expect(outdoorsPitch(5, 880, 1)).toBe(1)
  })

  it('seat the first creature near the middle and nearest, the rest off to a side and further', () => {
    for (let seed = 0; seed < 40; seed++) {
      expect(Math.abs(outdoorsPan(0, 0, seed))).toBeLessThanOrEqual(0.45)
      expect(Math.abs(outdoorsPan(1, 0, seed))).toBeLessThanOrEqual(0.4)
      expect(outdoorsNear(0, 0, seed)).toBe(1)
      for (let slot = 1; slot < 5; slot++) {
        const birds = Math.abs(outdoorsPan(0, slot, seed))
        expect(birds).toBeGreaterThanOrEqual(0.2)
        expect(birds).toBeLessThanOrEqual(1)
        const frogs = Math.abs(outdoorsPan(2, slot, seed))
        expect(frogs).toBeGreaterThanOrEqual(0.3)
        expect(frogs).toBeLessThanOrEqual(1)
        expect(outdoorsNear(0, slot, seed)).toBeGreaterThanOrEqual(0.16)
        expect(outdoorsNear(0, slot, seed)).toBeLessThanOrEqual(0.6)
        expect(outdoorsNear(2, slot, seed)).toBeGreaterThanOrEqual(0.25)
        expect(outdoorsNear(2, slot, seed)).toBeLessThanOrEqual(0.7)
        expect(outdoorsNear(1, slot, seed)).toBeLessThanOrEqual(0.6)
      }
      // The sixth cricket is the far field.
      expect(outdoorsNear(1, 5, seed)).toBeLessThanOrEqual(0.2)
    }
  })

  it('rest a cricket for the share of its time `Crickets::pulse` gives it', () => {
    expect(cricketRest(0)).toBeCloseTo(0.5 / 32, 6)
    expect(cricketRest(1)).toBeCloseTo(11.4 / 20.4, 6)
  })

  it('tune and hang the chimes as `chimes.h` does', () => {
    expect(chimeRoot(261.63)).toBe(261.63)
    expect(chimeRoot(3520)).toBe(1760)
    expect(chimeRoot(55)).toBe(110)
    expect([0, 1, 2, 3, 4, 5].map(chimePan)).toEqual(
      [-0.75, 0.15, -0.45, 0.45, -0.15, 0.75].map((pan) => expect.closeTo(pan, 6) as number),
    )
    expect(chimeBright(0)).toBeCloseTo(0.3, 6)
    expect(chimeBright(1)).toBeCloseTo(0.85, 6)
  })

  it('keep of a set of chimes what fits the chord that is held, as `Chimes::fits` does', () => {
    const all = (root: number, held: number[]) =>
      [0, 1, 2, 3, 4, 5].map((tube) => chimeFits(tube, root, held))
    expect(all(261.63, [261.63])).toEqual([true, true, true, true, true, true])
    // C and E held: the set on C keeps its root, fifth and octave, and its E.
    expect(all(261.63, [261.63, 329.63])).toEqual([true, false, true, true, false, true])
    // A held key fits in any octave.
    expect(all(261.63, [261.63, 220])).toEqual([true, false, false, true, true, true])
  })

  it('close the air’s low-pass with Distance as `Outdoors::aim_air` does', () => {
    expect(outdoorsAirHz(0)).toBe(20000)
    expect(outdoorsAirHz(0.5)).toBeCloseTo(20000 * Math.sqrt(0.1), 6)
    expect(outdoorsAirHz(1)).toBeCloseTo(2000, 6)
  })

  it('bring the thunder overhead as `Thunder::nearness` and `strike` do', () => {
    expect(thunderNearness(0)).toBe(1)
    expect(thunderNearness(0.15)).toBeCloseTo(0.5, 6)
    expect(thunderNearness(0.3)).toBe(0)
    expect(thunderNearness(1)).toBe(0)
    expect(thunderUnlike(0, 0)).toBe(0.25)
    expect(thunderUnlike(0.5, 0.4)).toBeCloseTo(0.575, 6)
    expect(thunderUnlike(1, 1)).toBe(0.85)
  })
})

describe('the outdoors’ display', () => {
  const { display } = AIR_INSTRUMENT_FACES.outdoors
  const params = paramsOf('outdoors')
  const draw = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(drawDisplay(display, params, { values, notes, width: WIDTH, height: HEIGHT }))
  /** The tubes of the chimes that are lit: the thick strokes. */
  const tubes = (values: Record<string, number>, notes: DisplayNote[]) =>
    strokes(draw({ type: 5, ...values }, notes)).filter((path) => path.width >= 2)

  it('lights nothing at rest, whatever the scene', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    for (let type = 0; type < 6; type++) expect(lights(draw({ type }, []))).toHaveLength(0)
  })

  it('lights as many birds for a key as Density gives it', () => {
    for (const density of [0, 0.5, 1]) {
      expect(lights(draw({ type: 0, density }, [note(261.63, 3)]))).toHaveLength(
        outdoorsCount(0, density),
      )
    }
    // Two keys have a flock each.
    expect(lights(draw({ type: 0, density: 1 }, [note(261.63, 3), note(392, 3)]))).toHaveLength(12)
  })

  it('lights a key as strongly as its envelope has it, and puts it out when the release is over', () => {
    const values = { type: 0, density: 0, distance: 0, attack: 1, release: 4 }
    const bird = (notes: DisplayNote[]) => lights(draw(values, notes))
    const full = bird([note(261.63, 3)])[0].alpha
    expect(bird([note(261.63, 0.5)])[0].alpha).toBeCloseTo(full * airEnvelope(0.5, null, 1, 4), 6)
    expect(bird([note(261.63, 5, 2)])[0].alpha).toBeCloseTo(full * 0.5, 6)
    expect(bird([note(261.63, 7, 4)])).toHaveLength(0)
    for (let type = 1; type < 6; type++) {
      expect(lights(draw({ type }, [note(261.63, 3)])).length).toBeGreaterThan(0)
      expect(lights(draw({ type, release: 4 }, [note(261.63, 7, 4)]))).toHaveLength(0)
    }
  })

  it('moves the scene back with Distance', () => {
    // The nearest bird is drawn last, over the others.
    const nearest = (distance: number) => {
      const birds = lights(draw({ type: 0, density: 1, distance }, [note(261.63, 3)]))
      return birds[birds.length - 1]
    }
    expect(nearest(1).points[0][1]).toBeLessThan(nearest(0.4).points[0][1] - 5)
    expect(nearest(0.4).points[0][1]).toBeLessThan(nearest(0).points[0][1] - 5)
    // And what is far is paler.
    expect(nearest(1).alpha).toBeLessThan(nearest(0).alpha)
  })

  it('hangs a set of six chimes for one key, and keeps of each set what fits a chord', () => {
    expect(tubes({}, [note(261.63, 3)])).toHaveLength(6)
    // C, E and G: the set on C keeps four tubes, on E its three, on G four.
    expect(tubes({}, [note(261.63, 3), note(329.63, 3), note(392, 3)])).toHaveLength(11)
  })

  it('spreads the chimes as wide as Width, a longer tube for a lower one', () => {
    const xs = (width: number) =>
      tubes({ width }, [note(261.63, 3)]).map((path) => path.points[0][0])
    expect(Math.max(...xs(0)) - Math.min(...xs(0))).toBeCloseTo(0, 6)
    const half = (WIDTH - 10) / 2 - 12
    expect(Math.max(...xs(1)) - Math.min(...xs(1))).toBeCloseTo(1.5 * half, 6)
    expect(Math.max(...xs(0.5)) - Math.min(...xs(0.5))).toBeCloseTo(0.75 * half, 6)
    const long = tubes({}, [note(261.63, 3)]).map((path) => path.points[1][1] - path.points[0][1])
    // The tubes are drawn in the order of their pitch.
    for (let tube = 1; tube < 6; tube++) expect(long[tube]).toBeLessThan(long[tube - 1])
  })

  it('says where the air cuts for the Distance, where there is room for it', () => {
    const words = (distance: number, width: number) =>
      drawDisplay(display, params, { values: { distance }, width, height: HEIGHT }).words()
    expect(words(0, WIDTH)).toContain('air 20 kHz')
    expect(words(0.5, WIDTH)).toContain('air 6.3 kHz')
    expect(words(1, WIDTH)).toContain('air 2 kHz')
    // Flat there are only the scene and its count.
    expect(words(0.5, 128).filter((word) => word.startsWith('air'))).toHaveLength(0)
  })

  it('runs the rush of a stream as wide as Width, the same to both sides', () => {
    // The lines of the rush are the long ones in the ink that run from left to right under the horizon.
    const ends = (width: number) => {
      const lines = drawnPaths(
        drawDisplay(display, params, { values: { type: 3, width }, width: WIDTH, height: HEIGHT }),
      ).filter(
        (path) =>
          path.kind === 'stroke' &&
          path.colour !== accent &&
          path.points.length > 4 &&
          path.points[0][1] > 40 &&
          path.points.every(([x], at, all) => at === 0 || x > all[at - 1][0]),
      )
      expect(lines).toHaveLength(3)
      const xs = lines.flatMap((path) => path.points.map(([x]) => x))
      return [Math.min(...xs), Math.max(...xs)]
    }
    const middle = WIDTH / 2
    const half = (WIDTH - 10) / 2 - 12
    const [left, right] = ends(1)
    // A point every 2 px: the last may fall short of the end by as much.
    expect(middle - left).toBeGreaterThan(half)
    expect(right - middle).toBeGreaterThan(half - 2)
    expect(middle - left - (right - middle)).toBeLessThanOrEqual(2)
    const [nearLeft, nearRight] = ends(0.5)
    expect(left - nearLeft).toBeCloseTo(-half / 2, 6)
    expect(Math.abs(right - nearRight - half / 2)).toBeLessThanOrEqual(2)
  })

  it('stands its handle where the scene begins, and a drag sets Distance', () => {
    let last = Infinity
    for (const distance of [0, 0.4, 1]) {
      const view = viewOf(display, params, { values: { distance }, width: WIDTH, height: HEIGHT })
      const [handle] = display.handles?.(view) ?? []
      expect(handle.drag(handle.x, handle.y).distance).toBeCloseTo(distance, 6)
      // Further off is further up the picture.
      expect(handle.y).toBeLessThan(last)
      last = handle.y
    }
    const view = viewOf(display, params, {
      values: { distance: 0.4 },
      width: WIDTH,
      height: HEIGHT,
    })
    const [handle] = display.handles?.(view) ?? []
    expect(handle.drag(handle.x, handle.y - 5).distance).toBeGreaterThan(0.4)
  })
})

describe('the thesis’ figures', () => {
  it('lay the scale out from C1 upwards as `rebuildScaleNotes` does', () => {
    // Six octaves from the root in the octave of C1: on C that ends on the B under C7.
    const major = thesisScale(0, 0)
    expect(major).toHaveLength(42)
    expect(major.slice(0, 8)).toEqual([24, 26, 28, 29, 31, 33, 35, 36])
    expect(major.at(-1)).toBe(95)
    expect(thesisScale(12, 0)).toHaveLength(72)
    expect(thesisScale(12, 1).at(-1)).toBe(96)
    expect(thesisScale(9, 0).slice(0, 6)).toEqual([24, 26, 28, 31, 33, 36])
    // With a root over C the device starts at the first root: the keys under it are left out.
    expect(thesisScale(0, 11)[0]).toBe(35)
    expect(thesisScale(1, 9).slice(0, 4)).toEqual([33, 35, 36, 38])
  })

  it('make a key six as `ThesisTransform::transform` does', () => {
    // G4 around D4 in C major: three steps up, so the mirror is three down, the octaflip
    // an octave down, the middle one step up and its mirror one down.
    expect(thesisChord(67, 62, 0, 0)).toEqual([67, 57, 55, 64, 60, 62])
    // G3, four steps under the centre: its octaflip goes up.
    expect(thesisChord(55, 62, 0, 0)).toEqual([55, 69, 67, 59, 65, 62])
    // On the centre nothing moves.
    expect(thesisChord(62, 62, 0, 0)).toEqual([62, 62, 62, 62, 62, 62])
    // A key and a centre between two keys of the scale take the lower.
    expect(thesisChord(61, 62, 0, 0)[0]).toBe(60)
    expect(thesisChord(67, 61, 0, 0)[5]).toBe(60)
    // What is reflected past the end of the scale stops at its end.
    expect(thesisChord(96, 48, 0, 0)[1]).toBe(24)
    // In a scale of five an octave is five steps.
    expect(thesisChord(67, 62, 9, 0)).toEqual([67, 57, 55, 64, 60, 62])
    expect(thesisChord(72, 62, 9, 0)[2]).toBe(60)
  })

  it('makes the chords the compiled `ThesisTransform.h` makes', () => {
    // Printed by the header itself, built on its own: scale, root, centre and key played,
    // then the six keys it gave. Every setting of the four was compared once (479 232 of them).
    const printed = [
      [10, 3, 55, 80, [80, 27, 68, 66, 42, 54]],
      [12, 1, 71, 127, [96, 46, 84, 83, 59, 71]],
      [9, 7, 48, 30, [31, 64, 43, 38, 57, 47]],
      [5, 4, 50, 64, [64, 36, 52, 57, 43, 50]],
      [11, 11, 60, 0, [35, 83, 47, 47, 71, 59]],
      [2, 9, 66, 45, [45, 86, 57, 56, 76, 65]],
      [6, 0, 62, 96, [95, 30, 83, 78, 47, 62]],
      [1, 9, 60, 33, [33, 88, 45, 47, 74, 60]],
    ] as const
    for (const [scale, root, centre, key, chord] of printed)
      expect(thesisChord(key, centre, scale, root)).toEqual(chord)
    // On C the scale ends on the B under C7: C7 played sounds as that B.
    expect(thesisChord(96, 62, 0, 0)[0]).toBe(95)
  })

  it('rise and fall in straight lines as `Thesis::Envelope` does', () => {
    expect(thesisEnvelope(0.25, null, 0.5, 2)).toBe(0.5)
    expect(thesisEnvelope(1, null, 0.5, 2)).toBe(1)
    expect(thesisEnvelope(2, 1, 0.5, 2)).toBe(0.5)
    expect(thesisEnvelope(3, 2, 0.5, 2)).toBe(0)
    // Let go halfway up, it falls from there at the same rate.
    expect(thesisEnvelope(1, 0.75, 0.5, 2)).toBeCloseTo(0.125, 6)
  })

  it('stop Resonance at 50, and trim the level with Width as the widener does', () => {
    expect(thesisQ(5)).toBe(5)
    expect(thesisQ(40)).toBe(40)
    expect(thesisQ(100)).toBe(50)
    expect(thesisMid(0)).toBeCloseTo(Math.SQRT2, 6)
    expect(thesisMid(50)).toBeCloseTo(1, 6)
    expect(thesisMid(75)).toBeCloseTo(1 / Math.sqrt(0.5 * (1 + 1.75 * 1.75)), 6)
    expect(thesisMid(100)).toBeCloseTo(1 / Math.sqrt(0.5 * 7.25), 6)
    expect(thesisSpread(50)).toBe(0)
    expect(thesisSpread(75)).toBe(0)
    expect(thesisSpread(87.5)).toBeCloseTo(0.5, 6)
    expect(thesisSpread(100)).toBe(1)
  })

  it('give a band its height: Q over max(1, Q / 10), over the root of the bands that sound', () => {
    expect(thesisPeak(40, 1)).toBeCloseTo(1, 6)
    expect(thesisPeak(100, 1)).toBeCloseTo(1, 6)
    expect(thesisPeak(5, 1)).toBeCloseTo(0.5, 6)
    expect(thesisPeak(40, 4)).toBeCloseTo(0.5, 6)
    expect(thesisPeak(40, 0)).toBeCloseTo(1, 6)
  })

  it('make of a band what the compiled `StereoWidener` makes of a sine at its pitch', () => {
    // Measured on the device's own widener at 48 kHz: pitch, Width, and the mean of the two sides' power.
    const measured: [number, number, number][] = [
      [55, 0, 1.034],
      [440, 0, 1.3477],
      [55, 50, 1],
      [440, 50, 1],
      [440, 75, 0.764],
      [880, 80, 0.6091],
      [440, 87.5, 0.4575],
      [110, 100, 0.544],
      [220, 100, 1.5036],
      [880, 100, 2.223],
      [1760, 100, 0.9538],
      [3520, 100, 2.3409],
    ]
    for (const [hz, width, gain] of measured)
      expect(Math.abs(db(thesisWidener(width, hz, 48000) / gain))).toBeLessThan(0.02)
    // Under the bass crossover Width trims less than the 3 dB it adds to the rest at 0.
    expect(thesisWidener(0, 55, 48000)).toBeLessThan(thesisMid(0) * 0.75)
    // Past 75 the stages are combs: an octave apart, one band is lifted and the next let down.
    expect(thesisWidener(100, 880, 48000) / thesisWidener(100, 1760, 48000)).toBeGreaterThan(2)
    expect(thesisWidener(100, 880, 48000)).toBeGreaterThan(thesisMid(100) * 4)
  })

  it('breathe and drift each band in its own turn, and pull every band a fifth up', () => {
    // The first band is at the top of its breath a quarter turn in: the LFO starts 0.05 in.
    expect(thesisBreath(0, 0.2 / 0.5, 0.5)).toBeCloseTo(1, 6)
    expect(thesisBreath(0, 0.7 / 0.5, 0.5)).toBeCloseTo(0.3, 6)
    // The fourth is half a turn from the first.
    expect(thesisBreath(3, 0.2 / 0.5, 0.5)).toBeCloseTo(0.3, 6)
    expect(thesisBend(2, 0, 0.2 / 0.5, 0.5)).toBeCloseTo(1.02, 6)
    expect(thesisBend(2, 3, 0.2 / 0.5, 0.5)).toBeCloseTo(0.98, 6)
    expect(thesisBend(3, 4, 1.234, 0.5)).toBe(1.5)
    expect(thesisBend(0, 2, 1.234, 0.5)).toBe(1)
    expect(thesisBend(1, 2, 1.234, 0.5)).toBe(1)
  })
})

describe('the thesis’ display', () => {
  const { display } = AIR_INSTRUMENT_FACES.thesis
  const params = paramsOf('thesis')
  const draw = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(drawDisplay(display, params, { values, notes, width: WIDTH, height: HEIGHT }))
  /** The field of the bands, and where a key stands across it: from key 22 to key 105. */
  const field = { x: 5, w: WIDTH - 10, foot: HEIGHT - 4 - 15 }
  const xOfKey = (key: number) => field.x + (field.w * (key - 22)) / 83
  const all = {
    mirrorEnabled: 1,
    octaflipEnabled: 1,
    middleEnabled: 1,
    mirrorMiddleEnabled: 1,
    centerEnabled: 1,
  }
  const none = {
    mirrorEnabled: 0,
    octaflipEnabled: 0,
    middleEnabled: 0,
    mirrorMiddleEnabled: 0,
    centerEnabled: 0,
  }
  /** The outline of the bands of the keys that sound: one path for each key. */
  const lit = (values: Record<string, number>, notes: DisplayNote[]) =>
    strokes(draw({ mode: 0, ...values }, notes))
  /** A band starts and ends on the foot of the field: how many a path holds. */
  const bands = (path: DrawnPath) =>
    path.points.filter(([, y]) => Math.abs(y - field.foot) < 1e-6).length / 2
  /** The top of each band of a path, lowest pitch first: where it is and how high. */
  const peaks = (path: DrawnPath): [number, number][] => {
    const tops: [number, number][] = []
    let from = 0
    path.points.forEach(([, y], at) => {
      if (at === from || Math.abs(y - field.foot) > 1e-6) return
      const band = path.points.slice(from, at + 1)
      const top = band.reduce((best, point) => (point[1] < best[1] ? point : best))
      tops.push([top[0], field.foot - top[1]])
      from = at + 1
    })
    return tops.sort((a, b) => a[0] - b[0])
  }
  const g4 = 392

  it('lights nothing at rest, whatever the mode', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    for (let mode = 0; mode < 4; mode++) expect(lights(draw({ mode }, []))).toHaveLength(0)
  })

  it('lights the bands of a key where the transform puts them', () => {
    const [path] = lit(all, [note(g4, 3)])
    expect(bands(path)).toBe(6)
    const xs = peaks(path).map(([x]) => x)
    const keys = [...thesisChord(67, 62, 0, 0)].sort((a, b) => a - b)
    keys.forEach((key, at) => expect(xs[at]).toBeCloseTo(xOfKey(key), 3))
    // Only the key itself with every switch off, and one more band for each switch.
    expect(bands(lit(none, [note(g4, 3)])[0])).toBe(1)
    expect(peaks(lit(none, [note(g4, 3)])[0])[0][0]).toBeCloseTo(xOfKey(67), 3)
    expect(bands(lit({ ...none, mirrorEnabled: 1 }, [note(g4, 3)])[0])).toBe(2)
    expect(bands(lit({ ...none, centerEnabled: 1, middleEnabled: 1 }, [note(g4, 3)])[0])).toBe(3)
    // One path for each key that sounds.
    expect(lit(all, [note(g4, 3), note(220, 3)])).toHaveLength(2)
  })

  it('moves the bands with the centre, the scale and the root', () => {
    const at = (values: Record<string, number>) =>
      peaks(lit({ ...none, mirrorEnabled: 1, ...values }, [note(g4, 3)])[0]).map(([x]) => x)
    const expected = (centre: number, scale: number, root: number) =>
      thesisChord(67, centre, scale, root)
        .slice(0, 2)
        .sort((a, b) => a - b)
        .map(xOfKey)
    at({ center: 55 }).forEach((x, i) => expect(x).toBeCloseTo(expected(55, 0, 0)[i], 3))
    at({ scale: 10 }).forEach((x, i) => expect(x).toBeCloseTo(expected(62, 10, 0)[i], 3))
    at({ root: 3 }).forEach((x, i) => expect(x).toBeCloseTo(expected(62, 0, 3)[i], 3))
  })

  it('lights a key as strongly as its envelope has it, and puts it out when the release is over', () => {
    const values = { attack: 1, release: 4 }
    expect(lit(values, [note(g4, 3)])[0].alpha).toBeCloseTo(1, 6)
    expect(lit(values, [note(g4, 0.25)])[0].alpha).toBeCloseTo(0.25, 6)
    expect(lit(values, [note(g4, 5, 2)])[0].alpha).toBeCloseTo(0.5, 6)
    expect(lit(values, [note(g4, 7, 4)])).toHaveLength(0)
    expect(lights(draw(values, [note(g4, 7, 4)]))).toHaveLength(0)
    expect(lit({ attack: 1, release: 8 }, [note(g4, 7, 4)])).toHaveLength(1)
  })

  it('lets the bands in one after the other under Strum, each a step lower as one more sounds', () => {
    const at = (age: number) => lit({ ...all, strum: 100 }, [note(g4, age)])[0]
    expect(bands(at(0.05))).toBe(1)
    expect(bands(at(0.25))).toBe(3)
    expect(bands(at(0.55))).toBe(6)
    expect(bands(lit({ ...all, strum: 0 }, [note(g4, 0.05)])[0])).toBe(6)
    // `Thesis::render` divides by the root of the bands that have entered.
    const high = (age: number) => Math.max(...peaks(at(age)).map(([, y]) => y))
    expect(high(0.05)).toBeGreaterThan(high(0.25))
    expect(high(0.25)).toBeGreaterThan(high(0.55))
  })

  it('marks at rest when each band comes under Strum: a tick for each that is on, band i after i times the knob', () => {
    /** The ticks stand at the right of the field under the mode, 40 px to a second: where each is. */
    const ticks = (values: Record<string, number>, width = WIDTH) =>
      drawnPaths(drawDisplay(display, params, { values, width, height: HEIGHT }))
        .filter(
          (path) =>
            path.kind === 'stroke' &&
            path.points.length > 0 &&
            path.points.every(([, y]) => y === 18 || y === 24),
        )
        .flatMap((path) => path.points.filter(([, y]) => y === 18).map(([x]) => x))
    const right = WIDTH - 5
    expect(ticks({ ...all, strum: 0 })).toEqual([])
    // 100 ms: 6 px from one to the next, the sixth half a second after the first.
    expect(ticks({ ...all, strum: 100 })).toEqual(
      [0, 1, 2, 3, 4, 5].map((band) => right - 30 + 6 * band + 0.5),
    )
    expect(ticks({ ...all, strum: 50 })).toEqual(
      [0, 1, 2, 3, 4, 5].map((band) => right - 30 + 3 * band + 0.5),
    )
    // A band that is off leaves its place empty: the others do not come sooner for it.
    expect(ticks({ ...none, mirrorEnabled: 1, centerEnabled: 1, strum: 100 })).toEqual(
      [0, 1, 5].map((band) => right - 30 + 6 * band + 0.5),
    )
    // At the 40 ms of a preset each tick still stands clear of the next: none is lost in another.
    const close = ticks({ ...all, strum: 40 })
    expect(close).toHaveLength(6)
    close.slice(1).forEach((x, at) => expect(x - close[at]).toBeGreaterThanOrEqual(2))
    // Flat they stand at its right in the same way, without the figure.
    expect(ticks({ ...all, strum: 100 }, 128)).toHaveLength(6)
    const words = (width: number) =>
      drawDisplay(display, params, { values: { strum: 80 }, width, height: HEIGHT }).words()
    expect(words(WIDTH)).toContain('80 ms')
    expect(words(128)).not.toContain('80 ms')
  })

  it('writes the name of the centre to the left of it when Strum has the right', () => {
    /** Where the name of the centre is written, and how it is set there. */
    const name = (values: Record<string, number>, width: number, word = 'B4') => {
      const { calls } = drawDisplay(display, params, { values, width, height: HEIGHT })
      const at = calls.findIndex((call) => call.name === 'fillText' && call.args[0] === word)
      const align = calls
        .slice(0, at)
        .reverse()
        .find((call) => call.name === 'set textAlign')
      return { x: calls[at].args[1] as number, align: align?.args[0] }
    }
    for (const width of [WIDTH, 128]) {
      const key = 5 + ((width - 10) * (71 - 22)) / 83
      const stays = name({ center: 71, strum: 0 }, width)
      expect(stays.align).toBe('left')
      expect(stays.x).toBeCloseTo(key + 7, 6)
      const moved = name({ center: 71, strum: 100 }, width)
      expect(moved.align).toBe('right')
      // The dashed line of the centre is on a whole pixel, at most one to the left of the handle.
      expect(moved.x).toBeLessThanOrEqual(key - 7)
      expect(moved.x).toBeGreaterThan(key - 8)
      // The ticks begin 30 px from the right: the name ends short of them.
      expect(moved.x).toBeLessThan(width - 5 - 30)
    }
    // A centre far from them keeps its name on the right.
    expect(name({ center: 60, strum: 100 }, WIDTH, 'C4').align).toBe('left')
  })

  it('makes a band lower and wider with less Resonance, and no narrower past 50', () => {
    const band = (resonance: number) => lit({ ...none, resonance }, [note(g4, 3)])[0]
    const wide = (path: DrawnPath) =>
      Math.max(...path.points.map(([x]) => x)) - Math.min(...path.points.map(([x]) => x))
    expect(wide(band(5))).toBeGreaterThan(wide(band(40)) * 2)
    expect(peaks(band(5))[0][1]).toBeLessThan(peaks(band(40))[0][1])
    expect(band(100).points).toEqual(band(50).points)
  })

  it('stands each band as tall as the widener leaves it at its own pitch', () => {
    const keys = [...thesisChord(67, 62, 0, 0)].sort((a, b) => a - b)
    const hz = (key: number) => 440 * Math.pow(2, (key - 69) / 12)
    /** The field is 64 px for 36 dB, and its top is 6 dB over one band the widener leaves be. */
    const tall = (level: number) => 64 * Math.min(1, Math.max(0, 1 + db(level / 2) / 36))
    for (const width of [0, 50, 75, 80, 100]) {
      const tops = peaks(lit({ ...all, resonance: 40, width }, [note(g4, 3)])[0])
      keys.forEach((key, at) =>
        expect(tops[at][1]).toBeCloseTo(
          tall(thesisPeak(40, 6) * thesisWidener(width, hz(key), 48000)),
          3,
        ),
      )
    }
    const heights = (width: number) =>
      peaks(lit({ ...all, width }, [note(g4, 3)])[0]).map(([, y]) => y)
    const spread = (width: number) => Math.max(...heights(width)) - Math.min(...heights(width))
    // At 50 the widener does nothing; past 75 its combs set the bands of one chord far apart.
    expect(spread(50)).toBeCloseTo(0, 6)
    expect(spread(100)).toBeGreaterThan(10)
    // At rest the same: the chord that waits for a key is drawn as it would sound.
    const still = (width: number) => {
      const [rest] = draw({ ...all, mode: 0, width }, []).filter(
        (path) => path.kind === 'stroke' && bands(path) === 6,
      )
      return peaks(rest).map(([, y]) => y)
    }
    expect(Math.max(...still(50)) - Math.min(...still(50))).toBeCloseTo(0, 6)
    expect(Math.max(...still(100)) - Math.min(...still(100))).toBeGreaterThan(10)
  })

  it('breathes each band in its own turn, and holds them level when the mode is Fixed', () => {
    const heights = (mode: number, age: number) =>
      peaks(lit({ ...all, mode, breatheRate: 0.5 }, [note(g4, age)])[0]).map(([, y]) => y)
    const fixed = heights(0, 0.4)
    expect(Math.max(...fixed) - Math.min(...fixed)).toBeCloseTo(0, 6)
    const breathing = heights(1, 0.4)
    // At this moment the first band is at the top of its breath, the fourth at the foot of it.
    expect(Math.max(...breathing)).toBeCloseTo(fixed[0], 6)
    expect(Math.max(...breathing) - Math.min(...breathing)).toBeGreaterThan(10)
    // Half a turn on they have changed places.
    expect(heights(1, 1.4)).not.toEqual(breathing)
  })

  it('takes every band a fifth up under Gravity, and wobbles it under Drift', () => {
    const x = (mode: number, age = 0.4) =>
      peaks(lit({ ...none, mode, breatheRate: 0.5 }, [note(g4, age)])[0])[0][0]
    const fifth = (field.w * 12 * Math.log2(1.5)) / 83
    expect(x(3) - x(0)).toBeCloseTo(fifth, 3)
    // A quarter turn in, Drift has the first band 2 % sharp; half a turn on, 2 % flat.
    const cents = (field.w * 12 * Math.log2(1.02)) / 83
    expect(x(2) - x(0)).toBeCloseTo(cents, 3)
    expect(x(2, 1.4) - x(0)).toBeCloseTo((field.w * 12 * Math.log2(0.98)) / 83, 3)
  })

  it('stands its handle on the Center Note, and a drag sets it', () => {
    for (const center of [48, 62, 71]) {
      const view = viewOf(display, params, { values: { center }, width: WIDTH, height: HEIGHT })
      const [handle] = display.handles?.(view) ?? []
      expect(handle.x).toBeCloseTo(xOfKey(center), 6)
      expect(handle.drag(handle.x, handle.y).center).toBe(center)
    }
    const view = viewOf(display, params, { values: { center: 62 }, width: WIDTH, height: HEIGHT })
    const [handle] = display.handles?.(view) ?? []
    // Right is up the scale of pitch, a key for every 2.3 px, and it stops at the knob's ends.
    expect(handle.drag(handle.x + field.w / 83, handle.y).center).toBe(63)
    expect(handle.drag(handle.x - (3 * field.w) / 83, handle.y).center).toBe(59)
    expect(handle.drag(0, handle.y).center).toBe(48)
    expect(handle.drag(WIDTH, handle.y).center).toBe(71)
  })

  it('puts every knob of the device in one section', () => {
    const { sections } = AIR_INSTRUMENT_FACES.thesis
    const named = (sections ?? []).flat()
    expect([...named].sort()).toEqual(Object.keys(params).sort())
    expect(new Set(named).size).toBe(named.length)
  })
})
