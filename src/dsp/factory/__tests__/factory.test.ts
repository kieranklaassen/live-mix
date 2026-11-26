// The factory bank held to what can be measured: every patch names real
// devices, presets and in-range values; every preset preview and every sound
// renders on the committed device modules at a sane level; a looping sound
// loops without a step; and a sound is the kind the bank says it is, by the
// library's own analysis (the icon a host shows next to it).
//
// The presets, the chains and the sounds are rendered in the files beside this
// one (factory.presets-1.test.ts and on), a share each.
//
// Whether a preset is beautiful is not something a test can say.

import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { toDb } from '../../__tests__/render-support'
import { isWasmDescriptor } from '../../descriptor'
import { peakOf } from '../../patch-render'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  FACTORY_CHAINS,
  FACTORY_CHAIN_CATEGORIES,
  FACTORY_PEAK_DB,
  FACTORY_PRESETS,
  FACTORY_PRESET_CATEGORIES,
  FACTORY_SOUNDS,
  PREVIEW_SECONDS,
  renderPresetPreview,
} from '..'
import { repeatedSettings } from '../packs/__tests__/support'
import { CHAIN_SHARES, INSTRUMENTS, PRESET_SHARES, SOUND_SHARES, node } from './factory-rendered'
import { BANK_LIMITS } from './support'

// The ducker needs a key signal and runs in its own worklet: not a patch device.
const EFFECTS = STOCK_WASM_DEVICES.filter(
  (d) => d.category !== 'instrument' && isWasmDescriptor(d),
).map((d) => d.id)

describe('factory bank', () => {
  it('has unique ids, names and catalogue numbers', () => {
    const patches = [...FACTORY_PRESETS, ...FACTORY_CHAINS]
    expect(new Set(patches.map((p) => p.id)).size).toBe(patches.length)
    expect(new Set(FACTORY_PRESETS.map((p) => p.name)).size).toBe(FACTORY_PRESETS.length)
    expect(new Set(FACTORY_CHAINS.map((p) => p.name)).size).toBe(FACTORY_CHAINS.length)
    expect(new Set(FACTORY_SOUNDS.map((s) => s.id)).size).toBe(FACTORY_SOUNDS.length)
    expect(new Set(FACTORY_SOUNDS.map((s) => s.name)).size).toBe(FACTORY_SOUNDS.length)
    expect(new Set(FACTORY_SOUNDS.map((s) => s.number)).size).toBe(FACTORY_SOUNDS.length)
    for (const sound of FACTORY_SOUNDS) {
      expect(Number.isInteger(sound.number) && sound.number > 0, sound.id).toBe(true)
    }
  })

  it('sets no two presets and no two chains alike', () => {
    expect(repeatedSettings(FACTORY_PRESETS), 'presets set exactly like another').toEqual([])
    expect(repeatedSettings(FACTORY_CHAINS), 'chains set exactly like another').toEqual([])
  })

  it('covers every instrument, every category and most of the effects', () => {
    for (const id of INSTRUMENTS) {
      const count = FACTORY_PRESETS.filter((preset) => preset.instrument.deviceId === id).length
      expect(count, `presets for ${id}`).toBeGreaterThanOrEqual(BANK_LIMITS.perInstrument)
    }
    for (const { id } of FACTORY_PRESET_CATEGORIES) {
      const count = FACTORY_PRESETS.filter((preset) => preset.category === id).length
      expect(count, `presets under ${id}`).toBeGreaterThanOrEqual(2)
    }
    for (const { id } of FACTORY_CHAIN_CATEGORIES) {
      const count = FACTORY_CHAINS.filter((chain) => chain.category === id).length
      expect(count, `chains under ${id}`).toBeGreaterThanOrEqual(BANK_LIMITS.perChainGroup)
    }
    const categories = new Set<string>(FACTORY_PRESET_CATEGORIES.map((category) => category.id))
    for (const preset of FACTORY_PRESETS)
      expect(categories.has(preset.category), preset.id).toBe(true)
    const chainCategories = new Set<string>(FACTORY_CHAIN_CATEGORIES.map((category) => category.id))
    for (const chain of FACTORY_CHAINS)
      expect(chainCategories.has(chain.category), chain.id).toBe(true)

    const used = new Set(
      [...FACTORY_PRESETS, ...FACTORY_CHAINS].flatMap((patch) =>
        patch.effects.map((d) => d.deviceId),
      ),
    )
    const unused = EFFECTS.filter((id) => !used.has(id))
    expect(unused, 'effects no preset or chain uses').toEqual([])
  })
})

describe('the rendered presets', () => {
  it('are in one share or another, whatever their instrument', () => {
    const shared = new Set(INSTRUMENTS)
    for (const preset of FACTORY_PRESETS) {
      expect(shared.has(preset.instrument.deviceId), preset.id).toBe(true)
    }
  })

  it('have a file for every share', () => {
    const files = readdirSync(dirname(fileURLToPath(import.meta.url)))
    for (const [kind, shares] of [
      ['presets', PRESET_SHARES],
      ['chains', CHAIN_SHARES],
      ['sounds', SOUND_SHARES],
    ] as const) {
      const found = files.filter((name) => name.startsWith(`factory.${kind}-`)).sort()
      expect(found).toEqual(
        Array.from({ length: shares }, (_, n) => `factory.${kind}-${n + 1}.test.ts`),
      )
    }
  })
})

describe('preset previews', () => {
  it('come out at the bank level and end in silence', async () => {
    const [first] = FACTORY_PRESETS
    const audio = await renderPresetPreview(first, node)
    expect(audio.channels[0]).toHaveLength(PREVIEW_SECONDS * audio.sampleRate)
    expect(toDb(peakOf(audio.channels))).toBeCloseTo(FACTORY_PEAK_DB, 1)
    expect(Math.abs(audio.channels[0].at(-1) ?? 1)).toBe(0)
  })
})
