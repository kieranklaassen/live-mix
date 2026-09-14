// The styled kit (U25, R32): primitives and composite views over the U24
// hooks, themed through `--lm-*` CSS variables. Import
// `@kieranklaassen/live-mix/react/styles.css` for the defaults, or set the
// tokens yourself (`themeStyle`, `jaxaZenLight`, `jaxaZenDark`).

export {
  clamp,
  clamp01,
  dbToMeterPosition,
  denormalizeValue,
  FADER_MAX_DB,
  FADER_MIN_DB,
  FADER_SKEW,
  faderDbToLevel,
  formatControlValue,
  formatParamValue,
  formatTimeSec,
  isChoiceParam,
  KNOB_START_DEG,
  KNOB_SWEEP_DEG,
  knobAngleToNorm,
  knobArcPath,
  levelToFaderDb,
  levelToMeterPosition,
  LUFS_FLOOR,
  METER_FLOOR_DB,
  normalizeValue,
  normToKnobAngle,
  paramStep,
  paramTaper,
  pointerDeltaToNormDelta,
  quantize,
  stepBy,
  wheelDeltaToNormDelta,
  type ControlTaper,
  type ControlUnit,
  type FormatControlValueOptions,
  type KnownControlUnit,
} from './control-math'
export {
  ambientWater,
  cx,
  jaxaZenDark,
  jaxaZenLight,
  LM_TOKENS,
  themes,
  themeStyle,
  tokenRef,
  tokenVar,
  type LiveMixTheme,
  type LiveMixThemeName,
  type LiveMixToken,
} from './tokens'
export {
  useParamControl,
  type ControlAxis,
  type ParamControl,
  type ParamControlHandlers,
  type ParamControlOptions,
} from './useParamControl'
export { Knob, type KnobProps } from './Knob'
export { Fader, type FaderOrientation, type FaderProps } from './Fader'
export {
  DeviceToggle,
  ToggleButton,
  type DeviceToggleProps,
  type ToggleButtonProps,
  type ToggleTone,
} from './Toggle'
export { Meter, type MeterBarKind, type MeterOrientation, type MeterProps } from './Meter'
export { TransportBar, type TransportBarProps } from './TransportBar'
export {
  ChannelStripView,
  ChannelStripView as MixerStrip,
  InsertChip,
  InsertList,
  readSends,
  resolveStrip,
  UNITY_FADER_TICK,
  useStripMeter,
  type ChannelStripViewProps,
  type StripKind,
} from './ChannelStripView'
export { MasterStripView, type MasterStripViewProps } from './MasterStripView'
export { MixerView, type MixerViewProps } from './MixerView'
export {
  GRID_QUANTIZE_CHOICES,
  GridView,
  parseQuantizeKey,
  quantizeKey,
  quantizeLabel,
  type GridQuantizeChoice,
  type GridViewProps,
} from './GridView'
export {
  DeviceFrame,
  DevicePanel,
  DeviceView,
  type DeviceFrameProps,
  type DevicePanelProps,
} from './DevicePanel'
export { DeviceChainView, reorderInserts, type DeviceChainViewProps } from './DeviceChainView'
export {
  rulerTicks,
  TimelineView,
  type TimelineLane,
  type TimelineLaneInput,
  type TimelineViewProps,
} from './TimelineView'
export { clipPeaks, Waveform, waveformPath, type WaveformProps } from './Waveform'
export { VersionList, type VersionListProps } from './VersionList'
