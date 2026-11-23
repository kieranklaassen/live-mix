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
//
// A case can ask for more parts than five. The stand-in then answers six
// stems, the four with a guitar and a piano, or a part of the separation is
// split by a second stand-in: the drums into a kick, a snare, toms and
// cymbals, the vocals into a lead and a backing. Each split leaves a rest of
// its part under the part's own name, far from nothing as the remainder is,
// and some of what a split gives stands away from zero at both ends too.

import { ScoreDocument, createScore, renderScore } from '@kieranklaassen/live-mix'
import {
  partNames,
  separateTrack,
  separationTracks,
  splitPart,
  type Channels,
  type Separation,
  type Separator,
  type StemName,
} from '@kieranklaassen/live-mix/separation'

export interface SeparationCase {
  sampleRate: number
  channels: 1 | 2
  /** How many stems the stand-in answers: the four, or with 6 the four, a guitar and a piano. Default 4. */
  stems?: 4 | 6
  /**
   * The parts that are split once the track is separated, in this order:
   * `drums` in four and `vocals` in two, each with a rest that keeps the
   * part's name.
   */
  splits?: readonly ('drums' | 'vocals')[]
  /** Mute the remainder's track: the bounce is then the stems alone. */
  muteRemainder?: boolean
  /** Mute the track of the part of this name: the bounce is then the track without it. */
  mute?: string
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
  /** The parts that were laid, in the order of their tracks. */
  parts: readonly string[]
  /** For each part that was split, what was left of it against the part, as the library reports it. */
  restsDb: Record<string, number>
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

type SixStemName = StemName | 'guitar' | 'piano'

/** The four as the stand-in gives them, with two more stems after them. */
const sixStems: Separator<SixStemName> = {
  sampleRate: 44100,
  stems: ['vocals', 'drums', 'bass', 'other', 'guitar', 'piano'],
  separate: async (channels) => {
    const each = (make: (channel: Float32Array) => Float32Array): Channels => channels.map(make)
    return {
      ...(await standIn.separate(channels)),
      guitar: each((channel) => lowpassed(channel, 0.15, 0.15)),
      // On a level under zero from the first frame to the last.
      piano: each((channel) => channel.map((sample) => 0.1 * sample - 0.15)),
    }
  },
}

/** Splits the drums in four. What it is handed is a quarter of the track, and it leaves a good part of that. */
const drumKit: Separator<'kick' | 'snare' | 'toms' | 'cymbals'> = {
  sampleRate: 44100,
  stems: ['kick', 'snare', 'toms', 'cymbals'],
  separate: (channels) => {
    const each = (make: (channel: Float32Array) => Float32Array): Channels => channels.map(make)
    return Promise.resolve({
      // A tone that is at its top on the first frame and wherever the last one falls.
      kick: each((channel) =>
        lowpassed(channel, 0.02, 0.8).map(
          (sample, i) => sample + 0.05 * Math.cos((2 * Math.PI * 777.7 * i) / 44100),
        ),
      ),
      // On a level from the first frame to the last.
      snare: each((channel) => channel.map((sample) => 0.3 * sample + 0.04)),
      toms: each((channel) => lowpassed(channel, 0.3, 0.4)),
      // What a low-pass leaves out.
      cymbals: each((channel) => {
        const low = lowpassed(channel, 0.5, 1)
        return channel.map((sample, i) => 0.3 * (sample - low[i]))
      }),
    })
  },
}

/** Splits the vocals in two. The vocals stand on a level, so both of these do. */
const voices: Separator<'lead' | 'backing'> = {
  sampleRate: 44100,
  stems: ['lead', 'backing'],
  separate: (channels) => {
    const each = (make: (channel: Float32Array) => Float32Array): Channels => channels.map(make)
    return Promise.resolve({
      lead: each((channel) => channel.map((sample) => 0.5 * sample)),
      backing: each((channel) => lowpassed(channel, 0.1, 0.3)),
    })
  },
}

/** The track as the parts a case asks for: four stems or six, then each split in turn. */
async function separated(
  spec: SeparationCase,
  channels: Float32Array[],
): Promise<Separation<string>> {
  const audio = { channels, sampleRate: spec.sampleRate }
  let separation: Separation<string> =
    spec.stems === 6 ? await separateTrack(audio, sixStems) : await separateTrack(audio, standIn)
  for (const part of spec.splits ?? []) {
    separation =
      part === 'drums'
        ? await splitPart(separation, 'drums', drumKit)
        : await splitPart(separation, 'vocals', voices)
  }
  return separation
}

async function measure(spec: SeparationCase): Promise<SeparationMeasure> {
  const channels = track(spec.sampleRate, spec.channels)
  const separation = await separated(spec, channels)
  const parts = partNames(separation)
  const document = new ScoreDocument(createScore())
  const laid = separationTracks(document.score, separation)
  document.apply(laid.operation)
  if (spec.muteRemainder) {
    document.apply({ type: 'strip.mute', owner: laid.parts.remainder.trackId, mute: true })
  }
  if (spec.mute !== undefined) {
    document.apply({ type: 'strip.mute', owner: laid.parts[spec.mute].trackId, mute: true })
  }

  let resolveSource = laid.resolveSource
  if (spec.noTail) {
    const bare = new Map(
      parts.map((name) => {
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
    parts,
    restsDb: Object.fromEntries(
      (separation.report.splits ?? []).map((split) => [split.part, split.restDb]),
    ),
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
