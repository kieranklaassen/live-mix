// AudioWorklet processor for the gate: the signal comes in, the kernel turns
// it down while it is under the threshold, and it leaves. Detection and the
// gain live here, in the audio thread; the host only sends parameter and
// bypass messages and receives a low-rate level report.
//
// This file runs in the AudioWorkletGlobalScope and is bundled to a single
// self-contained file (dist/worklets/gate.js): the kernel and the ABI are
// inlined by the bundler, nothing is imported at runtime.

import {
  GATE_PARAMS,
  GATE_PROCESSOR_NAME,
  GATE_REPORT_HZ,
  type GateHostMessage,
  type GateMessage,
  type GateParamName,
  type GateProcessorOptions,
} from '../../core/devices/native/gate-abi'
import { GateKernel } from '../../core/devices/native/GateKernel'

const paramNamesById = new Map<number, GateParamName>(
  (Object.keys(GATE_PARAMS) as GateParamName[]).map((name) => [GATE_PARAMS[name].id, name]),
)

const EMPTY_INPUT: Float32Array[] = []

class GateProcessor extends AudioWorkletProcessor {
  private readonly kernel: GateKernel
  private readonly reportInterval: number
  private samplesSinceReport = 0
  private alive = true

  constructor(options?: AudioWorkletNodeOptions) {
    super()
    const processorOptions = (options?.processorOptions ?? {}) as GateProcessorOptions
    this.kernel = new GateKernel(sampleRate)
    for (const [paramId, value] of processorOptions.params ?? []) {
      this.setParam(paramId, value)
    }
    // Closed at the parameters it was made with, not the defaults.
    this.kernel.reset()
    const reportHz = processorOptions.reportHz ?? GATE_REPORT_HZ
    this.reportInterval = reportHz > 0 ? Math.max(1, Math.round(sampleRate / reportHz)) : 0

    this.port.onmessage = (event: MessageEvent<GateMessage>) => {
      this.handleMessage(event.data)
    }
    const ready: GateHostMessage = { type: 'ready' }
    this.port.postMessage(ready)
  }

  private setParam(paramId: number, value: number): void {
    const name = paramNamesById.get(paramId)
    if (name === undefined) throw new Error(`live-mix: gate has no parameter id ${paramId}`)
    this.kernel.setParam(name, value)
  }

  private handleMessage(message: GateMessage): void {
    switch (message.type) {
      case 'set-param':
        this.setParam(message.paramId, message.value)
        break
      case 'bypass':
        this.kernel.bypass = message.enabled
        break
      case 'dispose':
        this.alive = false
        break
      default: {
        const unhandled: never = message
        throw new Error(`live-mix: unhandled gate message ${JSON.stringify(unhandled)}`)
      }
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (!this.alive) return false
    const output = outputs[0]
    if (!output || output.length === 0) return true
    const frames = output[0].length
    // A disconnected input arrives as an empty array: silence.
    this.kernel.process(inputs[0] ?? EMPTY_INPUT, output, frames)

    if (this.reportInterval > 0) {
      this.samplesSinceReport += frames
      if (this.samplesSinceReport >= this.reportInterval) {
        this.samplesSinceReport -= this.reportInterval
        const report: GateHostMessage = {
          type: 'level',
          level: this.kernel.level,
          gain: this.kernel.gain,
        }
        this.port.postMessage(report)
      }
    }
    return true
  }
}

registerProcessor(GATE_PROCESSOR_NAME, GateProcessor)
