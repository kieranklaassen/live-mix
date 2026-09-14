// Render-load and glitch counters over `EngineStats.subscribe`.

import { useCallback, useMemo } from 'react'

import { type EngineStats, type EngineStatsSnapshot } from '../../core/stats'
import { useExternalSnapshot } from '../store'
import { useEnginePart } from './useEngine'

export interface EngineStatsControls {
  reset(): void
  /** Count a glitch the host detected itself. */
  recordGlitch(count?: number): void
}

export type UseEngineStatsResult = EngineStatsSnapshot &
  EngineStatsControls & { stats: EngineStats }

/** Glitch count and render load (default: the provided engine's `stats`). */
export function useEngineStats(stats?: EngineStats): UseEngineStatsResult {
  const target = useEnginePart(stats, (engine) => engine.stats, 'useEngineStats')
  const subscribe = useCallback(
    (onChange: () => void) => target.subscribe(() => onChange()),
    [target],
  )
  const read = useCallback((): EngineStatsSnapshot => target.snapshot(), [target])
  const snapshot = useExternalSnapshot(subscribe, read)
  const controls = useMemo<EngineStatsControls>(
    () => ({
      reset: () => target.reset(),
      recordGlitch: (count) => target.recordGlitch(count),
    }),
    [target],
  )
  return { stats: target, ...snapshot, ...controls }
}
