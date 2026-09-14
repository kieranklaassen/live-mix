// WAMs in the device registry (U23). A registry descriptor needs a static
// param table before any instance exists, and a WAM only tells its params at
// run time, so a WAM joins the registry one of two ways: `describeWamDevice`
// probes the plugin once on a context (instantiate, read, dispose) and builds
// the descriptor; `wamDeviceDescriptor` builds it synchronously from a table
// a score persisted after an earlier probe. Either way `kind` is `'wam'`, the
// URL rides on the descriptor, and `registry.create(id, ctx, { preset, params })`
// instantiates through `WamDevice.create` like every other kind.

import type { WamDescriptor } from '@webaudiomodules/api'

import {
  type DeviceCategory,
  type DeviceDescriptor,
  type DeviceRegistry,
  type PresetTable,
  devices,
} from '../core/devices'
import { type ParamSpec } from '../core/params'
import { type WamParamSpec } from './params'
import {
  WamDevice,
  wamDeviceId,
  type WamDeviceOptions,
  type WamModuleImporter,
  type WamSource,
} from './WamDevice'

/** A registry descriptor for a WAM: `kind: 'wam'` plus where the plugin lives. */
export interface WamDeviceDescriptor<
  P extends Record<string, ParamSpec> = Record<string, WamParamSpec>,
> extends DeviceDescriptor<P> {
  kind: 'wam'
  /** The plugin's ES module URL, when it was given as one; a score references this. */
  url: string | undefined
  /** The plugin's own descriptor, when known (probe or persisted). */
  wam: WamDescriptor | undefined
}

/** Registry metadata a caller may set; everything has a default from the plugin. */
export interface WamDeviceMeta<P extends Record<string, ParamSpec> = Record<string, WamParamSpec>> {
  /** Registry id; defaults to `wam:<identifier>`. */
  id?: string
  /** Defaults to the plugin's `descriptor.name`. */
  name?: string
  /** Defaults to `'instrument'` for `isInstrument` plugins, else `'other'`. */
  category?: DeviceCategory
  /** Bump when the persisted param table changes incompatibly; presets record it. */
  version?: number
  presets?: PresetTable<P>
}

/** Options `describeWamDevice` hands to the probe and every later `create`. */
export type WamProbeOptions = Pick<WamDeviceOptions, 'host' | 'importModule' | 'initialState'>

/** Everything `wamDeviceDescriptor` needs to build a descriptor without a probe. */
export interface WamDescriptorSpec<
  P extends Record<string, ParamSpec> = Record<string, WamParamSpec>,
> extends WamDeviceMeta<P> {
  id: string
  name: string
  source: WamSource
  params: P
  wam?: WamDescriptor
  /** Used by `create` for URL sources; a probe's importer is carried over. */
  importModule?: WamModuleImporter
  host?: WamDeviceOptions['host']
}

/** Build a `'wam'` descriptor from a known param table (a persisted probe result). */
export function wamDeviceDescriptor<P extends Record<string, ParamSpec>>(
  spec: WamDescriptorSpec<P>,
): WamDeviceDescriptor<P> {
  const { id, name, source, params, presets, wam, importModule, host } = spec
  return {
    id,
    name,
    kind: 'wam',
    category: spec.category ?? (wam?.isInstrument ? 'instrument' : 'other'),
    version: spec.version ?? 1,
    params,
    presets,
    url: typeof source === 'string' ? source : undefined,
    wam,
    create: (context, options) =>
      WamDevice.create(context, source, {
        importModule,
        host,
        ...(options as WamDeviceOptions),
        id,
      }),
  }
}

/**
 * Instantiate the plugin once on `context`, read its descriptor and
 * parameter table, dispose it, and return the registry descriptor. The
 * probe's `host` and `importModule` are reused by `create`.
 */
export async function describeWamDevice(
  context: BaseAudioContext,
  source: WamSource,
  meta: WamDeviceMeta & WamProbeOptions = {},
): Promise<WamDeviceDescriptor> {
  const { host, importModule, initialState, ...rest } = meta
  const probe = await WamDevice.create(context, source, { host, importModule, initialState })
  try {
    return wamDeviceDescriptor({
      ...rest,
      id: rest.id ?? wamDeviceId(probe.descriptor),
      name: rest.name ?? probe.descriptor.name,
      source,
      params: probe.params,
      wam: probe.descriptor,
      importModule,
      host: probe.host,
    })
  } finally {
    probe.dispose()
  }
}

/**
 * `describeWamDevice` + `registry.register` (replacing an existing descriptor
 * with the same id), in `registry` or the default one.
 */
export async function registerWamDevice(
  context: BaseAudioContext,
  source: WamSource,
  meta: WamDeviceMeta & WamProbeOptions = {},
  registry: DeviceRegistry = devices,
): Promise<WamDeviceDescriptor> {
  const descriptor = await describeWamDevice(context, source, meta)
  registry.register(descriptor, { replace: true })
  return descriptor
}
