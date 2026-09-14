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
import { type Score } from './schema'
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
  const liveIds = new Set(
    score.tracks.filter((track) => track.kind === 'live').map((track) => track.id),
  )
  return {
    ...score,
    tracks: score.tracks.filter((track) => !liveIds.has(track.id)),
    elementTracks: [],
    lanes: score.lanes.filter(
      (lane) => !(lane.target.kind === 'strip' && liveIds.has(lane.target.owner)),
    ),
    routes: score.routes.filter(
      (route) => !(route.target.kind === 'strip' && liveIds.has(route.target.owner)),
    ),
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
