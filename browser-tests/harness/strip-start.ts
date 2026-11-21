// The page side of the check that a render starts every strip where the
// score has it. Two tracks of noise made here, each a clip that plays its
// sound whole from 0, are rendered through `renderScore` on a real
// OfflineAudioContext with their strips, a group's or the master set by the
// score, and the render is held against the mix worked out from the two
// noises alone. The mocks can only say what the graph was told: whether a
// muted track is out of the first sample, through real gains and a real
// panner, is the browser's to say.
//
// The last measure is of the other side: a strip moved while the render is
// under way still approaches its value, as a strip on a playing engine does.

import {
  createScore,
  defaultStrip,
  groupDestination,
  masterDestination,
  renderOffline,
  renderScore,
  renderScoreStems,
  type Clip,
  type Score,
  type ScoreStrip,
} from '@kieranklaassen/live-mix'

const RATE = 48000
const SECONDS = 2
const FRAMES = SECONDS * RATE
/** The silence after each noise, so its clip ends where nothing sounds and is left square. */
const TAIL_FRAMES = RATE / 10
/** The first 100 ms, where a strip that eased to its value would still be on its way. */
const HEAD_FRAMES = RATE / 10

const TRACKS = ['a', 'b'] as const
type TrackId = (typeof TRACKS)[number]

type StripSettings = Partial<Pick<ScoreStrip, 'level' | 'pan' | 'inputGain' | 'mute' | 'solo'>>

/**
 * How much of a track's sound each channel of the render holds:
 * `[[left from its left, left from its right], [right from its left, right from its right]]`.
 */
export type Weights = [[number, number], [number, number]]

export interface StripStartCase {
  /** What each track's strip is given over the default. */
  a?: StripSettings
  b?: StripSettings
  /** Track `a` plays through a group whose strip is given this. */
  group?: StripSettings
  /** The master's level; 1 when left out. */
  masterLevel?: number
  /**
   * Track `b` sends its clip into a room it shares with other tracks, where
   * its level, mute and solo are a second fader and gate that follow the
   * strip's (`ChannelStrip.shadow`).
   */
  room?: boolean
  /** Measure the stem of this track (`renderScoreStems`), not the master. */
  stem?: TrackId
  /** What the render must hold of each track, from its first sample to its last. */
  expected: Record<TrackId, Weights>
}

export interface StripStartMeasure {
  /** The largest sample of the render minus what it must be, in the first 100 ms, in dB under full scale; -200 for none. */
  headDb: number
  /** The same over the whole render. */
  wholeDb: number
  /** The first frame of the render, and of what it must be, left then right. */
  firstFrame: { rendered: number[]; expected: number[] }
  /**
   * How far the two tracks with no strip set are from what the render must
   * be, in the first 100 ms: what a render would show had no strip been set
   * by its first sample.
   */
  unsetHeadDb: number
  /** Whether the render has two channels of the noise's frames. */
  sameShape: boolean
}

export interface MidRenderMeasure {
  /** How much of the muted track the render holds over the 10 ms before it is muted, 1 for all of it. */
  gateBefore: number
  /** The time constant its gate closes with, in seconds, read from the samples after. */
  timeConstantSec: number
  /** How much of it is left 100 ms after. */
  gateAfter: number
}

const db = (sample: number): number => (sample > 0 ? 20 * Math.log10(sample) : -200)

/** Two channels of white noise, the same for one seed every time, with silence after. */
function noise(seed: number): Float32Array[] {
  let state = seed
  return [0, 1].map(() => {
    const data = new Float32Array(FRAMES + TAIL_FRAMES)
    for (let i = 0; i < FRAMES; i += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      data[i] = 0.8 * (state / 4294967296 - 0.5)
    }
    return data
  })
}

const SOUNDS: Record<TrackId, Float32Array[]> = { a: noise(0x1234_5678), b: noise(0x0bad_cafe) }

function buffer(id: TrackId): AudioBuffer {
  const made = new AudioBuffer({
    numberOfChannels: 2,
    length: FRAMES + TAIL_FRAMES,
    sampleRate: RATE,
  })
  SOUNDS[id].forEach((channel, index) => made.copyToChannel(new Float32Array(channel), index))
  return made
}

function clip(id: TrackId, place: Partial<Clip> = {}): Clip {
  return {
    id: `${id}-clip`,
    sourceId: id,
    startSec: 0,
    offsetSec: 0,
    durationSec: SECONDS,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
    ...place,
  }
}

function scoreOf(spec: StripStartCase): Score {
  const score = createScore({ id: 'strips' })
  score.sources = TRACKS.map((id) => ({ id, durationSec: (FRAMES + TAIL_FRAMES) / RATE }))
  if (spec.group) {
    score.groups = [
      {
        id: 'group',
        name: 'Group',
        destination: masterDestination(),
        strip: defaultStrip(spec.group),
      },
    ]
  }
  score.tracks = TRACKS.map((id) => ({
    kind: 'audio',
    id,
    name: id,
    destination: id === 'a' && spec.group ? groupDestination('group') : masterDestination(),
    strip: defaultStrip(spec[id]),
    clips: [clip(id, id === 'b' && spec.room ? { spaceDb: -6 } : {})],
  }))
  score.master = { level: spec.masterLevel ?? 1, inserts: [] }
  return score
}

/** The two noises mixed by `weights`, each sum taken as a sample is kept. */
function mix(weights: Record<TrackId, Weights>): Float32Array[] {
  return [0, 1].map((out) => {
    const data = new Float32Array(FRAMES)
    for (let i = 0; i < FRAMES; i += 1) {
      let sum = 0
      for (const id of TRACKS) {
        sum += weights[id][out][0] * SOUNDS[id][0][i] + weights[id][out][1] * SOUNDS[id][1][i]
      }
      data[i] = sum
    }
    return data
  })
}

const AS_IT_CAME: Weights = [
  [1, 0],
  [0, 1],
]

function largestDifference(
  a: readonly Float32Array[],
  b: readonly Float32Array[],
  frames: number,
): number {
  let largest = 0
  for (let channel = 0; channel < 2; channel += 1) {
    for (let i = 0; i < frames; i += 1) {
      largest = Math.max(largest, Math.abs((a[channel]?.[i] ?? 0) - b[channel][i]))
    }
  }
  return largest
}

async function measure(spec: StripStartCase): Promise<StripStartMeasure> {
  const score = scoreOf(spec)
  const options = {
    durationSec: SECONDS,
    sampleRate: RATE,
    numberOfChannels: 2,
    engine: { sharedSpace: spec.room ?? false },
    renderer: { resolveSource: (source: { id: string }) => buffer(source.id as TrackId) },
  }
  let rendered: readonly Float32Array[]
  if (spec.stem) {
    const stems = await renderScoreStems(score, { ...options, stems: [spec.stem] })
    rendered = stems[spec.stem].audio.channels
    for (const result of Object.values(stems)) result.engine.dispose()
  } else {
    const bounce = await renderScore(score, options)
    rendered = bounce.audio.channels
    bounce.engine.dispose()
  }
  const expected = mix(spec.expected)
  const unset = mix({ a: AS_IT_CAME, b: AS_IT_CAME })
  return {
    headDb: db(largestDifference(rendered, expected, HEAD_FRAMES)),
    wholeDb: db(largestDifference(rendered, expected, FRAMES)),
    firstFrame: {
      rendered: [rendered[0]?.[0] ?? 0, rendered[1]?.[0] ?? 0],
      expected: [expected[0][0], expected[1][0]],
    },
    unsetHeadDb: db(largestDifference(unset, expected, HEAD_FRAMES)),
    sameShape: rendered.length === 2 && rendered.every((channel) => channel.length === FRAMES),
  }
}

export async function measureStripStarts<Name extends string>(
  cases: Record<Name, StripStartCase>,
): Promise<Record<Name, StripStartMeasure>> {
  const out = {} as Record<Name, StripStartMeasure>
  for (const name of Object.keys(cases) as Name[]) out[name] = await measure(cases[name])
  return out
}

/** When track `b` is muted, on the render's clock: a whole number of the render's blocks. */
const MUTE_SEC = 1

/**
 * Both tracks play, and one second in, with the render stopped between two
 * blocks as a page's own move lands, track `b` is muted. What the render
 * holds of `b` from there on is its gate, sample by sample.
 */
export async function measureMuteMidRender(): Promise<MidRenderMeasure> {
  const result = await renderOffline({
    durationSec: SECONDS,
    sampleRate: RATE,
    build: async (engine) => {
      const context = engine.context as OfflineAudioContext
      for (const id of TRACKS) {
        await engine.samples.load(id, buffer(id))
        engine.addAudioTrack(id).clips.add(clip(id))
      }
      void context.suspend(MUTE_SEC).then(() => {
        engine.track('b').strip.setMute(true)
        void context.resume()
      })
    },
  })
  result.engine.dispose()
  const left = result.audio.channels[0]
  const from = MUTE_SEC * RATE
  // The gate is what is left of `b` once `a` is taken off, read where `b` is loud enough to divide by.
  const gateAt = (i: number): number | null =>
    Math.abs(SOUNDS.b[0][i]) > 0.1 ? (left[i] - SOUNDS.a[0][i]) / SOUNDS.b[0][i] : null
  const mean = (start: number, end: number): number => {
    let sum = 0
    let count = 0
    for (let i = start; i < end; i += 1) {
      const gate = gateAt(i)
      if (gate === null) continue
      sum += gate
      count += 1
    }
    return sum / count
  }
  // An approach falls as e^(-t / constant): the constant is read off the fall's slope.
  let squares = 0
  let products = 0
  for (let i = from + 1; i < from + RATE / 50; i += 1) {
    const gate = gateAt(i)
    if (gate === null || gate < 0.05 || gate > 0.99) continue
    const t = (i - from) / RATE
    squares += t * t
    products += t * Math.log(gate)
  }
  return {
    gateBefore: mean(from - RATE / 100, from),
    timeConstantSec: -squares / products,
    gateAfter: mean(from + RATE / 10, from + RATE / 10 + RATE / 100),
  }
}
