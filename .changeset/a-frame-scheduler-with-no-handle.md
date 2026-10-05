---
'@kieranklaassen/live-mix': patch
---

`subscribeFrames` (and with it `useFrameSampled`, `useMeter`, `useTransport`, `Meter`): a `FrameScheduler` whose `request` hands out no handle (a host's own loop that only queues the callback) was asked for a frame again by every subscriber that joined while the chain was running, and each of those requests then kept its own chain going: a page of meters mounted one after another ran as many frame callbacks per frame as it had meters. Whether a frame is asked for is now kept apart from the handle, so there is one chain whatever the scheduler returns. The default scheduler always handed out a handle and is unchanged.
