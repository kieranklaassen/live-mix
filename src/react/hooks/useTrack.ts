// Mixer state per strip: level, pan, mute/solo, audibility, inserts, over
// `ChannelStrip.onChange`. Setters ramp through the strip (never a step, R2).
// `useTrack` resolves any track kind by object or name; `useGroup` adds
// membership. Inside a provider with an `arbiter` (U30), level/pan/trim/
// mute/solo setters apply attributed `strip.*` operations as the human
// author instead — the renderer ramps the strip — and `touch`/`release`
// bracket a drag so the hand holds the target for the touch window.

import { useCallback, useMemo, useRef } from 'react'

import { type Device } from '../../core/devices/Device'
import { type Engine } from '../../core/Engine'
import {
  type ChannelStrip,
  type RampOptions,
  type StripDestination,
  type StripHost,
} from '../../core/tracks/ChannelStrip'
import { type GroupTrack } from '../../core/tracks/GroupTrack'
import { type Arbiter } from '../../score/Arbiter'
import { type Operation } from '../../score/operations'
import { findStripHost as findScoreStripHost, type StripParam } from '../../score/schema'
import { useExternalSnapshot } from '../store'
import { useMaybeArbiter, useMaybeEngine } from './useEngine'

export interface StripSnapshot {
  name: string
  /** Input trim, linear. */
  inputGain: number
  /** Fader, linear (1 = unity). */
  level: number
  /** −1 (left) … 1 (right). */
  pan: number
  mute: boolean
  solo: boolean
  soloSafe: boolean
  /** Muted by another strip's solo. */
  implicitlyMuted: boolean
  /** Neither muted nor silenced by a solo elsewhere. */
  audible: boolean
  inserts: readonly Device[]
  /** True once the strip has built its nodes. */
  materialized: boolean
}

export interface StripControls {
  /** Ramp the fader (clamped at 0). */
  setLevel(value: number, options?: RampOptions): void
  /** Ramp the pan (clamped to ±1). */
  setPan(value: number, options?: RampOptions): void
  setInputGain(value: number, options?: RampOptions): void
  setMute(value: boolean, options?: RampOptions): void
  toggleMute(): void
  /** Solo-in-place through the engine's registry. */
  setSolo(value: boolean, options?: RampOptions): void
  toggleSolo(): void
  setSoloSafe(value: boolean): void
  addInsert(device: Device): void
  removeInsert(device: Device): void
  /** Re-route the strip to a bus, a group or a node. */
  connectTo(destination: StripDestination): void
  /**
   * Pointer down on a continuous control: with an arbiter, holds the target
   * open-ended and starts a fresh undo gesture. A no-op otherwise.
   */
  touch(param: StripParam): void
  /** Pointer up: the hold runs its timer and the gesture ends. */
  release(param: StripParam): void
  /** True when setters write attributed score operations through an arbiter. */
  attributed: boolean
}

export type UseStripResult = StripSnapshot & StripControls & { strip: ChannelStrip }

/** Whether the arbiter's score knows this strip by name (ids are engine names). */
function scoreHas(arbiter: Arbiter | null, name: string): arbiter is Arbiter {
  return arbiter !== null && findScoreStripHost(arbiter.score, name) !== undefined
}

/** Mixer state and ramped setters for one strip. */
export function useStrip(strip: ChannelStrip): UseStripResult {
  const arbiter = useMaybeArbiter()
  const gestures = useRef<Partial<Record<StripParam, number>>>({})
  const subscribe = useCallback((onChange: () => void) => strip.onChange(() => onChange()), [strip])
  const read = useCallback(
    (): StripSnapshot => ({
      name: strip.name,
      inputGain: strip.inputGain,
      level: strip.level,
      pan: strip.pan,
      mute: strip.mute,
      solo: strip.solo,
      soloSafe: strip.soloSafe,
      implicitlyMuted: strip.implicitlyMuted,
      audible: strip.audible,
      inserts: [...strip.inserts],
      materialized: strip.materialized,
    }),
    [strip],
  )
  const snapshot = useExternalSnapshot(subscribe, read)

  const controls = useMemo<StripControls>(() => {
    const owner = strip.name
    const target = (param: StripParam) => ({ kind: 'strip' as const, owner, param })
    /** The arbiter when the score carries this strip; the engine setter otherwise. */
    const via = (op: () => Operation, gesture: StripParam | null, direct: () => void): void => {
      if (!scoreHas(arbiter, owner)) {
        direct()
        return
      }
      arbiter.apply(
        op(),
        gesture ? { gesture: `ui:${owner}:${gesture}#${gestures.current[gesture] ?? 0}` } : {},
      )
    }
    const set = (param: StripParam, value: number, direct: () => void): void =>
      via(() => ({ type: 'strip.set', owner, param, value }), param, direct)
    return {
      setLevel: (value, options) => set('level', value, () => strip.setLevel(value, options)),
      setPan: (value, options) => set('pan', value, () => strip.setPan(value, options)),
      setInputGain: (value, options) =>
        set('inputGain', value, () => strip.setInputGain(value, options)),
      setMute: (value, options) =>
        via(
          () => ({ type: 'strip.mute', owner, mute: value }),
          null,
          () => strip.setMute(value, options),
        ),
      toggleMute: () =>
        via(
          () => ({ type: 'strip.mute', owner, mute: !strip.mute }),
          null,
          () => strip.setMute(!strip.mute),
        ),
      setSolo: (value, options) =>
        via(
          () => ({ type: 'strip.solo', owner, solo: value }),
          null,
          () => strip.setSolo(value, options),
        ),
      toggleSolo: () =>
        via(
          () => ({ type: 'strip.solo', owner, solo: !strip.solo }),
          null,
          () => strip.setSolo(!strip.solo),
        ),
      setSoloSafe: (value) =>
        via(
          () => ({ type: 'strip.soloSafe', owner, soloSafe: value }),
          null,
          () => {
            strip.soloSafe = value
          },
        ),
      addInsert: (device) => strip.addInsert(device),
      removeInsert: (device) => strip.removeInsert(device),
      connectTo: (destination) => strip.connectTo(destination),
      touch: (param) => {
        gestures.current[param] = (gestures.current[param] ?? 0) + 1
        if (scoreHas(arbiter, owner)) arbiter.touch(target(param))
      },
      release: (param) => {
        if (!scoreHas(arbiter, owner)) return
        arbiter.release(target(param))
        arbiter.endGesture()
      },
      attributed: scoreHas(arbiter, owner),
    }
  }, [strip, arbiter])

  return { strip, ...snapshot, ...controls }
}

/**
 * Find a track of any kind by name: audio tracks, stretch tracks, then live
 * inputs, instruments, returns, groups. Names are unique per kind, so the
 * first kind that has the name wins.
 */
export function findStripHost(engine: Engine, name: string): StripHost | undefined {
  const lookups: ((engine: Engine, name: string) => StripHost)[] = [
    (e, n) => e.track(n),
    (e, n) => e.stretchTrack(n),
    (e, n) => e.liveInput(n),
    (e, n) => e.instrument(n),
    (e, n) => e.returnTrack(n),
    (e, n) => e.group(n),
  ]
  for (const lookup of lookups) {
    try {
      return lookup(engine, name)
    } catch {
      // Not this kind; try the next.
    }
  }
  return undefined
}

export type UseTrackResult<H extends StripHost = StripHost> = UseStripResult & { track: H }

/**
 * Any track kind (`AudioTrack`, `LiveInputTrack`, `InstrumentTrack`,
 * `ReturnTrack`, `GroupTrack`) with its strip state. Pass the object, or a
 * name to resolve through the provided engine (throws when absent, like
 * `engine.track(name)`).
 */
export function useTrack<H extends StripHost>(track: H): UseTrackResult<H>
export function useTrack(track: string): UseTrackResult
export function useTrack(track: string | StripHost): UseTrackResult {
  const engine = useMaybeEngine()
  const host = useMemo<StripHost>(() => {
    if (typeof track !== 'string') return track
    if (!engine) throw new Error(`live-mix/react: useTrack("${track}") needs a <LiveMixProvider>`)
    const found = findStripHost(engine, track)
    if (!found) throw new Error(`live-mix/react: no track "${track}"`)
    return found
  }, [engine, track])
  const strip = useStrip(host.strip)
  return { ...strip, track: host }
}

export interface GroupControls {
  /** Route a track (or group) into this group. */
  add(member: StripHost): void
  /** Route a member back out — to `destination`, or to wherever the group feeds. */
  remove(member: StripHost, destination?: StripDestination): void
}

export type UseGroupResult = UseStripResult &
  GroupControls & {
    group: GroupTrack
    /** The strips currently routed into the group. */
    members: readonly ChannelStrip[]
  }

/** A group's strip state plus its members; by object or by name. */
export function useGroup(group: string | GroupTrack): UseGroupResult {
  const engine = useMaybeEngine()
  const target = useMemo<GroupTrack>(() => {
    if (typeof group !== 'string') return group
    if (!engine) throw new Error(`live-mix/react: useGroup("${group}") needs a <LiveMixProvider>`)
    return engine.group(group)
  }, [engine, group])
  const strip = useStrip(target.strip)
  const subscribe = useCallback(
    (onChange: () => void) => target.strip.onChange(() => onChange()),
    [target],
  )
  const readMembers = useCallback((): readonly ChannelStrip[] => target.members, [target])
  const members = useExternalSnapshot(subscribe, readMembers)
  const controls = useMemo<GroupControls>(
    () => ({
      add: (member) => target.add(member),
      remove: (member, destination) => target.remove(member, destination),
    }),
    [target],
  )
  return { ...strip, ...controls, group: target, members }
}
