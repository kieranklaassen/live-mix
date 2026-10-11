// The ruler over a timeline drawn to scale, and the playhead that crosses it.
// The ruler picks its ticks from the scale (`rulerScale`): minor ticks are a
// drawn pattern, labelled ticks are elements with the time on them. Children
// place themselves in px (a `Playhead`, a `RangeSelection`, a `CutNotch`).
// Presentational: pointer handlers, `role`, `aria-*`, `data-*` and the ref go
// to the root, so a host makes it a slider that seeks.

import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'

import { formatTimeSec } from './control-math'
import { rulerLabels, rulerScale } from './timeline-math'
import { cx } from './tokens'

export interface TimeRulerProps extends HTMLAttributes<HTMLDivElement> {
  /** Seconds at the left edge. */
  start?: number
  /** Px per second. */
  pxPerSecond: number
  /** Px width of the ruler. */
  width: number
  /** What a labelled tick says (default `formatTimeSec`). */
  format?: (seconds: number) => string
  children?: ReactNode
  'data-testid'?: string
}

export const TimeRuler = forwardRef<HTMLDivElement, TimeRulerProps>(function TimeRuler(
  { start = 0, pxPerSecond, width, format = formatTimeSec, className, style, children, ...rest },
  ref,
) {
  const { minorSec } = rulerScale(pxPerSecond)
  const minorPx = minorSec * pxPerSecond
  // The pattern starts on a whole minor tick, wherever the window starts.
  const offset = -((start * pxPerSecond) % minorPx)
  const vars: Record<string, string> = {
    '--lm-ruler-minor': `${minorPx}px`,
    '--lm-ruler-offset': `${offset}px`,
  }
  return (
    <div
      ref={ref}
      className={cx('lm-ruler', className)}
      style={{ width, ...(vars as CSSProperties), ...style }}
      {...rest}
    >
      {rulerLabels(start, width, pxPerSecond).map((tick) => (
        <span key={tick.time} className="lm-ruler__tick" style={{ left: tick.x }}>
          {format(tick.time)}
        </span>
      ))}
      {children}
    </div>
  )
})

export interface PlayheadProps extends HTMLAttributes<HTMLDivElement> {
  /** Px from the left edge of what it crosses. */
  x?: number
  /** Draw the flag: only the playhead in the ruler has one. */
  flag?: boolean
  'data-testid'?: string
}

/**
 * The 1 px line of the playhead. A host that moves it on every frame leaves
 * `x` out and sets `transform` on the ref instead of rendering.
 */
export const Playhead = forwardRef<HTMLDivElement, PlayheadProps>(function Playhead(
  { x, flag = false, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cx('lm-playhead', className)}
      style={x === undefined ? style : { left: x, ...style }}
      {...rest}
    >
      {flag ? <span className="lm-playhead__flag" /> : null}
    </div>
  )
})
