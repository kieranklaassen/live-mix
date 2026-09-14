import { describe, expect, it } from 'vitest'

import { describeFieldChange, diffScores } from '../diff'
import { apply } from '../operations'
import { clip, demoScore } from './fixtures'

describe('diffScores', () => {
  it('identical documents differ nowhere; a field edit is one change with an id path', () => {
    const before = demoScore()
    expect(diffScores(before, demoScore())).toEqual([])
    const after = apply(before, { type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 })
    expect(diffScores(before, after)).toEqual([
      { path: 'tracks[kick].strip.level', kind: 'changed', before: 0.8, after: 0.5 },
    ])
  })

  it('lists of identified records match by id: added, removed, moved, nested edits', () => {
    const before = demoScore()
    let after = apply(before, { type: 'clip.add', track: 'kick', clip: clip('c9', 'a', 20) })
    after = apply(after, { type: 'clip.remove', track: 'kick', id: 'a1' })
    after = apply(after, { type: 'track.move', id: 'voice', index: 0 })
    after = apply(after, {
      type: 'device.setParam',
      device: 'kick-filter',
      param: 'frequency',
      value: 500,
    })
    const changes = diffScores(before, after)
    expect(changes.map((change) => [change.path, change.kind])).toEqual([
      ['tracks[voice]', 'moved'],
      ['tracks[kick]', 'moved'],
      ['tracks[kick].clips[c9]', 'added'],
      ['tracks[kick].clips[a1]', 'removed'],
      ['tracks[kick].strip.inserts[kick-filter].params.frequency', 'changed'],
      ['tracks[pad]', 'moved'],
    ])
    // A removal alone shifts indices but is not a move.
    expect(
      diffScores(before, apply(before, { type: 'clip.remove', track: 'kick', id: 'a1' })),
    ).toEqual([{ path: 'tracks[kick].clips[a1]', kind: 'removed', before: before.tracks[0].clips[0] }])
    expect(changes[0]).toMatchObject({ before: 2, after: 0 })
    expect(changes.find((change) => change.kind === 'added')?.after).toMatchObject({ id: 'c9' })
  })

  it('unidentified lists (breakpoints, tempo) match by index; scalars and nulls compare by value', () => {
    const before = demoScore()
    let after = apply(before, {
      type: 'lane.addBreakpoint',
      id: 'pad-level',
      breakpoint: { timeSec: 2, value: 0.5 },
    })
    after = apply(after, { type: 'transport.loop', enabled: true, lengthSec: 8 })
    after = apply(after, { type: 'send.set', owner: 'kick', target: 'hall', level: null })
    const changes = diffScores(before, after)
    expect(changes).toEqual([
      { path: 'lanes[pad-level].breakpoints[1].curve', kind: 'removed', before: 'smooth' },
      { path: 'lanes[pad-level].breakpoints[1].timeSec', kind: 'changed', before: 4, after: 2 },
      { path: 'lanes[pad-level].breakpoints[1].value', kind: 'changed', before: 0.8, after: 0.5 },
      {
        path: 'lanes[pad-level].breakpoints[2]',
        kind: 'added',
        after: { timeSec: 4, value: 0.8, curve: 'smooth' },
      },
      { path: 'tracks[kick].strip.sends[0].level', kind: 'changed', before: 0.25, after: null },
      { path: 'transport.loop.enabled', kind: 'changed', before: false, after: true },
      { path: 'transport.loop.lengthSec', kind: 'changed', before: null, after: 8 },
    ])
  })

  it('describes changes in one line each', () => {
    expect(
      describeFieldChange({ path: 'tracks[kick].strip.level', kind: 'changed', before: 0.8, after: 0.5 }),
    ).toBe('tracks[kick].strip.level 0.800 → 0.500')
    expect(describeFieldChange({ path: 'tracks[x]', kind: 'added', after: { id: 'x' } })).toBe(
      'tracks[x] added x',
    )
    expect(describeFieldChange({ path: 'tracks[x]', kind: 'removed', before: [1, 2] })).toBe(
      'tracks[x] removed [2]',
    )
    expect(describeFieldChange({ path: 'tracks[x]', kind: 'moved', before: 0, after: 2 })).toBe(
      'tracks[x] moved 0 → 2',
    )
    expect(describeFieldChange({ path: 'name', kind: 'changed', before: 'a', after: 'b' })).toBe(
      'name "a" → "b"',
    )
  })
})
