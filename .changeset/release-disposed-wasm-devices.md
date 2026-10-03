---
'@kieranklaassen/live-mix': patch
---

A disposed WASM device gives its memory back at once, and an engine's inserts are disposed with it:

- The WASM device processor lets go of its `WebAssembly.Instance` and every view into its memory when it is told to dispose, instead of only ending the node the next time it is rendered. A context that has stopped rendering (an `OfflineAudioContext` once its render is done) never renders its processors again, so they kept their memory for as long as the page lived; Chromium has room for about 120 WASM memories at a time, and offline renders past that came out silent (the twentieth bounce of a piece with six devices).
- `ScoreRenderer`: when its engine is disposed it now disposes the inserts it made on tracks, groups, returns and the master. A strip leaves its inserts to whoever made them, so before this nobody disposed them. `engine.dispose()` after `renderOffline`, `renderScore` or `renderStems` is what frees a render's devices.
