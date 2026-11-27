// The display of Bronze Vowels: a bell that opens its mouth, what the mouth
// leaves of its partials, and the word that each held bell is saying.
//
// At the left the bell, as large as Tract makes its mouth. Its rim is the mouth
// of the newest bell that rings: as deep as its first formant is high and its
// lips are open, as wide as its second is high. At the right the mouth's
// envelope on a scale of octaves, and in it the partials of the bell, as loud
// as the strike, the metal, Wear, Sing and the mouth leave them; the rods in
// the accent sound now. Under both is the word, once through: its first and
// second formant with the mouth between them, filled as far as the lips are
// open. Every bell is a point on it, at the place it has come to, its height
// its own first formant; the dashes are where the newest one draws that of the others.
//
// The arithmetic is the device's own (`bronze-vowels-mouth.ts`). The device
// reports the newest bell that rings: its two formants and its level.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillBetween,
  fillTo,
  ground,
  handle,
  hzOfX,
  label,
  lerp,
  rule,
  text,
  trace,
  xOfHz,
  type Box,
  type Point,
} from '../display-kit'
import { plateDisplay, type DisplayFrame, type DisplayNote, type PlateFace } from '../plate-display'
import {
  BRONZE_HIGH_HZ,
  BRONZE_LOW_HZ,
  bronzeGainY,
  bronzeHandles,
  bronzeLaneY,
  bronzeLayout,
  bronzeWordX,
} from './bronze-vowels-layout'
import {
  BRONZE_PARAMS,
  bronzePartials,
  bronzeSettings,
  type BronzeSettings,
} from './bronze-vowels-metal'
import {
  BRONZE_WORDS,
  bronzeEnvelope,
  bronzeFold,
  bronzeLevels,
  bronzeMouth,
  bronzePosition,
  bronzeTaught,
  type BronzeMouth,
} from './bronze-vowels-mouth'
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'

const WORD_NAMES = ['Ah oh oo', 'We', 'Hum', 'Noon', 'Nay nay', 'Ay ma', 'Home', 'Seem']
WORD_NAMES.push('Whoosh', 'Hush')
/** The bell that stands there while nothing is played: an A3, a moment after its strike. */
const REST: DisplayNote = { id: -1, frequency: 220, gain: 0.7, age: 0.3, released: null }
/** `kLevel`: the level the device reports of a strike at full gain. */
const FULL = 0.185
/** Seconds by which the others have come round to the newest bell. */
const LEARNT = 8
/** The most bells that ring at once. */
const BELLS = 10

/** How a mouth looks: how deep it gapes and how wide it is drawn, both 0 to 1. */
export function bronzeLips(mouth: Pick<BronzeMouth, 'f' | 'open'>): { gape: number; wide: number } {
  const share = (at: number, low: number, high: number): number =>
    clamp((at - Math.log2(low)) / Math.log2(high / low), 0, 1)
  return {
    gape: share(mouth.f[0], 190, 780) * Math.pow(2, mouth.open),
    wide: share(mouth.f[1], 620, 2400),
  }
}

// --- The picture --------------------------------------------------------------------

interface Bells {
  /** The bells that may ring, the newest last; a pitch struck again is one bell. */
  notes: readonly DisplayNote[]
  newest: DisplayNote
  mouth: BronzeMouth
  /** The level of the newest, as a share of a full strike; 0 while none rings. */
  level: number
}

function bellsNow(frame: DisplayFrame<HeardLevel>, set: BronzeSettings): Bells {
  const level = frame.powered ? clamp(frame.meter('level') / FULL, 0, 1.5) : 0
  const notes = level > 1e-4 ? frame.notes : []
  const once = notes.filter(
    (note, i) => !notes.slice(i + 1).some((each) => each.frequency === note.frequency),
  )
  const sorted = [...once].sort((a, b) => b.age - a.age).slice(-BELLS)
  const newest = sorted.at(-1) ?? REST
  const own = bronzeMouth(set.word, bronzePosition(set, newest.frequency, newest.age))
  const heard = [frame.meter('jaw'), frame.meter('tongue')]
  // A reading that is no pitch is none yet.
  const live = level > 1e-4
  const told = live && heard.every((hz) => hz > 60)
  const f = told ? [...heard.map(Math.log2), own.f[2], own.f[3]] : own.f
  return { notes: sorted, newest, mouth: { ...own, f }, level: live ? level : 0 }
}

/** The bell, its mouth its rim. */
function drawBell(frame: DisplayFrame<HeardLevel>, box: Box, tract: number, now: Bells): void {
  const { ctx, colours } = frame
  const { gape, wide } = bronzeLips(now.mouth)
  const size = Math.pow(2, -tract / 30) * Math.min(box.w / 44, box.h / 45)
  const x = box.x + box.w / 2
  const rx = lerp(9.5, 18, wide) * size
  const ry = lerp(1.2, 8, gape) * size
  const y = box.y + box.h / 2 + 11 * size
  const top = y - 30 * size
  const side = (way: -1 | 1): void => {
    ctx.bezierCurveTo(x + way * 12 * size, top, x + way * 8 * size, y - 9 * size, x + way * rx, y)
  }
  const lit = now.level > 0 ? clamp(1 + Math.log10(now.level) / 2.2, 0.15, 1) : 0
  ctx.lineJoin = 'round'
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x, top)
  side(-1)
  ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0, true)
  ctx.bezierCurveTo(x + 8 * size, y - 9 * size, x + 12 * size, top, x, top)
  ctx.globalAlpha = INK.fill
  ctx.fillStyle = colours.ink
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.globalAlpha = 0.25
  ctx.fillStyle = colours.ink
  ctx.fill()
  if (lit > 0) {
    ctx.globalAlpha = lit
    ctx.fillStyle = colours.accent
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.stroke()
  // The crown, and what the bell gives off while it rings.
  ctx.beginPath()
  ctx.arc(x, top - 2 * size, 2 * size, 0, Math.PI * 2)
  ctx.stroke()
  for (const way of [-1, 1]) {
    if (lit <= 0) break
    for (const [i, far] of [4, 8].entries()) {
      const at = Math.PI * (way < 0 ? 1 : 0)
      ctx.beginPath()
      ctx.arc(x + way * (11 + far - 8) * size, y - 12 * size, 8 * size, at - 0.6, at + 0.6)
      ctx.globalAlpha = lit * (i === 0 ? 0.9 : 0.5)
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

/** The mouth's envelope and the partials in it. */
function drawCurve(
  frame: DisplayFrame<HeardLevel>,
  box: Box,
  set: BronzeSettings,
  now: Bells,
): void {
  const { ctx, colours } = frame
  const hz = now.newest.frequency
  const foot = box.y + box.h
  const points: Point[] = []
  for (let x = 0; x <= box.w; x += 1.5) {
    const at = hzOfX(box.x + x, box, BRONZE_LOW_HZ, BRONZE_HIGH_HZ)
    points.push([box.x + x, bronzeGainY(bronzeEnvelope(set, now.mouth, hz, at), box)])
  }
  fillTo(ctx, points, foot, colours.ink, INK.grid)
  const levels = bronzeLevels(set, now.newest, now.mouth)
  const live = now.level > 0
  const loud = live ? 20 * Math.log10(now.level) : -3
  bronzePartials(set, hz).forEach((at, p) => {
    if (at < BRONZE_LOW_HZ || at > BRONZE_HIGH_HZ) return
    const x = Math.round(xOfHz(at, box, BRONZE_LOW_HZ, BRONZE_HIGH_HZ) * 2) / 2
    const y = bronzeGainY(20 * Math.log10(Math.max(levels[p], 1e-6)) + loud, box)
    if (foot - y < 0.5) return
    trace(
      ctx,
      [
        [x, foot],
        [x, y],
      ],
      { colour: live ? colours.accent : colours.ink, width: p < 2 ? 2 : 1.25, alpha: INK.text },
    )
  })
  trace(ctx, points, { colour: colours.ink, width: 1.5 })
  rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })
}

/** The word once through, and the bells on their way along it. */
function drawLane(
  frame: DisplayFrame<HeardLevel>,
  box: Box,
  set: BronzeSettings,
  now: Bells,
): void {
  const { ctx, colours } = frame
  const steps = 48
  const way = Array.from({ length: steps + 1 }, (_, i) => bronzeMouth(set.word, i / steps))
  const xs = way.map((_, i) => bronzeWordX(i / steps, set.speak, box))
  const line = (j: 0 | 1): Point[] => way.map((each, i) => [xs[i], bronzeLaneY(each.f[j], box)])
  const [jaw, tongue] = [line(0), line(1)]
  // Filled as far as the lips are open.
  for (let i = 0; i < steps; i += 2) {
    const open = Math.pow(2, Math.max(way[i + 1].open, -6))
    const part = (points: Point[]): Point[] => points.slice(i, i + 3)
    fillBetween(ctx, part(tongue), part(jaw), colours.ink, 0.06 + 0.34 * open)
  }
  trace(ctx, tongue, { colour: colours.ink, width: 1.25, alpha: INK.text })
  trace(ctx, jaw, { colour: colours.ink, width: 1.25, alpha: INK.text })
  // Where the newest bell draws the first formant of the others, all along the word.
  if (Math.abs(set.contagion) > 0.02) {
    const drawn = way.map((own, i): Point => {
      const [f] = bronzeTaught(own, now.mouth, set, LEARNT)
      return [xs[i], bronzeLaneY(f, box)]
    })
    trace(ctx, drawn, { colour: colours.ink, width: 1, alpha: INK.text, dash: [2, 2.5] })
  }
  if (now.level > 0) {
    const place = (note: DisplayNote): number => bronzePosition(set, note.frequency, note.age)
    for (const note of now.notes) {
      const at = place(note)
      const x = bronzeWordX(bronzeFold(at), set.speak, box)
      const own = bronzeMouth(set.word, at)
      const mine = note === now.newest
      const [f] = mine ? now.mouth.f : bronzeTaught(own, now.mouth, set, now.newest.age)
      const y = bronzeLaneY(f, box)
      const from = bronzeLaneY(own.f[0], box)
      if (Math.abs(from - y) > 1)
        trace(
          ctx,
          [
            [x, from],
            [x, y],
          ],
          { colour: colours.accent, width: 1 },
        )
      dot(ctx, x, y, mine ? 3 : 2, colours.accent, { ring: mine ? colours.ink : undefined })
    }
  }
  const words = set.speak < 9.95 ? `${set.speak.toFixed(1)} s` : `${Math.round(set.speak)} s`
  const [, speak] = bronzeHandles(frame)
  const right = speak.x < box.x + box.w - 34
  if (right) text(frame, words, box.x + box.w, box.y + box.h - 2, { align: 'right' })
  else label(frame, words, box.x + 2, box.y + box.h - 1)
  handle(frame, speak.x, speak.y, { hot: frame.hot === 'speak', radius: 2.5 })
}

function draw(frame: DisplayFrame<HeardLevel>): void {
  ground(frame)
  const at = bronzeLayout(frame)
  const set = bronzeSettings((name) => frame.value(name))
  const now = bellsNow(frame, set)
  const word = clamp(Math.floor(set.word + 0.5), 0, BRONZE_WORDS.length - 1)
  text(frame, WORD_NAMES[word], at.foot.x, at.head)
  const right = { align: 'right' } as const
  const said = `${pitchName(now.newest.frequency)}  ${now.mouth.name}`
  text(frame, said, at.foot.x + at.foot.w, at.head, right)
  drawCurve(frame, at.curve, set, now)
  clipped(frame.ctx, { ...at.bell, y: at.bell.y - 1, h: at.bell.h + 3 }, () =>
    drawBell(frame, at.bell, set.tract, now),
  )
  drawLane(frame, at.lane, set, now)
  const [mouth] = bronzeHandles(frame)
  handle(frame, mouth.x, mouth.y, { hot: frame.hot === 'mouth', radius: 3 })
  levelFoot(frame, at.foot, meanOutShare(frame.state, frame, 1))
}

export const BRONZE_VOWELS_FACES: Readonly<Record<string, PlateFace>> = {
  'bronze-vowels': {
    display: plateDisplay<HeardLevel>({
      place: 'window',
      columns: 2,
      params: BRONZE_PARAMS,
      live: { meters: true, signal: true, notes: true },
      info: 'The newest bell and its mouth, and beside it what the mouth leaves of the partials: drag the point for Tract and Clarity. Below, the two formants of the word, hollow where the lips are shut, with a point for each bell on its way along it: drag the ring for Speaking time.',
      init: () => ({ heard: [], shown: 0 }),
      draw,
      handles: bronzeHandles,
    }),
    face: ['word', 'metal', 'contagion', 'sing'],
    labels: { speak: 'Speaking', release: 'Damp' },
    sections: [
      ['metal', 'stray', 'mallet', 'hardness', 'point', 'knock', 'swell'],
      ['word', 'speak', 'clarity', 'tract'],
      ['contagion', 'stagger'],
      ['ring', 'wear', 'hum', 'beat', 'sing', 'air', 'release'],
      ['width', 'volume'],
    ],
  },
}
