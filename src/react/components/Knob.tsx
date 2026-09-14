// A rotary control: 270° sweep with a bottom gap, an arc that fills from the
// minimum (or from the centre when `bipolar`, pan-style), and a pointer line.
// Moved from ambient-live's `knob.tsx` (U25) with the `al-*` classes replaced
// by `--lm-*` tokens. Controlled or uncontrolled through `useParamControl`.

import { type CSSProperties } from 'react'

import {
  formatControlValue,
  knobArcPath,
  normToKnobAngle,
  type ControlTaper,
  type ControlUnit,
} from './control-math'
import { cx, tokenRef } from './tokens'
import { useParamControl, type ControlAxis } from './useParamControl'

export interface KnobProps {
  label: string
  /** Controlled value; omit for an uncontrolled knob starting at `defaultValue`. */
  value?: number
  defaultValue: number
  min: number
  max: number
  /** Quantisation step; 0 (default) clamps only. */
  step?: number
  unit?: ControlUnit
  taper?: ControlTaper
  skew?: number
  /** Fill the arc from the centre (0.5) instead of from the minimum. */
  bipolar?: boolean
  disabled?: boolean
  /** Diameter in pixels (default 44; the label and value follow the tokens). */
  size?: number
  axis?: ControlAxis
  sensitivityPx?: number
  wheel?: boolean
  /** What a double-click sets; defaults to `defaultValue`. */
  resetValue?: number
  /** Idle time that ends a key / wheel gesture (default 400 ms). */
  gestureIdleMs?: number
  /** Replace the default unit formatting of the readout. */
  format?: (value: number) => string
  hideLabel?: boolean
  hideValue?: boolean
  onChange?: (value: number) => void
  onChangeStart?: () => void
  onChangeEnd?: () => void
  className?: string
  style?: CSSProperties
  id?: string
  'data-testid'?: string
}

export function Knob({
  label,
  value,
  defaultValue,
  min,
  max,
  step = 0,
  unit = 'ratio',
  taper = 'linear',
  skew = 2,
  bipolar = false,
  disabled = false,
  size = 44,
  axis,
  sensitivityPx = 110,
  wheel,
  resetValue,
  gestureIdleMs,
  format,
  hideLabel = false,
  hideValue = false,
  onChange,
  onChangeStart,
  onChangeEnd,
  className,
  style,
  id,
  'data-testid': testId,
}: KnobProps) {
  const control = useParamControl({
    value,
    defaultValue,
    min,
    max,
    step,
    taper,
    skew,
    disabled,
    axis,
    sensitivityPx,
    wheel,
    resetValue,
    gestureIdleMs,
    onChange,
    onChangeStart,
    onChangeEnd,
  })
  const { normalized, interacting, handlers } = control

  const cx0 = size / 2
  const cy0 = size / 2
  const radius = size * 0.36
  const pointerAngle = (normToKnobAngle(normalized) * Math.PI) / 180
  const pointerLen = radius - 2
  const trackPath = knobArcPath(cx0, cy0, radius, 0, 1)
  const fillStart = bipolar ? 0.5 : 0
  const fillPath =
    Math.abs(normalized - fillStart) < 0.001
      ? ''
      : knobArcPath(
          cx0,
          cy0,
          radius,
          Math.min(fillStart, normalized),
          Math.max(fillStart, normalized),
        )
  const valueText = format ? format(control.value) : formatControlValue(control.value, unit)
  const stroke = tokenRef('stroke', '2px')

  return (
    <div
      className={cx(
        'lm-knob',
        disabled && 'lm-knob--disabled',
        interacting && 'lm-knob--active',
        className,
      )}
      style={style}
      data-testid={testId}
    >
      {hideLabel ? null : <span className="lm-knob__label">{label}</span>}
      <button
        type="button"
        role="slider"
        id={id}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={control.value}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className="lm-knob__control"
        style={{ width: size, height: size }}
        ref={control.ref}
        {...handlers}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <path
            d={trackPath}
            fill="none"
            stroke={tokenRef('hairline', '#C4C4BE')}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
          {fillPath ? (
            <path
              d={fillPath}
              fill="none"
              stroke={tokenRef('accent', '#E63946')}
              strokeWidth={stroke}
              strokeLinecap="butt"
            />
          ) : null}
          <circle
            cx={cx0}
            cy={cy0}
            r={radius * 0.55}
            fill={tokenRef('sunken', '#E9E9E4')}
            stroke={tokenRef('border', '#D6D6D0')}
            strokeWidth={1}
          />
          <line
            x1={cx0}
            y1={cy0}
            x2={cx0 + pointerLen * Math.cos(pointerAngle)}
            y2={cy0 + pointerLen * Math.sin(pointerAngle)}
            stroke={tokenRef('text', '#1A1A1A')}
            strokeWidth={1.5}
            strokeLinecap="square"
          />
        </svg>
      </button>
      {hideValue ? null : <span className="lm-knob__value">{valueText}</span>}
    </div>
  )
}
