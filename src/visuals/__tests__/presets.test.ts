import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { isVisualSource, STYLE_KNOBS } from '../model'
import { PRESET_ID, presetKnob, presetName, type VisualPreset } from '../preset'
import { PRESET_SOURCES } from '../preset-sources'
import { PRESET_WORDS } from '../preset-words'
import { loadPresetWords, loadVisualPresets, visualPresetNow } from '../presets'
import { VISUAL_STYLES, visualStyle } from '../styles'
import { OWN_SLOTS, WORLD_RANGES } from '../world'

const HERE = dirname(fileURLToPath(import.meta.url))
const PRESETS = join(HERE, '..', 'presets')
const SHADERS = join(HERE, '..', 'shaders')

const styles = (existsSync(PRESETS) ? readdirSync(PRESETS) : [])
  .filter((name) => name.endsWith('.ts'))
  .map((name) => name.slice(0, -'.ts'.length))
  .sort()
const all: { style: string; presets: readonly VisualPreset[] }[] = []
for (const style of styles) all.push({ style, presets: await loadVisualPresets(style) })
const each = all.flatMap(({ style, presets }) => presets.map((preset) => ({ style, preset })))

const COLOUR = /^#[0-9a-f]{6}$/
const WORLD_KEYS = new Set([...Object.keys(WORLD_RANGES), 'own', 'kinds', 'tones', 'at', 'mist'])

describe('the presets', () => {
  it('are of styles there are, and are listed once for each file', () => {
    for (const style of styles) expect(visualStyle(style), style).toBeDefined()
    expect(Object.keys(PRESET_SOURCES).sort()).toEqual(styles)
    expect(Object.keys(PRESET_WORDS).sort()).toEqual(styles)
  })

  it('have a name of their own across every style, which is their id in words', () => {
    const taken = new Map<string, string>()
    for (const style of VISUAL_STYLES)
      for (const name of [style.name, ...style.variations])
        taken.set(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), style.id)
    const twice: string[] = []
    for (const { style, preset } of each) {
      const where = `${style}/${preset.id}`
      expect(preset.id, where).toMatch(PRESET_ID)
      expect(preset.name, where).toBe(presetName(preset.id))
      if (taken.has(preset.id)) twice.push(`${where} and ${taken.get(preset.id)}`)
      taken.set(preset.id, style)
    }
    expect(twice).toEqual([])
  })

  it('are about ten for a style, of both variations', () => {
    for (const { style, presets } of all) {
      expect(presets.length, style).toBeGreaterThanOrEqual(8)
      expect(presets.length, style).toBeLessThanOrEqual(12)
      for (const variation of [0, 1])
        expect(
          presets.filter((preset) => preset.variation === variation).length,
          `${style} ${'ab'[variation]}`,
        ).toBeGreaterThanOrEqual(3)
    }
  })

  it('say what is seen in a sentence', () => {
    for (const { style, preset } of each) {
      const where = `${style}/${preset.id}`
      expect(preset.what.length, where).toBeGreaterThan(15)
      expect(preset.what.length, where).toBeLessThanOrEqual(120)
      expect(preset.what, where).toMatch(/^[A-Z0-9][\x20-\x7e]*\.$/)
    }
  })

  it('put knobs where a knob can stand', () => {
    for (const { style, preset } of each)
      for (const knob of ['size', 'glow', 'colour'] as const) {
        const put = preset[knob]
        if (put === undefined) continue
        const { value, follows } = presetKnob(put)
        expect(value, `${style}/${preset.id} ${knob}`).toBeGreaterThanOrEqual(0)
        expect(value, `${style}/${preset.id} ${knob}`).toBeLessThanOrEqual(1)
        // A visual that is not linked to a stroke has none to follow.
        if (follows !== null) expect(isVisualSource(follows) && follows !== 'stroke').toBe(true)
      }
    expect(STYLE_KNOBS.map((knob) => knob.id)).toEqual(['level', 'size', 'glow', 'colour'])
  })

  it('are drawn in worlds within their ranges', () => {
    for (const { style, preset } of each) {
      const where = `${style}/${preset.id}`
      const world = preset.world as Record<string, unknown>
      for (const key of Object.keys(world))
        expect(WORLD_KEYS.has(key), `${where} ${key}`).toBe(true)
      for (const [key, [least, most]] of Object.entries(WORLD_RANGES)) {
        if (world[key] === undefined) continue
        expect(world[key], `${where} ${key}`).toBeGreaterThanOrEqual(least)
        expect(world[key], `${where} ${key}`).toBeLessThanOrEqual(most)
      }
      const { own, kinds, tones, at, mist } = preset.world
      for (const colour of [...(kinds ?? []), ...(tones ?? []), ...(mist ? [mist] : [])])
        expect(colour, where).toMatch(COLOUR)
      if (kinds) expect(kinds, where).toHaveLength(5)
      if (tones) expect(tones, where).toHaveLength(3)
      if (at) for (const along of at) expect(Math.abs(along), where).toBeLessThanOrEqual(2)
      if (own) {
        expect(own.length, where).toBeLessThanOrEqual(OWN_SLOTS)
        for (const value of own) expect(Math.abs(value), where).toBeLessThanOrEqual(1)
      }
    }
  })

  it('give a style only the numbers it reads', () => {
    for (const { style, presets } of all) {
      const text = readFileSync(join(SHADERS, `${style}.glsl`), 'utf8')
      const read = new Set([...text.matchAll(/uOwn\[(\d)\]/g)].map((found) => Number(found[1])))
      for (const preset of presets)
        preset.world.own?.forEach((value, slot) => {
          if (value !== 0) expect(read.has(slot), `${style}/${preset.id} own ${slot}`).toBe(true)
        })
      if (read.size > 0) expect(text, style).toMatch(/^\/\/ own: \S/m)
    }
  })

  it('read their own numbers by a plain number only, as they are written into the shader', () => {
    for (const { style } of all)
      expect(readFileSync(join(SHADERS, `${style}.glsl`), 'utf8'), style).not.toMatch(
        /\buOwn(?!\[[0-7]\])/,
      )
  })

  it('are listed with their words as they are written', async () => {
    const words = await loadPresetWords()
    expect(words).toEqual(
      each.map(({ style, preset: { id, name, what, variation } }) => ({
        style,
        id,
        name,
        what,
        variation,
      })),
    )
  })

  it('are found once loaded, and a preset there is not is none', () => {
    for (const { style, preset } of each) expect(visualPresetNow(style, preset.id)).toBe(preset)
    if (all.length > 0) expect(visualPresetNow(all[0].style, 'no-such-preset')).toBeNull()
    expect(visualPresetNow('no-such-style', 'any')).toBeNull()
  })
})

// A piece keeps a preset by its id. Once it has shipped it is drawn as it was: to change one, give the new picture an
// id of its own. `UPDATE_SHIPPED_VISUAL_PRESETS=1 npx vitest run src/visuals/__tests__/presets.test.ts` adds the
// ones that are new and never changes one.
describe('the presets that have shipped', () => {
  const FILE = join(HERE, 'shipped-visual-presets.json')
  const shipped: Record<string, string> = existsSync(FILE)
    ? (JSON.parse(readFileSync(FILE, 'utf8')) as Record<string, string>)
    : {}
  const printOf = (preset: VisualPreset): string =>
    createHash('sha256')
      .update(
        JSON.stringify([
          preset.variation,
          preset.size ?? null,
          preset.glow ?? null,
          preset.colour ?? null,
          Object.entries(preset.world).sort(([a], [b]) => (a < b ? -1 : 1)),
        ]),
      )
      .digest('hex')
      .slice(0, 12)
  const now = Object.fromEntries(
    each.map(({ style, preset }) => [`${style}/${preset.id}`, printOf(preset)]),
  )

  it('are all there still, as they were', () => {
    if (process.env.UPDATE_SHIPPED_VISUAL_PRESETS)
      writeFileSync(FILE, `${JSON.stringify({ ...now, ...shipped }, null, 2)}\n`)
    for (const [id, print] of Object.entries(shipped)) expect(now[id], id).toBe(print)
  })

  it('has every preset there is', () => {
    if (process.env.UPDATE_SHIPPED_VISUAL_PRESETS) return
    expect(Object.keys(now).filter((id) => !(id in shipped))).toEqual([])
  })
})
