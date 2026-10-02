---
'@kieranklaassen/live-mix': minor
---

A seed, counted passes and chance on a clip, so what a piece leaves to chance plays the same way every time.

- `Clip.chance` (0 to 1, absent = 1): how likely a clip is to sound each time its start comes round. The scheduler draws once per clip and counted pass from its seed (`soundsOnPass(clip, pass, seed)`), and on a pass a clip sits out it is neither started nor entered partway. `clip.add` and `clip.update` carry it; 1 is written as none.
- `Transport.pass()`, `passOf(iteration)` and `setPass(pass)`: the counted pass, 0 on the first time through and one more each time the loop comes round. A pause, a seek and a loop change keep it (where `iteration` is new after every re-pin), `stop()` goes back to 0, and `setPass` is a seek to where the transport already is.
- `Scheduler.seed`, `setSeed(seed)` and `sounds(clip, iteration?)`; `SchedulerOptions.seed`. A new seed while playing puts the clips left to chance in step at once.
- `transport.seed` in a score (optional field of format 3, absent = 0) and the `transport.seed` operation, which the renderer hands to the scheduler; the agent registry has it as `transport_seed`.
- `seededUnit(seed, ...parts)`, `seededRandom(seed, ...parts)`, `clipChance` and `normaliseSeed` for a host's own seeded choices.
