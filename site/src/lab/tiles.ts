// The home map's player: one worker for the page, and one tile wanted at a time. A press makes
// its tile the wanted one: its lab is loaded into the worker, in place of the last one, and
// rendered on the loop the row has picked, and when the render lands the tile sounds, crossed
// over from whatever sounded before. A worker cannot be told to stop what it is doing, so a
// press that comes while it is busy ends it and starts another. Nothing here touches the page:
// the worker and what makes the sound are handed in, and a test stands in for both.

import { START_VOLUME } from './player.ts'
import { SAMPLE_RATE } from './rate.ts'
import { NO_SOURCE } from './sources.ts'
import type { Sounder, Tap } from './store.ts'
import type { WorkerReply, WorkerRequest } from './worker.ts'

/** The loops the home page's row offers, by their ids on the bench: the six that are music. */
export const LOOPS = ['drums', 'guitar', 'chords', 'bass', 'pad', 'mix'] as const

/** A lesson's tile, as its button plays it. */
export interface Tile {
  /** The lesson's id. */
  id: string
  title: string
  number: number
  /** The lab's name: public/labs/<lab>.wasm. */
  lab: string
  /** The loop's length. */
  seconds: number
  /** Control values by id; one left out is at the lab's starting value. */
  values: Record<string, number>
  /** The tap that sounds. */
  tap: string
  /** The lab plays its own notes: nothing goes in, and the loop row is not heard through it. */
  own: boolean
}

export interface TilesState {
  /** The loop the row has picked. */
  loop: string
  /** The tile that is loading, by its lesson's id. */
  loading: string | null
  /** The tile that sounds, and the loop it sounds on: null for a tile that plays its own notes. */
  sounding: { id: string; loop: string | null } | null
  /** The tiles whose last load failed. */
  failed: string[]
  /** The last failure in words, for the page's one polite status line. */
  said: string
  volume: number
  /** True from the first press: the small bar is on the page from then on. */
  open: boolean
}

export const INITIAL_TILES: TilesState = {
  loop: LOOPS[0],
  loading: null,
  sounding: null,
  failed: [],
  said: '',
  volume: START_VOLUME,
  open: false,
}

export type TileStatus = 'idle' | 'loading' | 'sounding' | 'failed'

export function statusOf(state: TilesState, id: string): TileStatus {
  if (state.loading === id) return 'loading'
  if (state.sounding?.id === id) return 'sounding'
  return state.failed.includes(id) ? 'failed' : 'idle'
}

/** What a tile's button is called: what a press does, then the lesson's title. */
export function buttonName(state: TilesState, tile: Tile): string {
  const status = statusOf(state, tile.id)
  const does = status === 'loading' ? 'Loading' : status === 'sounding' ? 'Stop' : 'Hear'
  return `${does} ${tile.title}`
}

/** The worker that renders labs, as the tiles lean on it. */
export interface LabWorker {
  send(request: WorkerRequest): void
  /** End it: the only way to cancel what it is doing. */
  end(): void
}

export interface TileIo {
  /** Make a worker. `answer` is handed each of its replies; `died` is called when it stops by itself. */
  worker(answer: (reply: WorkerReply) => void, died: () => void): LabWorker
  /** Where a built lab is served from, by its name. */
  url(lab: string): string
  sounder: Pick<Sounder, 'play' | 'update' | 'stop' | 'setVolume' | 'wake'>
}

export interface TilePlayer {
  getState(): TilesState
  subscribe(listener: () => void): () => void
  /**
   * A tile's button. An idle or a failed tile becomes the wanted one and loads; the tile that
   * sounds or loads, pressed again, stops the sound and drops the load.
   */
  press(id: string): void
  /** Stop the sound and drop any load. */
  stop(): void
  /** The loop row's choice. It starts nothing; a tile that sounds is rendered again on it, in place. */
  setLoop(loop: string): void
  setVolume(volume: number): void
}

export function createTilePlayer(tiles: readonly Tile[], io: TileIo): TilePlayer {
  let state = INITIAL_TILES
  const listeners = new Set<() => void>()
  const set = (patch: Partial<TilesState>) => {
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  }

  let worker: LabWorker | undefined
  /** The lab the worker holds, with its loop's length. */
  let held = ''
  /** What the worker is doing, for which tile: loading its lab, or rendering it on `source`. */
  let job: { tile: Tile; seq: number; source: string } | undefined
  let seq = 0

  const holds = (tile: Tile) => `${tile.lab}@${tile.seconds}`
  const sourceOf = (tile: Tile) => (tile.own ? NO_SOURCE.id : state.loop)

  const end = () => {
    worker?.end()
    worker = undefined
    held = ''
    job = undefined
  }

  const fail = (tile: Tile) => {
    // A worker that could not load may hold no bench: the next press starts a new one.
    end()
    set({
      loading: state.loading === tile.id ? null : state.loading,
      failed: [...state.failed.filter((id) => id !== tile.id), tile.id],
      said: `${tile.title} did not load. Press its button to try again.`,
    })
  }

  const render = (to: LabWorker, tile: Tile) => {
    seq += 1
    job = { tile, seq, source: sourceOf(tile) }
    to.send({ type: 'render', seq, source: job.source, values: tile.values })
  }

  const land = (tile: Tile, tap: Tap | undefined, source: string) => {
    if (!tap) return fail(tile)
    // Over its own sound a tile carries on in place; over another's, or silence, it starts.
    if (state.sounding?.id === tile.id) io.sounder.update(tap)
    else io.sounder.play(tap)
    set({ loading: null, sounding: { id: tile.id, loop: tile.own ? null : source } })
  }

  const answer = (reply: WorkerReply) => {
    if (!job || !worker) return
    const { tile, source } = job
    if (reply.type === 'failed') fail(tile)
    else if (reply.type === 'ready') {
      held = holds(tile)
      render(worker, tile)
    } else if (reply.seq === job.seq) {
      // The loop changed while this rendered: nothing stale sounds, it is rendered on the new one.
      if (source !== sourceOf(tile)) return render(worker, tile)
      job = undefined
      land(tile, reply.result.taps[tile.tap], source)
    }
  }

  /** Have the worker load the tile's lab, when it holds another, and render it. */
  const start = (tile: Tile) => {
    // Ending the worker is the only way to cancel what it is doing.
    if (job) end()
    const frames = Math.round(tile.seconds * SAMPLE_RATE)
    const labUrl = io.url(tile.lab)
    if (!worker) {
      const made: LabWorker = io.worker(
        (reply) => worker === made && answer(reply),
        () => worker === made && (job ? fail(job.tile) : end()),
      )
      worker = made
      job = { tile, seq: 0, source: '' }
      made.send({ type: 'init', labUrl, benchUrl: io.url('bench'), frames, spectra: [] })
    } else if (held !== holds(tile)) {
      job = { tile, seq: 0, source: '' }
      worker.send({ type: 'lab', labUrl, frames, spectra: [] })
    } else render(worker, tile)
  }

  const stop = () => {
    if (job) end()
    io.sounder.stop()
    set({ loading: null, sounding: null })
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    press(id) {
      const tile = tiles.find((one) => one.id === id)
      if (!tile) return
      if (state.loading === id || state.sounding?.id === id) return stop()
      // The sound starts later, when its render lands: what it comes out of is made in the press.
      io.sounder.wake()
      set({
        open: true,
        loading: id,
        failed: state.failed.filter((one) => one !== id),
        said: '',
      })
      start(tile)
    },
    stop,
    setLoop(loop) {
      if (loop === state.loop) return
      set({ loop })
      const sounding = tiles.find((one) => one.id === state.sounding?.id)
      // A load or a render in flight takes the new loop when it lands; a tile that plays its
      // own notes takes none.
      if (sounding && !sounding.own && !job) start(sounding)
    },
    setVolume(volume) {
      set({ volume })
      io.sounder.setVolume(volume)
    },
  }
}
