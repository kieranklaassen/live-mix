// A separation laid on a score: the one step that adds its five tracks, the
// sound each track plays, and what a render is told so that the untouched
// tracks bounce back to the track. What the samples add up to is held in a
// real browser (browser-tests/specs/separation.spec.ts): here, what the
// score and the graph were told.

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
import { separationTracks, type SeparationTracksOptions } from '../tracks'
import { PART_NAMES, type Channels, type Separation } from '../types'
import { noise, peak } from './support'

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
          { ...separation(1), sampleRate, remainder: silent },
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

  describe('rendered', () => {
    let contexts: MockOfflineAudioContext[] = []
    const createContext: OfflineContextFactory = (options) => {
      const ctx = createMockOfflineContext(options)
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
    async function told(laid: ReturnType<typeof separationTracks>, endSec: number) {
      const document = new ScoreDocument(createScore())
      document.apply(laid.operation)
      await renderScore(document.score, {
        ...laid.render,
        createContext,
        renderer: { resolveSource: laid.resolveSource },
      })
      const snapshot = contexts[0].scheduleSnapshot()
      return {
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
