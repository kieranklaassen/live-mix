---
'@kieranklaassen/live-mix': patch
---

`SampleStore.load(id, arrayBuffer)` no longer empties the caller's `ArrayBuffer`. A browser's `decodeAudioData` detaches the buffer it is handed and rejects one that is detached already, so bytes a host kept (what its `resolveSource` hands over) decoded once only: asked for again after the sample was dropped by the budget, a release or a `forget`, or by a second engine on an offline render's context, the load failed and the track skipped the clip in silence. The store now hands the decoder a copy. Bytes fetched from a URL are handed over as before; the cost is one copy of the encoded bytes for the length of a decode.
