---
'@kieranklaassen/live-mix': patch
---

The felt piano runs its strings four at a time with WASM vector instructions and works its room's mix out only when it moves: a third of the time it took (252 to 79 µs a block in `bench-devices`), the same sound to the last bit. It needs a browser with WASM SIMD (Safari 16.4 or later).
