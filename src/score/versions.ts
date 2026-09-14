// Version history (U30, R24): named snapshots of a document — saved by hand
// (`save('before the drop')`) or at session milestones (`checkpoint('start')`)
// — that restore as one undoable operation and diff against each other at
// the operation and field level. Storage is compact: a version keeps the
// operation-log slice since the previous one and a full score only when it
// has to (first version, a new log after `load`, a slice over budget, or
// every `fullEvery` versions so restoring never replays a long chain). A
// total budget prunes the oldest automatic checkpoints first, promoting the
// next delta to a full base so nothing dangles. The in-memory index is the
// source of truth; a `VersionStorage` adapter persists it write-through.

import { Emitter } from '../core/events'
import { type Arbiter, type ArbiterResult } from './Arbiter'
import { diffScores, type FieldChange } from './diff'
import { type Author, type LogEntry, type LogEntryKind } from './log'
import { apply, isOperation, type Operation } from './operations'
import { parseScore, serializeScore, type Score } from './schema'
import { type ScoreDocument } from './ScoreDocument'
import { byteLength, type StoredVersionRecord, type VersionStorage } from './versionStorage'

export const VERSION_FORMAT = 1

export type VersionKind = 'manual' | 'auto'

/** Session milestones automatic checkpoints are named after; any string is accepted. */
export type Milestone = 'start' | 'section' | 'end' | (string & Record<never, never>)

/** One logged operation without its inverse (recomputed on replay). */
export interface StoredOp {
  seq: number
  op: Operation
  author: Author
  atMs: number
  kind: LogEntryKind
  label?: string
}

export interface StoredVersion extends StoredVersionRecord {
  format: typeof VERSION_FORMAT
  id: string
  label: string
  kind: VersionKind
  milestone?: string
  atMs: number
  author: Author
  /** Which log instance (`load` starts a new one) and the position in it. */
  epoch: number
  seq: number
  /** The version this one was saved after, if still present. */
  parent: string | null
  /** The full document; present on base versions. */
  score?: Score
  /** The operations applied since `parent`; present when they fit the budget. */
  ops?: StoredOp[]
  /** Serialized size of this record. */
  bytes: number
}

export interface VersionSummary {
  id: string
  label: string
  kind: VersionKind
  milestone?: string
  atMs: number
  author: Author
  seq: number
  parent: string | null
  /** `full` carries a score; `delta` replays from its parent chain. */
  base: 'full' | 'delta'
  /** Operations recorded since the parent, when kept. */
  opCount: number | null
  bytes: number
}

export interface VersionDiff {
  from: VersionSummary
  to: VersionSummary
  /**
   * The operations between the two, oldest first, when `to` descends from
   * `from` and every link kept its slice; null when unknowable.
   */
  operations: StoredOp[] | null
  fields: FieldChange[]
}

export interface SaveOptions {
  kind?: VersionKind
  milestone?: Milestone
  author?: Author
  atMs?: number
}

export interface RestoreOptions {
  author?: Author
  atMs?: number
  label?: string
}

export type VersionEvent =
  | { type: 'saved'; version: VersionSummary }
  | { type: 'removed'; version: VersionSummary }
  | { type: 'restored'; version: VersionSummary; result: ArbiterResult }
  | { type: 'opened'; versions: VersionSummary[] }

export type VersionListener = (event: VersionEvent) => void

export interface VersionHistoryOptions {
  storage?: VersionStorage
  /** Wall clock in milliseconds; defaults to the document's `Date.now`. */
  now?: () => number
  /** Id generator; default time-and-counter. */
  id?: () => string
  /** Largest delta kept per version; over it a full score is stored instead. Default 256 KiB. */
  budgetBytes?: number
  /** Total kept before the oldest automatic checkpoints are pruned (named versions never are). Default 16 MiB. */
  totalBudgetBytes?: number
  /** A full base at least every this many versions. Default 8. */
  fullEvery?: number
  /** Save a `start` checkpoint now and on every `load`. Default true. */
  autoCheckpoints?: boolean
  /** Restores go through the arbiter (a held target defers them) when given. */
  arbiter?: Arbiter
  /** Default author of saves and restores; the document's when omitted. */
  author?: Author
  /** Storage failures land here (they never throw into `save`). */
  onError?: (error: unknown) => void
}

export const DEFAULT_VERSION_BUDGET_BYTES = 256 * 1024
export const DEFAULT_VERSION_TOTAL_BUDGET_BYTES = 16 * 1024 * 1024
export const DEFAULT_FULL_EVERY = 8

const SCORE_CACHE = 6

export class VersionHistory {
  readonly document: ScoreDocument
  readonly budgetBytes: number
  readonly totalBudgetBytes: number
  readonly fullEvery: number
  readonly author: Author
  private readonly storage: VersionStorage | null
  private readonly arbiter: Arbiter | null
  private readonly now: () => number
  private readonly makeId: () => string
  private readonly onError: (error: unknown) => void
  private readonly records: StoredVersion[] = []
  private readonly resolved = new Map<string, Score>()
  private readonly events = new Emitter<VersionEvent>()
  private readonly unsubscribe: () => void
  private queue: Promise<void> = Promise.resolve()
  private epoch = 0
  private counter = 0
  private revisionCount = 0
  private disposed = false

  constructor(document: ScoreDocument, options: VersionHistoryOptions = {}) {
    this.document = document
    this.storage = options.storage ?? null
    this.arbiter = options.arbiter ?? null
    this.now = options.now ?? (() => Date.now())
    this.makeId = options.id ?? (() => `${this.now().toString(36)}-${(this.counter++).toString(36)}`)
    this.budgetBytes = Math.max(0, options.budgetBytes ?? DEFAULT_VERSION_BUDGET_BYTES)
    this.totalBudgetBytes = Math.max(
      0,
      options.totalBudgetBytes ?? DEFAULT_VERSION_TOTAL_BUDGET_BYTES,
    )
    this.fullEvery = Math.max(1, options.fullEvery ?? DEFAULT_FULL_EVERY)
    this.author = options.author ?? document.author
    this.onError = options.onError ?? (() => {})
    const auto = options.autoCheckpoints ?? true
    this.unsubscribe = document.onChange((change) => {
      if (change.kind !== 'load') return
      this.epoch += 1
      if (auto) this.checkpoint('start')
    })
    if (auto) this.checkpoint('start')
  }

  // --- Reading -------------------------------------------------------------------------------

  /** Every version, oldest first. */
  get versions(): VersionSummary[] {
    return this.records.map(summarize)
  }

  /** Serialized bytes across every version. */
  get bytes(): number {
    return this.records.reduce((total, record) => total + record.bytes, 0)
  }

  /** Bumped on every event; a cheap "did anything change" for stores and hooks. */
  get revision(): number {
    return this.revisionCount
  }

  list(): VersionSummary[] {
    return this.versions
  }

  get(id: string): VersionSummary | undefined {
    const record = this.records.find((candidate) => candidate.id === id)
    return record ? summarize(record) : undefined
  }

  /** The document as it was at a version (replayed from the nearest full base). */
  scoreOf(id: string): Score {
    const cached = this.resolved.get(id)
    if (cached) return cached
    const chain: StoredVersion[] = []
    let cursor: StoredVersion | undefined = this.requireRecord(id)
    while (cursor && !cursor.score) {
      chain.unshift(cursor)
      const parent: string | null = cursor.parent
      cursor = parent === null ? undefined : this.record(parent)
    }
    if (!cursor?.score) throw new Error(`live-mix: version "${id}" has no full base to replay from`)
    let score: Score = cursor.score
    for (const link of chain) {
      if (!link.ops) throw new Error(`live-mix: version "${link.id}" kept neither a score nor its operations`)
      for (const stored of link.ops) score = apply(score, stored.op)
    }
    this.remember(id, score)
    return score
  }

  onChange(listener: VersionListener): () => void {
    return this.events.subscribe(listener)
  }

  private emit(event: VersionEvent): void {
    this.revisionCount += 1
    this.events.emit(event)
  }

  // --- Writing --------------------------------------------------------------------------------

  /** Snapshot the document now under `label`. */
  save(label: string, options: SaveOptions = {}): VersionSummary {
    if (this.disposed) throw new Error('live-mix: version history is disposed')
    const atMs = options.atMs ?? this.now()
    const score = this.document.score
    const seq = this.document.log.lastSeq
    const parent = this.records[this.records.length - 1]
    const ops = parent ? this.opsSince(parent, seq) : null
    const opsJson = ops ? JSON.stringify(ops) : null
    const deltaBytes = opsJson ? byteLength(opsJson) : Infinity
    const fullBytes = byteLength(serializeScore(score))
    const chain = parent ? this.chainLength(parent) : 0
    const keepOps = ops !== null && deltaBytes <= this.budgetBytes
    const full = !parent || !keepOps || deltaBytes >= fullBytes || chain + 1 >= this.fullEvery
    const record: StoredVersion = {
      format: VERSION_FORMAT,
      id: this.makeId(),
      label,
      kind: options.kind ?? 'manual',
      atMs,
      author: options.author ?? this.author,
      epoch: this.epoch,
      seq,
      parent: parent?.id ?? null,
      bytes: 0,
    }
    if (options.milestone !== undefined) record.milestone = options.milestone
    if (full) record.score = score
    if (keepOps && ops) record.ops = ops
    record.bytes = measure(record)
    this.records.push(record)
    this.remember(record.id, score)
    this.persist((storage) => storage.put(record))
    const summary = summarize(record)
    this.emit({ type: 'saved', version: summary })
    this.prune()
    return summary
  }

  /** An automatic version at a session milestone (`start`, `section`, `end`, or your own). */
  checkpoint(milestone: Milestone, label?: string, options: Omit<SaveOptions, 'kind' | 'milestone'> = {}): VersionSummary {
    return this.save(label ?? defaultLabel(milestone), { ...options, kind: 'auto', milestone })
  }

  /**
   * Bring the document back to a version as one undoable `score.replace`,
   * through the arbiter when one is bound (a held target defers it).
   */
  restore(id: string, options: RestoreOptions = {}): ArbiterResult {
    const record = this.requireRecord(id)
    const score = this.scoreOf(id)
    const op: Operation = { type: 'score.replace', score, label: options.label ?? `restore "${record.label}"` }
    const applyOptions = {
      author: options.author ?? this.author,
      atMs: options.atMs ?? this.now(),
      label: op.label,
    }
    let result: ArbiterResult
    if (this.arbiter) result = this.arbiter.apply(op, applyOptions)
    else {
      const entry: LogEntry = this.document.apply(op, applyOptions)
      result = { outcome: 'applied', entry, targets: ['*'] }
    }
    this.emit({ type: 'restored', version: summarize(record), result })
    return result
  }

  /**
   * Forget a version. A child that depended on it re-parents onto the
   * removed version's parent with the two slices joined, or — when the
   * removed one was a root — becomes a full base itself.
   */
  remove(id: string): boolean {
    const index = this.records.findIndex((candidate) => candidate.id === id)
    if (index < 0) return false
    const [record] = this.records.splice(index, 1)
    for (const child of this.records) {
      if (child.parent !== id) continue
      const joinable =
        record.parent !== null && record.ops !== undefined && child.ops !== undefined
      if (joinable) {
        child.ops = [...(record.ops ?? []), ...(child.ops ?? [])]
        child.parent = record.parent
      } else {
        if (!child.score) child.score = this.scoreOfRemoved(child, record)
        child.parent = null
      }
      child.bytes = measure(child)
      this.persist((storage) => storage.put(child))
    }
    this.resolved.delete(id)
    this.persist((storage) => storage.remove(id))
    this.emit({ type: 'removed', version: summarize(record) })
    return true
  }

  /** Field-level changes between two versions, plus the operations between them when known. */
  diff(fromId: string, toId: string): VersionDiff {
    const from = this.requireRecord(fromId)
    const to = this.requireRecord(toId)
    return {
      from: summarize(from),
      to: summarize(to),
      operations: this.operationsBetween(from, to),
      fields: diffScores(this.scoreOf(fromId), this.scoreOf(toId)),
    }
  }

  // --- Persistence ------------------------------------------------------------------------------

  /** Load what storage holds (merged with anything saved so far, by id), oldest first. */
  async open(): Promise<VersionSummary[]> {
    if (!this.storage) return this.versions
    const stored = await this.storage.list()
    const live = new Set(this.records.map((record) => record.id))
    const loaded: StoredVersion[] = []
    for (const raw of stored) {
      const record = parseStoredVersion(raw)
      if (record && !live.has(record.id)) loaded.push(record)
    }
    if (loaded.length > 0) {
      // Stored versions belong to earlier logs: live saves keep chaining among
      // themselves under a fresh epoch that none of the loaded ones share.
      const maxEpoch = loaded.reduce((max, record) => Math.max(max, record.epoch), this.epoch)
      const fresh = maxEpoch + 1
      for (const record of this.records) if (record.epoch === this.epoch) record.epoch = fresh
      this.epoch = fresh
      this.records.push(...loaded)
      this.records.sort((a, b) => a.atMs - b.atMs || a.seq - b.seq)
    }
    const versions = this.versions
    this.emit({ type: 'opened', versions })
    return versions
  }

  /** Resolves once every queued storage write has settled. */
  flush(): Promise<void> {
    return this.queue
  }

  /** Remove every version here and in storage. */
  clear(): void {
    const removed = this.records.splice(0)
    this.resolved.clear()
    this.persist((storage) => storage.clear())
    for (const record of removed) this.emit({ type: 'removed', version: summarize(record) })
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.unsubscribe()
    this.events.clear()
  }

  // --- Internals -------------------------------------------------------------------------------

  private record(id: string): StoredVersion | undefined {
    return this.records.find((candidate) => candidate.id === id)
  }

  private requireRecord(id: string): StoredVersion {
    const record = this.record(id)
    if (!record) throw new Error(`live-mix: no version "${id}"`)
    return record
  }

  private opsSince(parent: StoredVersion, seq: number): StoredOp[] | null {
    if (parent.epoch !== this.epoch || parent.seq > seq) return null
    return this.document.log.entries.slice(parent.seq, seq).map(toStoredOp)
  }

  /** Consecutive delta ancestors ending at `record` (0 when it is a full base). */
  private chainLength(record: StoredVersion): number {
    let length = 0
    let cursor: StoredVersion | undefined = record
    while (cursor && !cursor.score) {
      length += 1
      const parent: string | null = cursor.parent
      cursor = parent === null ? undefined : this.record(parent)
    }
    return length
  }

  private scoreOfRemoved(child: StoredVersion, removed: StoredVersion): Score {
    const cached = this.resolved.get(child.id)
    if (cached) return cached
    const base = this.resolved.get(removed.id) ?? removed.score ?? this.baseOf(removed)
    if (!child.ops) throw new Error(`live-mix: version "${child.id}" kept neither a score nor its operations`)
    let score = base
    for (const stored of child.ops) score = apply(score, stored.op)
    return score
  }

  /** The score of a record already spliced out (its parents are still present). */
  private baseOf(record: StoredVersion): Score {
    if (record.score) return record.score
    if (record.parent === null || !record.ops)
      throw new Error(`live-mix: version "${record.id}" has no full base to replay from`)
    let score = this.scoreOf(record.parent)
    for (const stored of record.ops) score = apply(score, stored.op)
    return score
  }

  private operationsBetween(from: StoredVersion, to: StoredVersion): StoredOp[] | null {
    if (from.id === to.id) return []
    if (from.epoch === this.epoch && to.epoch === this.epoch && from.seq <= to.seq) {
      const entries = this.document.log.entries
      if (to.seq <= entries.length) return entries.slice(from.seq, to.seq).map(toStoredOp)
    }
    const ops: StoredOp[] = []
    let cursor: StoredVersion | undefined = to
    while (cursor && cursor.id !== from.id) {
      if (!cursor.ops || cursor.parent === null) return null
      ops.unshift(...cursor.ops)
      cursor = this.record(cursor.parent)
    }
    return cursor ? ops : null
  }

  /** Oldest automatic checkpoints go first; named versions are never pruned, and the latest never is. */
  private prune(): void {
    if (this.totalBudgetBytes <= 0) return
    while (this.bytes > this.totalBudgetBytes && this.records.length > 1) {
      const victim = this.records.slice(0, -1).find((record) => record.kind === 'auto')
      if (!victim) return
      this.remove(victim.id)
    }
  }

  private remember(id: string, score: Score): void {
    this.resolved.set(id, score)
    if (this.resolved.size > SCORE_CACHE) {
      const oldest = this.resolved.keys().next().value
      if (oldest !== undefined) this.resolved.delete(oldest)
    }
  }

  private persist(run: (storage: VersionStorage) => Promise<void>): void {
    const storage = this.storage
    if (!storage) return
    this.queue = this.queue
      .then(() => run(storage))
      .catch((error: unknown) => {
        this.onError(error)
      })
  }
}

function summarize(record: StoredVersion): VersionSummary {
  const summary: VersionSummary = {
    id: record.id,
    label: record.label,
    kind: record.kind,
    atMs: record.atMs,
    author: record.author,
    seq: record.seq,
    parent: record.parent,
    base: record.score ? 'full' : 'delta',
    opCount: record.ops ? record.ops.length : null,
    bytes: record.bytes,
  }
  if (record.milestone !== undefined) summary.milestone = record.milestone
  return summary
}

function toStoredOp(entry: LogEntry): StoredOp {
  const stored: StoredOp = {
    seq: entry.seq,
    op: entry.op,
    author: entry.author,
    atMs: entry.atMs,
    kind: entry.kind,
  }
  if (entry.label !== undefined) stored.label = entry.label
  return stored
}

function defaultLabel(milestone: Milestone): string {
  switch (milestone) {
    case 'start':
      return 'Session start'
    case 'section':
      return 'Section change'
    case 'end':
      return 'Session end'
    default:
      return milestone
  }
}

/** Validate a stored record; malformed ones are skipped on `open`. */
export function parseStoredVersion(raw: unknown): StoredVersion | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Partial<StoredVersion>
  if (
    value.format !== VERSION_FORMAT ||
    typeof value.id !== 'string' ||
    typeof value.label !== 'string' ||
    (value.kind !== 'manual' && value.kind !== 'auto') ||
    typeof value.atMs !== 'number' ||
    typeof value.epoch !== 'number' ||
    typeof value.seq !== 'number' ||
    !value.author ||
    typeof value.author.id !== 'string'
  ) {
    return null
  }
  const record: StoredVersion = {
    format: VERSION_FORMAT,
    id: value.id,
    label: value.label,
    kind: value.kind,
    atMs: value.atMs,
    author: { id: value.author.id, kind: value.author.kind },
    epoch: value.epoch,
    seq: value.seq,
    parent: typeof value.parent === 'string' ? value.parent : null,
    bytes: typeof value.bytes === 'number' ? value.bytes : 0,
  }
  if (typeof value.milestone === 'string') record.milestone = value.milestone
  if (value.score !== undefined) {
    try {
      record.score = parseScore(value.score)
    } catch {
      return null
    }
  }
  if (Array.isArray(value.ops)) {
    const ops: StoredOp[] = []
    for (const stored of value.ops) {
      if (!stored || typeof stored !== 'object' || !isOperation((stored as StoredOp).op)) return null
      ops.push(stored as StoredOp)
    }
    record.ops = ops
  }
  if (!record.score && !record.ops) return null
  if (record.bytes === 0) record.bytes = measure(record)
  return record
}

/** The record's serialized size including its own `bytes` field (a second pass settles the digit count). */
function measure(record: StoredVersion): number {
  record.bytes = byteLength(JSON.stringify(record))
  return byteLength(JSON.stringify(record))
}
