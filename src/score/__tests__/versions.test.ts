import { describe, expect, it } from 'vitest'

import { Arbiter } from '../Arbiter'
import { type Author } from '../log'
import { type Operation } from '../operations'
import { findStripHost, serializeScore } from '../schema'
import { ScoreDocument } from '../ScoreDocument'
import {
  VersionHistory,
  parseStoredVersion,
  type VersionEvent,
  type VersionHistoryOptions,
} from '../versions'
import {
  byteLength,
  memoryVersionStorage,
  webStorageVersionStorage,
  type VersionStorage,
} from '../versionStorage'
import { clip, demoScore } from './fixtures'

const human: Author = { id: 'local', kind: 'human' }
const coach: Author = { id: 'coach', kind: 'agent' }

interface Rig {
  document: ScoreDocument
  versions: VersionHistory
  clock: { ms: number }
  events: VersionEvent[]
  level: (owner?: string) => number
  set: (value: number, author?: Author) => void
}

function rig(options: VersionHistoryOptions = {}): Rig {
  const clock = { ms: 1000 }
  const document = new ScoreDocument(demoScore(), { now: () => clock.ms })
  let counter = 0
  const versions = new VersionHistory(document, {
    now: () => clock.ms,
    id: () => `v${++counter}`,
    ...options,
  })
  const events: VersionEvent[] = []
  versions.onChange((event) => events.push(event))
  const level = (owner = 'kick'): number => findStripHost(document.score, owner)?.strip.level ?? NaN
  const set = (value: number, author = human): void => {
    clock.ms += 10
    document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value }, { author })
  }
  return { document, versions, clock, events, level, set }
}

describe('VersionHistory: save, list, restore', () => {
  it('starts with an automatic start checkpoint and saves named versions as deltas', () => {
    const { versions, set } = rig()
    expect(versions.list()).toMatchObject([
      { id: 'v1', label: 'Session start', kind: 'auto', milestone: 'start', base: 'full', seq: 0 },
    ])
    set(0.5)
    set(0.6)
    const saved = versions.save('quieter kick')
    expect(saved).toMatchObject({
      id: 'v2',
      label: 'quieter kick',
      kind: 'manual',
      base: 'delta',
      opCount: 2,
      parent: 'v1',
      seq: 2,
      author: human,
    })
    expect(versions.scoreOf('v2')).toEqual(versions.document.score)
    expect(versions.scoreOf('v1')).toEqual(demoScore())
    expect(saved.bytes).toBeLessThan(versions.list()[0].bytes / 4)
  })

  it('restore is one undoable operation, attributed, and undo brings the current state back', () => {
    const { versions, document, set, level } = rig()
    set(0.5)
    versions.save('half')
    set(0.9)
    const result = versions.restore('v2', { author: coach })
    expect(result.outcome).toBe('applied')
    expect(result.entry).toMatchObject({
      author: coach,
      label: 'restore "half"',
      op: { type: 'score.replace' },
    })
    expect(level()).toBe(0.5)
    expect(document.undo()).not.toBeNull()
    expect(level()).toBe(0.9)
    expect(document.redo()).not.toBeNull()
    expect(level()).toBe(0.5)
    // Restoring the start checkpoint goes back to the original document, undo returns again.
    versions.restore('v1')
    expect(level()).toBe(0.8)
    document.undo()
    expect(level()).toBe(0.5)
    expect(() => versions.restore('nope')).toThrow(/no version/)
  })

  it('a restore through the arbiter waits for a held target and lands afterwards', () => {
    const { document, clock, level } = rig()
    const arbiter = new Arbiter(document, {
      now: () => clock.ms,
      setTimeoutFn: () => 0,
      clearTimeoutFn: () => {},
    })
    let counter = 0
    const versions = new VersionHistory(document, { now: () => clock.ms, arbiter, id: () => `a${++counter}` })
    document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 })
    versions.save('half')
    arbiter.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.9 }, { author: human })
    const deferred = versions.restore('a1', { author: coach })
    expect(deferred.outcome).toBe('deferred')
    expect(level()).toBe(0.9)
    clock.ms += 5000
    arbiter.tick()
    expect(level()).toBe(0.8)
    expect(versions.restore('a2', { author: human }).outcome).toBe('applied')
    expect(level()).toBe(0.5)
  })

  it('checkpoints name their milestones and the load of a new document starts a new one', () => {
    const { versions, document, events } = rig()
    versions.checkpoint('section', 'Settle')
    versions.checkpoint('end')
    expect(versions.list().map((version) => [version.label, version.milestone])).toEqual([
      ['Session start', 'start'],
      ['Settle', 'section'],
      ['Session end', 'end'],
    ])
    document.load(demoScore())
    expect(versions.list()).toHaveLength(4)
    expect(versions.list()[3]).toMatchObject({ milestone: 'start', base: 'full' })
    expect(events.filter((event) => event.type === 'saved')).toHaveLength(3)
    const quiet = rig({ autoCheckpoints: false })
    expect(quiet.versions.list()).toEqual([])
  })

  it('remove promotes the dependent delta to a full base; clear empties everything', () => {
    const { versions, set } = rig()
    set(0.5)
    versions.save('a')
    set(0.6)
    versions.save('b')
    expect(versions.remove('v1')).toBe(true)
    expect(versions.remove('v1')).toBe(false)
    expect(versions.list()).toMatchObject([
      { id: 'v2', base: 'full', parent: null },
      { id: 'v3', base: 'delta', parent: 'v2' },
    ])
    expect(findStripHost(versions.scoreOf('v3'), 'kick')?.strip.level).toBe(0.6)
    expect(findStripHost(versions.scoreOf('v2'), 'kick')?.strip.level).toBe(0.5)
    versions.clear()
    expect(versions.list()).toEqual([])
    expect(versions.bytes).toBe(0)
  })
})

describe('VersionHistory: diff', () => {
  it('reports the operations between two versions and the fields that differ', () => {
    const { versions, document, set } = rig()
    set(0.5, coach)
    document.apply({ type: 'clip.add', track: 'kick', clip: clip('c9', 'a', 20) })
    versions.save('two edits')
    set(0.7)
    versions.save('three')
    const diff = versions.diff('v1', 'v3')
    expect(diff.operations?.map((op) => [op.seq, op.op.type, op.author.id])).toEqual([
      [1, 'strip.set', 'coach'],
      [2, 'clip.add', 'local'],
      [3, 'strip.set', 'local'],
    ])
    expect(diff.fields.map((change) => [change.path, change.kind])).toEqual([
      ['tracks[kick].clips[c9]', 'added'],
      ['tracks[kick].strip.level', 'changed'],
    ])
    expect(versions.diff('v2', 'v3').operations).toHaveLength(1)
    expect(versions.diff('v3', 'v3')).toMatchObject({ operations: [], fields: [] })
    // Backwards: fields still diff, operations are unknowable.
    const back = versions.diff('v3', 'v1')
    expect(back.operations).toBeNull()
    expect(back.fields[0]).toMatchObject({ path: 'tracks[kick].clips[c9]', kind: 'removed' })
  })

  it('diffs across a load from the stored slices, or reports null when a link lost its slice', () => {
    const { versions, document, set } = rig({ budgetBytes: 400 })
    set(0.5)
    versions.save('a')
    document.load(demoScore())
    set(0.4)
    versions.save('b')
    // v1 → v2 is in the old log; the slice is stored on v2 and still walks.
    expect(versions.diff('v1', 'v2').operations).toHaveLength(1)
    // v3 (the new start) is a full base without ops: nothing links v2 to v4.
    expect(versions.diff('v2', 'v4').operations).toBeNull()
    expect(versions.diff('v3', 'v4').operations).toHaveLength(1)
    // A slice over budget is not kept, so the version stores a full score and diffs by field only.
    for (let index = 0; index < 20; index += 1) {
      document.apply({ type: 'clip.add', track: 'kick', clip: clip(`x${index}`, 'a', 30 + index) })
    }
    const big = versions.save('big')
    expect(big).toMatchObject({ base: 'full', opCount: null })
    expect(versions.diff('v4', big.id).operations).toHaveLength(20) // still in the live log
    document.load(demoScore())
    expect(versions.diff('v4', big.id).operations).toBeNull()
    expect(versions.diff('v4', big.id).fields.length).toBeGreaterThan(19)
  })
})

describe('VersionHistory: compact storage', () => {
  const editsOf = (document: ScoreDocument, count: number): void => {
    for (let index = 0; index < count; index += 1) {
      document.apply({
        type: 'strip.set',
        owner: 'kick',
        param: 'level',
        value: 0.1 + index / 100,
      })
    }
  }

  it('stores deltas while they are small, a full base every fullEvery versions, and prunes to the total budget', () => {
    const { versions, document } = rig({ fullEvery: 3, budgetBytes: 2000 })
    editsOf(document, 2)
    versions.save('one')
    editsOf(document, 2)
    versions.save('two')
    editsOf(document, 2)
    versions.save('three')
    expect(versions.list().map((version) => version.base)).toEqual(['full', 'delta', 'delta', 'full'])
    expect(versions.list()[3].opCount).toBe(2)
    editsOf(document, 30)
    const wide = versions.save('wide')
    expect(wide.base).toBe('full')
    expect(wide.opCount).toBeNull()
    expect(versions.scoreOf('v3')).toEqual(document.log.scoreAt(4))

    const fullBytes = versions.list()[0].bytes
    const budgeted = rig({ totalBudgetBytes: fullBytes * 1.2, fullEvery: 100 })
    for (let index = 0; index < 6; index += 1) {
      editsOf(budgeted.document, 1)
      budgeted.versions.checkpoint('section', `s${index}`)
    }
    expect(budgeted.versions.bytes).toBeLessThanOrEqual(fullBytes * 1.2)
    const ids = budgeted.versions.list().map((version) => version.id)
    expect(ids.length).toBeGreaterThan(1)
    expect(ids[0]).not.toBe('v1')
    expect(ids.at(-1)).toBe('v7')
    expect(budgeted.versions.list()[0].base).toBe('full')
    for (const id of ids) expect(() => budgeted.versions.scoreOf(id)).not.toThrow()
    // Manual versions survive while automatic ones remain to prune.
    const manual = rig({ totalBudgetBytes: fullBytes * 1.15, fullEvery: 100, autoCheckpoints: false })
    manual.versions.save('keep me')
    for (let index = 0; index < 5; index += 1) {
      editsOf(manual.document, 1)
      manual.versions.checkpoint('section')
    }
    const kinds = manual.versions.list().map((version) => version.kind)
    expect(kinds).toEqual(['manual', 'auto'])
    // The surviving checkpoint carries every slice the pruned ones held.
    expect(manual.versions.list()[1]).toMatchObject({ base: 'delta', opCount: 5, parent: 'v1' })
    expect(findStripHost(manual.versions.scoreOf('v6'), 'kick')?.strip.level).toBe(0.1)
    // Named versions push the last checkpoint out, then stay however far over budget they run.
    manual.versions.save('also keep')
    manual.versions.save('and this')
    expect(manual.versions.list().map((version) => version.kind)).toEqual([
      'manual',
      'manual',
      'manual',
    ])
    expect(manual.versions.bytes).toBeGreaterThan(manual.versions.totalBudgetBytes)
  })

  it('round-trips through storage: saves persist, a fresh history opens them and restores from them', async () => {
    const storage = memoryVersionStorage()
    const { versions, document, set } = rig({ storage })
    set(0.5)
    versions.save('half')
    set(0.6)
    versions.checkpoint('section', 'second')
    await versions.flush()
    expect(storage.size).toBe(3)
    expect(storage.bytes).toBe(versions.bytes)

    const reopened = new ScoreDocument(demoScore(), { now: () => 5000 })
    let liveCounter = 0
    const again = new VersionHistory(reopened, {
      storage,
      now: () => 5000,
      id: () => (liveCounter++ === 0 ? 'live' : `live${liveCounter}`),
    })
    const list = await again.open()
    expect(list.map((version) => [version.id, version.label])).toEqual([
      ['v1', 'Session start'],
      ['v2', 'half'],
      ['v3', 'second'],
      ['live', 'Session start'],
    ])
    expect(serializeScore(again.scoreOf('v3'))).toBe(serializeScore(document.score))
    expect(again.restore('v2').outcome).toBe('applied')
    expect(findStripHost(reopened.score, 'kick')?.strip.level).toBe(0.5)
    // Live saves chain among themselves, never onto the stored (dead-log) versions.
    reopened.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.3 })
    const next = again.save('after restore')
    expect(next).toMatchObject({ base: 'delta', parent: 'live', opCount: 2 })
    await again.flush()
    expect(storage.size).toBe(5)
    again.remove('v1')
    await again.flush()
    expect(storage.size).toBe(4)
    expect((await storage.get('v2'))?.score).toBeDefined()
    again.dispose()
  })

  it('a localStorage-like store works the same, and storage errors are reported, not thrown', async () => {
    const backing = new Map<string, string>()
    const web = webStorageVersionStorage(
      {
        getItem: (key) => backing.get(key) ?? null,
        setItem: (key, value) => void backing.set(key, value),
        removeItem: (key) => void backing.delete(key),
      },
      { key: 'test:versions' },
    )
    const { versions, set } = rig({ storage: web })
    set(0.5)
    versions.save('half')
    await versions.flush()
    expect([...backing.keys()].sort()).toEqual(['test:versions', 'test:versions:v1', 'test:versions:v2'])
    expect(await web.list()).toHaveLength(2)
    await web.remove('v1')
    expect(JSON.parse(backing.get('test:versions') ?? '[]')).toEqual(['v2'])
    await web.clear()
    expect(backing.size).toBe(0)

    const errors: unknown[] = []
    const failing: VersionStorage = {
      ...memoryVersionStorage(),
      put: async () => {
        throw new Error('quota')
      },
    }
    const broken = rig({ storage: failing, onError: (error) => errors.push(error) })
    broken.versions.save('x')
    await broken.versions.flush()
    expect(errors).toHaveLength(2)
  })

  it('parseStoredVersion rejects malformed records and fills bytes', () => {
    expect(parseStoredVersion(null)).toBeNull()
    expect(parseStoredVersion({ format: 2 })).toBeNull()
    const base = {
      format: 1,
      id: 'x',
      label: 'x',
      kind: 'manual',
      atMs: 1,
      author: human,
      epoch: 0,
      seq: 0,
      parent: null,
    }
    expect(parseStoredVersion(base)).toBeNull() // neither score nor ops
    expect(parseStoredVersion({ ...base, score: { format: 9 } })).toBeNull()
    expect(parseStoredVersion({ ...base, ops: [{ op: { type: 'nope' } }] })).toBeNull()
    const ok = parseStoredVersion({ ...base, score: demoScore() })
    expect(ok?.bytes).toBe(byteLength(JSON.stringify(ok)))
    const op: Operation = { type: 'score.rename', name: 'y' }
    expect(
      parseStoredVersion({ ...base, ops: [{ seq: 1, op, author: human, atMs: 1, kind: 'apply' }] })?.ops,
    ).toHaveLength(1)
  })
})
