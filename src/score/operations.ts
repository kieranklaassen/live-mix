// Operations: the vocabulary every edit of a score is expressed in — by a UI,
// by the agent API (U29) or by a planner emitting a whole arrangement. Each
// is a plain JSON record with a stable `type`, `apply(score, op)` is a pure
// function returning a new document (untouched branches are shared), and
// `invert(score, op)` computes the operation that undoes it against the
// score *before* it applied. Removals cascade (a track takes its lanes and
// routes with it, a return its sends, a modulator its routes) and their
// inverses are `batch` operations that put every piece back at its index, so
// `apply(invert(op), apply(op)) ≡ score` holds for every operation.

import { type Clip } from '../core/clips/Clip'
import { type ModPolarity } from '../core/automation/ModMatrix'
import { type Breakpoint } from '../core/automation/ParamLane'
import { type TempoSegment } from '../core/time/TempoMap'
import {
  describeFollowAction,
  isFollowAction,
  type ScoreFollowAction,
} from '../core/session/followActions'
import { describeQuantize, isLaunchQuantize, type LaunchQuantize } from '../core/session/launch'
import { type ScoreScene } from '../core/session/Scene'
import { LAUNCH_MODES, type LaunchMode, type ScoreSlot, type SlotClip } from '../core/session/Slot'
import {
  MASTER_OWNER,
  findDevice,
  findElementTrack,
  findGroup,
  findReturn,
  findScene,
  findSlot,
  findStripHost,
  findTrack,
  normaliseClip,
  normaliseScore,
  normaliseSlot,
  normaliseTempo,
  sameTarget,
  slotAt,
  sortBreakpoints,
  sortClips,
  targetKey,
  validateScore,
  type ParamTarget,
  type Score,
  type ScoreDestination,
  type ScoreDevice,
  type ScoreElementTrack,
  type ScoreGroup,
  type ScoreLane,
  type ScoreModRoute,
  type ScoreModulator,
  type ScoreReturn,
  type ScoreSend,
  type ScoreSource,
  type ScoreStrip,
  type ScoreStripHost,
  type ScoreTrack,
  type StripParam,
} from './schema'

// --- The vocabulary -------------------------------------------------------------------

/** Fields a `modulator.update` may patch; only those of the modulator's kind are accepted. */
export interface ModulatorPatch {
  rateHz?: number
  shape?: 'sine' | 'triangle' | 'saw' | 'square'
  depth?: number
  phase?: number
  seed?: number
  smooth?: boolean
  value?: number
  phaseOffset?: number
}

export type ClipPatch = Partial<Omit<Clip, 'id'>>

/**
 * Fields a `slot.update` may patch. `quantize: null` and `follow: null`
 * clear the optional setting (back to the global quantisation / no follow
 * action); `clip: null` empties the slot.
 */
export interface SlotPatch {
  track?: string
  scene?: string
  clip?: SlotClip | null
  quantize?: LaunchQuantize | null
  launchMode?: LaunchMode
  legato?: boolean
  follow?: ScoreFollowAction | null
}

export type Operation =
  | { type: 'score.rename'; name: string }
  | { type: 'transport.loop'; enabled?: boolean; lengthSec?: number | null }
  /** Replace the tempo map (segments are sorted; the first must start at 0). */
  | { type: 'tempo.set'; segments: TempoSegment[] }
  | { type: 'source.add'; source: ScoreSource; index?: number }
  | { type: 'source.remove'; id: string }
  | { type: 'track.add'; track: ScoreTrack; index?: number }
  | { type: 'track.remove'; id: string }
  | { type: 'track.move'; id: string; index: number }
  | { type: 'elementTrack.add'; track: ScoreElementTrack; index?: number }
  | { type: 'elementTrack.remove'; id: string }
  | { type: 'elementTrack.route'; id: string; destination: ScoreDestination }
  /** Replace an element track's clip list (element clips have no per-clip operations). */
  | { type: 'elementTrack.setClips'; id: string; clips: Clip[] }
  | { type: 'group.add'; group: ScoreGroup; index?: number }
  | { type: 'group.remove'; id: string }
  | { type: 'group.move'; id: string; index: number }
  | { type: 'return.add'; return: ScoreReturn; index?: number }
  | { type: 'return.remove'; id: string }
  | { type: 'return.move'; id: string; index: number }
  /** Rename any strip host (track, group or return). */
  | { type: 'strip.rename'; id: string; name: string }
  /** Re-route any strip host to the master or a group. */
  | { type: 'strip.route'; id: string; destination: ScoreDestination }
  /** Fader, pan or trim on a strip host, or `owner: 'master'` with `param: 'level'`. */
  | { type: 'strip.set'; owner: string; param: StripParam; value: number }
  | { type: 'strip.mute'; owner: string; mute: boolean }
  | { type: 'strip.solo'; owner: string; solo: boolean }
  | { type: 'strip.soloSafe'; owner: string; soloSafe: boolean }
  | { type: 'clip.add'; track: string; clip: Clip }
  | { type: 'clip.remove'; track: string; id: string }
  | { type: 'clip.move'; track: string; id: string; startSec: number }
  | {
      type: 'clip.trim'
      track: string
      id: string
      startSec?: number
      offsetSec?: number
      durationSec?: number
    }
  | { type: 'clip.update'; track: string; id: string; patch: ClipPatch }
  /** Drop every clip starting at or after `fromSec` and add `clips` (all starting there or later). */
  | { type: 'clip.replaceFrom'; track: string; fromSec: number; clips: Clip[] }
  /** Insert a device into a strip host's chain, or the master's with `owner: 'master'`. */
  | { type: 'device.add'; owner: string; device: ScoreDevice; index?: number }
  | { type: 'device.remove'; id: string }
  | { type: 'device.move'; id: string; index: number }
  | { type: 'device.setParam'; device: string; param: string; value: number }
  /** Several params at once; `null` clears an explicit value back to the preset/default. */
  | { type: 'device.setParams'; device: string; params: Record<string, number | null> }
  /** Load a preset (or `null` for none); `params` replaces the explicit overlay (default empty). */
  | {
      type: 'device.preset'
      device: string
      preset: string | null
      params?: Record<string, number>
    }
  | { type: 'device.bypass'; device: string; bypass: boolean }
  | { type: 'send.add'; owner: string; target: string; level: number | null; index?: number }
  | { type: 'send.remove'; owner: string; target: string }
  | { type: 'send.set'; owner: string; target: string; level: number | null }
  | { type: 'lane.add'; lane: ScoreLane; index?: number }
  | { type: 'lane.remove'; id: string }
  | { type: 'lane.setBreakpoints'; id: string; breakpoints: Breakpoint[] }
  | { type: 'lane.addBreakpoint'; id: string; breakpoint: Breakpoint }
  | { type: 'lane.removeBreakpoint'; id: string; timeSec: number }
  | { type: 'modulator.add'; modulator: ScoreModulator; index?: number }
  | { type: 'modulator.remove'; id: string }
  | { type: 'modulator.update'; id: string; patch: ModulatorPatch }
  | { type: 'route.add'; route: ScoreModRoute; index?: number }
  | { type: 'route.remove'; id: string }
  | { type: 'route.update'; id: string; depth?: number; polarity?: ModPolarity }
  /** Global launch quantisation for the session grid (U31). */
  | { type: 'transport.quantize'; quantize: LaunchQuantize }
  | { type: 'scene.add'; scene: ScoreScene; index?: number }
  /** Removes the scene and every slot in it. */
  | { type: 'scene.remove'; id: string }
  | { type: 'scene.move'; id: string; index: number }
  | { type: 'scene.rename'; id: string; name: string }
  /** Put a slot in a free cell (audio track × scene). */
  | { type: 'slot.add'; slot: ScoreSlot; index?: number }
  | { type: 'slot.remove'; id: string }
  /** Patch a slot's cell, clip or launch settings. */
  | { type: 'slot.update'; id: string; patch: SlotPatch }
  /** Applied in order as one step; the inverse is the reversed inverses. */
  | { type: 'batch'; ops: Operation[]; label?: string }
  /**
   * Replace the whole document (a version restored, U30). The score is
   * validated and normalised on apply; the inverse carries the previous one.
   */
  | { type: 'score.replace'; score: Score; label?: string }

export type OperationType = Operation['type']

/** Every operation type, in vocabulary order — the agent registry enumerates these. */
export const OPERATION_TYPES: readonly OperationType[] = [
  'score.rename',
  'transport.loop',
  'tempo.set',
  'source.add',
  'source.remove',
  'track.add',
  'track.remove',
  'track.move',
  'elementTrack.add',
  'elementTrack.remove',
  'elementTrack.route',
  'elementTrack.setClips',
  'group.add',
  'group.remove',
  'group.move',
  'return.add',
  'return.remove',
  'return.move',
  'strip.rename',
  'strip.route',
  'strip.set',
  'strip.mute',
  'strip.solo',
  'strip.soloSafe',
  'clip.add',
  'clip.remove',
  'clip.move',
  'clip.trim',
  'clip.update',
  'clip.replaceFrom',
  'device.add',
  'device.remove',
  'device.move',
  'device.setParam',
  'device.setParams',
  'device.preset',
  'device.bypass',
  'send.add',
  'send.remove',
  'send.set',
  'lane.add',
  'lane.remove',
  'lane.setBreakpoints',
  'lane.addBreakpoint',
  'lane.removeBreakpoint',
  'modulator.add',
  'modulator.remove',
  'modulator.update',
  'route.add',
  'route.remove',
  'route.update',
  'transport.quantize',
  'scene.add',
  'scene.remove',
  'scene.move',
  'scene.rename',
  'slot.add',
  'slot.remove',
  'slot.update',
  'batch',
  'score.replace',
]

export function isOperation(value: unknown): value is Operation {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string' &&
    (OPERATION_TYPES as readonly string[]).includes((value as { type: string }).type)
  )
}

/** Thrown by `apply`/`invert` when an operation does not fit the score it is applied to. */
export class ScoreOperationError extends Error {
  readonly operation: Operation

  constructor(operation: Operation, message: string) {
    super(`live-mix: ${operation.type}: ${message}`)
    this.name = 'ScoreOperationError'
    this.operation = operation
  }
}

// --- Coalescing -----------------------------------------------------------------------

/**
 * Operations that a continuous gesture emits many of (a fader drag, a knob
 * turn, a clip drag, a paint stroke) share a key; `History` folds consecutive
 * same-key operations into one undo step. Discrete edits return null.
 */
export function coalesceKey(op: Operation): string | null {
  switch (op.type) {
    case 'strip.set':
      return `strip.set|${op.owner}|${op.param}`
    case 'device.setParam':
      return `device.setParam|${op.device}|${op.param}`
    case 'device.setParams':
      return `device.setParams|${op.device}|${Object.keys(op.params).sort().join(',')}`
    case 'send.set':
      return `send.set|${op.owner}|${op.target}`
    case 'clip.move':
      return `clip.move|${op.track}|${op.id}`
    case 'clip.trim':
      return `clip.trim|${op.track}|${op.id}|${trimKeys(op).join(',')}`
    case 'lane.setBreakpoints':
      return `lane.setBreakpoints|${op.id}`
    case 'modulator.update':
      return `modulator.update|${op.id}|${Object.keys(op.patch).sort().join(',')}`
    case 'route.update':
      return `route.update|${op.id}|${routeKeys(op).join(',')}`
    case 'score.rename':
    case 'transport.loop':
    case 'tempo.set':
    case 'elementTrack.add':
    case 'elementTrack.remove':
    case 'elementTrack.route':
    case 'elementTrack.setClips':
    case 'source.add':
    case 'source.remove':
    case 'track.add':
    case 'track.remove':
    case 'track.move':
    case 'group.add':
    case 'group.remove':
    case 'group.move':
    case 'return.add':
    case 'return.remove':
    case 'return.move':
    case 'strip.rename':
    case 'strip.route':
    case 'strip.mute':
    case 'strip.solo':
    case 'strip.soloSafe':
    case 'clip.add':
    case 'clip.remove':
    case 'clip.update':
    case 'clip.replaceFrom':
    case 'device.add':
    case 'device.remove':
    case 'device.move':
    case 'device.preset':
    case 'device.bypass':
    case 'send.add':
    case 'send.remove':
    case 'lane.add':
    case 'lane.remove':
    case 'lane.addBreakpoint':
    case 'lane.removeBreakpoint':
    case 'modulator.add':
    case 'modulator.remove':
    case 'route.add':
    case 'route.remove':
    case 'transport.quantize':
    case 'scene.add':
    case 'scene.remove':
    case 'scene.move':
    case 'scene.rename':
    case 'slot.add':
    case 'slot.remove':
    case 'slot.update':
    case 'batch':
    case 'score.replace':
      return null
    default: {
      const exhaustive: never = op
      return exhaustive
    }
  }
}

function trimKeys(op: Extract<Operation, { type: 'clip.trim' }>): string[] {
  const keys: string[] = []
  if (op.startSec !== undefined) keys.push('startSec')
  if (op.offsetSec !== undefined) keys.push('offsetSec')
  if (op.durationSec !== undefined) keys.push('durationSec')
  return keys
}

function routeKeys(op: Extract<Operation, { type: 'route.update' }>): string[] {
  const keys: string[] = []
  if (op.depth !== undefined) keys.push('depth')
  if (op.polarity !== undefined) keys.push('polarity')
  return keys
}

// --- Helpers ----------------------------------------------------------------------------

function fail(op: Operation, message: string): never {
  throw new ScoreOperationError(op, message)
}

function insertAt<T>(op: Operation, list: readonly T[], item: T, index: number | undefined): T[] {
  const at = index ?? list.length
  if (!Number.isInteger(at) || at < 0 || at > list.length) {
    fail(op, `index ${String(index)} is outside 0..${list.length}`)
  }
  return [...list.slice(0, at), item, ...list.slice(at)]
}

function moveTo<T>(op: Operation, list: readonly T[], from: number, to: number): T[] {
  if (!Number.isInteger(to) || to < 0 || to >= list.length) {
    fail(op, `index ${to} is outside 0..${list.length - 1}`)
  }
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

function requireTrack(score: Score, op: Operation, id: string): ScoreTrack {
  return findTrack(score, id) ?? fail(op, `no track "${id}"`)
}

function requireElementTrack(score: Score, op: Operation, id: string): ScoreElementTrack {
  return findElementTrack(score, id) ?? fail(op, `no element track "${id}"`)
}

/** Element clips need a source with a `url` to stream from. */
function assertStreamableClips(score: Score, op: Operation, clips: readonly Clip[]): void {
  for (const clip of clips) {
    const source = score.sources.find((candidate) => candidate.id === clip.sourceId)
    if (!source) fail(op, `unknown source "${clip.sourceId}"`)
    if (source.url === undefined) fail(op, `source "${clip.sourceId}" has no url to stream`)
  }
}

function requireAudioTrack(
  score: Score,
  op: Operation,
  id: string,
): Extract<ScoreTrack, { kind: 'audio' }> {
  const track = requireTrack(score, op, id)
  if (track.kind !== 'audio') fail(op, `track "${id}" is a ${track.kind} track and has no clips`)
  return track
}

function requireHost(score: Score, op: Operation, id: string): ScoreStripHost {
  return findStripHost(score, id) ?? fail(op, `no track, group or return "${id}"`)
}

function requireClip(
  track: Extract<ScoreTrack, { kind: 'audio' }>,
  op: Operation,
  id: string,
): Clip {
  return (
    track.clips.find((clip) => clip.id === id) ?? fail(op, `no clip "${id}" on track "${track.id}"`)
  )
}

function requireLane(score: Score, op: Operation, id: string): ScoreLane {
  return score.lanes.find((lane) => lane.id === id) ?? fail(op, `no lane "${id}"`)
}

function requireModulator(score: Score, op: Operation, id: string): ScoreModulator {
  return (
    score.modulators.find((modulator) => modulator.id === id) ?? fail(op, `no modulator "${id}"`)
  )
}

function requireRoute(score: Score, op: Operation, id: string): ScoreModRoute {
  return score.routes.find((route) => route.id === id) ?? fail(op, `no route "${id}"`)
}

function requireScene(score: Score, op: Operation, id: string): ScoreScene {
  return findScene(score, id) ?? fail(op, `no scene "${id}"`)
}

function requireSlot(score: Score, op: Operation, id: string): ScoreSlot {
  return findSlot(score, id) ?? fail(op, `no slot "${id}"`)
}

/** A slot's cell must name an audio track and a scene, and be the only slot there. */
function assertSlotCell(score: Score, op: Operation, slot: ScoreSlot): void {
  requireAudioTrack(score, op, slot.track)
  requireScene(score, op, slot.scene)
  const occupant = slotAt(score, slot.track, slot.scene)
  if (occupant && occupant.id !== slot.id) {
    fail(op, `slot "${occupant.id}" already sits at ${slot.track} × ${slot.scene}`)
  }
}

function assertSlotSettings(score: Score, op: Operation, slot: ScoreSlot): void {
  if (slot.clip !== null && !score.sources.some((source) => source.id === slot.clip?.sourceId)) {
    fail(op, `no source "${slot.clip.sourceId}"`)
  }
  if (slot.quantize !== undefined && !isLaunchQuantize(slot.quantize)) {
    fail(op, 'quantize must be none, bar, beat, a positive bar count or { seconds > 0 }')
  }
  if (!LAUNCH_MODES.includes(slot.launchMode)) fail(op, `unknown launch mode "${slot.launchMode}"`)
  if (slot.follow !== undefined && !isFollowAction(slot.follow)) {
    fail(op, 'follow must be { a, b, chance 0..1, time?: { unit, value > 0 } }')
  }
}

/** The slots `keep` selects, with their indices, and the score without them. */
function detachSlots(
  score: Score,
  keep: (slot: ScoreSlot) => boolean,
): { score: Score; slots: Indexed<ScoreSlot>[] } {
  const slots = indexed(score.slots, keep)
  return {
    score: slots.length ? { ...score, slots: score.slots.filter((slot) => !keep(slot)) } : score,
    slots,
  }
}

function reattachSlotOps(slots: Indexed<ScoreSlot>[]): Operation[] {
  return slots.map((entry): Operation => ({
    type: 'slot.add',
    slot: entry.item,
    index: entry.index,
  }))
}

function assertFreshOwnerId(score: Score, op: Operation, id: string): void {
  if (id === MASTER_OWNER) fail(op, `"${MASTER_OWNER}" is reserved`)
  if (findStripHost(score, id)) fail(op, `id "${id}" is already a track, group or return`)
  if (findElementTrack(score, id)) fail(op, `id "${id}" is already an element track`)
}

function assertFreshDeviceIds(score: Score, op: Operation, devices: readonly ScoreDevice[]): void {
  const seen = new Set<string>()
  for (const device of devices) {
    if (seen.has(device.id) || findDevice(score, device.id)) {
      fail(op, `device id "${device.id}" is already in the score`)
    }
    seen.add(device.id)
  }
}

function hostDevices(host: ScoreStripHost): ScoreDevice[] {
  return 'device' in host ? [host.device, ...host.strip.inserts] : [...host.strip.inserts]
}

function assertDestinationExists(score: Score, op: Operation, destination: ScoreDestination): void {
  if (destination.kind === 'group' && !findGroup(score, destination.id)) {
    fail(op, `no group "${destination.id}"`)
  }
}

/** Walks the group chain from `destination` and refuses when it reaches `selfId`. */
function assertNoRoutingLoop(
  score: Score,
  op: Operation,
  selfId: string,
  destination: ScoreDestination,
): void {
  let current = destination
  while (current.kind === 'group') {
    if (current.id === selfId) fail(op, `routing "${selfId}" into its own subtree would loop`)
    const group = findGroup(score, current.id) ?? fail(op, `no group "${current.id}"`)
    current = group.destination
  }
}

function replaceHost(score: Score, id: string, next: ScoreStripHost): Score {
  if (findTrack(score, id)) {
    return {
      ...score,
      tracks: score.tracks.map((track) => (track.id === id ? (next as ScoreTrack) : track)),
    }
  }
  if (findGroup(score, id)) {
    return { ...score, groups: score.groups.map((group) => (group.id === id ? next : group)) }
  }
  return {
    ...score,
    returns: score.returns.map((ret) => (ret.id === id ? (next as ScoreReturn) : ret)),
  }
}

function withStrip(
  score: Score,
  op: Operation,
  owner: string,
  update: (strip: ScoreStrip) => ScoreStrip,
): Score {
  const host = requireHost(score, op, owner)
  return replaceHost(score, owner, { ...host, strip: update(host.strip) })
}

function replaceDevice(score: Score, id: string, next: ScoreDevice): Score {
  const swap = (device: ScoreDevice): ScoreDevice => (device.id === id ? next : device)
  const swapStrip = (strip: ScoreStrip): ScoreStrip =>
    strip.inserts.some((device) => device.id === id)
      ? { ...strip, inserts: strip.inserts.map(swap) }
      : strip
  return {
    ...score,
    master: score.master.inserts.some((device) => device.id === id)
      ? { ...score.master, inserts: score.master.inserts.map(swap) }
      : score.master,
    tracks: score.tracks.map((track) => {
      const strip = swapStrip(track.strip)
      if (track.kind === 'instrument' && track.device.id === id) {
        return { ...track, device: next, strip }
      }
      return strip === track.strip ? track : { ...track, strip }
    }),
    groups: score.groups.map((group) => {
      const strip = swapStrip(group.strip)
      return strip === group.strip ? group : { ...group, strip }
    }),
    returns: score.returns.map((ret) => {
      const strip = swapStrip(ret.strip)
      if (ret.device.id === id) return { ...ret, device: next, strip }
      return strip === ret.strip ? ret : { ...ret, strip }
    }),
  }
}

function requireDevice(score: Score, op: Operation, id: string): ScoreDevice {
  return findDevice(score, id)?.device ?? fail(op, `no device "${id}"`)
}

/** The insert chain an owner id names: the master's or a strip host's. */
function insertsOf(score: Score, op: Operation, owner: string): ScoreDevice[] {
  if (owner === MASTER_OWNER) return score.master.inserts
  return requireHost(score, op, owner).strip.inserts
}

function withInserts(score: Score, op: Operation, owner: string, inserts: ScoreDevice[]): Score {
  if (owner === MASTER_OWNER) return { ...score, master: { ...score.master, inserts } }
  return withStrip(score, op, owner, (strip) => ({ ...strip, inserts }))
}

const tidyClip = normaliseClip

function targetsDevice(target: ParamTarget, deviceIds: ReadonlySet<string>): boolean {
  return target.kind === 'device' && deviceIds.has(target.device)
}

function targetsOwner(target: ParamTarget, owner: string): boolean {
  return target.kind === 'strip' && target.owner === owner
}

interface Indexed<T> {
  index: number
  item: T
}

function indexed<T>(list: readonly T[], keep: (item: T) => boolean): Indexed<T>[] {
  const out: Indexed<T>[] = []
  list.forEach((item, index) => {
    if (keep(item)) out.push({ index, item })
  })
  return out
}

/**
 * Lanes and routes that address `owner`'s strip or any of `devices`, with
 * their indices, and the score without them. Shared by every cascading removal.
 */
function detachAutomation(
  score: Score,
  owner: string | null,
  devices: readonly ScoreDevice[],
): { score: Score; lanes: Indexed<ScoreLane>[]; routes: Indexed<ScoreModRoute>[] } {
  const deviceIds = new Set(devices.map((device) => device.id))
  const hits = (target: ParamTarget): boolean =>
    (owner !== null && targetsOwner(target, owner)) || targetsDevice(target, deviceIds)
  const lanes = indexed(score.lanes, (lane) => hits(lane.target))
  const routes = indexed(score.routes, (route) => hits(route.target))
  return {
    score: {
      ...score,
      lanes: lanes.length ? score.lanes.filter((lane) => !hits(lane.target)) : score.lanes,
      routes: routes.length ? score.routes.filter((route) => !hits(route.target)) : score.routes,
    },
    lanes,
    routes,
  }
}

/** The `lane.add` / `route.add` operations that put detached automation back where it was. */
function reattachOps(lanes: Indexed<ScoreLane>[], routes: Indexed<ScoreModRoute>[]): Operation[] {
  return [
    ...lanes.map((entry): Operation => ({
      type: 'lane.add',
      lane: entry.item,
      index: entry.index,
    })),
    ...routes.map((entry): Operation => ({
      type: 'route.add',
      route: entry.item,
      index: entry.index,
    })),
  ]
}

function patchModulator(
  op: Operation,
  modulator: ScoreModulator,
  patch: ModulatorPatch,
): ScoreModulator {
  const allowed = modulatorFields(modulator)
  for (const key of Object.keys(patch)) {
    if (!allowed.includes(key as keyof ModulatorPatch)) {
      fail(op, `a ${modulator.kind} modulator has no "${key}"`)
    }
  }
  return { ...modulator, ...patch }
}

function modulatorFields(modulator: ScoreModulator): (keyof ModulatorPatch)[] {
  switch (modulator.kind) {
    case 'lfo':
      return ['rateHz', 'shape', 'depth', 'phase']
    case 'random':
      return ['rateHz', 'seed', 'smooth']
    case 'macro':
      return ['value']
    case 'external-phase':
      return ['phaseOffset', 'depth', 'shape']
    default: {
      const exhaustive: never = modulator
      return exhaustive
    }
  }
}

// --- apply ---------------------------------------------------------------------------------

/** The score after `op`. Pure: `score` is never mutated. Throws `ScoreOperationError`. */
export function apply(score: Score, op: Operation): Score {
  switch (op.type) {
    case 'score.rename':
      return { ...score, name: op.name }

    case 'transport.loop': {
      const loop = { ...score.transport.loop }
      if (op.enabled !== undefined) loop.enabled = op.enabled
      if (op.lengthSec !== undefined) {
        if (op.lengthSec !== null && !(op.lengthSec > 0)) fail(op, 'lengthSec must be > 0 or null')
        loop.lengthSec = op.lengthSec
      }
      return { ...score, transport: { ...score.transport, loop } }
    }

    case 'tempo.set': {
      if (op.segments.length === 0) fail(op, 'tempo needs at least one segment')
      const segments = normaliseTempo(op.segments)
      if (segments[0].atSec !== 0) fail(op, 'the first tempo segment must start at 0')
      for (const [index, segment] of segments.entries()) {
        if (!(segment.bpm > 0) || !Number.isFinite(segment.bpm))
          fail(op, `bpm must be > 0 (segment ${index})`)
        if (index > 0 && segment.atSec <= segments[index - 1].atSec) {
          fail(op, `tempo segments must ascend (segment ${index})`)
        }
        if (
          segment.beatsPerBar !== undefined &&
          (!Number.isInteger(segment.beatsPerBar) || segment.beatsPerBar < 1)
        ) {
          fail(op, `beatsPerBar must be a positive integer (segment ${index})`)
        }
      }
      return { ...score, tempo: segments }
    }

    case 'elementTrack.add': {
      assertFreshOwnerId(score, op, op.track.id)
      if (findElementTrack(score, op.track.id))
        fail(op, `element track "${op.track.id}" already exists`)
      assertDestinationExists(score, op, op.track.destination)
      assertStreamableClips(score, op, op.track.clips)
      const track: ScoreElementTrack = {
        ...op.track,
        clips: sortClips(op.track.clips.map(tidyClip)),
      }
      return { ...score, elementTracks: insertAt(op, score.elementTracks, track, op.index) }
    }

    case 'elementTrack.remove': {
      const track = requireElementTrack(score, op, op.id)
      return {
        ...score,
        elementTracks: score.elementTracks.filter((candidate) => candidate !== track),
      }
    }

    case 'elementTrack.route': {
      const track = requireElementTrack(score, op, op.id)
      assertDestinationExists(score, op, op.destination)
      return {
        ...score,
        elementTracks: score.elementTracks.map((candidate) =>
          candidate === track ? { ...candidate, destination: op.destination } : candidate,
        ),
      }
    }

    case 'elementTrack.setClips': {
      const track = requireElementTrack(score, op, op.id)
      assertStreamableClips(score, op, op.clips)
      const clips = sortClips(op.clips.map(tidyClip))
      return {
        ...score,
        elementTracks: score.elementTracks.map((candidate) =>
          candidate === track ? { ...candidate, clips } : candidate,
        ),
      }
    }

    case 'source.add':
      if (score.sources.some((source) => source.id === op.source.id)) {
        fail(op, `source "${op.source.id}" already exists`)
      }
      return { ...score, sources: insertAt(op, score.sources, { ...op.source }, op.index) }

    case 'source.remove': {
      if (!score.sources.some((source) => source.id === op.id)) fail(op, `no source "${op.id}"`)
      for (const track of score.tracks) {
        if (track.kind === 'audio' && track.clips.some((clip) => clip.sourceId === op.id)) {
          fail(op, `source "${op.id}" is used by a clip on track "${track.id}"`)
        }
      }
      for (const slot of score.slots) {
        if (slot.clip?.sourceId === op.id)
          fail(op, `source "${op.id}" is used by slot "${slot.id}"`)
      }
      for (const track of score.elementTracks) {
        if (track.clips.some((clip) => clip.sourceId === op.id)) {
          fail(op, `source "${op.id}" is used by a clip on element track "${track.id}"`)
        }
      }
      return { ...score, sources: score.sources.filter((source) => source.id !== op.id) }
    }

    case 'track.add': {
      assertFreshOwnerId(score, op, op.track.id)
      assertDestinationExists(score, op, op.track.destination)
      assertFreshDeviceIds(score, op, hostDevices(op.track))
      const track: ScoreTrack =
        op.track.kind === 'audio'
          ? { ...op.track, clips: sortClips(op.track.clips.map(tidyClip)) }
          : { ...op.track }
      return { ...score, tracks: insertAt(op, score.tracks, track, op.index) }
    }

    case 'track.remove': {
      const track = requireTrack(score, op, op.id)
      const detached = detachAutomation(score, op.id, hostDevices(track))
      const withoutSlots = detachSlots(detached.score, (slot) => slot.track === op.id).score
      return { ...withoutSlots, tracks: score.tracks.filter((candidate) => candidate !== track) }
    }

    case 'track.move': {
      const from = score.tracks.findIndex((track) => track.id === op.id)
      if (from === -1) fail(op, `no track "${op.id}"`)
      return { ...score, tracks: moveTo(op, score.tracks, from, op.index) }
    }

    case 'group.add':
      assertFreshOwnerId(score, op, op.group.id)
      assertDestinationExists(score, op, op.group.destination)
      assertFreshDeviceIds(score, op, hostDevices(op.group))
      return { ...score, groups: insertAt(op, score.groups, { ...op.group }, op.index) }

    case 'group.remove': {
      const group = findGroup(score, op.id) ?? fail(op, `no group "${op.id}"`)
      const detached = detachAutomation(score, op.id, hostDevices(group))
      const reroute = <T extends ScoreStripHost | ScoreElementTrack>(host: T): T =>
        host.destination.kind === 'group' && host.destination.id === op.id
          ? { ...host, destination: group.destination }
          : host
      return {
        ...detached.score,
        tracks: detached.score.tracks.map(reroute),
        elementTracks: detached.score.elementTracks.map(reroute),
        groups: detached.score.groups.filter((candidate) => candidate !== group).map(reroute),
        returns: detached.score.returns.map(reroute),
      }
    }

    case 'group.move': {
      const from = score.groups.findIndex((group) => group.id === op.id)
      if (from === -1) fail(op, `no group "${op.id}"`)
      return { ...score, groups: moveTo(op, score.groups, from, op.index) }
    }

    case 'return.add':
      assertFreshOwnerId(score, op, op.return.id)
      assertDestinationExists(score, op, op.return.destination)
      assertFreshDeviceIds(score, op, hostDevices(op.return))
      return { ...score, returns: insertAt(op, score.returns, { ...op.return }, op.index) }

    case 'return.remove': {
      const ret = findReturn(score, op.id) ?? fail(op, `no return "${op.id}"`)
      const detached = detachAutomation(score, op.id, hostDevices(ret))
      const dropSends = <T extends ScoreStripHost>(host: T): T =>
        host.strip.sends.some((send) => send.target === op.id)
          ? {
              ...host,
              strip: {
                ...host.strip,
                sends: host.strip.sends.filter((send) => send.target !== op.id),
              },
            }
          : host
      return {
        ...detached.score,
        tracks: detached.score.tracks.map(dropSends),
        groups: detached.score.groups.map(dropSends),
        returns: detached.score.returns.filter((candidate) => candidate !== ret).map(dropSends),
      }
    }

    case 'return.move': {
      const from = score.returns.findIndex((ret) => ret.id === op.id)
      if (from === -1) fail(op, `no return "${op.id}"`)
      return { ...score, returns: moveTo(op, score.returns, from, op.index) }
    }

    case 'strip.rename': {
      const host = requireHost(score, op, op.id)
      return replaceHost(score, op.id, { ...host, name: op.name })
    }

    case 'strip.route': {
      const host = requireHost(score, op, op.id)
      assertDestinationExists(score, op, op.destination)
      assertNoRoutingLoop(score, op, op.id, op.destination)
      return replaceHost(score, op.id, { ...host, destination: op.destination })
    }

    case 'strip.set': {
      if (!Number.isFinite(op.value)) fail(op, 'value must be finite')
      if (op.owner === MASTER_OWNER) {
        if (op.param !== 'level') fail(op, 'the master only has a level')
        return { ...score, master: { ...score.master, level: Math.max(0, op.value) } }
      }
      const value = op.param === 'pan' ? Math.min(1, Math.max(-1, op.value)) : Math.max(0, op.value)
      return withStrip(score, op, op.owner, (strip) => ({ ...strip, [op.param]: value }))
    }

    case 'strip.mute':
      if (op.owner === MASTER_OWNER) fail(op, 'the master cannot be muted through the score')
      return withStrip(score, op, op.owner, (strip) => ({ ...strip, mute: op.mute }))

    case 'strip.solo':
      if (op.owner === MASTER_OWNER) fail(op, 'the master cannot be soloed')
      return withStrip(score, op, op.owner, (strip) => ({ ...strip, solo: op.solo }))

    case 'strip.soloSafe':
      if (op.owner === MASTER_OWNER) fail(op, 'the master has no solo state')
      return withStrip(score, op, op.owner, (strip) => ({ ...strip, soloSafe: op.soloSafe }))

    case 'clip.add': {
      const track = requireAudioTrack(score, op, op.track)
      if (track.clips.some((clip) => clip.id === op.clip.id)) {
        fail(op, `clip "${op.clip.id}" already exists on track "${track.id}"`)
      }
      if (!score.sources.some((source) => source.id === op.clip.sourceId)) {
        fail(op, `no source "${op.clip.sourceId}"`)
      }
      return replaceHost(score, track.id, {
        ...track,
        clips: sortClips([...track.clips, tidyClip(op.clip)]),
      })
    }

    case 'clip.remove': {
      const track = requireAudioTrack(score, op, op.track)
      requireClip(track, op, op.id)
      return replaceHost(score, track.id, {
        ...track,
        clips: track.clips.filter((clip) => clip.id !== op.id),
      })
    }

    case 'clip.move':
      return patchClip(score, op, op.track, op.id, { startSec: op.startSec })

    case 'clip.trim': {
      const patch: ClipPatch = {}
      if (op.startSec !== undefined) patch.startSec = op.startSec
      if (op.offsetSec !== undefined) patch.offsetSec = op.offsetSec
      if (op.durationSec !== undefined) patch.durationSec = op.durationSec
      return patchClip(score, op, op.track, op.id, patch)
    }

    case 'clip.update':
      if ('id' in op.patch) fail(op, 'a clip id cannot be changed')
      return patchClip(score, op, op.track, op.id, op.patch)

    case 'clip.replaceFrom': {
      const track = requireAudioTrack(score, op, op.track)
      const kept = track.clips.filter((clip) => clip.startSec < op.fromSec)
      const keptIds = new Set(kept.map((clip) => clip.id))
      for (const clip of op.clips) {
        if (clip.startSec < op.fromSec) fail(op, `clip "${clip.id}" starts before ${op.fromSec}`)
        if (keptIds.has(clip.id))
          fail(op, `clip "${clip.id}" is still on the track before ${op.fromSec}`)
        if (!score.sources.some((source) => source.id === clip.sourceId))
          fail(op, `no source "${clip.sourceId}"`)
        keptIds.add(clip.id)
      }
      return replaceHost(score, track.id, {
        ...track,
        clips: sortClips([...kept, ...op.clips.map(tidyClip)]),
      })
    }

    case 'device.add': {
      assertFreshDeviceIds(score, op, [op.device])
      const inserts = insertsOf(score, op, op.owner)
      return withInserts(
        score,
        op,
        op.owner,
        insertAt(op, inserts, { ...op.device, params: { ...op.device.params } }, op.index),
      )
    }

    case 'device.remove': {
      const location = findDevice(score, op.id) ?? fail(op, `no device "${op.id}"`)
      if (location.slot === 'device') {
        fail(
          op,
          `device "${op.id}" is the ${location.owner}'s own device; remove the track or return instead`,
        )
      }
      const detached = detachAutomation(score, null, [location.device])
      const inserts = insertsOf(detached.score, op, location.owner).filter(
        (device) => device.id !== op.id,
      )
      return withInserts(detached.score, op, location.owner, inserts)
    }

    case 'device.move': {
      const location = findDevice(score, op.id) ?? fail(op, `no device "${op.id}"`)
      if (location.slot === 'device') fail(op, `device "${op.id}" is not in an insert chain`)
      const inserts = insertsOf(score, op, location.owner)
      return withInserts(score, op, location.owner, moveTo(op, inserts, location.index, op.index))
    }

    case 'device.setParam': {
      if (!Number.isFinite(op.value)) fail(op, 'value must be finite')
      const device = requireDevice(score, op, op.device)
      return replaceDevice(score, op.device, {
        ...device,
        params: { ...device.params, [op.param]: op.value },
      })
    }

    case 'device.setParams': {
      const device = requireDevice(score, op, op.device)
      const params = { ...device.params }
      for (const [name, value] of Object.entries(op.params)) {
        if (value === null) delete params[name]
        else if (!Number.isFinite(value)) fail(op, `"${name}" must be finite`)
        else params[name] = value
      }
      return replaceDevice(score, op.device, { ...device, params })
    }

    case 'device.preset': {
      const device = requireDevice(score, op, op.device)
      const next: ScoreDevice = { ...device, params: { ...(op.params ?? {}) } }
      if (op.preset === null) delete next.preset
      else next.preset = op.preset
      return replaceDevice(score, op.device, next)
    }

    case 'device.bypass': {
      const device = requireDevice(score, op, op.device)
      return replaceDevice(score, op.device, { ...device, bypass: op.bypass })
    }

    case 'send.add': {
      if (op.owner === MASTER_OWNER) fail(op, 'the master has no sends')
      if (!findReturn(score, op.target)) fail(op, `no return "${op.target}"`)
      if (op.target === op.owner) fail(op, 'a return cannot send to itself')
      if (op.level !== null && !(op.level >= 0)) fail(op, 'level must be ≥ 0 or null')
      return withStrip(score, op, op.owner, (strip) => {
        if (strip.sends.some((send) => send.target === op.target)) {
          fail(op, `"${op.owner}" already sends to "${op.target}"`)
        }
        const send: ScoreSend = { target: op.target, level: op.level }
        return { ...strip, sends: insertAt(op, strip.sends, send, op.index) }
      })
    }

    case 'send.remove':
      return withStrip(score, op, op.owner, (strip) => {
        if (!strip.sends.some((send) => send.target === op.target)) {
          fail(op, `"${op.owner}" has no send to "${op.target}"`)
        }
        return { ...strip, sends: strip.sends.filter((send) => send.target !== op.target) }
      })

    case 'send.set':
      if (op.level !== null && !(op.level >= 0)) fail(op, 'level must be ≥ 0 or null')
      return withStrip(score, op, op.owner, (strip) => {
        if (!strip.sends.some((send) => send.target === op.target)) {
          fail(op, `"${op.owner}" has no send to "${op.target}"`)
        }
        return {
          ...strip,
          sends: strip.sends.map((send) =>
            send.target === op.target ? { ...send, level: op.level } : send,
          ),
        }
      })

    case 'lane.add': {
      if (score.lanes.some((lane) => lane.id === op.lane.id))
        fail(op, `lane "${op.lane.id}" already exists`)
      if (score.lanes.some((lane) => sameTarget(lane.target, op.lane.target))) {
        fail(op, `a lane already targets ${targetKey(op.lane.target)}`)
      }
      assertTargetExists(score, op, op.lane.target)
      const lane: ScoreLane = { ...op.lane, breakpoints: sortBreakpoints(op.lane.breakpoints) }
      return { ...score, lanes: insertAt(op, score.lanes, lane, op.index) }
    }

    case 'lane.remove':
      requireLane(score, op, op.id)
      return { ...score, lanes: score.lanes.filter((lane) => lane.id !== op.id) }

    case 'lane.setBreakpoints': {
      const lane = requireLane(score, op, op.id)
      const next = { ...lane, breakpoints: sortBreakpoints(op.breakpoints) }
      return {
        ...score,
        lanes: score.lanes.map((candidate) => (candidate === lane ? next : candidate)),
      }
    }

    case 'lane.addBreakpoint': {
      const lane = requireLane(score, op, op.id)
      if (!Number.isFinite(op.breakpoint.timeSec)) fail(op, 'timeSec must be finite')
      const next = { ...lane, breakpoints: sortBreakpoints([...lane.breakpoints, op.breakpoint]) }
      return {
        ...score,
        lanes: score.lanes.map((candidate) => (candidate === lane ? next : candidate)),
      }
    }

    case 'lane.removeBreakpoint': {
      const lane = requireLane(score, op, op.id)
      if (!lane.breakpoints.some((point) => point.timeSec === op.timeSec)) {
        fail(op, `lane "${op.id}" has no breakpoint at ${op.timeSec}`)
      }
      const next = {
        ...lane,
        breakpoints: lane.breakpoints.filter((point) => point.timeSec !== op.timeSec),
      }
      return {
        ...score,
        lanes: score.lanes.map((candidate) => (candidate === lane ? next : candidate)),
      }
    }

    case 'modulator.add':
      if (score.modulators.some((modulator) => modulator.id === op.modulator.id)) {
        fail(op, `modulator "${op.modulator.id}" already exists`)
      }
      return { ...score, modulators: insertAt(op, score.modulators, { ...op.modulator }, op.index) }

    case 'modulator.remove': {
      requireModulator(score, op, op.id)
      return {
        ...score,
        modulators: score.modulators.filter((modulator) => modulator.id !== op.id),
        routes: score.routes.filter((route) => route.source !== op.id),
      }
    }

    case 'modulator.update': {
      const modulator = requireModulator(score, op, op.id)
      const next = patchModulator(op, modulator, op.patch)
      return {
        ...score,
        modulators: score.modulators.map((candidate) =>
          candidate === modulator ? next : candidate,
        ),
      }
    }

    case 'route.add': {
      if (score.routes.some((route) => route.id === op.route.id))
        fail(op, `route "${op.route.id}" already exists`)
      requireModulator(score, op, op.route.source)
      assertTargetExists(score, op, op.route.target)
      return { ...score, routes: insertAt(op, score.routes, { ...op.route }, op.index) }
    }

    case 'route.remove':
      requireRoute(score, op, op.id)
      return { ...score, routes: score.routes.filter((route) => route.id !== op.id) }

    case 'route.update': {
      const route = requireRoute(score, op, op.id)
      const next = { ...route }
      if (op.depth !== undefined) next.depth = Math.min(1, Math.max(-1, op.depth))
      if (op.polarity !== undefined) next.polarity = op.polarity
      return {
        ...score,
        routes: score.routes.map((candidate) => (candidate === route ? next : candidate)),
      }
    }

    case 'transport.quantize':
      if (!isLaunchQuantize(op.quantize)) {
        fail(op, 'quantize must be none, bar, beat, a positive bar count or { seconds > 0 }')
      }
      return { ...score, transport: { ...score.transport, quantize: op.quantize } }

    case 'scene.add':
      if (findScene(score, op.scene.id)) fail(op, `scene "${op.scene.id}" already exists`)
      return {
        ...score,
        scenes: insertAt(op, score.scenes, { id: op.scene.id, name: op.scene.name }, op.index),
      }

    case 'scene.remove': {
      const scene = requireScene(score, op, op.id)
      const detached = detachSlots(score, (slot) => slot.scene === op.id).score
      return { ...detached, scenes: score.scenes.filter((candidate) => candidate !== scene) }
    }

    case 'scene.move': {
      const from = score.scenes.findIndex((scene) => scene.id === op.id)
      if (from === -1) fail(op, `no scene "${op.id}"`)
      return { ...score, scenes: moveTo(op, score.scenes, from, op.index) }
    }

    case 'scene.rename': {
      const scene = requireScene(score, op, op.id)
      return {
        ...score,
        scenes: score.scenes.map((candidate) =>
          candidate === scene ? { ...scene, name: op.name } : candidate,
        ),
      }
    }

    case 'slot.add': {
      if (findSlot(score, op.slot.id)) fail(op, `slot "${op.slot.id}" already exists`)
      assertSlotCell(score, op, op.slot)
      assertSlotSettings(score, op, op.slot)
      return { ...score, slots: insertAt(op, score.slots, normaliseSlot(op.slot), op.index) }
    }

    case 'slot.remove':
      requireSlot(score, op, op.id)
      return { ...score, slots: score.slots.filter((slot) => slot.id !== op.id) }

    case 'slot.update': {
      const slot = requireSlot(score, op, op.id)
      if ('id' in op.patch) fail(op, 'a slot id cannot be changed')
      const next: ScoreSlot = { ...slot }
      if (op.patch.track !== undefined) next.track = op.patch.track
      if (op.patch.scene !== undefined) next.scene = op.patch.scene
      if (op.patch.clip !== undefined) next.clip = op.patch.clip
      if (op.patch.launchMode !== undefined) next.launchMode = op.patch.launchMode
      if (op.patch.legato !== undefined) next.legato = op.patch.legato
      if (op.patch.quantize !== undefined) {
        if (op.patch.quantize === null) delete next.quantize
        else next.quantize = op.patch.quantize
      }
      if (op.patch.follow !== undefined) {
        if (op.patch.follow === null) delete next.follow
        else next.follow = op.patch.follow
      }
      assertSlotCell(score, op, next)
      assertSlotSettings(score, op, next)
      return {
        ...score,
        slots: score.slots.map((candidate) =>
          candidate === slot ? normaliseSlot(next) : candidate,
        ),
      }
    }

    case 'batch':
      return op.ops.reduce((current, child) => apply(current, child), score)

    case 'score.replace': {
      const issues = validateScore(op.score)
      if (issues.length > 0) fail(op, `${issues[0].path || 'score'}: ${issues[0].message}`)
      return normaliseScore(op.score)
    }

    default: {
      const exhaustive: never = op
      return exhaustive
    }
  }
}

function assertTargetExists(score: Score, op: Operation, target: ParamTarget): void {
  switch (target.kind) {
    case 'strip':
      if (target.owner === MASTER_OWNER) {
        if (target.param !== 'level') fail(op, 'the master only has a level')
        return
      }
      requireHost(score, op, target.owner)
      return
    case 'device':
      requireDevice(score, op, target.device)
      return
    default: {
      const exhaustive: never = target
      return exhaustive
    }
  }
}

function patchClip(
  score: Score,
  op: Operation,
  trackId: string,
  clipId: string,
  patch: ClipPatch,
): Score {
  const track = requireAudioTrack(score, op, trackId)
  const clip = requireClip(track, op, clipId)
  if (
    patch.sourceId !== undefined &&
    !score.sources.some((source) => source.id === patch.sourceId)
  ) {
    fail(op, `no source "${patch.sourceId}"`)
  }
  const next = tidyClip({ ...clip, ...patch })
  return replaceHost(score, track.id, {
    ...track,
    clips: sortClips(track.clips.map((candidate) => (candidate === clip ? next : candidate))),
  })
}

// --- invert -------------------------------------------------------------------------------

/**
 * The operation that undoes `op` once it has been applied to `score`
 * (`score` is the document *before* `op`). Removals invert to a `batch`
 * that restores the item and everything the removal cascaded onto.
 */
export function invert(score: Score, op: Operation): Operation {
  switch (op.type) {
    case 'score.rename':
      return { type: 'score.rename', name: score.name }

    case 'transport.loop': {
      const inverse: Operation = { type: 'transport.loop' }
      if (op.enabled !== undefined) inverse.enabled = score.transport.loop.enabled
      if (op.lengthSec !== undefined) inverse.lengthSec = score.transport.loop.lengthSec
      return inverse
    }

    case 'tempo.set':
      return { type: 'tempo.set', segments: score.tempo.map((segment) => ({ ...segment })) }

    case 'elementTrack.add':
      return { type: 'elementTrack.remove', id: op.track.id }

    case 'elementTrack.remove': {
      const index = score.elementTracks.findIndex((track) => track.id === op.id)
      if (index === -1) fail(op, `no element track "${op.id}"`)
      return { type: 'elementTrack.add', track: score.elementTracks[index], index }
    }

    case 'elementTrack.route': {
      const track = requireElementTrack(score, op, op.id)
      return { type: 'elementTrack.route', id: op.id, destination: track.destination }
    }

    case 'elementTrack.setClips': {
      const track = requireElementTrack(score, op, op.id)
      return { type: 'elementTrack.setClips', id: op.id, clips: [...track.clips] }
    }

    case 'source.add':
      return { type: 'source.remove', id: op.source.id }

    case 'source.remove': {
      const index = score.sources.findIndex((source) => source.id === op.id)
      if (index === -1) fail(op, `no source "${op.id}"`)
      return { type: 'source.add', source: score.sources[index], index }
    }

    case 'track.add':
      return { type: 'track.remove', id: op.track.id }

    case 'track.remove': {
      const index = score.tracks.findIndex((track) => track.id === op.id)
      if (index === -1) fail(op, `no track "${op.id}"`)
      const track = score.tracks[index]
      const detached = detachAutomation(score, op.id, hostDevices(track))
      const slots = detachSlots(score, (slot) => slot.track === op.id).slots
      return batchOf(op, [
        { type: 'track.add', track, index },
        ...reattachOps(detached.lanes, detached.routes),
        ...reattachSlotOps(slots),
      ])
    }

    case 'track.move': {
      const index = score.tracks.findIndex((track) => track.id === op.id)
      if (index === -1) fail(op, `no track "${op.id}"`)
      return { type: 'track.move', id: op.id, index }
    }

    case 'group.add':
      return { type: 'group.remove', id: op.group.id }

    case 'group.remove': {
      const index = score.groups.findIndex((group) => group.id === op.id)
      if (index === -1) fail(op, `no group "${op.id}"`)
      const group = score.groups[index]
      const detached = detachAutomation(score, op.id, hostDevices(group))
      const members: Operation[] = [...score.tracks, ...score.groups, ...score.returns]
        .filter((host) => host.destination.kind === 'group' && host.destination.id === op.id)
        .map((host) => ({
          type: 'strip.route',
          id: host.id,
          destination: { kind: 'group', id: op.id },
        }))
      const elementMembers: Operation[] = score.elementTracks
        .filter((track) => track.destination.kind === 'group' && track.destination.id === op.id)
        .map((track) => ({
          type: 'elementTrack.route',
          id: track.id,
          destination: { kind: 'group', id: op.id },
        }))
      return batchOf(op, [
        { type: 'group.add', group, index },
        ...members,
        ...elementMembers,
        ...reattachOps(detached.lanes, detached.routes),
      ])
    }

    case 'group.move': {
      const index = score.groups.findIndex((group) => group.id === op.id)
      if (index === -1) fail(op, `no group "${op.id}"`)
      return { type: 'group.move', id: op.id, index }
    }

    case 'return.add':
      return { type: 'return.remove', id: op.return.id }

    case 'return.remove': {
      const index = score.returns.findIndex((ret) => ret.id === op.id)
      if (index === -1) fail(op, `no return "${op.id}"`)
      const ret = score.returns[index]
      const detached = detachAutomation(score, op.id, hostDevices(ret))
      const sends: Operation[] = []
      for (const host of [...score.tracks, ...score.groups, ...score.returns]) {
        host.strip.sends.forEach((send, sendIndex) => {
          if (send.target === op.id) {
            sends.push({
              type: 'send.add',
              owner: host.id,
              target: op.id,
              level: send.level,
              index: sendIndex,
            })
          }
        })
      }
      return batchOf(op, [
        { type: 'return.add', return: ret, index },
        ...sends,
        ...reattachOps(detached.lanes, detached.routes),
      ])
    }

    case 'return.move': {
      const index = score.returns.findIndex((ret) => ret.id === op.id)
      if (index === -1) fail(op, `no return "${op.id}"`)
      return { type: 'return.move', id: op.id, index }
    }

    case 'strip.rename':
      return { type: 'strip.rename', id: op.id, name: requireHost(score, op, op.id).name }

    case 'strip.route':
      return {
        type: 'strip.route',
        id: op.id,
        destination: requireHost(score, op, op.id).destination,
      }

    case 'strip.set': {
      if (op.owner === MASTER_OWNER)
        return { type: 'strip.set', owner: op.owner, param: 'level', value: score.master.level }
      const strip = requireHost(score, op, op.owner).strip
      return { type: 'strip.set', owner: op.owner, param: op.param, value: strip[op.param] }
    }

    case 'strip.mute':
      return {
        type: 'strip.mute',
        owner: op.owner,
        mute: requireHost(score, op, op.owner).strip.mute,
      }

    case 'strip.solo':
      return {
        type: 'strip.solo',
        owner: op.owner,
        solo: requireHost(score, op, op.owner).strip.solo,
      }

    case 'strip.soloSafe':
      return {
        type: 'strip.soloSafe',
        owner: op.owner,
        soloSafe: requireHost(score, op, op.owner).strip.soloSafe,
      }

    case 'clip.add':
      return { type: 'clip.remove', track: op.track, id: op.clip.id }

    case 'clip.remove': {
      const track = requireAudioTrack(score, op, op.track)
      return { type: 'clip.add', track: op.track, clip: requireClip(track, op, op.id) }
    }

    case 'clip.move': {
      const track = requireAudioTrack(score, op, op.track)
      return {
        type: 'clip.move',
        track: op.track,
        id: op.id,
        startSec: requireClip(track, op, op.id).startSec,
      }
    }

    case 'clip.trim': {
      const track = requireAudioTrack(score, op, op.track)
      const clip = requireClip(track, op, op.id)
      const inverse: Operation = { type: 'clip.trim', track: op.track, id: op.id }
      if (op.startSec !== undefined) inverse.startSec = clip.startSec
      if (op.offsetSec !== undefined) inverse.offsetSec = clip.offsetSec
      if (op.durationSec !== undefined) inverse.durationSec = clip.durationSec
      return inverse
    }

    case 'clip.update': {
      const track = requireAudioTrack(score, op, op.track)
      const clip = requireClip(track, op, op.id)
      const patch: Record<string, unknown> = {}
      for (const key of Object.keys(op.patch) as (keyof ClipPatch)[]) {
        patch[key] = key === 'loop' ? (clip.loop ?? false) : clip[key]
      }
      return { type: 'clip.update', track: op.track, id: op.id, patch: patch }
    }

    case 'clip.replaceFrom': {
      const track = requireAudioTrack(score, op, op.track)
      const removed = track.clips.filter((clip) => clip.startSec >= op.fromSec)
      return { type: 'clip.replaceFrom', track: op.track, fromSec: op.fromSec, clips: removed }
    }

    case 'device.add':
      return { type: 'device.remove', id: op.device.id }

    case 'device.remove': {
      const location = findDevice(score, op.id) ?? fail(op, `no device "${op.id}"`)
      const detached = detachAutomation(score, null, [location.device])
      return batchOf(op, [
        {
          type: 'device.add',
          owner: location.owner,
          device: location.device,
          index: location.index,
        },
        ...reattachOps(detached.lanes, detached.routes),
      ])
    }

    case 'device.move': {
      const location = findDevice(score, op.id) ?? fail(op, `no device "${op.id}"`)
      return { type: 'device.move', id: op.id, index: location.index }
    }

    case 'device.setParam': {
      const device = requireDevice(score, op, op.device)
      const previous = device.params[op.param]
      if (previous === undefined)
        return { type: 'device.setParams', device: op.device, params: { [op.param]: null } }
      return { type: 'device.setParam', device: op.device, param: op.param, value: previous }
    }

    case 'device.setParams': {
      const device = requireDevice(score, op, op.device)
      const params: Record<string, number | null> = {}
      for (const name of Object.keys(op.params)) params[name] = device.params[name] ?? null
      return { type: 'device.setParams', device: op.device, params }
    }

    case 'device.preset': {
      const device = requireDevice(score, op, op.device)
      return {
        type: 'device.preset',
        device: op.device,
        preset: device.preset ?? null,
        params: { ...device.params },
      }
    }

    case 'device.bypass':
      return {
        type: 'device.bypass',
        device: op.device,
        bypass: requireDevice(score, op, op.device).bypass,
      }

    case 'send.add':
      return { type: 'send.remove', owner: op.owner, target: op.target }

    case 'send.remove': {
      const strip = requireHost(score, op, op.owner).strip
      const index = strip.sends.findIndex((send) => send.target === op.target)
      if (index === -1) fail(op, `"${op.owner}" has no send to "${op.target}"`)
      return {
        type: 'send.add',
        owner: op.owner,
        target: op.target,
        level: strip.sends[index].level,
        index,
      }
    }

    case 'send.set': {
      const strip = requireHost(score, op, op.owner).strip
      const send = strip.sends.find((candidate) => candidate.target === op.target)
      if (!send) fail(op, `"${op.owner}" has no send to "${op.target}"`)
      return { type: 'send.set', owner: op.owner, target: op.target, level: send.level }
    }

    case 'lane.add':
      return { type: 'lane.remove', id: op.lane.id }

    case 'lane.remove': {
      const index = score.lanes.findIndex((lane) => lane.id === op.id)
      if (index === -1) fail(op, `no lane "${op.id}"`)
      return { type: 'lane.add', lane: score.lanes[index], index }
    }

    case 'lane.setBreakpoints':
      return {
        type: 'lane.setBreakpoints',
        id: op.id,
        breakpoints: requireLane(score, op, op.id).breakpoints,
      }

    case 'lane.addBreakpoint': {
      const lane = requireLane(score, op, op.id)
      const replaced = lane.breakpoints.find((point) => point.timeSec === op.breakpoint.timeSec)
      if (replaced) return { type: 'lane.addBreakpoint', id: op.id, breakpoint: replaced }
      return { type: 'lane.removeBreakpoint', id: op.id, timeSec: op.breakpoint.timeSec }
    }

    case 'lane.removeBreakpoint': {
      const lane = requireLane(score, op, op.id)
      const point = lane.breakpoints.find((candidate) => candidate.timeSec === op.timeSec)
      if (!point) fail(op, `lane "${op.id}" has no breakpoint at ${op.timeSec}`)
      return { type: 'lane.addBreakpoint', id: op.id, breakpoint: point }
    }

    case 'modulator.add':
      return { type: 'modulator.remove', id: op.modulator.id }

    case 'modulator.remove': {
      const index = score.modulators.findIndex((modulator) => modulator.id === op.id)
      if (index === -1) fail(op, `no modulator "${op.id}"`)
      const routes = indexed(score.routes, (route) => route.source === op.id)
      return batchOf(op, [
        { type: 'modulator.add', modulator: score.modulators[index], index },
        ...routes.map((entry): Operation => ({
          type: 'route.add',
          route: entry.item,
          index: entry.index,
        })),
      ])
    }

    case 'modulator.update': {
      const modulator = requireModulator(score, op, op.id) as ScoreModulator &
        Record<string, unknown>
      const patch: Record<string, unknown> = {}
      for (const key of Object.keys(op.patch)) patch[key] = modulator[key]
      return { type: 'modulator.update', id: op.id, patch: patch }
    }

    case 'route.add':
      return { type: 'route.remove', id: op.route.id }

    case 'route.remove': {
      const index = score.routes.findIndex((route) => route.id === op.id)
      if (index === -1) fail(op, `no route "${op.id}"`)
      return { type: 'route.add', route: score.routes[index], index }
    }

    case 'route.update': {
      const route = requireRoute(score, op, op.id)
      const inverse: Operation = { type: 'route.update', id: op.id }
      if (op.depth !== undefined) inverse.depth = route.depth
      if (op.polarity !== undefined) inverse.polarity = route.polarity
      return inverse
    }

    case 'transport.quantize':
      return { type: 'transport.quantize', quantize: score.transport.quantize }

    case 'scene.add':
      return { type: 'scene.remove', id: op.scene.id }

    case 'scene.remove': {
      const index = score.scenes.findIndex((scene) => scene.id === op.id)
      if (index === -1) fail(op, `no scene "${op.id}"`)
      const slots = detachSlots(score, (slot) => slot.scene === op.id).slots
      return batchOf(op, [
        { type: 'scene.add', scene: score.scenes[index], index },
        ...reattachSlotOps(slots),
      ])
    }

    case 'scene.move': {
      const index = score.scenes.findIndex((scene) => scene.id === op.id)
      if (index === -1) fail(op, `no scene "${op.id}"`)
      return { type: 'scene.move', id: op.id, index }
    }

    case 'scene.rename':
      return { type: 'scene.rename', id: op.id, name: requireScene(score, op, op.id).name }

    case 'slot.add':
      return { type: 'slot.remove', id: op.slot.id }

    case 'slot.remove': {
      const index = score.slots.findIndex((slot) => slot.id === op.id)
      if (index === -1) fail(op, `no slot "${op.id}"`)
      return { type: 'slot.add', slot: score.slots[index], index }
    }

    case 'slot.update': {
      const slot = requireSlot(score, op, op.id)
      const patch: SlotPatch = {}
      if (op.patch.track !== undefined) patch.track = slot.track
      if (op.patch.scene !== undefined) patch.scene = slot.scene
      if (op.patch.clip !== undefined) patch.clip = slot.clip
      if (op.patch.launchMode !== undefined) patch.launchMode = slot.launchMode
      if (op.patch.legato !== undefined) patch.legato = slot.legato
      if (op.patch.quantize !== undefined) patch.quantize = slot.quantize ?? null
      if (op.patch.follow !== undefined) patch.follow = slot.follow ?? null
      return { type: 'slot.update', id: op.id, patch }
    }

    case 'batch': {
      const inverses: Operation[] = []
      let current = score
      for (const child of op.ops) {
        inverses.unshift(invert(current, child))
        current = apply(current, child)
      }
      const inverse: Operation = { type: 'batch', ops: inverses }
      if (op.label !== undefined) inverse.label = op.label
      return inverse
    }

    case 'score.replace': {
      const inverse: Operation = { type: 'score.replace', score }
      if (op.label !== undefined) inverse.label = op.label
      return inverse
    }

    default: {
      const exhaustive: never = op
      return exhaustive
    }
  }
}

/** A cascade inverse collapses to its single member when nothing cascaded. */
function batchOf(op: Operation, ops: Operation[]): Operation {
  if (ops.length === 1) return ops[0]
  return { type: 'batch', ops, label: `undo ${op.type}` }
}

export interface Applied {
  score: Score
  inverse: Operation
}

/** `apply` and `invert` in one step, computed against the same pre-state. */
export function applyWithInverse(score: Score, op: Operation): Applied {
  const inverse = invert(score, op)
  return { score: apply(score, op), inverse }
}

/** Short human label for history lists and transcripts. */
export function describeOperation(op: Operation): string {
  switch (op.type) {
    case 'score.rename':
      return `rename score to "${op.name}"`
    case 'transport.loop':
      return 'change loop'
    case 'tempo.set':
      return 'set tempo'
    case 'elementTrack.add':
      return `add element track ${op.track.id}`
    case 'elementTrack.remove':
      return `remove element track ${op.id}`
    case 'elementTrack.route':
      return `route element track ${op.id}`
    case 'elementTrack.setClips':
      return `set clips on ${op.id}`
    case 'source.add':
      return `add source ${op.source.id}`
    case 'source.remove':
      return `remove source ${op.id}`
    case 'track.add':
      return `add ${op.track.kind} track ${op.track.id}`
    case 'track.remove':
      return `remove track ${op.id}`
    case 'track.move':
      return `move track ${op.id}`
    case 'group.add':
      return `add group ${op.group.id}`
    case 'group.remove':
      return `remove group ${op.id}`
    case 'group.move':
      return `move group ${op.id}`
    case 'return.add':
      return `add return ${op.return.id}`
    case 'return.remove':
      return `remove return ${op.id}`
    case 'return.move':
      return `move return ${op.id}`
    case 'strip.rename':
      return `rename ${op.id} to "${op.name}"`
    case 'strip.route':
      return `route ${op.id} to ${op.destination.kind === 'group' ? op.destination.id : 'master'}`
    case 'strip.set':
      return `${op.owner} ${op.param} → ${op.value}`
    case 'strip.mute':
      return `${op.mute ? 'mute' : 'unmute'} ${op.owner}`
    case 'strip.solo':
      return `${op.solo ? 'solo' : 'unsolo'} ${op.owner}`
    case 'strip.soloSafe':
      return `${op.owner} solo-safe ${op.soloSafe ? 'on' : 'off'}`
    case 'clip.add':
      return `add clip ${op.clip.id} to ${op.track}`
    case 'clip.remove':
      return `remove clip ${op.id} from ${op.track}`
    case 'clip.move':
      return `move clip ${op.id} to ${op.startSec}s`
    case 'clip.trim':
      return `trim clip ${op.id}`
    case 'clip.update':
      return `edit clip ${op.id}`
    case 'clip.replaceFrom':
      return `replace ${op.track} from ${op.fromSec}s`
    case 'device.add':
      return `add ${op.device.deviceId} to ${op.owner}`
    case 'device.remove':
      return `remove device ${op.id}`
    case 'device.move':
      return `move device ${op.id}`
    case 'device.setParam':
      return `${op.device} ${op.param} → ${op.value}`
    case 'device.setParams':
      return `set ${op.device} params`
    case 'device.preset':
      return op.preset === null ? `clear ${op.device} preset` : `${op.device} preset "${op.preset}"`
    case 'device.bypass':
      return `${op.bypass ? 'bypass' : 'enable'} ${op.device}`
    case 'send.add':
      return `send ${op.owner} → ${op.target}`
    case 'send.remove':
      return `remove send ${op.owner} → ${op.target}`
    case 'send.set':
      return `send ${op.owner} → ${op.target} level ${op.level ?? 'direct'}`
    case 'lane.add':
      return `add lane ${op.lane.id}`
    case 'lane.remove':
      return `remove lane ${op.id}`
    case 'lane.setBreakpoints':
      return `edit lane ${op.id}`
    case 'lane.addBreakpoint':
      return `add breakpoint to ${op.id}`
    case 'lane.removeBreakpoint':
      return `remove breakpoint from ${op.id}`
    case 'modulator.add':
      return `add ${op.modulator.kind} ${op.modulator.id}`
    case 'modulator.remove':
      return `remove modulator ${op.id}`
    case 'modulator.update':
      return `edit modulator ${op.id}`
    case 'route.add':
      return `route ${op.route.source} → ${targetKey(op.route.target)}`
    case 'route.remove':
      return `remove route ${op.id}`
    case 'route.update':
      return `edit route ${op.id}`
    case 'transport.quantize':
      return `launch quantisation ${describeQuantize(op.quantize)}`
    case 'scene.add':
      return `add scene ${op.scene.id}`
    case 'scene.remove':
      return `remove scene ${op.id}`
    case 'scene.move':
      return `move scene ${op.id}`
    case 'scene.rename':
      return `rename scene ${op.id} to "${op.name}"`
    case 'slot.add':
      return `add slot ${op.slot.id} at ${op.slot.track} × ${op.slot.scene}`
    case 'slot.remove':
      return `remove slot ${op.id}`
    case 'slot.update':
      return op.patch.follow
        ? `slot ${op.id} follow: ${describeFollowAction(op.patch.follow)}`
        : `edit slot ${op.id}`
    case 'batch':
      return op.label ?? `${op.ops.length} operations`
    case 'score.replace':
      return op.label ?? `replace score with "${op.score.name}"`
    default: {
      const exhaustive: never = op
      return exhaustive
    }
  }
}
