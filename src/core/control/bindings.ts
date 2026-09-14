// Resolving a `ControlTarget` to the live object behind it and moving values
// through the same ramped setters the React hooks use: `ChannelStrip.setLevel`
// / `setPan` / `setMute` / `setSolo`, `Bus.setLevel`, `Device.setParam` (the
// host ramps), `Macro.set`, `Transport` actions. A binding reads and writes
// normalised 0..1 positions; the taper of a device parameter and the fader
// span of a strip are folded here so the mapping table never sees units.

import { LEVEL_RAMP_SECONDS, type Bus } from '../buses/Bus'
import { type Macro } from '../automation/Modulator'
import { type Device } from '../devices/Device'
import { type Engine } from '../Engine'
import { denormalizeParam, normalizeParam } from '../params'
import { type ChannelStrip, type StripHost } from '../tracks/ChannelStrip'
import { type Send } from '../tracks/Send'
import { type Transport } from '../transport/Transport'
import { type ControlTarget } from './target'

/** Fader span shared by every level control (unity = 1); ambient-live's `STRIP_LEVEL_MAX`. */
export const DEFAULT_LEVEL_MAX = 1.5

/** How the surface finds the objects behind targets; every lookup may return undefined. */
export interface ControlResolver {
  strip(track: string): ChannelStrip | undefined
  send(track: string, send: string): Send | undefined
  master(): Bus | undefined
  device(id: string): Device | undefined
  macro(name: string): Macro | undefined
  transport(): Transport | undefined
}

/** A resolved target: read its normalised position, write one, or fire it. */
export interface ControlBinding {
  /** 0..1 (0/1 for on/off), or null for an action target. */
  read(): number | null
  /** Ramped by the object itself. No-op on an action target. */
  write(unit: number): void
  /** Action targets only. */
  fire(): void
}

/**
 * Find a track of any kind by name — audio tracks, then stretch tracks, live
 * inputs, instruments, returns, groups. Names are unique per kind, so the
 * first kind that has the name wins (the same order `useTrack` resolves).
 */
export function resolveStripHost(engine: Engine, name: string): StripHost | undefined {
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

function sendName(send: Send): string {
  return send.target.name
}

/** A resolver over an engine: strips and sends by track name, the master and the transport. */
export function engineResolver(
  engine: Engine,
): Pick<ControlResolver, 'strip' | 'send' | 'master' | 'transport'> {
  return {
    strip: (track) => resolveStripHost(engine, track)?.strip,
    send: (track, send) =>
      resolveStripHost(engine, track)
        ?.strip.sends.all()
        .find((candidate) => sendName(candidate) === send),
    master: () => engine.master,
    transport: () => engine.transport,
  }
}

export interface BindingOptions {
  /** Span of every level control: 0..levelMax. */
  levelMax: number
  /** Audio clock for the send ramp. */
  now: () => number
  /** Last positions this surface wrote where the object keeps none (sends, master). */
  remembered: Map<string, number>
  /** Key of the target in `remembered`. */
  key: string
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function stripBinding(
  strip: ChannelStrip,
  control: ControlTarget & { kind: 'strip' },
  options: BindingOptions,
): ControlBinding {
  const { levelMax } = options
  switch (control.control) {
    case 'level':
      return {
        read: () => clampUnit(strip.level / levelMax),
        write: (unit) => strip.setLevel(clampUnit(unit) * levelMax),
        fire: () => {},
      }
    case 'inputGain':
      return {
        read: () => clampUnit(strip.inputGain / levelMax),
        write: (unit) => strip.setInputGain(clampUnit(unit) * levelMax),
        fire: () => {},
      }
    case 'pan':
      return {
        read: () => clampUnit((strip.pan + 1) / 2),
        write: (unit) => strip.setPan(clampUnit(unit) * 2 - 1),
        fire: () => {},
      }
    case 'mute':
      return {
        read: () => (strip.mute ? 1 : 0),
        write: (unit) => strip.setMute(unit >= 0.5),
        fire: () => {},
      }
    case 'solo':
      return {
        read: () => (strip.solo ? 1 : 0),
        write: (unit) => strip.setSolo(unit >= 0.5),
        fire: () => {},
      }
    default: {
      const exhaustive: never = control.control
      return exhaustive
    }
  }
}

function sendBinding(send: Send, options: BindingOptions): ControlBinding | null {
  const gainNode = send.gainNode
  if (!gainNode) return null
  return {
    read: () => options.remembered.get(options.key) ?? clampUnit(gainNode.gain.value),
    write: (unit) => {
      const value = clampUnit(unit)
      options.remembered.set(options.key, value)
      gainNode.gain.setTargetAtTime(value, options.now(), LEVEL_RAMP_SECONDS)
    },
    fire: () => {},
  }
}

function masterBinding(master: Bus, options: BindingOptions): ControlBinding {
  const { levelMax } = options
  return {
    read: () => options.remembered.get(options.key) ?? clampUnit(master.gain.value / levelMax),
    write: (unit) => {
      const value = clampUnit(unit)
      options.remembered.set(options.key, value)
      master.setLevel(value * levelMax, { at: options.now() })
    },
    fire: () => {},
  }
}

function deviceBinding(device: Device, param: string): ControlBinding | null {
  const spec = device.params[param]
  if (!spec) return null
  return {
    read: () => normalizeParam(spec, device.getParam(param)),
    write: (unit) => device.setParam(param, denormalizeParam(spec, unit)),
    fire: () => {},
  }
}

function macroBinding(macro: Macro): ControlBinding {
  return {
    read: () => macro.value,
    write: (unit) => macro.set(unit),
    fire: () => {},
  }
}

function transportBinding(
  transport: Transport,
  action: (ControlTarget & { kind: 'transport' })['action'],
): ControlBinding {
  const fire = (): void => {
    switch (action) {
      case 'start':
        transport.start()
        return
      case 'stop':
        transport.stop()
        return
      case 'pause':
        transport.pause()
        return
      case 'toggle':
        if (transport.state === 'playing') transport.pause()
        else transport.start()
        return
      default: {
        const exhaustive: never = action
        return exhaustive
      }
    }
  }
  return { read: () => null, write: () => {}, fire }
}

/** The binding for a target, or null when nothing answers to it right now. */
export function resolveBinding(
  target: ControlTarget,
  resolver: ControlResolver,
  options: BindingOptions,
): ControlBinding | null {
  switch (target.kind) {
    case 'strip': {
      const strip = resolver.strip(target.track)
      return strip ? stripBinding(strip, target, options) : null
    }
    case 'send': {
      const send = resolver.send(target.track, target.send)
      return send ? sendBinding(send, options) : null
    }
    case 'master': {
      const master = resolver.master()
      return master ? masterBinding(master, options) : null
    }
    case 'device': {
      const device = resolver.device(target.device)
      return device ? deviceBinding(device, target.param) : null
    }
    case 'macro': {
      const macro = resolver.macro(target.macro)
      return macro ? macroBinding(macro) : null
    }
    case 'transport': {
      const transport = resolver.transport()
      return transport ? transportBinding(transport, target.action) : null
    }
    default: {
      const exhaustive: never = target
      return exhaustive
    }
  }
}
