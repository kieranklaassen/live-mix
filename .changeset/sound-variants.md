---
'@kieranklaassen/live-mix': minor
---

A variant of a factory sound (`./dsp`): the same recipe played once more, a little differently. `varySound(sound, { seed, amount })` gives the variant's recipe and `renderFactorySound` takes `vary`. A seed is one variant, always the same one; `amount` is 0 to 1 and at 0 the sound itself comes back, so its render does not change. A variant moves each note a little in time, touch and tuning, may change the places of two notes of a phrase, may open a held chord by an octave and takes a held chord up at another moment; the instrument, the effects, the length, the loop, the key and the attack stay. `VARIATION_LIMITS` says how far each goes at an amount of 1. Bench: `FACTORY_REPORT=variants`.
