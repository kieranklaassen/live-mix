---
'@kieranklaassen/live-mix': minor
---

The last eight preset packs, which brings the packs to twenty-five and 2,500 presets.

- Eight more packs in `FACTORY_PACKS`, each a hundred presets across every instrument, held to the same rules as the first seventeen.
- Every pack preset has now been measured for cost on a quiet machine: the median is about 3 % of real time and none is over 12 %. Four piano presets that were over (the piano with both its own room and its sympathetic strings on) have one of the two turned off and are levelled again.
- Two presets of the bank lose a product's name, and their ids change with it, which is why this is a minor bump: `solina-hall` is now `ensemble-strings-hall` ("Ensemble strings, hall") and `ebow-octave-line` is now `sustained-octave-line` ("Sustainer at the octave"). A host that stored either id needs the new one.
