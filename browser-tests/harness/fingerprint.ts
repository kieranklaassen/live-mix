// Loudness and spectral fingerprint of a planar buffer, computed where the
// audio is (in the page) so only a few hundred numbers cross to the test
// runner. Deliberately coarse: the live capture and the offline render of the
// same session are aligned to within a render quantum, so what must agree is
// the energy envelope and the spectral balance, not individual samples.

export interface Fingerprint {
  sampleRate: number
  frames: number
  /** Sample peak in dBFS over both channels. */
  peakDb: number
  /** Whole-buffer RMS in dBFS (both channels pooled). */
  rmsDb: number
  /** RMS per `blockSec` block in dBFS, left+right pooled. */
  envelopeDb: number[]
  blockSec: number
  /** Mean energy per log-spaced band in dBFS, left channel, over the whole buffer. */
  bandsDb: number[]
  /** Band edges in Hz (length bandsDb.length + 1). */
  bandEdgesHz: number[]
}

export interface FingerprintOptions {
  blockSec?: number
  fftSize?: number
  bands?: number
}

const FLOOR_DB = -120

function toDb(power: number): number {
  return power > 0 ? Math.max(FLOOR_DB, 10 * Math.log10(power)) : FLOOR_DB
}

export function fingerprint(
  channels: readonly Float32Array[],
  sampleRate: number,
  options: FingerprintOptions = {},
): Fingerprint {
  const blockSec = options.blockSec ?? 0.25
  const fftSize = options.fftSize ?? 2048
  const bandCount = options.bands ?? 8
  const frames = channels[0]?.length ?? 0
  const channelCount = channels.length

  let peak = 0
  let sumSquares = 0
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i += 1) {
      const v = channel[i]
      const a = Math.abs(v)
      if (a > peak) peak = a
      sumSquares += v * v
    }
  }
  const rmsDb = toDb(sumSquares / Math.max(1, frames * channelCount))

  const blockFrames = Math.max(1, Math.round(blockSec * sampleRate))
  const envelopeDb: number[] = []
  for (let start = 0; start + blockFrames <= frames; start += blockFrames) {
    let acc = 0
    for (const channel of channels) {
      for (let i = start; i < start + blockFrames; i += 1) acc += channel[i] * channel[i]
    }
    envelopeDb.push(toDb(acc / (blockFrames * channelCount)))
  }

  const edges = logBandEdges(40, Math.min(16000, sampleRate / 2 - 1), bandCount)
  const bandPower = new Array<number>(bandCount).fill(0)
  let frameCount = 0
  const left = channels[0] ?? new Float32Array(0)
  const window = hann(fftSize)
  const re = new Float64Array(fftSize)
  const im = new Float64Array(fftSize)
  for (let start = 0; start + fftSize <= left.length; start += fftSize / 2) {
    for (let i = 0; i < fftSize; i += 1) {
      re[i] = left[start + i] * window[i]
      im[i] = 0
    }
    fft(re, im)
    for (let bin = 1; bin < fftSize / 2; bin += 1) {
      const hz = (bin * sampleRate) / fftSize
      const band = bandFor(hz, edges)
      if (band === -1) continue
      bandPower[band] += (re[bin] * re[bin] + im[bin] * im[bin]) / (fftSize * fftSize)
    }
    frameCount += 1
  }
  const bandsDb = bandPower.map((power) => toDb(frameCount > 0 ? power / frameCount : 0))

  return {
    sampleRate,
    frames,
    peakDb: peak > 0 ? 20 * Math.log10(peak) : FLOOR_DB,
    rmsDb,
    envelopeDb,
    blockSec,
    bandsDb,
    bandEdgesHz: edges,
  }
}

function logBandEdges(lowHz: number, highHz: number, bands: number): number[] {
  const edges: number[] = []
  const ratio = Math.log(highHz / lowHz)
  for (let i = 0; i <= bands; i += 1) edges.push(lowHz * Math.exp((ratio * i) / bands))
  return edges
}

function bandFor(hz: number, edges: number[]): number {
  if (hz < edges[0] || hz >= edges[edges.length - 1]) return -1
  let band = 0
  while (hz >= edges[band + 1]) band += 1
  return band
}

function hann(size: number): Float64Array {
  const window = new Float64Array(size)
  for (let i = 0; i < size; i += 1) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1))
  return window
}

/** In-place radix-2 FFT (size must be a power of two). */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = (-2 * Math.PI) / size
    const wr = Math.cos(angle)
    const wi = Math.sin(angle)
    for (let start = 0; start < n; start += size) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < size / 2; k += 1) {
        const a = start + k
        const b = a + size / 2
        const tr = re[b] * cr - im[b] * ci
        const ti = re[b] * ci + im[b] * cr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
        const next = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = next
      }
    }
  }
}

export interface FingerprintDiff {
  rmsDb: number
  peakDb: number
  /** Largest block difference where either side is above `gateDb`. */
  envelopeDb: number
  /** Largest band difference where either side is above `gateDb`. */
  bandsDb: number
}

/**
 * Largest deviations between two fingerprints. Blocks and bands more than
 * `gateBelowMaxDb` under the loudest one on either side are ignored, so
 * silence and quiet tails do not count.
 */
export function compareFingerprints(
  a: Fingerprint,
  b: Fingerprint,
  gateBelowMaxDb = -40,
): FingerprintDiff {
  const gated = (xs: number[], ys: number[]): number => {
    const gateDb = Math.max(...xs, ...ys) + gateBelowMaxDb
    let max = 0
    const count = Math.min(xs.length, ys.length)
    for (let i = 0; i < count; i += 1) {
      if (xs[i] < gateDb && ys[i] < gateDb) continue
      max = Math.max(max, Math.abs(xs[i] - ys[i]))
    }
    return max
  }
  return {
    rmsDb: Math.abs(a.rmsDb - b.rmsDb),
    peakDb: Math.abs(a.peakDb - b.peakDb),
    envelopeDb: gated(a.envelopeDb, b.envelopeDb),
    bandsDb: gated(a.bandsDb, b.bandsDb),
  }
}
