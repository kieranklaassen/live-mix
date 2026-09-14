// Automation lanes and the modulation matrix for editors: breakpoints over
// `ParamLane.onChange`, routes and targets over `ModMatrix.onChange`.
// `valueAt` is the lane's own formula, so the curve a view draws is the one
// the audio follows (R33).

import { useCallback, useMemo } from 'react'

import {
  type ModMatrix,
  type ModRoute,
  type ModRouteOptions,
  type ModTarget,
} from '../../core/automation/ModMatrix'
import { type ModSource } from '../../core/automation/Modulator'
import { type Breakpoint, type ParamLane } from '../../core/automation/ParamLane'
import { useExternalSnapshot } from '../store'
import { useEnginePart } from './useEngine'

export interface LaneControls {
  /** Insert a breakpoint; one already at the same time is replaced. */
  add(breakpoint: Breakpoint): void
  remove(timeSec: number): void
  /** Replace every breakpoint at once (a paint stroke, an undo). */
  replace(breakpoints: readonly Breakpoint[]): void
  clear(): void
  /** The lane's value at a timeline position — the same formula the writer follows. */
  valueAt(timeSec: number): number
}

export type UseLaneResult = LaneControls & {
  lane: ParamLane
  breakpoints: readonly Readonly<Breakpoint>[]
  /** Bumps on every edit. */
  version: number
  min: number
  max: number
  defaultValue: number
}

interface LaneSnapshot {
  version: number
  breakpoints: readonly Readonly<Breakpoint>[]
}

/** Breakpoints and editing operations of one automation lane. */
export function useLane(lane: ParamLane): UseLaneResult {
  const subscribe = useCallback((onChange: () => void) => lane.onChange(() => onChange()), [lane])
  const read = useCallback(
    (): LaneSnapshot => ({ version: lane.version, breakpoints: [...lane.breakpoints] }),
    [lane],
  )
  const snapshot = useExternalSnapshot(subscribe, read)
  const controls = useMemo<LaneControls>(
    () => ({
      add: (breakpoint) => {
        lane.add(breakpoint)
      },
      remove: (timeSec) => {
        lane.remove(timeSec)
      },
      replace: (breakpoints) => {
        lane.replace(breakpoints)
      },
      clear: () => {
        lane.clear()
      },
      valueAt: (timeSec) => lane.valueAt(timeSec),
    }),
    [lane],
  )
  return {
    lane,
    breakpoints: snapshot.breakpoints,
    version: snapshot.version,
    min: lane.min,
    max: lane.max,
    defaultValue: lane.defaultValue,
    ...controls,
  }
}

export interface ModulationControls {
  /** Route `source` onto `target`; a bare number is the depth. */
  map(source: ModSource, target: ModTarget, options?: ModRouteOptions | number): ModRoute
  unmap(route: ModRoute): void
  /** Change a route's depth and/or polarity. */
  setRoute(route: ModRoute, options: ModRouteOptions): void
  /** Drive a target with no routes (a lane base on a device parameter). */
  attach(target: ModTarget): void
  detach(target: ModTarget): void
  /** Routes onto one target. */
  routesFor(target: ModTarget): readonly ModRoute[]
}

export type UseModulationResult = ModulationControls & {
  matrix: ModMatrix
  routes: readonly ModRoute[]
  targets: readonly ModTarget[]
}

interface ModulationSnapshot {
  routes: readonly ModRoute[]
  targets: readonly ModTarget[]
  /** Depth/polarity are edited in place, so the snapshot folds them in to detect a change. */
  signature: string
}

function signatureOf(routes: readonly ModRoute[]): string {
  let out = ''
  for (const route of routes) out += `${route.depth}${route.polarity[0]};`
  return out
}

/**
 * Routes and targets of a modulation matrix (default: the provided engine's
 * `modulation`), with mapping operations.
 */
export function useModulation(matrix?: ModMatrix): UseModulationResult {
  const target = useEnginePart(matrix, (engine) => engine.modulation, 'useModulation')
  const subscribe = useCallback(
    (onChange: () => void) => target.onChange(() => onChange()),
    [target],
  )
  const read = useCallback((): ModulationSnapshot => {
    const routes = [...target.routes]
    return { routes, targets: [...target.targets], signature: signatureOf(routes) }
  }, [target])
  const snapshot = useExternalSnapshot(subscribe, read)
  const controls = useMemo<ModulationControls>(
    () => ({
      map: (source, modTarget, options) => target.map(source, modTarget, options),
      unmap: (route) => target.unmap(route),
      setRoute: (route, options) => {
        target.setRoute(route, options)
      },
      attach: (modTarget) => target.attach(modTarget),
      detach: (modTarget) => target.detach(modTarget),
      routesFor: (modTarget) => target.routes.filter((route) => route.target === modTarget),
    }),
    [target],
  )
  return { matrix: target, routes: snapshot.routes, targets: snapshot.targets, ...controls }
}
