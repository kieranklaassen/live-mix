// Pure clip math: the record, its fade envelopes, waveform peaks and the
// lookahead window. Nothing here touches Web Audio.

export { type Clip, type FadeCurve } from './Clip'
export { EQUAL_POWER_CURVE_LENGTH, equalPowerFadeIn, equalPowerFadeOut } from './curves'
export { fadeGain } from './fade'
export {
  DEFAULT_PEAK_BUCKETS,
  EMPTY_PEAKS,
  computePeaks,
  slicePeaks,
  type WaveformPeaks,
} from './peaks'
export { clipsInWindow, type ClipWindow, type ScheduledClip } from './window'
