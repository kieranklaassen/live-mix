// A render gives its memory back, in a real browser. Chromium keeps an
// offline context that a worklet module was loaded on, with the buffer it
// rendered into, until its document goes: 23 MB a minute of stereo at 48 kHz,
// at every render of a mix with a reverb, a limiter or the ducker in it. A
// context made in a frame that is removed after the render is let go.
//
// The framed renders come first, in a page that has made no offline context
// of its own: after one the page made with a worklet on it, Chromium keeps
// some of the framed ones as well.

import { expect, test } from '@playwright/test'

import { collectPageErrors } from './page-errors'

const RENDERS = 3

test.describe('a render on a context in a frame of its own', () => {
  let kept: number
  let keptByPage: number
  let difference: number
  let nodes: { made: number; byFrame: number }

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    const session = await page.context().newCDPSession(page)
    /** A weak reference is cleared by a collection, once the task that last read it is over. */
    const collect = async (): Promise<void> => {
      for (let pass = 0; pass < 3; pass += 1) {
        await session.send('HeapProfiler.collectGarbage')
        await page.waitForTimeout(100)
      }
    }
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')

    await page.evaluate((times) => window.liveMixHarness.renderAndLetGo('frame', times), RENDERS)
    await collect()
    kept = await page.evaluate(() => window.liveMixHarness.rendersKept('frame'))
    nodes = await page.evaluate(() => window.liveMixHarness.framedNodesMade())

    await page.evaluate(() => window.liveMixHarness.renderAndLetGo('page', 1))
    await collect()
    keptByPage = await page.evaluate(() => window.liveMixHarness.rendersKept('page'))
    difference = await page.evaluate(() => window.liveMixHarness.framedRenderDifference())

    expect(errors, 'no page errors while rendering').toEqual([])
    await page.close()
  })

  test('is let go with the buffer it rendered into, once its frame is taken away', () => {
    test.info().annotations.push({
      // Of a context and a buffer a render: what this browser kept in a frame, and of one render by the page.
      type: 'kept',
      description: JSON.stringify({ renders: RENDERS, frame: kept, page: keptByPage }),
    })
    expect(kept).toBe(0)
  })

  test("has its worklet nodes made by its frame's own constructor", () => {
    // Chromium on Linux lets a framed context go with either constructor; Electron on a Mac did not.
    expect(nodes.made).toBe(2 * RENDERS)
    expect(nodes.byFrame).toBe(nodes.made)
  })

  test('is the same sound as a render on a context of the page', () => {
    // Two renders of this session by the page differ by a rounding of the last bit (6e-8), and no more.
    expect(difference).toBeLessThan(1e-6)
  })
})
