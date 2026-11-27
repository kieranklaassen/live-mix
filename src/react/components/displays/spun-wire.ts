// The display of Spun Wire: the wheel of the newest key, and the way it runs.
// Left, its wires between hub and rim, a bead on each as far out as it is tuned
// high; they swing as hard as they were touched, and the plucker reaches in to
// Pluck Point. A fast wheel is shown slowed, so the eye can follow it. Right,
// its speed on a scale of octaves: up while a key is down, and the coast after.
// Every stem is a pluck; over the dashed line, which is Melt, the stems fill up
// into the rub. The marks at the bend are the wheels of a chord as Gear joins
// them. Two points: Spin with Spin up, and Coast. The arithmetic is the
// device's (cpp/devices/spun-wire/spun_wire.h), with no wander of Wobble in it.

import { denormalizeParam } from '../../../core/params'
import * as kit from '../display-kit'
import * as plate from '../plate-display'
import { levelFoot, meanOutShare, pitchName, xOfPitch } from './instrument-parts'
import * as spun from './spun-wire-parts'

const { INK, clamp } = kit
type Frame = spun.SpunFrame
const TURN = Math.PI * 2
/** A blunt plucker is wide where it touches and a keen one thin; air is three puffs. */
function drawPlucker(frame: Frame, set: spun.SpunSet, x: number, top: number, tip: number): void {
  const { ctx, colours } = frame
  const ink = colours.ink
  const wide = 1 + 2.5 * (1 - set.edge)
  if (set.plucker === spun.AIR) {
    for (let k = 0; k < 3; k++) {
      const y = kit.lerp(top + 2, tip + 4, k / 2)
      const arc = Array.from({ length: 9 }, (_, i): kit.Point => {
        const a = (i / 8 - 0.5) * 2
        return [x + a * (wide + k), y - a * a]
      })
      kit.trace(ctx, arc, { colour: colours.plate, width: 3 })
      kit.trace(ctx, arc, { colour: ink, width: 1.2 })
    }
    return
  }
  if (set.plucker === spun.CARD)
    return kit.fillRect(ctx, { x: x - wide, y: top, w: 2 * wide, h: tip - top }, ink)
  // A feather is widest in its middle, a nail at its head.
  const nail = set.plucker === spun.NAIL
  const side = (way: number): kit.Point[] =>
    Array.from({ length: 13 }, (_, i): kit.Point => {
      const t = i / 12
      const out = nail
        ? t < 0.15
          ? 3
          : 0.4 + wide * 0.5 * (1 - t)
        : 0.6 + (wide + 1) * Math.sin(Math.PI * Math.sqrt(t))
      return [x + way * out, kit.lerp(top, tip, t)]
    })
  for (const way of [-1, 1]) kit.trace(ctx, side(way), { colour: colours.plate, width: 2.5 })
  kit.fillBetween(ctx, side(-1), side(1), ink, INK.trace)
}

function drawWheel(
  frame: Frame,
  set: spun.SpunSet,
  wheel: ReturnType<typeof spun.spunLayout>['wheel'],
): void {
  const { ctx, colours, state } = frame
  const { x, y, r } = wheel
  const angle = (i: number): number => (TURN * (i - state.at)) / set.strung
  // Out of true, the rim goes round beside the hub.
  const off = 0.1 * r * set.wobble
  const lean = angle(0.5)
  const [cx, cy] = [x + off * Math.sin(lean), y - off * Math.cos(lean)]
  const rim = r - off
  const hub = r * [0.13, 0.19, 0.27][set.hub]
  const point = (a: number, out: number): kit.Point => {
    const t = (out - hub) / Math.max(rim - hub, 1)
    return [kit.lerp(x, cx, t) + out * Math.sin(a), kit.lerp(y, cy, t) - out * Math.cos(a)]
  }
  kit.dot(ctx, cx, cy, rim, colours.ink, { alpha: 0.06 })
  const ring = Array.from({ length: 49 }, (_, i) => point((TURN * i) / 48, rim))
  kit.trace(ctx, ring, { colour: colours.ink, width: 1 + 2 * set.rim })
  for (let i = 0; i < set.strung; i++) {
    const a = angle(i)
    const ratio = spun.SPUN_RATIOS[set.tuning][i]
    const along = (t: number, side: number): kit.Point => {
      const [px, py] = point(a, kit.lerp(hub, rim, t))
      return [px + side * Math.cos(a), py + side * Math.sin(a)]
    }
    const swing = clamp(state.swings[i], 0, 1) * r * 0.2
    if (swing > 0.3) {
      const bow = (way: number): kit.Point[] =>
        Array.from({ length: 13 }, (_, k) =>
          along(k / 12, way * swing * Math.sin((Math.PI * k) / 12)),
        )
      kit.fillBetween(ctx, bow(-1), bow(1), colours.accent, 0.45)
    }
    // Laced to the next wire at the rim.
    if (set.lacing > 0 && set.strung > 2) {
      const next = angle(i + 1)
      kit.trace(
        ctx,
        [along(0.72, 0), point((a + next) / 2, rim), point(next, kit.lerp(hub, rim, 0.72))],
        {
          colour: colours.ink,
          width: 1,
          alpha: INK.text * Math.sqrt(set.lacing),
        },
      )
    }
    const thick = 0.8 + 0.5 * set.gauge + 0.35 * (1 - clamp(Math.log2(ratio), -2, 2) / 2)
    const lit = swing > 0.3 ? colours.accent : colours.ink
    kit.trace(ctx, [along(0, 0), along(1, 0)], { colour: lit, width: thick })
    const [bx, by] = along(clamp(0.3 + 0.2 * Math.log2(ratio), 0.1, 0.9), 0)
    kit.dot(ctx, bx, by, 1.6, colours.ink)
  }
  kit.dot(ctx, x, y, hub, set.hub === 1 ? colours.ink : colours.plate, { ring: colours.ink })
  if (set.hub === 0) kit.dot(ctx, x, y, hub / 2, colours.ink)
  drawPlucker(frame, set, x, y - r - 6, y - r + set.point * (r - hub))
}

function drawLane(
  frame: Frame,
  set: spun.SpunSet,
  lane: kit.Box,
  note: plate.DisplayNote | undefined,
): void {
  const { ctx, colours, state } = frame
  const scale = spun.spunScale(frame, set, lane)
  const most = Math.min(scale.hold + 1.1 * set.coast, 60)
  const of = JSON.stringify([set, scale])
  if (state.run?.of !== of)
    state.run = {
      of,
      run: spun.spunRun(set, set.gesture === spun.THROWN ? Infinity : scale.hold, most),
    }
  const { speeds, plucks, turns } = state.run.run
  const foot = lane.y + lane.h
  const right = lane.x + lane.w
  const xAt = (at: number): number => spun.spunX(at, turns, scale, lane)
  for (const speed of [1, 10])
    kit.rule(ctx, lane.x, spun.spunY(speed, lane), right, spun.spunY(speed, lane), {
      colour: colours.ink,
      alpha: INK.grid,
    })
  kit.rule(ctx, lane.x, foot, right, foot, { colour: colours.ink, alpha: INK.rule })
  const bend = clamp(xAt(turns), lane.x, right)
  const meltY = spun.spunY(set.melt * (set.plucker === spun.CARD ? 2.83 : 1), lane)
  kit.trace(
    ctx,
    [
      [lane.x, meltY],
      [right, meltY],
    ],
    { colour: colours.accent, width: 1, dash: [2, 2] },
  )
  kit.label(frame, 'melt', right, meltY < lane.y + 10 ? meltY + 9 : meltY - 2, 'right')

  // The rub fills what the plucks stand apart in.
  const points: kit.Point[] = []
  let last = -9
  for (let i = 0; i < speeds.length; i++) {
    const x = xAt(i * spun.TICK)
    if (x > right) break
    if (x - last < 0.5) continue
    const y = spun.spunY(speeds[i], lane)
    const melt = spun.spunMelted(set, speeds[i])
    if (melt > 0.02 && last > 0)
      kit.fillRect(ctx, { x: last, y, w: x - last, h: foot - y }, colours.ink, INK.back * melt)
    points.push([x, y])
    last = x
  }
  if (points.length > 0) points.push([points[points.length - 1][0], foot])
  last = -9
  for (const { at, force } of plucks) {
    const x = xAt(at)
    if (x - last < 2 || x > right) continue
    const y = spun.spunY(
      speeds[Math.min(Math.round(at / spun.TICK), speeds.length - 1)] ?? spun.LOW,
      lane,
    )
    kit.rule(ctx, x, foot, x, Math.min(y, foot - 2), {
      colour: colours.ink,
      alpha: INK.text * force,
    })
    last = x
  }
  kit.clipped(ctx, lane, () => kit.trace(ctx, points, { colour: colours.ink, width: 1.5 }))
  // Under the foot, how long a wire rings: with the key down, and from where it is let go.
  const ring = spun.spunRing(set, 330)
  const damped = 1 / (1 / ring + 1 / set.release)
  for (const [x, end] of [
    [lane.x, Math.min(lane.x + ring * scale.up, bend - 2)],
    [bend, Math.min(bend + damped * scale.down, right)],
  ] as const)
    kit.fillTo(
      ctx,
      [
        [x, foot + 3.5],
        [end, foot + 1],
      ],
      foot + 1,
      colours.ink,
      INK.text,
    )

  // The wheels of a chord, as Gear joins them; with none held, of three keys.
  const held = frame.powered ? frame.notes.filter((each) => each.released === null).length : 0
  for (let rank = 0; rank < Math.min(held || (set.gear > 1 ? 3 : 0), 5); rank++) {
    const y = spun.spunY(Math.min(set.spin * spun.spunGeared(set.gear, rank), spun.TOP_SPEED), lane)
    kit.rule(ctx, bend - 5, y, bend + 1, y, {
      colour: held ? colours.accent : colours.ink,
      width: 2,
    })
  }
  const speed = frame.powered ? frame.meter('speed') : 0
  if (note && speed > 0) {
    const since = note.released ?? 0
    const x =
      set.gesture === spun.THROWN
        ? xAt(note.age)
        : Math.min(xAt(note.age - since), set.gesture === spun.ONE_TURN ? right : bend) +
          since * scale.down
    const y = spun.spunY(speed, lane)
    kit.rule(ctx, lane.x, y, clamp(x, lane.x, right), y, {
      colour: colours.accent,
      alpha: INK.back,
    })
    kit.dot(ctx, clamp(x, lane.x, right), y, 2.5, colours.accent, { ring: colours.ink })
  }
}

function spunHandles(view: plate.DisplayView): plate.DisplayHandle[] {
  const { lane } = spun.spunLayout(view)
  const set = spun.spunSet((name) => view.value(name))
  const half = lane.w * 0.48
  const spinAt = {
    x: lane.x + (0.12 + 0.7 * view.at('rise')) * half,
    y: spun.spunY(set.spin, lane),
  }
  // Where the coast begins: a thrown wheel is at 93 % of Spin so long after the key goes down.
  const thrown = ((set.rise * Math.log(0.85 / 0.07)) / 2.2) * spun.spunScale(view, set, lane).up
  const bend = lane.x + (set.gesture === spun.THROWN ? thrown : half)
  const near = (name: string, share: number, value: number): number => {
    const spec = view.spec(name)
    return spec ? denormalizeParam(spec, clamp(share, 0, 1)) : value
  }
  const spin: plate.DisplayHandle = {
    key: 'spin',
    name: 'Spin and Spin up',
    ...spinAt,
    drag: (x, y) => ({
      spin: clamp(spun.LOW * Math.pow(spun.HIGH / spun.LOW, 1 - (y - lane.y) / lane.h), 0.5, 60),
      rise: near('rise', ((x - lane.x) / half - 0.12) / 0.7, set.rise),
    }),
    reset: () => ({
      spin: view.spec('spin')?.default ?? 11,
      rise: view.spec('rise')?.default ?? 0.9,
    }),
  }
  // A wheel turned once round does not coast.
  if (set.gesture === spun.ONE_TURN) return [spin]
  return [
    spin,
    {
      key: 'coast',
      name: 'Coast',
      x: bend + (0.15 + 0.75 * view.at('coast')) * (lane.w - half),
      y: lane.y + lane.h,
      drag: (x) => ({
        coast: near('coast', ((x - bend) / (lane.w - half) - 0.15) / 0.75, set.coast),
      }),
      reset: () => ({ coast: view.spec('coast')?.default ?? 4.5 }),
    },
  ]
}

const spunWire = plate.plateDisplay<spun.SpunState>({
  place: 'window',
  columns: 2,
  params: spun.READS.split(' '),
  live: { meters: true, signal: true, notes: true },
  info: "Left, the newest wheel turns its wires past the plucker; a bead far out is a wire tuned high. Right, its speed while a key is down and as it coasts: stems are plucks, and over Melt they fill into the rub; wedges below are a wire's ring. One point sets Spin and Spin up, the other Coast.",
  init: () => ({
    at: 0,
    way: 1,
    turn: 0,
    struck: -1,
    swings: [0, 0, 0, 0, 0, 0],
    run: null,
    heard: [],
    shown: 0,
  }),
  draw(frame) {
    kit.ground(frame)
    const at = spun.spunLayout(frame)
    const set = spun.spunSet((name) => frame.value(name))
    const note = spun.spunNewest(frame)
    spun.spunMove(frame, set, note)
    kit.text(frame, spun.TUNINGS[set.tuning], 4, 12)
    const words = `${spun.GESTURES[set.gesture]}${note && frame.powered ? `  ${pitchName(note.frequency)}` : ''}`
    kit.text(frame, words, frame.width - 4, 12, { align: 'right' })
    drawWheel(frame, set, at.wheel)
    drawLane(frame, set, at.lane, note)
    for (const { frequency, released } of frame.powered ? frame.notes : []) {
      const x = xOfPitch(frequency, at.keys, 55, 1760) - 1.5
      if (released === null) kit.fillRect(frame.ctx, { ...at.keys, x, w: 3 }, frame.colours.accent)
    }
    for (const { key, x, y } of spunHandles(frame))
      kit.handle(frame, x, y, { hot: frame.hot === key, radius: 3 })
    levelFoot(frame, at.foot, meanOutShare(frame.state, frame, 1))
  },
  handles: spunHandles,
})

export const SPUN_WIRE_FACES: Readonly<Record<string, plate.PlateFace>> = {
  'spun-wire': {
    display: spunWire,
    face: ['tuning', 'spin', 'melt', 'coast'],
    labels: { point: 'Point' },
    sections: [
      ['tuning', 'gesture', 'plucker', 'hub'],
      ['spin', 'melt', 'rise', 'coast', 'gear', 'wobble'],
      ['strung', 'lacing', 'gauge', 'beat', 'edge', 'point'],
      ['ring', 'damp', 'rim', 'release'],
      ['width', 'volume'],
    ],
  },
}
