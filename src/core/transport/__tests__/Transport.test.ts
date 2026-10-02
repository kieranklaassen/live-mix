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

describe('Transport counted pass', () => {
  const LOOP = { enabled: true, lengthSec: 4 }

  it('starts at 0 and counts each time the loop comes round', () => {
    const { ctx, transport } = build(LOOP)
    expect(transport.pass()).toBe(0)
    transport.start()
    ctx.currentTime = 3.9
    expect(transport.pass()).toBe(0)
    ctx.currentTime = 9.5
    expect(transport.pass()).toBe(2)
    expect(transport.pass(4.5)).toBe(1)
    expect(transport.passOf(transport.position().iteration + 1)).toBe(3)
  })

  it('keeps the count through a pause, a seek and a loop change, where the iteration moves on', () => {
    const { ctx, transport } = build(LOOP)
    transport.start()
    ctx.currentTime = 9.5
    transport.pause()
    expect(transport.pass()).toBe(2)
    transport.seek(1)
    expect(transport.pass()).toBe(2)
    transport.start()
    expect(transport.pass()).toBe(2)
    ctx.currentTime = 10
    transport.seek(3.5)
    expect(transport.pass()).toBe(2)
    transport.setLoop({ enabled: false })
    transport.setLoop({ enabled: true })
    expect(transport.pass()).toBe(2)
    // Each re-pin took a fresh iteration; the count did not follow it.
    expect(transport.position().iteration).toBeGreaterThan(2)
    ctx.currentTime = 11
    expect(transport.pass()).toBe(3)
  })

  it('goes back to 0 on stop, also from a stop at 0', () => {
    const { ctx, transport, changes } = build(LOOP)
    transport.start()
    ctx.currentTime = 9.5
    transport.stop()
    expect(transport.pass()).toBe(0)
    transport.setPass(5)
    expect(transport.pass()).toBe(5)
    changes.length = 0
    transport.stop()
    expect(transport.pass()).toBe(0)
    expect(changes.map((change) => change.reason)).toEqual(['stop'])
    // Nothing left to go back from.
    transport.stop()
    expect(changes).toHaveLength(1)
  })

  it('setPass puts the count anywhere, as a seek to where the transport is', () => {
    const { ctx, transport, changes } = build(LOOP)
    transport.start()
    ctx.currentTime = 5.5
    const before = transport.position()
    changes.length = 0
    transport.setPass(13)
    expect(transport.pass()).toBe(13)
    expect(changes.map((change) => change.reason)).toEqual(['seek'])
    expect(transport.position().positionSec).toBe(before.positionSec)
    expect(transport.position().iteration).toBeGreaterThan(before.iteration)
    ctx.currentTime = 8.5
    expect(transport.pass()).toBe(14)
    // The same pass again is no change; below 0 is 0; a fraction is its whole pass.
    changes.length = 0
    transport.setPass(14)
    expect(changes).toEqual([])
    transport.setPass(-3)
    expect(transport.pass()).toBe(0)
    transport.setPass(2.9)
    expect(transport.pass()).toBe(2)
    expect(() => transport.setPass(Number.NaN)).toThrow(RangeError)
  })

  it('stays where it is with the loop off', () => {
    const { ctx, transport } = build({ enabled: false, lengthSec: 4 })
    transport.setPass(3)
    transport.start()
    ctx.currentTime = 3
    expect(transport.pass()).toBe(3)
  })

  it('keeps counting through a change of rate, at the speed the loop now comes round', () => {
    const { ctx, transport } = build(LOOP)
    transport.setPass(5)
    transport.start()
    // Two times round at the clock's speed, then half speed from the middle of the third.
    ctx.currentTime = 10
    expect(transport.pass()).toBe(7)
    transport.setRate(0.5)
    expect(transport.pass()).toBe(7)
    expect(transport.passOf(transport.position().iteration + 1)).toBe(8)
    // 2 s of timeline left in the pass: 4 s of clock at half speed.
    ctx.currentTime = 13.9
    expect(transport.pass()).toBe(7)
    ctx.currentTime = 14.1
    expect(transport.pass()).toBe(8)
    transport.setRate(2)
    ctx.currentTime = 20
    // 0.05 s into pass 8, then 5.9 s of clock at double speed: 11.85 s of timeline on.
    expect(transport.pass()).toBe(10)
    transport.pause()
    expect(transport.pass()).toBe(10)
  })
})

describe('Transport rate', () => {
  it('runs at the clock by default and takes a rate on construction', () => {
    expect(build().transport.rate).toBe(1)
    expect(new Transport({ now: () => 0, rate: 0.5 }).rate).toBe(0.5)
  })

  it('moves along the timeline that much faster or slower than the clock', () => {
    const { ctx, transport } = build()
    transport.setRate(0.5)
    ctx.currentTime = 10
    transport.start()
    ctx.currentTime = 14
    expect(transport.position().positionSec).toBe(2)
    transport.setRate(2)
    ctx.currentTime = 15
    expect(transport.position().positionSec).toBe(4)
  })

  it('carries on from where it is when the rate changes, on the pass it is in', () => {
    const { ctx, transport, changes } = build({ enabled: true, lengthSec: 4 })
    transport.start()
    ctx.currentTime = 9.5
    const before = transport.position()
    transport.setRate(1.25)
    expect(transport.position()).toEqual(before)
    // Re-pinned here and now, without a new pass number: handed-over starts keep their keys.
    expect(transport.anchor).toEqual({ contextTime: 9.5, positionSec: 1.5, iteration: 2 })
    expect(changes.at(-1)).toMatchObject({ reason: 'rate', state: 'playing', position: before })
    ctx.currentTime = 11.5
    // 2 s of clock is 2.5 s of timeline: through the loop's end into the next pass.
    expect(transport.position()).toEqual({ positionSec: 0, iteration: 3, finished: false })
  })

  it('numbers the pass after a seek past every pass a faster rate ran through', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 4 })
    transport.start()
    transport.setRate(2)
    ctx.currentTime = 9
    expect(transport.position().iteration).toBe(4)
    transport.setRate(1)
    transport.seek(1)
    expect(transport.anchor?.iteration).toBe(5)
  })

  it('maps a timeline position to the clock at the rate', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 4 })
    ctx.currentTime = 100
    transport.seek(1)
    transport.setRate(0.5)
    transport.start()
    expect(transport.contextTimeAt(1)).toBe(100)
    expect(transport.contextTimeAt(3)).toBe(104)
    expect(transport.contextTimeAt(0.5, 2)).toBe(100 + 16 - 1)
  })

  it('keeps a start pinned ahead of the clock where it was pinned', () => {
    const { ctx, transport } = build()
    ctx.currentTime = 10
    transport.start(10.5)
    transport.setRate(2)
    expect(transport.anchor).toEqual({ contextTime: 10.5, positionSec: 0, iteration: 0 })
    ctx.currentTime = 11
    expect(transport.position().positionSec).toBe(1)
  })

  it('keeps the rate while stopped or paused and through a seek, a loop change and a stop', () => {
    const { ctx, transport, changes } = build({ enabled: true, lengthSec: 8 })
    transport.setRate(0.5)
    expect(changes.map((change) => change.reason)).toEqual(['rate'])
    expect(transport.position().positionSec).toBe(0)
    transport.start()
    ctx.currentTime = 2
    transport.seek(4)
    transport.setLoop({ lengthSec: 16 })
    ctx.currentTime = 4
    expect(transport.position().positionSec).toBe(5)
    transport.stop()
    expect(transport.rate).toBe(0.5)
  })

  it('reaches the end of a timeline with the loop off when the timeline does, not the clock', () => {
    const { ctx, transport } = build({ lengthSec: 4 })
    transport.setRate(2)
    transport.start()
    ctx.currentTime = 1.9
    expect(transport.position().finished).toBe(false)
    ctx.currentTime = 2
    expect(transport.position()).toEqual({ positionSec: 4, iteration: 0, finished: true })
  })

  it('says nothing when the rate is the one it has, and refuses one that is not a positive number', () => {
    const { transport, changes } = build()
    transport.setRate(1)
    expect(changes).toEqual([])
    expect(() => transport.setRate(0)).toThrow(RangeError)
    expect(() => transport.setRate(-1)).toThrow(RangeError)
    expect(() => transport.setRate(Number.NaN)).toThrow(RangeError)
    expect(() => transport.setRate(Infinity)).toThrow(RangeError)
    expect(() => new Transport({ now: () => 0, rate: 0 })).toThrow(RangeError)
  })
})

describe('Transport.nudge', () => {
  it('slides the position without re-pinning or announcing', () => {
    const { ctx, transport, changes } = build({ enabled: true, lengthSec: 8 })
    ctx.currentTime = 10
    transport.start()
    ctx.currentTime = 13
    const before = changes.length
    transport.nudge(0.004)
    expect(transport.position().positionSec).toBeCloseTo(3.004, 9)
    expect(transport.position().iteration).toBe(0)
    expect(transport.anchor?.iteration).toBe(0)
    expect(changes).toHaveLength(before)
    transport.nudge(-0.01)
    expect(transport.position().positionSec).toBeCloseTo(2.994, 9)
  })

  it('moves when later starts fall on the audio clock, by the same amount', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 8 })
    ctx.currentTime = 10
    transport.start()
    expect(transport.contextTimeAt(4)).toBe(14)
    transport.nudge(0.25)
    // The timeline is a quarter second further on, so 4 s comes that much sooner.
    expect(transport.contextTimeAt(4)).toBeCloseTo(13.75, 9)
    expect(transport.contextTimeAt(4, 1)).toBeCloseTo(21.75, 9)
  })

  it('keeps the pass numbers across the loop end', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 8 })
    transport.start()
    ctx.currentTime = 7.999
    transport.nudge(0.002)
    expect(transport.position().iteration).toBe(1)
    expect(transport.position().positionSec).toBeCloseTo(0.001, 9)
    transport.nudge(-0.002)
    expect(transport.position().iteration).toBe(0)
    expect(transport.position().positionSec).toBeCloseTo(7.999, 9)
  })

  it('slides by timeline time at any rate', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 8 })
    ctx.currentTime = 10
    transport.start()
    ctx.currentTime = 12
    transport.setRate(0.5)
    ctx.currentTime = 14
    // Two seconds at full speed and two at half: 3 s along.
    transport.nudge(0.01)
    expect(transport.position().positionSec).toBeCloseTo(3.01, 9)
    // And 4 s is 0.99 s of timeline away, which takes twice that on the clock.
    expect(transport.contextTimeAt(4)).toBeCloseTo(14 + 0.99 * 2, 9)
  })

  it('does nothing while stopped or paused, or with no real amount', () => {
    const { ctx, transport } = build()
    transport.nudge(1)
    expect(transport.position().positionSec).toBe(0)
    transport.start()
    ctx.currentTime = 2
    transport.nudge(Number.NaN)
    transport.nudge(0)
    expect(transport.position().positionSec).toBe(2)
    transport.pause()
    transport.nudge(1)
    expect(transport.position().positionSec).toBe(2)
  })
})

describe('Transport.rescale', () => {
  it('stretches the position and the loop and keeps the moment', () => {
    const { ctx, transport, changes } = build({ enabled: true, lengthSec: 32 })
    ctx.currentTime = 100
    transport.start()
    ctx.currentTime = 110
    // 120 bpm to 100 bpm: everything is 1.2 times as far along in seconds.
    transport.rescale(1.2, 38.4)
    expect(transport.loop).toEqual({ enabled: true, lengthSec: 38.4 })
    expect(transport.position().positionSec).toBeCloseTo(12, 9)
    expect(transport.position().iteration).toBe(0)
    expect(transport.anchor?.contextTime).toBe(110)
    expect(changes.at(-1)?.reason).toBe('loop')
    expect(transport.state).toBe('playing')
    // From here it runs a second a second, to the new loop end.
    ctx.currentTime = 111
    expect(transport.position().positionSec).toBeCloseTo(13, 9)
    expect(transport.contextTimeAt(0, 1)).toBeCloseTo(110 + 26.4, 9)
  })

  it('keeps the pass it is on, and hands out later passes after it', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 8 })
    transport.start()
    ctx.currentTime = 20
    expect(transport.position().iteration).toBe(2)
    transport.rescale(0.5)
    expect(transport.loop.lengthSec).toBe(4)
    expect(transport.position()).toMatchObject({ positionSec: 2, iteration: 2 })
    transport.seek(1)
    expect(transport.anchor?.iteration).toBe(3)
  })

  it('moves a transport that is not playing', () => {
    const { transport, changes } = build({ enabled: true, lengthSec: 32 })
    transport.seek(10)
    transport.rescale(0.5)
    expect(transport.position().positionSec).toBe(5)
    expect(transport.loop.lengthSec).toBe(16)
    expect(transport.state).toBe('stopped')
    expect(changes.at(-1)?.reason).toBe('loop')
  })

  it('leaves a start pinned in the future at its moment', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 32 })
    ctx.currentTime = 50
    transport.seek(8)
    transport.start(51.5)
    transport.rescale(2)
    expect(transport.anchor).toEqual({ contextTime: 51.5, positionSec: 16, iteration: 0 })
    ctx.currentTime = 52
    expect(transport.position().positionSec).toBe(16.5)
  })

  it('does nothing for a ratio of one, and refuses one that is not a size', () => {
    const { transport, changes } = build({ enabled: true, lengthSec: 32 })
    transport.rescale(1)
    expect(changes).toHaveLength(0)
    expect(() => transport.rescale(0)).toThrow(RangeError)
    expect(() => transport.rescale(Number.NaN)).toThrow(RangeError)
  })

  it('leaves an endless timeline endless', () => {
    const { ctx, transport } = build()
    transport.start()
    ctx.currentTime = 6
    transport.rescale(1.5)
    expect(transport.loop.lengthSec).toBe(Infinity)
    expect(transport.position().positionSec).toBe(9)
  })

  it('stretches a transport running at another rate from where it is', () => {
    const { ctx, transport } = build({ enabled: true, lengthSec: 32 })
    ctx.currentTime = 100
    transport.start()
    transport.setRate(0.5)
    ctx.currentTime = 120
    // Twenty seconds of clock at half speed: 10 s along.
    transport.rescale(1.2, 38.4)
    expect(transport.rate).toBe(0.5)
    expect(transport.position().positionSec).toBeCloseTo(12, 9)
    ctx.currentTime = 122
    expect(transport.position().positionSec).toBeCloseTo(13, 9)
  })
})
