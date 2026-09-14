import { describe, expect, it, vi } from 'vitest'

import { type Author } from '../log'
import { ScoreOperationError } from '../operations'
import { createScore, normaliseScore, parseScore, serializeScore } from '../schema'
import { ScoreDocument, type ScoreChange } from '../ScoreDocument'
import { demoScore } from './fixtures'

const agent: Author = { id: 'coach', kind: 'agent' }

function level(document: ScoreDocument, owner: string): number {
  const host = [...document.score.tracks, ...document.score.groups].find(
    (candidate) => candidate.id === owner,
  )
  if (!host) throw new Error(owner)
  return host.strip.level
}

describe('ScoreDocument', () => {
  it('applies operations, logs them with author and time, and notifies listeners', () => {
    let clock = 1000
    const document = new ScoreDocument(demoScore(), { now: () => clock })
    const changes: ScoreChange[] = []
    document.onChange((change) => changes.push(change))
    const before = document.score
    const entry = document.apply({ type: 'strip.mute', owner: 'kick', mute: true })
    expect(document.score).not.toBe(before)
    expect(document.score.tracks[0].strip.mute).toBe(true)
    expect(entry).toMatchObject({
      seq: 1,
      kind: 'apply',
      atMs: 1000,
      author: { id: 'local', kind: 'human' },
    })
    expect(document.log.entries).toEqual([entry])
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({
      kind: 'apply',
      previous: before,
      score: document.score,
      entry,
    })

    clock = 2000
    const agentEntry = document.apply(
      { type: 'strip.set', owner: 'kick', param: 'level', value: 0.4 },
      { author: agent, label: 'softer under voice' },
    )
    expect(agentEntry).toMatchObject({
      seq: 2,
      author: agent,
      atMs: 2000,
      label: 'softer under voice',
    })
    expect(document.history.peekUndo()?.label).toBe('softer under voice')
  })

  it('a failed operation changes nothing', () => {
    const document = new ScoreDocument(demoScore())
    const listener = vi.fn()
    document.onChange(listener)
    const before = document.score
    expect(() => document.apply({ type: 'strip.mute', owner: 'nobody', mute: true })).toThrow(
      ScoreOperationError,
    )
    expect(document.score).toBe(before)
    expect(document.log.length).toBe(0)
    expect(document.canUndo).toBe(false)
    expect(listener).not.toHaveBeenCalled()
  })

  it('undo and redo apply the stored inverse/operation and append to the log', () => {
    let clock = 0
    const document = new ScoreDocument(demoScore(), { now: () => clock })
    document.apply({ type: 'strip.mute', owner: 'kick', mute: true })
    document.apply({ type: 'clip.move', track: 'kick', id: 'b1', startSec: 9 })
    expect(document.canUndo).toBe(true)

    clock = 50
    const undone = document.undo({ author: agent })
    expect(undone).toMatchObject({ seq: 3, kind: 'undo', ref: 2, author: agent, atMs: 50 })
    expect(undone?.op).toEqual({ type: 'clip.move', track: 'kick', id: 'b1', startSec: 4 })
    expect(document.canRedo).toBe(true)

    const redone = document.redo()
    expect(redone).toMatchObject({ seq: 4, kind: 'redo', ref: 2 })
    const kick = document.score.tracks[0]
    if (kick.kind !== 'audio') throw new Error('fixture')
    expect(kick.clips.find((clip) => clip.id === 'b1')?.startSec).toBe(9)

    document.undo()
    document.undo()
    expect(document.canUndo).toBe(false)
    expect(document.undo()).toBeNull()
    expect(normaliseScore(document.score)).toEqual(normaliseScore(demoScore()))
    expect(document.log.length).toBe(6)
    // The log is append-only: nothing was rewound, and replay reproduces every state.
    expect(document.log.scoreAt(6)).toEqual(document.score)
    expect(document.redo()).not.toBeNull()
    expect(document.redo()).not.toBeNull()
    expect(document.redo()).toBeNull()
  })

  it('a knob drag is one undo step: undo returns to the start, redo to the end', () => {
    let clock = 0
    const document = new ScoreDocument(demoScore(), { now: () => clock })
    for (let step = 1; step <= 10; step += 1) {
      clock += 16
      document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.8 - step * 0.05 })
    }
    expect(level(document, 'kick')).toBeCloseTo(0.3)
    expect(document.log.length).toBe(10)
    expect(document.history.undoStack).toHaveLength(1)
    document.undo()
    expect(level(document, 'kick')).toBe(0.8)
    document.redo()
    expect(level(document, 'kick')).toBeCloseTo(0.3)
    expect(document.log.entries.at(-1)).toMatchObject({ kind: 'redo', ref: 10 })
  })

  it('endGesture() and explicit gesture ids split continuous edits into steps', () => {
    const document = new ScoreDocument(demoScore(), { now: () => 0 })
    document.apply(
      { type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 },
      { gesture: 'g1' },
    )
    document.apply(
      { type: 'strip.set', owner: 'kick', param: 'level', value: 0.4 },
      { gesture: 'g1' },
    )
    document.apply(
      { type: 'strip.set', owner: 'kick', param: 'level', value: 0.3 },
      { gesture: 'g2' },
    )
    expect(document.history.undoStack).toHaveLength(2)
    document.endGesture()
    document.apply(
      { type: 'strip.set', owner: 'kick', param: 'level', value: 0.2 },
      { gesture: 'g2' },
    )
    expect(document.history.undoStack).toHaveLength(3)
    document.undo()
    expect(level(document, 'kick')).toBe(0.3)
    document.undo()
    expect(level(document, 'kick')).toBe(0.4)
  })

  it('load replaces the score, restarts the log and clears history', () => {
    const document = new ScoreDocument(demoScore())
    document.apply({ type: 'strip.mute', owner: 'kick', mute: true })
    const changes: ScoreChange[] = []
    document.onChange((change) => changes.push(change))
    const fresh = createScore({ id: 'fresh' })
    document.load(serializeScore(fresh))
    expect(document.score).toEqual(fresh)
    expect(document.log.length).toBe(0)
    expect(document.log.initial).toEqual(fresh)
    expect(document.canUndo).toBe(false)
    expect(changes[0]).toMatchObject({ kind: 'load', score: fresh })
    document.load(demoScore())
    expect(document.score.id).toBe('demo')
  })

  it('serialises and parses', () => {
    const document = new ScoreDocument(demoScore())
    const json = document.serialize()
    expect(parseScore(json)).toEqual(normaliseScore(demoScore()))
    const parsed = ScoreDocument.parse(json, { author: agent })
    expect(parsed.score).toEqual(normaliseScore(demoScore()))
    expect(parsed.author).toBe(agent)
    expect(parsed.apply({ type: 'score.rename', name: 'x' }).author).toBe(agent)
  })

  it('listeners can unsubscribe', () => {
    const document = new ScoreDocument(demoScore())
    const listener = vi.fn()
    const off = document.onChange(listener)
    document.apply({ type: 'score.rename', name: 'a' })
    off()
    document.apply({ type: 'score.rename', name: 'b' })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
