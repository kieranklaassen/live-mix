// Displays of the devices that break a sound into pieces or hold it: the pieces, and what becomes of them.
//
// Each one is the device's own sentence drawn. Where the picture needs what
// only the device knows (which grain it just opened, which slice it is
// repeating, how much it holds), the device reports it through display meters
// and the display keeps the last seconds of that in its state. While no
// reading has come (no sound yet, switched off) each shows a worked example
// of the same thing from the settings alone, without motion.

import {
  History,
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dot,
  fillBetween,
  fillRect,
  fillTo,
  follow,
  freqGrid,
  gainToDb,
  ground,
  handle,
  hzOfX,
  hzText,
  lerp,
  responsePoints,
  rule,
  text,
  trace,
  xOfHz,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- Holds ------------------------------------------------------------------
//
// Sustain and Pad Follower: the level that is played against the level that
// is held, over the last seconds, so the hold is seen to carry on after the
// playing stops. The mark is now; right of it, dashed, is how the hold would
// die away from here if the playing stopped, at the device's own rate.

/** How much of the past a hold display keeps, and where in it now stands. */
const HOLD_PAST_SEC = 8
const HOLD_NOW_AT = 0.8
/** Points across a trace: the slots of the history, and as many across a worked example. */
const HOLD_POINTS = 96

/** A point that is written again on every frame, so a trace makes no new ones. */
type Spot = [number, number]
const spots = (count: number): Spot[] => Array.from({ length: count }, (): Spot => [0, 0])

interface HoldState {
  /** The level played and the level held, dB. */
  played: History
  held: History
  /** When a reading last had sound in it; null before the first. */
  heardAt: number | null
  /** A worked example, the played level then the held one, and the settings it was made from. */
  example: Float32Array
  exampleOf: string
  /** Sustain: when each of the last layers was caught, and the count then. */
  catches: Float64Array
  caught: number | null
  /** The picture's three lines: what is played, what is held, and the higher of the two. */
  playedLine: Spot[]
  heldLine: Spot[]
  overLine: Spot[]
}

interface HoldLayout {
  box: Box
  /** Where now stands, and how many pixels a second is. */
  nowX: number
  perSec: number
}

function holdLayout(view: Pick<DisplayView, 'width' | 'height'>): HoldLayout {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const nowX = Math.round(box.x + box.w * HOLD_NOW_AT)
  return { box, nowX, perSec: (nowX - box.x) / HOLD_PAST_SEC }
}

const holdState = (footDb: number): HoldState => ({
  played: new History(HOLD_PAST_SEC, HOLD_POINTS, footDb, 'max'),
  held: new History(HOLD_PAST_SEC, HOLD_POINTS, footDb, 'max'),
  heardAt: null,
  example: new Float32Array(HOLD_POINTS * 2),
  exampleOf: '',
  catches: new Float64Array(12).fill(Number.NEGATIVE_INFINITY),
  caught: null,
  playedLine: spots(HOLD_POINTS),
  heldLine: spots(HOLD_POINTS),
  overLine: spots(HOLD_POINTS),
})

interface HoldPicture {
  topDb: number
  footDb: number
  /** The level under which the device takes nothing, dB: a dashed line with a handle. */
  thresholdDb: number
  /** How fast the hold dies away once let go, dB a second; 0 for a hold that stays. */
  fallDbPerSec: number
  /** The readings: the level played and the level held, linear. */
  played: number
  held: number
  /** The settings a worked example depends on (asked for only at rest), and the example: both levels in dB at `t` seconds from now. */
  exampleOf(): string
  example(t: number, out: [number, number]): void
  /** Whether the readings are the device's (the display runs and the device reports). */
  metered: boolean
}

/**
 * Draws a hold: the played level as a fill, the held level as a line, and
 * what the hold has that the playing has not: in the second ink while it is
 * the device's own readings, in a stronger ink while it is the worked
 * example. Returns whether it drew the readings (true) or the example.
 */
function drawHold(frame: DisplayFrame<HoldState>, picture: HoldPicture): boolean {
  const { ctx, colours, state } = frame
  const { box, nowX, perSec } = holdLayout(frame)
  const { topDb, footDb } = picture
  const foot = box.y + box.h
  const yOf = (db: number): number => yOfDb(clamp(db, footDb, topDb), box, topDb, footDb)

  const running = frame.powered && frame.dt > 0 && picture.metered
  if (running) {
    const played = gainToDb(picture.played)
    const held = gainToDb(picture.held)
    state.played.push(frame.now, Math.max(footDb, played))
    state.held.push(frame.now, Math.max(footDb, held))
    if (played > footDb + 3 || held > footDb + 3) state.heardAt = frame.now
  }
  const live =
    frame.powered && state.heardAt !== null && frame.now - state.heardAt < HOLD_PAST_SEC + 0.5

  dbGrid(frame, box, topDb, footDb, 24, topDb)
  const { playedLine, heldLine, overLine } = state
  if (!live) {
    const exampleOf = picture.exampleOf()
    if (state.exampleOf !== exampleOf) {
      const levels: [number, number] = [footDb, footDb]
      for (let i = 0; i < HOLD_POINTS; i++) {
        const t = (box.x + (i / (HOLD_POINTS - 1)) * box.w - nowX) / perSec
        picture.example(t, levels)
        state.example[i] = levels[0]
        state.example[HOLD_POINTS + i] = levels[1]
      }
      state.exampleOf = exampleOf
    }
  }
  // The readings run from the oldest at the left to now; the example runs across the whole width.
  const across = live ? nowX - box.x : box.w
  for (let i = 0; i < HOLD_POINTS; i++) {
    const x = box.x + (i / (HOLD_POINTS - 1)) * across
    const back = HOLD_POINTS - 1 - i
    const played = yOf(live ? state.played.at(back) : state.example[i])
    const held = yOf(live ? state.held.at(back) : state.example[HOLD_POINTS + i])
    playedLine[i][0] = heldLine[i][0] = overLine[i][0] = x
    playedLine[i][1] = played
    heldLine[i][1] = held
    // What the hold has that the playing has not: the hold carrying on.
    overLine[i][1] = Math.min(held, played)
  }
  clipped(ctx, box, () => {
    fillTo(ctx, playedLine, foot, colours.ink, INK.fill)
    fillBetween(
      ctx,
      overLine,
      playedLine,
      live ? colours.accent : colours.ink,
      live ? 0.85 : INK.rule,
    )
    trace(ctx, playedLine, { colour: colours.ink, width: 1, alpha: INK.back })
    trace(ctx, heldLine, { colour: colours.ink })
  })

  // The level under which nothing is taken.
  const thresholdY = yOf(picture.thresholdDb)
  rule(ctx, box.x, thresholdY, box.x + box.w, thresholdY, {
    colour: colours.ink,
    alpha: INK.back,
    dash: [3, 2],
  })
  rule(ctx, nowX, box.y - 1, nowX, foot + 1, { colour: colours.ink, alpha: INK.rule })

  if (live) {
    // From here on: how the hold would die away if the playing stopped now.
    const heldNow = state.held.at(0)
    if (heldNow > footDb + 1) {
      const ahead = (box.x + box.w - nowX) / perSec
      const endDb = heldNow - picture.fallDbPerSec * ahead
      const reach =
        endDb >= footDb ? ahead : (heldNow - footDb) / Math.max(1e-6, picture.fallDbPerSec)
      rule(ctx, nowX, yOf(heldNow), nowX + reach * perSec, yOf(Math.max(footDb, endDb)), {
        colour: colours.ink,
        alpha: INK.back,
        dash: [2, 2],
      })
      dot(ctx, nowX, yOf(heldNow), 2.5, colours.accent, { ring: colours.ink })
    }
  }
  return live
}

/** A handle on the threshold line: up and down set the parameter that moves it. */
function thresholdHandle(
  view: DisplayView,
  param: string,
  name: string,
  topDb: number,
  footDb: number,
  dbOf: (value: number) => number,
  valueOf: (db: number) => number,
): DisplayHandle {
  const { box } = holdLayout(view)
  const spec = view.spec(param)
  return {
    key: param,
    name,
    x: box.x + 6,
    y: yOfDb(clamp(dbOf(view.value(param)), footDb, topDb), box, topDb, footDb),
    drag: (_x, y) => ({
      [param]: clamp(valueOf(dbOfY(y, box, topDb, footDb)), spec?.min ?? 0, spec?.max ?? 1),
    }),
    reset: () => ({ [param]: spec?.default ?? 0.5 }),
  }
}

// --- Sustain ----------------------------------------------------------------

const SUSTAIN_TOP_DB = 0
const SUSTAIN_FOOT_DB = -72
/** `sustainer.h`: a layer plays 2.5 dB under what was caught, starts 140 ms after the note, and Decay from 59 s up never fades. */
const SUSTAIN_HELD_DB = 20 * Math.log10(0.75)
const SUSTAIN_LATENCY_SEC = 0.14
const SUSTAIN_NEVER_SEC = 59
const SUSTAIN_HANG_SEC = 0.15

/** The level under which nothing counts as playing, as `detect()` has it: -30 dBFS at Sensitivity 0, -66 at 1. */
export const sustainGateDb = (sensitivity: number): number => -(30 + 36 * sensitivity)

/** How fast a layer falls once it is let go (`envelope()`: 60 dB per Decay), dB a second; 0 when it stays. */
export function sustainFall(view: Pick<DisplayView, 'value'>): number {
  const latch = Math.round(view.value('mode')) === 2
  const hold = view.value('hold') >= 0.5
  const decay = view.value('decay')
  if (hold) return 0
  if (!latch && decay >= SUSTAIN_NEVER_SEC) return 0
  return 60 / decay
}

/** The rise of a layer `since` seconds after it was caught (`envelope()`: an S-curve over Attack), 0..1. */
export function sustainRise(since: number, attack: number): number {
  const rise = clamp(since / attack, 0, 1)
  return rise * rise * (3 - 2 * rise)
}

const sustainer = plateDisplay<HoldState>({
  place: 'strip',
  params: ['sensitivity', 'attack', 'decay', 'mode', 'hold'],
  live: { meters: true },
  info: 'The last eight seconds: the level you play as a fill, the held sound as a line, and in the second colour what the hold carries on after the playing. A tick at the top is a catch, the squares are the layers sounding. Drag the dashed line to set how soft a note is caught.',
  init: () => holdState(SUSTAIN_FOOT_DB),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { box, nowX, perSec } = holdLayout(frame)
    const gateDb = sustainGateDb(frame.value('sensitivity'))
    const attack = frame.value('attack')
    const fall = sustainFall(frame)
    const latch = Math.round(frame.value('mode')) === 2
    const hold = frame.value('hold') >= 0.5
    const metered = frame.hasMeter('held')

    // A catch: the count steps.
    if (frame.powered && frame.dt > 0 && frame.hasMeter('caught')) {
      const caught = frame.meter('caught')
      if (state.caught !== null && caught > state.caught) {
        state.catches.copyWithin(1, 0)
        state.catches[0] = frame.now
      }
      state.caught = caught
    }

    // The worked example: a plucked note that dies away in three seconds,
    // caught once its attack is over and held as the settings say.
    const noteAt = -7.2
    const noteDb = -10
    const noteFall = 20
    const caughtAt = noteAt + SUSTAIN_LATENCY_SEC
    // Playing ends a moment after the note has sunk to half the gate level.
    const letGoAt = noteAt + (noteDb - (gateDb - 6)) / noteFall + SUSTAIN_HANG_SEC
    const catches = !(latch && !hold) && noteDb > gateDb
    const live = drawHold(frame, {
      topDb: SUSTAIN_TOP_DB,
      footDb: SUSTAIN_FOOT_DB,
      thresholdDb: gateDb,
      fallDbPerSec: fall,
      played: frame.meter('level'),
      held: frame.meter('held'),
      metered,
      exampleOf: () =>
        `${gateDb.toFixed(2)} ${attack.toFixed(3)} ${fall.toFixed(4)} ${catches} ${frame.width}`,
      example(t, out) {
        out[0] = t < noteAt ? SUSTAIN_FOOT_DB : noteDb - noteFall * (t - noteAt)
        const rise = catches ? sustainRise(t - caughtAt, attack) : 0
        out[1] =
          rise > 0
            ? noteDb -
              noteFall * SUSTAIN_LATENCY_SEC +
              SUSTAIN_HELD_DB +
              gainToDb(rise) -
              fall * Math.max(0, t - Math.max(letGoAt, caughtAt))
            : SUSTAIN_FOOT_DB
      },
    })

    // Catches, where they happened (in ink: they are past), and the layers sounding now.
    const tickAt = (seconds: number): void => {
      const x = nowX + seconds * perSec
      if (x < box.x || x > nowX) return
      ctx.fillRect(Math.round(x) - 1, box.y - 1, 2, 5)
    }
    ctx.globalAlpha = INK.text
    ctx.fillStyle = colours.ink
    if (live) {
      for (const at of state.catches) if (Number.isFinite(at)) tickAt(at - frame.now)
      const layers = clamp(Math.round(frame.meter('layers')), 0, 6)
      for (let n = 0; n < 6; n++) {
        const x = nowX + 5 + n * 5
        if (x + 3 > box.x + box.w) break
        ctx.globalAlpha = n < layers ? 1 : INK.grid
        ctx.fillStyle = n < layers ? colours.accent : colours.ink
        ctx.fillRect(x, box.y, 3, 3)
      }
    } else if (catches) {
      tickAt(caughtAt)
    }
    ctx.globalAlpha = 1
    for (const point of sustainerHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: sustainerHandles,
})

function sustainerHandles(view: DisplayView): DisplayHandle[] {
  return [
    thresholdHandle(
      view,
      'sensitivity',
      'Sensitivity',
      SUSTAIN_TOP_DB,
      SUSTAIN_FOOT_DB,
      sustainGateDb,
      (db) => (-db - 30) / 36,
    ),
  ]
}

// --- Pad Follower -----------------------------------------------------------

const PAD_TOP_DB = 0
const PAD_FOOT_DB = -84
/** `pad_follower.h`: the partial level at which the gate is half open, at Sensitivity 0 and 1. */
const PAD_QUIETEST_DB: readonly [number, number] = [-36, -84]
export const padThresholdDb = (sensitivity: number): number =>
  lerp(PAD_QUIETEST_DB[0], PAD_QUIETEST_DB[1], sensitivity)

/** The worked example: a firm chord, then a soft one, as (start, end, dB) from now. */
const PAD_NOTES: readonly (readonly [number, number, number])[] = [
  [-7.4, -5.6, -12],
  [-3.4, -2.2, -50],
]

/**
 * The pad's level for the worked example, by the follower of `follower_bank.h`
 * (`set_times` and the end of `steer`): the partial through the soft gate,
 * `p³ / (p² + threshold²)`, then two poles up (Rise: 90 % after the swell
 * time, which is Rise less the 70 ms a band takes to settle) and one down
 * (Fall: 60 dB), stepped every 10 ms. Fills `out` with dB per step from `from`.
 */
export function padFollow(
  rise: number,
  fall: number,
  thresholdDb: number,
  from: number,
  out: Float32Array,
): void {
  const step = 0.01
  const coeff = (seconds: number): number => (seconds > 0 ? 1 - Math.exp(-step / seconds) : 1)
  const swell = Math.max(0.3 * rise, rise - 0.07)
  const attack = coeff(swell / 3.89)
  const fallTau = fall / 6.908
  const release = coeff(fallTau)
  const releaseFollow = coeff(Math.min(0.03, fallTau * 0.25))
  const threshold2 = Math.pow(10, thresholdDb / 10)
  let e1 = 0
  let e2 = 0
  for (let i = 0; i < out.length; i++) {
    const t = from + i * step
    let partial = 0
    // A band settles on its partial for 70 ms before the follower starts.
    for (const [start, end, db] of PAD_NOTES)
      if (t >= start + 0.07 && t < end) partial = Math.pow(10, db / 20)
    const partial2 = partial * partial
    const target = partial2 > 0 ? (partial * partial2) / (partial2 + threshold2) : 0
    e1 += (target - e1) * (target > e1 ? attack : release)
    e2 += (e1 - e2) * (e1 > e2 ? attack : releaseFollow)
    out[i] = gainToDb(e2)
  }
}

interface PadState extends HoldState {
  /** The follower's answer to the worked example, 10 ms a step from 8 s before now. */
  followed: Float32Array
  followedOf: string
}

const padFollower = plateDisplay<PadState>({
  place: 'strip',
  params: ['rise', 'fall', 'sensitivity'],
  live: { meters: true },
  info: 'The last eight seconds: the partials the pad hears in what you play as a fill, the pad it makes of them as a line, and in the second colour the pad hanging on after the playing. Rise and Fall are its slopes. Drag the dashed line to set how soft a note becomes pad.',
  init: () => ({ ...holdState(PAD_FOOT_DB), followed: new Float32Array(1100), followedOf: '' }),
  draw(frame) {
    const { state } = frame
    ground(frame)
    const rise = frame.value('rise')
    const fall = frame.value('fall')
    const thresholdDb = padThresholdDb(frame.value('sensitivity'))
    const exampleOf = (): string =>
      `${rise.toFixed(3)} ${fall.toFixed(3)} ${thresholdDb.toFixed(2)} ${frame.width}`
    drawHold(frame, {
      topDb: PAD_TOP_DB,
      footDb: PAD_FOOT_DB,
      thresholdDb,
      // `set_times`: the pad falls 60 dB in Fall seconds once its input has gone.
      fallDbPerSec: 60 / fall,
      played: frame.meter('heard'),
      held: frame.meter('held'),
      metered: frame.hasMeter('held'),
      exampleOf,
      example(t, out) {
        const followedOf = exampleOf()
        if (state.followedOf !== followedOf) {
          padFollow(rise, fall, thresholdDb, -HOLD_PAST_SEC, state.followed)
          state.followedOf = followedOf
        }
        out[0] = PAD_FOOT_DB
        for (const [start, end, db] of PAD_NOTES) if (t >= start && t < end) out[0] = db
        const at = clamp(Math.round((t + HOLD_PAST_SEC) / 0.01), 0, state.followed.length - 1)
        out[1] = t < -HOLD_PAST_SEC ? PAD_FOOT_DB : state.followed[at]
      },
    })
    for (const point of padHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: padHandles,
})

function padHandles(view: DisplayView): DisplayHandle[] {
  return [
    thresholdHandle(
      view,
      'sensitivity',
      'Sensitivity',
      PAD_TOP_DB,
      PAD_FOOT_DB,
      padThresholdDb,
      (db) => (PAD_QUIETEST_DB[0] - db) / (PAD_QUIETEST_DB[0] - PAD_QUIETEST_DB[1]),
    ),
  ]
}

// --- Cloud ------------------------------------------------------------------
//
// The eight seconds the device holds run across, the newest at the right
// where the record head writes, along the foot as the level that was
// recorded. Above it pitch runs up and down, the played pitch on the middle
// line. Every grain is a mark where the device opened it: the stretch of the
// held sound it reads, at its pitch, a little higher in its row for left and
// lower for right, with a point that is the place it is reading now.

/** `grain_cloud.h`: the buffer, the least spray, the overlap ceiling, Scatter's detune and its jumps. */
const CLOUD_SECONDS = 8
const CLOUD_MIN_SPRAY_SEC = 0.03
const CLOUD_MAX_OVERLAP = 24
const CLOUD_SCATTER_CENTS = 24
const CLOUD_JUMPS = [12, -12, 7, -5, 12, -12, 19, 24] as const
/** The rows those jumps land on, each once. */
const CLOUD_JUMP_ROWS = [...new Set<number>(CLOUD_JUMPS)]
/** The lines of the pitch scale, in semitones from the played pitch, and of the time scale, in seconds back. */
const CLOUD_PITCH_LINES = [-24, -12, 0, 12, 24] as const
const CLOUD_TIME_LINES = [1, 2, 4] as const
/** Semitones from the middle line to the top of the pitch scale, and how far a hard pan moves a grain in its row. */
const CLOUD_SEMITONES = 30
const CLOUD_PAN_SEMITONES = 4
/** Grains the display keeps, and slots of the record level across the buffer. */
const CLOUD_KEPT = 64
const CLOUD_TAPE = 120
/** The height of the held sound's lane along the foot. */
const CLOUD_LANE = 13
/** How long a grain's mark stays where the grain left it, fading, after the grain has ended. */
const CLOUD_AFTER_SEC = 1.6

interface CloudGrain {
  /** Seconds behind the head where its stretch began (the old end), when it started. */
  place: number
  /** Speed, negative backwards. */
  rate: number
  pan: number
  /** Seconds it lasts. */
  length: number
  /** The clock and the tape's travel when it started. */
  born: number
  travel: number
}

interface CloudState {
  grains: CloudGrain[]
  next: number
  /** The device's count of grains at the last reading; null before the first. */
  count: number | null
  /** Seconds the tape has travelled under the head while the display ran. */
  travel: number
  /** The level recorded, oldest first, one slot per `CLOUD_SECONDS / CLOUD_TAPE` of travel. */
  tape: Float32Array
  /** When a grain last started. */
  lastAt: number
  /** The two edges of the held sound's picture, kept so a frame makes no new ones. */
  upper: Spot[]
  lower: Spot[]
}

interface CloudLayout {
  /** The pitch scale, and under it the lane of the held sound. */
  box: Box
  lane: Box
  /** Where the record head stands. */
  head: number
  mid: number
  perSemitone: number
}

function cloudLayout(view: Pick<DisplayView, 'width' | 'height'>): CloudLayout {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const box: Box = { ...all, h: all.h - CLOUD_LANE - 2 }
  return {
    box,
    lane: { ...all, y: all.y + all.h - CLOUD_LANE, h: CLOUD_LANE },
    head: all.x + all.w,
    mid: box.y + box.h / 2,
    perSemitone: box.h / 2 / CLOUD_SEMITONES,
  }
}

/**
 * Where sound of an age stands: the square root of the age across, so the
 * last second has a third of the width. Spray reaches by its square, so on
 * this scale it spreads the grains evenly.
 */
const cloudX = (age: number, layout: CloudLayout): number =>
  layout.head - Math.sqrt(clamp(age, 0, CLOUD_SECONDS) / CLOUD_SECONDS) * layout.box.w
const cloudAge = (x: number, layout: CloudLayout): number =>
  CLOUD_SECONDS * Math.pow(clamp((layout.head - x) / layout.box.w, 0, 1), 2)

/** A grain's length in seconds at a speed: `grain_length()`, Size shortened so the stretch it reads fits the buffer. */
export function cloudLength(sizeMs: number, rate: number, sampleRate = 48000): number {
  const room = CLOUD_SECONDS - 32 / sampleRate - CLOUD_MIN_SPRAY_SEC
  return Math.min(sizeMs * 0.001, room / (Math.abs(rate) + 1))
}

/** Grains a second after the overlap ceiling: `schedule()`. */
export function cloudRate(density: number, sizeMs: number): number {
  return Math.min(density, CLOUD_MAX_OVERLAP / cloudLength(sizeMs, 1))
}

/**
 * Where a grain at `place` (0 newest, 1 oldest) begins, in seconds behind the
 * head: `spawn()`, between the nearest stretch already written and the oldest
 * one that will last, with `jitter` (0..1) of the least spray on top.
 */
export function cloudDelay(place: number, rate: number, length: number, jitter = 0.5): number {
  const margin = 16 / 48000
  const nearest = Math.abs(rate) * length + margin
  const oldest = CLOUD_SECONDS - length - margin
  return (
    nearest +
    clamp(place, 0, 1) * (oldest - nearest - CLOUD_MIN_SPRAY_SEC) +
    CLOUD_MIN_SPRAY_SEC * jitter
  )
}

/** A grain's window at `phase` (0..1) of its life: `GrainPool::window_at`, raised-cosine edges that Texture shortens. */
export function cloudWindow(phase: number, texture: number): number {
  const edge = clamp(1 - 0.96 * texture, 0.02, 1) * 0.5
  if (phase < edge) return 0.5 - 0.5 * Math.cos((Math.PI * phase) / edge)
  if (phase > 1 - edge) return 0.5 - 0.5 * Math.cos((Math.PI * (1 - phase)) / edge)
  return 1
}

/** A number in 0..1 that is the same every time for the same piece and draw: the worked examples' dice. */
function dice(index: number, draw: number): number {
  let h = Math.imul(index + 1, 374761393) ^ Math.imul(draw + 1, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const semitonesOf = (rate: number): number => 12 * Math.log2(Math.max(1e-3, Math.abs(rate)))

function cloudHandles(view: DisplayView): DisplayHandle[] {
  const layout = cloudLayout(view)
  const { box, lane, mid, perSemitone } = layout
  const pitch = view.value('pitch')
  const size = view.value('size')
  const rate = Math.pow(2, pitch / 12)
  const length = cloudLength(size, rate)
  const near = cloudDelay(0, rate, length)
  const far = cloudDelay(1, rate, length)
  const sizeSpec = view.spec('size')
  return [
    {
      key: 'position',
      name: 'Position',
      x: cloudX(cloudDelay(view.value('position'), rate, length), layout),
      y: lane.y + lane.h / 2,
      drag: (x) => ({
        position: clamp((cloudAge(x, layout) - near) / (far - near), 0, 1),
      }),
      // The wheel makes the grains longer and shorter.
      wheel: (steps) => ({
        size: clamp(size * Math.pow(1.15, steps), sizeSpec?.min ?? 10, sizeSpec?.max ?? 2000),
      }),
      reset: () => ({ position: view.spec('position')?.default ?? 0.04 }),
    },
    {
      key: 'pitch',
      name: 'Pitch',
      x: box.x + 5,
      y: mid - pitch * perSemitone,
      drag: (_x, y) => ({ pitch: clamp((mid - y) / perSemitone, -24, 24) }),
      reset: () => ({ pitch: 0 }),
    },
  ]
}

const grainCloud = plateDisplay<CloudState>({
  place: 'window',
  columns: 2,
  params: [
    'position',
    'size',
    'density',
    'pitch',
    'spray',
    'scatter',
    'texture',
    'reverse',
    'freeze',
    'spread',
  ],
  live: { meters: true },
  info: 'Along the foot, the eight seconds the cloud holds, newest at the right. Each mark above is a grain: where in that sound it reads, as wide as what it reads, higher for a higher pitch, up in its row for left and down for right. Drag the rings for Position and Pitch; the wheel on Position is Size.',
  init: () => ({
    grains: Array.from({ length: CLOUD_KEPT }, () => ({
      place: 0,
      rate: 1,
      pan: 0,
      length: 0,
      born: Number.NEGATIVE_INFINITY,
      travel: 0,
    })),
    next: 0,
    count: null,
    travel: 0,
    tape: new Float32Array(CLOUD_TAPE),
    lastAt: Number.NEGATIVE_INFINITY,
    upper: spots(CLOUD_TAPE),
    lower: spots(CLOUD_TAPE),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = cloudLayout(frame)
    const { box, lane, head, mid, perSemitone } = layout
    const size = frame.value('size')
    const pitch = frame.value('pitch')
    const spray = frame.value('spray')
    const scatter = frame.value('scatter')
    const texture = frame.value('texture')
    const spread = frame.value('spread')
    const frozen = frame.value('freeze') >= 0.5
    const xOf = (age: number): number => cloudX(age, layout)
    const yOf = (semitones: number, pan = 0): number =>
      mid -
      clamp(semitones - pan * CLOUD_PAN_SEMITONES, -CLOUD_SEMITONES, CLOUD_SEMITONES) * perSemitone

    // What the device reports: the tape moving under the head, and new grains.
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('grains')
    if (running) {
      if (!frozen) {
        const slot = CLOUD_SECONDS / CLOUD_TAPE
        const before = Math.floor(state.travel / slot)
        state.travel += frame.dt
        const steps = Math.min(CLOUD_TAPE, Math.floor(state.travel / slot) - before)
        if (steps > 0) {
          state.tape.copyWithin(0, steps)
          state.tape.fill(0, CLOUD_TAPE - steps)
        }
        const level = frame.meter('level')
        if (level > state.tape[CLOUD_TAPE - 1]) state.tape[CLOUD_TAPE - 1] = level
      }
      const count = frame.meter('grains')
      const place = frame.meter('place')
      const rate = frame.meter('rate')
      if (state.count !== null && count !== state.count && place > 0 && rate !== 0) {
        const grain = state.grains[state.next]
        state.next = (state.next + 1) % CLOUD_KEPT
        grain.place = place
        grain.rate = rate
        grain.pan = clamp(frame.meter('pan'), -1, 1)
        grain.length = cloudLength(size, rate, frame.sampleRate)
        grain.born = frame.now
        grain.travel = state.travel
        state.lastAt = frame.now
      }
      state.count = count
    }
    const live = frame.powered && frame.now - state.lastAt < CLOUD_AFTER_SEC + 2.5

    // The scales: the played pitch and the octaves about it; one, two and four seconds back.
    for (const semitones of CLOUD_PITCH_LINES) {
      rule(ctx, box.x, yOf(semitones), head, yOf(semitones), {
        colour: colours.ink,
        alpha: semitones === 0 ? INK.rule : INK.grid,
      })
    }
    for (const seconds of CLOUD_TIME_LINES) {
      rule(ctx, xOf(seconds), lane.y - 2, xOf(seconds), lane.y + lane.h, {
        colour: colours.ink,
        alpha: INK.rule,
      })
    }

    // The held sound along the foot, as loud as it was recorded.
    const laneMid = lane.y + lane.h / 2
    if (live) {
      const { upper, lower } = state
      for (let i = 0; i < CLOUD_TAPE; i++) {
        const half = 0.5 + clamp((gainToDb(state.tape[i]) + 48) / 48, 0, 1) * (lane.h / 2 - 0.5)
        upper[i][0] = lower[i][0] = xOf(((CLOUD_TAPE - 0.5 - i) / CLOUD_TAPE) * CLOUD_SECONDS)
        upper[i][1] = laneMid - half
        lower[i][1] = laneMid + half
      }
      fillBetween(ctx, upper, lower, colours.ink, INK.back)
    } else {
      rule(ctx, box.x, laneMid, head, laneMid, { colour: colours.ink, alpha: INK.back })
    }

    // Where grains are set to open: Position, as far either way as Spray
    // throws them, and as far up and down in the row as Spread pans them.
    const centre = Math.pow(2, pitch / 12)
    const centreLength = cloudLength(size, centre, frame.sampleRate)
    const near = cloudDelay(0, centre, centreLength)
    const far = cloudDelay(1, centre, centreLength)
    const position = frame.value('position')
    const reach = spray * spray
    const from = xOf(lerp(near, far, clamp(position + reach, 0, 1)))
    const to = xOf(lerp(near, far, clamp(position - reach, 0, 1)) - centre * centreLength)
    const rowHalf = Math.max(1.5, spread * CLOUD_PAN_SEMITONES * perSemitone + 1.5)
    fillRect(
      ctx,
      { x: from, y: yOf(pitch) - rowHalf, w: Math.max(1, to - from), h: rowHalf * 2 },
      colours.ink,
      INK.fill,
    )
    fillRect(
      ctx,
      { x: from, y: lane.y, w: Math.max(1, to - from), h: lane.h },
      colours.ink,
      INK.fill,
    )
    // Above half, Scatter also throws grains an octave or a fifth away: the rows they land on.
    if (scatter > 0.5) {
      for (const jump of CLOUD_JUMP_ROWS) {
        fillRect(
          ctx,
          { x: from, y: yOf(pitch + jump) - 1, w: Math.max(1, to - from), h: 2 },
          colours.ink,
          INK.grid,
        )
      }
    }

    // The grains.
    const mark = (
      place: number,
      rate: number,
      pan: number,
      length: number,
      age: number,
      travelled: number,
      colour: string,
    ): void => {
      if (!(age >= 0 && age < length + CLOUD_AFTER_SEC)) return
      const phase = Math.min(1, age / length)
      const sounding = age < length
      // While it sounds, as bright as its window is open; afterwards a trace that fades.
      const window = sounding ? cloudWindow(phase, texture) : 0
      const strength = sounding
        ? 0.45 + 0.55 * window
        : 0.55 * (1 - (age - length) / CLOUD_AFTER_SEC)
      const span = Math.abs(rate) * length
      // The stretch moves away from the head while the grain reads it; its trace stays where it ended.
      const old = place + Math.min(travelled, length)
      const read = rate >= 0 ? old - span * phase : old - span * (1 - phase)
      const y = yOf(semitonesOf(rate), pan)
      const left = xOf(old)
      // (never thinner than two pixels: the shortest grain is still to be seen)
      const right = Math.max(left + 2, xOf(old - span))
      ctx.globalAlpha = strength * 0.8
      ctx.fillStyle = colour
      ctx.fillRect(left, y - 1, right - left, 2)
      ctx.globalAlpha = 1
      if (sounding) dot(ctx, clamp(xOf(read), left, right), y, 1.2 + window, colour)
    }
    clipped(ctx, { ...box, h: lane.y + lane.h - box.y }, () => {
      if (live) {
        for (const grain of state.grains) {
          mark(
            grain.place,
            grain.rate,
            grain.pan,
            grain.length,
            frame.now - grain.born,
            state.travel - grain.travel,
            colours.accent,
          )
        }
        return
      }
      // At rest, the cloud as the settings make it: the grains of the last
      // moments, each thrown as `spawn()` throws one, the newest still sounding.
      const rate = cloudRate(frame.value('density'), size)
      const many = clamp(Math.round(rate * (cloudLength(size, 1) + CLOUD_AFTER_SEC)), 1, CLOUD_KEPT)
      const jumpChance = (scatter - 0.5) * 1.4
      for (let i = 0; i < many; i++) {
        let semitones = pitch + scatter * CLOUD_SCATTER_CENTS * 0.01 * (dice(i, 0) * 2 - 1)
        if (dice(i, 1) < jumpChance) semitones += CLOUD_JUMPS[Math.floor(dice(i, 2) * 8)]
        const speed = Math.pow(2, clamp(semitones, -36, 36) / 12)
        const length = cloudLength(size, speed, frame.sampleRate)
        let place = position + reach * (dice(i, 3) * 2 - 1)
        if (place < 0) place = -place
        if (place > 1) place = 2 - place
        const depth = dice(i, 8)
        const age = (i + dice(i, 5)) / rate
        mark(
          cloudDelay(place, speed, length, dice(i, 4)),
          dice(i, 6) < frame.value('reverse') ? -speed : speed,
          spread * (dice(i, 7) < 0.5 ? -1 : 1) * (1 - depth * depth * depth),
          length,
          age,
          frozen ? 0 : age,
          colours.ink,
        )
      }
    })

    // The record head: writing now (the second ink), stopped by Freeze (dashed), or at rest.
    const writing = live && !frozen
    rule(ctx, head - 1, box.y, head - 1, lane.y + lane.h, {
      colour: writing ? colours.accent : colours.ink,
      alpha: writing ? 1 : INK.back,
      dash: frozen ? [2, 2] : undefined,
    })
    const handles = cloudHandles(frame)
    // Position stands on the held sound, and a line from it shows where in it the row above reads.
    rule(ctx, handles[0].x, yOf(pitch), handles[0].x, lane.y, {
      colour: colours.ink,
      alpha: INK.rule,
      dash: [2, 2],
    })
    for (const point of handles) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 3 })
    }
  },
  handles: cloudHandles,
})

// --- Glitch -----------------------------------------------------------------
//
// A timeline that runs to the left, with a mark for now. The short ticks
// along the foot are the slice clock. An event is drawn as it happens, piece
// by piece: each piece is a block as long as it plays and as tall as it is
// loud, and the line in it is where in the caught sound the device is
// reading, so a repeat is a ramp that starts again, a reverse a ramp that
// falls, a slowing tape a curve that flattens. What the event has still to
// play stands dashed at the right of now, and a word names the event while
// it plays and for a moment after, so that a short one can be read.

/** How much time a Glitch display spans, and where in it now stands. */
const GLITCH_SPAN_SEC = 4
const GLITCH_NOW_AT = 0.75
/** `glitch.h`: the kinds of event, and the constants its pieces are made with. */
const GLITCH_REPEAT = 1
const GLITCH_SKIP = 2
const GLITCH_REVERSE = 3
const GLITCH_HALF = 4
const GLITCH_STOP = 5
const GLITCH_MAX_EVENT_SEC = 7
const GLITCH_MAX_REPEATS = 8
const GLITCH_BOUNCE_DEPTH = 0.45
const GLITCH_SHORTEST_REPEAT_SEC = 0.008
const GLITCH_REPEAT_FADE = 0.3
const GLITCH_SKIP_FADE = 0.12
const GLITCH_SKIP_SHORTEST_SEC = 0.02
const GLITCH_SKIP_RANGE = 6
const GLITCH_SPIN_UP = 0.3
const GLITCH_LONGEST_FADE_SEC = 0.08
/** The kinds by name, as short as the corner they are written in. */
const GLITCH_WORDS = ['', 'REPEAT', 'SKIP', 'REVERSE', 'HALF', 'STOP']
/** Pieces and ticks the display keeps. */
const GLITCH_PIECES = 96
const GLITCH_TICKS = 160
/** How tall a tick of the slice clock is, and how long an event's word stays after the event. */
const GLITCH_TICK = 4
const GLITCH_WORD_SEC = 1.5

export interface GlitchPiece {
  /** When it starts and ends, on the frame clock (or from now, in a worked example). */
  t0: number
  t1: number
  kind: number
  /** The speed it is read at: 2 or 0.5 for an octave, negative backwards. */
  speed: number
  /** Which piece of its event it is, from 0: Decay turns each one down. */
  step: number
  /** The slice length when its event began, seconds. */
  slice: number
}

interface GlitchState {
  pieces: GlitchPiece[]
  next: number
  /** The piece playing now, or null between events. */
  current: GlitchPiece | null
  /** The last reading, to know a new one by: time to the next cut, kind, event count, piece number. */
  seenNext: number
  seenKind: number
  seenEvents: number
  seenPiece: number
  /** The device's event count and piece number when a reading was last acted on. */
  events: number | null
  piece: number
  /** How many pieces the event playing has. */
  count: number
  /** When the next cut falls: the end of the piece, or of the slice. Null while no clock runs. */
  cut: number | null
  /** The slice clock's ticks. */
  ticks: Float64Array
  tick: number
  /** When a tick or a piece last came. */
  lastAt: number
  /** The kind of the event that ended last and when it ended, for its word. */
  endedKind: number
  endedAt: number
  /** One piece to draw each of those still to come with. */
  pending: GlitchPiece
  /** A worked example and the settings it was made from. */
  example: GlitchPiece[]
  exampleTicks: number[]
  exampleOf: Float64Array
}

const emptyPiece = (): GlitchPiece => ({
  t0: 0,
  t1: 0,
  kind: 0,
  speed: 1,
  step: 0,
  slice: 0.25,
})

interface GlitchLayout {
  box: Box
  nowX: number
  perSec: number
  /** The foot the blocks stand on and the height of a full one. */
  base: number
  full: number
}

function glitchLayout(view: Pick<DisplayView, 'width' | 'height'>): GlitchLayout {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const nowX = Math.round(box.x + box.w * GLITCH_NOW_AT)
  return {
    box,
    nowX,
    perSec: box.w / GLITCH_SPAN_SEC,
    base: box.y + box.h,
    full: box.h - 8,
  }
}

/** How loud a piece is against the first of its event: `next_segment()`, Decay 1 is 6 dB a repeat and 2.4 dB a stuck loop. */
export function glitchGain(kind: number, step: number, decay: number): number {
  if (kind === GLITCH_REPEAT) return Math.pow(10, -GLITCH_REPEAT_FADE * decay * step)
  if (kind === GLITCH_SKIP) return Math.pow(10, -GLITCH_SKIP_FADE * decay * step)
  return 1
}

/** How long repeat number `step` (from 0) lasts: each one shorter by Bounce, never under 8 ms. */
export function glitchRepeatSec(slice: number, step: number, bounce: number): number {
  const shrink = 1 - GLITCH_BOUNCE_DEPTH * bounce
  return clamp(slice * Math.pow(shrink, step), Math.min(GLITCH_SHORTEST_REPEAT_SEC, slice), slice)
}

/** The splice between pieces in seconds: `fade_length()`, none at Calm 0 and 80 ms at 1. */
const glitchFadeSec = (calm: number): number => GLITCH_LONGEST_FADE_SEC * calm * calm * calm

/**
 * How far through its source a piece has read at `age` seconds, as a share of
 * the piece's block: `render()`'s speed, summed. A repeat reads its slice at
 * its speed; a half-speed fall glides from 1 to 0.5 over half the splice
 * time; a stopping tape slows evenly to nothing and spins back up in a third
 * of the time.
 */
export function glitchRead(piece: GlitchPiece, age: number, calm: number): number {
  const length = Math.max(1e-4, piece.t1 - piece.t0)
  if (piece.kind === GLITCH_REVERSE) return 1 - age / length
  if (piece.kind === GLITCH_HALF) {
    const glide = Math.max(1 / 48000, 0.5 * glitchFadeSec(calm))
    return (0.5 * age + 0.5 * glide * (1 - Math.exp(-age / glide))) / length
  }
  if (piece.kind === GLITCH_STOP) {
    const stop = length / (1 + GLITCH_SPIN_UP)
    const spin = Math.max(1e-4, length - stop)
    if (age < stop) return (age - (age * age) / (2 * stop)) / stop
    return (stop / 2 + ((age - stop) * (age - stop)) / (2 * spin)) / stop
  }
  const source = piece.kind === GLITCH_REPEAT ? piece.slice : length
  return Math.min(1, (Math.abs(piece.speed) * age) / source)
}

/**
 * A stretch of what the settings give, drawn by the dice instead of the
 * device's own: at every slice end `boundary()` rolls for an event with
 * Chance and picks its kind by the four weights, and `begin_event()` makes
 * its pieces. Times are seconds from now.
 */
function glitchExample(view: DisplayView, pieces: GlitchPiece[], ticks: number[]): void {
  const slice = Math.max(0.016, view.value('time') * 0.001)
  const chance = view.value('chance')
  const weights = [
    view.value('repeat'),
    view.value('skip'),
    view.value('reverse'),
    view.value('slow'),
  ]
  const total = weights[0] + weights[1] + weights[2] + weights[3]
  const bounce = view.value('bounce')
  const octaves = view.value('octaves')
  const octave = (n: number, draw: number): number =>
    dice(n, draw) >= octaves ? 1 : dice(n, draw + 1) < 0.5 ? 2 : 0.5
  let used = 0
  const add = (t0: number, length: number, kind: number, speed: number, step: number): number => {
    if (used < pieces.length) {
      const piece = pieces[used++]
      Object.assign(piece, { t0, t1: t0 + length, kind, speed, step, slice })
    }
    return t0 + length
  }
  ticks.length = 0
  const end = GLITCH_SPAN_SEC * (1 - GLITCH_NOW_AT)
  let t = -GLITCH_SPAN_SEC * GLITCH_NOW_AT - 0.2 * slice
  for (let n = 0; t < end && n < 400; n++) {
    ticks.push(t)
    if (!(total > 0 && dice(n, 20) < chance)) {
      t += slice
      continue
    }
    let at = dice(n, 21) * total
    let choice = 0
    while (choice < 3 && at >= weights[choice]) at -= weights[choice++]
    while (weights[choice] <= 0) choice = (choice + 3) & 3
    const most = clamp(Math.floor(GLITCH_MAX_EVENT_SEC / slice), 1, GLITCH_MAX_REPEATS)
    if (choice === 0) {
      // One to eight repeats, few more likely than many; a bounce adds some.
      let sum = 0
      for (let k = 1; k <= most; k++) sum += 1 / k
      let left = dice(n, 22) * sum
      let count = 1
      while (count < most && left >= 1 / count) left -= 1 / count++
      count = clamp(count + Math.floor(3 * bounce + 0.5), 1, GLITCH_MAX_REPEATS)
      for (let k = 0; k < count; k++) {
        const length = glitchRepeatSec(slice, k, bounce)
        const speed = octave(n * 16 + k, 30)
        if (speed === 2) {
          // Twice as fast, so twice over: the repeat still takes its time.
          t = add(t, length / 2, GLITCH_REPEAT, 2, k)
          t = add(t, length / 2, GLITCH_REPEAT, 2, k)
        } else {
          t = add(t, length, GLITCH_REPEAT, speed, k)
        }
      }
    } else if (choice === 1) {
      // A fragment of 20 to 120 ms, three to ten times over.
      const fragment = GLITCH_SKIP_SHORTEST_SEC * Math.pow(GLITCH_SKIP_RANGE, dice(n, 23))
      const many = dice(n, 24)
      const count = clamp(
        3 + Math.floor(8 * many * many),
        1,
        Math.floor(GLITCH_MAX_EVENT_SEC / fragment),
      )
      const speed = octave(n, 25)
      for (let k = 0; k < count; k++) t = add(t, fragment, GLITCH_SKIP, speed, k)
    } else if (choice === 2) {
      t = add(t, slice, GLITCH_REVERSE, -1, 0)
    } else {
      const slices = slice <= 1 && dice(n, 27) < 0.4 ? 2 : 1
      t =
        dice(n, 26) < 0.5
          ? add(t, slice * slices, GLITCH_HALF, 1, 0)
          : add(t, slice * slices * (1 + GLITCH_SPIN_UP), GLITCH_STOP, 1, 0)
    }
  }
  for (let i = used; i < pieces.length; i++) pieces[i].kind = 0
}

function glitchHandles(view: DisplayView): DisplayHandle[] {
  const { box, nowX, perSec } = glitchLayout(view)
  const spec = view.spec('time')
  return [
    {
      key: 'time',
      name: 'Slice length',
      // One slice back from now, on the line that measures it.
      x: nowX - view.value('time') * 0.001 * perSec,
      y: box.y + 3,
      drag: (x) => ({
        time: clamp(((nowX - x) / perSec) * 1000, spec?.min ?? 20, spec?.max ?? 2000),
      }),
      reset: () => ({ time: spec?.default ?? 250 }),
    },
  ]
}

/** The settings the picture is made from: a worked example is made again when one of them moves. */
const GLITCH_PARAMS = [
  'time',
  'chance',
  'repeat',
  'skip',
  'reverse',
  'slow',
  'calm',
  'decay',
  'bounce',
  'octaves',
] as const

const glitch = plateDisplay<GlitchState>({
  place: 'strip',
  params: GLITCH_PARAMS,
  live: { meters: true },
  info: 'Four seconds run left past the mark for now, a tick for each slice; the ring sets the slice. A block is a piece of a glitch, as long as it plays and as tall as it is loud, and the word names it. Its line is where the sound is read: up for a repeat, down for a reverse, flattening as a tape slows.',
  init: () => ({
    pieces: Array.from({ length: GLITCH_PIECES }, emptyPiece),
    next: 0,
    current: null,
    seenNext: Number.NaN,
    seenKind: Number.NaN,
    seenEvents: Number.NaN,
    seenPiece: Number.NaN,
    events: null,
    piece: 0,
    count: 0,
    cut: null,
    ticks: new Float64Array(GLITCH_TICKS).fill(Number.NEGATIVE_INFINITY),
    tick: 0,
    lastAt: Number.NEGATIVE_INFINITY,
    endedKind: 0,
    endedAt: Number.NEGATIVE_INFINITY,
    pending: emptyPiece(),
    example: Array.from({ length: GLITCH_PIECES }, emptyPiece),
    exampleTicks: [],
    exampleOf: new Float64Array(GLITCH_PARAMS.length).fill(Number.NaN),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { box, nowX, perSec, base, full } = glitchLayout(frame)
    const slice = Math.max(0.016, frame.value('time') * 0.001)
    const calm = frame.value('calm')
    const decay = frame.value('decay')
    const bounce = frame.value('bounce')
    const now = frame.now

    // --- What the device reports ---
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('next')
    const next = running ? frame.meter('next') : 0
    const kind = running ? Math.round(frame.meter('kind')) : 0
    const events = running ? frame.meter('events') : 0
    const number = running ? Math.round(frame.meter('piece')) : 0
    // Readings come less often than frames: one that has not moved says nothing new.
    if (
      running &&
      (next !== state.seenNext ||
        kind !== state.seenKind ||
        events !== state.seenEvents ||
        number !== state.seenPiece)
    ) {
      state.seenNext = next
      state.seenKind = kind
      state.seenEvents = events
      state.seenPiece = number
      const tick = (at: number): void => {
        state.ticks[state.tick] = at
        state.tick = (state.tick + 1) % GLITCH_TICKS
        state.lastAt = now
      }
      const begin = (t0: number, t1: number, first: boolean): GlitchPiece => {
        const piece = state.pieces[state.next]
        state.next = (state.next + 1) % GLITCH_PIECES
        piece.t0 = t0
        piece.t1 = Math.max(t0 + 0.004, t1)
        piece.kind = kind
        piece.speed = kind === GLITCH_REVERSE ? -1 : frame.meter('speed') || 1
        piece.step = Math.max(0, number - 1)
        piece.slice = first ? slice : (state.current?.slice ?? slice)
        state.lastAt = now
        return piece
      }
      const ended = (at: number): void => {
        if (!state.current) return
        state.endedKind = state.current.kind
        state.endedAt = at
        state.current = null
      }
      if (next < 0 && kind === 0) {
        // Asleep, or nothing read yet: no clock runs.
        state.cut = null
        ended(now)
      } else {
        const cut = now + Math.max(0, next)
        // The cut that was coming is where whatever starts now began.
        // (Not a cut from before the display stopped being drawn for a while.)
        const due = state.cut !== null ? Math.min(state.cut, now) : now
        const was = now - due > 0.25 ? now : due
        // A reading is a little late, by no fixed amount: a cut that moved less than this is the same cut.
        const moved = state.cut === null || cut > state.cut + Math.min(0.04, 0.6 * slice)
        if (kind === 0) {
          if (state.current) {
            state.current.t1 = was
            ended(was)
            tick(was)
            state.cut = cut
          } else if (moved) {
            if (state.cut !== null) tick(was)
            state.cut = cut
          } else {
            state.cut = Math.min(state.cut ?? cut, cut)
          }
        } else if (events !== state.events || !state.current) {
          // An event starts where the slice ended.
          if (state.current) state.current.t1 = was
          tick(was)
          state.current = begin(was, cut, true)
          state.count = Math.max(1, Math.round(frame.meter('count')))
          state.cut = cut
        } else if (number !== state.piece || moved) {
          // Its next piece, or the second half of a repeat played twice as fast.
          state.current.t1 = was
          state.current = begin(was, cut, false)
          state.cut = cut
        } else {
          state.cut = Math.min(state.cut ?? cut, cut)
          state.current.t1 = Math.max(state.current.t0 + 0.004, state.cut)
        }
        state.piece = number
      }
      state.events = events
    }
    const live = frame.powered && now - state.lastAt < GLITCH_SPAN_SEC

    // --- The picture ---
    const xOf = (t: number): number => nowX + t * perSec
    const fade = glitchFadeSec(calm)
    const block = (piece: GlitchPiece, from: number, how: 'past' | 'now' | 'next'): void => {
      const x0 = xOf(piece.t0 - from)
      const x1 = xOf(piece.t1 - from)
      if (x1 < box.x || x0 > box.x + box.w || piece.kind === 0) return
      // A piece to come that is too short to be seen as one is left out.
      if (how === 'next' && x1 - x0 < 2) return
      const length = piece.t1 - piece.t0
      const height = Math.max(2, full * glitchGain(piece.kind, piece.step, decay))
      // Calm slopes the two ends: the splice, never more than half the piece.
      const lean = Math.min(fade, 0.5 * length) * perSec
      ctx.beginPath()
      ctx.moveTo(x0, base)
      ctx.lineTo(x0 + lean, base - height)
      ctx.lineTo(x1, base - height)
      ctx.lineTo(x1 + lean, base)
      ctx.closePath()
      if (how === 'next') {
        ctx.globalAlpha = INK.back
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
        return
      }
      // What the device did is in the second colour; what the settings would give, at rest, in ink.
      ctx.globalAlpha = how === 'now' ? 0.9 : live ? 0.5 : INK.fill * 1.6
      ctx.fillStyle = live ? colours.accent : colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
      if (x1 - x0 < 2.5) return
      // Where it reads: one point a pixel or two where the line bends, its two ends where it is straight.
      const bends = piece.kind === GLITCH_HALF || piece.kind === GLITCH_STOP
      const steps = bends ? clamp(Math.ceil((x1 - x0) / 2), 2, 60) : 1
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const x = lerp(x0, x1, i / steps)
        const y = base - height * clamp(glitchRead(piece, (i / steps) * length, calm), 0, 1)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1.25
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    const pieces = live ? state.pieces : state.example
    const from = live ? now : 0
    if (!live) {
      let same = true
      for (let i = 0; i < GLITCH_PARAMS.length; i++) {
        const value = frame.value(GLITCH_PARAMS[i])
        if (state.exampleOf[i] !== value) same = false
        state.exampleOf[i] = value
      }
      if (!same) glitchExample(frame, state.example, state.exampleTicks)
    }

    // The foot the blocks stand on, and the slice clock along it: what has been, and fainter what is to come.
    rule(ctx, box.x, base, box.x + box.w, base, { colour: colours.ink, alpha: INK.rule })
    if (slice * perSec >= 3) {
      const tickAt = (t: number): void => {
        const x = Math.round(xOf(t))
        if (x >= box.x && x <= box.x + box.w) ctx.fillRect(x, base - GLITCH_TICK, 1, GLITCH_TICK)
      }
      ctx.fillStyle = colours.ink
      if (live) {
        ctx.globalAlpha = INK.back
        for (const at of state.ticks) if (Number.isFinite(at)) tickAt(at - now)
        // The slices to come, if nothing happens: from the next cut on.
        ctx.globalAlpha = INK.rule
        if (state.cut !== null && !state.current) {
          for (let t = Math.max(0, state.cut - now); xOf(t) <= box.x + box.w; t += slice) tickAt(t)
        }
      } else {
        for (const at of state.exampleTicks) {
          ctx.globalAlpha = at <= 0 ? INK.back : INK.rule
          tickAt(at)
        }
      }
      ctx.globalAlpha = 1
    }

    clipped(ctx, { x: box.x, y: box.y, w: box.w, h: box.h + 1 }, () => {
      for (const piece of pieces) {
        if (piece.kind === 0) continue
        const ahead = !live && piece.t0 > 0
        block(piece, from, ahead ? 'next' : live && piece === state.current ? 'now' : 'past')
      }
      // What the event has still to play: its repeats or its stuck loops, as it will make them.
      const current = live ? state.current : null
      if (current && (current.kind === GLITCH_REPEAT || current.kind === GLITCH_SKIP)) {
        const pending = state.pending
        pending.kind = current.kind
        pending.speed = current.speed
        pending.slice = current.slice
        let t = current.t1
        for (let step = current.step + 1; step < state.count; step++) {
          const length =
            current.kind === GLITCH_REPEAT
              ? glitchRepeatSec(current.slice, step, bounce)
              : current.t1 - current.t0
          pending.t0 = t
          pending.t1 = t + length
          pending.step = step
          block(pending, now, 'next')
          t += length
        }
      }
    })

    // Now, and the place the device is reading in the piece that plays.
    rule(ctx, nowX, box.y, nowX, base + 1, { colour: colours.ink, alpha: INK.rule })
    if (live && state.current) {
      const piece = state.current
      const height = Math.max(2, full * glitchGain(piece.kind, piece.step, decay))
      const read = clamp(
        glitchRead(piece, clamp(now - piece.t0, 0, piece.t1 - piece.t0), calm),
        0,
        1,
      )
      dot(ctx, nowX, base - height * read, 2.5, colours.accent, { ring: colours.ink })
    }
    // What is playing, in a word; it stays a moment after, fainter, so a short event can be read.
    const playing = live && state.current !== null
    const naming = playing
      ? (state.current?.kind ?? 0)
      : live && now - state.endedAt < GLITCH_WORD_SEC
        ? state.endedKind
        : 0
    const word = GLITCH_WORDS[naming] ?? ''
    if (word) {
      // Beside the mark for now where it fits, else against the right edge: never cut off.
      ctx.font = `8px ${frame.fontFamily}`
      const fits = nowX + 6 + ctx.measureText(word).width <= box.x + box.w
      text(frame, word, fits ? nowX + 6 : box.x + box.w, box.y + 7, {
        align: fits ? 'left' : 'right',
        alpha: playing ? 1 : INK.back,
      })
    }
    // One slice, measured back from now.
    const handles = glitchHandles(frame)
    rule(ctx, handles[0].x, handles[0].y, nowX, handles[0].y, {
      colour: colours.ink,
      alpha: INK.back,
    })
    for (const point of handles) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 3 })
    }
  },
  handles: glitchHandles,
})

// --- Spectral Blur ----------------------------------------------------------
//
// The spectrum of what comes out, with the part of it that is hanging (bins
// the input has let go of and the device holds on to) in the second colour:
// the device reports the held share of each half decade, and the colour is as
// strong as that share, graded from the middle of one half decade to the
// middle of the next so that no edge shows where none is in the sound. Over
// it the tone the blur is given, and along the top how long a let-go bin
// takes to die away.

/** `spectral_blur.h`: a held bin falls 60 dB in 20 s × Blur³. */
const BLUR_MAX_SEC = 20
/** Tilt turns about 1 kHz and lifts by 12 dB at the most; it cuts by 60. */
const BLUR_PIVOT_HZ = 1000
const BLUR_MAX_BOOST_DB = 12
const BLUR_MAX_CUT_DB = -60
/** The scale the tone curve is drawn on, and the one the spectrum behind it is. */
const BLUR_TOP_DB = 18
const BLUR_FOOT_DB = -36
const BLUR_SPECTRUM_FOOT_DB = -84
/** The half decades from 20 Hz the device reports its held share in, and the meters they come by. */
const BLUR_BANDS = 6
const BLUR_METERS = ['hang1', 'hang2', 'hang3', 'hang4', 'hang5', 'hang6'] as const
/** The strongest the second colour gets over the spectrum: where all of a band is held. */
const BLUR_HELD_ALPHA = 0.9
/** Where on the tilted line the point that tilts it sits: two octaves above the pivot. */
const BLUR_TILT_AT_HZ = 4000
/** The marks on the ruler of hang times, seconds. */
const BLUR_RULER_SEC = [0.1, 1, 5, 10, 20]

/** How long a bin the input has let go of takes to fall 60 dB, in seconds. */
export const blurHangSec = (blur: number): number => BLUR_MAX_SEC * blur * blur * blur

/** Where a hang time stands along the ruler, 0..1: the ruler is the Blur knob's own travel. */
const blurRulerAt = (seconds: number): number => Math.cbrt(clamp(seconds / BLUR_MAX_SEC, 0, 1))

/** The tilt alone at a frequency, in dB: `update_shape()` before the cuts. */
export function blurTiltDb(hz: number, tilt: number): number {
  return clamp(tilt * Math.log2(hz / BLUR_PIVOT_HZ), BLUR_MAX_CUT_DB, BLUR_MAX_BOOST_DB)
}

/**
 * The gain the wet sound is given at a frequency, in dB: the tilt, and the
 * two cuts as `update_shape()` makes them, raised-cosine steps half an octave
 * wide that are off at the ends of their ranges.
 */
export function blurShapeDb(
  hz: number,
  tilt: number,
  lowCut: number,
  highCut: number,
  lowMin = 20,
  highMax = 20000,
): number {
  const octave = Math.log2(hz / BLUR_PIVOT_HZ)
  let gain = 1
  if (lowCut > lowMin * 1.02) {
    const x = clamp((octave - Math.log2(lowCut / BLUR_PIVOT_HZ)) * 2 + 0.5, 0, 1)
    gain *= x * x * (3 - 2 * x)
  }
  if (highCut < highMax * 0.98) {
    const x = clamp((Math.log2(highCut / BLUR_PIVOT_HZ) - octave) * 2 + 0.5, 0, 1)
    gain *= x * x * (3 - 2 * x)
  }
  return blurTiltDb(hz, tilt) + gainToDb(gain)
}

interface BlurLayout {
  /** The ruler of hang times along the top. */
  ruler: Box
  /** The spectrum and the tone curve. */
  box: Box
}

function blurLayout(view: Pick<DisplayView, 'width' | 'height'>): BlurLayout {
  return {
    ruler: { x: 6, y: 4, w: view.width - 12, h: 8 },
    box: { x: 4, y: 17, w: view.width - 8, h: view.height - 21 },
  }
}

const blurY = (db: number, box: Box): number =>
  clamp(yOfDb(db, box, BLUR_TOP_DB, BLUR_FOOT_DB), box.y, box.y + box.h)

function blurHandles(view: DisplayView): DisplayHandle[] {
  const { ruler, box } = blurLayout(view)
  const tilt = view.value('tilt')
  const low = view.spec('lowCut')
  const high = view.spec('highCut')
  const cut = (param: 'lowCut' | 'highCut', name: string, on: boolean): DisplayHandle => {
    const spec = param === 'lowCut' ? low : high
    const hz = view.value(param)
    return {
      key: param,
      name,
      x: xOfHz(hz, box),
      // On the curve: a cut is 6 dB down at its own frequency, and on the tilted line while it is off.
      y: blurY(blurTiltDb(hz, tilt) + (on ? gainToDb(0.5) : 0), box),
      drag: (x) => ({ [param]: clamp(hzOfX(x, box), spec?.min ?? 20, spec?.max ?? 20000) }),
      reset: () => ({ [param]: spec?.default ?? hz }),
    }
  }
  const octaves = Math.log2(BLUR_TILT_AT_HZ / BLUR_PIVOT_HZ)
  const tiltSpec = view.spec('tilt')
  return [
    {
      key: 'blur',
      name: 'Hang time',
      x: ruler.x + clamp(view.value('blur'), 0, 1) * ruler.w,
      y: ruler.y + ruler.h / 2,
      drag: (x) => ({ blur: clamp((x - ruler.x) / ruler.w, 0, 1) }),
      reset: () => ({ blur: view.spec('blur')?.default ?? 0.6 }),
    },
    cut('lowCut', 'Low cut', view.value('lowCut') > (low?.min ?? 20) * 1.02),
    cut('highCut', 'High cut', view.value('highCut') < (high?.max ?? 20000) * 0.98),
    {
      key: 'tilt',
      name: 'Tilt',
      x: xOfHz(BLUR_TILT_AT_HZ, box),
      y: blurY(tilt * octaves, box),
      drag: (_x, y) => ({
        tilt: clamp(
          dbOfY(y, box, BLUR_TOP_DB, BLUR_FOOT_DB) / octaves,
          tiltSpec?.min ?? -6,
          tiltSpec?.max ?? 6,
        ),
      }),
      reset: () => ({ tilt: tiltSpec?.default ?? 0 }),
    },
  ]
}

interface BlurState {
  /** The held share of each half decade, eased so it does not flicker. */
  hang: Float32Array
  /** The spectrum's points, written again on every frame. */
  spectrum: Spot[]
  /** The tone curve and the tilt alone, and the settings and size they were worked out for. */
  tone: Point[]
  tiltLine: Point[]
  toneOf: [tilt: number, lowCut: number, highCut: number, width: number, height: number]
}

/**
 * The held share at a place across the spectrum, 0..1 of its width: each half
 * decade's share stands at its middle and runs straight to the next one's.
 */
export function blurHeldAt(hang: ArrayLike<number>, across: number): number {
  const at = clamp(across * BLUR_BANDS - 0.5, 0, BLUR_BANDS - 1)
  const below = Math.floor(at)
  const above = Math.min(BLUR_BANDS - 1, below + 1)
  return lerp(hang[below], hang[above], at - below)
}

const spectralBlur = plateDisplay<BlurState>({
  place: 'window',
  columns: 2,
  params: ['blur', 'freeze', 'tilt', 'lowCut', 'highCut'],
  live: { meters: true, spectrum: true },
  info: 'The spectrum of what comes out, from 20 Hz to 20 kHz, in the second colour where the sound is hanging on after the playing let it go. The line is the tone of the blur, with points for the two cuts and the tilt. The wedge along the top is how long the spectrum hangs: drag its tip.',
  init: () => ({
    hang: new Float32Array(BLUR_BANDS),
    spectrum: [],
    tone: [],
    tiltLine: [],
    toneOf: [Number.NaN, 0, 0, 0, 0],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { ruler, box } = blurLayout(frame)
    const foot = box.y + box.h
    const blur = clamp(frame.value('blur'), 0, 1)
    const frozen = frame.value('freeze') >= 0.5
    const tilt = frame.value('tilt')
    const lowCut = frame.value('lowCut')
    const highCut = frame.value('highCut')
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('hang1')

    for (let band = 0; band < BLUR_BANDS; band++) {
      const reading = running ? clamp(frame.meter(BLUR_METERS[band]), 0, 1) : 0
      state.hang[band] = running ? follow(state.hang[band], reading, frame.dt, 0.05, 0.15) : 0
    }

    freqGrid(frame, box)
    rule(ctx, box.x, blurY(0, box), box.x + box.w, blurY(0, box), {
      colour: colours.ink,
      alpha: INK.grid,
    })

    // The spectrum: one point a column, the loudest bin in it, read between bins low down.
    const bins = frame.signal?.spectrum
    const binHz = frame.signal?.binHz ?? 0
    let shown = false
    if (bins && binHz > 0) {
      const columns = Math.max(2, Math.floor(box.w / 2))
      if (state.spectrum.length !== columns + 1) state.spectrum = spots(columns + 1)
      const points = state.spectrum
      let any = false
      for (let c = 0; c <= columns; c++) {
        const from = hzOfX(box.x + ((c - 0.5) / columns) * box.w, box)
        const to = hzOfX(box.x + ((c + 0.5) / columns) * box.w, box)
        let db = Number.NEGATIVE_INFINITY
        if (to - from < binHz) {
          const at = clamp((from + to) / 2 / binHz, 1, bins.length - 1)
          const below = Math.floor(at)
          db = lerp(bins[below], bins[Math.min(bins.length - 1, below + 1)], at - below)
        } else {
          const first = clamp(Math.ceil(from / binHz), 1, bins.length - 1)
          const last = clamp(Math.floor(to / binHz), first, bins.length - 1)
          for (let i = first; i <= last; i++) if (bins[i] > db) db = bins[i]
        }
        if (!Number.isFinite(db)) db = BLUR_SPECTRUM_FOOT_DB
        if (db > BLUR_SPECTRUM_FOOT_DB) any = true
        points[c][0] = box.x + (c / columns) * box.w
        points[c][1] = clamp(yOfDb(db, box, 0, BLUR_SPECTRUM_FOOT_DB), box.y, foot)
      }
      shown = any
      if (any) {
        fillTo(ctx, points, foot, colours.ink, INK.fill * 1.5)
        // What hangs: the spectrum again in the second colour, a pixel column
        // at a time, each as strong as the share that is held there.
        const span = box.w / columns
        ctx.fillStyle = colours.accent
        for (let x = 0; x < box.w; x++) {
          const share = blurHeldAt(state.hang, (x + 0.5) / box.w)
          if (share < 0.02) continue
          const at = (x + 0.5) / span
          const c = Math.min(columns - 1, Math.floor(at))
          const top = lerp(points[c][1], points[c + 1][1], at - c)
          if (foot - top < 0.25) continue
          ctx.globalAlpha = BLUR_HELD_ALPHA * share
          ctx.fillRect(box.x + x, top, 1, foot - top)
        }
        ctx.globalAlpha = 1
        trace(ctx, points, { colour: colours.ink, width: 1, alpha: INK.back })
      }
    }

    // The tone the blur is given: the tilt alone dashed, and with the cuts in
    // full. It moves only when a setting does, so it is worked out only then.
    const of = state.toneOf
    if (
      of[0] !== tilt ||
      of[1] !== lowCut ||
      of[2] !== highCut ||
      of[3] !== frame.width ||
      of[4] !== frame.height
    ) {
      const lowMin = frame.spec('lowCut')?.min ?? 20
      const highMax = frame.spec('highCut')?.max ?? 20000
      state.tone = responsePoints(
        box,
        (hz) => blurShapeDb(hz, tilt, lowCut, highCut, lowMin, highMax),
        BLUR_TOP_DB,
        BLUR_FOOT_DB,
      )
      state.tiltLine = responsePoints(box, (hz) => blurTiltDb(hz, tilt), BLUR_TOP_DB, BLUR_FOOT_DB)
      of[0] = tilt
      of[1] = lowCut
      of[2] = highCut
      of[3] = frame.width
      of[4] = frame.height
    }
    clipped(ctx, box, () => {
      // With no sound to show, what the tone lets through.
      if (!shown) fillTo(ctx, state.tone, foot, colours.ink, INK.fill)
      trace(ctx, state.tiltLine, { colour: colours.ink, width: 1, alpha: INK.back, dash: [2, 2] })
      trace(ctx, state.tone, { colour: colours.ink })
    })

    // The hang time: a ruler of seconds, and a wedge as long as a let-go bin takes to die.
    const base = ruler.y + ruler.h
    rule(ctx, ruler.x, base, ruler.x + ruler.w, base, { colour: colours.ink, alpha: INK.rule })
    for (const seconds of BLUR_RULER_SEC) {
      const x = ruler.x + blurRulerAt(seconds) * ruler.w
      rule(ctx, x, base - 2, x, base + 2, { colour: colours.ink, alpha: INK.rule })
    }
    const seconds = blurHangSec(blur)
    const tip = ruler.x + blur * ruler.w
    if (frozen) {
      // Frozen, nothing dies away: the whole ruler, at full height.
      fillRect(ctx, { x: ruler.x, y: ruler.y, w: ruler.w, h: ruler.h }, colours.accent, 0.9)
    } else if (tip > ruler.x + 0.5) {
      ctx.beginPath()
      ctx.moveTo(ruler.x, ruler.y)
      ctx.lineTo(tip, base)
      ctx.lineTo(ruler.x, base)
      ctx.closePath()
      ctx.globalAlpha = 0.85
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
    }
    const words = frozen
      ? 'FROZEN'
      : `${seconds < 9.95 ? seconds.toFixed(1) : Math.round(seconds)} s`
    const handles = blurHandles(frame)
    if (frozen) {
      // On the side of the point with the more room.
      const left = tip > ruler.x + ruler.w / 2
      text(frame, words, left ? ruler.x + 3 : ruler.x + ruler.w - 3, ruler.y + 7, {
        align: left ? 'left' : 'right',
        colour: colours.plate,
        alpha: 1,
      })
    } else {
      // Right of the tip while there is room; else left of it, clear of the wedge's thick end.
      ctx.font = `8px ${frame.fontFamily}`
      const right = tip + 7 + ctx.measureText(words).width <= ruler.x + ruler.w
      text(frame, words, right ? tip + 7 : tip - 7, ruler.y + 6, {
        align: right ? 'left' : 'right',
      })
    }
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    // The point in hand, in words.
    if (frame.hot && frame.hot !== 'blur') {
      const hot = handles.find((point) => point.key === frame.hot)
      if (hot) {
        const value =
          hot.key === 'tilt'
            ? `${tilt > 0 ? '+' : tilt < 0 ? '−' : ''}${Math.abs(tilt).toFixed(1)} dB/oct`
            : hzText(frame.value(hot.key))
        // Along the top of the picture, over what the curve can reach and
        // the spectrum seldom does, at the end away from the point itself.
        const left = hot.x > box.x + box.w / 2
        text(frame, `${hot.name}  ${value}`, left ? box.x + 3 : box.x + box.w - 3, box.y + 7.5, {
          align: left ? 'left' : 'right',
        })
      }
    }
  },
  handles: blurHandles,
})

// --- Cascade ----------------------------------------------------------------
//
// Cascade cuts what is played into slices, one every Time, and plays each
// slice again as a set of little loops at octave (and fifth) speeds. The
// display is the score of those loops: time runs across with a mark for now,
// the speeds are the rows, and every pass of a loop is a hill as long as it
// sounds, as tall as it is loud and shaped as its window is. The device
// reports each slice as it catches it, and the passes are worked out from
// there by the same schedule the device follows. The slice caught last is
// drawn in full; the ones before it, still playing out, lie behind it as one
// faint shape, so that the picture is of what was just caught and not a
// thicket; whatever sounds now, of any slice, is in the second colour.

/** `cascade.h`: the patterns, and the constants their passes are made with. */
const CASCADE_STACK = 0
const CASCADE_RESTRIKE = 1
const CASCADE_DRONE = 2
const CASCADE_STEPS = 3
const CASCADE_MAX_LIFE_SEC = 18
const CASCADE_GUARD_SEC = 0.0035
const CASCADE_ATTACK_SEC = 0.002
/** The speeds of a Stack's parts, and the accents its passes are given in turn. */
const CASCADE_STACK_SPEED = [1, 2, 4, 0.5, 1.5, 3]
const CASCADE_ACCENT_FOUR = [0.8, 1.15, 0.95, 1.1]
const CASCADE_ACCENT_THREE = [0.9, 1.1, 1.0]
/** The speeds Steps goes through, one a repeat. */
const CASCADE_STEPS_OCTAVES = [1, 2, 4, 2]
const CASCADE_STEPS_FIFTHS = [1, 1.5, 2, 3, 4, 3, 2, 1.5]
/** Decay 1 takes 12 dB off every repeat: `repeat_gain()`. */
const CASCADE_DECAY = 1.3815511
/** How far down a hill's height reaches: a pass this quiet is a line. */
const CASCADE_FOOT_DB = -40
/** Slices kept, the most passes one makes, and the numbers kept for each pass. */
const CASCADE_KEPT = 24
const CASCADE_PASSES = 288
const CASCADE_STRIDE = 6
/** Where now stands across the score. */
const CASCADE_NOW_AT = 0.2
/**
 * Room at the left for the names of the rows: as wide as the widest, 1.5. A
 * half is written .5: the one-glyph fraction sets its figures at half the
 * type's size, which at 8 px cannot be read.
 */
const CASCADE_GUTTER = 14
/** The rows by their speeds, with fifths and without. */
const CASCADE_ROWS_OCTAVES: readonly (readonly [number, string])[] = [
  [0.5, '.5'],
  [1, '1'],
  [2, '2'],
  [4, '4'],
]
const CASCADE_ROWS_FIFTHS: readonly (readonly [number, string])[] = [
  [0.5, '.5'],
  [1, '1'],
  [1.5, '1.5'],
  [2, '2'],
  [3, '3'],
  [4, '4'],
]
/** How strongly the slice caught last is drawn, and the ones before it behind it. */
const CASCADE_NEWEST_ALPHA = 0.5
const CASCADE_BED_ALPHA = 0.2
/**
 * The most hills the earlier slices are given in one frame, newest first, and
 * the most points the curve of one of theirs has: what a draw costs is held
 * to this however many slices are still playing out.
 */
const CASCADE_BED_HILLS = 240
const CASCADE_BED_POINTS = 6
const CASCADE_HILL_POINTS = 16
/** The most passes that can be marked as sounding at once, and the numbers kept for each. */
const CASCADE_SOUNDING = 96
const CASCADE_MARK = 5

/** A slice as the device caught it, with the settings its voices were started with. */
export interface CascadeSlice {
  /** Its length and the pulse its replays fall on, seconds. */
  length: number
  period: number
  /** Where Steps had got to. */
  step: number
  /** Every other slice: Restrike runs its strokes the other way round. */
  flip: boolean
  pattern: number
  repeats: number
  fifths: boolean
  high: boolean
  low: boolean
}

/**
 * Every pass a slice is replayed in, as `capture()` starts the parts and
 * `start_pass()` schedules them: when it starts (seconds after the voices
 * do), how long it sounds, its speed, its age in repeats (what Decay counts),
 * its accent and trim, and the share of it that is the window's rise at full
 * Shape. Drone cuts its piece to whole cycles of the sound, which only the
 * device knows: here it has the length the device aims for.
 */
export function cascadePasses(
  slice: CascadeSlice,
  visit: (
    start: number,
    run: number,
    speed: number,
    age: number,
    level: number,
    swell: number,
  ) => void,
): void {
  const { length, period, repeats, fifths, pattern } = slice
  const droneStart = Math.min(0.1 * length, 0.02)
  const droneMost = 0.5 * (length - droneStart) - 8 / 48000
  const droneHalf = (k: number): number =>
    Math.max(16 / 48000, Math.min(Math.max(0.125 * period, 0.015) * (1 + 0.12 * k), droneMost))
  const part = (index: number, trim: number, delay = 0): void => {
    let elapsed = 0
    for (let k = 0; k < CASCADE_PASSES; k++) {
      let speed = 1
      let read = length
      let grid = period
      let accent = 1
      let swell = 0.5
      let age = elapsed / period
      if (pattern === CASCADE_RESTRIKE) {
        // The start of the slice, struck once a repeat, the gaps a bouncing ball's.
        if (k >= repeats) return
        speed = index === 2 ? 0.5 : index === 1 ? (fifths && !(k & 1) ? 1.5 : 2) : 1
        const piece = Math.min(length, clamp(period / 3, 0.03, 0.25))
        let run = piece / speed
        if (k < repeats - 1) {
          const gaps = repeats - 1
          let gap = 0.5 * period
          if (gaps >= 2) gap *= Math.pow(2, (-2 * (slice.flip ? gaps - 1 - k : k)) / (gaps - 1))
          gap = Math.max(gap, 0.012)
          run = Math.min(run, gap)
          grid = gap
        } else {
          grid = run
        }
        read = run * speed
        age = k
      } else if (pattern === CASCADE_DRONE) {
        // A piece of the slice looped, each pass 12 % longer, until Repeats × Time is up.
        if (elapsed >= repeats * period) return
        const half = droneHalf(k)
        speed = index === 3 ? 0.5 : index === 2 ? (fifths ? 1.5 : 2) : 1
        if (index === 1) {
          const next = droneHalf(k + 1)
          read = half + next
          swell = half / (half + next)
        } else {
          read = 2 * half
        }
        grid = read / speed
      } else if (pattern === CASCADE_STEPS) {
        // Each repeat at the next speed; the half-speed part every other one.
        if (index === 1) {
          if (k >= (repeats + 1) >> 1) return
          speed = 0.5
          grid = 2 * period
        } else {
          if (k >= repeats) return
          const step = slice.step + k
          speed = fifths ? CASCADE_STEPS_FIFTHS[step & 7] : CASCADE_STEPS_OCTAVES[step & 3]
        }
      } else {
        // Stack: the whole slice at the part's speed, back to back.
        speed = CASCADE_STACK_SPEED[index]
        grid = period / speed
        if (k >= (index === 3 ? (repeats + 1) >> 1 : Math.floor(repeats * speed + 0.5))) return
        if (index === 1) accent = k & 1 ? 1.1 : 0.9
        else if (index === 2) accent = CASCADE_ACCENT_FOUR[k & 3]
        else if (index === 4) accent = CASCADE_ACCENT_THREE[k % 3]
        else if (index === 5) accent = CASCADE_ACCENT_THREE[(k + 1) % 3]
      }
      const run = read / speed
      if (elapsed + run > CASCADE_MAX_LIFE_SEC) return
      visit(delay + elapsed, Math.min(run, grid), speed, age, accent * trim, swell)
      elapsed += grid
    }
  }
  part(0, pattern === CASCADE_STACK ? 0.85 : 1)
  if (pattern === CASCADE_RESTRIKE) {
    if (slice.high) part(1, 1)
    if (slice.low) part(2, 1)
  } else if (pattern === CASCADE_DRONE) {
    // The second voice starts in the middle of the first one's first pass.
    part(1, 1, droneHalf(0))
    if (slice.high) part(2, 1)
    if (slice.low) part(3, 1)
  } else if (pattern === CASCADE_STEPS) {
    if (slice.low) part(1, 1)
  } else {
    // With fifths there are four parts above instead of two, each 3 dB down.
    const each = fifths ? Math.SQRT1_2 : 1
    if (slice.high) {
      part(1, each)
      part(2, each)
      if (fifths) {
        part(4, each)
        part(5, each)
      }
    }
    if (slice.low) part(3, 1)
  }
}

/** How loud a pass is against the slice it replays: Decay by its age, its accent, and High or Low by its speed. */
export function cascadeGain(
  age: number,
  level: number,
  speed: number,
  decay: number,
  high: number,
  low: number,
): number {
  return Math.exp(-CASCADE_DECAY * decay * age) * level * (speed > 1 ? high : speed < 1 ? low : 1)
}

/**
 * A pass's window at `phase` (0..1) of it, as `render()` shapes it: a smooth
 * rise over `attack` of the pass, then a fall that Shape turns from a steep
 * one into the same curve as the rise.
 */
export function cascadeWindow(phase: number, attack: number, shape: number): number {
  if (phase < attack) {
    const t = phase / attack
    return t * t * (3 - 2 * t)
  }
  const t = clamp((phase - attack) / (1 - attack), 0, 1)
  const fall = 1 - t * t * (3 - 2 * t)
  const steep = fall * fall * fall * fall
  return steep + shape * (fall - steep)
}

interface CascadeKept {
  /** When it was caught and when its voices started, on the frame clock. */
  at: number
  begin: number
  /** When its last pass ends. */
  end: number
  length: number
  /** Its passes: start, run, speed, age, level, swell each. */
  passes: Float32Array
  count: number
}

interface CascadeState {
  kept: CascadeKept[]
  next: number
  /** The device's slice count at the last reading. */
  slices: number | null
  /** The slice the settings would make, for when none has been caught, and the settings it was made from. */
  example: CascadeKept
  exampleKey: number
  exampleTime: number
  /** The passes under the mark for now: left, right, row, height, rise each. */
  sounding: Float32Array
  /** The words for how long a cascade is, and what they were made from. */
  words: string
  wordsRepeats: number
  wordsMs: number
}

const emptySlice = (): CascadeKept => ({
  at: Number.NEGATIVE_INFINITY,
  begin: 0,
  end: Number.NEGATIVE_INFINITY,
  length: 0,
  passes: new Float32Array(CASCADE_PASSES * CASCADE_STRIDE),
  count: 0,
})

function keepSlice(kept: CascadeKept, slice: CascadeSlice, at: number, begin: number): void {
  kept.at = at
  kept.begin = begin
  kept.length = slice.length
  kept.count = 0
  let last = 0
  const passes = kept.passes
  cascadePasses(slice, (start, run, speed, age, level, swell) => {
    if (kept.count >= CASCADE_PASSES) return
    const to = kept.count * CASCADE_STRIDE
    passes[to] = start
    passes[to + 1] = run
    passes[to + 2] = speed
    passes[to + 3] = age
    passes[to + 4] = level
    passes[to + 5] = swell
    kept.count += 1
    last = Math.max(last, start + run)
  })
  kept.end = begin + last
}

/**
 * One pass as a hill on its row, added to the path: up the window's rise to
 * its top, which is always a point of its own so that a short rise is never
 * stepped over, and down its fall in at most `most` pieces.
 */
function cascadeHill(
  ctx: DisplayFrame['ctx'],
  x0: number,
  x1: number,
  base: number,
  height: number,
  attack: number,
  shape: number,
  most: number,
): void {
  const width = x1 - x0
  const rise = attack * width
  ctx.moveTo(x0, base)
  if (rise >= 4) {
    for (let i = 1; i < 4; i++) {
      const phase = (attack * i) / 4
      ctx.lineTo(x0 + phase * width, base - height * cascadeWindow(phase, attack, shape))
    }
  }
  ctx.lineTo(x0 + rise, base - height)
  if (width - rise >= 3) {
    const steps = clamp(Math.ceil((width - rise) / 2), 3, most)
    for (let i = 1; i < steps; i++) {
      const phase = attack + ((1 - attack) * i) / steps
      ctx.lineTo(x0 + phase * width, base - height * cascadeWindow(phase, attack, shape))
    }
  }
  ctx.lineTo(x1, base)
  ctx.closePath()
}

const cascade = plateDisplay<CascadeState>({
  place: 'window',
  columns: 2,
  params: ['pattern', 'time', 'repeats', 'decay', 'high', 'low', 'interval', 'shape'],
  live: { meters: true },
  info: 'The score of the replays: time runs across past the mark for now, and each row is a speed, from half at the bottom to four times at the top. Each hill is one pass of a loop, as long as it sounds and as tall as it is loud, coloured while it sounds. The blocks along the foot are the slices caught.',
  init: () => ({
    kept: Array.from({ length: CASCADE_KEPT }, emptySlice),
    next: 0,
    slices: null,
    example: emptySlice(),
    exampleKey: Number.NaN,
    exampleTime: Number.NaN,
    sounding: new Float32Array(CASCADE_SOUNDING * CASCADE_MARK),
    words: '',
    wordsRepeats: Number.NaN,
    wordsMs: Number.NaN,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const now = frame.now
    const pattern = clamp(Math.round(frame.value('pattern')), 0, 3)
    const time = Math.max(0.02, frame.value('time') * 0.001)
    const repeats = clamp(Math.round(frame.value('repeats')), 1, 16)
    const decay = frame.value('decay')
    const high = frame.value('high')
    const low = frame.value('low')
    const fifths = frame.value('interval') > 0.5
    const shape = frame.value('shape')
    const highOn = high > 0.001
    const lowOn = low > 0.001

    // --- What the device reports: a slice, each time its count steps ---
    const running = frame.powered && frame.dt > 0 && frame.hasMeter('slices')
    const slot = running ? frame.meter('slot') : 0
    if (running) {
      const slices = frame.meter('slices')
      if (state.slices !== null && slices !== state.slices && frame.meter('period') > 0) {
        // It was caught where the slot now being recorded began, if that one has begun.
        const at = now - (slot > 0 && slot < 0.1 ? slot : 0)
        const kept = state.kept[state.next]
        state.next = (state.next + 1) % CASCADE_KEPT
        keepSlice(
          kept,
          {
            length: frame.meter('length'),
            period: frame.meter('period'),
            step: Math.round(frame.meter('step')),
            flip: ((Math.round(slices) - 1) & 1) !== 0,
            pattern,
            repeats,
            fifths,
            high: highOn,
            low: lowOn,
          },
          at,
          at + frame.meter('delay'),
        )
      }
      state.slices = slices
    }
    let live = frame.powered && slot > 0
    if (frame.powered) for (const kept of state.kept) if (kept.end > now) live = true
    // The slice the settings would make of one Time of sound: drawn when none is caught, and the measure of the scale.
    const exampleKey =
      pattern +
      4 * (repeats + 17 * ((fifths ? 1 : 0) + 2 * ((highOn ? 1 : 0) + 2 * (lowOn ? 1 : 0))))
    if (state.exampleKey !== exampleKey || state.exampleTime !== time) {
      keepSlice(
        state.example,
        {
          length: time - CASCADE_GUARD_SEC,
          period: time,
          step: 0,
          flip: false,
          pattern,
          repeats,
          fifths,
          high: highOn,
          low: lowOn,
        },
        0,
        0,
      )
      state.exampleKey = exampleKey
      state.exampleTime = time
    }

    // --- The picture ---
    const all: Box = { x: 4, y: 4, w: frame.width - 8, h: frame.height - 8 }
    const plot: Box = {
      x: all.x + CASCADE_GUTTER,
      y: all.y,
      w: all.w - CASCADE_GUTTER,
      h: all.h - 10,
    }
    const lane: Box = { x: plot.x, y: all.y + all.h - 7, w: plot.w, h: 7 }
    const nowX = Math.round(plot.x + plot.w * CASCADE_NOW_AT)
    // A whole cascade fits at the right of now: as long as the replays of one slice last.
    const whole = clamp(state.example.end, 0.3, CASCADE_MAX_LIFE_SEC)
    const perSec = (plot.x + plot.w - nowX) / (1.04 * whole)
    const tallest = fifths ? 11 : 17
    const rowsFoot = plot.y + plot.h - 3
    const perOctave = (rowsFoot - (plot.y + tallest + 1)) / 3
    const rowY = (speed: number): number => rowsFoot - Math.log2(2 * speed) * perOctave

    // The rows by their speeds, and the slice clock along the foot.
    for (const [speed, name] of fifths ? CASCADE_ROWS_FIFTHS : CASCADE_ROWS_OCTAVES) {
      const y = rowY(speed)
      const used = speed === 1 || (speed > 1 ? highOn : lowOn)
      rule(ctx, plot.x, y, plot.x + plot.w, y, { colour: colours.ink, alpha: INK.grid })
      text(frame, name, plot.x - 2, y, { align: 'right', alpha: used ? 1 : INK.back })
    }
    rule(ctx, lane.x, lane.y - 1, lane.x + lane.w, lane.y - 1, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    if (time * perSec >= 3) {
      ctx.globalAlpha = INK.rule
      ctx.fillStyle = colours.ink
      for (let t = 0; nowX + t * perSec <= plot.x + plot.w + 0.5; t += time) {
        ctx.fillRect(Math.round(nowX + t * perSec), lane.y - 3, 1, 2)
      }
      ctx.globalAlpha = 1
    }

    // A slice's passes as hills on their rows, added to the path that is
    // open; the ones under the mark are sounding and are kept for their own
    // colour. With `most` at 0 nothing is drawn and only those are looked for.
    const sounding = state.sounding
    let marked = 0
    const score = (kept: CascadeKept, from: number, most: number, marks: boolean): number => {
      const begin = kept.begin - from
      const passes = kept.passes
      let hills = 0
      for (let i = 0; i < kept.count; i++) {
        const at = i * CASCADE_STRIDE
        const t0 = begin + passes[at]
        const run = passes[at + 1]
        const mark = marks && t0 <= 0 && t0 + run > 0 && marked < CASCADE_SOUNDING
        if (most === 0 && !mark) continue
        const x0 = nowX + t0 * perSec
        const x1 = nowX + (t0 + run) * perSec
        if (x1 < plot.x || x0 > plot.x + plot.w) continue
        const speed = passes[at + 2]
        const gain = cascadeGain(passes[at + 3], passes[at + 4], speed, decay, high, low)
        if (gain < 0.0005) continue
        const height = Math.max(1, tallest * clamp(1 - gainToDb(gain) / CASCADE_FOOT_DB, 0, 1))
        const swell = passes[at + 5]
        const attack = lerp(Math.min(swell, CASCADE_ATTACK_SEC / Math.max(1e-4, run)), swell, shape)
        if (mark) {
          const to = marked * CASCADE_MARK
          sounding[to] = x0
          sounding[to + 1] = x1
          sounding[to + 2] = rowY(speed)
          sounding[to + 3] = height
          sounding[to + 4] = attack
          marked += 1
        } else {
          cascadeHill(ctx, x0, x1, rowY(speed), height, attack, shape, most)
          hills += 1
        }
      }
      return hills
    }
    const inked = (alpha: number): void => {
      ctx.globalAlpha = alpha
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
    }
    clipped(ctx, { x: plot.x, y: all.y, w: plot.w, h: all.h }, () => {
      if (live) {
        // What has gone off the left edge is no longer looked at.
        const gone = now - (nowX - plot.x) / perSec
        // The slices before the last one, newest first, as one faint shape.
        let hills = 0
        ctx.beginPath()
        for (let back = 2; back <= CASCADE_KEPT; back++) {
          const kept = state.kept[(state.next - back + 2 * CASCADE_KEPT) % CASCADE_KEPT]
          if (kept.end <= gone) continue
          hills += score(kept, now, hills < CASCADE_BED_HILLS ? CASCADE_BED_POINTS : 0, true)
        }
        if (hills > 0) inked(CASCADE_BED_ALPHA)
        // The slice caught last, in full.
        const newest = state.kept[(state.next - 1 + CASCADE_KEPT) % CASCADE_KEPT]
        if (newest.end > gone) {
          ctx.beginPath()
          if (score(newest, now, CASCADE_HILL_POINTS, true) > 0) inked(CASCADE_NEWEST_ALPHA)
        }
        if (marked > 0) {
          ctx.beginPath()
          for (let i = 0; i < marked * CASCADE_MARK; i += CASCADE_MARK) {
            cascadeHill(
              ctx,
              sounding[i],
              sounding[i + 1],
              sounding[i + 2],
              sounding[i + 3],
              sounding[i + 4],
              shape,
              CASCADE_HILL_POINTS,
            )
          }
          ctx.globalAlpha = 0.95
          ctx.fillStyle = colours.accent
          ctx.fill()
          ctx.globalAlpha = 1
        }
        // The slices themselves, where they were played.
        ctx.globalAlpha = INK.back
        ctx.fillStyle = colours.ink
        for (const kept of state.kept) {
          if (kept.at <= gone) continue
          const x1 = nowX + (kept.at - now) * perSec
          const x0 = x1 - kept.length * perSec
          ctx.fillRect(x0 + 0.5, lane.y + 1, x1 - x0 - 1, lane.h - 1)
        }
        ctx.globalAlpha = 1
        // The slot being recorded, up to now.
        if (slot > 0) {
          const x0 = nowX - Math.min(slot, time) * perSec
          fillRect(ctx, { x: x0, y: lane.y + 1, w: nowX - x0, h: lane.h - 1 }, colours.accent, 0.95)
        }
      } else {
        ctx.beginPath()
        if (score(state.example, 0, CASCADE_HILL_POINTS, false) > 0) inked(CASCADE_NEWEST_ALPHA)
        const x0 = nowX - time * perSec
        fillRect(
          ctx,
          { x: x0 + 0.5, y: lane.y + 1, w: nowX - x0 - 1, h: lane.h - 1 },
          colours.ink,
          INK.back,
        )
      }
    })

    rule(ctx, nowX, all.y, nowX, all.y + all.h, { colour: colours.ink, alpha: INK.rule })
    // How long a cascade is: so many repeats of so long.
    const ms = frame.value('time')
    if (state.wordsRepeats !== repeats || state.wordsMs !== ms) {
      state.words = `${repeats} × ${ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`}`
      state.wordsRepeats = repeats
      state.wordsMs = ms
    }
    text(frame, state.words, plot.x + plot.w, all.y + all.h - 0.5, { align: 'right' })
  },
})

export const TEXTURE_FACES: Readonly<Record<string, PlateFace>> = {
  cascade: {
    display: cascade,
    face: ['pattern', 'time', 'repeats', 'mix'],
  },
  'spectral-blur': {
    display: spectralBlur,
    face: ['blur', 'smear', 'freeze', 'mix'],
  },
  glitch: {
    display: glitch,
    face: ['time', 'chance', 'calm', 'mix'],
  },
  'grain-cloud': {
    display: grainCloud,
    face: ['size', 'density', 'spray', 'mix'],
  },
  sustainer: {
    display: sustainer,
    face: ['attack', 'decay', 'motion', 'mix'],
  },
  'pad-follower': {
    display: padFollower,
    face: ['rise', 'fall', 'brightness', 'mix'],
    labels: { brightness: 'Bright' },
  },
}
