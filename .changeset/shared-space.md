---
'@kieranklaassen/live-mix': patch
---

One room for the tracks that would each convolve for themselves and sound no different.

Every audio track with a placed clip has had a convolver of its own, ahead of its strip. A convolver with a long impulse is the costliest stock node there is: in a piece of eight placed tracks the rooms were about half of the audio thread's work. `EngineOptions.sharedSpace` lets the tracks whose strip only sets a level send into one room for each destination instead.

- `createEngine({ sharedSpace: true })`. Default false: nothing changes for a host that does not ask.
- A track shares while its strip does nothing but set a level: centre pan, no input trim, no post-fader send, and no insert except a `utility` that only changes gain. Its sends are driven (if the room is), take the track's level, and reach the shared convolver, which returns to what the track's strip feeds, so a group's strip still acts on all of it. A track that takes an effect, a pan or a send moves to a room of its own from then on, and back when it is plain again; what it had sent rings out where it is.
- The same sound while levels stand still: a gain ahead of a convolution is that gain after it. Rendered in Chromium, four tracks with a room each against the same four sharing differ by rounding (-129 dBFS at the worst sample in a clean room; in a driven, drifting room the difference is 113 dB under the sound). What differs is a level that moves: a shared track that is muted or faded stops sending and its room rings out, where its own room is cut with it. A strip's meter (`useStripMeter`) hears what a sharing track sends into the room as well as its strip, through `ChannelStrip.tap(node)`, so it still moves with a sound that sits far back; it does not show the room's tail.
- `ChannelStrip.shadow()`: a fader and a gate that take every ramp the strip gives its own, for sound of the track that leaves another way. `ChannelStrip.tap(node)`, `ChannelStrip.hasSends`.
- `Meter.levels()`: peak and RMS from one read of the analyser; `readMeter` uses it, so a drawn meter does half the work.
- `NodeDevice.follow(name, param)`: keeps an AudioParam outside the device in step with a parameter, a lane written ahead included. `isUtility`, `utilityIsLevelOnly`.
- `SharedSpaces`, `SpaceFeed`, `stripOnlySetsLevel`; `SpaceRoom.leave()` lets a whole room ring out before it takes itself down.

Not followed: a ramp written straight onto `strip.fader.gain` (a ducker, a lane on the strip's level), and a send added to a track that already shares (it is seen at the next change of the strip).
