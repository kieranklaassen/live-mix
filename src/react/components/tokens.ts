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
  'transition',
] as const

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
  transition: '80ms',
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
}

export const themes = {
  'jaxa-zen': jaxaZenLight,
  'jaxa-zen-dark': jaxaZenDark,
  'ambient-water': ambientWater,
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
