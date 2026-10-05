---
'@kieranklaassen/live-mix': patch
---

The React kit's views: a timeline that hung the page, holds that were never let go, and eleven smaller faults.

- `TimelineView`: a loop switched on over a timeline with no end (a new engine's, by the transport bar's Loop button) made the canvas infinitely long and the ruler never came to its last tick, so the page stood still. Such a loop is drawn as no loop, and `rulerTicks` gives a length that is not finite no ticks.
- `TimelineView`: a clip's waveform is drawn when its sound is decoded after the clip is on the lane, and taken away when the store lets the sound go. Before, a lane read the store once as it rendered.
- `useStrip` (`useTrack`, `useGroup`, `ChannelStripView`, `ChannelRowView`): with an arbiter, a fader in hand stayed held against every agent write when the view was given another strip in the middle of the move, when it left the page, or when the score dropped the track before the pointer went up. The hook keeps what it touched and lets go of it on each of these.
- `useDevice`, `useDeviceParam`: the same for a parameter in hand when the panel is given another device or leaves the page.
- `useFrameSampled`: the render that turns the sampling on took the value of the last time it was on, so a playhead moved at rest and then started stood for one frame where it last ran. The value is taken afresh in that render.
- `useTransport`: new `pass`, the counted pass of the loop (`Transport.pass`). `TransportBar` printed `iteration + 1` as the loop pass, which is a new number after every start and every seek; it prints the pass.
- `TransportBar`: the loop button of a timeline with no end read "0:00.0". It carries a length only when there is one.
- `MixerView`, `TimelineView`, `ChannelStripView`: strips, lanes and sends were keyed by name, and names are unique per kind only. Two of one name left a copy of one of them in the page when the list was put in another order. The keys are unique now.
- `ChannelStripView`: a send taken off and put on again at another level (what the score's renderer does when a send gains or loses its level) went on showing the old level.
- `MasterStripView`: a device put on the master, or taken off it, shows without the mixer being drawn again.
- `useSchedule` (and a lane of `TimelineView`): a clip with a `chance` was marked as sounding or coming up on a pass the scheduler's draw sits it out of. It is asked `soundsOnPass` for the counted pass it would start on, with the seed of the provided engine's scheduler.
- `VersionList`: `onRestore` was called for a restore the arbiter dropped under a lock. It is called when the restore was applied or waits.
- `useInfo`, `InfoView`: a control taken away with no press on it (erased by the agent, or by a button outside the described part) stayed described until the pointer next moved. The view reads again when the page under it gains or loses an element, and starts from nothing said when the element its `root` names is mounted again.
- Stylesheet: `.lm-device__notice` read `--lm-text-muted`, which nothing declares; it reads `--lm-muted`.
