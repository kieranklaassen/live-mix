// What a host of the four stems writes against the entry's types, written
// here as it writes it, with no cast: a record by `PartName` from the laid
// tracks, a separation by hand with four keys and no names, the five parts
// read by `PART_NAMES`, and a hybrid model made with no spec. The type
// parameters of the entry default to the four, and this file is what fails
// `pnpm typecheck` when one of those defaults is lost. The cases run as
// well, so the shapes are held to what the code gives.

import { describe, expect, it } from 'vitest'

import { createScore } from '../../score/schema'
import { MockAudioBuffer } from '../../testing'
import {
  HYBRID_MODEL_SPEC,
  PART_NAMES,
  STEM_NAMES,
  createHybridModel,
  createSegmentSeparator,
  partNames,
  separateTrack,
  separationTracks,
  stemNames,
  type Channels,
  type HybridModelSpec,
  type ModelRuntime,
  type PartName,
  type SegmentModel,
  type Separation,
  type SeparationTracksOptions,
  type Separator,
  type StemName,
} from '../index'
import { noise } from './support'

const mockBuffers: SeparationTracksOptions = {
  createBuffer: (channels, length, sampleRate) =>
    new MockAudioBuffer(channels, length, sampleRate) as unknown as AudioBuffer,
}

const sound = (seed: number): Channels => [noise(64, seed), noise(64, seed + 1)]

class Tensor {
  constructor(
    readonly type: 'float32',
    readonly data: Float32Array,
    readonly dims: readonly number[],
  ) {}
}

/** A runtime as a host hands one in: its tensor class and a session of two inputs and two outputs. */
function runtime(): ModelRuntime<Tensor> {
  return {
    Tensor,
    session: {
      inputNames: ['mix', 'mix_spectrogram'],
      outputNames: ['stems_spectrogram', 'stems'],
      run: () => Promise.resolve({}),
    },
  }
}

/** A model of the four written with no `stems`: each stem a quarter of the segment. */
const quarters: SegmentModel = {
  sampleRate: 44100,
  segmentFrames: 32,
  run: (segment) => {
    const quarter = (): Channels => segment.map((channel) => channel.map((sample) => sample / 4))
    return Promise.resolve({
      vocals: quarter(),
      drums: quarter(),
      bass: quarter(),
      other: quarter(),
    })
  },
}

/** What a host keeps of a run: its report and its five parts by name. */
interface Separated {
  report: Separation['report']
  parts: Map<PartName, Separation['remainder']>
}

/** A separation of the four is taken where one is asked for. */
function ofTheFour(separation: Separation): Separation {
  return separation
}

describe('what a host of the four writes against the entry’s types', () => {
  it('names the four and the five as tuples of their own names', () => {
    const stems: readonly ['vocals', 'drums', 'bass', 'other'] = STEM_NAMES
    const parts: readonly ['vocals', 'drums', 'bass', 'other', 'remainder'] = PART_NAMES
    const stem: StemName = stems[0]
    const last: PartName = parts[4]
    expect([stem, last]).toEqual(['vocals', 'remainder'])
  })

  it('makes a hybrid model with no spec, and with a spec of the four, as a model of the four', () => {
    const model: SegmentModel = createHybridModel(runtime())
    const made = (): Promise<SegmentModel> => Promise.resolve(createHybridModel(runtime()))
    const spec: HybridModelSpec = { ...HYBRID_MODEL_SPEC, segmentFrames: 4096 }
    const order: readonly StemName[] = HYBRID_MODEL_SPEC.stems
    const small: SegmentModel = createHybridModel(runtime(), spec)
    expect(model.segmentFrames).toBe(343980)
    expect(small.segmentFrames).toBe(4096)
    expect(order).toHaveLength(4)
    expect(made).toBeTypeOf('function')
  })

  it('separates with a model of the four and reads the five parts by `PART_NAMES`', async () => {
    const track = { channels: sound(1), sampleRate: 44100 }
    const controller = new AbortController()
    const seen: number[] = []
    const { sampleRate, report, stems, remainder } = await separateTrack(
      track,
      createSegmentSeparator(quarters),
      { signal: controller.signal, onProgress: ({ done, total }) => seen.push(done / total) },
    )
    const separated: Separated = {
      report,
      parts: new Map(
        PART_NAMES.map((name) => [name, name === 'remainder' ? remainder : stems[name]]),
      ),
    }
    expect(sampleRate).toBe(44100)
    expect([...separated.parts.keys()]).toEqual(['vocals', 'drums', 'bass', 'other', 'remainder'])
    expect(separated.parts.get('bass')).toBe(stems.bass)
    expect(separated.report.modelSampleRate).toBe(44100)
    expect(seen.at(-1)).toBe(1)

    // The same run with each step given its type: a separator and a separation of the four.
    const separator: Separator = createSegmentSeparator(quarters)
    const separation: Separation = await separateTrack(track, separator)
    expect(separation.stems.bass).toEqual(stems.bass)
  })

  it('writes a separator of the four that says no stems and no steps', async () => {
    const separator: Separator = {
      sampleRate: 44100,
      separate: (channels) =>
        Promise.resolve({
          vocals: channels,
          drums: sound(3),
          bass: sound(5),
          other: sound(7),
        }),
    }
    const separation: Separation = await separateTrack(
      { channels: sound(9), sampleRate: 44100 },
      separator,
    )
    const names: readonly StemName[] = stemNames(separation)
    const all: readonly PartName[] = partNames(separation)
    expect(names).toEqual(['vocals', 'drums', 'bass', 'other'])
    expect(all).toEqual(['vocals', 'drums', 'bass', 'other', 'remainder'])
  })

  it('lays a separation written by hand, four keys and no names, and keeps its tracks by `PartName`', () => {
    // The tracks read the rate, the stems and the remainder, and nothing of a run's report.
    const separation: Omit<Separation, 'report'> = {
      sampleRate: 44100,
      stems: { vocals: sound(11), drums: sound(13), bass: sound(15), other: sound(17) },
      remainder: sound(19),
    }
    // The one cast here is the host's own line: it lays a separation it holds no report of.
    const laid = separationTracks(createScore(), separation as Separation, mockBuffers)
    const tracks: Record<PartName, { trackId: string }> = laid.parts
    expect(PART_NAMES.map((name) => tracks[name].trackId)).toEqual([...PART_NAMES])

    const whole: Separation = {
      ...separation,
      report: { remainderDb: -20, remainderPeak: 0.3, modelSampleRate: 44100, resampled: false },
    }
    const again: Record<PartName, { trackId: string; sourceId: string }> = separationTracks(
      createScore(),
      whole,
      mockBuffers,
    ).parts
    expect(again.remainder.sourceId).toBe('remainder')
  })

  it('does not take a separation of six names where one of the four is asked for', async () => {
    const six: Separator<StemName | 'guitar' | 'piano'> = {
      sampleRate: 44100,
      stems: ['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'],
      separate: (channels) =>
        Promise.resolve({
          vocals: channels,
          drums: sound(21),
          bass: sound(23),
          guitar: sound(25),
          piano: sound(27),
          other: sound(29),
        }),
    }
    const separation = await separateTrack({ channels: sound(31), sampleRate: 44100 }, six)
    const guitar: Channels = separation.stems.guitar
    // @ts-expect-error A separation of six names is not a separation of the four.
    const taken = ofTheFour(separation)
    expect(guitar).toHaveLength(2)
    expect(taken.names).toEqual(['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'])
  })
})
