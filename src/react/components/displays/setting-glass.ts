// The display of Setting Glass: the clearing of one note, pitch upward and time
// held to the right. The wash is the glass that still flows. Its upper edge is
// the setting front, which falls as the glass cools; the paler band around it
// is as wide as Edge makes the border. Every tone of the note is a line at its
// pitch: dull in the wash, clear from where the front has passed it, with a
// speck for the ping it sets with, and from there it dies by Ring to what
// Breath keeps of it. The line of the front has the fires and the blows in it;
// the dashed one is a middle key that cools alone, and two points stand for it:
// where it starts (Heat) and where it comes to stand (Cooling, Rest). Under the map are
// the fires and the blows. While a key is held the map is that key's, filled up
// to now with the front the device reports, and the keys held stand at its right.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillBetween,
  fillRect,
  fillTo,
  ground,
  handle,
  hzText,
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
import { levelFoot, meanOutShare } from './instrument-parts'
import {
  GLASS_HOTTEST,
  GLASS_MATTERS,
  GLASS_REST_HZ,
  GLASS_REST_MOST,
  GLASS_STRIKES,
  glassBorder,
  GLASS_FOLLOWS,
  GLASS_HIGH,
  GLASS_PLACES,
  GLASS_LONGEST,
  GLASS_LOW,
  glassFollowed,
  glassFront,
  glassHeats,
  glassKept,
  glassMap,
  glassMatter,
  glassRest,
  glassSet,
  glassSpans,
  glassStands,
  glassStart,
  glassSeconds,
  glassTones,
  glassX,
  glassY,
  type GlassState,
  type GlassValue,
} from './setting-glass-heat'

/** The front along the map, a point every two pixels: as it is worked out, and as it was reported. */
function frontAlong(frame: DisplayFrame<GlassState>, map: Box, note: DisplayNote | null) {
  const value: GlassValue = (name) => frame.value(name)
  const hz = note?.frequency ?? GLASS_REST_HZ
  const count = Math.max(8, Math.floor(map.w / 2))
  const shares = Array.from({ length: count + 1 }, (_, i) => i / count)
  const times = shares.map(glassSeconds)
  const way = (of: number, alone: boolean): number[] =>
    glassHeats(value, of, times, alone).map((heat) => glassFront(value, of, heat))
  const worked = way(hz, false)
  const reported = shares.map((share, i) => {
    const told = note ? frame.state.trail[Math.floor(share * (GLASS_PLACES - 1))] : 0
    return note && times[i] <= note.age && told > 0 ? told : worked[i]
  })
  return { times, reported, worked, alone: way(GLASS_REST_HZ, true), hz }
}
type Along = ReturnType<typeof frontAlong>

function drawTones(
  frame: DisplayFrame<GlassState>,
  map: Box,
  along: Along,
  note: DisplayNote | null,
): void {
  const { ctx, colours } = frame
  const value: GlassValue = (name) => frame.value(name)
  const border = glassBorder(value)
  const breath = value('breath')
  const { kept, ping } = glassKept(value)
  const step = map.w / (along.times.length - 1)
  for (const tone of glassTones(value, along.hz, note?.gain)) {
    const loud = clamp(1 + (20 * Math.log10(tone.level + 1e-6)) / 46, 0, 1)
    if (loud <= 0 || tone.place > GLASS_HIGH || tone.place < GLASS_LOW) continue
    const y = Math.floor(glassY(tone.place, map))
    let since = -1
    // One mark for as long as a line stays as strong as it is.
    let run = { from: 0, strength: -1, set: false }
    const lay = (to: number): void => {
      if (run.strength <= 0) return
      const box = { x: map.x + run.from * step, y, w: (to - run.from) * step, h: 1 }
      fillRect(ctx, box, run.set ? colours.ink : colours.accent, run.strength / 8)
    }
    along.times.forEach((t, i) => {
      const set = glassSet(tone.place, along.reported[i], border)
      const clear = set >= 0.5
      if (!clear) since = -1
      else if (since < 0) {
        since = t
        const x = map.x + i * step
        const told = !note || t <= note.age
        if (i > 0 && told)
          dot(ctx, x, y + 0.5, 0.4 + 5 * ping * loud, colours.ink, { alpha: INK.text })
      }
      const held = note ? t <= note.age : true
      const ring = Math.max(Math.exp((-6.9 * (t - since)) / tone.seconds), kept)
      let strength = clear
        ? Math.sqrt(loud) * (0.4 + 0.6 * set * ring)
        : loud * (0.3 + 0.6 * breath)
      if (!held) strength *= note?.released === null ? 0.5 : 0
      const rounded = Math.ceil(strength * 8)
      if (rounded === run.strength && clear === run.set) return
      lay(i)
      run = { from: i, strength: rounded, set: clear }
    })
    lay(along.times.length - 1)
  }
}

/** The fires and the blows under the map, where they fall. */
function drawWork(frame: DisplayFrame<GlassState>, map: Box): void {
  const { ctx, colours } = frame
  const foot = map.y + map.h + 8
  const marks = (first: number, every: number, draw: (x: number) => void): void => {
    let last = -9
    for (let t = first; t <= GLASS_LONGEST; t += every) {
      const x = glassX(t, map)
      if (x - last < 3) continue
      draw((last = x))
    }
  }
  const [remelt, blows, when] = ['remelt', 'blows', 'when'].map((name) => frame.value(name))
  if (remelt > 0.005)
    marks(0.45 * frame.value('every'), frame.value('every'), (x) =>
      fillRect(ctx, { x: x - 1, y: foot - 7, w: 2, h: 1.5 + 2.5 * remelt }, colours.accent),
    )
  const turn = 1 / frame.value('turn')
  const size = 0.5 + 1.3 * blows
  // Where the strikes wait, they fall once the glass has set, or at the far end, as the key goes.
  const first = when === 1 ? glassStands((name) => frame.value(name)) : 0.675 * turn
  const blow = (x: number): void => dot(ctx, x, foot - 1, size, colours.ink)
  if (when !== 2) {
    if (when !== 1) dot(ctx, map.x, foot - 1, 2, colours.ink)
    if (blows > 0.005) marks(first, turn, blow)
  }
  if (when >= 2)
    [2.2, 1.6, 1].forEach((r, i) => dot(ctx, map.x + map.w - 12 + 5 * i, foot - 1, r, colours.ink))
}

function draw(frame: DisplayFrame<GlassState>): void {
  ground(frame)
  const { ctx, colours, state, now } = frame
  const value: GlassValue = (name) => frame.value(name)
  const map = glassMap(frame)
  const note = glassFollowed(frame)
  const along = frontAlong(frame, map, note)
  const border = glassBorder(value)
  const step = map.w / (along.times.length - 1)
  const line = (fronts: readonly number[], off = 0): Point[] =>
    fronts.map((front, i): Point => [map.x + i * step, glassY(front + off, map)])
  const at = line(along.reported)
  clipped(ctx, { x: map.x - 2, y: map.y - 1, w: map.w + 4, h: map.h + 2 }, () => {
    for (const hz of [100, 1000, 10000])
      rule(ctx, map.x, glassY(Math.log2(hz), map), map.x + map.w, glassY(Math.log2(hz), map), {
        colour: colours.ink,
        alpha: INK.grid,
      })
    fillTo(ctx, at, map.y + map.h, colours.accent, 0.5)
    const upper = line(along.reported, border)
    fillBetween(ctx, upper, line(along.reported, -border), colours.accent, 0.2)
    drawTones(frame, map, along, note)
    trace(ctx, line(along.alone), { colour: colours.ink, width: 1, alpha: INK.text, dash: [2, 2] })
    const reach = note ? along.times.filter((t) => t <= note.age).length : at.length
    trace(ctx, line(along.worked), {
      colour: colours.ink,
      width: note ? 1 : 1.5,
      alpha: note ? INK.back : 1,
    })
    if (note) {
      trace(ctx, at.slice(0, reach), { colour: colours.accent, width: 1.75 })
      const x = glassX(note.age, map)
      rule(ctx, x, map.y, x, map.y + map.h, { colour: colours.accent, alpha: INK.back })
      dot(ctx, x, at[Math.max(reach - 1, 0)][1], 2.5, colours.accent, { ring: colours.ink })
    }
  })
  rule(ctx, map.x, map.y, map.x, map.y + map.h, { colour: colours.ink, alpha: INK.rule })
  for (const { frequency, released } of frame.powered ? frame.notes : [])
    if (released === null)
      fillRect(
        ctx,
        { x: map.x + map.w - 3, y: glassY(Math.log2(frequency), map) - 1, w: 5, h: 2 },
        colours.accent,
      )
  drawWork(frame, map)
  const strike = GLASS_STRIKES[clamp(Math.round(value('strike')), 0, 3)]
  text(frame, `${GLASS_MATTERS[glassMatter(value)].name}, ${strike.toLowerCase()}`, 5, 12)
  const front = frame.meter('front')
  const words =
    note && front > 1
      ? hzText(Math.round(front / 10) * 10)
      : `${glassStands(value).toPrecision(2)} s`
  // The words change twice a second at most.
  if (now - state.said.at >= GLASS_FOLLOWS || now < state.said.at || !state.said.words)
    state.said = { words, at: now }
  text(frame, frame.dt > 0 ? state.said.words : words, frame.width - 5, 12, { align: 'right' })
  for (const { key, x, y } of handles(frame)) handle(frame, x, y, { hot: frame.hot === key })
  const foot = { x: 4, y: frame.height - 8, w: frame.width - 8, h: 4 }
  levelFoot(frame, foot, meanOutShare(state, frame, 1))
}

function handles(view: DisplayView): DisplayHandle[] {
  const map = glassMap(view)
  const value: GlassValue = (name) => view.value(name)
  const front = (heat: number): number => glassFront(value, GLASS_REST_HZ, heat)
  // How much heat a pixel upward is: a point off the scale moves from where its setting is.
  const perPixel = (GLASS_HIGH - GLASS_LOW) / map.h / (front(1) - front(0))
  const stands = { x: glassX(glassStands(value), map), y: glassY(front(glassRest(value)), map) }
  const starts = { x: map.x, y: glassY(front(GLASS_HOTTEST * value('heat')), map) }
  return [
    {
      key: 'heat',
      name: 'Heat',
      ...starts,
      drag: (_, y, hold = {}) => {
        const from = (hold.heat ??= value('heat'))
        const pressed = (hold.y ??= starts.y)
        return { heat: clamp(from + ((pressed - y) * perPixel) / GLASS_HOTTEST, 0, 1) }
      },
      reset: () => ({ heat: view.spec('heat')?.default ?? 0.8 }),
    },
    {
      key: 'stands',
      name: 'Cooling and Rest',
      ...stands,
      drag: (x, y, hold = {}) => {
        const from = (hold.rest ??= value('rest'))
        const pressed = (hold.y ??= stands.y)
        const moved = ((pressed - y) * perPixel) / (GLASS_HOTTEST * GLASS_REST_MOST)
        const rest = clamp(from + moved, 0, 1)
        const span = glassSpans(glassStart(value), GLASS_HOTTEST * GLASS_REST_MOST * rest)
        const cooling = (1.45 * glassSeconds((x - map.x) / map.w)) / span
        return { rest, cooling: clamp(cooling, 0.15, 40) }
      },
      reset: () => ({
        rest: view.spec('rest')?.default ?? 0,
        cooling: view.spec('cooling')?.default ?? 2.6,
      }),
    },
  ]
}

const HEAT = 'heat cooling rest remelt every'
const GLASS = 'matter order stretch edge ring bright'
const WORK = 'strike when blows turn ticks breath'
const settingGlass = plateDisplay<GlassState>({
  place: 'window',
  columns: 2,
  params: `${HEAT} ${GLASS} ${WORK}`.split(' '),
  live: { meters: true, signal: true, notes: true },
  info: 'Pitch upward, time held to the right. The wash is soft glass; its edge, the setting front, falls as it cools, and each tone is clear from where it passes. Drag the left point for Heat, the other for Cooling and Rest. Below: fires and blows. A held key fills the map up to now.',
  init: () => ({
    note: null,
    taken: 0,
    trail: new Float32Array(GLASS_PLACES),
    said: { words: '', at: 0 },
    heard: [],
    shown: 0,
  }),
  draw,
  handles,
})

export const SETTING_GLASS_FACES: Readonly<Record<string, PlateFace>> = {
  'setting-glass': {
    display: settingGlass,
    face: ['heat', 'cooling', 'matter', 'ring'],
    labels: { when: 'When', neighbours: 'Shared' },
    sections: [
      HEAT.split(' '),
      GLASS.split(' '),
      WORK.split(' '),
      ['release', 'tail', 'neighbours', 'width', 'volume'],
    ],
  },
}
