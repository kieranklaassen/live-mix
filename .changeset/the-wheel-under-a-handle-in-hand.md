---
'@kieranklaassen/live-mix': patch
---

`PlateDisplayLayer`: the wheel turned over a handle while the pointer holds it (a band of an EQ dragged with one hand and its width turned with the other) is part of that drag. It was a turn of its own: `onDragStart` was called a second time in the middle of the drag and `onDragEnd` 400 ms after the last notch, with the handle still in hand, so with an arbiter the one drag was two or three undo steps and one undo left the point halfway. With a handle in hand the wheel now only writes (`onDrag`); the drag begins at the press and ends when the hand lets go, as one step. A turn of the wheel with no handle in hand is as before.
