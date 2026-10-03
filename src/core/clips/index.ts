// Pure clip math: the record, its fade envelopes, waveform peaks and the
// lookahead window. Nothing here touches Web Audio.

export { clipChance, normaliseSeed, seededRandom, seededUnit, soundsOnPass } from './chance'
export { isAudibleClip, type Clip, type FadeCurve } from './Clip'
export { EQUAL_POWER_CURVE_LENGTH, equalPowerFadeIn, equalPowerFadeOut } from './curves'
export { fadeGain } from './fade'
export {
  DEFAULT_PEAK_BUCKETS,
  EMPTY_PEAKS,
  computePeaks,
  slicePeaks,
  type WaveformPeaks,
} from './peaks'
export {
  CLIP_PLACEMENT_KEYS,
  MAX_SPACE_DB,
  MIN_CLIP_LOWPASS_HZ,
  OPEN_CLIP_LOWPASS_HZ,
  SPACE_FLOOR_DB,
  clipLowpassHz,
  clipPan,
  isPlacedClip,
  spaceSendGain,
  type ClipPlacement,
  type ClipPlacementKey,
} from './placement'
export { mirrorSlice, reversedSourceSec, type MirroredSlice } from './reverse'
export {
  SEAM_SILENCE,
  SEAM_STEP_RATIO,
  SEAM_WINDOW_SECONDS,
  comesRound,
  entersOnStep,
  leavesOnStep,
  type SoundFrames,
} from './seam'
export {
  clipsInWindow,
  clipsSoundingAt,
  type ClipWindow,
  type ScheduledClip,
  type WindowClip,
} from './window'
