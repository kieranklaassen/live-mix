// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Device } from '../../core/devices/Device'
import { deviceParamTarget } from '../../core/automation/ModMatrix'
import { type ParamSpec } from '../../core/params'
import {
  denormalizeParam,
  normalizeParam,
  useDevice,
  useDeviceParam,
  type DeviceWrites,
} from '../hooks/useParam'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

async function filter(fixture: TestEngine): Promise<Device> {
  return fixture.engine.devices.create('filter', fixture.engine.context)
}

/** A device without change events: values are tracked, nothing is announced. */
function silentDevice(): Device {
  const values: Record<string, number> = { amount: 0.5 }
  const params: Record<string, ParamSpec> = {
    amount: { id: 0, name: 'Amount', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
  }
  return {
    id: 'silent',
    input: {} as AudioNode,
    output: {} as AudioNode,
    params,
    setParam: (name, value) => {
      values[name] = value
    },
    getParam: (name) => values[name],
    bypass: false,
    latencySec: 0,
    dispose: () => {},
  }
}

function readDevice(device: Device): Record<string, number> {
  return Object.fromEntries(Object.keys(device.params).map((name) => [name, device.getParam(name)]))
}

describe('useDevice', () => {
  it('reads params, values, bypass and presets from the registry', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const { result } = renderHook(() => useDevice(device), { wrapper: fixture.wrapper })
    expect(result.current.id).toBe('filter')
    expect(result.current.observable).toBe(true)
    expect(result.current.descriptor?.id).toBe('filter')
    expect(result.current.presets.map((preset) => preset.name)).toContain('Low-pass gentle')
    expect(result.current.values).toEqual({ type: 0, frequency: 1000, q: Math.SQRT1_2, gain: 0 })
    expect(result.current.bypass).toBe(false)
    expect(Object.keys(result.current.params)).toEqual(['type', 'frequency', 'q', 'gain'])
  })

  it('setParam clamps and ramps; the hook follows the device event', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const { result } = renderHook(() => useDevice(device), { wrapper: fixture.wrapper })
    act(() => result.current.setParam('frequency', 2500))
    expect(result.current.values.frequency).toBe(2500)
    act(() => result.current.setParam('frequency', 1e9))
    expect(result.current.values.frequency).toBe(20000)
    const biquad = fixture.ctx.filters[0]
    const methods = biquad.frequency.events.map((event) => event.method)
    expect(methods).toContain('linearRampToValueAtTime')
    expect(methods).not.toContain('setValueAtTime')
  })

  it('follows writes made elsewhere (automation, modulation, another panel)', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const { result } = renderHook(() => useDevice(device), { wrapper: fixture.wrapper })
    const target = deviceParamTarget(device, 'q')
    act(() => target.apply(4, 0, 0.01))
    expect(result.current.values.q).toBe(4)
    act(() => {
      device.bypass = true
    })
    expect(result.current.bypass).toBe(true)
  })

  it('applies presets by name and object, captures, resets and toggles bypass', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const { result } = renderHook(() => useDevice(device), { wrapper: fixture.wrapper })
    let applied: string[] = []
    act(() => {
      applied = result.current.applyPreset('Presence peak').applied
    })
    expect(applied.sort()).toEqual(['frequency', 'gain', 'q', 'type'])
    expect(result.current.values).toMatchObject({ type: 5, frequency: 3000, q: 1, gain: 4 })

    // By name a preset is every knob: one that leaves the gain out puts it
    // back where the device starts it, whatever the preset before left there.
    act(() => {
      applied = result.current.applyPreset('Low-pass gentle').applied
    })
    expect(applied.sort()).toEqual(['frequency', 'gain', 'q', 'type'])
    expect(result.current.values).toMatchObject({ type: 0, frequency: 4000, q: 0.5, gain: 0 })
    act(() => {
      result.current.applyPreset('Presence peak')
    })

    const captured = result.current.capturePreset('Mine')
    expect(captured).toMatchObject({ name: 'Mine', deviceId: 'filter', deviceVersion: 2 })
    expect(captured.params.frequency).toBe(3000)

    act(() => result.current.reset())
    expect(result.current.values.frequency).toBe(1000)
    act(() => {
      result.current.applyPreset(captured)
    })
    expect(result.current.values.frequency).toBe(3000)

    // As an object a preset sets what it carries and leaves the rest alone.
    act(() => {
      applied = result.current.applyPreset({ ...captured, params: { q: 2 } }).applied
    })
    expect(applied).toEqual(['q'])
    expect(result.current.values).toMatchObject({ frequency: 3000, q: 2, gain: 4 })

    act(() => result.current.toggleBypass())
    expect(result.current.bypass).toBe(true)
    act(() => result.current.setBypass(false))
    expect(result.current.bypass).toBe(false)
  })

  it("applies a preset captured before the device was renamed, and still refuses another device's", async () => {
    const fixture = createTestEngine()
    const devices = fixture.engine.devices
    devices.register({ ...devices.describe('filter'), formerIds: ['tone'] }, { replace: true })
    const device = await filter(fixture)
    const { result } = renderHook(() => useDevice(device), { wrapper: fixture.wrapper })
    const captured = result.current.capturePreset('Mine')

    let applied: string[] = []
    act(() => {
      applied = result.current.applyPreset({
        ...captured,
        deviceId: 'tone',
        params: { frequency: 3000 },
      }).applied
    })
    expect(applied).toEqual(['frequency'])
    expect(result.current.values.frequency).toBe(3000)
    expect(() => result.current.applyPreset({ ...captured, deviceId: 'gain' })).toThrow(
      /is for gain, not filter/,
    )
  })

  it('works without a registry for a device that announces nothing: own writes re-render', () => {
    const device = silentDevice()
    const { result } = renderHook(() => useDevice(device))
    expect(result.current.observable).toBe(false)
    expect(result.current.descriptor).toBeNull()
    expect(result.current.presets).toEqual([])
    act(() => result.current.setParam('amount', 0.25))
    expect(result.current.values.amount).toBe(0.25)
    expect(() => result.current.applyPreset('Anything')).toThrow(/presets by name need a registry/)
  })
})

describe('useDevice with a host that takes the writes', () => {
  /** A host that only writes down what it was told. */
  function host(): DeviceWrites & { told: unknown[][] } {
    const told: unknown[][] = []
    return {
      told,
      touch: (names) => told.push(['touch', [...names]]),
      set: (params) => told.push(['set', { ...params }]),
      release: (names) => told.push(['release', [...names]]),
      setBypass: (bypass) => told.push(['bypass', bypass]),
    }
  }

  it('hands every write to the host and sets nothing on the device', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const writes = host()
    const { result } = renderHook(() => useDevice(device, { writes }), {
      wrapper: fixture.wrapper,
    })
    expect(result.current.attributed).toBe(false)
    act(() => {
      result.current.touch('frequency')
      result.current.setParam('frequency', 2500)
      result.current.setParam('frequency', 2600)
      result.current.release('frequency')
      result.current.setBypass(true)
      result.current.toggleBypass()
    })
    expect(writes.told).toEqual([
      ['touch', ['frequency']],
      ['set', { frequency: 2500 }],
      ['set', { frequency: 2600 }],
      ['release', ['frequency']],
      ['bypass', true],
      // The device was not turned off, so a toggle still asks for off.
      ['bypass', true],
    ])
    expect(device.getParam('frequency')).toBe(1000)
    expect(device.bypass).toBe(false)
    // What the host then does to the device shows, as any other writer's does.
    act(() => device.setParam('frequency', 2600))
    expect(result.current.values.frequency).toBe(2600)
  })

  it('hands a drag of several parameters over as one hold, without what the device lacks', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const writes = host()
    const { result } = renderHook(() => useDevice(device, { writes }), {
      wrapper: fixture.wrapper,
    })
    act(() => {
      result.current.touchMany(['frequency', 'gain'])
      result.current.setMany({ frequency: 400, gain: 3, gone: 1 })
      result.current.setMany({ gone: 1 })
      result.current.releaseMany(['frequency', 'gain'])
    })
    expect(writes.told).toEqual([
      ['touch', ['frequency', 'gain']],
      ['set', { frequency: 400, gain: 3 }],
      ['release', ['frequency', 'gain']],
    ])
  })

  it('hands a preset and a reset over as one set each, with every parameter in it', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const writes = host()
    const { result } = renderHook(() => useDevice(device, { writes }), {
      wrapper: fixture.wrapper,
    })
    let report = { applied: [] as string[], skipped: [] as string[] }
    act(() => {
      report = result.current.applyPreset('Low-pass gentle')
    })
    expect(report.applied.sort()).toEqual(['frequency', 'gain', 'q', 'type'])
    expect(writes.told).toHaveLength(1)
    const [kind, params] = writes.told[0] as [string, Record<string, number>]
    expect(kind).toBe('set')
    expect(Object.keys(params).sort()).toEqual(['frequency', 'gain', 'q', 'type'])
    act(() => result.current.reset())
    expect(writes.told[1]).toEqual(['set', { type: 0, frequency: 1000, q: Math.SQRT1_2, gain: 0 }])
    expect(readDevice(device)).toEqual({ type: 0, frequency: 1000, q: Math.SQRT1_2, gain: 0 })
  })

  it('lets go of what is in hand when the panel leaves, and calls the host of the latest render', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const first = host()
    const second = host()
    const { result, rerender, unmount } = renderHook(
      ({ writes }: { writes: DeviceWrites }) => useDevice(device, { writes }),
      { wrapper: fixture.wrapper, initialProps: { writes: first } },
    )
    const controls = result.current.setParam
    act(() => result.current.touch('q'))
    rerender({ writes: second })
    // The controls are the same ones: a host that hands a new object each render costs no render.
    expect(result.current.setParam).toBe(controls)
    act(() => result.current.setParam('q', 2))
    expect(second.told).toEqual([['set', { q: 2 }]])
    unmount()
    expect(second.told).toEqual([
      ['set', { q: 2 }],
      ['release', ['q']],
    ])
    expect(first.told).toEqual([['touch', ['q']]])
  })

  it('needs neither of the two ends: a host with no hold of its own takes the sets alone', () => {
    const device = silentDevice()
    const sets: unknown[] = []
    const { result, unmount } = renderHook(() =>
      useDevice(device, { writes: { set: (params) => sets.push(params), setBypass: () => {} } }),
    )
    act(() => {
      result.current.touch('amount')
      result.current.setParam('amount', 0.25)
      result.current.release('amount')
    })
    unmount()
    expect(sets).toEqual([{ amount: 0.25 }])
    expect(device.getParam('amount')).toBe(0.5)
  })
})

describe('useDeviceParam', () => {
  it('binds one parameter with taper-aware normalisation', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const { result } = renderHook(() => useDeviceParam(device, 'frequency'), {
      wrapper: fixture.wrapper,
    })
    expect(result.current.value).toBe(1000)
    expect(result.current.spec.unit).toBe('Hz')
    // log taper: 1000 Hz between 20 and 20000 is log(50)/log(1000) of the way.
    expect(result.current.normalized).toBeCloseTo(Math.log(50) / Math.log(1000))

    act(() => result.current.setNormalized(1))
    expect(result.current.value).toBe(20000)
    act(() => result.current.setNormalized(0))
    expect(result.current.value).toBe(20)
    act(() => result.current.set(440))
    expect(result.current.value).toBe(440)
    act(() => result.current.reset())
    expect(result.current.value).toBe(1000)
  })

  it('re-renders only for its own parameter', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const renders = vi.fn()
    renderHook(() => {
      renders()
      return useDeviceParam(device, 'q')
    })
    const before = renders.mock.calls.length
    act(() => device.setParam('frequency', 300))
    expect(renders.mock.calls.length).toBe(before)
    act(() => device.setParam('q', 2))
    expect(renders.mock.calls.length).toBe(before + 1)
  })

  it('throws for an unknown parameter', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useDeviceParam(device, 'nope'))).toThrow(/no parameter "nope"/)
    error.mockRestore()
  })

  it('normalises linear and log tapers both ways', () => {
    const linear: ParamSpec = {
      id: 0,
      name: '',
      min: -24,
      max: 24,
      default: 0,
      taper: 'linear',
      unit: 'dB',
    }
    const log: ParamSpec = {
      id: 1,
      name: '',
      min: 20,
      max: 20000,
      default: 1000,
      taper: 'log',
      unit: 'Hz',
    }
    expect(normalizeParam(linear, 0)).toBe(0.5)
    expect(denormalizeParam(linear, 0.5)).toBe(0)
    expect(denormalizeParam(linear, 2)).toBe(24)
    expect(normalizeParam(log, 20)).toBe(0)
    expect(normalizeParam(log, 20000)).toBe(1)
    expect(denormalizeParam(log, 0.5)).toBeCloseTo(Math.sqrt(20 * 20000))
    expect(denormalizeParam(log, Number.NaN)).toBe(20)
  })
})
