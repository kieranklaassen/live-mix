// The docs as pages: the index lists them, a link written between two docs lands on the other
// doc's page, and a doc with tables and code fits a narrow window. What a lesson says with
// JavaScript off is a case of each lesson's own, in lessons.spec.ts.
import { expect, test } from '@playwright/test'
import { overflow, watch } from './support.ts'

test('the docs index lists the docs, and a link in one leads to another', async ({ page }) => {
  const problems = watch(page)
  await page.goto('docs/')
  await expect(page.locator('h1')).toBeVisible()
  const start = page.locator('main a[href$="/docs/getting-started/"]').first()
  await expect(start).toBeVisible()
  await start.click()
  await expect(page).toHaveURL(/\/docs\/getting-started\/$/)
  await expect(page.locator('h1')).toBeVisible()

  // A link the doc's source writes as a path to another .md file is a page of the site here.
  const between = page.locator('main article a[href^="/"][href*="/docs/"]:not([href*="#"])').first()
  const target = await between.getAttribute('href')
  await between.click()
  await expect(page).toHaveURL(new RegExp(`${target!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  await expect(page.locator('h1')).toBeVisible()
  expect(problems).toEqual([])
})

for (const width of [390, 1280]) {
  test(`a doc with tables and code fits a window ${width} px wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const doc of ['docs/devices/', 'docs/getting-started/', 'docs/score/']) {
      await page.goto(doc)
      await expect(page.locator('h1')).toBeVisible()
      expect(await overflow(page), doc).toBe(0)
    }
  })
}
