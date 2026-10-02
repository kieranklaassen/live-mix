// A plug-in host small enough for unit tests: the control protocol of
// `@kieranklaassen/live-mix/native` over a fake socket, two plug-ins, and a
// record of what it was asked. It moves no audio; an application uses it to
// test its plug-in list, its registry and its documents without a host binary:
//
//   const host = new FakePluginHost()
//   const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
//     createSocket: host.createSocket,
//   })

import { type ControlSocket } from '../native/HostClient'
import {
  NATIVE_PROTOCOL_VERSION,
  type NativeHostAddress,
  type NativeParamInfo,
  type NativePluginInfo,
  type NativeSlotInfo,
} from '../native/protocol'

export const FAKE_HOST_ADDRESS: NativeHostAddress = { url: 'ws://127.0.0.1:4010', token: 'secret' }

/** An effect: five parameters, an editor, 64 samples of latency. */
export const FAKE_REVERB: NativePluginInfo = {
  id: 'VST3-Fake Verb-1a2b-3c4d',
  name: 'Fake Verb',
  vendor: 'Fakes',
  format: 'VST3',
  category: 'Fx|Reverb',
  version: '1.2.0',
  file: '/plugins/FakeVerb.vst3',
  isInstrument: false,
}

/** An instrument: one parameter, takes MIDI. */
export const FAKE_SYNTH: NativePluginInfo = {
  id: 'AudioUnit:Synths/aumu,Fsyn,Fake',
  name: 'Fake Synth',
  vendor: 'Fakes',
  format: 'AudioUnit',
  category: 'Instrument',
  version: '0.9.0',
  file: 'AudioUnit:Synths/aumu,Fsyn,Fake',
  isInstrument: true,
}

function param(
  index: number,
  id: string,
  name: string,
  extra: Partial<NativeParamInfo> = {},
): NativeParamInfo {
  return {
    index,
    id,
    name,
    label: '',
    value: 0.5,
    default: 0.5,
    text: '50',
    discrete: false,
    boolean: false,
    automatable: true,
    bypass: false,
    steps: 0,
    ...extra,
  }
}

export function fakeReverbParams(): NativeParamInfo[] {
  return [
    param(0, '100', 'Decay', { label: 's', value: 0.25, default: 0.25, text: '2.4' }),
    param(1, '7', 'Mix', { label: '%', text: '50' }),
    param(2, '30', 'Mode', {
      discrete: true,
      steps: 3,
      value: 0.5,
      default: 0,
      text: 'Plate',
      choices: ['Hall', 'Plate', 'Room'],
    }),
    param(3, '99', 'Sample Rate', { automatable: false, text: '48000' }),
    param(4, '1000', 'Bypass', {
      discrete: true,
      boolean: true,
      steps: 2,
      bypass: true,
      value: 0,
      default: 0,
      text: 'Off',
      choices: ['Off', 'On'],
    }),
  ]
}

/** The control socket a `FakePluginHost` hands out. */
export class FakeSocket implements ControlSocket {
  readyState = 0
  onopen: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: ((event: { reason?: string }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  readonly sent: string[] = []
  readonly url: string
  closed = false
  private readonly onSend: (data: string, socket: FakeSocket) => void

  constructor(url: string, onSend: (data: string, socket: FakeSocket) => void) {
    this.url = url
    this.onSend = onSend
  }

  open(): void {
    this.readyState = 1
    this.onopen?.({})
  }

  send(data: string): void {
    this.sent.push(data)
    this.onSend(data, this)
  }

  deliver(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) })
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    this.readyState = 3
    this.onclose?.({ reason: '' })
  }
}

interface Request {
  id?: number
  method: string
  params: Record<string, unknown>
}

/** The state a fake plug-in has until it is given another. */
export const FAKE_STATE = 'c3RhdGU='

export interface FakePluginHostOptions {
  protocol?: number
  plugins?: NativePluginInfo[]
  /** Latency the reverb reports. */
  latencySamples?: number
}

export class FakePluginHost {
  readonly requests: Request[] = []
  readonly sockets: FakeSocket[] = []
  readonly slots = new Map<string, { plugin: string; params: NativeParamInfo[]; state: string }>()
  private readonly options: FakePluginHostOptions
  private nextSlot = 1

  constructor(options: FakePluginHostOptions = {}) {
    this.options = options
  }

  /** `createSocket` for `NativeHostClient.connect`: opens on the next microtask. */
  readonly createSocket = (url: string): FakeSocket => {
    const socket: FakeSocket = new FakeSocket(url, (data) =>
      this.handle(JSON.parse(data) as Request, socket),
    )
    this.sockets.push(socket)
    queueMicrotask(() => socket.open())
    return socket
  }

  get socket(): FakeSocket {
    return this.sockets[this.sockets.length - 1]
  }

  /** Requests of one method, in order. */
  calls(method: string): Request[] {
    return this.requests.filter((request) => request.method === method)
  }

  /** Send an event to the page, as the host does (`params`, `latency`, `editorClosed`, `stateChanged`). */
  emit(event: string, fields: Record<string, unknown>): void {
    this.socket.deliver({ event, ...fields })
  }

  private handle(request: Request, socket: FakeSocket): void {
    this.requests.push(request)
    const reply = (result: unknown): void => {
      if (request.id !== undefined) queueMicrotask(() => socket.deliver({ id: request.id, result }))
    }
    const fail = (message: string): void => {
      queueMicrotask(() => socket.deliver({ id: request.id, error: { message } }))
    }
    const plugins = this.options.plugins ?? [FAKE_REVERB, FAKE_SYNTH]

    switch (request.method) {
      case 'hello':
        reply({
          protocol: this.options.protocol ?? NATIVE_PROTOCOL_VERSION,
          name: 'live-mix-plugin-host',
          version: '0.1.0',
          juce: '9.0.2',
          formats: ['VST3', 'AudioUnit'],
          platform: 'mac',
        })
        break
      case 'plugins':
        reply({ plugins })
        break
      case 'scan':
        socket.deliver({
          event: 'scanProgress',
          format: 'VST3',
          file: FAKE_REVERB.file,
          progress: 0,
        })
        reply({ plugins, failed: ['/plugins/Broken.vst3'] })
        break
      case 'load': {
        const plugin = plugins.find((candidate) => candidate.id === request.params.plugin)
        if (!plugin) {
          fail(`unknown plug-in "${String(request.params.plugin)}"; scan first or load by file`)
          break
        }
        const slot = `s${this.nextSlot++}`
        const params = plugin.isInstrument ? [param(0, '1', 'Level')] : fakeReverbParams()
        this.slots.set(slot, {
          plugin: plugin.id,
          params,
          state: typeof request.params.state === 'string' ? request.params.state : FAKE_STATE,
        })
        const info: NativeSlotInfo = {
          slot,
          plugin: plugin.id,
          name: plugin.name,
          vendor: plugin.vendor,
          format: plugin.format,
          isInstrument: plugin.isInstrument,
          inputs: plugin.isInstrument ? 0 : 2,
          outputs: 2,
          sampleRate: Number(request.params.sampleRate),
          blockSize: Number(request.params.blockSize),
          latencySamples: plugin.isInstrument ? 0 : (this.options.latencySamples ?? 64),
          tailSeconds: 0,
          hasEditor: !plugin.isInstrument,
          acceptsMidi: plugin.isInstrument,
          params,
        }
        reply(info)
        break
      }
      case 'unload':
        this.slots.delete(String(request.params.slot))
        reply({})
        break
      case 'getParams':
        reply({ params: this.slots.get(String(request.params.slot))?.params ?? [] })
        break
      case 'getState':
        // What the slot was last given, or the plug-in's own first state.
        reply({ state: this.slots.get(String(request.params.slot))?.state ?? FAKE_STATE })
        break
      case 'setState': {
        const slot = this.slots.get(String(request.params.slot))
        if (!slot) {
          fail('unknown slot')
          break
        }
        slot.state = String(request.params.state)
        slot.params = slot.params.map((entry) =>
          entry.index === 0 ? { ...entry, value: 0.75, text: '7.2' } : entry,
        )
        reply({ params: slot.params, latencySamples: 256 })
        break
      }
      default:
        reply({})
    }
  }
}
