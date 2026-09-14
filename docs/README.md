# live-mix documentation

Everything here is prose you can read on GitHub; the API reference is
generated from the five public entries and lives in CI, not in git.

## Start

- [Getting started](./getting-started.md) — install (GitHub Packages or
  `github:` for the private repo), Vite, worklet/`.wasm` asset resolution,
  a first engine, iOS output activation, headless tests.
- [React](./react.md) — the headless hooks, the styled kit, and the
  `playground/` app (`pnpm playground`), with its browser smoke test.

## Concepts

The vocabulary the engine is built on, one page each, with the pointers into
the reference documents.

| Page                                                              | What it teaches                                                                                                                         |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [Time](./concepts/time.md)                                        | Seconds first; the transport anchor; the scheduler's catch-up and late join; clips; tempo map, warping and Camelot as views             |
| [The mixer](./concepts/mixer.md)                                  | Track kinds, lazy channel strips, groups, buses, returns and sends, solo-in-place, the master's limiter and meters, the output terminus |
| [Devices and the registry](./concepts/devices.md)                 | The one device contract; node, WASM, worklet, rack and WAM kinds; the C ABI; registry and presets; racks and macros; delay compensation |
| [Automation and modulation](./concepts/automation.md)             | Lanes written ahead of the playhead; the override rule; LFO, envelope, random, macro, external phase; the matrix                        |
| [The score](./concepts/score.md)                                  | The document as source of truth; what stays live; operations, log, undo; rendering rules                                                |
| [Agent control and rails](./concepts/agent-api.md)                | Tools over the score and session hooks; intents and the intensity ladder; rails that outrank the agent; the snapshot                    |
| [The session grid](./concepts/session-grid.md)                    | Scenes × slots as arrangement clips; quantised launch on the tempo map; launch modes, legato, follow actions                            |
| [Control surfaces](./concepts/control-surface.md)                 | MIDI/OSC learn: sources, targets, modes, soft takeover, how automation yields                                                           |
| [Live input and ducking](./concepts/live-input.md)                | Pass-through tracks, monitoring latency, the two duckers, recording a take                                                              |
| [Samples, memory and streaming](./concepts/samples-and-memory.md) | The sample store's budget and holds, streaming beds through media elements, the iPhone story                                            |
| [Rendering and export](./concepts/render.md)                      | Offline render equals live; stems; score bounces; WAV; recorders as taps; the golden layers                                             |

## Recipes

| Recipe                                                            | Shape                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Adaptive music session](./recipes/adaptive-session.md)           | Breathwork-style: one engine, a duck bus keyed by a voice, streaming ambience, the coach as agent |
| [Live instrument with MIDI](./recipes/live-instrument.md)         | ambient-live-style: a looping timeline, a synth from keys, a guitar monitored, knobs learned      |
| [Offline bounce](./recipes/offline-bounce.md)                     | Render, stems, a score bounce, proving render equals live, running in Node                        |
| [Adding a C++ or Faust device](./recipes/adding-a-wasm-device.md) | From kkfonie source to a registered device both apps list                                         |
| [Adding a WAM](./recipes/adding-a-wam.md)                         | A WebAudioModules 2.0 plugin as an insert, an instrument, a registry device                       |

## Consumers

- [Breathwork Live](./consumers/breathwork-live.md) — what it uses today, the
  coach's tools, install and build, what Kieran checks by hand.
- [ambient-live](./consumers/ambient-live.md) — what it uses today, the MIDI
  migration, latency figures, install and build.

## Reference

Written next to the subsystem they document, by the unit that built it.

| Document                                                                     | Subsystem                                                                                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [score.md](./score.md)                                                       | Schema, the operations, log and history, undo granularity, rendering rules                                                                              |
| [agent-api.md](./agent-api.md)                                               | Every tool, intent compilation, rails table, results, audit, snapshot, wiring                                                                           |
| [agent-authored-scores.md](./agent-authored-scores.md)                       | The session script a planner fills, its canon, the compiler to a score (tuin selector parity), live and offline renderers, the authoring tools          |
| [session.md](./session.md)                                                   | The session grid: model, operations, quantisation, launch modes, follow actions, runtime API                                                            |
| [control-surface.md](./control-surface.md)                                   | Mapping model, decoders, persistence, React hooks, ambient-live migration                                                                               |
| [devices.md](./devices.md)                                                   | The device catalogue with origins, parameters and measured CPU cost                                                                                     |
| [faust-devices.md](./faust-devices.md)                                       | Faust → C++ → the ABI; adding a Faust device                                                                                                            |
| [wam.md](./wam.md)                                                           | The WAM host adapter end to end, gallery and licensing                                                                                                  |
| [iphone-memory-and-element-source.md](./iphone-memory-and-element-source.md) | The iPhone verification checklist for eviction and streaming                                                                                            |
| **API reference**                                                            | `pnpm docs:api` → `docs/api/` (TypeDoc over `.`, `./dsp`, `./react`, `./testing`, `./wam`); the `api-reference` artefact of every CI run; not committed |

## Project

- [Decisions log](./decisions.md) — KD/KTD distilled, plus what each unit
  decided on the way.
- [Contributing](./contributing.md) — commands, layout, conventions, CI,
  releasing, the never-list.
- [CHANGELOG](../CHANGELOG.md) — produced by changesets; one entry per PR.
- [Plans](./plans/) — the plan of record (U1–U40), the library assessment and
  the earlier plan it superseded.

## Why `docs/api` is generated, not committed

TypeDoc output for these entries is ~16 MB of HTML that changes with every
export. Committing it would make every unit's PR conflict on generated files
and drift the moment one merged. Instead: `pnpm docs:api` builds it locally in
seconds (`scripts/ci-local.sh` runs it too, so a broken doc comment fails the
merge gate), the `docs` CI job uploads it as the `api-reference` artefact for
each commit, and the module pages come from the `@module` doc comment at the
top of each entry file.
