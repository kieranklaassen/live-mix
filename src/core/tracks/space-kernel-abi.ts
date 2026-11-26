// What the page and the audio thread's half of a room's convolution
// (`SpaceKernel.ts`, `dsp/worklets/space-room.processor.ts`) say to each other.

/** The name the processor is registered under. */
export const SPACE_ROOM_PROCESSOR_NAME = 'live-mix-space-room'

/** How many frames a room takes at a time. */
export const SPACE_ROOM_QUANTUM = 128

/** A room begins with these many counts, which the page may read while the room runs. */
export const SPACE_ROOM_STATE_INTS = 4
/** How many blocks of nothing came in since the last that had something, up to the next. */
export const SPACE_ROOM_QUIET = 1
/** The blocks of nothing after which a room has rung out. */
export const SPACE_ROOM_TAIL = 2

/** The functions of `space-room.wasm` (`cpp/space-room/space_room.cpp`). Every argument is an address or a count. */
export interface SpaceRoomExports {
  room_bytes(): number
  room_in(room: number): number
  room_out(room: number): number
  room_init(room: number, tail: number): void
  room_level(
    room: number,
    size: number,
    partitions: number,
    tables: number,
    spectra: number,
    line: number,
    sum: number,
    input: number,
    heard: number,
    made: number,
    offset: number,
  ): void
  room_spectrum(to: number, size: number, tables: number, samples: number): void
  room_process(room: number): number
}

export interface SpaceRoomProcessorOptions {
  module: WebAssembly.Module
  memory: WebAssembly.Memory
  /** The room's address in that memory, ready to be processed. */
  room: number
}

/** The page is done with the room. Answered with `'ended'`, after which the processor never touches the memory again. */
export type SpaceRoomMessage = 'end'
export type SpaceRoomHostMessage = 'ended'
