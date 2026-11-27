// The display of Dry Brush: the stroke a key makes, over time on a root scale: held for four seconds,
// then lifted. The 28 hairs are drawn from the core outwards, as strong as they sound; behind them is
// the stain, under them the string, at the left the ink. What the newest note has laid is bright. The
// arithmetic is the device's own (`hand`, `begin`, `tick`, `skip`, `matter.h`), for a mean stroke.

import * as kit from '../display-kit'
import { INK, clamp, follow, type Point } from '../display-kit'
import { plateDisplay, type DisplayFrame, type DisplayHandle } from '../plate-display'
import { type DisplayView, type PlateFace } from '../plate-display'
import { levelFoot, meanOutShare, type HeardLevel } from './instrument-parts'

type Knob = (name: string) => number
const HAIRS = 28
export const [DRY_BRUSH_HELD, DRY_BRUSH_TAIL] = [4, 10]
const BRUSHES = ['Hair', 'Reed pen', 'Broad edge', 'Feather', 'Finger']
const PAPERS = ['silk', 'rice', 'rough', 'stone']
const [DOT, HOOK, SWEEP, TREMBLE, STAMP] = [1, 2, 3, 4, 5]
/** `kRatio`: the partial each hair of a brush stands on. */
const RATIOS: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 11, 12, 13, 14],
  Array.from({ length: HAIRS }, (_, i) => 2 * Math.floor(i / 2) + 1),
  [0.5, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18],
  [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8, 12, 12, 16, 16],
  [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6],
]
/** Of `kMatter`: tone, hold, string, thirst, left, open, pace, bright, fade, and how its partials fall. */
const MATTER: readonly (readonly number[])[] = [
  [0.95, 2.2, 1, 1, 1, 1.25, 1, 1, 1, 1],
  [0.99, 3, 1.4, 2, 0.35, 0.95, 0.3, 3, 0.75, 0.7],
  [0.75, 1.1, 1.1, 1.5, 1.1, 1.5, 1.3, 0.28, 0.7, 0.75],
  [0.15, 0.7, 1.1, 1.2, 0.35, 0.85, 1.7, 0.7, 2.2, 0.55],
  [0.99, 1.4, 1.2, 0.3, 1.6, 1.6, 0.7, 0.3, 0.65, 1.8],
]
/** Of `kGround`: tooth, catching, wander, drink, thirst, soft, fade, left. */
const GROUND: readonly (readonly number[])[] = [
  [0.75, 0, 0.9, 0.8, 0.8, 1, 1, 1],
  [1.2, 0, 2, 1.6, 1.9, 0.28, 1.1, 1],
  [8, 0.95, 6, 0.8, 2.4, 1, 1.7, 0.35],
  [1, 0, 0.5, 0.6, 0.6, 1.1, 0.6, 1.2],
]
const smooth = (x: number): number => clamp(x, 0, 1) ** 2 * (3 - 2 * clamp(x, 0, 1))
/** The same chance from 0 to 1 for the same two numbers, always. */
const chance = (a: number, b: number): number => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** `hand`: pressure and speed of a script that has run `u` of its length, its sway at rest. */
export function dryBrushHand(script: number, u: number): readonly [number, number] {
  const fall = Math.exp(-2 * u)
  const after = Math.exp(-3.5 * (u - 1))
  if (script === DOT) return [1, 0.6 * fall * fall]
  if (script === HOOK && u < 1) return [0.06 + 1.14 * Math.pow(u, 2.5), 0.25 + 0.9 * u * u]
  if (script === HOOK) return [0.23 + 0.97 * after, 0.3 + 0.85 * after]
  if (script === SWEEP) return [0.1 + 1.34 * fall, 0.35 + 0.85 * (1 - fall)]
  if (script === TREMBLE) return [0.82, 0.75]
  if (script === STAMP) return [1.05, 0.3 * fall]
  return [0.9 + 0.22 * fall, 0.6]
}
/** A stroke at one moment: seconds held, seconds since the lift; and of each hair, how loud and how wet. */
const EMPTY = { t: 0, up: 0, pressure: 0, cents: 0, ink: 0, stain: 0, string: 0 }
type Moment = typeof EMPTY & { loud: number[]; wet: number[] }
/** The stroke the knobs make with a key played at `gain`, held and let go (`begin`, `tick`). */
export function dryBrushStroke(knob: Knob, gain = 0.7, held = DRY_BRUSH_HELD): Moment[] {
  const [script, brush] = [Math.round(knob('script')), Math.round(knob('brush'))]
  const [, hold, stringy, thirst, left, open, pace, bright, fade, falls] = MATTER[brush]
  const [tooth, , , , drinks, soft, fades, leaves] = GROUND[Math.round(knob('paper'))]
  const [dry, inked, redip, tail] = ['dryness', 'ink', 'redip', 'tail'].map(knob)
  const [release, soak, shade, press] = ['release', 'soak', 'shade', 'pressure'].map(knob)
  const struck = script === DOT || script === STAMP
  const rate = Math.pow(0.028, -knob('speed')) / 5
  const going = script === HOOK ? 0.25 + 0.65 * rate : rate
  const beat = clamp(2.8 * Math.pow(rate, 0.8), 0.7, 11)
  const landing = knob('attack')
  const attack =
    script % 4 === 0 ? pace * landing : (Math.min(pace, 1) * landing) / (1 + 0.6 * landing)
  const fading =
    0.2 * Math.pow(5 * rate, 0.75) * Math.pow(2, 2.2 * (0.6 - inked)) * (0.8 + 0.6 * dry)
  const drag = tail * clamp(24 / release - 1, 0, 7)
  const corner = (170 * Math.pow(42, shade) * bright * soft * Math.pow(8, press - 0.55)) / 220
  const tilt =
    (shade < 0.5 ? 2.2 : 1.1) * (shade - 0.5) + (press < 0.55 ? 0.9 : 0.6) * (press - 0.55)
  const own = (n: number): number => Math.pow(n, tilt - falls) / (1 + (n / corner) ** 2)
  const hairs = RATIOS[brush].map((n, i, all) => {
    const inside = Math.max(0, 1 - i / (HAIRS - 1) - 0.07 * (i - all.indexOf(n)))
    const wears = script === STAMP ? Math.max(0.3, 0.8 * n - 0.5) : 0.55 + 0.45 * n
    const start = Math.min(1, 0.35 + 2.2 * inked)
    return {
      touch: 1.7 * open * (1 - inside) - 0.35,
      thirst: thirst * drinks * (0.55 + 0.5 * (1 - inside) + 0.7 * chance(i, 2)),
      core: clamp((inside - 0.55) * 3, 0, 1),
      floor: Math.min(0.9, left * leaves * (0.03 + 0.36 * inside ** 3)),
      wears: struck ? fade * fades * wears : 0,
      ink: Math.max(0, start - 1.3 * Math.max(0, dry - 0.55) * (0.6 + 0.8 * chance(i, 3))),
      level: clamp(1 + Math.log10(own(n) / own(1)) / 2.6, 0.12, 1),
      ...{ land: 0, lift: 1, wear: 1, stain: 0 },
    }
  })
  const moments: Moment[] = []
  const strung = knob('string') * (1.6 - 0.6 * knob('string')) * stringy
  const wait = 4.5 * Math.pow(0.078, redip)
  let [u, splash, refill, dip, rung, t] = [0, 0.45 * Math.max(0, 2 * inked - 1), 0, wait, 1, 0]
  while (t < held + DRY_BRUSH_TAIL) {
    const down = t < held
    const dt = t < held + 1 ? 0.01 : 0.04
    t += dt
    const up = down ? 0 : t - held
    if (down && (script !== SWEEP || t > 0.7 * attack)) u += dt * going
    const [weight, pace] = dryBrushHand(script, u)
    splash *= Math.exp(-dt / 0.22)
    if (redip > 0 && down && (dip -= dt) <= 0) {
      ;[dip, refill, rung] = [wait, 0.6 + 0.4 * redip, struck ? 1 : rung]
      splash = struck ? 0 : Math.max(splash, 0.3 + 0.6 * redip)
    }
    const again = struck && refill > 0 ? 1 - Math.exp(-dt / (0.004 + 0.3 * attack)) : 0
    const poured = Math.min(refill, dt * 4)
    refill -= poured
    const pressure = weight * (0.16 + 1.52 * press) * (0.56 + 0.62 * gain) + 0.9 * splash
    const shaking = (phase: number): number => {
      const x = 0.5 + 0.5 * Math.sin(2 * Math.PI * (phase + t * beat))
      return script === TREMBLE ? Math.min(1, t * 4) * (1.9 * x ** 3 - 0.96) : 0
    }
    const speed = pace * (0.35 + 1.3 * knob('speed')) * (1 + 0.8 * shaking(0))
    const flutter = Math.min(0.85, knob('grain') * tooth * (0.22 + 0.4 * speed))
    const spent = (dt * (0.35 + speed)) / (0.25 * Math.pow(28, inked))
    const worn =
      struck && t > attack ? dt * fading * (script === DOT ? 9.5 : t * rate < 1.1 ? 1 : 9) : 0
    const now: Moment = { ...EMPTY, t, up, pressure, loud: [], wet: [] }
    let flowing = 0
    hairs.forEach((hair, i) => {
      hair.land = Math.min(1, hair.land + dt / Math.max(attack, 0.002))
      if (!down) hair.lift *= Math.exp((-6.9 * dt) / release / (1 + drag * hair.core))
      hair.wear *= Math.exp((-worn * hair.wears) / (1 + 2.5 * tail * tail * hair.core))
      hair.wear += (1 - hair.wear) * again
      const touching = smooth((pressure * (1 + shaking((i % 2) * 0.1)) - hair.touch) / 0.55)
      const flow = touching * smooth(hair.land) * hair.lift * hair.wear
      hair.ink = Math.min(1, Math.max(0, hair.ink - spent * hair.thirst * flow) + poured)
      const wet = smooth(hair.ink * (3 - 2.1 * dry))
      const drunk = flow * (0.5 + 0.5 * wet)
      const taken = drunk > hair.stain ? dt / (0.12 + 0.22 * soak) : (6.9 * dt) / (1.3 * soak)
      hair.stain = drunk + (hair.stain - drunk) * Math.exp(-taken)
      const catches = 0.7 * flutter * chance(i, Math.floor(t * 40))
      now.loud.push(flow * hair.level * (hair.floor + (1 - hair.floor) * wet) * (1 - catches))
      now.wet.push(wet)
      now.ink += hair.ink / HAIRS
      now.stain += hair.stain / HAIRS
      flowing += flow / HAIRS
    })
    rung *= Math.exp((-6.9 * dt) / (down ? hold : Math.min(hold, 0.08 + release)))
    now.string = strung * (0.4 * rung + Math.min(1, 1.6 * flowing) * Math.min(1, speed))
    now.cents = knob('lean') * Math.exp(-t / (0.06 + 0.3 / rate))
    if (up > 0) now.cents += knob('tailLean') * smooth(up / (0.05 + 0.45 * release))
    moments.push(now)
  }
  return moments
}

export function dryBrushLayout(size: Pick<DisplayView, 'width' | 'height'>) {
  const field: kit.Box = { x: 13, y: 15, w: size.width - 17, h: size.height - 37 }
  return {
    field,
    middle: field.y + field.h / 2,
    /** The held key is left of it, the tail right. */
    lift: field.x + Math.round(field.w * 0.68),
    string: field.y + field.h + 8,
    well: { x: 4, y: field.y, w: 5, h: field.h + 12 },
    foot: { x: 4, y: size.height - 8, w: size.width - 8, h: 4 },
  }
}
type Layout = ReturnType<typeof dryBrushLayout>
/** Where a moment stands: seconds held, or seconds since the lift. */
export function dryBrushX(at: Layout, held: number, up: number): number {
  const share = Math.sqrt(clamp(up > 0 ? up / DRY_BRUSH_TAIL : held / DRY_BRUSH_HELD, 0, 1))
  if (up > 0) return at.lift + share * (at.field.x + at.field.w - at.lift)
  return at.field.x + share * (at.lift - at.field.x)
}
/** Where a lean stands: the root of it above or below the middle, so a few cents show. */
export function dryBrushY(at: Layout, cents: number): number {
  return at.middle - Math.sign(cents) * Math.sqrt(Math.abs(cents) / 1200) * at.field.h * 0.46
}
interface State extends HeardLevel {
  key: string
  stroke: Moment[]
  id: number
  since: number
  pressure: number
  ink: number
}
const PARAMS = 'script brush paper ink pressure speed dryness redip spread grain shade'.split(' ')
PARAMS.push(...'string bleed soak attack lean release tail tailLean'.split(' '))
/** Where the newest stroke is; a new one is taken up twice a second at most. */
function nibNow({ state, notes, now, powered }: DisplayFrame<State>, at: Layout): number {
  const sounds = notes.filter((note) => (note.released ?? 0) < DRY_BRUSH_TAIL)
  if (!powered || sounds.length === 0) return Infinity
  const same = sounds.find((note) => note.id === state.id)
  const note = same && now - state.since < 0.5 ? same : sounds[sounds.length - 1]
  if (note.id !== state.id) [state.id, state.since] = [note.id, now]
  return dryBrushX(at, note.age, note.released ?? 0)
}
function drawStroke(frame: DisplayFrame<State>, at: Layout, nib: number): void {
  const { ctx, colours, state } = frame
  const paper = GROUND[Math.round(frame.value('paper'))]
  const [tone] = MATTER[Math.round(frame.value('brush'))]
  const [dry, speed, grain] = ['dryness', 'speed', 'grain'].map((name) => frame.value(name))
  const caught = paper[1] * (0.45 + 0.55 * grain) * (0.4 + 0.6 * speed) * (0.4 + 0.6 * dry)
  const columns: { x: number; y: number; open: number; m: Moment }[] = []
  for (const m of state.stroke) {
    const x = dryBrushX(at, m.t, m.up)
    if (columns.length > 0 && x - columns[columns.length - 1].x < 1.5) continue
    const open = at.field.h * 0.58 * (0.3 + 0.7 * Math.min(1, m.pressure / 0.95))
    columns.push({ x, y: dryBrushY(at, m.cents), open, m })
  }
  const deep = frame.value('bleed') * paper[3] * 1.6
  const edge = (side: number): Point[] =>
    columns.map(({ x, y, m }, c) => {
      const rough = 0.14 * Math.sqrt(paper[2]) * (chance(Math.floor(c / 3), side) - 0.5)
      const reach = side * Math.min(0.5, Math.sqrt(m.stain * deep) * (0.55 + rough))
      return [x, at.middle + at.field.h * clamp((y - at.middle) / at.field.h + reach, -0.5, 0.5)]
    })
  kit.fillBetween(ctx, edge(-1), edge(1), colours.ink, INK.fill)
  // Four strengths of hair, laid and still to come: eight paths and not two thousand.
  for (let path = 0; path < 8; path++) {
    ctx.beginPath()
    for (let i = 0; i < HAIRS; i++) {
      const side = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * (2 / HAIRS)
      let drawing = false
      columns.forEach(({ x, y, open, m }, c) => {
        const skips = clamp((1 - m.wet[i]) * dry * 1.5 + caught, 0, 0.9) * (i < 8 ? 0.55 : 1)
        const there = m.loud[i] > 0.012 && chance(i + 40, Math.floor(c / 2)) >= skips
        const strength = Math.min(3, Math.floor(m.loud[i] * 6)) + (x <= nib ? 0 : 4)
        const loose =
          (frame.value('spread') / 6) * (chance(i, 7) - 0.5) * (1 + 2 * dry * (1 - m.wet[i]))
        const hair = y + side * open + loose + 4 * (1 - tone) * (chance(i + 9, c) - 0.5)
        const on = there && strength === path && Math.abs(hair - at.middle) < at.field.h / 2
        if (on && !drawing) ctx.moveTo(x - 1.2, hair)
        if (on) ctx.lineTo(x, hair)
        drawing = on
      })
    }
    ctx.globalAlpha = (path < 4 ? 1 : 0.4) * [0.55, 0.7, 0.85, 1][path % 4]
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = [0.9, 1.1, 1.3, 1.6][path % 4]
    ctx.stroke()
  }
  const swing = (side: number): Point[] =>
    columns.map(({ x, m }) => [x, at.string + side * clamp(0.5 + m.string * 3, 0, 4)])
  kit.fillBetween(ctx, swing(-1), swing(1), colours.ink, INK.text)
}

function dryBrushHandles(view: DisplayView): readonly DisplayHandle[] {
  const at = dryBrushLayout(view)
  return (['attack', 'release'] as const).map((time) => {
    const [cents, held] = [time === 'attack' ? 'lean' : 'tailLean', time === 'attack']
    const longest = held ? DRY_BRUSH_HELD : DRY_BRUSH_TAIL
    const [from, to] = held ? [at.field.x, at.lift] : [at.lift, at.field.x + at.field.w]
    return {
      key: time,
      name: held ? 'Attack and entry lean' : 'Release and tail lean',
      x: dryBrushX(at, view.value(time), held ? 0 : view.value(time)),
      y: dryBrushY(at, view.value(cents)),
      drag: (x, y) => {
        const share = clamp((at.middle - y) / (at.field.h * 0.46), -1, 1)
        const seconds = longest * clamp((x - from) / (to - from), 0, 1) ** 2
        const lean = Math.abs(share) < 0.05 ? 0 : 1200 * share * Math.abs(share)
        return { [time]: clamp(seconds, held ? 0.004 : 0.06, longest), [cents]: lean }
      },
    }
  })
}

const dryBrush = plateDisplay<State>({
  place: 'window',
  columns: 2,
  params: PARAMS,
  live: { meters: true, signal: true, notes: true },
  info: 'One stroke of the brush, hair by hair: held for four seconds, then lifted. Hairs short of ink break and thin, the stain spreads behind them, the string lies below. The left point is Attack and Entry lean, the right one Release and Tail lean; the bar at the left is the ink.',
  init: () => ({ key: '', stroke: [], id: -1, since: 0, pressure: 0, ink: 0, heard: [], shown: 0 }),
  draw(frame) {
    const { ctx, colours, state } = frame
    kit.ground(frame)
    const at = dryBrushLayout(frame)
    const { x, y, w, h } = at.well
    const key = PARAMS.map((name) => frame.value(name)).join()
    if (key !== state.key) state.stroke = dryBrushStroke((name) => frame.value(name))
    state.key = key
    const [brush, paper] = ['brush', 'paper'].map((name) => Math.round(frame.value(name)))
    kit.text(frame, `${BRUSHES[brush]} on ${PAPERS[paper]}`, 4, 12)
    const nib = nibNow(frame, at)
    const rests = nib === Infinity
    kit.rule(ctx, at.lift, y, at.lift, at.string - 8, { colour: colours.ink, alpha: INK.rule })
    drawStroke(frame, at, nib)
    const [ink, pressure] = ['ink', 'pressure'].map((name) => clamp(frame.meter(name), 0, 1))
    state.ink = rests ? state.stroke[0].ink : follow(state.ink, ink, frame.dt, 0.1, 0.1)
    state.pressure = follow(state.pressure, pressure, frame.dt, 0.12, 0.25)
    kit.fillRect(ctx, at.well, colours.ink, INK.fill)
    const full = { x, y: y + h * (1 - state.ink), w, h: h * state.ink }
    kit.fillRect(ctx, full, rests ? colours.ink : colours.accent)
    if (!rests) {
      const reach = 2 + (at.field.h / 2 - 2) * state.pressure
      kit.fillRect(ctx, { x: nib - 1, y: at.middle - reach, w: 2, h: 2 * reach }, colours.accent)
    }
    for (const p of dryBrushHandles(frame))
      kit.handle(frame, p.x, p.y, { hot: frame.hot === p.key })
    levelFoot(frame, at.foot, meanOutShare(state, frame, 1))
  },
  handles: dryBrushHandles,
})

export const DRY_BRUSH_FACES: Readonly<Record<string, PlateFace>> = {
  'dry-brush': {
    display: dryBrush,
    face: ['script', 'brush', 'ink', 'dryness'],
    labels: { spread: 'Spread', lean: 'Lean in', tailLean: 'Lean out' },
    sections: [
      ['script', 'brush', 'paper', 'pressure', 'speed', 'attack', 'lean'],
      ['ink', 'dryness', 'redip', 'shade', 'spread', 'grain', 'bleed', 'soak', 'string'],
      ['release', 'tail', 'tailLean', 'width', 'volume'],
    ],
  },
}
