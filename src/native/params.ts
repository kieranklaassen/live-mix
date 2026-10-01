// A hosted plug-in's parameter table → `ParamSpec`. The host reports every
// parameter normalised to 0..1 with the plug-in's own wording of the value;
// the contract wants a static table keyed by name with a range and a unit.
// A parameter with a few labelled steps becomes a choice (0..n−1 with
// `choices`); everything else stays 0..1 and takes its display text from the
// plug-in (`NativeDevice.paramText`).

import { type ParamSpec } from '../core/params'
import { type NativeParamInfo } from './protocol'

export interface NativeParamSpec extends ParamSpec {
  /** Position in the plug-in's parameter list; equal to `id`. */
  index: number
  /** The plug-in's own parameter id. */
  pluginParamId: string
  /** Steps of a choice, else 0. */
  steps: number
}

/**
 * The key of a parameter in `Device.params`: the plug-in's own id behind a
 * letter, so ids that are all digits (every VST3 id) keep the plug-in's order
 * instead of sorting numerically as object keys.
 */
export function nativeParamKey(info: Pick<NativeParamInfo, 'id'>): string {
  return `p${info.id}`
}

/** Whether a parameter belongs in the device's table at all. */
export function isExposedNativeParam(info: NativeParamInfo): boolean {
  return info.automatable && !info.bypass
}

function choiceCount(info: NativeParamInfo): number {
  return info.discrete && info.choices && info.choices.length >= 2 ? info.choices.length : 0
}

export function nativeParamSpec(info: NativeParamInfo): NativeParamSpec {
  const steps = choiceCount(info)
  const spec: NativeParamSpec = {
    id: info.index,
    index: info.index,
    pluginParamId: info.id,
    name: info.name || info.id,
    min: 0,
    max: steps > 0 ? steps - 1 : 1,
    default: fromNormalised({ steps }, info.default),
    taper: 'linear',
    unit: steps > 0 ? '' : info.label,
    steps,
  }
  if (steps > 0) spec.choices = info.choices
  return spec
}

/** The table of every exposed parameter, in the plug-in's order. */
export function nativeParamSpecs(
  infos: readonly NativeParamInfo[],
): Record<string, NativeParamSpec> {
  const specs: Record<string, NativeParamSpec> = {}
  for (const info of infos) {
    if (!isExposedNativeParam(info)) continue
    const key = nativeParamKey(info)
    if (key in specs) continue
    specs[key] = nativeParamSpec(info)
  }
  return specs
}

/** A spec value → the 0..1 position the host takes. */
export function toNormalised(spec: Pick<NativeParamSpec, 'steps'>, value: number): number {
  const position = spec.steps > 1 ? Math.round(value) / (spec.steps - 1) : value
  return Math.min(1, Math.max(0, Number.isFinite(position) ? position : 0))
}

/** A 0..1 position from the host → the spec's value. */
export function fromNormalised(spec: Pick<NativeParamSpec, 'steps'>, position: number): number {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(position) ? position : 0))
  return spec.steps > 1 ? Math.round(clamped * (spec.steps - 1)) : clamped
}

/**
 * A plug-in's wording of a value, cut to what fits under a knob. Most
 * plug-ins word their values well ("2.4 s", "Plate"); some print every digit
 * a float has ("220.000000 Hz"). A number with three or more decimals is
 * rounded to about three significant figures; anything else is left alone.
 */
export function tidyParamText(text: string): string {
  const match = /^\s*([+-]?\d+\.\d{3,})\s*(.*)$/.exec(text)
  if (!match) return text
  const value = Number(match[1])
  if (!Number.isFinite(value)) return text
  const size = Math.abs(value)
  const digits = size >= 100 ? 0 : size >= 10 ? 1 : 2
  const rounded = value.toFixed(digits)
  // Not "-0.00".
  const number = Number(rounded) === 0 ? (0).toFixed(digits) : rounded
  return match[2] ? `${number} ${match[2]}` : number
}
