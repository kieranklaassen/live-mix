import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { docId, docSlug, isExcluded } from '../../src/lib/doc-routes.ts'
import { docDescription, docsNav } from '../../src/lib/docs-nav.ts'
import { REPO_ROOT } from '../../src/lib/site.ts'

const route = (file: string) => docSlug(docId(file))

describe('a doc route', () => {
  it('keeps the folder, so two docs with one name are two pages', () => {
    expect(route('devices.md')).toBe('devices')
    expect(route('concepts/devices.md')).toBe('concepts/devices')
  })

  it('is the folder itself for a README', () => {
    expect(route('README.md')).toBe('')
    expect(route('concepts/README.md')).toBe('concepts')
  })

  it('is lower case with hyphens', () => {
    expect(route('concepts/Time Line.md')).toBe('concepts/time-line')
  })

  it('is not made for the three folders the site leaves out', () => {
    expect(['plans/a.md', 'solutions/README.md', 'api/index.html'].map(isExcluded)).toEqual([
      true,
      true,
      true,
    ])
    expect(isExcluded('concepts/time.md')).toBe(false)
  })
})

describe('the docs in the repository', () => {
  // The same files the collection's glob takes: every .md under docs/ outside the left-out folders.
  const docsRoot = path.join(REPO_ROOT, 'docs')
  const files = fs
    .readdirSync(docsRoot, { recursive: true, encoding: 'utf8' })
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => file.endsWith('.md') && !isExcluded(file))

  it('each get a route of their own, one of them the index', () => {
    const routes = new Set(files.map(route))
    expect(files.length).toBeGreaterThan(0)
    expect(routes.size).toBe(files.length)
    expect(routes.has('')).toBe(true)
  })
})

describe('the sidebar', () => {
  const index = [
    '# The documentation',
    '',
    '## Start',
    '',
    '- [Getting started](./getting-started.md): install. The [README](../README.md#quick-start)',
    '  is shorter, and [the plans](./plans/a.md) are longer.',
    '',
    '## Concepts',
    '',
    '| Page | What it teaches |',
    '| ---- | --------------- |',
    '| [Time](./concepts/time.md) | Seconds first |',
    '| [The **score**](./concepts/score.md#undo) | The document |',
    '',
    '## Reference',
    '',
    '| [score.md](./score.md) | Schema |',
    '| [Getting started](./getting-started.md) | again |',
    '',
    '## Why the reference is generated',
    '',
    'No links here.',
  ].join('\n')
  const pages = [
    { id: 'index', title: 'The documentation' },
    { id: 'zone-sampler', title: 'Zone Sampler' },
    { id: 'score', title: 'The score: document and operations' },
    { id: 'concepts/score', title: 'The score as the source of truth' },
    { id: 'concepts/time', title: 'Time: seconds first' },
    { id: 'getting-started', title: 'Getting started' },
    { id: 'link', title: 'Clock sharing' },
  ]

  it('follows the order of the index, each page once, the rest under More', () => {
    expect(docsNav(index, pages)).toEqual([
      { title: 'Start', items: [{ id: 'getting-started', label: 'Getting started' }] },
      {
        title: 'Concepts',
        items: [
          { id: 'concepts/time', label: 'Time' },
          { id: 'concepts/score', label: 'The score' },
        ],
      },
      // A link the index writes as a file name is shown by the page's title.
      { title: 'Reference', items: [{ id: 'score', label: 'The score: document and operations' }] },
      {
        title: 'More',
        items: [
          { id: 'link', label: 'Clock sharing' },
          { id: 'zone-sampler', label: 'Zone Sampler' },
        ],
      },
    ])
  })

  it('has no More when the index names every page', () => {
    const named = pages.filter((page) => !['link', 'zone-sampler'].includes(page.id))
    expect(docsNav(index, named).map((group) => group.title)).toEqual([
      'Start',
      'Concepts',
      'Reference',
    ])
  })

  it('names every doc of the repository once', async () => {
    const readme = fs.readFileSync(path.join(REPO_ROOT, 'docs/README.md'), 'utf8')
    const all = fs
      .readdirSync(path.join(REPO_ROOT, 'docs'), { recursive: true, encoding: 'utf8' })
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => file.endsWith('.md') && !isExcluded(file))
      .map((file) => ({ id: docId(file), title: file }))
    const groups = docsNav(readme, all)
    const ids = groups.flatMap((group) => group.items.map((item) => item.id))
    expect(ids.toSorted()).toEqual(
      all
        .map((page) => page.id)
        .filter((id) => id !== 'index')
        .toSorted(),
    )
    expect(groups.map((group) => group.title)).toEqual([
      'Start',
      'Concepts',
      'Recipes',
      'Consumers',
      'Reference',
      'Project',
      'More',
    ])
  })
})

describe('a page description', () => {
  it('is the first paragraph under the title, as plain text', () => {
    const body = [
      '# Time',
      '',
      '> Reference: [score.md](../score.md)',
      '',
      'The engine counts in **seconds**; see [the `Transport`](./x.md)',
      'and its anchor.',
      '',
      'A second paragraph.',
    ].join('\n')
    expect(docDescription(body)).toBe(
      'The engine counts in seconds; see the Transport and its anchor.',
    )
  })

  it('is cut at a word when the paragraph is long', () => {
    const text = docDescription(`# Long\n\n${'word '.repeat(60)}\n`)!
    expect(text.length).toBeLessThanOrEqual(160)
    expect(text.endsWith('word…')).toBe(true)
  })

  it('is left out when the doc opens with something other than a paragraph', () => {
    expect(docDescription('# Table\n\n| a | b |\n| - | - |\n')).toBeUndefined()
  })
})
