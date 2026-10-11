---
'@kieranklaassen/live-mix': patch
---

`WasmDevice.playedNotes()`: a key held while 128 later notes were played was forgotten, so `frame.notes` lost it and an instrument's display went dark on a note that still sounded (a drone under an arpeggio, after sixteen seconds at eight notes a second). Past 128 remembered notes the oldest one that was let go now makes room, and a held one only when every note remembered is held.
