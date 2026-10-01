// A hosted plug-in that is not there: the document was made on a machine with
// the plug-in (or with the host running) and is open somewhere without. The
// renderer refuses a document that names an unregistered device, and dropping
// the device would lose its settings, so the plug-in registers as
// `unavailable` with a stand-in: audio passes through untouched, every
// parameter value it is given is kept and handed back, and the document
// renders, saves and reloads as it was.

import { type Device } from '../core/devices/Device'
import { type DeviceDescriptor, type DeviceRegistry, devices } from '../core/devices'
import { type ParamSpec } from '../core/params'
import { allDevices, type Score } from '../score/schema'

export const NATIVE_DEVICE_PREFIX = 'native:'

/** Whether a registry id names a hosted plug-in. */
export function isNativeDeviceId(id: string): boolean {
  return id.startsWith(NATIVE_DEVICE_PREFIX)
}

/**
 * The plug-in's name out of its registry id. The host's ids read
 * `<format>-<name>-<hash>-<hash>`; anything else comes back as it is.
 */
export function nativePluginName(id: string): string {
  const plain = isNativeDeviceId(id) ? id.slice(NATIVE_DEVICE_PREFIX.length) : id
  const match = /^[^-]+-(.+)-[0-9a-f]+-[0-9a-f]+$/i.exec(plain)
  return match ? match[1] : plain
}

const MISSING_NOTICE = 'This plug-in is not available here.'
const PASS_THROUGH_NOTICE = 'Its sound passes through unchanged and its settings are kept.'

/** The stand-in for a plug-in that cannot be loaded here: a wire that remembers its settings. */
export class MissingNativeDevice implements Device {
  readonly id: string
  readonly params: Readonly<Record<string, ParamSpec>> = {}
  readonly panelParams: readonly string[] = []
  readonly input: GainNode
  readonly output: GainNode
  readonly latencySec = 0
  readonly latencySamples = 0
  /** Always true: what tells a stand-in from the plug-in. */
  readonly unavailable = true
  /** What a panel shows in place of the plug-in's knobs. */
  readonly notice: string
  bypass = false
  private readonly values = new Map<string, number>()

  /**
   * `reason` says why the plug-in is not there when more is known than that
   * it is missing ("it did not load: ..."); it becomes the stand-in's notice.
   */
  constructor(
    context: BaseAudioContext,
    id: string,
    params: Readonly<Record<string, number>> = {},
    reason?: string,
  ) {
    this.id = id
    this.notice = `${reason ?? MISSING_NOTICE} ${PASS_THROUGH_NOTICE}`
    this.input = context.createGain()
    this.output = this.input
    for (const [name, value] of Object.entries(params)) this.values.set(name, value)
  }

  /** Kept, not clamped: the range belongs to a plug-in that is not here to say. */
  setParam(name: string, value: number): void {
    if (Number.isFinite(value)) this.values.set(name, value)
  }

  getParam(name: string): number {
    return this.values.get(name) ?? 0
  }

  dispose(): void {
    this.input.disconnect()
  }
}

/** A registry descriptor for a plug-in that is not available. */
export interface MissingNativeDescriptor extends DeviceDescriptor {
  kind: 'native'
  dynamicParams: true
  unavailable: true
}

export function missingNativeDescriptor(id: string, name?: string): MissingNativeDescriptor {
  return {
    id,
    name: `${name ?? nativePluginName(id)} (not available)`,
    kind: 'native',
    category: 'plugin',
    description: `A plug-in that cannot be loaded here. ${PASS_THROUGH_NOTICE}`,
    version: 1,
    params: {},
    dynamicParams: true,
    unavailable: true,
    create: (context, options) => new MissingNativeDevice(context, id, options.params),
  }
}

export function isMissingNativeDescriptor(
  descriptor: DeviceDescriptor,
): descriptor is MissingNativeDescriptor {
  return descriptor.kind === 'native' && descriptor.unavailable === true
}

export function isMissingNativeDevice(device: Device): device is MissingNativeDevice {
  return (device as Partial<MissingNativeDevice>).unavailable === true
}

/**
 * Register a stand-in for every hosted plug-in `score` uses that `registry`
 * does not have, so the score renders. Call it after the plug-ins that are
 * available have been registered and before the score is loaded. Returns the
 * ids it stood in for.
 */
export function registerMissingNativeDevices(
  score: Score,
  registry: DeviceRegistry = devices,
): string[] {
  const added: string[] = []
  for (const { device } of allDevices(score)) {
    const id = device.deviceId
    if (!isNativeDeviceId(id) || registry.has(id)) continue
    registry.register(missingNativeDescriptor(id))
    added.push(id)
  }
  return added
}
