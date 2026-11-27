// The display of Flame Organ: a flame in a tube, and the map of which harmonic
// that makes the tube sing.
//
// At the left the tube of the newest key with its flame at Place, as tall as
// the key and the knobs make it burn, and the air's standing wave inside: one
// bulge for each half wave of the harmonic that sings. Beside it is the second
// tube, its flame at its own place, further off as Between opens, and tied to
// the first while the two lock. At the lower right is the map: Lag across,
// Place up, the land of each harmonic that wins there, with a ring round the
// point for how far Draught blows it. Over the map are the first eight modes:
// up is fed by the flame, down is damped.
//
// The arithmetic is in `flame-organ-parts.ts`. The device reports the newest
// key, how its flame burns, how far the air at it swings, the harmonic that has
// the note, and Lift, Lag and Place as they are at the moment.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillBetween,
  fillRect,
  ground,
  handle,
  lerp,
  rule,
  text,
  trace,
  type Point,
} from '../display-kit'
import { plateDisplay, type DisplayFrame, type DisplayNote, type PlateFace } from '../plate-display'
import * as flame from './flame-organ-parts'
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'

interface FlameState extends HeardLevel {
  /** The map as it was last worked out, and for what. */
  map: (ReturnType<typeof flame.flameMap> & { key: string }) | null
  said: { words: string; at: number } | null
}
type Frame = DisplayFrame<FlameState>

/** The newest key as the device reports it; null at rest. */
function singing(frame: Frame) {
  const hz = frame.meter('key')
  if (!frame.powered || !(hz >= 8)) return null
  let newest: DisplayNote | undefined
  for (const note of frame.notes) if (!newest || note.age <= newest.age) newest = note
  return {
    hz,
    gain: newest?.gain ?? flame.REST_GAIN,
    burning: clamp(frame.meter('burning'), 0, 2),
    air: Math.sqrt(clamp(frame.meter('air'), 0, 1)),
    sings: clamp(frame.meter('sings'), 1, 5),
    lift: clamp(frame.meter('lift'), 0, 1),
    lag: clamp(frame.meter('lag'), ...flame.FLAME_LAG),
    place: clamp(frame.meter('place'), ...flame.FLAME_PLACE),
  }
}

/** One frame's reading of everything the drawing needs. */
function readingOf(frame: Frame) {
  const set = flame.flameSet(frame)
  const now = singing(frame)
  const lag = now?.lag ?? set.lag
  const place = now?.place ?? set.place
  const stand = flame.flameStand(set.tube, set.fuel, lag, place)
  const lift = now?.lift ?? 0
  const sings = now?.sings ?? stand.sings
  return { set, now, lag, place, stand, lift, sings, at: flame.flameLayout(frame) }
}
type Reading = ReturnType<typeof readingOf>

const turn = (turns: number): number => Math.sin(2 * Math.PI * turns)

/** One tube with its air and its flame. `much` is how much of it there is: 1, or Second Flame. */
function drawTube(
  frame: Frame,
  { set, now, sings, lift }: Reading,
  at: flame.FlameTube,
  place: number,
  much: number,
  phase: number,
): void {
  const { ctx, colours } = frame
  const { tube } = set
  const along = (count: number, x: (up: number) => number): Point[] =>
    Array.from({ length: count + 1 }, (_, i) => [x(i / count), at.foot - (i / count) * at.long])
  const line = {
    colour: colours.ink,
    width: 1.2,
    alpha: lerp(INK.grid, INK.trace, Math.sqrt(much)),
  }
  // The longer pipe of a double tube goes on behind, an octave below.
  if (tube === flame.DOUBLE)
    for (const x of [at.x - at.half + 2, at.x + at.half - 2])
      rule(ctx, x, at.foot - at.long, x, at.foot - 2 * at.long, { ...line, width: 1 })
  const walls = [-1, 1].map((sign) =>
    along(12, (up) => at.x + sign * flame.flameWall(tube, at.half, up)),
  )
  for (const wall of walls) trace(ctx, wall, line)
  if (tube === flame.CLOSED) rule(ctx, at.x - at.half, at.foot, at.x + at.half, at.foot, line)
  // The air: the standing wave of the harmonic that sings, crossing to the lifted one.
  const second = flame.flameRatio(tube, 1)
  const swing = (now ? now.air : 0.6) * much
  const air = [-1, 1].map((sign) =>
    along(40, (up) => {
      const wave = lerp(flame.flameAir(tube, sings, up), flame.flameAir(tube, second, up), lift)
      return at.x + sign * Math.abs(wave) * swing * (flame.flameWall(tube, at.half, up) - 1.4)
    }),
  )
  fillBetween(ctx, air[0], air[1], now ? colours.accent : colours.ink, now ? 0.36 : 0.24)
  // The flame: in the ink as it would burn, in the accent as it burns.
  const tall = flame.flameTall(set.flame, now ? now.gain : flame.REST_GAIN)
  const burns = now ? flame.flameHigh(tall) * Math.sqrt(now.burning) : flame.flameHigh(set.flame)
  const base = at.foot - flame.flameShare(tube, place) * at.long
  const high = burns * Math.sqrt(much)
  const colour = now ? colours.accent : colours.ink
  const coal = set.fuel === flame.COAL
  if (high >= 1) {
    const wide = [3.2, 3.9, 2.3, 4.6][set.fuel]
    const wild = coal ? 0.9 : 0.4
    const lick = [-1, 1].map((sign) =>
      Array.from({ length: 13 }, (_, i): Point => {
        const up = i / 12
        const body = Math.min(wide * 1.55 * Math.sqrt(up + 0.03) * (1 - up) ** 0.8, at.half - 1)
        const sway =
          up * ((0.5 + wild) * turn(phase + up * 0.7) + wild * turn(phase * 2.9 - 2 * up))
        return [at.x + sway + sign * body, base - up * high]
      }),
    )
    fillBetween(ctx, lick[0], lick[1], colour, now ? 1 : 0.8)
  }
  const burner = { colour: colours.ink, width: coal ? 2.5 : 1.5, alpha: line.alpha }
  rule(ctx, at.x - 2.5, base + 0.8, at.x + 2.5, base + 0.8, burner)
  // What roars past: specks that rise with the rush.
  const top = at.foot - at.long * (tube === flame.DOUBLE ? 2 : 1)
  for (let i = 0; i < 10 * Math.sqrt(set.roar); i++) {
    const seed = (i * 0.618 + 0.13) % 1
    const rise = (i * 0.755 + 0.4 + phase * (0.2 + 0.2 * seed)) % 1
    const y = lerp(base - high - 2, Math.min(top, base - high - 2), rise)
    const x = at.x + (seed - 0.5) * 1.4 * at.half
    dot(ctx, x, y, 0.8, colour, { alpha: (1 - rise) * (0.3 + 0.7 * set.roar) * much })
  }
}

function drawTubes(frame: Frame, reading: Reading): void {
  const { ctx, colours } = frame
  const { set, now, place, at } = reading
  const [first, second] = flame.flameTubes(set.tube, set.between, at.tubes)
  const place2 = flame.flamePlace2(place, set.between)
  const phase = now ? frame.now : 0.1
  // Two flames that hear each other: lines from the one to the other.
  const couple = flame.flameCouple(set.second, set.between)
  const y = (of: number): number => first.foot - flame.flameShare(set.tube, of) * first.long - 4
  for (const up of [-3, 0, 3])
    if (couple > 0.01)
      trace(
        ctx,
        [
          [first.x, y(place) - up],
          [second.x, y(place2) - up],
        ],
        { colour: now ? colours.accent : colours.ink, width: 1, alpha: Math.sqrt(couple) },
      )
  if (set.second > 0.005) drawTube(frame, reading, second, place2, set.second, phase + 3.7)
  drawTube(frame, reading, first, place, 1, phase)
  // Flame on the tube's wall, with how far Flicker throws it.
  const [, tip] = flame.flameHandles(frame)
  const base = first.foot - flame.flameShare(set.tube, set.place) * first.long
  const [least, most] = flame
    .flameFlicker(set.flicker)
    .map((much) => base - flame.flameHigh(set.flame) * Math.sqrt(much))
  rule(ctx, tip.x, least, tip.x, Math.max(most, at.tubes.y), { colour: colours.ink, width: 2.5 })
  handle(frame, tip.x, tip.y, { hot: frame.hot === 'flame', radius: 2.5 })
}

function drawBars(frame: Frame, { set, now, stand, lift, at: { bars } }: Reading): void {
  const { ctx, colours } = frame
  const up = Math.round(bars.h * 0.65)
  const zero = bars.y + up
  const step = bars.w / flame.TWIN
  const fed = flame.flameFed(set.tube, stand, lift)
  for (let m = 0; m < flame.TWIN; m++) {
    // On a scale of roots, so that the small ones are seen too.
    const size = Math.sqrt(Math.min(1, Math.abs(fed[m])))
    const box = { x: bars.x + m * step + 1, y: zero, w: step - 2, h: size * (bars.h - up) }
    const sings = now !== null && fed[m] > 0.5 && (m === stand.singer || m === 1)
    if (fed[m] < 0) fillRect(ctx, box, colours.ink, INK.back)
    else
      fillRect(
        ctx,
        { ...box, y: zero - size * up, h: size * up },
        sings ? colours.accent : colours.ink,
        INK.text,
      )
  }
  rule(ctx, bars.x, zero, bars.x + bars.w, zero, { colour: colours.ink, alpha: INK.text })
  // The share of its time a key spends on the second mode: a frame over that bar.
  const high = up * flame.flameLifted(set.lift)
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  if (high > 0) ctx.strokeRect(bars.x + step + 0.5, zero - high, step - 1, high)
}

function drawMap(frame: Frame, { set, now, lag, place, lift, sings, at: { map } }: Reading): void {
  const { ctx, colours, state } = frame
  const key = `${set.tube}/${set.fuel}/${map.w}/${map.h}`
  if (state.map?.key !== key) state.map = { key, ...flame.flameMap(set.tube, set.fuel, map) }
  const { cells, names } = state.map
  clipped(ctx, map, () => {
    cells.forEach((row, r) => {
      const y = map.y + r
      for (let c = 0, from = 0; c < row.length; c++) {
        // The shore of a land, along and across.
        const shore = cells[r + 1] !== undefined && cells[r + 1][c] !== row[c]
        if (shore) fillRect(ctx, { x: map.x + c, y, w: 1, h: 1 }, colours.ink, INK.text)
        if (row[c + 1] === row[c]) continue
        const run = { x: map.x + from, y, w: c + 1 - from, h: 1 }
        fillRect(ctx, run, colours.ink, flame.FLAME_LAND[row[c]])
        if (now && lift < 0.6 && row[c] === sings) fillRect(ctx, run, colours.accent, 0.2)
        if (c + 1 < row.length && !shore)
          fillRect(ctx, { x: map.x + c, y, w: 1, h: 1 }, colours.ink, INK.text)
        from = c + 1
      }
    })
    // How far Draught blows the point.
    if (set.draught > 0) {
      const ring: Point[] = Array.from({ length: 33 }, (_, i) => [
        flame.flameMapX(set.lag + flame.GUST_LAG * set.draught * turn(i / 32), map),
        flame.flameMapY(set.place + flame.GUST_PLACE * set.draught * turn(i / 32 + 0.25), map),
      ])
      trace(ctx, ring, { colour: colours.ink, width: 1, dash: [2, 2] })
    }
    // The second flame: the same lag, at its own place.
    if (set.second > 0.005) {
      const y = flame.flameMapY(flame.flamePlace2(place, set.between), map)
      const colour = now ? colours.accent : colours.ink
      dot(ctx, flame.flameMapX(lag, map), y, 2, colour, { alpha: 0.35 + 0.65 * set.second })
    }
  })
  ctx.globalAlpha = INK.back
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.strokeRect(map.x - 0.5, map.y - 0.5, map.w + 1, map.h + 1)
  ctx.globalAlpha = 1
  const [point] = flame.flameHandles(frame)
  for (const { n, x, y } of names)
    if (Math.hypot(x - point.x, y - point.y) > 11)
      text(frame, `${n}`, x, y + 3, { align: 'center' })
  handle(frame, point.x, point.y, { hot: frame.hot === 'lag' })
  if (now)
    dot(ctx, flame.flameMapX(lag, map), flame.flameMapY(place, map), 2.5, colours.accent, {
      ring: colours.ink,
    })
}

const flameOrgan = plateDisplay<FlameState>({
  place: 'window',
  columns: 2,
  params: [
    'flame',
    'lag',
    'place',
    'tube',
    'fuel',
    'secondFlame',
    'between',
    'flicker',
    'roar',
    'draught',
    'lift',
  ],
  live: { meters: true, signal: true, notes: true },
  info: 'Left, the tubes with their flames and the air that swings in them. Below right, Lag across and Place up: each numbered land is the harmonic that sings there. Above it, the modes the flame feeds, and under the line those it damps. Drag the point, or the flame on its wall.',
  init: () => ({ map: null, said: null, heard: [], shown: 0 }),
  draw(frame) {
    ground(frame)
    const reading = readingOf(frame)
    const { set, now, sings, lift, at } = reading
    text(frame, flame.FLAME_TUBES[set.tube], at.head.x, at.head.baseline)
    const heard = lift > 0.6 ? flame.flameRatio(set.tube, 1) : Math.round(sings)
    const words = now ? `${pitchName(now.hz)} ×${heard}` : `×${heard}`
    // The words change twice a second at most.
    const { state } = frame
    if (!state.said || (state.said.words !== words && (!now || frame.now - state.said.at >= 0.5)))
      state.said = { words, at: frame.now }
    text(frame, state.said.words, at.head.right, at.head.baseline, { align: 'right' })
    drawTubes(frame, reading)
    drawBars(frame, reading)
    drawMap(frame, reading)
    levelFoot(frame, at.foot, meanOutShare(state, frame, 1))
  },
  handles: (view) => flame.flameHandles(view),
})

export const FLAME_ORGAN_FACES: Readonly<Record<string, PlateFace>> = {
  'flame-organ': {
    display: flameOrgan,
    face: ['lag', 'place', 'flame', 'lift'],
    labels: { secondFlame: 'Second' },
    sections: [
      ['tube', 'fuel', 'flame', 'lag', 'place', 'lift'],
      ['secondFlame', 'between', 'flicker', 'draught', 'roar', 'glass'],
      ['catch', 'burn', 'embers'],
      ['mouth', 'width', 'volume'],
    ],
  },
}
