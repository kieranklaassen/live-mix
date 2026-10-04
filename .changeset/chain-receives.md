---
'@kieranklaassen/live-mix': patch
---

A chain takes a host's own tools on each device, and marks where something carried in from outside would land.

- `DeviceChainView` takes `deviceActions(device, index)`: tool cells of the host's own for one device (swap it for another, keep its settings), drawn after the two move cells and before the remove cell, on a plate and on a panel. `index` counts among the devices shown. A button there keeps its own press and never starts a carry.
- `DeviceChainView` takes `dropAt`, the place among the devices shown where something carried in from outside the chain would land (0 heads them, their number ends them, `null` is none). The chain stands its marker (`lm-chain__marker`) in that gap and has the class `lm-chain--receiving` meanwhile. A carry of the chain's own has the marker while it lasts, and a chain that shows no device marks nothing.
- `chainDropIndex(chain, clientX)` reads that place for a pointer off the chain's element (`.lm-chain`): past a device's middle is after it. `dropIndex(spans, x)` and `dropMarkerPosition(spans, index)` are the same counting and the marker's place without the page, for a rack a host draws itself.
