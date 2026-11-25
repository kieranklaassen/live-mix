// A maker under a person's hands: the keys go in as they are pressed, and
// what the maker writes goes out when it falls due. Instruments take notes
// with no timestamp, so this is a short timer on the audio clock that hands
// over what is due: a written note can be a few milliseconds late and is
// never early. With nothing to wait for, no timer runs. Pure but for the
// timer, which a test replaces.

import { type MadeEvent, type MakerKey, type NoteMaker } from './types'

export interface MakerTimer {
  set(callback: () => void, ms: number): unknown
  clear(handle: unknown): void
}

export interface MakerPlayerOptions {
  /** The audio clock, in seconds. */
  now: () => number
  /** Where a note the maker wrote goes. */
  note: (event: MadeEvent) => void
  tickMs?: number
  timer?: MakerTimer
}

/** Short enough that two voices a few hundredths apart keep their order and their gap. */
const TICK_MS = 5

/** A wait this long means the page was asleep: what began and ended in it is not played. */
const ASLEEP_SEC = 1

const PAGE_TIMER: MakerTimer = {
  set: (callback, ms) => setInterval(callback, ms),
  clear: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
}

export class MakerPlayer {
  private readonly timer: MakerTimer
  private handle: unknown = null
  private last: number | null = null

  constructor(
    readonly maker: NoteMaker,
    private readonly options: MakerPlayerOptions,
  ) {
    this.timer = options.timer ?? PAGE_TIMER
  }

  noteOn(id: number, note: number, gain: number): void {
    this.act((now) => this.maker.noteOn(now, id, note, gain))
  }

  noteOff(id: number): void {
    this.act((now) => this.maker.noteOff(now, id))
  }

  setParam(name: string, value: number): void {
    this.act((now) => this.maker.setParam(now, name, value))
  }

  setKey(key: MakerKey): void {
    this.act((now) => this.maker.setKey(now, key))
  }

  /** Every held note forgotten and every written one ended, now. */
  silence(): void {
    this.maker.silence(this.options.now(), this.options.note)
    this.settle()
  }

  /** Silence, and no timer left. */
  dispose(): void {
    this.silence()
    if (this.handle !== null) this.timer.clear(this.handle)
    this.handle = null
  }

  private act(run: (now: number) => void): void {
    const now = this.options.now()
    this.due(now)
    run(now)
    this.due(now)
    this.settle()
  }

  private due(now: number): void {
    const slept = this.last !== null && now - this.last > ASLEEP_SEC && this.handle !== null
    this.last = now
    if (!slept) {
      this.maker.advance(now, this.options.note)
      return
    }
    // What is left standing after the sleep, and the ends of what stood before it.
    const begun = new Map<number, MadeEvent>()
    const ended: MadeEvent[] = []
    this.maker.advance(now, (event) => {
      if (event.on) begun.set(event.id, event)
      else if (!begun.delete(event.id)) ended.push(event)
    })
    for (const event of ended) this.options.note(event)
    for (const event of begun.values()) this.options.note(event)
  }

  /** The timer runs exactly while there is something to wait for. */
  private settle(): void {
    const waiting = this.maker.next() < Infinity
    if (waiting && this.handle === null) {
      this.last = this.options.now()
      this.handle = this.timer.set(() => {
        this.due(this.options.now())
        this.settle()
      }, this.options.tickMs ?? TICK_MS)
    } else if (!waiting && this.handle !== null) {
      this.timer.clear(this.handle)
      this.handle = null
    }
  }
}
