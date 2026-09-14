import { describe, expect, it } from 'vitest'

import { MockAudioParam, asAudioNode, createMockContext } from '../../../testing'
import { type Device } from '../../devices/Device'
import { type ParamSpec, clampParam } from '../../params'
import { ModMatrix, audioParamTarget, deviceParamTarget, routeOffset } from '../ModMatrix'
import { Lfo, Macro } from '../Modulator'
import { ParamLane } from '../ParamLane'

/** A device that records `setParam` calls, standing in for a WASM or native device. */
function fakeDevice(): Device & { sets: [string, number][] } {
  const ctx = createMockContext()
  const node = asAudioNode(ctx.createGain())
  const params: Record<string, ParamSpec> = {
    cutoff: { id: 0, name: 'Cutoff', min: 100, max: 1100, default: 400, taper: 'log', unit: 'Hz' },
  }
  const values = new Map<string, number>([['cutoff', 400]])
  const sets: [string, number][] = []
  return {
    id: 'fake',
    input: node,
    output: node,
    params,
    latencySec: 0,
    bypass: false,
    sets,
    setParam(name, value) {
      const clamped = clampParam(params[name], value)
      values.set(name, clamped)
      sets.push([name, clamped])
    },
    getParam(name) {
      return values.get(name) ?? params[name].default
    },
    dispose() {},
  }
}

function calls(param: MockAudioParam): [string, ...unknown[]][] {
  return param.events.map((event) => [event.method, ...event.args])
}

describe('routeOffset', () => {
  it('scales the source by depth, unipolar from 0 and bipolar around the middle', () => {
    const macro = new Macro(0.75)
    const target = audioParamTarget(new MockAudioParam(), { min: 0, max: 1, base: 0 })
    expect(routeOffset({ source: macro, target, depth: 1, polarity: 'unipolar' }, 0)).toBe(0.75)
    expect(routeOffset({ source: macro, target, depth: 0.5, polarity: 'unipolar' }, 0)).toBe(0.375)
    expect(routeOffset({ source: macro, target, depth: 1, polarity: 'bipolar' }, 0)).toBe(0.5)
    expect(routeOffset({ source: macro, target, depth: -1, polarity: 'bipolar' }, 0)).toBe(-0.5)
  })
})

describe('ModMatrix', () => {
  it('adds every route onto the base as a fraction of the range and clamps', () => {
    const matrix = new ModMatrix()
    const target = audioParamTarget(new MockAudioParam(), { min: 100, max: 1100, base: 400 })
    const macro = new Macro(0.5)
    matrix.map(macro, target, 0.4)
    expect(matrix.valueAt(target, 0)).toBeCloseTo(400 + 0.4 * 0.5 * 1000, 9)

    matrix.map(new Macro(1), target, { depth: 1, polarity: 'bipolar' })
    expect(matrix.valueAt(target, 0)).toBe(1100)
    matrix.map(new Macro(0), target, { depth: 1, polarity: 'bipolar' })
    expect(matrix.valueAt(target, 0)).toBeCloseTo(600, 9)
  })

  it('clamps depth to −1..1 and treats a non-finite depth as none', () => {
    const matrix = new ModMatrix()
    const target = audioParamTarget(new MockAudioParam(), { min: 0, max: 1, base: 0.5 })
    expect(matrix.map(new Macro(1), target, 5).depth).toBe(1)
    expect(matrix.map(new Macro(1), target, Number.NaN).depth).toBe(0)
  })

  it('reads a lane as the base at the playhead and sources on the audio clock', () => {
    const matrix = new ModMatrix()
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 0 },
        { timeSec: 10, value: 1 },
      ],
    })
    const target = audioParamTarget(new MockAudioParam(), { min: 0, max: 1, base: lane })
    matrix.map(new Lfo({ rateHz: 1, depth: 1 }), target, 0.1)
    // playhead 5 s → base 0.5; context 100.25 s → LFO at its peak (1) → +0.1
    expect(matrix.modulatedValue(target, 5, 100.25)).toBeCloseTo(0.6, 9)
    expect(matrix.valueAt(target, 5)).toBeCloseTo(
      0.5 + 0.1 * (Math.sin(5 * Math.PI * 2) * 0.5 + 0.5),
      9,
    )
  })

  it('renders the modulated curve offline', () => {
    const matrix = new ModMatrix()
    const target = audioParamTarget(new MockAudioParam(), { min: 0, max: 1, base: 0.5 })
    matrix.map(new Lfo({ rateHz: 1, depth: 1 }), target, { depth: 0.5, polarity: 'bipolar' })
    const curve = matrix.render(target, 0, 1, 4)
    expect(curve[0]).toBeCloseTo(0.5, 6)
    expect(curve[1]).toBeCloseTo(1, 6)
    expect(curve[2]).toBeCloseTo(0.5, 6)
    expect(curve[3]).toBeCloseTo(0, 6)
  })

  it('writes AudioParam targets as anchored short ramps and skips unchanged values', () => {
    const param = new MockAudioParam()
    const matrix = new ModMatrix({ rampSec: 0.02 })
    const macro = new Macro(0)
    const target = audioParamTarget(param, { min: 0, max: 1, base: 0.2 })
    matrix.map(macro, target, 0.5)

    matrix.update({ playheadSec: 0, contextTimeSec: 10 })
    expect(calls(param)).toEqual([['setValueAtTime', 0.2, 10]])

    macro.set(1)
    matrix.update({ playheadSec: 0.05, contextTimeSec: 10.05 })
    expect(calls(param).slice(1)).toEqual([
      ['setValueAtTime', 0.2, 10.05],
      ['linearRampToValueAtTime', 0.7, 10.07],
    ])

    matrix.update({ playheadSec: 0.1, contextTimeSec: 10.1 })
    expect(param.events).toHaveLength(3)
  })

  it('holds a running ramp before redirecting it when ticks come faster than the ramp', () => {
    const param = new MockAudioParam()
    const matrix = new ModMatrix({ rampSec: 0.1 })
    const macro = new Macro(0)
    const target = audioParamTarget(param, { min: 0, max: 1, base: 0 })
    matrix.map(macro, target, 1)
    matrix.update({ playheadSec: 0, contextTimeSec: 0 })
    macro.set(1)
    matrix.update({ playheadSec: 0.05, contextTimeSec: 0.05 })
    macro.set(0.5)
    matrix.update({ playheadSec: 0.1, contextTimeSec: 0.1 })
    expect(calls(param).slice(3)).toEqual([
      ['cancelAndHoldAtTime', 0.1],
      ['linearRampToValueAtTime', 0.5, 0.2],
    ])
  })

  it('drives a device parameter through setParam within its spec range', () => {
    const device = fakeDevice()
    const matrix = new ModMatrix()
    const target = deviceParamTarget(device, 'cutoff')
    expect(target.base).toBe(400)
    expect(target.min).toBe(100)
    expect(target.max).toBe(1100)
    const macro = new Macro(1)
    matrix.map(macro, target, 1)
    matrix.update({ playheadSec: 0, contextTimeSec: 0 })
    matrix.update({ playheadSec: 1, contextTimeSec: 1 })
    expect(device.sets).toEqual([['cutoff', 1100]])
    macro.set(0.1)
    matrix.update({ playheadSec: 2, contextTimeSec: 2 })
    expect(device.sets[1][1]).toBeCloseTo(500, 9)
    expect(() => deviceParamTarget(device, 'nope')).toThrow(/no parameter/)
  })

  it('plays a lane onto a device parameter through an attached target with no routes', () => {
    const device = fakeDevice()
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 400 },
        { timeSec: 4, value: 1100 },
      ],
    })
    const matrix = new ModMatrix()
    const target = deviceParamTarget(device, 'cutoff', { base: lane })
    matrix.attach(target)
    matrix.update({ playheadSec: 2, contextTimeSec: 50 })
    expect(device.sets).toEqual([['cutoff', 750]])
    matrix.detach(target)
    matrix.update({ playheadSec: 3, contextTimeSec: 51 })
    expect(device.sets).toHaveLength(1)
  })

  it('unmaps a route and detaching drops the target’s routes', () => {
    const matrix = new ModMatrix()
    const a = audioParamTarget(new MockAudioParam(), { min: 0, max: 1, base: 0 })
    const b = audioParamTarget(new MockAudioParam(), { min: 0, max: 1, base: 0 })
    const route = matrix.map(new Macro(1), a, 1)
    matrix.map(new Macro(1), b, 1)
    matrix.map(new Macro(1), b, 0.5)
    matrix.unmap(route)
    expect(matrix.valueAt(a, 0)).toBe(0)
    expect(matrix.routes).toHaveLength(2)
    matrix.detach(b)
    expect(matrix.routes).toHaveLength(0)
    expect(matrix.targets.has(a)).toBe(true)
    expect(matrix.targets.has(b)).toBe(false)
  })

  it('refuses an AudioParam target without a finite range', () => {
    expect(() =>
      audioParamTarget(new MockAudioParam(), { min: 0, max: Number.POSITIVE_INFINITY, base: 0 }),
    ).toThrow(/finite/)
  })
})
