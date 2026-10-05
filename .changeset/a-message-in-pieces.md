---
'@kieranklaassen/live-mix': patch
---

The plug-in host holds a WebSocket message that arrives in pieces to the same 256 MB as one that arrives whole. The limit was asked of each piece, so the pieces of one message could add up to any size in the host's memory.
