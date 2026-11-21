// For the tests that hold a render against an engine that plays the same
// build or the same score. The two are told the same thing but for where the
// strips start.

import { type ScheduleSnapshot } from '../../../testing'

/**
 * What a playing engine was told, as a render is told it: a value that a
 * strip or a bus approaches from time 0 over its 5 ms when it plays is
 * written for the first sample of a render. `written` lists the values that
 * were, in the snapshot's order.
 */
export function startingWhereSet(params: ScheduleSnapshot['params']): {
  params: ScheduleSnapshot['params']
  written: unknown[]
} {
  const written: unknown[] = []
  const started = params.map((entry) => ({
    ...entry,
    events: entry.events.map((event) => {
      const [value, at, timeConstant] = event.args
      if (event.method !== 'setTargetAtTime' || at !== 0 || timeConstant !== 0.005) return event
      written.push(value)
      return { method: 'setValueAtTime', args: [value, 0] }
    }),
  }))
  return { params: started, written }
}
