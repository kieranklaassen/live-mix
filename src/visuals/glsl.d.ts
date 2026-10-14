// A shader's text, as the build and the tests hand it over (`scripts/build.mjs`, `vitest.config.ts`).
declare module '*.glsl' {
  const text: string
  export default text
}
