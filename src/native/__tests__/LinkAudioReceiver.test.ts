import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext } from '../../testing'
import { NativeHostClient } from '../HostClient'
import { LinkAudioReceiver, type LinkIntakeWorker } from '../LinkAudioReceiver'
import { NativeLink } from '../NativeLink'
import {
  LINK_SOURCE_PROCESSOR_NAME,
  type LinkIntakeEvent,
  type LinkIntakeMessage,
} from '../link-receive-protocol'
import { FAKE_HOST_ADDRESS, FakePluginHost } from '../../testing/fake-plugin-host'

class FakeWorker implements LinkIntakeWorker {
  onmessage: ((event: { data: LinkIntakeEvent }) => void) | null = null
  readonly posted: LinkIntakeMessage[] = []
  readonly url: string
  terminated = false

  constructor(url: string) {
    this.url = url
  }

  postMessage(message: LinkIntakeMessage): void {
    this.posted.push(message)
  }

  terminate(): void {
    this.terminated = true
  }
}

async function build(options: { link?: boolean; delayMs?: number; offsetMs?: number } = {}) {
  // The page clock stands at 5000 ms; the host's runs 7 s ahead of it.
  const time = { ms: 5000 }
  const host = new FakePluginHost({
    link: options.link,
    linkClock: () => time.ms * 1000 + 7_000_000,
  })
  const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
    createSocket: host.createSocket,
  })
  const link = await NativeLink.open(client, { now: () => time.ms, syncIntervalMs: 0 })
  // Context time 2 s; the browser says 1.98 s was heard at page time 4990 ms.
  const ctx = createMockContext({ sampleRate: 48000, currentTime: 2 })
  Object.assign(ctx, {
    getOutputTimestamp: () => ({ contextTime: 1.98, performanceTime: 4990 }),
  })
  const workers: FakeWorker[] = []
  const ports = { port1: { id: 'playout' }, port2: { id: 'intake' } }
  const create = () =>
    LinkAudioReceiver.create(asAudioContext(ctx), client, link, {
      channel: 'c0ffee',
      delayMs: options.delayMs,
      offsetMs: options.offsetMs,
      processorUrl: 'https://app.example/worklets/link-source.js',
      intakeUrl: 'https://app.example/worklets/link-receive.js',
      clockIntervalMs: 0,
      now: () => time.ms,
      createNode: (context, name, nodeOptions) =>
        (context as unknown as typeof ctx).createWorkletNode(
          name,
          nodeOptions,
        ) as unknown as AudioWorkletNode,
      createWorker: (url) => {
        const worker = new FakeWorker(url)
        workers.push(worker)
        return worker
      },
      createChannel: () => ports as unknown as { port1: MessagePort; port2: MessagePort },
    })
  return { create, ctx, client, workers, ports, time }
}

describe('LinkAudioReceiver', () => {
  it('sets up the playout and the intake and introduces them', async () => {
    const { create, ctx, workers, ports } = await build()
    const receiver = await create()
    expect(ctx.audioWorklet.modules).toEqual(['https://app.example/worklets/link-source.js'])

    const node = ctx.workletNodes[0]
    expect(node.name).toBe(LINK_SOURCE_PROCESSOR_NAME)
    expect(node.options).toMatchObject({
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: { delaySec: null },
    })
    expect(receiver.output).toBe(node)
    expect(receiver.channel).toBe('c0ffee')
    expect(node.port.posted.calls[0][0]).toEqual({ type: 'port', port: ports.port1 })

    const [worker] = workers
    expect(worker.url).toBe('https://app.example/worklets/link-receive.js')
    // The clock goes first: a block that arrives before it could not be placed.
    // Context 1.98 s is heard at page 4990 ms, so 2 s at 5010 ms: host 12 010 000 µs.
    expect(worker.posted[0]).toEqual({ type: 'clock', contextTime: 2, hostMicros: 12_010_000 })
    expect(worker.posted[1]).toEqual({
      type: 'start',
      url: 'ws://127.0.0.1:4010/link-audio-in?token=secret&channel=c0ffee',
      port: ports.port2,
    })
    expect(receiver.status).toBe('connecting')
    expect(receiver.delaySec).toBeNull()
  })

  it('holds a delay it is given, and shifts the clock by an offset', async () => {
    const { create, ctx, workers } = await build({ delayMs: 80, offsetMs: 40 })
    const receiver = await create()
    expect(ctx.workletNodes[0].options).toMatchObject({ processorOptions: { delaySec: 0.08 } })
    expect(receiver.delaySec).toBe(0.08)
    expect(workers[0].posted[0]).toMatchObject({ hostMicros: 12_050_000 })
    receiver.setOffsetMs(-5)
    expect(workers[0].posted[2]).toMatchObject({ type: 'clock', hostMicros: 12_005_000 })
  })

  it('reports the connection, the delay the playout settles on and what arrived', async () => {
    const { create, ctx, workers } = await build()
    const receiver = await create()
    const seen: string[] = []
    receiver.onStatus = (status, reason) => seen.push(reason ? `${status}: ${reason}` : status)
    const delays: number[] = []
    receiver.onDelay = (delaySec) => delays.push(delaySec)
    const blocks: number[] = []
    receiver.onStats = (stats) => blocks.push(stats.blocks)

    const { port } = ctx.workletNodes[0]
    workers[0].onmessage?.({ data: { type: 'open' } })
    port.receive({ type: 'delay', delaySec: 0.042 })
    port.receive({
      type: 'stats',
      stats: { blocks: 375, lost: 0, starvedFrames: 0, delaySec: 0.042 },
    })
    expect(receiver.delaySec).toBe(0.042)
    port.receive({ type: 'delay', delaySec: 0.06 })
    workers[0].onmessage?.({
      data: { type: 'close', reason: 'the plug-in host closed the channel' },
    })
    expect(seen).toEqual(['open', 'closed: the plug-in host closed the channel'])
    expect(delays).toEqual([0.042, 0.06])
    expect(blocks).toEqual([375])
    expect(receiver.status).toBe('closed')
    expect(receiver.delaySec).toBe(0.06)
  })

  it('stops listening when disposed', async () => {
    const { create, ctx, workers } = await build()
    const receiver = await create()
    receiver.dispose()
    expect(ctx.workletNodes[0].port.posted.last?.[0]).toEqual({ type: 'dispose' })
    expect(workers[0].posted.at(-1)).toEqual({ type: 'stop' })
    expect(receiver.status).toBe('closed')
    // Nothing more is said to an intake that was told to stop.
    const said = workers[0].posted.length
    receiver.setOffsetMs(3)
    expect(workers[0].posted).toHaveLength(said)
  })

  it('refuses a host that was built without Link, or before it could receive', async () => {
    const without = await build({ link: false })
    await expect(without.create()).rejects.toThrow(/without Ableton Link/)

    const old = await build()
    delete (old.client.info as { linkAudioReceive?: boolean }).linkAudioReceive
    await expect(old.create()).rejects.toThrow(/too old to receive Link Audio/)
  })
})
