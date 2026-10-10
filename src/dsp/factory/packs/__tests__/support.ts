// What a pack is held to, for its own test file (one per pack, so they run
// side by side) and for the bench (../../__tests__/report.test.ts). The
// limits are the band the bank itself sits in, tighter than the bank's own
// test: a pack is a hundred presets heard one after another, and none should
// jump out of the list.

import { describe, expect, it } from 'vitest'

import {
  patchDeviceParams,
  patchDevices,
  validatePatch,
  type Patch,
} from '../../../../core/devices/patch'
import { DeviceRegistry } from '../../../../core/devices/registry'
import {
  compileFromDisk,
  measureAudio,
  type AudioMeasurement,
} from '../../../__tests__/render-support'
import { canRenderPatch, renderPatch } from '../../../patch-render'
import { STOCK_WASM_DEVICES } from '../../../registry'
import { PREVIEW_SECONDS, previewPhrase } from '../../phrases'
import { type FactoryPreset, type FactoryPresetCategory } from '../../types'
import { FACTORY_PACK_SIZE, factoryPack } from '../index'

export const PACK_LIMITS = {
  /** Sample peak of the raw preview at most, dBFS. */
  peakDb: -8,
  /** The loudest 400 ms of the raw preview, dBFS: at least and at most. */
  loudestDb: [-30, -22],
  /** Mean of the left channel at most. */
  dc: 0.01,
  /** Characters of a description at most: it is one line at the foot of a list. */
  description: 140,
  /** Presets every instrument has at least. */
  perInstrument: 2,
} as const

/**
 * Instruments that came after the packs shipped. A pack is exactly a hundred
 * presets and a shipped preset stays what it is, so a pack cannot take two
 * more for a new instrument without dropping two it shipped with. Such an
 * instrument has its presets in the bank; a pack made from now on is free to
 * use it, and none is held to.
 */
export const AFTER_THE_PACKS: readonly string[] = [
  'zone-sampler',
  'drum-kit',
  'glitch-kit',
  'flock',
  'magnet-piano',
  'overtone',
  'staircase',
  'shortwave',
  'ice',
  'rewind',
  'droplets',
]

export const PACK_INSTRUMENTS: readonly string[] = STOCK_WASM_DEVICES.filter(
  (device) => device.category === 'instrument' && !AFTER_THE_PACKS.includes(device.id),
).map((device) => device.id)

const CATEGORIES: readonly FactoryPresetCategory[] = [
  'pad',
  'keys',
  'bell',
  'string',
  'plucked',
  'wind',
  'voice',
  'organ',
  'drone',
  'texture',
]
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const registry = new DeviceRegistry(STOCK_WASM_DEVICES)

/** A preset's preview as it leaves the patch, not normalised: what someone gets who loads it and plays. */
export function renderPackPreset(preset: FactoryPreset) {
  return renderPatch(preset, {
    phrase: previewPhrase(preset),
    durationSec: PREVIEW_SECONDS,
    compile: compileFromDisk,
    sliceMs: 0,
  })
}

/** Where a measured preview leaves the limits; empty when it is inside them. */
export function levelProblems(measured: AudioMeasurement): string[] {
  const [quietest, loudest] = PACK_LIMITS.loudestDb
  const problems: string[] = []
  if (measured.peakDb > PACK_LIMITS.peakDb) problems.push('PEAK')
  if (measured.loudestDb > loudest) problems.push('LOUD')
  if (measured.loudestDb < quietest) problems.push('QUIET')
  if (Math.abs(measured.dc) >= PACK_LIMITS.dc) problems.push('DC')
  return problems
}

/**
 * How a patch sets its devices, written out in full: two patches with the
 * same text are the same sound under two names, however each was spelled.
 */
export function patchSettings(patch: Patch): string {
  return JSON.stringify(
    patchDevices(patch).map((device) => {
      const descriptor = registry.get(device.deviceId)
      const params = descriptor ? patchDeviceParams(descriptor, device) : (device.params ?? {})
      const sorted = Object.keys(params)
        .sort()
        .map((name) => [name, Number(params[name].toPrecision(6))])
      return [device.deviceId, device.bypass === true, sorted]
    }),
  )
}

/** The ids of patches that set their devices exactly as one before them does. */
export function repeatedSettings(patches: readonly Patch[]): string[] {
  const seen = new Map<string, string>()
  const repeats: string[] = []
  for (const patch of patches) {
    const settings = patchSettings(patch)
    const first = seen.get(settings)
    if (first === undefined) seen.set(settings, patch.id)
    else repeats.push(`${patch.id} = ${first}`)
  }
  return repeats
}

/**
 * The tests of one pack: called from `<pack id>.pack.test.ts` with the
 * presets as its own module lists them, so a pack is tested without the
 * others being read.
 */
export function describePack(packId: string, presets: readonly FactoryPreset[]): void {
  describe(`pack ${packId}`, () => {
    it('is a whole pack with every instrument in it', () => {
      const pack = factoryPack(packId)
      expect(pack, `pack ${packId} is listed in FACTORY_PACKS`).toBeDefined()
      expect(presets).toHaveLength(FACTORY_PACK_SIZE)
      expect(pack?.count).toBe(presets.length)
      for (const id of PACK_INSTRUMENTS) {
        const count = presets.filter((preset) => preset.instrument.deviceId === id).length
        expect(count, `presets for ${id}`).toBeGreaterThanOrEqual(PACK_LIMITS.perInstrument)
      }
    })

    it('names each preset once and sets no two alike', () => {
      expect(new Set(presets.map((preset) => preset.id)).size).toBe(presets.length)
      expect(new Set(presets.map((preset) => preset.name)).size).toBe(presets.length)
      expect(repeatedSettings(presets), 'presets set exactly like another').toEqual([])
    })

    it.each(presets.map((preset) => [preset.id, preset] as const))(
      '%s is listed properly and plays at the level of the rest',
      async (_id, preset) => {
        expect(preset.id).toMatch(KEBAB)
        expect(preset.id.startsWith(`${packId}-`), 'an id starts with its pack').toBe(true)
        expect(preset.name.length).toBeGreaterThan(2)
        expect(preset.name.length, 'a name has to fit a browser row').toBeLessThanOrEqual(24)
        expect(preset.name, 'a name is words, not a number in a series').not.toMatch(/\d$/)
        expect(preset.description).toMatch(/^[A-Z].{24,}\.$/)
        expect(preset.description.length).toBeLessThanOrEqual(PACK_LIMITS.description)
        expect(CATEGORIES).toContain(preset.category)
        expect(validatePatch(preset, registry)).toEqual([])
        expect(canRenderPatch(preset), 'all WASM devices').toBe(true)
        expect(preset.effects.length, 'a preset is more than its instrument').toBeGreaterThan(0)
        expect(preset.effects.length).toBeLessThanOrEqual(4)

        const measured = measureAudio(await renderPackPreset(preset))
        expect(levelProblems(measured), JSON.stringify(measured)).toEqual([])
      },
      // A render is a third of a second on a quiet machine; a runner that renders several packs at once is not one.
      30_000,
    )
  })
}
