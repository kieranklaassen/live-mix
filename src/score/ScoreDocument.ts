// The stateful editor around an immutable `Score`: applies operations,
// records them in the `OperationLog`, keeps undo/redo in `History`, and
// notifies listeners (a `ScoreRenderer`, a UI store) after every change.
// Everything that edits a score — a UI, the agent API, a planner — goes
// through `apply`, so the log is complete and the graph can follow.

import { History, type HistoryEntry, type HistoryOptions } from './history'
import {
  LOCAL_AUTHOR,
  OperationLog,
  type Author,
  type LogEntry,
  type OperationLogOptions,
} from './log'
import { applyWithInverse, type Operation } from './operations'
import {
  createScore,
  parseScore,
  serializeScore,
  type Score,
  type ValidateScoreOptions,
} from './schema'

export type ScoreChangeKind = 'apply' | 'undo' | 'redo' | 'load'

export interface ScoreChange {
  kind: ScoreChangeKind
  score: Score
  previous: Score
  /** The log entry the change produced; absent for `load`. */
  entry?: LogEntry
}

export type ScoreListener = (change: ScoreChange) => void

export interface ApplyOptions {
  /** Who is editing; defaults to the document's author. */
  author?: Author
  /** Wall-clock time; defaults to the document's `now()`. */
  atMs?: number
  /** Continuous-gesture id: same-key operations with the same id form one undo step. */
  gesture?: string
  label?: string
}

export interface ScoreDocumentOptions extends HistoryOptions, OperationLogOptions {
  /** Default author for `apply`, `undo` and `redo`. */
  author?: Author
  /** Wall clock in milliseconds. Default `Date.now`. */
  now?: () => number
}

export class ScoreDocument {
  readonly author: Author
  readonly history: History
  private current: Score
  private currentLog: OperationLog
  private readonly now: () => number
  private readonly logOptions: OperationLogOptions
  private readonly listeners = new Set<ScoreListener>()

  constructor(score: Score = createScore(), options: ScoreDocumentOptions = {}) {
    this.author = options.author ?? LOCAL_AUTHOR
    this.now = options.now ?? (() => Date.now())
    this.logOptions = { checkpointEvery: options.checkpointEvery }
    this.history = new History(options)
    this.current = score
    this.currentLog = new OperationLog(score, this.logOptions)
  }

  /** The current document. Immutable: every change yields a new object. */
  get score(): Score {
    return this.current
  }

  get log(): OperationLog {
    return this.currentLog
  }

  get canUndo(): boolean {
    return this.history.canUndo
  }

  get canRedo(): boolean {
    return this.history.canRedo
  }

  /** Apply one operation: score, log, history, listeners. Throws `ScoreOperationError`. */
  apply(op: Operation, options: ApplyOptions = {}): LogEntry {
    const previous = this.current
    const { score, inverse } = applyWithInverse(previous, op)
    const author = options.author ?? this.author
    const atMs = options.atMs ?? this.now()
    const entry = this.currentLog.append(
      withOptional({ op, inverse, author, atMs, kind: 'apply' }, options),
      score,
    )
    this.history.push({
      seq: entry.seq,
      op,
      inverse,
      author,
      atMs,
      gesture: options.gesture,
      label: options.label,
    })
    this.current = score
    this.emit({ kind: 'apply', score, previous, entry })
    return entry
  }

  /** Undo the latest step (a whole gesture at once); null when there is nothing to undo. */
  undo(options: Pick<ApplyOptions, 'author' | 'atMs'> = {}): LogEntry | null {
    const step = this.history.takeUndo()
    if (!step) return null
    return this.replay(step, step.inverse, 'undo', options)
  }

  /** Redo the latest undone step; null when there is nothing to redo. */
  redo(options: Pick<ApplyOptions, 'author' | 'atMs'> = {}): LogEntry | null {
    const step = this.history.takeRedo()
    if (!step) return null
    return this.replay(step, step.op, 'redo', options)
  }

  /** End the current continuous gesture: the next operation starts a new undo step. */
  endGesture(): void {
    this.history.seal()
  }

  /**
   * Replace the document (a file opened, a planner's arrangement). Starts a
   * fresh log from the loaded score and clears the history.
   */
  load(input: Score | string, options: ValidateScoreOptions = {}): void {
    const previous = this.current
    const score = typeof input === 'string' ? parseScore(input, options) : input
    this.current = score
    this.currentLog = new OperationLog(score, this.logOptions)
    this.history.clear()
    this.emit({ kind: 'load', score, previous })
  }

  serialize(): string {
    return serializeScore(this.current)
  }

  onChange(listener: ScoreListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** A document from `serializeScore` output. */
  static parse(
    json: string,
    options: ScoreDocumentOptions & ValidateScoreOptions = {},
  ): ScoreDocument {
    return new ScoreDocument(parseScore(json, { devices: options.devices }), options)
  }

  private replay(
    step: HistoryEntry,
    op: Operation,
    kind: 'undo' | 'redo',
    options: Pick<ApplyOptions, 'author' | 'atMs'>,
  ): LogEntry {
    const previous = this.current
    const { score, inverse } = applyWithInverse(previous, op)
    const entry = this.currentLog.append(
      {
        op,
        inverse,
        author: options.author ?? this.author,
        atMs: options.atMs ?? this.now(),
        kind,
        ref: kind === 'undo' ? step.seq : step.lastSeq,
        label: `${kind} ${step.label}`,
      },
      score,
    )
    this.current = score
    this.emit({ kind, score, previous, entry })
    return entry
  }

  private emit(change: ScoreChange): void {
    for (const listener of [...this.listeners]) listener(change)
  }
}

function withOptional(entry: Omit<LogEntry, 'seq'>, options: ApplyOptions): Omit<LogEntry, 'seq'> {
  if (options.gesture !== undefined) entry.gesture = options.gesture
  if (options.label !== undefined) entry.label = options.label
  return entry
}
