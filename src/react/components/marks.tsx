// Three small readouts: how far along something is, what state a thing is
// in, and who did something. Who is a shape, never a colour: a filled square
// is a person, an outlined square is the agent inside the app, a dashed square
// is an agent from outside.

import { type CSSProperties, type HTMLAttributes } from 'react'

import { clamp01 } from './control-math'
import { cx } from './tokens'

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 0 … 1. */
  value: number
  /** What is progressing, for a screen reader. */
  label: string
  'data-testid'?: string
}

/** A 6 px bar: the accent on the meter's track. */
export function Progress({ value, label, className, ...rest }: ProgressProps) {
  const share = Number.isFinite(value) ? clamp01(value) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(share * 100)}
      className={cx('lm-progress', className)}
      {...rest}
    >
      <span className="lm-progress__fill" style={{ width: `${share * 100}%` }} />
    </div>
  )
}

export type StateMarkState = 'off' | 'on' | 'busy' | 'failed'

export interface StateMarkProps {
  state: StateMarkState
  /** Accessible name; without it the mark is decorative and the words beside it say the state. */
  label?: string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

/** An 8 px square: empty, filled with the accent, outlined in it while busy, outlined in danger when failed. */
export function StateMark({
  state,
  label,
  className,
  style,
  'data-testid': testId,
}: StateMarkProps) {
  return (
    <span
      className={cx('lm-state', `lm-state--${state}`, className)}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-testid={testId}
    />
  )
}

export type Who = 'person' | 'agent' | 'outside'

/** What each shape is called. */
export const WHO_LABELS: Record<Who, string> = {
  person: 'A person',
  agent: 'The agent',
  outside: 'An outside agent',
}

export interface WhoMarkProps {
  who: Who
  /** Accessible name (default from `WHO_LABELS`); `''` makes the mark decorative. */
  label?: string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

/** An 8 px square: filled for a person, outlined for the agent, dashed for an agent from outside. */
export function WhoMark({ who, label, className, style, 'data-testid': testId }: WhoMarkProps) {
  const name = label ?? WHO_LABELS[who]
  return (
    <span
      className={cx('lm-who', `lm-who--${who}`, className)}
      style={style}
      role={name ? 'img' : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      data-testid={testId}
    />
  )
}
