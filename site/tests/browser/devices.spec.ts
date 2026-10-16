// The device pages: the list reaches every device, an effect's page passes the loop through
// the device itself, and an instrument's page plays it.
import { expect, test } from '@playwright/test'
import { labReady, meter, overflow, sounds, watch } from './support.ts'

test('the list of devices leads to a device, which names its controls and its source', async ({
  page,
}) => {
  const problems = watch(page)
  await page.goto('devices/')
  expect(await page.locator('.device-list a').count()).toBeGreaterThan(100)
  await page.locator('.device-list a[href$="/devices/compressor/"]').click()
  // The list has a heading too: wait for the device's own page before counting on it.
  await page.waitForURL(/\/devices\/compressor\/$/)
  await expect(page.locator('h1')).toBeVisible()
  await expect
    .poll(() => page.locator('#controls ~ * tbody tr, .param-table tbody tr').count())
    .toBeGreaterThan(3)
  await expect(page.locator('.facts a[href*="github.com"]')).toBeVisible()
  expect(problems).toEqual([])
})

for (const [id, what] of [
  ['compressor', 'an effect passes the loop'],
  ['felt-piano', 'an instrument plays its phrase'],
] as const) {
  test(`${what}: ${id} opens behind its own plate and sound goes through it`, async ({ page }) => {
    const problems = watch(page)
    await page.goto(`devices/${id}/`)
    await labReady(page)
    const bench = page.locator('.bench')
    await bench.scrollIntoViewIfNeeded()
    await bench.getByRole('button').first().click()
    await expect(page.getByTestId('bench-plate')).toBeVisible({ timeout: 30_000 })
    // Opening it makes no sound.
    expect(await meter(page)).toBe(0)
    await bench.locator('.bench-bar button').click()
    await sounds(page)
    await page.locator('.playbar-play').click()
    await expect(page.locator('.playbar-play[data-playing]')).toHaveCount(0)
    expect(problems).toEqual([])
  })
}

test('a device page fits a narrow window, with its plate open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('devices/parametric-eq/')
  await labReady(page)
  expect(await overflow(page)).toBe(0)
  await page.locator('.bench').getByRole('button').first().click()
  await expect(page.getByTestId('bench-plate')).toBeVisible({ timeout: 30_000 })
  expect(await overflow(page)).toBe(0)
})
