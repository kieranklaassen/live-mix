import type { ScoreDocument } from '@kieranklaassen/live-mix'
import { useSyncExternalStore } from 'react'

/** Re-render when the document changes; the value is the operation log length. */
export function useDocumentVersion(document: ScoreDocument): number {
  return useSyncExternalStore(
    (onChange) => document.onChange(onChange),
    () => document.log.length,
    () => document.log.length,
  )
}
