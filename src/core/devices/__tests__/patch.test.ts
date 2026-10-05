import { describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext } from '../../../testing'
import { type Device } from '../Device'
import { NODE_DEVICES } from '../native'
import { DELAY_DESCRIPTOR } from '../native/Delay'
import {
  type Patch,
  capturePatch,
  createPatchDevice,
  createPatchEffects,
  isInstrumentPatch,
  isPatch,
  patchDeviceParams,
  patchDevices,
  replaceInserts,
  validatePatch,
} from '../patch'
import { DeviceRegistry, type DeviceDescriptor } from '../registry'

const context = () => asAudioContext(createMockContext())

const VOICE: DeviceDescriptor = {
  ...DELAY_DESCRIPTOR,
  id: 'voice',
  name: 'Voice',
  category: 'instrument',
  create: async (ctx, options) => {
    const delay = await DELAY_DESCRIPTOR.create(ctx, options)
    return Object.assign(delay, { id: 'voice' })
  },
}

const registry = () => new DeviceRegistry([...NODE_DEVICES, VOICE])

const CHAIN: Patch = {
  id: 'dub',
  name: 'Dub',
  category: 'echo',
  description: 'A long echo into a dark filter.',
  effects: [
    { deviceId: 'delay', preset: 'Long tail', params: { mix: 0.5 } },
    { deviceId: 'filter', params: { frequency: 900 }, bypass: true },
  ],
}

describe('patch', () => {
  it('lists its devices in signal order, the instrument first', () => {
    const preset: Patch = { ...CHAIN, instrument: { deviceId: 'voice' } }
    expect(patchDevices(preset).map((device) => device.deviceId)).toEqual([
      'voice',
      'delay',
      'filter',
    ])
    expect(patchDevices(CHAIN).map((device) => device.deviceId)).toEqual(['delay', 'filter'])
    expect(isInstrumentPatch(preset)).toBe(true)
    expect(isInstrumentPatch(CHAIN)).toBe(false)
  })

  it('validates against a registry: devices, roles, presets, parameters and ranges', () => {
    expect(validatePatch(CHAIN, registry())).toEqual([])
    expect(validatePatch({ ...CHAIN, instrument: { deviceId: 'voice' } }, registry())).toEqual([])

    const broken: Patch = {
      id: '',
      name: 'Broken',
      category: 'echo',
      description: '',
      instrument: { deviceId: 'filter' },
      effects: [
        { deviceId: 'nope' },
        { deviceId: 'voice' },
        { deviceId: 'delay', preset: 'Nope', params: { mix: 7, wobble: 1, feedback: Number.NaN } },
      ],
    }
    expect(validatePatch(broken, registry())).toEqual([
      { path: 'id', message: 'expected a non-empty id' },
      { path: 'instrument.deviceId', message: 'filter is not an instrument' },
      { path: 'effects[0].deviceId', message: 'unknown device "nope"' },
      { path: 'effects[1].deviceId', message: 'voice is an instrument, not an effect' },
      { path: 'effects[2].preset', message: 'delay has no preset "Nope"' },
      { path: 'effects[2].params.mix', message: '7 is outside [0, 1]' },
      { path: 'effects[2].params.wobble', message: 'delay has no parameter "wobble"' },
      { path: 'effects[2].params.feedback', message: 'NaN is outside [0, 0.95]' },
    ])
    expect(validatePatch({ ...CHAIN, effects: [] }, registry())).toEqual([
      { path: 'effects', message: 'a patch needs an instrument or at least one effect' },
    ])
  })

  it('a parameter named as something every plain object has is one the device does not have', () => {
    const params = JSON.parse('{"constructor":1,"toString":2,"__proto__":3}') as Record<
      string,
      number
    >
    const odd: Patch = { ...CHAIN, effects: [{ deviceId: 'delay', params }] }
    expect(validatePatch(odd, registry())).toEqual([
      { path: 'effects[0].params.constructor', message: 'delay has no parameter "constructor"' },
      { path: 'effects[0].params.toString', message: 'delay has no parameter "toString"' },
      { path: 'effects[0].params.__proto__', message: 'delay has no parameter "__proto__"' },
    ])
    // And it is dropped from what the device is made with, like any other it does not have.
    expect(patchDeviceParams(DELAY_DESCRIPTOR, odd.effects[0])).toEqual(
      patchDeviceParams(DELAY_DESCRIPTOR, { deviceId: 'delay' }),
    )
  })

  it('a device whose table is only known once it is made is not checked by name, and keeps what it is given', async () => {
    const made: unknown[] = []
    // As a hosted plug-in registers: no table beforehand, and `dynamicParams`.
    const hosted: DeviceDescriptor = {
      ...DELAY_DESCRIPTOR,
      id: 'hosted',
      name: 'Hosted',
      kind: 'native',
      params: {},
      presets: undefined,
      dynamicParams: true,
      create: async (ctx, options) => {
        made.push(options.params)
        return Object.assign(await DELAY_DESCRIPTOR.create(ctx, {}), { id: 'hosted' })
      },
    }
    const reg = registry().register(hosted)
    const chain: Patch = { ...CHAIN, effects: [{ deviceId: 'hosted', params: { p7: 0.3 } }] }
    expect(validatePatch(chain, reg)).toEqual([])
    expect(patchDeviceParams(hosted, chain.effects[0])).toEqual({ p7: 0.3 })
    await createPatchEffects(reg, context(), chain)
    expect(made).toEqual([{ p7: 0.3 }])
  })

  it('resolves a device to defaults, then its preset, then its own params', () => {
    const params = patchDeviceParams(DELAY_DESCRIPTOR, CHAIN.effects[0])
    const preset = DELAY_DESCRIPTOR.presets?.['Long tail'] ?? {}
    expect(params.mix).toBe(0.5)
    expect(params.timeSec).toBe(preset.timeSec)
    expect(params.feedback).toBe(preset.feedback)
    expect(Object.keys(params).sort()).toEqual(Object.keys(DELAY_DESCRIPTOR.params).sort())
    // No preset: the spec defaults under the explicit values.
    const bare = patchDeviceParams(DELAY_DESCRIPTOR, { deviceId: 'delay', params: { mix: 2 } })
    expect(bare.mix).toBe(DELAY_DESCRIPTOR.params.mix.max)
    expect(bare.timeSec).toBe(DELAY_DESCRIPTOR.params.timeSec.default)
  })

  it('creates devices with preset, params and bypass applied', async () => {
    const [delay, filter] = await createPatchEffects(registry(), context(), CHAIN)
    expect(delay.id).toBe('delay')
    expect(delay.getParam('mix')).toBe(0.5)
    expect(delay.getParam('timeSec')).toBe(DELAY_DESCRIPTOR.presets?.['Long tail']?.timeSec)
    expect(delay.bypass).toBe(false)
    expect(filter.getParam('frequency')).toBe(900)
    expect(filter.bypass).toBe(true)

    const single = await createPatchDevice(registry(), context(), { deviceId: 'filter' })
    expect(single.bypass).toBe(false)
  })

  it('disposes what it made when one effect fails to load', async () => {
    const reg = registry()
    const dispose = vi.fn()
    reg.register({
      ...DELAY_DESCRIPTOR,
      id: 'tracked',
      create: async (ctx, options) => {
        const device = await DELAY_DESCRIPTOR.create(ctx, options)
        const original = device.dispose.bind(device)
        return Object.assign(device, {
          id: 'tracked',
          dispose: () => {
            dispose()
            original()
          },
        })
      },
    })
    reg.register({
      ...DELAY_DESCRIPTOR,
      id: 'failing',
      create: () => Promise.reject(new Error('module did not load')),
    })
    const patch: Patch = {
      ...CHAIN,
      effects: [{ deviceId: 'tracked' }, { deviceId: 'failing' }, { deviceId: 'tracked' }],
    }
    await expect(createPatchEffects(reg, context(), patch)).rejects.toThrow('module did not load')
    expect(dispose).toHaveBeenCalledTimes(2)
  })

  it('replaces the inserts after the pinned ones and hands back what came off', async () => {
    const reg = registry()
    const ctx = context()
    const inserts: Device[] = []
    const host = {
      inserts,
      addInsert: (device: Device) => void inserts.push(device),
      removeInsert: (device: Device) => void inserts.splice(inserts.indexOf(device), 1),
    }
    const trim = await reg.create('utility', ctx)
    const old = await reg.create('eq3', ctx)
    host.addInsert(trim)
    host.addInsert(old)

    const next = await createPatchEffects(reg, ctx, CHAIN)
    expect(replaceInserts(host, next, { pinned: 1 })).toEqual([old])
    expect(inserts).toEqual([trim, ...next])
    // Nothing pinned: everything comes off, and an empty chain clears the host.
    expect(replaceInserts(host, [])).toEqual([trim, ...next])
    expect(inserts).toEqual([])
  })

  it('captures live devices as a patch that validates and recreates them', async () => {
    const reg = registry()
    const ctx = context()
    const instrument = await reg.create('voice', ctx, { params: { mix: 0.2 } })
    const effects = await createPatchEffects(reg, ctx, CHAIN)
    const captured = capturePatch({ id: 'mine', name: 'Mine', instrument, effects })

    expect(captured.category).toBe('user')
    expect(captured.instrument?.deviceId).toBe('voice')
    expect(captured.instrument?.params?.mix).toBe(0.2)
    expect(captured.effects.map((device) => device.bypass ?? false)).toEqual([false, true])
    expect(validatePatch(captured, reg)).toEqual([])
    expect(isPatch(JSON.parse(JSON.stringify(captured)))).toBe(true)

    const [delay] = await createPatchEffects(reg, ctx, captured)
    expect(delay.getParam('timeSec')).toBe(effects[0].getParam('timeSec'))
  })

  it('tells a patch from other JSON', () => {
    expect(isPatch(CHAIN)).toBe(true)
    expect(isPatch({ ...CHAIN, effects: [{ deviceId: 7 }] })).toBe(false)
    expect(isPatch({ ...CHAIN, effects: [{ deviceId: 'delay', params: { mix: 'half' } }] })).toBe(
      false,
    )
    expect(isPatch({ ...CHAIN, instrument: 'voice' })).toBe(false)
    expect(isPatch({ id: 'x', name: 'X' })).toBe(false)
    expect(isPatch(null)).toBe(false)
  })
})
