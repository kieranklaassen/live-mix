---
'@kieranklaassen/live-mix': patch
---

`@kieranklaassen/live-mix/testing`: `MockAudioNode.disconnect(param)` left the node connected to nothing at all; taken off a parameter, a node now keeps the nodes it feeds, as in a browser. `disconnect()` and `disconnect(output)` still take everything off.
