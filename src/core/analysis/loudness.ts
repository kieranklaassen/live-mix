// ITU-R BS.1770-4 loudness and true-peak measurement as pure DSP, with no Web
// Audio dependency: the meter worklet (dsp/worklets/meter.processor.ts) wraps
// `LoudnessAnalyzer`, the tests drive it with synthetic signals, and a host can
// run it over decoded buffers offline. Everything is preallocated; `process()`
// never allocates, so it is safe on the audio thread.
//
// Stereo only (channel weights 1, 1). Momentary = 400 ms, short-term = 3 s,
// integrated = gated (−70 LUFS absolute, −10 LU relative) over 400 ms blocks
// stepping 100 ms, per the spec; true peak is the Annex 2 four-phase FIR.

/** Absolute gate: 400 ms blocks below this are ignored for integrated loudness. */
export const ABSOLUTE_GATE_LUFS = -70
/** Relative gate: blocks more than this below the ungated mean are ignored. */
export const RELATIVE_GATE_LU = -10
export const MOMENTARY_WINDOW_SECONDS = 0.4
export const SHORT_TERM_WINDOW_SECONDS = 3
/** Gating block step (75 % overlap of the 400 ms blocks). */
export const GATING_HOP_SECONDS = 0.1
/** Makes a 0 dBFS 997 Hz sine in one channel read −3.01 LUFS. */
export const LOUDNESS_OFFSET_LU = -0.691

/** Histogram resolution for the gated integration (fixed memory for any session length). */
const HISTOGRAM_LU_PER_BIN = 0.01
const HISTOGRAM_TOP_LUFS = 10
const HISTOGRAM_BINS = Math.round((HISTOGRAM_TOP_LUFS - ABSOLUTE_GATE_LUFS) / HISTOGRAM_LU_PER_BIN)

export interface BiquadCoefficients {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

export interface KWeighting {
  /** Stage 1: the +4 dB high shelf modelling the head. */
  shelf: BiquadCoefficients
  /** Stage 2: the RLB high-pass (~38 Hz). */
  highpass: BiquadCoefficients
}

// Analog prototypes behind the coefficients the spec tabulates at 48 kHz; the
// bilinear transform below reproduces those tables to ~1e-14 and gives the
// filter for any other rate (the libebur128 derivation).
const SHELF_F0 = 1681.974450955533
const SHELF_GAIN_DB = 3.999843853973347
const SHELF_Q = 0.7071752369554196
const HIGHPASS_F0 = 38.13547087602444
const HIGHPASS_Q = 0.5003270373238773

export function kWeightingCoefficients(sampleRate: number): KWeighting {
  const k = Math.tan((Math.PI * SHELF_F0) / sampleRate)
  const vh = 10 ** (SHELF_GAIN_DB / 20)
  const vb = vh ** 0.4996667741545416
  const a0 = 1 + k / SHELF_Q + k * k
  const shelf: BiquadCoefficients = {
    b0: (vh + (vb * k) / SHELF_Q + k * k) / a0,
    b1: (2 * (k * k - vh)) / a0,
    b2: (vh - (vb * k) / SHELF_Q + k * k) / a0,
    a1: (2 * (k * k - 1)) / a0,
    a2: (1 - k / SHELF_Q + k * k) / a0,
  }

  const k2 = Math.tan((Math.PI * HIGHPASS_F0) / sampleRate)
  const a02 = 1 + k2 / HIGHPASS_Q + k2 * k2
  const highpass: BiquadCoefficients = {
    b0: 1,
    b1: -2,
    b2: 1,
    a1: (2 * (k2 * k2 - 1)) / a02,
    a2: (1 - k2 / HIGHPASS_Q + k2 * k2) / a02,
  }
  return { shelf, highpass }
}

/** Direct form II transposed biquad. */
export class Biquad {
  private readonly c: BiquadCoefficients
  private s1 = 0
  private s2 = 0

  constructor(coefficients: BiquadCoefficients) {
    this.c = coefficients
  }

  process(x: number): number {
    const c = this.c
    const y = c.b0 * x + this.s1
    this.s1 = c.b1 * x - c.a1 * y + this.s2
    this.s2 = c.b2 * x - c.a2 * y
    return y
  }

  reset(): void {
    this.s1 = 0
    this.s2 = 0
  }
}

/** BS.1770-4 Annex 2: 4× oversampling FIR as four 12-tap phases (48 kHz design). */
export const TRUE_PEAK_FIR_PHASES: readonly (readonly number[])[] = [
  [
    0.001708984375, 0.010986328125, -0.0196533203125, 0.033203125, -0.0594482421875,
    0.1373291015625, 0.97216796875, -0.102294921875, 0.047607421875, -0.026611328125,
    0.014892578125, -0.00830078125,
  ],
  [
    -0.0291748046875, 0.029296875, -0.0517578125, 0.089111328125, -0.16650390625, 0.465087890625,
    0.77978515625, -0.2003173828125, 0.1015625, -0.0582275390625, 0.0330810546875, -0.0189208984375,
  ],
  [
    -0.0189208984375, 0.0330810546875, -0.0582275390625, 0.1015625, -0.2003173828125, 0.77978515625,
    0.465087890625, -0.16650390625, 0.089111328125, -0.0517578125, 0.029296875, -0.0291748046875,
  ],
  [
    -0.00830078125, 0.014892578125, -0.026611328125, 0.047607421875, -0.102294921875, 0.97216796875,
    0.1373291015625, -0.0594482421875, 0.033203125, -0.0196533203125, 0.010986328125,
    0.001708984375,
  ],
]
export const TRUE_PEAK_FIR_TAPS = 12

/** Oversampling factor the spec asks for at a given rate: 4× to 48 kHz, 2× to 96 kHz, none above. */
export function truePeakOversampling(sampleRate: number): 1 | 2 | 4 {
  if (sampleRate < 64000) return 4
  if (sampleRate < 128000) return 2
  return 1
}

/**
 * Per-channel inter-sample peak estimator. `push(x)` returns the largest
 * magnitude among the raw sample and the interpolated phases around it.
 */
export class TruePeakDetector {
  private readonly phases: readonly (readonly number[])[]
  // Twelve samples stored twice so any 12-tap window is contiguous.
  private readonly history = new Float64Array(TRUE_PEAK_FIR_TAPS * 2)
  private position = 0

  constructor(sampleRate: number) {
    const factor = truePeakOversampling(sampleRate)
    if (factor === 4) this.phases = TRUE_PEAK_FIR_PHASES
    else if (factor === 2) this.phases = [TRUE_PEAK_FIR_PHASES[0], TRUE_PEAK_FIR_PHASES[2]]
    else this.phases = []
  }

  push(x: number): number {
    let peak = Math.abs(x)
    if (this.phases.length === 0) return peak
    const history = this.history
    this.position = (this.position + 1) % TRUE_PEAK_FIR_TAPS
    history[this.position] = x
    history[this.position + TRUE_PEAK_FIR_TAPS] = x
    const newest = this.position + TRUE_PEAK_FIR_TAPS
    for (const phase of this.phases) {
      let y = 0
      for (let i = 0; i < TRUE_PEAK_FIR_TAPS; i += 1) y += phase[i] * history[newest - i]
      const magnitude = Math.abs(y)
      if (magnitude > peak) peak = magnitude
    }
    return peak
  }

  reset(): void {
    this.history.fill(0)
    this.position = 0
  }
}

/** Loudness of a summed, K-weighted mean square (−Infinity for silence). */
export function loudnessFromMeanSquare(meanSquare: number): number {
  if (meanSquare <= 0) return -Infinity
  return LOUDNESS_OFFSET_LU + 10 * Math.log10(meanSquare)
}

/** One snapshot of the meter. Peaks are linear (1 = 0 dBFS / 0 dBTP). */
export interface MeterReading {
  /** 400 ms loudness, LUFS; −Infinity when silent. */
  momentary: number
  /** 3 s loudness, LUFS. */
  shortTerm: number
  /** Gated loudness since the last reset, LUFS; −Infinity until the first block passes the gate. */
  integrated: number
  /** Sample peak per channel since the previous reading. */
  samplePeak: [number, number]
  /** Inter-sample (true) peak per channel since the previous reading. */
  truePeak: [number, number]
  /** Highest true peak over both channels since the last reset. */
  maxTruePeak: number
  /** Seconds analysed since the last reset. */
  elapsedSec: number
}

export function silentReading(): MeterReading {
  return {
    momentary: -Infinity,
    shortTerm: -Infinity,
    integrated: -Infinity,
    samplePeak: [0, 0],
    truePeak: [0, 0],
    maxTruePeak: 0,
    elapsedSec: 0,
  }
}

/**
 * Stereo BS.1770-4 analyser. Feed blocks with `process`, take snapshots with
 * `read` at UI rate. Fixed memory: gating uses a 0.01 LU histogram rather than
 * a per-block list, so a 45-minute session costs the same as a 4-second one.
 */
export class LoudnessAnalyzer {
  readonly sampleRate: number
  readonly hopFrames: number
  private readonly shelfL: Biquad
  private readonly shelfR: Biquad
  private readonly highpassL: Biquad
  private readonly highpassR: Biquad
  private readonly truePeakL: TruePeakDetector
  private readonly truePeakR: TruePeakDetector

  private readonly momentaryHops: number
  private readonly shortTermHops: number
  /** Mean square (L + R) of each 100 ms hop, oldest overwritten. */
  private readonly hopRing: Float64Array
  private hopIndex = 0
  private hopsSeen = 0
  private hopSum = 0
  private hopCount = 0

  private readonly binCount = new Uint32Array(HISTOGRAM_BINS)
  private readonly binPower = new Float64Array(HISTOGRAM_BINS)
  private gatedCount = 0
  private gatedPower = 0

  private samplePeakL = 0
  private samplePeakR = 0
  private truePeakMaxL = 0
  private truePeakMaxR = 0
  private maxTruePeak = 0
  private frames = 0

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate
    const coefficients = kWeightingCoefficients(sampleRate)
    this.shelfL = new Biquad(coefficients.shelf)
    this.shelfR = new Biquad(coefficients.shelf)
    this.highpassL = new Biquad(coefficients.highpass)
    this.highpassR = new Biquad(coefficients.highpass)
    this.truePeakL = new TruePeakDetector(sampleRate)
    this.truePeakR = new TruePeakDetector(sampleRate)
    this.hopFrames = Math.max(1, Math.round(GATING_HOP_SECONDS * sampleRate))
    this.momentaryHops = Math.round(MOMENTARY_WINDOW_SECONDS / GATING_HOP_SECONDS)
    this.shortTermHops = Math.round(SHORT_TERM_WINDOW_SECONDS / GATING_HOP_SECONDS)
    this.hopRing = new Float64Array(this.shortTermHops)
  }

  /** Analyse `frames` samples (default: the whole left array); mono input passes the same array twice. */
  process(left: Float32Array, right: Float32Array, frames = left.length): void {
    let hopSum = this.hopSum
    let hopCount = this.hopCount
    let samplePeakL = this.samplePeakL
    let samplePeakR = this.samplePeakR
    let truePeakMaxL = this.truePeakMaxL
    let truePeakMaxR = this.truePeakMaxR

    for (let i = 0; i < frames; i += 1) {
      const l = left[i]
      const r = right[i]
      const absL = l < 0 ? -l : l
      const absR = r < 0 ? -r : r
      if (absL > samplePeakL) samplePeakL = absL
      if (absR > samplePeakR) samplePeakR = absR
      const tpL = this.truePeakL.push(l)
      const tpR = this.truePeakR.push(r)
      if (tpL > truePeakMaxL) truePeakMaxL = tpL
      if (tpR > truePeakMaxR) truePeakMaxR = tpR

      const kl = this.highpassL.process(this.shelfL.process(l))
      const kr = this.highpassR.process(this.shelfR.process(r))
      hopSum += kl * kl + kr * kr
      hopCount += 1
      if (hopCount === this.hopFrames) {
        this.completeHop(hopSum / hopCount)
        hopSum = 0
        hopCount = 0
      }
    }

    this.hopSum = hopSum
    this.hopCount = hopCount
    this.samplePeakL = samplePeakL
    this.samplePeakR = samplePeakR
    this.truePeakMaxL = truePeakMaxL
    this.truePeakMaxR = truePeakMaxR
    const channelMax = truePeakMaxL > truePeakMaxR ? truePeakMaxL : truePeakMaxR
    if (channelMax > this.maxTruePeak) this.maxTruePeak = channelMax
    this.frames += frames
  }

  private completeHop(meanSquare: number): void {
    this.hopRing[this.hopIndex] = meanSquare
    this.hopIndex = (this.hopIndex + 1) % this.shortTermHops
    this.hopsSeen += 1
    if (this.hopsSeen < this.momentaryHops) return

    // Every hop completes one 400 ms gating block (75 % overlap).
    const block = this.windowMeanSquare(this.momentaryHops)
    const loudness = loudnessFromMeanSquare(block)
    if (loudness <= ABSOLUTE_GATE_LUFS) return
    let bin = Math.floor((loudness - ABSOLUTE_GATE_LUFS) / HISTOGRAM_LU_PER_BIN)
    if (bin >= HISTOGRAM_BINS) bin = HISTOGRAM_BINS - 1
    this.binCount[bin] += 1
    this.binPower[bin] += block
    this.gatedCount += 1
    this.gatedPower += block
  }

  /** Mean of the most recent `hops` hop mean-squares (missing hops count as silence). */
  private windowMeanSquare(hops: number): number {
    let sum = 0
    let index = this.hopIndex
    for (let n = 0; n < hops; n += 1) {
      index = index === 0 ? this.shortTermHops - 1 : index - 1
      sum += this.hopRing[index]
    }
    return sum / hops
  }

  get momentary(): number {
    return loudnessFromMeanSquare(this.windowMeanSquare(this.momentaryHops))
  }

  get shortTerm(): number {
    return loudnessFromMeanSquare(this.windowMeanSquare(this.shortTermHops))
  }

  /** Gated integrated loudness of everything since the last reset. */
  get integrated(): number {
    if (this.gatedCount === 0) return -Infinity
    const ungated = loudnessFromMeanSquare(this.gatedPower / this.gatedCount)
    const threshold = ungated + RELATIVE_GATE_LU
    let firstBin = Math.ceil((threshold - ABSOLUTE_GATE_LUFS) / HISTOGRAM_LU_PER_BIN)
    if (firstBin < 0) firstBin = 0
    let count = 0
    let power = 0
    for (let bin = firstBin; bin < HISTOGRAM_BINS; bin += 1) {
      count += this.binCount[bin]
      power += this.binPower[bin]
    }
    return count === 0 ? -Infinity : loudnessFromMeanSquare(power / count)
  }

  get elapsedSec(): number {
    return this.frames / this.sampleRate
  }

  /** Snapshot; sample and true peaks restart from zero for the next span. */
  read(): MeterReading {
    const reading: MeterReading = {
      momentary: this.momentary,
      shortTerm: this.shortTerm,
      integrated: this.integrated,
      samplePeak: [this.samplePeakL, this.samplePeakR],
      truePeak: [this.truePeakMaxL, this.truePeakMaxR],
      maxTruePeak: this.maxTruePeak,
      elapsedSec: this.elapsedSec,
    }
    this.samplePeakL = 0
    this.samplePeakR = 0
    this.truePeakMaxL = 0
    this.truePeakMaxR = 0
    return reading
  }

  /** Forget everything: filters, windows, gating history, peaks. */
  reset(): void {
    this.shelfL.reset()
    this.shelfR.reset()
    this.highpassL.reset()
    this.highpassR.reset()
    this.truePeakL.reset()
    this.truePeakR.reset()
    this.hopRing.fill(0)
    this.hopIndex = 0
    this.hopsSeen = 0
    this.hopSum = 0
    this.hopCount = 0
    this.binCount.fill(0)
    this.binPower.fill(0)
    this.gatedCount = 0
    this.gatedPower = 0
    this.samplePeakL = 0
    this.samplePeakR = 0
    this.truePeakMaxL = 0
    this.truePeakMaxR = 0
    this.maxTruePeak = 0
    this.frames = 0
  }
}
