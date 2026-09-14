// Two buttons every view shares: the squared power switch from ambient-live's
// `device-toggle.tsx` (U25) and a labelled pressed/unpressed button for mute,
// solo, loop and transport.

import { type CSSProperties, type ReactNode } from 'react'

import { cx } from './tokens'

export interface DeviceToggleProps {
  pressed: boolean
  disabled?: boolean
  label?: string
  onPressedChange: (pressed: boolean) => void
  className?: string
  'data-testid'?: string
}

/** Squared on/off power switch for device title bars (`role="switch"`). */
export function DeviceToggle({
  pressed,
  disabled = false,
  label = 'Power',
  onPressedChange,
  className,
  'data-testid': testId,
}: DeviceToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={label}
      disabled={disabled}
      data-testid={testId}
      onClick={() => onPressedChange(!pressed)}
      className={cx('lm-toggle', pressed && 'lm-toggle--on', className)}
    >
      <span aria-hidden="true" className="lm-toggle__dot" />
    </button>
  )
}

export type ToggleTone = 'accent' | 'mute' | 'solo' | 'neutral'

export interface ToggleButtonProps {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  /** Accessible name; defaults to the text content. */
  label?: string
  tone?: ToggleTone
  disabled?: boolean
  title?: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

/** A small pressed/unpressed button (`aria-pressed`), toned for mute, solo, or the accent. */
export function ToggleButton({
  pressed,
  onPressedChange,
  label,
  tone = 'accent',
  disabled = false,
  title,
  children,
  className,
  style,
  'data-testid': testId,
}: ToggleButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={title}
      disabled={disabled}
      data-testid={testId}
      onClick={() => onPressedChange(!pressed)}
      className={cx('lm-button', `lm-button--${tone}`, pressed && 'lm-button--on', className)}
      style={style}
    >
      {children}
    </button>
  )
}
