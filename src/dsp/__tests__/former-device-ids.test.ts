// Three stock devices were renamed (`dattorro`, `zita-rev1`, `limiter-1176`),
// and every score, patch and preset saved before that names them by the old
// id. A saved piece must load the same device with the same settings, so the
// old ids stay findable for good (`formerIds`); these tests hold that, and
// that nothing the library ships names a device by an id it no longer has.

import { describe, expect, it } from 'vitest'
import {
  DeviceRegistry,
  NODE_DEVICES,
  presetParams,
  resolvePreset,
  validatePatch,
  type Patch,
} from '../../core/devices'
import {
  createScore,
  defaultStrip,
  masterDestination,
  parseScore,
  serializeScore,
  validateScore,
  type Score,
} from '../../score'
import { FACTORY_CHAINS, FACTORY_PRESETS, FACTORY_SOUNDS, loadFactoryPacks } from '../factory'
import { canRenderPatch, renderPatch } from '../patch-render'
import {
  FET_LIMITER_DESCRIPTOR,
  HALL_REVERB_DESCRIPTOR,
  PLATE_REVERB_DESCRIPTOR,
  STOCK_WASM_DEVICES,
  describeStockWasmDevice,
  registerStockWasmDevices,
} from '../registry'
import { compileFromDisk } from './render-support'

const RENAMED = [
  ['dattorro', PLATE_REVERB_DESCRIPTOR],
  ['zita-rev1', HALL_REVERB_DESCRIPTOR],
  ['limiter-1176', FET_LIMITER_DESCRIPTOR],
] as const

const registry = registerStockWasmDevices(new DeviceRegistry(NODE_DEVICES))

/** A piece as it was saved before the rename: old ids, presets by name, a knob or two moved. */
function savedBefore(): Score {
  const score = createScore({ id: 'saved', name: 'Saved before the rename' })
  score.master.inserts = [
    { id: 'limiter-1176-1', deviceId: 'limiter-1176', preset: 'Drive', params: {}, bypass: false },
  ]
  score.tracks = [
    {
      kind: 'audio',
      id: 'pad',
      name: 'pad',
      destination: masterDestination(),
      strip: {
        ...defaultStrip(),
        inserts: [
          // The plate's preset under the name it had before it was renamed too.
          {
            id: 'dattorro-1',
            deviceId: 'dattorro',
            preset: 'ambient-live',
            params: { mix: 0.2 },
            bypass: false,
          },
          { id: 'zita-rev1-1', deviceId: 'zita-rev1', preset: 'Hall', params: {}, bypass: true },
        ],
      },
      clips: [],
    },
  ]
  return score
}

describe('a stock device that was renamed', () => {
  it('is found under the id it shipped with, and listed once under the id of today', () => {
    expect(registry.ids().filter((id) => RENAMED.some(([former]) => former === id))).toEqual([])
    for (const [former, descriptor] of RENAMED) {
      expect(descriptor.formerIds).toEqual([former])
      expect(registry.get(former)).toBe(descriptor)
      expect(registry.resolveId(former)).toBe(descriptor.id)
      expect(registry.presets(former)).toEqual(registry.presets(descriptor.id))
      expect(describeStockWasmDevice(former)).toBe(descriptor)
      expect(describeStockWasmDevice(descriptor.id)).toBe(descriptor)
    }
    // No two devices claim one former id, and none claims an id in use.
    const former = STOCK_WASM_DEVICES.flatMap((descriptor) => descriptor.formerIds ?? [])
    expect(new Set(former).size).toBe(former.length)
    expect(
      former.filter((id) => STOCK_WASM_DEVICES.some((descriptor) => descriptor.id === id)),
    ).toEqual([])
  })

  it('loads the same settings from a piece saved under the old id', () => {
    const saved = savedBefore()
    expect(validateScore(saved, { devices: registry })).toEqual([])
    const parsed = parseScore(serializeScore(saved), { devices: registry })
    expect(parsed.master.inserts[0]).toEqual({
      id: 'limiter-1176-1',
      deviceId: 'fet-limiter',
      preset: 'Drive',
      params: {},
      bypass: false,
    })
    expect(parsed.tracks[0].strip.inserts).toEqual([
      {
        id: 'dattorro-1',
        deviceId: 'plate-reverb',
        preset: 'ambient-live',
        params: { mix: 0.2 },
        bypass: false,
      },
      { id: 'zita-rev1-1', deviceId: 'hall-reverb', preset: 'Hall', params: {}, bypass: true },
    ])
    // What each loads is what its preset of today loads, by either id.
    expect(
      presetParams(
        registry.describe('dattorro'),
        resolvePreset(registry.describe('dattorro'), 'ambient-live'),
      ),
    ).toEqual(
      presetParams(PLATE_REVERB_DESCRIPTOR, resolvePreset(PLATE_REVERB_DESCRIPTOR, 'Medium plate')),
    )
    // Without the registry a score is only read, not moved on.
    expect(parseScore(serializeScore(saved)).master.inserts[0].deviceId).toBe('limiter-1176')
  })

  it('makes the same sound from a patch saved under the old id', async () => {
    const effects = [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ]
    const old: Patch = {
      id: 'saved',
      name: 'Saved',
      category: 'made',
      description: '',
      instrument: { deviceId: 'ember' },
      effects: effects.map((effect, index) => ({ ...effect, deviceId: RENAMED[index][0] })),
    }
    const today: Patch = { ...old, effects }
    expect(validatePatch(old, registry)).toEqual([])
    expect(canRenderPatch(old)).toBe(true)
    const phrase = { notes: [{ note: 57, atSec: 0, durSec: 0.5 }] }
    const [was, is] = await Promise.all(
      [old, today].map((patch) =>
        renderPatch(patch, { durationSec: 1.5, phrase, compile: compileFromDisk, sliceMs: 0 }),
      ),
    )
    expect(was.channels[0].some((sample) => sample !== 0)).toBe(true)
    expect(was.channels).toEqual(is.channels)
  })
})

describe('what the library ships', () => {
  it('names every device by its id of today', async () => {
    const patches: Patch[] = [
      ...FACTORY_PRESETS,
      ...FACTORY_CHAINS,
      ...FACTORY_SOUNDS.flatMap((sound) => (typeof sound.patch === 'string' ? [] : [sound.patch])),
      ...(await loadFactoryPacks()),
    ]
    const ids = new Set(
      patches
        .flatMap((patch) => [patch.instrument, ...patch.effects])
        .flatMap((device) => (device ? [device.deviceId] : [])),
    )
    expect(patches.length).toBeGreaterThan(1000)
    expect([...ids].filter((id) => registry.resolveId(id) !== id)).toEqual([])
    expect([...ids].filter((id) => !registry.has(id))).toEqual([])
  })
})
