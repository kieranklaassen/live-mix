// Onset ("hit") detection and tempo estimation as pure DSP over raw channel
// arrays, with no Web Audio dependency and no FFT: computed once per sample at
// decode time (see `SampleStore`), like waveform peaks, so a UI can mark where
// the hits are and whether a sample is a loop without decoding twice.
//
// Onsets: mix to mono, take the RMS of ~10 ms hops in two bands (the signal
// and its first difference, a cheap high band that lets a hi-hat show over a
// sustained bass), log-compress, keep the rise above the recent minimum
// (half-wave rectified flux, averaged over the bands), and pick peaks above a
// local median plus a floor that are also sharp: most of the way up within a
// few hops. Steady noise has no peak that stands out of its own local flux,
// and swells, beating and drones never rise sharply, so they yield nothing.
//
// Tempo: a smoothed histogram of the intervals between onset pairs (the
// autocorrelation of the onset train), summed over the power-of-two relatives
// of each candidate beat, refined by a least-squares grid fit.

/** Tunables of `detectOnsets`; the defaults suit drums, plucks, bells and loops. */
export interface OnsetOptions {
  /** Analysis hop in seconds. Default 0.01. */
  hopSec?: number
  /** Minimum time between two onsets, in seconds. Default 0.06. */
  minGapSec?: number
  /**
   * How far a rise must stand out: scales both the absolute floor and the
   * local-median multiplier. Below 1 finds more (and weaker) onsets, above 1
   * fewer. Default 1.
   */
  sensitivity?: number
}

export interface TempoEstimate {
  /** Beats per minute, folded into 60–180. */
  bpm: number
  /** 0..1: how closely the onsets sit on a regular grid at this tempo. */
  confidence: number
  /** Length of one beat in seconds (`60 / bpm`). */
  beatSec: number
}

export const DEFAULT_ONSET_HOP_SECONDS = 0.01
export const DEFAULT_ONSET_MIN_GAP_SECONDS = 0.06
export const MIN_TEMPO_BPM = 60
export const MAX_TEMPO_BPM = 180
/** `estimateTempo` returns null below this many onsets. */
export const MIN_TEMPO_ONSETS = 4

/** Frames quieter than this (linear peak amplitude) everywhere mean "silence". */
const SILENCE_RMS = 1e-5
/** Log compression `log(1 + GAIN × level)`, level relative to the loudest frame. */
const COMPRESSION_GAIN = 20
/** A rise is measured against the quietest of this many preceding hops. */
const FLUX_LOOKBACK_HOPS = 3
/** Half-width, in seconds, of the window the adaptive threshold takes its median from. */
const THRESHOLD_WINDOW_SECONDS = 0.1
/** Threshold = FLOOR + MEDIAN_WEIGHT × local median of the flux. */
const THRESHOLD_FLOOR = 0.3
const THRESHOLD_MEDIAN_WEIGHT = 2.5
/**
 * A file that starts at level only counts as starting with an attack when the
 * level has fallen to this fraction of its opening level a moment later; a
 * drone or rain cut from the middle of a longer recording has not.
 */
const START_DECAY_RATIO = 0.85
/** A rise this close to the start of the file is the file's start, and gets that test. */
const START_EDGE_SECONDS = 0.05
/** The opening level is the mean over this many seconds… */
const START_OPENING_SECONDS = 0.1
/** …and the later level is the mean over this span (clamped to the sound's length). */
const START_LATER_FROM_SECONDS = 0.5
const START_LATER_TO_SECONDS = 1
/**
 * A hit is sharp: at the peak of its flux the level is already this fraction
 * of the loudest it gets in the next SHARPNESS_WINDOW_SECONDS. A swell or the
 * rising half of a slow beat is still on its way up and fails.
 */
const SHARPNESS_RATIO = 0.5
const SHARPNESS_WINDOW_SECONDS = 0.08
/** Onset times are refined to the first sample step reaching this fraction of the local peak. */
const REFINE_PEAK_FRACTION = 0.3

/** Longest interval between two onsets that the tempo histogram counts. */
const TEMPO_MAX_LAG_SECONDS = 4
const TEMPO_BIN_SECONDS = 0.001
/** Standard deviation of the smoothing applied to the interval histogram. */
const TEMPO_SMOOTHING_SECONDS = 0.012
/** Beat candidates are searched in one octave so that folding is unambiguous. */
const TEMPO_SEARCH_MIN_BPM = 80
const TEMPO_SEARCH_MAX_BPM = 160
/** Weights of the beat's power-of-two relatives in the comb: ¼, ½, 1, 2, 4 beats. */
const TEMPO_COMB: readonly (readonly [multiple: number, weight: number])[] = [
  [0.25, 0.25],
  [0.5, 0.5],
  [1, 1],
  [2, 1],
  [4, 1],
]
/** When no two onsets are one beat apart but many are two apart, the beat is the longer one. */
const TEMPO_HALF_TIME_SUPPORT = 0.25
/** Grid subdivisions (beat, eighth, sixteenth) tried for the regularity measure, with weights. */
const TEMPO_GRIDS: readonly (readonly [division: number, weight: number])[] = [
  [1, 1],
  [2, 0.95],
  [4, 0.85],
]
/** Below this confidence there is no pulse worth reporting. */
const TEMPO_MIN_CONFIDENCE = 0.3

/**
 * Onset times in seconds, ascending: one per hit of a drum loop, pluck or
 * bell; none (or very few) for steady noise, pads and drones. A sound that
 * starts abruptly at t≈0 and then decays gets an onset at its start; one that
 * starts at level and stays there (a loop cut from a drone or from rain) does
 * not. Takes raw channel arrays rather than an AudioBuffer so it stays
 * testable outside the browser.
 */
export function detectOnsets(
  channels: readonly Float32Array[],
  sampleRate: number,
  options: OnsetOptions = {},
): number[] {
  const envelope = onsetEnvelope(channels, sampleRate, options.hopSec)
  return envelope ? pickOnsets(envelope, sampleRate, options) : []
}

/** `detectOnsets` on an envelope already taken (so `analyzeSound` computes it once). */
export function pickOnsets(
  envelope: OnsetEnvelope,
  sampleRate: number,
  options: OnsetOptions = {},
): number[] {
  const { hop, frames, mono, levels, compressed } = envelope
  const sensitivity = positiveOr(options.sensitivity, 1)
  const minGapSec = positiveOr(options.minGapSec, DEFAULT_ONSET_MIN_GAP_SECONDS)

  // Half-wave rectified flux: how far each band has risen above its recent
  // minimum, averaged over the bands (a hit is broadband; the slow wander of
  // rumbling noise is not). Frame 0 is measured against silence. `dominant`
  // remembers which band rose most.
  const flux = new Float32Array(frames)
  const dominant = new Uint8Array(frames)
  for (let frame = 0; frame < frames; frame++) {
    let largest = 0
    for (let band = 0; band < compressed.length; band++) {
      const values = compressed[band]
      let low = frame === 0 ? 0 : Infinity
      for (let back = 1; back <= FLUX_LOOKBACK_HOPS && frame - back >= 0; back++) {
        if (values[frame - back] < low) low = values[frame - back]
      }
      const rise = Math.max(0, values[frame] - low)
      flux[frame] += rise / compressed.length
      if (rise > largest) {
        largest = rise
        dominant[frame] = band
      }
    }
  }

  const hopSec = hop / sampleRate
  const halfWindow = Math.max(1, Math.round(THRESHOLD_WINDOW_SECONDS / hopSec))
  const sharpWindow = Math.max(1, Math.round(SHARPNESS_WINDOW_SECONDS / hopSec))
  const window = new Float32Array(2 * halfWindow + 1)
  const onsets: number[] = []

  for (let frame = 0; frame < frames; frame++) {
    const value = flux[frame]
    if (value <= THRESHOLD_FLOOR * sensitivity) continue
    // A peak: strictly above the previous hop (so a plateau is taken at its
    // first frame) and not below the next.
    if (frame > 0 && value <= flux[frame - 1]) continue
    if (frame + 1 < frames && value < flux[frame + 1]) continue

    const from = Math.max(0, frame - halfWindow)
    const to = Math.min(frames, frame + halfWindow + 1)
    const threshold =
      (THRESHOLD_FLOOR + THRESHOLD_MEDIAN_WEIGHT * median(flux, from, to, window)) * sensitivity
    if (value <= threshold) continue

    // Sharp: already most of the way to the loudest the next moment gets.
    const level = levels[dominant[frame]]
    let ahead = 0
    for (let next = frame; next < Math.min(frames, frame + sharpWindow + 1); next++) {
      if (level[next] > ahead) ahead = level[next]
    }
    if (level[frame] < SHARPNESS_RATIO * ahead) continue

    // Walk back to the hop where the rise began, then forward to the sample.
    let start = frame
    while (start > 0 && frame - start < FLUX_LOOKBACK_HOPS && flux[start - 1] > 0.5 * value) {
      start -= 1
    }
    if (
      start * hopSec < START_EDGE_SECONDS &&
      !levels.some((band) => startsWithAttack(band, hopSec))
    ) {
      continue
    }

    const time = refineOnset(mono, start * hop, (start + FLUX_LOOKBACK_HOPS + 1) * hop) / sampleRate
    const previous = onsets[onsets.length - 1]
    if (previous !== undefined && time - previous < minGapSec) continue
    onsets.push(time)
  }

  return onsets
}

/**
 * The tempo of an onset train, or null with fewer than four onsets or no
 * regular pulse. The beat is the interval (or its power-of-two relatives) that
 * most onset pairs are apart, folded into 60–180 bpm: searched in the 80–160
 * octave, then doubled in length when the onsets only ever fall two such beats
 * apart (a four-on-the-floor at 70 bpm reads 70, not 140). Onset times alone
 * carry no accents, so a loop felt at 170 reads 85, and a shuffle may read as
 * its triplet pulse.
 */
export function estimateTempo(
  onsetsSec: readonly number[],
  durationSec: number,
): TempoEstimate | null {
  const onsets = onsetsSec.filter((time) => Number.isFinite(time)).sort((a, b) => a - b)
  if (onsets.length < MIN_TEMPO_ONSETS) return null

  const first = onsets[0]
  const last = onsets[onsets.length - 1]
  const span = Math.max(last - first, Number.isFinite(durationSec) ? durationSec : 0)
  const maxLag = Math.min(TEMPO_MAX_LAG_SECONDS, span)
  const bins = Math.floor(maxLag / TEMPO_BIN_SECONDS) + 1
  const shortestBeat = 60 / TEMPO_SEARCH_MAX_BPM
  if (bins <= shortestBeat / TEMPO_BIN_SECONDS) return null

  // Autocorrelation of the onset train: every pair adds one at its interval.
  const histogram = new Float32Array(bins)
  for (let i = 0; i < onsets.length; i++) {
    for (let j = i + 1; j < onsets.length; j++) {
      const bin = Math.round((onsets[j] - onsets[i]) / TEMPO_BIN_SECONDS)
      if (bin >= bins) break
      histogram[bin] += 1
    }
  }
  const pairs = smooth(histogram, TEMPO_SMOOTHING_SECONDS / TEMPO_BIN_SECONDS)
  const at = (lagSec: number): number => {
    const bin = Math.round(lagSec / TEMPO_BIN_SECONDS)
    return bin > 0 && bin < bins ? pairs[bin] : 0
  }

  let beatSec = 0
  let best = 0
  const longestBeat = 60 / TEMPO_SEARCH_MIN_BPM
  for (let lag = shortestBeat; lag < longestBeat; lag += TEMPO_BIN_SECONDS) {
    let score = 0
    for (const [multiple, weight] of TEMPO_COMB) score += weight * at(lag * multiple)
    if (score > best) {
      best = score
      beatSec = lag
    }
  }
  if (beatSec === 0) return null

  // No pair one beat apart but plenty two apart: the pulse is the slower one.
  if (
    2 * beatSec <= 60 / MIN_TEMPO_BPM &&
    at(beatSec) < TEMPO_HALF_TIME_SUPPORT * at(2 * beatSec)
  ) {
    beatSec *= 2
  }

  // Refine on the sixteenth grid (each onset steps a whole number of cells
  // from the one before, so slow drift does not break the assignment), twice.
  for (let pass = 0; pass < 2; pass++) beatSec = fitGrid(onsets, beatSec / 4) * 4

  const bpm = 60 / beatSec
  if (!(bpm >= MIN_TEMPO_BPM - 1e-6 && bpm <= MAX_TEMPO_BPM + 1e-6)) return null

  let confidence = 0
  for (const [division, weight] of TEMPO_GRIDS) {
    confidence = Math.max(confidence, weight * gridRegularity(onsets, beatSec / division))
  }
  if (confidence < TEMPO_MIN_CONFIDENCE) return null
  return { bpm, confidence: Math.min(1, confidence), beatSec }
}

// --- Envelope -----------------------------------------------------------------

/** The per-hop level of a sound, shared by onset detection and `analyzeSound`. */
export interface OnsetEnvelope {
  /** Hop length in frames. */
  hop: number
  /** Number of hops. */
  frames: number
  /** The mono mix the envelope was taken from. */
  mono: Float32Array
  /** Smoothed RMS per hop, linear. */
  level: Float32Array
  /** Loudest value in `level`. */
  peak: number
  /** Linear level per band: full band (`level`), then the first difference. */
  levels: readonly [Float32Array, Float32Array]
  /** `log(1 + gain × level / peak)` of each band. */
  compressed: readonly [Float32Array, Float32Array]
}

/** The envelope `detectOnsets` works on, or null for empty or silent input. */
export function onsetEnvelope(
  channels: readonly Float32Array[],
  sampleRate: number,
  hopSec?: number,
): OnsetEnvelope | null {
  if (channels.length === 0 || !(sampleRate > 0)) return null
  const length = channels.reduce(
    (shortest, channel) => Math.min(shortest, channel.length),
    Infinity,
  )
  const hop = Math.max(1, Math.round(positiveOr(hopSec, DEFAULT_ONSET_HOP_SECONDS) * sampleRate))
  const frames = Math.floor(length / hop)
  if (frames < 1) return null

  const mono = mixToMono(channels, length)
  const full = new Float32Array(frames)
  const high = new Float32Array(frames)
  let previous = 0
  for (let frame = 0; frame < frames; frame++) {
    let sum = 0
    let sumHigh = 0
    const end = (frame + 1) * hop
    for (let index = frame * hop; index < end; index++) {
      const value = mono[index]
      const difference = value - previous
      sum += value * value
      sumHigh += difference * difference
      previous = value
    }
    full[frame] = sum / hop
    high[frame] = sumHigh / hop
  }

  const level = rootOfSmoothed(full)
  const levelHigh = rootOfSmoothed(high)
  const peak = maxOf(level)
  if (!(peak > SILENCE_RMS)) return null
  return {
    hop,
    frames,
    mono,
    level,
    peak,
    levels: [level, levelHigh],
    compressed: [compress(level, peak), compress(levelHigh, maxOf(levelHigh))],
  }
}

function mixToMono(channels: readonly Float32Array[], length: number): Float32Array {
  if (channels.length === 1) return channels[0].subarray(0, length)
  const mono = new Float32Array(length)
  for (const channel of channels) {
    for (let index = 0; index < length; index++) mono[index] += channel[index]
  }
  const scale = 1 / channels.length
  for (let index = 0; index < length; index++) mono[index] *= scale
  return mono
}

/** `[1, 2, 1] / 4` over the mean squares (steadies low tones), then the root. */
function rootOfSmoothed(meanSquare: Float32Array): Float32Array {
  const frames = meanSquare.length
  const out = new Float32Array(frames)
  for (let frame = 0; frame < frames; frame++) {
    const before = meanSquare[Math.max(0, frame - 1)]
    const after = meanSquare[Math.min(frames - 1, frame + 1)]
    out[frame] = Math.sqrt((before + 2 * meanSquare[frame] + after) / 4)
  }
  return out
}

function compress(level: Float32Array, peak: number): Float32Array {
  const out = new Float32Array(level.length)
  if (!(peak > 0)) return out
  for (let frame = 0; frame < level.length; frame++) {
    out[frame] = Math.log(1 + (COMPRESSION_GAIN * level[frame]) / peak)
  }
  return out
}

/** True when the opening level has fallen away a moment later (see START_DECAY_RATIO). */
function startsWithAttack(level: Float32Array, hopSec: number): boolean {
  const frames = level.length
  const openingFrames = Math.max(1, Math.round(START_OPENING_SECONDS / hopSec))
  // Too short to tell a hit from a cut: a click is a hit.
  if (frames <= 2 * openingFrames) return true

  let from = Math.round(START_LATER_FROM_SECONDS / hopSec)
  let to = Math.round(START_LATER_TO_SECONDS / hopSec)
  if (to > frames) {
    // A short sound: compare against its second half instead.
    from = Math.max(openingFrames, Math.floor(frames / 2))
    to = frames
  }
  return mean(level, from, to) <= START_DECAY_RATIO * mean(level, 0, openingFrames)
}

/**
 * The first sample in `[from, to)` whose step from the previous sample reaches
 * a fraction of the largest step in that span: the differenced signal shows a
 * transient even over a loud sustained low note.
 */
function refineOnset(mono: Float32Array, from: number, to: number): number {
  const end = Math.min(mono.length, to)
  const step = (index: number): number => Math.abs(mono[index] - (index > 0 ? mono[index - 1] : 0))
  let largest = 0
  for (let index = from; index < end; index++) largest = Math.max(largest, step(index))
  const threshold = REFINE_PEAK_FRACTION * largest
  for (let index = from; index < end; index++) {
    if (step(index) >= threshold) return index
  }
  return from
}

// --- Tempo helpers --------------------------------------------------------------

/** Gaussian smoothing with the given standard deviation in bins. */
function smooth(values: Float32Array, sigmaBins: number): Float32Array {
  const radius = Math.max(1, Math.ceil(3 * sigmaBins))
  const kernel = new Float32Array(2 * radius + 1)
  for (let offset = -radius; offset <= radius; offset++) {
    kernel[offset + radius] = Math.exp(-0.5 * (offset / sigmaBins) ** 2)
  }
  const out = new Float32Array(values.length)
  // Sparse input: spread each occupied bin instead of convolving every bin.
  for (let bin = 0; bin < values.length; bin++) {
    const value = values[bin]
    if (value === 0) continue
    const from = Math.max(0, bin - radius)
    const to = Math.min(values.length - 1, bin + radius)
    for (let target = from; target <= to; target++) {
      out[target] += value * kernel[target - bin + radius]
    }
  }
  return out
}

/**
 * Least-squares cell length of the grid the onsets sit on, starting from
 * `cellSec`: each onset is placed a whole number of cells after the previous
 * one, then a line is fitted through (cell index, time).
 */
function fitGrid(onsets: readonly number[], cellSec: number): number {
  let index = 0
  let sumIndex = 0
  let sumTime = 0
  let sumIndexTime = 0
  let sumIndexIndex = 0
  for (let i = 0; i < onsets.length; i++) {
    if (i > 0) index += Math.round((onsets[i] - onsets[i - 1]) / cellSec)
    sumIndex += index
    sumTime += onsets[i]
    sumIndexTime += index * onsets[i]
    sumIndexIndex += index * index
  }
  const count = onsets.length
  const denominator = count * sumIndexIndex - sumIndex * sumIndex
  if (denominator <= 0) return cellSec
  const fitted = (count * sumIndexTime - sumIndex * sumTime) / denominator
  // A fit that runs away from its starting point is not a refinement.
  return Math.abs(fitted - cellSec) < 0.1 * cellSec ? fitted : cellSec
}

/**
 * 0..1: how closely consecutive onsets are a whole number of `cellSec` apart.
 * Random intervals miss the grid by a quarter of a cell on average, which
 * scores 0; intervals exactly on the grid score 1.
 */
function gridRegularity(onsets: readonly number[], cellSec: number): number {
  let miss = 0
  for (let i = 1; i < onsets.length; i++) {
    const cells = (onsets[i] - onsets[i - 1]) / cellSec
    // An interval shorter than half a cell is off the grid, not on cell zero.
    miss += cells < 0.5 ? 0.5 : Math.abs(cells - Math.round(cells))
  }
  // One interval is spent on choosing the grid, so it does not count as evidence.
  return Math.max(0, 1 - miss / Math.max(1, onsets.length - 2) / 0.25)
}

// --- Small numerics -------------------------------------------------------------

function positiveOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback
}

function mean(values: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let index = from; index < to; index++) sum += values[index]
  return to > from ? sum / (to - from) : 0
}

function maxOf(values: Float32Array): number {
  let max = 0
  for (const value of values) if (value > max) max = value
  return max
}

/** Median of `values[from, to)`, using `scratch` (at least that long) for the sort. */
function median(values: Float32Array, from: number, to: number, scratch: Float32Array): number {
  const count = to - from
  const sorted = scratch.subarray(0, count)
  sorted.set(values.subarray(from, to))
  sorted.sort()
  const middle = count >> 1
  return count % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
