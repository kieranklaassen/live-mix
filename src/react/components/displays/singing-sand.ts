// The display of Singing Sand: a sun of grains over a dune.
// Upper left, a key's 24 grains: out of step they lie all round, in step they
// meet at the top, or in as many places as Cluster makes groups. The arrow is
// the share in step Lockstep asks for. Upper right, the key's overtones, in ink
// at that share, in the accent at the one reported, under the layer's bell.
// Below, how far a surge lets three keys an octave apart fall; while a key
// sounds the front ridge is what it felt, newest right. Dots are loose sand,
// ticks the keys down. The arithmetic is the device's (cpp/devices/singing-sand).

import * as kit from '../display-kit'
import * as plate from '../plate-display'
import { levelFoot, meanOutShare, xOfPitch, type HeardLevel } from './instrument-parts'

const { INK, clamp } = kit
const READS =
  'lockstep grain grit spread pulse cluster layer layerOrder bury dry surge slope pace front flow'
/** The knobs the display reads, the choices and the counts as whole numbers. */
export type SandSet = Readonly<Record<string, number>>
export const sandSet = (read: (name: string) => number): SandSet => {
  const set = Object.fromEntries(READS.split(' ').map((name) => [name, read(name)]))
  for (const name of ['pulse', 'cluster', 'surge']) set[name] = Math.round(set[name])
  return set
}
export const SAND_GRAINS = 24
export const SAND_OVERTONES = 12
const TIGHT = [1, 0.6, 0.45, 0.36, 0.31, 0.27]
const GROUP_WEIGHT = [1, 0.62, 0.56, 0.52, 0.48, 0.45]
const PULSES = ['Round', 'Flint', 'Squeak', 'Wet', 'Glassy']
/** `kModes`: each surge, how deep it is and how bright. */
const SURGES = ['Waves', 'Slips', 'Shocks']
const DEEP = [1, 1.9, 1.3]
const BRIGHT = [0, 1.8, -2]
const GLASS = [0, 0.6, 0, 0, 1, 0, 0.35, 0, 0, 0.62, 0, 0, 0]
/** `share`: how many of the grains Lockstep holds in step. */
export const sandLock = (lockstep: number): number => 0.985 * (1 - Math.pow(1 - lockstep, 1.6))
const groupOf = (grain: number, groups: number): number => ((grain >> 2) + (grain & 3)) % groups

/** `Heap::apart`: what the 24 weights of each cluster come to out of step, as power. */
export const SAND_APART = [0.0417, 0.044, 0.0453, 0.0461, 0.0464, 0.0476]
/** Where each grain is from the key's phase, in turns: over an arc whose mean is the coherence. */
export function sandLeans(coherence: number, turn: number): number[] {
  const out = 1 - clamp(coherence, 0, 1)
  return Array.from({ length: SAND_GRAINS }, (_, i) => {
    const drift = 0.04 * Math.sin(2 * Math.PI * (i * 0.618 + (1 - 0.2 * (i % 5)) * turn))
    return Math.sqrt(out) * (0.78 + 0.22 * out) * ((((i * 11) % SAND_GRAINS) - 11.5) / 24 + drift)
  })
}
const bump = (octaves: number, width: number): number => Math.exp(-0.5 * (octaves / width) ** 2)

/** `sand::pulse_level`: overtone `h` of one slip. */
function pulseLevel(pulse: number, h: number, f0: number, corner: number): number {
  const x = (f0 * h) / corner
  const bend = Math.log2(corner / 1000)
  const above = (first: number): number => Math.log2((f0 * h) / first)
  if (pulse === 1) {
    const jag = h === 1 ? 0.36 : 0.35 + (0.65 * (Math.imul(h, 2654435761) >>> 24)) / 255
    return (jag * Math.pow(h, -0.2 + 0.08 * bend)) / (1 + (x / 1.8) ** 3)
  }
  if (pulse === 2) {
    const at = above(Math.max(600 * Math.pow(corner / 250, 0.45), 2 * f0))
    return (h === 1 ? 0.34 : 0) + bump(at, 0.27) + 0.4 * bump(at - 0.95, 0.2) + 0.03 / h
  }
  if (pulse === 3) {
    const at = above(Math.max(270 * Math.sqrt(corner / 250), f0))
    const hollow = h & 1 ? 1 : 0.06
    return hollow * ((h === 1 ? 0.5 : 0) + bump(at, 0.4) + 0.16 * bump(at - 1.9, 0.16))
  }
  if (pulse === 4) return GLASS[h] / (1 + (x / 0.9) ** 3)
  return Math.pow(h, -0.6 + 0.12 * bend) * Math.exp(-0.8 * Math.pow(x, 1.5))
}
/** The layer at `x` of its own pitch, 1 at its top: what it gives in step and a quarter off. */
const layerAt = (x: number, layer: number): [number, number] => {
  const a = 1 - x * x
  const b = x / (1.2 * Math.pow(2, 4 * layer))
  return [(b * b) / (a * a + b * b), (a * b) / (a * a + b * b)]
}

type SandKey = Readonly<Record<'hz' | 'gain' | 'lock' | 'felt', number>>
/** How loud each overtone of a held key is against the loudest (`Press::press`, `colours`). */
export function sandOvertones(set: SandSet, key: SandKey, sampleRate: number): number[] {
  const { hz, gain } = key
  const { cluster: groups, layer, layerOrder: order, slope } = set
  const sharp = 4.7 * set.grain + 2.4 * (gain - 0.7) + 0.7 * Math.log2(groups)
  const corner = 250 * Math.pow(2, sharp) * Math.pow(hz / 220, 0.4)
  const ceiling = Math.min(0.44 * sampleRate, 11500)
  const wet = 2.4 * layer * Math.pow(0.3 + 0.7 * order, 1.25)
  const rush = set.flow > 0.2 ? Math.log2(set.flow) : -2.32
  const closed = 5.2 * set.bury + slope * (2.4 * (1 - key.felt) - BRIGHT[set.surge])
  const octaves = 1.6 * (gain - 0.7) + 0.9 * rush - 0.5 - closed
  const open = 11500 * Math.sqrt(hz / 220) * Math.pow(2, octaves)
  const cover = clamp(open, 1.2 * hz, 0.42 * sampleRate)
  const w = GROUP_WEIGHT[groups - 1]
  const r = Math.pow(clamp(key.lock, 0.1, 1), TIGHT[groups - 1] ** 2)
  const levels = Array.from({ length: SAND_OVERTONES }, (_, i) => {
    const h = i + 1
    const n = hz * h
    const fade = h === 1 ? 1 : clamp((ceiling - n) / (0.5 * ceiling), 0, 1)
    const [along, across] = layerAt(n / Math.min(hz * order, 5600), layer)
    const ring = (1 - 0.85 * layer + wet * along) ** 2 + (wet * across) ** 2
    const y2 = (n / cover) ** 2
    const kept = Math.pow(r, 2 * h * h)
    const share = h % groups === 0 ? 1 : (1 - w) / (1 + w * (groups - 1))
    const power = kept * share * share + (1 - kept) * SAND_APART[groups - 1]
    return (
      fade *
      pulseLevel(set.pulse, h, hz, corner) *
      Math.sqrt((ring * power) / ((1 - y2) ** 2 + 1.69 * y2))
    )
  })
  return levels.map((level) => level / Math.max(...levels, 1e-9))
}
/** `colours`: how many dB under its crest a key is at this much of a surge. */
export function sandFall(set: SandSet, felt: number): number {
  const deep = DEEP[set.surge] * set.slope * (0.75 + 0.55 * set.slope)
  return 18.06 * deep * (0.8 + 0.4 * set.front) * (1 - felt)
}

/** `Slope::feel`, `turn` surges on, for key `rank` of three around A3; chance stands at its mean. */
export function sandFelt(set: SandSet, rank: number, turn: number): number {
  const front = set.front
  if (set.surge === 0) {
    const sides = [-0.12, 0.12].map((across) => {
      const from = turn - front * (0.42 * (rank - 1) + across)
      const p = from - Math.floor(from)
      const turned = p < 0.64 ? p / 0.64 : 1 + (p - 0.64) / 0.36
      const crest = 0.5 + 0.5 * Math.cos(Math.PI * turned)
      return crest * (0.75 + 0.25 * crest)
    })
    return 0.5 * (sides[0] + sides[1])
  }
  // A slip starts on one side and reaches the other as far as Front lets it.
  const push = 1 - 0.85 * front * (1 / 3)
  if (set.surge === 1) {
    const since = turn - (front * 0.88 * rank) / 3
    return 0.86 * (1 - 0.2 * front) * push * Math.exp(-(since - Math.floor(since)) / 0.28)
  }
  let felt = 0
  for (let k = 0, at = 0.1 * front * rank; k < 9 && turn >= at; at += 0.22 * 1.33 ** k++)
    felt = Math.max(felt, push * (k ? 0.7 * 0.93 ** k : 1) * Math.exp(-(turn - at) / 0.2))
  return felt
}

export function sandLayout(view: Pick<plate.DisplayView, 'width' | 'height'>) {
  const w = view.width - 8
  const foot: kit.Box = { x: 4, y: view.height - 8, w, h: 4 }
  const keys: kit.Box = { x: 4, y: foot.y - 4, w, h: 3 }
  const upper = Math.round((keys.y - 15) * 0.57)
  const ring = { x: 0.2 * w + 8, y: 15 + upper / 2, r: Math.min(upper / 2 - 3, w * 0.2) }
  const left = ring.x + ring.r + 9
  const bars: kit.Box = { x: left, y: 17, w: w + 4 - left, h: upper - 5 }
  return { ring, bars, dune: { x: 4, y: 16 + upper, w, h: keys.y - 17 - upper }, keys, foot }
}
type Ring = ReturnType<typeof sandLayout>['ring']
/** The arrow's tip at a coherence; the grains lie outside of it. */
export const sandTip = (ring: Ring, lock: number): number => ring.y - lock * (ring.r - 5)
export const sandBarX = (h: number, bars: kit.Box): number =>
  bars.x + ((h - 0.5) / SAND_OVERTONES) * bars.w
export const sandBarHeight = (level: number, bars: kit.Box): number =>
  clamp(1 + (20 * Math.log10(Math.max(level, 1e-6))) / 54, 0, 1) * bars.h
/** How many seconds the slope is long. */
const spanOf = (set: SandSet): number => clamp((set.surge === 2 ? 5 : 2.5) / set.pace, 3, 24)

type SandState = HeardLevel & { lock: number; felt: { at: number; felt: number }[] }
type Frame = plate.DisplayFrame<SandState>

function drawRing(frame: Frame, set: SandSet, ring: Ring, live: boolean): void {
  const { x, y, r } = ring
  const { ctx, colours, state } = frame
  const around = (turns: number, out: number): kit.Point => [
    x + out * Math.sin(2 * Math.PI * turns),
    y - out * Math.cos(2 * Math.PI * turns),
  ]
  const asked = sandLock(set.lockstep)
  const lock = live ? state.lock : asked
  kit.dot(ctx, x, y, r, colours.ink, { alpha: INK.fill, ring: colours.ink })
  const wide = 0.03 + (0.4 * set.spread) / 90
  const arc = Array.from({ length: 33 }, (_, i) => around(wide * (i / 16 - 1), r + 3.5))
  kit.trace(ctx, arc, { colour: colours.ink, width: 1.5, alpha: INK.text })
  if (live) kit.rule(ctx, x, y, x, sandTip(ring, lock), { colour: colours.accent, width: 4 })
  kit.rule(ctx, x, y, x, sandTip(ring, asked), { colour: colours.ink, width: 1.5 })
  const turn = live ? frame.now * (0.1 + 0.3 * set.grit + 0.2 * (1 - asked)) : 0
  const tight = 1 - (1 - TIGHT[set.cluster - 1]) * lock * lock
  sandLeans(lock, turn).forEach((lean, i) => {
    const [px, py] = around(lean * tight + groupOf(i, set.cluster) / set.cluster, r)
    const rough = 1 + set.grit * (((i * 7) % 5) / 4 - 0.5) // smooth grains are all alike
    kit.dot(ctx, px, py, r * 0.1 * rough, live ? colours.accent : colours.ink)
  })
}

function drawBars(frame: Frame, set: SandSet, bars: kit.Box, live: boolean): void {
  const { ctx, colours, state } = frame
  const foot = bars.y + bars.h
  const wide = Math.max(2, Math.floor(bars.w / SAND_OVERTONES) - 2)
  const { frequency: hz, gain } = frame.notes.at(-1) ?? { frequency: 220, gain: 0.7 }
  const asked = { hz, gain, lock: sandLock(set.lockstep), felt: 1 }
  const felt = set.pace > 3 ? 1 : (state.felt.at(-1)?.felt ?? 1) // no flashing bars
  const now = live ? sandOvertones(set, { ...asked, lock: state.lock, felt }, frame.sampleRate) : []
  sandOvertones(set, asked, frame.sampleRate).forEach((level, i) => {
    const x = Math.round(sandBarX(i + 1, bars) - wide / 2)
    const tall = sandBarHeight(level, bars)
    const lit = sandBarHeight(now[i] ?? 0, bars)
    const box = { x, y: foot - tall, w: wide, h: tall }
    kit.fillRect(ctx, box, colours.ink, live ? INK.fill : INK.back)
    kit.fillRect(ctx, { ...box, y: foot - lit, h: lit }, colours.accent)
    if (tall > 0) kit.fillRect(ctx, { ...box, h: 1 }, colours.ink)
  })
  const bell = Array.from({ length: 61 }, (_, i): kit.Point => {
    const h = 0.6 + (i / 60) * 11.8
    const [along] = layerAt(h / set.layerOrder, set.layer)
    return [sandBarX(h, bars), foot - set.layer * bars.h * Math.sqrt(along)]
  })
  kit.trace(ctx, bell, { colour: colours.ink, width: 1.5 })
}

function drawDune(frame: Frame, set: SandSet, dune: kit.Box, live: boolean): void {
  const { ctx, colours, state, now } = frame
  const span = spanOf(set)
  for (const rank of [2, 1, 0]) {
    const own = live && rank === 0 && state.felt.length > 1
    const top = dune.y + 2 + (2 - rank) * dune.h * 0.14
    const ridge = (x: number, felt: number): kit.Point => {
      const fallen = clamp(sandFall(set, felt) / 20, 0, 1)
      return [dune.x + clamp(x, 0, 1) * dune.w, top + fallen * (dune.y + dune.h - 2 - top)]
    }
    const points = own
      ? state.felt.map(({ at, felt }) => ridge(1 - (now - at) / span, felt))
      : Array.from({ length: Math.round(dune.w) + 1 }, (_, i) =>
          ridge(i / dune.w, sandFelt(set, rank, (i / dune.w) * span * set.pace)),
        )
    kit.fillTo(ctx, points, dune.y + dune.h, colours.plate, 1)
    kit.fillTo(ctx, points, dune.y + dune.h, colours.ink, 0.12 + 0.09 * (2 - rank))
    kit.trace(ctx, points, { colour: own ? colours.accent : colours.ink, width: own ? 2 : 1.2 })
  }
  // Loose sand runs along over the crest; fine sand is smaller.
  const size = 2 - set.grain
  for (let i = 0; i < Math.round(40 * set.dry); i++) {
    const along = (i * 0.618034 + (live ? now * (0.03 + 0.04 * ((i * 0.37) % 1)) : 0)) % 1
    const y = dune.y - 2 + ((i * 0.414214) % 1) * dune.h * 0.4
    const x = dune.x + along * (dune.w - 2)
    kit.fillRect(ctx, { x, y, w: size, h: size }, live ? colours.accent : colours.ink, INK.text)
  }
}

function sandHandles(view: plate.DisplayView): plate.DisplayHandle[] {
  const { ring, bars } = sandLayout(view)
  const set = sandSet((name) => view.value(name))
  return [
    {
      key: 'lockstep',
      name: 'Lockstep',
      x: ring.x,
      y: sandTip(ring, sandLock(set.lockstep)),
      drag: (_x, y) => {
        const lock = clamp((ring.y - y) / (ring.r - 5) / 0.985, 0, 1)
        return { lockstep: 1 - Math.pow(1 - lock, 1 / 1.6) }
      },
    },
    {
      key: 'layer',
      name: 'Layer and Layer Order',
      x: sandBarX(set.layerOrder, bars),
      y: bars.y + bars.h * (1 - set.layer),
      drag: (x, y) => ({
        layer: clamp(1 - (y - bars.y) / bars.h, 0, 1),
        layerOrder: clamp(Math.round(((x - bars.x) / bars.w) * SAND_OVERTONES + 0.5), 1, 9),
      }),
    },
  ]
}

const singingSand = plate.plateDisplay<SandState>({
  place: 'window',
  columns: 2,
  params: READS.split(' '),
  live: { meters: true, signal: true, notes: true },
  info: 'On the ring are the 24 grains of a key, which meet where they slip in step; its arrow sets Lockstep. The bars are the overtones of the key; the point on the bell sets Layer and Layer Order. Below, how far a surge lets the keys rise and fall.',
  init: () => ({ lock: 0, felt: [], heard: [], shown: 0 }),
  draw(frame) {
    kit.ground(frame)
    const { state, now, dt, colours } = frame
    const at = sandLayout(frame)
    const set = sandSet((name) => frame.value(name))
    const reported = clamp(frame.meter('lock'), 0, 1)
    const live = frame.powered && frame.signal !== null && reported > 0
    state.lock = live ? kit.follow(state.lock, reported, dt, 0.2, 0.2) : 0
    const before = state.felt.at(-1)?.felt ?? 1
    const felt = kit.follow(before, clamp(frame.meter('flow'), 0, 1), dt, 0.05, 0.05)
    if (live) state.felt.push({ at: now, felt })
    state.felt = state.felt.filter((one) => one.at <= now && now - one.at <= spanOf(set))
    kit.text(frame, PULSES[set.pulse], 4, 12)
    const words = `${SURGES[set.surge]} ${set.pace.toFixed(set.pace < 1 ? 2 : 1)} Hz`
    kit.text(frame, words, frame.width - 4, 12, { align: 'right' })
    drawBars(frame, set, at.bars, live)
    drawRing(frame, set, at.ring, live)
    drawDune(frame, set, at.dune, live)
    for (const { frequency, released } of frame.powered ? frame.notes : []) {
      const x = xOfPitch(frequency, at.keys, 55, 1760) - 1.5
      if (released === null) kit.fillRect(frame.ctx, { ...at.keys, x, w: 3 }, colours.accent)
    }
    for (const { key, x, y } of sandHandles(frame))
      kit.handle(frame, x, y, { hot: frame.hot === key, radius: 3 })
    levelFoot(frame, at.foot, meanOutShare(state, frame, 1))
  },
  handles: sandHandles,
})

export const SINGING_SAND_FACES: Readonly<Record<string, plate.PlateFace>> = {
  'singing-sand': {
    display: singingSand,
    face: ['lockstep', 'grain', 'slope', 'onset'],
    labels: { layerOrder: 'Order' },
    sections: [
      ['pulse', 'grain', 'grit', 'spread', 'lockstep', 'cluster'],
      ['layer', 'layerOrder', 'bury', 'boom'],
      ['surge', 'slope', 'pace', 'front'],
      ['onset', 'run', 'flow', 'slump'],
      ['dry', 'width', 'volume'],
    ],
  },
}
