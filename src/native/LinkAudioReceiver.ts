// One Link Audio channel a page listens to: connect `output` on and what a
// peer of the Link session sends on that channel comes out of it, on the beat.
//
// The sound comes from the plug-in host to an intake worker to a playout
// worklet (link-receive-protocol.ts); this class sets the three up and keeps
// the intake told when context time is heard on the host's clock. The peer
// sends the channel for as long as this receiver lives.

import { ensureProcessor } from '../core/worklet-loader'
import type { NativeHostClient } from './HostClient'
import type { NativeLink } from './NativeLink'
import {
  LINK_SOURCE_PROCESSOR_NAME,
  type LinkIntakeEvent,
  type LinkIntakeMessage,
  type LinkReceiveStats,
  type LinkSourceEvent,
  type LinkSourceMessage,
  type LinkSourceProcessorOptions,
} from './link-receive-protocol'
import { OutputClock } from './link-time'

/** Default location of the bundled playout processor. Call lazily. */
export function defaultLinkSourceProcessorUrl(): string {
  return new URL('../worklets/link-source.js', import.meta.url).href
}

/** Default location of the bundled Link Audio intake worker. Call lazily. */
export function defaultLinkAudioIntakeUrl(): string {
  return new URL('../worklets/link-receive.js', import.meta.url).href
}

/** The slice of `Worker` the receiver uses. */
export interface LinkIntakeWorker {
  onmessage: ((event: { data: LinkIntakeEvent }) => void) | null
  postMessage(message: LinkIntakeMessage, transfer?: Transferable[]): void
  terminate(): void
}

export type LinkAudioReceiverStatus = 'connecting' | 'open' | 'closed'

export interface LinkAudioReceiverOptions {
  /** The channel to listen to: the `id` of an entry of `link.state.channels`. */
  channel: string
  /**
   * Milliseconds the channel plays behind the sender, held as given. Left
   * out, the receiver settles on what the path needs (see `delaySec`).
   */
  delayMs?: number
  /**
   * Milliseconds added to when context time is said to be heard. Positive
   * when the output is heard later than the browser reports (a Bluetooth
   * speaker, say). Default 0.
   */
  offsetMs?: number
  processorUrl?: string
  intakeUrl?: string
  /** How often the intake is told the clock again. Default 100 ms. */
  clockIntervalMs?: number
  /** The page's clock. Default `performance.now()`. */
  now?: () => number
  createNode?: (
    context: BaseAudioContext,
    name: string,
    options: AudioWorkletNodeOptions,
  ) => AudioWorkletNode
  createWorker?: (url: string) => LinkIntakeWorker
  createChannel?: () => { port1: MessagePort; port2: MessagePort }
}

const href = (url: string): string =>
  typeof location === 'undefined' ? url : new URL(url, location.href).href

export class LinkAudioReceiver {
  /**
   * The channel's sound, in stereo; a mono channel comes out of both sides.
   * Silent until audio arrives, and whenever the peer sends none.
   */
  readonly output: AudioWorkletNode
  /** The channel's id, as `link.state.channels` lists it. */
  readonly channel: string
  /** When what the context renders is heard, on the page's clock. */
  readonly outputClock: OutputClock
  /** Called as the connection to the host opens and closes. */
  onStatus: ((status: LinkAudioReceiverStatus, reason?: string) => void) | null = null
  /** Called when `delaySec` is first known and whenever it grows. */
  onDelay: ((delaySec: number) => void) | null = null
  /** Called about once a second with what arrived, was lost and was missed. */
  onStats: ((stats: LinkReceiveStats) => void) | null = null
  private currentStatus: LinkAudioReceiverStatus = 'connecting'
  private currentDelay: number | null
  private readonly context: BaseAudioContext
  private readonly link: NativeLink
  private readonly worker: LinkIntakeWorker
  private readonly now: () => number
  private offsetMs: number
  private timer: ReturnType<typeof setInterval> | null = null

  private constructor(
    context: BaseAudioContext,
    link: NativeLink,
    node: AudioWorkletNode,
    worker: LinkIntakeWorker,
    options: LinkAudioReceiverOptions,
    delaySec: number | null,
  ) {
    this.context = context
    this.link = link
    this.output = node
    this.worker = worker
    this.channel = options.channel
    this.currentDelay = delaySec
    this.now = options.now ?? (() => performance.now())
    // As `setOffsetMs` takes it: what is no number is no offset.
    const { offsetMs = 0 } = options
    this.offsetMs = Number.isFinite(offsetMs) ? offsetMs : 0
    this.outputClock = new OutputClock(context, { now: this.now })
  }

  static async create(
    context: BaseAudioContext,
    client: NativeHostClient,
    link: NativeLink,
    options: LinkAudioReceiverOptions,
  ): Promise<LinkAudioReceiver> {
    if (!link.available)
      throw new Error('live-mix: this plug-in host was built without Ableton Link')
    if (!client.info.linkAudioReceive)
      throw new Error('live-mix: this plug-in host is too old to receive Link Audio; rebuild it')
    await ensureProcessor(context, href(options.processorUrl ?? defaultLinkSourceProcessorUrl()))

    const fixed =
      typeof options.delayMs === 'number' &&
      Number.isFinite(options.delayMs) &&
      options.delayMs >= 0
        ? options.delayMs / 1000
        : null
    const processorOptions: LinkSourceProcessorOptions = { delaySec: fixed }
    const node = (
      options.createNode ??
      ((ctx, name, nodeOptions) => new AudioWorkletNode(ctx, name, nodeOptions))
    )(context, LINK_SOURCE_PROCESSOR_NAME, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions,
    })
    const worker = (
      options.createWorker ?? ((url) => new Worker(url) as unknown as LinkIntakeWorker)
    )(href(options.intakeUrl ?? defaultLinkAudioIntakeUrl()))

    const receiver = new LinkAudioReceiver(context, link, node, worker, options, fixed)
    worker.onmessage = ({ data }) => receiver.fromIntake(data)
    node.port.onmessage = ({ data }: { data: LinkSourceEvent }) => receiver.fromPlayout(data)

    // The intake talks to the playout directly; the main thread only introduces them.
    const { port1, port2 } = (options.createChannel ?? (() => new MessageChannel()))()
    const toPlayout: LinkSourceMessage = { type: 'port', port: port1 }
    node.port.postMessage(toPlayout, [port1])
    // The clock first: a block that arrives before it cannot be placed.
    receiver.tellClock()
    worker.postMessage(
      { type: 'start', url: client.linkAudioInUrl(options.channel), port: port2 },
      [port2],
    )

    const every = options.clockIntervalMs ?? 100
    if (every > 0) receiver.timer = setInterval(() => receiver.tellClock(), every)
    return receiver
  }

  get status(): LinkAudioReceiverStatus {
    return this.currentStatus
  }

  /**
   * How far behind the sender the channel plays, in seconds; null until the
   * first quarter second of it has been heard. A sound heard at the sender at
   * one moment leaves `output` at the context time that is heard here this
   * long after that moment, so a recording of `output` belongs this much
   * earlier (and earlier again by whatever lies between the transport and the
   * output). Chosen by the receiver, it only ever grows.
   */
  get delaySec(): number | null {
    return this.currentDelay
  }

  /** Shifts when context time is said to be heard; see `LinkAudioReceiverOptions.offsetMs`. */
  setOffsetMs(offsetMs: number): void {
    this.offsetMs = Number.isFinite(offsetMs) ? offsetMs : 0
    this.tellClock()
  }

  /** Stops listening: the peer stops sending when nobody else does. */
  dispose(): void {
    if (this.timer !== null) clearInterval(this.timer)
    this.timer = null
    try {
      this.output.disconnect()
    } catch {
      // Never connected.
    }
    const stop: LinkSourceMessage = { type: 'dispose' }
    this.output.port.postMessage(stop)
    this.output.port.onmessage = null
    // Nor what the intake had posted before it hears this: it would open the channel again.
    this.worker.onmessage = null
    this.worker.postMessage({ type: 'stop' })
    this.setStatus('closed', 'closed')
  }

  /** Tells the intake when the context's present is heard on the host's clock. */
  private tellClock(): void {
    if (this.currentStatus === 'closed') return
    this.outputClock.sample()
    const contextTime = this.context.currentTime
    const hostMicros = this.link.hostMicrosAt(
      this.outputClock.localMsAt(contextTime) + this.offsetMs,
    )
    this.worker.postMessage({ type: 'clock', contextTime, hostMicros })
  }

  private fromIntake(event: LinkIntakeEvent): void {
    switch (event.type) {
      case 'open':
        this.setStatus('open')
        break
      case 'close':
        if (this.timer !== null) clearInterval(this.timer)
        this.timer = null
        this.setStatus('closed', event.reason)
        break
    }
  }

  private fromPlayout(event: LinkSourceEvent): void {
    switch (event.type) {
      case 'delay':
        this.currentDelay = event.delaySec
        this.onDelay?.(event.delaySec)
        break
      case 'stats':
        this.onStats?.(event.stats)
        break
    }
  }

  private setStatus(status: LinkAudioReceiverStatus, reason?: string): void {
    if (this.currentStatus === status) return
    this.currentStatus = status
    this.onStatus?.(status, reason)
  }
}
