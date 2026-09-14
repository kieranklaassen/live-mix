// A rack (R10): parallel chains of devices summed back to one output, itself
// a Device so it goes anywhere a device does (a strip, a bus, another rack).
// Each chain is an ordered insert list with its own gain, pan and mute, and
// a delay stage that aligns it with the longest chain (R12) so parallel
// processing never smears. Macros (eight by default) are the rack's
// parameters: U19 `Macro` controls mapped onto inner device params with a
// range and a curve (`Macro.ts`), so lanes, LFOs and the agent API drive them
// through the same `Device` contract as any knob.
//
//   input ─┬─► chain₀.input → inserts… → delay → pan → fader → gate ─┐
//          ├─► chain₁ …                                              ├─► sum ─► wet ─┬─► output
//          └──────────────────────────── dry ──────────────────────────────────────┘
//
// While a rack has no chains its input feeds the sum directly, so an empty
// rack passes audio. `mix` is the rack's dry/wet (linear law, default wet);
// bypass crossfades to dry over the same 5 ms every other device uses.

import {
  deviceParamTarget,
  type DeviceParamTargetOptions,
  type ModTarget,
} from '../automation/ModMatrix'
import { clampParam, type ParamSpec } from '../params'
import { type Device } from './Device'
import {
  MACRO_CURVES,
  RackMacro,
  createMacroMapping,
  macroMappedValue,
  macroPositionFor,
  type MacroCurve,
  type MacroMapping,
  type MacroMappingOptions,
} from './Macro'
import { NODE_DEVICE_RAMP_SECONDS, rampParamTo } from './native/NodeDevice'
import { PDC_MAX_DELAY_SECONDS, chainLatencySamples, isAlignmentDelay } from './pdc'
import { type Preset, capturePreset, isPreset } from './presets'
import {
  type DeviceCreateOptions,
  type DeviceCreateRequest,
  type DeviceDescriptor,
  type DeviceRegistry,
} from './registry'

export const RACK_ID = 'rack'
/** Bumped when the rack's param table or preset shape changes incompatibly. */
export const RACK_VERSION = 1
export const DEFAULT_MACRO_COUNT = 8
export const MAX_MACRO_COUNT = 32

/** Param name of macro `index` (0-based): `macro1` … */
export function macroParamName(index: number): string {
  return `macro${index + 1}`
}

/** Inverse of `macroParamName`; null for any other name. */
export function macroIndexOf(name: string): number | null {
  const match = /^macro([1-9]\d*)$/.exec(name)
  return match ? Number(match[1]) - 1 : null
}

export const RACK_MIX_PARAM: ParamSpec = {
  id: 0,
  name: 'Mix',
  min: 0,
  max: 1,
  default: 1,
  taper: 'linear',
  unit: '',
}

/** The param table of a rack with `macroCount` macros: `macro1..N` (0..1) then `mix`. */
export function rackParams(macroCount: number): Record<string, ParamSpec> {
  if (!Number.isInteger(macroCount) || macroCount < 1 || macroCount > MAX_MACRO_COUNT) {
    throw new Error(`live-mix: a rack has 1..${MAX_MACRO_COUNT} macros, not ${macroCount}`)
  }
  const params: Record<string, ParamSpec> = {}
  for (let index = 0; index < macroCount; index += 1) {
    params[macroParamName(index)] = {
      id: index + 1,
      name: `Macro ${index + 1}`,
      min: 0,
      max: 1,
      default: 0,
      taper: 'linear',
      unit: '',
    }
  }
  params.mix = RACK_MIX_PARAM
  return params
}

export const RACK_PARAMS: Readonly<Record<string, ParamSpec>> = rackParams(DEFAULT_MACRO_COUNT)

/** A note or selector range, 0..127 inclusive. */
export interface ZoneRange {
  low: number
  high: number
}

export interface ChainOptions {
  name?: string
  /** Linear chain level. Default 1. */
  gain?: number
  /** −1 (left) … 1 (right). Default 0. */
  pan?: number
  mute?: boolean
  /** Reserved for instrument racks: the notes this chain plays. Stored and serialised, not yet applied. */
  keyZone?: ZoneRange
  /** Reserved: the chain-selector range that enables this chain. Stored and serialised, not yet applied. */
  selectorZone?: ZoneRange
}

export interface RemoveChainOptions {
  /** Dispose the chain's devices too. Default true — the chain owns them. */
  disposeDevices?: boolean
}

/**
 * One parallel path of a rack: input → inserts → alignment delay → pan →
 * fader → mute gate. Level, pan and mute changes are 5 ms ramps; the delay
 * is set by the rack whenever any chain's latency changes.
 */
export class Chain {
  readonly name: string
  readonly input: GainNode
  readonly delay: DelayNode
  readonly panner: StereoPannerNode
  readonly fader: GainNode
  readonly gate: GainNode
  keyZone: ZoneRange | null
  selectorZone: ZoneRange | null
  readonly maxCompensationSamples: number
  private readonly ctx: BaseAudioContext
  private readonly onLatencyChange: () => void
  private readonly insertList: Device[] = []
  private readonly nestedUnsubscribers = new Map<Device, () => void>()
  private gainValue: number
  private panValue: number
  private muted: boolean
  private compensation = 0
  private disposed = false

  constructor(ctx: BaseAudioContext, options: ChainOptions, onLatencyChange: () => void) {
    this.ctx = ctx
    this.name = options.name ?? 'Chain'
    this.onLatencyChange = onLatencyChange
    this.keyZone = options.keyZone ?? null
    this.selectorZone = options.selectorZone ?? null
    this.gainValue = Math.max(0, options.gain ?? 1)
    this.panValue = Math.min(1, Math.max(-1, options.pan ?? 0))
    this.muted = options.mute ?? false
    this.maxCompensationSamples = Math.floor(PDC_MAX_DELAY_SECONDS * ctx.sampleRate)

    this.input = ctx.createGain()
    this.delay = ctx.createDelay(PDC_MAX_DELAY_SECONDS)
    this.panner = ctx.createStereoPanner()
    this.fader = ctx.createGain()
    this.gate = ctx.createGain()
    this.delay.delayTime.value = 0
    if (this.gainValue !== 1) this.fader.gain.value = this.gainValue
    if (this.panValue !== 0) this.panner.pan.value = this.panValue
    if (this.muted) this.gate.gain.value = 0
    this.input.connect(this.delay)
    this.delay.connect(this.panner)
    this.panner.connect(this.fader)
    this.fader.connect(this.gate)
  }

  /** The gate: what feeds the rack's sum. */
  get output(): AudioNode {
    return this.gate
  }

  get inserts(): readonly Device[] {
    return this.insertList
  }

  /** The inserts a preset records: alignment stages are compensation, not devices. */
  get devices(): Device[] {
    return this.insertList.filter((device) => !isAlignmentDelay(device))
  }

  get gain(): number {
    return this.gainValue
  }

  setGain(value: number, rampSec = NODE_DEVICE_RAMP_SECONDS): void {
    this.gainValue = Math.max(0, Number.isFinite(value) ? value : 1)
    if (!this.disposed) rampParamTo(this.ctx, this.fader.gain, this.gainValue, rampSec)
  }

  get pan(): number {
    return this.panValue
  }

  setPan(value: number, rampSec = NODE_DEVICE_RAMP_SECONDS): void {
    this.panValue = Math.min(1, Math.max(-1, Number.isFinite(value) ? value : 0))
    if (!this.disposed) rampParamTo(this.ctx, this.panner.pan, this.panValue, rampSec)
  }

  get mute(): boolean {
    return this.muted
  }

  set mute(value: boolean) {
    this.setMute(value)
  }

  setMute(value: boolean, rampSec = NODE_DEVICE_RAMP_SECONDS): void {
    if (this.muted === value) return
    this.muted = value
    if (!this.disposed) rampParamTo(this.ctx, this.gate.gain, value ? 0 : 1, rampSec)
  }

  /** Latency of this chain's inserts, in samples at the context rate. */
  get latencySamples(): number {
    return chainLatencySamples(this.insertList, this.ctx.sampleRate)
  }

  /** Delay currently added to align this chain with the rack's longest one. */
  get compensationSamples(): number {
    return this.compensation
  }

  /** Append a device after the current inserts, ahead of the alignment delay. */
  addInsert(device: Device): void {
    this.assertLive()
    if (this.insertList.includes(device)) return
    const before = this.tail()
    before.disconnect(this.delay)
    before.connect(device.input)
    device.output.connect(this.delay)
    this.insertList.push(device)
    if (device instanceof Rack) {
      this.nestedUnsubscribers.set(device, device.onLatencyChange(this.onLatencyChange))
    }
    this.onLatencyChange()
  }

  /** Remove a device and reconnect around it (does not dispose it). */
  removeInsert(device: Device): void {
    this.assertLive()
    const index = this.insertList.indexOf(device)
    if (index === -1) return
    const before = index === 0 ? this.input : this.insertList[index - 1].output
    const after = this.insertList[index + 1]?.input ?? this.delay
    before.disconnect(device.input)
    device.output.disconnect(after)
    this.insertList.splice(index, 1)
    before.connect(after)
    this.nestedUnsubscribers.get(device)?.()
    this.nestedUnsubscribers.delete(device)
    this.onLatencyChange()
  }

  /**
   * The rack's verdict: delay this chain by `samples` (clamped to what the
   * DelayNode can hold). Structural, so a step at the current time, not a
   * ramp. Returns what was applied.
   */
  setCompensation(samples: number): number {
    const clamped = Math.min(this.maxCompensationSamples, Math.max(0, Math.round(samples)))
    if (clamped === this.compensation) return clamped
    this.compensation = clamped
    if (!this.disposed) {
      this.delay.delayTime.setValueAtTime(clamped / this.ctx.sampleRate, this.ctx.currentTime)
    }
    return clamped
  }

  dispose(options: RemoveChainOptions = {}): void {
    if (this.disposed) return
    this.disposed = true
    for (const unsubscribe of this.nestedUnsubscribers.values()) unsubscribe()
    this.nestedUnsubscribers.clear()
    for (const node of [this.input, this.delay, this.panner, this.fader, this.gate]) {
      node.disconnect()
    }
    for (const device of this.insertList) {
      device.output.disconnect()
      if (options.disposeDevices ?? true) device.dispose()
    }
    this.insertList.length = 0
  }

  private tail(): AudioNode {
    const last = this.insertList[this.insertList.length - 1]
    return last ? last.output : this.input
  }

  private assertLive(): void {
    if (this.disposed) throw new Error(`live-mix: chain "${this.name}" is disposed`)
  }
}

export interface RackOptions {
  name?: string
  /** Number of macros; fixes the param table. Default 8. */
  macroCount?: number
  /** Initial macro and `mix` values by param name (what the registry seeds from a preset). */
  params?: Readonly<Record<string, number>>
  /** Chains to create up front. */
  chains?: readonly ChainOptions[]
}

export interface MapMacroOptions extends MacroMappingOptions {
  /**
   * Bring the macro and the param into agreement now. Default true: a macro's
   * first mapping adopts the param's current position (nothing jumps), later
   * mappings move the param to where the macro is. `false` only records the
   * mapping — for restoring a preset whose values already agree.
   */
  apply?: boolean
}

export class Rack implements Device {
  readonly id = RACK_ID
  readonly name: string
  readonly params: Readonly<Record<string, ParamSpec>>
  readonly input: GainNode
  readonly output: GainNode
  /** Where the chains sum (and what the input feeds while there are none). */
  readonly sum: GainNode
  /** The macro controls, U19 `Macro`s: `rack.macros[0].set(0.5)` equals `rack.setParam('macro1', 0.5)`. */
  readonly macros: readonly RackMacro[]
  private readonly ctx: BaseAudioContext
  private readonly dry: GainNode
  private readonly wet: GainNode
  private readonly chainList: Chain[] = []
  private readonly mappingList: MacroMapping[] = []
  private readonly latencyListeners = new Set<() => void>()
  private mixValue = RACK_MIX_PARAM.default
  private bypassed = false
  private disposed = false

  constructor(ctx: BaseAudioContext, options: RackOptions = {}) {
    this.ctx = ctx
    this.name = options.name ?? 'Rack'
    const macroCount = options.macroCount ?? DEFAULT_MACRO_COUNT
    this.params = macroCount === DEFAULT_MACRO_COUNT ? RACK_PARAMS : rackParams(macroCount)

    this.input = ctx.createGain()
    this.output = ctx.createGain()
    this.dry = ctx.createGain()
    this.wet = ctx.createGain()
    this.sum = ctx.createGain()
    this.dry.gain.value = 0
    this.wet.gain.value = 1
    this.input.connect(this.dry)
    this.dry.connect(this.output)
    this.sum.connect(this.wet)
    this.wet.connect(this.output)
    this.input.connect(this.sum)

    this.macros = Array.from(
      { length: macroCount },
      (_, index) =>
        new RackMacro(index, `Macro ${index + 1}`, (macro) => this.applyMacro(macro.index)),
    )
    for (const [name, value] of Object.entries(options.params ?? {})) {
      const spec = this.params[name]
      if (!spec) continue
      const clamped = clampParam(spec, value)
      if (name === 'mix') {
        this.mixValue = clamped
        this.dry.gain.value = 1 - clamped
        this.wet.gain.value = clamped
      } else {
        const index = macroIndexOf(name)
        if (index !== null) this.macros[index].set(clamped)
      }
    }
    for (const chain of options.chains ?? []) this.addChain(chain)
  }

  // --- Chains ----------------------------------------------------------------------

  get chains(): readonly Chain[] {
    return this.chainList
  }

  /** Every device in every chain, in order (alignment stages excluded). */
  get devices(): Device[] {
    return this.chainList.flatMap((chain) => chain.devices)
  }

  /** Add a parallel chain; the first one replaces the empty rack's pass-through. */
  addChain(options: ChainOptions = {}): Chain {
    this.assertLive()
    const chain = new Chain(
      this.ctx,
      { ...options, name: options.name ?? `Chain ${this.chainList.length + 1}` },
      () => this.realign(),
    )
    if (this.chainList.length === 0) this.input.disconnect(this.sum)
    this.input.connect(chain.input)
    chain.output.connect(this.sum)
    this.chainList.push(chain)
    this.realign()
    return chain
  }

  /** Remove a chain (and by default its devices); the last one restores the pass-through. */
  removeChain(chain: Chain, options: RemoveChainOptions = {}): void {
    this.assertLive()
    const index = this.chainList.indexOf(chain)
    if (index === -1) return
    for (let i = this.mappingList.length - 1; i >= 0; i -= 1) {
      if (chain.inserts.includes(this.mappingList[i].device)) this.mappingList.splice(i, 1)
    }
    this.input.disconnect(chain.input)
    chain.dispose(options)
    this.chainList.splice(index, 1)
    if (this.chainList.length === 0) this.input.connect(this.sum)
    this.realign()
  }

  // --- Device contract -------------------------------------------------------------

  setParam(name: string, value: number): void {
    const spec = this.params[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    const clamped = clampParam(spec, value)
    if (name === 'mix') {
      this.mixValue = clamped
      if (!this.bypassed) this.applyMix()
      return
    }
    const index = macroIndexOf(name)
    if (index !== null) this.macros[index].set(clamped)
  }

  getParam(name: string): number {
    const spec = this.params[name]
    if (!spec) throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
    if (name === 'mix') return this.mixValue
    const index = macroIndexOf(name)
    return index === null ? spec.default : this.macros[index].value
  }

  get bypass(): boolean {
    return this.bypassed
  }

  /** Crossfade to the dry signal and back (5 ms); the chains keep running. */
  set bypass(enabled: boolean) {
    if (this.bypassed === enabled) return
    this.bypassed = enabled
    this.applyMix()
  }

  /** The rack's latency: its longest chain, which every other chain is aligned to. */
  get latencySamples(): number {
    let max = 0
    for (const chain of this.chainList) max = Math.max(max, chain.latencySamples)
    return max
  }

  get latencySec(): number {
    return this.latencySamples / this.ctx.sampleRate
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const chain of this.chainList) chain.dispose({ disposeDevices: true })
    this.chainList.length = 0
    this.mappingList.length = 0
    this.latencyListeners.clear()
    for (const node of [this.input, this.dry, this.wet, this.sum, this.output]) node.disconnect()
  }

  // --- Macros ----------------------------------------------------------------------

  /** Macro `index` (0-based); throws when out of range. */
  macro(index: number): RackMacro {
    const macro = this.macros[index]
    if (!macro) throw new Error(`live-mix: rack "${this.name}" has no macro ${index}`)
    return macro
  }

  /**
   * Map macro `index` onto `device.params[param]` over `[min, max]` with a
   * curve; the device must be an insert of one of this rack's chains (reach a
   * nested rack's devices through its own macros). One mapping per param:
   * mapping it again replaces the old one.
   */
  mapMacro(
    index: number,
    device: Device,
    param: string,
    options: MapMacroOptions = {},
  ): MacroMapping {
    this.assertLive()
    const macro = this.macro(index)
    if (!this.contains(device)) {
      throw new Error(`live-mix: macros map only onto devices inside rack "${this.name}"`)
    }
    const mapping = createMacroMapping(index, device, param, options)
    const existing = this.mappingList.findIndex(
      (candidate) => candidate.device === device && candidate.param === param,
    )
    if (existing !== -1) this.mappingList.splice(existing, 1)
    const first = !this.mappingList.some((candidate) => candidate.macro === index)
    this.mappingList.push(mapping)
    if (options.apply ?? true) {
      if (first) macro.set(macroPositionFor(mapping, device.getParam(param)))
      device.setParam(param, macroMappedValue(mapping, macro.value))
    }
    return mapping
  }

  /** Drop a mapping; the param keeps its last value. */
  unmapMacro(mapping: MacroMapping): boolean {
    const index = this.mappingList.indexOf(mapping)
    if (index === -1) return false
    this.mappingList.splice(index, 1)
    return true
  }

  /** Mappings of one macro, or all of them. */
  macroMappings(index?: number): readonly MacroMapping[] {
    if (index === undefined) return this.mappingList
    return this.mappingList.filter((mapping) => mapping.macro === index)
  }

  /**
   * Macro `index` as a modulation target for the engine's `ModMatrix`: a
   * lane base (`{ base: lane }`) or LFO routes drive the macro, and the macro
   * drives its mappings. Same as `deviceParamTarget(rack, 'macroN')`.
   */
  macroTarget(index: number, options: DeviceParamTargetOptions = {}): ModTarget {
    this.macro(index)
    return deviceParamTarget(this, macroParamName(index), options)
  }

  // --- Latency ---------------------------------------------------------------------

  /** Called after any chain's latency (and so the rack's) changed; returns the unsubscribe. */
  onLatencyChange(listener: () => void): () => void {
    this.latencyListeners.add(listener)
    return () => {
      this.latencyListeners.delete(listener)
    }
  }

  // --- Internals -------------------------------------------------------------------

  private contains(device: Device): boolean {
    return this.chainList.some((chain) => chain.inserts.includes(device))
  }

  private applyMacro(index: number): void {
    const position = this.macros[index].value
    for (const mapping of this.mappingList) {
      if (mapping.macro !== index) continue
      mapping.device.setParam(mapping.param, macroMappedValue(mapping, position))
    }
  }

  private applyMix(): void {
    if (this.disposed) return
    const wet = this.bypassed ? 0 : this.mixValue
    rampParamTo(this.ctx, this.dry.gain, 1 - wet)
    rampParamTo(this.ctx, this.wet.gain, wet)
  }

  private realign(): void {
    if (this.disposed) return
    const longest = this.latencySamples
    for (const chain of this.chainList) chain.setCompensation(longest - chain.latencySamples)
    for (const listener of this.latencyListeners) listener()
  }

  private assertLive(): void {
    if (this.disposed) throw new Error(`live-mix: rack "${this.name}" is disposed`)
  }
}

export interface RackCreateOptions extends DeviceCreateOptions {
  name?: string
  chains?: readonly ChainOptions[]
}

/** An empty rack with eight macros (or `options.chains` up front). */
export function createRack(context: BaseAudioContext, options: RackOptions = {}): Rack {
  return new Rack(context, options)
}

const CENTRED: Record<string, number> = {}
for (let index = 0; index < DEFAULT_MACRO_COUNT; index += 1) CENTRED[macroParamName(index)] = 0.5

export const RACK_DESCRIPTOR: DeviceDescriptor<Readonly<Record<string, ParamSpec>>> = {
  id: RACK_ID,
  name: 'Rack',
  kind: 'rack',
  category: 'utility',
  version: RACK_VERSION,
  params: RACK_PARAMS,
  presets: {
    Init: {},
    Centred: CENTRED,
  },
  // `devices.create('rack', ctx, { name, chains, params })`: extra request options reach here untouched.
  create: (context, options: RackCreateOptions) => createRack(context, options),
}

// --- Whole-rack presets -----------------------------------------------------------
//
// A U23 `Preset` of a rack is its macro and mix values. A `RackPreset` is the
// whole instrument: chains with their settings, every device as a U23 preset
// (nested racks recursively), macro names, values and mappings by chain and
// device index. `createRackFromPreset` rebuilds it through a registry.

export const RACK_PRESET_FORMAT_VERSION = 1

export interface RackMacroMappingPreset {
  chain: number
  device: number
  param: string
  min: number
  max: number
  curve: MacroCurve
}

export interface RackMacroPreset {
  name: string
  value: number
  mappings: RackMacroMappingPreset[]
}

export interface RackDevicePreset {
  /** The device's own U23 preset (`deviceId`, version, params). */
  preset: Preset
  bypass: boolean
  /** Present when the device is itself a rack. */
  rack?: RackPreset
}

export interface RackChainPreset {
  name: string
  gain: number
  pan: number
  mute: boolean
  keyZone?: ZoneRange
  selectorZone?: ZoneRange
  devices: RackDevicePreset[]
}

export interface RackPreset {
  name: string
  mix: number
  macros: RackMacroPreset[]
  chains: RackChainPreset[]
}

export interface SerializedRackPreset extends RackPreset {
  format: typeof RACK_PRESET_FORMAT_VERSION
  deviceId: typeof RACK_ID
  deviceVersion: number
}

export interface CaptureRackPresetOptions {
  /** Stamps each device preset with its descriptor version (1 for unregistered devices). */
  registry?: DeviceRegistry
}

/** Snapshot a rack: structure, device presets, chain settings, macros and mappings. */
export function captureRackPreset(
  rack: Rack,
  name: string,
  options: CaptureRackPresetOptions = {},
): RackPreset {
  const chains = rack.chains.map((chain): RackChainPreset => {
    const entry: RackChainPreset = {
      name: chain.name,
      gain: chain.gain,
      pan: chain.pan,
      mute: chain.mute,
      devices: chain.devices.map((device): RackDevicePreset => {
        const version = options.registry?.get(device.id)?.version ?? 1
        const record: RackDevicePreset = {
          preset: capturePreset(device, device instanceof Rack ? device.name : device.id, version),
          bypass: device.bypass,
        }
        if (device instanceof Rack) record.rack = captureRackPreset(device, device.name, options)
        return record
      }),
    }
    if (chain.keyZone) entry.keyZone = { ...chain.keyZone }
    if (chain.selectorZone) entry.selectorZone = { ...chain.selectorZone }
    return entry
  })
  const macros = rack.macros.map((macro): RackMacroPreset => ({
    name: macro.name,
    value: macro.value,
    mappings: rack.macroMappings(macro.index).map((mapping): RackMacroMappingPreset => {
      const chainIndex = rack.chains.findIndex((chain) => chain.inserts.includes(mapping.device))
      const deviceIndex = rack.chains[chainIndex].devices.indexOf(mapping.device)
      return {
        chain: chainIndex,
        device: deviceIndex,
        param: mapping.param,
        min: mapping.min,
        max: mapping.max,
        curve: mapping.curve,
      }
    }),
  }))
  return { name, mix: rack.getParam('mix'), macros, chains }
}

export interface CreateRackFromPresetOptions {
  /** Where the devices come from (`registry.create(deviceId, …)`). */
  registry: DeviceRegistry
  /** Extra factory options per device id (WASM `processorUrl`, `wasm`, `createNode`, …). */
  deviceOptions?: (deviceId: string) => Omit<DeviceCreateRequest, 'preset' | 'params'> | undefined
  name?: string
}

/** Rebuild a captured rack: chains, devices (through the registry), mappings, macro values. */
export async function createRackFromPreset(
  context: BaseAudioContext,
  preset: RackPreset,
  options: CreateRackFromPresetOptions,
): Promise<Rack> {
  const rack = new Rack(context, {
    name: options.name ?? preset.name,
    macroCount: Math.max(1, preset.macros.length),
    params: { mix: preset.mix },
  })
  for (const chainPreset of preset.chains) {
    const chain = rack.addChain({
      name: chainPreset.name,
      gain: chainPreset.gain,
      pan: chainPreset.pan,
      mute: chainPreset.mute,
      keyZone: chainPreset.keyZone,
      selectorZone: chainPreset.selectorZone,
    })
    for (const entry of chainPreset.devices) {
      const device = entry.rack
        ? await createRackFromPreset(context, entry.rack, { ...options, name: entry.rack.name })
        : await options.registry.create(entry.preset.deviceId, context, {
            ...options.deviceOptions?.(entry.preset.deviceId),
            preset: entry.preset,
          })
      device.bypass = entry.bypass
      chain.addInsert(device)
    }
  }
  preset.macros.forEach((macroPreset, index) => {
    const macro = rack.macros[index]
    macro.name = macroPreset.name
    macro.set(macroPreset.value)
    for (const mapping of macroPreset.mappings) {
      const device = rack.chains[mapping.chain]?.devices[mapping.device]
      if (!device) {
        throw new Error(
          `live-mix: rack preset "${preset.name}" maps macro ${index + 1} to a missing device`,
        )
      }
      rack.mapMacro(index, device, mapping.param, {
        min: mapping.min,
        max: mapping.max,
        curve: mapping.curve,
        apply: false,
      })
    }
  })
  return rack
}

export function serializeRackPreset(preset: RackPreset): string {
  const serialized: SerializedRackPreset = {
    format: RACK_PRESET_FORMAT_VERSION,
    deviceId: RACK_ID,
    deviceVersion: RACK_VERSION,
    ...preset,
  }
  return JSON.stringify(serialized)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isZone(value: unknown): value is ZoneRange {
  return isRecord(value) && isFiniteNumber(value.low) && isFiniteNumber(value.high)
}

function isMappingPreset(value: unknown): value is RackMacroMappingPreset {
  return (
    isRecord(value) &&
    Number.isInteger(value.chain) &&
    Number.isInteger(value.device) &&
    typeof value.param === 'string' &&
    isFiniteNumber(value.min) &&
    isFiniteNumber(value.max) &&
    (MACRO_CURVES as readonly unknown[]).includes(value.curve)
  )
}

function isMacroPreset(value: unknown): value is RackMacroPreset {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    isFiniteNumber(value.value) &&
    Array.isArray(value.mappings) &&
    value.mappings.every(isMappingPreset)
  )
}

function isDevicePreset(value: unknown): value is RackDevicePreset {
  return (
    isRecord(value) &&
    isPreset(value.preset) &&
    typeof value.bypass === 'boolean' &&
    (value.rack === undefined || isRackPreset(value.rack))
  )
}

function isChainPreset(value: unknown): value is RackChainPreset {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    isFiniteNumber(value.gain) &&
    isFiniteNumber(value.pan) &&
    typeof value.mute === 'boolean' &&
    (value.keyZone === undefined || isZone(value.keyZone)) &&
    (value.selectorZone === undefined || isZone(value.selectorZone)) &&
    Array.isArray(value.devices) &&
    value.devices.every(isDevicePreset)
  )
}

/** Structural check for an in-memory rack preset (no format field required). */
export function isRackPreset(value: unknown): value is RackPreset {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    isFiniteNumber(value.mix) &&
    Array.isArray(value.macros) &&
    value.macros.every(isMacroPreset) &&
    Array.isArray(value.chains) &&
    value.chains.every(isChainPreset)
  )
}

/** Parse `serializeRackPreset` output (a JSON string or parsed value); throws on anything malformed. */
export function parseRackPreset(input: unknown): RackPreset {
  const value: unknown = typeof input === 'string' ? JSON.parse(input) : input
  if (
    !isRecord(value) ||
    value.format !== RACK_PRESET_FORMAT_VERSION ||
    value.deviceId !== RACK_ID
  ) {
    throw new Error(
      `live-mix: unsupported rack preset format (expected ${RACK_PRESET_FORMAT_VERSION})`,
    )
  }
  if (!isRackPreset(value)) throw new Error('live-mix: malformed rack preset')
  const { name, mix, macros, chains } = value
  return structuredClone({ name, mix, macros, chains })
}
