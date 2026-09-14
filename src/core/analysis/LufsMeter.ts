// Main-thread host for the loudness meter worklet: an AudioWorkletNode running
// dsp/worklets/meter.processor.ts as a sink. Connect any node (or `bus.addTap`)
// into `input`; the latest BS.1770-4 reading arrives over the MessagePort at
// the configured rate and is exposed synchronously through `reading` and the
// convenience getters, with `subscribe` for push-style UIs.
//
// The processor script is added once per context per URL. Hosts that resolve
// assets themselves pass `processorUrl`; tests pass `createNode`.

import { ensureProcessor } from '../worklet-loader'
import { gainToDb } from '../devices/native/units'
import { silentReading, type MeterReading } from './loudness'
import {
  DEFAULT_METER_INTERVAL_MS,
  METER_PROCESSOR_NAME,
  clampMeterInterval,
  type MeterHostMessage,
  type MeterMessage,
  type MeterProcessorOptions,
} from './meter-protocol'

/** Injectable node constructor so tests can substitute a mock worklet node. */
export type MeterNodeFactory = (
  context: BaseAudioContext,
  name: string,
  options: AudioWorkletNodeOptions,
) => AudioWorkletNode

export interface LufsMeterOptions {
  /** Posting cadence in ms, clamped to 33..1000 (default 50). */
  intervalMs?: number
  /** Where `addModule` loads the meter processor from (default: the bundled `worklets/meter.js`). */
  processorUrl?: URL | string
  createNode?: MeterNodeFactory
}

export type MeterListener = (reading: MeterReading) => void

/** Default location of the bundled meter processor, relative to the built core entry. Call lazily. */
export function defaultMeterProcessorUrl(): string {
  return new URL('./worklets/meter.js', import.meta.url).href
}

const defaultCreateNode: MeterNodeFactory = (context, name, options) =>
  new AudioWorkletNode(context, name, options)

export class LufsMeter {
  readonly node: AudioWorkletNode
  private intervalMsValue: number
  private latest: MeterReading = silentReading()
  private readonly listeners = new Set<MeterListener>()
  private disposed = false

  private constructor(node: AudioWorkletNode, intervalMs: number) {
    this.node = node
    this.intervalMsValue = intervalMs
    node.port.onmessage = (event: MessageEvent<MeterHostMessage>) => {
      this.receive(event.data)
    }
  }

  /** Load the processor (once per context) and build the sink node. */
  static async create(
    context: BaseAudioContext,
    options: LufsMeterOptions = {},
  ): Promise<LufsMeter> {
    const intervalMs = clampMeterInterval(options.intervalMs ?? DEFAULT_METER_INTERVAL_MS)
    const url =
      options.processorUrl === undefined
        ? defaultMeterProcessorUrl()
        : typeof options.processorUrl === 'string'
          ? options.processorUrl
          : options.processorUrl.href
    await ensureProcessor(context, url)
    const processorOptions: MeterProcessorOptions = { intervalMs }
    const node = (options.createNode ?? defaultCreateNode)(context, METER_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      processorOptions,
    })
    return new LufsMeter(node, intervalMs)
  }

  /** Connect the signal to measure here (a sink: nothing comes out). */
  get input(): AudioNode {
    return this.node
  }

  /** Posting cadence in ms. */
  get intervalMs(): number {
    return this.intervalMsValue
  }

  /** The most recent reading (silent until the first one arrives). */
  get reading(): MeterReading {
    return this.latest
  }

  /** 400 ms loudness, LUFS. */
  get lufsMomentary(): number {
    return this.latest.momentary
  }

  /** 3 s loudness, LUFS. */
  get lufsShortTerm(): number {
    return this.latest.shortTerm
  }

  /** Gated loudness since the last reset, LUFS. */
  get lufsIntegrated(): number {
    return this.latest.integrated
  }

  /** Sample peak over both channels in the last span, linear 0..1+. */
  get peak(): number {
    return Math.max(this.latest.samplePeak[0], this.latest.samplePeak[1])
  }

  /** True (inter-sample) peak over both channels in the last span, linear. */
  get truePeak(): number {
    return Math.max(this.latest.truePeak[0], this.latest.truePeak[1])
  }

  /** Sample peak in dBFS (−Infinity when silent). */
  get peakDb(): number {
    return gainToDb(this.peak)
  }

  /** True peak in dBTP. */
  get truePeakDb(): number {
    return gainToDb(this.truePeak)
  }

  /** Highest true peak since the last reset, dBTP. */
  get maxTruePeakDb(): number {
    return gainToDb(this.latest.maxTruePeak)
  }

  /** Called with every reading; returns the unsubscribe function. */
  subscribe(listener: MeterListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Change the posting cadence (clamped to 33..1000 ms). */
  setInterval(intervalMs: number): void {
    this.intervalMsValue = clampMeterInterval(intervalMs)
    this.post({ type: 'set-interval', intervalMs: this.intervalMsValue })
  }

  /** Restart the integrated measurement and peak hold. */
  reset(): void {
    this.latest = silentReading()
    this.post({ type: 'reset' })
  }

  dispose(): void {
    if (this.disposed) return
    this.post({ type: 'dispose' })
    this.disposed = true
    this.listeners.clear()
    this.node.disconnect()
    this.node.port.close()
  }

  private receive(message: MeterHostMessage): void {
    if (this.disposed) return
    switch (message.type) {
      case 'reading':
        this.latest = message.reading
        for (const listener of this.listeners) listener(message.reading)
        break
      default: {
        const unhandled: never = message.type
        throw new Error(`live-mix: unhandled meter host message ${String(unhandled)}`)
      }
    }
  }

  private post(message: MeterMessage): void {
    if (this.disposed) return
    this.node.port.postMessage(message)
  }
}
