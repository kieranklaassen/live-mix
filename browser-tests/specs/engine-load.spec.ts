// R38 in a real browser: the engine's figure for what its own devices take
// of real time, held against the same device modules run in a worker at the
// audio thread's pace. On a cross-origin isolated page the two must agree; on a plain page
// the engine has no way to measure and must report exactly that, while still
// listing its devices and what they hold in memory.

import { expect, test } from '@playwright/test'

import type { LoadResult } from '../harness/load'
import { collectPageErrors } from './page-errors'

const mean = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)

async function measure(page: import('@playwright/test').Page, path: string): Promise<LoadResult> {
  await page.goto(path)
  await page.waitForFunction(() => window.loadHarness !== undefined)
  return page.evaluate(() => window.loadHarness!.measure(6))
}

test('the engine measures its own devices on an isolated page', async ({ page }) => {
  const errors = collectPageErrors(page)
  const result = await measure(page, '/browser-tests/harness/load.html')
  expect(result.isolated).toBe(true)
  expect(result.snapshots.length).toBeGreaterThanOrEqual(3)
  const last = result.snapshots.at(-1)!
  expect(last.supported).toBe(true)
  expect(last.loadSource).toBe('devices')

  // Every kind is there with its count and the memory its instances hold.
  const kinds = Object.fromEntries(last.devices.map((device) => [device.label, device]))
  expect(Object.keys(kinds).sort()).toEqual(['hall-reverb', 'shimmer'])
  expect(kinds['hall-reverb'].count).toBe(4)
  expect(kinds['shimmer'].count).toBe(2)
  expect(kinds['hall-reverb'].memoryBytes).toBe(4 * result.memory['hall-reverb'])
  expect(kinds['shimmer'].memoryBytes).toBe(2 * result.memory['shimmer'])

  // The load agrees with the worker's timing. A look at a random moment is a
  // noisy thing and so is a shared CI machine: within a factor of two, for
  // the sum and for each kind.
  const expected = result.expected['hall-reverb'] + result.expected['shimmer']
  const measured = mean(result.snapshots.map((snapshot) => snapshot.averageLoad))
  console.log(
    `engine load: measured ${(measured * 100).toFixed(2)} %, expected ${(expected * 100).toFixed(2)} %`,
  )
  expect(expected).toBeGreaterThan(0.005)
  expect(measured).toBeGreaterThan(expected / 2)
  expect(measured).toBeLessThan(expected * 2)
  for (const label of ['hall-reverb', 'shimmer']) {
    const share = mean(
      result.snapshots.map(
        (snapshot) => snapshot.devices.find((device) => device.label === label)?.load ?? 0,
      ),
    )
    expect(share).toBeGreaterThan(result.expected[label] / 2)
    expect(share).toBeLessThan(result.expected[label] * 2)
  }
  expect(last.peakLoad).toBeGreaterThanOrEqual(last.averageLoad)

  // Disposed devices are not listed and take nothing: their processors stop,
  // which a disconnected worklet node does not do by itself.
  expect(result.after.devices).toEqual([])
  expect(result.after.averageLoad).toBeLessThan(expected / 4)
  expect(errors).toEqual([])
})

test('a page that cannot share memory reports no load, and still lists its devices', async ({
  page,
}) => {
  const errors = collectPageErrors(page)
  const result = await measure(page, '/browser-tests/harness/load-plain.html')
  expect(result.isolated).toBe(false)
  const last = result.snapshots.at(-1)!
  expect(last.supported).toBe(false)
  expect(last.loadSource).toBeNull()
  expect(last.averageLoad).toBe(0)
  const kinds = Object.fromEntries(last.devices.map((device) => [device.label, device]))
  expect(kinds['hall-reverb']).toMatchObject({ count: 4, load: 0 })
  expect(kinds['hall-reverb'].memoryBytes).toBe(4 * result.memory['hall-reverb'])
  expect(kinds['shimmer']).toMatchObject({ count: 2, load: 0 })
  expect(result.after.devices).toEqual([])
  expect(errors).toEqual([])
})
