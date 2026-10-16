// The site's browser tests run on the site as built: `pnpm build` first, then `pnpm test:browser`.
// They are served under the same base path the build was made for (SITE_BASE, '/live-mix' when
// unset), so a test never knows whether it is at a domain's root or under a prefix.
import { defineConfig } from '@playwright/test'
import {
  basePath as base,
  CHROMIUM_ARGS,
  findChromium,
  sitePort as port,
} from './scripts/site-env.mjs'

// A machine that ships its own Chromium says where; otherwise Playwright's own is used.
const chromium = findChromium()

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
      args: CHROMIUM_ARGS,
    },
  },
  webServer: {
    command: `node scripts/serve.mjs ${port}`,
    url: `http://localhost:${port}${base}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
