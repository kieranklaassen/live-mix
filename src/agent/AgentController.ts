// The agent control API (U29, KTD9, KD4): one tool surface over the score,
// the engine and the consumer's session. `call(name, args, { author })`
// validates against the tool's schema, runs the rails, compiles to score
// operations and effects, applies them through `ScoreDocument.apply` (so the
// `OperationLog` carries the author) and records the call in the audit
// trail. `listTools()` is what a model session registers; `snapshot()` is
// what it reads.

import { type Engine } from '../core/Engine'
import { type IntervalId } from '../core/clock'
import { type Author } from '../score/log'
import { ScoreOperationError, type Operation } from '../score/operations'
import { type ScoreDocument } from '../score/ScoreDocument'
import { AgentAuditLog, type AuditEntry } from './audit'
import { intentTools } from './intents'
import { formatIssues, validateSchema } from './jsonSchema'
import { operationTools } from './operations'
import { consentForBatch } from './operations'
import { AGENT_AUTHOR, RailRejection, Rails, type AgentRailsOptions } from './rails'
import {
  ToolError,
  ToolRegistry,
  toAnthropicTools,
  toOpenAiTools,
  type ControllerView,
  type ToOpenAiToolsOptions,
  type ToolContext,
  type ToolPlan,
  type ToolSpec,
} from './registry'
import {
  buildSnapshot,
  diffSnapshots,
  metersOf,
  toSnapshotCall,
  type AgentSnapshot,
  type SnapshotDiff,
  type SnapshotMeters,
} from './snapshot'
import {
  type AgentRoles,
  type AgentSession,
  type AgentTrack,
  type AnthropicTool,
  type AppliedOperation,
  type CallOptions,
  type ConsentScope,
  type OpenAiChatTool,
  type OpenAiFunctionTool,
  type RailNote,
  type ToolDefinition,
  type ToolErrorCode,
  type ToolFailure,
  type ToolResult,
  type ToolSuccess,
} from './types'

export interface AgentControllerOptions {
  /** The engine: meters, transport, the fade-out fallback, device ranges. */
  engine?: Engine
  /** The score the operation tools edit; without one only hooks-backed intents and queries are available. */
  document?: ScoreDocument
  /** The consumer's session hooks (sections, pace, dip logic). */
  session?: AgentSession
  roles?: AgentRoles
  /** Library for the compiled steer path when the session gives none. */
  library?: readonly AgentTrack[]
  rails?: AgentRailsOptions
  /** Default author of every call; `{ id: 'agent', kind: 'agent' }`. */
  author?: Author
  /** Wall clock in milliseconds. Default `Date.now`. */
  now?: () => number
  /** Timers for the snapshot cadence; default the engine's clock, else globals. */
  setIntervalFn?: (callback: () => void, ms: number) => IntervalId
  clearIntervalFn?: (id: IntervalId) => void
  /** Audit entries kept in memory. Default 500. */
  auditLimit?: number
  /** Consumer-defined tools registered after the built-in catalogue. */
  tools?: readonly ToolSpec[]
  /** Meter override for the snapshot (tests, consumers with their own meter). */
  meters?: () => SnapshotMeters | null
}

export type SnapshotListener = (snapshot: AgentSnapshot) => void

const SNAPSHOT_HISTORY = 16

export class AgentController implements ControllerView {
  readonly registry = new ToolRegistry()
  readonly rails: Rails
  readonly audit: AgentAuditLog
  readonly author: Author
  readonly document: ScoreDocument | null
  readonly engine: Engine | null
  readonly session: AgentSession
  readonly roles: AgentRoles
  private readonly staticLibrary: readonly AgentTrack[]
  private readonly now: () => number
  private readonly setIntervalFn: (callback: () => void, ms: number) => IntervalId
  private readonly clearIntervalFn: (id: IntervalId) => void
  private readonly metersOverride: (() => SnapshotMeters | null) | null
  private readonly snapshots = new Map<number, AgentSnapshot>()
  private readonly listeners = new Set<SnapshotListener>()
  private cadenceId: IntervalId | null = null
  private cadenceMs = 0
  private growthSec = 0
  private nextCallId = 1
  private disposed = false

  constructor(options: AgentControllerOptions = {}) {
    this.engine = options.engine ?? null
    this.document = options.document ?? null
    this.session = options.session ?? {}
    this.roles = { ...options.roles }
    this.staticLibrary = options.library ?? []
    this.author = options.author ?? AGENT_AUTHOR
    this.now = options.now ?? (() => Date.now())
    this.setIntervalFn =
      options.setIntervalFn ??
      this.engine?.clock.setIntervalFn ??
      ((callback, ms) => setInterval(callback, ms))
    this.clearIntervalFn =
      options.clearIntervalFn ?? this.engine?.clock.clearIntervalFn ?? ((id) => clearInterval(id))
    this.metersOverride = options.meters ?? null
    this.rails = new Rails({
      loudnessReading: () => {
        const meters = this.meters()
        if (!meters) return null
        return {
          shortTermLufs: meters.shortTermLufs ?? undefined,
          truePeakDb: meters.truePeakDb ?? undefined,
        }
      },
      ...options.rails,
    })
    this.audit = new AgentAuditLog(options.auditLimit)
    for (const spec of operationTools()) this.registry.register(spec)
    for (const spec of intentTools()) this.registry.register(spec)
    for (const spec of options.tools ?? []) this.registry.register(spec)
  }

  // --- ControllerView ---------------------------------------------------------------

  library(): readonly AgentTrack[] {
    return this.session.library?.() ?? this.staticLibrary
  }

  speaking(): boolean {
    return this.session.isSpeaking?.() ?? true
  }

  nowSec(): number {
    if (!this.engine) return 0
    return this.engine.transport.position().positionSec
  }

  headroomSec(): number {
    const fromSession = this.session.headroomSec?.()
    if (fromSession !== undefined) return Math.max(0, fromSession)
    return Math.max(0, this.rails.config.maxSessionGrowthSec - this.growthSec)
  }

  noteGrowth(seconds: number): void {
    if (Number.isFinite(seconds) && seconds > 0) this.growthSec += seconds
  }

  /** Seconds the agent has added to the session so far. */
  get growth(): number {
    return this.growthSec
  }

  // --- Catalogue ------------------------------------------------------------------------

  /** The tools that can run right now, with their schemas and effective rate limits. */
  listTools(): ToolDefinition[] {
    return this.registry.definitions(this)
  }

  toOpenAiTools(options?: { shape?: 'responses' }): OpenAiFunctionTool[]
  toOpenAiTools(options: { shape: 'chat' }): OpenAiChatTool[]
  toOpenAiTools(options: ToOpenAiToolsOptions = {}): OpenAiFunctionTool[] | OpenAiChatTool[] {
    return options.shape === 'chat'
      ? toOpenAiTools(this.listTools(), { shape: 'chat' })
      : toOpenAiTools(this.listTools())
  }

  toAnthropicTools(): AnthropicTool[] {
    return toAnthropicTools(this.listTools())
  }

  grantConsent(scope: ConsentScope): void {
    this.rails.grantConsent(scope)
  }

  revokeConsent(scope: ConsentScope): void {
    this.rails.revokeConsent(scope)
  }

  // --- Calls -------------------------------------------------------------------------------

  call(name: string, args: Record<string, unknown> = {}, options: CallOptions = {}): ToolResult {
    this.assertLive()
    const callId = this.nextCallId++
    const author = options.author ?? this.author
    const atMs = options.atMs ?? this.now()
    const dryRun = options.dryRun ?? false
    const notes: RailNote[] = []
    const fail = (
      code: ToolErrorCode,
      message: string,
      extra: Partial<ToolFailure['error']> = {},
    ) => this.reject(callId, name, args, author, atMs, dryRun, notes, code, message, extra)

    const spec = this.registry.get(name)
    if (!spec) return fail('unknown_tool', `unknown tool "${name}"`)
    if (!spec.available(this)) {
      return fail('unavailable', `"${name}" has no backend in this session`)
    }
    const issues = validateSchema(spec.definition.parameters, args)
    if (issues.length > 0) {
      return fail('invalid_args', `${name}: ${formatIssues(issues)}`, { issues })
    }
    const consent = this.missingConsent(spec, args)
    if (consent) {
      notes.push({ rail: 'consent', action: 'rejected', message: `needs consent "${consent}"` })
      return fail('consent_required', `"${name}" needs the "${consent}" consent`)
    }
    const declared = spec.definition.rateLimit
    const wait = dryRun
      ? this.rails.peekCall(name, atMs, declared)
      : this.rails.takeCall(name, atMs, declared)
    if (wait !== null) {
      notes.push({ rail: 'rate-limit', action: 'rejected', message: `retry in ${wait} ms` })
      return fail('rate_limited', `"${name}" is rate-limited; retry in ${wait} ms`, {
        retryAfterMs: wait,
      })
    }

    const ctx: ToolContext = { view: this, callId, author, atMs, dryRun, notes }
    let plan: ToolPlan
    try {
      plan = spec.plan(args, ctx)
      if (plan.operations.length > 0 && !this.document) {
        throw new ToolError('unavailable', `"${name}" needs a score document`)
      }
    } catch (error) {
      return this.failureFrom(error, notes, fail)
    }

    if (dryRun) {
      const success: ToolSuccess = {
        ok: true,
        callId,
        tool: name,
        result: plan.result,
        operations: [],
        rails: notes,
        dryRun: true,
        compiled: plan.operations,
      }
      this.record({
        callId,
        atMs,
        author,
        tool: name,
        args,
        outcome: 'dry-run',
        rails: notes,
        operations: [],
        inverses: [],
        result: spec.definition.category === 'query' ? undefined : plan.result,
        summary: `dry run: ${plan.label}${describeNotes(notes)}`,
      })
      return success
    }

    const applied: AppliedOperation[] = []
    const inverses: Operation[] = []
    const label = `agent:${name}#${callId} ${plan.label}`
    try {
      for (const op of plan.operations) {
        if (!this.document) throw new ToolError('unavailable', `"${name}" needs a score document`)
        const entry = this.document.apply(op, { author, atMs, label })
        applied.push({ seq: entry.seq, type: op.type })
        inverses.push(entry.inverse)
      }
      let result = { ...plan.result }
      for (const effect of plan.effects) {
        const fragment = effect()
        if (fragment) result = { ...result, ...fragment }
      }
      const success: ToolSuccess = {
        ok: true,
        callId,
        tool: name,
        result,
        operations: applied,
        rails: notes,
        dryRun: false,
      }
      this.record({
        callId,
        atMs,
        author,
        tool: name,
        args,
        outcome: 'applied',
        rails: notes,
        operations: applied,
        inverses,
        result: spec.definition.category === 'query' ? undefined : result,
        summary: `${plan.label}${describeNotes(notes)}`,
      })
      return success
    } catch (error) {
      this.rollback(inverses, author, atMs, label)
      return this.failureFrom(error, notes, fail)
    }
  }

  /** Revert one applied call by its id (the latest when omitted) through the `undo` tool. */
  undo(callId?: number, options: CallOptions = {}): ToolResult {
    return this.call('undo', callId === undefined ? {} : { callId }, options)
  }

  // --- Snapshot ---------------------------------------------------------------------------

  snapshot(): AgentSnapshot {
    const snapshot = buildSnapshot({
      engine: this.engine,
      score: this.document?.score ?? null,
      roles: this.roles,
      session: this.session.describe?.(),
      speaking: this.speaking(),
      recent: this.audit.entries,
      cursor: this.audit.cursor,
      meters: this.meters(),
    })
    this.snapshots.set(snapshot.cursor, snapshot)
    if (this.snapshots.size > SNAPSHOT_HISTORY) {
      const oldest = this.snapshots.keys().next().value
      if (oldest !== undefined) this.snapshots.delete(oldest)
    }
    return snapshot
  }

  /** What changed since the snapshot taken at `cursor`: the calls and the differing fields. */
  diffSince(cursor: number): SnapshotDiff {
    const previous = this.snapshots.get(cursor)
    const next = this.snapshot()
    const calls = this.audit.since(cursor).map(toSnapshotCall)
    if (!previous) {
      const changed: Partial<AgentSnapshot> = { ...next }
      delete changed.recent
      return { from: cursor, to: next.cursor, calls, changed, full: true }
    }
    return {
      from: cursor,
      to: next.cursor,
      calls,
      changed: diffSnapshots(previous, next),
      full: false,
    }
  }

  /** Emit a snapshot to listeners every `ms` (0 stops). */
  setCadence(ms: number): void {
    if (this.cadenceId !== null) {
      this.clearIntervalFn(this.cadenceId)
      this.cadenceId = null
    }
    this.cadenceMs = Math.max(0, ms)
    if (this.cadenceMs > 0 && !this.disposed) {
      this.cadenceId = this.setIntervalFn(() => this.emit(), this.cadenceMs)
    }
  }

  get cadence(): number {
    return this.cadenceMs
  }

  onSnapshot(listener: SnapshotListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.setCadence(0)
    this.listeners.clear()
  }

  // --- Internals ------------------------------------------------------------------------------

  private meters(): SnapshotMeters | null {
    return this.metersOverride ? this.metersOverride() : metersOf(this.engine)
  }

  private emit(): void {
    if (this.listeners.size === 0) return
    const snapshot = this.snapshot()
    for (const listener of [...this.listeners]) listener(snapshot)
  }

  private missingConsent(spec: ToolSpec, args: Record<string, unknown>): ConsentScope | null {
    const scopes: ConsentScope[] = []
    if (spec.definition.consent) scopes.push(spec.definition.consent)
    if (spec.definition.operation === 'batch' && Array.isArray(args.ops)) {
      scopes.push(...consentForBatch(args.ops as Operation[]))
    }
    return scopes.find((scope) => !this.rails.hasConsent(scope)) ?? null
  }

  private failureFrom(
    error: unknown,
    notes: RailNote[],
    fail: (code: ToolErrorCode, message: string) => ToolFailure,
  ): ToolFailure {
    if (error instanceof RailRejection) {
      notes.push(error.note)
      return fail('rejected', error.message)
    }
    if (error instanceof ToolError) return fail(error.code, error.message)
    if (error instanceof ScoreOperationError) return fail('failed', error.message)
    return fail('failed', error instanceof Error ? error.message : 'tool call failed')
  }

  private rollback(inverses: Operation[], author: Author, atMs: number, label: string): void {
    if (!this.document) return
    for (const inverse of [...inverses].reverse()) {
      try {
        this.document.apply(inverse, { author, atMs, label: `rollback ${label}` })
      } catch {
        // A rollback that cannot apply leaves the document as the failed step left it; the
        // log still shows both attempts.
      }
    }
  }

  private reject(
    callId: number,
    tool: string,
    args: Record<string, unknown>,
    author: Author,
    atMs: number,
    dryRun: boolean,
    notes: RailNote[],
    code: ToolErrorCode,
    message: string,
    extra: Partial<ToolFailure['error']>,
  ): ToolFailure {
    this.record({
      callId,
      atMs,
      author,
      tool,
      args,
      outcome: 'rejected',
      code,
      rails: notes,
      operations: [],
      inverses: [],
      message,
      summary: `${code}: ${shortMessage(message)}`,
    })
    return {
      ok: false,
      callId,
      tool,
      error: { code, message, ...extra },
      rails: notes,
      dryRun,
    }
  }

  private record(entry: AuditEntry): void {
    this.audit.append(entry)
  }

  private assertLive(): void {
    if (this.disposed) throw new Error('live-mix: AgentController is disposed')
  }
}

/** Drop the `live-mix: <type>: ` prefix operation errors carry; the tool name is already in the entry. */
function shortMessage(message: string): string {
  return message.replace(/^live-mix: /, '').replace(/^[a-z]+\.[A-Za-z]+: /, '')
}

function describeNotes(notes: readonly RailNote[]): string {
  if (notes.length === 0) return ''
  return ` (${notes.map((note) => `${note.rail} ${note.action}`).join(', ')})`
}

export function createAgentController(options: AgentControllerOptions = {}): AgentController {
  return new AgentController(options)
}
