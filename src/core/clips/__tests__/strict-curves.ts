// What a browser refuses of `AudioParam.setValueCurveAtTime`, which the
// stand-in AudioParam records without a word (Web Audio, the method's own
// rules): a curve of no length is a RangeError, and a curve laid over another
// is a NotSupportedError. Either, thrown while a voice is being made, stops
// the scheduler's tick. Tests that write equal-power envelopes at their edges
// run under this so that what they record is what a browser would take.

import { vi } from 'vitest'

import { MockAudioParam } from '../../../testing'

/** Makes every stand-in AudioParam strict about curves; returns the way back. */
export function strictCurves(): () => void {
  const spy = vi
    .spyOn(MockAudioParam.prototype, 'setValueCurveAtTime')
    .mockImplementation(function (this: MockAudioParam, ...args: unknown[]) {
      const [, startTime, duration] = args as [unknown, number, number]
      if (!(duration > 0)) {
        throw new RangeError(`setValueCurveAtTime: the duration (${duration}) is not above 0`)
      }
      // Only curves written since the last cancel are still there to lie under this one.
      const cancelled = this.events
        .map((event) => event.method)
        .lastIndexOf('cancelScheduledValues')
      for (const event of this.events.slice(cancelled + 1)) {
        if (event.method !== 'setValueCurveAtTime') continue
        const [, at, length] = event.args as [unknown, number, number]
        if (startTime < at + length && at < startTime + duration) {
          throw new Error('NotSupportedError: setValueCurveAtTime overlaps a curve already written')
        }
      }
      this.events.push({ method: 'setValueCurveAtTime', args })
      return this
    })
  return () => spy.mockRestore()
}
