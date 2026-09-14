// Real-audio browser tests: headless Chrome (the installed Google Chrome via
// the `chrome` channel, or Playwright's Chromium when LIVE_MIX_BROWSER=chromium)
// with a real AudioContext — autoplay allowed, a fake audio/video device so
// getUserMedia and output never block — against the static server in
// serve.mjs. Run with `pnpm test:browser` (builds the harness first).

import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.LIVE_MIX_BROWSER_PORT ?? 4173)
const channel = process.env.LIVE_MIX_BROWSER === 'chromium' ? undefined : 'chrome'

export default defineConfig({
  testDir: './specs',
  outputDir: '../tmp/browser-tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${port}`,
    channel,
    headless: true,
    launchOptions: {
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--disable-features=AudioServiceOutOfProcess',
      ],
    },
  },
  webServer: {
    command: `node browser-tests/serve.mjs`,
    url: `http://127.0.0.1:${port}/browser-tests/harness/index.html`,
    reuseExistingServer: !process.env.CI,
    cwd: '..',
    env: { LIVE_MIX_BROWSER_PORT: String(port) },
  },
})
