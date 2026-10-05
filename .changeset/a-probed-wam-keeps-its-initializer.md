---
'@kieranklaassen/live-mix': patch
---

`@kieranklaassen/live-mix/wam`: a descriptor from `describeWamDevice` or `registerWamDevice` given `host: { initialize }` kept the probe's group id and key and dropped the initializer, so `create` on any context but the probe's (an offline render, the context of the next session) installed the WAM host with the stock SDK's `initializeWamHost` and not the one the caller gave. The descriptor now keeps the initializer beside the probe's group. On the context of the probe nothing changes: its host is installed once and shared.
