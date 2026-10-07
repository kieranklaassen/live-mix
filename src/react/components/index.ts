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
export { Knob, type KnobCap, type KnobProps } from './Knob'
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

// The video kit: what a timeline, a panel, a sheet and a note are drawn with.
export {
  clampPxPerSecond,
  DEFAULT_PX_PER_SECOND,
  fitPxPerSecond,
  MAX_PX_PER_SECOND,
  MIN_PX_PER_SECOND,
  pageScroll,
  rulerLabels,
  rulerScale,
  zoomAround,
  type RulerScale,
  type RulerTick,
  type TimelineZoom,
} from './timeline-math'
export { Playhead, TimeRuler, type PlayheadProps, type TimeRulerProps } from './TimeRuler'
export { brushIndex, Lane, LaneHead, type LaneHeadProps, type LaneProps } from './Lane'
export {
  CutNotch,
  CutSeam,
  LinkMark,
  RangeSelection,
  TRANSITION_MIN_PX,
  TransitionMark,
  type CutNotchProps,
  type CutSeamProps,
  type LinkMarkProps,
  type RangeSelectionProps,
  type TransitionMarkProps,
} from './timeline-marks'
export {
  VIDEO_FRAME_INSET_PX,
  VIDEO_FRAME_PX,
  VideoStroke,
  type VideoStrokeProps,
} from './VideoStroke'
export {
  envelopePath,
  TIMELINE_ITEM_HEIGHT,
  TimelineItem,
  type TimelineItemProps,
  type TimelineItemShape,
} from './TimelineItem'
export { Overview, type OverviewProps } from './Overview'
export { Glyph, GLYPHS, type GlyphKind, type GlyphProps } from './Glyph'
export { TextButton, type TextButtonProps, type TextButtonVariant } from './TextButton'
export {
  Check,
  Input,
  Segmented,
  Select,
  type CheckProps,
  type InputProps,
  type SegmentedOption,
  type SegmentedProps,
  type SelectOption,
  type SelectProps,
} from './fields'
export {
  Panel,
  PanelHead,
  PropRow,
  SectionLabel,
  Tabs,
  type PanelHeadProps,
  type PanelProps,
  type PropRowProps,
  type SectionLabelProps,
  type TabItem,
  type TabsProps,
} from './Panel'
export {
  Menu,
  MenuItem,
  MenuSeparator,
  type MenuEntry,
  type MenuItemProps,
  type MenuProps,
} from './Menu'
export { Sheet, type SheetProps } from './Sheet'
export { InlineNote, type InlineNoteProps } from './InlineNote'
export {
  Progress,
  StateMark,
  WHO_LABELS,
  WhoMark,
  type ProgressProps,
  type StateMarkProps,
  type StateMarkState,
  type Who,
  type WhoMarkProps,
} from './marks'
export {
  JobRow,
  LogRow,
  type JobRowProps,
  type JobRowState,
  type LogRowOutcome,
  type LogRowProps,
  type LogRowUndo,
} from './rows'
export {
  TranscriptWord,
  type TranscriptWordProps,
  type TranscriptWordState,
} from './TranscriptWord'
export {
  NoteBubble,
  NotePin,
  NoteSpan,
  NoteTab,
  PictureMark,
  type NoteBubbleProps,
  type NoteFrom,
  type NotePinProps,
  type NoteSpanProps,
  type NoteState,
  type NoteTabProps,
  type PictureMarkProps,
  type PicturePoint,
} from './notes'
export {
  ChangedMark,
  ContextChip,
  ReferenceChip,
  type ChangedMarkProps,
  type ContextChipProps,
  type ReferenceChipProps,
} from './chips'
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
