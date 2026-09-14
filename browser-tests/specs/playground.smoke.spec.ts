// Playground smoke: the built playground (`pnpm playground:build`) loads in a
// real browser without errors and mounts the React kit. `playground/` is
// owned by U40; this spec is the one shared script (`pnpm test:browser`)
// U40 extends with its own checks. Skipped when the playground is not built.

import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

import { collectPageErrors } from './page-errors'

const built = fileURLToPath(new URL('../../playground/dist/index.html', import.meta.url))

test.describe('playground smoke', () => {
  test('loads without errors and mounts the app', async ({ page }) => {
    try {
      await access(built)
    } catch {
      test.skip(true, 'playground not built (run pnpm playground:build)')
      return
    }
    const errors = collectPageErrors(page)
    await page.goto('/playground/dist/index.html')
    await expect(page).toHaveTitle(/live-mix playground/)
    const root = page.locator('#root')
    await expect(root).not.toBeEmpty()
    expect(errors).toEqual([])
  })
})
