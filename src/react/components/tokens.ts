// Design tokens of the kit: every colour, size and font a component reads is
// a `--lm-*` CSS variable, so hosts theme by setting variables (on `:root`,
// on a wrapper, or inline through `themeStyle`) and never by overriding
// component rules. `styles.css` ships the same defaults for consumers that
// import the stylesheet; the presets here serve consumers that do not.

import { type CSSProperties } from 'react'

/** Every CSS variable the components read (without the `--lm-` prefix). */
export const LM_TOKENS = [
  // Colour
  'bg',
  'panel',
  'raised',
  'sunken',
  'border',
  'hairline',
  'text',
  'muted',
  'dim',
  'accent',
  'accent-soft',
  'control-value',
  'danger',
  'solo',
  'mute',
  'meter',
  'meter-hot',
  'meter-rms',
  'meter-lufs',
  'meter-track',
  'meter-border',
  'playhead',
  'clip',
  'clip-border',
  'clip-active',
  'focus',
  // Paint field: grid lines, the automation line, and the brush palette
  // (`brush-N` paints a stroke, `brush-ink-N` draws detail and text on it).
  'grid-line',
  'grid-line-strong',
  'rule',
  'automation',
  'brush-1',
  'brush-2',
  'brush-3',
  'brush-4',
  'brush-5',
  'brush-6',
  'brush-ink-1',
  'brush-ink-2',
  'brush-ink-3',
  'brush-ink-4',
  'brush-ink-5',
  'brush-ink-6',
  // Type
  'font',
  'font-mono',
  'font-size',
  'label-size',
  // Geometry
  'radius',
  'space-1',
  'space-2',
  'space-3',
  'knob-size',
  'fader-width',
  'fader-height',
  'meter-width',
  'strip-width',
  'stroke',
  'lane-height',
  'row',
  'col',
  'transition',
] as const

/** How many brush colours a theme carries (`brush-1` … `brush-6`). */
export const BRUSH_COUNT = 6

export type LiveMixToken = (typeof LM_TOKENS)[number]

/** A full or partial token set, values as CSS text. */
export type LiveMixTheme = Partial<Record<LiveMixToken, string>>

/** Tokens shared by every preset: type and geometry. */
const geometry: LiveMixTheme = {
  font: "ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
  'font-mono': "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  'font-size': '11px',
  'label-size': '9px',
  radius: '1px',
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'knob-size': '44px',
  'fader-width': '20px',
  'fader-height': '120px',
  'meter-width': '6px',
  'strip-width': '76px',
  stroke: '2px',
  'lane-height': '44px',
  row: '20px',
  col: '40px',
  transition: '80ms',
}

/**
 * Geometry of the grid themes (`graphite`, `paper`, `water`): everything sits on a
 * 40 × 20 px module, corners are square, a knob fills one column, and the
 * type is a regular-weight geometric sans (Jost first, because Futura's
 * regular face on macOS is Medium and reads bold at 11 px).
 */
const gridGeometry: LiveMixTheme = {
  ...geometry,
  font: "Jost, Futura, 'Futura PT', 'Century Gothic', ui-sans-serif, system-ui, sans-serif",
  'font-mono': "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  radius: '0px',
  'knob-size': '28px',
  'fader-width': '12px',
  'fader-height': '40px',
  stroke: '1.5px',
  'lane-height': '40px',
}

/**
 * The default theme: JAXA-Zen — Paper White surfaces, Ceramic Grey panels,
 * Obsidian ink, Vermillion for accents and the playhead.
 */
export const jaxaZenLight: Required<LiveMixTheme> = {
  ...(geometry as Required<LiveMixTheme>),
  bg: '#FDFDFB',
  panel: '#F4F4F0',
  raised: '#FFFFFF',
  sunken: '#E9E9E4',
  border: '#D6D6D0',
  hairline: '#C4C4BE',
  text: '#1A1A1A',
  muted: '#6B6B66',
  dim: '#A3A39D',
  accent: '#E63946',
  'accent-soft': 'rgba(230, 57, 70, 0.18)',
  'control-value': '#1A1A1A',
  danger: '#E63946',
  solo: '#D9A400',
  mute: '#1A1A1A',
  meter: '#1A1A1A',
  'meter-hot': '#E63946',
  'meter-rms': '#6B6B66',
  'meter-lufs': '#3D5A80',
  'meter-track': '#E9E9E4',
  'meter-border': 'transparent',
  playhead: '#E63946',
  clip: '#FFFFFF',
  'clip-border': '#1A1A1A',
  'clip-active': 'rgba(230, 57, 70, 0.18)',
  focus: '#E63946',
  'grid-line': '#ECECE7',
  'grid-line-strong': '#D6D6D0',
  rule: '#6B6B66',
  automation: '#A8501C',
  'brush-1': '#7BBAB8',
  'brush-2': '#5B9BB0',
  'brush-3': '#ADC088',
  'brush-4': '#79A570',
  'brush-5': '#CDD77F',
  'brush-6': '#B4C0BA',
  'brush-ink-1': '#2A6664',
  'brush-ink-2': '#1F5568',
  'brush-ink-3': '#566C30',
  'brush-ink-4': '#335A2C',
  'brush-ink-5': '#6F7B24',
  'brush-ink-6': '#55625C',
}

/** The same palette on Obsidian, for `data-lm-theme="dark"`. */
export const jaxaZenDark: Required<LiveMixTheme> = {
  ...jaxaZenLight,
  bg: '#141414',
  panel: '#1A1A1A',
  raised: '#242424',
  sunken: '#0E0E0E',
  border: '#2E2E2E',
  hairline: '#3A3A3A',
  text: '#FDFDFB',
  muted: '#9A9A94',
  dim: '#5E5E5A',
  'control-value': '#F4F4F0',
  mute: '#FDFDFB',
  meter: '#F4F4F0',
  'meter-rms': '#9A9A94',
  'meter-lufs': '#98C1D9',
  'meter-track': '#0E0E0E',
  clip: '#242424',
  'clip-border': '#F4F4F0',
  'grid-line': '#1C1C1C',
  'grid-line-strong': '#2E2E2E',
  rule: '#000000',
  automation: '#F2B872',
  'brush-1': '#5FB3A6',
  'brush-2': '#5A9AC0',
  'brush-3': '#A9B060',
  'brush-4': '#6FA070',
  'brush-5': '#D0B860',
  'brush-6': '#8F9994',
  'brush-ink-1': '#B4ECE2',
  'brush-ink-2': '#ADD5EE',
  'brush-ink-3': '#E2E8A8',
  'brush-ink-4': '#B3DCB4',
  'brush-ink-5': '#F2E0A2',
  'brush-ink-6': '#CFD7D3',
}

/** ambient-live's water/moss/sage `al-*` palette mapped onto the kit's tokens. */
export const ambientWater: Required<LiveMixTheme> = {
  ...jaxaZenDark,
  bg: '#0e1c1a',
  panel: '#173028',
  raised: '#214038',
  sunken: '#0b1614',
  border: '#071210',
  hairline: '#3a534c',
  text: '#d7e4df',
  muted: '#8eaaa1',
  dim: '#5d756d',
  accent: '#5fafa0',
  'accent-soft': '#5fafa045',
  'control-value': '#dceae4',
  danger: '#d27a7a',
  solo: '#d9c36a',
  mute: '#d7e4df',
  meter: '#5fafa0',
  'meter-hot': '#d27a7a',
  'meter-rms': '#8eaaa1',
  'meter-lufs': '#7aa6c2',
  'meter-track': '#0b1614',
  playhead: '#5fafa0',
  clip: '#214038',
  'clip-border': '#5fafa0',
  'clip-active': '#5fafa045',
  focus: '#5fafa0',
  'grid-line': '#11221f',
  'grid-line-strong': '#1f3a34',
  rule: '#050d0c',
  automation: '#f2c27a',
  'brush-1': '#6fb3b0',
  'brush-2': '#5a93ad',
  'brush-3': '#a5b98a',
  'brush-4': '#7fa37a',
  'brush-5': '#c4cf86',
  'brush-6': '#8aa39c',
  'brush-ink-1': '#bde6e2',
  'brush-ink-2': '#aed3e6',
  'brush-ink-3': '#dbe7c6',
  'brush-ink-4': '#bcdab6',
  'brush-ink-5': '#e8eebe',
  'brush-ink-6': '#c9d9d3',
}

/**
 * Graphite: the dark grid theme. Neutral green-grey surfaces, a mint accent,
 * and brush colours bright enough to read as paint on the dark field.
 */
export const graphite: Required<LiveMixTheme> = {
  ...jaxaZenDark,
  ...(gridGeometry as Required<LiveMixTheme>),
  bg: '#232826',
  panel: '#2a302d',
  raised: '#3a413d',
  sunken: '#1e2220',
  border: '#141816',
  hairline: '#4a524e',
  text: '#e2e7e4',
  muted: '#a2aca7',
  dim: '#7d8782',
  accent: '#7fd0bd',
  'accent-soft': '#7fd0bd33',
  'control-value': '#f0f4f2',
  danger: '#e07a6a',
  solo: '#e0c05a',
  mute: '#e2e7e4',
  meter: '#7fd0bd',
  'meter-hot': '#e07a6a',
  'meter-rms': '#a2aca7',
  'meter-lufs': '#8fb3cf',
  'meter-track': '#161a18',
  'meter-border': 'transparent',
  playhead: '#f0f4f2',
  clip: '#3a413d',
  'clip-border': '#7fd0bd',
  'clip-active': '#7fd0bd33',
  focus: '#7fd0bd',
  'grid-line': '#272d2a',
  'grid-line-strong': '#3a423e',
  rule: '#0f1211',
  automation: '#f2b872',
  'brush-1': '#5fb3a6',
  'brush-2': '#5a9ac0',
  'brush-3': '#a9b060',
  'brush-4': '#6fa070',
  'brush-5': '#d0b860',
  'brush-6': '#8f9994',
  'brush-ink-1': '#b4ece2',
  'brush-ink-2': '#add5ee',
  'brush-ink-3': '#e2e8a8',
  'brush-ink-4': '#b3dcb4',
  'brush-ink-5': '#f2e0a2',
  'brush-ink-6': '#cfd7d3',
}

/** Paper: the light grid theme. Off-white paper, ink rules, water-to-grass paint. */
export const paper: Required<LiveMixTheme> = {
  ...jaxaZenLight,
  ...(gridGeometry as Required<LiveMixTheme>),
  bg: '#f4f5f0',
  panel: '#f4f5f0',
  raised: '#fcfcfa',
  sunken: '#fbfbf8',
  border: '#c4ccbf',
  hairline: '#b9c2b3',
  text: '#1b2622',
  muted: '#55645c',
  dim: '#66736b',
  accent: '#2e6f63',
  'accent-soft': '#2e6f6326',
  'control-value': '#1b2622',
  danger: '#b04a3c',
  solo: '#d9b13a',
  mute: '#1b2622',
  meter: '#2e6f63',
  'meter-hot': '#b04a3c',
  'meter-rms': '#8fa89c',
  'meter-lufs': '#4f7390',
  'meter-track': '#e3e7de',
  'meter-border': 'transparent',
  playhead: '#1b2622',
  clip: '#fcfcfa',
  'clip-border': '#1b2622',
  'clip-active': '#2e6f6326',
  focus: '#2e6f63',
  'grid-line': '#e6e9e0',
  'grid-line-strong': '#c9d0c4',
  rule: '#55645c',
  automation: '#a8501c',
  'brush-1': '#7bbab8',
  'brush-2': '#5b9bb0',
  'brush-3': '#adc088',
  'brush-4': '#79a570',
  'brush-5': '#cdd77f',
  'brush-6': '#b4c0ba',
  'brush-ink-1': '#2a6664',
  'brush-ink-2': '#1f5568',
  'brush-ink-3': '#566c30',
  'brush-ink-4': '#335a2c',
  'brush-ink-5': '#6f7b24',
  'brush-ink-6': '#55625c',
}

/** Water: `ambientWater`'s deep water/moss palette on the grid geometry. */
export const water: Required<LiveMixTheme> = {
  ...ambientWater,
  ...(gridGeometry as Required<LiveMixTheme>),
  panel: '#132622',
  dim: '#6f8a81',
}

export const themes = {
  'jaxa-zen': jaxaZenLight,
  'jaxa-zen-dark': jaxaZenDark,
  'ambient-water': ambientWater,
  graphite,
  paper,
  water,
} as const

export type LiveMixThemeName = keyof typeof themes

/** The CSS variable name of a token. */
export function tokenVar(token: LiveMixToken): `--lm-${LiveMixToken}` {
  return `--lm-${token}`
}

/** `var(--lm-token, fallback)` — what components put in inline styles and SVG attributes. */
export function tokenRef(token: LiveMixToken, fallback?: string): string {
  return fallback === undefined ? `var(--lm-${token})` : `var(--lm-${token}, ${fallback})`
}

/**
 * Inline style declaring a theme's tokens, for hosts that set variables on a
 * wrapper element instead of importing `styles.css`.
 */
export function themeStyle(theme: LiveMixTheme): CSSProperties {
  const style: Record<string, string> = {}
  for (const [token, value] of Object.entries(theme)) {
    if (value !== undefined) style[`--lm-${token}`] = value
  }
  return style
}

/** Join class names, dropping falsy entries. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}
