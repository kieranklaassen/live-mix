// The page side of the check that a sounding clip turned down is heard to
// come down at once, room and all. The clip's trim sits ahead of its send, so
// what it has already sent rings on at the old level unless the track turns
// its room with it (`SpaceRoom.tilt`): a pair of gains either side of a real
// convolver, moved in step, which only real audio can show to cancel. Each
// case renders warm noise through an audio track on a real
// OfflineAudioContext, edits the clip partway through, and is measured here.

import { renderOffline, type Clip } from '@kieranklaassen/live-mix'

const RATE = 48000
const CLIP_SEC = 9
const RENDER_SEC = 9
/** When the clip is edited, on the render's clock. */
export const LEVEL_CHANGE_SEC = 3

export interface LevelFollowCase {
  /** The clip's level from the start. */
  fromDb: number
  /** Its level from `LEVEL_CHANGE_SEC` on; absent: it is left alone. */
  toDb?: number
  spaceDb: number
  /** A second clip on the same track, of another noise, that is never touched. */
  besideDb?: number
}

export interface LevelFollowMeasure {
  /** Energy of the second before the edit, in dB. */
  beforeDb: number
  /** Energy from 0.1 s to 0.6 s after the edit. */
  soonDb: number
  /** Energy from 4 s to 5 s after it, once the old room would have died away anyhow. */
  laterDb: number
  /** The largest step between two samples in the second before the edit, and in the 0.2 s around it. */
  stepBefore: number
  stepAround: number
}

/** Noise kept to the low mids, where the room's level is set; the same for one seed every time. */
function warmNoise(ctx: BaseAudioContext, seed: number): AudioBuffer {
  const buffer = ctx.createBuffer(2, CLIP_SEC * RATE, RATE)
  const high = Math.exp((-2 * Math.PI * 300) / RATE)
  const low = 1 - Math.exp((-2 * Math.PI * 1200) / RATE)
  let state = seed
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel)
    let highIn = 0
    let highOut = 0
    let lowOut = 0
    let lowerOut = 0
    for (let i = 0; i < data.length; i += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      const white = (state / 4294967296) * 0.5 - 0.25
      highOut = high * (highOut + white - highIn)
      highIn = white
      lowOut += low * (highOut - lowOut)
      lowerOut += low * (lowOut - lowerOut)
      data[i] = lowerOut * 4
    }
  }
  return buffer
}

function clip(id: string, sourceId: string, place: Partial<Clip>): Clip {
  return {
    id,
    sourceId,
    startSec: 0,
    offsetSec: 0,
    durationSec: CLIP_SEC,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
    pan: 0,
    ...place,
  }
}

async function measure(spec: LevelFollowCase): Promise<LevelFollowMeasure> {
  const result = await renderOffline({
    durationSec: RENDER_SEC,
    sampleRate: RATE,
    build: async (engine) => {
      const context = engine.context as OfflineAudioContext
      await engine.samples.load('noise', warmNoise(context, 0x1234_5678))
      const track = engine.addAudioTrack('placed')
      track.clips.add(clip('clip', 'noise', { gainDb: spec.fromDb, spaceDb: spec.spaceDb }))
      if (spec.besideDb !== undefined) {
        await engine.samples.load('other', warmNoise(context, 0x0bad_cafe))
        track.clips.add(clip('beside', 'other', { gainDb: spec.besideDb, spaceDb: spec.spaceDb }))
      }
      const toDb = spec.toDb
      if (toDb === undefined) return
      // The render stops here, as a page's edit lands between two blocks.
      void context.suspend(LEVEL_CHANGE_SEC).then(() => {
        track.clips.update('clip', { gainDb: toDb })
        void context.resume()
      })
    },
  })
  const [left, right] = result.audio.channels
  const energyDb = (fromSec: number, toSec: number): number => {
    let sum = 0
    for (let i = Math.round(fromSec * RATE); i < Math.round(toSec * RATE); i += 1) {
      sum += left[i] * left[i] + right[i] * right[i]
    }
    return 10 * Math.log10(Math.max(sum / (toSec - fromSec), 1e-30))
  }
  const step = (fromSec: number, toSec: number): number => {
    let most = 0
    for (let i = Math.round(fromSec * RATE) + 1; i < Math.round(toSec * RATE); i += 1) {
      most = Math.max(most, Math.abs(left[i] - left[i - 1]), Math.abs(right[i] - right[i - 1]))
    }
    return most
  }
  const at = LEVEL_CHANGE_SEC
  return {
    beforeDb: energyDb(at - 1, at),
    soonDb: energyDb(at + 0.1, at + 0.6),
    laterDb: energyDb(at + 4, at + 5),
    stepBefore: step(at - 1, at - 0.05),
    stepAround: step(at - 0.05, at + 0.15),
  }
}

export async function measureLevelFollow<Name extends string>(
  cases: Record<Name, LevelFollowCase>,
): Promise<Record<Name, LevelFollowMeasure>> {
  const out = {} as Record<Name, LevelFollowMeasure>
  for (const name of Object.keys(cases) as Name[]) out[name] = await measure(cases[name])
  return out
}
