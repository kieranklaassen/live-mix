// dsp-entry side of the voice cleanup devices: resolves the bundled
// processors (dist/worklets/cleanup.js, all six kinds in one file) relative
// to this entry, loads them once per context, and offers an async factory.
// The host class itself lives in core beside the gate's.

import { type CleanupKind } from '../../core/devices/native/cleanup/abi'
import {
  WorkletCleanup,
  type WorkletCleanupOptions,
} from '../../core/devices/native/cleanup/WorkletCleanup'
import { resolveProcessorUrl } from '../assets'
import { ensureProcessor } from '../WasmDevice'

/** Default location of the bundled cleanup processors. Call lazily. */
export function cleanupProcessorUrl(): string {
  return new URL('../worklets/cleanup.js', import.meta.url).href
}

export interface CleanupProcessorOverrides {
  /** Where `addModule` loads the cleanup processors from. */
  processorUrl?: URL | string
}

/** Register the six cleanup processors in `context` (once per context per URL). */
export function loadCleanupProcessor(
  context: BaseAudioContext,
  processorUrl?: URL | string,
): Promise<void> {
  const url = processorUrl === undefined ? cleanupProcessorUrl() : resolveProcessorUrl(processorUrl)
  return ensureProcessor(context, url)
}

/** Load the processors and construct a `WorkletCleanup` of `kind`; insert it with `bus.addInsert`. */
export async function createWorkletCleanup(
  context: BaseAudioContext,
  kind: CleanupKind,
  options: WorkletCleanupOptions & CleanupProcessorOverrides = {},
): Promise<WorkletCleanup> {
  await loadCleanupProcessor(context, options.processorUrl)
  return new WorkletCleanup(context, kind, options)
}
