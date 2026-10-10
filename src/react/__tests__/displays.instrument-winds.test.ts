// The truth of the blown instruments' displays: the breath is the device's own
// envelope, a note is lit for as long as that envelope lets it sound, and what
// a knob does to a note that sounds shows on the instrument above it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  WIND_INSTRUMENT_FACES,
  breathLevel,
  breathShare,
  choirFormant,
  choirSinger,
  choirSourceDb,
  choirTractDb,
  clarinetAttack,
  clarinetBrightness,
  clarinetEven,
  clarinetLimit,
  clarinetTone,
  fluteAir,
  fluteBrightness,
  fluteChiff,
  flutePressure,
  fluteScoopCents,
  fluteSpeechSeconds,
  fluteTone,
  hornAttack,
  hornBrightness,
  hornCap,
  hornHarmony,
  hornPlayer,
  lowpassGain,
  organRank,
  organReed,
  organWind,
  vibratoOnset,
} from '../components/displays/instrument-winds'
import { type DisplayNote, type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent, ink } = PLAIN_COLOURS

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 0.8,
): DisplayNote => ({ id: Math.round(frequency), frequency, gain, age, released })

/** One thing painted in the accent: what it was painted with, and the shape it was given. */
interface Light {
  kind: 'stroke' | 'fill' | 'fillRect'
  alpha: number
  width: number
  points: [number, number][]
  /** The circles of its path, as x, y and radius. */
  arcs: [number, number, number][]
  /** The ellipses of its path, as x, y and the two radii. */
  ellipses: [number, number, number, number][]
  /** A rectangle filled outright, as x, y, width and height. */
  rect: [number, number, number, number] | null
}

/** Everything a drawing painted in the accent: all that is lit on it. */
function lights(drawn: RecordingContext): Light[] {
  const out: Light[] = []
  let points: Light['points'] = []
  let arcs: Light['arcs'] = []
  let ellipses: Light['ellipses'] = []
  const now = { fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1 }
  for (const call of drawn.calls) {
    const args = call.args as number[]
    if (call.name === 'beginPath') {
      points = []
      arcs = []
      ellipses = []
    } else if (call.name === 'moveTo' || call.name === 'lineTo') points.push([args[0], args[1]])
    else if (call.name === 'arc') arcs.push([args[0], args[1], args[2]])
    else if (call.name === 'ellipse') ellipses.push([args[0], args[1], args[2], args[3]])
    else if (call.name === 'set fillStyle') now.fillStyle = String(call.args[0])
    else if (call.name === 'set strokeStyle') now.strokeStyle = String(call.args[0])
    else if (call.name === 'set globalAlpha') now.globalAlpha = args[0]
    else if (call.name === 'set lineWidth') now.lineWidth = args[0]
    else if (call.name === 'stroke' || call.name === 'fill' || call.name === 'fillRect') {
      const colour = call.name === 'stroke' ? now.strokeStyle : now.fillStyle
      if (colour !== accent) continue
      const filled = call.name === 'fillRect'
      out.push({
        kind: call.name,
        alpha: now.globalAlpha,
        width: now.lineWidth,
        points: filled ? [] : [...points],
        arcs: filled ? [] : [...arcs],
        ellipses: filled ? [] : [...ellipses],
        rect: filled ? [args[0], args[1], args[2], args[3]] : null,
      })
    }
  }
  return out
}

/** The marks of the notes on the breath: the small dots along the foot, as x and y. */
const riders = (all: Light[]): [number, number][] =>
  all
    .filter((light) => light.kind === 'fill' && light.arcs.length === 1 && light.arcs[0][2] <= 3)
    .map((light) => [light.arcs[0][0], light.arcs[0][1]])

/** A display run for a moment with these notes and no sound read, so nothing but the notes can light it. */
const played = (
  display: PlateDisplay,
  id: string,
  values: Record<string, number>,
  notes: DisplayNote[],
): Light[] => lights(runDisplay(display, paramsOf(id), 0.1, { values, notes }))

describe('the breath', () => {
  it('rises as `kit::Adsr` does: past full, and stopped when it is there', () => {
    expect(breathLevel(0, null, 0.5, 1)).toBe(0)
    // 1.3 · (1 − (0.3 / 1.3)^(t / attack)): full at the attack time exactly.
    expect(breathLevel(0.25, null, 0.5, 1)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 6)
    expect(breathLevel(0.5, null, 0.5, 1)).toBeCloseTo(1, 6)
    expect(breathLevel(40, null, 0.5, 1)).toBe(1)
  })

  it('falls 60 dB in every release time, from wherever it was at key up', () => {
    expect(breathLevel(3, 1, 0.5, 1)).toBeCloseTo(0.001, 8)
    expect(breathLevel(2.5, 0.5, 0.5, 1)).toBeCloseTo(Math.pow(10, -1.5), 8)
    // Let go half way up the attack: it falls from there.
    const half = breathLevel(0.25, null, 0.5, 1)
    expect(breathLevel(0.75, 0.5, 0.5, 1)).toBeCloseTo(half * Math.pow(10, -1.5), 8)
  })

  it('is a share of the 60 dB a note is counted over', () => {
    expect(breathShare(1)).toBe(1)
    expect(breathShare(Math.pow(10, -1.5))).toBeCloseTo(0.5, 6)
    expect(breathShare(0.001)).toBeCloseTo(0, 6)
    expect(breathShare(0)).toBe(0)
  })

  it('brings a vibrato in after its delay, eased', () => {
    expect(vibratoOnset(0.2, 0.25, 0.6)).toBe(0)
    expect(vibratoOnset(0.55, 0.25, 0.6)).toBeCloseTo(0.5, 6)
    expect(vibratoOnset(2, 0.25, 0.6)).toBe(1)
  })
})

describe.each(Object.keys(WIND_INSTRUMENT_FACES))('the breath of %s', (id) => {
  const { display } = WIND_INSTRUMENT_FACES[id]
  const params = paramsOf(id)
  // Short times, so the note's own speech (some milliseconds) does not decide a test.
  const values = { attack: 0.5, release: 1 }

  it('lights nothing at rest', () => {
    expect(lights(drawDisplay(display, params))).toHaveLength(0)
    expect(played(display, id, {}, [])).toHaveLength(0)
    // The level that comes out is the one thing sound alone lights.
    expect(
      lights(runDisplay(display, params, 0.1, { signal: testSignal() })).map((light) => light.kind),
    ).toEqual(['fillRect'])
  })

  it('lights a note that is held, and puts it out when its release has run', () => {
    expect(played(display, id, values, [note(261.63, 2)]).length).toBeGreaterThan(0)
    expect(played(display, id, values, [note(261.63, 2.5, 0.5)]).length).toBeGreaterThan(0)
    expect(played(display, id, values, [note(261.63, 3.2, 1.2)])).toHaveLength(0)
    // A longer release keeps the same note.
    expect(
      played(display, id, { attack: 0.5, release: 4 }, [note(261.63, 3.2, 1.2)]).length,
    ).toBeGreaterThan(0)
  })

  it('carries each note along the envelope: up the attack, across, down the release', () => {
    const [handle, slope] = display.handles?.(viewOf(display, params, { values })) ?? []
    const [[earlyX, earlyY]] = riders(played(display, id, values, [note(261.63, 0.05)]))
    const [[heldX, heldY]] = riders(played(display, id, values, [note(261.63, 1.5)]))
    const [[goneX, goneY]] = riders(played(display, id, values, [note(261.63, 2.5, 0.5)]))
    // The corner the attack ends at is the Attack handle; the top of the strip is its height.
    expect(earlyX).toBeLessThan(handle.x)
    expect(earlyY).toBeGreaterThan(handle.y + 1)
    expect(heldX).toBeGreaterThan(handle.x)
    expect(heldY).toBeCloseTo(handle.y, 3)
    // Half the release gone is half the 60 dB: the note is where the Release handle stands, to
    // the pixel (a flute's tone is a few milliseconds behind its breath).
    expect(Math.abs(goneX - slope.x)).toBeLessThan(1)
    expect(Math.abs(goneY - slope.y)).toBeLessThan(1)
  })

  it('draws the attack as the note rises on it: a note half way up stands on the curve', () => {
    // The seconds this note takes to arrive: Attack, and on a reed or a horn its own speech.
    const attack =
      id === 'clarinet'
        ? clarinetAttack(0.5, 261.63)
        : id === 'horns'
          ? hornAttack(0, 0.5, 261.63)
          : 0.5
    const drawn = runDisplay(display, params, 0.1, { values, notes: [note(261.63, attack / 2)] })
    const [[x, y]] = riders(lights(drawn))
    // The envelope is the one shape of fifteen points filled in the ink: the foot, twelve steps
    // up the attack, the held level's end, the foot again.
    const [envelope] = drawnPaths(drawn).filter(
      (path) => path.kind === 'fill' && path.colour === ink && path.points.length === 15,
    )
    const [stepX, stepY] = envelope.points[6]
    expect(x).toBeCloseTo(stepX, 3)
    expect(y).toBeCloseTo(stepY, 3)
  })

  it('hangs the notes of a chord under one another', () => {
    const chord = riders(
      played(display, id, values, [note(261.63, 2), note(329.63, 2), note(392, 2)]),
    )
    expect(chord).toHaveLength(3)
    // One place, to the pixel: where a low note speaks later than a high one it is a hair behind.
    const xs = chord.map(([x]) => x)
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(1)
    expect(new Set(chord.map(([, y]) => y)).size).toBe(3)
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { attack: 0.02, release: 4 },
      { attack: 2.5, release: 0.1 },
    ]
    for (const set of settings) {
      const view = viewOf(display, params, { values: set })
      const [attack, release] = display.handles?.(view) ?? []
      expect(attack.drag(attack.x, attack.y).attack).toBeCloseTo(view.value('attack'), 3)
      expect(release.drag(release.x, release.y).release).toBeCloseTo(view.value('release'), 3)
      // To the right is a slower attack; to the left a longer release.
      expect(attack.drag(attack.x + 6, attack.y).attack).toBeGreaterThan(view.value('attack'))
      expect(release.drag(release.x - 6, release.y).release).toBeGreaterThan(view.value('release'))
    }
  })
})

describe('the flute’s figures', () => {
  it('lag the tone behind the breath by Q / (π·f), the type’s own Q', () => {
    // `flute.h`, `kVoicings`: speech_q 14 for the Concert flute, 22 for the Low flute, 9 for Pan pipes.
    expect(fluteSpeechSeconds(0, 261.63)).toBeCloseTo(14 / (Math.PI * 261.63), 8)
    expect(fluteSpeechSeconds(1, 65.41)).toBeCloseTo(22 / (Math.PI * 65.41), 8)
    expect(fluteSpeechSeconds(3, 440)).toBeCloseTo(9 / (Math.PI * 440), 8)
  })

  /**
   * `Flute::control` as the device runs it, 3000 times a second: `kit::Adsr`
   * for the breath, and the one pole that takes it up as the tone. Returns
   * the tone `age` seconds into a note let go `released` seconds ago.
   */
  function spoken(
    type: number,
    hz: number,
    age: number,
    released: number | null,
    attack: number,
    release: number,
  ): number {
    const rate = 3000
    const up = 1 - Math.exp(Math.log(0.3 / 1.3) / Math.max(1, attack * rate))
    const down = Math.exp(-6.907755279 / Math.max(1, release * rate))
    const take = 1 - Math.exp(-1 / (fluteSpeechSeconds(type, hz) * rate))
    const off = released === null ? Infinity : Math.round((age - released) * rate)
    let breath = 0
    let rising = true
    let tone = 0
    for (let tick = 0; tick < Math.round(age * rate); tick++) {
      if (tick >= off) breath *= down
      else if (rising) {
        breath += up * (1.3 - breath)
        if (breath >= 1) {
          breath = 1
          rising = false
        }
      }
      tone += (breath - tone) * take
    }
    return tone
  }

  it('take the breath up through one pole, as the device does', () => {
    const cases: [number, number, number, number | null, number, number][] = [
      // Type, pitch, age, let go, Attack, Release.
      [0, 261.63, 0.01, null, 0.04, 0.4],
      [0, 261.63, 0.05, null, 0.04, 0.4],
      [0, 261.63, 0.5, null, 0.04, 0.4],
      [0, 261.63, 0.7, 0.2, 0.04, 0.4],
      [1, 65.41, 0.1, null, 0.005, 0.03],
      [1, 65.41, 0.3, null, 0.005, 0.03],
      [1, 65.41, 1.2, 0.2, 0.005, 0.03],
      [1, 65.41, 1.5, 0.5, 0.005, 0.03],
      // Let go half way up a slow attack.
      [3, 440, 1.2, 0.2, 2, 1],
    ]
    for (const [type, hz, age, released, attack, release] of cases) {
      const device = spoken(type, hz, age, released, attack, release)
      const drawn = fluteTone(type, { frequency: hz, age, released }, attack, release)
      // Within half a dB: the device works in steps of a third of a millisecond.
      expect(Math.abs(20 * Math.log10(drawn / device))).toBeLessThan(0.5)
    }
  })

  it('let a low note die by its own lag when Release is quicker than that', () => {
    // A Low flute's C2 lags 107 ms. Half a second after a release of 30 ms the breath is long
    // gone and the tone is not yet 60 dB down; it is by a second.
    const lag = fluteSpeechSeconds(1, 65.41)
    expect(lag).toBeCloseTo(0.107, 3)
    expect(breathLevel(1.5, 0.5, 0.005, 0.03)).toBeLessThan(1e-9)
    expect(fluteTone(1, note(65.41, 1.5, 0.5), 0.005, 0.03)).toBeGreaterThan(0.001)
    expect(fluteTone(1, note(65.41, 2, 1), 0.005, 0.03)).toBeLessThan(0.001)
    // A high note has no such tail: its tone is where its breath is.
    expect(fluteTone(0, note(2093, 2.2, 0.2), 0.04, 0.4)).toBeCloseTo(Math.pow(10, -1.5), 2)
  })

  it('blow from the softest touch at 0.3 of full breath', () => {
    expect(flutePressure(0)).toBeCloseTo(0.3, 8)
    expect(flutePressure(1)).toBeCloseTo(1, 8)
  })

  it('brighten with Blow and with the breath, less up high, never past 0.62', () => {
    // `kBlowFloor` 0.08 over `kBlowRange` 0.47; C5 is where the register turns.
    expect(fluteBrightness(0, 0, 523.25, 1)).toBeCloseTo(0.08, 8)
    expect(fluteBrightness(0, 1, 523.25, 1)).toBeCloseTo(0.55, 8)
    expect(fluteBrightness(0, 1, 523.25, 0.5)).toBeCloseTo(0.275, 8)
    expect(fluteBrightness(0, 1, 1046.5, 1)).toBeCloseTo(0.275, 8)
    expect(fluteBrightness(0, 1, 261.63, 1)).toBe(0.62)
    expect(fluteBrightness(0, 0.2, 261.63, 1)).toBeCloseTo(0.174 * Math.pow(2, 0.25), 4)
    // The Wood flute has 0.7 of the Concert flute's brightness.
    expect(fluteBrightness(4, 0.5, 523.25, 1)).toBeCloseTo(0.7 * 0.315, 8)
  })

  it('give air by the square of Breath and the 1.75th power of the pressure', () => {
    expect(fluteAir(0, 1, 1)).toBeCloseTo(1.9, 8)
    expect(fluteAir(0, 0.5, 1)).toBeCloseTo(1.9 / 4, 8)
    expect(fluteAir(1, 1, 1)).toBeCloseTo(2.2 * 1.9, 8)
    expect(fluteAir(0, 1, 0.5)).toBeCloseTo(1.9 * Math.pow(0.5, 1.75), 8)
  })

  it('bend a note up from its scoop, and lose the chiff, in the type’s own time', () => {
    expect(fluteScoopCents(0, 120, 0)).toBe(-120)
    expect(fluteScoopCents(0, 120, 0.05)).toBeCloseTo(-120 / Math.E, 8)
    expect(fluteScoopCents(2, 120, 0.06)).toBeCloseTo(-120 / Math.E, 8)
    expect(fluteChiff(0, 0.8, 0.03)).toBeCloseTo(0.8 / Math.E, 8)
    expect(fluteChiff(3, 0.8, 0.025)).toBeCloseTo(0.8 / Math.E, 8)
  })
})

describe('the flute’s display', () => {
  const { display } = WIND_INSTRUMENT_FACES.flute
  /** The air columns that sound, and how far along the tube each reaches. */
  const columns = (all: Light[]): number[] =>
    all
      .filter((light) => light.kind === 'stroke' && light.width === 1.75)
      .map((light) => Math.max(...light.points.map(([x]) => x)))
  /** How many streaks of air are lit. */
  const streaks = (all: Light[]): number =>
    all
      .filter((light) => light.kind === 'stroke' && light.width === 1.2)
      .reduce((sum, light) => sum + light.points.length / 2, 0)

  it('gives each note a column of its own, longer for a lower note', () => {
    const [low, middle, high] = columns(
      played(display, 'flute', {}, [note(130.81, 1), note(261.63, 1), note(523.25, 1)]),
    )
    expect(low).toBeGreaterThan(middle)
    expect(middle).toBeGreaterThan(high)
    // An octave is the same step everywhere along the tube.
    expect(low - middle).toBeCloseTo(middle - high, 2)
  })

  it('starts a note long by its Scoop and lets it come up into tune', () => {
    const young = [note(261.63, 0.03)]
    const [plain] = columns(played(display, 'flute', { scoop: 0 }, young))
    const [scooped] = columns(played(display, 'flute', { scoop: 200 }, young))
    const [settled] = columns(played(display, 'flute', { scoop: 200 }, [note(261.63, 1)]))
    expect(scooped).toBeGreaterThan(plain + 1)
    expect(settled).toBeCloseTo(plain, 3)
  })

  it('lets the tone come after the breath, later on a low note', () => {
    /** How strongly a note's column is lit, and how high its mark stands on the breath. */
    const young = (hz: number): { column: number; rider: number } => {
      const all = played(display, 'flute', {}, [note(hz, 0.03)])
      const [column] = all.filter((light) => light.kind === 'stroke' && light.width === 1.75)
      return { column: column.alpha, rider: riders(all)[0][1] }
    }
    // 30 ms in, the breath of both is as far up; the tone of the high note is nearly there and
    // the tone of the low one, which lags 68 ms, is not.
    const high = young(1046.5)
    const low = young(65.41)
    expect(low.rider).toBeCloseTo(high.rider, 3)
    expect(high.column).toBeGreaterThan(0.9)
    expect(low.column).toBeLessThan(high.column - 0.1)
    // And it sounds on after a quick release, which the breath does not: the device's own tail.
    const tail = [note(65.41, 1.2, 0.2)]
    expect(columns(played(display, 'flute', { type: 1, release: 0.03 }, tail))).toHaveLength(1)
    expect(
      columns(played(display, 'flute', { type: 0, release: 0.03 }, [note(2093, 1.2, 0.2)])),
    ).toHaveLength(0)
  })

  it('lights the air only as far as Breath lets any through', () => {
    const held = [note(261.63, 1)]
    expect(streaks(played(display, 'flute', { breath: 0 }, held))).toBe(0)
    const some = streaks(played(display, 'flute', { breath: 0.4 }, held))
    const much = streaks(played(display, 'flute', { breath: 1 }, held))
    expect(some).toBeGreaterThan(0)
    expect(much).toBeGreaterThan(some)
    // The Low flute has 2.2 times the Concert flute's air.
    expect(streaks(played(display, 'flute', { breath: 0.4, type: 1 }, held))).toBeGreaterThan(some)
  })
})

describe('the clarinet’s figures', () => {
  it('take Attack and eight of their own periods to speak', () => {
    // `kSpeechQ` 25: Q / (π·f) is 7.96 periods.
    expect(clarinetAttack(0.1, 100)).toBeCloseTo(0.1 + 25 / (Math.PI * 100), 8)
    expect((clarinetAttack(0, 220) * 220) / 8).toBeCloseTo(1, 1)
  })

  it('sound the square of the breath, which is given twice Release', () => {
    const attack = clarinetAttack(0.1, 220)
    expect(clarinetTone(note(220, attack / 2), 0.1, 0.3)).toBeCloseTo(
      Math.pow(breathLevel(0.5, null, 1, 1), 2),
      8,
    )
    expect(clarinetTone(note(220, 2), 0.1, 0.3)).toBe(1)
    // The breath falls 60 dB in 0.6 s, so the tone falls 60 dB in 0.3 s.
    expect(clarinetTone(note(220, 2, 0.3), 0.1, 0.3)).toBeCloseTo(0.001, 8)
    expect(clarinetTone(note(220, 2, 0.15), 0.1, 0.3)).toBeCloseTo(Math.pow(10, -1.5), 8)
  })

  it('brighten with Blow and with the level of the tone, never past 0.88', () => {
    // `kDullest` 0.08 and `kBrightest` 0.82 at the reference level, 0.7396.
    expect(clarinetBrightness(0, 0.7396)).toBeCloseTo(0.08, 8)
    expect(clarinetBrightness(1, 0.7396)).toBeCloseTo(0.82, 8)
    expect(clarinetBrightness(1, 0.3698)).toBeCloseTo(0.41, 8)
    expect(clarinetBrightness(1, 1)).toBe(0.88)
  })

  it('keep a high note’s harmonics 60 dB down at half the sample rate', () => {
    // `brightness_limit` for a note bent 3 % sharp: under C6 it is past `kMaxBrightness`.
    expect(clarinetLimit(261.63, 48000)).toBe(0.88)
    expect(clarinetLimit(1046.5, 48000)).toBeCloseTo(Math.exp(-6.907755 / 22), 8)
    expect(clarinetLimit(2093, 48000)).toBeCloseTo(Math.exp(-6.907755 / 11), 8)
    expect(clarinetLimit(2093, 96000)).toBeCloseTo(Math.exp(-6.907755 / 22), 8)
    expect(clarinetBrightness(1, 1, clarinetLimit(2093, 48000))).toBeCloseTo(0.5337, 4)
  })

  it('leave a cylinder its even harmonics only above the tone holes’ cutoff', () => {
    expect(clarinetEven(1, 300)).toBe(1)
    expect(clarinetEven(0, 150)).toBeLessThan(0.012)
    expect(clarinetEven(0, 1500)).toBeGreaterThan(0.38)
    expect(clarinetEven(0, 1500)).toBeLessThan(0.5)
    expect(clarinetEven(0, 6000)).toBeGreaterThan(0.75)
  })

  it('add what comes back to what a half open bore lets through as the device does, by phase', () => {
    // `Clarinet::process` on one harmonic: two one pole high-passes, and Bore of what they held back.
    const through = (bore: number, hz: number): number => {
      const sampleRate = 48000
      const pole = Math.exp((-2 * Math.PI * 1500) / sampleRate)
      const low = [0, 0]
      let power = 0
      for (let n = 0; n < 9600; n++) {
        const even = Math.sin((2 * Math.PI * hz * n) / sampleRate)
        low[0] = even + (low[0] - even) * pole
        let returned = even - low[0]
        low[1] = returned + (low[1] - returned) * pole
        returned -= low[1]
        // Once it has settled: its size by its power, which no sample between two peaks misses.
        if (n >= 4800) power += (returned + bore * (even - returned)) ** 2 / 4800
      }
      return Math.sqrt(2 * power)
    }
    for (const [bore, hz] of [
      [0.5, 1500],
      [0.5, 523.25],
      [0.25, 3000],
      [0.8, 1046.5],
    ]) {
      expect(clarinetEven(bore, hz)).toBeCloseTo(through(bore, hz), 2)
    }
    // At the cutoff what comes back is about a quarter turn off, so half a cone has little more
    // than the cone's own half of it, and not three quarters.
    expect(clarinetEven(0.5, 1500)).toBeLessThan(0.6)
  })
})

describe('the clarinet’s display', () => {
  const { display } = WIND_INSTRUMENT_FACES.clarinet
  /** The harmonics that are lit, each as its height. */
  const bars = (all: Light[]): number[] =>
    all.filter((light) => light.rect !== null).map((light) => light.rect?.[3] ?? 0)
  const held = [note(261.63, 2)]

  it('lights more harmonics the harder it is blown', () => {
    const soft = bars(played(display, 'clarinet', { blow: 0 }, held))
    const hard = bars(played(display, 'clarinet', { blow: 1 }, held))
    expect(soft.length).toBeGreaterThan(0)
    expect(hard.length).toBeGreaterThan(soft.length + 3)
  })

  it('has every other harmonic low on a cylinder and all of them on a cone', () => {
    const cylinder = bars(played(display, 'clarinet', { bore: 0, blow: 1 }, held))
    const cone = bars(played(display, 'clarinet', { bore: 1, blow: 1 }, held))
    // The second harmonic stands under both its neighbours on a cylinder, between them on a cone.
    expect(cylinder[1]).toBeLessThan(cylinder[2])
    expect(cone[1]).toBeGreaterThan(cone[2])
    expect(cone[1]).toBeLessThan(cone[0])
    expect(cone[0]).toBeCloseTo(cylinder[0], 3)
  })

  it('opens up as a note swells: the upper harmonics come last and leave first', () => {
    const swelling = bars(played(display, 'clarinet', { blow: 1, attack: 1 }, [note(261.63, 0.25)]))
    const full = bars(played(display, 'clarinet', { blow: 1, attack: 1 }, held))
    const fading = bars(played(display, 'clarinet', { blow: 1 }, [note(261.63, 2, 0.1)]))
    expect(swelling.length).toBeLessThan(full.length)
    expect(fading.length).toBeLessThan(full.length)
    expect(swelling[0]).toBeLessThan(full[0])
  })

  it('lets a low note speak later than a high one', () => {
    const young = (hz: number): number =>
      riders(played(display, 'clarinet', { attack: 0.015 }, [note(hz, 0.02)]))[0][1]
    // 20 ms in, a note at 2 kHz has spoken and one at 55 Hz is still on its way up.
    expect(young(55)).toBeGreaterThan(young(2093) + 1)
  })
})

describe('the horns’ figures', () => {
  it('take Attack and some periods of the note to arrive, within 5 and 150 ms', () => {
    // `bell.h`: eight periods for the French horn, five for the trumpet.
    expect(hornAttack(0, 2.5, 100)).toBeCloseTo(2.58, 8)
    expect(hornAttack(2, 2.5, 100)).toBeCloseTo(2.55, 8)
    expect(hornAttack(0, 0.02, 30)).toBeCloseTo(0.17, 8)
    expect(hornAttack(2, 0.02, 4000)).toBeCloseTo(0.025, 8)
  })

  it('bring the players in one after another as Section rises', () => {
    expect([0, 1, 2, 3].map((k) => hornPlayer(k, 0))).toEqual([1, 0, 0, 0])
    expect(hornPlayer(1, 0.17)).toBeCloseTo(0.5, 8)
    expect(hornPlayer(2, 0.33)).toBe(0)
    expect(hornPlayer(2, 0.5)).toBeCloseTo(0.5, 8)
    expect(hornPlayer(3, 0.66)).toBe(0)
    for (const k of [0, 1, 2, 3]) expect(hornPlayer(k, 1)).toBeCloseTo(1, 8)
  })

  it('brighten with the pressure: Blow, the touch and the envelope', () => {
    // French horn: 0.03 with no pressure, 0.9 at full blow.
    expect(hornBrightness(0, 1, 1, 0)).toBeCloseTo(0.03, 8)
    expect(hornBrightness(0, 1, 1, 1)).toBeCloseTo(0.9, 8)
    expect(hornBrightness(0, 1, 1, 0.5)).toBeCloseTo(0.03 + 0.87 * 0.5, 8)
    expect(hornBrightness(0, 0, 0, 1)).toBeCloseTo(0.03 + 0.87 * 0.2 * 0.15, 8)
    // The muted trumpet is bright even when soft.
    expect(hornBrightness(3, 0, 0, 0)).toBeCloseTo(0.6, 8)
  })

  it('keep a high note’s series 50 dB down at half the sample rate', () => {
    // `brightness_cap` at `kCapDb`: under C5 it is past `kMaxBrightness`, 0.92.
    expect(hornCap(130.81, 48000)).toBe(0.92)
    expect(hornCap(1046.5, 48000)).toBeCloseTo(Math.pow(10, (-50 / 20) * (1046.5 / 24000)), 6)
    expect(hornCap(1046.5, 48000)).toBeCloseTo(0.778, 3)
    // A trumpet blown as hard as it goes is that bright up there, and no brighter.
    expect(hornBrightness(2, 1, 1, 1, hornCap(1046.5, 48000))).toBeCloseTo(0.778, 3)
    expect(hornBrightness(2, 1, 1, 1, hornCap(261.63, 48000))).toBeCloseTo(0.88, 8)
  })

  it('give the harmony voice its level, and take as much from the note', () => {
    expect(hornHarmony(0)).toBe(0)
    expect(hornHarmony(1)).toBeCloseTo(Math.SQRT1_2, 8)
    expect(hornHarmony(-1)).toBeCloseTo(Math.SQRT1_2, 8)
    expect(hornHarmony(0.5)).toBeCloseTo(0.5 / Math.sqrt(1.25), 8)
  })
})

describe('the horns’ display', () => {
  const { display } = WIND_INSTRUMENT_FACES.horns
  /** The bells that are lit, as x, y and the radius the light reaches. */
  const bells = (all: Light[]): [number, number, number][] =>
    all
      .filter((light) => light.kind === 'fill' && light.arcs.length === 1 && light.arcs[0][2] > 3)
      .map((light) => light.arcs[0])
  const held = [note(261.63, 8)]
  const alone = { harmony: 0, breath: 0 }

  it('lights a bell for each player in the section, further apart as Section rises', () => {
    expect(bells(played(display, 'horns', { ...alone, section: 0 }, held))).toHaveLength(1)
    expect(bells(played(display, 'horns', { ...alone, section: 0.5 }, held))).toHaveLength(3)
    const half = bells(played(display, 'horns', { ...alone, section: 0.7 }, held)).map(([x]) => x)
    const full = bells(played(display, 'horns', { ...alone, section: 1 }, held)).map(([x]) => x)
    expect(full).toHaveLength(4)
    expect(Math.max(...full) - Math.min(...full)).toBeGreaterThan(
      Math.max(...half) - Math.min(...half),
    )
  })

  it('fills a bell further the harder it is blown, and as the note swells', () => {
    const reach = (values: Record<string, number>, notes: DisplayNote[]): number =>
      bells(played(display, 'horns', { ...alone, section: 0, ...values }, notes))[0][2]
    expect(reach({ blow: 1 }, held)).toBeGreaterThan(reach({ blow: 0.2 }, held) + 2)
    expect(reach({ blow: 1, attack: 2 }, [note(261.63, 0.3)])).toBeLessThan(
      reach({ blow: 1, attack: 2 }, held),
    )
    // The brightness leaves before the body of the tone does.
    expect(reach({ blow: 1 }, [note(261.63, 8, 1)])).toBeLessThan(reach({ blow: 1 }, held) - 2)
  })

  it('lights a second, smaller bell for the Harmony voice, above or below its player', () => {
    const one = { section: 0, breath: 0 }
    const [above, player] = bells(played(display, 'horns', { ...one, harmony: 1 }, held))
    const [below] = bells(played(display, 'horns', { ...one, harmony: -1 }, held))
    expect(above[2]).toBeLessThan(player[2])
    // A fifth above is up and to the right, a fourth below down and to the left.
    expect(above[0]).toBeGreaterThan(player[0])
    expect(above[1]).toBeLessThan(player[1])
    expect(below[0]).toBeLessThan(player[0])
    expect(below[1]).toBeGreaterThan(player[1])
  })
})

describe('the organ’s figures', () => {
  it('sound a rank as a sine at Reed 0 and a series at constant power above', () => {
    expect(organRank(0.25, 0)).toBeCloseTo(1, 8)
    expect(organRank(0.5, 0)).toBeCloseTo(0, 8)
    // The series' power is 1 / (2 (1 − a²)) before it is levelled: after it, a half, as a sine's.
    for (const a of [0, 0.3, 0.6, 0.75]) {
      let power = 0
      for (let n = 0; n < 512; n++) power += organRank(n / 512, a) ** 2 / 512
      expect(power).toBeGreaterThan(0.48)
      expect(power).toBeLessThan(0.52)
    }
  })

  it('keep small pipes flutes: the reed a rank may have falls with its pitch', () => {
    // `kReedMost` 0.75 at Reed 1; the cap is 60 dB at Nyquist.
    expect(organReed(1, 100, 48000)).toBeCloseTo(0.75, 8)
    expect(organReed(0.4, 100, 48000)).toBeCloseTo(0.3, 8)
    expect(organReed(1, 4000, 48000)).toBeCloseTo(Math.exp(-6.907755 / 6), 8)
  })

  it('move the wind by the bellows and the tremulant, as far as the device does', () => {
    expect(organWind(0, 0, 1.3)).toBe(0)
    // A quarter turn of the tremulant, 5.5 Hz: its whole depth, 0.3.
    expect(organWind(0, 1, 0.25 / 5.5)).toBeCloseTo(0.3, 6)
    expect(organWind(0, 0.5, 0.25 / 5.5)).toBeCloseTo(0.15, 6)
    // The pump is two sines of 0.72 and 0.28, so the bellows never pass 0.22.
    let most = 0
    for (let t = 0; t < 60; t += 0.01) most = Math.max(most, Math.abs(organWind(1, 0, t)))
    expect(most).toBeLessThanOrEqual(0.22)
    expect(most).toBeGreaterThan(0.2)
  })

  it('cut with a low-pass of two poles', () => {
    expect(lowpassGain(1, 1000, 0.6)).toBeCloseTo(1, 4)
    expect(lowpassGain(1000, 1000, 0.6)).toBeCloseTo(0.6, 8)
    // Two octaves up: 24 dB down, as two poles are.
    expect(20 * Math.log10(lowpassGain(4000, 1000, 0.6))).toBeCloseTo(-24.3, 1)
  })
})

describe('the organ’s display', () => {
  const { display } = WIND_INSTRUMENT_FACES.organ
  /** The pipes that are lit, as x, their top, and how strongly. */
  const pipes = (all: Light[]): { x: number; high: number; alpha: number }[] =>
    all.flatMap((light) =>
      light.rect ? [{ x: light.rect[0], high: light.rect[3], alpha: light.alpha }] : [],
    )
  const shut = { sub: 0, octave: 0, twelfth: 0, fifteenth: 0, celeste: 0 }
  const held = [note(261.63, 2)]

  it('lights a key’s pipe in every rank whose stop is drawn', () => {
    expect(pipes(played(display, 'organ', shut, held))).toHaveLength(1)
    expect(pipes(played(display, 'organ', { ...shut, octave: 1 }, held))).toHaveLength(2)
    expect(pipes(played(display, 'organ', { ...shut, celeste: 0.5 }, held))).toHaveLength(2)
    const all = { sub: 1, octave: 1, twelfth: 1, fifteenth: 1, celeste: 1 }
    expect(pipes(played(display, 'organ', all, held))).toHaveLength(6)
    expect(pipes(played(display, 'organ', all, [...held, note(392, 2)]))).toHaveLength(12)
  })

  it('makes a pipe an octave shorter for every halving of its length', () => {
    const all = { sub: 1, octave: 1, twelfth: 1, fifteenth: 1, celeste: 1, tone: 12000 }
    const [sub, eight, octave, twelfth, fifteenth, celeste] = pipes(
      played(display, 'organ', all, held),
    ).map((pipe) => pipe.high)
    expect(sub).toBeGreaterThan(eight)
    expect(eight).toBeGreaterThan(octave)
    expect(octave).toBeGreaterThan(twelfth)
    expect(twelfth).toBeGreaterThan(fifteenth)
    // 16' to 8' is the step 8' to 4' is, and 4' to 2'; the celeste is an 8'.
    expect(Math.abs(sub - eight - (eight - octave))).toBeLessThanOrEqual(1)
    expect(Math.abs(eight - octave - (octave - fifteenth))).toBeLessThanOrEqual(1)
    expect(celeste).toBe(eight)
    // The same rank, a key an octave higher.
    const [higher] = pipes(played(display, 'organ', shut, [note(523.25, 2)]))
    expect(higher.high).toBe(octave)
  })

  it('draws a rank as strong as its stop, and the upper ranks weaker under a low Tone', () => {
    const strength = (values: Record<string, number>): number[] =>
      pipes(played(display, 'organ', { ...shut, ...values }, held)).map((pipe) => pipe.alpha)
    const [, faint] = strength({ fifteenth: 0.2, tone: 12000 })
    const [eight, drawn] = strength({ fifteenth: 1, tone: 12000 })
    expect(faint).toBeLessThan(drawn)
    expect(drawn).toBeCloseTo(eight, 2)
    const [dark, darker] = strength({ fifteenth: 1, tone: 300 })
    expect(darker).toBeLessThan(dark)
    expect(dark).toBeLessThan(eight)
  })
})

describe('the choir’s figures', () => {
  it('have the formants of the vowel table, morphed and scaled by Voice', () => {
    // `formants.h`, `kVowelTable`: Ah, Eh, Ee, Oh, Oo, a vowel every quarter.
    expect([0, 1, 2, 3, 4].map((k) => choirFormant(0, 1, k))).toEqual([730, 1090, 2440, 3500, 4500])
    expect([0, 1, 2].map((k) => choirFormant(0.5, 1, k))).toEqual([270, 2290, 3010])
    expect([0, 1, 2].map((k) => choirFormant(1, 1, k))).toEqual([300, 870, 2240])
    expect(choirFormant(0.125, 1, 0)).toBeCloseTo(630, 8)
    expect(choirFormant(0.125, 1, 1)).toBeCloseTo(1465, 8)
    expect(choirFormant(0, 1.2, 0)).toBeCloseTo(876, 8)
    // Bandwidths: 80 Hz on Ah's first formant, 60 on Ee's, and they scale with the tract.
    expect(choirFormant(0, 1, 0, true)).toBe(80)
    expect(choirFormant(0.5, 1.2, 0, true)).toBeCloseTo(72, 8)
  })

  it('stand the formants up as a tract does: a peak of about F / B at each', () => {
    expect(Math.abs(choirTractDb(1, 0, 1))).toBeLessThan(0.2)
    // Ah's first formant: 730 / 80 is 19 dB, and its neighbour at 1090 lifts it further.
    const peak = choirTractDb(730, 0, 1)
    expect(peak).toBeGreaterThan(20 * Math.log10(730 / 80))
    expect(peak).toBeGreaterThan(choirTractDb(500, 0, 1) + 6)
    expect(peak).toBeGreaterThan(choirTractDb(900, 0, 1) + 3)
    // With the voice's own slope at a middling touch (6 dB an octave, and more above 2.5 kHz)
    // Ah's third formant comes out about 30 dB under its first, which is what formants.h says.
    const touch = Math.log2(2500 / 900) / 2.2
    const under = peak - choirTractDb(2440, 0, 1) - choirSourceDb(2440 / 730, 2440, touch)
    expect(under).toBeGreaterThan(27)
    expect(under).toBeLessThan(33)
    // A smaller tract has the same peaks higher up.
    expect(choirTractDb(730 * 1.3, 0, 1.3)).toBeCloseTo(peak, 6)
  })

  /**
   * `FormantBank::set` and `process` as the device runs them at 48 kHz: five
   * state-variable low-passes side by side by their weights and the air band,
   * fed a sine. Returns what comes out of it, in dB.
   */
  function sung(hz: number, vowel: number, voice: number): number {
    const sampleRate = 48000
    const formants = [0, 1, 2, 3, 4].map((k) => choirFormant(vowel, voice, k))
    const filters = formants.map((formant, k) => {
      let weight = 1
      formants.forEach((other, j) => {
        if (j !== k) weight *= (other * other) / (other * other - formant * formant)
      })
      for (let n = 0; n < 8; n++) {
        const pole = (5500 + 1000 * n) * voice
        weight /= Math.max(1 - (formant * formant) / (pole * pole), 0.2)
      }
      return { hz: formant, k: choirFormant(vowel, voice, k, true) / formant, weight, band: false }
    })
    filters.push({ hz: 8000 * voice, k: 1 / 1.5, weight: 0.35, band: true })
    const states = filters.map(() => [0, 0])
    let power = 0
    for (let n = 0; n < 24000; n++) {
      const x = Math.sin((2 * Math.PI * hz * n) / sampleRate)
      let out = 0
      filters.forEach((filter, index) => {
        const g = Math.tan((Math.PI * filter.hz) / sampleRate)
        const a1 = 1 / (1 + g * (g + filter.k))
        const state = states[index]
        const v3 = x - state[1]
        const v1 = a1 * state[0] + g * a1 * v3
        const v2 = state[1] + g * a1 * state[0] + g * g * a1 * v3
        state[0] = 2 * v1 - state[0]
        state[1] = 2 * v2 - state[1]
        out += filter.weight * (filter.band ? v1 * filter.k : v2)
      })
      // Once it has settled: its size by its power.
      if (n >= 12000) power += (out * out) / 12000
    }
    return 10 * Math.log10(2 * power)
  }

  it('answer a frequency as the bank does: the five side by side, and the air above them', () => {
    const cases: [number, number, number][] = [
      // Frequency, Vowel, Voice.
      [300, 0, 1],
      [730, 0, 1],
      [1700, 0, 1],
      [3000, 0.5, 1],
      [1500, 1, 0.8],
      [3000, 1, 0.8],
      [6000, 1, 0.8],
      [6500, 0, 1],
      [7000, 0.5, 1.4],
    ]
    for (const [hz, vowel, voice] of cases) {
      // Within 1 dB, under a pixel of the picture: what the device's filters bend at the top of the band.
      expect(Math.abs(choirTractDb(hz, vowel, voice) - sung(hz, vowel, voice))).toBeLessThan(1)
    }
    // Oo has nothing of its own above 3 kHz, and still the top does not fall away: the air band
    // holds it within some 12 dB of what went in, where five formants in series would be 60 dB down.
    expect(choirTractDb(6400, 1, 0.8)).toBeCloseTo(20 * Math.log10(0.35), 0)
    expect(choirTractDb(5000, 1, 0.8)).toBeGreaterThan(-13)
  })

  it('tilt the voice by the touch: a soft note has less of its upper harmonics', () => {
    // `kTiltHz` 900 at the softest, 2.2 octaves higher at the hardest; 6 dB an octave before it.
    expect(choirSourceDb(1, 1, 0.5)).toBeCloseTo(0, 4)
    expect(choirSourceDb(2, 20, 0.5)).toBeCloseTo(-6.02, 2)
    expect(choirSourceDb(1, 900, 0)).toBeCloseTo(-3.01, 2)
    expect(choirSourceDb(1, 900 * Math.pow(2, 2.2), 1)).toBeCloseTo(-3.01, 2)
    expect(choirSourceDb(8, 3520, 1) - choirSourceDb(8, 3520, 0)).toBeGreaterThan(8)
  })

  it('bring the second singer in from Ensemble 0 and the third from 0.3', () => {
    expect([0, 1, 2].map((k) => choirSinger(k, 0))).toEqual([1, 0, 0])
    expect(choirSinger(1, 0.2)).toBeCloseTo(0.5, 8)
    expect(choirSinger(2, 0.3)).toBe(0)
    expect(choirSinger(2, 0.5)).toBeCloseTo(0.5, 8)
    for (const k of [0, 1, 2]) expect(choirSinger(k, 0.7)).toBeCloseTo(1, 8)
  })
})

describe('the choir’s display', () => {
  const { display } = WIND_INSTRUMENT_FACES.choir
  /** The mouths that sing, as x, y, half their width and half their height. */
  const mouths = (all: Light[]): [number, number, number, number][] =>
    all
      .filter((light) => light.kind === 'fill' && light.ellipses.length === 1)
      .map((light) => light.ellipses[0])
  /** How many overtones of the notes are lit under the formants. */
  const overtones = (all: Light[]): number =>
    all
      .filter((light) => light.kind === 'stroke' && light.width === 1 && light.points.length >= 4)
      .reduce((sum, light) => sum + light.points.length / 2, 0)
  const held = [note(220, 4)]
  const still = { motion: 0, breath: 0 }

  it('opens a mouth for each singer in the section, as far apart as Width', () => {
    expect(mouths(played(display, 'choir', { ...still, ensemble: 0 }, held))).toHaveLength(1)
    expect(mouths(played(display, 'choir', { ...still, ensemble: 0.2 }, held))).toHaveLength(2)
    const wide = mouths(played(display, 'choir', { ...still, ensemble: 1, width: 1 }, held))
    const mono = mouths(played(display, 'choir', { ...still, ensemble: 1, width: 0 }, held))
    expect(wide).toHaveLength(3)
    expect(new Set(wide.map(([x]) => x)).size).toBe(3)
    expect(new Set(mono.map(([x]) => x)).size).toBe(1)
  })

  it('lets the second and third singers come in late', () => {
    const entry = (age: number): number =>
      mouths(played(display, 'choir', { ...still, ensemble: 1, attack: 0.01 }, [note(220, age)]))
        .length
    // `kLateSeconds`: 45 and 90 ms at Ensemble 1.
    expect(entry(0.02)).toBe(1)
    expect(entry(0.06)).toBe(2)
    expect(entry(0.12)).toBe(3)
  })

  it('shapes the mouth to the vowel: tall for Ah, wide for Ee, small for Oo', () => {
    const mouth = (vowel: number): [number, number, number, number] =>
      mouths(played(display, 'choir', { ...still, ensemble: 0, vowel }, held))[0]
    const [, , ahWide, ahTall] = mouth(0)
    const [, , eeWide, eeTall] = mouth(0.5)
    const [, , ooWide, ooTall] = mouth(1)
    expect(ahTall).toBeGreaterThan(eeTall * 2)
    expect(eeWide).toBeGreaterThan(ahWide * 1.5)
    expect(ooWide).toBeLessThan(ahWide)
    expect(ooTall).toBeLessThan(ahTall / 2)
  })

  it('makes the singers larger as the Voice is lower', () => {
    const size = (voice: number): number =>
      mouths(played(display, 'choir', { ...still, ensemble: 0, voice }, held))[0][3]
    expect(size(0.8)).toBeGreaterThan(size(1.4) * 1.5)
  })

  /** The overtones that are lit, each as its x and the y its line reaches up to. */
  const tops = (all: Light[]): [number, number][] =>
    all
      .filter((light) => light.kind === 'stroke' && light.width === 1 && light.points.length >= 4)
      .flatMap((light) => light.points.filter((_, index) => index % 2 === 1))

  it('lights every overtone of each note under the formants, up to 8 kHz', () => {
    // 1 kHz: eight under 8 kHz. 220 Hz: thirty-six, the upper ones a pixel apart or nearer.
    expect(overtones(played(display, 'choir', still, [note(1000, 4)]))).toBe(8)
    const low = overtones(played(display, 'choir', still, held))
    expect(low).toBeGreaterThan(24)
    expect(low).toBeLessThanOrEqual(36)
    expect(overtones(played(display, 'choir', still, [note(220, 4), note(1000, 4)]))).toBe(low + 8)
    // A bass note's overtones do not stop at its sixteenth: they reach the top as the octave's do.
    const reach = (hz: number): number =>
      Math.max(...tops(played(display, 'choir', still, [note(hz, 4)])).map(([x]) => x))
    expect(reach(55)).toBeGreaterThan(reach(1000) - 3)
  })

  it('gives a note sung harder more of its upper overtones', () => {
    const sing = (gain: number): [number, number][] =>
      tops(played(display, 'choir', { ...still, vowel: 0 }, [note(220, 4, null, gain)]))
    const soft = sing(0.1)
    const hard = sing(1)
    expect(hard).toHaveLength(soft.length)
    // The fundamental stands where it stood; the last overtone is some pixels taller.
    expect(Math.abs(hard[0][1] - soft[0][1])).toBeLessThan(0.5)
    const taller = soft.filter(([, y], index) => y - hard[index][1] > 2)
    expect(taller.length).toBeGreaterThan(soft.length / 4)
    expect(soft.every(([, y], index) => y >= hard[index][1])).toBe(true)
  })
})
