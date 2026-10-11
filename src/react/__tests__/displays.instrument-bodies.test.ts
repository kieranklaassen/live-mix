// The truth of the bodies' displays: every figure is the device's own, a
// note is lit on the part it plays for as long as the device lets it sound,
// and what a knob does to a note that sounds shows on it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  BODY_INSTRUMENT_FACES,
  feedbackAsked,
  feedbackBloom,
  feedbackCost,
  feedbackCrowdPower,
  feedbackDrive,
  feedbackFaint,
  feedbackFavoured,
  feedbackFit,
  feedbackGrown,
  feedbackHeld,
  feedbackHold,
  feedbackHolds,
  feedbackHz,
  feedbackLean,
  feedbackLift,
  feedbackLoss,
  feedbackLost,
  feedbackMostOvertone,
  feedbackNote,
  feedbackOpened,
  feedbackPassed,
  feedbackPluck,
  feedbackRing,
  feedbackShares,
  feedbackSings,
  feedbackStrength,
  feedbackSung,
  feedbackToneGain,
  feedbackTop,
  feedbackWave,
  afterglowAgain,
  afterglowBeatAngle,
  afterglowBeatHz,
  afterglowCount,
  afterglowDamp,
  afterglowEarned,
  afterglowEnv,
  afterglowEvolved,
  afterglowFrom,
  afterglowHalo,
  afterglowHz,
  afterglowKeyDecay,
  afterglowKnob,
  afterglowLevels,
  afterglowMade,
  afterglowOnto,
  afterglowPair,
  afterglowPlayed,
  afterglowRatio,
  afterglowRing,
  afterglowStrength,
  afterglowStruck,
  afterglowToned,
  afterglowVoice,
  afterglowWeights,
  graftBeatHz,
  graftChoked,
  graftDriveLevel,
  graftDriverQ,
  graftFed,
  graftHardness,
  graftLineSeconds,
  graftLoop,
  graftMalletPeriods,
  graftNoteDb,
  graftPan,
  graftPartialSeconds,
  graftPickHz,
  graftPushTop,
  graftRatios,
  graftReach,
  graftRingSeconds,
  graftRubLevel,
  graftStrength,
  graftStrikeLevel,
  graftSwellLevel,
  graftSwing,
  graftTrack,
  graftWeight,
  graftWork,
  MET_SLACK_SEC,
  metKeep,
  metKind,
  metKnob,
  metNone,
  type AfterglowSetting,
  type FeedbackSetting,
  type GraftSetting,
} from '../components/displays/instrument-bodies'
import { type DisplayNote, type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
  type FrameOptions,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent, ink } = PLAIN_COLOURS

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id: Math.round(frequency), frequency, gain, age, released })

/**
 * How late the plate reads a note's age after the time of its frame, frame
 * after frame: a fifth of a millisecond to four, and a slow frame's 33.
 */
const LATE = [0.0002, 0.004, 0.033, 0.001, 0.0333, 0.0005, 0.02, 0.003]
const FPS = 30

/**
 * A display run frame by frame on one state, as the plate runs it, with every
 * frame's drawing kept. `each` gives a frame its knobs and notes from the
 * seconds since the first, and from how late the ages are read on it.
 */
function everyFrame(
  display: PlateDisplay,
  params: Parameters<typeof drawDisplay>[1],
  seconds: number,
  each: (time: number, late: number) => Partial<FrameOptions>,
): DrawnPath[][] {
  const state: unknown = display.init?.()
  const frames: DrawnPath[][] = []
  for (let n = 0; n < Math.round(seconds * FPS); n++) {
    const time = n / FPS
    const options = { signal: testSignal(), ...each(time, LATE[n % LATE.length]) }
    frames.push(
      drawnPaths(
        drawDisplay(display, params, { ...options, state, now: 10 + time, dt: n ? 1 / FPS : 0 }),
      ),
    )
  }
  return frames
}

/** A key that went down `began` seconds into a run, as it is read `late` after the frame at `time`: not there before it began. */
const begun = (frequency: number, began: number, time: number, late: number): DisplayNote[] =>
  time + late >= began
    ? [{ ...note(frequency, time + late - began), id: Math.round(frequency) }]
    : []

describe('what a display keeps of the notes it has met', () => {
  it('decides once what a knob said when a note began, and keeps it by id and nearest start', () => {
    const met = metNone()
    // The first frame: whatever sounds is taken to be of the knob as it stands.
    metKnob(met, 1, 10, 0)
    expect(metKind(met, { id: 60, age: 5 }, 10)).toBe(1)
    metKeep(met)
    // The knob is turned between two frames. The note from before keeps its own, however late its age is read.
    metKnob(met, 2, 10.5, 1 / FPS)
    for (const late of LATE) {
      expect(metKind(met, { id: 60, age: 5.5 + late }, 10.5)).toBe(1)
      metKeep(met)
    }
    // A note that begins after the turn is of the new, though its age puts its start up to 33 ms early.
    expect(metKind(met, { id: 64, age: 0.001 + 0.033 }, 10.5)).toBe(2)
    // One never met that began well before the turn began with something else.
    expect(metKind(met, { id: 67, age: 1 }, 10.5)).toBe(-1)
    // The same key struck again is another note: its start is not the old one's.
    expect(MET_SLACK_SEC).toBeGreaterThanOrEqual(0.05)
    expect(metKind(met, { id: 60, age: 0.01 }, 10.5)).toBe(2)
    expect(metKind(met, { id: 60, age: 5.5 }, 10.5)).toBe(1)
    expect(met.id).toEqual([60, 64, 67, 60])
    metKeep(met)
    // Turned back, the old note is of the knob again; a note not asked after for a frame is over and forgotten.
    metKnob(met, 1, 10.6, 1 / FPS)
    expect(metKind(met, { id: 60, age: 5.6 }, 10.6)).toBe(1)
    expect(metKind(met, { id: 60, age: 0.11 }, 10.6)).toBe(2)
    metKeep(met)
    expect(met.id).toEqual([60, 60])
    metKeep(met)
    expect(met.id).toEqual([])
  })
})

const [BREATH, BOW, MALLET, PLUCK] = [0, 1, 2, 3]
const [STRING, PIPE, BAR, BOWL] = [0, 1, 2, 3]
const C4 = 261.63

describe('graft’s figures', () => {
  /** The device at its defaults, as the figures read it. */
  const defaults: GraftSetting = {
    exciter: BREATH,
    body: STRING,
    pressure: 0.5,
    position: 0.35,
    bright: 0.5,
    decay: 3,
    air: 0.25,
    swell: 0.12,
    release: 1.2,
    width: 0.6,
    sampleRate: 48000,
  }

  it('has the partials `graft_bodies.h` gives each body', () => {
    expect(graftRatios(STRING).slice(0, 4)).toEqual([1, 2, 3, 4])
    // A pipe stopped at one end: the odd harmonics only.
    expect(graftRatios(PIPE).slice(0, 4)).toEqual([1, 3, 5, 7])
    // `kBarRatio` and `kBowlRatio`.
    expect(graftRatios(BAR)).toEqual([1, 2.756, 5.404, 8.933, 13.34])
    expect(graftRatios(BOWL)).toEqual([1, 2.71, 5.15, 8.2, 11.9])
  })

  it('rings as long as `Graft::ring_time` says', () => {
    // `track`: (261.63 / hz)^0.35, kept between a quarter and two.
    expect(graftTrack(C4)).toBeCloseTo(1, 9)
    expect(graftTrack(C4 / 2)).toBeCloseTo(Math.pow(2, 0.35), 9)
    expect(graftTrack(25)).toBe(2)
    expect(graftTrack(4500)).toBeCloseTo(0.3695, 3)
    // Struck, it rings for Decay; once the key is up, no longer than Release.
    expect(graftRingSeconds(C4, 3, 1.2, false, false)).toBeCloseTo(3, 9)
    expect(graftRingSeconds(C4, 3, 1.2, false, true)).toBeCloseTo(1.2, 9)
    expect(graftRingSeconds(C4, 3, 12, true, true)).toBeCloseTo(3, 9)
    // `kHeldSeconds`, `kHeldPeriods`: under breath or bow sixty periods, three tenths of a second at least.
    expect(graftRingSeconds(220, 3, 1.2, true, false)).toBe(0.3)
    expect(graftRingSeconds(50, 3, 1.2, true, false)).toBeCloseTo(1.2, 9)
  })

  it('is driven and struck as hard as `Graft::start` and `drive_level` say', () => {
    expect(graftStrength(0)).toBe(0.25)
    expect(graftStrength(1)).toBe(1)
    // `kBreathSoft` 0.45 and `kBowSoft` 0.5 at Pressure 0, all of it at 1.
    expect(graftDriveLevel(BREATH, 1, 0)).toBeCloseTo(0.45, 9)
    expect(graftDriveLevel(BOW, 1, 0)).toBeCloseTo(0.5, 9)
    expect(graftDriveLevel(BREATH, 0.7, 0.5)).toBeCloseTo(0.775 * 0.725, 9)
    // `kSoftStrike`: a strike at Pressure 0 is 0.35 of one at 1; a harder key is a harder mallet.
    expect(graftStrikeLevel(1, 0)).toBeCloseTo(0.35, 9)
    expect(graftStrikeLevel(1, 1)).toBeCloseTo(1, 9)
    expect(graftHardness(0, 0.5)).toBeCloseTo(0.3, 9)
    expect(graftHardness(1, 1)).toBe(1)
  })

  it('swells as the envelope does: it aims at 1.3 and is there at Swell', () => {
    expect(graftSwellLevel(0, 0.12)).toBe(0)
    expect(graftSwellLevel(0.06, 0.12)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 9)
    expect(graftSwellLevel(0.06, 0.12)).toBeCloseTo(0.6755, 4)
    expect(graftSwellLevel(0.12, 0.12)).toBeCloseTo(1, 9)
    expect(graftSwellLevel(5, 0.12)).toBe(1)
  })

  it('shapes the push as `graft_exciters.h` does', () => {
    // `kBreathNarrow` to `kBreathWide`, `kBowNarrow` to `kBowWide`.
    expect(graftDriverQ(BREATH, 0)).toBeCloseTo(1.6, 9)
    expect(graftDriverQ(BREATH, 1)).toBeCloseTo(0.45, 9)
    expect(graftDriverQ(BOW, 0)).toBeCloseTo(0.6, 9)
    expect(graftDriverQ(BOW, 1)).toBeCloseTo(0.3, 9)
    // `kMalletSoft` 0.7 of a period to `kMalletHard` 0.07, never under two samples or over 12 ms.
    expect(graftMalletPeriods(0, C4, 48000)).toBeCloseTo(0.7, 9)
    expect(graftMalletPeriods(1, C4, 48000)).toBeCloseTo(0.07, 9)
    expect(graftMalletPeriods(1, 4186, 48000)).toBeCloseTo((2 * 4186) / 48000, 9)
    expect(graftMalletPeriods(0, 30, 48000)).toBeCloseTo(0.012 * 30, 9)
    // `kPickSoft` 0.6 partials to `kPickHard` 24, `kPickLowestHz` 120 at least, 0.4 of the rate at most.
    expect(graftPickHz(0, C4, 48000)).toBeCloseTo(0.6 * C4, 6)
    expect(graftPickHz(1, C4, 48000)).toBeCloseTo(24 * C4, 6)
    expect(graftPickHz(0, 100, 48000)).toBe(120)
    expect(graftPickHz(1, 4000, 48000)).toBe(19200)
  })

  it('stands a strike’s push as high as `Striker::strike` makes it', () => {
    // `pulse_gain`: a mallet's push has the same energy however short, so one ten times as long
    // stands at the root of a tenth. (Drawn as tall soft as hard, a soft blow looked ten times the energy.)
    expect(graftPushTop(MALLET, 1, C4, 48000)).toBe(1)
    expect(graftPushTop(MALLET, 0, C4, 48000)).toBeCloseTo(Math.sqrt(0.1), 9)
    expect(graftPushTop(MALLET, 0.5, C4, 48000)).toBeCloseTo(Math.pow(0.1, 0.25), 9)
    // A low note's soft push is cut at 12 ms, 0.36 of a period at 30 Hz: by its length it stands at the root of 0.07 / 0.36.
    expect(graftPushTop(MALLET, 0, 30, 48000)).toBeCloseTo(Math.sqrt(0.07 / 0.36), 9)
    // `PluckExciter::next`: an impulse of the same area through the note's corner and the pick's.
    // A hard pick's corner is 24 partials up and the top is the note's corner alone, nearly;
    // a soft pick's is under the note and spreads it to a third of that.
    expect(graftPushTop(PLUCK, 1, C4, 48000)).toBe(1)
    expect(graftPushTop(PLUCK, 0, C4, 48000)).toBeCloseTo(0.321, 2)
    expect(graftPushTop(PLUCK, 0.5, C4, 48000)).toBeGreaterThan(graftPushTop(PLUCK, 0, C4, 48000))
    expect(graftPushTop(PLUCK, 0.5, C4, 48000)).toBeLessThan(1)
  })

  it('gives each partial what the exciter has there', () => {
    // A driver's band turns nothing at the note; a hard bow passes the octave at 1 / sqrt(1 + 0.3² 1.5²).
    expect(graftReach(BREATH, 1, 0.5, C4, 48000)).toBeCloseTo(1, 9)
    expect(graftReach(BOW, 2, 1, C4, 48000)).toBeCloseTo(0.912, 3)
    expect(graftReach(BREATH, 2, 0, C4, 48000)).toBeCloseTo(1 / Math.sqrt(1 + 2.56 * 2.25), 9)
    // A soft mallet's 0.7 of a period leaves 0.72 in the note; a hard one a tenth as long has
    // sqrt(0.1) of the area and nearly all of that in every partial.
    expect(graftReach(MALLET, 1, 0, C4, 48000)).toBeCloseTo(0.7213, 3)
    expect(graftReach(MALLET, 1, 1, C4, 48000)).toBeCloseTo(0.3152, 3)
    expect(graftReach(MALLET, 5.404, 1, C4, 48000)).toBeGreaterThan(0.28)
    expect(graftReach(MALLET, 5.404, 0, C4, 48000)).toBeLessThan(0.01)
    // A pluck: 1/n through the note's own corner, then the pick's at 24 partials.
    expect(graftReach(PLUCK, 1, 1, C4, 48000)).toBeCloseTo(1 / Math.sqrt(2 * (1 + 1 / 576)), 9)
    expect(graftReach(PLUCK, 8, 1, C4, 48000)).toBeCloseTo(1 / Math.sqrt(65 * (1 + 1 / 9)), 9)
  })

  it('weights the partials by where the body is met', () => {
    // `set_comb`: in the middle of a string (q 0.5, no Width) the even harmonics vanish.
    expect(graftWeight(STRING, 0, 1, 0)).toBeCloseTo(1, 9)
    expect(graftWeight(STRING, 1, 1, 0)).toBeCloseTo(0, 9)
    expect(graftWeight(STRING, 2, 1, 0)).toBeCloseTo(1, 9)
    // Near the end (q 0.06) the note thins: sin(0.06 pi) / sqrt(sin(0.06 pi)).
    expect(graftWeight(STRING, 0, 0, 0)).toBeCloseTo(0.4329, 3)
    // Width sets the two sides' taps 22 % apart (`kCombSpread`): the octave no longer vanishes.
    const left = Math.sin(2 * Math.PI * 0.39) / Math.sqrt(Math.sin(Math.PI * 0.39))
    expect(graftWeight(STRING, 1, 1, 1)).toBeCloseTo(Math.sqrt(0.5 * left * left), 9)
    // A pipe's partial 1 is its third harmonic.
    expect(graftWeight(PIPE, 1, 1, 0)).toBeCloseTo(1, 9)
    // `Modes::set_position`: in the middle of a bar every other mode vanishes; at its end (x 0.03) none does.
    expect(graftWeight(BAR, 0, 0.2, 0.6)).toBe(1)
    expect(graftWeight(BAR, 1, 1, 0.6)).toBeCloseTo(0, 9)
    expect(graftWeight(BAR, 2, 1, 0.6)).toBeCloseTo(1, 9)
    expect(graftWeight(BAR, 1, 0, 0.6)).toBeCloseTo(0.5225, 3)
    // A bowl's pairs thin towards the base: (1 − 0.85 Position)^k.
    expect(graftWeight(BOWL, 2, 0.5, 0.6)).toBeCloseTo(0.330625, 9)
    expect(graftWeight(BOWL, 4, 0, 0.6)).toBe(1)
  })

  /** `Waveguide::set_loss` as the header writes it, pole by halving, for the display's closed form to be held to. */
  function headerLoop(hz: number, pipe: boolean, ring: number, high: number, sampleRate: number) {
    const passes = pipe ? 2 : 1
    const w = (2 * Math.PI * hz) / sampleRate
    const w2 = (2 * Math.PI * Math.min(Math.max(3000, 2 * hz), 0.45 * sampleRate)) / sampleRate
    const c1 = Math.cos(w)
    const c2 = Math.cos(w2)
    const gain1 = Math.pow(10, -3 / (hz * passes * Math.max(ring, 0.001)))
    const gain2 = Math.pow(10, -3 / (hz * passes * Math.min(Math.max(high, 0.0005), ring)))
    const wanted = (gain2 / gain1) * (gain2 / gain1)
    const ratio = (a: number) => (1 - 2 * a * c1 + a * a) / (1 - 2 * a * c2 + a * a)
    let pole = 0
    if (w2 > w && wanted < 1) {
      let lo = 0
      let hi = 0.98
      if (ratio(hi) < wanted) {
        for (let i = 0; i < 22; i++) {
          const mid = 0.5 * (lo + hi)
          if (ratio(mid) > wanted) lo = mid
          else hi = mid
        }
      }
      pole = hi
    }
    const most = Math.min(0.9999, Math.pow(gain1, 1 / 4))
    const least = gain1 / most
    if (least < 1) {
      const m2 = least * least
      const b = 1 - m2 * c1
      const limit = (b - Math.sqrt(Math.max(0, b * b - (1 - m2) * (1 - m2)))) / (1 - m2)
      pole = Math.min(pole, Math.max(limit, 0))
    }
    const magnitude = (1 - pole) / Math.sqrt(1 - 2 * pole * c1 + pole * pole)
    return { pole, gain: Math.min(gain1 / magnitude, most) }
  }

  it('loses round a string’s loop as `Waveguide::set_loss` sets it', () => {
    for (const [hz, pipe, ring, high] of [
      [C4, false, 3, 3 * Math.sqrt(0.03)],
      [C4, true, 3, 0.09],
      [55, false, 6, 0.4],
      [2000, false, 0.05, 0.0015],
      [4186, true, 8, 0.3],
      [110, false, 20, 20],
    ] as const) {
      const header = headerLoop(hz, pipe, ring, high, 48000)
      const loop = graftLoop(hz, pipe, ring, high, 48000)
      expect(loop.pole).toBeCloseTo(header.pole, 5)
      expect(loop.gain).toBeCloseTo(header.gain, 6)
    }
    // Worked by hand for middle C ringing 3 s, half way up Bright: the pole is 0.2915.
    expect(graftLoop(C4, false, 3, 3 * Math.sqrt(0.03), 48000).pole).toBeCloseTo(0.2915, 3)
  })

  it('lets a string’s high partials live as long against the low ones as Bright says', () => {
    const seconds = new Float32Array(16)
    // `Graft::shape`: all the way up, every partial rings as long as the fundamental.
    graftPartialSeconds(STRING, C4, 3, 1, 48000, seconds)
    expect(seconds[0]).toBeCloseTo(3, 3)
    expect(seconds[15]).toBeCloseTo(3, 3)
    // Half way, a partial at 3 kHz rings `kDull`^0.5 of it; the fundamental keeps its time.
    const loop = graftLoop(C4, false, 3, 3 * Math.sqrt(0.03), 48000)
    expect(graftLineSeconds(loop, C4, false, 3000, 48000)).toBeCloseTo(3 * Math.sqrt(0.03), 3)
    expect(graftLineSeconds(loop, C4, false, C4, 48000)).toBeCloseTo(3, 3)
    graftPartialSeconds(STRING, C4, 3, 0.5, 48000, seconds)
    expect(seconds[10]).toBeGreaterThan(seconds[11])
    expect(seconds[10]).toBeGreaterThan(3 * Math.sqrt(0.03))
    expect(seconds[11]).toBeLessThan(3 * Math.sqrt(0.03))
    // A pipe's loop is half as long and goes round twice as often: the same times.
    graftPartialSeconds(PIPE, C4, 3, 1, 48000, seconds)
    expect(seconds[7]).toBeCloseTo(3, 3)
    // On a short high note there is too little to dull: Decay wins over Bright.
    graftPartialSeconds(STRING, 2000, 0.05, 0, 48000, seconds)
    expect(seconds[0]).toBeCloseTo(0.05, 4)
    expect(seconds[1]).toBeGreaterThan(0.05 * 0.03)
    // A partial over half the rate is not there.
    expect(seconds[12]).toBe(0)
  })

  it('lets a bar’s and a bowl’s modes lose ring time by their ratio, wood to metal', () => {
    const seconds = new Float32Array(16)
    // `Modes::set_loss`: ring / (1 + d (ratio − 1)), d from `kMetal` 0.02 to `kWood` 2.
    graftPartialSeconds(BAR, C4, 3, 1, 48000, seconds)
    expect(seconds[0]).toBeCloseTo(3, 6)
    expect(seconds[1]).toBeCloseTo(3 / (1 + 0.02 * 1.756), 5)
    graftPartialSeconds(BAR, C4, 3, 0, 48000, seconds)
    expect(seconds[1]).toBeCloseTo(3 / (1 + 2 * 1.756), 5)
    graftPartialSeconds(BOWL, C4, 3, 0.5, 48000, seconds)
    expect(seconds[4]).toBeCloseTo(3 / (1 + 0.2 * 10.9), 5)
    // A mode over 0.45 of the rate is left out: at 4 kHz the bar's third and up.
    graftPartialSeconds(BAR, 4000, 3, 1, 48000, seconds)
    expect(Array.from(seconds.slice(0, 5)).map((s) => s > 0)).toEqual([
      true,
      true,
      false,
      false,
      false,
    ])
  })

  it('beats a bowl’s pairs as `Modes::start` and `aim` do', () => {
    // `kBeatHz` 0.7 at 220 Hz, by the root of the pitch, 0.7 more of it for each pair up; never over 0.006 of the note.
    expect(graftBeatHz(220, 0)).toBeCloseTo(0.7, 9)
    expect(graftBeatHz(220, 2)).toBeCloseTo(1.68, 9)
    expect(graftBeatHz(880, 0)).toBeCloseTo(1.4, 9)
    expect(graftBeatHz(50, 0)).toBeCloseTo(0.3, 9)
    // `kMateLevel` 0.7: together the halves are whole, against each other 0.3 of 1.7.
    expect(graftSwing(0)).toBeCloseTo(1, 9)
    expect(graftSwing(0.5)).toBeCloseTo(0.3 / 1.7, 9)
    expect(graftSwing(0.25)).toBeCloseTo(Math.sqrt(1.49) / 1.7, 9)
  })

  it('rubs the upper modes of a held bar as `Graft::rub_level` says', () => {
    // `kRubSoft` 0.08 to `kRubHard` 0.6 by Pressure, by the root of Air over `kRubAir`.
    expect(graftRubLevel(0.5, 0.25)).toBeCloseTo(0.34, 9)
    expect(graftRubLevel(1, 1)).toBeCloseTo(1.2, 9)
    expect(graftRubLevel(1, 0)).toBe(0)
    const held = new Float32Array(16)
    const set = { ...defaults, body: BAR }
    graftPartialSeconds(BAR, C4, 0.3, set.bright, 48000, held)
    // The driven mode has the drive; the next has the rub, less as it rings less and by the roughness's corner.
    expect(graftFed(set, C4, 1, 0, held)).toBeCloseTo(0.725, 9)
    const weight = graftWeight(BAR, 1, set.position, set.width)
    const quieter = Math.sqrt(1 / (1 + 0.2 * 1.756)) / Math.sqrt(1 + 0.25 * 2.756 * 2.756)
    expect(graftFed(set, C4, 1, 1, held)).toBeCloseTo(0.725 * weight * 0.34 * quieter, 6)
    // `kRubbedModes`: the fifth mode is not reached; with no Air none is.
    expect(graftFed(set, C4, 1, 4, held)).toBe(0)
    expect(graftFed({ ...set, air: 0 }, C4, 1, 1, held)).toBe(0)
    // A struck bar has every mode the mallet has.
    expect(graftFed({ ...set, exciter: MALLET, pressure: 1 }, C4, 1, 4, held)).toBeGreaterThan(0.01)
  })

  it('stands its notes between the speakers as `place` and `set_position` do', () => {
    // `kRanks`: middle C is the 48th key from the C under the keyboard and stands right, the next key left.
    expect(graftPan(STRING, C4, 1)).toBeCloseTo(0.35, 9)
    expect(graftPan(PIPE, C4 * Math.pow(2, 1 / 12), 1)).toBeCloseTo(-0.35, 9)
    expect(graftPan(STRING, C4, 0)).toBeCloseTo(0, 9)
    // `kBarRow`: a quarter of the way for each octave from middle C, 1.6 octaves at most.
    expect(graftPan(BAR, 2 * C4, 1)).toBeCloseTo(0.25, 9)
    expect(graftPan(BAR, 16 * C4, 0.5)).toBeCloseTo(0.2, 9)
    expect(graftPan(BOWL, 880, 1)).toBe(0)
  })

  it('knows a key struck again while it is down', () => {
    const again = [
      { ...note(220, 2), id: 7 },
      { ...note(330, 1.5), id: 8 },
      { ...note(220, 0.4), id: 7 },
    ]
    expect(graftChoked(again, 0)).toBe(0.4)
    expect(graftChoked(again, 1)).toBeNull()
    expect(graftChoked(again, 2)).toBeNull()
    // Let go before it was struck again, it rings on beside the new note.
    expect(graftChoked([{ ...note(220, 2, 1), id: 7 }, again[2]], 0)).toBeNull()
  })

  it('lets a struck note fall 60 dB over its ring, and faster once the key is up', () => {
    const work = graftWork()
    const db = new Float32Array(16)
    const set = { ...defaults, exciter: MALLET, body: BAR, pressure: 1, bright: 1, position: 0 }
    expect(graftNoteDb(set, note(C4, 0), null, work, db)).toBe(5)
    const struck = 20 * Math.log10(graftReach(MALLET, 1, 1, C4, 48000))
    expect(db[0]).toBeCloseTo(struck, 4)
    graftNoteDb(set, note(C4, 1.5), null, work, db)
    expect(db[0]).toBeCloseTo(struck - 30, 4)
    // Held a second, up for half a second: 20 dB of Decay's 3 s and 25 of Release's 1.2 s.
    graftNoteDb(set, note(C4, 1.5, 0.5), null, work, db)
    expect(db[0]).toBeCloseTo(struck - 20 - 25, 4)
    // A key struck again over it 20 ms ago: `kChokeSeconds`, 60 dB in 50 ms.
    graftNoteDb(set, note(C4, 1), 0.02, work, db)
    expect(db[0]).toBeLessThan(struck - 20 - 24)
  })

  it('holds a blown note at its level while the key is down, and lets it ring when it is up', () => {
    const work = graftWork()
    const db = new Float32Array(16)
    const level = 20 * Math.log10(0.725 * graftWeight(STRING, 0, defaults.position, defaults.width))
    graftNoteDb(defaults, note(C4, 4), null, work, db)
    expect(db[0]).toBeCloseTo(level, 3)
    graftNoteDb(defaults, note(C4, 40), null, work, db)
    expect(db[0]).toBeCloseTo(level, 3)
    // Half way through Swell it has 0.68 of its level, less what the damped body has yet to answer.
    graftNoteDb(defaults, note(C4, 0.06), null, work, db)
    expect(db[0]).toBeLessThan(level + 20 * Math.log10(0.6755))
    expect(db[0]).toBeGreaterThan(level - 12)
    // Up for 0.6 s: half of Release's 1.2 s, which is shorter than Decay.
    graftNoteDb(defaults, note(C4, 4, 0.6), null, work, db)
    expect(db[0]).toBeCloseTo(level - 30, 3)
  })
})

describe('graft’s display', () => {
  const { display } = BODY_INSTRUMENT_FACES.graft
  const params = paramsOf('graft')
  const run = (values: Record<string, number>, notes: DisplayNote[], seconds = 0.1) =>
    drawnPaths(runDisplay(display, params, seconds, { values, notes, signal: testSignal() }))
  /** The body's motion: one line in the accent for each note that sounds, 33 places along it (the air in a pipe there and back). */
  const moved = (paths: DrawnPath[]): DrawnPath[] =>
    paths.filter(
      (path) =>
        path.kind === 'stroke' &&
        path.colour === accent &&
        (path.points.length === 33 || path.points.length === 66),
    )
  /** How far a motion swings: the span of its points up and down, or for a bowl's wall from side to side. */
  const swing = (path: DrawnPath, axis: 0 | 1 = 1): number => {
    const along = path.points.map((point) => point[axis])
    return Math.max(...along) - Math.min(...along)
  }
  /** The partials' sticks in a colour: upright lines that stand on the row's foot, over the stage. */
  const sticks = (paths: DrawnPath[], colour: string): DrawnPath[] =>
    paths.filter(
      (path) =>
        path.kind === 'stroke' &&
        path.colour === colour &&
        path.points.length === 2 &&
        path.points[0][0] === path.points[1][0] &&
        Math.max(path.points[0][1], path.points[1][1]) === 84,
    )
  const reach = (path: DrawnPath): number => Math.abs(path.points[0][1] - path.points[1][1])
  const lit = (paths: DrawnPath[]): DrawnPath[] => paths.filter((path) => path.colour === accent)

  it('lights nothing at rest, and moves the body once for each note that sounds', () => {
    expect(lit(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lit(run({}, []))).toHaveLength(0)
    for (const body of [STRING, PIPE, BAR, BOWL]) {
      expect(moved(run({ body }, [note(C4, 1), note(392, 1)]))).toHaveLength(2)
      expect(moved(run({ body, exciter: MALLET }, [note(C4, 0.2)]))).toHaveLength(1)
    }
  })

  it('shows each body’s own partials, and lights the ones a note has', () => {
    const struck = { exciter: MALLET, pressure: 1, position: 0.2 }
    // A string has sixteen harmonics, a pipe the eight odd ones, a bar five modes, a bowl five pairs.
    for (const [body, count] of [
      [STRING, 16],
      [PIPE, 8],
      [BAR, 5],
      [BOWL, 10],
    ]) {
      const paths = run({ ...struck, body }, [note(C4, 0.05)])
      expect(sticks(paths, ink)).toHaveLength(count)
      expect(sticks(paths, accent)).toHaveLength(count)
    }
    // A pipe's sticks stand where a string's odd harmonics do.
    const xs = (body: number) => sticks(run({ body }, []), ink).map((path) => path.points[0][0])
    expect(xs(PIPE)).toEqual(xs(STRING).filter((_, n) => n % 2 === 0))
    // Struck in its middle, a bar has no second or fourth mode.
    expect(
      sticks(run({ ...struck, body: BAR, position: 1 }, [note(C4, 0.05)]), accent),
    ).toHaveLength(3)
  })

  it('lets a struck note ring and die by Decay, and holds a blown one while the key is down', () => {
    const struck = { exciter: MALLET, body: BAR, decay: 3 }
    expect(moved(run(struck, [note(C4, 1.5)]))).toHaveLength(1)
    expect(moved(run(struck, [note(C4, 3.2)]))).toHaveLength(0)
    expect(moved(run({ ...struck, decay: 12 }, [note(C4, 3.2)]))).toHaveLength(1)
    // `track`: an octave down the same Decay is 2^0.35 as long.
    expect(moved(run(struck, [note(C4, 2.9)]))).toHaveLength(0)
    expect(moved(run(struck, [note(C4 / 2, 2.9)]))).toHaveLength(1)
    // Breath and bow: as long as the key is down.
    for (const exciter of [BREATH, BOW])
      expect(moved(run({ exciter, body: BAR, decay: 0.1 }, [note(C4, 40)]))).toHaveLength(1)
  })

  it('lets a note that is let go ring no longer than Release', () => {
    for (const exciter of [BREATH, MALLET]) {
      const set = { exciter, decay: 8 }
      expect(moved(run({ ...set, release: 12 }, [note(C4, 3, 2)]))).toHaveLength(1)
      expect(moved(run({ ...set, release: 1.2 }, [note(C4, 1, 0.6)]))).toHaveLength(1)
      expect(moved(run({ ...set, release: 1.2 }, [note(C4, 1.7, 1.3)]))).toHaveLength(0)
      // Release longer than Decay leaves it to its Decay.
      expect(moved(run({ exciter, decay: 0.5, release: 12 }, [note(C4, 3, 0.6)]))).toHaveLength(0)
    }
  })

  it('brings a blown note up over Swell, the breath lit from the key on', () => {
    const slow = { swell: 6, body: STRING }
    const early = run(slow, [note(C4, 0.03)])
    const late = run(slow, [note(C4, 6)])
    expect(moved(late)).toHaveLength(1)
    const soon = moved(early)
    expect(soon.length === 0 || swing(soon[0]) < 0.5 * swing(moved(late)[0])).toBe(true)
    // The breath itself is in the accent as soon as the key is down, and the mark rides the push.
    expect(lit(early).length).toBeGreaterThan(0)
    // A mallet ignores Swell: the note is whole at once.
    expect(moved(run({ ...slow, exciter: MALLET }, [note(C4, 0.03)]))).toHaveLength(1)
  })

  it('keeps the high partials alive as long as Bright says', () => {
    const struck = { exciter: MALLET, body: BAR, pressure: 1, position: 0.2, decay: 3 }
    // A second on, wood has only its lowest mode left; metal has them all.
    expect(sticks(run({ ...struck, bright: 0 }, [note(C4, 1)]), accent)).toHaveLength(1)
    expect(sticks(run({ ...struck, bright: 1 }, [note(C4, 1)]), accent)).toHaveLength(5)
    // At rest the sticks say so: the fifth mode's is far shorter in wood.
    const fifth = (bright: number) => reach(sticks(run({ ...struck, bright }, []), ink)[4])
    expect(fifth(0)).toBeLessThan(0.5 * fifth(1))
  })

  it('beats a bowl’s lowest pair at the pace the device tunes its halves apart', () => {
    const bowl = { exciter: MALLET, body: BOWL, decay: 20 }
    // At 220 Hz the halves are 0.7 Hz apart: against each other after 0.714 s, together again at 1.43 s.
    const low = reach(sticks(run(bowl, [note(220, 0.5 / 0.7)], 1 / 30), accent)[0])
    const high = reach(sticks(run(bowl, [note(220, 1 / 0.7)], 1 / 30), accent)[0])
    expect(low).toBeLessThan(0.85 * high)
    // The wall swings from side to side, less while the halves are against each other.
    const wall = (age: number) => swing(moved(run(bowl, [note(220, age)], 1 / 30))[0], 0)
    expect(wall(0.5 / 0.7)).toBeGreaterThan(0)
  })

  it('lights no more notes than the device has: the faintest of more than ten are not lit', () => {
    const many = Array.from({ length: 14 }, (_, i) => ({
      ...note(110 * Math.pow(2, i / 12), 0.9 - i * 0.05),
      id: i,
    }))
    expect(moved(run({ exciter: MALLET, body: BAR, decay: 8 }, many))).toHaveLength(10)
  })

  it('lays a hand on a note whose key is struck again while it is down', () => {
    const again = [
      { ...note(220, 2), id: 7 },
      { ...note(220, 0.3), id: 7 },
    ]
    expect(moved(run({ exciter: MALLET, decay: 8 }, again))).toHaveLength(1)
    // Let go first, the old note rings on beside the new one.
    const beside = [{ ...note(220, 2, 1), id: 7 }, again[1]]
    expect(moved(run({ exciter: MALLET, decay: 8, release: 12 }, beside))).toHaveLength(2)
  })

  it('leaves a note of the crossing before unlit: a note keeps the two it began with', () => {
    // The body is changed 0.2 s in; the first note began before that, the second after.
    const values = (body: number) => ({ exciter: MALLET, decay: 8, body })
    const drawn = runDisplay(display, params, 0.5, { signal: testSignal() }, (time) => ({
      values: values(time < 0.2 ? STRING : BAR),
      notes: [note(C4, 1 + time), ...(time > 0.3 ? [note(392, time - 0.3)] : [])],
    }))
    expect(moved(drawnPaths(drawn))).toHaveLength(1)
  })

  it('draws a strike’s push shorter and taller the harder it is', () => {
    /** The push in time: the line in the ink at the top right, over its own floor at y = 33. */
    const push = (values: Record<string, number>): DrawnPath => {
      const found = drawnPaths(drawDisplay(display, params, { values })).find(
        (path) =>
          path.kind === 'stroke' &&
          path.colour === ink &&
          path.width === 1.25 &&
          path.points.length > 40 &&
          path.points.every((point) => point[0] >= 76 && point[1] <= 33.01),
      )
      if (!found) throw new Error('no push is drawn')
      return found
    }
    const top = (path: DrawnPath): number => 33 - Math.min(...path.points.map((point) => point[1]))
    const long = (path: DrawnPath): number => {
      const up = path.points.filter((point) => point[1] < 32.9).map((point) => point[0])
      return Math.max(...up) - Math.min(...up)
    }
    // The hardest stands at 0.8 of the box, 12.8 px; Pressure at 0 is 0.35 of the strength and the root of a tenth of the height.
    const hard = push({ exciter: MALLET, pressure: 1 })
    const soft = push({ exciter: MALLET, pressure: 0 })
    expect(top(hard)).toBeCloseTo(12.8, 0)
    expect(top(soft)).toBeCloseTo(12.8 * 0.35 * Math.sqrt(0.1), 1)
    expect(long(soft)).toBeGreaterThan(5 * long(hard))
    // A pick the same: the soft one a third as high for its strength, and longer in dying.
    const sharp = push({ exciter: PLUCK, pressure: 1 })
    const dull = push({ exciter: PLUCK, pressure: 0 })
    expect(top(sharp)).toBeCloseTo(12.8, 0)
    expect(top(dull)).toBeCloseTo(12.8 * 0.35 * 0.321, 1)
  })

  it('keeps a note on its side of a change of Body however late its age is read', () => {
    // Body is turned between the frames at 0.167 and 0.2 s. One key went down well before, one 30 ms
    // before the frame that shows the turn, one after. Taken by `now - age` on every frame, the second
    // fell before the turn on the frames whose ages came late and after it on the others.
    const frames = everyFrame(display, params, 1, (time, late) => ({
      values: { exciter: MALLET, decay: 8, body: time < 0.19 ? STRING : BAR },
      notes: [
        ...begun(C4, 0.05, time, late),
        ...begun(330, 0.17, time, late),
        ...begun(392, 0.25, time, late),
      ],
    }))
    const lit = frames.map((paths) => moved(paths).length)
    // Two keys of the string, then none of them once the body is a bar.
    expect(lit.slice(0, 6)).toEqual([0, 0, 1, 1, 1, 1])
    // From the turn on: the key that went down with it, and from 0.25 s the one after. Never the first.
    expect(lit[6]).toBe(1)
    expect(lit[7]).toBe(1)
    for (const count of lit.slice(8)) expect(count).toBe(2)
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { body: BAR, position: 0.05, decay: 0.2 },
      { body: BOWL, position: 0.8, decay: 15 },
      { body: PIPE, position: 1 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [position, decay] = display.handles?.(view) ?? []
      expect(position.drag(position.x, position.y).position).toBeCloseTo(view.value('position'), 3)
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 3)
      // To the right is nearer the middle; up is a longer ring.
      if (view.value('position') < 1)
        expect(position.drag(position.x + 6, position.y).position).toBeGreaterThan(
          view.value('position'),
        )
      expect(decay.drag(decay.x, decay.y - 4).decay).toBeGreaterThan(view.value('decay'))
    }
    // Position runs from the body's end to its middle.
    const at = (position: number) =>
      display.handles?.(viewOf(display, params, { values: { position } }))[0].x ?? 0
    expect(at(0)).toBeLessThan(at(1))
    expect(at(1)).toBeCloseTo(64, 0)
  })
})

const [FELT, BELL, PLUCKED, GLASS] = [0, 1, 2, 3]
const MIDDLE_C = 261.6256

describe('afterglow’s figures', () => {
  /** The device at its defaults, as the figures read it. */
  const defaults: AfterglowSetting = {
    source: FELT,
    strike: 0.8,
    decay: 4,
    glow: 0.65,
    bloom: 1.5,
    fade: 5,
    tone: 0.5,
    halo: 0.2,
    evolve: 0.4,
    drift: 0.3,
    width: 0.6,
    sampleRate: 48000,
  }

  it('puts each source’s partials where `partial_ratio` does', () => {
    expect(afterglowRatio(FELT, 0)).toBe(1)
    // A stiff string: 8 · √(1.0256 / 1.0004).
    expect(afterglowRatio(FELT, 7)).toBeCloseTo(8.1001, 3)
    expect(afterglowRatio(BELL, 0)).toBe(0.5)
    expect(afterglowRatio(BELL, 3)).toBeCloseTo(3.01, 6)
    expect(afterglowRatio(GLASS, 7)).toBeCloseTo(19.75, 6)
    expect([FELT, BELL, PLUCKED, GLASS].map(afterglowPlayed)).toEqual([0, 1, 0, 0])
    // Under 0.45 of the sample rate, 21.6 kHz: a glass at 4 kHz has 4, 9.28 and 17 kHz.
    expect(afterglowCount(FELT, MIDDLE_C, 48000)).toBe(8)
    expect(afterglowCount(GLASS, 4000, 48000)).toBe(3)
    expect(afterglowHz(5, 48000)).toBe(16)
    expect(afterglowHz(15000, 48000)).toBe(12000)
  })

  it('rings each partial as `start` and `tune_decay` do', () => {
    // 1 + damping · (ratio / lowest - 1).
    expect(afterglowDamp(FELT, 0)).toBe(1)
    expect(afterglowDamp(FELT, 1)).toBeCloseTo(1.5006, 4)
    expect(afterglowDamp(BELL, 2)).toBeCloseTo(1.18, 6)
    expect(afterglowDamp(GLASS, 7)).toBeCloseTo(3.25, 6)
    // The power 0.3 of the octaves under middle C, held between 0.45 and 1.6.
    expect(afterglowKeyDecay(MIDDLE_C)).toBeCloseTo(1, 6)
    expect(afterglowKeyDecay(MIDDLE_C / 2)).toBeCloseTo(1.2311, 4)
    expect(afterglowKeyDecay(16)).toBe(1.6)
    expect(afterglowKeyDecay(4186)).toBe(0.45)
    // 60 dB over Decay for the lowest partial, sooner by `damp`, and over at -80 dB.
    expect(afterglowRing(1, 1, 3)).toBeCloseTo(0.1, 6)
    expect(afterglowRing(1, 1.5, 3)).toBeCloseTo(Math.pow(10, -1.5), 6)
    expect(afterglowRing(4.1, 1, 3)).toBe(0)
  })

  it('weighs the strike and the glow as `weigh` does', () => {
    const strike = new Float32Array(8)
    const glow = new Float32Array(8)
    expect(afterglowWeights(FELT, MIDDLE_C, 0.7, 48000, strike, glow)).toBe(8)
    // Sum 2.205 and power 1.377225: 1 / √(2.205 · √1.377225).
    expect(strike[0]).toBeCloseTo(0.62165, 4)
    expect(strike[1]).toBeCloseTo(0.31082, 4)
    // The glow is the strike 0.3 s on: the second partial has lost 0.3 · 0.5006 of a power of ten more.
    expect(glow[1] / glow[0]).toBeCloseTo(0.35383, 3)
    expect(glow.reduce((sum, weight) => sum + weight * weight, 0)).toBeCloseTo(1, 5)
    // A hard strike is brighter by the ratio to the power 0.6 · 0.3.
    afterglowWeights(FELT, MIDDLE_C, 1, 48000, strike, glow)
    expect(strike[1] / strike[0]).toBeCloseTo(0.5665, 3)
    // An octave down is brighter by the root of the ratio.
    afterglowWeights(FELT, MIDDLE_C / 2, 0.7, 48000, strike, glow)
    expect(strike[1] / strike[0]).toBeCloseTo(0.70732, 3)
    expect(afterglowStrength(0)).toBe(0.25)
    expect(afterglowStrength(0.7)).toBeCloseTo(0.775, 6)
    expect(afterglowKnob(0.8)).toBeCloseTo(0.64, 6)
  })

  it('tilts the glow about the played note as `retone` does', () => {
    const glow = new Float32Array([0.6, 0.8, 0, 0, 0, 0, 0, 0])
    const toned = new Float32Array(8)
    // The middle leaves the weights be; the trim is 1 / √(their sum).
    expect(afterglowToned(GLASS, glow, 2, 0.5, toned)).toBeCloseTo(0.84515, 4)
    expect(toned[0]).toBeCloseTo(0.6, 5)
    expect(toned[1]).toBeCloseTo(0.8, 5)
    // All the way up the second partial, 2.32 times the note, gains 2.32 to the power 1.5.
    expect(afterglowToned(GLASS, glow, 2, 1, toned)).toBeCloseTo(0.91831, 3)
    expect(toned[0]).toBeCloseTo(0.20762, 3)
    expect(toned[1]).toBeCloseTo(0.97821, 3)
  })

  it('blooms, holds and fades as the stages of `control` do', () => {
    // Half way through Bloom the glow is half way up, and up it holds with the key.
    expect(afterglowEnv(0.75, null, 1.5, 5)).toBeCloseTo(0.5, 6)
    expect(afterglowEnv(1.5, null, 1.5, 5)).toBe(1)
    expect(afterglowEnv(40, null, 1.5, 5)).toBe(1)
    // 60 dB per Fade from the key going up, and done at -80 dB.
    expect(afterglowEnv(10, 2.5, 1.5, 5)).toBeCloseTo(Math.pow(10, -1.5), 6)
    expect(afterglowEnv(10, 5, 1.5, 5)).toBeCloseTo(0.001, 6)
    expect(afterglowEnv(10, 7, 1.5, 5)).toBe(0)
    // The shortest touch earns 0.3 of the glow, half of Bloom √(0.09 + 0.91 / 2), all of it 1.
    expect(afterglowEarned(0)).toBeCloseTo(0.3, 6)
    expect(afterglowEarned(0.5)).toBeCloseTo(0.73824, 4)
    expect(afterglowEarned(1)).toBe(1)
    expect(afterglowEarned(0.5, 0.9)).toBe(0.9)
    // Let go half way up it rises on to what it earned, and fades from the end of Bloom.
    expect(afterglowEnv(0.75, 0, 1.5, 5)).toBeCloseTo(0.5, 6)
    expect(afterglowEnv(1.125, 0.375, 1.5, 5)).toBeCloseTo(0.66379, 4)
    expect(afterglowEnv(1.5, 0.75, 1.5, 5)).toBeCloseTo(0.73824, 4)
    expect(afterglowEnv(4, 3.25, 1.5, 5)).toBeCloseTo(0.73824 * Math.pow(10, -1.5), 4)
    // A key struck again blooms from the glow it had.
    expect(afterglowEnv(0, null, 1.5, 5, 0.4)).toBeCloseTo(0.4, 6)
    expect(afterglowEnv(0.75, null, 1.5, 5, 0.4)).toBeCloseTo(0.7, 6)
  })

  it('beats the halves of a pair as `tune_drift` and `control` do', () => {
    // 3 Hz for the lowest partial at Drift 1, as the square of the knob, twice as fast sixteen times higher.
    expect(afterglowBeatHz(1, 1, 1)).toBe(3)
    expect(afterglowBeatHz(0.3, 1, 1)).toBeCloseTo(0.27, 6)
    expect(afterglowBeatHz(1, 8, 0.5, 1.15)).toBeCloseTo(6.9, 6)
    // A quarter turn apart at the hit, and together a quarter of a beat on.
    expect(afterglowBeatAngle(0, 2)).toBeCloseTo(-Math.PI / 4, 6)
    expect(afterglowBeatAngle(0.125, 2)).toBeCloseTo(0, 6)
    const pair: [number, number] = [0, 0]
    // No Drift is one sine: mono it is 1 and 1, at Width 1 it leans 0.6 of the way to a side.
    expect(afterglowPair(1.3, 0, 0, 1, pair)).toEqual([1, 1])
    afterglowPair(1.3, 0, 1, 1, pair)
    expect(pair[0]).toBeCloseTo(0.43702, 4)
    expect(pair[1]).toBeCloseTo(1.345, 4)
    expect(afterglowPair(1.3, 0, 1, -1, pair)[0]).toBeCloseTo(1.345, 4)
    // Drift 1: the halves have 0.67 and 0.33 of the power, so together they are 1.393 and apart 0.244.
    expect(afterglowPair(0, 1, 0, 1, pair)[0]).toBeCloseTo(1.39299, 4)
    expect(afterglowPair(Math.PI / 2, 1, 0, 1, pair)[0]).toBeCloseTo(0.24408, 4)
    // Drift 0.3 is a beat of 6 dB in mono.
    const deep =
      afterglowPair(0, 0.3, 0, 1, pair)[0] / afterglowPair(Math.PI / 2, 0.3, 0, 1, pair)[0]
    expect(20 * Math.log10(deep)).toBeCloseTo(6, 0)
  })

  it('puts the halo where `start` and `control` do', () => {
    // A string's second, fourth, sixth and eighth are octaves of its first four; a bell has two; a glass none.
    expect([0, 1, 2, 3, 4].map((k) => afterglowOnto(FELT, k, MIDDLE_C, 48000))).toEqual([
      1, 3, 5, 7, -1,
    ])
    expect([0, 1, 2, 3].map((k) => afterglowOnto(BELL, k, MIDDLE_C, 48000))).toEqual([1, 2, -1, -1])
    expect([0, 1, 2, 3].map((k) => afterglowOnto(GLASS, k, MIDDLE_C, 48000))).toEqual([
      -1, -1, -1, -1,
    ])
    // An octave that is out of the band is not there: felt's eighth at 3 kHz is at 24 kHz.
    expect(afterglowOnto(FELT, 3, 3000, 48000)).toBe(-1)
    // The lowest partial without one makes its own: a bell's nominal, a glass's first, and a string none.
    expect(afterglowMade(FELT, MIDDLE_C, 48000)).toBe(-1)
    expect(afterglowMade(BELL, MIDDLE_C, 48000)).toBe(2)
    expect(afterglowMade(GLASS, MIDDLE_C, 48000)).toBe(0)
    expect(afterglowMade(GLASS, 11000, 48000)).toBe(-1)
    const halo: [number, number] = [0, 0]
    // A still halo is as loud as the knob says; a beating one comes round twice in a beat of the pair.
    expect(afterglowHalo(0.4, 0.6, 0, 0, 0, halo)).toEqual([
      expect.closeTo(0.6, 6),
      expect.closeTo(0.6, 6),
    ])
    expect(afterglowHalo(-Math.PI / 8, 1, 1, 0, 0, halo)[0]).toBeCloseTo(1.39299, 4)
    expect(afterglowHalo(-Math.PI / 8 + Math.PI / 2, 1, 1, 0, 0, halo)[0]).toBeCloseTo(1.39299, 4)
    expect(afterglowHalo(Math.PI / 8, 1, 1, 0, 0, halo)[0]).toBeCloseTo(0.24408, 4)
    // Width 1 leans it 0.7 of the way, odd partials the other way round.
    afterglowHalo(0, 1, 0, 1, 0, halo)
    expect(halo[0]).toBeCloseTo(Math.SQRT2 * Math.cos(1.7 * (Math.PI / 4)), 5)
    expect(afterglowHalo(0, 1, 0, 1, 1, halo)[1]).toBeCloseTo(
      Math.SQRT2 * Math.cos(1.7 * (Math.PI / 4)),
      5,
    )
  })

  it('moves the partials as Evolve does, the played one never and the rest at their power', () => {
    const into = new Float32Array(3)
    const toned = new Float32Array([0.5, 0.5, 0.5])
    // 0.5 · 1.8 and 0.5 · 0.2 have the power 0.82; they had 0.5: both times √(0.5 / 0.82).
    afterglowEvolved(toned, 3, 0, 0.8, [1, 1, -1], into)
    expect(into[0]).toBe(0.5)
    expect(into[1]).toBeCloseTo(0.70278, 4)
    expect(into[2]).toBeCloseTo(0.07809, 4)
    // One partial moved alone comes back to where it was.
    afterglowEvolved(toned, 2, 0, 0.8, [1, 1], into)
    expect(into[1]).toBeCloseTo(0.5, 6)
  })

  it('adds a key’s strike, glow and halo in power', () => {
    const levels = new Float32Array(9)
    const voice = afterglowStruck(defaults, MIDDLE_C, 0.7, afterglowVoice())
    expect(voice.ring).toBeCloseTo(4, 5)
    expect(voice.amp).toBeCloseTo(0.775, 6)
    // At the hit there is only the strike: Strike squared times the partial's weight.
    expect(afterglowLevels(defaults, voice, 0, 0, levels)).toBeCloseTo(0.64 * 0.62165, 4)
    expect(levels[0]).toBeCloseTo(0.64 * 0.62165, 4)
    // Two seconds on the lowest partial is 30 dB down, and the glow, if it is up, is Glow squared of its weight.
    afterglowLevels(defaults, voice, 2, 1, levels)
    const struck = 0.64 * 0.62165 * Math.pow(10, -1.5)
    const held = 0.4225 * voice.toned[0]
    expect(levels[0]).toBeCloseTo(Math.hypot(struck, held), 5)
    // The second partial has the first one's halo on it, Halo of that glow, in power.
    const plain = { ...defaults, strike: 0, halo: 0 }
    const haloed = { ...defaults, strike: 0, halo: 1 }
    const own = (afterglowLevels(plain, voice, 2, 1, levels), levels[1])
    afterglowLevels(haloed, voice, 2, 1, levels)
    expect(levels[1]).toBeCloseTo(Math.hypot(own, held), 5)
    expect(levels[8]).toBe(0)
    // A glass makes its first partial's octave on a line of its own.
    const glass = { ...haloed, source: GLASS }
    afterglowStruck(glass, MIDDLE_C, 0.7, voice)
    afterglowLevels(glass, voice, 2, 1, levels)
    expect(levels[8]).toBeCloseTo(levels[0], 6)
  })

  it('gives one pitch one voice: a key struck again goes on from the glow it has', () => {
    const first = note(C4, 3)
    const again = note(C4 * 1.002, 1)
    const other = note(C4 * 1.01, 1)
    expect(afterglowAgain([first, other, again], 0)).toBe(2)
    expect(afterglowAgain([first, other, again], 1)).toBe(-1)
    // Held two seconds when it was struck again, its glow was up.
    expect(afterglowFrom([first, other, again], 1.5, 5, [])).toEqual([0, 0, 1])
    // Let go half a second before, it had faded 18 dB; struck softer, the same glow is more of the new note.
    const gone = afterglowFrom([note(C4, 3, 1.5), note(C4, 1, null, 0)], 1.5, 5, [])
    expect(gone[1]).toBeCloseTo(Math.pow(10, -0.3) / 0.25, 5)
  })
})

describe('afterglow’s display', () => {
  const { display } = BODY_INSTRUMENT_FACES.afterglow
  const params = paramsOf('afterglow')
  const { plate } = PLAIN_COLOURS
  const run = (values: Record<string, number>, notes: DisplayNote[], seconds = 0.1) =>
    drawnPaths(runDisplay(display, params, seconds, { values, notes, signal: testSignal() }))
  const still = (values: Record<string, number>) =>
    drawnPaths(drawDisplay(display, params, { values }))
  /** A note's marks: one upright line in the accent on every row where a partial of it sounds. */
  const heads = (paths: DrawnPath[]): DrawnPath[] =>
    paths.filter(
      (path) =>
        path.kind === 'stroke' &&
        path.colour === accent &&
        path.points.length === 2 &&
        path.points[0][0] === path.points[1][0],
    )
  /** How many notes are marked: the places along the line of time that have marks. */
  const columns = (paths: DrawnPath[]): number[] =>
    [...new Set(heads(paths).map((path) => Math.round(path.points[0][0] * 100) / 100))].sort(
      (a, b) => a - b,
    )
  const tall = (path: DrawnPath): number => Math.abs(path.points[0][1] - path.points[1][1])
  /** The mark on the lowest row. */
  const lowest = (paths: DrawnPath[]): DrawnPath =>
    heads(paths).reduce((low, path) => (path.points[0][1] > low.points[0][1] ? path : low))
  /** The shapes of the picture at rest: the strikes in the ink, the glows in the plate's own colour. */
  const shapes = (paths: DrawnPath[], colour: string, alpha: number): DrawnPath[] =>
    paths.filter(
      (path) =>
        path.kind === 'fill' &&
        path.colour === colour &&
        path.alpha === alpha &&
        path.points.length > 3,
    )
  const wedges = (paths: DrawnPath[]) => shapes(paths, ink, 0.72)
  const lenses = (paths: DrawnPath[]) => shapes(paths, plate, 1)
  const right = (path: DrawnPath): number => Math.max(...path.points.map((point) => point[0]))
  const handlesOf = (values: Record<string, number> = {}) =>
    display.handles?.(viewOf(display, params, { values })) ?? []

  it('lights nothing at rest, and marks a note on each of its partials', () => {
    expect(still({}).filter((path) => path.colour === accent)).toHaveLength(0)
    expect(run({}, []).filter((path) => path.colour === accent)).toHaveLength(0)
    const one = run({}, [note(C4, 0.2)])
    expect(heads(one)).toHaveLength(8)
    expect(columns(one)).toHaveLength(1)
    // The newest note has its way so far behind it, a shape on every row.
    const way = one.filter((path) => path.kind === 'fill' && path.colour === accent)
    expect(way.length).toBeGreaterThan(4)
    expect(way.length).toBeLessThanOrEqual(8)
    expect(columns(run({}, [note(C4, 0.9), note(392, 0.2)]))).toHaveLength(2)
  })

  it('draws every source’s eight partials as a strike and a glow, and neither when its knob is down', () => {
    for (const source of [FELT, BELL, PLUCKED, GLASS]) {
      const drawn = still({ source })
      expect(wedges(drawn)).toHaveLength(8)
      expect(lenses(drawn).length).toBeGreaterThan(3)
      expect(wedges(still({ source, strike: 0 }))).toHaveLength(0)
      expect(lenses(still({ source, glow: 0 }))).toHaveLength(0)
    }
  })

  it('ends the lowest strike at Decay and has the glow full at Bloom', () => {
    const settings: Record<string, number>[] = [
      {},
      { decay: 1, bloom: 4 },
      { decay: 12, bloom: 0.5, fade: 20 },
    ]
    for (const values of settings) {
      const drawn = still({ ...values, drift: 0, evolve: 0, width: 0 })
      const [decay, bloom] = handlesOf(values)
      const strike = wedges(drawn).reduce((low, path) =>
        path.points[0][1] > low.points[0][1] ? path : low,
      )
      // The strike is too thin to draw a little before it is 60 dB down.
      expect(right(strike)).toBeLessThanOrEqual(decay.x + 1)
      expect(right(strike)).toBeGreaterThan(decay.x - 14)
      const glow = lenses(drawn).reduce((low, path) =>
        path.points[0][1] > low.points[0][1] ? path : low,
      )
      const top = glow.points.reduce((high, point) => (point[1] < high[1] ? point : high))
      expect(Math.abs(top[0] - bloom.x)).toBeLessThan(1.5)
    }
  })

  it('runs a note along the line of time by its age', () => {
    const [, bloom, fade] = handlesOf()
    // At Bloom's 1.5 s it is under the Bloom handle, and 5 s of Fade on (its strike still ringing) under the Fade handle.
    expect(columns(run({}, [note(C4, 1.5)]))[0]).toBeCloseTo(bloom.x, 1)
    expect(columns(run({ decay: 20 }, [note(C4, 6.5, 5)]))[0]).toBeCloseTo(fade.x, 1)
    expect(columns(run({}, [note(C4, 0)]))[0]).toBeCloseTo(9, 1)
  })

  it('lets the strike die by Decay, the high partials first', () => {
    const struck = { glow: 0 }
    expect(heads(run(struck, [note(C4, 0.1)]))).toHaveLength(8)
    const later = heads(run(struck, [note(C4, 2)])).length
    expect(later).toBeGreaterThan(0)
    expect(later).toBeLessThan(8)
    // Decay is 4 s: a second on, the lowest partial is 75 dB down.
    expect(heads(run(struck, [note(C4, 5)]))).toHaveLength(0)
    expect(heads(run({ glow: 0, decay: 12 }, [note(C4, 5)])).length).toBeGreaterThan(0)
    // Letting the key go does not stop it.
    expect(heads(run(struck, [note(C4, 2, 1.9)]))).toHaveLength(later)
  })

  it('holds the glow while the key is down and fades it over Fade once it is up', () => {
    const glowing = { strike: 0 }
    expect(heads(run(glowing, [note(C4, 0.01)]))).toHaveLength(0)
    expect(heads(run(glowing, [note(C4, 30)])).length).toBeGreaterThan(0)
    expect(heads(run(glowing, [note(C4, 30, 2.5)])).length).toBeGreaterThan(0)
    expect(heads(run(glowing, [note(C4, 30, 20)]))).toHaveLength(0)
    expect(heads(run({ strike: 0, fade: 30 }, [note(C4, 30, 20)])).length).toBeGreaterThan(0)
    // The same glow is thinner half a Fade on than under the key.
    expect(tall(lowest(run(glowing, [note(C4, 30, 2.5)])))).toBeLessThan(
      tall(lowest(run(glowing, [note(C4, 30)]))),
    )
  })

  it('gives a key let go early the fainter glow it earned', () => {
    const glowing = { strike: 0 }
    // Both are half a second into their fade; one was held all of Bloom, the other a fifteenth of it.
    const held = tall(lowest(run(glowing, [note(C4, 2, 0.5)])))
    const touched = tall(lowest(run(glowing, [note(C4, 2, 1.9)])))
    // √(0.09 + 0.91 / 15) of the level is the root of that of the thickness.
    expect(touched / held).toBeCloseTo(Math.sqrt(Math.sqrt(0.09 + 0.91 / 15)), 1)
  })

  it('keeps one voice for one pitch: a key struck again is one note', () => {
    const again = [note(C4, 3), note(C4, 0.4)]
    expect(columns(run({}, again))).toHaveLength(1)
    expect(columns(run({}, [note(C4, 3), note(392, 0.4)]))).toHaveLength(2)
    // It blooms from the glow it had: 0.4 s into the new bloom it is thicker than a key that was dark.
    const glowing = { strike: 0 }
    expect(tall(lowest(run(glowing, again)))).toBeGreaterThan(
      tall(lowest(run(glowing, [note(C4, 0.4)]))) * 1.5,
    )
  })

  it('marks no more notes than the device has: the faintest of more than sixteen are left out', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      ...note(110 * Math.pow(2, i / 12), 1.5 - i * 0.05),
      id: i,
    }))
    expect(columns(run({}, many))).toHaveLength(16)
  })

  it('leaves a note of the source before unmarked: a note keeps what it was struck as', () => {
    // The source is changed 0.2 s in; the first note began before that, the second after.
    const drawn = runDisplay(display, params, 0.5, { signal: testSignal() }, (time) => ({
      values: { source: time < 0.2 ? FELT : GLASS },
      notes: [note(C4, 1 + time), ...(time > 0.3 ? [note(392, time - 0.3)] : [])],
    }))
    expect(columns(drawnPaths(drawn))).toHaveLength(1)
  })

  it('keeps a note on its side of a change of source however late its age is read', () => {
    // As for the other two: the source is turned between the frames at 0.167 and 0.2 s.
    const frames = everyFrame(display, params, 1, (time, late) => ({
      values: { source: time < 0.19 ? FELT : GLASS },
      notes: [
        ...begun(C4, 0.05, time, late),
        ...begun(330, 0.17, time, late),
        ...begun(392, 0.25, time, late),
      ],
    }))
    const marked = frames.map((paths) => columns(paths).length)
    expect(marked.slice(2, 6)).toEqual([1, 1, 1, 1])
    expect(marked[6]).toBe(1)
    expect(marked[7]).toBe(1)
    for (const count of marked.slice(8)) expect(count).toBe(2)
  })

  it('puts a glass’s halo on a row of its own, and a string’s on the partials an octave up', () => {
    const glass = { source: GLASS, strike: 0 }
    const plain = heads(run({ ...glass, halo: 0 }, [note(C4, 3)]))
    const haloed = heads(run({ ...glass, halo: 1 }, [note(C4, 3)]))
    expect(haloed).toHaveLength(plain.length + 1)
    // The new row is between the first partial's and the second's, an octave over the first.
    const rows = (marks: DrawnPath[]) =>
      marks.map((path) => (path.points[0][1] + path.points[1][1]) / 2).sort((a, b) => b - a)
    expect(rows(haloed)[1]).toBeLessThan(rows(plain)[0])
    expect(rows(haloed)[1]).toBeGreaterThan(rows(plain)[1])
    // Felt has no row more: its second partial is thicker by the first one's halo.
    const felt = { strike: 0 }
    const dry = heads(run({ ...felt, halo: 0 }, [note(C4, 3)]))
    const wet = heads(run({ ...felt, halo: 1 }, [note(C4, 3)]))
    expect(wet).toHaveLength(dry.length)
    const second = (marks: DrawnPath[]) =>
      [...marks].sort((a, b) => b.points[0][1] - a.points[0][1])[1]
    expect(tall(second(wet))).toBeGreaterThan(tall(second(dry)) * 1.2)
  })

  it('shows how long the newest key was down on the line of time', () => {
    const bar = (paths: DrawnPath[]) =>
      paths.filter(
        (path) =>
          path.kind === 'stroke' &&
          path.colour === accent &&
          path.points.length === 2 &&
          path.points[0][1] === path.points[1][1],
      )
    const held = bar(run({}, [note(C4, 3)]))
    expect(held).toHaveLength(1)
    expect(right(held[0])).toBeCloseTo(columns(run({}, [note(C4, 3)]))[0], 1)
    // Let go after one second, it ends where a note one second old stands.
    expect(right(bar(run({}, [note(C4, 3, 2)]))[0])).toBeCloseTo(
      columns(run({}, [note(C4, 1)]))[0],
      1,
    )
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { decay: 0.2, bloom: 0.3, fade: 0.1 },
      { decay: 20, bloom: 20, fade: 30 },
      { decay: 7, bloom: 2.5, fade: 8 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [decay, bloom, fade] = display.handles?.(view) ?? []
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 3)
      expect(bloom.drag(bloom.x, bloom.y).bloom).toBeCloseTo(view.value('bloom'), 3)
      expect(fade.drag(fade.x, fade.y).fade).toBeCloseTo(view.value('fade'), 3)
      // Fade is measured from where the glow is up, so its handle is to the right of Bloom's.
      expect(fade.x).toBeGreaterThan(bloom.x)
      expect(fade.x).toBeLessThanOrEqual(view.width - 7)
      // The glow's handles ride over the rows and Decay's is on the lowest of them.
      expect(decay.y).toBeGreaterThan(bloom.y + 30)
      expect(fade.y).toBe(bloom.y)
    }
    // To the right is later: a longer ring, a slower bloom, a longer fade.
    const [decay, bloom, fade] = handlesOf()
    expect(decay.drag(decay.x + 5, decay.y).decay).toBeGreaterThan(4)
    expect(bloom.drag(bloom.x + 5, bloom.y).bloom).toBeGreaterThan(1.5)
    expect(fade.drag(fade.x + 5, fade.y).fade).toBeGreaterThan(5)
    expect(fade.drag(bloom.x - 5, fade.y).fade).toBe(0.1)
  })
})

describe('feedback’s figures', () => {
  /** The device at its defaults, as the figures read it. */
  const defaults: FeedbackSetting = {
    gain: 0.7,
    distance: 2,
    bloom: 0.5,
    grit: 0.35,
    pick: 0.5,
    crowd: 0.5,
    wander: 0.2,
    damp: 0.4,
    release: 1.5,
    width: 0.6,
    sampleRate: 48000,
  }

  it('reads the knobs as `Feedback::apply` and `start` do', () => {
    // Gain cubed times eight: the middle of the knob gives back just what is lost.
    expect(feedbackLift(0.5)).toBeCloseTo(1, 6)
    expect(feedbackLift(0.7)).toBeCloseTo(2.744, 6)
    expect(feedbackLift(1)).toBe(8)
    expect(feedbackStrength(0)).toBe(0.4)
    expect(feedbackStrength(1)).toBe(1)
    expect(feedbackHz(10, 48000)).toBe(27)
    expect(feedbackHz(9000, 48000)).toBe(4300)
    // 3.2 s at 110 Hz, by the root of the pitch, between 0.3 and 1.5 of that.
    expect(feedbackRing(110)).toBeCloseTo(3.2, 6)
    expect(feedbackRing(440)).toBeCloseTo(1.6, 6)
    expect(feedbackRing(27.5)).toBeCloseTo(4.8, 6)
    expect(feedbackRing(4000)).toBeCloseTo(0.96, 6)
    expect(feedbackTop(0)).toBeCloseTo(0.6, 6)
    expect(feedbackTop(0.4)).toBeCloseTo(0.18103, 4)
    expect(feedbackTop(1)).toBeCloseTo(0.03, 6)
    // No overtone over 5 kHz, and never more than the eighth.
    expect(feedbackMostOvertone(110)).toBe(8)
    expect(feedbackMostOvertone(880)).toBeCloseTo(5.6818, 4)
    expect(feedbackMostOvertone(6000)).toBe(1)
    // Wander at 1 drifts the band 2.5 overtones either way.
    expect(feedbackFavoured(2, 0.2, 1, 110)).toBeCloseTo(2.5, 6)
    expect(feedbackFavoured(2, 1, -1, 110)).toBe(1)
    expect(feedbackFavoured(6, 0, 0, 880)).toBeCloseTo(5.6818, 4)
  })

  it('drives the amplifier as Grit says, to a shape and never a level', () => {
    expect(feedbackDrive(0)).toBeCloseTo(0.1, 6)
    expect(feedbackDrive(0.5)).toBeCloseTo(0.89443, 4)
    expect(feedbackDrive(1)).toBeCloseTo(8, 6)
    // The tone a clip gives back: its drive while it is linear, towards 4/π once it is a square.
    expect(feedbackToneGain(0.1)).toBeCloseTo(0.09969, 4)
    expect(feedbackToneGain(8)).toBeCloseTo(1.25741, 4)
    // So the wave's top is 1 clean and π/4 or so torn, with a flat top.
    expect(feedbackWave(0.25, 0.1)).toBeCloseTo(0.99975, 4)
    expect(feedbackWave(0.25, 8)).toBeCloseTo(0.79529, 4)
    expect(feedbackWave(0.15, 8) / feedbackWave(0.25, 8)).toBeGreaterThan(0.99)
    expect(feedbackWave(0.15, 0.1) / feedbackWave(0.25, 0.1)).toBeCloseTo(
      Math.sin(0.3 * Math.PI),
      2,
    )
    expect(feedbackWave(0.5, 3)).toBeCloseTo(0, 6)
  })

  it('opens with Bloom and lets go with Release as `control` does', () => {
    expect(feedbackBloom(0, 0.5)).toBe(0)
    expect(feedbackBloom(0.5, 0.5)).toBeCloseTo(0.950213, 5)
    // The cube of that summed up: in the end all of the time but 11/18 of Bloom.
    expect(feedbackOpened(0, 0.5)).toBe(0)
    expect(feedbackOpened(5, 0.5)).toBeCloseTo(5 - (11 / 18) * 0.5, 5)
    expect(feedbackOpened(0.5, 0.5)).toBeCloseTo(0.218725, 4)
    // 60 dB down at Release, and a key struck again lets go in 30 ms.
    expect(feedbackHold(1.5, 1.5)).toBeCloseTo(Math.exp(-6.9), 8)
    expect(feedbackHold(0.03, 1.5, true)).toBeCloseTo(Math.exp(-6), 8)
    // The limiter holds a string at its level times the root of what Gain gives over its loss.
    const drive = feedbackDrive(0.35)
    expect(feedbackHeld(2.744, 1, 0.95, 1, drive)).toBeCloseTo(1.49499, 4)
    expect(feedbackHeld(8, 0.4, 1, 0.5, drive)).toBeCloseTo(0.565685, 5)
    expect(feedbackHeld(0.9, 1, 1, 1, drive)).toBe(0)
    // Twelve hard keys at full Gain ask for 0.25 · 12 · √8 = 8.49; the ceiling is 1.5.
    expect(feedbackFit(12, 8)).toBeCloseTo(0.176777, 5)
    expect(feedbackFit(1, 8)).toBe(1)
    expect(feedbackFit(12, 1)).toBe(1)
  })

  it('plucks as hard as Pick says, and lets the pluck die as the string does', () => {
    // Struck at Pick times 1.6 of the level, which the limiter reads as 0.73 of that. The header
    // run natively reads a pluck at Pick 1 as 1.17 of the level at 110 Hz, and 1.16 to 1.25 from A1 to A6.
    expect(feedbackPluck(1, 1, 0, 3.2, 0, 0)).toBeCloseTo(1.168, 6)
    expect(feedbackPluck(1, 1, 0, 3.2, 0, 0)).toBeGreaterThan(1.16)
    expect(feedbackPluck(1, 1, 0, 3.2, 0, 0)).toBeLessThan(1.25)
    expect(feedbackPluck(0.5, 0.4, 0, 3.2, 0, 0)).toBeCloseTo(0.2336, 6)
    // One ring on it is 60 dB down.
    expect(feedbackPluck(0.5, 1, 3.2, 3.2, 0, 2)).toBeCloseTo(0.000584, 6)
    // Where a note dies the feedback still gives part of the loss back, here half, for the second it has been open: 1.5 s lost of 2.
    expect(feedbackPluck(0.5, 1, 2, 3.2, 0.5, 1)).toBeCloseTo(0.584 * Math.pow(10, -1.40625), 6)
    expect(feedbackPluck(0.5, 1, 2, 3.2, 0.5, 1)).toBeCloseTo(0.022917, 4)
  })

  it('holds a note by Gain and by Grit, as the header does when it is run', () => {
    // The amplifier in the loop gives a faint tone back larger than one at the key's level.
    expect(feedbackFaint(feedbackDrive(0))).toBeCloseTo(1.0031, 4)
    expect(feedbackFaint(feedbackDrive(0.35))).toBeCloseTo(1.0642, 3)
    expect(feedbackFaint(feedbackDrive(1))).toBeCloseTo(6.3623, 3)
    // Run natively at 110 Hz with a pick, thirty seconds held: at Grit 0.35 a key holds at
    // Gain 0.5 and dies at 0.48; at Grit 0.7 it holds at 0.45 and dies at 0.3; at Grit 1 it
    // holds at 0.3 (the header's own word is that Gain alone decides, from 0.5 up).
    const holds = (gain: number, grit: number) =>
      feedbackHolds(feedbackLift(gain), feedbackDrive(grit))
    expect(holds(0.5, 0.35)).toBe(true)
    expect(holds(0.48, 0.35)).toBe(false)
    expect(holds(0.45, 0.7)).toBe(true)
    expect(holds(0.3, 0.7)).toBe(false)
    expect(holds(0.3, 1)).toBe(true)
    expect(holds(0.25, 1)).toBe(false)
    expect(holds(0.48, 0)).toBe(false)
    // The sizes they settled at natively, of the key's level: 1.01 at Gain 0.5 and Grit 0.35;
    // at Grit 1, 0.18 at Gain 0.3, 0.57 at 0.4 and 0.83 at 0.45. Within 1.5 dB of each.
    const held = (gain: number, grit: number) =>
      feedbackHeld(feedbackLift(gain), 1, 1, 1, feedbackDrive(grit))
    const near = (shown: number, native: number) =>
      expect(Math.abs(20 * Math.log10(shown / native))).toBeLessThan(1.5)
    near(held(0.5, 0.35), 1.007)
    near(held(0.3, 1), 0.178)
    near(held(0.4, 1), 0.567)
    near(held(0.45, 1), 0.83)
    expect(held(0.48, 0.35)).toBe(0)
    // Over the middle of Gain the limiter has the string, whatever Grit is.
    expect(held(0.7, 1)).toBeCloseTo(Math.sqrt(2.744), 6)
    // Release closes what Grit holds as it closes the rest.
    expect(feedbackHeld(0.512, 1, 1, 0.25, 8)).toBeCloseTo(0.25 * held(0.4, 1), 9)
  })

  it('shares the amplifier as Crowd says: sizes as strengths to a power, together their power mean', () => {
    expect(feedbackCrowdPower(0)).toBe(1)
    expect(feedbackCrowdPower(0.5)).toBeCloseTo(2.99317, 4)
    expect(feedbackCrowdPower(1)).toBe(Infinity)
    // Each by itself.
    expect(feedbackShares([1, 0.8, 0.64], 1, [])).toEqual([
      expect.closeTo(1, 6),
      expect.closeTo(0.8, 6),
      expect.closeTo(0.64, 6),
    ])
    // To the power 3: the cubes are 1, 0.512 and 0.262144, their mean 1.774144 to the third: 1.21059.
    const shared = feedbackShares([1, 0.8, 0.64], 3, [])
    expect(shared[0]).toBeCloseTo(0.68235, 4)
    expect(shared[1]).toBeCloseTo(0.34936, 4)
    expect(shared[2]).toBeCloseTo(0.17887, 4)
    expect(shared[0] + shared[1] + shared[2]).toBeCloseTo(Math.cbrt(1.774144), 5)
    // All to one.
    expect(feedbackShares([0.8, 1, 0.64], Infinity, [])).toEqual([0, 1, 0])
    // Wander leans a string's hold by its cube root, up to 2.65 octaves, and less as Crowd rises.
    expect(feedbackLean(0, 0.5)).toBe(0)
    expect(feedbackLean(1, 0)).toBeCloseTo(2.65, 6)
    expect(feedbackLean(1, 1)).toBeCloseTo(0.318, 6)
    expect(feedbackLean(0.2, 0.5)).toBeCloseTo(0.86901, 3)
  })

  it('loses round the string what `FeedbackString::set` sets', () => {
    // 110 Hz rings 3.2 s: 60 dB in 352 trips, 1 - 10^(-3/352) lost in each.
    const loss = feedbackLoss(110, 0.4, 48000)
    expect(feedbackLost(loss, 1)).toBeCloseTo(0.019433, 5)
    // At 3 kHz it rings 0.181 of that: 1 - 10^(-3 / (110 · 0.5793)).
    expect(feedbackLost(loss, 3000 / 110)).toBeCloseTo(0.10273, 4)
    expect(loss.pole).toBeCloseTo(0.42, 1)
    // Damp takes the top sooner and leaves the note alone.
    const dark = feedbackLoss(110, 1, 48000)
    expect(feedbackLost(dark, 1)).toBeCloseTo(0.019433, 5)
    expect(feedbackLost(dark, 8)).toBeGreaterThan(2 * feedbackLost(loss, 8))
    // A high string may not have the pole its top asks for (0.44 here): it would put its overtones sharp, so the top rings longer than asked.
    const high = feedbackLoss(2000, 1, 48000)
    expect(high.pole).toBeLessThan(0.19)
    expect(high.pole).toBeGreaterThan(0.16)
    expect(feedbackLost(high, 2)).toBeLessThan(1 - 0.886985)
  })

  it('passes through the band what `draw` lets through', () => {
    // A band on a whole overtone passes half of it, a quarter of each neighbour and nothing of the next.
    expect(feedbackPassed(2, 2)).toBeCloseTo(0.5, 6)
    expect(feedbackPassed(2, 1)).toBeCloseTo(0.25, 6)
    expect(feedbackPassed(2, 3)).toBeCloseTo(0.25, 6)
    expect(feedbackPassed(2, 4)).toBeCloseTo(0, 6)
    expect(feedbackPassed(5, 5)).toBeCloseTo(0.5, 6)
    // Its mean is taken out, which costs the note itself half of what it would pass.
    expect(feedbackPassed(1, 1)).toBeCloseTo(0.25, 6)
    // The eighth is every other tap turned over: all of it comes through.
    expect(feedbackPassed(8, 8)).toBeCloseTo(1, 6)
  })

  it('sings on the overtone that gets the most back for what it loses', () => {
    const loss = feedbackLoss(110, 0.4, 48000)
    // What an overtone costs: its loss over what the band gives back of it.
    expect(feedbackCost(2, 2, loss)).toBeCloseTo(feedbackLost(loss, 2) / 0.5, 6)
    expect(feedbackCost(2, 1, loss)).toBeCloseTo(feedbackLost(loss, 1) / 0.25, 6)
    expect(feedbackCost(2, 4, loss)).toBe(Infinity)
    // None over 0.45 of the rate.
    expect(feedbackCost(8, 300, loss)).toBe(Infinity)
    for (const overtone of [1, 2, 3, 5, 8]) expect(feedbackSung(overtone, loss)).toBe(overtone)
    // Between two the one that loses less wins: the lower.
    expect(feedbackSung(2.5, loss)).toBe(2)
    expect(feedbackSung(2.9, loss)).toBe(3)
    // A high note's band stops at 5 kHz: 880 Hz at 5.68, where the fifth costs least.
    const high = feedbackLoss(880, 0.4, 48000)
    expect(feedbackSung(feedbackFavoured(8, 0, 0, 880), high)).toBe(5)
    // But the loop has no such stop: E5's band is held at 7.58, and the eighth (5.3 kHz) costs less than the seventh.
    const e5 = feedbackLoss(659.26, 0.4, 48000)
    expect(feedbackSung(feedbackFavoured(8, 0, 0, 659.26), e5)).toBe(8)
  })

  /** A key of the keyboard, 69 being A4. */
  const keyHz = (key: number): number => 440 * Math.pow(2, (key - 69) / 12)

  it('says which overtones a key may sing on, as the header sang when it was run', () => {
    // `feedback.h` built and run at 48 kHz with Wander at 0: each key held four seconds and the
    // loudest overtone on its string taken. [key, Distance, Damp, the overtone found, what else was set].
    // The rows from G5 up are where the display's former law (`draw`'s, with its stop at 5 kHz) said another.
    const found: [number, number, number, number, string][] = [
      [45, 1, 0.4, 1, ''],
      [45, 2, 0.4, 2, ''],
      [45, 3, 0.4, 3, ''],
      [45, 5, 0.4, 5, ''],
      [45, 7, 0.4, 7, ''],
      [45, 8, 0.4, 8, ''],
      [79, 2, 0.4, 2, 'G5: the law said 1'],
      [80, 2, 0.4, 2, 'the law said 1'],
      [81, 2, 0.4, 1, 'A5'],
      [81, 2, 0.4, 2, 'A5 again, with Gain at 1'],
      [76, 8, 0.4, 8, 'E5: the law said 7'],
      [78, 7, 0.4, 7, 'the law said 6'],
      [84, 5, 0.4, 5, 'C6: the law said 4'],
      [84, 3, 0.4, 3, 'the law said 2'],
      [96, 3, 0.4, 2, 'C7: the law said 1'],
      [45, 1, 0.4, 2, 'Pick at 0'],
      [44, 7, 0.4, 9, 'Pick at 0'],
      [84, 2, 0.4, 2, 'Pick at 0'],
      [45, 1.5, 0.4, 1, 'Grit at 1'],
      [45, 2.5, 0, 2, ''],
      [93, 3, 0, 3, ''],
    ]
    for (const [key, distance, damp, loudest] of found) {
      const hz = keyHz(key)
      const sings = feedbackSings(distance, 0, hz, feedbackLoss(hz, damp, 48000))
      expect(sings.low).toBeLessThanOrEqual(loudest)
      expect(sings.high).toBeGreaterThanOrEqual(loudest)
      expect(sings.sung).toBeGreaterThanOrEqual(sings.low)
      expect(sings.sung).toBeLessThanOrEqual(sings.high)
    }
    // Where one overtone costs clearly least it is the only one named.
    const loss = feedbackLoss(110, 0.4, 48000)
    for (const distance of [2, 3, 5, 8])
      expect(feedbackSings(distance, 0, 110, loss)).toEqual({
        sung: distance,
        low: distance,
        high: distance,
      })
    // At Distance 1 the band gives the second back as much as the note itself, and at 7 the eighth and ninth as much as the seventh.
    expect(feedbackSings(1, 0, 110, loss)).toEqual({ sung: 1, low: 1, high: 2 })
    expect(feedbackSings(7, 0, 110, loss)).toEqual({ sung: 7, low: 7, high: 9 })
  })

  it('says how far Wander may carry a note, and no moment of it', () => {
    // The same header, two minutes of each: [Distance, Wander, key, the lowest and highest overtone the string was found on].
    const heard: [number, number, number, number, number][] = [
      [2, 0.2, 45, 2, 2],
      [5, 0.2, 45, 5, 5],
      [2, 0.2, 81, 1, 2],
      [2, 0.5, 45, 2, 3],
      [2, 0.5, 57, 1, 3],
      [5, 0.5, 57, 4, 6],
      [2, 1, 69, 1, 4],
      [1, 1, 45, 1, 3],
      [5, 1, 81, 2, 5],
    ]
    for (const [distance, wander, key, low, high] of heard) {
      const hz = keyHz(key)
      const sings = feedbackSings(distance, wander, hz, feedbackLoss(hz, 0.4, 48000))
      expect([sings.low, sings.high]).toEqual([low, high])
    }
    // Wander never narrows what is said, and the likeliest stays Distance's own.
    const loss = feedbackLoss(220, 0.4, 48000)
    let wide = 0
    for (const wander of [0, 0.2, 0.5, 1]) {
      const sings = feedbackSings(4, wander, 220, loss)
      expect(sings.sung).toBe(4)
      expect(sings.high - sings.low).toBeGreaterThanOrEqual(wide)
      wide = sings.high - sings.low
    }
    expect(wide).toBeGreaterThanOrEqual(3)
  })

  it('knows of a key its pluck and the level the limiter holds it at', () => {
    const sizes: [number, number] = [0, 0]
    // What the second overtone of 110 Hz, the one Distance 2 sings, loses in a trip round.
    const need = feedbackLost(feedbackLoss(110, 0.4, 48000), 2)
    // Held five seconds: the pluck is 94 dB down, and the string is at √2.744 of its level.
    expect(feedbackNote(defaults, note(110, 5), null, 1, need, sizes)).toBeCloseTo(1.6565, 4)
    expect(sizes[0]).toBeCloseTo(0.584 * Math.pow(10, -4.6875), 8)
    // At the key there is only the pluck: Pick times 1.6 of the key's level, as the limiter reads it.
    expect(feedbackNote(defaults, note(110, 0, null, 0), null, 1, need, sizes)).toBeCloseTo(
      0.2336,
      6,
    )
    expect(sizes[1]).toBe(0)
    // Let go 0.75 s ago, half of Release: the hold is exp(-3.45).
    feedbackNote(defaults, note(110, 5, 0.75), null, 1, need, sizes)
    expect(sizes[1]).toBeCloseTo(1.656502 * Math.exp(-3.45), 5)
    // And a hand is on the string, because Release is shorter than its ring: 10^(-3 · 0.75 · (1/1.5 - 1/3.2)).
    feedbackNote(defaults, note(110, 1, 0.75), null, 1, need, sizes)
    expect(sizes[0]).toBeCloseTo(0.584 * Math.pow(10, -3 / 3.2) * Math.pow(10, -0.796875), 6)
    // Its key struck again 30 ms ago: exp(-6) of it is left.
    feedbackNote(defaults, note(110, 5), 0.03, 1, need, sizes)
    expect(sizes[1]).toBeCloseTo(1.656502 * Math.exp(-6), 6)
    // Under the threshold nothing holds, and what the ceiling leaves scales the level.
    feedbackNote({ ...defaults, gain: 0.4 }, note(110, 5), null, 1, need, sizes)
    expect(sizes[1]).toBe(0)
    feedbackNote(defaults, note(110, 5), null, 0.5, need, sizes)
    expect(sizes[1]).toBeCloseTo(0.82825, 4)
    // What the keys ask together: each its level, as far as Bloom has opened it and Release left it.
    expect(
      feedbackAsked(defaults, [note(110, 5), note(220, 5, null, 0)], [null, null]),
    ).toBeCloseTo(1.4, 5)
    expect(feedbackAsked(defaults, [note(110, 5, 0.75)], [null])).toBeCloseTo(Math.exp(-3.45), 5)
  })
})

describe('feedback’s opening, against the header run natively', () => {
  const set: FeedbackSetting = {
    gain: 0.7,
    distance: 2,
    bloom: 0.5,
    grit: 0.35,
    pick: 0,
    crowd: 0.5,
    wander: 0,
    damp: 0.4,
    release: 1.5,
    width: 0.6,
    sampleRate: 48000,
  }
  const need = feedbackLost(feedbackLoss(110, 0.4, 48000), 2)
  const sizes: [number, number] = [0, 0]
  const sizeAt = (values: Partial<FeedbackSetting>, age: number, released: number | null = null) =>
    feedbackNote({ ...set, ...values }, note(110, age, released), null, 1, need, sizes)
  /** How far apart two sizes are, in dB. */
  const apart = (shown: number, native: number) => Math.abs(20 * Math.log10(shown / native))

  it('brings a string with no pick out of the hum as late as the device does', () => {
    // A2 with Pick at 0, its size as the limiter reads it, of the key's level. Gain 0.55: 0.004 one
    // second on, 0.56 at two, 1.156 at four. The level Bloom opens is there in half a second.
    expect(sizeAt({ gain: 0.55 }, 1)).toBeLessThan(0.01)
    expect(apart(sizeAt({ gain: 0.55 }, 2), 0.562)).toBeLessThan(1.5)
    expect(apart(sizeAt({ gain: 0.55 }, 4), 1.156)).toBeLessThan(0.1)
    // Gain 0.6: 0.137 at half a second and 1.288 at one.
    expect(sizeAt({ gain: 0.6 }, 0.5)).toBeLessThan(0.3)
    expect(apart(sizeAt({ gain: 0.6 }, 1), 1.288)).toBeLessThan(0.3)
    // Gain 0.7: 0.567, 0.914, 1.345 and 1.616 at 0.2, 0.3, 0.5 and 1 s. No more than doubling in a trip round keeps it to 0.08 at a tenth.
    expect(sizeAt({ gain: 0.7 }, 0.1)).toBeLessThan(0.2)
    expect(apart(sizeAt({ gain: 0.7 }, 0.3), 0.914)).toBeLessThan(2.5)
    expect(apart(sizeAt({ gain: 0.7 }, 0.5), 1.345)).toBeLessThan(1)
    expect(apart(sizeAt({ gain: 0.7 }, 1), 1.616)).toBeLessThan(0.3)
    // With a pick the feedback starts from the pluck and is on the level in time: 1.138 at one second with Gain at 0.55.
    expect(apart(sizeAt({ gain: 0.55, pick: 0.5 }, 1), 1.138)).toBeLessThan(0.3)
  })

  it('grows a string by what Gain gives over its loss, as far as Bloom has opened', () => {
    const drive = feedbackDrive(0.35)
    // Nothing given yet at the key.
    expect(feedbackGrown(2.744, 0.5, 0, 0.5, need, 110, drive)).toBe(0.5)
    // A string with no pick starts from the hum.
    expect(feedbackGrown(2.744, 0, 0, 0.5, need, 110, drive)).toBeCloseTo(0.00006, 9)
    // Never more than doubled in a trip round: 110 trips in a second.
    expect(feedbackGrown(8, 0.001, 0.1, 0.5, need, 110, drive)).toBeCloseTo(
      0.001 * Math.pow(2, 11),
      6,
    )
    // Where Gain gives less than the loss the string only sinks.
    expect(feedbackGrown(0.5, 0.5, 2, 0.5, need, 110, drive)).toBeLessThan(0.5)
  })

  it('lets go over Release as the device does', () => {
    // Held four seconds at Gain 0.7 with a pick and let go: 1.218, 0.575, 0.087 and 0.003 of the level at 0.1, 0.3, 0.75 and 1.5 s.
    const up = (after: number) => sizeAt({ pick: 0.5 }, 4 + after, after)
    expect(apart(up(0.1), 1.218)).toBeLessThan(1.5)
    expect(apart(up(0.3), 0.575)).toBeLessThan(3)
    expect(up(0.75)).toBeLessThan(0.087)
    expect(up(1.5)).toBeLessThan(0.003)
  })
})

describe('feedback’s display', () => {
  const { display } = BODY_INSTRUMENT_FACES.feedback
  const params = paramsOf('feedback')
  const run = (values: Record<string, number>, notes: DisplayNote[], seconds = 0.1) =>
    drawnPaths(runDisplay(display, params, seconds, { values, notes, signal: testSignal() }))
  const still = (values: Record<string, number>) =>
    drawnPaths(drawDisplay(display, params, { values }))
  /** At 128 wide the strings stand left of x = 34 and the wave runs from 39 to the speaker, over the line of a note's life. */
  const wires = (paths: DrawnPath[], colour: string): DrawnPath[] =>
    paths.filter(
      (path) =>
        path.kind === 'stroke' &&
        path.colour === colour &&
        path.points.length >= 50 &&
        path.points.every((point) => point[0] < 37),
    )
  /** A string as it most likely stands is in full ink; the other ways it may stand are pale outlines under it. */
  const strings = (paths: DrawnPath[], colour: string): DrawnPath[] =>
    wires(paths, colour).filter((path) => path.alpha === 1)
  const outlines = (paths: DrawnPath[], colour: string): DrawnPath[] =>
    wires(paths, colour).filter((path) => path.alpha < 1)
  const words = (values: Record<string, number>, notes: DisplayNote[] = []) =>
    drawDisplay(display, params, { values, notes }).words()
  const waves = (paths: DrawnPath[], colour: string): DrawnPath[] =>
    paths.filter(
      (path) =>
        path.kind === 'stroke' &&
        path.colour === colour &&
        path.points.length > 8 &&
        path.points.every((point) => point[0] >= 39 && point[1] < 55),
    )
  /** A string is drawn down one side of its swing and up the other: its loops are the places where the two sides stand furthest apart. */
  const loops = (path: DrawnPath): number => {
    const last = path.points.length - 1
    const apart = (i: number): number => path.points[i][0] - path.points[last - i][0]
    let count = 0
    for (let i = 1; i < last / 2; i++)
      if (apart(i) > 0.01 && apart(i) > apart(i - 1) && apart(i) >= apart(i + 1)) count++
    return count
  }
  /** How far a string reaches to either side of where it stands. */
  const swing = (path: DrawnPath): number => {
    const across = path.points.map((point) => point[0])
    return (Math.max(...across) - Math.min(...across)) / 2
  }
  const handlesOf = (values: Record<string, number> = {}) =>
    display.handles?.(viewOf(display, params, { values })) ?? []

  it('lights nothing at rest, and gives every key that sounds a string of its own', () => {
    expect(still({}).filter((path) => path.colour === accent)).toHaveLength(0)
    expect(run({}, []).filter((path) => path.colour === accent)).toHaveLength(0)
    expect(strings(still({}), ink)).toHaveLength(1)
    const one = run({}, [note(C4, 1)])
    expect(strings(one, accent)).toHaveLength(1)
    // The string at rest makes way for the ones that sound.
    expect(strings(one, ink)).toHaveLength(0)
    expect(strings(run({}, [note(C4, 1), note(330, 0.5), note(392, 0.2)]), accent)).toHaveLength(3)
  })

  it('stands the string in the overtone it would sing, with as many cycles in the air', () => {
    for (const distance of [3, 5, 8]) {
      expect(loops(strings(still({ distance }), ink)[0])).toBe(distance)
      expect(loops(strings(run({ distance }, [note(110, 2)]), accent)[0])).toBe(distance)
      // The wave rises through its middle once for each cycle between the speaker and the strings.
      const wave = waves(still({ distance, width: 0 }), ink)[0]
      const middle = (wave.points[0][1] + wave.points[wave.points.length - 1][1]) / 2
      let rises = 0
      for (let i = 1; i < wave.points.length; i++)
        if (wave.points[i - 1][1] >= middle - 0.01 && wave.points[i][1] < middle - 0.01) rises++
      expect(rises).toBe(distance)
    }
    // A high key has fewer overtones to stand in: 880 Hz stands in the fifth, or the sixth, which costs it little more.
    const high = run({ distance: 8 }, [note(880, 2)])
    expect(loops(strings(high, accent)[0])).toBe(5)
    expect(outlines(high, accent).map(loops)).toEqual([6])
  })

  it('draws and names every overtone a string may sing on, and one only where one is known', () => {
    // At the defaults the second and no other: run natively, A2 stayed on it for two minutes of Wander at 0.2.
    expect(outlines(still({}), ink)).toHaveLength(0)
    expect(words({})).toContain('harmonic 2')
    expect(words({}, [note(110, 2)])).toContain('A2 harmonic 2')
    // Distance 1 gives the second back as much as the note itself: either may sing.
    const one = still({ distance: 1 })
    expect(loops(strings(one, ink)[0])).toBe(1)
    expect(outlines(one, ink).map(loops)).toEqual([2])
    expect(words({ distance: 1 })).toContain('harmonics 1 to 2')
    // A5 at Distance 2 sang on the first with Gain at 0.7 and on the second with Gain at 1.
    const a5 = run({ wander: 0 }, [note(880, 2)])
    expect(loops(strings(a5, accent)[0])).toBe(1)
    expect(outlines(a5, accent).map(loops)).toEqual([2])
    // Wander carries a note no one knows where: only how far is said, and drawn.
    const wide = still({ wander: 1 })
    expect(loops(strings(wide, ink)[0])).toBe(2)
    expect(outlines(wide, ink).map(loops)).toEqual([4])
    expect(words({ wander: 1 })).toContain('harmonics 2 to 4')
    expect(words({ wander: 0 })).toContain('harmonic 2')
    // The pitch is named with it where both fit beside the other word.
    expect(words({ wander: 1 }, [note(110, 2)])).toContain('harmonics 2 to 4')
    // A string that dies is only pulled aside: no overtone is drawn for it.
    expect(outlines(still({ gain: 0.3, wander: 1 }), ink)).toHaveLength(0)
  })

  it('says a note holds where the device holds it: by Gain, and by Grit under the middle of Gain', () => {
    expect(words({})).toContain('Holds')
    expect(words({ gain: 0.48 })).toContain('Dies')
    expect(words({ gain: 0.3 })).toContain('Dies')
    // Run natively, a key at Gain 0.3 with Grit at 1 never dies: it settles at 0.18 of its level.
    expect(words({ gain: 0.3, grit: 1 })).toContain('Holds')
    expect(words({ gain: 0.25, grit: 1 })).toContain('Dies')
    const torn = strings(still({ gain: 0.3, grit: 1 }), ink)[0]
    const full = strings(still({ gain: 0.7, grit: 1 }), ink)[0]
    expect(swing(torn)).toBeGreaterThan(0.5)
    expect(swing(torn)).toBeLessThan(swing(full) / 2)
    // And a key held there is lit for as long as it is down.
    expect(strings(run({ gain: 0.3, grit: 1 }, [note(C4, 60)]), accent)).toHaveLength(1)
    expect(strings(run({ gain: 0.3 }, [note(C4, 60)]), accent)).toHaveLength(0)
  })

  it('moves the speaker off with Distance, and makes the wave as large as Gain', () => {
    const mouth = (values: Record<string, number>) =>
      Math.max(...waves(still({ width: 0, ...values }), ink)[0].points.map((point) => point[0]))
    expect(mouth({ distance: 1 })).toBeLessThan(mouth({ distance: 2 }))
    expect(mouth({ distance: 2 })).toBeLessThan(mouth({ distance: 8 }))
    const reach = (values: Record<string, number>) => {
      const up = waves(still({ width: 0, grit: 0, ...values }), ink)[0].points.map(
        (point) => point[1],
      )
      return (Math.max(...up) - Math.min(...up)) / 2
    }
    expect(reach({ gain: 1 })).toBeCloseTo(9, 0)
    expect(reach({ gain: 0.5 })).toBeCloseTo(4.5, 0)
    // The right is a tenth of a cycle behind the left at Width 1, and one with it at 0.
    expect(waves(still({ width: 1 }), ink)).toHaveLength(2)
    expect(waves(still({ width: 0 }), ink)).toHaveLength(1)
  })

  it('pulls the string aside where Gain lets a note die, and stands it where Gain holds', () => {
    const dying = strings(still({ gain: 0.3, distance: 3 }), ink)[0]
    // Pulled one way only: the two sides of the path lie on each other.
    const half = dying.points.length / 2
    for (let i = 0; i < half; i++)
      expect(dying.points[i][0]).toBeCloseTo(dying.points[dying.points.length - 1 - i][0], 6)
    expect(swing(dying)).toBeGreaterThan(1)
    expect(swing(strings(still({ gain: 0.3, pick: 0 }), ink)[0])).toBe(0)
    // Held, it swings wider the more Gain gives.
    expect(swing(strings(still({ gain: 1 }), ink)[0])).toBeGreaterThan(
      swing(strings(still({ gain: 0.55 }), ink)[0]) + 1,
    )
  })

  it('holds a key as long as it is down where Gain holds, and lets it go over Release', () => {
    expect(strings(run({}, [note(C4, 60)]), accent)).toHaveLength(1)
    expect(strings(run({}, [note(C4, 60, 0.7)]), accent)).toHaveLength(1)
    expect(strings(run({}, [note(C4, 60, 1.6)]), accent)).toHaveLength(0)
    expect(strings(run({ release: 8 }, [note(C4, 60, 1.6)]), accent)).toHaveLength(1)
    // Half of Release on, the string swings less than under the key.
    expect(swing(strings(run({}, [note(C4, 60, 0.75)]), accent)[0])).toBeLessThan(
      swing(strings(run({}, [note(C4, 60)]), accent)[0]) / 2,
    )
  })

  it('lets a plucked note die where Gain does not hold it', () => {
    const dies = { gain: 0.3 }
    expect(strings(run(dies, [note(C4, 0.2)]), accent)).toHaveLength(1)
    expect(strings(run(dies, [note(C4, 10)]), accent)).toHaveLength(0)
    // With no pick there is nothing to hear at all.
    expect(strings(run({ gain: 0.3, pick: 0 }, [note(C4, 0.2)]), accent)).toHaveLength(0)
    // Where Gain holds, a key with no pick has its string from the start, and it swells with Bloom.
    const swells = { pick: 0, bloom: 2 }
    expect(strings(run(swells, [note(C4, 0.001)]), accent)).toHaveLength(1)
    expect(swing(strings(run(swells, [note(C4, 0.3)]), accent)[0])).toBeLessThan(
      swing(strings(run(swells, [note(C4, 4)]), accent)[0]) / 2,
    )
  })

  it('lights no more keys than the device has strings, and lets a key struck again go', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      ...note(110 * Math.pow(2, i / 12), 3 - i * 0.1),
      id: i,
    }))
    expect(strings(run({}, many), accent)).toHaveLength(12)
    const again = [
      { ...note(220, 2), id: 7 },
      { ...note(220, 0.3), id: 7 },
    ]
    expect(strings(run({}, again), accent)).toHaveLength(1)
    // Let go first, the old note sinks beside the new one.
    expect(
      strings(run({ release: 12 }, [{ ...note(220, 2, 1), id: 7 }, again[1]]), accent),
    ).toHaveLength(2)
  })

  it('sends the sound through the air only while a key sounds', () => {
    expect(waves(run({}, [note(C4, 1)]), accent)).toHaveLength(1)
    expect(waves(run({}, [note(C4, 60, 5)]), accent)).toHaveLength(0)
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { distance: 1, bloom: 0.02, release: 0.05 },
      { distance: 8, bloom: 8, release: 12, gain: 1 },
      { distance: 3.5, bloom: 2, release: 4, gain: 0.3 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [distance, bloom, release] = display.handles?.(view) ?? []
      expect(distance.drag(distance.x, distance.y).distance).toBeCloseTo(view.value('distance'), 3)
      expect(bloom.drag(bloom.x, bloom.y).bloom).toBeCloseTo(view.value('bloom'), 3)
      expect(release.drag(release.x, release.y).release).toBeCloseTo(view.value('release'), 3)
      // Bloom is on the key's side of the line of a note's life and Release on the other.
      expect(bloom.x).toBeLessThan(release.x)
    }
    // The speaker is the handle of Distance: further off is a higher overtone.
    const [distance, bloom, release] = handlesOf()
    expect(distance.drag(distance.x + 8, distance.y).distance).toBeGreaterThan(2)
    expect(bloom.drag(bloom.x + 5, bloom.y).bloom).toBeGreaterThan(0.5)
    expect(release.drag(release.x + 5, release.y).release).toBeGreaterThan(1.5)
    // The Bloom handle rides the level, which is higher the more Gain gives.
    expect(handlesOf({ gain: 1 })[1].y).toBeLessThan(handlesOf({ gain: 0.6 })[1].y)
  })
})
