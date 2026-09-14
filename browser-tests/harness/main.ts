// The page side of the real-audio golden. Loads the built package from
// /dist (worklets and WASM resolve next to it, exactly as a consumer's
// bundle does), builds the scripted session on a real OfflineAudioContext and
// renders it, then builds the same session on a real AudioContext, plays it
// in real time and captures the master through the recorder worklet. Returns
// what the graph was told (for the mock golden) and fingerprints of both
// captures (for the render-equals-live tolerance).

import { ParamLane, WorkletRecorder, createEngine, renderOffline } from '@kieranklaassen/live-mix'
import { createDattorroReverb } from '@kieranklaassen/live-mix/dsp'
import type { ScheduleSnapshot } from '@kieranklaassen/live-mix/testing'
import { DEFAULT_SESSION, buildSession, type SessionDeps, type SessionSpec } from '../session'
import { fingerprint, type Fingerprint } from './fingerprint'
import { installWebAudioRecorder } from './record-web-audio'

export interface HarnessResult {
  offline: { events: ScheduleSnapshot; fingerprint: Fingerprint; latency: unknown }
  live: {
    /** What the live graph was told, for diffing against the offline render. */
    events: ScheduleSnapshot
    fingerprint: Fingerprint
    /** Context time the transport and the recorder started at. */
    startedAt: number
    sampleRate: number
    baseLatency: number
    outputLatency: number
    workletModules: string[]
  }
  userAgent: string
}

const deps: SessionDeps = {
  createReverb: (ctx) => createDattorroReverb(ctx, { params: { mix: 0.3, decay: 0.6 } }),
  createLane: (options) => new ParamLane(options),
}

async function renderOfflineSession(spec: SessionSpec): Promise<HarnessResult['offline']> {
  const recorder = installWebAudioRecorder()
  try {
    const result = await renderOffline({
      durationSec: spec.durationSec,
      sampleRate: spec.sampleRate,
      build: (engine) => buildSession(engine, spec, deps),
    })
    const events = recorder.snapshot()
    return {
      events,
      fingerprint: fingerprint(result.audio.channels, result.sampleRate),
      latency: result.latency,
    }
  } finally {
    recorder.uninstall()
  }
}

async function captureLiveSession(spec: SessionSpec): Promise<HarnessResult['live']> {
  const ctx = new AudioContext({ sampleRate: spec.sampleRate, latencyHint: 'playback' })
  await ctx.resume()
  const graph = installWebAudioRecorder()
  const engine = createEngine({ context: ctx })
  await buildSession(engine, spec, deps)
  const recorder = await WorkletRecorder.create(ctx, engine.master)
  const startedAt = ctx.currentTime + 0.25
  recorder.start(startedAt)
  engine.transport.start(startedAt)
  await new Promise((resolve) => setTimeout(resolve, (spec.durationSec + 0.6) * 1000))
  const recording = await recorder.stop()
  const events = graph.snapshot()
  graph.uninstall()
  engine.transport.pause()
  const frames = Math.round(spec.durationSec * spec.sampleRate)
  const channels = recording.audio.channels.map((channel) => channel.subarray(0, frames))
  const live = {
    events,
    fingerprint: fingerprint(channels, spec.sampleRate),
    startedAt,
    sampleRate: ctx.sampleRate,
    baseLatency: ctx.baseLatency,
    outputLatency: ctx.outputLatency,
    workletModules: [],
  }
  engine.dispose()
  await ctx.close()
  return live
}

async function run(spec: SessionSpec = DEFAULT_SESSION): Promise<HarnessResult> {
  const offline = await renderOfflineSession(spec)
  const live = await captureLiveSession(spec)
  return { offline, live, userAgent: navigator.userAgent }
}

declare global {
  interface Window {
    liveMixHarness: {
      run: typeof run
      renderOffline: typeof renderOfflineSession
      captureLive: typeof captureLiveSession
      defaultSession: SessionSpec
    }
  }
}

window.liveMixHarness = {
  run,
  renderOffline: renderOfflineSession,
  captureLive: captureLiveSession,
  defaultSession: DEFAULT_SESSION,
}
document.body.dataset.harness = 'ready'
