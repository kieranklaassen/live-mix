---
'@kieranklaassen/live-mix': patch
---

One piece rendered twice off the clock is one file: `AudioTrack` leaves a voice whose source has ended in the graph when its context is an `OfflineAudioContext`.

A voice that ends is taken out of the graph when the page hears `ended`. On a device that is as it should be. In an offline render the page's own thread hears it at whichever block the render has reached by then, which is another block every time, and a voice unwired in the first blocks after its end loses what its low-pass still rings with. Two renders of one score could so differ by up to some fifty steps of 24 bits for a few samples where a sound ends, far below what is heard and enough that two files were not the same bytes. In a render the voice now stays where it is, silent, until the track is disposed. Nothing changes on a live context.
