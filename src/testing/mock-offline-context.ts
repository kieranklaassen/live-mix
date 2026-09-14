// A recording `OfflineAudioContext`: the same node/param recording as
// `MockAudioContext`, plus `startRendering()` (resolves with a silent buffer
// of the requested shape unless a `render` hook synthesises one) and a
// `scheduleSnapshot()` that lists every source start/stop and AudioParam
// event the graph received — the thing offline-vs-live goldens compare.

import { MockAudioContext, type MockAudioContextOptions } from './mock-audio-context'
import { MockAudioBuffer, type MockBufferSource } from './mock-nodes'
import { type AutomationEvent } from './mock-audio-param'

export interface MockOfflineContextOptions extends MockAudioContextOptions {
  numberOfChannels?: number
  length?: number
  /** Synthesise the rendered buffer from the graph (default: silence of the right shape). */
  render?: (ctx: MockOfflineAudioContext) => MockAudioBuffer
}

export interface ScheduleSnapshot {
  sources: { start: unknown[][]; stop: unknown[][]; loop: boolean; bufferLength: number | null }[]
  params: { node: string; param: string; events: AutomationEvent[] }[]
}

export class MockOfflineAudioContext extends MockAudioContext {
  readonly numberOfChannels: number
  readonly length: number
  renderCount = 0
  private readonly render: ((ctx: MockOfflineAudioContext) => MockAudioBuffer) | undefined

  constructor(options: MockOfflineContextOptions = {}) {
    super(options)
    this.numberOfChannels = options.numberOfChannels ?? 2
    this.length = options.length ?? this.sampleRate
    this.render = options.render
  }

  startRendering(): Promise<MockAudioBuffer> {
    this.renderCount += 1
    this.currentTime = this.length / this.sampleRate
    return Promise.resolve(
      this.render?.(this) ??
        new MockAudioBuffer(this.numberOfChannels, this.length, this.sampleRate),
    )
  }

  /** Everything the graph was told, in creation order; identical inputs must give identical snapshots. */
  scheduleSnapshot(): ScheduleSnapshot {
    const sources = this.sources.map((source: MockBufferSource) => ({
      start: source.startCalls.calls.map((call) => [...call]),
      stop: source.stopCalls.calls.map((call) => [...call]),
      loop: source.loop,
      bufferLength: source.buffer?.length ?? null,
    }))
    const params: ScheduleSnapshot['params'] = []
    const record = (kind: string, index: number, name: string, events: AutomationEvent[]) => {
      if (events.length > 0) params.push({ node: `${kind}#${index}`, param: name, events })
    }
    this.gains.forEach((gain, index) => record('gain', index, 'gain', gain.gain.events))
    this.panners.forEach((panner, index) => record('panner', index, 'pan', panner.pan.events))
    this.sources.forEach((source, index) => {
      record('source', index, 'playbackRate', source.playbackRate.events)
      record('source', index, 'detune', source.detune.events)
    })
    this.filters.forEach((filter, index) => {
      record('filter', index, 'frequency', filter.frequency.events)
      record('filter', index, 'Q', filter.Q.events)
      record('filter', index, 'gain', filter.gain.events)
    })
    this.delays.forEach((delay, index) =>
      record('delay', index, 'delayTime', delay.delayTime.events),
    )
    return { sources, params }
  }
}

export function createMockOfflineContext(
  options: MockOfflineContextOptions = {},
): MockOfflineAudioContext {
  return new MockOfflineAudioContext(options)
}

/** The same snapshot from a live `MockAudioContext`, for offline-vs-live comparisons. */
export function scheduleSnapshotOf(ctx: MockAudioContext): ScheduleSnapshot {
  return MockOfflineAudioContext.prototype.scheduleSnapshot.call(ctx)
}
