// The truth of the String Bass's display: a note is on the string the device
// tunes for it, lit for as long as the device's own figures let it ring, and
// what a knob does to a note that sounds shows on it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  STRING_BASS_INSTRUMENT_FACES,
  stringBassBloom,
  stringBassBloomHz,
  stringBassBloomReach,
  stringBassBloomRise,
  stringBassDb,
  stringBassFretRatio,
  stringBassHeardDb,
  stringBassHighSeconds,
  stringBassHumpQ,
  stringBassHz,
  stringBassPickHz,
  stringBassPickupFraction,
  stringBassPluckDb,
  stringBassPluckLevel,
  stringBassRattle,
  stringBassRingSeconds,
  stringBassString,
  stringBassTilt,
  stringBassToneHz,
  stringBassVoices,
} from '../components/displays/instrument-string-bass'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const params = stock.get('string-bass')?.params ?? {}
const { accent } = PLAIN_COLOURS

/** The open strings, and a fretted note: E2 on the D string. */
const E1 = 41.2034
const A1 = 55
const D2 = 73.4162
const G2 = 97.9989
const E2 = 82.4069

let nextId = 1
const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id: nextId++, frequency, gain, age, released })

/**
 * The plate's display is 128 by 100 in a test: the strings lie above y = 55,
 * the bridge at x = 9 and the nut at x = 120, and the two plots under them.
 */
const BRIDGE = 9
const NUT = 120
const UNDER_STRINGS = 55
const above = (path: DrawnPath): boolean => path.points.every(([, y]) => y < UNDER_STRINGS)
/** The lines laid in the accent over the strings: one for each string that sounds. */
const strings = (paths: DrawnPath[]): DrawnPath[] =>
  paths.filter(
    (path) =>
      path.kind === 'stroke' && path.colour === accent && path.points.length > 1 && above(path),
  )
/** The room each sounding string's swing fills. */
const swings = (paths: DrawnPath[]): DrawnPath[] =>
  paths.filter(
    (path) =>
      path.kind === 'fill' && path.colour === accent && path.points.length > 4 && above(path),
  )
const span = (path: DrawnPath, axis: 0 | 1): number => {
  const values = path.points.map((point) => point[axis])
  return Math.max(...values) - Math.min(...values)
}
const end = (path: DrawnPath): number => Math.max(...path.points.map(([x]) => x))
/** How far a line leaves the straight way from point to point: a rattling string is jagged. */
const jagged = (path: DrawnPath): number => {
  let sum = 0
  for (let i = 2; i < path.points.length; i++) {
    sum += Math.abs(path.points[i][1] - 2 * path.points[i - 1][1] + path.points[i - 2][1])
  }
  return sum
}
/** The rectangles filled in the accent. */
const accentBlocks = (drawn: RecordingContext): number => {
  let fill = ''
  let count = 0
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'fillRect' && fill === accent) count += 1
  }
  return count
}

describe('the string bass’s figures', () => {
  it('puts a note on the string `string_for` gives it, at the fret `fret_ratio` says', () => {
    expect([E1, A1, D2, G2].map(stringBassString)).toEqual([0, 1, 2, 3])
    // The highest string whose open pitch is not above the note; a hair flat of an open string is still that string.
    expect(stringBassString(54)).toBe(0)
    expect(stringBassString(55 * 0.9995)).toBe(1)
    expect(stringBassString(E2)).toBe(2)
    expect(stringBassString(440)).toBe(3)
    expect(stringBassString(20)).toBe(0)
    expect(stringBassFretRatio(E2)).toBeCloseTo(E2 / D2, 9)
    expect(stringBassFretRatio(440)).toBeCloseTo(440 / G2, 9)
    // Under the low E that string is lengthened.
    expect(stringBassFretRatio(E1 / 2)).toBeCloseTo(0.5, 9)
  })

  it('plays what `note_on` plays: 16 Hz to 4.2 kHz, or a tenth of the rate', () => {
    expect(stringBassHz(5, 48000)).toBe(16)
    expect(stringBassHz(9000, 48000)).toBe(4200)
    expect(stringBassHz(9000, 22050)).toBeCloseTo(2205, 9)
    expect(stringBassHz(110, 48000)).toBe(110)
  })

  it('hears a note where `pickup_fraction` puts the pickup on its length', () => {
    // `kTypes`: 0.17 of the open string on Electric, 0.14 on Fretless, none on Upright.
    expect(stringBassPickupFraction(0, A1)).toBeCloseTo(0.17, 9)
    expect(stringBassPickupFraction(1, A1)).toBeCloseTo(0.14, 9)
    expect(stringBassPickupFraction(2, A1)).toBe(0)
    // It grows with the fret, to `kPickupFold` at most.
    expect(stringBassPickupFraction(0, E2)).toBeCloseTo((0.17 * E2) / D2, 9)
    expect(stringBassPickupFraction(0, 440)).toBe(0.38)
    expect(stringBassPickupFraction(0, E1 / 2)).toBeCloseTo(0.085, 9)
  })

  it('rings as long as `ring_seconds` says: Sustain at A1, sqrt(55 / f) as long elsewhere', () => {
    expect(stringBassRingSeconds(0, 55, 5, 0)).toBeCloseTo(5, 9)
    expect(stringBassRingSeconds(0, 220, 5, 0)).toBeCloseTo(2.5, 9)
    // Kept between 0.3 and 1.3 of Sustain.
    expect(stringBassRingSeconds(0, 4000, 5, 0)).toBeCloseTo(1.5, 9)
    expect(stringBassRingSeconds(0, 20, 5, 0)).toBeCloseTo(6.5, 9)
    // `kTypes`: Fretless rings 0.85 of that, Upright 0.4.
    expect(stringBassRingSeconds(1, 55, 5, 0)).toBeCloseTo(4.25, 9)
    expect(stringBassRingSeconds(2, 55, 5, 0)).toBeCloseTo(2, 9)
  })

  it('is walked down by Mute to `kMutedSeconds`, on a scale of ratios', () => {
    expect(stringBassRingSeconds(0, 55, 5, 1)).toBeCloseTo(0.12, 9)
    expect(stringBassRingSeconds(0, 55, 5, 0.5)).toBeCloseTo(Math.sqrt(5 * 0.12), 9)
    // A string that rings shorter than a muted one is left as it is.
    expect(stringBassRingSeconds(2, 4000, 0.5, 1)).toBeCloseTo(0.06, 9)
  })

  it('loses its top as `high_seconds` says', () => {
    // Electric: 0.11 of the ring, at 2 kHz.
    expect(stringBassHighSeconds(0, 55, 5, 0)).toBeCloseTo(0.55, 6)
    // Upright: 0.09 of it.
    expect(stringBassHighSeconds(2, 55, 2, 0)).toBeCloseTo(0.18, 6)
    // `kMuteDulls`: Mute takes 0.8 of that share, and the loop's one low-pass can then be no
    // steeper than 0.6 of the fundamental's own loss allows: 28 ms, not the 2.6 ms asked for.
    expect(stringBassHighSeconds(0, 55, 0.12, 1)).toBeCloseTo(0.02808, 4)
    // High up the same limit holds the top of an open note: 0.43 s at A5, not 0.165 s.
    expect(stringBassHighSeconds(0, 880, 1.5, 0)).toBeCloseTo(0.4336, 3)
  })

  it('plucks as hard as `amplitude_of` says: the softest key still sounds', () => {
    expect(stringBassPluckLevel(1)).toBeCloseTo(1, 9)
    expect(stringBassPluckLevel(0.25)).toBeCloseTo(0.3, 9)
    expect(stringBassPluckLevel(0)).toBe(0.2)
    // `note_on`: a gain that is not a number is 0.5.
    expect(stringBassPluckLevel(NaN)).toBeCloseTo(0.2 + 0.8 * Math.pow(0.5, 1.5), 9)
    expect(stringBassPluckLevel(3)).toBeCloseTo(1, 9)
  })

  it('plucks with the edge `strike` gives: Touch, velocity and the muting hand', () => {
    // Electric: 300 Hz to 7 kHz by Touch, times 0.3 + 1.1 gain.
    expect(stringBassPickHz(0, 0, 1, 0, 55)).toBeCloseTo(420, 6)
    expect(stringBassPickHz(0, 1, 1, 0, 55)).toBeCloseTo(9800, 6)
    expect(stringBassPickHz(0, 0, 0, 0, 55)).toBeCloseTo(90, 6)
    // `kMuteSoftens`: Mute at 1 leaves 0.4 of it.
    expect(stringBassPickHz(0, 0, 1, 1, 55)).toBeCloseTo(168, 6)
    // Never under one and a half times the note.
    expect(stringBassPickHz(0, 0, 0, 0, 110)).toBeCloseTo(165, 6)
    // Fretless: 170 Hz to 2.4 kHz. Upright: 230 Hz to 2.4 kHz.
    expect(stringBassPickHz(1, 1, 1, 0, 55)).toBeCloseTo(3360, 6)
    expect(stringBassPickHz(2, 0.5, 1, 0, 55)).toBeCloseTo(1040.154, 2)
    // `note_on`: a gain that is not a number is 0.5 here too, and one past 1 is 1.
    expect(stringBassPickHz(0, 0, NaN, 0, 55)).toBeCloseTo(255, 6)
    expect(stringBassPickHz(0, 0, 3, 0, 55)).toBeCloseTo(420, 6)
  })

  it('sets its tone control and its pickup as `apply` does', () => {
    expect(stringBassToneHz(0)).toBeCloseTo(180, 9)
    expect(stringBassToneHz(1)).toBeCloseTo(9000, 6)
    expect(stringBassToneHz(0.5)).toBeCloseTo(Math.sqrt(180 * 9000), 6)
    expect(stringBassHumpQ(0)).toBeCloseTo(0.55, 9)
    expect(stringBassHumpQ(1)).toBeCloseTo(3.2, 9)
    expect(stringBassHumpQ(0.5)).toBeCloseTo(1.875, 9)
  })

  it('gives a note the level `strike` gives its pitch', () => {
    // `kPitchTilt`: the fourth root of the note over A1 from E0 to A2, then the type's own power to A4.
    expect(stringBassTilt(0, 55)).toBeCloseTo(1, 9)
    expect(stringBassTilt(0, 110)).toBeCloseTo(1.189207, 5)
    expect(stringBassTilt(0, 440)).toBeCloseTo(2.378414, 5)
    expect(stringBassTilt(0, 1760)).toBeCloseTo(2.378414, 5)
    expect(stringBassTilt(0, 16)).toBeCloseTo(0.782542, 5)
    // Upright: 1.2 of it, and a power of 0.15 above A2.
    expect(stringBassTilt(2, 55)).toBeCloseTo(1.2, 9)
    expect(stringBassTilt(2, 440)).toBeCloseTo(1.756903, 5)
  })

  it('falls 60 dB over its ring, and 60 dB more over Release from the key up', () => {
    expect(stringBassDb(2.5, 1, null, 5, 0.15)).toBeCloseTo(-30, 5)
    expect(stringBassDb(2.5, 0.25, null, 5, 0.15)).toBeCloseTo(-30 + 20 * Math.log10(0.3), 4)
    // `begin_release`: the fade lies over the string, which goes on dying as it was.
    expect(stringBassDb(2, 1, 0.1, 4, 0.2)).toBeCloseTo(-30 - 30, 5)
    // `note_off`: let go before it was plucked, it is plucked and then stopped.
    expect(stringBassDb(0.2, 1, 0.5, 4, 0.4)).toBeCloseTo(-3 - 30, 5)
  })

  it('blooms on Fretless as `control` says', () => {
    // Nothing for 20 ms, then in over 130 ms.
    expect(stringBassBloomRise(0.02)).toBe(0)
    expect(stringBassBloomRise(0.085)).toBeCloseTo(0.5, 9)
    expect(stringBassBloomRise(0.15)).toBe(1)
    // `kBloomSagSeconds`, `kBloomFloor`: then it sags to a quarter with a time of 0.8 s.
    expect(stringBassBloom(0.01)).toBe(0)
    expect(stringBassBloom(0.15)).toBeCloseTo(0.871772, 5)
    expect(stringBassBloom(20)).toBeCloseTo(0.25, 6)
    // The band rises from 520 Hz to 1 kHz with it.
    expect(stringBassBloomHz(0)).toBe(520)
    expect(stringBassBloomHz(0.085)).toBeCloseTo(760, 6)
    expect(stringBassBloomHz(1)).toBe(1000)
    // `strike`: it is for the bass register.
    expect(stringBassBloomReach(55)).toBe(1)
    expect(stringBassBloomReach(400)).toBeCloseTo(0.5, 9)
    expect(stringBassBloomReach(600)).toBe(0)
  })

  it('rattles on Electric and Upright only while the swing stands over `kBuzzHeight`', () => {
    // `kStrokeLevel`: a full pluck swings 2.5, a key at 0.35 swings 0.91: it never reaches 1.
    expect(stringBassRattle(0, 0, 1, 5)).toBeCloseTo(1, 9)
    expect(stringBassRattle(0, 0, 0.35, 5)).toBe(0)
    expect(stringBassRattle(0, 0, 0.5, 5)).toBeGreaterThan(0)
    // A hard note stops reaching it as it settles: 0.43 s into a ring of 5 s.
    expect(stringBassRattle(0, 0.2, 1, 5)).toBeGreaterThan(0)
    expect(stringBassRattle(0, 0.2, 1, 5)).toBeLessThan(stringBassRattle(0, 0.05, 1, 5))
    expect(stringBassRattle(0, 0.42, 1, 5)).toBeGreaterThan(0)
    expect(stringBassRattle(0, 0.44, 1, 5)).toBe(0)
    // Upright loses its top sooner and its swing settles sooner for it, as measured on the
    // device: 0.4 of the fundamental's fall against 0.65, so 0.106 s into a ring of 2 s.
    expect(stringBassRattle(2, 0, 1, 2)).toBeCloseTo(1, 9)
    expect(stringBassRattle(2, 0.1, 1, 2)).toBeGreaterThan(0)
    expect(stringBassRattle(2, 0.11, 1, 2)).toBe(0)
    expect(stringBassRattle(0, 0.11, 1, 2)).toBeGreaterThan(0.2)
    // Fretless does not rattle: its string sings instead.
    expect(stringBassRattle(1, 0, 1, 5)).toBe(0)
    expect(stringBassRattle(1, 0.1, 1, 5)).toBe(0)
  })

  it('is heard as `process` hears it: a pickup’s low-pass or a body, then the tone control', () => {
    // The pickup's hump at 2.6 kHz: Q 3.2 at the top of Resonance, 0.55 at the foot.
    expect(stringBassHeardDb(0, 2600, 9000, 1)).toBeCloseTo(10.073, 2)
    expect(stringBassHeardDb(0, 2600, 9000, 0)).toBeCloseTo(-5.223, 2)
    // Fretless: at 2.2 kHz.
    expect(stringBassHeardDb(1, 2200, 9000, 1)).toBeGreaterThan(stringBassHeardDb(1, 2600, 9000, 1))
    // The tone control is 3 dB down at its corner.
    expect(stringBassHeardDb(0, 180, 180, 0)).toBeCloseTo(-3.037, 2)
    // Upright: nothing but the tone control with no Resonance; with it the body at 66, 112 and 187 Hz.
    expect(stringBassHeardDb(2, 66, 9000, 0)).toBeCloseTo(0, 4)
    expect(stringBassHeardDb(2, 66, 9000, 1)).toBeCloseTo(4.445, 2)
    expect(stringBassHeardDb(2, 112, 9000, 0.5)).toBeCloseTo(2.041, 2)
    // `kDirectLoss`: away from the body's notes the string gives up 0.3 of itself.
    expect(stringBassHeardDb(2, 500, 9000, 1)).toBeCloseTo(-2.741, 2)
  })

  it('leaves in a pluck the nulls of its place and of the pickup’s', () => {
    // Plucked at the middle with a hard edge, heard at the bridge: the even partials are missing.
    expect(stringBassPluckDb(55, 55, 2, 0.5, 1e6)).toBeCloseTo(20 * Math.log10(Math.SQRT2), 3)
    expect(stringBassPluckDb(110, 55, 2, 0.5, 1e6)).toBeLessThan(-100)
    expect(stringBassPluckDb(165, 55, 2, 0.5, 1e6)).toBeCloseTo(
      20 * Math.log10(2 / Math.sqrt(10)),
      3,
    )
    // Plucked a fifth of the way along: every fifth.
    expect(stringBassPluckDb(275, 55, 2, 0.2, 1e6)).toBeLessThan(-100)
    // The pickup takes nothing from the fundamental, and all of the partial 1 / 0.17 up.
    expect(stringBassPluckDb(55, 55, 0, 0.5, 1e6)).toBeCloseTo(20 * Math.log10(Math.SQRT2), 3)
    expect(stringBassPluckDb(55 / 0.17, 55, 0, 0.22, 1e6)).toBeLessThan(-100)
    expect(stringBassPluckDb(55 / 0.17, 55, 2, 0.22, 1e6)).toBeGreaterThan(-30)
    // A softer pluck has less top: 3 dB less at its corner.
    expect(
      stringBassPluckDb(165, 55, 2, 0.5, 165) - stringBassPluckDb(165, 55, 2, 0.5, 1e6),
    ).toBeCloseTo(-3.0103, 3)
    // Where a comb's teeth are finer than what is drawn, its mean stands for it.
    expect(stringBassPluckDb(110, 55, 2, 0.5, 1e6, 4)).toBeGreaterThan(-10)
  })
})

describe('the string bass’s four strings', () => {
  const owners = (notes: DisplayNote[], values: { release?: number; type?: number } = {}) =>
    stringBassVoices(notes, values.type ?? 0, 5, 0, values.release ?? 0.15, 48000, [])

  it('gives each of four keys a string of its own', () => {
    const chord = [note(E1, 1), note(A1, 0.9), note(D2, 0.8), note(G2, 0.7)]
    expect(owners(chord)).toEqual([0, 1, 2, 3])
    expect(owners([])).toEqual([-1, -1, -1, -1])
  })

  it('gives a fifth key the quietest string', () => {
    // All held: the softest pluck is the quietest.
    const held = [
      note(E1, 1),
      note(A1, 0.9, null, 0.2),
      note(D2, 0.8),
      note(G2, 0.7),
      note(131, 0.1),
    ]
    expect(owners(held)).toEqual([0, 4, 2, 3])
    // All alike: the one that has rung down furthest. A high string dies sooner than a low one.
    const alike = [note(E1, 2), note(A1, 2), note(D2, 2), note(G2, 2), note(131, 0.1)]
    expect(owners(alike)).toEqual([0, 1, 2, 4])
  })

  it('takes a string that was let go before one that is held, however loud', () => {
    // The hard note was let go 10 ms before the fifth key and has faded 4 dB of its 60: still
    // some 10 dB louder than the softest held one, and taken all the same.
    const notes = [
      note(E1, 0.2, null, 0),
      note(A1, 0.2, 0.03),
      note(D2, 0.2),
      note(G2, 0.2),
      note(131, 0.02),
    ]
    expect(owners(notes)).toEqual([0, 4, 2, 3])
  })

  it('plucks a key struck again on its own string, and a key at the same pitch on that string', () => {
    // The plate lets the first note go at the moment its key is struck again.
    const again = [
      { id: 7, frequency: A1, gain: 1, age: 1, released: 0.4 },
      { id: 7, frequency: 110, gain: 1, age: 0.4, released: null },
    ]
    expect(owners(again)).toEqual([1, -1, -1, -1])
    // Another key within a quarter tone: the same string. A semitone off: the next one.
    expect(owners([note(A1, 1), note(A1 * 1.02, 0.4)])).toEqual([1, -1, -1, -1])
    expect(owners([note(A1, 1), note(A1 * 1.06, 0.4)])).toEqual([0, 1, -1, -1])
  })

  it('counts a string that has died as free, and takes the one longest unused', () => {
    // Let go long ago: silent. The next key goes to a string that was never used.
    const notes = [note(A1, 30, 29), note(D2, 0.5)]
    expect(owners(notes)).toEqual([0, 1, -1, -1])
    // With every string used once, the first to have died is the first taken again.
    const round = [
      note(E1, 40, 39),
      note(A1, 39, 38),
      note(D2, 38, 37),
      note(G2, 37, 36),
      note(131, 0.5),
    ]
    expect(owners(round)).toEqual([4, 1, 2, 3])
  })

  it('drops a pitch that is not a number, as `note_on` does', () => {
    expect(owners([note(NaN, 0.5), note(A1, 0.4)])).toEqual([1, -1, -1, -1])
  })
})

describe('the string bass’s display', () => {
  const { display, face } = STRING_BASS_INSTRUMENT_FACES['string-bass']
  const drawn = (values: Record<string, number>, notes: DisplayNote[]) =>
    runDisplay(display, params, 0.1, { values, notes, signal: testSignal() })
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(drawn(values, notes))

  it('puts the four knobs a player reaches for first on its face', () => {
    expect(face).toEqual(['type', 'touch', 'tone', 'sustain'])
    expect(display.params).not.toContain('volume')
  })

  it('lights nothing at rest, and one string for each note that sounds', () => {
    expect(strings(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(strings(run({}, []))).toHaveLength(0)
    expect(strings(run({}, [note(A1, 0.2), note(E2, 0.2)]))).toHaveLength(2)
    expect(swings(run({}, [note(A1, 0.2), note(E2, 0.2)]))).toHaveLength(2)
  })

  it('swings a note from the bridge to its fret, on the string the device tunes for it', () => {
    // An open A: the whole of the second string from the foot.
    const [open] = strings(run({}, [note(A1, 0.2)]))
    expect(open.points[0][0]).toBeCloseTo(BRIDGE, 6)
    expect(end(open)).toBeCloseTo(NUT, 6)
    // E2 is the D string, shorter by the ratio of the two pitches.
    const [fretted] = strings(run({}, [note(E2, 0.2)]))
    expect(end(fretted)).toBeCloseTo(BRIDGE + ((NUT - BRIDGE) * D2) / E2, 6)
    expect(fretted.points[0][1]).toBeLessThan(open.points[0][1])
    // Under the low E the string would be longer than the neck: it is drawn to the nut.
    const [deep] = strings(run({}, [note(E1 / 2, 0.2)]))
    expect(end(deep)).toBeCloseTo(NUT, 6)
    expect(deep.points[0][1]).toBeGreaterThan(open.points[0][1])
  })

  it('lets the swing narrow as the string dies, and puts it out when it has', () => {
    const ring = stringBassRingSeconds(0, A1, 5, 0)
    const early = swings(run({}, [note(A1, ring * 0.1)]))[0]
    const late = swings(run({}, [note(A1, ring * 0.7)]))[0]
    expect(span(late, 1)).toBeLessThan(span(early, 1) * 0.6)
    expect(strings(run({}, [note(A1, ring * 0.95)]))).toHaveLength(1)
    expect(strings(run({}, [note(A1, ring * 1.05)]))).toHaveLength(0)
  })

  it('rings a high note shorter than a low one, and any note as long as Sustain says', () => {
    // Three seconds on: A1 rings 5 s, A3 half of that.
    expect(strings(run({}, [note(A1, 3)]))).toHaveLength(1)
    expect(strings(run({}, [note(220, 3)]))).toHaveLength(0)
    expect(strings(run({ sustain: 20 }, [note(220, 3)]))).toHaveLength(1)
    expect(strings(run({ sustain: 0.5 }, [note(A1, 0.6)]))).toHaveLength(0)
  })

  it('stops a string over Release once its key is let go', () => {
    const let_go = [note(A1, 1, 0.3)]
    expect(strings(run({ release: 0.15 }, let_go))).toHaveLength(0)
    expect(strings(run({ release: 3 }, let_go))).toHaveLength(1)
  })

  it('cuts the ring short under the muting hand', () => {
    expect(strings(run({ mute: 0 }, [note(A1, 0.5)]))).toHaveLength(1)
    expect(strings(run({ mute: 1 }, [note(A1, 0.5)]))).toHaveLength(0)
    expect(strings(run({ mute: 1 }, [note(A1, 0.05)]))).toHaveLength(1)
  })

  it('rings an upright under half as long', () => {
    // Sustain 5 s: 2 s on Upright, 4.25 s on Fretless.
    expect(strings(run({ type: 0 }, [note(A1, 3)]))).toHaveLength(1)
    expect(strings(run({ type: 1 }, [note(A1, 3)]))).toHaveLength(1)
    expect(strings(run({ type: 2 }, [note(A1, 3)]))).toHaveLength(0)
  })

  it('lights the softest key, which the device still plucks, and swings a harder one wider', () => {
    const soft = swings(run({}, [note(A1, 0.2, null, 0)]))
    const hard = swings(run({}, [note(A1, 0.2, null, 1)]))
    expect(soft).toHaveLength(1)
    expect(span(hard[0], 1)).toBeGreaterThan(span(soft[0], 1) * 1.1)
  })

  it('lights no more than the four strings the device has', () => {
    const five = [note(E1, 1), note(A1, 0.9), note(D2, 0.8), note(G2, 0.7), note(131, 0.1)]
    expect(strings(run({}, five))).toHaveLength(4)
    // The string a later key took is gone, though it would still ring.
    const again = [note(A1, 1), note(A1, 0.2)]
    expect(strings(run({}, again))).toHaveLength(1)
  })

  it('puts the corner of the swing where the string is plucked', () => {
    const corner = (position: number): number => {
      const [swing] = swings(run({ position, touch: 1 }, [note(A1, 0.01)]))
      const top = Math.min(...swing.points.map(([, y]) => y))
      return swing.points.find(([, y]) => y === top)?.[0] ?? NaN
    }
    expect(corner(0.1)).toBeCloseTo(BRIDGE + 0.1 * (NUT - BRIDGE), 6)
    expect(corner(0.5)).toBeCloseTo(BRIDGE + 0.5 * (NUT - BRIDGE), 6)
  })

  it('rattles a string hit hard on Electric, and not one played softly', () => {
    const line = (growl: number, gain: number): DrawnPath =>
      strings(run({ growl }, [{ id: 1, frequency: A1, gain, age: 0.05, released: null }]))[0]
    expect(jagged(line(1, 1))).toBeGreaterThan(jagged(line(0, 1)) + 5)
    // A key at 0.35 never swings past the height: Growl changes nothing on its string.
    expect(line(1, 0.35).points).toEqual(line(0, 0.35).points)
    // And the hard one has settled before half a second.
    const settled = (growl: number): DrawnPath =>
      strings(run({ growl }, [{ id: 1, frequency: A1, gain: 1, age: 0.5, released: null }]))[0]
    expect(settled(1).points).toEqual(settled(0).points)
  })

  it('rattles an upright’s string for a shorter moment than an electric’s', () => {
    const line = (type: number, growl: number, age: number): DrawnPath =>
      strings(run({ type, growl }, [{ id: 1, frequency: A1, gain: 1, age, released: null }]))[0]
    expect(jagged(line(2, 1, 0.03))).toBeGreaterThan(jagged(line(2, 0, 0.03)) + 5)
    // An upright's A1 rings 2 s and its rattle is over in a tenth of one; an electric's goes on.
    expect(line(2, 1, 0.15).points).toEqual(line(2, 0, 0.15).points)
    expect(jagged(line(0, 1, 0.15))).toBeGreaterThan(jagged(line(0, 0, 0.15)) + 5)
  })

  it('lights two keys the device tunes as one string on that string, each to its own fret', () => {
    // A1 and B1 are both the A string to `string_for`, and the device rings both at once.
    const B1 = 61.7354
    const both = strings(run({}, [note(A1, 0.3), note(B1, 0.2)]))
    expect(both).toHaveLength(2)
    expect(both[0].points[0][1]).toBeCloseTo(both[1].points[0][1], 6)
    expect(both.map(end).sort((a, b) => a - b)).toEqual([
      expect.closeTo(BRIDGE + ((NUT - BRIDGE) * A1) / B1, 6),
      expect.closeTo(NUT, 6),
    ])
  })

  it('draws a key whose gain is not a number as the device plays it: a middling one', () => {
    const odd = swings(run({}, [note(A1, 0.2, null, NaN)]))
    const middling = swings(run({}, [note(A1, 0.2, null, 0.5)]))
    expect(odd).toHaveLength(1)
    expect(odd[0].points).toEqual(middling[0].points)
    expect(odd[0].points.flat().every(Number.isFinite)).toBe(true)
  })

  it('blooms a fretless note after its pluck, as much as Growl', () => {
    const line = (growl: number, age: number): DrawnPath =>
      strings(run({ type: 1, growl }, [note(A1, age)]))[0]
    expect(line(1, 0.3).width).toBeGreaterThan(line(0, 0.3).width + 1)
    // Not yet at the pluck, and less a second on.
    expect(line(1, 0.015).width).toBe(line(0, 0.015).width)
    expect(line(1, 2).width).toBeLessThan(line(1, 0.3).width)
    // No string rattles on it.
    expect(jagged(line(1, 0.05))).toBeCloseTo(jagged(line(0, 0.05)), 6)
  })

  it('thumps the body of an upright at a pluck, and no other', () => {
    const blocks = (type: number, age: number): number =>
      accentBlocks(drawn({ type }, [note(A1, age)]))
    expect(blocks(2, 0.03)).toBe(blocks(2, 0.5) + 1)
    expect(blocks(0, 0.03)).toBe(blocks(0, 0.5))
  })

  it('says which bass it is and how long the last note rings', () => {
    expect(drawDisplay(display, params).words()).toEqual(
      expect.arrayContaining(['Electric', 'A1 5.0 s']),
    )
    const upright = drawn({ type: 2 }, [note(A1, 0.5), note(110, 0.2)]).words()
    expect(upright).toEqual(expect.arrayContaining(['Upright', 'A2 1.4 s']))
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { type: 2, position: 0.05, sustain: 20, release: 3 },
      { type: 1, position: 0.5, sustain: 0.5, release: 0.03 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [position, sustain, release] = display.handles?.(view) ?? []
      expect(position.drag(position.x, position.y).position).toBeCloseTo(view.value('position'), 4)
      expect(sustain.drag(sustain.x, sustain.y).sustain).toBeCloseTo(view.value('sustain'), 3)
      expect(release.drag(release.x, release.y).release).toBeCloseTo(view.value('release'), 4)
      // Towards the nut is a pluck further from the bridge; to the right is longer.
      expect(position.drag(position.x - 4, position.y).position).toBeLessThanOrEqual(
        view.value('position'),
      )
      expect(sustain.drag(sustain.x - 4, sustain.y).sustain).toBeLessThan(view.value('sustain'))
      expect(release.drag(release.x + 4, release.y).release).toBeGreaterThan(view.value('release'))
    }
    // The Position handle stands on the dashed line: that share of the open strings from the bridge.
    const [position] = display.handles?.(viewOf(display, params, {})) ?? []
    expect(position.x).toBeCloseTo(BRIDGE + 0.22 * (NUT - BRIDGE), 6)
  })
})
