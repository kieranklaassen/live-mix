// What a pack's sounds are held to, for its own test file (one per pack, so
// they run side by side) and for the bench (../../__tests__/report.test.ts).
// What can be read off a recipe is checked for every sound on every run; what
// needs the sound rendered is checked for every fifth one, or for all of them
// with FACTORY_SOUND_PACKS=all, which is how a pack is checked before it
// ships: thousands of renders are minutes nobody should wait for who changed
// something else.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { analyzeSound } from '../../../../core/analysis/sound-kind'
import { validatePatch, type Patch } from '../../../../core/devices/patch'
import { DeviceRegistry } from '../../../../core/devices/registry'
import { compileFromDisk, measureAudio, toDb } from '../../../__tests__/render-support'
import { canRenderPatch, peakOf } from '../../../patch-render'
import { STOCK_WASM_DEVICES } from '../../../registry'
import { FACTORY_PEAK_DB, factorySound, renderFactorySound } from '../..'
import { KIND_LOUDNESS, longestName, measureEnds } from '../../__tests__/sound-measure'
import { FACTORY_SOUND_PACK_SIZE, factoryPack } from '../../packs'
import { patchSettings } from '../../packs/__tests__/support'
import { type FactorySound } from '../../types'

export const SOUND_PACK_LIMITS = {
  /** Sounds of each kind a pack has at least, so every kind can be asked of every pack. */
  perKind: 10,
  /** Seconds of sound a whole pack holds at most. */
  seconds: 1000,
  /** Seconds a sound lasts: at least and at most. */
  durationSec: [2, 16],
  /**
   * Seconds rendered for one sound at most, with what is skipped and what is
   * folded: a pack sound is rendered when someone asks to hear it, and waits
   * that long times what its devices cost.
   */
  renderedSec: 26,
  /** Characters of a name at most, in whichever key it is longest. */
  name: 24,
  /** Characters of a description at most: it is one line at the foot of a list. */
  description: 140,
  /** Effects after the instrument at most. */
  effects: 5,
  /** Mean of the left channel at most. */
  dc: 0.005,
  /** Under this many dB apart by `printDistance`, two sounds are one sound twice. */
  alikeDb: 1,
} as const

export const SOUND_KINDS = ['drone', 'pad', 'texture', 'oneshot', 'melodic'] as const

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const NATURALS: ReadonlySet<number> = new Set([0, 2, 4, 5, 7, 9, 11])
const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const NOTE_CLASS: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const registry = new DeviceRegistry(STOCK_WASM_DEVICES)
const node = { compile: compileFromDisk, sliceMs: 0 } as const
const everySound = process.env.FACTORY_SOUND_PACKS === 'all'

/** Whether a run renders this sound: every fifth, or every one with FACTORY_SOUND_PACKS=all. */
export const isRendered = (sound: FactorySound): boolean => everySound || sound.number % 5 === 0

/** Seconds rendered to make the sound: what is skipped, the sound and what is folded over its start. */
export const renderedSec = (sound: FactorySound): number =>
  (sound.skipSec ?? 0) + sound.durationSec + (sound.loopCrossfadeSec ?? 0)

/** A sound's patch and how it is played, written out: two sounds with the same text are one sound. */
export function soundSettings(sound: FactorySound): string {
  const patch = sound.patch as Patch
  return JSON.stringify([
    patchSettings(patch),
    sound.phrase.notes.map((note) => [note.atSec, note.durSec, note.note, note.gain ?? 1]),
    sound.durationSec,
    sound.skipSec ?? 0,
    sound.loopCrossfadeSec ?? 0,
    sound.source ?? '',
  ])
}

/**
 * What can be read off one recipe that a pack sound may not be: empty when it
 * is in order. Nothing is rendered.
 */
export function packSoundProblems(
  pack: string,
  sound: FactorySound,
  devices: DeviceRegistry = registry,
): string[] {
  const problems: string[] = []
  const words = sound.words ?? { name: sound.name, description: sound.description }
  if (!KEBAB.test(sound.id)) problems.push('ID not kebab-case')
  if (!sound.id.startsWith(`${pack}-`)) problems.push('ID does not start with its pack')
  if (sound.pack !== pack) problems.push('PACK not stamped')
  if (sound.name.length < 3) problems.push('NAME too short')
  const longest = longestName(sound)
  if (longest.length > SOUND_PACK_LIMITS.name) {
    problems.push(`NAME "${longest}" is ${longest.length} of ${SOUND_PACK_LIMITS.name} characters`)
  }
  if (/\s\d+$/.test(sound.name)) problems.push('NAME ends in a number of a series')
  if (/\s[A-G](?:[#b♯♭])?(?:m|maj|min|sus|add|dim|aug)?\d{0,2}$/.test(words.name)) {
    problems.push('BRACES the note in the name is not in braces')
  }
  if (!/^[A-Z].{24,}\.$/.test(sound.description)) problems.push('WORDS a description is a sentence')
  if (sound.description.length > SOUND_PACK_LIMITS.description) {
    problems.push(
      `WORDS description is ${sound.description.length} of ${SOUND_PACK_LIMITS.description} characters`,
    )
  }
  if (!SOUND_KINDS.includes(sound.kind as (typeof SOUND_KINDS)[number])) {
    problems.push(`KIND "${sound.kind}" is not one a pack sound has`)
  }
  const [shortest, longestSec] = SOUND_PACK_LIMITS.durationSec
  if (sound.durationSec < shortest || sound.durationSec > longestSec) {
    problems.push(`LENGTH ${sound.durationSec} s is outside ${shortest} to ${longestSec}`)
  }
  if (renderedSec(sound) > SOUND_PACK_LIMITS.renderedSec) {
    problems.push(
      `RENDERED ${renderedSec(sound).toFixed(1)} s with its skip and fold, ${SOUND_PACK_LIMITS.renderedSec} at most`,
    )
  }
  if (sound.phrase.notes.length === 0) problems.push('NOTES it plays none')
  const classes = new Set<number>()
  for (const note of sound.phrase.notes) {
    const natural = Number.isInteger(note.note) && NATURALS.has(((note.note % 12) + 12) % 12)
    if (!natural) problems.push(`NOTES ${note.note} is not a white key`)
    if (note.note < 21 || note.note > 108) problems.push(`NOTES ${note.note} is off the keyboard`)
    classes.add(((Math.round(note.note) % 12) + 12) % 12)
    if (!sound.loopCrossfadeSec && note.atSec >= sound.durationSec) {
      problems.push(`NOTES one starts at ${note.atSec} s, after the sound has ended`)
    }
  }
  // The first note a name gives is one the sound plays: "Hangar drone {D}" has a D in it.
  const named = /\{([A-G])\}/.exec(words.name)?.[1]
  if (named && sound.source === undefined && !classes.has(NOTE_CLASS[named])) {
    const played = NOTE_NAMES.filter((name) => classes.has(NOTE_CLASS[name])).join(' ')
    problems.push(`WORDS the name says ${named}, the phrase plays ${played}`)
  }
  if (typeof sound.patch === 'string') {
    problems.push('PATCH is a name: a pack sound has its patch written out')
  } else {
    for (const issue of validatePatch(sound.patch, devices)) {
      problems.push(`INVALID ${issue.path} ${issue.message}`)
    }
    if (!canRenderPatch(sound.patch)) problems.push('INVALID a device that is not a WASM device')
    if (sound.patch.effects.length > SOUND_PACK_LIMITS.effects) {
      problems.push(`EFFECTS ${sound.patch.effects.length}, ${SOUND_PACK_LIMITS.effects} at most`)
    }
  }
  if (sound.source !== undefined) {
    const source = factorySound(sound.source)
    if (!source || source.source !== undefined) {
      problems.push(`SOURCE "${sound.source}" is not a plain sound of the bank`)
    }
  }
  return problems
}

/** What a pack's sounds break as a whole: empty when the pack is in order. A pack not yet written has none. */
export function soundPackProblems(sounds: readonly FactorySound[]): string[] {
  const problems: string[] = []
  if (sounds.length === 0) return problems
  if (sounds.length !== FACTORY_SOUND_PACK_SIZE) {
    problems.push(`COUNT ${sounds.length} of ${FACTORY_SOUND_PACK_SIZE}`)
  }
  for (const kind of SOUND_KINDS) {
    const count = sounds.filter((sound) => sound.kind === kind).length
    if (count < SOUND_PACK_LIMITS.perKind) {
      problems.push(`SHORT ${kind}: ${count} of ${SOUND_PACK_LIMITS.perKind} at least`)
    }
  }
  const seconds = sounds.reduce((sum, sound) => sum + sound.durationSec, 0)
  if (seconds > SOUND_PACK_LIMITS.seconds) {
    problems.push(`LONG ${seconds.toFixed(0)} s in all, ${SOUND_PACK_LIMITS.seconds} at most`)
  }
  const twice = (values: readonly string[]): string[] => [
    ...new Set(values.filter((value, index) => values.indexOf(value) !== index)),
  ]
  for (const id of twice(sounds.map((sound) => sound.id))) problems.push(`TWICE id ${id}`)
  for (const name of twice(sounds.map((sound) => sound.name.toLowerCase()))) {
    problems.push(`TWICE name "${name}"`)
  }
  const seen = new Map<string, string>()
  for (const sound of sounds) {
    const settings = soundSettings(sound)
    const first = seen.get(settings)
    if (first === undefined) seen.set(settings, sound.id)
    else problems.push(`SAME recipe ${sound.id} = ${first}`)
  }
  return problems
}

interface ShippedSound {
  id: string
  durationSec: number
  loops: boolean
}

const asShipped = (sound: FactorySound): ShippedSound => ({
  id: sound.id,
  durationSec: sound.durationSec,
  loops: Boolean(sound.loopCrossfadeSec),
})

const shippedFile = (pack: string): string =>
  join(dirname(fileURLToPath(import.meta.url)), 'shipped', `${pack}.json`)

/**
 * The pack's sounds that have shipped, by catalogue number (see
 * ../../__tests__/shipped-sounds.test.ts for why). With UPDATE_SHIPPED_SOUNDS
 * set, sounds that have no row yet are given one first; a row that is there
 * is never changed.
 */
function shippedSounds(
  pack: string,
  sounds: readonly FactorySound[],
): Record<string, ShippedSound> {
  const file = shippedFile(pack)
  const shipped = existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, ShippedSound>)
    : {}
  if (process.env.UPDATE_SHIPPED_SOUNDS && sounds.length > 0) {
    for (const sound of sounds) shipped[String(sound.number)] ??= asShipped(sound)
    const sorted = Object.fromEntries(
      Object.entries(shipped).sort(([a], [b]) => Number(a) - Number(b)),
    )
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`)
  }
  return shipped
}

/** The largest step between neighbouring samples, the wrap from the last to the first excluded. */
function largestStep(channel: Float32Array): number {
  let largest = 0
  for (let i = 1; i < channel.length; i += 1) {
    largest = Math.max(largest, Math.abs(channel[i] - channel[i - 1]))
  }
  return largest
}

/**
 * The tests of one pack's sounds: called from `<pack id>.sounds.test.ts` with
 * the sounds as its own module lists them and the number its sounds count up
 * from, so a pack is tested without the others being read.
 */
export function describeSoundPack(
  packId: string,
  base: number,
  sounds: readonly FactorySound[],
): void {
  describe(`sounds of pack ${packId}`, () => {
    it('holds as many sounds as the list of packs says it does', () => {
      const pack = factoryPack(packId)
      expect(pack, `pack ${packId} is listed in FACTORY_PACKS`).toBeDefined()
      expect(pack?.sounds, 'what FACTORY_PACKS says the pack holds').toBe(sounds.length)
    })

    it('is a whole pack with every kind in it, or not written yet', () => {
      expect(soundPackProblems(sounds)).toEqual([])
    })

    it('counts its sounds up from its own number, in order', () => {
      expect(sounds.map((sound) => sound.number)).toEqual(
        sounds.map((_, index) => base + index + 1),
      )
    })

    it('keeps every sound that has shipped under its number, with its id, its length and its loop', () => {
      const shipped = shippedSounds(packId, sounds)
      const now = new Map(sounds.map((sound) => [String(sound.number), asShipped(sound)]))
      for (const [number, row] of Object.entries(shipped)) {
        expect(now.get(number), `pack sound ${number} (${row.id})`).toEqual(row)
      }
      const missing = sounds
        .filter((sound) => !(String(sound.number) in shipped))
        .map((sound) => `${sound.number} ${sound.id}`)
      expect(missing, 'add them with UPDATE_SHIPPED_SOUNDS=1').toEqual([])
    })

    it('writes every sound as a pack sound is written', () => {
      const problems = sounds.flatMap((sound) =>
        packSoundProblems(packId, sound).map((problem) => `${sound.id}: ${problem}`),
      )
      expect(problems).toEqual([])
    })

    const rendered = sounds.filter(isRendered)
    it.skipIf(rendered.length === 0).each(rendered.map((sound) => [sound.id, sound] as const))(
      '%s renders at the bank level as the kind it says it is',
      async (_id, sound) => {
        const audio = await renderFactorySound(sound, node)
        expect(audio.channels[0]).toHaveLength(Math.round(sound.durationSec * audio.sampleRate))
        expect(toDb(peakOf(audio.channels))).toBeCloseTo(FACTORY_PEAK_DB, 1)
        const measured = measureAudio(audio)
        const [quietest, loudest] = KIND_LOUDNESS[sound.kind]
        expect(measured.lufs, 'loudness').toBeGreaterThanOrEqual(quietest)
        expect(measured.lufs, 'loudness').toBeLessThanOrEqual(loudest)
        expect(Math.abs(measured.dc), 'DC').toBeLessThanOrEqual(SOUND_PACK_LIMITS.dc)
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
        if (sound.loopCrossfadeSec) {
          expect(ends.round, 'comes round on itself').toBe(true)
        } else {
          expect(ends.stepIn, 'starts on a step').toBe(false)
          expect(ends.stepOut, 'ends on a step').toBe(false)
        }
      },
      // A render is under a second on a quiet machine; a runner that renders several packs at once is not one.
      60_000,
    )
  })
}
