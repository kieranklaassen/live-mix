// Undo and redo over the operation log. `History` keeps two stacks of
// entries; each undo step applies one stored inverse, each redo re-applies
// the stored operation. The stacks index into the log rather than replace
// it, so undoing never loses the transcript.
//
// Granularity for continuous gestures (the question the plan left open):
// one undo step per gesture. A fader drag, a knob turn, a clip drag or a
// lane paint stroke emits many operations of the same `coalesceKey`; the
// history folds consecutive same-key operations from the same author into
// one entry while they belong to the same gesture — either the caller tags
// them with a `gesture` id (pointer-down to pointer-up) or, without tags,
// while they arrive within `coalesceWindowMs` (default 500 ms) of each
// other. The entry keeps the *first* inverse and the *latest* operation, so
// undo lands where the hand started and redo where it let go. Discrete edits
// (add, remove, route, mute, preset) never coalesce. The log still records
// every intermediate operation.

import { type Author } from './log'
import { coalesceKey, describeOperation, type Operation } from './operations'

export interface HistoryEntry {
  /** Log seq of the first operation folded into this step. */
  seq: number
  /** Log seq of the last one. */
  lastSeq: number
  /** The latest operation — what redo applies. */
  op: Operation
  /** The first inverse — what undo applies. */
  inverse: Operation
  author: Author
  atMs: number
  lastAtMs: number
  key: string | null
  gesture?: string
  label: string
  /** Operations folded into this step. */
  count: number
}

export interface HistoryPush {
  seq: number
  op: Operation
  inverse: Operation
  author: Author
  atMs: number
  gesture?: string
  label?: string
}

export interface HistoryOptions {
  /** Untagged same-key operations closer than this fold into one step. Default 500. */
  coalesceWindowMs?: number
  /** Undo depth; the oldest steps fall off. Default 500. */
  limit?: number
}

export const DEFAULT_COALESCE_WINDOW_MS = 500
export const DEFAULT_HISTORY_LIMIT = 500

export class History {
  readonly coalesceWindowMs: number
  readonly limit: number
  private readonly undoList: HistoryEntry[] = []
  private readonly redoList: HistoryEntry[] = []
  private sealed = false

  constructor(options: HistoryOptions = {}) {
    this.coalesceWindowMs = Math.max(0, options.coalesceWindowMs ?? DEFAULT_COALESCE_WINDOW_MS)
    this.limit = Math.max(1, options.limit ?? DEFAULT_HISTORY_LIMIT)
  }

  get undoStack(): readonly HistoryEntry[] {
    return this.undoList
  }

  get redoStack(): readonly HistoryEntry[] {
    return this.redoList
  }

  get canUndo(): boolean {
    return this.undoList.length > 0
  }

  get canRedo(): boolean {
    return this.redoList.length > 0
  }

  /** The step `undo()` would take next. */
  peekUndo(): HistoryEntry | undefined {
    return this.undoList[this.undoList.length - 1]
  }

  peekRedo(): HistoryEntry | undefined {
    return this.redoList[this.redoList.length - 1]
  }

  /**
   * Record an applied operation as a new step, or fold it into the current
   * one when the coalescing rule says so. Clears the redo stack.
   */
  push(push: HistoryPush): HistoryEntry {
    this.redoList.length = 0
    const key = coalesceKey(push.op)
    const top = this.undoList[this.undoList.length - 1]
    if (top && !this.sealed && this.coalesces(top, push, key)) {
      top.op = push.op
      top.lastSeq = push.seq
      top.lastAtMs = push.atMs
      top.count += 1
      top.label = push.label ?? describeOperation(push.op)
      return top
    }
    this.sealed = false
    const entry: HistoryEntry = {
      seq: push.seq,
      lastSeq: push.seq,
      op: push.op,
      inverse: push.inverse,
      author: push.author,
      atMs: push.atMs,
      lastAtMs: push.atMs,
      key,
      label: push.label ?? describeOperation(push.op),
      count: 1,
    }
    if (push.gesture !== undefined) entry.gesture = push.gesture
    this.undoList.push(entry)
    if (this.undoList.length > this.limit)
      this.undoList.splice(0, this.undoList.length - this.limit)
    return entry
  }

  /** Pop the step to undo and park it for redo; the caller applies `entry.inverse`. */
  takeUndo(): HistoryEntry | undefined {
    const entry = this.undoList.pop()
    if (!entry) return undefined
    this.redoList.push(entry)
    this.sealed = true
    return entry
  }

  /** Pop the step to redo and put it back on the undo stack; the caller applies `entry.op`. */
  takeRedo(): HistoryEntry | undefined {
    const entry = this.redoList.pop()
    if (!entry) return undefined
    this.undoList.push(entry)
    this.sealed = true
    return entry
  }

  /**
   * End the current gesture: the next operation starts a new step even if it
   * would otherwise coalesce (pointer-up, key-up, an agent turn boundary).
   */
  seal(): void {
    this.sealed = true
  }

  clear(): void {
    this.undoList.length = 0
    this.redoList.length = 0
    this.sealed = false
  }

  private coalesces(top: HistoryEntry, push: HistoryPush, key: string | null): boolean {
    if (key === null || top.key !== key) return false
    if (top.author.id !== push.author.id) return false
    if (top.gesture !== undefined || push.gesture !== undefined) {
      return top.gesture !== undefined && top.gesture === push.gesture
    }
    return push.atMs - top.lastAtMs <= this.coalesceWindowMs
  }
}
