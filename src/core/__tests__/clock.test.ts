import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext, createMockOfflineContext } from '../../testing'
import { startFloorSec, startLeadSec } from '../clock'
import { createEngine } from '../Engine'

const BLOCK = 128 / 48000

describe('startFloorSec and startLeadSec', () => {
  const device = (baseLatency: number | undefined) =>
    asAudioContext(createMockContext({ sampleRate: 48000, baseLatency }))

  it('are one device buffer and a block, and two blocks more for the hand-over', () => {
    const ctx = device(256 / 48000)
    expect(startFloorSec(ctx)).toBeCloseTo(3 * BLOCK, 12)
    expect(startLeadSec(ctx)).toBeCloseTo(5 * BLOCK, 12)
    const large = device(2048 / 48000)
    expect(startFloorSec(large)).toBeCloseTo(17 * BLOCK, 12)
    expect(startLeadSec(large)).toBeCloseTo(19 * BLOCK, 12)
  })

  it('take a device buffer smaller than a block as one block', () => {
    const ctx = device(0.001)
    expect(startFloorSec(ctx)).toBeCloseTo(2 * BLOCK, 12)
    expect(startLeadSec(ctx)).toBeCloseTo(4 * BLOCK, 12)
  })

  it('are 0 where there is no device buffer to go by', () => {
    for (const none of [undefined, 0, -1, Number.NaN, Infinity]) {
      expect(startFloorSec(device(none))).toBe(0)
      expect(startLeadSec(device(none))).toBe(0)
    }
    const offline = createMockOfflineContext() as unknown as BaseAudioContext
    expect(startFloorSec(offline)).toBe(0)
    expect(startLeadSec(offline)).toBe(0)
  })
})

describe('an engine on a device', () => {
  it('pins its transport the start lead ahead of the clock on Play and on a seek while playing', () => {
    const ctx = createMockContext({ sampleRate: 48000, baseLatency: 256 / 48000, currentTime: 10 })
    const engine = createEngine({ context: asAudioContext(ctx) })
    engine.transport.start()
    expect(engine.transport.anchor?.contextTime).toBeCloseTo(10 + 5 * BLOCK, 12)
    expect(engine.transport.position().positionSec).toBe(0)
    ctx.currentTime = 12
    engine.transport.seek(40)
    expect(engine.transport.anchor?.contextTime).toBeCloseTo(12 + 5 * BLOCK, 12)
    expect(engine.transport.position().positionSec).toBe(40)
    engine.dispose()
  })

  it('pins at the clock where the context has no device buffer', () => {
    const ctx = createMockContext({ sampleRate: 48000, currentTime: 10 })
    const engine = createEngine({ context: asAudioContext(ctx) })
    engine.transport.start()
    expect(engine.transport.anchor?.contextTime).toBe(10)
    engine.dispose()
  })
})
