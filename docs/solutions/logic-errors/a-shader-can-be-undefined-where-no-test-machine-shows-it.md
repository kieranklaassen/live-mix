---
title: A shader can call a function outside what it is defined for, and no test machine shows it
date: 2026-11-27
category: logic-errors
module: visuals
problem_type: logic_error
component: visuals
severity: medium
symptoms:
  - 'A preset is black or speckled on one graphics card and right in software rendering'
  - "The compiler says that a constant has no value once a style's own numbers are written into its shader"
root_cause: logic_error
resolution_type: code_fix
tags: [visuals, shaders, glsl, smoothstep, presets]
---

# A shader can call a function outside what it is defined for, and no test machine shows it

## Problem

A preset's own numbers are written into its style's shader as plain numbers
(`withOwn`), which is what makes a branch that is not taken cost nothing: the
same branch on a uniform cost two to three times as much, since software
rendering runs both sides. But with the numbers written in, the compiler works
out whole expressions beforehand. `smoothstep(0.4, 0.1, x)`, a root of less
than nothing and a division by nothing are undefined in GLSL. Run on a
processor the first gives the fall one would expect. Folded by a compiler, or
run on a card, it may give anything.

About 250 of the 2,410 presets called one so, after each had been measured,
looked at by two people, and compiled with no warning.

## Why looking does not find it

Headless Chromium draws in software, where a turned `smoothstep` looks right
and `pow` of a negative number is a fair guess. The compiler's warnings cover
only what folds to a constant.

## Solution

- `smoothstep(high, low, x)` is `1.0 - smoothstep(low, high, x)`. The pictures
  are the same to 1 or 2 of 255. Where an edge can lie either side of the
  other, write the step out: `t = sat((x - a) / d)` with `d` kept off nothing,
  then `t * t * (3.0 - 2.0 * t)`.
- `pow(x, 2.0)` of a difference is `pow(abs(x), 2.0)` or `x * x`.
- What goes under `sqrt` or into `log` is held with `max`.
- To find them, replace each of these functions in the style's text with a twin
  that marks the pixel when its arguments are outside what it is defined for,
  hand the twin `__LINE__`, draw every preset in a few scenes and read the line
  numbers back out of the colours. That found every one in ten minutes.

## Prevention

`src/visuals/__tests__/styles.test.ts` fails a shader with a `smoothstep` whose
edges are plain numbers the wrong way round, but for 34 of the older styles
that have always been drawn so. Edges that are worked out are not seen by it.
