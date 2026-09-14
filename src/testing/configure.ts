// Optional test-runner integration. The mocks are framework-free by default;
// a runner can hand in its spy factory (vitest's `vi.fn`, jest's `jest.fn`) so
// `expect(node.connect).toHaveBeenCalledWith(...)` works on the recorded
// methods, and its timer advancer so `advance()` can drive fake timers.

/** Wraps an implementation in a runner-specific spy (e.g. `vi.fn`). */
export type SpyFactory = <F extends (...args: never[]) => unknown>(implementation: F) => F

/** Advances fake timers by `ms` (e.g. `vi.advanceTimersByTimeAsync`). */
export type TimerAdvancer = (ms: number) => unknown

export interface MockConfiguration {
  spy?: SpyFactory
  advanceTimers?: TimerAdvancer
}

const configuration: MockConfiguration = {}

/**
 * Configure the mocks for the current test runner. Call once from a setup
 * file, e.g. `configureMocks({ spy: vi.fn, advanceTimers: vi.advanceTimersByTimeAsync })`.
 */
export function configureMocks(next: MockConfiguration): void {
  configuration.spy = next.spy
  configuration.advanceTimers = next.advanceTimers
}

export function currentMockConfiguration(): Readonly<MockConfiguration> {
  return configuration
}

/** Wraps `implementation` in the configured spy, or returns it unchanged. */
export function spyOn<F extends (...args: never[]) => unknown>(implementation: F): F {
  return configuration.spy ? configuration.spy(implementation) : implementation
}
