---
'@kieranklaassen/live-mix': patch
---

`./react` has three parts a channel of a mixer is laid out with, moved from Ambient Live, whose mixer strips are built from them: `PeakReadout` (the highest level a meter has read since it was last let go, as a number that is also the button that lets it go; it takes the hot colour from `hotDb` up and is filled with it once the signal has reached `clipDb`), `ChannelSwitch` (a switch that carries the channel's number or a letter, an outline while off and filled while `on`; `pressed` is what it tells a screen reader where that differs from being lit, and `tone="solo"` lights it in the solo colour) and `MeterScale` (the marks a meter is read against, in dB under full scale, a line between each two; its numbers thin out as the size container it is in gets lower). Their rules stand at the end of `./react/styles.css` and use only tokens every theme has. Presentational: nothing reads the engine.
