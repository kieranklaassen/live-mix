// A 10 px glyph for a thing that is not a kind of sound: a picture source, a
// layer, a zoom, a transport or a panel. Drawn by `SoundIcon`'s rules (a 10 by
// 10 box, a 1 px line, round caps, `currentColor`), so the two sit in one row
// as one family. Give it a `kind` from the table or a path of your own as `d`.

import { type CSSProperties } from 'react'

import { cx } from './tokens'

/** The path of each kind, in the 10 by 10 box. */
export const GLYPHS = {
  // Sources
  display: 'M1.5 2.5h7v5h-7zM3.5 9h3',
  webcam: 'M2 4.5a3 3 0 1 0 6 0a3 3 0 1 0-6 0M4 4.5a1 1 0 1 0 2 0a1 1 0 1 0-2 0M3 9h4',
  microphone: 'M4 2.5a1 1 0 0 1 2 0v2.5a1 1 0 0 1-2 0zM2.5 5a2.5 2.5 0 0 0 5 0M5 7.5V9',
  'system-audio': 'M1.5 4h1.5l2-2v6l-2-2H1.5zM6.7 3.6a2 2 0 0 1 0 2.8M8 2.3a4 4 0 0 1 0 5.4',
  music:
    'M3.5 7.5V2.5l4-1v5M3.5 7.5a1 1 0 1 1-2 0a1 1 0 0 1 2 0M7.5 6.5a1 1 0 1 1-2 0a1 1 0 0 1 2 0',
  voiceover: 'M5 1.5v4M3 3.5v2a2 2 0 0 0 4 0v-2M5 7.5V9M1.5 4v1.5M8.5 4v1.5',
  // Layers
  title: 'M2 2.5h6M5 2.5v6',
  'lower-third': 'M1.5 2h7v6h-7zM3 6.5h4',
  callout: 'M1.5 2h7v4.5H5L3 8.5v-2H1.5z',
  arrow: 'M2 8L8 2M4.5 2H8v3.5',
  // The look
  zoom: 'M1.5 3.5v-2h2M6.5 1.5h2v2M8.5 6.5v2h-2M3.5 8.5h-2v-2',
  layout: 'M1.5 2h7v6h-7zM5.5 5h3',
  follows: 'M2.5 1.5l5 3.5l-2.2.4L6.5 8l-1 .5l-1.2-2.6L2.5 7.5z',
  point: 'M5 1.5v7M1.5 5h7',
  return: 'M8 2v3.5H2.5M4.5 3.5l-2 2l2 2',
  // Acts
  undo: 'M2.5 2v3h3M2.5 5a3.2 3.2 0 1 1 1 2.6',
  redo: 'M7.5 2v3h-3M7.5 5a3.2 3.2 0 1 0-1 2.6',
  play: 'M3 2l5 3l-5 3z',
  pause: 'M3.5 2v6M6.5 2v6',
  start: 'M2 2h1v6H2zM8 2L3.5 5L8 8z',
  add: 'M5 2v6M2 5h6',
  close: 'M2.5 2.5l5 5M7.5 2.5l-5 5',
  copy: 'M3.5 3.5h5v5h-5zM1.5 6.5v-5h5',
  find: 'M4.5 1.5a3 3 0 1 0 0 6a3 3 0 0 0 0-6M6.7 6.7L8.5 8.5',
  // Marks the kit's own elements draw
  tick: 'M2 5.5l2 2l4-5',
  sent: 'M2 5h6M5.5 2.5L8 5L5.5 7.5',
  note: 'M2 2h6v6H2zM4 4h2M4 6h2',
  info: 'M5 4.5V8M5 2.2v.4',
  alert: 'M5 2v3.8M5 7.6v.4',
  // Panels
  transcript: 'M2 2.5h6M2 5h6M2 7.5h4',
  inspector: 'M2 3h6M2 7h6M4 2v2M6.5 6v2',
  agent: 'M2 2h6v6H2zM4.5 4.5h1v1h-1z',
} as const

export type GlyphKind = keyof typeof GLYPHS

export interface GlyphProps {
  /** One of the kit's glyphs. */
  kind?: GlyphKind
  /** A path of your own, in the 10 by 10 box; wins over `kind`. */
  d?: string
  /** Fill the shape instead of drawing its line (a play triangle, a flag). */
  filled?: boolean
  /** Px size of the square (default 10). */
  size?: number
  /** Accessible name; without it the glyph is decorative. */
  label?: string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

export function Glyph({
  kind,
  d,
  filled = false,
  size = 10,
  label,
  className,
  style,
  'data-testid': testId,
}: GlyphProps) {
  const path = d ?? (kind ? GLYPHS[kind] : '')
  return (
    <svg
      className={cx(
        'lm-glyph',
        kind && `lm-glyph--${kind}`,
        filled && 'lm-glyph--filled',
        className,
      )}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 10 10"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-testid={testId}
    >
      <path d={path} />
    </svg>
  )
}
