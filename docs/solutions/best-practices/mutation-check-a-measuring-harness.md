---
title: Take each trait out of the device and see that its harness fails
date: 2026-10-02
category: best-practices
module: spec device harnesses (cpp/test)
problem_type: best_practice
component: testing_framework
severity: medium
applies_when:
  - A native harness is the only listener a device has
  - A check holds an event against "the largest sample step the sound makes anyway"
  - A check asks that one thing arrives after another
  - A device has an optional voice or mode the level and aliasing checks leave switched off
tags: [harness, mutation-testing, click-test, max-step, tolerances, spec-device]
---

# Take each trait out of the device and see that its harness fails

## Context

A spec device ships with a native harness that measures what makes it the instrument it is, because nobody can listen where it is built. The Horns harness had dozens of such checks and passed. Review then made 38 one-line changes to the device, each removing one trait, and ran the harness against every one. Twenty passed. Three were code with no audible effect; seventeen were traits the harness claimed to measure, or should have, and did not:

- the brightness lag on the way up, and the quick fall on the way down
- the 2 ms fade of a stolen voice (a one-sample cut passed)
- the 30 ms crossfade between bells on a Type change (an instant swap passed)
- the per-sample smoothing of the levelling gain, and of each player's level
- the old voice of a re-struck key being let go, and a key released while the voice it stole was still fading (the mutation left a stuck note)
- the harmony voice's own band limit, its share of the power, and its levelling after the interval flips
- the soft clip, the note range clamp, the lip hiss, the wandering pressure, the mirrored sections

Every one of those checks read well and printed a plausible number. The numbers were plausible for the mutated device too.

## Guidance

Before trusting a harness, remove each trait from the device, one line at a time, on a scratch copy, and run the harness. A trait whose removal passes is not measured. Then measure the quantity on both versions and put the tolerance between them.

Three patterns accounted for almost all of the gaps.

**A click check on the raw sample step is blind under a bright tone.** `max_step` (`cpp/test/support/test_kit.h:231`) returns the largest difference between neighbouring samples. A bright or beating sound makes large steps anyway, and a cut-off voice or a filter swapped at once adds a step of the same order. The third difference separates them: a band-limited tone leaves almost nothing in it and a discontinuity leaves about its own size. Use soft, low, nearly pure notes for the test, and several trials at different moments so the phase of the cut is not a matter of luck.

```cpp
// cpp/test/horns_test.cpp:232
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}
```

Measured on Horns, as a ratio to the steady sound's own value:

| Event                                                     | `max_step`, device / mutant | `kink`, device / mutant |
| --------------------------------------------------------- | --------------------------- | ----------------------- |
| Voice stolen (2 ms fade / one sample)                     | 0.66 / 1.78                 | 3.1 / 103               |
| Type switched (30 ms crossfade / at once)                 | 1.16 / 1.16                 | 1.2 / 25                |
| Blow dropped under a muted note (gain smoothed / stepped) | 0.64 / 1.8                  | 0.33 / 11               |
| Section joining a soft low note (ramped / stepped)        | 0.9 / 0.9                   | 0.83 / 52               |

**"B arrives after A" needs a threshold above what happens without the trait.** The lag check asked for harmonics 5 to 8 to reach half level at least 10 ms after the fundamental. The envelope alone puts them 15 to 33 ms behind, because brightness rises with the envelope whether or not it lags. With the lag they are 36 and 94 ms behind; the thresholds are 25 and 60 ms now (`cpp/test/horns_test.cpp:474`).

**Checks that only run with an optional voice off say nothing about it.** Level and aliasing were measured with Harmony at centre. The harmony voice has its own brightness cap, power sharing and level table; none of the three was covered until the same sweeps ran with Harmony at both ends (`cpp/test/horns_test.cpp:968`, `:1027`).

Two smaller ones: the conformance pass does not notice a missing `kit::soft_clip` or a missing note clamp unless the device happens to exceed its `max_peak`, so assert both directly; and a behaviour that only prevents something (a stuck note) needs a test that tries to cause it.

## Why This Matters

The harness is the acceptance test for the sound. A tolerance that passes with the trait removed protects nothing: the next change to the device can lose the lag, the fade or the clip and stay green. The recipe (`docs/recipes/adding-a-spec-device.md`, "The harness") asks for "a click test (`max_step`)"; on a bright instrument that check passes whatever the device does.

The cost is small. The Horns harness compiles in three seconds and runs in fifteen, so 38 mutations took about ten minutes, and a `sed` line per mutation is enough.

## When to Apply

- When a device's harness first passes, before it is called done.
- When a check's printed number looks comfortable: comfort is what a blind check produces.
- When adding a smoothing, fade, clamp or guard: write the mutation first and watch the new check fail on it.
- Not for code that cannot be heard. Three survivors were left alone on Horns: snaps on wake that a 0.1 s idle hold already makes unreachable, a comb cleared at note start, and a table rebuilt by hand that the stale flag rebuilt anyway (that one was deleted).

## Examples

A mutation runner needs nothing but a scratch copy of `cpp/`:

```bash
# mut.sh <name> <file> <sed-expression>, run from a scratch dir holding a copy of cpp/
src=/path/to/repo/cpp/devices/horns
cp $src/*.h cpp/devices/horns/
cp /path/to/repo/cpp/test/horns_test.cpp cpp/test/
sed -i -E "$3" cpp/devices/horns/$2
diff -q cpp/devices/horns/$2 $src/$2 >/dev/null && echo "[$1] mutation did not apply"
g++ -std=c++17 -O2 -fno-exceptions -fno-rtti cpp/test/horns_test.cpp -o m_$1 && ./m_$1 > m_$1.out
echo "[$1] exit=$?"; grep FAIL m_$1.out | head -3
```

```bash
./mut.sh nolag   horns.h 's/\(wanted > a \? rise_ : fall_\)/fall_/'
./mut.sh nosteal horns.h 's/kStealSeconds = 0\.002f/kStealSeconds = 0.00002f/'
./mut.sh noclip  horns.h 's/kit::soft_clip\(left \* volume\)/(left * volume)/'
```

Check that every mutation applied (a `sed` that matches nothing passes the harness for the wrong reason), and restore the headers before measuring anything else in the scratch copy: a probe built against the last mutant reports that mutant's numbers.

## Related

- `docs/recipes/adding-a-spec-device.md`, "The harness": the checks a device must carry.
- `cpp/test/horns_test.cpp`: the checks named above, under "no clicks (R12)".
