import { defineConfig } from 'vitest/config'

// Node environment on purpose: the library must run headless. Web Audio is
// exercised through the recording mocks in src/testing, never a DOM shim.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
