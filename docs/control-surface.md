# MIDI and OSC learn (U36, R15)

`src/core/control` turns controllers into engine changes. The pure half — a
mapping table, resolution, learn, serialisation — has no engine dependency and
is what ambient-live's U27 `midi-map` layer becomes; the stateful half
(`ControlSurface`) applies changes through the engine's ramped setters and
respects automation. Input adapters over Web MIDI and OSC-over-WebSocket are
optional to instantiate and read no browser global at import time.

## Flow

```
MIDIInput.onmidimessage ─ MidiDecoder ─┐
                                       ├─ ControlEvent ─ ControlSurface.handle
WebSocket frame ─ decodeOscPacket ─────┘        │
                                                ├─ learn armed?  → bind target to event.source, consume
                                                ├─ mapped?       → resolveControlEvent → ControlChange[]
                                                │                    → binding.write (ramped) / fire
                                                │                    → LaneWriter.override on first write
                                                └─ otherwise     → not consumed (notes go to the synth)
```

## Model

**`ControlTarget`** — plain data, keyed by `controlTargetKey`:

| Kind        | Shape                                    | Bound to                                                    |
| ----------- | ---------------------------------------- | ----------------------------------------------------------- |
| `strip`     | `{ track, control }`                     | `ChannelStrip.setLevel/setInputGain/setPan/setMute/setSolo` |
| `send`      | `{ track, send }`                        | the send's gain node (sends created with a `level`)         |
| `master`    | `{ control: 'level' }`                   | `engine.master.setLevel`                                    |
| `device`    | `{ device, param }`                      | `Device.setParam` on the instance registered under `device` |
| `macro`     | `{ macro }`                              | `Macro.set` on the macro registered under `macro`           |
| `transport` | `{ action: start\|stop\|pause\|toggle }` | `Transport`                                                 |

Levels span `0..levelMax` (default 1.5, unity = 1; `ControlSurfaceOptions.levelMax`),
pan −1..1, on/off targets are 0/1, device parameters go through their
`ParamSpec` taper (`normalizeParam` / `denormalizeParam`, shared with
`useDeviceParam`). Strips resolve through the engine by track name (audio,
live input, instrument, return, group — the same order as `useTrack`);
devices and macros through `surface.registerDevice(id, device)` /
`registerMacro(name, macro)`; anything can be overridden with
`ControlSurfaceOptions.resolve`.

**`ControlSource`** — `note`, `cc`, `cc14` (MSB 0–31 + LSB 32–63),
`pitchbend`, `aftertouch` with a channel (1–16; `0` = omni), or
`{ kind: 'osc', address, arg }` where `address` may be an OSC 1.0 pattern
(`?`, `*`, `[a-c]`, `[!x]`, `{a,b}`; none cross `/`).

**`ControlEvent`** — what decoders emit and the table consumes:
`{ kind: 'absolute', value, raw? }` (MIDI normalised to 0..1 with the wire
value in `raw`; OSC arguments unscaled) or `{ kind: 'trigger', on, value }`
(notes, OSC `T`/`F`/`I`, argument-less messages).

**`Mapping`** — one entry per target, a source may drive several targets:

| Field      | Meaning                                                                                       | Default           |
| ---------- | --------------------------------------------------------------------------------------------- | ----------------- |
| `mode`     | `set` (position → value) · `toggle` (press / rise past midpoint flips) · `relative` (encoder) | `set`             |
| `input`    | raw controller range mapped onto 0..1 (OSC ints, e.g. `{ min: 0, max: 127 }`)                 | `{ 0, 1 }`        |
| `output`   | span of the target's normalised range the controller covers; `min > max` inverts              | `{ 0, 1 }`        |
| `curve`    | `linear` · `exp` (u²) · `log` (√u) · `s` (smoothstep)                                         | `linear`          |
| `pickup`   | soft takeover                                                                                 | `false`           |
| `encoding` | relative: `twos-complement` · `binary-offset` · `sign-magnitude`                              | `twos-complement` |
| `step`     | relative: normalised change per encoder step                                                  | `1/127`           |

Semantics (U27's carried over, generalised):

- `set` from a position writes the shaped value; from a press writes the
  velocity (a pad "sets a value and leaves it"); a release does nothing.
- `toggle` flips on a press; from an absolute source, on each rise past 0.5.
  On/off targets flip; a continuous target jumps between the ends of its
  output span.
- `relative` decodes the CC byte with `encoding` (OSC sends a signed step
  count) and nudges by `steps × step`, clamped to the output span.
- Transport targets fire on a press or a rise past 0.5 in any mode.
- **Pickup** compares in output space (so ranges and curves do not defeat it):
  the controller engages when it lands within one 7-bit step of the target or
  crosses it since its previous event, then owns the target until something
  else moves the target away.
- A mapped source is _consumed_ even when an event produces no change (a
  release, a blocked pickup), so a mapped pad never plays the synth.

**Learn** — `beginLearn(target, { mode? })`; the next position or press binds
(`learnFromEvent`), a release keeps waiting. The mode is inferred: press on an
on/off target → `toggle`, otherwise `set`; a previous mapping's options
(curve, pickup, ranges, a `relative` mode) survive a re-learn. A 14-bit knob
announces its MSB first, so learn binds `cc`; when the very next event is the
matching `cc14`, the binding upgrades (`upgradeLearnedSource`).

## Automation

Attach the `LaneWriter` that drives a target: `surface.attachWriter(target,
writer)`. The first controller write calls `writer.override(now)`
(cancel-and-hold, R29) before the ramped setter; the lane stays off until
`surface.release(target)` / `releaseAll()`, when the next automation tick
ramps back onto it (`LaneWriter.joinRampSec`). The override is remembered,
never timed out.

## Persistence

`serializeMappingTable(table)` → `{ format: 2, mappings: [...] }`.
`parseMappingTable(input, { migrations })` never throws: bad JSON, a foreign
format nobody migrates, or a non-object yield `[]`; malformed entries are
dropped one by one; unknown options fall back to defaults; a later entry for
a target wins. Migrations are `{ from, to?, migrate(payload) }` applied in
ascending order until the current format (bounded, so a stuck migration cannot
loop). `loadMappingTable` / `saveMappingTable` take any `StorageLike`
(`localStorage`, a `Map` wrapper, IndexedDB behind a sync cache) and swallow
storage errors; the key is removed when the table is empty.
`surface.persist(storage, { key, migrations })` loads now and saves on every
edit until the returned function is called. For the score document (U28),
embed `surface.toJSON()` and restore with `surface.load(json)`.

## Input adapters

`MidiInput({ requestAccess?, ports?, sysex?, decoder? })` — `open()` calls
`navigator.requestMIDIAccess` (or the injected request), attaches to every
input (or the ids/names listed), follows hot-plugging via `onstatechange`,
decodes per port (running status, 14-bit pairs within `pairWindowMs` of the
port timestamps) and publishes `ControlEvent`s (`subscribe`) and raw
`MidiMessage`s (`onMessage`, for routing unmapped notes to an instrument).
`feed(bytes)` injects. `MidiInput.isSupported()` is false under SSR.

`OscInput({ url } | { transport })` — over a WebSocket bridge (browsers have
no UDP: TouchOSC Bridge, an `osc-js` relay, a ten-line Node script) delivering
binary frames, or any `{ subscribe }` transport. Decodes messages and bundles
(nested, flattened; time tags are not scheduled), all OSC 1.0 argument types,
and publishes one event per numeric/boolean argument. Malformed packets are
dropped, counted (`dropped`) and reported (`onError`). `encodeOscMessage` /
`encodeOscBundle` exist for tests and, later, feedback to controllers.

Both are `ControlInput`s: `surface.connect(input)` routes their events into
`handle`; the disconnect function or `surface.dispose()` detaches.

## React (`./react`)

- `useControlSurface(surface, { events })` → `{ mappings, learning,
lastEvent, beginLearn, cancelLearn, map, unmap, unmapSource, update,
replace, clear, mappingFor, set, release, releaseAll, serialize, load }`.
  Re-renders on table and learn changes only, unless `events: true`.
- `useLearn(surface, target)` → `{ armed, busy, mapping, label, begin,
cancel, toggle, unmap }` — one panel row: `label` is `describeSource` of
  the binding (`CC 74 · ch 1`), `toggle` is the Learn/Cancel button.

Both render on the server from the table.

## Migration path for ambient-live (U27 → library)

ambient-live's `app/frontend/audio/midi.ts`, `midi-map.ts` and the storage
half of `control-targets.ts` are covered; the parity test
(`src/core/control/__tests__/ambient-live-parity.test.ts`) runs U27's own
scenarios against the library.

1. **Targets.** Replace the `ControlTargetId` strings with `ControlTarget`s
   — the reverb params become `{ kind: 'device', device: 'reverb', param }`
   once the plate is registered (`surface.registerDevice('reverb', plate)`),
   `master.gain` → `{ kind: 'master', control: 'level' }`,
   `{synth,clips,input}.{level,pan}` → `{ kind: 'strip', track, control }`,
   `input.monitor` → `{ kind: 'strip', track: 'input', control: 'mute' }`
   with `output: { min: 1, max: 0 }` if the label stays "Monitor"
   (monitor on = mute off). `STRIP_LEVEL_MAX` (1.5) is the surface's default
   `levelMax`. Keep `CONTROL_TARGETS` only for labels and knob ranges if the
   knobs still want them; the mapping layer no longer needs it.
2. **Stored tables.** Users have `{ format: 1, mappings }` under
   `ambient-live:midi-map`. Build the surface with
   `migrations: [ambientLiveMidiMapMigration(targetFor)]` where `targetFor`
   is the id → target function from step 1, and
   `surface.persist(localStorage, { key: 'ambient-live:midi-map' })`. The
   first edit rewrites the key as format 2; nothing is lost, U27 semantics
   (CC sets, note on a toggle toggles, note on a knob sets from velocity)
   carry over per entry. Two U27 entries for the same target collapse to the
   later one (the library keeps one source per target, as U27 did on
   rebind).
3. **Dispatch.** `LiveEngine.applyControl(id, value)` goes away: the surface
   writes through `strip.setLevel/setPan`, `master.setLevel`,
   `plate.setParam` and `strip.setMute` itself, all ramped as before. The
   page's `controls` record can follow `surface.onChange` (`applied`
   changes) or the existing device/strip change events.
4. **Notes to the synth.** `MidiInput.onMessage` gives every message;
   `surface.handle(event).consumed` (or `isMapped(surface.table, event)`)
   says whether a note is taken by the map. A note already sounding still
   releases on note-off as today — that is the app's note tracking, not the
   map's.
5. **UI.** `use-midi-map.ts` and the map panel become `useControlSurface`
   and `useLearn` rows; `describeSource` gives the same labels
   (`CC 74 · ch 1`, `Note 36 · ch 10`).
6. **Delete** `midi-map.ts`, `midi-map.test.ts`, `parseMidiEvent` (use
   `parseMidiMessage`; `velocityToGain` stays app-side) and the `StorageLike`
   copy.

What ambient-live gains without further work: 14-bit CCs, pitch bend and
aftertouch as sources, relative encoders, soft takeover, curves and ranges,
OSC (TouchOSC on a phone through a bridge), transport buttons, and the lane
override when it adopts automation lanes.

## Not in this unit

- MIDI **feedback** to controllers (LED rings, motor faders) — the OSC
  encoder exists; a `MidiOutput` and per-mapping feedback are a follow-up.
- OSC bundle **time tags** are not scheduled; bundles are flattened.
- A `momentary` mode (on while held) — `toggle` with a `set` on an on/off
  target covers most cases; add if a consumer asks.
- Program change and polyphonic aftertouch are parsed (`program`) or skipped
  and yield no control events.
