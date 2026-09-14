import { describe, expect, it } from 'vitest'

import { createMapping, mapTarget, type MappingTable } from '../mapping'
import {
  MAPPING_STORAGE_KEY,
  MAPPING_TABLE_FORMAT,
  loadMappingTable,
  mappingTableToJSON,
  parseMapping,
  parseMappingTable,
  saveMappingTable,
  serializeMappingTable,
  type MappingMigration,
  type StorageLike,
} from '../serialize'
import { type ControlTarget } from '../target'

const level: ControlTarget = { kind: 'strip', track: 'pad', control: 'level' }
const mute: ControlTarget = { kind: 'strip', track: 'pad', control: 'mute' }
const cutoff: ControlTarget = { kind: 'device', device: 'flt', param: 'frequency' }

const table: MappingTable = [
  createMapping({
    source: { kind: 'cc', channel: 1, controller: 74 },
    target: level,
    pickup: true,
  }),
  createMapping({
    source: { kind: 'note', channel: 10, note: 36 },
    target: mute,
    mode: 'toggle',
  }),
  createMapping({
    source: { kind: 'osc', address: '/1/fader*', arg: 0 },
    target: cutoff,
    curve: 'exp',
    input: { min: 0, max: 127 },
    output: { min: 0.1, max: 0.9 },
  }),
  createMapping({
    source: { kind: 'cc14', channel: 1, controller: 1 },
    target: { kind: 'macro', macro: 'x' },
    mode: 'relative',
    encoding: 'binary-offset',
    step: 0.01,
  }),
]

function memoryStorage(
  initial: Record<string, string> = {},
): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

describe('serialisation', () => {
  it('round-trips through JSON, as a string and as an object', () => {
    const json = serializeMappingTable(table)
    expect(JSON.parse(json).format).toBe(MAPPING_TABLE_FORMAT)
    expect(parseMappingTable(json)).toEqual(table)
    expect(parseMappingTable(JSON.parse(json))).toEqual(table)
    expect(parseMappingTable(mappingTableToJSON(table))).toEqual(table)
  })

  it('fills missing options with defaults and drops malformed entries, unknown formats and bad JSON', () => {
    expect(parseMappingTable('not json')).toEqual([])
    expect(parseMappingTable(null)).toEqual([])
    expect(parseMappingTable(42)).toEqual([])
    expect(parseMappingTable({ format: 99, mappings: [] })).toEqual([])
    expect(parseMappingTable({ format: MAPPING_TABLE_FORMAT })).toEqual([])
    const mixed = {
      format: MAPPING_TABLE_FORMAT,
      mappings: [
        { source: { kind: 'cc', channel: 1, controller: 74 }, target: level },
        { source: { kind: 'cc', channel: 17, controller: 74 }, target: level },
        { source: { kind: 'cc', channel: 1, controller: 200 }, target: mute },
        { source: { kind: 'pitch', channel: 1 }, target: mute },
        { source: { kind: 'cc', channel: 1, controller: 1 }, target: 'reverb.size' },
        {
          source: { kind: 'cc', channel: 1, controller: 1 },
          target: { kind: 'strip', track: 'x' },
        },
        'garbage',
        null,
        {
          source: { kind: 'cc', channel: 1, controller: 2 },
          target: level,
          mode: 'bogus',
          curve: 7,
          pickup: 'yes',
          input: { min: 'a' },
          output: { min: 0, max: 0.5 },
          encoding: 'nope',
          step: -1,
        },
      ],
    }
    // The later entry for the level wins, as a rebind would; its bad options fall back.
    expect(parseMappingTable(mixed)).toEqual([
      createMapping({
        source: { kind: 'cc', channel: 1, controller: 2 },
        target: level,
        output: { min: 0, max: 0.5 },
      }),
    ])
    expect(parseMapping({ source: { kind: 'cc', channel: 1, controller: 2 } })).toBeNull()
  })

  it('applies migrations in order up to the current format, and refuses gaps', () => {
    const legacy = { format: 0, entries: [{ cc: 74, to: 'pad' }] }
    const zeroToOne: MappingMigration = {
      from: 0,
      migrate: (payload) => ({
        format: 1,
        rows: (payload.entries as { cc: number; to: string }[]).map((entry) => ({
          controller: entry.cc,
          track: entry.to,
        })),
      }),
    }
    const oneToTwo: MappingMigration = {
      from: 1,
      to: MAPPING_TABLE_FORMAT,
      migrate: (payload) => ({
        mappings: (payload.rows as { controller: number; track: string }[]).map((row) => ({
          source: { kind: 'cc', channel: 1, controller: row.controller },
          target: { kind: 'strip', track: row.track, control: 'level' },
        })),
      }),
    }
    expect(parseMappingTable(legacy, { migrations: [oneToTwo, zeroToOne] })).toEqual([
      createMapping({ source: { kind: 'cc', channel: 1, controller: 74 }, target: level }),
    ])
    expect(parseMappingTable(legacy, { migrations: [zeroToOne] })).toEqual([])
    expect(parseMappingTable(legacy, { migrations: [oneToTwo] })).toEqual([])
    const broken: MappingMigration = { from: 0, migrate: () => null }
    expect(parseMappingTable(legacy, { migrations: [broken] })).toEqual([])
    // A migration that does not advance cannot loop forever.
    const stuck: MappingMigration = {
      from: 0,
      to: 0,
      migrate: (payload) => ({ ...payload, format: 0 }),
    }
    expect(parseMappingTable(legacy, { migrations: [stuck] })).toEqual([])
    // Migrations never run on the current format.
    const spy: MappingMigration = {
      from: MAPPING_TABLE_FORMAT,
      migrate: () => {
        throw new Error('must not run')
      },
    }
    expect(parseMappingTable(serializeMappingTable(table), { migrations: [spy] })).toEqual(table)
  })
})

describe('storage adapter', () => {
  it('loads and saves through a Storage-like object, clearing the key when empty', () => {
    const storage = memoryStorage()
    saveMappingTable(storage, table)
    expect(storage.data.has(MAPPING_STORAGE_KEY)).toBe(true)
    expect(loadMappingTable(storage)).toEqual(table)
    saveMappingTable(storage, [])
    expect(storage.data.has(MAPPING_STORAGE_KEY)).toBe(false)
    expect(loadMappingTable(null)).toEqual([])
    expect(loadMappingTable(undefined)).toEqual([])
    expect(loadMappingTable(memoryStorage({ [MAPPING_STORAGE_KEY]: '{oops' }))).toEqual([])
    saveMappingTable(storage, table, { key: 'custom' })
    expect(loadMappingTable(storage, { key: 'custom' })).toEqual(table)
    expect(loadMappingTable(storage)).toEqual([])
  })

  it('survives a storage that throws', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadMappingTable(broken)).toEqual([])
    expect(() => saveMappingTable(broken, table)).not.toThrow()
    expect(() => saveMappingTable(broken, [])).not.toThrow()
  })

  it('passes migrations through load', () => {
    const storage = memoryStorage({
      [MAPPING_STORAGE_KEY]: JSON.stringify({ format: 1, old: true }),
    })
    const migration: MappingMigration = {
      from: 1,
      migrate: () => ({
        mappings: [{ source: { kind: 'cc', channel: 1, controller: 9 }, target: level }],
      }),
    }
    expect(loadMappingTable(storage, { migrations: [migration] })).toEqual(
      mapTarget([], { source: { kind: 'cc', channel: 1, controller: 9 }, target: level }),
    )
  })
})
