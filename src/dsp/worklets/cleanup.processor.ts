// AudioWorklet processors for the six voice cleanup devices, one registered
// name per kind, all in one bundled file (dist/worklets/cleanup.js): the
// signal comes in, the kind's kernel cleans it, and it leaves. The host only
// sends parameter and bypass messages and receives a low-rate meter report.
//
// This file runs in the AudioWorkletGlobalScope and is bundled to a single
// self-contained file: the kernels and the ABI are inlined by the bundler,
// nothing is imported at runtime.

import {
  CLEANUP_KINDS,
  CLEANUP_PARAMS,
  CLEANUP_REPORT_HZ,
  cleanupProcessorName,
  type CleanupHostMessage,
  type CleanupKind,
  type CleanupMessage,
  type CleanupProcessorOptions,
} from '../../core/devices/native/cleanup/abi'
import { type AnyCleanupKernel } from '../../core/devices/native/cleanup/CleanupKernel'
import { createCleanupKernel } from '../../core/devices/native/cleanup/kernels'
import { type ParamSpec } from '../../core/params'

/**
 * Two channels of silence, `frames` long. A source that has ended leaves the
 * node's input with no channels at all. The node takes two whenever it is
 * fed, so what the kernel still holds is of two: handed none it would work on
 * one, and play what it holds of the first on both sides.
 */
let silentPair: Float32Array[] = [new Float32Array(0), new Float32Array(0)]
function silence(frames: number): Float32Array[] {
  if (silentPair[0].length !== frames) {
    silentPair = [new Float32Array(frames), new Float32Array(frames)]
  }
  return silentPair
}

function processorFor(kind: CleanupKind) {
  const namesById = new Map<number, string>(
    Object.entries(CLEANUP_PARAMS[kind] as Readonly<Record<string, ParamSpec>>).map(
      ([name, spec]) => [spec.id, name],
    ),
  )

  return class CleanupProcessor extends AudioWorkletProcessor {
    private readonly kernel: AnyCleanupKernel
    private readonly reportInterval: number
    private samplesSinceReport = 0
    private alive = true

    constructor(options?: AudioWorkletNodeOptions) {
      super()
      const processorOptions = (options?.processorOptions ?? { kind }) as CleanupProcessorOptions
      this.kernel = createCleanupKernel(kind, sampleRate)
      for (const [paramId, value] of processorOptions.params ?? []) this.setParam(paramId, value)
      if (processorOptions.bypassed) this.kernel.startBypassed()
      const reportHz = processorOptions.reportHz ?? CLEANUP_REPORT_HZ
      this.reportInterval = reportHz > 0 ? Math.max(1, Math.round(sampleRate / reportHz)) : 0

      this.port.onmessage = (event: MessageEvent<CleanupMessage>) => {
        this.handleMessage(event.data)
      }
      const ready: CleanupHostMessage = { type: 'ready' }
      this.port.postMessage(ready)
    }

    private setParam(paramId: number, value: number): void {
      const name = namesById.get(paramId)
      if (name === undefined) throw new Error(`live-mix: ${kind} has no parameter id ${paramId}`)
      this.kernel.setParam(name, value)
    }

    private handleMessage(message: CleanupMessage): void {
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
          throw new Error(`live-mix: unhandled ${kind} message ${JSON.stringify(unhandled)}`)
        }
      }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
      if (!this.alive) return false
      const output = outputs[0]
      if (!output || output.length === 0) return true
      const frames = output[0].length
      // An input that is disconnected, or whose source has ended, arrives as an empty array.
      const input = inputs[0]
      this.kernel.process(input && input.length > 0 ? input : silence(frames), output, frames)

      if (this.reportInterval > 0) {
        this.samplesSinceReport += frames
        if (this.samplesSinceReport >= this.reportInterval) {
          this.samplesSinceReport -= this.reportInterval
          const report: CleanupHostMessage = {
            type: 'meter',
            reduction: this.kernel.takeReduction(),
          }
          this.port.postMessage(report)
        }
      }
      return true
    }
  }
}

for (const kind of CLEANUP_KINDS) registerProcessor(cleanupProcessorName(kind), processorFor(kind))
