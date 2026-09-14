# Consumer guide: Breathwork Live

[Breathwork Live](https://github.com/kieranklaassen/breathwork-live) (Rails
8.1 + Inertia + Vite; mainline `feat/breathwork-live`, no `main`) is a live
speech-to-speech breathwork coach that mixes music under an AI voice, on
iPhones with the screen locked. It adopted the library in U12 behind a flag,
deleted its own `musicEngine.ts`/`voiceReverb.ts` in U14, and moved every
remaining audible path onto engine tracks in U26. Its 979-line
recorded-`AudioParam` harness asserts that the graph the library builds is
the one the app had — structure changed, sound did not (KTD4).

Pinned: `"@kieranklaassen/live-mix": "github:kieranklaassen/live-mix#532e9b3"`
(v0.1.0) as of `feat/breathwork-live@991b575`; the registry pin follows the
first publish. The second half of U29 — routing `toolHandlers.ts` through
`AgentController` — is the next library-related PR on this repo.

## What it uses

| App file (`app/frontend/lib/breathwork/`)     | Library surface                                                                                                                                                                                                                                                                                                        | Why                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionMixer.ts` (U26)                       | `createEngine({ context, now, setIntervalFn, tickMs: 100, output: { mode, mediaTitle, mediaArtist: 'Adem', createAudioElement, mediaSession }, samples: { fetchImpl, budgetBytes: 256 MiB }, retainSamples: false })`, `engine.addBus('music')`, `engine.output.output`, `engine.activateOutput()`, `engine.dispose()` | **One engine per `AudioContext`**, created on the start gesture and shared by the intake and the guided session, so the coach's voice and hall, the ambience, the breath guide and the music all end at the one `OutputRouter` (element mode on iOS). |
|                                               | `engine.addDucker(musicBus)` (legacy), `engine.addLiveInputTrack('voice', { destination: engine.output })`, `voice.onAttach((s) => ducker.key(s))`, `voice.attach(node \| stream)`, `voice.detach()`                                                                                                                   | The coach's voice keys the duck bus and reaches the speakers through its own gain (the remote `<audio>` is muted — Chrome); deliberately not on the duck bus. Re-keyed on every reconnect.                                                            |
|                                               | `engine.addReturnTrack('hall', { device: createConvolverReverb(ctx), destination: engine.output })`, `voice.sends.add(hall)`                                                                                                                                                                                           | A touch of generated-IR space under the voice, engine-lifetime.                                                                                                                                                                                       |
|                                               | `engine.addInstrumentTrack('breath-guide', { device: guide, destination: musicBus })`                                                                                                                                                                                                                                  | The breath guide as an app-owned `NoteDevice` under the duck.                                                                                                                                                                                         |
|                                               | `engine.addElementTrack('ambience')`, `track.addSource(new ElementSource(ctx, { id, url, createAudioElement }))`                                                                                                                                                                                                       | The dawn bed streams (first streaming consumer); feeds the master, never ducked; asked for **before** `activate()` so the start gesture unlocks its element.                                                                                          |
|                                               | `MediaMetadata`/`mediaSession` handling around `setMediaTitle`                                                                                                                                                                                                                                                         | Lock-screen title once the theme is known (the library gained `OutputRouter.setMediaTitle()` in #38 for this).                                                                                                                                        |
| `sectionPlaylist.ts` (U12/U14)                | `engine.addAudioTrack('music', { destination: musicBus, lookaheadSec: 5, preloadSec: 12 })`, `music.play(key, voiceOptions, when)`, `engine.samples` (`load`, `get`, `forget`), `engine.master.gain.setTargetAtTime`, `engine.stop({ fadeSec: STOP_FADE_SECONDS })`                                                    | The former `MusicEngine`'s section/boundary/spare/steer/extend logic moved **verbatim**; it drives `AudioTrack.play` itself (no clips), which is why `retainSamples` is off and it holds decoded tracks by hand.                                      |
|                                               | Constants re-exported from the library: `CROSSFADE_SECONDS`, `STEER_CROSSFADE_SECONDS`, `STOP_FADE_SECONDS`, `DUCK_DEPTH`, `DUCK_TIME_CONSTANT`, `ENV_ATTACK_MS`, `ENV_RELEASE_MS`, `ENV_POLL_MS`, `ENV_GAIN_SCALE`, `REVERB_DECAY_SECONDS`, `REVERB_WET_LEVEL`, `MAX_CLIP_GAIN_DB`, `isIOSWebKit`                     | The values the in-app engine used are the library's defaults; the parity harness pins them.                                                                                                                                                           |
| `breathGuide.ts` (U19 → U26)                  | `NoteDevice`, `ParamSpec`, `clampParam`                                                                                                                                                                                                                                                                                | Noise → bandpass → gain swells timed to each section's breathing cycle, as a device with params (`peak`, `lowHz`, `highHz`, `q`) whose defaults are the U19 constants.                                                                                |
| `ambience.ts` (U20 → U26)                     | `ElementSource`, `ElementTrack`, `ElementVoice`                                                                                                                                                                                                                                                                        | 4 s linear fade-in to a quiet level (−9.1 dB trim), loop, handoff crossfade out (6 s) when the first section fades in.                                                                                                                                |
| `components/breathwork/SessionExperience.tsx` | `SessionMixer` with `outputMode: isIOSWebKit() ? 'element' : 'direct'`                                                                                                                                                                                                                                                 | Builds the mixer on the first gesture; the intake and the session share it.                                                                                                                                                                           |
| `__tests__/*.test.ts`                         | `@kieranklaassen/live-mix/testing`                                                                                                                                                                                                                                                                                     | The 979-line `musicEngine` harness re-targeted with zero assertion edits, plus mixer, guide and ambience suites (372 tests at U26).                                                                                                                   |

Not yet used: strips beyond the lazy default (no pan/solo in the app), the
worklet ducker (an option for `SectionPlaylist` after Kieran verifies it
live; default stays the legacy poll for parity), the master limiter and LUFS
meter, automation lanes, the score document, the React entry (the app has
its own UI).

## The coach's tools today

`app/services/breathwork/agent_tools.rb` declares `set_pace`,
`extend_current_section` (1–300 s), `advance_to_next_section`,
`set_music_volume` (0–1) and `set_music(calmer|stronger|change)`;
`app/frontend/lib/breathwork/toolHandlers.ts` maps them onto the conductor
(`conductor.ts`, 1,705 lines: pace factors 1.15/0.85 bounded 0.7–1.6, the
55-minute cap, `extendSection` with headroom, `setMusic` → the Camelot /
intensity resolver → boundary moves, the user-speech dip on the master). The
U29 wiring keeps every schema and result payload identical for the model:
`toolHandlers.ts` delegates to `agent.call(...)` with the conductor supplying
the session hooks (`setMusicVolume` so its dip stays its own, `steer` or
`library` + `replaceUpcoming`, `extendSection`, `advanceSection`,
`setBreathPace`, `isSpeaking`, `headroomSec`, `describe`) — see
[agent-api.md § Consumer wiring notes](../agent-api.md#consumer-wiring-notes).

## Install and build

- `vite.config.ts`: `optimizeDeps: { exclude: ['@kieranklaassen/live-mix'] }`,
  `server: { fs: { allow: ['..'] } }`.
- Dockerfile: `npm ci` with a `LIVE_MIX_TOKEN` build secret
  (`config/deploy.yml` `builder.secrets`; `.kamal/secrets` must set
  `LIVE_MIX_TOKEN=$KAMAL_REGISTRY_PASSWORD` before the next `bin/kamal build`
  — an open item for Kieran) rewriting `github.com` URLs for the `github:`
  dependency. Switches to the `.npmrc` + `NPM_TOKEN` path once the registry
  publish exists ([getting started §1](../getting-started.md#1-install)).
- CI (`.github/workflows/ci.yml`): `LIVE_MIX_NPM_TOKEN` (classic PAT, `repo`
  - `read:packages`) authenticates git for `npm ci`. Actions on this private
    repo are billing-blocked at the time of writing.
- Verification per the plan: `npm ci && npm run check` (tsc + Vitest),
  `bin/vite build --mode test && npm run build:ssr` (SSR import safety),
  `npm audit --omit=dev --audit-level=moderate` (the library has zero runtime
  deps), `bin/rails db:test:prepare test`.

## What Kieran checks by hand

A desktop session; an iPhone session with the screen locked (element output
continues, lock-screen title, intake ambience keeps playing through the
lock); a coach takeover; memory over a 45-minute session with the 256 MiB
budget ([iphone-memory-and-element-source.md](../iphone-memory-and-element-source.md));
the bed's loop point. Recorded in the U12/U14/U26 PRs on the app repo.

## Reading order for a change here

1. `sessionMixer.ts` — the graph and its order (the harness depends on it).
2. `sectionPlaylist.ts` — the music logic; treat as verbatim legacy.
3. `docs/solutions/realtime-voice-session-architecture.md` in the app —
   decision 4 (move boundaries, never truncate) is R6 here.
4. The [adaptive session recipe](../recipes/adaptive-session.md) is this app
   in library calls.
