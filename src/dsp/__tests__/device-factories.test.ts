// Every stock device factory builds a WasmDevice over its committed artefact
// with its own param table. One table-driven test keeps the five (and future
// U37 devices) in lockstep with the WasmDevice host.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { type WasmDeviceProcessorOptions } from '../abi'
import { DATTORRO_DEVICE, createDattorroReverb } from '../devices/dattorro'
import { FDN_REVERB_DEVICE, createFdnReverb } from '../devices/fdn-reverb'
import { LIMITER_1176_DEVICE, createLimiter1176 } from '../devices/limiter-1176'
import { STEREO_WIDENER_DEVICE, createStereoWidener } from '../devices/stereo-widener'
import { TRUE_PEAK_LIMITER_DEVICE, createTruePeakLimiter } from '../devices/true-peak-limiter'
import { ZITA_REV1_DEVICE, createZitaReverb } from '../devices/zita-rev1'
import { type WasmDeviceDefinition, type WorkletNodeFactory } from '../WasmDevice'

const wasmDir = join(dirname(fileURLToPath(import.meta.url)), '../wasm')

const mockNodeFactory: WorkletNodeFactory = (context, name, options) =>
  (context as unknown as MockAudioContext).createWorkletNode(
    name,
    options,
  ) as unknown as AudioWorkletNode

const factories = [
  { definition: DATTORRO_DEVICE, create: createDattorroReverb, artefact: 'dattorro.wasm' },
  { definition: FDN_REVERB_DEVICE, create: createFdnReverb, artefact: 'fdn-reverb.wasm' },
  {
    definition: STEREO_WIDENER_DEVICE,
    create: createStereoWidener,
    artefact: 'stereo-widener.wasm',
  },
  { definition: ZITA_REV1_DEVICE, create: createZitaReverb, artefact: 'zita-rev1.wasm' },
  { definition: LIMITER_1176_DEVICE, create: createLimiter1176, artefact: 'limiter-1176.wasm' },
  {
    definition: TRUE_PEAK_LIMITER_DEVICE,
    create: createTruePeakLimiter,
    artefact: 'true-peak-limiter.wasm',
  },
] as const

describe.each(factories)('$definition.id factory', ({ definition, create, artefact }) => {
  const def = definition as WasmDeviceDefinition

  it('resolves its default wasm URL lazily to the committed artefact', () => {
    const url = def.wasm()
    expect(url).toBeInstanceOf(URL)
    expect((url as URL).pathname.endsWith(`/wasm/${artefact}`)).toBe(true)
  })

  it('instantiates the committed artefact through the device ABI', async () => {
    const bytes = await readFile(join(wasmDir, artefact))
    const { instance } = await WebAssembly.instantiate(bytes, {})
    const exports = instance.exports as Record<string, unknown>
    for (const name of [
      'device_init',
      'device_set_param',
      'device_in_left',
      'device_in_right',
      'device_out_left',
      'device_out_right',
      'device_max_block_frames',
      'device_process',
    ]) {
      expect(typeof exports[name]).toBe('function')
    }
  })

  it('seeds processorOptions from its param table and clamps overrides', async () => {
    const ctx = createMockContext()
    const module = await WebAssembly.compile(await readFile(join(wasmDir, artefact)))
    const [firstName, firstSpec] = Object.entries(def.params)[0]
    const device = await (create as typeof createDattorroReverb)(asAudioContext(ctx), {
      wasm: module,
      processorUrl: 'p',
      createNode: mockNodeFactory,
      params: { [firstName]: firstSpec.max + 1 },
    })

    expect(device.id).toBe(def.id)
    const options = ctx.workletNodes[0].options as AudioWorkletNodeOptions
    const processorOptions = options.processorOptions as WasmDeviceProcessorOptions
    expect(processorOptions.deviceId).toBe(def.id)
    expect(processorOptions.params).toEqual(
      Object.entries(def.params).map(([name, spec]) => [
        spec.id,
        name === firstName ? spec.max : spec.default,
      ]),
    )
    expect(device.getParam(firstName as never)).toBe(firstSpec.max)
  })
})
