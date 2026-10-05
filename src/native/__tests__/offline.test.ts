import { describe, expect, it } from 'vitest'

import { holdRenderAt } from '../../core/render/hold'
import { asAudioContext, createMockOfflineContext } from '../../testing'
import {
  BRIDGE_ACTIVE,
  BRIDGE_READY,
  BRIDGE_WRITTEN,
  bridgeLatencyFor,
  type PumpEvent,
  type PumpMessage,
} from '../bridge-protocol'
import { NativeHostClient } from '../HostClient'
import { NativeDevice, type NativeDeviceOptions, type PumpWorker } from '../NativeDevice'
import {
  OfflineBridgeClock,
  isOfflineContext,
  offlineBridgeClock,
  type OfflineContextLike,
} from '../offline'
import { FAKE_HOST_ADDRESS, FAKE_REVERB, FakePluginHost } from '../../testing/fake-plugin-host'

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

/** An offline context reduced to its pacing: `renderTo` runs until the next booked stop. */
class FakeOfflineContext implements OfflineContextLike {
  readonly sampleRate = 48000
  readonly length: number
  frame = 0
  suspended = false
  resumes = 0
  readonly booked: number[] = []
  private readonly stops = new Map<number, () => void>()

  constructor(length = 48000) {
    this.length = length
  }

  get currentTime(): number {
    return this.frame / this.sampleRate
  }

  startRendering(): Promise<void> {
    return Promise.resolve()
  }

  suspend(time: number): Promise<void> {
    const frame = Math.round(time * this.sampleRate)
    if (frame < this.frame || frame >= this.length || this.stops.has(frame)) {
      return Promise.reject(new Error('InvalidStateError'))
    }
    this.booked.push(frame)
    return new Promise((resolve) => this.stops.set(frame, resolve))
  }

  resume(): Promise<void> {
    this.suspended = false
    this.resumes += 1
    return Promise.resolve()
  }

  /** Render up to the next booked stop (or the end) and stop there. */
  async renderOn(): Promise<number> {
    const next = [...this.stops.keys()].sort((a, b) => a - b)[0]
    if (next === undefined) {
      this.frame = this.length
      return this.frame
    }
    this.frame = next
    this.suspended = true
    this.stops.get(next)?.()
    this.stops.delete(next)
    await tick()
    return next
  }
}

function member(periodFrames: number) {
  let release: (() => void) | null = null
  let waits = 0
  return {
    periodFrames,
    settled: (): Promise<void> => {
      waits += 1
      return new Promise<void>((resolve) => {
        release = resolve
      })
    },
    release: async (): Promise<void> => {
      release?.()
      release = null
      await tick()
    },
    get waits() {
      return waits
    },
  }
}

describe('bridgeLatencyFor', () => {
  it('is the default without a device buffer to go by', () => {
    expect(bridgeLatencyFor({ sampleRate: 48000 })).toBe(512)
    expect(bridgeLatencyFor({ sampleRate: 48000, baseLatency: 0 })).toBe(512)
    expect(bridgeLatencyFor({ sampleRate: 48000, baseLatency: Number.NaN })).toBe(512)
  })

  it('is the device buffer in whole quanta plus the margin', () => {
    expect(bridgeLatencyFor({ sampleRate: 48000, baseLatency: 128 / 48000 })).toBe(640)
    expect(bridgeLatencyFor({ sampleRate: 44100, baseLatency: 256 / 44100 })).toBe(768)
    // 481 frames, as headless Chromium reports: four quanta and 512 on top.
    expect(bridgeLatencyFor({ sampleRate: 48000, baseLatency: 481 / 48000 })).toBe(1024)
    expect(bridgeLatencyFor({ sampleRate: 48000, baseLatency: 1024 / 48000 })).toBe(1536)
    expect(bridgeLatencyFor({ sampleRate: 48000, baseLatency: 10 })).toBe(8192)
  })
})

describe('isOfflineContext', () => {
  it('tells an offline context from a live one by startRendering', () => {
    expect(isOfflineContext(new FakeOfflineContext())).toBe(true)
    expect(isOfflineContext({ suspend: () => {}, resume: () => {} })).toBe(false)
  })
})

describe('OfflineBridgeClock', () => {
  it('stops the render one quantum in and holds it until the member has settled', async () => {
    const context = new FakeOfflineContext()
    const clock = new OfflineBridgeClock(context)
    const reverb = member(512)
    clock.add(reverb)

    expect(context.booked).toEqual([128])
    await context.renderOn()
    expect(reverb.waits).toBe(1)
    expect(context.suspended).toBe(true)

    await reverb.release()
    expect(context.suspended).toBe(false)
    // The next stop was booked before the render moved on.
    expect(context.booked).toEqual([128, 640])
  })

  it('paces at the smallest latency among its members', async () => {
    const context = new FakeOfflineContext()
    const clock = new OfflineBridgeClock(context)
    const slow = member(1024)
    const quick = member(256)
    clock.add(slow)
    clock.add(quick)
    expect(clock.size).toBe(2)
    // One stop for both: a context takes only one suspend per frame.
    expect(context.booked).toEqual([128])

    await context.renderOn()
    await slow.release()
    expect(context.suspended).toBe(true)
    await quick.release()
    expect(context.suspended).toBe(false)
    expect(context.booked).toEqual([128, 384])
  })

  it('stops pacing when the last member leaves and at the end of the render', async () => {
    const context = new FakeOfflineContext(1000)
    const clock = new OfflineBridgeClock(context)
    const reverb = member(512)
    const leave = clock.add(reverb)

    await context.renderOn()
    await reverb.release()
    await context.renderOn()
    await reverb.release()
    // 128, 640, and 1152 would be past the end.
    expect(context.booked).toEqual([128, 640])
    expect(context.suspended).toBe(false)

    leave()
    expect(clock.size).toBe(0)
  })

  it('a member that joins after the pacing ended starts it again from where the render is', async () => {
    const context = new FakeOfflineContext()
    const clock = new OfflineBridgeClock(context)
    const first = member(512)
    const leave = clock.add(first)
    await context.renderOn()
    leave()
    await first.release()
    expect(context.booked).toEqual([128])

    context.frame = 1000
    clock.add(member(512))
    expect(context.booked).toEqual([128, 1152])
  })

  it('shares a block with a hold the application made there', async () => {
    const context = new FakeOfflineContext()
    const order: string[] = []
    // A bounce sending a note at the first block, before any device exists.
    void holdRenderAt(context, 100 / 48000, () => void order.push('note'))
    const clock = new OfflineBridgeClock(context)
    const reverb = member(512)
    clock.add(reverb)
    // One suspend at 128 for both; a second would have been refused.
    expect(context.booked).toEqual([128])

    // And a note where the clock's next stop will be.
    void holdRenderAt(context, 640 / 48000, () => void order.push('later note'))
    await context.renderOn()
    expect(order).toEqual(['note'])
    await reverb.release()
    expect(context.suspended).toBe(false)
    expect(context.booked).toEqual([128, 640])

    await context.renderOn()
    expect(order).toEqual(['note', 'later note'])
    expect(reverb.waits).toBe(2)
    await reverb.release()
    expect(context.booked).toEqual([128, 640, 1152])
  })

  it('resumes even when a member fails to settle', async () => {
    const context = new FakeOfflineContext()
    const clock = new OfflineBridgeClock(context)
    clock.add({ periodFrames: 512, settled: () => Promise.reject(new Error('gone')) })
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown): void => void unhandled.push(reason)
    process.on('unhandledRejection', onUnhandled)
    await context.renderOn()
    await tick()
    process.off('unhandledRejection', onUnhandled)
    expect(context.resumes).toBe(1)
    expect(unhandled).toEqual([])
  })

  it('one clock per context', () => {
    const context = new FakeOfflineContext()
    expect(offlineBridgeClock(context)).toBe(offlineBridgeClock(context))
    expect(offlineBridgeClock(new FakeOfflineContext())).not.toBe(offlineBridgeClock(context))
  })
})

class FakeWorker implements PumpWorker {
  onmessage: ((event: { data: PumpEvent }) => void) | null = null
  readonly posted: PumpMessage[] = []
  terminated = false

  postMessage(message: PumpMessage): void {
    this.posted.push(message)
  }

  terminate(): void {
    this.terminated = true
  }

  emit(event: PumpEvent): void {
    this.onmessage?.({ data: event })
  }
}

async function offlineSetup(options: NativeDeviceOptions = {}) {
  const host = new FakePluginHost()
  const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
    createSocket: host.createSocket,
  })
  const pacing = new FakeOfflineContext()
  const ctx = Object.assign(createMockOfflineContext({ sampleRate: 48000 }), {
    suspend: (time: number) => pacing.suspend(time),
    resume: () => pacing.resume(),
  })
  const worker = new FakeWorker()
  const created = NativeDevice.create(asAudioContext(ctx), client, FAKE_REVERB.id, {
    processorUrl: 'https://app.example/worklets/native-bridge.js',
    pumpUrl: 'https://app.example/worklets/native-pump.js',
    createNode: (context, name, nodeOptions) =>
      (context as unknown as typeof ctx).createWorkletNode(
        name,
        nodeOptions,
      ) as unknown as AudioWorkletNode,
    createWorker: () => worker,
    ...options,
  })
  return { host, client, ctx, pacing, worker, created }
}

/** Wait until the device has started its pump worker. */
async function started(worker: FakeWorker): Promise<void> {
  for (let i = 0; i < 50 && worker.posted.length === 0; i += 1) await tick()
}

describe('NativeDevice on an offline context', () => {
  it('waits for the audio connection before it is ready to render', async () => {
    const { worker, created } = await offlineSetup()
    let done = false
    void created.then(() => {
      done = true
    })
    await started(worker)
    await tick()
    expect(done).toBe(false)

    worker.emit({ type: 'open' })
    const device = await created
    expect(device.status).toBe('running')
    // No device buffer to go by offline: the plain default.
    expect(device.bridgeLatencyFrames).toBe(512)
    device.dispose()
  })

  it('gives up, and unloads the plug-in, when the host never opens audio', async () => {
    const { host, worker, created } = await offlineSetup({ connectTimeoutMs: 10 })
    await expect(created).rejects.toThrow(/did not open audio for Fake Verb/)
    expect(worker.terminated).toBe(true)
    await tick()
    expect(host.calls('unload')).toHaveLength(1)
  })

  it('fails the same way when the audio connection is refused', async () => {
    const { worker, created } = await offlineSetup()
    await started(worker)
    worker.emit({ type: 'close', reason: 'refused' })
    await expect(created).rejects.toThrow(/did not open audio/)
  })

  it('a device given up on is taken down whole: its worklet is told, and the host no longer talks to it', async () => {
    const { client, ctx, worker, created } = await offlineSetup()
    await started(worker)
    worker.emit({ type: 'close', reason: 'refused' })
    await expect(created).rejects.toThrow(/did not open audio/)
    const node = ctx.workletNodes[0]
    // Left running, the processor would be rendered to the end of the bounce.
    expect(node.port.posted.calls.at(-1)?.[0]).toEqual({ type: 'dispose' })
    expect(node.outputs.size).toBe(0)
    // The client lives on after the render: a listener left on it keeps the device and its context.
    const listeners = (client as unknown as { listeners: Map<string, Set<unknown>> }).listeners
    expect([...listeners].filter(([, set]) => set.size > 0).map(([event]) => event)).toEqual([])
  })

  it('holds the render at each stop until the host has answered everything written', async () => {
    const { worker, pacing, created } = await offlineSetup()
    await started(worker)
    worker.emit({ type: 'open' })
    const device = await created
    expect(pacing.booked).toEqual([128])

    const start = worker.posted[0]
    if (start.type !== 'start') throw new Error('expected the start message')
    const control = new Int32Array(start.memory.control)
    Atomics.store(control, BRIDGE_ACTIVE, 1)
    Atomics.store(control, BRIDGE_WRITTEN, 128)

    await pacing.renderOn()
    await tick()
    expect(pacing.suspended).toBe(true)

    Atomics.store(control, BRIDGE_READY, 128)
    Atomics.notify(control, BRIDGE_READY)
    for (let i = 0; i < 50 && pacing.suspended; i += 1) await tick()
    expect(pacing.suspended).toBe(false)
    expect(pacing.booked).toEqual([128, 640])

    // A host that went away does not hold the render up.
    Atomics.store(control, BRIDGE_WRITTEN, 640)
    Atomics.store(control, BRIDGE_ACTIVE, 0)
    await pacing.renderOn()
    for (let i = 0; i < 50 && pacing.suspended; i += 1) await tick()
    expect(pacing.suspended).toBe(false)

    // A disposed device leaves the clock.
    device.dispose()
    expect(offlineBridgeClock(device.context as unknown as OfflineContextLike).size).toBe(0)
  })

  it('sends a note only once the host has caught up, and says when it has gone', async () => {
    const { worker, created } = await offlineSetup()
    await started(worker)
    worker.emit({ type: 'open' })
    const device = await created
    const start = worker.posted[0]
    if (start.type !== 'start') throw new Error('expected the start message')
    const control = new Int32Array(start.memory.control)
    const midi = (): PumpMessage[] => worker.posted.filter((message) => message.type === 'midi')

    // The render is held at frame 640 and the host has only returned 128.
    Atomics.store(control, BRIDGE_ACTIVE, 1)
    Atomics.store(control, BRIDGE_WRITTEN, 640)
    Atomics.store(control, BRIDGE_READY, 128)
    device.noteOn(1, 440, 1)
    device.noteOff(1)
    let delivered = false
    void device.notesDelivered().then(() => {
      delivered = true
    })
    await tick()
    // Sent now, the note would reach the plug-in in a block before 640.
    expect(midi()).toEqual([])
    expect(delivered).toBe(false)

    Atomics.store(control, BRIDGE_READY, 640)
    Atomics.notify(control, BRIDGE_READY)
    for (let i = 0; i < 50 && !delivered; i += 1) await tick()
    expect(delivered).toBe(true)
    // In the order they were played.
    expect(midi()).toEqual([
      { type: 'midi', bytes: [0x90, 69, 127] },
      { type: 'midi', bytes: [0x80, 69, 0] },
    ])
    device.dispose()
  })
})
