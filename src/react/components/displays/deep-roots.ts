// The display of Deep Roots: the keys at their pitches, and what grows down from
// them to where it meets.
//
// The picture is one scale of pitch, high at the top. A held key is a leaf at
// its pitch, drawn as Leaf has it and as large as Balance leaves it. From it the
// roots go down, each to its own pitch: straight down where it is octaves below
// its key, to one side or the other by its division otherwise, so a chord's
// roots fan out under it. Growth is seen: a root is drawn down as far as it has
// come, and its tip swells once it is there. Where the roots of several keys
// meet, or two keys make a tone between them, the lines of all of them come
// together in one tip. A root is drawn in the manner of its soil, and Grain
// breaks it up. The deepest root has the accent, with a line across as far as
// the chord has met and its partials at the right, as the soil and Root tone
// give them. The ground under Floor is filled: no root goes into it.
//
// Two points can be dragged: the one at the right is Floor, the one at the left
// is Reach, so many octaves below E5, the highest key of the chord at rest.
//
// The roots are the device's own law (`deep-roots-law.ts`), asked with the notes
// the instrument was sent; the line is at the deepest root it reports.

import {
  INK,
  clamp,
  dot,
  fillBetween,
  fillRect,
  ground,
  handle,
  hzText,
  rule,
  text,
  trace,
  type Point,
} from '../display-kit'
import { plateDisplay, type DisplayFrame, type PlateFace } from '../plate-display'
import {
  DEEP_CHOSEN,
  DEEP_FOREVER,
  DEEP_READ,
  deepFresh,
  deepGrown,
  deepKeysNow,
  deepRootsNow,
  deepSettings,
  type DeepKey,
  type DeepRoot,
  type DeepSettings,
  type DeepState,
} from './deep-roots-growth'
import {
  DEEP_HIGH_HZ,
  DEEP_REACH_FROM,
  deepFeeders,
  deepHandles,
  deepLayout,
  deepPlace,
  deepWay,
  deepY,
  type DeepLayout,
} from './deep-roots-layout'
import { DEEP_SOILS, deepPartials } from './deep-roots-law'
import { hzOfKey, levelFoot, meanOutShare, pitchName } from './instrument-parts'

/** The chord the picture shows at rest. */
const REST = [50, 57, 65, 72, 76].map(hzOfKey)
const LEVEL_SEC = 1

const LINE_WIDTH = [1.2, 1.5, 2, 1, 1.2]

/** The line of a root: dotted in sand, and broken by Grain. */
function dashOf(set: DeepSettings): readonly [number, number] | undefined {
  const gap = (set.soil === 1 ? 1.6 : 0) + 3.4 * set.grain
  return gap > 0.05 ? [set.soil === 1 ? 1 : 4 - 3.4 * set.grain, gap] : undefined
}

/** A key's leaf: a round tone, a reed, a glass rim, a breath or a plucked string. */
function leafAt(
  frame: DisplayFrame<DeepState>,
  set: DeepSettings,
  key: DeepKey,
  live: boolean,
): void {
  const { ctx, colours, height } = frame
  const { pitch } = deepLayout({ width: frame.width, height })
  const share = Math.min(1, 2 - 2 * set.balance)
  const size = 1.6 + 1.8 * share * (0.4 + 0.6 * key.gain)
  const [x, y] = [key.x, deepY(key.hz, pitch)]
  const colour = colours.ink
  const alpha = live ? Math.max(INK.rule, Math.sqrt(key.leaf)) : INK.text
  if (set.leaf === 0) dot(ctx, x, y, size, colour, { alpha })
  else if (set.leaf === 2) {
    dot(ctx, x, y, size, colours.plate, { alpha, ring: colour })
  } else if (set.leaf === 3) {
    for (const [off, r] of [
      [-size, 0.9],
      [0, 1.4],
      [size, 0.9],
    ])
      dot(ctx, x + off, y, r, colour, { alpha })
  } else {
    const tall = set.leaf === 1
    trace(
      ctx,
      tall
        ? [
            [x, y - size * 1.7],
            [x, y + size * 1.7],
          ]
        : [
            [x - size * 1.5, y],
            [x + size * 1.5, y],
          ],
      { colour, width: 2.4, alpha },
    )
  }
}

/** A line that thins on the way down, as roots do. */
function taper(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  thick: number,
  thin: number,
  colour: string,
  alpha: number,
): void {
  const edge = (side: number): Point[] =>
    points.map(([x, y], i) => {
      const [before, after] = [
        points[Math.max(i - 1, 0)],
        points[Math.min(i + 1, points.length - 1)],
      ]
      const [dx, dy] = [after[0] - before[0], after[1] - before[1]]
      const half = (side * (thick + ((thin - thick) * i) / points.length)) / 2
      const long = Math.hypot(dx, dy) || 1
      return [x - (dy / long) * half, y + (dx / long) * half]
    })
  fillBetween(ctx, edge(1), edge(-1), colour, alpha)
}

function drawRoots(
  frame: DisplayFrame<DeepState>,
  at: DeepLayout,
  set: DeepSettings,
  state: DeepState,
  now: number,
  live: boolean,
): DeepRoot | null {
  const { ctx, colours } = frame
  const { pitch } = at
  const dash = dashOf(set)
  const shown = state.roots.map((root) => ({ root, ...deepGrown(root, set, now) }))
  const loud = shown.filter((each) => each.level > (live ? 0.04 : 0.3))
  // The deepest is the one the device reports; until it does, the lowest that is loud enough.
  const deepest = live ? frame.meter('deepest') : 0
  const told = shown.filter(({ root }) => Math.abs(root.hz / deepest - 1) < 0.02)
  const bass = (told.length > 0 ? told : loud).reduce<DeepRoot | null>(
    (low, { root }) => (!low || root.hz < low.hz ? root : low),
    null,
  )
  const weight = Math.sqrt(Math.min(1, 2 * set.balance))
  for (const { root, line, level } of shown.sort((a, b) => b.root.hz - a.root.hz)) {
    if (line <= 0 || root.x < 0) continue
    const deep = root === bass
    const tip: Point = [root.x, deepY(root.hz, pitch)]
    const strong = now < root.up ? root.power : Math.max(level, 0.12 * root.power)
    const alpha =
      clamp(0.4 + 0.5 * strong, deep ? 0.9 : 0.4, deep ? 1 : 0.85) * (0.4 + 0.6 * weight)
    const colour = deep && live ? colours.accent : colours.ink
    const width = LINE_WIDTH[set.soil] * (deep ? 1.35 : 1)
    for (const key of deepFeeders(root, state)) {
      const points = deepWay(set.soil, [key.x, deepY(key.hz, pitch)], tip, line)
      if (dash) trace(ctx, points, { colour, width, alpha, dash })
      else taper(ctx, points, width * 1.6, width * 0.7, colour, alpha)
    }
    if (level <= 0) continue
    const radius = (0.9 + 2.3 * Math.sqrt(Math.min(level, 1.6))) * (0.5 + 0.5 * weight)
    if (deep)
      dot(ctx, ...tip, radius + 0.8, live ? colours.accent : colours.ink, { ring: colours.ink })
    else dot(ctx, ...tip, radius, colour, { alpha: clamp(0.5 + level, 0, 1) })
  }
  return bass
}

/** The bass's own partials on the scale of pitch as it comes up, against the loudest of them. */
function drawPartials(
  frame: DisplayFrame<DeepState>,
  at: DeepLayout,
  set: DeepSettings,
  bass: DeepRoot,
  live: boolean,
): void {
  const { ctx, colours } = frame
  const soil = DEEP_SOILS[set.soil]
  const right = at.partials.x + at.partials.w
  deepPartials(soil, bass.hz, set.rootTone, bass.velocity).forEach((level, k) => {
    const hz = bass.hz * soil.ratio[k]
    const share = clamp(1 + (20 * Math.log10(level + 1e-6)) / 36, 0, 1)
    if (hz > DEEP_HIGH_HZ || share <= 0) return
    const y = deepY(hz, at.partials)
    const colour = live ? colours.accent : colours.ink
    rule(ctx, right - share * at.partials.w, y, right, y, { colour, alpha: live ? 1 : INK.text })
  })
}

function drawGround(frame: DisplayFrame<DeepState>, at: DeepLayout, set: DeepSettings): void {
  const { ctx, colours } = frame
  const { pitch, foot } = at
  const right = foot.x + foot.w
  const y = deepY(set.floor, pitch)
  for (const hz of [55, 110, 220, 440, 880])
    rule(ctx, pitch.x, deepY(hz, pitch), right, deepY(hz, pitch), {
      colour: colours.ink,
      alpha: INK.grid,
    })
  fillRect(ctx, { x: foot.x, y, w: foot.w, h: pitch.y + pitch.h - y }, colours.ink, INK.fill)
  rule(ctx, foot.x, y, right, y, { colour: colours.ink, alpha: INK.back })
  const [, reach] = deepHandles(frame)
  const top = deepY(DEEP_REACH_FROM, pitch)
  rule(ctx, at.rail, top, at.rail, reach.y, { colour: colours.ink, alpha: INK.text })
  rule(ctx, at.rail - 2.5, top, at.rail + 2.5, top, { colour: colours.ink, alpha: INK.text })
}

/** The chord at rest, long after its roots have come down. */
function atRest(set: DeepSettings): DeepState {
  const state = deepFresh()
  state.keys = REST.map((hz, id) => ({
    ...{ id, hz, start: 0, gain: 0.7, released: null, from: 0, leaf: 1, roots: 1, x: -1 },
  }))
  deepRootsNow(state, { ...set, growth: 0 }, 0, 0)
  for (const root of state.roots) {
    root.hz = root.goalHz
    root.up = -1e3
    root.from = root.up - 1
  }
  return state
}

const deepRoots = plateDisplay<DeepState>({
  place: 'window',
  columns: 2,
  params: [...DEEP_CHOSEN, ...DEEP_READ],
  live: { meters: true, signal: true, notes: true },
  info: 'Keys as leaves at their pitch, high at the top, and the roots growing down from them. Where the lines of several keys end in one point they have met; the deepest has the accent, its partials at the right. Drag the right point for Floor, the left one for Reach.',
  init: deepFresh,
  draw(frame) {
    ground(frame)
    const set = deepSettings((name) => frame.value(name))
    const at = deepLayout(frame)
    if (frame.powered) {
      deepKeysNow(frame.state, frame, set)
      deepRootsNow(frame.state, set, frame.now, frame.dt)
    } else Object.assign(frame.state, { keys: [], roots: [] })
    const live = frame.state.keys.length > 0 || frame.state.roots.length > 0
    const state = live ? frame.state : atRest(set)
    // At rest every root has long come down; a pulse is drawn where it is loudest.
    const now = live ? frame.now : 0
    const shown = live ? set : { ...set, decay: DEEP_FOREVER, pulse: 0 }
    deepPlace(state, at.pitch, frame.dt)
    drawGround(frame, at, set)
    const bass = drawRoots(frame, at, shown, state, now, live)
    for (const key of state.keys) leafAt(frame, set, key, live)

    const deepest = live ? frame.meter('deepest') : 0
    const hz = deepest >= 20 ? deepest : (bass?.hz ?? 0)
    if (live && bass && deepest >= 20) {
      // As far across as the chord has met: what the device reports, not what is worked out here.
      const met = clamp(frame.meter('meeting'), 0, 1)
      const y = deepY(deepest, at.pitch)
      const [from, to] = [bass.x, at.pitch.x + at.pitch.w]
      rule(frame.ctx, from - (from - at.pitch.x) * met, y, from + (to - from) * met, y, {
        colour: frame.colours.accent,
      })
    }
    if (bass) drawPartials(frame, at, set, bass, live)
    for (const { key, x, y } of deepHandles(frame))
      handle(frame, x, y, { hot: frame.hot === key, radius: 2.5 })
    text(frame, DEEP_SOILS[set.soil].name, at.head.left, at.head.baseline)
    if (hz > 0)
      text(frame, `${pitchName(hz)}  ${hzText(hz)}`, at.head.right, at.head.baseline, {
        align: 'right',
      })
    levelFoot(frame, at.foot, meanOutShare(frame.state, frame, LEVEL_SEC))
  },
  handles: (view) => deepHandles(view),
})

export const DEEP_ROOTS_FACES: Readonly<Record<string, PlateFace>> = {
  'deep-roots': {
    display: deepRoots,
    face: ['meeting', 'growth', 'soil', 'balance'],
    labels: { branching: 'Branches' },
    sections: [
      ['leaf', 'leafTone', 'balance', 'attack', 'release'],
      ['series', 'reach', 'branching', 'growth', 'stagger'],
      ['meeting', 'fit', 'tolerance'],
      ['soil', 'rootTone', 'grain', 'decay', 'floor'],
      ['pulse', 'sway', 'width', 'volume'],
    ],
  },
}
