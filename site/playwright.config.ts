// The site's browser tests run on the site as built: `pnpm build` first, then `pnpm test:browser`.
// They are served under the same base path the build was made for (SITE_BASE, '/live-mix' when
// unset), so a test never knows whether it is at a domain's root or under a prefix.
//
// A one-lesson run (scripts/lesson.sh, SITE_ONLY_LESSON) looks at that lesson's own build, in
// its own folder and at a port of the run's own: scripts/serve.mjs serves whichever the
// environment names. The script asks for a server of the run's own (SITE_OWN_SERVER): one that
// already answers at the port is then never taken for it, since that could be another run's,
// serving another build of the same lesson.
import { defineConfig } from '@playwright/test'
import {
  basePath as base,
  CHROMIUM_ARGS,
  findChromium,
  sitePort as port,
  siteShard,
} from './scripts/site-env.mjs'

// A machine that ships its own Chromium says where; otherwise Playwright's own is used.
const chromium = findChromium()

export default defineConfig({
  testDir: 'tests/browser',
  timeout: 90_000,
  fullyParallel: true,
  // One lesson's tests share the machine with other lessons' (scripts/lesson.sh), so they take
  // two workers as a runner does.
  workers: process.env.CI || process.env.SITE_ONLY_LESSON ? 2 : 4,
  shard: siteShard(),
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
    reuseExistingServer: !process.env.CI && !process.env.SITE_OWN_SERVER,
    timeout: 60_000,
  },
})
