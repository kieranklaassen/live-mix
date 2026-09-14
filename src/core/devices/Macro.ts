// Macro controls and the maths that maps them onto device parameters (R10).
// A macro is a hand-set 0..1 position — U19's `Macro`, so it is a `ModSource`
// any route can read — and a mapping turns that position into a parameter
// value: a curve shapes the position, then it lands on a `[min, max]` range in
// the parameter's own taper (log-taper params sweep geometrically). Every
// function here is pure so a UI draws exactly the value the device receives.

import { clampParam, type ParamSpec, type ParamTaper } from '../params'
import { Macro } from '../automation/Modulator'
import { type Device } from './Device'

/** How a macro's 0..1 position is shaped before it lands on the range. */
export type MacroCurve = 'linear' | 'exponential' | 'logarithmic' | 's-curve'

export const MACRO_CURVES: readonly MacroCurve[] = [
  'linear',
  'exponential',
  'logarithmic',
  's-curve',
]

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/**
 * The shaped position, 0..1 → 0..1. `exponential` is slow to start (x²),
 * `logarithmic` its mirror (1 − (1 − x)²), `s-curve` the smoothstep
 * 3x² − 2x³; every curve pins 0 → 0 and 1 → 1.
 */
export function macroCurve(curve: MacroCurve, position: number): number {
  const x = clampUnit(position)
  switch (curve) {
    case 'linear':
      return x
    case 'exponential':
      return x * x
    case 'logarithmic':
      return 1 - (1 - x) * (1 - x)
    case 's-curve':
      return x * x * (3 - 2 * x)
    default: {
      const exhaustive: never = curve
      return exhaustive
    }
  }
}

/** Inverse of `macroCurve`: the position that produces `shaped`. */
export function macroCurveInverse(curve: MacroCurve, shaped: number): number {
  const y = clampUnit(shaped)
  switch (curve) {
    case 'linear':
      return y
    case 'exponential':
      return Math.sqrt(y)
    case 'logarithmic':
      return 1 - Math.sqrt(1 - y)
    case 's-curve':
      // Closed-form inverse of the smoothstep on [0, 1].
      return 0.5 - Math.sin(Math.asin(1 - 2 * y) / 3)
    default: {
      const exhaustive: never = curve
      return exhaustive
    }
  }
}

/**
 * A 0..1 position onto `[min, max]` in the param's taper: linear
 * interpolation, or geometric for `log` (both ends must be positive, as the
 * `ParamSpec` guarantees). `min > max` inverts the sweep.
 */
export function taperValue(taper: ParamTaper, position: number, min: number, max: number): number {
  const u = clampUnit(position)
  switch (taper) {
    case 'linear':
      return min + (max - min) * u
    case 'log':
      if (min <= 0 || max <= 0) return min + (max - min) * u
      return min * Math.pow(max / min, u)
    default: {
      const exhaustive: never = taper
      return exhaustive
    }
  }
}

/** Inverse of `taperValue`: where `value` sits on `[min, max]`, 0..1. */
export function taperPosition(taper: ParamTaper, value: number, min: number, max: number): number {
  if (min === max) return 0
  switch (taper) {
    case 'linear':
      return clampUnit((value - min) / (max - min))
    case 'log':
      if (min <= 0 || max <= 0 || value <= 0) return clampUnit((value - min) / (max - min))
      return clampUnit(Math.log(value / min) / Math.log(max / min))
    default: {
      const exhaustive: never = taper
      return exhaustive
    }
  }
}

export interface MacroMappingOptions {
  /** Param value at macro 0; default the spec's `min`. Clamped into the spec range. */
  min?: number
  /** Param value at macro 1; default the spec's `max`. `min > max` inverts. */
  max?: number
  curve?: MacroCurve
}

/** The pure part of a mapping: enough to compute values without a device. */
export interface MacroMappingShape {
  readonly spec: ParamSpec
  min: number
  max: number
  curve: MacroCurve
}

/** One macro → one device parameter, with its range and curve. */
export interface MacroMapping extends MacroMappingShape {
  /** Macro index within its rack. */
  readonly macro: number
  readonly device: Device
  readonly param: string
}

/** The param value a mapping produces at `position` — the formula the device receives. */
export function macroMappedValue(mapping: MacroMappingShape, position: number): number {
  const shaped = macroCurve(mapping.curve, position)
  return clampParam(mapping.spec, taperValue(mapping.spec.taper, shaped, mapping.min, mapping.max))
}

/** The macro position that produces `value` through the mapping (clamped to 0..1). */
export function macroPositionFor(mapping: MacroMappingShape, value: number): number {
  const shaped = taperPosition(mapping.spec.taper, value, mapping.min, mapping.max)
  return macroCurveInverse(mapping.curve, shaped)
}

/** Build and validate a mapping onto `device.params[param]`; the range is clamped into the spec. */
export function createMacroMapping(
  macro: number,
  device: Device,
  param: string,
  options: MacroMappingOptions = {},
): MacroMapping {
  const spec = device.params[param]
  if (!spec) throw new Error(`live-mix: ${device.id} has no parameter "${param}"`)
  if (!Number.isInteger(macro) || macro < 0) {
    throw new Error(`live-mix: macro index must be a non-negative integer, got ${macro}`)
  }
  const min = options.min === undefined ? spec.min : clampParam(spec, options.min)
  const max = options.max === undefined ? spec.max : clampParam(spec, options.max)
  return { macro, device, param, spec, min, max, curve: options.curve ?? 'linear' }
}

/**
 * A rack's macro: U19's `Macro` (a shareable `ModSource`) that also tells its
 * rack when it moves, so `macro.set()` and `rack.setParam()` are one path.
 */
export class RackMacro extends Macro {
  readonly index: number
  name: string
  private readonly onChange: (macro: RackMacro) => void

  constructor(index: number, name: string, onChange: (macro: RackMacro) => void, value = 0) {
    super(value)
    this.index = index
    this.name = name
    this.onChange = onChange
  }

  override set(value: number): void {
    const before = this.value
    super.set(value)
    if (this.value !== before) this.onChange(this)
  }
}
