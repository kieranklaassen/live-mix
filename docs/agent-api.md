# The agent control API (U29)

Every mixer capability is a tool a model can call (plan KD4 / KTD9): the 60
score operations from [`docs/score.md`](./score.md), the coach's musical
intents, a state query and undo — each with a JSON Schema, passed through
safety rails the agent cannot override (KD10, R27), applied through
`ScoreDocument.apply` so the `OperationLog` carries the author, and recorded
in an audit trail. Breathwork Live's coach is the first consumer; the API
knows nothing about it beyond the session hooks it fills in.

```ts
import { AgentController, ScoreDocument, createEngine, loadScore } from '@kieranklaassen/live-mix'

const engine = createEngine({ context })
const document = ScoreDocument.parse(json, { devices: engine.devices })
loadScore(engine, document)

const agent = new AgentController({
  engine,
  document,
  roles: { voice: 'voice', music: 'music', ambience: 'ambience' },
  library: tracks, // { id, title, intensity, camelot, durationSec, url }
  session: {
    // what the score does not know — the consumer's own concepts
    extendSection: (seconds) => conductor.extendSection(seconds),
    advanceSection: () => conductor.advanceSection(),
    setBreathPace: (direction) => conductor.setPace(direction),
    isSpeaking: () => conductor.isSpeaking(),
    describe: () => conductor.describeForAgent(),
  },
  rails: { maxShortTermLufs: -16 },
})

realtimeSession.update({ tools: agent.toOpenAiTools() }) // flat Responses/Realtime shape
// on a tool call from the model:
const result = agent.call(name, args, { author: { kind: 'agent', id: 'coach' } })
realtimeSession.sendToolResult(callId, result)
// every few seconds, or on demand:
agent.snapshot() // ≤ 2 KB JSON for the prompt
agent.diffSince(cursor) // only what changed since the model last looked
```

## Shape

- `AgentController` — the one object: `call`, `listTools`, `toOpenAiTools`,
  `toAnthropicTools`, `snapshot`, `diffSince`, `setCadence`/`onSnapshot`,
  `grantConsent`/`revokeConsent`, `undo`, `audit`, `rails`.
- `ToolRegistry` and `ToolSpec` — `{ definition: { name, description, parameters,
category, consent? }, available(view), plan(args, ctx) }`. A tool _plans_: it
  validates, runs the rails and compiles to score operations plus effects
  (engine calls, session hooks); the controller applies the plan. Dry runs and
  the audit trail fall out of that one path. Consumers may register their own
  tools (`tools: [...]` in the options).
- Backends: a `ScoreDocument` (operation tools, score-compiled intents), an
  `Engine` (meters, transport position, the `fade_out` fallback, device
  parameter ranges), and `AgentSession` hooks (sections, pace, dip logic, a
  consumer-owned steer). A tool is listed only when at least one of its
  backends is present — `listTools()` reflects what can actually run.
- Roles (`AgentRoles`): the strip-host ids that are the voice, the music, the
  ambience, the breath guide, and the ducker device instance. Intents act on
  roles; rails protect them.

## The tools

Names follow the OpenAI/Anthropic rule `^[a-zA-Z0-9_-]{1,64}$`:
`clip.replaceFrom` is exposed as `clip_replace_from`
(`toolNameForOperation` / `operationForToolName`). Rate limits are token
buckets (burst, then the sustained rate); `default` applies to unlisted tools.

| Tool                      | Category  | Consent   | Rate (burst / per min) | Description                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | --------- | --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `score_rename`            | operation | structure | 3 / 30                 | Rename the score.                                                                                                                                                                                                                                                                                                                                                             |
| `transport_loop`          | operation | arrange   | 3 / 30                 | Enable/disable the transport loop and/or set its length (null = no end).                                                                                                                                                                                                                                                                                                      |
| `tempo_set`               | operation | arrange   | 3 / 30                 | Replace the tempo map (segments ascending from 0).                                                                                                                                                                                                                                                                                                                            |
| `source_add`              | operation | arrange   | 3 / 30                 | Register a source (a decoded sample) clips can reference.                                                                                                                                                                                                                                                                                                                     |
| `source_remove`           | operation | arrange   | 3 / 30                 | Remove a source; refused while a clip uses it.                                                                                                                                                                                                                                                                                                                                |
| `track_add`               | operation | structure | 3 / 30                 | Add an audio, live-input or instrument track.                                                                                                                                                                                                                                                                                                                                 |
| `track_remove`            | operation | structure | 3 / 30                 | Remove a track with its lanes and routes.                                                                                                                                                                                                                                                                                                                                     |
| `track_move`              | operation | structure | 3 / 30                 | Move a track to another position.                                                                                                                                                                                                                                                                                                                                             |
| `element_track_add`       | operation | structure | 3 / 30                 | Add a streaming (media element) track.                                                                                                                                                                                                                                                                                                                                        |
| `element_track_remove`    | operation | structure | 3 / 30                 | Remove a streaming track.                                                                                                                                                                                                                                                                                                                                                     |
| `element_track_route`     | operation | structure | 3 / 30                 | Re-route a streaming track to the master or a group.                                                                                                                                                                                                                                                                                                                          |
| `element_track_set_clips` | operation | arrange   | 3 / 30                 | Replace a streaming track's clips.                                                                                                                                                                                                                                                                                                                                            |
| `group_add`               | operation | structure | 3 / 30                 | Add a summing group.                                                                                                                                                                                                                                                                                                                                                          |
| `group_remove`            | operation | structure | 3 / 30                 | Remove a group; its members re-route to where it fed.                                                                                                                                                                                                                                                                                                                         |
| `group_move`              | operation | structure | 3 / 30                 | Move a group to another position.                                                                                                                                                                                                                                                                                                                                             |
| `return_add`              | operation | structure | 3 / 30                 | Add a return track (one device fed by sends).                                                                                                                                                                                                                                                                                                                                 |
| `return_remove`           | operation | structure | 3 / 30                 | Remove a return; sends to it are dropped.                                                                                                                                                                                                                                                                                                                                     |
| `return_move`             | operation | structure | 3 / 30                 | Move a return to another position.                                                                                                                                                                                                                                                                                                                                            |
| `strip_rename`            | operation | structure | 3 / 30                 | Rename a track, group or return.                                                                                                                                                                                                                                                                                                                                              |
| `strip_route`             | operation | structure | 3 / 30                 | Re-route a track, group or return to the master or a group.                                                                                                                                                                                                                                                                                                                   |
| `strip_set`               | operation | —         | 3 / 30                 | Set a strip's fader level (0..1 for the agent, 1 is unity), pan (−1..1) or input gain; 'master' level is allowed.                                                                                                                                                                                                                                                             |
| `strip_mute`              | operation | —         | 3 / 30                 | Mute or unmute a track, group or return.                                                                                                                                                                                                                                                                                                                                      |
| `strip_solo`              | operation | —         | 3 / 30                 | Solo or unsolo a track, group or return.                                                                                                                                                                                                                                                                                                                                      |
| `strip_solo_safe`         | operation | —         | 3 / 30                 | Exempt a strip from being implicitly muted by other solos.                                                                                                                                                                                                                                                                                                                    |
| `clip_add`                | operation | arrange   | 3 / 30                 | Place a clip on an audio track.                                                                                                                                                                                                                                                                                                                                               |
| `clip_remove`             | operation | arrange   | 3 / 30                 | Remove a clip.                                                                                                                                                                                                                                                                                                                                                                |
| `clip_move`               | operation | arrange   | 3 / 30                 | Move a clip to a new start time.                                                                                                                                                                                                                                                                                                                                              |
| `clip_trim`               | operation | arrange   | 3 / 30                 | Change a clip's start, source offset and/or duration.                                                                                                                                                                                                                                                                                                                         |
| `clip_update`             | operation | arrange   | 3 / 30                 | Patch clip fields (fades, gain, loop, source…).                                                                                                                                                                                                                                                                                                                               |
| `clip_replace_from`       | operation | arrange   | 3 / 30                 | Drop every clip starting at or after fromSec and add the given clips (all starting there or later) — a re-plan of the remainder.                                                                                                                                                                                                                                              |
| `device_add`              | operation | structure | 3 / 30                 | Insert a device into a strip's chain ('master' for the master chain).                                                                                                                                                                                                                                                                                                         |
| `device_remove`           | operation | structure | 3 / 30                 | Remove an insert device with its lanes and routes.                                                                                                                                                                                                                                                                                                                            |
| `device_move`             | operation | structure | 3 / 30                 | Move an insert within its chain.                                                                                                                                                                                                                                                                                                                                              |
| `device_set_param`        | operation | —         | 3 / 30                 | Set one device parameter (clamped to the descriptor range).                                                                                                                                                                                                                                                                                                                   |
| `device_set_params`       | operation | —         | 3 / 30                 | Set several device parameters; null clears one back to the preset/default.                                                                                                                                                                                                                                                                                                    |
| `device_preset`           | operation | —         | 3 / 30                 | Load a factory preset (null for none); params replaces the explicit overlay.                                                                                                                                                                                                                                                                                                  |
| `device_bypass`           | operation | —         | 3 / 30                 | Bypass or engage a device.                                                                                                                                                                                                                                                                                                                                                    |
| `send_add`                | operation | structure | 3 / 30                 | Add a post-fader send from a strip to a return.                                                                                                                                                                                                                                                                                                                               |
| `send_remove`             | operation | structure | 3 / 30                 | Remove a send.                                                                                                                                                                                                                                                                                                                                                                |
| `send_set`                | operation | —         | 3 / 30                 | Set a send's level (null for direct).                                                                                                                                                                                                                                                                                                                                         |
| `lane_add`                | operation | structure | 3 / 30                 | Add an automation lane (one per parameter target).                                                                                                                                                                                                                                                                                                                            |
| `lane_remove`             | operation | structure | 3 / 30                 | Remove an automation lane.                                                                                                                                                                                                                                                                                                                                                    |
| `lane_set_breakpoints`    | operation | arrange   | 3 / 30                 | Replace a lane's breakpoints.                                                                                                                                                                                                                                                                                                                                                 |
| `lane_add_breakpoint`     | operation | arrange   | 3 / 30                 | Add one breakpoint to a lane.                                                                                                                                                                                                                                                                                                                                                 |
| `lane_remove_breakpoint`  | operation | arrange   | 3 / 30                 | Remove the breakpoint at a time.                                                                                                                                                                                                                                                                                                                                              |
| `modulator_add`           | operation | structure | 3 / 30                 | Add a modulator (lfo, random, macro or external-phase).                                                                                                                                                                                                                                                                                                                       |
| `modulator_remove`        | operation | structure | 3 / 30                 | Remove a modulator with its routes.                                                                                                                                                                                                                                                                                                                                           |
| `modulator_update`        | operation | —         | 3 / 30                 | Patch a modulator's fields.                                                                                                                                                                                                                                                                                                                                                   |
| `route_add`               | operation | structure | 3 / 30                 | Route a modulator to a parameter.                                                                                                                                                                                                                                                                                                                                             |
| `route_remove`            | operation | structure | 3 / 30                 | Remove a modulation route.                                                                                                                                                                                                                                                                                                                                                    |
| `route_update`            | operation | —         | 3 / 30                 | Change a route's depth and/or polarity.                                                                                                                                                                                                                                                                                                                                       |
| `transport_quantize`      | operation | arrange   | 3 / 30                 | Set the global launch quantisation of the session grid (U31).                                                                                                                                                                                                                                                                                                                 |
| `scene_add`               | operation | structure | 3 / 30                 | Add a session grid row.                                                                                                                                                                                                                                                                                                                                                       |
| `scene_remove`            | operation | structure | 3 / 30                 | Remove a scene and every slot in it.                                                                                                                                                                                                                                                                                                                                          |
| `scene_move`              | operation | structure | 3 / 30                 | Move a scene to another row index.                                                                                                                                                                                                                                                                                                                                            |
| `scene_rename`            | operation | structure | 3 / 30                 | Rename a scene.                                                                                                                                                                                                                                                                                                                                                               |
| `slot_add`                | operation | structure | 3 / 30                 | Put a slot in a free cell (audio track × scene).                                                                                                                                                                                                                                                                                                                              |
| `slot_remove`             | operation | structure | 3 / 30                 | Remove a slot from the grid.                                                                                                                                                                                                                                                                                                                                                  |
| `slot_update`             | operation | structure | 3 / 30                 | Patch a slot's cell, clip or launch settings.                                                                                                                                                                                                                                                                                                                                 |
| `batch`                   | operation | union     | 3 / 30                 | Apply several operations as one undoable step (needs every child's consent).                                                                                                                                                                                                                                                                                                  |
| `set_music_volume`        | intent    | —         | 5 / 30                 | Set the music level, 0.0 silent to 1.0 full. Call only when the listener says the music is too loud or too quiet.                                                                                                                                                                                                                                                             |
| `set_ambience`            | intent    | —         | 5 / 30                 | Set the ambience (nature bed) level, 0.0 off to 1.0 full.                                                                                                                                                                                                                                                                                                                     |
| `duck`                    | intent    | —         | 5 / 30                 | Softer under the voice: how deeply the music dips while the coach speaks, 0 (no dip) to 1 (silent under speech).                                                                                                                                                                                                                                                              |
| `steer_music`             | intent    | —         | 1 / 2                  | Change the music to a different track: calmer or stronger (more-intense) steps the intensity ladder, change keeps it, brighter/darker keep it and lean major/minor on the Camelot wheel. Replacement tracks are key-compatible and play in full, so the current part may grow — the result says by how much. Call only when the listener explicitly asks for different music. |
| `set_intensity`           | intent    | —         | 1 / 2                  | Move the music to a rung of the intensity ladder: 1 grounding, 2 settled, 3 active. Key-compatible full tracks replace the remainder of the current part.                                                                                                                                                                                                                     |
| `match_key`               | query     | —         | 10 / 60                | Rank candidate tracks by how well their Camelot key sits with an anchor key: exact or neighbouring keys first, then the smallest pitch shift (in semitones) that would make them compatible.                                                                                                                                                                                  |
| `extend_section`          | intent    | —         | 2 / 6                  | Give the current part more time. Call when the listener is deep in the work and needs longer. Max 300 seconds per call; the result reports the seconds actually added.                                                                                                                                                                                                        |
| `advance_section`         | intent    | —         | 1 / 3                  | Move to the next part early. Call when the listener is done with this part or the intensity is too much and they need integration now.                                                                                                                                                                                                                                        |
| `set_breath_pace`         | intent    | —         | 3 / 12                 | Slow down or speed up the guided breathing rhythm (and the on-screen breath). Takes effect immediately and never changes the music; prefer slower over pushing through.                                                                                                                                                                                                       |
| `fade_out`                | intent    | —         | 1 / 1                  | Fade the whole mix to silence over a few seconds and stop — the end of the session. Never a hard cut.                                                                                                                                                                                                                                                                         |
| `more_space`              | intent    | —         | 2 / 6                  | Make room for the voice: the music comes down 3 dB and dips a little deeper under speech.                                                                                                                                                                                                                                                                                     |
| `get_state`               | query     | —         | 10 / 120               | The current state of the mix for you to read: transport, section, what is playing, levels, meters, recent changes.                                                                                                                                                                                                                                                            |
| `undo`                    | control   | —         | 3 / 10                 | Revert one of your earlier calls (the latest applied one when no callId is given) by applying the inverse of every operation it made.                                                                                                                                                                                                                                         |

Operation tools take the operation's fields without `type`; their schemas
(`operationSchema(type)`) carry only the `$defs` they reference (`Clip`,
`Strip`, `Device`, `Track`, …) so each is self-contained for a provider.
Every schema compiles under Ajv 2020-12 strict mode; `validateSchema` is the
zero-dependency validator `call` uses at runtime (tests check it agrees with
Ajv). Levels in the intents are described as 0..1 but not bounded in the
schema: out-of-range values are clamped by the range rail and the clamp is
returned and logged (AE2), rather than refused before the model learns what
was applied.

## Intents: how each compiles

Hooks win when the consumer supplies them (it owns sections, pace and its own
dip logic); otherwise the intent compiles to score operations on the role,
or to an engine call. `R26 name` is the vocabulary in the requirements.

| Tool                                              | R26 name                   | Session hook (preferred)                                                                                             | Score / engine compilation                                                                                                                                                                                                                                                                                         | Rails                                                                   |
| ------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `set_music_volume { level }`                      | music volume               | `setMusicVolume(level)`                                                                                              | `strip.set { owner: roles.music, param: 'level' }`                                                                                                                                                                                                                                                                 | range, gain-slew, loudness, true-peak                                   |
| `set_ambience { level }`                          | —                          | `setAmbience(level)`                                                                                                 | `strip.set { owner: roles.ambience, param: 'level' }`                                                                                                                                                                                                                                                              | range, gain-slew, loudness, true-peak                                   |
| `duck { depth }`                                  | softer under voice         | `setDuckDepth(depth)`                                                                                                | `device.setParam { device: roles.ducker ?? the music's 'ducker' insert, param: 'depth' }`                                                                                                                                                                                                                          | range 0..1                                                              |
| `more_space {}`                                   | more space                 | the two above                                                                                                        | `strip.set` music level × 10^(−3/20) + `device.setParam` depth + 0.1, one call                                                                                                                                                                                                                                     | as above                                                                |
| `steer_music { direction }`                       | calmer / stronger / change | `steer(direction, target)`; else `library()` + `describe().nowPlaying` → ladder → `replaceUpcoming(picks, headroom)` | `batch [ source.add…, clip.trim + clip.update (the sounding clip fades over `STEER_CROSSFADE_SECONDS`), clip.replaceFrom { fromSec: now, clips } ]` on `roles.music`: full library tracks chained with `CROSSFADE_SECONDS` from the transport position to the arrangement's end, which moves by the boundary shift | headroom (truncates only the last clip), no-silence (no fit → rejected) |
| `set_intensity { level }`                         | —                          | as `steer_music` with `targetIntensity = level`                                                                      | as `steer_music`                                                                                                                                                                                                                                                                                                   | as `steer_music`                                                        |
| `match_key { anchor, candidates, maxSemitones? }` | —                          | —                                                                                                                    | pure: `rankByKeyMatch` (U32)                                                                                                                                                                                                                                                                                       | rate limit only                                                         |
| `extend_section { seconds }`                      | extend                     | `extendSection(granted)` → applied seconds                                                                           | — (hooks only)                                                                                                                                                                                                                                                                                                     | headroom: ≤ 300 s per call, ≤ session headroom; growth is tallied       |
| `advance_section {}`                              | advance                    | `advanceSection()` → section index                                                                                   | — (hooks only)                                                                                                                                                                                                                                                                                                     | rate limit                                                              |
| `set_breath_pace { direction }`                   | —                          | `setBreathPace(direction)` → multiplier                                                                              | — (hooks only)                                                                                                                                                                                                                                                                                                     | rate limit                                                              |
| `fade_out { seconds }`                            | —                          | `fadeOut(seconds)`                                                                                                   | `engine.stop({ fadeSec })` — master `setTargetAtTime(0, now, fadeSec / 3)`, transport stops                                                                                                                                                                                                                        | fade 2..30 s (no startle, no stall)                                     |
| `get_state {}`                                    | —                          | `describe()` feeds it                                                                                                | `snapshot()`                                                                                                                                                                                                                                                                                                       | rate limit                                                              |
| `undo { callId? }`                                | (R27 undoable)             | —                                                                                                                    | the reversed inverses of that call's operations, applied as new operations by the same author                                                                                                                                                                                                                      | only applied, not-yet-undone calls; `undo` never undoes an `undo`       |

### The ladder

`src/core/music/intensity.ts` is Breathwork Live's `musicResolver.ts`
resolver moved into the library: intensities 1 grounding / 2 settled / 3
active (the tuin canon); `calmer` steps down (floor 1), `stronger` and
`more-intense` step up (cap 3), `change` stays; candidates per pick are
target intensity + Camelot-compatible → any at the target → adjacent
intensities; each pick anchors the next one's key; excluded ids are never
re-picked. Camelot compatibility is `camelot.ts` (same number or ±1,
letter-agnostic, unparseable matches everything). `brighter` and `darker`
keep the intensity and rank the harmonic candidates: brighter prefers major
(B) and the clockwise neighbour (+1, a fifth up), darker minor (A) and −1
(`rankTonal`). AE1 holds: playing 8A at intensity 2, `calmer` yields
intensity 1 with a wheel number in {7, 8, 9} when the library has one, and
the result reports `boundaryShiftSec`.

## Safety rails (R27, KD10)

Rails run before anything reaches the document or the graph; a clamp is
returned in `result.rails` and logged, a refusal is a `rejected` result with
the reason. Defaults (`DEFAULT_RAILS`) are for a breathwork listener wearing
earphones; every field is overridable per consumer through
`new AgentController({ rails })`.

| Rail                             | Default             | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `levelRange`                     | `[0, 1]`            | Faders (`strip.set` level/inputGain, master level, the level intents) clamp into this range; the score itself allows 0..2. Pan clamps to −1..1; device parameters clamp to their descriptor range (`engine.devices`).                                                                                                                                                                                                                                                                                                                                                |
| `maxShortTermLufs`               | `−14`               | A gain increase on a path to the master is predicted as the master's short-term LUFS + the change in dB (whole-mix, conservative); over the ceiling it is clamped to land on it (`loudnessMode: 'clamp'`) or refused (`'reject'`). Reads `engine.master.lufs` when a LUFS meter is installed, or `loudnessReading()`.                                                                                                                                                                                                                                                |
| `maxTruePeakDb`                  | `−1`                | The same for true peak (dBTP). Decreases, silence and an unarmed meter never clamp.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `maxGainChangePerSec`            | `1`                 | A token bucket per parameter: at most this much linear gain per second (a full-scale move is fine, rapid oscillation is slewed). `Infinity` disables.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `protectVoice` / `minVoiceLevel` | `true` / `0.25`     | While `session.isSpeaking()` (assumed `true` without the hook): no `strip.mute` on the voice role, no voice level below `minVoiceLevel`, no `strip.solo` of another strip unless the voice is solo-safe, no removing the voice track.                                                                                                                                                                                                                                                                                                                                |
| `noSilence`                      | `true`              | No `strip.mute` or removal of the music or ambience roles — fade the level instead (level 0 through a ramp is allowed); a steer with no fitting replacement is refused, never applied empty.                                                                                                                                                                                                                                                                                                                                                                         |
| `rateLimits`                     | see the table above | Token bucket per tool; `rate_limited` results carry `retryAfterMs`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `maxExtendPerCallSec`            | `300`               | `extend_section` per call.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `maxSessionGrowthSec`            | `900`               | Total the agent may add (extensions and steer growth) when the session supplies no `headroomSec()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `minFadeSec` / `maxFadeSec`      | `2` / `30`          | `fade_out` bounds: below is a startle, above a stall.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `consent`                        | `[]`                | Structural operations (`track_*`, `element_track_add/remove/route`, `group_*`, `return_*`, `device_add/remove/move`, `send_add/remove`, `lane_add/remove`, `modulator_*`, `route_add/remove`, `strip_rename/route`, `score_rename`, `scene_*`, `slot_*`) need `'structure'`; arrangement edits (`clip_*`, `element_track_set_clips`, `source_*`, `transport_loop`, `transport_quantize`, `tempo_set`, breakpoints) need `'arrange'`; `batch` needs every child's. Parameter-level operations and all intents need none. `grantConsent` / `revokeConsent` at runtime. |
| `dryRun`                         | per call            | `call(name, args, { dryRun: true })` validates, runs the rails and compiles (`result.compiled`) without applying, calling hooks, or consuming rate-limit or slew budget; it is audited as `dry-run`.                                                                                                                                                                                                                                                                                                                                                                 |

Rails not in this unit (Dream tier in the plan): boundary quantisation of
edits to the next bar (U32's tempo map is there; the intents already swap at
crossfades), and two-step "agent proposes, listener confirms" operations.

**Arbitration (U30).** With `new AgentController({ document, arbiter })`
every planned operation goes through the `Arbiter`
([`docs/arbitration.md`](./arbitration.md)): a target the listener or a
controller holds defers the write — the call succeeds with
`{ rail: 'arbitration', action: 'deferred' }` and `result.deferred`, and the
operation lands later under the call's label — or, with `onHeld: { agent:
'drop' }`, fails the call with `rejected` naming the holder. `score_replace`
(a restored version) needs the `structure` consent like the other whole-
document edits.

## Results, audit and the operation log

`call` returns a JSON-serialisable `ToolResult`:

```ts
{ ok: true, callId, tool, result, operations: [{ seq, type }], rails: [RailNote], dryRun, compiled? }
{ ok: false, callId, tool, error: { code, message, retryAfterMs?, issues? }, rails, dryRun }
// code: unknown_tool | invalid_args | unavailable | consent_required | rate_limited | rejected | failed
```

Every call — applied, rejected or dry-run — is an `AuditEntry` in
`controller.audit` (`{ callId, atMs, author, tool, args, outcome, code?,
rails, operations, inverses, result?, summary, undoneBy? }`; the last 500 by
default). Score operations a call applied are also entries in the document's
`OperationLog` with the same author and the label
`agent:<tool>#<callId> <what>`, so the transcript and the score history
cross-reference. If a later step of a call fails, the operations already
applied are rolled back (their inverses are appended, labelled `rollback`),
and the call is reported `failed`.

## Snapshot (R28)

`snapshot()` is a compact document for the prompt (≤ 2 KB with a full
session and a busy log; ~0.5 KB bare):

```ts
{
  cursor,                      // audit cursor; pass to diffSince
  atSec,                       // audio clock
  transport: { state, positionSec, loop } | null,
  session?: { sectionIndex, section, intensity, remainingSec, sections: [{ name, intensity, durationSec }], paceMultiplier },
  music?: { nowPlaying: { id, title, key, intensity, remainingSec }, upcoming: [{ id, title, camelot, startsInSec }] /* ≤ 3 */ },
  levels: { master, voice?, music?, ambience?, breathGuide? },   // linear faders (mute → 0)
  meters?: { shortTermLufs, momentaryLufs, truePeakDb },          // when a LUFS meter is installed
  voice: { speaking },
  devices: [{ id, deviceId, owner, bypass }],                     // engaged devices, master and roles first, ≤ 12
  recent: [{ callId, tool, author, outcome, summary }],           // last 6 calls
}
```

`session` and `music` come from `session.describe()`; levels come from the
document (or the engine's strips without one), meters from
`engine.master.lufs` or the `meters` option. `diffSince(cursor)` returns
`{ from, to, calls, changed, full }`: the calls since the cursor and only the
snapshot fields whose value differs from the snapshot handed out at that
cursor (`full: true` with the whole snapshot for an unknown cursor).
`setCadence(ms)` emits snapshots to `onSnapshot` listeners on the engine's
timers (R28's settable cadence); `get_state` gives the model the same
document on demand.

## Consumer tools and authored scores

`tools: [...]` registers consumer `ToolSpec`s after the built-in catalogue. A
spec may declare its own `rateLimit`; it is enforced unless the controller's
`rails.rateLimits` table names the tool, in which case the table wins (and is
what `listTools()` reports). The library ships one such set:
`scriptTools()` — `author_script`, `preview_section`, `render_session` — for
planner-written sessions, documented in
[`docs/agent-authored-scores.md`](./agent-authored-scores.md).

## Consumer wiring notes

- Breathwork Live: the conductor supplies `setMusicVolume` (so its user-speech
  dip stays its own), `steer` (or `library` + `describe().nowPlaying` +
  `replaceUpcoming` to let the library run the ladder), `extendSection`,
  `advanceSection`, `setBreathPace`, `isSpeaking`, `headroomSec` and
  `describe`; `toolHandlers.ts` maps `set_music_volume` / `set_music` onto
  `agent.call` and translates the result to its snake_case payload, so the
  Realtime tool names and behaviour stay identical for the model.
- A score-driven consumer (U38's planner output, ambient-live later) gives a
  document, roles and a `library`; steering compiles to `clip.replaceFrom`.
- Install the master LUFS meter (`engine.master.installLufsMeter()`) to arm
  the loudness and true-peak rails; without it (or a `loudnessReading`) they
  pass everything through.
- Register consumer tools with `tools: [spec]`; a spec's `plan` may emit score
  operations (they go through the same apply/rollback path) and effects.
