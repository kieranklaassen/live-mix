---
'@kieranklaassen/live-mix': patch
---

The visuals come in with the sound, and how far apart the two are can be measured (`./visuals`).

- A level the picture follows (each kind of sound, the mix, the sixteen bands, the live input) comes up to what it reads in about 30 ms and falls back in about 120 ms. It rose and fell in 120 ms alike, so a sound was a fifth of a second in before its picture was most of the way there. It also follows by the time that really went by: a frame longer than a tenth of a second was taken for a tenth, so a page that painted seldom followed the music slower still. `time` and `travel` still take no frame to be longer than that.
- A style placed for a stretch of beats is all there an eighth of a beat after the stretch starts, where it came in over a whole beat: half a second at 120 beats a minute, a second at 60. It still goes out over its last beat, and a bend is still eased over a beat at either end.
- The ear evens each reading of the spectrum with the one before by 0.4, where it was 0.55, and `ear.read(agoSec)` answers what it read that long ago (it keeps half a second): for an output that takes long, where the picture would run ahead of what is heard. `outputLatencySec(context)` says how long the output takes as far as the browser knows.
- `sendVisuals` takes `every: (turn, ms) => stop`, the pace its frames go at, the page's own `setInterval` where nothing is said. A browser slows the timers of a covered page to one a second, and the picture on a second screen then follows a second late; a host hands over a pace kept in a worker.
- `SyncScope` measures how far one trace is behind another as they run: levels are put down on one clock, and `behind(trace, against, now)` lays the rises of one over the rises of the other and says how far apart they fit best and how well; `rate` and `longest` say how often a trace was put down and the longest it went without, which for a picture is how often it is painted. `hearTrace(context, master, clock)` puts down the sound for it, every 5 ms at the time it leaves the speakers, and `lightOf(canvas)` says how lit a picture is.

A picture drawn with this build is not the same frame for frame as one drawn with the build before: it rises sooner, and a style on a stretch is there at its start.
