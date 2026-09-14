# Contributing: development, layout, CI, releasing

Solo-maintainer library, `0.x`, no support promise: it contains exactly what
its two consumers use (KD8 — every catalogue item is Core, Dream or
Maybe-never, and YAGNI applies to carrying cost, not ambition).

## Commands

```sh
pnpm install          # also builds dist/ (prepare)
pnpm test             # Vitest, Node environment (jsdom per file for React)
pnpm typecheck        # library + playground
pnpm lint             # eslint + prettier --check (docs/*.md included)
pnpm dev              # rebuild on change
pnpm build            # tsup entries + esbuild worklet bundles + wasm copy + styles.css
pnpm pack:check       # pack a tarball and verify every export resolves; optional peers stay out of `.`/`./dsp`/`./testing`
pnpm test:native      # C++ device harnesses with the system compiler (CXX=g++ where c++ is a header-less clang)
pnpm build:wasm       # rebuild src/dsp/wasm/*.wasm (needs Emscripten 4.0.15)
pnpm build:faust      # regenerate cpp/faust/generated + src/dsp/devices/faust from *.dsp (builds Faust 2.88.0 into tmp/)
pnpm docs:api         # TypeDoc → docs/api (gitignored)
pnpm playground       # the demo app on http://localhost:5199/
pnpm playground:smoke # build the playground + its Playwright smoke spec in headless Chrome (screenshots)
pnpm test:browser     # the whole browser suite: real-audio render-equals-live golden + the playground smoke
bash scripts/ci-local.sh   # the whole CI matrix locally; prints the Markdown summary PR bodies carry
```

`scripts/ci-local.sh` mirrors `.github/workflows/ci.yml` step for step:
typecheck, lint, tests, build, pack check, the API reference, native C++
tests, Faust regeneration diffed against the committed sources, the emsdk
rebuild diffed against the committed `.wasm`, the playground smoke spec when
Google Chrome is installed (`--skip-playground`; `--browser` runs the whole
Playwright suite with the real-audio golden instead), and the `github:`
install path (`GITHUB_TOKEN`, `--skip-git-install`). While GitHub
Actions is unavailable on this private repository (billing), its output is
pasted into every PR under "CI blocked (billing); local verification" and PRs
are squash-merged on that evidence.

## Layout

```
src/
  index.ts            core entry (@module live-mix)
  core/               Engine, tracks, buses, Transport, Scheduler, Clip, SampleStore, OutputRouter, Meter, native devices, stats
  core/devices/       Device contract, NodeDevice host + stock node devices, registry, presets, Rack/Chain, Macro maths, pdc
  core/automation/    ParamLane, LaneWriter, Automation loop, modulators, ModMatrix
  core/control/       ControlSurface, mapping table, MIDI/OSC decoders and inputs
  core/analysis/      Meter (analyser), LoudnessAnalyzer (BS.1770-4), LufsMeter (worklet host) + meter protocol
  core/render/        OfflineRenderer (renderOffline, renderStems, scheduleAhead), encode (WAV), Recorder
  core/sources/       ElementSource/ElementTrack (streaming), StretchSource (warping)
  core/time/, music/  TempoMap; Camelot and key matching
  dsp/                WasmDevice host, C ABI typings, asset resolution, device factories + param tables, registry descriptors
  dsp/devices/faust/  generated param tables for the Faust devices
  dsp/worklets/       wasm-device, ducker, meter, recorder processors → dist/worklets/*.js (one file each, no imports)
  dsp/wasm/           committed *.wasm artefacts (CI verifies they reproduce)
  react/              hooks (U24), components (U25), styles.css → dist/react/styles.css
  score/              Score schema, operations + inverses, OperationLog, History, ScoreDocument, ScoreRenderer, renderScore
  testing/            MockAudioContext + AudioParam recorder
  wam/                WebAudioModules 2.0 host adapter → its own entry
playground/           Vite demo app (not published): score-driven demo, mixer, devices, agent console, grid, bounce
examples/readme/      the README's code samples as modules, type-checked against src/ (examples/tsconfig.json) and pinned to README.md by src/__tests__/readme-examples.test.ts
browser-tests/        Playwright real-audio golden (harness over /dist, Web Audio call recorder, fingerprints) + the playground smoke spec
cpp/
  common/             device_api.h (the C ABI), dsp_util.h
  devices/*/          one folder per WASM device: DSP sources (origin SHA in device.json) + the ABI shim
  faust/              *.dsp sources, generated/ C++, *.device.cpp shims
  test/               native parity harnesses
scripts/              build.mjs, build-wasm.sh, build-faust.sh, test-native.sh, check-pack.mjs, ci-local.sh
docs/                 this documentation; docs/api is generated
.changeset/           one entry per PR
```

## Conventions

- **Entries are boundaries.** `.` and `./dsp` import nothing optional
  (`react`, `@webaudiomodules/*`, `signalsmith-stretch`); `pnpm pack:check`
  fails a PR that changes that. New device kinds or hosts with a dependency
  get their own entry (`./wam` is the precedent).
- **Import-safe under SSR.** No `window`, `document`, `AudioContext` or
  `import.meta.url` at module load; asset URLs resolve inside factories.
  Tests in `src/__tests__/ssr.test.ts` and `src/react/__tests__/ssr.components.test.tsx`
  import every entry in Node.
- **Ramps, never steps.** Every parameter write in the library is a
  `setTargetAtTime`/ramp or an in-device smoother; the recording mocks make a
  bare `.value =` visible in a diff.
- **Real-time rules.** Nothing allocates in `process()`; WASM memory is
  fixed; denormals are flushed in software in every feedback path; scheduling
  runs on a timer, never `requestAnimationFrame`; every scheduled start is
  idempotent by key.
- **Visual = audio.** A UI that shows a value reads the DSP's own formula
  (exported helpers: `dbToGain`, `gainToDb`, `normalizeParam`, `breathLaw`,
  `renderModulator`, `startsInWindow`).
- **Additive engine changes.** Phase 0 consumers assert recorded node order
  and `AudioParam` events; new stages are opt-in and installed after the
  engine exists (limiter, meters, strips materialise lazily). A behaviour
  change in the default graph is a breaking change.
- **Exports are pinned.** `src/__tests__/public-entry.test.ts` lists every
  public name per entry; adding an export means adding a pin. Descriptor
  tables (`device-contract.test.ts`) enumerate every device kind.
- **Style.** Prettier (`semi: false`, single quotes, width 100) and
  typescript-eslint type-checked rules; `switch` over a union ends in a
  `never` check; imports stay at the top (`import()` is an ESLint error —
  `WamDevice` carries the one justified exception).
- **PR shape.** One unit per PR from `feat/<unit-slug>` into `main`; the body
  cites the U-ID and R-IDs, lists anything touched outside the unit's files,
  carries the local CI table, and a changeset when `src/` changed.

## Adding to the docs

`docs/` is prose and Mermaid; `docs/api/` is generated by TypeDoc from the
five public entries and never committed — CI uploads it as the
`api-reference` artefact per commit, `pnpm docs:api` builds it locally, and
the module pages come from the `@module` doc comments at the top of each
entry file. Reference material for a subsystem lives next to it
(`docs/score.md`, `docs/wam.md`, …); the concept pages explain and link to
it; `docs/README.md` is the map. Prettier checks Markdown, so run
`pnpm format` before pushing. The code samples in the repository README are
files under `examples/readme/`: edit the file, then paste it into the block
that follows its `<!-- example: … -->` marker — `pnpm typecheck` compiles the
files against `src/` and `pnpm test` fails when a block and its file differ.

## Releasing

Versioning uses [changesets](../.changeset/README.md): add one per PR that
changes the published package (`pnpm changeset`). While the package is `0.x`,
a **minor** bump means breaking and a **patch** bump means everything else;
both consumer apps pin exact versions and migrate one at a time per breaking
bump (KTD14). On every push to `main` the release workflow publishes to
GitHub Packages with the workflow's own `GITHUB_TOKEN`:

- pending changesets → a `next` snapshot (`0.0.0-next-<timestamp>`, dist-tag
  `next`) and the "Version Packages" PR;
- merging that PR → the versioned release (dist-tag `latest`).

One-time repository settings (Kieran): Settings → Actions → General → **Allow
GitHub Actions to create and approve pull requests** (otherwise the version
PR cannot be opened; the branch `changeset-release/main` is still pushed and
can be turned into a PR by hand); and Actions billing on a private repository
— keep a spending limit or the included minutes available, or CI stops
running. Until then, version PRs are made by hand (`pnpm changeset version`)
and consumers pin `github:kieranklaassen/live-mix#<sha>`.

## Never

From the plan's hand-off: no deploys (`bin/kamal` is Kieran's, from the Mac
mini); no direct pushes to `main` here or to the apps' base branches; no
edits to `tuin`; no secrets in the repository (no `NPM_TOKEN`, no `.npmrc`
with credentials, no token in workflows beyond the default `GITHUB_TOKEN`);
no `file:` dependency or `npm link` residue committed; no `.wasm` built
inside a consumer's install or Docker image; no renumbering of R-, KD-, KTD-
or U-IDs.
