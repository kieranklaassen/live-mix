---
'@kieranklaassen/live-mix': patch
---

`ScoreRenderer`: a pass in which an insert's id changes strip goes through,
whichever of the two strips is built first.

A pass gives the strips their inserts one after another (the master, new
owners, then the rest), and each strip dropped what had left it only on its own
turn. An id that was on one strip in the score rendered and on another in the
next was therefore still rendered when the strip it goes to came first:
`device "<id>" is already rendered`, the pass did not land, and every later
pass failed the same way. A host reached it by loading one piece over another
that has the same instance id on another strip (an equaliser on an instrument
track in one, on the master in the other), or with two edits folded into one
pass.

An insert that the next score has somewhere else is now taken off its strip
before any strip adds. It is made anew where it goes, as it already was in the
passes that went through. A pass in which no insert changes strip is rendered
with the same calls in the same order as before.
