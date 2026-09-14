// A linear control, vertical (a channel fader) or horizontal (a send level).
// Moved from ambient-live's `fader.tsx` (U25) onto `--lm-*` tokens; the
// `fader` taper puts 0 dB around 80 % of the travel like a console fader.

import { type CSSProperties } from 'react'

import { formatControlValue, type ControlTaper, type ControlUnit } from './control-math'
import { cx } from './tokens'
import { useParamControl } from './useParamControl'

export type FaderOrientation = 'vertical' | 'horizontal'

export interface FaderProps {
  label: string
  value?: number
  defaultValue: number
  min: number
  max: number
  step?: number
  unit?: ControlUnit
  taper?: ControlTaper
  skew?: number
  orientation?: FaderOrientation
  disabled?: boolean
  sensitivityPx?: number
  wheel?: boolean
  /** What a double-click sets; defaults to `defaultValue`. */
  resetValue?: number
  /** Idle time that ends a key / wheel gesture (default 400 ms). */
  gestureIdleMs?: number
  format?: (value: number) => string
  hideLabel?: boolean
  hideValue?: boolean
  /** Marks along the track as normalised positions (e.g. unity), drawn as ticks. */
  ticks?: readonly number[]
  onChange?: (value: number) => void
  onChangeStart?: () => void
  onChangeEnd?: () => void
  className?: string
  style?: CSSProperties
  id?: string
  'data-testid'?: string
}

export function Fader({
  label,
  value,
  defaultValue,
  min,
  max,
  step = 0,
  unit = 'ratio',
  taper = 'linear',
  skew = 2,
  orientation = 'vertical',
  disabled = false,
  sensitivityPx,
  wheel,
  resetValue,
  gestureIdleMs,
  format,
  hideLabel = false,
  hideValue = false,
  ticks,
  onChange,
  onChangeStart,
  onChangeEnd,
  className,
  style,
  id,
  'data-testid': testId,
}: FaderProps) {
  const vertical = orientation === 'vertical'
  const control = useParamControl({
    value,
    defaultValue,
    min,
    max,
    step,
    taper,
    skew,
    disabled,
    axis: vertical ? 'vertical' : 'horizontal',
    sensitivityPx: sensitivityPx ?? (vertical ? 100 : 140),
    wheel,
    resetValue,
    gestureIdleMs,
    onChange,
    onChangeStart,
    onChangeEnd,
  })
  const { normalized, interacting, handlers } = control
  const valueText = format ? format(control.value) : formatControlValue(control.value, unit)
  const percent = `${normalized * 100}%`

  return (
    <div
      className={cx(
        'lm-fader',
        vertical ? 'lm-fader--vertical' : 'lm-fader--horizontal',
        disabled && 'lm-fader--disabled',
        interacting && 'lm-fader--active',
        className,
      )}
      style={style}
      data-testid={testId}
    >
      {hideLabel ? null : <span className="lm-fader__label">{label}</span>}
      <button
        type="button"
        role="slider"
        id={id}
        aria-label={label}
        aria-orientation={orientation}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={control.value}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className="lm-fader__track"
        ref={control.ref}
        {...handlers}
      >
        {ticks?.map((tick) => (
          <span
            key={tick}
            aria-hidden="true"
            className="lm-fader__tick"
            style={vertical ? { bottom: `${tick * 100}%` } : { left: `${tick * 100}%` }}
          />
        ))}
        <span
          aria-hidden="true"
          className="lm-fader__fill"
          style={vertical ? { height: percent } : { width: percent }}
        />
        <span
          aria-hidden="true"
          className="lm-fader__thumb"
          style={vertical ? { bottom: percent } : { left: percent }}
        />
      </button>
      {hideValue ? null : <span className="lm-fader__value">{valueText}</span>}
    </div>
  )
}
