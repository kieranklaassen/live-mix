// End to end on the recording mocks: a scripted "agent" runs a mini session
// — start, steer, extend, duck, fade out — through the controller, and the
// audit trail, the operation log and the graph (at the AudioParam boundary)
// all tell the same story.

import { describe, expect, it } from 'vitest'

import { type Author } from '../../score/log'
import { findStripHost, findTrack, type ScoreAudioTrack } from '../../score/schema'
import { type MockAudioParam } from '../../testing'
import { type AgentSession, type ToolResult, type ToolSuccess } from '../types'
import { library, rig } from './fixtures'

const coach: Author = { id: 'coach', kind: 'agent' }

describe('a scripted coach runs a mini session', () => {
  it('start → steer → extend → duck → fade out, with a matching audit log', async () => {
    let sectionExtra = 0
    let speaking = false
    const session: AgentSession = {
      describe: () => ({
        sectionIndex: 0,
        sections: [{ name: 'Grounding', intensity: 2, durationSec: 240 + sectionExtra }],
        sectionRemainingSec: 240 + sectionExtra - 60,
      }),
      extendSection: (seconds) => {
        sectionExtra += seconds
        return seconds
      },
      isSpeaking: () => speaking,
      headroomSec: () => 900 - sectionExtra,
    }
    const { controller, document, engine, renderer, ctx, clock } = await rig({
      session,
      author: coach,
    })
    const script: [string, Record<string, unknown>][] = [
      ['get_state', {}],
      ['set_music_volume', { level: 0.6 }],
      ['steer_music', { direction: 'calmer' }],
      ['extend_section', { seconds: 120 }],
      ['duck', { depth: 0.7 }],
      ['strip_mute', { owner: 'voice', mute: true }],
      ['fade_out', { seconds: 6 }],
    ]

    // The app starts playback; the agent takes it from there.
    engine.transport.start(0)
    ctx.currentTime = 60
    const results: ToolResult[] = []
    for (const [tool, args] of script) {
      if (tool === 'strip_mute') speaking = true
      results.push(controller.call(tool, args))
      clock.ms += 5000
      ctx.currentTime += 5
    }
    await renderer.whenIdle()

    // Outcomes as the model saw them.
    expect(results.map((result) => result.ok)).toEqual([true, true, true, true, true, false, true])
    const [state, volume, steer, extend, duck, mute, fade] = results
    expect((state as ToolSuccess).result.transport).toEqual({
      state: 'playing',
      positionSec: 60,
      loop: false,
    })
    expect((volume as ToolSuccess).result).toEqual({ level: 0.6 })
    const steered = (steer as ToolSuccess).result
    expect(steered.targetIntensity).toBe(1)
    expect(steered.boundaryShiftSec).toBeGreaterThan(0)
    expect((extend as ToolSuccess).result).toEqual({
      requestedSec: 120,
      grantedSec: 120,
      appliedSec: 120,
    })
    expect((duck as ToolSuccess).result).toEqual({ depth: 0.7 })
    expect(mute.ok).toBe(false)
    expect((fade as ToolSuccess).result).toEqual({ seconds: 6 })

    // The audit trail, in order, with attribution and outcomes.
    expect(
      controller.audit.entries.map((entry) => [
        entry.callId,
        entry.tool,
        entry.outcome,
        entry.author.id,
      ]),
    ).toEqual([
      [1, 'get_state', 'applied', 'coach'],
      [2, 'set_music_volume', 'applied', 'coach'],
      [3, 'steer_music', 'applied', 'coach'],
      [4, 'extend_section', 'applied', 'coach'],
      [5, 'duck', 'applied', 'coach'],
      [6, 'strip_mute', 'rejected', 'coach'],
      [7, 'fade_out', 'applied', 'coach'],
    ])
    expect(controller.audit.find(6)?.rails).toEqual([
      { rail: 'voice', action: 'rejected', message: 'the voice cannot be muted while speaking' },
    ])
    expect(controller.audit.entries.map((entry) => entry.operations.length)).toEqual([
      0, 1, 1, 0, 1, 0, 0,
    ])

    // The operation log carries exactly the score edits, all by the coach.
    expect(
      document.log.entries.map((entry) => [entry.seq, entry.op.type, entry.author.id]),
    ).toEqual([
      [1, 'strip.set', 'coach'],
      [2, 'batch', 'coach'],
      [3, 'device.setParam', 'coach'],
    ])
    expect(document.log.entries.map((entry) => entry.label)).toEqual([
      'agent:set_music_volume#2 set music volume',
      'agent:steer_music#3 steer calmer',
      'agent:duck#5 duck',
    ])

    // The score: volume, replacement clips at intensity 1, deeper duck.
    expect(findStripHost(document.score, 'music')?.strip.level).toBe(0.6)
    const music = findTrack(document.score, 'music') as ScoreAudioTrack
    const replacement = music.clips.find((clip) => clip.startSec === 70)
    expect(library().find((track) => String(track.id) === replacement?.sourceId)?.intensity).toBe(1)
    expect(music.clips[0]).toMatchObject({ id: 'c201', durationSec: 74, fadeOutSec: 4 })
    expect(findStripHost(document.score, 'music')?.strip.inserts[0].params.depth).toBe(0.7)
    expect(controller.growth).toBe((steered.boundaryShiftSec as number) + 120)

    // The graph followed the document, and the fade landed on the master gain.
    expect(renderer.audioTrack('music').strip.level).toBe(0.6)
    expect(renderer.device('music-duck').getParam('depth')).toBe(0.7)
    const masterGain = engine.master.gain as unknown as MockAudioParam
    const fadeEvent = masterGain.eventsFor('setTargetAtTime').at(-1)
    expect(fadeEvent?.args).toEqual([0, 90, 2])
    expect(engine.transport.state).toBe('stopped')

    // The snapshot reflects the session as the model would read it next.
    const snapshot = controller.snapshot()
    expect(snapshot.session).toMatchObject({ sectionIndex: 0, section: 'Grounding', intensity: 2 })
    expect(snapshot.levels.music).toBe(0.6)
    expect(snapshot.recent.map((call) => call.tool)).toEqual(script.slice(1).map(([tool]) => tool))
    expect(snapshot.voice.speaking).toBe(true)
    expect(JSON.stringify(snapshot).length).toBeLessThan(2048)
  })

  it('the same script in dry-run mode leaves the document, the log, the hooks and the engine untouched', async () => {
    let extended = 0
    const { controller, document, engine } = await rig({
      session: { extendSection: (seconds) => (extended += seconds) },
    })
    const before = document.score
    engine.transport.start(0)
    const events = (engine.master.gain as unknown as MockAudioParam).events.length
    for (const [tool, args] of [
      ['set_music_volume', { level: 0.6 }],
      ['steer_music', { direction: 'calmer' }],
      ['extend_section', { seconds: 120 }],
      ['duck', { depth: 0.7 }],
      ['fade_out', { seconds: 6 }],
    ] as [string, Record<string, unknown>][]) {
      const result = controller.call(tool, args, { dryRun: true }) as ToolSuccess
      expect(result.ok, tool).toBe(true)
      expect(result.dryRun).toBe(true)
      expect(result.operations).toEqual([])
    }
    expect(document.score).toBe(before)
    expect(document.log.length).toBe(0)
    expect(extended).toBe(0)
    expect(engine.transport.state).toBe('playing')
    expect((engine.master.gain as unknown as MockAudioParam).events.length).toBe(events)
    expect(controller.growth).toBe(0)
    expect(controller.audit.entries.every((entry) => entry.outcome === 'dry-run')).toBe(true)
    // The compiled steer is visible for inspection.
    const steer = controller.audit.entries[1]
    expect(steer.result?.targetIntensity).toBe(1)
  })
})
