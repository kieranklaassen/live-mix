// The kit's eight brushes: the six it had, then a red (7) and a purple (8), in
// every theme it ships, each one readable on a lane and with its ink.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { brushIndex } from '../components/Lane'
import { BRUSH_COUNT, LM_TOKENS, themes, type LiveMixThemeName } from '../components/tokens'
import asItWas from './brushes-as-at-af3778ea.json'

const NAMES = Object.keys(themes) as LiveMixThemeName[]
const css = (): Promise<string> =>
  readFile(join(dirname(fileURLToPath(import.meta.url)), '../styles.css'), 'utf8')

function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16)) as [number, number, number]
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const share = channel / 255
    return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/** `share` of `top` over `ground`, as `color-mix(in srgb, …)` works it out. */
function mix(top: string, ground: string, share: number): string {
  const a = channels(top)
  const b = channels(ground)
  return `#${a
    .map((x, at) =>
      Math.round(x * share + b[at] * (1 - share))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

function hue(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => channel / 255)
  const most = Math.max(r, g, b)
  const span = most - Math.min(r, g, b)
  if (span === 0) return 0
  const sixth =
    most === r ? ((g - b) / span) % 6 : most === g ? (b - r) / span + 2 : (r - g) / span + 4
  return (sixth * 60 + 360) % 360
}

function hueApart(a: string, b: string): number {
  const apart = Math.abs(hue(a) - hue(b))
  return Math.min(apart, 360 - apart)
}

const NEW = [7, 8] as const

describe('the kit has eight brushes', () => {
  it('counts eight, and lists brush-1 to brush-8 and their inks among its tokens', () => {
    expect(BRUSH_COUNT).toBe(8)
    for (let n = 1; n <= 8; n++) {
      expect(LM_TOKENS).toContain(`brush-${n}`)
      expect(LM_TOKENS).toContain(`brush-ink-${n}`)
    }
  })

  it('every theme defines brush-1 to brush-8 and brush-ink-1 to brush-ink-8', () => {
    for (const name of NAMES) {
      for (let n = 1; n <= 8; n++) {
        expect(themes[name][`brush-${n}` as 'brush-1'], `${name} brush-${n}`).toMatch(
          /^#[0-9a-f]{6}$/i,
        )
        expect(themes[name][`brush-ink-${n}` as 'brush-ink-1'], `${name} brush-ink-${n}`).toMatch(
          /^#[0-9a-f]{6}$/i,
        )
      }
    }
  })

  it('a number wraps by eight: 7 is red, 8 purple, 9 the first again', () => {
    expect(brushIndex(7)).toBe(7)
    expect(brushIndex(8)).toBe(8)
    expect(brushIndex(9)).toBe(1)
    expect(brushIndex(0)).toBe(8)
    expect(brushIndex(-1)).toBe(7)
  })

  it('brushes 1 to 6 keep the values they had at af3778ea, in every theme', () => {
    expect(Object.keys(asItWas).sort()).toEqual([...NAMES].sort())
    for (const name of NAMES) {
      const was = asItWas[name] as Record<string, string>
      for (const [token, value] of Object.entries(was)) {
        expect(themes[name][token as 'brush-1'].toLowerCase(), `${name} ${token}`).toBe(value)
      }
    }
  })

  // A brush is drawn as the edge of a stroke and the dot on a head, on the
  // lane's ground (the field is `sunken`); its ink draws a stroke's name and
  // detail. The floors: the brush 3 to 1 on the ground, the ink 4.5 to 1 on
  // the brush and on the stroke's wash (9% of the brush over the ground).
  it.each(['graphite', 'paper'] as const)('red and purple hold their floors in %s', (name) => {
    const theme = themes[name]
    for (const n of NEW) {
      const brush = theme[`brush-${n}`]
      const ink = theme[`brush-ink-${n}`]
      expect(contrast(brush, theme.sunken), `brush-${n} on the lane`).toBeGreaterThanOrEqual(3)
      expect(contrast(ink, brush), `ink-${n} on brush-${n}`).toBeGreaterThanOrEqual(4.5)
      expect(
        contrast(ink, mix(brush, theme.sunken, 0.09)),
        `ink-${n} on its wash`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('red and purple hold the same floors in every other theme', () => {
    for (const name of NAMES) {
      const theme = themes[name]
      for (const n of NEW) {
        const brush = theme[`brush-${n}`]
        const ink = theme[`brush-ink-${n}`]
        expect(contrast(brush, theme.sunken), `${name} brush-${n}`).toBeGreaterThanOrEqual(3)
        expect(contrast(ink, brush), `${name} ink-${n} on the brush`).toBeGreaterThanOrEqual(4.5)
        expect(
          contrast(ink, mix(brush, theme.sunken, 0.09)),
          `${name} ink-${n} on the wash`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('the red is told apart from the error colour and the record light by its hue', () => {
    for (const name of NAMES) {
      const theme = themes[name]
      expect(
        hueApart(theme['brush-7'], theme.danger),
        `${name} red and danger`,
      ).toBeGreaterThanOrEqual(12)
      expect(
        hueApart(theme['brush-7'], theme.record),
        `${name} red and record`,
      ).toBeGreaterThanOrEqual(12)
    }
  })

  it('red is a red and purple a purple, in every theme', () => {
    for (const name of NAMES) {
      const red = hue(themes[name]['brush-7'])
      expect(red >= 340 || red <= 15, `${name} red at ${red.toFixed(0)}°`).toBe(true)
      const purple = hue(themes[name]['brush-8'])
      expect(purple >= 255 && purple <= 300, `${name} purple at ${purple.toFixed(0)}°`).toBe(true)
    }
  })

  it('no two of the eight brushes of a theme are the same colour, and a note is none of them', () => {
    for (const name of NAMES) {
      const theme = themes[name]
      const brushes = [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
        theme[`brush-${n}` as 'brush-1'].toLowerCase(),
      )
      expect(new Set(brushes).size, name).toBe(8)
      expect(brushes, name).not.toContain(theme.note.toLowerCase())
    }
  })

  it('the stylesheet carries brush 7 and 8 and their inks in the default blocks', async () => {
    const sheet = await css()
    for (const [selector, theme] of [
      [":root,\n.lm-root,\n[data-lm-theme='light']", themes['jaxa-zen']],
      ["[data-lm-theme='dark'],\n.lm-dark", themes['jaxa-zen-dark']],
    ] as const) {
      const at = sheet.indexOf(`${selector} {`)
      expect(at, selector).toBeGreaterThanOrEqual(0)
      const block = sheet.slice(at, sheet.indexOf('}', at))
      for (const n of NEW) {
        expect(block, `${selector} brush-${n}`).toContain(
          `--lm-brush-${n}: ${theme[`brush-${n}`].toLowerCase()};`,
        )
        expect(block, `${selector} brush-ink-${n}`).toContain(
          `--lm-brush-ink-${n}: ${theme[`brush-ink-${n}`].toLowerCase()};`,
        )
      }
    }
  })

  it('the stylesheet has a swatch, a stroke, a video stroke and a row swatch for each of the eight', async () => {
    const sheet = await css()
    for (let n = 2; n <= 8; n++) {
      for (const part of ['lm-swatch', 'lm-stroke', 'lm-vstroke', 'lm-row__swatch']) {
        expect(sheet, `.${part}--b${n}`).toMatch(
          new RegExp(`\\.${part}--b${n} \\{[^}]*--lm-brush-${n}\\)`),
        )
      }
    }
  })
})
