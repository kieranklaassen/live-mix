import { describe, expect, it } from 'vitest'
import {
  benchSource,
  differenceDb,
  expectSoundLab,
  gainToDb,
  lab,
  noise,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

// SAY=1 prints what each test measured: the numbers the lesson states.
const SAY = process.env.SAY === '1'
const say = (...words: unknown[]) => SAY && console.log(...words)

const RATE = 48_000
const FADE = 960 // the first 20 ms of a tap are a crossfade of two passes (lab.h)

type Tap = {
  channels_data: Float32Array[]
  x0: number
  x1: number
  columns: number
  length: number
}

const left = (tap: Tap | undefined) => tap!.channels_data[0]!

/** The level of `a` against `b` read `lag` samples earlier, in dB, from `from` on. */
function againstEarlier(a: Float32Array, b: Float32Array, lag: number, from = lag + FADE): number {
  let diff = 0
  let ref = 0
  for (let i = from; i < a.length; i += 1) {
    const y = b[i - lag]!
    diff += (a[i]! - y) ** 2
    ref += y * y
  }
  return 10 * Math.log10(Math.max(diff / Math.max(ref, 1e-30), 1e-14))
}

/** The grains of a render, as the lab's cloud tap lays them out: six numbers a grain. */
interface Grain {
  start: number // seconds into the loop
  length: number // seconds
  behind: number // ms behind the write point at its first sample
  rate: number // ring samples per output sample; below zero backwards
  gain: number
  looked: boolean
}
function grainsOf(tap: Tap | undefined): Grain[] {
  const data = left(tap)
  const out: Grain[] = []
  for (let g = 0; g < tap!.columns; g += 1) {
    const [start, length, behind, rate, gain, looked] = data.subarray(g * 6, g * 6 + 6)
    out.push({
      start: start!,
      length: length!,
      behind: behind!,
      rate: rate!,
      gain: gain!,
      looked: looked === 1,
    })
  }
  return out
}
const waitsMs = (grains: Grain[]) =>
  grains.slice(1).map((g, i) => (g.start - grains[i]!.start) * 1000)

/**
 * The power between `lo` and `hi` hertz (from the shifted pitch) of one of the lab's line
 * spectra, in dB against the sine that went in. A line's power under a Hann window is spread
 * over its neighbouring bins, 1.5 times its own in all, whether or not it stands on a bin.
 */
function bandDb(tap: Tap | undefined, lo: number, hi: number): number {
  const data = left(tap)
  let power = 0
  for (let i = 0; i < data.length; i += 1) {
    const hz = tap!.x0 + ((tap!.x1 - tap!.x0) * i) / (data.length - 1)
    if (hz >= lo && hz <= hi) power += 10 ** (data[i]! / 10)
  }
  return 10 * Math.log10(Math.max(power / 1.5, 1e-20))
}
/** One line: the power within 4.4 Hz (three bins) of `hz`. */
const lineDb = (tap: Tap | undefined, hz: number) => bandDb(tap, hz - 4.4, hz + 4.4)

/** The mean level of a spectrum (dB a bin, to 24 kHz) between two frequencies. */
function meanDb(spectrum: Float32Array, lo: number, hi: number): number {
  const at = (hz: number) => Math.round((hz / 24_000) * (spectrum.length - 1))
  let power = 0
  for (let k = at(lo); k <= at(hi); k += 1) power += 10 ** (spectrum[k]! / 10)
  return 10 * Math.log10(power / (at(hi) - at(lo) + 1))
}

/** The frequency of the strongest bin of a stretch of sound, by a plain Fourier sum at each of `candidates`. */
function strongest(x: Float32Array, from: number, to: number, candidates: number[]): number {
  let best = 0
  let top = -1
  for (const hz of candidates) {
    let re = 0
    let im = 0
    for (let i = from; i < to; i += 1) {
      const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i - from)) / (to - from))
      const turn = (2 * Math.PI * hz * i) / RATE
      re += x[i]! * window * Math.cos(turn)
      im -= x[i]! * window * Math.sin(turn)
    }
    if (re * re + im * im > top) {
      top = re * re + im * im
      best = hz
    }
  }
  return best
}

/** A quarter of a second of a 220 Hz sine, faded at both ends, then silence. */
function burst(frames: number): Source {
  const source = silence(frames)
  const length = seconds(0.25)
  for (let i = 0; i < length; i += 1) {
    const fade = Math.min(1, i / 480, (length - i) / 480)
    source.left[i] = source.right[i] = 0.25 * fade * Math.sin((2 * Math.PI * 220 * i) / RATE)
  }
  return source
}

const NAME = 'granular'

describe('granular sound', () => {
  it('is a sound lab on the guitar: every tap says something, loops, and answers to every control', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const result = grain.render(guitar, {})
    expectSoundLab(grain, guitar, result)
  })

  it('makes one grain of what it read times its window, to within −120 dB, at any speed, direction and shape (claim one-grain)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(2))
    const settings = [
      {},
      { pitch: 12 },
      { pitch: -12, reverse: 1 },
      { shape: 0.3 },
      { size: 500, pitch: 24 },
    ]
    for (const values of settings) {
      const out = grain.render(guitar, values)
      const piece = left(out.taps.piece)
      const window = left(out.taps.window)
      const product = piece.map((v, i) => v * window[i]!)
      const miss = differenceDb(left(out.taps.grain), product)
      say(
        'one grain against piece × window',
        values,
        miss.toFixed(1),
        'dB over',
        piece.length,
        'samples',
      )
      expect(piece.length).toBeGreaterThan(400)
      expect(miss).toBeLessThan(-120)
    }
    // The grain the lesson looks at is one of the device's own, and the picture marks it.
    const marked = grainsOf(grain.render(guitar, {}).taps.cloud).filter((g) => g.looked)
    expect(marked.length).toBe(1)
    expect(marked[0]!.start).toBeGreaterThanOrEqual(1)
    expect(marked[0]!.start).toBeLessThan(1.12)
  })

  it('opens the window as the kit writes it: a Hann bell at Shape 1, a flat top with a fade a hundredth of the grain long at its least (claim shape-least)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const bell = left(grain.render(guitar, {}).taps.window)
    const n = bell.length
    for (const k of [0, 100, n / 4, n / 2, n - 300]) {
      expect(bell[k]!).toBeCloseTo(0.5 - 0.5 * Math.cos((2 * Math.PI * k) / n), 3)
    }
    const flat = left(grain.render(guitar, { shape: 0.02 }).taps.window)
    // Fully open from a hundredth of the way in to a hundredth from the end.
    const open = flat.reduce((count, v) => count + (v === 1 ? 1 : 0), 0)
    say('Shape 0.02: fully open for', ((100 * open) / flat.length).toFixed(1), '% of the grain')
    expect(open / flat.length).toBeGreaterThan(0.975)
    expect(open / flat.length).toBeLessThan(0.985)
    expect(flat[0]).toBe(0)
  })

  it('leaves a cut piece of a sine 66 dB under its peak between 8 and 12 kHz (claim click), and nothing there under the window (claim windowed)', async () => {
    const grain = await lab(NAME)
    const tone = sine(440, 0.5, seconds(4))
    const out = grain.render(tone, {})
    const cut = left(out.taps.cutSpectrum)
    const windowed = left(out.taps.grainSpectrum)
    const top = cut.reduce((a, b) => Math.max(a, b), -Infinity)
    const cutHigh = meanDb(cut, 8000, 12_000)
    const windowedHigh = meanDb(windowed, 8000, 12_000)
    say(
      'cut piece: peak',
      top.toFixed(1),
      'dB, 8 to 12 kHz',
      cutHigh.toFixed(1),
      'dB; windowed',
      windowedHigh.toFixed(1),
    )
    expect(top - cutHigh).toBeGreaterThan(64)
    expect(top - cutHigh).toBeLessThan(68)
    expect(windowedHigh).toBeLessThan(-135)
    // The kit's least Shape is between the two.
    const least = meanDb(left(grain.render(tone, { shape: 0.02 }).taps.grainSpectrum), 8000, 12_000)
    expect(least).toBeLessThan(cutHigh - 30)
    expect(least).toBeGreaterThan(windowedHigh)
  })

  it('starts 40 grains in four seconds at Size 100 ms and Density 1, 80 at 2, 160 at 4: doubling Density doubles the count (claim count-doubles)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const count = (density: number, size = 100) =>
      grain.render(guitar, { size, density }).taps.cloud!.columns
    const counts = [1, 2, 4, 8].map((density) => count(density))
    say('grains in 4 s at Size 100 ms, Density 1, 2, 4, 8:', counts)
    expect(counts[0]).toBe(40)
    for (let k = 1; k < counts.length; k += 1) {
      expect(Math.abs(counts[k]! - 2 * counts[k - 1]!)).toBeLessThanOrEqual(1)
    }
    // And at the size the lab starts on, where the wait is not a whole number of grains to the loop.
    expect(Math.abs(count(2, 120) - 2 * count(1, 120))).toBeLessThanOrEqual(1)
    expect(Math.abs(count(4, 120) - 2 * count(2, 120))).toBeLessThanOrEqual(1)
  })

  it('waits exactly Size / Density between grains that read the same sound (claim steady-wait), and from half to one and a half of it once they do not (claim wait-range)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const steady = waitsMs(grainsOf(grain.render(guitar, { size: 100, density: 4 }).taps.cloud))
    expect(Math.min(...steady)).toBeCloseTo(25, 3)
    expect(Math.max(...steady)).toBeCloseTo(25, 3)
    for (const values of [{ pitch: 12 }, { spray: 0.5 }, { pitchSpray: 0.5 }, { reverse: 1 }]) {
      const loose = waitsMs(
        grainsOf(grain.render(guitar, { size: 100, density: 4, ...values }).taps.cloud),
      )
      say(
        'waits at',
        values,
        Math.min(...loose).toFixed(2),
        'to',
        Math.max(...loose).toFixed(2),
        'ms',
      )
      expect(Math.min(...loose)).toBeGreaterThanOrEqual(12.5)
      expect(Math.min(...loose)).toBeLessThan(14)
      expect(Math.max(...loose)).toBeGreaterThan(36)
      expect(Math.max(...loose)).toBeLessThanOrEqual(37.5 + 0.03)
    }
  })

  it('keeps the pool far from full: 11 grains at once of its 20, at the most, at Density 8 with the waits scattered (claim most-grains)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const all = grainsOf(grain.render(guitar, { size: 100, density: 8, pitch: 12 }).taps.cloud)
    let most = 0
    for (const one of all) {
      const sounding = all.filter(
        (g) => g.start <= one.start && g.start + g.length > one.start,
      ).length
      most = Math.max(most, sounding)
    }
    say('most grains at once at Density 8, scattered:', most)
    // The device's dice are seeded, so the count is the same on every run.
    expect(most).toBe(11)
  })

  it('at Density 1 the windows stand end to end, their sum falling to nothing and rising to 1.63 (claim bells-peak), and the grains are the recording, Time late, times that sum (claim grain-in-device)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const out = grain.render(guitar, { density: 1, time: 250 })
    const cover = left(out.taps.cover)
    const top = cover.reduce((a, b) => Math.max(a, b), -Infinity)
    const low = cover.reduce((a, b) => Math.min(a, b), Infinity)
    say('Density 1: the windows’ sum runs from', low.toFixed(4), 'to', top.toFixed(4))
    expect(top).toBeCloseTo(Math.sqrt(8 / 3), 3)
    expect(low).toBeLessThan(0.001)
    // Sample for sample where the window's sum was kept, one point in sixteen.
    const lag = seconds(0.25)
    const sum = left(out.taps.grains)
    const recorded = left(out.taps.recorded)
    let diff = 0
    let ref = 0
    for (let k = (lag + FADE) / 16; k < cover.length; k += 1) {
      const expected = recorded[16 * k - lag]! * cover[k]!
      diff += (sum[16 * k]! - expected) ** 2
      ref += expected ** 2
    }
    const miss = 10 * Math.log10(Math.max(diff / ref, 1e-14))
    say(
      'Density 1: grains against the recording 250 ms late × the windows’ sum:',
      miss.toFixed(1),
      'dB',
    )
    expect(miss).toBeLessThan(-120)
  })

  it('from Density 2 up, whole, the grains add up to the recording, Time late: under −89 dB (claim plain-delay)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    for (const density of [2, 3, 4, 8]) {
      const out = grain.render(guitar, { density, time: 250 })
      const miss = againstEarlier(left(out.taps.grains), left(out.taps.recorded), seconds(0.25))
      const cover = left(out.taps.cover).subarray(FADE / 16)
      say('Density', density, 'grains against the recording 250 ms late:', miss.toFixed(1), 'dB')
      expect(miss).toBeLessThan(-89)
      for (const v of cover) expect(Math.abs(v - 1)).toBeLessThan(1e-4)
    }
    // Between whole numbers the sum ripples and the delay is no longer plain.
    const between = grain.render(guitar, { density: 2.5, time: 250 })
    expect(
      againstEarlier(left(between.taps.grains), left(between.taps.recorded), seconds(0.25)),
    ).toBeGreaterThan(-40)
  })

  it('holds the level of noise within 0.2 dB from Density 1 to 8, at Pitch 0 and an octave up (claim level-holds)', async () => {
    const grain = await lab(NAME)
    const hiss = noise(0.25, seconds(4))
    for (const pitch of [0, 12]) {
      for (const density of [1, 2, 4, 8]) {
        const out = grain.render(hiss, { pitch, density })
        const change = gainToDb(rms(left(out.taps.grains)) / rms(left(out.taps.recorded)))
        say(
          'noise, Pitch',
          pitch,
          'Density',
          density,
          'grains against the recording:',
          change.toFixed(2),
          'dB',
        )
        expect(Math.abs(change)).toBeLessThan(0.2)
      }
    }
  })

  it('loses 5.4 dB of white noise when the grains are a fiftieth of a semitone apart in pitch: the guess of how alike they are is made for duller sound (claim level-model)', async () => {
    const grain = await lab(NAME)
    const out = grain.render(noise(0.25, seconds(4)), { pitch: 0.02, density: 4 })
    const change = gainToDb(rms(left(out.taps.grains)) / rms(left(out.taps.recorded)))
    say('white noise, Pitch 0.02, Density 4:', change.toFixed(2), 'dB')
    expect(change).toBeGreaterThan(-5.9)
    expect(change).toBeLessThan(-4.9)
  })

  it('places a grain so that its middle is Time old: at +12 semitones and Size 100 ms it starts 50 ms further back and reads at twice the speed (claim middle)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const up = grainsOf(
      grain.render(guitar, { pitch: 12, size: 100, time: 350, density: 2 }).taps.cloud,
    )
    for (const one of up) {
      expect(one.rate).toBeCloseTo(2, 5)
      expect(one.behind).toBeCloseTo(400, 2)
      // Half way through, it has read 100 ms of the ring in 50 ms: 350 ms behind.
      expect(one.behind - ((one.rate - 1) * one.length * 1000) / 2).toBeCloseTo(350, 2)
    }
    const down = grainsOf(
      grain.render(guitar, { pitch: -12, size: 100, time: 350, density: 2 }).taps.cloud,
    )
    expect(down[0]!.rate).toBeCloseTo(0.5, 5)
    expect(down[0]!.behind).toBeCloseTo(325, 2)
    // Backwards at speed 1: it starts 100 ms nearer the write point and falls behind at twice real time.
    const back = grainsOf(
      grain.render(guitar, { reverse: 1, size: 100, time: 350, density: 2 }).taps.cloud,
    )
    expect(back[0]!.rate).toBeCloseTo(-1, 5)
    expect(back[0]!.behind).toBeCloseTo(250, 2)
  })

  it('will not let a fast grain reach the write point: at Time 10 ms, Size 500 ms and +12 semitones the grains start 500.08 ms behind (claim time-floor)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const all = grainsOf(
      grain.render(guitar, { time: 10, size: 500, pitch: 12, density: 2 }).taps.cloud,
    )
    say('Time 10 ms, Size 500 ms, +12: grains start', all[0]!.behind.toFixed(3), 'ms behind')
    for (const one of all) {
      expect(one.behind).toBeCloseTo(500 + 4000 / RATE, 2)
      // Its last sample is read 4 samples behind the write point, and no nearer.
      expect(one.behind - (one.rate - 1) * one.length * 1000).toBeCloseTo(4000 / RATE, 2)
    }
  })

  it('throws grains up to Spray squared seconds later than Time (claim spray-reach) and up to Pitch Spray squared times twelve semitones either way (claim pitch-spray-reach)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(4))
    const late = grainsOf(
      grain.render(guitar, { spray: 0.5, size: 100, density: 4, time: 350 }).taps.cloud,
    )
    const behind = late.map((g) => g.behind)
    say(
      'Spray 0.5: grains read from',
      Math.min(...behind).toFixed(1),
      'to',
      Math.max(...behind).toFixed(1),
      'ms behind',
    )
    expect(Math.min(...behind)).toBeGreaterThanOrEqual(350)
    expect(Math.min(...behind)).toBeLessThan(360)
    expect(Math.max(...behind)).toBeGreaterThan(590)
    expect(Math.max(...behind)).toBeLessThanOrEqual(600)
    const detuned = grainsOf(
      grain.render(guitar, { pitchSpray: 0.5, size: 100, density: 4 }).taps.cloud,
    )
    const semitones = detuned.map((g) => 12 * Math.log2(g.rate))
    say(
      'Pitch Spray 0.5: from',
      Math.min(...semitones).toFixed(2),
      'to',
      Math.max(...semitones).toFixed(2),
      'semitones',
    )
    expect(Math.min(...semitones)).toBeGreaterThanOrEqual(-3)
    expect(Math.min(...semitones)).toBeLessThan(-2.8)
    expect(Math.max(...semitones)).toBeGreaterThan(2.8)
    expect(Math.max(...semitones)).toBeLessThanOrEqual(3)
  })

  it('brings a 440 Hz sine out at 880 Hz with the Pitch at +12 semitones (claim octave)', async () => {
    const grain = await lab(NAME)
    grain.render(sine(440, 0.5, seconds(4)), { pitch: 12 })
    const spectrum = grain.spectrum('out')
    let best = 0
    for (let k = 1; k < spectrum.length; k += 1) if (spectrum[k]! > spectrum[best]!) best = k
    const hz = (best * 24_000) / (spectrum.length - 1)
    say('440 Hz at +12: the output’s strongest bin stands at', hz.toFixed(1), 'Hz')
    // One bin of the page's spectrum is 11.7 Hz.
    expect(Math.abs(hz - 880)).toBeLessThan(12)
  })

  it('draws three lines from a sine at Density 1: 50 grains a second put a line 50 Hz either side, 6 dB under the middle one (claim three-lines)', async () => {
    const grain = await lab(NAME)
    const out = grain.render(sine(440, 0.5, seconds(1)), { size: 20, density: 1 })
    for (const tap of [out.taps.linesDevice, out.taps.linesSteady]) {
      const middle = lineDb(tap, 0)
      const below = lineDb(tap, -50)
      const above = lineDb(tap, 50)
      say(
        'Size 20 ms, Density 1: lines at −50, 0, +50 Hz:',
        below.toFixed(2),
        middle.toFixed(2),
        above.toFixed(2),
        'dB',
      )
      expect(middle).toBeCloseTo(-1.76, 0)
      expect(middle - below).toBeGreaterThan(5.5)
      expect(middle - below).toBeLessThan(6.5)
      expect(middle - above).toBeGreaterThan(5.5)
      expect(middle - above).toBeLessThan(6.5)
      // Nothing between the lines, and nothing at twice the rate.
      expect(bandDb(tap, 15, 35)).toBeLessThan(-50)
      expect(bandDb(tap, -35, -15)).toBeLessThan(-50)
      expect(lineDb(tap, 100)).toBeLessThan(-50)
      expect(lineDb(tap, -100)).toBeLessThan(-50)
    }
    // Other rates, other spacings: 25 grains a second, and 75 from a Density of 1.5.
    const slower = grain.render(sine(440, 0.5, seconds(1)), { size: 40, density: 1 })
    expect(lineDb(slower.taps.linesDevice, 25)).toBeGreaterThan(-9)
    expect(lineDb(slower.taps.linesDevice, 50)).toBeLessThan(-50)
    const between = grain.render(sine(440, 0.5, seconds(1)), { size: 20, density: 1.5 })
    expect(lineDb(between.taps.linesDevice, 75)).toBeGreaterThan(-20)
    expect(lineDb(between.taps.linesDevice, 50)).toBeLessThan(-50)
  })

  it('draws one line at Density 2: the windows add up to one and what is left beside the sine is 55 dB under it (claim no-lines)', async () => {
    const grain = await lab(NAME)
    const out = grain.render(sine(440, 0.5, seconds(1)), { size: 20, density: 2 })
    const beside = Math.max(
      bandDb(out.taps.linesDevice, -250, -8),
      bandDb(out.taps.linesDevice, 8, 250),
    )
    say(
      'Size 20 ms, Density 2: the sine',
      lineDb(out.taps.linesDevice, 0).toFixed(2),
      'dB, all else',
      beside.toFixed(1),
      'dB',
    )
    expect(lineDb(out.taps.linesDevice, 0)).toBeCloseTo(0, 0)
    expect(beside).toBeLessThan(-54.5)
  })

  it('locks a shifted sine to the grain rate when the starts are steady: lines 40 Hz apart, 18 Hz under and 22 Hz over the pitch (claim comb-lines), all of it 23 dB down (claim comb-level)', async () => {
    const grain = await lab(NAME)
    const out = grain.render(sine(440, 0.5, seconds(1)), {
      pitch: 7,
      size: 100,
      density: 4,
      scatter: 0,
    })
    const tap = out.taps.linesSteady
    // 1 kHz up seven semitones is 1498.3 Hz; the lines stand at 1000 + 40 m: 1480 and 1520.
    const under = lineDb(tap, 1480 - 1498.31)
    const over = lineDb(tap, 1520 - 1498.31)
    const onPitch = bandDb(tap, -9, 9)
    const all = bandDb(tap, -250, 250)
    say(
      'steady, +7, 40 grains a second: lines',
      under.toFixed(1),
      over.toFixed(1),
      'dB; within 9 Hz of the pitch',
      onPitch.toFixed(1),
      'dB; in all',
      all.toFixed(1),
      'dB',
    )
    expect(under).toBeGreaterThan(-27)
    expect(over).toBeGreaterThan(-33)
    expect(onPitch).toBeLessThan(under - 20)
    // The two lines are all there is.
    expect(all).toBeLessThan(-22.5)
    expect(all).toBeGreaterThan(-24)
    expect(10 ** (under / 10) + 10 ** (over / 10)).toBeGreaterThan(0.95 * 10 ** (all / 10))
    // A slider on the page stops a hair off these values (Size 100.2 ms, Pitch 7.008, Density
    // 4.003). The lines then stand elsewhere against the gaps in the bell's spectrum, and the
    // sine is still all but gone.
    const beside = grain.render(sine(440, 0.5, seconds(1)), {
      pitch: 7.008,
      size: 100.2,
      density: 4.003,
      scatter: 0,
    }).taps.linesSteady
    say('steady, at the sliders’ own values: in all', bandDb(beside, -250, 250).toFixed(1), 'dB')
    expect(bandDb(beside, -250, 250)).toBeLessThan(-20)
  })

  it('lands a shifted sine on its pitch when the starts are scattered: all but a hundredth of its power inside 20 Hz of the pitch, from the lab’s pool and from the device (claim scattered)', async () => {
    const grain = await lab(NAME)
    const out = grain.render(sine(440, 0.5, seconds(1)), {
      pitch: 7,
      size: 100,
      density: 4,
      scatter: 1,
    })
    for (const tap of [out.taps.linesSteady, out.taps.linesDevice]) {
      const near = bandDb(tap, -20, 20)
      const all = bandDb(tap, -250, 250)
      const outside = 1 - 10 ** ((near - all) / 10)
      say(
        'scattered, +7: in all',
        all.toFixed(2),
        'dB;',
        (100 * outside).toFixed(2),
        '% of it further than 20 Hz from the pitch',
      )
      // As much power as went in, within 1.5 dB: one second of a sum of grains thrown at random.
      expect(Math.abs(all)).toBeLessThan(1.5)
      expect(outside).toBeLessThan(0.01)
    }
  })

  it('makes the lab’s pool the device’s own when the device’s grains are steady: the two sums differ by less than −130 dB (claim same-pool)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(2))
    for (const density of [1, 2.5, 4]) {
      const out = grain.render(guitar, { density, scatter: 0 })
      for (const c of [0, 1]) {
        const miss = differenceDb(
          out.taps.steady!.channels_data[c]!,
          out.taps.grains!.channels_data[c]!,
        )
        say(
          'Density',
          density,
          'channel',
          c,
          'the lab’s pool against the device’s grains:',
          miss.toFixed(1),
          'dB',
        )
        expect(miss).toBeLessThan(-130)
      }
    }
    // With the device's grains scattered and the lab's steady, they are two different sounds.
    const apart = grain.render(guitar, { pitch: 7, density: 4, scatter: 0 })
    expect(differenceDb(left(apart.taps.steady), left(apart.taps.grains))).toBeGreaterThan(-10)
  })

  it('low-passes what it records to what the pitch can carry: at +12 semitones 3 dB down at 10.8 kHz and 10 dB down at 15 kHz (claim guard)', async () => {
    const grain = await lab(NAME)
    const hiss = noise(0.25, seconds(4))
    const drop = (hz: number) => {
      const before = meanDb(grain.spectrum('in'), hz * 0.97, hz * 1.03)
      return meanDb(grain.spectrum('recorded'), hz * 0.97, hz * 1.03) - before
    }
    grain.render(hiss, { pitch: 12 })
    say(
      '+12: recorded against the input at 10.8 kHz',
      drop(10_800).toFixed(2),
      'dB, at 15 kHz',
      drop(15_000).toFixed(2),
      'dB',
    )
    expect(drop(10_800)).toBeCloseTo(-3, 0)
    expect(drop(15_000)).toBeGreaterThan(-11)
    expect(drop(15_000)).toBeLessThan(-9.4)
    // Down, or not at all, nothing is taken.
    for (const pitch of [0, -12]) {
      grain.render(hiss, { pitch })
      expect(Math.abs(drop(15_000))).toBeLessThan(0.2)
    }
  })

  it('brings each repeat back 6.1 dB under the last at a Feedback of 0.5 (claim repeat-level)', async () => {
    const grain = await lab(NAME)
    const out = left(
      grain.render(burst(seconds(4)), { time: 500, feedback: 0.5, size: 100, density: 2 }).taps.out,
    )
    const level = (n: number) => {
      const from = seconds(n * 0.5 + 0.03)
      return gainToDb(rms(out, from, from + seconds(0.2)))
    }
    for (let n = 1; n < 5; n += 1) {
      say('repeat', n + 1, 'against repeat', n, (level(n + 1) - level(n)).toFixed(2), 'dB')
      expect(level(n + 1) - level(n)).toBeGreaterThan(-6.4)
      expect(level(n + 1) - level(n)).toBeLessThan(-5.8)
    }
  })

  it('shifts every repeat again: a 220 Hz note at +12 semitones comes back at 440, 880 and 1760 Hz (claim octave-stair)', async () => {
    const grain = await lab(NAME)
    const out = left(
      grain.render(burst(seconds(4)), {
        time: 500,
        pitch: 12,
        feedback: 0.5,
        size: 100,
        density: 4,
      }).taps.out,
    )
    // Every semitone from 110 Hz to 7 kHz.
    const candidates = Array.from({ length: 73 }, (_, k) => 110 * 2 ** (k / 12))
    for (let n = 1; n <= 3; n += 1) {
      const from = seconds(n * 0.5 + 0.03)
      const hz = strongest(out, from, from + seconds(0.2), candidates)
      say('repeat', n, 'is strongest at', hz.toFixed(0), 'Hz')
      expect(hz).toBeCloseTo(220 * 2 ** n, 0)
    }
  })

  it('adds the grains up again from the pool to the device’s own output: −140 dB, the floor of the measure (claim rebuilt)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(2))
    const drums = await benchSource('drums', seconds(2))
    const defaults = {
      spray: 0.15,
      pitch: 12,
      pitchSpray: 0.08,
      density: 4,
      feedback: 0.45,
      tone: 6000,
      spread: 0.6,
      mix: 0.35,
    }
    for (const [source, values] of [
      [guitar, {}],
      [guitar, defaults],
      [drums, { ...defaults, reverse: 0.5 }],
      [guitar, { size: 10, density: 8, pitch: -24, feedback: 0.9 }],
    ] as const) {
      const out = grain.render(source, values)
      say('rebuilt', out.checks.rebuilt, 'dB; rule', out.checks.rule, 'samples')
      expect(out.checks.rebuilt).toBeLessThan(-130)
    }
  })

  it('works out every grain’s start, speed, length, gain and wait as the device does: nothing between them (claim rule)', async () => {
    const grain = await lab(NAME)
    const guitar = await benchSource('guitar', seconds(2))
    const drums = await benchSource('drums', seconds(2))
    for (const [source, values] of [
      [guitar, {}],
      [
        guitar,
        { spray: 0.15, pitch: 12, pitchSpray: 0.08, density: 4, feedback: 0.45, spread: 0.6 },
      ],
      [
        drums,
        {
          spray: 1,
          pitch: -7,
          pitchSpray: 1,
          density: 8,
          reverse: 0.5,
          spread: 1,
          size: 37,
          time: 10,
        },
      ],
      [guitar, { pitch: 24, reverse: 1, size: 500, time: 10 }],
    ] as const) {
      expect(grain.render(source, values).checks.rule).toBe(0)
    }
  })

  it('stays asleep on silence: no grain starts and every sound is exact silence', async () => {
    const grain = await lab(NAME)
    const out = grain.render(silence(seconds(1)), { pitch: 12, feedback: 0.5 })
    for (const id of ['recorded', 'grains', 'out', 'steady']) {
      expect(out.taps[id]!.channels_data[0]!.every((v) => v === 0)).toBe(true)
    }
    expect(out.taps.cloud!.length).toBe(0)
  })
})
