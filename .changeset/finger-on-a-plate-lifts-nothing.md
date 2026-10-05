---
'@kieranklaassen/live-mix': patch
---

`DeviceChainView`: a finger on a plate's face no longer lifts the plate.

A plate is taken anywhere on its face, and the face leaves a touch to the browser, which scrolls the chain with it. A carry began after 4 px sideways for any pointer, so the few px a resting finger slides before the browser calls it a swipe lifted the plate; near an end of the view the chain then ran under the still finger, and the plate landed a place or two away when the finger came up. A touch now takes a device only by the parts that keep a touch to themselves (`touch-action: none`): the grip, a panel's title bar, a host's own `data-lm-drag-handle`. A mouse and a pen take a plate by its face as before, and the plate's info text says which is which.
