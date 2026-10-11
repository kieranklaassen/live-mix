---
'@kieranklaassen/live-mix': patch
---

A motion entry (`./motion`): how a layer of a picture arrives, leaves and moves between, as plain functions of time. It is Cutroom's motion engine, moved here whole so other projects can use it; `docs/motion.md` documents it.

- `resolveLayerMotion` and `motionAt` (and `layerMotionAt` for a single read): nine values for a layer at a time — `x`, `y`, `scale`, `rotation`, `opacity`, `blur`, `reveal`, `offsetX`, `offsetY` — from its rest pose, its keyframes and the preset each side plays. `motionIssues` says what is wrong with a stored motion.
- Presets: `pop`, four slides, `fade`, `scale`, `blur`, `typeOn` and `none`, each with an in and an out (`PRESETS`, `PRESET_NAMES`, `presetPose`, `presetDuration`). Their numbers are pinned by golden tables.
- Easing: named curves, a bezier or a spring (`curveOf`, `bezierOf`, `cubicBezier`, `isEasing`, `EASING_NAMES`). Springs in closed form, by bounce or by stiffness, damping and mass, landing on exactly 1 (`springValue`, `springDuration`, `springCurve`, `bounceCurve`, `dampingRatio`).
- Keyframes on six properties (`valueAt`, `keyframeTrack`, `trackValue`, `withKeyframe`, `withoutKeyframe`, `keyframeAt`, `keyframeTimes`).
- `MotionProfile` (`motionProfile`, `NEUTRAL_PROFILE`): a theme's duration scale, overshoot and ease over every preset. `shutterTimes` for motion blur. `steadyClock`, which smooths a clock that moves in steps, such as the audio clock a picture follows.
- The entry imports nothing, names no DOM, Web Audio or WebGL type and keeps no value between calls: `tsconfig.motion.json` compiles it without the DOM, and `pnpm pack:check` fails when its built file imports anything.
