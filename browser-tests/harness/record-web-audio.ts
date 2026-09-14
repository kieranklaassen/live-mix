// Records what the real Web Audio graph is told, in the shape of the mocks'
// `ScheduleSnapshot` (`./testing`): every `AudioBufferSourceNode.start/stop`
// and every AudioParam automation call on gains, panners, sources, filters
// and delays, numbered in creation order per node kind. Installed before the
// engine builds its graph; read after the render.

import type { ScheduleSnapshot } from '../../src/testing/mock-offline-context'

type ParamOwner = { kind: string; index: number; name: string }

interface Recorded {
  method: string
  args: unknown[]
}

const PARAM_METHODS = [
  'setValueAtTime',
  'linearRampToValueAtTime',
  'exponentialRampToValueAtTime',
  'setValueCurveAtTime',
  'setTargetAtTime',
  'cancelScheduledValues',
  'cancelAndHoldAtTime',
] as const

export interface WebAudioRecorder {
  snapshot(): ScheduleSnapshot
  reset(): void
  uninstall(): void
}

/** Wrap the real prototypes; returns the recorder. Idempotent per page. */
export function installWebAudioRecorder(): WebAudioRecorder {
  const owners = new WeakMap<AudioParam, ParamOwner>()
  const paramEvents = new Map<AudioParam, Recorded[]>()
  const counters = new Map<string, number>()
  const params: AudioParam[] = []
  const sources: { node: AudioBufferSourceNode; start: unknown[][]; stop: unknown[][] }[] = []

  const claim = (kind: string): number => {
    const index = counters.get(kind) ?? 0
    counters.set(kind, index + 1)
    return index
  }
  const adopt = (param: AudioParam, kind: string, index: number, name: string): void => {
    owners.set(param, { kind, index, name })
    paramEvents.set(param, [])
    params.push(param)
  }

  const proto = BaseAudioContext.prototype
  const originals = {
    createGain: proto.createGain,
    createStereoPanner: proto.createStereoPanner,
    createBufferSource: proto.createBufferSource,
    createBiquadFilter: proto.createBiquadFilter,
    createDelay: proto.createDelay,
  }
  proto.createGain = function createGain(this: BaseAudioContext) {
    const node = originals.createGain.call(this)
    adopt(node.gain, 'gain', claim('gain'), 'gain')
    return node
  }
  proto.createStereoPanner = function createStereoPanner(this: BaseAudioContext) {
    const node = originals.createStereoPanner.call(this)
    adopt(node.pan, 'panner', claim('panner'), 'pan')
    return node
  }
  proto.createBufferSource = function createBufferSource(this: BaseAudioContext) {
    const node = originals.createBufferSource.call(this)
    const index = claim('source')
    adopt(node.playbackRate, 'source', index, 'playbackRate')
    adopt(node.detune, 'source', index, 'detune')
    sources.push({ node, start: [], stop: [] })
    return node
  }
  proto.createBiquadFilter = function createBiquadFilter(this: BaseAudioContext) {
    const node = originals.createBiquadFilter.call(this)
    const index = claim('filter')
    adopt(node.frequency, 'filter', index, 'frequency')
    adopt(node.Q, 'filter', index, 'Q')
    adopt(node.gain, 'filter', index, 'gain')
    return node
  }
  proto.createDelay = function createDelay(this: BaseAudioContext, maxDelayTime?: number) {
    const node =
      maxDelayTime === undefined
        ? originals.createDelay.call(this)
        : originals.createDelay.call(this, maxDelayTime)
    adopt(node.delayTime, 'delay', claim('delay'), 'delayTime')
    return node
  }

  const sourceProto = AudioBufferSourceNode.prototype
  const originalStart = sourceProto.start
  const originalStop = sourceProto.stop
  sourceProto.start = function start(this: AudioBufferSourceNode, ...args: number[]) {
    sources.find((entry) => entry.node === this)?.start.push([...args])
    return originalStart.apply(this, args as [number?, number?, number?])
  }
  sourceProto.stop = function stop(this: AudioBufferSourceNode, ...args: number[]) {
    sources.find((entry) => entry.node === this)?.stop.push([...args])
    return originalStop.apply(this, args as [number?])
  }

  const paramProto = AudioParam.prototype as unknown as Record<
    string,
    (...args: unknown[]) => unknown
  >
  const originalParamMethods = new Map<string, (...args: unknown[]) => unknown>()
  for (const method of PARAM_METHODS) {
    const original = paramProto[method]
    if (typeof original !== 'function') continue
    originalParamMethods.set(method, original)
    paramProto[method] = function recorded(this: AudioParam, ...args: unknown[]) {
      const events = paramEvents.get(this)
      if (events) {
        events.push({
          method,
          args: args.map((arg) => (arg instanceof Float32Array ? Array.from(arg) : arg)),
        })
      }
      return original.apply(this, args)
    }
  }

  return {
    snapshot(): ScheduleSnapshot {
      const byNode: ScheduleSnapshot['params'] = []
      for (const param of params) {
        const owner = owners.get(param)
        const events = paramEvents.get(param)
        if (!owner || !events || events.length === 0) continue
        byNode.push({
          node: `${owner.kind}#${owner.index}`,
          param: owner.name,
          events: events.map((event) => ({ method: event.method, args: event.args })),
        })
      }
      return {
        sources: sources.map((entry) => ({
          start: entry.start,
          stop: entry.stop,
          loop: entry.node.loop,
          bufferLength: entry.node.buffer?.length ?? null,
        })),
        params: byNode,
      }
    },
    reset(): void {
      counters.clear()
      params.length = 0
      sources.length = 0
    },
    uninstall(): void {
      Object.assign(proto, originals)
      sourceProto.start = originalStart
      sourceProto.stop = originalStop
      for (const [method, original] of originalParamMethods) paramProto[method] = original
    },
  }
}
