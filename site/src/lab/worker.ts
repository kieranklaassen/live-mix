// The page's side of a lab runs here, off the thread a control is dragged on: a render of an
// eight-second loop through a reverb takes longer than a frame. One worker per lesson holds the
// lesson's lab and the bench that plays the sources.

import { loadLab, type Lab, type Source } from './runner.ts'
import type { LabDescription } from './describe.ts'
import { messageOf } from './message.ts'
import { withRoom } from './room.ts'
import { NO_SOURCE, OWN_FILE } from './sources.ts'
import type { Result } from './store.ts'

export type WorkerRequest =
  | { type: 'init'; labUrl: string; benchUrl: string; frames: number; spectra: string[] }
  | { type: 'file'; left: Float32Array; right: Float32Array }
  | { type: 'render'; seq: number; source: string; values: Record<string, number> }

export type WorkerReply =
  | { type: 'ready'; description: LabDescription }
  | { type: 'failed'; message: string }
  | { type: 'result'; seq: number; result: Result }

let lab: Lab | undefined
const sources = new Map<string, Source>()
/** The audio taps a figure on the page draws the spectrum of. */
let spectra: ReadonlySet<string> = new Set()

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} answered ${response.status}`)
  return response.arrayBuffer()
}

async function init(labUrl: string, benchUrl: string, frames: number): Promise<LabDescription> {
  const [labBytes, benchBytes] = await Promise.all([fetchBytes(labUrl), fetchBytes(benchUrl)])
  const bench = await loadLab(benchBytes)
  const silent = { left: new Float32Array(frames), right: new Float32Array(frames) }
  sources.set(NO_SOURCE.id, silent)
  const played = bench.render(silent, {}, frames)
  for (const tap of Object.values(played.taps)) {
    const left = tap.channels_data[0]
    if (left) sources.set(tap.id, { left, right: tap.channels_data[1] ?? left })
  }
  // The one lab that takes a second signal takes the engine's room (lesson 15).
  lab = withRoom(await loadLab(labBytes))
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
  if (request.type === 'init') {
    spectra = new Set(request.spectra)
    init(request.labUrl, request.benchUrl, request.frames).then(
      (description) => post({ type: 'ready', description }),
      (error: unknown) => post({ type: 'failed', message: messageOf(error) }),
    )
  } else if (request.type === 'file') {
    sources.set(OWN_FILE, { left: request.left, right: request.right })
  } else if (lab) {
    const source = sources.get(request.source) ?? sources.values().next().value
    if (!source) return
    const result: Result = lab.render(source, request.values)
    post({ type: 'result', seq: request.seq, result }, withSpectra(lab, result))
  }
}
