/**
 * `@kieranklaassen/live-mix/separation`: a finished track as the stems a
 * separator names and a remainder, and those parts laid on a score as tracks
 * that bounce back to the track. A separator that names none answers the four
 * stems. Separators are joined into one, a part is split by a second
 * separator, and a model can go over a track more than once. A model is one
 * of three kinds: a hybrid model, one that answers every stem's sound, and
 * one that answers one stem's spectrogram.
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
export { splitPart, type SplitOptions } from './split'
export { joinSeparators, type JoinMember, type JoinedName } from './join'
export { partNames, stemNames } from './names'
export { createSegmentSeparator, type SegmentModel, type SegmentSeparatorOptions } from './segments'
export { HYBRID_MODEL_SPEC, createHybridModel, type HybridModelSpec } from './hybrid-model'
export { createWaveformModel, type WaveformModelSpec } from './waveform-model'
export { createSpectrogramModel, type SpectrogramModelSpec } from './spectrogram-model'
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
  type SplitReport,
  type StemName,
} from './types'
