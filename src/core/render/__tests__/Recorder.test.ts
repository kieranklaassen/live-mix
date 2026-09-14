import { describe, expect, it } from 'vitest'

import {
  MockAudioWorkletNode,
  asAudioContext,
  createMockContext,
  type MockAudioContext,
} from '../../../testing'
import { Bus } from '../../buses/Bus'
import { decodeWav, encodeWav } from '../encode'
import {
  MediaStreamRecorder,
  WorkletRecorder,
  createRecorder,
  type MediaRecorderLike,
} from '../Recorder'
import { RECORDER_PROCESSOR_NAME, type RecorderHostMessage } from '../recorder-protocol'

function setup() {
  const ctx = createMockContext({ sampleRate: 48000 })
  const destination = ctx.createGain()
  const bus = new Bus(asAudioContext(ctx), {
    name: 'music',
    destination: destination as unknown as AudioNode,
  })
  return { ctx, bus }
}

async function workletRecorder(ctx: MockAudioContext, source: Bus | AudioNode) {
  const recorder = await WorkletRecorder.create(asAudioContext(ctx), source, {
    processorUrl: 'blob:recorder',
    chunkFrames: 256,
    createNode: (context, name, options) =>
      (context as unknown as MockAudioContext).createWorkletNode(
        name,
        options,
      ) as unknown as AudioWorkletNode,
  })
  const node = ctx.workletNodes[0]
  return { recorder, node }
}

describe('WorkletRecorder', () => {
  it('loads the processor once, builds a sink node and taps the source', async () => {
    const { ctx, bus } = setup()
    const { recorder, node } = await workletRecorder(ctx, bus)
    expect(ctx.audioWorklet.modules).toEqual(['blob:recorder'])
    expect(node.name).toBe(RECORDER_PROCESSOR_NAME)
    expect(node.options).toMatchObject({
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 2,
      processorOptions: { channelCount: 2, chunkFrames: 256 },
    })
    expect(bus.output.connectCalls.calledWith(node)).toBe(true)
    expect(recorder.state).toBe('idle')
    expect(recorder.input).toBe(node)
  })

  it('start/stop drive the port and assemble chunks into planar audio', async () => {
    const { ctx, bus } = setup()
    const { recorder, node } = await workletRecorder(ctx, bus)
    recorder.start(1.25)
    expect(recorder.state).toBe('recording')
    expect(node.port.posted.calls[0]?.[0]).toEqual({ type: 'start', at: 1.25 })

    const stopped = recorder.stop()
    expect(node.port.posted.calls[1]?.[0]).toEqual({ type: 'stop' })

    const first: RecorderHostMessage = {
      type: 'chunk',
      channels: [Float32Array.from([0.1, 0.2, 0.3]), Float32Array.from([-0.1, -0.2, -0.3])],
      frames: 3,
      startFrame: 0,
    }
    const second: RecorderHostMessage = {
      type: 'chunk',
      channels: [Float32Array.from([0.4, 0.5]), Float32Array.from([-0.4, -0.5])],
      frames: 2,
      startFrame: 3,
    }
    node.port.receive(first)
    node.port.receive(second)
    node.port.receive({ type: 'stopped', totalFrames: 5 } satisfies RecorderHostMessage)

    const recording = await stopped
    expect(recording.kind).toBe('planar')
    expect(recording.audio.sampleRate).toBe(48000)
    expect(recording.durationSec).toBeCloseTo(5 / 48000)
    expect(Array.from(recording.audio.channels[0])).toEqual([0.1, 0.2, 0.3, 0.4, 0.5].map(Math.fround))
    expect(Array.from(recording.audio.channels[1])).toEqual(
      [-0.1, -0.2, -0.3, -0.4, -0.5].map(Math.fround),
    )
    expect(recorder.state).toBe('stopped')

    const decoded = decodeWav(encodeWav(recording.audio, { bitDepth: 32 }))
    expect(Array.from(decoded.channels[0])).toEqual(Array.from(recording.audio.channels[0]))
  })

  it('pads to totalFrames, duplicates mono chunks across channels and exposes partial capture', async () => {
    const { ctx, bus } = setup()
    const { recorder, node } = await workletRecorder(ctx, bus)
    recorder.start()
    node.port.receive({
      type: 'chunk',
      channels: [Float32Array.from([1, 1])],
      frames: 2,
      startFrame: 0,
    } satisfies RecorderHostMessage)
    const partial = recorder.captured()
    expect(Array.from(partial.channels[1])).toEqual([1, 1])

    const stopped = recorder.stop()
    node.port.receive({ type: 'stopped', totalFrames: 4 } satisfies RecorderHostMessage)
    const recording = await stopped
    expect(Array.from(recording.audio.channels[0])).toEqual([1, 1, 0, 0])
  })

  it('stop while idle resolves with what has been captured; dispose disconnects', async () => {
    const { ctx, bus } = setup()
    const { recorder, node } = await workletRecorder(ctx, bus)
    const recording = await recorder.stop()
    expect(recording.audio.channels[0].length).toBe(0)
    recorder.dispose()
    expect(bus.output.disconnectCalls.calls.some((call) => call[0] === node)).toBe(true)
    recorder.start()
    expect(recorder.state).toBe('idle')
  })

  it('accepts a raw AudioNode source and defaults to worklet mode via createRecorder', async () => {
    const { ctx } = setup()
    const gain = ctx.createGain()
    const recorder = await createRecorder(asAudioContext(ctx), gain as unknown as AudioNode, {
      processorUrl: 'blob:recorder',
      createNode: (context, name, options) =>
        (context as unknown as MockAudioContext).createWorkletNode(
          name,
          options,
        ) as unknown as AudioWorkletNode,
    })
    expect(recorder).toBeInstanceOf(WorkletRecorder)
    expect(gain.connectCalls.calls[0]?.[0]).toBeInstanceOf(MockAudioWorkletNode)
  })
})

class FakeMediaRecorder implements MediaRecorderLike {
  static instances: FakeMediaRecorder[] = []
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  readonly mimeType: string
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  readonly stream: unknown
  readonly init: unknown

  constructor(stream: unknown, init: { mimeType?: string }) {
    this.stream = stream
    this.init = init
    this.mimeType = init.mimeType ?? 'audio/webm;codecs=opus'
    FakeMediaRecorder.instances.push(this)
  }

  start(): void {
    this.state = 'recording'
  }

  stop(): void {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['abc'], { type: this.mimeType }) })
    this.ondataavailable?.({ data: new Blob([], { type: this.mimeType }) })
    this.onstop?.()
  }
}

describe('MediaStreamRecorder', () => {
  it('feeds a MediaStreamDestination into MediaRecorder and resolves a Blob on stop', async () => {
    const { ctx, bus } = setup()
    FakeMediaRecorder.instances = []
    const recorder = new MediaStreamRecorder(asAudioContext(ctx), bus, {
      mode: 'media-recorder',
      mimeType: 'audio/ogg;codecs=opus',
      audioBitsPerSecond: 128000,
      createMediaRecorder: (stream, init) => new FakeMediaRecorder(stream, init),
    })
    const destination = ctx.streamDestinations[0]
    expect(recorder.input).toBe(destination)
    expect(bus.output.connectCalls.calledWith(destination)).toBe(true)
    const fake = FakeMediaRecorder.instances[0]
    expect(fake.stream).toBe(destination.stream)
    expect(fake.init).toEqual({ mimeType: 'audio/ogg;codecs=opus', audioBitsPerSecond: 128000 })
    expect(recorder.mimeType).toBe('audio/ogg;codecs=opus')

    recorder.start()
    expect(fake.state).toBe('recording')
    expect(recorder.state).toBe('recording')
    const recording = await recorder.stop()
    expect(recording.kind).toBe('blob')
    expect(recording.mimeType).toBe('audio/ogg;codecs=opus')
    expect(recording.blob.type).toBe('audio/ogg;codecs=opus')
    expect(recording.blob.size).toBe(3)
    expect(recorder.state).toBe('stopped')

    recorder.dispose()
    expect(destination.disconnectCalls.count).toBeGreaterThan(0)
  })

  it('createRecorder picks media-recorder mode and reports a missing MediaRecorder', async () => {
    const { ctx, bus } = setup()
    const recorder = await createRecorder(asAudioContext(ctx), bus, {
      mode: 'media-recorder',
      createMediaRecorder: (stream, init) => new FakeMediaRecorder(stream, init),
    })
    expect(recorder).toBeInstanceOf(MediaStreamRecorder)
    await expect(
      createRecorder(asAudioContext(ctx), bus, { mode: 'media-recorder' }),
    ).rejects.toThrow(/MediaRecorder is not available/)
  })
})
