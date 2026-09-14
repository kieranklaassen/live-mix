// Voice assets for a script's cues. TTS is out of scope for the library
// (tuin runs qwen3-tts on Replicate; Breathwork Live speaks live): the
// compiler only needs, per cue, a URL it can put in a score source and how
// long the clip lasts. `VoiceProvider` is that contract, synchronous so
// compilation stays a pure function; `synthesizeVoice` runs any async
// synthesizer over the whole script first and hands back a static provider;
// `estimatedVoiceProvider` needs no audio at all — durations from the words —
// for previews, tests and timing checks before the TTS credits are spent.

import {
  pauseSeconds,
  stripPauseTags,
  type ScriptSection,
  type SessionScript,
  type VoiceCue,
} from './script'

export interface VoiceAsset {
  /** Where the clip loads from (any URL the consumer's sample resolver understands). */
  url: string
  durationSec: number
  /** Score source id; default `voice:<cueKey>`. */
  id?: string
}

export interface VoiceCueRef {
  script: SessionScript
  sectionIndex: number
  section: ScriptSection
  cueIndex: number
  cue: VoiceCue
  /** `s1-c3`: stable across compiles, what static providers are keyed by. */
  key: string
}

export interface VoiceProvider {
  asset(ref: VoiceCueRef): VoiceAsset
}

/** `s1-c1` for the first cue of the first part. */
export function cueKey(sectionIndex: number, cueIndex: number): string {
  return `s${sectionIndex + 1}-c${cueIndex + 1}`
}

/** Every cue of the script with its reference, in timeline order. */
export function cueRefs(script: SessionScript): VoiceCueRef[] {
  const refs: VoiceCueRef[] = []
  script.sections.forEach((section, sectionIndex) => {
    section.cues.forEach((cue, cueIndex) => {
      refs.push({
        script,
        sectionIndex,
        section,
        cueIndex,
        cue,
        key: cueKey(sectionIndex, cueIndex),
      })
    })
  })
  return refs
}

export interface EstimateOptions {
  /** Speaking rate of the voice. Default 130 (a slow, guided delivery). */
  wordsPerMinute?: number
  /** Silence after the last word the clip carries. Default 0.6 s. */
  tailSec?: number
  /** URL for a cue. Default `voice://estimate/<key>`. */
  urlFor?: (ref: VoiceCueRef) => string
}

/** Seconds a cue takes to speak: words at the rate plus its pause tags plus the tail. */
export function estimateSpeechSeconds(text: string, options: EstimateOptions = {}): number {
  const wpm = options.wordsPerMinute ?? 130
  const words = stripPauseTags(text)
    .split(/\s+/)
    .filter((word) => word.length > 0).length
  const spoken = (words / wpm) * 60
  return roundMs(spoken + pauseSeconds(text) + (options.tailSec ?? 0.6))
}

/**
 * A provider with no audio behind it: deterministic URLs and estimated
 * durations. The compiler's fake for tests and the planner's preview before
 * synthesis; a consumer swaps in the real assets and recompiles.
 */
export function estimatedVoiceProvider(options: EstimateOptions = {}): VoiceProvider {
  const urlFor = options.urlFor ?? ((ref: VoiceCueRef) => `voice://estimate/${ref.key}`)
  return {
    asset: (ref) => ({
      url: urlFor(ref),
      durationSec: estimateSpeechSeconds(ref.cue.text, options),
    }),
  }
}

/**
 * Assets by cue key. Missing keys fall through to `fallback` (default: the
 * estimated provider), so a partially synthesised script still compiles.
 */
export function staticVoiceProvider(
  assets: Readonly<Record<string, VoiceAsset>>,
  fallback: VoiceProvider = estimatedVoiceProvider(),
): VoiceProvider {
  return {
    asset: (ref) => assets[ref.key] ?? fallback.asset(ref),
  }
}

/** An async TTS adapter: the consumer's Replicate / ElevenLabs / local call. */
export interface VoiceSynthesizer {
  synthesize(text: string, ref: VoiceCueRef): Promise<VoiceAsset>
}

export interface SynthesizeVoiceOptions {
  /** Parallel requests. Default 4. */
  concurrency?: number
  /** Keys already synthesised (resume, like tuin's voices/ directory). */
  existing?: Readonly<Record<string, VoiceAsset>>
  /** Progress, per finished cue. */
  onAsset?: (key: string, asset: VoiceAsset, done: number, total: number) => void
}

export interface SynthesizedVoice {
  provider: VoiceProvider
  assets: Record<string, VoiceAsset>
}

/**
 * Synthesise every cue that is not in `existing`, with bounded concurrency,
 * and return a static provider over the result. The text handed to the
 * synthesizer keeps its pause tags — the adapter decides whether its engine
 * reads them or needs them stripped (`stripPauseTags`).
 */
export async function synthesizeVoice(
  script: SessionScript,
  synthesizer: VoiceSynthesizer,
  options: SynthesizeVoiceOptions = {},
): Promise<SynthesizedVoice> {
  const assets: Record<string, VoiceAsset> = { ...options.existing }
  const pending = cueRefs(script).filter((ref) => !(ref.key in assets))
  const total = pending.length
  let done = 0
  let next = 0
  const worker = async (): Promise<void> => {
    while (next < pending.length) {
      const ref = pending[next]
      next += 1
      const asset = await synthesizer.synthesize(ref.cue.text, ref)
      assets[ref.key] = asset
      done += 1
      options.onAsset?.(ref.key, asset, done, total)
    }
  }
  const lanes = Math.max(1, Math.min(options.concurrency ?? 4, pending.length))
  await Promise.all(Array.from({ length: lanes }, () => worker()))
  return { provider: staticVoiceProvider(assets), assets }
}

function roundMs(seconds: number): number {
  return Math.round(seconds * 1000) / 1000
}
