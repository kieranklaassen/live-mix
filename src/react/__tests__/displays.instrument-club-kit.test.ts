// The truth of the Club Kit's display: each of the twelve drums is set up as
// `cpp/devices/club-kit/club_kit.h` sets it up, stands in the lane its key
// says, is drawn as long as it rings, and is lit from the hit for as long as
// that. The numbers here are the header's own, written out, so a figure that
// moves in the display or in the header without the other fails here.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  CLUB_CHOKE_SEC,
  CLUB_DRUM_NAMES,
  CLUB_KIT_INSTRUMENT_FACES,
  CLUB_LANE_NAMES,
  CLUB_LIGHT_MOST_SEC,
  CLUB_LIT_LEAST,
  CLUB_LIT_MOST,
  clubAirSeconds,
  clubAirTone,
  clubChoke,
  clubCutHz,
  clubHitLevel,
  clubLaneBox,
  clubLeft,
  clubLength,
  clubLengthSpan,
  clubPartialTone,
  clubRemainingDb,
  clubRingSeconds,
  clubSecondsText,
  clubThick,
  clubToneFactor,
  clubTrackBox,
  clubTuning,
  clubVoice,
  clubVoiceBlank,
  clubX,
} from '../components/displays/instrument-club-kit'
import { PLATE_PALETTES } from '../components/plate-palettes'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  type RecordingContext,
} from './display-harness'

const params = stockDescriptors().get('club-kit')?.params ?? {}
const { display } = CLUB_KIT_INSTRUMENT_FACES['club-kit']
const { accent, ink } = PLAIN_COLOURS

const KICK = 0
const CRASH = 1
const SNARE = 2
const RIDE = 3
const RIM = 4
const CLOSED_HAT = 5
const SHAKER = 6
const OPEN_HAT = 7
const CLAP = 8
const LOW_CONGA = 9
const COWBELL = 10
const HIGH_CONGA = 11
const FIRM = 0
const DEEP = 1
const DUSTY = 2
const BRIGHT = 3

/** The keys of the octave a kit is written in, as pitches: middle C is key 0. */
const hzOf = (key: number, octave = 0): number => 440 * 2 ** ((60 + key + 12 * octave - 69) / 12)

let ids = 0
const note = (frequency: number, age: number, gain = 0.7): DisplayNote => ({
  id: ++ids,
  frequency,
  gain,
  age,
  // A hit is a one-shot: whether its key is still down changes nothing.
  released: null,
})

/** A drum at the defaults of `device.json` unless told: Firm, untuned, Length 1, Snap 0.45, struck at 0.7. */
const drum = (
  which: number,
  { kit = FIRM, semitones = 0, length = 1, snap = 0.45, gain = 0.7, rate = 48000 } = {},
) => clubVoice(which, kit, semitones, length, snap, gain, clubVoiceBlank(), rate)

describe('the club kit’s figures', () => {
  it('tune a hit by its octave and Tune, as far as three octaves, and ring it shorter the higher', () => {
    expect(clubTuning(hzOf(0), 0)).toBeCloseTo(0, 6)
    expect(clubTuning(hzOf(0, 1), -5)).toBeCloseTo(7, 6)
    // `kit::OctaveKey::semitones`: two octaves is as far as the key reaches, and Tune another.
    expect(clubTuning(hzOf(0, -3), -12)).toBeCloseTo(-36, 6)
    expect(clubTuning(hzOf(0, 4), 12)).toBeCloseTo(36, 6)
    // Line 564: an octave up rings a third shorter, an octave down half longer.
    expect(clubLength(1, 0)).toBe(1)
    expect(clubLength(1, 12)).toBeCloseTo(1 / 1.5, 6)
    expect(clubLength(4, -12)).toBeCloseTo(6, 6)
    // Line 565: Variation draws up to a quarter of an octave of length either way.
    expect(clubLengthSpan(0)).toBe(1)
    expect(clubLengthSpan(1)).toBeCloseTo(2 ** 0.25, 6)
    // Line 576: the softest hit is a quarter as loud as the hardest.
    expect([clubHitLevel(0), clubHitLevel(1)]).toEqual([0.25, 1])
    expect(clubHitLevel(0.7)).toBeCloseTo(0.775, 6)
  })

  it('set the kick up as `ClubKit::strike` does, lines 581 to 602', () => {
    const kick = drum(KICK)
    expect(kick.partials).toBe(1)
    expect(kick.hz[0]).toBeCloseTo(48.99943, 4)
    expect(kick.seconds[0]).toBeCloseTo(0.32, 6)
    // The click: 4 times Snap times the hardness of the hit (0.5 + 0.7 · 0.7), gone in 6 ms, in a band at 3.5 kHz.
    expect(kick.air).toBeCloseTo(4 * 0.45 * 0.99, 5)
    expect(kick.airSeconds).toBeCloseTo(0.006, 6)
    expect([kick.shaping, kick.shapeHz, kick.shapeQ]).toEqual(['band', 3500, 0.8])
    expect(kick.cut).toBeCloseTo(5000, 3)
    expect(kick.noiseClass).toBe(false)
    expect(drum(KICK, { snap: 0 }).air).toBe(0)
    // The band of its click and its top move by half the tuning (lines 597 and 599), not all of it.
    expect(drum(KICK, { semitones: 12 }).shapeHz).toBeCloseTo(3500 * Math.SQRT2, 2)
    expect(drum(KICK, { semitones: 12 }).cut).toBeCloseTo(5000 * Math.SQRT2, 2)
    // The characters (lines 289 to 299): Deep rests on F1 and rings 440 ms, Dusty 285 ms, Bright 265 ms.
    expect(drum(KICK, { kit: DEEP }).hz[0]).toBeCloseTo(43.65353, 4)
    expect(drum(KICK, { kit: DEEP }).seconds[0]).toBeCloseTo(0.44, 6)
    expect(drum(KICK, { kit: DUSTY }).seconds[0]).toBeCloseTo(0.285, 6)
    expect(drum(KICK, { kit: BRIGHT }).seconds[0]).toBeCloseTo(0.265, 6)
    expect(drum(KICK, { kit: DEEP }).cut).toBeCloseTo(5000 * 0.6, 3)
    expect(drum(KICK, { kit: DUSTY }).q).toBe(0.9)
    // No drum of tones is tuned under 24 Hz: two octaves down it is held there, longer and not lower.
    expect(drum(KICK, { semitones: -24 }).hz[0]).toBe(24)
    expect(drum(KICK, { semitones: -24 }).seconds[0]).toBeCloseTo(0.32 * 2.25, 6)
  })

  it('set the snare and the rim up, lines 623 to 680', () => {
    const snare = drum(SNARE)
    expect([snare.hz[0], snare.hz[1]]).toEqual([195.9977, 329.6276])
    // Snap: the tones give way to the noise.
    expect(snare.gain[0]).toBeCloseTo(0.6 * 0.775, 6)
    expect(snare.gain[1]).toBeCloseTo(0.4 * 0.775, 6)
    expect(snare.seconds[0]).toBeCloseTo(0.1, 6)
    expect(snare.seconds[1]).toBeCloseTo(0.07, 6)
    expect(snare.air).toBeCloseTo(0.35 + 0.65 * 0.45, 6)
    expect(snare.airSeconds).toBeCloseTo(0.18, 6)
    expect(snare.airAttack).toBeCloseTo(0.004 - 0.0037 * 0.45, 6)
    expect([snare.shaping, snare.shapeHz, snare.cut, snare.noiseClass]).toEqual([
      'high',
      1800,
      9000,
      true,
    ])
    // The other kits' tones are other white keys; Dusty's noise is twice as loud against them.
    expect(drum(SNARE, { kit: DEEP }).hz.slice(0, 2)).toEqual([146.8324, 220])
    expect(drum(SNARE, { kit: DUSTY }).hz.slice(0, 2)).toEqual([164.8138, 261.6256])
    expect(drum(SNARE, { kit: BRIGHT }).hz.slice(0, 2)).toEqual([220, 329.6276])
    expect(drum(SNARE, { kit: DUSTY, snap: 0 }).air).toBeCloseTo(0.7, 6)
    expect(drum(SNARE, { kit: DEEP }).airSeconds).toBeCloseTo(0.18 * 1.25, 6)
    expect(drum(SNARE, { kit: DEEP }).seconds[0]).toBeCloseTo(0.1 * 1.4, 6)

    const rim = drum(RIM)
    expect(rim.hz[0]).toBeCloseTo(523.2511, 3)
    expect(rim.hz[1]).toBeCloseTo(1567.982, 3)
    expect([rim.gain[0], rim.gain[1]]).toEqual([0.7, 0.55])
    expect(rim.seconds[0]).toBeCloseTo(0.045, 6)
    expect(rim.seconds[1]).toBeCloseTo(0.03, 6)
    expect(rim.air).toBeCloseTo((0.6 + 3 * 0.45) * 0.99, 5)
    expect(rim.airSeconds).toBeCloseTo(0.004, 6)
    expect([rim.shaping, rim.shapeHz, rim.shapeQ, rim.cut]).toEqual(['band', 3200, 1.2, 5000])
    // A side stick is short in every Kit: the root of the tonal drums' factor (line 667).
    expect(drum(RIM, { kit: DEEP }).seconds[0]).toBeCloseTo(0.045 * Math.sqrt(1.4), 6)
    expect(drum(RIM, { kit: BRIGHT }).hz[0]).toBeCloseTo(523.2511 * 1.122462, 3)
  })

  it('set the cymbals, the hats and the shaker up, lines 603 to 706', () => {
    const crash = drum(CRASH)
    expect(crash.partials).toBe(0)
    expect(crash.pulsed).toBe(true)
    expect(crash.airSeconds).toBeCloseTo(2.3, 6)
    // The stick: (1 + 1.5 · Snap) times the hardness over the wash, gone in a quarter of a second.
    expect(crash.bite).toBeCloseTo((1 + 1.5 * 0.45) * 0.99, 5)
    expect(crash.biteSeconds).toBe(0.25)
    expect([crash.shaping, crash.shapeHz, crash.shape2Hz, crash.cut]).toEqual([
      'high2',
      3400,
      2600,
      14000,
    ])
    // The bands of the metal move half as far as the tuning, and stop (lines 611 and 612).
    expect(drum(CRASH, { semitones: 12 }).shapeHz).toBeCloseTo(3400 * Math.SQRT2, 2)
    expect(drum(CRASH, { semitones: 36 }).shapeHz).toBe(9000)
    expect(drum(CRASH, { kit: DUSTY }).airSeconds).toBeCloseTo(2.3 * 0.8, 6)
    expect(drum(CRASH, { kit: BRIGHT }).cut).toBeCloseTo(14000 * 1.4, 3)

    const ride = drum(RIDE)
    expect(ride.partials).toBe(4)
    expect(ride.hz).toEqual([3520, 5274.041, 2349.318, 6271.927])
    expect(ride.gain).toEqual([1, 0.55, 0.4, 0.3])
    expect(ride.seconds.map((s) => Math.round(s * 100) / 100)).toEqual([0.95, 0.65, 1.15, 0.45])
    expect(ride.air).toBeCloseTo(0.45, 6)
    expect(ride.airSeconds).toBeCloseTo(1.25, 6)
    expect([ride.shapeHz, ride.shape2Hz, ride.cut]).toEqual([5200, 4200, 13000])
    // A sine over 0.45 of the sample rate is left out and keeps its length (lines 442 to 446).
    const high = drum(RIDE, { semitones: 24 })
    expect(high.gain).toEqual([1, 0.55, 0.4, 0])
    expect(high.seconds[3]).toBeCloseTo(0.45 / 2.25, 6)
    expect(drum(RIDE, { semitones: 24, rate: 44100 }).gain[1]).toBe(0)

    const closed = drum(CLOSED_HAT)
    const open = drum(OPEN_HAT)
    expect(closed.airSeconds).toBeCloseTo(0.05, 6)
    expect(open.airSeconds).toBeCloseTo(0.42, 6)
    expect([closed.shapeHz, closed.shape2Hz, closed.cut]).toEqual([7000, 5500, 11000])
    expect(closed.bite).toBeCloseTo(0.8 * 0.45 * 0.99, 5)
    expect(drum(OPEN_HAT, { kit: BRIGHT }).airSeconds).toBeCloseTo(0.42 * 1.05, 6)
    expect(drum(CLOSED_HAT, { semitones: 36 }).shapeHz).toBe(13000)

    const shaker = drum(SHAKER)
    expect(shaker.pulsed).toBe(false)
    expect(shaker.airSeconds).toBeCloseTo(0.075, 6)
    expect(shaker.airAttack).toBeCloseTo(0.008 - 0.004 * 0.45, 6)
    expect([shaker.shaping, shaker.shapeHz, shaker.cut]).toEqual(['high', 4500, 9500])
    expect(drum(SHAKER, { kit: DEEP }).airAttack).toBeCloseTo((0.008 - 0.004 * 0.45) * 1.6, 6)
  })

  it('set the clap, the congas and the cowbell up, lines 707 to 763', () => {
    const clap = drum(CLAP)
    // Four bursts 8 ms apart, each 22 ms to 60 dB, then the tail: five onsets, the fifth 32 ms in.
    expect([clap.bursts, clap.burstGap, clap.airSeconds]).toEqual([4, 0.008, 0.022])
    expect(clap.tailSeconds).toBeCloseTo(0.2, 6)
    expect(clubAirSeconds(clap)).toBeCloseTo(0.032 + 0.2, 6)
    expect([clap.shaping, clap.shapeHz, clap.shapeQ, clap.cut]).toEqual(['band', 1500, 1.2, 4200])
    expect(drum(CLAP, { kit: DEEP }).tailSeconds).toBeCloseTo(0.25, 6)

    const low = drum(LOW_CONGA)
    const high = drum(HIGH_CONGA)
    expect(low.hz[0]).toBeCloseTo(195.9977, 3)
    expect(high.hz[0]).toBeCloseTo(293.6648, 3)
    expect(low.hz[1]).toBeCloseTo(195.9977 * 1.4983071, 3)
    expect([low.gain[0], low.gain[1]]).toEqual([1, 0.35])
    expect(low.seconds[0]).toBeCloseTo(0.25, 6)
    expect(low.seconds[1]).toBeCloseTo(0.15, 6)
    expect(high.seconds[0]).toBeCloseTo(0.2, 6)
    // The slap: more of it on the high one, gone in 35 ms, in a band seven times the pitch.
    expect(low.air).toBeCloseTo(1.6 * 0.85 * 0.99, 5)
    expect(high.air).toBeCloseTo(2.4 * 0.85 * 0.99, 5)
    expect(low.airSeconds).toBeCloseTo(0.035, 6)
    expect(low.shapeHz).toBeCloseTo(195.9977 * 7, 2)
    expect(low.cut).toBeCloseTo(195.9977 * 13, 2)

    const bell = drum(COWBELL)
    expect(bell.partials).toBe(0)
    expect(bell.pulsed).toBe(true)
    expect(bell.airSeconds).toBeCloseTo(0.16, 6)
    expect(bell.bite).toBeCloseTo((0.5 + 0.6 * 0.45) * 0.99, 5)
    expect([bell.shaping, bell.shapeHz, bell.shapeQ, bell.cut, bell.noiseClass]).toEqual([
      'band',
      1200,
      0.9,
      3000,
      true,
    ])
  })
})

/**
 * How long each drum rings at Length 1, untuned, in seconds, in key order: the 60 dB times of
 * `ClubKit::strike` times the character's factors (lines 289 to 299), worked out by hand.
 * The snare is its noise, the ride its wash, the clap its four gaps of 8 ms and its tail.
 */
const RINGS: Record<number, number[]> = {
  [FIRM]: [0.32, 2.3, 0.18, 1.25, 0.045, 0.05, 0.075, 0.42, 0.232, 0.25, 0.16, 0.2],
  [DEEP]: [0.44, 2.3, 0.225, 1.25, 0.05324, 0.05, 0.09375, 0.42, 0.282, 0.35, 0.224, 0.28],
  [DUSTY]: [0.285, 1.84, 0.162, 1, 0.04269, 0.04, 0.0675, 0.336, 0.212, 0.225, 0.144, 0.18],
  [BRIGHT]: [
    0.265, 2.415, 0.162, 1.3125, 0.04149, 0.0525, 0.0675, 0.441, 0.212, 0.2125, 0.136, 0.17,
  ],
}
/** Length is a factor on all of it but the clap's bursts, which come 8 ms apart whatever it is. */
const ringAt = (kit: number, which: number, length: number): number =>
  which === CLAP ? 0.032 + (RINGS[kit][CLAP] - 0.032) * length : RINGS[kit][which] * length
const LENGTHS = [0.25, 1, 4]
const KITS = [FIRM, DEEP, DUSTY, BRIGHT]
const TWELVE = Array.from({ length: 12 }, (_, which) => which)

describe('how a club drum rings and dies', () => {
  it('rings as long as its slowest envelope takes to fall 60 dB, at three Lengths in each character', () => {
    for (const kit of KITS)
      for (const length of LENGTHS)
        for (const which of TWELVE)
          expect(
            clubRingSeconds(drum(which, { kit, length })),
            `${CLUB_DRUM_NAMES[which]}, kit ${kit}, Length ${length}`,
          ).toBeCloseTo(ringAt(kit, which, length), 4)
    // The octave of the key and Tune move it too: an octave down is half as long again.
    expect(clubRingSeconds(drum(CRASH, { semitones: -12 }))).toBeCloseTo(2.3 * 1.5, 5)
    // The longest: the Bright crash at Length 4, three octaves down, about half a minute to 60 dB.
    expect(clubRingSeconds(drum(CRASH, { kit: BRIGHT, length: 4, semitones: -36 }))).toBeCloseTo(
      2.415 * 4 * 3.375,
      3,
    )
  })

  it('falls 60 dB over that ring, the clap from its last burst', () => {
    expect(clubRemainingDb(drum(KICK), 0)).toBeCloseTo(0, 6)
    expect(clubRemainingDb(drum(KICK), 0.16)).toBeCloseTo(-30, 5)
    expect(clubRemainingDb(drum(KICK), 0.32)).toBeCloseTo(-60, 5)
    // The snare is its noise once its tones are gone.
    expect(clubRemainingDb(drum(SNARE), 0.09)).toBeCloseTo(-30, 5)
    // `ClubKit::render` holds the clap whole while bursts are still to come (line 907).
    expect(clubRemainingDb(drum(CLAP), 0.03)).toBe(0)
    expect(clubRemainingDb(drum(CLAP), 0.032 + 0.1)).toBeCloseTo(-30, 5)
    // What is left of a hit, as a share of its light.
    expect(clubLeft(drum(KICK), 0)).toBe(1)
    expect(clubLeft(drum(KICK), 0.08)).toBeCloseTo(0.75, 6)
    expect(clubLeft(drum(KICK), 0.32)).toBeCloseTo(0, 6)
    expect(clubLeft(drum(KICK), 0.4)).toBe(0)
  })

  it('goes dark at ten seconds however long it rings: the ceiling of a light', () => {
    expect(CLUB_LIGHT_MOST_SEC).toBe(10)
    const longest = drum(CRASH, { kit: BRIGHT, length: 4, semitones: -36 })
    expect(clubLeft(longest, 9.99)).toBeGreaterThan(0.6)
    expect(clubLeft(longest, 10)).toBe(0)
  })

  it('is choked in 8 ms, as `kChokeSeconds` and the fade of `ClubKit::render` have it', () => {
    expect(CLUB_CHOKE_SEC).toBe(0.008)
    expect(clubChoke(0)).toBe(1)
    expect(clubChoke(0.004)).toBeCloseTo(0.5, 6)
    expect(clubChoke(0.008)).toBe(0)
    expect(clubChoke(1)).toBe(0)
  })

  it('is cut by Tone as `ClubKit::follow_tone` moves its low-pass, which stops at 0.45 of the rate', () => {
    expect(clubToneFactor(0.5, false)).toBe(1)
    expect(clubToneFactor(1, false)).toBeCloseTo(4, 6)
    expect(clubToneFactor(0, true)).toBeCloseTo(2 ** -0.85, 6)
    expect(clubCutHz(drum(KICK), 0)).toBeCloseTo(1250, 3)
    expect(clubCutHz(drum(CLOSED_HAT), 1)).toBeCloseTo(11000 * 2 ** 0.85, 2)
    // The cymbals reach the stop before Tone is full up: the Firm crash from 0.875, the Bright one from 0.594.
    expect(clubCutHz(drum(CRASH), 0.86)).toBeLessThan(21600)
    expect(clubCutHz(drum(CRASH), 0.875)).toBe(21600)
    expect(clubCutHz(drum(CRASH, { kit: BRIGHT }), 0.57)).toBeLessThan(21600)
    expect(clubCutHz(drum(CRASH, { kit: BRIGHT }), 0.594)).toBe(21600)
    // So nothing of a cymbal is drawn as changing there, and below it dull is quieter.
    expect(clubAirTone(drum(CRASH), 0.875)).toBe(clubAirTone(drum(CRASH), 1))
    expect(clubAirTone(drum(CRASH, { kit: BRIGHT }), 0.6)).toBe(
      clubAirTone(drum(CRASH, { kit: BRIGHT }), 1),
    )
    expect(clubAirTone(drum(CRASH), 0.5)).toBe(1)
    expect(clubAirTone(drum(CRASH), 0)).toBeLessThan(0.8)
    expect(clubAirTone(drum(CLOSED_HAT), 0)).toBeLessThan(0.7)
    expect(clubAirTone(drum(CLOSED_HAT), 1)).toBeGreaterThan(1.1)
    // A sine far under the low-pass is left alone; the rim's upper one is not.
    expect(clubPartialTone(drum(KICK), 0, 0)).toBeCloseTo(1, 2)
    expect(clubPartialTone(drum(RIM), 1, 0.5)).toBe(1)
    expect(clubPartialTone(drum(RIM), 1, 0)).toBeLessThan(0.75)
  })

  it('draws a part as thick as it is loud, and never too thin to see', () => {
    expect(clubThick(12)).toBe(1)
    expect(clubThick(0)).toBeCloseTo(0.75, 6)
    expect(clubThick(-12)).toBeCloseTo(0.5, 6)
    expect(clubThick(-60)).toBe(0.2)
  })

  it('says a time to the millisecond under a tenth of a second', () => {
    expect(clubSecondsText(0.045)).toBe('45 ms')
    expect(clubSecondsText(0.32)).toBe('320 ms')
    expect(clubSecondsText(2.3)).toBe('2.3 s')
    expect(clubSecondsText(32.6)).toBe('33 s')
  })
})

interface Rect {
  x: number
  y: number
  w: number
  h: number
  alpha: number
}

/** The rectangles filled in the accent, with how strongly each was laid. */
function accentRects(drawn: RecordingContext): Rect[] {
  const out: Rect[] = []
  let fill = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fillRect' && fill === accent) {
      const [x, y, w, h] = call.args as number[]
      out.push({ x, y, w, h, alpha })
    }
  }
  return out
}

/** The colour each word was written in. */
function wordColours(drawn: RecordingContext): Map<string, string> {
  const out = new Map<string, string>()
  let fill = ''
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'fillText') out.set(String(call.args[0]), fill)
  }
  return out
}

const PEDAL = { width: 204, height: 100 }
const WIDE = { width: 600, height: 100 }
const FLAT = { width: 128, height: 100 }

const run = (
  values: Record<string, number>,
  notes: DisplayNote[],
  size = PEDAL,
  state?: unknown,
): RecordingContext =>
  runDisplay(display, params, 0.1, {
    values,
    notes,
    ...size,
    ...(state === undefined ? {} : { state }),
  })

/** The light on a lane: the accent laid over the whole of the drum's track; undefined while it is dark. */
const light = (drawn: RecordingContext, which: number, size = PEDAL): Rect | undefined => {
  const track = clubTrackBox(size, which)
  return accentRects(drawn).find(
    (rect) => rect.x === track.x && rect.y === track.y && rect.w === track.w && rect.h === track.h,
  )
}
const lanes = (drawn: RecordingContext, size = PEDAL): number[] =>
  TWELVE.filter((which) => light(drawn, which, size))

describe('the club kit’s lanes', () => {
  it('stand where their keys say: two columns of six in key order, each with room for its word', () => {
    for (const size of [FLAT, PEDAL, WIDE]) {
      for (const which of TWELVE) {
        const lane = clubLaneBox(size, which)
        const track = clubTrackBox(size, which)
        // C to F down the left column, F sharp to B down the right one.
        if (which >= 6) expect(lane.x).toBeGreaterThan(clubLaneBox(size, which - 6).x + lane.w)
        if (which % 6 > 0) expect(lane.y).toBeGreaterThanOrEqual(lastOf(size, which - 1))
        if (which >= 6) expect(lane.y).toBe(clubLaneBox(size, which - 6).y)
        // A word of 8 px has its lane, and the drum a track after it, inside the canvas.
        expect(lane.h).toBeGreaterThanOrEqual(10)
        expect(track.x - lane.x).toBeGreaterThanOrEqual(26)
        expect(track.w).toBeGreaterThanOrEqual(30)
        expect(track.x + track.w).toBeLessThanOrEqual(size.width - 4)
        expect(lane.y + lane.h).toBeLessThanOrEqual(size.height - 12)
      }
    }
  })

  it('name every drum at 8 px in full ink, and draw each as long as it rings', () => {
    for (const size of [FLAT, PEDAL, WIDE]) {
      const drawn = drawDisplay(display, params, { ...size })
      const colours = wordColours(drawn)
      for (const which of TWELVE) {
        const short = which === SHAKER && size.width < 160
        expect(colours.get(short ? 'Shkr' : CLUB_LANE_NAMES[which])).toBe(ink)
      }
    }
    for (const length of LENGTHS) {
      const drawn = drawDisplay(display, params, { ...PEDAL, values: { length } })
      for (const which of TWELVE) {
        const track = clubTrackBox(PEDAL, which)
        // The columns inked in the drum's track: the last is where the drum has fallen 60 dB,
        // to the pixel for tones and pulses and to the dot for noise, whose foot is every other pixel.
        const inked = drawn.calls
          .filter((call) => call.name === 'rect')
          .map((call) => call.args as number[])
          .filter(
            ([x, y]) =>
              x >= track.x && x < track.x + track.w && y >= track.y && y < track.y + track.h,
          )
        const end = Math.max(...inked.map(([x]) => x)) + 1
        const ring = ringAt(FIRM, which, length)
        expect(
          Math.abs(end - clubX(ring, track)),
          `${CLUB_DRUM_NAMES[which]} at Length ${length}`,
        ).toBeLessThan(2.01)
      }
    }
    // A millisecond at the left end of a track, ten seconds at its right, a decade a quarter of it.
    const track = clubTrackBox(PEDAL, KICK)
    expect(clubX(0.001, track)).toBe(track.x)
    expect(clubX(10, track)).toBe(track.x + track.w)
    expect(clubX(0.1, track)).toBeCloseTo(track.x + track.w / 2, 6)
    expect(clubX(40, track)).toBe(track.x + track.w)
  })
})

function lastOf(size: { width: number; height: number }, which: number): number {
  const lane = clubLaneBox(size, which)
  return lane.y + lane.h
}

describe('the club kit’s lights', () => {
  it('lights nothing at rest, and the lane of the key that was struck and no other', () => {
    expect(accentRects(drawDisplay(display, params)).length).toBe(0)
    expect(lanes(run({}, []))).toEqual([])
    for (const which of TWELVE) {
      const drawn = run({}, [note(hzOf(which), 0.002)])
      expect(lanes(drawn), CLUB_DRUM_NAMES[which]).toEqual([which])
      // Its word is in the accent, and every other word in the ink.
      const colours = wordColours(drawn)
      for (const other of TWELVE)
        expect(colours.get(CLUB_LANE_NAMES[other])).toBe(other === which ? accent : ink)
    }
    expect(lanes(run({}, [note(hzOf(0), 0.03), note(hzOf(2), 0.03), note(hzOf(9), 0.03)]))).toEqual(
      [KICK, SNARE, LOW_CONGA],
    )
    // At every size the light is the drum's own track.
    for (const size of [FLAT, WIDE])
      expect(lanes(run({}, [note(hzOf(8), 0.01)], size), size)).toEqual([CLAP])
  })

  it('lights a drum for as long as it rings: every drum, at three Lengths, in each character', () => {
    for (const kit of KITS)
      for (const length of LENGTHS)
        for (const which of TWELVE) {
          const ring = ringAt(kit, which, length)
          const what = `${CLUB_DRUM_NAMES[which]}, kit ${kit}, Length ${length}, ${ring} s`
          const at = (age: number): number[] =>
            lanes(run({ kit, length }, [note(hzOf(which), age)]))
          expect(at(0), what).toEqual([which])
          expect(at(ring * 0.98), what).toEqual([which])
          expect(at(ring * 1.02), what).toEqual([])
        }
  })

  it('goes out no sooner for letting the key go, and follows the octave of the key and Tune', () => {
    expect(lanes(run({}, [{ ...note(hzOf(0), 0.3), released: 0.29 }]))).toEqual([KICK])
    // An octave up the kick rings 213 ms, an octave down 480 ms: the same lane, lit both times.
    expect(lanes(run({}, [note(hzOf(0, 1), 0.2)]))).toEqual([KICK])
    expect(lanes(run({}, [note(hzOf(0, 1), 0.22)]))).toEqual([])
    expect(lanes(run({}, [note(hzOf(0, -1), 0.47)]))).toEqual([KICK])
    expect(lanes(run({ tune: -12 }, [note(hzOf(0), 0.47)]))).toEqual([KICK])
    expect(lanes(run({ tune: 12 }, [note(hzOf(0), 0.22)]))).toEqual([])
    // Two octaves apart at once is one lane: the newer hit is the one that is shown.
    expect(lanes(run({}, [note(hzOf(2, -2), 0.05), note(hzOf(2, 2), 0.01)]))).toEqual([SNARE])
    expect(lanes(run({}, [note(hzOf(0), 2), note(hzOf(0), 0.05)]))).toEqual([KICK])
  })

  it('lights a hit as strongly as it was struck and as much as is left of it, and never too faintly to see', () => {
    const span = CLUB_LIT_MOST - CLUB_LIT_LEAST
    const alpha = (age: number, gain: number): number =>
      light(run({}, [note(hzOf(0), age, gain)]), KICK)?.alpha ?? 0
    // A quarter into its ring a kick is 15 dB down: three quarters of its light.
    expect(alpha(0.08, 1)).toBeCloseTo(CLUB_LIT_LEAST + span * 0.75, 4)
    expect(alpha(0.24, 1)).toBeCloseTo(CLUB_LIT_LEAST + span * 0.25, 4)
    expect(alpha(0.08, 0)).toBeCloseTo(CLUB_LIT_LEAST + span * 0.75 * 0.25, 4)
    expect(alpha(0.319, 0)).toBeGreaterThanOrEqual(CLUB_LIT_LEAST)
    expect(CLUB_LIT_LEAST).toBeGreaterThanOrEqual(0.2)
  })

  it('puts a light out at ten seconds, however long the drum rings on', () => {
    // The crash at Length 4 an octave down takes 13.8 s to fall 60 dB.
    const long = { length: 4, tune: -12 }
    expect(lanes(run(long, [note(hzOf(1), 9.9)]))).toEqual([CRASH])
    expect(lanes(run(long, [note(hzOf(1), 10)]))).toEqual([])
    // The words still say the whole time.
    const state = display.init?.()
    run(long, [note(hzOf(1), 1)], PEDAL, state)
    expect(run(long, [], PEDAL, state).words()).toContain('Crash 14 s')
  })

  it('chokes the open hat with the closed hat, within 8 ms, and with nothing else', () => {
    const hat = (age: number) => note(hzOf(7), age)
    expect(lanes(run({}, [hat(0.1)]))).toEqual([OPEN_HAT])
    expect(lanes(run({}, [hat(0.1), note(hzOf(5), 0.01)]))).toEqual([CLOSED_HAT])
    expect(lanes(run({}, [hat(0.1), note(hzOf(5), 0.008)]))).toEqual([CLOSED_HAT])
    expect(lanes(run({}, [hat(0.1), note(hzOf(5), 0.007)]))).toEqual([CLOSED_HAT, OPEN_HAT])
    // In any octave it is the closed hat.
    expect(lanes(run({}, [hat(0.1), note(hzOf(5, 2), 0.02)]))).toEqual([CLOSED_HAT])
    // The shaker plays under an open hat (line 32), and so does every other drum.
    for (const other of TWELVE.filter((which) => which !== CLOSED_HAT && which !== OPEN_HAT))
      expect(lanes(run({}, [hat(0.1), note(hzOf(other), 0.01)]))).toContain(OPEN_HAT)
    // A closed hat struck before it does not choke it.
    expect(lanes(run({}, [note(hzOf(5), 0.03), hat(0.02)]))).toEqual([CLOSED_HAT, OPEN_HAT])
    // Half way through the 8 ms half of what was left is gone.
    const whole = light(run({}, [hat(0.1)]), OPEN_HAT)?.alpha ?? 0
    const half = light(run({}, [hat(0.1), note(hzOf(5), 0.004)]), OPEN_HAT)?.alpha ?? 0
    expect((half - CLUB_LIT_LEAST) / (whole - CLUB_LIT_LEAST)).toBeCloseTo(0.5, 4)
    // Struck again after the choke it sounds; once choked, a second closed hat finds nothing to choke.
    expect(lanes(run({}, [hat(0.5), note(hzOf(5), 0.3), hat(0.05)]))).toEqual([OPEN_HAT])
    expect(lanes(run({}, [hat(0.1), note(hzOf(5), 0.06), note(hzOf(5), 0.002)]))).toEqual([
      CLOSED_HAT,
    ])
  })
})

describe('the club kit’s knobs on its display', () => {
  it('says the character, and the drum last struck with how long it rings as struck', () => {
    const top = (drawn: RecordingContext): string[] =>
      drawn.words().filter((word) => !(CLUB_LANE_NAMES as readonly string[]).includes(word))
    expect(top(run({}, []))).toEqual(['Firm', 'Kick 320 ms'])
    expect(top(run({ kit: 1 }, []))).toEqual(['Deep', 'Kick 440 ms'])
    expect(top(run({ kit: 2, length: 2 }, []))).toEqual(['Dusty', 'Kick 570 ms'])
    expect(top(run({ kit: 3 }, []))).toEqual(['Bright', 'Kick 270 ms'])
    const state = display.init?.()
    expect(top(run({}, [note(hzOf(7), 0.02)], PEDAL, state))).toEqual(['Firm', 'Open hat 420 ms'])
    // An octave up it rings a third shorter, and that is what is said while it sounds.
    expect(top(run({}, [note(hzOf(7, 1), 0.02)], PEDAL, state))).toEqual([
      'Firm',
      'Open hat 280 ms',
    ])
    // It stays the drum that is shown once it has died, in the octave a kit is written in.
    expect(top(run({}, [], PEDAL, state))).toEqual(['Firm', 'Open hat 420 ms'])
    // The newest hit that sounds is the one that is said.
    expect(top(run({}, [note(hzOf(0), 0.1), note(hzOf(5), 0.02)], PEDAL, state))[1]).toBe(
      'Closed hat 50 ms',
    )
    expect(top(run({}, [note(hzOf(11), 0.01)], PEDAL, state))[1]).toBe('High conga 200 ms')
    // The words are in full ink, at every size.
    for (const size of [FLAT, PEDAL, WIDE]) {
      const colours = wordColours(run({}, [note(hzOf(1), 0.5)], size))
      expect(colours.get('Firm')).toBe(ink)
      expect(colours.get('Crash 2.3 s')).toBe(ink)
    }
  })

  it('draws at every extreme of every knob, at a pedal’s window and stretched wide', () => {
    const names = Object.keys(params)
    const struck = TWELVE.map((which) => note(hzOf(which, (which % 5) - 2), 0.004 * (which + 1)))
    for (const size of [PEDAL, WIDE]) {
      const settings: Record<string, number>[] = [
        {},
        Object.fromEntries(names.map((name) => [name, params[name].min])),
        Object.fromEntries(names.map((name) => [name, params[name].max])),
      ]
      for (const name of names)
        for (const end of ['min', 'max'] as const) settings.push({ [name]: params[name][end] })
      for (const values of settings)
        for (const notes of [[], struck]) {
          const drawn = run(values, notes, size)
          const what = `${JSON.stringify(values)} at ${size.width}`
          for (const { name, value } of drawn.numbers())
            if (!Number.isFinite(value)) throw new Error(`${what}: ${name} was handed ${value}`)
          // Twelve words for the lanes and two over them, none smaller than 8 px.
          expect(drawn.words().length, what).toBe(14)
          for (const call of drawn.calls)
            if (call.name === 'set font')
              expect(
                Number(/(\d+)px/.exec(String(call.args[0]))?.[1]),
                what,
              ).toBeGreaterThanOrEqual(8)
          // Nothing is drawn outside the canvas.
          for (const call of drawn.calls) {
            if (call.name !== 'rect' && call.name !== 'fillRect') continue
            const [x, y, w, h] = call.args as number[]
            expect(x, what).toBeGreaterThanOrEqual(0)
            expect(y, what).toBeGreaterThanOrEqual(0)
            expect(x + w, what).toBeLessThanOrEqual(size.width)
            expect(y + h, what).toBeLessThanOrEqual(size.height)
          }
        }
    }
  })

  it('changes what is drawn with each of the knobs it names', () => {
    expect(display.params).toEqual(['kit', 'tune', 'length', 'snap', 'tone', 'variation'])
    for (const size of [FLAT, PEDAL, WIDE])
      for (const name of display.params) {
        // The Kit starts at its first choice: two places to stand, and the rest have three.
        const places = [...new Set([params[name].min, params[name].default, params[name].max])]
        const pictures = places.map((value) =>
          drawDisplay(display, params, { ...size, values: { [name]: value } }).print(),
        )
        expect(new Set(pictures).size, `${name} at ${size.width}`).toBe(places.length)
      }
  })

  it('shades where Variation may end a hit, and nothing at none', () => {
    const shade = (variation: number): Rect[] => {
      const track = clubTrackBox(PEDAL, KICK)
      const out: Rect[] = []
      let fill = ''
      let alpha = 1
      for (const call of drawDisplay(display, params, { ...PEDAL, values: { variation } }).calls) {
        if (call.name === 'set fillStyle') fill = String(call.args[0])
        else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
        else if (call.name === 'fillRect' && fill === ink) {
          const [x, y, w, h] = call.args as number[]
          if (y === track.y && h === track.h && w < track.w) out.push({ x, y, w, h, alpha })
        }
      }
      return out
    }
    expect(shade(0)).toEqual([])
    const [most] = shade(1)
    const track = clubTrackBox(PEDAL, KICK)
    // From 2^-0.25 to 2^0.25 of the kick's 320 ms.
    expect(most.x).toBeCloseTo(clubX(0.32 / 2 ** 0.25, track), 6)
    expect(most.x + most.w).toBeCloseTo(clubX(0.32 * 2 ** 0.25, track), 6)
  })

  it('does not draw a cymbal as changing at the top of Tone', () => {
    const cymbals = (tone: number, kit: number): string => {
      const drawn = drawDisplay(display, params, { ...PEDAL, values: { tone, kit } })
      const rows = [clubTrackBox(PEDAL, CRASH), clubTrackBox(PEDAL, RIDE)]
      return drawn.calls
        .filter((call) => call.name === 'rect')
        .map((call) => call.args as number[])
        .filter(([x, y]) =>
          rows.some((row) => x >= row.x && x < row.x + row.w && y >= row.y && y < row.y + row.h),
        )
        .join(';')
    }
    // Firm: the crash stops at 0.875 and the ride at 0.938. Bright: at 0.594 and 0.656.
    expect(cymbals(0.94, FIRM)).toBe(cymbals(1, FIRM))
    expect(cymbals(0.66, BRIGHT)).toBe(cymbals(1, BRIGHT))
    expect(cymbals(0, FIRM)).not.toBe(cymbals(0.5, FIRM))
  })
})

describe('the club kit’s plate', () => {
  /** The contrast ratio of WCAG 2 between two colours written as #rrggbb. */
  const contrast = (a: string, b: string): number => {
    const channel = (hex: string, at: number): number => {
      const c = parseInt(hex.slice(at, at + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    const light = (hex: string): number =>
      0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)
    const [high, low] = [light(a), light(b)].sort((x, y) => y - x)
    return (high + 0.05) / (low + 0.05)
  }

  it('is a dark plate of its own with a pale ink and an accent that carries on both', () => {
    const { plate, ink: pale, accent: lit } = PLATE_PALETTES['club-kit']
    expect(contrast(pale, plate)).toBeGreaterThanOrEqual(7)
    expect(contrast(lit, plate)).toBeGreaterThanOrEqual(4.5)
    // A lit lane lies under the drum drawn in the ink: the two are told apart.
    expect(contrast(lit, pale)).toBeGreaterThanOrEqual(2)
    // No other plate has its colour, the soft kit's brown least of all.
    const others = Object.entries(PLATE_PALETTES).filter(([id]) => id !== 'club-kit')
    for (const [, palette] of others) expect(palette.plate).not.toBe(plate)
    expect(contrast(plate, PLATE_PALETTES['drum-kit'].plate)).toBeGreaterThan(1.1)
  })

  it('has the four knobs a hand reaches for first on its face', () => {
    expect(CLUB_KIT_INSTRUMENT_FACES['club-kit'].face).toEqual(['kit', 'tune', 'length', 'tone'])
    expect(drawnPaths(drawDisplay(display, params)).length).toBeGreaterThan(0)
  })
})
