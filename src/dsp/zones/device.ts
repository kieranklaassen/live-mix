// Handing an instrument to a zone device through its entry points
// (cpp/common/device_api.h, "zone devices"). The worklet runs these between
// blocks, one per message; a render without an audio context (patch-render)
// runs them directly. No imports at run time: the worklet bundle includes
// this file whole.

import { type DeviceExports } from '../abi'
import { ZONE_FIELD_COUNT, type PreparedZoneLoad } from './zone-map'

/** True when the module has the zone entry points. */
export function takesZones(device: DeviceExports): boolean {
  return (
    typeof device.device_zones_begin === 'function' &&
    typeof device.device_zone_sample === 'function' &&
    typeof device.device_zone_sample_buffer === 'function' &&
    typeof device.device_zone_fields === 'function' &&
    typeof device.device_zone_add === 'function'
  )
}

/** Forget the device's instrument; what sounds fades. */
export function beginDeviceZones(device: DeviceExports): void {
  device.device_zones_begin?.()
}

/** Copy one sound into the device's pool: its index there, or -1 when it does not fit. */
export function writeDeviceZoneSample(
  device: DeviceExports,
  channels: readonly Float32Array[],
  sampleRate: number,
): number {
  const { device_zone_sample, device_zone_sample_buffer } = device
  if (!device_zone_sample || !device_zone_sample_buffer || channels.length === 0) return -1
  const frames = channels[0].length
  const count = Math.min(channels.length, 2)
  const index = device_zone_sample(frames, count, sampleRate)
  if (index < 0) return -1
  const store = new Float32Array(
    device.memory.buffer,
    device_zone_sample_buffer(index),
    frames * count,
  )
  for (let channel = 0; channel < count; channel += 1) {
    store.set(channels[channel].subarray(0, frames), channel * frames)
  }
  return index
}

/** Add zones from their fields (`ZONE_FIELD_COUNT` floats each); how many the device took. */
export function addDeviceZones(device: DeviceExports, fields: Float32Array): number {
  const { device_zone_fields, device_zone_add } = device
  if (!device_zone_fields || !device_zone_add) return 0
  const scratch = new Float32Array(device.memory.buffer, device_zone_fields(), ZONE_FIELD_COUNT)
  let added = 0
  for (let at = 0; at + ZONE_FIELD_COUNT <= fields.length; at += ZONE_FIELD_COUNT) {
    scratch.set(fields.subarray(at, at + ZONE_FIELD_COUNT))
    if (device_zone_add() >= 0) added += 1
  }
  return added
}

/** The whole of a prepared load in one go; the zones the device took. */
export function loadDeviceZones(device: DeviceExports, load: PreparedZoneLoad): number {
  if (!takesZones(device)) return 0
  beginDeviceZones(device)
  for (const sample of load.samples) {
    // The zones name their sounds by position: one that did not fit leaves nothing to map.
    if (writeDeviceZoneSample(device, sample.channels, sample.sampleRate) < 0) {
      beginDeviceZones(device)
      return 0
    }
  }
  return addDeviceZones(device, load.fields)
}
