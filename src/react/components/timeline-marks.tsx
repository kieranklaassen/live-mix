// The small marks a timeline draws over its lanes and its ruler: the bracket
// that joins linked lanes, the wash of a range of time, the seam where a gap
// was closed and its notch on the ruler, and the square over a transition.
// Each places itself absolutely from px the host gives it.

import { type CSSProperties, type HTMLAttributes } from 'react'

import { cx } from './tokens'

interface MarkProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  'data-testid'?: string
}

export interface LinkMarkProps extends MarkProps {
  /** Px from the top of the lane heads to the first linked head. */
  top: number
  /** Px from there to the bottom of the last. */
  height: number
}

/** The bracket on the lane heads of one link group. */
export function LinkMark({ top, height, className, style, ...rest }: LinkMarkProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('lm-link', className)}
      style={{ top, height, ...style }}
      {...rest}
    />
  )
}

export interface RangeSelectionProps extends MarkProps {
  x: number
  width: number
  /** Full strength on the ruler, half through the lanes (default `ruler`). */
  strength?: 'ruler' | 'lane'
}

/** A range of time that is selected: an accent wash, not an outline. */
export function RangeSelection({
  x,
  width,
  strength = 'ruler',
  className,
  style,
  ...rest
}: RangeSelectionProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('lm-range', strength === 'lane' && 'lm-range--lane', className)}
      style={{ left: x, width: Math.max(0, width), ...style }}
      {...rest}
    />
  )
}

export interface CutSeamProps extends MarkProps {
  x: number
  /** Px from the top of the field to the first lane it joins. */
  top: number
  height: number
  /** What was removed, for a host that shows it. */
  label?: string
}

/** Where a gap was closed inside one source: a dashed line through the lanes it joins. */
export function CutSeam({ x, top, height, label, className, style, ...rest }: CutSeamProps) {
  return (
    <div
      className={cx('lm-seam', className)}
      style={{ left: x, top, height, ...style }}
      title={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    />
  )
}

export interface CutNotchProps extends MarkProps {
  x: number
  label?: string
}

/** The seam's notch on the ruler: 7 by 4 px, where a host hangs "what was removed" and Restore. */
export function CutNotch({ x, label, className, style, ...rest }: CutNotchProps) {
  return (
    <div
      className={cx('lm-ruler__cut', className)}
      style={{ left: x, ...style }}
      title={label}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    />
  )
}

export interface TransitionMarkProps extends MarkProps {
  /** As wide as the transition lasts; never drawn narrower than 12 px. */
  width: number
  height: number
  label?: string
}

/** The narrowest a transition's square is drawn. */
export const TRANSITION_MIN_PX = 12

/** A square with a cross over the cut a transition sits on. */
export function TransitionMark({
  width,
  height,
  label,
  className,
  style,
  ...rest
}: TransitionMarkProps) {
  const size: CSSProperties = { width: Math.max(TRANSITION_MIN_PX, width), height }
  return (
    <div
      className={cx('lm-xfade', className)}
      style={{ ...size, ...style }}
      title={label}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    />
  )
}
