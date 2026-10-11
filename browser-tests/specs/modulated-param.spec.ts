// A parameter a device moves itself, in a real browser: the swing has to be
// in an offline render, where no page can send values in time, from its
// first block on, and the same in every render.

import { expect, test } from '@playwright/test'
import { modulatedParamValue, type ParamModulation } from '@kieranklaassen/live-mix'
import { SATURATOR_PARAMS } from '@kieranklaassen/live-mix/dsp'

import { MODULATED_WINDOW_SEC, type ModulatedMeasure } from '../harness/modulated-param'
import { collectPageErrors } from './page-errors'

/** A sine once a second, a quarter of the level's 48 dB each way, at its top as the render begins. */
const SWING: ParamModulation = {
  routes: [
    {
      source: { kind: 'lfo', shape: 'sine', rateHz: 1, depth: 1, anchorPhase: 0.25, anchorSec: 0 },
      depth: 0.25,
      polarity: 'bipolar',
    },
  ],
}

test.describe('a parameter moved on the audio thread, in real audio', () => {
  let measured: ModulatedMeasure

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate((swing) => window.liveMixHarness.measureModulated(swing), SWING)
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('is at the top of its swing in the first window of an offline render', () => {
    expect(measured.swingDb[0]).toBeGreaterThan(11.5)
    expect(measured.swingDb[0]).toBeLessThan(12.1)
  })

  test('follows the formula the page draws from, window by window', () => {
    const expected = measured.swingDb.map((_, index) =>
      modulatedParamValue(
        SATURATOR_PARAMS.outputDb,
        0,
        SWING,
        (index + 0.5) * MODULATED_WINDOW_SEC,
      ),
    )
    const off = measured.swingDb.map((db, index) => Math.abs(db - expected[index]))
    test.info().annotations.push({
      type: 'swing',
      description: JSON.stringify({
        measured: measured.swingDb.map((db) => Number(db.toFixed(2))),
        worst: Math.max(...off),
      }),
    })
    // Both ends of the swing are reached, a second apart.
    expect(Math.max(...measured.swingDb)).toBeGreaterThan(11.5)
    expect(Math.min(...measured.swingDb)).toBeLessThan(-11.5)
    expect(Math.max(...off)).toBeLessThan(0.5)
  })

  test('is the same in every render, and moves without steps', () => {
    expect(measured.rerunDifference).toBe(0)
    // The loudest moment is 12 dB up: the largest step is that much larger, and no more.
    expect(measured.stepRatio).toBeLessThan(4.2)
  })
})
