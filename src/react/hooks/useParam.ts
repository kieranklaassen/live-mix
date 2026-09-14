// Device parameters for panels and knobs. Values come from the device
// (`getParam`) and re-render on its `onChange` when it is an
// `ObservableDevice` — every stock host is — so automation and modulation
// writes show up; for a third-party device without events only this hook's
// own writes re-render. Sets go through `setParam`, which every host ramps.

import { useCallback, useMemo, useReducer } from 'react'

import { isObservableDevice, type Device } from '../../core/devices/Device'
import {
  applyPreset,
  capturePreset,
  listPresets,
  resolvePreset,
  type ApplyPresetResult,
  type Preset,
} from '../../core/devices/presets'
import { type DeviceDescriptor, type DeviceRegistry } from '../../core/devices/registry'
import { clampParam, type ParamSpec } from '../../core/params'
import { neverSubscribe, useExternalSnapshot, type Subscribe } from '../store'
import { useMaybeEngine } from './useEngine'

export interface UseDeviceOptions {
  /** Where to look the descriptor (presets, version) up; defaults to the provided engine's registry. */
  registry?: DeviceRegistry
}

export interface DeviceSnapshot {
  id: string
  params: Readonly<Record<string, ParamSpec>>
  /** Current value of every parameter, by name. */
  values: Readonly<Record<string, number>>
  bypass: boolean
  latencySec: number
  /** True when the device announces its changes (stock hosts do). */
  observable: boolean
}

export interface DeviceControls {
  /** Clamped to the spec and ramped by the device. */
  setParam(name: string, value: number): void
  setBypass(bypass: boolean): void
  toggleBypass(): void
  /** A factory preset by name (needs a descriptor) or any preset object for this device. */
  applyPreset(preset: string | Preset): ApplyPresetResult
  /** Snapshot the current values as a preset, stamped with the descriptor version when known. */
  capturePreset(name: string): Preset
  /** Every parameter back to its default. */
  reset(): void
}

export type UseDeviceResult = DeviceSnapshot &
  DeviceControls & {
    device: Device
    /** The registry entry for `device.id`, or null when unknown. */
    descriptor: DeviceDescriptor | null
    /** Factory presets from the descriptor (empty without one). */
    presets: readonly Preset[]
  }

function readValues(device: Device): Record<string, number> {
  const values: Record<string, number> = {}
  for (const name of Object.keys(device.params)) values[name] = device.getParam(name)
  return values
}

function deviceSubscription(device: Device): Subscribe {
  return isObservableDevice(device)
    ? (onChange) => device.onChange(() => onChange())
    : neverSubscribe
}

/** Parameter values, bypass and presets of one device, with ramped setters. */
export function useDevice(device: Device, options: UseDeviceOptions = {}): UseDeviceResult {
  const engine = useMaybeEngine()
  const registry = options.registry ?? engine?.devices ?? null
  const descriptor = useMemo(() => registry?.get(device.id) ?? null, [registry, device.id])
  const presets = useMemo(() => (descriptor ? listPresets(descriptor) : []), [descriptor])
  const observable = isObservableDevice(device)
  const [, rerender] = useReducer((count: number) => count + 1, 0)

  const subscribe = useMemo(() => deviceSubscription(device), [device])
  const readParams = useCallback(
    (): Readonly<Record<string, number>> => readValues(device),
    [device],
  )
  const values = useExternalSnapshot(subscribe, readParams)
  const readBypass = useCallback((): boolean => device.bypass, [device])
  const bypass = useExternalSnapshot(subscribe, readBypass)

  const controls = useMemo<DeviceControls>(() => {
    const after = (): void => {
      if (!observable) rerender()
    }
    return {
      setParam: (name, value) => {
        device.setParam(name, value)
        after()
      },
      setBypass: (enabled) => {
        device.bypass = enabled
        after()
      },
      toggleBypass: () => {
        device.bypass = !device.bypass
        after()
      },
      applyPreset: (preset) => {
        const resolved =
          typeof preset === 'string'
            ? resolvePreset(requireDescriptor(descriptor, device), preset)
            : preset
        const result = applyPreset(device, resolved)
        after()
        return result
      },
      capturePreset: (name) => capturePreset(device, name, descriptor?.version ?? 1),
      reset: () => {
        for (const [name, spec] of Object.entries(device.params))
          device.setParam(name, spec.default)
        after()
      },
    }
  }, [device, descriptor, observable])

  return {
    device,
    descriptor,
    presets,
    id: device.id,
    params: device.params,
    values,
    bypass,
    latencySec: device.latencySec,
    observable,
    ...controls,
  }
}

function requireDescriptor(descriptor: DeviceDescriptor | null, device: Device): DeviceDescriptor {
  if (!descriptor) {
    throw new Error(
      `live-mix/react: presets by name need a registry entry for "${device.id}" (pass { registry } or provide an engine)`,
    )
  }
  return descriptor
}

/** Value → 0..1 control position under the spec's taper. */
export function normalizeParam(spec: ParamSpec, value: number): number {
  const clamped = clampParam(spec, value)
  if (spec.taper === 'log' && spec.min > 0) {
    return Math.log(clamped / spec.min) / Math.log(spec.max / spec.min)
  }
  return (clamped - spec.min) / (spec.max - spec.min)
}

/** 0..1 control position → value under the spec's taper, clamped to the range. */
export function denormalizeParam(spec: ParamSpec, position: number): number {
  const u = Number.isFinite(position) ? Math.min(1, Math.max(0, position)) : 0
  if (spec.taper === 'log' && spec.min > 0) {
    return clampParam(spec, spec.min * Math.pow(spec.max / spec.min, u))
  }
  return clampParam(spec, spec.min + (spec.max - spec.min) * u)
}

export interface UseDeviceParamResult {
  device: Device
  name: string
  spec: ParamSpec
  value: number
  /** `value` as a 0..1 control position under the taper. */
  normalized: number
  /** Clamped and ramped by the device. */
  set(value: number): void
  /** Set from a 0..1 control position. */
  setNormalized(position: number): void
  reset(): void
}

/** One parameter of a device — what a knob binds to. Throws for an unknown name. */
export function useDeviceParam(device: Device, name: string): UseDeviceParamResult {
  const spec = device.params[name]
  if (!spec) throw new Error(`live-mix/react: ${device.id} has no parameter "${name}"`)
  const observable = isObservableDevice(device)
  const [, rerender] = useReducer((count: number) => count + 1, 0)
  const subscribe = useMemo(() => deviceSubscription(device), [device])
  const read = useCallback((): number => device.getParam(name), [device, name])
  const value = useExternalSnapshot(subscribe, read, Object.is)

  const set = useCallback(
    (next: number) => {
      device.setParam(name, next)
      if (!observable) rerender()
    },
    [device, name, observable],
  )
  const setNormalized = useCallback(
    (position: number) => set(denormalizeParam(spec, position)),
    [set, spec],
  )
  const reset = useCallback(() => set(spec.default), [set, spec])

  return {
    device,
    name,
    spec,
    value,
    normalized: normalizeParam(spec, value),
    set,
    setNormalized,
    reset,
  }
}
