import { describe, expect, it } from 'vitest'

import { DeviceRegistry } from '../../core/devices/registry'
import { asAudioContext, createMockContext } from '../../testing'
import { describeWamDevice, registerWamDevice, wamDeviceDescriptor } from '../registry'
import { WamDevice } from '../WamDevice'
import {
  FAKE_EFFECT_CONFIG,
  FAKE_SYNTH_CONFIG,
  defineFakeWam,
  fakeHostInitializer,
  fakeImporter,
} from './fake-wam'

const URL = 'https://plugins.example/effect/index.js'

describe('describeWamDevice', () => {
  it('probes the plugin once, disposes it, and returns a wam descriptor with its table', async () => {
    const Effect = defineFakeWam(FAKE_EFFECT_CONFIG)
    const ctx = createMockContext()
    const host = fakeHostInitializer()
    const descriptor = await describeWamDevice(asAudioContext(ctx), URL, {
      importModule: fakeImporter({ [URL]: Effect }),
      host: { initialize: host.initialize },
      presets: { Warm: { mode: 1, cutoff: 4000 } },
    })
    expect(Effect.instances).toHaveLength(1)
    expect(Effect.instances[0].node.destroyed).toBe(true)
    expect(descriptor).toMatchObject({
      id: 'wam:com.live-mix.fake-effect',
      name: 'Fake Effect',
      kind: 'wam',
      category: 'other',
      version: 1,
      url: URL,
      presets: { Warm: { mode: 1, cutoff: 4000 } },
    })
    expect(descriptor.wam?.identifier).toBe('com.live-mix.fake-effect')
    expect(Object.keys(descriptor.params)).toEqual(['gain', 'cutoff', 'stages', 'enabled', 'mode'])

    const registry = new DeviceRegistry([descriptor])
    expect(registry.list({ kind: 'wam' }).map((d) => d.id)).toEqual([descriptor.id])
    const device = await registry.create(descriptor.id, asAudioContext(ctx), {
      preset: 'Warm',
      params: { gain: -3 },
    })
    expect(Effect.instances).toHaveLength(2)
    expect(host.calls.count).toBe(1)
    expect(device).toBeInstanceOf(WamDevice)
    expect(device.id).toBe(descriptor.id)
    expect(device.params).toEqual(descriptor.params)
    expect(device.getParam('mode')).toBe(1)
    expect(device.getParam('cutoff')).toBe(4000)
    expect(device.getParam('gain')).toBe(-3)
    expect(device.getParam('stages')).toBe(2)
    device.dispose()
  })

  it('takes id, name and category from meta, and instrument from the plugin', async () => {
    const Synth = defineFakeWam(FAKE_SYNTH_CONFIG)
    const ctx = createMockContext()
    const auto = await describeWamDevice(asAudioContext(ctx), Synth, {
      host: { groupId: 'g', groupKey: 'k' },
    })
    expect(auto).toMatchObject({ id: 'wam:com.live-mix.fake-synth', category: 'instrument' })
    expect(auto.url).toBeUndefined()
    const named = await describeWamDevice(asAudioContext(ctx), Synth, {
      id: 'synth',
      name: 'My Synth',
      category: 'other',
      version: 3,
      host: { groupId: 'g', groupKey: 'k' },
    })
    expect(named).toMatchObject({ id: 'synth', name: 'My Synth', category: 'other', version: 3 })
    const device = await named.create(asAudioContext(ctx), {})
    expect(device.id).toBe('synth')
    device.dispose()
  })
})

describe('wamDeviceDescriptor', () => {
  it('builds a descriptor from a persisted table without touching a context', async () => {
    const Effect = defineFakeWam(FAKE_EFFECT_CONFIG)
    const ctx = createMockContext()
    const probed = await describeWamDevice(asAudioContext(ctx), URL, {
      importModule: fakeImporter({ [URL]: Effect }),
      host: { groupId: 'g', groupKey: 'k' },
    })
    const persisted = JSON.parse(
      JSON.stringify({ id: probed.id, name: probed.name, params: probed.params, wam: probed.wam }),
    ) as Pick<typeof probed, 'id' | 'name' | 'params' | 'wam'>

    const later = defineFakeWam(FAKE_EFFECT_CONFIG)
    const restored = wamDeviceDescriptor({
      ...persisted,
      source: URL,
      importModule: fakeImporter({ [URL]: later }),
      host: { groupId: 'g2', groupKey: 'k2' },
      presets: { Loud: { gain: 12 } },
    })
    expect(restored).toMatchObject({ kind: 'wam', url: URL, category: 'other', version: 1 })
    expect(later.instances).toHaveLength(0)

    // A fresh context, as on the next session: the descriptor's host ids install there.
    const restoredCtx = createMockContext()
    const registry = new DeviceRegistry([restored])
    const device = await registry.create(restored.id, asAudioContext(restoredCtx), {
      preset: 'Loud',
    })
    expect(later.instances).toHaveLength(1)
    expect(later.instances[0].groupId).toBe('g2')
    expect(device.getParam('gain')).toBe(12)
    expect(device.params).toEqual(restored.params)
    device.dispose()
  })
})

describe('registerWamDevice', () => {
  it('describes and registers, replacing an earlier descriptor with the same id', async () => {
    const Effect = defineFakeWam(FAKE_EFFECT_CONFIG)
    const ctx = createMockContext()
    const registry = new DeviceRegistry()
    const first = await registerWamDevice(
      asAudioContext(ctx),
      Effect,
      { host: { groupId: 'g', groupKey: 'k' } },
      registry,
    )
    expect(registry.has(first.id)).toBe(true)
    const second = await registerWamDevice(
      asAudioContext(ctx),
      Effect,
      { host: { groupId: 'g', groupKey: 'k' }, name: 'Renamed' },
      registry,
    )
    expect(second.id).toBe(first.id)
    expect(registry.describe(first.id).name).toBe('Renamed')
    expect(registry.ids()).toEqual([first.id])
  })
})
