import { describe, expect, it, vi } from 'vitest'

import { MockAudioBuffer, MockAudioNode, asAudioContext, createMockContext } from '../../../testing'
import { TempoMap } from '../../time/TempoMap'
import {
  StretchSource,
  semitonesToRate,
  warpRateAt,
  warpSegments,
  warpSourceSecAt,
  type StretchNode,
  type StretchNodeFactory,
  type StretchScheduleChange,
} from '../StretchSource'

/** A stand-in for the signalsmith-stretch node that records what it is told. */
class FakeStretchNode extends MockAudioNode {
  readonly scheduled: StretchScheduleChange[] = []
  readonly buffers: Float32Array[][] = []
  readonly configured: unknown[] = []
  dropped = 0
  inputTime = 0
  constructor(readonly channelOptions?: Partial<AudioWorkletNodeOptions>) {
    super('stretch')
  }
  schedule(change: StretchScheduleChange): void {
    this.scheduled.push(change)
  }
  start(when?: number, offset?: number, duration?: number): void {
    this.schedule({ output: when, active: true, input: offset })
    if (duration !== undefined && when !== undefined)
      this.schedule({ output: when + duration, active: false })
  }
  stop(when?: number): void {
    this.schedule({ output: when, active: false })
  }
  addBuffers(buffers: readonly Float32Array[]): Promise<number> {
    this.buffers.push([...buffers])
    return Promise.resolve(buffers[0].length / 48000)
  }
  dropBuffers(): Promise<unknown> {
    this.dropped += 1
    return Promise.resolve({ start: 0, end: 0 })
  }
  latency(): number {
    return 0.12
  }
  configure(options: unknown): void {
    this.configured.push(options)
  }
}

const nodes: FakeStretchNode[] = []
const createStretch: StretchNodeFactory = (_ctx, channelOptions) => {
  const node = new FakeStretchNode(channelOptions)
  nodes.push(node)
  return Promise.resolve(node as unknown as StretchNode)
}

describe('warp segments', () => {
  const tempo = TempoMap.constant(120) // 0.5 s per beat

  it('derives piecewise rates from markers on the tempo map', () => {
    // Source beats fall every 0.6 s (100 bpm material) → rate 1.2 at 120 bpm.
    const segments = warpSegments(
      [
        { sourceSec: 0, beat: 0 },
        { sourceSec: 0.6, beat: 1 },
        { sourceSec: 1.2, beat: 2 },
      ],
      tempo,
    )
    expect(segments).toEqual([
      { atSec: 0, sourceSec: 0, rate: 1.2 },
      { atSec: 0.5, sourceSec: 0.6, rate: 1.2 },
      { atSec: 1, sourceSec: 1.2, rate: 1.2 },
    ])
    expect(warpRateAt(segments, 0.75)).toBeCloseTo(1.2)
    expect(warpSourceSecAt(segments, 0.75)).toBeCloseTo(0.9)
    expect(warpSourceSecAt(segments, 2)).toBeCloseTo(2.4)
  })

  it('handles uneven markers, clip position, tail rate and validation', () => {
    const segments = warpSegments(
      [
        { sourceSec: 0, beat: 0 },
        { sourceSec: 1, beat: 1 }, // 1 s of source in 0.5 s → 2×
        { sourceSec: 1.25, beat: 2 }, // 0.25 s in 0.5 s → 0.5×
      ],
      tempo,
      { clipStartSec: 10, tailRate: 1 },
    )
    expect(segments.map((s) => s.rate)).toEqual([2, 0.5, 1])
    expect(segments.map((s) => s.atSec)).toEqual([0, 0.5, 1])
    expect(warpRateAt(segments, 0.4)).toBe(2)
    expect(warpRateAt(segments, 0.6)).toBe(0.5)
    expect(warpRateAt(segments, 5)).toBe(1)
    expect(warpSegments([], tempo)).toEqual([])
    expect(() =>
      warpSegments(
        [
          { sourceSec: 0, beat: 0 },
          { sourceSec: 0, beat: 1 },
        ],
        tempo,
      ),
    ).toThrow(/increasing sourceSec/)
    expect(() =>
      warpSegments(
        [
          { sourceSec: 0, beat: 1 },
          { sourceSec: 1, beat: 1 },
        ],
        tempo,
      ),
    ).toThrow(/increasing beats/)
  })

  it('follows tempo changes in the map', () => {
    const changing = new TempoMap([
      { atSec: 0, bpm: 120 },
      { atSec: 1, bpm: 60 },
    ])
    // Beat 2 at 120 is 1 s; beat 3 at 60 is 2 s: one source second per beat → rates 2 then 1.
    const segments = warpSegments(
      [
        { sourceSec: 0, beat: 0 },
        { sourceSec: 2, beat: 2 },
        { sourceSec: 3, beat: 3 },
      ],
      changing,
    )
    expect(segments.map((s) => [s.atSec, s.rate])).toEqual([
      [0, 2],
      [1, 1],
      [2, 1],
    ])
  })

  it('semitonesToRate is the 12-TET ratio', () => {
    expect(semitonesToRate(0)).toBe(1)
    expect(semitonesToRate(12)).toBe(2)
    expect(semitonesToRate(-12)).toBe(0.5)
    expect(semitonesToRate(7)).toBeCloseTo(1.4983, 3)
  })
})

describe('StretchSource', () => {
  function buffer(seconds: number, channels = 2) {
    const ctx = createMockContext({ sampleRate: 48000 })
    return {
      ctx,
      buffer: new MockAudioBuffer(channels, seconds * 48000, 48000) as unknown as AudioBuffer,
    }
  }

  it('creates the node with a stereo output, configures it and loads every channel', async () => {
    nodes.length = 0
    const { ctx, buffer: buf } = buffer(10)
    const source = await StretchSource.create(asAudioContext(ctx), {
      id: 'a',
      buffer: buf,
      createStretch,
      configure: { preset: 'cheaper' },
    })
    const node = nodes[0]
    expect(node.channelOptions).toMatchObject({
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })
    expect(node.configured).toEqual([{ preset: 'cheaper' }])
    expect(node.buffers).toHaveLength(1)
    expect(node.buffers[0]).toHaveLength(2)
    expect(source.kind).toBe('stretch')
    expect(source.durationSec).toBe(10)
    expect(source.latencySec).toBe(0.12)
    expect(source.inputTimeSec).toBe(0)
    const dest = ctx.createGain()
    source.connect(dest as unknown as AudioNode)
    expect(node.isConnectedTo(dest)).toBe(true)
  })

  it('schedules a constant-rate play with pitch, loop and an end', async () => {
    nodes.length = 0
    const { ctx, buffer: buf } = buffer(10)
    const source = await StretchSource.create(asAudioContext(ctx), {
      id: 'a',
      buffer: buf,
      createStretch,
    })
    const changes = source.play({
      when: 5,
      offsetSec: 1.5,
      durationSec: 4,
      rate: 0.9,
      semitones: -2,
      loop: { startSec: 1, endSec: 3 },
    })
    expect(changes).toEqual([
      { output: 5, active: true, semitones: -2, loopStart: 1, loopEnd: 3, input: 1.5, rate: 0.9 },
      { output: 9, active: false },
    ])
    expect(nodes[0].scheduled).toEqual(changes)
  })

  it('schedules one change per warp segment, positioned from the play time', async () => {
    nodes.length = 0
    const { ctx, buffer: buf } = buffer(10)
    const source = await StretchSource.create(asAudioContext(ctx), {
      id: 'a',
      buffer: buf,
      createStretch,
    })
    const warp = warpSegments(
      [
        { sourceSec: 0, beat: 0 },
        { sourceSec: 1, beat: 1 },
        { sourceSec: 1.25, beat: 2 },
      ],
      TempoMap.constant(120),
    )
    const changes = source.play({ when: 20, warp, semitones: 1 })
    expect(changes).toEqual([
      { output: 20, active: true, semitones: 1, input: 0, rate: 2 },
      { output: 20.5, input: 1, rate: 0.5 },
      { output: 21, input: 1.25, rate: 0.5 },
    ])
  })

  it('setRate / setSemitones / stop schedule at now by default; dispose silences and drops buffers', async () => {
    nodes.length = 0
    const { ctx, buffer: buf } = buffer(2, 1)
    ctx.currentTime = 3
    const source = await StretchSource.create(asAudioContext(ctx), {
      id: 'm',
      buffer: buf,
      createStretch,
    })
    expect(nodes[0].channelOptions?.outputChannelCount).toEqual([1])
    source.setRate(1.5)
    source.setSemitones(3, 4)
    source.stop()
    expect(nodes[0].scheduled).toEqual([
      { output: 3, rate: 1.5 },
      { output: 4, semitones: 3 },
      { output: 3, active: false },
    ])
    source.dispose()
    source.dispose()
    expect(nodes[0].scheduled.at(-1)).toEqual({ active: false })
    expect(nodes[0].dropped).toBe(1)
    expect(source.play({ when: 5 })).toEqual([])
    const spy = vi.fn()
    void spy
  })
})
