import { describe, expect, it, vi } from 'vitest'

import { STOCK_WASM_DEVICES, registerStockWasmDevices } from '../../../dsp/registry'
import { asAudioContext, createMockContext } from '../../../testing'
import { type ParamSpec } from '../../params'
import { type Device } from '../Device'
import { devices } from '../index'
import { NODE_DEVICES } from '../native'
import { COMPRESSOR_DESCRIPTOR } from '../native/Compressor'
import { FILTER_DESCRIPTOR, FILTER_PARAMS, createFilter, filterTypeIndex } from '../native/Filter'
import { UTILITY_DESCRIPTOR } from '../native/Utility'
import { DeviceRegistry, type DeviceDescriptor, validateDescriptor } from '../registry'

const PARAMS = {
  amount: { id: 0, name: 'Amount', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
} as const satisfies Record<string, ParamSpec>

function fakeDevice(id: string, params: Record<string, number> = {}): Device {
  const values = new Map(Object.entries(params))
  const node = createMockContext().createGain() as unknown as AudioNode
  return {
    id,
    input: node,
    output: node,
    params: PARAMS,
    setParam: (name, value) => void values.set(name, value),
    getParam: (name) => values.get(name) ?? PARAMS.amount.default,
    bypass: false,
    latencySec: 0,
    dispose: vi.fn(),
  }
}

function descriptor(overrides: Partial<DeviceDescriptor> = {}): DeviceDescriptor {
  return {
    id: 'custom',
    name: 'Custom',
    kind: 'node',
    category: 'other',
    version: 1,
    params: PARAMS,
    create: (_context, options) => fakeDevice('custom', options.params),
    ...overrides,
  }
}

describe('validateDescriptor', () => {
  it('accepts every stock descriptor', () => {
    for (const stock of [...NODE_DEVICES, ...STOCK_WASM_DEVICES]) {
      expect(() => validateDescriptor(stock)).not.toThrow()
    }
  })

  it.each([
    [{ id: '' }, /needs an id/],
    [{ name: '' }, /needs a name/],
    [{ version: 0 }, /integer version/],
    [{ version: 1.5 }, /integer version/],
    [{ create: undefined as unknown as DeviceDescriptor['create'] }, /create factory/],
    [{ params: {} }, /no parameters/],
    [
      {
        params: {
          a: { ...PARAMS.amount },
          b: { ...PARAMS.amount },
        },
      },
      /reuses param id 0/,
    ],
    [{ params: { a: { ...PARAMS.amount, min: 1, max: 1 } } }, /min < max/],
    [{ params: { a: { ...PARAMS.amount, default: 2 } } }, /outside \[0, 1\]/],
    [{ params: { a: { ...PARAMS.amount, taper: 'log' as const } } }, /log taper/],
    [{ presets: { Bad: { nope: 1 } } }, /unknown param "nope"/],
    [{ presets: { Bad: { amount: 2 } } }, /outside \[0, 1\]/],
    [{ presets: { Bad: { amount: Number.NaN } } }, /outside \[0, 1\]/],
  ])('rejects %o', (overrides, message) => {
    expect(() => validateDescriptor(descriptor(overrides))).toThrow(message)
  })
})

describe('DeviceRegistry', () => {
  it('starts with what it is given, in order, and answers has/get/describe/ids', () => {
    const registry = new DeviceRegistry([FILTER_DESCRIPTOR, COMPRESSOR_DESCRIPTOR])
    expect(registry.ids()).toEqual(['filter', 'compressor'])
    expect(registry.has('filter')).toBe(true)
    expect(registry.has('nope')).toBe(false)
    expect(registry.get('compressor')).toBe(COMPRESSOR_DESCRIPTOR)
    expect(registry.get('nope')).toBeUndefined()
    expect(registry.describe('filter')).toBe(FILTER_DESCRIPTOR)
    expect(() => registry.describe('nope')).toThrow(/unknown device "nope"/)
  })

  it('refuses duplicate ids unless replace is set, and unregisters', () => {
    const registry = new DeviceRegistry([FILTER_DESCRIPTOR])
    expect(() => registry.register(FILTER_DESCRIPTOR)).toThrow(/already registered/)
    const replacement = { ...FILTER_DESCRIPTOR, name: 'Filter 2', version: 2 }
    registry.register(replacement, { replace: true })
    expect(registry.describe('filter').name).toBe('Filter 2')
    expect(registry.ids()).toEqual(['filter'])
    expect(registry.unregister('filter')).toBe(true)
    expect(registry.unregister('filter')).toBe(false)
    expect(registry.ids()).toEqual([])
  })

  it('validates on register', () => {
    const registry = new DeviceRegistry()
    expect(() => registry.register(descriptor({ params: {} }))).toThrow(/no parameters/)
    expect(registry.ids()).toEqual([])
  })

  it('lists by kind and category', () => {
    const registry = registerStockWasmDevices(new DeviceRegistry(NODE_DEVICES))
    expect(registry.list()).toHaveLength(NODE_DEVICES.length + STOCK_WASM_DEVICES.length)
    expect(registry.list({ kind: 'node' })).toEqual(NODE_DEVICES)
    expect(registry.list({ kind: 'wasm' })).toEqual(
      STOCK_WASM_DEVICES.filter((d) => d.kind === 'wasm'),
    )
    expect(registry.list({ kind: 'worklet' }).map((d) => d.id)).toEqual(['ducker'])
    expect(registry.list({ category: 'reverb' }).map((d) => d.id)).toEqual([
      'convolver-reverb',
      'dattorro',
      'fdn-reverb',
      'zita-rev1',
      'ether-reverb',
    ])
    expect(registry.list({ kind: 'node', category: 'dynamics' }).map((d) => d.id)).toEqual([
      'compressor',
    ])
    expect(registry.list({ kind: 'wasm', category: 'dynamics' }).map((d) => d.id)).toEqual([
      'limiter-1176',
    ])
  })

  it('creates by id with defaults, params, presets, and params over presets', async () => {
    const registry = new DeviceRegistry([FILTER_DESCRIPTOR])
    const ctx = asAudioContext(createMockContext())

    const plain = await registry.create('filter', ctx)
    expect(plain.id).toBe('filter')
    expect(plain.getParam('frequency')).toBe(FILTER_PARAMS.frequency.default)

    const tuned = await registry.create('filter', ctx, { params: { frequency: 250 } })
    expect(tuned.getParam('frequency')).toBe(250)

    const preset = await registry.create('filter', ctx, { preset: 'High-pass rumble' })
    expect(preset.getParam('type')).toBe(filterTypeIndex('highpass'))
    expect(preset.getParam('frequency')).toBe(80)
    expect(preset.getParam('gain')).toBe(FILTER_PARAMS.gain.default)

    const overridden = await registry.create('filter', ctx, {
      preset: 'High-pass rumble',
      params: { frequency: 120 },
    })
    expect(overridden.getParam('type')).toBe(filterTypeIndex('highpass'))
    expect(overridden.getParam('frequency')).toBe(120)

    const object = await registry.create('filter', ctx, {
      preset: { name: 'x', deviceId: 'filter', deviceVersion: 1, params: { q: 3 } },
    })
    expect(object.getParam('q')).toBe(3)

    await expect(registry.create('filter', ctx, { preset: 'Nope' })).rejects.toThrow(/no preset/)
    await expect(
      registry.create('filter', ctx, {
        preset: { name: 'x', deviceId: 'eq3', deviceVersion: 1, params: {} },
      }),
    ).rejects.toThrow(/is for eq3, not filter/)
    await expect(registry.create('nope', ctx)).rejects.toThrow(/unknown device "nope"/)
  })

  it('hands extra options through to the factory untouched', async () => {
    const create = vi.fn((_context: BaseAudioContext, options: { params?: unknown }) =>
      fakeDevice('custom', options.params as Record<string, number>),
    )
    const registry = new DeviceRegistry([descriptor({ create })])
    const ctx = asAudioContext(createMockContext())
    await registry.create('custom', ctx, { params: { amount: 0.2 }, processorUrl: 'p', extra: 1 })
    expect(create).toHaveBeenCalledWith(ctx, {
      params: { amount: 0.2 },
      processorUrl: 'p',
      extra: 1,
    })
  })

  it('awaits async factories, so a device can load its code lazily', async () => {
    let loads = 0
    const lazy = descriptor({
      id: 'lazy',
      create: async (_context, options) => {
        loads += 1
        await Promise.resolve()
        return fakeDevice('lazy', options.params)
      },
    })
    const registry = new DeviceRegistry([lazy])
    expect(loads).toBe(0)
    const device = await registry.create('lazy', asAudioContext(createMockContext()), {
      params: { amount: 0.9 },
    })
    expect(loads).toBe(1)
    expect(device.getParam('amount')).toBe(0.9)
  })

  it('disposes and rejects a device whose id does not match its descriptor', async () => {
    const wrong = fakeDevice('other')
    const registry = new DeviceRegistry([descriptor({ create: () => wrong })])
    await expect(registry.create('custom', asAudioContext(createMockContext()))).rejects.toThrow(
      /created a device with id "other"/,
    )
    expect(wrong.dispose).toHaveBeenCalledTimes(1)
  })

  it('materialises presets and captures them with the descriptor version', () => {
    const registry = new DeviceRegistry([{ ...UTILITY_DESCRIPTOR, version: 4 }])
    const presets = registry.presets('utility')
    expect(presets.map((p) => p.name)).toEqual(['Unity', 'Mono', 'Bass mono', 'Invert polarity'])
    expect(presets[1]).toEqual({
      name: 'Mono',
      deviceId: 'utility',
      deviceVersion: 4,
      params: { width: 0 },
    })

    const filter = createFilter(asAudioContext(createMockContext()), { params: { gain: 1 } })
    expect(() => registry.capturePreset(filter, 'x')).toThrow(/unknown device "filter"/)
    registry.register(FILTER_DESCRIPTOR)
    expect(registry.capturePreset(filter, 'Snap')).toEqual({
      name: 'Snap',
      deviceId: 'filter',
      deviceVersion: 1,
      params: {
        type: 0,
        frequency: FILTER_PARAMS.frequency.default,
        q: FILTER_PARAMS.q.default,
        gain: 1,
      },
    })
  })

  it('notifies listeners on register and unregister until unsubscribed', () => {
    const registry = new DeviceRegistry()
    const events: string[] = []
    const off = registry.onChange((event) => events.push(`${event.type}:${event.descriptor.id}`))
    registry.register(FILTER_DESCRIPTOR)
    registry.register(FILTER_DESCRIPTOR, { replace: true })
    registry.unregister('filter')
    registry.unregister('filter')
    off()
    registry.register(FILTER_DESCRIPTOR)
    expect(events).toEqual(['register:filter', 'register:filter', 'unregister:filter'])
  })
})

describe('default registry', () => {
  it('ships every node device pre-registered, in menu order', () => {
    expect(devices.list({ kind: 'node' }).map((d) => d.id)).toEqual([
      'filter',
      'eq3',
      'parametric-eq',
      'compressor',
      'delay',
      'convolver-reverb',
      'utility',
    ])
  })

  it('gains the stock WASM devices once through registerStockWasmDevices', () => {
    const before = devices.list({ kind: 'wasm' }).length
    expect(registerStockWasmDevices()).toBe(devices)
    registerStockWasmDevices()
    const wasm = devices.list({ kind: 'wasm' }).map((d) => d.id)
    expect(wasm).toEqual([
      'dattorro',
      'fdn-reverb',
      'stereo-widener',
      'zita-rev1',
      'limiter-1176',
      'spectral-drifter',
      'ether-reverb',
      'felt-piano',
    ])
    expect(wasm.length).toBeGreaterThanOrEqual(before)
    expect(new Set(devices.ids()).size).toBe(devices.ids().length)
  })
})
