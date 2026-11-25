---
'@kieranklaassen/live-mix': minor
---

Note makers: a patch may name a rule in front of its instrument
(`Patch.maker`) that writes notes from the notes played into it. The same
rule runs in a render (`makePhrase`, `madePhrase`) and live (`MakerPlayer`),
some of its voices can have an instrument of their own, and it moves with the
patch's key and tempo. See docs/makers.md.
