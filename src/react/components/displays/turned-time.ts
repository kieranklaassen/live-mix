// The display of Turned Time: a glass of sand, and the ways of the keys that
// run through it. The neck is where a sound begins. Down from it, and up past
// it on the other side, the glass is as wide as the sound has faded there, so
// Depth is how wide a bulb grows and Pour its shape; a point on each bulb sets
// them. The partials fan out from the neck as lines, low at the left and high
// at the right, each as thick as it is loud at that place of the sand: what
// Split, Exchange, Tilt, Frame, Strike and the neck do is seen along them.
//
// To the left is the past, now at the glass: each key's way through the sand,
// the newest in the accent with the sand it has run in the bulb, the others in
// ink. A way that bends back has been turned; a dot on the middle line is a
// landing, a tick at the foot a key. At rest it is the way of one key struck
// when the picture begins, run by the device's own law.

import { clamp, dot, fillRect, ground, handle, rule, text, trace } from '../display-kit'
import { INK, type Box, type Point } from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, meanOutShare } from './instrument-parts'
import {
  TIME_PAST_SEC,
  timeAlone,
  timeFollow,
  type TimeRunning,
  type TimeState,
} from './turned-time-keys'
import {
  TIME_BODIES,
  TIME_NECKS,
  TIME_PASS,
  TIME_STRIKE,
  timeLayout,
  timePartials,
  timeSet,
  timeWide,
  timeY,
  type TimeLayout,
  type TimeSet,
} from './turned-time-sand'

/** The words change twice a second at most. */
const SAID_SEC = 0.5
/** The thinnest line of a partial is this far under the loudest. */
const LINES_DB = 54
const PATHS_APART = 0.3

// --- The picture -----------------------------------------------------------------

function drawWay(
  frame: DisplayFrame<TimeState>,
  set: TimeSet,
  at: TimeLayout,
  glass: TimeRunning,
  newest: TimeRunning,
  style: { colour: string; width: number; alpha: number },
): void {
  const { ctx, now } = frame
  const x = (time: number): number =>
    at.past.x + at.past.w * clamp(1 - (now - time) / TIME_PAST_SEC, 0, 1)
  const points = glass.trail.map(({ at: time, u }): Point => [x(time), timeY(u, set.lim, at)])
  const end = points[points.length - 1]
  if (!end) return
  // The newest is led to its place in the glass.
  if (glass === newest)
    trace(ctx, [end, [at.middle, end[1]]], { ...style, alpha: style.alpha * INK.back, width: 1 })
  trace(ctx, points, style)
  // A landing, and a larger dot for a hard one.
  const size = set.neck === TIME_STRIKE ? 1.2 + 1.3 * set.strike : 1.2
  glass.trail.forEach(({ u, at: time }, i) => {
    const before = glass.trail[i - 1]
    if (before && before.u * u < 0)
      dot(ctx, x(time), at.neck, size, style.colour, { alpha: style.alpha })
  })
}

function drawGlass(
  frame: DisplayFrame<TimeState>,
  set: TimeSet,
  at: TimeLayout,
  newest: TimeRunning,
  live: boolean,
): void {
  const { ctx, colours } = frame
  const { glass, middle } = at
  const rows = Math.max(8, Math.round(glass.h / 1.5))
  const places = Array.from({ length: rows + 1 }, (_, i) => ((2 * i) / rows - 1) * set.lim)
  const ys = places.map((u) => timeY(u, set.lim, at))
  const wide = places.map((u) => timeWide(set, u, at))

  // The sand that has run, from the neck to the key: one ear's time runs ahead of the other's.
  const lag = 0.2 * set.ears * (1 - Math.exp(-3 * newest.age))
  const ends = [newest.u - lag, newest.u + lag].map((u) => clamp(u, -set.lim, set.lim))
  const inside = (side: number, u: number): Point => [
    middle + side * timeWide(set, u, at),
    timeY(u, set.lim, at),
  ]
  const steps = [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1]
  const sand = (): void => {
    ctx.beginPath()
    for (const s of steps) ctx.lineTo(...inside(-1, s * ends[0]))
    for (const s of [...steps].reverse()) ctx.lineTo(...inside(1, s * ends[1]))
    ctx.closePath()
  }
  sand()
  ctx.globalAlpha = live ? 0.92 : INK.back
  ctx.fillStyle = colours.accent
  ctx.fill()
  ctx.globalAlpha = 1

  // The partials, each a line as thick as it is loud there. What a return has lost is off it.
  const partials = timePartials(set, newest.hz, newest.gain, frame.sampleRate)
  const levels = partials.map((one) =>
    places.map((u) => one.at(u) - newest.lost * (0.6 + 0.35 * Math.max(one.octave, 0))),
  )
  const loudest = levels.reduce((most, row) => Math.max(most, ...row), -200)
  const span = partials.reduce((most, one) => Math.max(most, one.octave), 1)
  const low = partials.reduce((least, one) => Math.min(least, one.octave), 0)
  const lines = partials.map(({ octave }, k) => {
    const share = 1.8 * ((octave - low) / (span - low)) - 0.9
    // Where the glass is narrow its lines are finer, so that they stay apart.
    const thick = levels[k].map((db, i) => {
      const loud = clamp(1 + (db - loudest) / LINES_DB, 0, 1)
      return 1.1 * Math.pow(loud, 1.5) * clamp(wide[i] / 14, 0.15, 1)
    })
    return { share, thick, seen: Math.max(...thick) >= 0.1 }
  })
  const draw = (colour: string): void => {
    ctx.fillStyle = colour
    for (const { share, thick, seen } of lines) {
      if (!seen) continue
      ctx.beginPath()
      ys.forEach((y, i) => ctx.lineTo(middle + share * wide[i] - thick[i], y))
      for (let i = rows; i >= 0; i--) ctx.lineTo(middle + share * wide[i] + thick[i], ys[i])
      ctx.closePath()
      ctx.fill()
    }
  }
  draw(colours.ink)

  // In the sand the lines are the plate's colour, and so are its grains, which slide as it runs.
  ctx.save()
  sand()
  ctx.clip()
  if (live) draw(colours.plate)
  for (let i = 0; i < Math.round(60 * set.grains); i++) {
    const u = Math.abs((i * 0.618034 + 0.31 * newest.u) % 1) * newest.u
    const x = middle + (1.8 * ((i * 0.7548777) % 1) - 0.9) * timeWide(set, u, at)
    const y = timeY(u, set.lim, at)
    fillRect(ctx, { x: x - 0.6, y: y - 0.6, w: 1.2, h: 1.2 }, colours.plate, INK.text)
  }
  ctx.restore()

  for (const side of [-1, 1]) {
    const edge = ys.map((y, i): Point => [middle + side * wide[i], y])
    trace(ctx, edge, { colour: colours.ink, width: 1.5 })
  }
  // The caps; a glass that is passed through has a second one over its far side.
  for (const y of [glass.y, glass.y + glass.h])
    rule(ctx, glass.x, y, glass.x + glass.w, y, { colour: colours.ink })
  if (set.neck === TIME_PASS)
    rule(ctx, glass.x + 4, glass.y + 2, glass.x + glass.w - 4, glass.y + 2, { colour: colours.ink })
  if (!live) return
  trace(ctx, [inside(-1, ends[0]), inside(1, ends[1])], { colour: colours.accent, width: 2 })
}

function draw(frame: DisplayFrame<TimeState>): void {
  ground(frame)
  const { ctx, colours, state, now } = frame
  const set = timeSet((name) => frame.value(name))
  const at = timeLayout(frame)
  const followed = timeFollow(frame, set)
  const newest = followed ?? timeAlone(set, now)
  const { past } = at

  // The middle line is the beginning of every sound; the two faint ones the ends of the sand.
  rule(ctx, past.x, at.neck, at.middle, at.neck, { colour: colours.ink, alpha: INK.rule })
  for (const u of [-1, 1]) {
    const y = timeY(u, set.lim, at)
    rule(ctx, past.x, y, past.x + past.w, y, { colour: colours.ink, alpha: INK.grid })
  }
  drawGlass(frame, set, at, newest, followed !== null)
  const others = followed ? state.glasses.slice(0, -1) : []
  for (const one of others) {
    const alpha = Math.max(PATHS_APART, INK.text * clamp(1 + Math.log10(one.envelope) / 3, 0, 1))
    drawWay(frame, set, at, one, newest, { colour: colours.ink, width: 1, alpha })
    dot(ctx, at.middle, timeY(one.u, set.lim, at), 1.5, colours.ink, { alpha })
  }
  const colour = followed ? colours.accent : colours.ink
  drawWay(frame, set, at, newest, newest, { colour, width: 1.5, alpha: followed ? 1 : INK.text })
  if (followed)
    dot(ctx, at.middle, timeY(newest.u, set.lim, at), 2.5, colours.accent, { ring: colours.ink })
  for (const key of state.keys) {
    const x = past.x + past.w * (1 - (now - key) / TIME_PAST_SEC)
    fillRect(ctx, { x: x - 0.5, y: past.y + past.h - 3, w: 1.5, h: 4 }, colours.accent)
  }

  text(frame, `${TIME_BODIES[set.body].name}, ${TIME_NECKS[set.neck]}`, 5, 12)
  const going = newest.speed * newest.u
  const words = !followed
    ? `${set.sand < 10 ? set.sand.toPrecision(2) : Math.round(set.sand)} s`
    : Math.abs(newest.speed) < 0.2
      ? 'turning'
      : going >= 0
        ? 'fading'
        : 'returning'
  if (now - state.said.at >= SAID_SEC || now < state.said.at || !state.said.words)
    state.said = { words, at: now }
  const said = frame.dt > 0 ? state.said.words : words
  text(frame, said, frame.width - 5, 12, { align: 'right' })
  for (const { key, x, y } of handles(frame))
    handle(frame, x, y, { hot: frame.hot === key, radius: 2.5 })
  const foot: Box = { x: 4, y: frame.height - 8, w: frame.width - 8, h: 4 }
  levelFoot(frame, foot, meanOutShare(state, frame, 1))
}

/** Where on the sand the two points stand: Depth at its end, Pour on the way, on the other bulb. */
const DEPTH_AT = 1
const POUR_AT = -0.3

/** The knob's place, 0..1, at which the glass is so wide at a place of the sand. */
function placed(of: (knob: number) => number, wide: number, rises: boolean): number {
  let [low, high] = [0, 1]
  for (let i = 0; i < 24; i++) {
    const middle = (low + high) / 2
    if (of(middle) < wide === rises) low = middle
    else high = middle
  }
  return (low + high) / 2
}

function handles(view: DisplayView): DisplayHandle[] {
  const at = timeLayout(view)
  const set = timeSet((name) => view.value(name))
  const wideWith = (name: string, u: number) => (knob: number) =>
    timeWide(
      timeSet((other) => (other === name ? knob : view.value(other))),
      u,
      at,
    )
  const point = (name: 'depth' | 'pour', u: number, side: number): DisplayHandle => {
    const x = at.middle + side * timeWide(set, u, at)
    const rises = name === 'depth'
    return {
      key: name,
      name: rises ? 'Depth' : 'Pour',
      x,
      y: timeY(u, set.lim, at),
      drag: (to, _, hold = {}) => {
        const start = (hold.start ??= view.value(name))
        // A press on it, and a glass already as wide as it can be drawn, leave the knob alone.
        if (Math.abs(to - x) < 0.5) return { [name]: view.value(name) }
        const wide = side * (to - at.middle)
        const ends = [0, 1].map(wideWith(name, u))
        if (Math.abs(ends[0] - ends[1]) < 0.5) return { [name]: start }
        return { [name]: placed(wideWith(name, u), wide, rises) }
      },
      reset: () => ({ [name]: view.spec(name)?.default ?? 0.5 }),
    }
  }
  return [point('depth', DEPTH_AT, 1), point('pour', POUR_AT, -1)]
}

const GLASS = 'sand depth pour inertia neck turn'
const SOUND = 'body tilt frame strike attack'
const CHORD = 'apart stagger split exchange memory'
const turnedTime = plateDisplay<TimeState>({
  place: 'window',
  columns: 2,
  params: `${GLASS} ${SOUND} ${CHORD} grains ears release`.split(' '),
  live: { meters: true, signal: true, notes: true },
  info: 'A glass as wide as the sound has faded there: the neck is its beginning, the lines its overtones, as thick as they are loud. Drag a bulb for Depth or Pour. At the left each key on its way, the newest bright; one that bends back was turned, and a dot is a landing.',
  init: () => ({
    glasses: [],
    clock: 0,
    keys: [],
    order: 0,
    said: { words: '', at: 0 },
    heard: [],
    shown: 0,
  }),
  draw,
  handles,
})

export const TURNED_TIME_FACES: Readonly<Record<string, PlateFace>> = {
  'turned-time': {
    display: turnedTime,
    face: ['sand', 'depth', 'body', 'inertia'],
    labels: { neck: 'Neck', turn: 'Turn', settling: 'Settle' },
    sections: [
      GLASS.split(' '),
      SOUND.split(' '),
      CHORD.split(' '),
      ['settling', 'grains', 'beat', 'ears', 'release', 'volume'],
    ],
  },
}
