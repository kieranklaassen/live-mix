// Parity with ambient-live's U27 `midi-map` layer (app/frontend/audio/
// midi-map.ts @ 972aa15): the same scenarios its tests assert, run through
// this library's table, resolution, learn and persistence, plus the format-1
// migration of its serialised table. When these hold, ambient-live can delete
// its copy and keep its users' stored tables.

import { describe, expect, it } from 'vitest'

import { type ControlEvent } from '../event'
import {
  IDLE_LEARN,
  isMapped,
  learnFromEvent,
  mapTarget,
  mappingFor,
  resolveControlEvent,
  unmapTarget,
  type ControlChange,
  type MappingTable,
} from '../mapping'
import { MidiDecoder } from '../midi'
import {
  AMBIENT_LIVE_MIDI_MAP_FORMAT,
  MAPPING_TABLE_FORMAT,
  ambientLiveMidiMapMigration,
  loadMappingTable,
  parseMappingTable,
  serializeMappingTable,
} from '../serialize'
import { type ControlTarget } from '../target'

// ambient-live's `ControlTargetId`s and where they land in the engine.
const AMBIENT_TARGETS: Record<string, ControlTarget> = {
  'reverb.mix': { kind: 'device', device: 'reverb', param: 'mix' },
  'reverb.decay': { kind: 'device', device: 'reverb', param: 'decay' },
  'reverb.damping': { kind: 'device', device: 'reverb', param: 'damping' },
  'reverb.predelayMs': { kind: 'device', device: 'reverb', param: 'predelayMs' },
  'master.gain': { kind: 'master', control: 'level' },
  'synth.level': { kind: 'strip', track: 'synth', control: 'level' },
  'synth.pan': { kind: 'strip', track: 'synth', control: 'pan' },
  'clips.level': { kind: 'strip', track: 'clips', control: 'level' },
  'clips.pan': { kind: 'strip', track: 'clips', control: 'pan' },
  'input.level': { kind: 'strip', track: 'input', control: 'level' },
  'input.pan': { kind: 'strip', track: 'input', control: 'pan' },
  // `input.monitor` was a toggle gating the live-input strip; mute is its inverse and the
  // app flips the sense in its `output` span ({ min: 1, max: 0 }) if it keeps the label.
  'input.monitor': { kind: 'strip', track: 'input', control: 'mute' },
}

const targetFor = (id: string): ControlTarget | null => AMBIENT_TARGETS[id] ?? null
const migration = ambientLiveMidiMapMigration(targetFor)

const decoder = new MidiDecoder({ pair14Bit: false })
const midi = (...bytes: number[]): ControlEvent => decoder.decode(Uint8Array.from(bytes))[0]
const cc = (controller: number, value: number, channel = 1): ControlEvent =>
  midi(0xb0 | (channel - 1), controller, value)
const noteOn = (note: number, velocity = 100, channel = 1): ControlEvent =>
  midi(0x90 | (channel - 1), note, velocity)
const noteOff = (note: number, channel = 1): ControlEvent => midi(0x80 | (channel - 1), note, 0)

/** U27's `ControlChange` shape from this library's, for side-by-side assertions. */
function u27(changes: ControlChange[]): unknown[] {
  return changes.map((change) => {
    switch (change.kind) {
      case 'set':
        return { target: change.target, action: 'set', unit: change.unit }
      case 'toggle':
        return { target: change.target, action: 'toggle' }
      case 'nudge':
      case 'trigger':
        return { target: change.target, action: change.kind }
      default: {
        const exhaustive: never = change
        return exhaustive
      }
    }
  })
}

describe('U27 serialised table (format 1) migration', () => {
  // Exactly what `serializeMidiMap` wrote under `ambient-live:midi-map`.
  const stored = JSON.stringify({
    format: AMBIENT_LIVE_MIDI_MAP_FORMAT,
    mappings: [
      { source: { kind: 'cc', channel: 1, controller: 74 }, target: 'reverb.mix' },
      { source: { kind: 'cc', channel: 1, controller: 74 }, target: 'reverb.decay' },
      { source: { kind: 'cc', channel: 1, controller: 20 }, target: 'input.monitor' },
      { source: { kind: 'note', channel: 10, note: 36 }, target: 'input.monitor' },
      { source: { kind: 'note', channel: 1, note: 37 }, target: 'synth.level' },
    ],
  })

  it('is refused without the migration and converted with it, keeping U27 semantics per entry', () => {
    expect(parseMappingTable(stored)).toEqual([])
    const table = parseMappingTable(stored, { migrations: [migration] })
    expect(table.map((mapping) => [mapping.source, mapping.target, mapping.mode])).toEqual([
      [{ kind: 'cc', channel: 1, controller: 74 }, AMBIENT_TARGETS['reverb.mix'], 'set'],
      [{ kind: 'cc', channel: 1, controller: 74 }, AMBIENT_TARGETS['reverb.decay'], 'set'],
      // Two U27 entries for `input.monitor` collapse to one (one source per target): the later wins.
      [{ kind: 'note', channel: 10, note: 36 }, AMBIENT_TARGETS['input.monitor'], 'toggle'],
      [{ kind: 'note', channel: 1, note: 37 }, AMBIENT_TARGETS['synth.level'], 'set'],
    ])
    // Once saved it is a format-2 table and loads without the migration.
    expect(parseMappingTable(serializeMappingTable(table))).toEqual(table)
    expect(JSON.parse(serializeMappingTable(table)).format).toBe(MAPPING_TABLE_FORMAT)
  })

  it('drops the same malformed entries U27 dropped, plus unknown app ids', () => {
    const mixed = {
      format: AMBIENT_LIVE_MIDI_MAP_FORMAT,
      mappings: [
        { source: { kind: 'cc', channel: 1, controller: 74 }, target: 'reverb.mix' },
        { source: { kind: 'cc', channel: 17, controller: 74 }, target: 'reverb.decay' },
        { source: { kind: 'cc', channel: 1, controller: 200 }, target: 'reverb.decay' },
        { source: { kind: 'pitch', channel: 1 }, target: 'reverb.decay' },
        { source: { kind: 'cc', channel: 1, controller: 1 }, target: 'reverb.size' },
        'garbage',
        { source: { kind: 'cc', channel: 1, controller: 2 }, target: 'reverb.mix' },
      ],
    }
    expect(parseMappingTable(mixed, { migrations: [migration] })).toMatchObject([
      { source: { kind: 'cc', channel: 1, controller: 2 }, target: AMBIENT_TARGETS['reverb.mix'] },
    ])
    expect(parseMappingTable('not json', { migrations: [migration] })).toEqual([])
    expect(parseMappingTable({ format: 99, mappings: [] }, { migrations: [migration] })).toEqual([])
  })

  it('loads the stored key through the storage adapter with the migration', () => {
    const storage = new Map<string, string>([['ambient-live:midi-map', stored]])
    const table = loadMappingTable(
      {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => void storage.set(key, value),
        removeItem: (key) => void storage.delete(key),
      },
      { key: 'ambient-live:midi-map', migrations: [migration] },
    )
    expect(table).toHaveLength(4)
  })
})

describe('U27 resolveMidiEvent scenarios', () => {
  const table: MappingTable = parseMappingTable(
    {
      format: AMBIENT_LIVE_MIDI_MAP_FORMAT,
      mappings: [
        { source: { kind: 'cc', channel: 1, controller: 74 }, target: 'reverb.mix' },
        { source: { kind: 'cc', channel: 1, controller: 74 }, target: 'reverb.decay' },
        { source: { kind: 'cc', channel: 1, controller: 20 }, target: 'input.monitor' },
        { source: { kind: 'note', channel: 1, note: 37 }, target: 'synth.level' },
      ],
    },
    { migrations: [migration] },
  )
  // U27 allowed a note and a CC on the same target only as separate tables; here the
  // note binding for the toggle lives beside the CC one on a second target.
  const withPad = mapTarget(table, {
    source: { kind: 'note', channel: 1, note: 36 },
    target: { kind: 'strip', track: 'input', control: 'solo' },
    mode: 'toggle',
  })

  it('turns a CC into a 0..1 set on every target bound to it', () => {
    expect(u27(resolveControlEvent(table, cc(74, 127)))).toEqual([
      { target: AMBIENT_TARGETS['reverb.mix'], action: 'set', unit: 1 },
      { target: AMBIENT_TARGETS['reverb.decay'], action: 'set', unit: 1 },
    ])
    expect(resolveControlEvent(table, cc(74, 0, 2))).toEqual([])
  })

  it('sets toggles from a CC switch and flips them from a note press', () => {
    expect(u27(resolveControlEvent(table, cc(20, 127)))).toEqual([
      { target: AMBIENT_TARGETS['input.monitor'], action: 'set', unit: 1 },
    ])
    expect(u27(resolveControlEvent(withPad, noteOn(36)))).toEqual([
      { target: { kind: 'strip', track: 'input', control: 'solo' }, action: 'toggle' },
    ])
    expect(resolveControlEvent(withPad, noteOff(36))).toEqual([])
  })

  it('sets a continuous target from note velocity and ignores the release', () => {
    expect(u27(resolveControlEvent(table, noteOn(37, 127)))).toEqual([
      { target: AMBIENT_TARGETS['synth.level'], action: 'set', unit: 1 },
    ])
    expect(resolveControlEvent(table, noteOff(37))).toEqual([])
  })

  it('reports which events the map consumes (a mapped note never reaches the synth)', () => {
    expect(isMapped(withPad, noteOn(36))).toBe(true)
    expect(isMapped(withPad, noteOff(37))).toBe(true)
    expect(isMapped(withPad, noteOn(60))).toBe(false)
    expect(isMapped(withPad, cc(1, 1))).toBe(false)
  })

  it('works end to end from raw bytes with the same unit U27 produced', () => {
    expect(u27(resolveControlEvent(table, cc(74, 64)))[0]).toEqual({
      target: AMBIENT_TARGETS['reverb.mix'],
      action: 'set',
      unit: 64 / 127,
    })
  })

  it('binds one source per target, replaces on rebind, unbinds per target', () => {
    let edited: MappingTable = []
    edited = mapTarget(edited, {
      source: { kind: 'cc', channel: 1, controller: 74 },
      target: AMBIENT_TARGETS['reverb.mix'],
    })
    edited = mapTarget(edited, {
      source: { kind: 'cc', channel: 1, controller: 71 },
      target: AMBIENT_TARGETS['reverb.mix'],
    })
    expect(edited).toHaveLength(1)
    expect(mappingFor(edited, AMBIENT_TARGETS['reverb.mix'])?.source).toEqual({
      kind: 'cc',
      channel: 1,
      controller: 71,
    })
    edited = mapTarget(edited, {
      source: { kind: 'cc', channel: 1, controller: 1 },
      target: AMBIENT_TARGETS['clips.level'],
    })
    edited = unmapTarget(edited, AMBIENT_TARGETS['reverb.mix'])
    expect(edited.map((mapping) => mapping.target)).toEqual([AMBIENT_TARGETS['clips.level']])
  })
})

describe('U27 learn scenarios', () => {
  it('is a no-op while idle', () => {
    const outcome = learnFromEvent(IDLE_LEARN, [], cc(74, 1))
    expect(outcome.consumed).toBe(false)
    expect(outcome.table).toEqual([])
  })

  it('binds the armed target to the next CC and returns to idle, consuming the event', () => {
    const outcome = learnFromEvent({ target: AMBIENT_TARGETS['reverb.mix'] }, [], cc(74, 1, 3))
    expect(outcome.consumed).toBe(true)
    expect(outcome.learn.target).toBeNull()
    expect(outcome.table).toMatchObject([
      { source: { kind: 'cc', channel: 3, controller: 74 }, target: AMBIENT_TARGETS['reverb.mix'] },
    ])
  })

  it('binds to a note press but keeps waiting through a release', () => {
    const monitor = AMBIENT_TARGETS['input.monitor']
    const waiting = learnFromEvent({ target: monitor }, [], noteOff(36))
    expect(waiting.consumed).toBe(false)
    expect(waiting.learn).toEqual({ target: monitor })
    const bound = learnFromEvent(waiting.learn, waiting.table, noteOn(36))
    expect(bound.table[0]).toMatchObject({
      source: { kind: 'note', channel: 1, note: 36 },
      target: monitor,
      mode: 'toggle',
    })
  })
})

describe('migration outputFor (ambient-live #28)', () => {
  it('carries knob ranges as output spans so no post-pass is needed', () => {
    const withSpans = ambientLiveMidiMapMigration(targetFor, {
      outputFor: (target, id) => {
        if (id === 'reverb.decay' || id === 'reverb.damping') return { min: 0, max: 0.99 }
        if (target.kind === 'strip' && target.control === 'mute') return { min: 1, max: 0 }
        return undefined
      },
    })
    const table = parseMappingTable(
      {
        format: AMBIENT_LIVE_MIDI_MAP_FORMAT,
        mappings: [
          { source: { kind: 'cc', channel: 1, controller: 74 }, target: 'reverb.decay' },
          { source: { kind: 'cc', channel: 1, controller: 75 }, target: 'reverb.mix' },
          { source: { kind: 'note', channel: 1, note: 36 }, target: 'input.monitor' },
        ],
      },
      { migrations: [withSpans] },
    )
    expect(table).toMatchObject([
      { target: AMBIENT_TARGETS['reverb.decay'], mode: 'set', output: { min: 0, max: 0.99 } },
      { target: AMBIENT_TARGETS['reverb.mix'], mode: 'set', output: { min: 0, max: 1 } },
      { target: AMBIENT_TARGETS['input.monitor'], mode: 'toggle', output: { min: 1, max: 0 } },
    ])
  })
})
