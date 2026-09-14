// Offline rendering (R22): the same engine graph on an `OfflineAudioContext`,
// with the whole session scheduled ahead of time from a virtual clock, so a
// render is a pure function of the arrangement — identical every time and
// identical to what the live engine tells its graph for the same arrangement.
//
// How determinism works: the engine's clock is injected. During a render the
// clock is a virtual `now` that the renderer steps forward in `tickSec`
// increments, calling the scheduler and automation ticks at each step until
// the whole duration (plus lookahead) has been handed to the graph. Only then
// does `startRendering()` run — with every source start, envelope and lane
// write already on the audio timeline. Nothing depends on timers or on how
// fast the offline context renders.
//
// Not renderable offline: anything that reads the graph at runtime from the
// main thread (the Phase 0 poll `Ducker`, `Meter`/`LufsMeter` readings). Use
// the worklet ducker (`mode: 'worklet'`) for bounces with sidechain ducking.

import { type Clock } from '../clock'
import { createEngine, type Engine, type EngineOptions } from '../Engine'
import { type AudioTrack } from '../tracks/AudioTrack'
import { planarFromAudioBuffer, type PlanarAudio } from './encode'

export interface OfflineContextLike extends BaseAudioContext {
  startRendering(): Promise<AudioBuffer>
}

export type OfflineContextFactory = (options: {
  numberOfChannels: number
  length: number
  sampleRate: number
}) => OfflineContextLike

/** What the host does with the engine before rendering: tracks, clips, devices, samples. */
export type RenderBuild = (engine: Engine, info: RenderBuildInfo) => void | Promise<void>

export interface RenderBuildInfo {
  /** Which stem this build is for (`renderStems`), or `'master'`. */
  stem: string
  sampleRate: number
  durationSec: number
}

export interface RenderOptions {
  /** Length of the render in seconds (from position 0). */
  durationSec: number
  /** Default 48000. */
  sampleRate?: number
  /** Default 2. */
  numberOfChannels?: number
  /** Timeline position to start from. Default 0. */
  startSec?: number
  /** Virtual clock step for pre-scheduling. Default 0.05 s. */
  tickSec?: number
  /** Engine options other than the context and clock (loop, master, samples…). */
  engine?: Omit<EngineOptions, 'context' | 'now' | 'setIntervalFn' | 'clearIntervalFn'>
  /** `OfflineAudioContext` constructor by default; injectable for tests and non-DOM hosts. */
  createContext?: OfflineContextFactory
  build: RenderBuild
}

export interface RenderResult {
  buffer: AudioBuffer
  audio: PlanarAudio
  sampleRate: number
  durationSec: number
  /** The engine the render was built on, left intact for inspection; dispose it when done. */
  engine: Engine
}

const defaultCreateContext: OfflineContextFactory = ({ numberOfChannels, length, sampleRate }) => {
  const Ctor = (globalThis as { OfflineAudioContext?: new (...args: unknown[]) => unknown })
    .OfflineAudioContext
  if (!Ctor) throw new Error('live-mix: OfflineAudioContext is not available here')
  return new Ctor(numberOfChannels, length, sampleRate) as OfflineContextLike
}

/** Timers that never fire: the renderer drives every tick itself. */
function inertTimers(): Pick<Clock, 'setIntervalFn' | 'clearIntervalFn'> {
  return {
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
  }
}

/**
 * Pre-schedule everything the engine would do live, then render. The
 * transport starts at virtual time 0 (= context time 0) from `startSec`.
 */
export async function renderOffline(options: RenderOptions): Promise<RenderResult> {
  const sampleRate = options.sampleRate ?? 48000
  const numberOfChannels = options.numberOfChannels ?? 2
  const durationSec = options.durationSec
  if (!(durationSec > 0)) throw new Error('live-mix: renderOffline needs a positive durationSec')
  const tickSec = options.tickSec ?? 0.05
  const length = Math.ceil(durationSec * sampleRate)
  const context = (options.createContext ?? defaultCreateContext)({
    numberOfChannels,
    length,
    sampleRate,
  })

  let virtualNow = 0
  const engine = createEngine({
    ...options.engine,
    context,
    now: () => virtualNow,
    ...inertTimers(),
  })
  await options.build(engine, { stem: 'master', sampleRate, durationSec })

  scheduleAhead(engine, {
    startSec: options.startSec ?? 0,
    durationSec,
    tickSec,
    setNow: (sec) => {
      virtualNow = sec
    },
  })

  const buffer = await context.startRendering()
  return { buffer, audio: planarFromAudioBuffer(buffer), sampleRate, durationSec, engine }
}

export interface ScheduleAheadOptions {
  startSec: number
  durationSec: number
  tickSec: number
  setNow: (sec: number) => void
}

/**
 * Drive the engine's scheduler and automation loop from a virtual clock until
 * every start inside `[startSec, startSec + durationSec]` has been handed to
 * the graph. Exposed for hosts that render on their own context.
 */
export function scheduleAhead(engine: Engine, options: ScheduleAheadOptions): void {
  const { startSec, durationSec, tickSec, setNow } = options
  setNow(0)
  engine.transport.seek(startSec)
  engine.transport.start(0)
  // Walk past the end by the largest lookahead so the last starts are in.
  const lookahead = Math.max(
    engine.automation.lookaheadSec,
    ...engine.tracks.map((track: AudioTrack) => Math.max(track.lookaheadSec, track.preloadSec)),
    0,
  )
  const end = durationSec + lookahead + tickSec
  for (let t = 0; t <= end; t += tickSec) {
    setNow(t)
    engine.scheduler.tick()
    engine.automation.tick()
    if (engine.transport.state !== 'playing') break
  }
  setNow(0)
}

export interface StemsOptions extends Omit<RenderOptions, 'build'> {
  /** Track names to bounce, one render each (each soloed in place). */
  stems: readonly string[]
  /** Also render the full mix under `'master'`. Default true. */
  includeMaster?: boolean
  build: RenderBuild
}

/**
 * One render per stem: the build runs each time, then the stem's track is
 * soloed in place (returns stay audible, other tracks are muted) before
 * pre-scheduling. Renders are sequential to bound memory.
 */
export async function renderStems(options: StemsOptions): Promise<Record<string, RenderResult>> {
  const results: Record<string, RenderResult> = {}
  const names = [...(options.includeMaster ?? true ? ['master'] : []), ...options.stems]
  for (const stem of names) {
    results[stem] = await renderOffline({
      ...options,
      build: async (engine, info) => {
        await options.build(engine, { ...info, stem })
        if (stem !== 'master') {
          engine.track(stem).strip.setSolo(true, { at: 0 })
        }
      },
    })
  }
  return results
}

/** Largest absolute sample difference between two renders (same length required). */
export function maxAbsDifference(a: PlanarAudio, b: PlanarAudio): number {
  if (a.channels.length !== b.channels.length) return Number.POSITIVE_INFINITY
  let max = 0
  for (let c = 0; c < a.channels.length; c += 1) {
    const left = a.channels[c]
    const right = b.channels[c]
    if (left.length !== right.length) return Number.POSITIVE_INFINITY
    for (let i = 0; i < left.length; i += 1) {
      const diff = Math.abs(left[i] - right[i])
      if (diff > max) max = diff
    }
  }
  return max
}
