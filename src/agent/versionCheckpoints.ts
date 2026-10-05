// Automatic version checkpoints at the session milestones the agent hooks
// expose (U30): wrap a consumer's `AgentSession` so a section advance saves
// a `section` checkpoint and a fade-out saves `end`. `VersionHistory` takes
// `start` itself (on construction and every `load`). Everything else on the
// session passes through untouched.

import { type VersionHistory } from '../score/versions'
import { type AgentSession } from './types'

export interface VersionCheckpointOptions {
  /** Checkpoint after `advanceSection` (default true). */
  onAdvance?: boolean
  /** Checkpoint before `fadeOut` (default true). */
  onFadeOut?: boolean
  /** Label for a section checkpoint; receives the index `advanceSection` returned. */
  sectionLabel?: (sectionIndex: number) => string
}

/** `new AgentController({ session: withVersionCheckpoints(session, versions) })`. */
export function withVersionCheckpoints(
  session: AgentSession,
  versions: VersionHistory,
  options: VersionCheckpointOptions = {},
): AgentSession {
  const onAdvance = options.onAdvance ?? true
  const onFadeOut = options.onFadeOut ?? true
  const sectionLabel = options.sectionLabel ?? ((index: number) => `Section ${index + 1}`)
  const wrapped = hooksOf(session)
  const advance = wrapped.advanceSection
  if (advance && onAdvance) {
    wrapped.advanceSection = () => {
      const index = advance()
      versions.checkpoint('section', sectionLabel(index))
      return index
    }
  }
  const fade = wrapped.fadeOut
  if (fade && onFadeOut) {
    wrapped.fadeOut = (seconds) => {
      versions.checkpoint('end')
      fade(seconds)
    }
  }
  return wrapped
}

/**
 * The session's hooks, each bound to the session it came from, beside whatever
 * else it carries. A spread alone copies only what the object holds itself, so
 * a session that is an instance of a class came back without its class's hooks,
 * and a hook taken off its session and called bare had no `this` to keep its
 * state on.
 */
function hooksOf(session: AgentSession): AgentSession {
  const hooks: Record<string, unknown> = { ...session }
  for (
    let from: object | null = session;
    from !== null && from !== Object.prototype;
    from = Object.getPrototypeOf(from) as object | null
  ) {
    for (const name of Object.getOwnPropertyNames(from)) {
      if (name === 'constructor') continue
      const value = (session as Record<string, unknown>)[name]
      if (typeof value === 'function') {
        hooks[name] = (value as (...args: unknown[]) => unknown).bind(session)
      }
    }
  }
  return hooks
}
