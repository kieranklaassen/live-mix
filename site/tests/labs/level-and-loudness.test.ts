import { beforeAll, describe, expect, it } from 'vitest'
import {
  Biquad,
  kWeightingCoefficients,
  LoudnessAnalyzer,
} from '../../../src/core/analysis/loudness.ts'
import type { Lab, RenderResult } from '../../src/lab/runner.ts'
import { readSettings, resolveSet } from '../../src/lib/settings.ts'
import {
  benchSource,
  dbToGain,
  differenceDb,
  expectBuild,
  expectSoundLab,
  expectWritten,
  gainToDb,
  lab,
  matchesWritten,
  peak,
  range,
  RATE,
  rms,
  seconds,
  type Source,
} from './support.ts'

const FRAMES = seconds(4)
/** A tenth of a second: the step of the loudness meter's blocks. */
const TENTH = RATE / 10
/** The six loops of music the bench plays. */
const LOOPS = ['drums', 'guitar', 'chords', 'bass', 'pad', 'mix'] as const

const tap = (result: RenderResult, id: string, channel = 0) =>
  result.taps[id]!.channels_data[channel]!
const check = (result: RenderResult, id: string) => {
  const value = result.checks[id]
  if (value === undefined) throw new Error(`The lab has no check called ${id}`)
  return value
}

/** A sine on both channels that starts `turn` of a turn in. `height` is its amplitude. */
function tone(hz: number, height: number, turn = 0): Source {
  const left = new Float32Array(FRAMES)
  for (let i = 0; i < FRAMES; i += 1)
    left[i] = height * Math.sin(2 * Math.PI * (turn + (hz * i) / RATE))
  return { left, right: left.slice() }
}

/** The tallest sample of a stereo tap, in dB against full scale. */
const topOf = (result: RenderResult, id: string) =>
  gainToDb(Math.max(peak(tap(result, id, 0)), peak(tap(result, id, 1))))
/** The level of a stereo tap over the whole loop, both channels, in dB against full scale. */
const levelOf = (result: RenderResult, id: string) =>
  gainToDb(Math.sqrt(0.5 * (rms(tap(result, id, 0)) ** 2 + rms(tap(result, id, 1)) ** 2)))

/** The engine's own loudness meter after it has heard a stereo tap twice from rest. */
function engineMeter(result: RenderResult, id = 'out'): LoudnessAnalyzer {
  const analyser = new LoudnessAnalyzer(RATE)
  for (let pass = 0; pass < 2; pass += 1) analyser.process(tap(result, id, 0), tap(result, id, 1))
  return analyser
}

let meter: Lab
const loop: Record<string, Source> = {}
/** The lab at its starting values on each loop: most tests read these. */
const plain: Record<string, RenderResult> = {}

beforeAll(async () => {
  meter = await lab('level-and-loudness')
  for (const id of [...LOOPS, 'noise', 'sine']) {
    loop[id] = await benchSource(id, FRAMES)
    plain[id] = meter.render(loop[id]!, {})
  }
})

describe('the lab', () => {
  it('is sound on the drum loop: every tap says something, every sound loops, every control moves a tap', () => {
    expectSoundLab(meter, loop.drums!, meter.render(loop.drums!, {}))
  })

  it('has a build part: six steps, each changing a built tap, the fourth held to the engine', () => {
    expectBuild(meter, loop.drums!)
  })
})

describe("the engine's readings", () => {
  it("the peak is the limiter's own hold: the largest sample of the last 40 to 41.25 ms", () => {
    // 32 slices of 60 samples, and the slice being filled: between 1,920 and 1,979 samples.
    for (const id of ['drums', 'pad']) {
      const out = [tap(plain[id]!, 'out', 0), tap(plain[id]!, 'out', 1)]
      const held = tap(plain[id]!, 'peak')
      const largest = (to: number, count: number) => {
        let top = 0
        for (let back = 0; back < count; back += 1) {
          const n = (to - back + FRAMES) % FRAMES
          top = Math.max(top, Math.abs(out[0]![n]!), Math.abs(out[1]![n]!))
        }
        return top
      }
      // The tap never reads under −100 dB, which is a height of 0.00001.
      const floored = (height: number) => Math.max(height, 1e-5)
      for (let k = 70; k < held.length; k += 97) {
        const reading = dbToGain(held[k]!)
        const least = floored(largest(16 * k, 1920))
        const most = floored(largest(16 * k, 1980))
        expect(reading, `${id}, point ${k}`).toBeGreaterThanOrEqual(least * 0.9999)
        expect(reading, `${id}, point ${k}`).toBeLessThanOrEqual(most * 1.0001)
      }
    }
  })

  it("the peak between the samples is what the engine's TypeScript meter reads on the same sound", () => {
    for (const id of ['drums', 'pad', 'noise']) {
      const engine = gainToDb(engineMeter(plain[id]!).read().maxTruePeak)
      expect(Math.abs(check(plain[id]!, 'wavePeak') - engine), id).toBeLessThan(0.001)
    }
  })

  it("the level taken again from the compressor's power lands on the compressor's own follower (claim level-rebuilt)", () => {
    const worst = Math.max(...Object.values(plain).map((result) => check(result, 'levelRebuilt')))
    expectWritten(worst, 'less than 0.001 dB')
  })

  it('the tone at 1 kHz reads 3.01 dB under its tallest sample over the whole loop, and the sine at 440 Hz reads 3.01 dB under its own on the detector (claim sine-level)', () => {
    const drums = plain.drums!
    expectWritten(check(drums, 'tonePeak') - check(drums, 'toneLevel'), '3.01 dB')
    // The bench's own sine, 440 Hz on both channels, through the compressor's detector.
    const sine = plain.sine!
    const read = range(tap(sine, 'level'))
    expectWritten(check(sine, 'samplePeak') - read.hi, '3.01 dB')
    expectWritten(check(sine, 'samplePeak') - read.lo, '3.01 dB')
  })

  it('the detector holds a 100 Hz tone still to less than 0.01 dB (claim two-poles)', () => {
    const result = meter.render(tone(100, 0.5), {})
    expectWritten(range(tap(result, 'level')).span, 'less than 0.01 dB')
  })

  it("on a 100 Hz tone what the device's first filter holds moves by 0.23 dB (claim one-pole)", () => {
    // The lab reads the first of the compressor's two one-poles at every sample of the kept pass.
    const result = meter.render(tone(100, 0.5), {})
    expectWritten(check(result, 'firstPole'), '0.23 dB')
    // The same filter worked out here on the same sound: a one-pole of 30 ms on the mean of the
    // two channels' squares, run twice round the loop.
    const out = [tap(result, 'out', 0), tap(result, 'out', 1)]
    const keep = Math.exp(-1 / (0.03 * RATE))
    let held = 0
    let least = Infinity
    let most = 0
    for (let i = 0; i < 2 * FRAMES; i += 1) {
      const n = i % FRAMES
      held = keep * held + (1 - keep) * 0.5 * (out[0]![n]! ** 2 + out[1]![n]! ** 2)
      if (i < FRAMES) continue
      least = Math.min(least, held)
      most = Math.max(most, held)
    }
    expect(Math.abs(10 * Math.log10(most / least) - check(result, 'firstPole'))).toBeLessThan(0.005)
    // And the second filter is what stills it: the reading moves a tenth as far, and less.
    expect(range(tap(result, 'level')).span).toBeLessThan(check(result, 'firstPole') / 10)
  })
})

describe("the lesson's own stages, against the engine's TypeScript", () => {
  it("the weighted sound is the engine's two filters on the same sound, to at least 77 dB under it on either channel (claim weighting-held)", () => {
    const coefficients = kWeightingCoefficients(RATE)
    let worst = -Infinity
    for (const id of [...LOOPS, 'noise']) {
      for (const channel of [0, 1]) {
        const out = tap(plain[id]!, 'out', channel)
        const filters = [new Biquad(coefficients.shelf), new Biquad(coefficients.highpass)]
        const heard = new Float32Array(FRAMES)
        // Twice, as the lab hears the loop, and the second pass kept.
        for (let pass = 0; pass < 2; pass += 1)
          for (let i = 0; i < FRAMES; i += 1)
            heard[i] = filters[1]!.process(filters[0]!.process(out[i]!))
        worst = Math.max(worst, differenceDb(tap(plain[id]!, 'weighted', channel), heard))
      }
    }
    expectWritten(-worst, 'at least 77 dB')
    // The bound is the measurement and not a floor: the two are not the same numbers.
    expect(-worst).toBeLessThan(80)
  })

  it("on the six loops the loudness of each block is less than 0.001 LU from the engine's momentary loudness after every tenth of a second (claim blocks-held)", () => {
    let worst = 0
    let read = 0
    for (const id of LOOPS) {
      const out = [tap(plain[id]!, 'out', 0), tap(plain[id]!, 'out', 1)]
      const analyser = new LoudnessAnalyzer(RATE)
      const lane = tap(plain[id]!, 'momentary')
      for (let tenth = 0; tenth < (2 * FRAMES) / TENTH; tenth += 1) {
        const from = (tenth * TENTH) % FRAMES
        analyser.process(out[0]!.subarray(from, from + TENTH), out[1]!.subarray(from, from + TENTH))
        // The tap keeps the second pass: read it a twentieth of a second after the block is done.
        const done = (tenth + 1) * TENTH
        if (done < FRAMES || done >= 2 * FRAMES) continue
        const engine = Math.max(-100, analyser.momentary)
        const at = (done - FRAMES + TENTH / 2) / 16
        worst = Math.max(worst, Math.abs(lane[at]! - engine))
        read += 1
      }
    }
    // Forty tenths of a second of each loop.
    expect(read).toBe(40 * LOOPS.length)
    expectWritten(worst, 'less than 0.001 LU')
  })

  it("the gated loudness is the engine's integrated loudness to less than 0.001 LU (claim loudness-held)", () => {
    let worst = 0
    const heard = [
      ...LOOPS.map((id) => plain[id]!),
      meter.render(loop.pad!, { silence: 50 }),
      meter.render(loop.chords!, { silence: 25 }),
      meter.render(loop.drums!, { setBy: 3, fader: -9 }),
    ]
    for (const result of heard) {
      const engine = engineMeter(result).integrated
      worst = Math.max(worst, Math.abs(check(result, 'loopLoudness') - engine))
    }
    expectWritten(worst, 'less than 0.001 LU')
  })
})

describe('equal peaks, unequal loudness', () => {
  it('the tone is as tall as the drum loop to less than 0.01 dB, and 15.7 dB over it in level (claim equal-peaks)', () => {
    const drums = plain.drums!
    expectWritten(
      Math.abs(check(drums, 'tonePeak') - check(drums, 'samplePeak')),
      'less than 0.01 dB',
    )
    expectWritten(check(drums, 'toneLevel') - check(drums, 'loopLevel'), '15.7 dB')
  })

  it('set by peak, the drums and the pad are equally tall, 6.0 dB apart in level and 6.8 LU in loudness (claim by-peak)', () => {
    const drums = meter.render(loop.drums!, { setBy: 1 })
    const pad = meter.render(loop.pad!, { setBy: 1 })
    expectWritten(
      Math.abs(check(pad, 'samplePeak') - check(drums, 'samplePeak')),
      'less than 0.01 dB',
    )
    expectWritten(check(drums, 'samplePeak'), '−6.02 dB')
    expectWritten(check(pad, 'samplePeak'), '−6.02 dB')
    expectWritten(check(pad, 'loopLevel') - check(drums, 'loopLevel'), '6.0 dB')
    expectWritten(check(pad, 'loopLoudness') - check(drums, 'loopLoudness'), '6.8 LU')
  })

  it('set by loudness, both read −20.0 LUFS and the drums stand 6.8 dB taller (claim by-loudness)', () => {
    const drums = meter.render(loop.drums!, { setBy: 3 })
    const pad = meter.render(loop.pad!, { setBy: 3 })
    expectWritten(check(drums, 'loopLoudness'), '−20.0 LUFS')
    expectWritten(check(pad, 'loopLoudness'), '−20.0 LUFS')
    // And on the engine's own meter, which the lab's is not.
    expectWritten(engineMeter(drums).integrated, '−20.0 LUFS')
    expectWritten(engineMeter(pad).integrated, '−20.0 LUFS')
    expectWritten(check(drums, 'samplePeak') - check(pad, 'samplePeak'), '6.8 dB')
  })

  it('the drums stand 18.7 dB over their own level and the pad 12.7 dB (claim crest)', () => {
    expectWritten(check(plain.drums!, 'samplePeak') - check(plain.drums!, 'loopLevel'), '18.7 dB')
    expectWritten(check(plain.pad!, 'samplePeak') - check(plain.pad!, 'loopLevel'), '12.7 dB')
  })
})

describe('decibels', () => {
  /** How many times as tall the output is with the Fader at `fader` as with it at 0 dB. */
  const times = (fader: number) =>
    peak(tap(meter.render(loop.drums!, { fader }), 'out')) / peak(tap(plain.drums!, 'out'))

  it('a Fader at −6 dB makes the output 0.501 times as tall (claim minus-six)', () => {
    expectWritten(times(-6), '0.501')
  })

  it('a Fader at −20 dB makes it 0.100 times as tall, and at −40 dB 0.0100 times (claim minus-twenty)', () => {
    expectWritten(times(-20), '0.100')
    expectWritten(times(-40), '0.0100')
  })

  it('a Fader at 6 dB makes it 1.995 times as tall, and at 12 dB 3.98 times (claim plus-six)', () => {
    expectWritten(times(6), '1.995')
    expectWritten(times(12), '3.98')
  })

  it('a Fader at 12 dB puts the tallest sample of the drums 8.2 dB over full scale (claim fader-top)', () => {
    expectWritten(topOf(meter.render(loop.drums!, { fader: 12 }), 'out'), '8.2 dB')
    // Twice full scale is all the room the page's player has, so this one is past it.
    expect(topOf(meter.render(loop.drums!, { fader: 12 }), 'out')).toBeGreaterThan(gainToDb(2))
  })

  it('at the bottom of its travel the Fader is shut: nothing comes out', () => {
    expect(peak(tap(meter.render(loop.drums!, { fader: -60 }), 'out'))).toBe(0)
  })

  it('6 dB down on the Fader takes every reading down by 6.00 dB (claim six-all)', () => {
    const down = meter.render(loop.drums!, { fader: -6 })
    for (const id of ['samplePeak', 'wavePeak', 'loopLevel', 'loopLoudness'])
      expectWritten(check(plain.drums!, id) - check(down, id), '6.00 dB')
  })

  it('on other loops and at other settings every reading moves by the number on the Fader', () => {
    const moves: [string, number][] = [
      ['pad', -12],
      ['chords', 6],
      ['mix', -30],
      ['guitar', -40],
      ['bass', 12],
    ]
    for (const [id, fader] of moves) {
      const moved = meter.render(loop[id]!, { fader })
      for (const reading of ['samplePeak', 'wavePeak', 'loopLevel', 'loopLoudness'])
        expect(
          Math.abs(check(moved, reading) - check(plain[id]!, reading) - fader),
          `${id} at ${fader} dB, ${reading}`,
        ).toBeLessThan(0.005)
    }
  })

  it('far down its travel the loudness stops following: the meter takes what is left for silence', () => {
    const down = meter.render(loop.drums!, { fader: -59 })
    for (const reading of ['samplePeak', 'wavePeak', 'loopLevel'])
      expect(
        Math.abs(check(down, reading) - check(plain.drums!, reading) + 59),
        reading,
      ).toBeLessThan(0.005)
    expect(
      Math.abs(check(down, 'loopLoudness') - check(plain.drums!, 'loopLoudness') + 59),
    ).toBeGreaterThan(1)
  })
})

describe('the window', () => {
  it('a 1 ms window on a 100 Hz tone swings by 13.7 dB, and a 10 ms window by less than 0.01 dB (claim window-short)', () => {
    const low = tone(100, 0.5)
    expectWritten(range(tap(meter.render(low, { window: 1 }), 'windowed')).span, '13.7 dB')
    expectWritten(
      range(tap(meter.render(low, { window: 10 }), 'windowed')).span,
      'less than 0.01 dB',
    )
  })

  it('over 3 s the reading of the drum loop moves by 1.3 dB, and over 400 ms it moves by 24.9 dB (claim window-long)', () => {
    expectWritten(
      range(tap(meter.render(loop.drums!, { window: 3000 }), 'windowed')).span,
      '1.3 dB',
    )
    expectWritten(range(tap(plain.drums!, 'windowed')).span, '24.9 dB')
  })

  it("a 10 ms window on the drums leaps higher at the hits than the compressor's level reaches", () => {
    const short = meter.render(loop.drums!, { window: 10 })
    expect(range(tap(short, 'windowed')).hi).toBeGreaterThan(range(tap(short, 'level')).hi + 3)
  })

  it('Window changes the level over the window and no other lane', () => {
    const short = meter.render(loop.drums!, { window: 50 })
    const differ = (id: string) => {
      const one = tap(short, id)
      const other = tap(plain.drums!, id)
      let count = 0
      for (let i = 0; i < one.length; i += 1) if (one[i] !== other[i]) count += 1
      return count
    }
    for (const id of [
      'in',
      'out',
      'peak',
      'truePeak',
      'level',
      'weighted',
      'momentary',
      'loudness',
    ])
      expect(differ(id), id).toBe(0)
    expect(differ('windowed')).toBeGreaterThan(0)
  })
})

describe('between the samples', () => {
  it('at 12,000 Hz the tone stands 3.055 dB over its own samples, which are all one height (claim between-tone)', () => {
    const quarter = meter.render(loop.drums!, { toneHz: 12000 })
    expectWritten(check(quarter, 'toneWavePeak') - check(quarter, 'tonePeak'), '3.055 dB')
    expectWritten(
      Math.abs(check(quarter, 'tonePeak') - check(quarter, 'toneLevel')),
      'less than 0.01 dB',
    )
  })

  it('white noise stands 4.9 dB over its tallest sample, the drum loop 0.14 dB (claim between-noise)', () => {
    expectWritten(check(plain.noise!, 'wavePeak') - check(plain.noise!, 'samplePeak'), '4.9 dB')
    expectWritten(check(plain.drums!, 'wavePeak') - check(plain.drums!, 'samplePeak'), '0.14 dB')
  })
})

describe('the weighting', () => {
  /** How far the tone's loudness stands over its level, at a frequency. */
  const over = (toneHz: number) => {
    const result = meter.render(loop.drums!, { toneHz })
    return check(result, 'toneLoudness') - check(result, 'toneLevel')
  }

  it('a 1 kHz sine 0.1 tall on both channels reads −20.0 LUFS, and −23.01 dB in level (claim reference)', () => {
    const result = meter.render(tone(1000, 0.1), {})
    expectWritten(check(result, 'loopLoudness'), '−20.0 LUFS')
    expectWritten(check(result, 'loopLevel'), '−23.01 dB')
    expectWritten(check(result, 'samplePeak'), '−20.00 dB')
  })

  it('for one level a tone reads 1.8 LU lower at 100 Hz than at 1 kHz, 4.6 LU lower at 50 Hz and 9.0 LU lower at 30 Hz (claim weight-low)', () => {
    expectWritten(over(1000) - over(100), '1.8 LU')
    expectWritten(over(1000) - over(50), '4.6 LU')
    expectWritten(over(1000) - over(30), '9.0 LU')
  })

  it('and 3.3 LU higher at 4 kHz (claim weight-high)', () => {
    expectWritten(over(4000) - over(1000), '3.3 LU')
  })

  it('the weights are the same for a tone of another height: on the pad set by peak', () => {
    const at = (toneHz: number) => {
      const result = meter.render(loop.pad!, { toneHz, setBy: 1, fader: -9 })
      return check(result, 'toneLoudness') - check(result, 'toneLevel')
    }
    expectWritten(at(1000) - at(100), '1.8 LU')
    expectWritten(at(1000) - at(30), '9.0 LU')
    expectWritten(at(4000) - at(1000), '3.3 LU')
  })

  it('set by level, the bass loop reads 2.2 LU under the pad (claim bass-pad)', () => {
    const bass = meter.render(loop.bass!, { setBy: 2 })
    const pad = meter.render(loop.pad!, { setBy: 2 })
    expectWritten(Math.abs(check(bass, 'loopLevel') - check(pad, 'loopLevel')), 'less than 0.01 dB')
    expectWritten(check(pad, 'loopLoudness') - check(bass, 'loopLoudness'), '2.2 LU')
  })
})

describe('the gate', () => {
  it('half the pad silenced: 2.9 dB off its level, 2.84 LU off every block averaged, 0.3 LU off its gated loudness (claim pause)', () => {
    const whole = plain.pad!
    const half = meter.render(loop.pad!, { silence: 50 })
    expectWritten(check(whole, 'loopLevel') - check(half, 'loopLevel'), '2.9 dB')
    expectWritten(check(whole, 'plainLoudness') - check(half, 'plainLoudness'), '2.84 LU')
    expectWritten(check(whole, 'loopLoudness') - check(half, 'loopLoudness'), '0.3 LU')
  })

  it('the gate leaves out 42 blocks of the strummed chords and reads 3.3 LU over the plain average; of the drums it leaves out 8 (claim chords-gate)', () => {
    expectWritten(check(plain.chords!, 'leftOut'), '42')
    expectWritten(
      check(plain.chords!, 'loopLoudness') - check(plain.chords!, 'plainLoudness'),
      '3.3 LU',
    )
    expectWritten(check(plain.drums!, 'leftOut'), '8')
    expectWritten(check(plain.pad!, 'leftOut'), '0')
  })
})

describe('the gate, against a case worked by hand', () => {
  it('a 1 kHz tone with its second half silenced: 34 blocks left out, 0.47 LU off the gated loudness, 3.0 LU off the plain', () => {
    // The loop is 4 s and is heard twice: 80 tenths of a second, and 77 blocks of four tenths.
    // Silence at 50 % mutes 2 s to 4 s of each pass, with 10 ms of raised-cosine fade inside each
    // edge of the gap. A fade's squares add up to 3/8 of its 480 samples, which is 180 samples
    // of tone, or 0.009375 of a block of 19,200.
    //   34 blocks are all tone: 1 each.
    //   9 blocks cross an edge with one, two or three tenths of tone and one fade: three each
    //     at 0.259375, 0.509375 and 0.759375, which is 4.584375 together.
    //   4 blocks hold a fade and nothing else: 0.009375 each. They are 20.3 LU under a whole
    //     block, so they pass the gate at −70 LUFS and fall to the gate 10 under the average.
    //   30 blocks are silent, and fall to the gate at −70 LUFS.
    const fade = (480 * 3) / 8 / 19200
    const crossing = 3 * (0.25 + 0.5 + 0.75) + 9 * fade
    const gated = 10 * Math.log10((34 + crossing) / 43)
    const every = 10 * Math.log10((34 + crossing + 4 * fade) / 77)
    expect(gated).toBeCloseTo(-0.4706, 3)
    expect(every).toBeCloseTo(-2.9967, 3)

    const whole = meter.render(tone(1000, 0.1), {})
    const half = meter.render(tone(1000, 0.1), { silence: 50 })
    expectWritten(check(whole, 'leftOut'), '0')
    expectWritten(check(half, 'leftOut'), '34')
    expectWritten(check(whole, 'loopLoudness') - check(half, 'loopLoudness'), '0.47 LU')
    expectWritten(check(whole, 'plainLoudness') - check(half, 'plainLoudness'), '3.0 LU')
    expect(
      Math.abs(check(half, 'loopLoudness') - check(whole, 'loopLoudness') - gated),
    ).toBeLessThan(0.002)
    expect(
      Math.abs(check(half, 'plainLoudness') - check(whole, 'plainLoudness') - every),
    ).toBeLessThan(0.002)
  })
})

describe('the build', () => {
  const built = (source: Source, build: number, values: Record<string, number> = {}) =>
    meter.render(source, { ...values, build })

  it('the tallest sample: every loop comes out 0.5 tall', () => {
    for (const id of LOOPS)
      expect(dbToGain(topOf(built(loop[id]!, 0), 'built'))).toBeCloseTo(0.5, 4)
  })

  it('mean square: the drums and the pad come out at one level, to less than 0.01 dB (claim built-level)', () => {
    const apart = (build: number) =>
      Math.abs(
        levelOf(built(loop.pad!, build), 'built') - levelOf(built(loop.drums!, build), 'built'),
      )
    expectWritten(apart(1), 'less than 0.01 dB')
    // With the piece off, by the tallest sample alone, they are 6 dB apart.
    expect(matchesWritten(apart(0), 'less than 0.01 dB')).toBe(false)
    expectWritten(apart(0), '6.0 dB')
  })

  it('decibels: a Fader at −6 dB makes the built sound 0.501 times as tall (claim built-fader)', () => {
    const times = (build: number) =>
      dbToGain(
        topOf(built(loop.pad!, build, { fader: -6 }), 'built') -
          topOf(built(loop.pad!, build), 'built'),
      )
    expectWritten(times(2), '0.501')
    // With the piece off there is no Fader to move.
    expect(matchesWritten(times(1), '0.501')).toBe(false)
    expect(times(1)).toBe(1)
  })

  it('between the samples: a 12,000 Hz tone caught an eighth of a turn in reads 3.055 dB over its samples (claim built-over)', () => {
    const caught = tone(12000, 0.5, 1 / 8)
    const reading = (build: number) => range(tap(built(caught, build), 'builtOver')).hi
    expectWritten(reading(3), '3.055 dB')
    expect(matchesWritten(reading(2), '3.055 dB')).toBe(false)
    expect(reading(2)).toBe(0)
  })

  it('weighting: a 100 Hz tone comes out 1.8 dB taller than a 1 kHz tone of the same height (claim built-weight)', () => {
    const taller = (build: number) =>
      topOf(built(tone(100, 0.3), build), 'built') - topOf(built(tone(1000, 0.3), build), 'built')
    expectWritten(taller(4), '1.8 dB')
    expect(matchesWritten(taller(3), '1.8 dB')).toBe(false)
    expectWritten(Math.abs(taller(3)), 'less than 0.01 dB')
  })

  it('gating: the pad with half of it silenced comes out 0.3 dB taller than the whole pad, and 2.84 dB taller without the gate (claim built-gate)', () => {
    const taller = (build: number) =>
      topOf(built(loop.pad!, build, { silence: 50 }), 'built') -
      topOf(built(loop.pad!, build), 'built')
    expectWritten(taller(5), '0.3 dB')
    expect(matchesWritten(taller(4), '0.3 dB')).toBe(false)
    expectWritten(taller(4), '2.84 dB')
  })

  it('the last step is the main path set by loudness: the same sound, sample for sample', () => {
    for (const fader of [0, -3, 5]) {
      const result = meter.render(loop.chords!, { build: 5, setBy: 3, fader })
      for (const channel of [0, 1]) {
        const built = tap(result, 'built', channel)
        const out = tap(result, 'out', channel)
        let differ = 0
        for (let i = 0; i < out.length; i += 1) if (built[i] !== out[i]) differ += 1
        expect(differ, `Fader ${fader} dB, channel ${channel}`).toBe(0)
      }
    }
  })
})

describe('the named sets', () => {
  const settings = readSettings('level-and-loudness')!
  const played = async (name: string) => {
    const set = settings.sets[name]
    if (!set) throw new Error(`The lesson has no set called ${name}`)
    const { values, source } = resolveSet(meter.description, set)
    return meter.render(await benchSource(source!, FRAMES), values)
  }
  const EVEN = ['evenDrums', 'evenPad', 'evenBass', 'evenChords', 'evenMix']

  it('each renders a sound that is there and is finite', async () => {
    for (const name of Object.keys(settings.sets)) {
      const result = await played(name)
      const out = tap(result, settings.sets[name]!.tap ?? 'out')
      expect(
        out.every((v) => Number.isFinite(v)),
        name,
      ).toBe(true)
      expect(rms(out), name).toBeGreaterThan(0.001)
    }
  })

  it('the five loops set by loudness all read −20.0 LUFS (claim even)', async () => {
    for (const name of EVEN) {
      const result = await played(name)
      expectWritten(check(result, 'loopLoudness'), '−20.0 LUFS')
      // And on the engine's own meter, which the lab's is not.
      expectWritten(engineMeter(result).integrated, '−20.0 LUFS')
    }
    // The gate leaves out the same blocks of the chords wherever the fader stands.
    expectWritten(check(await played('evenChords'), 'leftOut'), '42')
  })

  it('set by loudness the tallest sample of the five lies between −9.6 dB and −2.7 dB (claim even-peaks)', async () => {
    const tops: number[] = []
    for (const name of EVEN) tops.push(check(await played(name), 'samplePeak'))
    expectWritten(Math.min(...tops), '−9.6 dB')
    expectWritten(Math.max(...tops), '−2.7 dB')
    // The lowest is the pad and the highest the mix.
    expect(EVEN[tops.indexOf(Math.min(...tops))]).toBe('evenPad')
    expect(EVEN[tops.indexOf(Math.max(...tops))]).toBe('evenMix')
  })

  it('the chords set by level come out at −17.8 LUFS, their tallest sample at −1.2 dB (claim ringing)', async () => {
    const result = await played('ringing')
    expectWritten(check(result, 'loopLoudness'), '−17.8 LUFS')
    expectWritten(check(result, 'samplePeak'), '−1.2 dB')
  })

  it('the pad with a rest is turned up 2.9 dB further by its level, and 0.3 dB further by its loudness (claim rests)', async () => {
    const further = async (name: string, setBy: number) =>
      check(await played(name), 'gain') - check(meter.render(loop.pad!, { setBy }), 'gain')
    expectWritten(await further('restsLevel', 2), '2.9 dB')
    expectWritten(await further('rests', 3), '0.3 dB')
  })

  it('noise set by peak: its samples reach −6.02 dB and its wave −1.1 dB (claim hiss)', async () => {
    const result = await played('hiss')
    expectWritten(check(result, 'samplePeak'), '−6.02 dB')
    expectWritten(check(result, 'wavePeak'), '−1.1 dB')
  })

  it('on the drums set by peak the level stays well under the top of the hits', async () => {
    const result = await played('tallDrums')
    expect(range(tap(result, 'level')).hi).toBeLessThan(range(tap(result, 'peak')).hi - 6)
  })

  it('on the card that checks a meter with a tone, the tone reads 3.01 dB under its tallest sample in level and its loudness is at its tallest sample', async () => {
    const result = await played('evenDrums')
    expectWritten(check(result, 'tonePeak') - check(result, 'toneLevel'), '3.01 dB')
    expectWritten(
      Math.abs(check(result, 'toneLoudness') - check(result, 'tonePeak')),
      'less than 0.01 dB',
    )
  })

  it('the drums set by level: tallest sample −4.3 dB, level −23.0 dB (claim gap)', async () => {
    const result = await played('gap')
    expectWritten(check(result, 'samplePeak'), '−4.3 dB')
    expectWritten(check(result, 'loopLevel'), '−23.0 dB')
  })
})
