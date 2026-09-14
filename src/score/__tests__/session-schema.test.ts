import { describe, expect, it } from 'vitest'

import { defaultSlot, type ScoreSlot, type SlotClip } from '../../core/session/Slot'
import {
  SCORE_FORMAT_VERSION,
  ScoreValidationError,
  createScore,
  findScene,
  findSlot,
  migrateScore,
  normaliseClip,
  parseScore,
  serializeScore,
  slotAt,
  validateScore,
  type Score,
} from '../schema'
import { clip, demoScore } from './fixtures'

function slotClip(sourceId: string, overrides: Partial<SlotClip> = {}): SlotClip {
  return {
    sourceId,
    offsetSec: 0,
    durationSec: 4,
    fadeInSec: 0.1,
    fadeOutSec: 0.1,
    fadeCurve: 'linear',
    gainDb: -1,
    ...overrides,
  }
}

/** The demo score with a two-scene grid over its audio tracks. */
function gridScore(): Score {
  const score = demoScore()
  score.transport.quantize = 2
  score.scenes = [
    { id: 'verse', name: 'Verse' },
    { id: 'chorus', name: 'Chorus' },
  ]
  score.slots = [
    defaultSlot({
      id: 'kick-verse',
      track: 'kick',
      scene: 'verse',
      clip: slotClip('a', { loop: true, warp: [{ sourceSec: 0, beat: 0 }], semitones: -2 }),
      quantize: { seconds: 1.5 },
      launchMode: 'toggle',
      legato: true,
      follow: { a: 'next', b: 'stop', chance: 0.7, time: { unit: 'bars', value: 4 } },
    }),
    defaultSlot({ id: 'kick-chorus', track: 'kick', scene: 'chorus', clip: slotClip('b') }),
    defaultSlot({ id: 'pad-verse', track: 'pad', scene: 'verse', clip: null, launchMode: 'gate' }),
  ]
  return score
}

describe('score format 2: session grid', () => {
  it('createScore has the session fields at their defaults', () => {
    const score = createScore()
    expect(score.format).toBe(2)
    expect(SCORE_FORMAT_VERSION).toBe(2)
    expect(score.scenes).toEqual([])
    expect(score.slots).toEqual([])
    expect(score.transport.quantize).toBe('bar')
    expect(validateScore(score)).toEqual([])
  })

  it('a grid validates and round-trips through serialise/parse with a stable field order', () => {
    const score = gridScore()
    expect(validateScore(score)).toEqual([])
    const json = serializeScore(score)
    const parsed = parseScore(json)
    expect(parsed.transport.quantize).toBe(2)
    expect(parsed.scenes).toEqual(score.scenes)
    expect(parsed.slots).toHaveLength(3)
    expect(parsed.slots[0]).toEqual({
      id: 'kick-verse',
      track: 'kick',
      scene: 'verse',
      clip: {
        sourceId: 'a',
        offsetSec: 0,
        durationSec: 4,
        fadeInSec: 0.1,
        fadeOutSec: 0.1,
        fadeCurve: 'linear',
        gainDb: -1,
        loop: true,
        warp: [{ sourceSec: 0, beat: 0 }],
        semitones: -2,
      },
      launchMode: 'toggle',
      legato: true,
      quantize: { seconds: 1.5 },
      follow: { a: 'next', b: 'stop', chance: 0.7, time: { unit: 'bars', value: 4 } },
    })
    // Optional settings absent when unset; `loop: false` and `warp` dropped.
    expect(Object.keys(parsed.slots[1])).toEqual([
      'id',
      'track',
      'scene',
      'clip',
      'launchMode',
      'legato',
    ])
    expect(parsed.slots[2].clip).toBeNull()
    expect(serializeScore(parsed)).toBe(json)
    // Field order is canonical regardless of authoring order.
    const shuffled = JSON.parse(json) as Record<string, unknown>
    const slots = shuffled.slots as Record<string, unknown>[]
    slots[0] = Object.fromEntries(Object.entries(slots[0]).reverse())
    expect(serializeScore(parseScore(shuffled))).toBe(json)
    expect(findScene(parsed, 'chorus')?.name).toBe('Chorus')
    expect(findSlot(parsed, 'pad-verse')?.launchMode).toBe('gate')
    expect(slotAt(parsed, 'kick', 'chorus')?.id).toBe('kick-chorus')
    expect(slotAt(parsed, 'pad', 'chorus')).toBeUndefined()
  })

  it('clips keep their warp markers and pitch through normalisation', () => {
    const warped = clip('w', 'a', 0, { warp: [{ sourceSec: 1, beat: 2 }], semitones: 3 })
    expect(normaliseClip(warped)).toEqual({
      ...normaliseClip(clip('w', 'a', 0)),
      warp: [{ sourceSec: 1, beat: 2 }],
      semitones: 3,
    })
    const score = demoScore()
    const kick = score.tracks[0]
    if (kick.kind === 'audio') kick.clips.push(warped)
    const parsed = parseScore(serializeScore(score))
    const track = parsed.tracks[0]
    expect(track.kind === 'audio' && track.clips.find((c) => c.id === 'w')).toMatchObject({
      warp: [{ sourceSec: 1, beat: 2 }],
      semitones: 3,
    })
  })

  it('reports every structural and referential problem in the grid', () => {
    const score = gridScore()
    const raw = JSON.parse(serializeScore(score)) as Record<string, unknown>
    const slots = raw.slots as Record<string, unknown>[]
    ;(raw.transport as Record<string, unknown>).quantize = 'bars'
    ;(raw.scenes as Record<string, unknown>[]).push({ id: 'verse', name: 'dup' })
    slots[0].track = 'voice' // a live track
    slots[1].scene = 'bridge'
    slots[1].launchMode = 'hold'
    slots[1].legato = 'yes'
    slots[1].quantize = 0
    slots[1].follow = { a: 'next', b: 'stop', chance: 2 }
    slots[2].clip = { ...slotClip('nope'), fadeCurve: 'cosine' }
    slots.push({ ...slots[2], id: 'pad-verse-2' }) // same cell as pad-verse
    slots.push({ ...slots[2], id: 'kick-chorus' }) // duplicate id
    const paths = validateScore(raw).map((issue) => `${issue.path}: ${issue.message}`)
    expect(paths).toEqual(
      expect.arrayContaining([
        expect.stringContaining('transport.quantize'),
        expect.stringContaining('scenes[2].id: duplicate id "verse"'),
        expect.stringContaining('slots[0].track: "voice" is not an audio track'),
        expect.stringContaining('slots[1].scene: unknown scene "bridge"'),
        expect.stringContaining('slots[1].launchMode'),
        expect.stringContaining('slots[1].legato: expected a boolean'),
        expect.stringContaining('slots[1].quantize'),
        expect.stringContaining('slots[1].follow'),
        expect.stringContaining('slots[2].clip.sourceId: unknown source "nope"'),
        expect.stringContaining('slots[2].clip.fadeCurve'),
        expect.stringContaining('slots[3]: duplicate id "pad×verse"'),
        expect.stringContaining('slots[4].id: duplicate id "kick-chorus"'),
      ]),
    )
    expect(() => parseScore(raw)).toThrow(ScoreValidationError)
  })
})

describe('migration 1 → 2', () => {
  function formatOne(): Record<string, unknown> {
    const raw = JSON.parse(serializeScore(demoScore())) as Record<string, unknown>
    raw.format = 1
    delete raw.scenes
    delete raw.slots
    delete (raw.transport as Record<string, unknown>).quantize
    return raw
  }

  it('brings a format-1 document up with an empty grid and the default quantisation', () => {
    const raw = formatOne()
    const migrated = migrateScore(raw) as Score
    expect(migrated.format).toBe(2)
    expect(migrated.scenes).toEqual([])
    expect(migrated.slots).toEqual([])
    expect(migrated.transport.quantize).toBe('bar')
    expect(migrated.transport.loop).toEqual(
      raw.transport && (raw.transport as Score['transport']).loop,
    )
    expect(raw.format).toBe(1) // the input is not mutated
    const parsed = parseScore(JSON.stringify(raw))
    expect(parsed.format).toBe(2)
    expect(parsed.tracks.map((track) => track.id)).toEqual(['kick', 'pad', 'voice'])
    expect(validateScore(parsed)).toEqual([])
  })

  it('leaves an already-current document alone and still refuses newer or unknown formats', () => {
    const score = createScore()
    expect(migrateScore(score)).toBe(score)
    expect(() => migrateScore({ format: 3 })).toThrow(/newer/)
    expect(() => migrateScore({ format: 0 })).toThrow(/unknown format/)
    expect(() => parseScore({ format: 1 })).toThrow(ScoreValidationError) // migrated, then invalid
  })

  it('a format-1 document that already carries a grid keeps it', () => {
    const raw = JSON.parse(serializeScore(gridScore())) as Record<string, unknown>
    raw.format = 1
    const parsed = parseScore(raw)
    expect(parsed.slots).toHaveLength(3)
    expect(parsed.transport.quantize).toBe(2)
  })
})

describe('slot helpers', () => {
  it('defaultSlot fills launch settings', () => {
    const slot: ScoreSlot = defaultSlot({ id: 's', track: 't', scene: 'x' })
    expect(slot).toEqual({
      id: 's',
      track: 't',
      scene: 'x',
      clip: null,
      launchMode: 'trigger',
      legato: false,
    })
  })
})
