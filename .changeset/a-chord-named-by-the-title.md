---
'@kieranklaassen/live-mix': patch
---

`soundDegree` says the chord a sound is written on by the sound's name where
the name says one: the first note it has in braces ("Thumb dub line {A}m" is
on A), a black key counted with the white key under it. It went by the lowest
written note alone, which is another note for a bass line that dips under its
root or a round whose lowest voice is not its root: 26 sounds of the bank (21
of the 35 bass lines that keep time among them) and 156 of the packs were
named a chord their title does not say. A sound with no note in its name is
named by its lowest note, as before.

`chordMoves` goes by the same chord. For those sounds it leaves out the step
that the name makes B, and offers the one that only brings the lowest note to
B, which `SoundVariation.chord` now plays for a sound that plays the note it
is named by (all but "Tanpura pluck D", whose instrument sounds that note).
No step that moved a sound's notes is taken away or moves them differently:
the step that is no longer offered still plays as it did, so a piece saved
with it is the same piece. The chord a variant draws without one being said
is unchanged.
