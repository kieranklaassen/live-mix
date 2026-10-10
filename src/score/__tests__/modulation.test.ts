import { describe, expect, it } from 'vitest'

import { Lfo, Random } from '../../core/automation/Modulator'
import { paramModSource, paramModSourceValue } from '../../core/automation/param-modulation'
import { scoreDeviceModulations, scoreParamModulation } from '../modulation'
import { demoScore } from './fixtures'

describe('scoreParamModulation', () => {
  it('gives the routes onto a device parameter from the top of the clock', () => {
    const score = demoScore()
    const modulation = scoreParamModulation(score, 'kick-filter', 'frequency')
    expect(modulation).toEqual({
      routes: [
        {
          source: {
            kind: 'lfo',
            shape: 'sine',
            rateHz: 0.5,
            depth: 1,
            anchorPhase: 0,
            anchorSec: 0,
          },
          depth: 0.3,
          polarity: 'bipolar',
        },
      ],
    })
    // The same numbers the renderer's own source gives a device.
    const live = new Lfo({ rateHz: 0.5, shape: 'sine', depth: 1, phase: 0, startSec: 0 })
    expect(modulation?.routes[0].source).toEqual(paramModSource(live))
  })

  it('starts an LFO at the phase the score gives it, and seeded noise at its seed', () => {
    const score = demoScore()
    score.modulators = [
      { id: 'lfo1', kind: 'lfo', rateHz: 2, shape: 'saw', depth: 0.5, phase: 0.25 },
      { id: 'drift', kind: 'random', rateHz: 3, seed: 9, smooth: true },
    ]
    score.routes.push({
      id: 'r2',
      source: 'drift',
      target: { kind: 'device', device: 'kick-filter', param: 'frequency' },
      depth: -0.1,
      polarity: 'unipolar',
    })
    const modulation = scoreParamModulation(score, 'kick-filter', 'frequency')
    expect(modulation?.routes).toHaveLength(2)
    const [lfo, drift] = modulation?.routes ?? []
    const saw = new Lfo({ rateHz: 2, shape: 'saw', depth: 0.5, phase: 0.25, startSec: 0 })
    const noise = new Random({ rateHz: 3, seed: 9, smooth: true })
    for (const t of [0, 0.1, 1.37, 44.4]) {
      expect(paramModSourceValue(lfo.source, t)).toBe(saw.valueAtTime(t))
      expect(paramModSourceValue(drift.source, t)).toBe(noise.valueAtTime(t))
    }
    expect(drift).toMatchObject({ depth: -0.1, polarity: 'unipolar' })
  })

  it('is null for a parameter nothing is routed to, and for another device', () => {
    const score = demoScore()
    expect(scoreParamModulation(score, 'kick-filter', 'q')).toBeNull()
    expect(scoreParamModulation(score, 'glue', 'frequency')).toBeNull()
  })

  it('is null where the renderer would use the matrix: a lane, or a source that is no function of time', () => {
    const laned = demoScore()
    laned.lanes.push({
      id: 'cutoff',
      target: { kind: 'device', device: 'kick-filter', param: 'frequency' },
      breakpoints: [{ timeSec: 0, value: 500 }],
    })
    expect(scoreParamModulation(laned, 'kick-filter', 'frequency')).toBeNull()
    const byHand = demoScore()
    byHand.modulators = [{ id: 'lfo1', kind: 'macro', value: 0.4 }]
    expect(scoreParamModulation(byHand, 'kick-filter', 'frequency')).toBeNull()
    const orphan = demoScore()
    orphan.modulators = []
    expect(scoreParamModulation(orphan, 'kick-filter', 'frequency')).toBeNull()
  })

  it('scoreDeviceModulations lists a device’s moved parameters by name', () => {
    const score = demoScore()
    score.routes.push({
      id: 'r2',
      source: 'lfo1',
      target: { kind: 'device', device: 'kick-filter', param: 'q' },
      depth: 0.1,
      polarity: 'unipolar',
    })
    const found = scoreDeviceModulations(score, 'kick-filter')
    expect(Object.keys(found).sort()).toEqual(['frequency', 'q'])
    expect(found.q.routes[0]).toMatchObject({ depth: 0.1, polarity: 'unipolar' })
    expect(scoreDeviceModulations(score, 'glue')).toEqual({})
  })
})
