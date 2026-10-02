---
'@kieranklaassen/live-mix': patch
---

An empty `scan-in-progress.txt` left by an earlier host no longer makes the scan unfinished.

- A host from before scans ran in a process of their own noted the plug-in it was in and took it out of the note again after it, so a scan that reached its end left an empty file. The host read any such file as a scan that had been cut short, `scanUnfinished` came back true, and an app that carries on an unfinished scan at launch scanned everything again. Only a note that names a plug-in means that now; an empty one is removed and nothing else.
