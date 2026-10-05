---
'@kieranklaassen/live-mix': patch
---

`DeviceChainView`: a move cell pressed again with the pointer held where it was goes on with the device it moved, since the neighbour has slid under the pointer. The chain knew "held where it was" only by the two presses being at the same place, so a pointer that had gone elsewhere and come back to that place (within two pixels) was taken to have stayed, and the press moved the device stepped before instead of the one whose cell was pressed, however long ago that step was. A pointer that moves away from where the step was made now ends it; one that only trembles in place does not.
