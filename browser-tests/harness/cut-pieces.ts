// The page side of the check that a placed clip cut in two is the clip. Each
// piece is a voice with a low-pass of its own, and where the first stops the
// second goes on, so the first's low-pass has to ring out under the second
// for the two to add up to the whole. A browser gives one channel of silence
// for a source that has ended, and a filter whose channels change starts
// again from nothing: the mocks cannot say that. Each case renders a sound
// whole and cut once on a real OfflineAudioContext, and the two files are
// held against each other here.

import { renderOffline, type Clip } from '@kieranklaassen/live-mix'

const RATE = 48000
const SOUND_SEC = 1
/** A swell is played round once and on for this long, so the piece after the cut repeats. */
const SWELL_SEC = 1.4
const RENDER_SEC = 2

export interface CutCase {
  /**
   * `noise` (the default): white noise played once. It moves so fast that no
   * frame of it is a step, so both pieces stop and start square.
   * `swell`: a sound made to come round, busy up to the cut and falling
   * slowly after it, played round and on. The last busy frame is at rest, so
   * by itself the first piece stops square; the frame after stands still at
   * a level, so the second, which repeats, comes up there from silence.
   */
  sound?: 'noise' | 'swell'
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

function noiseBuffer(ctx: BaseAudioContext, channels: number): AudioBuffer {
  const buffer = ctx.createBuffer(channels, SOUND_SEC * RATE, RATE)
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

/** A tone of 2 kHz up to `cutFrame`, which is to be on a whole wave of it, then a fall from 0.3 to nothing. */
function swellBuffer(ctx: BaseAudioContext, channels: number, cutFrame: number): AudioBuffer {
  const length = SOUND_SEC * RATE
  const buffer = ctx.createBuffer(channels, length, RATE)
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    // The two sides differ, so a filter that lost a side would show.
    const level = 1 - 0.25 * channel
    for (let i = 0; i < length; i += 1) {
      data[i] =
        level *
        (i < cutFrame
          ? 0.2 * Math.sin((2 * Math.PI * 2000 * i) / RATE)
          : (0.3 * (length - i)) / (length - cutFrame))
    }
  }
  return buffer
}

function piece(cut: CutCase, id: string, fromFrame: number, toFrame: number): Clip {
  return {
    id,
    sourceId: 'sound',
    startSec: fromFrame / RATE,
    offsetSec: fromFrame / RATE,
    durationSec: (toFrame - fromFrame) / RATE,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
    pan: 0,
    lowpassHz: cut.lowpassHz,
  }
}

/** The clip whole, and its two pieces as a host that cuts it once would leave them. */
function clipsOf(cut: CutCase): { whole: Clip[]; pieces: Clip[] } {
  const end = SOUND_SEC * RATE
  if (cut.sound !== 'swell') {
    return {
      whole: [piece(cut, 'whole', 0, end)],
      pieces: [piece(cut, 'a', 0, cut.cutFrame), piece(cut, 'b', cut.cutFrame, end)],
    }
  }
  // The piece after a cut inside the first time round enters inside the part it repeats.
  const round = { loop: true, loopStartSec: 0, loopEndSec: SOUND_SEC }
  const last = SWELL_SEC * RATE
  return {
    whole: [{ ...piece(cut, 'whole', 0, last), ...round }],
    pieces: [
      piece(cut, 'a', 0, cut.cutFrame),
      { ...piece(cut, 'b', cut.cutFrame, last), ...round },
    ],
  }
}

async function render(cut: CutCase, clips: Clip[]): Promise<readonly Float32Array[]> {
  const result = await renderOffline({
    durationSec: RENDER_SEC,
    sampleRate: RATE,
    build: async (engine) => {
      const ctx = engine.context
      await engine.samples.load(
        'sound',
        cut.sound === 'swell'
          ? swellBuffer(ctx, cut.channels, cut.cutFrame)
          : noiseBuffer(ctx, cut.channels),
      )
      const track = engine.addAudioTrack('placed', { joinClips: cut.joinClips ?? false })
      for (const clip of clips) track.clips.add(clip)
    },
  })
  return result.audio.channels
}

const db = (sample: number): number => (sample > 0 ? 20 * Math.log10(sample) : -200)

async function measure(cut: CutCase): Promise<CutMeasure> {
  const clips = clipsOf(cut)
  const whole = await render(cut, clips.whole)
  const pieces = await render(cut, clips.pieces)
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
