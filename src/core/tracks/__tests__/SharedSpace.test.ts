import { describe, expect, it, vi } from 'vitest'

import {
  asAudioContext,
  createMockContext,
  type MockAudioContext,
  type MockAudioNode,
} from '../../../testing'
import { nodeDeviceParam } from '../../automation/node-device-param'
import { createUtility, utilityGain } from '../../devices/native/Utility'
import { createEngine } from '../../Engine'
import { stripOnlySetsLevel } from '../SharedSpace'
import { spaceDriveGains } from '../space'

type MockGain = MockAudioContext['gains'][number]

function setup(space: Parameters<typeof createEngine>[0]['space'] = {}) {
  const ctx = createMockContext({ sampleRate: 48000 })
  const engine = createEngine({ context: asAudioContext(ctx), space, sharedSpace: true })
  const voice = (spaceDb = -6) => ({
    buffer: ctx.createBuffer(2, 48000, 48000) as unknown as AudioBuffer,
    offsetSec: 0,
    durationSec: 1,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear' as const,
    spaceDb,
  })
  const master = engine.master.input as unknown as MockAudioNode
  return { ctx, engine, voice, master }
}

/** The send a track's voice has into its space. */
function sendOf(played: { placement: { send: GainNode | null } | null } | null): MockGain {
  const send = played?.placement?.send
  if (!send) throw new Error('the voice sends nowhere')
  return send as unknown as MockGain
}

/** The gains a signal passes from `from` on its way to `to`, in order; fails when there is no single way. */
function gainsBetween(ctx: MockAudioContext, from: MockAudioNode, to: MockAudioNode): MockGain[] {
  const passed: MockGain[] = []
  let at = from
  while (at !== to) {
    const next = [...at.outputs].filter((node) => node.reaches(to))
    if (next.length !== 1) throw new Error(`no single way on from a ${at.kind}`)
    at = next[0]
    if (at !== to && ctx.gains.includes(at as MockGain)) passed.push(at as MockGain)
  }
  return passed
}

describe('Engine with sharedSpace', () => {
  it('leaves the room alone when a sharing track’s voice is turned down: others ring in it too', () => {
    const { ctx, engine, voice, master } = setup()
    const a = engine.addAudioTrack('a')
    const b = engine.addAudioTrack('b')
    a.play('k', voice(), 0)
    b.play('k', voice(), 0)
    const [room] = ctx.convolvers
    const gains = ctx.gains.length
    expect(a.place('k', { gainDb: -30, spaceDb: -6 })).toBe(true)
    expect(ctx.gains).toHaveLength(gains)
    expect(room.isConnectedTo(master)).toBe(true)
  })

  it('sends every plain track that feeds one destination into one room, which feeds that destination', () => {
    const { ctx, engine, voice, master } = setup()
    const a = engine.addAudioTrack('a')
    const b = engine.addAudioTrack('b')
    const sendA = sendOf(a.play('k', voice(), 0))
    const sendB = sendOf(b.play('k', voice(), 0))
    expect(ctx.convolvers).toHaveLength(1)
    const [room] = ctx.convolvers
    expect(a.space).toBe(room)
    expect(b.space).toBe(room)
    expect(room.buffer).toBe(engine.spaceImpulse())
    expect(room.isConnectedTo(master)).toBe(true)
    // Each track reaches the room through gains of its own, so its level is its own.
    const wayA = gainsBetween(ctx, sendA, room)
    const wayB = gainsBetween(ctx, sendB, room)
    expect(wayA.length).toBeGreaterThan(0)
    expect(wayA.some((gain) => wayB.includes(gain))).toBe(false)
    // The untouched strips made no nodes for this.
    expect(a.strip.materialized).toBe(false)
  })

  it('gives each group its own room, ahead of the group', () => {
    const { ctx, engine, voice, master } = setup()
    const group = engine.addGroup('clips')
    const inGroup = engine.addAudioTrack('in', { destination: group })
    const outside = engine.addAudioTrack('out')
    inGroup.play('k', voice(), 0)
    outside.play('k', voice(), 0)
    expect(ctx.convolvers).toHaveLength(2)
    const groupInput = group.input as unknown as MockAudioNode
    expect(inGroup.space).not.toBe(outside.space)
    expect((inGroup.space as unknown as MockAudioNode).isConnectedTo(groupInput)).toBe(true)
    expect((outside.space as unknown as MockAudioNode).isConnectedTo(master)).toBe(true)
  })

  it("follows the strip's fader, mute and solo on the way into the room", () => {
    const { ctx, engine, voice } = setup()
    const a = engine.addAudioTrack('a')
    const b = engine.addAudioTrack('b')
    a.strip.setLevel(0.5)
    const send = sendOf(a.play('k', voice(), 0))
    b.play('k', voice(), 0)
    const [room] = ctx.convolvers
    const [, fader, gate] = gainsBetween(ctx, send, room)
    // Made after the fader was set: it starts where the strip's fader stands.
    expect(fader.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0.5)

    a.strip.setLevel(0.25, { at: 3, timeConstant: 0.1 })
    expect(fader.gain.lastEvent('setTargetAtTime')?.args).toEqual([0.25, 3, 0.1])
    expect(gate.gain.eventsFor('setTargetAtTime')).toHaveLength(0)

    a.strip.mute = true
    expect(gate.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0)
    a.strip.mute = false
    expect(gate.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(1)

    // Another track's solo closes this one's gate, and its way into the room with it.
    b.strip.solo = true
    expect(gate.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0)
  })

  it("follows a level-only insert's gain, a lane written ahead included", () => {
    const { ctx, engine, voice } = setup()
    const track = engine.addAudioTrack('a')
    const trim = createUtility(asAudioContext(ctx), { params: { gainDb: -6 } })
    track.strip.addInsert(trim)
    expect(stripOnlySetsLevel(track.strip)).toBe(true)
    const send = sendOf(track.play('k', voice(), 0))
    const [room] = ctx.convolvers
    const [, level] = gainsBetween(ctx, send, room)
    expect(level.gain.value).toBeCloseTo(utilityGain(-6))

    const lane = nodeDeviceParam(trim, 'gainDb')
    lane.setValueAtTime(-12, 2)
    lane.linearRampToValueAtTime(0, 4)
    expect(level.gain.eventsFor('setValueAtTime').at(-1)?.args).toEqual([utilityGain(-12), 2])
    expect(level.gain.lastEvent('linearRampToValueAtTime')?.args).toEqual([1, 4])

    trim.setParam('gainDb', -60)
    expect(level.gain.lastEvent('linearRampToValueAtTime')?.args[0]).toBe(0)
  })

  it('drives each track ahead of its level and leaves the shared room clean', () => {
    const { ctx, engine, voice } = setup({ driveDb: 12 })
    const a = engine.addAudioTrack('a')
    const b = engine.addAudioTrack('b')
    const sendA = sendOf(a.play('k', voice(), 0))
    b.play('k', voice(), 0)
    expect(ctx.convolvers).toHaveLength(1)
    expect(ctx.shapers).toHaveLength(2)
    const [room] = ctx.convolvers
    const [shaper] = ctx.shapers
    const [, into] = gainsBetween(ctx, sendA, shaper)
    expect(into.gain.value).toBeCloseTo(spaceDriveGains(12).into)
    expect(shaper.reaches(room)).toBe(true)
    expect(shaper.isConnectedTo(room)).toBe(false)

    // More drive is taken by the nodes that are there; none at all takes the saturators out.
    engine.setSpace({ driveDb: 18 })
    expect(ctx.shapers).toHaveLength(2)
    expect(into.gain.lastEvent('setTargetAtTime')?.args[0]).toBeCloseTo(spaceDriveGains(18).into)
    engine.setSpace()
    expect(sendA.reaches(shaper)).toBe(false)
    expect(sendA.reaches(room)).toBe(true)
  })

  it('moves a track to a room of its own when its strip does more than set a level, and back', () => {
    vi.useFakeTimers()
    try {
      const { ctx, engine, voice, master } = setup()
      const a = engine.addAudioTrack('a')
      const b = engine.addAudioTrack('b')
      const sendA = sendOf(a.play('k', voice(), 0))
      const sendB = sendOf(b.play('k', voice(), 0))
      const [shared] = ctx.convolvers

      a.strip.setPan(0.5)
      expect(ctx.convolvers).toHaveLength(2)
      const own = ctx.convolvers[1]
      expect(a.space).toBe(own)
      expect(sendA.isConnectedTo(own)).toBe(true)
      expect(sendA.reaches(shared)).toBe(false)
      // Its own room is ahead of its strip, as without sharing.
      expect(own.reaches(master)).toBe(true)
      expect(own.isConnectedTo(master)).toBe(false)
      // The other track stays where it was, and the shared room rings on.
      expect(sendB.reaches(shared)).toBe(true)
      expect(shared.isConnectedTo(master)).toBe(true)

      a.strip.setPan(0)
      expect(ctx.convolvers).toHaveLength(2)
      expect(a.space).toBe(shared)
      expect(sendA.reaches(shared)).toBe(true)
      expect(sendA.isConnectedTo(own)).toBe(false)
      // What it sent into its own room rings out there, and then that room goes.
      expect(own.reaches(master)).toBe(true)
      vi.advanceTimersByTime(60_000)
      expect(own.reaches(master)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('counts an insert that does more than change gain, and one that starts to', () => {
    const { ctx, engine, voice } = setup()
    const track = engine.addAudioTrack('a')
    const trim = createUtility(asAudioContext(ctx))
    track.strip.addInsert(trim)
    const send = sendOf(track.play('k', voice(), 0))
    const [shared] = ctx.convolvers
    expect(track.space).toBe(shared)

    trim.setParam('width', 0)
    expect(stripOnlySetsLevel(track.strip)).toBe(false)
    expect(track.space).not.toBe(shared)
    expect(send.reaches(shared)).toBe(false)

    trim.setParam('width', 1)
    expect(track.space).toBe(shared)

    trim.bypass = true
    expect(track.space).not.toBe(shared)
    trim.bypass = false

    // A second insert of its own level is followed too: the feed is made again for the strip as it is.
    const second = createUtility(asAudioContext(ctx), { params: { gainDb: -12 } })
    track.strip.addInsert(second)
    expect(track.space).toBe(shared)
    const levels = gainsBetween(ctx, send, shared)
    expect(levels.some((gain) => Math.abs(gain.gain.value - utilityGain(-12)) < 1e-9)).toBe(true)

    const echo = engine.addReturnTrack('echo', { device: createUtility(asAudioContext(ctx)) })
    track.strip.sends.add(echo)
    expect(stripOnlySetsLevel(track.strip)).toBe(false)
  })

  it('takes the shared room along when the engine gets another room', () => {
    vi.useFakeTimers()
    try {
      const { ctx, engine, voice, master } = setup()
      const a = engine.addAudioTrack('a')
      const send = sendOf(a.play('k', voice(), 0))
      const [before] = ctx.convolvers
      engine.setSpace({ decaySec: 8 })
      expect(ctx.convolvers).toHaveLength(2)
      const after = ctx.convolvers[1]
      expect(after.buffer).toBe(engine.spaceImpulse())
      expect(a.space).toBe(after)
      expect(send.reaches(after)).toBe(true)
      expect(send.reaches(before)).toBe(false)
      // The old room rings out before it goes.
      expect(before.isConnectedTo(master)).toBe(true)
      vi.advanceTimersByTime(60_000)
      expect(before.isConnectedTo(master)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it("keeps what hears the strip on the track's way into the room, through a change of room", () => {
    const { ctx, engine, voice } = setup()
    const track = engine.addAudioTrack('a')
    // A meter attached before the track first sounds, as a mixer view's is.
    const meter = ctx.createAnalyser()
    track.strip.tap(meter as unknown as AudioNode)
    const send = sendOf(track.play('k', voice(), 0))
    const [room] = ctx.convolvers
    const gate = gainsBetween(ctx, send, room).at(-1)
    if (!gate) throw new Error('the track has no level on its way in')
    expect(gate.isConnectedTo(meter)).toBe(true)
    engine.setSpace({ driveDb: 6, decaySec: 8 })
    expect(gate.isConnectedTo(meter)).toBe(true)
    expect(gate.reaches(ctx.convolvers.at(-1) as MockAudioNode)).toBe(true)
    engine.setSpace({ driveDb: 0 })
    expect(gate.isConnectedTo(meter)).toBe(true)
    engine.dispose()
  })

  it('takes a room nobody sends into down once its tail is over, and keeps one that is joined again', () => {
    vi.useFakeTimers()
    try {
      const { ctx, engine, voice, master } = setup()
      const a = engine.addAudioTrack('a')
      a.play('k', voice(), 0)
      const [room] = ctx.convolvers
      engine.removeTrack('a')
      expect(room.isConnectedTo(master)).toBe(true)

      const b = engine.addAudioTrack('b')
      b.play('k', voice(), 0)
      expect(ctx.convolvers).toHaveLength(1)
      vi.advanceTimersByTime(60_000)
      expect(room.isConnectedTo(master)).toBe(true)

      engine.removeTrack('b')
      vi.advanceTimersByTime(60_000)
      expect(room.isConnectedTo(master)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaves every track a room of its own without the option', () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const engine = createEngine({ context: asAudioContext(ctx) })
    const buffer = ctx.createBuffer(2, 48000, 48000) as unknown as AudioBuffer
    const voice = {
      buffer,
      offsetSec: 0,
      durationSec: 1,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear' as const,
      spaceDb: -6,
    }
    engine.addAudioTrack('a').play('k', voice, 0)
    engine.addAudioTrack('b').play('k', voice, 0)
    expect(ctx.convolvers).toHaveLength(2)
  })
})
