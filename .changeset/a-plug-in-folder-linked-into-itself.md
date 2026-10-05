---
'@kieranklaassen/live-mix': patch
---

A plug-in scan searches a folder that holds a link back to itself, or to a folder above it, once. One such link had the scan list every plug-in under it many times over, and two had the plug-in host search for ever and answer nothing more until it was ended by hand. A plug-in is now listed by the paths that do not go round such a link: a list saved while the link was there keeps its entries, and after a scan that starts over a plug-in that had been picked by one of the longer paths is no longer known by it.
