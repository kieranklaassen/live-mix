// Arbitration state for panels (U30): who holds what, which agent writes
// are waiting, which lanes a hand has paused — over `Arbiter.onChange` — plus
// the touch/lock controls. `useArbiterTarget` is the per-control shape: the
// badge next to a fader that reads "held by you" or "coach pending".

import { useCallback, useMemo } from 'react'

import { type Hold, type Lock } from '../../core/params/arbitration'
import {
  type Arbiter,
  type ArbiterResult,
  type LockOptions,
  type PendingWrite,
  type TargetState,
} from '../../score/Arbiter'
import { type Author } from '../../score/log'
import { type Operation } from '../../score/operations'
import { type ParamTarget } from '../../score/schema'
import { type ApplyOptions } from '../../score/ScoreDocument'
import { useExternalSnapshot } from '../store'
import { useMaybeArbiter } from './useEngine'

export interface ArbiterSnapshot {
  holds: Hold[]
  locks: Lock[]
  pending: PendingWrite[]
  /** Bumped on every arbiter event. */
  revision: number
}

export interface ArbiterControls {
  /** Apply through the policy (defaults to the arbiter's author — the human). */
  apply(op: Operation, options?: ApplyOptions): ArbiterResult
  touch(target: ParamTarget | string, author?: Author): void
  release(target?: ParamTarget | string, author?: Author): void
  clearHold(target: ParamTarget | string): void
  lock(target: ParamTarget | string, options?: LockOptions): void
  unlock(target: ParamTarget | string): void
  /** Retire a deferred write by ticket. */
  cancel(ticket: number): boolean
  /** Hand paused lanes back (all of them without a target). */
  releaseAutomation(target?: ParamTarget | string): void
  stateOf(target: ParamTarget | string): TargetState
  undo(): void
  redo(): void
}

export type UseArbiterResult = ArbiterSnapshot & ArbiterControls & { arbiter: Arbiter }

interface Revision {
  arbiter: Arbiter
  revision: number
}

/** Of one arbiter and at one count: the count alone hands a hook given another arbiter the last one's state. */
function sameRevision(a: Revision, b: Revision): boolean {
  return a.arbiter === b.arbiter && a.revision === b.revision
}

/** And of one target: a control given another target is given no event to read it by. */
function sameTargetRevision(
  a: Revision & { state: TargetState },
  b: Revision & { state: TargetState },
): boolean {
  return sameRevision(a, b) && a.state.key === b.state.key
}

function useArbiterSubscription(arbiter: Arbiter) {
  return useCallback((onChange: () => void) => arbiter.onChange(() => onChange()), [arbiter])
}

function resolveArbiter(
  explicit: Arbiter | undefined,
  provided: Arbiter | null,
  hook: string,
): Arbiter {
  const arbiter = explicit ?? provided
  if (!arbiter) {
    throw new Error(
      `live-mix/react: ${hook} needs an arbiter — pass one or render inside <LiveMixProvider arbiter={arbiter}>`,
    )
  }
  return arbiter
}

/** Holds, locks and pending writes of an arbiter (the provided one by default), with its controls. */
export function useArbiter(arbiter?: Arbiter): UseArbiterResult {
  const target = resolveArbiter(arbiter, useMaybeArbiter(), 'useArbiter')
  const subscribe = useArbiterSubscription(target)
  const read = useCallback(
    (): ArbiterSnapshot & Revision => ({
      arbiter: target,
      holds: target.holds(),
      locks: target.locks(),
      pending: target.pending(),
      revision: target.revision,
    }),
    [target],
  )
  const snapshot = useExternalSnapshot(subscribe, read, sameRevision)
  const controls = useMemo<ArbiterControls>(
    () => ({
      apply: (op, options) => target.apply(op, options),
      touch: (key, author) => {
        target.touch(key, author)
      },
      release: (key, author) => target.release(key, author),
      clearHold: (key) => target.clearHold(key),
      lock: (key, options) => {
        target.lock(key, options)
      },
      unlock: (key) => target.unlock(key),
      cancel: (ticket) => target.cancel(ticket),
      releaseAutomation: (key) => target.releaseAutomation(key),
      stateOf: (key) => target.stateOf(key),
      undo: () => {
        target.undo()
      },
      redo: () => {
        target.redo()
      },
    }),
    [target],
  )
  return { ...snapshot, ...controls }
}

export interface UseArbiterTargetResult extends TargetState {
  /** Held by the arbiter's own author (the local human). */
  heldByMe: boolean
  /** Held or locked by someone else; `holder` says whom. */
  heldByOther: boolean
  /** An agent write is waiting on this target. */
  agentPending: boolean
  /** Short status for a badge: `''`, `held by you`, `held by coach`, `coach pending`, `locked by rails`. */
  status: string
  touch(): void
  release(): void
}

/** The arbitration state of one control, re-read on every arbiter event. */
export function useArbiterTarget(
  target: ParamTarget | string,
  arbiter?: Arbiter,
): UseArbiterTargetResult {
  const source = resolveArbiter(arbiter, useMaybeArbiter(), 'useArbiterTarget')
  const subscribe = useArbiterSubscription(source)
  // Keyed by content so a fresh target literal per render does not resubscribe.
  const key = typeof target === 'string' ? target : JSON.stringify(target)
  const stable = useMemo(() => target, [key])
  const read = useCallback(
    () => ({ arbiter: source, state: source.stateOf(stable), revision: source.revision }),
    [source, stable],
  )
  const { state } = useExternalSnapshot(subscribe, read, sameTargetRevision)
  const me = source.author
  const heldByMe =
    state.holder !== null && state.holder.id === me.id && state.holder.kind === me.kind
  const heldByOther = state.holder !== null && !heldByMe
  const agentPending = state.pending.some((pending) => pending.author.kind === 'agent')
  const status = heldByMe
    ? 'held by you'
    : heldByOther && state.holder
      ? `${state.lock ? 'locked' : 'held'} by ${state.holder.id}`
      : agentPending
        ? `${state.pending.find((pending) => pending.author.kind === 'agent')?.author.id ?? 'agent'} pending`
        : ''
  const touch = useCallback(() => {
    source.touch(stable)
  }, [source, stable])
  const release = useCallback(() => {
    source.release(stable)
  }, [source, stable])
  return { ...state, heldByMe, heldByOther, agentPending, status, touch, release }
}
