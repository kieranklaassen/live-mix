// Time in an Ableton Link session, as a page sees it.
//
// The plug-in host joins the session (a page cannot: Link is multicast UDP)
// and describes it as one beat at one moment on its own clock, plus the tempo.
// From that the page can say which beat any other moment is, for as long as
// the description stands. The page's clock (`performance.now()`) and the
// host's are two clocks; `LinkClockOffset` finds how far apart they are by
// asking the host for its time and halving the round trip.
//
// Beats here are this program's own count. Peers of a session share the tempo
// and the place in the bar (the beat modulo the quantum), never the count.

/** One Link Audio channel in the session. */
export interface NativeLinkChannel {
  id: string
  name: string
  /** The peer that sends it. */
  peer: string
  peerName: string
}

/** The answer to `link`, and the payload of the host's `link` event. */
export interface NativeLinkState {
  /** False when the host was built without Link; nothing else is set then. */
  available: boolean
  /** In the session: finding peers and following them. */
  enabled: boolean
  /** How this program is named to peers that show names (Link Audio). */
  name: string
  /** Other programs in the session. */
  peers: number
  bpm: number
  /** Beats in the bar peers agree on. */
  quantum: number
  /** This program's beat at `micros`. */
  beat: number
  /** The host's clock when `beat` was read, in microseconds. */
  micros: number
  /** The shared transport, for peers with start/stop sync on. */
  playing: boolean
  /** When the shared transport last started or stopped, on the host's clock. */
  playingAtMicros: number
  startStopSync: boolean
  /** Link Audio: channels are announced and can be listened to. */
  audio: boolean
  /** Every channel the session's other peers send; this program's own are not listed. */
  channels: NativeLinkChannel[]
}

/** A session nobody has joined: what a host without Link, or not yet asked, stands for. */
export function idleLinkState(available = false): NativeLinkState {
  return {
    available,
    enabled: false,
    name: '',
    peers: 0,
    bpm: 120,
    quantum: 4,
    beat: 0,
    micros: 0,
    playing: false,
    playingAtMicros: 0,
    startStopSync: false,
    audio: false,
    channels: [],
  }
}

type BeatClock = Pick<NativeLinkState, 'beat' | 'micros' | 'bpm'>

/** The beat `state` puts at `micros` on the host's clock. */
export function linkBeatAt(state: BeatClock, micros: number): number {
  return state.beat + ((micros - state.micros) * state.bpm) / 60e6
}

/** When, on the host's clock, `state` puts `beat`. */
export function linkMicrosAtBeat(state: BeatClock, beat: number): number {
  return state.micros + ((beat - state.beat) * 60e6) / state.bpm
}

/** The place in the bar of `beat`: 0 up to, not including, `quantum`. */
export function linkPhase(beat: number, quantum: number): number {
  if (!(quantum > 0)) return 0
  const phase = beat % quantum
  return phase < 0 ? phase + quantum : phase
}

/**
 * The first beat at or after `fromBeat` that sits where `likeBeat` does in
 * the bar. This is where a transport placed at `likeBeat` can come in without
 * leaving the bar its peers are in.
 */
export function nextBeatInPhase(fromBeat: number, likeBeat: number, quantum: number): number {
  if (!(quantum > 0)) return fromBeat
  const ahead = linkPhase(likeBeat - fromBeat, quantum)
  // A hair short of a whole bar is the same place, reached by rounding.
  return fromBeat + (quantum - ahead < 1e-9 ? 0 : ahead)
}

interface OffsetSample {
  /** Host micros minus local micros, at the middle of the round trip. */
  offset: number
  /** Round trip in milliseconds: how far `offset` can be out, twice over. */
  tripMs: number
}

/**
 * How far the host's clock is from a local one, from round trips: the local
 * time a question was sent and its answer came back, and the host's time in
 * the answer. The host read its clock somewhere inside the trip, so the
 * shortest recent trip pins the offset best; older ones are let go because
 * two clocks drift (a millisecond in a minute is ordinary).
 */
export class LinkClockOffset {
  private readonly samples: OffsetSample[] = []
  private readonly keep: number

  constructor(keep = 8) {
    this.keep = Math.max(1, keep)
  }

  /** One round trip. `sentMs` and `receivedMs` are local, `hostMicros` the host's answer. */
  add(sentMs: number, receivedMs: number, hostMicros: number): void {
    const tripMs = receivedMs - sentMs
    if (!(tripMs >= 0) || !Number.isFinite(hostMicros)) return
    this.samples.push({ offset: hostMicros - ((sentMs + receivedMs) / 2) * 1000, tripMs })
    if (this.samples.length > this.keep) this.samples.shift()
  }

  /** True once a round trip has been measured. */
  get known(): boolean {
    return this.samples.length > 0
  }

  /** Host microseconds minus local microseconds; 0 until a trip has been measured. */
  get offsetMicros(): number {
    let best: OffsetSample | null = null
    for (const sample of this.samples) if (!best || sample.tripMs <= best.tripMs) best = sample
    return best ? best.offset : 0
  }

  /** The round trip the offset rests on, in milliseconds: its error is at most half of this. */
  get tripMs(): number {
    let best = Infinity
    for (const sample of this.samples) best = Math.min(best, sample.tripMs)
    return Number.isFinite(best) ? best : 0
  }

  /** The host's clock at a local time. */
  hostMicrosAt(localMs: number): number {
    return localMs * 1000 + this.offsetMicros
  }

  /** The local time of a moment on the host's clock. */
  localMsAt(hostMicros: number): number {
    return (hostMicros - this.offsetMicros) / 1000
  }
}

/** The slice of `AudioContext` that says when what it renders is heard. */
export interface OutputClockContext {
  readonly currentTime: number
  readonly baseLatency?: number
  readonly outputLatency?: number
  getOutputTimestamp?: () => { contextTime?: number; performanceTime?: number }
}

/**
 * Local milliseconds minus context milliseconds for sound leaving the output
 * right now: add it to a context time (in ms) to get the `performance.now()`
 * at which that time is heard. The browser's own pairing
 * (`getOutputTimestamp`) is used where it has one; otherwise the context's
 * clock is taken to run `outputLatency` ahead of the output.
 */
export function outputClockOffsetMs(context: OutputClockContext, nowMs: number): number {
  const stamp = context.getOutputTimestamp?.()
  const contextTime = stamp?.contextTime ?? 0
  const performanceTime = stamp?.performanceTime ?? 0
  if (contextTime > 0 && performanceTime > 0) return performanceTime - contextTime * 1000
  const latency = (context.outputLatency ?? 0) || (context.baseLatency ?? 0)
  return nowMs - (context.currentTime - latency) * 1000
}

/**
 * When what an `AudioContext` renders is heard, on the page's clock. The
 * browser's pairing of the two moves by a little from one reading to the
 * next, so the middle of the last few readings is used: a late callback
 * cannot shift it. A real change (the output device was swapped, or dropped
 * a buffer and now plays everything that much later) comes through as soon
 * as three readings in a row agree on it.
 */
export class OutputClock {
  private readings: number[] = []
  private readonly keep: number
  private readonly context: OutputClockContext
  private readonly now: () => number

  constructor(context: OutputClockContext, options: { now?: () => number; keep?: number } = {}) {
    this.context = context
    this.now = options.now ?? (() => performance.now())
    this.keep = Math.max(1, options.keep ?? 15)
  }

  /** Takes one reading; call it a few times a second while the mapping is in use. */
  sample(): void {
    const reading = outputClockOffsetMs(this.context, this.now())
    if (!Number.isFinite(reading)) return
    this.readings.push(reading)
    if (this.readings.length > this.keep) this.readings.shift()

    // Three in a row that agree with each other and not with the rest: the
    // output moved. The rest are let go, so the answer follows at once.
    const count = this.readings.length
    if (count <= OUTPUT_STEP_READINGS) return
    const recent = this.readings.slice(count - OUTPUT_STEP_READINGS)
    const spread = Math.max(...recent) - Math.min(...recent)
    const settled = middle(this.readings.slice(0, count - OUTPUT_STEP_READINGS))
    if (spread <= OUTPUT_STEP_AGREE_MS && Math.abs(middle(recent) - settled) > OUTPUT_STEP_MS) {
      this.readings = recent
    }
  }

  /** Local milliseconds minus context milliseconds, as last settled. */
  get offsetMs(): number {
    if (this.readings.length === 0) this.sample()
    if (this.readings.length === 0) return 0
    return middle(this.readings)
  }

  /** The `performance.now()` at which context time `contextTime` (seconds) is heard. */
  localMsAt(contextTime: number): number {
    return contextTime * 1000 + this.offsetMs
  }

  /** The context time (seconds) heard at local time `localMs`. */
  contextTimeAt(localMs: number): number {
    return (localMs - this.offsetMs) / 1000
  }
}

/** Readings in a row that have to agree before the output is taken to have moved. */
const OUTPUT_STEP_READINGS = 3
/** How close those readings have to be to each other, in milliseconds. */
const OUTPUT_STEP_AGREE_MS = 1
/** How far from the settled value they have to be: more than reading-to-reading wobble. */
const OUTPUT_STEP_MS = 2

function middle(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[sorted.length >> 1]
}
