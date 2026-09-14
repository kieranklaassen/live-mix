// Small lookups over the recording mocks for the node-device tests: find the
// GainNode in a set that satisfies a predicate, or fail loudly.

import { MockGainNode, type MockAudioNode, type MockAudioParam } from '../../../../testing'
import { type Device } from '../../Device'

export function gainIn(
  nodes: Iterable<MockAudioNode>,
  predicate: (node: MockGainNode) => boolean = () => true,
): MockGainNode {
  for (const node of nodes) if (node instanceof MockGainNode && predicate(node)) return node
  throw new Error('expected a GainNode matching the predicate')
}

/** A device's own input/output gains, as mocks. */
export function io(device: Device): { input: MockGainNode; output: MockGainNode } {
  return {
    input: device.input as unknown as MockGainNode,
    output: device.output as unknown as MockGainNode,
  }
}

/** The last linear ramp scheduled on a param: `[value, endTime]`. */
export function rampTo(param: MockAudioParam): unknown[] | undefined {
  return param.lastEvent('linearRampToValueAtTime')?.args
}
