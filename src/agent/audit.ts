// The agent audit trail: one entry per `call`, whatever its outcome. Score
// operations an entry applied are also in the `OperationLog` (with the same
// author) — the entry keeps their sequence numbers and inverses so a call can
// be undone as a unit and the transcript can cross-reference both logs.

import { type Author } from '../score/log'
import { type Operation } from '../score/operations'
import { type AppliedOperation, type RailNote, type ToolErrorCode } from './types'

export type AuditOutcome = 'applied' | 'rejected' | 'dry-run'

export interface AuditEntry {
  callId: number
  atMs: number
  author: Author
  tool: string
  args: Record<string, unknown>
  outcome: AuditOutcome
  /** The failure code when `rejected`. */
  code?: ToolErrorCode
  rails: RailNote[]
  operations: AppliedOperation[]
  /** Inverses of `operations`, in application order (reverse them to undo). */
  inverses: Operation[]
  result?: Record<string, unknown>
  message?: string
  /** One line for the model: what happened. */
  summary: string
  /** Set when a later `undo` reverted this call; `isUndone` says whether that undo still stands. */
  undoneBy?: number
  /** Writes of this call still waiting behind a hold; they join `operations` when they land. */
  waiting?: number
}

export class AgentAuditLog {
  private readonly list: AuditEntry[] = []
  private readonly limit: number

  /** Keeps at most `limit` entries in memory (oldest dropped); default 500. */
  constructor(limit = 500) {
    this.limit = Math.max(1, limit)
  }

  get entries(): readonly AuditEntry[] {
    return this.list
  }

  get length(): number {
    return this.list.length
  }

  /** The most recent call id (0 when empty). */
  get cursor(): number {
    return this.list.length ? this.list[this.list.length - 1].callId : 0
  }

  append(entry: AuditEntry): AuditEntry {
    this.list.push(entry)
    if (this.list.length > this.limit) this.list.splice(0, this.list.length - this.limit)
    return entry
  }

  find(callId: number): AuditEntry | undefined {
    return this.list.find((entry) => entry.callId === callId)
  }

  /** Entries with a call id greater than `cursor`, oldest first. */
  since(cursor: number): AuditEntry[] {
    return this.list.filter((entry) => entry.callId > cursor)
  }

  /** The latest `count` entries, oldest first. */
  recent(count: number): AuditEntry[] {
    return this.list.slice(Math.max(0, this.list.length - count))
  }

  /**
   * Whether an `undo` took this call back and that undo still stands. An undo
   * that was itself undone took nothing back in the end: the call it named is
   * applied again, and is not stepped over as one already undone.
   */
  isUndone(entry: AuditEntry): boolean {
    if (entry.undoneBy === undefined) return false
    const by = this.find(entry.undoneBy)
    return by === undefined || !this.isUndone(by)
  }

  /**
   * The last applied (not undone) call by `author` that changed the score, skipping
   * `excludeTools`. A call with a write still waiting counts: it is not stepped over.
   */
  lastApplied(author?: Author, excludeTools: readonly string[] = ['undo']): AuditEntry | undefined {
    for (let index = this.list.length - 1; index >= 0; index -= 1) {
      const entry = this.list[index]
      if (entry.outcome !== 'applied' || this.isUndone(entry)) continue
      if (entry.operations.length === 0 && !entry.waiting) continue
      if (excludeTools.includes(entry.tool)) continue
      if (author && (entry.author.id !== author.id || entry.author.kind !== author.kind)) continue
      return entry
    }
    return undefined
  }

  toJSON(): AuditEntry[] {
    return [...this.list]
  }
}
