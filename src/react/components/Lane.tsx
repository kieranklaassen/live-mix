// A row of a timeline's field and the head that names it. A lane is one or
// two rows of the module high; its items place themselves in px along it. The
// head is `--lm-lane-head-width` wide: a brush swatch, a glyph, the name,
// mute and solo, and on a head two rows high a second row for a meter or a
// line of text. Presentational: the host owns what mute and solo do.

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

import { type MeterSource } from '../hooks/useMeter'
import { Meter } from './Meter'
import { ToggleButton } from './Toggle'
import { BRUSH_COUNT, cx } from './tokens'

/** The brush a number names, 1 … 6, wrapping as `Stroke` does. */
export function brushIndex(brush: number): number {
  return ((Math.round(brush) - 1 + BRUSH_COUNT * 100) % BRUSH_COUNT) + 1
}

export interface LaneProps extends HTMLAttributes<HTMLDivElement> {
  /** Px from the top of the field. */
  top: number
  /** One row of the module or two. */
  height: 20 | 40
  children?: ReactNode
  'data-testid'?: string
}

export const Lane = forwardRef<HTMLDivElement, LaneProps>(function Lane(
  { top, height, className, style, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('lm-lane', height === 40 && 'lm-lane--tall', className)}
      style={{ top, height, ...style }}
      {...rest}
    >
      {children}
    </div>
  )
})

export interface LaneHeadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  name: string
  /** Brush colour of the swatch, 1 … 6 (wraps); omit for no swatch. */
  brush?: number
  height: 20 | 40
  /** Rendered before the name, after the swatch (a `Glyph`, a `SoundIcon`). */
  glyph?: ReactNode
  /** Mute and solo show when their state is given. */
  mute?: boolean
  solo?: boolean
  onMuteChange?: (mute: boolean) => void
  onSoloChange?: (solo: boolean) => void
  /** `data-*` attributes for the mute and the solo button. */
  muteData?: Record<`data-${string}`, string>
  soloData?: Record<`data-${string}`, string>
  /** A horizontal peak meter in the second row of a head two rows high. */
  meter?: MeterSource | null
  /** A readout after the name (a count), or the second row's line of text on a tall head. */
  note?: string
  selected?: boolean
  'data-testid'?: string
}

export const LaneHead = forwardRef<HTMLDivElement, LaneHeadProps>(function LaneHead(
  {
    name,
    brush,
    height,
    glyph,
    mute,
    solo,
    onMuteChange,
    onSoloChange,
    muteData,
    soloData,
    meter = null,
    note,
    selected = false,
    className,
    style,
    ...rest
  },
  ref,
) {
  const tall = height === 40
  return (
    <div
      ref={ref}
      className={cx(
        'lm-lane-head',
        tall && 'lm-lane-head--tall',
        selected && 'lm-lane-head--selected',
        className,
      )}
      style={{ height, ...style }}
      {...rest}
    >
      <div className="lm-lane-head__row">
        {brush === undefined ? null : (
          <span
            className={cx('lm-swatch', `lm-swatch--b${brushIndex(brush)}`)}
            aria-hidden="true"
          />
        )}
        {glyph}
        <span className="lm-lane-head__name" title={name}>
          {name}
        </span>
        {note && !tall ? <span className="lm-lane-head__note">{note}</span> : null}
        {mute === undefined ? null : (
          <ToggleButton
            pressed={mute}
            onPressedChange={(next) => onMuteChange?.(next)}
            label={`Mute ${name}`}
            tone="mute"
            {...muteData}
          >
            M
          </ToggleButton>
        )}
        {solo === undefined ? null : (
          <ToggleButton
            pressed={solo}
            onPressedChange={(next) => onSoloChange?.(next)}
            label={`Solo ${name}`}
            tone="solo"
            {...soloData}
          >
            S
          </ToggleButton>
        )}
      </div>
      {tall ? (
        <div className="lm-lane-head__row lm-lane-head__row--second">
          {meter ? (
            <Meter
              source={meter}
              orientation="horizontal"
              bars={['peak']}
              showReadout={false}
              label={`${name} level`}
              className="lm-lane-head__meter"
            />
          ) : null}
          {note ? <span className="lm-lane-head__note">{note}</span> : null}
        </div>
      ) : null}
    </div>
  )
})
