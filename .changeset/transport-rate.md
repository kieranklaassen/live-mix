---
'@kieranklaassen/live-mix': minor
---

The transport has a rate: `transport.setRate(rate)` makes the timeline run faster or slower against the audio clock while it plays (reason `rate` on `onChange`, `transport.rate`, `TransportOptions.rate`), and `position()` / `contextTimeAt()` and `positionFromAnchor(anchor, time, loop, rate)` follow it. The scheduler re-derives pending starts at their new clock times and passes the rate on (`Schedulable.retime`, tick reason `rate`); `AudioTrack` plays linear clips at it the way tape does (`track.rate`, `track.setRate(rate, at)`: `playbackRate`, with a sounding clip's fades and end rewritten), and `LaneWriter` takes it from its window (`LaneWindow.rate`). Equal-power clips, stretch tracks and element tracks keep playing at the clock's speed. At rate 1 every recorded `AudioParam` event and source start is unchanged.
