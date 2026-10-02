---
'@kieranklaassen/live-mix': patch
---

`SampleStore.load(id, source, known?)`: a caller that already has a sample's waveform peaks or its analysis (`KnownSample`) hands them over, and the store keeps them as they are instead of reading every frame again on the calling thread. A field left out is worked out as the store's `peaks` and `analysis` options say. For an app that renders or analyses audio in a worker, or keeps what it worked out between visits.
