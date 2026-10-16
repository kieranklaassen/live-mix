// What the browser tests share: a page that fails a test on any error, and the waits a page
// with a lab needs.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, type Page } from '@playwright/test'

const LESSONS = fileURLToPath(new URL('../../src/content/lessons/', import.meta.url))

/** The lessons there are, by id; `LESSONS=07-compression,02-fourier-transform` runs only those. */
export function lessonIds(): string[] {
  const all = fs
    .readdirSync(LESSONS)
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => name.replace(/\.mdx$/, ''))
    .sort()
  const only = process.env.LESSONS?.split(',').filter(Boolean)
  return only ? all.filter((id) => only.includes(id)) : all
}

/** Collects everything that should not happen on a page: errors, failed requests, bad statuses. */
export function watch(page: Page): string[] {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`error: ${error.message}`))
  page.on('requestfailed', (request) => problems.push(`failed: ${request.url()}`))
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`${response.status()}: ${response.url()}`)
  })
  return problems
}

/** Wait until the page's lab has loaded and rendered once. */
export async function labReady(page: Page): Promise<void> {
  await expect(page.locator('.playbar[data-ready]')).toBeVisible({ timeout: 30_000 })
}

/** Scroll the whole page past the window, so every figure wakes and draws. */
export async function scrollThrough(page: Page): Promise<void> {
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(60)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
}

export const renders = (page: Page) =>
  page.locator('.playbar').getAttribute('data-renders').then(Number)

/** What every canvas on the page holds, as text, to tell whether a picture changed. */
export const pictures = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('canvas')].map((canvas) => canvas.toDataURL()))

/** The play bar's meter, 0 to 1: above 0 only while sound is really going out. */
export const meter = (page: Page) =>
  page.evaluate(() => {
    const bar = document.querySelector<HTMLElement>('.playbar-meter span')
    return Number(/scaleX\(([\d.e-]+)\)/.exec(bar?.style.transform ?? '')?.[1] ?? 0)
  })

/**
 * Waits until the meter moves. Asked ten times a second: a quiet sound, a reverb's tail after a
 * click, lifts the meter only for a moment in each pass of the loop.
 */
export async function sounds(page: Page): Promise<void> {
  await expect.poll(() => meter(page), { timeout: 10_000, intervals: [100] }).toBeGreaterThan(0)
}

/** How far the page is wider than its window: 0 when nothing sticks out sideways. */
export const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
