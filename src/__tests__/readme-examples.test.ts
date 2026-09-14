// The README's code samples are files under examples/readme, type-checked
// against src/ by `tsc -p examples/tsconfig.json` (part of `pnpm typecheck`).
// This test pins the README's fenced blocks to those files verbatim, so a
// sample cannot drift from what compiles: each block is announced by an
// HTML comment naming its file, and every file must appear in the README.

import { readFile, readdir } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const root = new URL('../../', import.meta.url)
const examplesDir = new URL('examples/readme/', root)

const MARKER = /<!-- example: (\S+) -->\s*\n```(\w+)\n([\s\S]*?)\n```/g

interface ReadmeExample {
  path: string
  lang: string
  code: string
}

async function readmeExamples(): Promise<ReadmeExample[]> {
  const readme = await readFile(new URL('README.md', root), 'utf8')
  return [...readme.matchAll(MARKER)].map(([, path, lang, code]) => ({ path, lang, code }))
}

describe('README examples', () => {
  it('every examples/readme file is embedded in README.md', async () => {
    const files = (await readdir(examplesDir)).filter((name) => /\.tsx?$/.test(name)).sort()
    const embedded = (await readmeExamples()).map((example) => example.path).sort()
    expect(files.length).toBeGreaterThan(0)
    expect(embedded).toEqual(files.map((name) => `examples/readme/${name}`))
  })

  it('every embedded block matches its file verbatim', async () => {
    const examples = await readmeExamples()
    expect(examples.length).toBeGreaterThan(0)
    for (const example of examples) {
      const file = await readFile(new URL(example.path, root), 'utf8')
      expect(example.lang, example.path).toBe(example.path.endsWith('.tsx') ? 'tsx' : 'ts')
      expect(example.code, example.path).toBe(file.replace(/\n$/, ''))
    }
  })

  it('embedded blocks import only the public entries', async () => {
    const entries = new Set([
      '@kieranklaassen/live-mix',
      '@kieranklaassen/live-mix/dsp',
      '@kieranklaassen/live-mix/react',
      '@kieranklaassen/live-mix/react/styles.css',
      '@kieranklaassen/live-mix/testing',
      '@kieranklaassen/live-mix/wam',
    ])
    for (const example of await readmeExamples()) {
      const specifiers = [...example.code.matchAll(/from '([^']+)'|^import '([^']+)'/gm)].map(
        ([, from, side]) => from ?? side,
      )
      expect(specifiers.length, example.path).toBeGreaterThan(0)
      for (const specifier of specifiers) expect(entries.has(specifier), specifier).toBe(true)
    }
  })
})
