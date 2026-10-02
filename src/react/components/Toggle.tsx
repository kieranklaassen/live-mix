// Two buttons every view shares: the squared power switch from ambient-live's
// `device-toggle.tsx` (U25) and a labelled pressed/unpressed button for mute,
// solo, loop and transport.

import { type CSSProperties, type ReactNode } from 'react'

import { infoProps } from './info'
import { cx } from './tokens'

/** What the power switch of a device does, as the info view says it. */
export const DEVICE_POWER_INFO =
  'Turns the device off and on. Off, the sound passes through unchanged and the settings are kept.'

export interface DeviceToggleProps {
  pressed: boolean
  disabled?: boolean
  label?: string
  /** What the switch turns on and off, for the info view; the default speaks of a device. */
  info?: string
  onPressedChange: (pressed: boolean) => void
  className?: string
  'data-testid'?: string
  /** Marks the switch as a device's power, for a host that maps controllers onto what is on screen. */
  'data-lm-power'?: boolean
}

/** Squared on/off power switch for device title bars (`role="switch"`). */
export function DeviceToggle({
  pressed,
  disabled = false,
  label = 'Power',
  info = DEVICE_POWER_INFO,
  onPressedChange,
  className,
  'data-testid': testId,
  'data-lm-power': power,
}: DeviceToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={label}
      disabled={disabled}
      data-testid={testId}
      data-lm-power={power ? '' : undefined}
      onClick={() => onPressedChange(!pressed)}
      className={cx('lm-toggle', pressed && 'lm-toggle--on', className)}
      {...infoProps(label, info)}
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
  /** What the button does, for the info view (`InfoView`). */
  info?: string
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
  info,
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
      {...(info === undefined ? {} : infoProps(label ?? null, info))}
    >
      {children}
    </button>
  )
}
