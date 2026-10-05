// One Link Audio channel a page sends: connect a node to `input` and peers
// of the Link session can listen to it, on the beat.
//
// The sound goes from a tap worklet to a pump worker to the plug-in host
// (link-audio-protocol.ts); this class sets the three up and keeps the pump
// told when context time is heard on the host's clock. The channel is in the
// session while Link Audio is on (`link.set({ audio: true })`) and this
// sender lives; audio only leaves the machine while a peer listens.

import { ensureProcessor } from '../core/worklet-loader'
import type { NativeHostClient } from './HostClient'
import type { NativeLink } from './NativeLink'
import {
  LINK_TAP_PROCESSOR_NAME,
  type LinkAudioPumpEvent,
  type LinkAudioPumpMessage,
  type LinkAudioStats,
  type LinkTapMessage,
  type LinkTapProcessorOptions,
} from './link-audio-protocol'
import { OutputClock } from './link-time'

/** Default location of the bundled tap processor. Call lazily. */
export function defaultLinkTapProcessorUrl(): string {
  return new URL('../worklets/link-tap.js', import.meta.url).href
}

/** Default location of the bundled Link Audio pump worker. Call lazily. */
export function defaultLinkAudioPumpUrl(): string {
  return new URL('../worklets/link-audio.js', import.meta.url).href
}

/** The slice of `Worker` the sender uses. */
export interface LinkAudioWorker {
  onmessage: ((event: { data: LinkAudioPumpEvent }) => void) | null
  postMessage(message: LinkAudioPumpMessage, transfer?: Transferable[]): void
  terminate(): void
}

export type LinkAudioStatus = 'connecting' | 'open' | 'closed'

export interface LinkAudioSenderOptions {
  /** What peers see the channel as, next to this program's name. */
  name: string
  /** 1 or 2. Default 2. */
  channels?: 1 | 2
  /**
   * Milliseconds added to when each block is said to be heard. Positive
   * when the output is heard later than the browser reports (a Bluetooth
   * speaker, say). Default 0.
   */
  offsetMs?: number
  processorUrl?: string
  pumpUrl?: string
  /** How often the pump is told the clock again. Default 100 ms. */
  clockIntervalMs?: number
  /** The page's clock. Default `performance.now()`. */
  now?: () => number
  createNode?: (
    context: BaseAudioContext,
    name: string,
    options: AudioWorkletNodeOptions,
  ) => AudioWorkletNode
  createWorker?: (url: string) => LinkAudioWorker
  createChannel?: () => { port1: MessagePort; port2: MessagePort }
}

const href = (url: string): string =>
  typeof location === 'undefined' ? url : new URL(url, location.href).href

export class LinkAudioSender {
  /** Connect what the channel carries here. Nothing comes out of it. */
  readonly input: AudioWorkletNode
  readonly name: string
  /** When what the context renders is heard, on the page's clock. */
  readonly outputClock: OutputClock
  /** Called as the connection to the host opens and closes. */
  onStatus: ((status: LinkAudioStatus, reason?: string) => void) | null = null
  /** Called about once a second with what was sent and dropped. */
  onStats: ((stats: LinkAudioStats) => void) | null = null
  private currentStatus: LinkAudioStatus = 'connecting'
  private readonly context: BaseAudioContext
  private readonly link: NativeLink
  private readonly worker: LinkAudioWorker
  private readonly now: () => number
  private offsetMs: number
  private timer: ReturnType<typeof setInterval> | null = null

  private constructor(
    context: BaseAudioContext,
    link: NativeLink,
    node: AudioWorkletNode,
    worker: LinkAudioWorker,
    options: LinkAudioSenderOptions,
  ) {
    this.context = context
    this.link = link
    this.input = node
    this.worker = worker
    this.name = options.name
    this.now = options.now ?? (() => performance.now())
    this.offsetMs = options.offsetMs ?? 0
    this.outputClock = new OutputClock(context, { now: this.now })
  }

  static async create(
    context: BaseAudioContext,
    client: NativeHostClient,
    link: NativeLink,
    options: LinkAudioSenderOptions,
  ): Promise<LinkAudioSender> {
    if (!link.available)
      throw new Error('live-mix: this plug-in host was built without Ableton Link')
    await ensureProcessor(context, href(options.processorUrl ?? defaultLinkTapProcessorUrl()))

    const channels = options.channels ?? 2
    const processorOptions: LinkTapProcessorOptions = { channels }
    const node = (
      options.createNode ??
      ((ctx, name, nodeOptions) => new AudioWorkletNode(ctx, name, nodeOptions))
    )(context, LINK_TAP_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: channels,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      processorOptions,
    })
    const worker = (
      options.createWorker ?? ((url) => new Worker(url) as unknown as LinkAudioWorker)
    )(href(options.pumpUrl ?? defaultLinkAudioPumpUrl()))

    const sender = new LinkAudioSender(context, link, node, worker, options)
    worker.onmessage = ({ data }) => sender.receive(data)

    // The tap talks to the pump directly; the main thread only introduces them.
    const { port1, port2 } = (options.createChannel ?? (() => new MessageChannel()))()
    const toTap: LinkTapMessage = { type: 'port', port: port1 }
    node.port.postMessage(toTap, [port1])
    worker.postMessage(
      {
        type: 'start',
        url: client.linkAudioUrl(options.name),
        sampleRate: context.sampleRate,
        port: port2,
      },
      [port2],
    )

    sender.tellClock()
    const every = options.clockIntervalMs ?? 100
    if (every > 0) sender.timer = setInterval(() => sender.tellClock(), every)
    return sender
  }

  get status(): LinkAudioStatus {
    return this.currentStatus
  }

  /** Shifts when blocks are said to be heard; see `LinkAudioSenderOptions.offsetMs`. */
  setOffsetMs(offsetMs: number): void {
    this.offsetMs = Number.isFinite(offsetMs) ? offsetMs : 0
    this.tellClock()
  }

  /** Ends the channel: peers see it go. */
  dispose(): void {
    if (this.timer !== null) clearInterval(this.timer)
    this.timer = null
    try {
      this.input.disconnect()
    } catch {
      // Never connected.
    }
    const stop: LinkTapMessage = { type: 'dispose' }
    this.input.port.postMessage(stop)
    // What the pump had posted before it hears this must not open the channel again.
    this.worker.onmessage = null
    this.worker.postMessage({ type: 'stop' })
    this.setStatus('closed', 'closed')
  }

  /** Tells the pump when the context's present is heard on the host's clock. */
  private tellClock(): void {
    if (this.currentStatus === 'closed') return
    this.outputClock.sample()
    const contextTime = this.context.currentTime
    const hostMicros = this.link.hostMicrosAt(
      this.outputClock.localMsAt(contextTime) + this.offsetMs,
    )
    this.worker.postMessage({ type: 'clock', contextTime, hostMicros })
  }

  private receive(event: LinkAudioPumpEvent): void {
    switch (event.type) {
      case 'open':
        this.setStatus('open')
        break
      case 'close':
        if (this.timer !== null) clearInterval(this.timer)
        this.timer = null
        this.setStatus('closed', event.reason)
        break
      case 'stats':
        this.onStats?.(event.stats)
        break
    }
  }

  private setStatus(status: LinkAudioStatus, reason?: string): void {
    if (this.currentStatus === status) return
    this.currentStatus = status
    this.onStatus?.(status, reason)
  }
}
