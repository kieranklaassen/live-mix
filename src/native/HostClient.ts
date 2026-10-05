// The control connection to the plug-in host: requests, their answers, and
// the host's events. One client serves every hosted device on the page; each
// device opens its own audio connection through its pump.

import {
  NATIVE_PROTOCOL_VERSION,
  type NativeHostAddress,
  type NativeHostEvent,
  type NativeHostEvents,
  type NativeHostInfo,
  type NativeLoadOptions,
  type NativeParamInfo,
  type NativePluginInfo,
  type NativeScanOptions,
  type NativeScanResult,
  type NativeSlotInfo,
} from './protocol'

/** The slice of `WebSocket` the client uses. */
export interface ControlSocket {
  readyState: number
  onopen: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: ((event: { reason?: string }) => void) | null
  onerror: ((event: unknown) => void) | null
  send(data: string): void
  close(): void
}

export interface NativeHostClientOptions {
  /** Replaces `new WebSocket(url)` (tests, Node). */
  createSocket?: (url: string) => ControlSocket
  /** How long to wait for the connection and the `hello` answer. Default 5000 ms. */
  timeoutMs?: number
}

interface Pending {
  resolve: (result: unknown) => void
  reject: (error: Error) => void
}

type Listener<E extends NativeHostEvent> = (payload: NativeHostEvents[E]) => void

const SOCKET_OPEN = 1

/** `globalThis.liveMixHost`, which a desktop shell's preload script sets. */
export function findNativeHost(): NativeHostAddress | null {
  const candidate = (globalThis as { liveMixHost?: Partial<NativeHostAddress> }).liveMixHost
  if (!candidate || typeof candidate.url !== 'string' || typeof candidate.token !== 'string') {
    return null
  }
  return { url: candidate.url, token: candidate.token }
}

export class NativeHostClient {
  /** What the host said about itself when the connection opened. */
  readonly info: NativeHostInfo
  readonly address: NativeHostAddress
  private readonly socket: ControlSocket
  private readonly pending = new Map<number, Pending>()
  private readonly listeners = new Map<NativeHostEvent, Set<(payload: never) => void>>()
  private nextId = 1
  private closedReason: string | null = null

  private constructor(address: NativeHostAddress, socket: ControlSocket, info: NativeHostInfo) {
    this.address = address
    this.socket = socket
    this.info = info
  }

  /** Open the control connection and exchange `hello`; rejects on a protocol mismatch. */
  static async connect(
    address: NativeHostAddress,
    options: NativeHostClientOptions = {},
  ): Promise<NativeHostClient> {
    const base = address.url.replace(/\/+$/, '')
    const url = `${base}/control?token=${encodeURIComponent(address.token)}`
    const createSocket =
      options.createSocket ??
      ((target: string) => new WebSocket(target) as unknown as ControlSocket)
    const socket = createSocket(url)
    const timeoutMs = options.timeoutMs ?? 5000

    const client = new NativeHostClient({ url: base, token: address.token }, socket, {
      protocol: 0,
      name: '',
      version: '',
      juce: '',
      formats: [],
      platform: 'linux',
    })
    socket.onmessage = (event) => client.receive(event.data)
    socket.onclose = (event) =>
      client.finish(
        event.reason === ''
          ? 'the plug-in host went away'
          : (event.reason ?? 'the plug-in host went away'),
      )

    const timed = <T>(work: Promise<T>): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`live-mix: no answer from the plug-in host at ${base}`))
          socket.close()
        }, timeoutMs)
        work.then(
          (value) => {
            clearTimeout(timer)
            resolve(value)
          },
          (error: unknown) => {
            clearTimeout(timer)
            reject(error instanceof Error ? error : new Error(String(error)))
          },
        )
      })

    await timed(
      new Promise<void>((resolve, reject) => {
        socket.onopen = () => resolve()
        socket.onerror = () =>
          reject(new Error(`live-mix: could not reach the plug-in host at ${base}`))
        if (socket.readyState === SOCKET_OPEN) resolve()
      }),
    )
    socket.onerror = () => client.finish('the connection to the plug-in host failed')

    // An answer with nothing in it is not the host's either: refused the same way, and let go of.
    const info = await timed(client.call<NativeHostInfo | undefined>('hello'))
    if (info?.protocol !== NATIVE_PROTOCOL_VERSION) {
      client.close()
      throw new Error(
        `live-mix: the plug-in host speaks protocol ${info?.protocol}, this library speaks ${NATIVE_PROTOCOL_VERSION}`,
      )
    }
    Object.assign(client.info, info)
    return client
  }

  get closed(): boolean {
    return this.closedReason !== null
  }

  /** One request; rejects with the host's error message or when the connection is gone. */
  call<T = unknown>(method: string, params: object = {}): Promise<T> {
    if (this.closedReason !== null) {
      return Promise.reject(new Error(`live-mix: ${this.closedReason}`))
    }
    const id = this.nextId++
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (result: unknown) => void, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  /** A request nobody waits for (knob moves). */
  notify(method: string, params: object = {}): void {
    if (this.closedReason !== null) return
    this.socket.send(JSON.stringify({ method, params }))
  }

  on<E extends NativeHostEvent>(event: E, listener: Listener<E>): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(listener)
    return () => {
      set.delete(listener)
    }
  }

  /** The plug-ins the host already knows (its cached list), without scanning. */
  async plugins(): Promise<NativePluginInfo[]> {
    return (await this.known()).plugins
  }

  /**
   * What the host already knows, without scanning: its list, and what its
   * scans left out of it (`failed`, `crashed`, their `names`, and the
   * `reasons` a file failed for), which it keeps between runs. An older host
   * says only the list.
   */
  async known(): Promise<NativeScanResult> {
    const known = await this.call<Partial<NativeScanResult>>('plugins')
    return {
      plugins: known.plugins ?? [],
      failed: known.failed ?? [],
      crashed: known.crashed ?? [],
      names: known.names ?? {},
      reasons: known.reasons ?? {},
    }
  }

  /**
   * Search the plug-in folders. Files already known and unchanged are not
   * loaded again, so only the first scan is slow. `scanProgress` events name
   * each file before it is opened.
   */
  scan(options: NativeScanOptions = {}): Promise<NativeScanResult> {
    return this.call<NativeScanResult>('scan', options)
  }

  /**
   * End the scan that is running. Its `scan()` resolves with what was found
   * until then and `stopped: true`; the plug-in it was looking at is not held
   * against it, and the next scan carries on from there. Resolves with
   * whether a scan was running.
   */
  async stopScan(): Promise<boolean> {
    const { stopped } = await this.call<{ stopped: boolean }>('stopScan')
    return stopped
  }

  load(options: NativeLoadOptions): Promise<NativeSlotInfo> {
    return this.call<NativeSlotInfo>('load', options)
  }

  unload(slot: string): Promise<void> {
    return this.call('unload', { slot }).then(() => undefined)
  }

  /** `value` is normalised 0..1. */
  setParam(slot: string, index: number, value: number): void {
    this.notify('setParam', { slot, index, value })
  }

  async getParams(slot: string): Promise<NativeParamInfo[]> {
    const { params } = await this.call<{ params: NativeParamInfo[] }>('getParams', { slot })
    return params
  }

  async getState(slot: string): Promise<string> {
    const { state } = await this.call<{ state: string }>('getState', { slot })
    return state
  }

  setState(
    slot: string,
    state: string,
  ): Promise<{ params: NativeParamInfo[]; latencySamples: number }> {
    return this.call('setState', { slot, state })
  }

  showEditor(slot: string): Promise<void> {
    return this.call('showEditor', { slot }).then(() => undefined)
  }

  hideEditor(slot: string): Promise<void> {
    return this.call('hideEditor', { slot }).then(() => undefined)
  }

  /**
   * Tempo and run state every loaded plug-in sees on its play head. A field
   * left out keeps its value: `{ bpm }` does not start a stopped play head.
   */
  setTransport(transport: { bpm?: number; playing?: boolean }): void {
    this.notify('setTransport', transport)
  }

  /** The address of a slot's audio connection, for its pump. */
  audioUrl(slot: string, outputChannels = 2): string {
    const { url, token } = this.address
    return `${url}/audio?token=${encodeURIComponent(token)}&slot=${encodeURIComponent(slot)}&out=${outputChannels}`
  }

  /** The address of one Link Audio channel this page sends, for its pump. */
  linkAudioUrl(name: string): string {
    const { url, token } = this.address
    return `${url}/link-audio?token=${encodeURIComponent(token)}&name=${encodeURIComponent(name)}`
  }

  /** The address of one Link Audio channel this page listens to, for its intake. */
  linkAudioInUrl(channelId: string): string {
    const { url, token } = this.address
    return `${url}/link-audio-in?token=${encodeURIComponent(token)}&channel=${encodeURIComponent(channelId)}`
  }

  close(): void {
    this.finish('closed')
    this.socket.close()
  }

  private receive(data: unknown): void {
    if (typeof data !== 'string') return
    let message: {
      id?: number
      result?: unknown
      error?: { message?: string }
      event?: NativeHostEvent
    } | null
    try {
      message = JSON.parse(data) as typeof message
    } catch {
      return
    }
    // `null` is JSON as well, and no message.
    if (message === null) return
    if (typeof message.event === 'string') {
      this.emit(message.event, message as never)
      return
    }
    if (typeof message.id !== 'number') return
    const waiting = this.pending.get(message.id)
    if (!waiting) return
    this.pending.delete(message.id)
    if (message.error) {
      waiting.reject(new Error(`live-mix: ${message.error.message ?? 'the plug-in host refused'}`))
    } else {
      waiting.resolve(message.result)
    }
  }

  private emit<E extends NativeHostEvent>(event: E, payload: NativeHostEvents[E]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const listener of [...set]) (listener as Listener<E>)(payload)
  }

  private finish(reason: string): void {
    if (this.closedReason !== null) return
    this.closedReason = reason
    for (const waiting of this.pending.values()) waiting.reject(new Error(`live-mix: ${reason}`))
    this.pending.clear()
    this.emit('close', { reason })
  }
}
