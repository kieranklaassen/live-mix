import { describe, expect, it } from 'vitest'

import { isNoteDevice } from '../../core/devices/Device'
import { DEVICE_CATEGORIES, DeviceRegistry } from '../../core/devices/registry'
import { groupDevices, isInsertDevice } from '../../react/components/DeviceChainView'
import { NativeHostClient } from '../HostClient'
import { asAudioContext, createMockContext } from '../../testing'
import { isMissingNativeDescriptor, isMissingNativeDevice } from '../missing'
import {
  isNativeDeviceDescriptor,
  nativeDeviceDescription,
  nativeDeviceDescriptor,
  registerNativeDevices,
  scanNativeDevices,
} from '../registry'
import {
  FAKE_HOST_ADDRESS,
  FAKE_REVERB,
  FAKE_SYNTH,
  FakePluginHost,
} from '../../testing/fake-plugin-host'

async function connect() {
  const host = new FakePluginHost()
  const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
    createSocket: host.createSocket,
  })
  return { host, client }
}

describe('hosted plug-ins in the registry', () => {
  it('describes a plug-in without loading it: native kind, no parameter table yet', async () => {
    const { client, host } = await connect()
    const descriptor = nativeDeviceDescriptor(client, FAKE_REVERB)
    expect(descriptor).toMatchObject({
      id: 'native:VST3-Fake Verb-1a2b-3c4d',
      name: 'Fake Verb',
      kind: 'native',
      category: 'plugin',
      version: 1,
      params: {},
      dynamicParams: true,
      plugin: FAKE_REVERB,
    })
    expect(descriptor.description).toBe('VST3 plug-in by Fakes (Fx, Reverb).')
    expect(nativeDeviceDescription({ ...FAKE_REVERB, vendor: '', category: '' })).toBe(
      'VST3 plug-in.',
    )
    expect(isNativeDeviceDescriptor(descriptor)).toBe(true)
    expect(host.calls('load')).toHaveLength(0)
  })

  it('a registry takes a descriptor with an empty table only when it is dynamic', async () => {
    const { client } = await connect()
    const registry = new DeviceRegistry()
    const descriptor = nativeDeviceDescriptor(client, FAKE_REVERB)
    expect(() => registry.register(descriptor)).not.toThrow()
    expect(() => registry.register({ ...descriptor, id: 'x', dynamicParams: undefined })).toThrow(
      'has no parameters',
    )
  })

  it('effects list under Plug-ins in an insert picker; instruments stay with the instruments', async () => {
    const { client } = await connect()
    const registry = new DeviceRegistry()
    registerNativeDevices(client, [FAKE_REVERB, FAKE_SYNTH], { registry })
    expect(DEVICE_CATEGORIES.map((category) => category.id)).toContain('plugin')
    const inserts = groupDevices(registry.list().filter(isInsertDevice))
    expect(inserts).toEqual([
      { label: 'Plug-ins', devices: [registry.describe('native:' + FAKE_REVERB.id)] },
    ])
    expect(registry.list({ category: 'instrument' }).map((entry) => entry.name)).toEqual([
      'Fake Synth',
    ])
  })

  it('registering a new list replaces what is there; a plug-in that is gone stays as unavailable', async () => {
    const { client } = await connect()
    const registry = new DeviceRegistry()
    registerNativeDevices(client, [FAKE_REVERB, FAKE_SYNTH], { registry })
    const second = registerNativeDevices(client, [FAKE_SYNTH], { registry })
    expect(second).toHaveLength(1)

    // A document may still use the reverb: it keeps rendering, as a stand-in.
    const gone = registry.describe('native:' + FAKE_REVERB.id)
    expect(gone.name).toBe('Fake Verb (not available)')
    expect(isMissingNativeDescriptor(gone)).toBe(true)
    expect(isNativeDeviceDescriptor(gone)).toBe(false)
    // Nothing offers it any more.
    expect(registry.list().filter(isInsertDevice)).toEqual([])

    // And it comes back when the plug-in does.
    registerNativeDevices(client, [FAKE_REVERB, FAKE_SYNTH], { registry })
    expect(isNativeDeviceDescriptor(registry.describe('native:' + FAKE_REVERB.id))).toBe(true)
    expect(registry.list({ kind: 'native' })).toHaveLength(2)
  })

  it('scanNativeDevices scans with the host and registers what it finds', async () => {
    const { client, host } = await connect()
    const registry = new DeviceRegistry()
    const result = await scanNativeDevices(client, { paths: ['/more'], registry })
    expect(host.calls('scan')[0].params).toEqual({ paths: ['/more'] })
    expect(result.failed).toEqual(['/plugins/Broken.vst3'])
    expect(result.descriptors.map((descriptor) => descriptor.name)).toEqual([
      'Fake Verb',
      'Fake Synth',
    ])
    expect(registry.ids()).toEqual(result.descriptors.map((descriptor) => descriptor.id))
  })
})

describe('a hosted plug-in that does not load', () => {
  // The host has never heard of these: `load` fails as it does for a file
  // that was removed after the scan.
  const GONE_EFFECT = { ...FAKE_REVERB, id: 'VST3-Gone Verb-9f-8e', name: 'Gone Verb' }
  const GONE_SYNTH = { ...FAKE_SYNTH, id: 'VST3-Gone Synth-7d-6c', name: 'Gone Synth' }

  it('an effect comes back as a stand-in that says why and keeps its settings', async () => {
    const { client } = await connect()
    const ctx = createMockContext({ sampleRate: 48000 })
    const failures: string[] = []
    const registry = new DeviceRegistry()
    registerNativeDevices(client, [GONE_EFFECT], {
      registry,
      defaults: {
        onLoadError: (plugin, error) => failures.push(`${plugin.name}: ${error.message}`),
      },
    })
    const device = await registry.create(`native:${GONE_EFFECT.id}`, asAudioContext(ctx), {
      params: { p7: 0.3 },
    })
    expect(isMissingNativeDevice(device)).toBe(true)
    expect(device.input).toBe(device.output)
    expect(device.getParam('p7')).toBe(0.3)
    expect(device.notice).toBe(
      'Gone Verb did not load: unknown plug-in "VST3-Gone Verb-9f-8e"; scan first or load by file. ' +
        'Its sound passes through unchanged and its settings are kept.',
    )
    expect(failures).toEqual([
      'Gone Verb: live-mix: unknown plug-in "VST3-Gone Verb-9f-8e"; scan first or load by file',
    ])
    // The descriptor is still the plug-in's: the next try may load it.
    expect(registry.describe(`native:${GONE_EFFECT.id}`).unavailable).toBeUndefined()
  })

  it('an instrument that does not load comes back as a stand-in that takes notes and plays nothing', async () => {
    const { client } = await connect()
    const ctx = createMockContext({ sampleRate: 48000 })
    const failures: string[] = []
    const registry = new DeviceRegistry()
    registerNativeDevices(client, [GONE_SYNTH], {
      registry,
      defaults: { onLoadError: (plugin) => failures.push(plugin.name) },
    })
    const device = await registry.create(`native:${GONE_SYNTH.id}`, asAudioContext(ctx), {
      params: { p1: 0.6 },
    })
    expect(isMissingNativeDevice(device)).toBe(true)
    // An instrument track takes it: the arrangement renders, this one track is silent.
    expect(isNoteDevice(device)).toBe(true)
    if (!isNoteDevice(device)) return
    device.noteOn(1, 440, 1)
    device.noteOff(1)
    expect(device.getParam('p1')).toBe(0.6)
    expect((device as { notice?: string }).notice).toMatch(
      /did not load: unknown plug-in .* It plays nothing and its settings are kept\.$/,
    )
    expect(failures).toEqual([GONE_SYNTH.name])
  })
})
