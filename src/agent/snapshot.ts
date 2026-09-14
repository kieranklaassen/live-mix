// The state snapshot (R28): a compact JSON view of the mix sized for a prompt
// — transport, section, what is playing, levels, meters, active devices and
// the most recent calls — plus a diff against the snapshot taken at an
// earlier cursor so a model can read only what changed. The rails are static
// and live in the tool descriptions and `controller.rails.describe()`, not here.

import { type Engine } from '../core/Engine'
import { type TransportState } from '../core/transport/Transport'
import { MASTER_OWNER, allDevices, findStripHost, type Score } from '../score/schema'
import { type AuditEntry } from './audit'
import { type AgentRoles, type AgentSessionState, type AgentUpcoming } from './types'

export interface SnapshotTransport {
  state: TransportState
  positionSec: number
  loop: boolean
}

export interface SnapshotSession {
  sectionIndex: number
  section?: string
  intensity?: number
  remainingSec?: number
  sections?: { name: string; intensity: number; durationSec: number }[]
  paceMultiplier?: number
}

export interface SnapshotMusic {
  nowPlaying: {
    id: number | string
    title: string
    key: string
    intensity: number
    remainingSec?: number
  }
  upcoming: AgentUpcoming[]
}

export interface SnapshotMeters {
  shortTermLufs: number | null
  momentaryLufs: number | null
  truePeakDb: number | null
}

export interface SnapshotDevice {
  id: string
  deviceId: string
  owner: string
  bypass: boolean
}

export interface SnapshotCall {
  callId: number
  tool: string
  author: string
  outcome: AuditEntry['outcome']
  summary: string
}

export interface AgentSnapshot {
  /** Audit cursor: pass to `diffSince`. */
  cursor: number
  atSec: number
  transport: SnapshotTransport | null
  session?: SnapshotSession
  music?: SnapshotMusic
  /** Linear fader levels: `master` and each role that resolves. */
  levels: Record<string, number>
  meters?: SnapshotMeters
  voice: { speaking: boolean }
  /** Engaged (non-bypassed) devices, most relevant first, capped. */
  devices: SnapshotDevice[]
  recent: SnapshotCall[]
}

export interface SnapshotDiff {
  from: number
  to: number
  /** Calls since `from`, oldest first. */
  calls: SnapshotCall[]
  /** Snapshot fields whose value differs from the snapshot at `from`; the whole snapshot when `from` is unknown. */
  changed: Partial<AgentSnapshot>
  full: boolean
}

export const SNAPSHOT_RECENT_CALLS = 6
export const SNAPSHOT_MAX_DEVICES = 12
export const SNAPSHOT_MAX_UPCOMING = 3

export interface SnapshotInputs {
  engine: Engine | null
  score: Score | null
  roles: AgentRoles
  session: AgentSessionState | undefined
  speaking: boolean
  recent: readonly AuditEntry[]
  cursor: number
  /** Short-term / momentary LUFS and true peak, when a meter is installed. */
  meters?: SnapshotMeters | null
}

function round(value: number, digits = 3): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function finiteOrNull(value: number | undefined): number | null {
  return value !== undefined && Number.isFinite(value) ? round(value, 1) : null
}

export const SNAPSHOT_SUMMARY_CHARS = 48

export function toSnapshotCall(entry: AuditEntry): SnapshotCall {
  const summary =
    entry.summary.length > SNAPSHOT_SUMMARY_CHARS
      ? `${entry.summary.slice(0, SNAPSHOT_SUMMARY_CHARS - 1)}…`
      : entry.summary
  return {
    callId: entry.callId,
    tool: entry.tool,
    author: entry.author.id,
    outcome: entry.outcome,
    summary,
  }
}

function levelsOf(inputs: SnapshotInputs): Record<string, number> {
  const levels: Record<string, number> = {}
  const { score, engine, roles } = inputs
  if (score) levels.master = round(score.master.level)
  else if (engine) levels.master = round(engine.master.gain.value)
  const roleEntries: [string, string | undefined][] = [
    ['voice', roles.voice],
    ['music', roles.music],
    ['ambience', roles.ambience],
    ['breathGuide', roles.breathGuide],
  ]
  for (const [role, id] of roleEntries) {
    if (!id) continue
    if (score) {
      const host = findStripHost(score, id)
      if (host) levels[role] = round(host.strip.mute ? 0 : host.strip.level)
    } else if (engine) {
      const level = engineLevel(engine, id)
      if (level !== null) levels[role] = round(level)
    }
  }
  if (inputs.session?.musicVolume !== undefined) levels.music = round(inputs.session.musicVolume)
  return levels
}

function engineLevel(engine: Engine, id: string): number | null {
  const strip =
    engine.tracks.find((track) => track.name === id)?.strip ??
    engine.groups.find((group) => group.name === id)?.strip ??
    engine.liveInputs.find((track) => track.name === id)?.strip ??
    engine.returnTracks.find((track) => track.name === id)?.strip
  if (strip) return strip.mute ? 0 : strip.level
  if (engine.hasBus(id)) return engine.bus(id).gain.value
  return null
}

function devicesOf(score: Score | null, roles: AgentRoles): SnapshotDevice[] {
  if (!score) return []
  const roleIds = new Set(Object.values(roles).filter((id): id is string => id !== undefined))
  const weight = (owner: string): number =>
    owner === MASTER_OWNER ? 0 : roleIds.has(owner) ? 1 : 2
  return allDevices(score)
    .filter((location) => !location.device.bypass)
    .sort((a, b) => weight(a.owner) - weight(b.owner))
    .slice(0, SNAPSHOT_MAX_DEVICES)
    .map((location) => ({
      id: location.device.id,
      deviceId: location.device.deviceId,
      owner: location.owner,
      bypass: location.device.bypass,
    }))
}

function sessionOf(state: AgentSessionState | undefined): SnapshotSession | undefined {
  if (state?.sectionIndex === undefined) return undefined
  const current = state.sections?.[state.sectionIndex]
  const session: SnapshotSession = { sectionIndex: state.sectionIndex }
  if (current) {
    session.section = current.name
    session.intensity = current.intensity
  }
  if (state.sectionRemainingSec !== undefined)
    session.remainingSec = Math.round(state.sectionRemainingSec)
  if (state.sections) {
    session.sections = state.sections.map((section) => ({
      name: section.name,
      intensity: section.intensity,
      durationSec: Math.round(section.durationSec),
    }))
  }
  if (state.paceMultiplier !== undefined) session.paceMultiplier = round(state.paceMultiplier, 2)
  return session
}

function musicOf(state: AgentSessionState | undefined): SnapshotMusic | undefined {
  const now = state?.nowPlaying
  if (!now) return undefined
  return {
    nowPlaying: {
      id: now.id,
      title: now.title,
      key: now.camelot,
      intensity: now.intensity,
      ...(now.remainingSec !== undefined ? { remainingSec: Math.round(now.remainingSec) } : {}),
    },
    upcoming: (state?.upcoming ?? []).slice(0, SNAPSHOT_MAX_UPCOMING).map((item) => ({
      id: item.id,
      title: item.title,
      camelot: item.camelot,
      startsInSec: Math.round(item.startsInSec),
    })),
  }
}

/** Read the master's LUFS meter when one is installed. */
export function metersOf(engine: Engine | null): SnapshotMeters | null {
  const lufs = engine?.master.lufs
  if (!lufs) return null
  return {
    shortTermLufs: finiteOrNull(lufs.lufsShortTerm),
    momentaryLufs: finiteOrNull(lufs.lufsMomentary),
    truePeakDb: finiteOrNull(lufs.truePeakDb),
  }
}

export function buildSnapshot(inputs: SnapshotInputs): AgentSnapshot {
  const { engine } = inputs
  const transport: SnapshotTransport | null = engine
    ? {
        state: engine.transport.state,
        positionSec: round(engine.transport.position().positionSec, 1),
        loop: engine.transport.loop.enabled,
      }
    : null
  const snapshot: AgentSnapshot = {
    cursor: inputs.cursor,
    atSec: round(engine?.now() ?? 0, 1),
    transport,
    levels: levelsOf(inputs),
    voice: { speaking: inputs.speaking },
    devices: devicesOf(inputs.score, inputs.roles),
    recent: inputs.recent.slice(-SNAPSHOT_RECENT_CALLS).map(toSnapshotCall),
  }
  const session = sessionOf(inputs.session)
  if (session) snapshot.session = session
  const music = musicOf(inputs.session)
  if (music) snapshot.music = music
  const meters = inputs.meters === undefined ? metersOf(engine) : inputs.meters
  if (meters) {
    snapshot.meters = {
      shortTermLufs: finiteOrNull(meters.shortTermLufs ?? undefined),
      momentaryLufs: finiteOrNull(meters.momentaryLufs ?? undefined),
      truePeakDb: finiteOrNull(meters.truePeakDb ?? undefined),
    }
  }
  return snapshot
}

/** Fields of `next` whose JSON differs from `previous`. */
export function diffSnapshots(
  previous: AgentSnapshot,
  next: AgentSnapshot,
): Partial<AgentSnapshot> {
  const changed: Partial<AgentSnapshot> = {}
  const keys = new Set<keyof AgentSnapshot>([
    ...(Object.keys(previous) as (keyof AgentSnapshot)[]),
    ...(Object.keys(next) as (keyof AgentSnapshot)[]),
  ])
  for (const key of keys) {
    if (key === 'cursor' || key === 'atSec' || key === 'recent') continue
    if (JSON.stringify(previous[key]) !== JSON.stringify(next[key])) {
      Object.assign(changed, { [key]: next[key] ?? null })
    }
  }
  return changed
}
