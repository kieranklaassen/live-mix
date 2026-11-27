// The display of Closed Eyes: an eye, and under it what a key does in time.
// Over it stand the partials of the keys, faint as they would be untired, bright as they
// are; under it hang those of their opposite. It is open as far as the notes are there.
// Below, over equal ratios of time, a key held and one let go; dashes: Tire, After Length.
// The arithmetic is the device's, less sways and bodies; tiredness and lids are reported.

import {
  INK,
  clamp,
  dot,
  fillBetween,
  follow,
  ground,
  handle,
  lerp,
  rule,
  text,
  trace,
  xOfHz,
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
import { levelFoot, meanOutShare, type HeardLevel } from './instrument-parts'

const rows = (all: string) => all.split('/').map((row) => row.trim().split(' ').map(Number))
const SOURCES = ['Lamp', 'Reed', 'Bowl', 'Vowel', 'Struck', 'String']
const OPPOSITES = ['Even', 'Mirror', 'Sides', 'Rough', 'Breath', 'Below']
/** `*_scale`, `after_trim`, `image_tilt` of the sources; `kLength`, `kTrim` and weights of the opposites; then modes. */
const [ATTACKS, RELEASES, RISES, STAYS, LIGHTS, TILTS, LENGTHS, TRIMS, EVENS, HIGHS, LOWS] = rows(`
  1 .3 2.8 1.5 1 1 / 1 .45 3 2.2 1 1 / 1 .4 2.4 1.9 .6 .8 / 1 .8 1.35 .72 1.2 1.1 / 1 .8 .8 .72 .75 1.1 /
  0 -1.1 1.1 .35 .3 0 / 1.3 .6 1 .8 .75 1.2 / .8 1.2 .95 .95 1.2 .62 / 1 .22 .02 .05 .004 .01 .004 .01 /
  1 .34 .3 .34 .28 .2 0 0 / 1 .62 .34 .2 .12 .08 .05 .03`)
const [BOWL, BAR, BELL, GLASS, GLINT] = rows(`1 2.71 5.15 8.2 11.7 15.6 /
  1 4 9.2 10.1 16.4 17.6 24 25.5 / 1 2 2.994 4.17 5.43 6.79 8.21 10.3 /
  1 2.32 4.25 6.63 9.38 12.5 15.95 19.75 / 1 2 2.76 4 5.404 8.933 7 8`)
/** `formants`: level, pitch, width of three at oo, oh, ah, eh, ee. A source's tilt and roof, each dark and bright. */
const VOWELS = rows(`1 320 55 .22 800 70 .04 2250 130 / 1 450 55 .5 820 70 .12 2600 130 /
  1 720 55 .75 1180 70 .34 2650 130 / 1 520 55 .5 1800 70 .4 2550 130 / 1 300 55 .36 2150 70 .4 2950 130`)
const SHAPES = rows(`3.5 .6 480 7500 / 1.3 -.25 1200 11500 / 2.6 -.3 900 9500 /
  1.6 .2 1300 7000 / 2.1 -.5 900 11000 / 2.7 .4 560 9500`)
const SIXTY_DB = 6.907755
const PARAMS =
  'source opposite form colour attack release tire depth recover after length rise edge seep'
export type EyeSettings = Record<string, number>
export const eyeSettings = (value: (name: string) => number): EyeSettings =>
  Object.fromEntries(PARAMS.split(' ').map((name) => [name, value(name)]))
const sweep = (from: number, to: number, t: number) => from * Math.pow(to / from, t)
const roof = (hz: number, corner: number) => 1 / (1 + (hz / corner) ** 2)
/** `tune_source`, `weigh_source`: a key's partials, how long each rings, how strong it is, how tired it can get. */
export function eyeSource({ source, form, colour }: EyeSettings, hz: number, gain: number) {
  const octaves = Math.log2(261.6256 / hz)
  const bright = clamp(colour + 0.35 * (gain - 0.7), 0, 1.2)
  const [x, v] = [2 * form, Math.min(form, 1) * 3.9999]
  const [from, to] = [VOWELS[Math.floor(v)], VOWELS[Math.floor(v) + 1]]
  const mouth = [0, 3, 6].map((f) => [
    lerp(from[f], to[f], v % 1) * (f ? 0.4 + 1.1 * bright : 1),
    sweep(from[f + 1], to[f + 1], v % 1),
    from[f + 2],
  ])
  const [dark, light, low, high] = SHAPES[source]
  const t = source === 2 ? clamp((bright + form) / 2, 0, 1) : bright
  const lean = clamp(0.16 * octaves, -0.3, 0.3) * [1, 1, -0.5, 1, 0.6, 1][source]
  const corner = sweep(low, high, bright) * (source === 5 ? sweep(1.6, 0.6, form) : 1)
  const damp = lerp(0.65, 0.18, Math.min(1, x)) * (1.4 - 0.8 * colour)
  const made = Array.from({ length: [32, 32, 12, 32, 16, 32][source] }, (_, k) => {
    const [n, m, even] = [k + 1, k >> 1, k % 2 === 1]
    const bar = x < 1 ? sweep(BAR[m], BELL[m], x) : sweep(BELL[m], GLASS[m], x - 1)
    const wire = n * Math.sqrt((1 + 6e-5 * n * n) / (1 + 6e-5))
    const ratio = [n, n, BOWL[m], n, bar, wire][source]
    const bell = (x < 1 ? lerp(1.7, 18, x) : lerp(18, 8, x - 1)) / (1 + damp * (ratio - 1))
    const string = lerp(11, 2.4, form) / (1 + (0.42 - 0.3 * colour) * (n - 1))
    const ring = source < 4 ? Infinity : [bell, string][source - 4]
    const octave = (k > 0 && n <= 16 && Math.log2(n) % 1 === 0 ? 4.5 : -1.6) * Math.sign(k)
    const at = hz * ratio
    const own = [
      (even ? Math.min(1, 0.05 + 1.5 * form) : 1) * (1 + octave * Math.max(form - 0.6, 0)),
      (even ? lerp(0.06, 1, form) : 1) * (k ? 1 : lerp(1, 0.3, form)),
      (m === 1 ? 0.6 + 0.9 * form : m === 2 ? 1.3 : 1) * (even ? 0.45 : 1),
      mouth.reduce((w, [level, hz_, wide]) => w + level * roof(at - hz_, wide), k ? 0.005 : 0.145),
      (m ? 1 : lerp(1, 0.75, bright)) * (even ? 0.8 : 1),
      0.04 + Math.abs(Math.sin(Math.PI * lerp(0.07, 0.49, form) * ratio)),
    ][source]
    const weight = own * Math.pow(ratio, lean - lerp(dark, light, t)) * roof(at, corner)
    return { hz: at, ring: ring * clamp(2 ** (0.4 * octaves), 0.35, 2), weight, reach: 0 }
  }).filter((one) => one.hz < 20000)
  const power = made.reduce((sum, one) => sum + one.weight ** 2, 1e-12)
  const scale = Math.sqrt(made.reduce((sum, one) => sum + one.weight, 0) * Math.sqrt(power))
  const top = Math.max(1e-6, ...made.map((one) => one.weight))
  let brightness = 0
  for (const one of made) {
    brightness += (one.weight ** 2 * Math.log2(Math.max(one.hz / hz, 1))) / power
    one.reach = ((0.75 + 0.25 * gain) * one.weight * 1.16) / (one.weight + 0.16 * top)
    one.weight /= Math.max(scale, 1e-6)
  }
  const { ring } = made.reduce((a, b) => (b.weight > a.weight ? b : a))
  return { partials: made, brightness, ring }
}
/** `mirrored`: a key's place on the other side of the keyboard, by whole octaves. */
export function eyeMirrored(hz: number): number {
  const octaves = Math.floor(2.7 * Math.log2(440 / hz) + 0.5) || (hz < 440 ? 1 : -1)
  let there = hz * 2 ** clamp(octaves, -4, 6)
  while (there > 1900) there /= 2
  while (there < 78) there *= 2
  return there
}
/** `make_image`: the partials of a key's opposite; a breath is its two bands of noise, eight rays in each. */
export function eyeImage({ source, opposite, edge }: EyeSettings, hz: number, brightness: number) {
  const there = eyeMirrored(hz) / hz
  const below = hz < 60 ? 1 : 0.5
  const dark = brightness - 0.6
  const tilt = 3.2 * (edge - 0.4) + TILTS[source] - clamp(0.8 * dark, -0.5, 1)
  const turned = 2 ** (0.3 * TILTS[source] - 0.55 * clamp(dark, -0.8, 1.6))
  const low = clamp(3.5 * hz, 700, 1800) * sweep(0.55, 1.6, edge) * turned
  const high = sweep(1900, 3700, edge) * clamp(turned, 0.6, 1.05)
  const made = Array.from({ length: 16 }, (_, k) => {
    const [m, off] = [k >> 1, ((k % 8) - 3.5) / 3]
    const [ratio, own] = [
      [2 * m + 2, EVENS[m]],
      there > 1 ? [there * GLINT[m], HIGHS[m]] : [there * (m + 1), LOWS[m]],
      [k + 2, ([0.25, 0.5][k] ?? (k % 2 ? 1 : 1.1)) / Math.sqrt(k + 2)],
      [[1, 2, 3, 5][k >> 2], [1, 0.62, 0.42, 0.24][k >> 2]],
      [((k < 8 ? low : high) / hz) * 2 ** off, k < 8 ? 1 : lerp(0.3, 0.7, edge)],
      [below * (2 * m + 1), [1, 0.3, 0.11, 0.05][m] ?? 0],
    ][opposite]
    const at = hz * ratio
    if (opposite === 4) return { hz: at, weight: own / Math.hypot(1, 1.4 * (2 ** off - 2 ** -off)) }
    const pitch = [2, there, 3, 1, 4, below][opposite]
    return { hz: at, weight: own * (ratio / pitch) ** tilt * roof(at, sweep(1100, 11000, edge)) }
  })
  const power = made.reduce((sum, one) => sum + one.weight ** 2, 1e-12)
  const centre = made.reduce((sum, one) => sum + one.weight ** 2 * one.hz, 0) / power
  const ear = clamp((Math.max(centre, 20) / 450) ** -0.28, 0.45, 1.9)
  const scale = (TRIMS[opposite] * ear) / Math.sqrt(power)
  return made.map((one) => ({ hz: one.hz, weight: one.weight * scale }))
}
/** `advance` for a lone key held and then let go for so long, in steps short where it begins and where it is let go. */
export function eyeRun(set: EyeSettings, held: number, up: number, ring = Infinity) {
  const { source, tire, rise, seep } = set
  const [struck, now] = [source > 3, { heard: 0, tired: 0, charge: 0, shown: 0 }]
  const env = (t: number, rings = Infinity) => {
    const x = struck ? 1 : clamp(Math.min(t, held) / (set.attack * ATTACKS[source]), 0, 1)
    const gone = Math.max(t - held, 0) / (set.release * RELEASES[source])
    return x * x * (3 - 2 * x) * Math.exp(-SIXTY_DB * (gone + t / rings))
  }
  const toward = (value: number, grows: number, falls: number, h: number) => {
    const up_ = now.heard > value ? grows : 0
    const end = up_ > 0 ? (now.heard * up_) / (up_ + falls) : 0
    return end + (value - end) * Math.exp(-h * (up_ + falls))
  }
  let [seen, t] = [0, 0]
  while (t < held + up) {
    const [since, end] = t < held ? [t, held] : [t - held, held + up]
    const h = Math.min(end - t, Math.max(0.004, 0.08 * since))
    now.heard = env(t + h / 2, ring)
    now.tired = toward(now.tired, (struck ? 4 : 1) / tire, 1 / set.recover, h)
    const spend = (SIXTY_DB / stays(set)) * (1 - now.heard)
    now.charge = toward(now.charge, (struck ? 3.5 : 1.4) / tire, spend, h)
    const open = seep + (1 - seep) * (1 - now.heard)
    const slow = open > seen ? 0.34 * rise * RISES[source] : Math.min(0.34 * rise, 0.08)
    seen = follow(seen, open, h, slow, slow)
    now.shown = follow(now.shown, seen, h, slow, slow)
    t = h < end - t ? t + h : end
  }
  return { ...now, env: env(held + up), heard: env(held + up, ring) }
}
const stays = (set: EyeSettings) => set.length * STAYS[set.source] * LENGTHS[set.opposite]
/** What Depth leaves of a partial as tired as that; how strong an opposite so charged is; then both. */
const [HARD, TIRED, KEY_HZ] = [0.925, 1 - Math.exp(-1), 220] // at touch 0.7; at Tire; at rest
const awake = (set: EyeSettings, tired: number) => (1 - 0.9 * set.depth * HARD * tired) ** 2
const shade = (set: EyeSettings, charge: number) => set.after ** 1.6 * charge * (2 - charge)
export function eyeLevels(set: EyeSettings, held: number, up: number, ring: number) {
  const { heard, tired, charge, shown } = eyeRun(set, held, up, ring)
  return [shade(set, charge) * shown, heard * awake(set, tired) * (1 - 0.7 * set.seep * tired)]
}
type EyeState = HeardLevel & { open: number; key: string; plan: number[][][] }
type Frame = DisplayFrame<EyeState>
const [FIRST, MOST] = [0.03, [20, 40]] // seconds: a key held, and let go
export function eyeLayout({ width, height }: Pick<DisplayView, 'width' | 'height'>) {
  const held: Box = { x: 6, y: height - 32, w: (width - 18) / 2, h: 20 }
  const eye: Box = { x: 6, y: 14, w: width - 12, h: height - 49 }
  return { eye, spans: [held, { ...held, x: held.x + held.w + 6 }] }
}
const yOfLevel = (level: number, box: Box) => box.y + box.h * (1 - level ** 0.625)
/** The keys that were played, as they are now: the newest of each pitch. */
function keysNow(frame: Frame, set: EyeSettings) {
  const newest = new Map(frame.notes.map((note) => [Math.round(note.frequency), note]))
  return [...newest.values()].slice(-12).map(({ frequency: hz, gain, age, released: up }) => {
    const source = eyeSource(set, hz, gain)
    const run = eyeRun(set, age - (up ?? 0), up ?? 0, source.ring)
    const tired = up === null ? clamp(frame.meter('tired') / HARD, 0, 1) : run.tired
    return { hz, touch: 0.28 + 0.72 * gain, age, up, ...run, tired, ...source }
  })
}
type Key = ReturnType<typeof keysNow>[number]
function drawEye(frame: Frame, set: EyeSettings, keys: readonly Key[], lids: number): void {
  const [{ ctx, colours, state }, { eye }] = [frame, eyeLayout(frame)]
  const there = Math.max(...keys.map((key) => key.heard)) * (1 - lids)
  state.open = follow(state.open, Math.sqrt(there), frame.dt, 0.06, 0.06)
  const [axis, tall, middle] = [eye.y + eye.h / 2 + 2, eye.h / 2 - 8, eye.x + eye.w / 2]
  const bends = [lerp(6, -11, state.open), 6]
  const lid = (x: number, n: number) => axis + bends[n] * (1 - ((2 * (x - middle)) / eye.w) ** 2)
  const ray = (hz: number, level: number, side: number, alpha = 1) => {
    const [x, out] = [Math.round(xOfHz(hz, eye, 50, 9000)), side ? 1 : -1]
    const [y, long] = [lid(x, side) + 2 * out, tall * Math.min(1, 1.15 * level ** 0.45)]
    const colour = side ? colours.accent : colours.ink
    if (long > 1 && hz < 9000) rule(ctx, x, y, x, y + long * out, { colour, alpha, width: 1.3 })
  }
  for (const { hz, touch, age, env, tired, charge, shown, partials, brightness } of keys) {
    const light = 1.6 * LIGHTS[set.source] * shade(set, charge) * Math.max(shown, lids) * touch
    for (const one of eyeImage(set, hz, brightness)) ray(one.hz, one.weight * light, 1)
    for (const { hz: at, weight, ring, reach } of partials) {
      const full = touch * weight * Math.exp((-SIXTY_DB * age) / ring) * env * (1 - lids)
      ray(at, full, 0, INK.rule)
      ray(at, full * awake(set, (tired * reach) / HARD) * (1 - 0.7 * set.seep * tired), 0)
    }
  }
  const xs = Array.from({ length: 33 }, (_, i) => eye.x + (eye.w * i) / 32)
  const [upper, lower] = [0, 1].map((side) => xs.map((x): Point => [x, lid(x, side)]))
  fillBetween(ctx, upper, lower, colours.ink)
  const alpha = awake(set, Math.max(0, ...keys.map((key) => (key.up === null ? key.tired : 0))))
  const [y, round] = [axis + lerp(5, -2.5, state.open), 8 * state.open]
  dot(ctx, middle, y, round, colours.ink, { alpha })
  dot(ctx, middle, y, 0.4 * round, colours.plate)
  for (const each of [upper, lower]) trace(ctx, each, { colour: colours.ink, width: 1.2 })
}
function drawPlan(frame: Frame, set: EyeSettings, newest: Key | undefined): void {
  const { ctx, colours, state } = frame
  const steps = Array.from({ length: 33 }, (_, i) => i / 32)
  const key = Object.values(set).join(' ')
  if (state.key !== key) {
    const { ring } = eyeSource(set, KEY_HZ, 0.7)
    const hold = clamp(Math.max(2 * set.tire, set.attack * ATTACKS[set.source]), 0.8, MOST[0])
    const times = MOST.map((most) => steps.map((s) => sweep(FIRST, most, s)))
    const fade = (t: number) => shade(set, 1) * Math.exp((-SIXTY_DB * t) / stays(set))
    state.plan = [
      times[0].map((t) => [awake(set, 1 - Math.exp(-t / set.tire)), ...eyeLevels(set, t, 0, ring)]),
      times[1].map((t) => [fade(t), ...eyeLevels(set, hold, t, ring)]),
    ]
    state.key = key
  }
  eyeLayout(frame).spans.forEach((box, side) => {
    for (const n of [0, 1, 2]) {
      const look = n ? { width: 1.6 } : { width: 1, alpha: INK.back, dash: [2, 2] as const }
      const y = state.plan[side].map((all) => yOfLevel(all[n], box))
      const path = y.map((at, i): Point => [box.x + steps[i] * box.w, at])
      trace(ctx, path, { colour: n === 1 ? colours.accent : colours.ink, ...look })
    }
    if (!newest || (newest.up === null) === (side === 1)) return
    const x = xOfHz(newest.up ?? newest.age, box, FIRST, MOST[side])
    rule(ctx, x, box.y, x, box.y + box.h, { colour: colours.accent })
  })
  for (const one of eyeHandles(frame))
    handle(frame, one.x, one.y, { hot: frame.hot === one.key, radius: 2.5 })
}
/** Where a key is 63 % tired, and half a time constant into its opposite's fade: along is the time, up the level. */
function eyeHandles(view: DisplayView): DisplayHandle[] {
  const set = eyeSettings((name) => view.value(name))
  return eyeLayout(view).spans.map((box, side) => {
    const [time, level] = side ? ['length', 'after'] : ['tire', 'depth']
    const x = xOfHz(side ? stays(set) / SIXTY_DB / 2 : set.tire, box, FIRST, MOST[side])
    const y = yOfLevel(side ? shade(set, 1) * Math.exp(-0.5) : awake(set, TIRED), box)
    const drag: DisplayHandle['drag'] = (toX, toY, hold = {}) => {
      const along = (MOST[side] / FIRST) ** ((toX - (hold.x ??= x)) / box.w)
      const up = clamp((box.y + box.h - toY) / box.h, 0, 1)
      const to = side ? up * Math.exp(0.3125) : (1 - up ** 0.8) / (0.9 * HARD * TIRED)
      return { [time]: (hold.time ??= set[time]) * along, [level]: to }
    }
    return { key: time, name: side ? 'After Length and Level' : 'Tire and Depth', x, y, drag }
  })
}
const closedEyes = plateDisplay<EyeState>({
  place: 'window',
  columns: 2,
  params: PARAMS.split(' '),
  live: { meters: true, signal: true, notes: true },
  info: 'Over the eye the partials of the keys, faint untired and bright as they are; under it those of their opposite. It closes as the notes go. Below, a key held and a key let go: drag the left point for Tire and Depth, the right one for After Length and After Level.',
  init: () => ({ open: 1, key: '', plan: [], heard: [], shown: 0 }),
  draw(frame) {
    ground(frame)
    const { state, colours, width, height } = frame
    const set = eyeSettings((name) => frame.value(name))
    const keys = frame.powered ? keysNow(frame, set) : []
    const run = { ...eyeRun(set, Math.max(2 * set.tire, 1), 0), env: 1, heard: 1, shown: 1 }
    const atRest = {
      ...run,
      ...eyeSource(set, KEY_HZ, 0.7),
      hz: KEY_HZ,
      touch: 0.8,
      age: 0,
      up: null,
    }
    text(frame, SOURCES[set.source], 5, 12)
    text(frame, OPPOSITES[set.opposite], width - 5, 12, { align: 'right', colour: colours.accent })
    const live = keys.length > 0
    drawEye(frame, set, live ? keys : [atRest], live ? clamp(frame.meter('lids'), 0, 1) : 0)
    drawPlan(frame, set, live ? keys.reduce((a, b) => (b.age < a.age ? b : a)) : undefined)
    levelFoot(frame, { x: 4, y: height - 8, w: width - 8, h: 4 }, meanOutShare(state, frame, 1))
  },
  handles: eyeHandles,
})
export const CLOSED_EYES_FACES: Readonly<Record<string, PlateFace>> = {
  'closed-eyes': {
    display: closedEyes,
    face: ['source', 'opposite', 'form', 'blink'],
    labels: { after: 'After', length: 'Length', rise: 'Rise', blinkRate: 'Rate' },
    sections: [
      ['source', 'form', 'colour', 'air', 'attack', 'release'],
      ['tire', 'depth', 'recover', 'memory'],
      ['opposite', 'after', 'length', 'rise', 'edge', 'seep', 'safe'],
      ['drift', 'blink', 'blinkRate', 'width', 'volume'],
    ],
  },
}
