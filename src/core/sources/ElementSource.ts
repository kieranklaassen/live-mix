// A streaming clip source: an HTMLMediaElement feeding the graph through a
// MediaElementAudioSourceNode (U18, R34). Where a `SampleStore` sample holds
// a whole track as decoded PCM (~23 MB per minute at 48 kHz), an element
// streams it — the browser keeps a few seconds buffered — so a 45-minute
// ambience bed costs almost nothing in memory. The price is timing: an
// element cannot be started sample-accurately, only from a timer, so this is
// for long beds, not for anything that has to land on a beat. `ElementTrack`
// plays these through the same envelope math and Schedulable contract as
// `AudioTrack`; the differences are listed there.
//
// The element is attached to the graph as soon as the source is constructed:
// per the Web Audio spec its output then stops going to the speakers and goes
// only where the node is connected, so nothing is heard until a voice wires
// the node to a gain.

import { type StretchSource } from './StretchSource'
import { type LoadedSample } from '../tracks/SampleStore'

export interface ElementSourceOptions {
  /** Key clips refer to (`clip.sourceId`). */
  id: string
  /** Media URL; same-origin or CORS-cleared, or the graph receives silence. */
  url: string
  /** Injectable for tests and non-DOM hosts; defaults to `document.createElement('audio')`. */
  createAudioElement?: () => HTMLMediaElement
  /** Element CORS mode. Default 'anonymous'; `null` leaves the attribute unset. */
  crossOrigin?: 'anonymous' | 'use-credentials' | null
  /** Element preload hint. Default 'auto'. */
  preload?: 'none' | 'metadata' | 'auto'
}

/** Any kind of thing a clip can play from. */
export type ClipSource = LoadedSample | ElementSource | StretchSource

export class ElementSource {
  /** Discriminant shared with `LoadedSample` (`ClipSource`). */
  readonly kind = 'element' as const
  readonly id: string
  readonly url: string
  readonly element: HTMLMediaElement
  /** The graph end of the element; `ElementTrack` connects it per voice. */
  readonly node: MediaElementAudioSourceNode
  private disposed = false
  /**
   * The unlock under way: how the element was muted before it, whether a
   * `play` has taken the element over since, and the promise it settles.
   */
  private unlocking: { wasMuted: boolean; takenOver: boolean; done: Promise<void> } | null = null

  constructor(ctx: BaseAudioContext, options: ElementSourceOptions) {
    this.id = options.id
    this.url = options.url
    const element = (options.createAudioElement ?? (() => document.createElement('audio')))()
    const crossOrigin = options.crossOrigin === undefined ? 'anonymous' : options.crossOrigin
    if (crossOrigin !== null) element.crossOrigin = crossOrigin
    element.preload = options.preload ?? 'auto'
    element.loop = false
    element.autoplay = false
    element.src = options.url
    this.element = element
    this.node = (ctx as AudioContext).createMediaElementSource(element)
  }

  /** Media length in seconds once metadata has arrived; NaN before that. */
  get durationSec(): number {
    return this.element.duration
  }

  get isPlaying(): boolean {
    return !this.element.paused
  }

  /** Move the playhead without playing; before metadata this sets the start position. */
  seek(offsetSec: number): void {
    if (this.disposed) return
    const target = Math.max(0, offsetSec)
    if (this.element.currentTime !== target) this.element.currentTime = target
  }

  /**
   * Buffer from `offsetSec` ahead of a start (the preload window). Leaves a
   * playing element alone. Safari on iOS ignores preload hints until the
   * element has been unlocked, hence `unlock`.
   */
  prime(offsetSec: number): void {
    if (this.disposed || this.isPlaying) return
    if (this.element.preload !== 'auto') this.element.preload = 'auto'
    this.seek(offsetSec)
    if (this.element.networkState === 0 /* NETWORK_EMPTY */) {
      try {
        this.element.load()
      } catch {
        // A host without media support; the voice's play() reports it.
      }
    }
  }

  /**
   * Call from the user gesture that starts playback: a muted play/pause pair
   * marks the element as user-activated, so the timer-driven `play()` calls a
   * scheduled start needs later are allowed (iOS refuses `play()` outside a
   * gesture until an element has been unlocked this way). Resolves once the
   * element is paused again; never rejects. An element that is playing is
   * left as it is: it was allowed to play, and a voice is sounding on it. A
   * `play` that comes while the pair is under way takes the element over,
   * unmuted, and is not paused.
   */
  unlock(): Promise<void> {
    if (this.disposed) return Promise.resolve()
    // A second one would find the element muted by the first, and leave it so.
    if (this.unlocking) return this.unlocking.done
    if (this.isPlaying) return Promise.resolve()
    const element = this.element
    const unlocking = { wasMuted: element.muted, takenOver: false, done: Promise.resolve() }
    element.muted = true
    unlocking.done = this.startElement()
      .then((started) => {
        if (started && !unlocking.takenOver) element.pause()
      })
      .catch(() => {})
      .then(() => {
        if (!unlocking.takenOver) element.muted = unlocking.wasMuted
        if (this.unlocking === unlocking) this.unlocking = null
      })
    this.unlocking = unlocking
    return unlocking.done
  }

  /**
   * Start the element now (synchronously, so a call from a gesture counts as
   * one). Resolves true when playback began, false when the browser refused
   * (autoplay policy, decode error) — never rejects.
   */
  play(): Promise<boolean> {
    if (this.disposed) return Promise.resolve(false)
    const unlocking = this.unlocking
    if (unlocking && !unlocking.takenOver) {
      // The unlock's muted play is under way. This one is to be heard, and to
      // go on: the unlock no longer pauses the element when its own play lands.
      unlocking.takenOver = true
      this.element.muted = unlocking.wasMuted
    }
    return this.startElement()
  }

  private startElement(): Promise<boolean> {
    try {
      // Older WebKit returns undefined rather than a promise.
      const result = this.element.play() as Promise<void> | undefined
      return Promise.resolve(result).then(
        () => true,
        () => false,
      )
    } catch {
      return Promise.resolve(false)
    }
  }

  pause(): void {
    if (this.disposed) return
    try {
      this.element.pause()
    } catch {
      // Already detached; nothing left to pause.
    }
  }

  /** Detach from the graph and release the media (`removeAttribute('src')` + `load()`). */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    try {
      this.node.disconnect()
    } catch {
      // Context may already be closed; ignore.
    }
    try {
      this.element.pause()
      this.element.removeAttribute('src')
      this.element.load()
    } catch {
      // Element may already be gone; ignore.
    }
  }
}
