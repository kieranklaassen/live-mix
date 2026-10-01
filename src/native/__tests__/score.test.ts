// Hosted plug-ins in a score document: the renderer loads them through the
// registry, their settings live in the document, and a document made with a
// plug-in this machine lacks still renders, saves and reloads.

import { describe, expect, it } from 'vitest'

import { DeviceRegistry } from '../../core/devices/registry'
import { createEngine } from '../../core/Engine'
import { loadScore } from '../../score/loadScore'
import { ScoreDocument } from '../../score/ScoreDocument'
import {
  MASTER_OWNER,
  createScore,
  parseScore,
  serializeScore,
  validateScore,
  type Score,
} from '../../score/schema'
import { asAudioContext, createMockContext } from '../../testing'
import { type PumpEvent, type PumpMessage } from '../bridge-protocol'
import { followNativeEdits } from '../follow'
import { NativeHostClient } from '../HostClient'
import {
  MissingNativeDevice,
  isMissingNativeDevice,
  isNativeDeviceId,
  missingNativeDescriptor,
  nativePluginName,
  registerMissingNativeDevices,
} from '../missing'
import { NativeDevice, type PumpWorker } from '../NativeDevice'
import { registerNativeDevices } from '../registry'
import { FAKE_HOST_ADDRESS, FAKE_REVERB, FakePluginHost } from '../../testing/fake-plugin-host'

const REVERB_ID = `native:${FAKE_REVERB.id}`

class QuietWorker implements PumpWorker {
  onmessage: ((event: { data: PumpEvent }) => void) | null = null
  postMessage(_message: PumpMessage): void {}
  terminate(): void {}
}

function scoreWithReverb(params: Record<string, number> = {}): Score {
  const score = createScore()
  score.master.inserts.push({ id: 'verb-1', deviceId: REVERB_ID, params, bypass: false })
  return score
}

async function rig(score: Score, withHost: boolean) {
  const ctx = createMockContext({ sampleRate: 48000 })
  const registry = new DeviceRegistry()
  const host = new FakePluginHost()
  if (withHost) {
    const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
      createSocket: host.createSocket,
    })
    registerNativeDevices(client, [FAKE_REVERB], {
      registry,
      defaults: {
        processorUrl: 'https://app.example/worklets/native-bridge.js',
        pumpUrl: 'https://app.example/worklets/native-pump.js',
        createNode: (context, name, options) =>
          (context as unknown as typeof ctx).createWorkletNode(
            name,
            options,
          ) as unknown as AudioWorkletNode,
        createWorker: () => new QuietWorker(),
      },
    })
  }
  const missing = registerMissingNativeDevices(score, registry)
  const engine = createEngine({
    context: asAudioContext(ctx),
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
    devices: registry,
  })
  const document = new ScoreDocument(score, { now: () => 0 })
  const errors: unknown[] = []
  const renderer = loadScore(engine, document, { onError: (error) => errors.push(error) })
  await renderer.whenIdle()
  return { engine, registry, host, document, renderer, errors, missing }
}

describe('a hosted plug-in in a score', () => {
  it('is loaded by the renderer with the values the document holds', async () => {
    const { engine, host, errors } = await rig(scoreWithReverb({ p7: 0.3 }), true)
    expect(errors).toEqual([])
    const [device] = engine.master.inserts
    expect(device).toBeInstanceOf(NativeDevice)
    expect(device.getParam('p7')).toBe(0.3)
    expect(host.calls('load')).toHaveLength(1)
    expect(host.calls('setParam').map((call) => call.params)).toEqual([
      { slot: 's1', index: 1, value: 0.3 },
    ])
  })

  it('takes parameter edits and removal as score operations', async () => {
    const { engine, host, document, renderer, errors } = await rig(scoreWithReverb(), true)
    const [device] = engine.master.inserts

    document.apply({ type: 'device.setParam', device: 'verb-1', param: 'p100', value: 0.6 })
    await renderer.whenIdle()
    expect(device.getParam('p100')).toBe(0.6)
    expect(document.score.master.inserts[0].params).toEqual({ p100: 0.6 })

    document.undo()
    await renderer.whenIdle()
    // Back to the plug-in's own value: the descriptor has no default to offer.
    expect(document.score.master.inserts[0].params).toEqual({})

    document.apply({ type: 'device.remove', id: 'verb-1' })
    await renderer.whenIdle()
    expect(engine.master.inserts).toHaveLength(0)
    await Promise.resolve()
    expect(host.calls('unload')).toHaveLength(1)
    expect(errors).toEqual([])
  })

  it('can be added to a strip by its registry id', async () => {
    const { engine, document, renderer, errors } = await rig(createScore(), true)
    document.apply({
      type: 'device.add',
      owner: MASTER_OWNER,
      device: { id: `${REVERB_ID}-1`, deviceId: REVERB_ID, params: {}, bypass: false },
    })
    await renderer.whenIdle()
    expect(errors).toEqual([])
    expect(engine.master.inserts.map((device) => device.id)).toEqual([REVERB_ID])
    // The whole thing survives a save.
    const saved = serializeScore(document.score)
    expect(parseScore(JSON.parse(saved), { devices: engine.devices })).toEqual(document.score)
  })
})

describe('followNativeEdits', () => {
  const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

  it('writes what the plug-in changed itself into the document, one undo step per drag', async () => {
    const { engine, host, document, renderer } = await rig(scoreWithReverb(), true)
    let clock = 1000
    const stop = followNativeEdits(document, renderer, {
      now: () => clock,
      label: (plugin, param) => `${plugin}: ${param}`,
    })
    await tick()
    const [device] = engine.master.inserts
    const sent = (): number => host.calls('setParam').length

    // A drag in the editor: three values in quick succession.
    for (const value of [0.5, 0.6, 0.7]) {
      clock += 30
      host.emit('params', {
        slot: 's1',
        changes: [{ index: 0, value, text: String(value), origin: 'plugin' }],
      })
    }
    await renderer.whenIdle()
    expect(document.score.master.inserts[0].params).toEqual({ p100: 0.7 })
    // The document following the plug-in must not write the plug-in back.
    expect(sent()).toBe(0)
    expect(device.getParam('p100')).toBe(0.7)

    // A second drag, later: its own step.
    clock += 5000
    host.emit('params', {
      slot: 's1',
      changes: [{ index: 0, value: 0.2, text: '0.2', origin: 'plugin' }],
    })
    await renderer.whenIdle()
    expect(document.score.master.inserts[0].params).toEqual({ p100: 0.2 })

    document.undo()
    await renderer.whenIdle()
    expect(document.score.master.inserts[0].params).toEqual({ p100: 0.7 })
    // Undo is ours: this one does reach the plug-in.
    expect(host.calls('setParam').at(-1)?.params).toEqual({ slot: 's1', index: 0, value: 0.7 })

    document.undo()
    await renderer.whenIdle()
    expect(document.score.master.inserts[0].params).toEqual({})
    expect(document.canUndo).toBe(false)
    stop()
  })

  it('follows a plug-in added later and lets go of one that is removed', async () => {
    const { host, document, renderer } = await rig(createScore(), true)
    const stop = followNativeEdits(document, renderer)
    document.apply({
      type: 'device.add',
      owner: MASTER_OWNER,
      device: { id: 'verb-9', deviceId: REVERB_ID, params: {}, bypass: false },
    })
    await renderer.whenIdle()
    await tick()

    host.emit('params', {
      slot: 's1',
      changes: [{ index: 1, value: 0.9, text: '90', origin: 'plugin' }],
    })
    expect(document.score.master.inserts[0].params).toEqual({ p7: 0.9 })

    // Our own writes echo back as `client`: nothing to record.
    host.emit('params', {
      slot: 's1',
      changes: [{ index: 0, value: 0.1, text: '1', origin: 'client' }],
    })
    expect(document.score.master.inserts[0].params).toEqual({ p7: 0.9 })

    stop()
    host.emit('params', {
      slot: 's1',
      changes: [{ index: 1, value: 0.4, text: '40', origin: 'plugin' }],
    })
    expect(document.score.master.inserts[0].params).toEqual({ p7: 0.9 })
  })
})

describe('a hosted plug-in this machine does not have', () => {
  it('does not validate until a stand-in is registered for it', () => {
    const score = scoreWithReverb({ p7: 0.3 })
    const registry = new DeviceRegistry()
    expect(validateScore(score, { devices: registry })).not.toEqual([])
    expect(registerMissingNativeDevices(score, registry)).toEqual([REVERB_ID])
    expect(validateScore(score, { devices: registry })).toEqual([])
    // Asking again adds nothing.
    expect(registerMissingNativeDevices(score, registry)).toEqual([])
  })

  it('renders as a wire that keeps the settings', async () => {
    const { engine, document, renderer, errors, missing } = await rig(
      scoreWithReverb({ p7: 0.3 }),
      false,
    )
    expect(missing).toEqual([REVERB_ID])
    expect(errors).toEqual([])
    const [device] = engine.master.inserts
    expect(isMissingNativeDevice(device)).toBe(true)
    expect(device.input).toBe(device.output)
    expect(device.getParam('p7')).toBe(0.3)
    expect(device.latencySec).toBe(0)
    expect(engine.devices.describe(REVERB_ID).name).toBe('Fake Verb (not available)')

    // The document is untouched: what was saved is what gets saved again.
    expect(document.score.master.inserts[0]).toEqual({
      id: 'verb-1',
      deviceId: REVERB_ID,
      params: { p7: 0.3 },
      bypass: false,
    })
    document.apply({ type: 'device.bypass', device: 'verb-1', bypass: true })
    await renderer.whenIdle()
    expect(device.bypass).toBe(true)
  })

  it('leaves stock devices and plug-ins that are registered alone', async () => {
    const { missing, registry } = await rig(scoreWithReverb(), true)
    expect(missing).toEqual([])
    expect(registry.describe(REVERB_ID).unavailable).toBeUndefined()
  })
})

describe('missing plug-in helpers', () => {
  it('reads the plug-in name out of a host id', () => {
    expect(nativePluginName('native:VST3-ValhallaVintageVerb-5a3c1f2e-a1b2c3d4')).toBe(
      'ValhallaVintageVerb',
    )
    expect(nativePluginName('native:AudioUnit-AU Low-pass-1f-2e')).toBe('AU Low-pass')
    expect(nativePluginName('native:something else')).toBe('something else')
    expect(isNativeDeviceId('native:x')).toBe(true)
    expect(isNativeDeviceId('filter')).toBe(false)
  })

  it('the stand-in keeps any value it is given and ignores what is not a number', () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const device = new MissingNativeDevice(asAudioContext(ctx), 'native:x', { p1: 0.4 })
    device.setParam('p2', 7)
    device.setParam('p1', Number.NaN)
    expect(device.getParam('p1')).toBe(0.4)
    expect(device.getParam('p2')).toBe(7)
    expect(device.getParam('p3')).toBe(0)
    expect(device.params).toEqual({})
    device.dispose()
  })

  it('the stand-in descriptor says what it is', () => {
    const descriptor = missingNativeDescriptor('native:VST3-Verb-1-2', 'Verb')
    expect(descriptor).toMatchObject({
      id: 'native:VST3-Verb-1-2',
      name: 'Verb (not available)',
      kind: 'native',
      category: 'plugin',
      unavailable: true,
      dynamicParams: true,
    })
  })
})
