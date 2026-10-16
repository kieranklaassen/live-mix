// The browser's own convolver, which is what the engine convolves with: a ConvolverNode with
// `normalize` off, as src/core/tracks/SpaceRoom.ts sets it. The convolution lesson's lab does the
// same sum with the kit's transform; this is what it is held to, in the reader's own browser.

import { SAMPLE_RATE } from './rate.ts'
import type { Source } from './runner.ts'

function buffer(context: BaseAudioContext, sound: Source): AudioBuffer {
  const made = context.createBuffer(2, sound.left.length, context.sampleRate)
  made.copyToChannel(sound.left as Float32Array<ArrayBuffer>, 0)
  made.copyToChannel(sound.right as Float32Array<ArrayBuffer>, 1)
  return made
}

/**
 * `loop` going round through a ConvolverNode holding `impulse`: `passes` times, the last pass
 * kept. With an impulse no longer than the loop, the second pass is already the steady state.
 */
export async function convolveLoop(loop: Source, impulse: Source, passes = 2): Promise<Source> {
  const frames = loop.left.length
  const context = new OfflineAudioContext(2, frames * passes, SAMPLE_RATE)
  const source = context.createBufferSource()
  source.buffer = buffer(context, loop)
  source.loop = true
  const convolver = context.createConvolver()
  convolver.normalize = false
  convolver.buffer = buffer(context, impulse)
  source.connect(convolver).connect(context.destination)
  source.start()
  const rendered = await context.startRendering()
  const from = frames * (passes - 1)
  return {
    left: rendered.getChannelData(0).slice(from, from + frames),
    right: rendered.getChannelData(1).slice(from, from + frames),
  }
}

/** The level of `a - b` against the level of `b`, in dB, over both channels. */
export function differenceDb(a: Source, b: Source): number {
  let difference = 0
  let reference = 0
  for (const [x, y] of [
    [a.left, b.left],
    [a.right, b.right],
  ] as const) {
    for (let i = 0; i < y.length; i += 1) {
      difference += (x[i]! - y[i]!) ** 2
      reference += y[i]! ** 2
    }
  }
  if (reference <= 0) return difference <= 0 ? -140 : 0
  return Math.max(-140, 10 * Math.log10(Math.max(difference / reference, 1e-14)))
}
