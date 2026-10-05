// A plug-in host small enough for unit tests: the control protocol of
// `@kieranklaassen/live-mix/native` over a fake socket, two plug-ins, and a
// record of what it was asked, plus a Link session a test plays the peers of
// (`host.link`, fake-link.ts). It moves no audio; an application uses it to
// test its plug-in list, its registry and its documents without a host binary:
//
//   const host = new FakePluginHost()
//   const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
//     createSocket: host.createSocket,
//   })

import { type ControlSocket } from '../native/HostClient'
import { FakeLinkSession, type FakeLinkOptions } from './fake-link'
import {
  NATIVE_PROTOCOL_VERSION,
  type NativeHostAddress,
  type NativeParamInfo,
  type NativePluginInfo,
  type NativeScanResult,
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

/** The file every scan of a fake host fails to load a plug-in from. */
export const FAKE_BROKEN_FILE = '/plugins/Broken.vst3'
/** What the fake says is wrong with every file it could load no plug-in from. */
export const FAKE_BROKEN_REASON = 'The bundle holds no program for this system.'

/** The state a fake plug-in has until it is given another. */
export const FAKE_STATE = 'c3RhdGU='

export interface FakePluginHostOptions {
  protocol?: number
  plugins?: NativePluginInfo[]
  /** Latency the reverb reports. */
  latencySamples?: number
  /** The host's last scan was cut short: it says so at hello. Default false. */
  scanUnfinished?: boolean
  /**
   * Plug-ins left out for having ended a scan before this host started, by
   * file: it says so from the start, as the real one keeps them between
   * runs. Default none.
   */
  crashed?: readonly string[]
  /** Files no plug-in could be loaded from before this host started. Default none. */
  failed?: readonly string[]
  /**
   * A scan does not answer by itself: it runs until `finishScan()` is called
   * or the page stops it. Default false, a scan that is over at once.
   */
  holdScans?: boolean
  /** False for a host built without Ableton Link. Default true. */
  link?: boolean
  /** The fake session's clock. */
  linkClock?: FakeLinkOptions['clock']
}

export class FakePluginHost {
  readonly requests: Request[] = []
  readonly sockets: FakeSocket[] = []
  readonly slots = new Map<string, { plugin: string; params: NativeParamInfo[]; state: string }>()
  /** The Link session; a test plays its peers through this. */
  readonly link: FakeLinkSession
  private readonly options: FakePluginHostOptions
  private readonly linkFollowers = new Set<FakeSocket>()
  private nextSlot = 1
  /** What scans have left out so far; a scan asked to `retry` one takes it off. */
  private failed: string[]
  private crashed: string[]
  /** Ends the scan that is held, as stopped or as through. */
  private endScan: ((stopped: boolean) => void) | null = null

  constructor(options: FakePluginHostOptions = {}) {
    this.options = options
    this.failed = [...(options.failed ?? [])]
    this.crashed = [...(options.crashed ?? [])]
    this.link = new FakeLinkSession({ clock: options.linkClock })
    this.link.onAnnounce = (state) => {
      for (const socket of this.linkFollowers) {
        if (!socket.closed) socket.deliver({ event: 'link', ...state })
      }
    }
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

  /** Lets a held scan (`holdScans`) run to its end; false when none is running. */
  finishScan(): boolean {
    const running = this.endScan
    running?.(false)
    return running !== null
  }

  /** Requests of one method, in order. */
  calls(method: string): Request[] {
    return this.requests.filter((request) => request.method === method)
  }

  /** Send an event to the page, as the host does (`params`, `latency`, `editorClosed`, `stateChanged`). */
  emit(event: string, fields: Record<string, unknown>): void {
    this.socket.deliver({ event, ...fields })
  }

  /** The answer to `plugins` and to a scan: the list and what is left out of it. */
  private known(plugins: NativePluginInfo[]): NativeScanResult {
    const failed = [...this.failed]
    const crashed = [...this.crashed]
    const name = (file: string): string => file.replace(/^.*\//, '').replace(/\.[^.]+$/, '')
    return {
      plugins,
      failed,
      crashed,
      names: Object.fromEntries([...failed, ...crashed].map((file) => [file, name(file)])),
      reasons: Object.fromEntries(failed.map((file) => [file, FAKE_BROKEN_REASON])),
    }
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
          scanUnfinished: this.options.scanUnfinished ?? false,
          link: this.options.link ?? true,
          ...((this.options.link ?? true) ? { linkVersion: '4.1', linkAudioReceive: true } : {}),
        })
        break
      case 'linkPing':
        // Answered at once, like the real one: the page times the round trip.
        if (request.id !== undefined) {
          socket.deliver({ id: request.id, result: { micros: this.link.micros() } })
        }
        break
      case 'link':
      case 'linkStart':
      case 'linkStop':
        if (!(this.options.link ?? true)) {
          if (request.method === 'link' && Object.keys(request.params).length === 0) {
            reply({ available: false, enabled: false })
          } else {
            fail('this host was built without Ableton Link')
          }
          break
        }
        this.linkFollowers.add(socket)
        if (request.method === 'link') reply(this.link.apply(request.params))
        else if (request.method === 'linkStop') reply(this.link.stop(request.params))
        // Like the real one: a beat that is no number (`null`, once sent) is not taken for beat 0.
        else if (typeof request.params.beat !== 'number') fail('linkStart needs a beat')
        else reply(this.link.start(request.params))
        break
      case 'plugins':
        reply(this.known(plugins))
        break
      case 'scan':
        socket.deliver({
          event: 'scanProgress',
          format: 'VST3',
          file: FAKE_REVERB.file,
          name: FAKE_REVERB.name,
          progress: 0,
        })
        // A plug-in given another go is no longer left out. One file never
        // loads: every scan that looks at it says so again.
        if (request.params.rescan === true) {
          this.failed = []
          this.crashed = []
        }
        for (const file of (request.params.retry as string[] | undefined) ?? []) {
          this.failed = this.failed.filter((entry) => entry !== file)
          this.crashed = this.crashed.filter((entry) => entry !== file)
        }
        if (!this.failed.includes(FAKE_BROKEN_FILE) && !this.crashed.includes(FAKE_BROKEN_FILE)) {
          this.failed.push(FAKE_BROKEN_FILE)
        }
        if (this.options.holdScans) {
          this.endScan = (stopped) => {
            this.endScan = null
            reply({
              ...this.known(this.options.plugins ?? plugins),
              ...(stopped ? { stopped } : {}),
            })
          }
          break
        }
        reply(this.known(plugins))
        break
      case 'stopScan': {
        // A scan that is not held is over at once: there is none to stop.
        const running = this.endScan
        running?.(true)
        reply({ stopped: running !== null })
        break
      }
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
