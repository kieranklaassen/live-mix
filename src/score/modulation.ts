// A score's modulators as sources, and its routes onto one device parameter
// as the numbers a device that moves its own parameters works them out from
// (`ModulatedDevice`). The renderer hands a running device the sources as
// they stand on its clock; a host that builds devices by hand for a render
// of its own (an export) asks here, and gets them as they stand at the top
// of the clock, so every such render is the same.

import { ExternalPhase, Lfo, Macro, Random, type ModSource } from '../core/automation/Modulator'
import { paramModSource, type ParamModulation } from '../core/automation/param-modulation'
import { type Score, type ScoreModulator } from './schema'

export function createModulator(spec: ScoreModulator): ModSource {
  switch (spec.kind) {
    case 'lfo':
      // Anchored at audio-clock zero: the phase is a pure function of context
      // time, so a re-render lands on the same phase as the original.
      return new Lfo({
        rateHz: spec.rateHz,
        shape: spec.shape,
        depth: spec.depth,
        phase: spec.phase,
        startSec: 0,
      })
    case 'random':
      return new Random({ rateHz: spec.rateHz, seed: spec.seed, smooth: spec.smooth })
    case 'macro':
      return new Macro(spec.value)
    case 'external-phase':
      return new ExternalPhase({
        phaseOffset: spec.phaseOffset,
        depth: spec.depth,
        shape: spec.shape,
      })
    default: {
      const exhaustive: never = spec
      return exhaustive
    }
  }
}

/**
 * What moves `param` of the device instance `device` in `score`, for
 * `ModulatedDevice.modulate`: every route onto it, from the top of the clock.
 * Null when nothing does, when a lane is on the parameter, or when one of the
 * sources is not a function of time alone (a macro, a phase from outside):
 * those the renderer runs through the `ModMatrix`, and so must the host.
 */
export function scoreParamModulation(
  score: Score,
  device: string,
  param: string,
): ParamModulation | null {
  const onParam = (target: Score['routes'][number]['target']): boolean =>
    target.kind === 'device' && target.device === device && target.param === param
  if (score.lanes.some((lane) => onParam(lane.target))) return null
  const routes: ParamModulation['routes'][number][] = []
  for (const route of score.routes) {
    if (!onParam(route.target)) continue
    const modulator = score.modulators.find((candidate) => candidate.id === route.source)
    const source = modulator ? paramModSource(createModulator(modulator)) : null
    if (!source) return null
    routes.push({ source, depth: route.depth, polarity: route.polarity })
  }
  return routes.length > 0 ? { routes } : null
}

/** `scoreParamModulation` for every parameter of a device instance that has one, by name. */
export function scoreDeviceModulations(
  score: Score,
  device: string,
): Record<string, ParamModulation> {
  const found: Record<string, ParamModulation> = {}
  for (const route of score.routes) {
    const { target } = route
    if (target.kind !== 'device' || target.device !== device || target.param in found) continue
    const modulation = scoreParamModulation(score, device, target.param)
    if (modulation) found[target.param] = modulation
  }
  return found
}
