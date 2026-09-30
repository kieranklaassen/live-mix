// A 10 px glyph for the kind of sound a sample is (from `analyzeSound`), plus
// the two marks a stroke's tag uses beside it: loop and reverse. Stroked in
// `currentColor`, so it takes the colour of the text it sits in.

import { type CSSProperties, type ReactNode } from 'react'

import { type SoundKind } from '../../core/analysis/sound-kind'
import { cx } from './tokens'

export type SoundIconKind = SoundKind | 'loop' | 'reverse'

/** What each kind is called in the UI. */
export const SOUND_KIND_LABELS: Record<SoundIconKind, string> = {
  texture: 'Texture',
  pad: 'Pad',
  drone: 'Drone',
  oneshot: 'One-shot',
  melodic: 'Melodic',
  beat: 'Beat loop',
  loop: 'Loops',
  reverse: 'Reversed',
}

const GLYPHS: Record<SoundIconKind, ReactNode> = {
  // A swell.
  pad: <path d="M1 8C3 2 7 2 9 8" />,
  // An attack and its tail.
  oneshot: <path d="M1 8V2L4 6.5L9 8" />,
  // Strong and weak beats.
  beat: <path d="M1.5 2V8M4 5V8M6.5 2V8M9 5V8" />,
  // Grain.
  texture: <path d="M2 3h.01M5 2.5h.01M8 3.5h.01M3 6h.01M6 5.5h.01M8.5 7h.01M4.5 8h.01" />,
  // Two held lines.
  drone: <path d="M1 3.5H9M1 6.5H9" />,
  // A note.
  melodic: (
    <>
      <path d="M5.5 7.5V2L8.5 3" />
      <circle cx="4" cy="7.5" r="1.5" />
    </>
  ),
  loop: (
    <path d="M2 6V4.5a1.5 1.5 0 0 1 1.5-1.5H8M6.5 1.5L8 3L6.5 4.5M8 4v1.5a1.5 1.5 0 0 1-1.5 1.5H2M3.5 8.5L2 7L3.5 5.5" />
  ),
  reverse: <path d="M9 5H2M4.5 2.5L2 5L4.5 7.5" />,
}

export interface SoundIconProps {
  kind: SoundIconKind
  /** Px size of the square (default 10). */
  size?: number
  /** Accessible name; without it the icon is decorative. */
  label?: string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

export function SoundIcon({
  kind,
  size = 10,
  label,
  className,
  style,
  'data-testid': testId,
}: SoundIconProps) {
  return (
    <svg
      className={cx('lm-sound-icon', `lm-sound-icon--${kind}`, className)}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth={kind === 'texture' ? 1.6 : 1}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-testid={testId}
    >
      {GLYPHS[kind]}
    </svg>
  )
}
