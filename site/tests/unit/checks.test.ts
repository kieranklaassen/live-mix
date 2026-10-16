// The two checks that read the site as a whole, tried on small sites made for the purpose: a
// dead link is found and a sound one is not, a name is found and a word that only holds one
// is not.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { checkLinks } from '../../scripts/check-links.mjs'
import { patternsOf, wordingIn } from '../../scripts/check-wording.mjs'

const made: string[] = []
function site(pages: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-links-'))
  made.push(root)
  for (const [file, html] of Object.entries(pages)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), html)
  }
  return root
}
afterAll(() => made.forEach((root) => fs.rmSync(root, { recursive: true, force: true })))

describe('check-links', () => {
  it('passes a site whose links all lead somewhere', () => {
    const dist = site({
      'index.html':
        '<a href="/live-mix/lessons/one/#idea">one</a> <a href="https://example.com/">out</a>',
      'lessons/one/index.html':
        '<h2 id="idea">Idea</h2> <a href="../../">home</a> <img src="/live-mix/a.svg">',
      'a.svg': '<svg/>',
    })
    expect(checkLinks(dist, '/live-mix')).toEqual({ problems: [], internal: 3, external: 1 })
  })

  it('finds a page that is not there, a heading that is not there, and a link that leaves the base path', () => {
    const dist = site({
      'index.html':
        '<a href="/live-mix/lessons/two/">two</a> <a href="/live-mix/lessons/one/#gone">gone</a> <a href="/lessons/one/">no base</a>',
      'lessons/one/index.html': '<h2 id="idea">Idea</h2>',
    })
    const { problems } = checkLinks(dist, '/live-mix')
    expect(problems).toHaveLength(3)
    expect(problems[0]).toContain('leads to nothing')
    expect(problems[1]).toContain('#gone')
    expect(problems[2]).toContain("leaves the site's base path")
  })

  it('works for a site at a domain’s root', () => {
    const dist = site({
      'index.html': '<a href="/lessons/one/">one</a>',
      'lessons/one/index.html': '<a href="/">home</a>',
    })
    expect(checkLinks(dist, '/').problems).toEqual([])
  })

  it('does not look for headings in the API reference', () => {
    const dist = site({
      'index.html': '<a href="/live-mix/api/classes/Engine.html#render">render</a>',
      'api/classes/Engine.html': '<h1>Engine</h1>',
    })
    expect(checkLinks(dist, '/live-mix').problems).toEqual([])
  })
})

describe('check-wording', () => {
  const patterns = patternsOf('# a comment\nAcme Sound\nZed\n~\\b[\\w-]+-style\\b\n')

  it('finds a name whatever its capitals, and says the line', () => {
    expect(wordingIn('A plate.\nAs the acme sound unit does.', patterns)).toEqual([
      { line: 2, said: 'Acme Sound', text: 'As the acme sound unit does.' },
    ])
  })

  it('leaves a word that only holds a name', () => {
    expect(wordingIn('Zedoary is a root. A buzzed tone.', patterns)).toEqual([])
  })

  it('finds a comparison by pattern', () => {
    expect(wordingIn('A ladder-style filter.', patterns)).toHaveLength(1)
  })
})
