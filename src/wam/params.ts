// `WamParameterInfo` → `ParamSpec`. A WAM describes its parameters at run
// time (`getParameterInfo()`); the library's contract wants a static table
// with numeric ids, ranges, a taper and a unit. The map is one-to-one and
// keyed by the WAM parameter id, so `setParam('gain', v)` reaches WAM param
// `gain`. What the contract cannot express yet (type, integer step, choice
// labels) rides along on `WamParamSpec`, so a UI can still draw a switch or a
// dropdown; the U23 follow-up `ParamSpec.step?/choices?` would land on the
// same field names.

import type { WamParameterInfo, WamParameterInfoMap, WamParameterType } from '@webaudiomodules/api'

import { type ParamSpec, type ParamTaper } from '../core/params'

export interface WamParamSpec extends ParamSpec {
  /** `'float' | 'int' | 'boolean' | 'choice'`. */
  type: WamParameterType
  /** Distance between valid values for int/boolean/choice params; 0 when continuous. */
  step: number
  /** Labels for `choice` params, indexed by value; empty otherwise. */
  choices: readonly string[]
  /** The WAM's own skew (`normalize(v) = u ** (1.5 ** -exponent)`); 0 is linear. */
  exponent: number
}

/**
 * Closest `ParamTaper` to a WAM skew: a positive exponent spends more of
 * the control travel on low values, which is what `'log'` means for a UI.
 * `'log'` needs a positive minimum; anything else stays linear.
 */
export function wamTaper(info: Pick<WamParameterInfo, 'exponent' | 'minValue'>): ParamTaper {
  return info.exponent > 0 && info.minValue > 0 ? 'log' : 'linear'
}

/** True when `info` can be represented (finite range, min < max). */
export function isMappableWamParam(info: WamParameterInfo): boolean {
  return (
    Number.isFinite(info.minValue) &&
    Number.isFinite(info.maxValue) &&
    info.minValue < info.maxValue &&
    Number.isFinite(info.defaultValue)
  )
}

/**
 * The grid of an `int` param whose author left `discreteStep` at 0: the SDK
 * would interpolate it continuously, but the declared type says integers.
 */
export function wamParamStep(info: Pick<WamParameterInfo, 'type' | 'discreteStep'>): number {
  if (info.discreteStep > 0) return info.discreteStep
  return info.type === 'int' ? 1 : 0
}

/** One spec; `id` is the position in the plugin's parameter table. */
export function wamParamSpec(info: WamParameterInfo, id: number): WamParamSpec {
  const min = info.minValue
  const max = info.maxValue
  return {
    id,
    name: info.label || info.id,
    min,
    max,
    default: Math.min(max, Math.max(min, info.defaultValue)),
    taper: wamTaper(info),
    unit: info.units ?? '',
    type: info.type,
    step: wamParamStep(info),
    choices: [...(info.choices ?? [])],
    exponent: info.exponent ?? 0,
  }
}

/**
 * The whole table, in the plugin's order. Params with a degenerate range are
 * left out (the SDK's `WamParameterInfo` constructor rejects them, so only a
 * hand-rolled plugin can produce one); `paramInfo` on the device still lists
 * them.
 */
export function wamParamSpecs(info: WamParameterInfoMap): Record<string, WamParamSpec> {
  const specs: Record<string, WamParamSpec> = {}
  let id = 0
  for (const [key, parameter] of Object.entries(info)) {
    if (!isMappableWamParam(parameter)) continue
    specs[key] = wamParamSpec(parameter, id)
    id += 1
  }
  return specs
}

/** Snap a value to the param's grid when it has one (int, boolean, choice). */
export function snapWamValue(spec: Pick<WamParamSpec, 'step' | 'min'>, value: number): number {
  if (spec.step <= 0) return value
  return spec.min + Math.round((value - spec.min) / spec.step) * spec.step
}
