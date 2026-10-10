// The display of Generations: what one pass through the room does to a sound,
// and what four and sixteen passes do, over frequency.
//
// The device is a loop that is recorded again through a small room on every
// pass. The room is a straight path and eight tuned band-passes beside it,
// trimmed so that each of its tones passes at exactly 1; everything between
// the tones passes at less, so pass after pass only the tones are left. That
// is the picture: the response of one pass as the line, the same response
// taken four and sixteen times as two shades under it. They are drawn with
// their tops level, as the device's level hold keeps them, so what is seen is
// the valleys sinking away from the tones.
//
// Live, in the second colour: the spectrum of what comes out, its strongest
// part set level with the tops so it can be laid against the three shapes;
// what a pass still takes from the sound (the device's third reading: the gain
// that makes up what the room took from all that is sounding), as a bar
// hanging from the tops; and where the record head is in the loop, along the
// foot.
//
// The numbers below are `cpp/devices/generations/generations.h`'s own: the
// names say which. A change there is a change here.

import {
  INK,
  clamp,
  clipped,
  dbOfY,
  fillRect,
  fillTo,
  follow,
  freqGrid,
  gainToDb,
  ground,
  handle,
  hzOfX,
  hzText,
  label,
  lerp,
  rule,
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

// --- The device's numbers ---------------------------------------------------

/** `kModeRatio`: the room's eight tones as multiples of its lowest. */
export const GENERATIONS_TONES = [1, 1.59, 2.03, 2.715, 3.18, 4.06, 4.934, 6.36] as const
/** `kSmallRoomHz` and `kLargeRoomHz`: the lowest tone at Room 0 and at Room 1. */
const SMALL_ROOM_HZ = 320
const LARGE_ROOM_HZ = 70
/** `kContrastDb`: how far under the tones the straight path lies at full Resonance. */
const CONTRAST_DB = 18
/** `kWideQ` and `kNarrowQ`: how narrow a tone is at Resonance 0 and at 1. */
const WIDE_Q = 6
const NARROW_Q = 24
/** `kOpenHz` and `kDampedHz`: where Damping's low pass turns at its least and at its most. */
const OPEN_HZ = 18000
const DAMPED_HZ = 900
/** `kLowCutHz`: the low cut every pass goes through. */
const LOW_CUT_HZ = 12
/** `kTrimRounds`: how many times round the eight gains are trimmed. */
const TRIM_ROUNDS = 3

/** The room's lowest tone for a Room setting: `room_hz()`. */
export function generationsRoomHz(room: number): number {
  return SMALL_ROOM_HZ * Math.pow(LARGE_ROOM_HZ / SMALL_ROOM_HZ, clamp(room, 0, 1))
}

/** The Room setting whose lowest tone is `hz`. */
function roomOfHz(hz: number): number {
  // Plus nothing: the logarithm of one is a zero with a minus sign.
  return clamp(Math.log(hz / SMALL_ROOM_HZ) / Math.log(LARGE_ROOM_HZ / SMALL_ROOM_HZ), 0, 1) + 0
}

/** How far the tones stand over the straight path at a Resonance, in dB. */
export const generationsContrastDb = (resonance: number): number =>
  CONTRAST_DB * clamp(resonance, 0, 1)

/** The room as the device sets it: the straight path's gain, and each band-pass's tuning and gain. */
export interface GenerationsRoom {
  direct: number
  /** One over Q, the same for all eight. */
  k: number
  /** Each tone's tuning: the tangent of half its angle at the sample rate. */
  g: readonly number[]
  gain: readonly number[]
}

/**
 * `tune()` and `peak_gains()` with both sides alike (Width 0; Width moves the
 * two sides apart by under one per cent, less than a pixel here).
 */
export function generationsRoom(
  room: number,
  resonance: number,
  sampleRate: number,
): GenerationsRoom {
  const amount = clamp(resonance, 0, 1)
  const low = generationsRoomHz(room)
  const direct = Math.pow(10, (-CONTRAST_DB * amount) / 20)
  const k = 1 / (WIDE_Q + (NARROW_Q - WIDE_Q) * amount)
  const g = GENERATIONS_TONES.map((ratio) =>
    Math.tan((Math.PI * clamp(low * ratio, 5, sampleRate * 0.49)) / sampleRate),
  )
  // Each tone stands on the straight path and on the skirts of the other
  // seven, so the gains are found by going round: each in turn is given what
  // its tone lacks of 1.
  const gain = g.map(() => 1 - direct)
  for (let round = 0; round < TRIM_ROUNDS; round++) {
    for (let j = 0; j < g.length; j++) {
      let re = direct
      let im = 0
      for (let n = 0; n < g.length; n++) {
        const x = g[j] / g[n]
        const p = 1 - x * x
        const q = x * k
        const scale = (gain[n] * q) / (p * p + q * q)
        re += q * scale
        im += p * scale
      }
      gain[j] += 1 - Math.hypot(re, im)
    }
  }
  return { direct, k, g, gain }
}

/**
 * What the room does to a frequency, in dB: 0 on each tone. A band-pass tuned
 * to g answers a frequency at tangent u with (q² + j·q·p) / (p² + q²), where
 * p = 1 − (u/g)² and q = (u/g) / Q.
 */
export function generationsRoomDb(room: GenerationsRoom, hz: number, sampleRate: number): number {
  const u = Math.tan((Math.PI * clamp(hz, 1, sampleRate * 0.49)) / sampleRate)
  let re = room.direct
  let im = 0
  for (let n = 0; n < room.g.length; n++) {
    const x = u / room.g[n]
    const p = 1 - x * x
    const q = x * room.k
    const scale = (room.gain[n] * q) / (p * p + q * q)
    re += q * scale
    im += p * scale
  }
  return gainToDb(Math.hypot(re, im))
}

/** Where Damping's low pass turns, in Hz. */
export function generationsDampingHz(damping: number): number {
  return OPEN_HZ * Math.pow(DAMPED_HZ / OPEN_HZ, clamp(damping, 0, 1))
}

/**
 * What Damping takes from a frequency on one pass, in dB: `kit::OnePole` with
 * its coefficient e^(−2π·cut/rate), and no filter at all at Damping 0.
 */
export function generationsDampingDb(damping: number, hz: number, sampleRate: number): number {
  if (!(damping > 0)) return 0
  const a = Math.exp(
    (-2 * Math.PI * clamp(generationsDampingHz(damping), 0, sampleRate * 0.49)) / sampleRate,
  )
  const w = (2 * Math.PI * hz) / sampleRate
  return 10 * Math.log10(((1 - a) * (1 - a)) / (1 - 2 * a * Math.cos(w) + a * a))
}

/** What the low cut takes on one pass, in dB: `kit::DcBlocker` with r = 1 − 2π·12/rate. */
export function generationsLowCutDb(hz: number, sampleRate: number): number {
  const r = 1 - (2 * Math.PI * LOW_CUT_HZ) / sampleRate
  const cos = Math.cos((2 * Math.PI * hz) / sampleRate)
  return 10 * Math.log10(Math.max(1e-12, (2 - 2 * cos) / (1 - 2 * r * cos + r * r)))
}

/** One whole pass at a frequency, in dB: the low cut, Damping and the room. */
export function generationsPassDb(
  room: GenerationsRoom,
  damping: number,
  hz: number,
  sampleRate: number,
): number {
  return (
    generationsLowCutDb(hz, sampleRate) +
    generationsDampingDb(damping, hz, sampleRate) +
    generationsRoomDb(room, hz, sampleRate)
  )
}

// --- The picture ------------------------------------------------------------

/** The frequencies across the picture: every tone of every room lies between, and Damping's point has room above. */
export const GENERATIONS_MIN_HZ = 50
export const GENERATIONS_MAX_HZ = 8000
/**
 * The scale: 0 dB is the straight path, what lies between the tones on the
 * first pass; the tones stand over it by the contrast, 18 dB at the most.
 */
export const GENERATIONS_TOP_DB = 21
export const GENERATIONS_FOOT_DB = -30
/** The passes drawn. */
export const GENERATIONS_PASSES = [1, 4, 16] as const
/** Where Damping's point stands on the line of what Damping takes. */
export const GENERATIONS_DAMPING_AT_HZ = 4000
/** The tone the point for Room and Resonance stands on: the third. */
const HELD_TONE = 2
/** The sample rate the points are placed for: they are given none, and the line moves by under a fifth of a pixel between 44.1 and 96 kHz. */
const POINTS_RATE = 48000
/** Under this nothing sounds, as for the plate that draws the display. */
const QUIET = 1e-4
/** Under this the spectrum is silence, in the analyser's dB. */
const SILENT_DB = -96
/** The loop level the playhead's mark is shortest and tallest at, in dB. */
const MARK_QUIET_DB = -60
const MARK_LOUD_DB = -10

export interface GenerationsLayout {
  /** The response curves and the spectrum. */
  box: Box
  /** The line the playhead runs along: its left end, its width and its height on the canvas. */
  track: { x: number; w: number; y: number }
}

export function generationsLayout(view: Pick<DisplayView, 'width' | 'height'>): GenerationsLayout {
  return {
    box: { x: 4, y: 4, w: view.width - 8, h: view.height - 16 },
    track: { x: 4, w: view.width - 8, y: view.height - 4 },
  }
}

const xAt = (hz: number, box: Box): number => xOfHz(hz, box, GENERATIONS_MIN_HZ, GENERATIONS_MAX_HZ)
const hzAt = (x: number, box: Box): number => hzOfX(x, box, GENERATIONS_MIN_HZ, GENERATIONS_MAX_HZ)
const yAt = (db: number, box: Box): number =>
  yOfDb(db, box, GENERATIONS_TOP_DB, GENERATIONS_FOOT_DB)
const dbAt = (y: number, box: Box): number => dbOfY(y, box, GENERATIONS_TOP_DB, GENERATIONS_FOOT_DB)

/**
 * Where a response stands on the scale after so many passes, in dB: the tones
 * stay at the contrast, as the level hold keeps them, and the rest sinks.
 */
export function generationsShownDb(passDb: number, passes: number, contrastDb: number): number {
  return contrastDb + passes * passDb
}

/** The Damping that takes `db` at the point's frequency: the device's formula, turned round by halving. */
function dampingOfDb(db: number): number {
  const at = (damping: number): number =>
    generationsDampingDb(damping, GENERATIONS_DAMPING_AT_HZ, POINTS_RATE)
  // The filter is not there at 0 and takes a little as soon as it is.
  if (db >= at(1e-6) / 2) return 0
  if (db <= at(1)) return 1
  let low = 0
  let high = 1
  for (let step = 0; step < 24; step++) {
    const middle = (low + high) / 2
    if (at(middle) > db) low = middle
    else high = middle
  }
  return (low + high) / 2
}

function generationsHandles(view: DisplayView): DisplayHandle[] {
  const { box } = generationsLayout(view)
  const resonance = clamp(view.value('resonance'), 0, 1)
  const damping = clamp(view.value('damping'), 0, 1)
  const contrast = generationsContrastDb(resonance)
  const toneHz = generationsRoomHz(view.value('room')) * GENERATIONS_TONES[HELD_TONE]
  /** What a pass takes at a tone, which passes the room whole: the low cut and Damping. */
  const lossAt = (hz: number): number =>
    generationsLowCutDb(hz, POINTS_RATE) + generationsDampingDb(damping, hz, POINTS_RATE)
  const within = (y: number): number => clamp(y, box.y, box.y + box.h)
  return [
    {
      key: 'tone',
      name: 'Room and Resonance',
      x: xAt(toneHz, box),
      y: within(yAt(contrast + lossAt(toneHz), box)),
      drag: (x, y) => {
        const low = clamp(hzAt(x, box) / GENERATIONS_TONES[HELD_TONE], LARGE_ROOM_HZ, SMALL_ROOM_HZ)
        const hz = low * GENERATIONS_TONES[HELD_TONE]
        return {
          room: roomOfHz(low),
          resonance: clamp((dbAt(within(y), box) - lossAt(hz)) / CONTRAST_DB, 0, 1),
        }
      },
      reset: () => ({
        room: view.spec('room')?.default ?? 0.5,
        resonance: view.spec('resonance')?.default ?? 0.35,
      }),
    },
    {
      key: 'damping',
      name: 'Damping',
      x: xAt(GENERATIONS_DAMPING_AT_HZ, box),
      y: within(
        yAt(contrast + generationsDampingDb(damping, GENERATIONS_DAMPING_AT_HZ, POINTS_RATE), box),
      ),
      drag: (_x, y) => ({ damping: dampingOfDb(dbAt(within(y), box) - contrast) }),
      reset: () => ({ damping: view.spec('damping')?.default ?? 0.3 }),
    },
  ]
}

type Spot = [number, number]

interface GenerationsState {
  /** The three responses and the line of what Damping takes, and the settings and size they were worked out for. */
  curves: Point[][]
  ceiling: Point[]
  curvesOf: number[]
  /** The spectrum's points, written again on every frame. */
  spectrum: Spot[]
  /** The spectrum's strongest part, eased so the trace does not jump; null until there is one. */
  strongest: number | null
}

/**
 * The places a response is worked out at: every half pixel, and each tone
 * itself, so a tone narrower than a pixel still reaches its top.
 */
function curveHz(box: Box, room: number): number[] {
  const all: number[] = []
  for (let x = 0; x <= box.w; x += 0.5) all.push(hzAt(box.x + x, box))
  const low = generationsRoomHz(room)
  for (const ratio of GENERATIONS_TONES) all.push(low * ratio)
  return all.sort((a, b) => a - b)
}

function curves(frame: DisplayFrame<GenerationsState>, box: Box): void {
  const { state } = frame
  const room = clamp(frame.value('room'), 0, 1)
  const resonance = clamp(frame.value('resonance'), 0, 1)
  const damping = clamp(frame.value('damping'), 0, 1)
  const of = [room, resonance, damping, frame.width, frame.height, frame.sampleRate]
  if (of.every((value, index) => value === state.curvesOf[index])) return
  state.curvesOf = of
  const contrast = generationsContrastDb(resonance)
  const model = generationsRoom(room, resonance, frame.sampleRate)
  const places = curveHz(box, room)
  const pass = places.map((hz) => generationsPassDb(model, damping, hz, frame.sampleRate))
  // Far enough past the box that a clipped line leaves it straight.
  const shown = (db: number): number =>
    yAt(clamp(db, GENERATIONS_FOOT_DB - 24, GENERATIONS_TOP_DB + 24), box)
  state.curves = GENERATIONS_PASSES.map((passes) =>
    places.map((hz, index): Point => [
      xAt(hz, box),
      shown(generationsShownDb(pass[index], passes, contrast)),
    ]),
  )
  state.ceiling = places.map((hz): Point => [
    xAt(hz, box),
    shown(contrast + generationsDampingDb(damping, hz, frame.sampleRate)),
  ])
}

/**
 * The spectrum of what comes out as points across the box, one a column, the
 * loudest bin in it, in the analyser's dB; false when it is silence.
 */
function readSpectrum(frame: DisplayFrame<GenerationsState>, box: Box): boolean {
  const bins = frame.signal?.spectrum
  const binHz = frame.signal?.binHz ?? 0
  if (!bins || !(binHz > 0)) return false
  const columns = Math.max(2, Math.floor(box.w / 2))
  const { state } = frame
  if (state.spectrum.length !== columns + 1)
    state.spectrum = Array.from({ length: columns + 1 }, (): Spot => [0, 0])
  let strongest = Number.NEGATIVE_INFINITY
  for (let c = 0; c <= columns; c++) {
    const from = hzAt(box.x + ((c - 0.5) / columns) * box.w, box)
    const to = hzAt(box.x + ((c + 0.5) / columns) * box.w, box)
    let db = Number.NEGATIVE_INFINITY
    if (to - from < binHz) {
      // Low down a bin is wider than a column: read between two bins.
      const at = clamp((from + to) / 2 / binHz, 1, bins.length - 1)
      const below = Math.floor(at)
      db = lerp(bins[below], bins[Math.min(bins.length - 1, below + 1)], at - below)
    } else {
      const first = clamp(Math.ceil(from / binHz), 1, bins.length - 1)
      const last = clamp(Math.floor(to / binHz), first, bins.length - 1)
      for (let i = first; i <= last; i++) if (bins[i] > db) db = bins[i]
    }
    if (!Number.isFinite(db)) db = SILENT_DB
    if (db > strongest) strongest = db
    state.spectrum[c][0] = box.x + (c / columns) * box.w
    state.spectrum[c][1] = db
  }
  if (!(strongest > SILENT_DB)) return false
  state.strongest =
    state.strongest === null ? strongest : follow(state.strongest, strongest, frame.dt, 0.05, 0.4)
  return true
}

const generations = plateDisplay<GenerationsState>({
  place: 'window',
  columns: 2,
  params: ['room', 'resonance', 'damping', 'mix'],
  live: { meters: true, spectrum: true },
  info: 'What the room leaves of a sound from 50 Hz to 8 kHz: the line after one pass, the shades after 4 and 16. The second colour traces what comes out now, its bar is what a pass still takes, and its mark below runs round the loop. Drag the points for Room, Resonance and Damping.',
  init: () => ({ curves: [], ceiling: [], curvesOf: [], spectrum: [], strongest: null }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { box, track } = generationsLayout(frame)
    const foot = box.y + box.h
    const contrast = generationsContrastDb(frame.value('resonance'))
    // With none of the loop in the mix nothing the room does is heard: Mix
    // gives the loop the sine of so many quarter turns, as `process()` does.
    const heard = Math.sin(clamp(frame.value('mix'), 0, 1) * (Math.PI / 2)) > QUIET
    const running = heard && frame.powered && frame.dt > 0

    freqGrid(frame, box, GENERATIONS_MIN_HZ, GENERATIONS_MAX_HZ)
    rule(ctx, box.x, yAt(0, box), box.x + box.w, yAt(0, box), {
      colour: colours.ink,
      alpha: INK.grid,
    })
    rule(ctx, track.x, track.y, track.x + track.w, track.y, {
      colour: colours.ink,
      alpha: INK.rule,
    })

    curves(frame, box)
    const [one, four, sixteen] = state.curves
    clipped(ctx, box, () => {
      if (heard) {
        fillTo(ctx, four, foot, colours.ink, INK.fill)
        fillTo(ctx, sixteen, foot, colours.ink, INK.back)
      }
      trace(ctx, state.ceiling, { colour: colours.ink, width: 1, alpha: INK.back, dash: [2, 2] })
      trace(ctx, one, heard ? { colour: colours.ink } : { colour: colours.ink, width: 1 })
    })

    if (running) {
      // What comes out, its strongest part level with the tops.
      if (readSpectrum(frame, box) && state.strongest !== null) {
        const strongest = state.strongest
        // What lies under the foot of the scale runs out of the picture, not along its edge.
        const points = state.spectrum.map(([x, db]): Point => [
          x,
          clamp(yAt(contrast + db - strongest, box), box.y, foot + 4),
        ])
        clipped(ctx, box, () => {
          trace(ctx, points, { colour: colours.accent, width: 1.25 })
        })
      } else {
        state.strongest = null
      }

      // The loop holds something: where the record head is in it, a mark as
      // tall as the loop is loud, and what a pass still takes from the sound.
      const turn = frame.hasMeter('turn') ? frame.meter('turn') : -1
      if (turn >= 0 && turn <= 1) {
        const level = clamp(
          (gainToDb(frame.meter('level')) - MARK_QUIET_DB) / (MARK_LOUD_DB - MARK_QUIET_DB),
          0,
          1,
        )
        const tall = 2 + 4 * level
        fillRect(
          ctx,
          { x: track.x + turn * track.w - 1, y: track.y - tall, w: 2, h: tall + 1 },
          colours.accent,
        )
        const taken = gainToDb(frame.meter('hold'))
        if (taken > 0.2) {
          const top = clamp(yAt(contrast, box), box.y, foot)
          const end = clamp(yAt(contrast - taken, box), box.y, foot)
          fillRect(ctx, { x: box.x + box.w - 3, y: top, w: 2, h: end - top }, colours.accent)
        }
      }
    } else {
      state.strongest = null
    }

    // Which shape is which, at the left where they lie apart: each number
    // stands on its own curve, and only where the one above leaves it room.
    // They go down after the trace of what comes out, which crosses that
    // corner whenever the sound has lows, so a number is never struck through.
    if (heard) {
      let last = Number.NEGATIVE_INFINITY
      GENERATIONS_PASSES.forEach((passes, index) => {
        const y = state.curves[index][0][1]
        if (y - last < 10 || y > foot - 1 || y - 9 < box.y) return
        label(frame, String(passes), box.x + 3, y - 2)
        last = y
      })
    }

    const handles = generationsHandles(frame)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    // The point in hand, in words: at the foot on the right, where neither
    // point comes and no number stands. For the room it is the tone the point
    // stands on, the frequency it is at on the scale.
    const hot = handles.find((point) => point.key === frame.hot)
    if (hot) {
      const damping = clamp(frame.value('damping'), 0, 1)
      const heldHz = generationsRoomHz(frame.value('room')) * GENERATIONS_TONES[HELD_TONE]
      const words =
        hot.key === 'tone'
          ? `${hzText(heldHz)}  +${contrast.toFixed(1)} dB`
          : damping > 0
            ? `Damping ${hzText(generationsDampingHz(damping))}`
            : 'Damping off'
      label(frame, words, box.x + box.w - 3, foot - 3, 'right')
    }
  },
  handles: generationsHandles,
})

export const GENERATIONS_FACES: Readonly<Record<string, PlateFace>> = {
  generations: {
    display: generations,
    face: ['length', 'keep', 'listen', 'mix'],
    // Beside Damping on the upright plate the whole word touches its neighbour.
    labels: { resonance: 'Reso' },
  },
}
