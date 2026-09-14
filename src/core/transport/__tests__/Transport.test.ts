import { describe, expect, it } from 'vitest'

import { MockAudioContext } from '../../../testing'
import { Transport, type TransportChange, type TransportOptions } from '../Transport'

function build(loop?: TransportOptions['loop']) {
  const ctx = new MockAudioContext()
  const transport = new Transport({ now: () => ctx.currentTime, loop })
  const changes: TransportChange[] = []
  transport.onChange((change) => changes.push(change))
  return { ctx, transport, changes }
}

describe('Transport anchor math', () => {
  it('starts stopped at 0 with no anchor and an endless, loop-off timeline', () => {
    const { transport } = build()
    expect(transport.state).toBe('stopped')
    expect(transport.anchor).toBeNull()
    expect(transport.loop).toEqual({ enabled: false, lengthSec: Infinity })
    expect(transport.position()).toEqual({ positionSec: 0, iteration: 0, finished: false })
  })

  it('derives the position from the audio clock once started', () => {
    const { ctx, transport } = build()
    ctx.currentTime = 10
    transport.start()
    expect(transport.anchor).toEqual({ contextTime: 10, positionSec: 0, iteration: 0 })
    ctx.currentTime = 12.25
    expect(transport.position().positionSec).toBe(2.25)
    expect(transport.position(11).positionSec).toBe(1)
  })

  it('wraps and numbers passes when looping', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 4 })
    transport.start()
    ctx.currentTime = 9.5
    expect(transport.position()).toEqual({ positionSec: 1.5, iteration: 2, finished: false })
  })

  it('maps a timeline position of a pass back to the audio clock', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 4 })
    ctx.currentTime = 100
    transport.seek(1)
    transport.start()
    expect(transport.contextTimeAt(1)).toBe(100)
    expect(transport.contextTimeAt(3)).toBe(102)
    expect(transport.contextTimeAt(0.5, 2)).toBe(100 + 8 - 0.5)
  })

  it('maps positions without pass arithmetic when the loop is off', () => {
    const { ctx, transport } = build()
    ctx.currentTime = 100
    transport.start()
    expect(transport.contextTimeAt(7.5)).toBe(107.5)
    expect(transport.contextTimeAt(7.5, 5)).toBe(107.5)
  })

  it('refuses to map while not playing', () => {
    const { transport } = build()
    expect(() => transport.contextTimeAt(0)).toThrow(/not playing/)
  })

  it('reports the frozen position, not the clock, while paused or stopped', () => {
    const { ctx, transport } = build()
    transport.start()
    ctx.currentTime = 3
    transport.pause()
    ctx.currentTime = 30
    expect(transport.position().positionSec).toBe(3)
    transport.stop()
    ctx.currentTime = 40
    expect(transport.position().positionSec).toBe(0)
  })

  it('can pin the start in the future and idles at the start position until then', () => {
    const { ctx, transport } = build()
    ctx.currentTime = 10
    transport.seek(2)
    transport.start(10.5)
    expect(transport.anchor?.contextTime).toBe(10.5)
    expect(transport.position().positionSec).toBe(2)
    expect(transport.contextTimeAt(2)).toBe(10.5)
    ctx.currentTime = 11
    expect(transport.position().positionSec).toBe(2.5)
  })

  it('clamps a start time in the past to now', () => {
    const { ctx, transport } = build()
    ctx.currentTime = 10
    transport.start(3)
    expect(transport.anchor?.contextTime).toBe(10)
  })
})

describe('Transport iteration numbering across re-pins', () => {
  it('gives every pin a pass number no earlier pass ever had', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 4 })
    transport.start()
    expect(transport.anchor?.iteration).toBe(0)
    ctx.currentTime = 9 // wrapped twice: pass 2
    expect(transport.position().iteration).toBe(2)
    transport.pause()
    expect(transport.position().iteration).toBe(2)
    transport.start()
    expect(transport.anchor?.iteration).toBe(3)
    ctx.currentTime = 10
    transport.seek(0)
    expect(transport.anchor?.iteration).toBe(4)
    transport.stop()
    transport.start()
    expect(transport.anchor?.iteration).toBe(5)
  })

  it('numbers passes across anchors even without a wrap', () => {
    const { transport } = build()
    transport.start()
    transport.pause()
    transport.start()
    expect(transport.anchor?.iteration).toBe(1)
  })
})

describe('Transport pause at end', () => {
  it('reports finished at the end with the loop off and pauses there on pause()', () => {
    const { ctx, transport, changes } = build({ enabled: false, lengthSec: 8 })
    transport.start()
    ctx.currentTime = 7.9
    expect(transport.position().finished).toBe(false)
    ctx.currentTime = 9
    expect(transport.position()).toEqual({ positionSec: 8, iteration: 0, finished: true })
    expect(transport.state).toBe('playing')
    transport.pause()
    expect(transport.state).toBe('paused')
    expect(transport.position()).toEqual({ positionSec: 8, iteration: 0, finished: false })
    expect(changes.at(-1)?.reason).toBe('end')
  })

  it('never finishes when looping', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 8 })
    transport.start()
    ctx.currentTime = 800
    expect(transport.position().finished).toBe(false)
  })
})

describe('Transport seek', () => {
  it('re-pins to now at the new position while playing', () => {
    const { ctx, transport, changes } = build()
    transport.start()
    ctx.currentTime = 5
    transport.seek(20)
    expect(transport.anchor).toEqual({ contextTime: 5, positionSec: 20, iteration: 1 })
    ctx.currentTime = 6
    expect(transport.position().positionSec).toBe(21)
    expect(changes.at(-1)).toMatchObject({ reason: 'seek', state: 'playing' })
  })

  it('moves the idle position without starting', () => {
    const { transport } = build()
    transport.seek(12)
    expect(transport.state).toBe('stopped')
    expect(transport.anchor).toBeNull()
    expect(transport.position().positionSec).toBe(12)
    transport.start()
    expect(transport.anchor?.positionSec).toBe(12)
  })

  it('wraps into the loop when looping and clamps to the timeline otherwise', () => {
    const looping = build({ enabled: true, lengthSec: 8 })
    looping.transport.seek(9.5)
    expect(looping.transport.position().positionSec).toBe(1.5)
    looping.transport.seek(-1)
    expect(looping.transport.position().positionSec).toBe(7)

    const bounded = build({ enabled: false, lengthSec: 8 })
    bounded.transport.seek(9.5)
    expect(bounded.transport.position().positionSec).toBe(8)
    bounded.transport.seek(-1)
    expect(bounded.transport.position().positionSec).toBe(0)
  })

  it('rejects NaN', () => {
    const { transport } = build()
    expect(() => transport.seek(Number.NaN)).toThrow(RangeError)
  })
})

describe('Transport stop', () => {
  it('returns to 0, drops the anchor and passes the fade on', () => {
    const { ctx, transport, changes } = build()
    transport.start()
    ctx.currentTime = 3
    transport.stop({ fadeSec: 0.75 })
    expect(transport.state).toBe('stopped')
    expect(transport.anchor).toBeNull()
    expect(changes.at(-1)).toEqual({
      reason: 'stop',
      state: 'stopped',
      position: { positionSec: 0, iteration: 0, finished: false },
      fadeSec: 0.75,
    })
  })

  it('rewinds a paused transport and is silent when already stopped at 0', () => {
    const { transport, changes } = build()
    transport.seek(4)
    transport.stop()
    expect(transport.position().positionSec).toBe(0)
    const count = changes.length
    transport.stop()
    transport.pause()
    expect(changes.length).toBe(count)
  })

  it('treats a negative fade as none', () => {
    const { transport, changes } = build()
    transport.start()
    transport.stop({ fadeSec: -1 })
    expect(changes.at(-1)?.fadeSec).toBe(0)
  })
})

describe('Transport loop changes', () => {
  it('re-pins while playing so the position carries over into the new loop', () => {
    const { ctx, transport, changes } = build()
    transport.start()
    ctx.currentTime = 10
    transport.setLoop({ enabled: true, lengthSec: 4 })
    expect(transport.loop).toEqual({ enabled: true, lengthSec: 4 })
    expect(transport.anchor).toEqual({ contextTime: 10, positionSec: 2, iteration: 1 })
    expect(changes.at(-1)?.reason).toBe('loop')
    ctx.currentTime = 11
    expect(transport.position()).toEqual({ positionSec: 3, iteration: 1, finished: false })
  })

  it('normalises the idle position and ignores a no-op change', () => {
    const { transport, changes } = build()
    transport.seek(10)
    transport.setLoop({ enabled: true, lengthSec: 4 })
    expect(transport.position().positionSec).toBe(2)
    const count = changes.length
    transport.setLoop({ enabled: true })
    expect(changes.length).toBe(count)
  })

  it('rejects a non-positive length, on construction and later', () => {
    expect(() => new Transport({ now: () => 0, loop: { lengthSec: 0 } })).toThrow(RangeError)
    const { transport } = build()
    expect(() => transport.setLoop({ lengthSec: -2 })).toThrow(RangeError)
    expect(() => transport.setLoop({ lengthSec: Number.NaN })).toThrow(RangeError)
  })
})

describe('Transport change notifications', () => {
  it('reports each transition with the state and position after it', () => {
    const { ctx, transport, changes } = build({ enabled: true, lengthSec: 8 })
    transport.start()
    ctx.currentTime = 2
    transport.pause()
    transport.start()
    ctx.currentTime = 3
    transport.seek(5)
    transport.stop()
    expect(
      changes.map((change) => [change.reason, change.state, change.position.positionSec]),
    ).toEqual([
      ['start', 'playing', 0],
      ['pause', 'paused', 2],
      ['start', 'playing', 2],
      ['seek', 'playing', 5],
      ['stop', 'stopped', 0],
    ])
  })

  it('stops notifying after unsubscribe and ignores a repeated start', () => {
    const { transport } = build()
    const seen: string[] = []
    const off = transport.onChange((change) => seen.push(change.reason))
    transport.start()
    transport.start()
    off()
    transport.pause()
    expect(seen).toEqual(['start'])
  })
})
