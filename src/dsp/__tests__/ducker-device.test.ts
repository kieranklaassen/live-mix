import { describe, expect, it } from 'vitest'

import { DeviceRegistry } from '../../core/devices'
import {
  DUCKER_PROCESSOR_NAME,
  type DuckerProcessorOptions,
} from '../../core/devices/native/ducker-abi'
import { WorkletDucker } from '../../core/devices/native/WorkletDucker'
import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { createWorkletDucker, duckerProcessorUrl, loadDuckerProcessor } from '../devices/ducker'
import { WORKLET_DUCKER_DESCRIPTOR } from '../registry'
import { type WorkletNodeFactory } from '../WasmDevice'

function nodeFactory(ctx: MockAudioContext): WorkletNodeFactory {
  return (_context, name, options) =>
    ctx.createWorkletNode(name, options) as unknown as AudioWorkletNode
}

describe('ducker dsp entry', () => {
  it('resolves the bundled processor next to the dsp entry', () => {
    expect(duckerProcessorUrl()).toMatch(/worklets\/ducker\.js$/)
  })

  it('loads the processor once per context per URL and accepts overrides', async () => {
    const ctx = createMockContext()
    const context = asAudioContext(ctx)
    await Promise.all([loadDuckerProcessor(context), loadDuckerProcessor(context)])
    expect(ctx.audioWorklet.modules).toHaveLength(1)
    expect(ctx.audioWorklet.modules[0]).toMatch(/worklets\/ducker\.js$/)

    await loadDuckerProcessor(context, 'https://cdn.example/ducker.js')
    await loadDuckerProcessor(context, new URL('https://cdn.example/ducker.js'))
    expect(ctx.audioWorklet.modules).toEqual([
      expect.stringMatching(/worklets\/ducker\.js$/),
      'https://cdn.example/ducker.js',
    ])

    const other = createMockContext()
    await loadDuckerProcessor(asAudioContext(other))
    expect(other.audioWorklet.modules).toHaveLength(1)
  })

  it('createWorkletDucker loads then constructs the host with its options', async () => {
    const ctx = createMockContext()
    const ducker = await createWorkletDucker(asAudioContext(ctx), {
      depth: 0.4,
      processorUrl: '/assets/ducker.js',
      createNode: nodeFactory(ctx),
    })
    expect(ducker).toBeInstanceOf(WorkletDucker)
    expect(ctx.audioWorklet.modules).toEqual(['/assets/ducker.js'])
    expect(ctx.workletNodes[0].name).toBe(DUCKER_PROCESSOR_NAME)
    expect(ducker.depth).toBe(0.4)
  })

  it('the registry device takes its own parameters from `params`, and no option of the host by a name in it', async () => {
    const ctx = createMockContext()
    const registry = new DeviceRegistry([WORKLET_DUCKER_DESCRIPTOR])
    // A saved device's values may carry any name. These four are options of the host, not parameters.
    const device = await registry.create('ducker', asAudioContext(ctx), {
      params: { depth: 0.4, windowSize: 4, reportHz: 0, createNode: 1, processorUrl: 2 },
      processorUrl: '/assets/ducker.js',
      createNode: nodeFactory(ctx),
    })
    expect(device.getParam('depth')).toBe(0.4)
    expect(ctx.audioWorklet.modules).toEqual(['/assets/ducker.js'])
    const options = ctx.workletNodes[0].options as AudioWorkletNodeOptions
    const processorOptions = options.processorOptions as DuckerProcessorOptions
    expect(processorOptions.windowSize).toBeUndefined()
    expect(processorOptions.reportHz).toBeUndefined()
    expect(Object.keys((device as WorkletDucker).meters)).toEqual(['gain', 'envelope'])
  })
})
