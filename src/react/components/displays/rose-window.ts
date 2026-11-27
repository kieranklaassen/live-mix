// The display of Rose Window: the rose the newest key draws, in its window.
//
// In the round window the tracery is the rings, each a wheel with as many
// arches as its harmonics stand apart in the figure, turned as far as Turn has
// turned it, tipped as its plane tips, and as strong as it sounds now. Over it
// in the accent the figure itself, left across and right upwards, one period of
// the note: petals that fold, curl, open and revolve. A rose that does not
// close (Ring tuning, Golden bells) is drawn for several periods and fades
// behind itself. The stone rim is as thick as Stone, every key that sounds is a
// light in it at its place in the octave, and breath is dust on the petals. At
// the right the same rotors by pitch, each as loud as it is after Light, whose
// slope they stand in. Two points: the one in the window sets Rings (its wheel
// Petals), the one on the slope sets Light.

import { INK, clamp, dot, fillRect, follow, ground, handle, lerp, rule, text } from '../display-kit'
import { gainToDb, trace, type Point } from '../display-kit'
import { plateDisplay, type DisplayFrame, type DisplayHandle } from '../plate-display'
import { type DisplayView, type PlateFace } from '../plate-display'
import { keyOfHz, levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'
import * as rose from './rose-window-parts'
import { GOLDEN, HIGH_HZ, RINGS, each, hzOfY, ringAt, type Ask } from './rose-window-parts'
import { roseLayout, roseX, roseY, type RoseKey } from './rose-window-parts'

const C4_HZ = 261.6256
const LEVEL_SEC = 1
const TRACERIES = ['Smooth', 'Pointed', 'Broken', 'Golden']
/** A level follows the device this fast, so a wheel at full Turn is a blur and not a flicker. */
const BLUR_SEC = 0.11
const REST: RoseKey = { frequency: C4_HZ, gain: 0.7, age: 60, released: null }

interface RoseState extends HeardLevel {
  /** The key the picture is of, how far it has rocked, and each rotor's level as it is seen. */
  key: string
  rocked: number
  seen: number[]
  hz: number
}

/** The point in the window stands where its ring is, up to the right, clear of the heart. */
const RINGS_AT = -0.125
function pointsOf(view: DisplayView): { rings: Point; light: Point; openness: number } {
  const { window, slope } = roseLayout(view)
  const out = rose.roseRadius(view.value('rings'), window.r)
  const turned = 2 * Math.PI * RINGS_AT
  const openness = rose.ROSE_OPENNESS[clamp(Math.floor(view.value('tracery') + 0.5), 0, GOLDEN)]
  const y = roseY(view.value('light') * Math.pow(2, openness), slope)
  return {
    rings: [window.x + out * Math.cos(turned), window.y + out * Math.sin(turned)],
    light: [roseX(0.5, slope), y],
    openness,
  }
}

function handlesOf(view: DisplayView): readonly DisplayHandle[] {
  const { window, slope } = roseLayout(view)
  const { rings, light, openness } = pointsOf(view)
  return [
    {
      key: 'rings',
      name: 'Rings',
      x: rings[0],
      y: rings[1],
      drag: (x, y) => ({
        rings: clamp(ringAt(Math.hypot(x - window.x, y - window.y), window.r), 1, RINGS),
      }),
      wheel: (steps) => ({ petals: clamp(view.value('petals') + Math.sign(steps), 3, 12) }),
      reset: () => ({ rings: view.spec('rings')?.default ?? 6 }),
    },
    {
      key: 'light',
      name: 'Light',
      x: light[0],
      y: light[1],
      drag: (_, y) => ({ light: clamp(hzOfY(y, slope) * Math.pow(2, -openness), 200, 8000) }),
      reset: () => ({ light: view.spec('light')?.default ?? 2200 }),
    },
  ]
}

/** The key the device speaks of: its newest that sounds, as it was sent; the last sent until it speaks. */
function newestOf(frame: DisplayFrame<RoseState>): RoseKey | null {
  const hz = frame.meter('note')
  const last = frame.notes[frame.notes.length - 1]
  if (!frame.powered || !last) return null
  const same = frame.notes.filter((note) => Math.abs(note.frequency / hz - 1) < 0.003)
  return same[same.length - 1] ?? last
}

/** The stone rim with a light for every key, and the wheels of the rings in it. */
function drawWindow(frame: DisplayFrame<RoseState>, phases: readonly number[]): void {
  const { ctx, colours, state } = frame
  const ask: Ask = (param) => frame.value(param)
  const { window: at } = roseLayout(frame)
  const thick = 1 + 2.5 * ask('stone')
  dot(ctx, at.x, at.y, at.r, colours.ink)
  ctx.beginPath()
  ctx.arc(at.x, at.y, at.r - 1 - thick / 2, 0, 2 * Math.PI)
  ctx.globalAlpha = 0.75
  ctx.strokeStyle = colours.plate
  ctx.lineWidth = thick
  ctx.stroke()
  ctx.globalAlpha = 1
  const m = rose.roseSpacing(ask)
  const planes = rose.roseFacing(ask, state.hz, state.rocked)
  for (let k = 1; k <= RINGS; k++) {
    const level = Math.max(state.seen[2 * k - 1], state.seen[2 * k])
    const there = clamp(ask('rings') - k + 1, 0, 1)
    if (there <= 0) continue
    const strength = there * lerp(0.38, 1, clamp(1.1 + gainToDb(level) / 36, 0, 1))
    const radius = rose.roseRadius(k, at.r)
    const gap = radius - rose.roseRadius(k - 1, at.r)
    const lobes = k * m
    const deep = lobes < 64 ? Math.min(0.42 * gap, (2.6 * radius) / lobes) : 0
    const squash = lerp(1, clamp(planes[2 * k].facing, 0.1, 1), 0.3)
    const axis = 2 * Math.PI * (0.13 * k + 0.06)
    const [c, s] = [Math.cos(axis), Math.sin(axis)]
    const turned = phases[2 * k] - phases[0]
    const count = Math.ceil(clamp(lobes * 8, 40, 240))
    const points = each(count + 1, (i): Point => {
      const angle = (2 * Math.PI * i) / count
      const r = radius + deep * Math.cos(lobes * (angle - 2 * Math.PI * turned))
      const [x, y] = [r * Math.cos(angle), r * Math.sin(angle)]
      const along = (x * c + y * s) * squash
      const across = y * c - x * s
      return [at.x + along * c - across * s, at.y + along * s + across * c]
    })
    trace(ctx, points, { colour: colours.plate, width: 0.9, alpha: strength })
  }
}

/** The figure, as large as it is loud, one period or as many as it needs to show that it never closes. */
function drawFigure(
  frame: DisplayFrame<RoseState>,
  key: RoseKey,
  inside: number[],
  most: number,
  phases: readonly number[],
  lit: boolean,
): void {
  const { ctx, colours, state } = frame
  const ask: Ask = (param) => frame.value(param)
  const { window: at } = roseLayout(frame)
  const open = Math.floor(ask('tracery') + 0.5) === GOLDEN || Math.abs(ask('bend')) > 0.5
  const turns = open ? 4 : 1
  const highest = rose.roseSpacing(ask) * Math.ceil(ask('rings'))
  const perTurn = Math.ceil(clamp(highest * 12, open ? 180 : 600, open ? 260 : 900))
  // Upright: how a ring leans when it tips, and Width, would lay the rose on its side.
  const planes = phases.map(() => ({ lean: 0 }))
  const seen = { level: state.seen, inside }
  const figure = rose.roseFigure(ask, key, seen, planes, phases, turns, perTurn)
  const far = figure.reduce((most, [x, y]) => Math.max(most, Math.hypot(x, y)), 1e-6)
  const loud = state.seen.reduce((sum, level) => sum + level * level, 0)
  const size = 0.9 * at.r * clamp(Math.pow(loud / Math.max(most, 1e-9), 0.2), 0.25, 1)
  const points = figure.map(([x, y]): Point => [at.x + (size / far) * x, at.y - (size / far) * y])
  const colour = lit ? colours.accent : colours.plate
  if (turns === 1 && lit) {
    ctx.globalAlpha = 0.3
    ctx.fillStyle = colour
    ctx.beginPath()
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.fill('evenodd')
    ctx.globalAlpha = 1
  }
  for (let turn = turns - 1; turn >= 0; turn--) {
    const some = points.slice(turn * perTurn, (turn + 1) * perTurn + 1)
    trace(ctx, some, { colour, width: 1.1, alpha: turns === 1 ? 1 : [1, 0.6, 0.4, 0.28][turn] })
  }
  // Breath: dust blown off the petals, each grain where it is.
  const breath = ask('breath')
  each(Math.round(64 * breath), (n) => {
    const [x, y] = points[Math.floor(((n * 0.618034) % 1) * perTurn)]
    const blown = 1 + breath * 0.5 * Math.sin(12.9898 * n)
    const aside = breath * 5 * Math.sin(78.233 * n)
    const [px, py] = [at.x + (x - at.x) * blown + aside, at.y + (y - at.y) * blown - aside]
    if (Math.hypot(px - at.x, py - at.y) < at.r - 3) dot(ctx, px, py, 0.6, colour, { alpha: 0.8 })
  })
}

/** The rotors by pitch in the slope of Light: as they would be in full, and as they are. */
function drawSlope(
  frame: DisplayFrame<RoseState>,
  key: RoseKey,
  full: readonly number[],
  opened: number,
  lit: boolean,
): void {
  const { ctx, colours, state } = frame
  const ask: Ask = (param) => frame.value(param)
  const { slope } = roseLayout(frame)
  const curve = (cutoff: number): Point[] =>
    each(Math.floor(slope.h) + 1, (i): Point => {
      const y = slope.y + slope.h - i
      return [roseX(rose.rosePass(hzOfY(y, slope), cutoff), slope), y]
    })
  fillRect(ctx, { x: slope.x - 2, y: slope.y - 3, w: slope.w + 4, h: slope.h + 5 }, colours.ink)
  for (const hz of [100, 1000, 10000]) {
    const y = roseY(hz, slope)
    rule(ctx, slope.x, y, slope.x + slope.w, y, { colour: colours.plate, alpha: INK.rule })
  }
  const cutoff = rose.roseCutoff(ask, key.frequency, key.gain, opened)
  rose.roseRatios(ask).forEach((ratio, j) => {
    const hz = key.frequency * ratio
    if (hz > HIGH_HZ) return
    const y = roseY(hz, slope)
    const pass = rose.rosePass(hz, cutoff)
    const bar = (level: number, colour: string, alpha: number): void => {
      const x = roseX(level * pass, slope)
      if (x > slope.x + 0.3)
        trace(ctx, [[slope.x, y] as Point, [x, y] as Point], { colour, width: 1.25, alpha })
    }
    bar(full[j], colours.plate, lit ? INK.back : INK.trace)
    if (lit) bar(state.seen[j], colours.accent, 1)
  })
  if (lit) trace(ctx, curve(cutoff), { colour: colours.accent, width: 1, alpha: 0.9 })
  const still = curve(rose.roseCutoff(ask, C4_HZ, 0.7, 1))
  const alpha = lit ? INK.back : INK.trace
  trace(ctx, still, { colour: colours.plate, width: 1, alpha, dash: [2, 2] })
}

function draw(frame: DisplayFrame<RoseState>): void {
  ground(frame)
  const { ctx, colours, state } = frame
  const ask: Ask = (param) => frame.value(param)
  const { window: at, foot } = roseLayout(frame)
  const newest = newestOf(frame)
  const key = newest ?? { ...REST, frequency: state.hz }
  const name = newest ? `${newest.frequency}` : ''
  state.hz = key.frequency
  // How far it has turned is what the device says, and by the clock where it says nothing.
  const reading = frame.meter('angle')
  const jump = newest !== null && name !== state.key
  if (jump) state.rocked = rose.roseRocked(ask, key.frequency, newest.age)
  const told = newest !== null && frame.meter('level') > 0
  if (told) {
    const off = reading - rose.roseAngle(key.frequency, state.rocked)
    state.rocked += off - Math.round(off)
  }
  state.key = name
  const full = rose.roseLevels(ask, { ...key, age: 60, released: null }, true)
  const now = newest ? rose.roseLevels(ask, newest) : full
  const planes = rose.roseFacing(ask, key.frequency, state.rocked)
  const seen = now.level.map((level, j) => level * planes[j].facing)
  // What is left of the key as the device tells it, so that clouds and a key let go dim the rose;
  // where it tells nothing the release is worked out.
  const loud = 0.6 * Math.hypot(...seen) * key.gain
  const fades = Math.exp((-6.9078 * (newest?.released ?? 0)) / ask('release'))
  const left = told ? clamp(frame.meter('level') / Math.max(loud, 1e-6), 0, 1.4) : fades
  state.seen = seen.map((level, j) => {
    const target = level * left
    return jump || !newest || state.seen.length <= j
      ? target
      : follow(state.seen[j], target, frame.dt, BLUR_SEC / 2, BLUR_SEC)
  })
  const phases = rose.rosePhases(ask, key.frequency, state.rocked)
  const lit = told || (newest !== null && loud * left > 2e-4)
  drawWindow(frame, phases)
  const most = full.level.reduce((sum, level) => sum + level * level, 0)
  drawFigure(frame, key, now.inside, most, phases, lit)
  // Every key is a light in the rim, C at the top, until it has faded.
  for (const note of frame.powered ? frame.notes : []) {
    const alpha = Math.exp((-6.9078 * (note.released ?? 0)) / ask('release'))
    if (alpha < 0.1) continue
    const turned = 2 * Math.PI * ((keyOfHz(note.frequency) % 12) / 12 - 0.25)
    const [x, y] = [at.x + (at.r - 1.5) * Math.cos(turned), at.y + (at.r - 1.5) * Math.sin(turned)]
    const colour = note.frequency === newest?.frequency ? colours.accent : colours.plate
    dot(ctx, x, y, 2, colour, { alpha, ring: colours.ink })
  }
  drawSlope(frame, key, full.level, now.opened, lit)
  const points = pointsOf(frame)
  handle(frame, ...points.rings, { hot: frame.hot === 'rings', radius: 3 })
  handle(frame, ...points.light, { hot: frame.hot === 'light', radius: 3 })
  const tracery = TRACERIES[clamp(Math.floor(ask('tracery') + 0.5), 0, GOLDEN)]
  text(frame, `${Math.floor(ask('petals') + 0.5)} ${tracery}`, 5, 11)
  text(frame, pitchName(key.frequency), frame.width - 5, 11, { align: 'right' })
  levelFoot(frame, foot, meanOutShare(state, frame, LEVEL_SEC))
}

const roseWindow = plateDisplay<RoseState>({
  place: 'window',
  columns: 2,
  params: [
    ...['petals', 'tracery', 'heart', 'rings', 'reach', 'light', 'stone', 'fold', 'curl', 'bend'],
    ...['turn', 'tilt', 'bloom', 'order', 'breath', 'strike', 'decay', 'damping', 'attack'],
    ...['release'],
  ],
  live: { meters: true, signal: true, notes: true },
  info: 'The rose the newest key draws, left across and right upwards, over its rings as they turn and tip; held keys are lights in the rim. Right, the same harmonics by pitch under Light. Drag the point in the window for Rings (its wheel sets Petals), the one on the slope for Light.',
  init: () => ({ key: '', rocked: 0, seen: [], hz: C4_HZ, heard: [], shown: 0 }),
  draw,
  handles: handlesOf,
})

export const ROSE_WINDOW_FACES: Readonly<Record<string, PlateFace>> = {
  // Symmetry, how it is built, how it is folded and how it turns; Rings and Light are the points.
  'rose-window': {
    display: roseWindow,
    face: ['petals', 'tracery', 'fold', 'turn'],
    sections: [
      ['petals', 'tracery', 'heart', 'rings', 'reach'],
      ['light', 'stone'],
      ['fold', 'curl', 'bend'],
      ['turn', 'tilt', 'bloom', 'order'],
      ['breath', 'strike', 'decay', 'damping', 'attack', 'release'],
      ['width', 'volume'],
    ],
    labels: { bend: 'Tuning', order: 'Order' },
  },
}
