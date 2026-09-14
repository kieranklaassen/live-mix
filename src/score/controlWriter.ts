// A `ControlSurface` write hook that turns controller moves into attributed
// score operations through the arbiter (U30): MIDI and OSC then share the
// same author path as the UI and the agent, the log records `controller`
// as the author, and a hand on the UI holds a target against the surface's
// lower-ranked writers exactly as the policy table says. Targets the score
// does not carry (macros, transport, an unregistered device) fall back to
// the surface's direct engine write by returning false.

import { type ControlWrite, type ControlWriteHook } from '../core/control/ControlSurface'
import { type Arbiter, type ArbiterResult } from './Arbiter'
import { CONTROLLER_AUTHOR, type Author } from './log'
import { type Operation } from './operations'
import { MASTER_OWNER, findDevice, findStripHost, type Score } from './schema'

export interface ControlWriterOptions {
  /** Author every controller write is logged under. Default `{ id: 'controller', kind: 'controller' }`. */
  author?: Author
  /** Map a surface device id to the score's device instance id; identity by default. */
  deviceId?: (id: string) => string | undefined
  /** Observe every arbitrated write (activity indicators, tests). */
  onResult?: (write: ControlWrite, result: ArbiterResult) => void
}

/**
 * The score operation a controller write means, or null when the score has
 * no such target (the surface then writes the engine directly).
 */
export function controlWriteToOperation(
  score: Score,
  write: ControlWrite,
  deviceId: (id: string) => string | undefined = (id) => id,
): Operation | null {
  const { target, value } = write
  switch (target.kind) {
    case 'strip': {
      if (!findStripHost(score, target.track)) return null
      const control = target.control
      switch (control) {
        case 'level':
        case 'pan':
        case 'inputGain':
          return { type: 'strip.set', owner: target.track, param: control, value }
        case 'mute':
          return { type: 'strip.mute', owner: target.track, mute: value >= 0.5 }
        case 'solo':
          return { type: 'strip.solo', owner: target.track, solo: value >= 0.5 }
        default: {
          const exhaustive: never = control
          return exhaustive
        }
      }
    }
    case 'send': {
      const host = findStripHost(score, target.track)
      if (!host?.strip.sends.some((send) => send.target === target.send)) return null
      return { type: 'send.set', owner: target.track, target: target.send, level: value }
    }
    case 'master':
      return { type: 'strip.set', owner: MASTER_OWNER, param: 'level', value }
    case 'device': {
      const id = deviceId(target.device)
      if (id === undefined || !findDevice(score, id)) return null
      return { type: 'device.setParam', device: id, param: target.param, value }
    }
    case 'macro':
    case 'transport':
      return null
    default: {
      const exhaustive: never = target
      return exhaustive
    }
  }
}

/** `new ControlSurface({ engine, write: arbitratedControlWriter(arbiter) })`. */
export function arbitratedControlWriter(
  arbiter: Arbiter,
  options: ControlWriterOptions = {},
): ControlWriteHook {
  const author = options.author ?? CONTROLLER_AUTHOR
  const deviceId = options.deviceId ?? ((id: string) => id)
  return (write) => {
    const op = controlWriteToOperation(arbiter.score, write, deviceId)
    if (!op) return false
    const result = arbiter.apply(op, { author, gesture: write.gesture })
    options.onResult?.(write, result)
    return true
  }
}
