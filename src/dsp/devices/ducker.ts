// dsp-entry side of the worklet ducker (U17): resolves the bundled processor
// (dist/worklets/ducker.js) relative to this entry, loads it once per context,
// and offers an async factory for standalone use. The host class itself lives
// in core so `engine.addDucker(bus, { mode: 'worklet' })` can construct it
// synchronously once the processor is loaded.

import { WorkletDucker, type WorkletDuckerOptions } from '../../core/devices/native/WorkletDucker'
import { resolveProcessorUrl } from '../assets'
import { ensureProcessor } from '../WasmDevice'

/** Default location of the bundled ducker processor. Call lazily. */
export function duckerProcessorUrl(): string {
  return new URL('../worklets/ducker.js', import.meta.url).href
}

export interface DuckerProcessorOverrides {
  /** Where `addModule` loads the ducker processor from. */
  processorUrl?: URL | string
}

/**
 * Register the ducker processor in `context` (once per context per URL).
 * Await this before `engine.addDucker(bus, { mode: 'worklet' })`.
 */
export function loadDuckerProcessor(
  context: BaseAudioContext,
  processorUrl?: URL | string,
): Promise<void> {
  const url = processorUrl === undefined ? duckerProcessorUrl() : resolveProcessorUrl(processorUrl)
  return ensureProcessor(context, url)
}

/** Load the processor and construct a `WorkletDucker`; insert it with `bus.addInsert`. */
export async function createWorkletDucker(
  context: BaseAudioContext,
  options: WorkletDuckerOptions & DuckerProcessorOverrides = {},
): Promise<WorkletDucker> {
  await loadDuckerProcessor(context, options.processorUrl)
  return new WorkletDucker(context, options)
}
