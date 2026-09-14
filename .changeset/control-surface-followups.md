---
'@kieranklaassen/live-mix': minor
---

Control surface follow-ups from ambient-live's migration (#28): `persist()`
saves `surface.table` (the state after listeners), not the emission payload;
`beginLearn(target, { inferMode: true })` re-infers the mode from the new
source on a re-learn; `ambientLiveMidiMapMigration(targetFor, { outputFor })`
lets migrated mappings carry knob ranges; `MidiInput` follows `statechange`
as a listener (or chains an existing `onstatechange`, restored on `close()`);
`fromMidiAccess(access)` adapts the browser's `MIDIAccess` to `MidiAccessLike`
without a cast.

React kit (ambient-live #29): `Fader` accepts `axis` as an alias of
`orientation`; a `meter-border` token draws the meter bar's border;
`formatControlValue(value, unit, { digits, spacing: '' })` prints `20ms`.
