// Every way on every sound there is: the bank's and every pack's. Whatever a
// way has takes on, its takes keep what a take keeps (./ways-support.ts), and
// no way is in the table for the sake of a sound or two. Nothing is rendered.

import { describe, expect, it } from 'vitest'

import { FACTORY_SOUNDS, WAYS, WAY_FAMILIES, wayTakes, waysFor } from '..'
import { loadFactoryPackSounds } from '../sound-packs'
import { type FactorySound } from '../types'
import { takeProblems } from './ways-support'

const SEEDS = [1, 77]
const FAR = 0.5

/** What is wrong with any take of any way on these sounds, at both seeds. */
function problems(sounds: readonly FactorySound[]): string[] {
  const out: string[] = []
  for (const sound of sounds) {
    for (const seed of SEEDS) {
      for (const way of waysFor(sound, { seed, far: FAR })) {
        for (const problem of takeProblems(sound, way, seed, FAR)) {
          out.push(`${sound.id} ${way} seed ${seed}: ${problem}`)
        }
      }
    }
  }
  return out
}

describe('the ways on every sound there is', () => {
  it('are twenty, in six families, each with a row of its own', () => {
    expect(WAYS).toHaveLength(20)
    expect(new Set(WAYS.map((way) => way.id)).size).toBe(20)
    expect(new Set(WAYS.map((way) => way.name)).size).toBe(20)
    expect([...new Set(WAYS.map((way) => way.family))]).toEqual(
      WAY_FAMILIES.map((family) => family.id),
    )
  })

  it('keep what a take keeps on every sound of the bank', () => {
    expect(problems(FACTORY_SOUNDS)).toEqual([])
  }, 120000)

  it('keep what a take keeps on every sound of every pack', async () => {
    expect(problems(await loadFactoryPackSounds())).toEqual([])
  }, 600000)

  it('each have takes on five sounds of the bank or more', () => {
    for (const way of WAYS) {
      const reach = FACTORY_SOUNDS.filter(
        (sound) => wayTakes(sound, { way: way.id, seed: 1 }).takes > 0,
      )
      expect(reach.length, way.id).toBeGreaterThanOrEqual(5)
    }
  }, 120000)
})
