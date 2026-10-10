// The display of Seasons, against `cpp/devices/seasons/seasons.h`: the Year
// dial laid out from end to end, a season to each quarter, with each season's
// share of the blend as a hill, the place the year has reached, and what that
// place does by pitch:
// the tone it gives the sound before its room, and how long its room rings.
// Every figure here is the header's own: the weights, the two shelves, the
// trims, the band the crumble breaks, and the room's lines and their losses.

import {
  INK,
  TEXT_LEAST,
  clamp,
  clipped,
  dot,
  fillTo,
  follow,
  freqGrid,
  ground,
  handle,
  hzOfX,
  responsePoints,
  rule,
  text,
  trace,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

export const SEASON_NAMES = ['Spring', 'Summer', 'Autumn', 'Winter'] as const

// What each season is at Depth 1, from `seasons_parts` in the header.
const LOW_SHELF_DB = [-2, 3, 2, -7]
const LOW_SHELF_HZ = [200, 260, 180, 400]
const HIGH_SHELF_DB = [4.5, -2, -9, 3]
const HIGH_SHELF_HZ = [2800, 4500, 1300, 6500]
/** `kTrimDb`: what holds the loudness round the year. */
const TRIM_DB = [0.05, -1.55, 0.1, 2.4]
/** `kSpaceTrimDb`: what the sound gives up as its room comes in. */
const SPACE_TRIM_DB = [1.6, 2.2, 2.2, 0.55]
/** `kTopBandHz`: above this the sound shimmers and crumbles. */
const TOP_BAND_HZ = 900
// The room: each season's decay, and what its top and its bottom keep of it past their crossovers.
const DECAY_SEC = [0.5, 3.2, 0.9, 8]
const HIGH_CROSS_HZ = [6000, 3000, 1600, 5000]
const HIGH_DECAY = [0.6, 0.35, 0.25, 0.7]
const LOW_CROSS_HZ = [250, 150, 150, 600]
const LOW_DECAY = [0.5, 1, 0.8, 0.2]
/** `kLineMs`: the eight lines of the network. */
const LINE_MS = [41.3, 49.7, 59.9, 71.3, 83.9, 97.7, 113.3, 131.9]
/** `kTailLeast` and `kTailSpan`: Tails takes the decay from 0.4 of the season's own to 2.5 times it. */
const TAIL_LEAST = 0.4
const TAIL_SPAN = 6.25

const frac = (value: number): number => value - Math.floor(value)

/** `kSpringAt`: where spring's middle is on the Year dial; each season after it is a quarter further on. */
export const SEASONS_SPRING_AT = 0.125

/** The share of season `k` (0 spring .. 3 winter) at `year`: `weight` in the header. */
export function seasonWeight(k: number, year: number): number {
  let away = year - SEASONS_SPRING_AT - 0.25 * k
  away -= Math.floor(away + 0.5)
  away = Math.abs(away)
  if (away >= 0.25) return 0
  const c = Math.cos(2 * Math.PI * away)
  return c * c
}

const sharesAt = (year: number): number[] => [0, 1, 2, 3].map((k) => seasonWeight(k, year))
const blend = (table: readonly number[], w: readonly number[]): number =>
  table.reduce((sum, value, k) => sum + value * w[k], 0)
const blendLog = (table: readonly number[], w: readonly number[]): number =>
  Math.exp(table.reduce((sum, value, k) => sum + Math.log(value) * w[k], 0))

export interface SeasonsTone {
  year: number
  depth: number
  space: number
  width: number
  mix: number
  /** The share of the level that has gone to the left (the device's `sway` reading); 0 at rest. */
  side?: number
  /** The gain of the band above 900 Hz under the crumble (its `crumble` reading); 1 at rest. */
  top?: number
}

/** A first-order low pass as the kit's `OnePole` runs it, at `hz`: its real and imaginary parts. */
function onePole(cutHz: number, hz: number, sampleRate: number): [number, number] {
  const a = Math.exp((-2 * Math.PI * cutHz) / sampleRate)
  const w = (2 * Math.PI * hz) / sampleRate
  const re = 1 - a * Math.cos(w)
  const im = a * Math.sin(w)
  const scale = (1 - a) / (re * re + im * im)
  return [re * scale, -im * scale]
}

/**
 * What the device does to a frequency on its way straight through, in dB:
 * the low and high shelf side by side, the band above 900 Hz at `top`, the
 * trim (and the Width's and the sway's part of it), and the Mix with the
 * sound as it came in. The room, the warmth and the sparks come on top.
 */
export function seasonsToneDb(hz: number, tone: SeasonsTone, sampleRate: number): number {
  const w = sharesAt(tone.year)
  const low = Math.pow(10, (tone.depth * blend(LOW_SHELF_DB, w)) / 20)
  const high = Math.pow(10, (tone.depth * blend(HIGH_SHELF_DB, w)) / 20)
  const [lowRe, lowIm] = onePole(blendLog(LOW_SHELF_HZ, w), hz, sampleRate)
  const [highRe, highIm] = onePole(blendLog(HIGH_SHELF_HZ, w), hz, sampleRate)
  // x + (low − 1)·lowpass(x) + (high − 1)·(x − lowpass(x))
  const re = 1 + (low - 1) * lowRe + (high - 1) * (1 - highRe)
  const im = (low - 1) * lowIm - (high - 1) * highIm
  // The band above 900 Hz of that, at its own gain.
  const [bandRe, bandIm] = onePole(TOP_BAND_HZ, hz, sampleRate)
  const top = (tone.top ?? 1) - 1
  const topRe = 1 + top * (1 - bandRe)
  const topIm = -top * bandIm
  const widened = 1 / Math.sqrt(0.75 + 0.25 * tone.width * tone.width)
  const trimDb = tone.depth * blend(TRIM_DB, w) - tone.depth * tone.space * blend(SPACE_TRIM_DB, w)
  const gain = widened * Math.pow(10, trimDb / 20) * (1 + (tone.side ?? 0))
  const outRe = 1 - tone.mix + tone.mix * gain * (re * topRe - im * topIm)
  const outIm = tone.mix * gain * (re * topIm + im * topRe)
  const power = outRe * outRe + outIm * outIm
  return power > 1e-8 ? 10 * Math.log10(power) : -80
}

/**
 * How long the room rings at a frequency, in seconds to 60 dB down: what one
 * trip round the eight lines loses there (each line's own gain, less what its
 * top and its bottom lose past their crossovers), over the time the trip takes.
 */
export function seasonsRingSec(hz: number, year: number, tail: number, sampleRate: number): number {
  const w = sharesAt(year)
  const decay = blendLog(DECAY_SEC, w) * TAIL_LEAST * Math.pow(TAIL_SPAN, tail)
  const highDecay = decay * blend(HIGH_DECAY, w)
  const lowDecay = decay * blend(LOW_DECAY, w)
  const [dampRe, dampIm] = onePole(blendLog(HIGH_CROSS_HZ, w), hz, sampleRate)
  const [cutRe, cutIm] = onePole(blendLog(LOW_CROSS_HZ, w), hz, sampleRate)
  let lost = 0
  let time = 0
  for (const ms of LINE_MS) {
    const sec = ms / 1000
    // kit::rt60_gain for this line, at the three decays.
    const kept = Math.pow(10, (-3 * sec) / decay)
    const highLoss = 1 - Math.pow(10, (-3 * sec) / highDecay) / kept
    const lowLoss = 1 - Math.pow(10, (-3 * sec) / lowDecay) / kept
    // out − highLoss·(out − lowpass(out)) − lowLoss·lowpass(out)
    const re = 1 - highLoss * (1 - dampRe) - lowLoss * cutRe
    const im = highLoss * dampIm - lowLoss * cutIm
    lost += Math.log10(kept * Math.hypot(re, im))
    time += sec
  }
  return (-3 * time) / lost
}

/** The room's scale: its foot and its top, in seconds, on a scale of equal ratios. */
export const SEASONS_RING_LEAST = 0.05
export const SEASONS_RING_MOST = 20

/** Where a ring of so many seconds stands in the tone's box. */
export const yOfRing = (seconds: number, tone: Box): number =>
  tone.y +
  tone.h *
    (1 -
      clamp(
        Math.log(seconds / SEASONS_RING_LEAST) / Math.log(SEASONS_RING_MOST / SEASONS_RING_LEAST),
        0,
        1,
      ))

/** How strongly the room's ground is laid, by how much of the room is heard; nothing for none. */
export const ringAlpha = (heard: number): number => (heard > 0 ? 0.1 + 0.28 * heard : 0)

/** The tone's scale: so many dB to the top of its box, and as many down. */
export const SEASONS_TONE_DB = 9

/** The wedge behind the mark is the stretch the year turned through in this many seconds. */
export const SEASONS_TRAIL_SEC = 10

export interface SeasonsLayout {
  /** Where the hills stand: the year across, Depth up. */
  hills: Box
  /** The baseline of the seasons' names. */
  namesY: number
  /** The tone's box: frequency across, dB up. */
  tone: Box
  /** Where the sparks' mark stands, beside the tone. */
  sparkX: number
}

const GAP = 6
const NAMES_ROW = 11
const SPARK_ROOM = 7

/** The year on top and the tone under it where there is height for both; side by side on a strip. */
export function seasonsLayout(view: Pick<DisplayView, 'width' | 'height'>): SeasonsLayout {
  // The box `ground` hands back.
  const inner = { x: 4, y: 4, w: Math.max(40, view.width - 8), h: Math.max(24, view.height - 8) }
  const stacked = view.height >= 80
  const bandW = stacked ? inner.w : Math.round((inner.w - GAP) * 0.69)
  const bandH = stacked ? Math.floor((inner.h - GAP) * 0.52) : inner.h
  const toneX = stacked ? inner.x : inner.x + bandW + GAP
  const toneY = stacked ? inner.y + bandH + GAP : inner.y
  const toneW = stacked ? inner.w : inner.w - bandW - GAP
  const toneH = stacked ? inner.h - bandH - GAP : inner.h
  return {
    // Two pixels in, so the ring is whole at the band's ends and at full Depth.
    hills: { x: inner.x + 2, y: inner.y + 2, w: bandW - 4, h: bandH - 2 - NAMES_ROW },
    namesY: inner.y + bandH - 1,
    tone: { x: toneX, y: toneY, w: toneW - SPARK_ROOM, h: toneH },
    sparkX: toneX + toneW - 3,
  }
}

/** The Year dial from end to end across the band: both ends are the turn of the year. */
export const xOfYear = (year: number, hills: Box): number => hills.x + clamp(year, 0, 1) * hills.w

export const yearOfX = (x: number, hills: Box): number => clamp((x - hills.x) / hills.w, 0, 1)

/** The stretches of [from, to], in turns of the year, that fall on the picture, moved onto it. */
function onPicture(from: number, to: number): [number, number][] {
  const parts: [number, number][] = []
  for (const shift of [-1, 0, 1]) {
    const a = Math.max(0, from + shift)
    const b = Math.min(1, to + shift)
    if (b - a > 1e-9) parts.push([a - shift, b - shift])
  }
  return parts
}

const HILL_STEPS = 24

/**
 * Season `k`'s hill, `tall` of the box at its top: its share of the blend at
 * every place in the year. It is half a year wide, so spring's and winter's
 * come in two pieces, one at each end of the picture.
 */
export function seasonsHill(k: number, hills: Box, tall: number): Point[][] {
  const foot = hills.y + hills.h
  const from = SEASONS_SPRING_AT + 0.25 * k - 0.25
  return onPicture(from, from + 0.5).map(([a, b]) => {
    // How many whole years the piece was moved to fall on the picture.
    const moved = Math.floor(a + 1e-9)
    const points: Point[] = []
    for (let i = 0; i <= HILL_STEPS; i++) {
      const at = a + ((b - a) * i) / HILL_STEPS
      const share = seasonWeight(k, at)
      points.push([hills.x + clamp(at - moved, 0, 1) * hills.w, foot - tall * share * hills.h])
    }
    return points
  })
}

/**
 * How far the year turned in the last `SEASONS_TRAIL_SEC`, in years, with its
 * sign: forward is positive, a year at the most, nothing while it stands.
 */
export function seasonsTrail(turn: number, turning: number): number {
  const mode = Math.round(turn)
  if (mode !== 1 && mode !== 2) return 0
  const years = Math.min(1, SEASONS_TRAIL_SEC / Math.max(1, turning))
  return mode === 1 ? years : -years
}

const TRAIL_TALL = 3

/** The wedge behind the mark: tallest at the mark, nothing where the year stood `SEASONS_TRAIL_SEC` ago. */
export function seasonsWedge(now: number, trail: number, hills: Box): Point[][] {
  if (trail === 0) return []
  const foot = hills.y + hills.h
  const head = clamp(now, 0, 1)
  const tail = head - trail
  const tallAt = (at: number): number => TRAIL_TALL * (1 - Math.abs(at - head) / Math.abs(trail))
  return onPicture(Math.min(head, tail), Math.max(head, tail)).map(([a, b]) => {
    const shift = Math.floor(a + 1e-9)
    const x1 = hills.x + (a - shift) * hills.w
    const x2 = hills.x + (b - shift) * hills.w
    return [
      [x1, foot],
      [x1, foot - tallAt(a)],
      [x2, foot - tallAt(b)],
      [x2, foot],
    ]
  })
}

/**
 * The one point: across is Year, up is Depth. It stands where the Year knob
 * put the year; the lit mark walks on from it while the year turns.
 */
function seasonsHandles(view: DisplayView): DisplayHandle[] {
  const { hills } = seasonsLayout(view)
  const foot = hills.y + hills.h
  const year = view.value('year')
  const depth = view.value('depth')
  const spec = view.spec('depth')
  const least = spec?.min ?? 0
  const most = spec?.max ?? 1
  const x = xOfYear(year, hills)
  const y = foot - ((depth - least) / (most - least)) * hills.h
  return [
    {
      key: 'year',
      name: 'Year and Depth',
      x,
      y,
      drag: (toX, toY) => ({
        year: Math.abs(toX - x) < 1e-6 ? year : yearOfX(toX, hills),
        depth:
          Math.abs(toY - y) < 1e-6
            ? depth
            : least + clamp((foot - toY) / hills.h, 0, 1) * (most - least),
      }),
      reset: () => ({ year: view.spec('year')?.default ?? 0, depth: spec?.default ?? depth }),
    },
  ]
}

interface SeasonsState {
  /** The sparks' level as it is shown: up at once, down over a tenth of a second. */
  spark: number
}

/** How strongly the hill of a season that is the whole blend is filled. */
const HILL_FILL = 0.34
/** A season with less of the blend than this has no dot on the mark. */
const DOT_LEAST = 0.02
/** The left side is drawn apart from the tone at rest where it is this far from it: a third of a dB. */
const SIDE_LEAST = 0.035
const TOP_LEAST = 0.96

const seasons = plateDisplay<SeasonsState>({
  place: 'strip',
  params: ['year', 'depth', 'space', 'tail', 'width', 'turn', 'turning', 'mix'],
  live: { meters: true },
  info: 'The year from spring to winter: each hill is a season, as tall as Depth, filled by its share of the blend. The lit line is the year now, the wedge its last ten seconds. Beside it, by pitch: the line is the tone given the sound, the ground how long the room rings. The ring sets Year and Depth.',
  init: () => ({ spark: 0 }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { hills, namesY, tone, sparkX } = seasonsLayout(frame)
    const foot = hills.y + hills.h
    const depth = frame.value('depth')
    const mix = frame.value('mix')
    // Asleep the device reports a whole top band, so a reading of none is no reading yet.
    const live = frame.powered && frame.hasMeter('year') && frame.meter('crumble') > 0
    // At rest the mark stands with the ring, at either end of the dial too.
    const now = live ? frac(frame.meter('year')) : clamp(frame.value('year'), 0, 1)
    const shares = sharesAt(now)

    // The year: a level for the whole of Depth, the foot, and the four hills.
    rule(ctx, hills.x, hills.y, hills.x + hills.w, hills.y, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    rule(ctx, hills.x, foot, hills.x + hills.w, foot, { colour: colours.ink, alpha: INK.rule })
    for (let k = 0; k < 4; k++) {
      // What is heard of a season: its share now, as far as Depth and Mix let it in.
      if (shares[k] > 0.004 && depth * mix > 0) {
        for (const piece of seasonsHill(k, hills, depth * mix))
          fillTo(ctx, piece, foot, colours.ink, HILL_FILL * shares[k])
      }
      for (const piece of seasonsHill(k, hills, depth))
        trace(ctx, piece, {
          colour: colours.ink,
          width: 1.25,
          alpha: INK.back + (INK.trace - INK.back) * shares[k],
        })
    }
    for (const wedge of seasonsWedge(
      now,
      seasonsTrail(frame.value('turn'), frame.value('turning')),
      hills,
    )) {
      ctx.beginPath()
      wedge.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
      ctx.closePath()
      ctx.fillStyle = colours.accent
      ctx.fill()
    }

    // The names, each under its hill; where four do not fit, the one the year is in.
    ctx.font = `8px ${frame.fontFamily}`
    const wide = SEASON_NAMES.map((name) => ctx.measureText(name).width)
    const nearest = shares.indexOf(Math.max(...shares))
    const fit = Math.max(...wide) + 3 <= hills.w / 4
    for (let k = 0; k < 4; k++) {
      if (!fit && k !== nearest) continue
      const half = wide[k] / 2
      const middle = hills.x + (0.25 * k + SEASONS_SPRING_AT) * hills.w
      text(
        frame,
        SEASON_NAMES[k],
        clamp(middle, hills.x + half, hills.x + hills.w - half),
        namesY,
        {
          align: 'center',
          alpha: k === nearest ? 1 : TEXT_LEAST,
        },
      )
    }

    // The year now, and how much of each season is in it.
    const nowX = xOfYear(now, hills)
    trace(
      ctx,
      [
        [nowX, hills.y],
        [nowX, foot],
      ],
      { colour: colours.accent, width: 1.5 },
    )
    for (let k = 0; k < 4; k++) {
      if (shares[k] < DOT_LEAST || depth <= 0) continue
      dot(ctx, nowX, foot - depth * shares[k] * hills.h, 2, colours.accent, { ring: colours.plate })
    }

    // The tone at that place: at rest in the ink, the left side as it is now in the accent.
    const at = {
      year: now,
      depth,
      space: frame.value('space'),
      width: frame.value('width'),
      mix,
    }
    const zero = yOfDb(0, tone, SEASONS_TONE_DB, -SEASONS_TONE_DB)
    freqGrid(frame, tone)
    rule(ctx, tone.x, zero, tone.x + tone.w, zero, { colour: colours.ink, alpha: INK.rule })
    const curve = (which: SeasonsTone): Point[] =>
      responsePoints(
        tone,
        (hz) => seasonsToneDb(hz, which, frame.sampleRate),
        SEASONS_TONE_DB,
        -SEASONS_TONE_DB,
      )
    const side = live ? clamp(frame.meter('sway'), -0.9, 0.9) : 0
    const top = live ? clamp(frame.meter('crumble'), 0, 1) : 1
    // The room under it: how long it rings at each pitch, as far as Space, Depth and Mix let it be heard.
    const heard = at.space * depth * mix
    const tail = frame.value('tail')
    clipped(ctx, tone, () => {
      if (heard > 0) {
        const room: Point[] = []
        for (let x = 0; x <= tone.w; x += 2) {
          const hz = hzOfX(tone.x + x, tone)
          room.push([tone.x + x, yOfRing(seasonsRingSec(hz, now, tail, frame.sampleRate), tone)])
        }
        fillTo(ctx, room, tone.y + tone.h, colours.ink, ringAlpha(heard))
      }
      trace(ctx, curve(at), { colour: colours.ink, width: 1.5 })
      if (mix > 0 && (Math.abs(side) > SIDE_LEAST || top < TOP_LEAST))
        trace(ctx, curve({ ...at, side, top }), { colour: colours.accent, width: 1.5 })
    })

    // The sparks: a mark as high as the one sounding is loud.
    const glitter = live ? clamp(frame.meter('glitter'), 0, 1) * mix : 0
    state.spark = frame.dt > 0 ? follow(state.spark, glitter, frame.dt, 0, 0.1) : glitter
    if (state.spark > 0.004) {
      const sparkFoot = tone.y + tone.h
      const sparkY = sparkFoot - state.spark * (tone.h - 3)
      rule(ctx, sparkX, sparkFoot, sparkX, sparkY, { colour: colours.accent })
      dot(ctx, sparkX, sparkY, 1.75, colours.accent)
    }

    const [point] = seasonsHandles(frame)
    handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: seasonsHandles,
})

export const SEASONS_FACES: Readonly<Record<string, PlateFace>> = {
  // Turn stands over Turning on the upright plate; Motion, Grit and Tails follow there.
  seasons: {
    display: seasons,
    face: ['year', 'depth', 'space', 'turn'],
  },
}
