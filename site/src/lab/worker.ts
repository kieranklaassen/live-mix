// The page's side of a lab runs here, off the thread a control is dragged on: a render of an
// eight-second loop through a reverb takes longer than a frame. One worker per page holds a lab
// and the bench that plays the sources. A lesson's page loads its one lab; the home page loads
// one lab after another into the same worker, and the bench is not played again for a loop
// length it has already played.

import { loadLab, type Lab, type Source } from './runner.ts'
import type { LabDescription } from './describe.ts'
import { messageOf } from './message.ts'
import { withRoom } from './room.ts'
import { NO_SOURCE, OWN_FILE } from './sources.ts'
import type { Result } from './store.ts'

export type WorkerRequest =
  | { type: 'init'; labUrl: string; benchUrl: string; frames: number; spectra: string[] }
  /** Another lab in place of the one that is loaded, answered as `init` is. The bench stays. */
  | { type: 'lab'; labUrl: string; frames: number; spectra: string[] }
  | { type: 'file'; left: Float32Array; right: Float32Array }
  | { type: 'render'; seq: number; source: string; values: Record<string, number> }

export type WorkerReply =
  | { type: 'ready'; description: LabDescription }
  | { type: 'failed'; message: string }
  | { type: 'result'; seq: number; result: Result }

let lab: Lab | undefined
let bench: Lab | undefined
/** What the bench played, by the loop's length in frames: kept, so a length is played once. */
const played = new Map<number, Map<string, Source>>()
/** The sources at the loop length of the lab that is loaded. */
let sources: ReadonlyMap<string, Source> = new Map()
/** The reader's own file. */
let file: Source | undefined
/** The audio taps a figure on the page draws the spectrum of. */
let spectra: ReadonlySet<string> = new Set()

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} answered ${response.status}`)
  return response.arrayBuffer()
}

function benchSources(theBench: Lab, frames: number): Map<string, Source> {
  let kept = played.get(frames)
  if (!kept) {
    kept = new Map()
    const silent = { left: new Float32Array(frames), right: new Float32Array(frames) }
    kept.set(NO_SOURCE.id, silent)
    for (const tap of Object.values(theBench.render(silent, {}, frames).taps)) {
      const left = tap.channels_data[0]
      if (left) kept.set(tap.id, { left, right: tap.channels_data[1] ?? left })
    }
    played.set(frames, kept)
  }
  return kept
}

/** Load a lab, and the bench when a URL for it is given, and make the lab the one that renders. */
async function load(labUrl: string, frames: number, benchUrl?: string): Promise<LabDescription> {
  const [labBytes, benchBytes] = await Promise.all([
    fetchBytes(labUrl),
    benchUrl === undefined ? undefined : fetchBytes(benchUrl),
  ])
  if (benchBytes) bench = await loadLab(benchBytes)
  if (!bench) throw new Error('A lab was asked for before the bench was loaded.')
  const next = benchSources(bench, frames)
  // The one lab that takes a second signal takes the engine's room (the convolution reverb lesson).
  lab = withRoom(await loadLab(labBytes))
  sources = next
  return lab.description
}

/** A spectrum rides along with each audio tap a figure draws one of, so the figure need not ask. */
function withSpectra(theLab: Lab, result: Result): Transferable[] {
  const buffers: Transferable[] = []
  for (const tap of Object.values(result.taps)) {
    if (tap.kind === 'audio' && tap.length > 0 && spectra.has(tap.id)) {
      tap.spectrum = theLab.spectrum(tap.id)
    }
    for (const data of tap.channels_data) buffers.push(data.buffer)
    if (tap.spectrum) buffers.push(tap.spectrum.buffer)
  }
  return buffers
}

const post = (reply: WorkerReply, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(reply, transfer)

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  if (request.type === 'init' || request.type === 'lab') {
    spectra = new Set(request.spectra)
    load(
      request.labUrl,
      request.frames,
      request.type === 'init' ? request.benchUrl : undefined,
    ).then(
      (description) => post({ type: 'ready', description }),
      (error: unknown) => post({ type: 'failed', message: messageOf(error) }),
    )
  } else if (request.type === 'file') {
    file = { left: request.left, right: request.right }
  } else if (lab) {
    const source =
      (request.source === OWN_FILE ? file : sources.get(request.source)) ??
      sources.values().next().value
    if (!source) return
    const result: Result = lab.render(source, request.values)
    post({ type: 'result', seq: request.seq, result }, withSpectra(lab, result))
  }
}
