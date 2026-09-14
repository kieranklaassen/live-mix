// `useSyncExternalStore` over engine objects. Every core object that a hook
// reads exposes an `onChange`/`subscribe`-style listener; the hook reads a
// small plain snapshot from it and hands React the previous snapshot whenever
// nothing in it changed, which is what `useSyncExternalStore` needs to skip a
// render (and to avoid its "getSnapshot should be cached" loop).

import { useCallback, useRef, useSyncExternalStore } from 'react'

export type Subscribe = (onChange: () => void) => () => void

/** A subscription that never notifies — for objects without change events. */
export const neverSubscribe: Subscribe = () => () => {}

function arraysEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false
  for (let index = 0; index < a.length; index += 1) {
    if (!Object.is(a[index], b[index])) return false
  }
  return true
}

/**
 * Snapshot equality: own properties by `Object.is`, except array-valued
 * properties (and arrays themselves), which compare element-wise. Snapshots
 * copy the engine's live arrays, so a fresh copy of the same members is equal.
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && arraysEqual(a, b)
  }
  const left = a as Record<string, unknown>
  const right = b as Record<string, unknown>
  const keys = Object.keys(left)
  if (keys.length !== Object.keys(right).length) return false
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(right, key)) return false
    const x = left[key]
    const y = right[key]
    if (Object.is(x, y)) continue
    if (Array.isArray(x) && Array.isArray(y) && arraysEqual(x, y)) continue
    return false
  }
  return true
}

/**
 * Read `read()` as an external store: re-rendered when `subscribe` fires and
 * the fresh snapshot differs from the last one under `isEqual`. `read` must
 * be pure and cheap; wrap it in `useCallback` keyed on the source object.
 * Safe under SSR: the same snapshot serves the server render.
 */
export function useExternalSnapshot<T>(
  subscribe: Subscribe,
  read: () => T,
  isEqual: (previous: T, next: T) => boolean = shallowEqual,
): T {
  const cache = useRef<{ value: T } | null>(null)
  const getSnapshot = useCallback((): T => {
    const next = read()
    const cached = cache.current
    if (cached && isEqual(cached.value, next)) return cached.value
    cache.current = { value: next }
    return next
  }, [read, isEqual])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
