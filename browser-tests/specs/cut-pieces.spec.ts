// A placed clip cut in two, in a real browser: the two pieces rendered on a
// real OfflineAudioContext against the clip whole. Where the cut is a voice
// stops and the next goes on, each through a low-pass of its own, and the
// two add up to the whole only if the first's low-pass rings out after its
// source has ended. A stereo voice's did not: its filter started again from
// nothing in the block of the render after the one it ended in, so the most
// was lost where it ended on a block.

import { expect, test } from '@playwright/test'

import type { CutMeasure } from '../harness/cut-pieces'
import { collectPageErrors } from './page-errors'

/** The frames a browser renders at a time. */
const BLOCK = 128
/** On a block, and on a whole wave of the swell's tone. */
const CUT = 150 * BLOCK

const WHOLE = {
  stereoOnBlock: { channels: 2, cutFrame: CUT, lowpassHz: 1000 },
  stereoInBlock: { channels: 2, cutFrame: CUT + 64, lowpassHz: 1000 },
  stereoLastOfBlock: { channels: 2, cutFrame: CUT - 1, lowpassHz: 1000 },
  stereoOpen: { channels: 2, cutFrame: CUT, lowpassHz: 6000 },
  stereoDull: { channels: 2, cutFrame: CUT + 64, lowpassHz: 200 },
  stereoJoined: { channels: 2, cutFrame: CUT, lowpassHz: 1000, joinClips: true },
  monoOnBlock: { channels: 1, cutFrame: CUT, lowpassHz: 1000 },
  monoJoined: { channels: 1, cutFrame: CUT + 64, lowpassHz: 200, joinClips: true },
  // A first piece cut at rest and a second that repeats and comes up there: joined, the first tails under it.
  swellStereo: { sound: 'swell', channels: 2, cutFrame: CUT, lowpassHz: 1000, joinClips: true },
  swellMono: { sound: 'swell', channels: 1, cutFrame: CUT, lowpassHz: 6000, joinClips: true },
} as const

/**
 * How near the whole each has to be, in dB under full scale. Two voices added
 * where one played differ in the last bits of a sample: the noise is 135 to
 * 163 dB under with the low-pass at 1000 and 6000 Hz, and the swell at
 * 6000 Hz 134 dB. The rest is the browser's. It lets a filter go, a few
 * blocks after its input has ended, once its ring is under a sample of 16
 * bits: with the low-pass at 200 Hz the pieces of noise are 104 dB under, one
 * channel or two. And its filter rounds as it goes, more the lower it is set:
 * the swell under a low-pass at 1000 Hz is 118 dB under, as a level crossed
 * from one bare source to another through two filters is with no engine.
 */
const UNDER: Record<keyof typeof WHOLE, number> = {
  stereoOnBlock: -120,
  stereoInBlock: -120,
  stereoLastOfBlock: -120,
  stereoOpen: -120,
  stereoDull: -100,
  stereoJoined: -120,
  monoOnBlock: -120,
  monoJoined: -100,
  swellStereo: -108,
  swellMono: -120,
}

const CASES = {
  ...WHOLE,
  // Not joined, each is let in and out by itself: the first stops square and the second comes up from silence.
  swellAlone: { sound: 'swell', channels: 2, cutFrame: CUT, lowpassHz: 1000 },
} as const

test.describe('a placed clip cut in two in real audio', () => {
  let measured: Record<keyof typeof CASES, CutMeasure>

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate((cases) => window.liveMixHarness.measureCutPieces(cases), CASES)
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('the whole file has sound in it to lose', () => {
    for (const name of Object.keys(CASES) as (keyof typeof CASES)[]) {
      expect(measured[name].peakDb, name).toBeGreaterThan(-40)
    }
  })

  for (const name of Object.keys(WHOLE) as (keyof typeof WHOLE)[]) {
    test(`the two pieces are the whole: ${name}`, () => {
      // Before its low-pass kept its channels a stereo voice was 33 to 38 dB
      // under full scale from the whole where it stopped on a block or at
      // 200 Hz, and 77 dB where it stopped inside a block at 1000 Hz. Before
      // a first cut at rest tailed, the swell dipped as it does not joined.
      expect(measured[name].differenceDb).toBeLessThan(UNDER[name])
    })
  }

  test('pieces that are not joined dip where the second comes up from silence', () => {
    // What the join is for, and that the measure sees it: the swell stands at 0.3 where it is cut.
    expect(measured.swellAlone.differenceDb).toBeGreaterThan(-20)
    expect(measured.swellAlone.framesAfterCut).toBeGreaterThanOrEqual(0)
    expect(measured.swellAlone.framesAfterCut).toBeLessThan(240)
  })
})
