// The two commands a lesson's equations add to the mathematics: a term in the colour of a
// signal's role, and a term that links to a line of a listing. The renderer writes a command it
// was not told to trust as red text and reports nothing, so what is trusted is held here.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { ROLES } from '../../src/figures/roles.ts'
import { mathsHtml } from '../../src/lib/maths.ts'

const SITE = fileURLToPath(new URL('../..', import.meta.url))

// The colour the renderer writes a refused command in.
const REFUSED = '#cc0000'

describe('an equation', () => {
  it('is set as before: in line, or with `block` on a line of its own', () => {
    const inline = mathsHtml(String.raw`y[n] = x[n] + a\,y[n-1]`)
    expect(inline).toContain('class="katex"')
    expect(inline).not.toContain('katex-display')
    expect(mathsHtml(String.raw`y[n] = x[n] + a\,y[n-1]`, true)).toContain('katex-display')
  })

  it('still fails on mathematics that cannot be read', () => {
    expect(() => mathsHtml(String.raw`\frac{1}{`)).toThrow()
  })
})

describe('the renderer left to itself', () => {
  it('writes a command it does not trust in red and throws nothing', () => {
    const html = katex.renderToString(String.raw`\htmlClass{sig-out}{y}`, {
      throwOnError: true,
      strict: 'ignore',
    })
    expect(html).toContain(REFUSED)
    expect(html).not.toContain('class="enclosing')
  })
})

describe(String.raw`\sig`, () => {
  it.each(ROLES)('wraps a term in the class of the role %s, with nothing refused', (role) => {
    const html = mathsHtml(String.raw`y = \sig{${role}}{G(x)} + 1`)
    expect(html).toContain(`class="enclosing sig-${role}"`)
    expect(html).not.toContain(REFUSED)
  })

  it('fails on a role there is not', () => {
    expect(() => mathsHtml(String.raw`\sig{loud}{x}`)).toThrow(/sig-loud/)
  })

  it.each(ROLES)('has the colour of the role %s in the stylesheet', (role) => {
    const css = fs.readFileSync(path.join(SITE, 'src/styles/site.css'), 'utf8')
    expect(css).toMatch(
      new RegExp(`\\.katex \\.sig-${role} \\{\\s*color: var\\(--sig-${role}\\);\\s*\\}`),
    )
  })
})

describe(String.raw`\at`, () => {
  it('links a term to a line of a listing on the page, with nothing refused', () => {
    const html = mathsHtml(String.raw`\at{filters-L19}{a}\,y[n-1]`)
    expect(html).toContain('<a href="#filters-L19">')
    expect(html).not.toContain(REFUSED)
  })

  it('takes a term that is coloured as well', () => {
    const html = mathsHtml(String.raw`\at{filters-L19}{\sig{out}{y}}`)
    expect(html).toContain('<a href="#filters-L19">')
    expect(html).toContain('class="enclosing sig-out"')
    expect(html).not.toContain(REFUSED)
  })
})

describe('a command outside the two', () => {
  it.each([
    [String.raw`\htmlClass{warning}{x}`, /\\htmlClass/],
    [String.raw`\htmlStyle{color: red}{x}`, /\\htmlStyle/],
    [String.raw`\htmlId{x}{x}`, /\\htmlId/],
    [String.raw`\href{https://example.org/}{x}`, /\\href/],
    [String.raw`\href{../compression/}{x}`, /\\href/],
    [String.raw`\url{https://example.org/}`, /\\url/],
  ])('%s stops the build and names itself', (source, named) => {
    expect(() => mathsHtml(source)).toThrow(named)
  })
})
