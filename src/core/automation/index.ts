// Automation and modulation (U19): breakpoint lanes written ahead into
// AudioParams with cancel-and-hold on override, and a modulation matrix of
// free-running sources onto any AudioParam or device parameter. Everything
// evaluates offline, so the same formula drives the audio, the bounce and
// the picture on screen.

export {
  DEFAULT_JOIN_RAMP_SECONDS,
  LaneWriter,
  laneWindowFrom,
  type LaneTransport,
  type LaneWindow,
  type LaneWriterOptions,
} from './LaneWriter'
export {
  ModMatrix,
  audioParamTarget,
  deviceParamTarget,
  routeOffset,
  type AudioParamTargetOptions,
  type DeviceParamTargetOptions,
  type ModMatrixOptions,
  type ModPolarity,
  type ModRoute,
  type ModRouteOptions,
  type ModTarget,
  type ModUpdate,
} from './ModMatrix'
export {
  EnvelopeFollower,
  ExternalPhase,
  Lfo,
  Macro,
  Random,
  breathLaw,
  lfoWaveform,
  renderModulator,
  type EnvelopeFollowerOptions,
  type ExternalPhaseOptions,
  type LfoOptions,
  type LfoShape,
  type ModSource,
  type PhaseModulatorOptions,
  type RandomOptions,
} from './Modulator'
export { nodeDeviceParam } from './node-device-param'
export {
  ParamLane,
  SMOOTH_SEGMENT_STEPS,
  effectiveCurve,
  laneEventsInRange,
  segmentValue,
  type Breakpoint,
  type LaneCurve,
  type LaneEvent,
  type ParamLaneOptions,
} from './ParamLane'
export {
  DEFAULT_RAMP_SECONDS,
  ParamRamper,
  holdParamAt,
  type ScheduledParam,
} from './scheduled-param'
export {
  Automation,
  DEFAULT_AUTOMATION_LOOKAHEAD_SECONDS,
  type AutomationOptions,
} from './Automation'
