---
'@kieranklaassen/live-mix': patch
---

Plate displays, the third batch: every stock effect now has one.

- Reverbs: the Plate, Tides, Hall, Ether and Spring reverbs draw the first moments of one click above and the tail below, on a scale of seconds, with the time the tail takes to fall 60 dB written on it and worked out from the device's own loop (the diffusers in the loop are counted). Points set where the tail starts, how long it is and how soon its highs go. The Shaped Reverb draws its shape, its tail and the repeats, the Convolver the fall of its room. While a sound lasts a level at the left says what comes out against what goes in; when it stops, a dot rides down the tail.
- Long tails: the Bloom draws how far its tail has drifted and in which interval, the Expanse how the sound arrives and how long it hangs, the Shimmer the ladder of its octaves, the Swarm its cloud of echoes and the size it has now, the Sympathetic its strings and which of them ring, and the Vowel Reverb the vowel it speaks over the spectrum. Each tail's time is the device's, by band, and what was played is lit where it has got to on the fall. Decay, Stretch, Root and Vowel can be dragged. The Bloom, Swarm, Sympathetic and Vowel Reverb report readings for the display; their sound is unchanged.
- The ground of a display hushes the plate's finish under it, so a thin line is not read against specks or a brushing.
- Words on a display are drawn in full ink; one that stands back (a scale's numbers, a part not in use) is never fainter than 0.62 of it. No display sets type under 8 px, and a test holds every one to that.
- Reading the level and the wave a display follows costs a quarter of what it did (an indexed loop over the samples).
