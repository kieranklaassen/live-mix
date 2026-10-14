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
    header[found[1]] = found[2].trim()
  }
  return header
}

describe('the list of styles', () => {
  it('has forty styles', () => {
    expect(VISUAL_STYLES).toHaveLength(40)
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

  it('has the function that draws the picture in every shader', () => {
    for (const id of shaderIds) expect(textOf(id), id).toContain('vec3 render(vec2 p)')
  })
})
