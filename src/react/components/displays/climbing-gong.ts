// The display of Climbing Gong: the metal as a half gong, and the light of a
// stroke going out through it.
//
// Every ring is one of the eighteen tones of a key at its pitch, the key at the
// hub and the third rung at the rim. Round the gong, from left to right, is the
// time after a stroke, on a third root of time, so that a tenth of a second and sixteen both
// show. A ring is as thick as its tone is loud then: in the ink what the knobs
// say a held stroke will do, in the accent what the device reports of the
// newest key, up to a hand that goes round with its age. Behind each rung a
// hill stands as high as the rung is alight, and as dense as Roar is.
//
// The ink is the device's own law (`climbing-gong-law.ts`). The device reports
// its four registers; how a register's tones share its level is the law's.
// Two points can be dragged: Place, where the metal is touched, along the foot
// from the hub to the rim; and the climb, outward for Climb and round for
// Climb time.

import { INK, clamp, ground, handle, rule, text, trace, type Point } from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import {
  GONG_SECONDS,
  GONG_STEPS,
  GONG_TONES,
  gongBeater,
  gongLife,
  gongMetal,
  gongRegister,
  gongTime,
  gongTurn,
  type GongLife,
} from './climbing-gong-law'
import {
  GONG_HUB,
  drawHill,
  drawRing,
  gongLayout,
  gongOut,
  gongPoint,
  gongRooms,
  type GongLayout,
} from './climbing-gong-rings'
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'

/** The device's readings, the ground's first. */
const METERS = ['rung1', 'rung2', 'rung3', 'rung4']
/** The stroke that is drawn at rest. */
export const GONG_REST = { hz: 146.8324, gain: 0.8 } as const
/** A key is followed for at least this long, so fast playing does not shake the picture. */
export const GONG_FOLLOWS_SEC = 0.5
/** The level in the foot is the mean over this long. */
const LEVEL_SEC = 1
/** A reading is smoothed over this long before it is drawn. */
const READ_SEC = 0.06

/** The key that is followed, and what was read of it in each step of the round. */
interface Followed {
  id: number
  began: number
  taken: number
  hz: number
  gain: number
  /** The readings, smoothed. */
  now: number[]
  read: Float32Array[]
  /** The last step that was written. */
  last: number
}

interface GongState extends HeardLevel {
  key: string
  life: GongLife | null
  followed: Followed | null
}

const PARAMS = [
  'metal',
  'beater',
  'hardness',
  'place',
  'ground',
  'climb',
  'threshold',
  'climbTime',
  'fallBack',
  'roar',
  'lowRing',
  'highRing',
  'roll',
  'rollSpeed',
  'rollSwell',
]

/** The newest key, and its readings written as far round as it has come. */
function followNow(frame: DisplayFrame<GongState>): Followed | null {
  const { state, now } = frame
  if (!frame.powered || !frame.signal) return (state.followed = null)
  const newest = frame.notes.reduce<DisplayNote | null>(
    (found, note) => (found && found.age < note.age ? found : note),
    null,
  )
  const was = state.followed
  const began = newest ? now - newest.age : 0
  const same = was?.id === newest?.id && was && Math.abs(was.began - began) < 0.1
  if (newest && !same && !(was && now - was.taken < GONG_FOLLOWS_SEC))
    state.followed = {
      id: newest.id,
      began,
      taken: now,
      hz: newest.frequency,
      gain: newest.gain,
      now: [0, 0, 0, 0],
      read: METERS.map(() => new Float32Array(GONG_STEPS + 1)),
      last: 0,
    }
  const key = state.followed
  if (!key) return null
  const step = Math.floor(gongTurn(now - key.began) * GONG_STEPS)
  const part = frame.dt > 0 ? 1 - Math.exp(-frame.dt / READ_SEC) : 1
  METERS.forEach((name, r) => {
    const read = frame.meter(name)
    key.now[r] += ((read > 0 ? read : 0) - key.now[r]) * part
    for (let i = key.last + 1; i <= step; i++) key.read[r][i] = key.now[r]
    if (step < GONG_STEPS) key.read[r][step + 1] = key.now[r]
    else key.read[r][step] = key.now[r]
  })
  key.last = Math.max(key.last, step)
  return key
}

function drawGong(frame: DisplayFrame<GongState>, at: GongLayout, key: Followed | null): void {
  const { state, colours } = frame
  const life = state.life
  if (!life) return
  // Each tone at the metal's own ratio, so that the gong stands still from key to key.
  const { ratio } = gongMetal((name) => frame.value(name))
  const outs = ratio.map((each) => gongOut(each, Math.max(...ratio)))
  const rooms = gongRooms(outs, at)
  const hand = key ? Math.min(key.last + 1, GONG_STEPS) : 0
  const layers = [{ levels: life.registers, from: hand, to: GONG_STEPS, colour: colours.ink }]
  if (key) layers.push({ levels: key.read, from: 0, to: key.last, colour: colours.accent })
  for (const out of outs) {
    const ring: Point[] = []
    for (let i = 0; i <= GONG_STEPS; i++) ring.push(gongPoint(at, out, i / GONG_STEPS))
    trace(frame.ctx, ring, { colour: colours.ink, width: 1, alpha: INK.rule })
  }
  for (const { levels, from, to, colour } of layers) {
    for (let r = 1; r < METERS.length; r++) {
      const first = outs.findIndex((_, k) => gongRegister(k) === r)
      const high = outs[first + 4] ?? 1
      drawHill(
        frame,
        at,
        outs[first],
        high,
        from,
        to,
        (i) => levels[r][i],
        colour,
        frame.value('roar'),
      )
    }
    for (let k = 0; k < GONG_TONES; k++) {
      const level = (i: number): number => levels[gongRegister(k)][i] * life.shapes[k][i]
      drawRing(frame, at, outs[k], rooms[k], from, to, level, colour)
    }
  }
}

function gongHandles(view: DisplayView): [DisplayHandle, DisplayHandle] {
  const at = gongLayout(view)
  const place = view.value('place')
  const climb = view.value('climb')
  const seconds = view.value('climbTime')
  const bound = (name: string, value: number): number => {
    const spec = view.spec(name)
    return spec ? clamp(value, spec.min, spec.max) : value
  }
  const back = (name: string): number => view.spec(name)?.default ?? view.value(name)
  const [placeX, placeY] = gongPoint(at, place, 0)
  const [climbX, climbY] = gongPoint(at, climb, gongTurn(seconds))
  const outOf = (far: number): number => clamp((far - GONG_HUB) / (1 - GONG_HUB), 0, 1)
  return [
    {
      key: 'place',
      name: 'Place',
      x: placeX,
      y: placeY,
      drag: (x) => ({ place: outOf((at.cx - x) / at.rx) }),
      wheel: (steps) => ({ place: bound('place', place + 0.02 * steps) }),
      reset: () => ({ place: back('place') }),
    },
    {
      key: 'climb',
      name: 'Climb and Climb time',
      x: climbX,
      y: climbY,
      drag: (x, y) => {
        const across = (at.cx - x) / at.rx
        const up = Math.max((at.cy - y) / at.ry, 0)
        return {
          climb: outOf(Math.hypot(across, up)),
          climbTime: bound('climbTime', gongTime(Math.atan2(up, across) / Math.PI)),
        }
      },
      wheel: (steps) => ({ climb: bound('climb', climb + 0.02 * steps) }),
      reset: () => ({ climb: back('climb'), climbTime: back('climbTime') }),
    },
  ]
}

const climbingGong = plateDisplay<GongState>({
  place: 'window',
  columns: 2,
  params: PARAMS,
  live: { meters: true, signal: true, notes: true, settle: 4 },
  info: 'Every ring is a tone, the key at the hub; round the gong is sixteen seconds. Dark is what a held stroke will do, bright what the newest key does, up to the hand. Drag the point at the foot for Place, the other outward for Climb and round for Climb time.',
  init: () => ({ key: '', life: null, followed: null, heard: [], shown: 0 }),
  draw(frame) {
    ground(frame)
    const { ctx, colours, state } = frame
    const at = gongLayout(frame)
    const key = followNow(frame)
    const value = (name: string): number => frame.value(name)
    const { hz, gain } = key ?? GONG_REST
    const made = `${PARAMS.map(value).join(' ')} ${hz} ${gain}`
    if (made !== state.key) {
      state.key = made
      state.life = gongLife(value, hz, gain)
    }
    const right = at.cx + at.rx
    text(frame, gongMetal(value).name, 4, at.head)
    text(frame, gongBeater(value).name, frame.width - 4, at.head, { align: 'right' })
    drawGong(frame, at, key)
    rule(ctx, at.cx - at.rx, at.cy, right, at.cy, { colour: colours.ink, alpha: INK.rule })
    for (const seconds of [0.1, 1, 4]) {
      const [x, y] = gongPoint(at, 1, gongTurn(seconds))
      const [x2, y2] = gongPoint(at, 1.05, gongTurn(seconds))
      trace(
        ctx,
        [
          [x, y],
          [x2, y2],
        ],
        { colour: colours.ink, width: 1, alpha: INK.text },
      )
    }
    const [touch, climbs] = gongHandles(frame)
    // The time the climb takes, as a ray to the rim.
    const rim = gongPoint(at, 1, gongTurn(frame.value('climbTime')))
    trace(ctx, [[climbs.x, climbs.y], rim], {
      colour: colours.ink,
      width: 1,
      alpha: INK.text,
      dash: [2, 2],
    })
    if (key) {
      const turn = gongTurn(frame.now - key.began)
      trace(ctx, [gongPoint(at, 0, turn), gongPoint(at, 1, turn)], {
        colour: colours.accent,
        width: 1,
      })
    }
    text(frame, '0', at.cx - at.rx, at.words)
    text(frame, pitchName(hz), at.cx, at.words, { align: 'center' })
    text(frame, `${GONG_SECONDS} s`, right, at.words, { align: 'right' })
    handle(frame, touch.x, touch.y, { hot: frame.hot === 'place', radius: 3 })
    handle(frame, climbs.x, climbs.y, { hot: frame.hot === 'climb', radius: 3 })
    levelFoot(frame, at.foot, meanOutShare(state, frame, LEVEL_SEC))
  },
  handles: (view) => gongHandles(view),
})

export const CLIMBING_GONG_FACES: Readonly<Record<string, PlateFace>> = {
  'climbing-gong': {
    display: climbingGong,
    face: ['climb', 'climbTime', 'threshold', 'roar'],
    labels: { climbTime: 'Time' },
    sections: [
      ['metal', 'beater', 'hardness', 'place', 'ground'],
      ['climb', 'threshold', 'climbTime', 'fallBack', 'roar'],
      ['shimmer', 'bend', 'lowRing', 'highRing'],
      ['roll', 'rollSpeed', 'rollSwell'],
      ['sympathy', 'choke', 'width', 'volume'],
    ],
  },
}
