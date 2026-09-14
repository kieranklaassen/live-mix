// The tool registry (KTD9): every capability is `{ name, schema, plan,
// rails }`. A tool *plans* — validates, runs the rails, compiles to score
// operations and side effects — and the controller applies the plan, so dry
// runs and the audit trail fall out of one path. `listTools` exports the
// catalogue in a neutral shape and in the OpenAI / Anthropic shapes a model
// session registers directly.

import { type Engine } from '../core/Engine'
import { type Author } from '../score/log'
import { type Operation } from '../score/operations'
import { type ScoreDocument } from '../score/ScoreDocument'
import { type AgentAuditLog } from './audit'
import { type JsonSchema } from './jsonSchema'
import { type Rails } from './rails'
import { type AgentSnapshot } from './snapshot'
import {
  type AgentRoles,
  type AgentSession,
  type AgentTrack,
  type AnthropicTool,
  type OpenAiChatTool,
  type OpenAiFunctionTool,
  type RailNote,
  type RateLimit,
  type ToolDefinition,
} from './types'

/** What a tool may read while planning: the controller's backends and state. */
export interface ControllerView {
  readonly document: ScoreDocument | null
  readonly engine: Engine | null
  readonly session: AgentSession
  readonly roles: AgentRoles
  readonly rails: Rails
  readonly audit: AgentAuditLog
  /** The library the compiled steer path picks from (session `library()` or the option). */
  library(): readonly AgentTrack[]
  /** Whether the voice is speaking now; assumed true without a session hook. */
  speaking(): boolean
  /** Audio-clock seconds (0 without an engine). */
  nowSec(): number
  /** Seconds the session may still grow. */
  headroomSec(): number
  /** Record growth against the controller's own growth budget. */
  noteGrowth(seconds: number): void
  /** The state snapshot, for the query tool. */
  snapshot(): AgentSnapshot
}

export interface ToolContext {
  view: ControllerView
  /** The id this call gets in the audit trail. */
  callId: number
  author: Author
  atMs: number
  dryRun: boolean
  /** Clamps the rails applied while planning. */
  notes: RailNote[]
}

/** What a tool wants done; the controller applies operations, then runs effects. */
export interface ToolPlan {
  /** Score operations to apply in order (each is one log entry). */
  operations: Operation[]
  /**
   * Side effects outside the score (engine calls, session hooks), run after
   * the operations and never in a dry run; returned fragments merge into the
   * result.
   */
  effects: (() => Record<string, unknown> | void)[]
  /** The prompt payload; effect fragments merge over it. */
  result: Record<string, unknown>
  /** Undo/log label. */
  label: string
}

export interface ToolSpec {
  definition: Omit<ToolDefinition, 'rateLimit'> & { rateLimit?: RateLimit }
  /** Whether the tool can run against the current backends. */
  available(view: ControllerView): boolean
  /** Validated args in, plan out; throws `RailRejection` or `ToolError`. */
  plan(args: Record<string, unknown>, ctx: ToolContext): ToolPlan
}

/** Thrown by a tool when the request is well-formed but cannot be done now. */
export class ToolError extends Error {
  readonly code: 'unavailable' | 'rejected' | 'failed'

  constructor(code: 'unavailable' | 'rejected' | 'failed', message: string) {
    super(message)
    this.name = 'ToolError'
    this.code = code
  }
}

export const TOOL_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

export class ToolRegistry {
  private readonly specs = new Map<string, ToolSpec>()

  register(spec: ToolSpec): this {
    const name = spec.definition.name
    if (!TOOL_NAME_PATTERN.test(name)) {
      throw new Error(`live-mix: tool name "${name}" must match ${TOOL_NAME_PATTERN}`)
    }
    if (this.specs.has(name)) throw new Error(`live-mix: tool "${name}" is already registered`)
    this.specs.set(name, spec)
    return this
  }

  get(name: string): ToolSpec | undefined {
    return this.specs.get(name)
  }

  has(name: string): boolean {
    return this.specs.has(name)
  }

  get names(): string[] {
    return [...this.specs.keys()]
  }

  /** Every registered spec, in registration order. */
  all(): ToolSpec[] {
    return [...this.specs.values()]
  }

  /** The specs that can run against `view`. */
  available(view: ControllerView): ToolSpec[] {
    return this.all().filter((spec) => spec.available(view))
  }

  /** Definitions of the available tools with their effective rate limits. */
  definitions(view: ControllerView): ToolDefinition[] {
    return this.available(view).map((spec) => ({
      ...spec.definition,
      rateLimit: spec.definition.rateLimit ?? view.rails.rateLimitFor(spec.definition.name),
    }))
  }
}

// --- Export shapes ------------------------------------------------------------------------

export interface ToOpenAiToolsOptions {
  /** `responses` (Responses API / Realtime, flat) or `chat` (Chat Completions, nested). Default `responses`. */
  shape?: 'responses' | 'chat'
}

export function toOpenAiTools(
  tools: readonly ToolDefinition[],
  options?: { shape?: 'responses' },
): OpenAiFunctionTool[]
export function toOpenAiTools(
  tools: readonly ToolDefinition[],
  options: { shape: 'chat' },
): OpenAiChatTool[]
export function toOpenAiTools(
  tools: readonly ToolDefinition[],
  options: ToOpenAiToolsOptions = {},
): OpenAiFunctionTool[] | OpenAiChatTool[] {
  if (options.shape === 'chat') {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: stripDescription(tool.parameters),
      },
    }))
  }
  return tools.map((tool) => ({
    type: 'function' as const,
    name: tool.name,
    description: tool.description,
    parameters: stripDescription(tool.parameters),
  }))
}

export function toAnthropicTools(tools: readonly ToolDefinition[]): AnthropicTool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: stripDescription(tool.parameters),
  }))
}

/** The root description duplicates the tool description; drop it from the exported parameters. */
function stripDescription(schema: JsonSchema): JsonSchema {
  const rest: JsonSchema = { ...schema }
  delete rest.description
  return rest
}
