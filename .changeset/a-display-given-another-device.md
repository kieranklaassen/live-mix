---
'@kieranklaassen/live-mix': patch
---

`PlateDisplayLayer` (and so `DevicePlate`): a display given another device, or another display, while a handle was in hand went on dragging. The next move wrote the new device's parameters with no `onDragStart` for them, and the pointer's going up called the new owner's `onDragEnd` for a drag it was never told of. The drag now ends at the change, once, with the `onDragEnd` it began under, and the pointer moves nothing of the new device until it presses again. A plate keyed by its device, as `DeviceChainView` keys them, never met it.
