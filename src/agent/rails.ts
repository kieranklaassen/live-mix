// Safety rails (R27, KD10): the listener's protection outranks the agent's
// intent. Every rail is a pure decision over the requested change and the
// current state — clamp it, refuse it with a reason, or let it through — and
// the controller records the decision in the audit trail. Defaults are tuned
// for a breathwork listener wearing earphones; consumers override per field.

import { type Author } from '../score/log'
import { type ConsentScope, type RailName, type RailNote, type RateLimit } from './types'

export interface LoudnessReading {
  /** Short-term (3 s) loudness, LUFS; −Infinity when silent. */
  shortTermLufs?: number
  /** Highest inter-sample peak, dBTP. */
  truePeakDb?: number
}

export interface AgentRailsConfig {
  /** Fader range the agent may set on any strip (the score itself allows 0..2). */
  levelRange: readonly [number, number]
  /** Short-term LUFS ceiling for agent-driven gain increases. */
  maxShortTermLufs: number
  /** True-peak ceiling (dBTP) for agent-driven gain increases. */
  maxTruePeakDb: number
  /** `clamp` scales an increase down to the ceiling; `reject` refuses it. */
  loudnessMode: 'clamp' | 'reject'
  /** Where the loudness rail reads from; null disarms it. Default: the master LUFS meter. */
  loudnessReading?: () => LoudnessReading | null
  /** Largest linear gain change per second, per parameter (a token bucket). */
  maxGainChangePerSec: number
  /** Refuse hard mutes and near-silence on the voice role while speaking. */
  protectVoice: boolean
  /** Lowest voice fader the agent may set while speaking. */
  minVoiceLevel: number
  /** Refuse hard mutes and removals of the music and ambience roles (fades are fine). */
  noSilence: boolean
  /** Per-tool rate limits; `default` covers the rest. */
  rateLimits: Readonly<Record<string, RateLimit>> & { default: RateLimit }
  /** `extend_section`: cap per call. */
  maxExtendPerCallSec: number
  /** Total seconds an agent may add to a session (steer and extend) when the session gives no headroom. */
  maxSessionGrowthSec: number
  /** `fade_out` bounds: below the minimum is a startle, above the maximum a stall. */
  minFadeSec: number
  maxFadeSec: number
  /** Consent scopes granted up front. */
  consent: readonly ConsentScope[]
}

export const DEFAULT_RATE_LIMITS: Readonly<Record<string, RateLimit>> & { default: RateLimit } = {
  default: { burst: 3, perMinute: 30 },
  set_music_volume: { burst: 5, perMinute: 30 },
  set_ambience: { burst: 5, perMinute: 30 },
  duck: { burst: 5, perMinute: 30 },
  steer_music: { burst: 1, perMinute: 2 },
  set_intensity: { burst: 1, perMinute: 2 },
  extend_section: { burst: 2, perMinute: 6 },
  advance_section: { burst: 1, perMinute: 3 },
  set_breath_pace: { burst: 3, perMinute: 12 },
  fade_out: { burst: 1, perMinute: 1 },
  more_space: { burst: 2, perMinute: 6 },
  match_key: { burst: 10, perMinute: 60 },
  get_state: { burst: 10, perMinute: 120 },
  undo: { burst: 3, perMinute: 10 },
}

export const DEFAULT_RAILS: AgentRailsConfig = {
  levelRange: [0, 1],
  maxShortTermLufs: -14,
  maxTruePeakDb: -1,
  loudnessMode: 'clamp',
  maxGainChangePerSec: 1,
  protectVoice: true,
  minVoiceLevel: 0.25,
  noSilence: true,
  rateLimits: DEFAULT_RATE_LIMITS,
  maxExtendPerCallSec: 300,
  maxSessionGrowthSec: 900,
  minFadeSec: 2,
  maxFadeSec: 30,
  consent: [],
}

export type AgentRailsOptions = Omit<Partial<AgentRailsConfig>, 'rateLimits'> & {
  rateLimits?: Readonly<Record<string, RateLimit>>
}

export function resolveRails(options: AgentRailsOptions = {}): AgentRailsConfig {
  const { rateLimits, ...rest } = options
  return {
    ...DEFAULT_RAILS,
    ...rest,
    rateLimits: rateLimits ? { ...DEFAULT_RATE_LIMITS, ...rateLimits } : DEFAULT_RATE_LIMITS,
  }
}

/** A refused change; the controller turns it into a `rejected` result. */
export class RailRejection extends Error {
  readonly note: RailNote

  constructor(rail: RailName, message: string, requested?: unknown) {
    super(message)
    this.name = 'RailRejection'
    this.note = { rail, action: 'rejected', message, requested }
  }
}

interface Bucket {
  tokens: number
  atMs: number
}

function take(bucket: Bucket, capacity: number, refillPerMs: number, atMs: number): Bucket {
  const elapsed = Math.max(0, atMs - bucket.atMs)
  return { tokens: Math.min(capacity, bucket.tokens + elapsed * refillPerMs), atMs }
}

export function gainToDb(gain: number): number {
  return gain <= 0 ? -Infinity : 20 * Math.log10(gain)
}

export function dbToGain(db: number): number {
  return db === -Infinity ? 0 : Math.pow(10, db / 20)
}

/**
 * The stateful rails: rate-limit and gain-slew buckets, consent, and the
 * pure checks the tools call while planning. Notes accumulate on the call's
 * `notes` list so the audit trail and the result carry every clamp.
 */
export class Rails {
  readonly config: AgentRailsConfig
  private readonly granted: Set<ConsentScope>
  private readonly callBuckets = new Map<string, Bucket>()
  private readonly gainBuckets = new Map<string, Bucket>()

  constructor(options: AgentRailsOptions = {}) {
    this.config = resolveRails(options)
    this.granted = new Set(this.config.consent)
  }

  // --- Consent -------------------------------------------------------------

  grantConsent(scope: ConsentScope): void {
    this.granted.add(scope)
  }

  revokeConsent(scope: ConsentScope): void {
    this.granted.delete(scope)
  }

  hasConsent(scope: ConsentScope): boolean {
    return this.granted.has(scope)
  }

  get consents(): ConsentScope[] {
    return [...this.granted]
  }

  // --- Rate limits -----------------------------------------------------------

  /**
   * The limit for `tool`: the configured table first, then the limit the
   * tool's own spec declares (consumer tools), then the default.
   */
  rateLimitFor(tool: string, declared?: RateLimit): RateLimit {
    return this.config.rateLimits[tool] ?? declared ?? this.config.rateLimits.default
  }

  /** Consume one call of `tool`; the ms to wait when the bucket is empty, else null. */
  takeCall(tool: string, atMs: number, declared?: RateLimit): number | null {
    const limit = this.rateLimitFor(tool, declared)
    const refillPerMs = limit.perMinute / 60_000
    const bucket = take(
      this.callBuckets.get(tool) ?? { tokens: limit.burst, atMs },
      limit.burst,
      refillPerMs,
      atMs,
    )
    if (bucket.tokens < 1) {
      this.callBuckets.set(tool, bucket)
      return Math.ceil((1 - bucket.tokens) / refillPerMs)
    }
    this.callBuckets.set(tool, { ...bucket, tokens: bucket.tokens - 1 })
    return null
  }

  /** Whether a call of `tool` would pass now, without consuming it (dry runs). */
  peekCall(tool: string, atMs: number, declared?: RateLimit): number | null {
    const limit = this.rateLimitFor(tool, declared)
    const refillPerMs = limit.perMinute / 60_000
    const bucket = take(
      this.callBuckets.get(tool) ?? { tokens: limit.burst, atMs },
      limit.burst,
      refillPerMs,
      atMs,
    )
    return bucket.tokens < 1 ? Math.ceil((1 - bucket.tokens) / refillPerMs) : null
  }

  // --- Ranges -----------------------------------------------------------------

  /** Clamp a fader level into the agent's range, noting it. */
  clampLevel(value: number, notes: RailNote[], what = 'level'): number {
    const [min, max] = this.config.levelRange
    return this.clampRange(value, min, max, notes, what)
  }

  clampRange(value: number, min: number, max: number, notes: RailNote[], what: string): number {
    const clamped = Math.min(max, Math.max(min, value))
    if (clamped !== value) {
      notes.push({
        rail: 'range',
        action: 'clamped',
        message: `${what} ${value} clamped to ${min}..${max}`,
        requested: value,
        applied: clamped,
      })
    }
    return clamped
  }

  // --- Gain slew --------------------------------------------------------------

  /**
   * Limit how far a gain may move per call: a token bucket per target with
   * capacity `maxGainChangePerSec`, refilled at that rate. `commit` false
   * (dry runs) leaves the bucket untouched.
   */
  slewGain(
    target: string,
    current: number,
    requested: number,
    atMs: number,
    notes: RailNote[],
    commit = true,
  ): number {
    const capacity = this.config.maxGainChangePerSec
    if (!Number.isFinite(capacity)) return requested
    const bucket = take(
      this.gainBuckets.get(target) ?? { tokens: capacity, atMs },
      capacity,
      capacity / 1000,
      atMs,
    )
    const delta = requested - current
    const allowed = Math.min(Math.abs(delta), bucket.tokens)
    const applied = allowed === Math.abs(delta) ? requested : current + Math.sign(delta) * allowed
    if (applied !== requested) {
      notes.push({
        rail: 'gain-slew',
        action: 'clamped',
        message: `${target}: change of ${round(delta)} exceeds ${capacity}/s; applied ${round(applied)}`,
        requested,
        applied,
      })
    }
    if (commit) this.gainBuckets.set(target, { ...bucket, tokens: bucket.tokens - allowed })
    return applied
  }

  // --- Loudness ceilings -------------------------------------------------------

  /**
   * A gain increase from `current` to `requested` on a path to the master is
   * checked against the short-term LUFS and true-peak ceilings using the
   * master's current reading (the whole mix is assumed to rise by the same
   * dB — conservative). Returns the value to apply; throws when `reject`.
   */
  guardLoudness(current: number, requested: number, notes: RailNote[], what: string): number {
    if (requested <= current || current <= 0) return requested
    const reading = this.config.loudnessReading?.() ?? null
    if (!reading) return requested
    const deltaDb = gainToDb(requested) - gainToDb(current)
    let allowedDb = deltaDb
    let rail: RailName | null = null
    let ceiling = 0
    let measured = 0
    if (
      reading.shortTermLufs !== undefined &&
      Number.isFinite(reading.shortTermLufs) &&
      reading.shortTermLufs + deltaDb > this.config.maxShortTermLufs
    ) {
      allowedDb = Math.min(allowedDb, this.config.maxShortTermLufs - reading.shortTermLufs)
      rail = 'loudness'
      ceiling = this.config.maxShortTermLufs
      measured = reading.shortTermLufs
    }
    if (
      reading.truePeakDb !== undefined &&
      Number.isFinite(reading.truePeakDb) &&
      reading.truePeakDb + deltaDb > this.config.maxTruePeakDb
    ) {
      const peakAllowed = this.config.maxTruePeakDb - reading.truePeakDb
      if (peakAllowed < allowedDb) {
        allowedDb = peakAllowed
        rail = 'true-peak'
        ceiling = this.config.maxTruePeakDb
        measured = reading.truePeakDb
      }
    }
    if (rail === null) return requested
    const applied = Math.max(current, current * dbToGain(allowedDb))
    const message =
      `${what}: +${round(deltaDb)} dB would put the mix at ${round(measured + deltaDb)} ` +
      `over the ${ceiling} ${rail === 'loudness' ? 'LUFS' : 'dBTP'} ceiling`
    if (this.config.loudnessMode === 'reject') throw new RailRejection(rail, message, requested)
    notes.push({
      rail,
      action: 'clamped',
      message: `${message}; applied ${round(applied)}`,
      requested,
      applied,
    })
    return applied
  }

  // --- Voice and silence ---------------------------------------------------------

  /** Refuse a hard mute or near-silence on the voice while speaking. */
  guardVoice(
    kind: 'mute' | 'level' | 'solo-other' | 'remove',
    speaking: boolean,
    value?: number,
  ): void {
    if (!this.config.protectVoice || !speaking) return
    switch (kind) {
      case 'mute':
        throw new RailRejection('voice', 'the voice cannot be muted while speaking')
      case 'level':
        if (value !== undefined && value < this.config.minVoiceLevel) {
          throw new RailRejection(
            'voice',
            `the voice level cannot go below ${this.config.minVoiceLevel} while speaking`,
            value,
          )
        }
        return
      case 'solo-other':
        throw new RailRejection(
          'voice',
          'soloing another strip would silence the voice while speaking',
        )
      case 'remove':
        throw new RailRejection('voice', 'the voice track cannot be removed while speaking')
      default: {
        const exhaustive: never = kind
        return exhaustive
      }
    }
  }

  /** Refuse hard mutes and removals of the music or ambience: the listener never sits in silence. */
  guardSilence(what: string): void {
    if (!this.config.noSilence) return
    throw new RailRejection(
      'no-silence',
      `${what} would leave the listener in silence; fade the level instead`,
    )
  }

  // --- Session growth --------------------------------------------------------------

  /** Cap an extension at the per-call maximum and the remaining headroom. */
  clampExtend(seconds: number, headroomSec: number, notes: RailNote[]): number {
    let granted = Math.floor(seconds)
    if (granted > this.config.maxExtendPerCallSec) {
      notes.push({
        rail: 'headroom',
        action: 'clamped',
        message: `extension ${granted} s capped at ${this.config.maxExtendPerCallSec} s per call`,
        requested: granted,
        applied: this.config.maxExtendPerCallSec,
      })
      granted = this.config.maxExtendPerCallSec
    }
    if (granted > headroomSec) {
      const applied = Math.max(0, Math.floor(headroomSec))
      notes.push({
        rail: 'headroom',
        action: 'clamped',
        message: `extension ${granted} s capped at the session headroom of ${applied} s`,
        requested: granted,
        applied,
      })
      granted = applied
    }
    return granted
  }

  /** Keep a fade inside the no-startle / no-stall bounds. */
  clampFade(seconds: number, notes: RailNote[]): number {
    return this.clampRange(seconds, this.config.minFadeSec, this.config.maxFadeSec, notes, 'fade')
  }

  /** A compact description for snapshots and docs. */
  describe(): Record<string, unknown> {
    return {
      levelRange: [...this.config.levelRange],
      maxShortTermLufs: this.config.maxShortTermLufs,
      maxTruePeakDb: this.config.maxTruePeakDb,
      maxGainChangePerSec: this.config.maxGainChangePerSec,
      protectVoice: this.config.protectVoice,
      noSilence: this.config.noSilence,
      maxExtendPerCallSec: this.config.maxExtendPerCallSec,
      consent: this.consents,
    }
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** The author every agent call defaults to when the consumer names none. */
export const AGENT_AUTHOR: Author = { id: 'agent', kind: 'agent' }
