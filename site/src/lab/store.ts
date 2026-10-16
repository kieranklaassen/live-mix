// One store per lesson page. Every figure, control and button on the page is its own island and
// reads this, so they hydrate apart and stay in step: the source, the control values, the taps of
// the last render, and what is sounding: a stage, or a card that set the page and plays it.

import { initialValues, type LabDescription } from './describe.ts'
import { messageOf } from './message.ts'
import { START_VOLUME } from './player.ts'
import { CONTROL_PERIOD, SAMPLE_RATE } from './rate.ts'
import type { RenderResult, TapData } from './runner.ts'
import { OWN_FILE } from './sources.ts'

export type Tap = TapData & { spectrum?: Float32Array }
export type Result = Omit<RenderResult, 'taps'> & { taps: Record<string, Tap> }

export interface LabConfig {
  /** The lab's name: public/labs/<lab>.wasm. */
  lab: string
  /** The sources the reader may pick, by id; the first is the one a page opens on. */
  sources: string[]
  /** The loop's length. */
  seconds: number
  /** The audio taps a figure on the page draws the spectrum of, by id; none when left out. */
  spectra?: string[]
}

/** What does the rendering: the worker in the page, a stand-in in tests. */
export interface Renderer {
  load(config: LabConfig): Promise<LabDescription>
  render(source: string, values: Record<string, number>): Promise<Result>
  setFile(left: Float32Array, right: Float32Array): void
}

/** What makes the sound: the player in the page, a stand-in in tests. */
export interface Sounder {
  /** Start or carry on the loop with this tap's sound. */
  play(tap: Tap): void
  /** New sound for what is already playing, from the same place in the loop. */
  update(tap: Tap): void
  /** Hand the sound over to the real device on the bench, or take it back (null). */
  bench(source: Tap | null): void
  stop(): void
  setVolume(volume: number): void
  /** Make or resume what the sound comes out of, inside a press, without starting a sound. */
  wake(): void
}

/** The id the bench has as "the stage that is sounding". */
export const BENCH = '@bench'

/** The control that holds the step of the build part. No named set moves it, and "back" leaves it. */
export const BUILD = 'build'
/** A tap the build path writes: the sound so far, and the lanes its steps draw. */
export const isBuilt = (tap: string) => tap.startsWith('built')

/** A card that sets the page and plays it: its id, and what the play bar calls it while it sounds. */
export interface Audition {
  id: string
  label: string
}

/**
 * A named set, as a lesson's settings file writes it (site/src/lib/settings.ts). It is complete:
 * a control it does not name goes to the lab's starting value. It may name one of the lesson's
 * sources and the tap to play.
 */
export interface NamedSet {
  values?: Readonly<Record<string, number>>
  source?: string
  tap?: string
}

/** A named set with every control filled in but the build step. */
export interface ResolvedSet {
  values: Record<string, number>
  source?: string
  tap?: string
}

/**
 * Fill a named set in from the lab's starting values. The page, a home tile and a lab's test all
 * resolve a set here, so they render the same thing. `build` is never given a value: the page
 * keeps the step it is on, and a render without one runs the lab's own start.
 */
export function resolveSet(description: LabDescription, set: NamedSet): ResolvedSet {
  const values: Record<string, number> = {}
  for (const control of description.controls) {
    if (control.id !== BUILD) values[control.id] = set.values?.[control.id] ?? control.initial
  }
  const resolved: ResolvedSet = { values }
  if (set.source !== undefined) resolved.source = set.source
  if (set.tap !== undefined) resolved.tap = set.tap
  return resolved
}

/** What "back" puts back: every control but the build step, the source and the stage. */
export interface Memory {
  values: Record<string, number>
  source: string
  sounding: string
}

export interface LabState {
  status: 'idle' | 'loading' | 'ready' | 'failed'
  /** Why the lab could not load, in words for the page. */
  error?: string
  description?: LabDescription
  sources: string[]
  source: string
  /** The reader's own file: its name, and how much of it was kept. */
  file?: { name: string; note: string }
  /** Said beside the picker when a file could not be read. */
  sourceMessage?: string
  values: Record<string, number>
  result?: Result
  /** What `result` was rendered from: the tag that says which values a render carries. */
  rendered?: { source: string; values: Record<string, number> }
  /** How many renders have landed: a page's tests wait on it. */
  renders: number
  rendering: boolean
  playing: boolean
  /** The tap that is sounding or will sound on play; BENCH for the real device. */
  sounding: string
  /** The card that is sounding, lit while `playing`. Null when a stage sounds by its own button. */
  audition: Audition | null
  /**
   * A press from silence whose sound starts when the render that carries the page's values lands:
   * the tap, and the card when a card was pressed. Its button is busy meanwhile.
   */
  waiting: { tap: string; card?: Audition } | null
  /** Held from the first card, or the first set to the device's defaults, until "back". */
  memory: Memory | null
  benchOpen: boolean
  volume: number
}

export const MAX_FILE_SECONDS = 8

/** The state before anything has loaded: what a page is built with, and what it wakes up as. */
export const INITIAL_STATE: LabState = {
  status: 'idle',
  sources: [],
  source: '',
  values: {},
  renders: 0,
  rendering: false,
  playing: false,
  sounding: '',
  audition: null,
  waiting: null,
  memory: null,
  benchOpen: false,
  volume: START_VOLUME,
}

export interface LabStore {
  getState(): LabState
  subscribe(listener: () => void): () => void
  init(config: LabConfig): Promise<void>
  setValue(id: string, value: number): void
  /** Move many controls at once, as by hand, with one render. */
  setValues(values: Readonly<Record<string, number>>): void
  setSource(id: string): void
  /** A decoded file of the reader's own, already at 48 kHz. */
  setFile(name: string, left: Float32Array, right: Float32Array): void
  fileFailed(): void
  play(): void
  stop(): void
  /**
   * Make a stage the one that sounds, and start if nothing is playing. With `fresh`, a start from
   * silence waits for the render that carries the page's values, as a card's does.
   */
  listen(tap: string, fresh?: boolean): void
  /**
   * A card's press: set the page to the card's set and play it. From silence the sound starts
   * when the render with the set's values lands; over a sound, it crosses to that render. The
   * card that is sounding, pressed again, stops; the card that is waiting, pressed again, does
   * not start.
   */
  audition(card: Audition, set: NamedSet): void
  /** Set the page to a named set and start no sound: the device's defaults. Its tap is not used. */
  applySet(set: NamedSet): void
  /** Put back the controls, the source and the stage from before the first card. */
  back(): void
  openBench(): void
  setVolume(volume: number): void
}

export function createLabStore(renderer: Renderer, sounder: Sounder): LabStore {
  let state = INITIAL_STATE
  const listeners = new Set<() => void>()
  let inFlight = false
  /** Counts every change to what a render is made from. A render carries the count it was asked at. */
  let asked = 0
  let landed = -1
  /** What the sounder was last given: a tap of the lab, the real device, or nothing. */
  let voice: 'tap' | 'bench' | undefined
  /** While something plays: its next sound is held for the render that carries the page's values. */
  let held = false

  const set = (patch: Partial<LabState>) => {
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  }

  const audioTaps = () =>
    Object.values(state.result?.taps ?? {}).filter((tap) => tap.kind === 'audio' && tap.length > 0)

  /**
   * The lab's last sound on its main path: what a page opens on, and what a set that names no
   * tap plays. A tap of the build path is heard only when asked for.
   */
  const lastSound = (): Tap | undefined => audioTaps().findLast((tap) => !isBuilt(tap.id))
  const soundingTap = (): Tap | undefined =>
    audioTaps().find((tap) => tap.id === state.sounding) ?? lastSound()
  const sourceTap = (): Tap | undefined =>
    audioTaps().find((tap) => tap.origin === 'source') ?? audioTaps()[0]

  /** True when the last render carries the page's present values and source. */
  const current = () => state.result !== undefined && landed === asked

  /** Give the sounder what `sounding` names, from the last render. */
  const hand = () => {
    if (state.sounding === BENCH) {
      sounder.bench(sourceTap() ?? null)
      voice = 'bench'
      return
    }
    const tap = soundingTap()
    if (!tap) return
    // Over a tap of the lab the new sound carries on in place; playing takes it back from the bench.
    if (voice === 'tap') sounder.update(tap)
    else sounder.play(tap)
    voice = 'tap'
  }

  /** The render that carries the page's values is here: start what waits, or cross what plays to it. */
  const arrive = () => {
    const waiting = state.waiting
    if (waiting) {
      const tap = audioTaps().find((one) => one.id === waiting.tap)
      if (!tap) {
        set({ waiting: null })
        return
      }
      set({ waiting: null, sounding: tap.id, audition: waiting.card ?? null, playing: true })
      sounder.play(tap)
      voice = 'tap'
    } else if (state.playing) {
      held = false
      hand()
    }
  }

  // One render in flight. Whatever changes meanwhile is rendered once more, with the latest
  // values, when it lands: dragging a control never queues a render per movement.
  const render = () => {
    if (state.status !== 'ready' || inFlight) return
    inFlight = true
    const tag = asked
    const made = { source: state.source, values: state.values }
    set({ rendering: true })
    renderer.render(state.source, state.values).then(
      (result) => {
        inFlight = false
        landed = tag
        const fresh = tag === asked
        const first = !state.result
        set({ result, rendered: made, rendering: !fresh, renders: state.renders + 1 })
        if (first && !state.sounding) set({ sounding: soundingTap()?.id ?? '' })
        if (fresh) arrive()
        else if (state.playing && !held) hand()
        if (!fresh) render()
      },
      (error: unknown) => {
        inFlight = false
        set({ rendering: false, status: 'failed', error: messageOf(error) })
      },
    )
  }

  /** What a render is made from has changed. */
  const change = () => {
    asked += 1
    render()
  }

  /** The page's values with these put in, each inside its control's range; undefined when none moves. */
  const within = (values: Readonly<Record<string, number>>) => {
    const next = { ...state.values }
    let moved = false
    for (const control of state.description?.controls ?? []) {
      const value = values[control.id]
      if (value === undefined) continue
      const clamped = Math.min(control.max, Math.max(control.min, value))
      if (next[control.id] === clamped) continue
      next[control.id] = clamped
      moved = true
    }
    return moved ? next : undefined
  }

  /** A move by hand takes the card's name away: the sound stays, and a start that waits is the stage's. */
  const byHand = (): Partial<LabState> => ({
    audition: null,
    waiting: state.waiting && { tap: state.waiting.tap },
  })

  const setValues = (values: Readonly<Record<string, number>>) => {
    const next = within(values)
    if (!next) return
    set({ values: next, ...byHand() })
    change()
  }

  /** Set the page to a named set, with `patch`, taking the memory first when none is held. */
  const take = (description: LabDescription, named: NamedSet, patch: Partial<LabState>) => {
    const resolved = resolveSet(description, named)
    const values = within(resolved.values)
    const source =
      resolved.source !== undefined &&
      resolved.source !== state.source &&
      state.sources.includes(resolved.source)
        ? resolved.source
        : undefined
    const { [BUILD]: _step, ...kept } = state.values
    const memory = state.memory ?? { values: kept, source: state.source, sounding: state.sounding }
    set({
      memory,
      ...(values && { values }),
      ...(source !== undefined && { source, sourceMessage: undefined }),
      ...patch,
    })
    if (values || source !== undefined) change()
  }

  const stop = () => {
    if (!state.playing && !state.waiting) return
    if (state.playing) sounder.stop()
    voice = undefined
    held = false
    set({ playing: false, audition: null, waiting: null })
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async init(config) {
      if (state.status !== 'idle') return
      set({ status: 'loading', sources: config.sources, source: config.sources[0] ?? '' })
      try {
        const description = await renderer.load(config)
        set({ status: 'ready', description, values: initialValues(description) })
        change()
      } catch (error) {
        set({ status: 'failed', error: messageOf(error) })
      }
    },
    setValue(id, value) {
      setValues({ [id]: value })
    },
    setValues,
    setSource(id) {
      if (id === state.source || (id !== OWN_FILE && !state.sources.includes(id))) return
      if (id === OWN_FILE && !state.file) return
      set({ source: id, sourceMessage: undefined, ...byHand() })
      change()
    },
    setFile(name, left, right) {
      const most = MAX_FILE_SECONDS * SAMPLE_RATE
      const frames = Math.min(left.length, most) - (Math.min(left.length, most) % CONTROL_PERIOD)
      const keptLeft = left.slice(0, frames)
      const keptRight = right.slice(0, frames)
      // A short fade at each end, so a file cut anywhere loops without a click.
      const edge = Math.min(480, frames >> 1)
      for (let i = 0; i < edge; i += 1) {
        const gain = i / edge
        for (const channel of [keptLeft, keptRight]) {
          channel[i]! *= gain
          channel[frames - 1 - i]! *= gain
        }
      }
      const kept = (frames / SAMPLE_RATE).toFixed(1)
      const whole = (left.length / SAMPLE_RATE).toFixed(1)
      const note = left.length > frames ? `the first ${kept} s of ${whole} s` : `${kept} s`
      renderer.setFile(keptLeft, keptRight)
      set({ file: { name, note }, source: OWN_FILE, sourceMessage: undefined, ...byHand() })
      change()
    },
    fileFailed() {
      set({ sourceMessage: 'This file could not be read.' })
    },
    play() {
      // A press that waits for its render starts by itself: play has nothing to add to it.
      if (state.playing || state.waiting) return
      if (state.sounding === BENCH && state.benchOpen) {
        sounder.bench(sourceTap() ?? null)
        voice = 'bench'
      } else {
        const tap = soundingTap()
        if (!tap) return
        if (state.sounding !== tap.id) set({ sounding: tap.id })
        sounder.play(tap)
        voice = 'tap'
      }
      set({ playing: true })
    },
    stop,
    listen(tap, fresh = false) {
      if (tap === BENCH) {
        if (!state.benchOpen) return
        held = false
        set({ sounding: BENCH, playing: true, audition: null, waiting: null })
        sounder.bench(sourceTap() ?? null)
        voice = 'bench'
        return
      }
      const found = audioTaps().find((t) => t.id === tap)
      if (!found) return
      if (fresh && !state.playing && !current()) {
        sounder.wake()
        set({ waiting: { tap } })
        return
      }
      held = false
      set({ sounding: tap, audition: null, waiting: null })
      if (voice === 'tap') sounder.update(found)
      else sounder.play(found)
      voice = 'tap'
      set({ playing: true })
    },
    audition(card, named) {
      const { description } = state
      if (!description || !state.result) return
      if (state.playing && state.audition?.id === card.id) {
        stop()
        return
      }
      if (state.waiting?.card?.id === card.id) {
        set({ waiting: null })
        return
      }
      const tap = named.tap ?? lastSound()?.id
      if (tap === undefined) return
      if (!description.taps.some((one) => one.id === tap && one.kind === 'audio')) return
      // The press is where a browser lets sound begin; the sound itself may begin after it.
      sounder.wake()
      if (state.playing) {
        take(description, named, { audition: card, sounding: tap, waiting: null })
        held = true
      } else {
        take(description, named, { waiting: { tap, card } })
      }
      if (current()) arrive()
    },
    applySet(named) {
      if (!state.description || !state.result) return
      take(state.description, named, byHand())
    },
    back() {
      const memory = state.memory
      if (!memory) return
      const values = within(memory.values)
      const moved = values !== undefined || memory.source !== state.source
      // The real device takes the sound back only while its plate is open.
      const sounding =
        memory.sounding === BENCH && !state.benchOpen ? state.sounding : memory.sounding
      set({
        ...(values && { values }),
        source: memory.source,
        sounding,
        memory: null,
        audition: null,
        waiting: null,
      })
      if (moved) change()
      if (state.playing) {
        held = true
        if (current()) arrive()
      }
    },
    openBench() {
      set({ benchOpen: true })
    },
    setVolume(volume) {
      const clamped = Math.min(1, Math.max(0, volume))
      sounder.setVolume(clamped)
      set({ volume: clamped })
    },
  }
}

/** What a figure says in place of a picture while there is none; undefined when there is one. */
export function waitingText(state: LabState): string | undefined {
  if (state.status === 'failed') return `The lab did not load: ${state.error ?? 'no reason given'}`
  if (state.status !== 'ready') return 'Loading the lab…'
  if (!state.result) return 'Rendering…'
  return undefined
}
