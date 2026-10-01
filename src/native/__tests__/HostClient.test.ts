import { afterEach, describe, expect, it } from 'vitest'

import { NativeHostClient, findNativeHost } from '../HostClient'
import { FAKE_HOST_ADDRESS, FAKE_REVERB, FakePluginHost } from '../../testing/fake-plugin-host'

async function connect(host = new FakePluginHost()) {
  const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
    createSocket: host.createSocket,
  })
  return { client, host }
}

describe('NativeHostClient', () => {
  afterEach(() => {
    delete (globalThis as { liveMixHost?: unknown }).liveMixHost
  })

  it('opens the control path with the token and keeps what hello said', async () => {
    const { client, host } = await connect()
    expect(host.socket.url).toBe('ws://127.0.0.1:4010/control?token=secret')
    expect(client.info.formats).toEqual(['VST3', 'AudioUnit'])
    expect(client.info.juce).toBe('9.0.2')
    expect(client.closed).toBe(false)
  })

  it('refuses a host that speaks another protocol version', async () => {
    const host = new FakePluginHost({ protocol: 99 })
    await expect(
      NativeHostClient.connect(FAKE_HOST_ADDRESS, { createSocket: host.createSocket }),
    ).rejects.toThrow('protocol 99')
    expect(host.socket.closed).toBe(true)
  })

  it('times out when nothing answers', async () => {
    const silent = new FakePluginHost()
    await expect(
      NativeHostClient.connect(FAKE_HOST_ADDRESS, {
        createSocket: (url) => {
          const socket = silent.createSocket(url)
          socket.send = () => {}
          return socket
        },
        timeoutMs: 5,
      }),
    ).rejects.toThrow()
  })

  it('answers calls by id and turns a host error into a rejection', async () => {
    const { client } = await connect()
    expect(await client.plugins()).toHaveLength(2)
    await expect(
      client.load({ plugin: 'nope', sampleRate: 48000, blockSize: 512 }),
    ).rejects.toThrow('unknown plug-in "nope"')
  })

  it('delivers scan progress events and the scan result', async () => {
    const { client } = await connect()
    const seen: string[] = []
    const off = client.on('scanProgress', (progress) => seen.push(progress.file))
    const result = await client.scan({ paths: ['/extra'] })
    expect(seen).toEqual([FAKE_REVERB.file])
    expect(result.plugins[0].name).toBe('Fake Verb')
    expect(result.failed).toEqual(['/plugins/Broken.vst3'])
    off()
    await client.scan()
    expect(seen).toHaveLength(1)
  })

  it('setParam is a notification: no id, nothing awaited', async () => {
    const { client, host } = await connect()
    client.setParam('s1', 3, 0.25)
    const [request] = host.calls('setParam')
    expect(request.id).toBeUndefined()
    expect(request.params).toEqual({ slot: 's1', index: 3, value: 0.25 })
  })

  it('builds the audio address of a slot', async () => {
    const { client } = await connect()
    expect(client.audioUrl('s2')).toBe('ws://127.0.0.1:4010/audio?token=secret&slot=s2&out=2')
  })

  it('rejects what was pending and tells listeners when the host goes away', async () => {
    const { client, host } = await connect()
    const reasons: string[] = []
    client.on('close', ({ reason }) => reasons.push(reason))
    host.socket.send = () => {}
    const pending = client.getState('s1')
    host.socket.close()
    await expect(pending).rejects.toThrow('the plug-in host went away')
    expect(reasons).toEqual(['the plug-in host went away'])
    expect(client.closed).toBe(true)
    await expect(client.plugins()).rejects.toThrow('the plug-in host went away')
    client.setParam('s1', 0, 1)
  })

  it('finds the address a shell left on the global object, or nothing', () => {
    expect(findNativeHost()).toBeNull()
    ;(globalThis as { liveMixHost?: unknown }).liveMixHost = { url: 'ws://127.0.0.1:9', token: 't' }
    expect(findNativeHost()).toEqual({ url: 'ws://127.0.0.1:9', token: 't' })
    ;(globalThis as { liveMixHost?: unknown }).liveMixHost = { url: 5 }
    expect(findNativeHost()).toBeNull()
  })
})
