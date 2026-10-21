---
'@kieranklaassen/live-mix': minor
---

The steady clock follows a rate. `steadyClock().read(reading, now, rate)` takes the rate the clock it reads is played at: between readings the steady time moves by `rate × elapsed`, and the lead it may run ahead of a reading is 10 ms times the rate. A change of rate alone is not a jump, so 1.5x to 2x glides; a seek is still taken at once at any rate. With no rate given it is 1 and the times are unchanged. Nothing in the motion folder reads a clock: the caller hands it the rate as it hands it `now`. Checked by the motion unit tests only; not yet watched in a video editor's preview played fast on a Mac.
