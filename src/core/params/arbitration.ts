// Controller arbitration (U30, R29): who may move a parameter when several
// writers want it. The policy is a small table over writer kinds — the
// human at the UI, a MIDI/OSC controller, the agent, an automation lane, the
// system's own rails — plus per-target "touch holds": a human write takes
// the target and keeps it for `holdMs` after the last touch, so nothing
// lower-ranked slides it back underneath the hand (the plan's "override
// memory"). Everything here is pure and clock-injected; `Arbiter` (in
// `score/Arbiter.ts`) binds it to a `ScoreDocument`, lane writers and
// timers. The table is data so a consumer can read, print and tune it.

/** Who is writing. `human` is the user at the UI or a knob; `controller` a MIDI/OSC surface. */
export type WriterKind = 'human' | 'controller' | 'agent' | 'automation' | 'system'

export const WRITER_KINDS: readonly WriterKind[] = [
  'system',
  'human',
  'controller',
  'agent',
  'automation',
]

/** What happens to a write against a target someone else holds. */
export type ArbitrationDecision = 'apply' | 'defer' | 'drop'

export interface ArbitrationPolicy {
  /** Higher outranks lower; equal ranks are one class where the latest writer wins. */
  rank: Readonly<Record<WriterKind, number>>
  /** A lower-ranked writer's fate against a hold: queued until the hold ends, or refused. */
  onHeld: Readonly<Record<WriterKind, 'defer' | 'drop'>>
  /** Kinds whose writes place a touch hold on the target. */
  holds: Readonly<Record<WriterKind, boolean>>
  /** Kinds whose writes never yield — no hold or lock stops them. */
  overrides: Readonly<Record<WriterKind, boolean>>
  /** How long a touch hold outlives the last write or release (milliseconds). */
  holdMs: number
  /** A deferred write older than this when its target frees is dropped as stale. */
  deferTtlMs: number
  /** Whether an automation lane a hold overrode comes back when the hold ends, or waits for `releaseAutomation`. */
  automationResume: 'after-hold' | 'manual'
}

export const DEFAULT_HOLD_MS = 5_000
export const DEFAULT_DEFER_TTL_MS = 15_000

/**
 * The default policy:
 *
 * | rank | kind        | holds target | when the target is held by a higher rank | yields to |
 * |-----:|-------------|--------------|-------------------------------------------|-----------|
 * |    4 | system      | no           | never held (writes always land)           | nothing   |
 * |    3 | human       | yes, holdMs  | drop (only a system lock outranks it)     | system    |
 * |    3 | controller  | yes, holdMs  | drop (only a system lock outranks it)     | system    |
 * |    2 | agent       | no           | defer until the hold ends (TTL), then land| system, human, controller |
 * |    1 | automation  | no           | drop; the lane resumes after the hold     | everyone  |
 *
 * Within a class (human ↔ controller) the latest writer wins and takes over the hold.
 */
export const DEFAULT_ARBITRATION_POLICY: ArbitrationPolicy = {
  rank: { system: 4, human: 3, controller: 3, agent: 2, automation: 1 },
  onHeld: { system: 'drop', human: 'drop', controller: 'drop', agent: 'defer', automation: 'drop' },
  holds: { system: false, human: true, controller: true, agent: false, automation: false },
  overrides: { system: true, human: false, controller: false, agent: false, automation: false },
  holdMs: DEFAULT_HOLD_MS,
  deferTtlMs: DEFAULT_DEFER_TTL_MS,
  automationResume: 'after-hold',
}

export type ArbitrationPolicyOptions = Partial<Omit<ArbitrationPolicy, 'rank' | 'onHeld' | 'holds' | 'overrides'>> & {
  rank?: Partial<Record<WriterKind, number>>
  onHeld?: Partial<Record<WriterKind, 'defer' | 'drop'>>
  holds?: Partial<Record<WriterKind, boolean>>
  overrides?: Partial<Record<WriterKind, boolean>>
}

/** The default policy with overrides merged per field. */
export function resolvePolicy(options: ArbitrationPolicyOptions = {}): ArbitrationPolicy {
  const base = DEFAULT_ARBITRATION_POLICY
  return {
    rank: { ...base.rank, ...options.rank },
    onHeld: { ...base.onHeld, ...options.onHeld },
    holds: { ...base.holds, ...options.holds },
    overrides: { ...base.overrides, ...options.overrides },
    holdMs: Math.max(0, options.holdMs ?? base.holdMs),
    deferTtlMs: Math.max(0, options.deferTtlMs ?? base.deferTtlMs),
    automationResume: options.automationResume ?? base.automationResume,
  }
}

/**
 * The decision for one write: `holder` is the kind holding or locking the
 * target (null when free). Overriding kinds always apply; otherwise a writer
 * ranked at or above the holder applies (and, within a class, takes over),
 * and a lower-ranked one follows its `onHeld` entry.
 */
export function decide(
  policy: ArbitrationPolicy,
  writer: WriterKind,
  holder: WriterKind | null,
): ArbitrationDecision {
  if (holder === null || policy.overrides[writer]) return 'apply'
  if (policy.rank[writer] >= policy.rank[holder]) return 'apply'
  return policy.onHeld[writer]
}

export interface PolicyRow {
  writer: WriterKind
  /** Decision against each possible holder kind (and `free`). */
  against: Readonly<Record<WriterKind | 'free', ArbitrationDecision>>
  holds: boolean
}

/** The whole matrix, one row per writer kind — what the docs print and the tests pin. */
export function policyTable(policy: ArbitrationPolicy = DEFAULT_ARBITRATION_POLICY): PolicyRow[] {
  return WRITER_KINDS.map((writer) => {
    const against = { free: decide(policy, writer, null) } as Record<
      WriterKind | 'free',
      ArbitrationDecision
    >
    for (const holder of WRITER_KINDS) against[holder] = decide(policy, writer, holder)
    return { writer, against, holds: policy.holds[writer] }
  })
}

/** Render `policyTable` as a Markdown table (docs, a debug panel). */
export function formatPolicyTable(policy: ArbitrationPolicy = DEFAULT_ARBITRATION_POLICY): string {
  const header = `| writer ↓ / held by → | free | ${WRITER_KINDS.join(' | ')} | places hold |`
  const rule = `|---|---|${WRITER_KINDS.map(() => '---').join('|')}|---|`
  const rows = policyTable(policy).map(
    (row) =>
      `| ${row.writer} | ${row.against.free} | ${WRITER_KINDS.map((kind) => row.against[kind]).join(' | ')} | ${row.holds ? `yes (${policy.holdMs} ms)` : 'no'} |`,
  )
  return [header, rule, ...rows].join('\n')
}

// --- Holds and locks ---------------------------------------------------------------------

export interface HoldOwner {
  id: string
  kind: WriterKind
}

/** A touch hold on one target: implicit from a write, open while `touching`, then timed. */
export interface Hold {
  target: string
  owner: HoldOwner
  /** True between `touch` and `release` (a pointer down, a fader in hand): no expiry. */
  touching: boolean
  /** When the hold lapses (Infinity while touching). */
  untilMs: number
  /** When the owner last wrote or touched. */
  sinceMs: number
}

/** An explicit lock: nothing ranked below the owner writes until it lifts. */
export interface Lock {
  target: string
  owner: HoldOwner
  untilMs: number
  reason?: string
}

export interface HoldTableOptions {
  holdMs: number
}

/**
 * Per-target holds and locks with expiry, clock-injected. `holderOf` is what
 * `decide` takes; `expire` returns what lapsed so the binding layer can
 * release lanes and apply deferred writes.
 */
export class HoldTable {
  readonly holdMs: number
  private readonly holdMap = new Map<string, Hold>()
  private readonly lockMap = new Map<string, Lock>()

  constructor(options: HoldTableOptions) {
    this.holdMs = Math.max(0, options.holdMs)
  }

  get holds(): Hold[] {
    return [...this.holdMap.values()]
  }

  get locks(): Lock[] {
    return [...this.lockMap.values()]
  }

  holdOf(target: string): Hold | undefined {
    return this.holdMap.get(target)
  }

  lockOf(target: string): Lock | undefined {
    return this.lockMap.get(target)
  }

  /** The kind that currently outranks writers on `target`: a live lock first, else a live hold. */
  holderOf(target: string, atMs: number): HoldOwner | null {
    const lock = this.lockMap.get(target)
    if (lock && lock.untilMs > atMs) return lock.owner
    const hold = this.holdMap.get(target)
    if (hold && (hold.touching || hold.untilMs > atMs)) return hold.owner
    return null
  }

  /** A write by `owner`: start or refresh a timed hold (a touch in progress stays open). Returns the hold. */
  write(target: string, owner: HoldOwner, atMs: number): Hold {
    const existing = this.holdMap.get(target)
    if (existing && existing.touching && sameOwner(existing.owner, owner)) {
      existing.sinceMs = atMs
      return existing
    }
    const hold: Hold = {
      target,
      owner,
      touching: false,
      untilMs: atMs + this.holdMs,
      sinceMs: atMs,
    }
    this.holdMap.set(target, hold)
    return hold
  }

  /** A pointer down: hold the target open-ended until `release`. */
  touch(target: string, owner: HoldOwner, atMs: number): Hold {
    const hold: Hold = { target, owner, touching: true, untilMs: Infinity, sinceMs: atMs }
    this.holdMap.set(target, hold)
    return hold
  }

  /**
   * A pointer up by the holder: the hold outlives it by `holdMs`. Returns the
   * hold, or undefined when `owner` (if given) does not hold the target.
   */
  release(target: string, atMs: number, owner?: HoldOwner): Hold | undefined {
    const hold = this.holdMap.get(target)
    if (!hold || (owner && !sameOwner(hold.owner, owner))) return undefined
    hold.touching = false
    hold.untilMs = atMs + this.holdMs
    hold.sinceMs = atMs
    return hold
  }

  /** Drop a hold now (a takeover, a dispose). */
  clear(target: string): Hold | undefined {
    const hold = this.holdMap.get(target)
    this.holdMap.delete(target)
    return hold
  }

  lock(target: string, owner: HoldOwner, untilMs: number, reason?: string): Lock {
    const lock: Lock = { target, owner, untilMs }
    if (reason !== undefined) lock.reason = reason
    this.lockMap.set(target, lock)
    return lock
  }

  unlock(target: string): Lock | undefined {
    const lock = this.lockMap.get(target)
    this.lockMap.delete(target)
    return lock
  }

  /** Remove every hold and lock that has lapsed by `atMs`; returns them. */
  expire(atMs: number): { holds: Hold[]; locks: Lock[] } {
    const holds: Hold[] = []
    const locks: Lock[] = []
    for (const [target, hold] of this.holdMap) {
      if (!hold.touching && hold.untilMs <= atMs) {
        this.holdMap.delete(target)
        holds.push(hold)
      }
    }
    for (const [target, lock] of this.lockMap) {
      if (lock.untilMs <= atMs) {
        this.lockMap.delete(target)
        locks.push(lock)
      }
    }
    return { holds, locks }
  }

  /** The earliest future expiry, or null when nothing is timed. */
  nextExpiryMs(): number | null {
    let next: number | null = null
    for (const hold of this.holdMap.values()) {
      if (!hold.touching && Number.isFinite(hold.untilMs) && (next === null || hold.untilMs < next))
        next = hold.untilMs
    }
    for (const lock of this.lockMap.values()) {
      if (Number.isFinite(lock.untilMs) && (next === null || lock.untilMs < next))
        next = lock.untilMs
    }
    return next
  }

  reset(): void {
    this.holdMap.clear()
    this.lockMap.clear()
  }
}

export function sameOwner(a: HoldOwner, b: HoldOwner): boolean {
  return a.id === b.id && a.kind === b.kind
}
