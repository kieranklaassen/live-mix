---
'@kieranklaassen/live-mix': patch
---

`./react` has the parts a block of a bar is laid out with, moved from Ambient Live, whose bottom bar is built from them: `Places` (the places of a surface, the one in view filled), `BlockHead` and `State` (the way back, what this is, its state with a lamp), `ListRow` (a row of a list to go into), `Says`, `MainAction` and `PlainAction`, `Choice` (one of a few in one frame), `Dropdown` (the platform's select in the same frame), `Tick`, `Pill`, `Room` (a size container, `lm-room`, that draws the parts in it lower where the bar is low), `Group`, `Row`, `Hint`, `Well`, `Card`, `NamedChip` (a swatch, a name, a star), `KeptSheet` (a sheet opened with `open` that stays mounted while closed, so what lives in it goes on working; `Sheet` is unchanged) with `SheetPart`, and the glyphs `Chevron` and `Star`. Their rules stand at the end of `./react/styles.css` and use only tokens every theme has. Presentational: nothing reads the engine.
