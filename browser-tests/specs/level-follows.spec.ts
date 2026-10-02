// A sounding clip that is turned down, in a real browser: it has to be heard
// to come down as the edit lands, and not as its room dies away. The clip
// here sits far back, with more room than clip (`spaceDb` 6), which is where
// a room left ringing gives the edit away: 30 dB down on the clip was 5 dB
// down on what was heard half a second later.

import { expect, test } from '@playwright/test'

import type { LevelFollowMeasure } from '../harness/level-follow'
import { collectPageErrors } from './page-errors'

const CASES = {
  // Turned down 30 dB while it sounds.
  down: { fromDb: 0, toDb: -30, spaceDb: 6 },
  // The same clip at −30 dB all along: where the first has to arrive.
  low: { fromDb: -30, spaceDb: 6 },
  // Turned up again: the room fills as fast as a room fills.
  up: { fromDb: -30, toDb: 0, spaceDb: 6 },
  loud: { fromDb: 0, spaceDb: 6 },
  // One of two clips on the track turned down, and the two as that leaves them.
  oneOfTwo: { fromDb: 0, toDb: -30, spaceDb: 6, besideDb: 0 },
  oneOfTwoLow: { fromDb: -30, spaceDb: 6, besideDb: 0 },
} as const

test.describe('a clip turned down while it sounds, in real audio', () => {
  let measured: Record<keyof typeof CASES, LevelFollowMeasure>

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate(
      (cases) => window.liveMixHarness.measureLevelFollow(cases),
      CASES,
    )
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('is down with its room a tenth of a second later', () => {
    const { down, low } = measured
    expect(down.beforeDb - low.beforeDb).toBeGreaterThan(29)
    // All 30 dB, where the room alone would still hold it 25 dB up.
    expect(Math.abs(down.soonDb - low.soonDb)).toBeLessThan(1.5)
  })

  test('stays where it was put while the room comes back to level', () => {
    // What is sent in meanwhile rings a little longer: under a dB of it.
    expect(Math.abs(measured.down.laterDb - measured.low.laterDb)).toBeLessThan(1.5)
  })

  test('does not click', () => {
    // No step between two samples is larger than the sound's own, at the louder of its two levels.
    const { down, up, loud, oneOfTwo } = measured
    expect(down.stepAround).toBeLessThanOrEqual(down.stepBefore * 1.1)
    expect(oneOfTwo.stepAround).toBeLessThanOrEqual(oneOfTwo.stepBefore * 1.1)
    expect(up.stepAround).toBeLessThanOrEqual(loud.stepBefore * 1.1)
  })

  test('turned up, it fills the room at the room’s pace and ends as loud as it would have been', () => {
    const { up, loud } = measured
    expect(up.soonDb).toBeLessThan(loud.soonDb - 1)
    expect(Math.abs(up.laterDb - loud.laterDb)).toBeLessThan(0.5)
  })

  test('one of two clips turned down leaves the other as loud as it was', () => {
    const { oneOfTwo, oneOfTwoLow } = measured
    // The other clip's room is dipped by the first one's share for a moment.
    expect(Math.abs(oneOfTwo.soonDb - oneOfTwoLow.soonDb)).toBeLessThan(1.5)
    expect(Math.abs(oneOfTwo.laterDb - oneOfTwoLow.laterDb)).toBeLessThan(0.5)
  })
})
