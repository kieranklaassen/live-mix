// Visuals: pictures that follow the music, placed on the timeline as sounds are.
//
// A visual is either drawn in the Visuals section of the timeline, where it shows for its own stretch of the piece (or
// for the whole of it), or linked to a stroke, where it shows while that stroke sounds. What it draws is its kind: one
// of the styles (`styles.ts`), which paint, or one of the bends below, which work on what was painted before them.
// Each has a few knobs, and a knob can follow something in the music: the knob then says how far.
//
// Over the picture a few of the piece's devices can lie as pedals: their own plates, as gear lies on a table that
// is filmed from above. The model keeps which device lies where; drawing its plate is for whoever shows the picture.
//
// They are kept in the arrangement's document (`meta.visuals`), so they are saved, undone and carried by a saved
// session with the strokes. Places are kept in beats, so a change of tempo leaves a visual where it is in the music.
// A piece with no entry has no visuals, which is every piece saved before there were any; a build from before keeps
// the entry as it is and shows nothing of it.
//
// Pure: no React, no DOM, no audio.

import type { JsonObject, JsonValue } from '../core/json'

import { DEFAULT_PALETTE, isVisualPalette } from './palettes'
import { VISUAL_STYLES, visualStyle } from './styles'

/** The entry that holds a piece's visuals. */
export const VISUALS_META = 'visuals'

/** More than a picture can hold apart, and few enough that one frame draws them. */
export const VISUAL_MAX = 24
/** The rows of the Visuals section: a visual lower down is drawn over the ones above it. */
export const VISUAL_LANES = 4
/** The shortest stretch a visual is drawn for, in beats. */
export const VISUAL_SHORTEST_BEATS = 0.25
/** How long a visual dropped in the section is at first, in beats. */
export const VISUAL_FIRST_BEATS = 16

/** What a knob can follow. Each is 0 to 1 and already smooth. */
export const VISUAL_SOURCES = [
  { id: 'mix', name: 'Whole mix', what: 'how loud everything is together' },
  { id: 'stroke', name: 'Its stroke', what: 'how loud the stroke the visual is linked to is now' },
  { id: 'low', name: 'Low', what: 'the low part of what is heard' },
  { id: 'mid', name: 'Mid', what: 'the middle part of what is heard' },
  { id: 'high', name: 'High', what: 'the high part of what is heard' },
  { id: 'drone', name: 'Drones', what: 'the loudest drone now' },
  { id: 'pad', name: 'Pads', what: 'the loudest pad now' },
  { id: 'texture', name: 'Textures', what: 'the loudest texture now' },
  { id: 'melodic', name: 'Melodies', what: 'the loudest melodic sound now' },
  {
    id: 'hits',
    name: 'Hits',
    what: 'one shots, beats and cues: full on a hit, gone in half a second',
  },
  { id: 'cue', name: 'Cues', what: 'a cue fired from the perform deck, falling over a second' },
  { id: 'keys', name: 'Keys', what: 'notes played on the keys' },
  { id: 'input', name: 'Live input', what: 'the microphone or whatever else comes in' },
  { id: 'energy', name: 'Energy dial', what: 'the Energy dial of the perform deck' },
  { id: 'space', name: 'Space dial', what: 'the Space dial of the perform deck' },
  { id: 'tone', name: 'Tone dial', what: 'the Tone dial of the perform deck' },
  {
    id: 'place',
    name: 'Place in the piece',
    what: 'where the playhead is, from the start of the piece to its end',
  },
] as const

export type VisualSource = (typeof VISUAL_SOURCES)[number]['id']

const SOURCE_IDS = new Set<string>(VISUAL_SOURCES.map((source) => source.id))

export function isVisualSource(id: string): id is VisualSource {
  return SOURCE_IDS.has(id)
}

export interface VisualKnobSpec {
  id: string
  name: string
  /** What turning it does, for the info view and the agent. */
  what: string
  /** Where it stands on a new visual, 0 to 1. */
  first: number
  /** What it follows on a new visual. */
  follows?: VisualSource
}

/** The knobs of every style. */
export const STYLE_KNOBS: readonly VisualKnobSpec[] = [
  {
    id: 'level',
    name: 'Level',
    what: 'How much of the visual shows: at nothing it is not drawn.',
    first: 0.9,
  },
  {
    id: 'size',
    name: 'Size',
    what: 'How close the picture is: low is far off and small, high is near and large.',
    first: 0.5,
  },
  {
    id: 'glow',
    name: 'Glow',
    what: 'How much light and movement the picture has.',
    first: 0.7,
    follows: 'energy',
  },
  {
    id: 'colour',
    name: 'Colour',
    what: 'Turns every colour round the colour wheel: in the middle they are the colours of the sounds.',
    first: 0.5,
  },
]

export interface VisualBend {
  id: string
  name: string
  /** What it does to the picture. */
  what: string
  knobs: readonly VisualKnobSpec[]
}

/** The bends: they draw nothing, and work on what the visuals before them drew. */
export const VISUAL_BENDS: readonly VisualBend[] = [
  {
    id: 'trails',
    name: 'Trails',
    what: 'What was on the screen stays a while and fades, so movement leaves a trail.',
    knobs: [
      { id: 'length', name: 'Length', what: 'How long what was drawn stays.', first: 0.5 },
      {
        id: 'push',
        name: 'Push',
        what: 'How fast the trail drifts outward as it fades.',
        first: 0.3,
      },
    ],
  },
  {
    id: 'mirror',
    name: 'Mirror',
    what: 'Folds the picture: the left half is shown again on the right, and further up the top half again below.',
    knobs: [
      {
        id: 'fold',
        name: 'Fold',
        what: 'Low folds nothing, the middle folds left onto right, high folds top onto bottom too.',
        first: 0.4,
      },
    ],
  },
  {
    id: 'spin',
    name: 'Spin',
    what: 'Turns the whole picture round its middle.',
    knobs: [
      {
        id: 'turn',
        name: 'Turn',
        what: 'How far the picture is turned: all the way up is once round.',
        first: 0.1,
      },
    ],
  },
  {
    id: 'grain',
    name: 'More grain',
    what: 'Lays more film grain over the picture than the piece has, for the stretch it is drawn for.',
    knobs: [{ id: 'amount', name: 'Amount', what: 'How much grain.', first: 0.9 }],
  },
]

const bendsById = new Map(VISUAL_BENDS.map((bend) => [bend.id, bend]))

export function visualBend(id: string): VisualBend | undefined {
  return bendsById.get(id)
}

/** A kind paints when it is a style; a bend does not. */
export function paints(kind: string): boolean {
  return visualStyle(kind) !== undefined
}

/** The knobs of a kind; none for a kind this build does not have. */
export function knobsOf(kind: string): readonly VisualKnobSpec[] {
  if (visualStyle(kind)) return STYLE_KNOBS
  return bendsById.get(kind)?.knobs ?? []
}

/** What a kind is called; the id itself for one this build does not have. */
export function visualKindName(kind: string): string {
  return visualStyle(kind)?.name ?? bendsById.get(kind)?.name ?? kind
}

/** Every kind this build has: the styles in their order, then the bends. */
export const VISUAL_KINDS: readonly string[] = [
  ...VISUAL_STYLES.map((style) => style.id),
  ...VISUAL_BENDS.map((bend) => bend.id),
]

export function isVisualKind(kind: string): boolean {
  return visualStyle(kind) !== undefined || bendsById.has(kind)
}

export interface VisualKnob {
  /** Where the knob stands, 0 to 1. */
  value: number
  /** What moves it; null, it stays where it stands. */
  follows: VisualSource | null
}

export interface Visual {
  id: string
  /** A style's id or a bend's. */
  kind: string
  /** Which of a style's two variations: 0 is a, 1 is b. */
  variation: 0 | 1
  /** The stroke it is linked to: it shows while that stroke sounds. Null, it is drawn in the Visuals section. */
  stroke: string | null
  /** Its row in the Visuals section, from 0 at the top. */
  lane: number
  /** Where its stretch starts, in beats from the start of the piece. */
  beat: number
  /** How long its stretch is, in beats; null, it is drawn for the whole piece. */
  beats: number | null
  knobs: Readonly<Record<string, VisualKnob>>
}

/** How many pedals lie on a picture at most: more hide it. */
export const VISUAL_PEDALS_MAX = 8
/** How tall a pedal is as a share of the picture's height: at first, and the least and the most it can be made. */
export const PEDAL_FIRST_SIZE = 0.42
export const PEDAL_LEAST_SIZE = 0.12
export const PEDAL_MOST_SIZE = 0.95
/** How far a pedal can be turned either way, in degrees. */
export const PEDAL_MOST_TURN = 45

/** A device of the piece laid on the picture as its own plate. */
export interface VisualPedal {
  /** The device it shows, by its id in the piece. A device lies on the picture once. */
  device: string
  /** Where its middle lies: 0 to 1 across the picture from the left, and down it from the top. */
  x: number
  y: number
  /** How tall it is, as a share of the picture's height. Its width follows from the plate's own shape. */
  size: number
  /** How far it is turned, in degrees clockwise: gear laid down by hand seldom lies square. */
  turn: number
}

/** A piece's visuals: the list, what lies over all of them, and the pedals laid on the picture. */
export interface VisualSet {
  /** The palette's id (`palettes.ts`). */
  palette: string
  /** How much film grain lies over the picture, 0 to 1. */
  grain: number
  list: readonly Visual[]
  /** The pedals on the picture, in the order they are laid: a later one lies over an earlier one. */
  pedals: readonly VisualPedal[]
  /** What a later build wrote beside these and this one does not read: kept as written, so this build saves what it opened. */
  more?: JsonObject
}

/** How many fields of a later build are kept beside the ones read here. */
const MORE_MAX = 16

/** How much grain a piece has until it is set. */
export const DEFAULT_GRAIN = 0.5

const NO_VISUALS: VisualSet = Object.freeze({
  palette: DEFAULT_PALETTE,
  grain: DEFAULT_GRAIN,
  list: Object.freeze([]),
  pedals: Object.freeze([]),
})

/** A piece with no visuals. */
export function emptyVisualSet(): VisualSet {
  return NO_VISUALS
}

export function isEmptyVisualSet(set: VisualSet): boolean {
  return (
    set.list.length === 0 &&
    set.pedals.length === 0 &&
    set.palette === DEFAULT_PALETTE &&
    set.grain === DEFAULT_GRAIN &&
    set.more === undefined
  )
}

export function createVisualId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `visual-${crypto.randomUUID()}`
  }
  return `visual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
/** To the thousandth, so a dragged knob is not written as a long fraction. */
const round3 = (value: number): number => Math.round(value * 1000) / 1000

function cleanShare(value: unknown, otherwise: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? round3(clamp01(value)) : otherwise
}

function cleanPedalSize(size: unknown): number {
  return typeof size === 'number' && Number.isFinite(size)
    ? round3(Math.min(PEDAL_MOST_SIZE, Math.max(PEDAL_LEAST_SIZE, size)))
    : PEDAL_FIRST_SIZE
}

/** To the tenth of a degree. */
function cleanPedalTurn(turn: unknown): number {
  if (typeof turn !== 'number' || !Number.isFinite(turn)) return 0
  const tenths = Math.round(Math.min(PEDAL_MOST_TURN, Math.max(-PEDAL_MOST_TURN, turn)) * 10) / 10
  // Not -0, which is written as 0 and would then not read back the same.
  return tenths === 0 ? 0 : tenths
}

function cleanLane(lane: unknown): number {
  return typeof lane === 'number' && Number.isFinite(lane)
    ? Math.min(VISUAL_LANES - 1, Math.max(0, Math.round(lane)))
    : 0
}

function cleanBeat(beat: unknown): number {
  return typeof beat === 'number' && Number.isFinite(beat) ? Math.max(0, round3(beat)) : 0
}

function cleanBeats(beats: unknown): number | null {
  if (typeof beats !== 'number' || !Number.isFinite(beats)) return null
  return Math.max(VISUAL_SHORTEST_BEATS, round3(beats))
}

/** The knobs a new visual of a kind has. */
export function firstKnobs(kind: string): Record<string, VisualKnob> {
  const knobs: Record<string, VisualKnob> = {}
  for (const spec of knobsOf(kind))
    knobs[spec.id] = { value: spec.first, follows: spec.follows ?? null }
  return knobs
}

function knobFromJson(json: JsonValue | undefined, first: VisualKnob | null): VisualKnob | null {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return first
  const { value, follows } = json
  if (typeof value !== 'number' || !Number.isFinite(value)) return first
  return {
    value: round3(clamp01(value)),
    follows: typeof follows === 'string' && isVisualSource(follows) ? follows : null,
  }
}

function knobsFromJson(kind: string, json: JsonValue | undefined): Record<string, VisualKnob> {
  const given = typeof json === 'object' && json !== null && !Array.isArray(json) ? json : {}
  const specs = knobsOf(kind)
  const knobs: Record<string, VisualKnob> = {}
  if (specs.length > 0) {
    // A kind this build knows has exactly its knobs: one left out stands where a new one would.
    const first = firstKnobs(kind)
    for (const spec of specs)
      knobs[spec.id] =
        knobFromJson(
          Object.prototype.hasOwnProperty.call(given, spec.id) ? given[spec.id] : undefined,
          first[spec.id],
        ) ?? first[spec.id]
    return knobs
  }
  // A kind from a later build: its knobs are kept as they were written, so that this build saves what it opened.
  for (const name of Object.keys(given).slice(0, 16)) {
    const knob = knobFromJson(given[name], null)
    if (knob && /^[a-z][a-z0-9-]{0,23}$/.test(name)) knobs[name] = knob
  }
  return knobs
}

/** The visuals as the document keeps them. */
export function visualsToJson(set: VisualSet): JsonObject {
  const json: JsonObject = {
    ...set.more,
    palette: set.palette,
    grain: set.grain,
    list: set.list.map((visual) => {
      const entry: JsonObject = { id: visual.id, kind: visual.kind }
      if (visual.variation === 1) entry.variation = 1
      if (visual.stroke !== null) entry.stroke = visual.stroke
      else {
        entry.lane = visual.lane
        entry.beat = visual.beat
        if (visual.beats !== null) entry.beats = visual.beats
      }
      const knobs: JsonObject = {}
      for (const name of Object.keys(visual.knobs).sort()) {
        const knob = visual.knobs[name]
        knobs[name] =
          knob.follows === null
            ? { value: knob.value }
            : { value: knob.value, follows: knob.follows }
      }
      entry.knobs = knobs
      return entry
    }),
  }
  // Left out where none lies, so a piece without pedals is written as it was before there were any.
  if (set.pedals.length === 0) delete json.pedals
  else
    json.pedals = set.pedals.map((pedal) => {
      const entry: JsonObject = { device: pedal.device, x: pedal.x, y: pedal.y, size: pedal.size }
      if (pedal.turn !== 0) entry.turn = pedal.turn
      return entry
    })
  return json
}

function pedalsFromJson(json: JsonValue | undefined): VisualPedal[] {
  const pedals: VisualPedal[] = []
  const seen = new Set<string>()
  for (const entry of Array.isArray(json) ? json : []) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue
    const { device } = entry
    if (typeof device !== 'string' || device === '' || device.length > 120 || seen.has(device))
      continue
    seen.add(device)
    pedals.push({
      device,
      x: cleanShare(entry.x, 0.5),
      y: cleanShare(entry.y, 0.5),
      size: cleanPedalSize(entry.size),
      turn: cleanPedalTurn(entry.turn),
    })
    if (pedals.length === VISUAL_PEDALS_MAX) break
  }
  return pedals
}

/** The visuals of a document; whatever is not a visual is left out. */
export function visualsFromJson(json: JsonValue | undefined): VisualSet {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return NO_VISUALS
  const palette =
    typeof json.palette === 'string' && isVisualPalette(json.palette)
      ? json.palette
      : DEFAULT_PALETTE
  const grain =
    typeof json.grain === 'number' && Number.isFinite(json.grain)
      ? round3(clamp01(json.grain))
      : DEFAULT_GRAIN
  const seen = new Set<string>()
  const list: Visual[] = []
  for (const entry of Array.isArray(json.list) ? json.list : []) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue
    const { id, kind, stroke } = entry
    if (typeof id !== 'string' || id === '' || id.length > 80 || seen.has(id)) continue
    if (typeof kind !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(kind)) continue
    seen.add(id)
    list.push({
      id,
      kind,
      variation: entry.variation === 1 ? 1 : 0,
      stroke: typeof stroke === 'string' && stroke !== '' && stroke.length <= 80 ? stroke : null,
      lane: cleanLane(entry.lane),
      beat: cleanBeat(entry.beat),
      beats: cleanBeats(entry.beats),
      knobs: knobsFromJson(kind, entry.knobs),
    })
    if (list.length === VISUAL_MAX) break
  }
  const pedals = pedalsFromJson(json.pedals)
  const more: JsonObject = {}
  for (const name of Object.keys(json)) {
    if (name === 'palette' || name === 'grain' || name === 'list' || name === 'pedals') continue
    const value = json[name]
    if (value === undefined || !/^[a-zA-Z][a-zA-Z0-9-]{0,39}$/.test(name)) continue
    more[name] = value
    if (Object.keys(more).length === MORE_MAX) break
  }
  const kept = Object.keys(more).length > 0
  if (
    list.length === 0 &&
    pedals.length === 0 &&
    palette === DEFAULT_PALETTE &&
    grain === DEFAULT_GRAIN &&
    !kept
  )
    return NO_VISUALS
  return kept ? { palette, grain, list, pedals, more } : { palette, grain, list, pedals }
}

export function sameVisualSet(a: VisualSet, b: VisualSet): boolean {
  return a === b || JSON.stringify(visualsToJson(a)) === JSON.stringify(visualsToJson(b))
}

/** A visual's number, counted from the first from 1; 0 when it is not among them. */
export function visualNumber(set: VisualSet, id: string): number {
  return set.list.findIndex((visual) => visual.id === id) + 1
}

/** The visual with this number, counted from the first from 1. */
export function visualByNumber(set: VisualSet, number: number): Visual | null {
  return Number.isInteger(number) ? (set.list[number - 1] ?? null) : null
}

export function visualById(set: VisualSet, id: string | null): Visual | null {
  return id === null ? null : (set.list.find((visual) => visual.id === id) ?? null)
}

/** What a visual is called where one is named: its kind, and "b" for a style's second variation. */
export function visualLabel(visual: Visual): string {
  const style = visualStyle(visual.kind)
  return style && visual.variation === 1 ? `${style.name} b` : visualKindName(visual.kind)
}

/** Where a new visual goes: on a stroke, or in the Visuals section. */
export type VisualPlace =
  { stroke: string } | { lane?: number; beat?: number; beats?: number | null }

export interface VisualEdit {
  set: VisualSet
  /** The visual the edit was about; null when it could not be made. */
  visual: Visual | null
}

/** A new visual of a kind at a place. Nothing is added past the most a piece holds, or for a kind this build does not have. */
export function addVisual(
  set: VisualSet,
  kind: string,
  place: VisualPlace = {},
  variation: 0 | 1 = 0,
): VisualEdit {
  if (set.list.length >= VISUAL_MAX || !isVisualKind(kind)) return { set, visual: null }
  const linked = 'stroke' in place
  const visual: Visual = {
    id: createVisualId(),
    kind,
    variation: visualStyle(kind) ? variation : 0,
    stroke: linked ? place.stroke : null,
    lane: linked ? 0 : cleanLane(place.lane ?? freeLane(set)),
    beat: linked ? 0 : cleanBeat(place.beat ?? 0),
    beats: linked ? null : place.beats === undefined ? null : cleanBeats(place.beats),
    knobs: firstKnobs(kind),
  }
  return { set: { ...set, list: [...set.list, visual] }, visual }
}

/** The first row of the section nothing is drawn in yet; the last one when every row has something. */
export function freeLane(set: VisualSet): number {
  const used = new Set(
    set.list.filter((visual) => visual.stroke === null).map((visual) => visual.lane),
  )
  for (let lane = 0; lane < VISUAL_LANES; lane++) if (!used.has(lane)) return lane
  return VISUAL_LANES - 1
}

function change(set: VisualSet, id: string, edit: (visual: Visual) => Visual): VisualSet {
  let changed = false
  const list = set.list.map((visual) => {
    if (visual.id !== id) return visual
    const next = edit(visual)
    if (next !== visual) changed = true
    return next
  })
  return changed ? { ...set, list } : set
}

/** Puts a visual in the Visuals section at a row and a stretch; whatever is left out stays as it is. A linked one lets go of its stroke. */
export function placeVisual(
  set: VisualSet,
  id: string,
  place: { lane?: number; beat?: number; beats?: number | null },
): VisualSet {
  return change(set, id, (visual) => ({
    ...visual,
    stroke: null,
    lane: place.lane === undefined ? visual.lane : cleanLane(place.lane),
    beat: place.beat === undefined ? visual.beat : cleanBeat(place.beat),
    beats: place.beats === undefined ? visual.beats : cleanBeats(place.beats),
  }))
}

/** Links a visual to a stroke: it then shows while that stroke sounds, and has no place of its own in the Visuals section. */
export function linkVisual(set: VisualSet, id: string, stroke: string): VisualSet {
  return change(set, id, (visual) =>
    visual.stroke === stroke ? visual : { ...visual, stroke, lane: 0, beat: 0, beats: null },
  )
}

export function removeVisual(set: VisualSet, id: string): VisualSet {
  const list = set.list.filter((visual) => visual.id !== id)
  return list.length === set.list.length ? set : { ...set, list }
}

/** Sets where a knob stands, what it follows, or both. A knob the visual's kind does not have is left alone. */
export function setVisualKnob(
  set: VisualSet,
  id: string,
  knob: string,
  next: { value?: number; follows?: VisualSource | null },
): VisualSet {
  return change(set, id, (visual) => {
    const was = visual.knobs[knob]
    if (!was) return visual
    const value = next.value === undefined ? was.value : round3(clamp01(next.value))
    const follows = next.follows === undefined ? was.follows : next.follows
    if (value === was.value && follows === was.follows) return visual
    return {
      ...visual,
      knobs: {
        ...visual.knobs,
        [knob]: { value, follows },
      },
    }
  })
}

/** Which of a style's two variations a visual is drawn in. A bend has none. */
export function setVisualVariation(set: VisualSet, id: string, variation: 0 | 1): VisualSet {
  return change(set, id, (visual) =>
    visualStyle(visual.kind) && visual.variation !== variation ? { ...visual, variation } : visual,
  )
}

/** Gives a visual another kind, where it is and as it is linked. Its knobs start anew when the new kind has other knobs. */
export function setVisualKind(set: VisualSet, id: string, kind: string): VisualSet {
  if (!isVisualKind(kind)) return set
  return change(set, id, (visual) => {
    if (visual.kind === kind) return visual
    const same = paints(visual.kind) && paints(kind)
    return {
      ...visual,
      kind,
      variation: visualStyle(kind) ? visual.variation : 0,
      knobs: same ? visual.knobs : firstKnobs(kind),
    }
  })
}

export function setVisualPalette(set: VisualSet, palette: string): VisualSet {
  return isVisualPalette(palette) && palette !== set.palette ? { ...set, palette } : set
}

export function setVisualGrain(set: VisualSet, grain: number): VisualSet {
  const next = round3(clamp01(grain))
  return next === set.grain ? set : { ...set, grain: next }
}

/** The visuals without the ones linked to a stroke that is no longer there. */
export function withoutLostVisuals(set: VisualSet, strokeIds: ReadonlySet<string>): VisualSet {
  const list = set.list.filter((visual) => visual.stroke === null || strokeIds.has(visual.stroke))
  return list.length === set.list.length ? set : { ...set, list }
}

/** Float dust: a part that overruns where its stroke lay by less than this still lies within it. */
const LINK_SLACK_SEC = 1e-6

/** A stroke as far as a link to it goes. */
export interface LinkedStroke {
  id: string
  sampleId: number
  startSec: number
  durationSec: number
}

/**
 * The visuals after the strokes changed from `before` to `after`. A link to a stroke that is still there stays. A
 * stroke that is gone under that id may have been cut, or laid again by an edit that gives its parts new ids: its
 * visual goes on with the first new stroke of the same sound that lies within where it lay, or failing one with the
 * new stroke of that sound that covers most of it. Where there is none, the stroke was taken away and its visual goes
 * with it. A visual whose stroke was not among `before` either is left as it is.
 */
export function carryVisualLinks(
  set: VisualSet,
  before: readonly LinkedStroke[],
  after: readonly LinkedStroke[],
): VisualSet {
  if (!set.list.some((visual) => visual.stroke !== null)) return set
  const now = new Set(after.map((stroke) => stroke.id))
  if (set.list.every((visual) => visual.stroke === null || now.has(visual.stroke))) return set
  const was = new Map(before.map((stroke) => [stroke.id, stroke]))
  const list: Visual[] = []
  let changed = false
  for (const visual of set.list) {
    if (visual.stroke === null || now.has(visual.stroke)) {
      list.push(visual)
      continue
    }
    const old = was.get(visual.stroke)
    // Its stroke was gone before this change (taken out by a build that knows no visuals, or not here yet from
    // another station): not this change's to take away. It stays, linked to nothing that sounds, until it is
    // removed or linked again.
    if (!old) {
      list.push(visual)
      continue
    }
    const oldEnd = old.startSec + old.durationSec
    // A part of the stroke itself lies wholly where it lay: the first of those. Failing one, whatever of its sound
    // covers most of where it lay, which may be a stroke laid over it.
    let heir: LinkedStroke | null = null
    let heirWithin = false
    let heirShared = 0
    for (const stroke of after) {
      if (was.has(stroke.id) || stroke.sampleId !== old.sampleId) continue
      const end = stroke.startSec + stroke.durationSec
      const shared = Math.min(end, oldEnd) - Math.max(stroke.startSec, old.startSec)
      if (shared <= 0) continue
      const within =
        stroke.startSec >= old.startSec - LINK_SLACK_SEC && end <= oldEnd + LINK_SLACK_SEC
      const better =
        heir === null ||
        (within && !heirWithin) ||
        (within === heirWithin && (within ? stroke.startSec < heir.startSec : shared > heirShared))
      if (!better) continue
      heir = stroke
      heirWithin = within
      heirShared = shared
    }
    changed = true
    if (!heir) continue
    list.push({ ...visual, stroke: heir.id })
  }
  return changed ? { ...set, list } : set
}

/** The order the visuals are drawn in: row by row from the top, what paints before what bends. */
export function drawOrder(set: VisualSet): Visual[] {
  const byLane = [...set.list].sort((a, b) => a.lane - b.lane)
  return [
    ...byLane.filter((visual) => paints(visual.kind)),
    ...byLane.filter((visual) => !paints(visual.kind)),
  ]
}

/** The pedal that shows a device; null when that device does not lie on the picture. */
export function pedalOf(set: VisualSet, device: string): VisualPedal | null {
  return set.pedals.find((pedal) => pedal.device === device) ?? null
}

/** Where a pedal is put, how large and how far turned; whatever is left out stays as it is. */
export interface PedalPlace {
  x?: number
  y?: number
  size?: number
  turn?: number
}

/**
 * Where pedals laid without a place go: a row across the lower half first, as gear is laid out in front of whoever
 * plays, then a row above it. Each is turned a little, no two alike, as things put down by hand are.
 */
const PEDAL_SPOTS: readonly { x: number; y: number; turn: number }[] = [
  { x: 0.2, y: 0.7, turn: -2 },
  { x: 0.4, y: 0.7, turn: 1.5 },
  { x: 0.6, y: 0.7, turn: -1 },
  { x: 0.8, y: 0.7, turn: 2.5 },
  { x: 0.3, y: 0.3, turn: 2 },
  { x: 0.5, y: 0.3, turn: -1.5 },
  { x: 0.7, y: 0.3, turn: 1 },
  { x: 0.1, y: 0.3, turn: -2.5 },
]
/** A spot is taken when a pedal's middle is nearer to it than this, across and down. */
const SPOT_TAKEN_WITHIN = 0.09

/** Where the next pedal goes when it is given no place: the first spot nothing lies on, the first of all when every one is taken. */
export function freePedalSpot(set: VisualSet): { x: number; y: number; turn: number } {
  return (
    PEDAL_SPOTS.find(
      (spot) =>
        !set.pedals.some(
          (pedal) =>
            Math.abs(pedal.x - spot.x) < SPOT_TAKEN_WITHIN &&
            Math.abs(pedal.y - spot.y) < SPOT_TAKEN_WITHIN,
        ),
    ) ?? PEDAL_SPOTS[0]
  )
}

export interface PedalEdit {
  set: VisualSet
  /** The pedal as it lies now; null when it could not be laid. */
  pedal: VisualPedal | null
}

/**
 * Lays a device on the picture as a pedal, at a place or, where none is said, at the next free spot. A device that
 * already lies there is moved instead (`movePedal`). Nothing is laid past the most a picture holds.
 */
export function layPedal(set: VisualSet, device: string, place: PedalPlace = {}): PedalEdit {
  if (pedalOf(set, device)) {
    const next = movePedal(set, device, place)
    return { set: next, pedal: pedalOf(next, device) }
  }
  if (device === '' || device.length > 120 || set.pedals.length >= VISUAL_PEDALS_MAX)
    return { set, pedal: null }
  const spot = freePedalSpot(set)
  const pedal: VisualPedal = {
    device,
    x: cleanShare(place.x, spot.x),
    y: cleanShare(place.y, spot.y),
    size: cleanPedalSize(place.size),
    turn: cleanPedalTurn(place.turn ?? spot.turn),
  }
  return { set: { ...set, pedals: [...set.pedals, pedal] }, pedal }
}

/**
 * Moves a pedal, makes it another size or turns it; whatever is left out stays. The pedal that was touched last lies
 * over the others. Nothing changes for a device that does not lie on the picture, or for a place it already has.
 */
export function movePedal(set: VisualSet, device: string, place: PedalPlace): VisualSet {
  const was = pedalOf(set, device)
  if (!was) return set
  const next: VisualPedal = {
    device,
    x: place.x === undefined ? was.x : cleanShare(place.x, was.x),
    y: place.y === undefined ? was.y : cleanShare(place.y, was.y),
    size: place.size === undefined ? was.size : cleanPedalSize(place.size),
    turn: place.turn === undefined ? was.turn : cleanPedalTurn(place.turn),
  }
  const same =
    next.x === was.x && next.y === was.y && next.size === was.size && next.turn === was.turn
  if (same) return set
  return { ...set, pedals: [...set.pedals.filter((pedal) => pedal !== was), next] }
}

/** Takes a pedal off the picture. The device itself stays where it is in the piece. */
export function liftPedal(set: VisualSet, device: string): VisualSet {
  const pedals = set.pedals.filter((pedal) => pedal.device !== device)
  return pedals.length === set.pedals.length ? set : { ...set, pedals }
}

/** Takes every pedal off the picture. */
export function liftPedals(set: VisualSet): VisualSet {
  return set.pedals.length === 0 ? set : { ...set, pedals: [] }
}

/** The visuals without the pedals whose device is no longer in the piece. */
export function withoutLostPedals(set: VisualSet, devices: ReadonlySet<string>): VisualSet {
  const pedals = set.pedals.filter((pedal) => devices.has(pedal.device))
  return pedals.length === set.pedals.length ? set : { ...set, pedals }
}

/**
 * The visuals after devices were given other ids (`renamed`: the id before to the id now), as a host does when a
 * channel is made into another: each pedal goes on with its device. Where two would then show one device, the
 * first stays.
 */
export function carryPedals(set: VisualSet, renamed: ReadonlyMap<string, string>): VisualSet {
  if (!set.pedals.some((pedal) => renamed.has(pedal.device))) return set
  const seen = new Set<string>()
  const pedals: VisualPedal[] = []
  for (const pedal of set.pedals) {
    const device = renamed.get(pedal.device) ?? pedal.device
    if (seen.has(device)) continue
    seen.add(device)
    pedals.push(device === pedal.device ? pedal : { ...pedal, device })
  }
  return { ...set, pedals }
}
