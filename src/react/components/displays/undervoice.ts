// The display of Undervoice: a few cycles of one key as its folds make them. At
// the top, in the ink, the pulses of the true folds, as high as the false folds
// over them (the line in the accent, a hump for every group) let each be, and
// under them the tone this adds below and, where it falls in drops, how long
// they ring. Both change as the door turns to the
// second division and back, and the device reports nothing of it: the door
// starts with the first key after a silence, as it does there. Under these is
// the throat over a scale of pitch with the sound in it, each key in the ink
// and what it sings under itself in the accent, and the line of the vowels: the
// ring is the knob, the dot is where the mouth is.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  fillBetween,
  fillTo,
  ground,
  handle,
  lerp,
  responsePoints,
  rule,
  spectrum,
  text,
  trace,
  xOfHz,
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
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'
import {
  undervoiceDivision,
  undervoiceDoor,
  undervoiceFloorHz,
  undervoiceGate,
  undervoiceGroup,
  undervoiceRise,
  undervoiceThroat,
  undervoiceVowel,
  type Read,
} from './undervoice-throat'

const WORDS = 'Open voice,Octave under,Twelfth under,Two octaves,Flutter,Drips,Shared pulse'
const VOWELS = ['Oo', 'Oh', 'Ah', 'Eh', 'Ee', 'Ue']

const REST_HZ = 146.83
const LOW_HZ = 36
const HIGH_HZ = 7000

interface UndervoiceState extends HeardLevel {
  flip: number
  asleep: boolean
}

/** Where its parts stand: the pulses, the tone under them, the throat, the line of the vowels. */
export function undervoiceLayout({ width, height }: Pick<DisplayView, 'width' | 'height'>) {
  const w = width - 8
  const lane = height - 20
  const h = Math.round((lane - 20) * 0.42)
  const folds: Box = { x: 4, y: 16, w, h }
  const floor: Box = { x: 4, y: 17 + h, w, h: 11 }
  const throat: Box = { x: 4, y: 31 + h, w, h: lane - 35 - h }
  return { folds, floor, throat, lane, foot: { x: 4, y: height - 8, w, h: 4 } }
}

/** How many groups of each first division are shown. */
export const UNDERVOICE_GROUPS = [4, 3, 2, 2, 1, 2, 1]

/** The key and what lies under it, as it is said. */
export function undervoiceWords(hz: number, n: number): string {
  const under = hz / n
  if (n === 1) return pitchName(hz)
  if (under >= 42) return `${pitchName(hz)} over ${pitchName(under)}`
  return `${pitchName(hz)}, ${under.toFixed(under < 10 ? 1 : 0)} Hz`
}

interface Now {
  note: boolean
  hz: number
  n: number
  keys: readonly number[]
  door: number
  loud: number
  swing: number
}

function drawFolds(frame: DisplayFrame<UndervoiceState>, now: Now): void {
  const { ctx, colours } = frame
  const { folds, floor } = undervoiceLayout(frame)
  const value: Read = (name) => frame.value(name)
  const gates = [now.n, value('second')].map((n, k) => undervoiceGate(value, now.hz, n, k === 0))
  const span = now.n * UNDERVOICE_GROUPS[undervoiceDivision(value)]
  const foot = folds.y + folds.h
  const middle = floor.y + floor.h / 2
  const whisper = value('whisper')
  const high = folds.h * 0.92 * clamp(now.loud / 1.15, 0, 1)
  // Pulses too many to be told apart are drawn every few of them.
  const every = Math.max(1, Math.ceil((span * 2.5) / folds.w))
  const [air, pulses, hump, tone, over, below]: Point[][] = [[], [], [], [], [], []]
  // How far the rings have fallen since the gate fed them; the group before has left some.
  let rung = Math.pow(gates[0].keeps, now.n * 0.7)
  const steps = Math.round(folds.w * 3)
  for (let i = 0; i <= steps; i++) {
    const cycles = (i / steps) * span
    const x = folds.x + (i / steps) * folds.w
    const open = ((cycles / every) % 1) / (0.84 - 0.5 * value('closure'))
    const flow = open < 1 ? 6.75 * open * open * (1 - open) : 0
    const gate = lerp(gates[0].at(cycles), gates[1].at(cycles), now.door)
    pulses.push([x, foot - high * gate * flow * (1 - 0.88 * whisper * whisper)])
    air.push([x, foot - high * gate * whisper * (0.3 + 0.7 * flow)])
    rung = Math.max(rung * Math.pow(gates[0].keeps, span / steps), gates[0].at(cycles))
    if (i % 3 !== 0) continue
    hump.push([x, foot - 1 - 0.95 * folds.h * gate])
    const [one, two] = gates.map(
      (each) => (each.floor / (each.floor + 1.2)) * Math.sin((2 * Math.PI * cycles) / each.cycles),
    )
    const ring = gates[0].drip * rung * (floor.h / 2) * (high / folds.h)
    over.push([x, middle - ring])
    below.push([x, middle + ring])
    tone.push([x, middle - (high / folds.h) * lerp(one, two, now.door) * (floor.h / 2)])
  }
  fillTo(ctx, hump, foot, colours.accent, 0.14)
  fillTo(ctx, air, foot, colours.ink, 0.28)
  fillTo(ctx, pulses, foot, colours.ink, now.note ? 0.95 : 0.7)
  trace(ctx, hump, { colour: colours.accent, width: 1.25 })
  fillBetween(ctx, over, below, colours.ink, now.note ? 0.6 : 0.4)
  fillTo(ctx, tone, middle, colours.accent, now.note ? 0.75 : 0.5)
  trace(ctx, tone, { colour: colours.accent, width: 1 })
}

function drawThroat(frame: DisplayFrame<UndervoiceState>, { note, keys, swing }: Now): void {
  const { ctx, colours } = frame
  const { throat, lane } = undervoiceLayout(frame)
  const foot = throat.y + throat.h
  const value: Read = (name) => frame.value(name)
  spectrum(frame, throat, { topDb: -22, bottomDb: -92, alpha: 0.35, minHz: LOW_HZ, maxHz: HIGH_HZ })
  const through = undervoiceThroat(value, swing)
  const curve = responsePoints(throat, through, 24, -46, LOW_HZ, HIGH_HZ)
  clipped(ctx, throat, () => trace(ctx, curve, { colour: colours.ink, width: 1.25 }))
  const lit = note ? 1 : 0.6
  for (const hz of keys) {
    const under = undervoiceFloorHz(hz, undervoiceGroup(value, hz, keys))
    const x = xOfHz(hz, throat, LOW_HZ, HIGH_HZ)
    const low = xOfHz(under, throat, LOW_HZ, HIGH_HZ)
    if (under < hz) fillRect(ctx, { x: low - 1, y: foot - 10, w: 2, h: 10 }, colours.accent, lit)
    fillRect(ctx, { x: x - 0.5, y: foot - 6, w: 1, h: 6 }, colours.ink, lit)
  }
  const [left, wide] = [throat.x + 4, throat.w - 8]
  rule(ctx, left, lane, left + wide, lane, { colour: colours.ink, alpha: INK.back })
  VOWELS.forEach((name, k) => {
    const align = k === 0 ? 'left' : k === 5 ? 'right' : 'center'
    const x = left + (k / 5) * wide + (k === 0 ? -3 : k === 5 ? 3 : 0)
    text(frame, name, x, lane + 9, { align })
  })
  dot(ctx, left + undervoiceVowel(value, swing) * wide, lane, 2, colours.accent)
}

function handlesOf(view: DisplayView): [DisplayHandle, DisplayHandle] {
  const { folds, throat, lane } = undervoiceLayout(view)
  const group = folds.w / UNDERVOICE_GROUPS[undervoiceDivision((name) => view.value(name))]
  const [left, wide] = [throat.x + 4, throat.w - 8]
  const first = (name: string): number => view.spec(name)?.default ?? 0
  return [
    {
      key: 'gate',
      name: 'Skew and Depth',
      x: folds.x + undervoiceRise(view.value('skew')) * group,
      y: folds.y + view.value('depth') * folds.h,
      drag(x, y) {
        const rise = clamp(((x - folds.x) / group - 0.015) / 0.965, 0, 1)
        return { skew: Math.pow(rise, 1 / 1.15), depth: clamp((y - folds.y) / folds.h, 0, 1) }
      },
      reset: () => ({ skew: first('skew'), depth: first('depth') }),
    },
    {
      key: 'vowel',
      name: 'Vowel',
      x: left + view.value('vowel') * wide,
      y: lane,
      drag: (x) => ({ vowel: clamp((x - left) / wide, 0, 1) }),
      wheel: (steps) => ({ mouth: clamp(view.value('mouth') + 0.04 * steps, 0, 1) }),
      reset: () => ({ vowel: first('vowel') }),
    },
  ]
}

const undervoice = plateDisplay<UndervoiceState>({
  place: 'window',
  columns: 2,
  params:
    'division second turn breath pace depth closure skew ring vowel mouth throat chest whisper'.split(
      ' ',
    ),
  live: { signal: true, spectrum: true, notes: true },
  info: 'Top, the pulses of a key under the false folds that let them through, and below them the tone this adds. Drag the ring on the hump across for Skew, down for Depth. Then the throat with the sound in it, and the vowels: the ring sets Vowel, the wheel over it Mouth, the dot is the mouth now.',
  init: () => ({ flip: 0, asleep: true, heard: [], shown: 0 }),
  draw(frame) {
    ground(frame)
    const { ctx, colours, state } = frame
    const at = undervoiceLayout(frame)
    const value: Read = (name) => frame.value(name)
    const peak = frame.signal?.output.peak ?? 0
    const held = frame.powered ? frame.notes.filter((note) => note.released === null) : []
    // The newest key that is down, or else the newest of all while it rings.
    const ringing = frame.powered && peak > 1e-3 ? frame.notes.at(-1) : undefined
    const note = held.at(-1) ?? ringing
    // The door's clock runs from the first key after a silence.
    state.flip += value('pace') * frame.dt
    if (state.asleep && note) state.flip = value('pace') * note.age
    state.asleep = !note || (held.length === 0 && peak < 1e-3)

    const hz = note?.frequency ?? REST_HZ
    const keys = held.length > 0 ? held.map((each) => each.frequency) : [hz]
    const n = undervoiceGroup(value, hz, keys)
    const still = { door: 0, loud: 1.15, swing: 0 }
    const door = note ? undervoiceDoor(value, state.flip) : still
    const now: Now = { note: note !== undefined, hz, n, keys, ...door }
    const right = at.folds.x + at.folds.w
    text(frame, WORDS.split(',')[undervoiceDivision(value)], at.folds.x, 12)
    text(frame, undervoiceWords(hz, n), right, 12, { align: 'right' })
    drawFolds(frame, now)
    drawThroat(frame, now)
    for (const y of [at.folds.y + at.folds.h, at.throat.y + at.throat.h])
      rule(ctx, at.folds.x, y, right, y, { colour: colours.ink, alpha: INK.rule })
    // Where in its groups the key is, while they are slow enough to be counted.
    const span = n * UNDERVOICE_GROUPS[undervoiceDivision(value)]
    if (note && hz / span <= 2) {
      const x = at.folds.x + (((note.age * hz) / span) % 1) * at.folds.w
      rule(ctx, x, at.folds.y, x, at.floor.y + at.floor.h, { colour: colours.accent })
    }
    const [gate, vowel] = handlesOf(frame)
    rule(ctx, gate.x, at.folds.y, gate.x, gate.y, { colour: colours.accent, dash: [2, 2] })
    handle(frame, gate.x, gate.y, { hot: frame.hot === 'gate' })
    handle(frame, vowel.x, vowel.y, { hot: frame.hot === 'vowel', radius: 2.5 })
    levelFoot(frame, at.foot, meanOutShare(state, frame, 1))
  },
  handles: (view) => handlesOf(view),
})

export const UNDERVOICE_FACES: Readonly<Record<string, PlateFace>> = {
  undervoice: {
    display: undervoice,
    face: ['division', 'turn', 'closure', 'ring'],
    labels: { second: 'Second', roughness: 'Rough' },
    sections: [
      ['division', 'second', 'turn', 'breath', 'pace', 'depth'],
      ['closure', 'skew', 'ring', 'roughness'],
      ['vowel', 'mouth', 'throat', 'chest', 'whisper', 'drift'],
      ['attack', 'fade', 'release'],
      ['singers', 'width', 'volume'],
    ],
  },
}
