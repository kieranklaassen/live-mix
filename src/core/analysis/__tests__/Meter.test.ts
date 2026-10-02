import { describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext } from '../../../testing'
import { Meter } from '../Meter'

describe('Meter', () => {
  it('reads peak and RMS of the window, each held to 1', () => {
    const ctx = createMockContext()
    const meter = new Meter(asAudioContext(ctx))
    const [analyser] = ctx.analysers
    analyser.getFloatTimeDomainData = (array: Float32Array) => {
      for (let i = 0; i < array.length; i += 1) array[i] = i % 2 === 0 ? 0.5 : -0.25
    }
    expect(meter.peak()).toBe(0.5)
    expect(meter.rms()).toBeCloseTo(Math.sqrt((0.25 + 0.0625) / 2), 6)
    analyser.getFloatTimeDomainData = (array: Float32Array) => array.fill(-3)
    expect(meter.levels()).toEqual({ peak: 1, rms: 1 })
  })

  it('levels reads the analyser once for both', () => {
    const ctx = createMockContext()
    const meter = new Meter(asAudioContext(ctx))
    const [analyser] = ctx.analysers
    analyser.level = 0.25
    const read = vi.spyOn(analyser, 'getFloatTimeDomainData')
    expect(meter.levels()).toEqual({ peak: 0.25, rms: 0.25 })
    expect(read).toHaveBeenCalledTimes(1)
  })
})
