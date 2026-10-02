// What the Link Audio tap (a worklet), its pump (a worker) and the main
// thread agree on. Imported by all three, so nothing here may touch a global
// that only one of them has.
//
// A page's sound reaches a Link session in three steps. The tap sits on an
// audio node, copies what passes into blocks and posts each one, with the
// context frame it began at, straight to the pump. The pump knows when a
// context frame is heard on the host's clock (the main thread tells it, a few
// times a second), stamps each block with that and sends it to the plug-in
// host over a WebSocket. The host gives it to Link as one channel, on the
// beat that time is. Nothing comes back: the stream is one way, and a block
// that cannot be sent is dropped rather than queued, so a slow moment never
// turns into a growing delay.

export const LINK_TAP_PROCESSOR_NAME = 'live-mix-link-tap'

/** Binary message type, the first of four little-endian u32 header words (after the host's own 1 and 2). */
export const HOST_MESSAGE_LINK_AUDIO = 3
/** Four u32 (type, frames, channels, sample rate), then a float64: when the block is heard, in host microseconds. */
export const LINK_AUDIO_HEADER_BYTES = 24
/** Frames in one block: four render quanta, about 10 ms at 48 kHz. */
export const LINK_AUDIO_BLOCK_FRAMES = 512
/** Bytes waiting in the socket above which the pump drops blocks: about a second of stereo. */
export const LINK_AUDIO_MAX_QUEUED_BYTES = 512 * 1024

export interface LinkTapProcessorOptions {
  /** 1 or 2. */
  channels: number
  blockFrames?: number
}

/** Tap → pump, over the port the main thread hands both. */
export interface LinkTapBlock {
  /** The context frame of the block's first sample. */
  frame: number
  frames: number
  channels: number
  /** Interleaved; transferred. */
  samples: Float32Array
}

/** Main thread → tap. */
export type LinkTapMessage = { type: 'port'; port: MessagePort } | { type: 'dispose' }

/** When a context time is heard on the host's clock; both run at one rate, so one pair says it all. */
export interface LinkAudioClock {
  contextTime: number
  hostMicros: number
}

/** Main thread → pump. */
export type LinkAudioPumpMessage =
  | { type: 'start'; url: string; sampleRate: number; port: MessagePort; statsIntervalMs?: number }
  | ({ type: 'clock' } & LinkAudioClock)
  | { type: 'stop' }

export interface LinkAudioStats {
  /** Blocks sent since the previous report. */
  blocks: number
  /** Blocks dropped since the previous report: no clock yet, or the socket was backed up. */
  dropped: number
}

/** Pump → main thread. */
export type LinkAudioPumpEvent =
  { type: 'open' } | { type: 'close'; reason: string } | { type: 'stats'; stats: LinkAudioStats }

/** When `block` is heard on the host's clock, in microseconds. */
export function linkAudioBlockMicros(
  block: Pick<LinkTapBlock, 'frame'>,
  sampleRate: number,
  clock: LinkAudioClock,
): number {
  return clock.hostMicros + (block.frame / sampleRate - clock.contextTime) * 1e6
}

/** One block as the host reads it. */
export function encodeLinkAudioBlock(
  block: LinkTapBlock,
  sampleRate: number,
  atMicros: number,
): ArrayBuffer {
  const count = block.frames * block.channels
  const message = new ArrayBuffer(LINK_AUDIO_HEADER_BYTES + count * 4)
  new Uint32Array(message, 0, 4).set([
    HOST_MESSAGE_LINK_AUDIO,
    block.frames,
    block.channels,
    Math.round(sampleRate),
  ])
  new DataView(message).setFloat64(16, atMicros, true)
  new Float32Array(message, LINK_AUDIO_HEADER_BYTES, count).set(block.samples.subarray(0, count))
  return message
}
