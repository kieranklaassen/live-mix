// The processor's half of the load probe (load.ts), kept apart and free of
// imports so it can be bundled into every worklet file.

/** Shared cells: who is at work, and which run of the sampler is the current one. */
export const LOAD_CELL_BUSY = 0
export const LOAD_CELL_RUN = 1
export const LOAD_CELLS = 2

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
