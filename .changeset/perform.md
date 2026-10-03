---
'@kieranklaassen/live-mix': patch
---

Performing a piece: scenes, dials and cues that ride on top of the mix and never write to it.

- `ChannelStrip.setRide(value, { layer, at, timeConstant })`: a gain after the fader and before the gate, at 1 until moved, made on first use. Layers are named and stack (`ride(layer)`, `rideLayers`, `rideNode(layer)`); sends and shadow pairs follow it; `onChange` reports `ride`. A strip nobody rides keeps the graph it had.
- A perform set (`PerformSet`, plain JSON a host keeps under `score.meta.perform`): scenes (which tracks are in and how far, dial values, a morph in bars, a follow rule), dials (one value moving several targets through ranges and curves, `ladderTargets` for one that brings tracks in one after another), cues (a sample played once). `normalisePerformSet` reads anything without throwing; `withScene`, `withoutDial` and the rest edit a set and keep it consistent.
- `Performer`: plays a set on an engine. `go(scene)` lands on the next bar and morphs, `ride(track, value)` moves one sound, `dial(id, value)` moves at once, `cue(id)` plays on the next beat, `capture` keeps the moment as a scene, `reset` gives the piece back as composed. Follow rules are drawn from the seed, so a set can play itself the same way twice. Events `scene`, `queue`, `ride`, `dial`, `cue`, `bar` and `beat` carry audio-clock times, for a game or a page that follows the music.

Covered against the mock graph; not yet heard in a browser. See `docs/perform.md`.
