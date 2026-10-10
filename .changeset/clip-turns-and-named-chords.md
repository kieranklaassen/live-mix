---
'@kieranklaassen/live-mix': minor
---

A clip can take turns, and a variant can be put on a chord by name.

`Clip.turns` (`{ sourceIds, every? }`) is the source a clip plays on each counted pass: `sourceIds[floor(pass / every) % n]`, a function of the pass alone, so a bounce and a device play the same turn and `setPass` lands on the right one. `AudioTrack` reads it when a start is handed over or a clip is entered partway, on the track's own passes where it has a loop of its own; `SampleRetainer` holds the source a start plays; the score validates the turns' sources (64 at most, `MAX_CLIP_TURNS`), `source.remove` refuses one a clip's turns still name, `clip.update` takes `turns: null`, and the renderer passes a change of turns to the track. `clipSourceOnPass`, `clipSourceIds`, `turnOnPass`, `turnLength` and `sameTurns` are exported. A clip without `turns` plays as it did.

`varySound` and `renderFactorySound` take `chord` in a variation: steps along the white keys from where the sound is written, −3 to 3, in place of the chord the seed would draw, at any amount. `chordMoves(sound)` lists the steps a sound can take and `soundDegree(sound)` the white key it is written on. Every variant made without `chord` is note for note what it was.
