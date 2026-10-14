// A placed clip cut in two, in a real browser: the two pieces rendered on a
// real OfflineAudioContext against the clip whole. Where the cut is a voice
// stops and the next goes straight on, each through a low-pass of its own,
// and the two add up to the whole only if the first's low-pass rings out
// after its source has ended. A stereo voice's did not: its filter started
// again from nothing in the block of the render after the one it stopped in,
// so the most was lost where the cut fell on a block.

import { expect, test } from '@playwright/test'

import type { CutMeasure } from '../harness/cut-pieces'
import { collectPageErrors } from './page-errors'

/** The frames a browser renders at a time. */
const BLOCK = 128

const CASES = {
  stereoOnBlock: { channels: 2, cutFrame: 150 * BLOCK, lowpassHz: 1000 },
  stereoInBlock: { channels: 2, cutFrame: 150 * BLOCK + 64, lowpassHz: 1000 },
  stereoLastOfBlock: { channels: 2, cutFrame: 150 * BLOCK - 1, lowpassHz: 1000 },
  stereoOpen: { channels: 2, cutFrame: 150 * BLOCK, lowpassHz: 6000 },
  stereoDull: { channels: 2, cutFrame: 150 * BLOCK + 64, lowpassHz: 200 },
  stereoJoined: { channels: 2, cutFrame: 150 * BLOCK, lowpassHz: 1000, joinClips: true },
  monoOnBlock: { channels: 1, cutFrame: 150 * BLOCK, lowpassHz: 1000 },
  monoJoined: { channels: 1, cutFrame: 150 * BLOCK + 64, lowpassHz: 200, joinClips: true },
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

  for (const name of Object.keys(CASES) as (keyof typeof CASES)[]) {
    test(`the two pieces are the whole: ${name}`, () => {
      // Two voices added where one played differ in the last bits of a
      // sample: 135 dB under full scale and less. A browser also lets a
      // filter go, a few blocks after its input has ended, once its ring is
      // under a sample of 16 bits: with the low-pass at 200 Hz the pieces
      // are 104 dB under full scale from the whole, one channel or two.
      // Before its low-pass kept its channels a stereo voice was 33 to 38 dB
      // under full scale from it where it stopped on a block or at 200 Hz,
      // and 77 dB where it stopped inside a block at 1000 Hz.
      expect(measured[name].differenceDb).toBeLessThan(-100)
    })
  }
})
