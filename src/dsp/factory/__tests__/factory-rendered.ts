// The rendered half of the factory bank's tests (factory.test.ts says what the
// bank is held to), in shares: vitest runs files side by side and the tests of
// one file in turn, and the renders of the whole bank in turn take minutes. A
// file per share calls one of these with its number.

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
  type AudioMeasurement,
  type SoundPrint,
} from '../../__tests__/render-support'
import { canRenderPatch, peakOf, renderPatch } from '../../patch-render'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  FACTORY_CHAINS,
  FACTORY_PRESETS,
  FACTORY_SOUNDS,
  PREVIEW_SECONDS,
  factoryPreset,
  previewPhrase,
  renderFactorySound,
} from '..'
import { CHAIN_TEST_PATCH, CHAIN_TEST_PHRASE } from './chain-input'
import {
  atItsLevel,
  beatTheAnalysisLoses,
  longestName,
  measureEnds,
  quietestLufs,
} from './sound-measure'
import { BANK_LIMITS, chainProblems, nearestPrints, presetProblems } from './support'

const registry = new DeviceRegistry(STOCK_WASM_DEVICES)
export const INSTRUMENTS = STOCK_WASM_DEVICES.filter((d) => d.category === 'instrument').map(
  (d) => d.id,
)
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const node = { compile: compileFromDisk, sliceMs: 0 } as const

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

/** How many files the presets, the chains and the sounds are spread over. */
export const PRESET_SHARES = 5
export const CHAIN_SHARES = 2
export const SOUND_SHARES = 3

const shareOf = <T>(all: readonly T[], share: number, shares: number): T[] =>
  all.filter((_, index) => index % shares === share)

/** The presets of a share of the instruments: each rendered, and told from its instrument's others. */
export function describePresets(share: number): void {
  const mine = new Set(shareOf(INSTRUMENTS, share, PRESET_SHARES))
  const presets = FACTORY_PRESETS.filter((preset) => mine.has(preset.instrument.deviceId))

  /** What each preset's preview is like, by instrument: filled as the presets below are rendered. */
  const prints = new Map<string, Map<string, SoundPrint>>()

  describe.each(presets.map((preset) => [preset.id, preset] as const))(
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
          .map(
            ({ id, nearest, distance }) => `${id} = ${nearest} (${distance.toFixed(1)} dB apart)`,
          ),
      )
      expect(alike).toEqual([])
    })
  })
}

/** A share of the chains, each rendered on the one dry phrase. */
export function describeChains(share: number): void {
  describe('effect chains', () => {
    let dry: PlanarAudio
    let before: AudioMeasurement

    it('renders the dry phrase they are measured on', async () => {
      dry = await renderPatch(CHAIN_TEST_PATCH, {
        ...node,
        phrase: CHAIN_TEST_PHRASE,
        durationSec: 10,
      })
      before = measureAudio(dry)
      expect(peakOf(dry.channels)).toBeGreaterThan(0.01)
    })

    it.each(
      shareOf(FACTORY_CHAINS, share, CHAIN_SHARES).map((chain) => [chain.id, chain] as const),
    )(
      '%s changes the sound without changing its level much',
      async (_id, chain) => {
        expectListed(chain)
        expect(chain.instrument).toBeUndefined()
        expect(chain.effects.length).toBeLessThanOrEqual(5)

        const wet = await renderPatch(chain, { ...node, input: dry, durationSec: 10 })
        const after = measureAudio(wet)
        expect(chainProblems(chain.id, after, before), JSON.stringify(after)).toEqual([])
        // The shipped exception to the level is still held to the limit the bank began with.
        expect(Math.abs(after.lufs - before.lufs), 'loudness against the dry phrase').toBeLessThan(
          9,
        )
        let difference = 0
        for (let i = 0; i < wet.channels[0].length; i += 1) {
          difference = Math.max(difference, Math.abs(wet.channels[0][i] - dry.channels[0][i]))
        }
        expect(difference, 'what the chain changes').toBeGreaterThan(0.002)
      },
      60000,
    )
  })
}

/** A share of the sounds, each rendered whole. */
export function describeSounds(share: number): void {
  describe.each(
    shareOf(FACTORY_SOUNDS, share, SOUND_SHARES).map((sound) => [sound.id, sound] as const),
  )('sound %s', (_id, sound) => {
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
      const peakDb = toDb(peakOf(audio.channels))
      expect(atItsLevel(sound, peakDb), `peak ${peakDb.toFixed(2)} dBFS`).toBe(true)
      expect(measureAudio(audio).lufs, 'loudness').toBeGreaterThan(quietestLufs(sound))
      const found = analyzeSound(audio.channels, audio.sampleRate).kind
      // A swung or a sparse loop on a kit is a beat by the bank's word, where the analysis finds none.
      if (found !== sound.kind && beatTheAnalysisLoses(sound)) expect(sound.kind).toBe('beat')
      else expect(found).toBe(sound.kind)

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
    }, 60000)
  })
}
