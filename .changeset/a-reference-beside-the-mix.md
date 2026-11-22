---
'@kieranklaassen/live-mix': patch
---

A reference beside the mix: the engine can play the tracks' own sound at the output in place of the mix.

`engine.setHeard({ source, mixGain, referenceGain })` says what is heard at the output, and `engine.heard` reads it. `source` is `'mix'` or `'reference'`, and what is left out stays as it was. The reference is the sum of what every audio track (clip tracks and stretch tracks) hands its strip, so no strip, group, bus, return or master is in it: a mute, a solo, a level, a pan and a chain leave it as it is. The mix and the reference each pass a gain of their own at the output, cross over 20 ms (`HEARD_CROSS_SECONDS`) while both keep playing, and are heard at `mixGain` and `referenceGain`. Those gains are after the master's meters, its taps and a recorder on the master, and no render has them: `renderOffline` and `renderScore` build an engine that never makes a reference.

The reference is held back by one delay, set to the latest arrival of the latency report when it is made and after each `engine.alignLatency()`, so it stays in time with the mix as devices that take time come onto a chain and off it, for a host that lines up after such a change. It holds a second at most.

Nothing is made until the first `setHeard`, so the default graph and its order of nodes are as they were. The first call makes two gains at the output, a sum and a delay, and plays the master into the mix's gain.

New on the parts: `OutputRouter.heard`, `OutputRouter.heardGains()` and `OutputRouter.setHeard()`, with the types `Heard`, `HeardSource` and `HeardGains`; `MasterBus.playInto(node)`, which plays the master's last stage into another node in place of the output; and `ChannelStrip.tapSources(node)`, which lets a node hear what goes into a strip, before its trim, for as long as the strip lasts.

Checked on the recording stand-ins in Node. Not tried in a browser, and nothing was listened to (docs/concepts/mixer.md).
