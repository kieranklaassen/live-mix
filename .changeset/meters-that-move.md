---
'@kieranklaassen/live-mix': patch
---

A meter on a source moves its fills and its held mark without being painted again.

A fill cut with `clip-path` or given a length on every frame had the browser
paint it again and put every layer of the page together again. Its fill now
stands painted in a window of its own (`.lm-meter__window`), and the window, the
fill or the mark is moved by an animation that stands still. In a page with
twelve meters that took drawing from 8 ms of a frame to 2. Where elements cannot
be animated, and where a pixel is not a whole number of the device's, a meter
writes its styles as before. The fill is a grandchild of its bar's window now
and no longer a child of the bar.
