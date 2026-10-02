// Hosted plug-ins in the device registry. A scan tells the host's plug-ins
// apart by id, name, vendor and whether they are instruments, but not their
// parameters: those are only known once a plug-in is loaded. So a hosted
// plug-in registers with an empty table and `dynamicParams`, the device a
// factory returns carries the real one, and `kind` is `'native'`. Effects
// land in the `'plugin'` category, instruments among the instruments.

import {
  type DeviceCategory,
  type DeviceDescriptor,
  type DeviceRegistry,
  devices,
} from '../core/devices'
import { type NativeHostClient } from './HostClient'
import { MissingNativeDevice, isMissingNativeDescriptor, missingNativeDescriptor } from './missing'
import { NativeDevice, nativeDeviceId, type NativeDeviceOptions } from './NativeDevice'
import { type NativeParamSpec } from './params'
import { type NativePluginInfo, type NativeScanOptions, type NativeScanResult } from './protocol'

/** A registry descriptor for a hosted plug-in. */
export interface NativeDeviceDescriptor extends DeviceDescriptor<Record<string, NativeParamSpec>> {
  kind: 'native'
  dynamicParams: true
  /** What the scan reported: format, vendor, file. */
  plugin: NativePluginInfo
}

/** Options every device made from the descriptor starts with (bridge latency, asset URLs). */
export type NativeDescriptorDefaults = Omit<NativeDeviceOptions, 'id' | 'params' | 'state'> & {
  /**
   * Told when an effect did not load and a stand-in took its place (see
   * `nativeDeviceDescriptor`), so the application can say so.
   */
  onLoadError?: (plugin: NativePluginInfo, error: Error) => void
}

export function nativeDeviceCategory(
  plugin: Pick<NativePluginInfo, 'isInstrument'>,
): DeviceCategory {
  return plugin.isInstrument ? 'instrument' : 'plugin'
}

/** One sentence for a device browser: format, vendor and the plug-in's own category. */
export function nativeDeviceDescription(plugin: NativePluginInfo): string {
  const maker = plugin.vendor ? ` by ${plugin.vendor}` : ''
  const kind = plugin.category ? ` (${plugin.category.replace(/\|/g, ', ')})` : ''
  return `${plugin.format} plug-in${maker}${kind}.`
}

/**
 * The registry descriptor of one hosted plug-in.
 *
 * A plug-in can fail to load where a built-in device cannot: its file was
 * removed after the scan, the host has gone, it refuses the sample rate. One
 * that fails comes back as a stand-in (`MissingNativeDevice`): an effect
 * passes its sound through, an instrument plays nothing, the settings it was
 * given are kept, and its panel says why. One plug-in that will not load then
 * costs that one device, not the render of the whole document.
 * `NativeDevice.create` called directly rejects instead.
 */
export function nativeDeviceDescriptor(
  client: NativeHostClient,
  plugin: NativePluginInfo,
  defaults: NativeDescriptorDefaults = {},
): NativeDeviceDescriptor {
  const id = nativeDeviceId(plugin.id)
  const { onLoadError, ...deviceDefaults } = defaults
  return {
    id,
    name: plugin.name,
    kind: 'native',
    category: nativeDeviceCategory(plugin),
    description: nativeDeviceDescription(plugin),
    version: 1,
    params: {},
    dynamicParams: true,
    plugin,
    create: async (context, options) => {
      try {
        return await NativeDevice.create(context, client, plugin.id, {
          ...deviceDefaults,
          ...(options as NativeDeviceOptions),
          id,
        })
      } catch (reason) {
        const error = reason instanceof Error ? reason : new Error(String(reason))
        onLoadError?.(plugin, error)
        return new MissingNativeDevice(
          context,
          id,
          options.params,
          `${plugin.name} did not load: ${error.message.replace(/^live-mix: /, '').replace(/\.$/, '')}.`,
          plugin.isInstrument,
        )
      }
    },
  }
}

/** A hosted plug-in that can be loaded (a stand-in for a missing one is not). */
export function isNativeDeviceDescriptor(
  descriptor: DeviceDescriptor,
): descriptor is NativeDeviceDescriptor {
  return descriptor.kind === 'native' && descriptor.unavailable !== true
}

/**
 * Put `plugins` in `registry` (the default one unless given), replacing an
 * earlier registration of the same plug-in. A hosted plug-in the list no
 * longer has stays registered as unavailable (`missing.ts`): a document may
 * still use it. Returns the descriptors of the plug-ins in the list.
 */
export function registerNativeDevices(
  client: NativeHostClient,
  plugins: readonly NativePluginInfo[],
  options: { registry?: DeviceRegistry; defaults?: NativeDescriptorDefaults } = {},
): NativeDeviceDescriptor[] {
  const registry = options.registry ?? devices
  const descriptors = plugins.map((plugin) =>
    nativeDeviceDescriptor(client, plugin, options.defaults),
  )
  const keep = new Set(descriptors.map((descriptor) => descriptor.id))
  for (const existing of registry.list({ kind: 'native' })) {
    if (keep.has(existing.id) || isMissingNativeDescriptor(existing)) continue
    registry.register(
      missingNativeDescriptor(
        existing.id,
        (existing as Partial<NativeDeviceDescriptor>).plugin?.name,
      ),
      { replace: true },
    )
  }
  for (const descriptor of descriptors) registry.register(descriptor, { replace: true })
  return descriptors
}

/** Scan with the host and register what it finds; the scan result comes back as well. */
export async function scanNativeDevices(
  client: NativeHostClient,
  options: NativeScanOptions & {
    registry?: DeviceRegistry
    defaults?: NativeDescriptorDefaults
  } = {},
): Promise<NativeScanResult & { descriptors: NativeDeviceDescriptor[] }> {
  const { registry, defaults, ...scan } = options
  const result = await client.scan(scan)
  return {
    ...result,
    descriptors: registerNativeDevices(client, result.plugins, { registry, defaults }),
  }
}
