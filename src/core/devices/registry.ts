// The device registry: id → static descriptor (metadata, param table, factory
// presets, version) + factory. The engine and any UI enumerate devices here
// and instantiate them uniformly, whether the DSP is a stock Web Audio graph,
// a WASM worklet, or something registered later (Faust, WAM). Registration is
// open: consumers call `register` with their own descriptors, and a factory
// may load its code lazily since `create` is always awaited.

import { type ParamSpec } from '../params'
import { type Device } from './Device'
import {
  type Preset,
  type PresetTable,
  capturePreset,
  listPresets,
  presetParams,
  resolvePreset,
} from './presets'

/** Where a device's DSP runs. Open-ended for later hosts. */
export type DeviceKind = 'node' | 'wasm' | 'wam' | (string & {})

/** Menu grouping for device lists. */
export type DeviceCategory =
  'eq' | 'dynamics' | 'delay' | 'reverb' | 'spatial' | 'utility' | 'instrument' | 'other'

/** Options every factory understands; factories may accept more (WASM asset overrides, …). */
export interface DeviceCreateOptions {
  /** Initial parameter values by name; anything omitted uses the spec default. */
  params?: Readonly<Record<string, number>>
}

export type DeviceFactory = (
  context: BaseAudioContext,
  options: DeviceCreateOptions,
) => Device | Promise<Device>

export interface DeviceDescriptor<P extends Record<string, ParamSpec> = Record<string, ParamSpec>> {
  /** Device type id, e.g. `'filter'`; equals `Device.id` of what `create` returns. */
  id: string
  /** Human-readable name for device lists. */
  name: string
  kind: DeviceKind
  category: DeviceCategory
  /** Bump when the param table changes incompatibly; presets record it. */
  version: number
  /** Static parameter table, readable before the device is instantiated. */
  params: P
  /** Factory presets: name → partial param map. */
  presets?: PresetTable<P>
  /**
   * Shipped but over the CPU budget or otherwise not yet cleared for
   * production (see docs/devices.md); hosts may hide or label it. Absent
   * means false.
   */
  experimental?: boolean
  create: DeviceFactory
}

export interface DeviceCreateRequest extends DeviceCreateOptions {
  /** A factory preset by name, or any preset for this device; `params` win over it. */
  preset?: string | Preset
  /** Anything else is handed to the factory untouched (e.g. WASM `processorUrl`, `wasm`, `createNode`). */
  [option: string]: unknown
}

export interface DeviceFilter {
  kind?: DeviceKind
  category?: DeviceCategory
}

export type DeviceRegistryEvent =
  | { type: 'register'; descriptor: DeviceDescriptor }
  | { type: 'unregister'; descriptor: DeviceDescriptor }

export type DeviceRegistryListener = (event: DeviceRegistryEvent) => void

export interface RegisterOptions {
  /** Replace an existing descriptor with the same id instead of throwing. */
  replace?: boolean
}

/** Throws when a descriptor could not be presented or instantiated safely. */
export function validateDescriptor(descriptor: DeviceDescriptor): void {
  const { id } = descriptor
  if (!id) throw new Error('live-mix: device descriptor needs an id')
  if (!descriptor.name) throw new Error(`live-mix: device ${id} needs a name`)
  if (!Number.isInteger(descriptor.version) || descriptor.version < 1) {
    throw new Error(`live-mix: device ${id} needs an integer version ≥ 1`)
  }
  if (typeof descriptor.create !== 'function') {
    throw new Error(`live-mix: device ${id} needs a create factory`)
  }
  const entries = Object.entries(descriptor.params)
  if (entries.length === 0) throw new Error(`live-mix: device ${id} has no parameters`)
  const ids = new Set<number>()
  for (const [name, spec] of entries) {
    const where = `live-mix: device ${id} param "${name}"`
    if (ids.has(spec.id)) throw new Error(`${where} reuses param id ${spec.id}`)
    ids.add(spec.id)
    if (!(spec.min < spec.max)) throw new Error(`${where} needs min < max`)
    if (spec.default < spec.min || spec.default > spec.max) {
      throw new Error(`${where} default ${spec.default} is outside [${spec.min}, ${spec.max}]`)
    }
    if (spec.taper === 'log' && spec.min <= 0) {
      throw new Error(`${where} has a log taper but min ${spec.min} is not positive`)
    }
  }
  for (const preset of listPresets(descriptor)) {
    for (const [name, value] of Object.entries(preset.params)) {
      const spec = descriptor.params[name]
      const where = `live-mix: device ${id} preset "${preset.name}"`
      if (!spec) throw new Error(`${where} sets unknown param "${name}"`)
      if (!Number.isFinite(value) || value < spec.min || value > spec.max) {
        throw new Error(`${where} sets "${name}" to ${value}, outside [${spec.min}, ${spec.max}]`)
      }
    }
  }
}

export class DeviceRegistry {
  private readonly descriptors = new Map<string, DeviceDescriptor>()
  private readonly listeners = new Set<DeviceRegistryListener>()

  constructor(initial: Iterable<DeviceDescriptor> = []) {
    for (const descriptor of initial) this.register(descriptor)
  }

  /** Add a descriptor; throws on a duplicate id unless `replace` is set. */
  register<P extends Record<string, ParamSpec>>(
    descriptor: DeviceDescriptor<P>,
    options: RegisterOptions = {},
  ): this {
    const generic = descriptor as DeviceDescriptor
    validateDescriptor(generic)
    if (this.descriptors.has(descriptor.id) && !options.replace) {
      throw new Error(`live-mix: device "${descriptor.id}" is already registered`)
    }
    this.descriptors.set(descriptor.id, generic)
    this.emit({ type: 'register', descriptor: generic })
    return this
  }

  unregister(id: string): boolean {
    const descriptor = this.descriptors.get(id)
    if (!descriptor) return false
    this.descriptors.delete(id)
    this.emit({ type: 'unregister', descriptor })
    return true
  }

  has(id: string): boolean {
    return this.descriptors.has(id)
  }

  get(id: string): DeviceDescriptor | undefined {
    return this.descriptors.get(id)
  }

  /** Like `get`, but throws for an unknown id. */
  describe(id: string): DeviceDescriptor {
    const descriptor = this.descriptors.get(id)
    if (!descriptor) throw new Error(`live-mix: unknown device "${id}"`)
    return descriptor
  }

  /** Descriptors in registration order, optionally filtered by kind and category. */
  list(filter: DeviceFilter = {}): DeviceDescriptor[] {
    return [...this.descriptors.values()].filter(
      (descriptor) =>
        (filter.kind === undefined || descriptor.kind === filter.kind) &&
        (filter.category === undefined || descriptor.category === filter.category),
    )
  }

  ids(): string[] {
    return [...this.descriptors.keys()]
  }

  /** Factory presets of one device, materialised. */
  presets(id: string): Preset[] {
    return listPresets(this.describe(id))
  }

  /**
   * Instantiate a device by id. A `preset` (name or object) seeds the params,
   * explicit `params` override it, and every other option reaches the factory
   * untouched.
   */
  async create(
    id: string,
    context: BaseAudioContext,
    request: DeviceCreateRequest = {},
  ): Promise<Device> {
    const descriptor = this.describe(id)
    const { preset, params, ...rest } = request
    const seeded =
      preset === undefined ? {} : presetParams(descriptor, resolvePreset(descriptor, preset))
    const device = await descriptor.create(context, { ...rest, params: { ...seeded, ...params } })
    if (device.id !== descriptor.id) {
      device.dispose()
      throw new Error(`live-mix: device "${descriptor.id}" created a device with id "${device.id}"`)
    }
    return device
  }

  /** Snapshot a live device's params as a preset stamped with its descriptor version. */
  capturePreset(device: Device, name: string): Preset {
    return capturePreset(device, name, this.describe(device.id).version)
  }

  /** Subscribe to registrations; returns the unsubscribe function. */
  onChange(listener: DeviceRegistryListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(event: DeviceRegistryEvent): void {
    for (const listener of this.listeners) listener(event)
  }
}
