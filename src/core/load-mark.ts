// The processor's half of the load probe (load.ts), kept apart and free of
// imports so it can be bundled into every worklet file.

/**
 * Shared cells: who is at work, which run of the sampler is the current one,
 * and a cell nobody writes, for the sampler to sleep on.
 */
export const LOAD_CELL_BUSY = 0
export const LOAD_CELL_RUN = 1
export const LOAD_CELL_NAP = 2
export const LOAD_CELLS = 3

/** What a worklet processor is handed, in `processorOptions.load`, to mark its work with. */
export interface LoadSlot {
  /** The shared cells (`Int32Array`). */
  buffer: SharedArrayBuffer
  /** This processor's mark: it stores it in the busy cell when `process` starts and 0 when it ends. */
  slot: number
}

/** The cells to store the mark in, or null when the processor was handed none. */
export function loadCells(slot: LoadSlot | undefined): Int32Array | null {
  return slot && slot.slot > 0 ? new Int32Array(slot.buffer) : null
}
