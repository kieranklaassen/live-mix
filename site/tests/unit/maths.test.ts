// The two commands a lesson's equations add to the mathematics: a term in the colour of a
// signal's role, and a term that links to a line of a listing. The renderer writes a command it
// was not told to trust as red text and reports nothing, so what is trusted is held here.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { ROLES } from '../../src/figures/roles.ts'
import { mathsBox, mathsHtml } from '../../src/lib/maths.ts'

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

  it('is left out of the search, whole: its outermost element says so, in line and as a block', () => {
    for (const block of [false, true]) {
      const html = mathsHtml(String.raw`C(z) = \sig{out}{z} + \tfrac{1}{2}`, block)
      const outer = /^<span ([^>]*)>/.exec(html)?.[1] ?? ''
      expect(outer).toContain('data-pagefind-ignore')
      expect(outer).toContain(block ? 'class="katex-display"' : 'class="katex"')
      // Once, on the outermost element: everything the renderer wrote is inside it.
      expect(html.match(/data-pagefind-ignore/g)).toHaveLength(1)
    }
  })

  it('as a block stands in a box that scrolls sideways and takes the focus, as a listing’s does', () => {
    const html = mathsBox(String.raw`C(z) = \sig{out}{z} + \tfrac{1}{2}`)
    // The box is what scrolls (styles/lesson.css): with a place in the order of the Tab key the
    // arrow keys move it, so an equation wider than a phone is read to its end without a pointer.
    expect(html.startsWith('<div class="math" tabindex="0"><span data-pagefind-ignore ')).toBe(true)
    expect(html.endsWith('</span></div>')).toBe(true)
    expect(html).toContain('class="katex-display"')
    // The page sets a block through it, and an equation in a sentence has no box.
    const component = fs.readFileSync(path.join(SITE, 'src/components/lesson/M.astro'), 'utf8')
    expect(component).toContain('set:html={mathsBox(t)}')
    expect(mathsHtml(String.raw`a + b`)).not.toContain('tabindex')
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
  it('links a term to a keyed line of a listing on the page, with nothing refused', () => {
    const html = mathsHtml(String.raw`\at{filters-coeff}{a}\,y[n-1]`)
    expect(html).toContain('<a href="#filters-coeff">')
    expect(html).not.toContain(REFUSED)
  })

  it('takes a term that is coloured as well', () => {
    const html = mathsHtml(String.raw`\at{filters-coeff}{\sig{out}{y}}`)
    expect(html).toContain('<a href="#filters-coeff">')
    expect(html).toContain('class="enclosing sig-out"')
    expect(html).not.toContain(REFUSED)
  })

  it('refuses a line by its number, which moves when the file does', () => {
    expect(() => mathsHtml(String.raw`\at{filters-L19}{a}`)).toThrow(/a line by its number/)
  })

  /**
   * The part of an equation a browser shows: the renderer's HTML without its MathML, and
   * without the ends of the one or two elements the two are wrapped in.
   */
  function shown(html: string): string {
    const from = html.indexOf('<span class="katex-html"')
    const wrapped = html.slice(0, from).match(/<span [^>]*class="katex(-display)?">/g)!.length
    return html.slice(from, html.length - wrapped * '</span>'.length)
  }

  /**
   * The links of a piece of HTML, each as its address and the text in it, read as a browser
   * reads tags: it throws on a link inside a link, which HTML does not have (a browser ends
   * the first where the second starts, and whatever the first held is drawn apart), and on a
   * tag that is closed out of its turn.
   */
  function links(html: string): [href: string, text: string][] {
    const found: [string, string][] = []
    const open: string[] = []
    let link: [string, string] | undefined
    for (const [token, closing, tag, attributes] of html.matchAll(
      /<(\/?)([a-zA-Z][\w-]*)([^>]*)>|[^<]+/g,
    )) {
      if (tag === undefined) {
        if (link) link[1] += token
      } else if (attributes!.endsWith('/')) {
        continue
      } else if (closing) {
        if (open.pop() !== tag) throw new Error(`</${tag}> closes a tag that is not open`)
        if (tag === 'a') link = undefined
      } else {
        open.push(tag)
        if (tag !== 'a') continue
        if (link) throw new Error(`A link stands inside the link to ${link[0]}`)
        link = [/href="([^"]*)"/.exec(attributes!)![1]!, '']
        found.push(link)
      }
    }
    if (open.length > 0) throw new Error(`<${open.at(-1)}> is never closed`)
    return found
  }

  it('reads a link inside a link as the fault it is, in the renderer left to itself', () => {
    const html = katex.renderToString(String.raw`\href{#a}{\frac{\href{#b}{x}}{y}}`, {
      trust: true,
      strict: 'ignore',
    })
    expect(() => links(shown(html))).toThrow('A link stands inside the link to #a')
  })

  it('keeps a fraction whole when a link round it holds a term with a link of its own', () => {
    const html = shown(
      mathsHtml(String.raw`g = \at{comp-gain}{\frac{\at{comp-over}{x}}{1 + \sig{ctl}{r}}}`, true),
    )
    // No link is inside another. The term with a link of its own goes to its own line, and
    // every other term of the fraction goes to the line the whole fraction was linked to.
    expect(links(html)).toEqual([
      ['#comp-gain', '1'],
      ['#comp-gain', '+'],
      ['#comp-gain', 'r'],
      ['#comp-over', 'x'],
    ])
    expect(html).toContain('class="mfrac"')
    expect(html).toContain('class="enclosing sig-ctl"')
    expect(html).not.toContain(REFUSED)
  })

  it('does the same three deep, each term going to the nearest link round it', () => {
    const html = shown(mathsHtml(String.raw`\at{l-a}{p + \frac{\at{l-b}{q \cdot \at{l-c}{s}}}{t}}`))
    expect(links(html)).toEqual([
      ['#l-a', 'p'],
      ['#l-a', '+'],
      ['#l-a', 't'],
      ['#l-b', 'q'],
      ['#l-b', '⋅'],
      ['#l-c', 's'],
    ])
  })

  it('leaves an equation whose links hold no link exactly as the renderer wrote it', () => {
    const source = String.raw`\frac{\href{#l-a}{x}}{\href{#l-b}{y}} + \href{#l-c}{\frac{1}{z}}`
    const plain = katex.renderToString(source, {
      output: 'htmlAndMathml',
      trust: true,
      strict: 'ignore',
    })
    // The MathML carries the source as it was written, so only what is shown is compared.
    expect(shown(mathsHtml(source.replaceAll(String.raw`\href{#`, String.raw`\at{`)))).toBe(
      shown(plain),
    )
    expect(links(shown(plain)).map(([href]) => href)).toEqual(['#l-b', '#l-a', '#l-c'])
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
