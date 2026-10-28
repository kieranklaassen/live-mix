import { describe, expect, it } from 'vitest'

import { DeviceRegistry } from '../../core/devices'
import {
  CLEANUP_KINDS,
  cleanupLatencySamples,
  cleanupProcessorName,
  type CleanupProcessorOptions,
} from '../../core/devices/native/cleanup/abi'
import { WorkletCleanup } from '../../core/devices/native/cleanup/WorkletCleanup'
import { asAudioContext, createMockContext, type MockAudioContext } from '../../testing'
import { cleanupProcessorUrl, createWorkletCleanup, loadCleanupProcessor } from '../devices/cleanup'
import { CLEANUP_DESCRIPTORS, DENOISE_DESCRIPTOR, STOCK_WASM_DEVICES } from '../registry'
import { type WorkletNodeFactory } from '../WasmDevice'

function nodeFactory(ctx: MockAudioContext): WorkletNodeFactory {
  return (_context, name, options) =>
    ctx.createWorkletNode(name, options) as unknown as AudioWorkletNode
}

describe('voice cleanup dsp entry', () => {
  it('resolves the one bundled processor file next to the dsp entry', () => {
    expect(cleanupProcessorUrl()).toMatch(/worklets\/cleanup\.js$/)
  })

  it('loads the processors once per context, whichever kinds are made', async () => {
    const ctx = createMockContext()
    const context = asAudioContext(ctx)
    await Promise.all([loadCleanupProcessor(context), loadCleanupProcessor(context)])
    expect(ctx.audioWorklet.modules).toEqual([expect.stringMatching(/worklets\/cleanup\.js$/)])
  })

  it('createWorkletCleanup loads then constructs the host of a kind, with its latency at the context’s rate', async () => {
    const ctx = createMockContext({ sampleRate: 48_000 })
    const device = await createWorkletCleanup(asAudioContext(ctx), 'de-noise', {
      params: { reduction: 20 },
      processorUrl: '/assets/cleanup.js',
      createNode: nodeFactory(ctx),
    })
    expect(device).toBeInstanceOf(WorkletCleanup)
    expect(device.id).toBe('de-noise')
    expect(ctx.audioWorklet.modules).toEqual(['/assets/cleanup.js'])
    expect(ctx.workletNodes[0].name).toBe(cleanupProcessorName('de-noise'))
    expect(device.getParam('reduction')).toBe(20)
    expect(device.latencySamples).toBe(1024)
    expect(device.latencySec).toBeCloseTo(1024 / 48_000, 12)
    const options = (ctx.workletNodes[0].options as AudioWorkletNodeOptions)
      .processorOptions as CleanupProcessorOptions
    expect(options.kind).toBe('de-noise')
    expect(options.params).toContainEqual([0, 20])
  })

  it('the registry device takes its own parameters from `params`, and no option of the host by a name in it', async () => {
    const ctx = createMockContext()
    const registry = new DeviceRegistry([DENOISE_DESCRIPTOR])
    const device = await registry.create('de-noise', asAudioContext(ctx), {
      preset: 'Voice, firm',
      params: { adaptSec: 4, reportHz: 0, createNode: 1 },
      processorUrl: '/assets/cleanup.js',
      createNode: nodeFactory(ctx),
    })
    expect(device.getParam('adaptSec')).toBe(4)
    expect(device.getParam('reduction')).toBe(20)
    const options = (ctx.workletNodes[0].options as AudioWorkletNodeOptions)
      .processorOptions as CleanupProcessorOptions
    expect(options.reportHz).toBeUndefined()
    expect(Object.keys((device as WorkletCleanup).meters)).toEqual(['reduction'])
  })

  it('sends a parameter and a bypass to the processor, and reads its meter', async () => {
    const ctx = createMockContext()
    const device = await createWorkletCleanup(asAudioContext(ctx), 'de-ess', {
      processorUrl: '/assets/cleanup.js',
      createNode: nodeFactory(ctx),
    })
    const node = ctx.workletNodes[0]
    device.setParam('frequency', 99_999)
    device.bypass = true
    expect(node.port.posted.calls.map(([message]) => message)).toEqual([
      { type: 'set-param', paramId: 1, value: 12_000 },
      { type: 'bypass', enabled: true },
    ])
    node.port.receive({ type: 'meter', reduction: 4.5 })
    expect(device.meter('reduction')).toBe(4.5)
    expect(() => device.setParam('nothing', 1)).toThrow(/de-ess has no parameter "nothing"/)
  })

  it('are six stock devices in the repair group, in the order a chain runs them', () => {
    expect(CLEANUP_DESCRIPTORS.map((descriptor) => descriptor.id)).toEqual([...CLEANUP_KINDS])
    for (const descriptor of CLEANUP_DESCRIPTORS) {
      expect(STOCK_WASM_DEVICES).toContain(descriptor)
      expect(descriptor.category).toBe('repair')
      expect(descriptor.kind).toBe('worklet')
    }
  })

  it('says how long each kind holds its sound at the usual rates', () => {
    expect(CLEANUP_KINDS.map((kind) => cleanupLatencySamples(kind, 48_000))).toEqual([
      0, 313, 0, 1024, 1024, 0,
    ])
    expect(cleanupLatencySamples('de-noise', 44_100)).toBe(1024)
    expect(cleanupLatencySamples('de-reverb', 96_000)).toBe(2048)
  })
})
