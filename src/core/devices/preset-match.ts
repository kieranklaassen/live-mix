// Which preset a device is on. A device does not say: a preset is a set of
// parameter values, so the one that is "on" is the one whose values the
// parameters still have. A preset cell and a preset list read these, in
// whatever app draws them, so two apps name the same settings alike.

import { type ParamSpec } from '../params'
import { type Preset, type PresetSource } from './presets'

type Values = Readonly<Record<string, number>>
type Specs = Readonly<Record<string, ParamSpec>>

function near(spec: ParamSpec, a: number, b: number): boolean {
  // A device keeps its values in single precision; a ten-thousandth of the range is the same value.
  return Math.abs(a - b) <= (spec.max - spec.min) * 1e-4 + 1e-9
}

/**
 * Whether the parameters are where the preset puts them: the ones it names at
 * its values, and the rest where the device starts them. A preset lists only
 * what it changes, and loading it sets every parameter, so one it does not
 * name that has been turned has left the preset behind as much as one it
 * names. A preset that names nothing is the device as it starts; one that
 * names only parameters the device lacks is not its preset.
 */
export function presetIsOn(preset: Preset, values: Values, specs: Specs): boolean {
  const named = Object.keys(preset.params)
  if (named.length > 0 && !named.some((name) => Object.hasOwn(specs, name))) return false
  return Object.entries(specs).every(([name, spec]) => {
    // A parameter the preset does not name can still be called what every object has.
    const value = (Object.hasOwn(preset.params, name) ? preset.params[name] : null) ?? spec.default
    return near(spec, values[name], Math.min(spec.max, Math.max(spec.min, value)))
  })
}

/**
 * The presets a device no longer lists: ones that were retuned, under the
 * name and with the settings they had. A score saved with one opens on those
 * settings, so the parameters can still be on one, and its name says where
 * they are.
 */
export function retiredPresets(source: PresetSource | null | undefined): Preset[] {
  if (!source) return []
  return Object.entries(source.retiredPresets ?? {}).map(([name, params]) => ({
    name,
    deviceId: source.id,
    deviceVersion: source.version,
    params: { ...(params as Record<string, number>) },
  }))
}

/** Whether every parameter is where the device starts it. */
export function atDefaults(values: Values, specs: Specs): boolean {
  return Object.entries(specs).every(([name, spec]) => near(spec, values[name], spec.default))
}

/**
 * The preset the parameters are on, or null once one of them has been turned.
 * Two presets can put every parameter in the same place (one of them naming a
 * parameter at the value it starts on): the one picked last wins, then the
 * one that names the most.
 */
export function currentPreset(
  presets: readonly Preset[],
  values: Values,
  specs: Specs,
  last: string | null = null,
): Preset | null {
  const fitting = presets.filter((preset) => presetIsOn(preset, values, specs))
  if (fitting.length === 0) return null
  return (
    fitting.find((preset) => preset.name === last) ??
    fitting.reduce((best, preset) =>
      Object.keys(preset.params).length > Object.keys(best.params).length ? preset : best,
    )
  )
}

/** The preset `delta` steps from the current one, round the ends; from none, the first or the last. */
export function stepPreset(
  presets: readonly Preset[],
  current: string | null,
  delta: 1 | -1,
): Preset | null {
  if (presets.length === 0) return null
  const at = presets.findIndex((preset) => preset.name === current)
  if (at < 0) return delta > 0 ? presets[0] : presets[presets.length - 1]
  return presets[(at + delta + presets.length) % presets.length]
}
