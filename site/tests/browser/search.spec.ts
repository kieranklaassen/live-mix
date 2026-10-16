// The search: a word finds the lesson about it, the API reference is listed apart, and a
// search can be linked to.
import { expect, test } from '@playwright/test'
import { watch } from './support.ts'

test('"compress" finds the compression lesson, with the API reference in a list of its own', async ({
  page,
}) => {
  const problems = watch(page)
  await page.goto('search/')
  await page.locator('#search-q').fill('compress')
  const site = page.locator('.search-group[data-group=site]')
  await expect(site).toBeVisible()
  await expect(site.locator('.search-results a[href$="/lessons/07-compression/"]')).toBeVisible()
  // Nothing of the API reference stands among the lessons, docs and devices.
  await expect(site.locator('.search-results a[href*="/api/"]')).toHaveCount(0)
  const api = page.locator('.search-group[data-group=api]')
  await expect(api).toBeVisible()
  expect(await api.locator('.search-results a[href*="/api/"]').count()).toBeGreaterThan(0)

  await site.locator('.search-results a[href$="/lessons/07-compression/"]').click()
  await expect(page.locator('h1')).toContainText(/compress/i)
  expect(problems).toEqual([])
})

test('a search can be linked to, and says so when it finds nothing', async ({ page }) => {
  await page.goto('search/?q=convolution')
  await expect(page.locator('#search-q')).toHaveValue('convolution')
  await expect(
    page.locator('.search-group[data-group=site] .search-results a[href*="/lessons/15-"]'),
  ).toBeVisible()

  await page.locator('#search-q').fill('qqzzxxnothing')
  await expect(page.locator('.search-group[data-group=site]')).toBeHidden()
  await expect(page.locator('.search-status')).not.toBeEmpty()
})
