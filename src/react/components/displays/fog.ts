// The display of Fog: what a click becomes.
//
// A click goes in at the left edge, at time zero, and the cloud it comes out
// as stands beside it: the level of the device's answer against time. The
// time scale is the cube root of the time, so the first hundredth of a second
// has room and the longest cloud still fits; the lines under it say where 10
// ms, 100 ms and 1 s lie.
//
// The cloud is worked out from the device's own stages (`fogCloud`): each is
// an allpass that answers a click with a share of it at once and the rest one
// length later, two lengths later and so on, and the cloud of a chain of them
// is those shares folded together. The device's harness holds its click to
// this very curve (cpp/test/fog_test.cpp, "the curve the plate draws"). The
// curve is drawn to its own peak, and that peak stands as high as Mix lets
// the cloud be heard; the click itself stands as high as Mix leaves it dry.
//
// The second colour is what happens now: the cloud lights with the level
// coming out, a mark crosses it at the place the last attack has reached, and
// what Soften is taking off that attack hangs from the top beside the click.

import {
  INK,
  clamp,
  dot,
  fillTo,
  follow,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  text,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The device's own figures, from cpp/devices/fog/fog.h ---------------------

/** `fog_layout::kShortStages`, `kLongStages`: four short stages, then six for each layer. */
export const FOG_SHORT_STAGES = 4
export const FOG_LONG_STAGES = 6

/** `fog_layout::kRatio`: each stage's length as a share of Size. */
export const FOG_RATIO: readonly number[] = [
  0.0393, 0.026, 0.0159, 0.0092, 0.1197, 0.11, 0.1011, 0.0929, 0.0854, 0.0785, 0.1164, 0.107,
  0.0983, 0.0904, 0.083, 0.0763, 0.1132, 0.104, 0.0956, 0.0879, 0.0807, 0.0742,
]

/** `Fog::kShortGain`, `kLongGainLow`, `kLongGainHigh`: the Density law. */
export const FOG_SHORT_GAIN = 0.62
export const FOG_LONG_GAIN_LOW = 0.45
export const FOG_LONG_GAIN_HIGH = 0.6

/** A stage's coefficient at a Density, as `Fog::control` sets it (its sign does not move energy in time). */
export function fogStageGain(stage: number, density: number): number {
  return stage < FOG_SHORT_STAGES
    ? FOG_SHORT_GAIN * clamp(density * 5 - stage, 0, 1)
    : FOG_LONG_GAIN_LOW + (FOG_LONG_GAIN_HIGH - FOG_LONG_GAIN_LOW) * density
}

/** What Mix leaves of the dry sound and of the cloud: `kit::equal_power`, exact at both ends as `Fog::apply` makes it. */
export function fogGains(mix: number): { dry: number; wet: number } {
  const angle = (clamp(mix, 0, 1) * Math.PI) / 2
  return { dry: mix >= 1 ? 0 : Math.cos(angle), wet: mix <= 0 ? 0 : Math.sin(angle) }
}

// --- The cloud ----------------------------------------------------------------

/** The cloud is worked out at every 96th of Size, and its level read in a window of a twelfth of Size. */
export const FOG_BINS_PER_SIZE = 96
export const FOG_WINDOW_BINS = 8

export interface FogCloud {
  /** The level at every 96th of Size, with the peak at 1. */
  level: Float32Array
  /** Where the peak lies, in Sizes. */
  peak: number
  /** Where nine tenths of the click's energy has gone by, in Sizes: 1 at the default Density with one layer. */
  ninety: number
  /** Where nothing of the cloud is left to draw, in Sizes. */
  end: number
}

/**
 * A click's energy at every 96th of Size after it, at a Density and a number
 * of layers. An allpass of coefficient g answers a click with g² of its
 * energy at once and (1 − g²)² g^(2(k − 1)) of it k lengths later; a chain's
 * answer is every stage's folded into the one before. What falls between two
 * bins is shared between them.
 */
export function fogEnergy(density: number, layers: number): Float64Array {
  const count = clamp(Math.round(layers), 1, 3)
  const bins = Math.round((2.5 + 1.5 * (count - 1)) * FOG_BINS_PER_SIZE)
  let energy = new Float64Array(bins)
  let next = new Float64Array(bins)
  energy[0] = 1
  const stages = FOG_SHORT_STAGES + count * FOG_LONG_STAGES
  for (let s = 0; s < stages; s++) {
    const gain = fogStageGain(s, clamp(density, 0, 1))
    const g2 = gain * gain
    // A stage whose coefficient is 0 is a plain delay of its length.
    const length = FOG_RATIO[s] * FOG_BINS_PER_SIZE
    next.fill(0)
    for (let k = 0; k < 200; k++) {
      const share = k === 0 ? g2 : (1 - g2) * (1 - g2) * Math.pow(g2, k - 1)
      if (k > 1 && share < 1e-11) break
      if (share === 0) continue
      const shift = k * length
      const whole = Math.floor(shift)
      const part = shift - whole
      for (let i = 0; i + whole < bins; i++) {
        const here = energy[i]
        if (here === 0) continue
        next[i + whole] += here * share * (1 - part)
        if (i + whole + 1 < bins) next[i + whole + 1] += here * share * part
      }
    }
    const swap = energy
    energy = next
    next = swap
  }
  return energy
}

/**
 * What a click becomes, with Size as the unit of time: the level of
 * `fogEnergy` in a window of a twelfth of Size, and where its peak, its nine
 * tenths and its end lie.
 */
export function fogCloud(density: number, layers: number): FogCloud {
  const energy = fogEnergy(density, layers)
  const bins = energy.length

  let ninety = bins / FOG_BINS_PER_SIZE
  let passed = 0
  for (let i = 0; i < bins; i++) {
    const before = passed
    passed += energy[i]
    if (passed >= 0.9) {
      // Between the bin before and this one, by how far into this one's share the nine tenths fall.
      ninety = (i - 1 + (0.9 - before) / energy[i]) / FOG_BINS_PER_SIZE
      break
    }
  }

  const level = new Float32Array(bins)
  let top = 0
  let peak = 0
  for (let i = 0; i < bins; i++) {
    let sum = 0
    for (let j = i - FOG_WINDOW_BINS / 2; j < i + FOG_WINDOW_BINS / 2; j++)
      if (j >= 0 && j < bins) sum += energy[j]
    level[i] = Math.sqrt(sum / FOG_WINDOW_BINS)
    if (level[i] > top) {
      top = level[i]
      peak = i
    }
  }
  let end = 0
  for (let i = 0; i < bins; i++) {
    level[i] /= top
    if (level[i] >= 0.01) end = i + 1
  }
  return {
    level,
    peak: peak / FOG_BINS_PER_SIZE,
    ninety: Math.max(ninety, 1 / FOG_BINS_PER_SIZE),
    end: end / FOG_BINS_PER_SIZE,
  }
}

/** The cloud's level so many Sizes after the click, between 0 and 1. */
export function fogLevelAt(cloud: FogCloud, sizes: number): number {
  const at = sizes * FOG_BINS_PER_SIZE
  if (!(at >= 0) || at >= cloud.level.length - 1) return 0
  const below = Math.floor(at)
  return cloud.level[below] + (cloud.level[below + 1] - cloud.level[below]) * (at - below)
}

// The clouds worked out last: one for each Density and number of layers asked for.
const clouds = new Map<string, FogCloud>()

function cloudOf(view: DisplayView): FogCloud {
  const density = clamp(view.value('density'), 0, 1)
  const layers = clamp(Math.round(view.value('layers')), 1, 3)
  const key = `${layers} ${density}`
  let cloud = clouds.get(key)
  if (!cloud) {
    if (clouds.size >= 24) clouds.clear()
    cloud = fogCloud(density, layers)
    clouds.set(key, cloud)
  }
  return cloud
}

// --- The picture ----------------------------------------------------------------

/** The time the picture spans: the longest cloud (three layers at the top of Size) ends inside it. */
export const FOG_SPAN_SEC = 2.5

/** Where a time falls across the picture, 0 to 1: the cube root of its share of the span. */
export const fogAcross = (seconds: number): number => Math.cbrt(clamp(seconds / FOG_SPAN_SEC, 0, 1))

/** The time at a place across the picture. */
export const fogSecondsAt = (across: number): number => FOG_SPAN_SEC * clamp(across, 0, 1) ** 3

const SCALE_HEIGHT = 8
const SCALE_WORDS: readonly (readonly [seconds: number, words: string])[] = [
  [0.01, '10 ms'],
  [0.1, '100 ms'],
  [1, '1 s'],
]
const SCALE_LINES = [0.02, 0.05, 0.2, 0.5, 2] as const

/** Under this level nothing is coming out, and at `LOUD_DB` the cloud is lit as far as it goes. */
const QUIET_DB = -60
const LOUD_DB = -6
const MOST_GLOW = 0.5
/** An attack this quiet still leaves a mark that can be seen. */
const FAINT_HIT_DB = -40

/** The box the cloud is drawn in: the click at its left edge, the scale's words under it. */
export const fogBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 6,
  y: 5,
  w: view.width - 12,
  h: view.height - 9 - SCALE_HEIGHT,
})

const sizeSeconds = (view: DisplayView): number => Math.max(0.001, view.value('size') / 1000)

/**
 * The cloud's length as it is said, to two figures, which is as near as the
 * stages' sum gives the device's own (within three hundredths, by its
 * harness): "39 ms", "150 ms", "1.4 s".
 */
export function fogLengthText(seconds: number): string {
  const ms = seconds * 1000
  const step = Math.pow(10, Math.floor(Math.log10(Math.max(ms, 1))) - 1)
  const said = Math.round(ms / step) * step
  return said < 1000 ? `${Math.round(said)} ms` : `${(said / 1000).toFixed(1)} s`
}

function fogHandles(view: DisplayView): DisplayHandle[] {
  const box = fogBox(view)
  const foot = box.y + box.h
  const cloud = cloudOf(view)
  const size = sizeSeconds(view)
  const { wet } = fogGains(view.value('mix'))
  const sizeSpec = view.spec('size')
  const mixSpec = view.spec('mix')
  return [
    {
      key: 'size',
      name: 'Size',
      x: box.x + fogAcross(cloud.ninety * size) * box.w,
      y: foot - wet * fogLevelAt(cloud, cloud.ninety) * box.h,
      // The Size whose cloud has nine tenths of its energy out at the time under the hand.
      drag: (x) => ({
        size: clamp(
          (1000 * fogSecondsAt((x - box.x) / box.w)) / cloud.ninety,
          sizeSpec?.min ?? 10,
          sizeSpec?.max ?? 600,
        ),
      }),
      reset: () => ({ size: sizeSpec?.default ?? view.value('size') }),
    },
    {
      key: 'mix',
      name: 'Mix',
      x: box.x + fogAcross(cloud.peak * size) * box.w,
      y: foot - wet * box.h,
      // The Mix that lets the cloud be heard as high as the hand is.
      drag: (_x, y) => ({
        mix: (2 / Math.PI) * Math.asin(clamp((foot - y) / box.h, 0, 1)),
      }),
      reset: () => ({ mix: mixSpec?.default ?? view.value('mix') }),
    },
  ]
}

const FOG_PARAMS = ['size', 'density', 'layers', 'soften', 'mix'] as const

interface FogState {
  /** The size and the settings the outline was laid out at. */
  seen: Float64Array
  outline: Point[]
  /** How far the cloud is lit, 0 to 1: the level coming out, falling slowly. */
  glow: number
  /** The share of gain Soften has off, held a moment so that one frame can show it. */
  taken: number
}

function layOutline(view: DisplayView, box: Box, cloud: FogCloud, wet: number): Point[] {
  const foot = box.y + box.h
  const size = sizeSeconds(view)
  const last = Math.min(1, fogAcross(cloud.end * size))
  const steps = Math.max(8, Math.round((last * box.w) / 1.5))
  const points: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const across = (i / steps) * last
    const level = fogLevelAt(cloud, fogSecondsAt(across) / size)
    points.push([box.x + across * box.w, foot - wet * level * box.h])
  }
  return points
}

const fog = plateDisplay<FogState>({
  place: 'strip',
  params: FOG_PARAMS,
  live: { meters: true, signal: true },
  info: 'A click goes in at the left and comes out as the cloud beside it: its level against time, with the first moments stretched. Drag the far side of the cloud for its length and its top for how much is heard. The mark crossing it is the last attack on its way through.',
  init: () => ({ seen: new Float64Array(6).fill(NaN), outline: [], glow: 0, taken: 0 }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = fogBox(frame)
    const foot = box.y + box.h
    const size = sizeSeconds(frame)
    const cloud = cloudOf(frame)
    const { dry, wet } = fogGains(frame.value('mix'))
    const soften = clamp(frame.value('soften'), 0, 1)
    const points = fogHandles(frame)

    const now = [
      frame.width,
      frame.height,
      size,
      frame.value('density'),
      frame.value('layers'),
      wet,
    ]
    if (now.some((value, i) => state.seen[i] !== value)) {
      state.seen.set(now)
      state.outline = layOutline(frame, box, cloud, wet)
    }

    // The scale: the cube root of time, with a line at each 1, 2 and 5.
    for (const seconds of SCALE_LINES) {
      const x = box.x + fogAcross(seconds) * box.w
      rule(ctx, x, box.y, x, foot, { colour: colours.ink, alpha: INK.grid * 0.55 })
    }
    for (const [seconds, words] of SCALE_WORDS) {
      const x = box.x + fogAcross(seconds) * box.w
      rule(ctx, x, box.y, x, foot, { colour: colours.ink, alpha: INK.grid })
      text(frame, words, x, frame.height - 3, { align: 'center', alpha: INK.text })
    }
    rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })

    // The cloud, lit by the level coming out.
    const running = frame.powered && frame.signal !== null
    const heard = running ? gainToDb(frame.signal?.output.peak ?? 0) : QUIET_DB
    state.glow = running
      ? follow(
          state.glow,
          clamp((heard - QUIET_DB) / (LOUD_DB - QUIET_DB), 0, 1),
          frame.dt,
          0.02,
          0.3,
        )
      : 0
    fillTo(ctx, state.outline, foot, colours.ink, INK.fill)
    if (state.glow > 0.01) fillTo(ctx, state.outline, foot, colours.accent, MOST_GLOW * state.glow)
    trace(ctx, state.outline, { colour: colours.ink })

    // Nine tenths of the cloud lie left of the Size handle.
    const [sizePoint, mixPoint] = points
    if (foot - sizePoint.y > 1)
      rule(ctx, sizePoint.x, foot, sizePoint.x, sizePoint.y, {
        colour: colours.ink,
        alpha: INK.back,
      })

    // The click: as it goes in (dashed), and as much of it as Mix leaves dry.
    rule(ctx, box.x, foot, box.x, box.y, { colour: colours.ink, alpha: INK.back, dash: [2, 2] })
    if (dry > 0)
      rule(ctx, box.x, foot, box.x, foot - dry * box.h, { colour: colours.ink, width: 2 })
    // Soften takes at most its own share off an attack, as far as the cloud is
    // heard: beside the click a tick marks that depth, and what it has off now
    // hangs towards it from the top.
    const deepest = soften * wet * box.h
    const beside = box.x - 3
    if (deepest > 0.5)
      rule(ctx, beside - 1.5, box.y + deepest, beside + 2.5, box.y + deepest, {
        colour: colours.ink,
        alpha: INK.text,
      })
    const taking = frame.powered ? clamp(frame.meter('taken'), 0, 1) : 0
    state.taken = frame.powered ? follow(state.taken, taking, frame.dt, 0, 0.25) : 0
    const off = state.taken * wet * box.h
    if (off > 0.5)
      rule(ctx, beside, box.y, beside, box.y + off, { colour: colours.accent, width: 2 })

    // The last attack, where it has got to in the cloud.
    const hit = frame.meter('hit')
    const age = frame.meter('age')
    if (frame.powered && hit > 0 && age >= 0 && age <= cloud.end * size) {
      const x = box.x + fogAcross(age) * box.w
      const y = foot - wet * fogLevelAt(cloud, age / size) * box.h
      const alpha = clamp(0.35 + (0.65 * (gainToDb(hit) - FAINT_HIT_DB)) / -FAINT_HIT_DB, 0.35, 1)
      if (foot - y > 0.5) rule(ctx, x, foot, x, y, { colour: colours.accent, alpha })
      dot(ctx, x, y, 2.2, colours.accent, { alpha })
    }

    handle(frame, sizePoint.x, sizePoint.y, { hot: frame.hot === sizePoint.key })
    handle(frame, mixPoint.x, mixPoint.y, { hot: frame.hot === mixPoint.key })

    // The cloud's length; the share of the cloud while its top is in hand.
    const words =
      frame.hot === 'mix'
        ? `${Math.round(frame.value('mix') * 100)}%`
        : fogLengthText(cloud.ninety * size)
    if (mixPoint.x > box.x + 0.6 * box.w) label(frame, words, box.x + 9, box.y + 8, 'left', 9)
    else label(frame, words, box.x + box.w, box.y + 8, 'right', 9)
  },
  handles: fogHandles,
})

export const FOG_FACES: Readonly<Record<string, PlateFace>> = {
  fog: { display: fog, face: ['size', 'layers', 'soften', 'mix'] },
}
