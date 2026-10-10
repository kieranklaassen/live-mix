// The display of Underwater: the water in cross-section. The line at the top
// is the surface, moving as the device's own swell and ripple move (it
// reports where each is in its cycle); the lens hanging under it is the sound
// at its Depth, in water that is darker the further down it is, as the highs
// go: the plate is the dark of deep water and its ink is light, so the water
// is washed with ink most at the surface and least at the bottom. Bubbles
// rise from the sound when the device says it has sent one up.
// The ring to the right of the sound is Waver: it runs across, up the dashed
// slope that is how high the surface gets for each Waver, and stands at the
// height the surface reaches now.
//
// Everything on it is the device's arithmetic (`underwater.h`): the constants
// below are copied from there, and `displays.underwater.test.ts` holds the
// drawing to them and to the compiled device.

import {
  INK,
  clamp,
  crisp,
  dot,
  follow,
  ground,
  handle,
  hzText,
  label,
  lerp,
  rule,
  trace,
  trackPhase,
  type Box,
  type PhaseTrack,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The device's numbers (`cpp/devices/underwater/underwater.h`) -------------

/** The corner of the water's low-pass at Depth 0 and at Depth 1, and the share of Depth it takes to go under. */
const TOP_HZ = 16000
const DEEP_HZ = 300
const SURFACE_DEPTH = 0.1
/** The body's hump: `1 + 3 · Body · Depth` over what is around it. */
const BODY_GAIN = 3
/** The light flickers what lies over this split. */
const LIGHT_SPLIT_HZ = 2200
/** The surface: a swell and a ripple at 0.382 of its rate, three to one in size. */
const RIPPLE_RATIO = 0.381966
const SWELL_SHARE = 0.75
const RIPPLE_SHARE = 0.25
/** The bend at full Waver (45 cents as a ratio less one), and the longest half swing of the delay. */
const BEND = 0.026334
const MAX_SWING_SEC = 0.035
/** The squeeze: its threshold (-34 dBFS). */
const SQUEEZE_THRESHOLD = 0.02
/** Bubbles: the most one attack sends up, the pitch of a small and a large one, and how much higher the last of a flight is. */
const MOST_BUBBLES = 12
const SMALL_HZ = 2400
const LARGE_HZ = 420
const FLIGHT_RISE_OCTAVES = 0.8
/** A flight's spread in time: the time constant of a small one and of a large one; no bubble comes later than three of them. */
const FLIGHT_SMALL_SEC = 0.07
const FLIGHT_LARGE_SEC = 0.27
/** The count of bubbles wraps here. */
const COUNT_WRAP = 65536

/** How far under the surface the sound is, 0..1 over the first tenth of Depth (`immersion`). */
export function underwaterImmersion(depth: number): number {
  const t = clamp(depth / SURFACE_DEPTH, 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * The corner of the water's low-pass at a Depth, Hz (`sink`). The water heard
 * is as deep as Mix lets it be: the device puts the corner where Depth times
 * Mix says.
 */
export const underwaterCorner = (depth: number, mix = 1): number =>
  TOP_HZ * Math.pow(DEEP_HZ / TOP_HZ, depth * mix)

/** The Depth at which the corner is at `hz`. */
export const underwaterDepthOfCorner = (hz: number): number =>
  Math.log(hz / TOP_HZ) / Math.log(DEEP_HZ / TOP_HZ)

/** The Depth under which the light is lost: where the corner meets the split the light flickers over. */
export const UNDERWATER_LIGHT_DEPTH = underwaterDepthOfCorner(LIGHT_SPLIT_HZ)

/** The surface's height, -1..1, with the swell and the ripple at these places in their cycles (`surface_height`). */
export const underwaterSurface = (swell: number, ripple: number): number =>
  SWELL_SHARE * Math.sin(2 * Math.PI * swell) + RIPPLE_SHARE * Math.sin(2 * Math.PI * ripple)

/**
 * How far the surface bends the pitch at the most, in cents either way
 * (`set_swing`): 45 at full Waver, less under 0.14 Hz, where the delay's swing
 * stops at 35 ms, none out of the water, and as much of it as Mix lets the
 * water be heard (the dry sound rides the same surface, so the whole sound is
 * bent this far).
 */
export function underwaterBendCents(waver: number, rate: number, depth: number, mix = 1): number {
  const steepest = 2 * Math.PI * rate * (SWELL_SHARE + RIPPLE_SHARE * RIPPLE_RATIO)
  const swing = Math.min(MAX_SWING_SEC, BEND / steepest)
  return 1200 * Math.log2(1 + waver * underwaterImmersion(depth) * mix * swing * steepest)
}

/** What is left of the side signal at a Depth: all of it at full Width. */
export const underwaterSide = (depth: number, width: number): number => 1 - depth * (1 - width)

/** How far the body's hump stands over what is around it, dB. */
export const underwaterHumpDb = (resonance: number, depth: number): number =>
  20 * Math.log10(1 + BODY_GAIN * resonance * depth)

/** The share of its level a full-scale sound is left by the squeeze, before make-up. */
export const underwaterHeld = (pressure: number, depth: number): number =>
  1 - pressure * depth * (1 - Math.sqrt(SQUEEZE_THRESHOLD))

/** How many bubbles one attack sends up (`send_up`). */
export function underwaterCount(bubbles: number): number {
  if (!(bubbles > 0)) return 0
  return Math.max(1, Math.floor(bubbles * MOST_BUBBLES + 0.5))
}

/**
 * One flight as the device spreads it, without its chance: bubble `i` of
 * `count` comes `late` time constants after the attack (0..3, the device's
 * own curve at evenly spaced draws) at the pitch its place in the flight gives
 * it, the later the higher.
 */
export function underwaterFlight(bubbles: number, size: number): { late: number; hz: number }[] {
  const count = underwaterCount(bubbles)
  const centre = SMALL_HZ * Math.pow(LARGE_HZ / SMALL_HZ, size)
  return Array.from({ length: count }, (_, i) => {
    const late = -Math.log(1 - (0.95 * (i + 0.5)) / count)
    return { late, hz: centre * Math.pow(2, (FLIGHT_RISE_OCTAVES * late) / 3) }
  })
}

/** How long a flight takes to come up at a Bubble Size, seconds: three of its time constants (`send_up`). */
export const underwaterFlightSeconds = (size: number): number =>
  3 * lerp(FLIGHT_SMALL_SEC, FLIGHT_LARGE_SEC, size)

// --- The picture ------------------------------------------------------------

/** Under this nothing of the water is heard. */
const QUIET = 1e-4
/** What a handle's ring takes about its middle when it is lit. */
const RING_ROOM = 5.25
/** How far the body's four rings stand out from the sound's side. */
const BODY_RINGS_ROOM = 12
/** How much time the surface spans across the display, seconds: a wave is as long as its swell is slow. */
export const UNDERWATER_SPAN_SEC = 5
/** Where the sound hangs across the display. */
const SOUND_AT = 0.42
/** The pitches between which a bubble's size is read: the highest is the smallest. */
const TINY_HZ = 4200
const BIG_HZ = 420
/** How much of the ink the water is washed with at the surface, and where Depth 1 hangs. */
const WATER_LIT = 0.34
const WATER_DEEP = 0.04
/** How many rays of light, and how many squeeze marks a full squeeze is. */
const RAYS = 5
const RAY_LEAN = 0.4
const SQUEEZE_MARKS = 4

export interface UnderwaterLayout {
  box: Box
  /** The surface at rest, the most it rises (full Waver, heard in full), and the depth the sound hangs at at Depth 1. */
  surfaceY: number
  swell: number
  deepY: number
  /** Where the sound hangs across, and its size at rest: half its width with its sides whole, half its height unsqueezed. */
  soundX: number
  rx: number
  ry: number
  /** Pixels a second of the surface is drawn over. */
  perSec: number
  /** Where the Waver ring stands across with no Waver and with all of it: clear of the sound and its rings, to the edge. */
  waverFrom: number
  waverTo: number
  /** What a bubble's radius is multiplied by on a taller display. */
  unit: number
}

export function underwaterLayout(view: Pick<DisplayView, 'width' | 'height'>): UnderwaterLayout {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const swell = clamp(view.height * 0.17, 7, 16)
  const ry = clamp(view.height * 0.085, 3.5, 8)
  const soundX = box.x + box.w * SOUND_AT
  const rx = clamp(box.w * 0.09, 10, 22)
  return {
    box,
    // The ring at the top of the swell is whole on the display.
    surfaceY: RING_ROOM + swell,
    swell,
    deepY: box.y + box.h - ry - 1,
    soundX,
    rx,
    ry,
    perSec: box.w / UNDERWATER_SPAN_SEC,
    waverFrom: soundX + rx + BODY_RINGS_ROOM + RING_ROOM,
    waverTo: box.x + box.w - 8,
    unit: clamp(view.height / 48, 1, 1.6),
  }
}

/** How much of the water Mix lets be heard: the wet side is a straight crossfade. */
const mixOf = (view: Pick<DisplayView, 'value'>): number => clamp(view.value('mix'), 0, 1)

/** How much of what the water does to the sound is heard: Mix, and how far under it is. */
const heardOf = (view: Pick<DisplayView, 'value'>): number =>
  mixOf(view) * underwaterImmersion(view.value('depth'))

/** How far up the Waver ring goes for the whole of Waver, as a share of the swell: with the surface while it is heard, never less than half. */
const waverRise = (view: Pick<DisplayView, 'value'>): number => Math.max(0.5, heardOf(view))

/** Where a Depth hangs. */
export const underwaterDepthY = (layout: UnderwaterLayout, depth: number): number =>
  lerp(layout.surfaceY, layout.deepY, depth)

/** A bubble's radius by the pitch it starts at: the lower the larger, as in water. */
export function underwaterBubbleRadius(hz: number, unit: number): number {
  const large = clamp(Math.log(TINY_HZ / hz) / Math.log(TINY_HZ / BIG_HZ), 0, 1)
  return lerp(0.8, 2.6, large) * unit
}

/**
 * The surface at `x`: the wave that moves the sound, as high as Waver lets it
 * be heard. The sound is under where the wave is now; to its right is what
 * has passed, to its left what comes.
 */
function surfaceAt(
  layout: UnderwaterLayout,
  x: number,
  swell: number,
  ripple: number,
  rate: number,
  height: number,
): number {
  const ago = ((x - layout.soundX) / layout.perSec) * rate
  return layout.surfaceY - height * underwaterSurface(swell - ago, ripple - ago * RIPPLE_RATIO)
}

function underwaterHandles(view: DisplayView): DisplayHandle[] {
  const layout = underwaterLayout(view)
  const depthSpec = view.spec('depth')
  const waverSpec = view.spec('waver')
  const depth = view.value('depth')
  const waver = view.value('waver')
  const range = layout.deepY - layout.surfaceY
  const depthY = underwaterDepthY(layout, depth)
  // The ring runs across for Waver, and stands as high as the surface gets.
  const across = layout.waverTo - layout.waverFrom
  const waverX = layout.waverFrom + waver * across
  const waverY = layout.surfaceY - waver * layout.swell * waverRise(view)
  return [
    {
      key: 'depth',
      name: 'Depth',
      x: layout.soundX,
      y: depthY,
      drag: (_x, y) => ({
        depth:
          Math.abs(y - depthY) < 1e-6
            ? depth
            : clamp((y - layout.surfaceY) / range, depthSpec?.min ?? 0, depthSpec?.max ?? 1),
      }),
      wheel: (steps) => ({
        depth: clamp(depth - steps * 0.02, depthSpec?.min ?? 0, depthSpec?.max ?? 1),
      }),
      reset: () => ({ depth: depthSpec?.default ?? depth }),
    },
    {
      key: 'waver',
      name: 'Waver',
      x: waverX,
      y: waverY,
      drag: (x) => ({
        waver:
          Math.abs(x - waverX) < 1e-6
            ? waver
            : clamp((x - layout.waverFrom) / across, waverSpec?.min ?? 0, waverSpec?.max ?? 1),
      }),
      wheel: (steps) => ({
        waver: clamp(waver + steps * 0.02, waverSpec?.min ?? 0, waverSpec?.max ?? 1),
      }),
      reset: () => ({ waver: waverSpec?.default ?? waver }),
    },
  ]
}

interface Rising {
  born: number
  /** How long it takes to the surface, seconds: as long as its flight takes to come up. */
  span: number
  hz: number
  /** Which bubble it is, for where it rises. */
  serial: number
}

interface UnderwaterState {
  swell: PhaseTrack | null
  ripple: PhaseTrack | null
  /** The count of bubbles last read; null before the first reading. */
  count: number | null
  serial: number
  rising: Rising[]
  /** The squeeze as shown, and the level the sound glows with. */
  held: number
  glow: number
  /** The last readings of the light's flicker, newest first: a ray each. */
  glints: Float32Array
  /** The surface's points, written again on every frame. */
  line: [number, number][]
}

/** A number from a count, the same every time, 0..1: where a bubble rises. */
const scatter = (serial: number): number => {
  const x = Math.sin(serial * 12.9898 + 4.1) * 43758.5453
  return x - Math.floor(x)
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void {
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2)
}

const underwater = plateDisplay<UnderwaterState>({
  place: 'strip',
  params: [
    'depth',
    'waver',
    'rate',
    'bubbles',
    'bubbleSize',
    'resonance',
    'surface',
    'pressure',
    'width',
    'mix',
  ],
  live: { meters: true, signal: true },
  info: 'The water from the side. The line is the surface as it moves the sound, the lens is the sound at its Depth, narrower as its sides close in, in water that darkens as the highs go. Bubbles rise when an attack sends them up. Drag the lens down for Depth and the ring across for Waver.',
  init: () => ({
    swell: null,
    ripple: null,
    count: null,
    serial: 0,
    rising: [],
    held: 1,
    glow: 0,
    glints: new Float32Array(RAYS),
    line: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = underwaterLayout(frame)
    const { box, surfaceY, soundX } = layout
    const foot = box.y + box.h
    const depth = frame.value('depth')
    const rate = frame.value('rate')
    const mix = mixOf(frame)
    const heard = heardOf(frame)
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('swell')

    // The device is read whatever Mix is, so nothing is stale when Mix comes back.
    if (running) {
      state.swell = trackPhase(state.swell, frame.meter('swell'), rate, frame.dt)
      state.ripple = trackPhase(state.ripple, frame.meter('ripple'), rate * RIPPLE_RATIO, frame.dt)
      const count = frame.meter('bubbles')
      if (state.count !== null && Number.isFinite(count)) {
        const more = (((count - state.count) % COUNT_WRAP) + COUNT_WRAP) % COUNT_WRAP
        // More than two flights in one reading is a count that started again.
        if (more >= 1 && more <= 2 * MOST_BUBBLES && heard > QUIET) {
          const span = underwaterFlightSeconds(frame.value('bubbleSize'))
          for (let i = 0; i < more; i++) {
            state.serial += 1
            state.rising.push({
              born: frame.now,
              span,
              hz: frame.meter('pitch'),
              serial: state.serial,
            })
          }
          if (state.rising.length > 48) state.rising.splice(0, state.rising.length - 48)
        }
      }
      if (Number.isFinite(count)) state.count = count
      const held = frame.meter('squeeze')
      state.held = follow(state.held, held > 0 && held <= 1 ? held : 1, frame.dt, 0.02, 0.12)
      state.glints.copyWithin(1, 0)
      state.glints[0] = clamp(frame.meter('light'), -1, 1)
      const level = frame.signal?.output.rms ?? 0
      const loud = clamp((20 * Math.log10(Math.max(level, 1e-6)) + 54) / 48, 0, 1)
      state.glow = follow(state.glow, loud, frame.dt, 0.03, 0.3)
    } else {
      state.held = 1
      state.glow = 0
      state.glints.fill(0)
    }
    // The ones that have reached the surface are gone (in place: nothing is made anew each frame).
    let kept = 0
    for (const bubble of state.rising)
      if (frame.now - bubble.born <= bubble.span) state.rising[kept++] = bubble
    state.rising.length = kept

    const swell = state.swell?.phase ?? 0
    const ripple = state.ripple?.phase ?? 0
    const height = layout.swell * frame.value('waver') * heard
    const surface = (x: number): number => surfaceAt(layout, x, swell, ripple, rate, height)

    // The surface, and under it the water: lit at the surface and darker the further down, as the top goes.
    const columns = Math.max(2, Math.ceil(box.w))
    if (state.line.length !== columns + 1)
      state.line = Array.from({ length: columns + 1 }, (): [number, number] => [0, 0])
    for (let c = 0; c <= columns; c++) {
      const x = box.x + (c / columns) * box.w
      state.line[c][0] = x
      state.line[c][1] = surface(x)
    }
    if (mix > QUIET) {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(state.line[0][0], state.line[0][1])
      for (let c = 1; c <= columns; c++) ctx.lineTo(state.line[c][0], state.line[c][1])
      ctx.lineTo(box.x + box.w, foot)
      ctx.lineTo(box.x, foot)
      ctx.closePath()
      ctx.clip()
      // Whole rows of pixels, two at a time, so no row is laid twice and none is left bare.
      const first = Math.floor(surfaceY - layout.swell)
      ctx.fillStyle = colours.ink
      for (let row = first; row < foot; row += 2) {
        const under = clamp((row + 1 - surfaceY) / (layout.deepY - surfaceY), 0, 1)
        ctx.globalAlpha = (WATER_DEEP + (WATER_LIT - WATER_DEEP) * (1 - under)) * mix
        ctx.fillRect(box.x, row, box.w, Math.min(2, foot - row))
      }
      ctx.restore()
      ctx.globalAlpha = 1
    }

    // How high the surface swings for each Waver: the slope the ring runs up.
    const [depthPoint, waverPoint] = underwaterHandles(frame)
    rule(
      ctx,
      layout.waverFrom,
      surfaceY,
      layout.waverTo,
      surfaceY - layout.swell * waverRise(frame),
      { colour: colours.ink, alpha: INK.grid, dash: [2, 3] },
    )

    // Light on the water: rays that reach as deep as the water passes what flickers.
    const light = frame.value('surface') * heard
    if (light > QUIET) {
      // Part way in the mix the water is shallower, and the light reaches further down the Depths.
      const reach = underwaterDepthY(layout, Math.min(1, UNDERWATER_LIGHT_DEPTH / mix))
      // They lean, and the last of them still ends on the display.
      const lean = RAY_LEAN * (reach - surfaceY + layout.swell)
      for (let r = 0; r < RAYS; r++) {
        const x = box.x + ((r + 0.72) / RAYS) * (box.w - lean)
        const from = surface(x)
        const flicker = running ? state.glints[r] : 0
        rule(ctx, x, from, x + (reach - from) * RAY_LEAN, reach, {
          colour: colours.accent,
          alpha: clamp(light * (0.5 + 0.5 * flicker), 0, 1),
          width: 1.5,
        })
      }
    }

    // The squeeze: a mark for every quarter of a full one, strong where it bears on the sound.
    const pressure = frame.value('pressure')
    if (pressure > 0 && mix > QUIET) {
      for (let k = 1; k < SQUEEZE_MARKS; k++) {
        const at = k / SQUEEZE_MARKS / pressure
        if (at > 1) break
        const y = underwaterDepthY(layout, at)
        rule(ctx, box.x + box.w - 7, y, box.x + box.w, y, {
          colour: colours.ink,
          alpha: at <= depth + 1e-9 ? INK.trace : INK.rule,
        })
      }
    }

    trace(ctx, state.line, { colour: colours.ink, width: 1.5 })
    // Where the surface is now, over the sound.
    if (heard > QUIET) dot(ctx, soundX, surface(soundX), 2, colours.accent, { ring: colours.ink })

    // The sound: as wide as its sides are left, as tall as the squeeze leaves it.
    const side = underwaterSide(depth, frame.value('width'))
    const rx = layout.rx * (0.35 + 0.65 * lerp(1, side, mix))
    const ry = layout.ry * lerp(1, state.held, mix)
    const y = depthPoint.y

    // The body of water ringing round it: a ring for every 3 dB of the hump.
    const hump = underwaterHumpDb(frame.value('resonance'), depth)
    // The water has a bottom: a ring of a sound lying deep is drawn as far as the floor and no further.
    if (mix > QUIET && hump > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(box.x, box.y)
      ctx.lineTo(box.x + box.w, box.y)
      ctx.lineTo(box.x + box.w, foot)
      ctx.lineTo(box.x, foot)
      ctx.closePath()
      ctx.clip()
      for (let k = 0; k < 4; k++) {
        const share = clamp(hump / 3 - k, 0, 1)
        if (share <= 0) break
        ellipse(ctx, soundX, y, rx + 3 * (k + 1), ry + 2.2 * (k + 1))
        ctx.globalAlpha = INK.back * share * mix
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.stroke()
      }
      ctx.restore()
      ctx.globalAlpha = 1
    }

    // Bubbles: one flight as the settings would send it, the later the higher, and in the second colour the
    // ones the device has sent, each on its way up for as long as a flight takes to come.
    // Just under the surface there is no water over the sound to rise through: they stay at the surface, not in the air.
    const top = Math.max(y - ry - 1, surfaceY + 1)
    const column = top - surfaceY - 1
    if (heard > QUIET) {
      const flight = underwaterFlight(frame.value('bubbles'), frame.value('bubbleSize'))
      flight.forEach((bubble, i) => {
        const up = bubble.late / 3
        const radius = underwaterBubbleRadius(bubble.hz, layout.unit)
        ctx.beginPath()
        ctx.arc(
          soundX + (i % 2 === 0 ? 1 : -1) * (2 + radius + 8 * up * layout.unit),
          top - up * column,
          radius,
          0,
          Math.PI * 2,
        )
        ctx.globalAlpha = INK.back * clamp(heard * 2, 0, 1)
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.stroke()
      })
      ctx.globalAlpha = 1
      for (const bubble of state.rising) {
        const up = clamp((frame.now - bubble.born) / bubble.span, 0, 1)
        const sway = (scatter(bubble.serial) - 0.5) * 2
        dot(
          ctx,
          soundX + sway * (5 + 19 * up) * layout.unit,
          top - up * column,
          underwaterBubbleRadius(bubble.hz, layout.unit),
          colours.accent,
          { alpha: clamp((1 - up) * 3, 0, 1) * 0.9 * clamp(heard * 2, 0, 1) },
        )
      }
    }

    ellipse(ctx, soundX, y, rx, ry)
    ctx.fillStyle = colours.plate
    ctx.fill()
    if (state.glow > 0) {
      ctx.globalAlpha = 0.85 * state.glow
      ctx.fillStyle = colours.accent
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1.5
    // With none of the water in the mix the sound is not in it: a dashed outline where it would hang.
    ctx.setLineDash(mix > QUIET ? [] : [2, 2])
    ctx.stroke()
    ctx.setLineDash([])

    handle(frame, depthPoint.x, depthPoint.y, { hot: frame.hot === 'depth', radius: 2.5 })
    handle(frame, waverPoint.x, waverPoint.y, { hot: frame.hot === 'waver' })

    // In hand, a point says what it sets in the sound's own terms.
    if (frame.hot === 'depth') {
      const right = soundX + rx + 60 < box.x + box.w
      label(
        frame,
        hzText(underwaterCorner(depth, mix)),
        right ? soundX + rx + 8 : soundX - rx - 8,
        clamp(crisp(y) + 3, box.y + 8, foot - 1),
        right ? 'left' : 'right',
      )
    }
    if (frame.hot === 'waver') {
      const cents = underwaterBendCents(frame.value('waver'), rate, depth, mix)
      const right = waverPoint.x + 44 < box.x + box.w
      label(
        frame,
        `${Math.round(cents)} ct`,
        right ? waverPoint.x + 9 : waverPoint.x - 9,
        clamp(waverPoint.y + 3, 9, foot - 1),
        right ? 'left' : 'right',
      )
    }
  },
  handles: underwaterHandles,
})

export const UNDERWATER_FACES: Readonly<Record<string, PlateFace>> = {
  underwater: {
    display: underwater,
    face: ['depth', 'waver', 'bubbles', 'mix'],
  },
}
