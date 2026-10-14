import { describe, expect, it } from 'vitest'

import { bandEdges, bandsOf, createEar, levelOf, type TappedMaster } from '../ear'
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
