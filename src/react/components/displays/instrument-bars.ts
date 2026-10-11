// Displays of the instruments that are struck: bars, tuned steel and bells.
//
// Each is the thing that is struck, drawn from the device's own figures: a
// keyboard of bars over their tubes, a pan seen from above, the modes of a
// bell side by side. What the knobs set is in the picture at rest (how long a
// bar is, how far the hand lands from the middle of a note, how long each
// mode rings), and what is struck lights there and goes out as the device
// lets it die.

import {
  INK,
  clamp,
  dot,
  fillRect,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { hzOfKey, keyOfHz, levelFoot, outShare, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>

/** Under this share of its light a thing that was struck is done. */
const DONE = 0.02
/** A level as a share of a light: whole at full scale, out at 60 dB under it. */
const shareOfDb = (db: number): number => clamp(1 + db / 60, 0, 1)
/** What a key played as hard as `gain` leaves in a bar or a note, against the hardest: all three devices have it. */
const strokeStrength = (gain: number): number => gain * (0.3 + 0.7 * gain)

/**
 * `Mallets::response`: how much of a raised-cosine push `periods` long (in
 * periods of a mode) ends up in that mode: 1 for a tap, a half at one period,
 * nothing at two, three and so on. The mallet of Bells is the same window.
 */
export function pushResponse(periods: number): number {
  if (periods < 1e-3) return 1
  const spare = 1 - periods * periods
  if (Math.abs(spare) < 1e-3) return 0.5
  return Math.abs(Math.sin(Math.PI * periods) / (Math.PI * periods * spare))
}

/** A later note of `notes` on the same key that has begun: the device strikes the same bar again, it does not sound twice. */
function struckAgain(notes: readonly DisplayNote[], index: number): boolean {
  const key = keyOfHz(notes[index].frequency)
  for (let later = index + 1; later < notes.length; later++)
    if (keyOfHz(notes[later].frequency) === key) return true
  return false
}

// --- Mallets -----------------------------------------------------------------

const C3_HZ = 130.8128
const C4_HZ = 261.6256
const C6_HZ = 1046.502

/**
 * `mallets.h`, `kBars`: the bar's modes as its maker cut them and how hard a
 * stroke lights the first two, the pitch `seconds` holds at, the bar's own
 * ring there, the power its ring falls by with pitch, how much faster a mode
 * dies per unit of ratio, the tube's level, what the open tube takes from the
 * ring, the tube's Q and the mallet's contact against the marimba's.
 */
const MALLET_BARS = [
  {
    name: 'Marimba',
    second: 4,
    knock: 1.4,
    hz: C4_HZ,
    seconds: 2,
    exponent: 1,
    damping: 3,
    tube: 2.5,
    coupling: 1,
    q: 16,
    contact: 1,
  },
  {
    name: 'Vibraphone',
    second: 4,
    knock: 1,
    hz: C4_HZ,
    seconds: 10,
    exponent: 0.5,
    damping: 0.4,
    tube: 2,
    coupling: 0.8,
    q: 16,
    contact: 1,
  },
  {
    name: 'Xylophone',
    second: 3,
    knock: 1.6,
    hz: C4_HZ,
    seconds: 1,
    exponent: 1,
    damping: 2.5,
    tube: 1,
    coupling: 0.4,
    q: 12,
    contact: 0.8,
  },
  {
    name: 'Glockenspiel',
    second: 2.757,
    knock: 1,
    hz: C6_HZ,
    seconds: 4,
    exponent: 0.5,
    damping: 0.15,
    tube: 0.8,
    coupling: 0.3,
    q: 12,
    contact: 0.7,
  },
  {
    name: 'Celesta',
    second: 2.757,
    knock: 0.5,
    hz: C6_HZ,
    seconds: 2.5,
    exponent: 0.5,
    damping: 0.3,
    tube: 1.5,
    coupling: 0.6,
    q: 6,
    contact: 1.6,
  },
] as const
/** The strongest tube of the five: the marimba's. */
const MALLET_TUBE_MOST = 2.5
/** `mallets.h`: the decay law is held between two octaves under its reference and three over; no mode rings shorter than this. */
const MALLET_LAW_LEAST = 0.125
const MALLET_LAW_MOST = 4
const MALLET_RING_LEAST = 0.005
/** `mallets.h`: the mallet's contact at middle C, soft and hard, and the longest it is; never more than this share of the note's period. */
const MALLET_SOFT_CONTACT = 0.0025
const MALLET_HARD_CONTACT = 0.00025
const MALLET_CONTACT_MOST = 0.008
const MALLET_PERIOD_MOST = 0.9
/** `mallets.h`, `kHandPosition`: where the two hands land, from the end of the bar (0) to its middle (1). */
const MALLET_HANDS = [0.84, 0.78] as const
/** `mallets.h`: a full Damper stops a bar in this long, and near none it may ring this many times longer. */
const MALLET_CHOKE_SEC = 0.15
const MALLET_CHOKE_SPAN = 200
/** `mallets.h`: the roll is off under half a stroke a second, aims this far under the first stroke, is faster by this per octave over C3, and its strokes land as those of a key played this much softer. */
const MALLET_ROLL_OFF = 0.5
const MALLET_ROLL_LEVEL = 0.6
const MALLET_ROLL_PER_OCTAVE = 0.12
const MALLET_ROLL_VELOCITY = 0.6
/** `mallets.h`, `kTopHz` and `kTopOfBand`: a mode of a bar above this, or above this share of the sample rate, does not exist. */
const MALLET_TOP_HZ = 16000
const MALLET_TOP_OF_BAND = 0.45
/** `mallets.h`: the stage has F sharp 4 in the middle, two and a half octaves to either edge, and its edge is this far out. */
const MALLET_STAGE_CENTRE = 66
const MALLET_STAGE_SPAN = 30
const MALLET_STAGE_EDGE = 0.75

const malletBars = (instrument: number) =>
  MALLET_BARS[clamp(Math.round(instrument), 0, MALLET_BARS.length - 1)]

/** `Mallets::ring`: seconds the fundamental of a bar at `hz` takes to fall 60 dB with no tube under it. */
export function malletBarSeconds(instrument: number, hz: number, decay: number): number {
  const bar = malletBars(instrument)
  const law = clamp(
    Math.pow(bar.hz / Math.max(hz, 1), bar.exponent),
    MALLET_LAW_LEAST,
    MALLET_LAW_MOST,
  )
  return bar.seconds * decay * law
}

/**
 * `Mallets::load`: what the tube leaves of that ring. The bar loses what the
 * tube radiates, so the more of the tube is heard the sooner the bar is done.
 * The motor's disc shuts the tube for half of every turn on average, and the
 * loss is in step with it, so over whole turns it is the loss of a tube open
 * by 1 - Motor / 2.
 */
export function malletRingSeconds(
  instrument: number,
  alone: number,
  resonator: number,
  motor: number,
): number {
  const open = 1 - 0.5 * clamp(motor, 0, 1)
  return (
    Math.max(alone, MALLET_RING_LEAST) /
    (1 + malletBars(instrument).coupling * clamp(resonator, 0, 1) * open)
  )
}

/** `Mallets::ring`: the longest any mode of a bar rings once its key is let go; forever with no Damper. */
export function malletDamperSeconds(damper: number): number {
  return damper > 0.001 ? MALLET_CHOKE_SEC * Math.pow(MALLET_CHOKE_SPAN, 1 - damper) : Infinity
}

/**
 * `Mallets::ring` then `Mallets::load`: seconds the fundamental rings once
 * its key is let go. The damper's limit is on the bar alone and the tube
 * takes its share of what the damper leaves, so a damped bar over a strong
 * tube is done sooner than the damper's own time.
 */
export function malletDampedSeconds(
  instrument: number,
  alone: number,
  damper: number,
  resonator: number,
  motor: number,
): number {
  return malletRingSeconds(
    instrument,
    Math.min(alone, malletDamperSeconds(damper)),
    resonator,
    motor,
  )
}

/** `Mallets::ring`: how long the second mode of a bar rings, which is the knock of the stroke. */
export function malletKnockSeconds(instrument: number, alone: number): number {
  const bar = malletBars(instrument)
  return Math.max(alone / (1 + bar.damping * (bar.second - 1)), MALLET_RING_LEAST)
}

/** `Mallets::stroke`: seconds the mallet is on a bar at `hz`, struck as hard as `gain`. */
export function malletContactSeconds(
  instrument: number,
  mallet: number,
  hz: number,
  gain: number,
): number {
  const contact =
    MALLET_SOFT_CONTACT *
    Math.pow(MALLET_HARD_CONTACT / MALLET_SOFT_CONTACT, mallet) *
    malletBars(instrument).contact *
    Math.sqrt(C4_HZ / hz) *
    (1.4 - 0.6 * gain)
  return Math.min(contact, MALLET_CONTACT_MOST, MALLET_PERIOD_MOST / hz)
}

/** `Mallets::shape`: how far mode `k` of a bar moves where a hand lands (0 is the fundamental). */
const malletShape = (k: number, position: number): number => {
  const angle = (k + 1.5) * Math.PI * (0.5 * position - 0.5)
  return k & 1 ? Math.sin(angle) : Math.cos(angle)
}

/**
 * `Mallets::stroke`: the knock a fresh stroke leaves, as the second mode's
 * size against the fundamental's. The stroke is sized by its own spectrum at
 * the fundamental, so a harder mallet changes this and not the note's level.
 * `hand` is which of the two places on the bar the stroke lands at. A bar so
 * high that its second mode is out of the band has no knock (`Mallets::start`).
 */
export function malletKnock(
  instrument: number,
  mallet: number,
  hz: number,
  gain: number,
  hand = 0,
  sampleRate = 48000,
): number {
  const bar = malletBars(instrument)
  if (hz * bar.second >= Math.min(MALLET_TOP_HZ, MALLET_TOP_OF_BAND * sampleRate)) return 0
  const periods = malletContactSeconds(instrument, mallet, hz, gain) * hz
  const position = MALLET_HANDS[hand & 1]
  const base = malletShape(0, position) * pushResponse(periods)
  return Math.abs(
    (bar.knock * malletShape(1, position) * pushResponse(bar.second * periods)) / base,
  )
}

/** `Mallets::roll_interval`: strokes a second on a held bar at `hz`; 0 while the roll is off. */
export function malletRollHz(roll: number, hz: number): number {
  if (roll < MALLET_ROLL_OFF) return 0
  return roll * clamp(1 + MALLET_ROLL_PER_OCTAVE * Math.log2(hz / C3_HZ), 0.8, 1.5)
}

/** `Mallets::stage`: where a bar stands between the speakers, -1 (left) to 1. */
export function malletStage(hz: number, width: number): number {
  const key = 69 + 12 * Math.log2(Math.max(hz, 1) / 440)
  return clamp((key - MALLET_STAGE_CENTRE) / MALLET_STAGE_SPAN, -1, 1) * MALLET_STAGE_EDGE * width
}

/** `Mallets::start`: seconds the tube under a bar at `hz` takes to fill, which is the bloom after the stroke: Q / (π·f). */
export function malletBloomSeconds(instrument: number, hz: number): number {
  return malletBars(instrument).q / (Math.PI * hz)
}

/**
 * How far a mode of a bar has fallen, in dB under the hardest stroke: struck
 * `since` seconds ago as hard as `gain`, let go `released` seconds ago (null
 * while it is held), ringing `ring` seconds while held and `damped` once let
 * go (`malletDampedSeconds`). A roll strikes a held bar again `rollHz` times a
 * second and tops it up to `MALLET_ROLL_LEVEL` of the first stroke
 * (`Mallets::control`). The strokes are drawn on the beat; the device sets
 * each up to 12 % early or late.
 */
export function malletBarDb(
  since: number,
  gain: number,
  released: number | null,
  ring: number,
  damped: number,
  rollHz = 0,
): number {
  const after = released === null ? 0 : Math.min(released, since)
  const held = since - after
  const struck = gainToDb(strokeStrength(gain))
  let db = struck - (60 * held) / ring
  if (rollHz > 0 && held * rollHz >= 1) {
    const sinceStroke = held - Math.floor(held * rollHz) / rollHz
    db = Math.max(db, struck + gainToDb(MALLET_ROLL_LEVEL) - (60 * sinceStroke) / ring)
  }
  return db - (60 * after) / Math.min(ring, damped)
}

/** The bars a keyboard shows: C3 to C6, three octaves and every key of them. */
const MALLET_LOW_KEY = 48
const MALLET_HIGH_KEY = 84
const MALLET_KEYS = MALLET_HIGH_KEY - MALLET_LOW_KEY + 1
/** The ring times a bar's length spans, rail to top, on a scale of ratios. */
const MALLET_SHORT_SEC = 0.03
const MALLET_LONG_SEC = 30
/** The key the Decay handle stands on. */
const MALLET_DECAY_KEY = 60
/** How many seconds of the motor's turning are drawn. */
const MALLET_MOTOR_SEC = 1

interface MalletParts {
  /** The bars: they stand on the rail at `y + h`, the longest reaching `y`. */
  bars: Box
  /** The tubes: they hang from the rail, the longest reaching `y + h`. */
  tubes: Box
  /** The line the keyboard is laid along between the speakers. */
  stage: number
  foot: Box
}

function malletParts(view: Size): MalletParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const room = all.h - 11 - 14
  const bars = Math.round(room * 0.66)
  return {
    bars: { x: all.x + 2, y: all.y + 11, w: all.w - 4, h: bars },
    tubes: { x: all.x + 2, y: all.y + 11 + bars + 1, w: all.w - 4, h: room - bars - 2 },
    stage: all.y + all.h - 10,
    foot: { x: all.x, y: all.y + all.h - 6, w: all.w, h: 6 },
  }
}

const malletLength = (ring: number): number =>
  clamp(Math.log(ring / MALLET_SHORT_SEC) / Math.log(MALLET_LONG_SEC / MALLET_SHORT_SEC), 0.05, 1)
const malletSecondsOf = (length: number): number =>
  MALLET_SHORT_SEC * Math.pow(MALLET_LONG_SEC / MALLET_SHORT_SEC, length)

/** The steps of an octave that are sharps, as bits: 1, 3, 6, 8 and 10. */
const SHARPS = 0b010101001010
const isSharp = (key: number): boolean => ((SHARPS >> (((key % 12) + 12) % 12)) & 1) === 1

/** Where a key's bar stands: its left edge, and how wide it is with a gap to the next. A key off the keyboard is played on its last bar. */
const malletBarX = (key: number, bars: Box): number =>
  Math.round(
    bars.x +
      ((clamp(key, MALLET_LOW_KEY, MALLET_HIGH_KEY) - MALLET_LOW_KEY) * bars.w) / MALLET_KEYS,
  )
const malletBarWide = (key: number, bars: Box): number => {
  const index = clamp(key, MALLET_LOW_KEY, MALLET_HIGH_KEY) - MALLET_LOW_KEY
  return Math.max(
    1,
    Math.round(bars.x + ((index + 1) * bars.w) / MALLET_KEYS) - malletBarX(key, bars) - 1,
  )
}

const mallets = plateDisplay({
  place: 'window',
  columns: 2,
  params: [
    'instrument',
    'mallet',
    'decay',
    'resonator',
    'motor',
    'motorRate',
    'roll',
    'damper',
    'width',
  ],
  live: { signal: true, notes: true },
  info: 'The bars from low to high, each as long as it rings, over the tubes that are heard; the band across them is the knock of the mallet. A struck bar lights from where the mallet landed. Drag the handle to set Decay.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const instrument = frame.value('instrument')
    const bar = malletBars(instrument)
    const mallet = frame.value('mallet')
    const decay = frame.value('decay')
    const resonator = clamp(frame.value('resonator'), 0, 1)
    const motor = clamp(frame.value('motor'), 0, 1)
    const roll = frame.value('roll')
    const damper = frame.value('damper')
    const width = clamp(frame.value('width'), 0, 1)
    const { bars, tubes, stage, foot } = malletParts(frame)
    const rail = bars.y + bars.h
    // The sharps stand a little behind the naturals, as the far row of a keyboard of bars does.
    const lift = Math.min(3, Math.round(bars.h * 0.08))
    const span = bars.h - lift
    const ringOf = (hz: number): number =>
      malletRingSeconds(instrument, malletBarSeconds(instrument, hz, decay), resonator, motor)
    // How much of the tubes is heard, as a share of the strongest there is.
    const heard = (resonator * bar.tube) / MALLET_TUBE_MOST
    // A tube tuned to its bar is a quarter of the note's wave long: half as long an octave up.
    const tubeLength = (hz: number): number => Math.max(2, tubes.h * Math.min(1, C3_HZ / hz))

    // The scale: a second and ten seconds.
    for (const seconds of [1, 10]) {
      const y = rail - malletLength(seconds) * span
      rule(ctx, bars.x - 1, y, bars.x + bars.w + 1, y, { colour: colours.ink, alpha: INK.grid })
      label(frame, `${seconds} s`, bars.x + bars.w + 1, y - 2, 'right')
    }

    // The keyboard at rest: every bar as long as it rings, the band where the mallets land, the tube under it.
    for (let key = MALLET_LOW_KEY; key <= MALLET_HIGH_KEY; key++) {
      const hz = hzOfKey(key)
      const at = malletBarX(key, bars)
      const wide = malletBarWide(key, bars)
      const stand = rail - (isSharp(key) ? lift : 0)
      const long = malletLength(ringOf(hz)) * span
      fillRect(
        ctx,
        { x: at, y: stand - long, w: wide, h: long },
        colours.ink,
        isSharp(key) ? 0.46 : 0.3,
      )
      const band = Math.max(
        1,
        Math.min(
          long,
          6 * Math.sqrt(malletKnock(instrument, mallet, hz, 0.8, 0, frame.sampleRate)),
        ),
      )
      const landed = stand - long * 0.5 * MALLET_HANDS[0]
      fillRect(ctx, { x: at, y: landed - band / 2, w: wide, h: band }, colours.ink, INK.back)
      if (heard > 0) {
        const tube = { x: at, y: rail + 2, w: wide, h: tubeLength(hz) }
        fillRect(ctx, tube, colours.ink, 0.12 + 0.5 * heard)
        // The motor's disc lies in the mouth of every tube.
        if (motor > 0) fillRect(ctx, { ...tube, h: 2 }, colours.ink, 0.3 + 0.7 * motor)
      }
    }
    rule(ctx, bars.x - 1, rail + 1, bars.x + bars.w + 1, rail + 1, {
      colour: colours.ink,
      alpha: INK.rule,
    })

    // The motor: how far the disc shuts the tubes and how often, over a second. Its place in the turn is not known, so it stands still.
    if (motor > 0 && heard > 0) {
      const rate = frame.value('motorRate')
      const high = Math.max(6, Math.min(12, tubes.h - 10))
      const box: Box = {
        x: tubes.x + Math.round(tubes.w * 0.5),
        y: tubes.y + tubes.h - high,
        w: Math.round(tubes.w * 0.5) - 34,
        h: high,
      }
      if (box.w > 4) {
        ctx.beginPath()
        for (let x = 0; x <= box.w; x += 1) {
          // `Mallets::opening`: the disc is out of the way at the start of a turn and across the tube half way through.
          const shut =
            motor * (0.5 - 0.5 * Math.cos(2 * Math.PI * rate * MALLET_MOTOR_SEC * (x / box.w)))
          if (x === 0) ctx.moveTo(box.x, box.y + shut * box.h)
          else ctx.lineTo(box.x + x, box.y + shut * box.h)
        }
        ctx.globalAlpha = INK.text
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.lineJoin = 'round'
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      text(frame, `${rate.toFixed(1)} Hz`, tubes.x + tubes.w + 1, box.y + box.h, {
        align: 'right',
      })
    }

    // The stage: the line the keyboard is laid along between the speakers, as wide as Width.
    const middle = foot.x + foot.w / 2
    const reach = (MALLET_STAGE_EDGE * width * foot.w) / 2
    rule(ctx, middle - reach, stage, middle + reach, stage, {
      colour: colours.ink,
      alpha: INK.back,
    })
    for (const end of [-1, 1]) {
      const x = middle + end * reach
      rule(ctx, x, stage - 2, x, stage + 2, { colour: colours.ink, alpha: INK.text })
    }

    // The bars that are struck.
    const notes = frame.notes
    let said: DisplayNote | null = null
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      if (struckAgain(notes, index)) continue
      const alone = malletBarSeconds(instrument, note.frequency, decay)
      const ring = malletRingSeconds(instrument, alone, resonator, motor)
      const damped = malletDampedSeconds(instrument, alone, damper, resonator, motor)
      const rollHz = malletRollHz(roll, note.frequency)
      const share = shareOfDb(malletBarDb(note.age, note.gain, note.released, ring, damped, rollHz))
      if (share < DONE) continue
      said = note
      const key = keyOfHz(note.frequency)
      const at = malletBarX(key, bars)
      const wide = malletBarWide(key, bars)
      const stand = rail - (isSharp(key) ? lift : 0)
      const long = malletLength(ring) * span
      // The roll's hands take turns at two places on the bar.
      const after = note.released === null ? 0 : Math.min(note.released, note.age)
      const strokes = rollHz > 0 ? Math.floor((note.age - after) * rollHz) : 0
      const landed = stand - long * 0.5 * MALLET_HANDS[strokes & 1]
      // Its light is as long as the bar is loud, about where the mallet landed.
      const lit = Math.max(2, share * long)
      const top = clamp(landed - lit / 2, stand - long, stand - lit)
      fillRect(ctx, { x: at, y: top, w: wide, h: lit }, colours.accent)
      // The knock: the second mode, as large as the key and the mallet make it and gone as soon as it dies.
      // A roll's stroke is softer, so its mallet is longer on the bar. The damper holds this mode to its own time.
      const knockRing = malletKnockSeconds(instrument, alone)
      const sinceStroke = note.age - after - (rollHz > 0 ? strokes / rollHz : 0)
      const knock =
        malletKnock(
          instrument,
          mallet,
          note.frequency,
          strokes > 0 ? MALLET_ROLL_VELOCITY * note.gain : note.gain,
          strokes,
          frame.sampleRate,
        ) *
        strokeStrength(note.gain) *
        (strokes > 0 ? MALLET_ROLL_LEVEL : 1) *
        shareOfDb(
          -60 *
            (sinceStroke / knockRing + after / Math.min(knockRing, malletDamperSeconds(damper))),
        )
      if (knock > DONE)
        dot(ctx, at + wide / 2, landed, 1 + 3 * Math.sqrt(knock), colours.accent, {
          ring: colours.plate,
        })
      // The tube fills after the stroke and sounds with the bar: its light reaches as far down as it is heard.
      if (heard > 0) {
        const filled = 1 - Math.exp(-note.age / malletBloomSeconds(instrument, note.frequency))
        const light = clamp(share * filled * (0.25 + 0.75 * heard), 0, 1)
        fillRect(
          ctx,
          { x: at, y: rail + 2, w: wide, h: Math.max(1, light * tubeLength(note.frequency)) },
          colours.accent,
        )
      }
      // Where it stands between the speakers.
      const place = middle + (malletStage(note.frequency, width) * foot.w) / 2
      rule(ctx, place, stage - 2, place, stage + 2, {
        colour: colours.accent,
        width: 2,
        alpha: 0.4 + 0.6 * share,
      })
    }

    levelFoot(frame, foot, outShare(frame))

    // The words: which bars, and how long the last one struck rings (middle C while none is).
    const hz = said ? said.frequency : C4_HZ
    text(frame, bar.name, bars.x - 1, bars.y - 4)
    text(frame, `${pitchName(hz)} ${secondsText(ringOf(hz))}`, bars.x + bars.w + 1, bars.y - 4, {
      align: 'right',
    })

    for (const point of malletHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: malletHandles,
})

function malletHandles(view: DisplayView): DisplayHandle[] {
  const instrument = view.value('instrument')
  const resonator = clamp(view.value('resonator'), 0, 1)
  const motor = clamp(view.value('motor'), 0, 1)
  const { bars } = malletParts(view)
  const rail = bars.y + bars.h
  const span = bars.h - Math.min(3, Math.round(bars.h * 0.08))
  const hz = hzOfKey(MALLET_DECAY_KEY)
  const ringAt = (decay: number): number =>
    malletRingSeconds(instrument, malletBarSeconds(instrument, hz, decay), resonator, motor)
  return [
    {
      key: 'decay',
      name: 'Decay',
      x: malletBarX(MALLET_DECAY_KEY, bars) + malletBarWide(MALLET_DECAY_KEY, bars) / 2,
      y: rail - malletLength(ringAt(view.value('decay'))) * span,
      drag: (_x, toY) => ({
        decay: malletSecondsOf(clamp((rail - toY) / span, 0, 1)) / ringAt(1),
      }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 1 }),
    },
  ]
}

// --- Handpan -----------------------------------------------------------------

/** `handpan.h`, `Handpan::ratio` and `kRing` in `Handpan::tune`: the three tuned modes of a note and how long each rings against Decay. */
const HANDPAN_TYPES = [
  {
    name: 'Handpan',
    ratio: [1, 2, 3],
    ring: [1, 0.8, 0.6],
    octaveDb: [-18, 18],
    twelfthDb: [-21, 20],
    bloom: 1,
    cavity: 1,
  },
  {
    name: 'Tongue drum',
    ratio: [1, 2, 6.27],
    ring: [1, 0.7, 0.2],
    octaveDb: [-25, 11],
    twelfthDb: [-30, 12],
    bloom: 0.3,
    cavity: 1.4,
  },
] as const
/** `handpan.h`: the hand's contact, the pad of a finger and a knuckle. */
const HANDPAN_SOFT_CONTACT = 0.006
const HANDPAN_HARD_CONTACT = 0.0015
/** `handpan.h`: the overtones under a soft hand and a hard one, where a soft hand starts to lose them, and how many times higher a hard one does. */
const HANDPAN_SOFT_DB = -6
const HANDPAN_HARD_DB = 2
const HANDPAN_TILT_HZ = 500
const HANDPAN_TILT_SPAN = 12
/** `handpan.h`: the bloom's share of the fundamental squared for the octave and cubed for the twelfth, at the hardest touch. */
const HANDPAN_BLOOM = [0.25, 0.15] as const
/** `handpan.h`: Shimmer's most in cents, and the most it moves the octave and the twelfth in Hz. */
const HANDPAN_SHIMMER_CENTS = 8
const HANDPAN_SHIMMER_HZ = [1.6, 2.2] as const
/** `handpan.h`: the air in the shell, a mode at 80 Hz with a Q of 8; it falls 60 dB in ln(1000)·Q / (π·f) seconds. */
const HANDPAN_CAVITY_SEC = (Math.log(1000) * 8) / (Math.PI * 80)
/** `handpan.h`: a released note under a full Damp rings this long. */
const HANDPAN_DAMP_SEC = 0.18
/** `handpan.h`, `kTopOfBand`: a mode above this share of the sample rate does not exist. */
const TOP_OF_BAND = 0.45

const handpanType = (type: number) =>
  HANDPAN_TYPES[clamp(Math.round(type), 0, HANDPAN_TYPES.length - 1)]
const gainOfDb = (db: number): number => Math.pow(10, db / 20)

/** `Handpan::strike`: hitting harder is also hitting harder-handed. */
export function handpanTouch(touch: number, gain: number): number {
  return clamp(touch + 0.4 * (gain - 0.6), 0, 1)
}

/** `Handpan::strike`: seconds the hand is on the note. It does not follow the pitch. */
export function handpanContactSeconds(touch: number): number {
  return HANDPAN_SOFT_CONTACT * Math.pow(HANDPAN_HARD_CONTACT / HANDPAN_SOFT_CONTACT, touch)
}

/**
 * `Handpan::strike` and the bloom of `Handpan::turn`: what a tap as hard as
 * `gain` leaves in the three tuned modes of a note at `hz`, against the
 * hardest tap's fundamental at the centre, written into `into`. The octave and
 * the twelfth come up toward the edge on curves of their own, a soft hand
 * loses what lies above its corner, and for 15 ms the fundamental's square
 * feeds the octave and its cube the twelfth.
 */
export function handpanModes(
  type: number,
  position: number,
  touchKnob: number,
  hz: number,
  gain: number,
  into: number[],
  sampleRate = 48000,
): number[] {
  const kind = handpanType(type)
  const touch = handpanTouch(touchKnob, gain)
  const strength = strokeStrength(gain)
  const hard = gainOfDb(HANDPAN_SOFT_DB + (HANDPAN_HARD_DB - HANDPAN_SOFT_DB) * touch)
  const corner = HANDPAN_TILT_HZ * Math.pow(HANDPAN_TILT_SPAN, touch)
  const base = 1 + (hz / corner) * (hz / corner)
  const tilt = (ratio: number): number =>
    hz * ratio < TOP_OF_BAND * sampleRate ? base / (1 + ((hz * ratio) / corner) ** 2) : 0
  into[0] = strength * (1 - 0.25 * position * position)
  into[1] =
    strength *
    hard *
    gainOfDb(kind.octaveDb[0] + kind.octaveDb[1] * Math.pow(position, 0.8)) *
    tilt(kind.ratio[1])
  into[2] =
    strength *
    hard *
    gainOfDb(kind.twelfthDb[0] + kind.twelfthDb[1] * Math.pow(position, 1.4)) *
    tilt(kind.ratio[2])
  // The bloom: it grows with the square and the cube of the note, so only a hard strike has it.
  const depth = (0.1 + 0.9 * touch * Math.sqrt(touch)) * kind.bloom
  const fundamental = Math.min(into[0], 1)
  if (into[1] > 0) into[1] += depth * HANDPAN_BLOOM[0] * fundamental ** 2
  if (into[2] > 0 && kind.bloom === 1) into[2] += depth * HANDPAN_BLOOM[1] * fundamental ** 3
  return into
}

/** `Handpan::tune`: the longest a mode rings once its key is let go; as long as Decay with no Damp. */
export function handpanDampedSeconds(decay: number, damp: number): number {
  return damp > 0.001 ? HANDPAN_DAMP_SEC * Math.pow(decay / HANDPAN_DAMP_SEC, 1 - damp) : Infinity
}

const handpanBends = new Map<number, readonly [number, number]>()

/**
 * `Handpan::start`: which way and how far a key's octave and twelfth lean off
 * true, -1 to 1, by the device's own draw of numbers for that key (`kit::Rng`,
 * a 32 bit xorshift), so the picture turns the way the note does.
 */
export function handpanBend(key: number): readonly [number, number] {
  const known = handpanBends.get(key)
  if (known) return known
  let state = (0x9e3779b9 ^ Math.imul(key + 1024, 2246822519)) >>> 0
  if (state === 0) state = 0x2545f491
  const uniform = (): number => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return (state >>> 8) / 16777216
  }
  uniform()
  uniform()
  const lean = (): number => (0.5 + 0.5 * uniform()) * (uniform() < 0.5 ? -1 : 1)
  const bend: readonly [number, number] = [lean(), lean()]
  handpanBends.set(key, bend)
  return bend
}

/** `Handpan::tune`: Hz the octave (`mode` 1) or the twelfth (2) of a note at `hz` sits off true. A tongue's ping does not move. */
export function handpanShimmerHz(
  type: number,
  mode: 1 | 2,
  hz: number,
  shimmer: number,
  bend: number,
): number {
  const kind = handpanType(type)
  if (mode === 2 && kind.bloom !== 1) return 0
  const most = shimmer * HANDPAN_SHIMMER_HZ[mode - 1]
  const offset =
    hz * kind.ratio[mode] * (Math.pow(2, (HANDPAN_SHIMMER_CENTS * shimmer * bend) / 1200) - 1)
  return clamp(offset, -most, most)
}

/**
 * Whether two notes have a tuned mode at one pitch, which is where the shell
 * lets them trade (`handpan.h`: "a tap on D4 sets the octave of a ringing D3
 * going and leaves an E4 alone"). A fifth on the keyboard is a fiftieth of a
 * semitone off and counts.
 */
export function handpanAnswers(type: number, a: number, b: number): boolean {
  const { ratio } = handpanType(type)
  for (const i of ratio)
    for (const j of ratio) {
      if (i === j) continue
      if (Math.abs((a * i) / (b * j) - 1) < 0.004) return true
    }
  return false
}

/** How far a mode of a note has fallen, in dB: it was left `size` by a tap `since` seconds ago, let go `released` seconds ago. */
function modeDb(
  size: number,
  since: number,
  released: number | null,
  ring: number,
  damped: number,
): number {
  const after = released === null ? 0 : Math.min(released, since)
  return gainToDb(size) - 60 * ((since - after) / ring + after / Math.min(ring, damped))
}

/** How many notes are drawn lit at once; the device has 12. */
const HANDPAN_LIT_MOST = 24
/** The keys the scale round the shell spans: C3 at the near side up to C6 at the far one, the device's home and room either side. A key off it lies at its end. */
const PAN_LOW_KEY = 48
const PAN_HIGH_KEY = 84
/** A lobe is as large as its mode is loud, on a scale from 40 dB under the fundamental. */
const lobeSize = (size: number): number => clamp(1 + gainToDb(size) / 40, 0.1, 1.05)

interface PanParts {
  /** The shell from above. */
  pan: { x: number; y: number; r: number }
  /** The note under the hand, enlarged. */
  field: Box
  foot: Box
}

function panParts(view: Size): PanParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const r = Math.max(8, Math.min((all.h - 11 - 9) / 2, all.w * 0.3))
  const pan = { x: all.x + 1 + r, y: all.y + 11 + r, r }
  const left = pan.x + r + 5
  return {
    pan,
    field: { x: left, y: pan.y - r + 1, w: Math.max(8, all.x + all.w - 1 - left), h: 2 * r - 2 },
    foot: { x: all.x, y: all.y + all.h - 6, w: all.w, h: 6 },
  }
}

/**
 * Where the note of a key lies on the shell. The device has no note fields of
 * its own, only the notes that ring ("any key plays"), and of where one lies
 * it says one thing: even keys lean left and odd ones right (`Handpan::start`).
 * The rest is this picture's scale: the higher the key, the further from the
 * near side, so two notes an octave apart lie apart and can be seen to trade.
 */
function panFieldAt(
  key: number,
  pan: PanParts['pan'],
  into: { x: number; y: number; angle: number },
) {
  const step = clamp(key, PAN_LOW_KEY, PAN_HIGH_KEY) - PAN_LOW_KEY
  const theta = ((step + 1) / (PAN_HIGH_KEY - PAN_LOW_KEY + 2)) * Math.PI
  const side = key & 1 ? 1 : -1
  into.x = pan.x + side * 0.66 * pan.r * Math.sin(theta)
  into.y = pan.y + 0.66 * pan.r * Math.cos(theta)
  into.angle = Math.atan2(into.y - pan.y, into.x - pan.x)
  return into
}

/** The enlarged note: its middle, half its length and half its breadth, and whether it lies along the display. */
interface PanNote {
  x: number
  y: number
  long: number
  short: number
  flat: boolean
}

function panNote(field: Box, tongue: boolean): PanNote {
  const flat = field.w >= field.h
  let long = (flat ? field.w : field.h) / 2 - 1
  let short = (flat ? field.h : field.w) / 2 - 1
  long = Math.min(long, short * 1.5)
  // A tongue is narrower than a note field.
  if (tongue) short *= 0.62
  return { x: field.x + field.w / 2, y: field.y + field.h / 2, long, short, flat }
}

/** A point of the enlarged note: `u` along it (toward a tongue's tip), `v` across. */
const panNoteX = (note: PanNote, u: number, v: number): number => note.x + (note.flat ? u : v)
const panNoteY = (note: PanNote, u: number, v: number): number => note.y + (note.flat ? v : -u)

/** How far the hand goes from the middle of the note at Position 1: toward the rim of a note field between its two nodal lines, toward the tip of a tongue. */
function panReach(note: PanNote, tongue: boolean): { u: number; v: number } {
  return tongue ? { u: 0.78 * note.long, v: 0 } : { u: 0.6 * note.long, v: -0.6 * note.short }
}

function panNotePath(ctx: CanvasRenderingContext2D, note: PanNote, tongue: boolean): void {
  ctx.beginPath()
  if (!tongue) {
    ctx.ellipse(
      note.x,
      note.y,
      note.flat ? note.long : note.short,
      note.flat ? note.short : note.long,
      0,
      0,
      Math.PI * 2,
    )
    return
  }
  // A tongue is cut free on three sides and held at the fourth.
  const tip = note.long - note.short
  ctx.moveTo(panNoteX(note, -note.long, -note.short), panNoteY(note, -note.long, -note.short))
  ctx.lineTo(panNoteX(note, tip, -note.short), panNoteY(note, tip, -note.short))
  if (note.flat) ctx.arc(note.x + tip, note.y, note.short, -Math.PI / 2, Math.PI / 2)
  else ctx.arc(note.x, note.y - tip, note.short, Math.PI, Math.PI * 2)
  ctx.lineTo(panNoteX(note, -note.long, note.short), panNoteY(note, -note.long, note.short))
}

/** The two lobes of an overtone on the enlarged note: either side of a nodal line across it (`along`) or along it. */
function panLobes(
  ctx: CanvasRenderingContext2D,
  note: PanNote,
  along: boolean,
  size: number,
): void {
  const halfU = (along ? 0.3 : 0.36) * note.long * size
  const halfV = (along ? 0.5 : 0.3) * note.short * size
  for (let side = -1; side <= 1; side += 2) {
    const u = along ? side * 0.52 * note.long : 0
    const v = along ? 0 : side * 0.5 * note.short
    ctx.beginPath()
    ctx.ellipse(
      panNoteX(note, u, v),
      panNoteY(note, u, v),
      note.flat ? halfU : halfV,
      note.flat ? halfV : halfU,
      0,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
}

/**
 * The corners of a tongue on the shell, from its held end round its tip and
 * back: how far out from its middle in lengths and px, how far across in
 * breadths and px.
 */
const TONGUE_CORNERS = [
  [1, 0, -1, 0],
  [-1, 1.5, -1, 0],
  [-1, 0, -1, 1.5],
  [-1, 0, 1, -1.5],
  [-1, 1.5, 1, 0],
  [1, 0, 1, 0],
] as const

/** A note that rings on the shell: an oval lying toward the middle for the pan, a tongue with its tip toward the middle for the tongue drum. Both are narrow, so neighbours on the scale are told apart. */
function panFieldPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  tongue: boolean,
): void {
  ctx.beginPath()
  if (!tongue) {
    ctx.ellipse(x, y, size, size * 0.62, angle, 0, Math.PI * 2)
    return
  }
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const wide = size * 0.62
  for (let index = 0; index < TONGUE_CORNERS.length; index++) {
    const [along, cut, side, trim] = TONGUE_CORNERS[index]
    const out = along * size + cut
    const across = side * wide + trim
    const px = x + out * cos - across * sin
    const py = y + out * sin + across * cos
    if (index === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
}

interface PanState {
  /** The notes that sound this frame: pitch, share of light, where each lies on the shell. */
  hz: Float32Array
  share: Float32Array
  x: Float32Array
  y: Float32Array
  /** Which of `frame.notes` each is. */
  index: Int16Array
  modes: number[]
  /** The light left in the three modes of the note under the hand. */
  sounding: number[]
  at: { x: number; y: number; angle: number }
}

const handpan = plateDisplay<PanState>({
  place: 'window',
  columns: 2,
  params: ['type', 'decay', 'touch', 'position', 'shimmer', 'cavity', 'sympathy', 'damp'],
  live: { signal: true, notes: true },
  info: 'The shell from above with a mark for each key, low at the near side and high at the far one, even keys left and odd right. A note that rings lights its place, and a line joins two that answer each other. Beside it the note under the hand and its overtones. Drag the hand to set Position.',
  init: () => ({
    hz: new Float32Array(HANDPAN_LIT_MOST),
    share: new Float32Array(HANDPAN_LIT_MOST),
    x: new Float32Array(HANDPAN_LIT_MOST),
    y: new Float32Array(HANDPAN_LIT_MOST),
    index: new Int16Array(HANDPAN_LIT_MOST),
    modes: [0, 0, 0],
    sounding: [0, 0, 0],
    at: { x: 0, y: 0, angle: 0 },
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const type = frame.value('type')
    const kind = handpanType(type)
    const tongue = kind.bloom !== 1
    const decay = frame.value('decay')
    const touch = clamp(frame.value('touch'), 0, 1)
    const position = clamp(frame.value('position'), 0, 1)
    const shimmer = clamp(frame.value('shimmer'), 0, 1)
    const cavity = clamp(frame.value('cavity'), 0, 1)
    const sympathy = clamp(frame.value('sympathy'), 0, 1)
    const damped = handpanDampedSeconds(decay, frame.value('damp'))
    const { pan, field, foot } = panParts(frame)
    const size = pan.r * 0.15
    // How far a mark turns off its line: a sixth of a half turn for an octave as far off true as Shimmer can put one, so neighbours never cross.
    const turnOf = (off: number): number => (off / HANDPAN_SHIMMER_HZ[0]) * (Math.PI / 6)

    // The shell.
    ctx.beginPath()
    ctx.arc(pan.x, pan.y, pan.r, 0, Math.PI * 2)
    ctx.globalAlpha = 0.07
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1.25
    ctx.stroke()
    ctx.globalAlpha = 1

    // The notes that sound: where each lies, how much of its light is left, and the thump each tap gave the air.
    const notes = frame.notes
    let lit = 0
    let thump = 0
    let said: DisplayNote | null = null
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      thump = Math.max(
        thump,
        shareOfDb(
          gainToDb(strokeStrength(note.gain) * cavity * kind.cavity) -
            (60 * note.age) / HANDPAN_CAVITY_SEC,
        ),
      )
      if (struckAgain(notes, index) || lit >= HANDPAN_LIT_MOST) continue
      const modes = handpanModes(
        type,
        position,
        touch,
        note.frequency,
        note.gain,
        state.modes,
        frame.sampleRate,
      )
      const share = shareOfDb(
        modeDb(modes[0], note.age, note.released, decay * kind.ring[0], damped),
      )
      if (share < DONE) continue
      said = note
      const at = panFieldAt(keyOfHz(note.frequency), pan, state.at)
      state.index[lit] = index
      state.hz[lit] = note.frequency
      state.share[lit] = share
      state.x[lit] = at.x
      state.y[lit] = at.y
      lit++
    }

    // The air in the shell: its port is as wide as Cavity, and every tap lights it for as long as the air rings.
    if (cavity > 0) {
      const port = pan.r * (0.1 + 0.16 * cavity)
      ctx.beginPath()
      ctx.arc(pan.x, pan.y, port, 0, Math.PI * 2)
      ctx.globalAlpha = 0.06 + 0.22 * cavity
      ctx.fillStyle = colours.ink
      ctx.fill()
      if (thump > DONE) {
        ctx.globalAlpha = thump
        ctx.fillStyle = colours.accent
        ctx.fill()
      }
      ctx.setLineDash([2, 2])
      ctx.globalAlpha = INK.back
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // The shell lets two ringing notes trade where their modes meet: a line between them, as strong as Sympathy and the weaker of the two.
    if (sympathy > 0) {
      for (let a = 1; a < lit; a++)
        for (let b = 0; b < a; b++) {
          if (!handpanAnswers(type, state.hz[a], state.hz[b])) continue
          rule(ctx, state.x[a], state.y[a], state.x[b], state.y[b], {
            colour: colours.accent,
            width: 1.5,
            alpha: clamp(
              sympathy * sympathy * Math.min(state.share[a], state.share[b]) * 1.4,
              0,
              1,
            ),
          })
        }
    }

    // The scale at rest: a mark where each key's note would lie, the Cs stronger. It is a scale and not a set of
    // fields: the shell holds only the notes that ring. Each mark is turned as far off its line as Shimmer puts
    // that key's octave off true, a little differently on every key, as the device draws it.
    for (const strong of [false, true]) {
      ctx.beginPath()
      for (let key = PAN_LOW_KEY; key <= PAN_HIGH_KEY; key++) {
        if ((key % 12 === 0) !== strong) continue
        const at = panFieldAt(key, pan, state.at)
        const off = handpanShimmerHz(type, 1, hzOfKey(key), shimmer, handpanBend(key)[0])
        const angle = at.angle + turnOf(off)
        const half = size * (strong ? 0.62 : 0.42)
        ctx.moveTo(at.x - half * Math.cos(angle), at.y - half * Math.sin(angle))
        ctx.lineTo(at.x + half * Math.cos(angle), at.y + half * Math.sin(angle))
      }
      ctx.globalAlpha = strong ? INK.text : INK.back
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // The notes that ring: lit as far as the note still sounds, the mark turning once for every beat of the octave against the note.
    for (let at = 0; at < lit; at++) {
      const note = notes[state.index[at]]
      const share = state.share[at]
      const key = keyOfHz(note.frequency)
      const where = panFieldAt(key, pan, state.at)
      panFieldPath(ctx, where.x, where.y, where.angle, size + 1, tongue)
      if (tongue) ctx.closePath()
      ctx.globalAlpha = 1
      ctx.fillStyle = colours.plate
      ctx.fill()
      ctx.globalAlpha = 0.25 + 0.75 * share
      ctx.fillStyle = colours.accent
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.25
      ctx.stroke()
      const off = handpanShimmerHz(type, 1, note.frequency, shimmer, handpanBend(key)[0])
      panMark(
        ctx,
        where.x,
        where.y,
        where.angle + turnOf(off) + Math.PI * off * note.age,
        size * 0.62,
      )
      ctx.strokeStyle = colours.plate
      ctx.lineWidth = 1.25
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // The note under the hand: its two nodal lines, and the octave and the twelfth as lobes either side of them, as large as the hand wakes them there.
    const big = panNote(field, tongue)
    const rest = handpanModes(
      type,
      position,
      touch,
      said ? said.frequency : C4_HZ,
      said ? said.gain : 0.6,
      state.modes,
      frame.sampleRate,
    )
    const octave = lobeSize(rest[1] / rest[0])
    const twelfth = lobeSize(rest[2] / rest[0])
    let sounding: number[] | null = null
    if (said) {
      sounding = state.sounding
      for (let k = 0; k < 3; k++)
        sounding[k] = shareOfDb(
          modeDb(rest[k], said.age, said.released, decay * kind.ring[k], damped),
        )
    }
    panNotePath(ctx, big, tongue)
    ctx.globalAlpha = 0.07
    ctx.fillStyle = colours.ink
    ctx.fill()
    if (sounding) {
      ctx.globalAlpha = 0.2 * sounding[0]
      ctx.fillStyle = colours.accent
      ctx.fill()
    }
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1.25
    ctx.stroke()
    if (sounding && sounding[0] > DONE) {
      ctx.globalAlpha = sounding[0]
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.75
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    if (!tongue) {
      rule(
        ctx,
        panNoteX(big, 0, -big.short),
        panNoteY(big, 0, -big.short),
        panNoteX(big, 0, big.short),
        panNoteY(big, 0, big.short),
        { colour: colours.ink, alpha: INK.back, dash: [2, 2] },
      )
      rule(
        ctx,
        panNoteX(big, -big.long, 0),
        panNoteY(big, -big.long, 0),
        panNoteX(big, big.long, 0),
        panNoteY(big, big.long, 0),
        { colour: colours.ink, alpha: INK.back, dash: [2, 2] },
      )
    }
    ctx.fillStyle = colours.ink
    ctx.globalAlpha = 0.26
    panLobes(ctx, big, true, octave)
    panLobes(ctx, big, false, twelfth)
    if (sounding) {
      ctx.fillStyle = colours.accent
      ctx.globalAlpha = sounding[1]
      panLobes(ctx, big, true, octave)
      ctx.globalAlpha = sounding[2]
      panLobes(ctx, big, false, twelfth)
    }
    ctx.globalAlpha = 1

    levelFoot(frame, foot, outShare(frame))

    // The words: which steel, and how long a note rings; the last one struck while one sounds.
    text(frame, kind.name, 5, 12)
    text(
      frame,
      `${said ? `${pitchName(said.frequency)} ` : ''}${secondsText(decay)}`,
      frame.width - 5,
      12,
      {
        align: 'right',
      },
    )

    // The hand: as broad as its contact is long, the pad of a finger down to a knuckle.
    for (const point of handpanHandles(frame))
      handle(frame, point.x, point.y, {
        hot: frame.hot === point.key,
        radius:
          2.5 +
          3 *
            ((handpanContactSeconds(touch) - HANDPAN_HARD_CONTACT) /
              (HANDPAN_SOFT_CONTACT - HANDPAN_HARD_CONTACT)),
      })
  },
  handles: handpanHandles,
})

/** The mark in a note that rings: a short line through its middle. */
function panMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  half: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x - half * Math.cos(angle), y - half * Math.sin(angle))
  ctx.lineTo(x + half * Math.cos(angle), y + half * Math.sin(angle))
}

function handpanHandles(view: DisplayView): DisplayHandle[] {
  const tongue = handpanType(view.value('type')).bloom !== 1
  const note = panNote(panParts(view).field, tongue)
  const reach = panReach(note, tongue)
  const position = clamp(view.value('position'), 0, 1)
  const x0 = panNoteX(note, 0, 0)
  const y0 = panNoteY(note, 0, 0)
  const dx = panNoteX(note, reach.u, reach.v) - x0
  const dy = panNoteY(note, reach.u, reach.v) - y0
  return [
    {
      key: 'position',
      name: 'Position',
      x: x0 + position * dx,
      y: y0 + position * dy,
      drag: (toX, toY) => ({
        position: clamp(((toX - x0) * dx + (toY - y0) * dy) / (dx * dx + dy * dy), 0, 1),
      }),
      reset: () => ({ position: view.spec('position')?.default ?? 0.45 }),
    },
  ]
}

// --- Bells -------------------------------------------------------------------

type BellFamily = 'shell' | 'bar' | 'tine' | 'plate'
/** A mode: its ratio to the note, how hard a strike lights it, its shape for Position (`a`, `b`), which half of a pair it is (`mate`, in units of Detune) and how far rubbing holds it. */
type BellMode = readonly [
  ratio: number,
  level: number,
  a: number,
  b: number,
  mate: number,
  rub: number,
]

/** `modal_bells.h`, `kTables`: the modes of each material, and what evens out how loud a strike on it is. */
const BELL_MATERIALS: readonly {
  name: string
  family: BellFamily
  gain: number
  modes: readonly BellMode[]
}[] = [
  {
    name: 'Church bell',
    family: 'shell',
    gain: 0.6,
    modes: [
      [0.5, 0.27, 0, 0, 0.5, 0.6],
      [0.5, 0.18, 0, 0, -0.5, 0.4],
      [1, 0.36, 0.7, 0, 0.7, 0.2],
      [1, 0.24, 0.7, 0, -0.7, 0.1],
      [1.2, 0.48, 0.5, 0, 0.9, 0.1],
      [1.2, 0.32, 0.5, 0, -0.9, 0],
      [1.5, 0.25, 2, 0, 0, 0],
      [2, 0.6, 0.3, 0, 1.2, 0],
      [2, 0.4, 0.3, 0, -1.2, 0],
      [2.5, 0.35, 1.5, 0, 0, 0],
      [3, 0.33, 1, 0, 1.6, 0],
      [3, 0.22, 1, 0, -1.6, 0],
      [4, 0.4, 1.3, 0, 0, 0],
      [5.33, 0.2, 1.7, 0, 0, 0],
      [6.67, 0.12, 2.2, 0, 0, 0],
      [8, 0.08, 2.6, 0, 0, 0],
    ],
  },
  {
    name: 'Singing bowl',
    family: 'shell',
    gain: 1,
    modes: [
      [1, 0.6, 0, 0, 0.5, 0.6],
      [1, 0.4, 0, 0, -0.5, 0.4],
      [2.77, 0.36, 0.6, 0, 0.8, 0.18],
      [2.77, 0.24, 0.6, 0, -0.8, 0.12],
      [5.17, 0.21, 1, 0, 1.15, 0.05],
      [5.17, 0.14, 1, 0, -1.15, 0.03],
      [8.14, 0.12, 1.4, 0, 1.5, 0],
      [8.14, 0.08, 1.4, 0, -1.5, 0],
      [11.64, 0.06, 1.8, 0, 1.9, 0],
      [11.64, 0.04, 1.8, 0, -1.9, 0],
      [15.6, 0.036, 2.2, 0, 2.3, 0],
      [15.6, 0.024, 2.2, 0, -2.3, 0],
    ],
  },
  {
    name: 'Vibraphone',
    family: 'bar',
    gain: 1,
    modes: [
      [1, 0.6, 1, 0, 0.5, 0.6],
      [1, 0.4, 1, 0, -0.5, 0.4],
      [4, 0.27, 2, 0, 0.8, 0.1],
      [4, 0.18, 2, 0, -0.8, 0.05],
      [10, 0.13, 3, 0, 1.2, 0],
      [10, 0.09, 3, 0, -1.2, 0],
      [18.2, 0.1, 4, 0, 0, 0],
      [28.4, 0.05, 5, 0, 0, 0],
    ],
  },
  {
    name: 'Bar',
    family: 'bar',
    gain: 1,
    modes: [
      [1, 0.6, 1, 0, 0.5, 0.6],
      [1, 0.4, 1, 0, -0.5, 0.4],
      [2.757, 0.36, 2, 0, 0.8, 0.1],
      [2.757, 0.24, 2, 0, -0.8, 0.05],
      [5.404, 0.24, 3, 0, 1.2, 0],
      [5.404, 0.16, 3, 0, -1.2, 0],
      [8.933, 0.17, 4, 0, 1.6, 0],
      [8.933, 0.11, 4, 0, -1.6, 0],
      [13.345, 0.18, 5, 0, 0, 0],
      [18.64, 0.12, 6, 0, 0, 0],
      [24.81, 0.08, 7, 0, 0, 0],
    ],
  },
  {
    name: 'Kalimba',
    family: 'tine',
    gain: 1,
    modes: [
      [1, 0.6, 1, 0, 0.5, 0.6],
      [1, 0.4, 1, 0, -0.5, 0.4],
      [6.263, 0.21, 2, 0, 0.8, 0.05],
      [6.263, 0.14, 2, 0, -0.8, 0],
      [17.54, 0.09, 3, 0, 1.2, 0],
      [17.54, 0.06, 3, 0, -1.2, 0],
      [34.37, 0.07, 4, 0, 0, 0],
      [56.82, 0.03, 5, 0, 0, 0],
    ],
  },
  {
    name: 'Glass',
    family: 'shell',
    gain: 1,
    modes: [
      [1, 0.6, 0, 0, 0.5, 0.6],
      [1, 0.4, 0, 0, -0.5, 0.4],
      [2.32, 0.24, 0.6, 0, 0.8, 0.09],
      [2.32, 0.16, 0.6, 0, -0.8, 0.06],
      [4.25, 0.12, 1, 0, 1.15, 0.02],
      [4.25, 0.08, 1, 0, -1.15, 0.01],
      [6.63, 0.06, 1.4, 0, 1.5, 0],
      [6.63, 0.04, 1.4, 0, -1.5, 0],
      [9.38, 0.03, 1.8, 0, 1.9, 0],
      [9.38, 0.02, 1.8, 0, -1.9, 0],
    ],
  },
  {
    name: 'Gong',
    family: 'plate',
    gain: 0.8,
    modes: [
      [1, 0.6, 2, 0, 0.5, 0.6],
      [1, 0.4, 2, 0, -0.5, 0.4],
      [1.73, 0.8, 0, 1, 0, 0.3],
      [2.33, 0.42, 3, 0, 0.9, 0.1],
      [2.33, 0.28, 3, 0, -0.9, 0.1],
      [3.91, 0.6, 1, 1, 0, 0],
      [4.11, 0.55, 4, 0, 0, 0],
      [6.3, 0.45, 5, 0, 0, 0],
      [6.71, 0.27, 2, 1, 1.4, 0],
      [6.71, 0.18, 2, 1, -1.4, 0],
      [7.34, 0.4, 0, 2, 0, 0],
      [8.8, 0.3, 6, 0, 0, 0],
      [10.07, 0.3, 3, 1, 0, 0],
      [11.4, 0.25, 1, 2, 0, 0],
      [13.92, 0.2, 4, 1, 0, 0],
      [16.71, 0.15, 0, 3, 0, 0],
    ],
  },
]
const BELL_SLOTS = 16
/** `modal_bells.h`: the mallet's contact in periods of the note, soft and hard, and the longest it is. */
const BELL_SOFT_PULSE = 0.9
const BELL_HARD_PULSE = 0.03
const BELL_PULSE_MOST = 0.008
/** `modal_bells.h`: how much faster a mode dies per unit of ratio over the lowest, for metal, and how many times that for wood. */
const BELL_DAMPING_LEAST = 0.02
const BELL_DAMPING_SPAN = 100
/** `modal_bells.h`: a full Release stops a note in this long, and near none it may ring this many times longer. */
const BELL_CHOKE_SEC = 0.1
const BELL_CHOKE_SPAN = 400
/** `modal_bells.h`: how fast rubbing closes on its level, that level and a strike's, and how far a mode under a fifth of its level may grow in one such time. */
const BELL_RUB_SEC = 0.3
const BELL_RUB_LEVEL = 0.4
const BELL_STRIKE_LEVEL = 0.6
const BELL_RUB_MOST = 4
/** `modal_bells.h`: Brightness tilts by this power of the ratio, half of it either way, and a pair's far half goes this far past its side. */
const BELL_TILT = 1.5
const BELL_FAR_SIDE = 0.8

const bellMaterial = (material: number) =>
  BELL_MATERIALS[clamp(Math.round(material), 0, BELL_MATERIALS.length - 1)]

/** `ModalBells::weight`: how far a mode moves where the mallet lands; 0 is the edge or the rim, 1 the middle. */
export function bellWeight(family: BellFamily, a: number, b: number, position: number): number {
  switch (family) {
    case 'bar': {
      const angle = (a + 0.5) * Math.PI * (0.5 * position - 0.5)
      return Math.trunc(a) & 1 ? Math.cos(angle) : Math.sin(angle)
    }
    case 'tine':
      return Math.sin((a - 0.5) * Math.PI * (1 - 0.9 * position))
    case 'plate': {
      const radius = 1 - position
      return Math.pow(radius, 0.7 * a) * Math.cos(b * Math.PI * Math.pow(radius, 1.8))
    }
    default:
      return Math.cos(a * (Math.PI / 2) * position)
  }
}

/** `ModalBells::strike`: how long the mallet is on a note at `hz` struck as hard as `gain`, in periods of the note. */
export function bellPulsePeriods(
  hardness: number,
  gain: number,
  hz: number,
  sampleRate = 48000,
): number {
  const periods =
    BELL_SOFT_PULSE *
    Math.pow(BELL_HARD_PULSE / BELL_SOFT_PULSE, hardness * hardness) *
    (1.5 - gain)
  return (clamp((periods * sampleRate) / hz, 2, BELL_PULSE_MOST * sampleRate) * hz) / sampleRate
}

/** `ModalBells::tune`: the pitch of mode `k` of a note at `hz`. */
export function bellModeHz(
  material: number,
  k: number,
  hz: number,
  stretch: number,
  detune: number,
): number {
  const mode = bellMaterial(material).modes[k]
  return hz * Math.pow(mode[0], stretch) + detune * mode[4]
}

/** `ModalBells::tune`: seconds a mode `over` times the lowest in pitch takes to fall 60 dB. Decay is the lowest mode's; the rest die sooner the higher they lie, by Damping. */
export function bellRingSeconds(decay: number, damping: number, over: number): number {
  return decay / (1 + BELL_DAMPING_LEAST * Math.pow(BELL_DAMPING_SPAN, damping) * (over - 1))
}

/** The lowest mode of a material as Stretch leaves it, as a ratio to the note. */
function bellLowest(material: number, stretch: number): number {
  let lowest = Infinity
  for (const mode of bellMaterial(material).modes)
    lowest = Math.min(lowest, Math.pow(mode[0], stretch))
  return lowest
}

/** `ModalBells::tune`: seconds mode `k` takes to fall 60 dB. */
export function bellModeSeconds(
  material: number,
  k: number,
  decay: number,
  damping: number,
  stretch: number,
): number {
  const ratio = Math.pow(bellMaterial(material).modes[k][0], stretch)
  return bellRingSeconds(decay, damping, ratio / bellLowest(material, stretch))
}

/** `ModalBells::tune`: the longest any mode rings once its key is let go; forever with no Release. */
export function bellChokeSeconds(release: number): number {
  return release > 0.001 ? BELL_CHOKE_SEC * Math.pow(BELL_CHOKE_SPAN, 1 - release) : Infinity
}

/**
 * `ModalBells::strike`: what a strike leaves in mode `k`, against the most a
 * mode can be left. The mallet's push is as long as `periods` of the note, so
 * a soft one does not reach the high modes; rubbing takes the mallet's place
 * as Sustain comes up.
 */
export function bellStrike(
  material: number,
  k: number,
  position: number,
  periods: number,
  modeRatio: number,
  gain: number,
  sustain: number,
): number {
  const { family, gain: even, modes } = bellMaterial(material)
  const mode = modes[k]
  const hit = strokeStrength(gain) * (1 - 0.9 * sustain * sustain)
  return Math.abs(
    hit *
      even *
      mode[1] *
      bellWeight(family, mode[2], mode[3], position) *
      pushResponse(periods * modeRatio),
  )
}

/** `ModalBells::control`: the size rubbing holds mode `k` at while the key is down, on the scale of `bellStrike`. */
export function bellRubLevel(material: number, k: number, gain: number, sustain: number): number {
  return (
    (bellMaterial(material).modes[k][5] * BELL_RUB_LEVEL * sustain * (0.25 + 0.75 * gain)) /
    BELL_STRIKE_LEVEL
  )
}

/** `ModalBells::gains`: what Brightness makes of a mode at `ratio` on its way out. */
export const bellTilt = (ratio: number, brightness: number): number =>
  Math.pow(ratio, BELL_TILT * (brightness - 0.5))

/**
 * `ModalBells::gains`: where mode `k` stands between the speakers, -1 (left)
 * to 1 and beyond: the near half of a pair stays in the middle, the far half
 * goes to a side and past it into the other speaker turned over, pair by pair
 * to alternate sides; a single mode goes a little to one side, then the other.
 */
export function bellPan(material: number, k: number, spread: number): number {
  const { modes } = bellMaterial(material)
  const mate = modes[k][4]
  if (mate > 0) return 0
  if (mate === 0) return (k & 1 ? 0.8 : -0.8) * spread
  let pairs = 0
  for (let below = 0; below < k; below++) if (modes[below][4] < 0) pairs++
  return (pairs & 1 ? 2 : -2) * BELL_FAR_SIDE * spread
}

/**
 * `ModalBells::control`: the size of a mode `since` seconds after a strike
 * left it `size`, let go `released` seconds ago (null while held). While the
 * key is down a mode under its rub level `rub` grows to it, by `BELL_RUB_MOST`
 * times itself in `BELL_RUB_SEC` at most, and one over it rings down to it and
 * is held there. Let go, it rings out, no longer than `choke`.
 */
export function bellModeSize(
  size: number,
  rub: number,
  since: number,
  released: number | null,
  ring: number,
  choke: number,
): number {
  const after = released === null ? 0 : Math.min(released, since)
  const held = since - after
  let now: number
  if (rub <= 0) now = size * Math.pow(10, (-3 * held) / ring)
  else if (size >= rub) now = Math.max(size * Math.pow(10, (-3 * held) / ring), rub)
  else {
    const from = Math.max(size, 1e-4 * rub)
    const fast = BELL_RUB_MOST / BELL_RUB_SEC
    const climb = from < rub / 5 ? Math.log(rub / 5 / from) / fast : 0
    now =
      held <= climb
        ? from * Math.exp(fast * held)
        : rub - (rub - Math.max(from, rub / 5)) * Math.exp(-(held - climb) / BELL_RUB_SEC)
  }
  return now * Math.pow(10, (-3 * after) / Math.min(ring, choke))
}

/**
 * The octaves about the note that the picture of each material spans: its own
 * modes at the widest Stretch, so they take two thirds of it at the true
 * spacing and Stretch has room to move them.
 */
const BELL_SPANS = BELL_MATERIALS.map(({ modes }) => {
  const octaves = modes.map((mode) => 1.5 * Math.log2(mode[0]))
  return { low: Math.min(0, ...octaves) - 0.4, high: Math.max(...octaves) + 0.3 }
})
const bellSpan = (material: number) =>
  BELL_SPANS[clamp(Math.round(material), 0, BELL_SPANS.length - 1)]
/** The ring times a mode's height spans, on a scale of ratios. */
const BELL_SHORT_SEC = 0.03
const BELL_LONG_SEC = 60
/** A pair beating faster than this is drawn steady: a frame is too long to show it. */
const BELL_BEAT_MOST = 6
/** How far a mode all the way to one side leans, as a share of its height. */
const BELL_LEAN = 0.07

const bellHeight = (ring: number): number =>
  clamp(Math.log(ring / BELL_SHORT_SEC) / Math.log(BELL_LONG_SEC / BELL_SHORT_SEC), 0.03, 1)
const bellSecondsOf = (height: number): number =>
  BELL_SHORT_SEC * Math.pow(BELL_LONG_SEC / BELL_SHORT_SEC, height)

interface BellParts {
  /** Where the modes stand: their feet at `y + h`, the longest ringing reaching `y`. */
  modes: Box
  foot: Box
}

function bellParts(view: Size): BellParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  return {
    modes: { x: all.x + 5, y: all.y + 12, w: all.w - 10, h: all.h - 12 - 12 },
    foot: { x: all.x, y: all.y + all.h - 6, w: all.w, h: 6 },
  }
}

/** Where a mode stands across the picture: by its ratio to the note, and a pair's two halves the further apart the faster they beat. */
function bellModeX(
  material: number,
  k: number,
  stretch: number,
  detune: number,
  modes: Box,
): number {
  const mode = bellMaterial(material).modes[k]
  const octave = stretch * Math.log2(mode[0])
  const { low, high } = bellSpan(material)
  const share = clamp((octave - low) / (high - low), 0, 1)
  const apart = Math.min(7, 2.2 * Math.pow(detune * Math.abs(mode[4]) * 2, 0.35))
  return modes.x + share * modes.w + (Math.sign(mode[4]) * apart) / 2
}

interface BellState {
  /** Per mode: whether it is in the band, where it stands, how far its top leans, how tall it is, its ring, what a strike and a rub leave it, and the light on it. */
  there: Uint8Array
  x: Float32Array
  lean: Float32Array
  tall: Float32Array
  ring: Float32Array
  struck: Float32Array
  rubbed: Float32Array
  lit: Float32Array
  size: Float32Array
}

const bells = plateDisplay<BellState>({
  place: 'window',
  columns: 2,
  params: [
    'material',
    'decay',
    'damping',
    'hardness',
    'position',
    'detune',
    'stretch',
    'sustain',
    'brightness',
    'release',
    'spread',
  ],
  live: { signal: true, notes: true },
  info: 'The modes of the material from low to high, each as tall as it rings, as broad as a strike wakes it and leaning to its side of the speakers; the dashed line is how long a note rings once let go. A struck mode lights and its light runs down. Drag the handle to set Decay.',
  init: () => ({
    there: new Uint8Array(BELL_SLOTS),
    x: new Float32Array(BELL_SLOTS),
    lean: new Float32Array(BELL_SLOTS),
    tall: new Float32Array(BELL_SLOTS),
    ring: new Float32Array(BELL_SLOTS),
    struck: new Float32Array(BELL_SLOTS),
    rubbed: new Float32Array(BELL_SLOTS),
    lit: new Float32Array(BELL_SLOTS),
    size: new Float32Array(BELL_SLOTS),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const material = frame.value('material')
    const table = bellMaterial(material)
    const count = table.modes.length
    const decay = frame.value('decay')
    const damping = frame.value('damping')
    const hardness = frame.value('hardness')
    const position = frame.value('position')
    const detune = frame.value('detune')
    const stretch = frame.value('stretch')
    const sustain = clamp(frame.value('sustain'), 0, 1)
    const brightness = frame.value('brightness')
    const choke = bellChokeSeconds(frame.value('release'))
    const spread = frame.value('spread')
    const { modes, foot } = bellParts(frame)
    const feet = modes.y + modes.h
    const top = frame.sampleRate * TOP_OF_BAND

    // The note the picture is of: the last one sent, middle C while there is none.
    const notes = frame.notes
    const last = notes.length > 0 ? notes[notes.length - 1] : null
    const hz = last ? last.frequency : C4_HZ
    const gain = last ? last.gain : 0.8
    const periods = bellPulsePeriods(hardness, gain, hz, frame.sampleRate)
    for (let k = 0; k < count; k++) {
      const ratio = Math.pow(table.modes[k][0], stretch)
      const modeHz = bellModeHz(material, k, hz, stretch, detune)
      state.there[k] = modeHz < top && modeHz >= 5 ? 1 : 0
      state.x[k] = bellModeX(material, k, stretch, detune, modes)
      state.ring[k] = bellModeSeconds(material, k, decay, damping, stretch)
      state.tall[k] = bellHeight(state.ring[k]) * modes.h
      state.lean[k] = bellPan(material, k, spread) * BELL_LEAN * state.tall[k]
      const tilt = bellTilt(table.modes[k][0], brightness)
      state.struck[k] = shareOfDb(
        gainToDb(tilt * bellStrike(material, k, position, periods, ratio, gain, sustain)),
      )
      state.rubbed[k] = shareOfDb(gainToDb(tilt * bellRubLevel(material, k, gain, sustain)))
      state.lit[k] = 0
    }

    // The scale: a second and ten seconds, and the octaves of the note along the foot.
    for (const seconds of [1, 10]) {
      const y = feet - bellHeight(seconds) * modes.h
      rule(ctx, modes.x - 3, y, modes.x + modes.w + 3, y, { colour: colours.ink, alpha: INK.grid })
      label(frame, `${seconds} s`, modes.x + modes.w + 4, y - 2, 'right')
    }
    const span = bellSpan(material)
    for (let octave = Math.ceil(span.low); octave <= span.high; octave++) {
      const x = modes.x + ((octave - span.low) / (span.high - span.low)) * modes.w
      rule(ctx, x, feet + 1, x, feet + (octave === 0 ? 4 : 2), {
        colour: colours.ink,
        alpha: octave === 0 ? INK.text : INK.back,
      })
    }
    rule(ctx, modes.x - 3, feet, modes.x + modes.w + 3, feet, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    // Let go, no mode rings longer than this.
    if (Number.isFinite(choke)) {
      const y = feet - bellHeight(choke) * modes.h
      rule(ctx, modes.x - 3, y, modes.x + modes.w + 3, y, {
        colour: colours.ink,
        alpha: INK.back,
        dash: [2, 2],
      })
    }

    // The law their tops follow: how long a mode rings by how far it lies over the lowest, as Decay and Damping set it.
    const lowest = bellLowest(material, stretch)
    const from = modes.x + ((Math.log2(lowest) - span.low) / (span.high - span.low)) * modes.w
    ctx.beginPath()
    for (let x = from; x < modes.x + modes.w + 3; x += 3) {
      const octave = span.low + ((x - modes.x) / modes.w) * (span.high - span.low)
      const y =
        feet - bellHeight(bellRingSeconds(decay, damping, Math.pow(2, octave) / lowest)) * modes.h
      if (x === from) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1

    // The modes at rest, each a spike: as tall as it rings, as broad at the foot as a strike here wakes it, leaning to its side of the speakers.
    for (let k = 0; k < count; k++) {
      if (!state.there[k]) continue
      bellSpike(ctx, state.x[k], feet, state.lean[k], state.tall[k], state.struck[k], 1)
      ctx.globalAlpha = state.struck[k] > 0 || state.rubbed[k] > 0 ? 0.6 : 0.3
      ctx.fillStyle = colours.ink
      ctx.fill()
      // Rubbing holds it here while the key is down.
      if (state.rubbed[k] > 0) {
        const x = state.x[k] + state.lean[k] * state.rubbed[k]
        const y = feet - state.tall[k] * state.rubbed[k]
        rule(ctx, x - 3, y, x + 3, y, { colour: colours.ink, width: 1.5 })
      }
    }
    ctx.globalAlpha = 1

    // The notes that sound: every mode's light is as high as the loudest note leaves it. A pair is heard as one tone that beats, so its two halves rise and fall together.
    let sounding = false
    for (const note of notes) {
      const pulse = bellPulsePeriods(hardness, note.gain, note.frequency, frame.sampleRate)
      for (let k = 0; k < count; k++) {
        const modeHz = bellModeHz(material, k, note.frequency, stretch, detune)
        state.size[k] =
          modeHz < top && modeHz >= 5
            ? bellModeSize(
                bellStrike(
                  material,
                  k,
                  position,
                  pulse,
                  Math.pow(table.modes[k][0], stretch),
                  note.gain,
                  sustain,
                ),
                bellRubLevel(material, k, note.gain, sustain),
                note.age,
                note.released,
                state.ring[k],
                choke,
              )
            : 0
      }
      for (let k = 0; k < count; k++) {
        const mate = table.modes[k][4]
        let size = state.size[k]
        if (mate !== 0) {
          const other = state.size[mate > 0 ? k + 1 : k - 1]
          const beat = detune * Math.abs(mate) * 2
          size =
            beat > BELL_BEAT_MOST
              ? Math.hypot(size, other)
              : Math.sqrt(
                  Math.max(
                    0,
                    size * size +
                      other * other +
                      2 * size * other * Math.cos(2 * Math.PI * beat * note.age),
                  ),
                )
        }
        const share = shareOfDb(gainToDb(size * bellTilt(table.modes[k][0], brightness)))
        if (share > state.lit[k]) state.lit[k] = share
      }
    }
    ctx.fillStyle = colours.accent
    for (let k = 0; k < count; k++) {
      const share = state.lit[k]
      if (!state.there[k] || share < DONE) continue
      sounding = true
      bellSpike(ctx, state.x[k], feet, state.lean[k], state.tall[k], state.struck[k], share)
      ctx.fill()
      dot(
        ctx,
        state.x[k] + state.lean[k] * share,
        feet - state.tall[k] * share,
        1.5,
        colours.accent,
      )
    }

    levelFoot(frame, foot, outShare(frame))

    // The words: what is struck, and how long its lowest mode rings.
    text(frame, table.name, 5, 12)
    text(
      frame,
      `${sounding && last ? `${pitchName(last.frequency)} ` : ''}${secondsText(decay)}`,
      frame.width - 5,
      12,
      { align: 'right' },
    )

    for (const point of bellHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: bellHandles,
})

/**
 * The path of a mode's spike from its foot up to `reach` of its height: `wide`
 * is how hard it is struck, as a share, and the spike narrows to its top as
 * the mode dies.
 */
function bellSpike(
  ctx: CanvasRenderingContext2D,
  x: number,
  feet: number,
  lean: number,
  tall: number,
  wide: number,
  reach: number,
): void {
  const foot = 0.6 + 3.4 * wide
  const top = Math.max(0.6, foot * (1 - reach))
  ctx.beginPath()
  ctx.moveTo(x - foot, feet)
  ctx.lineTo(x + foot, feet)
  ctx.lineTo(x + lean * reach + top, feet - tall * reach)
  ctx.lineTo(x + lean * reach - top, feet - tall * reach)
  ctx.closePath()
}

function bellHandles(view: DisplayView): DisplayHandle[] {
  const material = view.value('material')
  const { modes } = bellParts(view)
  const feet = modes.y + modes.h
  const tall = bellHeight(view.value('decay')) * modes.h
  // The lowest mode is the first of every material, and Decay is its ring.
  const x =
    bellModeX(material, 0, view.value('stretch'), view.value('detune'), modes) +
    bellPan(material, 0, view.value('spread')) * BELL_LEAN * tall
  return [
    {
      key: 'decay',
      name: 'Decay',
      x,
      y: feet - tall,
      drag: (_x, toY) => ({ decay: bellSecondsOf(clamp((feet - toY) / modes.h, 0, 1)) }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 12 }),
    },
  ]
}

export const BARS_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  mallets: { display: mallets, face: ['instrument', 'mallet', 'decay', 'resonator'] },
  handpan: { display: handpan, face: ['type', 'decay', 'touch', 'position'] },
  'modal-bells': { display: bells, face: ['material', 'decay', 'hardness', 'position'] },
}
