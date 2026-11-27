---
'@kieranklaassen/live-mix': minor
---

Twenty-five instruments, with five hundred presets each:

- Walking Voices, Unsung Voice, Returning Wave, Climbing Gong, Bronze Vowels,
  Turned Time, Night Drum, Undervoice, Dry Brush, Closed Eyes, Common Air,
  Slow Accord, Deep Roots, Rose Window, Clock Room, Bent Blade, Ridge Lines,
  Chord Clock, Setting Glass, Standing Water, Ringing Order, Spun Wire, Flame
  Organ, Wire Lantern and Singing Sand. Each has a plate with a display of its
  own, sixteen presets and twenty in the bank, which is 1,908 presets on 89
  instruments.
- A set: five hundred presets of one instrument in ten directions of fifty,
  listed in `FACTORY_PACKS` on the new shelf `instruments` with the
  instrument it is of (`FactoryPack.instrument`) and its directions
  (`FactoryPack.directions`). Its presets come with the other packs'
  (`loadFactoryPacks`) and each says its direction
  (`FactoryPreset.direction`). `FACTORY_SET_SIZE` is how many a set holds;
  `FACTORY_PACK_SIZE` is still what a pack of any other shelf does.
