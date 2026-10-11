// The display of Pulses: two gates on one pattern, the second a little faster.
// At the left one pulse is drawn enlarged, with the points that shape it. At
// the right the pattern runs as each side of the sound has it, the left side
// above the middle line and the right side below, with a mark where the first
// gate is now; the lower lane lies ahead of the upper by as much as the second
// gate has gained. Ahead of the mark the lanes are what is coming this time
// across, behind it what comes the next time, so the lower lane is redrawn at
// the mark as it passes and never jumps. Under the lanes a line counts the
// lead through one whole pattern, with the time until the two sides sound the
// same again.
//
// Everything here is the device's own arithmetic (`cpp/devices/pulses/pulses.h`):
// which steps sound, the shape of a pulse, what Floor, Accent, Apart and Mix do
// to it, what the pulsed sound is made up by, and how much faster the second
// gate runs. The device reports where the first gate is in its pattern and how
// far the second has gained on it.

import {
  INK,
  clamp,
  dot,
  fillRect,
  fillTo,
  ground,
  handle,
  rule,
  text,
  trace,
  trackPhase,
  type Box,
  type PhaseTrack,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

const wrap = (cycles: number): number => (Number.isFinite(cycles) ? cycles - Math.floor(cycles) : 0)
const shortWay = (cycles: number): number => wrap(cycles + 0.5) - 0.5
const modulo = (value: number, by: number): number => value - Math.floor(value / by) * by

// --- The device's numbers (`pulses.h`) ---------------------------------------

/** `kMaxDrift`: how much faster the second gate runs with Drift all the way up, as a share of the Rate. */
const MAX_DRIFT = 0.125
/** `kMinEdgeSeconds`: the hardest edge takes this long, whatever the Rate. */
const MIN_EDGE_SEC = 0.005
/** `kAccentDrop`: how far Accent turns down every step but the first. */
const ACCENT_DROP = 0.7
/** `kMaxMakeup`: the most the pulsed sound is made up by, 4 dB. It is the top of every level drawn here. */
export const PULSES_MOST = 1.5848932

/** The device's knobs as it applies them. */
export interface PulsesSettings {
  /** Steps a second. */
  rate: number
  steps: number
  fill: number
  shift: number
  /** How much faster the second gate runs, as a share of the Rate: `drift_fraction`. */
  faster: number
  edge: number
  length: number
  /** What is left between pulses, as a gain: Floor squared. */
  floor: number
  shade: number
  /** How much of a side is its own gate; the rest is the other one. */
  same: number
  /** How high every step but the first stands. */
  others: number
  mix: number
  /** What the pulsed sound is made up by: `makeup_for(mean_square(...))`. */
  makeup: number
}

export function pulsesSettings(value: (name: string) => number): PulsesSettings {
  const steps = clamp(Math.round(value('steps')), 2, 16)
  const drift = value('drift')
  const floor = value('floor')
  const set = {
    rate: value('rate'),
    steps,
    fill: clamp(Math.round(value('fill')), 1, steps),
    shift: Math.round(value('shift')) % steps,
    faster: MAX_DRIFT * drift * drift * drift,
    edge: value('edge'),
    length: value('length'),
    floor: floor * floor,
    shade: value('shade'),
    same: 0.5 + 0.5 * value('apart'),
    others: 1 - ACCENT_DROP * value('accent'),
    mix: value('mix'),
  }
  return { ...set, makeup: pulsesMakeup(pulsesMeanSquare(set)) }
}

/** Whether a step of the pattern sounds: `fill` of `steps`, spread as evenly as they go, the first always. */
export const pulsesSounds = (index: number, fill: number, steps: number): boolean =>
  (index * fill) % steps < fill

/** How long a pulse takes to rise, in steps: Edge takes it from half the pulse down to the hardest edge. */
export function pulsesRamp(edge: number, length: number, least: number): number {
  const half = 0.5 * length
  return Math.min(half, Math.max(least, (1 - edge) * half))
}

/** One pulse, `along` its step (0..1): a raised cosine up, a hold, the same down, and nothing after `length`. */
export function pulsesShape(along: number, length: number, ramp: number): number {
  if (along >= length) return 0
  const fromEnd = along < 0.5 * length ? along : length - along
  if (fromEnd >= ramp) return 1
  return 0.5 - 0.5 * Math.cos((Math.PI * fromEnd) / ramp)
}

/**
 * `mean_square`: the mean square of the gain one side gets over a long time.
 * A pulse's mean over its step is Length less its rise, its mean square Length
 * less a rise and a quarter. Where a side hears both gates, what the two have
 * in common is taken over a whole turn of the drift (the product of their
 * means) or, with no drift, as they stand, Shift apart.
 */
export function pulsesMeanSquare(set: Omit<PulsesSettings, 'makeup'>): number {
  const ramp = pulsesRamp(set.edge, set.length, MIN_EDGE_SEC * set.rate)
  const rest = set.fill - 1
  const mean = ((1 + rest * set.others) * (set.length - ramp)) / set.steps
  const square = ((1 + rest * set.others * set.others) * (set.length - 1.25 * ramp)) / set.steps
  let both = mean * mean
  if (!(set.faster > 0)) {
    let sum = 0
    for (let i = 0; i < set.steps; i++) {
      const j = (i + set.shift) % set.steps
      if (!pulsesSounds(i, set.fill, set.steps) || !pulsesSounds(j, set.fill, set.steps)) continue
      sum += (i === 0 ? 1 : set.others) * (j === 0 ? 1 : set.others)
    }
    both = (sum * (set.length - 1.25 * ramp)) / set.steps
  }
  const open =
    (set.same * set.same + (1 - set.same) * (1 - set.same)) * square +
    2 * set.same * (1 - set.same) * both
  const up = 1 - set.floor
  return set.floor * set.floor + 2 * set.floor * up * mean + up * up * open
}

/** `makeup_for`: back to the level the sound came in at, and by `kMaxMakeup` at the most. */
export const pulsesMakeup = (meanSquare: number): number =>
  meanSquare * PULSES_MOST * PULSES_MOST > 1 ? 1 / Math.sqrt(meanSquare) : PULSES_MOST

/**
 * Where along its step a pulse is read so that a line through the readings is
 * the pulse: at its four corners and, up each rise and down each fall, about
 * every pixel and a half (`wide` is a step in pixels) and in `least` parts or
 * more. Between them it is level.
 */
export function pulsesBreaks(length: number, ramp: number, wide: number, least = 4): number[] {
  const parts = clamp(Math.ceil((ramp * wide) / 1.5), least, 24)
  const breaks: number[] = []
  for (let i = 0; i <= parts; i++) breaks.push((ramp * i) / parts)
  for (let i = 0; i <= parts; i++) breaks.push(length - ramp + (ramp * i) / parts)
  return breaks
}

/**
 * How far a gate is open at `place` in its pattern (in steps). The second
 * gate's hardest edge takes the same time as the first's, which is a little
 * more of its shorter step.
 */
export function pulsesGate(place: number, set: PulsesSettings, second = false): number {
  const index = clamp(Math.floor(place), 0, set.steps - 1)
  if (!pulsesSounds(index, set.fill, set.steps)) return 0
  const least = MIN_EDGE_SEC * set.rate * (second ? 1 + set.faster : 1)
  const shape = pulsesShape(place - index, set.length, pulsesRamp(set.edge, set.length, least))
  return (index === 0 ? 1 : set.others) * shape
}

/** What a side lets through, 1 being the sound as it came: its own gate and the other's by Apart, down to the Floor, made up, as far as Mix goes. */
export function pulsesHeard(own: number, other: number, set: PulsesSettings): number {
  const open = set.same * own + (1 - set.same) * other
  return 1 - set.mix + set.mix * set.makeup * (set.floor + (1 - set.floor) * open)
}

/** The same for the top of the sound, far above the corner Shade dulls to: it is taken away as the pulse closes. */
export function pulsesHeardHigh(open: number, set: PulsesSettings): number {
  const gain = (set.floor + (1 - set.floor) * open) * (1 - set.shade * (1 - open))
  return 1 - set.mix + set.mix * set.makeup * gain
}

const commonDivisor = (a: number, b: number): number => (b === 0 ? a : commonDivisor(b, a % b))

/**
 * How many steps the second gate has to gain for the two sides to sound the
 * same again. A whole pattern where Accent marks its first step; with no
 * Accent, the stretch after which the pattern itself comes round: 4 of 8 is
 * the same two steps on, and every step of them one step on.
 */
export function pulsesComesRound(set: PulsesSettings): number {
  return set.others < 1 ? set.steps : set.steps / commonDivisor(set.steps, set.fill)
}

/**
 * Seconds until the two gates sound the same again, from how many steps the
 * second is ahead of the first now. Never, with no Drift.
 */
export function pulsesMeetSeconds(ahead: number, set: PulsesSettings): number {
  if (!(set.faster > 0)) return Infinity
  const round = pulsesComesRound(set)
  return (round - modulo(ahead, round)) / (set.rate * set.faster)
}

/** A length of time as it is said on the display: "0:42", "12:08", "3.5 h", "12 d". */
export function pulsesTimeText(seconds: number): string {
  const whole = Math.round(seconds)
  if (whole < 3600) return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
  const hours = seconds / 3600
  if (hours < 9.95) return `${hours.toFixed(1)} h`
  if (hours < 47.5) return `${Math.round(hours)} h`
  const days = hours / 24
  return days < 99.5 ? `${Math.round(days)} d` : '> 99 d'
}

/** The lanes show at least this many steps, so a short pattern is seen to come round and its mark is not a blur. */
const SHOWN_STEPS = 8
/** Past this many steps a second they show twice as many, so the mark for now crosses in 0.8 s or more. */
const FAST_RATE = 10

/** How many times the pattern comes round across the lanes. */
export const pulsesRounds = (steps: number, rate = 0): number =>
  Math.max(1, Math.ceil(((rate > FAST_RATE ? 2 : 1) * SHOWN_STEPS) / steps))

// --- Where things stand -------------------------------------------------------

/** Room kept for the time at the right of the line under the lanes. */
const WORD_ROOM = 30

export interface PulsesLayout {
  /** The one pulse, enlarged: a step across, from none of the sound at the foot to it made up by the most at the top. */
  zoom: Box
  /** The line between the pulse and the lanes. */
  divider: number
  /** Both lanes; `mid` is the line they grow from and `lane` how high each stands. */
  lanes: Box
  mid: number
  lane: number
  /** The line the second gate's lead is counted on. */
  bar: { x: number; w: number; y: number }
  /** The right end of the words, and the line the time is written on. */
  right: number
  base: number
}

/**
 * Laid out from the size it is given. A lit ring takes 5.25 px about its
 * middle, so the enlarged pulse keeps 6 px from the display's edges and its
 * points are whole wherever they stand.
 */
export function pulsesLayout(view: Pick<DisplayView, 'width' | 'height'>): PulsesLayout {
  const { width, height } = view
  const zoom: Box = { x: 6, y: 6, w: clamp(Math.round(width * 0.22), 36, 64), h: height - 12 }
  const divider = zoom.x + zoom.w + 7
  const left = divider + 5
  const right = width - 4
  const top = 7
  const lane = Math.max(4, Math.floor((height - 15 - top - 1) / 2))
  return {
    zoom,
    divider,
    lanes: { x: left, y: top, w: Math.max(8, right - 8 - left), h: 2 * lane + 1 },
    mid: top + lane + 0.5,
    lane,
    bar: { x: left + 3, w: Math.max(8, right - WORD_ROOM - 4 - (left + 3)), y: height - 7.5 },
    right,
    base: height - 5,
  }
}

/**
 * Where the second gate is when the first has gone `at` steps across the
 * lanes: it goes faster by its Drift, from `shift` steps and `lead` ahead.
 * `lead` is what it had gained when the first gate was at the lanes' left end.
 */
export function pulsesSecondPlace(at: number, lead: number, set: PulsesSettings): number {
  return modulo(at * (1 + set.faster) + set.shift + lead, set.steps)
}

// --- The points ---------------------------------------------------------------

/** How high a level stands in the enlarged pulse: the sound as it came is 1, the top `PULSES_MOST`. */
const zoomY = (zoom: Box, heard: number): number => zoom.y + (1 - heard / PULSES_MOST) * zoom.h

/**
 * The Floor that leaves `level` of the sound between pulses once it is made
 * up, with the other knobs as `settings` has them: the make-up falls as Floor
 * rises, and what is left between pulses rises all the same, so the place is
 * found by halving.
 */
function floorFor(level: number, settings: (floor: number) => PulsesSettings): number {
  let low = 0
  let high = 1
  for (let pass = 0; pass < 50; pass++) {
    const floor = 0.5 * (low + high)
    const set = settings(floor)
    if (set.makeup * set.floor < level) low = floor
    else high = floor
  }
  return 0.5 * (low + high)
}

/**
 * Two points on the enlarged pulse. Edge is the ring on its top, where the
 * rise ends: to the left the edge is harder, at the pulse's middle it is all
 * swell. Length and Floor are one ring where the pulse ends, on the level
 * left between pulses as it is heard, made up: across is Length, down is less
 * Floor. Mix lifts that level toward the sound as it came; under half the Mix
 * the ring stands where it would at a half, so that Floor is still to be set
 * where little or none of it is heard.
 */
function pulsesHandles(view: DisplayView): DisplayHandle[] {
  const { zoom } = pulsesLayout(view)
  const set = pulsesSettings((name) => view.value(name))
  const edge = view.value('edge')
  const length = view.value('length')
  const floor = view.value('floor')
  const edgeSpec = view.spec('edge')
  const lengthSpec = view.spec('length')
  const floorSpec = view.spec('floor')
  const half = 0.5 * length
  const edgeX = zoom.x + pulsesRamp(edge, length, MIN_EDGE_SEC * set.rate) * zoom.w
  const edgeY = zoomY(zoom, pulsesHeard(1, 1, set))
  const reach = Math.max(0.5, set.mix)
  const endX = zoom.x + length * zoom.w
  const endY = zoomY(zoom, 1 - reach + reach * set.makeup * set.floor)
  const lengthAt = (toX: number): number =>
    Math.abs(toX - endX) < 1e-6
      ? length
      : clamp((toX - zoom.x) / zoom.w, lengthSpec?.min ?? 0.1, lengthSpec?.max ?? 1)
  return [
    {
      key: 'edge',
      name: 'Edge',
      x: edgeX,
      y: edgeY,
      drag: (toX) => ({
        edge:
          Math.abs(toX - edgeX) < 1e-6
            ? edge
            : clamp(1 - (toX - zoom.x) / zoom.w / half, edgeSpec?.min ?? 0, edgeSpec?.max ?? 1),
      }),
      reset: () => ({ edge: edgeSpec?.default ?? edge }),
    },
    {
      key: 'length',
      name: 'Length and Floor',
      x: endX,
      y: endY,
      drag: (toX, toY) => {
        const next = lengthAt(toX)
        if (Math.abs(toY - endY) < 1e-6) return { length: next, floor }
        // The level under the hand, and the Floor that leaves it there at the Length the hand is at.
        const heard = PULSES_MOST * (1 - (toY - zoom.y) / zoom.h)
        const level = clamp((heard - (1 - reach)) / reach, 0, 1)
        const found = floorFor(level, (to) =>
          pulsesSettings((name) =>
            name === 'floor' ? to : name === 'length' ? next : view.value(name),
          ),
        )
        return {
          length: next,
          floor: clamp(
            found < 1e-9 ? 0 : found > 1 - 1e-9 ? 1 : found,
            floorSpec?.min ?? 0,
            floorSpec?.max ?? 1,
          ),
        }
      },
      reset: () => ({
        length: lengthSpec?.default ?? length,
        floor: floorSpec?.default ?? floor,
      }),
    },
  ]
}

// --- The display --------------------------------------------------------------

interface PulsesState {
  /** Where the first gate is in its pattern, carried between the device's readings. */
  track: PhaseTrack | null
  /** Which of the rounds across the lanes it is in. */
  round: number
}

const pulses = plateDisplay<PulsesState>({
  place: 'strip',
  params: [
    'rate',
    'steps',
    'fill',
    'drift',
    'shift',
    'edge',
    'length',
    'floor',
    'shade',
    'apart',
    'accent',
    'mix',
  ],
  live: { meters: true },
  info: 'One pulse enlarged at the left, over a line at the level the sound came in at: the ring on top sets Edge, the ring at its end Length and Floor. Beside it the pattern on each side, a bar over each step that sounds. The dot below is the second gate gaining, with the time until both sides match again.',
  init: () => ({ track: null, round: 0 }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = pulsesLayout(frame)
    const set = pulsesSettings((name) => frame.value(name))
    const rounds = pulsesRounds(set.steps, set.rate)
    const total = rounds * set.steps
    const { zoom, lanes, mid, lane, bar } = lay

    // Where the first gate is: the device's reading, carried on at the Rate between two of them.
    const metered = frame.hasMeter('place')
    const reading = metered ? wrap(frame.meter('place')) : 0
    if (frame.powered && metered && frame.dt > 0 && state.track) {
      const before = state.track.phase
      state.track = trackPhase(state.track, reading, set.rate / set.steps, frame.dt)
      const moved = state.track.phase - before
      // Through the end of the pattern is on into the next round.
      if (moved < -0.5) state.round += 1
      else if (moved > 0.5) state.round -= 1
    } else if (metered && (!state.track || frame.dt <= 0)) {
      state.track = { phase: reading, reading }
    }
    state.round = modulo(state.round, rounds)
    const place = state.track?.phase ?? 0
    const now = (state.round + place) * set.steps
    // What the second gate has gained, as the device reports it, and what it
    // had gained at the lanes' left end: it gains `faster` of every step the
    // first one goes, so that is the same all the way across.
    const gained = (frame.hasMeter('lead') ? wrap(frame.meter('lead')) : 0) * set.steps
    const read = now + shortWay((state.track?.reading ?? place) - place) * set.steps
    const lead = gained - read * set.faster
    // Behind the mark the lanes are the next time across: by then the second
    // gate has gained what it gains in one crossing of them.
    const sweep = total * set.faster
    const leadAt = (at: number): number => (at < now ? lead + sweep : lead)

    // --- One pulse, enlarged ---
    rule(ctx, zoom.x, zoom.y, zoom.x + zoom.w, zoom.y, { colour: colours.ink, alpha: INK.grid })
    rule(ctx, zoom.x, zoom.y + zoom.h, zoom.x + zoom.w, zoom.y + zoom.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    const ramp = pulsesRamp(set.edge, set.length, MIN_EDGE_SEC * set.rate)
    const whole: Point[] = []
    const high: Point[] = []
    for (const along of [0, ...pulsesBreaks(set.length, ramp, zoom.w), 1]) {
      const open = pulsesShape(along, set.length, ramp)
      const x = zoom.x + along * zoom.w
      whole.push([x, zoomY(zoom, pulsesHeard(open, open, set))])
      high.push([x, zoomY(zoom, pulsesHeardHigh(open, set))])
    }
    // Under the upper line is what the low end keeps, under the lower what the top keeps too.
    fillTo(ctx, whole, zoom.y + zoom.h, colours.ink)
    fillTo(ctx, high, zoom.y + zoom.h, colours.ink)
    // The level the sound came in at: what stands over it is the make-up.
    rule(ctx, zoom.x, zoomY(zoom, 1), zoom.x + zoom.w, zoomY(zoom, 1), {
      colour: colours.ink,
      alpha: INK.rule,
    })
    if (set.shade > 0) trace(ctx, high, { colour: colours.ink, width: 1, alpha: INK.back })
    trace(ctx, whole, { colour: colours.ink, width: 1.5 })
    rule(ctx, lay.divider, 5, lay.divider, frame.height - 5, {
      colour: colours.ink,
      alpha: INK.grid,
    })

    // --- The pattern, a lane for each side ---
    const across = (at: number): number => lanes.x + (at / total) * lanes.w
    const speed = 1 + set.faster
    // The two stretches of the lanes: from the mark on, this time across; up to it, the next.
    const stretches = [
      { from: now, to: total, start: set.shift + lead },
      { from: 0, to: now, start: set.shift + lead + sweep },
    ].filter((stretch) => stretch.to > stretch.from)
    // Both lanes are read where either gate turns: at the corners of every
    // pulse and up and down its edges. Between those both are level.
    const wide = lanes.w / total
    const reads: number[] = [0, total]
    // An edge a pixel or two wide is as well drawn in two parts as in four.
    const firstBreaks = pulsesBreaks(set.length, ramp, wide, 2)
    for (let step = 0; step < total; step++) {
      if (!pulsesSounds(step % set.steps, set.fill, set.steps)) continue
      for (const along of firstBreaks) if (step + along < total) reads.push(step + along)
    }
    const secondBreaks = pulsesBreaks(
      set.length,
      pulsesRamp(set.edge, set.length, MIN_EDGE_SEC * set.rate * speed),
      wide / speed,
      2,
    )
    // The steps the second gate goes through while the first crosses a stretch.
    const secondSteps = (stretch: { from: number; to: number; start: number }): number[] => {
      const steps: number[] = []
      const first = Math.floor(stretch.from * speed + stretch.start) - 1
      const last = Math.ceil(stretch.to * speed + stretch.start)
      for (let step = first; step <= last; step++)
        if (pulsesSounds(modulo(step, set.steps), set.fill, set.steps)) steps.push(step)
      return steps
    }
    for (const stretch of stretches) {
      for (const step of secondSteps(stretch)) {
        for (const along of secondBreaks) {
          const at = (step + along - stretch.start) / speed
          if (at > stretch.from && at < stretch.to) reads.push(at)
        }
      }
    }
    reads.sort((a, b) => a - b)
    const upper: Point[] = []
    const lower: Point[] = []
    const levels = (at: number, ahead: number): void => {
      const first = pulsesGate(modulo(at, set.steps), set)
      const second = pulsesGate(pulsesSecondPlace(at, ahead, set), set, true)
      const x = across(at)
      upper.push([x, mid - 0.5 - (pulsesHeard(first, second, set) / PULSES_MOST) * lane])
      lower.push([x, mid + 0.5 + (pulsesHeard(second, first, set) / PULSES_MOST) * lane])
    }
    let seamed = now <= 0
    for (const at of reads) {
      if (!seamed && at >= now) {
        // At the mark the lanes go from the next time across to this one.
        levels(now, lead + sweep)
        levels(now, lead)
        seamed = true
        if (at === now) continue
      }
      levels(at, leadAt(at))
    }
    fillTo(ctx, upper, mid - 0.5, colours.ink)
    fillTo(ctx, lower, mid + 0.5, colours.ink)
    rule(ctx, lanes.x, mid, lanes.x + lanes.w, mid, { colour: colours.ink, alpha: INK.rule })
    for (let step = 0; step <= total; step++) {
      const reach = step % set.steps === 0 ? 3 : 1.5
      const x = across(step)
      rule(ctx, x, mid - reach, x, mid + reach, { colour: colours.ink, alpha: INK.rule })
    }
    trace(ctx, upper, { colour: colours.ink, width: 1.25 })
    trace(ctx, lower, { colour: colours.ink, width: 1.25 })
    // A bar over each step a gate sounds, as long as its pulse: the first
    // gate's above the lanes, the second's below, and the pattern's first step
    // the strongest. They are the pattern itself, so Mix does not take them.
    const bars = (
      from: number,
      to: number,
      y: number,
      index: number,
      low = 0,
      top = total,
    ): void => {
      const a = Math.max(low, from)
      const b = Math.min(top, to)
      if (b <= a) return
      fillRect(
        ctx,
        { x: across(a), y, w: across(b) - across(a), h: 2 },
        colours.ink,
        index === 0 ? 1 : INK.back,
      )
    }
    for (let step = 0; step < total; step++) {
      const index = step % set.steps
      if (pulsesSounds(index, set.fill, set.steps))
        bars(step, step + set.length, lanes.y - 3, index)
    }
    for (const stretch of [...stretches].sort((a, b) => a.from - b.from)) {
      for (const step of secondSteps(stretch)) {
        bars(
          (step - stretch.start) / speed,
          (step + set.length - stretch.start) / speed,
          lanes.y + lanes.h + 1,
          modulo(step, set.steps),
          stretch.from,
          stretch.to,
        )
      }
    }
    text(frame, 'L', lay.right, lanes.y + lane / 2 + 3, { align: 'right', alpha: INK.text })
    text(frame, 'R', lay.right, mid + 0.5 + lane / 2 + 3, { align: 'right', alpha: INK.text })

    // --- Now ---
    const nowX = across(now)
    const first = pulsesGate(modulo(now, set.steps), set)
    const second = pulsesGate(pulsesSecondPlace(now, lead, set), set, true)
    rule(ctx, nowX, lanes.y - 3, nowX, lanes.y + lanes.h + 3, { colour: colours.accent })
    dot(
      ctx,
      nowX,
      mid - 0.5 - (pulsesHeard(first, second, set) / PULSES_MOST) * lane,
      2.5,
      colours.accent,
      { ring: colours.ink },
    )
    dot(
      ctx,
      nowX,
      mid + 0.5 + (pulsesHeard(second, first, set) / PULSES_MOST) * lane,
      2.5,
      colours.accent,
      { ring: colours.ink },
    )

    // --- How far ahead the second gate is, through one whole pattern ---
    const ahead = modulo(set.shift + gained, set.steps)
    const round = pulsesComesRound(set)
    rule(ctx, bar.x, bar.y, bar.x + bar.w, bar.y, { colour: colours.ink, alpha: INK.rule })
    for (let step = 0; step <= set.steps; step++) {
      const x = bar.x + (step / set.steps) * bar.w
      // A longer tick wherever the two sides sound the same: there the dot has come round.
      const reach = step % round === 0 ? 2.5 : 1.5
      rule(ctx, x, bar.y - reach, x, bar.y + reach, { colour: colours.ink, alpha: INK.rule })
    }
    dot(ctx, bar.x + (ahead / set.steps) * bar.w, bar.y, 2.5, colours.accent, { ring: colours.ink })
    const meet = pulsesMeetSeconds(ahead, set)
    if (Number.isFinite(meet))
      text(frame, pulsesTimeText(meet), lay.right, lay.base, { align: 'right', alpha: INK.text })

    for (const point of pulsesHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: pulsesHandles,
})

export const PULSES_FACES: Readonly<Record<string, PlateFace>> = {
  // Edge, Length and Floor are the points on the display.
  pulses: {
    display: pulses,
    face: ['rate', 'steps', 'fill', 'drift'],
  },
}
