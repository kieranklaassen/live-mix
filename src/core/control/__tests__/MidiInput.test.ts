import { describe, expect, it, vi } from 'vitest'

import { type ControlEvent } from '../event'
import {
  MidiInput,
  fromMidiAccess,
  isWebMidiSupported,
  type MidiAccessLike,
  type MidiMessageEventLike,
  type MidiPortLike,
} from '../MidiInput'

class FakePort implements MidiPortLike {
  onmidimessage: ((event: MidiMessageEventLike) => void) | null = null
  state: 'connected' | 'disconnected' = 'connected'
  constructor(
    readonly id: string,
    readonly name: string,
    readonly manufacturer = 'Fake',
  ) {}

  send(bytes: number[], timeStamp = 0): void {
    this.onmidimessage?.({ data: Uint8Array.from(bytes), timeStamp })
  }
}

class FakeAccess implements MidiAccessLike {
  readonly inputs = new Map<string, FakePort>()
  onstatechange: ((event: { port?: MidiPortLike | null }) => void) | null = null

  plug(port: FakePort): void {
    this.inputs.set(port.id, port)
    this.onstatechange?.({ port })
  }

  unplug(port: FakePort): void {
    port.state = 'disconnected'
    this.onstatechange?.({ port })
    this.inputs.delete(port.id)
  }
}

function harness(ports: FakePort[] = [new FakePort('in-1', 'Launch Control')]) {
  const access = new FakeAccess()
  for (const port of ports) access.inputs.set(port.id, port)
  const requestAccess = vi.fn(() => Promise.resolve(access))
  const input = new MidiInput({ requestAccess })
  const events: ControlEvent[] = []
  input.subscribe((event) => events.push(event))
  return { access, input, events, requestAccess }
}

describe('MidiInput', () => {
  it('reports Web MIDI as unsupported here and rejects open() without an injected request', async () => {
    expect(isWebMidiSupported()).toBe(false)
    expect(MidiInput.isSupported()).toBe(false)
    await expect(new MidiInput().open()).rejects.toThrow(/Web MIDI is not available/)
  })

  it('opens once, attaches to every port and publishes messages and control events', async () => {
    const port = new FakePort('in-1', 'Launch Control')
    const { access, input, events, requestAccess } = harness([port])
    const messages = vi.fn()
    input.onMessage(messages)
    expect(input.opened).toBe(false)
    await Promise.all([input.open(), input.open()])
    expect(requestAccess).toHaveBeenCalledTimes(1)
    expect(requestAccess).toHaveBeenCalledWith({ sysex: false })
    expect(input.opened).toBe(true)
    expect(input.ports).toEqual([
      { id: 'in-1', name: 'Launch Control', manufacturer: 'Fake', state: 'connected' },
    ])

    port.send([0xb0, 74, 127], 10)
    port.send([0x90, 60, 100], 11)
    expect(events).toEqual([
      { kind: 'absolute', source: { kind: 'cc', channel: 1, controller: 74 }, value: 1, raw: 127 },
      {
        kind: 'trigger',
        source: { kind: 'note', channel: 1, note: 60 },
        on: true,
        value: 100 / 127,
      },
    ])
    expect(messages).toHaveBeenCalledWith(
      { type: 'note-on', channel: 1, note: 60, velocity: 100 },
      { id: 'in-1', name: 'Launch Control', manufacturer: 'Fake', state: 'connected' },
      11,
    )
    // Null data (Firefox on some ports) is ignored.
    port.onmidimessage?.({ data: null, timeStamp: 12 })
    expect(events).toHaveLength(2)
    expect(access.onstatechange).not.toBeNull()
  })

  it('pairs 14-bit CCs per port using the port timestamps', async () => {
    const port = new FakePort('in-1', 'Faders')
    const { input, events } = harness([port])
    await input.open()
    port.send([0xb0, 1, 100], 0)
    port.send([0xb0, 33, 5], 5)
    expect(events[1].source).toEqual({ kind: 'cc14', channel: 1, controller: 1 })
    port.send([0xb0, 33, 5], 500)
    expect(events[2].source).toEqual({ kind: 'cc', channel: 1, controller: 33 })
  })

  it('follows hot-plugging and filters ports by id or name', async () => {
    const a = new FakePort('in-a', 'Pads')
    const b = new FakePort('in-b', 'Keys')
    const access = new FakeAccess()
    access.inputs.set(a.id, a)
    const input = new MidiInput({ requestAccess: () => Promise.resolve(access), ports: ['Keys'] })
    const portsSeen: string[][] = []
    input.onPortsChange((ports) => portsSeen.push(ports.map((port) => port.id)))
    const events: ControlEvent[] = []
    input.subscribe((event) => events.push(event))
    await input.open()
    expect(input.ports).toEqual([])
    a.send([0xb0, 1, 1])
    expect(events).toHaveLength(0)

    access.plug(b)
    expect(input.ports.map((port) => port.id)).toEqual(['in-b'])
    b.send([0xb0, 1, 1])
    expect(events).toHaveLength(1)

    access.unplug(b)
    expect(input.ports).toEqual([])
    expect(b.onmidimessage).toBeNull()
    expect(portsSeen).toEqual([[], ['in-b'], []])

    // The browser may hand out a fresh object for the same port id on re-plug.
    const b2 = new FakePort('in-b', 'Keys')
    access.plug(b2)
    b2.send([0xb0, 1, 2])
    expect(events).toHaveLength(2)
    const b3 = new FakePort('in-b', 'Keys')
    access.inputs.set('in-b', b3)
    access.onstatechange?.({ port: b3 })
    expect(b2.onmidimessage).toBeNull()
    b3.send([0xb0, 1, 3])
    expect(events).toHaveLength(3)
  })

  it('feeds injected bytes with their own decoder and detaches on close', async () => {
    const port = new FakePort('in-1', 'X')
    const { input, events, requestAccess } = harness([port])
    const fed = input.feed([0xb0, 7, 64])
    expect(fed).toHaveLength(1)
    expect(events).toEqual(fed)
    // Injected bytes never pair with the port's MSB.
    await input.open()
    port.send([0xb0, 1, 100])
    expect(input.feed([0xb0, 33, 1])[0].source).toEqual({ kind: 'cc', channel: 1, controller: 33 })

    input.close()
    expect(input.opened).toBe(false)
    expect(input.ports).toEqual([])
    expect(port.onmidimessage).toBeNull()
    const before = events.length
    port.send([0xb0, 7, 1])
    expect(events).toHaveLength(before)
    await input.open()
    expect(requestAccess).toHaveBeenCalledTimes(2)
    expect(input.ports).toHaveLength(1)
  })

  it('passes the sysex flag through and surfaces a denied request', async () => {
    const requestAccess = vi.fn(() => Promise.reject(new Error('denied')))
    const input = new MidiInput({ requestAccess, sysex: true })
    await expect(input.open()).rejects.toThrow('denied')
    expect(requestAccess).toHaveBeenCalledWith({ sysex: true })
    expect(input.opened).toBe(false)
    // A failed open is not cached: the next open asks again.
    await expect(input.open()).rejects.toThrow('denied')
    expect(requestAccess).toHaveBeenCalledTimes(2)
  })
})

describe('MidiInput and the access object (ambient-live #28)', () => {
  it('chains an existing onstatechange instead of owning it, and restores it on close', async () => {
    const access = new FakeAccess()
    const appHandler = vi.fn()
    access.onstatechange = appHandler
    const input = new MidiInput({ requestAccess: () => Promise.resolve(access) })
    await input.open()
    expect(access.onstatechange).not.toBe(appHandler)

    const port = new FakePort('in-1', 'Keys')
    access.plug(port)
    expect(appHandler).toHaveBeenCalledWith({ port })
    expect(input.ports.map((info) => info.id)).toEqual(['in-1'])

    input.close()
    expect(access.onstatechange).toBe(appHandler)
  })

  it('prefers addEventListener("statechange") when the access has it', async () => {
    const listeners = new Set<(event: { port?: MidiPortLike | null }) => void>()
    const port = new FakePort('in-1', 'Keys')
    const access: MidiAccessLike = {
      inputs: new Map([[port.id, port]]),
      onstatechange: null,
      addEventListener: (_type, listener) => void listeners.add(listener),
      removeEventListener: (_type, listener) => void listeners.delete(listener),
    }
    const input = new MidiInput({ requestAccess: () => Promise.resolve(access) })
    await input.open()
    expect(access.onstatechange).toBeNull()
    expect(listeners.size).toBe(1)
    const later = new FakePort('in-2', 'Pads')
    ;(access.inputs as Map<string, FakePort>).set(later.id, later)
    for (const listener of listeners) listener({ port: later })
    expect(input.ports.map((info) => info.id)).toEqual(['in-1', 'in-2'])
    input.close()
    expect(listeners.size).toBe(0)
  })

  it('fromMidiAccess adapts the browser MIDIAccess: stable port wrappers, forwarded handlers and statechange', async () => {
    const stateListeners = new Set<(event: unknown) => void>()
    const browserPort = {
      id: 'in-1',
      name: 'Keys',
      manufacturer: 'Acme',
      state: 'connected',
      connection: 'open',
      onmidimessage: null as ((event: MidiMessageEventLike) => void) | null,
    }
    const browserAccess = {
      inputs: new Map([[browserPort.id, browserPort]]),
      addEventListener: (_type: 'statechange', listener: (event: unknown) => void) =>
        void stateListeners.add(listener),
      removeEventListener: (_type: 'statechange', listener: (event: unknown) => void) =>
        void stateListeners.delete(listener),
    }
    const access = fromMidiAccess(browserAccess)
    const [first] = access.inputs.values()
    const [again] = access.inputs.values()
    expect(first).toBe(again)
    expect(first.state).toBe('connected')

    const input = new MidiInput({ requestAccess: () => Promise.resolve(access) })
    const events: ControlEvent[] = []
    input.subscribe((event) => events.push(event))
    await input.open()
    expect(browserPort.onmidimessage).not.toBeNull()
    browserPort.onmidimessage?.({ data: Uint8Array.from([0xb0, 74, 100]), timeStamp: 5 })
    expect(events).toHaveLength(1)

    const pads = { ...browserPort, id: 'in-2', name: 'Pads', onmidimessage: null }
    browserAccess.inputs.set(pads.id, pads)
    for (const listener of stateListeners) listener({ port: pads })
    expect(input.ports.map((info) => info.name)).toEqual(['Keys', 'Pads'])
    input.close()
    expect(stateListeners.size).toBe(0)
    expect(browserPort.onmidimessage).toBeNull()
  })
})
