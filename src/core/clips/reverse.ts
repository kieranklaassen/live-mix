// A clip that plays backwards. A buffer source cannot run at a negative rate,
// so a reversed clip reads a mirrored copy of its source forwards
// (`tracks/reversed-buffer.ts`): second `t` of the copy is second
// `duration - t` of the source.
//
// What plays is the clip's own slice, turned round: the part of the source a
// forward clip would play in one pass, read from its far end back to where
// the forward clip enters. A looping clip cycles backwards over the same
// region. `mirrorSlice` is that mapping as plain numbers, so a drawing can
// use the formula the audio does.

import { type Clip } from './Clip'

type Slice = Pick<Clip, 'offsetSec' | 'durationSec' | 'loop' | 'loopStartSec' | 'loopEndSec'>

/** Where a reversed clip reads the mirrored copy of its source. */
export interface MirroredSlice {
  /** Seconds into the mirrored copy where playback enters. */
  offsetSec: number
  /**
   * How long the copy may sound, for a clip that does not loop: the length of
   * the slice, so a clip that outlives its source goes quiet where the slice
   * runs out instead of reading on into what lies before `offsetSec`.
   */
  soundSec?: number
  /** The loop region on the copy, for a clip that loops. */
  loopStartSec?: number
  loopEndSec?: number
}

/** The slice a clip plays, as positions on the mirrored copy of a source `sourceDurationSec` long. */
export function mirrorSlice(clip: Slice, sourceDurationSec: number): MirroredSlice {
  const length = Math.max(0, sourceDurationSec)
  if (clip.loop) {
    const regionStart = Math.min(length, Math.max(0, clip.loopStartSec ?? clip.offsetSec))
    const regionEnd = Math.min(length, Math.max(regionStart, clip.loopEndSec ?? length))
    const into = Math.min(regionEnd - regionStart, Math.max(0, clip.offsetSec - regionStart))
    return {
      offsetSec: length - regionEnd + into,
      loopStartSec: length - regionEnd,
      loopEndSec: length - regionStart,
    }
  }
  const start = Math.min(length, Math.max(0, clip.offsetSec))
  const end = Math.min(length, start + Math.max(0, clip.durationSec))
  return { offsetSec: length - end, soundSec: end - start }
}

/**
 * The source second a reversed clip reads `intoSec` seconds after it starts,
 * or null once a clip that does not loop has run out of slice.
 */
export function reversedSourceSec(
  clip: Slice,
  sourceDurationSec: number,
  intoSec: number,
): number | null {
  const mirrored = mirrorSlice(clip, sourceDurationSec)
  const length = Math.max(0, sourceDurationSec)
  const into = Math.max(0, intoSec)
  if (mirrored.soundSec !== undefined) {
    return into < mirrored.soundSec ? length - (mirrored.offsetSec + into) : null
  }
  const regionStart = mirrored.loopStartSec ?? 0
  const region = (mirrored.loopEndSec ?? length) - regionStart
  if (region <= 0) return null
  const position = regionStart + ((mirrored.offsetSec - regionStart + into) % region)
  return length - position
}
