// The way the crowd of Walking Voices came, as its display keeps and lays it
// out: what was seen of each person over the last seconds, the picture's
// heights and its scale of time, and the two chords it shows at rest.

import { clamp, type Box, type Point } from '../display-kit'
import { type DisplayView } from '../plate-display'
import { Crowd } from './walking-voices-crowd'
import { CROWD_SINGERS, type CrowdSettings, type Walker } from './walking-voices-people'

/** The way is drawn over this long. */
export const WALK_SECONDS = 8
/** What stands there while nothing is played: a chord, and one it walks to. */
const REST_FROM = [45, 60, 64, 76]
const REST_TO = [50, 57, 69, 72]
const REST_CHANGE_SEC = 2.6
const REST_BEGIN_SEC = 7
/** Below this nobody is seen. */
export const FAINT = 0.04
/** The picture is at least this many semitones high, with this much over and under the crowd. */
const LEAST_SPAN = 15
const MARGIN = 1.8

/** One look at somebody: when, where they are heard, how loud; `cut` where the line begins anew. */
export interface Look {
  at: number
  pitch: number
  shown: number
  cut: boolean
}

export interface Seen {
  crowd: Crowd
  looks: Look[][]
  /** The height of the picture, as key numbers. */
  low: number
  high: number
}

export interface WalkLayout {
  head: { left: number; right: number; baseline: number }
  way: Box
  room: Box
  ruler: number
  foot: Box
}

export function walkLayout(size: Pick<DisplayView, 'width' | 'height'>): WalkLayout {
  const box: Box = { x: 5, y: 4, w: size.width - 10, h: size.height - 8 }
  const foot: Box = { x: box.x - 1, y: box.y + box.h - 4, w: box.w + 2, h: 4 }
  const ruler = foot.y - 7
  const top = box.y + 11
  const h = ruler - 6 - top
  const room = Math.round(clamp(box.w * 0.31, 30, 64))
  return {
    head: { left: box.x, right: box.x + box.w, baseline: box.y + 8 },
    way: { x: box.x, y: top, w: box.w - room - 4, h },
    room: { x: box.x + box.w - room, y: top, w: room, h },
    ruler,
    foot,
  }
}

/** Where a moment so many seconds ago stands across the way. */
export const walkX = (ago: number, way: Box): number =>
  way.x + way.w * (1 - Math.sqrt(clamp(ago / WALK_SECONDS, 0, 1)))
/** The seconds ago that stand at `x`. */
export const walkAgo = (x: number, way: Box): number =>
  WALK_SECONDS * clamp(1 - (x - way.x) / way.w, 0, 1) ** 2

/** Where a key number stands in the picture. */
export const walkY = (pitch: number, box: Box, low: number, high: number): number =>
  box.y + box.h * (1 - (pitch - low) / (high - low))

export const inSight = (s: Walker): number => (s.hush > 0 ? 0 : s.level)

/** How loud somebody is against one of an even crowd, held in so that a leader alone stays a dot. */
export function shownOf(crowd: Crowd, s: Walker): number {
  const { lead, rest } = crowd.weights()
  return inSight(s) * Math.min(1.5, Math.sqrt(s.lead ? lead : rest))
}

export function look(seen: Seen, at: number): void {
  seen.crowd.walkers.forEach((s, i) => {
    const looks = seen.looks[i]
    const shown = shownOf(seen.crowd, s)
    if (shown < FAINT && (looks.at(-1)?.shown ?? 0) < FAINT) return
    looks.push({ at, pitch: seen.crowd.heard(s), shown, cut: s.cut })
    s.cut = false
    while (looks.length > 0 && looks[0].at < at - WALK_SECONDS) looks.shift()
  })
}

/** The picture's height follows the crowd, at once when `share` is 1. */
export function frameCrowd(seen: Seen, share: number, whole: boolean): void {
  const places = whole
    ? seen.looks.flat().map((each) => each.pitch)
    : seen.crowd.walkers.filter((s) => inSight(s) > FAINT).map((s) => s.place)
  for (const note of seen.crowd.notes) places.push(note.pitch)
  if (places.length === 0) return
  const least = Math.min(...places) - MARGIN
  const most = Math.max(...places) + MARGIN
  const more = Math.max(0, (LEAST_SPAN - (most - least)) / 2)
  seen.low += (least - more - seen.low) * share
  seen.high += (most + more - seen.high) * share
}

export const unseen = (set: CrowdSettings): Seen => ({
  crowd: new Crowd(set),
  looks: Array.from({ length: CROWD_SINGERS }, () => []),
  low: 44,
  high: 78,
})

const asNotes = (keys: readonly number[], from: number): { id: number; pitch: number }[] =>
  keys.map((pitch, i) => ({ id: from + i, pitch }))

/** One chord that gathers and walks to another, as long ago as the picture has room for. */
export function walkAtRest(set: CrowdSettings): Seen {
  const seen = unseen(set)
  seen.crowd.play(asNotes(REST_FROM, 0))
  let changed = false
  const steps = Math.round(REST_BEGIN_SEC * 60)
  for (let n = 0; n <= steps; n++) {
    const at = n / 60 - REST_BEGIN_SEC
    if (!changed && at >= -REST_CHANGE_SEC) {
      seen.crowd.play(asNotes(REST_TO, 4), [0, 1, 2, 3])
      changed = true
    }
    seen.crowd.step(1 / 60)
    if (n % 2 === 0) look(seen, at)
  }
  frameCrowd(seen, 1, true)
  return seen
}

/** The way somebody came, in pieces: a breath and a leap each end one. */
export function walkLines(
  looks: readonly Look[],
  now: number,
  at: WalkLayout,
  low: number,
  high: number,
): Point[][] {
  const lines: Point[][] = []
  let line: Point[] = []
  for (const each of looks) {
    if (each.cut || each.shown < FAINT) {
      lines.push(line)
      line = []
    }
    if (each.shown < FAINT) continue
    const point: Point = [walkX(now - each.at, at.way), walkY(each.pitch, at.way, low, high)]
    const last = line.at(-1)
    if (!last || Math.abs(last[0] - point[0]) > 0.6 || Math.abs(last[1] - point[1]) > 0.4)
      line.push(point)
  }
  return [...lines, line].filter((each) => each.length > 1)
}
