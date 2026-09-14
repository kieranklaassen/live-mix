import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { type WasmDeviceProcessorOptions } from '../abi'
import { FDN_REVERB_DEVICE, FDN_REVERB_PARAMS, createFdnReverb } from '../devices/fdn-reverb'
import { type WorkletNodeFactory } from '../WasmDevice'

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), '../wasm/fdn-reverb.wasm')

const mockNodeFactory: WorkletNodeFactory = (context, name, options) =>
  (context as unknown as MockAudioContext).createWorkletNode(
    name,
    options,
  ) as unknown as AudioWorkletNode

describe('createFdnReverb', () => {
  it('builds a device over the committed fdn-reverb.wasm with the U21 param table', async () => {
    const ctx = createMockContext()
    const module = await WebAssembly.compile(await readFile(wasmPath))
    const device = await createFdnReverb(asAudioContext(ctx), {
      wasm: module,
      processorUrl: 'p',
      createNode: mockNodeFactory,
      params: { decay: 8, breathDepth: 0.9 },
    })

    expect(device.id).toBe('fdn-reverb')
    expect(FDN_REVERB_DEVICE.id).toBe('fdn-reverb')
    expect((FDN_REVERB_DEVICE.wasm() as URL).pathname.endsWith('/wasm/fdn-reverb.wasm')).toBe(true)
    const options = ctx.workletNodes[0].options as AudioWorkletNodeOptions
    const processorOptions = options.processorOptions as WasmDeviceProcessorOptions
    expect(processorOptions.deviceId).toBe('fdn-reverb')
    expect(processorOptions.params).toEqual(
      Object.values(FDN_REVERB_PARAMS).map((spec) => [
        spec.id,
        spec.id === FDN_REVERB_PARAMS.decay.id
          ? 8
          : spec.id === FDN_REVERB_PARAMS.breathDepth.id
            ? 0.9
            : spec.default,
      ]),
    )
    expect(device.getParam('decay')).toBe(8)
    expect(device.getParam('size')).toBe(1)

    device.setParam('size', 5)
    expect(device.getParam('size')).toBe(FDN_REVERB_PARAMS.size.max)
    expect(ctx.workletNodes[0].port.posted.last?.[0]).toEqual({
      type: 'set-param',
      paramId: FDN_REVERB_PARAMS.size.id,
      value: 2,
    })
  })
})
