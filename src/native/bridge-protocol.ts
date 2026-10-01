// What the bridge worklet, the pump worker and the main thread agree on: the
// shared-memory layout between the worklet and the pump, and the binary
// messages between the pump and the plug-in host. Imported by all three, so
// nothing here may touch a global that only one of them has.
//
// Audio crosses two hops. The worklet cannot open a socket and must not wait,
// so it writes each render quantum into a ring in shared memory and reads the
// processed audio for a quantum `latencyFrames` earlier from a second ring.
// The pump, a worker, sleeps on the write counter, sends what arrived to the
// host over a WebSocket and writes each reply into the second ring. Frames are
// addressed by an absolute index (wrapping at 2^32), so a late reply can never
// shift the timing: a frame the host has not returned in time plays as
// silence and the stream stays aligned.

export const NATIVE_BRIDGE_PROCESSOR_NAME = 'live-mix-native-bridge'

/** Slots of the `Int32Array` over the control buffer. */
export const BRIDGE_WRITTEN = 0
export const BRIDGE_READY = 1
export const BRIDGE_UNDERRUNS = 2
export const BRIDGE_ACTIVE = 3
export const BRIDGE_LATENCY = 4
export const BRIDGE_CONTROL_SLOTS = 8

/** Frames in each ring; a power of two well above any bridge latency. */
export const BRIDGE_RING_FRAMES = 16384
/** The pump never sends more than this in one message, so the host's blocks stay small. */
export const BRIDGE_MAX_BLOCK_FRAMES = 512
/**
 * Round-trip budget in frames when the caller does not choose one (≈ 10.7 ms
 * at 48 kHz). `bridgeLatencyFor` raises it on an audio device with a larger
 * buffer of its own.
 */
export const DEFAULT_BRIDGE_LATENCY_FRAMES = 512
/** What `bridgeLatencyFor` leaves on top of the audio device's buffer for the trip itself. */
export const BRIDGE_LATENCY_MARGIN_FRAMES = 512
export const MIN_BRIDGE_LATENCY_FRAMES = 128
export const MAX_BRIDGE_LATENCY_FRAMES = 8192

/** Binary message types, the first of four little-endian u32 header words. */
export const HOST_MESSAGE_PROCESS = 1
export const HOST_MESSAGE_MIDI = 2
export const HOST_HEADER_BYTES = 16

/** The three shared buffers of one bridge. */
export interface BridgeMemory {
  control: SharedArrayBuffer
  /** Planar: `inputChannels` runs of `ringFrames` samples. Empty for an instrument. */
  input: SharedArrayBuffer
  /** Planar: `outputChannels` runs of `ringFrames` samples. */
  output: SharedArrayBuffer
  inputChannels: number
  outputChannels: number
  ringFrames: number
}

export type NativeBridgeProcessorOptions = BridgeMemory

/** Main thread → pump worker. */
export type PumpMessage =
  | { type: 'start'; memory: BridgeMemory; url: string; statsIntervalMs?: number }
  | { type: 'midi'; bytes: number[] }
  | { type: 'stop' }

export interface PumpStats {
  /** Blocks answered since the previous report. */
  blocks: number
  /** Mean and worst send-to-reply time of those blocks, in milliseconds. */
  roundTripMeanMs: number
  roundTripMaxMs: number
  /** Quanta the worklet played as silence because the host was late, in total. */
  underruns: number
  /** Frames the pump dropped because it fell a whole ring behind, in total. */
  droppedFrames: number
}

/** Pump worker → main thread. */
export type PumpEvent =
  { type: 'open' } | { type: 'close'; reason: string } | { type: 'stats'; stats: PumpStats }

export function allocateBridgeMemory(
  inputChannels: number,
  outputChannels: number,
  ringFrames = BRIDGE_RING_FRAMES,
): BridgeMemory {
  if (typeof SharedArrayBuffer === 'undefined') {
    throw new Error(
      'live-mix: hosted plug-ins need SharedArrayBuffer, which a page only gets when it is cross-origin isolated (COOP: same-origin, COEP: require-corp)',
    )
  }
  const bytes = Float32Array.BYTES_PER_ELEMENT
  return {
    control: new SharedArrayBuffer(BRIDGE_CONTROL_SLOTS * Int32Array.BYTES_PER_ELEMENT),
    input: new SharedArrayBuffer(Math.max(1, inputChannels) * ringFrames * bytes),
    output: new SharedArrayBuffer(Math.max(1, outputChannels) * ringFrames * bytes),
    inputChannels,
    outputChannels,
    ringFrames,
  }
}

export function clampBridgeLatency(frames: number): number {
  if (!Number.isFinite(frames)) return DEFAULT_BRIDGE_LATENCY_FRAMES
  const quanta = Math.round(frames / 128) * 128
  return Math.min(MAX_BRIDGE_LATENCY_FRAMES, Math.max(MIN_BRIDGE_LATENCY_FRAMES, quanta))
}

/**
 * The bridge latency a context needs. A browser renders in bursts as long as
 * the audio device's buffer (`baseLatency`), and every quantum of a burst
 * wants audio the host must already have returned, so the budget is one
 * device buffer plus a margin for the trip. Without a device buffer to go by
 * (an offline render) it is the default.
 *
 * Measured in headless Chromium on a busy four-core machine with a 480-frame
 * device buffer, one minute each: 512 frames in total drops a quantum every
 * few seconds, 768 drops two, 1024 and more drop none.
 */
export function bridgeLatencyFor(context: { sampleRate: number; baseLatency?: number }): number {
  const base = context.baseLatency
  if (base === undefined || !Number.isFinite(base) || base <= 0) {
    return DEFAULT_BRIDGE_LATENCY_FRAMES
  }
  const deviceFrames = Math.ceil(Math.round(base * context.sampleRate) / 128) * 128
  return clampBridgeLatency(
    Math.max(DEFAULT_BRIDGE_LATENCY_FRAMES, deviceFrames + BRIDGE_LATENCY_MARGIN_FRAMES),
  )
}

/** Copy `count` frames into a ring at absolute frame `index`, wrapping at `ringFrames`. */
export function writeRing(
  ring: Float32Array,
  ringFrames: number,
  channel: number,
  index: number,
  source: Float32Array,
  sourceOffset: number,
  count: number,
): void {
  const base = channel * ringFrames
  const start = (index >>> 0) % ringFrames
  const first = Math.min(count, ringFrames - start)
  ring.set(source.subarray(sourceOffset, sourceOffset + first), base + start)
  if (first < count) ring.set(source.subarray(sourceOffset + first, sourceOffset + count), base)
}

/** Copy `count` frames out of a ring from absolute frame `index`, wrapping at `ringFrames`. */
export function readRing(
  ring: Float32Array,
  ringFrames: number,
  channel: number,
  index: number,
  target: Float32Array,
  targetOffset: number,
  count: number,
): void {
  const base = channel * ringFrames
  const start = (index >>> 0) % ringFrames
  const first = Math.min(count, ringFrames - start)
  target.set(ring.subarray(base + start, base + start + first), targetOffset)
  if (first < count) target.set(ring.subarray(base, base + count - first), targetOffset + first)
}

/** Zero `count` frames of a ring from absolute frame `index`, wrapping at `ringFrames`. */
export function clearRing(
  ring: Float32Array,
  ringFrames: number,
  channel: number,
  index: number,
  count: number,
): void {
  const base = channel * ringFrames
  const start = (index >>> 0) % ringFrames
  const first = Math.min(count, ringFrames - start)
  ring.fill(0, base + start, base + start + first)
  if (first < count) ring.fill(0, base, base + count - first)
}

/** Signed distance from frame index `b` to frame index `a`, both wrapping at 2^32. */
export function frameDistance(a: number, b: number): number {
  return (a - b) | 0
}
