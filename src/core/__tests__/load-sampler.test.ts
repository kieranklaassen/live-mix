import { afterEach, describe, expect, it, vi } from 'vitest'

import type { LoadSamplerReport, LoadSamplerStart } from '../load'
import { LOAD_CELLS, LOAD_CELL_BUSY, LOAD_CELL_RUN } from '../load-mark'
// The worker's script: loading it sets the scope's message handler.
import '../load-sampler.worker'

interface WorkerScope {
  onmessage: ((event: { data: LoadSamplerStart }) => void) | null
  postMessage: (report: LoadSamplerReport) => void
  close: () => void
}

const scope = globalThis as unknown as WorkerScope

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('load sampler worker', () => {
  it('counts who it finds at work, and stops when the run cell moves on', () => {
    const buffer = new SharedArrayBuffer(LOAD_CELLS * Int32Array.BYTES_PER_ELEMENT)
    const cells = new Int32Array(buffer)
    cells[LOAD_CELL_RUN] = 4
    cells[LOAD_CELL_BUSY] = 3
    const reports: LoadSamplerReport[] = []
    const close = vi.fn()
    // The sampler never returns to its event loop, so the test stops it from inside a report.
    vi.stubGlobal('postMessage', (report: LoadSamplerReport) => {
      reports.push(report)
      if (reports.length === 1) cells[LOAD_CELL_BUSY] = 0
      else Atomics.store(cells, LOAD_CELL_RUN, 5)
    })
    vi.stubGlobal('close', close)
    // A worker started from a data: URL may be handed shared memory without being given the constructor.
    vi.stubGlobal('SharedArrayBuffer', undefined)

    scope.onmessage?.({ data: { buffer, run: 4, slots: 8, reportMs: 0 } })

    expect(reports).toHaveLength(2)
    expect(Array.from(reports[0].counts)).toEqual([0, 0, 0, 1, 0, 0, 0, 0])
    expect(reports[0].total).toBe(1)
    // Nobody at work: a look that counts for the total only.
    expect(Array.from(reports[1].counts)).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
    expect(reports[1].total).toBe(1)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('does nothing for a run that is already over', () => {
    const buffer = new SharedArrayBuffer(LOAD_CELLS * Int32Array.BYTES_PER_ELEMENT)
    new Int32Array(buffer)[LOAD_CELL_RUN] = 9
    const post = vi.fn()
    const close = vi.fn()
    vi.stubGlobal('postMessage', post)
    vi.stubGlobal('close', close)
    scope.onmessage?.({ data: { buffer, run: 8, slots: 8, reportMs: 0 } })
    expect(post).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledTimes(1)
  })
})
