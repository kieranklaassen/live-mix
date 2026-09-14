// Port protocol between the Recorder host and the capture worklet. Kept free
// of runtime imports so the processor bundle stays self-contained.

export const RECORDER_PROCESSOR_NAME = 'live-mix-recorder'

/** Frames per chunk posted to the main thread (~0.17 s at 48 kHz). */
export const DEFAULT_RECORDER_CHUNK_FRAMES = 8192

export interface RecorderProcessorOptions {
  channelCount: number
  chunkFrames?: number
}

export type RecorderMessage = { type: 'start'; at?: number } | { type: 'stop' } | { type: 'flush' }

export type RecorderHostMessage =
  | { type: 'chunk'; channels: Float32Array[]; frames: number; startFrame: number }
  | { type: 'stopped'; totalFrames: number }
