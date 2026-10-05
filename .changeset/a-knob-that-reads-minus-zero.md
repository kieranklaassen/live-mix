---
'@kieranklaassen/live-mix': patch
---

What a knob or a fader reads, and what the info view says a double-click does:

- No minus before a zero. `formatControlValue` wrote "-0.00" for −0.004,
  "-0.0 dB" for −0.04 dB and "-0.0 ms" for −0.04 ms: a tone or a pan a hair
  under its centre read as minus nothing. A value that rounds to zero at the
  decimals printed reads "0.00", "0.0 dB", "0.0 ms". Every value that is
  printed as something reads as before, "+3.0 dB" too.
- A frequency that is printed as a thousand is said in kilohertz.
  `formatControlValue(999.6, 'Hz')` and `hzText(999.6)` gave "1000 Hz" where
  1000 gives "1.00 kHz" and "1 kHz"; the unit is now chosen by the number
  printed.
- A unit the formatter does not know is printed with the decimals of the step
  the value moves in, two at the most: `formatControlValue` takes the step in
  its options (`{ step }`), `Knob` and `Fader` give it theirs, and
  `formatParamValue` gives the step the parameter's knob turns in
  (`paramStep`). A lattice's degree reads "1200 ct" where it read
  "1200.00 ct", a phase "90.0 deg". A value that stands between two steps (a
  fine key, a preset's 386.31 ct) keeps its two decimals, and so does a value
  with no step. The units the formatter knows are printed as before.
- A knob that carries a device's own words names no value for a double-click.
  A hosted plug-in words the value it holds now, so the info view said a
  double-click "returns it to 9.6 s" with 9.6 s the present value. `Knob`
  takes `formatPresentOnly` for a `format` of that kind, `DevicePlate` and
  `DevicePanel` set it on such a knob, and the line then reads "returns it to
  its default". `controlGestureInfo` says the same when it is given no
  `reset`.
