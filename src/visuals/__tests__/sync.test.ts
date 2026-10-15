import { describe, expect, it } from 'vitest'

import { SYNC_SURE, SyncScope } from '../sync'

/** A sound that comes in at each of `starts`, up over `riseSec`, and goes again slowly. */
const swell =
  (starts: readonly number[], riseSec = 0.03, fallSec = 0.6) =>
  (at: number): number => {
    let level = 0
    for (const start of starts) {
      const into = at - start
      if (into < 0) continue
      level = Math.max(
        level,
        into < riseSec ? into / riseSec : Math.exp(-(into - riseSec) / fallSec),
      )
    }
    return level
  }

/** Puts a trace down every `everySec` from 0 to `untilSec`, as it stood `lateSec` before. */
function put(
  scope: SyncScope,
  trace: string,
  level: (at: number) => number,
  untilSec: number,
  everySec: number,
  lateSec = 0,
): void {
  for (let at = 0; at <= untilSec; at += everySec) scope.put(trace, at, level(at - lateSec))
}

const STARTS = [1.2, 2.9, 4.1, 6.4, 7.7, 9.3]

describe('how far one trace is behind another', () => {
  it('is nothing for two that move together', () => {
    const scope = new SyncScope()
    put(scope, 'sound', swell(STARTS), 10, 0.005)
    put(scope, 'picture', swell(STARTS), 10, 0.005)
    const reading = scope.behind('picture', 'sound', 10)
    expect(reading?.behindSec).toBeCloseTo(0, 2)
    expect(reading?.alike).toBeGreaterThan(0.95)
  })

  it.each([0.04, 0.12, 0.35, 1.0])('finds a picture that is %s s late', (late) => {
    const scope = new SyncScope()
    put(scope, 'sound', swell(STARTS), 10, 0.005)
    put(scope, 'picture', swell(STARTS), 10, 0.005, late)
    const reading = scope.behind('picture', 'sound', 10)
    expect(reading?.behindSec).toBeCloseTo(late, 2)
    expect(reading?.alike).toBeGreaterThan(SYNC_SURE)
  })

  it('reads under nothing for a picture that moves first', () => {
    const scope = new SyncScope()
    put(scope, 'sound', swell(STARTS), 10, 0.005, 0.2)
    put(scope, 'picture', swell(STARTS), 10, 0.005)
    expect(scope.behind('picture', 'sound', 10)?.behindSec).toBeCloseTo(-0.2, 2)
  })

  it('finds it for a picture that is painted thirty times a second, to within a frame', () => {
    const scope = new SyncScope()
    put(scope, 'sound', swell(STARTS), 10, 0.005)
    put(scope, 'picture', swell(STARTS), 10, 1 / 30, 0.2)
    const reading = scope.behind('picture', 'sound', 10)
    // What is painted stays until the next frame: half a frame is the picture's own.
    expect(reading?.behindSec).toBeGreaterThan(0.2 - 0.005)
    expect(reading?.behindSec).toBeLessThan(0.2 + 1 / 30 + 0.005)
  })

  it('goes by where the two come in, not by how they go', () => {
    const scope = new SyncScope()
    put(scope, 'sound', swell(STARTS, 0.03, 0.2), 10, 0.005)
    put(scope, 'picture', swell(STARTS, 0.03, 1.5), 10, 0.005, 0.1)
    // A sound that comes in while the one before still shows has less far to rise: a few milliseconds of it.
    const behind = scope.behind('picture', 'sound', 10)?.behindSec ?? Number.NaN
    expect(Math.abs(behind - 0.1)).toBeLessThan(0.015)
  })

  it('does not mind that one is quieter than the other', () => {
    const scope = new SyncScope()
    const sound = swell(STARTS)
    put(scope, 'sound', sound, 10, 0.005)
    put(scope, 'picture', (at) => 0.1 + 0.15 * sound(at), 10, 0.005, 0.08)
    const reading = scope.behind('picture', 'sound', 10)
    expect(reading?.behindSec).toBeCloseTo(0.08, 2)
    expect(reading?.alike).toBeGreaterThan(0.9)
  })

  it('finds it for a picture that only brightens a little', () => {
    const scope = new SyncScope()
    const sound = swell(STARTS)
    put(scope, 'sound', sound, 10, 0.005)
    put(scope, 'picture', (at) => 0.013 + 0.012 * sound(at), 10, 1 / 30, 0.06)
    const reading = scope.behind('picture', 'sound', 10)
    expect(reading?.behindSec).toBeGreaterThan(0.055)
    expect(reading?.behindSec).toBeLessThan(0.06 + 1 / 30 + 0.005)
    expect(reading?.alike).toBeGreaterThan(SYNC_SURE)
  })

  it('says nothing of a picture that only flickers, and is not sure of one that flickers more', () => {
    const flicker = (by: number) => {
      const scope = new SyncScope()
      put(scope, 'sound', swell(STARTS), 10, 0.005)
      let seed = 3
      put(scope, 'picture', () => 0.2 + by * ((seed = (seed * 73 + 41) % 256) / 255), 10, 1 / 30)
      return scope.behind('picture', 'sound', 10)
    }
    expect(flicker(0.0015)).toBeNull()
    expect(flicker(0.02)?.alike).toBeLessThan(SYNC_SURE)
  })

  it('says nothing where one of the two did not move', () => {
    const scope = new SyncScope()
    put(scope, 'sound', swell(STARTS), 10, 0.005)
    put(scope, 'picture', () => 0.4, 10, 0.005)
    expect(scope.behind('picture', 'sound', 10)).toBeNull()
    expect(scope.behind('sound', 'picture', 10)).toBeNull()
  })

  it('says nothing of a trace that was never put down', () => {
    const scope = new SyncScope()
    put(scope, 'sound', swell(STARTS), 10, 0.005)
    expect(scope.behind('picture', 'sound', 10)).toBeNull()
    expect(scope.has('picture')).toBe(false)
    expect(scope.has('sound')).toBe(true)
  })

  it('fits poorly where the two follow other things', () => {
    const scope = new SyncScope()
    put(scope, 'sound', swell([1.2, 4.1, 7.7]), 10, 0.005)
    put(scope, 'picture', (at) => 0.5 + 0.5 * Math.sin(at * 9.1), 10, 0.005)
    const reading = scope.behind('picture', 'sound', 10)
    expect(reading === null || reading.alike < SYNC_SURE).toBe(true)
  })

  it('looks at the last span only', () => {
    const scope = new SyncScope({ spanSec: 4 })
    // Late by 0.4 s at first, in step from the tenth second on.
    const sound = swell([1, 3, 5, 7, 11.2, 12.9, 14.1, 15.3])
    const run = (from: number, to: number) => {
      for (let at = from; at < to; at += 0.005) {
        scope.put('sound', at, sound(at))
        scope.put('picture', at, sound(at - (at < 10 ? 0.4 : 0)))
      }
    }
    run(0, 8)
    expect(scope.behind('picture', 'sound', 8)?.behindSec).toBeCloseTo(0.4, 2)
    run(8, 16)
    expect(scope.behind('picture', 'sound', 16)?.behindSec).toBeCloseTo(0, 2)
  })
})

describe('a picture that hardly moves, and one that has just begun', () => {
  it('holds a picture that only brightens a hundredth against the sound', () => {
    const scope = new SyncScope()
    put(scope, 'sound', swell(STARTS), 10, 0.005)
    put(scope, 'picture', (at) => 0.044 + 0.005 * swell(STARTS)(at), 10, 1 / 60, 0.1)
    const reading = scope.behind('picture', 'sound', 10)
    expect(reading?.behindSec).toBeCloseTo(0.1, 1)
    expect(reading?.alike).toBeGreaterThan(SYNC_SURE)
  })

  it('does not take the first reading of a trace for a rise', () => {
    const scope = new SyncScope()
    put(scope, 'sound', swell([6.4, 7.7, 9.3]), 10, 0.005)
    // The picture is first read at second 5, lit as it stands, and then follows the sound a tenth of a second late.
    for (let at = 5; at <= 10; at += 1 / 60)
      scope.put('picture', at, 0.3 + 0.5 * swell([6.4, 7.7, 9.3])(at - 0.1))
    expect(scope.behind('picture', 'sound', 10)?.behindSec).toBeCloseTo(0.1, 1)
    // With nothing but that first reading in it, there is nothing to tell.
    const still = new SyncScope()
    put(still, 'sound', swell([6.4]), 10, 0.005)
    for (let at = 5; at <= 10; at += 1 / 60) still.put('picture', at, 0.3)
    expect(still.behind('picture', 'sound', 10)).toBeNull()
  })
})

describe('what is put down', () => {
  it('is kept as it came, and held until the next', () => {
    const scope = new SyncScope()
    scope.put('picture', 1, 0.2)
    scope.put('picture', 2, 0.8)
    expect(Array.from(scope.line('picture', 0, 3, 7))).toEqual(
      [0, 0, 0.2, 0.2, 0.8, 0.8, 0.8].map((level) => Math.fround(level)),
    )
  })

  it('leaves out what comes out of turn, and what is no number', () => {
    const scope = new SyncScope()
    scope.put('picture', 2, 0.5)
    scope.put('picture', 1, 0.9)
    scope.put('picture', 2, 0.9)
    scope.put('picture', Number.NaN, 0.9)
    scope.put('picture', 3, Number.NaN)
    expect(Array.from(scope.line('picture', 0, 4, 5))).toEqual([0, 0, 0.5, 0.5, 0.5])
  })

  it('lets go of what is older than it looks at', () => {
    const scope = new SyncScope({ spanSec: 2, reachSec: 0.5 })
    for (let at = 0; at < 600; at += 0.01) scope.put('sound', at, (at * 3) % 1)
    const kept = (scope as unknown as { traces: Map<string, { at: number[] }> }).traces.get('sound')
    expect(kept?.at.length).toBeLessThan(600)
    expect(kept?.at[0]).toBeLessThanOrEqual(600 - 2.5)
    // And still says what it stood at where the span starts.
    expect(scope.line('sound', 597.5, 600, 2)[0]).toBeGreaterThan(0)
  })

  it('says how often a trace is put down', () => {
    const scope = new SyncScope()
    for (let at = 0; at <= 10; at += 1 / 30) scope.put('picture', at, 0)
    expect(scope.rate('picture', 10)).toBeCloseTo(30, 0)
    expect(scope.rate('sound', 10)).toBe(0)
  })

  it('says the longest it went without being put down', () => {
    const scope = new SyncScope()
    for (const at of [1, 1.1, 1.2, 1.9, 2, 2.1]) scope.put('picture', at, 0)
    expect(scope.longest('picture', 3)).toBeCloseTo(0.7, 10)
    // Only what is in the span, and nothing for a trace put down once or never.
    expect(scope.longest('picture', 9.95)).toBeCloseTo(0.1, 10)
    expect(scope.longest('picture', 10.05)).toBe(0)
    expect(scope.longest('sound', 3)).toBe(0)
  })

  it('forgets everything when it is cleared', () => {
    const scope = new SyncScope()
    scope.put('sound', 1, 1)
    scope.clear()
    expect(scope.has('sound')).toBe(false)
  })
})
