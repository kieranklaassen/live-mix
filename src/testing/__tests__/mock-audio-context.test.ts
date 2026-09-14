import { describe, expect, it } from 'vitest'

import { MockAudioContext, MockGainNode } from '../index'

describe('MockAudioContext recorder', () => {
  it('records AudioParam automation calls in order', () => {
    const ctx = new MockAudioContext()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, 1)
    gain.gain.setValueCurveAtTime(new Float32Array([0, 1]), 1, 2.5)
    gain.gain.setTargetAtTime(0.5, 3, 0.08)

    expect(gain.gain.events.map((e) => e.method)).toEqual([
      'setValueAtTime',
      'setValueCurveAtTime',
      'setTargetAtTime',
    ])
    expect(gain.gain.eventsFor('setValueCurveAtTime')[0].args[2]).toBe(2.5)
    expect(gain.gain.lastEvent('setTargetAtTime')?.args).toEqual([0.5, 3, 0.08])
  })

  it('records connections and can answer reachability', () => {
    const ctx = new MockAudioContext()
    const a = ctx.createGain()
    const b = ctx.createGain()
    a.connect(b)
    b.connect(ctx.destination)

    expect(a.connectCalls.calledWith(b)).toBe(true)
    expect(a.isConnectedTo(ctx.destination)).toBe(false)
    expect(a.reaches(ctx.destination)).toBe(true)

    b.disconnect()
    expect(a.reaches(ctx.destination)).toBe(false)
    expect(ctx.gains).toEqual([a, b])
    expect(a).toBeInstanceOf(MockGainNode)
  })

  it('decodes to a buffer whose duration equals the byte length', async () => {
    const ctx = new MockAudioContext()
    const buffer = await ctx.decodeAudioData(new ArrayBuffer(8))
    expect(buffer.duration).toBe(8)
    expect(ctx.decodeCalls.count).toBe(1)
  })

  it('records buffer source start/stop calls', () => {
    const ctx = new MockAudioContext()
    const source = ctx.createBufferSource()
    source.start(1.5, 0.25, 4)
    source.stop(5.5)
    expect(source.startCalls.calledWith(1.5)).toBe(true)
    expect(source.startCalls.last).toEqual([1.5, 0.25, 4])
    expect(source.stopCalls.last).toEqual([5.5])
  })
})
