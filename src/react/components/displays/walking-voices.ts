// The display of Walking Voices: everybody in the crowd, and where they came from.
//
// At the right the room as it is now: one dot to a person, at the height of the
// pitch they sing and across the room where they stand, the ones at the back
// smaller. At the left the way each of them came, over the last eight seconds
// on a root of time, so the latest walk has the most room. A chord change is a
// braid: the lines part at the old notes and close on the new ones, as steep,
// late or ornate as Path and Lag have it. Whoever leads a note is in the
// accent, whoever has wandered off is a ring, and the ones who breathe leave a
// gap. While nothing is played it shows one chord gather and walk to another.
//
// Under the way is Lag on the same scale of time, under the room how far
// Room spread stands the crowd apart: each has a point to drag.
//
// The walks are the device's own arithmetic on the notes that were sent
// (`walking-voices-crowd.ts`); the foot is the sound that comes out.

import {
  INK,
  clamp,
  clipped,
  crisp,
  dot,
  ground,
  handle,
  rule,
  text,
  trace,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, meanOutShare, type HeardLevel } from './instrument-parts'
import {
  CROWD_BODIES,
  CROWD_PARAMS,
  CROWD_PATHS,
  crowdSettings,
  type CrowdSettings,
} from './walking-voices-people'
import {
  FAINT,
  WALK_SECONDS,
  frameCrowd,
  look,
  shownOf,
  unseen,
  walkAgo,
  walkAtRest,
  walkLayout,
  walkLines,
  walkX,
  walkY,
  type Seen,
  type WalkLayout,
} from './walking-voices-way'

/** The crowd is walked in steps of this. */
const STEP_SEC = 1 / 120

interface WalkState extends HeardLevel {
  live: Seen | null
  held: Map<number, number>
  rest: { of: string; seen: Seen } | null
}

/** The crowd as it is on this frame: walked on by the notes that were sent; at rest the two chords. */
function seenNow(
  frame: DisplayFrame<WalkState>,
  set: CrowdSettings,
): { seen: Seen; now: number; live: boolean } {
  const { state, notes, now } = frame
  const held = frame.powered ? notes.filter((note) => note.released === null) : []
  if (held.length > 0 && !state.live) state.live = unseen(set)
  if (!frame.powered) state.live = null
  const { live } = state
  if (!live) {
    state.held.clear()
    const of = JSON.stringify(set)
    if (state.rest?.of !== of) state.rest = { of, seen: walkAtRest(set) }
    return { seen: state.rest.seen, now: 0, live: false }
  }
  const { crowd } = live
  const dealt = crowd.set.people !== set.people || crowd.set.lowShare !== set.lowShare
  crowd.set = set
  const off = [...state.held.keys()].filter((id) => !held.some((note) => note.id === id))
  const on = held.filter((note) => {
    const since = state.held.get(note.id)
    return since === undefined || Math.abs(since - (now - note.age)) > 0.1
  })
  const first = !crowd.sounding
  for (const id of off) state.held.delete(id)
  for (const note of on) state.held.set(note.id, now - note.age)
  const pitch = (hz: number): number => 69 + 12 * Math.log2(clamp(hz, 12, 9000) / 440)
  if (on.length + off.length > 0)
    crowd.play(
      on.map((note) => ({ id: note.id, pitch: pitch(note.frequency) })),
      off,
    )
  else if (dealt) crowd.gather()
  const steps = Math.ceil(clamp(frame.dt, 0, 0.25) / STEP_SEC)
  for (let n = 0; n < steps; n++) crowd.step(clamp(frame.dt, 0, 0.25) / steps)
  look(live, now)
  for (const looks of live.looks)
    while (looks.length > 0 && looks[0].at < now - WALK_SECONDS) looks.shift()
  frameCrowd(live, first ? 1 : 1 - Math.exp(-5 * frame.dt), false)
  // Everybody silent and the last way gone: the two chords again.
  if (!crowd.sounding && live.looks.every((looks) => looks.length === 0)) state.live = null
  return { seen: live, now, live: true }
}

function drawCrowd(
  frame: DisplayFrame<WalkState>,
  at: WalkLayout,
  seen: Seen,
  now: number,
  live: boolean,
): void {
  const { ctx, colours } = frame
  const { crowd, low, high } = seen
  const { way, room } = at
  const all: Box = { x: way.x - 2, y: way.y - 1, w: room.x + room.w - way.x + 4, h: way.h + 2 }
  for (const ago of [1, 4])
    rule(ctx, walkX(ago, way), way.y, walkX(ago, way), way.y + way.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })
  const strength = live ? 1 : 0.8
  clipped(ctx, all, () => {
    for (const note of crowd.notes) {
      const y = walkY(note.pitch, way, low, high)
      rule(ctx, room.x, y, room.x + room.w, y, { colour: colours.ink, alpha: INK.rule })
    }
    const order = crowd.walkers.map((s, i) => ({ s, i })).sort((a, b) => +a.s.lead - +b.s.lead)
    for (const { s, i } of order) {
      const shown = seen.looks[i].at(-1)?.shown ?? 0
      const style = s.lead
        ? { colour: colours.accent, width: 1.3, alpha: strength }
        : { colour: colours.ink, width: 0.9, alpha: strength * clamp(0.2 + 0.42 * shown, 0, 1) }
      for (const line of walkLines(seen.looks[i], now, at, low, high)) trace(ctx, line, style)
    }
    for (const { s } of order) {
      const shown = shownOf(crowd, s)
      if (shown < FAINT) continue
      const spot = crowd.spot(s)
      const x = room.x + room.w / 2 + (room.w / 2 - 2) * spot.x
      const y = walkY(crowd.heard(s), way, low, high)
      const size = (0.7 + 1.3 * shown) * (1 - 0.35 * spot.back)
      if (s.away) {
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.stroke()
      } else if (s.lead) dot(ctx, x, y, size + 0.5, colours.accent, { ring: colours.ink })
      else dot(ctx, x, y, size, colours.ink, { alpha: 1 - 0.4 * spot.back })
    }
  })
  const between = room.x - 2
  rule(ctx, between, way.y, between, way.y + way.h, { colour: colours.ink, alpha: INK.rule })
}

/** Lag on the scale of time it is drawn over, Room spread across the room. */
export function walkHandles(view: DisplayView): readonly DisplayHandle[] {
  const at = walkLayout(view)
  const { room } = at
  const middle = room.x + room.w / 2
  const half = room.w / 2 - 2
  const lag = view.spec('lag')
  const spread = view.spec('spread')
  return [
    {
      key: 'lag',
      name: 'Lag',
      x: walkX(view.value('lag'), at.way),
      y: at.ruler,
      drag: (x) => ({ lag: clamp(walkAgo(x, at.way), lag?.min ?? 0, lag?.max ?? WALK_SECONDS) }),
      reset: () => ({ lag: lag?.default ?? 0 }),
    },
    {
      key: 'spread',
      name: 'Room spread',
      x: middle + half * view.value('spread'),
      y: at.ruler,
      drag: (x) => ({ spread: clamp((x - middle) / half, 0, 1) }),
      reset: () => ({ spread: spread?.default ?? 0 }),
    },
  ]
}

function drawRuler(frame: DisplayFrame<WalkState>, at: WalkLayout): void {
  const { ctx, colours } = frame
  const { room, way, ruler } = at
  const [lag, spread] = walkHandles(frame)
  const middle = room.x + room.w / 2
  const end = way.x + way.w
  const line = { colour: colours.ink, alpha: INK.text }
  rule(ctx, way.x, ruler, end, ruler, { colour: colours.ink, alpha: INK.grid })
  rule(ctx, room.x, ruler, room.x + room.w, ruler, { colour: colours.ink, alpha: INK.grid })
  rule(ctx, lag.x, ruler, end, ruler, line)
  rule(ctx, end, ruler - 2, end, ruler + 2, line)
  rule(ctx, 2 * middle - spread.x, ruler, spread.x, ruler, line)
  rule(ctx, 2 * middle - spread.x, ruler - 2, 2 * middle - spread.x, ruler + 2, line)
  handle(frame, lag.x, crisp(ruler), { hot: frame.hot === 'lag', radius: 2.8 })
  handle(frame, spread.x, crisp(ruler), { hot: frame.hot === 'spread', radius: 2.8 })
}

function draw(frame: DisplayFrame<WalkState>): void {
  const set = crowdSettings((name) => frame.value(name))
  set.path = clamp(Math.round(set.path), 0, CROWD_PATHS.length - 1)
  set.body = clamp(Math.round(set.body), 0, CROWD_BODIES.length - 1)
  ground(frame)
  const at = walkLayout(frame)
  const { seen, now, live } = seenNow(frame, set)
  text(frame, CROWD_PATHS[set.path], at.head.left, at.head.baseline)
  text(frame, CROWD_BODIES[set.body], at.head.right, at.head.baseline, { align: 'right' })
  drawCrowd(frame, at, seen, now, live)
  drawRuler(frame, at)
  levelFoot(frame, at.foot, meanOutShare(frame.state, frame, 1))
}

export const WALKING_VOICES_FACES: Record<string, PlateFace> = {
  'walking-voices': {
    display: plateDisplay<WalkState>({
      place: 'window',
      columns: 2,
      // A still picture has no key let go in it: Release is seen while the crowd dies away.
      params: CROWD_PARAMS.filter((name) => name !== 'release'),
      live: { signal: true, notes: true, fps: 30, settle: WALK_SECONDS },
      info: 'Everybody in the crowd: at the right where each one stands and what pitch they sing, at the left the way they came over the last eight seconds. Leaders are in the second colour, wanderers are rings. Drag the points for Lag and Room spread.',
      init: () => ({ heard: [], shown: 0, live: null, held: new Map(), rest: null }),
      draw,
      handles: walkHandles,
    }),
    face: ['path', 'body', 'people', 'lag'],
    labels: {
      stubborn: 'Stubborn',
      agreement: 'Agree',
      vowelSpread: 'Vowels',
      spread: 'Room',
      lowShare: 'Low',
      breath: 'Breath',
    },
    sections: [
      ['path', 'body', 'people', 'lag', 'reach'],
      ['stubborn', 'agreement', 'wander', 'leader', 'lowShare', 'spread'],
      ['vowel', 'vowelSpread', 'effort', 'strain', 'air', 'vibrato'],
      ['breath', 'fade', 'attack', 'release', 'volume'],
    ],
  },
}
