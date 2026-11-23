// A separation laid on a score: audio tracks that start at 0, one for each
// stem and one for the remainder, each playing its part whole. Applied as one
// step and left untouched, they add up to the track they were separated
// from, so a mix starts from the track as it was and every move after that
// is a change to it.
//
// For that sum to hold to the sample, each part's sound ends in a little
// silence of its own. A track eases a clip in or out where the sound would
// step there, and decides from the sound alone: a stem that happens to end
// partway through a wave would be faded where the stem beside it was not,
// and the sum would dip. A clip that ends ahead of its sound's end, where
// what follows is silence, is left square, and so is every part.

import { type Clip } from '../core/clips/Clip'
import { SEAM_WINDOW_SECONDS } from '../core/clips/seam'
import { type Operation } from '../score/operations'
import {
  MASTER_OWNER,
  defaultStrip,
  findElementTrack,
  findStripHost,
  masterDestination,
  type Score,
  type ScoreSource,
} from '../score/schema'
import { partNames } from './names'
import { SeparationError, type Channels, type Separation, type StemName } from './types'

/** The silence after each part's sound, in seconds: four times the stretch a track looks at for a step. */
const TAIL_SECONDS = 4 * SEAM_WINDOW_SECONDS

export interface SeparationTracksOptions {
  /**
   * Makes the buffer a part's sound is kept in. Default: `new AudioBuffer`,
   * which a page has and a worker has not, so the tracks are made on the page.
   */
  createBuffer?: (numberOfChannels: number, length: number, sampleRate: number) => AudioBuffer
}

export interface SeparationTracks<Name extends string = StemName> {
  /** One `batch` that adds a source and a track for each part: one step to undo. */
  operation: Operation
  /**
   * The track and the source each part was given, by the part's name. The
   * order the tracks were laid in is `partNames` of the separation.
   */
  parts: Record<Name | 'remainder', { trackId: string; sourceId: string }>
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

/**
 * The suffix under which no part's name is taken as an id: by a track, a
 * group, a return, an element track or a source of the score, or by the
 * score's master.
 */
function freeSuffix(score: Score, names: readonly string[]): string {
  const taken = (id: string): boolean =>
    id === MASTER_OWNER ||
    findStripHost(score, id) !== undefined ||
    findElementTrack(score, id) !== undefined ||
    score.sources.some((source) => source.id === id)
  for (let n = 1; ; n += 1) {
    const suffix = n === 1 ? '' : `-${n}`
    if (!names.some((name) => taken(`${name}${suffix}`))) return suffix
  }
}

/**
 * What a part's track is called: the part's name with a capital first letter
 * and a space for each hyphen, so `lead-vocals` is Lead vocals, and the four
 * and the remainder are Vocals, Drums, Bass, Other and Remainder.
 */
function trackName(part: string): string {
  return part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
}

/**
 * The tracks of `separation` for `score`: the operation that adds them, the
 * sound of each, and how to render the score so that the untouched tracks
 * bounce back to the track that was separated. There is a track for each
 * part, the stems in the separation's order and the remainder last. The ids
 * are the parts' names (`vocals`, `drums`, `bass`, `other`, `remainder` for a
 * separation of the four), with `-2`, `-3`, … on all of them where one is
 * taken, by the score or by its master. The names differ and the suffix is
 * one, so no two parts are given one id. Throws a `SeparationError` when the
 * separation's stems are not its names, or when a part has another length or
 * channel count than the remainder, with that part's name.
 */
export function separationTracks<Name extends string = StemName>(
  score: Score,
  separation: Separation<Name>,
  options: SeparationTracksOptions = {},
): SeparationTracks<Name> {
  const createBuffer = options.createBuffer ?? defaultBuffer
  const { sampleRate } = separation
  const frames = separation.remainder[0].length
  const numberOfChannels = separation.remainder.length
  const tail = Math.ceil(TAIL_SECONDS * sampleRate)
  const names = partNames(separation)
  const sound = (name: Name | 'remainder'): Channels =>
    name === 'remainder' ? separation.remainder : separation.stems[name]
  // A shorter part would leave silence where the track has sound, and a
  // longer one, or one of other channels, would not go into its buffer whole.
  for (const name of names) {
    const channels = sound(name)
    if (channels.length !== numberOfChannels) {
      throw new SeparationError(
        `the part ${name} has a channel count of ${channels.length} and the remainder one of ${numberOfChannels}`,
      )
    }
    const other = channels.find((channel) => channel.length !== frames)
    if (other !== undefined) {
      throw new SeparationError(
        `the part ${name} has a channel of length ${other.length}, and the remainder's first channel is of length ${frames}`,
      )
    }
  }
  const suffix = freeSuffix(score, names)

  const ops: Operation[] = []
  const tracks: Operation[] = []
  const buffers = new Map<string, AudioBuffer>()
  const parts = {} as SeparationTracks<Name>['parts']
  for (const name of names) {
    const id = `${name}${suffix}`
    const channels = sound(name)
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
        name: trackName(name),
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
