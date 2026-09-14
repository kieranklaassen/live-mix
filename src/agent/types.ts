// Types of the agent control API (U29): tool definitions, call options and
// results, rail notes, the session hooks a consumer provides for concepts the
// score does not carry (sections, pace, dip logic), and the roles that tell
// the controller which strips are the voice, the music and the ambience.

import { type Author } from '../score/log'
import { type Operation, type OperationType } from '../score/operations'
import { type SteerDirection } from '../core/music/intensity'
import { type JsonSchema, type SchemaIssue } from './jsonSchema'

// --- Tools ------------------------------------------------------------------------------

/**
 * `operation`: one score operation (raw power, consent-gated where
 * structural); `intent`: musical vocabulary compiled to operations, engine
 * calls or session hooks; `query`: read-only; `control`: undo.
 */
export type ToolCategory = 'operation' | 'intent' | 'query' | 'control'

/** Consent scopes a consumer grants before an agent may use structural power. */
export type ConsentScope = 'arrange' | 'structure'

export interface RateLimit {
  /** Calls allowed back to back. */
  burst: number
  /** Sustained rate. */
  perMinute: number
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: JsonSchema
  category: ToolCategory
  consent?: ConsentScope
  rateLimit: RateLimit
  /** The score operation this tool applies, for `operation` tools. */
  operation?: OperationType
}

/** OpenAI Responses / Realtime flat function shape (what Breathwork Live's session registers). */
export interface OpenAiFunctionTool {
  type: 'function'
  name: string
  description: string
  parameters: JsonSchema
}

/** OpenAI Chat Completions nested shape. */
export interface OpenAiChatTool {
  type: 'function'
  function: { name: string; description: string; parameters: JsonSchema }
}

export interface AnthropicTool {
  name: string
  description: string
  input_schema: JsonSchema
}

// --- Calls -------------------------------------------------------------------------------

export interface CallOptions {
  /** Who is calling; defaults to the controller's author. */
  author?: Author
  /** Validate, run the rails and compile, but apply nothing and consume no budget. */
  dryRun?: boolean
  /** Wall-clock milliseconds; defaults to the controller's clock. */
  atMs?: number
}

export type RailName =
  | 'range'
  | 'loudness'
  | 'true-peak'
  | 'gain-slew'
  | 'voice'
  | 'rate-limit'
  | 'consent'
  | 'headroom'
  | 'fade'
  | 'no-silence'
  /** The U30 arbiter: a target another writer holds. */
  | 'arbitration'

export interface RailNote {
  rail: RailName
  /** `deferred`: the write waits for a hold to end (arbitration only). */
  action: 'clamped' | 'rejected' | 'deferred'
  message: string
  requested?: unknown
  applied?: unknown
}

export interface AppliedOperation {
  /** `OperationLog` sequence number. */
  seq: number
  type: OperationType
}

export type ToolErrorCode =
  | 'unknown_tool'
  | 'invalid_args'
  | 'unavailable'
  | 'consent_required'
  | 'rate_limited'
  | 'rejected'
  | 'failed'

export interface ToolSuccess {
  ok: true
  callId: number
  tool: string
  /** The prompt payload: what happened, in the tool's own vocabulary. */
  result: Record<string, unknown>
  /** Score operations applied by this call (empty for hooks-only and dry runs). */
  operations: AppliedOperation[]
  /** Clamps the rails applied on the way. */
  rails: RailNote[]
  dryRun: boolean
  /** Dry runs: the operations that would have been applied. */
  compiled?: Operation[]
}

export interface ToolFailure {
  ok: false
  callId: number
  tool: string
  error: {
    code: ToolErrorCode
    message: string
    retryAfterMs?: number
    issues?: SchemaIssue[]
  }
  rails: RailNote[]
  dryRun: boolean
}

export type ToolResult = ToolSuccess | ToolFailure

// --- Roles and session hooks -------------------------------------------------------------

/** Strip-host ids (score ids / engine names) the intents act on and the rails protect. */
export interface AgentRoles {
  /** The coach's voice: never hard-muted while speaking. */
  voice?: string
  /** The music track or group: volume, steering, ducking. */
  music?: string
  ambience?: string
  breathGuide?: string
  /** Device instance id of the voice-keyed ducker (its `depth` is the duck intent). */
  ducker?: string
}

/** One library track with the analysis the ladder needs. */
export interface AgentTrack {
  id: number | string
  title: string
  intensity: number
  camelot: string
  durationSec: number
  url?: string
  /** Loudness trim in dB, if the library carries one. */
  gainDb?: number
  /** Analysis energy 0..1, when known. */
  energy?: number
}

export interface AgentNowPlaying {
  id: number | string
  title: string
  camelot: string
  intensity: number
  remainingSec?: number
}

export interface AgentUpcoming {
  id: number | string
  title: string
  camelot: string
  startsInSec: number
}

export interface AgentSectionState {
  name: string
  intensity: number
  durationSec: number
}

/** What the session knows that the score does not; every field optional. */
export interface AgentSessionState {
  sectionIndex?: number
  sections?: AgentSectionState[]
  sectionRemainingSec?: number
  nowPlaying?: AgentNowPlaying
  upcoming?: AgentUpcoming[]
  paceMultiplier?: number
  musicVolume?: number
}

export interface SteerOutcome {
  nowPlaying: string
  /** Seconds the current section grew (the boundary moved). */
  boundaryShiftSec: number
  trackIds?: (number | string)[]
}

/**
 * Hooks a consumer supplies for the concepts it owns. Everything is optional:
 * a tool is listed when at least one of its backends is present. Breathwork
 * Live's conductor implements these over its section playlist.
 */
export interface AgentSession {
  describe?: () => AgentSessionState
  /** The whole library the ladder may pick from. */
  library?: () => readonly AgentTrack[]
  /** Track ids already played or planned; the ladder never re-picks them. */
  playedIds?: () => readonly (number | string)[]
  /**
   * Own the whole steer (resolver included). When absent the controller runs
   * the ladder over `library()` and hands the picks to `replaceUpcoming`.
   */
  steer?: (direction: SteerDirection, targetIntensity: number) => SteerOutcome | null
  /** Swap the unplayed remainder for `tracks`; returns the boundary shift (≥ 0). */
  replaceUpcoming?: (tracks: readonly AgentTrack[], maxDeltaSec: number) => number
  /** Seconds the session may still grow before its cap. */
  headroomSec?: () => number
  /** Returns the seconds actually appended. */
  extendSection?: (seconds: number) => number
  /** Returns the section index now playing. */
  advanceSection?: () => number
  /** Returns the applied pace multiplier. */
  setBreathPace?: (direction: 'slower' | 'faster') => number
  /** Returns the applied level. */
  setMusicVolume?: (level: number) => number
  setAmbience?: (level: number) => number
  /** Returns the applied depth. */
  setDuckDepth?: (depth: number) => number
  fadeOut?: (seconds: number) => void
  /** Whether the voice is speaking now (the voice rail). Default: assumed speaking. */
  isSpeaking?: () => boolean
}
