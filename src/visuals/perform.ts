// What a performance asks of the picture.
//
// A host that performs a piece (takes sounds out and brings them in, turns Energy, Space and Tone) hands the desk
// a reading of where the performance stands. From it and the three dials this file works out what the whole
// picture does: with fewer sounds in, the visuals thin out and stand further off; Tone lies over the picture as
// the same filter it is on the mix; Space lets the light ring on. Nothing is set up for it, and a piece that is
// not being performed asks nothing, so its picture is the one its visuals come to.
//
// The reading says where a move is heading, not how far it has come. The picture is taken there over the time
// the host says the move takes, by the time that really went by, so it arrives with the sound.
//
// Pure: no React, no DOM, no audio.

import type { VisualFrame, VisualLayer } from './frame'

/** Where a performance stands, as its host reads it. A share is 0 to 1, and 1 with the piece as composed. */
export interface PerformReading {
  /** How much of the sounds that can leave are left in by hand and by the scene in play. */
  rides: number
  /** How much of them the Energy dial lets through. */
  ladder: number
  /** How long the move that was made last takes, in seconds. */
  overSec: number
}

/** The three dials as the desk is handed them, each 0 to 1. */
export interface PerformDials {
  energy: number
  space: number
  tone: number
}

/** The performance as the picture is drawn with it this frame: the reading and the dials, each where it has come to. */
export interface PerformNow extends PerformDials {
  rides: number
  ladder: number
}

/** A pass over the finished picture. Each part is 0 to 1, and 0 leaves the picture as it is. */
export interface VisualFilter {
  /** The fine detail goes: the picture is mixed with a blurred copy of itself. */
  soft: number
  /** The picture is darker all over. */
  dim: number
  /** The broad light goes and the fine detail stays: each point keeps its light less the light around it. */
  thin: number
  /** The light spreads: the blurred copy is added to the picture. */
  spread: number
}

/** What a performance asks of the picture. `performAsk` of a piece as composed asks nothing: see `AT_REST`. */
export interface PerformAsk {
  /** How full the piece stands, from 0 with one sound left to 1 as composed. */
  full: number
  /** The Energy every style and knob is handed: the dial, or the fullness where that is lower. */
  energy: number
  /** What every visual that paints keeps of its level. */
  level: number
  /** How far every visual that paints steps back: taken off its size. */
  recede: number
  /** How far the vividness is taken down, on top of the palette's own. */
  calm: number
  /** What the trails the piece has keep of their length. */
  trailsKept: number
  /** Trails of its own, for the whole picture; null for none. */
  trails: { length: number; push: number } | null
  /** What the grain is multiplied by. */
  grain: number
  /** The pass over the finished picture; null for none. */
  filter: VisualFilter | null
}

/** Where Tone and Space rest. */
export const DIAL_REST = 0.5
/**
 * How far either side of its rest Tone and Space do nothing. The same span the sound's Tone filter leaves alone, so
 * the picture is filtered exactly when the mix is.
 */
export const DIAL_REST_SPAN = 0.02

/** What stays of a visual's level with one sound left. */
const LEVEL_AT_BAREST = 0.7
/** How far a visual steps back with one sound left, as a part of its Size. */
const RECEDE_AT_BAREST = 0.12
/** How far the vividness is taken down with one sound left. */
const CALM_AT_BAREST = 0.25
/** Tone all the way down: how much of the blurred copy is mixed in, and how much darker the picture is. */
const SOFT_AT_LOWEST = 0.85
const DIM_AT_LOWEST = 0.35
/** Tone all the way up: how much of the broad light is taken away. */
const THIN_AT_HIGHEST = 0.8
/** What Tone does to the grain: less of it all the way down, more all the way up. */
const GRAIN_AT_LOWEST = 0.4
const GRAIN_AT_HIGHEST = 1.8
/** Space all the way up: how long the light stays, how far it drifts outward, and how much of it spreads. */
const TRAILS_AT_WIDEST = 0.75
const PUSH_AT_WIDEST = 0.5
const SPREAD_AT_WIDEST = 0.35
/** Space all the way down: what the piece's own trails keep of their length. */
const TRAILS_KEPT_AT_DRIEST = 0.3
/** A part of the filter smaller than this is not drawn. */
const LEAST_FILTERED = 0.004

/** A value that has come this close to where it is heading is put there. */
const ARRIVED = 0.002
/** A move is taken over a quarter of the seconds it takes, as a time constant: what the sound's own glide does. */
const TIME_CONSTANTS = 4
/** No move is followed faster than this, in seconds: one frame at sixty a second. */
const QUICKEST_SEC = 1 / 60

const clamp01 = (value: number): number => (value > 0 ? (value < 1 ? value : 1) : 0)
/** A share: 1 where it is not a number, since a host that cannot say is not performing. */
const share = (value: number): number => (Number.isFinite(value) ? clamp01(value) : 1)
const dial = (value: number, rest: number): number =>
  Number.isFinite(value) ? clamp01(value) : rest

/** How far a dial stands under its rest and over it, each 0 to 1, and both 0 within the rest span. */
function offRest(value: number): { under: number; over: number } {
  const reach = DIAL_REST - DIAL_REST_SPAN
  const off = dial(value, DIAL_REST) - DIAL_REST
  return {
    under: off < -DIAL_REST_SPAN ? clamp01((-off - DIAL_REST_SPAN) / reach) : 0,
    over: off > DIAL_REST_SPAN ? clamp01((off - DIAL_REST_SPAN) / reach) : 0,
  }
}

/** A performance in which nothing has been moved, with Energy where it is handed. */
export function performAtRest(energy = 1): PerformNow {
  return { rides: 1, ladder: 1, energy: dial(energy, 1), space: DIAL_REST, tone: DIAL_REST }
}

/** How full the piece stands: what the rides leave in of what Energy lets through. */
export function fullnessOf(now: Pick<PerformNow, 'rides' | 'ladder'>): number {
  return share(now.rides) * share(now.ladder)
}

/** What that performance asks of the picture. */
export function performAsk(now: PerformNow): PerformAsk {
  const full = fullnessOf(now)
  const bare = 1 - full
  const tone = offRest(now.tone)
  const space = offRest(now.space)
  const filter: VisualFilter = {
    soft: SOFT_AT_LOWEST * tone.under,
    dim: DIM_AT_LOWEST * tone.under,
    thin: THIN_AT_HIGHEST * tone.over,
    spread: SPREAD_AT_WIDEST * space.over,
  }
  const filtered = Math.max(filter.soft, filter.dim, filter.thin, filter.spread) >= LEAST_FILTERED
  return {
    full,
    energy: Math.min(dial(now.energy, 1), full),
    level: 1 - (1 - LEVEL_AT_BAREST) * bare,
    recede: RECEDE_AT_BAREST * bare,
    calm: CALM_AT_BAREST * bare,
    trailsKept: 1 - (1 - TRAILS_KEPT_AT_DRIEST) * space.under,
    trails:
      space.over > 0
        ? { length: TRAILS_AT_WIDEST * space.over, push: PUSH_AT_WIDEST * space.over }
        : null,
    grain: 1 - (1 - GRAIN_AT_LOWEST) * tone.under + (GRAIN_AT_HIGHEST - 1) * tone.over,
    filter: filtered ? filter : null,
  }
}

/**
 * How much shows of one of the visuals that paint for the whole piece: `rank` is its place among them as they are
 * drawn, from 0, and `count` how many there are. As the piece empties they leave one after another, the last drawn
 * first; the first never leaves, and with one sound left it shows alone.
 */
export function stayShare(full: number, rank: number, count: number): number {
  if (rank <= 0 || count <= 1) return 1
  return clamp01(share(full) * (count - 1) - (rank - 1))
}

/** How many of `count` visuals that paint for the whole piece show at all at that fullness. */
export function staying(full: number, count: number): number {
  let shown = 0
  for (let rank = 0; rank < count; rank++) if (stayShare(full, rank, count) > 0) shown++
  return shown
}

/**
 * Lays what is asked over a frame: every layer that paints shows less and steps back, the piece's trails are
 * shortened and the picture's own added, the palette is calmer, the grain finer or coarser, and the filter goes
 * with the frame for the stage to draw. Which visuals have left is not decided here: `frameOf` does that, where
 * each visual is still known. A frame that is asked nothing comes back as it is.
 */
export function performedFrame(frame: VisualFrame, ask: PerformAsk): VisualFrame {
  const nothing =
    ask.level === 1 &&
    ask.recede === 0 &&
    ask.calm === 0 &&
    ask.trailsKept === 1 &&
    ask.grain === 1 &&
    !ask.trails &&
    !ask.filter
  if (nothing) return frame
  const layers: VisualLayer[] = frame.layers.map((layer) => {
    if ('paint' in layer)
      return ask.level === 1 && ask.recede === 0
        ? layer
        : { ...layer, level: layer.level * ask.level, size: clamp01(layer.size - ask.recede) }
    if (layer.bend === 'trails' && ask.trailsKept !== 1)
      return { ...layer, length: layer.length * ask.trailsKept }
    return layer
  })
  if (ask.trails) layers.push({ bend: 'trails', ...ask.trails })
  const made: VisualFrame = {
    ...frame,
    layers,
    palette:
      ask.calm > 0
        ? { ...frame.palette, calm: clamp01(frame.palette.calm + ask.calm) }
        : frame.palette,
    grain: ask.grain === 1 ? frame.grain : clamp01(frame.grain * ask.grain),
  }
  if (ask.filter) made.filter = ask.filter
  return made
}

/** One thing a performance does to the picture now, for a host to say in words. */
export interface PerformMove {
  /** What in the performance it comes from: the sounds that are in, Tone, or Space. */
  from: 'sounds' | 'tone' | 'space'
  /** What it does to the picture. */
  does: 'thins' | 'softens' | 'sharpens' | 'rings' | 'dries'
  /** How far, from just above 0 to 1 at the end of the dial or with one sound left. */
  amount: number
}

/**
 * What that performance does to the picture, one entry for each thing that is moved and none for a piece as
 * composed. It reads where the picture is heading: hand it the performance as it stands, not as it has come to.
 */
export function performMoves(now: PerformNow): PerformMove[] {
  const moves: PerformMove[] = []
  const full = fullnessOf(now)
  if (full < 1) moves.push({ from: 'sounds', does: 'thins', amount: 1 - full })
  const tone = offRest(now.tone)
  if (tone.under > 0) moves.push({ from: 'tone', does: 'softens', amount: tone.under })
  if (tone.over > 0) moves.push({ from: 'tone', does: 'sharpens', amount: tone.over })
  const space = offRest(now.space)
  if (space.over > 0) moves.push({ from: 'space', does: 'rings', amount: space.over })
  if (space.under > 0) moves.push({ from: 'space', does: 'dries', amount: space.under })
  return moves
}

const EASED = ['rides', 'ladder', 'energy', 'space', 'tone'] as const

/**
 * Takes the picture to where the performance stands, each value by itself. A value keeps the pace of the move
 * that last changed where it is heading, so a dial turned while sounds are still fading leaves their fade alone.
 * One of these lives as long as the desk does.
 */
export class PerformFollower {
  private now: PerformNow | null = null
  private heading: PerformNow | null = null
  private readonly pace: Record<(typeof EASED)[number], number> = {
    rides: QUICKEST_SEC,
    ladder: QUICKEST_SEC,
    energy: QUICKEST_SEC,
    space: QUICKEST_SEC,
    tone: QUICKEST_SEC,
  }

  /** Forgets where the picture stood: the next step starts where the performance stands then. */
  rest(): void {
    this.now = null
    this.heading = null
  }

  /** The performance as the picture is drawn with it, `wentSec` seconds after the step before. */
  step(reading: PerformReading, dials: PerformDials, wentSec: number): PerformNow {
    const want: PerformNow = {
      rides: share(reading.rides),
      ladder: share(reading.ladder),
      energy: dial(dials.energy, 1),
      space: dial(dials.space, DIAL_REST),
      tone: dial(dials.tone, DIAL_REST),
    }
    // The first frame stands where the performance does: nothing glides in that was moved while no picture was drawn.
    if (this.now === null || this.heading === null) {
      this.now = { ...want }
      this.heading = want
      return this.now
    }
    const over = Number.isFinite(reading.overSec) ? Math.max(0, reading.overSec) : 0
    const went = Math.max(0, wentSec)
    for (const key of EASED) {
      if (want[key] !== this.heading[key])
        this.pace[key] = Math.max(QUICKEST_SEC, over / TIME_CONSTANTS)
      const left = want[key] - this.now[key]
      const next = this.now[key] + left * (1 - Math.exp(-went / this.pace[key]))
      this.now[key] = Math.abs(want[key] - next) < ARRIVED ? want[key] : next
    }
    this.heading = want
    return this.now
  }
}
