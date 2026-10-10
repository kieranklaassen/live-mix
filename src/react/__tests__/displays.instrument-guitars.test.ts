// The truth of the guitars' displays: every figure is the device's own, a
// string is lit for as long as the device lets it sound, and what a knob does
// to a string that is played shows on it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  GUITAR_INSTRUMENT_FACES,
  acousticBoxDb,
  acousticCoupling,
  acousticLoopDb,
  acousticLoopHz,
  acousticLoopSeconds,
  acousticModeSeconds,
  acousticPickHz,
  acousticRingSeconds,
  acousticStringDb,
  acousticToneDb,
  guitarColourDb,
  guitarDampedLoss,
  guitarFretRatio,
  guitarHighSeconds,
  guitarLevelDb,
  guitarPickFraction,
  guitarPickHz,
  guitarPickupFraction,
  guitarPickupPlace,
  guitarRingSeconds,
  guitarString,
  guitarStringDb,
  guitarSwell,
  guitarWarmthDb,
  partialSeconds,
  steelAmpDb,
  steelBend,
  steelFret,
  steelPedalDb,
  steelPitch,
  steelPlayed,
  steelShake,
  steelString,
  steelSwell,
  stringLoss,
  strummed,
} from '../components/displays/instrument-guitars'
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
const { accent, ink } = PLAIN_COLOURS

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id: Math.round(frequency * 10), frequency, gain, age, released })
const hzOf = (key: number): number => 440 * Math.pow(2, (key - 69) / 12)
const db = (gain: number): number => 20 * Math.log10(gain)

/** Everything laid in the accent: what sounds now. */
const lit = (paths: DrawnPath[]): DrawnPath[] => paths.filter((path) => path.colour === accent)
/** The strings that swing: each is one filled shape in the accent. */
const spindles = (paths: DrawnPath[]): DrawnPath[] =>
  lit(paths).filter((path) => path.kind === 'fill' && path.points.length > 4)
/** The partials that sound now, in the lower part: one stroke of upright lines, two points each. */
const stems = (paths: DrawnPath[]): number =>
  lit(paths)
    .filter((path) => path.kind === 'stroke' && path.width === 2)
    .reduce((count, path) => count + path.points.length / 2, 0)
const xs = (path: DrawnPath): number[] => path.points.map(([x]) => x)
const ys = (path: DrawnPath): number[] => path.points.map(([, y]) => y)
const long = (path: DrawnPath): number => Math.max(...xs(path)) - Math.min(...xs(path))
const wide = (path: DrawnPath): number => Math.max(...ys(path)) - Math.min(...ys(path))

describe('what the guitars share', () => {
  it('picks a strummed chord from its lowest note up, a step apart', () => {
    const chord = [note(392, 1), note(261.63, 1), note(329.63, 0.99), note(880, 0.2)]
    const delays = strummed(chord, 0.016, [])
    expect(delays[0]).toBeCloseTo(0.032, 6)
    expect(delays[1]).toBe(0)
    expect(delays[2]).toBeCloseTo(0.016, 6)
    // A note alone is not held back.
    expect(delays[3]).toBe(0)
    expect(strummed(chord, 0, [])).toEqual([0, 0, 0, 0])
  })

  it('gives a string the loss `PluckedString::design` gives it', () => {
    // The fundamental rings as long as it is asked to, a partial at 3 kHz as long as the high partials are.
    const loss = stringLoss(110, 9, 0.45, 3000, 48000, { pole: 0, gain: 0 })
    expect(partialSeconds(loss, 110, 110, 48000)).toBeCloseTo(9, 1)
    expect(partialSeconds(loss, 110, 3000, 48000)).toBeCloseTo(0.45, 2)
    // Between the two a partial dies sooner the higher it is.
    const middle = partialSeconds(loss, 110, 1100, 48000)
    expect(middle).toBeLessThan(9)
    expect(middle).toBeGreaterThan(0.45)
    // A note above 3 kHz has its high decay set an octave above itself.
    const top = stringLoss(3500, 1, 0.5, 3000, 48000, { pole: 0, gain: 0 })
    expect(partialSeconds(top, 3500, 7000, 48000)).toBeCloseTo(0.5, 2)
  })
})

describe('the guitar’s figures', () => {
  it('put a note on the string `Guitar::string_for` puts it on', () => {
    expect(guitarString(82.407)).toBe(0)
    expect(guitarString(100)).toBe(0)
    expect(guitarString(110)).toBe(1)
    expect(guitarString(329.628)).toBe(5)
    expect(guitarString(4000)).toBe(5)
    // Under the low E the low string is lengthened.
    expect(guitarString(60)).toBe(0)
    expect(guitarFretRatio(60)).toBeCloseTo(60 / 82.407, 6)
    // E3 is the second fret of the D string.
    expect(guitarFretRatio(164.814)).toBeCloseTo(Math.pow(2, 2 / 12), 4)
  })

  it('place the pickup and the pick on what a fret leaves of the string', () => {
    // `guitar.h`: 42 mm and 162 mm on a 648 mm scale.
    expect(guitarPickupPlace(0)).toBe(0.065)
    expect(guitarPickupPlace(1)).toBe(0.25)
    expect(guitarPickupFraction(0.25, 1)).toBe(0.25)
    expect(guitarPickupFraction(0.065, 2)).toBeCloseTo(0.13, 6)
    // Past the middle of the string the comb folds back, and not under 0.12.
    expect(guitarPickupFraction(0.25, 3)).toBeCloseTo(0.25, 6)
    expect(guitarPickupFraction(0.25, 3.8)).toBe(0.12)
    expect(guitarPickFraction(0.14, 2)).toBeCloseTo(0.28, 6)
    expect(guitarPickFraction(0.35, 2)).toBe(0.5)
    expect(guitarPickFraction(0.05, 0.3)).toBe(0.02)
  })

  it('ring as long as `Guitar::sustain_seconds` and `ring_high_seconds` say', () => {
    expect(guitarRingSeconds(110, 9)).toBeCloseTo(9, 6)
    expect(guitarRingSeconds(440, 9)).toBeCloseTo(4.5, 6)
    expect(guitarRingSeconds(27.5, 9)).toBeCloseTo(9 * 1.4, 6)
    expect(guitarRingSeconds(4000, 10)).toBeCloseTo(2, 6)
    // The open A's top rings a twentieth as long as the note.
    expect(guitarHighSeconds(110, 9)).toBeCloseTo(0.45, 6)
    // Up the neck the loop's low-pass may take no more than its share of the fundamental's loss.
    const seconds = 9 * Math.sqrt(110 / 2000)
    expect(guitarHighSeconds(2000, 9)).toBeCloseTo((seconds * 0.25) / 0.6, 6)
    // And never under 60 ms.
    expect(guitarHighSeconds(110, 1)).toBeCloseTo(0.06, 6)
  })

  it('swell as `Guitar::render` does: 10 to 90 % in Swell', () => {
    expect(guitarSwell(0, 1.5)).toBe(0)
    expect(guitarSwell(0.5, 0)).toBe(1)
    expect(guitarSwell(10, 1.5)).toBe(1)
    // The smooth step passes 10 % at 0.1958 of its way and 90 % at 0.8042: 0.608 apart.
    const at = (share: number): number => (share * 1.5) / 0.608
    expect(guitarSwell(at(0.1958), 1.5)).toBeCloseTo(0.1, 3)
    expect(guitarSwell(at(0.8042), 1.5)).toBeCloseTo(0.9, 3)
    expect(at(0.8042) - at(0.1958)).toBeCloseTo(1.5, 2)
  })

  it('fall in two stages, beat at Shimmer, and are damped at key up', () => {
    expect(guitarStringDb(0, 1, null, 4, 0)).toBeCloseTo(0, 6)
    // `Guitar::strike`: a key at no gain still plucks a quarter as hard.
    expect(guitarStringDb(0, 0, null, 4, 0)).toBeCloseTo(db(0.25), 4)
    // After 0.55 of the ring the first polarisation is 60 dB down and the second holds the note.
    const second = 0.34 * Math.pow(10, -3 * 0.55)
    expect(guitarStringDb(2.2, 1, null, 4, 0)).toBeCloseTo(db((0.72e-3 + second) / 1.06), 4)
    // Half a beat on, the two are against each other.
    expect(guitarStringDb(1, 1, null, 4, 0.5)).toBeLessThan(guitarStringDb(1, 1, null, 4, 0) - 3)
    expect(guitarStringDb(2, 1, null, 4, 0.5)).toBeCloseTo(guitarStringDb(2, 1, null, 4, 0), 4)
    // `kDampSeconds`: from key up the tail falls 60 dB in 0.14 s.
    const held = guitarStringDb(1, 1, null, 10, 0)
    expect(guitarStringDb(1.14, 1, 0.14, 10, 0)).toBeLessThan(held - 59)
    // A key let go before its pick came is picked and damped at once.
    expect(guitarStringDb(0.07, 1, 0.5, 10, 0)).toBeCloseTo(guitarStringDb(0.07, 1, 0.07, 10, 0), 6)
  })

  it('colour a note as the pickup, the tone and the amplifier do', () => {
    const colour = (hz: number, pickup: number, tone = 1e9): number =>
      guitarColourDb(hz, 110, 0.14, pickup, 1e9, tone, 0)
    // A partial with a node at the pickup is missing: the fourth, with the pickup a quarter along.
    expect(colour(440, 0.25)).toBeLessThan(colour(330, 0.25) - 60)
    // And one with a node where the string is picked.
    expect(guitarColourDb(550, 110, 0.2, 0.13, 1e9, 1e9, 0)).toBeLessThan(colour(550, 0.13) - 60)
    // `kResonanceQ`: the peak at Tone stands 1.7 times over the level below it.
    expect(colour(3000, 0.13, 3000) - colour(3000, 0.13)).toBeCloseTo(db(1.7), 3)
    // `Guitar::apply`: a drive of 1 + 4 Warmth², made up by its power of -0.6.
    expect(guitarWarmthDb(0)).toBe(0)
    expect(guitarWarmthDb(1)).toBeCloseTo(db(Math.pow(5, 0.4)), 6)
    // `Guitar::strike`: the pick's corner, a thumb to a plectrum.
    expect(guitarPickHz(0, 0.7)).toBeCloseTo(300, 6)
    expect(guitarPickHz(1, 0.7)).toBeCloseTo(9600, 6)
  })

  it('give a note the level `Guitar::strike` gives it', () => {
    // `level_trim`: the pickup's place takes 2 sin(π q) from the fundamental, and that to the power of -0.5 is given back.
    expect(guitarLevelDb(110, 1 / 6)).toBeCloseTo(0, 6)
    expect(guitarLevelDb(110, 0.25)).toBeCloseTo(db(Math.pow(Math.SQRT2, -0.5)), 6)
    // `kPitchTilt`: two octaves over 110 Hz a note is 4^0.3 as loud, and never over 2.2 times or under 0.7.
    expect(guitarLevelDb(440, 1 / 6)).toBeCloseTo(db(Math.pow(4, 0.3)), 6)
    expect(guitarLevelDb(4000, 1 / 6)).toBeCloseTo(db(2.2), 6)
    expect(guitarLevelDb(24, 1 / 6)).toBeCloseTo(db(0.7), 6)
    // So from the neck to the bridge the fundamental loses half of what the comb alone takes, in dB.
    const comb = db(Math.sin(Math.PI * 0.065) / Math.sin(Math.PI * 0.25))
    const colour = (pickup: number): number => guitarColourDb(110, 110, 0.14, pickup, 1e9, 1e9, 0)
    expect(colour(0.065) - colour(0.25)).toBeCloseTo(comb / 2, 4)
  })

  it('lay a finger on the string as `Guitar::advance_damp` does: the top goes first', () => {
    // `kDampSeconds` and `kDampHighSeconds`: the tail has 0.14 s left, the partials near 3 kHz 35 ms.
    const loss = guitarDampedLoss(110, 9, 48000, { pole: 0, gain: 0 })
    expect(partialSeconds(loss, 110, 110, 48000)).toBeCloseTo(0.14, 3)
    expect(partialSeconds(loss, 110, 3000, 48000)).toBeCloseTo(0.035, 3)
  })
})

describe('the guitar’s display', () => {
  const { display } = GUITAR_INSTRUMENT_FACES.guitar
  const params = paramsOf('guitar')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(
      runDisplay(display, params, 0.1, {
        values: { strum: 0, ...values },
        notes,
        signal: testSignal(),
      }),
    )

  it('lights nothing at rest, and one string for each note that sounds', () => {
    expect(lit(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lit(run({}, []))).toHaveLength(0)
    expect(spindles(run({}, [note(110, 0.2), note(261.63, 0.2)]))).toHaveLength(2)
  })

  it('lights a string from the bridge to its fret', () => {
    // The open low E and the G♯ four frets up it.
    const open = spindles(run({}, [note(82.407, 0.2)]))[0]
    const fretted = spindles(run({}, [note(103.826, 0.2)]))[0]
    expect(Math.min(...xs(fretted))).toBeCloseTo(Math.min(...xs(open)), 6)
    expect(long(fretted) / long(open)).toBeCloseTo(Math.pow(2, -4 / 12), 4)
    // Both are on the low E, the line nearest the foot.
    expect(ys(fretted)[0]).toBeCloseTo(ys(open)[0], 6)
    // Another string is another line.
    const high = spindles(run({}, [note(329.628, 0.2)]))[0]
    expect(Math.min(...ys(high))).toBeLessThan(Math.min(...ys(open)) - 10)
  })

  it('lets the swing narrow as the note dies, and stills it when it has', () => {
    const ring = guitarRingSeconds(110, 9)
    const early = spindles(run({}, [note(110, ring * 0.05)]))[0]
    const late = spindles(run({}, [note(110, ring * 0.7)]))[0]
    expect(wide(late)).toBeLessThan(wide(early) * 0.6)
    expect(lit(run({}, [note(110, ring * 1.15)]))).toHaveLength(0)
    // Sustain is the time on the knob at the open A.
    expect(spindles(run({ sustain: 30 }, [note(110, ring * 1.15)]))).toHaveLength(1)
  })

  it('stills a string a moment after its key is let go', () => {
    expect(spindles(run({}, [note(110, 1, 0.02)]))).toHaveLength(1)
    expect(spindles(run({}, [note(110, 1, 0.3)]))).toHaveLength(0)
  })

  it('keeps a swelled note pale until the pedal is open', () => {
    const alpha = (swell: number, age: number): number =>
      spindles(run({ swell }, [note(110, age)]))[0].alpha
    expect(alpha(3, 0.1)).toBeLessThan(0.02)
    expect(alpha(3, 6)).toBeGreaterThan(alpha(3, 0.1) * 10)
    expect(alpha(0, 0.1)).toBeGreaterThan(0.3)
  })

  it('waits for a strummed chord’s upper strings, and gives a pitch to the later of two notes', () => {
    const chord = [note(110, 0.02), note(164.81, 0.02), note(220, 0.02)]
    expect(spindles(run({ strum: 0 }, chord))).toHaveLength(3)
    // 80 ms across six strings is 16 ms a string: after 20 ms two are picked. The run adds its frames.
    const early = drawnPaths(
      drawDisplay(display, params, { values: { strum: 80 }, notes: chord, signal: testSignal() }),
    )
    expect(spindles(early)).toHaveLength(2)
    expect(spindles(run({}, [note(110, 2), note(110, 0.2)]))).toHaveLength(1)
  })

  it('breathes with the beat of Shimmer', () => {
    // Half a beat after the pick the two polarisations are against each other.
    const still = spindles(run({ shimmer: 0 }, [note(110, 1)]))[0]
    const beating = spindles(run({ shimmer: 0.5 }, [note(110, 1 - 2 / 30)]))[0]
    expect(wide(beating)).toBeLessThan(wide(still) * 0.9)
  })

  it('shows the partials of a sounding note, the top ones gone first', () => {
    expect(stems(run({}, []))).toBe(0)
    const early = stems(run({}, [note(110, 0.05)]))
    const late = stems(run({}, [note(110, 3)]))
    expect(early).toBeGreaterThan(8)
    expect(late).toBeGreaterThan(0)
    expect(late).toBeLessThan(early)
    // A finger on the string takes the top in 35 ms and the tail in 0.14 s: 20 ms on, the low partials are still there.
    const held = stems(run({}, [note(110, 0.2)]))
    const stopped = stems(run({}, [note(110, 0.22, 0.02)]))
    expect(stopped).toBeGreaterThan(0)
    expect(stopped).toBeLessThan(held * 0.6)
  })

  it('leaves an open string without a finger, and ends a note under the low E at the nut', () => {
    /** The fingers on their frets: round, so with no points of their own. */
    const fingers = (paths: DrawnPath[]): DrawnPath[] =>
      lit(paths).filter((path) => path.kind === 'fill' && path.points.length === 0)
    expect(fingers(run({}, [note(110, 0.2)]))).toHaveLength(0)
    expect(fingers(run({}, [note(116.54, 0.2)]))).toHaveLength(1)
    // `guitar.h`: a note under the low E lengthens that string. The neck has no more of it to show.
    const open = spindles(run({}, [note(82.407, 0.2)]))[0]
    const under = spindles(run({}, [note(41.2, 0.2)]))[0]
    expect(long(under)).toBeCloseTo(long(open), 6)
    expect(ys(under)[0]).toBeCloseTo(ys(open)[0], 6)
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { pickup: 0.1, position: 0.3, tone: 2000 },
      { pickup: 1 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [pickup, position, tone] = display.handles?.(view) ?? []
      expect(pickup.drag(pickup.x, pickup.y).pickup).toBeCloseTo(view.value('pickup'), 3)
      expect(position.drag(position.x, position.y).position).toBeCloseTo(view.value('position'), 3)
      expect(tone.drag(tone.x, tone.y).tone).toBeCloseTo(view.value('tone'), 0)
      // Both stand on the string at their own share of it, so the pick at 0.25 is over the neck pickup.
      const neck = display.handles?.(viewOf(display, params, { values: { pickup: 1 } }))[0]
      const pick = display.handles?.(viewOf(display, params, { values: { position: 0.25 } }))[1]
      expect(pick?.x).toBeCloseTo(neck?.x ?? 0, 6)
    }
    const view = viewOf(display, params)
    const [pickup, , tone] = display.handles?.(view) ?? []
    // Right is towards the neck, and a higher peak.
    expect(pickup.drag(pickup.x - 5, pickup.y).pickup).toBeLessThan(view.value('pickup'))
    expect(tone.drag(tone.x + 5, tone.y).tone).toBeGreaterThan(view.value('tone'))
  })
})

describe('the acoustic guitar’s figures', () => {
  it('ring as long as `AcousticGuitar::ring_seconds` says', () => {
    expect(acousticRingSeconds(110, 5, 0)).toBeCloseTo(5, 6)
    expect(acousticRingSeconds(110, 5, 1)).toBeCloseTo(3.5, 6)
    expect(acousticRingSeconds(110, 5, 2)).toBeCloseTo(4.5, 6)
    expect(acousticRingSeconds(440, 5, 0)).toBeCloseTo(2.5, 6)
    expect(acousticRingSeconds(27.5, 5, 0)).toBeCloseTo(6.5, 6)
    expect(acousticRingSeconds(4000, 5, 0)).toBeCloseTo(1.25, 6)
  })

  it('lose a note on a body mode to the body, as `bridge_coupling` does', () => {
    expect(acousticCoupling(100)).toBeCloseTo(1, 6)
    expect(acousticCoupling(200)).toBeCloseTo(1, 6)
    expect(acousticCoupling(100 * Math.pow(2, 2 / 12))).toBeCloseTo(Math.exp(-2), 6)
    expect(acousticCoupling(150)).toBeLessThan(1e-4)
    // The two polarisations: 0.75 and 1.5 of the ring, the first up to 40 % sooner on a mode.
    expect(acousticLoopSeconds(0, 150, 4, 0)).toBeCloseTo(3, 3)
    expect(acousticLoopSeconds(1, 150, 4, 0)).toBeCloseTo(6, 6)
    expect(acousticLoopSeconds(0, 100, 4, 0)).toBeCloseTo(3 * 0.6, 6)
    // A twelve string's course: the low string, and the octave string 0.7 as long below B3.
    expect(acousticLoopSeconds(0, 150, 4, 2)).toBeCloseTo(4, 3)
    expect(acousticLoopSeconds(1, 150, 4, 2)).toBeCloseTo(2.8, 6)
    expect(acousticLoopSeconds(1, 300, 4, 2)).toBeCloseTo(4, 6)
    // `AcousticGuitar::pluck`: that octave string is a string of its own at twice the note, below 240 Hz and on no other guitar.
    expect(acousticLoopHz(0, 150, 2)).toBe(150)
    expect(acousticLoopHz(1, 150, 2)).toBe(300)
    expect(acousticLoopHz(1, 240, 2)).toBe(240)
    expect(acousticLoopHz(1, 150, 0)).toBe(150)
    expect(acousticLoopHz(1, 150, 1)).toBe(150)
  })

  it('fall in two stages, and by 60 dB over Release from key up', () => {
    expect(acousticStringDb(0, 1, null, 150, 4, 0, 1.5, 0)).toBeCloseTo(0, 4)
    expect(acousticStringDb(0, 0, null, 150, 4, 0, 1.5, 0)).toBeCloseTo(db(0.2), 4)
    // When the first loop has fallen 60 dB the second, a quarter of the note, has fallen 30.
    const second = 0.25 * Math.pow(10, -1.5)
    expect(acousticStringDb(3, 1, null, 150, 4, 0, 1.5, 0)).toBeCloseTo(db(0.75e-3 + second), 3)
    const held = acousticStringDb(1, 1, null, 150, 4, 0, 1, 0)
    expect(acousticStringDb(1, 1, 0.5, 150, 4, 0, 1, 0)).toBeCloseTo(held - 30, 4)
    // A key let go before its pluck came is plucked first and let go at once.
    expect(acousticStringDb(0.1, 1, 0.5, 150, 4, 0, 1, 0)).toBeCloseTo(
      acousticStringDb(0.1, 1, 0.1, 150, 4, 0, 1, 0),
      6,
    )
    // Half a beat of Shimmer on, the loops are against each other.
    expect(acousticStringDb(1, 1, null, 150, 4, 0, 1, 0.5)).toBeLessThan(held - 3)
    // One string of a course by itself starts at the top of its own scale.
    expect(acousticLoopDb(1, 0, 1, null, 150, 4, 2, 1)).toBeCloseTo(0, 4)
    expect(acousticLoopDb(1, 2.8, 1, null, 150, 4, 2, 1)).toBeCloseTo(-60, 3)
  })

  it('give the box its modes, the shelf its 20 dB and the pluck its corner', () => {
    // 60 dB after a knock: ln(1000) time constants of Q / (π f).
    expect(acousticModeSeconds(0)).toBeCloseTo((6.9078 * 14) / (Math.PI * 100), 4)
    // With no Body the string is heard bare.
    for (const hz of [80, 100, 500, 4000]) expect(acousticBoxDb(hz, 0)).toBeCloseTo(0, 6)
    // With all of it a partial on the air mode stands well over one between the two low modes,
    // and the box takes the string's own low end.
    expect(acousticBoxDb(100, 1)).toBeGreaterThan(acousticBoxDb(141, 1) + 6)
    expect(acousticBoxDb(200, 1)).toBeGreaterThan(acousticBoxDb(141, 1) + 6)
    expect(acousticBoxDb(141, 1)).toBeLessThan(-6)
    expect(acousticBoxDb(8000, 1)).toBeCloseTo(0, 0)
    expect(acousticToneDb(0)).toBe(-12)
    expect(acousticToneDb(0.6)).toBeCloseTo(0, 6)
    expect(acousticToneDb(1)).toBe(8)
    // `kFleshHz` to `kPickHz`, at the gain that leaves them as they are; steel is plucked 1.5 times as bright.
    const gain = 0.65 / 0.85
    expect(acousticPickHz(0, 1, gain, 100)).toBeCloseTo(650, 4)
    expect(acousticPickHz(1, 1, gain, 100)).toBeCloseTo(11000, 3)
    expect(acousticPickHz(0, 0, gain, 100)).toBeCloseTo(975, 4)
    // Never duller than the note's second partial.
    expect(acousticPickHz(0, 1, gain, 1000)).toBe(2000)
  })
})

describe('the acoustic guitar’s display', () => {
  const { display } = GUITAR_INSTRUMENT_FACES['acoustic-guitar']
  const params = paramsOf('acoustic-guitar')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(
      runDisplay(display, params, 0.1, {
        values: { strum: 0, ...values },
        notes,
        signal: testSignal(),
      }),
    )
  /** The sound hole lit and the fingers on their frets: round, so with no points of their own. */
  const rounds = (paths: DrawnPath[]): DrawnPath[] =>
    lit(paths).filter((path) => path.kind === 'fill' && path.points.length === 0)

  it('lights nothing at rest, and one string for each note that sounds', () => {
    expect(lit(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lit(run({}, []))).toHaveLength(0)
    expect(spindles(run({}, [note(110, 0.2), note(261.63, 0.2)]))).toHaveLength(2)
  })

  it('lights both strings of a twelve string’s course', () => {
    expect(spindles(run({ type: 2 }, [note(150, 0.2)]))).toHaveLength(2)
    // Below B3 the second is the thin octave string: it has died when 0.7 of the ring has passed.
    const ring = acousticRingSeconds(150, 5, 2)
    expect(spindles(run({ type: 2 }, [note(150, ring * 0.75)]))).toHaveLength(1)
  })

  it('lets the swing narrow as the note dies, sooner on nylon, and stills it when it has', () => {
    const ring = acousticRingSeconds(150, 5, 0)
    const early = spindles(run({}, [note(150, ring * 0.05)]))[0]
    const late = spindles(run({}, [note(150, ring * 0.6)]))[0]
    expect(wide(late)).toBeLessThan(wide(early) * 0.6)
    const nylon = spindles(run({ type: 1 }, [note(150, ring * 0.6)]))[0]
    expect(wide(nylon)).toBeLessThan(wide(late))
    // The quiet second loop, 12 dB under the note, rings 1.5 of the ring: 60 dB down at 1.2 of it.
    expect(spindles(run({}, [note(150, ring * 1.1)]))).toHaveLength(1)
    expect(lit(run({}, [note(150, ring * 1.3)]))).toHaveLength(0)
  })

  it('fades a note over Release from its key up', () => {
    const let_go = [note(150, 0.6, 0.4)]
    expect(spindles(run({ release: 0.05 }, let_go))).toHaveLength(0)
    expect(spindles(run({ release: 10 }, let_go))).toHaveLength(1)
    const short = spindles(run({ release: 0.8 }, let_go))[0]
    const longer = spindles(run({ release: 10 }, let_go))[0]
    expect(wide(short)).toBeLessThan(wide(longer))
  })

  it('lights the sound hole with as much of the body as is heard', () => {
    // With no Body the hole stays dark; the fingers on their frets are round too, and there with or without it.
    const bare = rounds(run({ body: 0 }, [note(150, 0.1)]))
    const full = rounds(run({ body: 1 }, [note(150, 0.1)]))
    const half = rounds(run({ body: 0.5 }, [note(150, 0.1)]))
    expect(full).toHaveLength(bare.length + 1)
    expect(half).toHaveLength(bare.length + 1)
    expect(Math.max(...half.map((path) => path.alpha))).toBeLessThan(
      Math.max(...full.map((path) => path.alpha)),
    )
    // The knock of the pluck has rung out of the body in a third of a second, and the hole sings on with the string.
    const knocked = Math.max(...full.map((path) => path.alpha))
    const later = rounds(run({ body: 1 }, [note(150, 0.6)]))
    expect(Math.max(...later.map((path) => path.alpha))).toBeLessThan(knocked)
    expect(later).toHaveLength(bare.length + 1)
  })

  it('waits for a strummed chord’s upper strings', () => {
    const chord = [note(110, 0.03), note(164.81, 0.03), note(220, 0.03)]
    const at = (strum: number) =>
      spindles(
        drawnPaths(
          drawDisplay(display, params, { values: { strum }, notes: chord, signal: testSignal() }),
        ),
      )
    expect(at(0)).toHaveLength(3)
    // 120 ms across six strings is 24 ms a string: after 30 ms two are plucked.
    expect(at(120)).toHaveLength(2)
  })

  it('shows the partials of a sounding note, nylon’s top ones gone sooner', () => {
    expect(stems(run({}, []))).toBe(0)
    const steel = stems(run({ type: 0 }, [note(110, 0.4)]))
    const nylon = stems(run({ type: 1 }, [note(110, 0.4)]))
    expect(steel).toBeGreaterThan(4)
    expect(nylon).toBeGreaterThan(0)
    expect(nylon).toBeLessThan(steel)
  })

  it('gives a twelve string’s low course the partials of both its strings', () => {
    /** How tall each partial of the open A stands at rest: the one stroke of upright lines in the ink that stands back. */
    const partials = (type: number): number[] => {
      const path = drawnPaths(drawDisplay(display, params, { values: { type } })).find(
        (drawn) =>
          drawn.kind === 'stroke' &&
          drawn.colour === ink &&
          drawn.alpha === 0.5 &&
          drawn.points.length >= 8 &&
          drawn.points.every(([x], index) => x === drawn.points[index - (index % 2)][0]),
      )
      const tall: number[] = []
      for (let index = 0; path && index < path.points.length; index += 2)
        tall.push(path.points[index][1] - path.points[index + 1][1])
      return tall
    }
    const steel = partials(0)
    const twelve = partials(2)
    // The fundamental is the low string's alone, and that is half the note: 6 dB, where 36 dB are 25 pixels.
    expect(steel[0] - twelve[0]).toBeCloseTo((db(2) * 25) / 36, 1)
    // The octave string adds its own to every second one, so the even partials stand over the odd ones beside them.
    expect(twelve[1] - twelve[0]).toBeGreaterThan(steel[1] - steel[0] + 3)
    expect(twelve[3] - twelve[2]).toBeGreaterThan(steel[3] - steel[2] + 3)
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { position: 0.4, tone: 0 },
      { position: 0.06, tone: 1 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [position, tone] = display.handles?.(view) ?? []
      expect(position.drag(position.x, position.y).position).toBeCloseTo(view.value('position'), 3)
      expect(tone.drag(tone.x, tone.y).tone).toBeCloseTo(view.value('tone'), 3)
    }
    const view = viewOf(display, params)
    const [position, tone] = display.handles?.(view) ?? []
    // Right is towards the sound hole, up is brighter.
    expect(position.drag(position.x + 5, position.y).position).toBeGreaterThan(
      view.value('position'),
    )
    expect(tone.drag(tone.x, tone.y - 3).tone).toBeGreaterThan(view.value('tone'))
  })
})

describe('the pedal steel’s figures', () => {
  it('pick a note on the string and fret `PedalSteel::pickup_fraction` picks', () => {
    // Middle C: the highest open string a third fret or more under it is the G♯3.
    expect(steelString(60)).toBe(4)
    expect(steelFret(60)).toBe(4)
    expect(steelString(67)).toBe(7)
    expect(steelFret(67)).toBe(3)
    expect(steelString(80)).toBe(9)
    expect(steelFret(80)).toBe(12)
    // Under the lowest string's third fret the bar stays on it.
    expect(steelString(40)).toBe(0)
    expect(steelFret(40)).toBe(3)
  })

  it('bend as two one-poles in a row do: 10 to 90 % in Glide', () => {
    expect(steelBend(0, 180)).toBe(0)
    expect(steelBend(10, 180)).toBeCloseTo(1, 6)
    // 1 - (1 + x) e^-x passes 10 % at x = 0.5318 and 90 % at 3.8897: 3.358 apart.
    const at = (x: number): number => (x / 3.358) * 0.18
    expect(steelBend(at(0.5318), 180)).toBeCloseTo(0.1, 3)
    expect(steelBend(at(3.8897), 180)).toBeCloseTo(0.9, 3)
    expect(at(3.8897) - at(0.5318)).toBeCloseTo(0.18, 3)
  })

  it('swell and ride the pedal as `PedalSteel::control` does', () => {
    expect(steelSwell(0, 0.4)).toBe(0)
    expect(steelSwell(0, 0)).toBe(1)
    // A raised cosine passes 10 % at 0.2048 of its way and 90 % at 0.7952: 0.5903 apart.
    const at = (share: number): number => (share * 0.4) / 0.5903
    expect(steelSwell(at(0.2048), 0.4)).toBeCloseTo(0.1, 3)
    expect(steelSwell(at(0.7952), 0.4)).toBeCloseTo(0.9, 3)
    // The foot makes good 0.7 of the string's 60 dB per Sustain until it has given 12 dB.
    expect(steelPedalDb(2, null, 14, 0)).toBeCloseTo(-0.3 * 60 * (2 / 14), 6)
    expect(steelPedalDb(4, null, 14, 0)).toBeCloseTo(-60 * (4 / 14) + 12, 6)
    expect(steelPedalDb(14, null, 14, 0)).toBeCloseTo(-48, 6)
    // `kReleaseSeconds`: a hand on the string takes it down 60 dB in 0.6 s.
    expect(steelPedalDb(2, 0.3, 14, 0)).toBeCloseTo(-60 * (1.7 / 14 + 0.3 / 0.6) + 6, 6)
    expect(steelPedalDb(0.2, null, 14, 0.4)).toBeLessThan(steelPedalDb(0.2, null, 14, 0) - 6)
  })

  it('still the bar at a pick and let it shake again', () => {
    expect(steelShake(0, 0.35)).toBe(0)
    expect(steelShake(0, 0.85)).toBeCloseTo(1 - Math.exp(-1), 6)
    expect(steelShake(1, 0.04)).toBeCloseTo(Math.exp(-1), 6)
    expect(steelShake(1, 0.3)).toBeLessThan(0.001)
    expect(steelShake(0, 10)).toBeCloseTo(1, 6)
  })

  it('colour the strings as `SteelAmp::process` does: a resonant low-pass at Tone, then the speaker', () => {
    const bare = (hz: number): number => steelAmpDb(hz, 1e9)
    // `kResonanceQ`: the peak at Tone stands 1.6 times over the level under it.
    expect(steelAmpDb(3200, 3200) - bare(3200)).toBeCloseTo(db(1.6), 3)
    // Well under Tone nothing is taken; two octaves over it, 12 dB an octave.
    expect(steelAmpDb(200, 3200) - bare(200)).toBeCloseTo(0, 1)
    expect(steelAmpDb(8000, 2000) - bare(8000)).toBeCloseTo(-24, 0)
    // What no knob moves: the scoop's 4 dB at 500 Hz, nothing under 90 Hz, and a fourth-order low-pass at 6 kHz.
    expect(bare(500)).toBeCloseTo(-4, 0)
    expect(bare(45)).toBeLessThan(bare(90) - 8)
    expect(bare(12000) - bare(6000)).toBeLessThan(-20)
    expect(bare(12000) - bare(6000)).toBeGreaterThan(-24)
  })

  describe('makes strings of the keys as `PedalSteel::note_on` does', () => {
    const blank = () =>
      (
        GUITAR_INSTRUMENT_FACES['pedal-steel'].display.init?.() as {
          strings: Parameters<typeof steelPlayed>[4]
        }
      ).strings
    const played = (notes: DisplayNote[], range = 2) => steelPlayed(notes, range, 14, [], blank())

    it('bends a held string to a neighbour within Range, and picks nothing', () => {
      const strings = played([note(hzOf(60), 1), note(hzOf(62), 0.5)])
      expect(strings.count).toBe(1)
      expect(strings.target[0]).toBeCloseTo(62, 4)
      // Half a second into a 180 ms glide it is there; into an 800 ms one, on its way.
      expect(steelPitch(strings, 0, 180)).toBeCloseTo(62, 2)
      expect(steelPitch(strings, 0, 800)).toBeCloseTo(60 + 2 * steelBend(0.5, 800), 4)
      // A quarter tone past Range still bends; further picks a string of its own.
      expect(played([note(hzOf(60), 1), note(hzOf(62.2), 0.5)]).count).toBe(1)
      expect(played([note(hzOf(60), 1), note(hzOf(63), 0.5)]).count).toBe(2)
      expect(played([note(hzOf(60), 1), note(hzOf(63), 0.5)], 12).count).toBe(1)
    })

    it('picks every note while Range is at zero, and the notes of a chord struck together', () => {
      expect(played([note(hzOf(60), 1), note(hzOf(62), 0.5)], 0).count).toBe(2)
      expect(played([note(hzOf(60), 1), note(hzOf(62), 0.97)]).count).toBe(2)
      expect(played([note(hzOf(60), 1), note(hzOf(62), 0.94)]).count).toBe(1)
    })

    it('bends back when the new key is let go, and picks afresh after the old one is', () => {
      const back = played([note(hzOf(60), 2), note(hzOf(62), 1, 0.5)])
      expect(back.count).toBe(1)
      expect(back.target[0]).toBeCloseTo(60, 4)
      expect(steelPitch(back, 0, 800)).toBeGreaterThan(60.1)
      expect(steelPitch(back, 0, 20)).toBeCloseTo(60, 3)
      expect(back.let[0]).toBeLessThan(0)
      const afresh = played([note(hzOf(60), 2, 1.5), note(hzOf(62), 1)])
      expect(afresh.count).toBe(2)
      expect(afresh.let[0]).toBeCloseTo(1.5, 6)
    })

    it('raises the lower of two strings as near, and leaves a string that has rung out', () => {
      const strings = played([note(hzOf(60), 2), note(hzOf(64), 1.5), note(hzOf(62), 1)])
      expect(strings.count).toBe(2)
      expect(strings.target[0]).toBeCloseTo(62, 4)
      expect(strings.target[1]).toBeCloseTo(64, 4)
      // 140 dB at 60 dB per 2 s of Sustain is 4.7 s: a string held longer than that is free.
      const notes = [note(hzOf(60), 6), note(hzOf(62), 1)]
      expect(steelPlayed(notes, 2, 2, [], blank()).count).toBe(2)
      expect(steelPlayed(notes, 2, 14, [], blank()).count).toBe(1)
    })

    it('keeps a string on the string and fret it was picked at, however often it is bent', () => {
      // A trill: ten times up a tone and nine times back, more bends than are kept one by one.
      const trill = [note(hzOf(60), 24)]
      for (let n = 0; n < 10; n++) trill.push(note(hzOf(62), 20 - 2 * n, n < 9 ? 19 - 2 * n : null))
      const strings = steelPlayed(trill, 2, 40, [], blank())
      expect(strings.count).toBe(1)
      expect(strings.note[0]).toBeCloseTo(60, 4)
      expect(strings.target[0]).toBeCloseTo(62, 4)
      expect(steelPitch(strings, 0, 20)).toBeCloseTo(62, 3)
    })
  })
})

describe('the pedal steel’s display', () => {
  const { display } = GUITAR_INSTRUMENT_FACES['pedal-steel']
  const params = paramsOf('pedal-steel')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(
      runDisplay(display, params, 0.1, {
        values: { swell: 0, vibrato: 0, ...values },
        notes,
        signal: testSignal(),
      }),
    )
  /** The part of the bar on a string that sounds, and the string lit up to it. */
  const bars = (paths: DrawnPath[]): DrawnPath[] =>
    lit(paths).filter((path) => path.kind === 'stroke' && path.width === 5)
  const strings = (paths: DrawnPath[]): DrawnPath[] =>
    lit(paths).filter(
      (path) => path.kind === 'stroke' && path.width < 5 && path.points.length === 2,
    )
  /** The bar's shake, lit: the one long line in the accent. */
  const waves = (paths: DrawnPath[]): DrawnPath[] =>
    lit(paths).filter((path) => path.kind === 'stroke' && path.points.length > 10)
  /** The whole bar at rest: the one heavy slug in the ink. */
  const rest = (paths: DrawnPath[]): DrawnPath[] =>
    paths.filter((path) => path.kind === 'stroke' && path.colour === ink && path.width === 6)

  it('lights nothing at rest, where the bar lies across every string', () => {
    const still = drawnPaths(drawDisplay(display, params))
    expect(lit(still)).toHaveLength(0)
    expect(rest(still)).toHaveLength(1)
    expect(lit(run({}, []))).toHaveLength(0)
  })

  it('lights a picked string from the bridge up to the bar', () => {
    const one = run({}, [note(hzOf(60), 0.2)])
    expect(bars(one)).toHaveLength(1)
    expect(strings(one)).toHaveLength(1)
    expect(rest(one)).toHaveLength(0)
    expect(Math.max(...xs(strings(one)[0]))).toBeCloseTo(bars(one)[0].points[0][0], 6)
    // A chord is a string each, the bar on each one's own fret.
    const chord = run({}, [note(hzOf(60), 0.2), note(hzOf(64), 0.2), note(hzOf(67), 0.2)])
    expect(bars(chord)).toHaveLength(3)
    expect(new Set(bars(chord).map((bar) => bar.points[0][0])).size).toBe(3)
  })

  it('slides the bar when a neighbour bends the string, as fast as Glide', () => {
    const bridge = (paths: DrawnPath[]): number => Math.min(...xs(strings(paths)[0]))
    const sounding = (paths: DrawnPath[]): number => bars(paths)[0].points[0][0] - bridge(paths)
    const alone = sounding(run({}, [note(hzOf(60), 3)]))
    const bent = (glide: number): number =>
      sounding(run({ glide }, [note(hzOf(60), 3), note(hzOf(62), 0.3)]))
    expect(bars(run({}, [note(hzOf(60), 3), note(hzOf(62), 0.3)]))).toHaveLength(1)
    // Two frets up the string is 2^(-2/12) as long.
    expect(bent(20) / alone).toBeCloseTo(Math.pow(2, -2 / 12), 3)
    expect(bent(800)).toBeGreaterThan(bent(20) + 1)
    expect(bent(800)).toBeLessThan(alone)
  })

  it('lets a string thin as it dies and puts it out when the device would', () => {
    const heavy = strings(run({}, [note(hzOf(60), 0.5)]))[0]
    const thin = strings(run({}, [note(hzOf(60), 10)]))[0]
    expect(thin.width).toBeLessThan(heavy.width)
    // Held, it is 60 dB under its pick at 1.2 of Sustain: 12 dB of that the pedal made good.
    expect(bars(run({ sustain: 5 }, [note(hzOf(60), 5.5)]))).toHaveLength(1)
    expect(lit(run({ sustain: 5 }, [note(hzOf(60), 6.3)]))).toHaveLength(0)
    // Let go, a hand takes it down in 0.6 s.
    expect(bars(run({}, [note(hzOf(60), 1, 0.3)]))).toHaveLength(1)
    expect(lit(run({}, [note(hzOf(60), 1.5, 0.8)]))).toHaveLength(0)
  })

  it('hides the pick behind the swell', () => {
    const at = (swell: number): number => strings(run({ swell }, [note(hzOf(60), 0.3)]))[0].width
    expect(at(2)).toBeLessThan(at(0.4))
    expect(at(0.4)).toBeLessThan(at(0))
  })

  it('lights the bar’s wave once it shakes again after a pick', () => {
    expect(waves(run({ vibrato: 20 }, [note(hzOf(60), 0.2)]))).toHaveLength(0)
    expect(waves(run({ vibrato: 20 }, [note(hzOf(60), 2)]))).toHaveLength(1)
    expect(waves(run({ vibrato: 0 }, [note(hzOf(60), 2)]))).toHaveLength(0)
    // A later pick stills it again for every string.
    expect(waves(run({ vibrato: 20 }, [note(hzOf(60), 2), note(hzOf(72), 0.1)]))).toHaveLength(0)
  })

  it('keeps a string’s piece of the bar within the bar', () => {
    const whole = rest(drawnPaths(drawDisplay(display, params)))[0]
    // The lowest string and the highest: three strings long would run over the neck's edges.
    for (const key of [50, 80]) {
      const piece = bars(run({}, [note(hzOf(key), 0.2)]))[0]
      expect(Math.min(...ys(piece))).toBeGreaterThanOrEqual(Math.min(...ys(whole)))
      expect(Math.max(...ys(piece))).toBeLessThanOrEqual(Math.max(...ys(whole)))
    }
  })

  it('draws the amplifier’s curve among the words, falling from Tone', () => {
    /** The curve: the one long line in the ink over the neck. */
    const curve = (tone: number, width?: number): DrawnPath | undefined =>
      drawnPaths(drawDisplay(display, params, { values: { tone }, width })).find(
        (path) =>
          path.kind === 'stroke' &&
          path.colour === ink &&
          path.points.length > 10 &&
          Math.max(...ys(path)) < 20,
      )
    /** How far along it the curve still stands over its foot. */
    const reach = (tone: number, width?: number): number => {
      const points = curve(tone, width)?.points ?? []
      const foot = Math.max(...points.map(([, y]) => y))
      return Math.max(...points.filter(([, y]) => y < foot - 0.5).map(([x]) => x)) - points[0][0]
    }
    for (const width of [128, 204]) {
      expect(curve(3200, width)).toBeDefined()
      // A darker Tone falls sooner; over the speaker's 6 kHz there is little left wherever Tone is.
      expect(reach(1500, width)).toBeLessThan(reach(3200, width) - 1)
      expect(reach(3200, width)).toBeLessThan(reach(6000, width) - 1)
    }
    // Tone in its unit stands beside the curve where there is room for it.
    expect(drawDisplay(display, params, { width: 204 }).words()).toContain('3.2 kHz')
    expect(drawDisplay(display, params, { width: 128 }).words()).not.toContain('3.2 kHz')
  })

  it('leaves the note’s name out where it would crowd the curve', () => {
    const words = (width: number): string[] =>
      drawDisplay(display, params, {
        width,
        notes: [note(hzOf(60), 0.2)],
        signal: testSignal(),
      }).words()
    expect(words(204)).toContain('C4 14 s')
    expect(words(128)).toContain('14 s')
    expect(words(128)).not.toContain('C4 14 s')
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { pick: 0, swell: 2, sustain: 40 },
      { pick: 1, sustain: 2 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [pick, swell, sustain] = display.handles?.(view) ?? []
      expect(pick.drag(pick.x, pick.y).pick).toBeCloseTo(view.value('pick'), 3)
      expect(swell.drag(swell.x, swell.y).swell).toBeCloseTo(view.value('swell'), 3)
      expect(sustain.drag(sustain.x, sustain.y).sustain).toBeCloseTo(view.value('sustain'), 2)
    }
    const view = viewOf(display, params)
    const [pick, swell, sustain] = display.handles?.(view) ?? []
    // A harder pick is nearer the bridge at the left; right is a longer swell and a longer ring.
    expect(pick.drag(pick.x - 3, pick.y).pick).toBeGreaterThan(view.value('pick'))
    expect(swell.drag(swell.x + 5, swell.y).swell).toBeGreaterThan(view.value('swell'))
    expect(sustain.drag(sustain.x + 5, sustain.y).sustain).toBeGreaterThan(view.value('sustain'))
    // No swell at all stands at the left edge and stays none when taken.
    const none = viewOf(display, params, { values: { swell: 0 } })
    const edge = display.handles?.(none)[1]
    expect(edge?.drag(edge.x, edge.y).swell).toBe(0)
  })
})
