// What kind of sound a decoded sample is, from cheap features of its raw
// channel arrays: no Web Audio dependency and no FFT, computed once at decode
// time (see `SampleStore`) next to the waveform peaks, so a UI can label a
// sample, mark its hits and offer to loop it at its tempo.
//
// Features: duration; onsets and their tempo (./onsets); the level envelope
// (how fast the loudest part is reached, how much is left at the end, how flat
// the level is over the whole length); and tonality, the strength of the best
// repeat in the short-time autocorrelation, which is near 1 for anything with
// pitch and near 0 for noise whatever its colour.
//
// Rules, first match wins:
//   beat     regular onsets: a confident tempo from four or more hits (more
//            confident still when there are only a handful, since a few
//            random hits land near some grid quite often).
//   oneshot  at most one strong hit, reached fast, mostly gone by the end
//            (short or long tail); or anything too short to be anything else.
//   melodic  tonal, with two or more strong hits and no regular pulse.
//   drone    tonal, no hits, level nearly flat for the whole length.
//   pad      tonal, no hits, level swelling or moving slowly.
//   texture  noisy and sustained (rain, hiss, wind, creek); also noisy sounds
//            with scattered irregular hits once they are longer than a phrase,
//            and silence.

import { estimateTempo, onsetEnvelope, pickOnsets, type TempoEstimate } from './onsets'

export type SoundKind = 'texture' | 'pad' | 'drone' | 'oneshot' | 'melodic' | 'beat'

export interface SoundAnalysis {
  kind: SoundKind
  /** Onset (hit) times in seconds, ascending. */
  onsetsSec: number[]
  /**
   * The tempo of a `beat`; null for every other kind (call `estimateTempo` on
   * `onsetsSec` for the unconfident guess).
   */
  tempo: TempoEstimate | null
  /** True for a beat whose length is a whole number of beats, so it repeats seamlessly. */
  loop: boolean
}

/** `beat`: the tempo must be at least this confident… */
export const BEAT_MIN_CONFIDENCE = 0.6
/** …from at least this many hits… */
export const BEAT_MIN_ONSETS = 4
/** …and with fewer hits than this, at least as confident as BEAT_FEW_MIN_CONFIDENCE. */
export const BEAT_FEW_ONSETS = 6
export const BEAT_FEW_MIN_CONFIDENCE = 0.8
/** `loop`: the length may miss a whole number of beats by this fraction of a beat… */
export const LOOP_BEAT_TOLERANCE = 0.08
/** …and must hold at least this many beats. */
export const LOOP_MIN_BEATS = 2
/** A hit is "strong" when it reaches this fraction of the level of the loudest hit. */
export const STRONG_ONSET_RATIO = 0.4
/** `oneshot`: the loudest part is reached within this many seconds… */
export const ONESHOT_MAX_ATTACK_SECONDS = 0.12
/** …and the last quarter after it averages at most this fraction of the peak level. */
export const ONESHOT_MAX_TAIL_RATIO = 0.35
/** Anything shorter than this with at most one strong hit is a one-shot, whatever its shape. */
export const ONESHOT_MAX_SHORT_SECONDS = 0.5
/** A noisy run of irregular hits up to this long is one gesture (a fill, a flam): a one-shot. */
export const NOISY_PHRASE_MAX_SECONDS = 2
/** `melodic`: at least this many strong hits. */
export const MELODIC_MIN_ONSETS = 2
/** Tonality at or above this is "tonal"; below, "noisy". */
export const TONAL_MIN_TONALITY = 0.5
/** `drone` (vs `pad`): the quiet tenth of the sound is at least this fraction of its loud tenth. */
export const DRONE_MIN_FLATNESS = 0.7

/** Level at or below this fraction of the peak is where an attack starts from. */
const ATTACK_FROM_RATIO = 0.1
/** …and the attack is over on reaching this fraction of the peak. */
const ATTACK_TO_RATIO = 0.8
/** A hit's level is the loudest the envelope gets within this many seconds after it. */
const ONSET_LEVEL_WINDOW_SECONDS = 0.1
/** Flatness is measured on the level averaged over this many seconds. */
const FLATNESS_SMOOTHING_SECONDS = 0.05
/** Tonality works at roughly this sample rate (box-decimated)… */
const TONALITY_SAMPLE_RATE = 11025
/** …on windows this long… */
const TONALITY_WINDOW_SECONDS = 0.04
/** …looking for repeats up to this period (40 Hz)… */
const TONALITY_MAX_PERIOD_SECONDS = 0.025
/** …at up to this many places spread over the sound… */
const TONALITY_MAX_WINDOWS = 24
/** …skipping those quieter than this fraction of the loudest one. */
const TONALITY_MIN_WINDOW_LEVEL = 0.1

/** The features `analyzeSound` decides from; exported for tuning and debugging. */
export interface SoundFeatures {
  durationSec: number
  /** Seconds from near-silence (or the start) to 80 % of the peak level. */
  attackSec: number
  /** Mean level of the last quarter after the attack, relative to the peak. */
  tailRatio: number
  /** 10th percentile of the level over the 90th: 1 is perfectly flat. */
  flatness: number
  /** 0..1: strength of the best repeat in the short-time autocorrelation. */
  tonality: number
  /** Onsets at least `STRONG_ONSET_RATIO` as loud as the loudest onset. */
  strongOnsets: number
}

/**
 * Classify a decoded sound and report its hits and tempo. Takes raw channel
 * arrays rather than an AudioBuffer so it stays testable outside the browser.
 */
export function analyzeSound(channels: readonly Float32Array[], sampleRate: number): SoundAnalysis {
  const envelope = onsetEnvelope(channels, sampleRate)
  // Empty or silent: nothing to mark, and nothing that needs triggering.
  if (!envelope) return { kind: 'texture', onsetsSec: [], tempo: null, loop: false }

  const onsetsSec = pickOnsets(envelope, sampleRate)
  const durationSec = envelope.mono.length / sampleRate
  const tempo = estimateTempo(onsetsSec, durationSec)

  // beat: regular onsets with a confident tempo.
  if (tempo && isBeat(tempo, onsetsSec.length)) {
    const beats = durationSec / tempo.beatSec
    const whole = Math.round(beats)
    const loop = whole >= LOOP_MIN_BEATS && Math.abs(beats - whole) <= LOOP_BEAT_TOLERANCE
    return { kind: 'beat', onsetsSec, tempo, loop }
  }

  const features = soundFeatures(envelope.mono, envelope.level, sampleRate, onsetsSec)
  return { kind: kindOf(features), onsetsSec, tempo: null, loop: false }
}

function isBeat(tempo: TempoEstimate, onsets: number): boolean {
  if (onsets < BEAT_MIN_ONSETS) return false
  return (
    tempo.confidence >= (onsets < BEAT_FEW_ONSETS ? BEAT_FEW_MIN_CONFIDENCE : BEAT_MIN_CONFIDENCE)
  )
}

/** The non-beat rules (see the header), on features alone. */
export function kindOf(features: SoundFeatures): Exclude<SoundKind, 'beat'> {
  const { durationSec, attackSec, tailRatio, flatness, tonality, strongOnsets } = features
  const tonal = tonality >= TONAL_MIN_TONALITY
  const percussive = attackSec <= ONESHOT_MAX_ATTACK_SECONDS && tailRatio <= ONESHOT_MAX_TAIL_RATIO

  // oneshot: one dominant attack then decay, or simply too short to sustain.
  if (strongOnsets <= 1 && (percussive || durationSec < ONESHOT_MAX_SHORT_SECONDS)) return 'oneshot'

  if (tonal) {
    // melodic: several hits with pitch and no regular pulse.
    if (strongOnsets >= MELODIC_MIN_ONSETS) return 'melodic'
    // drone: level nearly flat throughout; pad: it swells or moves.
    return flatness >= DRONE_MIN_FLATNESS ? 'drone' : 'pad'
  }

  // A short noisy run of hits (a fill, a flam, a rattle) is triggered like a one-shot.
  if (strongOnsets >= MELODIC_MIN_ONSETS && durationSec <= NOISY_PHRASE_MAX_SECONDS)
    return 'oneshot'
  // texture: noisy and sustained.
  return 'texture'
}

/**
 * The features behind `kindOf`. `level` is the per-hop RMS of `mono` (hops of
 * `mono.length / level.length` frames, as `onsetEnvelope` returns it).
 */
export function soundFeatures(
  mono: Float32Array,
  level: Float32Array,
  sampleRate: number,
  onsetsSec: readonly number[],
): SoundFeatures {
  const frames = level.length
  const durationSec = mono.length / sampleRate
  const hopSec = frames > 0 ? durationSec / frames : 0
  let peak = 0
  for (const value of level) if (value > peak) peak = value
  if (frames === 0 || !(peak > 0)) {
    return { durationSec, attackSec: 0, tailRatio: 0, flatness: 1, tonality: 0, strongOnsets: 0 }
  }

  // Attack: from the last near-silent hop before the level first nears its peak.
  let reached = 0
  while (reached < frames - 1 && level[reached] < ATTACK_TO_RATIO * peak) reached += 1
  let from = reached
  while (from >= 0 && level[from] > ATTACK_FROM_RATIO * peak) from -= 1
  const attackSec = (reached - from) * hopSec

  // Tail: what is left in the last quarter of the sound after the attack.
  const tailFrom = Math.min(frames - 1, reached + Math.floor(((frames - reached) * 3) / 4))
  let tailSum = 0
  for (let frame = tailFrom; frame < frames; frame++) tailSum += level[frame]
  const tailRatio = tailSum / (frames - tailFrom) / peak

  // Strong onsets: those nearly as loud as the loudest.
  const window = Math.max(1, Math.round(ONSET_LEVEL_WINDOW_SECONDS / hopSec))
  const onsetLevels = onsetsSec.map((time) => {
    const start = Math.min(frames - 1, Math.max(0, Math.floor(time / hopSec)))
    let loudest = 0
    for (let frame = start; frame < Math.min(frames, start + window); frame++) {
      if (level[frame] > loudest) loudest = level[frame]
    }
    return loudest
  })
  const loudestOnset = Math.max(0, ...onsetLevels)
  const strongOnsets = onsetLevels.filter(
    (value) => value >= STRONG_ONSET_RATIO * loudestOnset,
  ).length

  return {
    durationSec,
    attackSec,
    tailRatio,
    flatness: levelFlatness(level, Math.max(1, Math.round(FLATNESS_SMOOTHING_SECONDS / hopSec))),
    tonality: tonalityOf(mono, sampleRate),
    strongOnsets,
  }
}

/** 10th over 90th percentile of the level, averaged over `smoothing` hops. */
function levelFlatness(level: Float32Array, smoothing: number): number {
  const count = Math.max(1, Math.floor(level.length / smoothing))
  const slow = new Float32Array(count)
  for (let block = 0; block < count; block++) {
    const start = block * smoothing
    const end = Math.min(level.length, start + smoothing)
    let sum = 0
    for (let frame = start; frame < end; frame++) sum += level[frame]
    slow[block] = sum / (end - start)
  }
  slow.sort()
  const high = slow[Math.min(count - 1, Math.floor(count * 0.9))]
  const low = slow[Math.floor(count * 0.1)]
  return high > 0 ? low / high : 1
}

/**
 * How pitched the sound is, 0..1: the median, over windows spread across the
 * sound, of the highest normalised autocorrelation past the first zero
 * crossing. A tone repeats itself a period later (near 1); noise does not
 * (near 0). The signal is first-differenced so that the slow wander of
 * rumbling (brown, pink) noise is not mistaken for a repeat.
 */
function tonalityOf(mono: Float32Array, sampleRate: number): number {
  const factor = Math.max(1, Math.floor(sampleRate / TONALITY_SAMPLE_RATE))
  const rate = sampleRate / factor
  const window = Math.max(8, Math.round(TONALITY_WINDOW_SECONDS * rate))
  const maxLag = Math.max(4, Math.round(TONALITY_MAX_PERIOD_SECONDS * rate))
  const span = window + maxLag
  const available = Math.floor(mono.length / factor) - 1
  if (available < span) return 0

  const places = Math.min(TONALITY_MAX_WINDOWS, Math.max(1, Math.floor(available / span)))
  const segment = new Float32Array(span)
  const scores: { level: number; score: number }[] = []
  for (let place = 0; place < places; place++) {
    // Centre each window in its share of the sound.
    const start = Math.floor(((place + 0.5) * available) / places - span / 2)
    fillDifferenced(mono, Math.max(0, Math.min(available - span, start)), factor, segment)
    let energy = 0
    for (let index = 0; index < window; index++) energy += segment[index] * segment[index]
    scores.push({ level: Math.sqrt(energy / window), score: bestRepeat(segment, window, maxLag) })
  }

  const loudest = Math.max(...scores.map((entry) => entry.level))
  if (!(loudest > 0)) return 0
  const kept = scores
    .filter((entry) => entry.level >= TONALITY_MIN_WINDOW_LEVEL * loudest)
    .map((entry) => entry.score)
    .sort((a, b) => a - b)
  const middle = kept.length >> 1
  const result = kept.length % 2 === 1 ? kept[middle] : (kept[middle - 1] + kept[middle]) / 2
  return Math.min(1, Math.max(0, result))
}

/** `out[i]` = difference of consecutive box-decimated samples, from decimated index `start`. */
function fillDifferenced(
  mono: Float32Array,
  start: number,
  factor: number,
  out: Float32Array,
): void {
  let previous = decimated(mono, start, factor)
  for (let index = 0; index < out.length; index++) {
    const value = decimated(mono, start + index + 1, factor)
    out[index] = value - previous
    previous = value
  }
}

function decimated(mono: Float32Array, index: number, factor: number): number {
  let sum = 0
  const from = index * factor
  for (let offset = 0; offset < factor; offset++) sum += mono[from + offset]
  return sum / factor
}

/** Highest normalised autocorrelation of `segment[0, window)` at lags past the first zero crossing. */
function bestRepeat(segment: Float32Array, window: number, maxLag: number): number {
  let energy = 0
  for (let index = 0; index < window; index++) energy += segment[index] * segment[index]
  if (!(energy > 0)) return 0

  // Energy of the lagged window, updated as it slides.
  let lagged = energy
  let crossed = false
  let best = 0
  for (let lag = 1; lag <= maxLag; lag++) {
    const leaving = segment[lag - 1]
    const entering = segment[lag + window - 1]
    lagged += entering * entering - leaving * leaving
    let dot = 0
    for (let index = 0; index < window; index++) dot += segment[index] * segment[index + lag]
    const correlation = lagged > 0 ? dot / Math.sqrt(energy * lagged) : 0
    if (!crossed) {
      if (correlation < 0) crossed = true
      continue
    }
    if (correlation > best) best = correlation
  }
  return best
}
