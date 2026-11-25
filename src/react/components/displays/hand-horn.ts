// The display of the Hand Horn: the ladder of partials its crook gives, and
// how far the hand closes on every key between them.
//
// Across is pitch over the crook's fundamental in equal cents, from partial 2
// to partial 16, a post on each. Up is the hand: an open note lies on the
// ground line, a fully stopped one at the top. The line is every key the horn
// can be asked for, drawn where that key sounds and as high as the hand
// closes for it: flat within the lips' reach of a post, then up and back down
// to the next post above, which a stopped key is made from. Under the line
// stands what is heard of it, the covering times Shadow, which is what the
// device's hand filter is set by. The dots are the keys of the piano, the
// white ones strong, and the strip beneath is the keyboard itself, so another
// crook puts the shades under other keys.
//
// The note that sounds is the device's own to say (its readings: covering,
// partial, place, level): a dot where it is, as large as it is loud, with a
// line down to the post it was made from, and the same covering as the hand
// in the bell at the top right. The other keys held in Chords are small dots
// where the rule puts them. With Tremble up a line through each shows how far
// the hand takes it.
//
// Nothing turns round more than three times a second. The notes shown are
// taken up no more often than that, and a tremble faster than three a second
// is read as its mean over a second, in the middle of its line.
//
// The arithmetic is `cpp/devices/hand-horn/ladder.h` (`ask`) and
// `hand_horn.h` (`aim`, and the tremble of `form`).

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  fillTo,
  ground,
  handle,
  rule,
  text,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'

type Size = Pick<DisplayView, 'width' | 'height'>

// --- The device's numbers (`ladder.h`, `hand_horn.h`) ---------------------------

/** `kC1Hz`: cents are counted from here. */
const C1_HZ = 32.703196
/** `kFullStopCents`: lowered by this much the hand is fully in. */
export const HAND_HORN_FULL_STOP = 120
/** `kSemitones`: from C1 to each crook's fundamental, as Crook counts them. */
export const HAND_HORN_CROOKS = [-2, 0, 2, 3, 4, 5, 7, 8, 9, 10, 12] as const
/** The crooks' names, short enough to stand beside a note's. */
const CROOK_NAMES = [
  'B♭ basso',
  'C',
  'D',
  'E♭',
  'E',
  'F',
  'G',
  'A♭',
  'A',
  'B♭ alto',
  'C alto',
] as const
/** `kTrembleCents`, `kTrembleClose`, `kTrembleOpen`: what Tremble at 1 moves. */
const TREMBLE_CENTS = 28
const TREMBLE_CLOSE = 0.55
const TREMBLE_OPEN = 0.5
/** `kMaxVoices`: how many keys sound at once in Chords. */
const VOICES = 6
/** The rungs the device counts. */
const MOST_PARTIAL = 4096

const centsOf = (hz: number): number => 1200 * Math.log2(Math.max(hz, 1) / C1_HZ)

/** `rung`: cents from the fundamental to partial `n`. */
export const handHornRung = (n: number): number => 1200 * Math.log2(n)

const crookOf = (crook: number): number => clamp(Math.round(crook), 0, HAND_HORN_CROOKS.length - 1)

/** `crook_cents`: the crook's fundamental in cents over C1. */
export const handHornBase = (crook: number): number => 100 * HAND_HORN_CROOKS[crookOf(crook)]

/** What a key asks of the horn (`Ask`), with places in cents over the crook's fundamental. */
export interface HandHornAsk {
  nearest: number
  /** The partial it is made from. */
  from: number
  /** Within the lips' reach. */
  open: boolean
  /** 0 open to 1 fully stopped, with the hand at full. */
  covering: number
}

/** `ask`: a key `up` cents over the crook's fundamental. */
export function handHornAsk(up: number, lip: number): HandHornAsk {
  let low = clamp(Math.floor(Math.pow(2, clamp(up, -2400, 14000) / 1200)), 1, MOST_PARTIAL)
  while (low > 1 && handHornRung(low) > up) low -= 1
  while (low < MOST_PARTIAL && handHornRung(low + 1) <= up) low += 1
  const below = up - handHornRung(low)
  const above = handHornRung(low + 1) - up
  const nearest = below <= above ? low : low + 1
  if (Math.abs(up - handHornRung(nearest)) <= lip)
    return { nearest, from: nearest, open: true, covering: 0 }
  const from = below < 0 ? low : low + 1
  return {
    nearest,
    from,
    open: false,
    covering: clamp((handHornRung(from) - up) / HAND_HORN_FULL_STOP, 0, 1),
  }
}

/** Where a key sounds, in cents over the crook's fundamental, and how far the hand is in. */
export interface HandHornNote {
  place: number
  covering: number
  /** The partial the device says it is on. */
  partial: number
  open: boolean
}

/** `aim`: Hand closes the gap to the key in proportion, and the covering goes with it. */
export function handHornSounds(up: number, lip: number, hand: number): HandHornNote {
  const asked = handHornAsk(up, lip)
  const near = handHornRung(asked.nearest)
  return {
    place: near + hand * (up - near),
    covering: hand * asked.covering,
    partial: hand >= 0.5 ? asked.from : asked.nearest,
    open: asked.open,
  }
}

/**
 * `form`, the tremble: where it takes a note at `wave` from -1 (the hand
 * opening) to 1 (closing), once it has arrived. A straight line in `wave`.
 */
export function handHornTrembles(
  note: Pick<HandHornNote, 'place' | 'covering'>,
  tremble: number,
  wave: number,
): { place: number; covering: number } {
  return {
    place: note.place - TREMBLE_CENTS * tremble * wave,
    covering:
      note.covering * (1 - tremble * TREMBLE_OPEN * (0.5 - 0.5 * wave)) +
      (1 - note.covering) * tremble * TREMBLE_CLOSE * (0.5 + 0.5 * wave),
  }
}

/** A point of the line: where a key sounds, in cents over the fundamental, and how far the hand is in. */
export type HandHornPoint = readonly [place: number, covering: number]

/**
 * The stopped keys between partial `n` and the next, as runs. With Hand at
 * full they are one; under it the keys nearer the post below and the ones
 * nearer the post above part, and nothing sounds in the gap between them. No
 * run where the lips reach every key.
 */
export function handHornShade(n: number, lip: number, hand: number): HandHornPoint[][] {
  const low = handHornRung(n)
  const high = handHornRung(n + 1)
  const middle = 0.5 * (low + high)
  if (low + lip >= middle) return []
  const full = high - HAND_HORN_FULL_STOP
  const run = (from: number, to: number, near: number): HandHornPoint[] => {
    const keys = full > from && full < to ? [from, full, to] : [from, to]
    return keys.map((key): HandHornPoint => [
      near + hand * (key - near),
      hand * clamp((high - key) / HAND_HORN_FULL_STOP, 0, 1),
    ])
  }
  const lower = run(low + lip, middle, low)
  const upper = run(middle, high - lip, high)
  return hand < 1 ? [lower, upper] : [[...lower, ...upper.slice(1)]]
}

/** A run cut at the edges of the ladder. */
function cutRun(run: readonly HandHornPoint[]): readonly HandHornPoint[] {
  const out: HandHornPoint[] = []
  run.forEach((point, i) => {
    const next = run[i + 1]
    if (point[0] >= HAND_HORN_FROM && point[0] <= HAND_HORN_TO) out.push(point)
    if (!next) return
    for (const edge of [HAND_HORN_FROM, HAND_HORN_TO])
      if (point[0] < edge && next[0] > edge) {
        const t = (edge - point[0]) / (next[0] - point[0])
        out.push([edge, point[1] + t * (next[1] - point[1])])
      }
  })
  return out
}

// --- The picture ------------------------------------------------------------------

/** The ladder runs from partial 2 to 16, with a little over at each end. */
const FIRST_PARTIAL = 2
const LAST_PARTIAL = 16
const OVER_CENTS = 60
export const HAND_HORN_FROM = handHornRung(FIRST_PARTIAL) - OVER_CENTS
export const HAND_HORN_TO = handHornRung(LAST_PARTIAL) + OVER_CENTS
/** The posts that are numbered, the ones that give way first when there is little room last. */
const NUMBERED = [2, 4, 8, 16, 3, 6, 12, 5, 10, 7, 14, 9, 11, 13, 15]
const WHITE = new Set([0, 2, 4, 5, 7, 9, 11])

/** What is shown is taken up, and turns round, no more often than three times a second. */
export const HAND_HORN_TAKES_SEC = 1 / 3
/** A tremble up to this fast is followed; a faster one is read as its mean. */
export const HAND_HORN_FOLLOWS_HZ = 3
/** The mean of a quick tremble is taken over this long. */
const MEAN_SEC = 1
/** And moves the mark only by more than this: a third of a pixel across, one up. */
const STILL_CENTS = 10
const STILL_COVERING = 0.02
/** A key stays lit this long after it was let go, so quick notes do not flicker. */
export const HAND_HORN_LIT_SEC = 0.5
/** The level in the foot is the mean over this long. */
const LEVEL_SEC = 1

export interface HandHornLayout {
  /** The baseline of the words at the top, and where they start and end. */
  head: { left: number; right: number; baseline: number }
  bell: { x: number; y: number; r: number }
  plot: Box
  /** The keyboard under the plot, and the baseline of the numbers under it. */
  keys: Box
  numbers: number
  /** Where the Shadow and the Hand points stand across. */
  shadowX: number
  handX: number
  foot: Box
}

export function handHornLayout(size: Size): HandHornLayout {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const right = box.x + box.w
  const foot: Box = { x: box.x, y: box.y + box.h - 4, w: box.w, h: 4 }
  const numbers = foot.y - 2
  const keys: Box = { x: box.x + 8, y: numbers - 12, w: box.w - 16, h: 4 }
  const top = box.y + 18
  const plot: Box = { x: keys.x, y: top, w: keys.w, h: Math.max(8, keys.y - 1 - top) }
  return {
    head: { left: box.x, right: right - 17, baseline: box.y + 8 },
    bell: { x: right - 7, y: box.y + 6, r: 6 },
    plot,
    keys,
    numbers,
    shadowX: box.x + 2,
    handX: right - 2,
    foot,
  }
}

export const handHornX = (cents: number, plot: Box): number =>
  plot.x +
  ((clamp(cents, HAND_HORN_FROM, HAND_HORN_TO) - HAND_HORN_FROM) /
    (HAND_HORN_TO - HAND_HORN_FROM)) *
    plot.w

export const handHornY = (covering: number, plot: Box): number =>
  plot.y + (1 - clamp(covering, 0, 1)) * plot.h

/** The newest note as it is shown. */
interface Shown {
  /** Cents over the crook's fundamental. */
  place: number
  covering: number
  partial: number
  level: number
}

/** The device's readings on one frame; null while nothing sounds. */
interface Reading extends Shown {
  at: number
}

interface HandHornState extends HeardLevel {
  /** Which note is shown, when it was taken up, and its pitch where the plate knows it. */
  key: string
  taken: number
  hz: number | null
  note: Shown | null
  /** The readings a fast tremble's mean is taken over. */
  recent: Reading[]
  /** The keys that are lit, by pitch, and until when. */
  lit: Map<number, number>
}

const NOTHING = 'nothing'

function reading(frame: DisplayFrame): Reading | null {
  const partial = Math.round(frame.meter('partial'))
  const ratio = frame.meter('place')
  const covering = frame.meter('covering')
  const level = frame.meter('level')
  if (!(partial >= 1 && ratio > 0 && Number.isFinite(ratio))) return null
  return {
    at: frame.now,
    place: 1200 * Math.log2(ratio),
    covering: Number.isFinite(covering) ? clamp(covering, 0, 1) : 0,
    partial: Math.min(partial, MOST_PARTIAL),
    level: Number.isFinite(level) ? clamp(level, 0, 1) : 0,
  }
}

/** The note the device's readings are of: the newest held, or the newest of all when none is. */
function newestNote(notes: readonly DisplayNote[]): DisplayNote | null {
  let found: DisplayNote | null = null
  for (const note of notes) {
    if (found?.released === null && note.released !== null) continue
    if (!found || (found.released !== null && note.released === null) || note.age <= found.age)
      found = note
  }
  return found
}

/** Takes up what the device reads, as `shown`: see the head of this file. */
function follow(state: HandHornState, frame: DisplayFrame): void {
  const read = reading(frame)
  const note = read ? newestNote(frame.notes) : null
  const born = note ? Math.round((frame.now - note.age) * 10) : 0
  const key = !read ? NOTHING : note ? `${note.id} ${note.frequency} ${born}` : 'something'
  // A note's start is worked out from its age: the same one may come out a tenth of a second off.
  const same =
    key === state.key ||
    (note !== null &&
      [-1, 1].some((off) => `${note.id} ${note.frequency} ${born + off}` === state.key))
  if (!same) {
    const since = frame.now - state.taken
    if (since >= 0 && since < HAND_HORN_TAKES_SEC) return
    state.key = key
    state.taken = frame.now
    state.hz = note?.frequency ?? null
    state.recent = []
  }
  if (!read) {
    state.note = null
    return
  }
  state.recent.push(read)
  const fast = frame.value('tremble') > 0 && frame.value('trembleRate') > HAND_HORN_FOLLOWS_HZ
  const from = frame.now - (fast ? MEAN_SEC : 0)
  while (state.recent.length > 1 && state.recent[0].at <= from + 1e-6) state.recent.shift()
  // A mean that comes in and goes out softly, so a quick tremble leaves nothing in it.
  const start = Math.max(from, state.recent[0].at - 0.05)
  const span = Math.max(frame.now - start, 1e-3) + 0.05
  let place = 0
  let covering = 0
  let count = 0
  for (const each of state.recent) {
    const weight = Math.sin((Math.PI * (each.at - start + 1e-3)) / span) ** 2 + 1e-6
    place += each.place * weight
    covering += each.covering * weight
    count += weight
  }
  place /= count
  covering /= count
  // What little of the tremble is left in the mean does not move the mark.
  const before = state.note
  if (
    fast &&
    same &&
    before &&
    Math.abs(place - before.place) < STILL_CENTS &&
    Math.abs(covering - before.covering) < STILL_COVERING
  ) {
    place = before.place
    covering = before.covering
  }
  state.note = { place, covering, partial: read.partial, level: read.level }
}

/** The pitches that are lit: the newest six held in Chords, the newest in Solo, and for a while after. */
function litKeys(state: HandHornState, frame: DisplayFrame): number[] {
  const held = frame.notes.filter((note) => note.released === null).sort((a, b) => a.age - b.age)
  const most = Math.round(frame.value('play')) === 0 ? 1 : VOICES
  for (const note of held.slice(0, most)) {
    const hz = Math.round(note.frequency * 100) / 100
    state.lit.delete(hz)
    state.lit.set(hz, frame.now + HAND_HORN_LIT_SEC)
  }
  for (const [hz, until] of state.lit)
    if (until <= frame.now || until > frame.now + 2 * HAND_HORN_LIT_SEC) state.lit.delete(hz)
  return [...state.lit.keys()].slice(-most)
}

/** A number of cents with its sign, a real minus. */
const signed = (cents: number): string => `${cents < 0 ? '−' : '+'}${Math.round(Math.abs(cents))}`

/** What the horn does for a key: "A4: 14, hand −69", or the short of it where there is no room. */
export function handHornWords(
  hz: number,
  base: number,
  lip: number,
  hand: number,
): [string, string] {
  const sounds = handHornSounds(centsOf(hz) - base, lip, hand)
  const off = sounds.place - handHornRung(sounds.partial)
  const name = pitchName(hz)
  if (Math.abs(off) < 0.5) return [`${name}: ${sounds.partial} open`, `${name} ${sounds.partial}`]
  const how = sounds.open ? 'lips' : 'hand'
  return [
    `${name}: ${sounds.partial}, ${how} ${signed(off)}`,
    `${name} ${sounds.partial} ${signed(off)}`,
  ]
}

function handHornHandles(view: DisplayView): DisplayHandle[] {
  const { plot, shadowX, handX } = handHornLayout(view)
  const of = (param: string, name: string, x: number): DisplayHandle => ({
    key: param,
    name,
    x,
    y: handHornY(view.value(param), plot),
    drag: (_x, y) => ({ [param]: clamp(1 - (y - plot.y) / plot.h, 0, 1) }),
    wheel: (steps) => ({
      [param]: clamp(Math.round((view.value(param) + steps * 0.02) * 100) / 100, 0, 1),
    }),
    reset: () => ({ [param]: view.spec(param)?.default ?? 1 }),
  })
  return [of('shadow', 'Shadow', shadowX), of('hand', 'Hand', handX)]
}

const handHorn = plateDisplay<HandHornState>({
  place: 'window',
  columns: 2,
  params: ['crook', 'hand', 'lip', 'shadow', 'play', 'tremble', 'trembleRate'],
  live: { meters: true, signal: true, notes: true },
  info: 'The crook’s partials 2 to 16 as posts and, between them, how far the hand closes for each key: flat is open, the top is stopped. The dot is the newest note, its line the post it is made from; the bell shows the hand. Drag the right point for Hand, the left one for Shadow.',
  handles: handHornHandles,
  init: () => ({
    key: NOTHING,
    taken: -Infinity,
    hz: null,
    note: null,
    recent: [],
    lit: new Map<number, number>(),
    heard: [],
    shown: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const at = handHornLayout(frame)
    const { plot, bell } = at
    const crook = crookOf(frame.value('crook'))
    const base = handHornBase(crook)
    const hand = clamp(frame.value('hand'), 0, 1)
    const lip = frame.value('lip')
    const shadow = clamp(frame.value('shadow'), 0, 1)
    const tremble = clamp(frame.value('tremble'), 0, 1)
    const xOf = (cents: number): number => handHornX(cents, plot)
    const yOf = (covering: number): number => handHornY(covering, plot)
    const floor = plot.y + plot.h

    if (frame.powered) follow(state, frame)
    else {
      state.key = NOTHING
      state.note = null
      state.recent = []
      state.lit.clear()
    }

    // The words: what is in hand, or the crook and the note shown.
    if (frame.hot === 'hand' || frame.hot === 'shadow') {
      const name = frame.hot === 'hand' ? 'Hand' : 'Shadow'
      const value = frame.hot === 'hand' ? hand : shadow
      text(frame, `${name} ${value.toFixed(2)}`, at.head.left, at.head.baseline)
    } else {
      text(frame, CROOK_NAMES[crook], at.head.left, at.head.baseline)
      if (state.note && state.hz !== null) {
        const [long, short] = handHornWords(state.hz, base, lip, hand)
        const room = at.head.right - at.head.left - ctx.measureText(CROOK_NAMES[crook]).width - 6
        text(
          frame,
          ctx.measureText(long).width <= room ? long : short,
          at.head.right,
          at.head.baseline,
          { align: 'right' },
        )
      }
    }

    // The bell from behind, the hand in it as far as it covers.
    if (state.note && state.note.covering > 0.005) {
      const edge = bell.y + bell.r * (1 - 2 * state.note.covering)
      clipped(ctx, { x: bell.x - bell.r, y: edge, w: 2 * bell.r, h: bell.y + bell.r - edge }, () =>
        dot(ctx, bell.x, bell.y, bell.r, colours.accent),
      )
    }
    ctx.beginPath()
    ctx.arc(bell.x, bell.y, bell.r, 0, Math.PI * 2)
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1.2
    ctx.stroke()

    // The rails of the two points, and the posts.
    for (const x of [at.shadowX, at.handX])
      rule(ctx, x, plot.y, x, floor, { colour: colours.ink, alpha: INK.rule })
    for (let n = FIRST_PARTIAL; n <= LAST_PARTIAL; n++) {
      const x = xOf(handHornRung(n))
      rule(ctx, x, plot.y, x, floor, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, plot.x, floor, plot.x + plot.w, floor, { colour: colours.ink, alpha: INK.back })

    // What is heard of the hand under how far it closes, for every key between two posts.
    for (let n = FIRST_PARTIAL - 1; n <= LAST_PARTIAL; n++) {
      const runs = handHornShade(n, lip, hand)
      runs.forEach((run) => {
        const inside = run.filter(([place]) => place >= HAND_HORN_FROM && place <= HAND_HORN_TO)
        // A run that leaves the ladder is cut at its edge, where it is level or straight.
        const points = inside.length === run.length ? run : cutRun(run)
        if (points.length < 2) return
        const line = points.map(([place, covering]): Point => [xOf(place), yOf(covering)])
        fillTo(ctx, line, floor, colours.ink, INK.fill)
        fillTo(
          ctx,
          points.map(([place, covering]): Point => [xOf(place), yOf(covering * shadow)]),
          floor,
          colours.ink,
          INK.back,
        )
        trace(ctx, line, { colour: colours.ink, width: 1, alpha: INK.text })
      })
    }

    // The keys of the piano: where each sounds, and the keyboard itself.
    const cell = plot.w / ((HAND_HORN_TO - HAND_HORN_FROM) / 100)
    fillRect(ctx, at.keys, colours.ink, INK.fill)
    const firstKey = Math.ceil(HAND_HORN_FROM / 100)
    const lastKey = Math.floor(HAND_HORN_TO / 100)
    for (let key = firstKey; key <= lastKey; key++) {
      const up = key * 100
      const white = WHITE.has((((HAND_HORN_CROOKS[crook] + key) % 12) + 12) % 12)
      if (!white)
        fillRect(
          ctx,
          { x: xOf(up) - cell / 2, y: at.keys.y, w: cell, h: at.keys.h },
          colours.ink,
          INK.text,
        )
      const sounds = handHornSounds(up, lip, hand)
      dot(ctx, xOf(sounds.place), yOf(sounds.covering), white ? 1.4 : 0.8, colours.ink)
    }

    // The numbers of the posts, where there is room beside the ones that came first.
    const taken: { from: number; to: number }[] = []
    for (const n of NUMBERED) {
      const x = xOf(handHornRung(n))
      const half = ctx.measureText(String(n)).width / 2 + 1.5
      if (taken.some(({ from, to }) => x - half < to && x + half > from)) continue
      taken.push({ from: x - half, to: x + half })
      text(frame, String(n), x, at.numbers, { align: 'center', alpha: INK.text })
    }

    // What is held: its key lit, where the rule puts it, and how far a tremble takes it.
    const lit = frame.powered ? litKeys(state, frame) : []
    const slow = frame.value('trembleRate') <= HAND_HORN_FOLLOWS_HZ
    for (const hz of lit) {
      const up = centsOf(hz) - base
      if (up >= HAND_HORN_FROM && up <= HAND_HORN_TO)
        fillRect(
          ctx,
          { x: xOf(up) - cell / 2, y: at.keys.y, w: cell, h: at.keys.h },
          colours.accent,
        )
      const sounds = handHornSounds(up, lip, hand)
      if (tremble > 0) {
        const ends = [-1, 1].map((wave): Point => {
          const end = handHornTrembles(sounds, tremble, wave)
          return [xOf(end.place), yOf(end.covering)]
        })
        trace(ctx, ends, {
          colour: colours.accent,
          width: 1.2,
          ...(slow ? {} : { dash: [2, 2] as const }),
        })
      }
      dot(ctx, xOf(sounds.place), yOf(sounds.covering), 1.8, colours.accent)
    }

    // The newest note, as the device says it is, and the post it is made from.
    if (state.note) {
      const { place, covering, partial, level } = state.note
      const x = xOf(place)
      const y = yOf(covering)
      trace(
        ctx,
        [
          [xOf(handHornRung(partial)), floor],
          [x, y],
        ],
        { colour: colours.accent, width: 1.5 },
      )
      // Past either end of the ladder it waits at the edge, hollow.
      const on = place >= HAND_HORN_FROM && place <= HAND_HORN_TO
      dot(ctx, x, y, 2 + 1.5 * level, on ? colours.accent : colours.plate, {
        ring: on ? colours.ink : colours.accent,
      })
    }

    for (const point of handHornHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    levelFoot(frame, at.foot, meanOutShare(state, frame, LEVEL_SEC))
  },
})

export const HAND_HORN_FACES: Readonly<Record<string, PlateFace>> = {
  'hand-horn': {
    display: handHorn,
    face: ['crook', 'hand', 'lip', 'shadow'],
    sections: [
      ['crook', 'hand', 'lip', 'shadow'],
      ['blow', 'breath', 'attack', 'rip'],
      ['play', 'slide', 'tremble', 'trembleRate'],
      ['release', 'distance', 'spread', 'volume'],
    ],
    labels: { trembleRate: 'Rate' },
  },
}
