// A separation laid on a score: five audio tracks that start at 0, one for
// each stem and one for the remainder, each playing its part whole. Applied
// as one step and left untouched, the five add up to the track they were
// separated from, so a mix starts from the track as it was and every move
// after that is a change to it.
//
// For that sum to hold to the sample, each part's sound ends in a little
// silence of its own. A track eases a clip in or out where the sound would
// step there, and decides from the sound alone: a stem that happens to end
// partway through a wave would be faded where the stem beside it was not,
// and the sum would dip. A clip that ends ahead of its sound's end, where
// what follows is silence, is left square, and so is every part.

import { type Clip } from '../core/clips/Clip'
import { type Operation } from '../score/operations'
import {
  defaultStrip,
  findElementTrack,
  findStripHost,
  masterDestination,
  type Score,
  type ScoreSource,
} from '../score/schema'
import { PART_NAMES, SeparationError, type PartName, type Separation } from './types'

/** The silence after each part's sound, in seconds: longer than the stretch a track looks at for a step. */
const TAIL_SECONDS = 0.02

const TRACK_NAMES: Record<PartName, string> = {
  vocals: 'Vocals',
  drums: 'Drums',
  bass: 'Bass',
  other: 'Other',
  remainder: 'Remainder',
}

export interface SeparationTracksOptions {
  /**
   * Makes the buffer a part's sound is kept in. Default: `new AudioBuffer`,
   * which a page has and a worker has not, so the tracks are made on the page.
   */
  createBuffer?: (numberOfChannels: number, length: number, sampleRate: number) => AudioBuffer
}

export interface SeparationTracks {
  /** One `batch` that adds the five sources and the five tracks: one step to undo. */
  operation: Operation
  /** The track and the source each part was given. */
  parts: Record<PartName, { trackId: string; sourceId: string }>
  /**
   * Each new source's sound by source id. A live engine is handed them with
   * `engine.samples.load(id, buffer)` before the operation is applied.
   */
  buffers: ReadonlyMap<string, AudioBuffer>
  /** For a render's `renderer.resolveSource`: the sound of one of these sources, and nothing for any other. */
  resolveSource: (source: Pick<ScoreSource, 'id'>) => AudioBuffer | undefined
  /** What `renderScore` is told so that the bounce has the track's rate, channels and frames. */
  render: { durationSec: number; sampleRate: number; numberOfChannels: number }
}

function defaultBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
  if (typeof AudioBuffer === 'undefined') {
    throw new SeparationError(
      'there is no AudioBuffer here to keep a part in: make the tracks on the page, or pass createBuffer',
    )
  }
  return new AudioBuffer({ numberOfChannels, length, sampleRate })
}

/** The suffix under which none of the five parts' names is a track or a source of the score. */
function freeSuffix(score: Score): string {
  const taken = (id: string): boolean =>
    findStripHost(score, id) !== undefined ||
    findElementTrack(score, id) !== undefined ||
    score.sources.some((source) => source.id === id)
  for (let n = 1; ; n += 1) {
    const suffix = n === 1 ? '' : `-${n}`
    if (!PART_NAMES.some((name) => taken(`${name}${suffix}`))) return suffix
  }
}

/**
 * The tracks of `separation` for `score`: the operation that adds them, the
 * sound of each, and how to render the score so that the untouched tracks
 * bounce back to the track that was separated. The ids are the parts' names
 * (`vocals`, `drums`, `bass`, `other`, `remainder`), with `-2`, `-3`, … on
 * all five where the score already has one of them.
 */
export function separationTracks(
  score: Score,
  separation: Separation,
  options: SeparationTracksOptions = {},
): SeparationTracks {
  const createBuffer = options.createBuffer ?? defaultBuffer
  const { sampleRate } = separation
  const frames = separation.remainder[0].length
  const numberOfChannels = separation.remainder.length
  const tail = Math.ceil(TAIL_SECONDS * sampleRate)
  const suffix = freeSuffix(score)

  const ops: Operation[] = []
  const tracks: Operation[] = []
  const buffers = new Map<string, AudioBuffer>()
  const parts = {} as SeparationTracks['parts']
  for (const name of PART_NAMES) {
    const id = `${name}${suffix}`
    const channels = name === 'remainder' ? separation.remainder : separation.stems[name]
    const buffer = createBuffer(numberOfChannels, frames + tail, sampleRate)
    channels.forEach((channel, index) =>
      buffer.copyToChannel(channel as Float32Array<ArrayBuffer>, index),
    )
    buffers.set(id, buffer)
    parts[name] = { trackId: id, sourceId: id }
    const clip: Clip = {
      id: name,
      sourceId: id,
      startSec: 0,
      offsetSec: 0,
      durationSec: frames / sampleRate,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
      gainDb: 0,
    }
    ops.push({ type: 'source.add', source: { id, durationSec: (frames + tail) / sampleRate } })
    tracks.push({
      type: 'track.add',
      track: {
        kind: 'audio',
        id,
        name: TRACK_NAMES[name],
        destination: masterDestination(),
        strip: defaultStrip(),
        clips: [clip],
      },
    })
  }

  return {
    operation: { type: 'batch', ops: [...ops, ...tracks], label: 'Add stems' },
    parts,
    buffers,
    resolveSource: (source) => buffers.get(source.id),
    render: {
      // A render takes the frames of its length rounded up: half a frame
      // short of the track's, so a length that is not a whole number of
      // frames as a float still rounds to the track's own.
      durationSec: (frames - 0.5) / sampleRate,
      sampleRate,
      numberOfChannels,
    },
  }
}
