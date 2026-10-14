// Takes the README's pictures (docs/images/) in headless Chromium, with sound
// running: the plate bench (playground/plates.html) and the playground itself
// on real audio. Run it again when a plate or the playground has changed.
//
// Usage: node scripts/readme/shoot.mjs [name ...]
//   node scripts/readme/shoot.mjs                 every picture
//   node scripts/readme/shoot.mjs stomp-boxes     these
// The playground must be served: `pnpm playground` (port 5199), or set PLAYGROUND_URL.

/* global window, document */
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const out = fileURLToPath(new URL('../../docs/images/', import.meta.url))
const base = (process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:5199/').replace(/\/?$/, '/')
const wanted = process.argv.slice(2)

// The bench's plates, by its query (see playground/src/plates.tsx). `width` is
// the page's: 20 px at each side, then plates 20 px apart.
const BENCH = {
  // Ten pedals, five to a row: 5 × 220 + 4 × 20 + 40.
  'stomp-boxes': {
    query:
      'only=shimmer,tape-echo,underwater,seasons,constellation,prism,rotary,fog,howl,octaves&look=studio&upright=1',
    width: 1220,
  },
  // Eight plates lying flat, four to a row: 4 × 280 + 3 × 20 + 40.
  plates: {
    query: 'only=plate-reverb,analog-delay,tremolo,chorus,phaser,saturator,flanger,auto-filter',
    width: 1220,
  },
  // Two instruments, each with two pedals after it: 440 + 280 + 280 + 40.
  'instrument-chain': {
    query: 'instruments=1&only=handpan,mallets&then=grain-delay,spring-reverb&look=studio',
    width: 1040,
  },
}
const PLAYGROUND = ['playground-mixer', 'playground-agent']

const names = wanted.length > 0 ? wanted : [...Object.keys(BENCH), ...PLAYGROUND]
const unknown = names.filter((name) => !(name in BENCH) && !PLAYGROUND.includes(name))
if (unknown.length > 0) {
  console.error(`readme pictures: no picture named ${unknown.join(', ')}`)
  process.exit(1)
}

await mkdir(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? undefined,
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const errors = []

async function open(width, url) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 })
  page.on('pageerror', (error) => errors.push(`${url}: ${String(error)}`))
  await page.goto(url)
  return page
}

/** The box around every element the selector finds, with `pad` px of the page round it. */
async function boxOf(page, selector, pad) {
  return page.evaluate(
    ([selector, pad]) => {
      const rects = [...document.querySelectorAll(selector)].map((element) => {
        const rect = element.getBoundingClientRect()
        const y = window.scrollY
        return { left: rect.left, top: rect.top + y, right: rect.right, bottom: rect.bottom + y }
      })
      const left = Math.max(0, Math.min(...rects.map((rect) => rect.left)) - pad)
      const top = Math.max(0, Math.min(...rects.map((rect) => rect.top)) - pad)
      const right = Math.max(...rects.map((rect) => rect.right)) + pad
      const bottom = Math.max(...rects.map((rect) => rect.bottom)) + pad
      return { x: left, y: top, width: right - left, height: bottom - top }
    },
    [selector, pad],
  )
}

const shoot = (page, name, clip) =>
  page.screenshot({ path: `${out}${name}.jpg`, quality: 82, fullPage: true, clip })

for (const name of names.filter((name) => name in BENCH)) {
  const { query, width } = BENCH[name]
  const page = await open(width, `${base}plates.html?${query}`)
  await page.waitForFunction(() => window.plates?.ready === true, null, { timeout: 60000 })
  // Long enough for a tail to fill and a display to show it.
  await page.waitForTimeout(4000)
  // The plates alone: not the cell over them, nor the bench's names under them.
  await page.addStyleTag({ content: '[data-plate] figcaption { display: none }' })
  await shoot(page, name, await boxOf(page, '[data-plate] .lm-plate', 20))
  await page.close()
  console.log(`${name}.jpg`)
}

if (names.some((name) => PLAYGROUND.includes(name))) {
  const page = await open(1220, base)
  await page.getByTestId('mixer').waitFor()
  // Real audio from a click, then play until the master meter moves.
  await page.getByTestId('mode-toggle').click()
  await page.waitForFunction(() => window.playground?.demo?.mode === 'live', null, {
    timeout: 60000,
  })
  await page.getByTestId('transport-play').click()
  await page.waitForFunction(() => window.playground.demo.engine.master.level() > 0.001, null, {
    timeout: 20000,
  })
  // The keys strip: an EQ and the stereo widener as plates under the mixer.
  await page.locator('[data-testid="mixer-keys"] .lm-strip__name').click()
  await page.locator('[data-testid="chain"] .lm-plate').nth(1).waitFor()
  // An agent call that edits the score, and a scene launched on the grid.
  await page.getByTestId('agent-quick-music-down').click()
  await page.locator('[data-testid="agent-result"][data-ok="true"]').waitFor()
  await page.getByTestId('grid-scene-groove').click()
  await page
    .locator('[data-testid="grid-slot-groove-drums"][data-state="playing"]')
    .waitFor({ timeout: 20000 })
  await page.waitForTimeout(1500)

  if (names.includes('playground-mixer')) {
    const top = await boxOf(page, '.pg-header, [data-testid="devices"]', 12)
    await shoot(page, 'playground-mixer', top)
    console.log('playground-mixer.jpg')
  }
  if (names.includes('playground-agent')) {
    const foot = await boxOf(page, '[data-testid="agent"], [data-testid="timeline"]', 12)
    await shoot(page, 'playground-agent', foot)
    console.log('playground-agent.jpg')
  }
  await page.close()
}

await browser.close()
if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}
