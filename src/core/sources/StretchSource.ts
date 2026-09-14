// Tempo-synced time-stretch and pitch-shift (R20). A `StretchSource` wraps a
// Signalsmith Stretch worklet node (`signalsmith-stretch`, MIT) loaded with a
// decoded buffer: playback rate follows the tempo map and the clip's warp
// markers, pitch follows `semitones` (key matching), and the node reports its
// own latency so delay compensation can line it up with buffer voices.
//
// `signalsmith-stretch` is an optional peer: the library imports nothing from
// it. The host passes the package's `SignalsmithStretch` factory (or anything
// with the same shape — see `StretchNode`), so consumers that never warp
// never load the ~200 KB WASM.

import { type TempoMap } from '../time/TempoMap'

/** One scheduled change on the stretch node (signalsmith-stretch `schedule`). */
export interface StretchScheduleChange {
  /** Audio-context time the change lands (the node compensates its latency). */
  output?: number
  /** Process audio (true) or idle (false). */
  active?: boolean
  /** Position in the input buffer, seconds. */
  input?: number
  /** Playback rate: 0.5 = half speed. */
  rate?: number
  /** Pitch shift in semitones. */
  semitones?: number
  tonalityHz?: number
  formantSemitones?: number
  formantCompensation?: boolean
  formantBaseHz?: number
  /** Auto-loop section of the input buffer; equal values disable it. */
  loopStart?: number
  loopEnd?: number
}

/** The subset of the signalsmith-stretch node the library drives. */
export interface StretchNode extends AudioNode {
  schedule(change: StretchScheduleChange): void
  start(when?: number, offset?: number, duration?: number): void
  stop(when?: number): void
  /** Appends per-channel sample arrays; resolves to the new buffer end, seconds. */
  addBuffers(buffers: readonly Float32Array[]): Promise<number>
  dropBuffers(toSeconds?: number): Promise<unknown>
  /** Latency in seconds; how far ahead to schedule for a fully compensated change. */
  latency(): number
  readonly inputTime: number
  configure?(options: {
    blockMs?: number | null
    intervalMs?: number
    splitComputation?: boolean
    preset?: 'default' | 'cheaper'
  }): void
}

/** `SignalsmithStretch(audioContext, channelOptions?)` from the package, or a stand-in. */
export type StretchNodeFactory = (
  context: BaseAudioContext,
  channelOptions?: Partial<AudioWorkletNodeOptions>,
) => Promise<StretchNode>

/**
 * A warp marker pins a source position to a beat of the clip (beat 0 = the
 * clip's start). Two or more markers define piecewise playback rates; a
 * clip with none plays at `rate`.
 */
export interface WarpMarker {
  /** Seconds into the source. */
  sourceSec: number
  /** Beats from the clip start on the timeline. */
  beat: number
}

export interface WarpSegment {
  /** Clip-relative timeline second the segment starts at. */
  atSec: number
  /** Source second the segment reads from at `atSec`. */
  sourceSec: number
  /** Playback rate over the segment (source seconds per timeline second). */
  rate: number
}

export interface WarpOptions {
  /** Timeline second the clip starts at (where beat 0 falls). Default 0. */
  clipStartSec?: number
  /** Playback rate after the last marker. Default: the previous segment's. */
  tailRate?: number
}

/**
 * Turn warp markers into rate segments on the clip's own timeline. Markers are
 * sorted by beat; each pair gives `rate = Δsource / Δtimeline`, where
 * Δtimeline comes from the tempo map at the clip's position.
 */
export function warpSegments(
  markers: readonly WarpMarker[],
  tempo: TempoMap,
  options: WarpOptions = {},
): WarpSegment[] {
  const sorted = [...markers].sort((a, b) => a.beat - b.beat)
  if (sorted.length === 0) return []
  const clipStartSec = options.clipStartSec ?? 0
  const startBeat = tempo.secondsToBeats(clipStartSec)
  const timelineSecAt = (beat: number) => tempo.beatsToSeconds(startBeat + beat) - clipStartSec

  const segments: WarpSegment[] = []
  for (let i = 0; i < sorted.length; i += 1) {
    const marker = sorted[i]
    const next = sorted[i + 1]
    const atSec = timelineSecAt(marker.beat)
    let rate: number
    if (next) {
      const timelineDelta = timelineSecAt(next.beat) - atSec
      const sourceDelta = next.sourceSec - marker.sourceSec
      if (!(timelineDelta > 0)) throw new Error('live-mix: warp markers must have increasing beats')
      if (!(sourceDelta > 0))
        throw new Error('live-mix: warp markers must have increasing sourceSec')
      rate = sourceDelta / timelineDelta
    } else {
      rate = options.tailRate ?? segments[segments.length - 1]?.rate ?? 1
    }
    segments.push({ atSec, sourceSec: marker.sourceSec, rate })
  }
  return segments
}

/** Playback rate at a clip-relative timeline second, from its warp segments. */
export function warpRateAt(segments: readonly WarpSegment[], clipSec: number): number {
  let rate = segments[0]?.rate ?? 1
  for (const segment of segments) {
    if (segment.atSec <= clipSec) rate = segment.rate
    else break
  }
  return rate
}

/** Source position read at a clip-relative timeline second. */
export function warpSourceSecAt(segments: readonly WarpSegment[], clipSec: number): number {
  if (segments.length === 0) return clipSec
  let current = segments[0]
  for (const segment of segments) {
    if (segment.atSec <= clipSec) current = segment
    else break
  }
  return current.sourceSec + (clipSec - current.atSec) * current.rate
}

/** Semitone shift as a playback-rate factor (2^(n/12)). */
export function semitonesToRate(semitones: number): number {
  return 2 ** (semitones / 12)
}

export interface StretchSourceOptions {
  /** Key clips refer to (`clip.sourceId`). */
  id: string
  /** Decoded audio to stretch. */
  buffer: AudioBuffer
  /** `SignalsmithStretch` from `signalsmith-stretch`, or a compatible factory. */
  createStretch: StretchNodeFactory
  /** Worklet node channel options (defaults: one stereo output). */
  channelOptions?: Partial<AudioWorkletNodeOptions>
  /** Quality preset or block settings applied after creation. */
  configure?: Parameters<NonNullable<StretchNode['configure']>>[0]
}

export interface StretchPlayOptions {
  /** Audio-context time playback becomes audible. */
  when: number
  /** Seconds into the source. Default 0. */
  offsetSec?: number
  /** Stop after this many timeline seconds; omit to play out. */
  durationSec?: number
  /** Constant playback rate. Default 1. Ignored when `warp` is given. */
  rate?: number
  /** Pitch shift in semitones (key matching). Default 0. */
  semitones?: number
  /** Loop this source section. */
  loop?: { startSec: number; endSec: number }
  /** Piecewise rates from warp markers (clip-relative seconds). */
  warp?: readonly WarpSegment[]
  formantCompensation?: boolean
}

export class StretchSource {
  readonly kind = 'stretch' as const
  readonly id: string
  readonly node: StretchNode
  readonly durationSec: number
  private readonly ctx: BaseAudioContext
  private connected = false
  private disposed = false

  private constructor(ctx: BaseAudioContext, id: string, node: StretchNode, durationSec: number) {
    this.ctx = ctx
    this.id = id
    this.node = node
    this.durationSec = durationSec
  }

  /** Create the node, apply configuration and load the buffer's channels. */
  static async create(
    ctx: BaseAudioContext,
    options: StretchSourceOptions,
  ): Promise<StretchSource> {
    const node = await options.createStretch(ctx, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [Math.max(1, Math.min(2, options.buffer.numberOfChannels))],
      ...options.channelOptions,
    })
    if (options.configure && node.configure) node.configure(options.configure)
    const channels = Array.from({ length: options.buffer.numberOfChannels }, (_, index) =>
      options.buffer.getChannelData(index),
    )
    await node.addBuffers(channels)
    return new StretchSource(ctx, options.id, node, options.buffer.duration)
  }

  /** Processing latency in seconds (for plugin delay compensation). */
  get latencySec(): number {
    return this.node.latency()
  }

  /** Where the node is reading in the source right now, seconds. */
  get inputTimeSec(): number {
    return this.node.inputTime
  }

  connect(destination: AudioNode): void {
    this.node.connect(destination)
    this.connected = true
  }

  /**
   * Schedule playback: one change at `when` (position, rate or the first
   * warp segment, pitch, loop), one per further warp segment, and an
   * `active: false` at the end when a duration is given. Returns the changes
   * for inspection. Idempotent per call: the node drops later changes.
   */
  play(options: StretchPlayOptions): StretchScheduleChange[] {
    if (this.disposed) return []
    const offsetSec = options.offsetSec ?? 0
    const semitones = options.semitones ?? 0
    const changes: StretchScheduleChange[] = []
    const base: StretchScheduleChange = {
      output: options.when,
      active: true,
      semitones,
      ...(options.formantCompensation !== undefined
        ? { formantCompensation: options.formantCompensation }
        : {}),
      ...(options.loop ? { loopStart: options.loop.startSec, loopEnd: options.loop.endSec } : {}),
    }
    if (options.warp && options.warp.length > 0) {
      const [first, ...rest] = options.warp
      changes.push({ ...base, input: first.sourceSec, rate: first.rate })
      for (const segment of rest) {
        changes.push({
          output: options.when + segment.atSec - first.atSec,
          input: segment.sourceSec,
          rate: segment.rate,
        })
      }
    } else {
      changes.push({ ...base, input: offsetSec, rate: options.rate ?? 1 })
    }
    if (options.durationSec !== undefined) {
      changes.push({ output: options.when + options.durationSec, active: false })
    }
    for (const change of changes) this.node.schedule(change)
    return changes
  }

  /** Change pitch from `at` (default now) without touching position or rate. */
  setSemitones(semitones: number, at = this.ctx.currentTime): void {
    if (this.disposed) return
    this.node.schedule({ output: at, semitones })
  }

  /** Change the playback rate from `at` (default now). */
  setRate(rate: number, at = this.ctx.currentTime): void {
    if (this.disposed) return
    this.node.schedule({ output: at, rate })
  }

  stop(at = this.ctx.currentTime): void {
    if (this.disposed) return
    this.node.schedule({ output: at, active: false })
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    try {
      this.node.schedule({ active: false })
      if (this.connected) this.node.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
    void this.node.dropBuffers().catch(() => {})
  }
}
