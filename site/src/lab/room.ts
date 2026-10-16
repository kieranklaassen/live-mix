// The engine's room, for the lab that convolves with it (lesson 15).
//
// The engine's convolution reverb is TypeScript: `spaceImpulseChannel` in
// src/core/tracks/space.ts writes a room's impulse response, and the browser's ConvolverNode
// convolves with it. A lab is C++, so the page runs the engine's own function here, at this
// commit, and hands what it makes to the lab as its second signal (LAB_AUX in site/labs/lab.h).
// The lab declares the room's controls like any others; this file reads their values.

import { spaceImpulseChannel, type SpaceOptions } from '../../../src/core/tracks/space.ts'
import { SAMPLE_RATE, type Lab, type Source } from './runner.ts'

/** The lab's control ids, as the engine's options. Times the lab shows in milliseconds are seconds there. */
export function roomOptions(values: Record<string, number>): SpaceOptions {
  const ms = (id: string) => (values[id] === undefined ? undefined : values[id] / 1000)
  return {
    decaySec: values.decay,
    predelaySec: ms('predelay'),
    attackSec: ms('swell'),
    brightHz: values.bright,
    darkHz: values.dark,
    grain: values.grain,
  }
}

let last: { key: string; impulse: Source } | undefined

/** The room's impulse response at the lab's rate, left and right. The same values give the same samples. */
export function roomImpulse(values: Record<string, number>): Source {
  const options = roomOptions(values)
  const key = JSON.stringify(options)
  if (last?.key !== key) {
    last = {
      key,
      impulse: {
        left: spaceImpulseChannel(SAMPLE_RATE, options, 0),
        right: spaceImpulseChannel(SAMPLE_RATE, options, 1),
      },
    }
  }
  return last.impulse
}

/** A lab that takes the room as its second signal, rendered with the room its controls ask for. */
export function withRoom(lab: Lab): Lab {
  if (!lab.takesAux) return lab
  const initial = Object.fromEntries(
    lab.description.controls.map((control) => [control.id, control.initial]),
  )
  return {
    ...lab,
    render: (source, values, frames) =>
      lab.render(source, values, frames, roomImpulse({ ...initial, ...values })),
  }
}
