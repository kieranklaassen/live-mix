// The operation log: an append-only record of every operation applied to a
// document, with who did it and when (KTD8). Undo and redo append too — the
// log never rewinds — so it is a complete transcript for feedback loops
// (R27) and, replayed from a checkpoint, reconstructs the score at any
// point. Checkpoints are full score snapshots taken every N entries so
// `scoreAt(seq)` never replays more than N operations.

import { apply, isOperation, type Operation } from './operations'
import { parseScore, type Score } from './schema'

export type AuthorKind = 'human' | 'agent' | 'system'

export interface Author {
  id: string
  kind: AuthorKind
}

export const LOCAL_AUTHOR: Author = { id: 'local', kind: 'human' }

export type LogEntryKind = 'apply' | 'undo' | 'redo'

export interface LogEntry {
  /** 1-based, dense. Checkpoint 0 is the initial score. */
  seq: number
  /** What was applied — for undo/redo entries, the inverse/original of `ref`. */
  op: Operation
  inverse: Operation
  author: Author
  /** Wall-clock milliseconds. */
  atMs: number
  kind: LogEntryKind
  /** For `undo`/`redo`: the `seq` of the entry being undone or redone. */
  ref?: number
  /** Continuous-gesture id the operation belonged to, when the caller gave one. */
  gesture?: string
  label?: string
}

export interface LogCheckpoint {
  /** The score after entry `seq` (0 = before any entry). */
  seq: number
  score: Score
}

export const LOG_FORMAT_VERSION = 1

export interface SerializedLog {
  format: typeof LOG_FORMAT_VERSION
  entries: LogEntry[]
  checkpoints: LogCheckpoint[]
}

export interface OperationLogOptions {
  /** Snapshot the score every this many entries. Default 50. */
  checkpointEvery?: number
}

export const DEFAULT_CHECKPOINT_EVERY = 50

export class OperationLog {
  readonly checkpointEvery: number
  private readonly entryList: LogEntry[] = []
  private readonly checkpointList: LogCheckpoint[]

  constructor(initial: Score, options: OperationLogOptions = {}) {
    this.checkpointEvery = Math.max(1, options.checkpointEvery ?? DEFAULT_CHECKPOINT_EVERY)
    this.checkpointList = [{ seq: 0, score: initial }]
  }

  get entries(): readonly LogEntry[] {
    return this.entryList
  }

  get checkpoints(): readonly LogCheckpoint[] {
    return this.checkpointList
  }

  get length(): number {
    return this.entryList.length
  }

  /** Sequence number of the last entry (0 when empty). */
  get lastSeq(): number {
    return this.entryList.length
  }

  /** The score before any entry. */
  get initial(): Score {
    return this.checkpointList[0].score
  }

  /**
   * Record an applied operation. `after` is the score it produced; a
   * checkpoint is taken when the interval is reached.
   */
  append(entry: Omit<LogEntry, 'seq'>, after: Score): LogEntry {
    const seq = this.entryList.length + 1
    const stored: LogEntry = { ...entry, seq }
    this.entryList.push(stored)
    if (seq % this.checkpointEvery === 0) this.checkpointList.push({ seq, score: after })
    return stored
  }

  /** Force a checkpoint of the score after the last entry. */
  checkpoint(after: Score): void {
    const seq = this.lastSeq
    const last = this.checkpointList[this.checkpointList.length - 1]
    if (last.seq === seq) return
    this.checkpointList.push({ seq, score: after })
  }

  entry(seq: number): LogEntry | undefined {
    return this.entryList[seq - 1]
  }

  /** Entries after `seq`, oldest first. */
  since(seq: number): LogEntry[] {
    return this.entryList.slice(Math.max(0, seq))
  }

  /** The score after entry `seq`, replayed from the nearest earlier checkpoint. */
  scoreAt(seq: number): Score {
    if (!Number.isInteger(seq) || seq < 0 || seq > this.lastSeq) {
      throw new RangeError(`live-mix: log has no entry ${seq} (0..${this.lastSeq})`)
    }
    let checkpoint = this.checkpointList[0]
    for (const candidate of this.checkpointList) {
      if (candidate.seq <= seq) checkpoint = candidate
      else break
    }
    let score = checkpoint.score
    for (let index = checkpoint.seq; index < seq; index += 1) {
      score = apply(score, this.entryList[index].op)
    }
    return score
  }

  toJSON(): SerializedLog {
    return {
      format: LOG_FORMAT_VERSION,
      entries: [...this.entryList],
      checkpoints: [...this.checkpointList],
    }
  }

  /** Rebuild a log from `toJSON()` output; entries and checkpoints are validated. */
  static fromJSON(input: unknown, options: OperationLogOptions = {}): OperationLog {
    const value: unknown = typeof input === 'string' ? JSON.parse(input) : input
    if (
      typeof value !== 'object' ||
      value === null ||
      (value as SerializedLog).format !== LOG_FORMAT_VERSION ||
      !Array.isArray((value as SerializedLog).entries) ||
      !Array.isArray((value as SerializedLog).checkpoints)
    ) {
      throw new Error(`live-mix: unsupported operation log (expected format ${LOG_FORMAT_VERSION})`)
    }
    const serialized = value as SerializedLog
    const first = serialized.checkpoints[0]
    if (first?.seq !== 0) throw new Error('live-mix: operation log needs checkpoint 0')
    const log = new OperationLog(parseScore(first.score), options)
    serialized.entries.forEach((entry, index) => {
      if (entry.seq !== index + 1 || !isOperation(entry.op) || !isOperation(entry.inverse)) {
        throw new Error(`live-mix: malformed log entry at ${index}`)
      }
      log.entryList.push({ ...entry })
    })
    log.checkpointList.length = 1
    for (const checkpoint of serialized.checkpoints.slice(1)) {
      if (checkpoint.seq < 1 || checkpoint.seq > log.lastSeq) {
        throw new Error(`live-mix: checkpoint ${checkpoint.seq} is outside the log`)
      }
      log.checkpointList.push({ seq: checkpoint.seq, score: parseScore(checkpoint.score) })
    }
    return log
  }
}

export function serializeLog(log: OperationLog): string {
  return JSON.stringify(log.toJSON())
}

export function parseLog(input: unknown, options: OperationLogOptions = {}): OperationLog {
  return OperationLog.fromJSON(input, options)
}
