// The display of Unsung Voice: the chord's own staff, and on it the voice that
// nobody is singing.
//
// At the left every key has a column of its overtones, each as long as the
// body, the mouth, the touch and the key's age make it. Where overtones of
// different keys meet, a line of the staff goes on to the right. In the middle
// is now, left of it the last twelve seconds and right of it the next twelve,
// both on a root of time. The line is the ribbon in the accent, as thick as it
// is loud, and the overtones it is made of are in the accent; the second line
// is the ribbon in the ink. Right of now the line stands for as long as Pace
// says and rings on as Linger says; from there it may go to each meeting as
// strongly as that way is drawn, over as long as Glide makes it.
//
// Where the meetings are, how likely each is next and how loud each overtone
// is are the device's own arithmetic (`unsung-voice-meetings.ts` and
// `unsung-voice-bodies.ts`); where the lines stand and how loud they are the device reports.

import {
  INK,
  clamp,
  crisp,
  dot,
  fillRect,
  ground,
  handle,
  rule,
  text,
  trace,
  type Point,
} from '../display-kit'
import { plateDisplay, type DisplayFrame, type DisplayNote, type PlateFace } from '../plate-display'
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'
import {
  UNSUNG_PARAMS,
  unsungBars,
  unsungKey,
  unsungLift,
  unsungRing,
  unsungSettings,
  type UnsungSettings,
} from './unsung-voice-bodies'
import {
  UNSUNG_KEYS,
  UNSUNG_FLOOR,
  unsungAt,
  unsungFirst,
  unsungMeetings,
  unsungOdds,
  type UnsungMeeting,
} from './unsung-voice-meetings'
import {
  UNSUNG_RIBBON,
  UNSUNG_SECONDS,
  drawUnsungBeen,
  unsungAway,
  unsungHandles,
  unsungLayout,
  unsungRibbon,
  unsungTop,
  unsungY,
  type UnsungLayout,
  type UnsungPlace,
} from './unsung-voice-staff'

const BODY_NAMES = ['Throat', 'Reed', 'Glass', 'Bowed', 'Hollow']
/** The chord that stands there while nothing is played: D3 A3 F4 C5. */
const REST: readonly DisplayNote[] = [146.83, 220, 349.23, 523.25].map((frequency, id) => {
  return { id, frequency, gain: 0.7, age: 60, released: null }
})
/** The shortest overtone, dB against the loudest there is. */
const BAR_FLOOR_DB = -44
interface UnsungState extends HeardLevel {
  /** The keys the line is made of: the held ones, or the last that were. */
  chord: DisplayNote[]
  /** Where the two lines have been, oldest first. */
  been: [UnsungPlace[], UnsungPlace[]]
}

/** The keys that sound, by pitch, and the ones the meetings are of. */
function keysNow(
  frame: DisplayFrame<UnsungState>,
  set: UnsungSettings,
): {
  sounding: readonly DisplayNote[]
  chord: readonly DisplayNote[]
} {
  const { state } = frame
  const notes = frame.powered ? frame.notes : []
  const lined = frame.powered && frame.meter('lineLevel') > 1e-4
  const heard = lined || (frame.powered && (frame.signal?.output.rms ?? 0) > 1e-4)
  const held = notes.filter((note) => note.released === null)
  const of = [...held].slice(-UNSUNG_KEYS).sort((a, b) => a.frequency - b.frequency)
  if (of.length > 0) state.chord = of
  else if (!heard) state.chord = []
  if (state.chord.length === 0) return { sounding: REST, chord: REST }
  // A pitch that rings on and is played again has one column, the newest.
  const ringing = notes.filter((note, i) => {
    const { env, left } = unsungKey(set, note.age, note.released)
    const again = notes.slice(i + 1).some((each) => each.frequency === note.frequency)
    return !again && (note.released === null || env * left > 0.01)
  })
  const sounding = ringing.slice(-UNSUNG_KEYS).sort((a, b) => a.frequency - b.frequency)
  return { sounding: sounding.length > 0 ? sounding : state.chord, chord: state.chord }
}

/** What the two lines have been, kept for as long as the staff is wide; a tone apart from the last begins anew. */
function remember(frame: DisplayFrame<UnsungState>): void {
  const { state, now } = frame
  for (const [i, name] of ['line', 'second'].entries()) {
    const been = state.been[i]
    const hz = frame.powered ? frame.meter(name) : 0
    const level = Math.max(0, frame.meter(`${name}Level`))
    while (been.length > 0 && (been[0].at < now - UNSUNG_SECONDS || been[0].at > now)) been.shift()
    if (hz >= 20 && been.at(-1)?.at !== now) been.push({ at: now, hz, level })
  }
}

function drawKeys(
  frame: DisplayFrame<UnsungState>,
  at: UnsungLayout,
  set: UnsungSettings,
  sounding: readonly DisplayNote[],
  taken: ReadonlySet<string>,
): void {
  const { ctx, colours } = frame
  const { keys } = at
  const wide = keys.w / sounding.length
  const top = (hz: number): number => unsungY(hz, set.register, keys)
  sounding.forEach((note, i) => {
    const x = keys.x + i * wide
    rule(ctx, x, keys.y, x, keys.y + keys.h, { colour: colours.ink, alpha: INK.rule })
    unsungBars(set, note).forEach((level, k) => {
      const hz = note.frequency * (k + 1)
      if (top(hz) <= keys.y) return
      const db = 20 * Math.log10(Math.max(level, 1e-9))
      const w = clamp(1 - db / BAR_FLOOR_DB, 0, 1) * (wide - 1.5)
      const mine = taken.has(`${note.frequency}:${k + 1}`)
      const h = mine ? 3 : k === 0 ? 2 : 1
      const y = crisp(top(hz)) - h / 2
      fillRect(
        ctx,
        { x: crisp(x) + 0.5, y, w: mine ? Math.max(3, w) : w, h },
        mine ? colours.accent : colours.ink,
        mine || k === 0 ? INK.trace : INK.text,
      )
    })
  })
}

/** Right of now: the line while it stands, and the ways it may go. */
function drawNext(
  frame: DisplayFrame<UnsungState>,
  at: UnsungLayout,
  set: UnsungSettings,
  list: readonly UnsungMeeting[],
  line: UnsungPlace,
  second: UnsungPlace | null,
  live: boolean,
): void {
  const { ctx, colours } = frame
  const { staff, now } = at
  const right = staff.x + staff.w - 3
  const y = unsungY(line.hz, set.register, staff)
  const colour = live ? colours.accent : colours.ink
  const rate = unsungRing(set.linger)
  const gain = unsungLift(set.lift).line
  const stands = (place: UnsungPlace, seconds: number, loud: number, ink: string): void => {
    const ahead = Array.from({ length: 9 }, (_, i) => {
      const t = seconds * (i / 8) ** 2
      const level = Math.min(1, place.level * loud * gain * Math.exp(-rate * t))
      const x = now + unsungAway(t, staff)
      return { x, y: unsungY(place.hz, set.register, staff), thick: UNSUNG_RIBBON * level }
    })
    unsungRibbon(frame, ahead, ink)
  }
  if (second) stands(second, 1.5 * set.pace, 1.2 * set.second, colours.ink)
  stands(line, set.pace, 1, colour)
  const slides = set.glide > 0.02 ? set.glide * Math.min(set.pace, 5) * 0.8 : 0
  unsungOdds(list, line.hz, second?.hz ?? 0, set.lean).forEach((odds, i) => {
    if (odds < 0.004) return
    const to = unsungY(list[i].hz, set.register, staff)
    const way: Point[] = []
    for (let n = 0; n <= 8; n++) {
      const t = n / 8
      const x = now + unsungAway(set.pace + t * slides, staff)
      way.push([Math.min(x, right), y + (to - y) * t * t * (3 - 2 * t)])
    }
    const strong = clamp(Math.sqrt(odds), 0.25, 1)
    trace(ctx, [...way, [right, to]], { colour, width: 1, alpha: strong })
    dot(ctx, right, to, 0.8 + 2.2 * Math.sqrt(odds), colour)
  })
}

function draw(frame: DisplayFrame<UnsungState>): void {
  const { ctx, colours, state } = frame
  ground(frame)
  const at = unsungLayout(frame)
  const { staff } = at
  const set = unsungSettings((name) => frame.value(name))
  const { sounding, chord } = keysNow(frame, set)
  const list = unsungMeetings(
    chord.map((note) => note.frequency),
    set.tolerance,
    set.register,
    set.partner,
  )
  remember(frame)
  const hz = frame.powered ? frame.meter('line') : 0
  const live = hz >= 20
  // At rest the two stand where they would begin; the second one leans the other way.
  const place = (name: string, lean: number, other: number): UnsungPlace | null => {
    const level = live ? Math.max(0, frame.meter(`${name}Level`)) : 0.5
    const at = live ? frame.meter(name) : (list[unsungFirst(list, lean, other)]?.hz ?? 0)
    return at >= 20 ? { at: frame.now, hz: at, level } : null
  }
  const line = place('line', set.lean, 0)
  const second = set.second > 1e-4 ? place('second', -set.lean, line?.hz ?? 0) : null

  text(frame, BODY_NAMES[set.body], at.keys.x, at.head)
  const words = live ? `sings ${pitchName(hz)}` : `${list.length} meetings`
  text(frame, words, at.foot.x + at.foot.w, at.head, { align: 'right' })

  // The register, the staff the chord makes of it, and now.
  const top = unsungTop(set.register, staff)
  const tall = unsungY(set.register * UNSUNG_FLOOR, set.register, staff) - top
  fillRect(ctx, { x: staff.x, y: top, w: staff.w, h: tall }, colours.ink, 0.07)
  rule(ctx, staff.x, top, staff.x + staff.w, top, { colour: colours.ink, alpha: INK.rule })
  const most = Math.max(1e-9, ...list.map((each) => each.weight))
  for (const meeting of list) {
    const y = unsungY(meeting.hz, set.register, staff)
    const alpha = INK.grid + 0.5 * (meeting.weight / most)
    rule(ctx, staff.x - 3, y, staff.x + staff.w - 3, y, { colour: colours.ink, alpha })
  }
  for (const { frequency } of chord) {
    const y = unsungY(frequency, set.register, staff)
    rule(ctx, staff.x, y, staff.x + staff.w, y, {
      colour: colours.ink,
      alpha: INK.rule,
      dash: [1, 3],
    })
  }
  rule(ctx, at.now, staff.y, at.now, staff.y + staff.h, { colour: colours.ink, alpha: INK.rule })

  const gain = unsungLift(set.lift).line
  drawUnsungBeen(frame, at, state.been[1], set, 1.2 * set.second * gain, colours.ink)
  drawUnsungBeen(frame, at, state.been[0], set, gain, colours.accent)
  const taken = new Set<string>()
  for (const each of live ? [second, line] : []) {
    if (!each) continue
    const colour = each === line ? colours.accent : colours.ink
    const parts = unsungAt(list, each.hz)?.parts ?? []
    const columns = parts
      .map(({ key }) => sounding.findIndex((note) => note.frequency === chord[key].frequency))
      .filter((column) => column >= 0)
    if (columns.length === 0) continue
    // From the first of the keys it is made of, through the others, on to the staff.
    const y = unsungY(each.hz, set.register, staff)
    const x = at.keys.x + (Math.min(...columns) * at.keys.w) / sounding.length
    rule(ctx, x, y, staff.x, y, { colour, alpha: INK.text })
    if (each !== line) continue
    for (const { key, harmonic } of parts) taken.add(`${chord[key].frequency}:${harmonic}`)
  }
  drawKeys(frame, at, set, sounding, taken)
  if (line) {
    drawNext(frame, at, set, list, line, second, live)
    if (live)
      dot(ctx, at.now, unsungY(line.hz, set.register, staff), 3, colours.accent, {
        ring: colours.ink,
      })
  }
  const [register, step] = unsungHandles(frame)
  handle(frame, register.x, register.y, { hot: frame.hot === 'register', radius: 2.5 })
  handle(frame, step.x, step.y, { hot: frame.hot === 'step', radius: 3 })
  levelFoot(frame, at.foot, meanOutShare(state, frame, 1))
}

export const UNSUNG_VOICE_FACES: Readonly<Record<string, PlateFace>> = {
  'unsung-voice': {
    display: plateDisplay<UnsungState>({
      place: 'window',
      columns: 2,
      params: UNSUNG_PARAMS,
      live: { meters: true, signal: true, notes: true, fps: 30, settle: 12 },
      info: 'Left, the overtones of each key. Where they meet, a staff runs on, and the ribbon on it is the voice nobody sings: its last twelve seconds left of now, where it may step next at the right. Drag the upper point for Register, the other for Pace and Lean.',
      init: () => ({ heard: [], shown: 0, chord: [], been: [[], []] }),
      draw,
      handles: unsungHandles,
    }),
    face: ['body', 'lift', 'pace', 'colour'],
    labels: { second: 'Second', vibrato: 'Vibrato' },
    sections: [
      ['body', 'vowel', 'tilt', 'closeness', 'breath'],
      ['lift', 'tolerance', 'register', 'partner'],
      ['lean', 'pace', 'glide', 'linger'],
      ['second', 'vibrato', 'beating', 'colour'],
      ['hold', 'attack', 'release'],
      ['width', 'volume'],
    ],
  },
}
