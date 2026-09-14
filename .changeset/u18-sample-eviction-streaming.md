---
'@kieranklaassen/live-mix': patch
---

`SampleStore` eviction (U18, R34): an LRU byte budget (`budgetBytes`, default unbounded), `pin`/`unpin`, counted holds via `retain(id)`, `evictOnRelease`, `evict()`, `onEvict`, `metrics`, `bytes`, `peek`/`touch`/`ids`, `bytesOfBuffer`, and `LoadedSample.kind: 'buffer'`/`bytes`. `SampleRetainer`: a Schedulable that follows a track's preload window and holds each upcoming clip's sample until the clip has ended. `ElementSource` (HTMLMediaElement + MediaElementAudioSourceNode, `prime`/`unlock`/`play`) and `ElementTrack`, which plays element sources with `AudioTrack`'s envelope events and Schedulable contract, with documented timing differences; `ClipSource = LoadedSample | ElementSource`. Testing: `MockMediaElement`, and `createMediaElementSource` rejects a second node per element as browsers do.
