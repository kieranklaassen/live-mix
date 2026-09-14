// Version history for panels (U30): the list of saved versions over
// `VersionHistory.onChange`, with save/checkpoint/restore/remove/diff bound.

import { useCallback, useMemo } from 'react'

import { type ArbiterResult } from '../../score/Arbiter'
import { type Score } from '../../score/schema'
import {
  type Milestone,
  type RestoreOptions,
  type SaveOptions,
  type VersionDiff,
  type VersionHistory,
  type VersionSummary,
} from '../../score/versions'
import { useExternalSnapshot } from '../store'
import { useMaybeVersions } from './useEngine'

export interface VersionsSnapshot {
  /** Oldest first. */
  versions: VersionSummary[]
  /** The most recent version, or null. */
  latest: VersionSummary | null
  bytes: number
  /** Bumped on every history event. */
  revision: number
}

export interface VersionsControls {
  save(label: string, options?: SaveOptions): VersionSummary
  checkpoint(milestone: Milestone, label?: string): VersionSummary
  restore(id: string, options?: RestoreOptions): ArbiterResult
  remove(id: string): boolean
  diff(fromId: string, toId: string): VersionDiff
  scoreOf(id: string): Score
  /** Load what storage holds. */
  open(): Promise<VersionSummary[]>
}

export type UseVersionsResult = VersionsSnapshot & VersionsControls & { history: VersionHistory }

function sameRevision(a: { revision: number }, b: { revision: number }): boolean {
  return a.revision === b.revision
}

/** The versions of a history (the provided one by default), re-read on every save, restore or removal. */
export function useVersions(history?: VersionHistory): UseVersionsResult {
  const provided = useMaybeVersions()
  const target = history ?? provided
  if (!target) {
    throw new Error(
      'live-mix/react: useVersions needs a VersionHistory — pass one or render inside <LiveMixProvider versions={history}>',
    )
  }
  const subscribe = useCallback(
    (onChange: () => void) => target.onChange(() => onChange()),
    [target],
  )
  const read = useCallback((): VersionsSnapshot => {
    const versions = target.versions
    return {
      versions,
      latest: versions[versions.length - 1] ?? null,
      bytes: target.bytes,
      revision: target.revision,
    }
  }, [target])
  const snapshot = useExternalSnapshot(subscribe, read, sameRevision)
  const controls = useMemo<VersionsControls>(
    () => ({
      save: (label, options) => target.save(label, options),
      checkpoint: (milestone, label) => target.checkpoint(milestone, label),
      restore: (id, options) => target.restore(id, options),
      remove: (id) => target.remove(id),
      diff: (fromId, toId) => target.diff(fromId, toId),
      scoreOf: (id) => target.scoreOf(id),
      open: () => target.open(),
    }),
    [target],
  )
  return { history: target, ...snapshot, ...controls }
}
