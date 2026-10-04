---
'@kieranklaassen/live-mix': patch
---

Pack sounds: a hundred sounds to paint with for each pack, its own presets played.

- `loadFactoryPackSounds()` fetches every pack's sounds as a chunk of their own, as `loadFactoryPacks()` does the presets. Each is a `FactorySound` with its patch written out and the `pack` it belongs to, so `renderFactorySound` and `transposeFactorySound` take it as they take a sound of the bank.
- `FactoryPack.sounds` says how many sounds a pack holds before any are fetched: `FACTORY_SOUND_PACK_SIZE` (100), or 0 for a pack whose sounds are not written yet.
- Pack sounds are numbered from a thousand times their pack's place (1001 to 1100 for the first), clear of the bank's own numbers. A host renders one when it is asked for, not when it starts.
