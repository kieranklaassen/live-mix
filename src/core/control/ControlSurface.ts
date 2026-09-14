// The stateful half of MIDI/OSC learn (U36, R15): one object that owns a
// mapping table, the learn state, the per-mapping runtime state (pickup
// positions, toggle edges), the registries for devices and macros, and the
// lane writers that automation attached to targets. Inputs feed it
// `ControlEvent`s through `handle`; it binds them while learning, otherwise
// resolves them against the table and applies each change through the
// engine's ramped setters. A target with a `LaneWriter` is overridden on the
// first write (cancel-and-hold, R29) and handed back with `release`.
//
// Import-safe under SSR: nothing here touches `navigator`, `window` or an
// `AudioContext`; the input adapters do, inside `open()`.

import { type LaneWriter } from '../automation/LaneWriter'
import { type Macro } from '../automation/Modulator'
import { type Device } from '../devices/Device'
import { type Engine } from '../Engine'
import { Emitter } from '../events'
import {
  DEFAULT_LEVEL_MAX,
  engineResolver,
  resolveBinding,
  type ControlBinding,
  type ControlResolver,
} from './bindings'
import { type ControlEvent } from './event'
import {
  createMapping,
  createResolveState,
  isMapped,
  learnFromEvent,
  mapTarget,
  mappingFor,
  nudgedValue,
  resolveControlEvent,
  toggledValue,
  unmapSource,
  unmapTarget,
  updateMapping,
  upgradeLearnedSource,
  type ControlChange,
  type LearnState,
  type Mapping,
  type MappingInit,
  type MappingMode,
  type MappingTable,
  type ResolveState,
} from './mapping'
import {
  loadMappingTable,
  mappingTableToJSON,
  parseMappingTable,
  saveMappingTable,
  serializeMappingTable,
  type MappingMigration,
  type MappingStorageOptions,
  type SerializedMappingTable,
  type StorageLike,
} from './serialize'
import { type ControlSource } from './source'
import { controlTargetKey, type ControlTarget } from './target'

/** Anything that produces control events: `MidiInput`, `OscInput`, or a test. */
export interface ControlInput {
  subscribe(listener: (event: ControlEvent) => void): () => void
}

export interface ControlSurfaceOptions {
  /** Strips, sends, master and transport resolve through this engine. */
  engine?: Engine
  /** Supply or override lookups (a surface without an engine, or a custom device registry). */
  resolve?: Partial<ControlResolver>
  /** Span of every level control, 0..levelMax. Default 1.5 (unity = 1). */
  levelMax?: number
  /** Audio clock for ramps and overrides; defaults to the engine's. */
  now?: () => number
  mappings?: MappingTable
  /** Migrations `load` and `persist` apply to older tables. */
  migrations?: readonly MappingMigration[]
}

export type ControlSurfaceChange =
  | { type: 'table'; table: MappingTable }
  | { type: 'learn'; learn: LearnState }
  /** Every incoming event, whether or not something consumed it (activity indicators). */
  | { type: 'event'; event: ControlEvent; consumed: boolean }
  /** A change reached a target; `unit` is the normalised value written (null for actions). */
  | { type: 'applied'; change: ControlChange; unit: number | null }

export type ControlSurfaceListener = (change: ControlSurfaceChange) => void

export interface HandleResult {
  /** True when a mapping or a learn took the event (a mapped note must not reach the synth). */
  consumed: boolean
  /** The mapping a learn bound, if this event completed one. */
  learned: Mapping | null
  /** Changes that reached a target. */
  applied: ControlChange[]
}

export interface BeginLearnOptions {
  /** Force the learned mapping's mode instead of inferring it. */
  mode?: MappingMode
}

export class ControlSurface {
  readonly levelMax: number
  private currentTable: MappingTable
  private learnState: LearnState = { target: null }
  private lastLearned: Mapping | null = null
  private last: ControlEvent | null = null
  private readonly state: ResolveState = createResolveState()
  private readonly remembered = new Map<string, number>()
  private readonly deviceMap = new Map<string, Device>()
  private readonly macroMap = new Map<string, Macro>()
  private readonly writers = new Map<string, LaneWriter>()
  private readonly changes = new Emitter<ControlSurfaceChange>()
  private readonly inputs = new Set<() => void>()
  private readonly resolver: ControlResolver
  private readonly clock: () => number
  private readonly migrations: readonly MappingMigration[]
  private disposed = false

  constructor(options: ControlSurfaceOptions = {}) {
    this.levelMax = options.levelMax ?? DEFAULT_LEVEL_MAX
    this.currentTable = [...(options.mappings ?? [])]
    this.migrations = options.migrations ?? []
    const engine = options.engine
    this.clock = options.now ?? (engine ? () => engine.now() : () => 0)
    const base: ControlResolver = {
      strip: () => undefined,
      send: () => undefined,
      master: () => undefined,
      transport: () => undefined,
      device: (id) => this.deviceMap.get(id),
      macro: (name) => this.macroMap.get(name),
      ...(engine ? engineResolver(engine) : {}),
    }
    this.resolver = { ...base, ...stripUndefined(options.resolve ?? {}) }
  }

  // --- State -------------------------------------------------------------------

  get table(): MappingTable {
    return this.currentTable
  }

  get learn(): Readonly<LearnState> {
    return this.learnState
  }

  /** The target armed for learn, or null. */
  get learning(): ControlTarget | null {
    return this.learnState.target
  }

  /** The most recent event handled (for "last: CC 74 · ch 1" indicators). */
  get lastEvent(): ControlEvent | null {
    return this.last
  }

  /** Called after every table edit, learn change, incoming event and applied change. Returns the unsubscribe function. */
  onChange(listener: ControlSurfaceListener): () => void {
    return this.changes.subscribe(listener)
  }

  // --- Table edits ---------------------------------------------------------------

  mappingFor(target: ControlTarget): Mapping | undefined {
    return mappingFor(this.currentTable, target)
  }

  /** Bind a target (replacing its previous binding). */
  map(mapping: MappingInit): Mapping {
    const full = createMapping(mapping)
    this.setTable(mapTarget(this.currentTable, full))
    return full
  }

  unmap(target: ControlTarget): void {
    this.setTable(unmapTarget(this.currentTable, target))
  }

  unmapSource(source: ControlSource): void {
    this.setTable(unmapSource(this.currentTable, source))
  }

  /** Change a mapping's options (mode, curve, ranges, pickup, encoding, step). */
  update(target: ControlTarget, changes: Partial<Omit<Mapping, 'target'>>): void {
    this.setTable(updateMapping(this.currentTable, target, changes))
  }

  /** Swap the whole table (a score loaded, an undo). */
  replace(table: MappingTable): void {
    this.setTable([...table])
  }

  clear(): void {
    this.setTable([])
  }

  // --- Learn ------------------------------------------------------------------------

  /** Arm a target: the next position or press binds it and is consumed. */
  beginLearn(target: ControlTarget, options: BeginLearnOptions = {}): void {
    this.lastLearned = null
    this.setLearn(options.mode ? { target, mode: options.mode } : { target })
  }

  cancelLearn(): void {
    if (this.learnState.target === null) return
    this.setLearn({ target: null })
  }

  // --- Registries -------------------------------------------------------------------

  /** Make a device addressable as `{ kind: 'device', device: id, param }`. Returns the unregister function. */
  registerDevice(id: string, device: Device): () => void {
    this.deviceMap.set(id, device)
    return () => {
      if (this.deviceMap.get(id) === device) this.deviceMap.delete(id)
    }
  }

  get devices(): ReadonlyMap<string, Device> {
    return this.deviceMap
  }

  /** Make a macro addressable as `{ kind: 'macro', macro: name }`. Returns the unregister function. */
  registerMacro(name: string, macro: Macro): () => void {
    this.macroMap.set(name, macro)
    return () => {
      if (this.macroMap.get(name) === macro) this.macroMap.delete(name)
    }
  }

  get macros(): ReadonlyMap<string, Macro> {
    return this.macroMap
  }

  /**
   * Tell the surface automation drives this target: the first controller
   * write calls `writer.override(now)` (cancel-and-hold) and the lane stays
   * off until `release(target)`. Returns the detach function.
   */
  attachWriter(target: ControlTarget, writer: LaneWriter): () => void {
    const key = controlTargetKey(target)
    this.writers.set(key, writer)
    return () => {
      if (this.writers.get(key) === writer) this.writers.delete(key)
    }
  }

  writerFor(target: ControlTarget): LaneWriter | undefined {
    return this.writers.get(controlTargetKey(target))
  }

  /** Hand a target back to its lane (the next automation tick ramps onto it). */
  release(target: ControlTarget): void {
    this.writers.get(controlTargetKey(target))?.release()
  }

  releaseAll(): void {
    for (const writer of this.writers.values()) writer.release()
  }

  // --- Dispatch ------------------------------------------------------------------------

  /** Feed one event: learn binds, otherwise mappings apply. */
  handle(event: ControlEvent): HandleResult {
    if (this.disposed) return { consumed: false, learned: null, applied: [] }
    this.last = event

    const outcome = learnFromEvent(this.learnState, this.currentTable, event)
    if (outcome.consumed) {
      this.lastLearned = outcome.mapping
      this.setTable(outcome.table)
      this.setLearn(outcome.learn)
      this.changes.emit({ type: 'event', event, consumed: true })
      return { consumed: true, learned: outcome.mapping, applied: [] }
    }

    const learned = this.lastLearned
    this.lastLearned = null
    if (learned) {
      const upgraded = upgradeLearnedSource(this.currentTable, learned, event)
      if (upgraded) {
        this.setTable(upgraded)
        this.changes.emit({ type: 'event', event, consumed: true })
        return {
          consumed: true,
          learned: mappingFor(upgraded, learned.target) ?? null,
          applied: [],
        }
      }
    }

    const changes = resolveControlEvent(this.currentTable, event, {
      read: (target) => this.read(target),
      state: this.state,
    })
    const applied: ControlChange[] = []
    for (const change of changes) {
      if (this.apply(change) !== undefined) applied.push(change)
    }
    // A mapped source is consumed even when this particular event produced no
    // change (a release, a blocked pickup), so a mapped pad never plays the synth.
    const consumed = isMapped(this.currentTable, event)
    this.changes.emit({ type: 'event', event, consumed })
    return { consumed, learned: null, applied }
  }

  /**
   * Apply one resolved change to its target. Returns the normalised value
   * written (null for an action), or undefined when nothing answers to the
   * target right now.
   */
  apply(change: ControlChange): number | null | undefined {
    const binding = this.binding(change.target)
    if (!binding) return undefined
    let unit: number | null
    switch (change.kind) {
      case 'set':
        unit = change.unit
        break
      case 'toggle':
        unit = toggledValue(change.mapping, binding.read())
        break
      case 'nudge':
        unit = nudgedValue(change.mapping, binding.read(), change.delta)
        break
      case 'trigger':
        unit = null
        break
      default: {
        const exhaustive: never = change
        return exhaustive
      }
    }
    if (unit === null) {
      binding.fire()
    } else {
      this.override(change.target)
      binding.write(unit)
    }
    this.changes.emit({ type: 'applied', change, unit })
    return unit
  }

  /** Write a normalised value straight to a target (UI, tests); overrides its lane like a controller would. */
  set(target: ControlTarget, unit: number): boolean {
    const binding = this.binding(target)
    if (!binding) return false
    this.override(target)
    binding.write(unit)
    return true
  }

  /** The target's current normalised position, or null when unknown or an action. */
  read(target: ControlTarget): number | null {
    return this.binding(target)?.read() ?? null
  }

  /** Route an input's events into `handle`. Returns the disconnect function. */
  connect(input: ControlInput): () => void {
    const unsubscribe = input.subscribe((event) => {
      this.handle(event)
    })
    const disconnect = (): void => {
      unsubscribe()
      this.inputs.delete(disconnect)
    }
    this.inputs.add(disconnect)
    return disconnect
  }

  // --- Persistence ---------------------------------------------------------------------

  serialize(): string {
    return serializeMappingTable(this.currentTable)
  }

  toJSON(): SerializedMappingTable {
    return mappingTableToJSON(this.currentTable)
  }

  /** Replace the table from a serialised blob (string or object), through the surface's migrations. */
  load(input: unknown): MappingTable {
    this.setTable(parseMappingTable(input, { migrations: this.migrations }))
    return this.currentTable
  }

  /**
   * Load the table from storage now and save it on every edit until the
   * returned function is called. Missing or malformed storage leaves the
   * table as it is.
   */
  persist(
    storage: StorageLike | null | undefined,
    options: MappingStorageOptions = {},
  ): () => void {
    const storageOptions = { migrations: this.migrations, ...options }
    if (storage) {
      const loaded = loadMappingTable(storage, storageOptions)
      if (loaded.length > 0) this.setTable(loaded)
    }
    return this.onChange((change) => {
      if (change.type === 'table') saveMappingTable(storage, change.table, storageOptions)
    })
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const disconnect of [...this.inputs]) disconnect()
    this.changes.clear()
    this.writers.clear()
    this.deviceMap.clear()
    this.macroMap.clear()
  }

  // --- Internals -----------------------------------------------------------------------

  private binding(target: ControlTarget): ControlBinding | null {
    return resolveBinding(target, this.resolver, {
      levelMax: this.levelMax,
      now: this.clock,
      remembered: this.remembered,
      key: controlTargetKey(target),
    })
  }

  private override(target: ControlTarget): void {
    const writer = this.writers.get(controlTargetKey(target))
    if (writer && !writer.isOverridden) writer.override(this.clock())
  }

  private setTable(table: MappingTable): void {
    this.currentTable = table
    this.changes.emit({ type: 'table', table })
  }

  private setLearn(learn: LearnState): void {
    this.learnState = learn
    this.changes.emit({ type: 'learn', learn })
  }
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) (out as Record<string, unknown>)[key] = entry
  }
  return out
}
