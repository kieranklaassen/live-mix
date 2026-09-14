import { describe, expect, it } from 'vitest'

import { SNAPSHOT_RECENT_CALLS, buildSnapshot, diffSnapshots } from '../snapshot'
import { type AgentSession, type ToolSuccess } from '../types'
import { rig } from './fixtures'

const session: AgentSession = {
  describe: () => ({
    sectionIndex: 1,
    sections: [
      { name: 'Grounding', intensity: 1, durationSec: 420 },
      { name: 'Active breath', intensity: 3, durationSec: 480 },
      { name: 'Integration', intensity: 2, durationSec: 360 },
    ],
    sectionRemainingSec: 133.7,
    nowPlaying: { id: 301, title: 'Rising', camelot: '9A', intensity: 3, remainingSec: 88.2 },
    upcoming: [
      { id: 302, title: 'Open Sky', camelot: '7B', startsInSec: 85.5 },
      { id: 201, title: 'Slow Pulse', camelot: '8A', startsInSec: 270 },
      { id: 202, title: 'Warm Current', camelot: '8B', startsInSec: 500 },
      { id: 101, title: 'Still Water', camelot: '7A', startsInSec: 700 },
    ],
    paceMultiplier: 1.1499,
    musicVolume: 0.6,
  }),
  isSpeaking: () => false,
  extendSection: (seconds) => seconds,
}

describe('snapshot()', () => {
  it('has the documented shape: transport, session, music, levels, meters, voice, devices, recent, rails', async () => {
    const { controller, engine, ctx } = await rig({
      session,
      meters: () => ({ shortTermLufs: -18.26, momentaryLufs: -17.9, truePeakDb: -3.04 }),
    })
    engine.transport.start(0)
    ctx.currentTime = 12.34
    controller.call('set_music_volume', { level: 0.6 })
    const snapshot = controller.snapshot()
    expect(snapshot).toEqual({
      cursor: 1,
      atSec: 12.3,
      transport: { state: 'playing', positionSec: 12.3, loop: false },
      session: {
        sectionIndex: 1,
        section: 'Active breath',
        intensity: 3,
        remainingSec: 134,
        sections: [
          { name: 'Grounding', intensity: 1, durationSec: 420 },
          { name: 'Active breath', intensity: 3, durationSec: 480 },
          { name: 'Integration', intensity: 2, durationSec: 360 },
        ],
        paceMultiplier: 1.15,
      },
      music: {
        nowPlaying: { id: 301, title: 'Rising', key: '9A', intensity: 3, remainingSec: 88 },
        upcoming: [
          { id: 302, title: 'Open Sky', camelot: '7B', startsInSec: 86 },
          { id: 201, title: 'Slow Pulse', camelot: '8A', startsInSec: 270 },
          { id: 202, title: 'Warm Current', camelot: '8B', startsInSec: 500 },
        ],
      },
      levels: { master: 1, voice: 1, music: 0.6, ambience: 0.4 },
      meters: { shortTermLufs: -18.3, momentaryLufs: -17.9, truePeakDb: -3 },
      voice: { speaking: false },
      devices: [{ id: 'music-duck', deviceId: 'ducker', owner: 'music', bypass: false }],
      recent: [
        {
          callId: 1,
          tool: 'set_music_volume',
          author: 'agent',
          outcome: 'applied',
          summary: 'set music volume',
        },
      ],
    })
  })

  it('stays inside the prompt budget with a full session and a busy log', async () => {
    const { controller, engine } = await rig({
      session,
      meters: () => ({ shortTermLufs: -18, momentaryLufs: -18, truePeakDb: -3 }),
      rails: { rateLimits: { default: { burst: 100, perMinute: 6000 } } },
    })
    engine.transport.start(0)
    for (let index = 0; index < 30; index += 1) {
      controller.call('set_music_volume', { level: 0.5 + (index % 5) / 10 })
      controller.call('strip_mute', { owner: 'nobody', mute: true })
    }
    const snapshot = controller.snapshot()
    expect(snapshot.recent).toHaveLength(SNAPSHOT_RECENT_CALLS)
    const text = JSON.stringify(snapshot)
    expect(text.length).toBeLessThan(2048)
    // The get_state tool returns the same document.
    const viaTool = controller.call('get_state') as ToolSuccess
    expect(viaTool.result.levels).toEqual(snapshot.levels)
    expect(JSON.stringify(viaTool.result).length).toBeLessThan(2048)
    expect(controller.audit.find(viaTool.callId)?.result).toBeUndefined()
  })

  it('is small without a session or meters', async () => {
    const { controller } = await rig()
    const snapshot = controller.snapshot()
    expect(snapshot.session).toBeUndefined()
    expect(snapshot.music).toBeUndefined()
    expect(snapshot.meters).toBeUndefined()
    expect(snapshot.transport).toEqual({ state: 'stopped', positionSec: 0, loop: false })
    expect(JSON.stringify(snapshot).length).toBeLessThan(600)
  })

  it('reads levels and meters from the engine when there is no document', async () => {
    const { engine, controller: withDocument } = await rig()
    void withDocument
    const snapshot = buildSnapshot({
      engine,
      score: null,
      roles: { music: 'music', voice: 'voice', ambience: 'nope' },
      session: undefined,
      speaking: true,
      recent: [],
      cursor: 0,
      meters: null,
    })
    expect(snapshot.levels).toEqual({ master: 1, voice: 1, music: 0.8 })
    expect(snapshot.devices).toEqual([])
    expect(snapshot.meters).toBeUndefined()
  })
})

describe('diffSince(cursor)', () => {
  it('returns the calls since the cursor and only the fields that changed', async () => {
    const described = { ...session.describe?.() }
    delete described.musicVolume
    const { controller, engine, ctx } = await rig({
      session: { ...session, describe: () => described },
    })
    engine.transport.start(0)
    const first = controller.snapshot()
    ctx.currentTime = 30
    controller.call('set_music_volume', { level: 0.3 })
    controller.call('duck', { depth: 0.9 })
    const diff = controller.diffSince(first.cursor)
    expect(diff).toMatchObject({ from: 0, to: 2, full: false })
    expect(diff.calls.map((call) => call.tool)).toEqual(['set_music_volume', 'duck'])
    // Levels changed (music), the transport position moved; the session, music and rails did not.
    expect(Object.keys(diff.changed).sort()).toEqual(['levels', 'transport'])
    expect(diff.changed.levels?.music).toBe(0.3)
    expect(diff.changed.transport?.positionSec).toBe(30)
    // Asking again from the new cursor with nothing changed yields an empty diff.
    const again = controller.diffSince(diff.to)
    expect(again.calls).toEqual([])
    expect(again.changed).toEqual({})
  })

  it('falls back to the full snapshot for an unknown cursor', async () => {
    const { controller } = await rig()
    const diff = controller.diffSince(99)
    expect(diff.full).toBe(true)
    expect(diff.changed.levels).toBeDefined()
    expect(diff.changed.recent).toBeUndefined()
  })

  it('diffSnapshots ignores cursor, time and recent', () => {
    const base = {
      cursor: 1,
      atSec: 1,
      transport: null,
      levels: { master: 1 },
      voice: { speaking: true },
      devices: [],
      recent: [],
    }
    expect(diffSnapshots(base, { ...base, cursor: 5, atSec: 9, recent: [] })).toEqual({})
    expect(diffSnapshots(base, { ...base, levels: { master: 0.5 } })).toEqual({
      levels: { master: 0.5 },
    })
    expect(
      diffSnapshots(
        { ...base, meters: { shortTermLufs: -20, momentaryLufs: -20, truePeakDb: -3 } },
        base,
      ),
    ).toEqual({
      meters: null,
    })
  })

  it('emits snapshots at the set cadence to subscribers', async () => {
    const timers: { callback: () => void; ms: number }[] = []
    const { controller } = await rig({
      setIntervalFn: (callback, ms) => {
        timers.push({ callback, ms })
        return timers.length as unknown as ReturnType<typeof setInterval>
      },
      clearIntervalFn: () => {},
    })
    const seen: number[] = []
    const off = controller.onSnapshot((snapshot) => seen.push(snapshot.cursor))
    controller.setCadence(2000)
    expect(timers[0].ms).toBe(2000)
    timers[0].callback()
    controller.call('set_music_volume', { level: 0.5 })
    timers[0].callback()
    expect(seen).toEqual([0, 1])
    off()
    timers[0].callback()
    expect(seen).toEqual([0, 1])
    controller.setCadence(0)
    expect(controller.cadence).toBe(0)
  })
})
