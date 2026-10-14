import type { JsonObject, JsonValue } from '../../core/json'
import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GRAIN,
  STYLE_KNOBS,
  VISUAL_BENDS,
  VISUAL_KINDS,
  VISUAL_LANES,
  VISUAL_MAX,
  VISUAL_SHORTEST_BEATS,
  VISUAL_SOURCES,
  addVisual,
  carryVisualLinks,
  drawOrder,
  emptyVisualSet,
  firstKnobs,
  freeLane,
  isEmptyVisualSet,
  isVisualKind,
  isVisualSource,
  knobsOf,
  linkVisual,
  paints,
  placeVisual,
  removeVisual,
  sameVisualSet,
  setVisualGrain,
  setVisualKind,
  setVisualKnob,
  setVisualPalette,
  setVisualVariation,
  visualBend,
  visualById,
  visualByNumber,
  visualKindName,
  visualLabel,
  visualNumber,
  visualsFromJson,
  visualsToJson,
  withoutLostVisuals,
  type LinkedStroke,
  type Visual,
  type VisualSet,
} from '../model'
import { DEFAULT_PALETTE } from '../palettes'
import { VISUAL_STYLES } from '../styles'

const visual = (id: string, kind: string, more: Partial<Visual> = {}): Visual => ({
  id,
  kind,
  variation: 0,
  stroke: null,
  lane: 0,
  beat: 0,
  beats: null,
  knobs: firstKnobs(kind),
  ...more,
})

const setOf = (...list: Visual[]): VisualSet => ({
  palette: DEFAULT_PALETTE,
  grain: DEFAULT_GRAIN,
  list,
})

const ids = (set: VisualSet): string[] => set.list.map((item) => item.id)

/** What a document hands back after it was saved and opened again. */
const saved = (set: VisualSet): JsonValue =>
  JSON.parse(JSON.stringify(visualsToJson(set))) as JsonValue

/** One of everything: linked, placed for a stretch, placed for the whole piece, a bend, and a knob that follows. */
const FULL: VisualSet = {
  palette: 'sea',
  grain: 0.25,
  list: [
    visual('linked', 'dot-screen', { stroke: 'stroke-1', variation: 1 }),
    visual('placed', 'night-sea', { lane: 2, beat: 8, beats: 16 }),
    visual('whole', 'meadow', { lane: 1 }),
    visual('bend', 'trails', { lane: 3, beat: 4.5, beats: 0.25 }),
    visual('follower', 'star', {
      beats: 32,
      knobs: {
        ...firstKnobs('star'),
        size: { value: 0.8, follows: 'low' },
        glow: { value: 0.4, follows: null },
      },
    }),
  ],
}

describe('the kinds, their knobs and what a knob can follow', () => {
  it('has every style and every bend as a kind, the styles first', () => {
    expect(VISUAL_KINDS).toEqual([
      ...VISUAL_STYLES.map((style) => style.id),
      ...VISUAL_BENDS.map((bend) => bend.id),
    ])
    expect(new Set(VISUAL_KINDS).size).toBe(VISUAL_KINDS.length)
    for (const kind of VISUAL_KINDS) {
      expect(kind).toMatch(/^[a-z][a-z0-9-]{0,39}$/)
      expect(isVisualKind(kind)).toBe(true)
    }
    expect(isVisualKind('later-kind')).toBe(false)
  })

  it('tells what paints from what bends', () => {
    expect(paints('dot-screen')).toBe(true)
    expect(paints('trails')).toBe(false)
    expect(paints('later-kind')).toBe(false)
    expect(visualBend('mirror')?.name).toBe('Mirror')
    expect(visualBend('dot-screen')).toBeUndefined()
  })

  it('gives every style the same knobs, each bend its own, and none to a kind it does not have', () => {
    expect(knobsOf('dot-screen')).toBe(STYLE_KNOBS)
    expect(knobsOf('flock')).toBe(STYLE_KNOBS)
    expect(knobsOf('trails').map((knob) => knob.id)).toEqual(['length', 'push'])
    expect(knobsOf('mirror').map((knob) => knob.id)).toEqual(['fold'])
    expect(knobsOf('spin').map((knob) => knob.id)).toEqual(['turn'])
    expect(knobsOf('grain').map((knob) => knob.id)).toEqual(['amount'])
    expect(knobsOf('later-kind')).toEqual([])
  })

  it('names every knob once in its kind and starts it between nothing and full', () => {
    for (const kind of VISUAL_KINDS) {
      const knobs = knobsOf(kind)
      expect(knobs.length, kind).toBeGreaterThan(0)
      expect(new Set(knobs.map((knob) => knob.id)).size, kind).toBe(knobs.length)
      for (const knob of knobs) {
        expect(knob.id, kind).toMatch(/^[a-z][a-z0-9-]{0,23}$/)
        expect(knob.first, kind).toBeGreaterThanOrEqual(0)
        expect(knob.first, kind).toBeLessThanOrEqual(1)
        if (knob.follows !== undefined) expect(isVisualSource(knob.follows), kind).toBe(true)
      }
    }
  })

  it('starts a new visual with its knobs where the kind puts them', () => {
    expect(firstKnobs('dot-screen')).toEqual({
      level: { value: 0.9, follows: null },
      size: { value: 0.5, follows: null },
      glow: { value: 0.7, follows: 'energy' },
      colour: { value: 0.5, follows: null },
    })
    expect(firstKnobs('trails')).toEqual({
      length: { value: 0.5, follows: null },
      push: { value: 0.3, follows: null },
    })
    expect(firstKnobs('later-kind')).toEqual({})
  })

  it('calls a kind by its name, and one it does not have by its id', () => {
    expect(visualKindName('dot-screen')).toBe('Dot screen')
    expect(visualKindName('grain')).toBe('More grain')
    expect(visualKindName('later-kind')).toBe('later-kind')
  })

  it('knows what a knob can follow', () => {
    const sources = VISUAL_SOURCES.map((source) => source.id)
    expect(new Set(sources).size).toBe(sources.length)
    for (const source of sources) expect(isVisualSource(source)).toBe(true)
    expect(isVisualSource('stroke')).toBe(true)
    expect(isVisualSource('place')).toBe(true)
    expect(isVisualSource('no-such')).toBe(false)
    expect(isVisualSource('')).toBe(false)
  })
})

describe('a piece with no visuals', () => {
  it('is the empty set, the same one every time', () => {
    const empty = emptyVisualSet()
    expect(empty).toBe(emptyVisualSet())
    expect(empty).toEqual({ palette: DEFAULT_PALETTE, grain: DEFAULT_GRAIN, list: [] })
    expect(isEmptyVisualSet(empty)).toBe(true)
  })

  it('is no longer empty with a visual, another palette or other grain', () => {
    expect(isEmptyVisualSet(setOf())).toBe(true)
    expect(isEmptyVisualSet(setOf(visual('a', 'star')))).toBe(false)
    expect(isEmptyVisualSet({ ...setOf(), palette: 'sea' })).toBe(false)
    expect(isEmptyVisualSet({ ...setOf(), grain: 0.2 })).toBe(false)
  })

  it('is written with its palette, its grain and an empty list, and read back as the empty set', () => {
    expect(visualsToJson(emptyVisualSet())).toEqual({
      palette: DEFAULT_PALETTE,
      grain: DEFAULT_GRAIN,
      list: [],
    })
    expect(visualsFromJson(saved(emptyVisualSet()))).toBe(emptyVisualSet())
  })
})

describe('saving and opening', () => {
  it('reads back what it wrote', () => {
    expect(visualsFromJson(saved(FULL))).toEqual(FULL)
    expect(sameVisualSet(visualsFromJson(saved(FULL)), FULL)).toBe(true)
  })

  it('writes only what a visual needs', () => {
    const json = visualsToJson(FULL)
    expect(json.palette).toBe('sea')
    expect(json.grain).toBe(0.25)
    const [linked, placed, whole, bend, follower] = json.list as JsonObject[]
    // A linked one has no row or stretch of its own; the second variation is written, the first is not.
    expect(linked).toEqual({
      id: 'linked',
      kind: 'dot-screen',
      variation: 1,
      stroke: 'stroke-1',
      knobs: linked.knobs,
    })
    expect(placed).toEqual({
      id: 'placed',
      kind: 'night-sea',
      lane: 2,
      beat: 8,
      beats: 16,
      knobs: placed.knobs,
    })
    // No length: it is drawn for the whole piece.
    expect(whole).toEqual({ id: 'whole', kind: 'meadow', lane: 1, beat: 0, knobs: whole.knobs })
    expect(bend).toEqual({
      id: 'bend',
      kind: 'trails',
      lane: 3,
      beat: 4.5,
      beats: 0.25,
      knobs: { length: { value: 0.5 }, push: { value: 0.3 } },
    })
    // What a knob follows is written only where it follows something.
    expect(follower.knobs).toEqual({
      colour: { value: 0.5 },
      glow: { value: 0.4 },
      level: { value: 0.9 },
      size: { value: 0.8, follows: 'low' },
    })
  })

  it('forgets the row and the stretch of a visual that is linked', () => {
    const linked = setOf(visual('a', 'star', { stroke: 'stroke-1', lane: 3, beat: 8, beats: 4 }))
    expect(visualsFromJson(saved(linked)).list[0]).toMatchObject({
      stroke: 'stroke-1',
      lane: 0,
      beat: 0,
      beats: null,
    })
  })

  it('tells two sets apart by what they would write', () => {
    expect(sameVisualSet(FULL, FULL)).toBe(true)
    expect(sameVisualSet(FULL, { ...FULL, list: [...FULL.list] })).toBe(true)
    expect(sameVisualSet(FULL, { ...FULL, grain: 0.3 })).toBe(false)
    expect(sameVisualSet(FULL, removeVisual(FULL, 'bend'))).toBe(false)
    expect(sameVisualSet(FULL, setVisualKnob(FULL, 'whole', 'size', { value: 0.1 }))).toBe(false)
  })

  it('reads anything that is not an entry as no visuals', () => {
    const junk: (JsonValue | undefined)[] = [
      undefined,
      null,
      5,
      'visuals',
      true,
      [],
      [{ id: 'a', kind: 'star' }],
      {},
    ]
    for (const value of junk) expect(visualsFromJson(value)).toBe(emptyVisualSet())
    expect(visualsFromJson({ palette: 4, grain: 'much', list: 'none' })).toBe(emptyVisualSet())
    expect(visualsFromJson({ list: { id: 'a', kind: 'star' } })).toBe(emptyVisualSet())
  })

  it('keeps a palette or grain that was set, with no visuals', () => {
    expect(visualsFromJson({ palette: 'sea' })).toEqual({
      palette: 'sea',
      grain: DEFAULT_GRAIN,
      list: [],
    })
    expect(visualsFromJson({ grain: 0.1 })).toEqual({
      palette: DEFAULT_PALETTE,
      grain: 0.1,
      list: [],
    })
  })

  it('reads a palette it does not have as the first one, and holds the grain between nothing and full', () => {
    expect(visualsFromJson({ palette: 'no-such-palette', grain: 0.2 }).palette).toBe(
      DEFAULT_PALETTE,
    )
    expect(visualsFromJson({ grain: 7 }).grain).toBe(1)
    expect(visualsFromJson({ grain: -1 }).grain).toBe(0)
    expect(visualsFromJson({ grain: 0.12345 }).grain).toBe(0.123)
    expect(visualsFromJson({ palette: 'sea', grain: '0.2' }).grain).toBe(DEFAULT_GRAIN)
  })

  it('leaves out whatever is not a visual', () => {
    const read = visualsFromJson({
      list: [
        null,
        4,
        'star',
        [],
        { kind: 'star' },
        { id: '', kind: 'star' },
        { id: 5, kind: 'star' },
        { id: 'x'.repeat(81), kind: 'star' },
        { id: 'no-kind' },
        { id: 'kind-of-wrong-type', kind: 3 },
        { id: 'kind-badly-written', kind: 'Star!' },
        { id: 'kept', kind: 'star' },
      ],
    })
    expect(ids(read)).toEqual(['kept'])
    expect(read.list[0]).toEqual(visual('kept', 'star'))
  })

  it('keeps the first of two visuals with one id', () => {
    const read = visualsFromJson({
      list: [
        { id: 'twin', kind: 'star' },
        { id: 'twin', kind: 'meadow' },
        { id: 'other', kind: 'pond' },
      ],
    })
    expect(read.list.map((item) => [item.id, item.kind])).toEqual([
      ['twin', 'star'],
      ['other', 'pond'],
    ])
  })

  it('reads no more visuals than a piece holds', () => {
    const many = Array.from({ length: VISUAL_MAX + 6 }, (_, index) => ({
      id: `v${index}`,
      kind: 'star',
    }))
    const read = visualsFromJson({ list: many })
    expect(read.list).toHaveLength(VISUAL_MAX)
    expect(read.list[0].id).toBe('v0')
    expect(read.list[VISUAL_MAX - 1].id).toBe(`v${VISUAL_MAX - 1}`)
  })

  it('holds rows, places and lengths inside what they can be', () => {
    const read = (entry: JsonObject): Visual =>
      visualsFromJson({ list: [{ id: 'a', kind: 'star', ...entry }] }).list[0]
    expect(read({ lane: 9 }).lane).toBe(VISUAL_LANES - 1)
    expect(read({ lane: -2 }).lane).toBe(0)
    expect(read({ lane: 1.6 }).lane).toBe(2)
    expect(read({ lane: 'top' }).lane).toBe(0)
    expect(read({ beat: -4 }).beat).toBe(0)
    expect(read({ beat: 1.23456 }).beat).toBe(1.235)
    expect(read({ beat: '8' }).beat).toBe(0)
    expect(read({ beats: 0.01 }).beats).toBe(VISUAL_SHORTEST_BEATS)
    expect(read({ beats: -3 }).beats).toBe(VISUAL_SHORTEST_BEATS)
    expect(read({ beats: 7.00049 }).beats).toBe(7)
    expect(read({ beats: 'long' }).beats).toBeNull()
    expect(read({ beats: null }).beats).toBeNull()
    expect(read({}).beats).toBeNull()
  })

  it('reads only the second variation as the second, and only a real id as a link', () => {
    const read = (entry: JsonObject): Visual =>
      visualsFromJson({ list: [{ id: 'a', kind: 'star', ...entry }] }).list[0]
    expect(read({ variation: 1 }).variation).toBe(1)
    expect(read({ variation: 2 }).variation).toBe(0)
    expect(read({ variation: '1' }).variation).toBe(0)
    expect(read({ stroke: 'stroke-1' }).stroke).toBe('stroke-1')
    expect(read({ stroke: '' }).stroke).toBeNull()
    expect(read({ stroke: 7 }).stroke).toBeNull()
    expect(read({ stroke: 'x'.repeat(81) }).stroke).toBeNull()
  })

  it('gives a kind it has exactly its knobs: one left out or badly written stands where a new one would', () => {
    const read = visualsFromJson({
      list: [
        {
          id: 'a',
          kind: 'star',
          knobs: {
            level: { value: 3 },
            size: { value: 'big', follows: 'low' },
            colour: 4,
            extra: { value: 1 },
          },
        },
        {
          id: 'b',
          kind: 'star',
          knobs: {
            level: { value: -1 },
            glow: { value: 0.2 },
            size: { value: 0.12345, follows: 'no-such' },
          },
        },
        { id: 'c', kind: 'trails', knobs: 'none' },
      ],
    })
    expect(read.list[0].knobs).toEqual({
      level: { value: 1, follows: null },
      size: { value: 0.5, follows: null },
      glow: { value: 0.7, follows: 'energy' },
      colour: { value: 0.5, follows: null },
    })
    expect(read.list[1].knobs).toEqual({
      level: { value: 0, follows: null },
      size: { value: 0.123, follows: null },
      // Written with nothing to follow, it follows nothing, whatever a new one would follow.
      glow: { value: 0.2, follows: null },
      colour: { value: 0.5, follows: null },
    })
    expect(read.list[2].knobs).toEqual(firstKnobs('trails'))
  })

  it('keeps a kind this build does not have, with its knobs, so that it saves what it opened', () => {
    const later: JsonObject = {
      palette: 'sea',
      grain: 0.5,
      list: [
        {
          id: 'new',
          kind: 'later-kind',
          variation: 1,
          lane: 1,
          beat: 2,
          beats: 8,
          knobs: { swirl: { value: 0.3, follows: 'low' }, depth: { value: 0.9 } },
        },
        { id: 'tied', kind: 'other-later-kind', stroke: 'stroke-1', knobs: {} },
      ],
    }
    const read = visualsFromJson(later)
    expect(read.list[0]).toEqual({
      id: 'new',
      kind: 'later-kind',
      variation: 1,
      stroke: null,
      lane: 1,
      beat: 2,
      beats: 8,
      knobs: { swirl: { value: 0.3, follows: 'low' }, depth: { value: 0.9, follows: null } },
    })
    expect(read.list[1]).toMatchObject({
      id: 'tied',
      kind: 'other-later-kind',
      stroke: 'stroke-1',
      knobs: {},
    })
    expect(saved(read)).toEqual(later)
    expect(visualsFromJson(saved(read))).toEqual(read)
  })

  it('keeps of such a kind only what is a knob, and no more than sixteen of them', () => {
    const knobs: JsonObject = {
      'Bad Name': { value: 1 },
      junk: 4,
      empty: {},
      wrong: { value: 'high' },
      far: { value: 9 },
    }
    const read = visualsFromJson({ list: [{ id: 'new', kind: 'later-kind', knobs }] })
    expect(read.list[0].knobs).toEqual({ far: { value: 1, follows: null } })
    const many: JsonObject = {}
    for (let index = 0; index < 20; index++) many[`knob-${index}`] = { value: 0.5 }
    const crowded = visualsFromJson({ list: [{ id: 'new', kind: 'later-kind', knobs: many }] })
    expect(Object.keys(crowded.list[0].knobs)).toHaveLength(16)
  })
})

describe('what a later build wrote beside the fields read here', () => {
  const later: JsonValue = {
    palette: 'sea',
    grain: 0.2,
    list: [],
    laid: [{ effect: 'reverb', x: 0.2 }],
    'bad key!': 1,
  }

  it('is kept as written, and saved again with the rest', () => {
    const set = visualsFromJson(later)
    expect(set.more).toEqual({ laid: [{ effect: 'reverb', x: 0.2 }] })
    expect(saved(set)).toEqual({
      palette: 'sea',
      grain: 0.2,
      list: [],
      laid: [{ effect: 'reverb', x: 0.2 }],
    })
    // An edit carries it along.
    const { set: added } = addVisual(set, 'star')
    expect((saved(added) as JsonObject).laid).toEqual([{ effect: 'reverb', x: 0.2 }])
  })

  it('keeps a piece from counting as having no visuals', () => {
    const set = visualsFromJson({ laid: [1] })
    expect(isEmptyVisualSet(set)).toBe(false)
    expect(saved(set)).toEqual({
      palette: DEFAULT_PALETTE,
      grain: DEFAULT_GRAIN,
      list: [],
      laid: [1],
    })
  })

  it('never takes the place of a field read here', () => {
    const set: VisualSet = { ...setOf(), more: { palette: 'other', grain: 9, list: 'no' } }
    expect(saved(set)).toEqual({ palette: DEFAULT_PALETTE, grain: DEFAULT_GRAIN, list: [] })
  })
})

describe('adding a visual', () => {
  it('adds one drawn for the whole piece in the first free row, with the knobs of its kind', () => {
    const { set, visual: added } = addVisual(emptyVisualSet(), 'dot-screen')
    expect(added).toMatchObject({
      kind: 'dot-screen',
      variation: 0,
      stroke: null,
      lane: 0,
      beat: 0,
      beats: null,
    })
    expect(added?.knobs).toEqual(firstKnobs('dot-screen'))
    expect(added?.id).toMatch(/^visual-/)
    expect(set.list).toEqual([added])
    expect(set.palette).toBe(DEFAULT_PALETTE)
    // The empty set itself is as it was.
    expect(emptyVisualSet().list).toEqual([])
    const second = addVisual(set, 'meadow')
    expect(second.visual?.lane).toBe(1)
    expect(second.visual?.id).not.toBe(added?.id)
    expect(ids(second.set)).toEqual([added?.id, second.visual?.id])
  })

  it('places one at the row and stretch asked for, held inside what they can be', () => {
    const { visual: placed } = addVisual(setOf(), 'star', { lane: 2, beat: 8, beats: 16 }, 1)
    expect(placed).toMatchObject({ variation: 1, stroke: null, lane: 2, beat: 8, beats: 16 })
    const { visual: held } = addVisual(setOf(), 'star', { lane: 12, beat: -3, beats: 0.01 })
    expect(held).toMatchObject({ lane: VISUAL_LANES - 1, beat: 0, beats: VISUAL_SHORTEST_BEATS })
    const { visual: whole } = addVisual(setOf(), 'star', { beat: 4, beats: null })
    expect(whole).toMatchObject({ beat: 4, beats: null })
  })

  it('links one to a stroke, with no row or stretch of its own', () => {
    const { set, visual: linked } = addVisual(
      setOf(visual('a', 'star')),
      'night-sea',
      { stroke: 'stroke-1' },
      1,
    )
    expect(linked).toMatchObject({
      kind: 'night-sea',
      variation: 1,
      stroke: 'stroke-1',
      lane: 0,
      beat: 0,
      beats: null,
    })
    expect(set.list).toHaveLength(2)
  })

  it('gives a bend no variation', () => {
    expect(addVisual(setOf(), 'mirror', {}, 1).visual).toMatchObject({
      kind: 'mirror',
      variation: 0,
    })
    expect(addVisual(setOf(), 'mirror', {}, 1).visual?.knobs).toEqual(firstKnobs('mirror'))
  })

  it('adds nothing of a kind it does not have', () => {
    const set = setOf(visual('a', 'star'))
    const edit = addVisual(set, 'later-kind')
    expect(edit.visual).toBeNull()
    expect(edit.set).toBe(set)
  })

  it('adds nothing past the most a piece holds', () => {
    let set = emptyVisualSet()
    for (let count = 0; count < VISUAL_MAX; count++) {
      const edit = addVisual(set, 'star')
      expect(edit.visual).not.toBeNull()
      set = edit.set
    }
    expect(set.list).toHaveLength(VISUAL_MAX)
    expect(new Set(ids(set)).size).toBe(VISUAL_MAX)
    const full = addVisual(set, 'star')
    expect(full.visual).toBeNull()
    expect(full.set).toBe(set)
  })

  it('finds the first row nothing is drawn in, and the last when every row has something', () => {
    expect(freeLane(setOf())).toBe(0)
    expect(
      freeLane(setOf(visual('a', 'star', { lane: 0 }), visual('b', 'star', { lane: 2 }))),
    ).toBe(1)
    // A linked visual is in no row.
    expect(freeLane(setOf(visual('a', 'star', { stroke: 'stroke-1' })))).toBe(0)
    const everyRow = Array.from({ length: VISUAL_LANES }, (_, lane) =>
      visual(`v${lane}`, 'star', { lane }),
    )
    expect(freeLane(setOf(...everyRow))).toBe(VISUAL_LANES - 1)
  })
})

describe('placing, linking and removing', () => {
  const set = setOf(
    visual('a', 'star', { lane: 1, beat: 4, beats: 8 }),
    visual('b', 'meadow', { stroke: 'stroke-1' }),
    visual('c', 'trails', { lane: 2 }),
  )

  it('moves a visual to a row and a stretch, and leaves what is not named as it is', () => {
    const moved = placeVisual(set, 'a', { lane: 3 })
    expect(visualById(moved, 'a')).toMatchObject({ lane: 3, beat: 4, beats: 8, stroke: null })
    const stretched = placeVisual(set, 'a', { beat: 6.0004, beats: 2 })
    expect(visualById(stretched, 'a')).toMatchObject({ lane: 1, beat: 6, beats: 2 })
    const whole = placeVisual(set, 'a', { beats: null })
    expect(visualById(whole, 'a')).toMatchObject({ lane: 1, beat: 4, beats: null })
    // The others are the very same.
    expect(moved.list[1]).toBe(set.list[1])
    expect(moved.list[2]).toBe(set.list[2])
    expect(set.list[0].lane).toBe(1)
  })

  it('holds a placed visual inside what a row, a place and a length can be', () => {
    const held = placeVisual(set, 'a', { lane: -5, beat: -1, beats: 0 })
    expect(visualById(held, 'a')).toMatchObject({ lane: 0, beat: 0, beats: VISUAL_SHORTEST_BEATS })
  })

  it('lets a linked visual go of its stroke when it is placed', () => {
    const placed = placeVisual(set, 'b', { lane: 2, beat: 16, beats: 4 })
    expect(visualById(placed, 'b')).toMatchObject({ stroke: null, lane: 2, beat: 16, beats: 4 })
    expect(visualById(placeVisual(set, 'b', {}), 'b')?.stroke).toBeNull()
  })

  it('links a visual to a stroke, as the kind it is and with the knobs it has', () => {
    const linked = linkVisual(set, 'a', 'stroke-2')
    expect(visualById(linked, 'a')).toMatchObject({ stroke: 'stroke-2', kind: 'star' })
    expect(visualById(linked, 'a')?.knobs).toBe(set.list[0].knobs)
    expect(visualById(linkVisual(set, 'b', 'stroke-2'), 'b')?.stroke).toBe('stroke-2')
  })

  it('removes a visual and keeps the others in their order', () => {
    expect(ids(removeVisual(set, 'b'))).toEqual(['a', 'c'])
    expect(ids(removeVisual(removeVisual(set, 'a'), 'c'))).toEqual(['b'])
  })

  it('drops the visuals linked to a stroke that is no longer there', () => {
    const two = setOf(...set.list, visual('d', 'pond', { stroke: 'stroke-2' }))
    expect(ids(withoutLostVisuals(two, new Set(['stroke-1'])))).toEqual(['a', 'b', 'c'])
    expect(ids(withoutLostVisuals(two, new Set()))).toEqual(['a', 'c'])
  })
})

describe('carrying a link over a change of the strokes', () => {
  const stroke = (
    id: string,
    sampleId: number,
    startSec: number,
    durationSec: number,
  ): LinkedStroke => ({
    id,
    sampleId,
    startSec,
    durationSec,
  })
  const before = [stroke('s1', 7, 4, 8), stroke('s2', 9, 0, 4)]
  const set = setOf(
    visual('placed', 'star', { lane: 1 }),
    visual('linked', 'meadow', { stroke: 's1' }),
  )

  it('is the same set when no visual is linked', () => {
    const placed = setOf(visual('a', 'star'), visual('b', 'trails'))
    expect(carryVisualLinks(placed, before, [])).toBe(placed)
    expect(carryVisualLinks(emptyVisualSet(), before, [])).toBe(emptyVisualSet())
  })

  it('is the same set when every linked stroke is still there', () => {
    expect(carryVisualLinks(set, before, before)).toBe(set)
    // Moved, cut short or of another sound, it is the same stroke while it keeps its id.
    expect(carryVisualLinks(set, before, [stroke('s1', 3, 20, 1)])).toBe(set)
  })

  it('drops a visual whose stroke is gone with no new stroke of that sound', () => {
    const carried = carryVisualLinks(set, before, [before[1]])
    expect(ids(carried)).toEqual(['placed'])
    expect(carried.list[0]).toBe(set.list[0])
    expect(ids(carryVisualLinks(set, before, []))).toEqual(['placed'])
  })

  it('moves the visual to the earliest part of a stroke that was cut in two', () => {
    const cut = [stroke('later', 7, 8, 4), stroke('earlier', 7, 4, 4), before[1]]
    const carried = carryVisualLinks(set, before, cut)
    expect(ids(carried)).toEqual(['placed', 'linked'])
    expect(visualById(carried, 'linked')).toEqual({ ...set.list[1], stroke: 'earlier' })
    expect(carried.list[0]).toBe(set.list[0])
    // The set handed in is as it was.
    expect(set.list[1].stroke).toBe('s1')
  })

  it('takes a new stroke that only partly lies where the old one lay', () => {
    const carried = carryVisualLinks(set, before, [stroke('new', 7, 11, 6)])
    expect(visualById(carried, 'linked')?.stroke).toBe('new')
    const early = carryVisualLinks(set, before, [stroke('new', 7, 0, 4.5)])
    expect(visualById(early, 'linked')?.stroke).toBe('new')
  })

  it('takes what is left of the stroke before a stroke laid over its start', () => {
    // Another stroke of the same sound was laid from 2 s to 7 s: what is left of the old one runs from 7 s to 12 s.
    const carried = carryVisualLinks(set, before, [
      stroke('laid-over', 7, 2, 5),
      stroke('left', 7, 7, 5),
      before[1],
    ])
    expect(visualById(carried, 'linked')?.stroke).toBe('left')
  })

  it('takes of two new strokes that both overrun where it lay the one that covers more of it', () => {
    const carried = carryVisualLinks(set, before, [
      stroke('little', 7, 2, 3),
      stroke('much', 7, 6, 8),
    ])
    expect(visualById(carried, 'linked')?.stroke).toBe('much')
  })

  it('does not take a new stroke of another sound', () => {
    expect(ids(carryVisualLinks(set, before, [stroke('new', 8, 4, 8)]))).toEqual(['placed'])
  })

  it('does not take a new stroke that lies somewhere else, or only touches where the old one lay', () => {
    expect(ids(carryVisualLinks(set, before, [stroke('new', 7, 20, 4)]))).toEqual(['placed'])
    expect(ids(carryVisualLinks(set, before, [stroke('new', 7, 12, 4)]))).toEqual(['placed'])
    expect(ids(carryVisualLinks(set, before, [stroke('new', 7, 0, 4)]))).toEqual(['placed'])
  })

  it('never takes a stroke that was there before', () => {
    const others = [stroke('s1', 7, 4, 8), stroke('old', 7, 4, 8)]
    // The old neighbour of the same sound in the same place is not an heir; a new one beside it is.
    expect(ids(carryVisualLinks(set, others, [others[1]]))).toEqual(['placed'])
    const carried = carryVisualLinks(set, others, [others[1], stroke('new', 7, 6, 2)])
    expect(visualById(carried, 'linked')?.stroke).toBe('new')
  })

  it('leaves a visual alone whose stroke was gone before the change', () => {
    // Taken out by a build that knows no visuals, or not here yet from another station: not this change's to drop.
    expect(carryVisualLinks(set, [before[1]], [stroke('new', 7, 4, 8)])).toBe(set)
    expect(carryVisualLinks(set, [before[1]], [])).toBe(set)
    // Beside one whose stroke this change does take away.
    const two = setOf(...set.list, visual('other', 'pond', { stroke: 's2' }))
    const carried = carryVisualLinks(two, [before[1]], [])
    expect(ids(carried)).toEqual(['placed', 'linked'])
    expect(visualById(carried, 'linked')?.stroke).toBe('s1')
  })

  it('carries each of several links for itself', () => {
    const three = setOf(
      visual('one', 'star', { stroke: 's1' }),
      visual('two', 'pond', { stroke: 's2' }),
      visual('also-one', 'trails', { stroke: 's1' }),
    )
    const carried = carryVisualLinks(three, before, [stroke('n1', 7, 4, 2), stroke('n2', 7, 6, 6)])
    expect(carried.list.map((item) => [item.id, item.stroke])).toEqual([
      ['one', 'n1'],
      ['also-one', 'n1'],
    ])
  })
})

describe('turning a knob', () => {
  const set = setOf(visual('a', 'star'), visual('b', 'trails'))

  it('sets where a knob stands, to the thousandth and between nothing and full', () => {
    const quarter = setVisualKnob(set, 'a', 'size', { value: 0.25 })
    expect(visualById(quarter, 'a')?.knobs.size).toEqual({ value: 0.25, follows: null })
    expect(
      visualById(setVisualKnob(set, 'a', 'size', { value: 0.33349 }), 'a')?.knobs.size.value,
    ).toBe(0.333)
    expect(visualById(setVisualKnob(set, 'a', 'size', { value: 2 }), 'a')?.knobs.size.value).toBe(1)
    expect(visualById(setVisualKnob(set, 'a', 'size', { value: -1 }), 'a')?.knobs.size.value).toBe(
      0,
    )
    expect(
      visualById(setVisualKnob(set, 'a', 'size', { value: Number.NaN }), 'a')?.knobs.size.value,
    ).toBe(0)
    expect(visualById(setVisualKnob(set, 'b', 'push', { value: 0.9 }), 'b')?.knobs.push.value).toBe(
      0.9,
    )
  })

  it('leaves what a knob follows as it is when only its value is set', () => {
    const turned = setVisualKnob(set, 'a', 'glow', { value: 0.2 })
    expect(visualById(turned, 'a')?.knobs.glow).toEqual({ value: 0.2, follows: 'energy' })
    // The other knobs and the other visual are the very same.
    expect(visualById(turned, 'a')?.knobs.size).toBe(set.list[0].knobs.size)
    expect(turned.list[1]).toBe(set.list[1])
    expect(set.list[0].knobs.glow.value).toBe(0.7)
  })

  it('sets what a knob follows, and lets it follow nothing', () => {
    const following = setVisualKnob(set, 'a', 'size', { follows: 'low' })
    expect(visualById(following, 'a')?.knobs.size).toEqual({ value: 0.5, follows: 'low' })
    const still = setVisualKnob(set, 'a', 'glow', { follows: null })
    expect(visualById(still, 'a')?.knobs.glow).toEqual({ value: 0.7, follows: null })
    const both = setVisualKnob(set, 'a', 'colour', { value: 0.1, follows: 'place' })
    expect(visualById(both, 'a')?.knobs.colour).toEqual({ value: 0.1, follows: 'place' })
    // Nothing named: nothing set.
    expect(visualById(setVisualKnob(set, 'a', 'glow', {}), 'a')?.knobs.glow).toEqual({
      value: 0.7,
      follows: 'energy',
    })
  })

  it('leaves a knob the kind does not have alone', () => {
    const turned = setVisualKnob(set, 'a', 'length', { value: 0.1 })
    expect(turned.list[0]).toBe(set.list[0])
    expect(sameVisualSet(turned, set)).toBe(true)
    expect(setVisualKnob(set, 'b', 'level', { value: 0.1 }).list[1]).toBe(set.list[1])
  })
})

describe('changing what a visual is', () => {
  const turned = { ...firstKnobs('star'), size: { value: 0.8, follows: 'low' as const } }
  const set = setOf(
    visual('a', 'star', { variation: 1, lane: 2, beat: 4, beats: 8, knobs: turned }),
    visual('b', 'trails', { stroke: 'stroke-1' }),
  )

  it('draws a style in its other variation', () => {
    expect(visualById(setVisualVariation(set, 'a', 0), 'a')?.variation).toBe(0)
    expect(
      visualById(setVisualVariation(setVisualVariation(set, 'a', 0), 'a', 1), 'a')?.variation,
    ).toBe(1)
  })

  it('gives a bend no variation', () => {
    const same = setVisualVariation(set, 'b', 1)
    expect(same.list[1]).toBe(set.list[1])
    expect(visualById(same, 'b')?.variation).toBe(0)
  })

  it('keeps the knobs, the variation and the place from one style to another', () => {
    const next = visualById(setVisualKind(set, 'a', 'meadow'), 'a')
    expect(next).toEqual({ ...set.list[0], kind: 'meadow' })
    expect(next?.knobs).toBe(turned)
  })

  it('starts the knobs anew from a style to a bend, and gives it no variation', () => {
    const next = visualById(setVisualKind(set, 'a', 'mirror'), 'a')
    expect(next).toEqual(visual('a', 'mirror', { lane: 2, beat: 4, beats: 8 }))
  })

  it('starts the knobs anew from a bend to a style or to another bend, and stays linked', () => {
    expect(visualById(setVisualKind(set, 'b', 'pond'), 'b')).toEqual(
      visual('b', 'pond', { stroke: 'stroke-1' }),
    )
    expect(visualById(setVisualKind(set, 'b', 'spin'), 'b')).toEqual(
      visual('b', 'spin', { stroke: 'stroke-1' }),
    )
  })

  it('leaves a visual as it is for the kind it has already', () => {
    expect(setVisualKind(set, 'a', 'star').list[0]).toBe(set.list[0])
  })

  it('sets the palette and the grain that lie over all of them', () => {
    expect(setVisualPalette(set, 'sea')).toEqual({ ...set, palette: 'sea' })
    expect(setVisualPalette(set, 'sea').list).toBe(set.list)
    expect(setVisualGrain(set, 0.2)).toEqual({ ...set, grain: 0.2 })
    expect(setVisualGrain(set, 0.33349).grain).toBe(0.333)
    expect(setVisualGrain(set, 4).grain).toBe(1)
    expect(setVisualGrain(set, -4).grain).toBe(0)
    expect(setVisualGrain(set, Number.NaN).grain).toBe(0)
  })
})

describe('an edit that changes nothing', () => {
  const set = setOf(
    visual('a', 'star', { lane: 1, beat: 4, beats: 8 }),
    visual('b', 'trails', { stroke: 'stroke-1' }),
  )

  it('hands back the same set for a visual that is not there', () => {
    expect(placeVisual(set, 'nobody', { lane: 2 })).toBe(set)
    expect(linkVisual(set, 'nobody', 'stroke-1')).toBe(set)
    expect(removeVisual(set, 'nobody')).toBe(set)
    expect(setVisualKnob(set, 'nobody', 'size', { value: 0.1 })).toBe(set)
    expect(setVisualVariation(set, 'nobody', 1)).toBe(set)
    expect(setVisualKind(set, 'nobody', 'meadow')).toBe(set)
  })

  it('hands back the same set for a kind or a palette it does not have', () => {
    expect(setVisualKind(set, 'a', 'later-kind')).toBe(set)
    expect(setVisualPalette(set, 'no-such-palette')).toBe(set)
  })

  it('hands back the same set for the palette and the grain it has already', () => {
    expect(setVisualPalette(set, DEFAULT_PALETTE)).toBe(set)
    expect(setVisualGrain(set, DEFAULT_GRAIN)).toBe(set)
    expect(setVisualGrain(set, DEFAULT_GRAIN + 0.0001)).toBe(set)
  })

  it('hands back the same set when no linked stroke was lost', () => {
    expect(withoutLostVisuals(set, new Set(['stroke-1', 'stroke-2']))).toBe(set)
    expect(withoutLostVisuals(emptyVisualSet(), new Set())).toBe(emptyVisualSet())
  })
})

describe('the order the visuals are drawn in', () => {
  it('goes row by row from the top, and keeps the order of one row', () => {
    const set = setOf(
      visual('low', 'star', { lane: 3 }),
      visual('top', 'meadow', { lane: 0 }),
      visual('mid-1', 'pond', { lane: 1 }),
      visual('mid-2', 'dusk', { lane: 1 }),
    )
    expect(drawOrder(set).map((item) => item.id)).toEqual(['top', 'mid-1', 'mid-2', 'low'])
    // The list itself stays as it was.
    expect(ids(set)).toEqual(['low', 'top', 'mid-1', 'mid-2'])
  })

  it('draws what paints before what bends, whatever their rows', () => {
    const set = setOf(
      visual('bend-top', 'trails', { lane: 0 }),
      visual('paint-low', 'star', { lane: 3 }),
      visual('bend-low', 'mirror', { lane: 2 }),
      visual('paint-top', 'meadow', { lane: 1 }),
      visual('later', 'later-kind', { lane: 0 }),
    )
    expect(drawOrder(set).map((item) => item.id)).toEqual([
      'paint-top',
      'paint-low',
      'bend-top',
      'later',
      'bend-low',
    ])
  })

  it('is empty for no visuals', () => {
    expect(drawOrder(emptyVisualSet())).toEqual([])
  })
})

describe('finding and naming a visual', () => {
  const set = setOf(
    visual('a', 'star'),
    visual('b', 'star', { variation: 1 }),
    visual('c', 'grain'),
    visual('d', 'later-kind'),
  )

  it('numbers the visuals from one, and gives none to one that is not among them', () => {
    expect(visualNumber(set, 'a')).toBe(1)
    expect(visualNumber(set, 'c')).toBe(3)
    expect(visualNumber(set, 'nobody')).toBe(0)
  })

  it('finds a visual by its number', () => {
    expect(visualByNumber(set, 1)).toBe(set.list[0])
    expect(visualByNumber(set, 4)).toBe(set.list[3])
    expect(visualByNumber(set, 0)).toBeNull()
    expect(visualByNumber(set, 5)).toBeNull()
    expect(visualByNumber(set, -1)).toBeNull()
    expect(visualByNumber(set, 1.5)).toBeNull()
    expect(visualByNumber(set, Number.NaN)).toBeNull()
  })

  it('finds a visual by its id', () => {
    expect(visualById(set, 'b')).toBe(set.list[1])
    expect(visualById(set, 'nobody')).toBeNull()
    expect(visualById(set, null)).toBeNull()
  })

  it('calls a visual by its kind, with a b for a second variation', () => {
    expect(visualLabel(set.list[0])).toBe('Star')
    expect(visualLabel(set.list[1])).toBe('Star b')
    expect(visualLabel(set.list[2])).toBe('More grain')
    expect(visualLabel(set.list[3])).toBe('later-kind')
    // A bend has no second variation to name.
    expect(visualLabel(visual('e', 'spin', { variation: 1 }))).toBe('Spin')
  })
})
