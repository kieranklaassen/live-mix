---
'@kieranklaassen/live-mix': patch
---

A render starts every strip where it is set. A track muted, soloed, turned down, trimmed or panned before a render begins is so from the first sample of the file, and so is the master's level.

A strip approaches a new level, pan, input gain, mute or solo over 5 ms, so that a move made while sound passes is never a step. A render made the same approach, from its first sample: a muted track was heard for about the first 60 ms of a bounce, a track at half level began at full, a soloed track's neighbours leaked in at the head, and every stem of `renderStems` and `renderScoreStems` began with the other tracks in it. Before a render begins no sound passes, so there is nothing for a step to click in. On an `OfflineAudioContext` that has not started rendering, `ChannelStrip` (`setLevel`, `setPan`, `setInputGain`, `setMute`, `setSolo`, `setRide`, and the gates a solo closes) and `Bus.setLevel` now write the value for the first sample (`setValueAtTime(value, 0)`), and a shadow of the strip, which a track that shares its room sends through, starts with it. That covers `renderScore`, `renderScoreStems`, `renderOffline`, `renderStems` and an engine a host makes on an offline context itself.

What is as it was:

- A live engine. On an `AudioContext` each of these is an approach over the strip's time constant, at any time, 0 included.
- A value given with a time constant of its own or for a later time: `setLevel(0, { at: 0, timeConstant: 2 })` is still a fade from the first sample, `{ at: 0, timeConstant: 0 }` is still handed to `setTargetAtTime` as it is, and `{ at: 3 }` is an approach from 3 s.
- A move made once a render is under way (at an `OfflineAudioContext.suspend`), which approaches as it does live.
- A render whose strips and master are left alone: the same samples as before.

A render and live playback are now told different things in this one place: where the live engine is told `setTargetAtTime(value, now, 0.005)`, a render that has not begun is told `setValueAtTime(value, 0)`. A test that holds a render's `scheduleSnapshot()` against a live engine's, for a build or a score that sets a strip, differs in those events and no others. Three of the engine's own references began with a strip away from its default and changed that way: the build of `OfflineRenderer.test.ts` (a track at 0.8), the score of `renderScore.test.ts` (a pan, a mute and the master at 0.9) and the compiled script of `render.golden.test.ts` (a track at -12 dB). The session of the browser golden (`browser-tests/session.ts`, a level and a pan) is told the same on the stand-ins as in a real browser, as before, both now with the two values written for the start.

What the samples hold is measured in a real browser (`browser-tests/specs/render-starts-strips.spec.ts`): two tracks of noise bounced with a strip muted, soloed, at half level, trimmed, panned, under a group or a master turned down, as a stem, and with the muted track sending into a shared room, each held against the mix of the two noises from the first sample on.
