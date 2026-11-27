import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { VISUAL_GROUPS, VISUAL_STYLES, visualStyle } from '../styles'

const SHADERS = join(dirname(fileURLToPath(import.meta.url)), '..', 'shaders')

/** The ids the folder has a shader for. */
const shaderIds = readdirSync(SHADERS)
  .filter((name) => name.endsWith('.glsl'))
  .map((name) => name.slice(0, -'.glsl'.length))
  .sort()

const textOf = (id: string): string => readFileSync(join(SHADERS, `${id}.glsl`), 'utf8')

/** The words a shader opens with: its first comment lines, each `// key: words`. */
function headerOf(text: string): Record<string, string> {
  const header: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const found = /^\/\/\s*([a-z]+):(.*)$/.exec(line)
    if (!found) break
    // What each of its own numbers does (`world.ts`) is said to whoever writes a preset, not in the list.
    if (found[1] !== 'own') header[found[1]] = found[2].trim()
  }
  return header
}

/** Drawn since before this was held, with the edges of a soft step the other way round, and left as they are drawn. */
const TURNED_STEPS = `
  black-hole clouds colour-field crystal-hall curtains daylight-smoke dot-globe dot-screen dot-tunnel dot-wall
  dusk flowers folded-stone grid-land hills leaf light-tunnel liquid-metal lit-cloud meadow melt moire night-sea
  pin-relief pond press prism ribbons ripples silk soft-lights still-life strung-form sunflower
`
  .trim()
  .split(/\s+/)

describe('the list of styles', () => {
  it('has two hundred and forty-one styles', () => {
    expect(VISUAL_STYLES).toHaveLength(241)
  })

  it('gives each style an id of its own, in lowercase with dashes', () => {
    const ids = VISUAL_STYLES.map((style) => style.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]{0,39}$/)
  })

  it('uses no name twice, for a style or for a variation', () => {
    const names = VISUAL_STYLES.flatMap((style) => [style.name, ...style.variations]).map((name) =>
      name.trim().toLowerCase(),
    )
    const twice = names.filter((name, index) => names.indexOf(name) !== index)
    expect(twice).toEqual([])
    for (const name of names) expect(name).not.toBe('')
  })

  it('puts each style in one of the groups, and leaves no group empty', () => {
    const groups = VISUAL_GROUPS.map((group) => group.id)
    expect(new Set(groups).size).toBe(groups.length)
    for (const style of VISUAL_STYLES) expect(groups, style.id).toContain(style.group)
    for (const group of groups)
      expect(
        VISUAL_STYLES.some((style) => style.group === group),
        group,
      ).toBe(true)
  })

  it('says what each style is and what it follows', () => {
    for (const style of VISUAL_STYLES) {
      expect(style.what.trim(), style.id).not.toBe('')
      expect(style.follows.trim(), style.id).not.toBe('')
      expect(style.variations, style.id).toHaveLength(2)
    }
  })

  it('finds a style by its id, and none for an id it does not have', () => {
    expect(visualStyle('dot-screen')).toBe(VISUAL_STYLES[0])
    expect(visualStyle('trails')).toBeUndefined()
    expect(visualStyle('no-such-style')).toBeUndefined()
    expect(visualStyle('')).toBeUndefined()
  })
})

describe('the shaders', () => {
  it('has a shader for every style and a style for every shader', () => {
    expect(shaderIds).toEqual(VISUAL_STYLES.map((style) => style.id).sort())
  })

  it('opens each shader with the words the list has for it', () => {
    const written = Object.fromEntries(shaderIds.map((id) => [id, headerOf(textOf(id))]))
    const listed = Object.fromEntries(
      VISUAL_STYLES.map((style) => [
        style.id,
        {
          name: style.name.trim(),
          a: style.variations[0].trim(),
          b: style.variations[1].trim(),
          what: style.what.trim(),
          follows: style.follows.trim(),
        },
      ]),
    )
    expect(written).toEqual(listed)
  })

  // GLSL leaves `smoothstep` undefined where its first edge is not the lower one. Software rendering works it out all the
  // same, and what a graphics card or a compiler that folds it does is its own affair.
  it('writes no soft step with its edges the wrong way round', () => {
    const NUMBER = String.raw`\s*(-?\d*\.?\d+\.?|-?\d+\.)\s*`
    const step = new RegExp(String.raw`\bsmoothstep\(${NUMBER},${NUMBER},`, 'g')
    const turned = shaderIds.filter((id) =>
      [...textOf(id).matchAll(step)].some((found) => Number(found[1]) >= Number(found[2])),
    )
    expect(turned).toEqual(TURNED_STEPS)
  })

  it('has the function that draws the picture in every shader', () => {
    for (const id of shaderIds) expect(textOf(id), id).toContain('vec3 render(vec2 p)')
  })
})
