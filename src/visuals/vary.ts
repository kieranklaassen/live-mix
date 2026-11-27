// A look made by chance: a style drawn in a world nobody wrote.
//
// Numbers drawn blindly seldom make a picture: a style's own numbers were each looked at alone and where its presets
// put them together, and all eight at random often breaks it. So a look is bred, as from two parents. What is drawn
// comes from the preset (or the look) it starts from, with a few of the style's own numbers moved toward another
// preset's; light and colours come together from a third, with every hue turned by the same amount, so that what was
// light stays light and what stood apart stays apart; and how it moves is moved a little.
//
// Where a browser can draw, `newLook` (`proof.ts`) looks at the picture before it is shown.
//
// Pure: no React, no DOM, no audio. Chance is handed in.

import { presetKnob, type PresetKnob, type VisualLook, type VisualPreset } from './preset'
import { colourOf, tintOf, turned } from './tint'
import { cleanWorld, OWN_SLOTS, type VisualWorld, type WorldColour } from './world'

/** What a look made by chance starts from. */
export interface VaryFrom {
  /** The preset or the look it is a variation of; null, the style as it draws itself. */
  base: VisualPreset | VisualLook | null
  /** The variation of the style it stays in, where there is no base. */
  variation: 0 | 1
  /** The presets of the style, which it is bred from. A style with none varies in colour, light and movement alone. */
  presets: readonly VisualPreset[]
}

/** Chance: a number from 0 up to 1, as `Math.random`. */
export type Chance = () => number

const between = (chance: Chance, least: number, most: number): number =>
  least + (most - least) * chance()
const clamp = (value: number, least: number, most: number): number =>
  Math.min(most, Math.max(least, value))
function oneOf<T>(chance: Chance, list: readonly T[]): T | undefined {
  return list[Math.min(list.length - 1, Math.floor(chance() * list.length))]
}
function shuffled<T>(chance: Chance, list: readonly T[]): T[] {
  const left = [...list]
  const out: T[] = []
  while (left.length > 0)
    out.push(...left.splice(Math.min(left.length - 1, Math.floor(chance() * left.length)), 1))
  return out
}

/** How many of a style's own numbers are moved. */
const OWN_LEAST = 2
const OWN_MOST = 4
/** How far one is moved toward another preset's, as a share of the way, and at most. */
const TOWARD_LEAST = 0.3
const TOWARD_MOST = 0.75
const OWN_FURTHEST = 0.7
/** A number that stands this near another preset's is not moved toward it. */
const OWN_SAME = 0.15
/** A style's own numbers are put on a grid: each set of them is a shader of its own to make. */
const OWN_GRID = 0.05

const onGrid = (value: number): number => Math.round(clamp(value, -1, 1) / OWN_GRID) * OWN_GRID

/** The style's own numbers of one preset with a few moved toward another's. */
function variedOwn(
  from: readonly number[],
  toward: readonly number[],
  chance: Chance,
): number[] | undefined {
  const own = Array.from({ length: OWN_SLOTS }, (_, slot) => from[slot] ?? 0)
  const apart = own
    .map((value, slot) => ({ slot, by: (toward[slot] ?? 0) - value }))
    .filter(({ by }) => Math.abs(by) >= OWN_SAME)
  const count = OWN_LEAST + Math.floor(chance() * (OWN_MOST - OWN_LEAST + 1))
  for (const { slot, by } of shuffled(chance, apart).slice(0, count)) {
    const step = by * between(chance, TOWARD_LEAST, TOWARD_MOST)
    own[slot] = onGrid(own[slot] + clamp(step, -OWN_FURTHEST, OWN_FURTHEST))
  }
  return own.some((value) => value !== 0) ? own : undefined
}

/** The part of a world that is its light and its colours: they were chosen for one another, and are handed on together. */
function airOf(world: VisualWorld): VisualWorld {
  const { kinds, keep, tones, toned, light, contrast, vivid, flip, mist, misted, from, edge } =
    world
  return { kinds, keep, tones, toned, light, contrast, vivid, flip, mist, misted, from, edge }
}

/** The rest of the shared part: how it moves and answers, and where the eye stands. */
function stanceOf(world: VisualWorld): VisualWorld {
  const { pace, energy, space, tone, answer, roll, at, near, fold, bow, wave } = world
  return { pace, energy, space, tone, answer, roll, at, near, fold, bow, wave }
}

/** The least and the most a moved number of the shared part is, wider only where its parent stood further out. */
function moved(
  value: number | undefined,
  rest: number,
  by: number,
  least: number,
  most: number,
  chance: Chance,
): number {
  const was = value ?? rest
  return clamp(was + between(chance, -by, by), Math.min(least, was), Math.max(most, was))
}

/** Five colours of the kinds and three tones that go together, for a style that has no presets to take them from. */
function madeAir(chance: Chance): VisualWorld {
  const hue = chance()
  // Neighbours on the wheel, with one kind across it; or two hues only.
  const spread = between(chance, 0.03, 0.12)
  const across = hue + between(chance, 0.38, 0.6)
  const vivid = between(chance, 0.05, 0.15)
  const kind = (turn: number, light: number, share: number): WorldColour =>
    colourOf({ light, vivid: vivid * share, hue: turn - Math.floor(turn) })
  return {
    kinds: [
      kind(hue - spread, between(chance, 0.4, 0.55), 1),
      kind(hue, between(chance, 0.5, 0.65), 0.9),
      kind(hue + spread, between(chance, 0.55, 0.72), 0.8),
      kind(hue + 2 * spread, between(chance, 0.68, 0.82), 0.9),
      kind(across, between(chance, 0.78, 0.92), 0.7),
    ],
    keep: 0.08,
    ...(chance() < 0.5
      ? {
          tones: [
            kind(hue - spread, between(chance, 0.12, 0.22), 0.5),
            kind(hue, between(chance, 0.45, 0.6), 0.9),
            kind(across, between(chance, 0.86, 0.95), 0.4),
          ] as const,
          toned: between(chance, 0.3, 0.6),
        }
      : {}),
    contrast: between(chance, 0.05, 0.3),
    vivid: between(chance, -0.15, 0.3),
    ...(chance() < 0.3 ? { edge: between(chance, 0.2, 0.4) } : {}),
  }
}

/** Light and colours with every hue turned alike, and moved a little. */
function variedAir(air: VisualWorld, chance: Chance): VisualWorld {
  // Now and then the colours are left as they were: they were chosen by hand.
  const turn = chance() < 0.2 ? 0 : chance()
  const vivid = between(chance, 0.75, 1.25)
  const next = (colour: WorldColour): WorldColour => turned(colour, turn, vivid)
  const { kinds, tones, mist } = air
  return {
    ...air,
    kinds: kinds && [
      next(kinds[0]),
      next(kinds[1]),
      next(kinds[2]),
      next(kinds[3]),
      next(kinds[4]),
    ],
    tones: tones && [next(tones[0]), next(tones[1]), next(tones[2])],
    toned: tones === undefined ? undefined : moved(air.toned, 0.7, 0.15, 0.2, 0.85, chance),
    light: moved(air.light, 0, 0.08, -0.3, 0.3, chance),
    contrast: moved(air.contrast, 0, 0.1, -0.2, 0.4, chance),
    vivid: moved(air.vivid, 0, 0.15, -0.5, 0.4, chance),
    mist: mist && next(mist),
    misted: mist === undefined ? undefined : moved(air.misted, 0.4, 0.1, 0.15, 0.6, chance),
  }
}

/** How it moves and where the eye stands, moved a little, and at times with one thing more. */
function variedStance(stance: VisualWorld, chance: Chance): VisualWorld {
  const pace = stance.pace ?? 1
  const next: VisualWorld = {
    ...stance,
    pace: clamp(
      pace * Math.pow(2, between(chance, -0.8, 0.6)),
      Math.min(0.2, pace),
      Math.max(1.5, pace),
    ),
  }
  if (chance() < 0.5)
    next.near = clamp(
      (stance.near ?? 1) * between(chance, 0.75, 1.4),
      Math.min(0.6, stance.near ?? 1),
      Math.max(1.8, stance.near ?? 1),
    )
  if (chance() < 0.3) next.answer = moved(stance.answer, 1, 0.4, 0.6, 1.7, chance)
  if (chance() < 0.15) next.wave = moved(stance.wave, 0.2, 0.12, 0.08, 0.4, chance)
  return next
}

const knobOf = (
  knob: PresetKnob | undefined,
  by: number,
  chance: Chance,
): PresetKnob | undefined => {
  if (knob === undefined) return undefined
  const { value, follows } = presetKnob(knob)
  const next = Math.round(clamp(value + between(chance, -by, by), 0.05, 1) * 1000) / 1000
  return follows === null ? next : [next, follows]
}

/** The colours of a look that tell it from others: its middle tone, else the colour of its pads. */
function chiefColour(world: VisualWorld): WorldColour | null {
  if (world.tones && (world.toned ?? 0.7) > 0.35) return world.tones[1]
  return world.kinds?.[1] ?? null
}

/** Words for hues, from the one at nothing on, each a twelfth of the wheel; for what is dark, for what is light, and between. */
const HUES: readonly (readonly [dark: string, middle: string, light: string])[] = [
  ['Madder', 'Rose', 'Petal'],
  ['Brick', 'Coral', 'Peach'],
  ['Rust', 'Copper', 'Apricot'],
  ['Umber', 'Amber', 'Honey'],
  ['Olive', 'Ochre', 'Straw'],
  ['Moss', 'Fern', 'Lichen'],
  ['Pine', 'Leaf', 'Mint'],
  ['Lagoon', 'Teal', 'Foam'],
  ['Petrol', 'Azure', 'Ice'],
  ['Indigo', 'Cobalt', 'Sky'],
  ['Plum', 'Violet', 'Lilac'],
  ['Wine', 'Mallow', 'Blush'],
]
const GREYS: readonly [string, string, string] = ['Soot', 'Ash', 'Bone']

/** What a colour is called, in a word. */
export function colourWord(colour: WorldColour): string {
  const { light, vivid, hue } = tintOf(colour)
  const at = light < 0.42 ? 0 : light < 0.75 ? 1 : 2
  // A dark colour has less of its hue than a light one, and is not greyer for it.
  if (vivid < 0.003 + 0.028 * light) return GREYS[at]
  return HUES[Math.floor(hue * HUES.length) % HUES.length][at]
}

const THINGS: Readonly<Record<'still' | 'slow' | 'quick', readonly string[]>> = {
  still: ['hush', 'stillness', 'sleep', 'frost', 'stone', 'shelter', 'winter', 'vigil'],
  slow: [
    'drift',
    'tide',
    'weather',
    'bloom',
    'veil',
    'shore',
    'evening',
    'thaw',
    'harbour',
    'haze',
  ],
  quick: ['current', 'stir', 'flurry', 'rush', 'sparks', 'gust', 'rapids', 'dance'],
}

/**
 * A name for a look made by chance: its colour and how it moves. The colour is the one it was seen in, where it was
 * looked at, else the chief one of its world. Two looks can come to have one name.
 */
export function lookName(
  world: VisualWorld,
  chance: Chance = Math.random,
  seen: WorldColour | null = null,
): string {
  const chief = seen ?? chiefColour(world)
  const pace = world.pace ?? 1
  const thing =
    oneOf(chance, THINGS[pace < 0.35 ? 'still' : pace < 1.2 ? 'slow' : 'quick']) ?? 'drift'
  return `${chief === null ? 'Open' : colourWord(chief)} ${thing}`
}

/**
 * What a look does to its style, in a sentence: its colours and what is moved. For whoever cannot see it, and for a
 * list. What its own numbers of the style draw is not in it: only its eye can say.
 */
export function lookWords(world: VisualWorld): string {
  const colours = [
    ...(world.tones && (world.toned ?? 0.7) > 0.35 ? world.tones : []),
    ...(world.kinds ?? []),
  ]
  const named = [...new Set(colours.map(colourWord))].slice(0, 3).map((word) => word.toLowerCase())
  const parts: string[] = []
  const list =
    named.length > 1 ? `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}` : named[0]
  parts.push(list === undefined ? 'In the colours of the sounds' : `In ${list}`)
  const pace = world.pace ?? 1
  if (pace < 0.4) parts.push('all but still')
  else if (pace < 0.8) parts.push('slow')
  else if (pace > 1.2) parts.push('quick')
  const { light = 0, flip = 0, near = 1, roll = 0, fold = 0, wave = 0, bow = 0, answer = 1 } = world
  if (flip > 0.5) parts.push('dark and light changed over')
  else if (light <= -0.15) parts.push('darker')
  else if (light >= 0.15) parts.push('lighter')
  if (near >= 1.25) parts.push('seen from near')
  else if (near <= 0.8) parts.push('seen from far off')
  if (Math.abs(roll) >= 10) parts.push('turned')
  if (fold >= 2) parts.push(`folded into ${Math.round(fold)}`)
  if (wave >= 0.15) parts.push('as through moving water')
  if (Math.abs(bow) >= 0.2) parts.push(bow < 0 ? 'bulged' : 'pinched')
  if (world.mist && (world.misted ?? 0.4) > 0.1)
    parts.push(`in a ${colourWord(world.mist).toLowerCase()} mist`)
  if (answer >= 1.3) parts.push('answering strongly')
  else if (answer <= 0.75) parts.push('answering little')
  return `${parts.join(', ')}.`
}

const presetId = (base: VaryFrom['base']): string | undefined =>
  base === null ? undefined : 'id' in base ? base.id : base.from

/**
 * A look of a style made by chance from what it starts from. `bold` false leaves what is drawn as it is, and varies
 * the colours, the light and the movement alone: no new shader is made for it, and it cannot break the picture.
 */
export function variedLook(from: VaryFrom, chance: Chance = Math.random, bold = true): VisualLook {
  const { base, presets } = from
  const variation = base ? base.variation : from.variation
  const start = base?.world ?? {}
  const others = presets.filter((preset) => preset !== base && preset.id !== presetId(base))
  const alike = others.filter((preset) => preset.variation === variation)
  const mate = oneOf(chance, alike.length > 0 ? alike : others)
  const own = bold && mate ? variedOwn(start.own ?? [], mate.world.own ?? [], chance) : start.own

  // The light and the colours of another preset, or of the one it starts from.
  const donor = oneOf(chance, base && chance() < 0.35 ? [base] : others)
  const air = donor ? variedAir(airOf(donor.world), chance) : variedAir(madeAir(chance), chance)
  const world = cleanWorld({ ...variedStance(stanceOf(start), chance), ...air, own })
  const preset = presetId(base)
  const size = knobOf(base?.size, 0.1, chance)
  const glow = knobOf(base?.glow, 0.1, chance)
  return {
    variation,
    ...(size === undefined ? {} : { size }),
    ...(glow === undefined ? {} : { glow }),
    ...(base?.colour === undefined ? {} : { colour: base.colour }),
    world,
    called: lookName(world, chance),
    ...(preset === undefined ? {} : { from: preset }),
  }
}
