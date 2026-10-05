// What the Link Audio intake (a worker), its playout (a worklet) and the main
// thread agree on. Imported by all three, so nothing here may touch a global
// that only one of them has.
//
// A peer's channel reaches a page in three steps, the sending path
// (link-audio-protocol.ts) the other way round. The plug-in host listens to
// the channel and writes every buffer that arrives to a WebSocket, stamped
// with when its first frame was heard where it was sent from, on the host's
// clock. The intake reads them and turns that moment into a context time (the
// main thread tells it how the two clocks lie, a few times a second). The
// playout sits in the audio graph and plays each block a fixed delay after
// its moment: long enough that a block has arrived before it is due, and the
// same for every block, so the channel keeps its place on the beat.

import type { LinkAudioClock } from './link-audio-protocol'

export const LINK_SOURCE_PROCESSOR_NAME = 'live-mix-link-source'

/** Binary message type of a received block (after the host's 1, 2 and 3). */
export const HOST_MESSAGE_LINK_AUDIO_IN = 4
/**
 * Four u32 (type, frames, channels, sample rate), then two float64: when the
 * block's first frame was heard at the sender, in host microseconds, and the
 * sender's count of the block.
 */
export const LINK_AUDIO_IN_HEADER_BYTES = 32
/** The fastest stream a block is read at: the fastest the host takes from a page that sends. */
const LINK_AUDIO_IN_MAX_SAMPLE_RATE = 768000

export interface LinkSourceProcessorOptions {
  /**
   * Seconds the channel plays behind the sender. Left out or null, the
   * playout settles on what the path needs and tells the main thread.
   */
  delaySec?: number | null
}

/** One block as the host wrote it. */
export interface LinkAudioInBlock {
  frames: number
  /** 1 or 2. */
  channels: number
  /** The sender's rate; the playout plays it at the context's. */
  sampleRate: number
  /** When the first frame was heard at the sender, on the host's clock. */
  atMicros: number
  /** Up by one with every block the sender made: a gap is a block the network lost. */
  count: number
  /** Interleaved. */
  samples: Float32Array
}

/** Intake → playout, over the port the main thread hands both. */
export interface LinkReceivedBlock extends Omit<LinkAudioInBlock, 'atMicros'> {
  /** The context time that is heard here at the moment the first frame was heard at the sender. */
  contextTime: number
}

/** Main thread → playout. */
export type LinkSourceMessage = { type: 'port'; port: MessagePort } | { type: 'dispose' }

export interface LinkReceiveStats {
  /** Blocks that arrived since the previous report. */
  blocks: number
  /** Blocks the sender made that never arrived, since the previous report. */
  lost: number
  /** Frames played as silence because their sound had not arrived, since the previous report. */
  starvedFrames: number
  /** How far behind the sender the channel plays; null until it has settled. */
  delaySec: number | null
}

/** Playout → main thread. */
export type LinkSourceEvent =
  { type: 'delay'; delaySec: number } | { type: 'stats'; stats: LinkReceiveStats }

/** Main thread → intake. */
export type LinkIntakeMessage =
  | { type: 'start'; url: string; port: MessagePort }
  | ({ type: 'clock' } & LinkAudioClock)
  | { type: 'stop' }

/** Intake → main thread. */
export type LinkIntakeEvent = { type: 'open' } | { type: 'close'; reason: string }

/** The context time heard at `atMicros` on the host's clock. */
export function linkContextTimeAt(atMicros: number, clock: LinkAudioClock): number {
  return clock.contextTime + (atMicros - clock.hostMicros) / 1e6
}

/** One block as the host writes it; the encoder a test host needs. */
export function encodeLinkAudioInBlock(block: LinkAudioInBlock): ArrayBuffer {
  const count = block.frames * block.channels
  const message = new ArrayBuffer(LINK_AUDIO_IN_HEADER_BYTES + count * 4)
  new Uint32Array(message, 0, 4).set([
    HOST_MESSAGE_LINK_AUDIO_IN,
    block.frames,
    block.channels,
    Math.round(block.sampleRate),
  ])
  const view = new DataView(message)
  view.setFloat64(16, block.atMicros, true)
  view.setFloat64(24, block.count, true)
  new Float32Array(message, LINK_AUDIO_IN_HEADER_BYTES, count).set(block.samples.subarray(0, count))
  return message
}

/** Reads one message from the host; null for anything that is not a whole block. */
export function decodeLinkAudioInBlock(message: ArrayBuffer): LinkAudioInBlock | null {
  if (message.byteLength < LINK_AUDIO_IN_HEADER_BYTES) return null
  const [type, frames, channels, sampleRate] = new Uint32Array(message, 0, 4)
  if (type !== HOST_MESSAGE_LINK_AUDIO_IN) return null
  if (frames === 0 || (channels !== 1 && channels !== 2) || sampleRate === 0) return null
  // A peer says its own rate, and the playout keeps two seconds of a stream
  // at that rate: for one no device runs at it would ask for memory by the gigabyte.
  if (sampleRate > LINK_AUDIO_IN_MAX_SAMPLE_RATE) return null
  if (message.byteLength !== LINK_AUDIO_IN_HEADER_BYTES + frames * channels * 4) return null
  const view = new DataView(message)
  const atMicros = view.getFloat64(16, true)
  const count = view.getFloat64(24, true)
  if (!Number.isFinite(atMicros) || !Number.isFinite(count)) return null
  return {
    frames,
    channels,
    sampleRate,
    atMicros,
    count,
    // A copy of its own, so it can be handed on without the header.
    samples: new Float32Array(message.slice(LINK_AUDIO_IN_HEADER_BYTES)),
  }
}
