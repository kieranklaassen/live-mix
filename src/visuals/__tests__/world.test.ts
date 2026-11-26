import { describe, expect, it } from 'vitest'

import { frameOf, quietSignals, sampleFrame } from '../frame'
import {
  addVisual,
  emptyVisualSet,
  setVisualKind,
  setVisualPreset,
  visualLabel,
  visualsFromJson,
  visualsToJson,
} from '../model'
import { visualPalette } from '../palettes'
import type { VisualPreset } from '../preset'
import { worldKinds, worldMap, worldSignals, worldUniforms } from '../world'

const FROZEN: VisualPreset = {
  id: 'frozen-bay',
  name: 'Frozen bay',
  what: 'The bay under ice.',
  variation: 1,
  size: 0.3,
  glow: [0.4, 'low'],
  world: { own: [0.5, -1, 3], pace: 0.5, answer: 1.5 },
}

describe('a preset of a visual', () => {
  it('is added with its variation, its knobs and its id, and Level is left alone', () => {
    const { set, visual } = addVisual(emptyVisualSet(), 'melt', {}, 0, FROZEN)
    expect(visual).toMatchObject({ kind: 'melt', variation: 1, preset: 'frozen-bay' })
    expect(visual?.knobs).toEqual({
      level: { value: 0.9, follows: null },
      size: { value: 0.3, follows: null },
      glow: { value: 0.4, follows: 'low' },
      colour: { value: 0.5, follows: null },
    })
    expect(visual && visualLabel(visual)).toBe('Melt: Frozen bay')
    expect(visualsFromJson(visualsToJson(set))).toEqual(set)
  })

  it('is put on, and comes off to the style as it draws itself', () => {
    const plain = addVisual(emptyVisualSet(), 'melt')
    const id = plain.visual?.id ?? ''
    const on = setVisualPreset(plain.set, id, FROZEN)
    expect(on.list[0]).toMatchObject({ preset: 'frozen-bay', variation: 1 })
    const off = setVisualPreset(on, id, null)
    expect(off.list[0]).toEqual({ ...plain.set.list[0], variation: 1 })
    expect('preset' in off.list[0]).toBe(false)
    expect(setVisualPreset(plain.set, id, null)).toBe(plain.set)
  })

  it('is none for a bend, and comes off with another kind', () => {
    const bend = addVisual(emptyVisualSet(), 'mirror', {}, 0, FROZEN)
    expect(bend.visual?.preset).toBeUndefined()
    const on = addVisual(emptyVisualSet(), 'melt', {}, 0, FROZEN)
    const other = setVisualKind(on.set, on.visual?.id ?? '', 'dusk')
    expect('preset' in other.list[0]).toBe(false)
  })

  it('is written only where there is one, and one of a later build is kept', () => {
    const { set } = addVisual(emptyVisualSet(), 'melt')
    expect(JSON.stringify(visualsToJson(set))).not.toContain('preset')
    const json = { list: [{ id: 'visual-1', kind: 'melt', preset: 'of-a-later-build' }] }
    expect(visualsToJson(visualsFromJson(json))).toMatchObject(json)
    for (const preset of ['', 'Not An Id', 4, null])
      expect(
        visualsFromJson({ list: [{ id: 'visual-1', kind: 'melt', preset }] }).list[0],
      ).not.toHaveProperty('preset')
  })

  it('is handed to the screen by its id, and no visual without one has the field', () => {
    const { set } = addVisual(addVisual(emptyVisualSet(), 'dusk').set, 'melt', {}, 0, FROZEN)
    const { layers } = frameOf(set, quietSignals(), 0, new Map())
    expect(layers[0]).not.toHaveProperty('preset')
    expect(layers[1]).toMatchObject({ paint: 'melt', preset: 'frozen-bay', size: 0.3 })
  })

  it('is looked at alone with its own knobs', () => {
    const palette = visualPalette('soft')
    const sample = sampleFrame('melt', 1, quietSignals(), palette, 0, FROZEN).layers[0]
    expect(sample).toMatchObject({ preset: 'frozen-bay', size: 0.3, glow: 0.4 * 0.15 })
    const plain = sampleFrame('melt', 0, quietSignals(), palette, 0).layers[0]
    expect(plain).toMatchObject({ size: 0.5, hue: 0, level: 1 })
    expect(plain).not.toHaveProperty('preset')
  })
})

describe('a world', () => {
  it('is handed to a shader with its own numbers held to their range and the rest at rest', () => {
    const as = worldUniforms(FROZEN.world)
    expect([...as.own]).toEqual([0.5, -1, 1, 0, 0, 0, 0, 0])
    expect(as).toMatchObject({
      stand: [0, 0, 0, 1],
      bend: [0, 0, 0],
      toned: 0,
      touch: [0, 0, 0, 0],
      mist: [0, 0, 0, 0],
      from: 0,
      edge: 0,
    })
    expect(worldUniforms(FROZEN.world)).toBe(as)
  })

  it('moves the clock and the levels, and never past what they can be', () => {
    const signals = { ...quietSignals(), time: 10, travel: 4, pad: 0.9, hits: 0.4, space: 0.9 }
    signals.bands.fill(0.8)
    const bands = new Float32Array(16)
    const moved = worldSignals({ ...FROZEN.world, space: 0.5 }, signals, bands)
    expect(moved).toMatchObject({ time: 5, travel: 2, pad: 1, space: 1 })
    expect(moved.hits).toBeCloseTo(0.6)
    expect(moved.bands[3]).toBe(1)
    expect(signals.bands[3]).toBeCloseTo(0.8)
  })

  it('gives the kinds its own colours and the piece with them', () => {
    const was = quietSignals().kindColours
    was.set([1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1])
    const now = new Float32Array(15)
    worldKinds(
      { kinds: ['#000000', '#0000ff', '#00ff00', '#ffffff', '#ff0000'], keep: 0 },
      was,
      now,
    )
    expect([...now.slice(0, 6)]).toEqual([0, 0, 0, 0, 0, 1])
    const map = quietSignals().map
    map.set([0, 200, 0, 200], 0)
    const into = new Uint8Array(map.length)
    worldMap(map, was, now, into)
    expect(into[2]).toBeGreaterThan(195)
    expect(into[1]).toBeLessThan(5)
    expect(into[3]).toBe(200)
    expect([...into.slice(4, 8)]).toEqual([0, 0, 0, 0])
  })
})
