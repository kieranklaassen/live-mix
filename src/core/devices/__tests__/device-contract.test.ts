// Every registered device — the node devices, the rack, every stock WASM
// device and a WAM behind the U35 adapter — honours the Device contract the
// same way when created through the registry. Adding a device to NODE_DEVICES
// or STOCK_WASM_DEVICES adds it to this table.

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

import { STOCK_WASM_DEVICES } from '../../../dsp/registry'
import { type WasmDeviceDefinition, type WorkletNodeFactory } from '../../../dsp/WasmDevice'
import { asAudioContext, createMockContext, type MockAudioContext } from '../../../testing'
import { FAKE_EFFECT_CONFIG, FakeWamNode, defineFakeWam } from '../../../wam/__tests__/fake-wam'
import { wamParamSpecs } from '../../../wam/params'
import { wamDeviceDescriptor } from '../../../wam/registry'
import { clampParam } from '../../params'
import { type Device } from '../Device'
import { NODE_DEVICES } from '../native'
import { applyPreset, listPresets, parsePreset, serializePreset } from '../presets'
import { RACK_DESCRIPTOR } from '../Rack'
import { type DeviceCreateRequest, type DeviceDescriptor, DeviceRegistry } from '../registry'

// The stock WASM definitions live next to their descriptors; their lazy URLs
// point at the committed artefacts, which the contract test compiles once.
import { DATTORRO_DEVICE } from '../../../dsp/devices/dattorro'
import { ETHER_REVERB_DEVICE } from '../../../dsp/devices/ether-reverb'
import { FELT_PIANO_DEVICE } from '../../../dsp/devices/felt-piano'
import { FDN_REVERB_DEVICE } from '../../../dsp/devices/fdn-reverb'
import { LIMITER_1176_DEVICE } from '../../../dsp/devices/limiter-1176'
import { SPECTRAL_DRIFTER_DEVICE } from '../../../dsp/devices/spectral-drifter'
import { STEREO_WIDENER_DEVICE } from '../../../dsp/devices/stereo-widener'
import { ZITA_REV1_DEVICE } from '../../../dsp/devices/zita-rev1'

const WASM_DEFINITIONS: readonly WasmDeviceDefinition[] = [
  DATTORRO_DEVICE,
  FDN_REVERB_DEVICE,
  STEREO_WIDENER_DEVICE,
  ZITA_REV1_DEVICE,
  LIMITER_1176_DEVICE,
  SPECTRAL_DRIFTER_DEVICE,
  ETHER_REVERB_DEVICE,
  FELT_PIANO_DEVICE,
]

const mockNodeFactory: WorkletNodeFactory = (context, name, options) =>
  (context as unknown as MockAudioContext).createWorkletNode(
    name,
    options,
  ) as unknown as AudioWorkletNode

const modules = new Map<string, WebAssembly.Module>()

beforeAll(async () => {
  for (const definition of WASM_DEFINITIONS) {
    const url = definition.wasm() as URL
    modules.set(definition.id, await WebAssembly.compile(await readFile(fileURLToPath(url))))
  }
})

// The WAM row: the in-repo fake plugin behind a descriptor built the way a
// score restores one (a persisted param table, no probe).
const FAKE_WAM_DESCRIPTOR = wamDeviceDescriptor({
  id: 'wam-fake-effect',
  name: 'Fake WAM Effect',
  category: 'other',
  source: defineFakeWam(FAKE_EFFECT_CONFIG),
  params: wamParamSpecs(new FakeWamNode(FAKE_EFFECT_CONFIG).info),
  presets: { Warm: { mode: 1, cutoff: 4000 }, Loud: { gain: 12 } },
  host: { groupId: 'contract', groupKey: 'k' },
})

const registry = new DeviceRegistry([
  ...NODE_DEVICES,
  RACK_DESCRIPTOR,
  ...STOCK_WASM_DEVICES,
  FAKE_WAM_DESCRIPTOR,
])

/** Per-kind options the factories need under the mocks. */
function requestFor(descriptor: DeviceDescriptor): DeviceCreateRequest {
  if (descriptor.kind === 'worklet') return { processorUrl: 'p', createNode: mockNodeFactory }
  if (descriptor.kind !== 'wasm') return {}
  const module = modules.get(descriptor.id)
  if (!module) throw new Error(`no compiled module for ${descriptor.id}`)
  return { wasm: module, processorUrl: 'p', createNode: mockNodeFactory }
}

async function make(
  descriptor: DeviceDescriptor,
  request: DeviceCreateRequest = {},
): Promise<{ device: Device; ctx: MockAudioContext }> {
  const ctx = createMockContext({ currentTime: 1 })
  const device = await registry.create(descriptor.id, asAudioContext(ctx), {
    ...requestFor(descriptor),
    ...request,
  })
  return { device, ctx }
}

const table = [...NODE_DEVICES, RACK_DESCRIPTOR, ...STOCK_WASM_DEVICES, FAKE_WAM_DESCRIPTOR].map(
  (descriptor) => ({ id: descriptor.id, descriptor }),
)

it('covers every stock device and the WAM adapter', () => {
  expect(table.map((row) => row.id).sort()).toEqual(
    [
      'filter',
      'eq3',
      'parametric-eq',
      'compressor',
      'delay',
      'convolver-reverb',
      'utility',
      'rack',
      'dattorro',
      'fdn-reverb',
      'stereo-widener',
      'zita-rev1',
      'limiter-1176',
      'ducker',
      'spectral-drifter',
      'wam-fake-effect',
      'ether-reverb',
      'felt-piano',
    ].sort(),
  )
  expect(WASM_DEFINITIONS.map((d) => d.id).sort()).toEqual(
    STOCK_WASM_DEVICES.filter((d) => d.kind === 'wasm')
      .map((d) => d.id)
      .sort(),
  )
})

describe.each(table)('$id honours the Device contract', ({ descriptor }) => {
  const entries = Object.entries(descriptor.params)
  const [firstName, firstSpec] = entries[0]

  it('describes itself: metadata and a sane param table', () => {
    expect(descriptor.id).toMatch(/^[a-z0-9-]+$/)
    expect(descriptor.name.length).toBeGreaterThan(0)
    expect(['node', 'wasm', 'worklet', 'rack', 'wam']).toContain(descriptor.kind)
    expect(descriptor.version).toBeGreaterThanOrEqual(1)
    expect(entries.length).toBeGreaterThan(0)
    const ids = entries.map(([, spec]) => spec.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const [, spec] of entries) {
      expect(spec.min).toBeLessThan(spec.max)
      expect(spec.default).toBeGreaterThanOrEqual(spec.min)
      expect(spec.default).toBeLessThanOrEqual(spec.max)
      if (spec.taper === 'log') expect(spec.min).toBeGreaterThan(0)
    }
  })

  it('instantiates through the registry with its descriptor id, params and defaults', async () => {
    const { device, ctx } = await make(descriptor)
    expect(device.id).toBe(descriptor.id)
    expect(device.params).toEqual(descriptor.params)
    expect(typeof device.input.connect).toBe('function')
    expect(typeof device.output.connect).toBe('function')
    for (const [name, spec] of entries) expect(device.getParam(name)).toBe(spec.default)
    expect(Number.isFinite(device.latencySec)).toBe(true)
    expect(device.latencySec).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(device.latencySamples)).toBe(true)
    expect(device.latencySamples).toBe(Math.round(device.latencySec * ctx.sampleRate))
    expect(device.bypass).toBe(false)
    device.dispose()
  })

  it('clamps values at construction and on setParam, and rejects unknown names', async () => {
    const { device } = await make(descriptor, { params: { [firstName]: firstSpec.max + 1 } })
    expect(device.getParam(firstName)).toBe(firstSpec.max)

    device.setParam(firstName, firstSpec.min - 1)
    expect(device.getParam(firstName)).toBe(firstSpec.min)
    const mid = (firstSpec.min + firstSpec.max) / 2
    device.setParam(firstName, mid)
    expect(device.getParam(firstName)).toBe(mid)
    device.setParam(firstName, Number.NaN)
    expect(device.getParam(firstName)).toBe(firstSpec.default)

    expect(() => device.setParam('no-such-param', 1)).toThrow(/no parameter/)
    expect(() => device.getParam('no-such-param')).toThrow(/no parameter/)
    device.dispose()
  })

  it('toggles bypass and reads it back', async () => {
    const { device } = await make(descriptor)
    device.bypass = true
    expect(device.bypass).toBe(true)
    device.bypass = false
    expect(device.bypass).toBe(false)
    device.dispose()
  })

  it('loads every factory preset, leaving untouched params at their defaults', async () => {
    const presets = listPresets(descriptor)
    expect(presets.length).toBeGreaterThan(0)
    for (const preset of presets) {
      const { device } = await make(descriptor, { preset: preset.name })
      for (const [name, spec] of entries) {
        const expected =
          name in preset.params ? clampParam(spec, preset.params[name]) : spec.default
        expect(device.getParam(name), `${preset.name}.${name}`).toBe(expected)
      }
      device.dispose()
    }
  })

  it('round-trips a captured preset through JSON onto a fresh instance', async () => {
    const { device: source } = await make(descriptor)
    const mid = (firstSpec.min + firstSpec.max) / 2
    source.setParam(firstName, mid)
    const preset = parsePreset(serializePreset(registry.capturePreset(source, 'Captured')))
    expect(preset.deviceId).toBe(descriptor.id)
    expect(preset.deviceVersion).toBe(descriptor.version)

    const { device: target } = await make(descriptor)
    const result = applyPreset(target, preset)
    expect(result.skipped).toEqual([])
    expect(result.applied.sort()).toEqual(entries.map(([name]) => name).sort())
    for (const [name] of entries) expect(target.getParam(name)).toBe(source.getParam(name))
    source.dispose()
    target.dispose()
  })

  it('disposes idempotently and stays inert afterwards', async () => {
    const { device } = await make(descriptor)
    device.dispose()
    expect(() => device.dispose()).not.toThrow()
    expect(() => device.setParam(firstName, firstSpec.default)).not.toThrow()
    expect(() => {
      device.bypass = true
    }).not.toThrow()
  })
})
