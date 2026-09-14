// Launch quantisation: where on the timeline a launch requested at `sec`
// actually lands. Seconds stay the engine's unit (KD5); the tempo map turns
// bars and beats into seconds, so a launch 300 ms before the bar starts on
// the bar (AE3) and one already on the grid starts at once.

import { type TempoMap } from '../time/TempoMap'

/**
 * The grid a launch snaps to:
 * - `'none'`: immediately;
 * - `'beat'` / `'bar'`: the next beat or bar line on the tempo map;
 * - a number `n`: the next multiple of `n` bars from the origin (2, 4, 8 … bars);
 * - `{ seconds }`: the next multiple of a fixed period in seconds (a clock-driven set without a grid).
 */
export type LaunchQuantize = 'none' | 'bar' | 'beat' | number | { seconds: number }

export const DEFAULT_LAUNCH_QUANTIZE: LaunchQuantize = 'bar'

/** Positions within this many seconds of a grid line count as on it (float noise from the tempo map). */
export const LAUNCH_GRID_EPSILON_SECONDS = 1e-6

export function isLaunchQuantize(value: unknown): value is LaunchQuantize {
  if (value === 'none' || value === 'bar' || value === 'beat') return true
  if (typeof value === 'number') return Number.isFinite(value) && value > 0
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const seconds = (value as { seconds?: unknown }).seconds
    return typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
  }
  return false
}

/**
 * The launch time for a request at `sec`: the next grid line at or after
 * `sec` (a position already on the grid is its own launch time).
 */
export function quantizeLaunch(tempo: TempoMap, sec: number, grid: LaunchQuantize): number {
  if (!Number.isFinite(sec)) throw new Error('live-mix: quantizeLaunch needs a finite position')
  if (grid === 'none') return sec
  if (grid === 'bar' || grid === 'beat') return tempo.quantize(sec, grid)
  if (typeof grid === 'number') {
    if (!(grid > 0)) throw new Error('live-mix: a bar quantisation must be positive')
    const { bar, beat } = tempo.barBeatAt(sec)
    const onBar = beat < 1e-6 ? bar : bar + 1
    return tempo.barToSeconds(Math.ceil(onBar / grid - 1e-9) * grid)
  }
  if (!(grid.seconds > 0)) throw new Error('live-mix: a seconds quantisation must be positive')
  return Math.ceil(sec / grid.seconds - LAUNCH_GRID_EPSILON_SECONDS) * grid.seconds
}

/** Short label for a quantisation setting (menus, history). */
export function describeQuantize(grid: LaunchQuantize): string {
  if (grid === 'none') return 'none'
  if (grid === 'bar') return '1 bar'
  if (grid === 'beat') return '1 beat'
  if (typeof grid === 'number') return `${grid} bars`
  return `${grid.seconds} s`
}

/** Deep-equal for the union (numbers, strings and `{ seconds }`). */
export function sameQuantize(a: LaunchQuantize, b: LaunchQuantize): boolean {
  if (typeof a === 'object') return typeof b === 'object' && a.seconds === b.seconds
  return a === b
}

/** A duration expressed on the grid or on the clock, resolved from a timeline position. */
export type FollowTime = { unit: 'bars'; value: number } | { unit: 'seconds'; value: number }

export function isFollowTime(value: unknown): value is FollowTime {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const { unit, value: amount } = value as { unit?: unknown; value?: unknown }
  return (
    (unit === 'bars' || unit === 'seconds') &&
    typeof amount === 'number' &&
    Number.isFinite(amount) &&
    amount > 0
  )
}

/**
 * Seconds `time` lasts when it starts at `fromSec`: bars are measured on the
 * tempo map from the bar position of `fromSec` (a launch on a bar line plus
 * two bars ends on a bar line two bars later, through tempo changes).
 */
export function followTimeSeconds(tempo: TempoMap, fromSec: number, time: FollowTime): number {
  switch (time.unit) {
    case 'seconds':
      return time.value
    case 'bars': {
      const { bar, beat } = tempo.barBeatAt(fromSec)
      const beatsPerBar = tempo.beatsPerBarAt(fromSec)
      const startBar = bar + beat / beatsPerBar
      return tempo.barToSeconds(startBar + time.value) - fromSec
    }
    default: {
      const exhaustive: never = time
      return exhaustive
    }
  }
}
