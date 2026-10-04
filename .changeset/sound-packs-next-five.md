---
'@kieranklaassen/live-mix': minor
---

Five more packs have their hundred sounds (`./dsp`): Cornish Lucid Dreams (6001 to 6100), Coast Fog Four-Track (8001 to 8100), Pulse under the Forest (14001 to 14100), Far North Bowed Guitar (15001 to 15100) and Neon Rain, 2019 (22001 to 22100), each its pack's own presets played as drones, pads, textures, one-shots and phrases. `FACTORY_PACKS` says `sounds: 100` for nineteen packs now and `loadFactoryPackSounds()` gives 1,900. Nothing a host already has changes: every sound shipped before keeps its number, id, length and loop.

`varySound`: a phrase played round whose first note is written just clear of the start (0.03 to 0.06 s in) keeps that note where it is at double time, as one written nearer the start already did. It no longer comes ahead of where the sound's attack may be.
