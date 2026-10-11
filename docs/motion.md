# Motion

`@kieranklaassen/live-mix/motion` animates the layers of a picture: a title, a caption, a clip in a frame. A layer arrives and leaves with a preset and can be keyframed in between. Every animated value is computed from the layer's motion fields and a time, and from nothing else. That is what lets a preview, a still taken at one moment and an export stepping frame by frame show the same motion.

The entry is plain functions. It imports nothing from the rest of the library, names no DOM, Web Audio or WebGL type, and keeps no value from one call to the next, so it runs in a browser, in a worker, in Node and on a server alike, and loading it loads none of the audio engine. It draws nothing: it gives nine numbers for a layer at a time, and the host's renderer places, scales, turns, fades and blurs the layer by them.

It was written for Cutroom, a video editor built on this library, and moved here whole so that other projects can use it. Where the numbers come from is in [Checked against other systems](#checked-against-other-systems).

## Using it

```ts
import { layerMotionAt, motionAt, resolveLayerMotion } from '@kieranklaassen/live-mix/motion'

const length = layer.end - layer.start
const resolved = resolveLayerMotion(layer.motion, { length, rest, profile }) // once per change
const values = motionAt(resolved, time - layer.start) // once per frame

layerMotionAt(layer.motion, time - layer.start, { length, rest }) // both at once, for a single read
```

`rest` is `{ x, y, rotation, opacity }`: where the layer is when nothing animates it. `resolveLayerMotion` does the work that does not depend on the time, and `motionAt` is cheap enough for every frame. `motionIssues(value, { text })` says what is wrong with a motion read from a file, before it is drawn.

The context `resolveLayerMotion` takes:

| Field        | Holds                                                  | When left out                           |
| ------------ | ------------------------------------------------------ | --------------------------------------- |
| `length`     | How long the layer is on screen, in seconds            | Required                                |
| `rest`       | The rest pose                                          | The picture's top left, upright, opaque |
| `profile`    | The [profile](#the-profile) the layer is drawn in      | Neutral                                 |
| `characters` | How many characters the layer's text has, for `typeOn` | The shortest typed entrance             |
| `fade`       | `{ in, out }`: seconds a side with no preset fades     | 0.2 s each way                          |

## A layer's motion

A layer may carry `motion`, as a document stores it:

```json
{
  "in": { "preset": "pop", "duration": 0.45, "strength": 0.5, "bounce": 0.45 },
  "out": { "preset": "fade" },
  "keyframes": {
    "x": [
      { "time": 0, "value": 0.1 },
      { "time": 0.6, "value": 0.3, "easing": { "spring": { "bounce": 0.2 } } }
    ]
  }
}
```

| Field       | Holds                                                                                                                           | When left out                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `in`, `out` | A preset: its `preset` name, a `duration` in seconds, a `strength` from 0 to 1, and for a pop arriving a `bounce` from 0 to 0.8 | The layer fades on that side, for 0.2 s by default |
| `duration`  | Seconds the preset plays                                                                                                        | The preset's own length                            |
| `strength`  | How far from rest the layer starts, or ends                                                                                     | 0.5                                                |
| `bounce`    | How much a pop's spring bounces                                                                                                 | 0.45                                               |
| `keyframes` | Per property, a list of `{ time, value, easing }` in time order                                                                 | The property keeps its rest value                  |

## How a value is put together

Three things combine, in this order:

1. **The rest pose**: where the layer's own frame, rotation and opacity put it.
2. **Keyframes**, which replace the rest value of the property they are on.
3. **The in or the out**, which multiplies scale and opacity and adds an offset and a blur on top.

So a title can drift on keyframes and still pop in. `motionAt` returns nine values:

| Value                | What it is                                                                                          | At rest         | Keyframed |
| -------------------- | --------------------------------------------------------------------------------------------------- | --------------- | --------- |
| `x`                  | The left edge of the layer's frame, as a fraction of the output's width                             | `rest.x`        | yes       |
| `y`                  | The top edge of its frame, as a fraction of the output's height                                     | `rest.y`        | yes       |
| `scale`              | Times its size, about its frame's centre                                                            | 1               | yes       |
| `rotation`           | Degrees clockwise about its frame's centre                                                          | `rest.rotation` | yes       |
| `opacity`            | 0 to 1, with the layer's own in it                                                                  | `rest.opacity`  | yes       |
| `blur`               | The standard deviation of a Gaussian, as a fraction of the output's height                          | 0               | yes       |
| `reveal`             | How much of the layer's text has been typed, 0 to 1                                                 | 1               | no        |
| `offsetX`, `offsetY` | How far an entrance or exit has moved the layer right and down, as fractions of the output's height | 0               | no        |

"Size" is one scale about the centre, stored as a multiple: 1 for 100%. A blur's number is its standard deviation, as in CSS `blur()`. Every length is a fraction of the output, so the same motion plays at any resolution.

## Presets

Each preset has an in and an out of its own. `src/motion/presets.ts` holds the numbers, and `src/motion/__tests__/presets.test.ts` pins each at five points of the way in golden tables.

| Preset                                            | In                                                                                                                                | Out                                                                                                             | Strength `s` sets                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `pop`                                             | 0.45 s. Scale from `1 − 0.8s` to 1 on a spring with bounce 0.45. Opacity 0 to 1 in a straight line over the first 0.12 s.         | 0.20 s. Scale 1 to `1 − 0.4s` and opacity 1 to 0 on (0.4, 0, 1, 1).                                             | The start and end scales: 0.60 and 0.80 at the default |
| `slideUp`, `slideDown`, `slideLeft`, `slideRight` | 0.40 s. Offset from `0.12s` of the height to 0, arriving from behind, on (0.16, 1, 0.3, 1). Opacity 0 to 1 over the first 0.15 s. | 0.25 s. Moves on by `0.08s` of the height the same way on (0.7, 0, 0.84, 0). Opacity 1 to 0 in a straight line. | The distances: 6% in and 4% out at the default         |
| `fade`                                            | 0.30 s. Opacity 0 to 1 on (0.33, 1, 0.68, 1).                                                                                     | 0.20 s. Opacity 1 to 0 on (0.32, 0, 0.67, 0).                                                                   | Nothing                                                |
| `scale`                                           | 0.35 s. Scale from `1 − 0.16s` to 1 on (0.25, 1, 0.5, 1), with no overshoot. Opacity 0 to 1 over the first 0.15 s.                | 0.20 s. Scale 1 to `1 − 0.08s` and opacity 1 to 0 on (0.32, 0, 0.67, 0).                                        | The start and end scales: 0.92 and 0.96 at the default |
| `blur`                                            | 0.50 s. Blur from `0.024s` of the height to 0 and opacity 0 to 1, both on (0.33, 1, 0.68, 1).                                     | 0.30 s. The reverse on (0.32, 0, 0.67, 0).                                                                      | The blur: 1.2% of the height at the default            |
| `typeOn`                                          | 0.035 s a character, from 0.3 to 2 s. Characters at a steady rate, whole. Opacity 0 to 1 over the first tenth.                    | 60% of that. Characters are taken back from the end.                                                            | Nothing                                                |
| `none`                                            | Nothing: the layer is there at its start.                                                                                         | Nothing: it is gone at its end.                                                                                 | Nothing                                                |

- **A slide is named by the way it travels.** `slideUp` arrives from below and leaves upward. A slide across travels the same number of pixels as a slide down: a share of the height.
- **Opacity leads.** The time a layer takes to become solid is a share of its entrance (0.12 of 0.45 s for a pop), so it stays ahead of the landing when the length is changed.
- **A preset never plays for more than half the layer**, so an entrance and an exit never overlap.
- **A side with no preset fades**, for `fade.in` or `fade.out` seconds, 0.2 by default, on Easy Ease both ways. It is not the `fade` preset, which eases out as it arrives and in as it leaves. A layer that wants no fade either names `none`.
- **`typeOn` needs text.** `motionIssues` refuses it on a layer that has none.

Why the numbers are what they are: an out is about half its in; nothing arrives in under 0.30 s or over 0.50 s; arriving decelerates and leaving accelerates; opacity leads so the landing is seen solid; a slide is small.

`PRESETS` describes each preset for a control that lists them (what it drives, how long it plays, whether strength changes it, whether it needs text), and `presetDuration` and `presetPose` are one side of one preset on its own.

### What the pop is

Bounce runs from 0 to 0.8 and the damping ratio is 1 less the bounce. The spring settles within the entrance: its natural frequency is 4.6 over the ratio times the length while the ratio is 0.9 or less, and 6.6 over the length above that. With the defaults the layer starts at 60% of its size, is solid at 0.12 s, passes its size at 0.14 s, peaks at 1.05 at 0.20 s and is at rest by 0.45 s.

Bounce is the feel: 0.35 peaks at a scale of 1.03 and reads as crisp, 0.45 is the default, 0.55 peaks at 1.08 and reads as playful.

### Checked against other systems

The numbers were chosen, not measured. Held against what well-regarded systems publish, they sit where those systems agree:

| Here                                      | What others say                                                                                                                   | Source                                                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Entrances of 0.30 to 0.50 s               | Interfaces: 100 to 500 ms, with larger moves at the long end. Video titles: 400 to 600 ms.                                        | Nielsen Norman Group; Material Design 3 duration tokens; two motion-design references of low authority for titles |
| An out about half its in                  | An exit is shorter than its entrance: 300 ms in against 200 to 250 ms out (NN/g). This goes further, to about half.               | NN/g; Material; Carbon                                                                                            |
| Arriving decelerates, leaving accelerates | The one point every source states outright.                                                                                       | Material ("decelerate ... enter the screen"); Carbon entrance and exit easing; NN/g                               |
| A slide arrives on (0.16, 1, 0.3, 1)      | It is 83% of the way at a quarter of the time, the same as Material's emphasized decelerate; Carbon's expressive entrance is 52%. | Computed from the published curves                                                                                |
| Opacity never overshoots                  | Material keeps springs that may overshoot for position and size, and a spring that may not for opacity.                           | Material's spatial and effects springs                                                                            |
| A pop's bounce of 0.45                    | Apple calls a bounce above 0.4 exaggerated for an interface. This is a video, and a pop should read as one.                       | Apple, "Animate with springs" (WWDC 2023)                                                                         |
| A spring that takes the time it is given  | Remotion stretches a spring to a length the same way, and Apple and Motion give springs by duration and bounce.                   | Remotion `spring()`; Motion; Apple                                                                                |

Links: [Material motion tokens](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md), [Carbon motion](https://carbondesignsystem.com/elements/motion/overview/), [NN/g on animation duration](https://www.nngroup.com/articles/animation-duration/), [Animate with springs](https://developer.apple.com/videos/play/wwdc2023/10158/), [Remotion spring](https://www.remotion.dev/docs/spring), [Motion springs](https://motion.dev/docs/spring).

## Easing

An easing is how a value travels from one point to the next. As stored it is one of:

- **A name.** `linear`, `hold` (stays at the first value until the end), `easyEase` (After Effects' Easy Ease, `3p² − 2p³`), the CSS keywords (`ease`, `easeIn`, `easeOut`, `easeInOut`), the sine, quad, cubic, quart, quint, expo, circ and back families in their `easeIn…`, `easeOut…` and `easeInOut…` forms, and Material's `standard`, `decelerate` and `accelerate`. `EASING_NAMES` lists them.
- **A bezier.** `{ "bezier": [x1, y1, x2, y2] }`, as CSS `cubic-bezier()`. Each x is from 0 to 1. A y outside 0 to 1 makes the value pass its end and come back.
- **A spring.** `{ "spring": { "bounce": 0.2 } }`, or `{ "spring": { "stiffness", "damping", "mass" } }`, each above 0.

The six a control would offer first:

| Called                               | Stored as                         | Curve                                           |
| ------------------------------------ | --------------------------------- | ----------------------------------------------- |
| Linear                               | `linear`                          | A straight line                                 |
| Ease out, the default for a keyframe | `easeOutCubic`                    | (0.33, 1, 0.68, 1)                              |
| Ease in                              | `easeInCubic`                     | (0.32, 0, 0.67, 0)                              |
| Ease in and out                      | `easeInOutCubic`                  | (0.65, 0, 0.35, 1)                              |
| Spring                               | `{ "spring": { "bounce": 0.2 } }` | The spring below; 0.20 is a good default bounce |
| Hold                                 | `hold`                            | The value jumps at the keyframe                 |

`curveOf(easing)` is the easing as a function of progress, 0 to 1. A bezier is solved by a fixed number of Newton steps and by halving where the curve is too steep, so its answer depends on the progress and on nothing else.

`bezierOf(easing)` gives the four control points of an easing that is a bezier, a named curve's or the easing's own, and null for `hold` and for a spring. A curve editor draws a named curve's handles from it. `isEasing(value)` says whether a stored value is one.

### Springs

A spring is the exact response of a mass on a damped spring released from rest (`src/motion/spring.ts`). Nothing is integrated step by step, so a value needs no earlier value. The tests hold the closed form against the same spring integrated in small steps.

- `springValue(config, seconds)` is the spring in real time, and `springDuration(config)` is when it has settled.
- `bounceCurve(bounce)` and `springCurve(config)` are the spring as an easing, fitted to its segment: the segment ends where the spring has settled.

As an easing, only the damping ratio shows: 1 less the bounce, or `damping / (2 × √(stiffness × mass))`. It sets how much the curve bounces, and the segment sets how long it takes. With stiffness 170 and mass 1, a damping of 26 does not pass the value and 12 bounces.

**The exact landing.** A spring is called settled when it is within 1% of rest (`SETTLED`). Left there, a pop would jump by up to a hundredth of its travel as it came to rest. The last of the way is added in gradually, as the cube of the progress, so the curve lands on exactly 1 and the early swing is left as it is: the pop's peak stays at 1.05.

## Keyframes

- A keyframe's `time` is seconds from the layer's start, so moving a layer moves its motion with it.
- A keyframe's `value` takes the place of the layer's own value of that property.
- A keyframe's `easing` shapes the segment that **arrives** at it: "be at this value at this time, getting there like this". The first keyframe's easing is not used. Left out, it eases out.
- A spring between two keyframes takes the time between them.
- Before its first keyframe a property holds the first value; after the last, the last.
- No two keyframes of one property share a time. A keyframe is named by its property and its time, and has no id.
- Opacity is kept within 0 to 1, and scale and blur at 0 or above, where a spring passes its ends.

`KEYFRAME_PROPERTIES` lists the six properties. `valueAt(keyframes, time)` reads one list; `keyframeTrack` and `trackValue` do the same in two steps for a list read every frame. `withKeyframe` and `withoutKeyframe` return a new list with a keyframe set or taken off, in time order; `keyframeAt` and `keyframeTimes` find them. What an edit does with keyframes when a layer is trimmed or split is the host's to decide.

## The profile

A host changes the feel of every preset at once through a profile: a theme's, or a project's style.

```ts
interface MotionProfile {
  durationScale: number // multiplies how long every preset plays, a chosen length included
  overshoot: number // multiplies a pop's bounce; 0 is none
  ease: Easing | null // the curve a slide, a scale and a blur arrive on, in place of their own; null keeps each preset's own
}
```

`NEUTRAL_PROFILE` is `{ durationScale: 1, overshoot: 1, ease: null }`. `motionProfile(value)` reads whatever was stored and keeps each field that is usable, so one bad number does not lose the other two. A bare list of four numbers is read as a bezier. With an `ease`, a slide, a scale and a blur leave on the same curve played backwards.

A profile is given when a layer's motion is resolved and is never stored on a layer, so switching it restyles every layer.

## Motion blur

`shutterTimes(time, { samples, shutter, frameDuration })` gives the moments a frame is drawn at when it is blurred by motion: evenly spaced and centred on the frame's time, so a blurred layer sits where the sharp one would.

- `shutter` is the share of the frame the shutter is open: 0.5 is 180 degrees, the default (`DEFAULT_SHUTTER`).
- `samples` is how many moments are drawn: 8 by default (`DEFAULT_SAMPLES`).
- `frameDuration` is the length of a frame in seconds.

The host's renderer draws the layer at each moment and takes the mean. Because a value at a time is the same however the time was reached, the samples of one frame need nothing from the frame before.

## The steady clock

Motion is as smooth as the time it is given. A picture that follows sound reads the audio clock, which moves in the audio thread's steps. Measured in a video editor's preview at 120 Hz, it advanced by 5.3 to 13.3 ms where a frame took 8.3: up to 6.8 ms off, frame to frame.

`steadyClock()` reads such a clock and gives a time that advances with the display between readings, leans toward the reading so it never drifts, and takes a jump of more than 50 ms, a seek, at once. It is never more than 10 ms ahead of a reading, so a clock that stands still, as an audio clock does until its first sound is heard, is followed to a stop. Measured again through it, the same preview's time stays within 0.76 ms of the display's step.

```ts
const clock = steadyClock()
const time = clock.read(audioContext.currentTime, performance.now()) // each frame
clock.reset() // when the clock is started, stopped or moved
```

The clock is the one part that remembers anything, and it only decides what time it is. What is drawn at that time is still a function of the time alone. It reads no timer itself: the caller hands it `now`.

## What holds it

| Rule                                                          | Held by                                                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| It imports nothing from outside its folder and reads no clock | `src/motion/__tests__/purity.test.ts`                                                                |
| It names no DOM, Web Audio or WebGL type                      | `tsconfig.motion.json`, compiled with the ES2022 library alone as part of `pnpm typecheck`           |
| A value at a time is the same however the time was reached    | `src/motion/__tests__/layer-motion.test.ts`, to the bit, forwards, backwards and in a shuffled order |
| A preset's numbers                                            | The golden tables of `src/motion/__tests__/presets.test.ts`                                          |
| The closed-form spring is the spring                          | `src/motion/__tests__/spring.test.ts`, against the same spring integrated step by step               |
| The entry's exports                                           | `src/__tests__/public-entry.test.ts`                                                                 |

Change a preset's number together with its golden table and the table on this page.

## Known limits

- Position moves in straight segments per axis. There are no curved paths.
- Size is one scale, about the frame's centre.
- A keyframed position is a place on the picture: a layer whose frame is moved afterwards keeps its keyframed places.
- The entry draws nothing and has no React part. A renderer, a curve editor and keyframe lanes are the host's, on the functions here.
- A stagger of parts that arrive together and turning a preset into keyframes are not built.
