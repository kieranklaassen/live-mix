---
'@kieranklaassen/live-mix': minor
---

A score can carry the host application's own annotations on the document as a whole: `Score.meta`, a plain JSON object with one entry per concern (a key, a chord loop), written with the new `score.setMeta` operation (`patch`: a value sets an entry, `null` removes it, entries it does not name stay). Like `meta` on a clip or a source it is validated as JSON, saved with sorted keys, undone and redone with the rest of the document, and never read by the library; an empty one is dropped. `ScoreMetaPatch` is exported, and the agent API gains the `score_set_meta` tool under `arrange` consent.
