---
'@kieranklaassen/live-mix': patch
---

The paint kit and the grid themes (`./react`), plus sound analysis in the core.

- `Stroke`: one sound as a pill, a thin ring in the brush colour around the sound's own waveform (halo, filled shape, fine bars). It draws repeats (later passes dimmed behind a dashed seam), fades and crossfades, detected hits, an automation line, and the selected, muted and reversed states. The geometry is exported (`strokeLevels`, `levelsOutlinePath`, `fadePaths`, `fadeGainAt`, `repeatSeams`, `hitPositions`, `automationPositions`).
- `SoundIcon` (texture, pad, drone, one-shot, melodic, beat loop, loop, reverse), `PaintField` (the grid strokes sit on) and `ChannelRowView` (a mixer strip in one 20 px row over `useStrip`).
- Themes `graphite`, `paper` and `water` (`data-lm-theme`, `themeStyle`): a 40 × 20 px module, square controls, a Futura-style sans in regular weight; `.lm-dense` applies the density rules. New tokens on every theme: `grid-line`, `grid-line-strong`, `rule`, `automation`, `brush-1…6`, `brush-ink-1…6`, `row`, `col`. Hosts that set every token themselves need to add these.
- `analyzeSound` classifies a decoded sample (`SoundKind`), finds its onsets and estimates its tempo (`detectOnsets`, `estimateTempo`); `samples: { analysis: true }` on the engine keeps the result on each `LoadedSample`.
