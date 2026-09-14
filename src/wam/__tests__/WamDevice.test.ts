import { describe, expect, it } from 'vitest'

import {
  applyPreset,
  capturePreset,
  parsePreset,
  serializePreset,
} from '../../core/devices/presets'
import { isNoteDevice } from '../../core/devices/Device'
import { asAudioContext, createMockContext } from '../../testing'
import { hasWamHost } from '../host'
import {
  WAM_DEVICE_RAMP_SECONDS,
  WamDevice,
  isWamModuleConstructor,
  loadWamModule,
  midiNoteFromFrequency,
  wamDeviceId,
} from '../WamDevice'
import {
  FAKE_EFFECT_CONFIG,
  FAKE_SYNTH_CONFIG,
  defineFakeWam,
  fakeHostInitializer,
  fakeImporter,
} from './fake-wam'

const EFFECT_URL = 'https://plugins.example/fake-effect/index.js'

async function makeEffect(options: Parameters<typeof WamDevice.create>[2] = {}) {
  const Effect = defineFakeWam(FAKE_EFFECT_CONFIG)
  const ctx = createMockContext({ currentTime: 2 })
  const host = fakeHostInitializer()
  const device = await WamDevice.create(asAudioContext(ctx), EFFECT_URL, {
    importModule: fakeImporter({ [EFFECT_URL]: Effect }),
    host: { initialize: host.initialize },
    ...options,
  })
  const instance = Effect.instances[Effect.instances.length - 1]
  return { device, ctx, host, instance, Effect }
}

describe('WamDevice.create', () => {
  it('installs the host once per context, imports the module and instantiates it in the group', async () => {
    const { device, ctx, host, instance } = await makeEffect()
    expect(host.calls.count).toBe(1)
    expect(hasWamHost(asAudioContext(ctx))).toBe(true)
    expect(instance.groupId).toBe('fake-group')
    expect(device.host).toEqual({ groupId: 'fake-group', groupKey: 'fake-key' })
    expect(device.url).toBe(EFFECT_URL)
    expect(device.id).toBe('wam:com.live-mix.fake-effect')
    expect(device.descriptor.name).toBe('Fake Effect')
    expect(device.node).toBe(instance.audioNode)

    const Second = defineFakeWam({ ...FAKE_EFFECT_CONFIG, identifier: 'com.live-mix.second' })
    const second = await WamDevice.create(asAudioContext(ctx), Second)
    expect(host.calls.count).toBe(1)
    expect(second.id).toBe('wam:com.live-mix.second')
    expect(second.url).toBeUndefined()
    second.dispose()
    device.dispose()
  })

  it('installs with the given group ids and takes an explicit id', async () => {
    const host = fakeHostInitializer()
    const { device } = await makeEffect({
      host: { groupId: 'given', groupKey: 'secret', initialize: host.initialize },
      id: 'my-plate',
    })
    expect(host.calls.last?.slice(1)).toEqual(['given', 'secret'])
    expect(device.host).toEqual({ groupId: 'given', groupKey: 'secret' })
    expect(device.id).toBe('my-plate')
    device.dispose()
  })

  it('loads a URL through a real dynamic import by default', async () => {
    const url =
      'data:text/javascript,export default class W { static get isWebAudioModuleConstructor() { return true } static createInstance() { return Promise.reject(new Error("unused")) } }'
    const constructor = await loadWamModule(url)
    expect(isWamModuleConstructor(constructor)).toBe(true)
  })

  it('destroys the plugin when an initial param is unknown, instead of leaking it', async () => {
    const Effect = defineFakeWam(FAKE_EFFECT_CONFIG)
    const ctx = createMockContext()
    await expect(
      WamDevice.create(asAudioContext(ctx), Effect, {
        host: { groupId: 'g', groupKey: 'k' },
        params: { nope: 1 },
      }),
    ).rejects.toThrow(/no parameter "nope"/)
    expect(Effect.instances).toHaveLength(1)
    expect(Effect.instances[0].node.destroyed).toBe(true)
    for (const gain of ctx.gains) expect(gain.disconnectCalls.count).toBe(1)
  })

  it('rejects a module that is not a WAM', async () => {
    const ctx = createMockContext()
    await expect(
      WamDevice.create(asAudioContext(ctx), 'https://x/nope.js', {
        importModule: () => Promise.resolve({ default: class NotAWam {} }),
        host: { groupId: 'g', groupKey: 'k' },
      }),
    ).rejects.toThrow(/does not export a WebAudioModule/)
    await expect(loadWamModule('u', () => Promise.resolve(42))).rejects.toThrow(/WebAudioModule/)
    expect(isWamModuleConstructor(defineFakeWam(FAKE_SYNTH_CONFIG))).toBe(true)
    expect(isWamModuleConstructor({ isWebAudioModuleConstructor: true })).toBe(false)
  })

  it('wires input → node → wet → output and input → dry → output, dry closed', async () => {
    const { device, ctx, instance } = await makeEffect()
    const [input, output, dry, wet] = ctx.gains
    expect(device.input).toBe(input)
    expect(device.output).toBe(output)
    expect(input.isConnectedTo(instance.node)).toBe(true)
    expect(instance.node.isConnectedTo(wet)).toBe(true)
    expect(wet.isConnectedTo(output)).toBe(true)
    expect(input.isConnectedTo(dry)).toBe(true)
    expect(dry.isConnectedTo(output)).toBe(true)
    expect(dry.gain.value).toBe(0)
    expect(wet.gain.value).toBe(1)
    expect(input.reaches(output)).toBe(true)
    device.dispose()
  })

  it('reports the compensation delay in samples and seconds and lets an option override it', async () => {
    const { device, ctx } = await makeEffect()
    expect(device.latencySamples).toBe(480)
    expect(device.latencySec).toBeCloseTo(480 / ctx.sampleRate, 9)
    device.dispose()
    const { device: forced, ctx: forcedCtx } = await makeEffect({ latencySec: 0.001 })
    expect(forced.latencySamples).toBe(44) // 0.001 s at 44.1 kHz, whole samples
    expect(forced.latencySec).toBe(44 / forcedCtx.sampleRate)
    forced.dispose()
  })

  it('applies initial params and mirrors an initialState', async () => {
    const { device, instance } = await makeEffect({
      initialState: { params: { gain: -6 }, custom: 'from-state' },
      params: { cutoff: 5000, stages: 3.4 },
    })
    expect(instance.initialState).toEqual({ params: { gain: -6 }, custom: 'from-state' })
    expect(device.getParam('gain')).toBe(-6)
    expect(device.getParam('cutoff')).toBe(5000)
    expect(device.getParam('stages')).toBe(3)
    expect(instance.node.values).toMatchObject({ gain: -6, cutoff: 5000, stages: 3 })
    expect(instance.node.setParameterValuesCalls.count).toBe(1)
    device.dispose()
  })
})

describe('WamDevice params', () => {
  it('maps every WAM parameter to a ParamSpec keyed by its id', async () => {
    const { device } = await makeEffect()
    expect(Object.keys(device.params)).toEqual(['gain', 'cutoff', 'stages', 'enabled', 'mode'])
    expect(device.params.gain).toMatchObject({
      id: 0,
      name: 'Gain',
      min: -24,
      max: 24,
      default: 0,
      taper: 'linear',
      unit: 'dB',
      type: 'float',
      step: 0,
      choices: [],
    })
    expect(device.params.cutoff).toMatchObject({ id: 1, taper: 'log', exponent: 3, unit: 'Hz' })
    expect(device.params.stages).toMatchObject({ id: 2, type: 'int', step: 1, min: 1, max: 8 })
    expect(device.params.enabled).toMatchObject({ id: 3, type: 'boolean', min: 0, max: 1, step: 1 })
    expect(device.params.mode).toMatchObject({
      id: 4,
      type: 'choice',
      min: 0,
      max: 2,
      step: 1,
      choices: ['Clean', 'Warm', 'Crushed'],
    })
    expect(Object.keys(device.paramInfo)).toEqual(Object.keys(device.params))
    device.dispose()
  })

  it('setParam writes one setParameterValues, clamped and snapped, and getParam mirrors it', async () => {
    const { device, instance } = await makeEffect()
    device.setParam('gain', 30)
    expect(device.getParam('gain')).toBe(24)
    expect(instance.node.setParameterValuesCalls.last?.[0]).toEqual({
      gain: { id: 'gain', value: 24, normalized: false },
    })
    device.setParam('stages', 4.6)
    expect(device.getParam('stages')).toBe(5)
    device.setParam('mode', 1.2)
    expect(device.getParam('mode')).toBe(1)
    device.setParam('gain', Number.NaN)
    expect(device.getParam('gain')).toBe(0)
    await Promise.resolve()
    expect(instance.node.values).toMatchObject({ gain: 0, stages: 5, mode: 1 })
    expect(() => device.setParam('nope', 1)).toThrow(/no parameter "nope"/)
    expect(() => device.getParam('nope')).toThrow(/no parameter "nope"/)
    device.dispose()
  })

  it('setParams batches several params into one round trip', async () => {
    const { device, instance } = await makeEffect()
    const before = instance.node.setParameterValuesCalls.count
    device.setParams({ gain: -3, cutoff: 200 })
    expect(instance.node.setParameterValuesCalls.count).toBe(before + 1)
    expect(device.getParam('gain')).toBe(-3)
    expect(device.getParam('cutoff')).toBe(200)
    device.dispose()
  })

  it('syncParams pulls values a GUI changed behind the adapter', async () => {
    const { device, instance } = await makeEffect()
    instance.node.setFromGui('cutoff', 440)
    expect(device.getParam('cutoff')).toBe(1000)
    await device.syncParams()
    expect(device.getParam('cutoff')).toBe(440)
    device.dispose()
  })

  it('mirrors processed automation events, denormalising normalized ones', async () => {
    const { device, instance } = await makeEffect()
    instance.node.processAutomation('gain', 12)
    expect(device.getParam('gain')).toBe(12)
    instance.node.processAutomation('gain', 0.5, true)
    expect(device.getParam('gain')).toBe(0)
    instance.node.processAutomation('unknown', 1)
    device.dispose()
    instance.node.processAutomation('gain', -12)
    expect(device.getParam('gain')).toBe(0)
  })

  it('scheduleParam posts a wam-automation event without touching the mirror', async () => {
    const { device, instance } = await makeEffect()
    device.scheduleParam('gain', 99, 3.5)
    expect(instance.node.scheduledEvents).toEqual([
      { type: 'wam-automation', data: { id: 'gain', value: 24, normalized: false }, time: 3.5 },
    ])
    expect(device.getParam('gain')).toBe(0)
    device.clearScheduled()
    expect(instance.node.clearEventsCalls.count).toBe(1)
    expect(instance.node.scheduledEvents).toEqual([])
    expect(() => device.scheduleParam('nope', 1, 0)).toThrow(/no parameter/)
    device.dispose()
  })
})

describe('WamDevice state and presets', () => {
  it('round-trips a captured preset through JSON onto a fresh instance', async () => {
    const { device: source } = await makeEffect()
    source.setParam('gain', -6)
    source.setParam('mode', 2)
    const preset = parsePreset(serializePreset(capturePreset(source, 'Captured', 1)))
    expect(preset).toEqual({
      name: 'Captured',
      deviceId: 'wam:com.live-mix.fake-effect',
      deviceVersion: 1,
      params: { gain: -6, cutoff: 1000, stages: 2, enabled: 1, mode: 2 },
    })

    const { device: target, instance } = await makeEffect()
    const result = applyPreset(target, preset)
    expect(result.skipped).toEqual([])
    expect(result.applied.sort()).toEqual(['cutoff', 'enabled', 'gain', 'mode', 'stages'])
    await Promise.resolve()
    expect(instance.node.values).toEqual({ gain: -6, cutoff: 1000, stages: 2, enabled: 1, mode: 2 })
    source.dispose()
    target.dispose()
  })

  it('getState/setState carry the plugin-native state and refresh the mirror', async () => {
    const { device, instance } = await makeEffect()
    device.setParam('gain', 6)
    await expect(device.getState()).resolves.toEqual({
      params: { gain: 6, cutoff: 1000, stages: 2, enabled: 1, mode: 0 },
      custom: 'kept',
    })
    await device.setState({ params: { gain: -12, cutoff: 80 }, custom: 'changed' })
    expect(instance.node.setStateCalls.count).toBe(1)
    expect(device.getParam('gain')).toBe(-12)
    expect(device.getParam('cutoff')).toBe(80)
    expect(instance.node.extra).toEqual({ custom: 'changed' })
    device.dispose()
  })
})

describe('WamDevice bypass, GUI, MIDI and dispose', () => {
  it('bypass crossfades dry and wet over the ramp and reads back', async () => {
    const { device, ctx } = await makeEffect()
    const [, , dry, wet] = ctx.gains
    device.bypass = true
    expect(device.bypass).toBe(true)
    expect(dry.gain.events.map((e) => e.method)).toEqual([
      'cancelAndHoldAtTime',
      'linearRampToValueAtTime',
    ])
    expect(dry.gain.events[1].args).toEqual([1, 2 + WAM_DEVICE_RAMP_SECONDS])
    expect(wet.gain.events[1].args).toEqual([0, 2 + WAM_DEVICE_RAMP_SECONDS])
    device.bypass = true
    expect(dry.gain.events.length).toBe(2)
    device.bypass = false
    expect(device.bypass).toBe(false)
    expect(wet.gain.events[3].args).toEqual([1, 2 + WAM_DEVICE_RAMP_SECONDS])
    device.dispose()
  })

  it('createGui hands out the plugin element and destroyGui / dispose tear it down', async () => {
    const { device, instance } = await makeEffect()
    const first = await device.createGui()
    const second = await device.createGui()
    if (!first || !second) throw new Error('the fake plugin has a GUI')
    expect(first).toBe(instance.guis[0])
    expect(second).toBe(instance.guis[1])
    device.destroyGui(first)
    expect(instance.guis[0].destroyed).toBe(true)
    expect(instance.guis[1].destroyed).toBe(false)
    device.destroyGui(first)
    device.dispose()
    expect(instance.guis[1].destroyed).toBe(true)
    await expect(device.createGui()).resolves.toBeNull()
  })

  it('returns null when the plugin has no GUI', async () => {
    const NoGui = defineFakeWam({ ...FAKE_EFFECT_CONFIG, gui: false })
    const ctx = createMockContext()
    const device = await WamDevice.create(asAudioContext(ctx), NoGui, {
      host: { groupId: 'g', groupKey: 'k' },
    })
    await expect(device.createGui()).resolves.toBeNull()
    device.dispose()
  })

  it('is a NoteDevice: notes become MIDI on/off, raw MIDI and events pass through', async () => {
    const Synth = defineFakeWam(FAKE_SYNTH_CONFIG)
    const ctx = createMockContext()
    const device = await WamDevice.create(asAudioContext(ctx), Synth, {
      host: { groupId: 'g', groupKey: 'k' },
    })
    const instance = Synth.instances[0]
    expect(isNoteDevice(device)).toBe(true)
    expect(ctx.gains[0].isConnectedTo(instance.node)).toBe(false)
    expect(instance.node.isConnectedTo(ctx.gains[3])).toBe(true)

    device.noteOn(1, 440)
    device.noteOn(2, 261.63, 1)
    device.noteOff(1)
    device.noteOff(1)
    device.sendMidi([0xb0, 1, 64], 5)
    device.scheduleEvents({
      type: 'wam-transport',
      data: {
        currentBar: 0,
        currentBarStarted: 0,
        tempo: 120,
        timeSigNumerator: 4,
        timeSigDenominator: 4,
        playing: true,
      },
    })
    expect(instance.node.scheduledEvents).toEqual([
      { type: 'wam-midi', data: { bytes: [0x90, 69, 64] }, time: undefined },
      { type: 'wam-midi', data: { bytes: [0x90, 60, 127] }, time: undefined },
      { type: 'wam-midi', data: { bytes: [0x80, 69, 0] }, time: undefined },
      { type: 'wam-midi', data: { bytes: [0xb0, 1, 64] }, time: 5 },
      expect.objectContaining({ type: 'wam-transport' }),
    ])
    expect(midiNoteFromFrequency(8.1758)).toBe(0)
    expect(midiNoteFromFrequency(20000)).toBe(127)
    expect(midiNoteFromFrequency(-1)).toBe(0)
    device.dispose()
  })

  it('disposes once: disconnects the gains, destroys the node, unsubscribes, stays inert', async () => {
    const { device, ctx, instance } = await makeEffect()
    expect(instance.node.listenerCount('wam-automation')).toBe(1)
    device.dispose()
    expect(instance.node.destroyed).toBe(true)
    expect(instance.node.listenerCount('wam-automation')).toBe(0)
    for (const gain of ctx.gains) expect(gain.disconnectCalls.count).toBe(1)
    const writes = instance.node.setParameterValuesCalls.count
    expect(() => device.dispose()).not.toThrow()
    device.setParam('gain', 3)
    expect(device.getParam('gain')).toBe(3)
    expect(instance.node.setParameterValuesCalls.count).toBe(writes)
    device.scheduleParam('gain', 1, 0)
    device.bypass = true
    expect(instance.node.scheduledEvents).toEqual([])
    await device.syncParams()
    await device.setState({})
    expect(instance.node.setStateCalls.count).toBe(0)
    expect(wamDeviceId({ identifier: 'a.b' })).toBe('wam:a.b')
  })
})
