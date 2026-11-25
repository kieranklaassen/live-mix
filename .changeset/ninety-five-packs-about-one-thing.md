---
'@kieranklaassen/live-mix': minor
---

Ninety-five packs about one thing in music, a hundred presets each: 9,500
presets beside the 2,500 of the packs there were, none of which changed.

- `FactoryPack.shelf` says which shelf a pack stands on: `scenes` (the packs
  there were), `harmony`, `melody`, `time` and `hands`. The type is
  `FactoryPackShelf`. A pack of the four new shelves has its presets on the
  few instruments its subject is for, and has no sounds and no chains.
- `FactoryPreset.preview` may be a phrase written out (`Phrase`) as well as
  the name of one of the library's. `previewPhrase` takes both.
- Eight of the packs are of the note makers: every one of their presets carries
  a `maker`, and many a part with an instrument of its own.
- `loadFactoryPacks()` fetches the presets a shelf at a time, each a module of
  its own, and hands back one list as before.

Levels and the distance between presets were measured. Nobody has listened to
any of it.
