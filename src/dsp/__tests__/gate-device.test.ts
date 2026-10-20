import { describe, expect, it } from 'vitest'

import { DeviceRegistry } from '../../core/devices'
import { GATE_PROCESSOR_NAME, type GateProcessorOptions } from '../../core/devices/native/gate-abi'
import { WorkletGate } from '../../core/devices/native/WorkletGate'
import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { createWorkletGate, gateProcessorUrl, loadGateProcessor } from '../devices/gate'
import { WORKLET_GATE_DESCRIPTOR, STOCK_WASM_DEVICES } from '../registry'
import { type WorkletNodeFactory } from '../WasmDevice'

function nodeFactory(ctx: MockAudioContext): WorkletNodeFactory {
  return (_context, name, options) =>
    ctx.createWorkletNode(name, options) as unknown as AudioWorkletNode
}

describe('gate dsp entry', () => {
  it('resolves the bundled processor next to the dsp entry', () => {
    expect(gateProcessorUrl()).toMatch(/worklets\/gate\.js$/)
  })

  it('loads the processor once per context', async () => {
    const ctx = createMockContext()
    const context = asAudioContext(ctx)
    await Promise.all([loadGateProcessor(context), loadGateProcessor(context)])
    expect(ctx.audioWorklet.modules).toEqual([expect.stringMatching(/worklets\/gate\.js$/)])
  })

  it('createWorkletGate loads then constructs the host with its options', async () => {
    const ctx = createMockContext()
    const gate = await createWorkletGate(asAudioContext(ctx), {
      threshold: -40,
      processorUrl: '/assets/gate.js',
      createNode: nodeFactory(ctx),
    })
    expect(gate).toBeInstanceOf(WorkletGate)
    expect(ctx.audioWorklet.modules).toEqual(['/assets/gate.js'])
    expect(ctx.workletNodes[0].name).toBe(GATE_PROCESSOR_NAME)
    expect(gate.getParam('threshold')).toBe(-40)
    expect(gate.latencySamples).toBe(0)
  })

  it('the registry device takes its own parameters from `params`, and no option of the host by a name in it', async () => {
    const ctx = createMockContext()
    const registry = new DeviceRegistry([WORKLET_GATE_DESCRIPTOR])
    const device = await registry.create('gate', asAudioContext(ctx), {
      preset: 'Voice, firm',
      params: { range: -30, reportHz: 0, createNode: 1 },
      processorUrl: '/assets/gate.js',
      createNode: nodeFactory(ctx),
    })
    expect(device.getParam('range')).toBe(-30)
    expect(device.getParam('threshold')).toBe(-45)
    const options = ctx.workletNodes[0].options as AudioWorkletNodeOptions
    const processorOptions = options.processorOptions as GateProcessorOptions
    expect(processorOptions.reportHz).toBeUndefined()
    expect(Object.keys((device as WorkletGate).meters)).toEqual(['gain', 'level'])
  })

  it('is a stock device, in the dynamics group', () => {
    expect(STOCK_WASM_DEVICES).toContain(WORKLET_GATE_DESCRIPTOR)
    expect(WORKLET_GATE_DESCRIPTOR.category).toBe('dynamics')
  })
})
