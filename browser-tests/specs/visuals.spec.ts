// The visuals, drawn in a real browser from the built entry: each of the
// styles in both its variations, each bend over a style, a canvas left to
// `showVisuals`, and one painted from frames that went down a line. A shader
// that does not compile, or one that draws nothing, shows here and nowhere
// else.

import { expect, test } from '@playwright/test'

import type { Measured } from '../harness/visuals'
import { collectPageErrors } from './page-errors'

/** A picture: some of it is lit, and it is not one flat tone. */
function expectPicture(seen: Measured, what: string): void {
  expect(seen.drawn, `${what} is drawn`).toBe(true)
  expect(seen.lit, `${what} is lit somewhere`).toBeGreaterThan(0.01)
  expect(seen.spread, `${what} is not one flat tone`).toBeGreaterThan(0.5)
}

test.describe('the visuals, in a real browser', () => {
  // Some forty shaders are made one after another, and a machine without a
  // graphics card makes and draws each in software.
  test.setTimeout(900_000)

  test('every style draws a picture in both its variations', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/visuals.html')
    await page.waitForFunction(() => window.visualsHarness !== undefined)
    expect(await page.evaluate(() => window.visualsHarness.ready())).toBe(true)

    const styles = await page.evaluate(() => window.visualsHarness.styles())
    expect(styles).toHaveLength(41)
    for (const id of styles) {
      for (const variation of [0, 1] as const) {
        const seen = await page.evaluate(
          ([style, which]) => window.visualsHarness.style(style, which),
          [id, variation] as const,
        )
        expectPicture(seen, `${id} ${variation === 0 ? 'a' : 'b'}`)
      }
    }
    expect(errors).toEqual([])
  })

  test('a piece draws its style, each bend works on it, and a canvas is painted by itself', async ({
    page,
  }) => {
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/visuals.html')
    await page.waitForFunction(() => window.visualsHarness !== undefined)

    expectPicture(
      await page.evaluate(() => window.visualsHarness.piece('dot-globe', null)),
      'a piece with one style',
    )
    for (const bend of await page.evaluate(() => window.visualsHarness.bends())) {
      expectPicture(
        await page.evaluate((id) => window.visualsHarness.piece('dot-globe', id), bend),
        `a piece with ${bend} over its style`,
      )
    }

    const shown = await page.evaluate(() => window.visualsHarness.shown('dot-globe', 1500))
    expect(shown.started).toBe(true)
    expectPicture(shown, 'the canvas `showVisuals` paints')
    expect(errors).toEqual([])
  })

  test('a frame sent down a line is the picture a second screen paints', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/visuals.html')
    await page.waitForFunction(() => window.visualsHarness !== undefined)

    const sent = await page.evaluate(() => window.visualsHarness.sent('dot-globe', 2500))
    expect(sent.started).toBe(true)
    expect(sent.watched, 'the sender heard the screen').toBe(true)
    expect(sent.live, 'the screen got frames').toBe(true)
    expectPicture(sent, 'the canvas painted from what the line carried')
    expect(errors).toEqual([])
  })
})
