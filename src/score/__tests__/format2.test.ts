// Format 2 (U33): element tracks and the tempo map — schema, migration,
// operations and the renderer wiring.

import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  asMediaElement,
  createMockContext,
  createMockMediaElement,
} from '../../testing'
import { ElementSource } from '../../core/sources/ElementSource'
import { createEngine } from '../../core/Engine'
import { loadScore } from '../loadScore'
import { apply, invert, type Operation } from '../operations'
import {
  SCORE_FORMAT_VERSION,
  createScore,
  groupDestination,
  masterDestination,
  migrateScore,
  parseScore,
  serializeScore,
  validateScore,
  type Score,
  type ScoreElementTrack,
} from '../schema'
import { ScoreDocument } from '../ScoreDocument'
import { clip, demoScore } from './fixtures'

function bed(overrides: Partial<ScoreElementTrack> = {}): ScoreElementTrack {
  return {
    id: 'bed',
    name: 'Dawn bed',
    destination: masterDestination(),
    clips: [clip('bed-1', 'a', 0, { durationSec: 8 })],
    ...overrides,
  }
}

function issuesOf(score: unknown): string[] {
  return validateScore(score).map((issue) => `${issue.path}: ${issue.message}`)
}

describe('format 2 schema', () => {
  it('createScore carries a default tempo and no element tracks', () => {
    const score = createScore()
    // Format 3 (U31) sits on top of this; the format-2 fields are unchanged.
    expect(score.format).toBe(SCORE_FORMAT_VERSION)
    expect(SCORE_FORMAT_VERSION).toBeGreaterThanOrEqual(2)
    expect(score.tempo).toEqual([{ atSec: 0, bpm: 120 }])
    expect(score.elementTracks).toEqual([])
    expect(issuesOf(score)).toEqual([])
  })

  it('migrates a format-1 document by adding the new fields', () => {
    const legacy = { ...demoScore(), format: 1 } as Record<string, unknown>
    delete legacy.tempo
    delete legacy.elementTracks
    const migrated = migrateScore(legacy) as Score
    expect(migrated.format).toBe(SCORE_FORMAT_VERSION)
    expect(migrated.tempo).toEqual([{ atSec: 0, bpm: 120 }])
    expect(migrated.elementTracks).toEqual([])
    expect(issuesOf(migrated)).toEqual([])
    expect(parseScore(JSON.stringify(legacy)).id).toBe('demo')
  })

  it('validates the tempo map', () => {
    const score = demoScore()
    score.tempo = []
    expect(issuesOf(score)).toEqual(['tempo: expected at least one segment'])
    score.tempo = [{ atSec: 1, bpm: 120 }]
    expect(issuesOf(score)).toEqual(['tempo[0].atSec: the first segment starts at 0'])
    score.tempo = [
      { atSec: 0, bpm: 120 },
      { atSec: 4, bpm: 0 },
      { atSec: 4, bpm: 90, beatsPerBar: 3.5 },
    ]
    expect(issuesOf(score)).toEqual([
      'tempo[1].bpm: expected > 0',
      'tempo[2].atSec: segments must ascend',
      'tempo[2].beatsPerBar: expected an integer',
    ])
    score.tempo = [
      { atSec: 0, bpm: 120 },
      { atSec: 8, bpm: 90, beatsPerBar: 3 },
    ]
    expect(issuesOf(score)).toEqual([])
  })

  it('validates element tracks: streamable sources, unique ids, destinations', () => {
    const score = demoScore()
    score.elementTracks = [bed()]
    expect(issuesOf(score)).toEqual([])

    score.elementTracks = [bed({ clips: [clip('x', 'b', 0)] })]
    expect(issuesOf(score)).toEqual([
      'elementTracks[0].clips[0].sourceId: source "b" has no url to stream',
    ])

    score.elementTracks = [bed({ id: 'kick' })]
    expect(issuesOf(score)).toContain('elementTracks[0].id: "kick" is also a strip owner')

    score.elementTracks = [bed({ destination: groupDestination('nope') })]
    expect(issuesOf(score).some((issue) => issue.startsWith('elementTracks[0].destination'))).toBe(
      true,
    )

    score.elementTracks = [bed(), bed()]
    expect(issuesOf(score).some((issue) => issue.includes('elementTracks[1].id'))).toBe(true)
  })

  it('normalises and serialises stably (sorted clips and tempo segments)', () => {
    const score = demoScore()
    score.tempo = [
      { atSec: 8, bpm: 90, beatsPerBar: 3 },
      { atSec: 0, bpm: 120 },
    ]
    score.elementTracks = [
      bed({ clips: [clip('late', 'a', 4, { durationSec: 2 }), clip('early', 'a', 0)] }),
    ]
    const parsed = parseScore(serializeScore(score))
    expect(parsed.tempo).toEqual([
      { atSec: 0, bpm: 120 },
      { atSec: 8, bpm: 90, beatsPerBar: 3 },
    ])
    expect(parsed.elementTracks[0].clips.map((c) => c.id)).toEqual(['early', 'late'])
    expect(serializeScore(parsed)).toBe(serializeScore(parseScore(serializeScore(parsed))))
  })
})

describe('format 2 operations', () => {
  it('tempo.set replaces the map, validates it and inverts to the previous map', () => {
    const score = demoScore()
    const op: Operation = {
      type: 'tempo.set',
      segments: [
        { atSec: 16, bpm: 100 },
        { atSec: 0, bpm: 128 },
      ],
    }
    const inverse = invert(score, op)
    const next = apply(score, op)
    expect(next.tempo).toEqual([
      { atSec: 0, bpm: 128 },
      { atSec: 16, bpm: 100 },
    ])
    expect(apply(next, inverse).tempo).toEqual(score.tempo)
    expect(() => apply(score, { type: 'tempo.set', segments: [] })).toThrow(/at least one/)
    expect(() => apply(score, { type: 'tempo.set', segments: [{ atSec: 2, bpm: 120 }] })).toThrow(
      /start at 0/,
    )
    expect(() =>
      apply(score, {
        type: 'tempo.set',
        segments: [
          { atSec: 0, bpm: 120 },
          { atSec: 0, bpm: 100 },
        ],
      }),
    ).toThrow(/ascend/)
    expect(() => apply(score, { type: 'tempo.set', segments: [{ atSec: 0, bpm: -1 }] })).toThrow(
      /bpm/,
    )
    expect(() =>
      apply(score, { type: 'tempo.set', segments: [{ atSec: 0, bpm: 120, beatsPerBar: 0 }] }),
    ).toThrow(/beatsPerBar/)
  })

  it('element track add / setClips / route / remove apply and invert', () => {
    const score = demoScore()
    const add: Operation = { type: 'elementTrack.add', track: bed() }
    const withBed = apply(score, add)
    expect(withBed.elementTracks.map((track) => track.id)).toEqual(['bed'])
    expect(apply(withBed, invert(score, add)).elementTracks).toEqual([])

    expect(() => apply(withBed, add)).toThrow(/already/)
    expect(() => apply(score, { type: 'elementTrack.add', track: bed({ id: 'kick' }) })).toThrow(
      /already a track/,
    )
    expect(() =>
      apply(score, { type: 'elementTrack.add', track: bed({ clips: [clip('x', 'b', 0)] }) }),
    ).toThrow(/no url/)
    expect(() =>
      apply(withBed, { type: 'track.add', track: { ...score.tracks[0], id: 'bed' } }),
    ).toThrow(/already an element track/)

    const setClips: Operation = {
      type: 'elementTrack.setClips',
      id: 'bed',
      clips: [clip('z', 'a', 6), clip('y', 'a', 2)],
    }
    const reclipped = apply(withBed, setClips)
    expect(reclipped.elementTracks[0].clips.map((c) => c.id)).toEqual(['y', 'z'])
    expect(apply(reclipped, invert(withBed, setClips)).elementTracks[0].clips).toEqual(
      withBed.elementTracks[0].clips,
    )

    const route: Operation = {
      type: 'elementTrack.route',
      id: 'bed',
      destination: groupDestination('drums'),
    }
    const routed = apply(withBed, route)
    expect(routed.elementTracks[0].destination).toEqual(groupDestination('drums'))
    expect(apply(routed, invert(withBed, route)).elementTracks[0].destination).toEqual(
      masterDestination(),
    )
    expect(() =>
      apply(withBed, { type: 'elementTrack.route', id: 'bed', destination: groupDestination('x') }),
    ).toThrow()

    const remove: Operation = { type: 'elementTrack.remove', id: 'bed' }
    const removed = apply(routed, remove)
    expect(removed.elementTracks).toEqual([])
    expect(apply(removed, invert(routed, remove)).elementTracks).toEqual(routed.elementTracks)
    expect(() => apply(score, remove)).toThrow(/no element track/)
  })

  it('removing a group reroutes element tracks and the inverse restores them', () => {
    const score = apply(demoScore(), {
      type: 'elementTrack.add',
      track: bed({ destination: groupDestination('drums') }),
    })
    const remove: Operation = { type: 'group.remove', id: 'drums' }
    const inverse = invert(score, remove)
    const without = apply(score, remove)
    expect(without.elementTracks[0].destination).toEqual(masterDestination())
    const restored = apply(without, inverse)
    expect(restored.elementTracks[0].destination).toEqual(groupDestination('drums'))
  })

  it('a source streamed by an element track cannot be removed', () => {
    const base = demoScore()
    base.sources.push({ id: 'c', url: '/c.mp3' })
    const score = apply(base, {
      type: 'elementTrack.add',
      track: bed({ clips: [clip('bed-c', 'c', 0)] }),
    })
    expect(() => apply(score, { type: 'source.remove', id: 'c' })).toThrow(/element track "bed"/)
  })
})

describe('format 2 rendering', () => {
  async function rig(score: Score) {
    const ctx = createMockContext({ sampleRate: 48000 })
    const engine = createEngine({
      context: asAudioContext(ctx),
      setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
      clearIntervalFn: () => {},
    })
    const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
    await engine.samples.load('a', buffer)
    await engine.samples.load('b', buffer)
    const document = new ScoreDocument(score, { now: () => 0 })
    const created: string[] = []
    const renderer = loadScore(engine, document, {
      createElementSource: (source, context) => {
        created.push(source.id)
        return new ElementSource(context, {
          id: source.id,
          url: source.url ?? '',
          createAudioElement: () => asMediaElement(createMockMediaElement({ duration: 600 })),
        })
      },
    })
    await renderer.whenIdle()
    const edit = async (...ops: Operation[]) => {
      for (const op of ops) document.apply(op)
      await renderer.whenIdle()
    }
    return { ctx, engine, renderer, edit, created }
  }

  it('creates element tracks with their clips and destination, keeps engine.tempo in step', async () => {
    const score = demoScore()
    score.tempo = [
      { atSec: 0, bpm: 90 },
      { atSec: 10, bpm: 140, beatsPerBar: 3 },
    ]
    score.elementTracks = [bed({ destination: groupDestination('drums'), lookaheadSec: 1.5 })]
    const { engine, renderer, edit } = await rig(score)

    expect(engine.tempo.tempoSegments).toMatchObject(score.tempo)
    expect(engine.tempo.secondsToBeats(10)).toBeCloseTo(15)
    const live = renderer.elementTrack('bed')
    expect(engine.elementTracks).toEqual([live])
    expect(live.lookaheadSec).toBe(1.5)
    expect(live.preloadSec).toBe(1.5)
    expect(live.clips.all().map((c) => c.id)).toEqual(['bed-1'])

    await edit({ type: 'tempo.set', segments: [{ atSec: 0, bpm: 60 }] })
    expect(engine.tempo.tempoSegments).toMatchObject([{ atSec: 0, bpm: 60 }])

    await edit({ type: 'elementTrack.setClips', id: 'bed', clips: [clip('n', 'a', 3)] })
    expect(
      renderer
        .elementTrack('bed')
        .clips.all()
        .map((c) => c.id),
    ).toEqual(['n'])
    expect(renderer.elementTrack('bed')).toBe(live)

    // A destination change rebuilds the track (no strip to re-route).
    await edit({ type: 'elementTrack.route', id: 'bed', destination: masterDestination() })
    expect(renderer.elementTrack('bed')).not.toBe(live)
    expect(engine.elementTracks).toHaveLength(1)

    await edit({ type: 'elementTrack.remove', id: 'bed' })
    expect(engine.elementTracks).toEqual([])
    expect(() => renderer.elementTrack('bed')).toThrow(/no element track/)
  })

  it('streams clips through the injected element source and tears down on dispose', async () => {
    const score = demoScore()
    score.elementTracks = [bed()]
    const { engine, renderer, created } = await rig(score)
    const live = renderer.elementTrack('bed')
    // The scheduler asks the track for a start; the track resolves the source through the renderer.
    const scheduled = live.playback.schedule(
      { clipId: 'bed-1', iteration: 0, startSec: 0 },
      engine.now() + 0.1,
    )
    expect(scheduled).toBe(true)
    expect(created).toEqual(['a'])
    expect(live.source('a')?.url).toBe('/a.mp3')
    renderer.dispose()
    expect(engine.elementTracks).toEqual([])
  })
})
