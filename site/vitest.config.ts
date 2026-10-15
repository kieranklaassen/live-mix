import { defineConfig } from 'vitest/config'

// Unit tests of the site's own code, and one test per lab module (tests/labs), which loads the
// module `pnpm labs` built and asserts what its lesson says. The browser tests are Playwright's.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/labs/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
  },
})
