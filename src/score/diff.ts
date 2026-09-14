// Structural diff of two scores (U30, R24): field-level changes with paths
// that name entities by id (`tracks[music].strip.level`), so a diff reads
// the same however the lists are ordered. Lists of identified records
// (tracks, clips, devices, lanes, …) match by `id`; lists of plain values or
// unidentified records (breakpoints, tempo segments) match by index.

import { type Score } from './schema'

export type FieldChangeKind = 'added' | 'removed' | 'changed' | 'moved'

export interface FieldChange {
  /** `tracks[music].clips[c1].startSec`, `master.level`, `lanes[l1].breakpoints[2]`. */
  path: string
  kind: FieldChangeKind
  /** Previous value (`moved`: previous index). Absent for `added`. */
  before?: unknown
  /** New value (`moved`: new index). Absent for `removed`. */
  after?: unknown
}

type Json = unknown

interface Identified {
  id: string
}

function isRecord(value: Json): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIdentified(value: Json): value is Identified & Record<string, Json> {
  return isRecord(value) && typeof value.id === 'string'
}

/** Every element carries a unique string id. */
function identifiedList(list: Json[]): list is (Identified & Record<string, Json>)[] {
  if (list.length === 0) return false
  const ids = new Set<string>()
  for (const item of list) {
    if (!isIdentified(item) || ids.has(item.id)) return false
    ids.add(item.id)
  }
  return true
}

function sameJson(a: Json, b: Json): boolean {
  if (Object.is(a, b)) return true
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, index) => sameJson(item, b[index]))
  }
  if (isRecord(a) && isRecord(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) if (!sameJson(a[key], b[key])) return false
    return true
  }
  return false
}

function diffLists(path: string, before: Json[], after: Json[], out: FieldChange[]): void {
  const keyed =
    (before.length === 0 || identifiedList(before)) && (after.length === 0 || identifiedList(after))
  if (keyed) {
    const previous = new Map<string, { item: Record<string, Json>; index: number }>()
    before.forEach((item, index) => {
      if (isIdentified(item)) previous.set(item.id, { item, index })
    })
    const afterIds = new Set<string>()
    for (const item of after) if (isIdentified(item)) afterIds.add(item.id)
    // Order is compared among the survivors, so a removal does not read as moves.
    const rankBefore = new Map<string, number>()
    for (const item of before) {
      if (isIdentified(item) && afterIds.has(item.id)) rankBefore.set(item.id, rankBefore.size)
    }
    const seen = new Set<string>()
    let rankAfter = 0
    after.forEach((item, index) => {
      if (!isIdentified(item)) return
      seen.add(item.id)
      const entry = previous.get(item.id)
      const itemPath = `${path}[${item.id}]`
      if (!entry) {
        out.push({ path: itemPath, kind: 'added', after: item })
        return
      }
      if (rankBefore.get(item.id) !== rankAfter) {
        out.push({ path: itemPath, kind: 'moved', before: entry.index, after: index })
      }
      rankAfter += 1
      diffValues(itemPath, entry.item, item, out)
    })
    for (const [id, entry] of previous) {
      if (!seen.has(id)) out.push({ path: `${path}[${id}]`, kind: 'removed', before: entry.item })
    }
    return
  }
  const length = Math.max(before.length, after.length)
  for (let index = 0; index < length; index += 1) {
    const itemPath = `${path}[${index}]`
    if (index >= before.length) out.push({ path: itemPath, kind: 'added', after: after[index] })
    else if (index >= after.length)
      out.push({ path: itemPath, kind: 'removed', before: before[index] })
    else diffValues(itemPath, before[index], after[index], out)
  }
}

function diffValues(path: string, before: Json, after: Json, out: FieldChange[]): void {
  if (Object.is(before, after)) return
  if (Array.isArray(before) && Array.isArray(after)) {
    diffLists(path, before, after, out)
    return
  }
  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const key of [...keys].sort()) {
      const childPath = path === '' ? key : `${path}.${key}`
      const a = before[key]
      const b = after[key]
      if (a === undefined && b !== undefined) out.push({ path: childPath, kind: 'added', after: b })
      else if (a !== undefined && b === undefined)
        out.push({ path: childPath, kind: 'removed', before: a })
      else diffValues(childPath, a, b, out)
    }
    return
  }
  if (!sameJson(before, after)) out.push({ path, kind: 'changed', before, after })
}

/**
 * Every field that differs between two scores, in document order. Identical
 * documents yield `[]`; `format` and `id` are compared like any other field.
 */
export function diffScores(before: Score, after: Score): FieldChange[] {
  const out: FieldChange[] = []
  diffValues('', before, after, out)
  return out
}

function short(value: unknown): string {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(3)
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'boolean' || value === null) return String(value)
  if (isIdentified(value)) return value.id
  if (Array.isArray(value)) return `[${value.length}]`
  return '{…}'
}

/** One line per change, for history panels and transcripts. */
export function describeFieldChange(change: FieldChange): string {
  switch (change.kind) {
    case 'added':
      return `${change.path} added ${short(change.after)}`
    case 'removed':
      return `${change.path} removed ${short(change.before)}`
    case 'changed':
      return `${change.path} ${short(change.before)} → ${short(change.after)}`
    case 'moved':
      return `${change.path} moved ${short(change.before)} → ${short(change.after)}`
    default: {
      const exhaustive: never = change.kind
      return exhaustive
    }
  }
}
