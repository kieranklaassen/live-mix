// One contract for every spec device (cpp/devices/<id>/device.json with a
// params array): the generated files are current, the committed artefact
// honours the ABI and its own parameter table, and the factory builds a
// WasmDevice over it. What each device actually sounds like is asserted by
// its native harness (cpp/test/<id>_test.cpp).
//
// DEVICE=<id> narrows the run to one device while it is being written.

import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { type ParamSpec } from '../../core/params'
import { type WasmDeviceProcessorOptions } from '../abi'
import * as generated from '../devices/index.gen'
import { STOCK_WASM_DEVICES } from '../registry'
import { type WasmDeviceDefinition, type WorkletNodeFactory, type WasmDevice } from '../WasmDevice'
import { DEVICE_EXPORT_NAMES, loadWasmDevice } from './wasm-device-harness'
// @ts-expect-error: plain ESM build script without types.
import { staleOutputs } from '../../../scripts/gen-devices.mjs'

const only = process.env.DEVICE
const entries = generated.GENERATED_WASM_DEVICES.filter((entry) => !only || entry.id === only)

const constCase = (id: string) => id.replaceAll('-', '_').toUpperCase()
const exportsByName = generated as unknown as Record<string, unknown>
const definitionOf = (id: string) =>
  exportsByName[`${constCase(id)}_DEVICE`] as WasmDeviceDefinition<Record<string, ParamSpec>>

const mockNodeFactory: WorkletNodeFactory = (context, name, options) =>
  (context as unknown as MockAudioContext).createWorkletNode(
    name,
    options,
  ) as unknown as AudioWorkletNode

const BLOCK = 128

describe('generated device files', () => {
  it.skipIf(Boolean(only))('are what scripts/gen-devices.mjs writes today', async () => {
    expect(await (staleOutputs as () => Promise<string[]>)()).toEqual([])
  })

  it('are all part of the stock registry list, with unique ids', () => {
    const ids = STOCK_WASM_DEVICES.map((descriptor) => descriptor.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const descriptor of generated.GENERATED_WASM_DESCRIPTORS) {
      expect(ids).toContain(descriptor.id)
      expect(descriptor.description?.length ?? 0).toBeGreaterThan(20)
      expect(Object.keys(descriptor.presets ?? {}).length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe.each(entries)(
  '$id (generated device)',
  ({ id, instrument, samples, meters, memoryMb }) => {
    const definition = definitionOf(id)
    const specs = Object.values(definition.params)

    it('exports the ABI from a module that needs no imports and has fixed memory', async () => {
      const harness = await loadWasmDevice(id)
      const device = harness.device as unknown as Record<string, unknown>
      for (const name of DEVICE_EXPORT_NAMES) expect(typeof device[name]).toBe('function')
      expect(typeof device.device_note_on === 'function').toBe(instrument)
      expect(typeof device.device_note_off === 'function').toBe(instrument)
      expect(typeof device.device_sample_commit === 'function').toBe(samples)
      expect(typeof device.device_meter === 'function').toBe(meters > 0)
      expect(harness.maxBlock).toBe(2048)
      expect(harness.device.memory.buffer.byteLength).toBe(memoryMb * 1024 * 1024)
    })

    it('numbers its parameters 0..n-1 with defaults inside their ranges', () => {
      expect(specs.map((spec) => spec.id).sort((a, b) => a - b)).toEqual(specs.map((_, i) => i))
      for (const spec of specs) {
        expect(spec.default).toBeGreaterThanOrEqual(spec.min)
        expect(spec.default).toBeLessThanOrEqual(spec.max)
      }
    })

    it('numbers its meters 0..n-1 and reads each one finite at rest', async () => {
      const table = Object.values(definition.meters ?? {})
      expect(table.map((meter) => meter.id).sort((a, b) => a - b)).toEqual(
        Array.from({ length: meters }, (_, index) => index),
      )
      if (meters === 0) return
      const harness = await loadWasmDevice(id)
      harness.renderSilence(0.05)
      for (const meter of table) {
        expect(Number.isFinite(harness.device.device_meter?.(meter.id))).toBe(true)
      }
    })

    it('is silent until something excites it', async () => {
      const harness = await loadWasmDevice(id)
      expect(harness.renderSilence(0.25).peak).toBe(0)
    })

    it('makes finite, bounded sound', async () => {
      const harness = await loadWasmDevice(id)
      let peak = 0
      if (instrument) {
        harness.device.device_note_on?.(1, 220, 0.7)
        peak = harness.renderSilence(1).peak
        harness.device.device_note_off?.(1)
      } else {
        // Wet-only where the device has a mix, so a pass-through cannot hide a dead effect.
        const mix = definition.params.mix
        if (mix) harness.set(mix, mix.max)
        peak = harness.feedTone(1, 330, 0.5)
        // Long enough for a loop or delay whose first repeat is seconds away.
        peak = Math.max(peak, harness.renderSilence(2).peak)
      }
      expect(Number.isFinite(peak)).toBe(true)
      expect(peak).toBeGreaterThan(1e-4)
      expect(peak).toBeLessThan(8)
    })

    it('stays finite with every parameter at its minimum and its maximum', async () => {
      for (const edge of ['min', 'max'] as const) {
        const harness = await loadWasmDevice(id)
        for (const spec of specs) harness.set(spec, spec[edge])
        if (instrument) {
          harness.device.device_note_on?.(1, 110, 0.9)
          harness.device.device_note_on?.(2, 660, 0.9)
          expect(Number.isFinite(harness.renderSilence(0.5).peak)).toBe(true)
        } else {
          expect(Number.isFinite(harness.feedTone(0.5, 330, 0.9))).toBe(true)
        }
      }
    })

    it('ignores unknown parameter ids and non-finite values', async () => {
      const harness = await loadWasmDevice(id)
      harness.device.device_set_param(-1, 1)
      harness.device.device_set_param(specs.length, 1)
      for (const spec of specs) harness.device.device_set_param(spec.id, Number.NaN)
      if (instrument) harness.device.device_note_on?.(1, 220, 0.7)
      const block = new Float32Array(BLOCK).fill(0.25)
      harness.processBlock(block)
      const out = harness.view(harness.device.device_out_left(), BLOCK)
      expect(out.every((sample) => Number.isFinite(sample))).toBe(true)
    })

    it('consumes its input: an unwritten block is silence, not a repeat', async () => {
      const harness = await loadWasmDevice(id)
      harness.processBlock(new Float32Array(BLOCK).fill(0.5))
      const input = harness.view(harness.device.device_in_left(), BLOCK)
      expect(input.every((sample) => sample === 0)).toBe(true)
    })

    it.runIf(samples)('takes a loaded sound through the sample entry points', async () => {
      const harness = await loadWasmDevice(id)
      const device = harness.device
      const capacity = device.device_sample_capacity?.() ?? 0
      expect(capacity).toBeGreaterThan(48000)
      const frames = 24000
      const store = harness.view(device.device_sample_buffer?.() ?? 0, capacity * 2)
      for (let i = 0; i < frames; i += 1) {
        const value = 0.5 * Math.sin((2 * Math.PI * 220 * i) / 48000)
        store[i] = value
        store[capacity + i] = value
      }
      device.device_sample_commit?.(frames, 2, 48000)
      device.device_note_on?.(1, 261.63, 0.8)
      const { peak } = harness.renderSilence(1)
      expect(Number.isFinite(peak)).toBe(true)
      expect(peak).toBeGreaterThan(1e-3)
    })

    it('builds a WasmDevice with its parameter table through the generated factory', async () => {
      const context = createMockContext()
      const create = exportsByName[
        `create${id
          .split('-')
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join('')}`
      ] as (
        context: BaseAudioContext,
        options: { wasm: WebAssembly.Module; processorUrl: string; createNode: WorkletNodeFactory },
      ) => Promise<WasmDevice>
      expect(typeof create).toBe('function')
      const module = await WebAssembly.compile(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]))
      const device = await create(asAudioContext(context), {
        wasm: module,
        processorUrl: 'p',
        createNode: mockNodeFactory,
      })
      expect(device.id).toBe(id)
      const nodeOptions = context.workletNodes[0].options as AudioWorkletNodeOptions
      const options = nodeOptions.processorOptions as WasmDeviceProcessorOptions
      expect(options.deviceId).toBe(id)
      expect(options.params).toEqual(specs.map((spec) => [spec.id, spec.default]))
      const url = definition.wasm()
      expect((url as URL).pathname.endsWith(`/wasm/${id}.wasm`)).toBe(true)
      device.dispose()
    })
  },
)
