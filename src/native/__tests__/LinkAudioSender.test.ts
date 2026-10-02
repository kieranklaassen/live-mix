import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext } from '../../testing'
import { NativeHostClient } from '../HostClient'
import { LinkAudioSender, type LinkAudioWorker } from '../LinkAudioSender'
import { NativeLink } from '../NativeLink'
import {
  LINK_TAP_PROCESSOR_NAME,
  type LinkAudioPumpEvent,
  type LinkAudioPumpMessage,
} from '../link-audio-protocol'
import { FAKE_HOST_ADDRESS, FakePluginHost } from '../../testing/fake-plugin-host'

class FakeWorker implements LinkAudioWorker {
  onmessage: ((event: { data: LinkAudioPumpEvent }) => void) | null = null
  readonly posted: LinkAudioPumpMessage[] = []
  readonly url: string
  terminated = false

  constructor(url: string) {
    this.url = url
  }

  postMessage(message: LinkAudioPumpMessage): void {
    this.posted.push(message)
  }

  terminate(): void {
    this.terminated = true
  }
}

async function build(options: { link?: boolean; offsetMs?: number } = {}) {
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
  const ports = { port1: { id: 'tap' }, port2: { id: 'pump' } }
  const create = () =>
    LinkAudioSender.create(asAudioContext(ctx), client, link, {
      name: 'Main',
      offsetMs: options.offsetMs,
      processorUrl: 'https://app.example/worklets/link-tap.js',
      pumpUrl: 'https://app.example/worklets/link-audio.js',
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
  return { create, ctx, workers, ports, time }
}

describe('LinkAudioSender', () => {
  it('sets up the tap and the pump and introduces them', async () => {
    const { create, ctx, workers, ports } = await build()
    const sender = await create()
    expect(ctx.audioWorklet.modules).toEqual(['https://app.example/worklets/link-tap.js'])

    const node = ctx.workletNodes[0]
    expect(node.name).toBe(LINK_TAP_PROCESSOR_NAME)
    expect(node.options).toMatchObject({
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 2,
      channelCountMode: 'explicit',
      processorOptions: { channels: 2 },
    })
    expect(sender.input).toBe(node)
    expect(node.port.posted.calls[0][0]).toEqual({ type: 'port', port: ports.port1 })

    const [worker] = workers
    expect(worker.url).toBe('https://app.example/worklets/link-audio.js')
    expect(worker.posted[0]).toEqual({
      type: 'start',
      url: 'ws://127.0.0.1:4010/link-audio?token=secret&name=Main',
      sampleRate: 48000,
      port: ports.port2,
    })
    expect(sender.status).toBe('connecting')
  })

  it('tells the pump when the context is heard on the host clock', async () => {
    const { create, workers } = await build()
    await create()
    // Context 1.98 s is heard at page 4990 ms, so 2 s at 5010 ms: host 12 010 000 µs.
    expect(workers[0].posted[1]).toEqual({ type: 'clock', contextTime: 2, hostMicros: 12_010_000 })
  })

  it('shifts when blocks are heard by the offset it is given', async () => {
    const { create, workers } = await build({ offsetMs: 40 })
    const sender = await create()
    expect(workers[0].posted[1]).toMatchObject({ hostMicros: 12_050_000 })
    sender.setOffsetMs(-5)
    expect(workers[0].posted[2]).toMatchObject({ type: 'clock', hostMicros: 12_005_000 })
  })

  it('reports the connection and what the pump sent', async () => {
    const { create, workers } = await build()
    const sender = await create()
    const seen: string[] = []
    sender.onStatus = (status, reason) => seen.push(reason ? `${status}: ${reason}` : status)
    const stats: number[] = []
    sender.onStats = ({ blocks }) => stats.push(blocks)

    workers[0].onmessage?.({ data: { type: 'open' } })
    workers[0].onmessage?.({ data: { type: 'stats', stats: { blocks: 94, dropped: 0 } } })
    workers[0].onmessage?.({
      data: { type: 'close', reason: 'the plug-in host closed the channel' },
    })
    expect(seen).toEqual(['open', 'closed: the plug-in host closed the channel'])
    expect(stats).toEqual([94])
    expect(sender.status).toBe('closed')
  })

  it('takes the channel down when disposed', async () => {
    const { create, ctx, workers } = await build()
    const sender = await create()
    sender.dispose()
    expect(ctx.workletNodes[0].port.posted.last?.[0]).toEqual({ type: 'dispose' })
    expect(workers[0].posted.at(-1)).toEqual({ type: 'stop' })
    expect(sender.status).toBe('closed')
    // Nothing more is said to a pump that was told to stop.
    const said = workers[0].posted.length
    sender.setOffsetMs(3)
    expect(workers[0].posted).toHaveLength(said)
  })

  it('refuses a host that was built without Link', async () => {
    const { create } = await build({ link: false })
    await expect(create()).rejects.toThrow(/without Ableton Link/)
  })
})
