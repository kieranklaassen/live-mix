# Examples

The code samples embedded in the repository [README](../README.md), as real
modules.

- `readme/*.ts(x)` import the package by its public entries
  (`@kieranklaassen/live-mix`, `./dsp`, `./react`), which
  [`tsconfig.json`](./tsconfig.json) maps onto `src/` so they are type-checked
  against the current source by `pnpm typecheck`.
- `src/__tests__/readme-examples.test.ts` compares every block in the README
  with its file verbatim (each block is preceded by
  `<!-- example: examples/readme/<name> -->`) and requires every file here to
  be embedded, so the README cannot drift from what compiles.

To change a sample, edit the file, run `pnpm format`, and paste the result
into the README's block — or let the test tell you which block is stale.
