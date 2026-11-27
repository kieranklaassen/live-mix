// The display of Returning Wave: one return of the wave, woven.
//
// The cloth is the space the wave is in, from the wall it is thrown beside (the
// top) to the far one, over one return from left to right, so a wave that is
// whole is one bright spot, a dissolved one is fringes, and where they gather
// to two or three spots the octave and the twelfth pass. It is laid out by
// time and not by the journey: where the wave lingers the cloth is wider, and
// every key crosses it at an even pace. At the right the wave as it stands now
// in the key that is followed, on the same scale of place. Under the cloth are
// the quarter, the third and the half of the way, the keys where they are, and
// Start, which can be dragged; a bar there is as far as Freeze lets a key swing.
// The other point sets Place and Throw; a dot is where the second wave begins.
//
// The arithmetic is the device's own (`cpp/devices/returning-wave/wave_modes.h`
// and `returning_wave.h`). The device reports nothing, and needs not: a key's
// way follows from when it was struck and the knobs since, one tick at a time.

// prettier-ignore
import {
  INK, clamp, crisp, dot, fillRect, ground, handle, rule, text, trace, type Box, type Point,
} from '../display-kit'
// prettier-ignore
import {
  plateDisplay, type DisplayFrame, type DisplayHandle, type DisplayView, type PlateFace,
} from '../plate-display'
import { levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'
// prettier-ignore
import {
  FADING, WAVE_KNOBS, WAVE_TURN, waveAt, waveBlur, waveClock, waveFrozen, waveJourney, waveKeys,
  waveLaw, waveLeak, wavePace, wavePacket, wavePlace, waveReach, waveReading, waveSecondAt,
  waveSettings, waveSunk, waveTune, type WaveKey, type WaveKeys, type WaveSettings,
} from './returning-wave-math'

const WALLS = ['Box', 'Ring', 'Bowl', 'Two rooms', 'Fading well']
interface WaveState extends HeardLevel, WaveKeys {
  lead: { id: number; taken: number } | null
  page: number
  cloth: { print: string; runs: number[][]; most: number } | null
}

/** The key that is followed: the newest held one, for half a second at least, so a roll does not shake the cloth. */
function leadOf(state: WaveState, keys: readonly WaveKey[], now: number): WaveKey | null {
  const held = keys.filter((key) => key.held)
  const followed = keys.find((key) => key.id === state.lead?.id)
  const newest = (held.length > 0 ? held : keys).at(-1) ?? null
  if (followed && newest && state.lead && now - state.lead.taken < 0.5) return followed
  if (newest?.id !== state.lead?.id) state.lead = newest && { id: newest.id, taken: now }
  return newest
}

// --- The picture -----------------------------------------------------------------

/** What of a return is drawn before its start and after its end. */
const MARGIN = 0.05
const LEVELS = 8
const THROW_PX = 22
type Size = Pick<DisplayView, 'width' | 'height'>

export function waveLayout(size: Size) {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const foot: Box = { x: box.x, y: box.y + box.h - 4, w: box.w, h: 4 }
  const side = Math.round(clamp(box.w * 0.2, 16, 40))
  const cloth: Box = { x: box.x, y: box.y + 12, w: box.w - side - 4, h: foot.y - 10 - box.y - 12 }
  const profile: Box = { x: cloth.x + cloth.w + 4, y: cloth.y, w: side, h: cloth.h }
  return { box, foot, cloth, profile, axis: cloth.y + cloth.h + 4 }
}
/** Where a place on the journey, counted from the return that is drawn, stands across the cloth. */
export const waveX = (journey: number, cloth: Box): number =>
  cloth.x + ((waveClock(journey) + MARGIN) / (1 + 2 * MARGIN)) * cloth.w
const placeY = (radians: number, cloth: Box): number => cloth.y + (radians / Math.PI) * cloth.h

/** How loud a level is drawn: 0 to 1 of the loudest on the cloth, lifted so a haze can be seen. */
const shown = (level: number, most: number): number =>
  Math.pow(clamp(Math.abs(level) / most, 0, 1), 0.85)

function weave(frame: DisplayFrame<WaveState>, set: WaveSettings, lead: WaveKey | null): number {
  const { state, ctx, colours } = frame
  const { cloth } = waveLayout(frame)
  const columns = Math.min(Math.floor(cloth.w), 200)
  const rows = Math.floor(cloth.h)
  const hit = Math.round((lead?.hit ?? 0.75) * 20) / 20
  const tune = waveTune(set.clock, lead?.hz ?? 220)
  const print =
    WAVE_KNOBS.map((name) => set[name]).join() + [state.page, hit, tune, columns, rows].join()
  if (state.cloth?.print !== print) {
    const law = waveLaw(set.walls)
    const packet = wavePacket(law, set, hit)
    const levels: number[] = []
    for (let c = 0; c < columns; c++) {
      const clock = state.page + ((c + 0.5) / columns) * (1 + 2 * MARGIN) - MARGIN
      const journey = waveJourney(clock)
      const turn = set.return * tune * WAVE_TURN
      const pace = (wavePace(journey) * waveFrozen(set.freeze)) / (set.return * tune)
      const seconds = (clock - waveClock(set.start)) * turn
      const lost = Math.max(seconds, 0) * waveLeak(set.leak)
      const read = waveReading(law, packet, set.reading, journey, pace, waveBlur(set.blur), lost)
      const left = set.walls === FADING ? waveSunk(journey - set.start) : 1
      for (let r = 0; r < rows; r++) {
        const level = left * waveAt(read, set.reading, (Math.PI * (r + 0.5)) / rows)
        levels.push(level)
      }
    }
    // The loudest, but for the few places over all others: the spots of a whole wave.
    const sizes = levels.map(Math.abs).sort((a, b) => a - b)
    const most = Math.max(1e-9, sizes[Math.floor(0.985 * sizes.length)])
    const runs: number[][] = Array.from({ length: LEVELS + 1 }, () => [])
    const inks = levels.map((level) => Math.round(shown(level, most) * LEVELS))
    for (let i = 0, from = 0; i < inks.length; i++) {
      if ((i + 1) % rows > 0 && inks[i + 1] === inks[from]) continue
      runs[inks[from]].push(Math.floor(from / rows), from % rows, i + 1 - from)
      from = i + 1
    }
    state.cloth = { print, runs, most }
  }
  const wide = cloth.w / columns
  state.cloth.runs.forEach((runs, level) => {
    if (level === 0) return
    ctx.beginPath()
    for (let i = 0; i < runs.length; i += 3)
      ctx.rect(cloth.x + runs[i] * wide, cloth.y + runs[i + 1], wide, runs[i + 2])
    ctx.globalAlpha = level / LEVELS
    ctx.fillStyle = colours.ink
    ctx.fill()
  })
  ctx.globalAlpha = 1
  return state.cloth.most
}

function drawProfile(
  frame: DisplayFrame<WaveState>,
  set: WaveSettings,
  key: WaveKey | null,
  most: number,
): number {
  const { ctx, colours } = frame
  const { profile } = waveLayout(frame)
  const law = waveLaw(set.walls)
  const packet = wavePacket(law, set, key?.hit ?? 0.75)
  const journey = key?.journey ?? set.start
  const pace = key?.pace ?? (wavePace(journey) * waveFrozen(set.freeze)) / set.return
  const read = waveReading(law, packet, set.reading, journey, pace, waveBlur(set.blur), key?.lost)
  const left = set.walls === FADING ? waveSunk(journey - set.start) : 1
  // The density stands on the line; the crests and the flow go to both sides of it.
  const both = set.reading !== 0
  const line = profile.x + (both ? profile.w / 2 : 0)
  const reach = both ? profile.w / 2 : profile.w
  const points: Point[] = []
  for (let y = 0; y <= profile.h; y++) {
    const level = left * waveAt(read, set.reading, (Math.PI * y) / profile.h)
    points.push([line + Math.sign(level) * shown(level, most) * reach, profile.y + y])
  }
  ctx.beginPath()
  ctx.moveTo(line, profile.y)
  for (const [x, y] of points) ctx.lineTo(x, y)
  ctx.lineTo(line, profile.y + profile.h)
  ctx.globalAlpha = key ? 0.85 : INK.back
  ctx.fillStyle = key ? colours.accent : colours.ink
  ctx.fill()
  ctx.globalAlpha = 1
  rule(ctx, line, profile.y, line, profile.y + profile.h, { colour: colours.ink, alpha: INK.rule })
  trace(ctx, points, { colour: colours.ink, width: 1 })
  return read.copies
}

function drawWay(
  frame: DisplayFrame<WaveState>,
  set: WaveSettings,
  keys: readonly WaveKey[],
  lead: WaveKey | null,
): void {
  const { ctx, colours, state } = frame
  const { cloth, axis } = waveLayout(frame)
  const end = cloth.y + cloth.h
  const across = { colour: colours.ink, alpha: INK.rule }
  rule(ctx, cloth.x, axis, cloth.x + cloth.w, axis, across)
  for (const at of [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1]) {
    const x = waveX(at, cloth)
    rule(ctx, x, axis - 2, x, axis + (at === 0 || at === 1 ? 4 : 2), {
      colour: colours.ink,
      alpha: INK.text,
    })
  }
  if (set.freeze >= 0.02) {
    const from = waveX(set.start - state.page, cloth)
    const reach = (waveReach(set.freeze) / WAVE_TURN / (1 + 2 * MARGIN)) * cloth.w
    const left = clamp(from - reach, cloth.x, cloth.x + cloth.w)
    const right = clamp(from + reach, left + 1, cloth.x + cloth.w + 1)
    fillRect(ctx, { x: left, y: axis - 0.5, w: right - left, h: 2 }, colours.ink, INK.text)
  }
  for (const key of keys) {
    const x = waveX(key.journey - state.page, cloth)
    if (x < cloth.x || x > cloth.x + cloth.w) continue
    const first = key === lead
    // A strip of the plate on both sides keeps the line off the cloth it crosses.
    if (first) fillRect(ctx, { x: crisp(x) - 2, y: cloth.y, w: 4, h: cloth.h }, colours.plate, 0.75)
    trace(
      ctx,
      [
        [crisp(x), first ? cloth.y : end - 7],
        [crisp(x), end],
      ],
      { colour: colours.accent, width: 2 },
    )
    fillRect(ctx, { x: crisp(x) - 1.5, y: end + 1, w: 3, h: 3 }, colours.accent)
  }
}

function waveHandles(view: DisplayView): readonly DisplayHandle[] {
  const set = waveSettings((name) => view.value(name))
  const { cloth, axis } = waveLayout(view)
  const left = waveX(0, cloth)
  const at = { x: left + set.throw * THROW_PX, y: placeY(wavePlace(set.place), cloth) }
  const startX = waveX(set.start, cloth)
  const first = (name: string): number => view.spec(name)?.default ?? 0
  return [
    {
      key: 'place',
      name: 'Place and Throw',
      ...at,
      drag: (x, y) => ({
        place: clamp(((y - cloth.y) / cloth.h - 0.03) / 0.47, 0, 1),
        throw: clamp((x - left) / THROW_PX, 0, 1),
      }),
      wheel: (steps) => ({ width: clamp(set.width + steps * 0.02, 0, 1) }),
      reset: () => ({ place: first('place'), throw: first('throw') }),
    },
    {
      key: 'start',
      name: 'Start',
      x: startX,
      y: axis,
      drag: (x) => ({
        start: clamp(waveJourney(((x - cloth.x) / cloth.w) * (1 + 2 * MARGIN) - MARGIN), 0, 1),
      }),
      wheel: (steps) => ({ freeze: clamp(set.freeze + steps * 0.02, 0, 1) }),
      reset: () => ({ start: first('start') }),
    },
  ]
}

const returningWave = plateDisplay<WaveState>({
  place: 'window',
  columns: 2,
  params: WAVE_KNOBS,
  live: { signal: true, notes: true },
  info: 'One return of the wave from left to right, the space it is in from wall to wall: one bright spot is the whole wave, two the octave, three the twelfth, fringes the haze. At the right the wave as it is read now. Drag one point for Place and Throw, the one below for Start.',
  init: () => ({
    ...{ keys: [], shared: { journey: 0, swing: 0 }, firstHz: 220, lead: null },
    ...{ page: 0, cloth: null, heard: [], shown: 0 },
  }),
  draw(frame) {
    ground(frame)
    const { ctx, colours, state } = frame
    const set = waveSettings((name) => frame.value(name))
    const at = waveLayout(frame)
    waveKeys(state, frame.powered ? frame.notes : [], set, frame.now, frame.dt)
    const { keys } = state
    const lead = leadOf(state, keys, frame.now)
    const on = (lead?.journey ?? 0) - state.page
    if (!lead) state.page = 0
    else if (on < -MARGIN / 2 || on > 1 + MARGIN / 2) state.page = Math.floor(lead.journey)
    const most = weave(frame, set, lead)
    drawWay(frame, set, keys, lead)
    const copies = drawProfile(frame, set, lead, most)
    const base = at.box.y + 8
    text(frame, WALLS[set.walls], at.box.x, base)
    const word = ['haze', 'whole', 'octave', 'twelfth'][copies]
    const right = at.box.x + at.box.w
    text(frame, lead ? `${pitchName(lead.hz)} ${word}` : word, right, base, { align: 'right' })
    const seconds = set.return * waveTune(set.clock, lead?.hz ?? 220)
    const words = `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)} s`
    text(frame, words, right, at.axis + 4, { align: 'right' })
    if (set.second > 0)
      dot(
        ctx,
        waveX(0, at.cloth),
        placeY(waveSecondAt(set), at.cloth),
        1 + 2 * set.second,
        colours.plate,
        { ring: colours.ink },
      )
    const [place, start] = waveHandles(frame)
    const arrow: Point[] = [
      [waveX(0, at.cloth), place.y],
      [place.x, place.y],
    ]
    trace(ctx, arrow, { colour: colours.plate, width: 4 })
    trace(ctx, arrow, { colour: colours.ink, width: 1.5 })
    handle(frame, place.x, place.y, { hot: frame.hot === 'place' })
    handle(frame, start.x, start.y, { hot: frame.hot === 'start', radius: 2.5 })
    levelFoot(frame, at.foot, meanOutShare(state, frame, 1))
  },
  handles: waveHandles,
})

export const RETURNING_WAVE_FACES: Readonly<Record<string, PlateFace>> = {
  'returning-wave': {
    display: returningWave,
    face: ['walls', 'return', 'width', 'anchor'],
    sections: [
      ['walls', 'reading', 'width', 'throw', 'place', 'second', 'gap'],
      ['return', 'clock', 'start', 'freeze', 'leak'],
      ['anchor', 'tilt', 'blur', 'body', 'haze', 'splash'],
      ['ears', 'attack', 'release', 'volume'],
    ],
  },
}
