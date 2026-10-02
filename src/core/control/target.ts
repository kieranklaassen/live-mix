// What a controller can drive (U36, R15): a strip control, a send level, the
// master fader, one parameter of a device instance, a macro, a transport
// action, or an action of the host's own (a button of its page). Targets are
// plain data keyed by string so a mapping table can be serialised into the
// score and compared without object identity; the `ControlSurface` resolves
// them to live objects at dispatch time.

/** Level/pan/mute/solo/trim of a track, return or group strip, by track name. */
export type StripControl = 'level' | 'pan' | 'mute' | 'solo' | 'inputGain'

export type TransportAction = 'start' | 'stop' | 'pause' | 'toggle'

export type ControlTarget =
  | { kind: 'strip'; track: string; control: StripControl }
  /** A post-fader send from `track` to the return or bus named `send`; needs a `level`. */
  | { kind: 'send'; track: string; send: string }
  | { kind: 'master'; control: 'level' }
  /** A device registered on the surface under an instance id (`registerDevice`), one parameter by name. */
  | { kind: 'device'; device: string; param: string }
  /** A `Macro` registered under a name. */
  | { kind: 'macro'; macro: string }
  | { kind: 'transport'; action: TransportAction }
  /**
   * Something the host does when asked (`registerAction`, or the resolver's
   * `action`): a button of its page, a jump to a marker. It has no value;
   * a press fires it.
   */
  | { kind: 'action'; id: string }

export type ControlTargetKind = ControlTarget['kind']

const STRIP_CONTROLS: readonly StripControl[] = ['level', 'pan', 'mute', 'solo', 'inputGain']
const TRANSPORT_ACTIONS: readonly TransportAction[] = ['start', 'stop', 'pause', 'toggle']

/** Stable identity of a target; two targets with the same key address the same thing. */
export function controlTargetKey(target: ControlTarget): string {
  switch (target.kind) {
    case 'strip':
      return `strip:${target.track}:${target.control}`
    case 'send':
      return `send:${target.track}:${target.send}`
    case 'master':
      return `master:${target.control}`
    case 'device':
      return `device:${target.device}:${target.param}`
    case 'macro':
      return `macro:${target.macro}`
    case 'transport':
      return `transport:${target.action}`
    case 'action':
      return `action:${target.id}`
    default: {
      const exhaustive: never = target
      return exhaustive
    }
  }
}

export function sameControlTarget(a: ControlTarget, b: ControlTarget): boolean {
  return controlTargetKey(a) === controlTargetKey(b)
}

/** Human-readable label for a mapping row. */
export function describeTarget(target: ControlTarget): string {
  switch (target.kind) {
    case 'strip':
      return `${target.track} · ${target.control}`
    case 'send':
      return `${target.track} · send ${target.send}`
    case 'master':
      return `master · ${target.control}`
    case 'device':
      return `${target.device} · ${target.param}`
    case 'macro':
      return `macro · ${target.macro}`
    case 'transport':
      return `transport · ${target.action}`
    case 'action':
      return `action · ${target.id}`
    default: {
      const exhaustive: never = target
      return exhaustive
    }
  }
}

/**
 * Whether the target is on/off rather than continuous. Toggles learned from a
 * button default to `toggle` mode; an absolute controller sets them at ≥ 0.5.
 */
export function isBooleanTarget(target: ControlTarget): boolean {
  switch (target.kind) {
    case 'strip':
      return target.control === 'mute' || target.control === 'solo'
    case 'transport':
    case 'action':
      return true
    case 'send':
    case 'master':
    case 'device':
    case 'macro':
      return false
    default: {
      const exhaustive: never = target
      return exhaustive
    }
  }
}

/** A transport target and a host action have no value: they only fire. */
export function isActionTarget(target: ControlTarget): boolean {
  return target.kind === 'transport' || target.kind === 'action'
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/** Validate an untrusted value (parsed JSON) as a `ControlTarget`; null when malformed. */
export function parseControlTarget(value: unknown): ControlTarget | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  switch (record.kind) {
    case 'strip':
      return isNonEmptyString(record.track) &&
        STRIP_CONTROLS.includes(record.control as StripControl)
        ? { kind: 'strip', track: record.track, control: record.control as StripControl }
        : null
    case 'send':
      return isNonEmptyString(record.track) && isNonEmptyString(record.send)
        ? { kind: 'send', track: record.track, send: record.send }
        : null
    case 'master':
      return record.control === 'level' ? { kind: 'master', control: 'level' } : null
    case 'device':
      return isNonEmptyString(record.device) && isNonEmptyString(record.param)
        ? { kind: 'device', device: record.device, param: record.param }
        : null
    case 'macro':
      return isNonEmptyString(record.macro) ? { kind: 'macro', macro: record.macro } : null
    case 'transport':
      return TRANSPORT_ACTIONS.includes(record.action as TransportAction)
        ? { kind: 'transport', action: record.action as TransportAction }
        : null
    case 'action':
      return isNonEmptyString(record.id) ? { kind: 'action', id: record.id } : null
    default:
      return null
  }
}
