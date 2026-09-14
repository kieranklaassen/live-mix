// The provider hands one Engine (and, optionally, a frame source) to every
// hook below it. Hooks that take an explicit object work without a provider;
// hooks that resolve by name or default to engine parts need one.

import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react'

import { type Engine } from '../../core/Engine'
import { defaultFrameScheduler, type FrameScheduler } from '../frame'

export interface LiveMixContextValue {
  /** Null until the app has created its engine (usually on the first user gesture). */
  engine: Engine | null
  frame: FrameScheduler
}

export const LiveMixContext = createContext<LiveMixContextValue | null>(null)

export interface LiveMixProviderProps {
  engine: Engine | null
  /** Frame source for playhead and meter sampling; defaults to `requestAnimationFrame`. */
  frame?: FrameScheduler
  children?: ReactNode
}

export function LiveMixProvider({ engine, frame, children }: LiveMixProviderProps) {
  const value = useMemo<LiveMixContextValue>(
    () => ({ engine, frame: frame ?? defaultFrameScheduler }),
    [engine, frame],
  )
  return createElement(LiveMixContext.Provider, { value }, children)
}

/** The provided engine, or null outside a provider / before one exists. */
export function useMaybeEngine(): Engine | null {
  return useContext(LiveMixContext)?.engine ?? null
}

/** The provided engine; throws when rendered without one. */
export function useEngine(): Engine {
  const engine = useMaybeEngine()
  if (!engine) throw missingEngine('useEngine')
  return engine
}

/**
 * An explicit object when given, else the matching part of the provided
 * engine. Hooks resolve their default target through this so the hook order
 * is the same with or without a provider.
 */
export function useEnginePart<T>(
  explicit: T | undefined,
  pick: (engine: Engine) => T,
  hook: string,
): T {
  const engine = useMaybeEngine()
  if (explicit !== undefined) return explicit
  if (!engine) throw missingEngine(hook)
  return pick(engine)
}

function missingEngine(hook: string): Error {
  return new Error(
    `live-mix/react: ${hook} needs an engine — render inside <LiveMixProvider engine={engine}> or pass the object to the hook`,
  )
}

/** The provider's frame source (the default one outside a provider). */
export function useFrameScheduler(): FrameScheduler {
  return useContext(LiveMixContext)?.frame ?? defaultFrameScheduler
}
