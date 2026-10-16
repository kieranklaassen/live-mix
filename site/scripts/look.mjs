// Opens a page of the site in a headless browser and says what it finds: errors, figures that
// did not draw, anything sticking out sideways. It also saves the page as pictures, cut into
// lengths a person or a model can read.
//
//   node scripts/look.mjs lessons/07-compression/                # the page as built or served
//   node scripts/look.mjs lessons/07-compression/ --width 390    # at a phone's width
//   node scripts/look.mjs lessons/07-compression/ --play         # with the loop playing
//   node scripts/look.mjs lessons/07-compression/ --set threshold=-40 --set ratio=10
//
// The site must be served first: `pnpm dev`, or `pnpm build` and `node scripts/serve.mjs`.
// --url gives another address (default http://localhost:4321 and the base path SITE_BASE);
// --out gives the folder for the pictures (default the system's temp folder).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { basePath as base, CHROMIUM_ARGS, findChromium, sitePort } from './site-env.mjs'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const at = args.indexOf(`--${name}`)
  return at >= 0 ? args[at + 1] : fallback
}
const all = (name) => args.flatMap((arg, i) => (arg === `--${name}` ? [args[i + 1]] : []))
const pagePath =
  args.find((arg, i) => !arg.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? ''
const root = option('url', `http://localhost:${sitePort}${base}/`)
const width = Number(option('width', 1280))
const out = option('out', path.join(os.tmpdir(), 'site-look'))
const play = args.includes('--play')
const SLICE = 2000

const browser = await chromium.launch({ executablePath: findChromium(), args: CHROMIUM_ARGS })
const page = await browser.newPage({ viewport: { width, height: 900 } })
const problems = []
page.on(
  'console',
  (message) => message.type() === 'error' && problems.push(`console: ${message.text()}`),
)
page.on('pageerror', (error) => problems.push(`error: ${error.message}`))
page.on('requestfailed', (request) => problems.push(`failed: ${request.url()}`))
page.on(
  'response',
  (response) =>
    response.status() >= 400 && problems.push(`${response.status()}: ${response.url()}`),
)

await page.goto(new URL(pagePath, root).href, { waitUntil: 'networkidle' })
const hasLab = (await page.locator('.playbar').count()) > 0
if (hasLab) {
  await page
    .waitForSelector('.playbar[data-ready]', { timeout: 30_000 })
    .catch(() => problems.push('the lab never became ready'))
}
for (const pair of all('set')) {
  const [id, value] = pair.split('=')
  const renders = Number(await page.locator('.playbar').getAttribute('data-renders'))
  // Through the page's own store, as a slider would.
  const moved = await page.evaluate(
    ([control, wanted]) => {
      const input = document.querySelector(`#control-${control}`)
      const choice = document.querySelectorAll(`[data-control="${control}"] [role=radio]`)[
        Number(wanted)
      ]
      if (choice) return (choice.click(), true)
      if (!input) return false
      // The slider's place for a value is worked out by trying each: it may be logarithmic.
      const output = input.closest('.control').querySelector('output')
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      let best = 0
      let distance = Infinity
      for (let place = 0; place <= 1000; place += 1) {
        set.call(input, String(place))
        input.dispatchEvent(new Event('input', { bubbles: true }))
        const shown = parseFloat(output.textContent.replace('−', '-').replace('k', 'e3'))
        if (Math.abs(shown - Number(wanted)) < distance) {
          distance = Math.abs(shown - Number(wanted))
          best = place
        }
      }
      set.call(input, String(best))
      input.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    },
    [id, value],
  )
  if (!moved) problems.push(`no control called ${id} on the page`)
  else {
    await page
      .waitForFunction(
        (n) => Number(document.querySelector('.playbar')?.dataset.renders) > n,
        renders,
        { timeout: 15_000 },
      )
      .catch(() => {})
    await page.waitForFunction(
      () => !document.querySelector('.playbar-status')?.textContent?.includes('Rendering'),
    )
  }
}
const height = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < height; y += 500) {
  await page.evaluate((top) => window.scrollTo(0, top), y)
  await page.waitForTimeout(100)
}
await page.evaluate(() => window.scrollTo(0, 0))
if (play && hasLab) {
  await page.locator('.playbar-play').click()
  await page.waitForTimeout(1500)
}
await page.waitForTimeout(400)

const figures = await page.locator('[data-figure]').count()
const drawn = await page.locator('[data-figure][data-drawn]').count()
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
)
const status = hasLab ? await page.locator('.playbar-status').textContent() : 'no lab on this page'
console.log(`${new URL(pagePath, root).href} at ${width} px`)
console.log(`lab: ${status}`)
console.log(`figures drawn: ${drawn} of ${figures}`)
console.log(`sticking out sideways: ${overflow} px`)
if (play && hasLab) {
  const meter = await page.evaluate(
    () => document.querySelector('.playbar-meter span')?.style.transform,
  )
  console.log(`playing: meter ${meter}`)
}

// The bars that stay in view would be in every picture's middle: let them lie where they are.
await page.addStyleTag({ content: '.playbar, .site-header { position: static !important; }' })
fs.mkdirSync(out, { recursive: true })
const name = (pagePath.replace(/\/+$/, '').split('/').pop() || 'home').replace(/[^\w-]/g, '_')
const full = await page.evaluate(() => document.body.scrollHeight)
const files = []
for (let top = 0, n = 0; top < full; top += SLICE, n += 1) {
  const file = path.join(out, `${name}-${width}-${String(n).padStart(2, '0')}.png`)
  await page.screenshot({
    path: file,
    fullPage: true,
    clip: { x: 0, y: top, width, height: Math.min(SLICE, full - top) },
  })
  files.push(file)
}
console.log(`pictures:\n  ${files.join('\n  ')}`)
console.log(problems.length ? `problems:\n  ${problems.join('\n  ')}` : 'no errors on the page')
await browser.close()
process.exit(problems.length ? 1 : 0)
