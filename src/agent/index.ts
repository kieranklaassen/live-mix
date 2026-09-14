// Agent control API (U29): a tool surface over the score, the engine and the
// consumer's session — schema-described operations and intents, safety rails
// that outrank the agent, an audit trail, and a prompt-sized state snapshot.

export {
  AgentController,
  createAgentController,
  type AgentControllerOptions,
  type SnapshotListener,
} from './AgentController'
export { AgentAuditLog, type AuditEntry, type AuditOutcome } from './audit'
export {
  MORE_SPACE_DUCK_STEP,
  MORE_SPACE_MUSIC_DB,
  compileSteerToScore,
  intentTools,
} from './intents'
export {
  collectRefs,
  formatIssues,
  validateSchema,
  withDefs,
  type JsonSchema,
  type JsonSchemaType,
  type SchemaIssue,
} from './jsonSchema'
export {
  OPERATION_DEFS,
  operationDescription,
  operationForToolName,
  operationSchema,
  toolNameForOperation,
} from './operationSchemas'
export { consentForBatch, consentForOperation, guardOperation, operationTools } from './operations'
export {
  AGENT_AUTHOR,
  DEFAULT_RAILS,
  DEFAULT_RATE_LIMITS,
  RailRejection,
  Rails,
  resolveRails,
  type AgentRailsConfig,
  type AgentRailsOptions,
  type LoudnessReading,
} from './rails'
export {
  TOOL_NAME_PATTERN,
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
export {
  SNAPSHOT_MAX_DEVICES,
  SNAPSHOT_MAX_UPCOMING,
  SNAPSHOT_RECENT_CALLS,
  SNAPSHOT_SUMMARY_CHARS,
  buildSnapshot,
  diffSnapshots,
  metersOf,
  type AgentSnapshot,
  type SnapshotCall,
  type SnapshotDevice,
  type SnapshotDiff,
  type SnapshotInputs,
  type SnapshotMeters,
  type SnapshotMusic,
  type SnapshotSession,
  type SnapshotTransport,
} from './snapshot'
export type {
  AgentNowPlaying,
  AgentRoles,
  AgentSectionState,
  AgentSession,
  AgentSessionState,
  AgentTrack,
  AgentUpcoming,
  AnthropicTool,
  AppliedOperation,
  CallOptions,
  ConsentScope,
  OpenAiChatTool,
  OpenAiFunctionTool,
  RailName,
  RailNote,
  RateLimit,
  SteerOutcome,
  ToolCategory,
  ToolDefinition,
  ToolErrorCode,
  ToolFailure,
  ToolResult,
  ToolSuccess,
} from './types'
export * from './score-authoring'
