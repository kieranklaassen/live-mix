// The page's side of a lab runs here, off the thread a control is dragged on: a render of an
// eight-second loop through a reverb takes longer than a frame. One worker per lesson holds the
// lesson's lab and the bench that plays the sources.

import { loadLab, type Lab, type RenderResult, type Source, type TapData } from './runner.ts'
import type { LabDescription } from './describe.ts'

export type WorkerRequest =
  | { type: 'init'; labUrl: string; benchUrl: string; frames: number }
  | { type: 'file'; left: Float32Array; right: Float32Array }
  | { type: 'render'; seq: number; source: string; values: Record<string, number> }

export type WorkerReply =
  | { type: 'ready'; description: LabDescription }
  | { type: 'failed'; message: string }
  | { type: 'result'; seq: number; result: RenderResult }

let lab: Lab | undefined
const sources = new Map<string, Source>()

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} answered ${response.status}`)
  return response.arrayBuffer()
}

async function init(labUrl: string, benchUrl: string, frames: number): Promise<LabDescription> {
  const [labBytes, benchBytes] = await Promise.all([fetchBytes(labUrl), fetchBytes(benchUrl)])
  const bench = await loadLab(benchBytes)
  const silent = { left: new Float32Array(frames), right: new Float32Array(frames) }
  const played = bench.render(silent, {}, frames)
  for (const tap of Object.values(played.taps)) {
    const left = tap.channels_data[0]
    if (left) sources.set(tap.id, { left, right: tap.channels_data[1] ?? left })
  }
  lab = await loadLab(labBytes)
  return lab.description
}

/** A spectrum of every audio tap rides along, so a figure can show one without asking again. */
function withSpectra(theLab: Lab, result: RenderResult): Transferable[] {
  const buffers: Transferable[] = []
  for (const tap of Object.values(result.taps) as (TapData & { spectrum?: Float32Array })[]) {
    if (tap.kind === 'audio' && tap.length > 0) tap.spectrum = theLab.spectrum(tap.id)
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
    init(request.labUrl, request.benchUrl, request.frames).then(
      (description) => post({ type: 'ready', description }),
      (error: unknown) =>
        post({ type: 'failed', message: error instanceof Error ? error.message : String(error) }),
    )
  } else if (request.type === 'file') {
    sources.set('file', { left: request.left, right: request.right })
  } else if (lab) {
    const source = sources.get(request.source) ?? sources.values().next().value
    if (!source) return
    const result = lab.render(source, request.values)
    post({ type: 'result', seq: request.seq, result }, withSpectra(lab, result))
  }
}
