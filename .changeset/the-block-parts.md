---
'@kieranklaassen/live-mix': patch
---

`./react` has the parts a block of a bar is laid out with, moved from Ambient Live, whose bottom bar is built from them: `Places` (the places of a surface, the one in view filled), `BlockHead` and `State` (the way back, what this is, its state with a lamp), `ListRow` (a row of a list to go into), `Says`, `MainAction` and `PlainAction`, `Choice` (one of a few in one frame), `Tick`, `Pill`, `Room` (a size container, `lm-room`, that draws the parts in it lower where the bar is low), `Group`, `Row`, `Hint`, `Well`, `Card`, `SheetPart`, and the glyphs `Chevron` and `Star`. Their rules stand at the end of `./react/styles.css` and use only tokens every theme has. Presentational: nothing reads the engine.
