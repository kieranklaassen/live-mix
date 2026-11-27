// The display of Bent Blade: the blade from the side, its curvature growing evenly to both sides
// of where it turns over, with the notes trapped there as the blade swings with them: faint at
// rest, lit while one sounds. The dots at its ends are the twelve modes of plain steel. Right, the
// trapped notes by pitch, a column for each bend: a rung runs from the note's own place to where
// Concord draws it, as long as it is loud. Below, how much of a key is in the first bend (up) and
// in the second (down), as a key begins or in the last four seconds; then the keys that are down.
// The arithmetic is the device's own (`cpp/devices/bent-blade/bent_blade.h`), under its names.

import * as kit from '../display-kit'
import { INK, clamp, lerp, type Box, type Point } from '../display-kit'
import { plateDisplay, type DisplayFrame, type PlateFace } from '../plate-display'
import { type DisplayHandle, type DisplayView } from '../plate-display'
import { levelFoot, meanOutShare, xOfPitch, type HeardLevel } from './instrument-parts'

/** A parameter's value by its name. */
type Knobs = (name: string) => number

const LEVELS = [1.0604, 3.7997, 7.4557, 11.6447, 16.2618, 21.2384, 26.5285, 32.0986]
const EXCITERS = ['Bow', 'Mallet', 'Thumb', 'Breath']
const WELLS = ['One bend', 'Twin', 'Fifth', 'Octave']
/** For each second bend: `kPace`, its place against the first, `kNear`. */
const PACE = [0, 1, 0.6, 1.5]
const PLACE = [1, 1, 1.5, 0.5]
const NEAR = [1, 0.9, 0.45, 0.35]
/** `slope`: its foot, what Edge and Pressure add, its least and its most, for each exciter. */
const SLOPE = [
  [0.14, 0.64, 0.2, 0.03, 0.94],
  [0.08, 0.78, 0.25, 0.03, 0.97],
  [0.36, 0.5, 0.15, 0.1, 0.98],
  [0.4, 0.45, 0.15, 0.03, 0.95],
]
const OPEN = [1, 2, 4, 8].flatMap((octave) => [1, 1.125, 4 / 3, 1.5].map((step) => octave * step))
const drawn = (v: Knobs): boolean => v('exciter') === 0 || v('exciter') === 3

/** Where a trapped note lies by itself, as a ratio of the note played. */
export function bladeOwn(wellWidth: number, n: number): number {
  const floor = -0.8 + 0.1 * Math.exp(4.6 * wellWidth)
  return Math.sqrt((LEVELS[n] + floor) / (LEVELS[0] + floor))
}

/** `refresh_common`, `far_place`: where Concord has every trapped note, in both bends. */
export function bladeRatios(v: Knobs): { near: number[]; far: number[] } {
  const drawnIn = 1 - (1 - v('concord')) ** 2
  const well = v('secondWell')
  let last = 1
  const near = LEVELS.map((_, n) => {
    const own = bladeOwn(v('wellWidth'), n)
    const apart = (place: number): number => Math.abs(Math.log2(place / own))
    const open = OPEN.filter((place) => place > last * 1.01)
    if (n > 0) last = open.reduce((a, b) => (apart(b) < apart(a) ? b : a), open[0] ?? own)
    return Math.pow(2, lerp(Math.log2(own), Math.log2(last), drawnIn))
  })
  // The second bend is kept to its four lowest notes, the last of a fifth's the tone under both.
  const place = (ratio: number, n: number): number =>
    well === 2 && n === 3 ? 0.5 : PLACE[well] * Math.pow(ratio, lerp(1.05, 1, drawnIn))
  return { near, far: well === 0 ? [] : near.slice(0, 4).map(place) }
}

/** `trapped`: how well the bend holds a note. */
export const bladeTrapped = (bend: number, n: number): number =>
  1 / (1 + Math.exp(-2.4 * (0.75 + 7.4 * bend - n)))

/** `slope`, `weights`: how loud a key at gain 0.7 has each trapped note. */
export function bladeLevels(v: Knobs): number[] {
  const [foot, edge, push, least, most] = SLOPE[v('exciter')]
  const slope = clamp(foot + edge * v('edge') + push * v('pressure'), least, most)
  const fall = clamp(slope + 0.36 * (v('bend') - 0.5), 0.03, 0.97)
  const levels = LEVELS.map((_, n) => {
    const off = n - 2.21 * v('edge')
    const wind = v('exciter') === 3 ? (n ? 0.12 : 0.4) + 1.1 / (1 + 1.6 * off * off) : 1
    const upper = n ? (1.15 - 0.5 * v('leak')) * (v('exciter') === 2 && n % 2 ? 1.25 : 1) : 1
    return Math.pow(fall, n) * wind * bladeTrapped(v('bend'), n) * upper
  })
  const even = Math.pow(Math.max(Math.hypot(...levels) ** 2, 0.01), 0.42)
  const kept = (0.45 + 0.55 * Math.min(2 * v('bend'), 1)) * (drawn(v) ? 1 - 0.45 * v('leak') : 1)
  return levels.map((level) => (level * kept) / even)
}

/** `place`: how loudly the two bends are heard, the second against its own most, the louder 1. */
export function bladeHeard(v: Knobs): [number, number] {
  if (v('secondWell') === 0) return [1, 0]
  const far = v('farWell')
  const across = 0.5 * Math.PI * far * (0.75 + 0.25 * far)
  const step = lerp(1, NEAR[v('secondWell')], Math.min(2 * far, 1))
  const near = step * (0.2 + 0.8 * Math.cos(across))
  const most = Math.max(near, Math.sin(across))
  return [near / most, Math.sin(across) / most]
}

/** `tune`, `regulate`: how much of a key is in the two bends `t` seconds on, against all of it. */
export function bladeTrade(v: Knobs, hz: number, t: number): [number, number] {
  const size = clamp(Math.pow(hz / 220, -0.3), 0.4, 1.7) * (v('exciter') === 2 ? 0.42 : 1)
  const ring = 60 * Math.exp(-4.7 * v('leak')) * (0.3 + 0.7 * v('bend')) * size
  const seconds = Math.max(ring * bladeTrapped(v('bend'), 0) ** 2, 0.02)
  const rise = clamp(t / Math.max(v('swell'), 0.003), 0, 1)
  const much = drawn(v) ? rise * rise * (3 - 2 * rise) : Math.exp((-6.907755279 * t) / seconds)
  const phase = 2 * Math.PI * v('tunnel') * PACE[v('secondWell')] * Math.pow(hz / 220, 0.4) * t
  // `kAsymmetry`: the two notes a note is split in are 0.6 and 0.4 of it in the first bend.
  return [much * Math.sqrt(0.52 + 0.48 * Math.cos(phase)), much * Math.abs(Math.sin(phase / 2))]
}

const [PIECES, HIGH_OCT, OCTAVES] = [40, 3.45, 4.55]
export const BLADE_TRADE_SEC = 4

export function bladePlaces({ width, height }: Pick<DisplayView, 'width' | 'height'>) {
  const [x, w, y] = [4, width - 8, 15]
  const ladder = Math.round(clamp(w * 0.29, 30, 52))
  return {
    blade: { x: 5, y, w: w - ladder - 9, h: height - 49 },
    ladder: { x: x + w - ladder, y, w: ladder, h: height - 49 },
    trade: { x, y: height - 34, w, h: 18 },
    keys: { x, y: height - 14, w, h: 5 },
    foot: { x, y: height - 8, w, h: 4 },
  }
}

export type BladePiece = { x: number; y: number; nx: number; ny: number; along: number }

/** The blade, tip to tip, its slope the sum of an evenly growing curvature; `n` is square to it. */
export function bladeLine(bend: number, well: number, box: Box): BladePiece[] {
  const depth = (0.75 + 7.4 * bend) / 8.15
  const right = [1, 1, 0.8, 1.3][well]
  const slope = (u: number): number =>
    depth * (well === 0 ? -2.7 * u * u : 16 * (0.43 * u - (u * Math.abs(u)) / 2))
  const line: BladePiece[] = []
  let [x, y] = [0, 0]
  for (let i = -PIECES; i <= PIECES; i++) {
    const along = i / PIECES
    const middle = slope(along - 0.5 / PIECES)
    const long = (well > 0 && i > 0 ? right : 1) / PIECES
    if (i > -PIECES) [x, y] = [x + Math.cos(middle) * long, y - Math.sin(middle) * long]
    line.push({ x, y, nx: -Math.sin(slope(along)), ny: -Math.cos(slope(along)), along })
  }
  const [xs, ys] = [line.map((piece) => piece.x), line.map((piece) => piece.y)]
  const middleOf = (all: number[]): number => (Math.min(...all) + Math.max(...all)) / 2
  const size = box.w / (1.02 * (1 + right))
  const up = Math.min(size * 2.2, (box.h * 0.78) / (Math.max(...ys) - Math.min(...ys)))
  for (const piece of line) {
    piece.x = box.x + box.w / 2 + (piece.x - middleOf(xs)) * size
    piece.y = box.y + box.h / 2 + (piece.y - middleOf(ys)) * up
  }
  return line
}

/** How the blade swings with trapped note `n`, `x` widths of the lowest from where it turns. */
export const bladeShape = (n: number, x: number): number =>
  [1, Math.SQRT2 * x, (2 * x * x - 1) * Math.SQRT1_2, (2 * x ** 3 - 3 * x) / Math.sqrt(3)][n] *
  Math.exp(-0.5 * x * x)

export const bladeRungY = (ratio: number, ladder: Box): number =>
  ladder.y + (ladder.h * (HIGH_OCT - Math.log2(ratio))) / OCTAVES

/** The Well Width that puts the second trapped note at a height of the ladder: `bladeOwn` back. */
export function bladeWidthAt(y: number, ladder: Box): number {
  const square = Math.max(4 ** (HIGH_OCT - ((y - ladder.y) / ladder.h) * OCTAVES), 1.0001)
  const floor = (LEVELS[1] - square * LEVELS[0]) / (square - 1)
  return clamp(Math.log(Math.max(floor + 0.8, 0.1) / 0.1) / 4.6, 0, 1)
}

/** What was in either bend, how brightly each is lit, where the knee is, and when last heard of. */
type Seen = { past: readonly kit.History[]; lit: [number, number]; shake: number; at: number }
type Frame = DisplayFrame<HeardLevel & Seen>

function readings(frame: Frame, heard: [number, number]): void {
  const { state, dt, now } = frame
  const read = (name: string): number => (frame.powered ? frame.meter(name) : 0)
  ;[read('near'), read('far')].forEach((level, i) => {
    const share = heard[i] * clamp(Math.sqrt(Math.max(level, 0)) / 0.9, 0, 1)
    // A shiver of many times a second is drawn as what it comes to: both bends lit.
    state.lit[i] = kit.follow(state.lit[i], share, dt, 0.05, 0.12)
    if (share > 0.004) state.at = now
    if (dt > 0) state.past[i].push(now, share)
  })
  state.shake = kit.follow(state.shake, clamp(read('shake'), -1, 1), dt, 0.05, 0.05)
}

function drawBlade({ ctx, colours, state, now }: Frame, v: Knobs, box: Box): void {
  const well = v('secondWell')
  const [line, levels] = [bladeLine(v('bend'), well, box), bladeLevels(v).slice(0, 4)]
  const turned = bladeRatios(v).near.map((ratio) => Math.cos(3.8 * Math.min(ratio, 4) * now))
  const wide = (well === 0 ? 0.13 : 0.09) + 0.11 * v('wellWidth')
  const off = (at: BladePiece, by: number): Point => [at.x + at.nx * by, at.y + at.ny * by]
  ;(well === 0 ? [0] : [-0.43, 0.43]).forEach((turn, i) => {
    const swung = (much: number, shake: number, wave: (parts: number[]) => number): Point[] =>
      line.flatMap((piece) => {
        const x = (piece.along - turn) / wide - 0.8 * shake
        if (Math.abs(x) > 4.5) return []
        const size = wave(levels.map((level, n) => level * bladeShape(n, x)))
        return [off(piece, box.h * (well === 0 ? 0.3 : 0.22) * much * size)]
      })
    const fill = (much: number, shake: number, colour: string, alpha: number): void => {
      const [upper, lower] = [much, -much].map((each) =>
        swung(each, shake, (parts) => Math.hypot(...parts)),
      )
      kit.fillBetween(ctx, upper, lower, colour, alpha)
    }
    fill(Math.max(bladeHeard(v)[i], 0.15), 0, colours.ink, 0.28)
    const lit = 1.5 * state.lit[i]
    if (lit < 0.02) return
    fill(lit, state.shake, colours.accent, INK.back)
    const sum = (parts: number[]): number => parts.reduce((a, part, n) => a + part * turned[n], 0)
    kit.trace(ctx, swung(lit, state.shake, sum), { colour: colours.accent })
  })
  const lively = clamp(10 * (state.lit[0] + state.lit[1]), 0, 1)
  const loose = (1.4 - 0.95 * v('bend')) * (0.8 + 0.5 * v('leak'))
  const clang = Math.sqrt(0.55 * Math.sqrt(v('steel')) * (0.15 + 0.85 * v('steel')) * loose)
  for (let j = 0; j < 12; j++) {
    const row = Math.floor(j / 2)
    const piece = line[j % 2 ? 2 * PIECES - 2 - 2 * row : 2 + 2 * row]
    const glint = 1 + 0.6 * lively * Math.sin(2 * Math.PI * ((0.21 + 0.037 * j) * now + 0.37 * j))
    const size = clang * Math.pow(0.72 + 0.24 * v('edge'), row) * glint
    kit.dot(ctx, ...off(piece, row % 2 ? -4 : 4), 0.4 + 1.8 * size, colours.ink, { alpha: 0.7 })
  }
  const steel = line.map(({ x, y }): Point => [x, y])
  kit.trace(ctx, steel, { colour: colours.ink, width: 2 })
}

function drawLadder({ ctx, colours, state }: Frame, v: Knobs, box: Box): void {
  const ratios = bladeRatios(v)
  const [levels, played] = [bladeLevels(v), bladeRungY(1, box)]
  kit.rule(ctx, box.x, played, box.x + box.w, played, { colour: colours.ink, alpha: INK.rule })
  const room = v('secondWell') === 0 ? box.w - 5 : (box.w - 9) / 2
  ;[ratios.near, ratios.far].forEach((column, i) =>
    column.forEach((ratio, n) => {
      const held = bladeTrapped(v('bend'), n)
      const y = bladeRungY(ratio, box)
      if (y < box.y || held < 0.02) return
      const x = box.x + 5 + i * (room + 4)
      const long = 2 + (room - 2) * clamp(1 + Math.log10(levels[n]) / 1.6, 0, 1)
      const own: Point[] = i ? [] : [[box.x, bladeRungY(bladeOwn(v('wellWidth'), n), box)]]
      const style = { colour: colours.ink, width: 1, alpha: 0.3 + 0.7 * held }
      kit.trace(ctx, [...own, [x, y], [x + long, y]], style)
      const lit = { x, y: kit.crisp(y) - 1, w: long * clamp(1.4 * state.lit[i] * held, 0, 1), h: 2 }
      kit.fillRect(ctx, lit, colours.accent)
    }),
  )
}

function drawTrade({ ctx, colours, state, now }: Frame, v: Knobs, box: Box): void {
  const [middle, heard] = [box.y + box.h / 2, bladeHeard(v)]
  const live = now - state.at < BLADE_TRADE_SEC
  ;[colours.ink, colours.accent].forEach((colour, i) => {
    const y = (share: number): number => middle - (i ? -1 : 1) * (box.h / 2) * share
    const begins = Array.from({ length: Math.floor(box.w) + 1 }, (_, x): Point => {
      const share = bladeTrade(v, 220, (x / box.w) * BLADE_TRADE_SEC)[i]
      return [box.x + x, y(0.9 * heard[i] * share)]
    })
    const points = live ? state.past[i].points(box, y) : begins
    kit.fillTo(ctx, points, middle, colour, live ? 1 : INK.back)
  })
  kit.rule(ctx, box.x, middle, box.x + box.w, middle, { colour: colours.ink, alpha: INK.back })
}

function drawKeys({ ctx, colours, notes }: Frame, pitch: number, box: Box): void {
  const middle = box.y + box.h / 2
  const place = (hz: number): number => xOfPitch(hz, box, 60, 1400)
  const down = notes.filter((note) => note.released === null).map((note) => place(note.frequency))
  for (const x of down) kit.fillRect(ctx, { x: x - 1, y: box.y, w: 2, h: box.h }, colours.ink)
  if (!(pitch >= 8)) return
  const x = place(pitch)
  const to = down.at(-1) ?? x
  kit.rule(ctx, x, middle, to, middle, { colour: colours.accent, width: 2 })
  kit.dot(ctx, x, middle, 2.5, colours.accent, { ring: colours.plate })
}

export function bladeHandles(view: DisplayView): DisplayHandle[] {
  const { blade, ladder } = bladePlaces(view)
  const tip = (bend: number): BladePiece => bladeLine(bend, view.value('secondWell'), blade)[0]
  /** The bend that brings the left tip of the blade nearest a place. */
  const bend = (x: number, y: number) => {
    const all = Array.from({ length: 101 }, (_, i) => tip(i / 100))
    const apart = all.map((at) => Math.hypot(at.x - x, at.y - y))
    return { bend: apart.indexOf(Math.min(...apart)) / 100 }
  }
  const width = (_x: number, y: number) => ({ wellWidth: bladeWidthAt(y, ladder) })
  const { x, y } = tip(view.value('bend'))
  const second = bladeRungY(bladeOwn(view.value('wellWidth'), 1), ladder)
  return [
    { key: 'bend', name: 'Bend', x, y, drag: bend },
    { key: 'wellWidth', name: 'Well Width', x: ladder.x, y: second, drag: width },
  ]
}

const READ =
  'exciter bend wellWidth concord secondWell farWell tunnel pressure swell leak steel edge'

const bentBlade = plateDisplay<HeardLevel & Seen>({
  place: 'window',
  columns: 2,
  params: READ.split(' '),
  live: { meters: true, signal: true, notes: true },
  info: 'The blade as it is bent, lit where its curve keeps the note; drag its tip for Bend. Right, the trapped notes by pitch; drag the second for Well Width. Below, the sound passing from the first bend (up) to the second (down), then the keys, the newest where its slide is.',
  init: () => {
    const past = (): kit.History => new kit.History(BLADE_TRADE_SEC, 96, 0, 'max')
    return { past: [past(), past()], lit: [0, 0], shake: 0, at: -1e9, heard: [], shown: 0 }
  },
  draw(frame) {
    const v: Knobs = (name) => frame.value(name)
    const places = bladePlaces(frame)
    kit.ground(frame)
    readings(frame, bladeHeard(v))
    kit.text(frame, EXCITERS[v('exciter')], 5, 12)
    kit.text(frame, WELLS[v('secondWell')], frame.width - 5, 12, { align: 'right' })
    drawTrade(frame, v, places.trade)
    drawLadder(frame, v, places.ladder)
    drawBlade(frame, v, places.blade)
    drawKeys(frame, frame.powered ? frame.meter('pitch') : 0, places.keys)
    levelFoot(frame, places.foot, meanOutShare(frame.state, frame, 1))
    for (const { key, x, y } of bladeHandles(frame))
      kit.handle(frame, x, y, { hot: frame.hot === key, radius: 2.5 })
  },
  handles: bladeHandles,
})

export const BENT_BLADE_FACES: Readonly<Record<string, PlateFace>> = {
  'bent-blade': {
    display: bentBlade,
    face: ['bend', 'secondWell', 'tunnel', 'glide'],
    labels: { wellWidth: 'Well', secondWell: 'Second', farWell: 'Far', glideLaw: 'Law' },
    sections: [
      ['exciter', 'pressure', 'rasp', 'swell'],
      ['bend', 'wellWidth', 'concord', 'leak', 'damp'],
      ['secondWell', 'farWell', 'tunnel'],
      ['steel', 'edge'],
      ['tremble', 'rate', 'wander', 'glide', 'glideLaw'],
      ['width', 'volume'],
    ],
  },
}
