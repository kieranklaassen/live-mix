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
  /**
   * Labels for an enumerated parameter, one per integer from `min` to `max`
   * (a filter type, a waveform, a mode). Present means the parameter is a
   * choice: panels step it by one and print the label instead of a number.
   */
  choices?: readonly string[]
  /**
   * The size of one step, for a parameter that only takes steps: 1 for a
   * count (voices, repeats, players). Panels move it a step at a time and
   * print it whole. Left out, a parameter without `choices` is continuous,
   * whatever its range: a tone from −1 to 1 is not three settings.
   */
  step?: number
  /**
   * What turning it does to the sound, in a sentence or two, for a host that
   * explains its controls (the kit's info view). Not its range or its unit:
   * those are in the fields above.
   */
  description?: string
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

/**
 * A parameter table with descriptions added to the parameters named: for a
 * table that is generated from somewhere that cannot carry them (a Faust
 * `.dsp`). Ids, ranges and everything else are the table's own.
 */
export function describeParams<P extends Record<string, ParamSpec>>(
  params: P,
  descriptions: Readonly<Partial<Record<keyof P, string>>>,
): P {
  const described: Record<string, ParamSpec> = {}
  for (const [name, spec] of Object.entries(params)) {
    const description = descriptions[name as keyof P]
    described[name] = description ? { ...spec, description } : spec
  }
  return described as P
}
