// The styled kit (U25, R32): primitives and composite views over the U24
// hooks, themed through `--lm-*` CSS variables. Import
// `@kieranklaassen/live-mix/react/styles.css` for the defaults, or set the
// tokens yourself (`themeStyle`, `jaxaZenLight`, `jaxaZenDark`, and the grid
// themes `graphite`, `paper`, `water`, `dusk`, `night`, `sand`, `groovebox`,
// `chalk`, `mist`).

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
  hasTwoPlaces,
  heldPeak,
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
  type HeldPeak,
  type KnownControlUnit,
} from './control-math'
export {
  ambientWater,
  BRUSH_COUNT,
  chalk,
  cx,
  dusk,
  graphite,
  groovebox,
  jaxaZenDark,
  jaxaZenLight,
  LM_TOKENS,
  mist,
  night,
  paper,
  sand,
  themes,
  themeStyle,
  tokenRef,
  tokenVar,
  water,
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
export { Knob, knobModulation, type KnobCap, type KnobModulation, type KnobProps } from './Knob'
export { Fader, type FaderLook, type FaderOrientation, type FaderProps } from './Fader'
export {
  DEVICE_POWER_INFO,
  DeviceToggle,
  ToggleButton,
  type DeviceToggleProps,
  type ToggleButtonProps,
  type ToggleTone,
} from './Toggle'
export {
  Meter,
  meterInfo,
  type MeterBarKind,
  type MeterLook,
  type MeterOrientation,
  type MeterProps,
} from './Meter'
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
export { ChannelRowView, type ChannelRowViewProps } from './ChannelRowView'
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
export { DevicePlate, plateLayout, type DevicePlateProps, type PlateLayout } from './DevicePlate'
export { DisplayRunner, PlateDisplayLayer, type PlateDisplayLayerProps } from './PlateDisplay'
export {
  DISPLAY_STRIP_HEIGHT,
  DISPLAY_STRIP_WIDTH,
  DISPLAY_WINDOW_HEIGHT,
  displayWindowWidth,
  onDisplayFrame,
  plateDisplay,
  runningDisplays,
  type DisplayColours,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayLevel,
  type DisplayPlace,
  type DisplaySignal,
  type DisplayView,
  type PlateDisplay,
  type PlateFace,
} from './plate-display'
export * as displayKit from './display-kit'
export { PLATE_FACES } from './displays'
export {
  DEVICE_SKINS,
  deviceSkin,
  hostedSkin,
  isDarkPlate,
  PLATE_FINISHES,
  PLATE_PICTURE_HEIGHT,
  PLATE_PICTURE_WIDTH,
  PlateFinishLayer,
  QUIET_SKIN,
  type DeviceSkin,
  type PlateFinish,
  type PlatePicture,
} from './device-skins'
export { HOSTED_PLATES, PLATE_PALETTES, type PlatePalette } from './plate-palettes'
export {
  chainDropIndex,
  dropIndex,
  dropMarkerPosition,
  landingIndex,
  markerPosition,
  useChainReorder,
  type ChainReorder,
  type ItemSpan,
} from './chain-reorder'
export {
  DeviceChainView,
  freshDeviceId,
  groupDevices,
  isInsertDevice,
  reorderInserts,
  resolveInsertHost,
  useInserts,
  type DeviceChainViewProps,
  type InsertHost,
} from './DeviceChainView'

export {
  rulerTicks,
  TimelineView,
  type TimelineLane,
  type TimelineLaneInput,
  type TimelineViewProps,
} from './TimelineView'
export { clipPeaks, Waveform, waveformPath, type WaveformProps } from './Waveform'
export {
  automationPositions,
  capInset,
  fadeEase,
  fadeGainAt,
  fadePaths,
  hitPositions,
  levelsBarsPath,
  levelsOutlinePath,
  repeatSeams,
  STROKE_COLUMN_PX,
  STROKE_INSET_PX,
  strokeLevels,
  strokeWavePaths,
  type FadePaths,
  type StrokeLevel,
  type StrokeLevelsOptions,
  type StrokeWavePaths,
} from './stroke-math'
export { SOUND_KIND_LABELS, SoundIcon, type SoundIconKind, type SoundIconProps } from './SoundIcon'
export { Stroke, type StrokeAutomation, type StrokeProps } from './Stroke'
export { PaintField, type PaintFieldProps } from './PaintField'
export { VersionList, type VersionListProps } from './VersionList'
export {
  controlGestureInfo,
  findInfo,
  INFO_TEXT_ATTR,
  INFO_TITLE_ATTR,
  infoName,
  infoParagraphs,
  infoProps,
  infoText,
  isInfoControl,
  resolveInfo,
  sameInfo,
  type ControlGestureOptions,
  type FoundInfo,
  type InfoEntry,
  type InfoProps,
} from './info'
export { INFO_IDLE, InfoView, useInfo, type InfoViewProps, type UseInfoOptions } from './InfoView'
export { paramInfo } from './param-info'
export { STRIP_INFO, TRANSPORT_INFO } from './mixer-info'
