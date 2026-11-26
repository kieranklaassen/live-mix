---
'@kieranklaassen/live-mix': patch
---

The feedback delay network reverb takes a little over half the time it took, and the felt piano's own reverb a fifth less, with the same sound to the last bit. Their sines and tangents are worked out four at a time (`cpp/common/vector_math.h`), and the gains are worked out again only while a control is on its way.
