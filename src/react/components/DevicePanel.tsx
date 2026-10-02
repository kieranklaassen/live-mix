// Device chrome and the panel generated from a device's parameter table.
// `DeviceFrame` is ambient-live's `device-panel.tsx` (U25): title bar, power
// switch, dense body. `DevicePanel` fills it from `useDevice`: one
// taper-aware knob per `ParamSpec`, bypass on the power switch, and a preset
// picker from the registry descriptor. A device that reports readings of its
// own (a compressor's gain reduction) shows them in the title bar while it is
// on. `DeviceView` is the plan's name for it.

import { useState, type CSSProperties, type ReactNode } from 'react'

import {
  type Device,
  type DeviceMeterSpec,
  type MeteredDevice,
  isEditorDevice,
  isMeteredDevice,
  isParamTextDevice,
} from '../../core/devices/Device'
import { type DeviceRegistry } from '../../core/devices/registry'
import { type ParamSpec } from '../../core/params'
import { useDeviceMeter } from '../hooks/useMeter'
import { useDevice } from '../hooks/useParam'
import { formatParamValue, isChoiceParam, paramStep, paramTaper } from './control-math'
import { Knob } from './Knob'
import { DeviceToggle } from './Toggle'
import { cx } from './tokens'

export interface DeviceFrameProps {
  title: string
  /** Lit power switch; omit `onPowerChange` to hide the switch. */
  powered?: boolean
  onPowerChange?: (powered: boolean) => void
  disabled?: boolean
  /** Extra header controls (a preset picker, a remove button). */
  actions?: ReactNode
  children?: ReactNode
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

/** Ableton-style device chrome: title bar with an optional power switch, dense body. */
export function DeviceFrame({
  title,
  powered = true,
  onPowerChange,
  disabled = false,
  actions,
  children,
  className,
  style,
  'data-testid': testId,
}: DeviceFrameProps) {
  return (
    <section
      className={cx('lm-device', !powered && 'lm-device--off', className)}
      style={style}
      data-testid={testId}
      data-powered={powered ? 'true' : 'false'}
      aria-label={title}
    >
      <header className="lm-device__header">
        {onPowerChange ? (
          <DeviceToggle
            pressed={powered}
            disabled={disabled}
            label={`${title} power`}
            onPressedChange={onPowerChange}
            data-testid={testId ? `${testId}-power` : undefined}
          />
        ) : null}
        <h3 className="lm-device__title">{title}</h3>
        {actions ? <div className="lm-device__actions">{actions}</div> : null}
      </header>
      <div className="lm-device__body" aria-disabled={!powered || undefined}>
        {children}
      </div>
    </section>
  )
}

export interface DevicePanelProps {
  device: Device
  /** Where to find the descriptor (name, presets); defaults to the provided engine's registry. */
  registry?: DeviceRegistry
  /** Defaults to the descriptor's name, else the device id. */
  title?: string
  /**
   * Parameters to show, in order; defaults to the device's own `panelParams`
   * when it names some, else every parameter of the device.
   */
  params?: readonly string[]
  /** Labels for choice parameters by name; overrides the labels a spec carries in `choices`. */
  choiceLabels?: Readonly<Record<string, readonly string[]>>
  showBypass?: boolean
  /** Default: when the descriptor has presets. */
  showPresets?: boolean
  knobSize?: number
  /** Extra header controls after the preset picker. */
  actions?: ReactNode
  onRemove?: () => void
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

function isBipolar(spec: ParamSpec): boolean {
  return spec.min < 0 && spec.max > 0 && spec.default === (spec.min + spec.max) / 2
}

/** Readings move slowly enough to be read as numbers at this rate. */
const METER_READOUT_FPS = 10

/** A reading as the title bar writes it: one decimal and its unit, with a real minus. */
export function formatDeviceMeter(value: number, unit: string): string {
  // "-0.0" is not a reading: within half a tenth of zero it is zero.
  const text = Math.abs(value) < 0.05 ? '0.0' : value.toFixed(1).replace(/^-/, '−')
  return unit ? `${text} ${unit}` : text
}

function DeviceMeterReadout({
  device,
  name,
  spec,
  active,
  testId,
}: {
  device: MeteredDevice
  name: string
  spec: DeviceMeterSpec
  active: boolean
  testId?: string
}) {
  const value = useDeviceMeter(device, name, { active, fps: METER_READOUT_FPS })
  return (
    <output
      className="lm-device__meter"
      aria-label={spec.name}
      title={spec.name}
      data-testid={testId ? `${testId}-meter-${name}` : undefined}
    >
      {formatDeviceMeter(active ? value : 0, spec.unit)}
    </output>
  )
}

/** A device's parameters as knobs, its bypass and its presets. */
export function DevicePanel({
  device,
  registry,
  title,
  params,
  choiceLabels,
  showBypass = true,
  showPresets,
  knobSize = 40,
  actions,
  onRemove,
  className,
  style,
  'data-testid': testId,
}: DevicePanelProps) {
  const d = useDevice(device, registry ? { registry } : {})
  const [presetName, setPresetName] = useState('')
  const names = params ?? device.panelParams ?? Object.keys(d.params)
  const ownText = isParamTextDevice(device) ? device : null
  const presetsShown = showPresets ?? d.presets.length > 0
  const heading = title ?? d.descriptor?.name ?? d.id

  const header = (
    <>
      {isMeteredDevice(device)
        ? Object.entries(device.meters).map(([name, spec]) => (
            <DeviceMeterReadout
              key={name}
              device={device}
              name={name}
              spec={spec}
              // A bypassed device does no work, so there is nothing to follow.
              active={!d.bypass}
              testId={testId}
            />
          ))
        : null}
      {presetsShown ? (
        <select
          className="lm-device__presets"
          aria-label={`${heading} preset`}
          value={presetName}
          onChange={(event) => {
            const name = event.target.value
            setPresetName(name)
            if (name) d.applyPreset(name)
          }}
          data-testid={testId ? `${testId}-preset` : undefined}
        >
          <option value="">Preset…</option>
          {d.presets.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name}
            </option>
          ))}
        </select>
      ) : null}
      {isEditorDevice(device) ? (
        <button
          type="button"
          className="lm-button lm-button--neutral lm-device__editor"
          aria-label={`Open ${heading} editor`}
          title="Open the plug-in's own window"
          onClick={() => {
            void device.openEditor().catch(() => {})
          }}
          data-testid={testId ? `${testId}-editor` : undefined}
        >
          Edit
        </button>
      ) : null}
      {actions}
      {onRemove ? (
        <button
          type="button"
          className="lm-button lm-button--neutral lm-device__remove"
          aria-label={`Remove ${heading}`}
          onClick={onRemove}
          data-testid={testId ? `${testId}-remove` : undefined}
        >
          ×
        </button>
      ) : null}
    </>
  )

  return (
    <DeviceFrame
      title={heading}
      powered={!d.bypass}
      onPowerChange={showBypass ? (powered) => d.setBypass(!powered) : undefined}
      actions={header}
      className={cx('lm-device--generated', className)}
      style={style}
      data-testid={testId}
    >
      {device.notice ? (
        <p
          className="lm-device__notice"
          role="note"
          data-testid={testId ? `${testId}-notice` : undefined}
        >
          {device.notice}
        </p>
      ) : null}
      <div className="lm-device__params">
        {names.map((name) => {
          const spec = d.params[name]
          if (!spec) return null
          const labels = choiceLabels?.[name] ?? (spec.choices?.length ? spec.choices : undefined)
          const choice = labels !== undefined || isChoiceParam(spec)
          return (
            <Knob
              key={name}
              label={spec.name || name}
              value={d.values[name]}
              defaultValue={spec.default}
              min={spec.min}
              max={spec.max}
              step={choice ? 1 : paramStep(spec)}
              taper={paramTaper(spec)}
              unit={spec.unit || 'ratio'}
              bipolar={isBipolar(spec)}
              size={knobSize}
              format={
                labels
                  ? (value) => labels[Math.round(value) - spec.min] ?? String(Math.round(value))
                  : choice
                    ? (value) => String(Math.round(value))
                    : (value) => ownText?.paramText(name) ?? formatParamValue(spec, value)
              }
              onChange={(value) => {
                d.setParam(name, value)
                if (presetName) setPresetName('')
              }}
              onChangeStart={() => d.touch(name)}
              onChangeEnd={() => d.release(name)}
              className="lm-device__param"
              data-testid={testId ? `${testId}-${name}` : undefined}
            />
          )
        })}
      </div>
    </DeviceFrame>
  )
}

/** The plan's name for the generated panel. */
export const DeviceView = DevicePanel
