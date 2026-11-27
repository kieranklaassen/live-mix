// The display of Wire Lantern: the solid itself, turning, its wires ringing.
//
// Every edge of the solid is drawn as wide as its wire swings there: the power
// of all the waves that stand on it, each at the level it has now. The played
// edge is in the accent, with a dot where it was played, the touched corner
// wears a ring that grows with the finger, and the two ears walk the edges. At
// the right every tone by its pitch over the note, as far to the left as the
// one ear hears it and to the right as the other, level on an open interval and
// crooked off it. Under the solid the wire as it is drawn aside: the point sets
// Pluck Point across and Hardness upwards, the wheel over it picks the edge.
//
// The arithmetic (`wire-lantern-parts.ts`) is the device's own. Left out is
// what brings every setting to one level, the case round the wire, and the
// wavering of a bowed or blown tone.

import { INK, clamp, dot, fillBetween, ground, handle, lerp } from '../display-kit'
import { rule, text, trace, type Box, type Point } from '../display-kit'
import { plateDisplay, type DisplayFrame, type DisplayHandle } from '../plate-display'
import { type DisplayView, type PlateFace } from '../plate-display'
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'
import {
  edgeStep,
  each,
  placeOf,
  sine,
  step,
  wireAlong,
  wireCents,
  wireEar,
} from './wire-lantern-parts'
import {
  wireHeard,
  wireLevels,
  wireNow,
  wireOpen,
  wirePlayed,
  wireSolid,
} from './wire-lantern-parts'
import { type Ask, type Played } from './wire-lantern-parts'

const C4_HZ = 261.6256
const OCTAVES = 3
const LEVEL_SEC = 1
const FLOOR_DB = 48
/** Points along a wire. */
const POINTS = 13
const VOICES = 12

export function wireLayout({ width, height }: Pick<DisplayView, 'width' | 'height'>) {
  const w = clamp(0.3 * width, 36, 84)
  const ladder: Box = { x: width - 13 - w, y: 20, w, h: height - 41 }
  const stage: Box = { x: 5, y: 13, w: ladder.x - 11, h: height - 38 }
  const wire: Box = { x: 8, y: height - 22, w: ladder.x - 17, h: 10 }
  return { ladder, stage, wire, foot: { x: 4, y: height - 7, w: width - 8, h: 3 } }
}

/** How far up the ladder a tone stands, and how far out one ear hears it. */
export const wireRungY = (cents: number, ladder: Box): number =>
  ladder.y + ladder.h * (1 - cents / (1200 * OCTAVES))
export const wireRungWidth = (level: number, ladder: Box): number =>
  (ladder.w / 2 - 1) * clamp(1 + (20 * Math.log10(Math.max(level, 1e-9))) / FLOOR_DB, 0, 1)

interface LanternState extends HeardLevel {
  turned: number
  key: string
  played: Played
  /** The power of every line at every point of every wire. */
  shapes: number[][]
}

/** Where a place in space stands on the stage, `turned` turns on, and how near it is, 0..1. */
function seen([x, y, z]: number[], turned: number, stage: Box): [number, number, number] {
  const [c, s] = [sine(turned + 0.31), sine(turned + 0.06)]
  const near = z * c - x * s
  const size = Math.min(stage.w, stage.h) / 2.1
  return [
    stage.x + stage.w / 2 + size * (x * c + z * s),
    stage.y + stage.h / 2 + size * (0.36 * near - 0.92 * y),
    clamp(0.5 + 0.42 * near + 0.1 * y, 0, 1),
  ]
}

function drawSolid(frame: DisplayFrame<LanternState>, stage: Box, now: number[], lit: boolean) {
  const { ctx, colours, state } = frame
  const ask: Ask = (param) => frame.value(param)
  const solid = wireSolid(step(ask, 'solid', 5))
  const corners = solid.corners.map((corner) =>
    seen(corner, state.turned + 0.5 * ask('ear'), stage),
  )
  const swing = Math.min(stage.w, stage.h) / 13
  const place = (edge: number, x: number): Point => {
    const [from, to] = solid.edges[edge].map((c) => corners[c])
    return [lerp(from[0], to[0], x), lerp(from[1], to[1], x)]
  }
  // The far wires first, so that what is near lies over them.
  const depth = ([u, v]: number[]): number => (corners[u][2] + corners[v][2]) / 2
  const order = each(solid.edges.length, (e) => e)
  for (const e of order.sort((a, b) => depth(solid.edges[a]) - depth(solid.edges[b]))) {
    const colour = e === state.played.edge ? colours.accent : colours.ink
    const [from, to] = [place(e, 0), place(e, 1)]
    const long = Math.max(Math.hypot(to[0] - from[0], to[1] - from[1]), 1)
    const [nx, ny] = [(from[1] - to[1]) / long, (to[0] - from[0]) / long]
    const sides = [1, -1].map((side) =>
      each(POINTS, (i): Point => {
        const power = state.shapes[e * POINTS + i].reduce((sum, s, k) => sum + s * now[k] ** 2, 0)
        const wide = side * swing * Math.min(power, 3) ** 0.4
        const [x, y] = place(e, i / (POINTS - 1))
        return [x + nx * wide, y + ny * wide]
      }),
    )
    const alpha = lerp(INK.rule, INK.trace, depth(solid.edges[e]))
    fillBetween(ctx, sides[0], sides[1], colour, (lit ? INK.rule : INK.fill) * alpha)
    trace(ctx, [from, to], { colour, width: e === state.played.edge ? 1.5 : 1, alpha })
  }
  const bead = 1 + 1.2 * ask('cornerLoss')
  for (const [x, y, near] of corners)
    dot(ctx, x, y, bead, colours.ink, { alpha: lerp(INK.back, 1, near) })
  const [fx, fy] = corners[solid.route[0]]
  const ring = 1.5 + 4 * ask('touch')
  trace(
    ctx,
    each(17, (i): Point => [fx + ring * sine(i / 16), fy + ring * sine(i / 16 + 0.25)]),
    {
      colour: colours.ink,
      width: 1,
    },
  )
  return place
}

const pointOf = (ask: Ask, wire: Box): Point => [
  wire.x + wireAlong(ask('pluck')) * wire.w,
  wire.y + (1 - ask('hardness')) * wire.h,
]

function handlesOf(view: DisplayView): readonly DisplayHandle[] {
  const { wire } = wireLayout(view)
  const ask: Ask = (param) => view.value(param)
  const [x, y] = pointOf(ask, wire)
  return [
    {
      key: 'pluck',
      name: 'Pluck Point and Hardness',
      x,
      y,
      drag: (px, py) => ({
        pluck: clamp(((px - wire.x) / wire.w - 0.03) / 0.47, 0, 1),
        hardness: clamp(1 - (py - wire.y) / wire.h, 0, 1),
      }),
      wheel: (steps) => ({ edge: clamp(edgeStep(ask) + 1 + Math.sign(steps), 1, 6) }),
      reset: () => ({
        pluck: view.spec('pluck')?.default ?? 0.4,
        hardness: view.spec('hardness')?.default ?? 0.4,
      }),
    },
  ]
}

function draw(frame: DisplayFrame<LanternState>): void {
  ground(frame)
  const { ctx, colours, state } = frame
  const ask: Ask = (param) => frame.value(param)
  const { ladder, stage, wire, foot } = wireLayout(frame)
  const solid = wireSolid(step(ask, 'solid', 5))
  const key = [solid.name, edgeStep(ask), ask('pluck')].join()
  if (key !== state.key) {
    const played = wirePlayed(solid, edgeStep(ask), wireAlong(ask('pluck')))
    const places = each(solid.edges.length * POINTS, (i) => i)
    state.shapes = places.map((i) =>
      played.hear(Math.floor(i / POINTS), (i % POINTS) / (POINTS - 1)).map((size) => size * size),
    )
    Object.assign(state, { key, played })
  }
  const { played } = state
  if (frame.powered) state.turned = (state.turned + ask('turn') * frame.dt) % 1
  // Every key that still sounds, and the newest of them, which the ladder is of.
  const sounding = (frame.powered ? frame.notes.slice(-VOICES) : [])
    .map((note) => {
      const levels = wireLevels(ask, played, note.frequency, note.gain)
      return { note, now: wireNow(ask, levels, note) }
    })
    .filter(({ now }) => Math.hypot(...now) > 1e-3)
  const newest = sounding[sounding.length - 1]
  const hz = newest?.note.frequency ?? C4_HZ
  const rest = wireLevels(ask, played, hz, newest?.note.gain ?? 0.7)
  const power = sounding.reduce(
    (sum, { now }) => sum.map((each, k) => each + now[k] ** 2),
    rest.map(() => 0),
  )
  const place = drawSolid(frame, stage, newest ? power.map(Math.sqrt) : rest, Boolean(newest))
  const [px, py] = place(played.edge, played.at)
  dot(ctx, px, py, 2.5, colours.accent, { ring: colours.plate })

  const walked = newest ? ask('turn') * newest.note.age : state.turned
  const cents = wireCents(ask)
  for (let octave = 0; octave <= OCTAVES; octave++) {
    const y = wireRungY(1200 * octave, ladder)
    rule(ctx, ladder.x, y, ladder.x + ladder.w, y, { colour: colours.ink, alpha: INK.grid })
    text(frame, String(2 ** octave), ladder.x + ladder.w + 3, Math.round(y) + 3)
  }
  const middle = ladder.x + ladder.w / 2
  const ears = [false, true].map((far) => wireHeard(ask, played, hz, walked, far))
  const rungs = (levels: readonly number[], colour: string, alpha: number): void =>
    cents.forEach((at, f) => {
      if (at > 1200 * OCTAVES + 20) return
      const [left, right] = ears.map((ear) =>
        wireRungWidth(
          Math.hypot(levels[2 * f] * ear[2 * f], levels[2 * f + 1] * ear[2 * f + 1]),
          ladder,
        ),
      )
      const y = wireRungY(at, ladder)
      // A tone off its open interval hangs crooked, by how far it is off.
      const lean = clamp((at - wireOpen(solid.families[f].natural)) / 18, -3, 3) / (ladder.w / 2)
      const ends: Point[] = [
        [middle - left, y + lean * left],
        [middle + right, y - lean * right],
      ]
      trace(ctx, ends, { colour, width: 1.5, alpha })
    })
  rungs(rest, colours.ink, newest ? INK.rule : INK.text)
  if (newest) rungs(newest.now, colours.accent, INK.trace)

  // The two ears on the wires, and whose side of the ladder is whose.
  const low = ladder.y + ladder.h + 10
  for (const [side, far] of [0, 0.43 * ask('width')].entries()) {
    const ear = wireEar(ask, 0.5 * ask('ear') + walked + placeOf(hz) + far)
    const [x, y] = place(ear.edge, ear.x)
    const sign = side ? ladder.x + ladder.w - 2 : ladder.x + 2
    for (const [ex, ey] of [[x, y] as Point, [sign, low - 3] as Point])
      dot(ctx, ex, ey, 2, side ? colours.plate : colours.ink, { ring: colours.ink })
    text(frame, side ? 'R' : 'L', sign + (side ? -4 : 4), low, { align: side ? 'right' : 'left' })
  }

  const [hx, hy] = pointOf(ask, wire)
  const base = wire.y + wire.h
  trace(
    ctx,
    [
      [wire.x, base],
      [hx, hy],
      [wire.x + wire.w, base],
    ],
    { colour: colours.accent },
  )
  for (const x of [wire.x, wire.x + wire.w]) dot(ctx, x, base, 1.5, colours.ink)
  handle(frame, hx, hy, { hot: frame.hot === 'pluck' })
  text(frame, solid.name, 5, 11)
  text(frame, pitchName(hz), frame.width - 5, 11, { align: 'right' })
  levelFoot(frame, foot, meanOutShare(state, frame, LEVEL_SEC))
}

const wireLantern = plateDisplay<LanternState>({
  place: 'window',
  columns: 2,
  params: [
    ...['solid', 'exciter', 'true', 'pluck', 'edge', 'hardness', 'swell', 'wire', 'cornerLoss'],
    ...['touch', 'decay', 'release', 'ear', 'turn', 'shade', 'width'],
  ],
  live: { signal: true, notes: true },
  info: 'The solid as it turns: each wire as wide as it swings, two ears walking the edges, a ring on the touched corner. Right, the tones of the newest key at each ear, crooked when off an open interval. Drag the bent wire for Pluck Point and Hardness; the wheel picks the Edge.',
  init: () => ({
    turned: 0,
    key: '',
    played: wirePlayed(wireSolid(0), 0, 0.5),
    shapes: [],
    heard: [],
    shown: 0,
  }),
  draw,
  handles: handlesOf,
})

export const WIRE_LANTERN_FACES: Readonly<Record<string, PlateFace>> = {
  // The shape, what wakes it, how true it is and how fast it turns; Pluck Point and Hardness are the point.
  'wire-lantern': {
    display: wireLantern,
    face: ['solid', 'exciter', 'true', 'turn'],
    sections: [
      ['solid', 'true', 'edge', 'pluck'],
      ['exciter', 'hardness', 'contact', 'swell'],
      ['wire', 'cornerLoss', 'touch', 'decay', 'release', 'sympathy'],
      ['shell', 'shade'],
      ['ear', 'turn', 'width', 'volume'],
    ],
    labels: { pluck: 'Pluck', cornerLoss: 'Corners', touch: 'Touch' },
  },
}
