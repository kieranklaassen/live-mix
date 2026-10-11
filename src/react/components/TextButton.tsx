// A button with words on it: one row tall, an 11 px label in the text
// colour. The kit's `lm-button` (`ToggleButton`) stays for the one-letter
// switches, M, S and a device's power; this is for everything a person reads.
// Every other attribute (`onClick`, `aria-*`, `data-*`, `title`) and the ref go
// to the `button`.

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

import { cx } from './tokens'

export type TextButtonVariant = 'default' | 'primary' | 'quiet' | 'danger'

export interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * `primary` is the one button a bar or a sheet leads to, the text colour as
   * its ground. `quiet` has no ground until it is pointed at. `danger` is for
   * what cannot be taken back.
   */
  variant?: TextButtonVariant
  /** Makes it a pressed/unpressed button (`aria-pressed`). Pressed is the accent; a quiet one sinks instead. */
  pressed?: boolean
  /** No border but a hairline at its left, and as tall as its bar: buttons sit flush in a row. */
  cell?: boolean
  /** One column wide, for a glyph alone. Give it an `aria-label`. */
  icon?: boolean
  /** `large` is two rows tall, for the one button of a start screen or a sheet. */
  size?: 'row' | 'large'
  /** The key that does the same, shown after the label. */
  shortcut?: string
  children?: ReactNode
}

export const TextButton = forwardRef<HTMLButtonElement, TextButtonProps>(function TextButton(
  {
    variant = 'default',
    pressed,
    cell = false,
    icon = false,
    size = 'row',
    shortcut,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={pressed}
      className={cx(
        'lm-btn',
        variant !== 'default' && `lm-btn--${variant}`,
        cell && 'lm-btn--cell',
        icon && 'lm-btn--icon',
        size === 'large' && 'lm-btn--large',
        className,
      )}
      {...rest}
    >
      {children}
      {shortcut ? <span className="lm-key">{shortcut}</span> : null}
    </button>
  )
})
