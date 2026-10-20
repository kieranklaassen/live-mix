// dsp-entry side of the worklet gate: resolves the bundled processor
// (dist/worklets/gate.js) relative to this entry, loads it once per context,
// and offers an async factory. The host class itself lives in core beside the
// ducker's.

import { WorkletGate, type WorkletGateOptions } from '../../core/devices/native/WorkletGate'
import { resolveProcessorUrl } from '../assets'
import { ensureProcessor } from '../WasmDevice'

/** Default location of the bundled gate processor. Call lazily. */
export function gateProcessorUrl(): string {
  return new URL('../worklets/gate.js', import.meta.url).href
}

export interface GateProcessorOverrides {
  /** Where `addModule` loads the gate processor from. */
  processorUrl?: URL | string
}

/** Register the gate processor in `context` (once per context per URL). */
export function loadGateProcessor(
  context: BaseAudioContext,
  processorUrl?: URL | string,
): Promise<void> {
  const url = processorUrl === undefined ? gateProcessorUrl() : resolveProcessorUrl(processorUrl)
  return ensureProcessor(context, url)
}

/** Load the processor and construct a `WorkletGate`; insert it with `bus.addInsert`. */
export async function createWorkletGate(
  context: BaseAudioContext,
  options: WorkletGateOptions & GateProcessorOverrides = {},
): Promise<WorkletGate> {
  await loadGateProcessor(context, options.processorUrl)
  return new WorkletGate(context, options)
}
