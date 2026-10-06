/**
 * `@kieranklaassen/live-mix/dsp` — WASM device hosting.
 *
 * Nothing here touches `AudioContext`, `window` or `import.meta.url` at import
 * time, so the entry is safe to import under SSR; asset URLs resolve lazily
 * inside the factories.
 *
 * @module live-mix/dsp
 */

export {
  BYPASS_RAMP_SECONDS,
  WASM_DEVICE_PROCESSOR_NAME,
  type DeviceExports,
  type DeviceHostMessage,
  type DeviceMessage,
  type WasmDeviceProcessorOptions,
} from './abi'
export {
  clearWasmModuleCache,
  compileWasm,
  defaultProcessorUrl,
  resolveProcessorUrl,
  type AssetOverrides,
  type WasmSource,
} from './assets'
export {
  WasmDevice,
  defineWasmDevice,
  ensureProcessor,
  type WasmDeviceDefinition,
  type WasmDeviceOptions,
  type WorkletNodeFactory,
} from './WasmDevice'
export { isNoteDevice, type Device, type NoteDevice } from '../core/devices/Device'
export { clampParam, type ParamSpec, type ParamTaper } from '../core/params'
export {
  PLATE_REVERB_DEVICE,
  PLATE_REVERB_PARAMS,
  createPlateReverb,
  type PlateReverbParamName,
  type PlateReverb,
} from './devices/plate-reverb'
export {
  FDN_REVERB_DEVICE,
  FDN_REVERB_PARAMS,
  createFdnReverb,
  fdnReverbBreathLaw,
  type FdnReverb,
  type FdnReverbParamName,
} from './devices/fdn-reverb'
export {
  STEREO_WIDENER_DEVICE,
  STEREO_WIDENER_PARAMS,
  createStereoWidener,
  type StereoWidener,
  type StereoWidenerParamName,
} from './devices/stereo-widener'
export {
  HALL_REVERB_DEVICE,
  HALL_REVERB_PARAMS,
  createHallReverb,
  type HallReverb,
  type HallReverbParamName,
} from './devices/hall-reverb'
export {
  FET_LIMITER_DEVICE,
  FET_LIMITER_PARAMS,
  createFetLimiter,
  type FetLimiter,
  type FetLimiterParamName,
} from './devices/fet-limiter'
export {
  PLATE_REVERB_DESCRIPTOR,
  ETHER_REVERB_DESCRIPTOR,
  FDN_REVERB_DESCRIPTOR,
  FELT_PIANO_DESCRIPTOR,
  FET_LIMITER_DESCRIPTOR,
  SAMPLE_DEVICE_IDS,
  WORKLET_DUCKER_DESCRIPTOR,
  SPECTRAL_DRIFTER_DESCRIPTOR,
  STEREO_WIDENER_DESCRIPTOR,
  STOCK_WASM_DEVICES,
  HALL_REVERB_DESCRIPTOR,
  describeStockWasmDevice,
  registerStockWasmDevices,
  wasmDeviceDescriptor,
  type WasmDeviceMeta,
} from './registry'
export { isWasmDescriptor, type WasmDeviceDescriptor } from './descriptor'
export {
  limitRendered,
  type LimitRenderedOptions,
  type LimitRenderedParams,
  type LimitedRender,
} from './limit-rendered'
export {
  DEFAULT_PHRASE_GAIN,
  canRenderPatch,
  foldLoop,
  noteFrequency,
  peakOf,
  renderPatch,
  type LoopFold,
  type Phrase,
  type PhraseNote,
  type RenderPatchOptions,
} from './patch-render'
export {
  CHAIN_PREVIEW_INPUT_SECONDS,
  CHAIN_PREVIEW_PATCH,
  CHAIN_PREVIEW_PHRASE,
  CHORD_COLOURS,
  FACTORY_CHAINS,
  FACTORY_CHAIN_CATEGORIES,
  FACTORY_CHAIN_PACK_SIZE,
  FACTORY_HOME_KEY,
  FACTORY_MODES,
  FACTORY_PACKS,
  FACTORY_PACK_SIZE,
  FACTORY_PEAK_DB,
  FACTORY_PHRASES,
  FACTORY_PRESETS,
  FACTORY_PRESET_CATEGORIES,
  FACTORY_SOUNDS,
  FACTORY_SOUND_PACK_SIZE,
  GENERATED_KINDS,
  PITCH_CLASS_NAMES,
  PREVIEW_SECONDS,
  VARIATION_KINDS,
  VARIATION_LIMITS,
  chordName,
  chordTakes,
  chordTones,
  describeVariant,
  factoryChain,
  factoryPack,
  factoryPreset,
  factorySound,
  factoryTranspose,
  generateSound,
  keyChord,
  loadFactoryPackChains,
  loadFactoryPackSounds,
  loadFactoryPacks,
  pitchClassName,
  previewPhrase,
  relativeMajorRoot,
  renderChainPreview,
  renderFactorySound,
  renderGeneratedSound,
  renderPresetPreview,
  transposeFactorySound,
  transposePatch,
  transposePhrase,
  transposeWords,
  variationAmounts,
  varySound,
  type ChainPreviewOptions,
  type ChordColour,
  type FactoryChain,
  type FactoryChainCategory,
  type FactoryKey,
  type FactoryMode,
  type FactoryPack,
  type FactoryPhraseName,
  type FactoryPreset,
  type FactoryPresetCategory,
  type FactoryRenderOptions,
  type FactorySound,
  type FactorySoundRenderOptions,
  type GenerateSoundOptions,
  type GeneratedKind,
  type GeneratedSound,
  type KeyChord,
  type SoundVariation,
  type VariantChanges,
  type VariationKind,
  type VariedPlaying,
} from './factory'
export {
  capturePatch,
  createPatchDevice,
  createPatchEffects,
  isInstrumentPatch,
  patchDeviceParams,
  patchDevices,
  replaceInserts,
  validatePatch,
  type Patch,
  type PatchCategory,
  type PatchDevice,
  type PatchIssue,
} from '../core/devices'
export { type PlanarAudio } from '../core/render/encode'
export {
  DeviceRegistry,
  devices,
  type DeviceCategory,
  type DeviceCreateOptions,
  type DeviceCreateRequest,
  type DeviceDescriptor,
  type DeviceFactory,
  type DeviceKind,
  type Preset,
  type PresetTable,
} from '../core/devices'
export {
  createWorkletDucker,
  duckerProcessorUrl,
  loadDuckerProcessor,
  type DuckerProcessorOverrides,
} from './devices/ducker'
export {
  DUCKER_PARAMS,
  DUCKER_PROCESSOR_NAME,
  type DuckerParamName,
} from '../core/devices/native/ducker-abi'
export {
  WorkletDucker,
  type DuckerNodeFactory,
  type WorkletDuckerOptions,
} from '../core/devices/native/WorkletDucker'
export {
  TRUE_PEAK_LIMITER_DEVICE,
  TRUE_PEAK_LIMITER_LATENCY_SECONDS,
  TRUE_PEAK_LIMITER_LOOKAHEAD_FRAMES,
  TRUE_PEAK_LIMITER_LOOKAHEAD_SECONDS,
  TRUE_PEAK_LIMITER_PARAMS,
  createTruePeakLimiter,
  truePeakLimiterLatencySamples,
  type TruePeakLimiter,
  type TruePeakLimiterParamName,
} from './devices/true-peak-limiter'
export {
  SPECTRAL_DRIFTER_AGE_MODES,
  SPECTRAL_DRIFTER_DEVICE,
  SPECTRAL_DRIFTER_DIRECTIONS,
  SPECTRAL_DRIFTER_INTERVALS,
  SPECTRAL_DRIFTER_PARAMS,
  SPECTRAL_DRIFTER_SEASONS,
  SPECTRAL_DRIFTER_SEEDS,
  createSpectralDrifter,
  spectralDrifterIntensity,
  type SpectralDrifter,
  type SpectralDrifterParamName,
} from './devices/spectral-drifter'
export {
  ETHER_REVERB_DEVICE,
  ETHER_REVERB_PARAMS,
  createEtherReverb,
  etherReverbLaw,
  type EtherReverb,
  type EtherReverbParamName,
} from './devices/ether-reverb'
export {
  FELT_PIANO_DEVICE,
  FELT_PIANO_KEY_RANGE,
  FELT_PIANO_PARAMS,
  createFeltPiano,
  feltPianoKeyFor,
  type FeltPiano,
  type FeltPianoParamName,
} from './devices/felt-piano'

// The spec devices: one generated module per cpp/devices/<id>/device.json.
export * from './devices/index.gen'
export {
  ZONE_FIELD_COUNT,
  compactZone,
  encodeZoneFields,
  normalizeZoneMap,
  parseDspreset,
  parseSfz,
  planZoneLoad,
  prepareZoneLoad,
  writeDspreset,
  writeSfz,
  type DspresetReadOptions,
  type DspresetWriteOptions,
  type ParsedInstrument,
  type PreparedZoneLoad,
  type ResolvedZone,
  type ResolvedZoneMap,
  type SfzReadOptions,
  type SfzWriteOptions,
  type UnsupportedFeature,
  type WrittenInstrument,
  type Zone,
  type ZoneCapacity,
  type ZoneLoop,
  type ZoneMap,
  type ZoneOverBudget,
  type ZonePlan,
  type ZonePlanOptions,
  type ZoneRoundRobin,
  type ZoneSample,
  type ZoneSampleInfo,
  type ZoneThinning,
} from './zones'
