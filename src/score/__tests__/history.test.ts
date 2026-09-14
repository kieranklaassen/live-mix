import { describe, expect, it } from 'vitest'

import { History, type HistoryPush } from '../history'
import { type Author } from '../log'
import { type Operation } from '../operations'

const human: Author = { id: 'kieran', kind: 'human' }
const agent: Author = { id: 'coach', kind: 'agent' }

function level(value: number): Operation {
  return { type: 'strip.set', owner: 'kick', param: 'level', value }
}

function push(
  history: History,
  seq: number,
  op: Operation,
  atMs: number,
  extra: Partial<HistoryPush> = {},
) {
  return history.push({
    seq,
    op,
    inverse: { type: 'strip.set', owner: 'kick', param: 'level', value: seq - 1 },
    author: human,
    atMs,
    ...extra,
  })
}

describe('History coalescing', () => {
  it('folds same-key operations from one author inside the window into one step', () => {
    const history = new History({ coalesceWindowMs: 500 })
    const first = push(history, 1, level(0.1), 1000)
    const second = push(history, 2, level(0.2), 1200)
    const third = push(history, 3, level(0.3), 1600)
    expect(first).toBe(second)
    expect(second).toBe(third)
    expect(history.undoStack).toHaveLength(1)
    const step = history.peekUndo()
    expect(step).toMatchObject({ seq: 1, lastSeq: 3, count: 3, atMs: 1000, lastAtMs: 1600 })
    // Undo restores where the hand started; redo lands where it let go.
    expect(step?.inverse).toEqual({ type: 'strip.set', owner: 'kick', param: 'level', value: 0 })
    expect(step?.op).toEqual(level(0.3))
  })

  it('a gap longer than the window starts a new step', () => {
    const history = new History({ coalesceWindowMs: 500 })
    push(history, 1, level(0.1), 1000)
    push(history, 2, level(0.2), 1501)
    expect(history.undoStack).toHaveLength(2)
  })

  it('a different key, author or a discrete edit never coalesces', () => {
    const history = new History()
    push(history, 1, level(0.1), 0)
    push(history, 2, { type: 'strip.set', owner: 'kick', param: 'pan', value: 0 }, 10)
    push(history, 3, level(0.2), 20, { author: agent })
    push(history, 4, { type: 'strip.mute', owner: 'kick', mute: true }, 30)
    push(history, 5, { type: 'strip.mute', owner: 'kick', mute: false }, 40)
    expect(history.undoStack).toHaveLength(5)
  })

  it('explicit gesture ids coalesce regardless of time and separate otherwise-continuous ops', () => {
    const history = new History({ coalesceWindowMs: 500 })
    push(history, 1, level(0.1), 0, { gesture: 'drag-1' })
    push(history, 2, level(0.2), 60_000, { gesture: 'drag-1' })
    expect(history.undoStack).toHaveLength(1)
    push(history, 3, level(0.3), 60_010, { gesture: 'drag-2' })
    expect(history.undoStack).toHaveLength(2)
    // A tagged op never folds into an untagged one, nor the reverse.
    push(history, 4, level(0.4), 60_020)
    expect(history.undoStack).toHaveLength(3)
    push(history, 5, level(0.5), 60_030, { gesture: 'drag-3' })
    expect(history.undoStack).toHaveLength(4)
  })

  it('seal() ends a gesture: the next same-key op is a new step', () => {
    const history = new History()
    push(history, 1, level(0.1), 0)
    history.seal()
    push(history, 2, level(0.2), 10)
    push(history, 3, level(0.3), 20)
    expect(history.undoStack.map((step) => step.count)).toEqual([1, 2])
  })

  it('labels follow the latest operation unless given', () => {
    const history = new History()
    push(history, 1, level(0.1), 0)
    const step = push(history, 2, level(0.25), 10)
    expect(step.label).toBe('kick level → 0.25')
    push(history, 3, { type: 'strip.mute', owner: 'kick', mute: true }, 20, { label: 'Mute kick' })
    expect(history.peekUndo()?.label).toBe('Mute kick')
  })
})

describe('History undo/redo stacks', () => {
  it('moves steps between the stacks and seals the gesture', () => {
    const history = new History()
    push(history, 1, level(0.1), 0)
    push(history, 2, { type: 'strip.mute', owner: 'kick', mute: true }, 10)
    expect(history.canUndo).toBe(true)
    expect(history.canRedo).toBe(false)
    const undone = history.takeUndo()
    expect(undone?.seq).toBe(2)
    expect(history.canRedo).toBe(true)
    expect(history.peekRedo()).toBe(undone)
    const redone = history.takeRedo()
    expect(redone).toBe(undone)
    expect(history.undoStack).toHaveLength(2)
    expect(history.takeRedo()).toBeUndefined()
    // After an undo the next continuous op starts a fresh step.
    history.takeUndo()
    push(history, 3, level(0.2), 20)
    expect(history.undoStack.map((step) => step.seq)).toEqual([1, 3])
    expect(history.canRedo).toBe(false)
  })

  it('a new push clears the redo stack and the depth limit drops the oldest', () => {
    const history = new History({ limit: 2 })
    push(history, 1, { type: 'strip.mute', owner: 'a', mute: true }, 0)
    push(history, 2, { type: 'strip.mute', owner: 'b', mute: true }, 0)
    push(history, 3, { type: 'strip.mute', owner: 'c', mute: true }, 0)
    expect(history.undoStack.map((step) => step.seq)).toEqual([2, 3])
    history.takeUndo()
    push(history, 4, { type: 'strip.mute', owner: 'd', mute: true }, 0)
    expect(history.canRedo).toBe(false)
    history.clear()
    expect(history.canUndo).toBe(false)
  })
})
