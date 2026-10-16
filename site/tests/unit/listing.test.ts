// A listing is cut from a file by text, numbered as the file is, and coloured by the highlighter
// the site builds with. The cut and the anchors are tried on a small file written here; the two
// real files are there for the links.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { satteri } from '@astrojs/markdown-satteri'
import { describe, expect, it } from 'vitest'
import config from '../../astro.config.mjs'
import { checkWording } from '../../scripts/check-wording.mjs'
import { codeTheme } from '../../src/lib/code-theme.ts'
import {
  lineAnchor,
  linesOf,
  listingLines,
  listingOf,
  rangeOf,
  rowsOf,
  sourceAnchor,
  sourceLines,
} from '../../src/lib/listing.ts'
import { COMMIT, REPO_ROOT, REPO_URL } from '../../src/lib/site.ts'

const SITE = fileURLToPath(new URL('../..', import.meta.url))

const SOURCE = [
  '#pragma once', // 1
  '', // 2
  '/* A gain that is', // 3
  '   smoothed, so a step', // 4
  '   makes no click. */', // 5
  'struct Gain {', // 6
  '  float g = 1.0f;', // 7
  '  float target = 1.0f;', // 8
  '  void set(float to) { target = to; }', // 9
  '  float tick(float x) {', // 10
  '    g += 0.01f * (target - g);', // 11
  '    return x * g;', // 12
  '  }', // 13
  '};', // 14
  '', // 15
  'struct Mute {', // 16
  '  float tick(float x) { return 0.0f * x; }', // 17
  '};', // 18
].join('\n')

const where = { lesson: 'one-pole', file: 'cpp/kit/gain.h' }

/** The listing as the highlighter writes it: the whole of `source` handed over, the rows kept. */
async function render(source: string, transformer: unknown): Promise<string> {
  const renderer = await satteri().createRenderer({
    syntaxHighlight: { type: 'shiki' },
    shikiConfig: { theme: codeTheme, transformers: [transformer] },
  } as never)
  const page = await renderer.render(`\`\`\`\`cpp\n${source}\n\`\`\`\`\n`, {
    fileURL: pathToFileURL(path.join(REPO_ROOT, 'docs/listing.md')),
  })
  return page.code
}

/** The lines of a rendered listing, each as its own piece of HTML. */
const linesIn = (html: string) => html.match(/<span class="line[^"]*"[^>]*>.*<\/span>/g) ?? []

describe('text anchors', () => {
  it('gives the lines from one text to another, numbered as in the file', () => {
    expect(rangeOf(SOURCE, 'struct Gain {', 'return x * g;', where)).toEqual({
      first: 6,
      last: 12,
    })
  })

  it('gives one text its own line', () => {
    expect(rangeOf(SOURCE, 'target = to;', undefined, where)).toEqual({ first: 9, last: 9 })
  })

  it('lets a text run over a line break, so a closing brace can be named', () => {
    expect(rangeOf(SOURCE, 'struct Gain {', 'return x * g; } };', where)).toEqual({
      first: 6,
      last: 14,
    })
  })

  it('fails on a text that is not there, naming the lesson, the file and the text', () => {
    const asked = () => rangeOf(SOURCE, 'struct Gate {', 'return x * g;', where)
    expect(asked).toThrow('one-pole')
    expect(asked).toThrow('cpp/kit/gain.h')
    expect(asked).toThrow('"struct Gate {"')
  })

  it('fails on a text that is there twice, whether it starts the range or ends it', () => {
    const from = () => rangeOf(SOURCE, 'float tick(float x)', 'return x * g;', where)
    expect(from).toThrow('one-pole')
    expect(from).toThrow('cpp/kit/gain.h')
    expect(from).toThrow('"float tick(float x)"')
    expect(from).toThrow('lines 10 and 17')
    const to = () => rangeOf(SOURCE, 'struct Gain {', '};', where)
    expect(to).toThrow('"};"')
    expect(to).toThrow('lines 14 and 18')
  })

  it('fails on an end that is above its start', () => {
    expect(() => rangeOf(SOURCE, 'return x * g;', 'struct Gain {', where)).toThrow(
      /one-pole.*cpp\/kit\/gain\.h.*above/,
    )
  })

  it('looks for a text only in the lines it is told to', () => {
    expect(linesOf(SOURCE, 'float tick(float x)', where, { first: 6, last: 14 })).toEqual({
      first: 10,
      last: 10,
    })
    expect(() => linesOf(SOURCE, 'struct Mute {', where, { first: 6, last: 14 })).toThrow(
      '"struct Mute {"',
    )
  })

  it('writes lines as the anchor of a link to the source', () => {
    expect(lineAnchor({ first: 9, last: 9 })).toBe('#L9')
    expect(lineAnchor({ first: 6, last: 12 })).toBe('#L6-L12')
  })

  it('reads a file of the repository for the lines of a text', () => {
    const lines = fs.readFileSync(path.join(REPO_ROOT, 'cpp/kit/filters.h'), 'utf8').split('\n')
    const first = lines.findIndex((line) => line.includes('struct OnePole {')) + 1
    const last = lines.findIndex((line) => line.includes('return x - lowpass(x);')) + 1
    expect(first).toBeGreaterThan(0)
    expect(sourceLines('cpp/kit/filters.h', 'struct OnePole {')).toEqual({ first, last: first })
    expect(sourceLines('cpp/kit/filters.h', 'struct OnePole {', 'return x - lowpass(x);')).toEqual({
      first,
      last,
    })
    expect(() =>
      sourceLines('cpp/kit/no-such.h', 'struct OnePole {', undefined, 'one-pole'),
    ).toThrow(/one-pole.*cpp\/kit\/no-such\.h/)
  })
})

describe('a link to the source', () => {
  it('goes to the line its text is on, to the lines between two texts, or to the whole file', () => {
    const { first } = sourceLines('cpp/kit/filters.h', 'struct OnePole {')
    const { last } = sourceLines('cpp/kit/filters.h', 'struct OnePole {', 'return x - lowpass(x);')
    expect(sourceAnchor('cpp/kit/filters.h', { at: 'struct OnePole {' })).toBe(`#L${first}`)
    expect(
      sourceAnchor('cpp/kit/filters.h', { at: 'struct OnePole {', to: 'return x - lowpass(x);' }),
    ).toBe(`#L${first}-L${last}`)
    expect(sourceAnchor('cpp/kit/filters.h', {})).toBe('')
  })

  it('stops the build on lines given by number, naming the lesson and the file', () => {
    expect(() => sourceAnchor('cpp/kit/filters.h', { lines: '40-62' }, 'one-pole')).toThrow(
      'one-pole: <Src path="cpp/kit/filters.h" lines="40-62"> gives its lines by number',
    )
    // With a text beside them too: a number is never taken.
    expect(() =>
      sourceAnchor('cpp/kit/filters.h', { at: 'struct OnePole {', lines: '40' }, 'one-pole'),
    ).toThrow('gives its lines by number')
  })

  it('is what <Src> is made of, whatever it is handed', () => {
    const component = fs.readFileSync(
      path.join(REPO_ROOT, 'site/src/components/lesson/Src.astro'),
      'utf8',
    )
    expect(component).toContain('sourceAnchor(file, Astro.props, Astro.locals.lesson)')
    expect(component).not.toMatch(/lines\?:/)
  })
})

describe('the rows of a listing', () => {
  it('are the lines of the range, each with its number in the file', () => {
    expect(rowsOf(SOURCE, { from: 'struct Gain {', to: 'float target' }, where)).toEqual([
      { line: 6, marked: false },
      { line: 7, marked: false },
      { line: 8, marked: false },
    ])
  })

  it('carry a mark on each line a marked text names', () => {
    const rows = rowsOf(
      SOURCE,
      { from: 'struct Gain {', to: 'return x * g;', mark: ['float target', 'g += 0.01f'] },
      where,
    )
    expect(rows.flatMap((row) => ('line' in row && row.marked ? [row.line] : []))).toEqual([8, 11])
  })

  it('leave a range out as one gap that counts its lines, and number on after it', () => {
    const rows = rowsOf(
      SOURCE,
      {
        from: 'struct Gain {',
        to: 'return x * g; } };',
        skip: ['float g = 1.0f;', 'target = to;'],
      },
      where,
    )
    expect(rows).toEqual([
      { line: 6, marked: false },
      { gap: 3 },
      { line: 10, marked: false },
      { line: 11, marked: false },
      { line: 12, marked: false },
      { line: 13, marked: false },
      { line: 14, marked: false },
    ])
  })

  it('fail on a marked text that is not in the range, or is in it twice', () => {
    const range = { from: 'struct Gain {', to: 'return x * g;' }
    expect(() => rowsOf(SOURCE, { ...range, mark: 'struct Mute {' }, where)).toThrow(
      /one-pole.*"struct Mute \{".*cpp\/kit\/gain\.h/,
    )
    expect(() => rowsOf(SOURCE, { ...range, mark: 'float' }, where)).toThrow(
      /one-pole.*"float".*cpp\/kit\/gain\.h/,
    )
  })
})

describe('a listing as it is written into the page', () => {
  const href = (line: number) => `https://example.org/gain.h#L${line}`

  it('numbers each line as the file does and links the number, with no id by the number', async () => {
    const rows = rowsOf(SOURCE, { from: 'struct Gain {', to: 'float target' }, where)
    const lines = linesIn(await render(SOURCE, listingLines(rows, { name: 'gain', href })))
    expect(lines).toHaveLength(3)
    lines.forEach((line, index) => {
      const number = 6 + index
      expect(line).not.toContain(' id="')
      expect(line).toMatch(
        new RegExp(`<a [^>]*href="https://example\\.org/gain\\.h#L${number}"[^>]*>${number}</a>`),
      )
    })
    expect(lines[0]).toContain('struct')
    expect(lines[2]).toContain('target')
  })

  it('gives a line the id of its key, found by text on the line', async () => {
    const rows = rowsOf(
      SOURCE,
      { from: 'struct Gain {', to: 'float target', at: { start: 'float g = 1.0f;' } },
      where,
    )
    const lines = linesIn(await render(SOURCE, listingLines(rows, { name: 'gain', href })))
    expect(lines.map((line) => /id="([^"]*)"/.exec(line)?.[1])).toEqual([
      undefined,
      'gain-start',
      undefined,
    ])
  })

  it('refuses a key on text the lines shown do not hold, a key that is a line number, two keys on a line and a key on a line left out', () => {
    const cut = { from: 'struct Gain {', to: 'g += 0.01f' }
    expect(() => rowsOf(SOURCE, { ...cut, at: { gone: 'no such text' } }, where)).toThrow(
      /"no such text" is not in lines/,
    )
    expect(() => rowsOf(SOURCE, { ...cut, at: { l7: 'float g = 1.0f;' } }, where)).toThrow(
      /the key "l7"/,
    )
    expect(() => rowsOf(SOURCE, { ...cut, at: { Start: 'float g = 1.0f;' } }, where)).toThrow(
      /the key "Start"/,
    )
    expect(() =>
      rowsOf(SOURCE, { ...cut, at: { one: 'float g = 1.0f;', two: 'g = 1.0f' } }, where),
    ).toThrow(/two keys, "one" and "two"/)
    expect(() =>
      rowsOf(
        SOURCE,
        { ...cut, skip: ['float g = 1.0f;', 'target = to;'], at: { start: 'float g = 1.0f;' } },
        where,
      ),
    ).toThrow(/among the lines left out/)
  })

  it('marks a marked line and no other', async () => {
    const rows = rowsOf(
      SOURCE,
      { from: 'struct Gain {', to: 'float target', mark: 'float g = 1.0f;' },
      where,
    )
    const lines = linesIn(await render(SOURCE, listingLines(rows, { name: 'gain', href })))
    expect(lines.map((line) => /^<span class="line marked"/.test(line))).toEqual([
      false,
      true,
      false,
    ])
  })

  it('shows a range left out as one line that says how many, with no number of its own', async () => {
    const rows = rowsOf(
      SOURCE,
      { from: 'struct Gain {', to: 'g += 0.01f', skip: ['float g = 1.0f;', 'target = to;'] },
      where,
    )
    const lines = linesIn(await render(SOURCE, listingLines(rows, { name: 'gain', href })))
    expect(lines).toHaveLength(4)
    expect(lines[0]).toContain('>6</a>')
    expect(lines[1]).toMatch(/^<span class="line gap">3 lines left out<\/span>$/)
    expect(lines[2]).toContain('>10</a>')
    expect(lines[3]).toContain('>11</a>')
  })

  it('says one line left out of one', async () => {
    const rows = rowsOf(
      SOURCE,
      { from: 'struct Gain {', to: 'float target', skip: ['float g = 1.0f;', 'float g = 1.0f;'] },
      where,
    )
    const lines = linesIn(await render(SOURCE, listingLines(rows, { name: 'gain', href })))
    expect(lines[1]).toContain('>1 line left out<')
  })

  // The whole file is coloured and then cut. Cut first, these words would be read as code.
  it('colours a range that starts inside a block comment as comment', async () => {
    const rows = rowsOf(SOURCE, { from: 'smoothed, so a step', to: 'struct Gain {' }, where)
    const lines = linesIn(await render(SOURCE, listingLines(rows, { name: 'gain', href })))
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain(
      '<span style="color:var(--code-comment)">   smoothed, so a step</span>',
    )
    expect(lines[1]).toContain(
      '<span style="color:var(--code-comment)">   makes no click. */</span>',
    )
    expect(lines[2]).toContain('<span style="color:var(--code-keyword)">struct</span>')
    expect(lines[2]).not.toContain('--code-comment')
  })
})

describe('the wording check', () => {
  // The words are joined here so that this file, which the check reads too, does not hold them.
  const phrase = ['inspired', 'by'].join(' ')

  it('reads the lines a listing shows as it reads any other text of a lesson', async () => {
    const source = `// A gain, ${phrase} nothing.\nstruct Gain {\n  float g = 1.0f;\n};`
    const rows = rowsOf(source, { from: 'A gain', to: 'struct Gain {' }, where)
    const html = await render(source, listingLines(rows, { name: 'gain', href: () => '#' }))

    const site = fs.mkdtempSync(path.join(os.tmpdir(), 'site-listing-'))
    try {
      fs.mkdirSync(path.join(site, 'dist/lessons/one-pole'), { recursive: true })
      fs.writeFileSync(path.join(site, 'dist/lessons/one-pole/index.html'), html)
      const { problems } = checkWording(site)
      expect(problems).toHaveLength(1)
      expect(problems[0]).toContain(`A gain, ${phrase} nothing.`)
    } finally {
      fs.rmSync(site, { recursive: true, force: true })
    }
  })
})

describe('a listing of a file of the repository', () => {
  const blob = `${REPO_URL}/blob/${COMMIT}/`
  /** The 1-based line of `file` that holds `text`, found here and not by the code under test. */
  const lineOf = (file: string, text: string) =>
    fs
      .readFileSync(path.join(REPO_ROOT, file), 'utf8')
      .split('\n')
      .findIndex((line) => line.includes(text)) + 1

  it.each([
    ['cpp/kit/filters.h', 'struct OnePole {', 'return x - lowpass(x);', 'filters'],
    ['site/labs/through.cpp', '#include "lab.h"', 'void lab_setup()', 'through'],
  ])('%s links each line to blob/<commit>/<path>#L<n>', async (file, from, to, name) => {
    const first = lineOf(file, from)
    const last = lineOf(file, to)
    expect(first).toBeGreaterThan(0)
    expect(last).toBeGreaterThan(first)

    const listing = listingOf({ file, from, to, at: { top: from } }, {}, 'one-pole')
    expect(listing.lines).toEqual({ first, last })
    expect(listing.href).toBe(`${blob}${file}#L${first}-L${last}`)
    expect(listing.lang).toBe('cpp')
    expect(listing.name).toBe(name)

    const lines = linesIn(await render(listing.source, listing.transformer))
    expect(lines).toHaveLength(last - first + 1)
    expect(lines[0]).toContain(`href="${blob}${file}#L${first}"`)
    expect(lines[0]).toContain(`id="${name}-top"`)
    expect(lines.at(-1)).toContain(`href="${blob}${file}#L${last}"`)
  })

  it('takes the name it is given, and fails when two listings of a page take one name', () => {
    const page = {}
    const props = { file: 'cpp/kit/filters.h', from: 'struct OnePole {', to: 'state = 0.0f; }' }
    expect(listingOf(props, page, 'one-pole').name).toBe('filters')
    expect(listingOf({ ...props, name: 'pole' }, page, 'one-pole').name).toBe('pole')
    expect(() => listingOf(props, page, 'one-pole')).toThrow(/one-pole.*"filters"/)
    // Another page starts again.
    expect(listingOf(props, {}, 'one-pole').name).toBe('filters')
  })

  it('names the lesson and the file when the file is not in the repository', () => {
    expect(() =>
      listingOf({ file: 'cpp/kit/no-such.h', from: 'a', to: 'b' }, {}, 'one-pole'),
    ).toThrow(/one-pole.*cpp\/kit\/no-such\.h/)
  })
})

describe('the colours of code', () => {
  const css = fs.readFileSync(path.join(SITE, 'src/styles/site.css'), 'utf8')
  const block = css.slice(
    css.indexOf('/* listing colours */'),
    css.indexOf('/* end listing colours */'),
  )
  const used = [...new Set(JSON.stringify(codeTheme).match(/--code-[a-z]+/g))]

  it('are all variables of the page, so a listing follows the scheme', () => {
    const colours = JSON.stringify(codeTheme).match(/"(foreground|background)":"[^"]*"/g) ?? []
    expect(colours.length).toBeGreaterThan(5)
    for (const colour of colours) expect(colour).toMatch(/:"var\(--code-[a-z]+\)"$/)
  })

  it.each([
    ['paper', /:root \{([^}]*)\}/],
    ['graphite', /:root\[data-lm-theme='graphite'\] \{([^}]*)\}/],
  ])('are each given a value in the %s scheme', (_scheme, rule) => {
    const values = block.match(rule)?.[1] ?? ''
    expect(used.length).toBeGreaterThan(5)
    for (const name of used) expect(values).toMatch(new RegExp(`${name}: \\S`))
  })

  it('are the colours fenced code in the docs is given', () => {
    expect(config.markdown?.shikiConfig?.theme).toBe(codeTheme)
  })
})
