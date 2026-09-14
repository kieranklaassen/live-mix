// The arbiter (U30, R29): one gate in front of `ScoreDocument.apply` that
// every writer — the UI's hooks, a MIDI/OSC surface, the agent, automation,
// the rails — goes through, so competing writes to the same target within a
// window resolve by the policy in `core/params/arbitration.ts` instead of by
// arrival order. A human write takes a touch hold on its targets; an agent
// write into a held target waits (latest per target) and lands when the
// hold lapses; automation drops and its lane writer stays overridden until
// the hold ends; a system write always lands. Every decision is an event so
// a UI can show "held by you" and "coach pending".
//
// Targets are string keys derived from the operation (`arbiterTargets`):
// parameter keys are `targetKey(ParamTarget)` so lanes, routes and the
// renderer agree; structural edits key on the entity and conflict with holds
// on anything under it (`strip:music` vs `strip:music:level`).

import { type Device } from '../core/devices/Device'
import { Emitter } from '../core/events'
import {
  HoldTable,
  decide,
  resolvePolicy,
  sameOwner,
  type ArbitrationPolicy,
  type ArbitrationPolicyOptions,
  type Hold,
  type HoldOwner,
  type Lock,
} from '../core/params/arbitration'
import { type Author, type LogEntry } from './log'
import { type Operation } from './operations'
import { MASTER_OWNER, targetKey, type ParamTarget, type Score } from './schema'
import { type ApplyOptions, type ScoreDocument } from './ScoreDocument'
import { type ScoreRenderer } from './ScoreRenderer'

type TimerId = unknown

interface Holder {
  owner: HoldOwner
  source: 'lock' | 'hold'
  target: string
}

export interface ArbiterOptions extends ArbitrationPolicyOptions {
  /** Wall clock in milliseconds; defaults to `Date.now`. */
  now?: () => number
  /** Timer used to lapse holds on time (deferred writes land without another write). Default `setTimeout`. */
  setTimeoutFn?: (callback: () => void, ms: number) => TimerId
  clearTimeoutFn?: (id: TimerId) => void
  /** The renderer following the document: its lane writers are overridden around a touch. */
  renderer?: ScoreRenderer
  /** Default author for `apply`, `touch` and `lock`; defaults to the document's. */
  author?: Author
}

export type ArbiterOutcome = 'applied' | 'deferred' | 'dropped'

export type DropReason = 'held' | 'locked' | 'stale' | 'superseded' | 'failed' | 'cancelled'

export interface PendingWrite {
  ticket: number
  op: Operation
  author: Author
  /** When the write was requested. */
  atMs: number
  targets: string[]
  /** Who held the target when the write was deferred. */
  holder: HoldOwner
  label?: string
  gesture?: string
}

export interface ArbiterResult {
  outcome: ArbiterOutcome
  /** The log entry, when applied. */
  entry?: LogEntry
  targets: string[]
  /** The holder that decided a deferral or drop. */
  holder?: HoldOwner
  reason?: DropReason
  /** The pending write's id, when deferred (`cancel(ticket)`). */
  ticket?: number
}

export type ArbiterEvent =
  /** A hold placed, refreshed, released to its timer, or taken over. */
  | { type: 'held'; hold: Hold }
  /** A hold gone: lapsed, cleared, or taken by another writer. */
  | { type: 'freed'; hold: Hold; reason: 'expired' | 'cleared' | 'taken' }
  | { type: 'locked'; lock: Lock }
  | { type: 'unlocked'; lock: Lock; reason: 'expired' | 'unlocked' }
  | { type: 'deferred'; pending: PendingWrite }
  /** A deferred write applied once its targets freed. */
  | { type: 'landed'; pending: PendingWrite; entry: LogEntry }
  | {
      type: 'dropped'
      op: Operation
      author: Author
      targets: string[]
      reason: DropReason
      holder?: HoldOwner
      /** The pending write this drop retired, when it was deferred first. */
      ticket?: number
    }
  /** A lane writer paused under a hand. */
  | { type: 'overridden'; target: string }
  /** A lane writer handed back. */
  | { type: 'resumed'; target: string }

export type ArbiterListener = (event: ArbiterEvent) => void

export interface TargetState {
  key: string
  hold: Hold | null
  lock: Lock | null
  /** The holder that would decide an incoming write right now (a lock or hold on this key or above it). */
  holder: HoldOwner | null
  pending: PendingWrite[]
  /** True while the target's lane writer is overridden by a hand. */
  overridden: boolean
}

export interface LockOptions {
  author?: Author
  /** Lifetime; omitted or non-finite means until `unlock`. */
  ttlMs?: number
  reason?: string
}

/** Every key: a `score.replace` conflicts with any hold. */
export const ANY_TARGET = '*'

export class Arbiter {
  readonly document: ScoreDocument
  readonly policy: ArbitrationPolicy
  readonly author: Author
  private readonly renderer: ScoreRenderer | null
  private readonly now: () => number
  private readonly setTimeoutFn: (callback: () => void, ms: number) => TimerId
  private readonly clearTimeoutFn: (id: TimerId) => void
  private readonly table: HoldTable
  private readonly pendingList: PendingWrite[] = []
  private readonly overriddenKeys = new Set<string>()
  private readonly events = new Emitter<ArbiterEvent>()
  private readonly unsubscribeDocument: () => void
  private timer: TimerId | null = null
  private nextTicket = 1
  private revisionCount = 0
  private disposed = false

  constructor(document: ScoreDocument, options: ArbiterOptions = {}) {
    this.document = document
    this.policy = resolvePolicy(options)
    this.author = options.author ?? document.author
    this.renderer = options.renderer ?? null
    this.now = options.now ?? (() => Date.now())
    this.setTimeoutFn = options.setTimeoutFn ?? ((callback, ms) => setTimeout(callback, ms))
    this.clearTimeoutFn = options.clearTimeoutFn ?? ((id) => clearTimeout(id as number))
    this.table = new HoldTable({ holdMs: this.policy.holdMs })
    this.unsubscribeDocument = document.onChange((change) => {
      if (change.kind === 'load') this.reset()
    })
  }

  // --- Reading -------------------------------------------------------------------------------

  get score(): Score {
    return this.document.score
  }

  /** Bumped on every event; a cheap "did anything change" for stores and hooks. */
  get revision(): number {
    return this.revisionCount
  }

  /** The score device instance id behind a live device, when a renderer is bound. */
  deviceIdFor(device: Device): string | undefined {
    return this.renderer?.deviceIdFor(device)
  }

  holds(): Hold[] {
    return this.table.holds
  }

  locks(): Lock[] {
    return this.table.locks
  }

  pending(): PendingWrite[] {
    return [...this.pendingList]
  }

  /** What a UI shows next to a control: who holds it, what waits on it. */
  stateOf(target: ParamTarget | string, atMs = this.now()): TargetState {
    const key = arbiterKey(target)
    return {
      key,
      hold: this.table.holdOf(key) ?? null,
      lock: this.table.lockOf(key) ?? null,
      holder: this.holderFor(key, atMs, null)?.owner ?? null,
      pending: this.pendingList.filter((pending) => pending.targets.some((t) => conflicts(t, key))),
      overridden: this.overriddenKeys.has(key),
    }
  }

  onChange(listener: ArbiterListener): () => void {
    return this.events.subscribe(listener)
  }

  private emit(event: ArbiterEvent): void {
    this.revisionCount += 1
    this.events.emit(event)
  }

  // --- Writing --------------------------------------------------------------------------------

  /** Apply through the policy: lands, waits, or is refused with a reason. Throws only what `document.apply` throws. */
  apply(op: Operation, options: ApplyOptions = {}): ArbiterResult {
    const atMs = options.atMs ?? this.now()
    this.tick(atMs)
    const author = options.author ?? this.author
    const targets = arbiterTargets(op)
    const holder = this.strongestHolder(targets, atMs, author)
    const decision = decide(this.policy, author.kind, holder?.owner.kind ?? null)
    switch (decision) {
      case 'apply': {
        const entry = this.document.apply(op, { ...options, author, atMs })
        this.afterWrite(op, targets, author, atMs)
        return { outcome: 'applied', entry, targets }
      }
      case 'defer': {
        if (!holder) throw new Error('live-mix: arbiter deferred a free target')
        const pending = this.defer(op, targets, author, atMs, holder.owner, options)
        return { outcome: 'deferred', targets, holder: holder.owner, ticket: pending.ticket }
      }
      case 'drop': {
        if (!holder) throw new Error('live-mix: arbiter dropped a free target')
        const reason: DropReason = holder.source === 'lock' ? 'locked' : 'held'
        this.emit({ type: 'dropped', op, author, targets, reason, holder: holder.owner })
        return { outcome: 'dropped', targets, holder: holder.owner, reason }
      }
      default: {
        const exhaustive: never = decision
        return exhaustive
      }
    }
  }

  /** A pointer down: hold the target open-ended (no writes needed) until `release`. */
  touch(target: ParamTarget | string, author: Author = this.author, atMs = this.now()): Hold {
    this.tick(atMs)
    const key = arbiterKey(target)
    const previous = this.table.holdOf(key)
    if (previous && !sameOwner(previous.owner, author))
      this.emit({ type: 'freed', hold: previous, reason: 'taken' })
    const hold = this.table.touch(key, author, atMs)
    this.overrideLane(key)
    this.emit({ type: 'held', hold })
    this.schedule()
    return hold
  }

  /**
   * A pointer up: the hold runs its timer from now. Without a target, every
   * hold the author has in hand is released.
   */
  release(target?: ParamTarget | string, author: Author = this.author, atMs = this.now()): void {
    this.tick(atMs)
    const keys =
      target === undefined
        ? this.table.holds
            .filter((hold) => hold.touching && sameOwner(hold.owner, author))
            .map((hold) => hold.target)
        : [arbiterKey(target)]
    for (const key of keys) {
      const hold = this.table.release(key, atMs, author)
      if (hold) this.emit({ type: 'held', hold })
    }
    this.schedule()
  }

  /** Drop a hold now regardless of its timer (a UI "let go" button). */
  clearHold(target: ParamTarget | string, atMs = this.now()): void {
    const key = arbiterKey(target)
    const hold = this.table.clear(key)
    if (!hold) return
    this.emit({ type: 'freed', hold, reason: 'cleared' })
    this.afterFree(key)
    this.flush(atMs)
    this.schedule()
  }

  /** Lock a target: writers ranked below the lock's author are refused until it lifts. */
  lock(target: ParamTarget | string, options: LockOptions = {}): Lock {
    const atMs = this.now()
    const author = options.author ?? this.author
    const untilMs =
      options.ttlMs !== undefined && Number.isFinite(options.ttlMs)
        ? atMs + Math.max(0, options.ttlMs)
        : Infinity
    const lock = this.table.lock(arbiterKey(target), author, untilMs, options.reason)
    this.emit({ type: 'locked', lock })
    this.schedule()
    return lock
  }

  unlock(target: ParamTarget | string): void {
    const lock = this.table.unlock(arbiterKey(target))
    if (!lock) return
    this.emit({ type: 'unlocked', lock, reason: 'unlocked' })
    this.flush(this.now())
    this.schedule()
  }

  /** Retire a deferred write before it lands. */
  cancel(ticket: number): boolean {
    const index = this.pendingList.findIndex((pending) => pending.ticket === ticket)
    if (index < 0) return false
    const [pending] = this.pendingList.splice(index, 1)
    this.emit({
      type: 'dropped',
      op: pending.op,
      author: pending.author,
      targets: pending.targets,
      reason: 'cancelled',
      ticket,
    })
    return true
  }

  /** Hand a lane-bound target back to its writer now (the `manual` resume policy, or an early hand-back). */
  releaseAutomation(target?: ParamTarget | string): void {
    const keys = target === undefined ? [...this.overriddenKeys] : [arbiterKey(target)]
    for (const key of keys) this.resumeLane(key)
  }

  /**
   * Lapse what has expired by `atMs`, resume lanes, land deferred writes
   * whose targets freed. Called by every `apply`, by the timer, and by tests
   * with an injected clock.
   */
  tick(atMs = this.now()): void {
    if (this.disposed) return
    const { holds, locks } = this.table.expire(atMs)
    for (const hold of holds) {
      this.emit({ type: 'freed', hold, reason: 'expired' })
      this.afterFree(hold.target)
    }
    for (const lock of locks) this.emit({ type: 'unlocked', lock, reason: 'expired' })
    if (holds.length > 0 || locks.length > 0) {
      this.flush(atMs)
      this.schedule()
    }
  }

  // --- Document pass-throughs ------------------------------------------------------------

  undo(options?: Pick<ApplyOptions, 'author' | 'atMs'>): LogEntry | null {
    return this.document.undo(options)
  }

  redo(options?: Pick<ApplyOptions, 'author' | 'atMs'>): LogEntry | null {
    return this.document.redo(options)
  }

  endGesture(): void {
    this.document.endGesture()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.unsubscribeDocument()
    if (this.timer !== null) this.clearTimeoutFn(this.timer)
    this.timer = null
    this.table.reset()
    this.pendingList.length = 0
    this.overriddenKeys.clear()
    this.events.clear()
  }

  // --- Internals -----------------------------------------------------------------------------

  private afterWrite(op: Operation, targets: string[], author: Author, atMs: number): void {
    if (this.policy.holds[author.kind]) {
      for (const key of targets) {
        if (key === ANY_TARGET) continue
        const previous = this.table.holdOf(key)
        if (previous && !sameOwner(previous.owner, author))
          this.emit({ type: 'freed', hold: previous, reason: 'taken' })
        const hold = this.table.write(key, author, atMs)
        this.overrideLane(key)
        this.emit({ type: 'held', hold })
      }
      this.writeThrough(op)
      this.schedule()
    }
  }

  /** Under an override the renderer leaves lane-bound parameters alone; the hand's value goes straight to the graph. */
  private writeThrough(op: Operation): void {
    if (!this.renderer) return
    switch (op.type) {
      case 'strip.set':
        if (this.overriddenKeys.has(targetKey({ kind: 'strip', owner: op.owner, param: op.param })))
          this.renderer.writeThrough({ kind: 'strip', owner: op.owner, param: op.param }, op.value)
        return
      case 'device.setParam':
        if (this.overriddenKeys.has(targetKey({ kind: 'device', device: op.device, param: op.param })))
          this.renderer.writeThrough({ kind: 'device', device: op.device, param: op.param }, op.value)
        return
      case 'device.setParams':
        for (const [param, value] of Object.entries(op.params)) {
          if (value === null) continue
          const target: ParamTarget = { kind: 'device', device: op.device, param }
          if (this.overriddenKeys.has(targetKey(target))) this.renderer.writeThrough(target, value)
        }
        return
      case 'batch':
        op.ops.forEach((child) => this.writeThrough(child))
        return
      default:
        return
    }
  }

  private overrideLane(key: string): void {
    if (!this.renderer || this.overriddenKeys.has(key)) return
    const target = paramTargetOf(key)
    if (!target) return
    const writer = this.renderer.writerFor(target)
    if (!writer) return
    if (!writer.isOverridden) writer.override(this.renderer.engine.now())
    this.overriddenKeys.add(key)
    this.emit({ type: 'overridden', target: key })
  }

  private resumeLane(key: string): void {
    if (!this.overriddenKeys.delete(key)) return
    const target = paramTargetOf(key)
    const writer = target && this.renderer ? this.renderer.writerFor(target) : undefined
    writer?.release()
    this.emit({ type: 'resumed', target: key })
  }

  private afterFree(key: string): void {
    if (this.policy.automationResume === 'after-hold') this.resumeLane(key)
  }

  private defer(
    op: Operation,
    targets: string[],
    author: Author,
    atMs: number,
    holder: HoldOwner,
    options: ApplyOptions,
  ): PendingWrite {
    // Latest wins per author and target set: an older wait for the same targets retires.
    for (let index = this.pendingList.length - 1; index >= 0; index -= 1) {
      const older = this.pendingList[index]
      if (older.author.id !== author.id || !sameTargets(older.targets, targets)) continue
      this.pendingList.splice(index, 1)
      this.emit({
        type: 'dropped',
        op: older.op,
        author: older.author,
        targets: older.targets,
        reason: 'superseded',
        ticket: older.ticket,
      })
    }
    const pending: PendingWrite = { ticket: this.nextTicket++, op, author, atMs, targets, holder }
    if (options.label !== undefined) pending.label = options.label
    if (options.gesture !== undefined) pending.gesture = options.gesture
    this.pendingList.push(pending)
    this.emit({ type: 'deferred', pending })
    return pending
  }

  /** Land every pending write whose targets are free now (oldest first); stale ones drop. */
  private flush(atMs: number): void {
    for (const pending of [...this.pendingList]) {
      const holder = this.strongestHolder(pending.targets, atMs, pending.author)
      if (decide(this.policy, pending.author.kind, holder?.owner.kind ?? null) !== 'apply') continue
      const index = this.pendingList.indexOf(pending)
      if (index >= 0) this.pendingList.splice(index, 1)
      if (atMs - pending.atMs > this.policy.deferTtlMs) {
        this.dropPending(pending, 'stale')
        continue
      }
      try {
        const entry = this.document.apply(pending.op, {
          author: pending.author,
          atMs,
          label: pending.label,
          gesture: pending.gesture,
        })
        this.emit({ type: 'landed', pending, entry })
      } catch {
        this.dropPending(pending, 'failed')
      }
    }
  }

  private dropPending(pending: PendingWrite, reason: DropReason): void {
    this.emit({
      type: 'dropped',
      op: pending.op,
      author: pending.author,
      targets: pending.targets,
      reason,
      holder: pending.holder,
      ticket: pending.ticket,
    })
  }

  /** The highest-ranked holder across `targets` that is not `author` itself. */
  private strongestHolder(targets: string[], atMs: number, author: Author): Holder | null {
    let strongest: Holder | null = null
    for (const key of targets) {
      const holder = this.holderFor(key, atMs, author)
      if (holder && (!strongest || this.outranks(holder, strongest))) strongest = holder
    }
    return strongest
  }

  /** The holder deciding writes on `key`: any live lock or hold on it, above it, or (for entity keys) beneath it. */
  private holderFor(key: string, atMs: number, author: Author | null): Holder | null {
    let strongest: Holder | null = null
    const consider = (candidate: string, source: Holder['source']): void => {
      if (!conflicts(candidate, key)) return
      const owner = this.table.holderOf(candidate, atMs)
      if (!owner || (author && sameOwner(owner, author))) return
      const holder: Holder = { owner, source, target: candidate }
      if (!strongest || this.outranks(holder, strongest)) strongest = holder
    }
    for (const lock of this.table.locks) consider(lock.target, 'lock')
    for (const hold of this.table.holds) consider(hold.target, 'hold')
    return strongest
  }

  private outranks(a: Holder, b: Holder): boolean {
    return this.policy.rank[a.owner.kind] > this.policy.rank[b.owner.kind]
  }

  private schedule(): void {
    if (this.disposed) return
    if (this.timer !== null) this.clearTimeoutFn(this.timer)
    this.timer = null
    const next = this.table.nextExpiryMs()
    if (next === null) return
    this.timer = this.setTimeoutFn(
      () => {
        this.timer = null
        this.tick()
      },
      Math.max(0, next - this.now()),
    )
  }

  private reset(): void {
    for (const pending of this.pendingList.splice(0)) this.dropPending(pending, 'cancelled')
    for (const hold of this.table.holds) this.emit({ type: 'freed', hold, reason: 'cleared' })
    for (const lock of this.table.locks)
      this.emit({ type: 'unlocked', lock, reason: 'unlocked' })
    this.table.reset()
    for (const key of [...this.overriddenKeys]) this.resumeLane(key)
    this.schedule()
  }
}

// --- Target keys -----------------------------------------------------------------------------

/** The arbitration key of a parameter target (`targetKey`) or a raw key. */
export function arbiterKey(target: ParamTarget | string): string {
  return typeof target === 'string' ? target : targetKey(target)
}

/** Two keys conflict when equal, or when one names an entity the other lives under. */
export function conflicts(a: string, b: string): boolean {
  if (a === ANY_TARGET || b === ANY_TARGET) return true
  if (a === b) return true
  return a.startsWith(`${b}:`) || b.startsWith(`${a}:`)
}

function sameTargets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sorted = [...b].sort()
  return [...a].sort().every((key, index) => key === sorted[index])
}

/** A strip or device parameter key back to its `ParamTarget` (null for structural keys). */
export function paramTargetOf(key: string): ParamTarget | null {
  const parts = key.split(':')
  if (parts.length !== 3) return null
  const [kind, owner, param] = parts
  if (kind === 'strip' && (param === 'level' || param === 'pan' || param === 'inputGain'))
    return { kind: 'strip', owner, param }
  if (kind === 'device') return { kind: 'device', device: owner, param }
  return null
}

/**
 * The keys an operation writes. Parameter operations key on the parameter;
 * structural ones on the entity, which conflicts with any hold beneath it.
 */
export function arbiterTargets(op: Operation): string[] {
  switch (op.type) {
    case 'score.rename':
    case 'transport.loop':
    case 'tempo.set':
      return ['score']
    case 'score.replace':
      return [ANY_TARGET]
    case 'source.add':
      return [`source:${op.source.id}`]
    case 'source.remove':
      return [`source:${op.id}`]
    case 'track.add':
      return [`strip:${op.track.id}`]
    case 'track.remove':
    case 'track.move':
    case 'group.remove':
    case 'group.move':
    case 'return.remove':
    case 'return.move':
    case 'strip.rename':
    case 'strip.route':
      return [`strip:${op.id}`]
    case 'elementTrack.add':
      return [`strip:${op.track.id}`]
    case 'elementTrack.remove':
    case 'elementTrack.route':
    case 'elementTrack.setClips':
      return [`strip:${op.id}`]
    case 'group.add':
      return [`strip:${op.group.id}`]
    case 'return.add':
      return [`strip:${op.return.id}`]
    case 'strip.set':
      return [targetKey({ kind: 'strip', owner: op.owner, param: op.param })]
    case 'strip.mute':
      return [`strip:${op.owner}:mute`]
    case 'strip.solo':
      return [`strip:${op.owner}:solo`]
    case 'strip.soloSafe':
      return [`strip:${op.owner}:soloSafe`]
    case 'clip.add':
      return [`clips:${op.track}:${op.clip.id}`]
    case 'clip.remove':
    case 'clip.move':
    case 'clip.trim':
    case 'clip.update':
      return [`clips:${op.track}:${op.id}`]
    case 'clip.replaceFrom':
      return [`clips:${op.track}`]
    case 'device.add':
      return [`device:${op.device.id}`, `strip:${op.owner}:inserts`]
    case 'device.remove':
    case 'device.move':
      return [`device:${op.id}`]
    case 'device.preset':
    case 'device.bypass':
      return [`device:${op.device}`]
    case 'device.setParam':
      return [targetKey({ kind: 'device', device: op.device, param: op.param })]
    case 'device.setParams':
      return Object.keys(op.params).map((param) =>
        targetKey({ kind: 'device', device: op.device, param }),
      )
    case 'send.add':
    case 'send.remove':
    case 'send.set':
      return [`send:${op.owner}:${op.target}`]
    case 'lane.add':
      return [`lane:${op.lane.id}`]
    case 'lane.remove':
    case 'lane.setBreakpoints':
    case 'lane.addBreakpoint':
    case 'lane.removeBreakpoint':
      return [`lane:${op.id}`]
    case 'modulator.add':
      return [`modulator:${op.modulator.id}`]
    case 'modulator.remove':
    case 'modulator.update':
      return [`modulator:${op.id}`]
    case 'route.add':
      return [`route:${op.route.id}`]
    case 'route.remove':
    case 'route.update':
      return [`route:${op.id}`]
    case 'batch': {
      const keys = new Set<string>()
      for (const child of op.ops) for (const key of arbiterTargets(child)) keys.add(key)
      return [...keys]
    }
    default: {
      const exhaustive: never = op
      return exhaustive
    }
  }
}

/** The master fader's key. */
export const MASTER_LEVEL_KEY = targetKey({ kind: 'strip', owner: MASTER_OWNER, param: 'level' })
