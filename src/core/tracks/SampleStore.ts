// Decoded samples by id. Lifted from Breathwork Live `musicEngine.ts`
// `ensureLoaded` (fetch → decodeAudioData, cached by id as a promise so a
// track is fetched once however many times it is asked for) and ambient-live
// `audio-engine.ts` `loadSample`/`sample`/`forgetSample` (decode plus waveform
// peaks at decode time). Decoding runs on the engine's context so the PCM is
// already at the output sample rate.
//
// Eviction (U18, R34). Decoded stereo PCM costs ~23 MB per minute at 48 kHz
// and Breathwork Live's cache was never emptied, which puts a 45-minute
// session on an iPhone at risk of being jettisoned. The store is therefore an
// LRU cache with a byte budget: every admitted sample is counted, `get` marks
// it as used, and once the total passes `budgetBytes` the least recently used
// samples are dropped — except those that are pinned (an app's explicit hold)
// or held (a refcount taken while a clip is about to play or playing; see
// `SampleRetainer`). Everything is off by default (`budgetBytes` Infinity,
// `evictOnRelease` false), so Phase 0 consumers see no change.

import { computePeaks, DEFAULT_PEAK_BUCKETS, type WaveformPeaks } from '../clips/peaks'

/** A decoded sample, kept for playback and (optionally) waveform drawing. */
export interface LoadedSample {
  /** Discriminant shared with `ElementSource` (`ClipSource`). */
  readonly kind: 'buffer'
  id: string
  buffer: AudioBuffer
  durationSec: number
  /** Decoded PCM size in bytes (channels × frames × 4). */
  bytes: number
  /** Present when the store computes peaks (ambient-live); null otherwise. */
  peaks: WaveformPeaks | null
}

/** What `load` accepts: a URL to fetch, encoded bytes, or an already-decoded buffer. */
export type SampleSource = string | ArrayBuffer | AudioBuffer

export interface SampleStoreOptions {
  fetchImpl?: typeof fetch
  /** Compute min/max peaks at decode time; `true` = 512 buckets, or a bucket count. */
  peaks?: boolean | number
  /**
   * Cap on decoded PCM bytes held. When a load pushes the total past it, the
   * least recently used samples that are neither pinned nor held are dropped
   * until it fits again. Default `Infinity`: never evict by size.
   */
  budgetBytes?: number
  /**
   * Drop a sample the moment its last hold is released (its last voice ended
   * and no upcoming clip needs it) unless it is pinned, regardless of budget.
   * Default false: released samples stay until the budget needs the room.
   */
  evictOnRelease?: boolean
}

/** Why a sample left the store through the policy (not through `forget`/`clear`). */
export type SampleEvictionReason = 'budget' | 'release'

export interface SampleEviction {
  sample: LoadedSample
  reason: SampleEvictionReason
}

export type SampleEvictionListener = (eviction: SampleEviction) => void

/** A snapshot of what the store holds and what the policy has done so far. */
export interface SampleStoreMetrics {
  /** Decoded bytes currently held. */
  bytes: number
  budgetBytes: number
  /** Samples currently held. */
  count: number
  /** Samples with an explicit pin. */
  pinned: number
  /** Samples with at least one outstanding hold. */
  held: number
  /** Samples the policy has dropped since construction. */
  evictions: number
  /** Bytes the policy has freed since construction. */
  evictedBytes: number
  /** Loads completed since construction; a sample evicted and loaded again counts twice. */
  loads: number
  /** True while pins and holds keep the store above its budget. */
  overBudget: boolean
}

/** Decoded PCM size of a buffer: Float32 per channel per frame. */
export function bytesOfBuffer(buffer: Pick<AudioBuffer, 'numberOfChannels' | 'length'>): number {
  return buffer.numberOfChannels * buffer.length * 4
}

export class SampleStore {
  private readonly ctx: BaseAudioContext
  private readonly fetchImpl: typeof fetch
  private readonly peakBuckets: number | null
  /** Insertion order is recency: `get` re-inserts, eviction walks from the front. */
  private readonly loaded = new Map<string, LoadedSample>()
  private readonly pending = new Map<string, Promise<LoadedSample>>()
  private readonly pins = new Set<string>()
  private readonly holdCounts = new Map<string, number>()
  private readonly evictionListeners = new Set<SampleEvictionListener>()
  private budget: number
  private heldBytes = 0
  private evictionCount = 0
  private evictedByteCount = 0
  private loadCount = 0
  readonly evictOnRelease: boolean

  constructor(ctx: BaseAudioContext, options: SampleStoreOptions = {}) {
    this.ctx = ctx
    this.fetchImpl = options.fetchImpl ?? ((...args) => fetch(...args))
    this.peakBuckets =
      options.peaks === true
        ? DEFAULT_PEAK_BUCKETS
        : typeof options.peaks === 'number'
          ? options.peaks
          : null
    this.budget = normaliseBudget(options.budgetBytes)
    this.evictOnRelease = options.evictOnRelease ?? false
  }

  /**
   * Decode `source` under `id`, once. Concurrent and repeated calls share the
   * same promise; a failed load is forgotten so a later call can retry. A
   * sample dropped by the policy decodes again on the next `load`.
   */
  load(id: string, source: SampleSource): Promise<LoadedSample> {
    const ready = this.loaded.get(id)
    if (ready) {
      this.touch(id)
      return Promise.resolve(ready)
    }
    const inFlight = this.pending.get(id)
    if (inFlight) return inFlight

    const promise = this.decode(id, source)
      .then((sample) => {
        // A `forget`/`clear` while decoding drops the result on the floor.
        if (this.pending.get(id) === promise) {
          this.pending.delete(id)
          this.admit(sample)
        }
        return sample
      })
      .catch((error: unknown) => {
        if (this.pending.get(id) === promise) this.pending.delete(id)
        throw error
      })
    this.pending.set(id, promise)
    return promise
  }

  /** The decoded sample, or undefined until `load` resolves. Counts as a use for LRU order. */
  get(id: string): LoadedSample | undefined {
    const sample = this.loaded.get(id)
    if (sample) this.touch(id)
    return sample
  }

  /** The decoded sample without marking it used. */
  peek(id: string): LoadedSample | undefined {
    return this.loaded.get(id)
  }

  has(id: string): boolean {
    return this.loaded.has(id)
  }

  /** The in-flight load for `id`, if any. */
  loading(id: string): Promise<LoadedSample> | undefined {
    return this.pending.get(id)
  }

  /** Mark `id` as most recently used. */
  touch(id: string): void {
    const sample = this.loaded.get(id)
    if (!sample) return
    this.loaded.delete(id)
    this.loaded.set(id, sample)
  }

  /**
   * Drop a decoded sample (a pending load still completes but is not kept).
   * Explicit, so it also clears the id's pin and holds; not counted as an
   * eviction.
   */
  forget(id: string): void {
    this.remove(id)
    this.pending.delete(id)
    this.pins.delete(id)
    this.holdCounts.delete(id)
  }

  clear(): void {
    this.loaded.clear()
    this.pending.clear()
    this.pins.clear()
    this.holdCounts.clear()
    this.heldBytes = 0
  }

  get size(): number {
    return this.loaded.size
  }

  /** Ids currently held, least recently used first. */
  ids(): string[] {
    return [...this.loaded.keys()]
  }

  // --- Eviction policy -------------------------------------------------------

  /** Decoded bytes currently held. */
  get bytes(): number {
    return this.heldBytes
  }

  /** The byte budget; lowering it evicts at once. `Infinity` disables size eviction. */
  get budgetBytes(): number {
    return this.budget
  }

  set budgetBytes(value: number) {
    this.budget = normaliseBudget(value)
    this.enforceBudget()
  }

  /**
   * Keep `id` out of eviction until `unpin` (an app-level hold: the session's
   * ambience bed, a stinger that must never re-decode). Pinning an id that is
   * not loaded yet applies once it is.
   */
  pin(id: string): void {
    this.pins.add(id)
  }

  unpin(id: string): void {
    if (!this.pins.delete(id)) return
    this.enforceBudget()
  }

  isPinned(id: string): boolean {
    return this.pins.has(id)
  }

  /**
   * Take a hold on `id` for as long as a clip is about to use it or using it;
   * returns the matching release (idempotent). Holds are counted, so two
   * voices on one sample release independently. The id need not be loaded
   * yet: the hold applies once it is.
   */
  retain(id: string): () => void {
    this.holdCounts.set(id, (this.holdCounts.get(id) ?? 0) + 1)
    let released = false
    return () => {
      if (released) return
      released = true
      this.release(id)
    }
  }

  /** Outstanding holds on `id`. */
  holds(id: string): number {
    return this.holdCounts.get(id) ?? 0
  }

  /** True when the policy may drop `id` right now. */
  isEvictable(id: string): boolean {
    return this.loaded.has(id) && !this.pins.has(id) && this.holds(id) === 0
  }

  /**
   * Run the budget policy now: drop least recently used evictable samples
   * until the total fits. Returns the ids dropped. Automatic after every load
   * and release; call it directly after a burst of `unpin`s or when the app
   * knows a quiet moment.
   */
  evict(): string[] {
    return this.enforceBudget()
  }

  /** Called with every sample the policy drops (not `forget`/`clear`). */
  onEvict(listener: SampleEvictionListener): () => void {
    this.evictionListeners.add(listener)
    return () => this.evictionListeners.delete(listener)
  }

  get metrics(): SampleStoreMetrics {
    let pinned = 0
    let held = 0
    for (const id of this.loaded.keys()) {
      if (this.pins.has(id)) pinned += 1
      if (this.holds(id) > 0) held += 1
    }
    return {
      bytes: this.heldBytes,
      budgetBytes: this.budget,
      count: this.loaded.size,
      pinned,
      held,
      evictions: this.evictionCount,
      evictedBytes: this.evictedByteCount,
      loads: this.loadCount,
      overBudget: this.heldBytes > this.budget,
    }
  }

  // --- Internals --------------------------------------------------------------

  private admit(sample: LoadedSample): void {
    // A load racing a forget of the same id: the later admission wins.
    this.remove(sample.id)
    this.loaded.set(sample.id, sample)
    this.heldBytes += sample.bytes
    this.loadCount += 1
    // The caller is about to use what it just loaded: it survives its own admission.
    this.enforceBudget(sample.id)
  }

  private release(id: string): void {
    const count = this.holdCounts.get(id) ?? 0
    if (count <= 1) this.holdCounts.delete(id)
    else this.holdCounts.set(id, count - 1)
    if (count > 1) return

    const sample = this.loaded.get(id)
    if (sample && this.evictOnRelease && !this.pins.has(id)) {
      this.dropByPolicy(sample, 'release')
      return
    }
    this.enforceBudget()
  }

  private enforceBudget(protectedId?: string): string[] {
    const dropped: string[] = []
    if (this.heldBytes <= this.budget) return dropped
    for (const [id, sample] of this.loaded) {
      if (this.heldBytes <= this.budget) break
      if (id === protectedId || this.pins.has(id) || this.holds(id) > 0) continue
      this.dropByPolicy(sample, 'budget')
      dropped.push(id)
    }
    return dropped
  }

  private dropByPolicy(sample: LoadedSample, reason: SampleEvictionReason): void {
    this.remove(sample.id)
    this.evictionCount += 1
    this.evictedByteCount += sample.bytes
    for (const listener of this.evictionListeners) listener({ sample, reason })
  }

  private remove(id: string): void {
    const sample = this.loaded.get(id)
    if (!sample) return
    this.loaded.delete(id)
    this.heldBytes -= sample.bytes
  }

  private async decode(id: string, source: SampleSource): Promise<LoadedSample> {
    const buffer =
      typeof source === 'string'
        ? await this.ctx.decodeAudioData(await this.fetchBytes(source))
        : source instanceof ArrayBuffer
          ? await this.ctx.decodeAudioData(source)
          : source
    return {
      kind: 'buffer',
      id,
      buffer,
      durationSec: buffer.duration,
      bytes: bytesOfBuffer(buffer),
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

function normaliseBudget(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return Infinity
  return Math.max(0, value)
}

function peaksOf(buffer: AudioBuffer, buckets: number): WaveformPeaks {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
    buffer.getChannelData(index),
  )
  return computePeaks(channels, buffer.length, buckets)
}
