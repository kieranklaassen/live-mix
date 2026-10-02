---
'@kieranklaassen/live-mix': patch
---

`useInfo` and `InfoView` follow a `root` ref whose element is mounted after the view, or mounted again under the same ref: before, a view that rendered ahead of its root never listened and stayed on its idle line. `describeParams` is pinned in the public entry's export list.
