// Sift's display: the three parts the device sifts a sound into, each in a
// lane of its own over the last second or so, tones on top, attacks in the
// middle, air below. A lane's outline is the part as the split finds it (the
// device's own reading, taken after the part's blur and before its level) and
// its fill is what the part's level and Mix let be heard of it. What sounds
// now stands at an upright line; the tones and the air come in there. The
// attacks come in to the right of it by as much as Late holds them back, and
// sound when they cross it. Each lane has a point where its part comes in:
// up and down is the part's level, and the attacks' point also moves right
// to make them late.

import {
  History,
  INK,
  clamp,
  clipped,
  fillTo,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/** The three parts, by the names of their levels and of the device's readings. */
export const SIFT_PARTS = ['tones', 'attacks', 'air'] as const
type SiftPart = (typeof SIFT_PARTS)[number]

/** How much of the past the lanes show, in seconds, and the slots it is kept in: one for each reading (30 a second). */
export const SIFT_PAST_SEC = 1.2
const SIFT_SLOTS = 36
/** The scale a lane's readings are drawn on: a full-scale sine reads 0.707, 3 dB under the top. */
export const SIFT_TOP_DB = 0
export const SIFT_FOOT_DB = -60
/** The room a lane keeps above and below the travel of its point, so that two lanes' points never touch. */
const SIFT_REST = 4
const SIFT_LANE_GAP = 2
/** How far a hand must move sideways before the attacks' point lets go of the Late it had: a level is set without a flam by accident. */
export const SIFT_STICK_PX = 4

/**
 * `sift.h`, `level_gain()`: the gain a level in dB gives its part. Decibels,
 * taken down to nothing at the bottom of the level's range and exactly 1 at 0 dB.
 */
export function siftLevelGain(db: number, bottomDb: number): number {
  const floor = Math.pow(10, bottomDb / 20)
  return Math.max(0, (Math.pow(10, db / 20) - floor) / (1 - floor))
}

/** Where a reading stands in a lane, 0 at its foot and 1 at its top. */
export function siftHeight(reading: number): number {
  return clamp((gainToDb(reading) - SIFT_FOOT_DB) / (SIFT_TOP_DB - SIFT_FOOT_DB), 0, 1)
}

export interface SiftLayout {
  box: Box
  /** Tones, attacks, air: each the whole width. */
  lanes: readonly [Box, Box, Box]
  /** Pixels a second. */
  pace: number
  /** Where what sounds now stands. */
  nowX: number
  /** Where the attacks come in: right of now by Late. */
  entryX: number
  /** The longest Late, in ms. */
  lateMax: number
}

export function siftLayout(view: DisplayView): SiftLayout {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const lateMax = view.spec('late')?.max ?? 300
  const pace = box.w / (SIFT_PAST_SEC + lateMax / 1000)
  const nowX = box.x + SIFT_PAST_SEC * pace
  const tall = (box.h - 2 * SIFT_LANE_GAP) / 3
  const lane = (n: number): Box => ({
    x: box.x,
    y: box.y + n * (tall + SIFT_LANE_GAP),
    w: box.w,
    h: tall,
  })
  return {
    box,
    lanes: [lane(0), lane(1), lane(2)],
    pace,
    nowX,
    entryX: nowX + (clamp(view.value('late'), 0, lateMax) / 1000) * pace,
    lateMax,
  }
}

/** Where a level stands in its lane by how far along its range it is, 0..1: the travel of the lane's point. */
export function siftLevelY(lane: Box, along: number): number {
  return lane.y + lane.h - SIFT_REST - clamp(along, 0, 1) * (lane.h - 2 * SIFT_REST)
}

/** How far along a level's range the gain `gain` lies, 0..1: where on the point's travel what is let through stands. */
export function siftAlong(gain: number, view: DisplayView, part: SiftPart): number {
  const spec = view.spec(part)
  const min = spec?.min ?? -30
  const max = spec?.max ?? 6
  return clamp((gainToDb(gain) - min) / (max - min), 0, 1)
}

function siftHandles(view: DisplayView): DisplayHandle[] {
  const layout = siftLayout(view)
  const level = (part: SiftPart, lane: Box, y: number): number => {
    const spec = view.spec(part)
    const min = spec?.min ?? -30
    const max = spec?.max ?? 6
    const along = (lane.y + lane.h - SIFT_REST - y) / (lane.h - 2 * SIFT_REST)
    return min + clamp(along, 0, 1) * (max - min)
  }
  const lateAt = (x: number): number =>
    clamp(((x - layout.nowX) / layout.pace) * 1000, 0, layout.lateMax)
  const fader = (part: 'tones' | 'air', name: string, lane: Box): DisplayHandle => ({
    key: part,
    name,
    x: layout.nowX,
    y: siftLevelY(lane, view.at(part)),
    drag: (_x, y) => ({ [part]: level(part, lane, y) }),
    reset: () => ({ [part]: view.spec(part)?.default ?? 0 }),
  })
  const late = view.value('late')
  return [
    fader('tones', 'Tones', layout.lanes[0]),
    {
      key: 'attacks',
      name: 'Attacks and Late',
      x: layout.entryX,
      y: siftLevelY(layout.lanes[1], view.at('attacks')),
      drag: (x: number, y: number, hold?: DisplayHold) => {
        const attacks = level('attacks', layout.lanes[1], y)
        if (!hold) return { attacks, late: lateAt(x) }
        // The press is where the point stands. Until the hand has moved
        // sideways by more than a slip, Late stays as it was; from then on it
        // is the Late whose place is under the hand.
        hold.pressX ??= x
        hold.pressLate ??= late
        if (!hold.loose && Math.abs(x - hold.pressX) < SIFT_STICK_PX)
          return { attacks, late: hold.pressLate }
        hold.loose = 1
        return { attacks, late: lateAt(x) }
      },
      reset: () => ({
        attacks: view.spec('attacks')?.default ?? -12,
        late: view.spec('late')?.default ?? 0,
      }),
    },
    fader('air', 'Air', layout.lanes[2]),
  ]
}

interface SiftState {
  /** Each part as the split finds it, over the past. */
  found: readonly [History, History, History]
  /** And as its level and Mix let it be heard. */
  heard: readonly [History, History, History]
}

const history = (): History => new History(SIFT_PAST_SEC, SIFT_SLOTS, 0, 'max')

const sift = plateDisplay<SiftState>({
  place: 'window',
  columns: 2,
  params: ['tones', 'attacks', 'air', 'late', 'mix'],
  live: { meters: true },
  info: 'Tones, attacks and air over the last second, each in its lane: the outline is the part as it is found, the fill what its level lets be heard. Drag a point up or down for a level. The attacks point also moves right to make them late: they sound when they cross the upright line.',
  init: () => ({
    found: [history(), history(), history()],
    heard: [history(), history(), history()],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = siftLayout(frame)
    const { box, lanes, nowX, entryX, pace } = layout
    const mix = clamp(frame.value('mix'), 0, 1)
    const gains = SIFT_PARTS.map((part) =>
      siftLevelGain(frame.value(part), frame.spec(part)?.min ?? -30),
    )
    if (!frame.powered) {
      for (const kept of [...state.found, ...state.heard]) kept.clear()
    } else if (frame.dt > 0 && frame.hasMeter('tones')) {
      SIFT_PARTS.forEach((part, n) => {
        const reading = Math.max(0, frame.meter(part))
        state.found[n].push(frame.now, Number.isFinite(reading) ? reading : 0)
        state.heard[n].push(frame.now, Number.isFinite(reading) ? reading * gains[n] * mix : 0)
      })
    }

    const past = SIFT_PAST_SEC * pace
    SIFT_PARTS.forEach((part, n) => {
      const lane = lanes[n]
      const foot = lane.y + lane.h
      // The attacks come in right of now by Late; the others at now.
      const entry = part === 'attacks' ? entryX : nowX
      const region: Box = { x: entry - past, y: lane.y, w: past, h: lane.h }
      const y = (reading: number): number => foot - siftHeight(reading) * lane.h
      const found: Point[] = state.found[n].points(region, y)
      const heard: Point[] = state.heard[n].points(region, y)
      rule(ctx, lane.x, foot, lane.x + lane.w, foot, { colour: colours.ink, alpha: INK.grid })
      if (part === 'attacks') {
        // Heard left of now, in the second colour; still on their way right of it.
        clipped(ctx, { x: lane.x, y: lane.y, w: nowX - lane.x, h: lane.h }, () => {
          fillTo(ctx, heard, foot, colours.accent, 0.9)
        })
        clipped(ctx, { x: nowX, y: lane.y, w: lane.x + lane.w - nowX, h: lane.h }, () => {
          fillTo(ctx, heard, foot, colours.accent, 0.35)
        })
      } else {
        clipped(ctx, lane, () => {
          fillTo(ctx, heard, foot, colours.ink, part === 'tones' ? 0.55 : INK.fill * 1.5)
        })
      }
      clipped(ctx, lane, () => {
        trace(ctx, found, { colour: colours.ink, width: 1, alpha: INK.back })
      })
      // What the level and Mix let through, on the travel of the lane's point.
      const through = siftLevelY(lane, siftAlong(gains[n] * mix, frame, part))
      const rest = siftLevelY(lane, 0)
      if (rest - through > 0.25)
        rule(ctx, entry, rest, entry, through, { colour: colours.ink, width: 2, alpha: INK.text })
      label(frame, part, lane.x + 2, lane.y + 8)
    })
    rule(ctx, nowX, box.y, nowX, box.y + box.h, { colour: colours.ink, alpha: INK.rule })

    for (const point of siftHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: siftHandles,
})

export const SIFT_FACES: Readonly<Record<string, PlateFace>> = {
  sift: { display: sift, face: ['tones', 'attacks', 'air', 'hold'] },
}
