// One tool per score operation (R25): the raw vocabulary, schema-described,
// consent-gated where structural, and passed through the rails before it
// reaches the document — a fader set is range-clamped, slewed and held under
// the loudness ceiling; the voice cannot be hard-muted while speaking; the
// music cannot be muted or removed; device parameters clamp to their
// descriptor range.

import {
  OPERATION_TYPES,
  describeOperation,
  type Operation,
  type OperationType,
} from '../score/operations'
import { MASTER_OWNER, findDevice, findStripHost, type Score } from '../score/schema'
import { operationDescription, operationSchema, toolNameForOperation } from './operationSchemas'
import { type ControllerView, type ToolContext, type ToolPlan, type ToolSpec } from './registry'
import { type ConsentScope } from './types'

const STRUCTURE: ReadonlySet<OperationType> = new Set<OperationType>([
  'score.rename',
  'track.add',
  'track.remove',
  'track.move',
  'group.add',
  'group.remove',
  'group.move',
  'return.add',
  'return.remove',
  'return.move',
  'strip.rename',
  'strip.route',
  'device.add',
  'device.remove',
  'device.move',
  'send.add',
  'send.remove',
  'lane.add',
  'lane.remove',
  'modulator.add',
  'modulator.remove',
  'route.add',
  'route.remove',
])

const ARRANGE: ReadonlySet<OperationType> = new Set<OperationType>([
  'transport.loop',
  'source.add',
  'source.remove',
  'clip.add',
  'clip.remove',
  'clip.move',
  'clip.trim',
  'clip.update',
  'clip.replaceFrom',
  'lane.setBreakpoints',
  'lane.addBreakpoint',
  'lane.removeBreakpoint',
])

/** The consent scope an operation needs; parameter-level operations need none. */
export function consentForOperation(type: OperationType): ConsentScope | undefined {
  if (STRUCTURE.has(type)) return 'structure'
  if (ARRANGE.has(type)) return 'arrange'
  return undefined
}

/** Consent scopes a batch needs: the union over its children. */
export function consentForBatch(ops: readonly Operation[]): ConsentScope[] {
  const scopes = new Set<ConsentScope>()
  const visit = (op: Operation): void => {
    if (op.type === 'batch') {
      op.ops.forEach(visit)
      return
    }
    const scope = consentForOperation(op.type)
    if (scope) scopes.add(scope)
  }
  ops.forEach(visit)
  return [...scopes]
}

function stripValue(score: Score, owner: string, param: 'level' | 'pan' | 'inputGain'): number {
  if (owner === MASTER_OWNER) return param === 'level' ? score.master.level : 0
  const host = findStripHost(score, owner)
  return host ? host.strip[param] : param === 'pan' ? 0 : 1
}

function isRole(view: ControllerView, id: string, role: 'voice' | 'music' | 'ambience'): boolean {
  const owner = view.roles[role]
  return owner !== undefined && owner === id
}

function voiceSoloSafe(view: ControllerView, score: Score): boolean {
  const voice = view.roles.voice
  if (!voice) return true
  return findStripHost(score, voice)?.strip.soloSafe ?? true
}

/**
 * Run the rails over one operation against the current score; returns the
 * operation to apply (possibly clamped) or throws a `RailRejection`.
 */
export function guardOperation(op: Operation, ctx: ToolContext): Operation {
  const { view, notes, atMs, dryRun } = ctx
  const { rails } = view
  const score = view.document?.score
  if (!score) return op
  switch (op.type) {
    case 'strip.set': {
      let value = op.value
      const what = `${op.owner} ${op.param}`
      if (op.param === 'pan') {
        value = rails.clampRange(value, -1, 1, notes, what)
        return value === op.value ? op : { ...op, value }
      }
      value = rails.clampLevel(value, notes, what)
      if (isRole(view, op.owner, 'voice')) rails.guardVoice('level', view.speaking(), value)
      const current = stripValue(score, op.owner, op.param)
      value = rails.slewGain(`strip:${op.owner}:${op.param}`, current, value, atMs, notes, !dryRun)
      value = rails.guardLoudness(current, value, notes, what)
      return value === op.value ? op : { ...op, value }
    }
    case 'strip.mute':
      if (op.mute && isRole(view, op.owner, 'voice')) rails.guardVoice('mute', view.speaking())
      if (op.mute && (isRole(view, op.owner, 'music') || isRole(view, op.owner, 'ambience'))) {
        rails.guardSilence(`muting ${op.owner}`)
      }
      return op
    case 'strip.solo':
      if (
        op.solo &&
        view.roles.voice &&
        !isRole(view, op.owner, 'voice') &&
        !voiceSoloSafe(view, score)
      ) {
        rails.guardVoice('solo-other', view.speaking())
      }
      return op
    case 'track.remove':
    case 'group.remove':
      if (isRole(view, op.id, 'voice')) rails.guardVoice('remove', view.speaking())
      if (isRole(view, op.id, 'music') || isRole(view, op.id, 'ambience')) {
        rails.guardSilence(`removing ${op.id}`)
      }
      return op
    case 'device.setParam': {
      const spec = paramSpec(view, score, op.device, op.param)
      if (!spec) return op
      const value = rails.clampRange(
        op.value,
        spec.min,
        spec.max,
        notes,
        `${op.device}.${op.param}`,
      )
      return value === op.value ? op : { ...op, value }
    }
    case 'device.setParams': {
      let changed = false
      const params: Record<string, number | null> = {}
      for (const [name, value] of Object.entries(op.params)) {
        if (value === null) {
          params[name] = null
          continue
        }
        const spec = paramSpec(view, score, op.device, name)
        const clamped = spec
          ? rails.clampRange(value, spec.min, spec.max, notes, `${op.device}.${name}`)
          : value
        if (clamped !== value) changed = true
        params[name] = clamped
      }
      return changed ? { ...op, params } : op
    }
    case 'batch': {
      const ops = op.ops.map((child) => guardOperation(child, ctx))
      return ops.every((child, index) => child === op.ops[index]) ? op : { ...op, ops }
    }
    default:
      return op
  }
}

function paramSpec(
  view: ControllerView,
  score: Score,
  deviceInstance: string,
  param: string,
): { min: number; max: number } | null {
  const registry = view.engine?.devices
  if (!registry) return null
  const location = findDevice(score, deviceInstance)
  if (!location) return null
  const spec = registry.get(location.device.deviceId)?.params[param]
  return spec ? { min: spec.min, max: spec.max } : null
}

/** Fields of a parameter-level operation worth echoing to the model. */
function echo(op: Operation): Record<string, unknown> {
  switch (op.type) {
    case 'strip.set':
      return { owner: op.owner, param: op.param, value: op.value }
    case 'strip.mute':
      return { owner: op.owner, mute: op.mute }
    case 'strip.solo':
      return { owner: op.owner, solo: op.solo }
    case 'device.setParam':
      return { device: op.device, param: op.param, value: op.value }
    case 'device.setParams':
      return { device: op.device, params: op.params }
    case 'device.bypass':
      return { device: op.device, bypass: op.bypass }
    case 'send.set':
      return { owner: op.owner, target: op.target, level: op.level }
    default:
      return {}
  }
}

function operationTool(type: OperationType): ToolSpec {
  const name = toolNameForOperation(type)
  return {
    definition: {
      name,
      description: operationDescription(type),
      parameters: operationSchema(type),
      category: 'operation',
      consent: consentForOperation(type),
      operation: type,
    },
    available: (view) => view.document !== null,
    plan: (args, ctx): ToolPlan => {
      const op = guardOperation({ type, ...args } as Operation, ctx)
      return {
        operations: [op],
        effects: [],
        result: { operation: type, summary: describeOperation(op), ...echo(op) },
        label: describeOperation(op),
      }
    },
  }
}

/** The 46 operation tools, in vocabulary order. */
export function operationTools(): ToolSpec[] {
  return OPERATION_TYPES.map(operationTool)
}
