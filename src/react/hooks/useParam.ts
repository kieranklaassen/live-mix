// Device parameters for panels and knobs. Values come from the device
// (`getParam`) and re-render on its `onChange` when it is an
// `ObservableDevice` — every stock host is — so automation and modulation
// writes show up; for a third-party device without events only this hook's
// own writes re-render. Sets go through `setParam`, which every host ramps —
// or, inside a provider with an `arbiter` whose renderer created the device,
// through an attributed `device.setParam` operation (U30).

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'

import { isObservableDevice, type Device } from '../../core/devices/Device'
import {
  applyPreset,
  capturePreset,
  listPresets,
  presetParams,
  resolvePreset,
  type ApplyPresetResult,
  type Preset,
} from '../../core/devices/presets'
import { type DeviceDescriptor, type DeviceRegistry } from '../../core/devices/registry'
import { denormalizeParam, normalizeParam, type ParamSpec } from '../../core/params'
import { type Arbiter } from '../../score/Arbiter'
import { findDevice as findScoreDevice } from '../../score/schema'
import { neverSubscribe, useExternalSnapshot, type Subscribe } from '../store'
import { useMaybeArbiter, useMaybeEngine } from './useEngine'

// The taper math lives in core (`normalizeParam` / `denormalizeParam` in
// `core/params.ts`) so the control surface (U36) shares the formula; both
// stay exported from this module and from `./react`.
export { denormalizeParam, normalizeParam }

/**
 * A host that keeps its own document takes a device's writes in place of the
 * device and the arbiter. The panel still reads the device, so the host shows
 * a change by making the device follow its document; nothing is set here
 * behind the host's back. A control in hand is told at both ends, so a host
 * can play the drag as it moves and keep it as one step when it is let go.
 */
export interface DeviceWrites {
  /**
   * A control is in hand: `names` are the parameters it moves. Until `release`,
   * every `set` belongs to this one hold, also one that carries a parameter
   * `names` left out: the wheel turned over a display's handle in hand sets a
   * band's width inside that handle's drag.
   */
  touch?(names: readonly string[]): void
  /**
   * Parameters to set, by name: as a control in hand moves, or, with nothing
   * in hand, one change by itself (a typed value, a reset, a preset).
   */
  set(params: Readonly<Record<string, number>>): void
  /** The control is let go, or the panel left the page with it in hand. */
  release?(names: readonly string[]): void
  /** The lamp was pressed. */
  setBypass(bypass: boolean): void
}

export interface UseDeviceOptions {
  /** Where to look the descriptor (presets, version) up; defaults to the provided engine's registry. */
  registry?: DeviceRegistry
  /** Who takes the writes; left out, the device does, or the arbiter that made it. */
  writes?: DeviceWrites
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
  /** Pointer down on a parameter control: with an arbiter, holds it and starts a fresh undo gesture. */
  touch(name: string): void
  /** Pointer up: the hold runs its timer and the gesture ends. */
  release(name: string): void
  /** True when `setParam` writes attributed score operations through an arbiter. */
  attributed: boolean
  /**
   * Several parameters moved by one drag (a band on an EQ's display moves its
   * frequency and its gain): `touchMany` at pointer down, `setMany` as it
   * moves, `releaseMany` at pointer up. With an arbiter the whole drag is one
   * undo step, however many parameters it moved.
   */
  touchMany(names: readonly string[]): void
  setMany(params: Readonly<Record<string, number>>): void
  releaseMany(names: readonly string[]): void
  setBypass(bypass: boolean): void
  toggleBypass(): void
  /**
   * A factory preset by name (needs a descriptor) or any preset object for
   * this device. By name, every parameter is set: the ones the preset lists,
   * and the rest to their defaults. An object sets only what it carries.
   */
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

/** The score device instance id when the arbiter's renderer created this device. */
function scoreDeviceId(arbiter: Arbiter | null, device: Device): string | null {
  return arbiter?.deviceIdFor(device) ?? null
}

/** The gesture counter of drags that move several parameters; no parameter can have this name. */
const DRAG = '\u0000drag'

/** Hold/gesture bookkeeping shared by the two device hooks. */
function useAttributedParams(device: Device) {
  const arbiter = useMaybeArbiter()
  const gestures = useRef<Record<string, number>>({})
  const attributed = useMemo(() => {
    const id = scoreDeviceId(arbiter, device)
    const target = (name: string) => ({ kind: 'device' as const, device: id ?? '', param: name })
    // The parameters this hand has touched and not let go of yet.
    const inHand = new Set<string>()
    return {
      attributed: id !== null,
      /** Apply through the arbiter; false when the device is not in the score. */
      set: (name: string, value: number): boolean => {
        if (!arbiter || id === null) return false
        arbiter.apply(
          { type: 'device.setParam', device: id, param: name, value },
          { gesture: `ui:${id}:${name}#${gestures.current[name] ?? 0}` },
        )
        return true
      },
      /** Several parameters as one operation (a preset, a reset): one undo step. */
      setMany: (params: Record<string, number>): boolean => {
        if (!arbiter || id === null) return false
        arbiter.apply({ type: 'device.setParams', device: id, params })
        return true
      },
      /** Bypass through the arbiter; false when the device is not in the score. */
      setBypass: (bypass: boolean): boolean => {
        if (!arbiter || id === null) return false
        arbiter.apply({ type: 'device.bypass', device: id, bypass })
        return true
      },
      /** The score's bypass state: the device follows it a render later. */
      bypass: (): boolean | undefined =>
        arbiter && id !== null ? findScoreDevice(arbiter.score, id)?.device.bypass : undefined,
      touch: (name: string): void => {
        gestures.current[name] = (gestures.current[name] ?? 0) + 1
        if (!arbiter || id === null) return
        arbiter.touch(target(name))
        inHand.add(name)
      },
      /** A drag that moves several parameters begins: they are held, and it is one gesture. */
      touchMany: (names: readonly string[]): void => {
        gestures.current[DRAG] = (gestures.current[DRAG] ?? 0) + 1
        if (!arbiter || id === null) return
        for (const name of names) {
          arbiter.touch(target(name))
          inHand.add(name)
        }
      },
      /** The drag's parameters as one operation of its gesture; false when the device is not in the score. */
      dragMany: (params: Readonly<Record<string, number>>): boolean => {
        if (!arbiter || id === null) return false
        arbiter.apply(
          { type: 'device.setParams', device: id, params: { ...params } },
          { gesture: `ui:${id}:drag#${gestures.current[DRAG] ?? 0}` },
        )
        return true
      },
      releaseMany: (names: readonly string[]): void => {
        if (!arbiter || id === null) return
        for (const name of names) {
          inHand.delete(name)
          arbiter.release(target(name))
        }
        arbiter.endGesture()
      },
      release: (name: string): void => {
        if (!arbiter || id === null) return
        inHand.delete(name)
        arbiter.release(target(name))
        arbiter.endGesture()
      },
      /** Whatever is still in hand is let go: the device is leaving the view. */
      letGo: (): void => {
        if (!arbiter || inHand.size === 0) return
        for (const name of inHand) arbiter.release(target(name))
        inHand.clear()
        arbiter.endGesture()
      },
    }
  }, [arbiter, device])

  // A panel that leaves the page with a knob in hand, or is given another
  // device, lets go here: the pointer's up is told to the other device or to
  // nobody, and the hold would stand against every other writer for good.
  useEffect(() => attributed.letGo, [attributed])

  return attributed
}

/** A host's `DeviceWrites` with what is in hand counted, so a panel that leaves lets go. */
function useTakenWrites(device: Device, writes: DeviceWrites | undefined) {
  // The host may hand a new object on every render: the controls call the latest one.
  const latest = useRef(writes)
  latest.current = writes
  const taken = useMemo(() => {
    const inHand = new Set<string>()
    const own = (params: Readonly<Record<string, number>>): Record<string, number> =>
      Object.fromEntries(
        Object.entries(params).filter(([name]) => Object.hasOwn(device.params, name)),
      )
    return {
      touch: (names: readonly string[]): void => {
        for (const name of names) inHand.add(name)
        latest.current?.touch?.(names)
      },
      set: (params: Readonly<Record<string, number>>): void => {
        const mine = own(params)
        if (Object.keys(mine).length > 0) latest.current?.set(mine)
      },
      release: (names: readonly string[]): void => {
        for (const name of names) inHand.delete(name)
        latest.current?.release?.(names)
      },
      setBypass: (bypass: boolean): void => latest.current?.setBypass(bypass),
      /** Whatever is still in hand is let go: the device is leaving the view. */
      letGo: (): void => {
        if (inHand.size === 0) return
        const names = [...inHand]
        inHand.clear()
        latest.current?.release?.(names)
      },
    }
  }, [device])
  useEffect(() => taken.letGo, [taken])
  return writes ? taken : null
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
  const attributed = useAttributedParams(device)
  const taken = useTakenWrites(device, options.writes)

  const controls = useMemo<DeviceControls>(() => {
    const after = (): void => {
      if (!observable) rerender()
    }
    const defaults = (): Record<string, number> =>
      Object.fromEntries(Object.entries(device.params).map(([name, spec]) => [name, spec.default]))
    const capture = (name: string): Preset => capturePreset(device, name, descriptor?.version ?? 1)
    // A preset captured before the device was renamed is the same preset for the id of today.
    const resolve = (preset: string | Preset): Preset =>
      typeof preset === 'string'
        ? factoryPreset(descriptor, device, preset)
        : descriptor
          ? resolvePreset(descriptor, preset)
          : preset
    if (taken) {
      return {
        setParam: (name, value) => {
          taken.set({ [name]: value })
          after()
        },
        touch: (name) => taken.touch([name]),
        release: (name) => taken.release([name]),
        attributed: false,
        touchMany: taken.touch,
        setMany: (params) => {
          taken.set(params)
          after()
        },
        releaseMany: taken.release,
        setBypass: (enabled) => {
          taken.setBypass(enabled)
          after()
        },
        toggleBypass: () => {
          taken.setBypass(!device.bypass)
          after()
        },
        applyPreset: (preset) => {
          const result = applyPresetThrough(device, resolve(preset), (params) => {
            taken.set(params)
            return true
          })
          after()
          return result
        },
        capturePreset: capture,
        reset: () => {
          taken.set(defaults())
          after()
        },
      }
    }
    return {
      setParam: (name, value) => {
        if (!attributed.set(name, value)) device.setParam(name, value)
        after()
      },
      touch: attributed.touch,
      release: attributed.release,
      attributed: attributed.attributed,
      touchMany: attributed.touchMany,
      setMany: (params) => {
        if (!attributed.dragMany(params)) {
          for (const [name, value] of Object.entries(params)) {
            if (name in device.params) device.setParam(name, value)
          }
        }
        after()
      },
      releaseMany: attributed.releaseMany,
      setBypass: (enabled) => {
        if (!attributed.setBypass(enabled)) device.bypass = enabled
        after()
      },
      toggleBypass: () => {
        const next = !(attributed.bypass() ?? device.bypass)
        if (!attributed.setBypass(next)) device.bypass = next
        after()
      },
      applyPreset: (preset) => {
        const resolved = resolve(preset)
        const result = attributed.attributed
          ? applyPresetThrough(device, resolved, attributed.setMany)
          : applyPreset(device, resolved)
        after()
        return result
      },
      capturePreset: capture,
      reset: () => {
        const start = defaults()
        if (!attributed.setMany(start)) {
          for (const [name, value] of Object.entries(start)) device.setParam(name, value)
        }
        after()
      },
    }
  }, [device, descriptor, observable, attributed, taken])

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

/**
 * A descriptor's own preset by name, with every parameter in it. A factory
 * preset lists only what it changes, and what it leaves out is the default:
 * applied as written, it would keep whatever the preset before it had set, so
 * the same name would sound different depending on what came first.
 */
function factoryPreset(descriptor: DeviceDescriptor | null, device: Device, name: string): Preset {
  const source = requireDescriptor(descriptor, device)
  const preset = resolvePreset(source, name)
  return { ...preset, params: presetParams(source, preset) }
}

/** `applyPreset` as one score operation: the same params set, the same report. */
function applyPresetThrough(
  device: Device,
  preset: Preset,
  setMany: (params: Record<string, number>) => boolean,
): ApplyPresetResult {
  if (preset.deviceId !== device.id) {
    throw new Error(`live-mix: preset "${preset.name}" is for ${preset.deviceId}, not ${device.id}`)
  }
  const result: ApplyPresetResult = { applied: [], skipped: [] }
  const params: Record<string, number> = {}
  for (const [name, value] of Object.entries(preset.params)) {
    if (name in device.params) {
      params[name] = value
      result.applied.push(name)
    } else {
      result.skipped.push(name)
    }
  }
  if (result.applied.length > 0) setMany(params)
  return result
}

function requireDescriptor(descriptor: DeviceDescriptor | null, device: Device): DeviceDescriptor {
  if (!descriptor) {
    throw new Error(
      `live-mix/react: presets by name need a registry entry for "${device.id}" (pass { registry } or provide an engine)`,
    )
  }
  return descriptor
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
  /** Pointer down: with an arbiter, holds the parameter and starts a fresh undo gesture. */
  touch(): void
  /** Pointer up: the hold runs its timer and the gesture ends. */
  release(): void
  /** True when `set` writes attributed score operations through an arbiter. */
  attributed: boolean
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
  const attributed = useAttributedParams(device)

  const set = useCallback(
    (next: number) => {
      if (!attributed.set(name, next)) device.setParam(name, next)
      if (!observable) rerender()
    },
    [device, name, observable, attributed],
  )
  const setNormalized = useCallback(
    (position: number) => set(denormalizeParam(spec, position)),
    [set, spec],
  )
  const reset = useCallback(() => set(spec.default), [set, spec])
  const touch = useCallback(() => attributed.touch(name), [attributed, name])
  const release = useCallback(() => attributed.release(name), [attributed, name])

  return {
    device,
    name,
    spec,
    value,
    normalized: normalizeParam(spec, value),
    set,
    setNormalized,
    reset,
    touch,
    release,
    attributed: attributed.attributed,
  }
}
