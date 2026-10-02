---
'@kieranklaassen/live-mix': minor
---

A device of a chain is moved by taking its title bar, as a device is in a rack.

- `DeviceChainView` no longer uses HTML drag and drop. A press on a device's title bar (or the grip at its left) that moves becomes a carry: the device's name rides the title row under the pointer, its panel stays dimmed where it was, and a marker (`lm-chain__marker`) stands in the gap it would land in. Letting go puts it there, as one `device.move` under an arbiter and a rebuild of the tail otherwise; Escape leaves it where it was. A device goes past a neighbour when the pointer is past that neighbour's middle. The chain's nearest sideways scroller scrolls while the pointer is near an end of it. Buttons, the preset picker and knobs keep their own presses.
- `useChainReorder(onMove)`, `landingIndex` and `markerPosition` are exported for a rack a host draws itself: `data-lm-drag-handle` marks what a device is taken by, next to the kit's own `lm-chain__handle` and `lm-device__header`.
- `DevicePanel` takes `hint`, a line added to its info text; a chain uses it to say the device can be moved.
- The marker and the carried name are children of `lm-chain`. A host stylesheet that drew something between devices with `.lm-chain > * + *` should name `.lm-chain__item` instead.
- `lm-chain__item--over` is gone.

A plate (`DevicePlate`) in a chain is taken anywhere on its face that is not a control, and takes `hint` like a panel. A device keeps its panel or plate when it moves: the chain keys them by device, not by place. The click that follows a carry presses nothing.
