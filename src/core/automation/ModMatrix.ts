// The modulation matrix: routes from `ModSource`s to parameter targets with
// depth and polarity (R14). A target is any AudioParam (written as short
// ramps) or any device parameter (set through the `Device` contract; the
// device smooths, per the ABI). The unmodulated base of a target is a number
// or a `ParamLane` read at the playhead, so a lane can drive a device
// parameter at control rate through the same path.

import { type Device } from '../devices/Device'
import { Emitter } from '../events'
import { type ModSource } from './Modulator'
import { type ParamLane } from './ParamLane'
import { DEFAULT_RAMP_SECONDS, ParamRamper, type ScheduledParam } from './scheduled-param'

/** `unipolar` adds 0..depth of the range; `bipolar` swings ±depth around the base. */
export type ModPolarity = 'unipolar' | 'bipolar'

export interface ModTarget {
  readonly min: number
  readonly max: number
  /** The value with no modulation: a number, or a lane read at the timeline playhead. */
  base: number | ParamLane
  /** Write the modulated value, moving from the previous one over `rampSec`. */
  apply(value: number, contextTimeSec: number, rampSec: number): void
}

export interface AudioParamTargetOptions {
  /** Range the modulation spans; AudioParam limits are not meaningful ranges. */
  min: number
  max: number
  base: number | ParamLane
}

/** An AudioParam as a target; every write is a ramp from where the param is. */
export function audioParamTarget(
  param: ScheduledParam,
  options: AudioParamTargetOptions,
): ModTarget {
  if (!Number.isFinite(options.min) || !Number.isFinite(options.max)) {
    throw new Error('live-mix: audioParamTarget needs a finite min and max')
  }
  const ramper = new ParamRamper(param)
  return {
    min: Math.min(options.min, options.max),
    max: Math.max(options.min, options.max),
    base: options.base,
    apply(value, contextTimeSec, rampSec) {
      ramper.rampTo(value, contextTimeSec, rampSec)
    },
  }
}

export interface DeviceParamTargetOptions {
  /** Defaults to the device's current value for the param. */
  base?: number | ParamLane
}

/** A device parameter as a target; range from its `ParamSpec`, set by name. */
export function deviceParamTarget(
  device: Device,
  name: string,
  options: DeviceParamTargetOptions = {},
): ModTarget {
  const spec = device.params[name]
  if (!spec) throw new Error(`live-mix: ${device.id} has no parameter "${name}"`)
  let last: number | undefined
  return {
    min: spec.min,
    max: spec.max,
    base: options.base ?? device.getParam(name),
    apply(value) {
      if (value === last) return
      last = value
      device.setParam(name, value)
    },
  }
}

export interface ModRouteOptions {
  /** −1..1 fraction of the target range; negative inverts. */
  depth?: number
  polarity?: ModPolarity
}

export interface ModRoute {
  readonly source: ModSource
  readonly target: ModTarget
  depth: number
  polarity: ModPolarity
}

export interface ModMatrixOptions {
  /** Ramp per control-rate write to an AudioParam target. */
  rampSec?: number
}

export interface ModUpdate {
  /** Timeline position lanes are read at. */
  playheadSec: number
  /** Audio-clock time sources are read at and writes are scheduled for. */
  contextTimeSec: number
}

/** The modulation a route contributes, as a fraction of the target's range. */
export function routeOffset(route: ModRoute, timeSec: number): number {
  const value = route.source.valueAtTime(timeSec)
  const signal = route.polarity === 'bipolar' ? value * 2 - 1 : value
  return route.depth * signal
}

export type ModMatrixListener = (matrix: ModMatrix) => void

export class ModMatrix {
  readonly rampSec: number
  private readonly routeList: ModRoute[] = []
  private readonly targetSet = new Set<ModTarget>()
  private readonly listeners = new Emitter<ModMatrix>()

  constructor(options: ModMatrixOptions = {}) {
    this.rampSec = options.rampSec ?? DEFAULT_RAMP_SECONDS
  }

  get routes(): readonly ModRoute[] {
    return this.routeList
  }

  /** Every target the matrix drives, mapped or attached. */
  get targets(): ReadonlySet<ModTarget> {
    return this.targetSet
  }

  /** Route `source` onto `target`; a bare number is the depth. */
  map(source: ModSource, target: ModTarget, options: ModRouteOptions | number = {}): ModRoute {
    const resolved = typeof options === 'number' ? { depth: options } : options
    const route: ModRoute = {
      source,
      target,
      depth: clampDepth(resolved.depth ?? 1),
      polarity: resolved.polarity ?? 'unipolar',
    }
    this.routeList.push(route)
    this.targetSet.add(target)
    this.changed()
    return route
  }

  /** Remove a route; the target stays attached until `detach`. */
  unmap(route: ModRoute): void {
    const index = this.routeList.indexOf(route)
    if (index < 0) return
    this.routeList.splice(index, 1)
    this.changed()
  }

  /** Change a route's depth and/or polarity in place (U24: the matrix announces it). */
  setRoute(route: ModRoute, options: ModRouteOptions): ModRoute {
    if (!this.routeList.includes(route)) throw new Error('live-mix: route is not in this matrix')
    if (options.depth !== undefined) route.depth = clampDepth(options.depth)
    if (options.polarity !== undefined) route.polarity = options.polarity
    this.changed()
    return route
  }

  /** Drive a target with no routes — a lane base on a device parameter. */
  attach(target: ModTarget): void {
    if (this.targetSet.has(target)) return
    this.targetSet.add(target)
    this.changed()
  }

  /** Stop driving a target and drop its routes. */
  detach(target: ModTarget): void {
    if (!this.targetSet.delete(target)) return
    for (let index = this.routeList.length - 1; index >= 0; index -= 1) {
      if (this.routeList[index].target === target) this.routeList.splice(index, 1)
    }
    this.changed()
  }

  /** Called after every `map`, `unmap`, `setRoute`, `attach` and `detach`. Returns the unsubscribe function. */
  onChange(listener: ModMatrixListener): () => void {
    return this.listeners.subscribe(listener)
  }

  private changed(): void {
    this.listeners.emit(this)
  }

  /** The value a target takes: base plus every route's offset, clamped to its range. */
  modulatedValue(target: ModTarget, playheadSec: number, contextTimeSec: number): number {
    const base = typeof target.base === 'number' ? target.base : target.base.valueAt(playheadSec)
    const span = target.max - target.min
    let offset = 0
    for (const route of this.routeList) {
      if (route.target === target) offset += routeOffset(route, contextTimeSec)
    }
    return Math.min(target.max, Math.max(target.min, base + offset * span))
  }

  /** Offline: lanes and sources share one clock starting at 0. */
  valueAt(target: ModTarget, timeSec: number): number {
    return this.modulatedValue(target, timeSec, timeSec)
  }

  /** Sample `valueAt` on a fixed grid — the offline curve tests assert on. */
  render(
    target: ModTarget,
    fromSec: number,
    durationSec: number,
    sampleRate: number,
  ): Float32Array {
    const length = Math.max(0, Math.round(durationSec * sampleRate))
    const out = new Float32Array(length)
    for (let i = 0; i < length; i += 1) out[i] = this.valueAt(target, fromSec + i / sampleRate)
    return out
  }

  /** Control-rate tick: write every target's current value. */
  update({ playheadSec, contextTimeSec }: ModUpdate): void {
    for (const target of this.targetSet) {
      target.apply(
        this.modulatedValue(target, playheadSec, contextTimeSec),
        contextTimeSec,
        this.rampSec,
      )
    }
  }
}

function clampDepth(depth: number): number {
  if (!Number.isFinite(depth)) return 0
  return Math.min(1, Math.max(-1, depth))
}
