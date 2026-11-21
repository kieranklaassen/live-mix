/**
 * `@kieranklaassen/live-mix/separation`: a finished track as four stems and a
 * remainder, and those five laid on a score as tracks that bounce back to
 * the track.
 *
 * An entry of its own on purpose. A model is run through an ONNX runtime,
 * which the library never imports: the host loads `onnxruntime-web` (an
 * optional peer), makes the session, and hands both in. Nothing here is
 * reached from `.`, `./dsp` or `./testing`, and nothing here needs a DOM, so
 * the whole of it runs in a worker.
 *
 * @module live-mix/separation
 */

export { createSegmentSeparator, type SegmentModel, type SegmentSeparatorOptions } from './segments'
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
