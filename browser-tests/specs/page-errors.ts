import type { Page } from '@playwright/test'

/**
 * Collect what should fail a browser test: uncaught exceptions, console
 * errors, and any resource that failed to load (with its URL) — except the
 * favicon, which the harness pages do not ship.
 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    // Resource failures are reported through `response` below, with their URL.
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
      errors.push(message.text())
    }
  })
  page.on('response', (response) => {
    if (response.status() >= 400 && !/favicon\.ico$/.test(response.url())) {
      errors.push(`${response.status()} ${response.url()}`)
    }
  })
  return errors
}
