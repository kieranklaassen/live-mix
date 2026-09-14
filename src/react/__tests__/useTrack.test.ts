// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type MockGainNode, type MockStereoPannerNode } from '../../testing'
import { type Device } from '../../core/devices/Device'
import { useGroup, useStrip, useTrack } from '../hooks/useTrack'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

function fakeDevice(fixture: TestEngine, id: string): Device {
  const node = fixture.ctx.createGain()
  return {
    id,
    input: node as unknown as AudioNode,
    output: node as unknown as AudioNode,
    params: {},
    setParam: () => {},
    getParam: () => 0,
    bypass: false,
    latencySec: 0,
    dispose: () => node.disconnect(),
  }
}

describe('useStrip', () => {
  it('reads the strip without building nodes, then follows every change', () => {
    const fixture = createTestEngine()
    const track = fixture.engine.addAudioTrack('pad')
    const before = fixture.ctx.gains.length
    const { result } = renderHook(() => useStrip(track.strip), { wrapper: fixture.wrapper })
    expect(result.current).toMatchObject({
      name: 'pad',
      level: 1,
      pan: 0,
      inputGain: 1,
      mute: false,
      solo: false,
      audible: true,
      materialized: false,
      inserts: [],
    })
    expect(fixture.ctx.gains.length).toBe(before)

    act(() => result.current.setLevel(0.5))
    expect(result.current.level).toBe(0.5)
    expect(result.current.materialized).toBe(true)
    act(() => result.current.setPan(-0.25))
    expect(result.current.pan).toBe(-0.25)
    act(() => result.current.setInputGain(0.8))
    expect(result.current.inputGain).toBe(0.8)

    act(() => result.current.toggleMute())
    expect(result.current.mute).toBe(true)
    expect(result.current.audible).toBe(false)
    act(() => result.current.setMute(false))
    expect(result.current.audible).toBe(true)
  })

  it('setters ramp: every level and pan change is a setTargetAtTime approach', () => {
    const fixture = createTestEngine()
    const track = fixture.engine.addAudioTrack('pad')
    const { result } = renderHook(() => useStrip(track.strip))
    act(() => {
      result.current.setLevel(0.25)
      result.current.setPan(0.5)
      result.current.setMute(true)
    })
    const fader = track.strip.fader as unknown as MockGainNode
    const panner = track.strip.panner as unknown as MockStereoPannerNode
    const gate = track.strip.gate as unknown as MockGainNode
    expect(fader.gain.events.map((event) => event.method)).toEqual(['setTargetAtTime'])
    expect(fader.gain.events[0].args[0]).toBe(0.25)
    expect(panner.pan.events.map((event) => event.method)).toEqual(['setTargetAtTime'])
    expect(gate.gain.events.map((event) => event.method)).toEqual(['setTargetAtTime'])
    expect(gate.gain.events[0].args[0]).toBe(0)
  })

  it('reflects solo-in-place from another strip (implicit mute) without touching this one', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const lead = fixture.engine.addAudioTrack('lead')
    const { result } = renderHook(() => useStrip(pad.strip))
    act(() => {
      lead.strip.solo = true
    })
    expect(result.current.implicitlyMuted).toBe(true)
    expect(result.current.audible).toBe(false)
    expect(result.current.mute).toBe(false)
    act(() => fixture.engine.solo.clear())
    expect(result.current.audible).toBe(true)

    act(() => result.current.toggleSolo())
    expect(result.current.solo).toBe(true)
    expect(lead.strip.implicitlyMuted).toBe(true)
  })

  it('lists inserts as they change', () => {
    const fixture = createTestEngine()
    const track = fixture.engine.addAudioTrack('pad')
    const device = fakeDevice(fixture, 'fx')
    const { result } = renderHook(() => useStrip(track.strip))
    act(() => result.current.addInsert(device))
    expect(result.current.inserts).toEqual([device])
    act(() => result.current.removeInsert(device))
    expect(result.current.inserts).toEqual([])
  })

  it('does not re-render for changes on other strips', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const lead = fixture.engine.addAudioTrack('lead')
    const renders = vi.fn()
    renderHook(() => {
      renders()
      return useStrip(pad.strip)
    })
    const before = renders.mock.calls.length
    act(() => lead.strip.setLevel(0.3))
    expect(renders.mock.calls.length).toBe(before)
  })
})

describe('useTrack', () => {
  it('resolves any track kind by name through the provider', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const group = fixture.engine.addGroup('drums')
    const { result } = renderHook(() => useTrack('pad'), { wrapper: fixture.wrapper })
    expect(result.current.track).toBe(pad)
    expect(result.current.strip).toBe(pad.strip)
    const groupHook = renderHook(() => useTrack('drums'), { wrapper: fixture.wrapper })
    expect(groupHook.result.current.track).toBe(group)
  })

  it('accepts the object and keeps its type', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const { result } = renderHook(() => useTrack(pad))
    expect(result.current.track.clips).toBe(pad.clips)
    act(() => result.current.setLevel(0.7))
    expect(pad.strip.level).toBe(0.7)
  })

  it('throws for an unknown name', () => {
    const fixture = createTestEngine()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useTrack('ghost'), { wrapper: fixture.wrapper })).toThrow(
      /no track "ghost"/,
    )
    error.mockRestore()
  })
})

describe('useGroup', () => {
  it('follows membership through add/remove and routing changes', () => {
    const fixture = createTestEngine()
    const kick = fixture.engine.addAudioTrack('kick')
    const snare = fixture.engine.addAudioTrack('snare')
    const drums = fixture.engine.addGroup('drums', { members: [kick] })
    const { result } = renderHook(() => useGroup('drums'), { wrapper: fixture.wrapper })
    expect(result.current.group).toBe(drums)
    expect(result.current.members).toEqual([kick.strip])

    act(() => result.current.add(snare))
    expect(result.current.members).toEqual([kick.strip, snare.strip])

    act(() => result.current.remove(kick))
    expect(result.current.members).toEqual([snare.strip])

    act(() => snare.strip.connectTo(fixture.engine.master))
    expect(result.current.members).toEqual([])

    act(() => result.current.setLevel(0.6))
    expect(drums.strip.level).toBe(0.6)
  })

  it('drops a member that is disposed', () => {
    const fixture = createTestEngine()
    const kick = fixture.engine.addAudioTrack('kick')
    const drums = fixture.engine.addGroup('drums', { members: [kick] })
    const { result } = renderHook(() => useGroup(drums))
    expect(result.current.members).toHaveLength(1)
    act(() => fixture.engine.removeTrack('kick'))
    expect(result.current.members).toEqual([])
  })
})
