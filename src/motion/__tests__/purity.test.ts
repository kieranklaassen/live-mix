import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// The motion entry stands alone: a host that draws a picture takes it without
// the audio engine, and it runs wherever JavaScript does. So nothing in it
// may import from outside its folder, a package included. That it names no
// DOM, Web Audio or WebGL type is held by `tsconfig.motion.json`, which
// compiles the folder with no DOM library (`pnpm typecheck`).
const FOLDER = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCES = readdirSync(FOLDER)
  .filter((name) => name.endsWith('.ts'))
  .sort()
  .map((name) => ({ name, source: readFileSync(join(FOLDER, name), 'utf8') }))

describe('the motion library', () => {
  it('is read here whole', () => {
    expect(SOURCES.map(({ name }) => name)).toEqual([
      'clock.ts',
      'easing.ts',
      'index.ts',
      'keyframes.ts',
      'layer-motion.ts',
      'presets.ts',
      'profile.ts',
      'shutter.ts',
      'spring.ts',
      'values.ts',
    ])
  })

  it('imports nothing from outside its folder', () => {
    const outside = SOURCES.flatMap(({ name, source }) =>
      [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)]
        .map((match) => match[1])
        .filter((specifier) => !/^\.\/[a-z-]+$/.test(specifier))
        .map((specifier) => `${name} imports ${specifier}`),
    )

    expect(outside).toEqual([])
  })

  it('reads no clock and no random number: a value comes from its arguments alone', () => {
    const code = (source: string): string =>
      source
        .split('\n')
        .filter((line) => !/^\s*(?:\/\/|\/\*|\*)/.test(line))
        .join('\n')
    const impure = SOURCES.flatMap(({ name, source }) =>
      [
        ...code(source).matchAll(/\b(?:Date\.now|new Date|performance\.now|Math\.random)\s*\(/g),
      ].map((match) => `${name} calls ${match[0]}`),
    )

    expect(impure).toEqual([])
  })
})
