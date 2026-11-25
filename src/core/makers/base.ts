// What every maker shares: the clock and the list of things still to do, the
// notes held, and the bookkeeping of what sounds. A maker says what it does
// when a note comes and when one goes, and hands anything later to `at`.
//
// Everything happens inside a thing to do, at that thing's time, in the order
// of time and then of asking. So what comes out does not depend on how the
// clock was cut up, which is what makes a render and a performance the same.

import { clampParam } from '../params'
import { cleanKey } from './key'
import {
  type EmitMade,
  type MadeEvent,
  type MakerKey,
  type MakerOptions,
  type NoteMaker,
  type NoteMakerDescriptor,
  WHITE_KEYS,
} from './types'

/** A note that is being played into the maker. */
export interface HeldNote {
  readonly id: number
  readonly note: number
  readonly gain: number
  readonly atSec: number
}

/** A note the maker wrote that still sounds, or has been joined by another of its pitch. */
export interface MadeNote {
  readonly note: number
  readonly part: string | undefined
  /** The part, where it has an instrument of its own: voices on one instrument meet at one pitch. */
  readonly on: string | undefined
}

interface Sounding {
  id: number
  note: number
  gain: number
  part: string | undefined
  atSec: number
  /** Who holds it: every `MadeNote` at this pitch on this part. */
  holders: Set<MadeNote>
}

interface Task {
  atSec: number
  order: number
  run: (atSec: number) => void
  dropped: boolean
}

export type TaskHandle = { cancel(): void }

/** Two starts of one pitch nearer than this are one attack: the voices meet, they do not strike twice. */
const ONE_ATTACK_SEC = 0.02
/** Unless the second is this much harder than the first: what is played hard is not lost under what is soft. */
const HARDER = 1.5

/** More done at one moment than this is a rule that never moves on. */
const MOST_AT_ONCE = 4096

/** The keys an instrument is asked for; a note past them is moved by octaves until it is inside. */
export const LOWEST_NOTE = 12
export const HIGHEST_NOTE = 119

/** `note` moved by whole octaves until an instrument can be asked for it. */
export function foldNote(note: number): number {
  let folded = note
  while (folded > HIGHEST_NOTE) folded -= 12
  while (folded < LOWEST_NOTE) folded += 12
  return folded
}

/** A loudness a note can have: nothing a maker reckons with is past 0 to 1, or no number. */
function level(gain: number): number {
  return Number.isFinite(gain) ? Math.min(1, Math.max(0, gain)) : 0
}

export abstract class MakerBase implements NoteMaker {
  protected key: MakerKey
  protected readonly params: Record<string, number>
  /** The notes held, in the order they were played. */
  protected readonly held = new Map<number, HeldNote>()
  private readonly ownParts: ReadonlySet<string>
  private readonly tasks: Task[] = []
  private readonly sounding = new Map<string, Sounding>()
  private out: MadeEvent[] = []
  private order = 0
  private nextId = 1
  private clock = -Infinity
  private nowSec = 0

  constructor(
    readonly descriptor: NoteMakerDescriptor,
    options: MakerOptions = {},
  ) {
    this.key = cleanKey(options.key, WHITE_KEYS)
    this.ownParts = new Set(options.parts)
    this.params = {}
    for (const [name, spec] of Object.entries(descriptor.params)) {
      const given =
        options.params && Object.hasOwn(options.params, name) ? options.params[name] : spec.default
      this.params[name] = this.settle(name, given)
    }
  }

  // --- What a maker writes ------------------------------------------------

  /** A note began. `this.held` has it already. */
  protected abstract onNote(atSec: number, held: HeldNote): void
  /** A held note ended. `this.held` no longer has it. */
  protected abstract onRelease(atSec: number, held: HeldNote): void
  /** A control moved; `this.params` has the new value already. */
  protected onParam(_atSec: number, _name: string): void {}
  /** The key changed; `this.key` is the new one already. */
  protected onKey(_atSec: number): void {}
  /** Everything was silenced: forget what is kept between notes. */
  protected onSilence(): void {}

  /** Do this at a time to come (now, for one gone by). */
  protected at(atSec: number, run: (atSec: number) => void): TaskHandle {
    const task: Task = {
      atSec: Number.isFinite(atSec) ? Math.max(atSec, this.nowSec) : this.nowSec,
      order: (this.order += 1),
      run,
      dropped: false,
    }
    this.push(task)
    return {
      cancel: () => {
        task.dropped = true
      },
    }
  }

  /**
   * Start a note now. Held until `end` is called with what this returns. A
   * pitch that already sounds on the same instrument is one voice with it: struck again
   * when it began a while ago, joined when both begin at once (unless the second
   * is much the harder, and not at the same instant). It ends when
   * the last who holds it lets go.
   */
  protected start(note: number, gain: number, part?: string): MadeNote {
    const pitch = foldNote(note)
    const on = part !== undefined && this.ownParts.has(part) ? part : undefined
    const made: MadeNote = { note: pitch, part, on }
    const key = this.soundKey(made)
    const loud = level(gain)
    const there = this.sounding.get(key)
    if (!there) {
      const id = (this.nextId += 1)
      this.sounding.set(key, {
        id,
        note: pitch,
        gain: loud,
        part: on,
        atSec: this.nowSec,
        holders: new Set([made]),
      })
      this.emitOn(id, pitch, loud, on)
      return made
    }
    there.holders.add(made)
    const after = this.nowSec - there.atSec
    if (after >= ONE_ATTACK_SEC || (after > 0 && loud > there.gain * HARDER)) {
      this.emitOff(there)
      there.id = this.nextId += 1
      there.atSec = this.nowSec
      there.gain = loud
      this.emitOn(there.id, pitch, loud, on)
    }
    return made
  }

  /** Let go of a note `start` gave. Once; a second time is nothing. */
  protected end(made: MadeNote | null | undefined): void {
    if (!made) return
    const key = this.soundKey(made)
    const there = this.sounding.get(key)
    if (!there?.holders.delete(made)) return
    if (there.holders.size > 0) return
    this.sounding.delete(key)
    this.emitOff(there)
  }

  /** Start a note now and let go of it `durSec` later. */
  protected play(note: number, gain: number, durSec: number, part?: string): MadeNote {
    const made = this.start(note, gain, part)
    this.at(this.nowSec + Math.max(0.01, durSec), () => this.end(made))
    return made
  }

  // --- The clock ------------------------------------------------------------

  /** The time of the thing being done. */
  protected get now(): number {
    return this.nowSec
  }

  noteOn(atSec: number, id: number, note: number, gain: number): void {
    if (!Number.isFinite(note)) return
    this.input(atSec, (at) => {
      const before = this.held.get(id)
      if (before) {
        this.held.delete(id)
        this.onRelease(at, before)
      }
      const held: HeldNote = { id, note, gain: level(gain), atSec: at }
      this.held.set(id, held)
      this.onNote(at, held)
    })
  }

  noteOff(atSec: number, id: number): void {
    this.input(atSec, (at) => {
      const held = this.held.get(id)
      if (!held) return
      this.held.delete(id)
      this.onRelease(at, held)
    })
  }

  setParam(atSec: number, name: string, value: number): void {
    if (!Object.hasOwn(this.params, name)) return
    this.input(atSec, (at) => {
      const next = this.settle(name, value)
      if (next === this.params[name]) return
      this.params[name] = next
      this.onParam(at, name)
    })
  }

  setKey(atSec: number, key: MakerKey): void {
    this.input(atSec, (at) => {
      const next = cleanKey(key, this.key)
      if (next.root === this.key.root && String(next.steps) === String(this.key.steps)) return
      this.key = next
      this.onKey(at)
    })
  }

  advance(toSec: number, emit: EmitMade): void {
    this.runTo(toSec)
    this.hand(emit)
  }

  next(): number {
    if (this.out.length > 0) return this.out[0].atSec
    for (const task of this.tasks) if (!task.dropped) return task.atSec
    return Infinity
  }

  silence(atSec: number, emit: EmitMade): void {
    this.runTo(atSec)
    this.held.clear()
    this.tasks.length = 0
    for (const there of this.sounding.values()) this.emitOff(there)
    this.sounding.clear()
    this.onSilence()
    this.hand(emit)
  }

  // --- Inside -----------------------------------------------------------------

  private hand(emit: EmitMade): void {
    const events = this.out
    this.out = []
    for (const event of events) emit(event)
  }

  private input(atSec: number, run: (atSec: number) => void): void {
    const at = Math.max(
      Number.isFinite(atSec) ? atSec : 0,
      this.clock === -Infinity ? 0 : this.clock,
    )
    // What was due before it, and what was due at that moment and asked for earlier.
    this.runTo(at)
    this.nowSec = at
    run(at)
    this.runTo(at)
  }

  private runTo(toSec: number): void {
    if (Number.isNaN(toSec)) return
    let atOnce = 0
    let last = -Infinity
    for (;;) {
      const [task] = this.tasks
      if (task === undefined || task.atSec > toSec) break
      this.tasks.shift()
      if (task.dropped) continue
      atOnce = task.atSec === last ? atOnce + 1 : 0
      last = task.atSec
      if (atOnce > MOST_AT_ONCE)
        throw new Error(`live-mix: ${this.descriptor.id} never moves on from ${task.atSec} s`)
      this.nowSec = task.atSec
      task.run(task.atSec)
    }
    if (toSec > this.clock && Number.isFinite(toSec)) this.clock = toSec
    this.nowSec = Math.max(this.nowSec, Number.isFinite(toSec) ? toSec : this.nowSec)
  }

  /** Kept in order of time, then of asking. */
  private push(task: Task): void {
    let low = 0
    let high = this.tasks.length
    while (low < high) {
      const middle = (low + high) >> 1
      if (this.tasks[middle].atSec <= task.atSec) low = middle + 1
      else high = middle
    }
    this.tasks.splice(low, 0, task)
  }

  private settle(name: string, value: number): number {
    const spec = this.descriptor.params[name]
    const clamped = clampParam(spec, value)
    if (!spec.choices && spec.step === undefined) return clamped
    const step = spec.step ?? 1
    return clampParam(spec, spec.min + Math.round((clamped - spec.min) / step) * step)
  }

  private soundKey(made: MadeNote): string {
    return `${made.on ?? ''}:${made.note}`
  }

  private emitOn(id: number, note: number, gain: number, part: string | undefined): void {
    const event: MadeEvent = { atSec: this.nowSec, on: true, id, note, gain }
    if (part !== undefined) event.part = part
    this.out.push(event)
  }

  private emitOff(there: Sounding): void {
    const event: MadeEvent = {
      atSec: this.nowSec,
      on: false,
      id: there.id,
      note: there.note,
      gain: there.gain,
    }
    if (there.part !== undefined) event.part = there.part
    this.out.push(event)
  }
}
