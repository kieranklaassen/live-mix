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
import { describeMaker, makerParams } from '../../../../core/makers'
import { DeviceRegistry } from '../../../../core/devices/registry'
import {
  compileFromDisk,
  measureAudio,
  type AudioMeasurement,
} from '../../../__tests__/render-support'
import { canRenderPatch, renderPatch, type Phrase } from '../../../patch-render'
import { STOCK_WASM_DEVICES } from '../../../registry'
import { FACTORY_PHRASES, PREVIEW_SECONDS, previewPhrase } from '../../phrases'
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
  /** Presets every instrument has at least, in a pack of the scenes. */
  perInstrument: 2,
} as const

/** What a pack of any other shelf is held to beside the levels. */
export const FOCUSED_LIMITS = {
  /** Instruments at least: a pack is about one thing, and not about one knob. */
  instruments: 3,
  /** Presets on one instrument at most. */
  perInstrument: 65,
  /** Phrases of its own, at least, and how many of its presets are heard on one. */
  phrases: 4,
  onOwnPhrase: 50,
  /** How near two presets of one instrument may be on the phrase all are compared on (`comparePhrase`), dB. */
  nearestDb: 1.35,
  /** One preset in so many is rendered by its test; all of them with FACTORY_PACKS=all, as the bench does. */
  rendered: 5,
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
  'club-kit',
  'sub-bass',
  'fm-bass',
  'acid-bass',
  'string-bass',
  'flock',
  'magnet-piano',
  'overtone',
  'staircase',
  'shortwave',
  'ice',
  'rewind',
  'droplets',
  'prepared-piano',
  'graft',
  'wind-harp',
  'afterglow',
  'feedback',
  'binaural',
  'twin-bars',
  'isochronic',
  'still-point',
  'breath-pacer',
  'coloured-noise',
  'tierce-bells',
  'hand-horn',
  'wheel-and-dog',
  'chord-clock',
  'setting-glass',
  'slow-accord',
  'wire-lantern',
  'singing-sand',
  'common-air',
  'standing-water',
  'ringing-order',
  'walking-voices',
  'unsung-voice',
  'deep-roots',
  'spun-wire',
  'flame-organ',
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

const KITS: ReadonlySet<string> = new Set(['drum-kit', 'club-kit', 'glitch-kit'])
const BASSES: ReadonlySet<string> = new Set([
  'sub-bass',
  'fm-bass',
  'acid-bass',
  'ladder-bass',
  'string-bass',
])

/** Two held notes, three that come in over them, a short one and a last long one: every other instrument's comparison. */
const COMPARED: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.6, note: 50 },
    { atSec: 0, durSec: 3.6, note: 57, gain: 0.6 },
    { atSec: 0.9, durSec: 2.6, note: 65, gain: 0.6 },
    { atSec: 1.8, durSec: 1.6, note: 72, gain: 0.7 },
    { atSec: 3.4, durSec: 0.2, note: 69, gain: 0.9 },
    { atSec: 4, durSec: 1.8, note: 62, gain: 0.5 },
  ],
}

/**
 * The phrase the presets of one instrument are compared on: the same for all
 * of them, whatever each is auditioned with, or two would differ by their
 * tunes and not by what they are.
 */
export function comparePhrase(deviceId: string): Phrase {
  if (KITS.has(deviceId)) return FACTORY_PHRASES.drum
  if (BASSES.has(deviceId)) return FACTORY_PHRASES.bass
  return COMPARED
}

/** A preset on that phrase, for its print. */
export function renderCompared(preset: FactoryPreset) {
  return renderPatch(preset, {
    phrase: comparePhrase(preset.instrument.deviceId),
    durationSec: PREVIEW_SECONDS,
    compile: compileFromDisk,
    sliceMs: 0,
  })
}

/** What a phrase written out breaks: notes a key sends, inside the preview with room for the tail. */
export function phraseProblems(phrase: Phrase): string[] {
  const problems: string[] = []
  if (phrase.notes.length < 1 || phrase.notes.length > 64) problems.push('1 to 64 notes')
  for (const { atSec, durSec, note, gain = 0.8 } of phrase.notes) {
    if (!(atSec >= 0 && durSec > 0 && atSec + durSec <= PREVIEW_SECONDS - 0.5))
      problems.push(`time ${atSec}+${durSec}`)
    if (!(note >= 21 && note <= 108)) problems.push(`note ${note}`)
    if (!(gain > 0 && gain <= 1)) problems.push(`gain ${gain}`)
  }
  return problems
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
  const settings: unknown[] = patchDevices(patch).map((device) => {
    const descriptor = registry.get(device.deviceId)
    const params = descriptor ? patchDeviceParams(descriptor, device) : (device.params ?? {})
    return [device.deviceId, device.bypass === true, sortedParams(params)]
  })
  // Two presets that differ only in what their note maker writes are two presets.
  if (patch.maker) {
    const { makerId, bypass, key, parts } = patch.maker
    const descriptor = describeMaker(makerId)
    const params = descriptor ? makerParams(descriptor, patch.maker) : (patch.maker.params ?? {})
    settings.push([
      makerId,
      bypass === true,
      sortedParams(params),
      key ?? null,
      Object.keys(parts ?? {}),
    ])
  }
  return JSON.stringify(settings)
}

function sortedParams(params: Readonly<Record<string, number>>): [string, number][] {
  return Object.keys(params)
    .sort()
    .map((name) => [name, Number(params[name].toPrecision(6))])
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

/** The same for a pack of any shelf but the scenes: what makes one whole is in `FOCUSED_LIMITS`. */
export function describeFocusedPack(packId: string, presets: readonly FactoryPreset[]): void {
  describe(`pack ${packId}`, () => {
    it('is a whole pack', () => {
      const pack = factoryPack(packId)
      expect(pack, `pack ${packId} is listed in FACTORY_PACKS`).toBeDefined()
      expect(pack?.shelf).not.toBe('scenes')
      expect(presets).toHaveLength(FACTORY_PACK_SIZE)
      expect(pack?.count).toBe(presets.length)
      expect(focusProblems(presets)).toEqual([])
    })

    it('names each preset once and sets no two alike', () => {
      expect(new Set(presets.map((preset) => preset.id)).size).toBe(presets.length)
      expect(new Set(presets.map((preset) => preset.name)).size).toBe(presets.length)
      expect(repeatedSettings(presets), 'presets set exactly like another').toEqual([])
    })

    it('lists each preset properly', () => {
      const problems = presets.flatMap((preset) =>
        presetProblems(packId, preset).map((problem) => `${preset.id}: ${problem}`),
      )
      expect(problems).toEqual([])
    })

    const every = process.env.FACTORY_PACKS === 'all' ? 1 : FOCUSED_LIMITS.rendered
    it.each(
      presets
        .filter((_preset, index) => index % every === 0)
        .map((preset) => [preset.id, preset] as const),
    )(
      '%s plays at the level of the rest',
      async (_id, preset) => {
        const measured = measureAudio(await renderPackPreset(preset))
        expect(levelProblems(measured), JSON.stringify(measured)).toEqual([])
      },
      30_000,
    )
  })
}

/** What a pack of one thing breaks as a whole. */
export function focusProblems(presets: readonly FactoryPreset[]): string[] {
  const problems: string[] = []
  const counts = new Map<string, number>()
  for (const { instrument } of presets)
    counts.set(instrument.deviceId, (counts.get(instrument.deviceId) ?? 0) + 1)
  if (counts.size < FOCUSED_LIMITS.instruments) problems.push(`${counts.size} instruments`)
  for (const [id, count] of counts)
    if (count > FOCUSED_LIMITS.perInstrument) problems.push(`${count} on ${id}`)
  const own = presets.flatMap(({ preview }) => (typeof preview === 'object' ? [preview] : []))
  const phrases = new Set(own.map((phrase) => JSON.stringify(phrase))).size
  if (phrases < FOCUSED_LIMITS.phrases) problems.push(`${phrases} phrases of its own`)
  if (own.length < FOCUSED_LIMITS.onOwnPhrase)
    problems.push(`${own.length} presets on a phrase of its own`)
  return problems
}

/** What one preset of such a pack breaks before it is rendered. */
export function presetProblems(packId: string, preset: FactoryPreset): string[] {
  const problems: string[] = []
  const hold = (ok: boolean, problem: string) => {
    if (!ok) problems.push(problem)
  }
  hold(KEBAB.test(preset.id) && preset.id.startsWith(`${packId}-`), 'id')
  hold(preset.name.length > 2 && preset.name.length <= 24, `name of ${preset.name.length}`)
  hold(!/\d$/.test(preset.name), 'name ends in a number')
  hold(/^[A-Z].{24,}\.$/.test(preset.description), 'description is a sentence')
  hold(
    preset.description.length <= PACK_LIMITS.description,
    `description of ${preset.description.length}`,
  )
  hold([...CATEGORIES, 'bass', 'drum'].includes(preset.category), `category ${preset.category}`)
  problems.push(...validatePatch(preset, registry).map((problem) => JSON.stringify(problem)))
  hold(canRenderPatch(preset), 'a device that does not render')
  hold(preset.effects.length >= 1 && preset.effects.length <= 4, `${preset.effects.length} effects`)
  if (typeof preset.preview === 'object')
    problems.push(...phraseProblems(preset.preview).map((problem) => `phrase: ${problem}`))
  return problems
}

/**
 * The tests of one pack of the scenes: called from `<pack id>.pack.test.ts` with the
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
