---
'@kieranklaassen/live-mix': patch
---

A plug-in scan says why a file gave it no plug-in.

- `scan()` and `known()` answer with `reasons`: for an entry of `failed`, what is wrong with the file in plain words. The bundle holds no program for this system; the program is built for another processor ("It is built for Intel only, and this app runs as Apple silicon. It needs a version of the plug-in for Apple silicon."); or what the system said when it was asked to load it. The scan process looks while the plug-in still counts as the one being scanned, so a file that crashes or hangs when it is loaded is left out like any other.
- The reasons are kept with the host's list between runs, and asked again when a file is given another go.
- `FakePluginHost` gives `FAKE_BROKEN_REASON` for every file it could not load.
