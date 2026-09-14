import { describe, expect, it, vi } from 'vitest'

import { type Author } from '../../score/log'
import { findStripHost } from '../../score/schema'
import { type AgentController } from '../AgentController'
import { type ToolFailure, type ToolSuccess } from '../types'
import { rig } from './fixtures'

const coach: Author = { id: 'coach', kind: 'agent' }

function musicLevel(controller: AgentController): number {
  const score = controller.document?.score
  const host = score ? findStripHost(score, 'music') : undefined
  if (!host) throw new Error('no music track')
  return host.strip.level
}

describe('AgentController.call: the pipeline', () => {
  it('applies a schema-valid operation through the document with the agent as author', async () => {
    const { controller, document } = await rig()
    const result = controller.call(
      'strip_set',
      { owner: 'music', param: 'level', value: 0.5 },
      { author: coach },
    ) as ToolSuccess
    expect(result.ok).toBe(true)
    expect(result.result).toEqual({
      operation: 'strip.set',
      summary: 'music level → 0.5',
      owner: 'music',
      param: 'level',
      value: 0.5,
    })
    expect(result.operations).toEqual([{ seq: 1, type: 'strip.set' }])
    expect(musicLevel(controller)).toBe(0.5)
    expect(document.log.entry(1)).toMatchObject({
      author: coach,
      label: 'agent:strip_set#1 music level → 0.5',
    })
    expect(controller.audit.entries).toHaveLength(1)
    expect(controller.audit.entries[0]).toMatchObject({
      callId: 1,
      tool: 'strip_set',
      author: coach,
      outcome: 'applied',
      operations: [{ seq: 1, type: 'strip.set' }],
    })
  })

  it('rejects unknown tools and invalid arguments without touching the score', async () => {
    const { controller, document } = await rig()
    const unknown = controller.call('make_it_pop', {}) as ToolFailure
    expect(unknown.ok).toBe(false)
    expect(unknown.error.code).toBe('unknown_tool')
    const invalid = controller.call('strip_set', {
      owner: 'music',
      param: 'gain',
      value: 1,
    }) as ToolFailure
    expect(invalid.error.code).toBe('invalid_args')
    expect(invalid.error.issues?.[0].path).toBe('param')
    const missing = controller.call('strip_set', { owner: 'music' }) as ToolFailure
    expect(missing.error.message).toContain('param: is required')
    expect(document.log.length).toBe(0)
    expect(controller.audit.entries.map((entry) => entry.outcome)).toEqual([
      'rejected',
      'rejected',
      'rejected',
    ])
  })

  it('operations that do not fit the score fail cleanly', async () => {
    const { controller, document } = await rig()
    const result = controller.call('strip_mute', { owner: 'nobody', mute: true }) as ToolFailure
    expect(result.error.code).toBe('failed')
    expect(result.error.message).toContain('no track, group or return "nobody"')
    expect(document.log.length).toBe(0)
  })

  it('structural operations need consent; parameter operations do not', async () => {
    const { controller } = await rig()
    const refused = controller.call('strip_rename', { id: 'ambience', name: 'Bed' }) as ToolFailure
    expect(refused.error.code).toBe('consent_required')
    expect(refused.rails).toEqual([
      { rail: 'consent', action: 'rejected', message: 'needs consent "structure"' },
    ])
    expect(controller.listTools().find((tool) => tool.name === 'track_remove')?.consent).toBe(
      'structure',
    )
    expect(controller.listTools().find((tool) => tool.name === 'clip_move')?.consent).toBe(
      'arrange',
    )
    expect(
      controller.listTools().find((tool) => tool.name === 'strip_set')?.consent,
    ).toBeUndefined()
    controller.grantConsent('structure')
    expect(controller.call('strip_rename', { id: 'ambience', name: 'Bed' }).ok).toBe(true)
    controller.revokeConsent('structure')
    expect(controller.call('strip_rename', { id: 'ambience', name: 'Bed 2' }).ok).toBe(false)
  })

  it("a batch needs the union of its children's consents", async () => {
    const { controller } = await rig()
    const ops = [
      { type: 'strip.set', owner: 'music', param: 'level', value: 0.5 },
      { type: 'clip.remove', track: 'music', id: 'c201' },
    ]
    const refused = controller.call('batch', { ops }) as ToolFailure
    expect(refused.error.message).toContain('"arrange"')
    controller.grantConsent('arrange')
    expect(controller.call('batch', { ops }).ok).toBe(true)
  })

  it('rate-limits per tool and reports when to retry', async () => {
    const { controller, clock } = await rig({ session: { extendSection: (seconds) => seconds } })
    expect(controller.call('extend_section', { seconds: 30 }).ok).toBe(true)
    expect(controller.call('extend_section', { seconds: 30 }).ok).toBe(true)
    const limited = controller.call('extend_section', { seconds: 30 }) as ToolFailure
    expect(limited.error.code).toBe('rate_limited')
    expect(limited.error.retryAfterMs).toBe(10_000)
    expect(limited.rails[0]).toMatchObject({ rail: 'rate-limit', action: 'rejected' })
    clock.ms += 10_000
    expect(controller.call('extend_section', { seconds: 30 }).ok).toBe(true)
  })

  it('a dry run validates, runs the rails and compiles, but changes nothing', async () => {
    const { controller, document, engine } = await rig()
    const stop = vi.spyOn(engine, 'stop')
    const before = document.score
    const result = controller.call(
      'strip_set',
      { owner: 'music', param: 'level', value: 3 },
      { dryRun: true },
    ) as ToolSuccess
    expect(result.ok).toBe(true)
    expect(result.dryRun).toBe(true)
    expect(result.compiled).toEqual([
      { type: 'strip.set', owner: 'music', param: 'level', value: 1 },
    ])
    expect(result.rails[0]).toMatchObject({ rail: 'range', requested: 3, applied: 1 })
    expect(result.operations).toEqual([])
    expect(document.score).toBe(before)
    expect(document.log.length).toBe(0)

    const fade = controller.call('fade_out', { seconds: 5 }, { dryRun: true })
    expect(fade.ok).toBe(true)
    expect(stop).not.toHaveBeenCalled()
    // Neither the rate-limit bucket nor the slew budget was consumed.
    for (let index = 0; index < 5; index += 1) {
      expect(controller.call('fade_out', { seconds: 5 }, { dryRun: true }).ok).toBe(true)
    }
    expect(controller.call('strip_set', { owner: 'music', param: 'level', value: 0 }).ok).toBe(true)
    expect(controller.audit.entries.filter((entry) => entry.outcome === 'dry-run')).toHaveLength(7)
  })

  it('rolls back the operations of a call whose later step fails', async () => {
    const { controller, document } = await rig()
    controller.grantConsent('arrange')
    const before = document.score
    const result = controller.call('batch', {
      ops: [
        { type: 'strip.set', owner: 'music', param: 'level', value: 0.3 },
        { type: 'clip.remove', track: 'music', id: 'missing' },
      ],
    }) as ToolFailure
    expect(result.error.code).toBe('failed')
    expect(document.score).toEqual(before)
    expect(document.log.length).toBe(0)
  })

  it('AE2: music volume 3.0 applies as 1.0, the clamp is logged with the requested value, and it is undoable', async () => {
    const { controller, document } = await rig()
    controller.call('strip_set', { owner: 'music', param: 'level', value: 0.5 }, { author: coach })
    const result = controller.call(
      'strip_set',
      { owner: 'music', param: 'level', value: 3 },
      { author: coach },
    ) as ToolSuccess
    expect(result.ok).toBe(true)
    expect(result.result.value).toBe(1)
    expect(result.rails).toEqual([
      {
        rail: 'range',
        action: 'clamped',
        message: 'music level 3 clamped to 0..1',
        requested: 3,
        applied: 1,
      },
    ])
    expect(musicLevel(controller)).toBe(1)
    expect(controller.audit.find(2)).toMatchObject({
      args: { owner: 'music', param: 'level', value: 3 },
      rails: [{ requested: 3 }],
      summary: 'music level → 1 (range clamped)',
    })

    const undone = controller.call('undo', {}, { author: coach }) as ToolSuccess
    expect(undone.ok).toBe(true)
    expect(undone.result).toEqual({ undone: 2, tool: 'strip_set', operations: 1 })
    expect(musicLevel(controller)).toBe(0.5)
    expect(controller.audit.find(2)?.undoneBy).toBe(3)
    expect(document.log.entry(3)?.author).toEqual(coach)
    const again = controller.call('undo', { callId: 2 }) as ToolFailure
    expect(again.error.message).toContain('already undone')
    // A second undo reverts the first call.
    expect((controller.call('undo', {}, { author: coach }) as ToolSuccess).result.undone).toBe(1)
    expect(musicLevel(controller)).toBe(0.8)
    expect(controller.undo().ok).toBe(false)
  })

  it('a disposed controller refuses calls and stops its cadence', async () => {
    const intervals: (() => void)[] = []
    const cleared: number[] = []
    const { controller } = await rig({
      setIntervalFn: (callback) => {
        intervals.push(callback)
        return intervals.length as unknown as ReturnType<typeof setInterval>
      },
      clearIntervalFn: (id) => cleared.push(id as unknown as number),
    })
    const seen: number[] = []
    controller.onSnapshot((snapshot) => seen.push(snapshot.cursor))
    controller.setCadence(500)
    expect(controller.cadence).toBe(500)
    intervals[0]()
    expect(seen).toEqual([0])
    controller.dispose()
    expect(cleared).toEqual([1])
    expect(() => controller.call('get_state')).toThrow(/disposed/)
  })
})

describe('rails through operations', () => {
  it('slews rapid fader moves', async () => {
    const { controller, clock } = await rig({ meters: () => null })
    // 0.8 → 0.2: allowed in one move.
    expect(
      (controller.call('strip_set', { owner: 'music', param: 'level', value: 0.2 }) as ToolSuccess)
        .result.value,
    ).toBe(0.2)
    // Straight back up 100 ms later: only 0.4 + 0.1 of budget is left.
    clock.ms += 100
    const slewed = controller.call('strip_set', {
      owner: 'music',
      param: 'level',
      value: 0.9,
    }) as ToolSuccess
    expect(slewed.result.value).toBeCloseTo(0.7)
    expect(slewed.rails.map((note) => note.rail)).toEqual(['gain-slew'])
    clock.ms += 5000
    expect(
      (controller.call('strip_set', { owner: 'music', param: 'level', value: 1 }) as ToolSuccess)
        .rails,
    ).toEqual([])
  })

  it('holds fader increases under the loudness ceiling read from the meters', async () => {
    const { controller } = await rig({
      meters: () => ({ shortTermLufs: -16, momentaryLufs: -16, truePeakDb: -6 }),
    })
    // 0.8 → 1.0 is +1.9 dB: lands at −14.1, allowed.
    expect(
      (controller.call('strip_set', { owner: 'music', param: 'level', value: 1 }) as ToolSuccess)
        .rails,
    ).toEqual([])
    const { controller: quieter } = await rig({
      meters: () => ({ shortTermLufs: -15, momentaryLufs: -15, truePeakDb: -6 }),
    })
    const loud = quieter.call('strip_set', {
      owner: 'music',
      param: 'level',
      value: 1,
    }) as ToolSuccess
    expect(loud.rails.map((note) => note.rail)).toEqual(['loudness'])
    expect(loud.result.value).toBeCloseTo(0.8 * Math.pow(10, 1 / 20))
    const peaky = await rig({
      meters: () => ({ shortTermLufs: -30, momentaryLufs: -30, truePeakDb: -1.5 }),
    })
    const peak = peaky.controller.call('strip_set', {
      owner: 'music',
      param: 'level',
      value: 1,
    }) as ToolSuccess
    expect(peak.rails.map((note) => note.rail)).toEqual(['true-peak'])
    expect(peak.result.value).toBeCloseTo(0.8 * Math.pow(10, 0.5 / 20))
  })

  it('never hard-mutes the voice while speaking, and lets it through once silent', async () => {
    let speaking = true
    const { controller } = await rig({ session: { isSpeaking: () => speaking } })
    const mute = controller.call('strip_mute', { owner: 'voice', mute: true }) as ToolFailure
    expect(mute.error.code).toBe('rejected')
    expect(mute.rails[0]).toMatchObject({ rail: 'voice', action: 'rejected' })
    const low = controller.call('strip_set', {
      owner: 'voice',
      param: 'level',
      value: 0.1,
    }) as ToolFailure
    expect(low.error.message).toContain('below 0.25')
    const solo = controller.call('strip_solo', { owner: 'music', solo: true }) as ToolFailure
    expect(solo.error.message).toContain('silence the voice')
    controller.grantConsent('structure')
    const remove = controller.call('track_remove', { id: 'voice' }) as ToolFailure
    expect(remove.error.message).toContain('cannot be removed')
    expect(controller.call('strip_set', { owner: 'voice', param: 'level', value: 0.5 }).ok).toBe(
      true,
    )
    speaking = false
    expect(controller.call('strip_mute', { owner: 'voice', mute: true }).ok).toBe(true)
  })

  it('assumes the voice is speaking when the session says nothing', async () => {
    const { controller } = await rig()
    expect(controller.call('strip_mute', { owner: 'voice', mute: true }).ok).toBe(false)
  })

  it('refuses to silence the music by mute or removal (fades stay allowed)', async () => {
    const { controller } = await rig()
    const mute = controller.call('strip_mute', { owner: 'music', mute: true }) as ToolFailure
    expect(mute.rails[0]).toMatchObject({ rail: 'no-silence', action: 'rejected' })
    controller.grantConsent('structure')
    expect(controller.call('track_remove', { id: 'music' }).ok).toBe(false)
    expect(controller.call('strip_set', { owner: 'music', param: 'level', value: 0 }).ok).toBe(true)
    expect(controller.call('strip_mute', { owner: 'music', mute: false }).ok).toBe(true)
  })

  it('clamps device parameters to their descriptor range', async () => {
    const { controller } = await rig()
    const result = controller.call('device_set_param', {
      device: 'music-duck',
      param: 'depth',
      value: 4,
    }) as ToolSuccess
    expect(result.result.value).toBe(1)
    expect(result.rails[0]).toMatchObject({ rail: 'range', requested: 4, applied: 1 })
    const many = controller.call('device_set_params', {
      device: 'music-duck',
      params: { depth: -1, attackMs: 50, holdMs: null },
    }) as ToolSuccess
    expect(many.result.params).toEqual({ depth: 0, attackMs: 50, holdMs: null })
  })

  it('clamps pan to −1..1', async () => {
    const { controller } = await rig()
    const result = controller.call('strip_set', {
      owner: 'music',
      param: 'pan',
      value: 2,
    }) as ToolSuccess
    expect(result.result.value).toBe(1)
  })
})
