---
'@kieranklaassen/live-mix': patch
---

The picture follows a performance, with nothing to set up (`./visuals`).

- A `DeskReading` takes `perform`, a `PerformReading`: how much of the sounds that can leave the Energy dial lets through (`ladder`), how much of those the rides leave in (`rides`), and how long the last move takes (`overSec`). Left out or `null`, the desk makes the frame it made.
- With fewer sounds in, the visuals that paint for the whole piece leave one after another, the last drawn first and the first never. Every visual that paints shows less and stands further off, the palette is calmer, and the `energy` a style or a knob follows is the lower of the dial and the fullness. A visual linked to a stroke or drawn for a stretch is not thinned out.
- Tone off its rest asks for a filter over the finished picture: under it the fine detail goes and the picture dims, over it the broad light goes. Space over its rest lets the light stay, drift outward and spread; under it the piece's own trails are shortened. Both do nothing within `DIAL_REST_SPAN` of the middle.
- The picture is taken there by the time that went by, each value at the pace of the move that last changed it, so it arrives with the sound.
- A `VisualFrame` may carry `filter`, a `VisualFilter` (`soft`, `dim`, `thin`, `spread`). The stage draws it on the canvas that is shown, after the picture and before the grain, and never into what Trails keeps. A frame goes down a line whole, so a second screen paints it too.
- `frameOf` takes how full the piece is as a fifth argument, 1 where it is left out. `performMoves`, `fullnessOf`, `staying` and `paintsWholePiece` say what a performance does to a picture in plain values, for a host to put into words.
- The performer's `scene`, `ride` and `dial` events carry `seconds`, how long the move takes as the sound makes it (0 for a cut), so a host can hand the desk `overSec` without reading it off the state.

A piece as composed is drawn exactly as before: every addition is optional, and a reading at rest asks nothing.
