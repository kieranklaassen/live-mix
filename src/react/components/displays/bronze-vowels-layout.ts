// Where the parts of the display of Bronze Vowels stand, and its two points:
// the valley of the mouth (Tract and Clarity) and the end of the word
// (Speaking time).

import { clamp, hzOfX, xOfHz, type Box } from '../display-kit'
import { type DisplayHandle, type DisplayView } from '../plate-display'
import { bronzeSettings } from './bronze-vowels-metal'
import {
  BRONZE_DB,
  bronzeDeep,
  bronzeDrawn,
  bronzeMouth,
  type BronzeMouth,
} from './bronze-vowels-mouth'

export const BRONZE_LOW_HZ = 90
export const BRONZE_HIGH_HZ = 5600
/** The foot of the envelope's scale, dB; its top is 0. */
export const BRONZE_FLOOR_DB = -54
/** The longest Speaking time, which is the whole of the lane; its end stands on a fourth root of time. */
const LANE_SEC = 20

export interface BronzeLayout {
  head: number
  bell: Box
  curve: Box
  lane: Box
  foot: Box
}

export function bronzeLayout(size: Pick<DisplayView, 'width' | 'height'>): BronzeLayout {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const foot: Box = { x: box.x, y: box.y + box.h - 4, w: box.w, h: 4 }
  const lane: Box = { x: box.x, y: foot.y - 31, w: box.w, h: 27 }
  const top = box.y + 12
  const h = lane.y - 3 - top
  const wide = Math.round(clamp(box.w * 0.34, 40, 56))
  return {
    head: box.y + 8,
    bell: { x: box.x, y: top, w: wide, h },
    curve: { x: box.x + wide + 4, y: top, w: box.w - wide - 4, h },
    lane,
    foot,
  }
}

/** Where a gain stands on the envelope's scale. */
export const bronzeGainY = (db: number, box: Box): number =>
  box.y + clamp(db / BRONZE_FLOOR_DB, 0, 1) * box.h
/** Where a word of so many seconds ends in the lane. */
export const bronzeLaneX = (seconds: number, lane: Box): number =>
  lane.x + 3 + Math.pow(clamp(seconds / LANE_SEC, 0, 1), 0.25) * (lane.w - 6)
/** Where a share of a word stands in the lane: it is said evenly from the left edge to its end. */
export const bronzeWordX = (share: number, seconds: number, lane: Box): number =>
  lane.x + 3 + share * (bronzeLaneX(seconds, lane) - lane.x - 3)
/** Where a formant, as log2 of Hz, stands in the lane. */
export const bronzeLaneY = (formant: number, lane: Box): number =>
  lane.y + lane.h - clamp((formant - Math.log2(170)) / Math.log2(3000 / 170), 0, 1) * lane.h

// --- The points -------------------------------------------------------------------

/** The valley the mouth cuts between the second and the third formant of the word's first vowel. */
const valleyOf = (mouth: BronzeMouth, tract: number): number =>
  Math.pow(2, (mouth.f[1] + mouth.f[2]) / 2 + tract / 12)

export function bronzeHandles(view: DisplayView): readonly DisplayHandle[] {
  const set = bronzeSettings((name) => view.value(name))
  const { curve, lane } = bronzeLayout(view)
  const mouth = bronzeMouth(set.word, 0)
  const hz = valleyOf(mouth, set.tract)
  const deep = bronzeDeep(set.clarity) * bronzeDrawn(mouth, set.tract, hz) * BRONZE_DB
  const foot = curve.y + curve.h
  // Where the valley lies under the picture, its point stands on the edge and the hand moves it from there.
  const under = Math.max(deep / BRONZE_FLOOR_DB - 1, 0) * curve.h
  const spec = (name: string, fallback: number): number => view.spec(name)?.default ?? fallback
  const end = bronzeLaneX(set.speak, lane)
  return [
    {
      key: 'mouth',
      name: 'Tract and Clarity',
      x: xOfHz(hz, curve, BRONZE_LOW_HZ, BRONZE_HIGH_HZ),
      y: Math.min(bronzeGainY(deep, curve), foot),
      drag: (x, y, hold) => {
        const below = hold ? (hold.under ??= under) : under
        const rest = Math.log2(valleyOf(mouth, 0))
        const at = hzOfX(x, curve, BRONZE_LOW_HZ, BRONZE_HIGH_HZ)
        const tract = clamp(12 * (Math.log2(at) - rest), -9, 9)
        const drawn = bronzeDrawn(mouth, tract, valleyOf(mouth, tract)) * BRONZE_DB
        const db = (clamp(y - curve.y, 0, curve.h + below) + below) * (BRONZE_FLOOR_DB / curve.h)
        // `deep` the other way round.
        const clarity = Math.sqrt(1 + 2 * Math.max(db / drawn, 0)) - 1
        return { tract, clarity: clamp(clarity, 0, 1) }
      },
      wheel: (steps) => ({ clarity: clamp(set.clarity + 0.02 * steps, 0, 1) }),
      reset: () => ({ tract: spec('tract', 0), clarity: spec('clarity', 0.8) }),
    },
    {
      key: 'speak',
      name: 'Speaking time',
      x: end,
      y: lane.y + lane.h / 2,
      drag: (x) => {
        const share = clamp((x - lane.x - 3) / (lane.w - 6), 0, 1)
        return { speak: clamp(LANE_SEC * share ** 4, 0.2, LANE_SEC) }
      },
      wheel: (steps) => ({ speak: clamp(set.speak * Math.pow(1.06, steps), 0.2, LANE_SEC) }),
      reset: () => ({ speak: spec('speak', 3) }),
    },
  ]
}
