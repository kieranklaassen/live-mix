# Agent-authored scores (U38)

The planner writes the whole session; the library turns it into a score; the
same score plays live or bounces to a file. This is the unit that makes the
pre-rendered breathwork pipeline in `kieranklaassen/tuin` and Breathwork Live
two renderers of one document (plan R22, R25, KTD16) — as a proposal. Nothing
in tuin changes; the skill there keeps working exactly as it does today.

```ts
import {
  AgentController,
  ScoreDocument,
  compileScript,
  createEngine,
  loadScore,
  parseSessionScript,
  renderScriptToWav,
  scriptTools,
} from '@kieranklaassen/live-mix'

// 1. A planner LLM fills SESSION_SCRIPT_SCHEMA (this library never calls a model).
const script = parseSessionScript(jsonFromTheModel) // schema + semantics + canon

// 2. Compile: music selection (tuin's selector), placement, cues, ducking, breath guide.
const score = compileScript(script, library, { seed: 7, voice })

// 3a. Live: the existing path.
loadScore(engine, score)
engine.transport.start()

// 3b. Offline: the tuin outcome, minus MP3 encoding.
const { wav } = await renderScriptToWav(script, library, { compile: { seed: 7, voice } })

// Or through the agent, with rails and consent:
const agent = new AgentController({
  engine,
  document,
  library,
  tools: scriptTools({ compile: { voice } }),
})
agent.grantConsent('structure')
agent.call('author_script', { script: jsonFromTheModel })
```

## The session script

`SessionScript` (`format: 1`) is the tuin three-part script as typed JSON:

```
SessionScript
  format: 1, id?, title, theme, timeOfDay?, intention?, listener?, language?
  sections: [grounding, active, integration]       // exactly three, in this order
    role, name, durationSec (target), intensity 1..3
    breathing: { inhaleSec, exhaleSec, holdInSec?, holdOutSec?, route: nose|mouth,
                 style: belly|three-part|connected|slow }
    cues: [{ atSec (from the part's start), text (with <2s> pause tags),
             kind?: cue|checkin|transition-ack|sound-release|hold-entry|hold-release|closing,
             intensity?, phase?, breathing? (takes over from here to the part's end) }]
    holds?: [{ atSec, durationSec 10..120, kind: inhale|exhale }]
```

The prompt contract is the JSON Schema `SESSION_SCRIPT_SCHEMA` (every field
carries a description written for a model) plus the canon as prose,
`SESSION_SCRIPT_CANON`; `sessionScriptPromptContract()` renders both as one
block for a system prompt. The `author_script` tool's parameters embed the same
schema, so a tool-calling model gets the contract from the tool list.

Validation is in three layers:

1. **Schema** — `validateSchema(SESSION_SCRIPT_SCHEMA, input)`; also checked
   under Ajv 2020-12 strict mode in the tests.
2. **Semantics** the schema cannot express — `validateSessionScript`: cues
   inside their part and in time order, holds inside the part and not
   overlapping, only pause tags (`<2s>`, `<1.5s>`) in the text.
3. **Canon** — `checkScriptCanon`, from `.claude/skills/breathwork/SKILL.md`
   and Breathwork Live's validator-as-law: three parts in order; grounding
   expects intensity 1, active always 3, integration 1; integration has exactly
   two holds (one inhale, one exhale); the last integration cue is the
   `closing` (three deep breaths, "Welcome back"); active has one
   `sound-release` at 45–90 % of the part; cues 20–90 s apart, the first within
   the first minute; never "journey"; say "part", not "section"; no cue starts
   inside a hold unless it is a `hold-release`. `parseSessionScript(input,
{ canon: 'error' | 'warn' | 'off' })` decides what a canon break does;
   `author_script` rejects on canon by default (`canon: 'warn'` to let it ride
   along in the result).

## Compilation: `compileScript(script, library, options) → Score`

Pure and deterministic: the same script, library and options serialise to the
same score (`compileScriptDetailed` returns the timeline, the selection and
warnings as well). Steps:

1. **Music selection** — `selectTracksForScript`: tuin's
   `select_songs_for_session` ported behaviour for behaviour
   (`src/agent/authoring/selector.ts`). Each part is filled greedily until its
   summed track lengths reach its target: grounding targets intensity 1 for
   the first half of the expected picks (at least one) then 2, active always
   3, integration 2 right after a 3 then 1; fallback to the neighbouring
   intensities (`[1, 2]` / `[2, 3]` for active); Camelot filter (same number or
   ±1, letter-agnostic, `Unknown` skips it) applied only when it leaves a
   candidate; the last pick of a part anchors the next part; no repeats. tuin
   fills every part to `total // 3`; the script version fills each part to its
   own `durationSec` (identical when the parts are equal thirds — asserted).
   `random.choice` is `pythonChooser(seed)`: CPython's MT19937 and
   `_randbelow`, so a seed picks what Python picks. Any `chooser` can replace
   it (a tonal ranking, a stub).
2. **Placement** — one continuous chain of full tracks on the `music` track,
   consecutive clips overlapping by `CROSSFADE_SECONDS` with equal-power fades
   (tuin cuts hard; Breathwork Live's crossfade is used). A part starts where
   its first clip starts and ends where its last clip ends; the session fades
   in over 2 s and out over 4 s. Music sits at −6 dB (`SCRIPT_MUSIC_DB`,
   tuin's `music_volume_reduction_db`). With `fit: 'script'` a part instead
   lasts exactly its `durationSec`: music trimmed with pydub's 3 s fade-out and
   2 s fade-in at the boundary (`generate_background_music_aligned`).
3. **Cues** — `voice` track, one clip per cue at `partStart + 7 s buffer +
atSec` (tuin `buffer_seconds`), never closer than 2 s after the previous cue
   ends (a shifted cue is a `cue-shifted` warning; one running past its part is
   `cue-overflow` and extends the render). Assets come from the
   `VoiceProvider`: `{ url, durationSec, id? }` per cue, keyed `s1-c3`. TTS is
   out of scope — `synthesizeVoice(script, adapter)` runs any async TTS with
   bounded concurrency and resumable `existing` assets, then hands back a
   static provider; `estimatedVoiceProvider()` needs no audio (words at 130 wpm
   plus pause tags plus a 0.6 s tail) and is the fake in the tests and the
   preview before credits are spent.
4. **Ducking** — a lane on the music fader (`music-duck`): around every cue
   the level falls from the base to base −6 dB over 80 ms, holds through the
   cue plus 250 ms, and returns over 800 ms (`ENV_ATTACK_MS`/`ENV_RELEASE_MS`,
   the Breathwork Live ducker's constants). Cues closer than a release share
   one dip. Being a lane, it renders identically live and offline and a UI can
   draw it (`duckBreakpoints`). Consumers with a live coach keep their
   sidechain ducker for the live voice; this lane covers the scripted one.
5. **Ambience** (optional) — an `ambience` audio track with one looped clip of
   the given source under the whole session, −18 dB, 4 s in / 6 s out.
6. **Breath guide** — a `breath-guide` track whose `inputGain` lane
   (`breath-guide-envelope`) carries the breathing pattern as a 0..1 envelope:
   rise over the inhale, flat through a hold-in, fall over the exhale, flat
   through a hold-out, restarting at each part and at each cue that carries a
   `breathing` override (the gradual belly → mouth → three-part build), and
   silent through the integration holds. With a `source` (a noise or pad loop)
   it is audible at −12 dB; without one the lane still exists for a consumer's
   own synth (Breathwork Live's `breathGuide.ts`) or its breath indicator
   (KD9: visual = audio, `breathBreakpoints`). `curve: 'smooth'` writes
   half-cosine swells (16 sub-ramps per segment) instead of linear ones.

Everything lands on four tracks with fixed ids (`SCRIPT_TRACK_IDS`,
overridable) routed to the master; no devices, so the score validates against
any registry and renders on the mocks. Consumers add a limiter, a hall return
or a worklet ducker through ordinary operations afterwards.

`operationsToLoad(current, compiled)` gives the operations that put a compiled
score into a live document: tracks and lanes with the same ids or parameter
targets are removed first, sources added when absent, then the tracks, lanes
and name — one `batch`, one undo step, everything else in the document left
alone. `author_script` applies exactly this through the controller.

## Two renderers, one score

- **Live** — `loadScore(engine, score)` (or a `ScoreDocument` the agent edits).
- **Offline** — `renderScore(score, { durationSec })` → `RenderResult`, or
  `renderScriptToWav(script, library, { compile, render })` which compiles,
  bounces the master and encodes WAV (`encodeWav`, 16/24-bit PCM or float).

The golden `src/agent/authoring/__tests__/render.golden.test.ts` loads a
compiled script on a live engine (real clock, timer-driven scheduler and lane
writers) and bounces the same score through `renderScore`, and asserts the
two graphs received identical source starts/stops and AudioParam events —
the U33 render-equals-live guarantee applied to a whole authored session. The
same file checks the timing the mocks recorded against the compiled timeline:
every music clip starts a crossfade before the previous ends, the fader ramps
to the ducked level at every cue's start and back after it ends.

### Getting an MP3

The browser has no MP3 encoder and the library has zero dependencies, so the
"one MP3" of the tuin pipeline is one step away from the WAV:

- **MediaRecorder** — play the score through the engine into a
  `MediaStreamAudioDestinationNode` and record with `createRecorder(engine,
{ mimeType: 'audio/webm;codecs=opus' })` (`Recorder.ts`); real-time, Opus or
  AAC depending on the browser, no MP3 in most.
- **External encoder in the page** — hand the `PlanarAudio` / WAV to a WASM
  encoder the host ships (`lamejs`, `@breezystack/lamejs`, an ffmpeg.wasm
  build); offline-speed, MP3.
- **Server** — POST the WAV to the host and run `ffmpeg -i session.wav -b:a
320k session.mp3` (what tuin's `replicate_synthesizer.py` does for its voice
  clips with pydub); this is the path the proposal below assumes.

## Agent tools (on top of U29)

Register with `new AgentController({ tools: scriptTools(options) })` or keep the
`ScriptAuthoring` instance (`createScriptAuthoring(options).tools()`) to read
its `compiled` timeline and render `jobs`.

| Tool              | Category  | Consent     | Rate limit          | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | --------- | ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `author_script`   | operation | `structure` | 1 burst / 2 per min | `{ script, seed? }`. Schema errors are `invalid_args`; semantic and canon breaks are `rejected` with every issue and its rule in the message (the corrective feedback a planner loop needs). Compiles with the controller's `library()` and the tool options, loads through `operationsToLoad` as one batch (undoable with `undo`), records the audit entry `author "<title>" (<seconds> s)`. Result: title, theme, seed, duration, per-part start/end/tracks/cue counts, compiler warnings, canon notes. Available with a document and a non-empty library. |
| `preview_section` | query     | —           | 3 / 12              | `{ part: 1..3, seek? }`. The part's start/end, targets, its tracks (title, key, intensity, length), every cue (key, time, kind, text) and hold. `seek: true` moves a **stopped** transport to the part's start; refused while playing. Rejected until a script was authored.                                                                                                                                                                                                                                                                                 |
| `render_session`  | intent    | —           | 1 / 2               | `{ sampleRate?, durationSec? }`. Starts an offline bounce of the document's current score (default length: the authored session, else the score's extent) as a `RenderJob`; the result is `{ jobId, status: 'rendering', durationSec, sampleRate, format: 'wav' }`. The host receives the WAV through `onRender` / `job.done`; a second job while one runs is refused.                                                                                                                                                                                       |

Rails that apply beyond the controller's usual ones: `author_script` refuses
to replace the track that carries the `voice` role while the session reports
speaking (the voice rail), so a live coach is never cut off by a load; dry runs
compile and report without applying or starting anything. Rate limits declared
by a consumer tool are now enforced (`Rails.takeCall(name, atMs, declared)`),
with the controller's `rails.rateLimits` table taking precedence — before this
unit, custom tools were listed with their own limit but throttled at the
default.

## How tuin could switch to posting a script (proposal, no tuin changes)

Today's tuin flow (`.claude/skills/breathwork/workflows/generate.md`):

1. Claude reads context and runs `select_music.py --save music_selection.json`
   (Python selector, 238-track library) to learn exact part durations.
2. Claude writes `instructions.md` in the parser's markdown (`# Section N`,
   `**Duration**: NNN seconds`, `## M:SS | intensity: N`, `<2s>` tags).
3. `compose_session.py` parses it, synthesises each cue on Replicate
   (`qwen/qwen3-tts`), and `audio_composer.py` concatenates the tracks per
   part, overlays each voice file at `partStart + 7 s + (t − firstT)`,
   music −6 dB, exports `session.mp3` to iCloud.

The same session as a script:

1. Claude emits a `SessionScript` JSON instead of the markdown — the same
   three parts, cue times now relative to the part (the compiler adds the
   buffer), with the canon it already follows stated as schema and rules
   (`sessionScriptPromptContract()`). Music no longer needs to be selected
   first: the parts' `durationSec` are targets and the compiler fills them
   with the same selector (same picks for the same seed, proven by the
   parity goldens), so step 1 collapses into step 2. A `seed` re-rolls the
   music without rewriting a word.
2. A thin service (Breathwork Live already has the library as `tracks` and
   the planner as `SessionPlanner`; a `POST /sessions/author` accepting the
   script is the natural home) runs the TTS adapter (`synthesizeVoice` around
   the existing Replicate call), `compileScript`, and either:
   - plays it live — `loadScore` on the Breathwork Live engine, the coach
     tools (U29) steering on top of the authored arrangement, or
   - bounces it — `renderScriptToWav` in a headless Chromium
     (`OfflineAudioContext`) or the browser, ffmpeg to MP3, copied to iCloud
     as `LG - {Theme} {Duration} {TimeOfDay} {Date}.mp3` exactly as now.
3. tuin's skill keeps its workflows; the only change on its side would be the
   final step posting JSON instead of running `compose_session.py` — and that
   change is Kieran's call, separately (KTD16: replacing the tuin pipeline
   stays Dream tier).

What is preserved: the selector's picks, the 7 s buffer and 2 s gap, −6 dB
music, the three-part canon, the cue grid. What changes: crossfades instead
of hard cuts, a real ducking dip under every cue, a breath-guide layer, one
document that can also be played live and steered.

## Parity status

| Piece                                         | Status                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `music_selector.py` → `selector.ts`           | **Exact.** 90 goldens (3 fixture libraries × 6 seeds × 5 durations) recorded by `scripts/selector-parity-goldens.py` from the read-only tuin checkout; `selectTracksForSession(total, library, { seed })` reproduces every pick, order and summed duration. `PythonRandom` reproduces CPython's `getrandbits`, `random()` and `choice`. |
| `select_songs_for_session` thirds             | Exact when the script's parts are equal; per-part targets otherwise (documented deviation).                                                                                                                                                                                                                                             |
| Cue placement (`insert_instructions_aligned`) | Same rule (part start + 7 s + relative time, ≥ 2 s after the previous cue); cue times are relative to the part in the script rather than to the first cue's absolute time.                                                                                                                                                              |
| Music level                                   | −6 dB as tuin; plus a −6 dB dip under cues tuin does not have.                                                                                                                                                                                                                                                                          |
| Track joins                                   | Crossfade (`CROSSFADE_SECONDS`, equal power) instead of tuin's hard cuts; `fit: 'script'` reproduces pydub's 3 s / 2 s boundary fades.                                                                                                                                                                                                  |
| Voice synthesis                               | Out of scope: `VoiceProvider` contract, `synthesizeVoice` adapter runner, estimated fake.                                                                                                                                                                                                                                               |
| MP3                                           | Not in the library (see above); WAV is.                                                                                                                                                                                                                                                                                                 |
| Render equals live                            | Asserted at the graph-command level on the mocks for a compiled session (`render.golden.test.ts`); the real-audio browser golden (U33, `browser-tests/`) covers the engine the same score runs on.                                                                                                                                      |

## Dream tier (not built)

- **Replacing the tuin pipeline** — the proposal above, on Kieran's decision.
- **A `SessionPlanner` in the library** — the LLM call, prompt assembly from
  tuin context, retries with corrective feedback: this stays in the consumer
  (Breathwork Live's planner, tuin's agent); the library only owns the contract
  and the validation that produces the feedback.
- **MP3 encoding** — an optional-peer encoder behind `renderScriptToWav`.
- **Live steering of an authored score** — U29's `steer_music`,
  `extend_section` and `advance_section` work on the `music` track the
  compiler wrote (the roles are the compiler's ids), but section-aware hooks
  over the compiled timeline (extend a part by re-selecting, advance to the
  next part's first clip) are a follow-up.
- **Per-cue TTS voice settings** (rate, emphasis) in the script, and a
  `breathing` pace multiplier synchronised with `set_breath_pace`.
- **Energy-curve-aware placement** — placing cues off vocal windows and drops
  using the analysis Breathwork Live already stores (`music_events`, lyrics);
  the compiler has the hook (`AgentTrack.energy`) but ignores it.
