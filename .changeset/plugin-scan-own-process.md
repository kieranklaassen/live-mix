---
'@kieranklaassen/live-mix': patch
---

The plug-in host scans in a process of its own.

A plug-in that crashed while it was scanned took the host down with it, and everything loaded in the host and Link too; the next start scanned from nothing and met the next one. The host now starts its own binary a second time for the scan (`--scan-worker`), reads what it finds as it goes, and starts another after a plug-in that ended it.

- A plug-in that crashes, that keeps the scan waiting without using the processor (`idle` seconds, default 10) or that takes longer than `timeout` seconds (default 120) is left out, and the scan goes on in the same run. A crash after other plug-ins in the same process gets one more go alone before it is held against the plug-in.
- One scan process takes 40 plug-ins (`perProcess`) and the next carries on where it stopped: what plug-ins leave behind in a process adds up, and a long list ended the process whichever plug-in came next.
- `scan` answers with `crashed` (what is left out, from this scan and earlier ones; `rescan: true` tries them again) and `names` (what to call each entry of `failed` and `crashed`; an Audio Unit is listed by a code). `scanProgress` carries `name`.
- The list is saved while a scan runs. A host that is quit half way says so at the next start (`NativeHostInfo.scanUnfinished`), has what it found until then, and another scan carries on from there.
- Version 3 Audio Units are listed and asked from a thread other than the main one, as they have to be; the scan inside the host skipped them. The system makes them outside the scan process, so only `timeout` holds for them.
- `pluginHostTroublePluginDir` (`./native/shell`) and `FakePluginHost`'s `scanUnfinished` and `crashed` options, for tests.
