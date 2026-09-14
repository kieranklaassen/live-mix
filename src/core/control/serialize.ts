// A mapping table as a versioned JSON blob that lives in the score or in
// `localStorage`. Parsing never throws: a foreign format yields an empty
// table unless a migration claims it, and malformed entries are dropped one
// by one so a stale table never blocks a page. Format 1 is ambient-live's
// U27 `midi-map` table (targets are that app's string ids); format 2 is this
// library's. `ambientLiveMidiMapMigration` bridges them given the app's
// id → target function, so ambient-live can delete its copy.

import {
  MAPPING_CURVES,
  MAPPING_MODES,
  createMapping,
  mapTarget,
  type Mapping,
  type MappingCurve,
  type MappingMode,
  type MappingRange,
  type MappingTable,
} from './mapping'
import { RELATIVE_ENCODINGS, type RelativeEncoding } from './midi'
import { parseControlSource } from './source'
import { isBooleanTarget, parseControlTarget, type ControlTarget } from './target'

/** Bumped when the serialised shape changes. */
export const MAPPING_TABLE_FORMAT = 2

/** ambient-live's U27 table format, migrated through `ambientLiveMidiMapMigration`. */
export const AMBIENT_LIVE_MIDI_MAP_FORMAT = 1

export const MAPPING_STORAGE_KEY = 'live-mix:control-map'

export interface SerializedMappingTable {
  format: typeof MAPPING_TABLE_FORMAT
  mappings: Mapping[]
}

/**
 * Turns a payload of an older `format` into a newer one; the parser applies
 * migrations in ascending order until it reaches the current format. `to`
 * defaults to `from + 1`.
 */
export interface MappingMigration {
  from: number
  to?: number
  migrate(payload: Record<string, unknown>): unknown
}

export interface ParseMappingTableOptions {
  migrations?: readonly MappingMigration[]
}

export function serializeMappingTable(table: MappingTable): string {
  const payload: SerializedMappingTable = { format: MAPPING_TABLE_FORMAT, mappings: [...table] }
  return JSON.stringify(payload)
}

/** The plain object form (for embedding in a score document). */
export function mappingTableToJSON(table: MappingTable): SerializedMappingTable {
  return { format: MAPPING_TABLE_FORMAT, mappings: table.map((mapping) => ({ ...mapping })) }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseRange(value: unknown): MappingRange | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  return isFiniteNumber(record.min) && isFiniteNumber(record.max)
    ? { min: record.min, max: record.max }
    : null
}

function oneOf<T extends string>(options: readonly T[], value: unknown): T | undefined {
  return options.includes(value as T) ? (value as T) : undefined
}

/** Validate an untrusted value as a `Mapping` (unknown options fall back to defaults). */
export function parseMapping(value: unknown): Mapping | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  const source = parseControlSource(record.source)
  const target = parseControlTarget(record.target)
  if (!source || !target) return null
  const step = isFiniteNumber(record.step) && record.step > 0 ? record.step : undefined
  return createMapping({
    source,
    target,
    mode: oneOf<MappingMode>(MAPPING_MODES, record.mode),
    input: parseRange(record.input) ?? undefined,
    output: parseRange(record.output) ?? undefined,
    curve: oneOf<MappingCurve>(MAPPING_CURVES, record.curve),
    pickup: typeof record.pickup === 'boolean' ? record.pickup : undefined,
    encoding: oneOf<RelativeEncoding>(RELATIVE_ENCODINGS, record.encoding),
    step,
  })
}

function runMigrations(
  payload: Record<string, unknown>,
  migrations: readonly MappingMigration[],
): Record<string, unknown> | null {
  let current = payload
  let format = current.format
  // Bounded by the number of migrations so a bad `to` cannot loop.
  for (let guard = 0; guard <= migrations.length; guard += 1) {
    if (format === MAPPING_TABLE_FORMAT) return current
    const migration = migrations.find((candidate) => candidate.from === format)
    if (!migration) return null
    const next = migration.migrate(current)
    if (typeof next !== 'object' || next === null) return null
    current = next as Record<string, unknown>
    current.format = current.format ?? migration.to ?? migration.from + 1
    format = current.format
  }
  return null
}

/**
 * Parse `serializeMappingTable` output — a string or an already-parsed
 * object — into a table. Never throws. A later entry for a target wins, as a
 * rebind would.
 */
export function parseMappingTable(
  input: unknown,
  options: ParseMappingTableOptions = {},
): MappingTable {
  let value = input
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  if (typeof value !== 'object' || value === null) return []
  const payload = runMigrations({ ...(value as Record<string, unknown>) }, options.migrations ?? [])
  if (!payload || !Array.isArray(payload.mappings)) return []
  let table: MappingTable = []
  for (const entry of payload.mappings) {
    const mapping = parseMapping(entry)
    if (mapping) table = mapTarget(table, mapping)
  }
  return table
}

// --- ambient-live (U27) migration --------------------------------------------------

export interface AmbientLiveMigrationOptions {
  /**
   * The output span a migrated mapping should carry, by target and app id —
   * for knobs whose range is narrower than the target's (ambient-live's
   * decay/damping 0–0.99 against a 0–1 param), or reversed (monitor on =
   * mute off). Return undefined for the unit span.
   */
  outputFor?: (target: ControlTarget, id: string) => MappingRange | undefined
}

/**
 * Migration for ambient-live's `{ format: 1, mappings: [{ source, target }] }`
 * table. `targetFor` maps the app's string ids (`'reverb.mix'`,
 * `'synth.level'`, …) onto `ControlTarget`s; an id it returns null for is
 * dropped. U27 semantics carry over: a CC sets; a note on an on/off target
 * toggles, on a continuous target sets from velocity. `outputFor` lets the
 * migrated table carry knob ranges so no post-pass is needed.
 */
export function ambientLiveMidiMapMigration(
  targetFor: (id: string) => ControlTarget | null,
  options: AmbientLiveMigrationOptions = {},
): MappingMigration {
  return {
    from: AMBIENT_LIVE_MIDI_MAP_FORMAT,
    to: MAPPING_TABLE_FORMAT,
    migrate(payload) {
      const entries = Array.isArray(payload.mappings) ? payload.mappings : []
      const mappings: unknown[] = []
      for (const entry of entries) {
        if (typeof entry !== 'object' || entry === null) continue
        const record = entry as Record<string, unknown>
        if (typeof record.target !== 'string') continue
        const target = targetFor(record.target)
        const source = parseControlSource(record.source)
        if (!target || !source) continue
        const mode: MappingMode =
          source.kind === 'note' && isBooleanTarget(target) ? 'toggle' : 'set'
        const output = options.outputFor?.(target, record.target)
        mappings.push(
          output ? { source, target, mode, output: { ...output } } : { source, target, mode },
        )
      }
      return { format: MAPPING_TABLE_FORMAT, mappings }
    },
  }
}

// --- Storage adapter ---------------------------------------------------------------

/** The slice of `Storage` the table needs; `localStorage` satisfies it, as does any key-value store. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface MappingStorageOptions extends ParseMappingTableOptions {
  key?: string
}

/** Read a table from storage; empty on a missing key, bad JSON, or a storage that throws. */
export function loadMappingTable(
  storage: StorageLike | null | undefined,
  options: MappingStorageOptions = {},
): MappingTable {
  if (!storage) return []
  try {
    return parseMappingTable(storage.getItem(options.key ?? MAPPING_STORAGE_KEY), options)
  } catch {
    return []
  }
}

/** Write a table to storage, removing the key when the table is empty. Never throws. */
export function saveMappingTable(
  storage: StorageLike | null | undefined,
  table: MappingTable,
  options: MappingStorageOptions = {},
): void {
  if (!storage) return
  const key = options.key ?? MAPPING_STORAGE_KEY
  try {
    if (table.length === 0) storage.removeItem(key)
    else storage.setItem(key, serializeMappingTable(table))
  } catch {
    // Quota or private mode: the table still works for this session.
  }
}
