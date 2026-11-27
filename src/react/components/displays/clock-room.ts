// The display of Clock Room: the clocks on the wall as they learn each other's
// time. The dial is one swing (in Chain two): each key is a hand at its pendulum's
// place, low keys long, a ring is where the wall asks it to be, the notches are the
// escapement's strikes, the disc grows as the clocks agree. Each lane is one gong up
// to now. Under both lie the rates: each clock's own, what the wall makes of it, and
// how far the wall reaches. The arithmetic is that of `cpp/devices/clock-room`.

import * as kit from '../display-kit'
import { INK, clamp, dot, rule, trace, type Box, type Point } from '../display-kit'
import { plateDisplay, type DisplayFrame, type DisplayView, type PlateFace } from '../plate-display'
import { levelFoot, meanOutShare, type HeardLevel } from './instrument-parts'

const TURN = Math.PI * 2
const TICK = 256 / 48000 // seconds between two times the pendulums feel each other
const PULL = 5.5 / TURN // `kPull`: the strongest pull of the wall, as a share of Beat
const WALLS = ['In step', 'Opposed', 'Splayed', 'Chain']
const [CHAIN, CHIME, RUB] = [3, 3, 4]
/** What the wall makes of Swing (`Manner::swing`), how long the gongs ring with their own notes' share, and the cases. */
const SWAY = [0.8, 1.4, 0.5, 1.6]
const GONG_RING = [0.85, 3.2, 0.36, 1.26, 1.5675]
const CASE_RING = [1, 0.38, 1.1, 1.8]
/** `kEscapements`: the ring under each, the glow it lets through, when it touches in a swing and how hard. */
// prettier-ignore
const TRAINS: readonly { ring: number; glow: number; touches: readonly Point[] }[] = [
  { ring: 0.22, glow: 0.25, touches: [[0, 0.7], [0.22, 0.36], [0.36, 0.48], [0.63, 0.6], [0.79, 0.3]] },
  { ring: 1, glow: 1, touches: [[0, 1], [0.5, 0.72]] },
  { ring: 0.55, glow: 0.3, touches: [[0, 1.25]] },
  { ring: 0.75, glow: 0.06, touches: [] },
  { ring: 2, glow: 1, touches: [[0, 0.45]] },
]
// prettier-ignore
const PARAMS = ['escapement', 'beat', 'strikes', 'wall', 'learn', 'unlike', 'gong', 'glow', 'swing', 'case', 'runDown', 'decay', 'hush'] as const
export type ClockSettings = Record<(typeof PARAMS)[number], number>
export const clockSettings = (value: (name: string) => number): ClockSettings =>
  Object.fromEntries(PARAMS.map((name) => [name, value(name)])) as ClockSettings
/** A note, with when it was struck and let go on the display's clock. */
export type ClockNote = Record<'hz' | 'gain' | 'on' | 'off', number>
/** `nature`: how far its own rate is off, -1 to 1. `asked`: where the wall asks it to be, as a share of the turn. */
type Part = 'nature' | 'phase' | 'rate' | 'spring' | 'level' | 'asked'
type Strike = Record<'at' | 'force' | 'touch', number>
type Clock = ClockNote &
  Record<Part, number> & { held: boolean; past: kit.History; strikes: Strike[] }
const part = (x: number): number => x - Math.floor(x)
const divisor = (a: number, b: number): number => (b === 0 ? a : divisor(b, a % b))
const same = (a: ClockNote, b: ClockNote): boolean => Math.abs(a.hz / b.hz - 1) < 1e-4
/** How far the wall can move a clock's rate, as a share of Beat. */
export const clockReach = (learn: number): number => learn ** 3 * PULL
/** A clock's own rate in swings a second, before the wall. */
export const clockOwn = (clock: Clock, set: ClockSettings): number =>
  set.beat * (1 + 0.5 * set.unlike * clock.nature) * (0.25 + 0.75 * clock.spring)
/** Where a clock is in the turn of the dial. */
export const clockPlace = (clock: Clock, set: ClockSettings): number =>
  part(clock.phase * (set.wall === CHAIN ? 0.5 : 1))
/** Seconds in which a clock's own note falls by 60 dB. */
export function clockRing(set: ClockSettings, clock: Clock): number {
  const { ring } = TRAINS[set.escapement]
  const own = Math.pow(clamp(220 / clock.hz, 0.1, 8), 0.3) / 2 ** (0.9 * set.unlike * clock.nature)
  const full = set.decay * GONG_RING[set.gong] * CASE_RING[set.case] * ring * own
  const rest = full / Math.max(ring, 1)
  const hushed = rest * Math.pow(Math.min(0.11 / rest, 1), Math.pow(set.hush, 1.5))
  return clamp(clock.held ? full : hushed, 0.05, 60) / (1 + (clock.hz / 6500) ** 2)
}
/** How long a lane lasts: five swings, as long as that shows. */
export const clockSpan = (beat: number): number => clamp(5 / beat, 3, 14)
/** The wall of clocks, run on by the device's arithmetic from the notes it was sent. */
export class ClockWall {
  clocks: Clock[] = []
  /** How far the clocks agree with what the wall asks, the place they agree on, and how long a lane lasts. */
  agreement = 0
  mean = 0
  span = 6
  private pull = 0
  constructor(public time: number) {}
  advance(to: number, notes: readonly ClockNote[], set: ClockSettings): void {
    if (this.clocks.length === 0) this.span = clockSpan(set.beat)
    while (this.time < to - 1e-9) {
      const dt = Math.min(TICK, to - this.time)
      this.time += dt
      for (const note of notes)
        if (note.on <= this.time && note.on > this.time - 0.2) this.key(note, set)
      const down = notes.filter((note) => note.on <= this.time && note.off > this.time)
      for (const clock of this.clocks) clock.held = down.some((note) => same(note, clock))
      this.step(dt, set)
      this.clocks = this.clocks.filter((clock) => clock.held || clock.level > 1e-5)
    }
  }
  private key(note: ClockNote, set: ClockSettings): void {
    let clock = this.clocks.find((each) => same(note, each))
    if (clock && note.on < clock.on + 0.05) return
    if (!clock) {
      const golden = part((69 + 12 * Math.log2(note.hz / 440)) * 0.618034)
      const own = { nature: 2 * golden - 1, phase: 0.04 + 0.46 * golden, rate: set.beat, spring: 1 }
      const past = new kit.History(this.span, 128, 0, 'max')
      clock = { ...note, ...own, past, held: true, level: 0, asked: 0, strikes: [] }
      this.clocks = [...this.clocks.slice(-11), clock]
    }
    Object.assign(clock, { on: note.on, gain: note.gain, spring: 1 })
    this.strike(clock, note.gain * (set.escapement === RUB ? 0.14 : 1), set, 0)
  }
  private strike(clock: Clock, force: number, set: ClockSettings, touch: number): void {
    if (force <= 0) return
    const forced = Math.min(force * (1 + 0.4 * set.unlike * clock.nature), 1.3)
    const left = clock.level * (1 - Math.min(0.4 * Math.sqrt(forced), 0.6))
    clock.level = Math.hypot(left, forced * (0.82 + 0.12 * forced))
    clock.strikes = [...clock.strikes.slice(-300), { at: this.time, force: forced, touch }]
  }
  private step(dt: number, set: ClockSettings): void {
    const on = this.clocks.filter((clock) => clock.held).sort((a, b) => a.hz - b.hz)
    const many = on.length
    let leap = Math.max(Math.floor(0.382 * many + 0.5), 1)
    while (many > 1 && divisor(leap, many) !== 1) leap += 1
    for (const clock of this.clocks) this.run(clock, dt, set, many > 1 && clock.held)
    const angles = on.map((clock, i) => {
      const climb = many > 1 ? (0.5 * i) / (many - 1) : 0.25
      clock.asked = [0, (i % 2) / 2, ((i * leap) % many) / many, climb][set.wall]
      return TURN * (clockPlace(clock, set) - clock.asked)
    })
    const sum = (of: (angle: number) => number) => angles.reduce((all, a) => all + of(a), 0)
    const [re, im] = [sum(Math.cos), sum(Math.sin)]
    this.agreement = many > 1 ? Math.min(Math.hypot(re, im) / many, 1) : 0
    this.mean = part(Math.atan2(im, re) / TURN)
    on.forEach((clock, i) => {
      const own = clockOwn(clock, set)
      const felt = (im * Math.cos(angles[i]) - re * Math.sin(angles[i])) / Math.max(many - 1, 1)
      clock.rate = clamp(own + clockReach(set.learn) * set.beat * felt, 0.2 * own, 2.6 * own)
    })
  }
  private run(clock: Clock, dt: number, set: ClockSettings, walled: boolean): void {
    const { touches, glow } = TRAINS[set.escapement]
    const rub = set.escapement === RUB
    const slow = set.wall === CHAIN && walled ? Math.min(2.5 * set.learn, 1) : 0
    const before = clock.phase
    clock.phase += clock.rate * (1 + this.pull) * dt
    const spent = (dt * Math.min(set.runDown * 25, 1)) / (40 * Math.pow(0.035, set.runDown))
    if (clock.held) clock.spring = Math.max(clock.spring - spent, 0)
    const force = clock.held && clock.spring > 0 ? set.strikes * clock.gain : 0
    touches.forEach(([at, share], i) => {
      const passed = Math.floor(clock.phase - at) > Math.floor(before - at)
      const skipped = slow > 0.5 && Math.floor(clock.phase) % 2 === 1
      const wound = 0.2 + 0.8 * clock.spring
      if (passed && !skipped) this.strike(clock, force * share * wound, set, i)
    })
    const late = this.time - clock.on - 0.5 / set.beat // for the chime's one answer
    const answers = set.escapement === CHIME && late >= 0 && late < dt
    if (answers) this.strike(clock, 1.05 * force, set, 0)
    // How near the pendulum is to the rod, and the rub that grows toward its level.
    const swing = 1 - Math.pow(1 - set.swing, 1 + (walled ? SWAY[set.wall] * set.learn : 0))
    const one = Math.cos(TURN * clock.phase)
    const near = 0.5 + 0.5 * (one + (Math.cos(Math.PI * clock.phase) - one) * slow)
    const fine = set.glow * (0.8 + 0.15 * set.glow)
    const rubbed = 1.142 * (rub ? 0.72 + 0.825 * fine : fine * glow)
    const pressed = Math.max(1 - swing * (1 - near * near * 1.25), 0.02)
    const target = clock.held ? rubbed * pressed * clock.spring * (0.25 + 0.75 * clock.gain) : 0
    if (clock.level < target) clock.level += (target - clock.level) * (rub ? 0.5 : 1.3) * dt
    else clock.level *= Math.exp((-6.9078 * dt) / clockRing(set, clock))
    const passing = 1 - swing * (1 - Math.pow(near, 1 + 2 * swing * swing))
    clock.past.push(this.time, clock.level * (1 + 0.45 * swing) * passing)
  }
  /** Lets the pendulums run a little fast or slow, till the newest is where the device has it (the cosine of half its turn). */
  align(reading: number): void {
    const half = Math.acos(clamp(reading, -1, 1)) / Math.PI
    const phase = [...this.clocks].sort((a, b) => b.on - a.on)[0]?.phase ?? 0
    const [up, down] = [half, -half].map((at) => 2 * part((at - phase) / 2 + 0.5) - 1)
    const least = Math.abs(up) < Math.abs(down) ? up : down
    this.pull = clamp(2 * least, -0.3, 0.3)
  }
}

const CHORD = [146.83, 220, 349.23, 523.25, 659.26].map((hz) => ({ hz, gain: 0.7, on: 0, off: 99 }))
const REACH = 0.92 // what the scale of rates shows either side of Beat, as a share of it
export function clockLayout({ width, height }: Pick<DisplayView, 'width' | 'height'>) {
  const high = height - 41
  const r = Math.min(high / 2 - 1, (width - 8) * 0.23)
  const lanes: Box = { x: 12 + 2 * r, y: 15, w: width - 16 - 2 * r, h: high }
  const rates = { x: width / 2, y: height - 17, half: width / 2 - 8 }
  const foot: Box = { x: 4, y: height - 8, w: width - 8, h: 4 }
  const middle: Point = [5 + r, 15 + high / 2]
  return { middle, r, lanes, rates, foot }
}
export const clockRateX = (share: number, rates: { x: number; half: number }): number =>
  rates.x + clamp(share / REACH, -1, 1) * rates.half
interface ClockState extends HeardLevel {
  wall: ClockWall | null
  chord: { key: string; wall: ClockWall } | null
}
type Frame = DisplayFrame<ClockState>
type Layout = ReturnType<typeof clockLayout>
/** The wall as it is played, or else the chord that is shown at rest: D3 A3 F4 C5 E5. */
function wallNow(frame: Frame, set: ClockSettings): ClockWall {
  const { state, now } = frame
  const notes = frame.notes.map(({ frequency: hz, gain, age, released }) => {
    return { hz, gain, on: Math.max(now - age, now - 20), off: now - (released ?? -1) }
  })
  if (!frame.powered || notes.length === 0) state.wall = null
  else if (!state.wall || now - state.wall.time > 5)
    state.wall = new ClockWall(Math.min(...notes.map(({ on }) => on)) - TICK)
  const { wall } = state
  wall?.advance(now, notes, set)
  // The device's own word on the newest pendulum and on how far they agree.
  if (wall && frame.meter('level') > 0) {
    wall.align(frame.meter('swing'))
    wall.agreement = clamp(frame.meter('agreement'), 0, 1)
  }
  if (wall?.clocks.some((clock) => clock.held || clock.level > 4e-3)) return wall
  const key = JSON.stringify(set)
  if (state.chord?.key !== key) {
    state.chord = { key, wall: new ClockWall(0) }
    state.chord.wall.advance(clockSpan(set.beat), CHORD, set)
  }
  return state.chord.wall
}
export const onDial = (place: number, far: number, [x, y]: Point): Point => [
  x + Math.sin(TURN * place) * far,
  y - Math.cos(TURN * place) * far,
]
function drawDial(frame: Frame, set: ClockSettings, wall: ClockWall, { middle, r }: Layout): void {
  const { ctx, colours } = frame
  const ink = { colour: colours.ink, width: 1 }
  const ring = (around: Point, far: number): void => {
    const points = Array.from({ length: 65 }, (_, i) => onDial(i / 64, far, around))
    trace(ctx, points, { ...ink, alpha: INK.back })
  }
  ring(middle, r)
  for (const [touch, force] of TRAINS[set.escapement].touches) {
    const at = (far: number) => onDial(set.wall === CHAIN ? touch / 2 : touch, far, middle)
    trace(ctx, [at(r), at(r - 2 - 4 * force * set.strikes)], { ...ink, width: 1.5 })
  }
  dot(ctx, ...middle, 1 + wall.agreement * r * 0.36, colours.accent, { alpha: 0.6 })
  const order = wall.clocks.filter(({ held }) => held).sort((a, b) => a.hz - b.hz)
  order.forEach((clock, i) => {
    const far = r * (0.86 - (0.4 * i) / Math.max(order.length - 1, 1))
    const tip = onDial(clockPlace(clock, set), far, middle)
    const since = wall.time - (clock.strikes.at(-1)?.at ?? -9)
    trace(ctx, [middle, tip], { ...ink, alpha: INK.text })
    if (set.learn > 0 && order.length > 1) ring(onDial(wall.mean + clock.asked, far, middle), 3.2)
    dot(ctx, ...tip, 2, colours.ink)
    if (since < 1) dot(ctx, ...tip, 2.6, colours.accent, { alpha: Math.exp(-5 * since) })
  })
}

function drawLanes(frame: Frame, set: ClockSettings, wall: ClockWall, { lanes }: Layout): void {
  const { ctx, colours } = frame
  const order = [...wall.clocks].sort((a, b) => b.hz - a.hz)
  const high = Math.min(lanes.h / Math.max(order.length, 1), 14)
  order.forEach((clock, row) => {
    const y = lanes.y + lanes.h / 2 + (row + 0.5 - order.length / 2) * high
    const tall = (level: number): number => 0.46 * high * Math.sqrt(clamp(level, 0, 1))
    const edge = (sign: number) => clock.past.points(lanes, (level) => y + sign * tall(level))
    rule(ctx, lanes.x, y, lanes.x + lanes.w, y, { colour: colours.ink, alpha: INK.grid })
    kit.fillBetween(ctx, edge(-1), edge(1), colours.ink, clock.held ? 0.75 : INK.back)
    for (const { at, force, touch } of clock.strikes) {
      const x = lanes.x + lanes.w * (1 - (wall.time - at) / wall.span)
      if (x >= lanes.x && (touch === 0 || lanes.w > 10 * wall.span * set.beat))
        rule(ctx, x, y - tall(force), x, y + tall(force), { colour: colours.accent, width: 1.25 })
    }
  })
}

function drawRates(frame: Frame, set: ClockSettings, wall: ClockWall, { rates }: Layout): void {
  const { ctx, colours } = frame
  const y = rates.y
  const x = (share: number): number => clockRateX(share, rates)
  const ink = { colour: colours.ink, alpha: INK.back }
  const [from, to] = [-1, 1].map((side) => x(side * clockReach(set.learn)))
  kit.fillRect(ctx, { x: from, y: y - 6, w: to - from, h: 6 }, colours.accent, 0.5)
  rule(ctx, x(-REACH), y, x(REACH), y, ink)
  rule(ctx, x(0), y - 6, x(0), y + 6, ink)
  for (const clock of wall.clocks.filter(({ held }) => held)) {
    const own = x(clockOwn(clock, set) / set.beat - 1)
    rule(ctx, own, y, own, y + 5, { colour: colours.ink, width: 1.5 })
    dot(ctx, x(clock.rate / set.beat - 1), y - 3, 1.6, colours.ink)
  }
  for (const each of clockHandles(frame))
    kit.handle(frame, each.x, each.y, { hot: frame.hot === each.key, radius: 2.5 })
}

function clockHandles(view: DisplayView) {
  const { x, y, half } = clockLayout(view).rates
  const at = (key: 'learn' | 'unlike', share: number, up: number) => ({
    ...{ key, x: clockRateX(share, { x, half }), y: y + up },
    reset: () => ({ [key]: view.spec(key)?.default ?? 0 }),
  })
  const share = (px: number): number => ((px - x) / half) * REACH
  const learn = (px: number) => ({ learn: clamp(Math.cbrt(share(px) / PULL), 0, 1) })
  const unlike = (px: number) => ({ unlike: clamp(-2 * share(px), 0, 1) })
  return [
    { name: 'Learn', ...at('learn', clockReach(view.value('learn')), -3), drag: learn },
    { name: 'Unlike', ...at('unlike', -0.5 * view.value('unlike'), 3), drag: unlike },
  ]
}

export const CLOCK_ROOM_FACES: Readonly<Record<string, PlateFace>> = {
  'clock-room': {
    display: plateDisplay<ClockState>({
      place: 'window',
      params: PARAMS,
      live: { meters: true, signal: true, notes: true },
      info: "The dial is one swing: every key is a hand, a ring is where the wall wants it, the disc grows as they agree. Each lane is one gong up to now, with a mark for each strike. Below, the clocks' own rates and the wall's reach: drag its end for Learn, the left point for Unlike.",
      init: () => ({ wall: null, chord: null, heard: [], shown: 0 }),
      draw(frame) {
        kit.ground(frame)
        const set = clockSettings((name) => frame.value(name))
        const wall = wallNow(frame, set)
        const at = clockLayout(frame)
        kit.text(frame, WALLS[set.wall], 5, 12)
        const beat = `${Math.round(set.beat * 60)} a min`
        kit.text(frame, beat, frame.width - 5, 12, { align: 'right' })
        drawDial(frame, set, wall, at)
        drawLanes(frame, set, wall, at)
        drawRates(frame, set, wall, at)
        levelFoot(frame, at.foot, meanOutShare(frame.state, frame, 1))
      },
      handles: clockHandles,
    }),
    face: ['beat', 'wall', 'learn', 'glow'],
    labels: { escapement: 'Escape', second: 'Rod two', runDown: 'Rundown' },
    // prettier-ignore
    sections: [['escapement', 'beat', 'strikes', 'runDown', 'tick', 'swing'], ['wall', 'learn', 'unlike', 'case', 'width', 'volume'], ['gong', 'true', 'hammer', 'bloom', 'glow'], ['second', 'interval', 'decay', 'hush']],
  },
}
