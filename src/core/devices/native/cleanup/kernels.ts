// The kernel of each voice cleanup device, by kind: what the worklet
// processor runs and what an offline test renders through.

import { type CleanupKind } from './abi'
import { type AnyCleanupKernel } from './CleanupKernel'
import { DeclickKernel } from './DeclickKernel'
import { DeessKernel } from './DeessKernel'
import { DehumKernel } from './DehumKernel'
import { DenoiseKernel } from './DenoiseKernel'
import { DeplosiveKernel } from './DeplosiveKernel'
import { DereverbKernel } from './DereverbKernel'

const KERNELS: Readonly<Record<CleanupKind, new (sampleRate: number) => AnyCleanupKernel>> = {
  'de-hum': DehumKernel,
  'de-click': DeclickKernel,
  'de-plosive': DeplosiveKernel,
  'de-noise': DenoiseKernel,
  'de-reverb': DereverbKernel,
  'de-ess': DeessKernel,
}

/** A new kernel of `kind` at `sampleRate`, at its default settings. */
export function createCleanupKernel(kind: CleanupKind, sampleRate: number): AnyCleanupKernel {
  return new KERNELS[kind](sampleRate)
}
