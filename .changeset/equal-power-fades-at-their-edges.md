---
'@kieranklaassen/live-mix': patch
---

A clip with `fadeCurve: 'equalPower'` and no fade-in, no fade-out, or fades longer than itself no longer throws while its voice is made.

- `AudioTrack`, `StretchTrack`, `ElementTrack`: the equal-power envelope was written as two `setValueCurveAtTime` curves whatever their lengths. A browser refuses a curve of no length and a curve laid over another, so such a clip never sounded and stopped the scheduler's tick each time it was offered. With no fade-in the level is 1 from the start, with no fade-out it stays there, and fades longer than the clip (or than what is left of a stretch clip joined late) keep the fade-in and give the fade-out what is left, as the linear envelope does. Where both fades have a length and fit, the events written are unchanged.
- `fadeOutVoice` / `fadeOut` on an equal-power voice over 0 seconds is a cut instead of a curve of no length.
