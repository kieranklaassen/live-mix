// The site's browser tests run on the site as built: `pnpm build` first, then `pnpm test:browser`.
// They are served under the same base path the build was made for (SITE_BASE, '/live-mix' when
// unset), so a test never knows whether it is at a domain's root or under a prefix.
import fs from 'node:fs'
import { defineConfig } from '@playwright/test'

const base = (process.env.SITE_BASE ?? '/live-mix').replace(/\/+$/, '')
const port = Number(process.env.SITE_PORT ?? 4321)
// A machine that ships its own Chromium says where; otherwise Playwright's own is used.
const chromium = [process.env.SITE_CHROMIUM, '/opt/pw-browsers/chromium'].find(
  (file) => file && fs.existsSync(file),
)

export default defineConfig({
  testDir: 'tests/browser',
  timeout: 90_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}${base}/`,
    launchOptions: {
      executablePath: chromium,
      // Sound starts only on a click in the page; this lets the click of a test count as one.
      args: ['--autoplay-policy=no-user-gesture-required'],
    },
  },
  webServer: {
    command: `node scripts/serve.mjs ${port}`,
    url: `http://localhost:${port}${base}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
