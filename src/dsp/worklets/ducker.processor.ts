// AudioWorklet processor for the sidechain ducker (U17): input 0 is the
// signal (the bus being ducked), input 1 the key (the voice). Envelope
// detection and the gain live here, in the audio thread, so there is no
// main-thread timer and no `setTargetAtTime` traffic; the host only sends
// parameter and bypass messages and receives a low-rate envelope report.
//
// This file runs in the AudioWorkletGlobalScope and is bundled to a single
// self-contained file (dist/worklets/ducker.js): the kernel and the ABI are
// inlined by the bundler, nothing is imported at runtime.

import {
  DUCKER_PARAMS,
  DUCKER_PROCESSOR_NAME,
  DUCKER_REPORT_HZ,
  type DuckerHostMessage,
  type DuckerMessage,
  type DuckerParamName,
  type DuckerProcessorOptions,
} from '../../core/devices/native/ducker-abi'
import { DuckerKernel } from '../../core/devices/native/DuckerKernel'

const paramNamesById = new Map<number, DuckerParamName>(
  (Object.keys(DUCKER_PARAMS) as DuckerParamName[]).map((name) => [DUCKER_PARAMS[name].id, name]),
)

const EMPTY_INPUT: Float32Array[] = []

class DuckerProcessor extends AudioWorkletProcessor {
  private readonly kernel: DuckerKernel
  private readonly reportInterval: number
  private samplesSinceReport = 0
  private alive = true

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const processorOptions = (options?.processorOptions ?? {}) as DuckerProcessorOptions
    this.kernel = new DuckerKernel(sampleRate, { windowSize: processorOptions.windowSize })
    for (const [paramId, value] of processorOptions.params ?? []) {
      this.setParam(paramId, value)
    }
    const reportHz = processorOptions.reportHz ?? DUCKER_REPORT_HZ
    this.reportInterval = reportHz > 0 ? Math.max(1, Math.round(sampleRate / reportHz)) : 0

    this.port.onmessage = (event: MessageEvent<DuckerMessage>) => {
      this.handleMessage(event.data)
    }
    const ready: DuckerHostMessage = { type: 'ready', windowSize: this.kernel.windowSize }
    this.port.postMessage(ready)
  }

  private setParam(paramId: number, value: number): void {
    const name = paramNamesById.get(paramId)
    if (name === undefined) throw new Error(`live-mix: ducker has no parameter id ${paramId}`)
    this.kernel.setParam(name, value)
  }

  private handleMessage(message: DuckerMessage): void {
    switch (message.type) {
      case 'set-param':
        this.setParam(message.paramId, message.value)
        break
      case 'bypass':
        this.kernel.bypass = message.enabled
        break
      case 'stop':
        this.kernel.stop()
        break
      case 'dispose':
        this.alive = false
        break
      default: {
        const unhandled: never = message
        throw new Error(`live-mix: unhandled ducker message ${JSON.stringify(unhandled)}`)
      }
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (!this.alive) return false
    const output = outputs[0]
    if (!output || output.length === 0) return true
    const frames = output[0].length
    // A disconnected input arrives as an empty array: silence for the signal,
    // "no key" (release to unity) for the sidechain.
    const signal = inputs[0] ?? EMPTY_INPUT
    const key = inputs[1] ?? EMPTY_INPUT
    this.kernel.process(signal, key, output, frames)

    if (this.reportInterval > 0) {
      this.samplesSinceReport += frames
      if (this.samplesSinceReport >= this.reportInterval) {
        this.samplesSinceReport -= this.reportInterval
        const report: DuckerHostMessage = {
          type: 'envelope',
          envelope: this.kernel.envelope,
          gain: this.kernel.gain,
        }
        this.port.postMessage(report)
      }
    }
    return true
  }
}

registerProcessor(DUCKER_PROCESSOR_NAME, DuckerProcessor)
