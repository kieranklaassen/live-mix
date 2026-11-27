// The display of Chord Clock: the chord as a clock face, and how its pulses
// go from rhythm to tone.
//
// Right: a ring for each key, the lowest inside; once round is the time after
// which the pattern is back. A mark is a pulse; the hand goes as the device's
// clocks do and lights what it passes for about as long as the body rings. A
// ring closes as its tone comes in, and the core is that tone. Left: pulse rate
// over time, twenty a second ruled across: below it pulses are counted, above
// it they are a pitch. The line is middle C on its Path, the dots are the keys.
// The arithmetic is the device's own (`chord-clock-keys.ts`).

import { INK, clamp, dot, ground, handle, rule, text, trace, type Point } from '../display-kit'
import { plateDisplay, type DisplayFrame, type DisplayHandle } from '../plate-display'
import { type DisplayView, type PlateFace } from '../plate-display'
import {
  BODIES,
  BODY_NAMES,
  MIDDLE_C,
  PULSES,
  PULSE_NAMES,
  SLOWING,
  TURN,
  TURN_MOST,
  clockBelow,
  clockKnobs,
  clockLevel,
  clockMarks,
  clockMove,
  clockState,
  type ClockKnobs,
  type ClockState,
} from './chord-clock-keys'
import { levelFoot, meanOutShare } from './instrument-parts'

const [RATE_LOW, RATE_HIGH, LANE_SEC] = [0.15, 1800, 30]
/** At most so many keys are drawn. */
const RINGS_MOST = 6

export function clockLayout(size: Pick<DisplayView, 'width' | 'height'>) {
  const r = (size.height - 25) / 2
  const centre = { x: size.width - 4 - r, y: 15 + r, r }
  return { lane: { x: 8, y: 18, w: centre.x - r - 13, h: 2 * r - 6 }, centre }
}
type Lane = ReturnType<typeof clockLayout>['lane']
/** Where a rate of pulses stands in the lane, and where a time after the key does. */
export const clockRateY = (hz: number, lane: Lane): number =>
  lane.y + lane.h * clamp(Math.log(RATE_HIGH / hz) / Math.log(RATE_HIGH / RATE_LOW), 0, 1)
export const clockTimeX = (seconds: number, lane: Lane): number =>
  lane.x + lane.w * Math.sqrt(clamp(seconds / LANE_SEC, 0, 1))

/** The head's words: the numbers the keys beat against each other, or the lone key's own rate. */
export function clockWords(state: ClockState, { value, slow }: ClockKnobs): string {
  const held = state.keys.filter((key) => key.note.released === null)
  if (held.length === 1) return `every ${(1 / (held[0].aim * slow)).toFixed(2)} s`
  const numbers = held.map((key) => (state.turn * key.p) / key.q).sort((a, b) => a - b)
  const words = numbers.join(':').length > 15 ? `back in ${state.turn}` : numbers.join(':')
  return value('agree') < 0.995 ? 'drifting' : words
}

type Draw = (frame: DisplayFrame<ClockState>, state: ClockState, knobs: ClockKnobs) => void

const drawFace: Draw = ({ ctx, colours, width, height }, state, knobs) => {
  const { value } = knobs
  const { x, y, r: edge } = clockLayout({ width, height }).centre
  const kind = PULSES.indexOf(knobs.pulse)
  const rings = knobs.pulse[4] * knobs.body[4] * 2 ** (5 * (0.5 - value('damping')))
  const turn = Math.min(state.turn, TURN_MOST)
  const rate = (state.anchorHz * knobs.slow) / turn
  const long = 0.5 + value('pulseWidth')
  const sorted = [...state.keys].sort((a, b) => a.note.frequency - b.note.frequency)
  // With more keys than rings, the newest of them.
  const youngest = [...state.keys].sort((a, b) => a.note.age - b.note.age).slice(0, RINGS_MOST)
  const keys = sorted.filter((key) => youngest.includes(key))
  const gap = Math.min(9, (edge - 15) / Math.max(keys.length - 1, 1))
  const full = 2 * Math.PI
  const at = (to: number, r: number): Point => [
    x + r * Math.sin(full * to),
    y - r * Math.cos(full * to),
  ]
  const now = keys.some((key) => key.note.age > 0) ? colours.accent : colours.ink
  // Where rings lie close their marks are smaller.
  const size = (0.7 + 1.1 * Math.sqrt(value('rhythm'))) * clamp(gap / 7.5, 0.55, 1)
  let whole = 0
  keys.forEach((key, i) => {
    const r = edge - 3 - (keys.length - 1 - i) * gap
    const [tone, rhythm] = clockLevel(knobs, key)
    whole = Math.max(whole, Math.min(tone, 1))
    const arc = (from: number, to: number): Point[] => {
      const steps = Math.ceil((to - from) * 90) + 2
      return Array.from({ length: steps + 1 }, (_, n) => at(from + ((to - from) * n) / steps, r))
    }
    trace(ctx, arc(0, 1), { colour: colours.ink, width: 1, alpha: INK.grid })
    const closed = { colour: colours.accent, width: 1 + Math.min(tone, 1) }
    if (tone > 0.01) trace(ctx, arc(0, 1), { ...closed, alpha: Math.min(tone, 0.8) })
    // Few marks make a figure; where they would touch, only the stressed ones are drawn.
    const marks = clockMarks(state, key)
    const figure = { colour: colours.ink, width: 1, alpha: INK.rule * rhythm }
    const corners = [...marks, ...marks.slice(0, 1)].map(({ share }) => at(share, r))
    if (marks.length > 2 && marks.length <= 12) trace(ctx, corners, figure)
    for (const { share, home, ago } of marks) {
      if ((full * r) / marks.length < 2.4 && !home) continue
      const fresh =
        ago < key.note.age * rate ? rhythm * Math.exp(-ago / rate / clamp(rings, 0.25, 1.2)) : 0
      const stress = home ? 1 + 0.6 * value('accent') : 1 - 0.3 * value('accent')
      const big = size * stress * (1 + 0.6 * fresh)
      const colour = fresh > 0.05 ? colours.accent : colours.ink
      const alpha = fresh > 0.05 ? 0.5 + 0.5 * fresh : INK.text * (0.3 + 0.7 * rhythm)
      const half = Math.min((big * long) / (Math.PI * r), 0.4 / marks.length)
      const ends = [-1, 1].map((side) => at(share, r + side * big * (1 + long)))
      const wide = { colour, width: kind === 2 ? 1.2 * big : 2.4 * big, alpha: alpha / (kind - 1) }
      if (kind === 4) trace(ctx, ends, { colour, alpha })
      else if (kind > 1) trace(ctx, arc(share - half, share + half), wide)
      else dot(ctx, ...at(share, r), big * (0.6 + 0.5 * long) + kind, colour, { alpha })
      if (kind === 1) dot(ctx, ...at(share, r), big * (0.1 + 0.5 * long), colours.plate)
    }
  })
  // The core is the tone that is there, in as much of it as the knob leaves.
  dot(ctx, x, y, 2 + 5 * value('tone'), colours.ink, { alpha: INK.fill })
  dot(ctx, x, y, 1 + 6 * whole, now)
  // The hand, faint where it is too fast to follow, and the place where the pattern is back.
  const faint = { colour: now, width: 1, alpha: clamp(1.6 - 0.6 * rate, 0.1, 1) }
  trace(ctx, [[x, y], at(state.master / turn, edge)], faint)
  rule(ctx, x, 14, x, 17, { colour: colours.ink, width: 1.5 })
}

const drawLane: Draw = (frame, state, knobs) => {
  const { ctx, colours } = frame
  const { lane } = clockLayout(frame)
  const quicken = knobs.value('quicken')
  const rateY = (hz: number, u: number): number =>
    clockRateY(hz * 2 ** -clockBelow(knobs.path, knobs.value('slowness'), u), lane)
  const [right, fused] = [lane.x + lane.w, clockRateY(20, lane)]
  rule(ctx, lane.x, lane.y, lane.x, lane.y + lane.h, { colour: colours.ink, alpha: INK.rule })
  rule(ctx, lane.x, fused, right, fused, { colour: colours.ink, alpha: INK.back, dash: [1, 2] })
  text(frame, '20 Hz', right, fused + 10, { align: 'right' })
  // There and back goes on for ever: three rounds of it are drawn.
  const most = knobs.path === TURN ? Math.min(3 * quicken, LANE_SEC) : LANE_SEC
  const times = Array.from({ length: 151 }, (_, i) => most * (i / 150) ** 2)
  const way = times.map((s): Point => [clockTimeX(s, lane), rateY(MIDDLE_C, s / quicken)])
  trace(ctx, way, { colour: colours.ink })
  for (const key of state.keys) {
    const alpha = key.note.age > 0 ? clamp(Math.max(...clockLevel(knobs, key)), 0, 1) : 0
    const x = clockTimeX(key.path * quicken, lane)
    if (alpha > 0) dot(ctx, x, rateY(key.aim, key.path), 1 + 1.5 * alpha, colours.accent, { alpha })
  }
  for (const { key, x, y } of handles(frame)) handle(frame, x, y, { hot: frame.hot === key })
}

function handles(view: DisplayView): DisplayHandle[] {
  const { lane } = clockLayout(view)
  const { path, slow, value } = clockKnobs((name) => view.value(name))
  const [top, low] = [clockRateY(MIDDLE_C, lane), clockRateY(MIDDLE_C * slow, lane)]
  const octave = lane.h / Math.log2(RATE_HIGH / RATE_LOW)
  const slowness = { key: 'slowness', name: 'Slowness', x: lane.x, y: low }
  const far = { x: clockTimeX(value('quicken'), lane), y: path >= SLOWING ? low : top }
  const seconds = (px: number): number => LANE_SEC * Math.max((px - lane.x) / lane.w, 0) ** 2
  return [
    { ...slowness, drag: (_, y) => ({ slowness: (y - top) / octave }) },
    { key: 'quicken', name: 'Quicken', ...far, drag: (px) => ({ quicken: seconds(px) }) },
  ]
}

const SOUND = 'pulse body path slowness quicken ratios agree tone rhythm bloom pulseWidth'
const chordClock = plateDisplay<ClockState>({
  place: 'window',
  columns: 2,
  params: `${SOUND} damping accent stagger attack release slowAgain`.split(' '),
  live: { signal: true, notes: true },
  info: 'Right, each key is a ring and each mark a pulse: once round is when the pattern is back, and the core is the tone. Left, pulse rate over time for middle C, dots for the keys held: over 20 Hz pulses are a tone. Drag the slow end for Slowness, the far end for Quicken.',
  init: clockState,
  draw(frame) {
    ground(frame)
    const knobs = clockKnobs((name) => frame.value(name))
    if (frame.powered) clockMove(frame.state, frame.notes, knobs, frame.dt)
    let state = frame.state
    if (!frame.powered || state.keys.length === 0) {
      // At rest: a triad on middle C, its clocks where they are drawn to.
      const hz = [0, 4, 7].map((n) => MIDDLE_C * 2 ** (n / 12))
      const triad = hz.map((frequency, id) => ({ id, frequency, gain: 1, age: 0, released: null }))
      clockMove((state = clockState()), triad, knobs, 0)
      for (const key of state.keys) key.phase = key.offset * knobs.value('stagger')
    }
    const pulse = PULSE_NAMES[PULSES.indexOf(knobs.pulse)]
    text(frame, `${pulse}, ${BODY_NAMES[BODIES.indexOf(knobs.body)]}`, 4, 12)
    text(frame, clockWords(state, knobs), frame.width - 4, 12, { align: 'right' })
    drawFace(frame, state, knobs)
    drawLane(frame, state, knobs)
    const foot = { x: 4, y: frame.height - 8, w: frame.width - 8, h: 4 }
    levelFoot(frame, foot, meanOutShare(frame.state, frame, 1))
  },
  handles,
})

export const CHORD_CLOCK_FACES: Readonly<Record<string, PlateFace>> = {
  'chord-clock': {
    display: chordClock,
    face: ['slowness', 'quicken', 'tone', 'rhythm'],
    labels: { pulseWidth: 'Length', lower: 'Lower', slowAgain: 'Slow off' },
    sections: [
      ['pulse', 'body', 'path', 'slowness', 'quicken'],
      ['ratios', 'agree', 'accent', 'stagger'],
      ['rhythm', 'pulseWidth', 'damping', 'lift'],
      ['tone', 'bloom', 'lower', 'attack', 'release', 'slowAgain'],
      ['touch', 'width', 'volume'],
    ],
  },
}
