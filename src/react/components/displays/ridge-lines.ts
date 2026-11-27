// The display of Ridge Lines: the three rows of hills a note's wave is the
// outline of, and the overtones that outline has.
//
// Above, one cycle of the newest note as a landscape against the light. The row
// in front stands still; the middle one comes round Repeats times and the last
// a few more, and both slide past at the speed of Travel, where the device says
// they stand now. The line along the top is what is heard: the outline with its
// corners rounded by Penumbra, and behind it, thinner, what the other eye sees.
// The sun stands as low as Sun and throws the outline's shadow along itself;
// Wind blows across the sky. The sun can be dragged, and so can the point at
// the right, which lifts the rows behind (Height).
//
// Below, the overtones of that note by their number, each in the tone of the
// row it comes from most: half the ink for the row in front, the accent for the
// middle one, the whole ink for the last. Two dots show where the bands of the
// rows behind lie: as the rows pass, the bands climb and sink, and that is the
// glide that is heard. They fall with the note's own level.
//
// The arithmetic is in `ridge-lines-rows.ts` and `ridge-lines-overtones.ts`.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  fillTo,
  gainToDb,
  ground,
  handle,
  rule,
  text,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, meanOutShare, pitchName } from './instrument-parts'
import { REST, newestNote, type RidgeState } from './ridge-lines-note'
import {
  ridgeBand,
  ridgeOvertones,
  ridgeShadow,
  ridgeStill,
  type RidgeNote,
  type RidgeOvertones,
} from './ridge-lines-overtones'
import {
  RIDGE_FAR,
  RIDGE_NEAR,
  RIDGE_POINTS,
  ridgeFar,
  ridgeLift,
  ridgeNear,
  ridgeRock,
  ridgeSightless,
  type Ask,
} from './ridge-lines-rows'

type Size = Pick<DisplayView, 'width' | 'height'>

/** The sky is the ink, so far from white. */
const SKY = 0.84
/** Points of the cycle from one corner of a drawn line to the next. */
const STEP = 2
/** Ground under the lowest valley, and the height of the picture in heights of a hill. */
const GROUND_PX = 6
const TALL = 1.72
/** The scale of an overtone, dB. */
const OVER_TOP_DB = 3
const OVER_FOOT_DB = -42
export interface RidgeLayout {
  head: { left: number; right: number; baseline: number }
  scene: Box
  over: Box
  foot: Box
}

export function ridgeLayout(size: Size): RidgeLayout {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const foot: Box = { x: box.x, y: box.y + box.h - 4, w: box.w, h: 4 }
  const tall = Math.round(box.h * 0.22)
  const over: Box = { x: box.x, y: foot.y - 3 - tall, w: box.w, h: tall }
  const top = box.y + 12
  return {
    head: { left: box.x, right: box.x + box.w, baseline: box.y + 8 },
    scene: { x: box.x, y: top, w: box.w, h: over.y - 3 - top },
    over,
    foot,
  }
}

/** Where a height stands in the landscape; much rock makes every hill smaller. */
export function ridgeY(ask: Ask, height: number, scene: Box): number {
  const unit = (scene.h - GROUND_PX) / (TALL * (1 + 0.9 * ridgeRock(ask)))
  return scene.y + scene.h - GROUND_PX - height * unit
}

/** Where the sun stands: high and to the right, or low in the valley at the left. */
export function ridgeSun(sun: number, scene: Box): Point {
  return [scene.x + scene.w * (0.74 - 0.6 * sun), scene.y + 8 + (scene.h - 8 - GROUND_PX - 4) * sun]
}

/** A place by chance, the same every time. */
const speck = (k: number): number => {
  const x = Math.sin(k * 12.9898 + 7.3) * 43758.5453
  return x - Math.floor(x)
}

function drawSky(frame: DisplayFrame<RidgeState>, ask: Ask, scene: Box, live: boolean): void {
  const { ctx, colours } = frame
  fillRect(ctx, scene, colours.ink, SKY)
  const [x, y] = ridgeSun(ask('sun'), scene)
  dot(ctx, x, y, 9, colours.accent, { alpha: 0.35 })
  dot(ctx, x, y, 6, colours.accent, { alpha: live ? 1 : 0.85 })
  // Wind: streaks of air, longer and more of them as it grows.
  const wind = ask('wind')
  for (let k = 0; k < Math.round(wind * 14); k++) {
    const way = speck(2 * k) + (live ? frame.now * (0.05 + 0.12 * speck(3 * k + 1)) : 0)
    const left = scene.x + (way - Math.floor(way)) * (scene.w + 16) - 16
    const up = scene.y + 3 + speck(2 * k + 1) * scene.h * 0.55
    rule(ctx, left, up, left + 4 + 10 * wind, up, { colour: colours.plate, alpha: 0.4 })
  }
}

function drawScene(
  frame: DisplayFrame<RidgeState>,
  ask: Ask,
  scene: Box,
  rows: readonly Float64Array[],
  live: boolean,
): void {
  const { ctx, colours, state } = frame
  const [seen, other] = state.sight
  const line = (heights: Float64Array, less = 0): Point[] => {
    const points: Point[] = []
    for (let i = 0; i <= RIDGE_POINTS; i += STEP)
      points.push([
        scene.x + (i / RIDGE_POINTS) * scene.w,
        clamp(ridgeY(ask, heights[i % RIDGE_POINTS] - less, scene), scene.y - 200, scene.y + 300),
      ])
    return points
  }
  // A soft edge lifts the whole outline, which is not heard: it is drawn where the rows are.
  let lifted = 0
  for (let i = 0; i < RIDGE_POINTS; i++)
    lifted += seen.outline[i] - Math.max(rows[0][i], seen.middle[i], seen.far[i])
  lifted /= RIDGE_POINTS
  const foot = scene.y + scene.h
  const outline = line(seen.outline, lifted)
  clipped(ctx, scene, () => {
    drawSky(frame, ask, scene, live)
    if (ask('eyes') > 0)
      trace(ctx, line(other.outline, lifted), { colour: colours.plate, width: 1, alpha: 0.6 })
    fillTo(ctx, line(seen.far), foot, colours.plate, 0.32)
    fillTo(ctx, line(seen.middle), foot, colours.plate, 0.5)
    fillTo(ctx, line(rows[0]), foot, colours.plate, 1)
    // The shadow: the outline again a part of a cycle on, as dark as it is taken off, where it
    // lies on the hills.
    const { dark, length } = ridgeShadow(ask('sun'))
    const on = outline.length - 1 - Math.round((length * RIDGE_POINTS) / STEP)
    const thrown = outline.map(([x, y], n): Point => {
      const from = outline[(n + on) % (outline.length - 1)][1]
      return [x, Math.max(from, y)]
    })
    trace(ctx, thrown, { colour: colours.ink, width: 1, alpha: 0.6 * dark })
    trace(ctx, outline, { colour: colours.plate, width: live ? 3 : 1.5 })
    if (live) trace(ctx, outline, { colour: colours.accent, width: 1.25 })
  })
}

/** How tall an overtone stands. */
export const ridgeTall = (amplitude: number, box: Box): number =>
  clamp((gainToDb(amplitude) - OVER_FOOT_DB) / (OVER_TOP_DB - OVER_FOOT_DB), 0, 1) * box.h

function drawOvertones(
  frame: DisplayFrame<RidgeState>,
  ask: Ask,
  box: Box,
  note: RidgeNote,
  over: RidgeOvertones,
  live: boolean,
): void {
  const { ctx, colours } = frame
  const bars = box.w > 180 ? 40 : 24
  const cell = box.w / bars
  const foot = box.y + box.h
  const inner: Box = { ...box, y: box.y + 4, h: box.h - 4 }
  rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })
  for (let h = 1; h <= Math.min(bars, over.count); h++) {
    const tall = ridgeTall(over.all[h] * note.level, inner)
    const [near, middle, far] = [over.near[h], over.middle[h], over.far[h]]
    const behind = Math.max(middle, far) > near
    const mine = behind && middle >= far
    fillRect(
      ctx,
      { x: box.x + (h - 1) * cell + 0.5, y: foot - tall, w: cell - 1, h: tall },
      mine && live ? colours.accent : colours.ink,
      behind ? INK.trace : INK.back,
    )
  }
  for (const row of [1, 0] as const) {
    const at = ridgeBand(ask, note.hz, row, note.turns[row])
    const x = Math.min(box.x + (at - 0.5) * cell, box.x + box.w - 2)
    dot(ctx, x, box.y + 1, 2, row === 0 && live ? colours.accent : colours.ink)
  }
}

export function ridgeHandles(view: DisplayView): readonly DisplayHandle[] {
  const ask: Ask = (name) => view.value(name)
  const { scene } = ridgeLayout(view)
  const [x, y] = ridgeSun(ask('sun'), scene)
  const [high, low] = [ridgeSun(0, scene)[1], ridgeSun(1, scene)[1]]
  const crest = (height: number): number =>
    ridgeY(ask, 1 + ridgeLift((name) => (name === 'height' ? height : ask(name))), scene)
  const way = crest(1) - crest(0) || 1
  return [
    {
      key: 'sun',
      name: 'Sun',
      x,
      y,
      drag: (_x, to) => ({ sun: clamp((to - high) / (low - high), 0, 1) }),
      wheel: (steps) => ({ sun: clamp(ask('sun') - steps * 0.02, 0, 1) }),
      reset: () => ({ sun: view.spec('sun')?.default ?? 0.06 }),
    },
    {
      key: 'height',
      name: 'Height',
      x: scene.x + scene.w - 4,
      y: crest(ask('height')),
      drag: (_x, to) => ({ height: clamp((to - crest(0)) / way, 0, 1) }),
      wheel: (steps) => ({ height: clamp(ask('height') + steps * 0.02, 0, 1) }),
      reset: () => ({ height: view.spec('height')?.default ?? 0.6 }),
    },
  ]
}

const ridgeLines = plateDisplay<RidgeState>({
  place: 'window',
  columns: 2,
  params: [
    ...['near', 'far', 'repeats', 'height', 'travel', 'parallax', 'penumbra', 'sun', 'jag'],
    ...['eyes', 'ground', 'tone', 'glow', 'body', 'wind', 'vibrato', 'sustain'],
  ],
  live: { meters: true, signal: true, notes: true },
  info: 'One cycle of the newest note as three rows of hills; the line along their top is what is heard. Drag the sun for Sun, the point at the right for Height. Below, its overtones by number, each in the tone of its row, with a dot where the band of each sliding row lies.',
  init: () => ({
    still: null,
    sight: [ridgeSightless(), ridgeSightless()],
    middle: null,
    far: null,
    heard: [],
    shown: 0,
  }),
  draw(frame) {
    ground(frame)
    const ask: Ask = (name) => frame.value(name)
    const { state } = frame
    const at = ridgeLayout(frame)
    const played = newestNote(frame, ask)
    const note = played ?? REST
    const live = played !== null
    state.still = ridgeStill(ask, state.still)
    const over = ridgeOvertones(ask, state.still, note, frame.sampleRate, state.sight)
    const names = `${RIDGE_NEAR[ridgeNear(ask)]} before ${RIDGE_FAR[ridgeFar(ask)].toLowerCase()}`
    text(frame, names, at.head.left, at.head.baseline)
    if (live) text(frame, pitchName(note.hz), at.head.right, at.head.baseline, { align: 'right' })
    drawScene(frame, ask, at.scene, state.still.rows, live)
    drawOvertones(frame, ask, at.over, note, over, live)
    for (const point of ridgeHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 2.5 })
    levelFoot(frame, at.foot, meanOutShare(state, frame, 1))
  },
  handles: (view) => ridgeHandles(view),
})

export const RIDGE_LINES_FACES: Readonly<Record<string, PlateFace>> = {
  'ridge-lines': {
    display: ridgeLines,
    face: ['near', 'far', 'travel', 'height'],
    labels: { eyes: 'Eyes' },
    sections: [
      ['near', 'far', 'repeats', 'height', 'travel', 'parallax'],
      ['penumbra', 'sun', 'jag', 'eyes', 'ground', 'tone'],
      ['glow', 'body', 'wind', 'company', 'vibrato'],
      ['attack', 'decay', 'sustain', 'release', 'volume'],
    ],
  },
}
