// The one store and the one player of a page, shared by every island on it, and the worker that
// renders for them. Nothing here runs when the site is built: the worker and the audio context
// are made on first use in the browser.

import { useSyncExternalStore } from 'react'
import { BASE } from '../lib/paths.ts'
import type { LabDescription } from './describe.ts'
import { createPagePlayer, type Player } from './player.ts'
import { SAMPLE_RATE } from './rate.ts'
import {
  INITIAL_STATE,
  createLabStore,
  waitingText,
  type LabConfig,
  type LabState,
  type LabStore,
  type Renderer,
  type Result,
} from './store.ts'
import type { WorkerReply, WorkerRequest } from './worker.ts'

/** A worker that renders labs (worker.ts). A page has one: the lesson's lab store, or the home map's tiles. */
export const labWorker = (): Worker =>
  new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

/** Where a built lab is served from, by its name. */
export const labUrl = (lab: string): string =>
  new URL(`${BASE}/labs/${lab}.wasm`, location.href).href

function workerRenderer(): Renderer {
  let worker: Worker | undefined
  let seq = 0
  const waiting = new Map<number, { resolve: (r: Result) => void; reject: (e: Error) => void }>()
  let loaded: { resolve: (d: LabDescription) => void; reject: (e: Error) => void } | undefined
  const send = (request: WorkerRequest, transfer: Transferable[] = []) =>
    worker?.postMessage(request, transfer)

  return {
    load(config) {
      return new Promise((resolve, reject) => {
        loaded = { resolve, reject }
        worker = labWorker()
        worker.onerror = (event) => {
          const error = new Error(event.message || 'The lab stopped.')
          loaded?.reject(error)
          for (const one of waiting.values()) one.reject(error)
          waiting.clear()
        }
        worker.onmessage = (event: MessageEvent<WorkerReply>) => {
          const reply = event.data
          if (reply.type === 'ready') loaded?.resolve(reply.description)
          else if (reply.type === 'failed') loaded?.reject(new Error(reply.message))
          else {
            waiting.get(reply.seq)?.resolve(reply.result)
            waiting.delete(reply.seq)
          }
        }
        send({
          type: 'init',
          labUrl: labUrl(config.lab),
          benchUrl: labUrl('bench'),
          frames: Math.round(config.seconds * SAMPLE_RATE),
          spectra: config.spectra ?? [],
        })
      })
    },
    render(source, values) {
      return new Promise((resolve, reject) => {
        seq += 1
        waiting.set(seq, { resolve, reject })
        send({ type: 'render', seq, source, values })
      })
    },
    setFile(left, right) {
      send({ type: 'file', left, right })
    },
  }
}

let store: LabStore | undefined
let player: Player | undefined

export function pagePlayer(): Player {
  player ??= createPagePlayer()
  return player
}

export function labStore(): LabStore {
  // The player makes its context on the first play, inside a click, where a browser lets one
  // start; a card, whose sound starts later on its render, makes it in its press. A volume set
  // before then makes the player and no context, and the play starts at it.
  store ??= createLabStore(workerRenderer(), {
    play: (tap) => pagePlayer().play(tap),
    update: (tap) => pagePlayer().update(tap),
    bench: (source) => pagePlayer().bench(source),
    stop: () => player?.stop(),
    setVolume: (volume) => pagePlayer().setVolume(volume),
    wake: () => pagePlayer().wake(),
  })
  return store
}

/** Start the page's lab. Called once, by the play bar. */
export function startLab(config: LabConfig): void {
  void labStore().init(config)
}

export { waitingText }

const subscribe = (listener: () => void) => labStore().subscribe(listener)
const getState = () => labStore().getState()

// A page is built with the state before loading, and an island that wakes later than the lab
// must first render that same state, or what it renders would not match the page as built.
const getBuiltState = () => INITIAL_STATE

export function useLab(): LabState {
  return useSyncExternalStore(subscribe, getState, getBuiltState)
}

/** Decode a file of the reader's own at the labs' rate and make it the source. */
export async function takeOwnFile(file: File): Promise<void> {
  try {
    const bytes = await file.arrayBuffer()
    const Offline = window.OfflineAudioContext
    const decoded = await new Offline(2, 1, SAMPLE_RATE).decodeAudioData(bytes)
    const left = decoded.getChannelData(0)
    const right = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : left
    labStore().setFile(file.name, left, right)
  } catch {
    labStore().fileFailed()
  }
}
