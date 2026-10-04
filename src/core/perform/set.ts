// A perform set: what a piece can be told to do while it plays, by a hand,
// a controller or a game. Three kinds of thing, as adaptive music has them:
//
// - a scene is where the music is: which tracks are in and how far, and
//   where the dials stand;
// - a dial is how it feels: one value from 0 to 1 that moves several things
//   at once, each through its own range and curve;
// - a cue is something that happens: a sample played once, on the grid.
//
// A set is plain JSON. It lives wherever the host keeps it (ambient-live:
// `score.meta.perform`), and nothing in it changes the piece: scenes and
// dials ride on top of the mix through `ChannelStrip.setRide`, so a piece
// with no performer attached plays exactly as it was composed.
//
// Everything here is pure. `Performer` is the runtime that plays a set on an
// engine.

import { applyCurve, MAPPING_CURVES, type MappingCurve } from '../control/mapping'
import {
  DEFAULT_LAUNCH_QUANTIZE,
  isFollowTime,
  isLaunchQuantize,
  type FollowTime,
  type LaunchQuantize,
} from '../session/launch'

/** The `meta` key a score keeps its set under, by convention. */
export const PERFORM_META_KEY = 'perform'
export const PERFORM_SET_VERSION = 1

/** A ride is a gain: 0 is out, 1 is the mix as it stands. Above 1 pushes a track forward. */
export const MAX_RIDE = 2
export const DEFAULT_MORPH_BARS = 2
export const MAX_MORPH_BARS = 64

export interface PerformRange {
  min: number
  max: number
}

interface DialShape {
  /** The part of the dial's travel this target answers to. Default the whole of it. */
  input?: PerformRange
  /** What it is given over that travel; `min > max` turns it round. Default 0 to 1. */
  output?: PerformRange
  curve?: MappingCurve
}

export type PerformDialTarget =
  /** A track's ride: the dial brings the track in and takes it out. */
  | ({ kind: 'ride'; track: string } & DialShape)
  /** Something the host moves (a room, a filter, a speed): it is handed the shaped value. */
  | ({ kind: 'host'; id: string } & DialShape)

export interface PerformDial {
  id: string
  name: string
  /** Where it rests: its value before anything moves it, and after a reset. */
  value: number
  targets: PerformDialTarget[]
}

/**
 * What a scene hands over to:
 * - `stay`: nothing; the rule is drawn again after the same time;
 * - `next` / `previous`: its neighbour in the set, wrapping;
 * - `first` / `last`: the ends of the set;
 * - `any`: a uniform draw over the scenes, itself included (which is a stay);
 * - `other`: a uniform draw over the others (a stay when it is alone);
 * - `{ scene }`: that scene (a stay when it is gone).
 */
export type PerformFollowKind = 'stay' | 'next' | 'previous' | 'first' | 'last' | 'any' | 'other'
export type PerformFollowTarget = PerformFollowKind | { scene: string }

export const PERFORM_FOLLOW_KINDS: readonly PerformFollowKind[] = [
  'stay',
  'next',
  'previous',
  'first',
  'last',
  'any',
  'other',
]

export interface PerformFollow {
  a: PerformFollowTarget
  b: PerformFollowTarget
  /** Probability that A is drawn (0..1); B is drawn otherwise. */
  chance: number
  /** How long the scene plays before the draw, measured from where it came in. */
  after: FollowTime
}

export interface PerformScene {
  /** Unique across the set's scenes. */
  id: string
  name: string
  /** Track id to ride. A track the scene does not name stays where it is. */
  rides: Record<string, number>
  /** Dial id to value. A dial the scene does not name stays where it is. */
  dials: Record<string, number>
  /** Bars the scene takes to come in; absent means the set's. 0 is at once. */
  morphBars?: number
  /** What follows it, when the set follows its rules. */
  follow?: PerformFollow
}

export interface PerformCue {
  id: string
  name: string
  /** The sample it plays, by its id in the engine's sample store. */
  sample: string
  gainDb?: number
  pan?: number
  /** Send into the room, in dB against its own level (`Clip.spaceDb`). */
  spaceDb?: number
  /** The grid it waits for; absent means the set's `cueQuantize`. */
  quantize?: LaunchQuantize
}

export interface PerformSet {
  version: typeof PERFORM_SET_VERSION
  scenes: PerformScene[]
  dials: PerformDial[]
  cues: PerformCue[]
  /** The grid a scene, or a single track brought in or out, waits for. */
  quantize: LaunchQuantize
  /** The grid a cue waits for. */
  cueQuantize: LaunchQuantize
  /** Bars a scene takes to come in. */
  morphBars: number
  /** Whether scenes hand over by their follow rules. */
  follow: boolean
}

export function emptyPerformSet(): PerformSet {
  return {
    version: PERFORM_SET_VERSION,
    scenes: [],
    dials: [],
    cues: [],
    quantize: DEFAULT_LAUNCH_QUANTIZE,
    cueQuantize: 'beat',
    morphBars: DEFAULT_MORPH_BARS,
    follow: false,
  }
}

// --- Reading a set out of JSON --------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function range(value: unknown, max: number, min = 0): PerformRange | undefined {
  if (!isRecord(value) || !finite(value.min) || !finite(value.max)) return undefined
  return { min: clamp(value.min, min, max), max: clamp(value.max, min, max) }
}

function dialTarget(value: unknown): PerformDialTarget | null {
  if (!isRecord(value)) return null
  const shape: DialShape = {}
  const input = range(value.input, 1)
  if (input) shape.input = input
  // A ride is a gain; what a host is handed is the host's own unit, which may be signed.
  const output =
    value.kind === 'ride'
      ? range(value.output, MAX_RIDE)
      : range(value.output, Number.MAX_VALUE, -Number.MAX_VALUE)
  if (output) shape.output = output
  if ((MAPPING_CURVES as readonly unknown[]).includes(value.curve)) {
    shape.curve = value.curve as MappingCurve
  }
  if (value.kind === 'ride') {
    const track = text(value.track)
    return track ? { kind: 'ride', track, ...shape } : null
  }
  if (value.kind === 'host') {
    const id = text(value.id)
    return id ? { kind: 'host', id, ...shape } : null
  }
  return null
}

function followTarget(value: unknown): PerformFollowTarget | null {
  if ((PERFORM_FOLLOW_KINDS as readonly unknown[]).includes(value)) {
    return value as PerformFollowKind
  }
  if (isRecord(value)) {
    const scene = text(value.scene)
    if (scene) return { scene }
  }
  return null
}

function follow(value: unknown): PerformFollow | undefined {
  if (!isRecord(value) || !isFollowTime(value.after) || !finite(value.chance)) return undefined
  const a = followTarget(value.a)
  const b = followTarget(value.b)
  if (!a || !b) return undefined
  return {
    a,
    b,
    chance: clamp(value.chance, 0, 1),
    after: { unit: value.after.unit, value: value.after.value },
  }
}

function numbers(value: unknown, max: number): Record<string, number> {
  const out: Record<string, number> = {}
  if (!isRecord(value)) return out
  for (const key of Object.keys(value).sort()) {
    const amount = value[key]
    if (finite(amount)) out[key] = clamp(amount, 0, max)
  }
  return out
}

/** Keeps the first of every id: a set names each scene, dial and cue once. */
function unique<T extends { id: string }>(items: (T | null)[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out
}

function scene(value: unknown): PerformScene | null {
  if (!isRecord(value)) return null
  const id = text(value.id)
  if (!id) return null
  const out: PerformScene = {
    id,
    name: text(value.name) ?? id,
    rides: numbers(value.rides, MAX_RIDE),
    dials: numbers(value.dials, 1),
  }
  if (finite(value.morphBars)) out.morphBars = clamp(value.morphBars, 0, MAX_MORPH_BARS)
  const rule = follow(value.follow)
  if (rule) out.follow = rule
  return out
}

function dial(value: unknown): PerformDial | null {
  if (!isRecord(value)) return null
  const id = text(value.id)
  if (!id) return null
  const targets = Array.isArray(value.targets) ? value.targets.map(dialTarget) : []
  return {
    id,
    name: text(value.name) ?? id,
    value: finite(value.value) ? clamp(value.value, 0, 1) : 0,
    targets: targets.filter((target): target is PerformDialTarget => target !== null),
  }
}

function cue(value: unknown): PerformCue | null {
  if (!isRecord(value)) return null
  const id = text(value.id)
  const sample = text(value.sample)
  if (!id || !sample) return null
  const out: PerformCue = { id, name: text(value.name) ?? id, sample }
  if (finite(value.gainDb)) out.gainDb = value.gainDb
  if (finite(value.pan)) out.pan = clamp(value.pan, -1, 1)
  if (finite(value.spaceDb)) out.spaceDb = value.spaceDb
  if (isLaunchQuantize(value.quantize)) out.quantize = value.quantize
  return out
}

/**
 * A set read out of whatever was stored: what is well formed is kept, values
 * are brought into range, and what is not understood is dropped, so a host
 * can hand this the raw `meta` of a score from anywhere. Anything that is
 * not a set at all gives the empty one.
 */
export function normalisePerformSet(value: unknown): PerformSet {
  const out = emptyPerformSet()
  if (!isRecord(value)) return out
  if (Array.isArray(value.scenes)) out.scenes = unique(value.scenes.map(scene))
  if (Array.isArray(value.dials)) out.dials = unique(value.dials.map(dial))
  if (Array.isArray(value.cues)) out.cues = unique(value.cues.map(cue))
  if (isLaunchQuantize(value.quantize)) out.quantize = value.quantize
  if (isLaunchQuantize(value.cueQuantize)) out.cueQuantize = value.cueQuantize
  if (finite(value.morphBars)) out.morphBars = clamp(value.morphBars, 0, MAX_MORPH_BARS)
  if (typeof value.follow === 'boolean') out.follow = value.follow
  return out
}

/** The set a score carries under `meta.perform`, or the empty one. */
export function performSetOf(score: { meta?: Record<string, unknown> }): PerformSet {
  return normalisePerformSet(score.meta?.[PERFORM_META_KEY])
}

/** True when the set says nothing: no scenes, dials or cues. */
export function isEmptyPerformSet(set: PerformSet): boolean {
  return set.scenes.length === 0 && set.dials.length === 0 && set.cues.length === 0
}

// --- Dials ----------------------------------------------------------------------------

const WHOLE: Readonly<PerformRange> = { min: 0, max: 1 }

/**
 * What a target is given when its dial stands at `value`: where the value
 * falls in the target's input span, through its curve, onto its output span.
 * A dial with tracks answering one after another along its travel brings
 * them in one by one.
 */
export function shapeDial(target: PerformDialTarget, value: number): number {
  const input = target.input ?? WHOLE
  const output = target.output ?? WHOLE
  const span = input.max - input.min
  const u = span === 0 ? (value >= input.min ? 1 : 0) : clamp((value - input.min) / span, 0, 1)
  const shaped = applyCurve(target.curve ?? 'linear', u)
  return output.min + shaped * (output.max - output.min)
}

/**
 * Targets for a dial that brings `tracks` in one after another over its
 * travel, in the order given: each has an equal share of the travel to come
 * up in, and the shares overlap by `overlap` of a share, so one is still
 * rising as the next begins. The first `always` tracks are left alone: they
 * sound wherever the dial stands.
 */
export function ladderTargets(
  tracks: readonly string[],
  options: { overlap?: number; always?: number } = {},
): PerformDialTarget[] {
  const always = clamp(Math.floor(options.always ?? 1), 0, tracks.length)
  const climbing = tracks.slice(always)
  const overlap = clamp(options.overlap ?? 0.5, 0, 1)
  const step = climbing.length === 0 ? 1 : 1 / climbing.length
  return climbing.map((track, index): PerformDialTarget => {
    const from = index * step
    const to = Math.min(1, from + step * (1 + overlap))
    return { kind: 'ride', track, input: { min: round(from), max: round(to) }, curve: 's' }
  })
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

// --- Editing a set (every edit returns a new one) -----------------------------------------

/** An id no item of `taken` has: `stem`, or `stem-2`, `stem-3` and so on. */
export function freeId(taken: readonly { id: string }[], stem: string): string {
  const ids = new Set(taken.map((item) => item.id))
  if (!ids.has(stem)) return stem
  for (let n = 2; ; n += 1) {
    const id = `${stem}-${n}`
    if (!ids.has(id)) return id
  }
}

function put<T extends { id: string }>(items: readonly T[], item: T): T[] {
  const index = items.findIndex((candidate) => candidate.id === item.id)
  if (index === -1) return [...items, item]
  return items.map((candidate, at) => (at === index ? item : candidate))
}

/** The set with `scene` added at the end, or put in place of the one with its id. */
export function withScene(set: PerformSet, next: PerformScene): PerformSet {
  return { ...set, scenes: put(set.scenes, next) }
}

/** The set without a scene; follow rules that named it stay, and read as `stay` when drawn. */
export function withoutScene(set: PerformSet, id: string): PerformSet {
  return { ...set, scenes: set.scenes.filter((candidate) => candidate.id !== id) }
}

/** The set with a scene moved to `index` in the order (clamped). */
export function moveScene(set: PerformSet, id: string, index: number): PerformSet {
  const from = set.scenes.findIndex((candidate) => candidate.id === id)
  if (from === -1) return set
  const scenes = [...set.scenes]
  const [moved] = scenes.splice(from, 1)
  scenes.splice(clamp(Math.round(index), 0, scenes.length), 0, moved)
  return { ...set, scenes }
}

export function withDial(set: PerformSet, next: PerformDial): PerformSet {
  return { ...set, dials: put(set.dials, next) }
}

export function withoutDial(set: PerformSet, id: string): PerformSet {
  return {
    ...set,
    dials: set.dials.filter((candidate) => candidate.id !== id),
    scenes: set.scenes.map((candidate) => {
      if (!(id in candidate.dials)) return candidate
      const dials = { ...candidate.dials }
      delete dials[id]
      return { ...candidate, dials }
    }),
  }
}

export function withCue(set: PerformSet, next: PerformCue): PerformSet {
  return { ...set, cues: put(set.cues, next) }
}

export function withoutCue(set: PerformSet, id: string): PerformSet {
  return { ...set, cues: set.cues.filter((candidate) => candidate.id !== id) }
}

/**
 * The set with a track gone from it: no scene rides it and no dial moves it.
 * For a host whose track was deleted, so a set does not keep naming it.
 */
export function withoutTrack(set: PerformSet, track: string): PerformSet {
  return {
    ...set,
    scenes: set.scenes.map((candidate) => {
      if (!(track in candidate.rides)) return candidate
      const rides = { ...candidate.rides }
      delete rides[track]
      return { ...candidate, rides }
    }),
    dials: set.dials.map((candidate) => ({
      ...candidate,
      targets: candidate.targets.filter(
        (target) => target.kind !== 'ride' || target.track !== track,
      ),
    })),
  }
}

/** Tracks a scene has in: every one it rides above silence. */
export function sceneTracksIn(target: PerformScene): string[] {
  return Object.keys(target.rides).filter((track) => target.rides[track] > 0)
}

// --- Follow rules ---------------------------------------------------------------------

/** Draw A with probability `chance`, else B. `random` yields [0, 1). */
export function drawPerformFollow(
  rule: Pick<PerformFollow, 'a' | 'b' | 'chance'>,
  random: () => number,
): PerformFollowTarget {
  if (rule.chance >= 1) return rule.a
  if (rule.chance <= 0) return rule.b
  return random() < rule.chance ? rule.a : rule.b
}

function uniformIndex(random: () => number, length: number): number {
  if (length <= 0) return 0
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)))
}

/**
 * The scene a drawn target leads to from `current`, or null to stay where
 * the music is. `random` is only consulted for `any` and `other`. A scene
 * that is no longer in the set counts from the start of it.
 */
export function resolvePerformFollow(
  target: PerformFollowTarget,
  current: string,
  scenes: readonly PerformScene[],
  random: () => number,
): string | null {
  if (scenes.length === 0) return null
  const index = scenes.findIndex((candidate) => candidate.id === current)
  const to = (next: PerformScene | undefined): string | null =>
    next && next.id !== current ? next.id : null
  if (typeof target === 'object')
    return to(scenes.find((candidate) => candidate.id === target.scene))
  switch (target) {
    case 'stay':
      return null
    case 'next':
      return to(scenes[index === -1 ? 0 : (index + 1) % scenes.length])
    case 'previous':
      return to(
        scenes[index === -1 ? scenes.length - 1 : (index - 1 + scenes.length) % scenes.length],
      )
    case 'first':
      return to(scenes[0])
    case 'last':
      return to(scenes[scenes.length - 1])
    case 'any':
      return to(scenes[uniformIndex(random, scenes.length)])
    case 'other': {
      const others = scenes.filter((candidate) => candidate.id !== current)
      return to(others[uniformIndex(random, others.length)])
    }
    default: {
      const exhaustive: never = target
      return exhaustive
    }
  }
}

function describeTarget(target: PerformFollowTarget, scenes: readonly PerformScene[]): string {
  if (typeof target === 'object') {
    return scenes.find((candidate) => candidate.id === target.scene)?.name ?? 'stay'
  }
  return target === 'other' ? 'any other' : target
}

/** A rule in a few words, for a pad or a history line: "next 70%, any other 30%, after 8 bars". */
export function describePerformFollow(
  rule: PerformFollow,
  scenes: readonly PerformScene[] = [],
): string {
  const amount = rule.after.value
  const when =
    rule.after.unit === 'bars'
      ? `after ${amount} ${amount === 1 ? 'bar' : 'bars'}`
      : `after ${amount} s`
  const a = describeTarget(rule.a, scenes)
  const b = describeTarget(rule.b, scenes)
  const percent = Math.round(rule.chance * 100)
  if (a === b || percent >= 100) return `${a}, ${when}`
  if (percent <= 0) return `${b}, ${when}`
  return `${a} ${percent}%, ${b} ${100 - percent}%, ${when}`
}
