// The factory bank held to what can be measured: every patch names real
// devices, presets and in-range values; every preset preview and every sound
// renders on the committed device modules at a sane level; a looping sound
// loops without a step; and a sound is the kind the bank says it is, by the
// library's own analysis (the icon a host shows next to it).
//
// Whether a preset is beautiful is not something a test can say.

import { describe, expect, it } from 'vitest'

import { analyzeSound } from '../../../core/analysis/sound-kind'
import { DeviceRegistry } from '../../../core/devices/registry'
import { validatePatch, type Patch } from '../../../core/devices/patch'
import { type PlanarAudio } from '../../../core/render/encode'
import {
  compileFromDisk,
  measureAudio,
  soundPrint,
  toDb,
  type SoundPrint,
} from '../../__tests__/render-support'
import { isWasmDescriptor } from '../../descriptor'
import { canRenderPatch, peakOf, renderPatch } from '../../patch-render'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  FACTORY_CHAINS,
  FACTORY_CHAIN_CATEGORIES,
  FACTORY_PEAK_DB,
  FACTORY_PRESETS,
  FACTORY_PRESET_CATEGORIES,
  FACTORY_SOUNDS,
  PREVIEW_SECONDS,
  factoryPreset,
  previewPhrase,
  renderFactorySound,
  renderPresetPreview,
} from '..'
import { repeatedSettings } from '../packs/__tests__/support'
import { CHAIN_TEST_PATCH, CHAIN_TEST_PHRASE } from './chain-input'
import { longestName, measureEnds } from './sound-measure'
import { BANK_LIMITS, chainProblems, nearestPrints, presetProblems } from './support'

const registry = new DeviceRegistry(STOCK_WASM_DEVICES)
const INSTRUMENTS = STOCK_WASM_DEVICES.filter((d) => d.category === 'instrument').map((d) => d.id)
// The ducker needs a key signal and runs in its own worklet: not a patch device.
const EFFECTS = STOCK_WASM_DEVICES.filter(
  (d) => d.category !== 'instrument' && isWasmDescriptor(d),
).map((d) => d.id)
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const node = { compile: compileFromDisk, sliceMs: 0 } as const

function expectListed(patch: Patch): void {
  expect(patch.id, patch.id).toMatch(KEBAB)
  expect(patch.name.length, patch.id).toBeGreaterThan(2)
  expect(patch.name.length, `${patch.id}: a name has to fit a browser row`).toBeLessThanOrEqual(24)
  expect(patch.description, patch.id).toMatch(/^[A-Z].{24,}\.$/)
  expect(patch.description.length, patch.id).toBeLessThanOrEqual(BANK_LIMITS.description)
  expect(validatePatch(patch, registry), patch.id).toEqual([])
  expect(canRenderPatch(patch), `${patch.id} must be all WASM devices`).toBe(true)
}

/** The largest step between neighbouring samples, the wrap from the last to the first excluded. */
function largestStep(channel: Float32Array): number {
  let largest = 0
  for (let i = 1; i < channel.length; i += 1) {
    largest = Math.max(largest, Math.abs(channel[i] - channel[i - 1]))
  }
  return largest
}

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

/** What each preset's preview is like, by instrument: filled as the presets below are rendered. */
const prints = new Map<string, Map<string, SoundPrint>>()

describe.each(FACTORY_PRESETS.map((preset) => [preset.id, preset] as const))(
  'preset %s',
  (_id, preset) => {
    it('is listed properly and plays at the level of the rest', async () => {
      expectListed(preset)
      expect(preset.effects.length, 'a preset is more than its instrument').toBeGreaterThan(0)
      expect(preset.effects.length).toBeLessThanOrEqual(4)

      // Not normalised: the level someone gets when they load it and play a chord.
      const raw = await renderPatch(preset, {
        ...node,
        phrase: previewPhrase(preset),
        durationSec: PREVIEW_SECONDS,
      })
      const measured = measureAudio(raw)
      expect(presetProblems(preset.id, measured), JSON.stringify(measured)).toEqual([])
      // The shipped exceptions to the level are still held to the limits the bank began with.
      expect(measured.peakDb, 'peak').toBeLessThanOrEqual(-3)
      expect(measured.loudestDb, 'loudest 400 ms').toBeGreaterThanOrEqual(-36)

      const device = preset.instrument.deviceId
      if (!prints.has(device)) prints.set(device, new Map())
      prints.get(device)?.set(preset.id, soundPrint(raw))
    })
  },
)

describe('presets of one instrument', () => {
  it('are different sounds, not one sound under two names', () => {
    const alike = [...prints.values()].flatMap((instrument) =>
      nearestPrints(instrument)
        .filter(({ distance }) => distance < BANK_LIMITS.alikeDb)
        .map(({ id, nearest, distance }) => `${id} = ${nearest} (${distance.toFixed(1)} dB apart)`),
    )
    expect(alike).toEqual([])
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

describe('effect chains', () => {
  let dry: PlanarAudio

  it('renders the dry phrase they are measured on', async () => {
    dry = await renderPatch(CHAIN_TEST_PATCH, {
      ...node,
      phrase: CHAIN_TEST_PHRASE,
      durationSec: 10,
    })
    expect(peakOf(dry.channels)).toBeGreaterThan(0.01)
  })

  it.each(FACTORY_CHAINS.map((chain) => [chain.id, chain] as const))(
    '%s changes the sound without changing its level much',
    async (_id, chain) => {
      expectListed(chain)
      expect(chain.instrument).toBeUndefined()
      expect(chain.effects.length).toBeLessThanOrEqual(5)

      const wet = await renderPatch(chain, { ...node, input: dry, durationSec: 10 })
      const before = measureAudio(dry)
      const after = measureAudio(wet)
      expect(chainProblems(chain.id, after, before), JSON.stringify(after)).toEqual([])
      // The shipped exception to the level is still held to the limit the bank began with.
      expect(Math.abs(after.lufs - before.lufs), 'loudness against the dry phrase').toBeLessThan(9)
      let difference = 0
      for (let i = 0; i < wet.channels[0].length; i += 1) {
        difference = Math.max(difference, Math.abs(wet.channels[0][i] - dry.channels[0][i]))
      }
      expect(difference, 'what the chain changes').toBeGreaterThan(0.002)
    },
  )
})

describe.each(FACTORY_SOUNDS.map((sound) => [sound.id, sound] as const))(
  'sound %s',
  (_id, sound) => {
    it('renders at the bank level as the kind it says it is', async () => {
      expect(sound.id).toMatch(KEBAB)
      expect(sound.name.length).toBeLessThanOrEqual(24)
      expect(longestName(sound).length, `"${longestName(sound)}" in its key`).toBeLessThanOrEqual(
        24,
      )
      expect(sound.description).toMatch(/^[A-Z].{24,}\.$/)
      expect(sound.durationSec).toBeGreaterThanOrEqual(2)
      expect(sound.durationSec).toBeLessThanOrEqual(32)
      const patch = typeof sound.patch === 'string' ? factoryPreset(sound.patch) : sound.patch
      expect(patch, `patch of ${sound.id}`).toBeDefined()
      if (typeof sound.patch !== 'string') expect(validatePatch(sound.patch, registry)).toEqual([])

      const audio = await renderFactorySound(sound, node)
      expect(audio.channels[0]).toHaveLength(Math.round(sound.durationSec * audio.sampleRate))
      expect(toDb(peakOf(audio.channels))).toBeCloseTo(FACTORY_PEAK_DB, 1)
      expect(measureAudio(audio).lufs, 'loudness').toBeGreaterThan(-40)
      expect(analyzeSound(audio.channels, audio.sampleRate).kind).toBe(sound.kind)

      const ends = measureEnds(audio)
      for (const channel of audio.channels) {
        const wrap = Math.abs(channel[0] - channel[channel.length - 1])
        if (sound.loopCrossfadeSec) {
          expect(wrap, 'the loop seam').toBeLessThanOrEqual(largestStep(channel))
        } else {
          expect(Math.abs(channel[channel.length - 1]), 'the last sample').toBeLessThan(1e-3)
        }
      }
      // The measure a clip is entered and left by (core/clips/seam.ts): a loop
      // comes round on itself, and a sound that ends starts and stops at rest.
      if (sound.loopCrossfadeSec) {
        expect(ends.round, 'comes round on itself').toBe(true)
      } else {
        expect(ends.stepIn, 'starts on a step').toBe(false)
        expect(ends.stepOut, 'ends on a step').toBe(false)
      }
    })
  },
)
