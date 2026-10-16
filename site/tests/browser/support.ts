// What the browser tests share: a page that fails a test on any error, the waits a page with a
// lab needs, and what a lesson's own files say of it. A test goes to a page by its path alone, so
// the same tests run on the whole site and on a build of one lesson served at another port.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, type Locator, type Page } from '@playwright/test'

const LESSONS = fileURLToPath(new URL('../../src/content/lessons/', import.meta.url))
const SETTINGS = fileURLToPath(new URL('../../src/content/settings/', import.meta.url))

/** The lessons there are, by id; `LESSONS=compression,fourier-transform` runs only those. */
export function lessonIds(): string[] {
  const all = fs
    .readdirSync(LESSONS)
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => name.replace(/\.mdx$/, ''))
    .sort()
  const only = process.env.LESSONS?.split(',').filter(Boolean)
  return only ? all.filter((id) => only.includes(id)) : all
}

/** A named set as a lesson's settings file writes it: what a card plays. */
export interface CardSet {
  label: string
  values?: Record<string, number>
  source?: string
  tap?: string
}

/** The sets of a lesson's settings file by name; none for a lesson with no file. */
export function lessonSets(lesson: string): Record<string, CardSet> {
  const file = `${SETTINGS}${lesson}.json`
  if (!fs.existsSync(file)) return {}
  return JSON.parse(fs.readFileSync(file, 'utf8')).sets ?? {}
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

/** How far down the page the window stands, in pixels. */
export const scrolled = (page: Page) => page.evaluate(() => window.scrollY)

/** A knob's value, as it says it to a reader who cannot see it. */
export const valueOf = (knob: Locator) => knob.getAttribute('aria-valuenow').then(Number)

/** The end of a knob's range it is not standing at, and the key that sends it there. */
export async function farEnd(knob: Locator): Promise<{ key: 'Home' | 'End'; value: number }> {
  const top = Number(await knob.getAttribute('aria-valuemax'))
  return (await valueOf(knob)) === top
    ? { key: 'Home', value: Number(await knob.getAttribute('aria-valuemin')) }
    : { key: 'End', value: top }
}

/**
 * Sends a knob to the far end of its range by the keys, and gives the value it lands on. A
 * control inside a build step wakes when it comes into view, so the key is pressed until the
 * control has taken it.
 */
export async function turnToFarEnd(knob: Locator): Promise<number> {
  const far = await farEnd(knob)
  await expect(async () => {
    await knob.focus()
    await knob.press(far.key)
    expect(await valueOf(knob)).toBe(far.value)
  }).toPass({ timeout: 15_000 })
  return far.value
}

/**
 * Press a button that wakes only once it is in view: it is brought into view first, since a
 * button that has not woken is not yet one that can be pressed, and a press would wait for it.
 */
export async function press(button: Locator): Promise<void> {
  await button.scrollIntoViewIfNeeded()
  await button.click()
}

/** Open the real device's plate at the lesson's end, and wait until it is there. */
export async function openPlate(page: Page): Promise<Locator> {
  const bench = page.locator('.bench')
  await bench.scrollIntoViewIfNeeded()
  await bench.getByRole('button').first().click()
  await expect(page.getByTestId('bench-plate')).toBeVisible({ timeout: 30_000 })
  return bench
}

/** The words a reader sees in what a locator finds: how many there are. */
export const wordCount = (found: Locator) =>
  found.innerText().then((text) => text.split(/\s+/).filter(Boolean).length)
