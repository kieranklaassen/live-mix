// The truth of the displays of the instruments that play recorded sound: a
// head is where the device's own read head is, a note is lit for as long as
// its envelope (or its tape) lets it sound, and what a knob does to a note
// that sounds shows on it.
//
// The figures marked "the device" were printed by the devices themselves:
// their headers compiled with a harness that plays a key and reads the voice
// (its read position, its envelope, the take of its tape), on the sound each
// is built with and on sounds of other lengths handed to it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  GRAIN_SOUND_SEC,
  GRAIN_STORE_FRAMES,
  SAMPLER_SOUND_SEC,
  SAMPLER_STORE_FRAMES,
  SAMPLE_INSTRUMENT_FACES,
  TONE_MARK_FLOOR_DB,
  TONE_MARK_HIGH_HZ,
  TONE_MARK_LOW_HZ,
  adsrAttackLevel,
  adsrLevel,
  grainDensity,
  grainEdge,
  grainSpawn,
  grainSpray,
  grainVelocity,
  grainWindow,
  grainsAtStart,
  lightOf,
  samplerHead,
  samplerRegion,
  samplerSpeed,
  samplerVelocity,
  soundSeconds,
  tapeAt,
  tapeBandGain,
  tapeHiss,
  tapeRunOut,
  tapeTake,
  toneGain,
  zoneLevel,
  zoneVelocity,
  type Grain,
  type GrainSettings,
  type TapeSettings,
} from '../components/displays/instrument-samples'
import { type DisplayNote, type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent, ink } = PLAIN_COLOURS
const MIDDLE_C = 261.6256

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id: Math.round(frequency), frequency, gain, age, released })

/**
 * What a display draws with these knobs and these notes, the sound running.
 * `sampleSeconds` is the length of a sound the device was handed; left out, it
 * plays the one it is built with.
 */
const played = (
  display: PlateDisplay,
  id: string,
  values: Record<string, number>,
  notes: DisplayNote[],
  sampleSeconds: number | null = null,
): RecordingContext =>
  drawDisplay(display, paramsOf(id), { values, notes, signal: testSignal(), sampleSeconds })

/** Everything painted in the accent: what sounds now. */
const lit = (drawn: RecordingContext): DrawnPath[] =>
  drawnPaths(drawn).filter((path) => path.colour === accent)
/** The straight lines among them: a head, a stem, a mark. */
const lines = (drawn: RecordingContext): DrawnPath[] =>
  lit(drawn).filter((path) => path.kind === 'stroke' && path.points.length === 2)
/** And the shapes: a grain, a tape. */
const shapes = (drawn: RecordingContext, kind: 'stroke' | 'fill'): DrawnPath[] =>
  lit(drawn).filter((path) => path.kind === kind && path.points.length > 4)
const tall = (path: DrawnPath): number => {
  const ys = path.points.map(([, y]) => y)
  return Math.max(...ys) - Math.min(...ys)
}
const right = (path: DrawnPath): number => Math.max(...path.points.map(([x]) => x))

/** The dots drawn in a colour, as centre and radius. */
function dots(drawn: RecordingContext, colour: string): { x: number; y: number; r: number }[] {
  const out: { x: number; y: number; r: number }[] = []
  let pending: { x: number; y: number; r: number }[] = []
  let fill = ''
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') pending = []
    else if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'arc') {
      const [x, y, r] = call.args as number[]
      pending.push({ x, y, r })
    } else if (call.name === 'fill' && fill === colour) out.push(...pending)
  }
  return out
}

describe('the envelope these instruments share', () => {
  it('rises as `kit::Adsr` does: for 1.3, cut off at 1 when the attack time is up', () => {
    // The device, Attack 0.5 s: 0.33043 after 0.1 s, 0.67549 after 0.25 s, 1 from 0.5 s on.
    expect(adsrAttackLevel(0.1, 0.5)).toBeCloseTo(0.33043, 3)
    expect(adsrAttackLevel(0.25, 0.5)).toBeCloseTo(0.67549, 3)
    expect(adsrAttackLevel(0.5, 0.5)).toBe(1)
    expect(adsrAttackLevel(3, 0.5)).toBe(1)
    expect(adsrAttackLevel(0, 0.5)).toBe(0)
  })

  it('falls 60 dB in the release time, from wherever the attack had got to', () => {
    // The device, Release 2 s after a second held: 0.031639 a second on, 0.001001 two seconds on.
    expect(adsrLevel(2, 1, 0.5, 2)).toBeCloseTo(0.031639, 4)
    expect(adsrLevel(3, 2, 0.5, 2)).toBeCloseTo(0.001001, 5)
    // The device, let go 0.1 s into that attack: 0.010454 a second on.
    expect(adsrLevel(1.1, 1, 0.5, 2)).toBeCloseTo(0.010454, 4)
    expect(adsrLevel(0.7, null, 0.5, 2)).toBe(1)
  })

  it('is drawn as high as its square root: half the height is 12 dB down', () => {
    expect(lightOf(1)).toBe(1)
    expect(lightOf(0.25)).toBe(0.5)
    expect(lightOf(4)).toBe(1)
    expect(lightOf(-1)).toBe(0)
  })
})

describe('the sound a sample device plays', () => {
  it('is the one it is built with until it is handed another', () => {
    expect(soundSeconds(null, SAMPLER_SOUND_SEC, SAMPLER_STORE_FRAMES, 48000)).toBe(
      SAMPLER_SOUND_SEC,
    )
    expect(soundSeconds(2, SAMPLER_SOUND_SEC, SAMPLER_STORE_FRAMES, 48000)).toBe(2)
    expect(soundSeconds(10, GRAIN_SOUND_SEC, GRAIN_STORE_FRAMES, 48000)).toBe(10)
  })

  it('is no longer than the store holds: `kit::SampleStore::commit` drops the rest', () => {
    // The device, handed 2 000 000 frames at 48 kHz: the sampler keeps 31.25 s of them, the grain synth 21.8453 s.
    expect(soundSeconds(2000000 / 48000, SAMPLER_SOUND_SEC, SAMPLER_STORE_FRAMES, 48000)).toBe(
      31.25,
    )
    expect(soundSeconds(2000000 / 48000, GRAIN_SOUND_SEC, GRAIN_STORE_FRAMES, 48000)).toBeCloseTo(
      21.8453,
      4,
    )
    // The same store is more seconds of a sound at a lower rate.
    expect(soundSeconds(60, SAMPLER_SOUND_SEC, SAMPLER_STORE_FRAMES, 44100)).toBeCloseTo(34.0136, 4)
  })

  it('is nothing under 16 frames, which the devices call empty', () => {
    // The device, handed 8 frames: no key plays.
    expect(soundSeconds(8 / 48000, SAMPLER_SOUND_SEC, SAMPLER_STORE_FRAMES, 48000)).toBe(0)
    expect(soundSeconds(0, GRAIN_SOUND_SEC, GRAIN_STORE_FRAMES, 48000)).toBe(0)
    expect(soundSeconds(16 / 48000, GRAIN_SOUND_SEC, GRAIN_STORE_FRAMES, 48000)).toBeGreaterThan(0)
  })
})

/**
 * The Tone mark a display drew: the corners of its curve from its lowest
 * frequency to its highest, and the heights of its top and its foot.
 */
function toneMarkOf(drawn: RecordingContext): {
  curve: [number, number][]
  top: number
  foot: number
} {
  // It is closed along its foot: the first and the last corner stand there, and nothing of it lies lower.
  const marks = drawnPaths(drawn).filter(
    ({ kind, colour, points }) =>
      kind === 'stroke' &&
      colour === ink &&
      points.length === 17 &&
      points[0][1] === points[16][1] &&
      points.every(([, y]) => y <= points[0][1]),
  )
  expect(marks).toHaveLength(1)
  const [{ points }] = marks
  const curve = points.slice(1, -1)
  return { curve, top: Math.min(...curve.map(([, y]) => y)), foot: points[0][1] }
}

/** How far down a Tone mark stands at `hz`, as a share of its height. */
function toneMarkAt(drawn: RecordingContext, hz: number): number {
  const { curve, top, foot } = toneMarkOf(drawn)
  const along =
    (Math.log(hz / TONE_MARK_LOW_HZ) / Math.log(TONE_MARK_HIGH_HZ / TONE_MARK_LOW_HZ)) *
    (curve.length - 1)
  expect(along).toBeCloseTo(Math.round(along), 6)
  return (curve[Math.round(along)][1] - top) / (foot - top)
}

describe('the sampler’s figures', () => {
  it('make the region `Sampler::update_region` makes', () => {
    // Start and End in either order.
    expect(samplerRegion(0.85, 0.15, 1, 0, false)).toMatchObject({ start: 0.15, end: 0.85 })
    // The device, the built-in sound, Crossfade 50 ms: 0.01668 of the sound.
    expect(samplerRegion(0.15, 0.85, 1, 50, false).fade).toBeCloseTo(0.01668, 5)
    // Only a Forward loop has one, and it is half the region at most.
    expect(samplerRegion(0.15, 0.85, 0, 50, false).fade).toBe(0)
    expect(samplerRegion(0.15, 0.85, 2, 50, false).fade).toBe(0)
    expect(samplerRegion(0.4, 0.5, 1, 500, false).fade).toBeCloseTo(0.05, 6)
    // The device, Start 0 with 300 ms: no lead-in, so the loop starts 0.10008 in; End 1 in reverse likewise.
    expect(samplerRegion(0, 0.4, 1, 300, false).loopStart).toBeCloseTo(0.10008, 5)
    expect(samplerRegion(0.2, 1, 1, 300, true).loopEnd).toBeCloseTo(0.89992, 5)
    expect(samplerRegion(0.15, 0.85, 1, 50, false)).toMatchObject({
      loopStart: 0.15,
      loopEnd: 0.85,
    })
  })

  it('run a head at the pace of the key, Tune and Fine', () => {
    expect(samplerSpeed(MIDDLE_C, 0, 0)).toBeCloseTo(1 / SAMPLER_SOUND_SEC, 9)
    expect(samplerSpeed(2 * MIDDLE_C, 0, 0)).toBeCloseTo(2 / SAMPLER_SOUND_SEC, 9)
    expect(samplerSpeed(MIDDLE_C, -12, 0)).toBeCloseTo(0.5 / SAMPLER_SOUND_SEC, 9)
    expect(samplerSpeed(MIDDLE_C, 0, 100)).toBeCloseTo(samplerSpeed(MIDDLE_C, 1, 0), 9)
  })

  it('put a head where `Sampler::play` has its own', () => {
    const at = (
      [start, end, loop, crossfade, reverse]: [number, number, number, number, boolean],
      hz: number,
      tune: number,
      seconds: number,
    ) =>
      samplerHead(
        samplerRegion(start, end, loop, crossfade, reverse),
        seconds * samplerSpeed(hz, tune, 0),
      )
    // The device, a Forward loop from 0.15 to 0.85: 0.35015 after 0.6 s, 0.28396 after 2.5 s (it has jumped once).
    expect(at([0.15, 0.85, 1, 50, false], MIDDLE_C, 0, 0.6).at).toBeCloseTo(0.35015, 4)
    expect(at([0.15, 0.85, 1, 50, false], MIDDLE_C, 0, 2.5).at).toBeCloseTo(0.28396, 4)
    // The device, the G above an octave up: 0.54909 after 2.5 s.
    expect(at([0.15, 0.85, 1, 50, false], 392, 12, 2.5).at).toBeCloseTo(0.54909, 3)
    // The device, where the loop's start was moved in: 0.36724 after 2 s.
    expect(at([0, 0.4, 1, 300, false], MIDDLE_C, 0, 2).at).toBeCloseTo(0.36724, 4)
    // The device, the same in reverse, going down: 0.53238 after 3.5 s.
    const back = at([0.2, 1, 1, 300, true], MIDDLE_C, 0, 3.5)
    expect(back.at).toBeCloseTo(0.53238, 4)
    expect(back.forwards).toBe(false)
    // The device, Ping-pong from 0.3 to 0.7: 0.46618 on its way back after 1.9 s.
    const turned = at([0.3, 0.7, 2, 0, false], MIDDLE_C, 0, 1.9)
    expect(turned.at).toBeCloseTo(0.46618, 4)
    expect(turned.forwards).toBe(false)
    // The device, the same in reverse an octave down: 0.41707 going up after 3.1 s.
    const up = at([0.3, 0.7, 2, 0, true], MIDDLE_C, -12, 3.1)
    expect(up.at).toBeCloseTo(0.41707, 4)
    expect(up.forwards).toBe(true)
    // The device, the whole sound once in reverse: 0.66641 after a second, and done when it is through.
    const once = at([0, 1, 0, 0, true], MIDDLE_C, 0, 1)
    expect(once.at).toBeCloseTo(0.66641, 4)
    expect(once.done).toBe(false)
    expect(at([0, 1, 0, 0, true], MIDDLE_C, 0, SAMPLER_SOUND_SEC + 0.01).done).toBe(true)
    expect(at([0.15, 0.85, 1, 0, false], MIDDLE_C, 0, 60).done).toBe(false)
  })

  it('do the same on a sound of another length, where a second is another share of it', () => {
    // The device, handed two seconds of sound (at 44.1 kHz, the device at 48 kHz): Crossfade 50 ms
    // is 0.025 of it, and with Start 0 and 300 ms the loop starts 0.15 in.
    expect(samplerRegion(0.15, 0.85, 1, 50, false, 2).fade).toBeCloseTo(0.025, 6)
    expect(samplerRegion(0, 0.4, 1, 300, false, 2).loopStart).toBeCloseTo(0.15, 6)
    expect(samplerRegion(0.2, 1, 1, 300, true, 2).loopEnd).toBeCloseTo(0.85, 6)
    expect(samplerSpeed(MIDDLE_C, 0, 0, 2)).toBeCloseTo(0.5, 9)
    const at = (
      [start, end, loop, crossfade, reverse]: [number, number, number, number, boolean],
      tune: number,
      seconds: number,
      sound: number,
    ) =>
      samplerHead(
        samplerRegion(start, end, loop, crossfade, reverse, sound),
        seconds * samplerSpeed(MIDDLE_C, tune, 0, sound),
      )
    // The device on those two seconds: 0.45 after 0.6 s, 0.7 after 2.5 s (it has jumped once).
    expect(at([0.15, 0.85, 1, 50, false], 0, 0.6, 2).at).toBeCloseTo(0.45, 4)
    expect(at([0.15, 0.85, 1, 50, false], 0, 2.5, 2).at).toBeCloseTo(0.7, 4)
    // The device, the same in reverse where the loop's end was moved in: 0.65 going down after 2 s.
    const back = at([0.2, 1, 1, 300, true], 0, 2, 2)
    expect(back.at).toBeCloseTo(0.65, 4)
    expect(back.forwards).toBe(false)
    // The device, ten seconds of sound an octave up: 0.25 after 4 s, on its second pass.
    expect(at([0.15, 0.85, 1, 500, false], 12, 4, 10).at).toBeCloseTo(0.25, 4)
    // The device, handed more than it holds, plays the 31.25 s it kept: 0.31 after 5 s.
    const kept = soundSeconds(2000000 / 48000, SAMPLER_SOUND_SEC, SAMPLER_STORE_FRAMES, 48000)
    expect(at([0.15, 0.85, 1, 500, false], 0, 5, kept).at).toBeCloseTo(0.31, 4)
    // The device, that sound once through two octaves up: 0.96 after 7.5 s, done before 8 s.
    expect(at([0, 1, 0, 0, false], 24, 7.5, kept).at).toBeCloseTo(0.96, 4)
    expect(at([0, 1, 0, 0, false], 24, 7.5, kept).done).toBe(false)
    expect(at([0, 1, 0, 0, false], 24, 8, kept).done).toBe(true)
  })

  it('make a soft key as loud as Velocity lets it be', () => {
    expect(samplerVelocity(0.2, 0)).toBe(1)
    expect(samplerVelocity(0.2, 1)).toBeCloseTo(0.2, 9)
    expect(samplerVelocity(0.5, 0.6)).toBeCloseTo(0.7, 9)
  })
})

describe('the sampler’s display', () => {
  const { display } = SAMPLE_INSTRUMENT_FACES.sampler
  const draw = (
    values: Record<string, number>,
    notes: DisplayNote[],
    sampleSeconds: number | null = null,
  ) => played(display, 'sampler', values, notes, sampleSeconds)
  /** The band the sound lies along, from where the two handles stand at its ends. */
  const [first, last] = display.handles?.(
    viewOf(display, paramsOf('sampler'), { values: { start: 0, end: 1 } }),
  ) ?? [{ x: 0 }, { x: 1 }]
  const xOf = (share: number): number => first.x + share * (last.x - first.x)

  it('lights nothing at rest, and a head for each note that sounds', () => {
    expect(lit(drawDisplay(display, paramsOf('sampler')))).toHaveLength(0)
    expect(lit(draw({}, []))).toHaveLength(0)
    expect(lines(draw({}, [note(MIDDLE_C, 0.3), note(392, 0.3)]))).toHaveLength(2)
  })

  it('stands a head where the device has read to', () => {
    const head = (values: Record<string, number>, hz: number, age: number): number =>
      lines(draw(values, [note(hz, age)]))[0].points[0][0]
    expect(head({}, MIDDLE_C, 0.6)).toBeCloseTo(xOf(0.35015), 1)
    // It has jumped back once; an octave up it is twice as far along.
    expect(head({}, MIDDLE_C, 2.5)).toBeCloseTo(xOf(0.28396), 1)
    expect(head({ tune: 12 }, MIDDLE_C, 0.6)).toBeCloseTo(xOf(0.15 + 2 * 0.20015), 1)
    // In reverse it starts from End.
    expect(head({ reverse: 1 }, MIDDLE_C, 0.6)).toBeCloseTo(xOf(0.85 - 0.20015), 1)
  })

  it('stands a head where the device has read to on a sound it was handed', () => {
    const head = (values: Record<string, number>, age: number, sampleSeconds: number): number =>
      lines(draw(values, [note(MIDDLE_C, age)], sampleSeconds))[0].points[0][0]
    // The device on two seconds of sound: 0.45 after 0.6 s, 0.7 after 2.5 s.
    expect(head({}, 0.6, 2)).toBeCloseTo(xOf(0.45), 3)
    expect(head({}, 2.5, 2)).toBeCloseTo(xOf(0.7), 3)
    // The device on ten seconds an octave up: 0.25 after 4 s.
    expect(head({ tune: 12, crossfade: 500 }, 4, 10)).toBeCloseTo(xOf(0.25), 3)
    // The device, handed more than it holds, plays the 31.25 s it kept: 0.31 after 5 s.
    expect(head({ crossfade: 500 }, 5, 2000000 / 48000)).toBeCloseTo(xOf(0.31), 3)
    expect(head({ crossfade: 500 }, 5, 600)).toBeCloseTo(xOf(0.31), 3)
  })

  it('ends a note played once where the sound it was handed ends', () => {
    const once = { loop: 0, start: 0, end: 1, tune: 24 }
    // The device on the 31.25 s it kept, two octaves up: sounding after 7.5 s, done before 8 s.
    expect(lines(draw(once, [note(MIDDLE_C, 7.5)], 2000000 / 48000))).toHaveLength(1)
    expect(lines(draw(once, [note(MIDDLE_C, 8)], 2000000 / 48000))).toHaveLength(0)
    // The sound it is built with is long over by then, and two seconds of sound at half a second.
    expect(lines(draw(once, [note(MIDDLE_C, 1)]))).toHaveLength(0)
    expect(lines(draw(once, [note(MIDDLE_C, 0.4)], 2))).toHaveLength(1)
    expect(lines(draw(once, [note(MIDDLE_C, 0.6)], 2))).toHaveLength(0)
  })

  it('lights no head when the sound it was handed is empty, as no key then plays', () => {
    expect(lit(draw({}, [note(MIDDLE_C, 0.3), note(392, 0.3)], 0))).toHaveLength(0)
    expect(lit(draw({}, [note(MIDDLE_C, 0.3)], 8 / 48000))).toHaveLength(0)
    expect(draw({}, [], 0).marks()).toBeGreaterThan(0)
  })

  it('draws the crossfade as long as it is of the sound, and only on a Forward loop', () => {
    const picture = (values: Record<string, number>, sampleSeconds: number | null = null) =>
      draw(values, [], sampleSeconds).print()
    // `Sampler::update_region`: Off and Ping-pong have none, whatever the knob says.
    for (const loop of [0, 2]) {
      expect(picture({ loop, crossfade: 500 })).toBe(picture({ loop, crossfade: 0 }))
      expect(picture({ loop, crossfade: 500, reverse: 1 })).toBe(
        picture({ loop, crossfade: 0, reverse: 1 }),
      )
    }
    expect(picture({ loop: 1, crossfade: 500 })).not.toBe(picture({ loop: 1, crossfade: 0 }))
    expect(picture({ loop: 1, crossfade: 500, reverse: 1 })).not.toBe(
      picture({ loop: 1, crossfade: 0, reverse: 1 }),
    )
    // The wedge that leads into the loop's start: from Start less the crossfade up to Start.
    const wedge = (
      values: Record<string, number>,
      sampleSeconds: number | null = null,
    ): [number, number][] =>
      drawnPaths(draw({ loop: 1, ...values }, [], sampleSeconds)).find(
        (path) => path.kind === 'fill' && path.colour === ink && path.points.length === 3,
      )?.points ?? []
    const built = wedge({ crossfade: 300 })
    expect(built[0][0]).toBeCloseTo(xOf(0.15 - 0.3 / SAMPLER_SOUND_SEC), 3)
    expect(built[1][0]).toBeCloseTo(xOf(0.15), 3)
    // On two seconds of sound the same 300 ms is 0.15 of it, which is all the lead-in there is.
    const handed = wedge({ crossfade: 300 }, 2)
    expect(handed[0][0]).toBeCloseTo(xOf(0), 3)
    expect(handed[1][0]).toBeCloseTo(xOf(0.15), 3)
  })

  it('draws Tone as the low-pass it is: 3 dB down at the knob, and falling above it', () => {
    const down = (tone: number, hz: number): number => toneMarkAt(draw({ tone }, []), hz)
    // The mark spans 50 Hz to 20 kHz in fourteen steps, so 1 kHz is a corner of it.
    expect(down(1000, 1000)).toBeCloseTo(3.0103 / -TONE_MARK_FLOOR_DB, 2)
    expect(down(18000, 1000)).toBeCloseTo(0, 2)
    // Tone 200 Hz leaves 28 dB less of 1 kHz, which is under the mark's foot.
    expect(down(200, 1000)).toBe(1)
    const stepOn = 1000 * Math.pow(TONE_MARK_HIGH_HZ / TONE_MARK_LOW_HZ, 1 / 14)
    expect(down(1000, stepOn)).toBeCloseTo(
      (-20 * Math.log10(toneGain(stepOn, 1000))) / -TONE_MARK_FLOOR_DB,
      2,
    )
    expect(down(1000, stepOn)).toBeGreaterThan(down(1000, 1000) + 0.1)
    // It is drawn at every size, between the words or in place of the figure.
    for (const width of [128, 204, 408]) {
      toneMarkOf(drawDisplay(display, paramsOf('sampler'), { width }))
    }
  })

  it('lets a head rise with the attack and sink with the release, and puts it out', () => {
    const height = (values: Record<string, number>, played: DisplayNote): number =>
      tall(lines(draw(values, [played]))[0])
    const full = height({ attack: 0.001 }, note(MIDDLE_C, 0.4))
    expect(height({ attack: 2 }, note(MIDDLE_C, 0.4))).toBeLessThan(full * 0.8)
    expect(height({ release: 2 }, note(MIDDLE_C, 2, 1))).toBeLessThan(full * 0.5)
    // 60 dB down is out: a release time after the key was let go.
    expect(lines(draw({ release: 2 }, [note(MIDDLE_C, 3, 1.9)]))).toHaveLength(1)
    expect(lines(draw({ release: 2 }, [note(MIDDLE_C, 3.2, 2.1)]))).toHaveLength(0)
  })

  it('ends a note where a region played once ends, and not one that loops', () => {
    const through = (0.85 - 0.15) * SAMPLER_SOUND_SEC
    expect(lines(draw({ loop: 0 }, [note(MIDDLE_C, through - 0.1)]))).toHaveLength(1)
    expect(lines(draw({ loop: 0 }, [note(MIDDLE_C, through + 0.1)]))).toHaveLength(0)
    expect(lines(draw({ loop: 1 }, [note(MIDDLE_C, through + 0.1)]))).toHaveLength(1)
    expect(lines(draw({ loop: 2 }, [note(MIDDLE_C, through + 0.1)]))).toHaveLength(1)
  })

  it('makes a soft note shorter only as far as Velocity says', () => {
    const height = (velocity: number, gain: number): number =>
      tall(lines(draw({ velocity, attack: 0.001 }, [note(MIDDLE_C, 0.4, null, gain)]))[0])
    expect(height(0, 0.2)).toBeCloseTo(height(0, 1), 5)
    expect(height(1, 0.2)).toBeLessThan(height(1, 1) * 0.5)
  })

  it('stands its handles on the two edges, and a drag sets them', () => {
    const settings: Record<string, number>[] = [{}, { start: 0.6, end: 0.2 }, { start: 0, end: 1 }]
    for (const values of settings) {
      const view = viewOf(display, paramsOf('sampler'), { values })
      const [start, end] = display.handles?.(view) ?? []
      expect(start.x).toBeCloseTo(xOf(view.value('start')), 5)
      expect(end.x).toBeCloseTo(xOf(view.value('end')), 5)
      expect(start.drag(start.x, start.y).start).toBeCloseTo(view.value('start'), 5)
      expect(end.drag(end.x, end.y).end).toBeCloseTo(view.value('end'), 5)
      expect(start.drag(xOf(0.4), 0).start).toBeCloseTo(0.4, 5)
    }
  })
})

describe('the zone sampler’s figures', () => {
  it('make a soft key as loud as Velocity lets it be', () => {
    expect(zoneVelocity(0.25, 0)).toBe(1)
    expect(zoneVelocity(0.25, 1)).toBeCloseTo(0.25, 9)
    expect(zoneVelocity(0.5, 0.7)).toBeCloseTo(0.65, 9)
  })

  it('take the top off as a low-pass of the second order does', () => {
    // `kit::Svf` at a Q of 0.7071: 3 dB down at its corner, 12 dB an octave above it.
    expect(toneGain(1000, 1000)).toBeCloseTo(Math.SQRT1_2, 9)
    expect(toneGain(10, 1000)).toBeCloseTo(1, 6)
    expect(toneGain(4000, 1000)).toBeCloseTo(1 / Math.sqrt(257), 9)
    expect(20 * Math.log10(toneGain(16000, 1000) / toneGain(8000, 1000))).toBeCloseTo(-12, 1)
  })

  it('read the filter at the pitch a key sounds at, Tune and all', () => {
    // The A at 440 Hz through a Tone of 440 Hz is 3 dB down; tuned an octave down it is under the corner.
    expect(zoneLevel(69, 1, 0.7, 0, 440)).toBeCloseTo(Math.SQRT1_2, 6)
    expect(zoneLevel(69, 1, 0.7, -12, 440)).toBeCloseTo(1 / Math.sqrt(1 + 1 / 16), 6)
    expect(zoneLevel(69, 0.5, 1, 0, 440)).toBeCloseTo(0.5 * Math.SQRT1_2, 6)
  })
})

describe('the zone sampler’s display', () => {
  const { display } = SAMPLE_INSTRUMENT_FACES['zone-sampler']
  const draw = (values: Record<string, number>, notes: DisplayNote[]) =>
    played(display, 'zone-sampler', values, notes)
  const A4 = 440
  /** A lit note's dot: the largest in the accent. */
  const dotOf = (values: Record<string, number>, sounding: DisplayNote) =>
    dots(draw(values, [sounding]), accent).sort((a, b) => b.r - a.r)[0]

  it('lights nothing at rest, and a dot on a stem for each note that sounds', () => {
    expect(lit(drawDisplay(display, paramsOf('zone-sampler')))).toHaveLength(0)
    expect(lit(draw({}, []))).toHaveLength(0)
    const chord = draw({}, [note(220, 0.2), note(A4, 0.2), note(880, 0.2)])
    expect(lines(chord)).toHaveLength(3)
    expect(dots(chord, accent)).toHaveLength(3)
  })

  it('stands the dot over the pitch the key sounds at and as high as it was played hard', () => {
    const slot = (dotOf({}, note(880, 0.2)).x - dotOf({}, note(A4, 0.2)).x) / 12
    expect(slot).toBeGreaterThan(1)
    const plain = dotOf({}, note(A4, 0.2))
    expect(dotOf({ tune: 7 }, note(A4, 0.2)).x).toBeCloseTo(plain.x + 7 * slot, 5)
    expect(dotOf({ tune: -12, fine: 50 }, note(A4, 0.2)).x).toBeCloseTo(plain.x - 11.5 * slot, 5)
    expect(dotOf({}, note(A4, 0.2, null, 0.3)).y).toBeGreaterThan(plain.y + 10)
    // The stem still starts at the key that was struck.
    const stem = (tune: number) => lines(draw({ tune }, [note(A4, 0.2)]))[0].points[0][0]
    expect(stem(7)).toBeCloseTo(stem(0), 5)
  })

  it('makes the dot as large as the note is loud: its envelope, its touch, the filter', () => {
    const full = dotOf({ attack: 0.001 }, note(A4, 0.5)).r
    expect(dotOf({ attack: 4 }, note(A4, 0.5)).r).toBeLessThan(full)
    expect(dotOf({ attack: 0.001, velocity: 1 }, note(A4, 0.5, null, 0.2)).r).toBeLessThan(full)
    expect(dotOf({ attack: 0.001, velocity: 0 }, note(A4, 0.5, null, 0.2)).r).toBeCloseTo(full, 5)
    expect(dotOf({ attack: 0.001, tone: 200 }, note(A4, 0.5)).r).toBeLessThan(full)
    // Tuned two octaves down the same key is under the filter again.
    expect(dotOf({ attack: 0.001, tone: 200, tune: -24 }, note(A4, 0.5)).r).toBeGreaterThan(
      dotOf({ attack: 0.001, tone: 200 }, note(A4, 0.5)).r,
    )
  })

  it('puts a note out a release time after its key is let go', () => {
    expect(lines(draw({ release: 1 }, [note(A4, 2, 0.9)]))).toHaveLength(1)
    expect(lines(draw({ release: 1 }, [note(A4, 2, 1.1)]))).toHaveLength(0)
    expect(lines(draw({ release: 4 }, [note(A4, 2, 1.1)]))).toHaveLength(1)
  })

  it('thins the soft rows of the map with Velocity and the high keys with Tone', () => {
    const map = (values: Record<string, number>) =>
      dots(drawDisplay(display, paramsOf('zone-sampler'), { values }), ink)
    const even = map({ velocity: 0, tone: 18000 })
    // The first column, from the softest touch to the hardest: all one size.
    expect(even[0].r).toBeCloseTo(even[7].r, 2)
    const touched = map({ velocity: 1, tone: 18000 })
    expect(touched[0].r).toBeLessThan(touched[7].r * 0.5)
    expect(touched[7].r).toBeCloseTo(even[7].r, 2)
    // The last column of the map, hardest touch, under a low Tone.
    const dark = map({ velocity: 0, tone: 200 })
    expect(dark[7].r).toBeCloseTo(even[7].r, 1)
    expect(dark[8 * 29 - 1].r).toBeLessThan(even[8 * 29 - 1].r * 0.3)
  })
})

describe('the grain synth’s figures', () => {
  it('plan the grains as `GrainSynth::plan_grains` does', () => {
    expect(grainDensity(6, 1)).toBe(6)
    expect(grainDensity(0.2, 1)).toBe(1)
    // The device, eight keys down at Density 16: 8 each, of a budget of 64.
    expect(grainDensity(16, 8)).toBe(8)
    expect(grainDensity(16, 0)).toBe(16)
    // The device, Shape 0: an edge of 0.5, a bell. Shape 1: 4 % fades.
    expect(grainEdge(0)).toBe(0.5)
    expect(grainEdge(1)).toBeCloseTo(0.04, 9)
    expect(grainsAtStart(6)).toBe(6)
    expect(grainsAtStart(1)).toBe(1)
    expect(grainsAtStart(1.5)).toBe(2)
  })

  it('open and close a grain as `GrainSynth::render` does', () => {
    expect(grainWindow(0, 0.5)).toBe(0)
    expect(grainWindow(0.25, 0.5)).toBeCloseTo(0.5, 9)
    expect(grainWindow(0.5, 0.5)).toBe(1)
    expect(grainWindow(0.75, 0.5)).toBeCloseTo(0.5, 9)
    // A flat top: open in full from the end of one fade to the start of the other.
    expect(grainWindow(0.04, 0.04)).toBe(1)
    expect(grainWindow(0.9, 0.04)).toBe(1)
    expect(grainWindow(0.02, 0.04)).toBeCloseTo(0.5, 9)
  })

  it('scatter, place and weigh a grain as `GrainSynth::spawn` and `note_on` do', () => {
    expect(grainSpray(1)).toBe(0.5)
    expect(grainSpray(0.2)).toBeCloseTo(0.02, 9)
    expect(grainVelocity(0)).toBe(0.35)
    expect(grainVelocity(1)).toBe(1)

    const plain: GrainSettings = {
      sound: GRAIN_SOUND_SEC,
      position: 0.2,
      scan: 0,
      size: 0.28,
      spray: 0,
      detune: 0,
      octaves: 0,
      reverse: 0,
      spread: 0,
    }
    const grain: Grain = { start: 0, span: 0, reverse: false, pan: 0, cents: 0 }
    const many = (settings: GrainSettings, centre = 0.2, ratio = 1): Grain[] =>
      Array.from({ length: 200 }, (_, index) => ({
        ...grainSpawn(grain, 7, index, centre, ratio, settings),
      }))
    // No spray, no spread, no octaves, no reverse: every grain the same stretch at the reading point.
    for (const one of many(plain)) {
      expect(one.start).toBeCloseTo(0.2, 9)
      expect(one.span).toBeCloseTo(0.28 / GRAIN_SOUND_SEC, 9)
      expect(one.reverse).toBe(false)
      expect(one.pan).toBeCloseTo(0, 9)
      expect(one.cents).toBe(0)
    }
    // An octave up the key reads twice the stretch.
    expect(many(plain, 0.2, 2)[0].span).toBeCloseTo(0.56 / GRAIN_SOUND_SEC, 9)
    // The device, handed two seconds of sound: a grain of 280 ms reads 0.14 of it.
    expect(many({ ...plain, sound: 2 })[0].span).toBeCloseTo(0.14, 9)
    // The device at Detune 100: grains from 97.8 cents flat to 96.2 sharp. Each reads the
    // stretch its pitch makes of its Size.
    const thrown = many({ ...plain, detune: 100 })
    const cents = thrown.map((one) => one.cents)
    expect(Math.min(...cents)).toBeGreaterThanOrEqual(-100)
    expect(Math.min(...cents)).toBeLessThan(-90)
    expect(Math.max(...cents)).toBeLessThanOrEqual(100)
    expect(Math.max(...cents)).toBeGreaterThan(90)
    expect(cents.filter((one) => one > 0).length).toBeGreaterThan(70)
    expect(cents.filter((one) => one > 0).length).toBeLessThan(130)
    for (const one of thrown) {
      expect(one.span).toBeCloseTo((0.28 * Math.pow(2, one.cents / 1200)) / GRAIN_SOUND_SEC, 9)
    }
    // A fifth of the knob throws a fifth as far.
    expect(
      Math.max(...many({ ...plain, detune: 20 }).map((one) => Math.abs(one.cents))),
    ).toBeLessThanOrEqual(20)
    // Spray 1: from all over the sound, half of it to either side at most.
    const sprayed = many({ ...plain, spray: 1 }, 0.5).map((one) => one.start)
    expect(Math.min(...sprayed)).toBeLessThan(0.1)
    expect(Math.max(...sprayed)).toBeGreaterThan(0.8)
    // Octaves 1: no grain stays at the played pitch, and they split evenly up and down.
    const spans = many({ ...plain, octaves: 1 }).map((one) => one.span * GRAIN_SOUND_SEC)
    expect(
      spans.every((span) => Math.abs(span - 0.56) < 1e-9 || Math.abs(span - 0.14) < 1e-9),
    ).toBe(true)
    const up = spans.filter((span) => span > 0.3).length
    expect(up).toBeGreaterThan(70)
    expect(up).toBeLessThan(130)
    // Reverse: all of them at 1, about that share of them between.
    expect(many({ ...plain, reverse: 1 }).every((one) => one.reverse)).toBe(true)
    const some = many({ ...plain, reverse: 0.3 }).filter((one) => one.reverse).length
    expect(some).toBeGreaterThan(35)
    expect(some).toBeLessThan(85)
    // Spread: between the sides, no further than the knob.
    const pans = many({ ...plain, spread: 0.5 }).map((one) => one.pan)
    expect(Math.min(...pans)).toBeGreaterThanOrEqual(-0.5)
    expect(Math.max(...pans)).toBeLessThanOrEqual(0.5)
    expect(Math.max(...pans) - Math.min(...pans)).toBeGreaterThan(0.8)
    // A grain that would run off the end is pulled back so its whole read fits.
    for (const one of many({ ...plain, size: 1, spray: 0.3 }, 0.95)) {
      expect(one.start + one.span).toBeLessThanOrEqual(1 + 1e-9)
    }
  })
})

describe('the grain synth’s display', () => {
  const { display } = SAMPLE_INSTRUMENT_FACES['grain-synth']
  const draw = (
    values: Record<string, number>,
    notes: DisplayNote[],
    sampleSeconds: number | null = null,
  ) => played(display, 'grain-synth', values, notes, sampleSeconds)
  const view = (values: Record<string, number>) =>
    viewOf(display, paramsOf('grain-synth'), { values })
  const left = display.handles?.(view({ position: 0 }))[0].x ?? 0
  const wide = (display.handles?.(view({ position: 1 }))[0].x ?? 1) - left
  /** The grains a note has open: the stretches they read. */
  const grains = (
    values: Record<string, number>,
    notes: DisplayNote[],
    sampleSeconds: number | null = null,
  ) => shapes(draw(values, notes, sampleSeconds), 'fill')
  /** How high the heads of a colour stand: the point of each. */
  const heads = (drawn: RecordingContext, colour: string): number[] =>
    drawnPaths(drawn)
      .filter((path) => path.kind === 'fill' && path.colour === colour && path.points.length === 3)
      .map((path) => path.points[0][1])
  /** The stems that carry heads off their lines: upright bars a pixel wide. */
  const stems = (drawn: RecordingContext): number[] =>
    drawn.calls
      .filter((call) => call.name === 'fillRect' && call.args[2] === 1)
      .map((call) => call.args[3] as number)

  it('lights nothing at rest, and as many grains on a note as Density has overlap', () => {
    expect(lit(drawDisplay(display, paramsOf('grain-synth')))).toHaveLength(0)
    expect(lit(draw({}, []))).toHaveLength(0)
    expect(grains({ density: 6 }, [note(MIDDLE_C, 0.33)])).toHaveLength(6)
    expect(grains({ density: 6 }, [note(MIDDLE_C, 4.7)])).toHaveLength(6)
    expect(grains({ density: 12 }, [note(MIDDLE_C, 0.33)])).toHaveLength(12)
    // A key starts with a full set, so they are all there as soon as its attack lets them be heard.
    expect(grains({ density: 6, attack: 0.005 }, [note(MIDDLE_C, 0.004)])).toHaveLength(6)
    expect(grains({ density: 6 }, [note(MIDDLE_C, 0)])).toHaveLength(0)
  })

  it('shares the budget of 64 grains between the keys that sound', () => {
    const eight = Array.from({ length: 8 }, (_, index) => ({
      ...note(MIDDLE_C * (1 + index / 8), 0.33),
      id: index,
    }))
    expect(grains({ density: 16 }, eight.slice(0, 2))).toHaveLength(32)
    expect(grains({ density: 16 }, eight)).toHaveLength(64)
  })

  it('draws a grain over the stretch it reads: longer for a longer Size and a higher key', () => {
    const longest = (
      values: Record<string, number>,
      hz: number,
      sampleSeconds: number | null = null,
    ): number => {
      const spans = grains(
        { octaves: 0, detune: 0, ...values },
        [note(hz, 0.33)],
        sampleSeconds,
      ).map((grain) => right(grain) - Math.min(...grain.points.map(([x]) => x)))
      return Math.max(...spans)
    }
    expect(longest({ size: 280 }, MIDDLE_C)).toBeCloseTo((0.28 / GRAIN_SOUND_SEC) * wide, 3)
    expect(longest({ size: 900 }, MIDDLE_C)).toBeCloseTo((0.9 / GRAIN_SOUND_SEC) * wide, 3)
    expect(longest({ size: 280 }, 2 * MIDDLE_C)).toBeCloseTo((0.56 / GRAIN_SOUND_SEC) * wide, 3)
    // The device, handed two seconds of sound: a grain of 280 ms reads 0.14 of it.
    expect(longest({ size: 280 }, MIDDLE_C, 2)).toBeCloseTo(0.14 * wide, 3)
    // The device, handed more than it holds, reads the 21.8453 s it kept: 0.01282 of it, which
    // is too short a stretch to draw; the longest grain there is reads 2 s of it.
    expect(longest({ size: 2000 }, MIDDLE_C, 2000000 / 48000)).toBeCloseTo(
      ((0.01282 * 2000) / 280) * wide,
      1,
    )
    expect(longest({ size: 2000 }, MIDDLE_C, 600)).toBeCloseTo((2 / 21.8453) * wide, 2)
    // Detune makes a grain a little longer or shorter with its pitch: under a semitone, under 6 %.
    const detuned = longest({ size: 280, detune: 100 }, MIDDLE_C)
    expect(detuned).toBeGreaterThan((0.28 / GRAIN_SOUND_SEC) * wide * 1.01)
    expect(detuned).toBeLessThan((0.28 / GRAIN_SOUND_SEC) * wide * 1.06)
  })

  it('stands a grain’s head off its line as far as Detune threw it, and on it without', () => {
    // Frozen, so that no arrow of Scan is among the heads.
    const still = { spread: 0, octaves: 0, density: 16, scan: 0 }
    const spreadOf = (ys: number[]): number => Math.max(...ys) - Math.min(...ys)
    // With no Spread every grain lies on the middle line, and so does every head.
    const plain = draw({ ...still, detune: 0 }, [note(MIDDLE_C, 0.33)])
    expect(heads(plain, accent).length).toBeGreaterThan(8)
    expect(spreadOf(heads(plain, accent))).toBeCloseTo(0, 6)
    expect(spreadOf(heads(plain, ink))).toBeCloseTo(0, 6)
    expect(stems(plain)).toHaveLength(0)
    // At the top of the knob they scatter to either side, 5 px for a semitone.
    const blurred = draw({ ...still, detune: 100 }, [note(MIDDLE_C, 0.33)])
    expect(spreadOf(heads(blurred, accent))).toBeGreaterThan(6)
    expect(spreadOf(heads(blurred, accent))).toBeLessThanOrEqual(10)
    expect(spreadOf(heads(blurred, ink))).toBeGreaterThan(4)
    expect(stems(blurred).length).toBeGreaterThan(8)
    expect(Math.max(...stems(blurred))).toBeLessThanOrEqual(5)
    // A few cents show: the way out goes by the root, so 4 cents is a pixel.
    const thick = draw({ ...still, detune: 4 }, [note(MIDDLE_C, 0.33)])
    expect(spreadOf(heads(thick, accent))).toBeGreaterThan(1)
    expect(spreadOf(heads(thick, accent))).toBeLessThanOrEqual(2)
    // The grains themselves stay where Spread puts them.
    const axes = shapes(blurred, 'fill').map((grain) => grain.points[0][1])
    expect(spreadOf(axes)).toBeCloseTo(0, 6)
  })

  it('carries a note’s reading point along at Scan times real time, and round the end', () => {
    const mark = (values: Record<string, number>, age: number): number =>
      lines(draw({ release: 12, ...values }, [note(MIDDLE_C, age)]))[0].points[0][0]
    expect(mark({ position: 0.2, scan: 0 }, 3)).toBeCloseTo(left + 0.2 * wide, 3)
    // The device, Scan 0.5: 0.25012 of the built-in sound in two seconds.
    expect(mark({ position: 0.2, scan: 0.5 }, 2)).toBeCloseTo(left + 0.45012 * wide, 1)
    expect(mark({ position: 0.2, scan: -0.5 }, 2)).toBeCloseTo(left + 0.94988 * wide, 1)
    expect(mark({ position: 0.9, scan: 2 }, 1)).toBeCloseTo(
      left + (0.9 + 2 / GRAIN_SOUND_SEC - 1) * wide,
      3,
    )
  })

  it('carries it as far as a second is of the sound it was handed', () => {
    const mark = (age: number, sampleSeconds: number): number =>
      lines(
        draw({ release: 12, position: 0.2, scan: 0.5 }, [note(MIDDLE_C, age)], sampleSeconds),
      )[0].points[0][0]
    // The device, handed two seconds of sound, Scan 0.5: 0.25 of it in a second.
    expect(mark(1, 2)).toBeCloseTo(left + 0.45 * wide, 3)
    // The device, handed more than it holds: 0.02289 of the 21.8453 s it kept in a second.
    expect(mark(1, 2000000 / 48000)).toBeCloseTo(left + 0.22289 * wide, 2)
    expect(mark(1, 600)).toBeCloseTo(left + 0.22289 * wide, 2)
    // The arrow under the ruler is how far Scan carries it in a second: twice as far on half the sound.
    const arrow = (sampleSeconds: number | null): number => {
      const [path] = drawnPaths(draw({ scan: 0.5 }, [], sampleSeconds)).filter(
        ({ kind, colour, width }) => kind === 'stroke' && colour === ink && width === 1.25,
      )
      return path.points[1][0] - path.points[0][0]
    }
    expect(arrow(null)).toBeCloseTo((0.5 / GRAIN_SOUND_SEC) * wide, 3)
    expect(arrow(2)).toBeCloseTo(0.25 * wide, 3)
  })

  it('lights nothing when the sound it was handed is empty, as no grain then starts', () => {
    expect(lit(draw({}, [note(MIDDLE_C, 0.33), note(392, 0.33)], 0))).toHaveLength(0)
    expect(draw({}, [], 0).marks()).toBeGreaterThan(0)
  })

  it('keeps a key’s share of the budget for as long as the device counts it', () => {
    // The device, eight keys at Density 16 and Release 1, seven of them let go: the one still held
    // has 8 grains while the others' envelopes run, 1.5 s on too, and 16 once they are done.
    const eight = (after: number): DisplayNote[] =>
      Array.from({ length: 8 }, (_, index) => ({
        ...note(220 + 20 * index, after + 0.5, index === 0 ? null : after),
        id: index,
      }))
    const values = { density: 16, release: 1, attack: 0.005 }
    expect(grains(values, eight(0.5))).toHaveLength(64)
    expect(grains(values, eight(1.1))).toHaveLength(8)
    expect(grains(values, eight(1.5))).toHaveLength(8)
    expect(grains(values, eight(1.8))).toHaveLength(16)
  })

  it('draws Tone as the low-pass it is, at every size', () => {
    const down = (tone: number, hz: number): number => toneMarkAt(draw({ tone }, []), hz)
    expect(down(1000, 1000)).toBeCloseTo(3.0103 / -TONE_MARK_FLOOR_DB, 2)
    expect(down(18000, 1000)).toBeCloseTo(0, 2)
    expect(down(200, 1000)).toBe(1)
    for (const width of [128, 204, 408]) {
      toneMarkOf(drawDisplay(display, paramsOf('grain-synth'), { width }))
    }
  })

  it('keeps its words and the Tone mark clear of the handle, wherever Position is', () => {
    for (const width of [128, 204]) {
      for (const position of [0, 0.1, 0.5, 1]) {
        const values = { position }
        const options = { values, width }
        const [handle] = display.handles?.(viewOf(display, paramsOf('grain-synth'), options)) ?? []
        const drawn = drawDisplay(display, paramsOf('grain-synth'), options)
        // The ring is 3.5 in radius and 1.5 thick.
        const ringTop = handle.y - 4.25
        const row = drawn.calls.filter(
          (call) => call.name === 'fillText' && (call.args[2] as number) < handle.y,
        )
        expect(row.length).toBeGreaterThan(0)
        for (const word of row) expect(word.args[2] as number).toBeLessThanOrEqual(ringTop - 1)
        expect(toneMarkOf(drawn).foot).toBeLessThanOrEqual(ringTop - 1)
      }
    }
  })

  it('lets a note’s grains grow with the attack, and puts them out a release after the key', () => {
    const height = (values: Record<string, number>, sounding: DisplayNote): number =>
      Math.max(...grains({ spread: 0, ...values }, [sounding]).map(tall))
    const full = height({ attack: 0.005 }, note(MIDDLE_C, 1))
    expect(height({ attack: 8 }, note(MIDDLE_C, 1))).toBeLessThan(full * 0.7)
    expect(height({ attack: 0.005 }, note(MIDDLE_C, 1, null, 0))).toBeLessThan(full * 0.7)
    expect(grains({ release: 2 }, [note(MIDDLE_C, 3, 1.9)])).toHaveLength(6)
    expect(lit(draw({ release: 2 }, [note(MIDDLE_C, 3.2, 2.1)]))).toHaveLength(0)
  })

  it('stands its handle on the reading point, and a drag sets Position', () => {
    for (const position of [0, 0.2, 1]) {
      const [handle] = display.handles?.(view({ position })) ?? []
      expect(handle.x).toBeCloseTo(left + position * wide, 5)
      expect(handle.drag(handle.x, handle.y).position).toBeCloseTo(position, 5)
    }
    const [handle] = display.handles?.(view({})) ?? []
    expect(handle.drag(left + 0.7 * wide, 0).position).toBeCloseTo(0.7, 5)
  })
})

describe('the tape orchestra’s figures', () => {
  it('throw a key’s take with the device’s own dice', () => {
    // The device, Strings on middle C.
    const strings = tapeTake(60, 0)
    expect(strings.keyCents).toBeCloseTo(0.449983, 5)
    expect(strings.keyLevel).toBeCloseTo(0.16989, 5)
    expect(strings.wowRate).toBeCloseTo(0.444453, 5)
    expect(strings.wowPhase).toBeCloseTo(0.213213, 3)
    expect(strings.swayPhase).toBeCloseTo(0.348022, 3)
    expect(strings.tuning).toBeCloseTo(0.099154, 5)
    expect(strings.pace).toBeCloseTo(0.989141, 5)
    expect(strings.wait).toBeCloseTo(-0.964308, 5)
    expect(strings.wanderRate).toBeCloseTo(0.445361, 5)
    // Its dropouts over nine seconds of tape: from, until, how deep.
    const dropouts = [
      [0.62694, 0.71385, 0.6643],
      [1.31911, 1.42928, 0.7319],
      [2.12614, 2.25661, 0.7992],
      [4.43298, 4.49884, 0.4715],
      [7.10958, 7.24207, 0.7108],
    ]
    expect(strings.dropCount).toBe(dropouts.length)
    dropouts.forEach((dropout, index) => {
      dropout.forEach((figure, part) => {
        expect(strings.drops[index * 3 + part]).toBeCloseTo(figure, 4)
      })
    })
    // The device, Horns on the A below: another take, a section of four seated the other way round.
    const horns = tapeTake(45, 3)
    expect(horns.keyCents).toBeCloseTo(0.123054, 5)
    expect(horns.keyLevel).toBeCloseTo(0.146389, 5)
    expect(horns.wowRate).toBeCloseTo(0.727308, 5)
    expect(horns.tuning).toBeCloseTo(-0.076162, 5)
    expect(horns.pace).toBeCloseTo(0.958598, 5)
    expect(horns.wait).toBeCloseTo(0.328141, 5)
    expect(horns.drops[0]).toBeCloseTo(1.71623, 4)
    expect(horns.dropCount).toBe(4)
  })

  const settings: TapeSettings = {
    tape: 0,
    age: 0,
    speed: 1,
    length: 9,
    attack: 0.06,
    section: 0.6,
    vibrato: 0.5,
    tone: 0,
  }
  const point = { cents: 0, level: 0 }

  it('bend the lead player’s pitch along the tape as `control_voice` does', () => {
    // The device, Strings on middle C at Age 0, Vibrato 0.5 and Section 0.6: cents off pitch by
    // seconds of tape. Its flutter, which is not drawn, is 0.3 cents of them at most.
    const take = tapeTake(60, 0)
    for (const [seconds, cents] of [
      [0.02, -1.894],
      [0.06133, 0.838],
      [0.5, 5.76],
      [1.00134, 10.471],
      [2.00002, -4.863],
      [3.70123, 9.464],
    ]) {
      expect(Math.abs(tapeAt(point, take, MIDDLE_C, seconds, settings).cents - cents)).toBeLessThan(
        0.6,
      )
    }
    // The device at half speed: the lurch keeps the machine's pace, the rest the tape's.
    for (const [seconds, cents] of [
      [0.02067, -0.435],
      [0.06, 1.415],
      [0.50067, 6.019],
      [2.00061, -5.243],
      [3.70048, 9.464],
    ]) {
      expect(
        Math.abs(tapeAt(point, take, MIDDLE_C, seconds, { ...settings, speed: 0.5 }).cents - cents),
      ).toBeLessThan(0.6)
    }
  })

  it('start a note flat as the tape is gripped, more so when worn', () => {
    const take = tapeTake(60, 0)
    const still = { ...settings, vibrato: 0, section: 0 }
    const lurch = (age: number): number =>
      tapeAt(point, take, MIDDLE_C, 0.2, { ...still, age }).cents -
      tapeAt(point, take, MIDDLE_C, 0, { ...still, age }).cents
    // `kLurchCents` 4 and `kLurchCentsAge` 46 by the square of Age, less what the wow moved meanwhile.
    expect(lurch(0)).toBeGreaterThan(3)
    expect(lurch(0)).toBeLessThan(5)
    expect(lurch(1)).toBeGreaterThan(38)
    expect(lurch(1)).toBeLessThan(62)
  })

  it('run a tape out over its last half second, and never at full Length', () => {
    expect(tapeRunOut(3, 6)).toBe(1)
    expect(tapeRunOut(5.5, 6)).toBe(1)
    expect(tapeRunOut(5.75, 6)).toBeCloseTo(0.25, 9)
    expect(tapeRunOut(6, 6)).toBe(0)
    expect(tapeRunOut(40, 6)).toBe(0)
    // `kEndlessFrom`.
    expect(tapeRunOut(40, 8.95)).toBe(1)
    expect(tapeRunOut(40, 9)).toBe(1)
    expect(tapeRunOut(8.94, 8.94)).toBe(0)
  })

  it('pass the band the tape passes', () => {
    // In the middle of it, nothing is taken.
    expect(tapeBandGain(440, 0, 0)).toBeCloseTo(1, 1)
    // The low cut: 75 Hz at a Q of 0.9, which is 0.9 at its corner; 135 Hz when worn.
    expect(tapeBandGain(75, 0, 0)).toBeCloseTo(0.9, 2)
    expect(tapeBandGain(135, 0, 1)).toBeCloseTo(0.9, 1)
    expect(tapeBandGain(40, 0, 1)).toBeLessThan(tapeBandGain(40, 0, 0))
    // The roll-off: 7 kHz at a Q of 0.62, half as high when worn, an octave and 0.6 lower at Tone −1.
    expect(tapeBandGain(7000, 0, 0)).toBeCloseTo(0.62, 2)
    expect(tapeBandGain(3500, 0, 1)).toBeCloseTo(0.62, 2)
    expect(tapeBandGain(3000, -1, 0)).toBeLessThan(0.5 * tapeBandGain(3000, 0, 0))
    // The tilt: Tone 1 doubles what lies far above 1.2 kHz, Tone −1 halves it.
    expect(tapeBandGain(1200, 1, 0) / tapeBandGain(1200, 0, 0)).toBeGreaterThan(1.5)
    expect(tapeBandGain(1200, -1, 0) / tapeBandGain(1200, 0, 0)).toBeLessThan(0.8)
  })

  it('hiss with the knob and the power of the keys that sound', () => {
    expect(tapeHiss(1, 1)).toBe(1)
    expect(tapeHiss(0, 4)).toBe(0)
    expect(tapeHiss(0.2, 1)).toBeCloseTo(0.2 * 0.4, 9)
    expect(tapeHiss(1, 4)).toBe(2)
  })

  it('give a held key its level along the tape: spoken, swelled, dropped out, run out', () => {
    const take = tapeTake(60, 0)
    const level = (seconds: number, values: Partial<TapeSettings> = {}): number =>
      tapeAt(point, take, MIDDLE_C, seconds, { ...settings, vibrato: 0, ...values }).level
    expect(level(0)).toBe(0)
    // Strings swell for 0.35 s and hold a quarter back meanwhile.
    expect(level(0.1)).toBeLessThan(level(3) * 0.9)
    expect(level(1, { attack: 4 })).toBeLessThan(level(1) * 0.5)
    // No dropouts under Age 0.45; at Age 1 the first one of this key takes 0.6643 of it.
    expect(level(0.67, { age: 0.4 }) / level(0.61, { age: 0.4 })).toBeGreaterThan(0.98)
    expect(level(0.67, { age: 1 }) / level(0.61, { age: 1 })).toBeCloseTo(1 - 0.6643, 1)
    expect(level(5.75, { length: 6 }) / level(5.4, { length: 6 })).toBeCloseTo(0.25, 1)
    expect(level(6.2, { length: 6 })).toBe(0)
  })
})

describe('the tape orchestra’s display', () => {
  const { display } = SAMPLE_INSTRUMENT_FACES['tape-orchestra']
  const draw = (values: Record<string, number>, notes: DisplayNote[]) =>
    played(display, 'tape-orchestra', values, notes)
  const view = (values: Record<string, number>) =>
    viewOf(display, paramsOf('tape-orchestra'), { values })
  // Where a second of tape lies, from the handle that stands on the tape's end.
  const at9 = display.handles?.(view({ length: 9 }))[0].x ?? 9
  const at2 = display.handles?.(view({ length: 2 }))[0].x ?? 2
  const xOf = (seconds: number): number => at2 + ((seconds - 2) * (at9 - at2)) / 7
  /** The lit tapes, and the marks where they are read. */
  const tapes = (values: Record<string, number>, notes: DisplayNote[]) =>
    shapes(draw(values, notes), 'fill')
  /** The specks of hiss: single pixels. */
  const specks = (drawn: RecordingContext): number =>
    drawn.calls.filter(
      (call) => call.name === 'fillRect' && call.args[2] === 1 && call.args[3] === 1,
    ).length

  it('lights nothing at rest, and a tape for each key that sounds', () => {
    expect(lit(drawDisplay(display, paramsOf('tape-orchestra')))).toHaveLength(0)
    expect(lit(draw({ hiss: 0 }, []))).toHaveLength(0)
    const chord = draw({ hiss: 0 }, [note(220, 0.5), note(MIDDLE_C, 0.5), note(392, 0.5)])
    expect(shapes(chord, 'fill')).toHaveLength(3)
    expect(lines(chord)).toHaveLength(3)
  })

  it('lights a tape as far as it has run, half as fast at half speed', () => {
    expect(right(tapes({ hiss: 0 }, [note(MIDDLE_C, 3)])[0])).toBeCloseTo(xOf(3), 3)
    expect(right(tapes({ hiss: 0, speed: 1 }, [note(MIDDLE_C, 3)])[0])).toBeCloseTo(xOf(1.5), 3)
    expect(lines(draw({ hiss: 0 }, [note(MIDDLE_C, 3)]))[0].points[0][0]).toBeCloseTo(xOf(3), 3)
  })

  it('puts a held key out when its tape has run out, later at half speed, never at full Length', () => {
    const held = (values: Record<string, number>, age: number) =>
      tapes({ hiss: 0, ...values }, [note(MIDDLE_C, age)])
    expect(held({ length: 6 }, 5.9)).toHaveLength(1)
    expect(held({ length: 6 }, 6.1)).toHaveLength(0)
    expect(held({ length: 6, speed: 1 }, 11.9)).toHaveLength(1)
    expect(held({ length: 6, speed: 1 }, 12.1)).toHaveLength(0)
    expect(held({ length: 9 }, 19)).toHaveLength(1)
  })

  it('puts a key out a release time after it is let go', () => {
    const let_go = (release: number, after: number) =>
      tapes({ hiss: 0, release }, [note(MIDDLE_C, after + 1, after)])
    expect(let_go(2, 1.9)).toHaveLength(1)
    expect(let_go(2, 2.1)).toHaveLength(0)
    expect(let_go(0.05, 0.1)).toHaveLength(0)
  })

  it('draws the rack’s tapes as long as Length, and to the edge when it never ends', () => {
    const rack = (values: Record<string, number>) =>
      drawnPaths(drawDisplay(display, paramsOf('tape-orchestra'), { values })).filter(
        (path) => path.kind === 'fill' && path.colour === ink && path.points.length > 40,
      )
    expect(rack({})).toHaveLength(7)
    for (const tape of rack({ length: 4 })) expect(right(tape)).toBeCloseTo(xOf(4), 3)
    for (const tape of rack({ length: 9 })) expect(right(tape)).toBeCloseTo(xOf(9), 3)
  })

  it('speckles the rack with as much hiss as the keys that sound bring', () => {
    const rest = (hiss: number): number =>
      specks(drawDisplay(display, paramsOf('tape-orchestra'), { values: { hiss } }))
    expect(rest(0)).toBe(0)
    expect(rest(1)).toBe(90)
    expect(rest(0.2)).toBe(Math.round(90 * 0.08))
    const one = specks(draw({ hiss: 1 }, [note(MIDDLE_C, 1)]))
    const four = specks(
      draw({ hiss: 1 }, [note(220, 1), note(MIDDLE_C, 1), note(330, 1), note(392, 1)]),
    )
    expect(one).toBe(90)
    expect(four).toBe(180)
    expect(specks(draw({ hiss: 0 }, [note(MIDDLE_C, 1)]))).toBe(0)
  })

  it('stands its handle on the end of the tape, and a drag sets Length', () => {
    for (const length of [2, 6, 9]) {
      const [handle] = display.handles?.(view({ length })) ?? []
      expect(handle.x).toBeCloseTo(xOf(length), 5)
      expect(handle.drag(handle.x, handle.y).length).toBeCloseTo(length, 5)
    }
    const [handle] = display.handles?.(view({})) ?? []
    expect(handle.drag(xOf(4.5), 0).length).toBeCloseTo(4.5, 5)
    expect(handle.drag(0, 0).length).toBe(2)
  })
})
