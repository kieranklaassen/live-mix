// The truth of the wave shapers' displays: the wavetable's rows are the
// device's own recipes, the folder's curve and the gate are the device's own,
// the drone's partials stand where its shapes put them, and a key that is
// played is lit for as long as the device's envelope lets it sound.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  WAVE_INSTRUMENT_FACES,
  droneFollow,
  droneFree,
  droneHarmonic,
  droneKeyLevel,
  droneLowpassDb,
  dronePartials,
  droneTop,
  padAttack,
  padGain,
  padLevel,
  wavetableBand,
  wavetableFilterDb,
  wavetablePosition,
  wavetableRecipe,
  wavetableRow,
  westCoastCutoff,
  westCoastFold,
  westCoastGate,
  westCoastIndex,
  westCoastPoint,
  westCoastSpan,
  type DroneKey,
  type WestCoastGate,
  type WestCoastTimbre,
} from '../components/displays/instrument-waves'
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
  id = Math.round(frequency),
): DisplayNote => ({ id, frequency, gain: 1, age, released })
/** The strokes laid in the accent: the light on what sounds. */
const lights = (paths: DrawnPath[]): DrawnPath[] =>
  paths.filter((path) => path.kind === 'stroke' && path.colour === accent && path.points.length > 1)
/** The one path a picture is asked for: a test that finds none says so. */
const found = (path: DrawnPath | undefined): DrawnPath => {
  if (!path) throw new Error('the path was not drawn')
  return path
}
/** How tall a stroke is: the span of its points from foot to top, in px. */
const reach = (path: DrawnPath): number => {
  const ys = path.points.map(([, y]) => y)
  return Math.max(...ys) - Math.min(...ys)
}

describe('the pads’ envelope', () => {
  it('rises as `kit::Adsr` does: towards 1.3, cut off at 1 where the set time ends', () => {
    expect(padAttack(0, 2)).toBe(0)
    expect(padAttack(1, 2)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 6)
    expect(padAttack(2, 2)).toBeCloseTo(1, 6)
    expect(padAttack(9, 2)).toBe(1)
  })

  it('falls 60 dB in the release from where it stood at key up, and is off under −100 dB', () => {
    expect(padLevel(5, 1, 0.5, 3)).toBeCloseTo(0.1, 6)
    // Let go half way up the attack: it falls from there.
    expect(padLevel(3, 2, 2, 4)).toBeCloseTo(padAttack(1, 2) * Math.pow(10, -1.5), 6)
    expect(padLevel(20, 5.1, 0.5, 3)).toBe(0)
  })

  it('is as loud as `voice.gain` makes a key: 0.35 at the softest, 1 at the hardest', () => {
    expect(padGain(0)).toBeCloseTo(0.35, 6)
    expect(padGain(0.5)).toBeCloseTo(0.675, 6)
    expect(padGain(1)).toBeCloseTo(1, 6)
  })
})

describe('the wavetable’s figures', () => {
  const amp = new Float64Array(513)
  const phase = new Float64Array(513)

  it('builds Glass from a sine that grows its partials, the high ones last', () => {
    wavetableRecipe(0, 0, amp, phase)
    expect(amp[1]).toBe(1)
    expect(amp.reduce((sum, value) => sum + Math.abs(value), 0)).toBe(1)
    // Half way the fifth harmonic is in and the sixty-fourth is not: smoothstep((t − 0.6·log2(n)/6)·2.5).
    wavetableRecipe(0, 0.5, amp, phase)
    const x = (0.5 - (0.6 * Math.log2(5)) / 6) * 2.5
    expect(amp[5]).toBeCloseTo(0.34 * x * x * (3 - 2 * x), 6)
    expect(amp[64]).toBe(0)
    expect(phase[5]).toBeCloseTo((5 * 0.381966) % 1, 6)
    wavetableRecipe(0, 1, amp, phase)
    expect(amp[5]).toBeCloseTo(0.34, 6)
    expect(amp[64]).toBeCloseTo(0.02, 6)
  })

  it('builds Vowels from three formants on a voice at 110 Hz', () => {
    // The first frame is "a": 730, 1090 and 2440 Hz, 90, 110 and 170 Hz wide, at 1, 0.5 and 0.3.
    wavetableRecipe(1, 0, amp, phase)
    const hz = 770
    const bell = (centre: number, width: number): number =>
      1 / (1 + ((hz - centre) / width) * ((hz - centre) / width))
    const gain =
      0.02 / (1 + (hz / 6000) * (hz / 6000)) +
      bell(730, 90) +
      0.5 * bell(1090, 110) +
      0.3 * bell(2440, 170)
    expect(amp[7]).toBeCloseTo(gain * Math.pow(7, -0.8), 6)
    // The third frame is "e": its second formant is at 1840 Hz, the seventeenth harmonic.
    wavetableRecipe(1, 0.25, amp, phase)
    expect(amp[17]).toBeGreaterThan(amp[14])
    expect(amp[17]).toBeGreaterThan(amp[20])
  })

  it('builds Reed to Saw, Hollow and Spectral as the header does', () => {
    wavetableRecipe(2, 0, amp, phase)
    expect(amp[1]).toBeCloseTo(1 / (1 + 1 / 196), 6)
    expect(amp[2]).toBeCloseTo(0.08 / (1 + 4 / 196) / 2, 6)
    wavetableRecipe(2, 1, amp, phase)
    expect(amp[7]).toBeCloseTo(1 / 7, 6)
    // A square has no even harmonics; a pulse of 12 % has.
    wavetableRecipe(3, 0, amp, phase)
    expect(amp[1]).toBeCloseTo(1 / Math.sqrt(1 + 1 / 2304), 6)
    expect(Math.abs(amp[2])).toBeLessThan(1e-9)
    expect(phase[3]).toBe(0.25)
    wavetableRecipe(3, 1, amp, phase)
    expect(amp[2]).toBeCloseTo(Math.sin(Math.PI * 2 * 0.12) / (2 * Math.sqrt(1 + 4 / 2304)), 6)
    // Spectral's phases are `kit::Rng` from the seed in `build_tables`: xorshift32, worked here
    // in whole numbers. Each harmonic takes two draws, its phase first.
    let state = 0xc0ffee11n
    const draw = (): number => {
      state ^= (state << 13n) & 0xffffffffn
      state ^= state >> 17n
      state ^= (state << 5n) & 0xffffffffn
      return Number(state >> 8n) / 16777216
    }
    draw()
    draw()
    wavetableRecipe(4, 0.3, amp, phase)
    expect(phase[1]).toBeCloseTo(draw(), 9)
    draw()
    expect(phase[2]).toBeCloseTo(draw(), 9)
    // The fundamental is kept in so the pitch stays anchored.
    expect(amp[1]).toBeGreaterThan(0.6)
  })

  it('stores every frame at one loudness, `kTableRms`, unless its peak would pass 0.95', () => {
    for (const set of [0, 1, 2, 3, 4]) {
      const row = wavetableRow(set)
      expect(row.amps).toHaveLength(9)
      for (const frame of row.amps) {
        const rms = Math.sqrt(frame.reduce((sum, value) => sum + 0.5 * value * value, 0))
        expect(rms).toBeLessThanOrEqual(0.25 + 1e-6)
        expect(rms).toBeGreaterThan(0.1)
      }
    }
    // A sine alone is nowhere near the ceiling: 0.25 · √2 high.
    expect(wavetableRow(0).amps[0][1]).toBeCloseTo(0.25 * Math.SQRT2, 5)
  })

  it('turns the swept position back into the row at both ends, as `position_target` does', () => {
    expect(wavetablePosition(0.3, 0, 1)).toBe(0.3)
    expect(wavetablePosition(0.3, 0.4, 1)).toBeCloseTo(0.5, 9)
    expect(wavetablePosition(0.1, 1, -1)).toBeCloseTo(0.4, 9)
    expect(wavetablePosition(0.9, 1, 1)).toBeCloseTo(0.6, 9)
  })

  it('gives a key the harmonics its pitch leaves under Nyquist, as `update_pitch` does', () => {
    // Middle C at 48 kHz: 261.63 / 48000 · 1024 is 5.58, so the copy with 64 harmonics, not yet fading.
    expect(wavetableBand(261.63, 0, 48000)).toEqual({ whole: 32, most: 64, share: 1 })
    // 0.9 of the way up that octave of pitch the upper 32 are fading: smoothstep(0.6) gone.
    const fading = wavetableBand((48000 * Math.pow(2, 2.9)) / 1024, 0, 48000)
    expect(fading.most).toBe(64)
    expect(fading.share).toBeCloseTo(1 - 0.36 * (3 - 1.2), 6)
    // Detune counts: the sharper oscillator sets the copy.
    expect(wavetableBand(374, 50, 48000).most).toBe(32)
    expect(wavetableBand(374, 0, 48000).most).toBe(64)
    // At the top of an octave the upper half has faded right out: 12 kHz is left its fundamental.
    expect(wavetableBand(12000, 0, 48000)).toEqual({ whole: 1, most: 2, share: 0 })
  })

  it('filters as `kit::Svf` at the Q of Resonance, with the level Resonance takes off', () => {
    expect(wavetableFilterDb(1000, 1000, 0, 48000)).toBeCloseTo(-3.01, 2)
    expect(wavetableFilterDb(100, 4200, 0, 48000)).toBeCloseTo(0, 2)
    // At full Resonance Q is 12: the peak is 12 high on a passband at √(0.7071 / 12).
    const trade = Math.sqrt(Math.SQRT1_2 / 12)
    expect(wavetableFilterDb(1000, 1000, 1, 48000)).toBeCloseTo(20 * Math.log10(12 * trade), 2)
    expect(wavetableFilterDb(20, 4200, 1, 48000)).toBeCloseTo(20 * Math.log10(trade), 2)
    // Two poles: about 12 dB an octave above the cutoff.
    expect(wavetableFilterDb(4000, 500, 0, 48000)).toBeLessThan(-34)
  })
})

describe('the wavetable’s display', () => {
  const { display } = WAVE_INSTRUMENT_FACES.wavetable
  const params = paramsOf('wavetable')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() }))
  /** The wave a key reads: the strongest line in the ink that is not straight. */
  const read = (paths: DrawnPath[]): DrawnPath =>
    found(
      paths.find(
        (path) =>
          path.kind === 'stroke' && path.colour === ink && path.width === 1.5 && path.alpha === 1,
      ),
    )

  it('lights nothing at rest, and one wave for each key that sounds', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lights(run({}, []))).toHaveLength(0)
    expect(lights(run({}, [note(261.63, 2), note(392, 2)]))).toHaveLength(2)
  })

  it('lets a key swell over Attack and fade over Release, and puts it out when it has', () => {
    const soft = reach(lights(run({ attack: 4, detune: 0 }, [note(261.63, 0.02)]))[0])
    const full = reach(lights(run({ attack: 4, detune: 0 }, [note(261.63, 4)]))[0])
    expect(soft).toBeLessThan(full * 0.7)
    const fading = reach(lights(run({ release: 4, detune: 0 }, [note(261.63, 9, 2)]))[0])
    expect(fading).toBeLessThan(full * 0.6)
    // 60 dB in four seconds: after four the light's scale of 60 dB has run out.
    expect(lights(run({ release: 4 }, [note(261.63, 9, 4.1)]))).toHaveLength(0)
    expect(lights(run({ release: 30 }, [note(261.63, 9, 4.1)]))).toHaveLength(1)
  })

  it('cuts off a held key that is struck again, as the device does', () => {
    const again = [note(261.63, 1, 0.4, 60), note(261.63, 0.4, null, 60)]
    expect(lights(run({ release: 20 }, again))).toHaveLength(1)
  })

  it('draws the wave a key reads at Position, further back in the row the higher it is', () => {
    const front = read(drawnPaths(drawDisplay(display, params, { values: { position: 0 } })))
    const back = read(drawnPaths(drawDisplay(display, params, { values: { position: 1 } })))
    const middle = (path: DrawnPath): number =>
      path.points.reduce((sum, [, y]) => sum + y, 0) / path.points.length
    expect(middle(back)).toBeLessThan(middle(front) - 20)
    // Glass begins as a sine and ends with its partials: the last frame is not one smooth arch.
    const turns = (path: DrawnPath): number =>
      path.points.filter(
        ([, y], index, all) =>
          index > 0 &&
          index < all.length - 1 &&
          (y - all[index - 1][1]) * (all[index + 1][1] - y) < 0,
      ).length
    expect(turns(front)).toBe(4)
    expect(turns(back)).toBeGreaterThan(8)
  })

  it('rounds the wave off as Cutoff comes down', () => {
    const open = read(
      drawnPaths(drawDisplay(display, params, { values: { table: 2, cutoff: 20000 } })),
    )
    const shut = read(
      drawnPaths(drawDisplay(display, params, { values: { table: 2, cutoff: 80 } })),
    )
    // Middle C under a low-pass at 80 Hz is some 20 dB down.
    expect(reach(shut)).toBeLessThan(reach(open) * 0.25)
  })

  it('lets the two oscillators of a key beat from their loudest as Detune slips them apart', () => {
    // 9 cents at 220 Hz is a beat of 1.14 a second: after half of one the two cancel most.
    const beat = 220 * (Math.pow(2, 9 / 2400) - Math.pow(2, -9 / 2400))
    const values = { attack: 0.005, table: 0, position: 0 }
    const together = reach(lights(run(values, [note(220, 2 / beat)]))[0])
    const apart = reach(lights(run(values, [note(220, 2.5 / beat)]))[0])
    expect(apart).toBeLessThan(together * 0.2)
    // Without Detune they stay as one.
    const still = { ...values, detune: 0 }
    expect(reach(lights(run(still, [note(220, 2.5 / beat)]))[0])).toBeCloseTo(
      reach(lights(run(still, [note(220, 2 / beat)]))[0]),
      5,
    )
  })

  it('stands its handle where Position is, and a drag sets it', () => {
    const cases: Record<string, number>[] = [{}, { position: 0 }, { position: 0.85 }]
    for (const values of cases) {
      const view = viewOf(display, params, { values })
      const [position] = display.handles?.(view) ?? []
      expect(position.drag(position.x, position.y).position).toBeCloseTo(view.value('position'), 6)
    }
    const view = viewOf(display, params)
    const [position] = display.handles?.(view) ?? []
    // Up is further back in the row.
    expect(position.drag(position.x, position.y - 10).position).toBeGreaterThan(0.3)
  })
})

describe('the west coast’s figures', () => {
  const timbre: WestCoastTimbre = { fold: 0, symmetry: 0, fm: 0, ratio: 3, timbreEnv: 0 }

  it('folds as `FoldCurve` does: straight through the centre, turned at each threshold', () => {
    expect(westCoastFold(0.3)).toBeCloseTo(0.3, 9)
    expect(westCoastFold(0.45)).toBeCloseTo(0.45, 9)
    // Between two rounded turns the curve lies on the lines between +0.6, −0.7, +0.8, −0.9 and +1.0.
    expect(westCoastFold(1.2)).toBeCloseTo(0.6 - (1.3 / 1.2) * 0.6, 9)
    expect(westCoastFold(2.4)).toBeCloseTo(-0.7 + (1.5 / 1.2) * 0.6, 9)
    expect(westCoastFold(3.55)).toBeCloseTo(0.8 - (1.7 / 1.1) * 0.55, 9)
    expect(westCoastFold(4.8)).toBeCloseTo(-0.9 + (1.9 / 1.4) * 0.7, 9)
    expect(westCoastFold(6.5)).toBeCloseTo(1 - 1.2 * 1, 9)
    // A turn is rounded 0.15 either side: at the threshold the curve is a little inside the corner.
    expect(westCoastFold(0.6)).toBeCloseTo(0.6 - (1 + 1.3 / 1.2) * 0.0375, 9)
    expect(westCoastFold(-2.4)).toBeCloseTo(-westCoastFold(2.4), 12)
  })

  it('enters the folder at the level `aim` works out', () => {
    // Fold 0 stays inside the straight part: a pure sine, nothing to make up.
    const pure = westCoastPoint(timbre, 220, 0)
    expect(pure.level).toBeCloseTo(0.42, 9)
    expect(pure.fundamental).toBeCloseTo(0.42, 6)
    expect(pure.makeup).toBeCloseTo(1, 6)
    // Fold 1 reaches every fold on a low note: 6.3. Half way it is 0.5 to the power 1.5 of the way.
    expect(westCoastPoint({ ...timbre, fold: 1 }, 220, 0).level).toBeCloseTo(6.3, 6)
    expect(westCoastPoint({ ...timbre, fold: 0.5 }, 220, 0).level).toBeCloseTo(
      0.42 + Math.pow(0.5, 1.5) * 5.88,
      6,
    )
    // Timbre Env adds 0.6 of Fold with the gate wide open, and Symmetry an offset that grows with the level.
    const pushed = westCoastPoint({ ...timbre, fold: 0.2, timbreEnv: 0.5, symmetry: 1 }, 220, 1)
    expect(pushed.level).toBeCloseTo(0.42 + Math.pow(0.5, 1.5) * 5.88, 6)
    expect(pushed.offset).toBeCloseTo(0.3 + 0.12 * pushed.level, 9)
    // With overtones in, the make-up brings the level back down.
    expect(pushed.makeup).toBeLessThan(1)
  })

  it('reaches less far into the folder the higher the note and the deeper the FM', () => {
    expect(westCoastSpan(timbre, 220)).toBeCloseTo(5.88, 6)
    expect(westCoastSpan(timbre, 1200)).toBeCloseTo(5.88 / 2, 6)
    expect(westCoastSpan(timbre, 6000)).toBeCloseTo((5.88 * 0.5) / 10, 6)
    expect(westCoastSpan(timbre, 8000)).toBe(0)
    // FM at 2:1 with an index of 4 swings the frequency by 1 + 2 · 4.
    expect(westCoastIndex(1, 3, 220)).toBeCloseTo(4, 9)
    expect(westCoastSpan({ ...timbre, fm: 1 }, 600)).toBeCloseTo(5.88 / 9, 6)
    // A high note gets a smaller index: (14000 / f − 1) / ratio − 2.
    expect(westCoastIndex(1, 3, 2000)).toBeCloseTo(1, 9)
    expect(westCoastIndex(1, 3, 4000)).toBe(0)
    expect(westCoastIndex(0.25, 1, 220)).toBeCloseTo(4 * 0.125, 9)
  })

  /** `WestCoast::render`, one sample at a time: the key's drive and the vactrol that follows it. */
  function rendered(
    seconds: number,
    heldFor: number | null,
    gain: number,
    gate: WestCoastGate,
    sampleRate = 48000,
  ): number {
    const strike = 0.55 + 0.45 * gain
    const held = strike * 0.7
    const quick = gate.attack <= 0.02
    const rampTo = quick ? strike : held
    const rampStep = 1 / Math.max(1, gate.attack * sampleRate)
    const rise = 1 - Math.exp(-1 / (0.0007 * sampleRate))
    const fall = Math.min(0.5, 21 / (gate.decay * sampleRate))
    const holdSamples = Math.floor(0.002 * sampleRate) + 1
    let stage: 'strike' | 'hold' | 'sustain' | 'release' = 'strike'
    let keyDown = true
    let ramp = 0
    let holdLeft = 0
    let vactrol = 0
    for (let n = 0; n < Math.round(seconds * sampleRate); n++) {
      if (keyDown && heldFor !== null && n >= Math.round(heldFor * sampleRate)) {
        keyDown = false
        if (!(quick && (stage === 'strike' || stage === 'hold'))) stage = 'release'
      }
      let control = 0
      if (stage === 'sustain') control = held * gate.sustain
      else if (stage === 'strike') {
        ramp += rampStep
        if (ramp >= 1) {
          ramp = 1
          stage = 'hold'
          holdLeft = holdSamples
        }
        control = rampTo * ramp
      } else if (stage === 'hold') {
        control = rampTo
        if (--holdLeft <= 0) stage = keyDown ? 'sustain' : 'release'
      }
      if (control > vactrol) vactrol += (control - vactrol) * rise
      else vactrol -= (vactrol - control) * fall * (0.25 + 0.75 * vactrol)
    }
    return vactrol
  }

  it('opens and closes its gate as `render` does sample by sample', () => {
    const cases: [WestCoastGate, number | null, number][] = [
      [{ attack: 0.001, decay: 1.4, sustain: 0 }, null, 0.7],
      [{ attack: 0.001, decay: 1.4, sustain: 0 }, 0.0005, 1],
      [{ attack: 0.01, decay: 0.3, sustain: 0.6 }, null, 1],
      [{ attack: 0.01, decay: 0.3, sustain: 0.6 }, 0.25, 0.4],
      [{ attack: 0.5, decay: 2, sustain: 1 }, null, 1],
      [{ attack: 0.5, decay: 2, sustain: 0.3 }, 0.9, 0.8],
      [{ attack: 0.5, decay: 2, sustain: 0.3 }, 0.2, 0.8],
    ]
    for (const [gate, heldFor, gain] of cases) {
      for (const seconds of [0.02, 0.1, 0.3, 0.6, 1.2, 2]) {
        const device = rendered(seconds, heldFor, gain, gate)
        const drawn = westCoastGate(seconds, heldFor, gain, gate)
        // The vactrol's own rise of 0.7 ms is left out of the drawing: within a twentieth, or 60 dB down.
        expect(Math.abs(drawn - device)).toBeLessThan(Math.max(0.05 * device, 0.001))
      }
    }
  })

  it('takes Decay to fall 60 dB after a strike', () => {
    const gate: WestCoastGate = { attack: 0.001, decay: 2, sustain: 0 }
    const db = (seconds: number): number => 20 * Math.log10(westCoastGate(seconds, 0, 1, gate))
    expect(db(0.003)).toBeCloseTo(0, 1)
    expect(db(2)).toBeGreaterThan(-60)
    expect(db(2.2)).toBeLessThan(-60)
    // Fast at first, then slower: the first 20 dB take a fifth of the time the last 20 do.
    expect(db(0.5)).toBeLessThan(-20)
  })

  it('opens its low-pass from the note itself, as far as Colour and the strike let it', () => {
    expect(westCoastCutoff(220, 0.6, 1, 0, 48000)).toBe(220)
    expect(westCoastCutoff(220, 1, 1, 1, 48000)).toBeCloseTo(220 + 18000, 6)
    // Colour 0 opens it to twice the note above the note, and no lower than 150 Hz above it.
    expect(westCoastCutoff(220, 0, 1, 1, 48000)).toBeCloseTo(220 + 440, 6)
    expect(westCoastCutoff(55, 0, 1, 1, 48000)).toBeCloseTo(55 + 150, 6)
    // Half open, the low-pass is less than half open: half with the gate, half with its square.
    expect(westCoastCutoff(220, 1, 1, 0.5, 48000)).toBeCloseTo(220 + 18000 * 0.5 * 0.75, 6)
    // A softer strike opens it less far: by strike / (0.5 + 0.5 strike).
    expect(westCoastCutoff(220, 1, 0, 1, 48000)).toBeCloseTo(220 + (18000 * 0.55) / 0.775, 6)
    // And never past 0.2 of twice the sample rate.
    expect(westCoastCutoff(4000, 1, 1, 1, 44100)).toBeCloseTo(0.4 * 44100, 6)
  })
})

describe('the west coast’s display', () => {
  const { display } = WAVE_INSTRUMENT_FACES['west-coast']
  const params = paramsOf('west-coast')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() }))
  /** A note on the gate: an upright line in the accent from the foot to its level. */
  const stems = (paths: DrawnPath[]): DrawnPath[] =>
    lights(paths).filter((path) => path.points.length === 2)
  /** The wave of the newest note: the long line in the accent. */
  const wave = (paths: DrawnPath[]): DrawnPath =>
    found(lights(paths).find((path) => path.points.length > 100))
  /** The wave of a note as struck: the long strong line in the ink. */
  const struck = (paths: DrawnPath[]): DrawnPath =>
    found(
      paths.find(
        (path) => path.kind === 'stroke' && path.colour === ink && path.points.length > 100,
      ),
    )
  const turns = (path: DrawnPath): number =>
    path.points.filter(
      ([, y], index, all) =>
        index > 0 &&
        index < all.length - 1 &&
        (y - all[index - 1][1]) * (all[index + 1][1] - y) < 0,
    ).length

  it('lights nothing at rest, and stands each note that sounds on the gate', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lights(run({}, []))).toHaveLength(0)
    const three = run({}, [note(220, 0.4), note(330, 0.2), note(440, 0.1)])
    expect(stems(three)).toHaveLength(3)
    // Three notes, the wave of the newest and how far it reaches into the folder.
    expect(lights(three)).toHaveLength(5)
  })

  it('moves a note along the scale of time, sinking as the gate closes, and out when it is shut', () => {
    const early = stems(run({ decay: 2 }, [note(220, 0.05)]))[0]
    const late = stems(run({ decay: 2 }, [note(220, 1)]))[0]
    expect(late.points[0][0]).toBeGreaterThan(early.points[0][0] + 40)
    expect(reach(late)).toBeLessThan(reach(early) * 0.6)
    // 72 dB down the device stops the voice: the last 12 dB are slow, so a third again after Decay.
    expect(stems(run({ decay: 2 }, [note(220, 2.4)]))).toHaveLength(1)
    expect(stems(run({ decay: 2 }, [note(220, 3)]))).toHaveLength(0)
    expect(stems(run({ decay: 8 }, [note(220, 3)]))).toHaveLength(1)
  })

  it('keeps a held note open as far as Sustain says, and lets it fall when the key goes up', () => {
    const plucked = stems(run({ sustain: 0, decay: 0.5 }, [note(220, 3)]))
    expect(plucked).toHaveLength(0)
    const held = stems(run({ sustain: 1, decay: 0.5 }, [note(220, 3)]))[0]
    const half = stems(run({ sustain: 0.1, decay: 0.5 }, [note(220, 3)]))[0]
    expect(reach(half)).toBeLessThan(reach(held))
    expect(stems(run({ sustain: 1, decay: 0.5 }, [note(220, 3, 1)]))).toHaveLength(0)
  })

  it('strikes one gate again when a key is played again while it rings', () => {
    const again = [note(220, 0.5, 0.3, 57), note(220, 0.1, null, 57)]
    expect(stems(run({}, again))).toHaveLength(1)
  })

  it('folds the wave as Fold comes up, and shows a ringing note smaller and duller', () => {
    const draw = (values: Record<string, number>) =>
      struck(drawnPaths(drawDisplay(display, params, { values })))
    const none = { timbreEnv: 0, fm: 0, symmetry: 0, colour: 1 }
    // Fold 0 is a sine: two cycles, four turns. Fold 1 turns the wave over many times in each.
    expect(turns(draw({ ...none, fold: 0 }))).toBe(4)
    expect(turns(draw({ ...none, fold: 1 }))).toBeGreaterThan(30)
    // A ringing note: the gate has closed most of the way, the wave is small and has lost its folds.
    const values = { ...none, fold: 1, decay: 1, chance: 0, drift: 0 }
    const fresh = wave(run(values, [note(220, 0.004)]))
    const rung = wave(run(values, [note(220, 0.7)]))
    expect(reach(rung)).toBeLessThan(reach(fresh) * 0.6)
    expect(turns(rung)).toBeLessThan(turns(fresh) / 2)
  })

  it('draws the tallest wave whole: none is cut flat where the device does not cut it', () => {
    // Full Fold far off centre is the tallest the device makes: 2.3 of a sine.
    const values = { fold: 0.98, symmetry: 0.85, fm: 0.5, ratio: 1, timbreEnv: 0, colour: 1 }
    const tall = struck(drawnPaths(drawDisplay(display, params, { values, width: 204 })))
    const ys = tall.points.map(([, y]) => y)
    for (const edge of [Math.min(...ys), Math.max(...ys)])
      expect(ys.filter((y) => y === edge).length).toBeLessThanOrEqual(2)
    // A sine is half as tall as its box has room for.
    const sine = struck(
      drawnPaths(
        drawDisplay(display, params, {
          values: { ...values, fold: 0, fm: 0, symmetry: 0 },
          width: 204,
        }),
      ),
    )
    expect(reach(sine)).toBeCloseTo(47 / 2, 1)
  })

  it('names the second clear of the Decay handle, at either width', () => {
    for (const width of [204, 128]) {
      for (let decay = 0.05; decay <= 8; decay *= 1.05) {
        for (const attack of [0.001, 0.3]) {
          const options = { values: { decay, attack }, width }
          const drawn = drawDisplay(display, params, options)
          const [, handle] = display.handles?.(viewOf(display, params, options)) ?? []
          let align = 'left'
          let left = Number.NaN
          for (const call of drawn.calls) {
            if (call.name === 'set textAlign') align = String(call.args[0])
            // The harness measures five pixels to a letter.
            if (call.name === 'fillText' && call.args[0] === '1 s')
              left = (call.args[1] as number) - (align === 'right' ? 15 : 0)
          }
          // The ring is 3.5 in radius with a line 1.5 wide.
          const clear = handle.x + 4.25 <= left || handle.x - 4.25 >= left + 15
          expect(clear, `decay ${decay} attack ${attack} at ${width}`).toBe(true)
        }
      }
    }
  })

  it('stands its handles where Fold and Decay are, and a drag sets them', () => {
    const cases: Record<string, number>[] = [
      {},
      { fold: 0.6, timbreEnv: 0.2, symmetry: 1, decay: 0.2 },
      { attack: 2, decay: 6 },
    ]
    for (const values of cases) {
      const view = viewOf(display, params, { values })
      const [fold, decay] = display.handles?.(view) ?? []
      expect(fold.drag(fold.x, fold.y).fold).toBeCloseTo(view.value('fold'), 6)
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 6)
      // Further out is more Fold, further right a longer Decay.
      expect(fold.drag(fold.x + 4, fold.y).fold).toBeGreaterThan(view.value('fold'))
      expect(decay.drag(decay.x + 10, decay.y).decay).toBeGreaterThan(view.value('decay'))
    }
    // Past the last fold the handle waits at the end, and Fold moves from where it stands.
    const full = viewOf(display, params, { values: { fold: 1, timbreEnv: 1 } })
    const [fold] = display.handles?.(full) ?? []
    const hold = {}
    expect(fold.drag(fold.x, fold.y, hold).fold).toBeCloseTo(1, 6)
    expect(fold.drag(fold.x - 6, fold.y, hold).fold).toBeLessThan(1)
  })
})

describe('the drone’s figures', () => {
  it('brings its partials in one after another at one power, as `update` does', () => {
    expect(dronePartials(2, 0, 110, 48000, [])).toEqual([1, 0, 0, 0, 0, 0, 0, 0])
    // Fifths, all in: each falls off as the root of its ratio, and the squares add up to 1.
    const fifths = dronePartials(2, 1, 110, 48000, [])
    expect(fifths.reduce((sum, level) => sum + level * level, 0)).toBeCloseTo(1, 9)
    expect(fifths[1] / fifths[0]).toBeCloseTo(1 / Math.sqrt(1.5), 9)
    expect(fifths[7] / fifths[0]).toBeCloseTo(1 / Math.sqrt(12), 9)
    // Half way the fifth partial is half in: 1 + 7 · 0.5 reaches 4.5.
    const half = dronePartials(3, 0.5, 110, 48000, [])
    expect(half[4] / half[0]).toBeCloseTo(0.5 / Math.sqrt(5), 9)
    expect(half[5]).toBe(0)
    // A partial that would pass 0.45 of the sample rate is left out: 4 kHz · 8 is 32 kHz.
    const high = dronePartials(3, 1, 4000, 48000, [])
    expect(high[4]).toBeGreaterThan(0)
    expect(high[5]).toBe(0)
  })

  it('morphs a partial from a sine through a triangle to a sawtooth', () => {
    expect(droneHarmonic(1, 0)).toBe(1)
    expect(droneHarmonic(3, 0)).toBe(0)
    expect(droneHarmonic(1, 0.5)).toBeCloseTo(8 / (Math.PI * Math.PI), 9)
    expect(droneHarmonic(3, 0.5)).toBeCloseTo(8 / (9 * Math.PI * Math.PI), 9)
    expect(droneHarmonic(2, 0.5)).toBe(0)
    expect(droneHarmonic(2, 1)).toBeCloseTo(1 / Math.PI, 9)
    expect(droneHarmonic(5, 1)).toBeCloseTo(2 / (5 * Math.PI), 9)
    // Half way between the two the even harmonics are half in.
    expect(droneHarmonic(2, 0.75)).toBeCloseTo(0.5 / Math.PI, 9)
  })

  it('reads a partial from the copy that keeps its harmonics under Nyquist, and filters as `kit::Svf`', () => {
    // 440 / 48000 · 1.01 · 1024 is 9.5: the copy with 32 harmonics.
    expect(droneTop(440, 48000)).toBe(32)
    expect(droneTop(40, 48000)).toBe(512)
    expect(droneLowpassDb(2400, 2400, 48000)).toBeCloseTo(-3.01, 2)
    expect(droneLowpassDb(100, 2400, 48000)).toBeCloseTo(0, 3)
    expect(droneLowpassDb(4800, 2400, 48000)).toBeLessThan(-12)
  })

  /** Seconds since each key began to fade at `now`: −1 for one that sounds on, NaN for one that started nothing. */
  const fades = (keys: DroneKey[], now: number): number[] =>
    keys.map((key) =>
      key.none ? Number.NaN : Number.isNaN(key.fade) ? -1 : now - key.on - key.fade,
    )

  it('lets a key go at key up, or keeps it under Hold until the key is played again', () => {
    const notes = [note(110, 9, 6), note(165, 8), note(110, 3, 2)]
    expect(fades(droneFollow([], notes, 50, false), 50)).toEqual([6, -1, 2])
    // Under Hold the first sounds on after its key went up, until the same key is played again:
    // that press lets it go, three seconds ago, and starts nothing (`Drone::note_on`).
    expect(fades(droneFollow([], notes, 50, true), 50)).toEqual([3, -1, Number.NaN])
    // The same key is the same pitch too, whatever id it comes with (`find_key`).
    const other = [note(110, 9, 6, 1), note(110.01, 3, 2, 2), note(110, 1, null, 3)]
    expect(fades(droneFollow([], other, 50, true), 50)).toEqual([3, Number.NaN, -1])
    // Without Hold a held key struck again is cut off, and the new one sounds.
    const again = [note(110, 1, 0.4, 60), note(110, 0.4, null, 60)]
    expect(fades(droneFollow([], again, 50, false), 50)).toEqual([Number.NaN, -1])
  })

  it('lets go what Hold kept when Hold is switched off, from then and not from key up', () => {
    const keys = droneFollow([], [note(110, 9, 6), note(165, 8)], 50, true)
    expect(fades(keys, 50)).toEqual([-1, -1])
    droneFree(keys, 52)
    // The key that is still down stays (`apply`: `!voice.key_down`).
    expect(fades(keys, 54)).toEqual([2, -1])
    // A key let go while Hold was off was fading already: Hold switched on does not bring it back.
    const faded = droneFollow([], [note(110, 9, 6)], 50, false)
    droneFollow(faded, [note(110, 10, 7)], 51, true)
    expect(fades(faded, 51)).toEqual([7])
  })

  it('remembers a drone that Hold keeps after the list of notes has forgotten its key', () => {
    const keys = droneFollow([], [note(110, 5, 4)], 50, true)
    // Thirty seconds on the list is empty, and the drone sounds on.
    droneFollow(keys, [], 80, true)
    expect(fades(keys, 80)).toEqual([-1])
    expect(droneKeyLevel(keys[0], 80, 3, 6)).toBe(1)
    // Its key played again lets it go and starts nothing.
    droneFollow(keys, [note(110, 0.5)], 90, true)
    expect(fades(keys, 90)).toEqual([0.5, Number.NaN])
    expect(droneKeyLevel(keys[0], 90, 3, 6)).toBeCloseTo(Math.pow(10, -0.25), 6)
    expect(droneKeyLevel(keys[1], 90, 3, 6)).toBe(0)
    // Both are dropped once the fade is over and the list has forgotten the second press.
    droneFollow(keys, [], 125, true)
    expect(keys).toHaveLength(0)
  })

  it('drops what the list has forgotten when nothing comes out, or when its key was still down', () => {
    const kept = droneFollow([], [note(110, 5, 4)], 50, true)
    expect(droneFollow(kept, [note(110, 6, 5)], 51, true, true)).toHaveLength(1)
    expect(droneFollow(kept, [], 80, true, true)).toHaveLength(0)
    // The list forgets no key that is down: where one is gone, the list was emptied.
    const down = droneFollow([], [note(165, 8)], 50, true)
    expect(droneFollow(down, [], 51, true)).toHaveLength(0)
    // No more of them are kept than the device has voices.
    const many = Array.from({ length: 10 }, (_, k) => note(100 + 10 * k, 5, 4))
    expect(droneFollow(droneFollow([], many, 50, true), [], 80, true)).toHaveLength(8)
  })
})

describe('the drone’s display', () => {
  const { display } = WAVE_INSTRUMENT_FACES.drone
  const params = paramsOf('drone')
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() }))
  /** The bars of a path: one for each partial, and one for the sub. */
  const bars = (path: DrawnPath): number => path.points.length / 2
  const tallest = (path: DrawnPath): number => reach(path)

  it('lights nothing at rest, and one set of partials for each key that sounds', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lights(run({}, []))).toHaveLength(0)
    expect(lights(run({}, [note(110, 4), note(165, 4)]))).toHaveLength(2)
  })

  it('lights as many partials as Partials has brought in, and the sub', () => {
    const one = lights(run({ partials: 0, sub: 0 }, [note(110, 4)]))[0]
    expect(bars(one)).toBe(1)
    expect(bars(lights(run({ partials: 0, sub: 0.5 }, [note(110, 4)]))[0])).toBe(2)
    expect(bars(lights(run({ partials: 1, sub: 0 }, [note(110, 4)]))[0])).toBe(8)
    // 1 + 7 · 0.6 reaches 5.2: six partials, the last one faint.
    expect(bars(lights(run({ partials: 0.6, sub: 0 }, [note(110, 4)]))[0])).toBe(6)
  })

  it('stands the partials where the shape puts them', () => {
    const xs = (shape: number): number[] => [
      ...new Set(
        lights(run({ shape, partials: 1, sub: 0 }, [note(110, 4)]))[0].points.map(([x]) => x),
      ),
    ]
    // Fifths: 1, 1.5, 2, 3, 4, 6, 8, 12 are eight pitches, an octave the same distance each time.
    const fifths = xs(2).sort((a, b) => a - b)
    expect(fifths).toHaveLength(8)
    expect(fifths[4] - fifths[2]).toBeCloseTo(fifths[2] - fifths[0], 0)
    // Unison: eight on one pitch, side by side.
    const unison = xs(0).sort((a, b) => a - b)
    expect(unison).toHaveLength(8)
    expect(unison[7] - unison[0]).toBeLessThan(20)
  })

  it('lets a key swell over Attack and fade over Release, and puts it out when it has', () => {
    const values = { partials: 0, sub: 0 }
    const full = tallest(lights(run({ ...values, attack: 3 }, [note(110, 4)]))[0])
    const rising = tallest(lights(run({ ...values, attack: 30 }, [note(110, 0.3)]))[0])
    expect(rising).toBeLessThan(full * 0.7)
    const fading = tallest(lights(run({ ...values, attack: 3, release: 6 }, [note(110, 9, 3)]))[0])
    expect(fading).toBeLessThan(full * 0.5)
    expect(lights(run({ ...values, release: 6 }, [note(110, 20, 6)]))).toHaveLength(0)
    expect(lights(run({ ...values, release: 30 }, [note(110, 20, 6)]))).toHaveLength(1)
  })

  it('keeps a key sounding under Hold, until it is played again', () => {
    const let_go = [note(110, 18, 15)]
    expect(lights(run({ hold: 0 }, let_go))).toHaveLength(0)
    expect(lights(run({ hold: 1 }, let_go))).toHaveLength(1)
    // The second press lets the drone go and starts nothing: one light, and it fades.
    const twice = [note(110, 18, 15), note(110, 3, 2)]
    const values = { hold: 1, partials: 0, sub: 0, release: 6 }
    const fading = lights(run(values, twice))
    expect(fading).toHaveLength(1)
    expect(tallest(fading[0])).toBeLessThan(tallest(lights(run(values, let_go))[0]) * 0.7)
  })

  it('keeps a drone lit that Hold keeps, long after the list of notes has forgotten its key', () => {
    const state = display.init?.()
    const values = { hold: 1, partials: 0, sub: 0, release: 6 }
    const at = (now: number, notes: DisplayNote[], signal = testSignal(), hold = 1) =>
      lights(
        drawnPaths(
          drawDisplay(display, params, {
            values: { ...values, hold },
            notes,
            signal,
            state,
            now,
            dt: 0.03,
          }),
        ),
      )
    const full = at(10, [note(110, 5, 4)])
    expect(full).toHaveLength(1)
    // The list keeps a key twenty seconds after it went up; the drone is still there after fifty.
    expect(at(60, [])).toHaveLength(1)
    // A still draw (bypassed, out of view) lights nothing and forgets nothing.
    expect(lights(drawnPaths(drawDisplay(display, params, { values, state, now: 61 })))).toEqual([])
    expect(at(62, [])).toHaveLength(1)
    // The second press lets it go: it fades over Release and is out, and the press lit nothing.
    const fading = at(65, [note(110, 3, 2)])
    expect(fading).toHaveLength(1)
    expect(tallest(fading[0])).toBeLessThan(tallest(full[0]) * 0.7)
    expect(at(70, [note(110, 8, 7)])).toHaveLength(0)
  })

  it('puts out a kept drone when Hold goes off, and when nothing comes out of the device', () => {
    const values = { hold: 1, partials: 0, sub: 0, release: 6 }
    const frame = (state: unknown, now: number, hold: number, signal = testSignal()) =>
      lights(
        drawnPaths(
          drawDisplay(display, params, {
            values: { ...values, hold },
            notes: now < 20 ? [note(110, 5, 4)] : [],
            signal,
            state,
            now,
            dt: 0.03,
          }),
        ),
      )
    const freed = display.init?.()
    const full = frame(freed, 10, 1)
    expect(frame(freed, 60, 1)).toHaveLength(1)
    // Hold switched off: it fades from that moment.
    expect(tallest(frame(freed, 61, 0)[0])).toBeCloseTo(tallest(full[0]), 6)
    expect(tallest(frame(freed, 63, 0)[0])).toBeLessThan(tallest(full[0]) * 0.7)
    expect(frame(freed, 68, 0)).toHaveLength(0)
    // Silence for more than a second: no drone is left. A frame of it says nothing yet.
    const silenced = display.init?.()
    frame(silenced, 10, 1)
    expect(frame(silenced, 60, 1, testSignal(0, 0))).toHaveLength(1)
    for (let n = 1; n <= 40; n++) frame(silenced, 60 + n * 0.03, 1, testSignal(0, 0))
    expect(frame(silenced, 62, 1)).toHaveLength(0)
  })

  it('marks where the partials sit between the speakers both ways round', () => {
    // Fifths with two partials in: the root in the middle and the fifth 0.8 of the way out
    // at full Width, to the left on one voice and to the right on the next (`pan_base`).
    const ticks = (width: number): number[] =>
      drawnPaths(drawDisplay(display, params, { values: { partials: 1 / 7, width }, width: 204 }))
        .filter(
          (path) =>
            path.kind === 'stroke' &&
            path.points.length === 2 &&
            path.points[0][0] === path.points[1][0] &&
            Math.abs(path.points[1][1] - path.points[0][1]) === 3,
        )
        // A rule is drawn on the middle of its pixel.
        .map((path) => Math.floor(path.points[0][0]))
        .sort((a, b) => a - b)
    const wide = ticks(1)
    expect(wide).toHaveLength(3)
    expect(wide).toEqual([102 - 0.8 * 95, 102, 102 + 0.8 * 95])
    expect(new Set(ticks(0))).toEqual(new Set([102]))
  })

  it('shortens what the low-pass cuts', () => {
    const values = { shape: 3, partials: 1, sub: 0, wave: 0 }
    const height = (cutoff: number): number =>
      Math.min(
        ...lights(run({ ...values, cutoff }, [note(220, 9)]))[0]
          .points.filter((_, index) => index % 2 === 1)
          .slice(-1)
          .map(([, y]) => y),
      )
    // The eighth harmonic of 220 Hz is 1760 Hz: far under a cutoff at 16 kHz, well over one at 400 Hz.
    expect(height(400)).toBeGreaterThan(height(16000) + 20)
  })

  it('stands its handle where Cutoff is, and a drag sets it', () => {
    const cases: Record<string, number>[] = [{}, { cutoff: 60 }, { cutoff: 16000 }]
    for (const values of cases) {
      const view = viewOf(display, params, { values })
      const [cutoff] = display.handles?.(view) ?? []
      expect(cutoff.drag(cutoff.x, cutoff.y).cutoff / view.value('cutoff')).toBeCloseTo(1, 6)
      expect(cutoff.drag(cutoff.x + 10, cutoff.y).cutoff).toBeGreaterThan(view.value('cutoff'))
    }
  })
})
