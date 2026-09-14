---
'@kieranklaassen/live-mix': patch
---

`ChannelStrip` on every track (`AudioTrack`, `LiveInputTrack`, `InstrumentTrack`, `ReturnTrack`): input gain → inserts → `StereoPanner` pan → fader → mute/solo gate → destination, post-fader `sends`, every change a `setTargetAtTime` approach (5 ms). Strips create no nodes until first used, so Phase 0 node order is unchanged. `GroupTrack` + `engine.addGroup/group/hasGroup/groups/removeGroup`: a summing strip members route into (nesting, `add/remove`, loop check, dissolve re-routes members). `SoloInPlace` (`engine.solo`): solo-in-place across tracks, groups and returns — soloed strips heard through their normal routing, others ramped to silence, groups pass soloed members, returns solo-safe by default, mute wins.
