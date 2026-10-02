---
'@kieranklaassen/live-mix': patch
---

The plug-in host remembers the files it could load no plug-in from, and a scan can give one plug-in another go.

- A file a scan loaded no plug-in from is kept with the host's list, like a plug-in that crashed: later scans and later runs do not open it again. A plug-in that asks for its licence in a dialog every time it is looked at is met once.
- `scan({ retry: [entries] })` takes the named entries of `failed` or `crashed` off those lists first, so the scan looks at them again, and otherwise only at what is new. `rescan: true` still starts over.
- `client.known()` answers with the list and with `failed`, `crashed` and `names` as the host keeps them, without a scan; the `plugins` request carries them. `failed` and `crashed` no longer overlap: a plug-in that ended a scan is in `crashed` only.
- `FakePluginHost` says what it has left out from the start (`crashed`, and a new `failed` option), takes a retried entry off, and exports `FAKE_BROKEN_FILE`.
