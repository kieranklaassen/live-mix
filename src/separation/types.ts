// What a separation is made of. A finished track goes in and comes back as
// four stems and a remainder, the remainder being the track minus the four,
// so the five added together are the track again.

/** The four stems, in the order a desk lists them. */
export const STEM_NAMES = ['vocals', 'drums', 'bass', 'other'] as const
export type StemName = (typeof STEM_NAMES)[number]

/** The four stems and what is left of the track once they are taken out of it. */
export const PART_NAMES = [...STEM_NAMES, 'remainder'] as const
export type PartName = (typeof PART_NAMES)[number]

/** One part's sound, a `Float32Array` a channel. */
export type Channels = readonly Float32Array[]

export interface SeparationProgress {
  /** Steps finished so far. */
  done: number
  /** Steps in the whole run. */
  total: number
}

export interface SeparateOptions {
  /** Ends the run: it rejects with the signal's reason and returns nothing. */
  signal?: AbortSignal
  /** Called as the run goes on, once a step. */
  onProgress?: (progress: SeparationProgress) => void
}

/**
 * Something that splits a track into its four stems. A model run in the
 * browser is one (`createSegmentSeparator`); a host that sends the track to a
 * service of its own writes another.
 */
export interface Separator {
  /** The sample rate the separator takes its sound at and returns its stems at. */
  readonly sampleRate: number
  /**
   * Two channels at `sampleRate` in; for each stem, two channels of the same
   * length out. The channels handed in are not written to.
   */
  separate(channels: Channels, options?: SeparateOptions): Promise<Record<StemName, Channels>>
}

/** What a run measured. */
export interface SeparationReport {
  /**
   * The remainder's level against the track's, in dB, both as the mean square
   * over every channel. `-Infinity` when the stems add up to the track.
   */
  remainderDb: number
  /** The remainder's largest sample. */
  remainderPeak: number
  /** The sample rate the separator worked at. */
  modelSampleRate: number
  /** Whether the track was resampled to that rate, and the stems back. */
  resampled: boolean
}

/** A track as its four stems and a remainder, each at the track's rate, length and channel count. */
export interface Separation {
  sampleRate: number
  stems: Record<StemName, Channels>
  /** The track minus the four stems. */
  remainder: Channels
  report: SeparationReport
}

/** Thrown when a track cannot be separated, or a separator's answer cannot be used. */
export class SeparationError extends Error {
  constructor(message: string) {
    super(`live-mix: ${message}`)
    this.name = 'SeparationError'
  }
}

/**
 * The two parts of an ONNX runtime a model is run with. The library imports
 * no runtime: a host passes the `Tensor` class of the one it loaded and the
 * session it made with it (`onnxruntime-web`'s fit as they are).
 */
export interface ModelRuntime<Tensor> {
  Tensor: new (type: 'float32', data: Float32Array, dims: readonly number[]) => Tensor
  session: ModelSession<Tensor>
}

/** The part of an inference session a model is run through. */
export interface ModelSession<Tensor> {
  readonly inputNames: readonly string[]
  readonly outputNames: readonly string[]
  run(feeds: Record<string, Tensor>): Promise<Record<string, unknown>>
}
