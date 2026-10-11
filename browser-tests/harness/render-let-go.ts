// The page side of the check that a render gives its memory back. Chromium
// keeps an OfflineAudioContext that a worklet module was loaded on, and the
// buffer it rendered into, for as long as its document lives. So the scripted
// session, with a reverb, a limiter and the worklet ducker in it, is rendered
// on a context made in a frame of its own (`createFramedOfflineContext`), and
// the frame is taken away. The page keeps only weak references: what is still
// there after a collection was kept by the browser, not by this page.

import {
  ParamLane,
  createFramedOfflineContext,
  maxAbsDifference,
  releaseOfflineContext,
  renderOffline,
  type OfflineContextFactory,
  type PlanarAudio,
} from '@kieranklaassen/live-mix'
import {
  createFetLimiter,
  createPlateReverb,
  createWorkletDucker,
} from '@kieranklaassen/live-mix/dsp'
import { DEFAULT_SESSION, buildSession } from '../session'

/** Where a render's context is made: by the page, or in a frame of its own. */
export type RenderHome = 'page' | 'frame'

const HOMES: Record<RenderHome, OfflineContextFactory> = {
  page: (options) =>
    new OfflineAudioContext(options.numberOfChannels, options.length, options.sampleRate),
  frame: createFramedOfflineContext,
}

const kept: Record<RenderHome, WeakRef<object>[]> = { page: [], frame: [] }
/** Worklet nodes of the framed renders, and how many of them their frame's own constructor made. */
const framedNodes = { made: 0, byFrame: 0 }
const sounds: Partial<Record<RenderHome, PlanarAudio>> = {}

/** Render the session once on a context of `home` and let go of everything but the sound. */
async function renderAt(home: RenderHome): Promise<void> {
  const result = await renderOffline({
    durationSec: DEFAULT_SESSION.durationSec,
    sampleRate: DEFAULT_SESSION.sampleRate,
    createContext: HOMES[home],
    build: async (engine) => {
      await buildSession(engine, DEFAULT_SESSION, {
        createReverb: (ctx) => createPlateReverb(ctx, { params: { mix: 0.3, decay: 0.6 } }),
        createLane: (options) => new ParamLane(options),
      })
      const [music, voice] = engine.tracks
      const limiter = await createFetLimiter(engine.context)
      music.strip.addInsert(limiter)
      const ducker = await createWorkletDucker(engine.context)
      music.strip.addInsert(ducker)
      ducker.key(voice.strip.output)
      if (home === 'frame') {
        // The frame is the only one in the page while its render is built.
        const frame = document.querySelector('iframe')?.contentWindow as typeof globalThis | null
        for (const node of [limiter.node, ducker.node]) {
          framedNodes.made += 1
          if (frame && node instanceof frame.AudioWorkletNode) framedNodes.byFrame += 1
        }
      }
    },
  })
  const context = result.engine.context
  kept[home].push(new WeakRef(context), new WeakRef(result.buffer))
  sounds[home] = result.audio
  result.engine.dispose()
  releaseOfflineContext(context)
}

/** Render the session `times` on contexts of `home`, letting go of each. */
export async function renderAndLetGo(home: RenderHome, times: number): Promise<void> {
  for (let i = 0; i < times; i += 1) await renderAt(home)
}

/** How many contexts and rendered buffers of `home` are still there. Ask after a collection. */
export function rendersKept(home: RenderHome): number {
  return kept[home].filter((ref) => ref.deref() !== undefined).length
}

/** The largest difference between the last render in a frame and the last by the page. */
export function framedRenderDifference(): number {
  if (!sounds.page || !sounds.frame) throw new Error('render at both homes first')
  return maxAbsDifference(sounds.page, sounds.frame)
}

/** Of the limiters and duckers of the framed renders: how many there were, and how many their frame's constructor made. */
export function framedNodesMade(): { made: number; byFrame: number } {
  return { ...framedNodes }
}
