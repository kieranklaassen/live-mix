// The mapping table: which source drives which target and how. Pure and
// immutable — every edit returns a new table — so it serialises into the
// score, diffs cleanly and unit-tests without an engine. One entry per
// target; a source may drive several targets (ambient-live's U27 rule).
//
// Resolution turns a `ControlEvent` into `ControlChange`s. It is pure over the
// table and the event plus two small pieces of state the caller owns: the
// last output each pickup mapping saw (soft takeover) and the last input each
// toggle mapping saw (edge detection). The caller applies the changes; a
// `set` carries the normalised value, `toggle` and `nudge` are relative to
// the target's current value, which only the caller can read.

import { type ControlEvent } from './event'
import { decodeRelative, type RelativeEncoding } from './midi'
import { isMidiSource, sourceKey, sourceMatches, type ControlSource } from './source'
import { isActionTarget, isBooleanTarget, targetKey, type ControlTarget } from './target'

export type MappingMode =
  /** The controller's position becomes the target's value (a knob follows the fader). */
  | 'set'
  /** Every press (or every rise past the input midpoint) flips the target. */
  | 'toggle'
  /** The controller is an endless encoder; each step nudges the target. */
  | 'relative'

export type MappingCurve = 'linear' | 'exp' | 'log' | 's'

export interface MappingRange {
  min: number
  max: number
}

export interface Mapping {
  source: ControlSource
  target: ControlTarget
  mode: MappingMode
  /** Raw controller range that maps onto 0..1. MIDI events arrive as 0..1; OSC arguments as sent. */
  input: MappingRange
  /** Span in the target's normalised space the controller covers; `min > max` inverts. */
  output: MappingRange
  curve: MappingCurve
  /** Soft takeover: an absolute controller takes the target only once it crosses the target's position. */
  pickup: boolean
  /** Relative mode: how a 7-bit CC encodes its delta. */
  encoding: RelativeEncoding
  /** Relative mode: normalised change per encoder step. */
  step: number
}

export type MappingInit = Pick<Mapping, 'source' | 'target'> &
  Partial<Omit<Mapping, 'source' | 'target'>>

export type MappingTable = readonly Mapping[]

export const UNIT_RANGE: Readonly<MappingRange> = { min: 0, max: 1 }
export const DEFAULT_RELATIVE_STEP = 1 / 127

export const MAPPING_MODES: readonly MappingMode[] = ['set', 'toggle', 'relative']
export const MAPPING_CURVES: readonly MappingCurve[] = ['linear', 'exp', 'log', 's']

/** A mapping with every option filled from the defaults. */
export function createMapping(init: MappingInit): Mapping {
  return {
    source: init.source,
    target: init.target,
    mode: init.mode ?? 'set',
    input: init.input ? { ...init.input } : { ...UNIT_RANGE },
    output: init.output ? { ...init.output } : { ...UNIT_RANGE },
    curve: init.curve ?? 'linear',
    pickup: init.pickup ?? false,
    encoding: init.encoding ?? 'twos-complement',
    step: init.step ?? DEFAULT_RELATIVE_STEP,
  }
}

export function mappingKey(mapping: Mapping): string {
  return targetKey(mapping.target)
}

export function describeMapping(mapping: Mapping): string {
  const parts: string[] = [mapping.mode]
  if (mapping.curve !== 'linear') parts.push(mapping.curve)
  if (mapping.pickup) parts.push('pickup')
  return parts.join(' · ')
}

// --- Table edits (immutable) -------------------------------------------------------

/** Bind a target, replacing whatever it was bound to. */
export function mapTarget(table: MappingTable, mapping: MappingInit): MappingTable {
  const full = createMapping(mapping)
  return [...table.filter((entry) => !sameKey(entry.target, full.target)), full]
}

export function unmapTarget(table: MappingTable, target: ControlTarget): MappingTable {
  return table.filter((entry) => !sameKey(entry.target, target))
}

/** Drop every mapping fed by `source` (exact source, not pattern-matched). */
export function unmapSource(table: MappingTable, source: ControlSource): MappingTable {
  const key = sourceKey(source)
  return table.filter((entry) => sourceKey(entry.source) !== key)
}

export function mappingFor(table: MappingTable, target: ControlTarget): Mapping | undefined {
  const key = targetKey(target)
  return table.find((entry) => targetKey(entry.target) === key)
}

/** Change a mapping's options in place of the old entry (mode, curve, ranges, pickup, encoding, step). */
export function updateMapping(
  table: MappingTable,
  target: ControlTarget,
  changes: Partial<Omit<Mapping, 'target'>>,
): MappingTable {
  const key = targetKey(target)
  return table.map((entry) =>
    targetKey(entry.target) === key ? createMapping({ ...entry, ...changes }) : entry,
  )
}

/** The mappings an event feeds. */
export function mappingsFor(table: MappingTable, event: ControlEvent): Mapping[] {
  return table.filter((entry) => sourceMatches(entry.source, event.source))
}

/** Whether the table consumes this event (a mapped note must not reach the synth). */
export function isMapped(table: MappingTable, event: ControlEvent): boolean {
  return table.some((entry) => sourceMatches(entry.source, event.source))
}

function sameKey(a: ControlTarget, b: ControlTarget): boolean {
  return targetKey(a) === targetKey(b)
}

// --- Value shaping -------------------------------------------------------------------

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/** Raw controller value → 0..1 through the mapping's input range. */
export function normalizeInput(range: MappingRange, raw: number): number {
  const span = range.max - range.min
  if (span === 0) return 0
  return clampUnit((raw - range.min) / span)
}

/** Apply the curve to a 0..1 position. */
export function applyCurve(curve: MappingCurve, u: number): number {
  const x = clampUnit(u)
  switch (curve) {
    case 'linear':
      return x
    case 'exp':
      return x * x
    case 'log':
      return Math.sqrt(x)
    case 's':
      return x * x * (3 - 2 * x)
    default: {
      const exhaustive: never = curve
      return exhaustive
    }
  }
}

/** Controller position → the normalised value written to the target. */
export function shapeValue(mapping: Mapping, raw: number): number {
  const u = applyCurve(mapping.curve, normalizeInput(mapping.input, raw))
  return clampUnit(mapping.output.min + u * (mapping.output.max - mapping.output.min))
}

// --- Resolution ----------------------------------------------------------------------

export type ControlChange =
  | { kind: 'set'; target: ControlTarget; unit: number; mapping: Mapping }
  | { kind: 'toggle'; target: ControlTarget; mapping: Mapping }
  | { kind: 'nudge'; target: ControlTarget; delta: number; mapping: Mapping }
  /** An action target fired (transport). */
  | { kind: 'trigger'; target: ControlTarget; mapping: Mapping }

/** What a pickup mapping remembers: where the controller last was and whether it owns the target. */
export interface PickupMemory {
  shaped: number
  engaged: boolean
}

/** Per-mapping runtime state the caller keeps between events. */
export interface ResolveState {
  /** Pickup memory per mapping, by target key. */
  readonly pickup: Map<string, PickupMemory>
  /** Last input position per toggle mapping fed by an absolute source, by target key. */
  readonly edge: Map<string, number>
}

export function createResolveState(): ResolveState {
  return { pickup: new Map(), edge: new Map() }
}

export interface ResolveContext {
  /** The target's current normalised value (0..1; 0/1 for booleans), or null when unknown. */
  read?: (target: ControlTarget) => number | null
  state?: ResolveState
}

/** Two positions this close count as the same for pickup (one 7-bit step). */
export const PICKUP_EPSILON = 1 / 127

/**
 * Soft takeover in output space. A controller engages when its shaped value
 * lands on the target's current value or crosses it since the previous
 * event, and stays engaged while the target is where the controller left it;
 * once something else (automation, the UI) moves the target away, the
 * controller has to catch it again. Returns true when the write should go
 * through and records the position.
 */
export function pickupAllows(
  state: Map<string, PickupMemory>,
  key: string,
  shaped: number,
  current: number | null,
): boolean {
  const memory = state.get(key)
  const engage = (): boolean => {
    state.set(key, { shaped, engaged: true })
    return true
  }
  if (current === null) return engage()
  if (memory?.engaged && Math.abs(current - memory.shaped) <= PICKUP_EPSILON) return engage()
  if (Math.abs(shaped - current) <= PICKUP_EPSILON) return engage()
  if (memory) {
    const previous = memory.shaped
    if ((previous < current && shaped > current) || (previous > current && shaped < current)) {
      return engage()
    }
  }
  state.set(key, { shaped, engaged: false })
  return false
}

function resolveOne(
  mapping: Mapping,
  event: ControlEvent,
  context: ResolveContext,
): ControlChange | null {
  const { target } = mapping
  const key = targetKey(target)
  if (isActionTarget(target)) return resolveAction(mapping, event, context, key)
  switch (mapping.mode) {
    case 'set': {
      if (event.kind === 'trigger') {
        if (!event.on) return null
        return { kind: 'set', target, unit: shapeValue(mapping, event.value), mapping }
      }
      const unit = shapeValue(mapping, event.value)
      if (mapping.pickup) {
        const state = context.state?.pickup ?? new Map<string, PickupMemory>()
        const current = context.read?.(target) ?? null
        if (!pickupAllows(state, key, unit, current)) return null
      }
      return { kind: 'set', target, unit, mapping }
    }
    case 'toggle': {
      if (event.kind === 'trigger') return event.on ? { kind: 'toggle', target, mapping } : null
      return risingEdge(context, key, normalizeInput(mapping.input, event.value))
        ? { kind: 'toggle', target, mapping }
        : null
    }
    case 'relative': {
      if (event.kind !== 'absolute') return null
      const steps = relativeSteps(mapping, event)
      if (steps === 0) return null
      const direction = mapping.output.max >= mapping.output.min ? 1 : -1
      return { kind: 'nudge', target, delta: steps * mapping.step * direction, mapping }
    }
    default: {
      const exhaustive: never = mapping.mode
      return exhaustive
    }
  }
}

function relativeSteps(mapping: Mapping, event: ControlEvent & { kind: 'absolute' }): number {
  if (isMidiSource(event.source)) {
    const raw = event.raw ?? Math.round(event.value * 127)
    return decodeRelative(raw, mapping.encoding)
  }
  // OSC encoders send a signed step count as the argument.
  const steps = event.raw ?? event.value
  return Number.isFinite(steps) ? steps : 0
}

/** A press, or an absolute source rising past the midpoint, fires an action target. */
function resolveAction(
  mapping: Mapping,
  event: ControlEvent,
  context: ResolveContext,
  key: string,
): ControlChange | null {
  if (event.kind === 'trigger')
    return event.on ? { kind: 'trigger', target: mapping.target, mapping } : null
  if (mapping.mode === 'relative') return null
  return risingEdge(context, key, normalizeInput(mapping.input, event.value))
    ? { kind: 'trigger', target: mapping.target, mapping }
    : null
}

function risingEdge(context: ResolveContext, key: string, input: number): boolean {
  const state = context.state?.edge
  const previous = state?.get(key) ?? 0
  state?.set(key, input)
  return previous < 0.5 && input >= 0.5
}

/** The changes an event produces under this table, in table order. */
export function resolveControlEvent(
  table: MappingTable,
  event: ControlEvent,
  context: ResolveContext = {},
): ControlChange[] {
  const changes: ControlChange[] = []
  for (const mapping of table) {
    if (!sourceMatches(mapping.source, event.source)) continue
    const change = resolveOne(mapping, event, context)
    if (change) changes.push(change)
  }
  return changes
}

/**
 * The value a `toggle` lands on: booleans flip; a continuous target jumps to
 * whichever end of the mapping's output span it is not at.
 */
export function toggledValue(mapping: Mapping, current: number | null): number {
  const low = Math.min(mapping.output.min, mapping.output.max)
  const high = Math.max(mapping.output.min, mapping.output.max)
  if (isBooleanTarget(mapping.target)) return (current ?? 0) >= 0.5 ? 0 : 1
  const mid = (low + high) / 2
  return (current ?? low) > mid ? low : high
}

/** The value a `nudge` lands on, clamped to the mapping's output span. */
export function nudgedValue(mapping: Mapping, current: number | null, delta: number): number {
  const low = Math.min(mapping.output.min, mapping.output.max)
  const high = Math.max(mapping.output.min, mapping.output.max)
  return Math.min(high, Math.max(low, (current ?? low) + delta))
}

// --- Learn -----------------------------------------------------------------------------

export interface LearnState {
  /** The armed target, or null when idle. */
  target: ControlTarget | null
  /** Force the mode of the learned mapping; otherwise inferred from the source and target. */
  mode?: MappingMode
}

export const IDLE_LEARN: Readonly<LearnState> = { target: null }

export interface LearnOutcome {
  learn: LearnState
  table: MappingTable
  /** True when the event completed a learn and must not be dispatched. */
  consumed: boolean
  /** The mapping that was bound, when one was. */
  mapping: Mapping | null
}

/**
 * The mode a fresh learn picks: a press on an on/off target toggles it; a
 * press on a continuous target sets it from velocity; a position sets. An
 * existing mapping keeps its mode when the new source still supports it.
 */
export function inferMode(
  target: ControlTarget,
  event: ControlEvent,
  existing?: Mapping,
): MappingMode {
  if (existing && (event.kind === 'absolute' || existing.mode !== 'relative')) return existing.mode
  if (event.kind === 'trigger') return isBooleanTarget(target) ? 'toggle' : 'set'
  return 'set'
}

/**
 * Feed an event through learn mode: idle passes it untouched; armed binds the
 * target to the event's source on a position or a press (a release keeps
 * waiting) and returns to idle. Options of a previous mapping for the target
 * survive a re-learn.
 */
export function learnFromEvent(
  learn: LearnState,
  table: MappingTable,
  event: ControlEvent,
): LearnOutcome {
  if (learn.target === null) return { learn, table, consumed: false, mapping: null }
  if (event.kind === 'trigger' && !event.on) return { learn, table, consumed: false, mapping: null }
  const existing = mappingFor(table, learn.target)
  const mapping = createMapping({
    ...existing,
    source: event.source,
    target: learn.target,
    mode: learn.mode ?? inferMode(learn.target, event, existing),
  })
  return { learn: { target: null }, table: mapTarget(table, mapping), consumed: true, mapping }
}

/**
 * A 14-bit knob announces itself as the MSB (a plain CC 0–31) first, so learn
 * binds 7-bit. When the very next event is the matching `cc14`, the binding
 * upgrades to it. Returns the new table, or null when no upgrade applies.
 */
export function upgradeLearnedSource(
  table: MappingTable,
  learned: Mapping,
  event: ControlEvent,
): MappingTable | null {
  const { source } = learned
  if (source.kind !== 'cc' || source.controller >= 32 || event.source.kind !== 'cc14') return null
  if (event.source.channel !== source.channel || event.source.controller !== source.controller) {
    return null
  }
  const current = mappingFor(table, learned.target)
  if (!current || sourceKey(current.source) !== sourceKey(source)) return null
  return mapTarget(table, { ...current, source: event.source })
}
