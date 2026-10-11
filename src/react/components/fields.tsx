// The fields a property row holds: a line of text or a number, a choice from
// a list, a choice among a few, and a tick. Each is one row tall on the sunken
// ground and fills its cell; `boxed` gives one a border of its own for use
// outside a row. Each reports the new value, not the event, and passes every
// other attribute (`id`, `aria-*`, `data-*`) to the element a person acts on.

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'

import { TextButton } from './TextButton'
import { cx } from './tokens'

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  value: string
  onChange: (value: string) => void
  /** A number: the mono face, tabular figures. */
  numeric?: boolean
  /** A border of its own, for a field that is not in a property row. */
  boxed?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { value, onChange, numeric = false, boxed = false, className, type = 'text', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      inputMode={numeric ? 'decimal' : undefined}
      className={cx(
        'lm-input',
        numeric && 'lm-input--numeric',
        boxed && 'lm-input--boxed',
        className,
      )}
      {...rest}
    />
  )
})

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> {
  value: string
  /** The choices; a bare string is its own label. */
  options: readonly (SelectOption | string)[]
  onChange: (value: string) => void
  boxed?: boolean
}

/** A native select with a drawn chevron, so the system's own list opens. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { value, options, onChange, boxed = false, className, ...rest },
  ref,
) {
  return (
    <span className={cx('lm-pick', boxed && 'lm-pick--boxed')}>
      <select
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cx('lm-select', className)}
        {...rest}
      >
        {options.map((option) => {
          const item = typeof option === 'string' ? { value: option, label: option } : option
          return (
            <option key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </option>
          )
        })}
      </select>
    </span>
  )
})

export interface SegmentedOption {
  value: string
  label: ReactNode
  /** Accessible name, for a label that is a glyph. */
  name?: string
}

export interface SegmentedProps {
  options: readonly SegmentedOption[]
  value: string
  onChange: (value: string) => void
  /** Each option takes an equal share of the width. */
  fill?: boolean
  /** Names the group. */
  label?: string
  disabled?: boolean
  className?: string
  'data-testid'?: string
  /** Any other `data-*` attribute goes to every button of the group. */
  [data: `data-${string}`]: string | undefined
}

/** A choice among a few: text buttons that share edges, the chosen one pressed. */
export function Segmented({
  options,
  value,
  onChange,
  fill = false,
  label,
  disabled = false,
  className,
  'data-testid': testId,
  ...data
}: SegmentedProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx('lm-seg', fill && 'lm-seg--fill', className)}
      data-testid={testId}
    >
      {options.map((option) => (
        <TextButton
          key={option.value}
          pressed={option.value === value}
          aria-label={option.name}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          {...data}
        >
          {option.label}
        </TextButton>
      ))}
    </div>
  )
}

export interface CheckProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'checked' | 'onChange' | 'type'
> {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
}

/** A 12 px square, the accent when on, with its words beside it. */
export const Check = forwardRef<HTMLInputElement, CheckProps>(function Check(
  { checked, onChange, label, className, ...rest },
  ref,
) {
  return (
    <label className={cx('lm-check-row', className)}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="lm-check"
        {...rest}
      />
      <span className="lm-check-row__label">{label}</span>
    </label>
  )
})
