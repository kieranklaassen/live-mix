// Anything on a lane that is not media: one row tall and square, so it never
// reads as a stroke. Three shapes. A plate is something made (a title, a
// callout): a raised ground with a glyph, a name and readouts, its corners cut
// where it fades. An envelope is a change that eases in and out (a zoom): an
// outline whose slopes are the eases, with a glyph and an amount inside. A
// span is a state that holds from a moment on (a layout): a line at its
// start, a hatch as wide as its transition, a glyph and a name. Presentational:
// pointer handlers, `data-*` and the ref go to the root.

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

import { cx } from './tokens'

export type TimelineItemShape = 'plate' | 'envelope' | 'span'

/** How high an item is, and where an envelope's top edge sits in it. */
export const TIMELINE_ITEM_HEIGHT = 20
const ENVELOPE_TOP = 3.5
const ENVELOPE_BOTTOM = TIMELINE_ITEM_HEIGHT - 0.5

/** The outline of an envelope `width` px long whose eases are `rampIn` and `rampOut` px. */
export function envelopePath(width: number, rampIn = 0, rampOut = 0): string {
  const w = Math.max(0, width)
  // The two slopes share the length between them when they would cross.
  const total = rampIn + rampOut
  const scale = total > w && total > 0 ? w / total : 1
  const inX = Math.max(0, rampIn) * scale
  const outX = w - Math.max(0, rampOut) * scale
  return `M0 ${ENVELOPE_BOTTOM}L${inX} ${ENVELOPE_TOP}H${outX}L${w} ${ENVELOPE_BOTTOM}Z`
}

export interface TimelineItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Px length: the item's time on the field's scale. */
  width: number
  shape?: TimelineItemShape
  /** Rendered before the name (a `Glyph`). */
  glyph?: ReactNode
  name?: string
  /** Short readouts after the name: `attached`, an amount. */
  tags?: readonly string[]
  /** A plate that fades in or out has that corner cut; any length above 0 cuts it. */
  fadeIn?: number
  fadeOut?: number
  /** Px: an envelope's slopes, or the width of a span's hatch. */
  rampIn?: number
  rampOut?: number
  selected?: boolean
  muted?: boolean
  'data-testid'?: string
}

export const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(function TimelineItem(
  {
    width,
    shape = 'plate',
    glyph,
    name,
    tags,
    fadeIn = 0,
    fadeOut = 0,
    rampIn = 0,
    rampOut = 0,
    selected = false,
    muted = false,
    className,
    style,
    ...rest
  },
  ref,
) {
  const w = Math.max(0, width)
  const label = (
    <>
      {glyph}
      {name ? <span className="lm-item__name">{name}</span> : null}
      {tags?.map((tag) => (
        <span key={tag} className="lm-item__meta">
          {tag}
        </span>
      ))}
    </>
  )
  return (
    <div
      ref={ref}
      className={cx(
        'lm-item',
        `lm-item--${shape}`,
        shape === 'plate' && fadeIn > 0 && 'lm-item--fade-in',
        shape === 'plate' && fadeOut > 0 && 'lm-item--fade-out',
        selected && 'lm-item--selected',
        muted && 'lm-item--muted',
        className,
      )}
      style={{ width: w, ...style }}
      {...rest}
    >
      {shape === 'envelope' ? (
        <>
          <svg
            className="lm-item__envelope"
            width={w}
            height={TIMELINE_ITEM_HEIGHT}
            viewBox={`0 0 ${w} ${TIMELINE_ITEM_HEIGHT}`}
            aria-hidden="true"
          >
            <path d={envelopePath(w, rampIn, rampOut)} />
          </svg>
          <span className="lm-item__tag">{label}</span>
          {selected ? (
            <>
              <span className="lm-item__grip lm-item__grip--start" aria-hidden="true" />
              <span className="lm-item__grip lm-item__grip--end" aria-hidden="true" />
            </>
          ) : null}
        </>
      ) : (
        <>
          {shape === 'span' && rampIn > 0 ? (
            <span
              className="lm-item__ramp"
              style={{ width: Math.min(rampIn, w) }}
              aria-hidden="true"
            />
          ) : null}
          {label}
        </>
      )}
    </div>
  )
})
