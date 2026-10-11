// The truth of the wire instruments' displays: the figures are the devices'
// own, worked out here by hand from their headers; a key is lit on the part
// it plays for as long as the device lets it sound; and what a knob does to
// a string that sounds shows on it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  WIRE_INSTRUMENT_FACES,
  lobeDb,
  magnetBeatHz,
  magnetBlow,
  magnetBoard,
  magnetBusPlace,
  magnetCentre,
  magnetContactSeconds,
  magnetCount,
  magnetDamp,
  magnetFed,
  magnetHeard,
  magnetPartialHz,
  magnetReach,
  magnetStiffness,
  magnetStrings,
  magnetStringsMean,
  magnetStruck,
  magnetStruckSeconds,
  magnetSweepSpan,
  magnetSwell,
  magnetSwollen,
  magnetTakenOver,
  magnetTop,
  magnetVelocity,
  partialDb,
  prepBeatHz,
  prepBuzzDepth,
  prepCornerHz,
  prepFreeShare,
  prepGap,
  prepHammer,
  prepKey,
  prepMoves,
  prepPartialSeconds,
  prepPlace,
  prepPlaced,
  prepRingSeconds,
  prepRow,
  prepStiffness,
  prepStrength,
  prepStretched,
  prepStringDb,
  prepStruckAgain,
  prepSwing,
  prepToneDb,
  prepToneHz,
  windAt,
  windAvailable,
  windBetweenLulls,
  windDrive,
  windHeardDb,
  windHum,
  windKeyLevel,
  windKeyLight,
  windLean,
  windPluck,
  windRingSeconds,
  windSpeed,
  windSteady,
  windStrings,
  windSway,
  windWakeSeconds,
} from '../components/displays/instrument-wires'
import { type DisplayNote, type DisplaySignal } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  type DrawnPath,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent } = PLAIN_COLOURS

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id: Math.round(frequency), frequency, gain, age, released })
/** The strokes laid in the accent: the light on the strings that sound. */
const lights = (paths: DrawnPath[]): DrawnPath[] =>
  paths.filter((path) => path.kind === 'stroke' && path.colour === accent && path.points.length > 1)
/** How far up a light reaches: the span of its points from foot to top, in px. */
const reach = (path: DrawnPath): number => {
  const ys = path.points.map(([, y]) => y)
  return Math.max(...ys) - Math.min(...ys)
}

describe('the magnet piano’s figures', () => {
  it('stretches the partials as a stiff string does', () => {
    expect(magnetStiffness(27.5)).toBeCloseTo(1e-4, 9)
    // (4186 / 27.5)^0.596 = e^(0.596 · 5.0253) = 19.99.
    expect(magnetStiffness(4186)).toBeCloseTo(2e-3, 5)
    expect(magnetPartialHz(220, 1)).toBeCloseTo(220, 9)
    // B = 1e-4 · 8^0.596 = 3.4533e-4; 1760 · sqrt(1.022101 / 1.000345) = 1779.04.
    expect(magnetPartialHz(220, 8)).toBeCloseTo(1779.04, 1)
  })

  it('feeds the first eight partials under 10 kHz and keeps twelve under 16 kHz', () => {
    expect(magnetTop(220)).toBe(8)
    expect(magnetCount(220)).toBe(12)
    // Three octaves above middle C the fourth partial is at 8454 Hz and the fifth past 10 kHz;
    // the seventh is at 15108 Hz and the eighth past 16 kHz.
    expect(magnetTop(2093)).toBe(4)
    expect(magnetCount(2093)).toBe(7)
  })

  it('widens the bell with Bright and keeps it at one power', () => {
    expect(magnetReach(0)).toBe(1)
    expect(magnetReach(0.25)).toBeCloseTo(1.75, 9)
    expect(magnetReach(1)).toBe(7)
    const fed = new Array<number>(12).fill(0)
    magnetFed(3, 1, 12, fed)
    expect(fed[2]).toBeCloseTo(1, 9)
    expect(fed.reduce((sum, level) => sum + level, 0)).toBeCloseTo(1, 9)
    // A reach of two: the neighbours at cos²(45°) = 0.5, and 1 / sqrt(1.5) evens the three.
    magnetFed(3, 2, 12, fed)
    expect(fed[2]).toBeCloseTo(0.8165, 4)
    expect(fed[1]).toBeCloseTo(0.4082, 4)
    expect(fed[3]).toBeCloseTo(0.4082, 4)
    expect(fed.reduce((sum, level) => sum + level * level, 0)).toBeCloseTo(1, 9)
  })

  it('turns the magnets back at the ends of the string', () => {
    expect(magnetCentre(3, 8)).toBe(3)
    expect(magnetCentre(11, 8)).toBe(8)
    // 1 − 3.5 = −2.5 is folded to 4.5; 7 + 3.5 = 10.5 is folded to 5.5.
    expect(magnetCentre(1, 8, 1, -1)).toBeCloseTo(4.5, 9)
    expect(magnetCentre(7, 8, 1, 1)).toBeCloseTo(5.5, 9)
    expect(magnetSweepSpan(3, 8, 0, [0, 0])).toEqual([3, 3])
    expect(magnetSweepSpan(3, 8, 1, [0, 0])).toEqual([1, 6.5])
  })

  it('swells a partial to within 3 dB in Bloom, a higher one sooner', () => {
    // 1 − e^−1.231 = 0.708.
    expect(magnetSwell(2, 3, 3, 2)).toBeCloseTo(0.708, 3)
    expect(magnetSwell(2, 3, 3, 2)).toBeCloseTo(Math.SQRT1_2, 2)
    // Four times as high: twice the pace, 1 − e^−2.462 = 0.9147.
    expect(magnetSwell(1, 4, 1, 1)).toBeCloseTo(0.9147, 4)
    expect(magnetSwell(0, 1, 1, 1)).toBe(0)
    expect(magnetVelocity(0)).toBe(0.25)
    expect(magnetVelocity(1)).toBe(1)
  })

  it('damps a key let go by 60 dB in Damper', () => {
    expect(magnetDamp(null, 0.5)).toBe(1)
    expect(magnetDamp(0.5, 0.5)).toBeCloseTo(0.001, 9)
    expect(magnetDamp(1, 4)).toBeCloseTo(Math.pow(10, -0.75), 9)
  })

  it('strikes as the felt does and lets the strike die', () => {
    // 0.55 / (1 + (220 / 3000)²) = 0.54706.
    expect(magnetBlow(1, 1, 220, 1)).toBeCloseTo(0.54706, 4)
    expect(magnetStruckSeconds(220, 1)).toBeCloseTo(7, 9)
    expect(magnetStruckSeconds(220, 4)).toBeCloseTo(2.3091, 3)
    expect(magnetStruckSeconds(27.5, 1)).toBe(14)
    expect(magnetStruckSeconds(3520, 1)).toBeCloseTo(1.75, 9)
    expect(magnetContactSeconds(220)).toBeCloseTo(0.0035, 9)
    expect(magnetContactSeconds(7040)).toBe(0.0015)
    expect(magnetStruck(1, 1, 220, 1, 7)).toBeCloseTo(0.00054706, 6)
    expect(magnetStruck(0, 1, 220, 1, 0.1)).toBe(0)
  })

  it('beats its three strings as far as Shimmer tunes them, never faster than 2.5 Hz', () => {
    // 1.1 · 220 · (2^(6 / 1200) − 1) = 0.8402.
    expect(magnetBeatHz(220, 1, 1)).toBeCloseTo(0.8402, 3)
    expect(magnetBeatHz(1760, 1, 1)).toBeCloseTo(2.5, 9)
    expect(magnetBeatHz(220, 1, 0)).toBe(0)
    expect(magnetStrings(0, 0.7)).toBeCloseTo(1, 9)
    expect(magnetStrings(0.5, 1)).toBeLessThan(1)
    // At full Width: sqrt(0.5 + 0.375² + 0.125²) / (0.7071 + 0.25) = 0.8464.
    expect(magnetStringsMean(1)).toBeCloseTo(0.8464, 4)
  })

  it('hears a matching partial on the sympathy bus, and the soundboard’s air', () => {
    expect(magnetBusPlace(440)).toBe(232)
    expect(magnetBusPlace(880)).toBe(280)
    expect(magnetHeard(232, 232)).toBe(1)
    expect(magnetHeard(232.5, 232.5)).toBeCloseTo(0.5, 9)
    expect(magnetHeard(232.5, 233)).toBeCloseTo(0.5, 9)
    expect(magnetHeard(232, 240)).toBe(0)
    // With no Body only the air is left: 1 / sqrt(1 + (1000 / 6000)²) = 0.9864.
    expect(magnetBoard(1000, 0)).toBeCloseTo(0.9864, 4)
  })

  it('gives a let-go key’s strings to a new key at its pitch', () => {
    expect(magnetTakenOver([note(220, 3, 1), note(220, 0.5)], 0)).toBe(true)
    // The second key went down while the first was still held: both sound.
    expect(magnetTakenOver([note(220, 3, 1), note(220, 2)], 0)).toBe(false)
    expect(magnetTakenOver([note(220, 3, 1), note(330, 0.5)], 0)).toBe(false)
    expect(magnetTakenOver([note(220, 3), note(220, 0.5)], 0)).toBe(false)
  })

  it('hands a string’s swell on to the key that takes it over', () => {
    const swollen = new Array<number>(12).fill(0)
    // One key held two seconds, the magnets on its third partial, Bloom 2 s: within 3 dB.
    magnetSwollen([note(220, 2)], 0, 3, 2, 1.5, swollen)
    expect(swollen[2]).toBeCloseTo(0.708, 3)
    // Let go after those two seconds and pressed again half a second later, half a second ago:
    // the damper (1.5 s) has left a tenth of it, 0.0708, and the magnets go on from there:
    // 1 − (1 − 0.0708) · e^−0.30775 = 0.3170. On still strings the key would stand at 0.2649.
    magnetSwollen([note(220, 3, 1), note(220, 0.5)], 1, 3, 2, 1.5, swollen)
    expect(swollen[2]).toBeCloseTo(0.317, 3)
    magnetSwollen([note(220, 0.5)], 0, 3, 2, 1.5, swollen)
    expect(swollen[2]).toBeCloseTo(0.2649, 3)
    // A key struck again while it is down is let go at that instant, and nothing is lost.
    magnetSwollen([note(220, 2, 0), note(220, 0)], 1, 3, 2, 1.5, swollen)
    expect(swollen[2]).toBeCloseTo(0.708, 3)
    // The softest key swells a quarter as far as the hardest: its 0.708 is 0.177 of a hard key's.
    magnetSwollen([note(220, 2, 0, 0), note(220, 0)], 1, 3, 2, 1.5, swollen)
    expect(swollen[2]).toBeCloseTo(0.177, 3)
    // A key that went down while the other was still held has strings of its own, and so has another pitch.
    magnetSwollen([note(220, 3, 0.2), note(220, 0.5)], 1, 3, 2, 1.5, swollen)
    expect(swollen[2]).toBeCloseTo(0.2649, 3)
    magnetSwollen([note(330, 3, 1), note(220, 0.5)], 1, 3, 2, 1.5, swollen)
    expect(swollen[2]).toBeCloseTo(0.2649, 3)
  })

  it('reads a partial on its own bin where a low string’s stand close', () => {
    // The analyser's window of 2048 samples, worked out sample by sample: 4.5 dB down a bin off,
    // 20.4 two bins off, 36.9 two and a half, and its first side lobe 58 dB down past three.
    expect(lobeDb(0)).toBe(0)
    expect(lobeDb(1)).toBeCloseTo(-4.5, 9)
    expect(lobeDb(-2)).toBeCloseTo(-20.4, 9)
    expect(lobeDb(1.75)).toBeCloseTo(-15.5, 9)
    expect(lobeDb(5)).toBe(-60)
    // Bin i holds −i dB, so the answer says which bins were read.
    const bins = Float32Array.from({ length: 64 }, (_, i) => -i)
    expect(partialDb(bins, 20, 200, 200)).toBe(-9)
    expect(partialDb(bins, 20, 200, 100)).toBe(-10)
    expect(partialDb(bins, 20, 5, 200)).toBe(-Infinity)
    expect(partialDb(bins, 20, 1270, 200)).toBe(-Infinity)
  })
})

describe('the magnet piano’s display', () => {
  const { display } = WIRE_INSTRUMENT_FACES['magnet-piano']
  const params = paramsOf('magnet-piano')
  /** The magnets over one partial alone, no hammer, no sweep, no other strings to answer. */
  const plain = { bright: 0, hammer: 0, sweep: 0, sympathy: 0, shimmer: 0 }
  const drawn = (values: Record<string, number>, notes: DisplayNote[]): DrawnPath[] =>
    lights(drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() })))
  /** The string of a key as it stands: the outline with the most points. */
  const lens = (paths: DrawnPath[]): DrawnPath =>
    paths.reduce((most, path) => (path.points.length > most.points.length ? path : most))
  /** The loops an outline stands in: the crests along its upper edge. */
  const loops = (path: DrawnPath): number => {
    const top = path.points.slice(0, Math.ceil(path.points.length / 2)).map(([, y]) => y)
    let crests = 0
    for (let k = 1; k < top.length - 1; k++)
      if (top[k] < top[k - 1] - 1e-6 && top[k] <= top[k + 1]) crests++
    return crests
  }

  it('lights nothing while no key sounds', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(drawn({}, [])).toHaveLength(0)
  })

  it('stands a held key in the loops of the partial the magnets feed', () => {
    for (const harmonic of [1, 3, 5, 8])
      expect(loops(lens(drawn({ ...plain, harmonic }, [note(220, 3)])))).toBe(harmonic)
  })

  it('swells a key over Bloom', () => {
    const early = lens(drawn({ ...plain, harmonic: 2, bloom: 4 }, [note(220, 0.5)]))
    const late = lens(drawn({ ...plain, harmonic: 2, bloom: 4 }, [note(220, 8)]))
    expect(reach(late)).toBeGreaterThan(reach(early) + 2)
    // A short Bloom has it there at once.
    const quick = lens(drawn({ ...plain, harmonic: 2, bloom: 0.1 }, [note(220, 0.5)]))
    expect(reach(quick)).toBeGreaterThan(reach(early) + 2)
  })

  it('puts a let-go key out as fast as Damper', () => {
    expect(drawn({ ...plain, damper: 0.5 }, [note(220, 5, 0.2)]).length).toBeGreaterThan(0)
    expect(drawn({ ...plain, damper: 0.5 }, [note(220, 5, 2)])).toHaveLength(0)
    expect(drawn({ ...plain, damper: 6 }, [note(220, 5, 2)]).length).toBeGreaterThan(0)
  })

  it('goes on from where the strings stand when a key is pressed again', () => {
    const slow = { ...plain, harmonic: 2, bloom: 4 }
    const first = lens(drawn(slow, [note(220, 8)]))
    const again = lens(drawn(slow, [note(220, 8, 0.05), note(220, 0.05)]))
    const fresh = lens(drawn(slow, [note(220, 0.05)]))
    expect(reach(again)).toBeGreaterThan(reach(first) - 1)
    expect(reach(again)).toBeGreaterThan(reach(fresh) + 20)
  })

  it('draws one string for a key that took a let-go key’s strings over', () => {
    const one = drawn({ ...plain, damper: 6 }, [note(220, 0.5)])
    const taken = drawn({ ...plain, damper: 6 }, [note(220, 3, 1), note(220, 0.5)])
    expect(taken).toHaveLength(one.length)
  })
})

describe('the prepared piano’s figures', () => {
  /** The objects by the number Preparation gives them. */
  const bolt = 1
  const rubber = 2
  const felt = 3
  const paper = 4
  const on = (kind: number, amount = 1, position = 0.5) => ({ kind, amount, position })

  it('gives every key its own object under Mixed, the same one each time', () => {
    expect(prepKey(261.63)).toBe(60)
    expect(prepKey(440)).toBe(69)
    expect(prepRow(57)).toBe(0)
    expect(prepRow(60)).toBe(3)
    // Middle C reads the fourth row: a bolt at 0.6 of Amount, a tenth further along.
    const c = prepPlaced(60, 0, 0.6, 0.2)
    expect(c.kind).toBe(bolt)
    expect(c.amount).toBeCloseTo(0.36, 9)
    expect(c.position).toBeCloseTo(0.3, 9)
    // The D above reads the sixth: rubber at the whole of Amount, a little nearer the end.
    const d = prepPlaced(62, 0, 0.6, 0.2)
    expect(d.kind).toBe(rubber)
    expect(d.amount).toBeCloseTo(0.6, 9)
    expect(d.position).toBeCloseTo(0.14, 9)
    // The table comes round after nineteen keys, and no object leaves the string.
    expect(prepPlaced(81, 0, 0.6, 0.2)).toEqual(d)
    expect(prepPlaced(62, 0, 1, 0.05).position).toBe(0.04)
    // Any other preparation is the same on every key.
    expect(prepPlaced(62, felt, 0.6, 0.2)).toEqual({ kind: felt, amount: 0.6, position: 0.2 })
  })

  it('rings a bare string seven seconds at middle C, less with every key up', () => {
    expect(prepRingSeconds(60)).toBeCloseTo(7, 9)
    // 7 · e^−0.54 = 4.0792.
    expect(prepRingSeconds(72)).toBeCloseTo(4.0792, 3)
    expect(prepRingSeconds(24)).toBe(16)
    expect(prepRingSeconds(127)).toBe(0.5)
  })

  it('damps the partials that move where the object sits', () => {
    expect(prepMoves(1, 0.5)).toBeCloseTo(1, 9)
    expect(prepMoves(2, 0.5)).toBeCloseTo(0, 9)
    expect(prepMoves(1, 0.25)).toBeCloseTo(0.5, 9)
    // Rubber in the middle, full on: 1 / (1 / 7 + 1 / 0.1) = 0.0986 s, on both strings.
    expect(prepPartialSeconds(1, 1, 60, on(rubber), 1)).toBeCloseTo(0.0986, 4)
    expect(prepPartialSeconds(1, 0, 60, on(rubber), 1)).toBeCloseTo(0.0986, 4)
    // A bolt: 1 / (1 / 7 + 1 / 10) = 4.1176 s on its own string, and the free one rings on.
    expect(prepPartialSeconds(1, 1, 60, on(bolt), 1)).toBeCloseTo(4.1176, 3)
    expect(prepPartialSeconds(1, 0, 60, on(bolt), 1)).toBeCloseTo(7, 9)
    // The second partial is still there: 1 / (2^0.9 / 7 + 1 / 20) = 3.1588 s.
    expect(prepPartialSeconds(2, 1, 60, on(bolt), 1)).toBeCloseTo(3.1588, 3)
    // Amount is squared: half of it lays a quarter of the damping on.
    expect(prepPartialSeconds(1, 1, 60, on(rubber, 0.5), 1)).toBeCloseTo(1 / (1 / 7 + 2.5), 6)
  })

  it('lets a key that is let go ring 0.7 s at Decay 1, and a key struck again a tenth', () => {
    expect(prepPartialSeconds(1, 1, 60, on(bolt), 1, 1)).toBeCloseTo(0.7, 9)
    expect(prepPartialSeconds(1, 1, 60, on(bolt), 1, 2)).toBeCloseTo(0.1, 9)
    // 0.7 · 4^1.5 = 5.6 s at the longest Decay; rubber is shorter than the damper anyway.
    expect(prepPartialSeconds(1, 0, 60, on(bolt), 4, 1)).toBeCloseTo(5.6, 9)
    expect(prepPartialSeconds(1, 1, 60, on(rubber), 1, 1)).toBeCloseTo(0.0986, 4)
  })

  it('shares the strike between the two strings and tunes them apart', () => {
    expect(prepStrength(1)).toBe(1)
    expect(prepStrength(0.5)).toBeCloseTo(0.325, 9)
    expect(prepStrength(0)).toBe(0)
    expect(prepFreeShare(on(bolt, 0))).toBeCloseTo(1 / 1.7, 9)
    expect(prepFreeShare(on(bolt, 1))).toBeCloseTo(0.3, 9)
    // Fourteen cents at Detune 1: 440 · 2 · sinh(ln 2 · 14 / 2400) = 3.558 Hz.
    expect(prepBeatHz(440, 1)).toBeCloseTo(3.558, 3)
    expect(prepBeatHz(440, 0)).toBe(0)
    expect(prepStringDb(0, 1, null, 7, 0.7)).toBeCloseTo(0, 9)
    expect(prepStringDb(7, 1, null, 7, 0.7)).toBeCloseTo(-60, 9)
    // Held 0.65 s and let go 0.35 s: −60 · (0.65 / 7 + 0.5) = −35.57 dB.
    expect(prepStringDb(1, 1, 0.35, 7, 0.7)).toBeCloseTo(-35.571, 2)
    expect(prepStringDb(0, 0.5, null, 7, 0.7)).toBeCloseTo(-9.762, 2)
  })

  it('strikes with a hammer an eighth of the way along', () => {
    expect(prepStiffness(60)).toBeCloseTo(3.1e-4, 9)
    expect(prepStiffness(72)).toBeCloseTo(7.6248e-4, 7)
    expect(prepStiffness(21)).toBeCloseTo(2.6e-4, 9)
    expect(prepStretched(1, 3.1e-4)).toBeCloseTo(1, 9)
    expect(prepStretched(2, 3.1e-4)).toBeCloseTo(2.00093, 4)
    // 2.2 · 261.6256 = 575.58 Hz at middle C, a middling hammer and a middling key.
    expect(prepCornerHz(261.6256, 0.5, 0.5, on(bolt))).toBeCloseTo(575.58, 1)
    // Felt full on makes the contact four times as long; the hardest hammer and key: · sqrt(12) · 1.5.
    expect(prepCornerHz(261.6256, 0.5, 0.5, on(felt))).toBeCloseTo(143.89, 1)
    expect(prepCornerHz(261.6256, 1, 1, on(bolt))).toBeCloseTo(2990.8, 0)
    // The eighth partial has a node under the hammer: 0.35 / sqrt(8), halved at the corner.
    expect(prepHammer(8, 1000, 1000)).toBeCloseTo(0.06187, 4)
    expect(prepHammer(4, 0, 1)).toBeCloseTo(0.5, 9)
    expect(prepHammer(1, 0, 1)).toBeCloseTo(0.59874, 4)
  })

  it('buzzes while the strings swing wider than the gap to the object', () => {
    expect(prepBuzzDepth(on(paper), 1)).toBe(1)
    expect(prepBuzzDepth(on(bolt, 0.25), 0.4)).toBeCloseTo(0.2, 9)
    expect(prepBuzzDepth(on(rubber), 1)).toBeCloseTo(0.15, 9)
    expect(prepBuzzDepth(on(bolt), 0)).toBe(0)
    expect(prepGap(0)).toBeCloseTo(0.35, 9)
    expect(prepGap(1)).toBeCloseTo(0.07, 9)
    // The swing dies with the strings, sooner under rubber, and a soft key swings less.
    const swing = (kind: number, age: number, gain = 1) =>
      prepSwing(261.63, gain, 0.5, on(kind, 0.8, 0.2), 1, age, null)
    expect(swing(bolt, 0)).toBeGreaterThan(swing(bolt, 1))
    expect(swing(bolt, 1)).toBeGreaterThan(swing(bolt, 3))
    expect(swing(bolt, 1)).toBeGreaterThan(10 * swing(rubber, 1))
    expect(swing(bolt, 0, 0.5)).toBeLessThan(0.5 * swing(bolt, 0))
    expect(swing(bolt, 0, 0)).toBe(0)
    // A paper slip full on buzzes at the strike and has stopped long before the string has.
    const gap = prepGap(prepBuzzDepth(on(paper, 1, 0.2), 1))
    expect(prepSwing(261.63, 1, 0.5, on(paper, 1, 0.2), 1, 0, null)).toBeGreaterThan(gap)
    expect(prepSwing(261.63, 1, 0.5, on(paper, 1, 0.2), 1, 6, null)).toBeLessThan(gap)
  })

  it('stops the old note of a key that is struck again', () => {
    expect(prepStruckAgain([note(261.63, 2), note(261.63, 0.5)], 0)).toBe(true)
    expect(prepStruckAgain([note(261.63, 2), note(261.63, 0.5)], 1)).toBe(false)
    // One key is one pair of strings, however the two notes are tuned.
    expect(prepStruckAgain([note(261.63, 2), note(262.5, 0.5)], 0)).toBe(true)
    expect(prepStruckAgain([note(261.63, 2), note(293.66, 0.5)], 0)).toBe(false)
  })

  it('dulls the whole instrument above Tone’s corner and spreads the keys as far as Width', () => {
    expect(prepToneHz(0)).toBe(500)
    expect(prepToneHz(1)).toBeCloseTo(18000, 6)
    // Halfway: 500 · sqrt(36) = 3000 Hz, 3 dB down there and 10 · log10(17) = 12.3 an octave up.
    expect(prepToneHz(0.5)).toBeCloseTo(3000, 6)
    expect(prepToneDb(3000, 0.5)).toBeCloseTo(-3.0103, 3)
    expect(prepToneDb(6000, 0.5)).toBeCloseTo(-12.3045, 3)
    expect(prepToneDb(100, 1)).toBeCloseTo(0, 6)
    // Middle C in the middle; three octaves up, 0.55 of the way to the right speaker at Width 1.
    expect(prepPlace(261.6256, 1)).toBeCloseTo(0, 6)
    expect(prepPlace(2093.005, 1)).toBeCloseTo(0.55, 4)
    expect(prepPlace(32.7032, 1)).toBeCloseTo(-0.55, 4)
    // The bottom A is more than three octaves down and stands no further out.
    expect(prepPlace(27.5, 1)).toBeCloseTo(-0.55, 9)
    // The A above middle C at the default Width: 9 / 36 · 0.55 · 0.6.
    expect(prepPlace(440, 0.6)).toBeCloseTo(0.0825, 6)
    expect(prepPlace(2093.005, 0)).toBeCloseTo(0, 9)
  })
})

describe('the prepared piano’s display', () => {
  const { display } = WIRE_INSTRUMENT_FACES['prepared-piano']
  const params = paramsOf('prepared-piano')
  const drawn = (values: Record<string, number>, notes: DisplayNote[]): DrawnPath[] =>
    lights(drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() })))
  /** Middle C carries a bolt under Mixed and the D above it rubber. */
  const c = 261.63
  const d = 293.66

  it('lights nothing while no key sounds', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(drawn({}, [])).toHaveLength(0)
  })

  it('lights both strings of a struck key, each on its own course', () => {
    const one = drawn({}, [note(c, 0.3)])
    expect(one).toHaveLength(2)
    const two = drawn({}, [note(c, 0.3), note(d, 0.3)])
    expect(two).toHaveLength(4)
    const xs = two.map((path) => path.points[0][0])
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(5)
  })

  it('lights a key for the time its object lets it ring', () => {
    // Under Mixed at Amount 0.6 the rubber on D leaves it 0.83 s; the bolt on C leaves seconds.
    expect(drawn({}, [note(d, 0.3)])).toHaveLength(2)
    expect(drawn({}, [note(d, 1.5)])).toHaveLength(0)
    expect(drawn({}, [note(c, 1.5)])).toHaveLength(2)
    // With all rubber full on, C is as short; with none of it, D rings like any string.
    expect(drawn({ preparation: 2, amount: 1 }, [note(c, 1.5)])).toHaveLength(0)
    expect(drawn({ amount: 0 }, [note(d, 1.5)])).toHaveLength(2)
  })

  it('shortens the light as the string dies', () => {
    const fresh = drawn({}, [note(c, 0.2)])
    const old = drawn({}, [note(c, 3)])
    expect(Math.max(...fresh.map(reach))).toBeGreaterThan(Math.max(...old.map(reach)) + 3)
  })

  it('puts a let-go key out under the damper, later the longer Decay is', () => {
    expect(drawn({}, [note(c, 0.5, 0.1)]).length).toBeGreaterThan(0)
    expect(drawn({}, [note(c, 1.2, 0.9)])).toHaveLength(0)
    expect(drawn({ decay: 4 }, [note(c, 1.2, 0.9)]).length).toBeGreaterThan(0)
  })

  it('draws one pair of strings for a key struck twice', () => {
    expect(drawn({}, [note(c, 2), note(c, 0.3)])).toHaveLength(2)
  })

  /** What is drawn at rest in the margin at the right of the strings, past x = 185 of an upright plate's 204. */
  const margin = (values: Record<string, number>): DrawnPath[] =>
    drawnPaths(drawDisplay(display, params, { values, width: 204 })).filter(
      (path) => path.kind === 'stroke' && path.points.length > 1 && path.points[0][0] > 185,
    )

  it('draws Tone as its curve: flat to the corner, falling after', () => {
    const curve = (tone: number): DrawnPath =>
      margin({ tone }).reduce((most, path) =>
        path.points.length > most.points.length ? path : most,
      )
    /** How many points of the curve lie on its flat top, within half a pixel of where it starts. */
    const flat = (path: DrawnPath): number =>
      path.points.filter(([, y]) => y < path.points[0][1] + 0.5).length
    expect(curve(1).points.length).toBeGreaterThan(10)
    expect(flat(curve(1))).toBeGreaterThan(flat(curve(0.5)) + 2)
    expect(flat(curve(0.5))).toBeGreaterThan(flat(curve(0)) + 2)
    // At the bottom of the knob the top of the range is more than the curve's 24 dB down, all
    // of its 9 px; at the top 20 kHz is 10 · log10(1 + (20 / 18)⁴) = 4.0 dB down, a pixel and a half.
    expect(reach(curve(0))).toBeGreaterThan(8.5)
    expect(reach(curve(1))).toBeCloseTo(1.5, 1)
  })

  it('draws Width as the stretch of the stage the keyboard is spread across', () => {
    const bar = (width: number): number => {
      const bars = margin({ width }).filter((path) => path.width === 2.5)
      expect(bars).toHaveLength(1)
      return Math.abs(bars[0].points[1][0] - bars[0].points[0][0])
    }
    expect(bar(0)).toBeCloseTo(0, 9)
    expect(bar(1)).toBeGreaterThan(10)
    expect(bar(0.5)).toBeCloseTo(bar(1) / 2, 6)
  })
})

describe('the wind harp’s figures', () => {
  it('sets the wind in octaves above a string’s own note', () => {
    expect(windSpeed(0.5)).toBeCloseTo(1.8, 9)
    // Gusts reach two octaves at Gust 1; a lull lets the wind drop 1.2 more.
    expect(windSpeed(0.5, 1, 1)).toBeCloseTo(3.8, 9)
    expect(windSpeed(0.5, 1, -1, 1)).toBeCloseTo(-1.4, 9)
    expect(windSpeed(0.5, 0, 1)).toBeCloseTo(1.8, 9)
  })

  it('leans the wind higher on a low string, as one wind across long and short ones', () => {
    expect(windLean(220)).toBeCloseTo(0, 9)
    expect(windLean(110)).toBeCloseTo(0.5, 9)
    expect(windLean(880)).toBeCloseTo(-1, 9)
    expect(windLean(13.75)).toBe(1.5)
    expect(windAvailable(220)).toBe(16)
    // 0.42 · 48000 / 2000 = 10.08.
    expect(windAvailable(2000)).toBe(10)
    expect(windAvailable(12000)).toBe(1)
  })

  it('lets each string of a course hear the wind at its own offset, under Glint’s ceiling', () => {
    expect(windStrings(2.4)).toBe(2)
    expect(windStrings(0)).toBe(1)
    expect(windStrings(9)).toBe(4)
    expect(windAt(1.8, 220, 1, 0, 1)).toBeCloseTo(1.8, 9)
    expect(windAt(1.8, 110, 1, 0, 1)).toBeCloseTo(2.3, 9)
    expect(windAt(1.8, 220, 2, 0, 1)).toBeCloseTo(1.55, 9)
    expect(windAt(1.8, 220, 2, 1, 1)).toBeCloseTo(2.05, 9)
    // Glint 0.5 lets nothing stand above two octaves; a wind below the string stands on its own note.
    expect(windAt(3.6, 220, 1, 0, 0.5)).toBeCloseTo(2, 9)
    expect(windAt(-1.4, 220, 1, 0, 1)).toBe(0)
  })

  it('lights the harmonics under a bell an octave and a half wide', () => {
    const drive = new Array<number>(16).fill(0)
    // The wind on the second harmonic: the third is 0.585 octaves off, (1 − 0.78²)² = 0.1534
    // of it; the two at one power, then 1 / sqrt(n) each.
    windDrive(1, 1, 16, drive)
    expect(drive[0]).toBe(0)
    expect(drive[1]).toBeCloseTo(0.69893, 4)
    expect(drive[2]).toBeCloseTo(0.08755, 4)
    expect(drive[3]).toBe(0)
    // Glint's ceiling on the second harmonic cuts the third off: it is more than half an octave over.
    windDrive(1, 0.25, 16, drive)
    expect(drive[1]).toBeCloseTo(Math.SQRT1_2, 6)
    expect(drive[2]).toBe(0)
    // A string with one harmonic in the band has nothing else to light.
    windDrive(1, 1, 1, drive)
    expect(drive[1]).toBe(0)
  })

  it('rings a harmonic on for Ring, a higher one less, and wakes it in a moment', () => {
    expect(windHum(0.5)).toBeCloseTo(0.3, 9)
    expect(windRingSeconds(4, 1)).toBe(4)
    expect(windRingSeconds(4, 16)).toBeCloseTo(1.8182, 4)
    expect(windWakeSeconds(4)).toBeCloseTo(0.21, 9)
    expect(windBetweenLulls(1)).toBeCloseTo(3.3333, 4)
    expect(windBetweenLulls(0.5)).toBeCloseTo(13.3333, 4)
    expect(windBetweenLulls(0)).toBe(Infinity)
  })

  it('plucks as hard as Touch and fades a let-go key over Release', () => {
    // The sum of 1 / k³ to sixteen is 1.20022: 2 / sqrt(1.20022) = 1.8256.
    expect(windPluck(1, 1, 1)).toBeCloseTo(1.8256, 3)
    expect(windPluck(1, 1, 4)).toBeCloseTo(1.8256 / 8, 3)
    expect(windPluck(0.5, 0, 1)).toBeCloseTo(0.3651, 3)
    expect(windPluck(0, 1, 1)).toBe(0)
    expect(windKeyLevel(0)).toBeCloseTo(0.2, 9)
    expect(windKeyLevel(1)).toBe(1)
    expect(windKeyLight(null, 2)).toBe(1)
    expect(windKeyLight(1, 2)).toBeCloseTo(0.5, 9)
    expect(windKeyLight(3, 2)).toBe(0)
  })

  it('shows gusts of the device’s pace and reach, and says what a steady wind lights', () => {
    // 0.3 · sin(2π · 0.33) + 0.2 · sin(2π · 0.71) = 0.2629 − 0.1937.
    expect(windSway(0)).toBeCloseTo(0.0692, 3)
    for (let seconds = 0; seconds <= 60; seconds += 0.5)
      expect(Math.abs(windSway(seconds))).toBeLessThanOrEqual(1)
    const knobs = { wind: 1 / 3.6, strings: 1, glint: 1, hum: 0, touch: 0, ring: 4 }
    const key = { gain: 1, age: 0 }
    expect(windSteady(2, 220, key, knobs)).toBeCloseTo(0.69893, 4)
    expect(windSteady(1, 220, key, knobs)).toBe(0)
    expect(windSteady(1, 220, key, { ...knobs, hum: 0.5 })).toBeCloseTo(0.3, 6)
    // The pluck at the key, and what is left of it a Ring later: 60 dB less.
    expect(windSteady(1, 220, key, { ...knobs, touch: 0.1 })).toBeCloseTo(0.18256, 3)
    expect(windSteady(1, 220, { gain: 1, age: 4 }, { ...knobs, touch: 0.1 })).toBeCloseTo(
      0.00018256,
      6,
    )
  })

  it('hears a harmonic that stands over the air, and tells it from a neighbour’s skirt', () => {
    const binHz = 48000 / 2048
    const air = (db: number): Float32Array => new Float32Array(1024).fill(db)
    /** A steady sine as the analyser shows it: on the bins within three of its own. */
    const sine = (bins: Float32Array, hz: number, db: number): Float32Array => {
      const centre = hz / binHz
      for (let bin = Math.ceil(centre - 2.99); bin <= centre + 2.99; bin++)
        bins[bin] = Math.max(bins[bin], db + lobeDb(bin - centre))
      return bins
    }
    // A key twenty bins long, so its second harmonic lies on bin 40. 12 dB over the air it is
    // heard; 5 dB over it is not; and air alone is no harmonic at all.
    const hz = 20 * binHz
    expect(windHeardDb(sine(air(-50), 2 * hz, -38), binHz, hz, 2)).toBeCloseTo(-38, 6)
    expect(windHeardDb(sine(air(-50), 2 * hz, -45), binHz, hz, 2)).toBe(-Infinity)
    for (let n = 1; n <= 16; n++) expect(windHeardDb(air(-40), binHz, hz, n)).toBe(-Infinity)
    // One dip in the air does not make a harmonic of what is 4 dB over the rest of it.
    const dipped = sine(air(-40), 2 * hz, -36)
    dipped[50] = -70
    expect(windHeardDb(dipped, binHz, hz, 2)).toBe(-Infinity)
    // Another key's harmonic between this one and the next does not put it out.
    const chord = sine(sine(air(-50), 2 * hz, -38), 2.35 * hz, -20)
    expect(windHeardDb(chord, binHz, hz, 2)).toBeCloseTo(-38, 6)
    // The A at 55 Hz: its harmonics are 2.35 bins apart. The fourth alone, at −20 dB, lies 0.39
    // of a bin off bin 9 (0.85 dB down) and spills 33 dB down on the third's bin: the third and
    // the fifth are not heard.
    const low = sine(air(-120), 220, -20)
    expect(windHeardDb(low, binHz, 55, 4)).toBeCloseTo(-20.85, 1)
    expect(windHeardDb(low, binHz, 55, 3)).toBe(-Infinity)
    expect(windHeardDb(low, binHz, 55, 5)).toBe(-Infinity)
    // With a fifth of its own 4 dB under the fourth, both are.
    const both = sine(sine(air(-120), 220, -20), 275, -24)
    expect(windHeardDb(both, binHz, 55, 4)).toBeCloseTo(-20.85, 1)
    expect(windHeardDb(both, binHz, 55, 5)).toBeCloseTo(-24.6, 1)
  })
})

describe('the wind harp’s display', () => {
  const { display } = WIRE_INSTRUMENT_FACES['wind-harp']
  const params = paramsOf('wind-harp')
  /** One string a key, the wind on its second harmonic, no hum and no pluck. */
  const bare = { wind: 1 / 3.6, strings: 1, glint: 1, hum: 0, touch: 0 }
  /** The sound with these harmonics of a string at `hz` in it, each at its dB, and nothing else. */
  const heard = (hz: number, harmonics: Record<number, number>): DisplaySignal => {
    const signal = testSignal()
    const spectrum = new Float32Array(1024).fill(-120)
    for (const [n, db] of Object.entries(harmonics))
      spectrum[Math.round((Number(n) * hz) / signal.binHz)] = db
    return { ...signal, spectrum }
  }
  const drawn = (
    values: Record<string, number>,
    notes: DisplayNote[],
    signal: DisplaySignal | null = null,
  ): DrawnPath[] => lights(drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal })))
  /** The rungs across a course: the harmonics that are lit, the lowest first. */
  const rungs = (paths: DrawnPath[]): DrawnPath[] =>
    paths
      .filter((path) => path.points.length === 2 && path.points[0][1] === path.points[1][1])
      .sort((a, b) => b.points[0][1] - a.points[0][1])
  /** The strings of the courses that are lit. */
  const courses = (paths: DrawnPath[]): DrawnPath[] =>
    paths.filter((path) => path.points[0][0] === path.points[1][0])
  const heightOf = (path: DrawnPath): number => path.points[0][1]

  it('lights nothing while no key is held', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(drawn({}, [], testSignal())).toHaveLength(0)
  })

  it('lights as many strings as a course has', () => {
    for (const strings of [1, 2, 3, 4]) {
      const lit = courses(drawn({ ...bare, strings }, [note(220, 2)]))
      expect(lit).toHaveLength(1)
      expect(lit[0].points).toHaveLength(2 * strings)
    }
    expect(courses(drawn(bare, [note(220, 2), note(330, 2)]))).toHaveLength(2)
  })

  it('puts a rung at each harmonic heard, stronger the louder', () => {
    const one = rungs(drawn(bare, [note(440, 2)], heard(440, { 5: -20 })))
    expect(one).toHaveLength(1)
    const two = rungs(drawn(bare, [note(440, 2)], heard(440, { 2: -20, 5: -35 })))
    expect(two).toHaveLength(2)
    // The fifth harmonic stands where it stood, above the second, and is half as strong.
    expect(heightOf(two[1])).toBeCloseTo(heightOf(one[0]), 6)
    expect(heightOf(two[0])).toBeGreaterThan(heightOf(two[1]) + 10)
    expect(two[0].width).toBeGreaterThan(two[1].width)
    // More than 30 dB under the loudest is not lit, nor is what is left in a lull.
    expect(rungs(drawn(bare, [note(440, 2)], heard(440, { 2: -20, 5: -55 })))).toHaveLength(1)
    expect(rungs(drawn(bare, [note(440, 2)], heard(440, {})))).toHaveLength(0)
    expect(courses(drawn(bare, [note(440, 2)], heard(440, {})))).toHaveLength(1)
  })

  it('does not light the air as harmonics', () => {
    // Noise as loud in every bin as a harmonic would be: the key is down, and no rung is lit.
    const air: DisplaySignal = { ...testSignal(), spectrum: new Float32Array(1024).fill(-30) }
    expect(rungs(drawn(bare, [note(440, 2)], air))).toHaveLength(0)
    expect(courses(drawn(bare, [note(440, 2)], air))).toHaveLength(1)
  })

  it('dots the rungs it reckons and draws the ones it hears whole', () => {
    const dotted = (signal: DisplaySignal | null): number =>
      runDisplay(display, params, 0.1, {
        values: bare,
        notes: [note(220, 2)],
        signal,
      }).calls.filter(
        (call) => call.name === 'setLineDash' && (call.args[0] as number[]).length > 0,
      ).length
    expect(dotted(null)).toBe(1)
    expect(dotted(heard(220, { 2: -20 }))).toBe(0)
  })

  it('shows what a steady wind lights where the sound cannot be read', () => {
    // On the second harmonic the bell reaches the third; Glint's ceiling there cuts it off.
    const low = rungs(drawn(bare, [note(220, 2)]))
    expect(low).toHaveLength(2)
    expect(low[0].width).toBeGreaterThan(low[1].width)
    expect(rungs(drawn({ ...bare, glint: 0.25 }, [note(220, 2)]))).toHaveLength(1)
    // An octave more wind: the third to the sixth, the fourth the strongest, an octave up the string.
    const high = rungs(drawn({ ...bare, wind: 2 / 3.6 }, [note(220, 2)]))
    expect(high).toHaveLength(4)
    const strongest = high.reduce((most, rung) => (rung.width > most.width ? rung : most))
    expect(strongest).toBe(high[1])
    expect(heightOf(low[0]) - heightOf(strongest)).toBeGreaterThan(10)
    // Hum is the string's own note, always there.
    const hummed = rungs(drawn({ ...bare, hum: 0.5 }, [note(220, 2)]))
    expect(hummed).toHaveLength(3)
    expect(heightOf(hummed[0])).toBeGreaterThan(heightOf(low[0]) + 10)
  })

  it('fades a let-go key over Release and then puts it out', () => {
    const held = courses(drawn({ ...bare, release: 2 }, [note(220, 3)]))
    const going = courses(drawn({ ...bare, release: 2 }, [note(220, 3, 1)]))
    expect(going).toHaveLength(1)
    expect(going[0].alpha).toBeLessThan(held[0].alpha - 0.2)
    expect(drawn({ ...bare, release: 2 }, [note(220, 3, 2)])).toHaveLength(0)
    expect(drawn({ ...bare, release: 8 }, [note(220, 3, 2)]).length).toBeGreaterThan(0)
    // A soft key is a fainter string, and still one.
    const soft = courses(drawn(bare, [note(220, 3, null, 0)]))
    expect(soft[0].alpha).toBeLessThan(held[0].alpha - 0.3)
  })
})
