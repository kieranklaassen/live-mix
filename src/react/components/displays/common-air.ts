// The display of Common Air: the pressure over one breath, its turn and the
// next, and under it the small air volume of every key, low keys left, with a
// tick at the pressure its reed needs. The tongue on it sweeps as far as the reed
// swings and leans as it sags; arcs join keys that pull each other into step.
// The arithmetic is the device's own: the lung is reported, the small volumes are
// worked out from it and the notes, the order at the middle of what a breath draws.

import {
  INK,
  clamp,
  dot,
  fillRect,
  fillTo,
  follow,
  ground,
  handle,
  lerp,
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
import { hzOfKey, keyOfHz, levelFoot, meanOutShare, type HeardLevel } from './instrument-parts'

/** `ReedShape`: the pressure a reed needs, how its swing rises over that, its bend and its ring; and its line. */
export const AIR_REEDS = [
  { name: 'Brass', need: 0.04, rise: 0.58, bend: 1, ring: 1, thick: 1.5 },
  { name: 'Cane', need: 0.01, rise: 0.36, bend: 1.2, ring: 0.4, thick: 2.5 },
  { name: 'Steel', need: 0.12, rise: 0.95, bend: 0.4, ring: 2.8, thick: 1 },
  { name: 'Paper', need: 0, rise: 0.9, bend: 1.8, ring: 2.2, thick: 2 },
] as const
const PIPES = ['chest', 'stopped', 'open', 'cone'] as const
const BREATHS = ['Out', 'In', 'Both', 'Circular', 'Once'] as const
const [OUT, IN, BOTH, CIRCULAR, ONCE] = [0, 1, 2, 3, 4]
/** `find_pairs`: the ratios two reeds lean into. */
const PAIRS = '1/1 6/5 5/4 4/3 3/2 8/5 5/3 2/1 12/5 5/2 3/1 4/1 6/1'.split(' ')

/** The knobs as the device applies them: a turn is no longer than its breath can bear, nor an attack. */
export function airSettings(value: (name: string) => number) {
  const choice = (name: string, most: number) => clamp(Math.round(value(name)), 0, most)
  const breath = choice('breath', 4)
  const lung = Math.max(value('lung'), 0.01)
  const turn = value('turn') / (1 + value('turn') / (2.5 * lung))
  const bear = breath === CIRCULAR ? Infinity : breath === ONCE ? 0.25 * lung : 0.8 * lung
  const attack = value('attack') / (1 + value('attack') / bear)
  const sniff = Math.min(0.5, (0.45 * turn) / lung)
  const shut = (breath === OUT ? 0.8 : breath === IN ? 0.5 : 0.28) * turn
  const reed = AIR_REEDS[choice('reed', 3)]
  return { reed, breath, lung, turn, shut, sniff, attack, starve: value('starve') }
}
export type AirSettings = ReturnType<typeof airSettings>
const cosine = (turns: number): number => Math.cos(2 * Math.PI * turns)
/** `Breath::curve`: the pressure with so much air left, or at that place in a circular round. */
export function airCurve(set: AirSettings, air: number, way: number, cheek: number): number {
  const spent = 1 - air
  const bent = Math.pow(spent, 1.5)
  if (set.breath === OUT) return 1 - 0.9 * bent
  if (set.breath === IN) return 0.3 + 0.75 * bent
  if (set.breath === ONCE) return air
  const swell = 0.78 + 0.3 * Math.sin(Math.PI * Math.sqrt(spent)) - 0.42 * spent * spent
  if (set.breath === BOTH) return way > 0 ? 1 - 0.5 * bent : swell
  const into = (cheek - 0.15) / set.sniff
  const sniff = into > 0 && into < 1 ? 0.5 - 0.5 * cosine(into) : 0
  return (0.92 - 0.08 * cosine(cheek - 0.25)) * (1 - 0.3 * sniff)
}
/** The parts of the picture above: once holds before it falls. */
const partsOf = (breath: number): readonly ('lung' | 'turn')[] =>
  breath === ONCE ? ['turn', 'lung'] : ['lung', 'turn', 'lung']
const STEPS = 64

/** `Breath::tick` for a lone key from silence (a round from the end of its sniff): what is drawn above. */
export function airBreath(set: AirSettings) {
  const [round, once] = [set.breath === CIRCULAR, set.breath === ONCE]
  const lag = once ? 0.003 : 0.006 + 0.085 * set.turn
  let [air, time, cheek] = [1, 0, round ? 0.15 + set.sniff : 0]
  let [first, pressure] = Array<number>(2).fill(airCurve(set, 1, 1, cheek))
  return partsOf(set.breath).flatMap((kind, part) => {
    let long = kind === 'lung' ? set.lung : once ? 0.5 * set.turn : set.shut
    if (round) long = set.lung * (kind === 'turn' ? set.sniff : 1 - set.sniff)
    return Array.from({ length: STEPS + 1 }, (_, i) => {
      const dt = i === 0 ? 0 : long / STEPS
      time += dt
      cheek = (cheek + dt / set.lung) % 1
      if (once) air *= Math.exp((-4 * Math.min(1, time / (0.5 * set.turn)) * dt) / set.lung)
      else if (!round) air = kind === 'lung' ? 1 - i / STEPS : 0
      const shut = kind === 'turn' && !round && !once
      const target = shut ? 0 : airCurve(set, air, part === 2 ? -1 : 1, cheek)
      // Two equal lags, in four steps so that one longer than they are still lands.
      for (let n = 0; n < 4; n++) {
        first = follow(first, target, dt / 4, lag, lag)
        pressure = follow(pressure, first, dt / 4, lag, lag)
      }
      return { part, along: i / STEPS, time, air, pressure }
    })
  })
}
/** How late a key is at `rank` in the order, and the pressure under which it is silent. */
export function airUnder(set: AirSettings, rank: number): { late: number; under: number } {
  const [starve, round] = [Math.abs(set.starve), set.breath === CIRCULAR]
  const late = (round ? starve * (1.9 - 0.9 * starve) : starve) * rank
  return { late, under: set.reed.need + late * (round ? 0.94 : 0.35 * (1 + starve)) }
}
/** How far a reed swings in the end with that air. */
export const airSwing = (set: AirSettings, air: number, under: number): number =>
  Math.pow(clamp((air - under) / (1 - Math.min(under, 0.7)), 0, 1.2), set.reed.rise)
/** The cents a key's reed gives way by with that air. */
export function airSag(reed: AirSettings['reed'], sag: number, hz: number, air: number): number {
  const own = 0.35 + 1.3 * (((12 * Math.log2(hz / 440) + 120) * 0.618034) % 1)
  return Math.min(140, sag * Math.pow(1 - clamp(air, 0, 1), 1.5) * own * reed.bend)
}
/** The weight two keys lean on each other with; 0 for two that do not. */
export function airPair(low: number, high: number): number {
  const cents = Math.abs(1200 * Math.log2(high / low))
  const all = PAIRS.map((pair) => pair.split('/').map(Number))
  const found = all.find(([p, q]) => Math.abs(cents - 1200 * Math.log2(p / q)) <= 35)
  return found ? Math.min(1, 1.6 / (1 + 0.175 * (found[0] + found[1]))) : 0
}
/** A key as the display follows it: its place in the order, its small air volume and its swing. */
const reedOf = (key: string, hz: number, pressure: number) => {
  const air = Math.max(0.62, Math.min(1, pressure))
  return { key, hz, age: 1, down: true, gate: 1, rank: 0, seat: 0, air, swing: 0.03 }
}
type Reed = ReturnType<typeof reedOf>
const atRest = () => ({ cheek: 0, way: 1, inward: 0, company: 0, parted: false, shut: 0 })
type AirState = HeardLevel & ReturnType<typeof atRest> & { reeds: Reed[] }
type Frame = DisplayFrame<AirState>
/** A key's place among the held ones, low to high, or high to low with Starve to the left. */
const rankOf = (set: AirSettings, place: number, keys: number): number =>
  keys < 2 ? 0 : (set.starve < 0 ? keys - 1 - place : place) / (keys - 1)
/** `control_lane`: a reed's air after the root, its swing after its air. */
function stepReed(set: AirSettings, state: AirState, reed: Reed, root: number, dt: number): void {
  const wave = 0.5 - 0.5 * cosine(state.cheek + 1 - 0.8 * reed.rank)
  const turned = lerp(lerp(reed.rank, 1 - reed.rank, state.inward), 0.5, 0.3)
  const rank = state.company * (set.breath === CIRCULAR ? wave * wave * (3 - 2 * wave) : turned)
  const { late, under } = airUnder(set, rank)
  const empties = 0.16 + (0.3 + 0.45 * Math.abs(set.starve)) * (1 - rank)
  const fills = 0.012 + set.turn * (0.05 + 1.6 * late)
  reed.air = follow(reed.air, root, dt, fills, 0.02 + (state.parted ? set.turn * empties : 0))
  reed.seat = under
  const aim = airSwing(set, reed.air, under)
  const grow = (5 * dt) / (set.attack * (1 + 4 * late))
  if (aim <= reed.swing)
    reed.swing = follow(reed.swing, aim, dt, 0, 0.02 + (set.breath === ONCE ? 0 : 0.1 * set.turn))
  else reed.swing += (reed.swing + 0.02) * (aim - reed.swing) * Math.min(0.8, grow)
}
/** Takes in the notes and the lung's readings of this frame, and brings every reed up to it. */
function breathe(frame: Frame, set: AirSettings): void {
  const { state, dt } = frame
  const root = clamp(frame.meter('pressure'), 0, MOST_AIR)
  const air = clamp(frame.meter('air'), 0, 1)
  if (Math.abs(frame.meter('way')) > 0.02) state.way = Math.sign(frame.meter('way'))
  if (state.reeds.length === 0) Object.assign(state, atRest(), { way: state.way })
  const now = new Map<string, Reed>()
  for (const { id, frequency: hz, age, released } of frame.notes) {
    const gate = Math.exp((-6.9078 * (released ?? 0)) / (frame.value('release') * set.reed.ring))
    const key = `${id}@${hz.toFixed(2)}`
    const reed = state.reeds.find((one) => one.key === key) ?? reedOf(key, hz, root)
    if (gate > 0.02) now.set(key, Object.assign(reed, { age, gate, down: released === null }))
  }
  state.reeds = [...now.values()].slice(-16).sort((a, b) => a.hz - b.hz)
  const held = state.reeds.filter((reed) => reed.down)
  state.shut = air <= 0 && set.breath <= BOTH ? state.shut + dt : 0
  const back = root > 0.85 * airCurve(set, air, state.way, state.cheek)
  state.parted = state.shut > 0 || (state.parted && !back)
  state.cheek = (state.cheek + dt / set.lung) % 1
  const slow = 0.03 + 0.2 * set.turn
  state.inward = follow(state.inward, (1 - state.way) / 2, dt, slow, slow)
  state.company = follow(state.company, Number(held.length > 1), dt, 0.12, 0.12)
  held.forEach((reed, place) => (reed.rank = rankOf(set, place, held.length)))
  for (const reed of state.reeds) stepReed(set, state, reed, root, dt)
}
/** Five keys under a full breath, as they stand in the end: what the picture shows at rest. */
const resting = (set: AirSettings): Reed[] =>
  [50, 57, 65, 72, 76].map((key, i) => {
    const seat = airUnder(set, rankOf(set, i, 5)).under
    return { ...reedOf(String(key), hzOfKey(key), 1), seat, swing: airSwing(set, 1, seat) }
  })
const tens = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const MOST_AIR = 1.1
/** The widths a breath and a turn have at the two ends of their knobs, as shares of the picture. */
const WIDE = { lung: [0.14, 0.4], turn: [0.07, 0.2] } as const
const yOfAir = (air: number, box: Box) => box.y + box.h * (1 - clamp(air / MOST_AIR, 0, 1))
export function airLayout({ width, height }: Pick<DisplayView, 'width' | 'height'>) {
  const foot: Box = { x: 4, y: height - 8, w: width - 8, h: 4 }
  const wells: Box = { ...foot, y: height - 33, h: 22 }
  return { breath: { x: 6, y: 17, w: width - 14, h: 15 }, wells, foot }
}
/** Where each part of the breath begins, and where the last ends. */
export function airEdges(view: DisplayView): number[] {
  const { breath } = airLayout(view)
  const edges = [breath.x]
  for (const kind of partsOf(Math.round(view.value('breath'))))
    edges.push(
      edges[edges.length - 1] + lerp(WIDE[kind][0], WIDE[kind][1], view.at(kind)) * breath.w,
    )
  return edges
}
/** Where in the picture's parts the breath is now: the part, and how far along it. */
function placeNow({ state }: Frame, set: AirSettings, air: number): [number, number] {
  const fallen = airBreath(set).find((one) => one.air <= air)
  if (set.breath === ONCE) return [fallen?.part ?? 1, fallen?.along ?? 1]
  const into = (state.cheek + 0.85) % 1
  if (set.breath === CIRCULAR && into < set.sniff) return [1, into / set.sniff]
  if (set.breath === CIRCULAR) return [0, (into - set.sniff) / (1 - set.sniff)]
  if (air <= 0) return [1, clamp(state.shut / set.shut, 0, 1)]
  return [set.breath === BOTH && state.way < 0 ? 2 : 0, 1 - air]
}
function drawBreath(frame: Frame, set: AirSettings, live: boolean): void {
  const { ctx, colours } = frame
  const { breath: box } = airLayout(frame)
  const foot = box.y + box.h
  const edges = airEdges(frame)
  const xOf = (part: number, along: number): number => lerp(edges[part], edges[part + 1], along)
  const path: Point[] = airBreath(set).map((p) => [xOf(p.part, p.along), yOfAir(p.pressure, box)])
  fillTo(ctx, path, foot, colours.ink)
  trace(ctx, path, { colour: colours.ink })
  for (const { key, x, y } of airHandles(frame))
    handle(frame, x, y, { hot: frame.hot === key, radius: 2.5 })
  if (!live) return
  const x = xOf(...placeNow(frame, set, clamp(frame.meter('air'), 0, 1)))
  const y = yOfAir(frame.meter('pressure'), box)
  rule(ctx, x, y, x, foot, { colour: colours.accent })
  dot(ctx, x, y, 3, colours.accent, { ring: colours.plate })
}

function drawReeds(frame: Frame, set: AirSettings, reeds: readonly Reed[], live: boolean): void {
  const { ctx, colours } = frame
  const { wells } = airLayout(frame)
  const seat = wells.y - 1
  const wide = Math.min(13, wells.w / Math.max(reeds.length, 4) - 2)
  const [lock, stands] = [frame.value('lock'), live ? frame.meter('lock') : 0.5]
  const hue = live ? colours.accent : colours.ink
  const xOf = (place: number): number => wells.x + ((place + 0.5) / reeds.length) * wells.w
  reeds.forEach((reed, place) => {
    const x = xOf(place)
    const well: Box = { ...wells, x: x - wide / 2, w: wide }
    const level = yOfAir(reed.air, wells)
    fillRect(ctx, well, colours.ink, INK.grid)
    const full = (live ? INK.text : INK.rule) * (0.3 + 0.7 * reed.gate)
    fillRect(ctx, { ...well, y: level, h: wells.y + wells.h - level }, hue, full)
    const tick = yOfAir(reed.seat, wells)
    rule(ctx, well.x - 1, tick, well.x + wide + 1, tick, { colour: colours.ink })
    // The tongue, longer the lower its key: what it sweeps as it swings, and where it stands.
    const tall = 22 * clamp(1 - (keyOfHz(reed.hz) - 36) / 110, 0.5, 1)
    const lean = (airSag(set.reed, frame.value('sag'), reed.hz, reed.air) / 90) * wide * 0.7
    const swing = clamp(reed.swing, 0, 1.2) * reed.gate * wide * 0.65
    const tongue = (out: number): Point[] =>
      [0, 0.25, 0.5, 0.75, 1].map((t) => [x + out * t * t, seat - tall * t])
    const sweep = [...tongue(lean - swing), ...tongue(lean + swing).reverse()]
    fillTo(ctx, sweep, seat, hue, live ? INK.text : INK.rule)
    trace(ctx, tongue(lean), { colour: colours.ink, width: set.reed.thick })
    reeds.slice(place + 1).forEach((high, n) => {
      const weight = reed.down && high.down ? airPair(reed.hz, high.hz) : 0
      if (weight * lock < 0.01) return
      const alpha = lerp(0.45, 1, clamp(stands * Math.min(1, reed.age / 0.9, high.age / 0.9), 0, 1))
      const far = xOf(place + 1 + n) - x
      const rise = clamp(far / 70, 0.3, 1) * 0.28
      const arc = tens.map((t): Point => [x + (t * far) / 10, seat - 24 - rise * t * (10 - t)])
      trace(ctx, arc, { colour: hue, width: 0.5 + 1.2 * weight * lock, alpha })
    })
  })
}
/** The end of a breath and of a turn: dragged along, the knob goes as its part gets wider. */
function airHandles(view: DisplayView): DisplayHandle[] {
  const set = airSettings((name) => view.value(name))
  const { breath: box } = airLayout(view)
  return (['lung', 'turn'] as const).map((kind) => {
    const end = partsOf(set.breath).indexOf(kind) + 1
    const x = airEdges(view)[end]
    const y = yOfAir(airBreath(set)[end * (STEPS + 1) - 1].pressure, box)
    const { min, max } = view.spec(kind) ?? { min: 0.1, max: 1 }
    const wide = (WIDE[kind][1] - WIDE[kind][0]) * box.w
    const drag: DisplayHandle['drag'] = (to, _y, hold = {}) => {
      const share = (hold.at ??= view.at(kind)) + (to - (hold.x ??= x)) / wide
      return { [kind]: min * Math.pow(max / min, clamp(share, 0, 1)) }
    }
    const reset = () => ({ [kind]: view.spec(kind)?.default ?? min })
    return { key: kind, name: kind === 'lung' ? 'Lung' : 'Turn', x, y, drag, reset }
  })
}
const commonAir = plateDisplay<AirState>({
  place: 'window',
  columns: 2,
  params: 'reed pipe breath lung turn starve lock sag attack release'.split(' '),
  live: { meters: true, signal: true, notes: true },
  info: 'Above, the pressure of one breath, its turn and the next; drag their ends. Below, the air each key gets, low keys left: over its tick the reed swings. A tongue leans as it sags, and arcs join keys that pull each other into step.',
  init: () => ({ heard: [], shown: 0, reeds: [], ...atRest() }),
  draw(frame) {
    ground(frame)
    const set = airSettings((name) => frame.value(name))
    breathe(frame, set)
    const live = frame.powered && frame.state.reeds.length > 0
    text(frame, `${set.reed.name}, ${PIPES[clamp(Math.round(frame.value('pipe')), 0, 3)]}`, 4, 12)
    text(frame, BREATHS[set.breath], frame.width - 4, 12, { align: 'right' })
    drawBreath(frame, set, live)
    drawReeds(frame, set, live ? frame.state.reeds : resting(set), live)
    levelFoot(frame, airLayout(frame).foot, meanOutShare(frame.state, frame, 1))
  },
  handles: airHandles,
})
export const COMMON_AIR_FACES: Readonly<Record<string, PlateFace>> = {
  'common-air': {
    display: commonAir,
    face: ['reed', 'breath', 'lung', 'starve'],
    sections: [
      ['reed', 'bite', 'pipe', 'body', 'vowel', 'cup'],
      ['second', 'interval', 'beat', 'spread'],
      ['breath', 'lung', 'turn', 'starve', 'share', 'lock', 'sag', 'leak'],
      ['chiff', 'attack', 'release', 'volume'],
    ],
  },
}
