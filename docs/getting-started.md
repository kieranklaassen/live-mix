# Getting started

From an empty consumer to a mix that plays, with the wiring that trips people
up (private install, Vite, worklet and `.wasm` assets, iPhone output) done
once and explained.

## 1. Install

The repository is **private** and the package is published to GitHub Packages
under the `@kieranklaassen` scope. Until the first registry publish lands, both
consumer apps use the `github:` fallback; both paths are below.

### Registry (preferred once published)

Commit an `.npmrc` next to the consumer's `package.json` — no token in it:

```ini
@kieranklaassen:registry=https://npm.pkg.github.com
```

Then pin an exact version:

```sh
npm install @kieranklaassen/live-mix@0.1.0   # releases (dist-tag latest)
npm install @kieranklaassen/live-mix@next    # snapshot of main with pending changesets
```

Authentication, per environment:

| Where                   | How                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kieran's machines       | `npm login --registry=https://npm.pkg.github.com --scope=@kieranklaassen` once (username `kieranklaassen`, password = a PAT with `read:packages`). Lands in `~/.npmrc`.                                                                                                                               |
| Consumer GitHub Actions | `actions/setup-node` with `registry-url: https://npm.pkg.github.com`, `scope: '@kieranklaassen'` and `NODE_AUTH_TOKEN: ${{ secrets.LIVE_MIX_NPM_TOKEN }}` — a classic PAT with `read:packages` stored as a repository secret. A repo's own `GITHUB_TOKEN` cannot read another repo's private package. |
| Kamal / Docker build    | Kamal `builder.secrets: [NPM_TOKEN]` (value from `.kamal/secrets`, e.g. the same token as `KAMAL_REGISTRY_PASSWORD`, which already needs `packages` scope) and, in the Dockerfile build stage, the snippet below.                                                                                     |

```dockerfile
RUN --mount=type=secret,id=NPM_TOKEN,required=true \
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/NPM_TOKEN)" > /root/.npmrc && \
    npm ci && rm -f /root/.npmrc
```

### Fallback: `github:` dependency (what both apps use today)

```json
"@kieranklaassen/live-mix": "github:kieranklaassen/live-mix#<sha>"
```

`prepare` builds `dist/` with nothing but Node and the `.wasm` artefacts are
committed, so no Emscripten is needed in the consumer. It does need git access
to the private repo wherever `npm ci` runs — a PAT with `repo` scope through

```sh
git config --global url."https://x-access-token:$TOKEN@github.com/".insteadOf "https://github.com/"
```

— and it re-runs the library build on every consumer install. CI proves this
path on every run (`git-fallback` job); the registry is the destination.

### Local iteration against an app

```sh
# live-mix
pnpm build --watch
# the app (both apps use npm)
npm link ../live-mix
```

`file:` dependencies never land in a committed `package.json` (KTD13). With
`npm link` the package sits outside the Vite root, hence `server.fs.allow`
below; `resolve.dedupe: ['react']` keeps one React when the `./react` entry is
in play.

## 2. Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  // Pure ESM, zero dependencies: pre-bundling it would break the
  // `new URL(..., import.meta.url)` resolution of the worklet and .wasm in dev.
  optimizeDeps: { exclude: ['@kieranklaassen/live-mix'] },
  // Only for `npm link ../live-mix`: the package lives outside the root.
  server: { fs: { allow: ['..'] } },
})
```

Both apps ship exactly this (`ambient-live/vite.config.ts`,
`breathwork-live/vite.config.ts`). No COOP/COEP headers, no
`crossOriginIsolated` requirement: the engine never needs `SharedArrayBuffer`.

## 3. Worklet and `.wasm` asset resolution

The `dsp` entry resolves its worklet processor and each device's `.wasm` with
`new URL('../worklets/wasm-device.js', import.meta.url)` /
`new URL('../wasm/<device>.wasm', import.meta.url)` — **lazily, inside the
factories**, never at import time (KTD3). Relative to the built entry that is
`dist/worklets/*` and `dist/wasm/*`, which ship in the package; Vite rewrites
them to hashed asset URLs in production and serves them from `node_modules`
in dev (with `optimizeDeps.exclude`). The same holds for the meter, ducker
and recorder worklets on the core entry.

When a bundler cannot follow that, every factory takes explicit overrides:

```ts
import processorUrl from '@kieranklaassen/live-mix/worklets/wasm-device.js?url'
import plateWasm from '@kieranklaassen/live-mix/wasm/dattorro.wasm?url'
import { createDattorroReverb } from '@kieranklaassen/live-mix/dsp'

const plate = await createDattorroReverb(ctx, { processorUrl, wasm: plateWasm })
```

`wasm` accepts a URL, raw bytes, a `Response` or a pre-compiled
`WebAssembly.Module`; the module is compiled once per page and the processor
added once per context regardless of how many devices you create. The
`playground/` in this repo is a live example of the override: it imports the
library from `src/`, where there is no `dist/worklets`, so its Vite config
serves that folder at `/worklets/` and its device registry hands every WASM
factory `processorUrl: '/worklets/wasm-device.js'` (`playground/src/demo.ts`).

Base64-inlined WASM and blob-URL worklets were rejected on purpose (SIMD
growth; WebKit's `addModule(blob:)` history on iOS).

## 4. A first engine

```ts
import { createEngine } from '@kieranklaassen/live-mix'
import { createDattorroReverb } from '@kieranklaassen/live-mix/dsp'

// From a user gesture: browsers only start audio after one.
const context = new AudioContext({ latencyHint: 'interactive' })
const engine = createEngine({ context, master: { meter: true } })

// Tracks feed the master (or a bus/group you name). A track's channel strip
// (input gain → inserts → pan → fader → mute/solo → sends) is lazy: it creates
// no nodes until the first setLevel/addInsert/send.
const music = engine.addAudioTrack('music', { lookaheadSec: 5, preloadSec: 12 })
const hall = engine.addReturnTrack('hall', { device: await createDattorroReverb(context) })
music.strip.sends.add(hall, { level: 0.3 })

// Decode once, reference by id from any clip. Clips are seconds-first records.
await engine.samples.load('intro', '/music/intro.mp3')
music.clips.add({
  id: 'intro-1',
  sourceId: 'intro',
  startSec: 0,
  offsetSec: 0,
  durationSec: 180,
  fadeInSec: 2.5,
  fadeOutSec: 2.5,
  fadeCurve: 'equalPower',
  gainDb: -3.2,
})

engine.transport.onChange(({ state }) => console.log(state))
engine.transport.start()
// … later
engine.transport.stop({ fadeSec: 0.75 })
engine.dispose()
```

Every parameter move is a ramp (`setTargetAtTime`, 5 ms by default), never a
step; every clip start inside the lookahead window is idempotent by key, so a
throttled background tab catches up instead of skipping or replaying. The
[concepts](./concepts/) pages take each part from here.

## 5. iOS: element output mode and activation

Safari on iPhone stops a plain `AudioContext` when the screen locks. The
engine's `OutputRouter` is the single terminus of the whole mix, so lock-screen
playback is engine-wide: in `element` mode the master feeds a
`MediaStreamAudioDestinationNode` whose stream plays through an unmuted
`<audio>` element, and `MediaSession` metadata names the session on the lock
screen.

```ts
import { createEngine, isIOSWebKit } from '@kieranklaassen/live-mix'

const engine = createEngine({
  context,
  output: {
    mode: isIOSWebKit() ? 'element' : 'direct',
    mediaTitle: 'Morning session',
    mediaArtist: 'Adem',
  },
})

// On the same user gesture that starts the session — and only then:
await engine.activateOutput()
```

`activateOutput()` calls `element.play()` and installs the metadata; it is
idempotent and a no-op in `direct` mode, so call it unconditionally from the
start gesture. `engine.output.setMediaTitle(title, artist?)` rewrites the
lock-screen metadata later (a placeholder at intake, the theme at takeover);
`engine.output.metadata` reads it back. Long beds that stream through an `ElementTrack` need their
elements unlocked on that gesture too (`track.unlockAll()`), because iOS only
lets a timer-driven `play()` succeed on an element the user has already
touched — Breathwork Live asks for its ambience bed **before** `activate()`
for that reason (`consumers/breathwork-live.md`). Memory on a 45-minute
session: `samples: { budgetBytes }` and the streaming path are in
[samples-and-memory](./concepts/samples-and-memory.md) and the iPhone
checklist in
[iphone-memory-and-element-source.md](./iphone-memory-and-element-source.md).

## 6. Headless tests

```ts
import { createEngine } from '@kieranklaassen/live-mix'
import { asAudioContext, createMockContext } from '@kieranklaassen/live-mix/testing'

const ctx = createMockContext({ sampleRate: 48_000 })
const engine = createEngine({ context: asAudioContext(ctx) })
engine.track('music').strip.setLevel(0.5)
ctx.gains[0].gain.events // → [{ method: 'setTargetAtTime', args: [0.5, …] }, …]
```

The mock records every `AudioParam` automation call and every
connect/start/stop, so tests assert what the graph was told to do — the same
harness Breathwork Live's 979-line parity suite runs against. Vitest in the
Node environment; no DOM shim. Renders that must equal live playback use
`renderOffline` on an injected offline context (see
[render](./concepts/render.md)).

## Where next

- [Concepts](./concepts/) — time, the mixer, devices, automation, the score,
  agent control, control surfaces, live input, memory, rendering.
- [Recipes](./recipes/) — an adaptive session, a live instrument with MIDI, a
  bounce, a new C++/Faust device, a WAM.
- [React](./react.md) — hooks and the styled kit; `pnpm playground`.
- [Consumers](./consumers/) — what Breathwork Live and ambient-live use today.
