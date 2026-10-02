// A patch is a named set of devices with their settings: an instrument and the
// effects after it (an instrument preset), or effects alone (an effect chain).
// Where a `Preset` is one device's parameters, a patch is the whole sound.
// Each entry is a score device without its instance id, so a host that keeps
// its chains in a score document can store a patch as it stands.
//
// Nothing here knows which devices exist: a patch names registry ids, and the
// registry it is validated and instantiated against decides what they are.

import { type Device } from './Device'
import { hasPreset, presetParams, resolvePreset } from './presets'
import { type DeviceCreateRequest, type DeviceDescriptor, type DeviceRegistry } from './registry'

/** One device of a patch: which registry device, and its state. */
export interface PatchDevice {
  /** `DeviceDescriptor.id` in the registry, e.g. `'tape-echo'`. */
  deviceId: string
  /** A factory preset of that device by name; `params` overlay it. */
  preset?: string
  /** Explicit parameter values; anything omitted follows the preset or the spec default. */
  params?: Readonly<Record<string, number>>
  /** Loaded switched off, to be switched in by hand. */
  bypass?: boolean
}

export interface Patch {
  /** Stable id, unique within its bank: saved work refers to a patch by it. */
  id: string
  name: string
  /** Bank-defined group, e.g. `'pad'` or `'space'`. */
  category: string
  /** One sentence for a browser: what it sounds like and what it is for. */
  description: string
  /** What plays the notes; absent for an effect chain. */
  instrument?: PatchDevice
  /** The inserts in signal order: after the instrument, or the whole chain. */
  effects: readonly PatchDevice[]
}

/** A browser group of a patch bank, in menu order. */
export interface PatchCategory {
  id: string
  label: string
}

export interface PatchIssue {
  /** Where in the patch, e.g. `effects[1].params.mix`. */
  path: string
  message: string
}

/** True for an instrument preset, false for an effect chain. */
export function isInstrumentPatch(patch: Patch): patch is Patch & { instrument: PatchDevice } {
  return patch.instrument !== undefined
}

/** Every device of the patch in signal order, the instrument first. */
export function patchDevices(patch: Patch): PatchDevice[] {
  return patch.instrument ? [patch.instrument, ...patch.effects] : [...patch.effects]
}

function checkDevice(
  device: PatchDevice,
  path: string,
  registry: DeviceRegistry,
  role: 'instrument' | 'effect',
  issues: PatchIssue[],
): void {
  const descriptor = registry.get(device.deviceId)
  if (!descriptor) {
    issues.push({ path: `${path}.deviceId`, message: `unknown device "${device.deviceId}"` })
    return
  }
  const isInstrument = descriptor.category === 'instrument'
  if (role === 'instrument' && !isInstrument) {
    issues.push({ path: `${path}.deviceId`, message: `${descriptor.id} is not an instrument` })
  }
  if (role === 'effect' && isInstrument) {
    issues.push({
      path: `${path}.deviceId`,
      message: `${descriptor.id} is an instrument, not an effect`,
    })
  }
  if (device.preset !== undefined && !hasPreset(descriptor, device.preset)) {
    issues.push({
      path: `${path}.preset`,
      message: `${descriptor.id} has no preset "${device.preset}"`,
    })
  }
  for (const [name, value] of Object.entries(device.params ?? {})) {
    const spec = descriptor.params[name]
    if (!spec) {
      issues.push({
        path: `${path}.params.${name}`,
        message: `${descriptor.id} has no parameter "${name}"`,
      })
    } else if (!Number.isFinite(value) || value < spec.min || value > spec.max) {
      issues.push({
        path: `${path}.params.${name}`,
        message: `${value} is outside [${spec.min}, ${spec.max}]`,
      })
    }
  }
}

/**
 * What is wrong with a patch for this registry: unknown devices, presets and
 * parameters, values out of range, an effect in the instrument slot or the
 * other way round. An empty list means `createPatchDevice` will take it.
 */
export function validatePatch(patch: Patch, registry: DeviceRegistry): PatchIssue[] {
  const issues: PatchIssue[] = []
  if (!patch.id) issues.push({ path: 'id', message: 'expected a non-empty id' })
  if (!patch.name) issues.push({ path: 'name', message: 'expected a non-empty name' })
  if (patch.instrument) checkDevice(patch.instrument, 'instrument', registry, 'instrument', issues)
  patch.effects.forEach((device, index) =>
    checkDevice(device, `effects[${index}]`, registry, 'effect', issues),
  )
  if (!patch.instrument && patch.effects.length === 0) {
    issues.push({ path: 'effects', message: 'a patch needs an instrument or at least one effect' })
  }
  return issues
}

/**
 * The full parameter map a patch device produces on its descriptor: the spec
 * defaults, overlaid with its preset, overlaid with its own params, each
 * clamped to its spec. Parameters the descriptor does not have are dropped.
 */
export function patchDeviceParams(
  descriptor: DeviceDescriptor,
  device: PatchDevice,
): Record<string, number> {
  const base =
    device.preset === undefined
      ? {}
      : presetParams(descriptor, resolvePreset(descriptor, device.preset))
  return presetParams(descriptor, {
    name: device.preset ?? '',
    deviceId: descriptor.id,
    deviceVersion: descriptor.version,
    params: { ...base, ...device.params },
  })
}

/** Factory options handed through to every `registry.create` call (WASM overrides in tests). */
export type PatchCreateOptions = Omit<DeviceCreateRequest, 'preset' | 'params'>

/** Instantiate one patch device with its preset, params and bypass applied. */
export async function createPatchDevice(
  registry: DeviceRegistry,
  context: BaseAudioContext,
  device: PatchDevice,
  options: PatchCreateOptions = {},
): Promise<Device> {
  const created = await registry.create(device.deviceId, context, {
    ...options,
    ...(device.preset !== undefined ? { preset: device.preset } : {}),
    ...(device.params ? { params: device.params } : {}),
  })
  if (device.bypass) created.bypass = true
  return created
}

/**
 * Instantiate the patch's effects in order. All or nothing: when one fails to
 * load, the ones already made are disposed and the error is rethrown.
 */
export async function createPatchEffects(
  registry: DeviceRegistry,
  context: BaseAudioContext,
  patch: Patch,
  options: PatchCreateOptions = {},
): Promise<Device[]> {
  const settled = await Promise.allSettled(
    patch.effects.map((device) => createPatchDevice(registry, context, device, options)),
  )
  const failed = settled.find((result) => result.status === 'rejected')
  if (failed) {
    for (const result of settled) if (result.status === 'fulfilled') result.value.dispose()
    throw failed.reason
  }
  return settled.map((result) => (result as PromiseFulfilledResult<Device>).value)
}

/** What a patch's effects go onto: a channel strip or a bus. */
export interface PatchInsertHost {
  readonly inserts: readonly Device[]
  addInsert(device: Device): void
  removeInsert(device: Device): void
}

export interface ReplaceInsertsOptions {
  /** Leading inserts the host application owns (a trim, a fixed stage); they stay. */
  pinned?: number
}

/**
 * Swap the host's inserts (after the pinned ones) for `devices`. Returns the
 * inserts that came off, still alive, so the caller decides when to dispose
 * them: at once, or after their tails have rung out.
 */
export function replaceInserts(
  host: PatchInsertHost,
  devices: readonly Device[],
  options: ReplaceInsertsOptions = {},
): Device[] {
  const pinned = Math.max(0, Math.floor(options.pinned ?? 0))
  const removed = host.inserts.slice(pinned)
  for (const device of removed) host.removeInsert(device)
  for (const device of devices) host.addInsert(device)
  return removed
}

/** A device's current state as a patch device: every parameter, and bypass when on. */
export function capturePatchDevice(device: Device): PatchDevice {
  const params: Record<string, number> = {}
  for (const name of Object.keys(device.params)) params[name] = device.getParam(name)
  return { deviceId: device.id, params, ...(device.bypass ? { bypass: true } : {}) }
}

export interface CapturePatchOptions {
  id: string
  name: string
  category?: string
  description?: string
  /** The instrument in front of the effects, for an instrument preset. */
  instrument?: Device
  /** The effects in signal order (a strip's inserts after its pinned ones). */
  effects: readonly Device[]
}

/** Snapshot live devices as a patch: the reverse of `createPatchDevice`. */
export function capturePatch(options: CapturePatchOptions): Patch {
  return {
    id: options.id,
    name: options.name,
    category: options.category ?? 'user',
    description: options.description ?? '',
    ...(options.instrument ? { instrument: capturePatchDevice(options.instrument) } : {}),
    effects: options.effects.map(capturePatchDevice),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPatchDevice(value: unknown): value is PatchDevice {
  if (!isRecord(value) || typeof value.deviceId !== 'string') return false
  if (value.preset !== undefined && typeof value.preset !== 'string') return false
  if (value.bypass !== undefined && typeof value.bypass !== 'boolean') return false
  if (value.params === undefined) return true
  return (
    isRecord(value.params) &&
    Object.values(value.params).every(
      (entry) => typeof entry === 'number' && Number.isFinite(entry),
    )
  )
}

/** Structural check for a patch read back from storage; `validatePatch` checks it against a registry. */
export function isPatch(value: unknown): value is Patch {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false
  if (typeof value.category !== 'string' || typeof value.description !== 'string') return false
  if (value.instrument !== undefined && !isPatchDevice(value.instrument)) return false
  return Array.isArray(value.effects) && value.effects.every(isPatchDevice)
}
