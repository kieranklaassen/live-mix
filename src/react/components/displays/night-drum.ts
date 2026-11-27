// The display of Night Drum: the drum of the newest key, and what its skin sings.
//
// At the left the drum itself: a pale skin that moves in its own modes, slowed
// until they can be seen, each as strongly as the hand at its place wakes it and
// as it has died away since the last stroke. The dark centre is as wide as Load
// makes it and off the middle by Off Centre. The hand is the accent: where it
// lands, how broad it is and how far Scatter lets it stray. Under the skin is
// the body, larger or smaller by Cavity Tune, with the second skin at its foot
// and the thread across the top when there is one.
//
// At the right the overtones over a scale of pitch with the harmonics ruled
// across, so that a loaded skin is seen to stand on them and a bare one beside
// them. The filled curve is the body, the bars are a full stroke through it, the
// tick on a bar what is left of it a second on, and the accent what rings now,
// moved by the tension the device reports. The line at the left is Bend, the
// marks at the right are the second skin's own overtones.
//
// Two points can be dragged on the skin: the one at the left is Load (the wheel
// over it is Off Centre), the one at the right is Place. The picture is turned so
// that the hand always lies to the right. The figures are the device's own
// (`night-drum-law.ts`), and the level is the one it reports.

import { clamp, dot, follow, ground, handle, text, trace } from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'
import {
  nightAngle,
  nightHand,
  nightPlace,
  nightRadius,
  nightStroke,
  type NightMode,
  type NightRead,
} from './night-drum-law'
import {
  NIGHT_AXIS,
  drawNightBody,
  drawNightLadder,
  drawNightSkin,
  nightArc,
  nightLayout,
  nightLoadAt,
  nightOnSkin,
  nightRelief,
  nightY,
} from './night-drum-picture'

interface NightState extends HeardLevel {
  level: number
  /** The stroke reading of the frame before, and seconds since it last rose. */
  fresh: number
  since: number
  /** Where the slowed modes stand. */
  time: number
}

/** The drum at rest is D3's, struck to a level that shows its skin. */
const REST_HZ = 146.83
const REST_GAIN = 0.7
const REST_LEVEL = 0.25
/** The Load point stands this far outside the edge of the load, so that a bare skin has one too. */
const LOAD_EDGE = 0.1
/** Seconds the level is taken over: a roll is read as one level. */
const LEVEL_SEC = 1

/**
 * The modes as they ring now, through the body or not: each has died for as
 * long as the last stroke is ago, and all of them together stand at `level`.
 */
export function nightNow(
  modes: readonly NightMode[],
  part: 'wake' | 'level',
  since: number,
  level: number,
): number[] {
  const longest = Math.max(...modes.map((mode) => mode.ring))
  const left = modes.map(
    (mode) => mode[part] * Math.pow(10, -3 * since * (1 / mode.ring - 1 / longest)),
  )
  const all = Math.hypot(...left)
  return left.map((each) => (all > 1e-12 ? (each / all) * level : 0))
}

function handlesOf(view: DisplayView): [DisplayHandle, DisplayHandle] {
  const read: NightRead = (name) => view.value(name)
  const first = (name: string): number => view.spec(name)?.default ?? 0
  const { skin } = nightLayout(view)
  const across = skin.rx * Math.cos(NIGHT_AXIS)
  const [middle, radius] = nightLoadAt(read)
  const [loadX, loadY] = nightOnSkin(view, middle - radius - LOAD_EDGE)
  const [placeX, placeY] = nightOnSkin(view, nightRadius(read('place')))
  return [
    {
      key: 'load',
      name: 'Load',
      x: loadX,
      y: loadY,
      drag: (x) => ({ load: clamp(((skin.x - x) / across + middle - LOAD_EDGE) / 0.5, 0, 1) }),
      wheel: (steps) => ({ offCentre: clamp(read('offCentre') + 0.05 * steps, 0, 1) }),
      reset: () => ({ load: first('load'), offCentre: first('offCentre') }),
    },
    {
      key: 'place',
      name: 'Place',
      x: placeX,
      y: placeY,
      drag: (x) => ({ place: nightPlace((x - skin.x) / across) }),
      wheel: (steps) => ({ touch: clamp(read('touch') + 0.05 * steps, 0, 1) }),
      reset: () => ({ place: first('place'), touch: first('touch') }),
    },
  ]
}

const nightDrum = plateDisplay<NightState>({
  place: 'window',
  columns: 2,
  params: [
    ...['hand', 'place', 'touch', 'scatter', 'load', 'offCentre', 'skin', 'ring', 'damp', 'bend'],
    ...['cavity', 'cavityTune', 'otherSkin', 'otherTune', 'thread'],
  ],
  live: { meters: true, signal: true, notes: true },
  info: 'The drum of the newest key, its skin slowed until it is seen to move, and its overtones against the harmonics: bars a full stroke, ticks a second later, accent what rings now. Drag the left point for Load, the right one for Place; the wheel over them is Off Centre and Touch.',
  init: () => ({ level: 0, fresh: 0, since: 0, time: 0, heard: [], shown: 0 }),
  draw(frame) {
    ground(frame)
    const { state, colours, ctx } = frame
    const read: NightRead = (name) => frame.value(name)
    const at = nightLayout(frame)
    const how = nightHand(read)
    const note = frame.powered ? frame.notes.at(-1) : undefined
    const told = frame.powered ? clamp(frame.meter('level'), 0, 2) : 0
    state.level = follow(state.level, told, frame.dt, 0.03, 0.25)
    const live = note !== undefined && (note.released === null || state.level > 1e-3)

    // A stroke is a reading that has risen; a hand that stays on the skin keeps every mode up.
    const fresh = frame.meter('stroke')
    const struck = fresh > state.fresh + 0.05
    state.since = struck || how.sustained ? 0 : Math.min(60, state.since + frame.dt)
    state.fresh = fresh
    state.time = live ? state.time + frame.dt : 0

    const hz = live ? note.frequency : REST_HZ
    const modes = nightStroke(read, hz, live ? note.gain : REST_GAIN)
    const level = live ? state.level : REST_LEVEL
    const since = live ? state.since : 0
    const semitones = live ? clamp(frame.meter('tension') * how.bend, -24, 24) : 0

    drawNightBody(frame, read, live ? level : 0)
    // A soft stroke is seen too: the skin is drawn at the root of its level.
    const sizes = nightNow(modes, 'wake', since, Math.sqrt(level))
    drawNightSkin(frame, read, nightRelief(sizes, modes, nightAngle(hz), state.time), level)
    const full = Math.hypot(...modes.map((mode) => mode.level))
    const lit = live ? nightNow(modes, 'level', since, level * full) : []
    drawNightLadder(frame, read, { hz, modes, lit, bent: Math.pow(2, semitones / 12) })
    // The other keys that are down, beside the overtones of this one.
    for (const each of live ? frame.notes : []) {
      const y = nightY(each.frequency / hz, at.ladder)
      const inside = y > at.ladder.y && y < at.ladder.y + at.ladder.h
      if (each.released === null && each !== note && inside)
        dot(ctx, at.ladder.x - 5, y, 1.3, colours.ink)
    }

    const [load, place] = handlesOf(frame)
    const reach = clamp(0.6 * how.area + 0.28 * read('scatter'), 0.1, 0.6)
    const ring = nightArc(place.x, place.y, reach * at.skin.rx, reach * at.skin.ry)
    // On the pale skin the accent needs a dark edge to be seen.
    const wide = 1.2 + Math.sqrt(clamp(level, 0, 1))
    trace(ctx, ring, { colour: colours.plate, width: wide + 1.6 })
    trace(ctx, ring, { colour: colours.accent, width: wide })
    for (const { key, x, y } of [load, place])
      handle(frame, x, y, { hot: frame.hot === key, radius: 2.5 })

    text(frame, how.name, at.left.x, 13)
    const sign = semitones > 0 ? '+' : '−'
    const bent = Math.abs(semitones) < 0.05 ? '' : `${sign}${Math.abs(semitones).toFixed(1)} st  `
    text(frame, `${bent}${pitchName(hz)}`, at.ladder.x + at.ladder.w, 13, { align: 'right' })
    levelFoot(frame, at.foot, meanOutShare(state, frame, LEVEL_SEC))
  },
  handles: (view) => handlesOf(view),
})

export const NIGHT_DRUM_FACES: Readonly<Record<string, PlateFace>> = {
  'night-drum': {
    display: nightDrum,
    face: ['hand', 'roll', 'cavity', 'ring'],
    labels: {
      offCentre: 'Off Ctr',
      cavityTune: 'Cav Tune',
      otherSkin: '2nd Skin',
      otherTune: '2nd Tune',
      thread: 'Thread',
    },
    sections: [
      ['hand', 'place', 'touch', 'grain'],
      ['roll', 'scatter', 'swell'],
      ['load', 'offCentre', 'skin', 'ring', 'damp'],
      ['bend', 'fall'],
      ['cavity', 'cavityTune', 'otherSkin', 'otherTune', 'thread'],
      ['width', 'volume'],
    ],
  },
}
