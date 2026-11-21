// The page side of the check that a separated track bounces back to itself.
// A track is separated by a stand-in written here, its five parts are laid
// on a score as the library lays them, the untouched score is rendered on a
// real OfflineAudioContext, and the bounce is held against the track. The
// mocks can only say what the graph was told: whether the samples add up,
// through real sources, gains, panners and the master, is the browser's to
// say.
//
// The stand-in splits the track with gains and low-passes, so the remainder
// is far from nothing, and makes two stems stand away from zero where they
// start and end: one on a level, one on a tone cut partway through a wave.
// A track eases a clip whose sound would step where it starts or ends, and
// five parts eased five ways would not add up.

import { ScoreDocument, createScore, renderScore } from '@kieranklaassen/live-mix'
import {
  PART_NAMES,
  separateTrack,
  separationTracks,
  type Channels,
  type Separator,
  type StemName,
} from '@kieranklaassen/live-mix/separation'

export interface SeparationCase {
  sampleRate: number
  channels: 1 | 2
  /** Mute the remainder's track: the bounce is then the stems alone. */
  muteRemainder?: boolean
  /** Keep each part in a buffer that ends where its sound does, with no silence after it. */
  noTail?: boolean
}

export interface SeparationMeasure {
  /** The largest sample of the bounce minus the track, in dB under full scale; -200 for none. */
  differenceDb: number
  /** The track's largest sample, in dB under full scale. */
  trackPeakDb: number
  /** The remainder against the track, as the library reports it. */
  remainderDb: number
  /** Whether the bounce has the track's frames and channels. */
  sameShape: boolean
}

const SECONDS = 3

const db = (sample: number): number => (sample > 0 ? 20 * Math.log10(sample) : -200)

/** Noise and a low tone, near full scale, a little different on each side. */
function track(sampleRate: number, channels: number): Float32Array[] {
  // Not a whole number of blocks, nor of anything else.
  const frames = SECONDS * sampleRate + 17
  let state = 0x1234_5678
  return Array.from({ length: channels }, (_, channel) => {
    const data = new Float32Array(frames)
    for (let i = 0; i < frames; i += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      data[i] =
        0.9 * (state / 4294967296 - 0.5) +
        (0.5 - 0.1 * channel) * Math.sin((2 * Math.PI * 110 * i) / sampleRate)
    }
    return data
  })
}

function lowpassed(channel: Float32Array, coefficient: number, gain: number): Float32Array {
  const out = new Float32Array(channel.length)
  let state = 0
  for (let i = 0; i < channel.length; i += 1) {
    state += coefficient * (channel[i] - state)
    out[i] = gain * state
  }
  return out
}

const standIn: Separator = {
  sampleRate: 44100,
  separate: (channels) => {
    const each = (make: (channel: Float32Array) => Float32Array): Channels => channels.map(make)
    const stems: Record<StemName, Channels> = {
      // On a level from the first frame to the last.
      vocals: each((channel) => channel.map((sample) => 0.3 * sample + 0.2)),
      drums: each((channel) => channel.map((sample) => 0.25 * sample)),
      // A tone that is at its top on the first frame and wherever the last one falls.
      bass: each((channel) =>
        lowpassed(channel, 0.05, 0.6).map(
          (sample, i) => sample + 0.25 * Math.cos((2 * Math.PI * 1234.5 * i) / 44100),
        ),
      ),
      other: each((channel) => lowpassed(channel, 0.4, 0.2)),
    }
    return Promise.resolve(stems)
  },
}

async function measure(spec: SeparationCase): Promise<SeparationMeasure> {
  const channels = track(spec.sampleRate, spec.channels)
  const separation = await separateTrack({ channels, sampleRate: spec.sampleRate }, standIn)
  const document = new ScoreDocument(createScore())
  const laid = separationTracks(document.score, separation)
  document.apply(laid.operation)
  if (spec.muteRemainder) {
    document.apply({ type: 'strip.mute', owner: laid.parts.remainder.trackId, mute: true })
  }

  let resolveSource = laid.resolveSource
  if (spec.noTail) {
    const bare = new Map(
      PART_NAMES.map((name) => {
        const sound = name === 'remainder' ? separation.remainder : separation.stems[name]
        const buffer = new AudioBuffer({
          numberOfChannels: sound.length,
          length: sound[0].length,
          sampleRate: spec.sampleRate,
        })
        sound.forEach((channel, index) => buffer.copyToChannel(new Float32Array(channel), index))
        return [laid.parts[name].sourceId, buffer]
      }),
    )
    resolveSource = (source) => bare.get(source.id)
  }

  const bounce = await renderScore(document.score, { ...laid.render, renderer: { resolveSource } })
  bounce.engine.dispose()
  const rendered = bounce.audio.channels
  let largest = 0
  let peak = 0
  for (let channel = 0; channel < channels.length; channel += 1) {
    for (let i = 0; i < channels[channel].length; i += 1) {
      peak = Math.max(peak, Math.abs(channels[channel][i]))
      largest = Math.max(largest, Math.abs((rendered[channel]?.[i] ?? 0) - channels[channel][i]))
    }
  }
  return {
    differenceDb: db(largest),
    trackPeakDb: db(peak),
    remainderDb: separation.report.remainderDb,
    sameShape:
      rendered.length === channels.length &&
      rendered.every((channel) => channel.length === channels[0].length),
  }
}

export async function measureSeparation<Name extends string>(
  cases: Record<Name, SeparationCase>,
): Promise<Record<Name, SeparationMeasure>> {
  const out = {} as Record<Name, SeparationMeasure>
  for (const name of Object.keys(cases) as Name[]) out[name] = await measure(cases[name])
  return out
}
