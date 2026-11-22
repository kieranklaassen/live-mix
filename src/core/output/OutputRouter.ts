// The single terminus of the whole mix. Lifted verbatim from Breathwork Live's
// musicEngine.ts (output mode, isIOSWebKit, element construction,
// setupMediaSession) so that lock-screen playback on iOS is an engine-wide
// property rather than something each code path has to remember.

/**
 * Where the final mix terminates. 'direct' (default) is ctx.destination —
 * nothing changes for desktop and Android. 'element' routes the whole mix
 * through a MediaStreamDestination into an UNMUTED `<audio>` element: iOS
 * treats media-element playback as a real audio session, so it keeps playing
 * when the screen locks, where bare Web Audio output is suspended.
 */
export type OutputMode = 'direct' | 'element'

/**
 * iOS/iPadOS WebKit gate for element output mode. Deliberately small: a
 * multi-touch device on an Apple platform without a window.chrome shim
 * (iPadOS reports itself as Macintosh but keeps its touch points).
 * Overridable — callers pass the mode explicitly, so tests and edge cases
 * never depend on sniffing.
 */
export function isIOSWebKit(win?: Window): boolean {
  const w = win ?? (typeof window !== 'undefined' ? window : undefined)
  if (!w?.navigator) return false
  const touch = (w.navigator.maxTouchPoints ?? 0) > 1
  const agent = w.navigator.userAgent ?? ''
  const apple = /iPhone|iPad|iPod/i.test(agent) || (agent.includes('Macintosh') && touch)
  const chromeLike = Boolean((w as Window & { chrome?: unknown }).chrome)
  return touch && apple && !chromeLike
}

export interface OutputRouterOptions {
  /** Final-mix routing; see OutputMode. Defaults to 'direct'. */
  mode?: OutputMode
  /** Lock-screen metadata title in element mode (e.g. the session theme). */
  mediaTitle?: string
  /** Lock-screen metadata artist in element mode. */
  mediaArtist?: string
  createAudioElement?: () => HTMLAudioElement
  /** Injectable for tests; defaults to navigator.mediaSession when present. */
  mediaSession?: MediaSession | null
}

/** Which of the two the output plays: the mix, or the reference beside it. */
export type HeardSource = 'mix' | 'reference'

/**
 * What is heard at the output: which of the mix and the reference, and the
 * gain each of them is heard at when it is the one. These gains are in the
 * heard path only. A render, a recorder on the master and the master's
 * meters are all ahead of them.
 */
export interface Heard {
  source: HeardSource
  /** Linear gain on the mix while it is heard. 1 until set. */
  mixGain: number
  /** Linear gain on the reference while it is heard. 1 until set. */
  referenceGain: number
}

/** How long the mix and the reference take to cross when what is heard changes. */
export const HEARD_CROSS_SECONDS = 0.02

// An approach with this time constant is within 2 % of where it is going
// when the crossing's length has passed, and the two approaches add up to
// one all the way, as two sounds that are nearly alike need.
const HEARD_TIME_CONSTANT = HEARD_CROSS_SECONDS / 4

/** The two gains only what is heard passes, both feeding the output. */
export interface HeardGains {
  readonly mix: GainNode
  readonly reference: GainNode
}

export class OutputRouter {
  readonly mode: OutputMode
  /**
   * The node every audible path must end at: ctx.destination in direct mode,
   * the MediaStreamDestination in element mode. Nothing in the engine may
   * connect to ctx.destination directly.
   */
  readonly output: AudioNode
  readonly element: HTMLAudioElement | null = null
  private readonly ctx: BaseAudioContext
  private heardNodes: HeardGains | null = null
  private heardValue: Heard = { source: 'mix', mixGain: 1, referenceGain: 1 }
  private readonly mediaSession: MediaSession | null
  private mediaTitle: string
  private mediaArtist: string | undefined
  private activated = false

  constructor(ctx: BaseAudioContext, options: OutputRouterOptions = {}) {
    this.ctx = ctx
    this.mode = options.mode ?? 'direct'
    this.mediaTitle = options.mediaTitle ?? 'live-mix'
    this.mediaArtist = options.mediaArtist
    this.mediaSession =
      options.mediaSession !== undefined
        ? options.mediaSession
        : typeof navigator !== 'undefined' && 'mediaSession' in navigator
          ? navigator.mediaSession
          : null

    if (this.mode === 'element') {
      const streamDestination = (ctx as AudioContext).createMediaStreamDestination()
      const element = (options.createAudioElement ?? (() => document.createElement('audio')))()
      element.autoplay = true
      // UNMUTED — in element mode this element IS the audible path.
      element.muted = false
      element.srcObject = streamDestination.stream
      this.element = element
      this.output = streamDestination
    } else {
      this.output = ctx.destination
    }
  }

  /** What is heard: the mix at unity until `setHeard` says otherwise. */
  get heard(): Heard {
    return { ...this.heardValue }
  }

  /**
   * The two gains of the heard path, made on first use and both feeding
   * `output`: the mix's at unity and the reference's silent, so that putting
   * the mix through its gain moves no level. Nothing is connected to them
   * here: the engine plays the master into the one and its reference into the
   * other (`Engine.setHeard`). Until they are asked for the output has no
   * node but its terminus.
   */
  heardGains(): HeardGains {
    if (this.heardNodes) return this.heardNodes
    const mix = this.ctx.createGain()
    const reference = this.ctx.createGain()
    reference.gain.value = 0
    mix.connect(this.output)
    reference.connect(this.output)
    this.heardNodes = { mix, reference }
    return this.heardNodes
  }

  /**
   * Say which of the two is heard and at what gain. What is left out stays as
   * it was. The one that is heard approaches its gain and the other approaches
   * silence, from now and over `HEARD_CROSS_SECONDS`, and both go on playing
   * into their gains all the while. Returns what is heard from now on. A host
   * calls `Engine.setHeard`, which first makes the reference and plays it and
   * the master into the two gains: called here alone, the gains are fed by
   * nothing.
   */
  setHeard(next: Partial<Heard>): Heard {
    const source = next.source ?? this.heardValue.source
    const mixGain = next.mixGain ?? this.heardValue.mixGain
    const referenceGain = next.referenceGain ?? this.heardValue.referenceGain
    this.heardValue = { source, mixGain, referenceGain }
    const { mix, reference } = this.heardGains()
    const at = this.ctx.currentTime
    mix.gain.setTargetAtTime(source === 'mix' ? mixGain : 0, at, HEARD_TIME_CONSTANT)
    reference.gain.setTargetAtTime(
      source === 'reference' ? referenceGain : 0,
      at,
      HEARD_TIME_CONSTANT,
    )
    return this.heard
  }

  /**
   * Start the element and register lock-screen metadata. Call from the same
   * user gesture that starts playback; a no-op in direct mode and on repeat.
   */
  activate(): void {
    if (this.activated) return
    this.activated = true
    if (!this.element) return
    // Element mode: the play() rides the same user gesture as start().
    void Promise.resolve(this.element.play()).catch(() => {})
    this.setupMediaSession()
  }

  /**
   * Lock-screen metadata and transport (element mode only, so non-iOS
   * behavior never changes): pause/play MUTE and UNMUTE the element rather
   * than stopping — the session clock, the schedule, and the live inputs all
   * keep running underneath.
   */
  private setupMediaSession(): void {
    const session = this.mediaSession
    if (!session) return
    try {
      this.writeMetadata()
      session.playbackState = 'playing'
      session.setActionHandler('pause', () => {
        if (this.element) this.element.muted = true
        session.playbackState = 'paused'
      })
      session.setActionHandler('play', () => {
        if (this.element) this.element.muted = false
        session.playbackState = 'playing'
      })
    } catch {
      // Media-session quirks must never break the audio itself.
    }
  }

  /** The lock-screen title and artist currently set. */
  get metadata(): { title: string; artist?: string } {
    return {
      title: this.mediaTitle,
      ...(this.mediaArtist !== undefined ? { artist: this.mediaArtist } : {}),
    }
  }

  /**
   * Change the lock-screen title (and optionally artist) — e.g. from a
   * placeholder at intake to the session theme at takeover. Written to the
   * media session immediately in element mode once activated; otherwise kept
   * for activation. A no-op without a media session.
   */
  setMediaTitle(title: string, artist?: string): void {
    this.mediaTitle = title
    if (artist !== undefined) this.mediaArtist = artist
    if (this.mode === 'element' && this.activated) this.writeMetadata()
  }

  private writeMetadata(): void {
    const session = this.mediaSession
    if (!session) return
    try {
      const Metadata = (
        globalThis as {
          MediaMetadata?: new (init: { title?: string; artist?: string }) => MediaMetadata
        }
      ).MediaMetadata
      if (Metadata) session.metadata = new Metadata(this.metadata)
    } catch {
      // Media-session quirks must never break the audio itself.
    }
  }

  dispose(): void {
    if (this.element) {
      try {
        this.element.pause()
        this.element.srcObject = null
      } catch {
        // Element may already be detached; ignore.
      }
    }
    try {
      this.heardNodes?.mix.disconnect()
      this.heardNodes?.reference.disconnect()
      if (this.mode === 'element') this.output.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
  }
}
