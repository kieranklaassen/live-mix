---
'@kieranklaassen/live-mix': patch
---

`subscribeFrames` (and with it `useFrameSampled`, `useMeter`, `useTransport`, `Meter`): a `FrameScheduler` whose `request` hands out no handle (a host's own loop that only queues the callback) was asked for a frame again by every subscriber that joined while the chain was running, and each of those requests then kept its own chain going: a page of meters mounted one after another ran as many frame callbacks per frame as it had meters. Whether a frame is asked for is now kept apart from the handle, and a frame asked for with no handle is not called off in name only when the last subscriber leaves (such a scheduler has nothing to cancel it by): it comes, and is the one chain for whoever has joined by then. So there is one chain whatever the scheduler returns, also when the only subscriber is replaced by another before the frame. The default scheduler always handed out a handle and is unchanged.
