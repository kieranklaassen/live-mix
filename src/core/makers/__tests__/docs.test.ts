import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { NOTE_MAKERS, listPresets } from '../../../index'

// The reference at the foot of docs/makers.md is written from the makers:
//   UPDATE_DOCS=1 npx vitest run src/core/makers/__tests__/docs.test.ts
const DOC = new URL('../../../../docs/makers.md', import.meta.url)
const START = '<!-- makers: start -->'
const END = '<!-- makers: end -->'

function reference(): string {
  return NOTE_MAKERS.map((maker) => {
    const rows = Object.entries(maker.params).map(([id, spec]) => {
      const range = spec.choices
        ? spec.choices.join(', ')
        : `${spec.min} to ${spec.max}${spec.unit ? ` ${spec.unit}` : ''}${spec.step ? `, by ${spec.step}` : ''}`
      const rest = spec.choices ? spec.choices[spec.default - spec.min] : String(spec.default)
      const timed = maker.timed?.[id] ? ` (${maker.timed[id]})` : ''
      return `| \`${id}\` | ${spec.name}${timed} | ${range} | ${rest} | ${spec.description ?? ''} |`
    })
    const parts =
      maker.parts.length === 0
        ? 'It has no parts.'
        : `Parts: ${maker.parts.map((part) => `\`${part.id}\` (${part.name})`).join(', ')}.`
    return [
      `### ${maker.name} (\`${maker.id}\`)`,
      '',
      `${maker.description} It ${maker.kind}.`,
      '',
      '| Id | Control | Range | Rest | What it does |',
      '| --- | --- | --- | --- | --- |',
      ...rows,
      '',
      parts,
      '',
      `Presets: ${listPresets(maker)
        .map(({ name }) => name)
        .join(', ')}.`,
    ].join('\n')
  }).join('\n\n')
}

describe('docs/makers.md', () => {
  it('lists every maker as it is', () => {
    const text = readFileSync(DOC, 'utf8')
    const from = text.indexOf(START)
    const to = text.indexOf(END)
    expect(from).toBeGreaterThan(0)
    expect(to).toBeGreaterThan(from)
    const wanted = `${text.slice(0, from)}${START}\n\n${reference()}\n\n${text.slice(to)}`
    if (process.env.UPDATE_DOCS && wanted !== text) writeFileSync(DOC, wanted)
    else expect(text, 'run with UPDATE_DOCS=1').toBe(wanted)
  })
})
