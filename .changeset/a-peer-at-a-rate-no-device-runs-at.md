---
'@kieranklaassen/live-mix': patch
---

`LinkAudioReceiver`: a block of a peer's channel that says a sample rate above 768000 Hz is not read. A peer says its channel's rate itself, the plug-in host passes it on as it is, and the playout keeps two seconds of a stream at the stream's own rate: a block that said four thousand million had the playout ask for 32 GB in the audio worklet, which threw and left it half set up. 768000 Hz is the most the host takes from a page that sends, so every rate a page can send can still be heard.
