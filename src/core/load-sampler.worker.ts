// The load sampler: looks at the busy cell at random moments and counts which
// processor it finds at work (see load.ts). It sleeps between looks, for a
// random time, so its looks keep no step with the audio callbacks; that sleep
// blocks, which is why this is a worker and why it is stopped through the
// shared run cell instead of a message. Bundled to a single classic script
// (dist/worklets/load-sampler.js).
//
// It sleeps on a cell of the buffer it is handed and makes no shared memory
// of its own: a bundler may inline a script this small as a data: URL, and a
// worker started from one is not always given the SharedArrayBuffer
// constructor (Electron on a custom scheme withholds it), though it can use
// the buffer it was sent.

import { type LoadSamplerReport, type LoadSamplerStart } from './load'
import { LOAD_CELL_BUSY, LOAD_CELL_NAP, LOAD_CELL_RUN } from './load-mark'

interface WorkerScope {
  onmessage: ((event: MessageEvent<LoadSamplerStart>) => void) | null
  postMessage(message: LoadSamplerReport): void
  close(): void
}

/** Between looks: long enough to cost next to nothing, short enough for a few hundred looks a second. */
const NAP_MIN_MS = 0.8
const NAP_SPREAD_MS = 1.6

const scope = globalThis as unknown as WorkerScope

scope.onmessage = (event) => {
  const { buffer, run, slots, reportMs } = event.data
  const cells = new Int32Array(buffer)
  let counts = new Uint32Array(slots)
  let total = 0
  let reported = performance.now()
  while (Atomics.load(cells, LOAD_CELL_RUN) === run) {
    Atomics.wait(cells, LOAD_CELL_NAP, 0, NAP_MIN_MS + Math.random() * NAP_SPREAD_MS)
    const busy = Atomics.load(cells, LOAD_CELL_BUSY)
    if (busy > 0 && busy < slots) counts[busy] += 1
    total += 1
    const now = performance.now()
    if (now - reported < reportMs) continue
    scope.postMessage({ counts, total })
    counts = new Uint32Array(slots)
    total = 0
    reported = now
  }
  scope.close()
}
