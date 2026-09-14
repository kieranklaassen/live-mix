// Live capture of the master or any track/bus (R23). Two modes:
//
// - `worklet` (default): a capture worklet copies the signal into chunks and
//   posts them; `stop()` yields planar float audio (sample-exact, encode with
//   `encodeWav`, or load straight into the SampleStore as a clip).
// - `media-recorder`: a `MediaStreamAudioDestinationNode` feeds the browser's
//   `MediaRecorder`; `stop()` yields a compressed `Blob` (webm/opus, ogg or
//   mp4 depending on the browser). Lossy, no sample alignment, but free.
//
// Recording is a tap: the recorder connects *from* the source and never sits
// in the audible path.

import { type Bus } from '../buses/Bus'
import { ensureProcessor } from '../worklet-loader'
import {
  DEFAULT_RECORDER_CHUNK_FRAMES,
  RECORDER_PROCESSOR_NAME,
  type RecorderHostMessage,
  type RecorderMessage,
  type RecorderProcessorOptions,
} from './recorder-protocol'
import { type PlanarAudio } from './encode'

export type RecorderNodeFactory = (
  context: BaseAudioContext,
  name: string,
  options: AudioWorkletNodeOptions,
) => AudioWorkletNode

/** A source with an output node: a bus (its output), a track strip, or a raw node. */
export type RecordSource = Bus | { output: AudioNode } | AudioNode

export interface WorkletRecorderOptions {
  mode?: 'worklet'
  /** Channels to capture (default 2). */
  channelCount?: number
  chunkFrames?: number
  processorUrl?: URL | string
  createNode?: RecorderNodeFactory
}

export interface MediaRecorderLike {
  start(timesliceMs?: number): void
  stop(): void
  readonly state: 'inactive' | 'recording' | 'paused'
  readonly mimeType: string
  ondataavailable: ((event: { data: Blob }) => void) | null
  onstop: (() => void) | null
  onerror: ((event: unknown) => void) | null
}

export interface MediaRecorderOptions {
  mode: 'media-recorder'
  /** Preferred container/codec, e.g. `'audio/webm;codecs=opus'`; the browser picks when unsupported. */
  mimeType?: string
  audioBitsPerSecond?: number
  /** Injectable constructor (tests, non-DOM hosts). Default: `globalThis.MediaRecorder`. */
  createMediaRecorder?: (
    stream: MediaStream,
    options: { mimeType?: string; audioBitsPerSecond?: number },
  ) => MediaRecorderLike
}

export type RecorderOptions = WorkletRecorderOptions | MediaRecorderOptions

export interface WorkletRecording {
  kind: 'planar'
  audio: PlanarAudio
  durationSec: number
}

export interface MediaRecording {
  kind: 'blob'
  blob: Blob
  mimeType: string
}

export type Recording = WorkletRecording | MediaRecording

/** Default location of the bundled capture processor, relative to the built core entry. */
export function defaultRecorderProcessorUrl(): string {
  return new URL('./worklets/recorder.js', import.meta.url).href
}

const defaultCreateNode: RecorderNodeFactory = (context, name, options) =>
  new AudioWorkletNode(context, name, options)

function sourceNode(source: RecordSource): AudioNode {
  if (typeof (source as Bus).addInsert === 'function') return (source as Bus).output
  if ('output' in source && typeof (source as { output: unknown }).output === 'object') {
    return (source as { output: AudioNode }).output
  }
  return source as AudioNode
}

export abstract class Recorder {
  readonly source: AudioNode
  protected recordingState: 'idle' | 'recording' | 'stopped' = 'idle'
  protected disposed = false

  protected constructor(source: RecordSource) {
    this.source = sourceNode(source)
  }

  get state(): 'idle' | 'recording' | 'stopped' {
    return this.recordingState
  }

  /** The node the source feeds (the tap). */
  abstract get input(): AudioNode

  /** Begin capturing (at `at` on the audio clock for worklet mode; now otherwise). */
  abstract start(at?: number): void

  /** Stop and resolve with what was captured. */
  abstract stop(): Promise<Recording>

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    try {
      this.source.disconnect(this.input)
    } catch {
      // Already disconnected; ignore.
    }
  }
}

export class WorkletRecorder extends Recorder {
  readonly node: AudioWorkletNode
  readonly channelCount: number
  private readonly ctx: BaseAudioContext
  private readonly chunks: { startFrame: number; channels: Float32Array[] }[] = []
  private resolveStop: ((recording: WorkletRecording) => void) | null = null
  private stopPromise: Promise<WorkletRecording> | null = null

  private constructor(
    ctx: BaseAudioContext,
    source: RecordSource,
    node: AudioWorkletNode,
    channelCount: number,
  ) {
    super(source)
    this.ctx = ctx
    this.node = node
    this.channelCount = channelCount
    this.node.port.onmessage = (event: MessageEvent<RecorderHostMessage>) => {
      this.handleMessage(event.data)
    }
    this.source.connect(this.node)
  }

  static async create(
    ctx: BaseAudioContext,
    source: RecordSource,
    options: WorkletRecorderOptions = {},
  ): Promise<WorkletRecorder> {
    const url =
      options.processorUrl === undefined
        ? defaultRecorderProcessorUrl()
        : typeof options.processorUrl === 'string'
          ? options.processorUrl
          : options.processorUrl.href
    await ensureProcessor(ctx, url)
    const channelCount = options.channelCount ?? 2
    const processorOptions: RecorderProcessorOptions = {
      channelCount,
      chunkFrames: options.chunkFrames ?? DEFAULT_RECORDER_CHUNK_FRAMES,
    }
    const node = (options.createNode ?? defaultCreateNode)(ctx, RECORDER_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      processorOptions,
    })
    return new WorkletRecorder(ctx, source, node, channelCount)
  }

  get input(): AudioNode {
    return this.node
  }

  start(at?: number): void {
    if (this.disposed || this.recordingState === 'recording') return
    this.chunks.length = 0
    this.recordingState = 'recording'
    this.post({ type: 'start', ...(at !== undefined ? { at } : {}) })
  }

  stop(): Promise<WorkletRecording> {
    if (this.stopPromise) return this.stopPromise
    if (this.recordingState !== 'recording') {
      return Promise.resolve(this.assemble(0))
    }
    this.stopPromise = new Promise((resolve) => {
      this.resolveStop = resolve
      this.post({ type: 'stop' })
    })
    return this.stopPromise
  }

  /** Assembled audio so far (partial while recording). */
  captured(): PlanarAudio {
    return this.assemble(0).audio
  }

  override dispose(): void {
    if (this.disposed) return
    super.dispose()
    try {
      this.node.disconnect()
      this.node.port.close()
    } catch {
      // ignore
    }
    // The worklet can no longer reply, so settle any pending stop() here.
    if (this.recordingState === 'recording') this.settleStop(this.assemble(0))
  }

  private handleMessage(message: RecorderHostMessage): void {
    switch (message.type) {
      case 'chunk':
        this.chunks.push({ startFrame: message.startFrame, channels: message.channels })
        break
      case 'stopped':
        this.settleStop(this.assemble(message.totalFrames))
        break
      default: {
        const unhandled: never = message
        throw new Error(`live-mix: unhandled recorder host message ${JSON.stringify(unhandled)}`)
      }
    }
  }

  private settleStop(recording: WorkletRecording): void {
    this.recordingState = 'stopped'
    const resolve = this.resolveStop
    this.resolveStop = null
    this.stopPromise = null
    resolve?.(recording)
  }

  private assemble(totalFrames: number): WorkletRecording {
    const frames = Math.max(
      totalFrames,
      ...this.chunks.map((chunk) => chunk.startFrame + chunk.channels[0].length),
      0,
    )
    const channels = Array.from({ length: this.channelCount }, () => new Float32Array(frames))
    for (const chunk of this.chunks) {
      for (let c = 0; c < this.channelCount; c += 1) {
        const source = chunk.channels[Math.min(c, chunk.channels.length - 1)]
        channels[c].set(source, chunk.startFrame)
      }
    }
    const sampleRate = this.ctx.sampleRate
    return { kind: 'planar', audio: { channels, sampleRate }, durationSec: frames / sampleRate }
  }

  private post(message: RecorderMessage): void {
    this.node.port.postMessage(message)
  }
}

export class MediaStreamRecorder extends Recorder {
  readonly destination: MediaStreamAudioDestinationNode
  private readonly recorder: MediaRecorderLike
  private readonly parts: Blob[] = []
  private resolveStop: ((recording: MediaRecording) => void) | null = null
  private stopPromise: Promise<MediaRecording> | null = null

  constructor(ctx: BaseAudioContext, source: RecordSource, options: MediaRecorderOptions) {
    super(source)
    this.destination = (ctx as AudioContext).createMediaStreamDestination()
    const create =
      options.createMediaRecorder ??
      ((stream, init) => {
        const Ctor = (
          globalThis as { MediaRecorder?: new (s: MediaStream, o: unknown) => MediaRecorderLike }
        ).MediaRecorder
        if (!Ctor) throw new Error('live-mix: MediaRecorder is not available here')
        return new Ctor(stream, init)
      })
    this.recorder = create(this.destination.stream, {
      ...(options.mimeType ? { mimeType: options.mimeType } : {}),
      ...(options.audioBitsPerSecond ? { audioBitsPerSecond: options.audioBitsPerSecond } : {}),
    })
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.parts.push(event.data)
    }
    this.recorder.onstop = () => {
      const mimeType = nonEmpty(this.recorder.mimeType) ?? options.mimeType ?? 'audio/webm'
      this.settleStop({
        kind: 'blob',
        blob: new Blob(this.parts, { type: mimeType }),
        mimeType,
      })
    }
    this.source.connect(this.destination)
  }

  get input(): AudioNode {
    return this.destination
  }

  get mimeType(): string {
    return this.recorder.mimeType
  }

  start(): void {
    if (this.disposed || this.recordingState === 'recording') return
    this.parts.length = 0
    this.recordingState = 'recording'
    this.recorder.start()
  }

  stop(): Promise<MediaRecording> {
    if (this.stopPromise) return this.stopPromise
    if (this.recordingState !== 'recording') {
      return Promise.resolve({
        kind: 'blob',
        blob: new Blob(this.parts),
        mimeType: this.recorder.mimeType,
      })
    }
    this.stopPromise = new Promise((resolve) => {
      this.resolveStop = resolve
      this.recorder.stop()
    })
    return this.stopPromise
  }

  override dispose(): void {
    if (this.disposed) return
    super.dispose()
    // Stopping the encoder frees it and lets `onstop` settle any pending stop().
    let stopping = false
    try {
      if (this.recorder.state !== 'inactive') {
        this.recorder.stop()
        stopping = true
      }
    } catch {
      // ignore
    }
    try {
      this.destination.disconnect()
    } catch {
      // ignore
    }
    if (!stopping && this.recordingState === 'recording') {
      this.settleStop({
        kind: 'blob',
        blob: new Blob(this.parts),
        mimeType: this.recorder.mimeType,
      })
    }
  }

  private settleStop(recording: MediaRecording): void {
    this.recordingState = 'stopped'
    const resolve = this.resolveStop
    this.resolveStop = null
    this.stopPromise = null
    resolve?.(recording)
  }
}

function nonEmpty(value: string): string | undefined {
  return value.length > 0 ? value : undefined
}

/** Create a recorder tapping `source`, worklet mode unless asked otherwise. */
export function createRecorder(
  ctx: BaseAudioContext,
  source: RecordSource,
  options: RecorderOptions = {},
): Promise<Recorder> {
  if (options.mode === 'media-recorder') {
    try {
      return Promise.resolve(new MediaStreamRecorder(ctx, source, options))
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }
  return WorkletRecorder.create(ctx, source, options)
}
