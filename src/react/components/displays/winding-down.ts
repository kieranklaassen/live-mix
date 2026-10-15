// The display of Winding Down: layers of one even pulse, each twice as fast
// as the next, sliding together under a bell so that the pulse seems to slow,
// or to quicken, without end.
//
// Above, a rate axis in equal octaves from an eighth of a hertz to 64. The
// bell stands on it, centred on Rate and Layers octaves wide, and each of the
// six layers the device keeps is a mark at its own rate, as high as the bell
// is there. The device reports its place in the halving, so the marks slide
// under the bell as the layers do: down the axis when slowing, up it when
// quickening, one fading out at one foot of the bell as another comes in at
// the other. No mark is lit in time with a pulse: a layer is a mark standing
// at its rate, however fast it is.
//
// Below, a time axis: the level each side of the sound is given from a moment
// when every layer begins a pulse together, for the length of time written
// under it, the left side over the middle line and the right side under it,
// the right as far behind as Offset puts it in each layer's own cycle. It is
// a shape over time and stands still but for the slide itself, which
// stretches it as slowly as the layers slow.
//
// Everything is the device's own arithmetic: the layers, their rates, the
// bell and the gain are `cpp/devices/winding-down/winding_down.h`, the pulse
// and its depth are `cpp/kit/beat.h` (`pulse_shape`, `pulse_open`,
// `pulse_floor`).

import {
  INK,
  clamp,
  dot,
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

// --- The device's numbers (`winding_down.h`, `beat.h`) --------------------------

/** `WindingDown::kSlots`: how many layers the device keeps. */
export const WINDING_SLOTS = 6
/** `WindingDown::kBelow`: how many octaves under the centre the lowest of them lies when the place is 0. */
export const WINDING_BELOW = 2
/** `WindingDown::kDuty`: every layer is on for half of its period. */
export const WINDING_DUTY = 0.5
/** `pulse_shape`: an edge is never nothing. */
const EDGE_LEAST = 1e-6

/** `kit::PulseShape`: how much of a period the pulse is on, and how much of it each edge takes. */
export interface WindingShape {
  duty: number
  edge: number
}

/**
 * `kit::pulse_shape(hz, kDuty, edge_seconds)`: the shape of a layer's pulse at
 * its rate. The edge is held to half of the shorter of the on time and the
 * gap, which at half Duty is a quarter of the layer's own period.
 */
export function windingShape(hz: number, edgeSeconds: number): WindingShape {
  const most = 0.5 * Math.min(WINDING_DUTY, 1 - WINDING_DUTY)
  const asked = edgeSeconds * hz
  return { duty: WINDING_DUTY, edge: asked > EDGE_LEAST ? Math.min(asked, most) : EDGE_LEAST }
}

/**
 * `kit::pulse_open`: how far open a pulse is at `phase` of its period, 0 in
 * the gap and 1 on the top. It begins to rise at phase 0 and to fall at Duty,
 * each over a half cosine an edge long.
 */
export function windingOpen(phase: number, shape: WindingShape): number {
  if (!(phase > 0)) return 0
  if (phase < shape.edge) return 0.5 - 0.5 * Math.cos((Math.PI * phase) / shape.edge)
  if (phase < shape.duty) return 1
  const down = phase - shape.duty
  if (down < shape.edge) return 0.5 + 0.5 * Math.cos((Math.PI * down) / shape.edge)
  return 0
}

/** `kit::pulse_floor`: the level Depth leaves where every layer is in its gap, (1 - Depth) squared. */
export function windingFloor(depth: number): number {
  const d = clamp(depth, 0, 1)
  return (1 - d) * (1 - d)
}

/**
 * `WindingDown::bell`: the weight, before the weights are made to add to 1,
 * of a layer `octaves` from the centre when `span` octaves sound. A raised
 * cosine, 1 at the centre and 0 from half the span out.
 */
export function windingBell(octaves: number, span: number): number {
  const away = Math.abs(octaves)
  if (!(away < 0.5 * span)) return 0
  return 0.5 + 0.5 * Math.cos((2 * Math.PI * away) / span)
}

/** The device's knobs as it applies them. */
export interface WindingSettings {
  /** 1 when slowing (the place rises), -1 when quickening: the sign of `glide_`. */
  way: 1 | -1
  /** The bell's centre, in hertz. */
  rate: number
  /** Seconds for every layer to halve its rate, or to double it. */
  halving: number
  /** The bell's width in octaves: Layers as the device rounds it. */
  span: number
  /** What is left where every layer is in its gap, as a gain. */
  floor: number
  /** The rise, and the fall, in seconds. */
  edge: number
  /** How far the right side's pulses are behind the left's, in each layer's own period. */
  behind: number
}

export function windingSettings(value: (name: string) => number): WindingSettings {
  return {
    way: value('direction') > 0.5 ? -1 : 1,
    rate: value('rate'),
    halving: value('halving'),
    span: Math.floor(value('layers') + 0.5),
    floor: windingFloor(value('depth')),
    edge: 0.001 * value('edge'),
    behind: value('offset') / 360,
  }
}

/** One of the layers the device keeps, as it stands at a place in the halving. */
export interface WindingLayer {
  /** Which of the six, 0 the slowest. */
  slot: number
  /** How far it lies from the centre, in octaves: `slot - kBelow - place`. */
  octaves: number
  /** Its pulse rate: `layer_rate(slot)`, Rate x 2^octaves. */
  hz: number
  /** How high the bell stands there, 0 to 1. */
  bell: number
  /** Its share of the weight, the six adding to 1: `layer_weight(slot)`. */
  weight: number
}

/** The six layers at `place` in the halving (0 to 1, and past either end for a moment to come). */
export function windingLayers(place: number, set: WindingSettings): WindingLayer[] {
  const layers: WindingLayer[] = []
  let total = 0
  for (let slot = 0; slot < WINDING_SLOTS; slot++) {
    const octaves = slot - WINDING_BELOW - place
    const bell = windingBell(octaves, set.span)
    total += bell
    layers.push({ slot, octaves, hz: set.rate * Math.pow(2, octaves), bell, weight: 0 })
  }
  for (const layer of layers) layer.weight = total > 0 ? layer.bell / total : 0
  return layers
}

/**
 * The level a side is given `seconds` after a moment when every layer begins
 * a pulse together with the place at `place`: the device's own sum,
 * floor + (1 - floor) x the weighted sum of the layers' pulses, never over 1.
 *
 * The slide goes on inside the stretch that is drawn. The place moves on by
 * `seconds / halving`, each layer's rate is Rate x 2^(slot - kBelow - place)
 * as the place stands then, and the lowest layer has turned through the sum
 * of its rate over that time, r0 x H / ln 2 x (1 - 2^(-t / H)) when slowing;
 * every other layer's phase is that one doubled as many times as it is
 * places up, as in the device.
 */
export function windingGainAt(
  seconds: number,
  place: number,
  set: WindingSettings,
  right = false,
): number {
  const moved = (set.way * seconds) / set.halving
  const lowest = set.rate * Math.pow(2, -WINDING_BELOW - place)
  const turned =
    Math.abs(moved) > 1e-9
      ? (lowest * seconds * (1 - Math.pow(2, -moved))) / (moved * Math.LN2)
      : lowest * seconds
  let total = 0
  let open = 0
  let doubled = 1
  for (const layer of windingLayers(place + moved, set)) {
    const phase = wrap(turned * doubled - (right ? set.behind : 0))
    total += layer.bell
    open += layer.bell * windingOpen(phase, windingShape(layer.hz, set.edge))
    doubled += doubled
  }
  const scale = total > 1e-6 ? (1 - set.floor) / total : 0
  return Math.min(1, set.floor + scale * open)
}

// --- The two axes ---------------------------------------------------------------

/** The rate axis: equal octaves from an eighth of a hertz to 64, which holds every layer at any Rate. */
export const WINDING_MIN_HZ = 0.125
export const WINDING_MAX_HZ = 64
const OCTAVES = Math.log2(WINDING_MAX_HZ / WINDING_MIN_HZ)

/** Where a rate lies across the rate axis. */
export const windingXOfHz = (hz: number, plot: Box): number =>
  plot.x + (Math.log2(Math.max(hz, 1e-9) / WINDING_MIN_HZ) / OCTAVES) * plot.w
/** The rate at a place across the rate axis. */
export const windingHzOfX = (x: number, plot: Box): number =>
  WINDING_MIN_HZ * Math.pow(2, ((x - plot.x) / plot.w) * OCTAVES)

/**
 * How long a time the lanes show: one second at a Rate under 2 Hz and half
 * as long for every doubling, so a layer at the bell's centre makes one to two
 * pulses across them.
 */
export function windingSpan(rate: number): number {
  return 1 / Math.pow(2, Math.floor(Math.log2(Math.max(1, rate)) + 1e-9))
}

/** A span as it is written: "125 ms", "500 ms", "1 s". */
export const windingSpanText = (seconds: number): string =>
  seconds < 1 ? `${Math.round(seconds * 1000)} ms` : `${Math.round(seconds)} s`

/** The slide as it is written: "÷2 in 20 s" when slowing, "×2 in 20 s" when quickening. */
export function windingSlideText(set: Pick<WindingSettings, 'way' | 'halving'>): string {
  const time =
    set.halving < 9.95 ? String(+set.halving.toFixed(1)) : String(Math.round(set.halving))
  return `${set.way > 0 ? '÷2' : '×2'} in ${time} s`
}

// --- Where things stand -------------------------------------------------------

export interface WindingLayout {
  /** The rate axis: its foot is the line the marks stand on, its top where the bell is 1. */
  plot: Box
  /** The line the rates under the axis are written on. */
  scale: number
  /** Both lanes; `mid` is the line they grow from and `lane` how high each stands when nothing is turned down. */
  lanes: Box
  mid: number
  lane: number
  /** The line the words under the lanes are written on, and their two ends. */
  base: number
  left: number
  right: number
}

/** Laid out from the size it is given: the rate axis above, its numbers, the lanes, a line of words. */
export function windingLayout(view: Pick<DisplayView, 'width' | 'height'>): WindingLayout {
  const { width, height } = view
  const tall = Math.max(12, Math.round(height * 0.3))
  const plot: Box = { x: 8, y: 7, w: Math.max(8, width - 16), h: tall }
  const scale = plot.y + plot.h + 10
  const top = scale + 4
  // Under the lanes stands a line of words (8 px).
  const lane = Math.max(4, Math.floor((height - 14 - top - 1) / 2))
  const left = 15
  const right = width - 6
  return {
    plot,
    scale,
    lanes: { x: left, y: top, w: Math.max(8, right - left), h: 2 * lane + 1 },
    mid: top + lane + 0.5,
    lane,
    base: height - 5,
    left: 6,
    right,
  }
}

/** The bell as a line over the rate axis: 1 at Rate, down to the axis half of Layers octaves either side. */
export function windingBellPoints(set: WindingSettings, layout: WindingLayout): Point[] {
  const { plot } = layout
  const foot = plot.y + plot.h
  const half = 0.5 * set.span
  const from = windingXOfHz(set.rate * Math.pow(2, -half), plot)
  const to = windingXOfHz(set.rate * Math.pow(2, half), plot)
  // An even number of parts, so that a point stands at Rate, on the bell's top.
  const count = 2 * Math.max(4, Math.ceil((to - from) / 3))
  const points: Point[] = []
  for (let i = 0; i <= count; i++) {
    const octaves = -half + (set.span * i) / count
    points.push([from + ((to - from) * i) / count, foot - windingBell(octaves, set.span) * plot.h])
  }
  return points
}

/** Where a layer's mark stands: across at its rate, as high as the bell is there. */
export function windingMark(layer: WindingLayer, layout: WindingLayout): Point {
  const { plot } = layout
  return [
    windingXOfHz(clamp(layer.hz, WINDING_MIN_HZ, WINDING_MAX_HZ), plot),
    plot.y + plot.h - layer.bell * plot.h,
  ]
}

/**
 * A side's lane as a line: the level it is given over the time the lanes
 * show, read every half pixel, so the line has the same number of points at
 * every setting and each of them stays where it is across.
 */
export function windingLanePoints(
  place: number,
  set: WindingSettings,
  layout: WindingLayout,
  right = false,
): Point[] {
  const { lanes, mid, lane } = layout
  const span = windingSpan(set.rate)
  const count = Math.max(2, Math.round(lanes.w * 2))
  const points: Point[] = []
  for (let i = 0; i <= count; i++) {
    const level = windingGainAt((span * i) / count, place, set, right)
    points.push([
      lanes.x + (lanes.w * i) / count,
      right ? mid + 0.5 + level * lane : mid - 0.5 - level * lane,
    ])
  }
  return points
}

// --- The points ---------------------------------------------------------------

/**
 * Two points on the rate axis. Rate is the ring on top of the bell: across
 * is the rate the bell is centred on. Layers is the ring at the bell's upper
 * foot, half of Layers octaves above Rate: further from the top is more
 * layers, by whole ones.
 */
function windingHandles(view: DisplayView): DisplayHandle[] {
  const { plot } = windingLayout(view)
  const set = windingSettings((name) => view.value(name))
  const rate = view.value('rate')
  const layers = view.value('layers')
  const rateSpec = view.spec('rate')
  const layersSpec = view.spec('layers')
  const rateX = windingXOfHz(set.rate, plot)
  const footX = windingXOfHz(set.rate * Math.pow(2, 0.5 * set.span), plot)
  return [
    {
      key: 'rate',
      name: 'Rate',
      x: rateX,
      y: plot.y,
      drag: (toX) => ({
        rate:
          Math.abs(toX - rateX) < 1e-6
            ? rate
            : clamp(windingHzOfX(toX, plot), rateSpec?.min ?? 1, rateSpec?.max ?? 8),
      }),
      reset: () => ({ rate: rateSpec?.default ?? rate }),
    },
    {
      key: 'layers',
      name: 'Layers',
      x: footX,
      y: plot.y + plot.h,
      drag: (toX) => ({
        layers:
          Math.abs(toX - footX) < 1e-6
            ? layers
            : clamp(
                Math.round(2 * Math.log2(windingHzOfX(toX, plot) / set.rate)),
                layersSpec?.min ?? 2,
                layersSpec?.max ?? 5,
              ),
      }),
      reset: () => ({ layers: layersSpec?.default ?? layers }),
    },
  ]
}

// --- The display --------------------------------------------------------------

interface WindingState {
  /** The place in the halving, carried between the device's readings. */
  track: PhaseTrack | null
}

/** The rates written under the axis, in hertz. */
const SCALE_HZ = [1, 8] as const

const windingDown = plateDisplay<WindingState>({
  place: 'window',
  columns: 2,
  params: ['direction', 'rate', 'halving', 'layers', 'depth', 'edge', 'offset'],
  live: { meters: true },
  info: 'Above, each layer as a mark at its rate, as high as its weight under the bell: the marks slide as the pulse slows or quickens, and the rings set Rate and Layers. Below, the level each side is given over the time written, from a moment when the layers start together.',
  init: () => ({ track: null }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = windingLayout(frame)
    const set = windingSettings((name) => frame.value(name))
    const { plot, lanes, mid, lane } = layout
    const foot = plot.y + plot.h

    // Where the layers are in the halving: the device's reading, carried on
    // at the pace of the slide between two of them.
    const metered = frame.hasMeter('place')
    const reading = metered ? wrap(frame.meter('place')) : 0
    if (frame.powered && metered && frame.dt > 0 && state.track) {
      state.track = trackPhase(state.track, reading, set.way / set.halving, frame.dt)
    } else {
      state.track = { phase: reading, reading }
    }
    const place = wrap(state.track.phase)

    // --- The layers on the rate axis, under the bell ---
    rule(ctx, plot.x, foot, plot.x + plot.w, foot, { colour: colours.ink, alpha: INK.rule })
    for (let octave = 0; octave <= OCTAVES + 1e-9; octave++) {
      const hz = WINDING_MIN_HZ * Math.pow(2, octave)
      const x = windingXOfHz(hz, plot)
      const reach = SCALE_HZ.some((named) => named === hz) ? 3 : 1.5
      rule(ctx, x, foot, x, foot + reach, { colour: colours.ink, alpha: INK.rule })
    }
    for (const hz of SCALE_HZ)
      text(frame, String(hz), windingXOfHz(hz, plot), layout.scale, {
        align: 'center',
        alpha: INK.text,
      })
    text(frame, 'Hz', plot.x + plot.w, layout.scale, { align: 'right', alpha: INK.text })
    const bell = windingBellPoints(set, layout)
    fillTo(ctx, bell, foot, colours.ink)
    trace(ctx, bell, { colour: colours.ink, width: 1.25 })
    // Every layer the device keeps is a mark at its rate, the silent ones on the axis itself.
    const layers = windingLayers(place, set)
    for (const layer of layers) {
      const [x, y] = windingMark(layer, layout)
      trace(
        ctx,
        [
          [x, foot],
          [x, y],
        ],
        { colour: colours.accent, width: 1.5 },
      )
    }
    for (const layer of layers) {
      const [x, y] = windingMark(layer, layout)
      dot(ctx, x, y, 2, colours.accent, { ring: colours.ink })
    }

    // --- The level over time, a lane for each side ---
    for (const y of [mid - 0.5 - lane, mid + 0.5 + lane])
      rule(ctx, lanes.x, y, lanes.x + lanes.w, y, { colour: colours.ink, alpha: INK.grid })
    const upper = windingLanePoints(place, set, layout)
    const lower = windingLanePoints(place, set, layout, true)
    fillTo(ctx, upper, mid - 0.5, colours.ink)
    fillTo(ctx, lower, mid + 0.5, colours.ink)
    rule(ctx, lanes.x, mid, lanes.x + lanes.w, mid, { colour: colours.ink, alpha: INK.rule })
    trace(ctx, upper, { colour: colours.ink, width: 1 })
    trace(ctx, lower, { colour: colours.ink, width: 1 })
    text(frame, 'L', layout.left, mid - 0.5 - lane / 2 + 3, { alpha: INK.text })
    text(frame, 'R', layout.left, mid + 0.5 + lane / 2 + 3, { alpha: INK.text })

    // --- Under the lanes: which way the layers slide and how fast, and how long the lanes are ---
    text(frame, windingSlideText(set), layout.left, layout.base, { alpha: INK.text })
    text(frame, windingSpanText(windingSpan(set.rate)), layout.right, layout.base, {
      align: 'right',
      alpha: INK.text,
    })

    for (const point of windingHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: windingHandles,
})

export const WINDING_DOWN_FACES: Readonly<Record<string, PlateFace>> = {
  // Rate and Layers are the points on the display; Edge is behind the cell.
  'winding-down': {
    display: windingDown,
    face: ['direction', 'halving', 'depth', 'offset'],
  },
}
