// The effects a chain of a pack can be made of: every stock effect that is a
// WASM module, so that `renderPatch` can run it and the bench can measure it.
// The sidechain ducker is not one (it is a worklet, and does nothing without
// a key signal).

import { type DeviceDescriptor } from '../../../../core/devices'
import { listPresets } from '../../../../core/devices/presets'
import { isWasmDescriptor } from '../../../descriptor'
import { STOCK_WASM_DEVICES } from '../../../registry'

export const BENCH_EFFECTS: readonly DeviceDescriptor[] = STOCK_WASM_DEVICES.filter(
  (device) => device.category !== 'instrument' && isWasmDescriptor(device),
)

const byId = new Map(BENCH_EFFECTS.map((device) => [device.id, device]))

export function benchEffect(id: string): DeviceDescriptor | undefined {
  return byId.get(id)
}

/** The names of the presets a device lists today, in its own order. */
export function presetNames(device: DeviceDescriptor): string[] {
  return listPresets(device).map((preset) => preset.name)
}
