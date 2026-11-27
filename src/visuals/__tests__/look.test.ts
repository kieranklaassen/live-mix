import { describe, expect, it } from 'vitest'

import {
  addVisual,
  cleanWorld,
  emptyVisualSet,
  frameOf,
  loadVisualPresets,
  lookFrom,
  lookNamed,
  lookWords,
  quietSignals,
  sampleFrame,
  setVisualKind,
  setVisualPreset,
  setVisualVariation,
  variedLook,
  visualLabel,
  visualLook,
  visualPalette,
  visualsFromJson,
  visualsToJson,
  VISUAL_STYLES,
  WORLD_RANGES,
  OWN_SLOTS,
  type VisualLook,
  type VisualPreset,
} from '../index'
import { colourOf, tintOf, turned } from '../tint'
import { standInSignals } from '../stand-in'
import { lookFault, measurePicture, pictureColour, picturesApart } from '../proof'
import { colourWord, lookName } from '../vary'

/** Chance that is the same every time. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

const LOOK: VisualLook = {
  variation: 1,
  size: 0.4,
  glow: [0.6, 'low'],
  world: { own: [0, 0.5, -0.25], kinds: ['#112233', '#223344', '#334455', '#445566', '#556677'] },
  called: 'Rose drift',
  from: 'some-preset',
}

const withLook = (look: VisualLook | null = LOOK) => {
  const set = addVisual(emptyVisualSet(), 'star', { beat: 0 }, 0, look).set
  return { set, visual: set.list[0] }
}

describe('a world that was kept or handed over', () => {
  it('is read with each number in its range and what is not of a world left out', () => {
    const world = cleanWorld({
      own: [2, -3, 'x', 0.12345, 0, 0, 0, 0, 0.5],
      kinds: ['#AABBCC', '#000000', '#000000', '#000000', '#000000'],
      tones: ['#000000', 'red', '#ffffff'],
      mist: '#ABCDEF',
      at: [5, -0.1234],
      pace: 99,
      near: Number.NaN,
      light: '1',
      toString: 4,
      other: 1,
    })

    expect(world).toEqual({
      own: [1, -1, 0, 0.123],
      kinds: ['#aabbcc', '#000000', '#000000', '#000000', '#000000'],
      mist: '#abcdef',
      at: [2, -0.123],
      pace: 3,
    })
  })

  it('is empty where there is none', () => {
    for (const value of [null, undefined, 3, 'x', [], {}]) expect(cleanWorld(value)).toEqual({})
  })

  it('is written the same however often it is read', async () => {
    for (const { world } of await loadVisualPresets('star'))
      expect(cleanWorld(cleanWorld(world))).toEqual(cleanWorld(world))
  })
})

describe('a visual in a look of its own', () => {
  it('carries the look by value, with the preset it is a variation of', () => {
    const { visual } = withLook()

    expect(visual).toMatchObject({
      variation: 1,
      preset: 'some-preset',
      world: LOOK.world,
      called: 'Rose drift',
    })
    expect(visual.knobs.size).toEqual({ value: 0.4, follows: null })
    expect(visual.knobs.glow).toEqual({ value: 0.6, follows: 'low' })
    expect(visualLabel(visual)).toMatch(/: Rose drift/)
  })

  it('is kept with the piece, and read again as it was', () => {
    const { set } = withLook()
    const json = visualsToJson(set)

    expect(visualsFromJson(JSON.parse(JSON.stringify(json)))).toEqual(set)
  })

  it('writes nothing of a look where a visual has none', () => {
    const { set } = withLook(null)
    const text = JSON.stringify(visualsToJson(set))

    expect(text).not.toMatch(/world|called|preset/)
  })

  it('is drawn in its own world and not in its preset', () => {
    const { set } = withLook()
    const layer = frameOf(set, quietSignals(), 0, new Map()).layers[0]

    expect(layer).toMatchObject({ paint: 'star', world: LOOK.world })
    expect(layer).not.toHaveProperty('preset')
  })

  it('loses it to a preset, to none, and to another kind, and keeps it through a variation', () => {
    const { set, visual } = withLook()
    const preset: VisualPreset = {
      id: 'another-one',
      name: 'Another one',
      what: 'What is seen.',
      variation: 0,
      world: { pace: 0.5 },
    }
    const bare = (next: typeof set) => {
      expect(next.list[0]).not.toHaveProperty('world')
      expect(next.list[0]).not.toHaveProperty('called')
      return next.list[0]
    }

    expect(bare(setVisualPreset(set, visual.id, preset)).preset).toBe('another-one')
    expect(bare(setVisualPreset(set, visual.id, null))).not.toHaveProperty('preset')
    expect(bare(setVisualKind(set, visual.id, 'dot-globe'))).not.toHaveProperty('preset')
    expect(setVisualVariation(set, visual.id, 0).list[0].world).toEqual(LOOK.world)
  })

  it('comes off a look that is of no preset', () => {
    const { set, visual } = withLook({ variation: 0, world: { pace: 0.5 } })

    expect(visual).not.toHaveProperty('preset')
    expect(setVisualPreset(set, visual.id, null).list[0]).not.toHaveProperty('world')
  })

  it('reads a damaged one as the visual it is, without it', () => {
    const { set, visual } = withLook(null)
    const json = visualsToJson(set) as unknown as { list: object[] }
    const read = (entry: object) =>
      visualsFromJson({ ...json, list: [{ ...json.list[0], ...entry }] }).list[0]

    for (const entry of [{ world: 4 }, { world: null }, { called: 'A name' }, { world: [] }])
      expect(read(entry)).toEqual(visual)
    expect(read({ world: { pace: 0.5 }, called: `  a\n  ${'b'.repeat(80)}` }).called).toHaveLength(
      40,
    )
  })

  it('is taken off a visual to be put on others', () => {
    const { visual } = withLook()
    expect(visualLook(visual)).toMatchObject({ ...LOOK, size: 0.4 })

    const put = addVisual(emptyVisualSet(), 'star', { beat: 8 }, 0, visualLook(visual)).set
    expect(put.list[0]).toMatchObject({ world: visual.world, called: 'Rose drift' })
  })

  it('is taken off a visual in a preset with the preset, and one that follows its stroke stands still', async () => {
    const [preset] = await loadVisualPresets('star')
    const set = addVisual(emptyVisualSet(), 'star', { beat: 0 }, 0, preset).set
    const visual = {
      ...set.list[0],
      knobs: { ...set.list[0].knobs, size: { value: 0.3, follows: 'stroke' as const } },
    }
    const look = visualLook(visual, preset)

    expect(look).toMatchObject({
      variation: preset.variation,
      size: 0.3,
      from: preset.id,
      world: cleanWorld(preset.world),
    })
    expect(visualLook({ ...visual, kind: 'trails' })).toBeNull()
  })

  it('is shown alone as a preset is', () => {
    const { layers } = sampleFrame('star', 0, quietSignals(), visualPalette('kinds'), 0, LOOK)

    expect(layers[0]).toMatchObject({ world: LOOK.world, size: 0.4 })
  })
})

describe('a look kept outside a piece', () => {
  it('is read as it was written, with what is not of a look left out', () => {
    expect(lookFrom(JSON.parse(JSON.stringify({ ...LOOK, other: 1 })))).toEqual(LOOK)
  })

  it('is none where it has no world, and loses what is damaged', () => {
    for (const value of [null, 1, [], {}, { world: 3 }, { variation: 1 }])
      expect(lookFrom(value)).toBeNull()
    expect(
      lookFrom({
        world: {},
        variation: 7,
        size: 'x',
        glow: [1],
        colour: [0.2, 'stroke'],
        from: 'A B',
      }),
    ).toEqual({ world: {}, variation: 0 })
  })

  it('has a name no longer than a name is', () => {
    expect(lookNamed('  a   b ')).toBe('a b')
    expect(lookNamed('x'.repeat(99))).toHaveLength(40)
  })
})

describe('a colour as the eye sees it', () => {
  it('comes back as it was', () => {
    for (const colour of ['#000000', '#ffffff', '#e63946', '#1a7f5c', '#777777'])
      expect(colourOf(tintOf(colour))).toBe(colour)
  })

  it('keeps how light it is when its hue is turned, and stays one a screen can show', () => {
    for (let turn = 0; turn < 1; turn += 0.1) {
      const next = turned('#e63946', turn, 1.2)
      expect(next).toMatch(/^#[0-9a-f]{6}$/)
      expect(tintOf(next).light).toBeCloseTo(tintOf('#e63946').light, 1)
    }
  })
})

describe('a look made by chance', () => {
  it('is in range, and of the style it was made from, for every style and many throws', async () => {
    const chance = seeded(7)
    for (const { id } of VISUAL_STYLES) {
      const presets = await loadVisualPresets(id)
      for (const base of [null, presets[0] ?? null, presets[5] ?? null]) {
        const look = variedLook({ base, variation: 1, presets }, chance)
        expect(look.variation, id).toBe(base ? base.variation : 1)
        expect(look.from, id).toBe(base?.id)
        expect(look.called, id).toMatch(/^[A-Z][a-z ]+$/)
        expect(cleanWorld(look.world), id).toEqual(look.world)
        expect(lookFrom(look), id).toEqual(look)
        expect(lookWords(look.world), id).toMatch(/^In .*\.$/)
        for (const [name, [least, most]] of Object.entries(WORLD_RANGES)) {
          const value = look.world[name as keyof typeof look.world]
          if (value !== undefined) {
            expect(value, `${id} ${name}`).toBeGreaterThanOrEqual(least)
            expect(value, `${id} ${name}`).toBeLessThanOrEqual(most)
          }
        }
      }
    }
  })

  it('moves two to four of a style’s own numbers toward those of another preset, and never past them', async () => {
    const presets = await loadVisualPresets('star')
    const base = presets[0]
    const chance = seeded(3)
    for (let time = 0; time < 40; time++) {
      const { own = [] } = variedLook({ base, variation: 0, presets }, chance).world
      let changed = 0
      for (let slot = 0; slot < OWN_SLOTS; slot++) {
        const was = base.world.own?.[slot] ?? 0
        const now = own[slot] ?? 0
        const all = presets.map((preset) => preset.world.own?.[slot] ?? 0)
        expect(now).toBeGreaterThanOrEqual(Math.min(...all) - 0.026)
        expect(now).toBeLessThanOrEqual(Math.max(...all) + 0.026)
        if (Math.abs(now - was) > 0.03) changed++
      }
      expect(changed).toBeLessThanOrEqual(4)
    }
  })

  it('leaves what is drawn as it is where it is asked to', async () => {
    const presets = await loadVisualPresets('star')
    const look = variedLook({ base: presets[2], variation: 0, presets }, seeded(1), false)

    expect(look.world.own).toEqual(cleanWorld(presets[2].world).own)
    expect(look.world).not.toEqual(cleanWorld(presets[2].world))
  })

  it('is another each time, and the same from the same chance', async () => {
    const presets = await loadVisualPresets('star')
    const from = { base: null, variation: 0 as const, presets }
    const all = Array.from({ length: 30 }, (_, seed) =>
      JSON.stringify(variedLook(from, seeded(seed))),
    )

    expect(new Set(all).size).toBe(30)
    expect(JSON.stringify(variedLook(from, seeded(4)))).toBe(all[4])
  })

  it('is made for a style that has no presets, in colours of its own', () => {
    const look = variedLook({ base: null, variation: 0, presets: [] }, seeded(9))

    expect(look.world.own).toBeUndefined()
    expect(look.world.kinds).toHaveLength(5)
  })

  it('is a variation of the same preset when it is made from a look', async () => {
    const presets = await loadVisualPresets('star')
    const first = variedLook({ base: presets[0], variation: 0, presets }, seeded(2))

    expect(variedLook({ base: first, variation: 0, presets }, seeded(5)).from).toBe(presets[0].id)
  })
})

describe('what a look is found to be', () => {
  const picture = (paint: (x: number, y: number) => number) => {
    const pixels = new Uint8ClampedArray(128 * 72 * 4)
    for (let y = 0; y < 72; y++)
      for (let x = 0; x < 128; x++)
        pixels.fill(paint(x, y), (y * 128 + x) * 4, (y * 128 + x) * 4 + 4)
    return [measurePicture(pixels, 128, 72)]
  }
  const ramp = picture((x) => x)
  const other = picture((_, y) => y * 2)

  it('has no fault where there is a picture unlike the one before', () => {
    expect(lookFault(other, ramp)).toBeNull()
    expect(lookFault(other, null)).toBeNull()
    expect(picturesApart(ramp[0], other[0])).toBeGreaterThan(0.05)
  })

  it('is black, burnt, flat, or the same', () => {
    expect(
      lookFault(
        picture(() => 4),
        ramp,
      ),
    ).toBe('black')
    expect(
      lookFault(
        picture((x) => (x < 90 ? 255 : x)),
        ramp,
      ),
    ).toBe('burnt')
    expect(
      lookFault(
        picture(() => 120),
        ramp,
      ),
    ).toBe('flat')
    expect(
      lookFault(
        picture((x) => x + 1),
        ramp,
      ),
    ).toBe('same')
  })

  it('is named by the colour it was seen in and by how it moves', () => {
    const pixels = new Uint8ClampedArray(128 * 72 * 4)
    for (let at = 0; at < pixels.length; at += 4) pixels.set([40, 90, 200, 255], at)
    const seen = pictureColour([measurePicture(pixels, 128, 72)])

    expect(colourWord(seen)).toMatch(/Cobalt|Azure|Indigo/)
    expect(lookName({ pace: 0.2 }, () => 0, seen)).toBe(`${colourWord(seen)} hush`)
    expect(lookName({}, () => 0)).toBe('Open drift')
    expect(colourWord('#808080')).toBe('Ash')
  })

  it('is looked at with a piece that always plays the same', () => {
    const [one, two] = [standInSignals(6.2), standInSignals(6.2)]

    expect(one.time).toBe(6.2)
    expect(one.pad).toBeGreaterThan(0.3)
    expect(Array.from(one.bands)).toEqual(Array.from(two.bands))
  })
})
