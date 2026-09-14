// A recording stand-in for HTMLMediaElement, for `ElementSource` tests: every
// play/pause/load call and every seek (a `currentTime` write) is recorded, and
// media events (`ended`, `error`, `canplay`) can be raised from the test.

import { spyOn } from './configure'
import { CallRecorder } from './mock-nodes'

type MediaListener = (event: { type: string }) => void

export interface MockMediaElementOptions {
  /** Media length reported by `duration`. Default NaN (metadata not loaded). */
  duration?: number
  /** Make `play()` reject with this error (an autoplay refusal, say). */
  rejectPlayWith?: Error
}

export class MockMediaElement {
  src = ''
  crossOrigin: string | null = null
  preload: 'none' | 'metadata' | 'auto' | '' = 'auto'
  autoplay = false
  loop = false
  muted = false
  volume = 1
  paused = true
  ended = false
  duration: number
  /** HAVE_NOTHING … HAVE_ENOUGH_DATA; tests set it. */
  readyState = 0
  /** NETWORK_EMPTY until `load()` or `play()`. */
  networkState = 0
  error: unknown = null
  playbackRate = 1
  rejectPlayWith: Error | null

  readonly playCalls = new CallRecorder()
  readonly pauseCalls = new CallRecorder()
  readonly loadCalls = new CallRecorder()
  /** Every `currentTime` write, in order. */
  readonly seeks = new CallRecorder()
  private position = 0
  private readonly listeners = new Map<string, Set<MediaListener>>()

  constructor(options: MockMediaElementOptions = {}) {
    this.duration = options.duration ?? NaN
    this.rejectPlayWith = options.rejectPlayWith ?? null
    this.play = spyOn(this.play.bind(this))
    this.pause = spyOn(this.pause.bind(this))
    this.load = spyOn(this.load.bind(this))
  }

  get currentTime(): number {
    return this.position
  }

  set currentTime(value: number) {
    this.position = value
    this.seeks.record([value])
  }

  play(): Promise<void> {
    this.playCalls.record([])
    if (this.rejectPlayWith) return Promise.reject(this.rejectPlayWith)
    this.paused = false
    this.ended = false
    if (this.networkState === 0) this.networkState = 2
    return Promise.resolve()
  }

  pause(): void {
    this.pauseCalls.record([])
    this.paused = true
  }

  load(): void {
    this.loadCalls.record([])
    this.networkState = this.src ? 2 : 0
  }

  removeAttribute(name: string): void {
    if (name === 'src') this.src = ''
  }

  setAttribute(name: string, value: string): void {
    if (name === 'src') this.src = value
  }

  addEventListener(type: string, listener: MediaListener): void {
    let set = this.listeners.get(type)
    if (!set) {
      set = new Set()
      this.listeners.set(type, set)
    }
    set.add(listener)
  }

  removeEventListener(type: string, listener: MediaListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  dispatchEvent(event: { type: string }): boolean {
    for (const listener of [...(this.listeners.get(event.type) ?? [])]) listener(event)
    return true
  }

  /** Raise a media event from the test (`ended`, `error`, `canplay`, …). */
  emit(type: string): void {
    this.dispatchEvent({ type })
  }

  /** Listener count for `type`, to assert clean-up. */
  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0
  }

  /** Advance the playhead as if `seconds` of media played. */
  advance(seconds: number): void {
    if (this.paused) return
    this.position += seconds
  }

  /** Simulate the media reaching its end (pauses and fires `ended`). */
  finish(): void {
    this.paused = true
    this.ended = true
    if (Number.isFinite(this.duration)) this.position = this.duration
    this.emit('ended')
  }
}

export function createMockMediaElement(options: MockMediaElementOptions = {}): MockMediaElement {
  return new MockMediaElement(options)
}

/** Cast helper: hand a mock to code that wants a real `HTMLMediaElement`. */
export function asMediaElement(mock: MockMediaElement): HTMLMediaElement {
  return mock as unknown as HTMLMediaElement
}
