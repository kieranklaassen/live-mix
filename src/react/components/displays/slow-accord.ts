// The display of Slow Accord: a staff that a piece of metal learns to keep.
//
// Every overtone of one key has a line of its own, in the order of the metal,
// the note among them. A line stands off its place by as much as its overtone
// is off the tone it agrees with, so at the left, when the key is struck, the
// lines are as crooked as the metal is, and one after another they bend onto
// their places and run on straight. The bars at the left are how strongly each
// is struck, at the right how strongly it rests. Under the lines are the two
// parts of a key over the same time: the metal dying away (the line), and the
// accord that comes up as overtones arrive (the fill). Time is a logarithm
// from the strike, so that a pluck and a slow swell both show. The three dots
// in the head are the three places of all the keys together: no more than
// three overtones are ever on their way.
//
// What is drawn is worked out from the knobs and the notes that were sent
// (`slow-accord-ways.ts`, the device's own arithmetic; where it
// stands is in `slow-accord-lines.ts`); the dots and how far the bars are lit
// are the device's readings.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  fillTo,
  gainToDb,
  ground,
  handle,
  rule,
  text,
  trace,
  type Point,
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
  ACCORD_SECONDS,
  accordLayout,
  accordLines,
  accordOff,
  accordSeconds,
  accordWay,
  accordX,
  type AccordLayout,
} from './slow-accord-lines'
import {
  ACCORD_BODIES,
  ACCORD_GOALS,
  ACCORD_PARAMS,
  accordEnvelope,
  accordMetal,
  accordPlace,
  accordPlan,
  accordRests,
  accordSettings,
  accordStruck,
  type AccordKey,
  type AccordNote,
  type AccordSettings,
} from './slow-accord-ways'

/** What stands there while nothing has been played: middle C by itself. */
const REST_NOTES: readonly AccordNote[] = [{ id: 0, hz: 261.6256, gain: 0.7, on: 0, off: Infinity }]
/** A key is followed for at least this long, so a roll does not shake the picture. */
const FOLLOWS_SEC = 0.5
/** A line keeps its place over the far end of the plan by this, seconds. */
const AHEAD_SEC = 12
const BAR_FLOOR_DB = -36
/** `kLevel`: a full strike. */
const FULL_LEVEL = 0.18

interface AccordState extends HeardLevel {
  /** The notes as they were sent, dated on the display's clock. */
  notes: AccordNote[]
  plan: { of: string; keys: AccordKey[] } | null
  followed: { id: number; on: number; since: number } | null
}

/** The notes on the display's clock: a note that is known keeps the date it was first given. */
function dated(frame: DisplayFrame<AccordState>): AccordNote[] {
  const { state, now } = frame
  state.notes = frame.notes.slice(-12).map((note) => {
    const on = now - note.age
    const known = state.notes.find((each) => each.id === note.id && Math.abs(each.on - on) < 0.1)
    const off = note.released === null ? Infinity : now - note.released
    return {
      id: note.id,
      hz: clamp(note.frequency, 20, 6000),
      gain: note.gain,
      on: known?.on ?? on,
      off: known && known.off < Infinity && off < Infinity ? known.off : off,
    }
  })
  return state.notes
}

/** The key the picture is of and the seconds since it was struck; at rest, middle C. */
function shownNow(
  frame: DisplayFrame<AccordState>,
  set: AccordSettings,
): { key: AccordKey; age: number | null } {
  const { state, now } = frame
  const notes = frame.powered ? dated(frame) : []
  const sounding = notes.filter((note) => note.off === Infinity || frame.meter('level') > 1e-4)
  const live = sounding.length > 0
  const ahead = live ? Math.ceil((now + AHEAD_SEC) / AHEAD_SEC) * AHEAD_SEC : 0
  const until = Math.max(ahead, ...notes.map((note) => note.on + ACCORD_SECONDS))
  const played = live ? notes : REST_NOTES
  const of = JSON.stringify([set, played, live ? ahead : 0])
  if (state.plan?.of !== of)
    state.plan = { of, keys: accordPlan(set, played, live ? until : ACCORD_SECONDS) }
  const { keys } = state.plan
  if (!live) {
    state.followed = null
    return { key: keys[0], age: null }
  }
  const newest = (from: readonly AccordNote[]): AccordNote | undefined =>
    from.reduce<AccordNote | undefined>((a, b) => (a && a.on > b.on ? a : b), undefined)
  const wanted = newest(sounding.filter((note) => note.off === Infinity)) ?? newest(sounding)
  const find = (id?: number, on?: number) => keys.find((key) => key.id === id && key.on === on)
  const shown = state.followed
  const standing = find(shown?.id, shown?.on)
  if (wanted && (!standing || !shown || now - shown.since >= FOLLOWS_SEC))
    if (standing?.id !== wanted.id || standing.on !== wanted.on)
      state.followed = { id: wanted.id, on: wanted.on, since: now }
  const key = find(state.followed?.id, state.followed?.on) ?? keys[0]
  return { key, age: now - key.on }
}

/** A level as a share of a bar's length. */
const barShare = (level: number): number => clamp(1 - gainToDb(level) / BAR_FLOOR_DB, 0, 1)

function drawLines(
  frame: DisplayFrame<AccordState>,
  at: AccordLayout,
  set: AccordSettings,
  key: AccordKey,
  age: number | null,
): void {
  const { ctx, colours } = frame
  const { lines } = at
  const right = lines.x + lines.w
  const heights = accordLines(key, lines)
  const gap = lines.h / key.metal.length
  const thick = clamp(gap * 0.45, 1, 3)
  const begun = accordStruck(set, key)
  const rests = accordRests(set, key)
  const lit = age === null ? 0 : clamp(1 - gainToDb(frame.meter('level') / FULL_LEVEL) / -48, 0, 1)
  const playhead = accordX(age ?? ACCORD_SECONDS, lines)
  for (const seconds of [0.1, 1, 10])
    rule(ctx, accordX(seconds, lines), lines.y, accordX(seconds, lines), at.band.y + at.band.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })
  key.metal.forEach((_, k) => {
    const y = heights[k]
    const way = accordWay(set, key, k, y, at)
    rule(ctx, lines.x, y, right, y, { colour: colours.ink, alpha: INK.grid * 0.6 })
    const alpha = age === null ? INK.trace : INK.back
    trace(ctx, way.onto, { colour: colours.ink, width: 1, alpha })
    trace(ctx, way.after, { colour: colours.ink, width: 1, alpha: 0.6 * alpha * INK.back })
    const whole = [...way.onto, ...way.after]
    const from = barShare(begun[k]) * at.bar
    const to = barShare(rests[k]) * at.bar
    const top = y - thick / 2
    fillRect(ctx, { x: at.leftBars - from, y: top, w: from, h: thick }, colours.ink, INK.back)
    fillRect(ctx, { x: at.rightBars, y: top, w: to, h: thick }, colours.ink, INK.back)
    if (age === null) return
    clipped(ctx, { ...lines, y: lines.y - 8, h: lines.h + 16, w: playhead - lines.x }, () =>
      trace(ctx, whole, { colour: colours.ink, width: k === 0 ? 2 : 1.4 }),
    )
    const leg = key.legs[k].find((each) => age + key.on < each.start + each.span)
    const moving = leg !== undefined && age + key.on >= leg.start
    const last = key.legs[k].filter((each) => each.start + each.span <= age + key.on).at(-1)
    const here = y - accordOff(accordPlace(set, key, k, age + key.on) - key.line[k], gap)
    if (moving) {
      const x = accordX(leg.start - key.on, lines)
      clipped(ctx, { x, y: lines.y - 8, w: Math.max(0, playhead - x), h: lines.h + 16 }, () =>
        trace(ctx, whole, { colour: colours.accent, width: 2 }),
      )
      dot(ctx, Math.min(playhead, right), here, 2.6, colours.accent, { ring: colours.ink })
    } else if (k === 0 || (last && !last.home))
      fillRect(ctx, { x: at.rightBars, y: top, w: to * lit, h: thick }, colours.accent)
    else
      fillRect(ctx, { x: at.leftBars - from * lit, y: top, w: from * lit, h: thick }, colours.ink)
  })
}

/** Under the lines: the metal dying away, the accord coming up. */
function drawBand(
  frame: DisplayFrame<AccordState>,
  at: AccordLayout,
  set: AccordSettings,
  key: AccordKey,
  age: number | null,
): void {
  const { ctx, colours } = frame
  const { band } = at
  const foot = band.y + band.h
  const metal: Point[] = []
  const accord: Point[] = []
  for (let x = 0; x <= band.w; x += 1.5) {
    const level = accordEnvelope(set, key, accordSeconds(band.x + x, band))
    metal.push([band.x + x, foot - 0.9 * level.metal * band.h])
    accord.push([band.x + x, foot - 0.9 * level.accord * band.h])
  }
  fillTo(ctx, accord, foot, colours.ink, 2 * INK.fill)
  if (age !== null)
    clipped(ctx, { ...band, w: accordX(age, band) - band.x }, () =>
      fillTo(ctx, accord, foot, colours.accent, INK.text),
    )
  trace(ctx, metal, { colour: colours.ink, width: 1.2 })
  rule(ctx, band.x, foot, band.x + band.w, foot, { colour: colours.ink, alpha: INK.rule })
}

/** Two times can be taken hold of where they stand: one way's length over the lines, the rise under them. */
export function accordHandles(view: DisplayView): readonly DisplayHandle[] {
  const at = accordLayout(view)
  const set = accordSettings((name) => view.value(name))
  const { band } = at
  const rise = band.y + band.h * (1 - 0.9 * accordMetal(set, set.attack)) - 1
  const along = (name: string, words: string, y: number): DisplayHandle => {
    const spec = view.spec(name)
    return {
      key: name,
      name: words,
      x: accordX(view.value(name), at.lines),
      y,
      drag: (x: number) => ({
        [name]: clamp(accordSeconds(x, at.lines), spec?.min ?? 0, spec?.max ?? ACCORD_SECONDS),
      }),
      reset: () => ({ [name]: spec?.default ?? 0 }),
    }
  }
  return [along('travel', 'Travel', at.lines.y - 9), along('attack', 'Attack', rise)]
}

function draw(frame: DisplayFrame<AccordState>): void {
  const { ctx, colours, state } = frame
  ground(frame)
  const at = accordLayout(frame)
  const set = accordSettings((name) => frame.value(name))
  const { key, age } = shownNow(frame, set)
  text(
    frame,
    `${ACCORD_BODIES[set.material].name} to ${ACCORD_GOALS[set.goal]}`,
    at.band.x - at.bar,
    at.head,
  )
  const places = age === null ? 0 : Math.round(3 * clamp(frame.meter('moving'), 0, 1))
  const right = at.foot.x + at.foot.w
  for (let i = 0; i < 3; i++) {
    const x = right - 4 - 8 * (2 - i)
    if (i < places) dot(ctx, x, at.head - 3, 2.6, colours.accent, { ring: colours.ink })
    else dot(ctx, x, at.head - 3, 1.6, colours.ink, { alpha: INK.rule })
  }
  drawLines(frame, at, set, key, age)
  drawBand(frame, at, set, key, age)
  const [travel, attack] = accordHandles(frame)
  // One way, as long as Travel makes it, on the scale of time the lines stand on.
  rule(ctx, at.lines.x, Math.floor(travel.y), travel.x, Math.floor(travel.y), {
    colour: colours.ink,
    alpha: INK.text,
  })
  rule(ctx, at.lines.x, travel.y - 2, at.lines.x, travel.y + 2, {
    colour: colours.ink,
    alpha: INK.text,
  })
  handle(frame, attack.x, attack.y, { hot: frame.hot === 'attack', radius: 2.5 })
  handle(frame, travel.x, travel.y, { hot: frame.hot === 'travel', radius: 3 })
  levelFoot(frame, at.foot, meanOutShare(state, frame, 1))
}

export const SLOW_ACCORD_FACES: Record<string, PlateFace> = {
  'slow-accord': {
    display: plateDisplay<AccordState>({
      place: 'window',
      columns: 2,
      params: ACCORD_PARAMS,
      live: { meters: true, signal: true, notes: true, fps: 30, settle: 12 },
      info: 'One line for each overtone of a key, from the strike at the left over a scale of time: crooked as metal, then bent one after another onto the tone it agrees with. Under them the metal dies and the accord comes up. Drag the points for Travel and Attack.',
      init: () => ({ heard: [], shown: 0, notes: [], plan: null, followed: null }),
      draw,
      handles: accordHandles,
    }),
    face: ['material', 'goal', 'overtones', 'glow'],
    labels: { overtones: 'Tones', material: 'Metal' },
    sections: [
      ['material', 'overtones', 'touch', 'tilt'],
      ['goal', 'bend', 'leftover'],
      ['travel', 'order', 'manner', 'swing', 'forward', 'glint'],
      ['again', 'rest'],
      ['attack', 'ring', 'glow', 'release'],
      ['air', 'spread', 'volume'],
    ],
  },
}
