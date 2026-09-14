import { describe, expect, it } from 'vitest'

import { LOCAL_AUTHOR, OperationLog, parseLog, serializeLog, type Author } from '../log'
import { applyWithInverse, type Operation } from '../operations'
import { createScore, normaliseScore, type Score } from '../schema'
import { demoScore } from './fixtures'

const agent: Author = { id: 'coach', kind: 'agent' }

function record(
  log: OperationLog,
  score: Score,
  op: Operation,
  author = LOCAL_AUTHOR,
  atMs = 0,
): Score {
  const { score: after, inverse } = applyWithInverse(score, op)
  log.append({ op, inverse, author, atMs, kind: 'apply' }, after)
  return after
}

describe('OperationLog', () => {
  it('appends dense sequence numbers and keeps author and time per entry', () => {
    const initial = normaliseScore(demoScore())
    const log = new OperationLog(initial)
    let score = record(log, initial, { type: 'strip.mute', owner: 'kick', mute: true }, agent, 5)
    score = record(
      log,
      score,
      { type: 'strip.set', owner: 'kick', param: 'level', value: 0.3 },
      LOCAL_AUTHOR,
      9,
    )
    expect(log.length).toBe(2)
    expect(log.lastSeq).toBe(2)
    expect(log.entries.map((entry) => entry.seq)).toEqual([1, 2])
    expect(log.entry(1)).toMatchObject({ author: agent, atMs: 5, kind: 'apply' })
    expect(log.entry(2)?.author).toBe(LOCAL_AUTHOR)
    expect(log.since(1).map((entry) => entry.seq)).toEqual([2])
    expect(log.initial).toBe(initial)
    expect(log.scoreAt(2)).toEqual(score)
  })

  it('checkpoints every N entries and replays from the nearest one', () => {
    const initial = normaliseScore(demoScore())
    const log = new OperationLog(initial, { checkpointEvery: 3 })
    let score = initial
    const seen: Score[] = [initial]
    for (let step = 1; step <= 7; step += 1) {
      score = record(log, score, {
        type: 'strip.set',
        owner: 'kick',
        param: 'level',
        value: step / 10,
      })
      seen.push(score)
    }
    expect(log.checkpoints.map((checkpoint) => checkpoint.seq)).toEqual([0, 3, 6])
    for (let seq = 0; seq <= 7; seq += 1) expect(log.scoreAt(seq)).toEqual(seen[seq])
    expect(() => log.scoreAt(8)).toThrow(RangeError)
    log.checkpoint(score)
    expect(log.checkpoints.map((checkpoint) => checkpoint.seq)).toEqual([0, 3, 6, 7])
    log.checkpoint(score)
    expect(log.checkpoints).toHaveLength(4)
  })

  it('serialises and parses with entries and checkpoints intact', () => {
    const initial = normaliseScore(demoScore())
    const log = new OperationLog(initial, { checkpointEvery: 2 })
    let score = initial
    score = record(log, score, { type: 'clip.move', track: 'kick', id: 'b1', startSec: 7 })
    score = record(log, score, { type: 'track.remove', id: 'pad' }, agent)
    score = record(log, score, { type: 'score.rename', name: 'after' })
    const json = serializeLog(log)
    const parsed = parseLog(json, { checkpointEvery: 2 })
    expect(parsed.entries).toEqual(log.entries)
    expect(parsed.checkpoints.map((checkpoint) => checkpoint.seq)).toEqual([0, 2])
    expect(parsed.scoreAt(3)).toEqual(score)
    expect(parsed.scoreAt(1)).toEqual(log.scoreAt(1))
    expect(JSON.parse(json)).toMatchObject({ format: 1 })
  })

  it('rejects malformed logs', () => {
    expect(() => parseLog('{"format":2}')).toThrow(/unsupported/)
    expect(() => parseLog({ format: 1, entries: [], checkpoints: [] })).toThrow(/checkpoint 0/)
    const good = new OperationLog(createScore()).toJSON()
    expect(() =>
      parseLog({ ...good, entries: [{ seq: 1, op: { type: 'nope' }, inverse: { type: 'nope' } }] }),
    ).toThrow(/malformed log entry/)
    expect(() =>
      parseLog({ ...good, checkpoints: [...good.checkpoints, { seq: 5, score: createScore() }] }),
    ).toThrow(/outside the log/)
  })
})
