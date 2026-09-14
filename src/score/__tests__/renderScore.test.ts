// AE6, score-driven: the same document loaded on a live engine (real clock,
// timer-driven scheduler and automation) and bounced through `renderScore`
// must hand the graph the same source starts/stops and AudioParam events.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MockAudioBuffer,
  advance,
  asAudioContext,
  configureMocks,
  createMockContext,
  createMockOfflineContext,
  scheduleSnapshotOf,
  type MockOfflineAudioContext,
  type ScheduleSnapshot,
} from '../../testing'
import { type OfflineContextFactory } from '../../core/render/OfflineRenderer'
import { createEngine } from '../../core/Engine'
import { loadScore } from '../loadScore'
import { renderScore, renderScoreStems, renderableScore } from '../renderScore'
import {
  createScore,
  defaultStrip,
  groupDestination,
  masterDestination,
  type Score,
} from '../schema'
import { clip } from './fixtures'

const SAMPLE_RATE = 48000

/** Two audio tracks through a group with a fader lane, a muted pad and a live voice (dropped offline). */
function arrangement(): Score {
  const score = createScore({ id: 'bounce', name: 'Bounce' })
  score.sources = [
    { id: 'a', url: '/a.mp3', durationSec: 10 },
    { id: 'b', url: '/b.mp3', durationSec: 10 },
  ]
  score.groups = [
    { id: 'music', name: 'Music', destination: masterDestination(), strip: defaultStrip() },
  ]
  score.tracks = [
    {
      kind: 'audio',
      id: 'kick',
      name: 'Kick',
      destination: groupDestination('music'),
      strip: defaultStrip({ level: 0.8, pan: -0.2 }),
      lookaheadSec: 1,
      clips: [clip('k1', 'a', 0), clip('k2', 'b', 1.5)],
    },
    {
      kind: 'audio',
      id: 'pad',
      name: 'Pad',
      destination: masterDestination(),
      strip: defaultStrip({ mute: true }),
      lookaheadSec: 1,
      clips: [clip('p1', 'a', 2, { durationSec: 3, fadeCurve: 'linear', gainDb: 0 })],
    },
    {
      kind: 'live',
      id: 'voice',
      name: 'Voice',
      destination: masterDestination(),
      strip: defaultStrip(),
    },
  ]
  score.lanes = [
    {
      id: 'kick-level',
      target: { kind: 'strip', owner: 'kick', param: 'level' },
      breakpoints: [
        { timeSec: 0, value: 0.8 },
        { timeSec: 3, value: 0.2 },
      ],
    },
  ]
  score.master = { level: 0.9, inserts: [] }
  return score
}

function buffer(): AudioBuffer {
  return new MockAudioBuffer(2, 10 * SAMPLE_RATE, SAMPLE_RATE) as unknown as AudioBuffer
}

/** Score sources resolve to preloaded mock buffers (nothing to fetch). */
function resolveSource() {
  return buffer()
}

let contexts: MockOfflineAudioContext[] = []
const factory: OfflineContextFactory = ({ numberOfChannels, length, sampleRate }) => {
  const ctx = createMockOfflineContext({ numberOfChannels, length, sampleRate })
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

async function liveSnapshot(score: Score, seconds: number): Promise<ScheduleSnapshot> {
  const live = createMockContext({ sampleRate: SAMPLE_RATE })
  const engine = createEngine({ context: asAudioContext(live), tickMs: 50 })
  const renderer = loadScore(engine, renderableScore(score), { resolveSource })
  await renderer.whenIdle()
  // Live, an app preloads before pressing play; a decode still in flight at a
  // clip's start is a missed start (ambient-live semantics). Offline, the
  // renderer waits for decodes itself, so preload here to compare like with like.
  for (const source of score.sources) await engine.samples.load(source.id, buffer())
  engine.transport.start(0)
  await advance(live, seconds)
  const snapshot = scheduleSnapshotOf(live)
  engine.dispose()
  return snapshot
}

describe('renderScore', () => {
  it('renders a score offline with the same graph commands as the live engine (AE6)', async () => {
    const score = arrangement()
    const live = await liveSnapshot(score, 5)

    const result = await renderScore(score, {
      durationSec: 4,
      sampleRate: SAMPLE_RATE,
      tickSec: 0.05,
      createContext: factory,
      renderer: { resolveSource },
    })
    const offline = contexts[0].scheduleSnapshot()

    expect(offline.sources.length).toBe(3)
    expect(offline.sources).toEqual(live.sources)
    expect(offline.params).toEqual(live.params)
    expect(result.audio.channels[0]).toHaveLength(4 * SAMPLE_RATE)
    expect(result.engine.liveInputs).toEqual([])
    expect(result.engine.tempo.tempoSegments).toMatchObject(score.tempo)
  })

  it('is deterministic across renders and drops live inputs and element tracks', async () => {
    const score = arrangement()
    score.elementTracks = [
      {
        id: 'bed',
        name: 'Bed',
        destination: masterDestination(),
        clips: [clip('bed-1', 'a', 0)],
      },
    ]
    const renderable = renderableScore(score)
    expect(renderable.tracks.map((track) => track.id)).toEqual(['kick', 'pad'])
    expect(renderable.elementTracks).toEqual([])

    await renderScore(score, {
      durationSec: 4,
      createContext: factory,
      renderer: { resolveSource },
    })
    await renderScore(score, {
      durationSec: 4,
      createContext: factory,
      renderer: { resolveSource },
    })
    expect(contexts[0].scheduleSnapshot()).toEqual(contexts[1].scheduleSnapshot())
    expect(contexts[0].scheduleSnapshot().sources.length).toBe(3)
  })

  it('renders stems per score track id', async () => {
    const stems = await renderScoreStems(arrangement(), {
      durationSec: 2,
      createContext: factory,
      stems: ['kick', 'pad'],
      renderer: { resolveSource },
    })
    expect(Object.keys(stems)).toEqual(['master', 'kick', 'pad'])
    expect(stems.kick.engine.track('pad').strip.audible).toBe(false)
    expect(stems.kick.engine.track('kick').strip.audible).toBe(true)
  })

  it('surfaces render failures instead of swallowing them', async () => {
    const score = arrangement()
    score.tracks[0].strip.inserts.push({
      id: 'ghost',
      deviceId: 'no-such-device',
      params: {},
      bypass: false,
    })
    await expect(
      renderScore(score, { durationSec: 1, createContext: factory, renderer: { resolveSource } }),
    ).rejects.toThrow()
  })
})
