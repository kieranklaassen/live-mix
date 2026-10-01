import { describe, expect, it } from 'vitest'

import {
  isEditorDevice,
  isNoteDevice,
  isObservableDevice,
  isParamTextDevice,
  type DeviceChange,
} from '../../core/devices/Device'
import { deviceLatencySamples } from '../../core/devices/pdc'
import { applyPreset, capturePreset } from '../../core/devices/presets'
import { asAudioContext, createMockContext } from '../../testing'
import {
  BRIDGE_LATENCY,
  BRIDGE_UNDERRUNS,
  NATIVE_BRIDGE_PROCESSOR_NAME,
  type BridgeMemory,
  type PumpEvent,
  type PumpMessage,
} from '../bridge-protocol'
import { NativeHostClient } from '../HostClient'
import {
  NativeDevice,
  midiNoteFromFrequency,
  nativeDeviceId,
  type NativeDeviceOptions,
  type NativeParamEdit,
  type PumpWorker,
} from '../NativeDevice'
import {
  FAKE_HOST_ADDRESS,
  FAKE_REVERB,
  FAKE_SYNTH,
  FakePluginHost,
} from '../../testing/fake-plugin-host'

class FakeWorker implements PumpWorker {
  onmessage: ((event: { data: PumpEvent }) => void) | null = null
  readonly posted: PumpMessage[] = []
  readonly url: string
  terminated = false

  constructor(url: string) {
    this.url = url
  }

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

async function makeDevice(plugin = FAKE_REVERB, options: NativeDeviceOptions = {}) {
  const host = new FakePluginHost()
  const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
    createSocket: host.createSocket,
  })
  const ctx = createMockContext({ sampleRate: 48000, currentTime: 2 })
  const workers: FakeWorker[] = []
  const device = await NativeDevice.create(asAudioContext(ctx), client, plugin.id, {
    processorUrl: 'https://app.example/worklets/native-bridge.js',
    pumpUrl: 'https://app.example/worklets/native-pump.js',
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
    ...options,
  })
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))
  return { device, host, client, ctx, worker: workers[0], workers, settle }
}

describe('NativeDevice.create', () => {
  it('loads the plug-in at the context rate and starts the bridge and its pump', async () => {
    const { device, host, ctx, worker } = await makeDevice()
    expect(ctx.audioWorklet.modules).toEqual(['https://app.example/worklets/native-bridge.js'])
    const [load] = host.calls('load')
    expect(load.params).toMatchObject({ plugin: FAKE_REVERB.id, sampleRate: 48000, blockSize: 512 })

    expect(device.id).toBe(nativeDeviceId(FAKE_REVERB.id))
    expect(device.id).toBe('native:VST3-Fake Verb-1a2b-3c4d')
    expect(device.slot.name).toBe('Fake Verb')

    const node = ctx.workletNodes[0]
    expect(node.name).toBe(NATIVE_BRIDGE_PROCESSOR_NAME)
    const nodeOptions = node.options as AudioWorkletNodeOptions
    expect(nodeOptions.outputChannelCount).toEqual([2])
    const memory = nodeOptions.processorOptions as BridgeMemory
    expect(memory.inputChannels).toBe(2)
    expect(Atomics.load(new Int32Array(memory.control), BRIDGE_LATENCY)).toBe(512)

    expect(worker.url).toBe('https://app.example/worklets/native-pump.js')
    expect(worker.posted[0]).toMatchObject({
      type: 'start',
      url: 'ws://127.0.0.1:4010/audio?token=secret&slot=s1&out=2',
    })
    expect((worker.posted[0] as { memory: BridgeMemory }).memory).toBe(memory)
  })

  it('wires input → bridge → wet and a delayed dry path to the output', async () => {
    const { device, ctx } = await makeDevice()
    const node = ctx.workletNodes[0]
    const [input, output, dry, wet] = ctx.gains
    const delay = ctx.delays[0]
    expect(device.input).toBe(input)
    expect(device.output).toBe(output)
    expect(input.isConnectedTo(node)).toBe(true)
    expect(node.isConnectedTo(wet)).toBe(true)
    expect(wet.isConnectedTo(output)).toBe(true)
    expect(input.isConnectedTo(delay)).toBe(true)
    expect(delay.isConnectedTo(dry)).toBe(true)
    expect(dry.isConnectedTo(output)).toBe(true)
    // Still connecting: the dry signal passes until the host answers.
    expect(dry.gain.value).toBe(1)
    expect(wet.gain.value).toBe(0)
    // Bridge 512 + plug-in 64, in seconds: the dry path arrives with the wet one.
    expect(delay.delayTime.value).toBeCloseTo(576 / 48000, 9)
  })

  it('reports the bridge and the plug-in latency together', async () => {
    const { device } = await makeDevice(FAKE_REVERB, { latencyFrames: 250 })
    expect(device.bridgeLatencyFrames).toBe(256)
    expect(device.latencySamples).toBe(256 + 64)
    expect(device.latencySec).toBeCloseTo(320 / 48000, 9)
    expect(deviceLatencySamples(device, 48000)).toBe(320)
  })

  it('an instrument gets no input connection and no input ring channels', async () => {
    const { device, ctx } = await makeDevice(FAKE_SYNTH)
    const node = ctx.workletNodes[0]
    expect(ctx.gains[0].isConnectedTo(node)).toBe(false)
    expect((node.options as AudioWorkletNodeOptions).processorOptions).toMatchObject({
      inputChannels: 0,
    })
    expect(device.hasEditor).toBe(false)
  })

  it('restores a saved state on load and applies initial params after it', async () => {
    const { host } = await makeDevice(FAKE_REVERB, { state: 'c2F2ZWQ=', params: { p7: 0.9 } })
    expect(host.calls('load')[0].params.state).toBe('c2F2ZWQ=')
    expect(host.calls('setParam')[0].params).toEqual({ slot: 's1', index: 1, value: 0.9 })
  })

  it('a saved value for a parameter the plug-in no longer has is left out, not fatal', async () => {
    const { device, host } = await makeDevice(FAKE_REVERB, { params: { p7: 0.3, p4242: 0.9 } })
    expect(device.getParam('p7')).toBe(0.3)
    expect(host.calls('setParam')).toHaveLength(1)
    expect(() => device.setParam('p4242', 0.9)).toThrow('has no parameter')
  })

  it('unloads the plug-in again when the device cannot be finished', async () => {
    const host = new FakePluginHost()
    const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
      createSocket: host.createSocket,
    })
    const ctx = createMockContext()
    await expect(
      NativeDevice.create(asAudioContext(ctx), client, FAKE_REVERB.id, {
        processorUrl: 'p.js',
        pumpUrl: 'w.js',
        createNode: () => {
          throw new Error('no worklet here')
        },
      }),
    ).rejects.toThrow('no worklet here')
    expect(host.calls('unload')[0].params).toEqual({ slot: 's1' })
  })
})

describe('NativeDevice parameters', () => {
  it('exposes the automatable parameters, mirrored from the plug-in', async () => {
    const { device } = await makeDevice()
    expect(Object.keys(device.params)).toEqual(['p100', 'p7', 'p30'])
    expect(device.getParam('p100')).toBe(0.25)
    expect(device.getParam('p30')).toBe(1)
    expect(device.panelParams).toEqual(['p100', 'p7', 'p30'])
    expect(() => device.getParam('nope')).toThrow('has no parameter "nope"')
  })

  it('panelParams names only the first few of a long table', async () => {
    const { device } = await makeDevice(FAKE_REVERB, { panelParamCount: 2 })
    expect(device.panelParams).toEqual(['p100', 'p7'])
    expect(Object.keys(device.params)).toHaveLength(3)
  })

  it('setParam clamps, sends the normalised value by index and announces it', async () => {
    const { device, host } = await makeDevice()
    const seen: DeviceChange[] = []
    device.onChange((change) => seen.push(change))
    device.setParam('p100', 4)
    device.setParam('p30', 2)
    expect(device.getParam('p100')).toBe(1)
    const sets = host.calls('setParam').map((request) => request.params)
    expect(sets).toEqual([
      { slot: 's1', index: 0, value: 1 },
      { slot: 's1', index: 2, value: 1 },
    ])
    expect(seen).toEqual([
      { type: 'param', name: 'p100', value: 1 },
      { type: 'param', name: 'p30', value: 2 },
    ])
    expect(() => device.setParam('nope', 1)).toThrow('has no parameter "nope"')
  })

  it('words values the way the plug-in does, with its unit', async () => {
    const { device } = await makeDevice()
    expect(isParamTextDevice(device)).toBe(true)
    expect(device.paramText('p100')).toBe('2.4 s')
    expect(device.paramText('p7')).toBe('50 %')
    expect(device.paramText('p30')).toBe('Plate')
  })

  it('a change made in the plug-in editor moves the mirror; the echo of our own write only brings text', async () => {
    const { device, host } = await makeDevice()
    const seen: DeviceChange[] = []
    device.onChange((change) => seen.push(change))
    const edits: NativeParamEdit[] = []
    device.onEdit((edit) => edits.push(edit))

    host.emit('params', {
      slot: 's1',
      changes: [{ index: 0, value: 0.8, text: '9.1', origin: 'plugin' }],
    })
    expect(device.getParam('p100')).toBe(0.8)
    expect(device.paramText('p100')).toBe('9.1 s')
    expect(seen).toEqual([{ type: 'param', name: 'p100', value: 0.8 }])
    // Only what the plug-in changed itself is an edit for the document.
    expect(edits).toEqual([{ name: 'p100', value: 0.8 }])

    device.setParam('p7', 0.3)
    host.emit('params', {
      slot: 's1',
      changes: [{ index: 1, value: 0.1, text: '10', origin: 'client' }],
    })
    // A stale echo does not pull the knob back, and is no edit.
    expect(device.getParam('p7')).toBe(0.3)
    expect(edits).toHaveLength(1)
    expect(device.paramText('p7')).toBe('10 %')

    host.emit('params', {
      slot: 'other',
      changes: [{ index: 0, value: 0, text: '0', origin: 'plugin' }],
    })
    expect(device.getParam('p100')).toBe(0.8)
  })

  it('library presets capture and apply through the same table', async () => {
    const { device } = await makeDevice()
    device.setParam('p7', 0.2)
    const preset = capturePreset(device, 'Dark', 1)
    expect(preset.params).toEqual({ p100: 0.25, p7: 0.2, p30: 1 })
    device.setParam('p7', 0.9)
    applyPreset(device, preset)
    expect(device.getParam('p7')).toBe(0.2)
  })

  it('getState and setState carry the plug-in state and refresh values and latency', async () => {
    const { device, host, ctx } = await makeDevice()
    expect(await device.getState()).toBe('c3RhdGU=')
    const seen: DeviceChange[] = []
    device.onChange((change) => seen.push(change))
    await device.setState('bmV3')
    expect(host.calls('setState')[0].params).toEqual({ slot: 's1', state: 'bmV3' })
    expect(device.getParam('p100')).toBe(0.75)
    expect(device.paramText('p100')).toBe('7.2 s')
    expect(seen).toContainEqual({ type: 'param', name: 'p100', value: 0.75 })
    expect(device.latencySamples).toBe(512 + 256)
    expect(ctx.delays[0].delayTime.value).toBeCloseTo(768 / 48000, 9)
  })

  it('follows a latency change the plug-in announces', async () => {
    const { device, host, ctx } = await makeDevice()
    host.emit('latency', { slot: 's1', latencySamples: 1024 })
    expect(device.latencySamples).toBe(512 + 1024)
    expect(ctx.delays[0].delayTime.value).toBeCloseTo(1536 / 48000, 9)
  })
})

describe('NativeDevice behaviour', () => {
  it('satisfies the optional device contracts', async () => {
    const { device } = await makeDevice()
    expect(isNoteDevice(device)).toBe(true)
    expect(isObservableDevice(device)).toBe(true)
    expect(isEditorDevice(device)).toBe(true)
  })

  it('bypass crossfades to the delayed dry path and announces itself', async () => {
    const { device, ctx, worker } = await makeDevice()
    const [, , dry, wet] = ctx.gains
    worker.emit({ type: 'open' })
    const seen: DeviceChange[] = []
    device.onChange((change) => seen.push(change))
    device.bypass = true
    expect(dry.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([1, 2.005])
    expect(wet.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([0, 2.005])
    device.bypass = true
    device.bypass = false
    expect(wet.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([1, 2.005])
    // The open connection, then the two toggles: pressing bypass twice is one ramp.
    expect(dry.gain.eventsFor('linearRampToValueAtTime')).toHaveLength(3)
    expect(seen).toEqual([
      { type: 'bypass', bypass: true },
      { type: 'bypass', bypass: false },
    ])
  })

  it('notes go to the pump as MIDI; a note off uses the pitch the note went on with', async () => {
    const { device, worker } = await makeDevice(FAKE_SYNTH)
    device.noteOn(7, 261.63, 1)
    device.noteOff(7)
    device.noteOff(7)
    expect(worker.posted.slice(1)).toEqual([
      { type: 'midi', bytes: [0x90, 60, 127] },
      { type: 'midi', bytes: [0x80, 60, 0] },
    ])
    expect(midiNoteFromFrequency(440)).toBe(69)
    expect(midiNoteFromFrequency(0)).toBe(0)
  })

  it('status follows the pump, and a lost host leaves the dry signal passing', async () => {
    const { device, worker, ctx } = await makeDevice()
    const [, , dry, wet] = ctx.gains
    const seen: string[] = []
    device.onStatus((status) => seen.push(status))
    expect(device.status).toBe('connecting')
    worker.emit({ type: 'open' })
    expect(device.status).toBe('running')
    // Audio flows at last: the wet path takes over from the dry one it started on.
    expect(dry.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([0, 2.005])
    expect(wet.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([1, 2.005])
    worker.emit({ type: 'close', reason: 'the plug-in host closed the connection' })
    expect(device.status).toBe('stopped')
    expect(seen).toEqual(['running', 'stopped'])
    expect(dry.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([1, 2.005])
    expect(wet.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([0, 2.005])
    worker.emit({ type: 'open' })
    expect(device.status).toBe('stopped')
  })

  it('the control connection closing stops the device too', async () => {
    const { device, host } = await makeDevice()
    host.socket.close()
    expect(device.status).toBe('stopped')
  })

  it('keeps the pump statistics and the underrun count', async () => {
    const { device, worker, ctx } = await makeDevice()
    const stats = {
      blocks: 375,
      roundTripMeanMs: 0.4,
      roundTripMaxMs: 2.1,
      underruns: 3,
      droppedFrames: 0,
    }
    const seen: number[] = []
    device.onStats((report) => seen.push(report.roundTripMaxMs))
    worker.emit({ type: 'stats', stats })
    expect(device.stats).toEqual(stats)
    expect(seen).toEqual([2.1])
    const memory = (ctx.workletNodes[0].options as AudioWorkletNodeOptions)
      .processorOptions as BridgeMemory
    Atomics.store(new Int32Array(memory.control), BRIDGE_UNDERRUNS, 3)
    expect(device.underruns).toBe(3)
  })

  it('opens and closes the editor in the host', async () => {
    const { device, host } = await makeDevice()
    await device.openEditor()
    await device.closeEditor()
    expect(host.calls('showEditor')[0].params).toEqual({ slot: 's1' })
    expect(host.calls('hideEditor')[0].params).toEqual({ slot: 's1' })
  })

  it('dispose stops the pump, tells the worklet, disconnects and unloads once', async () => {
    const { device, host, worker, ctx, settle } = await makeDevice()
    const node = ctx.workletNodes[0]
    device.dispose()
    device.dispose()
    expect(worker.posted.at(-1)).toEqual({ type: 'stop' })
    expect(worker.terminated).toBe(true)
    expect(node.port.posted.calls.at(-1)?.[0]).toEqual({ type: 'dispose' })
    expect(node.outputs.size).toBe(0)
    await settle()
    expect(host.calls('unload')).toHaveLength(1)
    device.setParam('p7', 0.1)
    device.noteOn(1, 440)
    expect(host.calls('setParam')).toHaveLength(0)
  })
})
