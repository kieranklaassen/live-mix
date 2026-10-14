import { defineConfig } from 'vitest/config'

// Node environment on purpose: the library must run headless. Web Audio is
// exercised through the recording mocks in src/testing, never a DOM shim.
export default defineConfig({
  plugins: [
    {
      // A shader is its text, as `scripts/build.mjs` hands it over too.
      name: 'glsl-as-text',
      transform(code, id) {
        if (!id.endsWith('.glsl')) return null
        return { code: `export default ${JSON.stringify(code)}`, map: null }
      },
    },
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
