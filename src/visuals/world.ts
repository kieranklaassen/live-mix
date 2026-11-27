// A world: how one style is drawn to look like another place.
//
// A style draws a picture; a preset of it (`presets.ts`) says which world that picture stands in. A world has a part
// of its own to the style (`own`: up to eight numbers the style's shader reads, and says what they do in its
// `// own:` line) and a part every style shares: the colours of the kinds of sound, a grade of three tones, light,
// how fast it moves, how strongly it answers the music, where the eye stands, and mist.
//
// A style with no world is drawn as it draws itself: every number here at rest changes nothing.
//
// Pure: no React, no DOM, no audio.

import { KIND_SLOTS, MAP_H, MAP_W, SPECTRUM_BANDS, type VisualSignals } from './frame'

/** How many numbers of its own a style can read. */
export const OWN_SLOTS = 8

/** A colour as `#rrggbb`. */
export type WorldColour = string

export interface VisualWorld {
  /** The style's own numbers, each -1 to 1; 0 (or left out) is as the style draws itself. */
  own?: readonly number[]
  /** The colours of drone, pad, texture, melodic sound and hits here, in that order. */
  kinds?: readonly [WorldColour, WorldColour, WorldColour, WorldColour, WorldColour]
  /** With `kinds`, how much of each sound's own colour stays, 0 to 1. Left out, a fifth. */
  keep?: number
  /** The colours the picture's darks, middles and lights are pulled to. */
  tones?: readonly [dark: WorldColour, middle: WorldColour, light: WorldColour]
  /** With `tones`, how far they are pulled, 0 to 1. Left out, seven tenths. */
  toned?: number
  /** Darker under 0, lighter over it, -1 to 1. */
  light?: number
  /** Softer under 0, harder over it, -1 to 1. */
  contrast?: number
  /** Paler under 0, more vivid over it, -1 to 1. */
  vivid?: number
  /** Darks and lights change places while the colours stay: 0 not at all, 1 wholly. */
  flip?: number
  /** How fast it moves beside the style itself: 1 as it is, 0.05 all but still, 3 the fastest. */
  pace?: number
  /** Moved from where the performer has Energy, Space and Tone, -1 to 1 each. */
  energy?: number
  space?: number
  tone?: number
  /** How strongly it answers what sounds: 1 as it is, 0 not at all, 2 twice. */
  answer?: number
  /** How far the picture is turned, in degrees. */
  roll?: number
  /** Where the eye looks, in heights of the picture from its middle: across, then up. */
  at?: readonly [number, number]
  /** How near the eye is: 1 as it is, 2 twice as near. */
  near?: number
  /** Folded round its middle into this many equal parts, 2 to 12; 0 not at all. */
  fold?: number
  /** Bulged under 0, pinched over it, -1 to 1. */
  bow?: number
  /** Seen as through moving water, 0 to 1. */
  wave?: number
  /** The colour of a mist over it, how thick (0 to 1), and from where: -1 from below, 0 everywhere, 1 from above. */
  mist?: WorldColour
  misted?: number
  from?: number
  /** How dark it is toward its edges, 0 to 1. */
  edge?: number
}

/** The least and the most each number of a world may be. */
export const WORLD_RANGES: Readonly<Record<string, readonly [least: number, most: number]>> = {
  keep: [0, 1],
  toned: [0, 1],
  light: [-1, 1],
  contrast: [-1, 1],
  vivid: [-1, 1],
  flip: [0, 1],
  pace: [0.05, 3],
  energy: [-1, 1],
  space: [-1, 1],
  tone: [-1, 1],
  answer: [0, 2],
  roll: [-180, 180],
  near: [0.3, 4],
  fold: [0, 12],
  bow: [-1, 1],
  wave: [0, 1],
  misted: [0, 1],
  from: [-1, 1],
  edge: [0, 1],
}

const COLOUR = /^#[0-9a-f]{6}$/

const isColour = (value: unknown): value is WorldColour =>
  typeof value === 'string' && COLOUR.test(value.toLowerCase())

/** To the thousandth, so a number is not kept as a long fraction; never -0, which is not read back the same. */
const round3 = (value: number): number => Math.round(value * 1000) / 1000 || 0

/** The colours of a list of that many, in small letters; undefined where it is not that. */
function coloursOf(value: unknown, count: number): WorldColour[] | undefined {
  return Array.isArray(value) && value.length === count && value.every(isColour)
    ? value.map((colour: WorldColour) => colour.toLowerCase())
    : undefined
}

/**
 * A world from what was kept or handed over: each number within its range, what is not of a world left out. It is
 * what a piece keeps, so the same world is always written the same.
 */
export function cleanWorld(value: unknown): VisualWorld {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const given = value as Record<string, unknown>
  const world: Record<string, unknown> = {}
  const finite = (entry: unknown): entry is number =>
    typeof entry === 'number' && Number.isFinite(entry)
  if (Array.isArray(given.own)) {
    const own = given.own
      .slice(0, OWN_SLOTS)
      .map((entry: unknown) => (finite(entry) ? round3(clamp(entry, -1, 1)) : 0))
    while (own.length > 0 && own[own.length - 1] === 0) own.pop()
    if (own.length > 0) world.own = own
  }
  const kinds = coloursOf(given.kinds, KIND_SLOTS.length)
  if (kinds) world.kinds = kinds
  const tones = coloursOf(given.tones, 3)
  if (tones) world.tones = tones
  if (isColour(given.mist)) world.mist = given.mist.toLowerCase()
  const at: readonly unknown[] = Array.isArray(given.at) ? given.at : []
  if (at.length === 2 && finite(at[0]) && finite(at[1]))
    world.at = [round3(clamp(at[0], -2, 2)), round3(clamp(at[1], -2, 2))]
  for (const [key, [least, most]] of Object.entries(WORLD_RANGES)) {
    const entry = Object.hasOwn(given, key) ? given[key] : undefined
    if (finite(entry)) world[key] = round3(clamp(entry, least, most))
  }
  return world
}

/** A world as a shader is handed it. */
export interface WorldUniforms {
  own: Float32Array
  /** Turned by (radians), across, up, near. */
  stand: readonly [number, number, number, number]
  /** Fold, bow, wave. */
  bend: readonly [number, number, number]
  /** Dark, middle and light, red, green and blue each, 0 to 1: nine numbers. */
  tones: Float32Array
  toned: number
  /** Light, contrast, vividness, flip. */
  touch: readonly [number, number, number, number]
  /** The mist's red, green, blue, and how thick. */
  mist: readonly [number, number, number, number]
  from: number
  edge: number
}

const clamp = (value: number, least: number, most: number): number =>
  value > least ? (value < most ? value : most) : least

function rgb(colour: WorldColour | undefined): [number, number, number] {
  const found = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(colour ?? '')
  return found
    ? [parseInt(found[1], 16) / 255, parseInt(found[2], 16) / 255, parseInt(found[3], 16) / 255]
    : [0, 0, 0]
}

function made(world: VisualWorld): WorldUniforms {
  const own = new Float32Array(OWN_SLOTS)
  world.own?.slice(0, OWN_SLOTS).forEach((value, slot) => {
    own[slot] = clamp(value, -1, 1)
  })
  const tones = new Float32Array(9)
  world.tones?.forEach((colour, index) => tones.set(rgb(colour), index * 3))
  return {
    own,
    stand: [
      ((world.roll ?? 0) * Math.PI) / 180,
      world.at?.[0] ?? 0,
      world.at?.[1] ?? 0,
      clamp(world.near ?? 1, 0.3, 4),
    ],
    bend: [Math.round(world.fold ?? 0), world.bow ?? 0, world.wave ?? 0],
    tones,
    toned: world.tones ? (world.toned ?? 0.7) : 0,
    touch: [world.light ?? 0, world.contrast ?? 0, world.vivid ?? 0, world.flip ?? 0],
    mist: [...rgb(world.mist), world.mist ? (world.misted ?? 0.4) : 0],
    from: world.from ?? 0,
    edge: world.edge ?? 0,
  }
}

const uniforms = new WeakMap<VisualWorld, WorldUniforms>()

/** A world as a shader is handed it: worked out once for each. */
export function worldUniforms(world: VisualWorld): WorldUniforms {
  const known = uniforms.get(world)
  if (known) return known
  const now = made(world)
  uniforms.set(world, now)
  return now
}

const clamp01 = (value: number): number => clamp(value, 0, 1)

/** A style's text with its own numbers written in. It reads each by a plain number only (a test holds every style to that). */
export function withOwn(text: string, own: ArrayLike<number>): string {
  return text.replace(/\buOwn\[(\d)\]/g, (_, slot: string) => {
    const value = String(own[Number(slot)] ?? 0)
    return `(${/^-?\d+$/.test(value) ? `${value}.0` : value})`
  })
}

/** The colours of the kinds in this world, from the sounds' own. */
export function worldKinds(world: VisualWorld, own: Float32Array, into: Float32Array): void {
  into.set(own)
  if (!world.kinds) return
  const keep = world.keep ?? 0.2
  world.kinds.forEach((colour, kind) => {
    const to = rgb(colour)
    for (let part = 0; part < 3; part++)
      into[kind * 3 + part] = own[kind * 3 + part] * keep + to[part] * (1 - keep)
  })
}

/** How near two colours are for one to stand for the other: the least that a kind's share of a cell is. */
const NEAR = 24

/**
 * The picture of the piece in this world's colours: each cell keeps how loud it is, and its colour goes where the
 * kinds nearest to it went.
 */
export function worldMap(
  map: Uint8Array,
  was: Float32Array,
  now: Float32Array,
  into: Uint8Array,
): void {
  const kinds = KIND_SLOTS.length
  for (let cell = 0; cell < MAP_W * MAP_H * 4; cell += 4) {
    const loud = map[cell + 3]
    into[cell + 3] = loud
    if (loud === 0) {
      into[cell] = into[cell + 1] = into[cell + 2] = 0
      continue
    }
    const r = map[cell] / loud
    const g = map[cell + 1] / loud
    const b = map[cell + 2] / loud
    let all = 1e-9
    let toR = 0
    let toG = 0
    let toB = 0
    for (let kind = 0; kind < kinds * 3; kind += 3) {
      const dr = r - was[kind]
      const dg = g - was[kind + 1]
      const db = b - was[kind + 2]
      const share = Math.exp(-NEAR * (dr * dr + dg * dg + db * db))
      all += share
      toR += share * now[kind]
      toG += share * now[kind + 1]
      toB += share * now[kind + 2]
    }
    into[cell] = (toR / all) * loud
    into[cell + 1] = (toG / all) * loud
    into[cell + 2] = (toB / all) * loud
  }
}

/** Where a style is drawn with a world, the signals it is handed: moved as the world moves them. */
export function worldSignals(
  world: VisualWorld,
  signals: VisualSignals,
  bands: Float32Array,
): VisualSignals {
  const pace = clamp(world.pace ?? 1, 0.05, 3)
  const answer = clamp(world.answer ?? 1, 0, 2)
  const level = (value: number): number => clamp01(value * answer)
  for (let band = 0; band < SPECTRUM_BANDS; band++) bands[band] = level(signals.bands[band])
  return {
    ...signals,
    time: signals.time * pace,
    travel: signals.travel * pace,
    mix: level(signals.mix),
    low: level(signals.low),
    mid: level(signals.mid),
    high: level(signals.high),
    drone: level(signals.drone),
    pad: level(signals.pad),
    texture: level(signals.texture),
    melodic: level(signals.melodic),
    hits: level(signals.hits),
    cue: level(signals.cue),
    keys: level(signals.keys),
    input: level(signals.input),
    space: clamp01(signals.space + (world.space ?? 0)),
    tone: clamp01(signals.tone + (world.tone ?? 0)),
    bands,
  }
}
