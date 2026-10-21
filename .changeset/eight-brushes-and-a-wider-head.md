---
'@kieranklaassen/live-mix': minor
---

Eight brushes: every theme gains `brush-7` (a red) and `brush-8` (a purple) with their inks, in `LM_TOKENS`, each theme object and each `[data-lm-theme]` block of the stylesheet, with `lm-swatch--b7`/`--b8`, `lm-stroke--b7`/`--b8`, `lm-vstroke--b7`/`--b8` and `lm-row__swatch--b7`/`--b8`. `BRUSH_COUNT` is 8, so `brushIndex`, `Stroke` and `ChannelRowView` now wrap by eight: a 7 is red where it was a teal (brush 1), an 8 purple where it was brush 2, and a 9 is brush 1. Brushes 1 to 6 keep their values in every theme. Each new brush is at least 3:1 on the lane's ground (`sunken`), its ink at least 4.5:1 on the brush and on the stroke's wash, and the red is at least 12° of hue from `danger` and `record`. `lane-head-width` is 200 px (five columns) in every theme, up from 160 px, so a head with a swatch, a glyph, M, S and a host's menu button keeps at least six letters of its name. Seen in no browser by a person yet.
