// Web MIDI as a `ControlInput`. `open()` asks for access (by default
// `navigator.requestMIDIAccess`, injectable for tests and for hosts with
// their own MIDI stack), listens on every input port (or the ones named),
// follows hot-plugging through `onstatechange`, decodes with `MidiDecoder`
// and publishes control events. Raw messages are published too, so an app
// can route unmapped notes to an instrument (ambient-live's synth path).
// Nothing here touches `navigator` at import time.

import { Emitter } from '../events'
import { type ControlInput } from './ControlSurface'
import { type ControlEvent } from './event'
import { MidiDecoder, type MidiDecoderOptions, type MidiMessage } from './midi'

/** The slice of `MIDIMessageEvent` the adapter reads. */
export interface MidiMessageEventLike {
  data: ArrayLike<number> | null
  timeStamp: number
}

/** The slice of `MIDIInput` the adapter uses. */
export interface MidiPortLike {
  readonly id: string
  readonly name?: string | null
  readonly manufacturer?: string | null
  readonly state?: 'connected' | 'disconnected'
  onmidimessage: ((event: MidiMessageEventLike) => void) | null
}

/** The slice of `MIDIAccess` the adapter uses; a `Map<string, MidiPortLike>` satisfies `inputs`. */
export interface MidiAccessLike {
  readonly inputs: { values(): Iterable<MidiPortLike> }
  onstatechange: ((event: { port?: MidiPortLike | null }) => void) | null
}

export type MidiAccessRequest = (options?: { sysex?: boolean }) => Promise<MidiAccessLike>

export interface MidiPortInfo {
  id: string
  name: string
  manufacturer: string
  state: 'connected' | 'disconnected'
}

export interface MidiInputOptions {
  /** Defaults to `navigator.requestMIDIAccess`; `open()` rejects when neither exists. */
  requestAccess?: MidiAccessRequest
  /** Listen only to ports whose id or name is listed; default every port. */
  ports?: readonly string[]
  sysex?: boolean
  decoder?: MidiDecoderOptions
}

export type MidiMessageListener = (
  message: MidiMessage,
  port: MidiPortInfo | null,
  timeMs: number,
) => void

interface Attached {
  port: MidiPortLike
  info: MidiPortInfo
  decoder: MidiDecoder
}

function portInfo(port: MidiPortLike): MidiPortInfo {
  return {
    id: port.id,
    name: port.name ?? '',
    manufacturer: port.manufacturer ?? '',
    state: port.state ?? 'connected',
  }
}

/** True when the page has Web MIDI. Safe to call anywhere (false under SSR). */
export function isWebMidiSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof (navigator as { requestMIDIAccess?: unknown }).requestMIDIAccess === 'function'
  )
}

function defaultRequestAccess(): MidiAccessRequest {
  return (options) => {
    if (!isWebMidiSupported()) {
      return Promise.reject(new Error('live-mix: Web MIDI is not available in this environment'))
    }
    const nav = navigator as unknown as { requestMIDIAccess: MidiAccessRequest }
    return nav.requestMIDIAccess(options)
  }
}

export class MidiInput implements ControlInput {
  private readonly requestAccess: MidiAccessRequest
  private readonly portFilter: ReadonlySet<string> | null
  private readonly sysex: boolean
  private readonly decoderOptions: MidiDecoderOptions
  private readonly events = new Emitter<ControlEvent>()
  private readonly messages = new Emitter<[MidiMessage, MidiPortInfo | null, number]>()
  private readonly portChanges = new Emitter<readonly MidiPortInfo[]>()
  private readonly attached = new Map<string, Attached>()
  /** Decoder for `feed`, kept apart from the ports' so injected bytes never pair with theirs. */
  private readonly injected: MidiDecoder
  private access: MidiAccessLike | null = null
  private opening: Promise<void> | null = null

  constructor(options: MidiInputOptions = {}) {
    this.requestAccess = options.requestAccess ?? defaultRequestAccess()
    this.portFilter = options.ports ? new Set(options.ports) : null
    this.sysex = options.sysex ?? false
    this.decoderOptions = options.decoder ?? {}
    this.injected = new MidiDecoder(this.decoderOptions)
  }

  static isSupported(): boolean {
    return isWebMidiSupported()
  }

  /** Request access and attach to the input ports. Idempotent; rejects when MIDI is unavailable or denied. */
  open(): Promise<void> {
    // `new Promise` turns a synchronous throw from the request into a rejection.
    this.opening ??= new Promise<MidiAccessLike>((resolve) =>
      resolve(this.requestAccess({ sysex: this.sysex })),
    ).then(
      (access) => {
        this.access = access
        access.onstatechange = () => this.refreshPorts()
        this.refreshPorts()
      },
      (error: unknown) => {
        this.opening = null
        throw error
      },
    )
    return this.opening
  }

  get opened(): boolean {
    return this.access !== null
  }

  /** The input ports currently attached. */
  get ports(): readonly MidiPortInfo[] {
    return [...this.attached.values()].map((entry) => entry.info)
  }

  subscribe(listener: (event: ControlEvent) => void): () => void {
    return this.events.subscribe(listener)
  }

  /** Every decoded channel message, before mapping (notes for an instrument, for example). */
  onMessage(listener: MidiMessageListener): () => void {
    return this.messages.subscribe(([message, port, timeMs]) => listener(message, port, timeMs))
  }

  /** Called with the attached ports after every hot-plug. */
  onPortsChange(listener: (ports: readonly MidiPortInfo[]) => void): () => void {
    return this.portChanges.subscribe(listener)
  }

  /**
   * Inject raw bytes as if a port delivered them (tests, virtual keyboards,
   * a MIDI-over-WebSocket bridge). Returns the control events published.
   */
  feed(
    data: ArrayLike<number>,
    options: { timeMs?: number; port?: MidiPortInfo | null } = {},
  ): ControlEvent[] {
    return this.deliver(this.injected, data, options.timeMs ?? 0, options.port ?? null)
  }

  /** Detach from every port. `open()` afterwards requests access again. */
  close(): void {
    for (const entry of this.attached.values()) entry.port.onmidimessage = null
    this.attached.clear()
    if (this.access) this.access.onstatechange = null
    this.access = null
    this.opening = null
    this.injected.reset()
  }

  private refreshPorts(): void {
    if (!this.access) return
    const seen = new Set<string>()
    for (const port of this.access.inputs.values()) {
      if (!this.wanted(port)) continue
      if (port.state === 'disconnected') continue
      seen.add(port.id)
      const existing = this.attached.get(port.id)
      if (existing) {
        existing.info = portInfo(port)
        if (existing.port !== port) {
          // The browser handed out a new object for a re-plugged port.
          existing.port.onmidimessage = null
          existing.port = port
          port.onmidimessage = this.handlerFor(existing)
        }
        continue
      }
      const entry: Attached = {
        port,
        info: portInfo(port),
        decoder: new MidiDecoder(this.decoderOptions),
      }
      port.onmidimessage = this.handlerFor(entry)
      this.attached.set(port.id, entry)
    }
    for (const [id, entry] of this.attached) {
      if (seen.has(id)) continue
      entry.port.onmidimessage = null
      this.attached.delete(id)
    }
    this.portChanges.emit(this.ports)
  }

  private wanted(port: MidiPortLike): boolean {
    if (!this.portFilter) return true
    return this.portFilter.has(port.id) || (port.name != null && this.portFilter.has(port.name))
  }

  private handlerFor(entry: Attached): (event: MidiMessageEventLike) => void {
    return (event) => {
      if (!event.data) return
      this.deliver(entry.decoder, event.data, event.timeStamp, entry.info)
    }
  }

  private deliver(
    decoder: MidiDecoder,
    data: ArrayLike<number>,
    timeMs: number,
    port: MidiPortInfo | null,
  ): ControlEvent[] {
    const events: ControlEvent[] = []
    for (const message of decoder.messages(data)) {
      this.messages.emit([message, port, timeMs])
      for (const event of decoder.eventsFor(message, timeMs)) {
        events.push(event)
        this.events.emit(event)
      }
    }
    return events
  }
}
