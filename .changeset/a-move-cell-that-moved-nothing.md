---
'@kieranklaassen/live-mix': patch
---

`DeviceChainView`: a move cell pressed with the focus on it where the press moves nothing (a device already at the chain's end, pressed again with the pointer held where it was; a step the score did not take) was still kept as the cell to give the focus back to. The next change of the chain, from anywhere and however much later, then handed that cell the focus if the focus had gone to the page meanwhile, and the keys were about a move cell nobody had gone to. A press that moves nothing keeps no cell, unless a step before it is still on its way into the chain.
