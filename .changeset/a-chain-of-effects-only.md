---
'@kieranklaassen/live-mix': patch
---

`DeviceChainView` draws effects only: the alignment stage the engine puts on a strip is never shown, moved or removed.

- `engine.alignLatency()` puts a delay stage (`isAlignmentDelay`) on a strip's inserts so its sound arrives with the others. The chain drew it as a device called `pdc-delay`, with move cells and a remove cell: its remove cell took the stage off the strip and disposed of it, and on a chain no score carries its move cells moved it among the effects. It is now left out of the chain, and so out of what a carry, the move cells, `pinned` and a host's `dropAt` count.
- `useInserts` leaves alignment stages out too. A host that wants the engine's whole list reads `strip.inserts`. A host that finds a device by indexing `useInserts(host)` with an item's `data-lm-insert` reads `strip.inserts` for that: once a strip is aligned the two no longer count the same devices.
- Under an arbiter the places a chain writes in `device.move` and `device.add` are the score's own, wherever in the engine's list a stage stands. Without one, a move is made on the engine's chain at the places the devices shown have there.
- `data-lm-insert` on each item, and the index handed to `onRemove`, are still the device's place in the engine's chain, stages counted. A plate's display reads what goes into its device from what stands before it in that chain.
