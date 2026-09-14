// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MockAudioBuffer } from '../../testing'
import { Session } from '../../core/session/Session'
import { defaultSlot, type SlotClip } from '../../core/session/Slot'
import { loadScore } from '../../score/loadScore'
import { createScore, defaultStrip, masterDestination, type Score } from '../../score/schema'
import { ScoreDocument } from '../../score/ScoreDocument'
import { useSession, useSlot } from '../hooks/useSession'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

function slotClip(sourceId: string, overrides: Partial<SlotClip> = {}): SlotClip {
  return {
    sourceId,
    offsetSec: 0,
    durationSec: 4,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
    ...overrides,
  }
}

function gridScore(): Score {
  const score = createScore({ id: 'set' })
  score.sources = [{ id: 'a', durationSec: 10 }]
  score.tracks = [
    {
      kind: 'audio',
      id: 'kick',
      name: 'Kick',
      destination: masterDestination(),
      strip: defaultStrip(),
      clips: [],
    },
    {
      kind: 'audio',
      id: 'pad',
      name: 'Pad',
      destination: masterDestination(),
      strip: defaultStrip(),
      clips: [],
    },
    {
      kind: 'live',
      id: 'voice',
      name: 'Voice',
      destination: masterDestination(),
      strip: defaultStrip(),
    },
  ]
  score.scenes = [
    { id: 'verse', name: 'Verse' },
    { id: 'chorus', name: 'Chorus' },
  ]
  score.slots = [
    defaultSlot({ id: 'kv', track: 'kick', scene: 'verse', clip: slotClip('a', { loop: true }) }),
    defaultSlot({
      id: 'pv',
      track: 'pad',
      scene: 'verse',
      clip: slotClip('a'),
      launchMode: 'toggle',
    }),
    defaultSlot({ id: 'pc', track: 'pad', scene: 'chorus', clip: null }),
  ]
  return score
}

interface Rig extends TestEngine {
  document: ScoreDocument
  session: Session
  advance: (sec: number) => Promise<void>
}

async function rig(): Promise<Rig> {
  const fixture = createTestEngine()
  const buffer = new MockAudioBuffer(2, 48_000 * 10, 48_000) as unknown as AudioBuffer
  await fixture.engine.samples.load('a', buffer)
  const document = new ScoreDocument(gridScore(), { now: () => 0 })
  const renderer = loadScore(fixture.engine, document)
  await renderer.whenIdle()
  const session = new Session({ document, engine: fixture.engine })
  const advance = async (sec: number): Promise<void> => {
    await renderer.whenIdle()
    fixture.ctx.advanceClock(sec)
    fixture.engine.scheduler.tick('timer')
    await renderer.whenIdle()
  }
  return { ...fixture, document, session, advance }
}

describe('useSession', () => {
  it('lays the grid out as scenes × audio tracks with cell states, and follows launches', async () => {
    const { engine, session, advance } = await rig()
    const { result } = renderHook(() => useSession(session))
    expect(result.current.scenes.map((scene) => scene.id)).toEqual(['verse', 'chorus'])
    expect(result.current.tracks.map((track) => track.id)).toEqual(['kick', 'pad'])
    expect(result.current.quantize).toBe('bar')
    expect(result.current.cells.map((row) => row.map((cell) => cell.state))).toEqual([
      ['stopped', 'stopped'],
      ['empty', 'empty'],
    ])
    expect(result.current.cells[1][0].slot).toBeNull()
    expect(result.current.cells[1][1].slot?.id).toBe('pc')
    expect(result.current.statuses.map((status) => status.slotId)).toEqual(['kv', 'pv', 'pc'])

    engine.transport.start()
    await act(() => advance(7.9))
    act(() => result.current.launchScene('verse'))
    expect(result.current.cells[0].map((cell) => cell.state)).toEqual(['queued', 'queued'])
    await act(() => advance(0.2))
    expect(result.current.cells[0].map((cell) => cell.state)).toEqual(['playing', 'playing'])
    expect(result.current.cells[0][0].status).toMatchObject({ startSec: 8, clipId: 'kv@1' })

    act(() => result.current.stopTrack('pad'))
    expect(result.current.cells[0][1].status?.stopping).toBe(true)
    act(() => result.current.setQuantize('beat'))
    expect(result.current.quantize).toBe('beat')
    act(() => result.current.stopAll())
    await act(() => advance(2))
    expect(result.current.cells[0].map((cell) => cell.state)).toEqual(['stopped', 'stopped'])
  })

  it('re-renders on session changes only, and follows document edits to the grid', async () => {
    const { document, session } = await rig()
    const renders = vi.fn()
    const { result } = renderHook(() => {
      renders()
      return useSession(session)
    })
    const before = renders.mock.calls.length
    act(() => {
      document.apply({ type: 'scene.add', scene: { id: 'outro', name: 'Outro' } })
    })
    expect(renders.mock.calls.length).toBeGreaterThan(before)
    expect(result.current.scenes.map((scene) => scene.id)).toEqual(['verse', 'chorus', 'outro'])
    expect(result.current.cells).toHaveLength(3)
    const version = result.current.version
    // The same snapshot again: no re-render.
    const again = renders.mock.calls.length
    act(() => {
      /* nothing */
    })
    expect(renders.mock.calls.length).toBe(again)
    expect(result.current.version).toBe(version)
  })
})

describe('useSlot', () => {
  it('reads one slot and binds its controls', async () => {
    const { engine, session, advance } = await rig()
    const { result } = renderHook(() => useSlot(session, 'pv'))
    expect(result.current.slot?.launchMode).toBe('toggle')
    expect(result.current).toMatchObject({
      state: 'stopped',
      playing: false,
      queued: false,
      stopping: false,
    })

    engine.transport.start()
    await act(() => advance(7.9))
    act(() => result.current.launch())
    expect(result.current.queued).toBe(true)
    await act(() => advance(0.2))
    expect(result.current.playing).toBe(true)
    act(() => result.current.launch()) // toggle while playing: a stop is placed at the next bar
    expect(result.current.stopping).toBe(true)
    expect(result.current.status?.endSec).toBe(10)
    act(() => result.current.stop({ quantize: 'none' })) // an earlier stop wins over the placed one
    expect(result.current.status?.endSec).toBeCloseTo(8.1 + session.immediateLeadSec)
    await act(() => advance(2))
    expect(result.current.state).toBe('stopped')
    act(() => result.current.release()) // toggle mode: release is ignored
    expect(result.current.state).toBe('stopped')
  })

  it('an unknown slot reads as empty; its controls report the missing slot', async () => {
    const { session } = await rig()
    const { result } = renderHook(() => useSlot(session, 'nope'))
    expect(result.current.slot).toBeNull()
    expect(result.current.state).toBe('empty')
    expect(() => act(() => result.current.launch())).toThrow(/no slot/)
  })
})
