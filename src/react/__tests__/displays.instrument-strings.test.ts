// The truth of the plucked strings' displays: a string is as long as the
// device says it rings, it is lit for as long as the device's own figures let
// it sound, and what a knob does to a string that is played shows on it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  STRING_INSTRUMENT_FACES,
  chordHarpChimeShare,
  chordHarpCornerHz,
  chordHarpKeyHz,
  chordHarpPadShare,
  chordHarpPan,
  chordHarpPlate,
  chordHarpPlucks,
  chordHarpString,
  chordHarpStringDb,
  chordHarpVelocity,
  harpBendCents,
  harpDampedSeconds,
  harpPluckLevel,
  harpRingSeconds,
  harpRolled,
  harpStringDb,
  tanpuraAmp,
  tanpuraBloom,
  tanpuraContact,
  tanpuraPluckSeconds,
  tanpuraRatio,
  tanpuraRound,
  tanpuraStringDb,
  tanpuraUnsure,
  zitherAnswerDb,
  zitherBlowLevel,
  zitherChord,
  zitherCourseBeat,
  zitherDampedSeconds,
  zitherRingSeconds,
  zitherStrikeSeconds,
  zitherStringDb,
  zitherSympatheticSeconds,
} from '../components/displays/instrument-strings'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent } = PLAIN_COLOURS

const note = (frequency: number, age: number, released: number | null = null): DisplayNote => ({
  id: Math.round(frequency),
  frequency,
  gain: 1,
  age,
  released,
})
/** The strokes laid in the accent: the light on the strings that sound. */
const lights = (paths: DrawnPath[]): DrawnPath[] =>
  paths.filter((path) => path.kind === 'stroke' && path.colour === accent && path.points.length > 1)
/** How far up a light reaches: the span of its points from foot to top, in px. */
const reach = (path: DrawnPath): number => {
  const ys = path.points.map(([, y]) => y)
  return Math.max(...ys) - Math.min(...ys)
}

describe('the harp’s figures', () => {
  it('ring as long as `Harp::ring_seconds` says, times Decay', () => {
    // `harp.h`, `kTypes`: 12 s at 32.7 Hz falling as (32.7 / f)^0.72, kept between 0.3 and 14.
    expect(harpRingSeconds(0, 32.7, 1)).toBeCloseTo(12, 5)
    expect(harpRingSeconds(0, 261.63, 1)).toBeCloseTo(12 * Math.pow(32.7 / 261.63, 0.72), 5)
    expect(harpRingSeconds(0, 20, 1)).toBe(14)
    expect(harpRingSeconds(0, 20000, 1)).toBe(0.3)
    // Koto: 2.2 s at middle C, to 8 at most. Guzheng: 4.5 s at middle C, 0.5 at least.
    expect(harpRingSeconds(1, 261.63, 1)).toBeCloseTo(2.2, 5)
    expect(harpRingSeconds(1, 10, 1)).toBe(8)
    expect(harpRingSeconds(2, 261.63, 2)).toBeCloseTo(9, 5)
    expect(harpRingSeconds(2, 100000, 1)).toBe(0.5)
  })

  it('bend after the pluck as `Harp::bend_cents` does', () => {
    expect(harpBendCents(0.05, 200)).toBe(0)
    expect(harpBendCents(0.08 + 0.11, 200)).toBeCloseTo(100, 5)
    expect(harpBendCents(2, 200)).toBe(200)
  })

  it('are damped at key up as `Harp::release` damps them', () => {
    expect(harpDampedSeconds(4, 0)).toBe(4)
    expect(harpDampedSeconds(4, 1)).toBeCloseTo(0.1, 5)
    expect(harpDampedSeconds(4, 0.5)).toBeCloseTo(4 * Math.sqrt(0.1 / 4), 5)
    // A string that rings shorter than a damped one is left as it is.
    expect(harpDampedSeconds(0.05, 1)).toBe(0.05)
  })

  it('pluck as hard as `Harp::strike` does: the softest key still sounds', () => {
    // `amplitude`: 0.15 + 0.85 gain^1.5.
    expect(harpPluckLevel(1)).toBeCloseTo(1, 9)
    expect(harpPluckLevel(0.25)).toBeCloseTo(0.15 + 0.85 * 0.125, 9)
    expect(harpPluckLevel(0)).toBe(0.15)
  })

  it('fall 60 dB over the ring, and faster from the key up when damped', () => {
    expect(harpStringDb(2, 1, null, 4, 0)).toBeCloseTo(-30, 5)
    expect(harpStringDb(2, 0.25, null, 4, 0)).toBeCloseTo(-30 + 20 * Math.log10(0.25625), 3)
    // Held a second, let go a second ago, fully damped: the second second falls at 60 dB in 0.1 s.
    expect(harpStringDb(2, 1, 1, 4, 1)).toBeCloseTo(-15 - 600, 3)
    // `Harp::strike`: a key let go before its pluck came is let go at the pluck, and damped from there.
    expect(harpStringDb(0.2, 1, 0.5, 4, 1)).toBeCloseTo(-120, 5)
    expect(harpStringDb(0.2, 1, 0.5, 4, 0)).toBeCloseTo(-3, 5)
  })

  it('pluck a rolled chord from its lowest string to its highest over Sweep', () => {
    const chord = [note(392, 1), note(261.63, 1), note(329.63, 0.9995), note(880, 0.2)]
    expect(harpRolled(chord, 0.6, 0.0013, [])).toEqual([0.6, 0, 0.3, 0])
    expect(harpRolled(chord, 0, 0.0013, [])).toEqual([0, 0, 0, 0])
  })

  it('roll only the keys of one block, as `Harp::schedule` does: a chord played by hand is not rolled', () => {
    // 8 and 17 ms apart: each key is alone in its block and is plucked as it comes.
    const hand = [note(261.63, 1), note(329.63, 0.992), note(392, 0.983)]
    expect(harpRolled(hand, 0.6, 0.0013, [])).toEqual([0, 0, 0])
  })
})

describe('the harp’s display', () => {
  const { display } = STRING_INSTRUMENT_FACES.harp
  const params = paramsOf('harp')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() }))

  it('lights nothing at rest, and one string for each note that sounds', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lights(run({}, []))).toHaveLength(0)
    expect(lights(run({}, [note(261.63, 0.2), note(392, 0.2)]))).toHaveLength(2)
  })

  it('lets the light run down as the string dies, and puts it out when it has', () => {
    const ring = harpRingSeconds(0, 261.63, 1)
    const early = lights(run({}, [note(261.63, ring * 0.1)]))[0]
    const late = lights(run({}, [note(261.63, ring * 0.7)]))[0]
    expect(reach(late)).toBeLessThan(reach(early) * 0.5)
    expect(lights(run({}, [note(261.63, ring * 1.05)]))).toHaveLength(0)
  })

  it('puts a damped string out soon after its key is let go, and leaves an undamped one lit', () => {
    const let_go = [note(261.63, 1, 0.5)]
    expect(lights(run({ damp: 0 }, let_go))).toHaveLength(1)
    expect(lights(run({ damp: 1 }, let_go))).toHaveLength(0)
  })

  it('waits for a rolled chord’s upper strings', () => {
    const chord = [note(261.63, 0.3), note(329.63, 0.3), note(392, 0.3)]
    expect(lights(run({ sweep: 0 }, chord))).toHaveLength(3)
    // Over 1.2 s the middle string is plucked at 0.6 s and the top one at 1.2 s: only the lowest sounds yet.
    expect(lights(run({ sweep: 1.2 }, chord))).toHaveLength(1)
    // Keys a hundredth of a second apart reach the device in different blocks: it plucks each as it comes.
    const hand = [note(261.63, 0.3), note(329.63, 0.29), note(392, 0.28)]
    expect(lights(run({ sweep: 1.2 }, hand))).toHaveLength(3)
  })

  it('damps a rolled string whose key went up before its pluck, from the pluck on', () => {
    // The top string is plucked 0.4 s after the keys; its key went up at 0.1 s. Half a second on it has rung 0.1 s.
    const chord = [note(261.63, 0.5), note(392, 0.5, 0.4)]
    expect(lights(run({ sweep: 0.4, damp: 0 }, chord))).toHaveLength(2)
    expect(lights(run({ sweep: 0.4, damp: 1 }, chord))).toHaveLength(1)
  })

  it('lights the softest key, which the device still plucks', () => {
    expect(lights(run({}, [{ ...note(261.63, 0.2), gain: 0 }]))).toHaveLength(1)
  })

  it('lights no more strings than the device has: the faintest of more than 32 are not lit', () => {
    // Forty pitches a semitone apart, the lowest played first: all would still ring.
    const many = Array.from({ length: 40 }, (_, i) =>
      note(110 * Math.pow(2, i / 12), 0.6 - i * 0.01),
    )
    expect(lights(run({ decay: 4 }, many))).toHaveLength(32)
  })

  it('gives a string to the later of two notes on it', () => {
    expect(lights(run({}, [note(261.63, 2), note(261.63, 0.2)]))).toHaveLength(1)
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { strings: 1, decay: 0.25, pluck: 0.04 },
      { strings: 2, decay: 4 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [decay, pluck] = display.handles?.(view) ?? []
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 3)
      expect(pluck.drag(pluck.x, pluck.y).pluck).toBeCloseTo(view.value('pluck'), 3)
      // Up is a longer ring, and a pluck further from the foot.
      expect(decay.drag(decay.x, decay.y - 10).decay).toBeGreaterThan(view.value('decay'))
      expect(pluck.drag(pluck.x, pluck.y - 3).pluck).toBeGreaterThan(view.value('pluck'))
    }
  })
})

describe('the zither’s figures', () => {
  it('ring as `Zither::start` leans Decay with the pitch', () => {
    // `key_scale`: (220 / hz)^0.3, kept between 0.4 and 1.6.
    expect(zitherRingSeconds(220, 6)).toBeCloseTo(6, 5)
    expect(zitherRingSeconds(110, 6)).toBeCloseTo(6 * Math.pow(2, 0.3), 5)
    expect(zitherRingSeconds(27.5, 10)).toBeCloseTo(16, 5)
    expect(zitherRingSeconds(10000, 10)).toBeCloseTo(4, 5)
  })

  it('are damped at key up as `Zither::ring_time` damps them', () => {
    expect(zitherDampedSeconds(7, 3)).toBe(3)
    expect(zitherDampedSeconds(2, 3)).toBe(2)
    // `kOpenRelease`: at the top of Release a string is never damped.
    expect(zitherDampedSeconds(7, 19.5)).toBe(7)
  })

  it('lay a chord over two octaves above the key as `Zither::press` does', () => {
    const tones: number[] = []
    expect(zitherChord(3, 220, tones)).toBe(6)
    expect(tones.map((hz) => Math.round(hz))).toEqual([220, 330, 440, 554, 659, 880])
    expect(zitherChord(0, 220, tones)).toBe(1)
    // Off the top of the instrument a string is the octave below, and no string is there twice.
    expect(zitherChord(1, 4000, tones)).toBe(1)
    expect(zitherChord(1, 2000, tones, 6)).toBe(2)
    expect(tones.slice(6, 8)).toEqual([2000, 4000])
  })

  it('cross the strings in the Strum time, either way', () => {
    expect(zitherStrikeSeconds(2, 6, 120, false)).toBeCloseTo(0.048, 6)
    expect(zitherStrikeSeconds(0, 6, 120, true)).toBeCloseTo(0.12, 6)
    expect(zitherStrikeSeconds(0, 1, 120, true)).toBe(0)
  })

  it('share the hand’s force between the strings of a chord', () => {
    expect(zitherBlowLevel(1, 1)).toBeCloseTo(1, 5)
    expect(zitherBlowLevel(1, 6)).toBeCloseTo(0.08 + 0.92 * Math.pow(6, -0.35 * 1.5), 5)
    // A stroke of the roll: 0.9 of the key, shared less.
    expect(zitherBlowLevel(1, 6, true)).toBeCloseTo(
      0.08 + 0.92 * Math.pow(0.9 * Math.pow(6, -0.15), 1.5),
      5,
    )
    expect(zitherCourseBeat(220, 1)).toBeCloseTo(1.97, 5)
    expect(zitherSympatheticSeconds(110)).toBeCloseTo(9, 5)
  })

  it('fall 60 dB over the ring while held and over Release from the key up', () => {
    expect(zitherStringDb(3, 1, null, 6, 3)).toBeCloseTo(-30, 5)
    expect(zitherStringDb(3, 1, 1, 6, 3)).toBeCloseTo(-20 - 20, 5)
    // A string the strum reached after its key went up was never held.
    expect(zitherStringDb(1, 1, 2, 6, 3)).toBeCloseTo(-20, 5)
    // A roll keeps a held string at its strokes' level.
    expect(zitherStringDb(3, 1, null, 6, 3, 0.5)).toBeCloseTo(-6.0206, 3)
    // Less half of what the string loses between two strokes: one every 2 s on a 6 s ring is 20 dB.
    expect(zitherStringDb(3, 1, null, 6, 3, 0.5, 2)).toBeCloseTo(-6.0206 - 10, 3)
  })

  it('answer a played string where the partials of the two meet, as measured on the device', () => {
    const a2 = 110
    // One pitch: 7 dB under. An octave either way: 4 dB more.
    expect(zitherAnswerDb(110, a2)).toBeCloseTo(-7, 5)
    expect(zitherAnswerDb(220, a2)).toBeCloseTo(-11, 5)
    expect(zitherAnswerDb(55, a2)).toBeCloseTo(-11, 5)
    // The E a twelfth above is its third partial, 2 cents wide of it on the tempered scale.
    expect(zitherAnswerDb(329.63, a2)).toBeCloseTo(-7 - 4 * Math.log2(3) - 3, 5)
    // The E a fifth above meets it at its third partial with its own second.
    expect(zitherAnswerDb(164.81, a2)).toBeCloseTo(-7 - 4 * Math.log2(6) - 3, 5)
    // A major third above, a semitone above, a quarter tone off: nothing of them falls on it.
    expect(zitherAnswerDb(138.59, a2)).toBe(-Infinity)
    expect(zitherAnswerDb(116.54, a2)).toBe(-Infinity)
    expect(zitherAnswerDb(113.2, a2)).toBe(-Infinity)
  })
})

describe('the zither’s display', () => {
  const { display } = STRING_INSTRUMENT_FACES.zither
  const params = paramsOf('zither')
  // The sympathetic strings stand in a column of their own at the right, from 19 px off the edge.
  const column = 128 - 19
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    lights(drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() })))
  const played = (values: Record<string, number>, notes: DisplayNote[]) =>
    run({ sympathy: 0, ...values }, notes).filter((path) => path.points[0][0] < column)
  const length = (path: DrawnPath): number => path.points[1][0] - path.points[0][0]

  it('lights nothing at rest, and the strings of the chord for a key that sounds', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(run({}, [])).toHaveLength(0)
    expect(played({ chord: 0 }, [note(261.63, 0.2)])).toHaveLength(1)
    expect(played({ chord: 3, strum: 0 }, [note(261.63, 0.2)])).toHaveLength(6)
  })

  it('shortens the light to the time a string has left, and puts it out when it has rung', () => {
    const ring = zitherRingSeconds(261.63, 6)
    const early = played({ chord: 0 }, [note(261.63, ring * 0.1)])[0]
    const late = played({ chord: 0 }, [note(261.63, ring * 0.7)])[0]
    expect(length(late)).toBeLessThan(length(early))
    expect(played({ chord: 0 }, [note(261.63, ring * 1.05)])).toHaveLength(0)
  })

  it('damps a string from the key up in the Release time, and not at all at its top', () => {
    const let_go = [note(261.63, 1.5, 1)]
    expect(played({ chord: 0, release: 0.5 }, let_go)).toHaveLength(0)
    expect(played({ chord: 0, release: 20 }, let_go)).toHaveLength(1)
  })

  it('reaches the strings of a chord one after another, from the end Direction says', () => {
    // Six strings over 600 ms: one every 120 ms, so three are struck after 300 ms.
    const up = played({ chord: 3, strum: 600, direction: 0 }, [note(261.63, 0.3)])
    const down = played({ chord: 3, strum: 600, direction: 1 }, [note(261.63, 0.3)])
    expect(up).toHaveLength(3)
    expect(down).toHaveLength(3)
    // Low strings are at the foot: strummed down, the three that sound are the upper ones.
    expect(Math.max(...down.map((path) => path.points[0][1]))).toBeLessThan(
      Math.min(...up.map((path) => path.points[0][1])),
    )
  })

  it('draws no direction under Alternate, whose turn it cannot count', () => {
    // Six strings over 600 ms. After 300 ms each may have been reached, from one end or the other,
    // and none surely: all six are lit thin, the same picture whichever way the hand went.
    const during = played({ chord: 3, strum: 600, direction: 2 }, [note(261.63, 0.3)])
    expect(during).toHaveLength(6)
    expect(during.every((path) => path.width === 0.75)).toBe(true)
    // After 70 ms only the two end strings may have been reached.
    expect(played({ chord: 3, strum: 600, direction: 2 }, [note(261.63, 0.07)])).toHaveLength(2)
    // Once the hand has crossed them all they are lit in full, as under Up.
    const after = played({ chord: 3, strum: 600, direction: 2 }, [note(261.63, 0.7)])
    expect(after).toHaveLength(6)
    expect(after.every((path) => path.width > 0.75)).toBe(true)
    // A second key is drawn the same way: the display does not take turns of its own.
    const two = played({ chord: 3, strum: 600, direction: 2 }, [note(261.63, 5), note(392, 0.07)])
    expect(two.filter((path) => path.width === 0.75)).toHaveLength(2)
  })

  it('keeps a key from long ago still, however long it has been in the list', () => {
    const old = [note(261.63, 45, 44)]
    const first = played({ chord: 3, direction: 2, release: 20, decay: 20 }, old)
    const again = played({ chord: 3, direction: 2, release: 20, decay: 20 }, old)
    expect(again).toEqual(first)
  })

  it('keeps a hammered string held while any key that struck it is down', () => {
    // A3 and its octave, then A4 and its octave on top; A4 is let go. The hammer lands on the A4
    // string that A3 still holds, so it rings on; a finger stops it and plucks anew, and it is damped.
    const keys = [note(220, 1.2), note(440, 1, 0.9)]
    const settings = { chord: 1, strum: 0, release: 0.1, decay: 6 }
    expect(played({ ...settings, exciter: 2 }, keys)).toHaveLength(2)
    expect(played({ ...settings, exciter: 0 }, keys)).toHaveLength(1)
  })

  it('lights no more strings than the device has', () => {
    // Five keys of six strings each, no string twice: thirty are asked for and 24 can ring.
    const keys = [100, 107, 113, 127, 131].map((hz) => note(hz, 0.5))
    expect(played({ chord: 3, strum: 0, decay: 20 }, keys)).toHaveLength(24)
    expect(played({ chord: 3, strum: 0, decay: 20 }, keys.slice(0, 4))).toHaveLength(24)
    expect(played({ chord: 3, strum: 0, decay: 20 }, keys.slice(0, 3))).toHaveLength(18)
  })

  it('keeps a held string sounding under a roll', () => {
    const held = [note(261.63, 2)]
    expect(played({ chord: 0, decay: 0.5, roll: 0 }, held)).toHaveLength(0)
    expect(played({ chord: 0, decay: 0.5, roll: 8 }, held)).toHaveLength(1)
  })

  it('gives a string to the later of two notes on it', () => {
    expect(played({ chord: 0 }, [note(261.63, 2), note(261.63, 0.2)])).toHaveLength(1)
  })

  it('lights the sympathetic strings a played pitch falls on, as strongly as Sympathy couples them', () => {
    const answers = (sympathy: number) =>
      run({ chord: 0, sympathy }, [note(220, 0.2)]).filter((path) => path.points[0][0] >= column)
    expect(answers(0)).toHaveLength(0)
    // A3 is answered by the A string, by the E above (its third partial) and by the D (its fourth).
    const [a, d, e] = answers(1)
    expect(answers(1)).toHaveLength(3)
    expect(length(a)).toBeGreaterThan(length(e))
    expect(length(e)).toBeGreaterThan(length(d))
    // Sympathy is a gain: at 0.3 a string rings 10.5 dB less, which is 10.5 / 60 of the column.
    expect(length(a) - length(answers(0.3)[0])).toBeCloseTo((13 * 10.458) / 60, 2)
  })

  it('lets a sympathetic string ring on for its own time after its key is damped', () => {
    const state = display.init?.()
    const frame = (notes: DisplayNote[], dt: number) =>
      lights(
        drawnPaths(
          drawDisplay(display, params, {
            values: { chord: 0, sympathy: 1, release: 0.05 },
            notes,
            signal: testSignal(),
            state,
            dt,
          }),
        ),
      ).filter((path) => path.points[0][0] >= column)
    expect(frame([note(110, 0.2)], 0.016).length).toBeGreaterThan(0)
    // A second on the key is long let go and its string is out: the A string, 7 dB under it when
    // it was driven, rings 9 s and has lost a ninth of its light.
    const [a] = frame([note(110, 1.4, 1.2)], 1)
    const driven = 1 - 0.2 / zitherRingSeconds(110, 6) - 7 / 60
    expect(length(a) / 13).toBeCloseTo(driven - 1 / 9, 3)
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    for (const values of [
      {},
      { decay: 20, release: 0.05 },
      { chord: 3, direction: 1, strum: 600 },
      { chord: 3, direction: 2, strum: 600 },
    ]) {
      const view = viewOf(display, params, { values: values as Record<string, number> })
      const [decay, release] = display.handles?.(view) ?? []
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 3)
      expect(release.drag(release.x, release.y).release).toBeCloseTo(view.value('release'), 3)
      // To the right is longer.
      expect(decay.drag(decay.x + 6, decay.y).decay).toBeGreaterThan(view.value('decay'))
      expect(release.drag(release.x + 6, release.y).release).toBeGreaterThan(view.value('release'))
    }
  })
})

describe('the chord harp’s figures', () => {
  it('lay the held keys over the plate as `ChordHarp::build_plate` does', () => {
    const plate: number[] = []
    // The header's own example: C E G with three octaves is ten strings, C3 to C6.
    expect(chordHarpPlate([130.81, 164.81, 196], 3, plate)).toBe(10)
    expect(plate[0]).toBeCloseTo(130.81, 2)
    expect(plate[9]).toBeCloseTo(1046.48, 2)
    // Keys an octave apart are one string each octave, whatever order they were pressed in.
    expect(chordHarpPlate([196, 130.81, 261.62], 1, plate)).toBe(3)
    expect(plate.slice(0, 3).map(Math.round)).toEqual([131, 196, 262])
    // Nothing above the top edge, and a key above it is played octaves lower.
    expect(chordHarpPlate([2093], 4, plate)).toBe(2)
    expect(chordHarpKeyHz(5000)).toBe(2500)
  })

  it('cross the plate in the order `ChordHarp::next_string` gives', () => {
    expect(chordHarpPlucks(0, 10)).toBe(10)
    expect(chordHarpPlucks(2, 10)).toBe(19)
    expect([0, 9, 10, 18].map((pluck) => chordHarpString(2, 10, pluck))).toEqual([0, 9, 8, 0])
    expect(chordHarpString(1, 10, 0)).toBe(9)
    expect(chordHarpString(3, 10, 4)).toBe(-1)
  })

  it('pluck, ring and place a string as the header says', () => {
    expect(chordHarpVelocity(0)).toBe(0.25)
    expect(chordHarpVelocity(1)).toBe(1)
    expect(chordHarpStringDb(1.5, 1, 3)).toBeCloseTo(-30, 5)
    expect(chordHarpChimeShare(0.75, 3)).toBeCloseTo(0.5, 5)
    // `kToneLowHz` 300 to fifty times that at middle C; never under 1.2 times the string.
    expect(chordHarpCornerHz(0.5, 261.626)).toBeCloseTo(300 * Math.sqrt(50), 3)
    expect(chordHarpCornerHz(0, 1000)).toBe(1200)
    expect(chordHarpPan(-1, 0.6)).toBeCloseTo(-0.54, 5)
    // The pad: 80 ms in while the key is down, 300 ms out after.
    expect(chordHarpPadShare(0.04, null)).toBeCloseTo(0.5, 5)
    expect(chordHarpPadShare(1, 0.15)).toBeCloseTo(0.5, 5)
    expect(chordHarpPadShare(1, 0.4)).toBe(0)
  })
})

describe('the chord harp’s display', () => {
  const { display } = STRING_INSTRUMENT_FACES['chord-harp']
  const params = paramsOf('chord-harp')
  const drawn = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() }))
  /** The lit strings: each has a line in the accent from its cell to its place between the speakers. */
  const run = (values: Record<string, number>, notes: DisplayNote[]) => lights(drawn(values, notes))
  /** The beads: a dot in the accent for every pluck that still rings. */
  const beads = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawn(values, notes).filter((path) => path.kind === 'fill' && path.colour === accent)

  it('lights nothing at rest, and sweeps the held chord over Span octaves', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(run({}, [])).toHaveLength(0)
    // One key and three octaves: C4, C5, C6 and C7.
    expect(run({}, [note(261.63, 1)])).toHaveLength(4)
    expect(run({ span: 0 }, [note(261.63, 1)])).toHaveLength(2)
    expect(run({}, [note(130.81, 1), note(164.81, 1), note(196, 1)])).toHaveLength(10)
  })

  it('comes to one string after another, a Strum apart, from the end Direction says', () => {
    // 40 ms a string: two are plucked after 50 ms.
    const up = run({ direction: 0 }, [note(261.63, 0.05)])
    const down = run({ direction: 1 }, [note(261.63, 0.05)])
    expect(up).toHaveLength(2)
    expect(down).toHaveLength(2)
    expect(Math.min(...down.map((path) => path.points[0][0]))).toBeGreaterThan(
      Math.max(...up.map((path) => path.points[0][0])),
    )
    // At zero a key is one pluck.
    expect(run({ strum: 0 }, [note(261.63, 1)])).toHaveLength(1)
  })

  it('lets a string ring for the Sustain time, key down or not', () => {
    expect(run({}, [note(261.63, 1, 0.9)])).toHaveLength(4)
    expect(run({}, [note(261.63, 3.2)])).toHaveLength(0)
    expect(run({ sustain: 8 }, [note(261.63, 3.2)])).toHaveLength(4)
  })

  it('stops a sweep where it was when a later key starts the next', () => {
    // C3 is let go and D3 pressed 50 ms after it: C3 and C4 were plucked, then D3 to D6.
    expect(run({}, [note(130.81, 1, 0.97), note(146.83, 0.95)])).toHaveLength(6)
    // Within 30 ms the second key joins the sweep: one chord, C and D from C3 to C6.
    expect(run({}, [note(130.81, 1), note(146.83, 0.98)])).toHaveLength(7)
  })

  it('goes on from the string the finger is on when a key joins: a lower key that comes late is passed by', () => {
    // E3, then C3 12 ms and G3 22 ms after it, as a hand plays a chord. The device plucked E3 at
    // once, on a plate of E alone, and went up from there over C E G: nine plucks, and no C3.
    const hand = [note(164.81, 1), note(130.81, 0.988), note(196, 0.978)]
    const up = run({ direction: 0 }, hand)
    expect(up).toHaveLength(9)
    // The plate that is drawn is the whole chord's, ten strings from C3: its first cell stays dark.
    const cells = run({ direction: 0 }, [note(130.81, 1), note(164.81, 1), note(196, 1)])
    const firsts = (paths: DrawnPath[]) =>
      paths.map((path) => path.points[0][0]).sort((a, b) => a - b)
    expect(firsts(up)).toEqual(firsts(cells).slice(1))
    // Downwards the first pluck was the top of the E plate, E6, and then all ten of the chord's.
    expect(beads({ direction: 1 }, hand)).toHaveLength(11)
    expect(run({ direction: 1 }, hand)).toHaveLength(11)
    // Sent in one instant the three are one chord before the first pluck: ten strings from C3.
    const once = [note(164.81, 1), note(130.81, 1), note(196, 1)]
    expect(firsts(run({ direction: 0 }, once))).toEqual(firsts(cells))
  })

  it('lights no more strings than the device has', () => {
    // Four chords of thirteen strings each within the Sustain time: 52 plucks, 32 voices.
    const chords = [100, 107, 113, 127].flatMap((hz, i) =>
      [1, 1.26, 1.498].map((ratio) => note(hz * ratio, 2 - i * 0.3, 1.9 - i * 0.3)),
    )
    expect(run({ span: 3, strum: 1, sustain: 8 }, chords)).toHaveLength(32)
  })

  it('marks a Random pluck on its way down without a string, which nobody can tell', () => {
    const one = [note(261.63, 1)]
    expect(run({ direction: 3 }, one)).toHaveLength(0)
    expect(beads({ direction: 3 }, one)).toHaveLength(4)
    expect(beads({ direction: 0 }, one)).toHaveLength(4)
  })

  it('stands its handle on the foot of the slope, and a drag sets Sustain', () => {
    for (const values of [{}, { sustain: 0.2 }, { sustain: 8 }]) {
      const view = viewOf(display, params, { values: values as Record<string, number> })
      const [sustain] = display.handles?.(view) ?? []
      expect(sustain.drag(sustain.x, sustain.y).sustain).toBeCloseTo(view.value('sustain'), 3)
      expect(sustain.drag(sustain.x + 5, sustain.y).sustain).toBeGreaterThan(view.value('sustain'))
    }
  })
})

describe('the tanpura’s figures', () => {
  it('tune the four strings as `Tanpura::pluck` does', () => {
    expect([0, 1, 2].map((tuning) => tanpuraRatio(0, tuning, 2))).toEqual([3 / 4, 2 / 3, 15 / 16])
    expect(tanpuraRatio(3, 0, 8)).toBe(0.5)
    // Detune parts the two middle strings, half of it each way.
    expect(tanpuraRatio(1, 0, 8)).toBeCloseTo(Math.pow(2, -4 / 1200), 9)
    expect(tanpuraRatio(2, 0, 8)).toBeCloseTo(Math.pow(2, 4 / 1200), 9)
    expect(tanpuraAmp(0)).toBe(0.25)
    expect(tanpuraAmp(1)).toBe(1)
  })

  it('close the bridge on a string as `JawariString::render` does', () => {
    // `kGap` 0.1 and `kReach` 0.3: no contact under a tenth of a full pluck, all of it from four tenths.
    expect(tanpuraContact(0.1, 1)).toBe(0)
    expect(tanpuraContact(0.25, 1)).toBeCloseTo(0.5, 5)
    expect(tanpuraContact(1, 1)).toBe(1)
    // `contact_for`: Jawari to the power of one and a half.
    expect(tanpuraContact(1, 0.25)).toBeCloseTo(0.125, 5)
    // The bloom the header measured: all of it from 49 to 262 Hz, none from 784 Hz up.
    expect(tanpuraBloom(131)).toBe(1)
    expect(tanpuraBloom(33)).toBeCloseTo(0.3, 5)
    expect(tanpuraBloom(784)).toBe(0)
    expect(tanpuraBloom(1500)).toBe(0)
  })

  it('pluck the strings round and round, a quarter of Speed apart', () => {
    expect(tanpuraStringDb(0, 1, null, 1, 5, 12)).toBeCloseTo(-5, 5)
    // The second string waits a quarter of the round.
    expect(tanpuraStringDb(1, 1, null, 1, 5, 12)).toBeNull()
    expect(tanpuraStringDb(1, 2.25, null, 1, 5, 12)).toBeCloseTo(-5, 5)
    // The hand comes back to the first after Speed: it is plucked again.
    expect(tanpuraStringDb(0, 6, null, 1, 5, 12)).toBeCloseTo(-5, 5)
    expect(tanpuraRound(6.25, 5)).toBeCloseTo(0.25, 5)
    // The finger rests on it 30 ms before: 60 dB in 50 ms from then.
    expect(tanpuraStringDb(0, 4.99, null, 1, 5, 12)).toBeCloseTo(-24.95 - 24, 3)
    // Key up after 2 s, a second ago: no more plucks, and 60 dB in 3 s.
    expect(tanpuraStringDb(0, 3, 1, 1, 5, 12)).toBeCloseTo(-10 - 20, 5)
    // Struck again after 2 s while it was held, a second ago: the round stopped and nothing was damped.
    expect(tanpuraStringDb(0, 3, 1, 1, 5, 12, 0, null)).toBeCloseTo(-10 - 5, 5)
  })

  it('pluck a tick of the clock late on average, as `Tanpura::control` does', () => {
    // `kChunk` is 16 samples: a pluck waits for the tick after it is due, half a tick on average.
    expect(tanpuraPluckSeconds(5, 48000)).toBeCloseTo(1.25 + 8 / 48000, 9)
  })

  it('know the hand’s place only as well as its 3 % a pluck allows', () => {
    expect(tanpuraUnsure(0)).toBe(0)
    // `kTimeSpread`: each gap strays evenly within 3 %, 0.03 / √3 at a standard deviation; twice that after one pluck.
    expect(tanpuraUnsure(1)).toBeCloseTo(0.06 / Math.sqrt(3), 9)
    // A minute at the fastest Speed is 120 plucks: within 0.38 of a pluck. The device's own hands
    // were 0.20 off at a standard deviation there and 0.48 at worst, and over a pluck after ten minutes.
    expect(tanpuraUnsure(120)).toBeCloseTo(0.379, 3)
    expect(tanpuraUnsure(1200)).toBeGreaterThan(1)
  })

  it('give a string its mean level over the times its last pluck may have come at', () => {
    // Sure of the hand, 2 s after the pluck of a 5 s round: 10 dB down on a 12 s ring.
    expect(tanpuraStringDb(0, 502, null, 1, 5, 12, 0)).toBeCloseTo(-10, 5)
    // Unsure by half a second either way and clear of both plucks: the mean is the same.
    expect(tanpuraStringDb(0, 502, null, 1, 5, 12, 0.5)).toBeCloseTo(-10, 5)
    // Just after a pluck, half of the span is the end of the round before: 0.25 s and 4.75 s at the mean.
    expect(tanpuraStringDb(0, 500, null, 1, 5, 12, 0.5)).toBeCloseTo((-60 * 2.5) / 12, 5)
    // Unsure by half a round or more, nothing is known: the mean of the whole round, at any time.
    expect(tanpuraStringDb(0, 501, null, 1, 5, 12, 9)).toBeCloseTo((-60 * 2.5) / 12, 5)
    expect(tanpuraStringDb(0, 503.7, null, 1, 5, 12, 9)).toBeCloseTo((-60 * 2.5) / 12, 5)
  })
})

describe('the tanpura’s display', () => {
  const { display } = STRING_INSTRUMENT_FACES.tanpura
  const params = paramsOf('tanpura')
  const drawn = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() }))
  /** The lit arms of the round, two points each, and the lit strings, many. */
  const arms = (values: Record<string, number>, notes: DisplayNote[]) =>
    lights(drawn(values, notes)).filter((path) => path.points.length === 2)
  const strings = (values: Record<string, number>, notes: DisplayNote[]) =>
    lights(drawn(values, notes)).filter((path) => path.points.length > 2)
  /** The hands on the rim: an arc in the accent, which has no points of its own. */
  const hands = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawn(values, notes).filter(
      (path) => path.kind === 'stroke' && path.colour === accent && path.points.length === 0,
    )
  const long = (path: DrawnPath): number =>
    Math.hypot(path.points[1][0] - path.points[0][0], path.points[1][1] - path.points[0][1])
  /** How jagged a lit string is: the sharpest corner between three neighbours, in px. */
  const jagged = (path: DrawnPath): number =>
    Math.max(
      ...path.points
        .slice(2)
        .map(([, y], i) => Math.abs(y - 2 * path.points[i + 1][1] + path.points[i][1])),
    )

  it('lights nothing at rest, and one string after another as the hand goes round', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(arms({}, [])).toHaveLength(0)
    // A round of 5 s: a pluck every 1.25 s.
    expect(arms({}, [note(130.81, 0.2)])).toHaveLength(1)
    expect(strings({}, [note(130.81, 0.2)])).toHaveLength(1)
    expect(arms({}, [note(130.81, 1.3)])).toHaveLength(2)
    expect(arms({}, [note(130.81, 4)])).toHaveLength(4)
    expect(arms({ speed: 12 }, [note(130.81, 4)])).toHaveLength(2)
  })

  it('lets an arm run in as its string falls, and out again when it is plucked anew', () => {
    const [early] = arms({}, [note(130.81, 0.2)])
    const [late] = arms({}, [note(130.81, 4.5)])
    const [again] = arms({}, [note(130.81, 5.2)])
    expect(long(late)).toBeLessThan(long(early) * 0.8)
    expect(long(again)).toBeCloseTo(long(early), 2)
    // A shorter Decay lets it fall further in the same time.
    expect(long(arms({ decay: 3 }, [note(130.81, 2)])[0])).toBeLessThan(long(late))
  })

  it('shows the hand while the key is held, and lets the strings die within 3 s of the key up', () => {
    expect(hands({}, [note(130.81, 10)])).toHaveLength(1)
    expect(hands({}, [note(130.81, 10, 0.5)])).toHaveLength(0)
    expect(arms({}, [note(130.81, 10, 0.5)])).toHaveLength(4)
    expect(arms({}, [note(130.81, 10, 3.5)])).toHaveLength(0)
  })

  it('draws the hand over all the rim it may be on: a point at the key, a longer arc the longer it is held', () => {
    const arcs = (age: number) =>
      drawDisplay(display, params, { notes: [note(130.81, age)], signal: testSignal() })
        .calls.filter((call) => call.name === 'arc')
        .map((call) => (call.args[4] as number) - (call.args[3] as number))
        .filter((turn) => turn < 2 * Math.PI - 1e-6)
    // The rim and the gourd are whole circles; the hand is the one that is not.
    expect(arcs(0.1)).toHaveLength(1)
    expect(arcs(0.1)[0]).toBeLessThan(0.1)
    // After a minute at 5 s a round it may be a quarter of a pluck either way: an eighth of the rim in all.
    expect(arcs(60)[0]).toBeCloseTo(2 * tanpuraUnsure(60 / 1.25) * (Math.PI / 2), 2)
    expect(arcs(60)[0]).toBeGreaterThan(arcs(10)[0])
    // After a day nothing is known of it: the whole rim, and every string at its mean.
    expect(arcs(86400)).toHaveLength(0)
    const steady = (age: number) => arms({}, [note(130.81, age)]).map(long)
    expect(steady(86400)[0]).toBeCloseTo(steady(86401.7)[0], 3)
    expect(steady(86400)[0]).toBeCloseTo(steady(86400)[1], 3)
  })

  it('keeps the strings of a key struck again ringing until the new round comes to them', () => {
    // Held 4 s and struck again 0.5 s ago: the first string was plucked anew, the other three ring on.
    const twice = [note(130.81, 4.5, 0.5), note(130.81, 0.5)]
    const lit = arms({}, twice).map(long)
    expect(lit).toHaveLength(4)
    // Let go instead and played by another key, they would be damped: 60 dB in 3 s, not in 12.
    const other = [note(130.81, 4.5, 0.5), { ...note(130.81, 0.5), id: 7 }]
    expect(arms({}, other).map(long)[1]).toBeLessThan(lit[1])
  })

  it('makes a string buzz at the bridge as firmly as Jawari holds it, where the bridge can', () => {
    const low = [note(130.81, 0.2)]
    expect(jagged(strings({ jawari: 0 }, low)[0])).toBeLessThan(0.2)
    expect(jagged(strings({ jawari: 1 }, low)[0])).toBeGreaterThan(2)
    expect(jagged(strings({ jawari: 0.5 }, low)[0])).toBeLessThan(
      jagged(strings({ jawari: 1 }, low)[0]),
    )
    // From 784 Hz up the header found the string all but plain.
    expect(jagged(strings({ jawari: 1 }, [note(2093, 0.2)])[0])).toBeLessThan(0.2)
  })
})
