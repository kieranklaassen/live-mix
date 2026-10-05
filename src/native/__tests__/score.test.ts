// Hosted plug-ins in a score document: the renderer loads them through the
// registry, their settings live in the document, and a document made with a
// plug-in this machine lacks still renders, saves and reloads.

import { describe, expect, it, vi } from 'vitest'

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
import { captureNativeState, followNativeEdits } from '../follow'
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
import {
  FAKE_HOST_ADDRESS,
  FAKE_REVERB,
  FAKE_STATE,
  FakePluginHost,
} from '../../testing/fake-plugin-host'

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

describe('followNativeEdits: the plug-in state', () => {
  const state = (document: ScoreDocument): string | undefined =>
    document.score.master.inserts[0]?.state

  it('reads the state of a plug-in the document has none for, without an undo step', async () => {
    vi.useFakeTimers()
    try {
      const { document, renderer, host } = await rig(scoreWithReverb(), true)
      const stop = followNativeEdits(document, renderer)
      await vi.advanceTimersByTimeAsync(0)
      expect(state(document)).toBe(FAKE_STATE)
      expect(document.canUndo).toBe(false)
      // The renderer hands the state back to the device that just gave it: nothing is loaded.
      await renderer.whenIdle()
      expect(host.calls('setState')).toHaveLength(0)
      // It survives a save.
      expect(parseScore(JSON.parse(serializeScore(document.score))).master.inserts[0].state).toBe(
        FAKE_STATE,
      )
      stop()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a plug-in that starts from a saved state is loaded with it and not read again', async () => {
    vi.useFakeTimers()
    try {
      const score = scoreWithReverb({ p7: 0.3 })
      score.master.inserts[0].state = 'c2F2ZWQ='
      const { document, renderer, host } = await rig(score, true)
      expect(host.calls('load')[0].params.state).toBe('c2F2ZWQ=')
      // Its parameters go on top of the state.
      expect(host.calls('setParam').map((call) => call.params)).toEqual([
        { slot: 's1', index: 1, value: 0.3 },
      ])
      const stop = followNativeEdits(document, renderer)
      await vi.advanceTimersByTimeAsync(10_000)
      expect(host.calls('getState')).toHaveLength(0)
      expect(state(document)).toBe('c2F2ZWQ=')
      stop()
    } finally {
      vi.useRealTimers()
    }
  })

  it('reads again once after a drag in the plug-in, when it says its state changed, and when its window closes', async () => {
    vi.useFakeTimers()
    try {
      const score = scoreWithReverb()
      score.master.inserts[0].state = 'c2F2ZWQ='
      const { document, renderer, host } = await rig(score, true)
      const stop = followNativeEdits(document, renderer, { stateDelayMs: 200 })
      await vi.advanceTimersByTimeAsync(0)
      const reads = (): number => host.calls('getState').length
      const slot = host.slots.get('s1')
      if (!slot) throw new Error('no slot')

      // A drag: many changes, one read once it has gone quiet.
      for (const value of [0.5, 0.6, 0.7]) {
        host.emit('params', {
          slot: 's1',
          changes: [{ index: 0, value, text: String(value), origin: 'plugin' }],
        })
        await vi.advanceTimersByTimeAsync(100)
      }
      expect(reads()).toBe(0)
      slot.state = 'ZHJhZ2dlZA=='
      await vi.advanceTimersByTimeAsync(200)
      expect(reads()).toBe(1)
      expect(state(document)).toBe('ZHJhZ2dlZA==')
      // The drag is one undo step; keeping the state added none.
      document.undo()
      expect(document.canUndo).toBe(false)
      expect(state(document)).toBe('ZHJhZ2dlZA==')

      // A sample loaded in the plug-in: no parameter moves, the plug-in says so.
      slot.state = 'c2FtcGxl'
      host.emit('stateChanged', { slot: 's1' })
      await vi.advanceTimersByTimeAsync(200)
      expect(state(document)).toBe('c2FtcGxl')

      // The window closed.
      slot.state = 'Y2xvc2Vk'
      host.emit('editorClosed', { slot: 's1' })
      await vi.advanceTimersByTimeAsync(200)
      expect(state(document)).toBe('Y2xvc2Vk')

      // A read that finds what the document has changes nothing.
      const before = document.score
      host.emit('stateChanged', { slot: 's1' })
      await vi.advanceTimersByTimeAsync(200)
      expect(document.score).toBe(before)
      // Nothing of this was ever loaded back into the plug-in.
      await renderer.whenIdle()
      expect(host.calls('setState')).toHaveLength(0)
      stop()
    } finally {
      vi.useRealTimers()
    }
  })

  it('reads every few seconds while the plug-in window is open, and not when it is shut', async () => {
    vi.useFakeTimers()
    try {
      const score = scoreWithReverb()
      score.master.inserts[0].state = 'c2F2ZWQ='
      const { engine, document, renderer, host } = await rig(score, true)
      const stop = followNativeEdits(document, renderer, { statePollMs: 1000 })
      await vi.advanceTimersByTimeAsync(3000)
      expect(host.calls('getState')).toHaveLength(0)

      const device = engine.master.inserts[0] as NativeDevice
      await device.openEditor()
      const slot = host.slots.get('s1')
      if (!slot) throw new Error('no slot')
      slot.state = 'ZHJhd24='
      await vi.advanceTimersByTimeAsync(1100)
      expect(state(document)).toBe('ZHJhd24=')
      const reads = host.calls('getState').length
      await device.closeEditor()
      await vi.advanceTimersByTimeAsync(3000)
      expect(host.calls('getState')).toHaveLength(reads)

      stop()
      await device.openEditor()
      await vi.advanceTimersByTimeAsync(3000)
      expect(host.calls('getState')).toHaveLength(reads)
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps a timer for the poll only while there is a plug-in to ask', async () => {
    vi.useFakeTimers()
    try {
      const score = scoreWithReverb()
      score.master.inserts[0].state = 'c2F2ZWQ='
      const { document, renderer } = await rig(score, true)
      const idle = vi.getTimerCount()
      const stop = followNativeEdits(document, renderer)
      await vi.advanceTimersByTimeAsync(0)
      expect(vi.getTimerCount()).toBe(idle + 1)

      // The plug-in leaves the document: nothing is left to ask, so nothing ticks.
      document.apply({ type: 'device.remove', id: 'verb-1' })
      await vi.advanceTimersByTimeAsync(0)
      expect(vi.getTimerCount()).toBe(idle)
      document.undo()
      await vi.advanceTimersByTimeAsync(0)
      expect(vi.getTimerCount()).toBe(idle + 1)

      stop()
      expect(vi.getTimerCount()).toBe(idle)

      // A document that never had one never starts it.
      const plain = await rig(createScore(), true)
      const before = vi.getTimerCount()
      const stopPlain = followNativeEdits(plain.document, plain.renderer)
      await vi.advanceTimersByTimeAsync(0)
      expect(vi.getTimerCount()).toBe(before)
      stopPlain()
    } finally {
      vi.useRealTimers()
    }
  })

  it('can be told to leave the state alone', async () => {
    vi.useFakeTimers()
    try {
      const { document, renderer, host } = await rig(scoreWithReverb(), true)
      const stop = followNativeEdits(document, renderer, { state: false })
      host.emit('stateChanged', { slot: 's1' })
      await vi.advanceTimersByTimeAsync(10_000)
      expect(host.calls('getState')).toHaveLength(0)
      expect(state(document)).toBeUndefined()
      stop()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a read that comes back after the document was given another state is dropped', async () => {
    const score = scoreWithReverb()
    score.master.inserts[0].state = 'c2F2ZWQ='
    const { engine, document, renderer } = await rig(score, true)
    const device = engine.master.inserts[0] as NativeDevice
    const read = device.getState.bind(device)
    device.getState = async () => {
      const answer = await read()
      // While the host answered, the document moved on.
      document.apply({ type: 'device.setState', device: 'verb-1', state: 'bmV3ZXI=' })
      return answer
    }
    expect(await captureNativeState(document, renderer)).toBe(0)
    expect(state(document)).toBe('bmV3ZXI=')
  })
})

describe('captureNativeState', () => {
  it('reads every hosted plug-in now and says how many states changed', async () => {
    const score = scoreWithReverb()
    score.master.inserts.push({ id: 'verb-2', deviceId: REVERB_ID, params: {}, bypass: false })
    const { document, renderer, host, errors } = await rig(score, true)
    expect(errors).toEqual([])
    const second = host.slots.get('s2')
    if (!second) throw new Error('no slot')
    second.state = 'c2Vjb25k'

    expect(await captureNativeState(document, renderer)).toBe(2)
    expect(document.score.master.inserts.map((device) => device.state)).toEqual([
      FAKE_STATE,
      'c2Vjb25k',
    ])
    expect(document.canUndo).toBe(false)
    // Nothing changed since: nothing to keep.
    expect(await captureNativeState(document, renderer)).toBe(0)
    await renderer.whenIdle()
    expect(host.calls('setState')).toHaveLength(0)
  })

  it('a plug-in that cannot be read keeps the state the document has', async () => {
    const score = scoreWithReverb()
    score.master.inserts[0].state = 'c2F2ZWQ='
    const { engine, document, renderer } = await rig(score, true)
    const device = engine.master.inserts[0] as NativeDevice
    device.getState = () => Promise.reject(new Error('the host is gone'))
    const failures: unknown[] = []
    expect(
      await captureNativeState(document, renderer, { onError: (error) => failures.push(error) }),
    ).toBe(0)
    expect(failures.map(String)).toEqual(['Error: the host is gone'])
    expect(document.score.master.inserts[0].state).toBe('c2F2ZWQ=')
  })

  it('leaves the stand-in for a plug-in this machine lacks, and its saved state, alone', async () => {
    const score = scoreWithReverb({ p7: 0.3 })
    score.master.inserts[0].state = 'c2F2ZWQ='
    const { document, renderer, errors } = await rig(score, false)
    expect(errors).toEqual([])
    expect(await captureNativeState(document, renderer)).toBe(0)
    expect(document.score.master.inserts[0]).toEqual({
      id: 'verb-1',
      deviceId: REVERB_ID,
      params: { p7: 0.3 },
      bypass: false,
      state: 'c2F2ZWQ=',
    })
    expect(parseScore(JSON.parse(serializeScore(document.score)))).toEqual(document.score)
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

  it('keeps a value the document changes once it is rendered', async () => {
    const { engine, document, renderer, errors } = await rig(scoreWithReverb({ p7: 0.3 }), false)
    const [device] = engine.master.inserts
    // It lists no parameters, and is told all the same.
    document.apply({ type: 'device.setParam', device: 'verb-1', param: 'p7', value: 0.5 })
    await renderer.whenIdle()
    expect(errors).toEqual([])
    expect(device.getParam('p7')).toBe(0.5)
  })

  it('an instrument track that names one renders silent and keeps the instrument and its state', async () => {
    const score = createScore()
    score.tracks = [
      {
        kind: 'instrument',
        id: 'keys',
        name: 'Keys',
        destination: { kind: 'master' },
        strip: {
          level: 1,
          pan: 0,
          inputGain: 1,
          mute: false,
          solo: false,
          soloSafe: false,
          inserts: [],
          sends: [],
        },
        device: {
          id: 'synth-1',
          deviceId: 'native:VST3-Gone Synth-1-2',
          params: { p1: 0.6 },
          bypass: false,
          state: 'c2F2ZWQ=',
        },
      },
    ]
    const { engine, document, renderer, errors, missing } = await rig(score, false)
    expect(missing).toEqual(['native:VST3-Gone Synth-1-2'])
    expect(errors).toEqual([])
    const track = renderer.instrument('keys')
    expect(engine.instruments).toEqual([track])
    expect(isMissingNativeDevice(track.device)).toBe(true)
    // Notes go nowhere, without an error.
    track.noteOn(1, 440, 1)
    track.noteOff(1)
    expect(await captureNativeState(document, renderer)).toBe(0)
    expect(parseScore(JSON.parse(serializeScore(document.score)))).toEqual(score)
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
