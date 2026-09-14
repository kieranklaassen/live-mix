// Server-side safety of the `./react` entry: imports in plain Node (no
// `window`, no `requestAnimationFrame`) and renders every hook to a string
// through `react-dom/server` from the same snapshots the client uses.

import { createElement, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ParamLane } from '../../core/automation/ParamLane'
import { type Device } from '../../core/devices/Device'
import { createEngine } from '../../core/Engine'
import { asAudioContext, createMockContext } from '../../testing'
import * as react from '../index'

describe('./react under SSR', () => {
  it('imports without a window or a frame API', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof requestAnimationFrame).toBe('undefined')
    expect(typeof react.LiveMixProvider).toBe('function')
    expect(typeof react.useTransport).toBe('function')
  })

  it('renders every hook to markup with no effects and no timers', async () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx), master: { meter: true } })
    const pad = engine.addAudioTrack('pad')
    const drums = engine.addGroup('drums', { members: [pad] })
    const device: Device = await engine.devices.create('eq3', engine.context)
    const lane = new ParamLane({ breakpoints: [{ timeSec: 0, value: 1 }] })
    engine.transport.seek(3)

    function Readout(): ReactNode {
      const transport = react.useTransport()
      const strip = react.useTrack(pad)
      const group = react.useGroup(drums)
      const meter = react.useMeter()
      const dev = react.useDevice(device)
      const param = react.useDeviceParam(device, 'lowGain')
      const laneState = react.useLane(lane)
      const modulation = react.useModulation()
      const store = react.useSampleStore()
      const stats = react.useEngineStats()
      const clips = react.useClips(pad)
      const schedule = react.useSchedule(pad)
      return createElement(
        'pre',
        null,
        [
          transport.state,
          transport.positionSec,
          strip.name,
          strip.level,
          group.members.length,
          meter.peak,
          dev.id,
          param.value,
          laneState.breakpoints.length,
          modulation.routes.length,
          store.metrics.count,
          stats.glitches,
          clips.clips.length,
          schedule.upcoming.length,
        ].join('|'),
      )
    }

    const html = renderToString(
      createElement(react.LiveMixProvider, { engine }, createElement(Readout)),
    )
    expect(html).toBe('<pre>stopped|3|pad|1|1|0|eq3|0|1|0|0|0|0|0</pre>')
    engine.dispose()
  })

  it('renders hooks given explicit objects without a provider', () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    function Bare(): ReactNode {
      const transport = react.useTransport(engine.transport)
      const meter = react.useMeter(engine.master)
      return createElement('span', null, `${transport.state}:${meter.hasMeter ? 1 : 0}`)
    }
    expect(renderToString(createElement(Bare))).toBe('<span>stopped:0</span>')
  })
})
