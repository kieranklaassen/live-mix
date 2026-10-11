// Displays of the instruments that are bowed, alone and in sections.
//
// Each has the instrument itself above (one string under its bow, a row of
// players, three ranks of sawtooth into a chorus) and a note's life below it:
// how its level comes and goes while the key is held and after it is let go,
// on a scale of seconds, drawn from the device's own figures. A note that is
// played lights the part it plays and stands on that life where it is now.

import {
  INK,
  clamp,
  dot,
  fillRect,
  gainToDb,
  ground,
  handle,
  hzText,
  label,
  lerp,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, outShare, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

const TWO_PI = Math.PI * 2
/** What `kit` calls sixty dB: the natural log of a thousand. */
const SIXTY_DB = 6.907755279
/** The span of a note's light and of a life's height, in dB under a full note. */
const LIFE_DB = 60
/** Under this share of its light a note is done. */
const DONE = 0.02

/** A level in dB as a share of the light: 1 at a full note, 0 at 60 dB under it. */
const shareOfDb = (db: number): number => clamp(1 + db / LIFE_DB, 0, 1)

/**
 * `env.h`, `Adsr::next`: the attack runs at 1.3 and is cut off at 1, which it
 * reaches after `attack` seconds. An attack under a sample is there at once.
 */
export function adsrRise(seconds: number, attack: number): number {
  if (seconds < 0) return 0
  if (attack <= 1 / 48000) return 1
  return Math.min(1, 1.3 * (1 - Math.pow(0.3 / 1.3, seconds / attack)))
}

// --- A note's life -----------------------------------------------------------

/** The parts every display here is laid out in. */
interface Stage {
  /** The instrument. */
  main: Box
  /** The note's life: while the key is held, and after it is let go. */
  held: Box
  gone: Box
  /** The level that comes out. */
  foot: Box
  /** The baseline of the words along the top. */
  words: number
}

function stageOf(view: Size, lifeHigh: number, footHigh: number): Stage {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const footRoom = 8
  const life: Box = {
    x: all.x + 3,
    y: all.y + all.h - footRoom - lifeHigh - 1,
    w: all.w - 6,
    h: lifeHigh,
  }
  // The held part is the longer: a slow attack and a long ring both lie in it.
  const gap = 6
  const heldWide = Math.round((life.w - gap) * 0.58)
  return {
    main: { x: life.x, y: all.y + 11, w: life.w, h: life.y - 4 - (all.y + 11) },
    held: { ...life, w: heldWide },
    gone: { ...life, x: life.x + heldWide + gap, w: life.w - heldWide - gap },
    foot: { x: all.x, y: all.y + all.h - footRoom + 1, w: all.w, h: footHigh },
    words: all.y + 7,
  }
}

/**
 * Where a time stands across a part of the life: by its cube root, so that a
 * tenth of a second and ten seconds are both to be seen on one scale.
 */
const lifeX = (seconds: number, box: Box, span: number): number =>
  box.x + box.w * Math.cbrt(clamp(seconds / span, 0, 1))
const lifeSeconds = (x: number, box: Box, span: number): number =>
  span * Math.pow(clamp((x - box.x) / box.w, 0, 1), 3)
const lifeY = (db: number, box: Box): number => box.y + box.h * (1 - shareOfDb(db))

/** The ground of a life: its floor, a line at one second and at ten, and the two said where they stand. */
function lifeGround(
  frame: Paint & Pick<DisplayFrame, 'fontFamily'>,
  stage: Stage,
  heldSpan: number,
  goneSpan: number,
): void {
  const { ctx, colours } = frame
  for (const [box, span] of [
    [stage.held, heldSpan],
    [stage.gone, goneSpan],
  ] as const) {
    const floor = box.y + box.h
    rule(ctx, box.x, floor, box.x + box.w, floor, { colour: colours.ink, alpha: INK.rule })
    rule(ctx, box.x, box.y, box.x, floor, { colour: colours.ink, alpha: INK.rule })
    for (const seconds of [1, 10]) {
      if (seconds >= span) continue
      const x = lifeX(seconds, box, span)
      rule(ctx, x, box.y, x, floor, { colour: colours.ink, alpha: INK.grid })
    }
  }
}

/**
 * The seconds said on the held part's lines. A held note's post passes them as
 * it ages, so they are set after the posts: a post goes behind a word, not
 * through it.
 */
function lifeScale(
  frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>,
  stage: Stage,
  heldSpan: number,
): void {
  const floor = stage.held.y + stage.held.h
  for (const seconds of [1, 10]) {
    if (seconds >= heldSpan) continue
    label(frame, `${seconds} s`, lifeX(seconds, stage.held, heldSpan) - 2, floor - 2, 'right')
  }
}

/** A level over time across a part of the life: `db` at every second pixel. */
function lifePath(
  ctx: CanvasRenderingContext2D,
  box: Box,
  span: number,
  db: (seconds: number) => number,
): void {
  ctx.beginPath()
  // The last step is cut to the box's edge, so a box an odd number of px wide is drawn to its end.
  for (let px = 0; px < box.w + 2; px += 2) {
    const x = box.x + Math.min(px, box.w)
    const y = lifeY(db(lifeSeconds(x, box, span)), box)
    if (px === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

function lifeLine(
  frame: Paint,
  box: Box,
  span: number,
  db: (seconds: number) => number,
  alpha: number,
  dash: readonly number[] = [],
): void {
  const { ctx, colours } = frame
  lifePath(ctx, box, span, db)
  ctx.setLineDash([...dash])
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/**
 * A note on the life: a post in the accent from the floor up to its level,
 * in the held part at its age while the key is down, in the other at the time
 * since it was let go.
 */
function lifeMark(
  frame: Paint,
  stage: Stage,
  heldSpan: number,
  goneSpan: number,
  note: DisplayNote,
  db: number,
): void {
  const { ctx, colours } = frame
  const box = note.released === null ? stage.held : stage.gone
  const x =
    note.released === null
      ? lifeX(note.age, box, heldSpan)
      : lifeX(Math.min(note.released, note.age), box, goneSpan)
  const y = lifeY(db, box)
  ctx.beginPath()
  ctx.moveTo(x, box.y + box.h)
  ctx.lineTo(x, y)
  ctx.globalAlpha = 1
  ctx.strokeStyle = colours.accent
  ctx.lineWidth = 1.5
  ctx.stroke()
  dot(ctx, x, y, 2, colours.accent)
}

/** The two handles of a life: Attack where the rise is done, Release where the fall has run out. */
function lifeHandles(
  view: DisplayView,
  stage: Stage,
  heldSpan: number,
  goneSpan: number,
  /** Seconds the rise takes at an Attack of `attack`, and the Attack that takes so long. */
  riseOf: (attack: number) => number,
  attackOf: (rise: number) => number,
): DisplayHandle[] {
  return [
    {
      key: 'attack',
      name: 'Attack',
      x: lifeX(riseOf(view.value('attack')), stage.held, heldSpan),
      y: stage.held.y,
      drag: (toX) => ({ attack: attackOf(lifeSeconds(toX, stage.held, heldSpan)) }),
      reset: () => ({ attack: view.spec('attack')?.default ?? 1 }),
    },
    {
      key: 'release',
      name: 'Release',
      x: lifeX(view.value('release'), stage.gone, goneSpan),
      y: stage.gone.y + stage.gone.h,
      drag: (toX) => ({ release: lifeSeconds(toX, stage.gone, goneSpan) }),
      reset: () => ({ release: view.spec('release')?.default ?? 1 }),
    },
  ]
}

/** The last note of `frame.notes` that `sounds`, or null: the one the words speak of. */
function lastSounding(
  notes: readonly DisplayNote[],
  sounds: (note: DisplayNote) => boolean,
): DisplayNote | null {
  for (let index = notes.length - 1; index >= 0; index--)
    if (sounds(notes[index])) return notes[index]
  return null
}

// --- Bow ---------------------------------------------------------------------

const BOW_MODES = ['Pluck', 'Sustain', 'Bow'] as const
const BOW_PLUCK = 0
const BOW_SUSTAIN = 1
/** `bowed_string.h`: the shortest Attack, at which a plucked string's swell is off. */
const BOW_ATTACK_LEAST = 0.005
/** `bowed_string.h`, `kDampHz`, `kDarkSeconds`, `kBrightSeconds`: the partial Brightness is set by, and how long it rings from 0 to 1. */
const BOW_DAMP_HZ = 2500
const BOW_DARK_SECONDS = 0.08
const BOW_BRIGHT_SECONDS = 30
/** `bowed_string.h`, `kVibratoCents`, `kVibratoDelay`, `kVibratoFade`. */
const BOW_VIBRATO_CENTS = 40
const BOW_VIBRATO_DELAY = 0.3
const BOW_VIBRATO_FADE = 0.6
/** `bowed_string.h`, `kBowSlopeLight`, `kBowSlopeHeavy`: a bowed string's partials fall as h to minus this. */
const BOW_SLOPE_LIGHT = 1.9
const BOW_SLOPE_HEAVY = 0.85

/** `BowedString::start`: how strongly a string is played, from the note's gain. */
export const bowStrength = (gain: number): number => 0.3 + 0.7 * clamp(gain, 0, 1)

/** `BowedString::ring_time`: seconds the fundamental takes to fall 60 dB, while the key is held and after. */
export function bowRingSeconds(decay: number, release: number, released: boolean): number {
  return released ? Math.min(decay, release) : decay
}

/**
 * `BowedString::set_envelope`: the level the attack asks for `seconds` after
 * the key. Under a sustainer or a bow it is the bloom; on a plucked string it
 * is a swell over the pick, as long as Attack is above its least.
 */
export function bowSwell(mode: number, seconds: number, attack: number): number {
  return adsrRise(seconds, Math.round(mode) === BOW_PLUCK ? attack - BOW_ATTACK_LEAST : attack)
}

/**
 * How loud a string is, in dB under a full stroke: played `age` seconds ago
 * as hard as `gain`, let go `released` seconds ago (null while held). A
 * plucked string falls from the pick on, by Decay and then by the shorter of
 * Decay and Release; a driven one holds what the attack has reached and rings
 * out from the key up (`BowedString::shape`, `render_voice`).
 */
export function bowStringDb(
  mode: number,
  age: number,
  released: number | null,
  gain: number,
  attack: number,
  decay: number,
  release: number,
): number {
  const after = released === null ? 0 : Math.min(released, age)
  const held = age - after
  const fall = LIFE_DB * (after / bowRingSeconds(decay, release, true))
  if (Math.round(mode) === BOW_PLUCK)
    return (
      gainToDb(bowStrength(gain) * bowSwell(mode, age, attack)) - LIFE_DB * (held / decay) - fall
    )
  return gainToDb(bowStrength(gain) * bowSwell(mode, held, attack)) - fall
}

/** Loss of the bridge low-pass y = (1 - p)x + p y1 at `w` radians a sample: `BowedString::damp_gain`. */
const bowDampGain = (p: number, w: number): number =>
  (1 - p) / Math.sqrt(Math.max(1e-12, 1 - 2 * p * Math.cos(w) + p * p))

/**
 * `BowedString::shape`: seconds the partial near 2.5 kHz of a string at `hz`
 * takes to fall 60 dB when the fundamental takes `ring`. The bridge low-pass
 * is solved so that it alone would let that partial ring for what Brightness
 * says (0.08 s to 30 s), and the loop gain gives the fundamental back what
 * the low-pass took from it.
 */
export function bowPartialSeconds(
  hz: number,
  ring: number,
  brightness: number,
  sampleRate = 48000,
): number {
  const ref = Math.min(Math.max(BOW_DAMP_HZ, 3 * hz), 0.45 * sampleRate)
  const bright = BOW_DARK_SECONDS * Math.pow(BOW_BRIGHT_SECONDS / BOW_DARK_SECONDS, brightness)
  const m = Math.exp((-2 * SIXTY_DB) / (hz * bright))
  let p = 0
  if (1 - m > 1e-6) {
    const b = 1 - m * Math.cos((TWO_PI * ref) / sampleRate)
    p = (b - Math.sqrt(Math.max(0, b * b - (1 - m) * (1 - m)))) / (1 - m)
  }
  p = clamp(p, 0, 0.98)
  const loop = Math.min(
    Math.exp(-SIXTY_DB / (hz * ring)) / bowDampGain(p, (TWO_PI * hz) / sampleRate),
    0.9999,
  )
  const round = loop * bowDampGain(p, (TWO_PI * ref) / sampleRate)
  return Math.min(ring, -SIXTY_DB / (hz * Math.log(Math.min(round, 0.999999))))
}

/**
 * `BowedString::control` and `tune`: the cents a note `age` seconds old
 * stands off its pitch. The vibrato starts with the note, waits 0.3 s and
 * comes in over 0.6 s, so its place is known from the note's age.
 */
export function bowVibratoCents(age: number, vibrato: number, rate: number): number {
  const fade = clamp((age - BOW_VIBRATO_DELAY) / BOW_VIBRATO_FADE, 0, 1)
  return vibrato * BOW_VIBRATO_CENTS * fade * Math.sin(TWO_PI * age * rate)
}

/** `BowedString::octave_share`: the share of a sustained string's level that Pressure hands to the octave. */
export const bowOctaveShare = (pressure: number): number => 0.85 * pressure * pressure

/** `BowedString::draw`: the slope of a bowed string's partials, from a light bow to a heavy one. */
export const bowSlope = (pressure: number): number =>
  lerp(BOW_SLOPE_LIGHT, BOW_SLOPE_HEAVY, clamp(pressure, 0, 1))

/** `BowedString::start`: the beats a second between a note's two strings, tuned `detune` cents apart. */
export const bowBeatHz = (hz: number, detune: number): number =>
  hz * (Math.pow(2, detune / 2400) - Math.pow(2, -detune / 2400))

/** `BowedString::start`: under a hundredth of a cent of Detune a note has one string. */
const bowStrings = (detune: number): number => (detune > 0.01 ? 2 : 1)

/** The spans of the Bow's life: Decay goes to 30 s, Release to 15. */
const BOW_HELD_SPAN = 30
const BOW_GONE_SPAN = 15
/** The pitch the life is drawn for while no note sounds: the header's own. */
const BOW_REST_HZ = 220
/** The stretch of a note's vibrato that is drawn: the wait, the coming in, and as much again at full depth. */
const BOW_VIBRATO_SHOWN = 1.5
/** How many strings are lit at once: the device has twelve voices of two. */
const BOW_LIT_MOST = 12
/** The partials a bowed string's shape is summed from. */
const BOW_SHAPE_PARTIALS = 10
/** The steps a string is drawn in along its length. */
const BOW_STEPS = 40
/** Where the corner of a bowed string stands in the picture at rest, as a turn of its cycle. */
const BOW_REST_TURN = 0.31

interface BowParts extends Stage {
  /** The string: from the bridge at `x` to the nut at `x + w`, at rest on `y`, swinging `h` either way. */
  string: Box
}

function bowParts(view: Size, body: number): BowParts {
  // Body is the box the string stands on: the bar along the foot is as thick as there is of it.
  const stage = stageOf(view, 27, 2 + Math.round(clamp(body, 0, 1) * 5))
  const high = Math.min(13, stage.main.h / 2 - 5)
  return {
    ...stage,
    string: {
      x: stage.main.x + 6,
      y: stage.main.y + stage.main.h / 2 + 2,
      w: stage.main.w - 11,
      h: high,
    },
  }
}

/**
 * A plucked string along its length, 0 at both ends and 1 under the pick:
 * `u` runs from the bridge, `at` is the pick's place. A bright pick leaves
 * the corner an ideal pluck has; a dull one rounds it.
 */
function bowPluckShape(u: number, at: number, brightness: number): number {
  const corner = u < at ? u / at : (1 - u) / (1 - at)
  return lerp(Math.sin((corner * Math.PI) / 2), corner, brightness)
}

/**
 * A bowed string along its length at one moment of its cycle: partials that
 * fall as the device's own slope, one step steeper for the string's place
 * against its pull on the bridge, lined up as the corner that runs round a
 * bowed string. `turn` is the moment, 0..1; a light bow rounds the corner.
 */
function bowSlipShape(u: number, turn: number, slope: number): number {
  let sum = 0
  let most = 0
  for (let h = 1; h <= BOW_SHAPE_PARTIALS; h++) {
    const size = Math.pow(h, -(slope + 1))
    sum += size * Math.sin(h * Math.PI * u) * Math.sin(h * TWO_PI * turn)
    if (h % 2 === 1) most += size
  }
  return sum / most
}

/** A sustained string: its fundamental, and the octave Pressure hands the level to. */
function bowSustainShape(u: number, turn: number, octave: number): number {
  return (
    (1 - octave) * Math.sin(Math.PI * u) * Math.sin(TWO_PI * turn) +
    octave * Math.sin(TWO_PI * u) * Math.sin(2 * TWO_PI * turn)
  )
}

interface BowSettings {
  position: number
  pressure: number
  brightness: number
}

/** The string's shape at `turn` of its swing in the mode it is played in, -1..1. */
function bowShape(u: number, turn: number, mode: number, set: BowSettings): number {
  if (mode === BOW_PLUCK)
    return bowPluckShape(u, set.position, set.brightness) * Math.sin(TWO_PI * turn)
  if (mode === BOW_SUSTAIN) return bowSustainShape(u, turn, bowOctaveShare(set.pressure))
  return bowSlipShape(u, turn, bowSlope(set.pressure))
}

/** How far apart a note's two strings lie at rest, in px: as far as they are tuned. */
const bowApart = (detune: number): number =>
  bowStrings(detune) === 2 ? 1.5 + (detune / 25) * 4.5 : 0

/** Where string `index` of a note tuned `detune` cents apart lies at rest. */
const bowRestY = (string: Box, index: number, detune: number): number =>
  string.y + (index - (bowStrings(detune) - 1) / 2) * bowApart(detune)

/**
 * What a note took from the knobs when it was struck. `BowedString::start`
 * reads Mode and Detune there and nowhere else, so a string that sounds keeps
 * the two it began with while the knobs move on to the next note's.
 */
interface BowStruck {
  id: number
  /** When it was struck, on the frame's clock. */
  born: number
  mode: number
  detune: number
  seen: boolean
}

interface BowState {
  /** The notes that are followed, and the one of each note of `frame.notes`, in its order. */
  tracks: BowStruck[]
  struck: BowStruck[]
}

/** Two notes with one id are one note when their strikes are this near; a key struck twice is further apart. */
const BOW_SAME_NOTE_SEC = 0.25

/**
 * Finds what each of `notes` was struck with, into `state.struck`. A note is
 * known again by its id and the moment of its strike; one not seen before
 * takes Mode and Detune as they stand on this frame, which is as near to its
 * strike as a display comes. Notes that are no longer sent are forgotten.
 */
function bowFollow(
  state: BowState,
  notes: readonly DisplayNote[],
  now: number,
  mode: number,
  detune: number,
): readonly BowStruck[] {
  const { tracks, struck } = state
  for (const track of tracks) track.seen = false
  struck.length = notes.length
  notes.forEach((note, index) => {
    const born = now - note.age
    let found: BowStruck | null = null
    for (const track of tracks) {
      if (track.seen || track.id !== note.id) continue
      const off = Math.abs(track.born - born)
      if (off < BOW_SAME_NOTE_SEC && (found === null || off < Math.abs(found.born - born)))
        found = track
    }
    if (found === null) {
      found = { id: note.id, born, mode, detune, seen: true }
      tracks.push(found)
    }
    found.born = born
    found.seen = true
    struck[index] = found
  })
  let kept = 0
  for (const track of tracks) if (track.seen) tracks[kept++] = track
  tracks.length = kept
  return struck
}

/** The path of a string: `shape(u)` times `high` off its rest, with the pick's corner as a point of its own. */
function bowStringPath(
  ctx: CanvasRenderingContext2D,
  string: Box,
  y: number,
  high: number,
  shape: (u: number) => number,
  corner: number | null,
): void {
  ctx.moveTo(string.x, y)
  for (let step = 1; step <= BOW_STEPS; step++) {
    const u = step / BOW_STEPS
    if (corner !== null && u > corner && u - 1 / BOW_STEPS < corner)
      ctx.lineTo(string.x + corner * string.w, y - high * shape(corner))
    ctx.lineTo(string.x + u * string.w, y - high * shape(u))
  }
}

const bow = plateDisplay<BowState>({
  place: 'window',
  columns: 2,
  params: [
    'mode',
    'attack',
    'release',
    'brightness',
    'decay',
    'position',
    'pressure',
    'body',
    'vibrato',
    'vibratoRate',
    'detune',
  ],
  live: { signal: true, notes: true },
  info: 'The string from bridge to nut with what plays it, its vibrato above, and a note’s life below: held, then let go, the dashed line its upper partials. A note lights the string and stands on that life. Drag the handle on the string for Position, the two below for Attack and Release.',
  init: () => ({ tracks: [], struck: [] }),
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const mode = clamp(Math.round(frame.value('mode')), 0, 2)
    const set: BowSettings = {
      position: clamp(frame.value('position'), 0.02, 0.5),
      pressure: clamp(frame.value('pressure'), 0, 1),
      brightness: clamp(frame.value('brightness'), 0, 1),
    }
    const attack = frame.value('attack')
    const decay = frame.value('decay')
    const release = frame.value('release')
    const vibrato = frame.value('vibrato')
    const rate = frame.value('vibratoRate')
    const detune = frame.value('detune')
    const parts = bowParts(frame, frame.value('body'))
    const { string, held, gone } = parts
    const driven = mode !== BOW_PLUCK
    const at = string.x + set.position * string.w
    const corner = mode === BOW_PLUCK ? set.position : null

    // The knobs draw the string as the next note will find it. A note that sounds is drawn in
    // the Mode and with the strings it was struck with.
    const notes = frame.notes
    const struck = bowFollow(frame.state, notes, frame.now, mode, detune)
    const dbAt = (index: number): number =>
      bowStringDb(
        struck[index].mode,
        notes[index].age,
        notes[index].released,
        notes[index].gain,
        attack,
        decay,
        release,
      )
    let said: DisplayNote | null = null
    for (let index = notes.length - 1; index >= 0 && said === null; index--)
      if (shareOfDb(dbAt(index)) >= DONE) said = notes[index]
    const hz = said ? said.frequency : BOW_REST_HZ

    // A note's life. Held: a driven string blooms and stays, a plucked one falls by Decay from the
    // pick on. Let go: either rings out. The dashed line is the partial near 2.5 kHz, where it
    // leaves the fundamental: Brightness is how long it rings.
    lifeGround(frame, parts, BOW_HELD_SPAN, BOW_GONE_SPAN)
    const after = bowRingSeconds(decay, release, true)
    const partialHeld = bowPartialSeconds(hz, decay, set.brightness, frame.sampleRate)
    const partialGone = bowPartialSeconds(hz, after, set.brightness, frame.sampleRate)
    if (!driven) {
      lifeLine(
        frame,
        held,
        BOW_HELD_SPAN,
        (t) => gainToDb(bowSwell(mode, t, attack)) - LIFE_DB * (t / partialHeld),
        INK.back,
        [2, 2],
      )
    }
    lifeLine(frame, gone, BOW_GONE_SPAN, (t) => -LIFE_DB * (t / partialGone), INK.back, [2, 2])
    lifeLine(
      frame,
      held,
      BOW_HELD_SPAN,
      (t) => bowStringDb(mode, t, null, 1, attack, decay, release),
      INK.trace,
    )
    lifeLine(frame, gone, BOW_GONE_SPAN, (t) => -LIFE_DB * (t / after), INK.trace)

    // The bridge the string stands on, at the left, and the nut.
    fillRect(ctx, { x: string.x - 3, y: string.y - 5, w: 3, h: 11 }, colours.ink, INK.text)
    fillRect(ctx, { x: string.x + string.w, y: string.y - 3, w: 2, h: 7 }, colours.ink, INK.text)

    // The string at rest, one or the two of a note with Detune as far apart as they are tuned, and
    // the shape it is thrown into: a pick's corner, a sustainer's loop and its octave, a bow's.
    for (let index = 0; index < bowStrings(detune); index++) {
      const y = bowRestY(string, index, detune)
      rule(ctx, string.x, y, string.x + string.w, y, { colour: colours.ink, alpha: INK.text })
    }
    const shapes: ((u: number) => number)[] =
      mode === BOW_SUSTAIN
        ? [
            (u) => (1 - bowOctaveShare(set.pressure)) * Math.sin(Math.PI * u),
            (u) => bowOctaveShare(set.pressure) * Math.sin(TWO_PI * u),
          ]
        : [(u) => bowShape(u, mode === BOW_PLUCK ? 0.25 : BOW_REST_TURN, mode, set)]
    for (const shape of shapes) {
      for (const side of [1, -1]) {
        ctx.beginPath()
        bowStringPath(ctx, string, string.y, string.h * side, shape, corner)
        ctx.globalAlpha = INK.fill * 0.6
        ctx.fillStyle = colours.ink
        ctx.fill()
        ctx.globalAlpha = INK.back
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.lineJoin = 'round'
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1

    // The strings that sound, the newest twelve: each swings as wide as it is loud. A note's two
    // strings start together and part at the rate they beat, which its age gives.
    let lit = 0
    let driving = 0
    for (let index = notes.length - 1; index >= 0 && lit < BOW_LIT_MOST; index--) {
      const note = notes[index]
      const share = shareOfDb(dbAt(index))
      if (share < DONE) continue
      lit++
      const own = struck[index]
      // The driver that is drawn is the knob's: it holds the notes that were struck under it.
      if (driven && own.mode === mode && note.released === null) driving = Math.max(driving, share)
      // A bow's corner goes round slowly enough to be followed; a loop swings as a harp's string does.
      const pace = own.mode === BOW_PLUCK || own.mode === BOW_SUSTAIN ? 2.75 : 0.9
      const turn = frame.now * (pace + ((note.frequency * 0.37) % 1)) + note.frequency * 0.01
      const high = string.h * Math.pow(share, 0.7)
      const ownCorner = own.mode === BOW_PLUCK ? set.position : null
      for (let s = 0; s < bowStrings(own.detune); s++) {
        const beat = s === 0 ? 0 : bowBeatHz(note.frequency, own.detune) * note.age
        ctx.beginPath()
        bowStringPath(
          ctx,
          string,
          bowRestY(string, s, own.detune),
          high,
          (u) => bowShape(u, turn + beat, own.mode, set),
          ownCorner,
        )
        ctx.globalAlpha = 1
        ctx.strokeStyle = colours.accent
        ctx.lineWidth = 1.5
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.stroke()
      }
      // The pick, for a moment.
      if (own.mode === BOW_PLUCK && note.age < 0.14)
        dot(ctx, at, string.y - high, 2.5, colours.accent, { alpha: 1 - note.age / 0.14 })
    }
    notes.forEach((note, index) => {
      const db = dbAt(index)
      if (shareOfDb(db) >= DONE) lifeMark(frame, parts, BOW_HELD_SPAN, BOW_GONE_SPAN, note, db)
    })
    lifeScale(frame, parts, BOW_HELD_SPAN)

    // What plays the string, where Position puts it: a pick over its corner, a sustainer that
    // comes nearer as it presses, a bow whose hair is as thick as its Pressure. A driver is in
    // the accent while it holds a note.
    const tool = driving > 0 ? colours.accent : colours.ink
    const toolAlpha = driving > 0 ? 1 : INK.text
    if (mode === BOW_PLUCK) {
      const tip = string.y - string.h - 1
      ctx.beginPath()
      ctx.moveTo(at, tip)
      ctx.lineTo(at - 3, tip - 6)
      ctx.lineTo(at + 3, tip - 6)
      ctx.closePath()
      ctx.globalAlpha = INK.text
      ctx.fillStyle = colours.ink
      ctx.fill()
    } else if (mode === BOW_SUSTAIN) {
      const under = string.y - 2.5 - (1 - set.pressure) * (string.h - 3)
      fillRect(ctx, { x: at - 6, y: under - 5, w: 12, h: 5 }, tool, toolAlpha)
      fillRect(ctx, { x: at - 4, y: under, w: 1.5, h: 2 }, tool, toolAlpha)
      fillRect(ctx, { x: at + 2.5, y: under, w: 1.5, h: 2 }, tool, toolAlpha)
    } else {
      ctx.beginPath()
      ctx.moveTo(at - 2.5, string.y - string.h - 4)
      ctx.lineTo(at + 2.5, string.y + string.h + 3)
      ctx.globalAlpha = toolAlpha
      ctx.strokeStyle = tool
      ctx.lineWidth = 1 + set.pressure * 3
      ctx.lineCap = 'butt'
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: how it is played, and its time (a plucked string's ring, a driven one's bloom).
    // Between them the vibrato of a note's first second and a half, as deep and as fast as it
    // is set, with the last note where it is in it.
    text(frame, BOW_MODES[mode], parts.main.x, parts.words)
    const seconds = secondsText(driven ? attack : decay)
    text(
      frame,
      said ? `${pitchName(said.frequency)} ${seconds}` : seconds,
      parts.main.x + parts.main.w,
      parts.words,
      { align: 'right' },
    )
    const wave: Box = { x: parts.main.x + 38, y: parts.words - 3, w: parts.main.w - 38 - 44, h: 4 }
    if (wave.w >= 16) {
      const yOf = (age: number): number =>
        wave.y - (bowVibratoCents(age, vibrato, rate) / BOW_VIBRATO_CENTS) * wave.h
      ctx.beginPath()
      ctx.moveTo(wave.x, wave.y)
      for (let px = 0.5; px <= wave.w; px += 0.5)
        ctx.lineTo(wave.x + px, yOf((px / wave.w) * BOW_VIBRATO_SHOWN))
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
      if (said) {
        const shown = Math.min(said.age, BOW_VIBRATO_SHOWN)
        dot(ctx, wave.x + (shown / BOW_VIBRATO_SHOWN) * wave.w, yOf(said.age), 2, colours.accent)
      }
    }

    for (const point of bowHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: bowHandles,
})

function bowHandles(view: DisplayView): DisplayHandle[] {
  const parts = bowParts(view, view.value('body'))
  const { string } = parts
  // A plucked string's swell is Attack less its least; a driven one's bloom is Attack.
  const least = Math.round(view.value('mode')) === BOW_PLUCK ? BOW_ATTACK_LEAST : 0
  return [
    {
      key: 'position',
      name: 'Position',
      x: string.x + clamp(view.value('position'), 0.02, 0.5) * string.w,
      y: string.y,
      drag: (toX) => ({ position: clamp((toX - string.x) / string.w, 0.02, 0.5) }),
      reset: () => ({ position: view.spec('position')?.default ?? 0.14 }),
    },
    ...lifeHandles(
      view,
      parts,
      BOW_HELD_SPAN,
      BOW_GONE_SPAN,
      (attack) => attack - least,
      (rise) => rise + least,
    ),
  ]
}

// --- Chamber Strings ---------------------------------------------------------

const CHAMBER_PLAYERS_MOST = 6
/** `chamber_strings.h`, `kSpreadCents`, `kSpreadCentsScatter`, `kStaggerSeconds`: what Scatter spreads. */
const CHAMBER_SPREAD_CENTS = 1
const CHAMBER_SPREAD_CENTS_SCATTER = 19
const CHAMBER_STAGGER_SECONDS = 0.08
/** `kAttackSpread`, `kReleaseSpread`: a player's attack is the knob times 1 ± this, their release 1 ± that. */
const CHAMBER_ATTACK_SPREAD = 0.3
const CHAMBER_RELEASE_SPREAD = 0.15
/** `kRiseShare`: the share of a player's S-shaped attack that lies between 10 % and 90 %, which is what Attack times. */
const CHAMBER_RISE_SHARE = 0.6084
/** `kVibratoHz`, `kVibratoHzRange`, `kVibratoDepth`, `kVibratoDelay`, `kVibratoDelayRange`, `kVibratoRiseSeconds`. */
const CHAMBER_VIBRATO_HZ = 5.3
const CHAMBER_VIBRATO_HZ_RANGE = 1
const CHAMBER_VIBRATO_DEPTH = 0.6
const CHAMBER_VIBRATO_DELAY = 0.15
const CHAMBER_VIBRATO_DELAY_RANGE = 0.25
const CHAMBER_VIBRATO_RISE = 0.5

/** One player of the section, as the picture seats them. */
export interface ChamberSeat {
  /** Across the image, -1 at the left to 1 at the right: `place` in `ChamberStrings::start`. */
  place: number
  /** Place in the pitch spread, -1..1: `Player::offset`. */
  pitch: number
  attackScale: number
  releaseScale: number
  /** How late they enter, as a share of the stagger Scatter sets; the first enters with the key. */
  wait: number
  vibratoHz: number
  /** Their share of the knob's depth. */
  vibratoDepth: number
  vibratoDelay: number
}

// The device draws lots for all of these but the seat at every note
// (`ChamberStrings::spread` hands out even steps of each range in a random
// order). The picture is of the section and not of one throw, so each seat
// here keeps one step of each range, in an order that does not change.
const CHAMBER_ORDERS = {
  pitch: [3, 0, 4, 1, 5, 2],
  attack: [1, 4, 0, 5, 2, 3],
  release: [2, 5, 1, 3, 0, 4],
  wait: [0, 3, 1, 4, 2, 5],
  rate: [4, 1, 5, 0, 3, 2],
  depth: [2, 4, 0, 3, 5, 1],
  delay: [5, 2, 3, 1, 0, 4],
} as const

/** The place of seat `p` in an order among `count` players: 0 for the first of them. */
function chamberRank(order: readonly number[], p: number, count: number): number {
  let rank = 0
  for (let q = 0; q < count; q++) if (order[q] < order[p]) rank++
  return rank
}

function chamberSeat(p: number, count: number): ChamberSeat {
  // `spread`: `count` values evenly over -1..1; one alone is exactly zero.
  const even = (order: readonly number[]): number =>
    (2 * chamberRank(order, p, count) + 1) / count - 1
  // A lot drawn from 0..1: the steps of that range, its middle for one player.
  const lot = (order: readonly number[]): number =>
    count > 1 ? chamberRank(order, p, count) / (count - 1) : 0.5
  return {
    place: (2 * p + 1) / count - 1,
    pitch: even(CHAMBER_ORDERS.pitch),
    attackScale: 1 + CHAMBER_ATTACK_SPREAD * even(CHAMBER_ORDERS.attack),
    releaseScale: 1 + CHAMBER_RELEASE_SPREAD * even(CHAMBER_ORDERS.release),
    wait: chamberRank(CHAMBER_ORDERS.wait, p, count) / count,
    vibratoHz: CHAMBER_VIBRATO_HZ + CHAMBER_VIBRATO_HZ_RANGE * lot(CHAMBER_ORDERS.rate),
    vibratoDepth: lerp(CHAMBER_VIBRATO_DEPTH, 1, lot(CHAMBER_ORDERS.depth)),
    vibratoDelay: CHAMBER_VIBRATO_DELAY + CHAMBER_VIBRATO_DELAY_RANGE * lot(CHAMBER_ORDERS.delay),
  }
}

/** The seats of a section of one to six, made once. */
const CHAMBER_SEATS: readonly (readonly ChamberSeat[])[] = Array.from(
  { length: CHAMBER_PLAYERS_MOST + 1 },
  (_, count) => Array.from({ length: count }, (__, p) => chamberSeat(p, count)),
)

/** The players of a section as the picture seats them. */
export function chamberSeats(players: number): readonly ChamberSeat[] {
  return CHAMBER_SEATS[clamp(Math.round(players), 1, CHAMBER_PLAYERS_MOST)]
}

/** `ChamberStrings::start`: how loud a note is, from its gain. */
export const chamberVelocity = (gain: number): number => 0.25 + 0.75 * clamp(gain, 0, 1)

/** `ChamberStrings::control`: cents the players' fixed pitches spread either side of the note. */
export const chamberSpreadCents = (scatter: number): number =>
  CHAMBER_SPREAD_CENTS + CHAMBER_SPREAD_CENTS_SCATTER * scatter

/** `ChamberStrings::start`: seconds within which the players enter. */
export const chamberStagger = (scatter: number): number => CHAMBER_STAGGER_SECONDS * scatter

/**
 * `ChamberStrings::control`, `kRising`: a player's level `seconds` after they
 * enter. The attack is an S-curve that is done after Attack over 0.6084, so
 * that Attack is the time from a tenth of the level to nine tenths.
 */
export function chamberRise(seconds: number, attack: number, scale = 1): number {
  const rise = clamp((seconds * CHAMBER_RISE_SHARE) / (attack * scale), 0, 1)
  return rise * rise * (3 - 2 * rise)
}

/**
 * One player's level in a note, 0..1: the key went down `age` seconds ago and
 * up `released` seconds ago (null while held). They enter after their share
 * of the stagger and rise at their own pace; from the key up they fall 60 dB
 * over Release times their own scale (`kFalling`: the level times
 * 1 - 6.908 dt / release at every tick, which is that fall to within a
 * fortieth). A player who had not entered at the key up never does
 * (`ChamberStrings::release`).
 */
export function chamberPlayerLevel(
  seat: ChamberSeat,
  age: number,
  released: number | null,
  attack: number,
  release: number,
  scatter: number,
): number {
  const after = released === null ? 0 : Math.min(released, age)
  const bowed = age - after - seat.wait * chamberStagger(scatter)
  if (bowed <= 0) return 0
  return (
    chamberRise(bowed, attack, seat.attackScale) *
    Math.exp((-SIXTY_DB * after) / (release * seat.releaseScale))
  )
}

/** `Voice::envelope`: the mean of the players' levels, which is the note's own. */
export function chamberNoteLevel(
  players: number,
  age: number,
  released: number | null,
  attack: number,
  release: number,
  scatter: number,
): number {
  const seats = chamberSeats(players)
  let sum = 0
  for (const seat of seats) sum += chamberPlayerLevel(seat, age, released, attack, release, scatter)
  return sum / seats.length
}

/**
 * `ChamberStrings::control`: the bow's hiss under a note, against its level
 * at full. It follows the root of the note's envelope, so it leads a slow
 * attack, and from the key up it leaves with the tone.
 */
export function chamberHiss(
  players: number,
  age: number,
  released: number | null,
  attack: number,
  release: number,
  scatter: number,
): number {
  const level = chamberNoteLevel(players, age, released, attack, release, scatter)
  if (released === null) return Math.sqrt(level)
  const held = Math.max(age - released, 0)
  const atKeyUp = chamberNoteLevel(players, held, null, attack, release, scatter)
  return atKeyUp > 1e-4 ? level / Math.sqrt(atKeyUp) : 0
}

/** `ChamberStrings::control`: how much of a player's vibrato is there `seconds` after they enter. */
export function chamberVibratoOnset(seconds: number, delay: number): number {
  const onset = clamp((seconds - delay) / CHAMBER_VIBRATO_RISE, 0, 1)
  return onset * onset * (3 - 2 * onset)
}

/** The spans of the section's life: the slowest player's attack is done after 12.8 s, the longest release after 9.2. */
const CHAMBER_HELD_SPAN = 13
const CHAMBER_GONE_SPAN = 10
/** The stretch of a player's vibrato that their string is drawn along. */
const CHAMBER_VIBRATO_SHOWN = 0.6
/** How far a string swings at a vibrato of 40 cents, and how far a player stands off the row at 20 cents of spread, in px. */
const CHAMBER_VIBRATO_PX = 3
const CHAMBER_RAGGED_PX = 3
/** Where the bow meets the string, as a share of its length from the bridge: over the fingerboard, and at the bridge. */
const CHAMBER_BOW_TASTO = 0.42
const CHAMBER_BOW_BRIDGE = 0.1
/** The pitches a finger's place on the string spans, scroll to half way down: five octaves from C2. */
const CHAMBER_FINGER_LOW_HZ = 65.41
const CHAMBER_FINGER_OCTAVES = 5
/** The specks of hiss about a bow at an Air of 1, across the bow and off it, in shares of its half length and in px. */
const CHAMBER_SPECKS: readonly (readonly [number, number])[] = [
  [-0.7, -3],
  [0.5, 3.5],
  [-0.15, 4],
  [0.9, -3.5],
  [-1, 3],
  [0.2, -4.5],
]
/** The steps a player's string is drawn in. */
const CHAMBER_STEPS = 20

interface ChamberParts extends Stage {
  /** The middle of the row, and how far the outer seats could stand from it. */
  centre: number
  reach: number
  /** A string's ends before the player's own place in the row: the scroll and the bridge. */
  scroll: number
  bridge: number
}

function chamberParts(view: Size): ChamberParts {
  const stage = stageOf(view, 20, 4)
  return {
    ...stage,
    centre: stage.main.x + stage.main.w / 2,
    reach: stage.main.w / 2 - 2,
    scroll: stage.main.y + 6,
    bridge: stage.main.y + stage.main.h - 3,
  }
}

interface ChamberPlace {
  x: number
  scroll: number
  bridge: number
  /** Half the bow's length. */
  bow: number
}

/** Where a player stands: Width spreads the seats from a huddle in the middle, Scatter roughens the row by their pitch. */
function chamberPlace(
  parts: ChamberParts,
  seat: ChamberSeat,
  count: number,
  width: number,
  scatter: number,
  into: ChamberPlace,
): ChamberPlace {
  const spread = lerp(0.25, 1, clamp(width, 0, 1))
  const off = seat.pitch * CHAMBER_RAGGED_PX * (chamberSpreadCents(scatter) / 20)
  into.x = parts.centre + seat.place * parts.reach * spread
  into.scroll = parts.scroll + off
  into.bridge = parts.bridge + off
  into.bow = clamp((parts.reach * spread) / count - 1.5, 4, 9)
  return into
}

/** Where the bow meets a string that runs from `bridge` up to `scroll`. */
const chamberBowY = (place: ChamberPlace, bow: number): number =>
  place.bridge -
  (place.bridge - place.scroll) * lerp(CHAMBER_BOW_TASTO, CHAMBER_BOW_BRIDGE, clamp(bow, 0, 1))

/**
 * A player's string as their vibrato bends it: `v` runs from the bridge to the
 * scroll, and along it lie 0.6 s of a waver at their own rate, as wide as
 * their share of the knob's depth. It is a shape, not a moment: when the
 * waver stands where is not known.
 */
function chamberStringX(place: ChamberPlace, seat: ChamberSeat, v: number, cents: number): number {
  return (
    place.x +
    (cents / 40) *
      CHAMBER_VIBRATO_PX *
      seat.vibratoDepth *
      Math.sin(Math.PI * v) *
      Math.sin(TWO_PI * seat.vibratoHz * CHAMBER_VIBRATO_SHOWN * v)
  )
}

function chamberStringPath(
  ctx: CanvasRenderingContext2D,
  place: ChamberPlace,
  seat: ChamberSeat,
  cents: number,
): void {
  ctx.beginPath()
  ctx.moveTo(place.x, place.bridge)
  for (let step = 1; step <= CHAMBER_STEPS; step++) {
    const v = step / CHAMBER_STEPS
    ctx.lineTo(
      chamberStringX(place, seat, v, cents),
      place.bridge - v * (place.bridge - place.scroll),
    )
  }
}

/** A finger's place on the string for a pitch, as a share of its length from the bridge. */
const chamberFinger = (hz: number): number =>
  lerp(
    1,
    0.5,
    clamp(Math.log2(Math.max(hz, 1) / CHAMBER_FINGER_LOW_HZ) / CHAMBER_FINGER_OCTAVES, 0, 1),
  )

const chamber = plateDisplay<ChamberPlace>({
  place: 'window',
  columns: 2,
  params: ['players', 'attack', 'release', 'bow', 'air', 'vibrato', 'mute', 'scatter', 'width'],
  live: { signal: true, notes: true },
  info: 'The players in their seats, each a string with a bow across it: a bent string is its vibrato, a block on the bridge the mute, specks the hiss. Below, each player’s own swell and fall. A note lights them as they come in, with a dot where it is fingered.',
  init: () => ({ x: 0, scroll: 0, bridge: 0, bow: 0 }),
  draw(frame) {
    const { ctx, colours, state: place } = frame
    ground(frame)
    const seats = chamberSeats(frame.value('players'))
    const count = seats.length
    const attack = frame.value('attack')
    const release = frame.value('release')
    const bow = frame.value('bow')
    const air = clamp(frame.value('air'), 0, 1)
    const vibrato = frame.value('vibrato')
    const mute = clamp(frame.value('mute'), 0, 1)
    const scatter = clamp(frame.value('scatter'), 0, 1)
    const width = frame.value('width')
    const parts = chamberParts(frame)
    const { held, gone } = parts
    const stagger = chamberStagger(scatter)
    const specks = Math.round(air * CHAMBER_SPECKS.length)

    const notes = frame.notes
    const levelOf = (note: DisplayNote): number =>
      chamberVelocity(note.gain) *
      chamberNoteLevel(count, note.age, note.released, attack, release, scatter)
    const said = lastSounding(notes, (note) => shareOfDb(gainToDb(levelOf(note))) >= DONE)

    // A note's life, one line for each player: they come in one after another within the stagger
    // Scatter sets, each rises and falls a little faster or slower than the knobs say.
    lifeGround(frame, parts, CHAMBER_HELD_SPAN, CHAMBER_GONE_SPAN)
    // One line alone is drawn in full; the lines of a section lie over one another and add up.
    const bundle = count === 1 ? INK.trace : 0.6
    for (const seat of seats) {
      lifeLine(
        frame,
        held,
        CHAMBER_HELD_SPAN,
        (t) => gainToDb(chamberRise(t - seat.wait * stagger, attack, seat.attackScale)),
        bundle,
      )
      lifeLine(
        frame,
        gone,
        CHAMBER_GONE_SPAN,
        (t) => -LIFE_DB * (t / (release * seat.releaseScale)),
        bundle,
      )
    }

    // The hiss of the bows: as strong as the loudest note has it.
    let hiss = 0
    for (const note of notes) {
      const level =
        chamberVelocity(note.gain) *
        chamberHiss(count, note.age, note.released, attack, release, scatter)
      hiss = Math.max(hiss, shareOfDb(gainToDb(level)))
    }

    for (const seat of seats) {
      chamberPlace(parts, seat, count, width, scatter, place)
      const long = place.bridge - place.scroll
      const bowY = chamberBowY(place, bow)

      // The player at rest: the string as their vibrato bends it, its scroll and its bridge, the
      // mute on the bridge as high as there is of it, the bow where Bow puts it and its hiss.
      // The wooden body under the string, so that a player is an instrument and not a mark.
      ctx.beginPath()
      ctx.arc(place.x, place.bridge - long * 0.44, 3.5, 0, TWO_PI)
      ctx.moveTo(place.x + 5, place.bridge - long * 0.17)
      ctx.arc(place.x, place.bridge - long * 0.17, 5, 0, TWO_PI)
      ctx.globalAlpha = INK.fill
      ctx.fillStyle = colours.ink
      ctx.fill()
      chamberStringPath(ctx, place, seat, vibrato)
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
      dot(ctx, place.x, place.scroll, 1.5, colours.ink, { alpha: INK.text })
      rule(ctx, place.x - 4.5, place.bridge, place.x + 4.5, place.bridge, {
        colour: colours.ink,
        alpha: INK.text,
        width: 2,
      })
      if (mute > 0) {
        const high = 1 + mute * 3
        fillRect(
          ctx,
          { x: place.x - 3, y: place.bridge - 1 - high, w: 6, h: high },
          colours.ink,
          INK.text,
        )
      }
      rule(ctx, place.x - place.bow, bowY + 1, place.x + place.bow, bowY - 1, {
        colour: colours.ink,
        alpha: INK.text,
        width: 1.5,
      })
      for (let speck = 0; speck < specks; speck++) {
        const [across, off] = CHAMBER_SPECKS[speck]
        dot(ctx, place.x + across * place.bow, bowY + off, 0.8, colours.ink, { alpha: INK.back })
        if (hiss >= DONE)
          dot(ctx, place.x + across * place.bow, bowY + off, 1.1, colours.accent, { alpha: hiss })
      }

      // What this player sounds: of every note, their own level in it. The loudest lights the
      // string, bent as far as their vibrato has come in since they entered, and the bow.
      let most = 0
      let onset = 0
      for (const note of notes) {
        const level =
          chamberVelocity(note.gain) *
          chamberPlayerLevel(seat, note.age, note.released, attack, release, scatter)
        const share = shareOfDb(gainToDb(level))
        if (share < DONE || share <= most) continue
        most = share
        onset = chamberVibratoOnset(note.age - seat.wait * stagger, seat.vibratoDelay)
      }
      if (most < DONE) continue
      chamberStringPath(ctx, place, seat, vibrato * onset)
      ctx.globalAlpha = 1
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 0.75 + 2 * most
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
      rule(ctx, place.x - place.bow, bowY + 1, place.x + place.bow, bowY - 1, {
        colour: colours.accent,
        alpha: 0.3 + 0.7 * most,
        width: 2,
      })
      // Every note they play has its finger on the string: higher is nearer the bridge.
      for (const note of notes) {
        const level =
          chamberVelocity(note.gain) *
          chamberPlayerLevel(seat, note.age, note.released, attack, release, scatter)
        const share = shareOfDb(gainToDb(level))
        if (share < DONE) continue
        const v = chamberFinger(note.frequency)
        dot(
          ctx,
          chamberStringX(place, seat, v, vibrato * onset),
          place.bridge - v * long,
          1.25 + share,
          colours.accent,
          { ring: colours.plate },
        )
      }
    }

    for (const note of notes) {
      const db = gainToDb(levelOf(note))
      if (shareOfDb(db) >= DONE)
        lifeMark(frame, parts, CHAMBER_HELD_SPAN, CHAMBER_GONE_SPAN, note, db)
    }
    lifeScale(frame, parts, CHAMBER_HELD_SPAN)

    levelFoot(frame, parts.foot, outShare(frame))

    // The words: how many play, and how long their bows take to speak.
    text(frame, count === 1 ? 'Solo' : `${count} players`, parts.main.x, parts.words)
    const seconds = secondsText(attack)
    text(
      frame,
      said ? `${pitchName(said.frequency)} ${seconds}` : seconds,
      parts.main.x + parts.main.w,
      parts.words,
      { align: 'right' },
    )

    for (const point of chamberHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: chamberHandles,
})

function chamberHandles(view: DisplayView): DisplayHandle[] {
  const parts = chamberParts(view)
  const seats = chamberSeats(view.value('players'))
  // The bow that is taken is the first player's, at the left.
  const place = chamberPlace(
    parts,
    seats[0],
    seats.length,
    view.value('width'),
    clamp(view.value('scatter'), 0, 1),
    { x: 0, scroll: 0, bridge: 0, bow: 0 },
  )
  const long = place.bridge - place.scroll
  return [
    {
      key: 'bow',
      name: 'Bow',
      x: place.x,
      y: chamberBowY(place, view.value('bow')),
      drag: (_x, toY) => ({
        bow: clamp(
          (CHAMBER_BOW_TASTO - (place.bridge - toY) / long) /
            (CHAMBER_BOW_TASTO - CHAMBER_BOW_BRIDGE),
          0,
          1,
        ),
      }),
      reset: () => ({ bow: view.spec('bow')?.default ?? 0.4 }),
    },
    ...lifeHandles(
      view,
      parts,
      CHAMBER_HELD_SPAN,
      CHAMBER_GONE_SPAN,
      // A player at the knob's own pace is at full level after Attack over 0.6084.
      (attack) => attack / CHAMBER_RISE_SHARE,
      (rise) => rise * CHAMBER_RISE_SHARE,
    ),
  ]
}

// --- String Machine ----------------------------------------------------------

/** `string_machine.h`: the three sawtooths of a key, by their old organ names, and their pitch against the key's. */
const MACHINE_RANKS = [
  { name: '4′', ratio: 2 },
  { name: '8′', ratio: 1 },
  { name: '16′', ratio: 0.5 },
] as const
/** `string_machine.h`: the Q of the tone filter, and the fixed high-pass after it. */
const MACHINE_TONE_Q = 0.6
const MACHINE_RUMBLE_HZ = 90
/** `kChorusBaseSeconds`, `kSlowDepthSeconds`, `kFastDepthSeconds`, in ms; the two sweeps' rates at a Speed of 1. */
const MACHINE_CHORUS_MS = 6
const MACHINE_SLOW_MS = 1.2
const MACHINE_FAST_MS = 0.18
const MACHINE_SLOW_HZ = 0.6
const MACHINE_FAST_HZ = 6
/** `kMaxDriftCents`. */
const MACHINE_DRIFT_CENTS = 9

/** `StringMachine::note_on`: how loud a key is, from the note's gain. */
export const machineKeyGain = (gain: number): number => 0.35 + 0.65 * clamp(gain, 0, 1)

/**
 * How loud a key is, in dB under a full one: pressed `age` seconds ago, let
 * go `released` seconds ago (null while held). `Adsr` with no decay: it comes
 * in over Attack, stays, and falls 60 dB over Release.
 */
export function machineKeyDb(
  age: number,
  released: number | null,
  gain: number,
  attack: number,
  release: number,
): number {
  const after = released === null ? 0 : Math.min(released, age)
  return (
    gainToDb(machineKeyGain(gain) * adsrRise(age - after, attack)) - LIFE_DB * (after / release)
  )
}

/**
 * What the shared filters do to a frequency, written into `into` as a real
 * and an imaginary part: `kit::Svf::lowpass` at Tone with a Q of 0.6 (a
 * trapezoidal filter is its analogue prototype on a frequency axis warped by
 * the tangent), then the one-pole high-pass at 90 Hz.
 */
function machineTone(hz: number, tone: number, sampleRate: number, into: Float32Array): void {
  const w = (Math.PI * Math.min(hz, 0.49 * sampleRate)) / sampleRate
  const x = Math.tan(w) / Math.tan((Math.PI * clamp(tone, 5, 0.49 * sampleRate)) / sampleRate)
  // The low-pass, 1 / (1 - x² + j x / Q).
  const d = 1 - x * x
  const e = x / MACHINE_TONE_Q
  const lowRe = d / (d * d + e * e)
  const lowIm = -e / (d * d + e * e)
  // The high-pass, 1 - (1 - a) / (1 - a e^-jω).
  const a = Math.exp((-TWO_PI * MACHINE_RUMBLE_HZ) / sampleRate)
  const denRe = 1 - a * Math.cos(2 * w)
  const denIm = a * Math.sin(2 * w)
  const pole = (1 - a) / (denRe * denRe + denIm * denIm)
  const highRe = 1 - pole * denRe
  const highIm = pole * denIm
  into[0] = lowRe * highRe - lowIm * highIm
  into[1] = lowRe * highIm + lowIm * highRe
}

const machineScratch = new Float32Array(2)

/** What the tone filter and the high-pass leave of a frequency, in dB. */
export function machineToneDb(hz: number, tone: number, sampleRate = 48000): number {
  machineTone(hz, tone, sampleRate, machineScratch)
  return gainToDb(Math.hypot(machineScratch[0], machineScratch[1]))
}

/**
 * `StringMachine::process`: the delay of one of the ensemble's three lines in
 * ms, `seconds` into a sweep that starts where the device's does. The lines
 * stand a third of a cycle apart, in the slow sweep and in the fast one.
 */
export function machineChorusMs(line: number, seconds: number, speed: number): number {
  const offset = line / 3
  return (
    MACHINE_CHORUS_MS +
    MACHINE_SLOW_MS * Math.sin(TWO_PI * (MACHINE_SLOW_HZ * speed * seconds + offset)) +
    MACHINE_FAST_MS * Math.sin(TWO_PI * (MACHINE_FAST_HZ * speed * seconds + offset))
  )
}

/** `StringMachine::control`: the cents a key wanders either side of its pitch. */
export const machineDriftCents = (drift: number): number => MACHINE_DRIFT_CENTS * drift

/** The spans of a key's life: Attack goes to 8 s, Release to 12. */
const MACHINE_HELD_SPAN = 8
const MACHINE_GONE_SPAN = 12
/** The pitch the ranks are drawn at while no key sounds: middle C. */
const MACHINE_REST_HZ = 261.63
/** The points one cycle of a rank is kept in, and the partials it is summed from at most. */
const MACHINE_POINTS = 64
const MACHINE_PARTIALS = 48
/** The stretch of the ensemble's sweep that is drawn, in seconds. */
const MACHINE_SWEEP_SHOWN = 2
/** How far a line of the ensemble moves for a ms of delay, and how far Width parts two lines, in px. */
const MACHINE_PX_PER_MS = 8.5
const MACHINE_WIDTH_PX = 8
/** How far a rank's shadow stands off it at the full 9 cents of Drift, in px. */
const MACHINE_DRIFT_PX = 3.5

/**
 * One cycle of each rank as the filters leave it, for a key at `hz`: a rising
 * sawtooth's partials (1/n, alternating), each with the loss and the lag the
 * tone filter and the high-pass give it. Written into `into`, a cycle per rank.
 */
function machineCycles(into: Float32Array, hz: number, tone: number, sampleRate: number): void {
  MACHINE_RANKS.forEach((rank, index) => {
    const base = index * MACHINE_POINTS
    into.fill(0, base, base + MACHINE_POINTS)
    const f = hz * rank.ratio
    const partials = clamp(Math.floor((0.45 * sampleRate) / f), 1, MACHINE_PARTIALS)
    for (let n = 1; n <= partials; n++) {
      machineTone(n * f, tone, sampleRate, machineScratch)
      const size = (-2 / Math.PI / n) * Math.hypot(machineScratch[0], machineScratch[1])
      const lag = Math.atan2(machineScratch[1], machineScratch[0])
      for (let i = 0; i < MACHINE_POINTS; i++)
        into[base + i] += size * Math.sin((TWO_PI * n * i) / MACHINE_POINTS + lag)
    }
  })
}

/** A rank's kept cycle at `phase` cycles, read between two points. */
function machineRead(cycles: Float32Array, rank: number, phase: number): number {
  const at = (phase - Math.floor(phase)) * MACHINE_POINTS
  const first = Math.floor(at)
  const base = rank * MACHINE_POINTS
  return lerp(
    cycles[base + (first % MACHINE_POINTS)],
    cycles[base + ((first + 1) % MACHINE_POINTS)],
    at - first,
  )
}

interface MachineState {
  /** The ranks' cycles at rest and for the key that sounds, and what each was made for. */
  rest: Float32Array
  lit: Float32Array
  restFor: [number, number, number]
  litFor: [number, number, number]
}

interface MachineParts extends Stage {
  /** The three ranks, one above the other, with their names at the left. */
  ranks: Box
  /** The ensemble's lines over time. */
  sweep: Box
}

function machineParts(view: Size): MachineParts {
  const stage = stageOf(view, 20, 4)
  const { main } = stage
  const ranksWide = Math.floor(main.w * 0.52)
  return {
    ...stage,
    ranks: { x: main.x, y: main.y + 1, w: ranksWide, h: main.h - 1 },
    sweep: { x: main.x + ranksWide + 8, y: main.y + 1, w: main.w - ranksWide - 8, h: main.h - 1 },
  }
}

/** Room for a rank's name at the left of its row. */
const MACHINE_NAME_ROOM = 16

/** The path of one rank across its row: `high` px at a full sawtooth, `shift` px to the right. */
function machineRankPath(
  ctx: CanvasRenderingContext2D,
  cycles: Float32Array,
  rank: number,
  box: Box,
  centre: number,
  high: number,
  shown: number,
  shift: number,
): void {
  const from = box.x + MACHINE_NAME_ROOM
  const wide = box.w - MACHINE_NAME_ROOM
  ctx.beginPath()
  for (let px = 0; px <= wide; px++) {
    const phase = ((px - shift) / wide) * shown * MACHINE_RANKS[rank].ratio * 2
    const y = centre - high * machineRead(cycles, rank, phase)
    if (px === 0) ctx.moveTo(from + px, y)
    else ctx.lineTo(from + px, y)
  }
}

const machine = plateDisplay<MachineState>({
  place: 'window',
  columns: 2,
  params: ['attack', 'release', 'low', 'high', 'tone', 'ensemble', 'speed', 'drift', 'width'],
  live: { signal: true, notes: true },
  info: 'The three sawtooths of a key, an octave apart, each as tall as its level and as round as Tone leaves it, beside two seconds of the ensemble’s three delay lines. Below, a key’s swell and fall. A key lights the ranks at its own pitch and stands on that life. Drag the handles for Attack and Release.',
  init: () => ({
    rest: new Float32Array(MACHINE_RANKS.length * MACHINE_POINTS),
    lit: new Float32Array(MACHINE_RANKS.length * MACHINE_POINTS),
    restFor: [0, 0, 0],
    litFor: [0, 0, 0],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const attack = frame.value('attack')
    const release = frame.value('release')
    const tone = frame.value('tone')
    const ensemble = clamp(frame.value('ensemble'), 0, 1)
    const speed = frame.value('speed')
    const drift = clamp(frame.value('drift'), 0, 1)
    const width = clamp(frame.value('width'), 0, 1)
    // `StringMachine::process`: the 8′ is always there, Cello adds the 16′ and Violin the 4′.
    const levels = [clamp(frame.value('high'), 0, 1), 1, clamp(frame.value('low'), 0, 1)]
    const parts = machineParts(frame)
    const { ranks, sweep, held, gone } = parts

    const notes = frame.notes
    const dbOf = (note: DisplayNote): number =>
      machineKeyDb(note.age, note.released, note.gain, attack, release)
    const said = lastSounding(notes, (note) => shareOfDb(dbOf(note)) >= DONE)

    // A key's life: in over Attack, held, out over Release.
    lifeGround(frame, parts, MACHINE_HELD_SPAN, MACHINE_GONE_SPAN)
    for (const [box, span, db] of [
      [held, MACHINE_HELD_SPAN, (t: number) => gainToDb(adsrRise(t, attack))],
      [gone, MACHINE_GONE_SPAN, (t: number) => -LIFE_DB * (t / release)],
    ] as const) {
      lifePath(ctx, box, span, db)
      ctx.lineTo(box.x + box.w, box.y + box.h)
      ctx.lineTo(box.x, box.y + box.h)
      ctx.closePath()
      ctx.globalAlpha = INK.fill
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
      lifeLine(frame, box, span, db, INK.trace)
    }

    // The ranks at rest, for middle C. They are made again only when Tone moves.
    if (
      state.restFor[0] !== MACHINE_REST_HZ ||
      state.restFor[1] !== tone ||
      state.restFor[2] !== frame.sampleRate
    ) {
      machineCycles(state.rest, MACHINE_REST_HZ, tone, frame.sampleRate)
      state.restFor[0] = MACHINE_REST_HZ
      state.restFor[1] = tone
      state.restFor[2] = frame.sampleRate
    }
    const rowHigh = ranks.h / MACHINE_RANKS.length
    const toothHigh = (rowHigh / 2 - 1.5) * 0.85
    // Two cycles of the 16′ where there is room, so that the 4′ has eight teeth; one where there is not.
    const shown = ranks.w - MACHINE_NAME_ROOM >= 60 ? 2 : 1
    const share = said ? shareOfDb(dbOf(said)) : 0
    if (said) {
      if (
        state.litFor[0] !== said.frequency ||
        state.litFor[1] !== tone ||
        state.litFor[2] !== frame.sampleRate
      ) {
        machineCycles(state.lit, said.frequency, tone, frame.sampleRate)
        state.litFor[0] = said.frequency
        state.litFor[1] = tone
        state.litFor[2] = frame.sampleRate
      }
    }
    MACHINE_RANKS.forEach((rank, index) => {
      const centre = ranks.y + rowHigh * (index + 0.5)
      const high = toothHigh * levels[index]
      text(frame, rank.name, ranks.x, centre + 3)
      // Drift: every key wanders off its pitch on its own, so the teeth of two keys slide apart.
      // The shadows either side stand as far off as the keys wander at most.
      const off = (machineDriftCents(drift) / MACHINE_DRIFT_CENTS) * MACHINE_DRIFT_PX
      if (off > 0 && high > 0) {
        for (const side of [-1, 1]) {
          machineRankPath(ctx, state.rest, index, ranks, centre, high, shown, side * off)
          ctx.globalAlpha = INK.rule
          ctx.strokeStyle = colours.ink
          ctx.lineWidth = 1
          ctx.lineJoin = 'round'
          ctx.stroke()
        }
      }
      machineRankPath(ctx, state.rest, index, ranks, centre, high, shown, 0)
      ctx.globalAlpha = high > 0 ? INK.trace : INK.rule
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
      // The key that sounds: the same rank at its pitch, as tall as it is loud.
      if (said && high > 0) {
        machineRankPath(ctx, state.lit, index, ranks, centre, high * Math.pow(share, 0.7), shown, 0)
        ctx.strokeStyle = colours.accent
        ctx.lineWidth = 1.75
        ctx.lineJoin = 'round'
        ctx.stroke()
      }
    })

    // The ensemble: the dry line, and the three delay lines swept a third of a cycle apart, a
    // slow swell with a quick shimmer on it. Ensemble fades from the one to the others; Width
    // parts the lines, the first to the left side and the third to the right. The sweeps run
    // freely in the device, so this is their shape over two seconds and not where they are now.
    const middle = sweep.y + sweep.h / 2
    rule(ctx, sweep.x, middle, sweep.x + sweep.w, middle, {
      colour: colours.ink,
      alpha: lerp(INK.trace, INK.grid, ensemble),
    })
    for (let line = 0; line < 3; line++) {
      const centre = middle + (line - 1) * width * MACHINE_WIDTH_PX
      ctx.beginPath()
      for (let px = 0; px <= sweep.w; px += 0.5) {
        const ms = machineChorusMs(line, (px / sweep.w) * MACHINE_SWEEP_SHOWN, speed)
        const y = centre - (ms - MACHINE_CHORUS_MS) * MACHINE_PX_PER_MS
        if (px === 0) ctx.moveTo(sweep.x + px, y)
        else ctx.lineTo(sweep.x + px, y)
      }
      ctx.globalAlpha = lerp(INK.grid, INK.trace, ensemble)
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1.25
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    for (const note of notes) {
      const db = dbOf(note)
      if (shareOfDb(db) >= DONE)
        lifeMark(frame, parts, MACHINE_HELD_SPAN, MACHINE_GONE_SPAN, note, db)
    }
    lifeScale(frame, parts, MACHINE_HELD_SPAN)

    levelFoot(frame, parts.foot, outShare(frame))

    // The words, each over its own half: where Tone cuts, and how fast the ensemble's slow sweep turns.
    text(
      frame,
      said ? `${pitchName(said.frequency)} ${hzText(tone)}` : hzText(tone),
      parts.main.x,
      parts.words,
    )
    const turns = MACHINE_SLOW_HZ * speed
    text(
      frame,
      `${turns.toFixed(turns < 1 ? 2 : 1)} Hz`,
      parts.main.x + parts.main.w,
      parts.words,
      { align: 'right' },
    )

    for (const point of machineHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: machineHandles,
})

function machineHandles(view: DisplayView): DisplayHandle[] {
  return lifeHandles(
    view,
    machineParts(view),
    MACHINE_HELD_SPAN,
    MACHINE_GONE_SPAN,
    (attack) => attack,
    (rise) => rise,
  )
}

export const BOWED_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'bowed-string': {
    display: bow,
    face: ['mode', 'attack', 'position', 'pressure'],
    labels: { brightness: 'Bright', vibratoRate: 'Vib Rate' },
  },
  'chamber-strings': { display: chamber, face: ['players', 'attack', 'release', 'bow'] },
  'string-machine': { display: machine, face: ['low', 'high', 'tone', 'ensemble'] },
}
