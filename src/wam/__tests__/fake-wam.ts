// A minimal WAM 2.0 plugin for tests: the surface `WamDevice` drives
// (`createInstance`, `descriptor`, `audioNode`, `createGui`/`destroyGui`, and
// on the node the parameter, state, event and destroy calls), implemented
// on the recording mocks so a test can assert what the adapter told the plugin
// and simulate what a plugin does back (automation events, GUI edits).
// Parameter info follows the SDK's `WamParameterInfo` rules (boolean/choice
// ranges, defaults, normalisation) without importing the SDK.

import type {
  WamDescriptor,
  WamEvent,
  WamParameterConfiguration,
  WamParameterDataMap,
  WamParameterInfo,
  WamParameterInfoMap,
} from '@webaudiomodules/api'

import { CallRecorder, MockAudioNode } from '../../testing'
import { type WamModuleConstructor, type WamModuleLike, type WamNodeLike } from '../WamDevice'

const normExp = (x: number, e: number): number => (e === 0 ? x : x ** (1.5 ** -e))
const denormExp = (x: number, e: number): number => (e === 0 ? x : x ** (1.5 ** e))

/** Mirrors the SDK's `WamParameterInfo` constructor, defaults included. */
export function fakeParameterInfo(
  id: string,
  config: WamParameterConfiguration = {},
): WamParameterInfo {
  const type = config.type ?? 'float'
  const label = config.label ?? ''
  const defaultValue = config.defaultValue ?? 0
  const choices = config.choices ?? []
  let { minValue, maxValue, discreteStep, exponent, units } = config
  if (type === 'boolean' || type === 'choice') {
    discreteStep = 1
    minValue = 0
    maxValue = choices.length ? choices.length - 1 : 1
  }
  minValue ??= 0
  maxValue ??= 1
  discreteStep ??= 0
  exponent ??= 0
  units ??= ''
  const min = minValue
  const max = maxValue
  const exp = exponent
  return {
    id,
    label,
    type,
    defaultValue,
    minValue: min,
    maxValue: max,
    discreteStep,
    exponent: exp,
    choices,
    units,
    normalize: (value) =>
      min === 0 && max === 1 ? normExp(value, exp) : normExp((value - min) / (max - min) || 0, exp),
    denormalize: (value) =>
      min === 0 && max === 1 ? denormExp(value, exp) : denormExp(value, exp) * (max - min) + min,
    valueString: (value) =>
      choices.length ? choices[value] : units !== '' ? `${value} ${units}` : `${value}`,
  }
}

export interface FakeWamConfig {
  identifier: string
  name: string
  vendor?: string
  params: Record<string, WamParameterConfiguration>
  isInstrument?: boolean
  hasAudioInput?: boolean
  hasAudioOutput?: boolean
  /** In samples, what `getCompensationDelay` reports. */
  compensationDelay?: number
  /** Whether `createGui` returns an element. */
  gui?: boolean
  /** Extra state the plugin keeps beyond its params. */
  extraState?: Record<string, unknown>
}

export interface FakeGui {
  tagName: 'FAKE-WAM-GUI'
  destroyed: boolean
}

type Listener = (event: { detail: WamEvent }) => void

export class FakeWamNode extends MockAudioNode {
  readonly info: WamParameterInfoMap
  readonly values: Record<string, number> = {}
  extra: Record<string, unknown>
  compensationDelay: number
  destroyed = false
  readonly setParameterValuesCalls = new CallRecorder()
  readonly scheduledEvents: WamEvent[] = []
  readonly clearEventsCalls = new CallRecorder()
  readonly setStateCalls = new CallRecorder()
  private readonly listeners = new Map<string, Set<Listener>>()

  constructor(config: FakeWamConfig) {
    super('wam-node')
    this.info = Object.fromEntries(
      Object.entries(config.params).map(([id, cfg]) => [id, fakeParameterInfo(id, cfg)]),
    )
    for (const [id, info] of Object.entries(this.info)) this.values[id] = info.defaultValue
    this.extra = { ...(config.extraState ?? {}) }
    this.compensationDelay = config.compensationDelay ?? 0
    this.numberOfInputs = config.hasAudioInput === false ? 0 : 1
    this.numberOfOutputs = config.hasAudioOutput === false ? 0 : 1
  }

  getParameterInfo(...ids: string[]): Promise<WamParameterInfoMap> {
    if (ids.length === 0) return Promise.resolve({ ...this.info })
    return Promise.resolve(Object.fromEntries(ids.map((id) => [id, this.info[id]])))
  }

  getParameterValues(normalized = false, ...ids: string[]): Promise<WamParameterDataMap> {
    const keys = ids.length ? ids : Object.keys(this.values)
    return Promise.resolve(
      Object.fromEntries(
        keys.map((id) => [
          id,
          {
            id,
            value: normalized ? this.info[id].normalize(this.values[id]) : this.values[id],
            normalized,
          },
        ]),
      ),
    )
  }

  setParameterValues(values: WamParameterDataMap): Promise<void> {
    this.setParameterValuesCalls.record([values])
    for (const data of Object.values(values)) this.apply(data.id, data.value, data.normalized)
    return Promise.resolve()
  }

  getState(): Promise<unknown> {
    return Promise.resolve({ params: { ...this.values }, ...this.extra })
  }

  setState(state: unknown): Promise<void> {
    this.setStateCalls.record([state])
    const { params, ...extra } = (state ?? {}) as { params?: Record<string, number> } & Record<
      string,
      unknown
    >
    if (params) for (const [id, value] of Object.entries(params)) this.apply(id, value, false)
    this.extra = { ...this.extra, ...extra }
    return Promise.resolve()
  }

  getCompensationDelay(): Promise<number> {
    return Promise.resolve(this.compensationDelay)
  }

  scheduleEvents(...events: WamEvent[]): void {
    this.scheduledEvents.push(...events)
  }

  clearEvents(): Promise<void> {
    this.clearEventsCalls.record([])
    this.scheduledEvents.length = 0
    return Promise.resolve()
  }

  addEventListener(type: string, listener: Listener): void {
    let set = this.listeners.get(type)
    if (!set) {
      set = new Set()
      this.listeners.set(type, set)
    }
    set.add(listener)
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener)
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0
  }

  destroy(): void {
    this.destroyed = true
    this.disconnect()
  }

  /** The processor reached a scheduled automation event: apply it and tell listeners. */
  processAutomation(id: string, value: number, normalized = false): void {
    this.apply(id, value, normalized)
    const event: WamEvent = { type: 'wam-automation', data: { id, value, normalized } }
    for (const listener of this.listeners.get('wam-automation') ?? []) listener({ detail: event })
  }

  /** A GUI knob moved: the plugin changes without telling anyone. */
  setFromGui(id: string, value: number): void {
    this.apply(id, value, false)
  }

  private apply(id: string, value: number, normalized: boolean): void {
    const info = this.info[id]
    if (!info) return
    const denormalized = normalized ? info.denormalize(value) : value
    const clamped = Math.min(info.maxValue, Math.max(info.minValue, denormalized))
    this.values[id] =
      info.discreteStep > 0
        ? info.minValue +
          Math.round((clamped - info.minValue) / info.discreteStep) * info.discreteStep
        : clamped
  }
}

export interface FakeWamInstance extends WamModuleLike {
  readonly node: FakeWamNode
  readonly groupId: string
  readonly context: BaseAudioContext
  readonly initialState: unknown
  readonly guis: FakeGui[]
}

export interface FakeWamConstructor extends WamModuleConstructor {
  readonly config: FakeWamConfig
  readonly instances: FakeWamInstance[]
  createInstance(
    groupId: string,
    context: BaseAudioContext,
    initialState?: unknown,
  ): Promise<FakeWamInstance>
}

let instanceCounter = 0

/** A WAM constructor (the module's default export) for `config`. */
export function defineFakeWam(config: FakeWamConfig): FakeWamConstructor {
  const descriptor: WamDescriptor = {
    identifier: config.identifier,
    name: config.name,
    vendor: config.vendor ?? 'live-mix tests',
    version: '1.0.0',
    apiVersion: '2.0.0',
    thumbnail: '',
    keywords: [],
    isInstrument: config.isInstrument ?? false,
    description: '',
    website: '',
    hasAudioInput: config.hasAudioInput ?? true,
    hasAudioOutput: config.hasAudioOutput ?? true,
    hasMidiInput: true,
    hasMidiOutput: false,
    hasAutomationInput: true,
    hasAutomationOutput: true,
    hasMpeInput: false,
    hasMpeOutput: false,
    hasOscInput: false,
    hasOscOutput: false,
    hasSysexInput: false,
    hasSysexOutput: false,
  }

  class FakeWam implements FakeWamInstance {
    static readonly config = config
    static readonly instances: FakeWamInstance[] = []
    static readonly isWebAudioModuleConstructor = true

    static async createInstance(
      groupId: string,
      context: BaseAudioContext,
      initialState?: unknown,
    ): Promise<FakeWamInstance> {
      const instance = new FakeWam(groupId, context, initialState)
      if (initialState !== undefined) await instance.node.setState(initialState)
      FakeWam.instances.push(instance)
      return instance
    }

    readonly descriptor = descriptor
    readonly node: FakeWamNode
    readonly instanceId: string
    readonly guis: FakeGui[] = []

    constructor(
      readonly groupId: string,
      readonly context: BaseAudioContext,
      readonly initialState: unknown,
    ) {
      this.node = new FakeWamNode(config)
      instanceCounter += 1
      this.instanceId = `${config.identifier}#${instanceCounter}`
    }

    get audioNode(): WamNodeLike {
      return this.node as unknown as WamNodeLike
    }

    createGui(): Promise<Element | null> {
      if (config.gui === false) return Promise.resolve(null)
      const gui: FakeGui = { tagName: 'FAKE-WAM-GUI', destroyed: false }
      this.guis.push(gui)
      return Promise.resolve(gui as unknown as Element)
    }

    destroyGui(gui: Element): void {
      const fake = gui as unknown as FakeGui
      if (this.guis.includes(fake)) fake.destroyed = true
    }
  }

  return FakeWam
}

/** A stereo effect with one of every param type; the contract-table fixture. */
export const FAKE_EFFECT_CONFIG: FakeWamConfig = {
  identifier: 'com.live-mix.fake-effect',
  name: 'Fake Effect',
  params: {
    gain: {
      label: 'Gain',
      type: 'float',
      defaultValue: 0,
      minValue: -24,
      maxValue: 24,
      units: 'dB',
    },
    cutoff: {
      label: 'Cutoff',
      type: 'float',
      defaultValue: 1000,
      minValue: 20,
      maxValue: 20000,
      exponent: 3,
      units: 'Hz',
    },
    stages: { label: 'Stages', type: 'int', defaultValue: 2, minValue: 1, maxValue: 8 },
    enabled: { label: 'Enabled', type: 'boolean', defaultValue: 1 },
    mode: { label: 'Mode', type: 'choice', defaultValue: 0, choices: ['Clean', 'Warm', 'Crushed'] },
  },
  compensationDelay: 480,
  extraState: { custom: 'kept' },
}

/** A synth: no audio input, MIDI in. */
export const FAKE_SYNTH_CONFIG: FakeWamConfig = {
  identifier: 'com.live-mix.fake-synth',
  name: 'Fake Synth',
  params: {
    level: { label: 'Level', type: 'float', defaultValue: 0.8 },
  },
  isInstrument: true,
  hasAudioInput: false,
}

/** An importer that serves `constructor` as the module's default export for `url`. */
export function fakeImporter(
  modules: Record<string, WamModuleConstructor>,
): (url: string) => Promise<unknown> {
  return (url) => {
    const found = modules[url]
    if (!found) return Promise.reject(new Error(`fake importer: no module at ${url}`))
    return Promise.resolve({ default: found })
  }
}

/** A `WamHostInitializer` stand-in that records calls and never touches the worklet. */
export function fakeHostInitializer(): {
  initialize: (
    ctx: BaseAudioContext,
    groupId?: string,
    groupKey?: string,
  ) => Promise<[string, string]>
  calls: CallRecorder
} {
  const calls = new CallRecorder()
  return {
    calls,
    initialize: (ctx, groupId = 'fake-group', groupKey = 'fake-key') => {
      calls.record([ctx, groupId, groupKey])
      return Promise.resolve([groupId, groupKey])
    },
  }
}
