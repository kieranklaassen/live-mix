---
'@kieranklaassen/live-mix': patch
---

The agent layer: a batch whose children went unchecked, a write that waited and was nobody's to undo, and the lookups that every object answers.

- `validateSchema`: a `required` key that every object answers to (`constructor`, `valueOf`) counted as given when it was not. The value's own keys are asked.
- `validateSchema`: a list with a place that holds nothing (`[1, , 3]`) went past its `items`; every place is checked.
- `validateSchema`: a value JSON cannot carry (`undefined`, a function, a symbol, a bigint) was taken for a `null` and went past a schema that allows one. Where a type is asked for, it is refused and named by what it is.
- `AgentController.call('batch', …)`: a batch's children were known by their `type` alone. A child with an argument missing or of the wrong kind reached the rails: a `strip.set` with no `value` left no number in the fader's slew budget, so every later move of that fader failed, a `value` of `null` set the level to 0 and answered ok, and a `batch` among them with no `ops` made the call throw with no audit entry. Each child is held to the schema of its own tool, a batch inside a batch too, and the call fails with `invalid_args` naming the place (`ops[1].value`).
- `Rails.rateLimitFor`: a tool named as every object answers (`constructor`), or `default`, was given that member or the default row and not the limit its own spec declares.
- `device_set_param`, `device_set_params`: a parameter named `constructor` (or `toString`) was taken for one the device has and failed with a range of `undefined..undefined`. Only the device's own parameters have a range.
- `Rails.slewGain`: a move from or to what is no number spent the budget and left no number in it. Such a move passes unslewed and spends nothing.
- With an `Arbiter`: a write that waited behind a hold and then landed was in no call's audit entry, so `undo` after it took back the call before it and the landed write stayed. The controller listens to the arbiter and adds a landed write, and its inverse, to the entry of the call that asked for it.
- With an `Arbiter`: a call that applied some of its writes and left one waiting behind a hold looked finished to `undo`, which took back only what had applied and marked the call undone; the waiting write then landed on an undone call and stayed, past an `undo` that answered "already undone". Such a call carries what it still waits for (`entry.waiting`) and `undo` refuses it until the write lands or is let go.
- With an `Arbiter`: an `undo` whose own write waited and was then dropped (stale, superseded, cancelled) had marked its call as undone, and the call could not be undone again. The mark is taken off when the undo applied nothing.
- `useArbiter`, `useArbiterTarget`, `useVersions`: a hook given another arbiter, another target or another history at the same revision count went on returning the one before. The source and the target are part of what is compared.
- `useArbiterTarget`: a target in hand stayed held against every agent write when the control was given another target or left the page before `release`. The hook lets go of its own touch on both, as `useStrip` and `useDevice` do.
