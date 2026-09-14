import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ARBITRATION_POLICY,
  DEFAULT_DEFER_TTL_MS,
  DEFAULT_HOLD_MS,
  HoldTable,
  WRITER_KINDS,
  decide,
  formatPolicyTable,
  policyTable,
  resolvePolicy,
  type ArbitrationDecision,
  type WriterKind,
} from '../arbitration'

const human = { id: 'local', kind: 'human' as const }
const midi = { id: 'midi', kind: 'controller' as const }
const coach = { id: 'coach', kind: 'agent' as const }
const rails = { id: 'rails', kind: 'system' as const }

describe('the policy table', () => {
  it('pins the documented matrix: rank, holds, defer/drop', () => {
    const expected: Record<WriterKind, Record<WriterKind | 'free', ArbitrationDecision>> = {
      system: {
        free: 'apply',
        system: 'apply',
        human: 'apply',
        controller: 'apply',
        agent: 'apply',
        automation: 'apply',
      },
      human: {
        free: 'apply',
        system: 'drop',
        human: 'apply',
        controller: 'apply',
        agent: 'apply',
        automation: 'apply',
      },
      controller: {
        free: 'apply',
        system: 'drop',
        human: 'apply',
        controller: 'apply',
        agent: 'apply',
        automation: 'apply',
      },
      agent: {
        free: 'apply',
        system: 'defer',
        human: 'defer',
        controller: 'defer',
        agent: 'apply',
        automation: 'apply',
      },
      automation: {
        free: 'apply',
        system: 'drop',
        human: 'drop',
        controller: 'drop',
        agent: 'drop',
        automation: 'apply',
      },
    }
    for (const row of policyTable()) {
      expect(row.against, row.writer).toEqual(expected[row.writer])
      expect(row.holds).toBe(row.writer === 'human' || row.writer === 'controller')
    }
    expect(WRITER_KINDS).toEqual(['system', 'human', 'controller', 'agent', 'automation'])
    expect(DEFAULT_HOLD_MS).toBe(5000)
    expect(DEFAULT_DEFER_TTL_MS).toBe(15000)
    expect(DEFAULT_ARBITRATION_POLICY.automationResume).toBe('after-hold')
  })

  it('renders as Markdown with one row per writer kind', () => {
    const table = formatPolicyTable()
    const lines = table.split('\n')
    expect(lines).toHaveLength(2 + WRITER_KINDS.length)
    expect(lines[0]).toContain('held by')
    expect(lines[2]).toMatch(/^\| system \| apply \| apply \| apply \| apply \| apply \| apply \| no \|$/)
    expect(lines[3]).toContain('yes (5000 ms)')
  })

  it('resolvePolicy merges per field and clamps times', () => {
    const policy = resolvePolicy({
      holdMs: -1,
      onHeld: { agent: 'drop' },
      rank: { controller: 2 },
      automationResume: 'manual',
    })
    expect(policy.holdMs).toBe(0)
    expect(policy.onHeld.agent).toBe('drop')
    expect(policy.onHeld.automation).toBe('drop')
    expect(policy.rank.controller).toBe(2)
    expect(policy.rank.human).toBe(3)
    expect(policy.automationResume).toBe('manual')
    // With the controller demoted, a human hold now defers/drops it per onHeld.
    expect(decide(policy, 'controller', 'human')).toBe('drop')
    expect(decide(policy, 'agent', 'controller')).toBe('apply')
  })
})

describe('HoldTable', () => {
  it('a write holds for holdMs, a touch holds until release plus holdMs, expiry returns what lapsed', () => {
    const table = new HoldTable({ holdMs: 1000 })
    table.write('a', human, 0)
    expect(table.holderOf('a', 999)).toEqual(human)
    expect(table.holderOf('a', 1000)).toBeNull()
    expect(table.nextExpiryMs()).toBe(1000)

    table.touch('b', human, 0)
    expect(table.holderOf('b', 1_000_000)).toEqual(human)
    expect(table.nextExpiryMs()).toBe(1000)
    expect(table.release('b', 5000, midi)).toBeUndefined()
    expect(table.release('b', 5000, human)?.untilMs).toBe(6000)
    expect(table.expire(1000)).toMatchObject({ holds: [{ target: 'a' }], locks: [] })
    expect(table.holds.map((hold) => hold.target)).toEqual(['b'])
    expect(table.expire(6000).holds.map((hold) => hold.target)).toEqual(['b'])
    expect(table.nextExpiryMs()).toBeNull()
  })

  it('a write during a touch by the same owner keeps the touch; another owner takes over', () => {
    const table = new HoldTable({ holdMs: 1000 })
    table.touch('a', human, 0)
    expect(table.write('a', human, 10).touching).toBe(true)
    const taken = table.write('a', midi, 20)
    expect(taken.touching).toBe(false)
    expect(taken.owner).toEqual(midi)
    expect(taken.untilMs).toBe(1020)
  })

  it('locks outrank holds until they lapse or lift', () => {
    const table = new HoldTable({ holdMs: 1000 })
    table.write('a', human, 0)
    table.lock('a', rails, 500, 'fade-out')
    expect(table.holderOf('a', 100)).toEqual(rails)
    expect(table.holderOf('a', 500)).toEqual(human)
    expect(table.lockOf('a')?.reason).toBe('fade-out')
    expect(table.expire(500).locks).toHaveLength(1)
    table.lock('b', coach, Infinity)
    expect(table.nextExpiryMs()).toBe(1000)
    expect(table.unlock('b')?.owner).toEqual(coach)
    expect(table.unlock('b')).toBeUndefined()
    table.reset()
    expect(table.holds).toEqual([])
  })
})
