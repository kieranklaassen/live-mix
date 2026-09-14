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
  const wrapped: AgentSession = { ...session }
  const advance = session.advanceSection
  if (advance && onAdvance) {
    wrapped.advanceSection = () => {
      const index = advance()
      versions.checkpoint('section', sectionLabel(index))
      return index
    }
  }
  const fade = session.fadeOut
  if (fade && onFadeOut) {
    wrapped.fadeOut = (seconds) => {
      versions.checkpoint('end')
      fade(seconds)
    }
  }
  return wrapped
}
