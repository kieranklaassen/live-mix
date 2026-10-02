// The Link session of a `FakePluginHost`: what the real host says about
// Ableton Link, with no network behind it. A test plays the peers itself:
//
//   const host = new FakePluginHost()
//   host.link.peerJoins({ bpm: 96 })      // a session at 96 bpm appears
//   host.link.peerSetsTempo(110)
//   host.link.peerStarts()                // with start/stop sync on
//
// It keeps time the way a session does: one beat at one moment and a tempo,
// re-pivoted whenever the tempo changes, and a beat asked for while peers are
// present waits for its place in the bar.

import {
  idleLinkState,
  linkBeatAt,
  linkMicrosAtBeat,
  nextBeatInPhase,
  type NativeLinkChannel,
  type NativeLinkState,
} from '../native/link-time'

/** How far the fake host's clock is ahead of `performance.now()`, in microseconds. */
export const FAKE_LINK_CLOCK_SKEW_MICROS = 5_000_000_000

export interface FakeLinkOptions {
  /** The host's clock in microseconds. Default `performance.now()` plus `FAKE_LINK_CLOCK_SKEW_MICROS`. */
  clock?: () => number
}

export class FakeLinkSession {
  /** Called with the new state whenever a peer changes the session. */
  onAnnounce: ((state: NativeLinkState) => void) | null = null
  private readonly clock: () => number
  private current: NativeLinkState = { ...idleLinkState(true), name: 'live-mix' }

  constructor(options: FakeLinkOptions = {}) {
    this.clock =
      options.clock ?? (() => Math.round(performance.now() * 1000) + FAKE_LINK_CLOCK_SKEW_MICROS)
    this.current.micros = this.clock()
    this.current.playingAtMicros = this.current.micros
  }

  /** The host's clock now, in microseconds. */
  micros(): number {
    return this.clock()
  }

  /** The session read now: the beat is where the tempo has carried it. */
  describe(): NativeLinkState {
    const micros = this.clock()
    this.current = { ...this.current, beat: linkBeatAt(this.current, micros), micros }
    return { ...this.current, channels: this.current.channels.map((channel) => ({ ...channel })) }
  }

  /** The `link` request. */
  apply(settings: Record<string, unknown>): NativeLinkState {
    const now = this.describe()
    if (typeof settings.name === 'string') now.name = settings.name
    if (typeof settings.quantum === 'number' && settings.quantum >= 1)
      now.quantum = settings.quantum
    if (typeof settings.startStopSync === 'boolean') now.startStopSync = settings.startStopSync
    if (typeof settings.bpm === 'number' && Number.isFinite(settings.bpm)) {
      now.bpm = Math.min(999, Math.max(20, settings.bpm))
    }
    if (typeof settings.enabled === 'boolean') {
      now.enabled = settings.enabled
      if (!settings.enabled) now.peers = 0
    }
    if (typeof settings.audio === 'boolean') now.audio = settings.audio
    this.current = now
    return this.describe()
  }

  /** The `linkStart` request; the answer carries `atMicros`, when the beat falls. */
  start(params: Record<string, unknown>): NativeLinkState & { atMicros: number } {
    const state = this.describe()
    const beat = Number(params.beat)
    const asked = params.follow
      ? state.playingAtMicros
      : typeof params.atMicros === 'number'
        ? params.atMicros
        : state.micros
    // Alone, the beat falls when asked; in company, at its next place in the bar.
    const atBeat =
      state.peers > 0
        ? nextBeatInPhase(linkBeatAt(state, asked), beat, state.quantum)
        : linkBeatAt(state, asked)
    const atMicros = Math.round(linkMicrosAtBeat(state, atBeat))
    // This program's count moves so that `beat` is the beat at that time.
    this.current = { ...state, beat: state.beat + (beat - atBeat) }
    if (params.playing === true) {
      this.current.playing = true
      this.current.playingAtMicros = atMicros
    } else if (params.playing === false) {
      this.current.playing = false
      this.current.playingAtMicros = asked
    }
    return { ...this.describe(), atMicros }
  }

  /** The `linkStop` request. */
  stop(params: Record<string, unknown>): NativeLinkState {
    const state = this.describe()
    this.current = {
      ...state,
      playing: false,
      playingAtMicros: typeof params.atMicros === 'number' ? params.atMicros : state.micros,
    }
    return this.describe()
  }

  /** The last page that followed the session went away: the host leaves it. */
  leave(): void {
    this.current = { ...this.describe(), enabled: false, audio: false, peers: 0, channels: [] }
  }

  /**
   * Peers appear. Joining a session means taking its tempo, and its bar:
   * `beatShift` moves this program's beat by that much, as joining does when
   * the session's bar is elsewhere.
   */
  peerJoins(options: { peers?: number; bpm?: number; beatShift?: number } = {}): void {
    const state = this.describe()
    this.current = {
      ...state,
      peers: state.peers + (options.peers ?? 1),
      bpm: options.bpm ?? state.bpm,
      beat: state.beat + (options.beatShift ?? 0),
    }
    this.announce()
  }

  /** Every peer leaves. */
  peersLeave(): void {
    this.current = { ...this.describe(), peers: 0, channels: [] }
    this.announce()
  }

  /** A peer changes the session's tempo. */
  peerSetsTempo(bpm: number): void {
    this.current = { ...this.describe(), bpm }
    this.announce()
  }

  /** A peer starts the shared transport, `inMicros` from now. Heard only with start/stop sync on. */
  peerStarts(inMicros = 0): void {
    const state = this.describe()
    if (!state.startStopSync) return
    this.current = { ...state, playing: true, playingAtMicros: state.micros + inMicros }
    this.announce()
  }

  /** A peer stops the shared transport. Heard only with start/stop sync on. */
  peerStops(): void {
    const state = this.describe()
    if (!state.startStopSync) return
    this.current = { ...state, playing: false, playingAtMicros: state.micros }
    this.announce()
  }

  /** The session's Link Audio channels, as peers announce them. */
  setChannels(channels: NativeLinkChannel[]): void {
    this.current = { ...this.describe(), channels }
    this.announce()
  }

  private announce(): void {
    this.onAnnounce?.(this.describe())
  }
}
