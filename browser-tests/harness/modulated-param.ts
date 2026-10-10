// The page side of the check that a device moves its own parameter on the
// audio thread. A tone goes through the saturator on a real
// OfflineAudioContext with its output level told to swing 12 dB each way once
// a second; the same render with the level left alone is the yardstick. An
// offline render has no clock for a page to send values on: the swing can
// only be there, and there from the first block, if the worklet works it out.

import { createSaturator } from '@kieranklaassen/live-mix/dsp'
import type { ParamModulation } from '@kieranklaassen/live-mix'

const RATE = 48000
const RENDER_SEC = 2
/** Each level is of a window this long. */
export const MODULATED_WINDOW_SEC = 0.025

export interface ModulatedMeasure {
  /** Level of each window of the swung render over the still one, in dB. */
  swingDb: number[]
  /** The largest difference between two renders of the same swing. */
  rerunDifference: number
  /** The largest step between two samples of the swung render, over the largest of the still one. */
  stepRatio: number
}

async function render(modulation: ParamModulation | null): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(2, RATE * RENDER_SEC, RATE)
  const tone = new OscillatorNode(ctx, { frequency: 440 })
  const level = new GainNode(ctx, { gain: 0.1 })
  // Made with it: a message sent now may reach the worklet after the render is over.
  const device = await createSaturator(ctx, {
    params: { driveDb: 0, mix: 1, outputDb: 0 },
    ...(modulation ? { modulations: { outputDb: modulation } } : {}),
  })
  tone.connect(level).connect(device.input)
  device.output.connect(ctx.destination)
  tone.start(0)
  const audio = await ctx.startRendering()
  device.dispose()
  return audio.getChannelData(0).slice()
}

function windowsDb(samples: Float32Array): number[] {
  const size = Math.round(MODULATED_WINDOW_SEC * RATE)
  const levels: number[] = []
  for (let from = 0; from + size <= samples.length; from += size) {
    let sum = 0
    for (let i = from; i < from + size; i += 1) sum += samples[i] * samples[i]
    levels.push(10 * Math.log10(sum / size + 1e-20))
  }
  return levels
}

function largestStep(samples: Float32Array): number {
  let step = 0
  for (let i = 1; i < samples.length; i += 1) {
    step = Math.max(step, Math.abs(samples[i] - samples[i - 1]))
  }
  return step
}

export async function measureModulated(modulation: ParamModulation): Promise<ModulatedMeasure> {
  const still = await render(null)
  const swung = await render(modulation)
  const again = await render(modulation)
  let rerunDifference = 0
  for (let i = 0; i < swung.length; i += 1) {
    rerunDifference = Math.max(rerunDifference, Math.abs(swung[i] - again[i]))
  }
  const stillDb = windowsDb(still)
  return {
    swingDb: windowsDb(swung).map((db, index) => db - stillDb[index]),
    rerunDifference,
    stepRatio: largestStep(swung) / largestStep(still),
  }
}
