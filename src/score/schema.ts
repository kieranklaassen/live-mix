// The score: a declarative, serialisable, seconds-first document that is the
// source of truth for arrangement, automation and device graphs (KTD8,
// KTD16 approach C). Everything the engine plays from a document lives here:
// tracks (audio, live input, instrument), groups, returns, their strips with
// inserts and sends, clips on a timeline, automation lanes, modulators and
// modulation routes, master settings and the transport loop.
//
// What is *not* in the score: the audio of a live input (declared, never
// rendered — the app attaches the stream), the phase an `ExternalPhase`
// modulator is driven with, and the engine's own clock. Those are live.
//
// The document is plain JSON with a format version. `parseScore` validates
// and normalises (defaults filled, lists copied) so every consumer of a
// `Score` may rely on the full shape; `serializeScore` is its inverse and is
// stable (same score → same string) so documents diff well in git.

import { type Clip } from '../core/clips/Clip'
import { type LfoShape } from '../core/automation/Modulator'
import { type ModPolarity } from '../core/automation/ModMatrix'
import { type Breakpoint, type LaneCurve } from '../core/automation/ParamLane'
import { type DeviceRegistry } from '../core/devices/registry'
import { isFollowAction, normaliseFollowAction } from '../core/session/followActions'
import {
  DEFAULT_LAUNCH_QUANTIZE,
  isLaunchQuantize,
  type LaunchQuantize,
} from '../core/session/launch'
import { type ScoreScene } from '../core/session/Scene'
import { LAUNCH_MODES, type ScoreSlot, type SlotClip } from '../core/session/Slot'

/**
 * 1: the U28 document. 2 (U31): `scenes`, `slots` and `transport.quantize`
 * for the session grid; `migrateScore` brings 1 up with empty lists and the
 * default quantisation.
 */
export const SCORE_FORMAT_VERSION = 2

/** Reserved owner id for the master bus in operations and parameter targets. */
export const MASTER_OWNER = 'master'

// --- Document types -----------------------------------------------------------------

/** Where a strip's output goes: the master or a group (by id). */
export type ScoreDestination = { kind: 'master' } | { kind: 'group'; id: string }

/** A device instance in a chain: the registry id plus its state. */
export interface ScoreDevice {
  /** Instance id, unique across the whole score (lanes and routes address it). */
  id: string
  /** `DeviceDescriptor.id` in the registry, e.g. `'filter'`. */
  deviceId: string
  /** A factory preset by name; `params` overlay it. */
  preset?: string
  /** Explicit parameter values; anything omitted follows the preset or the spec default. */
  params: Record<string, number>
  bypass: boolean
}

export interface ScoreSend {
  /** Return id. */
  target: string
  /** Send level; `null` is a direct connection (the return sets the level). */
  level: number | null
}

/** Fader, pan, trim, mute/solo, inserts and post-fader sends of one strip. */
export interface ScoreStrip {
  level: number
  pan: number
  inputGain: number
  mute: boolean
  solo: boolean
  soloSafe: boolean
  inserts: ScoreDevice[]
  sends: ScoreSend[]
}

/** A decoded sample the clips reference; `url` lets the renderer load it on demand. */
export interface ScoreSource {
  id: string
  url?: string
  durationSec?: number
  /** Server analysis (LUFS, key, BPM, …) carried with the document. */
  analysis?: Record<string, unknown>
}

interface ScoreStripOwner {
  id: string
  name: string
  destination: ScoreDestination
  strip: ScoreStrip
}

export interface ScoreAudioTrack extends ScoreStripOwner {
  kind: 'audio'
  lookaheadSec?: number
  preloadSec?: number
  clips: Clip[]
}

/** Declared so its strip, sends and routing are in the document; its audio is live. */
export interface ScoreLiveTrack extends ScoreStripOwner {
  kind: 'live'
}

export interface ScoreInstrumentTrack extends ScoreStripOwner {
  kind: 'instrument'
  device: ScoreDevice
}

export type ScoreTrack = ScoreAudioTrack | ScoreLiveTrack | ScoreInstrumentTrack
export type ScoreTrackKind = ScoreTrack['kind']

export interface ScoreGroup extends ScoreStripOwner {}

export interface ScoreReturn extends ScoreStripOwner {
  device: ScoreDevice
}

export interface ScoreMaster {
  level: number
  inserts: ScoreDevice[]
}

export interface ScoreTransport {
  loop: {
    enabled: boolean
    /** Loop length; `null` is no end (JSON has no Infinity). */
    lengthSec: number | null
  }
  /** Global launch quantisation for the session grid; a slot may override it. */
  quantize: LaunchQuantize
}

export type StripParam = 'level' | 'pan' | 'inputGain'

/** What a lane or a modulation route drives. */
export type ParamTarget =
  | { kind: 'strip'; owner: string; param: StripParam }
  | { kind: 'device'; device: string; param: string }

export interface ScoreLane {
  id: string
  target: ParamTarget
  /** Value the lane yields while it has no breakpoints. */
  defaultValue?: number
  breakpoints: Breakpoint[]
}

export type ScoreModulator =
  | { id: string; kind: 'lfo'; rateHz: number; shape: LfoShape; depth: number; phase: number }
  | { id: string; kind: 'random'; rateHz: number; seed: number; smooth: boolean }
  | { id: string; kind: 'macro'; value: number }
  | { id: string; kind: 'external-phase'; phaseOffset: number; depth: number; shape: LfoShape }

export type ScoreModulatorKind = ScoreModulator['kind']

export interface ScoreModRoute {
  id: string
  /** Modulator id. */
  source: string
  target: ParamTarget
  /** −1..1 fraction of the target range. */
  depth: number
  polarity: ModPolarity
}

export interface Score {
  format: typeof SCORE_FORMAT_VERSION
  id: string
  name: string
  transport: ScoreTransport
  master: ScoreMaster
  sources: ScoreSource[]
  tracks: ScoreTrack[]
  groups: ScoreGroup[]
  returns: ScoreReturn[]
  lanes: ScoreLane[]
  modulators: ScoreModulator[]
  routes: ScoreModRoute[]
  /** Session grid rows (U31). */
  scenes: ScoreScene[]
  /** Session grid cells: one per audio track × scene that holds a clip or a stop. */
  slots: ScoreSlot[]
}

// --- Defaults -----------------------------------------------------------------------

/** Range a modulation route spans on a strip parameter (a fader has no spec). */
export const STRIP_PARAM_RANGES: Readonly<Record<StripParam, readonly [number, number]>> = {
  level: [0, 2],
  pan: [-1, 1],
  inputGain: [0, 2],
}

export const STRIP_PARAMS: readonly StripParam[] = ['level', 'pan', 'inputGain']

const LFO_SHAPES: readonly LfoShape[] = ['sine', 'triangle', 'saw', 'square']
const LANE_CURVES: readonly LaneCurve[] = ['step', 'linear', 'exponential', 'smooth']
const POLARITIES: readonly ModPolarity[] = ['unipolar', 'bipolar']
const TRACK_KINDS: readonly ScoreTrackKind[] = ['audio', 'live', 'instrument']
const MODULATOR_KINDS: readonly ScoreModulatorKind[] = ['lfo', 'random', 'macro', 'external-phase']

/** A strip at unity: no nodes are created for it when rendered. */
export function defaultStrip(overrides: Partial<ScoreStrip> = {}): ScoreStrip {
  return {
    level: 1,
    pan: 0,
    inputGain: 1,
    mute: false,
    solo: false,
    soloSafe: false,
    inserts: [],
    sends: [],
    ...overrides,
  }
}

export function masterDestination(): ScoreDestination {
  return { kind: 'master' }
}

export function groupDestination(id: string): ScoreDestination {
  return { kind: 'group', id }
}

export interface CreateScoreOptions {
  id?: string
  name?: string
}

/** An empty document: master at unity, loop off, nothing else. */
export function createScore(options: CreateScoreOptions = {}): Score {
  return {
    format: SCORE_FORMAT_VERSION,
    id: options.id ?? 'score',
    name: options.name ?? '',
    transport: { loop: { enabled: false, lengthSec: null }, quantize: DEFAULT_LAUNCH_QUANTIZE },
    master: { level: 1, inserts: [] },
    sources: [],
    tracks: [],
    groups: [],
    returns: [],
    lanes: [],
    modulators: [],
    routes: [],
    scenes: [],
    slots: [],
  }
}

// --- Lookups ------------------------------------------------------------------------

/** Anything with a strip: tracks, groups and returns. */
export type ScoreStripHost = ScoreTrack | ScoreGroup | ScoreReturn

export function findTrack(score: Score, id: string): ScoreTrack | undefined {
  return score.tracks.find((track) => track.id === id)
}

export function findGroup(score: Score, id: string): ScoreGroup | undefined {
  return score.groups.find((group) => group.id === id)
}

export function findReturn(score: Score, id: string): ScoreReturn | undefined {
  return score.returns.find((ret) => ret.id === id)
}

/** The track, group or return with this id. */
export function findStripHost(score: Score, id: string): ScoreStripHost | undefined {
  return findTrack(score, id) ?? findGroup(score, id) ?? findReturn(score, id)
}

/** Every strip host in document order: tracks, groups, returns. */
export function stripHosts(score: Score): ScoreStripHost[] {
  return [...score.tracks, ...score.groups, ...score.returns]
}

export interface DeviceLocation {
  /** Track/group/return id, or `'master'`. */
  owner: string
  /** `'insert'` for strip and master chains; `'device'` for a return's or instrument's own device. */
  slot: 'insert' | 'device'
  index: number
  device: ScoreDevice
}

/** Every device instance in the score with where it lives. */
export function allDevices(score: Score): DeviceLocation[] {
  const out: DeviceLocation[] = []
  score.master.inserts.forEach((device, index) =>
    out.push({ owner: MASTER_OWNER, slot: 'insert', index, device }),
  )
  for (const host of stripHosts(score)) {
    if ('device' in host)
      out.push({ owner: host.id, slot: 'device', index: 0, device: host.device })
    host.strip.inserts.forEach((device, index) =>
      out.push({ owner: host.id, slot: 'insert', index, device }),
    )
  }
  return out
}

export function findDevice(score: Score, id: string): DeviceLocation | undefined {
  return allDevices(score).find((location) => location.device.id === id)
}

// `findScene`, `findSlot` and `slotAt` live in `core/session` and take any
// document shaped like a score.
export { findScene } from '../core/session/Scene'
export { findSlot, slotAt } from '../core/session/Slot'

/** Stable key for a parameter target (a lane and its routes share one). */
export function targetKey(target: ParamTarget): string {
  switch (target.kind) {
    case 'strip':
      return `strip:${target.owner}:${target.param}`
    case 'device':
      return `device:${target.device}:${target.param}`
    default: {
      const exhaustive: never = target
      return exhaustive
    }
  }
}

export function sameTarget(a: ParamTarget, b: ParamTarget): boolean {
  return targetKey(a) === targetKey(b)
}

export function sameDestination(a: ScoreDestination, b: ScoreDestination): boolean {
  return a.kind === b.kind && (a.kind !== 'group' || b.kind !== 'group' || a.id === b.id)
}

// --- Validation ---------------------------------------------------------------------

export interface ScoreIssue {
  /** JSON-pointer-like path into the document, e.g. `tracks[2].clips[0].durationSec`. */
  path: string
  message: string
}

export class ScoreValidationError extends Error {
  readonly issues: readonly ScoreIssue[]

  constructor(issues: readonly ScoreIssue[]) {
    super(
      `live-mix: invalid score (${issues.length} issue${issues.length === 1 ? '' : 's'}):\n` +
        issues.map((issue) => `  ${issue.path}: ${issue.message}`).join('\n'),
    )
    this.name = 'ScoreValidationError'
    this.issues = issues
  }
}

export interface ValidateScoreOptions {
  /**
   * When given, device ids must be registered and their params and presets
   * must exist on the descriptor. Without it only the document's own
   * references are checked.
   */
  devices?: DeviceRegistry
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

class Checker {
  readonly issues: ScoreIssue[] = []

  fail(path: string, message: string): void {
    this.issues.push({ path, message })
  }

  record(value: unknown, path: string): value is Record<string, unknown> {
    if (isRecord(value)) return true
    this.fail(path, 'expected an object')
    return false
  }

  array(value: unknown, path: string): value is unknown[] {
    if (Array.isArray(value)) return true
    this.fail(path, 'expected an array')
    return false
  }

  string(value: unknown, path: string, nonEmpty = true): value is string {
    if (typeof value === 'string' && (!nonEmpty || value.length > 0)) return true
    this.fail(path, nonEmpty ? 'expected a non-empty string' : 'expected a string')
    return false
  }

  number(value: unknown, path: string, range: { min?: number; max?: number } = {}): boolean {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      this.fail(path, 'expected a finite number')
      return false
    }
    if (range.min !== undefined && value < range.min) {
      this.fail(path, `expected ≥ ${range.min}`)
      return false
    }
    if (range.max !== undefined && value > range.max) {
      this.fail(path, `expected ≤ ${range.max}`)
      return false
    }
    return true
  }

  boolean(value: unknown, path: string): value is boolean {
    if (typeof value === 'boolean') return true
    this.fail(path, 'expected a boolean')
    return false
  }

  oneOf<T extends string>(value: unknown, path: string, allowed: readonly T[]): value is T {
    if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return true
    this.fail(path, `expected one of ${allowed.map((item) => `'${item}'`).join(', ')}`)
    return false
  }

  optional<T>(value: unknown, check: (value: unknown) => value is T): value is T | undefined {
    return value === undefined || check(value)
  }
}

interface Ids {
  owners: Set<string>
  groups: Set<string>
  returns: Set<string>
  devices: Set<string>
  sources: Set<string>
  modulators: Set<string>
  audioTracks: Set<string>
  scenes: Set<string>
}

/** Collect every id before the reference checks, so order in the document does not matter. */
function collectIds(raw: Record<string, unknown>): Ids {
  const ids: Ids = {
    owners: new Set(),
    groups: new Set(),
    returns: new Set(),
    devices: new Set(),
    sources: new Set(),
    modulators: new Set(),
    audioTracks: new Set(),
    scenes: new Set(),
  }
  const idOf = (value: unknown): string | null =>
    isRecord(value) && typeof value.id === 'string' ? value.id : null
  const collectDevices = (value: unknown): void => {
    if (!isRecord(value)) return
    const id = idOf(value)
    if (id !== null) ids.devices.add(id)
  }
  const collectStrip = (value: unknown): void => {
    if (!isRecord(value) || !Array.isArray(value.inserts)) return
    for (const insert of value.inserts) collectDevices(insert)
  }
  const collectOwner = (value: unknown, kind: 'track' | 'group' | 'return'): void => {
    const id = idOf(value)
    if (id === null || !isRecord(value)) return
    ids.owners.add(id)
    if (kind === 'group') ids.groups.add(id)
    if (kind === 'return') ids.returns.add(id)
    collectStrip(value.strip)
    if ('device' in value) collectDevices(value.device)
  }
  if (Array.isArray(raw.tracks)) {
    for (const track of raw.tracks) {
      collectOwner(track, 'track')
      const id = idOf(track)
      if (id !== null && isRecord(track) && track.kind === 'audio') ids.audioTracks.add(id)
    }
  }
  if (Array.isArray(raw.scenes)) {
    for (const scene of raw.scenes) {
      const id = idOf(scene)
      if (id !== null) ids.scenes.add(id)
    }
  }
  if (Array.isArray(raw.groups)) for (const group of raw.groups) collectOwner(group, 'group')
  if (Array.isArray(raw.returns)) for (const ret of raw.returns) collectOwner(ret, 'return')
  if (isRecord(raw.master) && Array.isArray(raw.master.inserts)) {
    for (const insert of raw.master.inserts) collectDevices(insert)
  }
  if (Array.isArray(raw.sources)) {
    for (const source of raw.sources) {
      const id = idOf(source)
      if (id !== null) ids.sources.add(id)
    }
  }
  if (Array.isArray(raw.modulators)) {
    for (const modulator of raw.modulators) {
      const id = idOf(modulator)
      if (id !== null) ids.modulators.add(id)
    }
  }
  return ids
}

class UniqueIds {
  private readonly seen = new Map<string, string>()

  constructor(private readonly checker: Checker) {}

  claim(id: string, path: string): void {
    const first = this.seen.get(id)
    if (first !== undefined) {
      this.checker.fail(path, `duplicate id "${id}" (first at ${first})`)
      return
    }
    this.seen.set(id, path)
  }
}

interface Context {
  check: Checker
  ids: Ids
  ownerIds: UniqueIds
  deviceIds: UniqueIds
  devices: DeviceRegistry | undefined
}

function checkDestination(raw: unknown, path: string, ctx: Context, selfId?: string): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (!check.oneOf(raw.kind, `${path}.kind`, ['master', 'group'])) return
  if (raw.kind === 'group') {
    if (!check.string(raw.id, `${path}.id`)) return
    if (!ctx.ids.groups.has(raw.id)) check.fail(`${path}.id`, `unknown group "${raw.id}"`)
    if (raw.id === selfId) check.fail(`${path}.id`, 'a group cannot feed itself')
  }
}

function checkDevice(raw: unknown, path: string, ctx: Context): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (check.string(raw.id, `${path}.id`)) {
    if (raw.id === MASTER_OWNER) check.fail(`${path}.id`, `"${MASTER_OWNER}" is reserved`)
    ctx.deviceIds.claim(raw.id, `${path}.id`)
  }
  const deviceId = raw.deviceId
  const knownDevice = check.string(deviceId, `${path}.deviceId`)
  check.boolean(raw.bypass, `${path}.bypass`)
  let params: Record<string, unknown> = {}
  if (check.record(raw.params, `${path}.params`)) {
    params = raw.params
    for (const [name, value] of Object.entries(raw.params)) {
      check.number(value, `${path}.params.${name}`)
    }
  }
  if (raw.preset !== undefined) check.string(raw.preset, `${path}.preset`)
  if (!ctx.devices || !knownDevice || typeof deviceId !== 'string') return
  const descriptor = ctx.devices.get(deviceId)
  if (!descriptor) {
    check.fail(`${path}.deviceId`, `device "${deviceId}" is not registered`)
    return
  }
  for (const name of Object.keys(params)) {
    if (!(name in descriptor.params)) {
      check.fail(`${path}.params.${name}`, `${descriptor.id} has no parameter "${name}"`)
    }
  }
  if (typeof raw.preset === 'string' && !(raw.preset in (descriptor.presets ?? {}))) {
    check.fail(`${path}.preset`, `${descriptor.id} has no preset "${raw.preset}"`)
  }
}

function checkSend(raw: unknown, path: string, ctx: Context, ownerId: string): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (check.string(raw.target, `${path}.target`)) {
    if (!ctx.ids.returns.has(raw.target)) {
      check.fail(`${path}.target`, `unknown return "${raw.target}"`)
    }
    if (raw.target === ownerId) check.fail(`${path}.target`, 'a return cannot send to itself')
  }
  if (raw.level !== null) check.number(raw.level, `${path}.level`, { min: 0 })
}

function checkStrip(raw: unknown, path: string, ctx: Context, ownerId: string): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  check.number(raw.level, `${path}.level`, { min: 0 })
  check.number(raw.pan, `${path}.pan`, { min: -1, max: 1 })
  check.number(raw.inputGain, `${path}.inputGain`, { min: 0 })
  check.boolean(raw.mute, `${path}.mute`)
  check.boolean(raw.solo, `${path}.solo`)
  check.boolean(raw.soloSafe, `${path}.soloSafe`)
  if (check.array(raw.inserts, `${path}.inserts`)) {
    raw.inserts.forEach((insert, index) => checkDevice(insert, `${path}.inserts[${index}]`, ctx))
  }
  if (check.array(raw.sends, `${path}.sends`)) {
    const targets = new Set<string>()
    raw.sends.forEach((send, index) => {
      checkSend(send, `${path}.sends[${index}]`, ctx, ownerId)
      if (isRecord(send) && typeof send.target === 'string') {
        if (targets.has(send.target)) {
          check.fail(`${path}.sends[${index}].target`, `duplicate send to "${send.target}"`)
        }
        targets.add(send.target)
      }
    })
  }
}

function checkClip(raw: unknown, path: string, ctx: Context, clipIds: UniqueIds): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (check.string(raw.id, `${path}.id`)) clipIds.claim(raw.id, `${path}.id`)
  if (check.string(raw.sourceId, `${path}.sourceId`) && !ctx.ids.sources.has(raw.sourceId)) {
    check.fail(`${path}.sourceId`, `unknown source "${raw.sourceId}"`)
  }
  check.number(raw.startSec, `${path}.startSec`, { min: 0 })
  check.number(raw.offsetSec, `${path}.offsetSec`, { min: 0 })
  check.number(raw.durationSec, `${path}.durationSec`, { min: 0 })
  check.number(raw.fadeInSec, `${path}.fadeInSec`, { min: 0 })
  check.number(raw.fadeOutSec, `${path}.fadeOutSec`, { min: 0 })
  check.oneOf(raw.fadeCurve, `${path}.fadeCurve`, ['linear', 'equalPower'])
  check.number(raw.gainDb, `${path}.gainDb`)
  if (raw.loop !== undefined) check.boolean(raw.loop, `${path}.loop`)
  checkWarp(raw, path, check)
}

/** Optional warp markers and pitch shift (U32) on a clip or slot clip. */
function checkWarp(raw: Record<string, unknown>, path: string, check: Checker): void {
  if (raw.semitones !== undefined) check.number(raw.semitones, `${path}.semitones`)
  if (raw.warp !== undefined && check.array(raw.warp, `${path}.warp`)) {
    raw.warp.forEach((marker, index) => {
      const markerPath = `${path}.warp[${index}]`
      if (!check.record(marker, markerPath)) return
      check.number(marker.sourceSec, `${markerPath}.sourceSec`, { min: 0 })
      check.number(marker.beat, `${markerPath}.beat`, { min: 0 })
    })
  }
}

/** A slot's clip: the clip fields without identity or position. */
function checkSlotClip(raw: unknown, path: string, ctx: Context): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (check.string(raw.sourceId, `${path}.sourceId`) && !ctx.ids.sources.has(raw.sourceId)) {
    check.fail(`${path}.sourceId`, `unknown source "${raw.sourceId}"`)
  }
  check.number(raw.offsetSec, `${path}.offsetSec`, { min: 0 })
  check.number(raw.durationSec, `${path}.durationSec`, { min: 0 })
  check.number(raw.fadeInSec, `${path}.fadeInSec`, { min: 0 })
  check.number(raw.fadeOutSec, `${path}.fadeOutSec`, { min: 0 })
  check.oneOf(raw.fadeCurve, `${path}.fadeCurve`, ['linear', 'equalPower'])
  check.number(raw.gainDb, `${path}.gainDb`)
  if (raw.loop !== undefined) check.boolean(raw.loop, `${path}.loop`)
  checkWarp(raw, path, check)
  if (raw.warp !== undefined && check.array(raw.warp, `${path}.warp`)) {
    raw.warp.forEach((marker, index) => {
      const markerPath = `${path}.warp[${index}]`
      if (!check.record(marker, markerPath)) return
      check.number(marker.sourceSec, `${markerPath}.sourceSec`, { min: 0 })
      check.number(marker.beat, `${markerPath}.beat`, { min: 0 })
    })
  }
}

function checkQuantize(raw: unknown, path: string, check: Checker): void {
  if (!isLaunchQuantize(raw)) {
    check.fail(path, "expected 'none', 'bar', 'beat', a positive bar count or { seconds > 0 }")
  }
}

function checkScene(raw: unknown, path: string, ctx: Context, sceneIds: UniqueIds): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (check.string(raw.id, `${path}.id`)) sceneIds.claim(raw.id, `${path}.id`)
  check.string(raw.name, `${path}.name`, false)
}

function checkSlot(
  raw: unknown,
  path: string,
  ctx: Context,
  slotIds: UniqueIds,
  cells: UniqueIds,
): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (check.string(raw.id, `${path}.id`)) slotIds.claim(raw.id, `${path}.id`)
  const track = check.string(raw.track, `${path}.track`) ? raw.track : null
  const scene = check.string(raw.scene, `${path}.scene`) ? raw.scene : null
  if (track !== null && !ctx.ids.audioTracks.has(track)) {
    check.fail(`${path}.track`, `"${track}" is not an audio track`)
  }
  if (scene !== null && !ctx.ids.scenes.has(scene)) {
    check.fail(`${path}.scene`, `unknown scene "${scene}"`)
  }
  if (track !== null && scene !== null) cells.claim(`${track}×${scene}`, `${path}`)
  if (raw.clip !== null) checkSlotClip(raw.clip, `${path}.clip`, ctx)
  if (raw.quantize !== undefined) checkQuantize(raw.quantize, `${path}.quantize`, check)
  check.oneOf(raw.launchMode, `${path}.launchMode`, LAUNCH_MODES)
  check.boolean(raw.legato, `${path}.legato`)
  if (raw.follow !== undefined && !isFollowAction(raw.follow)) {
    check.fail(`${path}.follow`, 'expected { a, b, chance 0..1, time?: { unit, value > 0 } }')
  }
}

function checkOwnerHead(
  raw: Record<string, unknown>,
  path: string,
  ctx: Context,
): string | undefined {
  const { check } = ctx
  let id: string | undefined
  if (check.string(raw.id, `${path}.id`)) {
    id = raw.id
    if (id === MASTER_OWNER) check.fail(`${path}.id`, `"${MASTER_OWNER}" is reserved`)
    ctx.ownerIds.claim(id, `${path}.id`)
  }
  check.string(raw.name, `${path}.name`, false)
  return id
}

function checkTrack(raw: unknown, path: string, ctx: Context): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  const id = checkOwnerHead(raw, path, ctx)
  checkDestination(raw.destination, `${path}.destination`, ctx)
  checkStrip(raw.strip, `${path}.strip`, ctx, id ?? '')
  if (!check.oneOf(raw.kind, `${path}.kind`, TRACK_KINDS)) return
  switch (raw.kind) {
    case 'audio': {
      if (raw.lookaheadSec !== undefined)
        check.number(raw.lookaheadSec, `${path}.lookaheadSec`, { min: 0 })
      if (raw.preloadSec !== undefined)
        check.number(raw.preloadSec, `${path}.preloadSec`, { min: 0 })
      if (check.array(raw.clips, `${path}.clips`)) {
        const clipIds = new UniqueIds(check)
        raw.clips.forEach((clip, index) => checkClip(clip, `${path}.clips[${index}]`, ctx, clipIds))
      }
      return
    }
    case 'live':
      return
    case 'instrument':
      checkDevice(raw.device, `${path}.device`, ctx)
      return
    default: {
      const exhaustive: never = raw.kind
      return exhaustive
    }
  }
}

function checkGroup(raw: unknown, path: string, ctx: Context): void {
  if (!ctx.check.record(raw, path)) return
  const id = checkOwnerHead(raw, path, ctx)
  checkDestination(raw.destination, `${path}.destination`, ctx, id)
  checkStrip(raw.strip, `${path}.strip`, ctx, id ?? '')
}

function checkReturn(raw: unknown, path: string, ctx: Context): void {
  if (!ctx.check.record(raw, path)) return
  const id = checkOwnerHead(raw, path, ctx)
  checkDestination(raw.destination, `${path}.destination`, ctx)
  checkStrip(raw.strip, `${path}.strip`, ctx, id ?? '')
  checkDevice(raw.device, `${path}.device`, ctx)
}

function checkTarget(raw: unknown, path: string, ctx: Context): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (!check.oneOf(raw.kind, `${path}.kind`, ['strip', 'device'])) return
  if (raw.kind === 'strip') {
    if (check.string(raw.owner, `${path}.owner`)) {
      if (raw.owner !== MASTER_OWNER && !ctx.ids.owners.has(raw.owner)) {
        check.fail(`${path}.owner`, `unknown strip owner "${raw.owner}"`)
      }
      if (check.oneOf(raw.param, `${path}.param`, STRIP_PARAMS)) {
        if (raw.owner === MASTER_OWNER && raw.param !== 'level') {
          check.fail(`${path}.param`, 'the master only has a level')
        }
      }
    }
    return
  }
  if (check.string(raw.device, `${path}.device`) && !ctx.ids.devices.has(raw.device)) {
    check.fail(`${path}.device`, `unknown device "${raw.device}"`)
  }
  check.string(raw.param, `${path}.param`)
}

function checkBreakpoint(raw: unknown, path: string, check: Checker): void {
  if (!check.record(raw, path)) return
  check.number(raw.timeSec, `${path}.timeSec`)
  check.number(raw.value, `${path}.value`)
  if (raw.curve !== undefined) check.oneOf(raw.curve, `${path}.curve`, LANE_CURVES)
}

function checkLane(raw: unknown, path: string, ctx: Context, laneIds: UniqueIds): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (check.string(raw.id, `${path}.id`)) laneIds.claim(raw.id, `${path}.id`)
  checkTarget(raw.target, `${path}.target`, ctx)
  if (raw.defaultValue !== undefined) check.number(raw.defaultValue, `${path}.defaultValue`)
  if (check.array(raw.breakpoints, `${path}.breakpoints`)) {
    raw.breakpoints.forEach((point, index) =>
      checkBreakpoint(point, `${path}.breakpoints[${index}]`, check),
    )
  }
}

function checkModulator(raw: unknown, path: string, ctx: Context, modIds: UniqueIds): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (check.string(raw.id, `${path}.id`)) modIds.claim(raw.id, `${path}.id`)
  if (!check.oneOf(raw.kind, `${path}.kind`, MODULATOR_KINDS)) return
  switch (raw.kind) {
    case 'lfo':
      check.number(raw.rateHz, `${path}.rateHz`, { min: 0 })
      check.oneOf(raw.shape, `${path}.shape`, LFO_SHAPES)
      check.number(raw.depth, `${path}.depth`, { min: 0, max: 1 })
      check.number(raw.phase, `${path}.phase`)
      return
    case 'random':
      check.number(raw.rateHz, `${path}.rateHz`, { min: 0 })
      check.number(raw.seed, `${path}.seed`)
      check.boolean(raw.smooth, `${path}.smooth`)
      return
    case 'macro':
      check.number(raw.value, `${path}.value`, { min: 0, max: 1 })
      return
    case 'external-phase':
      check.number(raw.phaseOffset, `${path}.phaseOffset`)
      check.number(raw.depth, `${path}.depth`, { min: 0, max: 1 })
      check.oneOf(raw.shape, `${path}.shape`, LFO_SHAPES)
      return
    default: {
      const exhaustive: never = raw.kind
      return exhaustive
    }
  }
}

function checkRoute(raw: unknown, path: string, ctx: Context, routeIds: UniqueIds): void {
  const { check } = ctx
  if (!check.record(raw, path)) return
  if (check.string(raw.id, `${path}.id`)) routeIds.claim(raw.id, `${path}.id`)
  if (check.string(raw.source, `${path}.source`) && !ctx.ids.modulators.has(raw.source)) {
    check.fail(`${path}.source`, `unknown modulator "${raw.source}"`)
  }
  checkTarget(raw.target, `${path}.target`, ctx)
  check.number(raw.depth, `${path}.depth`, { min: -1, max: 1 })
  check.oneOf(raw.polarity, `${path}.polarity`, POLARITIES)
}

/** Groups feeding groups must form a forest, never a cycle. */
function checkGroupCycles(raw: Record<string, unknown>, check: Checker): void {
  if (!Array.isArray(raw.groups)) return
  const parent = new Map<string, string>()
  raw.groups.forEach((group) => {
    if (!isRecord(group) || typeof group.id !== 'string') return
    const destination = group.destination
    if (
      isRecord(destination) &&
      destination.kind === 'group' &&
      typeof destination.id === 'string'
    ) {
      parent.set(group.id, destination.id)
    }
  })
  for (const [start] of parent) {
    const seen = new Set<string>([start])
    let current = parent.get(start)
    while (current !== undefined) {
      if (seen.has(current)) {
        check.fail(`groups`, `group routing cycle through "${current}"`)
        return
      }
      seen.add(current)
      current = parent.get(current)
    }
  }
}

/** Structural and referential checks; an empty list means the score is valid. */
export function validateScore(input: unknown, options: ValidateScoreOptions = {}): ScoreIssue[] {
  const check = new Checker()
  if (!check.record(input, '')) return check.issues
  const raw = input
  if (raw.format !== SCORE_FORMAT_VERSION) {
    check.fail('format', `expected ${SCORE_FORMAT_VERSION}, got ${String(raw.format)}`)
    return check.issues
  }
  check.string(raw.id, 'id')
  check.string(raw.name, 'name', false)
  const ctx: Context = {
    check,
    ids: collectIds(raw),
    ownerIds: new UniqueIds(check),
    deviceIds: new UniqueIds(check),
    devices: options.devices,
  }

  if (
    check.record(raw.transport, 'transport') &&
    check.record(raw.transport.loop, 'transport.loop')
  ) {
    const loop = raw.transport.loop
    check.boolean(loop.enabled, 'transport.loop.enabled')
    if (loop.lengthSec !== null) {
      if (
        check.number(loop.lengthSec, 'transport.loop.lengthSec') &&
        (loop.lengthSec as number) <= 0
      ) {
        check.fail('transport.loop.lengthSec', 'expected > 0 or null')
      }
    }
    checkQuantize(raw.transport.quantize, 'transport.quantize', check)
  }
  if (check.record(raw.master, 'master')) {
    check.number(raw.master.level, 'master.level', { min: 0 })
    if (check.array(raw.master.inserts, 'master.inserts')) {
      raw.master.inserts.forEach((insert, index) =>
        checkDevice(insert, `master.inserts[${index}]`, ctx),
      )
    }
  }
  if (check.array(raw.sources, 'sources')) {
    const sourceIds = new UniqueIds(check)
    raw.sources.forEach((source, index) => {
      const path = `sources[${index}]`
      if (!check.record(source, path)) return
      if (check.string(source.id, `${path}.id`)) sourceIds.claim(source.id, `${path}.id`)
      if (source.url !== undefined) check.string(source.url, `${path}.url`)
      if (source.durationSec !== undefined)
        check.number(source.durationSec, `${path}.durationSec`, { min: 0 })
      if (source.analysis !== undefined) check.record(source.analysis, `${path}.analysis`)
    })
  }
  if (check.array(raw.tracks, 'tracks')) {
    raw.tracks.forEach((track, index) => checkTrack(track, `tracks[${index}]`, ctx))
  }
  if (check.array(raw.groups, 'groups')) {
    raw.groups.forEach((group, index) => checkGroup(group, `groups[${index}]`, ctx))
    checkGroupCycles(raw, check)
  }
  if (check.array(raw.returns, 'returns')) {
    raw.returns.forEach((ret, index) => checkReturn(ret, `returns[${index}]`, ctx))
  }
  if (check.array(raw.lanes, 'lanes')) {
    const laneIds = new UniqueIds(check)
    const targets = new Map<string, string>()
    raw.lanes.forEach((lane, index) => {
      const path = `lanes[${index}]`
      checkLane(lane, path, ctx, laneIds)
      if (isRecord(lane) && isRecord(lane.target) && targetIsComplete(lane.target)) {
        const key = targetKey(lane.target)
        const first = targets.get(key)
        if (first !== undefined) {
          check.fail(`${path}.target`, `a second lane on the same parameter (first at ${first})`)
        }
        targets.set(key, path)
      }
    })
  }
  if (check.array(raw.modulators, 'modulators')) {
    const modIds = new UniqueIds(check)
    raw.modulators.forEach((modulator, index) =>
      checkModulator(modulator, `modulators[${index}]`, ctx, modIds),
    )
  }
  if (check.array(raw.routes, 'routes')) {
    const routeIds = new UniqueIds(check)
    raw.routes.forEach((route, index) => checkRoute(route, `routes[${index}]`, ctx, routeIds))
  }
  if (check.array(raw.scenes, 'scenes')) {
    const sceneIds = new UniqueIds(check)
    raw.scenes.forEach((scene, index) => checkScene(scene, `scenes[${index}]`, ctx, sceneIds))
  }
  if (check.array(raw.slots, 'slots')) {
    const slotIds = new UniqueIds(check)
    const cells = new UniqueIds(check)
    raw.slots.forEach((slot, index) => checkSlot(slot, `slots[${index}]`, ctx, slotIds, cells))
  }
  return check.issues
}

function targetIsComplete(
  raw: Record<string, unknown>,
): raw is ParamTarget & Record<string, unknown> {
  if (raw.kind === 'strip') return typeof raw.owner === 'string' && typeof raw.param === 'string'
  if (raw.kind === 'device') return typeof raw.device === 'string' && typeof raw.param === 'string'
  return false
}

/** `validateScore` that throws `ScoreValidationError` on the first non-empty result. */
export function assertValidScore(
  input: unknown,
  options: ValidateScoreOptions = {},
): asserts input is Score {
  const issues = validateScore(input, options)
  if (issues.length > 0) throw new ScoreValidationError(issues)
}

// --- Normalisation and (de)serialisation --------------------------------------------

function normaliseDevice(device: ScoreDevice): ScoreDevice {
  const out: ScoreDevice = {
    id: device.id,
    deviceId: device.deviceId,
    params: sortedRecord(device.params),
    bypass: device.bypass,
  }
  if (device.preset !== undefined) out.preset = device.preset
  return out
}

function normaliseStrip(strip: ScoreStrip): ScoreStrip {
  return {
    level: strip.level,
    pan: strip.pan,
    inputGain: strip.inputGain,
    mute: strip.mute,
    solo: strip.solo,
    soloSafe: strip.soloSafe,
    inserts: strip.inserts.map(normaliseDevice),
    sends: strip.sends.map((send) => ({ target: send.target, level: send.level })),
  }
}

function normaliseDestination(destination: ScoreDestination): ScoreDestination {
  return destination.kind === 'group' ? { kind: 'group', id: destination.id } : { kind: 'master' }
}

/** Clip fields in a fixed order; `loop` only when true (absent and `false` mean the same). */
export function normaliseClip(clip: Clip): Clip {
  const out: Clip = {
    id: clip.id,
    sourceId: clip.sourceId,
    startSec: clip.startSec,
    offsetSec: clip.offsetSec,
    durationSec: clip.durationSec,
    fadeInSec: clip.fadeInSec,
    fadeOutSec: clip.fadeOutSec,
    fadeCurve: clip.fadeCurve,
    gainDb: clip.gainDb,
  }
  if (clip.loop) out.loop = true
  if (clip.warp !== undefined)
    out.warp = clip.warp.map((m) => ({ sourceSec: m.sourceSec, beat: m.beat }))
  if (clip.semitones !== undefined) out.semitones = clip.semitones
  return out
}

/** Slot clip fields in a fixed order; `loop` only when true, warp/semitones only when set. */
export function normaliseSlotClip(clip: SlotClip): SlotClip {
  const out: SlotClip = {
    sourceId: clip.sourceId,
    offsetSec: clip.offsetSec,
    durationSec: clip.durationSec,
    fadeInSec: clip.fadeInSec,
    fadeOutSec: clip.fadeOutSec,
    fadeCurve: clip.fadeCurve,
    gainDb: clip.gainDb,
  }
  if (clip.loop) out.loop = true
  if (clip.warp !== undefined)
    out.warp = clip.warp.map((m) => ({ sourceSec: m.sourceSec, beat: m.beat }))
  if (clip.semitones !== undefined) out.semitones = clip.semitones
  return out
}

export function normaliseQuantize(quantize: LaunchQuantize): LaunchQuantize {
  return typeof quantize === 'object' ? { seconds: quantize.seconds } : quantize
}

/** A slot with fields in a fixed order and optional settings only when set. */
export function normaliseSlot(slot: ScoreSlot): ScoreSlot {
  const out: ScoreSlot = {
    id: slot.id,
    track: slot.track,
    scene: slot.scene,
    clip: slot.clip === null ? null : normaliseSlotClip(slot.clip),
    launchMode: slot.launchMode,
    legato: slot.legato,
  }
  if (slot.quantize !== undefined) out.quantize = normaliseQuantize(slot.quantize)
  if (slot.follow !== undefined) out.follow = normaliseFollowAction(slot.follow)
  return out
}

function normaliseTrack(track: ScoreTrack): ScoreTrack {
  const head = {
    id: track.id,
    name: track.name,
    destination: normaliseDestination(track.destination),
    strip: normaliseStrip(track.strip),
  }
  switch (track.kind) {
    case 'audio': {
      const out: ScoreAudioTrack = {
        kind: 'audio',
        ...head,
        clips: sortClips(track.clips.map(normaliseClip)),
      }
      if (track.lookaheadSec !== undefined) out.lookaheadSec = track.lookaheadSec
      if (track.preloadSec !== undefined) out.preloadSec = track.preloadSec
      return out
    }
    case 'live':
      return { kind: 'live', ...head }
    case 'instrument':
      return { kind: 'instrument', ...head, device: normaliseDevice(track.device) }
    default: {
      const exhaustive: never = track
      return exhaustive
    }
  }
}

function normaliseTarget(target: ParamTarget): ParamTarget {
  return target.kind === 'strip'
    ? { kind: 'strip', owner: target.owner, param: target.param }
    : { kind: 'device', device: target.device, param: target.param }
}

/** A breakpoint with `curve` only when it is not the default `linear`. */
export function normaliseBreakpoint(point: Breakpoint): Breakpoint {
  const out: Breakpoint = { timeSec: point.timeSec, value: point.value }
  if (point.curve !== undefined && point.curve !== 'linear') out.curve = point.curve
  return out
}

/** `ClipList` order: by start, then id. */
export function sortClips(clips: readonly Clip[]): Clip[] {
  return [...clips].sort((a, b) => a.startSec - b.startSec || a.id.localeCompare(b.id))
}

/** Breakpoints sorted by time, one per time (the last wins), curve markers normalised. */
export function sortBreakpoints(points: readonly Breakpoint[]): Breakpoint[] {
  const byTime = new Map<number, Breakpoint>()
  for (const point of points) byTime.set(point.timeSec, normaliseBreakpoint(point))
  return [...byTime.values()].sort((a, b) => a.timeSec - b.timeSec)
}

function normaliseModulator(modulator: ScoreModulator): ScoreModulator {
  switch (modulator.kind) {
    case 'lfo':
      return {
        id: modulator.id,
        kind: 'lfo',
        rateHz: modulator.rateHz,
        shape: modulator.shape,
        depth: modulator.depth,
        phase: modulator.phase,
      }
    case 'random':
      return {
        id: modulator.id,
        kind: 'random',
        rateHz: modulator.rateHz,
        seed: modulator.seed,
        smooth: modulator.smooth,
      }
    case 'macro':
      return { id: modulator.id, kind: 'macro', value: modulator.value }
    case 'external-phase':
      return {
        id: modulator.id,
        kind: 'external-phase',
        phaseOffset: modulator.phaseOffset,
        depth: modulator.depth,
        shape: modulator.shape,
      }
    default: {
      const exhaustive: never = modulator
      return exhaustive
    }
  }
}

function sortedRecord<T>(record: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {}
  for (const key of Object.keys(record).sort()) out[key] = record[key]
  return out
}

/**
 * A structurally fresh copy with every field in canonical order, optional
 * fields dropped when unset, and clips sorted by start (as `ClipList` keeps
 * them). `serializeScore` runs it, so equal documents serialise equally.
 */
export function normaliseScore(score: Score): Score {
  return {
    format: SCORE_FORMAT_VERSION,
    id: score.id,
    name: score.name,
    transport: {
      loop: { enabled: score.transport.loop.enabled, lengthSec: score.transport.loop.lengthSec },
      quantize: normaliseQuantize(score.transport.quantize),
    },
    master: { level: score.master.level, inserts: score.master.inserts.map(normaliseDevice) },
    sources: score.sources.map((source) => {
      const out: ScoreSource = { id: source.id }
      if (source.url !== undefined) out.url = source.url
      if (source.durationSec !== undefined) out.durationSec = source.durationSec
      if (source.analysis !== undefined) out.analysis = { ...source.analysis }
      return out
    }),
    tracks: score.tracks.map(normaliseTrack),
    groups: score.groups.map((group) => ({
      id: group.id,
      name: group.name,
      destination: normaliseDestination(group.destination),
      strip: normaliseStrip(group.strip),
    })),
    returns: score.returns.map((ret) => ({
      id: ret.id,
      name: ret.name,
      destination: normaliseDestination(ret.destination),
      strip: normaliseStrip(ret.strip),
      device: normaliseDevice(ret.device),
    })),
    lanes: score.lanes.map((lane) => {
      const out: ScoreLane = {
        id: lane.id,
        target: normaliseTarget(lane.target),
        breakpoints: sortBreakpoints(lane.breakpoints),
      }
      if (lane.defaultValue !== undefined) out.defaultValue = lane.defaultValue
      return out
    }),
    modulators: score.modulators.map(normaliseModulator),
    routes: score.routes.map((route) => ({
      id: route.id,
      source: route.source,
      target: normaliseTarget(route.target),
      depth: route.depth,
      polarity: route.polarity,
    })),
    scenes: score.scenes.map((scene) => ({ id: scene.id, name: scene.name })),
    slots: score.slots.map(normaliseSlot),
  }
}

/** Stable JSON (two-space indent, canonical field order). */
export function serializeScore(score: Score): string {
  return JSON.stringify(normaliseScore(score), null, 2)
}

/**
 * `1 → 2` (U31): the session grid. A format-1 document has no scenes or
 * slots and no global launch quantisation; it gains empty lists and the
 * default (`'bar'`). Existing fields are untouched.
 */
function migrate1to2(raw: Record<string, unknown>): Record<string, unknown> {
  const transport = isRecord(raw.transport) ? raw.transport : {}
  return {
    ...raw,
    format: 2,
    transport: { ...transport, quantize: transport.quantize ?? DEFAULT_LAUNCH_QUANTIZE },
    scenes: Array.isArray(raw.scenes) ? raw.scenes : [],
    slots: Array.isArray(raw.slots) ? raw.slots : [],
  }
}

/**
 * Migrations from older format versions, keyed by the format they read,
 * applied in order before validation. A future `format: 3` adds `2 → 3`
 * here and bumps `SCORE_FORMAT_VERSION`.
 */
const MIGRATIONS: ReadonlyMap<number, (raw: Record<string, unknown>) => Record<string, unknown>> =
  new Map([[1, migrate1to2]])

/** Bring a document of any known older format up to the current one; unknown formats throw. */
export function migrateScore(input: unknown): unknown {
  if (!isRecord(input)) return input
  let raw = input
  let format = typeof raw.format === 'number' ? raw.format : NaN
  if (!Number.isInteger(format) || format < 1) {
    throw new ScoreValidationError([
      { path: 'format', message: `unknown format ${String(raw.format)}` },
    ])
  }
  if (format > SCORE_FORMAT_VERSION) {
    throw new ScoreValidationError([
      {
        path: 'format',
        message: `format ${format} is newer than this library (${SCORE_FORMAT_VERSION})`,
      },
    ])
  }
  while (format < SCORE_FORMAT_VERSION) {
    const migrate = MIGRATIONS.get(format)
    if (!migrate) {
      throw new ScoreValidationError([
        { path: 'format', message: `no migration from format ${format}` },
      ])
    }
    raw = migrate(raw)
    format += 1
  }
  return raw
}

/**
 * Parse `serializeScore` output (a JSON string or an already-parsed value):
 * migrate, validate (throws `ScoreValidationError`), normalise.
 */
export function parseScore(input: unknown, options: ValidateScoreOptions = {}): Score {
  const value: unknown = typeof input === 'string' ? JSON.parse(input) : input
  const migrated = migrateScore(value)
  assertValidScore(migrated, options)
  return normaliseScore(migrated)
}
