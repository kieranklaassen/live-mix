/**
 * `@kieranklaassen/live-mix/separation`: a finished track as four stems and a
 * remainder, and those five laid on a score as tracks that bounce back to
 * the track.
 *
 * An entry of its own on purpose. A model is run through an ONNX runtime,
 * which the library never imports: the host loads `onnxruntime-web`, makes
 * the session, and hands both in. Nothing here is reached from `.`, `./dsp`
 * or `./testing`. Separating needs no DOM, so it runs in a worker; the
 * tracks are made on the page, where there is an `AudioBuffer` to keep a
 * part in.
 *
 * @module live-mix/separation
 */

export { separateTrack } from './separate'
export { partNames, stemNames } from './names'
export { createSegmentSeparator, type SegmentModel, type SegmentSeparatorOptions } from './segments'
export { HYBRID_MODEL_SPEC, createHybridModel, type HybridModelSpec } from './hybrid-model'
export { createWaveformModel, type WaveformModelSpec } from './waveform-model'
export { separationTracks, type SeparationTracks, type SeparationTracksOptions } from './tracks'
export {
  PART_NAMES,
  STEM_NAMES,
  SeparationError,
  type Channels,
  type ModelRuntime,
  type ModelSession,
  type PartName,
  type SeparateOptions,
  type Separation,
  type SeparationProgress,
  type SeparationReport,
  type Separator,
  type StemName,
} from './types'
