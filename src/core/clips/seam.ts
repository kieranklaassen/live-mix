// Where a sound can be entered, left or brought round on itself without a
// step. A sound made to loop starts and ends partway through a wave, at the
// same place in it: brought round on itself there is nothing to hear, but
// entered from silence, or left for silence, the first or last frame is a
// step many times the size of any the sound makes by itself, and that is a
// click. A sound that starts on its attack moves at least that fast in its
// first few milliseconds, so its first frame is no step at all.
//
// The measure is the one a listener's ear takes: the size of the jump against
// the largest move from one frame to the next in the few milliseconds beside it.

/** The part of an `AudioBuffer` these read. */
export interface SoundFrames {
  readonly numberOfChannels: number
  readonly length: number
  readonly sampleRate: number
  getChannelData(channel: number): Float32Array
}

/** How much of the sound beside a frame its own movement is taken from. */
export const SEAM_WINDOW_SECONDS = 0.005
/** A jump this many times the sound's own largest move beside it is a step. */
export const SEAM_STEP_RATIO = 2
/** Under this (-60 dB) a jump is not one, whatever is beside it. */
export const SEAM_SILENCE = 0.001

const answers = new WeakMap<SoundFrames, Map<string, boolean>>()

function remembered(frames: SoundFrames, key: string, work: () => boolean): boolean {
  let known = answers.get(frames)
  if (!known) {
    known = new Map()
    answers.set(frames, known)
  }
  let answer = known.get(key)
  if (answer === undefined) {
    answer = work()
    known.set(key, answer)
  }
  return answer
}

/** The largest move from one frame to the next among the frames `from` to `to`. */
function largestMove(data: Float32Array, from: number, to: number): number {
  let largest = 0
  const last = Math.min(to, data.length - 1)
  for (let frame = Math.max(1, from + 1); frame <= last; frame += 1) {
    const move = Math.abs(data[frame] - data[frame - 1])
    if (move > largest) largest = move
  }
  return largest
}

function isStep(jump: number, beside: number): boolean {
  return jump > SEAM_SILENCE && jump > SEAM_STEP_RATIO * beside
}

function windowFrames(frames: SoundFrames): number {
  return Math.max(1, Math.round(SEAM_WINDOW_SECONDS * frames.sampleRate))
}

function clampFrame(frames: SoundFrames, frame: number): number {
  return Math.min(Math.max(0, Math.round(frame)), frames.length - 1)
}

/**
 * Whether coming in from silence on `frame` is a step: on any channel the
 * frame stands further from zero than the sound moves in the milliseconds
 * after it.
 */
export function entersOnStep(frames: SoundFrames, frame: number): boolean {
  if (frames.length < 2) return false
  const at = clampFrame(frames, frame)
  return remembered(frames, `in:${at}`, () => {
    const reach = windowFrames(frames)
    for (let channel = 0; channel < frames.numberOfChannels; channel += 1) {
      const data = frames.getChannelData(channel)
      if (isStep(Math.abs(data[at]), largestMove(data, at, at + reach))) return true
    }
    return false
  })
}

/**
 * Whether going to silence after `frame`, the last one played, is a step: on
 * any channel the frame stands further from zero than the sound moved in the
 * milliseconds before it.
 */
export function leavesOnStep(frames: SoundFrames, frame: number): boolean {
  if (frames.length < 2) return false
  const at = clampFrame(frames, frame)
  return remembered(frames, `out:${at}`, () => {
    const reach = windowFrames(frames)
    for (let channel = 0; channel < frames.numberOfChannels; channel += 1) {
      const data = frames.getChannelData(channel)
      if (isStep(Math.abs(data[at]), largestMove(data, at - reach, at))) return true
    }
    return false
  })
}

/**
 * Whether the frames from `start` up to `end` come round on themselves: on
 * every channel the jump from the last of them back to the first is no larger
 * than the sound's own moves beside the two. True of a sound made to loop,
 * and of one that starts and ends in silence.
 */
export function comesRound(frames: SoundFrames, start: number, end: number): boolean {
  if (frames.length < 2) return false
  const first = clampFrame(frames, start)
  const last = clampFrame(frames, end - 1)
  if (last <= first) return false
  return remembered(frames, `round:${first}:${last}`, () => {
    const reach = windowFrames(frames)
    for (let channel = 0; channel < frames.numberOfChannels; channel += 1) {
      const data = frames.getChannelData(channel)
      const beside = Math.max(
        largestMove(data, first, first + reach),
        largestMove(data, last - reach, last),
      )
      if (isStep(Math.abs(data[first] - data[last]), beside)) return false
    }
    return true
  })
}
