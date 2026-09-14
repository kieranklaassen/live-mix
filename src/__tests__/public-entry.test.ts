// The public surface of `@kieranklaassen/live-mix`: every symbol a consumer
// (ambient-live, Breathwork Live's SectionPlaylist) imports from the root
// entry must be present. A named export list in src/index.ts can silently drop
// a symbol; this pins the ones the adopters rely on.

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

import * as core from '../index'
import * as dsp from '../dsp/index'
import * as testing from '../testing/index'
import * as wam from '../wam/index'

const coreSymbols = [
  'createEngine',
  'Engine',
  'Bus',
  'MasterBus',
  'OutputRouter',
  'isIOSWebKit',
  'Meter',
  'Transport',
  'Scheduler',
  'SampleStore',
  'AudioTrack',
  'LiveInputTrack',
  'ReturnTrack',
  'InstrumentTrack',
  'SendList',
  'Ducker',
  'createDucker',
  'ConvolverReverb',
  'createConvolverReverb',
  'generateHallImpulse',
  'CONVOLVER_REVERB_PARAMS',
  'CONVOLVER_REVERB_DESCRIPTOR',
  'REVERB_DECAY_SECONDS',
  'REVERB_WET_LEVEL',
  'CROSSFADE_SECONDS',
  'STEER_CROSSFADE_SECONDS',
  'STOP_FADE_SECONDS',
  'MAX_CLIP_GAIN_DB',
  'DUCK_DEPTH',
  'DUCK_TIME_CONSTANT',
  'ENV_ATTACK_MS',
  'ENV_RELEASE_MS',
  'ENV_POLL_MS',
  'ENV_GAIN_SCALE',
  'fadeGain',
  'computePeaks',
  'slicePeaks',
  'clipsInWindow',
  'equalPowerFadeIn',
  'equalPowerFadeOut',
  'devices',
  'DeviceRegistry',
  'clampParam',
  'ChannelStrip',
  'SoloInPlace',
  'GroupTrack',
  'resolveInput',
  'WorkletDucker',
  'DuckerKernel',
  'DUCKER_PARAMS',
  'DUCKER_PROCESSOR_NAME',
  'LufsMeter',
  'LoudnessAnalyzer',
  'MasterLimiter',
  'EngineStats',
  'METER_PROCESSOR_NAME',
  'Emitter',
  'isObservableDevice',
  'Rack',
  'Chain',
  'createRack',
  'RACK_DESCRIPTOR',
  'RACK_PARAMS',
  'RackMacro',
  'macroMappedValue',
  'macroCurve',
  'captureRackPreset',
  'createRackFromPreset',
  'serializeRackPreset',
  'parseRackPreset',
  'AlignmentDelay',
  'deviceLatencySamples',
  'buildLatencyReport',
  'PDC_MAX_DELAY_SECONDS',
  'rampParamTo',
  // Score (U28)
  'SCORE_FORMAT_VERSION',
  'createScore',
  'parseScore',
  'serializeScore',
  'validateScore',
  'OPERATION_TYPES',
  'apply',
  'invert',
  'applyWithInverse',
  'coalesceKey',
  'OperationLog',
  'History',
  'ScoreDocument',
  'ScoreRenderer',
  'loadScore',
  // U36 control surface
  'ControlSurface',
  'MidiInput',
  'OscInput',
  'MidiDecoder',
  'parseMidiMessage',
  'decodeOscPacket',
  'encodeOscMessage',
  'matchOscAddress',
  'createMapping',
  'mapTarget',
  'resolveControlEvent',
  'learnFromEvent',
  'serializeMappingTable',
  'parseMappingTable',
  'ambientLiveMidiMapMigration',
  'loadMappingTable',
  'saveMappingTable',
  'controlTargetKey',
  'sourceKey',
  'describeSource',
  'normalizeParam',
  'denormalizeParam',
  'MAPPING_TABLE_FORMAT',
  // Session grid (U31)
  'Session',
  'quantizeLaunch',
  'followTimeSeconds',
  'drawFollowAction',
  'resolveFollowAction',
  'defaultSlot',
  'slotAt',
  'findSlot',
  'findScene',
  'trackSlots',
  'sceneSlots',
  'LAUNCH_MODES',
  'FOLLOW_ACTION_KINDS',
  'DEFAULT_LAUNCH_QUANTIZE',
] as const

const dspSymbols = [
  'WasmDevice',
  'defineWasmDevice',
  'createDattorroReverb',
  'createFdnReverb',
  'createStereoWidener',
  'createZitaReverb',
  'createLimiter1176',
  'registerStockWasmDevices',
  'DATTORRO_PARAMS',
  'WASM_DEVICE_PROCESSOR_NAME',
  'loadDuckerProcessor',
  'createWorkletDucker',
  'duckerProcessorUrl',
  'ensureProcessor',
  'WorkletDucker',
  'createTruePeakLimiter',
  'TRUE_PEAK_LIMITER_PARAMS',
  'truePeakLimiterLatencySamples',
  'createSpectralDrifter',
  'SPECTRAL_DRIFTER_PARAMS',
  'SPECTRAL_DRIFTER_DESCRIPTOR',
  'createEtherReverb',
  'ETHER_REVERB_PARAMS',
  'ETHER_REVERB_DESCRIPTOR',
  'createFeltPiano',
  'FELT_PIANO_PARAMS',
  'FELT_PIANO_DESCRIPTOR',
] as const

const testingSymbols = [
  'MockAudioContext',
  'createMockContext',
  'advance',
  'configureMocks',
] as const

const wamSymbols = [
  'WamDevice',
  'ensureWamHost',
  'initializeWamHost',
  'describeWamDevice',
  'wamDeviceDescriptor',
  'registerWamDevice',
  'wamDeviceParam',
  'wamParamSpecs',
  'loadWamModule',
  'WAM_DEVICE_RAMP_SECONDS',
] as const

describe('public entries', () => {
  it.each(coreSymbols)('`.` exports %s', (name) => {
    expect((core as Record<string, unknown>)[name]).toBeDefined()
  })
  it.each(dspSymbols)('`./dsp` exports %s', (name) => {
    expect((dsp as Record<string, unknown>)[name]).toBeDefined()
  })
  it.each(testingSymbols)('`./testing` exports %s', (name) => {
    expect((testing as Record<string, unknown>)[name]).toBeDefined()
  })
  it.each(wamSymbols)('`./wam` exports %s', (name) => {
    expect((wam as Record<string, unknown>)[name]).toBeDefined()
  })
})

describe('version', () => {
  it('LIVE_MIX_VERSION matches package.json', async () => {
    const pkg = JSON.parse(
      await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { version: string }
    expect(core.LIVE_MIX_VERSION).toBe(pkg.version)
  })
})
