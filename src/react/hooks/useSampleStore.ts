// SampleStore metrics for memory readouts, over `SampleStore.onChange`.

import { useCallback, useMemo } from 'react'

import {
  type LoadedSample,
  type SampleSource,
  type SampleStore,
  type SampleStoreMetrics,
} from '../../core/tracks/SampleStore'
import { useExternalSnapshot } from '../store'
import { useEnginePart } from './useEngine'

export interface SampleStoreControls {
  load(id: string, source: SampleSource): Promise<LoadedSample>
  forget(id: string): void
  pin(id: string): void
  unpin(id: string): void
  setBudgetBytes(bytes: number): void
  /** Run the budget policy now; returns the ids dropped. */
  evict(): string[]
}

export type UseSampleStoreResult = SampleStoreControls & {
  store: SampleStore
  metrics: SampleStoreMetrics
  /** Ids currently held, least recently used first. */
  ids: readonly string[]
}

interface StoreSnapshot {
  metrics: SampleStoreMetrics
  ids: readonly string[]
}

function snapshotEqual(a: StoreSnapshot, b: StoreSnapshot): boolean {
  if (a.ids.length !== b.ids.length) return false
  for (let index = 0; index < a.ids.length; index += 1)
    if (a.ids[index] !== b.ids[index]) return false
  const left = a.metrics as unknown as Record<string, unknown>
  const right = b.metrics as unknown as Record<string, unknown>
  for (const key of Object.keys(left)) if (!Object.is(left[key], right[key])) return false
  return true
}

/** Metrics and ids of a sample store (default: the provided engine's). */
export function useSampleStore(store?: SampleStore): UseSampleStoreResult {
  const target = useEnginePart(store, (engine) => engine.samples, 'useSampleStore')
  const subscribe = useCallback(
    (onChange: () => void) => target.onChange(() => onChange()),
    [target],
  )
  const read = useCallback(
    (): StoreSnapshot => ({ metrics: target.metrics, ids: target.ids() }),
    [target],
  )
  const snapshot = useExternalSnapshot(subscribe, read, snapshotEqual)
  const controls = useMemo<SampleStoreControls>(
    () => ({
      load: (id, source) => target.load(id, source),
      forget: (id) => target.forget(id),
      pin: (id) => target.pin(id),
      unpin: (id) => target.unpin(id),
      setBudgetBytes: (bytes) => {
        target.budgetBytes = bytes
      },
      evict: () => target.evict(),
    }),
    [target],
  )
  return { store: target, metrics: snapshot.metrics, ids: snapshot.ids, ...controls }
}
