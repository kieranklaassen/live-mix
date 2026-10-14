// The page side of the check that a placed clip cut in two is the clip. Each
// piece is a voice with a low-pass of its own, and where the first stops the
// second goes straight on, so the first's low-pass has to ring out under the
// second for the two to add up to the whole. A browser gives one channel of
// silence for a source that has ended, and a filter whose channels change
// starts again from nothing: the mocks cannot say that. Each case renders
// one second of noise whole and cut once on a real OfflineAudioContext, and
// the two files are held against each other here.

import { renderOffline, type Clip } from '@kieranklaassen/live-mix'

const RATE = 48000
const CLIP_SEC = 1
const RENDER_SEC = 1.5

export interface CutCase {
  channels: 1 | 2
  /** The frame of the sound the second piece begins on. */
  cutFrame: number
  lowpassHz: number
  /** Whether the track joins its clips, as a host that cuts clips asks. */
  joinClips?: boolean
}

export interface CutMeasure {
  /** The largest sample of whole minus cut, in dB under full scale; -200 for none. */
  differenceDb: number
  /** How many frames after the cut that sample is. */
  framesAfterCut: number
  /** The largest sample of the whole file, in dB under full scale. */
  peakDb: number
}

/** White noise, the same every time: it moves so fast that no frame of it is a step to stop on. */
function noiseBuffer(ctx: BaseAudioContext, channels: number): AudioBuffer {
  const buffer = ctx.createBuffer(channels, CLIP_SEC * RATE, RATE)
  let state = 0x1234_5678
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      data[i] = (state / 4294967296) * 0.5 - 0.25
    }
  }
  return buffer
}

function piece(id: string, fromFrame: number, toFrame: number, lowpassHz: number): Clip {
  return {
    id,
    sourceId: 'noise',
    startSec: fromFrame / RATE,
    offsetSec: fromFrame / RATE,
    durationSec: (toFrame - fromFrame) / RATE,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
    pan: 0,
    lowpassHz,
  }
}

async function render(cut: CutCase, clips: Clip[]): Promise<readonly Float32Array[]> {
  const result = await renderOffline({
    durationSec: RENDER_SEC,
    sampleRate: RATE,
    build: async (engine) => {
      await engine.samples.load('noise', noiseBuffer(engine.context, cut.channels))
      const track = engine.addAudioTrack('placed', { joinClips: cut.joinClips ?? false })
      for (const clip of clips) track.clips.add(clip)
    },
  })
  return result.audio.channels
}

const db = (sample: number): number => (sample > 0 ? 20 * Math.log10(sample) : -200)

async function measure(cut: CutCase): Promise<CutMeasure> {
  const end = CLIP_SEC * RATE
  const whole = await render(cut, [piece('whole', 0, end, cut.lowpassHz)])
  const pieces = await render(cut, [
    piece('a', 0, cut.cutFrame, cut.lowpassHz),
    piece('b', cut.cutFrame, end, cut.lowpassHz),
  ])
  let largest = 0
  let at = cut.cutFrame
  let peak = 0
  for (let channel = 0; channel < whole.length; channel += 1) {
    for (let i = 0; i < whole[channel].length; i += 1) {
      peak = Math.max(peak, Math.abs(whole[channel][i]))
      const difference = Math.abs(whole[channel][i] - pieces[channel][i])
      if (difference > largest) {
        largest = difference
        at = i
      }
    }
  }
  return { differenceDb: db(largest), framesAfterCut: at - cut.cutFrame, peakDb: db(peak) }
}

export async function measureCutPieces<Name extends string>(
  cases: Record<Name, CutCase>,
): Promise<Record<Name, CutMeasure>> {
  const out = {} as Record<Name, CutMeasure>
  for (const name of Object.keys(cases) as Name[]) out[name] = await measure(cases[name])
  return out
}
