// Advances the mock audio clock and the runner's fake timers together, in
// small steps, so interval-driven schedulers see a clock that moves between
// ticks the way a real AudioContext does. Lifted from the Breathwork Live
// harness (`advance(ctx, seconds)`).

import { currentMockConfiguration } from './configure'
import { type MockAudioContext } from './mock-audio-context'

export async function advance(ctx: MockAudioContext, seconds: number, stepMs = 50): Promise<void> {
  const { advanceTimers } = currentMockConfiguration()
  const steps = Math.ceil((seconds * 1000) / stepMs)
  for (let i = 0; i < steps; i += 1) {
    ctx.currentTime += stepMs / 1000
    if (advanceTimers) await advanceTimers(stepMs)
  }
}
