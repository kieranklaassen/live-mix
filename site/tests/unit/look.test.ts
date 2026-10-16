// The look every page shares: which scheme a page takes, the colours of the six signal roles in
// both schemes, and the type a canvas sets its numbers in.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { colours, drawGrid } from '../../src/figures/canvas.ts'
import { ROLES, ROLE_VAR } from '../../src/figures/roles.ts'

const read = (path: string) =>
  fs.readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

afterEach(() => vi.unstubAllGlobals())

describe('the scheme of a page', () => {
  const layout = read('../../src/layouts/Base.astro')
  const script = /<script is:inline>([\s\S]*?)<\/script>/.exec(layout)?.[1] ?? ''

  /** Runs the script of the page's head as a browser would, on a system that asks for `dark` or not. */
  function page(dark: boolean) {
    const system = { matches: dark, changed: () => {} }
    const asked: string[] = []
    const set: Record<string, string> = {}
    const window = {
      matchMedia: (query: string) => {
        asked.push(query)
        return {
          get matches() {
            return system.matches
          },
          addEventListener: (_event: string, listener: () => void) => {
            system.changed = listener
          },
        }
      },
    }
    const document = {
      documentElement: { setAttribute: (name: string, value: string) => (set[name] = value) },
    }
    new Function('window', 'document', script)(window, document)
    return { system, asked, set }
  }

  it('is Graphite when the system asks for dark', () => {
    const { set, asked } = page(true)
    expect(asked).toEqual(['(prefers-color-scheme: dark)'])
    expect(set['data-lm-theme']).toBe('graphite')
  })

  it('is Paper otherwise, and before any script has run', () => {
    expect(page(false).set['data-lm-theme']).toBe('paper')
    expect(/<html[^>]*data-lm-theme="([^"]*)"/.exec(layout)?.[1]).toBe('paper')
  })

  it('follows the system when it changes its mind', () => {
    const { system, set } = page(false)
    system.matches = true
    system.changed()
    expect(set['data-lm-theme']).toBe('graphite')
    system.matches = false
    system.changed()
    expect(set['data-lm-theme']).toBe('paper')
  })
})

/** The rules of a stylesheet that hold everywhere: comments and every `@` block are left out. */
function rules(css: string): { selectors: string[]; body: string }[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const found: { selectors: string[]; body: string }[] = []
  let at = 0
  while (at < text.length) {
    const open = text.indexOf('{', at)
    if (open < 0) break
    const head = text.slice(at, open).trim()
    let depth = 1
    let close = open + 1
    for (; close < text.length && depth > 0; close += 1) {
      if (text[close] === '{') depth += 1
      if (text[close] === '}') depth -= 1
    }
    const statement = head.split(';').pop()!.trim()
    if (!statement.startsWith('@')) {
      found.push({
        selectors: statement.split(',').map((one) => one.trim()),
        body: text.slice(open + 1, close - 1),
      })
    }
    at = close
  }
  return found
}

/**
 * The custom properties of the page's root element, `<html class="lm-root" data-lm-theme="…">`,
 * as the cascade leaves them: the kit's stylesheet first, then the site's, the more specific
 * selector winning and the later of two equals.
 */
function rootTokens(scheme: string): Map<string, string> {
  const parts = new Set([
    ':root',
    'html',
    '.lm-root',
    '[data-lm-theme]',
    `[data-lm-theme='${scheme}']`,
  ])
  const sheets = [read('../../../src/react/styles.css'), read('../../src/styles/site.css')]
  const declared: { weight: number; name: string; value: string }[] = []
  for (const rule of sheets.flatMap(rules)) {
    for (const selector of rule.selectors) {
      const compound = selector.match(/:root|html|\.[\w-]+|\[[^\]]+\]/g) ?? []
      if (compound.join('') !== selector || !compound.every((part) => parts.has(part))) continue
      const weight = compound.filter((part) => part !== 'html').length
      for (const [, name, value] of rule.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
        declared.push({ weight, name: name!, value: value!.trim() })
      }
    }
  }
  const tokens = new Map<string, string>()
  // A stable sort: equal weights stay in the order the sheets give them.
  for (const one of declared.sort((a, b) => a.weight - b.weight)) tokens.set(one.name, one.value)
  return tokens
}

/** A token's colour as `#rrggbb`, following `var()` to its end. */
function colourOf(tokens: Map<string, string>, name: string): string {
  let value = tokens.get(name) ?? ''
  for (let hop = 0; hop < 8; hop += 1) {
    const next = /^var\((--[\w-]+)\)$/.exec(value)?.[1]
    if (!next) break
    value = tokens.get(next) ?? ''
  }
  expect(value, `${name} resolves to a plain colour`).toMatch(/^#[0-9a-f]{6}$/i)
  return value
}

const linear = (hex: string) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]

/** The contrast ratio of two colours, 1 to 21, by relative luminance. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [a, b]
    .map(linear)
    .map(([r, g, bl]) => 0.2126 * r + 0.7152 * g + 0.0722 * bl)
    .sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** A colour in the Oklab space, where equal distances look about equally far apart. */
function oklab(hex: string): [number, number, number] {
  const [r, g, b] = linear(hex)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
const apart = (a: string, b: string) => {
  const [p, q] = [oklab(a), oklab(b)]
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
}

describe.each(['paper', 'graphite'])('the six roles in the %s scheme', (scheme) => {
  const tokens = rootTokens(scheme)
  const role = Object.fromEntries(ROLES.map((one) => [one, colourOf(tokens, ROLE_VAR[one])]))
  // What a figure may stand on: the page, a panel, and the sunken bed of a picture.
  const grounds = ['--lm-bg', '--lm-panel', '--lm-sunken'].map((name) => colourOf(tokens, name))

  it('has a colour for each', () => {
    expect(Object.keys(role)).toEqual(['in', 'out', 'ctl', 'alt', 'alt2', 'alt3'])
  })

  // A term of an equation is set in its role's colour, so each must do as text: 4.5 to 1.
  it.each(ROLES)('%s stands off every ground a figure is drawn on', (one) => {
    for (const ground of grounds) expect(contrast(role[one]!, ground)).toBeGreaterThanOrEqual(4.5)
  })

  // About 0.02 in Oklab is the least step an eye sees between two patches side by side. Two
  // thin lines that cross need several times that.
  it('keeps every two roles apart', () => {
    const near: string[] = []
    for (const [i, a] of ROLES.entries()) {
      for (const b of ROLES.slice(i + 1)) {
        const distance = apart(role[a]!, role[b]!)
        if (distance < 0.15) near.push(`${a} and ${b}: ${distance.toFixed(3)}`)
      }
    }
    expect(near).toEqual([])
  })
})

describe('the numbers of a canvas figure', () => {
  it('are set in the mono family of the page', () => {
    vi.stubGlobal('document', { documentElement: { getAttribute: () => 'a scheme of the test' } })
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: (name: string) =>
        name === '--lm-font-mono' ? ' "Face Of The Page", monospace ' : '',
    }))
    const fonts: string[] = []
    const canvas = {
      font: '',
      fillText: () => fonts.push(canvas.font),
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      strokeRect() {},
    }
    const context = canvas as unknown as CanvasRenderingContext2D
    const axis = { min: 0, max: 1 }
    // As a figure is painted: the page's values are read, then the grid is drawn.
    drawGrid(
      context,
      colours(),
      200,
      100,
      { axis, at: (value) => value * 200 },
      { axis, at: (value) => value * 100 },
    )
    expect(fonts.length).toBeGreaterThan(3)
    expect(new Set(fonts)).toEqual(new Set(['10px "Face Of The Page", monospace']))
  })
})
