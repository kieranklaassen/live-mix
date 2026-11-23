// A separation laid on a score: the one step that adds a track for each of
// its parts, the sound each track plays, and what a render is told so that
// the untouched tracks bounce back to the track. What the samples add up to
// is held in a real browser (browser-tests/specs/separation.spec.ts): here,
// what the score and the graph were told.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type OfflineContextFactory } from '../../core/render/OfflineRenderer'
import { ScoreDocument } from '../../score/ScoreDocument'
import { renderScore } from '../../score/renderScore'
import { createScore, defaultStrip, masterDestination } from '../../score/schema'
import {
  MockAudioBuffer,
  configureMocks,
  createMockOfflineContext,
  type MockOfflineAudioContext,
} from '../../testing'
import { partNames } from '../names'
import { separationTracks, type SeparationTracksOptions } from '../tracks'
import { PART_NAMES, SeparationError, type Channels, type Separation } from '../types'
import { differenceDb, noise, peak } from './support'

const mockBuffers: SeparationTracksOptions = {
  createBuffer: (channels, length, sampleRate) =>
    new MockAudioBuffer(channels, length, sampleRate) as unknown as AudioBuffer,
}

/** A separation whose parts are noise standing on a level: each starts and ends away from zero. */
function separation(frames: number, sampleRate = 44100, channelCount = 2): Separation {
  const part = (seed: number): Channels =>
    Array.from({ length: channelCount }, (_, channel) =>
      noise(frames, seed * 10 + channel).map((sample) => sample * 0.01 + 0.2),
    )
  return {
    sampleRate,
    stems: { vocals: part(1), drums: part(2), bass: part(3), other: part(4) },
    remainder: part(5),
    report: { remainderDb: -20, remainderPeak: 0.3, modelSampleRate: 44100, resampled: false },
  }
}

/** Six stems, as a model of six answers them. */
const SIX = ['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'] as const

/** Ten stems: the four with the vocals split in two and the drums in four, each split followed by what it left. */
const TEN = [
  'lead-vocals',
  'backing-vocals',
  'vocals',
  'kick',
  'snare',
  'toms',
  'cymbals',
  'drums',
  'bass',
  'other',
] as const

/**
 * A separation written by hand of the stems `names` and a remainder, with the
 * track they add up to. Each part is noise standing on a level, so it starts
 * and ends away from zero, and every sample is a whole number of 256ths, so
 * the parts add up in single precision with nothing rounded, in any order.
 */
function parted<Name extends string>(
  names: readonly Name[],
  frames = 1000,
): { parts: Separation<Name>; track: Channels } {
  const part = (seed: number): Channels =>
    [0, 1].map((channel) =>
      noise(frames, seed * 10 + channel).map((sample) => (Math.round(sample * 8) + 48) / 256),
    )
  const stems = {} as Record<Name, Channels>
  names.forEach((name, index) => {
    stems[name] = part(index + 1)
  })
  const remainder = part(names.length + 1)
  const track = remainder.map((channel, index) => {
    const sum = Float32Array.from(channel)
    for (const name of names) {
      stems[name][index].forEach((sample, frame) => {
        sum[frame] += sample
      })
    }
    return sum
  })
  return {
    parts: {
      sampleRate: 44100,
      names,
      stems,
      remainder,
      report: { remainderDb: -20, remainderPeak: 0.3, modelSampleRate: 44100, resampled: false },
    },
    track,
  }
}

/** A score that holds one audio track, `id`. */
function scoreWithTrack(id: string) {
  const score = createScore()
  score.tracks = [
    {
      kind: 'audio',
      id,
      name: 'Held',
      destination: masterDestination(),
      strip: defaultStrip(),
      clips: [],
    },
  ]
  return score
}

const MORE_PARTS = [
  { names: SIX, called: ['Vocals', 'Drums', 'Bass', 'Guitar', 'Piano', 'Other', 'Remainder'] },
  {
    names: TEN,
    called: [
      'Lead vocals',
      'Backing vocals',
      'Vocals',
      'Kick',
      'Snare',
      'Toms',
      'Cymbals',
      'Drums',
      'Bass',
      'Other',
      'Remainder',
    ],
  },
]

describe('a separation laid on a score', () => {
  it('adds five sources and five audio tracks, a clip on each, as one step', () => {
    const laid = separationTracks(createScore(), separation(44100), mockBuffers)
    const document = new ScoreDocument(createScore())
    document.apply(laid.operation)
    const { score } = document
    expect(score.sources.map((source) => source.id)).toEqual([...PART_NAMES])
    expect(score.tracks.map((track) => [track.id, track.name, track.kind])).toEqual([
      ['vocals', 'Vocals', 'audio'],
      ['drums', 'Drums', 'audio'],
      ['bass', 'Bass', 'audio'],
      ['other', 'Other', 'audio'],
      ['remainder', 'Remainder', 'audio'],
    ])
    for (const track of score.tracks) {
      if (track.kind !== 'audio') throw new Error('an audio track was added')
      expect(track.destination).toEqual(masterDestination())
      expect(track.strip).toEqual(defaultStrip())
      expect(track.clips).toHaveLength(1)
      expect(track.clips[0]).toMatchObject({
        sourceId: track.id,
        startSec: 0,
        offsetSec: 0,
        durationSec: 1,
        fadeInSec: 0,
        fadeOutSec: 0,
        gainDb: 0,
      })
    }
    for (const name of PART_NAMES) {
      expect(laid.parts[name]).toEqual({ trackId: name, sourceId: name })
    }

    document.undo()
    expect(document.score.tracks).toEqual([])
    expect(document.score.sources).toEqual([])
  })

  it('takes ids nothing in the score has, the same way for all five', () => {
    const score = createScore()
    score.sources = [{ id: 'drums', durationSec: 3 }]
    score.tracks = [
      {
        kind: 'audio',
        id: 'vocals',
        name: 'Lead',
        destination: masterDestination(),
        strip: defaultStrip({ level: 0.5 }),
        clips: [],
      },
    ]
    const document = new ScoreDocument(score)
    const first = separationTracks(document.score, separation(1000), mockBuffers)
    document.apply(first.operation)
    expect(first.parts.vocals).toEqual({ trackId: 'vocals-2', sourceId: 'vocals-2' })
    expect(first.parts.remainder).toEqual({ trackId: 'remainder-2', sourceId: 'remainder-2' })
    expect(document.score.tracks[0]).toMatchObject({ id: 'vocals', name: 'Lead' })
    expect(document.score.tracks[0].strip.level).toBe(0.5)

    const second = separationTracks(document.score, separation(1000), mockBuffers)
    document.apply(second.operation)
    expect(second.parts.bass).toEqual({ trackId: 'bass-3', sourceId: 'bass-3' })
    expect(document.score.tracks).toHaveLength(11)
    expect(new Set(document.score.tracks.map((track) => track.id)).size).toBe(11)
  })

  it('gives each source its part’s sound with 20 ms of silence after it', () => {
    const parts = separation(4410)
    const laid = separationTracks(createScore(), parts, mockBuffers)
    expect([...laid.buffers.keys()]).toEqual([...PART_NAMES])
    const bass = laid.buffers.get('bass')
    expect(bass).toMatchObject({ numberOfChannels: 2, sampleRate: 44100, length: 4410 + 882 })
    expect(bass?.getChannelData(1).subarray(0, 4410)).toEqual(parts.stems.bass[1])
    expect(peak(bass?.getChannelData(1).subarray(4410) ?? new Float32Array(1).fill(1))).toBe(0)
    expect(laid.buffers.get('remainder')?.getChannelData(0).subarray(0, 4410)).toEqual(
      parts.remainder[0],
    )
  })

  it('resolves its own sources and no other', () => {
    const laid = separationTracks(createScore(), separation(1000), mockBuffers)
    expect(laid.resolveSource({ id: 'drums' })).toBe(laid.buffers.get('drums'))
    expect(laid.resolveSource({ id: 'kick' })).toBeUndefined()
  })

  it('says how to render so that the bounce has the track’s frames', () => {
    for (const sampleRate of [44100, 48000]) {
      for (const frames of [1, 3, 1000, 44100, 48000, 343980, 10_584_003, 11_520_001]) {
        // Every part the same silence: only the length is looked at.
        const silent = [new Float32Array(frames), new Float32Array(frames)]
        const { render } = separationTracks(
          createScore(),
          {
            ...separation(1),
            sampleRate,
            stems: { vocals: silent, drums: silent, bass: silent, other: silent },
            remainder: silent,
          },
          { createBuffer: () => ({ copyToChannel() {} }) as unknown as AudioBuffer },
        )
        expect(Math.ceil(render.durationSec * render.sampleRate)).toBe(frames)
        expect(render).toMatchObject({ sampleRate, numberOfChannels: 2 })
      }
    }
  })

  it('renders a mono separation in one channel', () => {
    const laid = separationTracks(createScore(), separation(1000, 48000, 1), mockBuffers)
    expect(laid.render.numberOfChannels).toBe(1)
    expect(laid.buffers.get('vocals')?.numberOfChannels).toBe(1)
  })

  it('says so when there is nothing to make a buffer with', () => {
    expect(() => separationTracks(createScore(), separation(1000))).toThrow(/createBuffer/)
  })

  for (const { names, called } of MORE_PARTS) {
    it(`lays ${names.length + 1} parts as that many tracks, the stems in the separation’s order and the remainder last, as one step`, () => {
      const { parts } = parted<string>(names)
      const order = [...names, 'remainder']
      const laid = separationTracks(createScore(), parts, mockBuffers)
      expect(laid.operation).toMatchObject({ type: 'batch', label: 'Add stems' })
      const document = new ScoreDocument(createScore())
      document.apply(laid.operation)
      const { score } = document
      expect(score.sources.map((source) => source.id)).toEqual(order)
      expect(score.tracks.map((track) => [track.id, track.name, track.kind])).toEqual(
        order.map((id, index) => [id, called[index], 'audio']),
      )
      expect([...laid.buffers.keys()]).toEqual(order)
      // The order a caller reads is the order the tracks were laid in.
      expect(partNames(parts)).toEqual(order)
      for (const name of partNames(parts)) {
        expect(laid.parts[name]).toEqual({ trackId: name, sourceId: name })
      }

      document.undo()
      expect(document.score.tracks).toEqual([])
      expect(document.score.sources).toEqual([])
    })
  }

  it('refuses a separation written by hand with six stems and no names, by the fifth, and lays nothing', () => {
    const four = separation(1000)
    const six = {
      ...four,
      stems: { ...four.stems, guitar: four.stems.other, piano: four.stems.other },
    }
    const createBuffer = vi.fn(mockBuffers.createBuffer)
    const lay = () => separationTracks(createScore(), six, { createBuffer })
    expect(lay).toThrow(SeparationError)
    expect(lay).toThrow(/\bguitar\b/)
    expect(createBuffer).not.toHaveBeenCalled()
  })

  it('puts one suffix on every part where the score holds the id of one', () => {
    const document = new ScoreDocument(scoreWithTrack('kick'))
    const laid = separationTracks(document.score, parted(['kick', 'snare']).parts, mockBuffers)
    document.apply(laid.operation)
    expect(laid.parts).toEqual({
      kick: { trackId: 'kick-2', sourceId: 'kick-2' },
      snare: { trackId: 'snare-2', sourceId: 'snare-2' },
      remainder: { trackId: 'remainder-2', sourceId: 'remainder-2' },
    })
    expect(document.score.tracks.map((track) => track.id)).toEqual([
      'kick',
      'kick-2',
      'snare-2',
      'remainder-2',
    ])
  })

  it('puts the suffix on every part where a stem has the name a score keeps for its master', () => {
    const laid = separationTracks(createScore(), parted(['vocals', 'master']).parts, mockBuffers)
    const document = new ScoreDocument(createScore())
    document.apply(laid.operation)
    expect(document.score.tracks.map((track) => track.id)).toEqual([
      'vocals-2',
      'master-2',
      'remainder-2',
    ])
    expect(document.score.sources.map((source) => source.id)).toEqual([
      'vocals-2',
      'master-2',
      'remainder-2',
    ])
    expect(laid.parts.master).toEqual({ trackId: 'master-2', sourceId: 'master-2' })
  })

  it('gives stems named vocals and vocals-2 ids of their own on a score that holds vocals', () => {
    const document = new ScoreDocument(scoreWithTrack('vocals'))
    const laid = separationTracks(document.score, parted(['vocals', 'vocals-2']).parts, mockBuffers)
    document.apply(laid.operation)
    expect(laid.parts).toEqual({
      vocals: { trackId: 'vocals-2', sourceId: 'vocals-2' },
      'vocals-2': { trackId: 'vocals-2-2', sourceId: 'vocals-2-2' },
      remainder: { trackId: 'remainder-2', sourceId: 'remainder-2' },
    })
    expect(document.score.tracks.map((track) => track.id)).toEqual([
      'vocals',
      'vocals-2',
      'vocals-2-2',
      'remainder-2',
    ])
  })

  it('refuses a part of another length or channel count than the remainder, by its name', () => {
    const whole = separation(1000)
    const createBuffer = vi.fn(mockBuffers.createBuffer)
    const withStem = (name: 'vocals' | 'drums' | 'bass' | 'other', channels: Channels) => () =>
      separationTracks(
        createScore(),
        { ...whole, stems: { ...whole.stems, [name]: channels } },
        { createBuffer },
      )
    const [left, right] = whole.stems.other

    const short = withStem('bass', [left.subarray(0, 999), right.subarray(0, 999)])
    expect(short).toThrow(SeparationError)
    expect(short).toThrow(/\bbass\b.*\b999\b.*\b1000\b/)
    // One channel of two is enough.
    const long = withStem('drums', [left, new Float32Array(1001)])
    expect(long).toThrow(/\bdrums\b.*\b1001\b.*\b1000\b/)

    const mono = withStem('other', [left])
    expect(mono).toThrow(SeparationError)
    expect(mono).toThrow(/\bother\b.*\b1\b.*\b2\b/)
    const three = withStem('vocals', [left, right, left])
    expect(three).toThrow(/\bvocals\b.*\b3\b.*\b2\b/)

    expect(createBuffer).not.toHaveBeenCalled()
  })

  it('names a track after its stem, with a capital first letter and a space for each hyphen', () => {
    const laid = separationTracks(
      createScore(),
      parted(['guitar', 'lead-vocals']).parts,
      mockBuffers,
    )
    const document = new ScoreDocument(createScore())
    document.apply(laid.operation)
    expect(document.score.tracks.map((track) => track.name)).toEqual([
      'Guitar',
      'Lead vocals',
      'Remainder',
    ])
  })

  describe('rendered', () => {
    let contexts: MockOfflineAudioContext[] = []
    const createContext: OfflineContextFactory = (options) => {
      const ctx = createMockOfflineContext(options)
      contexts.push(ctx)
      return ctx as unknown as ReturnType<OfflineContextFactory>
    }

    /**
     * The bounce of a context that adds up what it was told to play: every
     * source's buffer from the frame it was started at. A level is not in the
     * sum, so a case that reads it holds the levels beside it.
     */
    function played(ctx: MockOfflineAudioContext): MockAudioBuffer {
      const bounce = new MockAudioBuffer(ctx.numberOfChannels, ctx.length, ctx.sampleRate)
      for (const { buffer, startCalls } of ctx.sources) {
        if (buffer === null) continue
        for (const [when, offset] of startCalls.calls as number[][]) {
          const at = Math.round(when * ctx.sampleRate)
          const from = Math.round(offset * ctx.sampleRate) - at
          for (let channel = 0; channel < ctx.numberOfChannels; channel += 1) {
            const sound = buffer.getChannelData(channel)
            const sum = bounce.getChannelData(channel)
            for (let frame = at; frame < sum.length && from + frame < sound.length; frame += 1) {
              sum[frame] += sound[from + frame]
            }
          }
        }
      }
      return bounce
    }
    const createSummingContext: OfflineContextFactory = (options) => {
      const ctx = createMockOfflineContext({ ...options, render: played })
      contexts.push(ctx)
      return ctx as unknown as ReturnType<OfflineContextFactory>
    }

    beforeEach(() => {
      contexts = []
      vi.useFakeTimers()
      configureMocks({ advanceTimers: vi.advanceTimersByTimeAsync })
    })
    afterEach(() => {
      configureMocks({})
      vi.useRealTimers()
    })

    /** What each voice's level was told up to the end of the track, once the tracks are rendered. */
    async function told(
      laid: ReturnType<typeof separationTracks>,
      endSec: number,
      context = createContext,
    ) {
      const document = new ScoreDocument(createScore())
      document.apply(laid.operation)
      const { buffer } = await renderScore(document.score, {
        ...laid.render,
        createContext: context,
        renderer: { resolveSource: laid.resolveSource },
      })
      const snapshot = contexts[0].scheduleSnapshot()
      return {
        bounce: buffer,
        sources: snapshot.sources,
        levels: snapshot.params.map((param) =>
          param.events
            .filter((event) => (event.args.at(-1) as number) <= endSec)
            .map((event) => `${event.method} ${String(event.args[0])}`),
        ),
      }
    }

    it('plays each part from the start at full level to the end of the track', async () => {
      const laid = separationTracks(createScore(), separation(44100), mockBuffers)
      const { sources, levels } = await told(laid, 1)
      expect(sources).toHaveLength(5)
      for (const source of sources) {
        expect(source.start[0].slice(0, 2)).toEqual([0, 0])
        expect(source.bufferLength).toBe(44100 + 882)
      }
      // Held at 1 from the first frame to the last: whatever a voice is told after that is past the bounce.
      expect(levels).toEqual(new Array(5).fill(['setValueAtTime 1', 'setValueAtTime 1']))
    })

    for (const { names } of MORE_PARTS) {
      const count = names.length + 1
      it(`plays ${count} parts from the start at full level, and what is played adds up to the track`, async () => {
        const { parts, track } = parted<string>(names, 44100)
        const laid = separationTracks(createScore(), parts, mockBuffers)
        const { sources, levels, bounce } = await told(laid, 1, createSummingContext)
        expect(sources).toHaveLength(count)
        for (const source of sources) {
          expect(source.start[0].slice(0, 2)).toEqual([0, 0])
          expect(source.bufferLength).toBe(44100 + 882)
        }
        expect(levels).toEqual(new Array(count).fill(['setValueAtTime 1', 'setValueAtTime 1']))
        expect(bounce).toMatchObject({ numberOfChannels: 2, length: 44100, sampleRate: 44100 })
        for (const channel of [0, 1]) {
          // Each part stands near 0.19, so a track of seven or more is past full scale and far from silence.
          expect(peak(track[channel])).toBeGreaterThan(1)
          expect(differenceDb(bounce.getChannelData(channel), track[channel])).toBe(-Infinity)
        }
      })
    }

    it('would be eased in without the silence after it, which is what the silence is for', async () => {
      // The same parts in buffers that end where the sound does. A part that
      // stands on a level then starts and ends on the same step, as a sound
      // made to loop does, and its voice comes up from nothing.
      const parts = separation(44100)
      const laid = separationTracks(createScore(), parts, mockBuffers)
      const bare = new Map<string, AudioBuffer>(
        PART_NAMES.map((name) => {
          const channels = name === 'remainder' ? parts.remainder : parts.stems[name]
          const buffer = new MockAudioBuffer(2, 44100, 44100)
          channels.forEach((channel, index) => buffer.copyToChannel(channel, index))
          return [name, buffer as unknown as AudioBuffer]
        }),
      )
      const { levels } = await told({ ...laid, resolveSource: (source) => bare.get(source.id) }, 1)
      expect(levels[0]).toContain('linearRampToValueAtTime 1')
      expect(levels[0]).toContain('setValueAtTime 0')
    })
  })
})
