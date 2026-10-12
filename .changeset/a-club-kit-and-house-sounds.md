---
'@kieranklaassen/live-mix': patch
---

A third kit, and house sounds for the bank:

- `club-kit`: twelve synthesized drums for house and dance music, one on each
  key of the octave (kick, crash, snare, ride, rim, closed hat, shaker, open
  hat, clap, low conga, cowbell, high conga), in four characters (Firm, Deep,
  Dusty, Bright). Ten parameters, sixteen presets, twenty bank presets in the
  category `drum`. It is in `KIT_INSTRUMENTS`, and its `tune` follows the key
  of a piece as the other kits' does. The bank is 1,124 presets on 55
  instruments.
- 81 sounds, numbers 401 to 502, written to be laid together at one tempo: on
  the Club Kit twelve grooves, twenty-four layers (one part of a groove
  alone), six fills and fifteen single hits; twelve risers, sweeps and
  impacts; twelve chord riffs and bass lines. The bank is 325 sounds.
- A sound that keeps time can end. A fill or a rise has a `bpm` and no
  `loopCrossfadeSec`: whole bars played once from a bar line, which at another
  tempo (`soundAtTempo`, `renderFactorySound(sound, { bpm })`) are as many
  beats long and still end on their bar line. Until now every sound with a
  `bpm` was a loop: a host that took `bpm` to mean one should ask
  `loopCrossfadeSec`. A variant leaves such a sound at its own speed. A
  sound can name a control of its own instrument that is a length of time or
  a rate in that sound alone (`FactorySound.timedParams`): the two reverse
  crashes say so of the sampler's `end`. A sound that keeps time and is read from another one
  (`source` and `bpm`) is not detuned by a variant.
- `FactorySound.kitLevel`: one part of a kit (a layer, a fill, a single hit)
  is rendered at its kit's own level and not brought to the bank's peak, so a
  row of hats is as far under a kick as the kit has it and parts laid over
  each other are balanced as one kit. Such a sound peaks between −6 and about
  −20 dBFS. `KIT_LEVEL_DB` (a new export) is the gain for each kit that has
  such sounds. A sound made from such a part (`source`) that says `kitLevel`
  is brought to that part's peak: a reverse crash ends as loud as its crash
  starts.
- `renderPatch`: `peakAfterFades` is a new option. `normalizePeakDb` takes the
  peak before the fades, as it always has, so a recipe a host kept renders as
  it did; with `peakAfterFades` it takes the peak the fades leave, so a sound
  that is loudest in its last moments comes out at the level asked for.
  `renderFactorySound` asks for it for a sound that keeps time and ends and
  for a sound made from one part of a kit, and for nothing that shipped
  before; `gainDb` is a new option, a fixed gain for a result that is not
  brought to a peak; and `wholeFramePasses` is a new option that lays the
  passes of a phrase played round (`loopFold: 'linear'`) on whole frames of
  the loop, so at a tempo where a loop, or a stroke's place in it, is not a
  whole number of frames (126, 140) the fold does not take level off its
  first stroke (up to 1.1 dB, and 3 to 4 dB of its top on hats and a shaker).
  `FactorySound.wholeFramePasses` asks for it, and the loops of the house
  pack do (`barsFramed`, `inTimeFramed`). No loop that shipped before does:
  every sound that shipped, and every `renderPatch` call a host made, comes
  out sample for sample as it did, at every tempo and sample rate compared.
  (A host's own `FactorySound` with a `bpm` and no loop is the one shape
  that is read differently, as said above.)
- A kit sound of one stroke is its own variant: `varySound` has nothing in it
  to move.

Nobody has listened to any of it: levels, onsets, pitches, loop joins and
kinds were measured (docs/factory.md, docs/devices.md).
