// A strip plays one channel as it plays two, in a real browser: a voice
// recorded in one channel is as loud whether its strip has been used or not,
// and whatever is in its chain. Until the pan stages were told to take two
// channels always, it played 3.01 dB quieter through a strip with its nodes
// made than through one with none, and 3.01 dB louder again with a compressor
// in the chain.

import { expect, test } from '@playwright/test'

import type { ChannelLevels, LoudestCase, StripCase } from '../harness/one-and-two-channels'
import { collectPageErrors } from './page-errors'

const CENTRED: readonly StripCase[] = ['untouched', 'nodes', 'compressor', 'utility', 'rack']
const PANNED: readonly StripCase[] = ['panned left', 'compressor, panned left']

test.describe('a tone through a strip, in one channel and in two', () => {
  let one: Record<string, ChannelLevels>
  let two: Record<string, ChannelLevels>

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    const cases = [...CENTRED, ...PANNED]
    one = await page.evaluate((all) => window.liveMixHarness.measureChannels(1, all), cases)
    two = await page.evaluate((all) => window.liveMixHarness.measureChannels(2, all), cases)
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('is as loud at the centre whatever its strip has been used for', () => {
    test.info().annotations.push({
      type: 'levels',
      description: JSON.stringify({ one, two }),
    })
    for (const strip of CENTRED) {
      for (const [channels, levels] of [
        ['one', one[strip]],
        ['two', two[strip]],
      ] as const) {
        const said = `${channels} channel(s), strip: ${strip}`
        expect(levels.leftDb, `left, ${said}`).toBeCloseTo(0, 1)
        expect(levels.rightDb, `right, ${said}`).toBeCloseTo(0, 1)
      }
    }
  })

  test('is panned by one law, with or without a device that hands the pan two channels', () => {
    for (const strip of PANNED) {
      expect(one[strip].leftDb, `one channel, ${strip}`).toBeCloseTo(two[strip].leftDb, 1)
      expect(one[strip].rightDb, `one channel, ${strip}`).toBe(-200)
    }
    expect(one['panned left'].leftDb).toBeCloseTo(one['compressor, panned left'].leftDb, 1)
  })

  test('asks no more of the output than the tone at the centre, and the master limiter holds a hard pan', async ({
    browser,
  }) => {
    const page = await browser.newPage()
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    const cases: LoudestCase[] = ['centre', 'hard left', 'hard left, limited']
    const loudest = await page.evaluate((all) => window.liveMixHarness.measureLoudest(all), cases)
    await page.close()
    test.info().annotations.push({ type: 'loudest', description: JSON.stringify(loudest) })

    // At the centre a tone at full scale leaves at full scale: nothing over.
    expect(loudest.centre.leftDb).toBeLessThanOrEqual(0.01)
    expect(loudest.centre.rightDb).toBeLessThanOrEqual(0.01)
    // Panned hard it is both channels in one side, 6.02 dB over, as two alike channels are.
    expect(loudest['hard left'].leftDb).toBeCloseTo(6.02, 1)
    // With the master's limiter in, that side is held under its ceiling of -1.5 dB.
    expect(loudest['hard left, limited'].leftDb).toBeLessThanOrEqual(-1.5)
  })
})
