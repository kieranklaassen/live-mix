// Every value the factory writes down, read against the device it is written
// for: the bank's presets, chains and sounds and every pack's, some eight
// thousand patches, and the devices' own presets. The tests beside this one
// hold each list to `validatePatch` (a device that exists, a knob it has, a
// value in its range) and render a share of it. This one walks all of it
// without rendering anything and holds it to what those leave open: a switch
// or a list of choices set to one of its choices and not between two, a
// counted knob set on a step, a sound named once in whichever key it is
// played, a phrase written in numbers that can be played, and every patch
// made on a context, as a host makes it, with each knob where it was written.
//
// Nothing here says what a patch sounds like, and nothing found here is
// mended in the data: a shipped name never changes what it loads. What the
// walk found when it was written is listed in `AS_SHIPPED`, with what the
// device makes of it.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeAll, describe, expect, it } from 'vitest'

import { type Device } from '../../../core/devices/Device'
import {
  createPatchDevice,
  patchDeviceParams,
  patchDevices,
  type Patch,
  type PatchDevice,
} from '../../../core/devices/patch'
import { type PresetTable } from '../../../core/devices/presets'
import { createRackFromPreset, type RackPreset } from '../../../core/devices/Rack'
import { DeviceRegistry, type DeviceDescriptor } from '../../../core/devices/registry'
import { type ParamSpec } from '../../../core/params'
import { asAudioContext, createMockContext, type MockAudioContext } from '../../../testing'
import { isWasmDescriptor } from '../../descriptor'
import { STOCK_WASM_DEVICES } from '../../registry'
import { type WorkletNodeFactory } from '../../WasmDevice'
import {
  CHAIN_PREVIEW_PATCH,
  FACTORY_CHAINS,
  FACTORY_PHRASES,
  FACTORY_PRESETS,
  FACTORY_SOUNDS,
  factoryPreset,
  factorySound,
  transposeFactorySound,
} from '..'
import { PACK_CHAINS } from '../chain-packs/all'
import { PACK_PRESETS } from '../packs/all'
import { PACK_SOUNDS } from '../sound-packs/all'
import { type FactorySound } from '../types'

const registry = new DeviceRegistry(STOCK_WASM_DEVICES)
const wasmDir = join(dirname(fileURLToPath(import.meta.url)), '../../wasm')

/** Every device's committed module, compiled once for the tests that need one. */
const modules = new Map<string, WebAssembly.Module>()
beforeAll(async () => {
  for (const descriptor of STOCK_WASM_DEVICES) {
    if (!isWasmDescriptor(descriptor)) continue
    const bytes = await readFile(join(wasmDir, `${descriptor.id}.wasm`))
    modules.set(descriptor.id, await WebAssembly.compile(bytes))
  }
}, 120_000)
const SOUNDS: readonly FactorySound[] = [...FACTORY_SOUNDS, ...PACK_SOUNDS]

/** A sound's patch written out: its own, or the preset of the bank it names. */
const patchOf = (sound: FactorySound): Patch | undefined =>
  typeof sound.patch === 'string' ? factoryPreset(sound.patch) : sound.patch

/** Every patch of the factory with where it is from, a sound's own patch included. */
const PATCHES: readonly (readonly [at: string, patch: Patch])[] = [
  ...FACTORY_PRESETS.map((preset) => [`preset ${preset.id}`, preset] as const),
  ...PACK_PRESETS.map((preset) => [`preset ${preset.id}`, preset] as const),
  ...FACTORY_CHAINS.map((chain) => [`chain ${chain.id}`, chain] as const),
  ...PACK_CHAINS.map((chain) => [`chain ${chain.id}`, chain] as const),
  ...SOUNDS.flatMap((sound) =>
    typeof sound.patch === 'string' ? [] : [[`sound ${sound.id}`, sound.patch] as const],
  ),
  ['the chain preview input', CHAIN_PREVIEW_PATCH],
]

/**
 * What shipped off a choice or a step and stays as it shipped, with what the
 * device makes of it. A line here is a line for whoever hears the bank next,
 * not a rule: nothing new is added to it.
 */
const AS_SHIPPED: ReadonlySet<string> = new Set([
  // Push is a switch (Off, On) and the device reads a half as On
  // (`param(kPush) >= 0.5f`, cpp/devices/analog-drive/analog_drive.h): the
  // sound is rendered with Push on, which its preset "Iron lows" leaves off.
  'sound static-cathedral-iron-brass-pad-c effects[0] analog-drive: push 0.5 is between two choices',
])

/** Where a value is not one its knob can be set to: undefined when it is. */
function valueProblem(spec: ParamSpec, value: number): string | undefined {
  if (!Number.isFinite(value)) return 'is not a number'
  if (value < spec.min || value > spec.max) return `is outside ${spec.min} to ${spec.max}`
  if (spec.choices && !Number.isInteger(value)) return 'is between two choices'
  if (spec.step) {
    const steps = (value - spec.min) / spec.step
    if (Math.abs(steps - Math.round(steps)) > 1e-6) return `is between two steps of ${spec.step}`
  }
  return undefined
}

/** What a table of values gets wrong for a device: a knob it lacks, a value the knob cannot take. */
function tableProblems(
  descriptor: DeviceDescriptor,
  values: Readonly<Record<string, number | undefined>>,
): string[] {
  const problems: string[] = []
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) continue
    // Its own parameters only: `constructor` is on every object.
    const spec = Object.hasOwn(descriptor.params, name) ? descriptor.params[name] : undefined
    const problem = spec ? valueProblem(spec, value) : 'is not a knob of the device'
    if (problem) problems.push(`${name} ${value} ${problem}`)
  }
  return problems
}

/** What one device of a patch gets wrong, each line with its place. */
function deviceProblems(at: string, device: PatchDevice): string[] {
  const descriptor = registry.get(device.deviceId)
  if (!descriptor) return [`${at} ${device.deviceId}: no such device`]
  const problems: string[] = []
  // A patch that is written today names a device by its id of today.
  if (descriptor.id !== device.deviceId) problems.push(`is ${descriptor.id} under a former id`)
  problems.push(...tableProblems(descriptor, device.params ?? {}))
  return problems.map((problem) => `${at} ${device.deviceId}: ${problem}`)
}

/** Where each device of a patch sits, as `validatePatch` names the places. */
function placed(patch: Patch): (readonly [place: string, device: PatchDevice])[] {
  return [
    ...(patch.instrument ? [['instrument', patch.instrument] as const] : []),
    ...patch.effects.map((device, index) => [`effects[${index}]`, device] as const),
  ]
}

describe('every value of the factory', () => {
  it('walks the whole of it', () => {
    // If a list is not read, nothing below says anything about it.
    expect(FACTORY_PRESETS.length).toBeGreaterThanOrEqual(680)
    expect(PACK_PRESETS.length).toBeGreaterThanOrEqual(2500)
    expect(FACTORY_CHAINS.length).toBeGreaterThanOrEqual(218)
    expect(PACK_CHAINS.length).toBeGreaterThanOrEqual(2500)
    expect(FACTORY_SOUNDS.length).toBeGreaterThanOrEqual(100)
    expect(PACK_SOUNDS.length).toBeGreaterThanOrEqual(2500)
  })

  it('gives every knob a default and every preset of a device values the knob can take', () => {
    const problems: string[] = []
    for (const descriptor of STOCK_WASM_DEVICES) {
      for (const [name, spec] of Object.entries(descriptor.params)) {
        const at = `${descriptor.id} ${name}`
        if (!(spec.min < spec.max)) problems.push(`${at}: its range is ${spec.min} to ${spec.max}`)
        if (spec.choices && spec.choices.length !== spec.max - spec.min + 1) {
          problems.push(
            `${at}: ${spec.choices.length} labels for ${spec.min} to ${spec.max}, one for each whole number`,
          )
        }
        const problem = valueProblem(spec, spec.default)
        if (problem) problems.push(`${at}: its default ${spec.default} ${problem}`)
      }
      // The instruments' presets as well: the effects' are read in ../../__tests__/effect-presets.test.ts.
      const tables: PresetTable = { ...descriptor.retiredPresets, ...descriptor.presets }
      for (const [name, values] of Object.entries(tables)) {
        for (const problem of tableProblems(descriptor, values)) {
          problems.push(`${descriptor.id} "${name}": ${problem}`)
        }
      }
    }
    expect(problems).toEqual([])
  })

  it('sets every knob of every patch to a value the knob can take', () => {
    const problems = PATCHES.flatMap(([at, patch]) =>
      placed(patch).flatMap(([place, device]) => deviceProblems(`${at} ${place}`, device)),
    )
    expect(problems.filter((problem) => !AS_SHIPPED.has(problem))).toEqual([])
    // A line of the list that is no longer true is taken off it.
    expect([...AS_SHIPPED].filter((line) => !problems.includes(line))).toEqual([])
  })

  it('auditions every preset with a phrase there is', () => {
    const problems = [...FACTORY_PRESETS, ...PACK_PRESETS]
      .filter(
        (preset) => preset.preview !== undefined && !Object.hasOwn(FACTORY_PHRASES, preset.preview),
      )
      .map((preset) => `${preset.id}: no phrase "${preset.preview}"`)
    expect(problems).toEqual([])
  })
})

describe('every sound of the factory', () => {
  it('has one name in whichever key it is played', () => {
    // "Low drone {D}" and "Low drone {E}" are two names in C and in every
    // other key; a name written without its braces would meet another one
    // only somewhere on the way round.
    const problems: string[] = []
    for (let semitones = 0; semitones < 12; semitones += 1) {
      const seen = new Map<string, string>()
      for (const sound of SOUNDS) {
        const { name } = transposeFactorySound(sound, semitones)
        const first = seen.get(name.toLowerCase())
        if (first) problems.push(`${semitones} up, "${name}" is ${first} and ${sound.id}`)
        else seen.set(name.toLowerCase(), sound.id)
      }
    }
    expect(problems).toEqual([])
  })

  it('is written in numbers that can be played', () => {
    const problems: string[] = []
    for (const sound of SOUNDS) {
      const lengths = {
        durationSec: sound.durationSec,
        skipSec: sound.skipSec ?? 0,
        loopCrossfadeSec: sound.loopCrossfadeSec ?? 0,
        fadeOutSec: sound.fadeOutSec ?? 0,
      }
      for (const [name, seconds] of Object.entries(lengths)) {
        if (!Number.isFinite(seconds) || seconds < 0) {
          problems.push(`${sound.id}: ${name} ${seconds}`)
        }
      }
      if (!(sound.durationSec > 0)) problems.push(`${sound.id}: it lasts no time`)
      if (lengths.loopCrossfadeSec > sound.durationSec || lengths.fadeOutSec > sound.durationSec) {
        problems.push(`${sound.id}: a fade longer than the sound`)
      }
      if (sound.loopFold !== undefined && !sound.loopCrossfadeSec) {
        problems.push(`${sound.id}: a fold with nothing folded`)
      }
      for (const note of sound.phrase.notes) {
        const playable =
          Number.isFinite(note.atSec) &&
          note.atSec >= 0 &&
          Number.isFinite(note.durSec) &&
          note.durSec > 0 &&
          Number.isFinite(note.note) &&
          (note.gain === undefined || (Number.isFinite(note.gain) && note.gain > 0))
        if (!playable) problems.push(`${sound.id}: a note ${JSON.stringify(note)}`)
      }
    }
    expect(problems).toEqual([])
  })

  it('plays a patch there is, and a source only where the instrument takes one', () => {
    // An instrument that plays a sample says so by what its module exports.
    const takesSample = [...modules]
      .filter(([, module]) =>
        WebAssembly.Module.exports(module).some((entry) => entry.name === 'device_sample_capacity'),
      )
      .map(([id]) => id)
    expect(takesSample.sort()).toEqual(['grain-synth', 'sampler'])

    const problems: string[] = []
    for (const sound of SOUNDS) {
      const patch = patchOf(sound)
      if (!patch?.instrument) {
        const named = typeof sound.patch === 'string' ? sound.patch : sound.patch.id
        problems.push(`${sound.id}: no preset "${named}", or one without an instrument`)
        continue
      }
      // Without a source a sample instrument plays the sound it is built with: that is a sound too.
      if (sound.source === undefined) continue
      const source = factorySound(sound.source)
      if (!source)
        problems.push(`${sound.id}: its source "${sound.source}" is no sound of the bank`)
      else if (source.source !== undefined) {
        problems.push(`${sound.id}: its source "${sound.source}" is made from another sound`)
      }
      if (!takesSample.includes(registry.resolveId(patch.instrument.deviceId))) {
        problems.push(
          `${sound.id}: "${sound.source}" is rendered for ${patch.instrument.deviceId}, which plays no sample`,
        )
      }
    }
    expect(problems).toEqual([])
  })
})

describe('every patch of the factory, made on a context', () => {
  const mockNode: WorkletNodeFactory = (context, name, options) =>
    (context as unknown as MockAudioContext).createWorkletNode(
      name,
      options,
    ) as unknown as AudioWorkletNode
  /** What a device is made with here: its committed module, on a worklet node that only records. */
  const standIns = (deviceId: string) => ({
    wasm: modules.get(registry.resolveId(deviceId)),
    processorUrl: 'p',
    createNode: mockNode,
  })

  /** Where a device that was made is not what was written: a knob moved on the way in, a bypass lost. */
  function madeProblems(at: string, written: PatchDevice, made: Device): string[] {
    const descriptor = registry.get(written.deviceId)
    if (!descriptor) return [`${at}: no such device`]
    const problems: string[] = []
    if (made.id !== descriptor.id) problems.push(`${at}: made as ${made.id}`)
    for (const [name, value] of Object.entries(patchDeviceParams(descriptor, written))) {
      if (made.getParam(name) !== value) {
        problems.push(`${at}: ${name} is ${made.getParam(name)} for the ${value} of its preset`)
      }
    }
    for (const [name, value] of Object.entries(written.params ?? {})) {
      if (made.getParam(name) !== value) {
        problems.push(`${at}: ${name} is ${made.getParam(name)}, written ${value}`)
      }
    }
    if (made.bypass !== (written.bypass === true)) problems.push(`${at}: bypass`)
    return problems
  }

  // Every device of every patch on a stand-in node: a second on a quiet
  // machine, and a runner that renders the packs beside it is not one.
  it('makes every device with each knob where the patch wrote it', async () => {
    const problems: string[] = []
    let made = 0
    for (const [at, patch] of PATCHES) {
      const context = asAudioContext(createMockContext())
      for (const [place, written] of placed(patch)) {
        try {
          const device = await createPatchDevice(
            registry,
            context,
            written,
            standIns(written.deviceId),
          )
          problems.push(...madeProblems(`${at} ${place}`, written, device))
          device.dispose()
          made += 1
        } catch (failure) {
          problems.push(`${at} ${place}: ${String(failure)}`)
        }
      }
    }
    expect(problems).toEqual([])
    expect(made).toBe(PATCHES.reduce((sum, [, patch]) => sum + patchDevices(patch).length, 0))
  }, 300_000)

  it('builds every chain again as a rack, in order, from what its devices were set to', async () => {
    const problems: string[] = []
    for (const chain of [...FACTORY_CHAINS, ...PACK_CHAINS]) {
      const devices = chain.effects.map((written) => {
        const descriptor = registry.describe(written.deviceId)
        return {
          preset: {
            name: written.preset ?? '',
            deviceId: written.deviceId,
            deviceVersion: descriptor.version,
            params: patchDeviceParams(descriptor, written),
          },
          bypass: written.bypass === true,
        }
      })
      const preset: RackPreset = {
        name: chain.name,
        mix: 1,
        macros: [{ name: 'Macro 1', value: 0, mappings: [] }],
        chains: [{ name: chain.name, gain: 1, pan: 0, mute: false, devices }],
      }
      try {
        const rack = await createRackFromPreset(asAudioContext(createMockContext()), preset, {
          registry,
          deviceOptions: standIns,
        })
        const made = rack.devices
        if (made.length !== devices.length) {
          problems.push(`${chain.id}: ${made.length} devices of ${devices.length}`)
        }
        made.forEach((device, index) => {
          for (const [name, value] of Object.entries(devices[index].preset.params)) {
            if (device.getParam(name) !== value) {
              problems.push(`${chain.id} effects[${index}]: ${name} is ${device.getParam(name)}`)
            }
          }
        })
        rack.dispose()
      } catch (failure) {
        problems.push(`${chain.id}: ${String(failure)}`)
      }
    }
    expect(problems).toEqual([])
  }, 300_000)
})
