---
'@kieranklaassen/live-mix': minor
---

A console fader and meter for the kit (`./react`), and the grounds and depth a workstation is drawn with.

- `Fader` takes `look="cap"`: a slot with a cap that rides it, grip lines and a centre line at the value, in place of the filled bar. A value sits where it did, so a scale drawn beside the fader still fits.
- `Meter` takes `look="segments"`: bars lit in segments in three zones that stay fixed to the scale (`--lm-meter` up to `warmDb`, a new prop with a default of -12, `--lm-meter-warm` up to `hotDb`, `--lm-meter-hot` above), and a clip lamp that stays lit until the meter is clicked.
- `heldPeak(previous, db, now, holdMs)` is the meter's peak-hold rule as a function, for an app that prints the held peak as a number.
- The stylesheet derives fifteen tokens from each theme's own (`--lm-edge`, `--lm-bar`, `--lm-pane`, `--lm-head`, `--lm-line`, `--lm-line-strong`, `--lm-hair`, `--lm-slot`, `--lm-well`, `--lm-cap`, `--lm-cap-edge`, `--lm-meter-warm`, `--lm-shade`, `--lm-shade-in`, `--lm-light`), with formulas of their own for the dark themes. `LM_TOKENS` and every theme are unchanged.
- Three classes use them: `lm-pane` (the kit inside stands on the pane's ground, with quieter lines), `lm-pane--raised` and `lm-well`.
- Both looks are opt-in: a `Fader` or `Meter` without `look` is drawn as before.
