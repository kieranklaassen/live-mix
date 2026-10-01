---
'@kieranklaassen/live-mix': patch
---

A clip can say where it sits, apart from the other clips on its track: `Clip.pan` (left to right, ahead of the track's pan), `Clip.lowpassHz` (a low-pass on that clip alone) and `Clip.spaceDb` (how much of it goes into the track's space, in dB against the clip's own level). A clip with any of the three is placed: an audio track plays it through a trim, a low-pass and a panner of its own, so two clips of one source on one track can sound in different places at once, and a placed clip's `gainDb` reaches down to −60 dB. A mono clip placed in the centre is as loud as the same clip unplaced.

The space is a long dark room with no early slap (`generateSpaceImpulse`, `SpaceOptions`: noise that swells in, falls 60 dB over five seconds and dulls as it goes, with unit energy so a steady send at 0 dB comes back as loud as it went in). Each audio track convolves for itself ahead of its strip, so its inserts, fader and mute act on the space as on the dry clips; every track of an engine reads the same impulse (`createEngine({ space })`, `engine.spaceImpulse()`), so the tracks sound as if they shared one room. The room is made when a clip first sends into it.

A sounding placed clip follows its edits: when a track's clip list changes, each scheduled voice's trim, pan, low-pass and send approach the clip's new values over a few milliseconds without the clip starting again (`AudioTrack.place` does the same for a voice an adapter started). A clip that names no placement is wired exactly as before.

In the score: the three fields are validated (`pan` within ±1, `lowpassHz` of 20 or more), normalised (kept as given, a `pan` of 0 included, since it still says the clip is placed), compared by the renderer and in the agent's clip schemas. `clip.update` takes `null` to take a placement field off a clip, which is what the inverse of adding one says. `clipPan`, `clipLowpassHz`, `spaceSendGain` and `isPlacedClip` are the same numbers as plain functions, for a drawing. A real-audio browser spec (`placed-clips.spec.ts`) measures all of it on an `OfflineAudioContext`.
