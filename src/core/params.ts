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
