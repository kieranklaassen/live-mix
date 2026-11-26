// Writes src/visuals/preset-sources.ts and src/visuals/preset-words.ts from src/visuals/presets/*.ts.
// Run after a preset is added: node scripts/gen-visual-presets.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { transformSync } from 'esbuild'
import { format, resolveConfig } from 'prettier'

const VISUALS = join(dirname(fileURLToPath(import.meta.url)), '../src/visuals')
const ids = readdirSync(join(VISUALS, 'presets'))
  .filter((name) => name.endsWith('.ts'))
  .map((name) => name.slice(0, -3))
  .sort()

async function presetsOf(id) {
  const { code } = transformSync(readFileSync(join(VISUALS, 'presets', `${id}.ts`), 'utf8'), {
    loader: 'ts',
    format: 'esm',
  })
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`))
    .default
}

const key = (id) => (/^[a-z]+$/.test(id) ? id : `'${id}'`)
const words = []
for (const id of ids) {
  const rows = (await presetsOf(id)).map(
    (preset) =>
      `[${JSON.stringify(preset.id)}, ${preset.variation}, ${JSON.stringify(preset.what)}]`,
  )
  words.push(`${key(id)}: [${rows.join(', ')}],`)
}

async function write(name, text) {
  const path = join(VISUALS, name)
  const options = await resolveConfig(path)
  writeFileSync(path, await format(text, { ...options, filepath: path }))
}

await write(
  'preset-sources.ts',
  `// Where each style's presets are, each loaded the first time one is drawn or asked for.
//
// Written by \`scripts/gen-visual-presets.mjs\`, from the files of \`presets/\`.

import type { VisualPreset } from './preset'

${ids.length ? '/* eslint-disable no-restricted-syntax -- the presets of one style are loaded with that style, not with the page */' : ''}
export const PRESET_SOURCES: Readonly<Record<string, () => Promise<readonly VisualPreset[]>>> = {
${ids.map((id) => `${key(id)}: () => import('./presets/${id}').then((module) => module.default),`).join('\n')}
}
`,
)
await write(
  'preset-words.ts',
  `// What every preset is called and what is seen in it: its id, its variation and its sentence, under its style.
//
// Written by \`scripts/gen-visual-presets.mjs\`, from the files of \`presets/\`.

export const PRESET_WORDS: Readonly<
  Record<string, readonly (readonly [id: string, variation: 0 | 1, what: string])[]>
> = {
${words.join('\n')}
}
`,
)
console.log(`${ids.length} styles`)
