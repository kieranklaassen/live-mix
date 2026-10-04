---
'@kieranklaassen/live-mix': patch
---

A move cell keeps the focus, and a carry scrolls back no further than the chain's start.

- `DeviceChainView`: with the focus on a device's "Move later" cell, Return moved the device and the focus fell to the page, since the block that moves is the one taken out of the page and put in again. The cell that was pressed while it had the focus is given it back once the device stands in its new place; at the chain's end, where that cell goes dim, the cell beside it. On a plate the tools are not drawn once the focus is gone, and what is not drawn takes no focus: the plate carries `data-lm-refocus` for the moment of that focus, and the stylesheet draws the tools under it. A focus that went elsewhere meanwhile is left alone.
- `useChainReorder`: a device carried with the pointer held at the scroller's near edge scrolled the bar back past the chain's first device, into whatever the host stands before the chain. The carry now scrolls back no further than the chain's own start (`carryScrollMin`).
- A device taken within the edge's reach no longer sets the bar scrolling at once: an end scrolls only after the pointer has been clear of it, or has moved towards it (`armedEnds`).
