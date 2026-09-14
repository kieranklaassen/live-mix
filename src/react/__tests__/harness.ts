// Shared fixtures for the hook tests: an engine on the recording mock context
// with inert timers, a hand-driven frame scheduler, and a provider wrapper.

import { createElement, type ReactNode } from 'react'

import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { createEngine, type Engine, type EngineOptions } from '../../core/Engine'
import { type FrameScheduler } from '../frame'
import { LiveMixProvider } from '../hooks/useEngine'

/** Frames fire only when a test calls `flush(timeMs)`. */
export class ManualFrames implements FrameScheduler {
  private readonly pending = new Map<number, (timeMs: number) => void>()
  private nextId = 1
  requests = 0
  cancels = 0

  request(callback: (timeMs: number) => void): unknown {
    const id = this.nextId++
    this.pending.set(id, callback)
    this.requests += 1
    return id
  }

  cancel(handle: unknown): void {
    if (typeof handle === 'number' && this.pending.delete(handle)) this.cancels += 1
  }

  get size(): number {
    return this.pending.size
  }

  /** Run every pending frame callback with `timeMs` (callbacks re-request for the next frame). */
  flush(timeMs: number): void {
    const callbacks = [...this.pending.values()]
    this.pending.clear()
    for (const callback of callbacks) callback(timeMs)
  }
}

export interface TestEngine {
  ctx: MockAudioContext
  engine: Engine
  frames: ManualFrames
  wrapper: ({ children }: { children: ReactNode }) => ReactNode
}

/** An engine whose scheduler and automation timers never fire on their own. */
export function createTestEngine(options: Partial<EngineOptions> = {}): TestEngine {
  const ctx = createMockContext({ sampleRate: 48_000 })
  const engine = createEngine({
    context: asAudioContext(ctx),
    master: { meter: true },
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
    setTimeoutFn: () => 0 as unknown as ReturnType<typeof setTimeout>,
    clearTimeoutFn: () => {},
    ...options,
  })
  const frames = new ManualFrames()
  const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
    createElement(LiveMixProvider, { engine, frame: frames }, children)
  return { ctx, engine, frames, wrapper }
}
