import { describe, expect, it } from 'vitest'

import {
  EAR_KEEPS_SEC,
  bandEdges,
  bandsOf,
  createEar,
  hearTrace,
  levelOf,
  outputLatencySec,
  type TappedMaster,
} from '../ear'
import { SPECTRUM_BANDS } from '../frame'

const BINS = 1024
const RATE = 48_000

const sine = (amplitude: number, length = 2048): Float32Array =>
  Float32Array.from(
    { length },
    (_, index) => amplitude * Math.sin((2 * Math.PI * 8 * index) / length),
  )

/** An analyser that hands out what it was given, and counts how often it was asked. */
function fakeAnalyser(spectrum: Uint8Array, wave: Float32Array) {
  return {
    fftSize: 0,
    smoothingTimeConstant: 0,
    minDecibels: 0,
    maxDecibels: 0,
    reads: 0,
    get frequencyBinCount(): number {
      return this.fftSize / 2
    },
    getByteFrequencyData(into: Uint8Array): void {
      this.reads++
      into.set(spectrum.subarray(0, into.length))
    },
    getFloatTimeDomainData(into: Float32Array): void {
      into.set(wave.subarray(0, into.length))
    },
  }
}

/** A master that remembers what listens to it. */
function fakeMaster() {
  const added: unknown[] = []
  const removed: unknown[] = []
  const master: TappedMaster = {
    addTap: (node) => void added.push(node),
    removeTap: (node) => void removed.push(node),
  }
  return { master, added, removed }
}

describe('where each band of the spectrum lies', () => {
  it('has an edge on either side of every band', () => {
    expect(bandEdges(BINS, RATE)).toHaveLength(SPECTRUM_BANDS + 1)
    expect(bandEdges(BINS, RATE)).toHaveLength(17)
  })

  it('never goes back, and stays inside the bins', () => {
    for (const [bins, rate] of [
      [BINS, RATE],
      [BINS, 44_100],
      [BINS, 96_000],
      [128, RATE],
      [16_384, RATE],
      [8, RATE],
    ]) {
      const edges = bandEdges(bins, rate)
      for (let band = 0; band < SPECTRUM_BANDS; band++) {
        expect(edges[band + 1], `${bins} bins`).toBeGreaterThanOrEqual(edges[band])
      }
      for (const edge of edges) {
        expect(edge, `${bins} bins`).toBeGreaterThanOrEqual(0)
        expect(edge, `${bins} bins`).toBeLessThanOrEqual(bins)
      }
    }
  })

  it('runs from the lowest pitch read to the highest, in wider and wider bands', () => {
    const edges = bandEdges(BINS, RATE)
    const hzPerBin = RATE / 2 / BINS
    expect(edges[0] * hzPerBin).toBeCloseTo(40, -1.5)
    expect(edges[SPECTRUM_BANDS] * hzPerBin).toBeCloseTo(14_000, -1.5)
    expect(edges[SPECTRUM_BANDS] - edges[SPECTRUM_BANDS - 1]).toBeGreaterThan(edges[8] - edges[7])
    expect(edges[8] - edges[7]).toBeGreaterThan(edges[1] - edges[0])
  })

  it('gives the high bands bins of their own', () => {
    const edges = bandEdges(BINS, RATE)
    for (let band = 6; band < SPECTRUM_BANDS; band++)
      expect(edges[band + 1]).toBeGreaterThan(edges[band])
  })
})

describe('the level of each band', () => {
  const edges = bandEdges(BINS, RATE)

  it('is nothing for a silent spectrum', () => {
    const bands = bandsOf(new Uint8Array(BINS), edges, new Float32Array(SPECTRUM_BANDS).fill(0.5))
    expect(Array.from(bands)).toEqual(new Array(SPECTRUM_BANDS).fill(0))
  })

  it('fills the array it was handed and hands it back', () => {
    const into = new Float32Array(SPECTRUM_BANDS)
    expect(bandsOf(new Uint8Array(BINS).fill(255), edges, into)).toBe(into)
    expect(Array.from(into)).toEqual(new Array(SPECTRUM_BANDS).fill(1))
  })

  it('lights only the band a loud bin lies in', () => {
    for (const band of [8, 12, SPECTRUM_BANDS - 1]) {
      for (const bin of [edges[band], edges[band + 1] - 1]) {
        const spectrum = new Uint8Array(BINS)
        spectrum[bin] = 255
        const bands = bandsOf(spectrum, edges, new Float32Array(SPECTRUM_BANDS))
        const lit = Array.from(bands).flatMap((level, index) => (level > 0 ? [index] : []))
        expect(lit, `bin ${bin}`).toEqual([band])
        expect(bands[band]).toBe(1)
      }
    }
  })

  it('lights nothing for a bin below the lowest band or above the highest', () => {
    const spectrum = new Uint8Array(BINS)
    spectrum[0] = 255
    spectrum[BINS - 1] = 255
    expect(Array.from(bandsOf(spectrum, edges, new Float32Array(SPECTRUM_BANDS)))).toEqual(
      new Array(SPECTRUM_BANDS).fill(0),
    )
  })

  it('reads a band as its loudest bin', () => {
    const spectrum = new Uint8Array(BINS)
    spectrum[edges[10]] = 40
    spectrum[edges[10] + 1] = 100
    spectrum[edges[10] + 2] = 60
    const lone = new Uint8Array(BINS)
    lone[edges[10] + 1] = 100
    const bands = bandsOf(spectrum, edges, new Float32Array(SPECTRUM_BANDS))
    expect(bands[10]).toBeGreaterThan(0)
    expect(bands[10]).toBe(bandsOf(lone, edges, new Float32Array(SPECTRUM_BANDS))[10])
  })

  it('lifts the high bands a little over the low ones', () => {
    const bands = bandsOf(new Uint8Array(BINS).fill(128), edges, new Float32Array(SPECTRUM_BANDS))
    expect(bands[0]).toBeCloseTo(128 / 255, 6)
    expect(bands[SPECTRUM_BANDS - 1]).toBeCloseTo((128 / 255) * 1.35, 6)
    for (let band = 1; band < SPECTRUM_BANDS; band++)
      expect(bands[band]).toBeGreaterThan(bands[band - 1])
  })

  it('keeps every level between nothing and full', () => {
    let seed = 7
    const spectrum = Uint8Array.from({ length: BINS }, () => (seed = (seed * 73 + 41) % 256))
    for (const level of bandsOf(spectrum, edges, new Float32Array(SPECTRUM_BANDS))) {
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(1)
    }
  })

  it('still reads a spectrum of few bins, where low bands share a bin', () => {
    const few = bandEdges(8, RATE)
    const bands = bandsOf(new Uint8Array(8).fill(255), few, new Float32Array(SPECTRUM_BANDS))
    for (const level of bands) {
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(1)
    }
    expect(bands[0]).toBe(1)
  })
})

describe('the level of a stretch of the wave', () => {
  it('is nothing for silence', () => {
    expect(levelOf(new Float32Array(2048))).toBe(0)
    expect(levelOf(new Float32Array(0))).toBe(0)
    expect(levelOf(sine(1e-7))).toBe(0)
  })

  it('is full for a sine as loud as can be', () => {
    expect(levelOf(sine(1))).toBeCloseTo(1, 6)
    expect(levelOf(new Float32Array(2048).fill(1))).toBe(1)
  })

  it('is lower for a quieter wave', () => {
    const levels = [1, 0.3, 0.1, 0.03, 0.01, 0.001].map((amplitude) => levelOf(sine(amplitude)))
    for (let index = 2; index < levels.length; index++)
      expect(levels[index]).toBeLessThan(levels[index - 1])
    expect(levels[1]).toBeLessThanOrEqual(levels[0])
    expect(levels[2]).toBeGreaterThan(0.5)
    expect(levels[2]).toBeLessThan(1)
    expect(levels[4]).toBeGreaterThan(0)
    expect(levels[4]).toBeLessThan(0.5)
    // Too quiet to count.
    expect(levels[5]).toBe(0)
  })

  it('goes by how loud the wave is, not by which way it swings', () => {
    expect(levelOf(new Float32Array(2048).fill(-0.1))).toBeCloseTo(
      levelOf(new Float32Array(2048).fill(0.1)),
      10,
    )
  })
})

describe('listening to the master', () => {
  const loudSpectrum = new Uint8Array(BINS).fill(255)

  it('taps the master with an analyser of its own', () => {
    const analyser = fakeAnalyser(loudSpectrum, sine(1))
    const { master, added, removed } = fakeMaster()
    const context = {
      sampleRate: RATE,
      createAnalyser: () => analyser,
    } as unknown as BaseAudioContext
    createEar(context, master)
    expect(added).toEqual([analyser])
    expect(removed).toEqual([])
    expect(analyser.fftSize).toBe(2048)
    // Nothing is read until something asks what is heard.
    expect(analyser.reads).toBe(0)
  })

  it('reads the level and the spectrum into the same object every time', () => {
    const spectrum = new Uint8Array(BINS)
    const wave = new Float32Array(2048)
    const analyser = fakeAnalyser(spectrum, wave)
    const context = {
      sampleRate: RATE,
      createAnalyser: () => analyser,
    } as unknown as BaseAudioContext
    const ear = createEar(context, fakeMaster().master)

    const silent = ear.read()
    expect(silent.level).toBe(0)
    expect(silent.bands).toHaveLength(SPECTRUM_BANDS)
    expect(silent.bands.every((band) => band === 0)).toBe(true)

    spectrum.fill(255)
    wave.set(sine(1))
    const heard = ear.read()
    expect(heard).toBe(silent)
    expect(heard.level).toBeCloseTo(1, 6)
    expect(heard.bands.every((band) => band === 1)).toBe(true)
    expect(analyser.reads).toBe(2)
  })

  it('lays the bands out for the rate of the engine it listens to', () => {
    const spectrum = new Uint8Array(BINS)
    const edges = bandEdges(BINS, 96_000)
    spectrum[edges[12]] = 255
    const analyser = fakeAnalyser(spectrum, new Float32Array(2048))
    const context = {
      sampleRate: 96_000,
      createAnalyser: () => analyser,
    } as unknown as BaseAudioContext
    const heard = createEar(context, fakeMaster().master).read()
    expect(Array.from(heard.bands).flatMap((level, index) => (level > 0 ? [index] : []))).toEqual([
      12,
    ])
  })

  it('lets go of the master once when it is closed, and reads no more', () => {
    const spectrum = new Uint8Array(BINS).fill(255)
    const analyser = fakeAnalyser(spectrum, sine(1))
    const { master, added, removed } = fakeMaster()
    const context = {
      sampleRate: RATE,
      createAnalyser: () => analyser,
    } as unknown as BaseAudioContext
    const ear = createEar(context, master)
    const heard = ear.read()
    ear.close()
    expect(removed).toEqual([analyser])
    ear.close()
    expect(removed).toHaveLength(1)
    expect(added).toHaveLength(1)
    // What was heard last stays; the analyser is not asked again.
    spectrum.fill(0)
    expect(ear.read()).toBe(heard)
    expect(heard.level).toBeCloseTo(1, 6)
    expect(analyser.reads).toBe(1)
  })
})

describe('what was heard a little while ago', () => {
  /** An ear on a clock of its own, whose wave the test sets before each reading. */
  function clockedEar() {
    const wave = new Float32Array(2048)
    const analyser = fakeAnalyser(new Uint8Array(BINS), wave)
    const context = { sampleRate: RATE, currentTime: 0, createAnalyser: () => analyser }
    const ear = createEar(context as unknown as BaseAudioContext, fakeMaster().master)
    /** Reads at `atSec` a wave this loud, asking for what was heard `agoSec` before. */
    const read = (atSec: number, amplitude: number, agoSec?: number): number => {
      context.currentTime = atSec
      wave.set(sine(amplitude))
      return ear.read(agoSec).level
    }
    return { read }
  }

  it('is what is heard now where none is asked for', () => {
    const { read } = clockedEar()
    expect(read(1, 1)).toBeCloseTo(1, 6)
    expect(read(1.1, 0)).toBe(0)
    expect(read(1.2, 1, 0)).toBeCloseTo(1, 6)
  })

  it('is the newest reading that is at least that old', () => {
    const { read } = clockedEar()
    // Silent until 1.0, loud from then on, read every 20 ms and asked for 0.1 s ago.
    const levels: [number, number][] = []
    for (let step = 0; step <= 60; step++) {
      const at = 0.5 + step * 0.02
      levels.push([at, read(at, at >= 1 - 1e-9 ? 1 : 0, 0.1)])
    }
    for (const [at, level] of levels)
      expect(level, `at ${at.toFixed(2)}`).toBeCloseTo(at >= 1.1 - 1e-9 ? 1 : 0, 6)
  })

  it('is the oldest there is while nothing that old was read', () => {
    const { read } = clockedEar()
    expect(read(2, 1, 0.2)).toBeCloseTo(1, 6)
    expect(read(2.05, 0, 0.2)).toBeCloseTo(1, 6)
    expect(read(2.25, 0, 0.2)).toBe(0)
  })

  it('goes back no further than it keeps', () => {
    const { read } = clockedEar()
    read(1, 1, 0.01)
    for (let step = 1; step <= 100; step++) read(1 + step * 0.01, 0, 0.01)
    expect(EAR_KEEPS_SEC).toBe(0.5)
    // Asked for five seconds ago, it answers for half a second ago: silence.
    expect(read(2.01, 1, 5)).toBe(0)
  })
})

describe('the sound as it leaves the speakers', () => {
  const HOP = 240
  /** An engine that has rendered a wave up to `currentTime`, which the test moves on. */
  function engine(more: Record<string, unknown> = {}) {
    // Silent for the first second, loud from then on.
    const sample = (index: number) => (index >= RATE ? 0.5 : 0)
    const analyser = {
      fftSize: 0,
      smoothingTimeConstant: 1,
      getFloatTimeDomainData(into: Float32Array): void {
        const end = Math.round(context.currentTime * RATE)
        for (let index = 0; index < into.length; index++) {
          const at = end - into.length + index
          into[index] = at < 0 ? 0 : sample(at)
        }
      },
    }
    const context = {
      sampleRate: RATE,
      currentTime: 0,
      createAnalyser: () => analyser,
      ...more,
    }
    return { context, analyser }
  }

  it('hands over every stretch once, at the time it is heard', () => {
    const { context, analyser } = engine({ outputLatency: 0.05 })
    const { master, added } = fakeMaster()
    let now = 100
    const trace = hearTrace(context as unknown as BaseAudioContext, master, () => now)
    expect(added).toEqual([analyser])
    expect(analyser.fftSize).toBe(16_384)
    const put: [number, number][] = []
    // Asked every 0.1 s, as the page's clock and the engine's run on together.
    for (let step = 1; step <= 15; step++) {
      context.currentTime = step * 0.1
      now = 100 + step * 0.1
      trace.read((at, level) => put.push([at, level]))
    }
    // One for each 5 ms up to 1.5 s, none twice and none left out.
    expect(put).toHaveLength((1.5 * RATE) / HOP)
    put.forEach(([at], index) => expect(at).toBeCloseTo(100 + 0.05 + (index + 0.5) * 0.005, 6))
    // The sound that starts a second into the engine's time is heard 50 ms after that.
    const first = put.find(([, level]) => level > 0)
    expect(first?.[0]).toBeCloseTo(101.05 + 0.0025, 6)
    expect(first?.[1]).toBeGreaterThan(0.8)
  })

  it('goes by the moment the browser says is at the speakers, where it says one', () => {
    const { context } = engine({
      outputLatency: 0.05,
      // The engine's 0.9 s is at the speakers at 100.98 s of the page: 80 ms after it was rendered.
      getOutputTimestamp: () => ({ contextTime: 0.9, performanceTime: 100_980 }),
    })
    const trace = hearTrace(context as unknown as BaseAudioContext, fakeMaster().master, () => 101)
    context.currentTime = 1
    const put: number[] = []
    trace.read((at) => put.push(at))
    expect(put.at(-1)).toBeCloseTo(101.08 - 0.0025, 6)
  })

  it('does not believe a moment that is far off', () => {
    const { context } = engine({
      outputLatency: 0.05,
      getOutputTimestamp: () => ({ contextTime: 0.9, performanceTime: 5 }),
    })
    const trace = hearTrace(context as unknown as BaseAudioContext, fakeMaster().master, () => 101)
    context.currentTime = 1
    const put: number[] = []
    trace.read((at) => put.push(at))
    expect(put.at(-1)).toBeCloseTo(101.05 - 0.0025, 6)
  })

  it('leaves out what the engine rendered before it kept it, when it is asked too seldom', () => {
    const { context } = engine()
    const trace = hearTrace(context as unknown as BaseAudioContext, fakeMaster().master, () => 0)
    context.currentTime = 2
    let count = 0
    trace.read(() => count++)
    // Only what the analyser still holds: a third of a second.
    expect(count).toBe(Math.floor(16_384 / HOP))
  })

  it('lets go of the master once when it is closed, and hands over no more', () => {
    const { context, analyser } = engine()
    const { master, removed } = fakeMaster()
    const trace = hearTrace(context as unknown as BaseAudioContext, master, () => 0)
    trace.close()
    trace.close()
    expect(removed).toEqual([analyser])
    context.currentTime = 1
    let count = 0
    trace.read(() => count++)
    expect(count).toBe(0)
  })

  it('says how long the output takes: what the browser says, else its own buffer, else nothing', () => {
    const latency = (context: object) => outputLatencySec(context as BaseAudioContext)
    expect(latency({ outputLatency: 0.026, baseLatency: 0.003 })).toBe(0.026)
    expect(latency({ outputLatency: 0, baseLatency: 0.003 })).toBe(0.003)
    expect(latency({ baseLatency: 0.003 })).toBe(0.003)
    expect(latency({})).toBe(0)
    expect(latency({ outputLatency: Number.NaN })).toBe(0)
  })
})
