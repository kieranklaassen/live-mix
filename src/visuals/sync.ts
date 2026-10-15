// How far the picture is behind the sound, measured as they run.
//
// Levels are put down as they happen, each trace on the same clock: what is heard, what the picture was told of
// the music, how lit the picture is. Two traces that follow the same music rise at the same moments, a little
// apart; how far apart is found by laying the rises of one over the rises of the other and sliding until they fit
// best. Only the rises count: a picture is meant to let a sound go slower than it lets it in (`follow.ts`).
//
// Pure: no React, no DOM, no audio. What reads the sound for it is `hearTrace` (`ear.ts`), and what reads the
// picture is `lightOf` (`picture.ts`).

export interface SyncScopeOptions {
  /** How much of the past is looked at, in seconds. */
  spanSec?: number
  /** How fine the traces are laid over each other, in seconds. */
  stepSec?: number
  /** The furthest apart two traces are looked for, in seconds, either way. */
  reachSec?: number
}

export interface SyncReading {
  /** How long after the other the trace moves, in seconds; under nothing where it moves first. */
  behindSec: number
  /** How well the two fit at that distance, 0 to 1. Under `SYNC_SURE` the distance says little. */
  alike: number
}

/** Two traces that fit less well than this did not clearly move together. */
export const SYNC_SURE = 0.5

/** A rise is read over this long, in seconds, after the trace is evened over as long. */
const RISE_OVER_SEC = 0.05
/**
 * A trace is read between the least and the most it stood at in the span, so that a picture that only brightens a
 * little is held against the sound as well as one that goes from black to white. One that stayed within this much
 * did not move, and neither did one that never rose a tenth of its own range in one go: there is nothing to lay
 * over anything.
 */
const LEAST_RANGE = 0.002
const LEAST_RISE = 0.1

interface Trace {
  at: number[]
  level: number[]
}

export class SyncScope {
  readonly spanSec: number
  readonly stepSec: number
  readonly reachSec: number
  private readonly traces = new Map<string, Trace>()

  constructor(options: SyncScopeOptions = {}) {
    this.spanSec = options.spanSec ?? 8
    this.stepSec = options.stepSec ?? 0.01
    this.reachSec = options.reachSec ?? 1.5
  }

  /** Puts down what a trace stood at, at a time in seconds on the clock every trace shares. Out of turn, it is left out. */
  put(trace: string, atSec: number, level: number): void {
    if (!Number.isFinite(atSec) || !Number.isFinite(level)) return
    let kept = this.traces.get(trace)
    if (!kept) {
      kept = { at: [], level: [] }
      this.traces.set(trace, kept)
    }
    const last = kept.at.length - 1
    if (last >= 0 && atSec <= kept.at[last]) return
    kept.at.push(atSec)
    kept.level.push(level)
    // What is older than anything looked at goes, a good stretch at a time.
    const oldest = atSec - 2 * (this.spanSec + this.reachSec)
    if (kept.at[0] < oldest) {
      let drop = 0
      while (kept.at[drop] < atSec - (this.spanSec + this.reachSec)) drop++
      // One stays from before, so the trace still says what it stood at where the span starts.
      drop = Math.max(0, drop - 1)
      kept.at.splice(0, drop)
      kept.level.splice(0, drop)
    }
  }

  /** Whether anything was put down for the trace. */
  has(trace: string): boolean {
    return (this.traces.get(trace)?.at.length ?? 0) > 0
  }

  /** How often the trace was put down a second, over the span that ends at `nowSec`. */
  rate(trace: string, nowSec: number): number {
    const kept = this.traces.get(trace)
    if (!kept) return 0
    let count = 0
    let first = Infinity
    for (
      let index = kept.at.length - 1;
      index >= 0 && kept.at[index] > nowSec - this.spanSec;
      index--
    ) {
      if (kept.at[index] > nowSec) continue
      count++
      first = kept.at[index]
    }
    return count > 1 ? (count - 1) / Math.max(1e-6, nowSec - first) : 0
  }

  /** The longest the trace went without being put down, in seconds, over the span that ends at `nowSec`; 0 for one put down less than twice in it. */
  longest(trace: string, nowSec: number): number {
    const kept = this.traces.get(trace)
    if (!kept) return 0
    let longest = 0
    let later = NaN
    for (
      let index = kept.at.length - 1;
      index >= 0 && kept.at[index] > nowSec - this.spanSec;
      index--
    ) {
      if (kept.at[index] > nowSec) continue
      if (later - kept.at[index] > longest) longest = later - kept.at[index]
      later = kept.at[index]
    }
    return longest
  }

  /**
   * `count` levels of the trace, evenly from `fromSec` to `toSec`, oldest first: each is what the trace stood at
   * then, which is what it was last put down as. Nothing before it was first put down.
   */
  line(trace: string, fromSec: number, toSec: number, count: number): Float32Array {
    return this.laid(trace, fromSec, toSec, count, false)
  }

  /** As `line`; with `held`, the time before the trace was first put down stands at what it first was, so that its first reading is no rise. */
  private laid(
    trace: string,
    fromSec: number,
    toSec: number,
    count: number,
    held: boolean,
  ): Float32Array {
    const out = new Float32Array(Math.max(0, count))
    const kept = this.traces.get(trace)
    if (!kept || kept.at.length === 0 || count < 1) return out
    const step = count > 1 ? (toSec - fromSec) / (count - 1) : 0
    const before = held ? kept.level[0] : 0
    let index = 0
    for (let slot = 0; slot < count; slot++) {
      const at = fromSec + slot * step
      while (index + 1 < kept.at.length && kept.at[index + 1] <= at) index++
      out[slot] = kept.at[index] <= at ? kept.level[index] : before
    }
    return out
  }

  /**
   * How far `trace` is behind `against` over the span that ends at `nowSec`. Null where either did not rise
   * enough in it to tell.
   */
  behind(trace: string, against: string, nowSec: number): SyncReading | null {
    if (!this.has(trace) || !this.has(against)) return null
    const reach = Math.round(this.reachSec / this.stepSec)
    const count = Math.round(this.spanSec / this.stepSec)
    // Both with `reach` more at either end, so that a slid trace is never laid over nothing.
    const from = nowSec - this.spanSec - this.reachSec
    const whole = count + 2 * reach
    const to = from + (whole - 1) * this.stepSec
    const ours = this.rises(this.laid(trace, from, to, whole, true))
    const theirs = this.rises(this.laid(against, from, to, whole, true))
    if (!ours || !theirs) return null
    let theirSum = 0
    for (let index = reach; index < reach + count; index++)
      theirSum += theirs[index] * theirs[index]
    if (theirSum <= 0) return null
    let best = -1
    let bestLag = 0
    const fits = new Float64Array(2 * reach + 1)
    for (let lag = -reach; lag <= reach; lag++) {
      let dot = 0
      let ourSum = 0
      for (let index = reach; index < reach + count; index++) {
        const value = ours[index + lag]
        dot += theirs[index] * value
        ourSum += value * value
      }
      const fit = ourSum > 0 ? dot / Math.sqrt(theirSum * ourSum) : 0
      fits[lag + reach] = fit
      // Of two that fit as well, the one nearer to no distance at all.
      if (
        fit > best + 1e-9 ||
        (Math.abs(fit - best) <= 1e-9 && Math.abs(lag) < Math.abs(bestLag))
      ) {
        best = fit
        bestLag = lag
      }
    }
    if (best <= 0) return null
    // Between the steps: the top of the curve through the best fit and the two beside it.
    let fine = 0
    if (bestLag > -reach && bestLag < reach) {
      const before = fits[bestLag + reach - 1]
      const after = fits[bestLag + reach + 1]
      const bend = before - 2 * best + after
      if (bend < 0) fine = Math.max(-0.5, Math.min(0.5, (0.5 * (before - after)) / bend))
    }
    return { behindSec: (bestLag + fine) * this.stepSec, alike: Math.min(1, best) }
  }

  /** Everything put down is forgotten. */
  clear(): void {
    this.traces.clear()
  }

  /** How much a line rises at each step, after it is evened out; null for one that hardly rises at all. */
  private rises(line: Float32Array): Float32Array | null {
    const over = Math.max(1, Math.round(RISE_OVER_SEC / this.stepSec))
    let least = Infinity
    let top = -Infinity
    for (const level of line) {
      if (level < least) least = level
      if (level > top) top = level
    }
    const range = top - least
    if (!(range >= LEAST_RANGE)) return null
    const even = new Float32Array(line.length)
    let sum = 0
    for (let index = 0; index < line.length; index++) {
      sum += (line[index] - least) / range
      if (index >= over) sum -= (line[index - over] - least) / range
      even[index] = sum / Math.min(index + 1, over)
    }
    const rise = new Float32Array(line.length)
    let most = 0
    for (let index = over; index < line.length; index++) {
      const up = even[index] - even[index - over]
      if (up > 0) {
        rise[index] = up
        if (up > most) most = up
      }
    }
    return most >= LEAST_RISE ? rise : null
  }
}
