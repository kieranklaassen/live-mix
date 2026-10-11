---
'@kieranklaassen/live-mix': patch
---

Every instrument has sixteen presets of its own: 304 new ones across the 34 instruments that had five to ten (Ember keeps its seventeen), appended after the ones that shipped, which load what they did. Each is played alone and measured by `instrument-presets.test.ts`: it is heard, peaks under -3 dBFS, sits within 6 dB of the middle preset of its instrument, and is at least 1 dB from every sibling on the bank's sound print; thirty-nine shipped presets outside one of those stay as they are and are listed (`AS_SHIPPED`). The presets cover what the bank left out: the Minor and Sus 2 zither chords, Glass ratios 5 and 9, seven Thesis scales, Dusk's Medium low cut, the Tape Orchestra's cellos. docs/devices.md, "Instrument presets".
