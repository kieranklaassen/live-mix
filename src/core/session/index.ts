// Session grid (U31): scenes × clip slots over the score, quantised launch
// on the tempo map, follow actions, and the runtime that performs them
// through score operations.

export {
  DEFAULT_LAUNCH_QUANTIZE,
  LAUNCH_GRID_EPSILON_SECONDS,
  describeQuantize,
  followTimeSeconds,
  isFollowTime,
  isLaunchQuantize,
  quantizeLaunch,
  sameQuantize,
  type FollowTime,
  type LaunchQuantize,
} from './launch'
export {
  FOLLOW_ACTION_KINDS,
  describeFollowAction,
  drawFollowAction,
  isFollowAction,
  isFollowActionKind,
  normaliseFollowAction,
  resolveFollowAction,
  type FollowActionKind,
  type FollowOutcome,
  type ScoreFollowAction,
} from './followActions'
export {
  LAUNCH_MODES,
  SLOT_STATES,
  defaultSlot,
  findSlot,
  sceneSlots,
  slotAt,
  slotClipOf,
  trackSlots,
  type LaunchMode,
  type ScoreSlot,
  type SlotClip,
  type SlotHolder,
  type SlotState,
} from './Slot'
export { findScene, sceneNeighbour, sceneOrder, type SceneHolder, type ScoreScene } from './Scene'
export {
  DEFAULT_IMMEDIATE_LEAD_SECONDS,
  DEFAULT_OPEN_END_SECONDS,
  DEFAULT_SESSION_LOOKAHEAD_SECONDS,
  MIN_STOP_FADE_SECONDS,
  Session,
  type LaunchOptions,
  type SessionListener,
  type SessionOptions,
  type SlotStatus,
  type TrackStatus,
} from './Session'
