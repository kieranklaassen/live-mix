/** How a parameter maps from a 0..1 control position to its value. */
export type ParamTaper = 'linear' | 'log'

/** Static description of one device parameter; lives next to each device. */
export interface ParamSpec {
  /** Id passed to `device_set_param`. */
  id: number
  name: string
  min: number
  max: number
  default: number
  taper: ParamTaper
  unit: string
}

export function clampParam(spec: ParamSpec, value: number): number {
  if (!Number.isFinite(value)) return spec.default
  return Math.min(spec.max, Math.max(spec.min, value))
}

/** Value → 0..1 control position under the spec's taper. */
export function normalizeParam(spec: ParamSpec, value: number): number {
  const clamped = clampParam(spec, value)
  if (spec.taper === 'log' && spec.min > 0) {
    return Math.log(clamped / spec.min) / Math.log(spec.max / spec.min)
  }
  return (clamped - spec.min) / (spec.max - spec.min)
}

/** 0..1 control position → value under the spec's taper, clamped to the range. */
export function denormalizeParam(spec: ParamSpec, position: number): number {
  const u = Number.isFinite(position) ? Math.min(1, Math.max(0, position)) : 0
  if (spec.taper === 'log' && spec.min > 0) {
    return clampParam(spec, spec.min * Math.pow(spec.max / spec.min, u))
  }
  return clampParam(spec, spec.min + (spec.max - spec.min) * u)
}
