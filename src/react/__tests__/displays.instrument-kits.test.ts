// The truth of the kits' displays: each of the twelve sounds is set up as the
// device sets it up, a hit lights the sound its key strikes for as long as the
// device lets it sound, what chokes another does so here too, and what a hit
// draws by chance is shown as a range and not as a value.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  DRUM_CHOKE_SEC,
  KIT_INSTRUMENT_FACES,
  drumChoke,
  drumCutHz,
  drumDrive,
  drumHitLevel,
  drumLength,
  drumLengthSpan,
  drumPadBox,
  drumPlace,
  drumRemainingDb,
  drumRingSeconds,
  drumToneFactor,
  drumTuning,
  drumVoice,
  drumVoiceBlank,
  glitchBandHz,
  glitchBuzzCrest,
  glitchBuzzPulses,
  glitchCrushClock,
  glitchCrushStep,
  glitchDuration,
  glitchEvents,
  glitchFromHz,
  glitchHitLevel,
  glitchLasts,
  glitchLengthSpan,
  glitchPeriod,
  glitchPitchBox,
  glitchPitchSpan,
  glitchPlace,
  glitchRound,
  glitchSeconds,
  glitchThrow,
  glitchToHz,
  glitchToneHz,
  glitchTrackBox,
  glitchTuning,
  kitKey,
  kitTuning,
} from '../components/displays/instrument-kits'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent } = PLAIN_COLOURS

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
/** Everything painted in the accent as a path: lines and filled shapes. */
const accentPaths = (drawn: RecordingContext): DrawnPath[] =>
  drawnPaths(drawn).filter((path) => path.colour === accent)
/** Whether anything at all is lit. */
const lit = (drawn: RecordingContext): boolean =>
  accentRects(drawn).length > 0 ||
  accentPaths(drawn).length > 0 ||
  drawn.calls.some(
    (call, at) =>
      call.name === 'fillText' &&
      drawn.calls
        .slice(0, at)
        .reverse()
        .find((before) => before.name === 'set fillStyle')?.args[0] === accent,
  )

/** A part of the picture a test goes on to measure: it has to be there. */
function must<T>(part: T | undefined): T {
  if (part === undefined) throw new Error('that part was not drawn')
  return part
}

describe('a kit’s keys', () => {
  it('are the twelve keys of the octave, whatever octave they are played in', () => {
    expect(kitKey(261.63)).toBe(0)
    expect(kitKey(220)).toBe(9)
    expect(kitKey(523.25)).toBe(0)
    expect(kitKey(hzOf(11, -3))).toBe(11)
    // A key a few cents off is still its key.
    expect(kitKey(261.63 * 2 ** (40 / 1200))).toBe(0)
    for (let key = 0; key < 12; key++) expect(kitKey(hzOf(key))).toBe(key)
  })

  it('tune their sound by the octave, as `kit::OctaveKey::semitones` has it', () => {
    // MIDI 60 to 71 is the octave a kit is written in.
    expect(kitTuning(hzOf(0))).toBeCloseTo(0, 6)
    expect(kitTuning(hzOf(11))).toBeCloseTo(0, 6)
    expect(kitTuning(hzOf(0, 1))).toBeCloseTo(12, 6)
    expect(kitTuning(hzOf(9, -1))).toBeCloseTo(-12, 6)
    // Two octaves is as far as it reaches.
    expect(kitTuning(hzOf(0, 3))).toBeCloseTo(24, 6)
    expect(kitTuning(hzOf(0, -4))).toBeCloseTo(-24, 6)
    // The cents a key lies off its pitch go into the tuning.
    expect(kitTuning(hzOf(0) * 2 ** (30 / 1200))).toBeCloseTo(0.3, 6)
  })
})

describe('the drum kit’s figures', () => {
  const KICK = 0
  const SUB = 1
  const SNARE = 2
  const BRUSH = 3
  const RIM = 4
  const CLOSED_HAT = 5
  const SHAKER = 6
  const OPEN_HAT = 7
  const CLAP = 8
  const LOW_TOM = 9
  const TICK = 10
  const HIGH_TOM = 11
  /** A drum at the defaults of `device.json` unless told: Soft, untuned, Length 1, Punch 0.35, Snap 0.3, struck at 0.7. */
  const drum = (
    which: number,
    { kit = 0, semitones = 0, length = 1, punch = 0.35, snap = 0.3, gain = 0.7 } = {},
  ) => drumVoice(which, kit, semitones, length, punch, snap, gain, drumVoiceBlank())

  it('tune a hit by its octave and Tune, as far as three octaves', () => {
    expect(drumTuning(hzOf(0), 0)).toBeCloseTo(0, 6)
    expect(drumTuning(hzOf(0, 1), -5)).toBeCloseTo(7, 6)
    expect(drumTuning(hzOf(0, -2), -12)).toBeCloseTo(-36, 6)
    expect(drumTuning(hzOf(0, 4), 12)).toBeCloseTo(36, 6)
  })

  it('ring a third shorter an octave up and half longer an octave down', () => {
    expect(drumLength(1, 0)).toBe(1)
    expect(drumLength(1, 12)).toBeCloseTo(1 / 1.5, 6)
    expect(drumLength(1, -12)).toBeCloseTo(1.5, 6)
    expect(drumLength(4, 0)).toBe(4)
  })

  it('set the kick and the sub up as `DrumKit::strike` does', () => {
    const kick = drum(KICK)
    expect(kick.partials).toBe(1)
    expect(kick.hz[0]).toBeCloseTo(49, 4)
    expect(kick.seconds[0]).toBeCloseTo(0.45, 6)
    // (0.3 + 5 · Punch) times the hardness of the hit, 0.5 + 0.7 · gain, over 12 ms to 26 ms.
    expect(kick.fall).toBeCloseTo(2.05 * 0.99, 5)
    expect(kick.fallSeconds).toBeCloseTo(0.012 + 0.014 * 0.65, 6)
    expect(kick.attack).toBeCloseTo(0.004 - 0.0034 * 0.35, 6)
    // The click: 1.2 · Snap, gone in 6 ms, in a band at 3 kHz.
    expect(kick.noise).toBeCloseTo(0.36 * 0.99, 5)
    expect(kick.noiseSeconds).toBeCloseTo(0.006, 6)
    expect(kick.shaping).toBe('band')
    expect(kick.shapeHz).toBeCloseTo(3000, 3)
    expect(kick.cut).toBeCloseTo(4000, 3)
    expect(kick.level).toBeCloseTo(0.775 * 0.373, 5)
    expect(kick.pan).toBe(0)
    expect(drum(KICK, { snap: 0 }).noise).toBe(0)
    // Punch and a hard hit both deepen the fall; a hard hit is brighter too.
    expect(drum(KICK, { punch: 1 }).fall).toBeCloseTo(5.3 * 0.99, 4)
    expect(drum(KICK, { gain: 1 }).fall).toBeCloseTo(2.05 * 1.2, 4)
    expect(drum(KICK, { gain: 1 }).cut).toBeCloseTo(4000 * 2 ** 0.45, 2)
    // The kit: deep is lower and longer, paper has no low end.
    expect(drum(KICK, { kit: 1 }).hz[0]).toBeCloseTo(49 * 0.84, 3)
    expect(drum(KICK, { kit: 1 }).seconds[0]).toBeCloseTo(0.45 * 1.6, 5)
    expect(drum(KICK, { kit: 3 }).hz[0]).toBeCloseTo(49 * 1.9, 3)
    // No tonal drum is tuned under 24 Hz: the lowest octaves play at the floor, longer and not lower.
    expect(drum(KICK, { semitones: -24 }).hz[0]).toBe(24)
    expect(drum(KICK, { semitones: -24 }).seconds[0]).toBeCloseTo(0.45 * 2.25, 5)

    const sub = drum(SUB)
    expect(sub.hz[0]).toBeCloseTo(49, 4)
    expect(sub.seconds[0]).toBeCloseTo(0.9, 6)
    expect(sub.fall).toBeCloseTo(0.06, 6)
    expect(sub.attack).toBeCloseTo(0.014 - 0.008 * 0.7, 6)
    expect(sub.noise).toBe(0)
    expect(sub.cut).toBeCloseTo(900, 3)
  })

  it('set the snare, the brush and the rim up as `DrumKit::strike` does', () => {
    const snare = drum(SNARE)
    expect(snare.partials).toBe(2)
    expect(snare.hz[0]).toBeCloseTo(185, 3)
    expect(snare.hz[1]).toBeCloseTo(330, 3)
    expect(snare.seconds[0]).toBeCloseTo(0.11, 6)
    expect(snare.seconds[1]).toBeCloseTo(0.09, 6)
    expect(snare.noiseSeconds).toBeCloseTo(0.25, 6)
    expect(snare.shaping).toBe('high')
    expect(snare.shapeHz).toBeCloseTo(1500, 3)
    expect(snare.cut).toBeCloseTo(7000, 3)
    expect(snare.noiseClass).toBe(true)
    // Snap: the tones give way to the noise, whose start hardens.
    expect(drum(SNARE, { snap: 0 }).gain[0]).toBeCloseTo(0.6, 6)
    expect(drum(SNARE, { snap: 0 }).noise).toBeCloseTo(0.25, 6)
    expect(drum(SNARE, { snap: 0 }).noiseAttack).toBeCloseTo(0.006, 6)
    expect(drum(SNARE, { snap: 1 }).gain[0]).toBeCloseTo(0.27, 6)
    expect(drum(SNARE, { snap: 1 }).gain[1]).toBeCloseTo(0.18, 6)
    expect(drum(SNARE, { snap: 1 }).noise).toBeCloseTo(0.8, 6)
    expect(drum(SNARE, { snap: 1 }).noiseAttack).toBeCloseTo(0.0005, 6)

    const brush = drum(BRUSH)
    expect(brush.partials).toBe(0)
    expect(brush.noise).toBe(1)
    expect(brush.noiseSeconds).toBeCloseTo(0.35, 6)
    expect(brush.noiseAttack).toBeCloseTo(0.02 - 0.008 * 0.3, 6)
    expect(brush.shapeHz).toBeCloseTo(700, 3)
    expect(brush.cut).toBeCloseTo(4200, 3)

    const rim = drum(RIM)
    expect(rim.hz[0]).toBeCloseTo(480, 3)
    expect(rim.hz[1]).toBeCloseTo(1700, 3)
    expect(rim.seconds[0]).toBeCloseTo(0.06, 6)
    expect(rim.seconds[1]).toBeCloseTo(0.04, 6)
    expect(rim.fall).toBe(0)
    expect(rim.noise).toBeCloseTo((0.15 + 0.18) * 0.99, 6)
    expect(rim.noiseSeconds).toBeCloseTo(0.004, 6)
    expect(rim.pan).toBe(-0.25)
  })

  it('set the hats, the shaker and the clap up as `DrumKit::strike` does', () => {
    const closed = drum(CLOSED_HAT)
    const open = drum(OPEN_HAT)
    expect(closed.metal && open.metal).toBe(true)
    expect(closed.noiseSeconds).toBeCloseTo(0.045, 6)
    expect(open.noiseSeconds).toBeCloseTo(0.4, 6)
    expect(closed.shapeHz).toBeCloseTo(7000, 3)
    expect(closed.shape2Hz).toBeCloseTo(5500, 3)
    expect(closed.cut).toBeCloseTo(10000, 3)
    expect(closed.pan).toBe(0.35)
    expect(open.pan).toBe(0.4)
    // Their bands move half as far as the tuning, and stop at 13 kHz.
    expect(drum(CLOSED_HAT, { semitones: 12 }).shapeHz).toBeCloseTo(7000 * Math.SQRT2, 2)
    expect(drum(CLOSED_HAT, { semitones: 24 }).shapeHz).toBe(13000)
    expect(drum(CLOSED_HAT, { semitones: 24 }).shape2Hz).toBe(11000)

    const shaker = drum(SHAKER)
    expect(shaker.metal).toBe(false)
    expect(shaker.noiseSeconds).toBeCloseTo(0.09, 6)
    expect(shaker.shapeHz).toBeCloseTo(4000, 3)
    expect(shaker.cut).toBeCloseTo(9000, 3)
    expect(shaker.pan).toBe(-0.45)

    const clap = drum(CLAP)
    expect(clap.bursts).toBe(3)
    expect(clap.burstGap).toBeCloseTo(0.01, 6)
    expect(clap.noiseSeconds).toBeCloseTo(0.15, 6)
    expect(clap.shaping).toBe('band')
    expect(clap.shapeHz).toBeCloseTo(1200, 3)
    expect(clap.shapeQ).toBeCloseTo(1.4, 6)
    expect(clap.cut).toBeCloseTo(3200, 3)
    expect(clap.pan).toBe(0.1)
  })

  it('set the toms and the tick up as `DrumKit::strike` does', () => {
    const low = drum(LOW_TOM)
    const high = drum(HIGH_TOM)
    expect(low.hz[0]).toBeCloseTo(110, 3)
    expect(high.hz[0]).toBeCloseTo(165, 3)
    expect(low.hz[1]).toBeCloseTo(110 * 1.59, 3)
    expect(low.seconds[0]).toBeCloseTo(0.4, 6)
    expect(high.seconds[0]).toBeCloseTo(0.3, 6)
    expect(low.seconds[1]).toBeCloseTo(0.16, 6)
    expect(low.fall).toBeCloseTo((0.1 + 0.9 * 0.35) * 0.99, 5)
    expect(low.fallSeconds).toBeCloseTo(0.01 + 0.012 * 0.65, 6)
    // The skin: a little noise six times up, gone in an eighth of the ring.
    expect(low.noise).toBeCloseTo(0.18 * 0.71 * 0.99, 5)
    expect(low.noiseSeconds).toBeCloseTo(0.05, 6)
    expect(low.shapeHz).toBeCloseTo(660, 3)
    expect(low.pan).toBe(-0.5)
    expect(high.pan).toBe(0.3)

    const tick = drum(TICK)
    expect(tick.hz[0]).toBeCloseTo(2200, 2)
    expect(tick.hz[1]).toBeCloseTo(3410, 2)
    expect(tick.seconds[0]).toBeCloseTo(0.04, 6)
    expect(tick.seconds[1]).toBeCloseTo(0.025, 6)
    expect(tick.fall).toBeCloseTo(0.05, 6)
    expect(tick.noise).toBe(0)
    expect(tick.noiseClass).toBe(true)
    expect(tick.pan).toBe(0.5)
    // No partial goes over 0.45 of the sample rate, and a pitch held there cannot fall to it.
    const top = drum(TICK, { semitones: 36 })
    expect(top.hz[1]).toBe(21600)
    expect(top.fall).toBe(0)
  })
})

describe('how a drum sounds and dies', () => {
  const at = (which: number, length = 1, semitones = 0) =>
    drumVoice(which, 0, semitones, length, 0.35, 0.3, 0.7, drumVoiceBlank())

  it('rings as long as its slowest envelope, as `DrumKit::render` ends a slot', () => {
    expect(drumRingSeconds(at(0))).toBeCloseTo(0.45, 6)
    expect(drumRingSeconds(at(1))).toBeCloseTo(0.9, 6)
    // The snare's noise outlasts its tones; the clap's tail comes after three bursts 10 ms apart.
    expect(drumRingSeconds(at(2))).toBeCloseTo(0.25, 6)
    expect(drumRingSeconds(at(8))).toBeCloseTo(0.03 + 0.15, 6)
    expect(drumRingSeconds(at(5))).toBeCloseTo(0.045, 6)
    expect(drumRingSeconds(at(7))).toBeCloseTo(0.4, 6)
    // Length is a factor on all of them, and an octave up a third off.
    expect(drumRingSeconds(at(0, 4))).toBeCloseTo(1.8, 6)
    expect(drumRingSeconds(at(0, 1, 12))).toBeCloseTo(0.3, 6)
  })

  it('falls 60 dB over that ring', () => {
    expect(drumRemainingDb(at(0), 0)).toBeCloseTo(0, 6)
    expect(drumRemainingDb(at(0), 0.225)).toBeCloseTo(-30, 5)
    expect(drumRemainingDb(at(0), 0.45)).toBeCloseTo(-60, 5)
    // The snare is its noise once the tones are gone.
    expect(drumRemainingDb(at(2), 0.125)).toBeCloseTo(-30, 5)
    // Each burst of the clap starts its envelope again; the tail falls from the last.
    expect(drumRemainingDb(at(8), 0.025)).toBe(0)
    expect(drumRemainingDb(at(8), 0.03 + 0.075)).toBeCloseTo(-30, 5)
  })

  it('is as loud as it is struck: a quarter of full for the softest hit', () => {
    expect(drumHitLevel(0)).toBe(0.25)
    expect(drumHitLevel(0.7)).toBeCloseTo(0.775, 6)
    expect(drumHitLevel(1)).toBe(1)
  })

  it('is cut by Tone as `DrumKit::follow_tone` moves its low-pass', () => {
    expect(drumToneFactor(0.5, false)).toBe(1)
    expect(drumToneFactor(1, false)).toBeCloseTo(4, 6)
    expect(drumToneFactor(0, false)).toBeCloseTo(0.25, 6)
    // The noise drums and the tick move less.
    expect(drumToneFactor(1, true)).toBeCloseTo(2 ** 0.85, 6)
    expect(drumCutHz(at(0), 0.5)).toBeCloseTo(4000, 3)
    expect(drumCutHz(at(0), 0)).toBeCloseTo(1000, 3)
    expect(drumCutHz(at(5), 1)).toBeCloseTo(10000 * 2 ** 0.85, 2)
    // Never under 40 Hz nor over 0.45 of the sample rate.
    expect(drumCutHz(at(5, 1, 36), 1)).toBe(21600)
    expect(drumCutHz(at(1, 1, -36), 0)).toBeCloseTo(900 * 2 ** -1.5 * 0.25, 3)
  })

  it('is thickened by Drive about the level of one firm kick', () => {
    expect(drumDrive(0, 0.2)).toBe(0.2)
    // `kDriveMakeup`: a level of 0.3 comes back as it went in.
    expect(drumDrive(1, 0.3)).toBeCloseTo(0.3, 3)
    expect(drumDrive(0.5, 0.3)).toBeCloseTo(0.3, 3)
    // What is quieter comes up, by 6 · 0.3095 at the most; what is louder is held.
    expect(drumDrive(1, 0.001) / 0.001).toBeCloseTo(6 * 0.3095, 2)
    expect(drumDrive(1, 0.1)).toBeGreaterThan(0.15)
    expect(drumDrive(1, 1)).toBeCloseTo(0.3095, 3)
    expect(drumDrive(1, 0.6)).toBeLessThan(0.31)
  })

  it('sits where Width puts it, may be as much longer as Variation draws, and is choked in 8 ms', () => {
    expect(drumPlace(-0.5, 1)).toBe(-0.5)
    expect(drumPlace(0.35, 0.4)).toBeCloseTo(0.14, 6)
    expect(drumPlace(0.5, 0)).toBe(0)
    expect(drumLengthSpan(0)).toBe(1)
    expect(drumLengthSpan(1)).toBeCloseTo(2 ** 0.25, 6)
    expect(DRUM_CHOKE_SEC).toBe(0.008)
    expect(drumChoke(0)).toBe(1)
    expect(drumChoke(0.004)).toBeCloseTo(0.5, 6)
    expect(drumChoke(0.008)).toBe(0)
    expect(drumChoke(1)).toBe(0)
  })
})

describe('the drum kit’s display', () => {
  const { display } = KIT_INSTRUMENT_FACES['drum-kit']
  const params = paramsOf('drum-kit')
  const size = { width: 204, height: 100 }
  const run = (values: Record<string, number>, notes: DisplayNote[], state?: unknown) =>
    runDisplay(display, params, 0.1, {
      values,
      notes,
      ...size,
      ...(state === undefined ? {} : { state }),
    })
  /** The light on a pad: the rectangle filled in the accent over the whole of it; undefined while it is dark. */
  const flash = (drawn: RecordingContext, drum: number): Rect | undefined => {
    const pad = drumPadBox(size, drum)
    return accentRects(drawn).find(
      (rect) => rect.x === pad.x && rect.y === pad.y && rect.w === pad.w && rect.h === pad.h,
    )
  }
  const pads = (drawn: RecordingContext): number[] =>
    Array.from({ length: 12 }, (_, drum) => drum).filter((drum) => flash(drawn, drum))

  it('lights nothing at rest', () => {
    expect(lit(drawDisplay(display, params))).toBe(false)
    expect(lit(run({}, []))).toBe(false)
    expect(
      lit(runDisplay(display, params, 0.1, { notes: [note(hzOf(0), 0.05)], powered: true })),
    ).toBe(true)
  })

  it('lights the pad of the key that was struck, in whatever octave', () => {
    for (let key = 0; key < 12; key++)
      expect(pads(run({}, [note(hzOf(key), 0.002)]))).toEqual([key])
    expect(pads(run({}, [note(hzOf(2, -1), 0.02)]))).toEqual([2])
    expect(pads(run({}, [note(hzOf(9, 2), 0.02)]))).toEqual([9])
    expect(pads(run({}, [note(hzOf(0), 0.05), note(hzOf(2), 0.05), note(hzOf(9), 0.05)]))).toEqual([
      0, 2, 9,
    ])
  })

  it('lets a hit go out when the drum has died, and no sooner for letting the key go', () => {
    // A kick rings 0.45 s.
    expect(pads(run({}, [note(hzOf(0), 0.3)]))).toEqual([0])
    expect(pads(run({}, [note(hzOf(0), 0.5)]))).toEqual([])
    expect(pads(run({}, [{ ...note(hzOf(0), 0.3), released: 0.29 }]))).toEqual([0])
    // A closed hat 45 ms, an open one 0.4 s.
    expect(pads(run({}, [note(hzOf(5), 0.06)]))).toEqual([])
    expect(pads(run({}, [note(hzOf(7), 0.06)]))).toEqual([7])
    // Length, the octave of the key, Tune and the Kit all move the end.
    expect(pads(run({ length: 4 }, [note(hzOf(0), 0.5)]))).toEqual([0])
    expect(pads(run({}, [note(hzOf(0, 1), 0.33)]))).toEqual([])
    expect(pads(run({ tune: -12 }, [note(hzOf(0), 0.5)]))).toEqual([0])
    expect(pads(run({ kit: 1 }, [note(hzOf(0), 0.5)]))).toEqual([0])
    expect(pads(run({ kit: 3 }, [note(hzOf(0), 0.3)]))).toEqual([])
  })

  it('lights a hit as strongly as it was struck and as much as is left of it', () => {
    const early = flash(run({}, [note(hzOf(0), 0.045, 1)]), 0)
    const late = flash(run({}, [note(hzOf(0), 0.27, 1)]), 0)
    const soft = flash(run({}, [note(hzOf(0), 0.045, 0)]), 0)
    // A tenth into the ring it is 6 dB down, a tenth of the light; a hit at no velocity is a quarter as loud.
    expect(early?.alpha).toBeCloseTo(0.85 * 0.9, 2)
    expect(late?.alpha).toBeCloseTo(0.85 * 0.4, 2)
    expect(soft?.alpha).toBeCloseTo(0.85 * 0.9 * 0.25, 2)
  })

  it('starts a drum again when its key is struck again, in any octave', () => {
    expect(pads(run({}, [note(hzOf(0), 2)]))).toEqual([])
    expect(pads(run({}, [note(hzOf(0), 2), note(hzOf(0), 0.05)]))).toEqual([0])
    const again = flash(run({}, [note(hzOf(0), 0.3, 1), note(hzOf(0, 1), 0.03, 1)]), 0)
    // The newer hit is the one that sounds: an octave up, 0.3 s long, a tenth of it gone.
    expect(again?.alpha).toBeCloseTo(0.85 * 0.9, 2)
  })

  it('chokes the open hat with the closed hat and the shaker, in the order they came', () => {
    expect(pads(run({}, [note(hzOf(7), 0.03)]))).toEqual([7])
    expect(pads(run({}, [note(hzOf(7), 0.03), note(hzOf(5), 0.01)]))).toEqual([5])
    expect(pads(run({}, [note(hzOf(7), 0.03), note(hzOf(6), 0.01)]))).toEqual([6])
    // A closed hat struck before it does not, and neither does any other drum.
    expect(pads(run({}, [note(hzOf(5), 0.02), note(hzOf(7), 0.01)]))).toEqual([5, 7])
    expect(pads(run({}, [note(hzOf(7), 0.03), note(hzOf(0), 0.01)]))).toEqual([0, 7])
    // Half way through the 8 ms it is half gone.
    const whole = flash(run({}, [note(hzOf(7), 0.03)]), 7)
    const half = flash(run({}, [note(hzOf(7), 0.03), note(hzOf(5), 0.004)]), 7)
    expect(must(half).alpha / must(whole).alpha).toBeCloseTo(0.5, 2)
    // Struck again after the choke, it sounds.
    expect(pads(run({}, [note(hzOf(7), 0.5), note(hzOf(5), 0.3), note(hzOf(7), 0.05)]))).toEqual([
      7,
    ])
    // Once choked it is gone: a second closed hat, or a shaker after a closed hat, finds nothing
    // to choke and does not light it again for its own 8 ms (`DrumKit::begin_fade`).
    expect(pads(run({}, [note(hzOf(7), 0.1), note(hzOf(5), 0.05), note(hzOf(5), 0.002)]))).toEqual([
      5,
    ])
    expect(pads(run({}, [note(hzOf(7), 0.1), note(hzOf(5), 0.05), note(hzOf(6), 0.002)]))).toEqual([
      6,
    ])
    // The first of two chokers is the one that counts while its fade runs.
    const twice = flash(
      run({}, [note(hzOf(7), 0.03), note(hzOf(5), 0.004), note(hzOf(6), 0.001)]),
      7,
    )
    expect(must(twice).alpha / must(whole).alpha).toBeCloseTo(0.5, 2)
  })
})

describe('the drum kit’s knobs on its display', () => {
  const { display } = KIT_INSTRUMENT_FACES['drum-kit']
  const params = paramsOf('drum-kit')
  const size = { width: 204, height: 100 }
  const draw = (values: Record<string, number>, notes: DisplayNote[] = [], state?: unknown) =>
    runDisplay(display, params, 0.1, {
      values,
      notes,
      ...size,
      ...(state === undefined ? {} : { state }),
    })
  const ink = PLAIN_COLOURS.ink
  const level = (path: DrawnPath): boolean =>
    path.points.length === 2 && path.points[0][1] === path.points[1][1]
  const upright = (path: DrawnPath): boolean =>
    path.points.length === 2 && path.points[0][0] === path.points[1][0]

  it('says the kit, and the drum last struck with how long it rings as struck', () => {
    expect(draw({}).words()).toEqual(['Soft', 'Kick 450 ms'])
    expect(draw({ kit: 2, length: 2 }).words()).toEqual(['Tight', 'Kick 540 ms'])
    const state = display.init?.()
    expect(draw({}, [note(hzOf(2), 0.02)], state).words()).toEqual(['Soft', 'Snare 250 ms'])
    // It stays the drum that is shown once it has died, in the octave a kit is written in.
    expect(draw({}, [note(hzOf(2, 1), 0.02)], state).words()).toEqual(['Soft', 'Snare 170 ms'])
    expect(draw({}, [], state).words()).toEqual(['Soft', 'Snare 250 ms'])
    // The newest hit that sounds is the one that is said.
    expect(draw({}, [note(hzOf(0), 0.1), note(hzOf(9), 0.02)], state).words()[1]).toBe(
      'Low tom 400 ms',
    )
    expect(
      draw({ kit: 3, length: 0.25, tune: 12 }, [note(hzOf(10), 0.001)], state).words()[1],
    ).toBe('Tick 3 ms')
  })

  it('moves the lid of every pad with Tone, two octaves either way for a tonal drum', () => {
    const lid = (values: Record<string, number>, drum: number): number => {
      const pad = drumPadBox(size, drum)
      const line = drawnPaths(draw(values)).find(
        (path) => level(path) && path.points[0][0] === pad.x && path.points[1][0] === pad.x + pad.w,
      )
      return must(line).points[0][1]
    }
    const pad = drumPadBox(size, 0)
    // A pad's height less a pixel all round is the ten octaves from 20 Hz to 20 kHz; a line lies on whole pixels.
    const octave = (pad.h - 2) / Math.log2(1000)
    const near = (moved: number, octaves: number): void =>
      expect(Math.abs(moved - octaves * octave)).toBeLessThan(1)
    near(lid({ tone: 0.5 }, 0) - lid({ tone: 1 }, 0), 2)
    near(lid({ tone: 0 }, 0) - lid({ tone: 0.5 }, 0), 2)
    // The closed hat's upper edge moves by 0.85 of an octave.
    near(lid({ tone: 0 }, 5) - lid({ tone: 0.5 }, 5), 0.85)
    expect(lid({ tone: 0 }, 5)).toBeGreaterThan(lid({ tone: 0.5 }, 5))
  })

  it('shows what Variation may make of a hit as a wedge, and nothing of it at none', () => {
    const wedge = (variation: number): DrawnPath | undefined =>
      drawnPaths(draw({ variation })).find(
        (path) => path.kind === 'fill' && path.colour === ink && path.points.length === 3,
      )
    expect(wedge(0)).toBeUndefined()
    const most = must(wedge(1))
    const some = must(wedge(0.5))
    const wide = (path: DrawnPath): number => path.points[1][0] - path.points[2][0]
    // From 2^-0.25 to 2^0.25 of the ring, on a scale of one and a quarter rings.
    const lane = wide(most) / ((2 ** 0.25 - 2 ** -0.25) / 1.25)
    expect(lane).toBeGreaterThan(60)
    expect(wide(some)).toBeCloseTo((lane * (2 ** 0.125 - 2 ** -0.125)) / 1.25, 4)
  })

  it('spreads the drums about the middle with Width, and leaves the kick there', () => {
    const tick = (width: number, drum: number): number =>
      must(
        accentPaths(draw({ width }, [note(hzOf(drum), 0.002)])).find(
          (path) => upright(path) && path.width === 2,
        ),
      ).points[0][0]
    const middle = tick(1, 0)
    expect(tick(0, 9)).toBeCloseTo(middle, 6)
    expect(tick(0.4, 0)).toBeCloseTo(middle, 6)
    // The line between the speakers: the level one that the kick stands in the middle of.
    const line = must(
      drawnPaths(draw({})).find(
        (path) => level(path) && (path.points[0][0] + path.points[1][0]) / 2 === middle,
      ),
    )
    const speaker = line.points[1][0] - middle
    expect(speaker).toBeGreaterThan(40)
    // `DrumKit::process`: left is 1 - place and right 1 + place, so a place of 1 is a speaker.
    // The tick's is 0.5 at full Width: half way out and no further.
    expect(tick(1, 10) - middle).toBeCloseTo(0.5 * speaker, 6)
    // The low tom is as far left as the tick is right; the open hat four fifths as far.
    expect(middle - tick(1, 9)).toBeCloseTo(0.5 * speaker, 6)
    expect(tick(1, 7) - middle).toBeCloseTo(0.4 * speaker, 6)
    expect(tick(0.5, 10) - middle).toBeCloseTo(0.25 * speaker, 6)
    expect(tick(0.4, 10) - middle).toBeCloseTo(0.2 * speaker, 6)
  })

  it('bends the line of Drive about the level it leaves alone', () => {
    const bend = (drive: number): [number, number][] =>
      must(
        drawnPaths(draw({ drive })).find(
          (path) => path.kind === 'stroke' && path.points.length > 3,
        ),
      ).points
    const straight = bend(0)
    const full = bend(1)
    const last = straight.length - 1
    const high = straight[0][1] - straight[last][1]
    // Left alone it runs corner to corner; full on it is level over the firm kick's level, which is the middle.
    expect(straight[last][0] - straight[0][0]).toBeCloseTo(high, 6)
    expect(full[0][1]).toBeCloseTo(straight[0][1], 6)
    expect(straight[0][1] - full[last][1]).toBeCloseTo((0.3095 / 0.6) * high, 1)
    const middle = Math.round(last / 2)
    expect(full[middle][1]).toBeLessThan(straight[middle][1] + 0.5)
    expect(full[2][1]).toBeLessThan(straight[2][1])
  })
})

describe('the glitch kit’s figures', () => {
  const CLICK = 0
  const DOUBLE = 1
  const POP = 2
  const CRACKLE = 3
  const PIP = 4
  const CUT = 5
  const STATIC = 6
  const BUZZ = 7
  const ZAP = 8
  const CHIRP = 9
  const STUTTER = 10
  const BIT = 11
  /** How long a voice sounds at the defaults of `device.json` unless told: Length 1, untuned, Density 0.4, Edge 0.35, struck at 0.7. */
  const seconds = (voice: number, { duration = 1, density = 0.4, edge = 0.35, ratio = 1 } = {}) =>
    glitchSeconds(voice, duration, density, edge, ratio, 0.7)

  it('tune a hit by its octave and Tune, and shorten it a quarter an octave up', () => {
    expect(glitchTuning(hzOf(4), 0)).toBeCloseTo(0, 6)
    expect(glitchTuning(hzOf(4, 1), 7)).toBeCloseTo(19, 6)
    expect(glitchTuning(hzOf(4, -3), -12)).toBeCloseTo(-36, 6)
    expect(glitchDuration(1, 0)).toBe(1)
    expect(glitchDuration(1, 12)).toBeCloseTo(0.75, 6)
    expect(glitchDuration(2, -12)).toBeCloseTo(2 / 0.75, 6)
    // Never under a tenth of the voice's length nor over twelve times it.
    expect(glitchDuration(0.05, 36)).toBe(0.1)
    expect(glitchDuration(40, -36)).toBe(12)
    // What Scatter drew is inside that range too: the device holds the product.
    expect(glitchDuration(1, 0, Math.SQRT2)).toBeCloseTo(Math.SQRT2, 6)
    expect(glitchDuration(0.25, 24, 1 / Math.SQRT2)).toBe(0.1)
  })

  it('are stretched by Scatter in what Length sets and in nothing else', () => {
    const lasts = (voice: number, stretch: number, length = 1): number =>
      glitchLasts(voice, length, 0, stretch, 0.4, 0.35, 0.7)
    // `strike.duration` is times the voice's own length: a pip is all duration.
    expect(lasts(PIP, 1)).toBeCloseTo(0.04, 6)
    expect(lasts(PIP, Math.SQRT2)).toBeCloseTo(0.04 * Math.SQRT2, 6)
    expect(lasts(STATIC, 1 / Math.SQRT2)).toBeCloseTo(0.2 / Math.SQRT2, 6)
    // The stutter's repeats lie where Density puts them (`hit.period`): only the last grain is stretched.
    expect(lasts(STUTTER, Math.SQRT2)).toBeCloseTo(6 * 0.0288 + 0.006 * Math.SQRT2, 6)
    expect(lasts(STUTTER, 1 / Math.SQRT2)).toBeCloseTo(6 * 0.0288 + 0.006 / Math.SQRT2, 6)
    // The double's second click comes when it comes; its ring is what Length sets.
    expect(lasts(DOUBLE, Math.SQRT2)).toBeCloseTo(0.0228 + 0.00015 + 0.0045 * Math.SQRT2, 6)
    // The crackle's burst is stretched, and its last ring with it.
    expect(lasts(CRACKLE, Math.SQRT2)).toBeCloseTo(
      0.25 * Math.SQRT2 + 0.00015 + 0.0045 * Math.SQRT2,
      6,
    )
    // Tuned up an octave everything Length sets is a quarter shorter first.
    expect(glitchLasts(PIP, 1, 12, 1, 0.4, 0.35, 0.7)).toBeCloseTo(0.03, 6)
  })

  it('last as long as `GlitchKit::start` counts them', () => {
    // A click: its 0.15 ms pulse and one and a half of the 3 ms its band rings.
    expect(seconds(CLICK)).toBeCloseTo(0.00015 + 0.0045, 6)
    expect(seconds(CLICK, { duration: 2 })).toBeCloseTo(0.00015 + 0.009, 6)
    expect(seconds(POP)).toBeCloseTo(0.02, 6)
    expect(seconds(PIP)).toBeCloseTo(0.04, 6)
    expect(seconds(CUT)).toBeCloseTo(0.05, 6)
    expect(seconds(STATIC)).toBeCloseTo(0.2, 6)
    expect(seconds(ZAP)).toBeCloseTo(0.04, 6)
    expect(seconds(CHIRP)).toBeCloseTo(0.03, 6)
    expect(seconds(BIT)).toBeCloseTo(0.08, 6)
    expect(seconds(PIP, { duration: 4 })).toBeCloseTo(0.16, 6)
    // The crackle is a quarter of a second of pulses and the last one's ring.
    expect(seconds(CRACKLE)).toBeCloseTo(0.25 + 0.00465, 6)
    // The double and the stutter are their repeats, which Length does not move apart.
    expect(seconds(DOUBLE)).toBeCloseTo(0.0228 + 0.00465, 6)
    expect(seconds(DOUBLE, { density: 1 })).toBeCloseTo(2 * 0.012 + 0.00465, 6)
    expect(seconds(STUTTER)).toBeCloseTo(6 * 0.0288 + 0.006, 6)
    expect(seconds(STUTTER, { density: 1 })).toBeCloseTo(11 * 0.012 + 0.006, 6)
    // A grain is never longer than 0.9 of the spacing.
    expect(seconds(STUTTER, { duration: 4 })).toBeCloseTo(6 * 0.0288 + 0.024, 6)
    expect(seconds(STUTTER, { duration: 4, density: 1 })).toBeCloseTo(11 * 0.012 + 0.0108, 6)
  })

  it('repeat as often as Density says', () => {
    expect(glitchEvents(CLICK, 1)).toBe(1)
    expect(glitchEvents(DOUBLE, 0.4)).toBe(2)
    expect(glitchEvents(DOUBLE, 0.5)).toBe(3)
    expect(glitchEvents(STUTTER, 0)).toBe(4)
    expect(glitchEvents(STUTTER, 0.4)).toBe(7)
    expect(glitchEvents(STUTTER, 1)).toBe(12)
    // The crackle: about 4 to 55 pulses in all.
    expect(glitchEvents(CRACKLE, 0)).toBeCloseTo(1 + 10 / 3, 6)
    expect(glitchEvents(CRACKLE, 1)).toBeCloseTo(1 + 160 / 3, 6)
    expect(glitchPeriod(DOUBLE, 0)).toBeCloseTo(0.03, 6)
    expect(glitchPeriod(DOUBLE, 1)).toBeCloseTo(0.012, 6)
    expect(glitchPeriod(STUTTER, 0)).toBeCloseTo(0.04, 6)
    expect(glitchPeriod(STUTTER, 1)).toBeCloseTo(0.012, 6)
  })

  it('play as many pulses of the buzz as crest inside its length', () => {
    // The crest of one pulse's ring: the 0.25 ms pulse and a part of a cycle of the 1.4 kHz band.
    const crest = glitchBuzzCrest(1)
    expect(crest).toBeGreaterThan(4)
    expect(crest).toBeLessThan(24)
    expect(glitchBuzzPulses(1, 1)).toBe(9)
    expect(glitchBuzzPulses(4, 1)).toBe(36)
    expect(glitchBuzzPulses(0.1, 1)).toBe(1)
    // The last pulse rings out 60 dB, 2 · Q · ln(1000) / (2π · band) seconds; Edge full up stops it on its crest.
    const out = (6.907755 * 3) / (2 * Math.PI * 1400)
    expect(seconds(BUZZ, { edge: 0 })).toBeCloseTo(8 / 97.999 + crest / 48000 + out, 6)
    expect(seconds(BUZZ, { edge: 1 })).toBeCloseTo(8 / 97.999, 6)
    // One pulse alone is left to ring out whatever Edge is.
    expect(seconds(BUZZ, { duration: 0.1, edge: 1 })).toBeCloseTo(out, 6)
  })

  it('lie in pitch where the header builds them, moved by the tuning', () => {
    expect(glitchFromHz(POP, 1)).toBeCloseTo(97.999, 3)
    expect(glitchFromHz(PIP, 1)).toBeCloseTo(1318.51, 2)
    expect(glitchFromHz(PIP, 2)).toBeCloseTo(2637.02, 2)
    expect(glitchFromHz(CLICK, 1)).toBeCloseTo(2600, 2)
    expect(glitchFromHz(CRACKLE, 1)).toBeCloseTo(2600, 2)
    expect(glitchFromHz(BUZZ, 1)).toBeCloseTo(1400, 2)
    expect(glitchFromHz(STUTTER, 1)).toBeCloseTo(2093, 2)
    expect(glitchFromHz(BIT, 1)).toBeCloseTo(7902.13, 2)
    expect(glitchFromHz(STATIC, 1)).toBeCloseTo(3000, 2)
    expect(glitchFromHz(CUT, 1)).toBeCloseTo(7000, 2)
    // The zap falls from 6 kHz to 300 Hz, the chirp rises two octaves from 880 Hz.
    expect([glitchFromHz(ZAP, 1), glitchToHz(ZAP, 1)]).toEqual([6000, 300])
    expect([glitchFromHz(CHIRP, 1), glitchToHz(CHIRP, 1)]).toEqual([880, 3520])
    expect(glitchToHz(PIP, 1)).toBe(glitchFromHz(PIP, 1))
    // No sine is asked to go over 18 kHz, nor the clocks over 16 kHz.
    expect(glitchFromHz(ZAP, 4)).toBe(18000)
    expect(glitchFromHz(BIT, 4)).toBe(16000)
    // The click's band: a harder hit rings it a little higher, and it stays between 200 Hz and 12 kHz.
    expect(glitchBandHz(1, 1)).toBeCloseTo(2600 * 2 ** 0.15, 2)
    expect(glitchBandHz(8, 0.7)).toBe(12000)
    expect(glitchBandHz(1 / 16, 0.7)).toBe(200)
  })

  it('are shaped by Edge, Tone and Crush as the header has them', () => {
    expect(glitchRound(0)).toBeCloseTo(0.003, 6)
    expect(glitchRound(0.5)).toBeCloseTo(0.00075, 6)
    expect(glitchRound(1)).toBe(0)
    expect(glitchToneHz(0)).toBeCloseTo(1500, 6)
    expect(glitchToneHz(0.5)).toBeCloseTo(1500 * Math.sqrt(12), 4)
    expect(glitchToneHz(1)).toBeCloseTo(18000, 6)
    expect(glitchCrushClock(0)).toBe(48000)
    expect(glitchCrushClock(1)).toBeCloseTo(6000, 6)
    expect(glitchCrushStep(0)).toBeCloseTo(2 ** -16, 12)
    expect(glitchCrushStep(1)).toBeCloseTo(1 / 64, 9)
    expect(glitchHitLevel(0)).toBe(0.25)
    expect(glitchHitLevel(1)).toBe(1)
  })

  it('may be moved by Scatter as far as `GlitchKit::note_on` draws', () => {
    expect(glitchLengthSpan(0)).toBe(1)
    expect(glitchLengthSpan(1)).toBeCloseTo(Math.SQRT2, 6)
    expect(glitchPitchSpan(1)).toBe(3)
    expect(glitchPitchSpan(0.5)).toBeCloseTo(0.75, 6)
    // `kPlace`, times Spread; Scatter draws a hit towards a place of its own, up to 0.9 either way.
    expect(glitchPlace(CLICK, 1, 0)).toBe(-0.25)
    expect(glitchPlace(STATIC, 0.5, 0)).toBe(0.25)
    expect(glitchPlace(STATIC, 1, 0.25)).toBeCloseTo(0.25, 6)
    expect(glitchPlace(STATIC, 1, 1)).toBe(0)
    expect(glitchThrow(STATIC, 1, 0)).toBe(0)
    expect(glitchThrow(STATIC, 1, 0.25)).toBeCloseTo(0.45, 6)
    expect(glitchThrow(STATIC, 0.5, 1)).toBeCloseTo(0.45, 6)
    // The low pop stays in the centre at any setting.
    expect(glitchPlace(POP, 1, 0)).toBe(0)
    expect(glitchThrow(POP, 1, 1)).toBe(0)
  })
})

interface Glyph {
  colour: string
  alpha: number
  rects: Rect[]
}

/** Every shape that was built of rectangles and filled as one: a fault in its lane. */
function glyphsOf(drawn: RecordingContext): Glyph[] {
  const out: Glyph[] = []
  let rects: Rect[] = []
  let fill = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') rects = []
    else if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'rect') {
      const [x, y, w, h] = call.args as number[]
      rects.push({ x, y, w, h, alpha })
    } else if (call.name === 'fill' && rects.length > 0) out.push({ colour: fill, alpha, rects })
  }
  return out
}
/** The rectangles filled in the ink at one strength. */
function inkRects(drawn: RecordingContext, strength: number): Rect[] {
  const out: Rect[] = []
  let fill = ''
  let alpha = 1
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = Number(call.args[0])
    else if (call.name === 'fillRect' && fill === PLAIN_COLOURS.ink && alpha === strength) {
      const [x, y, w, h] = call.args as number[]
      out.push({ x, y, w, h, alpha })
    }
  }
  return out
}

describe('the glitch kit’s display', () => {
  const { display } = KIT_INSTRUMENT_FACES['glitch-kit']
  const params = paramsOf('glitch-kit')
  const size = { width: 204, height: 100 }
  const PIP = 4
  const BUZZ = 7
  const STUTTER = 10
  // Scatter is at none unless a test is about it, so that a hit ends at one moment.
  const run = (values: Record<string, number>, notes: DisplayNote[], state?: unknown) =>
    runDisplay(display, params, 0.1, {
      values: { scatter: 0, ...values },
      notes,
      ...size,
      ...(state === undefined ? {} : { state }),
    })
  /** The twelve faults as drawn, in key order. */
  const faults = (drawn: RecordingContext): Glyph[] => {
    const all = glyphsOf(drawn)
    expect(all).toHaveLength(12)
    return all
  }
  /** How strongly each lane is lit: 0 while it is dark. */
  const lanes = (drawn: RecordingContext): number[] =>
    faults(drawn).map((glyph) => (glyph.colour === accent ? glyph.alpha : 0))
  const sounding = (drawn: RecordingContext): number[] =>
    lanes(drawn).flatMap((strength, voice) => (strength > 0 ? [voice] : []))
  const tall = (glyph: Glyph): number => Math.max(...glyph.rects.map((rect) => rect.h))

  it('lights nothing at rest, and draws every fault in its own lane', () => {
    expect(lit(drawDisplay(display, params))).toBe(false)
    const rest = run({}, [])
    expect(lit(rest)).toBe(false)
    faults(rest).forEach((glyph, voice) => {
      const track = glitchTrackBox(size, voice)
      for (const rect of glyph.rects) {
        expect(rect.x).toBeGreaterThanOrEqual(track.x)
        expect(rect.x + rect.w).toBeLessThanOrEqual(track.x + track.w)
        expect(rect.y).toBeGreaterThanOrEqual(track.y)
        expect(rect.y + rect.h).toBeLessThanOrEqual(track.y + track.h)
      }
      // At rest a fault is its lane high, less half a pixel above and below.
      if (voice === PIP) expect(tall(glyph)).toBeCloseTo(track.h - 1, 6)
    })
    expect(
      lit(runDisplay(display, params, 0.1, { notes: [note(hzOf(0), 0.001)], powered: true })),
    ).toBe(true)
  })

  it('lights the lane of the key that was struck, in whatever octave', () => {
    for (let key = 0; key < 12; key++)
      expect(sounding(run({}, [note(hzOf(key), 0.001)]))).toEqual([key])
    expect(sounding(run({}, [note(hzOf(4, -1), 0.02)]))).toEqual([4])
    expect(sounding(run({}, [note(hzOf(11, 2), 0.02)]))).toEqual([11])
    expect(
      sounding(run({}, [note(hzOf(3), 0.02), note(hzOf(6), 0.02), note(hzOf(7), 0.02)])),
    ).toEqual([3, 6, 7])
  })

  it('lets a hit go out when the fault is over, and no sooner for letting the key go', () => {
    // A pip is 40 ms.
    expect(sounding(run({}, [note(hzOf(PIP), 0.03)]))).toEqual([PIP])
    expect(sounding(run({}, [note(hzOf(PIP), 0.05)]))).toEqual([])
    expect(sounding(run({}, [{ ...note(hzOf(PIP), 0.03), released: 0.02 }]))).toEqual([PIP])
    // Length, the octave of the key and Tune all move the end.
    expect(sounding(run({ length: 4 }, [note(hzOf(PIP), 0.1)]))).toEqual([PIP])
    expect(sounding(run({}, [note(hzOf(PIP, 1), 0.035)]))).toEqual([])
    expect(sounding(run({ tune: -12 }, [note(hzOf(PIP), 0.05)]))).toEqual([PIP])
    // More Density packs the stutter's grains closer, so that it is over sooner.
    expect(sounding(run({ density: 0.4 }, [note(hzOf(STUTTER), 0.15)]))).toEqual([STUTTER])
    expect(sounding(run({ density: 1 }, [note(hzOf(STUTTER), 0.15)]))).toEqual([])
    // Edge full up stops the buzz on its last crest; rounded, that pulse rings out.
    expect(sounding(run({ edge: 0 }, [note(hzOf(BUZZ), 0.084)]))).toEqual([BUZZ])
    expect(sounding(run({ edge: 1 }, [note(hzOf(BUZZ), 0.084)]))).toEqual([])
  })

  it('lights a hit at half strength where Scatter may or may not have ended it', () => {
    // A pip of 40 ms may be anything from 28 ms to 57 ms at full Scatter.
    expect(lanes(run({ scatter: 1 }, [note(hzOf(PIP), 0.02)]))[PIP]).toBe(1)
    expect(lanes(run({ scatter: 1 }, [note(hzOf(PIP), 0.04)]))[PIP]).toBe(0.5)
    expect(lanes(run({ scatter: 1 }, [note(hzOf(PIP), 0.055)]))[PIP]).toBe(0.5)
    expect(lanes(run({ scatter: 1 }, [note(hzOf(PIP), 0.06)]))[PIP]).toBe(0)
    expect(lanes(run({}, [note(hzOf(PIP), 0.039)]))[PIP]).toBe(1)
    expect(lanes(run({}, [note(hzOf(PIP), 0.041)]))[PIP]).toBe(0)
    // The stutter's seven repeats end 173 ms on whatever Scatter drew; only its last grain of
    // 6 ms is stretched. So it sounds for certain at 150 ms and is over for certain at 190 ms.
    expect(lanes(run({ scatter: 1 }, [note(hzOf(STUTTER), 0.15)]))[STUTTER]).toBe(1)
    expect(lanes(run({ scatter: 1 }, [note(hzOf(STUTTER), 0.176)]))[STUTTER]).toBe(1)
    expect(lanes(run({ scatter: 1 }, [note(hzOf(STUTTER), 0.179)]))[STUTTER]).toBe(0.5)
    expect(lanes(run({ scatter: 1 }, [note(hzOf(STUTTER), 0.19)]))[STUTTER]).toBe(0)
  })

  it('starts a fault again when its key is struck again, and lets no fault stop another', () => {
    expect(sounding(run({}, [note(hzOf(PIP), 2)]))).toEqual([])
    expect(sounding(run({}, [note(hzOf(PIP), 2), note(hzOf(PIP), 0.01)]))).toEqual([PIP])
    // The newer hit is the one that sounds: an octave up it is 30 ms, and over.
    expect(sounding(run({}, [note(hzOf(PIP), 0.035), note(hzOf(PIP, 1), 0.032)]))).toEqual([])
    const all = Array.from({ length: 12 }, (_, key) => note(hzOf(key), 0.001))
    expect(sounding(run({}, all))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  it('draws a hit as tall as it was struck: a quarter of the lane for the softest', () => {
    const track = glitchTrackBox(size, PIP)
    const hard = faults(run({}, [note(hzOf(PIP), 0.01, 1)]))[PIP]
    const soft = faults(run({}, [note(hzOf(PIP), 0.01, 0)]))[PIP]
    expect(tall(hard)).toBeCloseTo(track.h - 1, 6)
    expect(tall(soft)).toBeCloseTo(0.25 * (track.h - 1), 6)
  })
})

describe('the glitch kit’s knobs on its display', () => {
  const { display } = KIT_INSTRUMENT_FACES['glitch-kit']
  const params = paramsOf('glitch-kit')
  const size = { width: 204, height: 100 }
  const ink = PLAIN_COLOURS.ink
  const CLICK = 0
  const DOUBLE = 1
  const POP = 2
  const PIP = 4
  const STATIC = 6
  const STUTTER = 10
  const draw = (values: Record<string, number>, notes: DisplayNote[] = [], state?: unknown) =>
    runDisplay(display, params, 0.1, {
      values: { scatter: 0, ...values },
      notes,
      ...size,
      ...(state === undefined ? {} : { state }),
    })
  /** A lane's scale: half a second across, the 0.4th power of the time. */
  const across = (seconds: number, wide: number): number => wide * (seconds / 0.5) ** 0.4
  /** The two lines that are drawn point by point: the pip as Crush holds it, then Tone's curve. */
  const traces = (drawn: RecordingContext): DrawnPath[] =>
    drawnPaths(drawn).filter(
      (path) => path.kind === 'stroke' && path.colour === ink && path.points.length > 3,
    )
  /** The marks of the twelve faults on the line between the speakers, in key order. */
  const places = (drawn: RecordingContext): number[] =>
    drawnPaths(drawn)
      .filter(
        (path) =>
          path.colour === ink &&
          path.alpha === 0.5 &&
          path.points.length === 2 &&
          path.points[0][0] === path.points[1][0] &&
          path.points[1][1] - path.points[0][1] === 7,
      )
      .map((path) => path.points[0][0])

  it('says the fault last struck and how long it lasts as struck', () => {
    expect(draw({}).words().slice(-2)).toEqual(['Click', '5 ms'])
    expect(draw({ length: 4 }).words().slice(-2)).toEqual(['Click', '18 ms'])
    const state = display.init?.()
    expect(
      draw({}, [note(hzOf(PIP), 0.01)], state)
        .words()
        .slice(-2),
    ).toEqual(['Pip', '40 ms'])
    expect(
      draw({}, [note(hzOf(PIP, 1), 0.01)], state)
        .words()
        .slice(-2),
    ).toEqual(['Pip', '30 ms'])
    // It stays the fault that is shown once it is over, in the octave a kit is written in.
    expect(draw({}, [], state).words().slice(-2)).toEqual(['Pip', '40 ms'])
    // The newest hit that sounds is the one that is said.
    expect(
      draw({}, [note(hzOf(PIP), 0.02), note(hzOf(STATIC), 0.01)], state)
        .words()
        .slice(-2),
    ).toEqual(['Static', '200 ms'])
    // Each lane has its name beside it where there is room; a flat plate has none.
    expect(draw({}).words().slice(0, 4)).toEqual(['Click', 'Double', 'Pop', 'Crackle'])
    const flat = runDisplay(display, params, 0.1, { width: 128, height: 100 })
    expect(flat.words()).toHaveLength(2)
  })

  it('shades where Scatter may end a fault, and nothing at none', () => {
    const track = glitchTrackBox(size, PIP)
    const shade = (scatter: number): Rect | undefined =>
      inkRects(draw({ scatter }), 0.18).find(
        (rect) => rect.y === track.y && rect.h === track.h && rect.x > track.x,
      )
    expect(shade(0)).toBeUndefined()
    // The pip's 40 ms, a half of an octave of time either way at full Scatter.
    const most = must(shade(1))
    expect(most.x - track.x).toBeCloseTo(across(0.04 / Math.SQRT2, track.w), 4)
    expect(most.w).toBeCloseTo(
      across(0.04 * Math.SQRT2, track.w) - across(0.04 / Math.SQRT2, track.w),
      4,
    )
    expect(must(shade(0.5)).w).toBeLessThan(most.w)
    // The stutter's shade is its last grain's and no wider: Scatter does not move its repeats.
    const lane = glitchTrackBox(size, STUTTER)
    const end = must(
      inkRects(draw({ scatter: 1 }), 0.18).find(
        (rect) => rect.y === lane.y && rect.h === lane.h && rect.x > lane.x,
      ),
    )
    const last = 6 * 0.0288
    expect(end.x - lane.x).toBeCloseTo(across(last + 0.006 / Math.SQRT2, lane.w), 4)
    expect(end.w).toBeCloseTo(
      across(last + 0.006 * Math.SQRT2, lane.w) - across(last + 0.006 / Math.SQRT2, lane.w),
      4,
    )
    expect(end.w).toBeLessThan(1)
  })

  it('sets the faults out with Spread, and gathers them into Scatter’s throw', () => {
    const band = (values: Record<string, number>): number =>
      inkRects(draw(values), 0.18).find((rect) => rect.h === 5)?.w ?? 0
    // Scatter's throw is 0.9 of the way to a speaker at the most, either side of the middle.
    const reach = band({ spread: 1, scatter: 1 }) / (2 * 0.9)
    expect(reach).toBeGreaterThan(20)
    expect(band({ spread: 1, scatter: 0 })).toBe(0)
    expect(band({ spread: 1, scatter: 0.25 })).toBeCloseTo(0.9 * reach, 6)
    expect(band({ spread: 0.5, scatter: 1 })).toBeCloseTo(0.9 * reach, 6)
    const wide = places(draw({ spread: 1 }))
    expect(wide).toHaveLength(12)
    const middle = wide[POP]
    // A line lies on whole pixels, so a place is true to a pixel.
    const near = (got: number, wanted: number): void =>
      expect(Math.abs(got - wanted)).toBeLessThan(1)
    near(wide[STATIC] - middle, 0.5 * reach)
    near(wide[CLICK] - middle, -0.25 * reach)
    near(places(draw({ spread: 0.5 }))[STATIC] - middle, 0.25 * reach)
    for (const at of places(draw({ spread: 0 }))) expect(at).toBe(middle)
    // At full Scatter no fault has a place of its own: each may fall anywhere in the throw.
    for (const at of places(draw({ spread: 1, scatter: 1 }))) expect(at).toBe(middle)
    // A hit is lit over its own throw, and the pop only where it stands.
    const hit = (voice: number, scatter: number): Rect =>
      must(
        accentRects(draw({ spread: 1, scatter }, [note(hzOf(voice), 0.001)])).find(
          (rect) => rect.h === 7,
        ),
      )
    expect(hit(STATIC, 1).w).toBeCloseTo(band({ spread: 1, scatter: 1 }), 6)
    expect(hit(STATIC, 0).w).toBe(2)
    expect(hit(POP, 1).w).toBe(2)
  })

  it('holds the pip in steps with Crush', () => {
    const levels = (crush: number): number =>
      new Set(traces(draw({ crush }))[0].points.map(([, y]) => y.toFixed(3))).size
    // Two cycles of the pip are nine ticks of the 6 kHz clock that full Crush leaves.
    expect(levels(0)).toBeGreaterThan(40)
    expect(levels(1)).toBeLessThanOrEqual(10)
    expect(levels(1)).toBeGreaterThan(3)
    expect(levels(0.5)).toBeGreaterThan(levels(1))
  })

  it('draws the curve of Tone over the pitch of every fault, and lights the pitch of a hit', () => {
    const box = glitchPitchBox(size)
    const octave = (box.w * Math.log(2)) / Math.log(400)
    /** Where the curve is 3 dB down: the scale is 50 Hz to 20 kHz across and 24 dB down. */
    const knee = (tone: number): number => {
      const points = traces(draw({ tone }))[1].points
      const top = box.y + 1
      return must(points.find(([, y]) => y - top >= ((box.h - 2) * 3.0103) / 24))[0] - box.x
    }
    const at = (hz: number): number => (box.w * Math.log(hz / 50)) / Math.log(400)
    expect(Math.abs(knee(0) - at(1500))).toBeLessThanOrEqual(1)
    expect(Math.abs(knee(0.5) - at(1500 * Math.sqrt(12)))).toBeLessThanOrEqual(1)
    expect(Math.abs(knee(1) - at(18000))).toBeLessThanOrEqual(1)
    // The pitch of a hit, in the accent: a pip an octave up is an octave along.
    const bar = (values: Record<string, number>, octaves: number): Rect =>
      must(
        accentRects(draw(values, [note(hzOf(PIP, octaves), 0.001)])).find(
          (rect) => rect.y >= box.y && rect.y + rect.h === box.y + box.h && rect.x < box.x + box.w,
        ),
      )
    expect(bar({}, 0).w).toBe(2)
    expect(bar({}, 0).x).toBe(Math.round(box.x + at(1318.51)))
    expect(bar({}, 1).x - bar({}, 0).x).toBeGreaterThan(octave - 1)
    expect(bar({ tune: 12 }, 0).x).toBe(bar({}, 1).x)
    // At full Scatter it may be three semitones either side: half an octave wide.
    expect(Math.abs(bar({ scatter: 1 }, 0).w - octave / 2)).toBeLessThan(1)
    // Tone lets less of it through: the bar stands lower under a darker curve.
    expect(bar({ tone: 0 }, 1).h).toBeLessThan(bar({ tone: 1 }, 1).h)
  })

  it('repeats the double and the stutter as often as Density says', () => {
    const strokes = (density: number): number => {
      const { rects } = glyphsOf(draw({ density }))[DOUBLE]
      // A click is a stroke that rings off: the next begins where the picture steps up or on.
      return rects.filter(
        (rect, at) => at === 0 || rect.h > rects[at - 1].h || rect.x > rects[at - 1].x + 1,
      ).length
    }
    expect(strokes(0.4)).toBe(2)
    expect(strokes(0.5)).toBe(3)
    const grains = (density: number): number => {
      const { rects } = glyphsOf(draw({ density }))[STUTTER]
      return rects.filter((rect, at) => at === 0 || rect.x > rects[at - 1].x + 1).length
    }
    expect(grains(0)).toBe(4)
    expect(grains(0.4)).toBe(7)
  })
})
