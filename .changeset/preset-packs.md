---
'@kieranklaassen/live-mix': patch
---

Preset packs: a hundred presets each, across every instrument, that share one idea of sound.

- `FACTORY_PACKS` (`FactoryPack`: `id`, `name`, `description`, `count`), `FACTORY_PACK_SIZE` and `factoryPack(id)` come with the bank: a few lines of names a host can list before anything is fetched.
- `loadFactoryPacks()` gives every pack's presets, each an ordinary `FactoryPreset` with the new optional `pack` field. They are a module of their own behind a dynamic `import()`, so a bundler keeps them out of the script a page starts with; the fetch happens once and is tried again after a failure.
- Every pack has at least two presets for each of the thirty-four instruments and gives the rest to the instruments its idea turns on. Ids start with the pack's id, so they never meet the bank's.
- Packs are held to tighter levels than the bank (peak at or below −8 dBFS, loudest 400 ms between −30 and −22 dBFS), so a list of thousands plays at one loudness, and no two presets across the bank and the packs share a name or the same settings. `FACTORY_REPORT=packs FACTORY_PACK=<id>` measures one pack.

A pack takes after a way of making music and never says whose: no artist, record, label or maker is named. Nothing here has been listened to; every preset was written by hand and held to what can be measured. See the Packs section of `docs/factory.md`.
