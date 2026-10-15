// One store per lesson page. Every figure, control and button on the page is its own island and
// reads this, so they hydrate apart and stay in step: the source, the control values, the taps of
// the last render, and what is sounding.

import type { LabDescription } from './describe.ts'
import type { RenderResult, TapData } from './runner.ts'
import { OWN_FILE } from './sources.ts'

export type Tap = TapData & { spectrum?: Float32Array }
export type Result = Omit<RenderResult, 'taps'> & { taps: Record<string, Tap> }

/** What does the rendering: the worker in the page, a stand-in in tests. */
export interface LabConfig {
  /** The lab's name: public/labs/<lab>.wasm. */
  lab: string
  /** The sources the reader may pick, by id; the first is the one a page opens on. */
  sources: string[]
  /** The loop's length. */
  seconds: number
}

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
}

/** The id the bench has as "the stage that is sounding". */
export const BENCH = '@bench'

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
  /** How many renders have landed: a page's tests wait on it. */
  renders: number
  rendering: boolean
  playing: boolean
  /** The tap that is sounding or will sound on play; BENCH for the real device. */
  sounding: string
  benchOpen: boolean
  volume: number
}

export const MAX_FILE_SECONDS = 8
const SAMPLE_RATE = 48_000

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
  benchOpen: false,
  volume: 0.7,
}

export interface LabStore {
  getState(): LabState
  subscribe(listener: () => void): () => void
  init(config: LabConfig): Promise<void>
  setValue(id: string, value: number): void
  resetValues(): void
  setSource(id: string): void
  /** A decoded file of the reader's own, already at 48 kHz. */
  setFile(name: string, left: Float32Array, right: Float32Array): void
  fileFailed(): void
  play(): void
  stop(): void
  /** Make a stage the one that sounds, and start if nothing is playing. */
  listen(tap: string): void
  openBench(): void
  setVolume(volume: number): void
}

export function createLabStore(renderer: Renderer, sounder: Sounder): LabStore {
  let state = INITIAL_STATE
  const listeners = new Set<() => void>()
  let inFlight = false
  let dirty = false

  const set = (patch: Partial<LabState>) => {
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  }

  const audioTaps = () =>
    Object.values(state.result?.taps ?? {}).filter((tap) => tap.kind === 'audio' && tap.length > 0)

  /** The tap to sound: the chosen one if the render has it, else the last audio tap (the output). */
  const soundingTap = (): Tap | undefined => {
    const taps = audioTaps()
    return taps.find((tap) => tap.id === state.sounding) ?? taps[taps.length - 1]
  }
  const sourceTap = (): Tap | undefined =>
    audioTaps().find((tap) => tap.origin === 'source') ?? audioTaps()[0]

  // One render in flight. Whatever changes meanwhile is rendered once more, with the latest
  // values, when it lands: dragging a control never queues a render per movement.
  const render = () => {
    if (state.status !== 'ready') return
    if (inFlight) {
      dirty = true
      return
    }
    inFlight = true
    dirty = false
    set({ rendering: true })
    renderer.render(state.source, state.values).then(
      (result) => {
        inFlight = false
        const first = !state.result
        set({ result, rendering: dirty, renders: state.renders + 1 })
        if (first && !state.sounding) set({ sounding: soundingTap()?.id ?? '' })
        if (state.playing) {
          if (state.sounding === BENCH) sounder.bench(sourceTap() ?? null)
          else if (soundingTap()) sounder.update(soundingTap()!)
        }
        if (dirty) render()
      },
      (error: unknown) => {
        inFlight = false
        set({
          rendering: false,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        })
      },
    )
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
        const values: Record<string, number> = {}
        for (const control of description.controls) values[control.id] = control.initial
        set({ status: 'ready', description, values })
        render()
      } catch (error) {
        set({ status: 'failed', error: error instanceof Error ? error.message : String(error) })
      }
    },
    setValue(id, value) {
      const control = state.description?.controls.find((c) => c.id === id)
      if (!control) return
      const clamped = Math.min(control.max, Math.max(control.min, value))
      if (state.values[id] === clamped) return
      set({ values: { ...state.values, [id]: clamped } })
      render()
    },
    resetValues() {
      const values: Record<string, number> = {}
      for (const control of state.description?.controls ?? []) values[control.id] = control.initial
      set({ values })
      render()
    },
    setSource(id) {
      if (id === state.source || (id !== OWN_FILE && !state.sources.includes(id))) return
      if (id === OWN_FILE && !state.file) return
      set({ source: id, sourceMessage: undefined })
      render()
    },
    setFile(name, left, right) {
      const most = MAX_FILE_SECONDS * SAMPLE_RATE
      const frames = Math.min(left.length, most) - (Math.min(left.length, most) % 16)
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
      set({ file: { name, note }, source: OWN_FILE, sourceMessage: undefined })
      render()
    },
    fileFailed() {
      set({ sourceMessage: 'This file could not be read.' })
    },
    play() {
      if (state.playing) return
      if (state.sounding === BENCH && state.benchOpen) {
        sounder.bench(sourceTap() ?? null)
      } else {
        const tap = soundingTap()
        if (!tap) return
        if (state.sounding !== tap.id) set({ sounding: tap.id })
        sounder.play(tap)
      }
      set({ playing: true })
    },
    stop() {
      if (!state.playing) return
      sounder.stop()
      set({ playing: false })
    },
    listen(tap) {
      if (tap === BENCH) {
        if (!state.benchOpen) return
        set({ sounding: BENCH, playing: true })
        sounder.bench(sourceTap() ?? null)
        return
      }
      const found = audioTaps().find((t) => t.id === tap)
      if (!found) return
      const fromBench = state.sounding === BENCH
      set({ sounding: tap })
      if (fromBench && state.playing) sounder.bench(null)
      if (state.playing && !fromBench) sounder.update(found)
      else sounder.play(found)
      set({ playing: true })
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
