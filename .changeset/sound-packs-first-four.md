---
'@kieranklaassen/live-mix': minor
---

The first four packs have their hundred sounds (`./dsp`): Soft Pedal (2001 to 2100), Museum Window Garden (9001 to 9100), Old Broadcast Hall (17001 to 17100) and Ashram Harp and Organ (20001 to 20100), each its pack's own presets played as drones, pads, textures, one-shots and phrases. `FACTORY_PACKS` says `sounds: 100` for these four and `loadFactoryPackSounds()` gives the 400; the other packs still say 0. Nothing a host already has changes: the bank's hundred keep their numbers, and a pack sound is rendered when someone asks for it.
