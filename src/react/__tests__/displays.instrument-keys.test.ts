// The truth of the keys' displays: every figure is the device's own, nothing
// is lit while nothing sounds, a note is lit for as long as the device lets it
// ring, and what a knob or a pedal does to a sounding note shows on it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  KEYS_INSTRUMENT_FACES,
  adsrLevel,
  feltContactMs,
  feltDamperSeconds,
  feltDetuneCents,
  feltInharmonicity,
  feltKey,
  feltPedalGrip,
  feltRingSeconds,
  feltRoomSeconds,
  feltStrikeDb,
  feltStrikePosition,
  feltStringCount,
  feltSympatheticSeconds,
  feltUnisonDb,
  glassBeatHz,
  glassIndex,
  glassIndexScale,
  glassRingSeconds,
  glassTimeScale,
  tineBellLevel,
  tineBellSeconds,
  tineBody,
  tineLoudness,
  tineNoteDb,
  tineRest,
  tineSustainSeconds,
  tineSwing,
  tineTremoloGain,
  tineWave,
} from '../components/displays/instrument-keys'
import { secondsText } from '../components/displays/tails'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  type DrawnPath,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent } = PLAIN_COLOURS
const C4 = 261.63

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id: Math.round(frequency), frequency, gain, age, released })

/** How many marks were laid in the accent: everything that is lit. */
function lit(drawn: RecordingContext): number {
  let fill = ''
  let stroke = ''
  let marks = 0
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'set strokeStyle') stroke = String(call.args[0])
    else if (['fill', 'fillRect', 'fillText'].includes(call.name) && fill === accent) marks++
    else if (['stroke', 'strokeRect'].includes(call.name) && stroke === accent) marks++
  }
  return marks
}
/** The lines laid in the accent. */
const lights = (paths: DrawnPath[]): DrawnPath[] =>
  paths.filter((path) => path.kind === 'stroke' && path.colour === accent && path.points.length > 1)
/** How far up a light reaches: the span of its points from foot to top, in px. */
const reach = (path: DrawnPath): number => {
  const ys = path.points.map(([, y]) => y)
  return Math.max(...ys) - Math.min(...ys)
}
/** The rectangles filled in the accent, as [x, y, w, h]. */
function litBoxes(drawn: RecordingContext): number[][] {
  let fill = ''
  const boxes: number[][] = []
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'fillRect' && fill === accent) boxes.push(call.args as number[])
  }
  return boxes
}

describe('the felt piano’s figures', () => {
  it('put a pitch on a key from A0 to C8 as `FeltPianoDevice::midi_note_for` does', () => {
    expect(feltKey(27.5)).toBe(21)
    expect(feltKey(C4)).toBe(60)
    expect(feltKey(4186)).toBe(108)
    expect(feltKey(10)).toBe(21)
    expect(feltKey(20000)).toBe(108)
  })

  it('string and strike a key as `ModeTable.h` does', () => {
    // `stringCountForNote`: one string to D1, two to G#1, three above.
    expect([21, 26, 27, 32, 33, 60].map(feltStringCount)).toEqual([1, 1, 2, 2, 3, 3])
    // `strikePositionForNote`: an eighth of the string at the bottom, 0.067 of it at the top.
    expect(feltStrikePosition(21)).toBeCloseTo(0.125, 6)
    expect(feltStrikePosition(108)).toBeCloseTo(0.067, 6)
    // `detuneCents`: 1.2 cents at the bottom and 0.5 at the top, times twice Detune.
    expect(feltDetuneCents(21, 1)).toBeCloseTo(2.4, 6)
    expect(feltDetuneCents(108, 1)).toBeCloseTo(1, 6)
    expect(feltDetuneCents(21, 0)).toBe(0)
    // `inharmonicityForNote`: 3.1e-4 at middle C, growing above it, times Stiffness.
    expect(feltInharmonicity(60, 1)).toBeCloseTo(3.1e-4, 9)
    expect(feltInharmonicity(72, 2)).toBeCloseTo(2 * 3.1e-4 * Math.exp(0.9), 9)
    expect(feltInharmonicity(21, 1)).toBeCloseTo(2.6e-4, 9)
    expect(feltInharmonicity(60, 0)).toBe(0)
  })

  it('ring as long as `ModeTable::buildNote` says', () => {
    // `baseT60ForNote`: 36 s at A0 falling as exp(-0.031 per key); the felt takes 28 % of it.
    const hz = (key: number) => 440 * Math.pow(2, (key - 69) / 12)
    expect(feltRingSeconds(21, 0)).toBeCloseTo(36 / (1 + 27.5 / 9000), 4)
    expect(feltRingSeconds(21, 1)).toBeCloseTo((36 * 0.72) / (1 + 27.5 / 9000), 4)
    expect(feltRingSeconds(60, 0)).toBeCloseTo((36 * Math.exp(-0.031 * 39)) / (1 + C4 / 9000), 2)
    // Above C#6 it falls faster still.
    expect(feltRingSeconds(97, 0)).toBeCloseTo(
      (36 * Math.exp(-0.031 * 76) * Math.exp(-12 / 20)) / (1 + hz(97) / 9000),
      4,
    )
    // The one string of a bass key has one decay: 60 dB down when its ring time is up.
    expect(feltUnisonDb(21, 0, 0.5, 0)).toBeCloseTo(0, 5)
    expect(feltUnisonDb(21, 0, 0.5, feltRingSeconds(21, 0))).toBeCloseTo(-60, 3)
    // Three strings fall fast at first and then slowly: after the ring time they are further down.
    expect(feltUnisonDb(60, 0, 0, 0)).toBeCloseTo(0, 5)
    expect(feltUnisonDb(60, 0, 0, 1)).toBeLessThan((-60 * 1) / feltRingSeconds(60, 0))
    expect(feltUnisonDb(60, 1, 0, 3)).toBeLessThan(feltUnisonDb(60, 0, 0, 3))
  })

  it('time and weigh the hammer’s pulse as `HammerExciter::trigger` does', () => {
    // 4 ms at A1 falling with the root of the pitch, by velocity, hardness and felt, then by 0.68.
    const a4 = 4 * Math.sqrt(55 / 440) * 0.68
    expect(feltContactMs(69, 1, 0, 0.5, false)).toBeCloseTo(a4 * 0.25 * 0.975, 5)
    expect(feltContactMs(69, 0.5, 0, 0.5, false)).toBeCloseTo(a4 * 0.85 * 0.975, 5)
    expect(feltContactMs(69, 0.5, 1, 0, false)).toBeCloseTo(a4 * 0.85 * 1.55 * 3.6, 5)
    expect(feltContactMs(69, 0.5, 0, 0.5, true)).toBeCloseTo(a4 * 0.85 * 0.975 * 1.25, 5)
    // Under A4 the pulse is shorter by (f / 440)^0.35.
    expect(feltContactMs(33, 0.5, 0, 0.5, false)).toBeCloseTo(
      4 * 0.85 * 0.975 * 0.68 * Math.pow(55 / 440, 0.35),
      5,
    )
    // Never under 0.2 ms.
    expect(feltContactMs(108, 1, 0, 1, false)).toBe(0.2)
    // The level: velocity to the 1.5 on bare strings, a quarter less under the soft pedal;
    // under the whole felt a key that is barely touched still gives 0.18.
    expect(feltStrikeDb(1, 0, false)).toBeCloseTo(0, 6)
    expect(feltStrikeDb(0.5, 0, false)).toBeCloseTo(20 * Math.log10(Math.pow(0.5, 1.5)), 5)
    expect(feltStrikeDb(1, 0, true)).toBeCloseTo(20 * Math.log10(0.75), 5)
    expect(feltStrikeDb(0, 1, false)).toBeCloseTo(20 * Math.log10(0.18), 5)
  })

  it('damp, hold and ring on as the voice, the pedal and the room do', () => {
    // `FeltVoice::render`: 0.6 s to -60 dB with Damper at nought, 0.04 s at full.
    expect(feltDamperSeconds(0)).toBeCloseTo(0.6, 6)
    expect(feltDamperSeconds(1)).toBeCloseTo(0.04, 6)
    // A half pedal halves the damper's grip; from halfway down it has none.
    expect(feltPedalGrip(0)).toBe(1)
    expect(feltPedalGrip(0.25)).toBe(0.5)
    expect(feltPedalGrip(0.5)).toBe(0)
    expect(feltPedalGrip(1)).toBe(0)
    // `SympatheticBank`: 0.12 s under the dampers, 3.5 s with the pedal down. `FeltReverb`: 0.2 to 3 s.
    expect(feltSympatheticSeconds(0)).toBeCloseTo(0.12, 6)
    expect(feltSympatheticSeconds(1)).toBeCloseTo(3.5, 6)
    expect(feltRoomSeconds(0)).toBeCloseTo(0.2, 6)
    expect(feltRoomSeconds(1)).toBeCloseTo(3, 6)
  })
})

describe('the felt piano’s display', () => {
  const { display, face, sections } = KEYS_INSTRUMENT_FACES['felt-piano']
  const params = paramsOf('felt-piano')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    runDisplay(display, params, 0.1, { values, notes, signal: testSignal() })
  /** The lights over the keys: one line for each note whose strings still ring. */
  const stems = (drawn: RecordingContext): DrawnPath[] =>
    lights(drawnPaths(drawn)).filter((path) => path.width === 1.75 && path.points.length === 2)
  /** What the room still has of a note: the wide faint line behind its light. */
  const ghosts = (drawn: RecordingContext): DrawnPath[] =>
    lights(drawnPaths(drawn)).filter((path) => path.width === 3.5)
  /**
   * The piano played over `seconds`: one key struck at `struck`, let go at
   * `up`, and the knobs as `values` gives them for each moment.
   */
  const play = (
    seconds: number,
    keys: { hz: number; struck: number; up: number }[],
    values: (time: number) => Record<string, number>,
  ) =>
    runDisplay(
      display,
      params,
      seconds,
      { signal: testSignal() },
      (time): Partial<FrameOptions> => ({
        values: { reverbMix: 0, ...values(time) },
        notes: keys
          .filter((key) => time >= key.struck)
          .map((key) => note(key.hz, time - key.struck, time > key.up ? time - key.up : null)),
      }),
    )

  it('has every knob of the piano in one of its groups, and four of them on its face', () => {
    expect(Object.keys(params)).toHaveLength(18)
    expect(face).toHaveLength(4)
    expect((sections ?? []).flat().sort()).toEqual(Object.keys(params).sort())
  })

  it('lights nothing at rest, and one key for each note that sounds', () => {
    expect(lit(drawDisplay(display, params))).toBe(0)
    expect(lit(drawDisplay(display, params, { powered: false, notes: [note(C4, 0.2)] }))).toBe(0)
    expect(stems(run({}, []))).toHaveLength(0)
    expect(stems(run({}, [note(C4, 0.2), note(392, 0.2)]))).toHaveLength(2)
  })

  it('writes the hammer’s time on the string and the note’s ring time', () => {
    // At rest: middle C at a middling touch.
    const rest = drawDisplay(display, params).words()
    expect(rest).toContain(`${feltContactMs(60, 0.5, 0.65, 0.35, false).toFixed(1)} ms`)
    expect(rest).toContain(`C4 ${secondsText(feltRingSeconds(60, 0.65))}`)
    // Played: the last note that sounds, as hard as it was struck.
    const played = run({ felt: 0, soft: 1 }, [note(110, 0.2, null, 0.8)]).words()
    expect(played).toContain(`${feltContactMs(45, 0.8, 0, 0.35, true).toFixed(1)} ms`)
    expect(played).toContain(`A2 ${secondsText(feltRingSeconds(45, 0))}`)
  })

  it('lets the light run down as the strings die, sooner under the felt', () => {
    const early = stems(run({ felt: 0 }, [note(C4, 0.2)]))[0]
    const late = stems(run({ felt: 0 }, [note(C4, 4)]))[0]
    const felted = stems(run({ felt: 1 }, [note(C4, 4)]))[0]
    expect(reach(late)).toBeLessThan(reach(early))
    expect(reach(felted)).toBeLessThan(reach(late))
    // A held key rings out in the end.
    expect(stems(run({}, [note(C4, 40)]))).toHaveLength(0)
  })

  it('puts a note out as fast as the damper takes it once its key is up', () => {
    // Damper at a half: 0.32 s to -60 dB.
    expect(feltDamperSeconds(0.5)).toBeCloseTo(0.32, 6)
    const held = stems(run({}, [note(C4, 1)]))[0]
    const falling = stems(run({}, [note(C4, 1, 0.1)]))[0]
    expect(reach(falling)).toBeLessThan(reach(held))
    expect(stems(run({}, [note(C4, 1, 0.4)]))).toHaveLength(0)
    // A slow damper still has it then, a fast one has taken it within a twentieth of a second.
    expect(stems(run({ damper: 0 }, [note(C4, 1, 0.4)]))).toHaveLength(1)
    expect(stems(run({ damper: 1 }, [note(C4, 1, 0.05)]))).toHaveLength(0)
  })

  it('holds a note whose key is up while the sustain pedal is down, and half holds it halfway', () => {
    expect(stems(run({ sustain: 1 }, [note(C4, 3, 2)]))).toHaveLength(1)
    // Half the grip: what is gone in 0.32 s takes 0.64 s.
    expect(stems(run({ sustain: 0.25 }, [note(C4, 1, 0.4)]))).toHaveLength(1)
    expect(stems(run({ sustain: 0.25 }, [note(C4, 1.5, 0.9)]))).toHaveLength(0)
    // The pedal comes up a second in: the damper falls then.
    const key = [{ hz: C4, struck: 0, up: 0.3 }]
    const pedal = (time: number) => ({ sustain: time < 1 ? 1 : 0 })
    expect(stems(play(0.95, key, pedal))).toHaveLength(1)
    expect(stems(play(1.1, key, pedal))).toHaveLength(1)
    expect(stems(play(1.5, key, pedal))).toHaveLength(0)
    expect(stems(play(1.5, key, () => ({ sustain: 1 })))).toHaveLength(1)
  })

  it('holds with the sostenuto pedal only what sounded when it went down', () => {
    const keys = [
      { hz: C4, struck: 0, up: 0.4 },
      { hz: 392, struck: 0.5, up: 0.7 },
    ]
    const pedal = (time: number) => ({ sostenuto: time >= 0.2 && time < 1.5 ? 1 : 0 })
    // Both sound while the second key is down.
    expect(stems(play(0.65, keys, pedal))).toHaveLength(2)
    // The second was struck under the pedal and damps as usual; the first is held.
    const held = stems(play(1.4, keys, pedal))
    expect(held).toHaveLength(1)
    const first = stems(play(0.3, keys, pedal))[0]
    expect(held[0].points[0][0]).toBeCloseTo(first.points[0][0], 5)
    // The pedal comes up: the first goes too.
    expect(stems(play(2, keys, pedal))).toHaveLength(0)
  })

  it('stops the damper where it is when a pedal goes down after the key came up', () => {
    // `FeltVoice::render`: a damper that is falling takes nothing more while the sustain pedal is
    // down (its grip is nought) or the sostenuto pedal has the voice; it goes on when the pedal is up.
    const key = [{ hz: C4, struck: 0, up: 0.3 }]
    const whole = stems(play(1.4, key, () => ({ sustain: 1 })))[0]
    for (const name of ['sustain', 'sostenuto']) {
      const pedal = (time: number) => ({ [name]: time >= 0.4 && time < 1.5 ? 1 : 0 })
      const caught = stems(play(1.4, key, pedal))
      expect(caught).toHaveLength(1)
      // What the damper took in its tenth of a second stays off: some 12 to 19 dB of the 60 the light spans.
      const taken = reach(whole) - reach(caught[0])
      expect(taken).toBeGreaterThan(reach(whole) * 0.15)
      expect(taken).toBeLessThan(reach(whole) * 0.6)
      expect(stems(play(2, key, pedal))).toHaveLength(0)
    }
  })

  it('lets go of a key that is still down when the sostenuto pedal that held it comes up', () => {
    // `FeltSynth::handle_sostenuto_pedal`: every voice the pedal marked is released when it lifts.
    const key = [{ hz: C4, struck: 0, up: 9 }]
    const pedal = (time: number) => ({ sostenuto: time >= 0.2 && time < 1 ? 1 : 0 })
    expect(stems(play(0.9, key, pedal))).toHaveLength(1)
    expect(stems(play(1.6, key, pedal))).toHaveLength(0)
    expect(stems(play(1.6, key, () => ({})))).toHaveLength(1)
  })

  it('fills each half of its foot with the level of its own side', () => {
    const [left, right] = litBoxes(run({}, []))
    // The test's left side is the louder: its half reaches further from the middle.
    expect(left[0] + left[2]).toBeCloseTo(right[0], 5)
    expect(left[2]).toBeGreaterThan(right[2])
    expect(litBoxes(runDisplay(display, params, 0.1, { signal: testSignal(0, 0) }))).toHaveLength(0)
  })

  it('gives a voice to the newest note when Polyphony has no more', () => {
    const chord = [note(C4, 0.5), note(392, 0.3)]
    expect(stems(run({}, chord))).toHaveLength(2)
    const one = stems(run({ polyphony: 1 }, chord))
    expect(one).toHaveLength(1)
    const upper = stems(run({}, [note(392, 0.3)]))[0]
    expect(one[0].points[0][0]).toBeCloseTo(upper.points[0][0], 5)
  })

  it('lets the damper fall on a note whose key is struck again', () => {
    const twice = [
      { hz: C4, struck: 0, up: 9 },
      { hz: C4 * 1.0001, struck: 0.5, up: 9 },
    ]
    expect(stems(play(0.55, twice, () => ({})))).toHaveLength(2)
    expect(stems(play(1.2, twice, () => ({})))).toHaveLength(1)
  })

  it('shows the room behind a note and the piano before it, by Reverb', () => {
    const sounding = [note(C4, 0.3)]
    expect(ghosts(run({ reverbMix: 0 }, sounding))).toHaveLength(0)
    expect(ghosts(run({ reverbMix: 0.5 }, sounding))).toHaveLength(1)
    // Fully up is the room alone: the strings' own light is out.
    expect(stems(run({ reverbMix: 1 }, sounding))).toHaveLength(0)
    expect(ghosts(run({ reverbMix: 1 }, sounding))).toHaveLength(1)
    // The room has a note for a while after the damper has taken it, longer in a long room.
    const damped = [note(C4, 1.5, 1)]
    expect(stems(run({ reverbMix: 0.5 }, damped))).toHaveLength(0)
    expect(ghosts(run({ reverbMix: 0.5, reverbSize: 0 }, damped))).toHaveLength(0)
    expect(ghosts(run({ reverbMix: 0.5, reverbSize: 1 }, damped))).toHaveLength(1)
  })

  it('lights the sympathetic string of a note’s pitch while there is Resonance', () => {
    const rings = (drawn: RecordingContext) =>
      lights(drawnPaths(drawn)).filter((path) => path.width === 1 && path.points.length === 2)
    expect(rings(run({ resonance: 0.5 }, [note(C4, 0.3)]))).toHaveLength(1)
    expect(rings(run({ resonance: 0 }, [note(C4, 0.3)]))).toHaveLength(0)
    expect(rings(run({ resonance: 0.5 }, []))).toHaveLength(0)
  })
})

describe('the tine piano’s figures', () => {
  it('ring as long as `TinePiano::sustain_seconds` and `bell_seconds` say', () => {
    // 11 s at middle C falling as (261.63 / f)^0.45, kept between 1.2 and 24, times Decay.
    expect(tineSustainSeconds(C4, 1)).toBeCloseTo(11, 5)
    expect(tineSustainSeconds(C4, 2)).toBeCloseTo(22, 5)
    expect(tineSustainSeconds(C4 * 4, 1)).toBeCloseTo(11 * Math.pow(0.25, 0.45), 5)
    expect(tineSustainSeconds(20, 1)).toBe(24)
    expect(tineSustainSeconds(40000, 0.5)).toBe(0.6)
    // The bell: 0.45 s at middle C, between 0.12 and 0.9.
    expect(tineBellSeconds(C4)).toBeCloseTo(0.45, 5)
    expect(tineBellSeconds(20)).toBe(0.9)
    expect(tineBellSeconds(40000)).toBe(0.12)
  })

  it('fall as `Voice::render` lets tine and tone bar fall', () => {
    // At the strike the tine alone; the bar comes in over 30 ms.
    expect(tineBody(0, 11)).toBe(1)
    // The tine is 60 dB down at half the sustain time; the bar, at 0.3, takes 1.1 of it.
    const bar = (seconds: number) =>
      0.3 * Math.pow(10, (-3 * seconds) / 12.1) * (1 - Math.exp(-seconds / 0.03))
    expect(tineBody(5.5, 11)).toBeCloseTo(1e-3 + bar(5.5), 6)
    expect(tineBody(12.1, 11)).toBeCloseTo(Math.pow(10, -6.6) + 0.3e-3, 6)
    // A held key in dB under a full strike, and the damper's 60 dB over Release once it is up.
    expect(tineNoteDb(0, null, 1, 11, 0.25)).toBeCloseTo(0, 5)
    expect(tineNoteDb(2, null, 1, 11, 0.25)).toBeCloseTo(20 * Math.log10(tineBody(2, 11)), 5)
    expect(tineNoteDb(2, 0.25, 1, 11, 0.25)).toBeCloseTo(20 * Math.log10(tineBody(2, 11)) - 60, 5)
    expect(tineNoteDb(2, 0.5, 1, 11, 3)).toBeCloseTo(20 * Math.log10(tineBody(2, 11)) - 10, 5)
    // `voice.gain`: a key barely touched is still heard.
    expect(tineLoudness(1)).toBe(1)
    expect(tineLoudness(0)).toBe(0.12)
    expect(tineLoudness(0.25)).toBeCloseTo(0.12 + 0.88 * 0.125, 6)
  })

  it('rest and swing before the pickup as `TinePiano::apply` and `note_on` set them', () => {
    // Bark brings the tine's rest from 0.577 pole widths off the axis to 0.357.
    expect(tineRest(0)).toBeCloseTo(0.57735, 5)
    expect(tineRest(1)).toBeCloseTo(0.35735, 5)
    // The swing: 0.55 pole widths at most, 0.35 of it with no Bark.
    expect(tineSwing(C4, 1, 1, 1, 48000)).toBeCloseTo(0.55, 5)
    expect(tineSwing(C4, 1, 0, 1, 48000)).toBeCloseTo(0.55 * 0.35, 5)
    // With no Hardness a hard key swings as a soft one; with all of it a soft key swings little.
    expect(tineSwing(C4, 1, 1, 0, 48000)).toBeCloseTo(0.275, 5)
    expect(tineSwing(C4, 0.2, 1, 0, 48000)).toBeCloseTo(0.275, 5)
    expect(tineSwing(C4, 0, 1, 1, 48000)).toBeCloseTo(0.55 * 0.15, 5)
    // Low keys swing wider, by (261.63 / f)^0.3 up to 1.3; high keys less, down to a half.
    expect(tineSwing(C4 / 4, 1, 1, 1, 48000)).toBeCloseTo(0.55 * 1.3, 5)
    expect(tineSwing(C4 * 8, 1, 1, 1, 48000)).toBeCloseTo(0.55 * Math.pow(1 / 8, 0.3), 5)
    expect(tineSwing(C4 * 16, 1, 1, 1, 96000)).toBeCloseTo(0.55 * 0.5, 5)
    // Far up, the swing is held to what the pickup's harmonics have room for.
    expect(tineSwing(8000, 1, 1, 1, 48000)).toBeCloseTo(Math.pow(1e-3 / 3, 1 / 3), 5)
    // The bell: 0.09 of the tine's swing times Bell, by how hard the key is struck; gone
    // where 6.267 times the note has no room under the band's edge.
    expect(tineBellLevel(C4, 1, 1, 1, 48000)).toBeCloseTo(0.09 * 1.3, 6)
    expect(tineBellLevel(C4, 1, 0.5, 0, 48000)).toBeCloseTo(0.09 * 0.5 * 0.5, 6)
    expect(tineBellLevel(C4, 0.5, 1, 1, 48000)).toBeCloseTo(0.09 * 1.3 * 0.25, 6)
    expect(tineBellLevel(3500, 1, 1, 1, 48000)).toBe(0)
  })

  it('pulse as `TinePiano::process` does, as loud at any depth', () => {
    expect(tineTremoloGain(0.3, 0)).toBe(1)
    // At full depth a side goes from nought to 1.63 times its level.
    expect(tineTremoloGain(0.25, 1)).toBeCloseTo(0, 6)
    expect(tineTremoloGain(0.75, 1)).toBeCloseTo(1 / Math.sqrt(0.375), 6)
    for (const depth of [0.3, 0.7, 1]) {
      let power = 0
      for (let step = 0; step < 360; step++) power += tineTremoloGain(step / 360, depth) ** 2 / 360
      expect(power).toBeCloseTo(1, 6)
    }
  })
})

describe('the tine piano’s display', () => {
  const { display } = KEYS_INSTRUMENT_FACES['tine-piano']
  const params = paramsOf('tine-piano')
  const run = (values: Record<string, number>, notes: DisplayNote[], signal = testSignal()) =>
    runDisplay(display, params, 0.1, { values, notes, signal })
  /** The lights on the row of tines: one line from the foot for each tine that swings. */
  const tines = (drawn: RecordingContext): DrawnPath[] =>
    lights(drawnPaths(drawn)).filter((path) => path.width === 1.75 && path.points.length === 2)
  /** The wave of the note that sounds. */
  const waves = (drawn: RecordingContext): DrawnPath[] =>
    lights(drawnPaths(drawn)).filter((path) => path.points.length === 96)
  /** No sound comes out, so nothing but notes can be lit. */
  const silent = testSignal(0, 0)

  it('lights nothing at rest, and one tine for each note that sounds', () => {
    expect(lit(drawDisplay(display, params))).toBe(0)
    expect(lit(run({}, [], silent))).toBe(0)
    expect(tines(run({}, [note(C4, 0.5), note(392, 0.5)]))).toHaveLength(2)
    expect(waves(run({}, [note(C4, 0.5), note(392, 0.5)]))).toHaveLength(1)
  })

  it('writes the note and how long it rings, and the tremolo’s rate', () => {
    const rest = drawDisplay(display, params).words()
    expect(rest).toContain(`C4 ${secondsText(11)}`)
    expect(rest).toContain('3.2 Hz')
    const played = run({ decay: 2, tremoloRate: 6 }, [note(110, 0.2)]).words()
    expect(played).toContain(`A2 ${secondsText(tineSustainSeconds(110, 2))}`)
    expect(played).toContain('6.0 Hz')
  })

  it('lets a tine’s light run down as it dies, and puts it out when it has', () => {
    const early = tines(run({}, [note(C4, 0.2)]))[0]
    const late = tines(run({}, [note(C4, 4)]))[0]
    expect(reach(late)).toBeLessThan(reach(early) * 0.7)
    // A held middle C: the bar keeps it going past the tine's own 5.5 s, and at 11 s it is out.
    expect(tines(run({}, [note(C4, 7)]))).toHaveLength(1)
    expect(lit(run({}, [note(C4, 11.5)], silent))).toBe(0)
    // Decay makes it last.
    expect(tines(run({ decay: 4 }, [note(C4, 11.5)]))).toHaveLength(1)
  })

  it('damps a tine over Release once its key is up', () => {
    // Release at a quarter of a second.
    expect(tines(run({}, [note(C4, 1, 0.1)]))).toHaveLength(1)
    expect(lit(run({}, [note(C4, 1, 0.3)], silent))).toBe(0)
    expect(tines(run({ release: 3 }, [note(C4, 1, 0.3)]))).toHaveLength(1)
    // A key struck again while it sounds is caught in 40 ms: one tine, not two.
    const again = [note(C4, 1, 0.2), note(C4, 0.2)]
    expect(tines(run({ release: 3 }, again))).toHaveLength(1)
  })

  it('draws the wave of the note that sounds, larger for a hard key and purer as it dies', () => {
    const hard = waves(run({}, [note(C4, 0.05, null, 1)]))[0]
    const soft = waves(run({}, [note(C4, 0.05, null, 0.3)]))[0]
    const old = waves(run({}, [note(C4, 5, null, 1)]))[0]
    expect(reach(soft)).toBeLessThan(reach(hard))
    expect(reach(old)).toBeLessThan(reach(soft))
  })

  it('fills each half of its foot with the level of its own side', () => {
    const [left, right] = litBoxes(run({}, []))
    // The test's left side is the louder: its half reaches further from the middle.
    expect(left[0] + left[2]).toBeCloseTo(right[0], 5)
    expect(left[2]).toBeGreaterThan(right[2])
    expect(litBoxes(run({}, [], silent))).toHaveLength(0)
  })

  it('takes the damper once on the way the tine swings, as `Voice::render` does', () => {
    // A low key struck hard at full Bark, its key up for 0.3 s of a Release of 3 s: the damper
    // has left a half of it. `displacement` and `velocity` each have the envelope once.
    const hz = C4 / 2
    const damper = Math.pow(10, -0.3)
    const drawn = waves(run({ bark: 1, hardness: 1, release: 3 }, [note(hz, 0.4, 0.3, 1)]))[0]
    const body = damper * tineBody(0.4, tineSustainSeconds(hz, 1))
    const ring =
      damper * tineBellLevel(hz, 1, 0.45, 1, 48000) * Math.pow(10, (-3 * 0.4) / tineBellSeconds(hz))
    const swing = tineSwing(hz, 1, 1, 1, 48000)
    const wave = (swings: number): number[] => {
      const out = new Float32Array(96)
      const drive = 0.5 + 7.5 * 0.15 * 0.15
      tineWave(out, hz, swings, body, ring, tineLoudness(1), tineRest(1), drive, 500 * 28 ** 0.55)
      return [...out]
    }
    /** A wave between its lowest point and its highest, whatever box it was drawn in. */
    const shapeOf = (values: number[]): number[] => {
      const low = Math.min(...values)
      const high = Math.max(...values)
      return values.map((value) => (value - low) / (high - low))
    }
    const seen = shapeOf(drawn.points.map(([, y]) => -y))
    const once = shapeOf(wave(swing))
    seen.forEach((value, at) => expect(value).toBeCloseTo(once[at], 3))
    // With the damper on the swing a second time the tine would stay nearer its rest, and the
    // pickup would give a purer wave than the device does.
    const twice = shapeOf(wave(damper * swing))
    expect(Math.max(...once.map((value, at) => Math.abs(value - twice[at])))).toBeGreaterThan(0.02)
  })

  it('keeps for a sounding note the knobs its key was struck under', () => {
    // `tine_piano.h`: Bell, Hardness and Decay are read when a key is struck.
    const held = (time: number): DisplayNote[] => [note(C4, time + 0.05)]
    const play = (each: (time: number) => Partial<FrameOptions>) =>
      runDisplay(display, params, 0.5, { signal: testSignal() }, each)
    const still = play((time) => ({ notes: held(time) }))
    const moved = (name: string, to: number) =>
      play((time) => ({ values: time < 0.2 ? {} : { [name]: to }, notes: held(time) }))
    const fresh = (name: string, to: number) =>
      play((time) => ({ values: { [name]: to }, notes: held(time) }))
    // Decay moves the tines at rest; the one that sounds keeps its length and its light.
    expect(tines(moved('decay', 4))[0].points).toEqual(tines(still)[0].points)
    expect(tines(fresh('decay', 4))[0].points).not.toEqual(tines(still)[0].points)
    expect(moved('decay', 4).words()).toContain(`C4 ${secondsText(11)}`)
    for (const name of ['bell', 'hardness']) {
      expect(waves(moved(name, 0))[0].points).toEqual(waves(still)[0].points)
      expect(waves(fresh(name, 0))[0].points).not.toEqual(waves(still)[0].points)
    }
    // Release is read when the key comes up: a quarter of a second then, and the note is not
    // kept by turning it up afterwards.
    const letGo = (release: (time: number) => number) =>
      runDisplay(display, params, 0.8, { signal: silent }, (time) => ({
        values: { release: release(time) },
        notes: [note(C4, time + 0.05, time > 0.2 ? time - 0.2 : null)],
      }))
    expect(lit(letGo((time) => (time < 0.5 ? 0.25 : 3)))).toBe(0)
    expect(lit(letGo(() => 3))).toBeGreaterThan(0)
  })
})

describe('the glass’s figures', () => {
  it('scale time and index by the key as `FmGlass::key_time_scale` and `key_index_scale` do', () => {
    expect(glassTimeScale(C4)).toBeCloseTo(1, 6)
    expect(glassTimeScale(C4 / 4)).toBeCloseTo(Math.pow(4, 0.4), 5)
    expect(glassTimeScale(20)).toBe(2.5)
    expect(glassTimeScale(4186)).toBe(0.4)
    expect(glassIndexScale(C4)).toBeCloseTo(1, 6)
    expect(glassIndexScale(C4 * 4)).toBeCloseTo(0.5, 5)
    expect(glassIndexScale(C4 / 4)).toBe(1.4)
    expect(glassIndexScale(4186 * 2)).toBe(0.3)
    // The note rings four times as long as its brightness lasts.
    expect(glassRingSeconds(C4, 2.5)).toBeCloseTo(10, 5)
    expect(glassRingSeconds(C4 / 4, 1)).toBeCloseTo(4 * Math.pow(4, 0.4), 5)
  })

  it('beat as far apart as Detune tunes the two halves', () => {
    expect(glassBeatHz(440, 0)).toBe(0)
    // Five cents at A4: a little over one beat a second.
    expect(glassBeatHz(440, 5)).toBeCloseTo(
      440 * (Math.pow(2, 5 / 2400) - Math.pow(2, -5 / 2400)),
      9,
    )
    expect(glassBeatHz(440, 5)).toBeCloseTo(1.2707, 3)
    expect(glassBeatHz(880, 5)).toBeCloseTo(2 * glassBeatHz(440, 5), 9)
  })

  it('shape an envelope as `kit::Adsr` does', () => {
    // The attack aims at 1.3 and is at 1 when its time is up.
    expect(adsrLevel(0, null, 0.5, 1, 0, 1)).toBe(0)
    expect(adsrLevel(0.25, null, 0.5, 1, 0, 1)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 6)
    expect(adsrLevel(0.5, null, 0.5, 1, 0, 1)).toBeCloseTo(1, 6)
    // The decay takes 60 dB off the way to the sustain level in its time.
    expect(adsrLevel(0.5 + 1, null, 0.5, 2, 0, 1)).toBeCloseTo(Math.pow(10, -1.5), 6)
    expect(adsrLevel(0.5 + 2, null, 0.5, 2, 0.4, 1)).toBeCloseTo(0.4 + 0.6e-3, 6)
    expect(adsrLevel(60, null, 0.5, 2, 0.4, 1)).toBe(0.4)
    // The release takes 60 dB off where it stood, in its time, and then it is idle.
    expect(adsrLevel(1.5, 0.5, 0.5, 2, 0.4, 1)).toBeCloseTo(
      adsrLevel(1, null, 0.5, 2, 0.4, 1) * Math.pow(10, -1.5),
      6,
    )
    expect(adsrLevel(4, 2, 0.5, 2, 0.4, 1)).toBe(0)
  })

  it('give a note the index `FmGlass::note_on` and `tune` give it', () => {
    const knobs = { algorithm: 0, ratio: 1, brightness: 1, velocity: 0, feedback: 0, detune: 0 }
    // 8 radians at full Brightness on middle C, by Brightness to the 1.5, by the key.
    expect(glassIndex(C4, 1, knobs)).toBeCloseTo(8, 5)
    expect(glassIndex(C4, 1, { ...knobs, brightness: 0.45 })).toBeCloseTo(
      8 * Math.pow(0.45, 1.5),
      5,
    )
    expect(glassIndex(C4 * 4, 1, knobs)).toBeCloseTo(4, 5)
    // Velocity: a soft key has up to three quarters less.
    expect(glassIndex(C4, 0.5, { ...knobs, velocity: 0.6 })).toBeCloseTo(
      8 * (1 - 0.6 * 0.75 * 0.5),
      5,
    )
    expect(glassIndex(C4, 0, { ...knobs, velocity: 1 })).toBeCloseTo(2, 5)
    // Band-limiting: a modulator high up is held to the index that fits under the band's edge,
    // and one above the edge is silent.
    const high = glassIndex(2093, 1, { ...knobs, ratio: 4 })
    expect(high).toBeGreaterThan(0)
    expect(high).toBeLessThan(8 * glassIndexScale(2093))
    expect(glassIndex(4186, 1, { ...knobs, ratio: 11 })).toBe(0)
  })
})

describe('the glass’s display', () => {
  const { display } = KEYS_INSTRUMENT_FACES['fm-glass']
  const params = paramsOf('fm-glass')
  const run = (values: Record<string, number>, notes: DisplayNote[], signal = testSignal()) =>
    runDisplay(display, params, 0.1, { values, notes, signal })
  const silent = testSignal(0, 0)
  /** The partials of the notes that sound: how many stand on the spectrum in the accent. */
  const partials = (drawn: RecordingContext): number =>
    lights(drawnPaths(drawn)).reduce((sum, path) => sum + path.points.length / 2, 0)
  /** The tallest of them, in px. */
  const tallest = (drawn: RecordingContext): number =>
    Math.max(0, ...lights(drawnPaths(drawn)).map(reach))

  it('lights nothing at rest, and the partials of a note that sounds', () => {
    expect(lit(drawDisplay(display, params))).toBe(0)
    expect(lit(run({}, [], silent))).toBe(0)
    expect(partials(run({}, [note(C4, 0.05)]))).toBeGreaterThan(3)
  })

  it('writes the algorithm, each operator’s pitch against the note’s, and the ring time', () => {
    const rest = drawDisplay(display, params).words()
    expect(rest[rest.length - 2]).toBe('Bell')
    expect(rest[rest.length - 1]).toBe(`C4 ${secondsText(10)}`)
    // Bell: two modulators at Ratio, two carriers at the note.
    expect(rest.filter((words) => words === '3.5')).toHaveLength(2)
    expect(rest.filter((words) => words === '1')).toHaveLength(2)
    // Glass: the top of the stack stands at twice the modulator.
    const stack = drawDisplay(display, params, { values: { algorithm: 1, ratio: 3 } }).words()
    expect(stack).toContain('Glass')
    expect(stack.slice(0, 4)).toEqual(['4', '2', '1', '1'])
    // Mallet: one modulator on two carriers, and the bar at four times the note.
    const mallet = drawDisplay(display, params, { values: { algorithm: 2, ratio: 11 } }).words()
    expect(mallet).toContain('Mallet')
    expect(mallet.slice(0, 4)).toEqual(['14', '1', '4', '1'])
    expect(drawDisplay(display, params, { values: { algorithm: 3 } }).words()).toContain('Pad')
    // The note that sounds is the one that is written.
    const played = run({ decay: 1 }, [note(110, 0.2)]).words()
    expect(played).toContain(`A2 ${secondsText(glassRingSeconds(110, 1))}`)
    // With Sustain a held note does not ring out, and no ring time is said.
    expect(drawDisplay(display, params, { values: { sustain: 0.5 } }).words()).toContain('C4 held')
    expect(run({ sustain: 1 }, [note(110, 0.2)]).words()).toContain('A2 held')
  })

  it('keeps for a sounding note the algorithm, the ratio and the touch it was struck with', () => {
    // `FmGlass::note_on`: Algorithm, Ratio and Velocity are read when a note starts.
    const held = (time: number): DisplayNote[] => [note(C4, time + 0.05, null, 0.4)]
    const stems = (each: (time: number) => Partial<FrameOptions>) =>
      lights(drawnPaths(runDisplay(display, params, 0.5, { signal: testSignal() }, each))).map(
        (path) => path.points,
      )
    const still = stems((time) => ({ notes: held(time) }))
    expect(still.flat().length).toBeGreaterThan(6)
    const knobs: [string, number][] = [
      ['algorithm', 2],
      ['ratio', 1],
      ['velocity', 0],
    ]
    for (const [name, to] of knobs) {
      const moved = stems((time) => ({
        values: time < 0.2 ? {} : { [name]: to },
        notes: held(time),
      }))
      expect(moved, `${name} moved under a held note`).toEqual(still)
      // A note struck after the knob moved has it.
      const fresh = stems((time) => ({ values: { [name]: to }, notes: held(time) }))
      expect(fresh, `${name} for a new note`).not.toEqual(still)
    }
  })

  it('lets a note’s partials fall back to its bare tone as its brightness dies', () => {
    // Decay at 2.5 s: after 8 s the modulators are 190 dB down and the two halves stand in one place.
    expect(partials(run({}, [note(C4, 8)]))).toBe(1)
    expect(partials(run({ brightness: 0 }, [note(C4, 0.05)]))).toBe(1)
    // The Pad's modulators settle on 0.7 of Sustain and stay.
    const pad = { algorithm: 3, sustain: 1, brightness: 1 }
    expect(partials(run(pad, [note(C4, 60)]))).toBeGreaterThan(3)
  })

  it('keeps a held note for four times Decay, and for good with Sustain', () => {
    expect(partials(run({}, [note(C4, 5)]))).toBe(1)
    expect(lit(run({}, [note(C4, 10.5)], silent))).toBe(0)
    expect(partials(run({ decay: 20 }, [note(C4, 10.5)]))).toBeGreaterThan(0)
    expect(partials(run({ sustain: 0.5 }, [note(C4, 600)]))).toBeGreaterThan(0)
    // Low notes ring longer: two octaves down the same age is still lit.
    expect(partials(run({}, [note(C4 / 4, 10.5)]))).toBeGreaterThan(0)
  })

  it('lets a note go over Release once its key is up', () => {
    // Release at 3 s.
    expect(partials(run({}, [note(C4, 2, 1)]))).toBeGreaterThan(0)
    expect(lit(run({}, [note(C4, 4.2, 3.2)], silent))).toBe(0)
    expect(lit(run({ release: 0.02 }, [note(C4, 1.1, 0.1)], silent))).toBe(0)
    expect(partials(run({ release: 15, sustain: 1 }, [note(C4, 4.2, 3.2)]))).toBeGreaterThan(0)
  })

  it('makes a soft key darker and quieter by Velocity', () => {
    const hard = run({}, [note(C4, 0.05, null, 1)])
    const soft = run({}, [note(C4, 0.05, null, 0.2)])
    expect(partials(soft)).toBeLessThan(partials(hard))
    expect(tallest(soft)).toBeLessThan(tallest(hard))
    // With no Velocity every key comes out whole.
    const even = run({ velocity: 0 }, [note(C4, 0.05, null, 0.2)])
    expect(partials(even)).toBe(partials(run({ velocity: 0 }, [note(C4, 0.05, null, 1)])))
    expect(tallest(even)).toBeCloseTo(tallest(run({ velocity: 0 }, [note(C4, 0.05, null, 1)])), 5)
  })

  it('beats the two halves of a note against each other, as deep as Spread leaves them alike', () => {
    // Thirty cents at middle C: 4.5 beats a second. The bare tone, both halves in the middle.
    const beat = glassBeatHz(C4, 30)
    const bare = { detune: 30, brightness: 0, spread: 0, decay: 20 }
    const whole = tallest(run(bare, [note(C4, 1 / beat)]))
    // Half a beat on they cancel; a whole beat on they stand together again.
    expect(partials(run(bare, [note(C4, 0.5 / beat)]))).toBe(0)
    expect(whole).toBeGreaterThan(10)
    // Spread apart, a speaker has one half only and there is nothing to beat with.
    const apart = { ...bare, spread: 1 }
    expect(tallest(run(apart, [note(C4, 0.5 / beat)]))).toBeGreaterThan(whole * 0.9)
    // With no Detune there is no beat.
    expect(tallest(run({ ...bare, detune: 0 }, [note(C4, 0.5 / beat)]))).toBeGreaterThan(
      whole * 0.9,
    )
  })
})
