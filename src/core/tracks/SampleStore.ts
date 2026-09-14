// Decoded samples by id. Lifted from Breathwork Live `musicEngine.ts`
// `ensureLoaded` (fetch → decodeAudioData, cached by id as a promise so a
// track is fetched once however many times it is asked for) and ambient-live
// `audio-engine.ts` `loadSample`/`sample`/`forgetSample` (decode plus waveform
// peaks at decode time). Decoding runs on the engine's context so the PCM is
// already at the output sample rate.

import { computePeaks, DEFAULT_PEAK_BUCKETS, type WaveformPeaks } from '../clips/peaks'

/** A decoded sample, kept for playback and (optionally) waveform drawing. */
export interface LoadedSample {
  id: string
  buffer: AudioBuffer
  durationSec: number
  /** Present when the store computes peaks (ambient-live); null otherwise. */
  peaks: WaveformPeaks | null
}

/** What `load` accepts: a URL to fetch, encoded bytes, or an already-decoded buffer. */
export type SampleSource = string | ArrayBuffer | AudioBuffer

export interface SampleStoreOptions {
  fetchImpl?: typeof fetch
  /** Compute min/max peaks at decode time; `true` = 512 buckets, or a bucket count. */
  peaks?: boolean | number
}

export class SampleStore {
  private readonly ctx: BaseAudioContext
  private readonly fetchImpl: typeof fetch
  private readonly peakBuckets: number | null
  private readonly loaded = new Map<string, LoadedSample>()
  private readonly pending = new Map<string, Promise<LoadedSample>>()

  constructor(ctx: BaseAudioContext, options: SampleStoreOptions = {}) {
    this.ctx = ctx
    this.fetchImpl = options.fetchImpl ?? ((...args) => fetch(...args))
    this.peakBuckets =
      options.peaks === true
        ? DEFAULT_PEAK_BUCKETS
        : typeof options.peaks === 'number'
          ? options.peaks
          : null
  }

  /**
   * Decode `source` under `id`, once. Concurrent and repeated calls share the
   * same promise; a failed load is forgotten so a later call can retry.
   */
  load(id: string, source: SampleSource): Promise<LoadedSample> {
    const ready = this.loaded.get(id)
    if (ready) return Promise.resolve(ready)
    const inFlight = this.pending.get(id)
    if (inFlight) return inFlight

    const promise = this.decode(id, source)
      .then((sample) => {
        this.pending.delete(id)
        this.loaded.set(id, sample)
        return sample
      })
      .catch((error: unknown) => {
        this.pending.delete(id)
        throw error
      })
    this.pending.set(id, promise)
    return promise
  }

  /** The decoded sample, or undefined until `load` resolves. */
  get(id: string): LoadedSample | undefined {
    return this.loaded.get(id)
  }

  has(id: string): boolean {
    return this.loaded.has(id)
  }

  /** The in-flight load for `id`, if any. */
  loading(id: string): Promise<LoadedSample> | undefined {
    return this.pending.get(id)
  }

  /** Drop a decoded sample (a pending load still completes but is not kept). */
  forget(id: string): void {
    this.loaded.delete(id)
    this.pending.delete(id)
  }

  clear(): void {
    this.loaded.clear()
    this.pending.clear()
  }

  get size(): number {
    return this.loaded.size
  }

  private async decode(id: string, source: SampleSource): Promise<LoadedSample> {
    const buffer =
      typeof source === 'string'
        ? await this.ctx.decodeAudioData(await this.fetchBytes(source))
        : source instanceof ArrayBuffer
          ? await this.ctx.decodeAudioData(source)
          : source
    return {
      id,
      buffer,
      durationSec: buffer.duration,
      peaks: this.peakBuckets === null ? null : peaksOf(buffer, this.peakBuckets),
    }
  }

  private async fetchBytes(url: string): Promise<ArrayBuffer> {
    const response = await this.fetchImpl(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }
    return response.arrayBuffer()
  }
}

function peaksOf(buffer: AudioBuffer, buckets: number): WaveformPeaks {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
    buffer.getChannelData(index),
  )
  return computePeaks(channels, buffer.length, buckets)
}
