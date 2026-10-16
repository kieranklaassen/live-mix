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

  test('a filter a performance asks for is painted over the picture, and never twice', async ({
    page,
  }) => {
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/visuals.html')
    await page.waitForFunction(() => window.visualsHarness !== undefined)
    const none = { soft: 0, dim: 0, thin: 0, spread: 0 }
    const seen = async (filter: typeof none, style = 'dot-globe') => {
      const both = await page.evaluate(([id, asked]) => window.visualsHarness.filtered(id, asked), [
        style,
        filter,
      ] as const)
      if (!both) throw new Error('the style was never drawn')
      expectPicture(both.plain, 'the frame as it is')
      return both
    }

    const same = await seen(none)
    expect(same.filtered.mean, 'a filter of nothing leaves the light').toBeCloseTo(
      same.plain.mean,
      3,
    )
    expect(same.filtered.detail, 'and the detail').toBeCloseTo(same.plain.detail, 3)

    const soft = await seen({ ...none, soft: 0.85 })
    expect(soft.filtered.detail, 'soft takes fine detail away').toBeLessThan(
      soft.plain.detail * 0.7,
    )

    const dim = await seen({ ...none, dim: 0.35 })
    expect(dim.filtered.mean / dim.plain.mean, 'dim darkens by what is asked').toBeGreaterThan(0.6)
    expect(dim.filtered.mean / dim.plain.mean, 'dim darkens by what is asked').toBeLessThan(0.7)

    // Thin is looked at on a style with broad light to take: it loses more of its light than of its fine
    // detail, which a picture that is only dimmed does not.
    const thin = await seen({ ...none, thin: 0.8 }, 'pin-relief')
    const light = thin.filtered.mean / thin.plain.mean
    const fine = thin.filtered.detail / thin.plain.detail
    expect(light, 'thin takes the broad light away').toBeLessThan(0.75)
    expect(fine, 'and less of the fine detail than of the light').toBeGreaterThan(light + 0.03)
    expect(thin.filtered.lit, 'thin leaves a picture').toBeGreaterThan(0.01)

    const spread = await seen({ ...none, spread: 0.5 })
    expect(spread.filtered.mean, 'spread adds light').toBeGreaterThan(spread.plain.mean)

    // Under Trails the stage keeps what it showed. The filter is not in what it keeps: after thirty filtered
    // paintings, one painting without the filter is the picture a screen that never had one shows.
    const kept = await page.evaluate(
      (asked) => window.visualsHarness.kept('dot-globe', asked, 30),
      { ...none, soft: 0.85, dim: 0.35, spread: 0.5 },
    )
    if (!kept) throw new Error('the style was never drawn')
    expect(kept.never.mean).toBeGreaterThan(1)
    expect(kept.under.detail, 'the filter was on the picture').toBeLessThan(kept.never.detail * 0.7)
    expect(kept.after.mean, 'and none of it stayed: the light').toBeCloseTo(kept.never.mean, 3)
    expect(kept.after.detail, 'and the detail').toBeCloseTo(kept.never.detail, 3)

    // The barest a performance leaves a new visual: one sound in, Tone all the way down.
    expectPicture(
      await page.evaluate(() =>
        window.visualsHarness.performed(
          'dot-globe',
          { rides: 0, ladder: 1, overSec: 0 },
          { energy: 1, space: 0.5, tone: 0 },
        ),
      ),
      'a new visual with one sound left and Tone down',
    )
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
