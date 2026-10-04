// Takes a picture of the plate bench (playground/plates.html) in headless
// Chromium with sound running, so a display is caught while it works.
//
// Usage: node scripts/plates/shoot.mjs <out.png> [query] [--wait <ms>] [--width <px>] [--scale <n>]
//   node scripts/plates/shoot.mjs tmp/dynamics.png "category=dynamics&theme=paper"
// The bench must be served: `pnpm playground` (port 5199), or set PLATES_URL.

/* global window */
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`)
  return at === -1 ? fallback : Number(args[at + 1])
}
const out = args[0]
const query = args[1] && !args[1].startsWith('--') ? args[1] : ''
if (!out) {
  console.error(
    'usage: node scripts/plates/shoot.mjs <out.png> [query] [--wait ms] [--width px] [--scale n]',
  )
  process.exit(1)
}
const base = process.env.PLATES_URL ?? 'http://127.0.0.1:5199/plates.html'
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? undefined,
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({
  viewport: { width: flag('width', 1320), height: 800 },
  deviceScaleFactor: flag('scale', 2),
})
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
    errors.push(message.text())
  }
})
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
    errors.push(`${response.status()} ${response.url()}`)
  }
})
await page.goto(`${base}?${query}`)
await page.waitForFunction(() => window.plates?.ready === true, null, { timeout: 60000 })
await page.waitForTimeout(flag('wait', 2500))
await page.locator('[data-testid="plates"]').screenshot({ path: out })
const state = await page.evaluate(() => ({
  context: window.plates.context.state,
  devices: Object.keys(window.plates.devices).length,
}))
console.log(JSON.stringify({ out, ...state, errors }))
await browser.close()
process.exit(errors.length > 0 ? 1 : 0)
