// The home page, opened in a browser: the map of the lessons as built, a tile's button and what
// it loads, the loop row, the small bar, a tile that is loading and one that failed. Runs on
// whatever lessons are written.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { meter, overflow, sounds, watch } from './support.ts'

const SRC = fileURLToPath(new URL('../../src/content/', import.meta.url))
const families: { lessons: { id: string; title: string }[] }[] = JSON.parse(
  fs.readFileSync(`${SRC}families.json`, 'utf8'),
)
const mapped = families.flatMap((family) => family.lessons)
// A one-lesson build (scripts/lesson.sh) holds the map with that lesson alone written.
const only = process.env.SITE_ONLY_LESSON
const written = mapped.filter(
  (lesson) => fs.existsSync(`${SRC}lessons/${lesson.id}.mdx`) && (!only || lesson.id === only),
)

/** The labs' modules the page has asked for, by file name, in order. */
function modules(page: Page): string[] {
  const asked: string[] = []
  page.on('request', (request) => {
    const file = /\/labs\/([\w-]+\.wasm)/.exec(request.url())?.[1]
    if (file) asked.push(file)
  })
  return asked
}

const hear = (page: Page, title: string) => page.getByRole('button', { name: `Hear ${title}` })
const stop = (page: Page, title: string) => page.getByRole('button', { name: `Stop ${title}` })
const what = (page: Page) => page.locator('.tilebar-what')

test.describe('with scripts off', () => {
  test.use({ javaScriptEnabled: false })

  for (const path of ['', 'lessons/']) {
    test(`/${path} is the map: a link and a picture for every lesson written, and no play button`, async ({
      page,
    }) => {
      await page.goto(path)
      await expect(page.locator('.family')).toHaveCount(families.length)
      await expect(page.locator('.tile')).toHaveCount(mapped.length)
      for (const lesson of written) {
        const tile = page.locator(`.tile[data-tile="${lesson.id}"]`)
        await expect(tile.locator(`a[href$="/lessons/${lesson.id}/"]`)).toContainText(lesson.title)
        // The picture is drawn, not an empty box: a line of the lab's render, or the layers of
        // its spectrum over time.
        await expect(tile.locator('.tile-picture svg :is(path, rect[mask])').first()).toBeAttached()
      }
      await expect(page.locator('.tile a')).toHaveCount(written.length)
      await expect(page.locator('.tile button')).toHaveCount(0)
      // The loop row picks what a button plays: with no buttons it is not shown.
      await expect(page.locator('.loops')).toBeHidden()
      await expect(page.locator('.home-hero')).toHaveCount(path === '' ? 1 : 0)
    })
  }
})

test('a lesson not yet written is drawn so: no link, no picture, no play button', async ({
  page,
}) => {
  const problems = watch(page)
  await page.goto('')
  // Every written lesson has its button once the island is awake.
  await expect(page.locator('.tile-button')).toHaveCount(written.length)
  const unwritten = page.locator('.tile-unwritten')
  await expect(unwritten).toHaveCount(mapped.length - written.length)
  for (const tile of await unwritten.all()) {
    await expect(tile).toContainText('Not yet written')
    await expect(tile.locator('a, button, svg')).toHaveCount(0)
  }
  expect(problems).toEqual([])
})

test('a tile’s button loads that lesson’s lab and the bench and no other, sounds, and Escape stops it', async ({
  page,
}) => {
  const problems = watch(page)
  const asked = modules(page)
  await page.goto('')
  await expect(hear(page, 'Compression')).toBeVisible()
  // Nothing is loaded and nothing sounds until a button is pressed.
  expect(asked).toEqual([])
  await expect(page.locator('.tilebar')).toHaveCount(0)

  await hear(page, 'Compression').click()
  await expect(stop(page, 'Compression')).toBeVisible({ timeout: 30_000 })
  await sounds(page)
  expect([...asked].sort()).toEqual(['bench.wasm', 'compression.wasm'])
  await expect(what(page)).toHaveText('13 Compression · Drums')
  await expect(page.locator('.tile[data-tile="compression"]')).toHaveAttribute(
    'data-state',
    'sounding',
  )

  await page.keyboard.press('Escape')
  await expect(hear(page, 'Compression')).toBeVisible()
  await expect.poll(() => meter(page)).toBe(0)
  await expect(what(page)).toHaveText('Stopped')
  expect(problems).toEqual([])
})

test('the loop row picks and does not play; a tile that sounds follows it, and one that plays its own notes does not', async ({
  page,
}) => {
  const problems = watch(page)
  const asked = modules(page)
  await page.goto('')
  await expect(hear(page, 'Compression')).toBeVisible()

  await page.getByRole('radio', { name: 'Pad' }).check()
  expect(asked).toEqual([])
  await expect(page.locator('.tilebar')).toHaveCount(0)

  await hear(page, 'Compression').click()
  await expect(what(page)).toHaveText('13 Compression · Pad', { timeout: 30_000 })
  await sounds(page)

  // Rendered again on the new loop, in place: the tile never stops being the one that sounds.
  await page.getByRole('radio', { name: 'Bass' }).check()
  await expect(what(page)).toHaveText('13 Compression · Bass')
  await expect(stop(page, 'Compression')).toBeVisible()
  await sounds(page)

  // Another tile takes over; its lab is loaded into the same worker, and the bench is not asked for again.
  const string = page.locator('.tile[data-tile="plucked-string"]')
  await expect(string).toContainText('It plays its own notes and takes no loop.')
  await hear(page, 'The plucked string').click()
  await expect(what(page)).toHaveText('30 The plucked string · its own notes', { timeout: 30_000 })
  await expect(hear(page, 'Compression')).toBeVisible()
  await sounds(page)
  expect(asked).toEqual(['compression.wasm', 'bench.wasm', 'plucked-string.wasm'])

  await page.getByRole('radio', { name: 'Drums' }).check()
  await expect(what(page)).toHaveText('30 The plucked string · its own notes')

  await page.getByRole('button', { name: 'Stop', exact: true }).click()
  await expect(hear(page, 'The plucked string')).toBeVisible()
  await expect.poll(() => meter(page)).toBe(0)
  expect(problems).toEqual([])
})

test('a tile that is loading says so, and pressed again it drops the load', async ({ page }) => {
  // The lab's module is held back until the test lets it go.
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/labs/limiting.wasm', async (route) => {
    await held
    await route.continue()
  })
  await page.goto('')
  const title = 'Limiting and true peaks'
  await hear(page, title).click()

  const loading = page.getByRole('button', { name: `Loading ${title}` })
  await expect(loading).toHaveAttribute('aria-busy', 'true')
  await expect(what(page)).toHaveText(`Loading 14 ${title}`)
  const tile = page.locator('.tile[data-tile="limiting"]')
  await expect(tile).toHaveAttribute('data-state', 'loading')
  await tile.screenshot({ path: test.info().outputPath('loading-tile.png') })

  await loading.click()
  await expect(hear(page, title)).toBeVisible()
  await expect(what(page)).toHaveText('Stopped')
  // The module arrives after all: nothing starts.
  release()
  await page.waitForTimeout(1500)
  await expect(hear(page, title)).toBeVisible()
  expect(await meter(page)).toBe(0)
})

test('a tile that did not load says so in words, once, and a press tries again', async ({
  page,
}) => {
  await page.route('**/labs/compression.wasm', (route) => route.abort(), { times: 1 })
  await page.goto('')
  await hear(page, 'Compression').click()

  const tile = page.locator('.tile[data-tile="compression"]')
  await expect(tile.locator('.tile-failed')).toHaveText('It did not load. Press play to try again.')
  await expect(page.getByRole('status')).toHaveText(
    'Compression did not load. Press its button to try again.',
  )
  await expect(tile).toHaveAttribute('data-state', 'failed')
  // The other tiles are as they were.
  await expect(page.locator('.tile[data-state="failed"]')).toHaveCount(1)
  await tile.screenshot({ path: test.info().outputPath('failed-tile.png') })

  await hear(page, 'Compression').click()
  await expect(stop(page, 'Compression')).toBeVisible({ timeout: 30_000 })
  await expect(tile.locator('.tile-failed')).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText('')
  await sounds(page)
})

for (const width of [390, 1280]) {
  test(`nothing sticks out sideways at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['', 'lessons/']) {
      await page.goto(path)
      await expect(page.locator('.tile-button').first()).toBeVisible()
      expect(await overflow(page)).toBe(0)
    }
    // With the bar on the page too.
    await page.locator('.tile-button').first().click()
    await expect(page.locator('.tilebar')).toBeVisible()
    expect(await overflow(page)).toBe(0)
  })
}
