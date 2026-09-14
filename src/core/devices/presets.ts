// Presets are serialisable parameter snapshots: a name, the device type they
// belong to, the descriptor version they were captured against, and a partial
// param map. Anything a preset leaves out falls back to the param default, and
// values are clamped to the spec on the way in, so a preset from an older
// device version still loads (unknown params are dropped, new ones default).

import { clampParam, type ParamSpec } from '../params'
import { type Device } from './Device'

/** Bumped when the serialised shape changes; `parsePreset` refuses anything else. */
export const PRESET_FORMAT_VERSION = 1

export interface Preset {
  name: string
  /** `Device.id` / `DeviceDescriptor.id` this preset applies to. */
  deviceId: string
  /** `DeviceDescriptor.version` the params were captured against. */
  deviceVersion: number
  /** Partial snapshot; omitted params keep their defaults. */
  params: Readonly<Record<string, number>>
}

/** Wire format: a `Preset` plus the format version. */
export interface SerializedPreset extends Preset {
  format: typeof PRESET_FORMAT_VERSION
}

/** Factory presets as written in a descriptor: name → partial param map. */
export type PresetTable<P extends Record<string, ParamSpec> = Record<string, ParamSpec>> = Readonly<
  Record<string, Readonly<Partial<Record<keyof P & string, number>>>>
>

/** The subset of a descriptor `presets.ts` needs; avoids a cycle with registry.ts. */
export interface PresetSource<P extends Record<string, ParamSpec> = Record<string, ParamSpec>> {
  id: string
  version: number
  params: P
  presets?: PresetTable<P>
}

/** Materialise a descriptor's factory presets. */
export function listPresets(source: PresetSource): Preset[] {
  return Object.entries(source.presets ?? {}).map(([name, params]) => ({
    name,
    deviceId: source.id,
    deviceVersion: source.version,
    params: { ...(params as Record<string, number>) },
  }))
}

/** Every param at its spec default. */
export function defaultPreset(source: PresetSource, name = 'Default'): Preset {
  const params: Record<string, number> = {}
  for (const [key, spec] of Object.entries(source.params)) params[key] = spec.default
  return { name, deviceId: source.id, deviceVersion: source.version, params }
}

/**
 * Look a preset up by name in a descriptor's table, or validate a preset
 * object against the descriptor (device id must match).
 */
export function resolvePreset(source: PresetSource, preset: string | Preset): Preset {
  if (typeof preset === 'string') {
    const found = listPresets(source).find((candidate) => candidate.name === preset)
    if (!found) throw new Error(`live-mix: ${source.id} has no preset "${preset}"`)
    return found
  }
  if (preset.deviceId !== source.id) {
    throw new Error(`live-mix: preset "${preset.name}" is for ${preset.deviceId}, not ${source.id}`)
  }
  return preset
}

/**
 * The full param map a preset produces on a descriptor: defaults overlaid
 * with the preset's known params, each clamped to its spec. Unknown params
 * are dropped (the device no longer has them).
 */
export function presetParams(source: PresetSource, preset: Preset): Record<string, number> {
  const params = defaultPreset(source).params as Record<string, number>
  for (const [name, value] of Object.entries(preset.params)) {
    const spec = source.params[name]
    if (spec) params[name] = clampParam(spec, value)
  }
  return params
}

/** Snapshot every current parameter value of a live device. */
export function capturePreset(device: Device, name: string, deviceVersion = 1): Preset {
  const params: Record<string, number> = {}
  for (const key of Object.keys(device.params)) params[key] = device.getParam(key)
  return { name, deviceId: device.id, deviceVersion, params }
}

export interface ApplyPresetResult {
  /** Params the device had and now carries the preset's (clamped) value. */
  applied: string[]
  /** Params in the preset the device does not have. */
  skipped: string[]
}

/**
 * Set every param the device has from the preset; params the device lacks
 * are reported in `skipped`, not thrown, so older presets keep loading.
 */
export function applyPreset(device: Device, preset: Preset): ApplyPresetResult {
  if (preset.deviceId !== device.id) {
    throw new Error(`live-mix: preset "${preset.name}" is for ${preset.deviceId}, not ${device.id}`)
  }
  const result: ApplyPresetResult = { applied: [], skipped: [] }
  for (const [name, value] of Object.entries(preset.params)) {
    if (name in device.params) {
      device.setParam(name, value)
      result.applied.push(name)
    } else {
      result.skipped.push(name)
    }
  }
  return result
}

export function serializePreset(preset: Preset): string {
  const serialized: SerializedPreset = {
    format: PRESET_FORMAT_VERSION,
    name: preset.name,
    deviceId: preset.deviceId,
    deviceVersion: preset.deviceVersion,
    params: { ...preset.params },
  }
  return JSON.stringify(serialized)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Structural check for an in-memory preset (no format field required). */
export function isPreset(value: unknown): value is Preset {
  if (!isRecord(value)) return false
  if (typeof value.name !== 'string' || typeof value.deviceId !== 'string') return false
  if (typeof value.deviceVersion !== 'number' || !Number.isFinite(value.deviceVersion)) {
    return false
  }
  if (!isRecord(value.params)) return false
  return Object.values(value.params).every(
    (entry) => typeof entry === 'number' && Number.isFinite(entry),
  )
}

/** Parse `serializePreset` output (a JSON string or already-parsed value); throws on anything malformed. */
export function parsePreset(input: unknown): Preset {
  const value: unknown = typeof input === 'string' ? JSON.parse(input) : input
  if (!isRecord(value) || value.format !== PRESET_FORMAT_VERSION) {
    throw new Error(`live-mix: unsupported preset format (expected ${PRESET_FORMAT_VERSION})`)
  }
  if (!isPreset(value)) throw new Error('live-mix: malformed preset')
  return {
    name: value.name,
    deviceId: value.deviceId,
    deviceVersion: value.deviceVersion,
    params: { ...value.params },
  }
}
