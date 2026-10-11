// A parameter's modulation as plain data: what moves it and how far, with no
// object behind it. A device that runs on the audio thread is handed this
// (`ModulatedDevice.modulate`) and works the value out there, once per block
// from the block's own time, so the parameter moves on the audio clock: the
// same in an offline render as live, and never late because the page was
// busy. The page works the same value out from the same data to draw it
// (R33: what is drawn is what is heard).
//
// Only sources that are a pure function of time can go: an LFO and seeded
// noise. A macro or a phase driven from outside changes when a hand moves it,
// which the `ModMatrix` follows at control rate.
//
// Keep this file free of imports that run code: the worklet bundles it.

import { type ParamSpec } from '../params'
import {
  Lfo,
  Random,
  breathLaw,
  lfoPhaseAt,
  lfoWaveform,
  randomValueAt,
  type LfoShape,
  type ModSource,
} from './Modulator'

/** `unipolar` adds 0..depth of the range; `bipolar` swings ±depth around the base. */
export type ModPolarity = 'unipolar' | 'bipolar'

/** A source that is a pure function of time, as numbers. */
export type ParamModSource =
  | {
      kind: 'lfo'
      shape: LfoShape
      rateHz: number
      /** 0..1 in the breathing law; 1 is the waveform itself. */
      depth: number
      /** The phase (cycles) the LFO had at `anchorSec`. */
      anchorPhase: number
      anchorSec: number
    }
  | { kind: 'random'; rateHz: number; seed: number; smooth: boolean }

export interface ParamModRoute {
  source: ParamModSource
  /** −1..1 fraction of the parameter's travel; negative inverts. */
  depth: number
  polarity: ModPolarity
}

/** Everything that moves one parameter. Its base is the value the parameter is set to. */
export interface ParamModulation {
  routes: readonly ParamModRoute[]
}

/** What of a `ParamSpec` the value is worked out from; a spec is one. */
export type ParamTravel = Pick<ParamSpec, 'min' | 'max' | 'default' | 'taper' | 'step' | 'choices'>

/** A live source as numbers, or null for one that is not a pure function of time. */
export function paramModSource(source: ModSource): ParamModSource | null {
  if (source instanceof Lfo) {
    const anchor = source.anchor
    return {
      kind: 'lfo',
      shape: source.shape,
      rateHz: source.rateHz,
      depth: source.depth,
      anchorPhase: anchor.phase,
      anchorSec: anchor.atSec,
    }
  }
  if (source instanceof Random) {
    return { kind: 'random', rateHz: source.rateHz, seed: source.seed, smooth: source.smooth }
  }
  return null
}

/** The source's 0..1 value at `timeSec`: `Lfo.valueAtTime` and `Random.valueAtTime` without the objects. */
export function paramModSourceValue(source: ParamModSource, timeSec: number): number {
  if (source.kind === 'lfo') {
    const phase = lfoPhaseAt(source.anchorPhase, source.anchorSec, source.rateHz, timeSec)
    return breathLaw(lfoWaveform(source.shape, phase), source.depth)
  }
  return randomValueAt(source.rateHz, source.seed, source.smooth, timeSec)
}

/** What the routes add at `timeSec`, as a fraction of the parameter's travel (`routeOffset`, summed). */
export function paramModOffset(modulation: ParamModulation, timeSec: number): number {
  let offset = 0
  for (const route of modulation.routes) {
    const value = paramModSourceValue(route.source, timeSec)
    offset += route.depth * (route.polarity === 'bipolar' ? value * 2 - 1 : value)
  }
  return offset
}

/**
 * The farthest the routes can take the parameter below and above its base,
 * as fractions of its travel: where a knob draws the ends of its swing.
 */
export function paramModReach(modulation: ParamModulation): { below: number; above: number } {
  let below = 0
  let above = 0
  for (const route of modulation.routes) {
    // The breathing law never falls under `1 − depth`, so a shallow LFO reaches less far down.
    const floor = route.source.kind === 'lfo' ? 1 - route.source.depth : 0
    const ends =
      route.polarity === 'bipolar'
        ? [route.depth * (floor * 2 - 1), route.depth]
        : [route.depth * floor, route.depth]
    below += Math.max(0, -Math.min(...ends))
    above += Math.max(0, ...ends)
  }
  return { below, above }
}

function position(travel: ParamTravel, value: number): number {
  if (travel.taper === 'log' && travel.min > 0) {
    return Math.log(value / travel.min) / Math.log(travel.max / travel.min)
  }
  return (value - travel.min) / (travel.max - travel.min)
}

function valueAt(travel: ParamTravel, at: number): number {
  if (travel.taper === 'log' && travel.min > 0) {
    return travel.min * Math.pow(travel.max / travel.min, at)
  }
  return travel.min + (travel.max - travel.min) * at
}

/**
 * The parameter's value with `offset` (a fraction of its travel) added to its
 * base along the knob's own travel. A frequency on a log taper swings as many
 * octaves up as down, which is how the knob turns, and a parameter that only
 * takes steps (a list, a count, a switch) lands on one.
 */
export function paramValueAtOffset(travel: ParamTravel, base: number, offset: number): number {
  const span = travel.max - travel.min
  if (!(span > 0)) return travel.min
  const from = Number.isFinite(base)
    ? Math.min(travel.max, Math.max(travel.min, base))
    : travel.default
  // Unmoved, it is the base to the bit: the way there and back along a taper rounds.
  const moved = Number.isFinite(offset) && offset !== 0
  const at = moved ? Math.min(1, Math.max(0, position(travel, from) + offset)) : 0
  const value = moved ? Math.min(travel.max, Math.max(travel.min, valueAt(travel, at))) : from
  const step = travel.choices?.length ? 1 : travel.step
  if (step === undefined || !(step > 0)) return value
  return Math.min(travel.max, travel.min + Math.round((value - travel.min) / step) * step)
}

/** The parameter's value at `timeSec`: its base moved by the routes (`paramValueAtOffset`). */
export function modulatedParamValue(
  travel: ParamTravel,
  base: number,
  modulation: ParamModulation,
  timeSec: number,
): number {
  return paramValueAtOffset(travel, base, paramModOffset(modulation, timeSec))
}
