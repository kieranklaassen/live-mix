import { describe, expect, it, vi } from 'vitest'

import { camelotNumber } from '../../core/music/camelot'
import { CROSSFADE_SECONDS, STEER_CROSSFADE_SECONDS } from '../../core/tracks/AudioTrack'
import { type Operation } from '../../score/operations'
import { findDevice, findStripHost, findTrack, type ScoreAudioTrack } from '../../score/schema'
import { type AgentSession, type ToolFailure, type ToolSuccess } from '../types'
import { library, rig } from './fixtures'

function musicTrack(score: Parameters<typeof findTrack>[0]): ScoreAudioTrack {
  return findTrack(score, 'music') as ScoreAudioTrack
}

describe('level intents', () => {
  it('set_music_volume compiles to strip.set on the music role', async () => {
    const { controller, document } = await rig()
    const result = controller.call('set_music_volume', { level: 0.4 }) as ToolSuccess
    expect(result.result).toEqual({ level: 0.4 })
    expect(result.operations).toEqual([{ seq: 1, type: 'strip.set' }])
    expect(document.log.entry(1)?.op).toEqual({
      type: 'strip.set',
      owner: 'music',
      param: 'level',
      value: 0.4,
    })
    expect(findStripHost(document.score, 'music')?.strip.level).toBe(0.4)
  })

  it('set_music_volume delegates to the session hook when present, still through the rails', async () => {
    const setMusicVolume = vi.fn((level: number) => level)
    const { controller, document } = await rig({ session: { setMusicVolume } })
    const result = controller.call('set_music_volume', { level: 1.5 }) as ToolSuccess
    expect(result).toMatchObject({ ok: true, result: { level: 1 } })
    expect(result.rails[0]).toMatchObject({ rail: 'range', requested: 1.5, applied: 1 })
    expect(setMusicVolume).toHaveBeenCalledWith(1)
    expect(result.operations).toEqual([])
    expect(document.log.length).toBe(0)
  })

  it('set_ambience compiles to strip.set on the ambience role', async () => {
    const { controller, document } = await rig()
    const result = controller.call('set_ambience', { level: 0.1 }) as ToolSuccess
    expect(result.ok).toBe(true)
    expect(document.log.entry(1)?.op).toEqual({
      type: 'strip.set',
      owner: 'ambience',
      param: 'level',
      value: 0.1,
    })
  })

  it('duck compiles to device.setParam depth on the music ducker (softer under voice)', async () => {
    const { controller, document } = await rig()
    const result = controller.call('duck', { depth: 0.7 }) as ToolSuccess
    expect(result.result).toEqual({ depth: 0.7 })
    expect(document.log.entry(1)?.op).toEqual({
      type: 'device.setParam',
      device: 'music-duck',
      param: 'depth',
      value: 0.7,
    })
    expect(findDevice(document.score, 'music-duck')?.device.params.depth).toBe(0.7)
    const over = controller.call('duck', { depth: 2 }) as ToolSuccess
    expect(over.result).toEqual({ depth: 1 })
    expect(over.rails[0]).toMatchObject({ rail: 'range', requested: 2, applied: 1 })
  })

  it('duck uses the session hook when the consumer owns the ducker', async () => {
    const setDuckDepth = vi.fn((depth: number) => depth)
    const { controller } = await rig({ session: { setDuckDepth }, roles: { music: 'music' } })
    expect((controller.call('duck', { depth: 0.3 }) as ToolSuccess).result).toEqual({ depth: 0.3 })
    expect(setDuckDepth).toHaveBeenCalledWith(0.3)
  })

  it('more_space lowers the music by 3 dB and deepens the duck by 0.1 in one call', async () => {
    const { controller, document } = await rig()
    const result = controller.call('more_space') as ToolSuccess
    expect(result.result.musicLevel).toBeCloseTo(0.8 * Math.pow(10, -3 / 20))
    expect(result.result.duckDepth).toBeCloseTo(0.6)
    expect(result.operations.map((op) => op.type)).toEqual(['strip.set', 'device.setParam'])
    expect(document.log.length).toBe(2)
  })
})

describe('steering (R26, AE1)', () => {
  it('AE1: playing 8A at intensity 2, calmer replaces with intensity 1 and a Camelot number in {7, 8, 9}, reporting the growth', async () => {
    const { controller, document, engine, ctx } = await rig()
    engine.transport.start(0)
    ctx.currentTime = 100
    const result = controller.call('steer_music', { direction: 'calmer' }) as ToolSuccess
    expect(result.ok).toBe(true)
    expect(result.result.targetIntensity).toBe(1)
    const picks = library().filter((track) =>
      (result.result.trackIds as string[]).includes(String(track.id)),
    )
    expect(picks.length).toBeGreaterThan(0)
    for (const pick of picks) expect(pick.intensity).toBe(1)
    expect([7, 8, 9]).toContain(camelotNumber(picks[0].camelot))
    expect(result.result.nowPlaying).toBe(picks[0].title)
    // The old arrangement ended at 240 s; a full track from 100 s ends later.
    const track = musicTrack(document.score)
    const end = Math.max(...track.clips.map((clip) => clip.startSec + clip.durationSec))
    expect(result.result.boundaryShiftSec).toBe(Math.round(end - 240))
    expect(end).toBeGreaterThan(240)
    expect(controller.growth).toBe(end - 240)
  })

  it('compiles to one batch: sources added, the sounding clip trimmed to fade over the steer crossfade, then clip.replaceFrom', async () => {
    const { controller, document, engine, ctx } = await rig()
    engine.transport.start(0)
    ctx.currentTime = 100
    const result = controller.call('steer_music', { direction: 'stronger' }) as ToolSuccess
    expect(result.operations.map((op) => op.type)).toEqual(['batch'])
    const batch = document.log.entry(1)?.op as Extract<Operation, { type: 'batch' }>
    const types = batch.ops.map((op) => op.type)
    expect(types.filter((type) => type === 'source.add').length).toBeGreaterThan(0)
    expect(types.slice(-3)).toEqual(['clip.trim', 'clip.update', 'clip.replaceFrom'])
    expect(batch.ops.find((op) => op.type === 'clip.trim')).toMatchObject({
      track: 'music',
      id: 'c201',
      durationSec: 100 + STEER_CROSSFADE_SECONDS,
    })
    const replace = batch.ops.at(-1) as Extract<Operation, { type: 'clip.replaceFrom' }>
    expect(replace.fromSec).toBe(100)
    expect(replace.clips[0]).toMatchObject({
      startSec: 100,
      fadeInSec: STEER_CROSSFADE_SECONDS,
      fadeOutSec: CROSSFADE_SECONDS,
      fadeCurve: 'equalPower',
    })
    for (const clip of replace.clips) {
      expect(document.score.sources.some((source) => source.id === clip.sourceId)).toBe(true)
    }
    // The picks are intensity 3, compatible with 8A: 9A or 7B.
    const track = musicTrack(document.score)
    expect(['301', '302']).toContain(track.clips.find((clip) => clip.startSec === 100)?.sourceId)
    // Undo restores the arrangement in one step.
    expect(controller.undo().ok).toBe(true)
    expect(musicTrack(document.score).clips).toEqual(musicTrack(document.log.initial).clips)
  })

  it('caps the boundary shift at the session headroom by truncating only the last clip', async () => {
    const { controller, document, engine, ctx } = await rig({
      rails: { maxSessionGrowthSec: 20 },
    })
    engine.transport.start(0)
    ctx.currentTime = 200
    const result = controller.call('steer_music', { direction: 'change' }) as ToolSuccess
    expect(result.result.boundaryShiftSec).toBeLessThanOrEqual(20)
    const track = musicTrack(document.score)
    const end = Math.max(...track.clips.map((clip) => clip.startSec + clip.durationSec))
    expect(end).toBeLessThanOrEqual(260)
  })

  it('brighter keeps the intensity and leans major / clockwise; darker minor / anticlockwise', async () => {
    const bright = await rig()
    bright.engine.transport.start(0)
    const brighter = bright.controller.call('steer_music', { direction: 'brighter' }) as ToolSuccess
    expect(brighter.result.targetIntensity).toBe(2)
    expect((brighter.result.trackIds as string[])[0]).toBe('202') // 8B, the major relative
    const dark = await rig({
      library: [
        ...library(),
        { id: 203, title: 'Deep', intensity: 2, camelot: '7A', durationSec: 260 },
      ],
    })
    dark.engine.transport.start(0)
    const darker = dark.controller.call('steer_music', { direction: 'darker' }) as ToolSuccess
    expect((darker.result.trackIds as string[])[0]).toBe('203')
  })

  it('rejects with the coach-facing message when nothing fits, leaving the score untouched (no-silence)', async () => {
    const { controller } = await rig({ library: [], session: {}, roles: { music: 'music' } })
    // No library at all: the tool is not even listed.
    expect(controller.listTools().some((tool) => tool.name === 'steer_music')).toBe(false)
    const empty = await rig({ library: library().filter((track) => track.id === 201) })
    const result = empty.controller.call('steer_music', { direction: 'change' }) as ToolFailure
    expect(result.error).toEqual({
      code: 'rejected',
      message: 'no replacement music is available right now',
    })
    expect(empty.document.log.length).toBe(0)
  })

  it('set_intensity targets a rung directly', async () => {
    const { controller, engine } = await rig()
    engine.transport.start(0)
    const result = controller.call('set_intensity', { level: 3 }) as ToolSuccess
    expect(result.result.level).toBe(3)
    expect(result.result.targetIntensity).toBe(3)
    for (const id of result.result.trackIds as string[]) {
      expect(library().find((track) => String(track.id) === id)?.intensity).toBe(3)
    }
  })

  it('steers through the session ladder path: the library picks go to replaceUpcoming with the headroom', async () => {
    const replaceUpcoming = vi.fn(() => 42.4)
    const session: AgentSession = {
      describe: () => ({
        nowPlaying: {
          id: 201,
          title: 'Slow Pulse',
          camelot: '8A',
          intensity: 2,
          remainingSec: 300,
        },
      }),
      library,
      playedIds: () => [101],
      replaceUpcoming,
      headroomSec: () => 600,
    }
    const { controller } = await rig({ session, document: undefined })
    const result = controller.call('steer_music', { direction: 'calmer' }) as ToolSuccess
    expect(result.ok).toBe(true)
    expect(result.result).toMatchObject({
      direction: 'calmer',
      targetIntensity: 1,
      boundaryShiftSec: 42,
    })
    expect(result.result.trackIds).not.toContain(101)
    const [tracks, maxDelta] = replaceUpcoming.mock.calls[0] as unknown as [
      { intensity: number }[],
      number,
    ]
    expect(tracks.every((track) => track.intensity === 1)).toBe(true)
    expect(maxDelta).toBe(600)
    expect(controller.growth).toBe(42.4)
  })

  it('a session that owns steering is called with the direction and the ladder target', async () => {
    const steer = vi.fn(() => ({ nowPlaying: 'Calm River', boundaryShiftSec: 12 }))
    const { controller } = await rig({
      session: {
        steer,
        describe: () => ({ nowPlaying: { id: 1, title: 'x', camelot: '8A', intensity: 3 } }),
      },
    })
    const result = controller.call('steer_music', { direction: 'calmer' }) as ToolSuccess
    expect(steer).toHaveBeenCalledWith('calmer', 2)
    expect(result.result).toEqual({
      direction: 'calmer',
      targetIntensity: 2,
      nowPlaying: 'Calm River',
      boundaryShiftSec: 12,
    })
    steer.mockReturnValueOnce(null as never)
    const { controller: fresh } = await rig({ session: { steer } })
    const failed = fresh.call('steer_music', { direction: 'change' }) as ToolFailure
    expect(failed.error.message).toBe('no replacement music is available right now')
  })
})

describe('session intents', () => {
  it('extend_section clamps at 300 s per call and the headroom, and reports the applied seconds', async () => {
    const extendSection = vi.fn((seconds: number) => seconds + 17.3)
    const { controller } = await rig({ session: { extendSection, headroomSec: () => 400 } })
    const result = controller.call('extend_section', { seconds: 300 }) as ToolSuccess
    expect(extendSection).toHaveBeenCalledWith(300)
    expect(result.result).toEqual({ requestedSec: 300, grantedSec: 300, appliedSec: 317 })
    const tight = await rig({ session: { extendSection, headroomSec: () => 45 } })
    const capped = tight.controller.call('extend_section', { seconds: 120 }) as ToolSuccess
    expect(capped.result).toMatchObject({ requestedSec: 120, grantedSec: 45 })
    expect(capped.rails[0]).toMatchObject({ rail: 'headroom', requested: 120, applied: 45 })
    const none = await rig({ session: { extendSection, headroomSec: () => 0 } })
    expect(
      (none.controller.call('extend_section', { seconds: 10 }) as ToolFailure).error.code,
    ).toBe('rejected')
    const capped500 = tight.controller.call('extend_section', { seconds: 500 }) as ToolSuccess
    expect(capped500.rails.map((note) => note.applied)).toEqual([300, 45])
    expect((none.controller.call('extend_section', { seconds: 0 }) as ToolFailure).error.code).toBe(
      'invalid_args',
    )
  })

  it('the controller keeps its own growth budget when the session gives no headroom', async () => {
    const { controller } = await rig({
      session: { extendSection: (seconds) => seconds },
      rails: {
        maxSessionGrowthSec: 100,
        rateLimits: { extend_section: { burst: 10, perMinute: 60 } },
      },
    })
    expect(
      (controller.call('extend_section', { seconds: 60 }) as ToolSuccess).result.appliedSec,
    ).toBe(60)
    expect(
      (controller.call('extend_section', { seconds: 60 }) as ToolSuccess).result.appliedSec,
    ).toBe(40)
    expect(controller.call('extend_section', { seconds: 60 }).ok).toBe(false)
  })

  it('advance_section and set_breath_pace delegate and echo the session', async () => {
    const advanceSection = vi.fn(() => 2)
    const setBreathPace = vi.fn(() => 1.15)
    const { controller } = await rig({ session: { advanceSection, setBreathPace } })
    expect((controller.call('advance_section') as ToolSuccess).result).toEqual({ sectionIndex: 2 })
    const pace = controller.call('set_breath_pace', { direction: 'slower' }) as ToolSuccess
    expect(pace.result).toEqual({ direction: 'slower', paceMultiplier: 1.15 })
    expect(setBreathPace).toHaveBeenCalledWith('slower')
    expect(
      (controller.call('set_breath_pace', { direction: 'sideways' }) as ToolFailure).error.code,
    ).toBe('invalid_args')
  })

  it('fade_out keeps the fade in bounds and stops the engine (or the session)', async () => {
    const { controller, engine } = await rig()
    const stop = vi.spyOn(engine, 'stop')
    const result = controller.call('fade_out', { seconds: 0.5 }) as ToolSuccess
    expect(result.result).toEqual({ seconds: 2 })
    expect(result.rails[0]).toMatchObject({ rail: 'range', requested: 0.5, applied: 2 })
    expect(stop).toHaveBeenCalledWith({ fadeSec: 2 })
    const fadeOut = vi.fn()
    const owned = await rig({ session: { fadeOut } })
    expect((owned.controller.call('fade_out', { seconds: 8 }) as ToolSuccess).result).toEqual({
      seconds: 8,
    })
    expect(fadeOut).toHaveBeenCalledWith(8)
  })

  it('match_key ranks candidates by Camelot compatibility and shift', async () => {
    const { controller } = await rig()
    const result = controller.call('match_key', {
      anchor: '8A',
      candidates: [
        { id: 'far', camelot: '2B' },
        { id: 'near', camelot: '9A' },
        { id: 'same', camelot: '8B' },
        { id: 'unknown', camelot: 'Unknown' },
      ],
    }) as ToolSuccess
    const ranked = result.result.ranked as {
      id: string
      semitones: number | null
      compatible: boolean
    }[]
    expect(ranked.map((entry) => entry.id)).toEqual(['same', 'near', 'far', 'unknown'])
    expect(ranked[0]).toMatchObject({ semitones: 0, distance: 0, compatible: true })
    expect(ranked[2].semitones).not.toBe(0)
    expect(ranked[3].semitones).toBeNull()
    expect(result.operations).toEqual([])
  })

  it('hooks-only intents are unavailable without a session and say so', async () => {
    const { controller } = await rig()
    const names = controller.listTools().map((tool) => tool.name)
    expect(names).not.toContain('extend_section')
    expect(names).not.toContain('advance_section')
    expect(names).not.toContain('set_breath_pace')
    const result = controller.call('advance_section') as ToolFailure
    expect(result.error.code).toBe('unavailable')
  })
})
