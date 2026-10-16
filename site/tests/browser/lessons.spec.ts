// Every lesson, opened in a browser: it renders with no error, every figure draws, a control
// draws them again, play starts the sound, each stage can be heard, and the real device's plate
// appears and sounds. Runs on whatever lessons exist.
import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import {
  labReady,
  lessonIds,
  meter,
  overflow,
  pictures,
  renders,
  scrollThrough,
  sounds,
  watch,
} from './support.ts'

for (const lesson of lessonIds()) {
  test.describe(lesson, () => {
    test('opens, draws every figure, and draws them again when a control moves', async ({
      page,
    }) => {
      const problems = watch(page)
      await page.goto(`lessons/${lesson}/`)
      await expect(page.locator('h1')).toBeVisible()
      await labReady(page)
      await scrollThrough(page)

      const figures = page.locator('[data-figure]')
      expect(await figures.count()).toBeGreaterThan(2)
      await expect(page.locator('[data-figure]:not([data-drawn])')).toHaveCount(0)
      // Every stage says where it comes from.
      const stages = page.locator('.stage')
      expect(await stages.count()).toBeGreaterThan(1)
      await expect(page.locator('.stage .stage-origin:empty')).toHaveCount(0)

      // Move the first control to the far end of its range: the lab renders again and at least
      // one picture is another picture.
      const before = await pictures(page)
      const count = await renders(page)
      const slider = page.locator('.control input[type=range]').first()
      if ((await slider.count()) > 0) {
        await slider.focus()
        await slider.press((await slider.inputValue()) === '1000' ? 'Home' : 'End')
      } else {
        await page.locator('.control [role=radio][aria-checked=false]').first().click()
      }
      await expect.poll(() => renders(page)).toBeGreaterThan(count)
      await expect
        .poll(async () => (await pictures(page)).some((one, i) => one !== before[i]))
        .toBe(true)
      await expect(page.locator('[data-figure]:not([data-drawn])')).toHaveCount(0)

      expect(problems).toEqual([])
    })

    test('plays on a click, and every stage that is sound can be heard', async ({ page }) => {
      const problems = watch(page)
      await page.goto(`lessons/${lesson}/`)
      await labReady(page)
      expect(await meter(page)).toBe(0)

      await page.locator('.playbar-play').click()
      await expect(page.locator('.playbar-play[data-playing]')).toBeVisible()
      await sounds(page)

      const listens = page.locator('.stage-listen')
      const count = await listens.count()
      expect(count).toBeGreaterThan(0)
      for (let i = 0; i < count; i += 1) {
        const stage = page.locator('.stage', { has: page.locator('.stage-listen') }).nth(i)
        await stage.locator('.stage-listen').click()
        await expect(stage).toHaveAttribute('data-sounding', '')
        await expect(page.locator('.stage[data-sounding]')).toHaveCount(1)
      }
      // A stage that is not sound has no button.
      await expect(page.locator('.stage:has(.stage-kind) button')).toHaveCount(0)

      await page.locator('.playbar-play').click()
      await expect(page.locator('.playbar-play[data-playing]')).toHaveCount(0)
      expect(problems).toEqual([])
    })

    test('ends with the real device: its plate appears and sound goes through it', async ({
      page,
    }) => {
      const problems = watch(page)
      await page.goto(`lessons/${lesson}/`)
      await labReady(page)
      const bench = page.locator('.bench')
      await bench.scrollIntoViewIfNeeded()
      await bench.getByRole('button').first().click()
      await expect(page.getByTestId('bench-plate')).toBeVisible({ timeout: 30_000 })
      // Opening the bench makes no sound.
      expect(await meter(page)).toBe(0)
      await bench.locator('.bench-bar button').click()
      await expect(page.locator('#lab-stage')).toHaveValue('@bench')
      await sounds(page)
      // The play bar's stop governs it.
      await page.locator('.playbar-play').click()
      await expect(page.locator('.playbar-play[data-playing]')).toHaveCount(0)
      expect(problems).toEqual([])
    })

    for (const width of [390, 1280]) {
      test(`fits a window ${width} px wide`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`lessons/${lesson}/`)
        await labReady(page)
        await scrollThrough(page)
        expect(await overflow(page)).toBe(0)
        // Open, the plate scrolls in its own box and still does not widen the page.
        await page.locator('.bench').getByRole('button').first().click()
        await expect(page.getByTestId('bench-plate')).toBeVisible({ timeout: 30_000 })
        expect(await overflow(page)).toBe(0)
      })
    }
  })
}

test('a lesson named in the text links to it, with the number and the title the map gives', async ({
  page,
}) => {
  const map: { lessons: { id: string; title: string }[] }[] = JSON.parse(
    fs.readFileSync(new URL('../../src/content/families.json', import.meta.url), 'utf8'),
  )
  const inOrder = map.flatMap((family) => family.lessons)
  let found = 0
  for (const lesson of lessonIds()) {
    await page.goto(`lessons/${lesson}/`)
    const mentions = await page.locator('.lesson-body a', { hasText: /^lesson \d+, /i }).all()
    for (const mention of mentions) {
      const id = /\/lessons\/([^/]+)\/$/.exec((await mention.getAttribute('href')) ?? '')?.[1]
      const number = inOrder.findIndex((one) => one.id === id) + 1
      // A capital only where the mention starts a sentence.
      const words = ((await mention.textContent()) ?? '').replace(/^L/, 'l')
      expect(words, `${lesson}, naming ${id}`).toBe(
        `lesson ${number}, ${inOrder[number - 1]?.title}`,
      )
      found += 1
    }
  }
  // With every lesson run, some lesson names another.
  if (!process.env.LESSONS) expect(found).toBeGreaterThan(0)
})
