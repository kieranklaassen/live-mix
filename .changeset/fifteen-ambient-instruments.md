---
'@kieranklaassen/live-mix': patch
---

Fifteen instruments ambient music is made with, each a spec device on `cpp/kit` with a native test that measures what it claims, presets, and a description of every knob.

- `kit::PluckedString` and `kit::PluckExciter` (`cpp/kit/string.h`): one tuned delay loop with decay times at the fundamental and at a high partial, stiffness, a pluck-position comb and a pickup tap. The plucked instruments are built on it.
- `handpan`: a hand-played steel pan and tongue drum, with ringing notes that answer each other.
