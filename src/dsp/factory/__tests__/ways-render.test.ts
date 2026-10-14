// A take rendered: `plays` on the two renderers. A take is a sound of the
// bank in every way a render can show: as long as its sound, at the bank's
// level, coming round where its sound does. And nothing that renders without
// a way renders differently: the path with no way is the path there was.

import { describe, expect, it } from 'vitest'

import { compileFromDisk, toDb } from '../../__tests__/render-support'
import { peakOf } from '../../patch-render'
import {
  FACTORY_SOUNDS,
  WAYS,
  factorySound,
  generateSound,
  playAndVarySound,
  playSound,
  renderFactorySound,
  renderGeneratedSound,
  varySound,
  wayTakes,
} from '..'
import { type FactorySound } from '../types'
import { type SoundVariation } from '../vary'
import { atItsLevel, measureEnds } from './sound-measure'
import { notesKey } from './ways-support'

const node = { compile: compileFromDisk, sliceMs: 0 } as const

const sound = (id: string): FactorySound => {
  const found = factorySound(id)
  if (!found) throw new Error(`no factory sound "${id}"`)
  return found
}

const same = (a: readonly Float32Array[], b: readonly Float32Array[]): boolean =>
  a.length === b.length &&
  a.every(
    (channel, index) =>
      channel.length === b[index].length && channel.every((sample, at) => sample === b[index][at]),
  )

describe('a sound with no way named', () => {
  it('is the sound itself, and its variant is the variant there was', () => {
    const variations: SoundVariation[] = [
      { seed: 1, amount: 1 },
      { seed: 77, amount: 0.5 },
    ]
    for (const each of FACTORY_SOUNDS) {
      expect(playAndVarySound(each), each.id).toBe(each)
      expect(playAndVarySound(each, { way: 'no-such-way', seed: 1 }), each.id).toBe(each)
      for (const variation of variations) {
        expect(playAndVarySound(each, undefined, variation), each.id).toEqual(
          varySound(each, variation),
        )
      }
    }
  })

  it('renders the same samples with the option absent, empty or naming no way', async () => {
    for (const id of ['soft-pad-fmaj7', 'thumb-dub-line-am', 'felt-piano-c']) {
      const each = sound(id)
      const plain = await renderFactorySound(each, node)
      const absent = await renderFactorySound(each, { ...node, plays: undefined })
      const unknown = await renderFactorySound(each, {
        ...node,
        plays: { way: 'no-such-way', seed: 1 },
      })
      expect(same(plain.channels, absent.channels), id).toBe(true)
      expect(same(plain.channels, unknown.channels), id).toBe(true)
    }
  }, 120000)
})

describe('a take rendered', () => {
  it('of a held pad is as long as the pad, at its level, and comes round as it does', async () => {
    const pad = sound('soft-pad-fmaj7')
    const plain = await renderFactorySound(pad, node)
    for (const way of ['rising', 'staggered-entries']) {
      const take = await renderFactorySound(pad, { ...node, plays: { way, seed: 1, take: 1 } })
      expect(take.channels[0].length, way).toBe(plain.channels[0].length)
      expect(same(take.channels, plain.channels), way).toBe(false)
      expect(atItsLevel(pad, toDb(peakOf(take.channels))), way).toBe(true)
      expect(measureEnds(take).round, way).toBe(measureEnds(plain).round)
    }
  }, 120000)

  it('of a bass line at another tempo is as long as the line at that tempo', async () => {
    const line = sound('thumb-dub-line-am')
    const plain = await renderFactorySound(line, { ...node, bpm: 90 })
    const take = await renderFactorySound(line, {
      ...node,
      bpm: 90,
      plays: { way: 'rising', seed: 1, take: 1 },
    })
    expect(take.channels[0].length).toBe(plain.channels[0].length)
    expect(same(take.channels, plain.channels)).toBe(false)
    expect(atItsLevel(line, toDb(peakOf(take.channels)))).toBe(true)
    expect(measureEnds(take).round).toBe(measureEnds(plain).round)
  }, 120000)

  it('takes a variant on top of the way', async () => {
    const line = sound('thumb-dub-line-am')
    const plays = { way: 'rising', seed: 1, take: 1 }
    const take = await renderFactorySound(line, { ...node, plays })
    const varied = await renderFactorySound(line, {
      ...node,
      plays,
      vary: { seed: 4, touch: 1 },
    })
    expect(varied.channels[0].length).toBe(take.channels[0].length)
    expect(same(varied.channels, take.channels)).toBe(false)
  }, 120000)

  it('of a factory sound is played on the white keys, whatever key is named, and moved with the sound', async () => {
    const line = sound('thumb-dub-line-am')
    const key = { root: 4, mode: 'major' } as const
    const plays = { way: 'one-note-slips', seed: 5 }
    // A take whose notes would be others in the key that is named.
    const { takes } = wayTakes(line, plays)
    const take = Array.from({ length: takes }, (_, index) => index).find(
      (index) =>
        notesKey(playSound(line, { ...plays, take: index }).phrase.notes) !==
        notesKey(playSound(line, { ...plays, take: index, key }).phrase.notes),
    )
    expect(take).toBeDefined()
    const moved = await renderFactorySound(line, {
      ...node,
      transpose: 2,
      plays: { ...plays, take },
    })
    const named = await renderFactorySound(line, {
      ...node,
      transpose: 2,
      plays: { ...plays, take, key },
    })
    const plain = await renderFactorySound(line, { ...node, transpose: 2 })
    expect(same(named.channels, moved.channels)).toBe(true)
    expect(same(moved.channels, plain.channels)).toBe(false)
  }, 120000)

  it('of a generated sound is played in the key it was generated in', async () => {
    const key = { root: 4, mode: 'major' } as const
    // E major: E F sharp G sharp A B C sharp D sharp.
    const inKey = (note: number): boolean =>
      [4, 6, 8, 9, 11, 1, 3].includes(((Math.round(note) % 12) + 12) % 12)
    let played = 0
    for (let seed = 1; seed <= 12; seed += 1) {
      const made = generateSound({ seed, kind: 'melodic', key })
      expect(
        made.phrase.notes.every((note) => inKey(note.note)),
        `seed ${seed}`,
      ).toBe(true)
      const plays = { way: 'one-note-slips', seed: 5, key }
      const { takes } = wayTakes(made, plays)
      for (let take = 0; take < takes; take += 1) {
        const notes = playSound(made, { ...plays, take }).phrase.notes
        expect(
          notes.every((note) => inKey(note.note)),
          `seed ${seed} take ${take}`,
        ).toBe(true)
      }
      if (takes === 0 || played > 0) continue
      played += 1
      // The renderer plays it in the sound's own key without being told: the last take, whose
      // notes are others where no key is named.
      const last = takes - 1
      const unkeyed = playSound(made, { way: 'one-note-slips', seed: 5, take: last })
      expect(notesKey(unkeyed.phrase.notes)).not.toBe(
        notesKey(playSound(made, { ...plays, take: last }).phrase.notes),
      )
      const plain = await renderGeneratedSound(made, node)
      const take = await renderGeneratedSound(made, {
        ...node,
        plays: { way: 'one-note-slips', seed: 5, take: last },
      })
      const named = await renderGeneratedSound(made, { ...node, plays: { ...plays, take: last } })
      expect(take.channels[0].length).toBe(plain.channels[0].length)
      expect(same(take.channels, plain.channels)).toBe(false)
      expect(same(take.channels, named.channels)).toBe(true)
    }
    expect(played).toBe(1)
  }, 120000)
})

describe('a take of a held chord with a variant on top', () => {
  it('still holds the note the sound stands on through everything that is rendered', () => {
    const held = FACTORY_SOUNDS.filter((each) => {
      const skipSec = each.skipSec ?? 0
      const endSec = skipSec + each.durationSec + (each.loopCrossfadeSec ?? 0)
      return (
        Boolean(each.loopCrossfadeSec) &&
        each.source === undefined &&
        !each.kit &&
        each.phrase.notes.length >= 3 &&
        skipSec <= 4 &&
        each.phrase.notes.every(
          (note) => note.atSec <= skipSec && note.atSec + note.durSec >= endSec,
        )
      )
    })
    expect(held.length).toBeGreaterThanOrEqual(3)
    const ways = WAYS.filter((way) => way.family === 'held' || way.family === 'one-at-a-time')
    let varied = 0
    for (const each of held) {
      const endSec = (each.skipSec ?? 0) + each.durationSec + (each.loopCrossfadeSec ?? 0)
      const standing = Math.min(...each.phrase.notes.map((note) => note.note))
      for (const way of ways) {
        const plays = { way: way.id, seed: 1, take: 1 }
        if (wayTakes(each, plays).takes === 0) continue
        const take = playSound(each, plays)
        for (let seed = 1; seed <= 200; seed += 1) {
          const variant = playAndVarySound(each, plays, { seed, amount: 1 })
          if (notesKey(variant.phrase.notes) !== notesKey(take.phrase.notes)) varied += 1
          const low = Math.min(...variant.phrase.notes.map((note) => note.note))
          const stood = variant.phrase.notes.filter((note) => Math.abs(note.note - low) < 0.5)
          const say = `${each.id} ${way.id} seed ${seed}`
          // One key, down from before the skipped start to past the end of the crossfade.
          expect(stood, say).toHaveLength(
            each.phrase.notes.filter((note) => note.note === standing).length,
          )
          for (const note of stood) {
            expect(note.atSec, say).toBeLessThanOrEqual(variant.skipSec ?? 0)
            expect(note.atSec + note.durSec, say).toBeGreaterThanOrEqual(endSec)
          }
          expect(variant.durationSec, say).toBe(each.durationSec)
        }
      }
    }
    // The variant does touch the take up: its chords and its touch still vary.
    expect(varied).toBeGreaterThan(0)
  }, 120000)
})
