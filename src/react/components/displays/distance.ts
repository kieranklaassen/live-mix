// The display of Distance: the room seen from above, with the listener at the
// left and the depth running to the right on a scale of doublings (1 m, 2 m,
// 4 m ... 32 m), as the Distance knob runs. Up and down is where a sound
// comes from, left of the listener at the top.
//
// Everything on it is the device's own arithmetic (`cpp/devices/distance/
// distance.h`), worked out for where the source is now, which the device
// reports: the dot is the direct sound, as large as it is loud and as bright
// as the air leaves it; the bar through it is its width; the small dots
// behind it are the first reflections, each where its image source stands
// (as far as its path is long, as far to a side as it is heard); the ring
// round the dot is the diffuse room, as large as it is loud.

import {
  INK,
  clamp,
  clipped,
  dot,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The model, as `distance.h` has it ---------------------------------------

/** The constants of `distance.h`, by the names they have there. */
export const DISTANCE = {
  /** `kOctaves`: the doublings from 1 m to `kFarMetres`. */
  octaves: 5,
  /** `kFarMetres`. */
  farMetres: 32,
  /** `kSoundSpeed`, metres a second. */
  soundSpeed: 343,
  /** `kAirHz`: the air's corner at Air 1 and 32 m. */
  airHz: 1500,
  /** `kAirPoleRatio`: each of the two poles stands this far above the corner. */
  airPoleRatio: 1.5571,
  /** `kNarrowestRoom`, metres. */
  narrowestRoom: 4,
  /** `kEarHeight`, metres. */
  earHeight: 1.5,
  /** `kCeilingBase` and `kCeilingSlope`: the ceiling's height is base + slope · width. */
  ceilingBase: 2.4,
  ceilingSlope: 0.3,
  /** `kRoomLevelSmall` and `kRoomLevelLarge`. */
  roomLevelSmall: 0.5,
  roomLevelLarge: 0.25,
  /** `kFall`: the whole falls as the distance to the power of minus this. */
  fall: 0.35,
  /** `kEarlyPower`: how much of the reflections' summed power a side hears. */
  earlyPower: 0.5,
  /** `kImageAcross`, in room widths; `kImageUp` (0 level, 1 floor, 2 ceiling); `kImageKeeps`. */
  imageAcross: [0, 0, -1.14, 0.86, -1.14, 0.86, -2, 2.86],
  imageUp: [1, 2, 0, 0, 2, 1, 0, 0],
  imageKeeps: [0.35, 0.7, 0.7, 0.7, 0.49, 0.245, 0.49, 0.343],
} as const

/** `metres`: how far a place (0 close, 1 far) is. */
export const metresOf = (place: number): number => Math.pow(2, DISTANCE.octaves * place)

/** The place that is so many metres away: the way back through `metresOf`. */
export const placeOfMetres = (metres: number): number =>
  Math.log2(Math.max(1e-9, metres)) / DISTANCE.octaves

/** `span`: the ends of the walk, Wander's half either side of Distance, kept inside 0..1. */
export function walkOf(distance: number, wander: number): { near: number; far: number } {
  return { near: Math.max(0, distance - wander / 2), far: Math.min(1, distance + wander / 2) }
}

/** `air_corner`: the air's −3 dB point, Hz; infinite where it takes nothing. */
export function airCorner(air: number, metres: number): number {
  const amount = (air * air * (metres - 1)) / (DISTANCE.farMetres - 1)
  return amount > 0 ? DISTANCE.airHz / Math.sqrt(amount) : Infinity
}

/**
 * What the air leaves of a frequency, as a gain: the two one-pole low-passes
 * of `process`, each `y += (1 − keep)(x − y)` with `keep` as `aim` sets it.
 */
export function airGain(corner: number, hz: number, sampleRate: number): number {
  if (!Number.isFinite(corner)) return 1
  const keep = Math.exp((-2 * Math.PI * DISTANCE.airPoleRatio * corner) / sampleRate)
  const w = (2 * Math.PI * hz) / sampleRate
  // One pole's power response; two of them in a row give it squared, which as a gain is itself.
  return ((1 - keep) * (1 - keep)) / (1 - 2 * keep * Math.cos(w) + keep * keep)
}

/** `air_kept`: how much of the power of pink noise the air leaves. */
export function airKept(corner: number): number {
  if (!Number.isFinite(corner)) return 1
  const pole = DISTANCE.airPoleRatio * corner
  const low = (20 / pole) ** 2
  const high = (20000 / pole) ** 2
  const part = (u: number): number => Math.log(u / (1 + u)) + 1 / (1 + u)
  return (part(high) - part(low)) / Math.log(high / low)
}

/** `side_gain`: the gain on the sides against the middle. */
export function sideGain(place: number, width: number): number {
  const seen = Math.pow(2, DISTANCE.octaves * place * width)
  return seen > 1 ? Math.min(1, (Math.atan(1 / seen) * 4) / Math.PI) : 1
}

/** `room_width`, metres, and `room_level`. */
export const roomWidth = (room: number): number => DISTANCE.narrowestRoom * Math.pow(10, room)
export const roomLevel = (room: number): number =>
  DISTANCE.roomLevelSmall * Math.pow(DISTANCE.roomLevelLarge / DISTANCE.roomLevelSmall, room)

/** `fall`: what the whole loses to the distance, as a gain. */
export const fallOf = (place: number): number =>
  Math.pow(2, -DISTANCE.fall * DISTANCE.octaves * place)

/**
 * `late_gain`: the gain of the diffuse room at a place before the fall, which
 * is its level and its share of the sound. The room itself is an allpass, so
 * this is all there is to how loud it is.
 */
export const lateGain = (place: number, room: number): number =>
  roomLevel(room) * (1 - 1 / metresOf(place))

export interface Reflection {
  /** How long its path is, metres: where its image source stands. */
  path: number
  /** Its gain before Level. */
  gain: number
  /** Where it is heard, −1 hard left to 1 hard right. */
  bearing: number
}

/** The eight first reflections for a source at a place: `image` and the loop over the taps in `aim`. */
export function reflections(place: number, room: number, width: number): Reflection[] {
  const d = metresOf(place)
  const share = 1 - 1 / d
  const w = roomWidth(room)
  const seen = Math.pow(2, DISTANCE.octaves * place * width)
  return DISTANCE.imageAcross.map((sides, k) => {
    const across = sides * w
    const up =
      DISTANCE.imageUp[k] === 0
        ? 0
        : DISTANCE.imageUp[k] === 1
          ? 2 * DISTANCE.earHeight
          : 2 * (DISTANCE.ceilingBase + DISTANCE.ceilingSlope * w - DISTANCE.earHeight)
    const off = across * across + up * up
    const path = Math.sqrt(d * d + off)
    return {
      path,
      gain: (share * DISTANCE.imageKeeps[k]) / path,
      bearing: across / Math.sqrt(seen * seen + off),
    }
  })
}

export interface Scene {
  place: number
  metres: number
  /** The gain on everything from Level: `hold` to the power of Level. */
  lift: number
  /** The direct sound's gain, the diffuse room's and each reflection's, with the lift on them. */
  direct: number
  room: number
  early: Reflection[]
  /** The sides against the middle. */
  side: number
  /** What the air leaves at `BRIGHT_HZ`, as a gain. */
  bright: number
}

/** The frequency the dot's brightness is read at, Hz. */
export const BRIGHT_HZ = 4000

/** What the device makes of a source at a place: the gains `aim` sets. */
export function sceneOf(
  place: number,
  set: { room: number; air: number; level: number; width: number },
  sampleRate: number,
): Scene {
  const metres = metresOf(place)
  const direct = 1 / metres
  const early = reflections(place, set.room, set.width)
  const late = lateGain(place, set.room)
  const corner = airCorner(set.air, metres)
  let power = 0
  for (const tap of early) power += tap.gain * tap.gain
  const hold =
    1 / Math.sqrt(airKept(corner) * (direct * direct + DISTANCE.earlyPower * power + late * late))
  // Level 0 has the fall whole, Level 1 none of it.
  const lift = Math.pow(hold, set.level) * Math.pow(fallOf(place), 1 - set.level)
  return {
    place,
    metres,
    lift,
    direct: direct * lift,
    room: late * lift,
    early: early.map((tap) => ({ ...tap, gain: tap.gain * lift })),
    side: sideGain(place, set.width),
    bright: airGain(corner, BRIGHT_HZ, sampleRate),
  }
}

// --- The picture -------------------------------------------------------------

/** The quietest a mark's size tells apart, dB under full. */
export const SIZE_FLOOR_DB = -36
/** The haze of the room is this many times the dot a sound that loud would be. */
export const ROOM_HAZE = 2.4
/** The faintest the dot gets, when the air has taken everything at `BRIGHT_HZ`. */
export const DIM = 0.35
/** The foot of the listener's lamp, dB. */
export const LAMP_FOOT_DB = -48

export interface Layout {
  box: Box
  /** The line the source moves along, and how far off it a sound hard to one side stands. */
  axisY: number
  spread: number
  /** The scale under it. */
  rulerY: number
  /** Where 1 m and 32 m stand. */
  nearX: number
  farX: number
  /** The listener. */
  earX: number
  /** The radius of a mark as loud as the input, and of one at the floor. */
  full: number
  least: number
}

export function layoutOf(view: Pick<DisplayView, 'width' | 'height'>): Layout {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const rulerY = Math.round(box.y + box.h - 11)
  const top = box.y + 1
  const foot = rulerY - 5
  const half = (foot - top) / 2
  const full = clamp(half * 0.4, 3.5, 9)
  const nearX = box.x + 13
  return {
    box,
    axisY: (top + foot) / 2,
    // A reflection hard to one side keeps its whole dot inside the picture.
    spread: Math.max(4, half - 0.6 * full),
    rulerY,
    nearX,
    // Past 32 m there is room for the images of a far source, which stand behind it.
    farX: nearX + Math.max(20, (box.w - 13) * 0.86),
    earX: box.x + 3,
    full,
    least: 1,
  }
}

export const xOfPlace = (layout: Layout, place: number): number =>
  layout.nearX + place * (layout.farX - layout.nearX)

export const placeOfX = (layout: Layout, x: number): number =>
  (x - layout.nearX) / (layout.farX - layout.nearX)

/** How large a mark of that gain is: by its level in dB, from the floor up to full. */
export function radiusOf(layout: Layout, gain: number): number {
  const share = clamp((gainToDb(gain) - SIZE_FLOOR_DB) / -SIZE_FLOOR_DB, 0, 1)
  return layout.least + (layout.full - layout.least) * share
}

/** Where a reflection's dot stands: one from farther than the picture reaches waits at its edge. */
export function reflectionAt(layout: Layout, tap: Reflection): { x: number; y: number; r: number } {
  const r = radiusOf(layout, tap.gain)
  return {
    x: Math.min(xOfPlace(layout, placeOfMetres(tap.path)), layout.box.x + layout.box.w - r),
    y: layout.axisY + tap.bearing * layout.spread,
    r,
  }
}

/** Metres as they are said: "1.4 m", "23 m". */
export const metresText = (metres: number): string =>
  `${metres < 9.95 ? metres.toFixed(1) : Math.round(metres)} m`

/** How far the pitch is bent, in cents: up as the sound comes, down as it leaves. */
export const bendCents = (ratio: number): number =>
  ratio > 0 ? Math.round(1200 * Math.log2(ratio)) : 0

/** A bend as it is said, with a real minus: "+12 ct", "−7 ct". */
export const bendText = (cents: number): string =>
  `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${Math.abs(cents)} ct`

/** Whether the device's readings have come: it reports a bend of 1 at rest, never 0. */
const reads = (frame: DisplayFrame): boolean =>
  frame.powered && frame.hasMeter('position') && frame.meter('bend') > 0

/** Where the source is now: where the device says, or where Distance has it while nothing is read. */
export const placeNow = (frame: DisplayFrame): number =>
  clamp(reads(frame) ? frame.meter('position') : frame.value('distance'), 0, 1)

/**
 * The three points: the source on its line (Distance), and the two ends of
 * its walk on the scale below (Wander). An end that Wander would put past
 * 1 m or 32 m waits at that end of the scale, and is moved from where the
 * setting lies: `hold.past` keeps how far past that was at the press. Either
 * end can be taken either way from the source, so a walk of nothing can be
 * opened from whichever is under the hand.
 */
function distanceHandles(view: DisplayView): DisplayHandle[] {
  const layout = layoutOf(view)
  const distance = view.value('distance')
  const wander = view.value('wander')
  const walk = walkOf(distance, wander)
  const end = (key: 'near' | 'far', name: string, at: number, set: number): DisplayHandle => ({
    key,
    name,
    x: xOfPlace(layout, at),
    y: layout.rulerY,
    drag: (toX: number, _toY: number, hold?: DisplayHold) => {
      const kept = hold ?? {}
      kept.past ??= set - at
      const to = placeOfX(layout, toX) + kept.past
      return { wander: clamp(2 * Math.abs(to - distance), 0, 1) }
    },
    reset: () => ({ wander: view.spec('wander')?.default ?? 0 }),
  })
  return [
    {
      key: 'distance',
      name: 'Distance',
      x: xOfPlace(layout, distance),
      y: layout.axisY,
      drag: (toX: number) => ({ distance: clamp(placeOfX(layout, toX), 0, 1) }),
      reset: () => ({ distance: view.spec('distance')?.default ?? 0 }),
    },
    end('near', 'Nearest it wanders', walk.near, distance - wander / 2),
    end('far', 'Farthest it wanders', walk.far, distance + wander / 2),
  ]
}

/** The scale: a line with a tick at every doubling, and the metres under them. */
function drawRuler(frame: DisplayFrame, layout: Layout): void {
  const { ctx, colours } = frame
  const { box, rulerY } = layout
  rule(ctx, layout.nearX, rulerY, box.x + box.w, rulerY, { colour: colours.ink, alpha: INK.rule })
  for (let doubling = 0; doubling <= DISTANCE.octaves; doubling++) {
    const x = Math.round(xOfPlace(layout, doubling / DISTANCE.octaves))
    rule(ctx, x, rulerY - 2, x, rulerY + 3, { colour: colours.ink, alpha: INK.back })
    const metres = Math.pow(2, doubling)
    text(frame, doubling === DISTANCE.octaves ? `${metres} m` : String(metres), x, rulerY + 11, {
      align: 'center',
      alpha: INK.back,
    })
  }
}

const distance = plateDisplay({
  place: 'strip',
  params: ['distance', 'room', 'air', 'wander', 'level', 'width'],
  live: { meters: true, signal: true },
  info: "The room from above: you at the left, depth to the right in metres. The bright dot is the sound: smaller when quieter, dimmer when the air darkens it. The line through it is its width, the small dots its first reflections, the haze the room. Drag the ring for Distance, the scale's ends for Wander.",
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const layout = layoutOf(frame)
    const { box, axisY, spread, rulerY } = layout
    const live = reads(frame)
    const scene = sceneOf(
      placeNow(frame),
      {
        room: frame.value('room'),
        air: frame.value('air'),
        level: frame.value('level'),
        width: frame.value('width'),
      },
      frame.sampleRate,
    )
    const x = xOfPlace(layout, scene.place)
    const [point, near, far] = distanceHandles(frame)

    // The line the source moves along, from the listener out.
    rule(ctx, layout.earX, axisY, box.x + box.w, axisY, { colour: colours.ink, alpha: INK.grid })
    drawRuler(frame, layout)
    // The walk: its span on the scale, and where on it the source is now.
    if (far.x - near.x > 0.5)
      rule(ctx, near.x, rulerY, far.x, rulerY, { colour: colours.ink, width: 3, alpha: INK.text })
    rule(ctx, x, rulerY - 4, x, rulerY + 4, { colour: colours.accent, width: 2 })

    clipped(ctx, box, () => {
      // The diffuse room: a haze round the source, as large as it is loud.
      if (scene.room > 0)
        dot(ctx, x, axisY, ROOM_HAZE * radiusOf(layout, scene.room), colours.ink, {
          alpha: INK.fill,
        })
      // The first reflections, each where its image stands: as far as its
      // path is long, and as far up (left) or down (right) as it is heard.
      for (const tap of scene.early) {
        if (!(tap.gain > 0)) continue
        const at = reflectionAt(layout, tap)
        dot(ctx, at.x, at.y, at.r, colours.ink, { alpha: INK.text })
      }
    })

    // The points: the ends of the walk on the scale, Distance on the line.
    handle(frame, near.x, near.y, { hot: frame.hot === near.key })
    handle(frame, far.x, far.y, { hot: frame.hot === far.key })
    handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: layout.full + 1.5 })
    // How wide the direct sound still is: the whole height at 1 m.
    rule(ctx, x, axisY - scene.side * spread, x, axisY + scene.side * spread, {
      colour: colours.ink,
      alpha: INK.text,
    })
    // The direct sound, now: as large as it is loud, as bright as the air leaves it.
    dot(ctx, x, axisY, radiusOf(layout, scene.direct), colours.accent, {
      alpha: DIM + (1 - DIM) * scene.bright,
      ring: colours.ink,
    })

    // The listener: an ear at the head of the line, lit by what arrives.
    const heard = frame.signal ? Math.max(frame.signal.output.peak, 0) : 0
    const lit = clamp((gainToDb(heard) - LAMP_FOOT_DB) / -LAMP_FOOT_DB, 0, 1)
    const ear = (): void => {
      ctx.beginPath()
      ctx.arc(layout.earX, axisY, 4, -Math.PI / 2, Math.PI / 2)
      ctx.closePath()
    }
    ear()
    ctx.globalAlpha = 1
    ctx.fillStyle = colours.plate
    ctx.fill()
    if (lit > 0) {
      ear()
      ctx.globalAlpha = lit
      ctx.fillStyle = colours.accent
      ctx.fill()
    }
    ear()
    ctx.globalAlpha = 1
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()

    // In words: how far it is now and, while it moves, how far its pitch is bent.
    // They stand in the corner the source is set away from, so they do not lie over it.
    const cents = live ? bendCents(frame.meter('bend')) : 0
    const metres = metresText(scene.metres)
    const words = cents === 0 ? metres : `${metres} ${bendText(cents)}`
    if (frame.value('distance') > 0.5) label(frame, words, layout.earX + 8, box.y + 8)
    else label(frame, words, box.x + box.w - 1, box.y + 8, 'right')
  },
  handles: distanceHandles,
})

export const DISTANCE_FACES: Readonly<Record<string, PlateFace>> = {
  distance: {
    display: distance,
    face: ['distance', 'room', 'air', 'wander'],
  },
}
