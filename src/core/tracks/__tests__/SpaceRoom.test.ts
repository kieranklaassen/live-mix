import { describe, expect, it, vi } from 'vitest'

import {
  asAudioContext,
  createMockContext,
  type MockAudioContext,
  type MockAudioNode,
} from '../../../testing'
import {
  MIN_SPACE_TILT,
  SPACE_TILT_RETURN_DB_PER_SECOND,
  SpaceRoom,
  type SpaceRoomSettings,
} from '../SpaceRoom'

type MockGain = MockAudioContext['gains'][number]

function setup(colour: Partial<SpaceRoomSettings> = {}) {
  const ctx = createMockContext({ sampleRate: 48000 })
  const strip = ctx.createGain()
  const connected = new Set<MockAudioNode>()
  const room = new SpaceRoom(
    asAudioContext(ctx),
    {
      connect: (node) => {
        connected.add(node as unknown as MockAudioNode)
        node.connect(strip as unknown as AudioNode)
      },
      forget: (node) => {
        connected.delete(node as unknown as MockAudioNode)
      },
      setTimeoutFn: vi.fn(() => 1),
      clearTimeoutFn: vi.fn(),
    },
    {
      impulse: ctx.createBuffer(2, 48000, 48000) as unknown as AudioBuffer,
      driveDb: 0,
      driftCents: 0,
      driftHz: 0.1,
      ...colour,
    },
  )
  const [convolver] = ctx.convolvers
  /** The gains the tilt put ahead of the convolver and after everything else. */
  const tiltGains = (): { pre: MockGain; post: MockGain } => {
    const pre = ctx.gains.find((gain) => gain !== strip && gain.isConnectedTo(convolver))
    const post = ctx.gains.find((gain) => gain !== strip && gain.isConnectedTo(strip))
    if (!pre || !post) throw new Error('the room has not been tilted')
    return { pre, post }
  }
  return { ctx, strip, connected, room, convolver, tiltGains }
}

const ramps = (gain: MockGain): unknown[][] =>
  gain.gain.eventsFor('exponentialRampToValueAtTime').map((event) => event.args)

describe('SpaceRoom.tilt', () => {
  it('leaves a room that was never tilted as the convolver alone', () => {
    const { ctx, strip, connected, room, convolver } = setup()
    expect(room.entry).toBe(convolver)
    expect(convolver.isConnectedTo(strip)).toBe(true)
    expect([...connected]).toEqual([convolver])
    expect(ctx.gains).toEqual([strip])
  })

  it('puts a gain either side of the convolver and hands back where sends went in', () => {
    const { connected, strip, room, convolver, tiltGains } = setup()
    expect(room.tilt(0.1, 2, 0.04)).toBe(convolver)
    const { pre, post } = tiltGains()
    expect(room.entry).toBe(pre)
    expect(pre.isConnectedTo(convolver)).toBe(true)
    expect(convolver.isConnectedTo(post)).toBe(true)
    expect(convolver.isConnectedTo(strip)).toBe(false)
    expect(post.isConnectedTo(strip)).toBe(true)
    // The strip knows the room by what feeds it now.
    expect([...connected]).toEqual([post])
  })

  it('turns what rings down and what comes in up by as much, then returns both slowly', () => {
    const { room, tiltGains } = setup()
    room.tilt(0.1, 2, 0.04)
    const { pre, post } = tiltGains()
    const restAt = 2.04 + 20 / SPACE_TILT_RETURN_DB_PER_SECOND
    expect(post.gain.events[0]).toEqual({ method: 'setValueAtTime', args: [1, 2] })
    expect(ramps(post)).toEqual([
      [0.1, 2.04],
      [1, restAt],
    ])
    expect(ramps(pre)[0][0]).toBeCloseTo(10, 12)
    expect(ramps(pre)[0][1]).toBe(2.04)
    expect(ramps(pre)[1]).toEqual([1, restAt])
  })

  it('takes a second tilt from where the first was going, and the sends stay where they are', () => {
    const { room, tiltGains } = setup()
    room.tilt(0.5, 2, 0.04)
    const { pre, post } = tiltGains()
    expect(room.tilt(0.5, 2.01, 0.04)).toBeNull()
    expect(post.gain.lastEvent('cancelAndHoldAtTime')?.args).toEqual([2.01])
    expect(pre.gain.lastEvent('cancelAndHoldAtTime')?.args).toEqual([2.01])
    const [down] = ramps(post).slice(-2)
    expect(down[0]).toBeCloseTo(0.25, 12)
    expect(down[1]).toBeCloseTo(2.05, 12)
    expect(ramps(pre).slice(-2)[0][0]).toBeCloseTo(4, 12)
  })

  it('takes a tilt made while the room returns from where it has come back to', () => {
    const { room, tiltGains } = setup()
    room.tilt(0.1, 0, 0)
    const { post } = tiltGains()
    // 10 s to come back 20 dB: halfway is 10 dB under.
    room.tilt(0.5, 5.001, 0.04)
    expect(ramps(post).slice(-2)[0][0]).toBeCloseTo(0.5 * 10 ** -0.5, 3)
  })

  it('gives back what an earlier tilt took and no more', () => {
    const { ctx, strip, room, tiltGains } = setup()
    // Nothing was taken: nothing to give back, and no gains are made for it.
    expect(room.tilt(4, 1, 0.04)).toBeNull()
    expect(ctx.gains).toEqual([strip])
    room.tilt(0.5, 2, 0.04)
    const { pre, post } = tiltGains()
    room.tilt(8, 3, 0.04)
    expect(ramps(post).slice(-1)).toEqual([[1, 3.04]])
    expect(ramps(pre).slice(-1)).toEqual([[1, 3.04]])
    const events = post.gain.events.length
    room.tilt(2, 4, 0.04)
    expect(post.gain.events).toHaveLength(events)
  })

  it('goes no further down than the floor, and ignores a ratio that is no number', () => {
    const { ctx, strip, room, tiltGains } = setup()
    expect(room.tilt(Number.NaN, 1, 0.04)).toBeNull()
    expect(room.tilt(-1, 1, 0.04)).toBeNull()
    expect(ctx.gains).toEqual([strip])
    room.tilt(0, 1, 0.04)
    const { pre, post } = tiltGains()
    expect(ramps(post)[0][0]).toBe(MIN_SPACE_TILT)
    expect(ramps(pre)[0][0]).toBeCloseTo(1 / MIN_SPACE_TILT, 6)
  })

  it('tilts a driven room after its saturator, so sends stay where they are', () => {
    const { ctx, room, convolver, tiltGains } = setup({ driveDb: 12 })
    const entry = room.entry
    expect(room.tilt(0.5, 1, 0.04)).toBeNull()
    expect(room.entry).toBe(entry)
    const { pre } = tiltGains()
    const [shaper] = ctx.shapers
    const outOf = ctx.gains.find((gain) => shaper.isConnectedTo(gain))
    expect(outOf?.isConnectedTo(pre)).toBe(true)
    expect(outOf?.isConnectedTo(convolver)).toBe(false)
  })

  it('tilts a drifting room after its delay', () => {
    const { ctx, strip, room, convolver, tiltGains } = setup({ driftCents: 8 })
    room.tilt(0.5, 1, 0.04)
    const { post } = tiltGains()
    const [delay] = ctx.delays
    expect(convolver.isConnectedTo(delay)).toBe(true)
    expect(delay.isConnectedTo(post)).toBe(true)
    expect(delay.isConnectedTo(strip)).toBe(false)
  })

  it('starts level again when the room becomes another one', () => {
    const { ctx, room, tiltGains } = setup()
    room.tilt(0.5, 1, 0.04)
    const { pre } = tiltGains()
    expect(
      room.set({
        impulse: ctx.createBuffer(2, 4800, 48000) as unknown as AudioBuffer,
        driveDb: 0,
        driftCents: 0,
        driftHz: 0.1,
      }),
    ).toBe(pre)
    const [, next] = ctx.convolvers
    expect(room.entry).toBe(next)
    expect(room.tilt(0.5, 2, 0.04)).toBe(next)
  })

  it('takes its saturator down with it', () => {
    const { ctx, room } = setup({ driveDb: 12, driftCents: 8 })
    room.tilt(0.5, 1, 0.04)
    room.dispose()
    const stillConnected = ctx
      .allNodes()
      .filter((node) => node.outputs.size > 0)
      .map((node) => node.kind)
    expect(stillConnected).toEqual([])
  })

  it('takes its gains down with it, and is not tilted once it has been left', () => {
    const { connected, strip, room, tiltGains } = setup()
    room.tilt(0.5, 1, 0.04)
    const { pre, post } = tiltGains()
    room.leave()
    const events = post.gain.events.length
    expect(room.tilt(0.5, 2, 0.04)).toBeNull()
    expect(post.gain.events).toHaveLength(events)
    room.dispose()
    expect(pre.outputs.size).toBe(0)
    expect(post.isConnectedTo(strip)).toBe(false)
    expect(connected.size).toBe(0)
  })
})
