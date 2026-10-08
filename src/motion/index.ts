/**
 * `@kieranklaassen/live-mix/motion` — motion for layers of a picture: how a
 * layer arrives, leaves and moves between, as plain functions of time
 * (docs/motion.md).
 *
 *   const resolved = resolveLayerMotion(layer.motion, { length, rest, profile })   // once per change
 *   const values = motionAt(resolved, time - layer.start)                          // once per frame
 *
 * Separate entry on purpose: nothing here imports from outside this folder,
 * names a DOM, Web Audio or WebGL type, or keeps a value from one call to the
 * next, so the same code serves a preview, an export stepping frame by frame,
 * a server and any other runtime, and none of the audio engine is loaded
 * with it. `src/motion/__tests__/purity.test.ts` and `tsconfig.motion.json`
 * hold it to that.
 *
 * @module live-mix/motion
 */

export {
  EASING_NAMES,
  bezierOf,
  cubicBezier,
  curveOf,
  isEasing,
  type Bezier,
  type Curve,
  type Easing,
  type EasingName,
} from './easing'
export {
  MAX_BOUNCE,
  SETTLED,
  bounceCurve,
  dampingRatio,
  springCurve,
  springDuration,
  springValue,
  type SpringConfig,
} from './spring'
export { NEUTRAL_PROFILE, motionProfile, type MotionProfile } from './profile'
export {
  DEFAULT_BOUNCE,
  DEFAULT_STRENGTH,
  NO_POSE,
  PRESETS,
  PRESET_NAMES,
  presetDuration,
  presetPose,
  type MotionPreset,
  type MotionSide,
  type PresetContext,
  type PresetInfo,
  type PresetName,
  type PresetPose,
} from './presets'
export {
  DEFAULT_KEYFRAME_EASING,
  KEYFRAME_PROPERTIES,
  keyframeAt,
  keyframeTimes,
  keyframeTrack,
  trackValue,
  valueAt,
  withKeyframe,
  withoutKeyframe,
  type Keyframe,
  type KeyframeProperty,
  type KeyframeTrack,
} from './keyframes'
export {
  DEFAULT_FADE,
  layerMotionAt,
  motionAt,
  motionIssues,
  resolveLayerMotion,
  type LayerMotion,
  type MotionContext,
  type MotionIssue,
  type ResolvedMotion,
  type ResolvedSide,
} from './layer-motion'
export { DEFAULT_SAMPLES, DEFAULT_SHUTTER, shutterTimes, type MotionBlur } from './shutter'
export { steadyClock, type SteadyClock, type SteadyClockOptions } from './clock'
export { ORIGIN, restValues, type MotionValues, type RestPose } from './values'
