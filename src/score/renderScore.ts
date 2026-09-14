// Score-driven bounce: the document is the arrangement, `loadScore` builds it
// on the offline engine, `renderOffline` pre-schedules and renders it. This is
// the AE6 golden's subject: the same score rendered offline must hand the
// graph exactly what the live engine does.
//
// Not rendered: live-input tracks (declared, their audio is the app's) and
// element tracks (HTMLMediaElements play in real time only). Both are dropped
// from the score before loading, so their sends and routing do not exist in
// the render either.

import {
  renderOffline,
  renderStems,
  type RenderBuild,
  type RenderOptions,
  type RenderResult,
  type StemsOptions,
} from '../core/render/OfflineRenderer'
import { loadScore } from './loadScore'
import { type ParamTarget, type Score } from './schema'
import { type ScoreRendererOptions } from './ScoreRenderer'

export type RenderScoreOptions = Omit<RenderOptions, 'build'> & {
  /** Renderer options (device registry, sample resolution). */
  renderer?: ScoreRendererOptions
}

export type RenderScoreStemsOptions = Omit<StemsOptions, 'build'> & {
  renderer?: ScoreRendererOptions
}

/** The score minus what cannot render offline. */
export function renderableScore(score: Score): Score {
  const live = score.tracks.filter((track) => track.kind === 'live')
  const liveIds = new Set(live.map((track) => track.id))
  const liveDeviceIds = new Set(
    live.flatMap((track) => track.strip.inserts.map((device) => device.id)),
  )
  const onLiveTrack = (target: ParamTarget): boolean => {
    switch (target.kind) {
      case 'strip':
        return liveIds.has(target.owner)
      case 'device':
        return liveDeviceIds.has(target.device)
      default: {
        const exhaustive: never = target
        return exhaustive
      }
    }
  }
  return {
    ...score,
    tracks: score.tracks.filter((track) => !liveIds.has(track.id)),
    elementTracks: [],
    lanes: score.lanes.filter((lane) => !onLiveTrack(lane.target)),
    routes: score.routes.filter((route) => !onLiveTrack(route.target)),
  }
}

function scoreBuild(score: Score, rendererOptions: ScoreRendererOptions | undefined): RenderBuild {
  return async (engine) => {
    let failure: unknown
    let failed = false
    const renderer = loadScore(engine, renderableScore(score), {
      ...rendererOptions,
      onError: (error) => {
        failed = true
        failure = error
      },
    })
    await renderer.whenIdle()
    if (failed) throw failure instanceof Error ? failure : new Error(String(failure))
  }
}

/** Bounce a score's master. */
export function renderScore(score: Score, options: RenderScoreOptions): Promise<RenderResult> {
  const { renderer: rendererOptions, ...render } = options
  return renderOffline({ ...render, build: scoreBuild(score, rendererOptions) })
}

/** Bounce a score's master and stems (`stems` are score track ids). */
export function renderScoreStems(
  score: Score,
  options: RenderScoreStemsOptions,
): Promise<Record<string, RenderResult>> {
  const { renderer: rendererOptions, ...render } = options
  return renderStems({ ...render, build: scoreBuild(score, rendererOptions) })
}
