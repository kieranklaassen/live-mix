import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import * as visuals from '../index'
import { SHADER_COMMON, SHADER_FOOTER, SHADER_SOURCES } from '../shader-sources'
import { VISUAL_STYLES } from '../styles'

// The visuals entry stands beside the audio engine, not on it: a page that only
// draws takes it without the engine, and a host that only keeps a piece's
// visuals takes the model without a browser. So nothing in it may import from
// outside its folder but the JSON types, and loading it touches no `window`.
const FOLDER = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCES = readdirSync(FOLDER)
  .filter((name) => name.endsWith('.ts') && !name.endsWith('.d.ts'))
  .sort()
  .map((name) => ({ name, source: readFileSync(join(FOLDER, name), 'utf8') }))

/** The files that work on plain values alone: no browser, no clock of their own. */
const PLAIN = [
  'desk.ts',
  'feed.ts',
  'follow.ts',
  'frame.ts',
  'model.ts',
  'palettes.ts',
  'styles.ts',
]

describe('the visuals entry', () => {
  it('is read here whole', () => {
    expect(SOURCES.map(({ name }) => name)).toEqual([
      'desk.ts',
      'ear.ts',
      'feed.ts',
      'follow.ts',
      'frame.ts',
      'have.ts',
      'index.ts',
      'line.ts',
      'model.ts',
      'palettes.ts',
      'picture.ts',
      'rig.ts',
      'shader-sources.ts',
      'stage.ts',
      'styles.ts',
    ])
  })

  it('imports nothing from outside its folder but the JSON types', () => {
    const outside = SOURCES.flatMap(({ name, source }) =>
      [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)]
        .map((match) => ({ specifier: match[1], line: match[0] }))
        .filter(({ specifier }) => !/^\.\/(?:shaders\/)?[a-z0-9-]+(?:\.glsl)?$/.test(specifier))
        .map(({ specifier }) => `${name} imports ${specifier}`),
    )

    expect([...new Set(outside)]).toEqual(['model.ts imports ../core/json'])
    const model = SOURCES.find((file) => file.name === 'model.ts')?.source ?? ''
    expect(model).toMatch(/import type \{[^}]*\} from '\.\.\/core\/json'/)
  })

  it('names no browser type in the files that work on plain values', () => {
    const code = (source: string): string =>
      source
        .split('\n')
        .filter((line) => !/^\s*(?:\/\/|\/\*|\*)/.test(line))
        .join('\n')
    const named = SOURCES.filter(({ name }) => PLAIN.includes(name)).flatMap(({ name, source }) =>
      [
        ...code(source).matchAll(
          /\b(?:(?:document|window)\.|HTML\w+|WebGL\w+|AudioNode|AudioContext|BaseAudioContext|requestAnimationFrame)/g,
        ),
      ].map((match) => `${name} names ${match[0]}`),
    )

    expect(named).toEqual([])
  })

  it('is imported where there is no window, and says there that nothing can be drawn', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(visuals.visualsMayDraw()).toBe(false)
    expect(visuals.visualRig()).toBeNull()
    expect(visuals.visualsReady()).toBe(false)
  })
})

describe('the shader of each style', () => {
  const files = readdirSync(join(FOLDER, 'shaders'))
    .filter((name) => name.endsWith('.glsl'))
    .map((name) => name.slice(0, -'.glsl'.length))
    .sort()

  it('is listed once for each file, and for each style', () => {
    expect(Object.keys(SHADER_SOURCES).sort()).toEqual(files)
    expect(VISUAL_STYLES.map((style) => style.id).sort()).toEqual(files)
  })

  it('is loaded as the text of its file', async () => {
    for (const id of files) {
      expect(await SHADER_SOURCES[id](), id).toBe(
        readFileSync(join(FOLDER, 'shaders', `${id}.glsl`), 'utf8'),
      )
    }
    expect(SHADER_COMMON).toBe(readFileSync(join(FOLDER, 'common.glsl'), 'utf8'))
    expect(SHADER_FOOTER).toBe(readFileSync(join(FOLDER, 'footer.glsl'), 'utf8'))
  })
})

describe('a picture from a node of sound alone', () => {
  it('is a frame of one style, with no engine and no browser', () => {
    const set = visuals.addVisual(visuals.emptyVisualSet(), 'dot-globe').set
    const bands = new Float32Array(visuals.SPECTRUM_BANDS).fill(0.5)
    const desk = new visuals.VisualDesk(() => ({
      set,
      playheadSec: 4,
      pieceSec: 60,
      beatSec: 0.5,
      playing: true,
      strokes: [],
      heard: { level: 0.7, bands },
      energy: 0.6,
      space: 0.5,
      tone: 0.5,
      input: 0,
    }))

    // What is heard is followed, not jumped to: half a second on it has risen.
    desk.frame(1000)
    const frame = desk.frame(1500)

    expect(frame.layers).toHaveLength(1)
    expect(frame.layers[0]).toMatchObject({ paint: 'dot-globe', variation: 0 })
    expect(frame.signals.mix).toBeGreaterThan(0)
    expect(desk.frame(1501)).toBe(frame)
  })
})
