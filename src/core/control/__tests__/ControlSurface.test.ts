import { describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext, type MockAudioParam } from '../../../testing'
import { ParamLane } from '../../automation/ParamLane'
import { Macro } from '../../automation/Modulator'
import { createEngine, type Engine } from '../../Engine'
import { ControlSurface, type ControlInput, type ControlSurfaceChange } from '../ControlSurface'
import { absoluteEvent, triggerEvent, type ControlEvent } from '../event'
import { MidiDecoder } from '../midi'
import { type ControlSource } from '../source'
import { type ControlTarget } from '../target'

const cc74: ControlSource = { kind: 'cc', channel: 1, controller: 74 }
const cc1: ControlSource = { kind: 'cc', channel: 1, controller: 1 }
const pad36: ControlSource = { kind: 'note', channel: 1, note: 36 }
const level: ControlTarget = { kind: 'strip', track: 'pad', control: 'level' }
const pan: ControlTarget = { kind: 'strip', track: 'pad', control: 'pan' }
const mute: ControlTarget = { kind: 'strip', track: 'pad', control: 'mute' }
const solo: ControlTarget = { kind: 'strip', track: 'pad', control: 'solo' }
const trim: ControlTarget = { kind: 'strip', track: 'pad', control: 'inputGain' }

const cc = (source: ControlSource, raw: number): ControlEvent =>
  absoluteEvent(source, raw / 127, raw)
const press = (source: ControlSource, velocity = 127): ControlEvent =>
  triggerEvent(source, true, velocity / 127)

function methods(param: MockAudioParam): string[] {
  return param.events.map((event) => event.method)
}

function fixture(): { engine: Engine; ctx: ReturnType<typeof createMockContext> } {
  const ctx = createMockContext({ sampleRate: 48_000, currentTime: 2 })
  const engine = createEngine({
    context: asAudioContext(ctx),
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
    setTimeoutFn: () => 0 as unknown as ReturnType<typeof setTimeout>,
    clearTimeoutFn: () => {},
  })
  return { engine, ctx }
}

describe('ControlSurface dispatch', () => {
  it('sets strip level, trim and pan through the strip’s ramped setters (never a step)', () => {
    const { engine } = fixture()
    const pad = engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine })
    surface.map({ source: cc74, target: level })
    surface.map({ source: cc1, target: pan })
    surface.map({ source: { kind: 'cc', channel: 1, controller: 2 }, target: trim })

    const result = surface.handle(cc(cc74, 127))
    expect(result.consumed).toBe(true)
    expect(result.applied).toHaveLength(1)
    expect(pad.strip.level).toBe(1.5)
    const fader = pad.strip.fader.gain as unknown as MockAudioParam
    expect(methods(fader)).toEqual(['setTargetAtTime'])
    expect(fader.eventsFor('setTargetAtTime')[0].args).toEqual([1.5, 2, 0.005])

    surface.handle(cc(cc1, 0))
    expect(pad.strip.pan).toBe(-1)
    surface.handle(cc(cc1, 127))
    expect(pad.strip.pan).toBe(1)
    expect(methods(pad.strip.panner.pan as unknown as MockAudioParam)).toEqual([
      'setTargetAtTime',
      'setTargetAtTime',
    ])

    surface.handle(cc({ kind: 'cc', channel: 1, controller: 2 }, 127))
    expect(pad.strip.inputGain).toBe(1.5)
    expect(surface.read(level)).toBe(1)
    expect(surface.read(pan)).toBe(1)
    expect(surface.read(trim)).toBe(1)
  })

  it('honours a custom level span', () => {
    const { engine } = fixture()
    const pad = engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine, levelMax: 2 })
    surface.map({ source: cc74, target: level })
    surface.handle(cc(cc74, 127))
    expect(pad.strip.level).toBe(2)
    pad.strip.setLevel(1)
    expect(surface.read(level)).toBe(0.5)
  })

  it('toggles mute and solo from pads and sets them from a switch CC', () => {
    const { engine } = fixture()
    const pad = engine.addAudioTrack('pad')
    const other = engine.addAudioTrack('other')
    const surface = new ControlSurface({ engine })
    surface.map({ source: pad36, target: mute, mode: 'toggle' })
    surface.map({ source: { kind: 'note', channel: 1, note: 37 }, target: solo, mode: 'toggle' })
    surface.map({ source: cc1, target: { kind: 'strip', track: 'other', control: 'mute' } })

    expect(surface.handle(press(pad36)).consumed).toBe(true)
    expect(pad.strip.mute).toBe(true)
    expect(surface.handle(triggerEvent(pad36, false, 0)).consumed).toBe(true)
    expect(pad.strip.mute).toBe(true)
    surface.handle(press(pad36))
    expect(pad.strip.mute).toBe(false)
    surface.handle(cc(cc1, 127))
    expect(other.strip.mute).toBe(true)
    surface.handle(cc(cc1, 10))
    expect(other.strip.mute).toBe(false)
    const gate = pad.strip.gate.gain as unknown as MockAudioParam
    expect(new Set(methods(gate))).toEqual(new Set(['setTargetAtTime']))

    surface.handle(press({ kind: 'note', channel: 1, note: 37 }))
    expect(pad.strip.solo).toBe(true)
    expect(engine.track('other').strip.implicitlyMuted).toBe(true)
  })

  it('drives a send level, the master fader and a macro', async () => {
    const { engine, ctx } = fixture()
    const pad = engine.addAudioTrack('pad')
    const hall = engine.addReturnTrack('hall', {
      device: await engine.devices.create('utility', engine.context),
    })
    const send = pad.strip.sends.add(hall, { level: 0.5 })
    const direct = engine.addBus('aux')
    pad.strip.sends.add(direct)
    const macro = new Macro(0.2)
    const surface = new ControlSurface({ engine })
    surface.registerMacro('intensity', macro)
    surface.map({ source: cc74, target: { kind: 'send', track: 'pad', send: 'hall' } })
    surface.map({ source: cc1, target: { kind: 'master', control: 'level' } })
    surface.map({
      source: { kind: 'cc', channel: 1, controller: 2 },
      target: { kind: 'macro', macro: 'intensity' },
    })

    expect(surface.read({ kind: 'send', track: 'pad', send: 'hall' })).toBe(0.5)
    surface.handle(cc(cc74, 127))
    const sendGain = send.gainNode?.gain as unknown as MockAudioParam
    expect(sendGain.eventsFor('setTargetAtTime').at(-1)?.args).toEqual([1, 2, 0.005])
    expect(surface.read({ kind: 'send', track: 'pad', send: 'hall' })).toBe(1)
    // A direct send has no level to control.
    expect(surface.read({ kind: 'send', track: 'pad', send: 'aux' })).toBeNull()
    expect(surface.set({ kind: 'send', track: 'pad', send: 'aux' }, 0.5)).toBe(false)

    ctx.currentTime = 3
    surface.handle(cc(cc1, 127))
    const master = engine.master.gain as unknown as MockAudioParam
    expect(master.eventsFor('setTargetAtTime').at(-1)?.args).toEqual([1.5, 3, 0.005])
    expect(surface.read({ kind: 'master', control: 'level' })).toBe(1)

    expect(surface.read({ kind: 'macro', macro: 'intensity' })).toBe(0.2)
    surface.handle(cc({ kind: 'cc', channel: 1, controller: 2 }, 64))
    expect(macro.value).toBeCloseTo(64 / 127)
  })

  it('sets device parameters with the spec’s taper and reads them back normalised', async () => {
    const { engine, ctx } = fixture()
    const filter = await engine.devices.create('filter', engine.context)
    const surface = new ControlSurface({ engine })
    const unregister = surface.registerDevice('pad-filter', filter)
    const cutoff: ControlTarget = { kind: 'device', device: 'pad-filter', param: 'frequency' }
    surface.map({ source: cc74, target: cutoff })

    expect(surface.read(cutoff)).toBeCloseTo(Math.log(50) / Math.log(1000))
    surface.handle(cc(cc74, 127))
    expect(filter.getParam('frequency')).toBe(20000)
    surface.handle(cc(cc74, 0))
    expect(filter.getParam('frequency')).toBe(20)
    const biquad = ctx.filters[0]
    expect(methods(biquad.frequency)).not.toContain('setValueAtTime')
    expect(methods(biquad.frequency)).toContain('linearRampToValueAtTime')
    // Half way in normalised space is the geometric midpoint under a log taper.
    surface.set(cutoff, 0.5)
    expect(filter.getParam('frequency')).toBeCloseTo(Math.sqrt(20 * 20000))
    expect(surface.read(cutoff)).toBeCloseTo(0.5)

    // Unknown parameter or unregistered device: nothing answers.
    expect(surface.read({ kind: 'device', device: 'pad-filter', param: 'nope' })).toBeNull()
    unregister()
    expect(surface.handle(cc(cc74, 64)).applied).toEqual([])
    expect(surface.devices.size).toBe(0)
  })

  it('fires transport actions on presses and rising edges', () => {
    const { engine } = fixture()
    const surface = new ControlSurface({ engine })
    surface.map({ source: pad36, target: { kind: 'transport', action: 'toggle' } })
    surface.map({ source: cc1, target: { kind: 'transport', action: 'stop' } })
    expect(engine.transport.state).toBe('stopped')
    surface.handle(press(pad36))
    expect(engine.transport.state).toBe('playing')
    surface.handle(triggerEvent(pad36, false, 0))
    expect(engine.transport.state).toBe('playing')
    surface.handle(press(pad36))
    expect(engine.transport.state).toBe('paused')
    surface.handle(cc(cc1, 127))
    expect(engine.transport.state).toBe('stopped')
    expect(surface.read({ kind: 'transport', action: 'stop' })).toBeNull()
    surface.map({
      source: { kind: 'note', channel: 1, note: 40 },
      target: { kind: 'transport', action: 'start' },
    })
    surface.map({
      source: { kind: 'note', channel: 1, note: 41 },
      target: { kind: 'transport', action: 'pause' },
    })
    surface.handle(press({ kind: 'note', channel: 1, note: 40 }))
    expect(engine.transport.state).toBe('playing')
    surface.handle(press({ kind: 'note', channel: 1, note: 41 }))
    expect(engine.transport.state).toBe('paused')
  })

  it('nudges with relative encoders and applies soft takeover against the live value', () => {
    const { engine } = fixture()
    const pad = engine.addAudioTrack('pad')
    pad.strip.setLevel(0.75) // 0.5 normalised
    const surface = new ControlSurface({ engine })
    surface.map({ source: cc1, target: level, mode: 'relative', step: 0.1 })
    surface.handle(cc(cc1, 1))
    expect(pad.strip.level).toBeCloseTo(0.9)
    surface.handle(cc(cc1, 127))
    surface.handle(cc(cc1, 127))
    expect(pad.strip.level).toBeCloseTo(0.6)
    for (let index = 0; index < 20; index += 1) surface.handle(cc(cc1, 1))
    expect(pad.strip.level).toBe(1.5)

    pad.strip.setLevel(0.75)
    surface.map({ source: cc74, target: level, pickup: true })
    expect(surface.handle(cc(cc74, 127)).applied).toEqual([])
    expect(pad.strip.level).toBe(0.75)
    expect(surface.handle(cc(cc74, 100)).applied).toEqual([])
    expect(surface.handle(cc(cc74, 60)).applied).toHaveLength(1)
    expect(pad.strip.level).toBeCloseTo((60 / 127) * 1.5)
    expect(surface.handle(cc(cc74, 10)).applied).toHaveLength(1)
  })

  it('overrides a lane writer on the first controller write and releases it on request', () => {
    const { engine, ctx } = fixture()
    const pad = engine.addAudioTrack('pad')
    const lane = new ParamLane({
      breakpoints: [
        { timeSec: 0, value: 0 },
        { timeSec: 4, value: 1 },
      ],
    })
    const fader = pad.strip.fader.gain as unknown as MockAudioParam
    const writer = engine.automation.add(lane, pad.strip.fader.gain)
    engine.transport.start()
    engine.automation.tick()
    const written = fader.events.length
    expect(written).toBeGreaterThan(0)

    const surface = new ControlSurface({ engine })
    surface.map({ source: cc74, target: level })
    const detach = surface.attachWriter(level, writer)
    expect(surface.writerFor(level)).toBe(writer)

    ctx.currentTime = 2.5
    surface.handle(cc(cc74, 64))
    expect(writer.isOverridden).toBe(true)
    const after = fader.events.slice(written).map((event) => event.method)
    expect(after).toEqual(['cancelAndHoldAtTime', 'setTargetAtTime'])
    expect(fader.eventsFor('cancelAndHoldAtTime')[0].args).toEqual([2.5])

    // Further writes do not re-hold; the automation tick writes nothing while overridden.
    surface.handle(cc(cc74, 70))
    expect(fader.eventsFor('cancelAndHoldAtTime')).toHaveLength(1)
    const beforeTick = fader.events.length
    engine.automation.tick()
    expect(fader.events.length).toBe(beforeTick)

    surface.release(level)
    expect(writer.isOverridden).toBe(false)
    engine.automation.tick()
    expect(fader.events.length).toBeGreaterThan(beforeTick)

    surface.handle(cc(cc74, 20))
    expect(writer.isOverridden).toBe(true)
    surface.releaseAll()
    expect(writer.isOverridden).toBe(false)
    detach()
    surface.handle(cc(cc74, 30))
    expect(writer.isOverridden).toBe(false)
  })

  it('works without an engine through a custom resolver', () => {
    const macro = new Macro(0)
    const surface = new ControlSurface({ resolve: { macro: () => macro } })
    surface.map({ source: cc1, target: { kind: 'macro', macro: 'anything' } })
    surface.handle(cc(cc1, 127))
    expect(macro.value).toBe(1)
    expect(surface.read(level)).toBeNull()
    expect(surface.handle(cc(cc74, 1)).consumed).toBe(false)
  })
})

describe('ControlSurface learn', () => {
  it('arms a target, binds the next event, consumes it and announces every step', () => {
    const { engine } = fixture()
    const pad = engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine })
    const seen: ControlSurfaceChange['type'][] = []
    surface.onChange((change) => seen.push(change.type))

    surface.beginLearn(level)
    expect(surface.learning).toEqual(level)
    expect(surface.learn).toEqual({ target: level })
    // A release while armed keeps waiting and is not consumed.
    expect(surface.handle(triggerEvent(pad36, false, 0)).consumed).toBe(false)
    const result = surface.handle(cc(cc74, 40))
    expect(result.consumed).toBe(true)
    expect(result.learned).toMatchObject({ source: cc74, target: level, mode: 'set' })
    expect(surface.learning).toBeNull()
    expect(pad.strip.level).toBe(1) // the learning event did not move the fader
    expect(surface.lastEvent).toEqual(cc(cc74, 40))
    expect(seen).toEqual(['learn', 'event', 'table', 'learn', 'event'])

    surface.handle(cc(cc74, 127))
    expect(pad.strip.level).toBe(1.5)
  })

  it('cancels, forces a mode, and re-learns keeping options', () => {
    const { engine } = fixture()
    engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine })
    surface.beginLearn(level)
    surface.cancelLearn()
    expect(surface.learning).toBeNull()
    expect(surface.handle(cc(cc74, 1)).consumed).toBe(false)
    surface.cancelLearn()

    surface.beginLearn(level, { mode: 'relative' })
    surface.handle(cc(cc1, 1))
    expect(surface.mappingFor(level)?.mode).toBe('relative')
    surface.update(level, { pickup: true, curve: 'exp' })
    surface.beginLearn(level)
    surface.handle(cc(cc74, 1))
    expect(surface.mappingFor(level)).toMatchObject({
      source: cc74,
      mode: 'relative',
      pickup: true,
      curve: 'exp',
    })
  })

  it('upgrades a 7-bit learn to the 14-bit pair when the LSB follows', () => {
    const { engine } = fixture()
    const pad = engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine })
    const decoder = new MidiDecoder()
    surface.beginLearn(level)
    const [msb] = decoder.decode(Uint8Array.from([0xb0, 1, 64]))
    const [lsb] = decoder.decode(Uint8Array.from([0xb0, 33, 0]))
    expect(surface.handle(msb).learned?.source).toEqual(cc1)
    const upgrade = surface.handle(lsb)
    expect(upgrade.consumed).toBe(true)
    expect(upgrade.learned?.source).toEqual({ kind: 'cc14', channel: 1, controller: 1 })
    expect(surface.mappingFor(level)?.source).toEqual({ kind: 'cc14', channel: 1, controller: 1 })
    // From now on the pair drives the fader with 14-bit resolution and the MSB alone does nothing.
    for (const event of decoder.decode(Uint8Array.from([0xb0, 1, 127, 0xb0, 33, 127])))
      surface.handle(event)
    expect(pad.strip.level).toBe(1.5)
    const [msbOnly] = decoder.decode(Uint8Array.from([0xb0, 1, 0]))
    expect(surface.handle(msbOnly).applied).toEqual([])
    // Any other event after a learn ends the upgrade window.
    surface.beginLearn(pan)
    surface.handle(decoder.decode(Uint8Array.from([0xb0, 2, 64]))[0])
    surface.handle(press(pad36))
    surface.handle(decoder.decode(Uint8Array.from([0xb0, 34, 0]))[0])
    expect(surface.mappingFor(pan)?.source).toEqual({ kind: 'cc', channel: 1, controller: 2 })
  })
})

describe('ControlSurface table, inputs and persistence', () => {
  it('edits the table through map/unmap/unmapSource/update/replace/clear and announces each', () => {
    const surface = new ControlSurface()
    const tables: number[] = []
    surface.onChange((change) => {
      if (change.type === 'table') tables.push(change.table.length)
    })
    const mapping = surface.map({ source: cc74, target: level })
    expect(mapping).toMatchObject({ source: cc74, target: level, mode: 'set' })
    surface.map({ source: cc74, target: pan })
    surface.map({ source: cc1, target: mute })
    expect(surface.table).toHaveLength(3)
    surface.unmap(mute)
    surface.unmapSource(cc74)
    expect(surface.table).toEqual([])
    surface.replace([mapping])
    surface.update(level, { curve: 's' })
    expect(surface.mappingFor(level)?.curve).toBe('s')
    surface.clear()
    expect(tables).toEqual([1, 2, 3, 2, 0, 1, 1, 0])
  })

  it('connects inputs and disconnects them individually or on dispose', () => {
    const { engine } = fixture()
    const pad = engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine })
    surface.map({ source: cc74, target: level })
    const listeners = new Set<(event: ControlEvent) => void>()
    const input: ControlInput = {
      subscribe: (listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
    }
    const disconnect = surface.connect(input)
    expect(listeners.size).toBe(1)
    for (const listener of listeners) listener(cc(cc74, 127))
    expect(pad.strip.level).toBe(1.5)
    disconnect()
    expect(listeners.size).toBe(0)
    surface.connect(input)
    surface.dispose()
    expect(listeners.size).toBe(0)
    expect(surface.handle(cc(cc74, 0))).toEqual({ consumed: false, learned: null, applied: [] })
  })

  it('serialises, loads through migrations and persists to storage', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    }
    const surface = new ControlSurface({
      migrations: [
        {
          from: 1,
          migrate: () => ({
            mappings: [{ source: cc1, target: mute }],
          }),
        },
      ],
    })
    surface.map({ source: cc74, target: level })
    const json = surface.serialize()
    expect(surface.toJSON().mappings).toHaveLength(1)

    const stop = surface.persist(storage)
    // Nothing stored yet: the table stays; the first edit is written.
    expect(surface.table).toHaveLength(1)
    surface.map({ source: cc1, target: pan })
    expect(store.get('live-mix:control-map')).toBe(surface.serialize())
    surface.clear()
    expect(store.has('live-mix:control-map')).toBe(false)
    stop()
    surface.map({ source: cc1, target: pan })
    expect(store.has('live-mix:control-map')).toBe(false)

    // A stored table replaces the current one on persist, through the surface's migrations.
    store.set('live-mix:control-map', JSON.stringify({ format: 1 }))
    surface.persist(storage)
    expect(surface.table).toMatchObject([{ source: cc1, target: mute }])
    expect(surface.load(json)).toMatchObject([{ source: cc74, target: level }])
    expect(surface.load('garbage')).toEqual([])
    expect(surface.load({ format: 1 })).toMatchObject([{ source: cc1, target: mute }])
  })

  it('reports applied changes with the value written', () => {
    const { engine } = fixture()
    engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine })
    const applied = vi.fn()
    surface.onChange((change) => {
      if (change.type === 'applied') applied(change.change.kind, change.unit)
    })
    surface.map({ source: cc74, target: level })
    surface.map({ source: pad36, target: { kind: 'transport', action: 'start' } })
    surface.handle(cc(cc74, 127))
    surface.handle(press(pad36))
    expect(applied.mock.calls).toEqual([
      ['set', 1],
      ['trigger', null],
    ])
  })
})
