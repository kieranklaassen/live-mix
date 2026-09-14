// Pure value mapping for DAW-style knobs, faders and meters. Moved from
// ambient-live's `components/daw/control-math.ts` (U25) and extended with the
// fader law, the meter scale and the `ParamSpec` helpers the generated device
// panel needs. Everything here is a formula the DSP also uses (R33): levels
// go through the core's `dbToGain`/`gainToDb`, tapers through the same
// normalisation as `useDeviceParam`.

import { dbToGain, gainToDb } from '../../core/devices/native/units'
import { type ParamSpec } from '../../core/params'

/**
 * How a control position (0..1) maps to a value. `linear` and `log` are the
 * core's `ParamTaper`; `skewed` bunches resolution near the minimum, `fader`
 * near the maximum (a DAW fader in dB: 0 dB sits around 80 % of the travel).
 */
export type ControlTaper = 'linear' | 'log' | 'skewed' | 'fader'

/** Units `formatControlValue` knows how to print; any other string is appended verbatim. */
export type KnownControlUnit = 'ratio' | 'ms' | 's' | 'dB' | 'Hz' | '%' | 'pan' | 'raw' | ''
export type ControlUnit = KnownControlUnit | (string & {})

/** Full knob sweep in degrees (Ableton-style bottom gap). */
export const KNOB_SWEEP_DEG = 270
/** Start angle with 0° at east, clockwise-positive SVG angles. */
export const KNOB_START_DEG = -225

/** Exponent of the `fader` taper (0 dB at ≈ 80 % of a −60…+6 dB travel). */
export const FADER_SKEW = 1.5
/** Bottom of a strip fader in dB; at or below it the level is 0 (−∞). */
export const FADER_MIN_DB = -60
/** Top of a strip fader in dB. */
export const FADER_MAX_DB = 6

/** Meter floor in dB; readings below draw as empty. */
export const METER_FLOOR_DB = -60
/** Meter floor for loudness bars in LUFS. */
export const LUFS_FLOOR = -40

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

function assertRange(min: number, max: number): void {
  if (!(max > min)) {
    throw new RangeError(`control range requires max > min (got min=${min}, max=${max})`)
  }
}

/** Map a value in [min, max] to a normalised position [0, 1] under a taper. */
export function normalizeValue(
  value: number,
  min: number,
  max: number,
  taper: ControlTaper = 'linear',
  skew = 2,
): number {
  assertRange(min, max)
  const clamped = clamp(value, min, max)
  const linear = (clamped - min) / (max - min)

  switch (taper) {
    case 'linear':
      return linear
    case 'log': {
      if (min <= 0) throw new RangeError('log taper requires min > 0')
      const logMin = Math.log(min)
      const logMax = Math.log(max)
      return (Math.log(clamped) - logMin) / (logMax - logMin)
    }
    case 'skewed': {
      const safeSkew = skew <= 0 ? 1 : skew
      return Math.pow(linear, 1 / safeSkew)
    }
    case 'fader':
      return 1 - Math.pow(1 - linear, 1 / FADER_SKEW)
    default: {
      const _exhaustive: never = taper
      return _exhaustive
    }
  }
}

/** Map a normalised position [0, 1] back to [min, max] under a taper. */
export function denormalizeValue(
  normalized: number,
  min: number,
  max: number,
  taper: ControlTaper = 'linear',
  skew = 2,
): number {
  assertRange(min, max)
  const t = clamp01(normalized)

  switch (taper) {
    case 'linear':
      return min + t * (max - min)
    case 'log': {
      if (min <= 0) throw new RangeError('log taper requires min > 0')
      const logMin = Math.log(min)
      const logMax = Math.log(max)
      return Math.exp(logMin + t * (logMax - logMin))
    }
    case 'skewed': {
      const safeSkew = skew <= 0 ? 1 : skew
      return min + Math.pow(t, safeSkew) * (max - min)
    }
    case 'fader':
      return max - Math.pow(1 - t, FADER_SKEW) * (max - min)
    default: {
      const _exhaustive: never = taper
      return _exhaustive
    }
  }
}

/** Snap to a step grid inside [min, max]; a step of 0 only clamps. */
export function quantize(value: number, step: number, min: number, max: number): number {
  if (!(step > 0)) return clamp(value, min, max)
  const stepped = min + Math.round((value - min) / step) * step
  const decimals = Math.min(6, Math.max(0, Math.ceil(-Math.log10(step))))
  const rounded = Number(stepped.toFixed(decimals))
  return clamp(rounded, min, max)
}

/** Move `steps` steps (a tenth of a step when `fine`) and quantize. */
export function stepBy(
  value: number,
  steps: number,
  step: number,
  min: number,
  max: number,
  fine = false,
): number {
  const amount = fine ? step * 0.1 : step
  return quantize(value + steps * amount, amount < step ? amount : step, min, max)
}

/** Pointer pixels → normalised delta. Positive dy decreases (drag up = louder). */
export function pointerDeltaToNormDelta(deltaY: number, sensitivityPx = 120, fine = false): number {
  const scale = fine ? sensitivityPx * 4 : sensitivityPx
  return -deltaY / scale
}

/**
 * Wheel delta → normalised delta. Scroll up (negative `deltaY`) increases.
 * Line and page modes are scaled to pixels first; a notch moves 2.5 % of the
 * travel, a tenth of that with `fine`.
 */
export function wheelDeltaToNormDelta(deltaY: number, deltaMode = 0, fine = false): number {
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY
  const notches = pixels / 100
  return -notches * (fine ? 0.0025 : 0.025)
}

export function normToKnobAngle(normalized: number): number {
  return KNOB_START_DEG + clamp01(normalized) * KNOB_SWEEP_DEG
}

export function knobAngleToNorm(angleDeg: number): number {
  const swept = (((angleDeg - KNOB_START_DEG) % 360) + 360) % 360
  return clamp01(swept / KNOB_SWEEP_DEG)
}

/** SVG arc path for a circular indicator from `startNorm` to `endNorm` (0–1). */
export function knobArcPath(
  cx: number,
  cy: number,
  radius: number,
  startNorm: number,
  endNorm: number,
): string {
  const start = normToKnobAngle(startNorm)
  const end = normToKnobAngle(endNorm)
  const startRad = (start * Math.PI) / 180
  const endRad = (end * Math.PI) / 180
  const x1 = cx + radius * Math.cos(startRad)
  const y1 = cy + radius * Math.sin(startRad)
  const x2 = cx + radius * Math.cos(endRad)
  const y2 = cy + radius * Math.sin(endRad)
  const sweep = endNorm >= startNorm ? endNorm - startNorm : 0
  const largeArc = sweep * KNOB_SWEEP_DEG > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
}

// --- Levels: the strip fader in dB, the meter scale -----------------------------

/** Fader dB → linear level through the DSP's own `dbToGain`; at or below `minDb` the level is 0. */
export function faderDbToLevel(db: number, minDb = FADER_MIN_DB): number {
  if (!Number.isFinite(db) || db <= minDb) return 0
  return dbToGain(db)
}

/** Linear level → fader dB through `gainToDb`, clamped to the fader range (0 reads as `minDb`). */
export function levelToFaderDb(level: number, minDb = FADER_MIN_DB, maxDb = FADER_MAX_DB): number {
  if (!(level > 0)) return minDb
  return clamp(gainToDb(level), minDb, maxDb)
}

/** A dB reading → 0..1 bar length between `floorDb` and `ceilDb`. */
export function dbToMeterPosition(db: number, floorDb = METER_FLOOR_DB, ceilDb = 0): number {
  if (!Number.isFinite(db)) return db > 0 ? 1 : 0
  return clamp01((db - floorDb) / (ceilDb - floorDb))
}

/** A linear level (0..1) → bar length on the dB meter scale, via `gainToDb`. */
export function levelToMeterPosition(level: number, floorDb = METER_FLOOR_DB): number {
  return dbToMeterPosition(gainToDb(level), floorDb, 0)
}

// --- Formatting ----------------------------------------------------------------

function formatHz(value: number, digits?: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(digits ?? 2)} kHz`
  return `${value.toFixed(digits ?? (value < 100 ? 1 : 0))} Hz`
}

function formatDb(value: number, digits?: number): string {
  if (value === Number.NEGATIVE_INFINITY) return '-∞ dB'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits ?? 1)} dB`
}

/** −1…1 → `L50` / `C` / `R50`. */
function formatPan(value: number): string {
  const amount = Math.round(Math.abs(value) * 50)
  if (amount === 0) return 'C'
  return `${value < 0 ? 'L' : 'R'}${amount}`
}

/** Print a value with its unit; unknown units are appended after a space. */
export function formatControlValue(
  value: number,
  unit: ControlUnit = 'ratio',
  digits?: number,
): string {
  const known = unit as KnownControlUnit
  switch (known) {
    case 'ratio':
    case '':
      return value.toFixed(digits ?? 2)
    case 'ms':
      return `${value < 10 ? value.toFixed(digits ?? 1) : Math.round(value)} ms`
    case 's':
      return `${value.toFixed(digits ?? 2)} s`
    case 'dB':
      return formatDb(value, digits)
    case 'Hz':
      return formatHz(value, digits)
    case '%':
      return `${Math.round(value)} %`
    case 'pan':
      return formatPan(value)
    case 'raw':
      return String(value)
    default: {
      const _exhaustive: never = known
      return `${value.toFixed(digits ?? 2)} ${String(_exhaustive)}`
    }
  }
}

/** Seconds → `m:ss.t` (or `h:mm:ss.t`) for a position readout. */
export function formatTimeSec(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  // Truncate to tenths: a readout must not run ahead of the playhead.
  const secs = Math.floor((total % 60) * 10) / 10
  const secText = secs < 10 ? `0${secs.toFixed(1)}` : secs.toFixed(1)
  const minuteText = hours > 0 && minutes < 10 ? `0${minutes}` : String(minutes)
  return hours > 0 ? `${hours}:${minuteText}:${secText}` : `${minuteText}:${secText}`
}

// --- ParamSpec helpers for the generated device panel --------------------------------

/**
 * True for a small integer range (2…32 steps) with an integer default and no
 * unit — a choice like a filter type. A 0…1 range is never a choice here
 * (`width`, `mix`); pass `choiceLabels` to the panel to force one.
 */
export function isChoiceParam(spec: ParamSpec): boolean {
  const span = spec.max - spec.min
  return (
    spec.taper === 'linear' &&
    spec.unit === '' &&
    Number.isInteger(spec.min) &&
    Number.isInteger(spec.max) &&
    Number.isInteger(spec.default) &&
    span >= 2 &&
    span <= 32
  )
}

/**
 * A sensible step for a spec that has none: 1 for choices, unit-based for
 * dB/ms/%, no quantisation (0) for log tapers, otherwise a power of ten near
 * a five-hundredth of the range.
 */
export function paramStep(spec: ParamSpec): number {
  if (isChoiceParam(spec)) return 1
  if (spec.taper === 'log') return 0
  const range = spec.max - spec.min
  switch (spec.unit) {
    case 'dB':
      return 0.1
    case 'ms':
      return range > 100 ? 1 : 0.1
    case '%':
      return range >= 50 ? 1 : 0.1
    case 's':
      return 0.01
    default:
      return Math.pow(10, Math.floor(Math.log10(range / 500)))
  }
}

/** The spec's taper as a `ControlTaper`. */
export function paramTaper(spec: ParamSpec): ControlTaper {
  return spec.taper === 'log' && spec.min > 0 ? 'log' : 'linear'
}

/** Format a parameter value with the spec's unit (choices print as integers). */
export function formatParamValue(spec: ParamSpec, value: number): string {
  if (isChoiceParam(spec)) return String(Math.round(value))
  return formatControlValue(value, spec.unit || 'ratio')
}
