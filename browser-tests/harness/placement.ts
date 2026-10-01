// The page side of the placed-clip check. A clip's `pan`, `lowpassHz` and
// `spaceDb` are a handful of real nodes, and the mocks cannot say what those
// nodes do to sound: that a mono clip is as loud placed in the centre as
// unplaced, that the room returns as much of a low-mid sound as it is sent
// and less of hiss, that it rings on and is wide. Each case renders one
// second of noise through an audio track on a real OfflineAudioContext and
// is measured here.

import { renderOffline, type Clip } from '@kieranklaassen/live-mix'

const RATE = 48000
const CLIP_SEC = 1
const RENDER_SEC = 7

export interface PlacementMeasure {
  /** Energy of each side over the second the clip plays, and after it. */
  during: [number, number]
  after: [number, number]
  /** Share of the clip's energy in its first difference: higher is brighter. */
  brightness: number
  /** Correlation of the two sides after the clip has ended. */
  tailCorrelation: number
  /** Energy of the tail's third second against its first. */
  tailFallDb: number
}

export type PlacementCase = Partial<Pick<Clip, 'gainDb' | 'pan' | 'lowpassHz' | 'spaceDb'>> & {
  channels: 1 | 2
  /** Noise with its weight in the low mids, where the room's level is set, instead of white. */
  warm?: boolean
}

/** The band a warm noise is kept to. */
const WARM_LOW_HZ = 300
const WARM_HIGH_HZ = 1200

/** The same noise every time, so two renders differ only by their placement. */
function noiseBuffer(ctx: BaseAudioContext, channels: number, warm: boolean): AudioBuffer {
  const buffer = ctx.createBuffer(channels, CLIP_SEC * RATE, RATE)
  const high = Math.exp((-2 * Math.PI * WARM_LOW_HZ) / RATE)
  const low = 1 - Math.exp((-2 * Math.PI * WARM_HIGH_HZ) / RATE)
  let state = 0x1234_5678
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    let highIn = 0
    let highOut = 0
    let lowOut = 0
    let lowerOut = 0
    for (let i = 0; i < data.length; i += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      const white = (state / 4294967296) * 0.5 - 0.25
      if (!warm) {
        data[i] = white
        continue
      }
      // A high-pass and two low-passes: what is left sits between the two ends.
      highOut = high * (highOut + white - highIn)
      highIn = white
      lowOut += low * (highOut - lowOut)
      lowerOut += low * (lowOut - lowerOut)
      data[i] = lowerOut * 4
    }
  }
  return buffer
}

function energy(data: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += data[i] * data[i]
  return sum
}

async function measure(placement: PlacementCase): Promise<PlacementMeasure> {
  const { channels, warm = false, ...place } = placement
  const result = await renderOffline({
    durationSec: RENDER_SEC,
    sampleRate: RATE,
    build: async (engine) => {
      await engine.samples.load('noise', noiseBuffer(engine.context, channels, warm))
      engine.addAudioTrack('placed').clips.add({
        id: 'clip',
        sourceId: 'noise',
        startSec: 0,
        offsetSec: 0,
        durationSec: CLIP_SEC,
        fadeInSec: 0,
        fadeOutSec: 0,
        fadeCurve: 'linear',
        gainDb: 0,
        ...place,
      })
    },
  })
  const [left, right] = result.audio.channels
  const end = CLIP_SEC * RATE
  // The dry clip has stopped by here; what follows is the room alone.
  const tailFrom = end + RATE / 10
  let diff = 0
  for (let i = 1; i < end; i += 1) diff += (left[i] - left[i - 1]) ** 2
  let dot = 0
  for (let i = tailFrom; i < left.length; i += 1) dot += left[i] * right[i]
  const tailLeft = energy(left, tailFrom, left.length)
  const tailRight = energy(right, tailFrom, right.length)
  const first = energy(left, tailFrom, tailFrom + RATE)
  const last = energy(left, tailFrom + 2 * RATE, tailFrom + 3 * RATE)
  return {
    during: [energy(left, 0, end), energy(right, 0, end)],
    after: [tailLeft, tailRight],
    brightness: diff / Math.max(energy(left, 0, end), 1e-30),
    tailCorrelation: dot / Math.max(Math.sqrt(tailLeft * tailRight), 1e-30),
    tailFallDb: 10 * Math.log10(Math.max(last, 1e-30) / Math.max(first, 1e-30)),
  }
}

export async function measurePlacements<Name extends string>(
  cases: Record<Name, PlacementCase>,
): Promise<Record<Name, PlacementMeasure>> {
  const out = {} as Record<Name, PlacementMeasure>
  for (const name of Object.keys(cases) as Name[]) out[name] = await measure(cases[name])
  return out
}
