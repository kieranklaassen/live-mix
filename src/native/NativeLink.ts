// Ableton Link for a page, through the plug-in host.
//
// The host is the Link peer (`native/host/Source/LinkSession.cpp`, Ableton's
// own library); this is the page's view of it over the control connection:
// the session's state as it changes, the offset between the page's clock and
// the host's, and from the two the beat at any `performance.now()`. What a
// transport needs to play in time with the session is `beatAt`, `localMsAtBeat`
// and `start`; `OutputClock` (link-time.ts) takes those times on to an
// `AudioContext`. docs/link.md is the guide.

import type { NativeHostClient } from './HostClient'
import {
  LinkClockOffset,
  idleLinkState,
  linkBeatAt,
  linkMicrosAtBeat,
  type NativeLinkState,
} from './link-time'

/** What `NativeLink.set` can change; a field left out stays as it is. */
export interface NativeLinkSettings {
  /** Join or leave the session. */
  enabled?: boolean
  /** How this program is named to peers. */
  name?: string
  /** The session's tempo: every peer follows it. 20 to 999. */
  bpm?: number
  /** Beats in the bar this program keeps its place in. Default 4. */
  quantum?: number
  /** Share start and stop with peers that share theirs. */
  startStopSync?: boolean
  /** Link Audio: announce this program's channels and see the session's. */
  audio?: boolean
}

export interface NativeLinkOptions {
  /** The page's clock in milliseconds. Default `performance.now()`. */
  now?: () => number
  /** How often the clock offset is measured again. Default 1000 ms; 0 never. */
  syncIntervalMs?: number
  /** Round trips measured before `open` resolves. Default 6. */
  firstSyncs?: number
  setIntervalFn?: (callback: () => void, ms: number) => ReturnType<typeof setInterval>
  clearIntervalFn?: (id: ReturnType<typeof setInterval>) => void
}

export interface NativeLinkStartOptions {
  /** The page-clock time the beat is asked for at. Default now. */
  atMs?: number
  /** Also set the transport the session shares (start/stop sync). */
  playing?: boolean
}

export type NativeLinkListener = (state: NativeLinkState, previous: NativeLinkState) => void

export class NativeLink {
  /** How far the host's clock is from the page's. */
  readonly clock = new LinkClockOffset()
  private current: NativeLinkState
  private readonly client: NativeHostClient
  private readonly now: () => number
  private readonly listeners = new Set<NativeLinkListener>()
  private readonly unsubscribe: (() => void)[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly clearIntervalFn: NonNullable<NativeLinkOptions['clearIntervalFn']>
  private disposed = false

  private constructor(
    client: NativeHostClient,
    state: NativeLinkState,
    options: NativeLinkOptions,
  ) {
    this.client = client
    this.current = state
    this.now = options.now ?? (() => performance.now())
    this.clearIntervalFn = options.clearIntervalFn ?? ((id) => clearInterval(id))
  }

  /**
   * Reads the session from the host and measures the clock offset. A host
   * built without Link gives a `NativeLink` whose `available` is false and
   * whose state never changes.
   */
  static async open(
    client: NativeHostClient,
    options: NativeLinkOptions = {},
  ): Promise<NativeLink> {
    if (!client.info.link) return new NativeLink(client, idleLinkState(false), options)

    const link = new NativeLink(client, await client.call<NativeLinkState>('link'), options)
    link.unsubscribe.push(
      client.on('link', (state) => link.take(state)),
      client.on('close', () => link.take({ ...idleLinkState(true), bpm: link.current.bpm })),
    )
    for (let i = 0; i < (options.firstSyncs ?? 6); i += 1) await link.sync()

    const every = options.syncIntervalMs ?? 1000
    if (every > 0) {
      const setIntervalFn = options.setIntervalFn ?? ((callback, ms) => setInterval(callback, ms))
      link.timer = setIntervalFn(() => void link.sync().catch(() => undefined), every)
    }
    return link
  }

  /** Whether the host has Link at all. */
  get available(): boolean {
    return this.current.available
  }

  /** The session as the host last described it. */
  get state(): NativeLinkState {
    return this.current
  }

  /** Called whenever the host describes the session anew. Returns the unsubscribe. */
  onChange(listener: NativeLinkListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Changes the session or this program's part in it; resolves with the state after. */
  async set(settings: NativeLinkSettings): Promise<NativeLinkState> {
    if (!this.available) return this.current
    return this.take(await this.client.call<NativeLinkState>('link', settings))
  }

  /** Reads the state again without changing anything. */
  async refresh(): Promise<NativeLinkState> {
    return this.set({})
  }

  /** Measures the clock offset once more. */
  async sync(): Promise<void> {
    if (!this.available || this.disposed || this.client.closed) return
    const sent = this.now()
    const { micros } = await this.client.call<{ micros: number }>('linkPing')
    this.clock.add(sent, this.now(), micros)
  }

  /** The host's clock at a page-clock time (default now). */
  hostMicrosAt(localMs = this.now()): number {
    return this.clock.hostMicrosAt(localMs)
  }

  /** This program's beat at a page-clock time (default now). */
  beatAt(localMs = this.now()): number {
    return linkBeatAt(this.current, this.clock.hostMicrosAt(localMs))
  }

  /** The page-clock time `beat` falls at, as the session stands. */
  localMsAtBeat(beat: number): number {
    return this.clock.localMsAt(linkMicrosAtBeat(this.current, beat))
  }

  /**
   * Asks for `beat` at a page-clock time and resolves with the time it will
   * fall at. Alone in the session that is the time asked for. With peers it
   * is the next time `beat` has its place in the bar, at most one bar later:
   * start the transport then and it is in step from its first sound.
   */
  async start(beat: number, options: NativeLinkStartOptions = {}): Promise<number> {
    const atMs = options.atMs ?? this.now()
    if (!this.available) return atMs
    const state = await this.client.call<NativeLinkState & { atMicros: number }>('linkStart', {
      beat,
      atMicros: Math.round(this.clock.hostMicrosAt(atMs)),
      ...(options.playing === undefined ? {} : { playing: options.playing }),
    })
    return this.landed(state)
  }

  /**
   * After a peer started the shared transport (`state.playing` turned true):
   * puts `beat` where that start falls for this program and resolves with the
   * page-clock time, which is when to start.
   */
  async followStart(beat: number): Promise<number> {
    if (!this.available) return this.now()
    const state = await this.client.call<NativeLinkState & { atMicros: number }>('linkStart', {
      beat,
      follow: true,
    })
    return this.landed(state)
  }

  /** Tells the session this program's transport stopped (start/stop sync). */
  async stop(atMs = this.now()): Promise<void> {
    if (!this.available) return
    this.take(
      await this.client.call<NativeLinkState>('linkStop', {
        atMicros: Math.round(this.clock.hostMicrosAt(atMs)),
      }),
    )
  }

  /** Stops following the host. The session itself is left as it is. */
  dispose(): void {
    this.disposed = true
    if (this.timer !== null) this.clearIntervalFn(this.timer)
    this.timer = null
    for (const off of this.unsubscribe.splice(0)) off()
    this.listeners.clear()
  }

  private landed(state: NativeLinkState & { atMicros: number }): number {
    const { atMicros, ...rest } = state
    this.take(rest)
    return this.clock.localMsAt(atMicros)
  }

  private take(state: NativeLinkState): NativeLinkState {
    if (this.disposed) return this.current
    const previous = this.current
    // The `event` name rides along on an event's payload; it is not state.
    const next: NativeLinkState & { event?: string } = { ...state }
    delete next.event
    this.current = next
    for (const listener of [...this.listeners]) listener(next, previous)
    return next
  }
}
